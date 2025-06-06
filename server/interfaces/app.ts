import express, { Express } from 'express';
import dotenv from 'dotenv';

let app: Express;

try {
  dotenv.config();

  const helmet = await import('helmet').then(mod => mod.default);
  const morgan = await import('morgan').then(mod => mod.default);
  const cors = await import('cors').then(mod => mod.default);
  const routes = await import('./routes/routes.ts').then(mod => mod.default);
  const { errorHandler } = await import('../infrastructure/middleware/errorHandler.ts');
  await import('../cron/storyCleaner.ts');

  app = express();

  app.use(helmet());
  app.use(morgan('common'));
  app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  }));
  app.use(express.json());

  app.use('/api/v1', routes);
  app.use(errorHandler);
} catch (error) {
  console.error('❌ Ошибка при инициализации app.ts:', error);
  throw error;
}

export default app!;
