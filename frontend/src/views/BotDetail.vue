<template>
  <div class="layout">
    <header class="app-header" role="banner">
      <router-link to="/dashboard" class="brand"><ArrowLeft :size="16" /> Dashboard</router-link>
      <span class="username">Bot: {{ credkey }}</span>
    </header>

    <main class="app-main">
      <div class="detail-container">
        
        <!-- Row 1: Status & API -->
        <div class="detail-row">
          <div class="card card-status">
            <h3>Status Koneksi</h3>
            <div class="status-row">
              <span :class="['badge', statusClass]" :aria-label="`Status: ${statusLabel}`">{{ statusLabel }}</span>
              <!-- ponytail: disable when connected/reconnecting — no point re-triggering -->
              <button class="btn btn-primary btn-sm" @click="startSession"
                :disabled="starting || sessionState === 'connected' || sessionState === 'reconnecting'">
                {{ starting ? 'Memulai...' : 'Hubungkan' }}
              </button>
              <button class="btn btn-danger btn-sm" @click="doLogout" :disabled="logouting || sessionState === 'offline'">
                {{ logouting ? 'Memutus...' : 'Putuskan' }}
              </button>
            </div>
            <label class="sync-toggle" v-if="sessionState === 'offline'">
              <input type="checkbox" v-model="syncHistory" />
              Sync riwayat chat lama
            </label>
            <div v-if="qrUrl" class="qr-wrap">
              <p class="qr-hint">Scan QR dengan WhatsApp kamu:</p>
              <img :src="qrUrl" alt="QR Code untuk menghubungkan WhatsApp" width="220" height="220" />
              <button class="btn btn-secondary btn-sm" @click="refreshQr">Refresh QR</button>
            </div>
            <p v-else-if="sessionState === 'connected'" class="status-ok">WhatsApp terhubung.</p>
            <p v-else class="status-hint">Klik Hubungkan untuk memulai sesi WhatsApp.</p>
          </div>

          <div class="card card-api">
            <h3>API Key</h3>
            <div class="api-key-row">
              <code :title="bot?.api_key">{{ bot?.api_key }}</code>
              <button class="btn-icon" @click="copyKey"
                :title="copied ? 'Tersalin!' : 'Salin API Key'"
                :aria-label="copied ? 'API key tersalin' : 'Salin API key'">
                <Check v-if="copied" :size="16" />
                <Clipboard v-else :size="16" />
              </button>
            </div>
            <button class="btn btn-secondary btn-sm mt" @click="regenKey" :disabled="regening">
              {{ regening ? 'Regenerating...' : 'Regenerate Key' }}
            </button>
            <p v-if="regenError" class="alert-error mt"><span>{{ regenError }}</span></p>

            <h3 class="mt">Info</h3>
            <table class="info-table" aria-label="Informasi bot">
              <tbody>
                <tr><td>Bot ID</td><td>{{ bot?.credkey }}</td></tr>
                <tr><td>Nomor HP</td><td>{{ bot?.phone || '-' }}</td></tr>
                <tr><td>Dibuat</td><td>{{ formatDate(bot?.created_at) }}</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Row 2: Webhook & Send -->
        <div class="detail-row">
          <div class="card card-webhook">
            <h3>Webhook</h3>
            <p class="section-hint">URL yang akan menerima pesan masuk dari bot ini.</p>
            <form @submit.prevent="saveWebhook" class="webhook-form">
              <div class="field">
                <label for="webhook-url">Webhook URL</label>
                <input
                  id="webhook-url"
                  v-model="webhookUrl"
                  type="url"
                  placeholder="https://your-server.com/webhook"
                />
              </div>
              <div class="webhook-actions">
                <button type="submit" class="btn btn-primary btn-sm" :disabled="savingWebhook">
                  {{ savingWebhook ? 'Menyimpan...' : 'Simpan' }}
                </button>
                <button type="button" class="btn btn-secondary btn-sm" @click="clearWebhook" :disabled="savingWebhook">
                  Hapus
                </button>
              </div>
            </form>
            <p v-if="webhookMsg" class="status-ok mt">{{ webhookMsg }}</p>
          </div>

          <div class="card card-send">
            <h3>Kirim Pesan</h3>
            <form @submit.prevent="sendMessage" class="send-form">
              <div class="field">
                <label for="send-to">Nomor / Group ID</label>
                <input id="send-to" v-model="sendTo" type="text" placeholder="628123456789 atau group@g.us" required />
              </div>
              <div class="field">
                <label for="send-text">Pesan</label>
                <textarea id="send-text" v-model="sendText" rows="3" placeholder="Tulis pesan..." required></textarea>
              </div>
              <p v-if="sendError" class="alert-error"><span>{{ sendError }}</span></p>
              <p v-if="sendOk" class="status-ok">Pesan terkirim!</p>
              <button type="submit" class="btn btn-primary btn-sm" :disabled="sending || sessionState !== 'connected'">
                {{ sending ? 'Mengirim...' : 'Kirim' }}
              </button>
              <p v-if="sessionState !== 'connected'" class="status-hint">Hubungkan bot terlebih dahulu.</p>
            </form>
          </div>
        </div>

      </div>

      <!-- Message Log -->
      <div class="card mt-section">
        <div class="log-header">
          <h3>Log Pesan</h3>
          <button class="btn btn-secondary btn-sm" @click="fetchMessages">Refresh</button>
        </div>
        <div v-if="messages.length === 0" class="status-hint">Belum ada pesan.</div>
        <div v-else class="log-table-wrap">
          <table class="log-table" aria-label="Log pesan">
            <thead>
              <tr>
                <th>Waktu</th>
                <th>Arah</th>
                <th>JID</th>
                <th>Tipe</th>
                <th>Pesan</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="m in messages" :key="m.id">
                <td>{{ formatDate(m.created_at) }}</td>
                <td><span :class="m.direction === 'in' ? 'badge badge-green' : 'badge badge-yellow'">{{ m.direction }}</span></td>
                <td class="jid">{{ m.jid }}</td>
                <td>{{ m.message_type }}</td>
                <td class="msg-text">{{ m.text }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Clipboard, Check } from 'lucide-vue-next'
import api from '../api'

const route    = useRoute()
const router   = useRouter()
const credkey  = route.params.credkey

const bot          = ref(null)
const sessionState = ref('offline')
const qrUrl        = ref(null)
const starting     = ref(false)
const syncHistory  = ref(false)
const logouting    = ref(false)
const regening     = ref(false)
const regenError   = ref('')
const copied       = ref(false)

// webhook
const webhookUrl   = ref('')
const savingWebhook = ref(false)
const webhookMsg   = ref('')

// send message
const sendTo    = ref('')
const sendText  = ref('')
const sending   = ref(false)
const sendError = ref('')
const sendOk    = ref(false)

// message log
const messages = ref([])

let pollTimer = null

const statusClass = computed(() => {
  // ponytail: reconnecting = yellow same as qr, distinct from offline
  const map = { connected: 'badge-green', qr: 'badge-yellow', reconnecting: 'badge-yellow', offline: 'badge-red' }
  return map[sessionState.value] || 'badge-red'
})
const statusLabel = computed(() => {
  const map = { connected: 'Online', qr: 'Scan QR', reconnecting: 'Menghubungkan...', offline: 'Offline' }
  return map[sessionState.value] || 'Offline'
})

function formatDate(iso) {
  if (!iso) return '-'
  return new Date(iso).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })
}

async function fetchBot() {
  try {
    const { data } = await api.get(`/bots/${credkey}`)
    bot.value = data.data ?? data
    webhookUrl.value = bot.value?.webhook_url || ''
  } catch (e) {
    if (e.response?.status === 401) router.push('/login')
  }
}

async function fetchStatus() {
  try {
    const { data } = await api.get(`/status?sender=${credkey}`)
    // ponytail: 'disconnected' and unknown state both map to offline
    const known = ['connected', 'qr', 'reconnecting', 'offline']
    sessionState.value = known.includes(data.state) ? data.state : 'offline'
    // ponytail: /get-qr returns PNG directly, no need to convert — just point img src at it
    qrUrl.value = data.state === 'qr' ? `/get-qr?sender=${credkey}&t=${Date.now()}` : null
  } catch {
    // non-fatal poll failure
  }
}

async function fetchMessages() {
  try {
    const { data } = await api.get(`/bots/${credkey}/messages`)
    messages.value = data.data ?? []
  } catch {
    // non-fatal
  }
}

async function startSession() {
  // ponytail: skip if already connected — avoids spurious "Memulai..." flicker
  if (sessionState.value === 'connected') return
  starting.value = true
  try {
    const { data } = await api.post('/create-session', { sender: credkey, syncHistory: syncHistory.value })
    // backend says already running → just refresh status once, no need to wait for QR
    if (data.started === false) { await fetchStatus(); return }
    // new session started — poll 3x with backoff, baileys needs ~2-4s to emit QR
    setTimeout(fetchStatus, 2000)
    setTimeout(fetchStatus, 4000)
    setTimeout(fetchStatus, 7000)
  } catch {
    // poll will reflect real state
  } finally {
    starting.value = false
  }
}

async function doLogout() {
  logouting.value = true
  try {
    await api.post('/logout', { sender: credkey })
    sessionState.value = 'offline'
    qrUrl.value = null
  } catch {
    // non-fatal
  } finally {
    logouting.value = false
  }
}

function refreshQr() { qrUrl.value = null; fetchStatus() }

async function copyKey() {
  try {
    await navigator.clipboard.writeText(bot.value?.api_key)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {}
}

async function regenKey() {
  if (!confirm('Regenerate API key? Key lama akan langsung tidak berlaku.')) return
  regening.value = true
  try {
    const { data } = await api.post(`/bots/${credkey}/regenerate-key`)
    bot.value = { ...bot.value, api_key: data.api_key }
    regenError.value = ''
  } catch {
    regenError.value = 'Gagal regenerate key. Coba lagi.'
  } finally {
    regening.value = false
  }
}

async function saveWebhook() {
  savingWebhook.value = true
  webhookMsg.value = ''
  try {
    await api.post('/set-webhook', { sender: credkey, webhookUrl: webhookUrl.value })
    webhookMsg.value = 'Webhook disimpan.'
    setTimeout(() => { webhookMsg.value = '' }, 3000)
  } catch {
    webhookMsg.value = 'Gagal menyimpan webhook.'
  } finally {
    savingWebhook.value = false
  }
}

async function clearWebhook() {
  savingWebhook.value = true
  try {
    await api.post('/set-webhook', { sender: credkey, webhookUrl: '' })
    webhookUrl.value = ''
    webhookMsg.value = 'Webhook dihapus.'
    setTimeout(() => { webhookMsg.value = '' }, 3000)
  } catch {} finally {
    savingWebhook.value = false
  }
}

async function sendMessage() {
  sendError.value = ''
  sendOk.value = false
  sending.value = true
  try {
    // ponytail: reuse api_key from bot for send-message endpoint
    await api.post('/send-message', {
      sender: credkey,
      number: sendTo.value,
      message: sendText.value
    }, { headers: { 'x-api-key': bot.value?.api_key } })
    sendOk.value = true
    sendText.value = ''
    setTimeout(() => { sendOk.value = false }, 3000)
    fetchMessages()
  } catch (e) {
    sendError.value = e.response?.data?.message || 'Gagal mengirim pesan.'
  } finally {
    sending.value = false
  }
}

onMounted(async () => {
  await Promise.all([fetchBot(), fetchStatus(), fetchMessages()])
  pollTimer = setInterval(fetchStatus, 5000)
})

onUnmounted(() => clearInterval(pollTimer))
</script>

<style scoped>
.detail-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.detail-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
.card h3 {
  font-size: 0.9375rem;
  font-weight: 600;
  margin-bottom: 0.875rem;
  color: var(--color-text);
}
.status-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}
.qr-wrap {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.625rem;
  margin-top: 0.5rem;
}
.qr-hint,
.section-hint { font-size: 0.875rem; color: var(--color-text-muted); margin-bottom: 0.75rem; }
.qr-wrap img {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  display: block;
}
.status-ok   { color: var(--color-success); font-size: 0.875rem; }
.status-hint { color: var(--color-text-muted); font-size: 0.875rem; margin-top: 0.5rem; }
.sync-toggle { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; margin-top: 0.75rem; cursor: pointer; }
.sync-toggle input[type="checkbox"] { cursor: pointer; }

.webhook-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.webhook-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.send-form { display: flex; flex-direction: column; gap: 0.75rem; }

.mt-section { margin-top: 1.25rem; }
.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.875rem;
}
.log-table-wrap { overflow-x: auto; }
.log-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;
}
.log-table th, .log-table td {
  text-align: left;
  padding: 0.4rem 0.6rem;
  border-bottom: 1px solid var(--color-border);
}
.log-table th { color: var(--color-text-muted); font-weight: 500; }
.jid { font-family: monospace; font-size: 0.75rem; }
.msg-text { max-width: 240px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.btn-sm { padding: 0.375rem 0.75rem; font-size: 0.875rem; }
.mt { margin-top: 1rem; }

@media (max-width: 768px) {
  .detail-row {
    grid-template-columns: 1fr;
  }
}
</style>
