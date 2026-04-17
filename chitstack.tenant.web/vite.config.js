import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      devOptions: {
        // Disable SW in dev to avoid navigation allowlist interference
        // with deep SPA routes such as /portal/auctions/live/:auctionId.
        enabled: false
      },
      manifest: {
        name: 'Chit Stack Member Portal',
        short_name: 'ChitStack',
        description: 'Secure Member Portal for Chit Fund Subscribers',
        theme_color: '#4f46e5',
        background_color: '#f5f5f5',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/logo-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/logo-180.png',
            sizes: '180x180',
            type: 'image/png'
          },
          {
            src: '/logo-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/logo-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })

  ],
  server: {
    port: 5174,
  },
  optimizeDeps: {
    include: ['quill'],
  }
})

