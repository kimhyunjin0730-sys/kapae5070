// backend_test/init_db.js
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function initDB() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        multipleStatements: true
    });

    try {
        console.log('Connecting to database...');
        const schema = fs.readFileSync(path.join(__dirname, 'db_schema.sql'), 'utf8');
        await connection.query(schema);
        console.log('✅ Database schema applied successfully.');
    } catch (error) {
        console.error('❌ Error applying schema:', error.message);
    } finally {
        await connection.end();
    }
}

initDB();
