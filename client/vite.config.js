// Configuración de Vite para el frontend PWA
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react()
  ],
  // Buscar .env en la raíz del proyecto (directorio padre)
  envDir: '../',
  server: {
    port: 5173,
    // Proxy para desarrollo — redirige llamadas API al backend
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
});
