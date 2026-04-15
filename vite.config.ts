// v1.0.8 - MPA SPA fallback for dev routing
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// Plugin: rewrite /card/* y /admin/* a sus index.html para SPA routing en dev
const mpaFallback = {
  name: 'mpa-spa-fallback',
  configureServer(server: any) {
    server.middlewares.use((req: any, _res: any, next: any) => {
      if ((req.url?.startsWith('/card/') || req.url?.startsWith('/edit/')) && !req.url.includes('.')) {
        req.url = '/card/index.html';
      }
      next();
    });
  },
};

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react(), mpaFallback],

  // Base path relativo para soportar cualquier estructura de carpetas (subcarpetas o subdominios)
  base: './',

  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        // Punto de entrada principal (Landing)
        main:   resolve(__dirname, 'home-v2028.html'),
        // Landing JS (onboarding)
        landing: resolve(__dirname, 'landing/app.js'),
        // Admin Panel (Vanilla JS)
        dashboard: resolve(__dirname, 'admin/dashboard-v2028.html'),
        // Tarjeta Virtual (Vanilla JS)
        card:   resolve(__dirname, 'card/index.html'),
        // Gestor de Turnos (React + TypeScript)
        turnos: resolve(__dirname, 'turnos/index.html'),
      },
      output: {
        // Hashes únicos más versionado forzado para evadir caché persistente de HCDN
        entryFileNames: 'assets/[name]-[hash]-v2028.js',
        chunkFileNames: 'assets/[name]-[hash]-v2028.js',
        assetFileNames: 'assets/[name]-[hash]-v2028.[ext]',
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
