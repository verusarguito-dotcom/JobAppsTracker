import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { createApp } from '../../server/app.js';
import { initDatabase } from '../../server/db/database.js';
import { getTodayWIB } from '../../server/utils/date.js';

describe('Export & Import CSV Engine and Workflow Auto-fill', () => {
  const testDbDir = path.resolve('data/test_export_import');
  const testDbPath = path.join(testDbDir, 'test_export_import.db');
  let db: any;
  let app: any;
  let agent: any;
  const rawPassword = 'secret-password-123';
  const sessionSecret = 'test_session_secret_32_characters_long_now_12345';

  beforeAll(async () => {
    if (fs.existsSync(testDbDir)) {
      try {
        fs.rmSync(testDbDir, { recursive: true, force: true });
      } catch {}
    }
    process.env.APP_PASSWORD_HASH = bcrypt.hashSync(rawPassword, 10);
    process.env.SESSION_SECRET = sessionSecret;
    process.env.DATA_DIR = testDbDir;

    db = initDatabase(testDbPath);
    app = createApp(db);
  });

  beforeEach(async () => {
    db.exec('DELETE FROM application_logs; DELETE FROM applications;');
    agent = request.agent(app);
    // Login for protected routes
    await agent.post('/api/auth/login').send({ password: rawPassword });
  });

  afterAll(() => {
    try {
      db.close();
    } catch {}
    if (fs.existsSync(testDbDir)) {
      try {
        fs.rmSync(testDbDir, { recursive: true, force: true });
      } catch {}
    }
  });

  it('rejects unauthenticated requests to export and import endpoints', async () => {
    const unauthed = request(app);

    const expRes = await unauthed.get('/api/export/csv');
    expect(expRes.status).toBe(401);

    const impRes = await unauthed.post('/api/import/csv').send('company_name,position_title\nAcme,Dev');
    expect(impRes.status).toBe(401);
  });

  it('exports applications with RFC 4180 format, UTF-8 BOM, ISO dates, and pure numeric salaries', async () => {
    // Seed test data with tricky quotes, newlines, and commas
    await agent.post('/api/applications').send({
      company_name: 'Tech "Global", Inc.',
      position_title: 'Senior Engineer',
      status: 'interview',
      salary_min: 15000000,
      salary_max: 25000000,
      currency: 'IDR',
      job_url: 'https://techglobal.com/jobs/1?ref=test',
      notes: 'Line 1\nLine 2, with comma and "quotes"',
      applied_date: '2026-09-01',
      follow_up_date: '2026-09-10',
    });

    const res = await agent.get('/api/export/csv');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.headers['content-disposition']).toContain('attachment; filename="jobflow-applications-');

    const csvText = res.text;
    // Verify UTF-8 BOM is present at the beginning
    expect(csvText.charCodeAt(0)).toBe(0xFEFF);

    // Verify content without BOM
    const content = csvText.slice(1);
    const lines = content.split('\r\n');
    expect(lines[0]).toBe(
      'company_name,position_title,status,job_type,location,salary_min,salary_max,currency,job_url,source,deadline_date,applied_date,follow_up_date,recruiter_name,recruiter_contact,cv_version,notes,created_at,updated_at',
    );

    // Tricky string escaping check
    expect(content).toContain('"Tech ""Global"", Inc."');
    expect(content).toContain('"Line 1\nLine 2, with comma and ""quotes"""');
    expect(content).toContain('15000000,25000000');
    expect(content).toContain('2026-09-01,2026-09-10');

    // Also check alias /api/export/applications/csv
    const aliasRes = await agent.get('/api/export/applications/csv');
    expect(aliasRes.status).toBe(200);
    expect(aliasRes.text.charCodeAt(0)).toBe(0xFEFF);
  });

  it('exports logs to CSV via /api/export/logs/csv', async () => {
    const createRes = await agent.post('/api/applications').send({
      company_name: 'Startup Inc',
      position_title: 'Backend Dev',
      status: 'bookmarked',
    });
    const appId = createRes.body.id;

    // Add a log note
    await agent.post(`/api/applications/${appId}/logs`).send({ note: 'Contacted recruiter' });

    const res = await agent.get('/api/export/logs/csv');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.text.charCodeAt(0)).toBe(0xFEFF);
    expect(res.text).toContain('Startup Inc');
    expect(res.text).toContain('Backend Dev');
    expect(res.text).toContain('Contacted recruiter');
  });

  it('imports valid CSV records and normalizes URLs', async () => {
    const csvContent =
      'company_name,position_title,status,job_type,location,salary_min,salary_max,job_url\r\n' +
      'Gojek,Staff Engineer,applied,hybrid,Jakarta,30000000,45000000,https://gojek.com/jobs/10?utm_source=linkedin&utm_campaign=hiring\r\n' +
      'Tokopedia,Lead Architect,interview,remote,Bandung,40000000,60000000,https://tokopedia.com/careers/lead\r\n';

    const res = await agent
      .post('/api/import/csv')
      .set('Content-Type', 'text/csv')
      .send(csvContent);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.imported).toBe(2);
    expect(res.body.skipped).toBe(0);

    // Verify applications in DB
    const listRes = await agent.get('/api/applications');
    expect(listRes.body.length).toBe(2);

    const gojek = listRes.body.find((a: any) => a.company_name === 'Gojek');
    expect(gojek).toBeDefined();
    expect(gojek.position_title).toBe('Staff Engineer');
    expect(gojek.job_type).toBe('hybrid');
    expect(gojek.salary_min).toBe(30000000);
    // URL was normalized (tracking params stripped)
    expect(gojek.job_url).toBe('https://gojek.com/jobs/10');
  });

  it('rejects CSV with strict schema validation errors', async () => {
    // 1. Missing required headers
    const badHeaderRes = await agent
      .post('/api/import/csv')
      .set('Content-Type', 'text/csv')
      .send('foo,bar\n1,2');
    expect(badHeaderRes.status).toBe(400);
    expect(badHeaderRes.body.error).toBe('validation');

    // 2. Missing company_name on row 2, invalid status on row 3, min salary > max on row 4, bad date on row 5
    const badRowsCsv =
      'company_name,position_title,status,salary_min,salary_max,applied_date\r\n' +
      ',Software Engineer,applied,1000,2000,2026-01-01\r\n' +
      'Acme Inc,Frontend Dev,invalid_status,1000,2000,2026-01-01\r\n' +
      'Beta Co,QA Engineer,applied,5000,3000,2026-01-01\r\n' +
      'Gamma LLC,DevOps,applied,2000,3000,01-01-2026\r\n';

    const res = await agent
      .post('/api/import/csv')
      .set('Content-Type', 'text/csv')
      .send(badRowsCsv);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('validation');
    expect(res.body.details).toBeDefined();
    expect(res.body.details.length).toBeGreaterThanOrEqual(4);
    expect(res.body.details.some((d: string) => d.includes('Nama perusahaan wajib diisi'))).toBe(true);
    expect(res.body.details.some((d: string) => d.includes('Status "invalid_status" tidak valid'))).toBe(true);
    expect(res.body.details.some((d: string) => d.includes('tidak boleh lebih besar'))).toBe(true);
    expect(res.body.details.some((d: string) => d.includes('Format tanggal applied_date harus YYYY-MM-DD'))).toBe(true);
  });

  it('handles duplicate job_url during import by skipping by default or updating when requested', async () => {
    // First, insert an application
    await agent.post('/api/applications').send({
      company_name: 'Shopee',
      position_title: 'Junior Developer',
      status: 'bookmarked',
      job_url: 'https://careers.shopee.sg/job/101',
    });

    // CSV containing duplicate of Shopee and a new company
    const csvContent =
      'company_name,position_title,status,job_url\r\n' +
      'Shopee,Senior Developer,interview,https://careers.shopee.sg/job/101?ref=share\r\n' +
      'Bukalapak,Product Manager,applied,https://bukalapak.com/jobs/pm\r\n';

    // Default: skip duplicate
    const skipRes = await agent
      .post('/api/import/csv')
      .set('Content-Type', 'text/csv')
      .send(csvContent);

    expect(skipRes.status).toBe(200);
    expect(skipRes.body.imported).toBe(1);
    expect(skipRes.body.skipped).toBe(1);

    let listRes = await agent.get('/api/applications');
    const shopee = listRes.body.find((a: any) => a.company_name === 'Shopee');
    expect(shopee.position_title).toBe('Junior Developer'); // Unchanged

    // Re-import with update_duplicates = true: 1 update (Shopee) and 1 new (Traveloka)
    const updateCsv =
      'company_name,position_title,status,job_url\r\n' +
      'Shopee,Senior Developer,interview,https://careers.shopee.sg/job/101?ref=share\r\n' +
      'Traveloka,Engineering Manager,applied,https://traveloka.com/jobs/em\r\n';

    const updateRes = await agent
      .post('/api/import/csv?on_conflict=update')
      .set('Content-Type', 'text/csv')
      .send(updateCsv);

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.updated).toBe(1);
    expect(updateRes.body.imported).toBe(1);

    listRes = await agent.get('/api/applications');
    const updatedShopee = listRes.body.find((a: any) => a.company_name === 'Shopee');
    expect(updatedShopee.position_title).toBe('Senior Developer');
    expect(updatedShopee.status).toBe('interview');
  });

  it('auto-fills applied_date with today WIB when transitioning from bookmarked to active status', async () => {
    // Create an app in 'bookmarked' status with no applied_date
    const createRes = await agent.post('/api/applications').send({
      company_name: 'Traveloka',
      position_title: 'Frontend Engineer',
      status: 'bookmarked',
    });
    expect(createRes.body.applied_date).toBeNull();

    const appId = createRes.body.id;
    const version = createRes.body.version;

    // Transition from bookmarked -> applied without specifying applied_date
    const updateRes = await agent.patch(`/api/applications/${appId}`).send({
      status: 'applied',
      version,
    });

    expect(updateRes.status).toBe(200);
    const today = getTodayWIB();
    expect(updateRes.body.applied_date).toBe(today);

    // Also verify when importing an applied status with empty applied_date
    const csvContent =
      'company_name,position_title,status\r\n' +
      'Blibli,Backend Engineer,interview\r\n';

    await agent.post('/api/import/csv').set('Content-Type', 'text/csv').send(csvContent);

    const list = await agent.get('/api/applications');
    const blibli = list.body.find((a: any) => a.company_name === 'Blibli');
    expect(blibli.applied_date).toBe(today);
  });

  it('does NOT auto-fill applied_date when transitioning from bookmarked to rejected', async () => {
    const createRes = await agent.post('/api/applications').send({
      company_name: 'Dormant LLC',
      position_title: 'Junior Dev',
      status: 'bookmarked',
    });
    expect(createRes.body.applied_date).toBeNull();

    const updateRes = await agent.patch(`/api/applications/${createRes.body.id}`).send({
      status: 'rejected',
      version: createRes.body.version,
    });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.applied_date).toBeNull();
  });

  it('rejects import with invalid calendar date like 2026-02-31', async () => {
    const badDateCsv =
      'company_name,position_title,status,applied_date\r\n' +
      'FakeDate Co,Dev,applied,2026-02-31\r\n';

    const res = await agent
      .post('/api/import/csv')
      .set('Content-Type', 'text/csv')
      .send(badDateCsv);

    expect(res.status).toBe(400);
    expect(res.body.details.some((d: string) => d.includes('2026-02-31'))).toBe(true);
  });

  it('handles CSV with mixed newlines, multiline quotes, and preserves existing fields on duplicate update', async () => {
    // Seed initial app
    await agent.post('/api/applications').send({
      company_name: 'MultiLine Tech',
      position_title: 'Software Architect',
      status: 'applied',
      job_url: 'https://multiline.tech/job/99',
      notes: 'Initial secret notes',
      salary_min: 20000000,
    });

    // CSV with mixed \r\n and \n, plus quoted multiline and duplicate update
    const complexCsv =
      'company_name,position_title,status,job_url\n' +
      'MultiLine Tech,Chief Architect,interview,https://multiline.tech/job/99?utm_medium=email\r\n' +
      '"Newline, Inc.","DevOps ""Lead""\nSpecialist",applied,https://newline.inc/careers/1\n';

    const res = await agent
      .post('/api/import/csv?on_conflict=update')
      .set('Content-Type', 'text/csv')
      .send(complexCsv);

    expect(res.status).toBe(200);
    expect(res.body.updated).toBe(1);
    expect(res.body.imported).toBe(1);

    const list = await agent.get('/api/applications');
    const updated = list.body.find((a: any) => a.company_name === 'MultiLine Tech');
    expect(updated.position_title).toBe('Chief Architect');
    expect(updated.status).toBe('interview');
    // Ensure initial notes and salary were preserved and not erased by columns absent from CSV
    expect(updated.notes).toBe('Initial secret notes');
    expect(updated.salary_min).toBe(20000000);

    const newlineApp = list.body.find((a: any) => a.company_name === 'Newline, Inc.');
    expect(newlineApp).toBeDefined();
    expect(newlineApp.position_title).toBe('DevOps "Lead"\nSpecialist');
  });
});
