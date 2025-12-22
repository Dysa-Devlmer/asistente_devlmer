import { createServer } from './server';
import { env } from './config/env';
import { prisma } from './config/database';
import { KitchenService } from './modules/pos/services/KitchenService';

const { app, server, wsService } = createServer();

async function start() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Initialize kitchen module (add servido_cocina field if missing)
    const kitchenService = new KitchenService();
    try {
      await kitchenService.initialize();
      console.log('✅ Kitchen module initialized');
    } catch (error) {
      console.warn('⚠️  Kitchen module initialization failed:', error);
      console.warn('   Kitchen features may not work correctly');
    }

    // Start server
    server.listen(env.PORT, () => {
      console.log(`🚀 Server running on port ${env.PORT}`);
      console.log(`📊 Environment: ${env.NODE_ENV}`);
      console.log(`🏥 Health check: http://localhost:${env.PORT}/health`);
      console.log(`🔌 WebSocket server ready`);
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
  wsService.close();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⏳ Shutting down gracefully...');
  wsService.close();
  await prisma.$disconnect();
  process.exit(0);
});

start();
