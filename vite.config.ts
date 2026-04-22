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

  // Base path absoluto para soportar el router SPA de Vercel
  base: '/',

  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        // Punto de entrada principal (Landing)
        main:   resolve(__dirname, 'index.html'),
        // Admin Panel (Vanilla JS)
        dashboard: resolve(__dirname, 'admin/dashboard-v2029.html'),
        // Tarjeta Virtual (Vanilla JS)
        card:   resolve(__dirname, 'card/index.html'),
        // Gestor de Turnos (React + TypeScript)
        turnos: resolve(__dirname, 'turnos/index.html'),
      },
      output: {
        // Hashes únicos más versionado forzado para evadir caché persistente de HCDN
        entryFileNames: 'assets/[name]-[hash]-v2029.js',
        chunkFileNames: 'assets/[name]-[hash]-v2029.js',
        assetFileNames: 'assets/[name]-[hash]-v2029.[ext]',
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return;
          if (id.includes('/react-router') || id.includes('@remix-run')) return 'vendor-router';
          if (id.includes('/react-dom/')) return 'vendor-react-dom';
          if (id.includes('/react/') || id.includes('/scheduler/')) return 'vendor-react';
          if (id.includes('@supabase')) return 'vendor-supabase';
          return 'vendor';
        },
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
