import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Vite handles SPA routing automatically by default
  // The vercel.json file handles routing for production deployment
})
