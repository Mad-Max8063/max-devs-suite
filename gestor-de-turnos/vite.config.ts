import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],

  // Base path - subfolder for Hostinger deployment
  base: '/turnos/',

  // PWA: Include public directory with manifest, icons, and service worker
  publicDir: 'public',

  build: {
    // Output directory
    outDir: 'dist',
    // Emit manifest for asset preloading
    manifest: true,
    // Rollup options for PWA
    rollupOptions: {
      output: {
        // Ensure consistent chunk names for caching
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },

  // Server config for development
  server: {
    port: 3000,
    host: '0.0.0.0',
    strictPort: true,
  },
}));
