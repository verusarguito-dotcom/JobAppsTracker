import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import type { DatabaseSync } from 'node:sqlite';
import { getSessionSecret } from './auth/auth.js';
import { createApiRouter } from './routes/api.js';

export function createApp(db: DatabaseSync) {
  const app = express();

  if (process.env.TRUST_PROXY === '1') {
    app.set('trust proxy', 1);
  }

  app.use(express.json({ limit: '10mb' }));
  app.use(express.text({ type: ['text/csv', 'text/plain'], limit: '10mb' }));
  app.use(cookieParser(getSessionSecret()));

  app.use('/api', createApiRouter(db));

  // Serve static assets in production
  const distDir = path.resolve('dist/client');
  app.use(express.static(distDir));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    const indexHtml = path.join(distDir, 'index.html');
    res.sendFile(indexHtml, (err) => {
      if (err) res.status(200).send('API ready. Build client with `npm run build:client`.');
    });
  });

  return app;
}
