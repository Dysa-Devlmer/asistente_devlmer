import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import healthRouter from './routes/health';

export function createServer(): Application {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(cors());

  // Logging
  app.use(morgan('combined'));

  // Body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Routes
  app.use(healthRouter);

  return app;
}
