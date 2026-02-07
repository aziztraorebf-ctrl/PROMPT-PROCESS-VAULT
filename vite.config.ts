import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react(), tailwindcss()],
  // SECURITY: Do NOT inject API keys into the client bundle.
  // Use VITE_* prefixed env vars accessed via import.meta.env instead,
  // and only for public keys (e.g., Firebase). Keep secret keys server-side.
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  }
});
