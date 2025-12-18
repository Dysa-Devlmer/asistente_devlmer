/**
 * Temporary script to inspect apcajas table schema
 */
const mysql = require('mysql2/promise');

async function inspectSchema() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    port: 4306,
    user: 'root',
    password: 'infusorio',
    database: 'sysmehotel',
    charsetNumber: 33, // UTF8MB4
  });

  try {
    console.log('🔍 DESCRIBE ventadirecta;\n');
    const [rows] = await connection.execute('DESCRIBE ventadirecta');

    console.table(rows);

    console.log('\n📊 Sample data (first 2 rows):\n');
    const [sample] = await connection.execute('SELECT * FROM ventadirecta LIMIT 2');
    console.table(sample);

    console.log('\n📈 Record count:');
    const [count] = await connection.execute('SELECT COUNT(*) as total FROM ventadirecta');
    console.log(`Total records: ${count[0].total}`);

  } finally {
    await connection.end();
  }
}

inspectSchema().catch(console.error);
