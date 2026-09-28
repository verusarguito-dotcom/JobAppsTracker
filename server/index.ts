import dotenv from 'dotenv';
dotenv.config();

import { assertAuthConfig } from './auth/auth.js';
assertAuthConfig();

import { initDatabase } from './db/database.js';
import { createApp } from './app.js';

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '127.0.0.1';

const db = initDatabase();
const app = createApp(db);

app.listen(PORT, HOST, () => {
  console.log(`[Job Tracker] Server securely listening on http://${HOST}:${PORT}`);
  console.log(`[Security] Port is bound strictly to ${HOST}. Access via SSH tunnel.`);
});
