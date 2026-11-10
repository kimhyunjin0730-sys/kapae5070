const mysql = require('mysql2/promise');
require('dotenv').config();

if (!process.env.DB_USER || !process.env.DB_PASS) {
  console.warn('⚠️  DB_USER / DB_PASS가 .env에 없습니다. DB 접속이 실패할 수 있습니다.');
}

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS,
  database: process.env.DB_NAME || 'kapae5070',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

pool.getConnection()
  .then(conn => {
    console.log('✅ MySQL Database Connected successfully.');
    conn.release();
  })
  .catch(err => {
    console.error('❌ MySQL Connection Error:', err.message);
    console.error('👉 TIP: If you see "auth_gssapi_client" error, run the MariaDB fix command provided by the assistant.');
  });

module.exports = pool;
