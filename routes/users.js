const express = require('express');
const router = express.Router();

function getSession(req) {
    return req.app.locals.sessionMap.get(req.body.sender || req.query.sender);
}
function jid(number) {
    if (!number) return null;
    if (number.includes('@')) return number;
    let n = String(number).replace(/\D/g, '');
    if (n.startsWith('0')) n = '62' + n.slice(1);
    return n + '@s.whatsapp.net';
}

// -------------------- User Queries --------------------

// Check if number exists on WhatsApp
// GET /users/check?sender=x&number=x
router.get('/check', async (req, res) => {
    const { sender, number } = req.query;
    const session = getSession(req);
    if (!session?.sock) return res.status(401).json({ status: false, response: 'Session belum login' });
    try {
        const result = await session.sock.onWhatsApp(jid(number));
        const exists = Array.isArray(result) && result.length > 0 && result[0].exists;
        res.json({ status: true, exists, jid: exists ? result[0].jid : null });
    } catch (err) { res.status(500).json({ status: false, response: String(err) }); }
});

// Query chat history
// GET /users/history?sender=x&jid=x&count=x
router.get('/history', async (req, res) => {
    const { sender, jid: chatJid, count } = req.query;
    const session = getSession(req);
    if (!session?.sock) return res.status(401).json({ status: false, response: 'Session belum login' });
    try {
        const msgs = await session.sock.fetchMessageHistory(parseInt(count) || 20, { remoteJid: chatJid, id: '' }, new Date());
        res.json({ status: true, messages: msgs });
    } catch (err) { res.status(500).json({ status: false, response: String(err) }); }
});

// Fetch status (about)
// GET /users/status?sender=x&number=x
router.get('/status', async (req, res) => {
    const { sender, number } = req.query;
    const session = getSession(req);
    if (!session?.sock) return res.status(401).json({ status: false, response: 'Session belum login' });
    try {
        const result = await session.sock.fetchStatus(jid(number));
        res.json({ status: true, data: result });
    } catch (err) { res.status(500).json({ status: false, response: String(err) }); }
});

// Fetch profile picture
// GET /users/profile-pic?sender=x&jid=x
router.get('/profile-pic', async (req, res) => {
    const { sender, jid: targetJid } = req.query;
    const session = getSession(req);
    if (!session?.sock) return res.status(401).json({ status: false, response: 'Session belum login' });
    try {
        const url = await session.sock.profilePictureUrl(targetJid, 'image');
        res.json({ status: true, url });
    } catch (err) { res.status(500).json({ status: false, response: String(err) }); }
});

// Fetch business profile
// GET /users/business-profile?sender=x&number=x
router.get('/business-profile', async (req, res) => {
    const { sender, number } = req.query;
    const session = getSession(req);
    if (!session?.sock) return res.status(401).json({ status: false, response: 'Session belum login' });
    try {
        const result = await session.sock.getBusinessProfile(jid(number));
        res.json({ status: true, data: result });
    } catch (err) { res.status(500).json({ status: false, response: String(err) }); }
});

// Fetch someone's presence
// GET /users/presence?sender=x&number=x
router.get('/presence', async (req, res) => {
    const { sender, number } = req.query;
    const session = getSession(req);
    if (!session?.sock) return res.status(401).json({ status: false, response: 'Session belum login' });
    try {
        await session.sock.subscribePresence(jid(number));
        res.json({ status: true, message: 'Subscribed to presence. Listen via webhook event: presence.update' });
    } catch (err) { res.status(500).json({ status: false, response: String(err) }); }
});

// -------------------- Change Profile --------------------

// Update profile status
// POST /users/set-status { sender, status }
router.post('/set-status', async (req, res) => {
    const { sender, status } = req.body;
    const session = getSession(req);
    if (!session?.sock) return res.status(401).json({ status: false, response: 'Session belum login' });
    try {
        await session.sock.updateProfileStatus(status);
        res.json({ status: true });
    } catch (err) { res.status(500).json({ status: false, response: String(err) }); }
});

// Update profile name
// POST /users/set-name { sender, name }
router.post('/set-name', async (req, res) => {
    const { sender, name } = req.body;
    const session = getSession(req);
    if (!session?.sock) return res.status(401).json({ status: false, response: 'Session belum login' });
    try {
        await session.sock.updateProfileName(name);
        res.json({ status: true });
    } catch (err) { res.status(500).json({ status: false, response: String(err) }); }
});

// Update profile picture (or group picture)
// POST /users/set-profile-pic { sender, jid, url }
router.post('/set-profile-pic', async (req, res) => {
    const { sender, jid: targetJid, url } = req.body;
    const session = getSession(req);
    if (!session?.sock) return res.status(401).json({ status: false, response: 'Session belum login' });
    try {
        const response = await fetch(url);
        const buffer = Buffer.from(await response.arrayBuffer());
        await session.sock.updateProfilePicture(targetJid || jid(sender), buffer);
        res.json({ status: true });
    } catch (err) { res.status(500).json({ status: false, response: String(err) }); }
});

// Remove profile picture (or group picture)
// POST /users/remove-profile-pic { sender, jid }
router.post('/remove-profile-pic', async (req, res) => {
    const { sender, jid: targetJid } = req.body;
    const session = getSession(req);
    if (!session?.sock) return res.status(401).json({ status: false, response: 'Session belum login' });
    try {
        await session.sock.removeProfilePicture(targetJid || jid(sender));
        res.json({ status: true });
    } catch (err) { res.status(500).json({ status: false, response: String(err) }); }
});

module.exports = router;
