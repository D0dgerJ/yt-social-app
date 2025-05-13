import express, { Express } from 'express';
import dotenv from 'dotenv';

let app: Express;

try {
  dotenv.config();

  const helmet = await import('helmet').then(mod => mod.default);
  const morgan = await import('morgan').then(mod => mod.default);
  const cors = await import('cors').then(mod => mod.default);
  const routes = await import('./routes/routes.js').then(mod => mod.default);
  const { errorHandler } = await import('../infrastructure/middleware/errorHandler.js');
  await import('../cron/storyCleaner.js');

  app = express();

  app.use(helmet());
  app.use(morgan('common'));
  app.use(cors());
  app.use(express.json());

  app.use('/api/v1', routes);
  app.use(errorHandler);
} catch (error) {
  console.error('❌ Ошибка при инициализации app.ts:', error);
  throw error;
}

export default app!;
