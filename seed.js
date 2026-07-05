// ponytail: one-shot seed, delete after use
require('dotenv').config();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const mysql = require('mysql2/promise');

async function seed() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST, port: process.env.DB_PORT,
        user: process.env.DB_USER, password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    // init tables
    await pool.execute(`CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(100) UNIQUE NOT NULL, password VARCHAR(255) NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
    await pool.execute(`CREATE TABLE IF NOT EXISTS credentials (credkey VARCHAR(100) PRIMARY KEY, user_id INT NOT NULL, phone VARCHAR(50), api_key VARCHAR(64) UNIQUE NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE)`);

    const password = 'admin123';
    const hash = await bcrypt.hash(password, 10);
    const apiKey = crypto.randomBytes(32).toString('hex');

    await pool.execute('INSERT IGNORE INTO users (username, password) VALUES (?, ?)', ['admin', hash]);
    const [rows] = await pool.execute('SELECT id FROM users WHERE username = ?', ['admin']);
    const userId = rows[0].id;

    await pool.execute(
        'INSERT IGNORE INTO credentials (credkey, user_id, phone, api_key) VALUES (?, ?, ?, ?)',
        ['bot-demo', userId, '6281234567890', apiKey]
    );

    console.log('Seed selesai!');
    console.log('  username : admin');
    console.log('  password : admin123');
    console.log('  credkey  : bot-demo');
    console.log('  api_key  :', apiKey);

    await pool.end();
}

seed().catch(e => { console.error(e.message); process.exit(1); });
