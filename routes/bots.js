const express = require('express');
const crypto = require('crypto');
const db = require('../db');
const { requireAuth } = require('../auth');

const router = express.Router();
router.use(requireAuth);

// ponytail: crypto.randomBytes from stdlib, no uuid dep
function genApiKey() { return crypto.randomBytes(32).toString('hex'); }

// List bots milik user
router.get('/', async (req, res) => {
    const bots = await db.getCredsByUser(req.user.id);
    res.json({ status: true, data: bots });
});

// Detail satu bot
router.get('/:credkey', async (req, res) => {
    const bot = await db.getCredByKey(req.params.credkey);
    if (!bot || bot.user_id !== req.user.id) return res.status(404).json({ status: false, message: 'Bot not found' });
    res.json({ status: true, data: bot });
});

// Tambah bot baru
router.post('/', async (req, res) => {
    const { credkey, phone } = req.body;
    if (!credkey) return res.status(400).json({ status: false, message: 'credkey required' });
    try {
        const apiKey = genApiKey();
        await db.saveCred(credkey, req.user.id, phone, apiKey);
        res.json({ status: true, data: { credkey, phone, api_key: apiKey } });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ status: false, message: 'credkey already exists' });
        res.status(500).json({ status: false, message: String(err) });
    }
});

// Regenerate API key
router.post('/:credkey/regenerate-key', async (req, res) => {
    const { credkey } = req.params;
    const bot = await db.getCredByKey(credkey);
    if (!bot || bot.user_id !== req.user.id) return res.status(404).json({ status: false, message: 'Bot not found' });
    const apiKey = genApiKey();
    await db.updateApiKey(credkey, apiKey);
    res.json({ status: true, api_key: apiKey });
});

// Hapus bot
router.delete('/:credkey', async (req, res) => {
    const { credkey } = req.params;
    const bot = await db.getCredByKey(credkey);
    if (!bot || bot.user_id !== req.user.id) return res.status(404).json({ status: false, message: 'Bot not found' });
    await db.deleteCred(credkey);
    res.json({ status: true });
});

// Message log — optional ?jid= filter, optional ?limit=
router.get('/:credkey/messages', async (req, res) => {
    const { credkey } = req.params;
    const bot = await db.getCredByKey(credkey);
    if (!bot || bot.user_id !== req.user.id) return res.status(404).json({ status: false, message: 'Bot not found' });
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    // ponytail: reuse getMessagesByJid when jid param present, avoids client-side filter
    const messages = req.query.jid
        ? await db.getMessagesByJid(credkey, req.query.jid, limit)
        : await db.getMessages(credkey, limit);
    res.json({ status: true, data: messages });
});

// Webhook log
router.get('/:credkey/webhook-logs', async (req, res) => {
    const { credkey } = req.params;
    const bot = await db.getCredByKey(credkey);
    if (!bot || bot.user_id !== req.user.id) return res.status(404).json({ status: false, message: 'Bot not found' });
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const logs = await db.getWebhookLogs(credkey, limit);
    res.json({ status: true, data: logs });
});

module.exports = router;
