import { createServer } from './server';
import { env } from './config/env';
import { prisma } from './config/database';

const app = createServer();

async function start() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Start server
    app.listen(env.PORT, () => {
      console.log(`🚀 Server running on port ${env.PORT}`);
      console.log(`📊 Environment: ${env.NODE_ENV}`);
      console.log(`🏥 Health check: http://localhost:${env.PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⏳ Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⏳ Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

start();
