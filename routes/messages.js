const express = require('express');
const router = express.Router();
const db = require('../db');

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
function log(req, sender, toJid, type, text, msgId) {
    db.logMessage(sender, 'out', toJid, type, text || '', msgId || null)
      .catch(err => req.app.locals.logger?.error('DB logMessage: ' + err));
}

// -------------------- Non-Media Messages --------------------

// Quote/Reply message
// POST /messages/send-quote { sender, number, message, quotedMsgId, quotedMsg }
router.post('/send-quote', async (req, res) => {
    const { sender, number, message, quotedMsgId, quotedRemoteJid, quotedParticipant, quotedMsg } = req.body;
    const session = getSession(req);
    if (!session?.sock) return res.status(401).json({ status: false, response: 'Session belum login' });
    try {
        const sent = await session.sock.sendMessage(jid(number), {
            text: message,
            contextInfo: {
                stanzaId: quotedMsgId,
                participant: quotedParticipant || jid(number),
                remoteJid: quotedRemoteJid || jid(number),
                quotedMessage: quotedMsg || { conversation: '' }
            }
        });
        log(req, sender, jid(number), 'extendedTextMessage', message, sent?.key?.id);
        res.json({ status: true, response: sent });
    } catch (err) { res.status(500).json({ status: false, response: String(err) }); }
});

// Mention user in group
// POST /messages/send-mention { sender, groupId, message, mentions: ['628xxx'] }
router.post('/send-mention', async (req, res) => {
    const { sender, groupId, message, mentions } = req.body;
    const session = getSession(req);
    if (!session?.sock) return res.status(401).json({ status: false, response: 'Session belum login' });
    if (!Array.isArray(mentions) || !mentions.length)
        return res.status(400).json({ status: false, response: 'mentions array wajib diisi' });
    try {
        const mentionJids = mentions.map(m => jid(m));
        const sent = await session.sock.sendMessage(groupId, { text: message, mentions: mentionJids });
        log(req, sender, groupId, 'extendedTextMessage', message, sent?.key?.id);
        res.json({ status: true, response: sent });
    } catch (err) { res.status(500).json({ status: false, response: String(err) }); }
});

// Forward message
// POST /messages/forward { sender, number, msgKey, msgContent }
router.post('/forward', async (req, res) => {
    const { sender, number, msgKey, msgContent } = req.body;
    const session = getSession(req);
    if (!session?.sock) return res.status(401).json({ status: false, response: 'Session belum login' });
    try {
        const sent = await session.sock.sendMessage(jid(number), {
            forward: { key: msgKey, message: msgContent }
        });
        log(req, sender, jid(number), 'forward', '', sent?.key?.id);
        res.json({ status: true, response: sent });
    } catch (err) { res.status(500).json({ status: false, response: String(err) }); }
});

// Location message
// POST /messages/send-location { sender, number, latitude, longitude, name, address }
router.post('/send-location', async (req, res) => {
    const { sender, number, latitude, longitude, name, address } = req.body;
    const session = getSession(req);
    if (!session?.sock) return res.status(401).json({ status: false, response: 'Session belum login' });
    try {
        const sent = await session.sock.sendMessage(jid(number), {
            location: { degreesLatitude: latitude, degreesLongitude: longitude, name, address }
        });
        log(req, sender, jid(number), 'locationMessage', `${latitude},${longitude}`, sent?.key?.id);
        res.json({ status: true, response: sent });
    } catch (err) { res.status(500).json({ status: false, response: String(err) }); }
});

// Contact message
// POST /messages/send-contact { sender, number, contactName, contactPhone }
router.post('/send-contact', async (req, res) => {
    const { sender, number, contactName, contactPhone } = req.body;
    const session = getSession(req);
    if (!session?.sock) return res.status(401).json({ status: false, response: 'Session belum login' });
    try {
        const vcard =
            'BEGIN:VCARD\nVERSION:3.0\n' +
            `FN:${contactName}\n` +
            `TEL;type=CELL;type=VOICE;waid=${String(contactPhone).replace(/\D/g, '')}:+${String(contactPhone).replace(/\D/g, '')}\n` +
            'END:VCARD';
        const sent = await session.sock.sendMessage(jid(number), {
            contacts: { displayName: contactName, contacts: [{ vcard }] }
        });
        log(req, sender, jid(number), 'contactsArrayMessage', contactName, sent?.key?.id);
        res.json({ status: true, response: sent });
    } catch (err) { res.status(500).json({ status: false, response: String(err) }); }
});

// Reaction message
// POST /messages/send-reaction { sender, number, msgId, fromMe, reaction }
router.post('/send-reaction', async (req, res) => {
    const { sender, number, msgId, fromMe, reaction } = req.body;
    const session = getSession(req);
    if (!session?.sock) return res.status(401).json({ status: false, response: 'Session belum login' });
    try {
        const sent = await session.sock.sendMessage(jid(number), {
            react: { text: reaction, key: { remoteJid: jid(number), id: msgId, fromMe: !!fromMe } }
        });
        log(req, sender, jid(number), 'reactionMessage', reaction, sent?.key?.id);
        res.json({ status: true, response: sent });
    } catch (err) { res.status(500).json({ status: false, response: String(err) }); }
});

// Pin message
// POST /messages/pin { sender, number, msgId, fromMe, pin }
router.post('/pin', async (req, res) => {
    const { sender, number, msgId, fromMe, pin } = req.body;
    const session = getSession(req);
    if (!session?.sock) return res.status(401).json({ status: false, response: 'Session belum login' });
    try {
        await session.sock.sendMessage(jid(number), {
            pin: { type: pin !== false ? 1 : 2, time: 86400, key: { remoteJid: jid(number), id: msgId, fromMe: !!fromMe } }
        });
        res.json({ status: true });
    } catch (err) { res.status(500).json({ status: false, response: String(err) }); }
});

// Poll message
// POST /messages/send-poll { sender, number, name, options: [], selectableCount }
router.post('/send-poll', async (req, res) => {
    const { sender, number, name, options, selectableCount } = req.body;
    const session = getSession(req);
    if (!session?.sock) return res.status(401).json({ status: false, response: 'Session belum login' });
    if (!Array.isArray(options) || options.length < 2)
        return res.status(400).json({ status: false, response: 'options minimal 2 item' });
    try {
        const sent = await session.sock.sendMessage(jid(number), {
            poll: { name, values: options, selectableCount: selectableCount || 1 }
        });
        log(req, sender, jid(number), 'pollCreationMessage', name, sent?.key?.id);
        res.json({ status: true, response: sent });
    } catch (err) { res.status(500).json({ status: false, response: String(err) }); }
});

// Send text with link preview
// POST /messages/send-link { sender, number, message }
router.post('/send-link', async (req, res) => {
    const { sender, number, message } = req.body;
    const session = getSession(req);
    if (!session?.sock) return res.status(401).json({ status: false, response: 'Session belum login' });
    try {
        const sent = await session.sock.sendMessage(jid(number), { text: message, linkPreview: true });
        log(req, sender, jid(number), 'extendedTextMessage', message, sent?.key?.id);
        res.json({ status: true, response: sent });
    } catch (err) { res.status(500).json({ status: false, response: String(err) }); }
});

// -------------------- Media Messages --------------------

// GIF message
// POST /messages/send-gif { sender, number, url, caption }
router.post('/send-gif', async (req, res) => {
    const { sender, number, url, caption } = req.body;
    const session = getSession(req);
    if (!session?.sock) return res.status(401).json({ status: false, response: 'Session belum login' });
    try {
        const sent = await session.sock.sendMessage(jid(number), { video: { url }, gifPlayback: true, caption: caption || '' });
        log(req, sender, jid(number), 'videoMessage', caption || '', sent?.key?.id);
        res.json({ status: true, response: sent });
    } catch (err) { res.status(500).json({ status: false, response: String(err) }); }
});

// Video message
// POST /messages/send-video { sender, number, url, caption }
router.post('/send-video', async (req, res) => {
    const { sender, number, url, caption } = req.body;
    const session = getSession(req);
    if (!session?.sock) return res.status(401).json({ status: false, response: 'Session belum login' });
    try {
        const sent = await session.sock.sendMessage(jid(number), { video: { url }, caption: caption || '' });
        log(req, sender, jid(number), 'videoMessage', caption || '', sent?.key?.id);
        res.json({ status: true, response: sent });
    } catch (err) { res.status(500).json({ status: false, response: String(err) }); }
});

// Audio message
// POST /messages/send-audio { sender, number, url, ptt }
router.post('/send-audio', async (req, res) => {
    const { sender, number, url, ptt } = req.body;
    const session = getSession(req);
    if (!session?.sock) return res.status(401).json({ status: false, response: 'Session belum login' });
    try {
        const sent = await session.sock.sendMessage(jid(number), { audio: { url }, mimetype: 'audio/mp4', ptt: ptt !== false });
        log(req, sender, jid(number), 'audioMessage', '', sent?.key?.id);
        res.json({ status: true, response: sent });
    } catch (err) { res.status(500).json({ status: false, response: String(err) }); }
});

// Image message
// POST /messages/send-image { sender, number, url, caption }
router.post('/send-image', async (req, res) => {
    const { sender, number, url, caption } = req.body;
    const session = getSession(req);
    if (!session?.sock) return res.status(401).json({ status: false, response: 'Session belum login' });
    try {
        const sent = await session.sock.sendMessage(jid(number), { image: { url }, caption: caption || '' });
        log(req, sender, jid(number), 'imageMessage', caption || '', sent?.key?.id);
        res.json({ status: true, response: sent });
    } catch (err) { res.status(500).json({ status: false, response: String(err) }); }
});

// View Once message (image/video)
// POST /messages/send-viewonce { sender, number, url, mediaType, caption }
router.post('/send-viewonce', async (req, res) => {
    const { sender, number, url, mediaType, caption } = req.body;
    const session = getSession(req);
    if (!session?.sock) return res.status(401).json({ status: false, response: 'Session belum login' });
    const type = mediaType === 'video' ? 'video' : 'image';
    try {
        const sent = await session.sock.sendMessage(jid(number), { [type]: { url }, viewOnce: true, caption: caption || '' });
        log(req, sender, jid(number), `${type}Message`, caption || '', sent?.key?.id);
        res.json({ status: true, response: sent });
    } catch (err) { res.status(500).json({ status: false, response: String(err) }); }
});

// -------------------- Modify Messages --------------------

// Delete message for everyone
// POST /messages/delete { sender, number, msgId, fromMe }
router.post('/delete', async (req, res) => {
    const { sender, number, msgId, fromMe } = req.body;
    const session = getSession(req);
    if (!session?.sock) return res.status(401).json({ status: false, response: 'Session belum login' });
    try {
        await session.sock.sendMessage(jid(number), {
            delete: { remoteJid: jid(number), id: msgId, fromMe: !!fromMe }
        });
        res.json({ status: true });
    } catch (err) { res.status(500).json({ status: false, response: String(err) }); }
});

// Edit message
// POST /messages/edit { sender, number, msgId, newText }
router.post('/edit', async (req, res) => {
    const { sender, number, msgId, newText } = req.body;
    const session = getSession(req);
    if (!session?.sock) return res.status(401).json({ status: false, response: 'Session belum login' });
    try {
        await session.sock.sendMessage(jid(number), {
            edit: { remoteJid: jid(number), id: msgId, fromMe: true },
            text: newText
        });
        res.json({ status: true });
    } catch (err) { res.status(500).json({ status: false, response: String(err) }); }
});

// -------------------- Media Manipulation --------------------

// Download media from message
// POST /messages/download-media { sender, msgContent }
router.post('/download-media', async (req, res) => {
    const { sender, msgContent } = req.body;
    const session = getSession(req);
    if (!session?.sock) return res.status(401).json({ status: false, response: 'Session belum login' });
    try {
        const { downloadMediaMessage } = require('baileys');
        const buffer = await downloadMediaMessage(
            { message: msgContent },
            'buffer',
            {},
            { logger: req.app.locals.logger, reuploadRequest: session.sock.updateMediaMessage }
        );
        res.json({ status: true, data: buffer.toString('base64') });
    } catch (err) { res.status(500).json({ status: false, response: String(err) }); }
});

// Re-upload media to WhatsApp
// POST /messages/reupload-media { sender, msgKey, msgContent }
router.post('/reupload-media', async (req, res) => {
    const { sender, msgKey, msgContent } = req.body;
    const session = getSession(req);
    if (!session?.sock) return res.status(401).json({ status: false, response: 'Session belum login' });
    try {
        const updated = await session.sock.updateMediaMessage({ key: msgKey, message: msgContent });
        res.json({ status: true, response: updated });
    } catch (err) { res.status(500).json({ status: false, response: String(err) }); }
});

// -------------------- Reject Call --------------------

// POST /messages/reject-call { sender, callId, callFrom }
router.post('/reject-call', async (req, res) => {
    const { sender, callId, callFrom } = req.body;
    const session = getSession(req);
    if (!session?.sock) return res.status(401).json({ status: false, response: 'Session belum login' });
    try {
        await session.sock.rejectCall(callId, callFrom);
        res.json({ status: true });
    } catch (err) { res.status(500).json({ status: false, response: String(err) }); }
});

// -------------------- Send States --------------------

// Read messages
// POST /messages/read { sender, keys: [{id, remoteJid, fromMe}] }
router.post('/read', async (req, res) => {
    const { sender, keys } = req.body;
    const session = getSession(req);
    if (!session?.sock) return res.status(401).json({ status: false, response: 'Session belum login' });
    if (!Array.isArray(keys)) return res.status(400).json({ status: false, response: 'keys array wajib diisi' });
    try {
        await session.sock.readMessages(keys);
        res.json({ status: true });
    } catch (err) { res.status(500).json({ status: false, response: String(err) }); }
});

// Update presence
// POST /messages/presence { sender, number, presence }
// presence: 'available'|'unavailable'|'composing'|'recording'|'paused'
router.post('/presence', async (req, res) => {
    const { sender, number, presence } = req.body;
    const session = getSession(req);
    if (!session?.sock) return res.status(401).json({ status: false, response: 'Session belum login' });
    const valid = ['available', 'unavailable', 'composing', 'recording', 'paused'];
    if (!valid.includes(presence)) return res.status(400).json({ status: false, response: 'presence tidak valid' });
    try {
        await session.sock.sendPresenceUpdate(presence, jid(number));
        res.json({ status: true });
    } catch (err) { res.status(500).json({ status: false, response: String(err) }); }
});

module.exports = router;
