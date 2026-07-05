<template>
  <div class="layout">
    <header class="app-header" role="banner">
      <span class="brand">WA Bot</span>
      <div class="header-right">
        <router-link to="/docs" class="btn btn-ghost">API Docs</router-link>
        <span class="username">{{ username }}</span>
        <button class="btn btn-ghost" @click="logout">Logout</button>
      </div>
    </header>

    <main class="app-main">
      <div class="top-bar">
        <h2>Bot Saya</h2>
        <button class="btn btn-primary" @click="openDialog">+ Tambah Bot</button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="state-info" role="status" aria-live="polite">
        Memuat bot...
      </div>

      <!-- Empty state -->
      <div v-else-if="!bots.length" class="empty-state">
        <Bot class="empty-icon" aria-hidden="true" :size="48" />
        <h3>Belum ada bot</h3>
        <p>
          Tambahkan bot pertamamu untuk mulai mengirim pesan WhatsApp via API.
          Setiap bot punya API key unik yang bisa kamu pakai di aplikasimu.
        </p>
        <button class="btn btn-primary" @click="openDialog">+ Tambah Bot Pertama</button>
      </div>

      <!-- Bot grid -->
      <div v-else class="bot-grid" role="list">
        <div
          v-for="bot in bots"
          :key="bot.credkey"
          class="card bot-card"
          role="listitem"
        >
          <div class="bot-header">
            <div class="bot-identity">
              <strong>{{ bot.credkey }}</strong>
              <span v-if="bot.phone" class="phone">{{ bot.phone }}</span>
            </div>
            <span :class="['badge', badgeClass(bot.credkey)]" :aria-label="`Status: ${statusLabel(bot.credkey)}`">
              {{ statusLabel(bot.credkey) }}
            </span>
          </div>
          <div class="api-key-row">
            <code :title="bot.api_key">{{ bot.api_key }}</code>
            <button
              class="btn-icon"
              @click="copyKey(bot.api_key)"
              :title="copiedKey === bot.api_key ? 'Tersalin!' : 'Salin API Key'"
              :aria-label="copiedKey === bot.api_key ? 'API key tersalin' : 'Salin API key'"
            >
              <Check v-if="copiedKey === bot.api_key" :size="16" />
              <Clipboard v-else :size="16" />
            </button>
          </div>
          <div class="btn-row">
            <router-link :to="`/bot/${bot.credkey}`" class="btn btn-secondary btn-sm">
              Kelola / QR
            </router-link>
            <router-link :to="`/chat/${bot.credkey}`" class="btn btn-primary btn-sm">
              Buka Chat
            </router-link>
            <button
              class="btn btn-danger btn-sm"
              @click="confirmDelete(bot.credkey)"
            >
              Hapus
            </button>
          </div>
        </div>
      </div>
    </main>

    <!-- Add bot dialog -->
    <Teleport to="body">
      <Transition name="dialog">
      <div v-if="showDialog" class="dialog-backdrop" @click.self="closeDialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
        <div class="dialog">
          <h3 id="dialog-title">Tambah Bot Baru</h3>
          <p>Bot ID dipakai sebagai identitas unik instance WhatsApp kamu.</p>
          <form @submit.prevent="addBot" novalidate>
            <div class="field">
              <label for="credkey">Bot ID <span class="required" aria-hidden="true">*</span></label>
              <input
                id="credkey"
                v-model="newBot.credkey"
                type="text"
                placeholder="misal: mybot1"
                pattern="[a-zA-Z0-9_\-]+"
                required
                autofocus
              />
              <span class="hint">Hanya huruf, angka, underscore, dan tanda hubung.</span>
            </div>
            <div class="field">
              <label for="phone">Nomor HP <span class="optional">(opsional)</span></label>
              <input
                id="phone"
                v-model="newBot.phone"
                type="tel"
                placeholder="misal: 6281234567890"
              />
            </div>
            <div v-if="formError" :class="['alert-error', { shake: formShake }]" role="alert">{{ formError }}</div>
          <div v-if="deleteError" class="alert-error" role="alert" style="margin-bottom:0.75rem">{{ deleteError }}</div>
          <div class="dialog-actions">
              <button type="button" class="btn btn-secondary" @click="closeDialog">Batal</button>
              <button type="submit" class="btn btn-primary" :disabled="adding">
                {{ adding ? 'Menyimpan...' : 'Simpan Bot' }}
              </button>
            </div>
          </form>
        </div>
      </div>
      </Transition>
    </Teleport>

    <!-- Delete confirm dialog -->
    <Teleport to="body">
      <Transition name="dialog">
      <div v-if="deleteTarget" class="dialog-backdrop" role="dialog" aria-modal="true" aria-labelledby="delete-title">
        <div class="dialog">
          <h3 id="delete-title">Hapus Bot?</h3>
          <p>
            Bot <strong>{{ deleteTarget }}</strong> akan dihapus permanen beserta sesi WhatsApp dan API key-nya.
            Tindakan ini tidak bisa dibatalkan.
          </p>
          <div class="dialog-actions">
            <button class="btn btn-secondary" @click="deleteTarget = null" :disabled="deleting">Batal</button>
            <button class="btn btn-danger" @click="doDelete" :disabled="deleting">
              {{ deleting ? 'Menghapus...' : 'Ya, Hapus' }}
            </button>
          </div>
        </div>
      </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { Bot, Clipboard, Check } from 'lucide-vue-next'
import api from '../api'

const FORM_ERROR_MAP = {
  'Credential key already exists': 'Bot ID sudah digunakan. Pilih yang lain.',
  'Invalid credential key':        'Bot ID tidak valid. Gunakan huruf, angka, underscore, atau tanda hubung.',
}

const router     = useRouter()
const username   = localStorage.getItem('username') || ''
const bots       = ref([])
const loading    = ref(true)
const showDialog = ref(false)
const newBot     = ref({ credkey: '', phone: '' })
const formError  = ref('')
const formShake  = ref(false)
const adding     = ref(false)
const deleteTarget = ref(null)
const deleting   = ref(false)
const deleteError = ref('')
const copiedKey  = ref(null)
const statuses   = ref({})
let pollTimer    = null

function openDialog() {
  newBot.value = { credkey: '', phone: '' }
  formError.value = ''
  showDialog.value = true
}

function closeDialog() {
  showDialog.value = false
  formError.value = ''
}

function confirmDelete(credkey) {
  deleteTarget.value = credkey
  deleteError.value = ''
}

async function doDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await api.delete(`/bots/${deleteTarget.value}`)
    bots.value = bots.value.filter(b => b.credkey !== deleteTarget.value)
    deleteTarget.value = null
  } catch (e) {
    deleteError.value = 'Gagal menghapus bot. Coba lagi.'
  } finally {
    deleting.value = false
  }
}

async function fetchBots() {
  try {
    const { data } = await api.get('/bots')
    bots.value = data.data ?? data  // ponytail: backend wraps in {status,data}
  } catch {
    // keep existing list on poll failure
  } finally {
    loading.value = false
  }
}

async function fetchStatuses() {
  // ponytail: per-bot loop, no bulk endpoint exists
  const results = {}
  await Promise.allSettled(
    bots.value.map(async b => {
      try {
        const { data } = await api.get(`/status?sender=${b.credkey}`)
        results[b.credkey] = data.state || 'offline'
      } catch { results[b.credkey] = 'offline' }
    })
  )
  statuses.value = results
}

async function addBot() {
  formError.value = ''
  adding.value = true
  try {
    const { data } = await api.post('/bots', newBot.value)
    bots.value.push(data.data ?? data)  // ponytail: backend wraps in {status,data}
    closeDialog()
  } catch (e) {
    const raw = e.response?.data?.message || ''
    formError.value = FORM_ERROR_MAP[raw] || 'Gagal menambah bot. Coba beberapa saat lagi.'
    formShake.value = false
    nextTick(() => { formShake.value = true })
  } finally {
    adding.value = false
  }
}

async function copyKey(key) {
  try {
    await navigator.clipboard.writeText(key)
    copiedKey.value = key
    setTimeout(() => { copiedKey.value = null }, 2000)
  } catch {
    // clipboard not available
  }
}

function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('username')
  router.push('/login')
}

function statusLabel(credkey) {
  const s = statuses.value[credkey]
  if (s === 'connected') return 'Online'
  if (s === 'qr')        return 'Scan QR'
  return 'Offline'
}

function badgeClass(credkey) {
  const s = statuses.value[credkey]
  if (s === 'connected') return 'badge-green'
  if (s === 'qr')        return 'badge-yellow'
  return 'badge-red'
}

onMounted(async () => {
  await fetchBots()
  await fetchStatuses()
  pollTimer = setInterval(fetchStatuses, 5000)
})

onUnmounted(() => clearInterval(pollTimer))
</script>

<style scoped>
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}
.top-bar h2 {
  font-size: 1.25rem;
  font-weight: 600;
}

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 3rem 1.5rem;
  gap: 0.75rem;
}
.empty-icon { display: block; color: var(--color-text-muted); margin-bottom: 0.25rem; }
.empty-state h3 {
  font-size: 1.0625rem;
  font-weight: 600;
  color: var(--color-text);
}
.empty-state p {
  font-size: 0.9375rem;
  color: var(--color-text-muted);
  max-width: 36ch;
  line-height: 1.6;
}

/* Grid */
.bot-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}
.bot-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.bot-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
}
.bot-identity { display: flex; flex-direction: column; gap: 0.2rem; min-width: 0; }
.bot-identity strong { font-size: 0.9375rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.phone { font-size: 0.8125rem; color: var(--color-text-muted); }

.btn-row {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.25rem;
}
.btn-sm { padding: 0.375rem 0.75rem; font-size: 0.875rem; }

/* Loading */
.state-info {
  color: var(--color-text-muted);
  padding: 1rem 0;
  font-size: 0.9375rem;
}

/* Dialog form spacing */
.dialog form { display: flex; flex-direction: column; gap: 1rem; }

/* Required marker */
.required { color: var(--color-error); margin-left: 1px; }
</style>
