import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Vite is the dev harness: `npm run dev` serves http://localhost:5173 with
// hot reload. `host: true` also exposes it on the LAN so you can preview on
// a phone over the same wifi. The PWA plugin generates manifest + service
// worker for installability (Phase 1 goal).
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Moonshot Wayfinder 2026',
        short_name: 'Moonshot',
        description:
          'Indoor wayfinding for Moonshot 2026 at the National Theatre Lagos',
        theme_color: '#3F0F8A',
        background_color: '#FAF3E0',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'icon.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icon.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any' }
        ]
      }
    })
  ],
  server: {
    host: true
  }
})
