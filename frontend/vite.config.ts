import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // FRONTEND_ORIGIN del backend es http://localhost:5173 (CORS con credenciales).
    port: 5173,
    strictPort: true,
  },
})
