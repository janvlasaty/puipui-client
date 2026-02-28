import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')

  return {
    base: process.env.VITE_BASE_PATH || (process.env.GITHUB_ACTIONS ? '/puipui-client/' : '/'),
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        workbox: {
          clientsClaim: true,
          skipWaiting: true,
        },
        manifest: {
          name: 'PuiPui',
          short_name: 'PuiPui',
          start_url: '.',
          display: 'standalone',
          background_color: '#ffffff',
          theme_color: '#ffffff',
          icons: [
            { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY),
    },
    server: {
      port: 5173,
    },
  }
})
