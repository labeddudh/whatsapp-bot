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

// Archive/unarchive chat
// POST /chats/archive { sender, jid, archive }
router.post('/archive', async (req, res) => {
    const { sender, jid: chatJid, archive } = req.body;
    const session = getSession(req);
    if (!session?.sock) return res.status(401).json({ status: false, response: 'Session belum login' });
    try {
        await session.sock.chatModify({ archive: archive !== false }, chatJid);
        res.json({ status: true });
    } catch (err) { res.status(500).json({ status: false, response: String(err) }); }
});

// Mute/unmute chat
// POST /chats/mute { sender, jid, mute, duration } duration in ms, 0 = unmute
router.post('/mute', async (req, res) => {
    const { sender, jid: chatJid, mute, duration } = req.body;
    const session = getSession(req);
    if (!session?.sock) return res.status(401).json({ status: false, response: 'Session belum login' });
    try {
        if (mute === false) {
            await session.sock.chatModify({ mute: null }, chatJid);
        } else {
            await session.sock.chatModify({ mute: Date.now() + (duration || 8 * 60 * 60 * 1000) }, chatJid);
        }
        res.json({ status: true });
    } catch (err) { res.status(500).json({ status: false, response: String(err) }); }
});

// Mark chat read/unread
// POST /chats/mark-read { sender, jid, read, lastMsgKey }
router.post('/mark-read', async (req, res) => {
    const { sender, jid: chatJid, read, lastMsgKey } = req.body;
    const session = getSession(req);
    if (!session?.sock) return res.status(401).json({ status: false, response: 'Session belum login' });
    try {
        await session.sock.chatModify({ markRead: read !== false, lastMessages: lastMsgKey ? [{ key: lastMsgKey }] : [] }, chatJid);
        res.json({ status: true });
    } catch (err) { res.status(500).json({ status: false, response: String(err) }); }
});

// Delete message for me
// POST /chats/delete-msg-for-me { sender, jid, msgKey, msgTimestamp }
router.post('/delete-msg-for-me', async (req, res) => {
    const { sender, jid: chatJid, msgKey, msgTimestamp } = req.body;
    const session = getSession(req);
    if (!session?.sock) return res.status(401).json({ status: false, response: 'Session belum login' });
    try {
        await session.sock.chatModify({
            clear: { messages: [{ id: msgKey.id, fromMe: msgKey.fromMe, timestamp: msgTimestamp }] }
        }, chatJid);
        res.json({ status: true });
    } catch (err) { res.status(500).json({ status: false, response: String(err) }); }
});

// Delete entire chat
// POST /chats/delete-chat { sender, jid, lastMsgKey, lastMsgTimestamp }
router.post('/delete-chat', async (req, res) => {
    const { sender, jid: chatJid, lastMsgKey, lastMsgTimestamp } = req.body;
    const session = getSession(req);
    if (!session?.sock) return res.status(401).json({ status: false, response: 'Session belum login' });
    try {
        await session.sock.chatModify({
            delete: true,
            lastMessages: [{ key: lastMsgKey, messageTimestamp: lastMsgTimestamp }]
        }, chatJid);
        res.json({ status: true });
    } catch (err) { res.status(500).json({ status: false, response: String(err) }); }
});

// Star/unstar message
// POST /chats/star { sender, jid, msgKeys: [{id, fromMe}], star }
router.post('/star', async (req, res) => {
    const { sender, jid: chatJid, msgKeys, star } = req.body;
    const session = getSession(req);
    if (!session?.sock) return res.status(401).json({ status: false, response: 'Session belum login' });
    if (!Array.isArray(msgKeys)) return res.status(400).json({ status: false, response: 'msgKeys array wajib diisi' });
    try {
        await session.sock.chatModify({
            star: { messages: msgKeys.map(k => ({ id: k.id, fromMe: !!k.fromMe })), star: star !== false }
        }, chatJid);
        res.json({ status: true });
    } catch (err) { res.status(500).json({ status: false, response: String(err) }); }
});

// Disappearing messages (ephemeral)
// POST /chats/disappearing { sender, jid, duration } duration: 0=off, 86400=1day, 604800=7days, 7776000=90days
router.post('/disappearing', async (req, res) => {
    const { sender, jid: chatJid, duration } = req.body;
    const session = getSession(req);
    if (!session?.sock) return res.status(401).json({ status: false, response: 'Session belum login' });
    try {
        await session.sock.sendMessage(chatJid, { disappearingMessagesInChat: duration || 0 });
        res.json({ status: true });
    } catch (err) { res.status(500).json({ status: false, response: String(err) }); }
});

module.exports = router;
