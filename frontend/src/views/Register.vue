<template>
  <div class="auth-wrap">
    <div class="card">
      <h1 class="auth-title">Buat Akun</h1>
      <form @submit.prevent="submit" novalidate>
        <div class="field">
          <label for="username">Username</label>
          <input
            id="username"
            v-model="form.username"
            type="text"
            placeholder="misal: john_doe"
            autocomplete="username"
            required
            autofocus
          />
        </div>
        <div class="field">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            placeholder="Min. 8 karakter"
            autocomplete="new-password"
            required
          />
        </div>
        <div v-if="error" :class="['alert-error', { shake }]" role="alert">
          <span>{{ error }}</span>
        </div>
        <button type="submit" class="btn btn-primary btn-full" :disabled="loading">
          {{ loading ? 'Mendaftar...' : 'Daftar' }}
        </button>
      </form>
      <p class="auth-footer">
        Sudah punya akun? <router-link to="/login">Masuk</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api'

const ERROR_MAP = {
  'Username already taken':  'Username sudah digunakan. Coba yang lain.',
  'Username already exists': 'Username sudah digunakan. Coba yang lain.',
  'Password too short':      'Password terlalu pendek. Minimal 8 karakter.',
  'Invalid username':        'Username hanya boleh huruf, angka, dan underscore.',
}

const router  = useRouter()
const form    = ref({ username: '', password: '' })
const error   = ref('')
const shake   = ref(false)
const loading = ref(false)

async function submit() {
  error.value = ''
  loading.value = true
  try {
    const { data } = await api.post('/auth/register', form.value)
    localStorage.setItem('token', data.token)
    localStorage.setItem('username', data.username || form.value.username)
    router.push('/dashboard')
  } catch (e) {
    const raw = e.response?.data?.message || ''
    error.value = ERROR_MAP[raw] || 'Pendaftaran gagal. Coba beberapa saat lagi.'
    shake.value = false
    nextTick(() => { shake.value = true })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-wrap {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 1rem;
  background: var(--color-bg);
}
.card {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-auth);
  padding: 2rem;
  width: 100%;
  max-width: 360px;
}
.auth-title {
  font-size: 1.375rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: var(--color-text);
}
form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.btn-full { width: 100%; margin-top: 0.25rem; }
.auth-footer {
  margin-top: 1.25rem;
  font-size: 0.875rem;
  text-align: center;
  color: var(--color-text-muted);
}
</style>
