<template>
  <div class="layout">
    <header class="app-header" role="banner">
      <span class="brand">WA Bot</span>
      <div class="header-right">
        <router-link to="/dashboard" class="btn btn-ghost">← Dashboard</router-link>
        <span class="username">{{ username }}</span>
        <button class="btn btn-ghost" @click="logout">Logout</button>
      </div>
    </header>

    <main class="app-main docs">
      <h1>Dokumentasi API</h1>
      <p class="lead">REST API untuk mengirim pesan WhatsApp. Gunakan API key dari dashboard.</p>

      <section class="doc-section">
        <h2>Authentication</h2>
        <p>Setiap request wajib menyertakan header <code>x-api-key</code> dengan API key bot.</p>
        <div class="code-block">
          <pre>x-api-key: your_api_key_here</pre>
        </div>
      </section>

      <section class="doc-section">
        <h2>Endpoints</h2>

        <article class="endpoint">
          <div class="endpoint-header">
            <span class="method post">POST</span>
            <code>/messages/send</code>
          </div>
          <p>Kirim pesan teks ke nomor WhatsApp.</p>
          <h4>Request Body</h4>
          <div class="code-block">
            <pre>{
  "to": "628123456789",
  "message": "Hello from API"
}</pre>
          </div>
          <h4>Response</h4>
          <div class="code-block">
            <pre>{
  "status": true,
  "message": "Message sent",
  "messageId": "..."
}</pre>
          </div>
        </article>

        <article class="endpoint">
          <div class="endpoint-header">
            <span class="method post">POST</span>
            <code>/messages/send-image</code>
          </div>
          <p>Kirim gambar dengan caption opsional.</p>
          <h4>Request Body</h4>
          <div class="code-block">
            <pre>{
  "to": "628123456789",
  "imageUrl": "https://example.com/image.jpg",
  "caption": "Check this out"
}</pre>
          </div>
        </article>

        <article class="endpoint">
          <div class="endpoint-header">
            <span class="method post">POST</span>
            <code>/messages/send-video</code>
          </div>
          <p>Kirim video dengan caption opsional.</p>
          <h4>Request Body</h4>
          <div class="code-block">
            <pre>{
  "to": "628123456789",
  "videoUrl": "https://example.com/video.mp4",
  "caption": "Watch this"
}</pre>
          </div>
        </article>

        <article class="endpoint">
          <div class="endpoint-header">
            <span class="method post">POST</span>
            <code>/messages/send-audio</code>
          </div>
          <p>Kirim file audio.</p>
          <h4>Request Body</h4>
          <div class="code-block">
            <pre>{
  "to": "628123456789",
  "audioUrl": "https://example.com/audio.mp3"
}</pre>
          </div>
        </article>

        <article class="endpoint">
          <div class="endpoint-header">
            <span class="method post">POST</span>
            <code>/messages/send-document</code>
          </div>
          <p>Kirim file dokumen.</p>
          <h4>Request Body</h4>
          <div class="code-block">
            <pre>{
  "to": "628123456789",
  "documentUrl": "https://example.com/file.pdf",
  "filename": "document.pdf"
}</pre>
          </div>
        </article>

        <article class="endpoint">
          <div class="endpoint-header">
            <span class="method get">GET</span>
            <code>/chats</code>
          </div>
          <p>Ambil daftar chat terbaru.</p>
          <h4>Response</h4>
          <div class="code-block">
            <pre>{
  "status": true,
  "chats": [
    {
      "jid": "628123456789@s.whatsapp.net",
      "name": "John Doe",
      "unreadCount": 2,
      "conversationTimestamp": 1234567890
    }
  ]
}</pre>
          </div>
        </article>

        <article class="endpoint">
          <div class="endpoint-header">
            <span class="method get">GET</span>
            <code>/chats/:jid/messages</code>
          </div>
          <p>Ambil history pesan dari chat tertentu.</p>
          <h4>Query Parameters</h4>
          <ul>
            <li><code>limit</code> - jumlah pesan (default: 50)</li>
          </ul>
        </article>

        <article class="endpoint">
          <div class="endpoint-header">
            <span class="method get">GET</span>
            <code>/users/:jid</code>
          </div>
          <p>Ambil info user/kontak WhatsApp.</p>
        </article>

        <article class="endpoint">
          <div class="endpoint-header">
            <span class="method get">GET</span>
            <code>/groups</code>
          </div>
          <p>Ambil daftar grup yang diikuti bot.</p>
        </article>

        <article class="endpoint">
          <div class="endpoint-header">
            <span class="method post">POST</span>
            <code>/groups/:groupJid/send</code>
          </div>
          <p>Kirim pesan ke grup.</p>
          <h4>Request Body</h4>
          <div class="code-block">
            <pre>{
  "message": "Hello group!"
}</pre>
          </div>
        </article>
      </section>

      <section class="doc-section">
        <h2>Error Handling</h2>
        <p>Semua error dikembalikan dengan format:</p>
        <div class="code-block">
          <pre>{
  "status": false,
  "message": "Error description"
}</pre>
        </div>
        <h4>HTTP Status Codes</h4>
        <ul>
          <li><code>401</code> - API key invalid atau tidak ada</li>
          <li><code>403</code> - Akses ditolak</li>
          <li><code>404</code> - Resource tidak ditemukan</li>
          <li><code>500</code> - Server error</li>
        </ul>
      </section>
    </main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()
const username = localStorage.getItem('username') || ''

function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('username')
  router.push('/login')
}
</script>

<style scoped>
.docs {
  max-width: 50rem;
  margin: 0 auto;
}

h1 {
  font-size: 1.875rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.lead {
  font-size: 1.0625rem;
  color: var(--color-text-muted);
  margin-bottom: 2rem;
}

.doc-section {
  margin-bottom: 3rem;
}

.doc-section h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--color-border);
}

.doc-section h4 {
  font-size: 0.9375rem;
  font-weight: 600;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}

.endpoint {
  margin-bottom: 2rem;
  padding: 1.25rem;
  background: var(--color-surface);
  border-radius: 0.5rem;
  border: 1px solid var(--color-border);
}

.endpoint-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.method {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  text-transform: uppercase;
}

.method.get {
  background: #dcfce7;
  color: #166534;
}

.method.post {
  background: #dbeafe;
  color: #1e40af;
}

.endpoint-header code {
  font-size: 0.9375rem;
  font-weight: 500;
}

.endpoint p {
  margin-bottom: 0.75rem;
  color: var(--color-text-muted);
}

.code-block {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 0.375rem;
  padding: 1rem;
  overflow-x: auto;
}

.code-block pre {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.5;
}

code {
  background: var(--color-surface);
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  border: 1px solid var(--color-border);
}

ul {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}

li {
  margin-bottom: 0.25rem;
  color: var(--color-text-muted);
}
</style>
