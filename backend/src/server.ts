import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import healthRouter from './routes/health';
import { createPosRouter } from './modules/pos/pos.module';
import { requestIdMiddleware } from './common/middleware/request-id.middleware';
import { requestLoggerMiddleware } from './common/middleware/request-logger.middleware';
import { errorHandlerMiddleware } from './common/middleware/error-handler.middleware';

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

  // Request context
  app.use(requestIdMiddleware);
  app.use(requestLoggerMiddleware);

  // Routes
  app.use(healthRouter);
  app.use('/api', createPosRouter());

  // Error handling
  app.use(errorHandlerMiddleware);

  return app;
}
