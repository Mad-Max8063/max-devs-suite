import { useMemo, Suspense, lazy } from 'react';
import { resolveApp } from '../domains/subdomainResolver';

// Carga perezosa de módulos para aislamiento total de bundles
const MainApp = lazy(() => import('../modules/main/MainApp'));
const AdminApp = lazy(() => import('../modules/admin/AdminApp'));
const TurnosApp = lazy(() => import('../modules/turnos/TurnosApp'));

const LoadingScreen = () => (
  <div style={{ background: '#0A0A0A', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4AF37', fontFamily: 'sans-serif' }}>
    <p style={{ letterSpacing: '0.2em' }}>SUITO RESOLVING...</p>
  </div>
);

export default function App() {
  const { type, tenantId } = useMemo(() => resolveApp(window.location.hostname), []);

  return (
    <Suspense fallback={<LoadingScreen />}>
      {type === 'MAIN' && <MainApp />}
      {type === 'ADMIN' && <AdminApp />}
      {type === 'TURNOS' && <TurnosApp />}
      {type === 'TENANT' && (
        <div style={{ padding: '20px', color: 'white', background: '#0A0A0A', minHeight: '100vh', fontFamily: 'sans-serif' }}>
          <h1 style={{ color: '#D4AF37' }}>TenantApp SPA - Fase 1</h1>
          <p>Identificador detectado: <strong>{tenantId}</strong></p>
        </div>
      )}
    </Suspense>
  );
}
