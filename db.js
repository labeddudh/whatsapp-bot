require('dotenv').config();
const mysql = require('mysql2/promise');

// ponytail: single pool, no ORM, no query builder
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10
});

async function initDB() {
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(100) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS credentials (
            credkey VARCHAR(100) PRIMARY KEY,
            user_id INT NOT NULL,
            phone VARCHAR(50),
            api_key VARCHAR(64) UNIQUE NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS messages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            credkey VARCHAR(100) NOT NULL,
            direction ENUM('in','out') NOT NULL,
            jid VARCHAR(100) NOT NULL,
            message_type VARCHAR(50) DEFAULT 'text',
            text TEXT,
            message_id VARCHAR(100),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_msg (credkey, message_id)
        )
    `);
    // ponytail: ALTER IGNORE for existing tables that predate the unique constraint
    await pool.execute(`
        ALTER TABLE messages ADD UNIQUE KEY uniq_msg (credkey, message_id)
    `).catch(() => {}); // silently skip if constraint already exists
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS webhook_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            credkey VARCHAR(100) NOT NULL,
            event VARCHAR(50) NOT NULL,
            url VARCHAR(500) NOT NULL,
            payload JSON,
            status ENUM('success','failed') NOT NULL,
            http_status INT DEFAULT NULL,
            error_message TEXT DEFAULT NULL,
            attempt TINYINT DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
}

// users
async function createUser(username, hashedPassword) {
    const [r] = await pool.execute('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);
    return r.insertId;
}
async function findUserByUsername(username) {
    const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
    return rows[0] || null;
}

// credentials/bots
async function getCredsByUser(userId) {
    const [rows] = await pool.execute('SELECT * FROM credentials WHERE user_id = ?', [userId]);
    return rows;
}
async function getCredByApiKey(apiKey) {
    const [rows] = await pool.execute('SELECT * FROM credentials WHERE api_key = ?', [apiKey]);
    return rows[0] || null;
}
async function getCredByKey(credkey) {
    const [rows] = await pool.execute('SELECT * FROM credentials WHERE credkey = ?', [credkey]);
    return rows[0] || null;
}
async function updateApiKey(credkey, apiKey) {
    await pool.execute('UPDATE credentials SET api_key = ? WHERE credkey = ?', [apiKey, credkey]);
}

async function saveCred(credkey, userId, phone, apiKey) {
    await pool.execute(
        'INSERT IGNORE INTO credentials (credkey, user_id, phone, api_key) VALUES (?, ?, ?, ?)',
        [credkey, userId, phone || null, apiKey]
    );
}

async function deleteCred(credkey) {
    await pool.execute('DELETE FROM credentials WHERE credkey = ?', [credkey]);
}

async function setWebhook(credkey, url) {
    await pool.execute('UPDATE credentials SET webhook_url = ? WHERE credkey = ?', [url || null, credkey]);
}

async function getWebhook(credkey) {
    const [rows] = await pool.execute('SELECT webhook_url FROM credentials WHERE credkey = ?', [credkey]);
    return rows[0]?.webhook_url || null;
}

async function getMessages(credkey, limit = 50) {
    const [rows] = await pool.execute(
        'SELECT * FROM messages WHERE credkey = ? ORDER BY created_at DESC LIMIT ?',
        [credkey, limit]
    );
    return rows;
}

async function logMessage(credkey, direction, jid, messageType, text, messageId) {
    await pool.execute(
        // ponytail: upsert on (credkey, message_id) — update text/type in case edit arrives
        `INSERT INTO messages (credkey, direction, jid, message_type, text, message_id)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE text = VALUES(text), message_type = VALUES(message_type)`,
        [credkey, direction, jid, messageType, text || '', messageId || null]
    );
}

async function logWebhook(credkey, event, url, payload, status, httpStatus, errorMessage, attempt) {
    await pool.execute(
        'INSERT INTO webhook_logs (credkey, event, url, payload, status, http_status, error_message, attempt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [credkey, event || '', url, JSON.stringify(payload) || null, status, httpStatus || null, errorMessage || null, attempt || 1]
    );
}

async function getWebhookLogs(credkey, limit = 50) {
    const [rows] = await pool.execute(
        'SELECT * FROM webhook_logs WHERE credkey = ? ORDER BY created_at DESC LIMIT ?',
        [credkey, limit]
    );
    return rows;
}

async function getChatList(credkey) {
    // ponytail: group by jid, get last message per chat
    return pool.execute(
        `SELECT jid,
                MAX(created_at) as last_time,
                SUBSTRING_INDEX(GROUP_CONCAT(text ORDER BY created_at DESC SEPARATOR '\x01'), '\x01', 1) as last_text,
                SUBSTRING_INDEX(GROUP_CONCAT(direction ORDER BY created_at DESC SEPARATOR '\x01'), '\x01', 1) as last_direction,
                SUBSTRING_INDEX(GROUP_CONCAT(message_type ORDER BY created_at DESC SEPARATOR '\x01'), '\x01', 1) as last_type,
                COUNT(*) as total
         FROM messages WHERE credkey = ?
         GROUP BY jid ORDER BY last_time DESC LIMIT 100`,
        [credkey]
    );
}

async function getMessagesByJid(credkey, jid, limit = 50) {
    const [rows] = await pool.execute(
        'SELECT * FROM messages WHERE credkey = ? AND jid = ? ORDER BY created_at DESC LIMIT ?',
        [credkey, jid, limit]
    );
    return rows;
}

module.exports = {
    initDB,
    createUser, findUserByUsername,
    getCredsByUser, getCredByApiKey, getCredByKey,
    saveCred, deleteCred, logMessage, updateApiKey,
    setWebhook, getWebhook, getMessages,
    logWebhook, getWebhookLogs,
    getChatList, getMessagesByJid
};
