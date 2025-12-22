import express, { Application } from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import healthRouter from './routes/health';
import { createPosRouter } from './modules/pos/pos.module';
import { createJarvisRouter } from './modules/jarvis/jarvis.module';
import { requestIdMiddleware } from './common/middleware/request-id.middleware';
import { requestLoggerMiddleware } from './common/middleware/request-logger.middleware';
import { errorHandlerMiddleware } from './common/middleware/error-handler.middleware';
import { WebSocketService } from './services/WebSocketService';

// Global WebSocket service instance
let wsServiceInstance: WebSocketService | null = null;

export function createServer(): { app: Application; server: http.Server; wsService: WebSocketService } {
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

  // Create HTTP server for WebSocket
  const server = http.createServer(app);

  // Initialize WebSocket service
  const wsService = new WebSocketService(server);
  wsServiceInstance = wsService;

  // Routes (pass wsService to POS router)
  app.use(healthRouter);
  app.use('/api/jarvis', createJarvisRouter());
  app.use('/api', createPosRouter(wsService));

  // Error handling
  app.use(errorHandlerMiddleware);

  return { app, server, wsService };
}

export function getWebSocketService(): WebSocketService | null {
  return wsServiceInstance;
}
