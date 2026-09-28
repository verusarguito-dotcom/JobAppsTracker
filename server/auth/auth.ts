import bcrypt from 'bcryptjs';
import type { Request, Response, NextFunction } from 'express';

export const COOKIE_NAME = 'tracker_session';
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET wajib diisi dan minimal 32 karakter.');
  }
  return secret;
}

export function assertAuthConfig(): void {
  getSessionSecret();
  const hash = process.env.APP_PASSWORD_HASH;
  if (!hash || !/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(hash)) {
    throw new Error('APP_PASSWORD_HASH bukan hash bcrypt utuh (60 karakter). Periksa escape karakter $.');
  }
}

export function verifyPassword(password: string): boolean {
  const hash = process.env.APP_PASSWORD_HASH;
  if (!hash || !password) {
    return false;
  }
  return bcrypt.compareSync(password, hash);
}

export function createSessionCookie(res: Response): void {
  const isSecure = process.env.NODE_ENV === 'production';
  res.cookie(COOKIE_NAME, String(Date.now()), {
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecure,
    signed: true,
    maxAge: SESSION_MAX_AGE_MS,
    path: '/',
  });
}

export function clearSessionCookie(res: Response): void {
  const isSecure = process.env.NODE_ENV === 'production';
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecure,
    path: '/',
  });
}

export function isSessionValid(raw: unknown): boolean {
  if (typeof raw !== 'string') return false;
  const issuedAt = Number(raw);
  if (!Number.isFinite(issuedAt)) return false;
  const age = Date.now() - issuedAt;
  return age > -60_000 && age < SESSION_MAX_AGE_MS;
}

export function requireAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!isSessionValid(req.signedCookies?.[COOKIE_NAME])) {
    res.status(401).json({ error: 'unauthorized', message: 'Sesi tidak valid atau telah berakhir.' });
    return;
  }
  next();
}
