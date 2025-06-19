// vite.config.ts
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env variables based on mode (development, production)
  // Vite automatically loads .env files. Here, we ensure they are available for the config.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    base: env.VITE_GITHUB_PAGES_BASE_PATH || '/dads-command-center/', // Set base path for GitHub Pages
                                                 // Falls back to '/' for local dev or if not set.
                                                 // Example for GitHub Pages: '/your-repo-name/'
    define: {
      // To make process.env available in client-side code if you are transitioning
      // or have dependencies that use it. Vite prefers import.meta.env.
      // 'process.env': JSON.stringify(env) // Be cautious with exposing all env vars.
      // If constants.ts is already using import.meta.env, this define block for process.env might not be strictly needed for FIREBASE_CONFIG
      // However, if any part of your code or a library relies on process.env.NODE_ENV, Vite handles that.
    },
    build: {
      outDir: 'dist', // Ensure output directory is 'dist'
    },
    server: {
      port: 3000, // Optional: specify dev server port
    }
  };
});