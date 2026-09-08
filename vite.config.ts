import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const envFile = loadEnv(mode, (process as any).cwd(), '');
  const env = { ...envFile, ...process.env };
  
  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        manifestFilename: 'manifest.json',
        includeAssets: [
          'favicon.ico',
          'favicon.svg',
          'apple-touch-icon.png',
          'icon.svg',
          'icon.png',
          'icon-192.png',
          'icon-512.png',
          'icon-maskable-192.png',
          'icon-maskable-512.png',
          'favicon-32x32.png',
          'favicon-16x16.png',
          'sw-push.js'
        ],
        workbox: {
          maximumFileSizeToCacheInBytes: 4000000,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          importScripts: ['/sw-push.js'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'unsplash-images-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 30
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /^https:\/\/cdn-icons-png\.flaticon\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'flaticon-icons-cache',
                expiration: {
                  maxEntries: 60,
                  maxAgeSeconds: 60 * 60 * 24 * 30
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'google-fonts-cache'
              }
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 20,
                  maxAgeSeconds: 60 * 60 * 24 * 365
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        },
        devOptions: {
          enabled: true
        },
        manifest: {
          id: '/',
          name: 'Farmacia Vitalis - Tu Salud Al Día',
          short_name: 'Vitalis',
          description: 'Farmacia Vitalis Machalilla: catálogo farmacéutico, compras rápidas, POS y entregas a domicilio.',
          theme_color: '#0d9488',
          background_color: '#ffffff',
          display: 'standalone',
          display_override: ['window-controls-overlay', 'standalone', 'minimal-ui'],
          orientation: 'portrait-primary',
          scope: '/',
          start_url: '/',
          lang: 'es',
          categories: ['health', 'medical', 'shopping'],
          icons: [
            {
              src: '/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/icon-maskable-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'maskable'
            },
            {
              src: '/icon-maskable-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            },
            {
              src: '/icon.svg',
              sizes: 'any',
              type: 'image/svg+xml'
            }
          ]
        }
      })
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || env.API_KEY || env.VITE_API_KEY || ''),
      'process.env.API_KEY': JSON.stringify(env.API_KEY || env.VITE_API_KEY || ''),
      'process.env.FIREBASE_API_KEY': JSON.stringify(env.FIREBASE_API_KEY || env.VITE_FIREBASE_API_KEY || ''),
      'process.env.FIREBASE_AUTH_DOMAIN': JSON.stringify(env.FIREBASE_AUTH_DOMAIN || env.VITE_FIREBASE_AUTH_DOMAIN || ''),
      'process.env.FIREBASE_PROJECT_ID': JSON.stringify(env.FIREBASE_PROJECT_ID || env.VITE_FIREBASE_PROJECT_ID || ''),
      'process.env.FIREBASE_STORAGE_BUCKET': JSON.stringify(env.FIREBASE_STORAGE_BUCKET || env.VITE_FIREBASE_STORAGE_BUCKET || ''),
      'process.env.FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(env.FIREBASE_MESSAGING_SENDER_ID || env.VITE_FIREBASE_MESSAGING_SENDER_ID || ''),
      'process.env.FIREBASE_APP_ID': JSON.stringify(env.FIREBASE_APP_ID || env.VITE_FIREBASE_APP_ID || ''),
      'process.env.STRIPE_PUBLIC_KEY': JSON.stringify(env.STRIPE_PUBLIC_KEY || '')
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-firebase': ['firebase/app', 'firebase/firestore', 'firebase/auth'],
            'vendor-ui': ['lucide-react', 'framer-motion', 'recharts']
          }
        }
      },
      chunkSizeWarningLimit: 1000
    }
  }
})