import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // MUDANÇA 1: De 'autoUpdate' para 'prompt'.
      // Isso impede que o site recarregue sozinho na cara do cliente.
      registerType: 'prompt', 
      
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      
      // MUDANÇA 2: Configurações para parar os erros no terminal
      workbox: {
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      },

      devOptions: {
        enabled: true,
        // MUDANÇA 3: Suprime os avisos de "glob pattern" no terminal
        suppressWarnings: true,
        type: 'module',
      },

      manifest: {
        name: 'BarberPro App',
        short_name: 'BarberPro',
        description: 'Agendamento de Barbearia',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})