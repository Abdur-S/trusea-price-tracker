import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // This line tells Vite to use the exact repository name as the base path for GitHub Pages
  base: '/trusea-price-tracker/',
})
