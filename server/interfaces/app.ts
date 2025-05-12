import express, { Express } from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';

import routes from './routes/routes';
import { errorHandler } from '../infrastructure/middleware/errorHandler';
import '../cron/storyCleaner';

dotenv.config();

const app: Express = express();

app.use(helmet());
app.use(morgan('common'));
app.use(cors());
app.use(express.json());

app.use('/api/v1', routes);
app.use(errorHandler);

export default app;
