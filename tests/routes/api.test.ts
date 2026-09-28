import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { createApp } from '../../server/app.js';
import { initDatabase } from '../../server/db/database.js';

describe('REST API Routes', () => {
  const testDbDir = path.resolve('data/test_api');
  const testDbPath = path.join(testDbDir, 'test_api.db');
  let db: any;
  let app: any;
  const rawPassword = 'safe-password-123';
  const sessionSecret = 'test_session_secret_32_characters_long_now_12345';

  beforeEach(() => {
    if (fs.existsSync(testDbDir)) {
      fs.rmSync(testDbDir, { recursive: true, force: true });
    }
    process.env.APP_PASSWORD_HASH = bcrypt.hashSync(rawPassword, 10);
    process.env.SESSION_SECRET = sessionSecret;
    process.env.DATA_DIR = testDbDir;

    db = initDatabase(testDbPath);
    app = createApp(db);
  });

  afterEach(() => {
    db.close();
    if (fs.existsSync(testDbDir)) {
      fs.rmSync(testDbDir, { recursive: true, force: true });
    }
  });

  it('handles login, versioned CRUD, and backup generation / download', async () => {
    const agent = request.agent(app);

    // 1. Login
    const loginRes = await agent.post('/api/auth/login').send({ password: rawPassword });
    expect(loginRes.status).toBe(200);

    // 2. Create Application
    const createRes = await agent.post('/api/applications').send({
      company_name: 'Stripe',
      position_title: 'Software Engineer',
      status: 'applied',
      job_url: 'https://stripe.com/jobs/1?utm_source=twitter'
    });
    expect(createRes.status).toBe(201);
    expect(createRes.body.version).toBe(1);

    const appId = createRes.body.id;
    const initialVersion = createRes.body.version;

    // 3. Update with matching version
    const updateRes = await agent.patch(`/api/applications/${appId}`).send({
      notes: 'Initial interview scheduled',
      version: initialVersion
    });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.version).toBe(2);

    // 4. Update with stale version triggers 409 Conflict
    const staleRes = await agent.patch(`/api/applications/${appId}`).send({
      notes: 'Conflict overwrite',
      version: initialVersion
    });
    expect(staleRes.status).toBe(409);
    expect(staleRes.body.error).toBe('conflict');

    // 5. Generate backup via POST
    const backupRes = await agent.post('/api/admin/backup');
    expect(backupRes.status).toBe(200);
    const filename = backupRes.body.backup_file;
    expect(filename).toBeDefined();

    // 6. Download backup via GET /api/admin/backup/:filename
    const dlRes = await agent.get(`/api/admin/backup/${filename}`);
    expect(dlRes.status).toBe(200);
  });
});
