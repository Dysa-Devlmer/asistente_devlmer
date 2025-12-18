require('dotenv').config();
const mysql = require('mysql2/promise');
const { PrismaClient } = require('@prisma/client');

async function testConnections() {
  console.log('🔍 Validando conexiones...\n');

  // Test MySQL Legacy
  console.log('1️⃣ MySQL Legacy (READ ONLY)');
  try {
    const connection = await mysql.createConnection({
      host: process.env.LEGACY_DB_HOST,
      port: parseInt(process.env.LEGACY_DB_PORT),
      user: process.env.LEGACY_DB_USER,
      password: process.env.LEGACY_DB_PASSWORD,
      database: process.env.LEGACY_DB_NAME
    });

    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM complementog');
    const [tables] = await connection.execute('SHOW TABLES');
    await connection.end();

    console.log('✅ MySQL Legacy: Conexión exitosa');
    console.log(`   Base de datos: ${process.env.LEGACY_DB_NAME}`);
    console.log(`   Productos (complementog): ${rows[0].count}`);
    console.log(`   Total tablas: ${tables.length}\n`);
  } catch (error) {
    console.log('❌ MySQL Legacy: Error de conexión');
    console.log(`   ${error.message}\n`);
    process.exit(1);
  }

  // Test PostgreSQL
  console.log('2️⃣ PostgreSQL DEV');
  try {
    const prisma = new PrismaClient();
    await prisma.$connect();

    console.log('✅ PostgreSQL DEV: Conexión exitosa');
    console.log(`   Database URL configurado correctamente\n`);

    await prisma.$disconnect();
  } catch (error) {
    console.log('❌ PostgreSQL DEV: Error de conexión');
    console.log(`   ${error.message}\n`);
    process.exit(1);
  }

  console.log('🎉 Todas las conexiones validadas exitosamente');
}

testConnections().catch(console.error);
