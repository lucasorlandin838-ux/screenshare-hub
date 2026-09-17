import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      include: ['buffer', 'process', 'events', 'stream', 'util'],
      globals: { Buffer: true, process: true },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      // Proxy para a API do Discord (troca o code OAuth2 por token)
      // Redireciona /api para o backend local (porta 3001) durante dev
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Garante que os chunks são nomeados de forma consistente
        manualChunks: {
          discord: ['@discord/embedded-app-sdk'],
        },
      },
    },
  },
});
