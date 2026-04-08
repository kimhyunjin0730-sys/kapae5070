const mysql = require('mysql2/promise');
require('dotenv').config();

async function testConn() {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || 'HI829^cata700',
      database: process.env.DB_NAME || 'kapae5070',
    });
    console.log('Successfully connected');
    await conn.end();
  } catch (err) {
    console.log('FULL_ERROR_MESSAGE: ' + err.message);
    console.log('ERROR_CODE: ' + err.code);
    console.dir(err);
  }
}

testConn().then(() => process.exit());
