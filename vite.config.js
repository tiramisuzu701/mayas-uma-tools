import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Relative base so the built site works regardless of the GitHub repo name
// (project pages are served from /<repo-name>/, user/org pages from /).
// Combined with HashRouter in the app, this means no extra Pages
// configuration (like a 404.html fallback) is required.
export default defineConfig({
  plugins: [react()],
  base: './',
})
