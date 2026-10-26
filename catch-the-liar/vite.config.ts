import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const API = process.env.API_URL ?? 'http://localhost:3000';

export default defineConfig({
  root: 'src/client',
  publicDir: '../../public',
  plugins: [react()],
  build: {
    outDir: '../../dist/client',
    emptyOutDir: true,
    sourcemap: false,
    target: 'es2020',
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': API,
      '/healthz': API,
      '/socket.io': { target: API, ws: true },
    },
  },
});
