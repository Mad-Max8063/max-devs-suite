// v1.0.6 - Forced Cache Bust - 2026-04-13
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],

  // Base path absoluto para soportar Slugs (pretty URLs) y subdominios mediante duplicidad
  base: '/',

  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        // Punto de entrada principal (Landing)
        main:   resolve(__dirname, 'index.html'),
        // Admin Panel (Vanilla JS)
        admin:  resolve(__dirname, 'admin/index.html'),
        // Tarjeta Virtual (Vanilla JS)
        card:   resolve(__dirname, 'card/index.html'),
        // Gestor de Turnos (React + TypeScript)
        turnos: resolve(__dirname, 'turnos/index.html'),
      },
      output: {
        // Hashes únicos más versionado forzado para evadir caché persistente de HCDN
        entryFileNames: 'assets/[name]-[hash]-v4.js',
        chunkFileNames: 'assets/[name]-[hash]-v4.js',
        assetFileNames: 'assets/[name]-[hash]-v4.[ext]',
      },
    },
  },

  // Dev server
  server: {
    port: 5173,
    host: '0.0.0.0',
  },

  // Soporte TypeScript + React (para el módulo turnos/)
  esbuild: {
    target: 'es2020',
  },

  // Resolver extensiones para el módulo React
  resolve: {
    alias: {
      '@shared': resolve(__dirname, 'shared'),
    },
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
}));
