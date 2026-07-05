const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./db');

const SECRET = process.env.JWT_SECRET || 'changeme';

// ponytail: no refresh tokens, add when sessions need expiry management
function signToken(user) {
    return jwt.sign({ id: user.id, username: user.username }, SECRET, { expiresIn: '7d' });
}

function requireAuth(req, res, next) {
    const h = req.headers.authorization || '';
    const token = h.startsWith('Bearer ') ? h.slice(7) : null;
    if (!token) return res.status(401).json({ status: false, message: 'Token required' });
    try {
        req.user = jwt.verify(token, SECRET);
        next();
    } catch {
        res.status(401).json({ status: false, message: 'Invalid token' });
    }
}

async function register(req, res) {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ status: false, message: 'username & password required' });
    try {
        const hashed = await bcrypt.hash(password, 10);
        const id = await db.createUser(username, hashed);
        res.json({ status: true, token: signToken({ id, username }) });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ status: false, message: 'Username taken' });
        res.status(500).json({ status: false, message: String(err) });
    }
}

async function login(req, res) {
    const { username, password } = req.body;
    const user = await db.findUserByUsername(username);
    if (!user) return res.status(401).json({ status: false, message: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ status: false, message: 'Invalid credentials' });
    res.json({ status: true, token: signToken(user), username: user.username });
}

module.exports = { requireAuth, register, login };
