import { fileURLToPath, URL } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
// import vueDevTools from 'vite-plugin-vue-devtools' // DESACTIVADO

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // vueDevTools(), // DESACTIVADO - No cargar Vue DevTools
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: (() => {
    // Intentar cargar certificados generados en backend/ssl
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)
    const sslDir = path.resolve(__dirname, '../backend/ssl')
    const pfxPath = path.join(sslDir, 'server.pfx')
    const certPath = path.join(sslDir, 'server.crt')
    const keyPath = path.join(sslDir, 'server.key')

    let httpsOptions = false
    try {
      if (fs.existsSync(pfxPath)) {
        httpsOptions = {
          pfx: fs.readFileSync(pfxPath),
          passphrase: process.env.SSL_PASSPHRASE || 'sisfipo2024'
        }
        console.log('Vite: usando PFX para HTTPS ->', pfxPath)
      } else if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
        httpsOptions = {
          cert: fs.readFileSync(certPath),
          key: fs.readFileSync(keyPath)
        }
        console.log('Vite: usando CRT/KEY para HTTPS ->', certPath, keyPath)
      } else {
        console.log('Vite: no se encontraron certificados en backend/ssl; iniciando HTTP')
      }
    } catch (e) {
      console.warn('Vite: error cargando certificados HTTPS:', e && e.message)
      httpsOptions = false
    }

    return {
      host: '0.0.0.0', // Escuchar en todas las interfaces de red
      port: 5173,
      https: httpsOptions,
      proxy: {
        '/api': {
          // Proxy hacia backend HTTPS (self-signed aceptado)
          target: 'https://localhost:3443',
          changeOrigin: true,
          secure: false,
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('proxy error', err);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('Sending Request to the Target:', req.method, req.url);
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
            });
          },
        }
      }
    }
  })()
})
