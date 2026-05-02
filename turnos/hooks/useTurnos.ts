import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabaseClient';
import { useTenant } from '../context/TenantContext';
import { Appointment, CreateAppointmentData } from '../services/supabaseService';
import { logger } from '../utils/logger';

/**
 * Hook de consulta para la entidad 'turnos' (Appointments).
 * Aislamiento estricto por UUID (tenantId) en la caché global.
 */
export const useTurnos = (status?: 'Pendiente' | 'Confirmado' | 'Cancelado' | 'all') => {
  const { tenantId } = useTenant();

  return useQuery({
    // Aislamiento de Caché Obligatorio: UUID como segundo argumento posicional
    queryKey: ['turnos', tenantId, { status }],
    queryFn: async () => {
      if (!tenantId) throw new Error('Tenant ID missing');

      // ZERO-SECURITY FRONTEND: Confiamos plenamente en las políticas RLS de Supabase.
      // El filtrado por business_id es por eficiencia, la seguridad la garantiza la DB.
      let query = supabase
        .from('appointments')
        .select('*')
        .eq('business_id', tenantId)
        .order('fecha', { ascending: true })
        .order('hora', { ascending: true });

      if (status && status !== 'all') {
        query = query.eq('estado', status);
      }

      const { data, error } = await query;

      if (error) {
        logger.error(`[Supabase Error ${error.code}]: ${error.message}`);
        throw error;
      }

      return (data || []).map(row => ({
        ID: row.id,
        Slug: row.slug || '', // Mantenemos compatibilidad con la interfaz
        Fecha: row.fecha,
        Hora: row.hora,
        Estado: row.estado,
        NombreCliente: row.nombre_cliente,
        TelefonoCliente: row.telefono_cliente,
        EmailCliente: row.email_cliente || '',
        Servicio: row.servicio || '',
        DuracionMinutos: row.duracion_minutos || 60,
        PrecioTotal: row.precio_total || 0,
        MontoSena: row.monto_sena || 0,
        CreatedAt: row.created_at,
      })) as Appointment[];
    },
    enabled: !!tenantId,
    staleTime: 1000 * 60 * 5, // 5 min
    gcTime: 1000 * 60 * 15,    // v5 API: Reemplaza cacheTime
  });
};

/**
 * Hook de mutación para crear un nuevo turno.
 * Lógica Conservadora: Debido al ordenamiento por fecha/hora, la posición del nuevo elemento
 * es sensible. Se opta por invalidación para garantizar consistencia absoluta.
 */
export const useCreateTurno = () => {
  const queryClient = useQueryClient();
  const { tenantId } = useTenant();

  return useMutation({
    mutationFn: async (aptData: CreateAppointmentData) => {
      if (!tenantId) throw new Error('Tenant context missing');

      const { data, error } = await supabase.rpc('create_appointment_secure', {
        p_business_id: tenantId,
        p_fecha: aptData.Fecha,
        p_hora: aptData.Hora,
        p_duracion_minutos: aptData.DuracionMinutos || 60,
        p_nombre_cliente: aptData.NombreCliente,
        p_telefono_cliente: aptData.TelefonoCliente,
        p_email_cliente: aptData.EmailCliente || '',
        p_servicio: aptData.Servicio || '',
        p_precio_total: aptData.PrecioTotal || 0,
        p_monto_sena: aptData.MontoSena || 0,
      });

      if (error) {
        if (error.code === '23505' || error.message.includes('slot_conflict')) {
          throw new Error('Este horario ya está reservado o se superpone con otro turno.');
        }
        if (error.message.includes('slot_not_available') || error.message.includes('date_blocked')) {
          throw new Error('Este horario ya no está disponible.');
        }
        if (error.code === '23505') throw new Error('Este horario ya está reservado.');
        throw error;
      }
      return { id: data as string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['turnos', tenantId] });
    },
  });
};

/**
 * Hook de mutación para actualizar el estado con OPTIMISTIC UPDATE.
 */
export const useUpdateTurnoStatus = () => {
  const queryClient = useQueryClient();
  const { tenantId } = useTenant();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'Pendiente' | 'Confirmado' | 'Cancelado' }) => {
      const { error } = await supabase
        .from('appointments')
        .update({ estado: status })
        .eq('id', id);

      if (error) throw error;
      return { id, status };
    },
    // Optimistic Update: Experiencia instantánea
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['turnos', tenantId] });
      const previousTurnos = queryClient.getQueryData(['turnos', tenantId]);

      queryClient.setQueryData(['turnos', tenantId], (old: Appointment[] | undefined) => {
        return old?.map(apt => apt.ID === id ? { ...apt, Estado: status } : apt);
      });

      return { previousTurnos };
    },
    onError: (err, variables, context) => {
      if (context?.previousTurnos) {
        queryClient.setQueryData(['turnos', tenantId], context.previousTurnos);
      }
      logger.error('[useUpdateTurnoStatus] Failed:', err);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['turnos', tenantId] });
    },
  });
};

/**
 * Hook de mutación para eliminar un turno con OPTIMISTIC UPDATE.
 */
export const useDeleteTurno = () => {
  const queryClient = useQueryClient();
  const { tenantId } = useTenant();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['turnos', tenantId] });
      const previousTurnos = queryClient.getQueryData(['turnos', tenantId]);

      queryClient.setQueryData(['turnos', tenantId], (old: Appointment[] | undefined) => {
        return old?.filter(apt => apt.ID !== id);
      });

      return { previousTurnos };
    },
    onError: (err, id, context) => {
      if (context?.previousTurnos) {
        queryClient.setQueryData(['turnos', tenantId], context.previousTurnos);
      }
      logger.error('[useDeleteTurno] Failed:', err);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['turnos', tenantId] });
    },
  });
};
