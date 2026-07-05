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

// -------------------- Privacy --------------------

// Block/unblock user
// POST /privacy/block { sender, number, block }
router.post('/block', async (req, res) => {
    const { sender, number, block } = req.body;
    const session = getSession(req);
    if (!session?.sock) return res.status(401).json({ status: false, response: 'Session belum login' });
    try {
        await session.sock.updateBlockStatus(jid(number), block !== false ? 'block' : 'unblock');
        res.json({ status: true });
    } catch (err) { res.status(500).json({ status: false, response: String(err) }); }
});

// Get privacy settings
// GET /privacy/settings?sender=x
router.get('/settings', async (req, res) => {
    const { sender } = req.query;
    const session = getSession(req);
    if (!session?.sock) return res.status(401).json({ status: false, response: 'Session belum login' });
    try {
        const settings = await session.sock.fetchPrivacySettings(true);
        res.json({ status: true, data: settings });
    } catch (err) { res.status(500).json({ status: false, response: String(err) }); }
});

// Get block list
// GET /privacy/blocklist?sender=x
router.get('/blocklist', async (req, res) => {
    const { sender } = req.query;
    const session = getSession(req);
    if (!session?.sock) return res.status(401).json({ status: false, response: 'Session belum login' });
    try {
        const list = await session.sock.fetchBlocklist();
        res.json({ status: true, data: list });
    } catch (err) { res.status(500).json({ status: false, response: String(err) }); }
});

// Update last seen privacy
// POST /privacy/last-seen { sender, value: 'all'|'contacts'|'contact_blacklist'|'none' }
router.post('/last-seen', async (req, res) => {
    const { sender, value } = req.body;
    const session = getSession(req);
    if (!session?.sock) return res.status(401).json({ status: false, response: 'Session belum login' });
    try {
        await session.sock.updateLastSeenPrivacy(value);
        res.json({ status: true });
    } catch (err) { res.status(500).json({ status: false, response: String(err) }); }
});

// Update online privacy
// POST /privacy/online { sender, value: 'all'|'match_last_seen' }
router.post('/online', async (req, res) => {
    const { sender, value } = req.body;
    const session = getSession(req);
    if (!session?.sock) return res.status(401).json({ status: false, response: 'Session belum login' });
    try {
        await session.sock.updateOnlinePrivacy(value);
        res.json({ status: true });
    } catch (err) { res.status(500).json({ status: false, response: String(err) }); }
});

// Update profile picture privacy
// POST /privacy/profile-pic { sender, value: 'all'|'contacts'|'contact_blacklist'|'none' }
router.post('/profile-pic', async (req, res) => {
    const { sender, value } = req.body;
    const session = getSession(req);
    if (!session?.sock) return res.status(401).json({ status: false, response: 'Session belum login' });
    try {
        await session.sock.updateProfilePicturePrivacy(value);
        res.json({ status: true });
    } catch (err) { res.status(500).json({ status: false, response: String(err) }); }
});

// Update status privacy
// POST /privacy/status { sender, value: 'all'|'contacts'|'contact_blacklist'|'none' }
router.post('/status', async (req, res) => {
    const { sender, value } = req.body;
    const session = getSession(req);
    if (!session?.sock) return res.status(401).json({ status: false, response: 'Session belum login' });
    try {
        await session.sock.updateStatusPrivacy(value);
        res.json({ status: true });
    } catch (err) { res.status(500).json({ status: false, response: String(err) }); }
});

// Update read receipts privacy
// POST /privacy/read-receipts { sender, value: 'all'|'none' }
router.post('/read-receipts', async (req, res) => {
    const { sender, value } = req.body;
    const session = getSession(req);
    if (!session?.sock) return res.status(401).json({ status: false, response: 'Session belum login' });
    try {
        await session.sock.updateReadReceiptsPrivacy(value);
        res.json({ status: true });
    } catch (err) { res.status(500).json({ status: false, response: String(err) }); }
});

// Update groups add privacy
// POST /privacy/groups-add { sender, value: 'all'|'contacts'|'contact_blacklist'|'none' }
router.post('/groups-add', async (req, res) => {
    const { sender, value } = req.body;
    const session = getSession(req);
    if (!session?.sock) return res.status(401).json({ status: false, response: 'Session belum login' });
    try {
        await session.sock.updateGroupsAddPrivacy(value);
        res.json({ status: true });
    } catch (err) { res.status(500).json({ status: false, response: String(err) }); }
});

// Update default disappearing mode
// POST /privacy/default-disappear { sender, duration } 0=off, 86400, 604800, 7776000
router.post('/default-disappear', async (req, res) => {
    const { sender, duration } = req.body;
    const session = getSession(req);
    if (!session?.sock) return res.status(401).json({ status: false, response: 'Session belum login' });
    try {
        await session.sock.updateDefaultDisappearingMode(duration || 0);
        res.json({ status: true });
    } catch (err) { res.status(500).json({ status: false, response: String(err) }); }
});

// -------------------- Broadcast & Stories --------------------

// Send broadcast / story
// POST /privacy/send-broadcast { sender, jids: [], message } jids=[] for story/status
// Use jids=['status@broadcast'] for stories, or list of JIDs for broadcast
router.post('/send-broadcast', async (req, res) => {
    const { sender, jids, message, mediaUrl, mediaType, caption } = req.body;
    const session = getSession(req);
    if (!session?.sock) return res.status(401).json({ status: false, response: 'Session belum login' });
    if (!Array.isArray(jids) || !jids.length)
        return res.status(400).json({ status: false, response: 'jids array wajib diisi. Gunakan ["status@broadcast"] untuk story.' });
    try {
        let content;
        if (mediaUrl && mediaType === 'image') {
            content = { image: { url: mediaUrl }, caption: caption || '' };
        } else if (mediaUrl && mediaType === 'video') {
            content = { video: { url: mediaUrl }, caption: caption || '' };
        } else {
            content = { text: message || '' };
        }
        const results = [];
        for (const targetJid of jids) {
            const sent = await session.sock.sendMessage(targetJid, content);
            results.push(sent);
        }
        res.json({ status: true, results });
    } catch (err) { res.status(500).json({ status: false, response: String(err) }); }
});

// Query broadcast list recipients & name
// GET /privacy/broadcast-list?sender=x&jid=x
router.get('/broadcast-list', async (req, res) => {
    const { sender, jid: broadcastJid } = req.query;
    const session = getSession(req);
    if (!session?.sock) return res.status(401).json({ status: false, response: 'Session belum login' });
    try {
        const metadata = await session.sock.groupMetadata(broadcastJid);
        res.json({ status: true, name: metadata.subject, recipients: metadata.participants });
    } catch (err) { res.status(500).json({ status: false, response: String(err) }); }
});

module.exports = router;
