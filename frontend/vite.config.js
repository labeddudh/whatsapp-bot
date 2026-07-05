import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      // ponytail: catch-all proxy — one rule instead of listing every endpoint
      '/auth': 'http://localhost:3000',
      '/bots': 'http://localhost:3000',
      '/status': 'http://localhost:3000',
      '/create-session': 'http://localhost:3000',
      '/get-qr': 'http://localhost:3000',
      '/set-webhook': 'http://localhost:3000',
      '/get-webhook': 'http://localhost:3000',
      '/send-message': 'http://localhost:3000',
      '/send-media': 'http://localhost:3000',
      '/send-group-message': 'http://localhost:3000',
      '/send-group-media': 'http://localhost:3000',
      '/send-image': 'http://localhost:3000',
      '/check-number': 'http://localhost:3000',
      '/get-groups': 'http://localhost:3000',
      '/get-participants': 'http://localhost:3000',
      '/chat-list': 'http://localhost:3000',
      '/messages': 'http://localhost:3000',
      '/chats': 'http://localhost:3000',
      '/users': 'http://localhost:3000',
      '/groups': 'http://localhost:3000',
      '/privacy': 'http://localhost:3000',
      '/events': 'http://localhost:3000',
      '/logout': 'http://localhost:3000',
    }
  }
})
