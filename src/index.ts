import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pino from 'pino';
import { middleware as openApi } from 'express-openapi-validator';
import { PrismaClient } from '@prisma/client';

// ESM: __dirname / __filename
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const log = pino({ transport: { target: 'pino-pretty' } });
const app = express();
const prisma = new PrismaClient();

const PORT = Number(process.env.PORT || 3001);
const origins = (process.env.CORS_ORIGINS ?? '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

// Middlewares base
app.use(helmet());
app.use(cors({ origin: origins.length ? origins : true, credentials: true }));
app.use(express.json());

// 1) Ruta pública de salud (sin auth)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// 2) Validador OpenAPI (ruta estable desde dist/)
const spec = resolve(__dirname, '../contracts/openapi.yaml');
app.use(
  openApi({
    apiSpec: spec,
    validateRequests: true,
    validateResponses: false, // pon true si deseas validar respuestas
  })
);

import { createAuthRouter } from './routes/auth.js';
import { createCatalogRouter } from './routes/catalog.js';
import { createOrdersRouter } from './routes/orders.js';
import { createStoresRouter } from './routes/stores.js';

// 3) Aquí van tus rutas reales (las protegidas seguirán lo definido en el contrato)
app.use('/auth', createAuthRouter(prisma));
app.use('/catalog', createCatalogRouter(prisma));
app.use('/orders', createOrdersRouter(prisma));
app.use('/stores', createStoresRouter(prisma));


// 4) Manejo de errores estándar (incluye errores del validador)
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal error';
  log.error({ status, message, errors: err.errors });
  res.status(status).json({ error: message, details: err.errors ?? null });
});

// 5) Arranque
app.listen(PORT, () => {
  log.info(`YEGA API listening on :${PORT}`);
});
