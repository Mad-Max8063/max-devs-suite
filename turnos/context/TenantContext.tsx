import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { resolveApp } from '../src/domains/subdomainResolver';
import { supabase } from '../services/supabaseClient';
import { logger } from '../utils/logger';

interface TenantContextState {
  tenantId: string | null;   // UUID de base de datos
  tenantSlug: string | null; // Identificador visual (subdominio)
  isInvalid: boolean;
  isLoading: boolean;
}

const TenantContext = createContext<TenantContextState | undefined>(undefined);

export const TenantProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<TenantContextState>({
    tenantId: null,
    tenantSlug: null,
    isInvalid: false,
    isLoading: true,
  });

  useEffect(() => {
    const resolveTenant = async () => {
      // 1. Resolución lógica del subdominio (Slug)
      const resolved = resolveApp(window.location.hostname);
      const slug = resolved.tenantId; // En el resolver, tenantId es el slug del subdominio

      if (!slug) {
        // Si no hay slug, pero es la app principal de turnos o admin, no es "inválido", 
        // simplemente es el modo global.
        if (resolved.type === 'TURNOS' || resolved.type === 'ADMIN') {
          setState({ tenantId: null, tenantSlug: null, isInvalid: false, isLoading: false });
        } else {
          setState({ tenantId: null, tenantSlug: null, isInvalid: true, isLoading: false });
        }
        return;
      }

      try {
        // 2. Resolución persistente del UUID (TenantId Real)
        // Delegamos la seguridad a RLS; esta es una consulta pública de metadata
        const { data, error } = await supabase
          .from('businesses')
          .select('id')
          .eq('slug', slug)
          .single();

        if (error || !data) {
          logger.warn(`[TenantContext] No se pudo resolver UUID para el slug: ${slug}`);
          setState({ tenantId: null, tenantSlug: slug, isInvalid: true, isLoading: false });
        } else {
          setState({ 
            tenantId: data.id, 
            tenantSlug: slug, 
            isInvalid: false, 
            isLoading: false 
          });
        }
      } catch (err) {
        logger.error('[TenantContext] Error crítico en resolución:', err);
        setState({ tenantId: null, tenantSlug: slug, isInvalid: true, isLoading: false });
      }
    };

    resolveTenant();
  }, []);

  return (
    <TenantContext.Provider value={state}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant debe ser usado estrictamente dentro de un TenantProvider');
  }
  return context;
};
