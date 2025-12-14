import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  // Validation pipe global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remueve propiedades no definidas en DTO
      forbidNonWhitelisted: true, // Rechaza requests con propiedades extra
      transform: true, // Transforma payloads a instancias de DTO
    }),
  );

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  });

  // Prefix global para API
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`
  ┌─────────────────────────────────────────────────────────┐
  │  🚀 SYSME TPV Backend API                               │
  ├─────────────────────────────────────────────────────────┤
  │  ✅ Servidor corriendo en: http://localhost:${port}      │
  │  📡 WebSocket en: ws://localhost:${port}                │
  │  📊 Ambiente: ${process.env.NODE_ENV || 'development'}  │
  │  🗄️  Base de datos: PostgreSQL                          │
  └─────────────────────────────────────────────────────────┘
  `);
}

bootstrap();
