const mysql = require('mysql2/promise');
require('dotenv').config();

async function testConn() {
  try {
    const pool = mysql.createPool({
      host: process.env.DB_HOST || '127.0.0.1',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || 'HI829^cata700',
      database: process.env.DB_NAME || 'kapae5070',
    });
    await pool.getConnection();
    console.log('SUCCESS: Connected');
  } catch (err) {
    console.log('ERROR_CODE: ' + err.code);
    console.log('ERROR_MESSAGE: ' + err.message);
  }
}

testConn().then(() => process.exit());
