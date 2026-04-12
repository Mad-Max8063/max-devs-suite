import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],

  // Base path absoluto para que los subdominios encuentren los assets en la raíz
  base: command === 'build' ? 'https://suito.pro/' : '/',

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
        entryFileNames: 'assets/[name]-[hash]-v2.js',
        chunkFileNames: 'assets/[name]-[hash]-v2.js',
        assetFileNames: 'assets/[name]-[hash]-v2.[ext]',
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
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
}));
