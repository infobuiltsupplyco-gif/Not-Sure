import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Served from https://<owner>.github.io/Not-Sure/ on GitHub Pages
  base: '/Not-Sure/',
  plugins: [react()],
})
