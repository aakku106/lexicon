import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Relative base keeps the build portable across GitHub Pages project sites.
export default defineConfig({
  plugins: [react()],
  base: './',
})
