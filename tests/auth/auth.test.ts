import { describe, it, expect, beforeEach } from 'vitest';
import express from 'express';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import {
  assertAuthConfig,
  getSessionSecret,
  verifyPassword,
  createSessionCookie,
  clearSessionCookie,
  isSessionValid,
  requireAuthMiddleware
} from '../../server/auth/auth.js';
import { loginRateLimiter } from '../../server/middleware/rateLimit.js';

describe('Single-User Authentication System', () => {
  const rawPassword = 'my-secure-password-123';
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(rawPassword, salt);
  const sessionSecret = 'test_session_secret_32_characters_long_now_12345';

  beforeEach(() => {
    process.env.APP_PASSWORD_HASH = hash;
    process.env.SESSION_SECRET = sessionSecret;
  });

  it('fails assertAuthConfig when SESSION_SECRET < 32 chars or hash is truncated', () => {
    process.env.SESSION_SECRET = 'short';
    expect(() => assertAuthConfig()).toThrow(/SESSION_SECRET wajib diisi dan minimal 32 karakter/);

    process.env.SESSION_SECRET = sessionSecret;
    process.env.APP_PASSWORD_HASH = 'truncated_hash';
    expect(() => assertAuthConfig()).toThrow(/APP_PASSWORD_HASH bukan hash bcrypt utuh/);
  });

  it('correctly verifies raw password', () => {
    expect(verifyPassword(rawPassword)).toBe(true);
    expect(verifyPassword('wrong-password')).toBe(false);
  });

  it('validates session timestamp age on server-side (< 7 days)', () => {
    const now = Date.now();
    expect(isSessionValid(String(now))).toBe(true);

    const eightDaysAgo = now - (8 * 24 * 60 * 60 * 1000);
    expect(isSessionValid(String(eightDaysAgo))).toBe(false);

    expect(isSessionValid('not_a_number')).toBe(false);
  });

  it('protects routes with requireAuthMiddleware and clears cookie on logout', async () => {
    const app = express();
    app.use(cookieParser(getSessionSecret()));
    app.post('/api/auth/login', (req, res) => {
      createSessionCookie(res);
      res.json({ ok: true });
    });
    app.post('/api/auth/logout', (req, res) => {
      clearSessionCookie(res);
      res.json({ ok: true });
    });
    app.get('/api/protected', requireAuthMiddleware, (req, res) => {
      res.json({ ok: true });
    });

    const agent = request.agent(app);
    const unauthorized = await agent.get('/api/protected');
    expect(unauthorized.status).toBe(401);

    await agent.post('/api/auth/login');
    const authorized = await agent.get('/api/protected');
    expect(authorized.status).toBe(200);

    await agent.post('/api/auth/logout');
    const afterLogout = await agent.get('/api/protected');
    expect(afterLogout.status).toBe(401);
  });

  it('rate limits login only on failed attempts (skipSuccessfulRequests)', async () => {
    const app = express();
    app.set('trust proxy', 1);
    app.use(express.json());
    app.post('/api/auth/login', loginRateLimiter, (req, res) => {
      if (req.body.password === 'pass') {
        res.status(200).json({ ok: true });
      } else {
        res.status(401).json({ error: 'invalid_credentials' });
      }
    });

    for (let i = 0; i < 8; i++) {
      const okRes = await request(app).post('/api/auth/login').send({ password: 'pass' });
      expect(okRes.status).toBe(200);
    }

    for (let i = 0; i < 5; i++) {
      const failRes = await request(app).post('/api/auth/login').send({ password: 'bad' });
      expect(failRes.status).toBe(401);
    }

    const blockedRes = await request(app).post('/api/auth/login').send({ password: 'bad' });
    expect(blockedRes.status).toBe(429);
    expect(blockedRes.body.error).toBe('too_many_requests');
  });
});
