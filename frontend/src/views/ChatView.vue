<template>
  <div class="wa-layout">
    <!-- Sidebar: daftar chat -->
    <aside class="wa-sidebar">
      <div class="wa-sidebar-header">
        <div class="wa-sidebar-title">
          <MessageSquare :size="18" />
          <span>{{ credkey }}</span>
        </div>
        <div class="wa-status-dot" :class="connected ? 'online' : 'offline'" :title="connected ? 'Terhubung' : 'Tidak terhubung'"></div>
      </div>

      <div class="wa-search">
        <input v-model="search" type="search" placeholder="Cari chat..." aria-label="Cari chat" />
      </div>

      <div class="wa-chat-list" role="list">
        <div v-if="!chatList.length" class="wa-empty-list">
          <span>Belum ada chat</span>
        </div>
        <button
          v-for="chat in filteredChats"
          :key="chat.jid"
          class="wa-chat-item"
          :class="{ active: activeJid === chat.jid }"
          @click="selectChat(chat)"
          role="listitem"
          :aria-label="`Chat dengan ${formatJid(chat.jid)}`"
        >
          <div class="wa-avatar" :aria-hidden="true">{{ avatarLetter(chat.jid) }}</div>
          <div class="wa-chat-info">
            <div class="wa-chat-name">{{ formatJid(chat.jid) }}</div>
            <div class="wa-chat-preview">
              <span class="wa-preview-dir" v-if="chat.last_direction === 'out'">Kamu: </span>
              <span>{{ chat.last_text || mediaLabel(chat.last_type) }}</span>
            </div>
          </div>
          <div class="wa-chat-meta">
            <span class="wa-chat-time">{{ formatTime(chat.last_time) }}</span>
          </div>
        </button>
      </div>
    </aside>

    <!-- Main: chat window -->
    <main class="wa-main">
      <!-- Belum pilih chat -->
      <div v-if="!activeJid" class="wa-welcome">
        <MessageSquare :size="48" class="wa-welcome-icon" aria-hidden="true" />
        <p>Pilih chat untuk mulai</p>
      </div>

      <!-- Chat aktif -->
      <template v-else>
        <!-- Chat header -->
        <div class="wa-chat-header">
          <div class="wa-avatar sm" aria-hidden="true">{{ avatarLetter(activeJid) }}</div>
          <div>
            <div class="wa-chat-name">{{ formatJid(activeJid) }}</div>
            <div class="wa-chat-sub">{{ activeJid }}</div>
          </div>
        </div>

        <!-- Messages -->
        <div class="wa-messages" ref="messagesEl" role="log" aria-live="polite" aria-label="Pesan">
          <div v-if="loadingMsgs" class="wa-msg-loading">Memuat pesan...</div>
          <template v-else>
            <div
              v-for="msg in messages"
              :key="msg.id"
              :class="['wa-bubble', msg.direction === 'out' ? 'out' : 'in']"
            >
              <div class="wa-bubble-text">
                <span v-if="!msg.text" class="wa-media-label">{{ mediaLabel(msg.message_type) }}</span>
                <span v-else>{{ msg.text }}</span>
              </div>
              <div class="wa-bubble-time">{{ formatTime(msg.created_at) }}</div>
            </div>
          </template>
        </div>

        <!-- Input area -->
        <form class="wa-input-area" @submit.prevent="sendMessage" aria-label="Kirim pesan">
          <label class="wa-attach-btn" title="Kirim gambar" aria-label="Kirim gambar">
            <Image :size="20" />
            <input type="file" accept="image/*,video/*" @change="onFileChange" class="sr-only" />
          </label>
          <input
            v-model="inputText"
            type="text"
            class="wa-input"
            placeholder="Ketik pesan..."
            :disabled="sending"
            aria-label="Ketik pesan"
            @keydown.enter.exact.prevent="sendMessage"
          />
          <button type="submit" class="wa-send-btn" :disabled="sending || (!inputText.trim() && !pendingFile)" aria-label="Kirim">
            <Send :size="18" />
          </button>
        </form>

        <!-- Preview file -->
        <div v-if="pendingFile" class="wa-file-preview">
          <img v-if="pendingFileType === 'image'" :src="pendingFileUrl" alt="Preview" />
          <span v-else>{{ pendingFile.name }}</span>
          <button @click="clearFile" aria-label="Hapus file">✕</button>
        </div>

        <p v-if="sendError" class="wa-send-error" role="alert">{{ sendError }}</p>
      </template>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import { MessageSquare, Send, Image } from 'lucide-vue-next'
import api from '../api.js'

const route = useRoute()
const credkey = route.params.credkey

// state
const chatList = ref([])
const messages = ref([])
const activeJid = ref(null)
const activeChat = ref(null)
const search = ref('')
const inputText = ref('')
const sending = ref(false)
const sendError = ref('')
const loadingMsgs = ref(false)
const connected = ref(false)
const pendingFile = ref(null)
const pendingFileUrl = ref(null)
const pendingFileType = ref(null)
const messagesEl = ref(null)

// SSE
let sse = null
const apiKey = ref('')

// computed
const filteredChats = computed(() => {
  if (!search.value) return chatList.value
  const q = search.value.toLowerCase()
  return chatList.value.filter(c => c.jid.toLowerCase().includes(q) || (c.last_text || '').toLowerCase().includes(q))
})

// helpers
function formatJid(jid) {
  if (!jid) return ''
  return jid.replace('@s.whatsapp.net', '').replace('@g.us', ' (Grup)')
}
function avatarLetter(jid) {
  return formatJid(jid).charAt(0).toUpperCase() || '?'
}
function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' })
}
function mediaLabel(type) {
  const map = { imageMessage: '🖼 Gambar', videoMessage: '🎥 Video', audioMessage: '🎵 Audio', documentMessage: '📄 Dokumen', stickerMessage: '🎴 Sticker' }
  return map[type] || type || ''
}

// load chat list
async function loadChatList() {
  try {
    const res = await api.get('/chat-list', { params: { sender: credkey }, headers: { 'x-api-key': apiKey.value } })
    chatList.value = res.data.data || []
  } catch {}
}

// load messages for active chat
async function loadMessages(jid) {
  loadingMsgs.value = true
  messages.value = []
  try {
    // ponytail: filter by jid in backend now, no client-side filter needed
    const res = await api.get(`/bots/${credkey}/messages`, { params: { jid, limit: 100 } })
    messages.value = (res.data.data || []).reverse()
  } catch {}
  loadingMsgs.value = false
  await nextTick()
  scrollBottom()
}

function scrollBottom() {
  if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight
}

async function selectChat(chat) {
  activeJid.value = chat.jid
  activeChat.value = chat
  sendError.value = ''
  await loadMessages(chat.jid)
}

// send message
async function sendMessage() {
  if (sending.value) return
  const text = inputText.value.trim()
  if (!text && !pendingFile.value) return
  sending.value = true
  sendError.value = ''
  // ponytail: detect group from jid suffix
  const isGroup = activeJid.value?.endsWith('@g.us')
  try {
    if (pendingFile.value) {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64 = e.target.result
        const isVideo = pendingFile.value.type.startsWith('video')
        const endpoint = isVideo ? '/messages/send-video' : '/messages/send-image'
        const payload = isGroup
          ? { sender: credkey, groupId: activeJid.value, url: base64, caption: text }
          : { sender: credkey, number: activeJid.value, url: base64, caption: text }
        await api.post(endpoint, payload, { headers: { 'x-api-key': apiKey.value } })
        messages.value.push({ direction: 'out', text: text || mediaLabel(isVideo ? 'videoMessage' : 'imageMessage'), message_type: isVideo ? 'videoMessage' : 'imageMessage', created_at: new Date().toISOString() })
        clearFile()
        inputText.value = ''
        await nextTick(); scrollBottom()
      }
      reader.readAsDataURL(pendingFile.value)
    } else {
      const endpoint = isGroup ? '/send-group-message' : '/send-message'
      const payload = isGroup
        ? { sender: credkey, groupId: activeJid.value, message: text }
        : { sender: credkey, number: activeJid.value, message: text }
      await api.post(endpoint, payload, { headers: { 'x-api-key': apiKey.value } })
      messages.value.push({ direction: 'out', text, message_type: 'text', created_at: new Date().toISOString() })
      inputText.value = ''
      await nextTick(); scrollBottom()
    }
  } catch (err) {
    sendError.value = err?.response?.data?.response || 'Gagal mengirim pesan'
  }
  sending.value = false
}

function onFileChange(e) {
  const file = e.target.files[0]
  if (!file) return
  pendingFile.value = file
  pendingFileUrl.value = URL.createObjectURL(file)
  pendingFileType.value = file.type.startsWith('video') ? 'video' : 'image'
}
function clearFile() {
  pendingFile.value = null
  pendingFileUrl.value = null
  pendingFileType.value = null
}

// SSE setup
function setupSSE() {
  const token = localStorage.getItem('token')
  sse = new EventSource(`/events/${credkey}?token=${token}`)
  sse.addEventListener('connection', e => {
    const d = JSON.parse(e.data)
    connected.value = d.state === 'connected'
  })
  sse.addEventListener('message', e => {
    const d = JSON.parse(e.data)
    // ponytail: normalize jid for compare — backend strips suffix for personal
    const fromNorm = d.from?.replace('@s.whatsapp.net', '').replace('@c.us', '') || d.from
    const typeLabel = d.messageType && d.messageType !== 'unknown' ? mediaLabel(d.messageType) : d.text
    // update chat list
    const idx = chatList.value.findIndex(c =>
      c.jid === d.from || c.jid === fromNorm
    )
    if (idx >= 0) {
      chatList.value[idx].last_text = d.text || typeLabel
      chatList.value[idx].last_time = new Date().toISOString()
      chatList.value[idx].last_direction = 'in'
    } else {
      chatList.value.unshift({ jid: d.from, last_text: d.text || typeLabel, last_time: new Date().toISOString(), last_direction: 'in', last_type: d.messageType })
    }
    // tambah ke messages jika chat sedang aktif — update jika messageId sama (baileys kirim 2x)
    const activeNorm = activeJid.value?.replace('@s.whatsapp.net', '').replace('@c.us', '')
    if (activeJid.value === d.from || activeNorm === fromNorm) {
      const existing = d.messageId ? messages.value.findIndex(m => m.message_id === d.messageId) : -1
      if (existing >= 0) {
        // ponytail: in-place update — baileys may emit partial then full message
        if (d.text) messages.value[existing].text = d.text
        if (d.messageType && d.messageType !== 'unknown') messages.value[existing].message_type = d.messageType
      } else {
        messages.value.push({ direction: 'in', text: d.text, message_type: d.messageType, message_id: d.messageId, created_at: new Date().toISOString() })
        nextTick().then(scrollBottom)
      }
    }
  })
  sse.onerror = () => { connected.value = false }
}

onMounted(async () => {
  // ambil api_key dari bot detail
  try {
    const res = await api.get(`/bots/${credkey}`)
    apiKey.value = res.data.data?.api_key || ''
  } catch {}
  await loadChatList()
  setupSSE()
})

onUnmounted(() => {
  if (sse) sse.close()
})
</script>

<style scoped>
.wa-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: #f0f2f5;
}

/* Sidebar */
.wa-sidebar {
  width: 360px;
  min-width: 260px;
  background: #fff;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.wa-sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1rem;
  background: #4f46e5;
  color: #fff;
  gap: 0.5rem;
}
.wa-sidebar-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 0.9375rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.wa-status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
.wa-status-dot.online { background: #4ade80; }
.wa-status-dot.offline { background: #f87171; }

.wa-search {
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid #f0f2f5;
}
.wa-search input {
  width: 100%;
  padding: 0.4rem 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 99px;
  font-size: 0.875rem;
  background: #f0f2f5;
  outline: none;
}
.wa-search input:focus { border-color: #4f46e5; background: #fff; }

.wa-chat-list {
  flex: 1;
  overflow-y: auto;
}
.wa-empty-list {
  padding: 2rem 1rem;
  text-align: center;
  color: #9ca3af;
  font-size: 0.875rem;
}
.wa-chat-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  border-bottom: 1px solid #f0f2f5;
  cursor: pointer;
  transition: background 120ms;
}
.wa-chat-item:hover { background: #f9fafb; }
.wa-chat-item.active { background: #eef2ff; }

.wa-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: #4f46e5;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1rem;
  flex-shrink: 0;
}
.wa-avatar.sm { width: 36px; height: 36px; font-size: 0.875rem; }

.wa-chat-info {
  flex: 1;
  min-width: 0;
}
.wa-chat-name {
  font-weight: 500;
  font-size: 0.9375rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.wa-chat-preview {
  font-size: 0.8125rem;
  color: #6b7280;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.wa-preview-dir { color: #4f46e5; }
.wa-chat-meta { flex-shrink: 0; }
.wa-chat-time { font-size: 0.75rem; color: #9ca3af; }

/* Main */
.wa-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.wa-welcome {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  gap: 1rem;
}
.wa-welcome-icon { opacity: 0.3; }

.wa-chat-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
}
.wa-chat-sub { font-size: 0.75rem; color: #9ca3af; }

.wa-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  background: #efeae2;
}
.wa-msg-loading { text-align: center; color: #9ca3af; font-size: 0.875rem; margin-top: 2rem; }

.wa-bubble {
  max-width: 65%;
  padding: 0.5rem 0.75rem 0.25rem;
  border-radius: 8px;
  font-size: 0.9375rem;
  line-height: 1.4;
  word-break: break-word;
}
.wa-bubble.in {
  background: #fff;
  align-self: flex-start;
  border-bottom-left-radius: 2px;
}
.wa-bubble.out {
  background: #d9fdd3;
  align-self: flex-end;
  border-bottom-right-radius: 2px;
}
.wa-bubble-time {
  font-size: 0.6875rem;
  color: #9ca3af;
  text-align: right;
  margin-top: 0.2rem;
}
.wa-media-label { color: #6b7280; font-style: italic; }

/* Input area */
.wa-input-area {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: #f0f2f5;
  border-top: 1px solid #e5e7eb;
}
.wa-attach-btn {
  cursor: pointer;
  color: #6b7280;
  display: flex;
  align-items: center;
  padding: 0.25rem;
  border-radius: 50%;
  transition: color 120ms, background 120ms;
}
.wa-attach-btn:hover { color: #4f46e5; background: #eef2ff; }
.wa-input {
  flex: 1;
  padding: 0.5rem 0.875rem;
  border: 1px solid #e5e7eb;
  border-radius: 99px;
  font-size: 0.9375rem;
  background: #fff;
  outline: none;
}
.wa-input:focus { border-color: #4f46e5; }
.wa-send-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: none;
  background: #4f46e5;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 120ms, opacity 120ms;
  flex-shrink: 0;
}
.wa-send-btn:hover:not(:disabled) { background: #4338ca; }
.wa-send-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.wa-file-preview {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #fff;
  border-top: 1px solid #e5e7eb;
  font-size: 0.875rem;
}
.wa-file-preview img { height: 60px; border-radius: 4px; object-fit: cover; }
.wa-file-preview button { background: none; border: none; cursor: pointer; color: #6b7280; font-size: 1rem; }

.wa-send-error {
  padding: 0.375rem 1rem;
  font-size: 0.8125rem;
  color: #dc2626;
  background: #fef2f2;
}

/* Accessibility */
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; }

/* Responsive */
@media (max-width: 640px) {
  .wa-sidebar { width: 100%; position: absolute; z-index: 10; }
  .wa-sidebar.hidden { display: none; }
}
</style>
