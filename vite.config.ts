import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import mapboxHandler from './api/mapbox.ts'

export default defineConfig(({ mode }) => {
  const { MAPBOX_TOKEN } = loadEnv(mode, process.cwd(), '')
  if (MAPBOX_TOKEN && !process.env.MAPBOX_TOKEN) process.env.MAPBOX_TOKEN = MAPBOX_TOKEN

  const mapboxTokenEndpoint = {
    name: 'local-mapbox-token-endpoint',
    configureServer: (server: { middlewares: { use: (path: string, handler: typeof mapboxHandler) => void } }) => {
      server.middlewares.use('/api/mapbox', mapboxHandler)
    },
    configurePreviewServer: (server: { middlewares: { use: (path: string, handler: typeof mapboxHandler) => void } }) => {
      server.middlewares.use('/api/mapbox', mapboxHandler)
    },
  }

  return { plugins: [tailwindcss(), mapboxTokenEndpoint] }
})
