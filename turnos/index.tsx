import React from 'react';
import './index.css';
import { logger } from './utils/logger';
import ReactDOM from 'react-dom/client';
import App from './src/app/App';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TenantProvider } from './context/TenantContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos: reduce carga en Supabase
      gcTime: 1000 * 60 * 15,    // 15 minutos: recolección de basura optimizada
      retry: 1,                 // 1 reintento para fallos efímeros de red
      refetchOnWindowFocus: false, // Evita refetch innecesario al cambiar de pestaña
    },
  },
});

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <TenantProvider>
          <App />
        </TenantProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
}

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(import.meta.env.BASE_URL + 'sw.js')
      .then((registration) => {
        logger.debug('[PWA] Service Worker registered:', registration.scope);

        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000); // Check every hour
      })
      .catch((error) => {
        logger.error('[PWA] Service Worker registration failed:', error);
      });
  });
}
