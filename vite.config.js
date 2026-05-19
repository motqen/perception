import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Auto-detect base path based on GitHub repository name in Actions environment
const isGithubActions = process.env.GITHUB_ACTIONS === 'true';
const repoName = process.env.GITHUB_REPOSITORY ? process.env.GITHUB_REPOSITORY.split('/')[1] : '';
const base = isGithubActions && repoName ? `/${repoName}/` : '/';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: base,
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('supabase')) return 'vendor-supabase';
            if (id.includes('lucide')) return 'vendor-icons';
            if (id.includes('framer-motion')) return 'vendor-ui';
            return 'vendor';
          }
        }
      }
    },
    chunkSizeWarningLimit: 600
  }
})
