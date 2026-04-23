/**
 * Lógica pura de resolución de subdominios para Suito Network.
 * Soporta localhost y subdominios dinámicos (tenants).
 */

export type AppType = 'MAIN' | 'ADMIN' | 'TURNOS' | 'TENANT';

export interface ResolvedApp {
  type: AppType;
  tenantId: string | null;
}

const BASE_DOMAIN = 'suito.pro';

export function resolveApp(hostname: string): ResolvedApp {
  const cleanHost = hostname.split(':')[0]; // Eliminar puerto
  let resolved: ResolvedApp = { type: 'MAIN', tenantId: null };

  // Soporte para desarrollo local
  if (cleanHost === 'localhost' || cleanHost === '127.0.0.1') {
    const override = localStorage.getItem('SUITO_DEV_APP') as AppType;
    if (override) {
      resolved = { type: override, tenantId: localStorage.getItem('SUITO_DEV_TENANT') };
    }
  }
  // Interceptación de Vercel (para pruebas)
  else if (cleanHost.endsWith('.vercel.app')) {
    const parts = cleanHost.split('.');
    if (parts.length > 3) {
      const sub = parts[0];
      if (sub === 'admin') resolved = { type: 'ADMIN', tenantId: null };
      else if (sub === 'turnos') resolved = { type: 'TURNOS', tenantId: null };
      else resolved = { type: 'TENANT', tenantId: sub };
    } else {
      resolved = { type: 'MAIN', tenantId: null };
    }
  }
  // Caso: suito.pro o www.suito.pro
  else if (cleanHost === BASE_DOMAIN || cleanHost === `www.${BASE_DOMAIN}`) {
    // Si estamos en el dominio principal pero la URL tiene /turnos/, 
    // asumimos que es el gestor genérico (o podríamos buscar un tenant en la sesión)
    resolved = { type: 'TURNOS', tenantId: null };
  }
  // Extraer subdominio
  else if (cleanHost.endsWith(`.${BASE_DOMAIN}`)) {
    const sub = cleanHost.split(`.${BASE_DOMAIN}`)[0];
    
    if (sub === 'admin') resolved = { type: 'ADMIN', tenantId: null };
    else if (sub === 'turnos') resolved = { type: 'TURNOS', tenantId: null };
    else resolved = { type: 'TENANT', tenantId: sub }; // Cualquier otro subdominio es un Tenant
  }

  // Telemetría condicional (Purgada en producción por Vite)
  if (import.meta.env.DEV) {
    console.log(`[Router] Host: ${cleanHost} -> App: ${resolved.type}`, resolved.tenantId ? `Tenant: ${resolved.tenantId}` : '');
  }

  return resolved;
}
