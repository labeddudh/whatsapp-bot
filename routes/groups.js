const express = require('express');
const router = express.Router();

function getSession(req) {
    return req.app.locals.sessionMap.get(req.body.sender || req.query.sender);
}

// Create group
// POST /groups/create { sender, name, participants: ['628xxx'] }
router.post('/create', async (req, res) => {
    const { sender, name, participants } = req.body;
    const session = getSession(req);
    if (!session?.sock) return res.status(401).json({ status: false, response: 'Session belum login' });
    if (!name || !Array.isArray(participants) || !participants.length)
        return res.status(400).json({ status: false, response: 'name dan participants wajib diisi' });
    try {
        const result = await session.sock.groupCreate(name, participants.map(p => {
            if (p.includes('@')) return p;
            let n = String(p).replace(/\D/g, '');
            if (n.startsWith('0')) n = '62' + n.slice(1);
            return n + '@s.whatsapp.net';
        }));
        res.json({ status: true, data: result });
    } catch (err) { res.status(500).json({ status: false, response: String(err) }); }
});

// Add/remove participants
// POST /groups/participants { sender, groupId, action: 'add'|'remove', participants: [] }
router.post('/participants', async (req, res) => {
    const { sender, groupId, action, participants } = req.body;
    const session = getSession(req);
    if (!session?.sock) return res.status(401).json({ status: false, response: 'Session belum login' });
    if (!['add', 'remove'].includes(action))
        return res.status(400).json({ status: false, response: 'action harus add atau remove' });
    try {
        const jids = participants.map(p => {
            if (p.includes('@')) return p;
            let n = String(p).replace(/\D/g, '');
            if (n.startsWith('0')) n = '62' + n.slice(1);
            return n + '@s.whatsapp.net';
        });
        const result = await session.sock.groupParticipantsUpdate(groupId, jids, action);
        res.json({ status: true, data: result });
    } catch (err) { res.status(500).json({ status: false, response: String(err) }); }
});

// Promote/demote participants
// POST /groups/promote-demote { sender, groupId, action: 'promote'|'demote', participants: [] }
router.post('/promote-demote', async (req, res) => {
    const { sender, groupId, action, participants } = req.body;
    const session = getSession(req);
    if (!session?.sock) return res.status(401).json({ status: false, response: 'Session belum login' });
    if (!['promote', 'demote'].includes(action))
        return res.status(400).json({ status: false, response: 'action harus promote atau demote' });
    try {
        const jids = participants.map(p => {
            if (p.includes('@')) return p;
            let n = String(p).replace(/\D/g, '');
            if (n.startsWith('0')) n = '62' + n.slice(1);
            return n + '@s.whatsapp.net';
        });
        const result = await session.sock.groupParticipantsUpdate(groupId, jids, action);
        res.json({ status: true, data: result });
    } catch (err) { res.status(500).json({ status: false, response: String(err) }); }
});

// Change group subject (name)
// POST /groups/subject { sender, groupId, subject }
router.post('/subject', async (req, res) => {
    const { sender, groupId, subject } = req.body;
    const session = getSession(req);
    if (!session?.sock) return res.status(401).json({ status: false, response: 'Session belum login' });
    try {
        await session.sock.groupUpdateSubject(groupId, subject);
        res.json({ status: true });
    } catch (err) { res.status(500).json({ status: false, response: String(err) }); }
});

// Change group description
// POST /groups/description { sender, groupId, description }
router.post('/description', async (req, res) => {
    const { sender, groupId, description } = req.body;
    const session = getSession(req);
    if (!session?.sock) return res.status(401).json({ status: false, response: 'Session belum login' });
    try {
        await session.sock.groupUpdateDescription(groupId, description);
        res.json({ status: true });
    } catch (err) { res.status(500).json({ status: false, response: String(err) }); }
});

// Change group settings
// POST /groups/settings { sender, groupId, setting: 'announcement'|'not_announcement'|'locked'|'unlocked' }
router.post('/settings', async (req, res) => {
    const { sender, groupId, setting } = req.body;
    const session = getSession(req);
    if (!session?.sock) return res.status(401).json({ status: false, response: 'Session belum login' });
    const valid = ['announcement', 'not_announcement', 'locked', 'unlocked'];
    if (!valid.includes(setting))
        return res.status(400).json({ status: false, response: 'setting tidak valid' });
    try {
        await session.sock.groupSettingUpdate(groupId, setting);
        res.json({ status: true });
    } catch (err) { res.status(500).json({ status: false, response: String(err) }); }
});

// Leave group
// POST /groups/leave { sender, groupId }
router.post('/leave', async (req, res) => {
    const { sender, groupId } = req.body;
    const session = getSession(req);
    if (!session?.sock) return res.status(401).json({ status: false, response: 'Session belum login' });
    try {
        await session.sock.groupLeave(groupId);
        res.json({ status: true });
    } catch (err) { res.status(500).json({ status: false, response: String(err) }); }
});

// Get invite code
// GET /groups/invite-code?sender=x&groupId=x
router.get('/invite-code', async (req, res) => {
    const { sender, groupId } = req.query;
    const session = getSession(req);
    if (!session?.sock) return res.status(401).json({ status: false, response: 'Session belum login' });
    try {
        const code = await session.sock.groupInviteCode(groupId);
        res.json({ status: true, code, link: `https://chat.whatsapp.com/${code}` });
    } catch (err) { res.status(500).json({ status: false, response: String(err) }); }
});

// Revoke invite code
// POST /groups/revoke-invite { sender, groupId }
router.post('/revoke-invite', async (req, res) => {
    const { sender, groupId } = req.body;
    const session = getSession(req);
    if (!session?.sock) return res.status(401).json({ status: false, response: 'Session belum login' });
    try {
        const code = await session.sock.groupRevokeInvite(groupId);
        res.json({ status: true, code, link: `https://chat.whatsapp.com/${code}` });
    } catch (err) { res.status(500).json({ status: false, response: String(err) }); }
});

// Join group by invite code
// POST /groups/join { sender, code }
router.post('/join', async (req, res) => {
    const { sender, code } = req.body;
    const session = getSession(req);
    if (!session?.sock) return res.status(401).json({ status: false, response: 'Session belum login' });
    try {
        const result = await session.sock.groupAcceptInvite(code);
        res.json({ status: true, groupId: result });
    } catch (err) { res.status(500).json({ status: false, response: String(err) }); }
});

// Get group info by invite code
// GET /groups/info-by-invite?sender=x&code=x
router.get('/info-by-invite', async (req, res) => {
    const { sender, code } = req.query;
    const session = getSession(req);
    if (!session?.sock) return res.status(401).json({ status: false, response: 'Session belum login' });
    try {
        const info = await session.sock.groupGetInviteInfo(code);
        res.json({ status: true, data: info });
    } catch (err) { res.status(500).json({ status: false, response: String(err) }); }
});

// Get group metadata
// GET /groups/metadata?sender=x&groupId=x
router.get('/metadata', async (req, res) => {
    const { sender, groupId } = req.query;
    const session = getSession(req);
    if (!session?.sock) return res.status(401).json({ status: false, response: 'Session belum login' });
    try {
        const metadata = await session.sock.groupMetadata(groupId);
        res.json({ status: true, data: metadata });
    } catch (err) { res.status(500).json({ status: false, response: String(err) }); }
});

// Join via groupInviteMessage
// POST /groups/join-via-msg { sender, msgKey, msgContent }
router.post('/join-via-msg', async (req, res) => {
    const { sender, msgKey, msgContent } = req.body;
    const session = getSession(req);
    if (!session?.sock) return res.status(401).json({ status: false, response: 'Session belum login' });
    try {
        const result = await session.sock.groupAcceptInviteV4({ key: msgKey, message: msgContent });
        res.json({ status: true, data: result });
    } catch (err) { res.status(500).json({ status: false, response: String(err) }); }
});

// Get request join list
// GET /groups/join-requests?sender=x&groupId=x
router.get('/join-requests', async (req, res) => {
    const { sender, groupId } = req.query;
    const session = getSession(req);
    if (!session?.sock) return res.status(401).json({ status: false, response: 'Session belum login' });
    try {
        const list = await session.sock.groupRequestParticipantsList(groupId);
        res.json({ status: true, data: list });
    } catch (err) { res.status(500).json({ status: false, response: String(err) }); }
});

// Approve/reject join request
// POST /groups/join-request-update { sender, groupId, participants: [], action: 'approve'|'reject' }
router.post('/join-request-update', async (req, res) => {
    const { sender, groupId, participants, action } = req.body;
    const session = getSession(req);
    if (!session?.sock) return res.status(401).json({ status: false, response: 'Session belum login' });
    if (!['approve', 'reject'].includes(action))
        return res.status(400).json({ status: false, response: 'action harus approve atau reject' });
    try {
        const result = await session.sock.groupRequestParticipantsUpdate(groupId, participants, action);
        res.json({ status: true, data: result });
    } catch (err) { res.status(500).json({ status: false, response: String(err) }); }
});

// Get all participating groups metadata
// GET /groups/all?sender=x
router.get('/all', async (req, res) => {
    const { sender } = req.query;
    const session = getSession(req);
    if (!session?.sock) return res.status(401).json({ status: false, response: 'Session belum login' });
    try {
        const groups = await session.sock.groupFetchAllParticipating();
        res.json({ status: true, data: groups });
    } catch (err) { res.status(500).json({ status: false, response: String(err) }); }
});

// Toggle ephemeral (disappearing messages in group)
// POST /groups/ephemeral { sender, groupId, duration } 0=off, 86400, 604800, 7776000
router.post('/ephemeral', async (req, res) => {
    const { sender, groupId, duration } = req.body;
    const session = getSession(req);
    if (!session?.sock) return res.status(401).json({ status: false, response: 'Session belum login' });
    try {
        await session.sock.groupToggleEphemeral(groupId, duration || 0);
        res.json({ status: true });
    } catch (err) { res.status(500).json({ status: false, response: String(err) }); }
});

// Change add mode (who can add members)
// POST /groups/add-mode { sender, groupId, mode: 'all_member_add'|'admin_add' }
router.post('/add-mode', async (req, res) => {
    const { sender, groupId, mode } = req.body;
    const session = getSession(req);
    if (!session?.sock) return res.status(401).json({ status: false, response: 'Session belum login' });
    try {
        await session.sock.groupMemberAddMode(groupId, mode);
        res.json({ status: true });
    } catch (err) { res.status(500).json({ status: false, response: String(err) }); }
});

module.exports = router;
