import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// In production the dashboard and the FastAPI app share one origin on Vercel.
// In development, API calls are proxied to the live deployment (override with API_URL).
const api = process.env.API_URL ?? 'https://subscription-expense-guard.vercel.app';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: { chunkSizeWarningLimit: 800 },
  server: { proxy: { '/analyze': { target: api, changeOrigin: true } } },
});
