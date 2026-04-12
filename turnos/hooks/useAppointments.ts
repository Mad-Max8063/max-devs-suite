import { useState, useCallback } from 'react';
import { logger } from '../utils/logger';
import { sheetsService, CreateAppointmentData, Appointment } from '../services/sheetsService';
import { DEFAULT_SCHEDULE } from './useSchedule';
import { useApiMode } from './useApiMode';

/**
 * Hook for creating new appointments
 */
export function useCreateAppointment() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [createdId, setCreatedId] = useState<string | null>(null);

    const { isConfigured } = useApiMode(null);

    const create = useCallback(async (data: CreateAppointmentData): Promise<string> => {
        setLoading(true);
        setError(null);

        // Check if we're in demo mode (route-based, not just env-based)
        const isDemo = data.Slug === 'demo';
        const shouldCallApi = isConfigured && !isDemo;

        try {
            if (shouldCallApi) {
                const result = await sheetsService.createAppointment(data);
                setCreatedId(result.id);
                return result.id;
            } else {
                // Demo mode: generate fake ID
                const fakeId = 'demo-' + Date.now();
                setCreatedId(fakeId);
                logger.debug('[DEMO] Created appointment:', { ...data, ID: fakeId });
                return fakeId;
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Error creando turno';
            setError(message);
            throw new Error(message);
        } finally {
            setLoading(false);
        }
    }, [isConfigured]);

    const reset = useCallback(() => {
        setLoading(false);
        setError(null);
        setCreatedId(null);
    }, []);

    return { create, loading, error, createdId, reset };
}

/**
 * Hook for fetching available time slots
 */
export function useAvailableSlots() {
    const [slots, setSlots] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { isConfigured } = useApiMode(null);

    const fetchSlots = useCallback(async (slug: string, date: string) => {
        setLoading(true);
        setError(null);

        // Check if we're in demo mode (route-based, not just env-based)
        const isDemo = slug === 'demo';
        const shouldCallApi = isConfigured && !isDemo;

        try {
            if (shouldCallApi) {
                let data = await sheetsService.getAvailableSlots(slug, date);

                // Filter out past times if it's today
                const today = new Date();
                const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

                if (date === todayStr) {
                    const now = new Date();
                    const currentHour = now.getHours();
                    const currentMin = now.getMinutes();

                    data = data.filter(h => {
                        const [hStr, mStr] = h.split(':');
                        const hour = parseInt(hStr);
                        const min = parseInt(mStr);
                        // 30 min margin
                        if (hour > currentHour) return true;
                        if (hour === currentHour && min > currentMin + 30) return true;
                        return false;
                    });
                }

                setSlots(data);
            } else {
                // Demo mode: Calculate available slots based on schedule
                // This provides a consistent, realistic demo experience

                // Get day of week from date
                const [year, month, day] = date.split('-').map(Number);
                const targetDate = new Date(year, month - 1, day);
                const dayOfWeek = targetDate.getDay();

                // Get schedule for this day (from DEFAULT_SCHEDULE)
                let allSlots = DEFAULT_SCHEDULE.horariosPorDia[dayOfWeek] || [];


                // Get booked slots for this date from demo appointments
                // This would normally come from the backend, but in demo we'll simulate it
                const bookedSlots: string[] = [];

                // Common demo booked slots that align with DEMO_APPOINTMENTS
                // We'll mark some slots as booked to show realistic availability
                if (date === `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`) {
                    // For demo, we'll book a few slots per day to show variety
                    const daysFromToday = Math.floor((targetDate.getTime() - new Date().setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24));

                    // Simulate booked appointments based on date offset
                    if (daysFromToday === 0) bookedSlots.push('09:00', '10:00', '14:30', '18:00');
                    else if (daysFromToday === 1) bookedSlots.push('11:00', '16:00', '19:30');
                    else if (daysFromToday === 2) bookedSlots.push('09:30', '15:30');
                    else if (daysFromToday === 3) bookedSlots.push('11:00', '17:00');
                    else if (daysFromToday === 5) bookedSlots.push('10:30', '14:00');
                    else if (daysFromToday === 7) bookedSlots.push('12:00', '18:30');
                    else if (daysFromToday === 10) bookedSlots.push('13:30');
                    else if (daysFromToday === 12) bookedSlots.push('11:30');
                    else if (daysFromToday === 14) bookedSlots.push('16:30');
                }

                // Filter out booked slots
                let availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));

                // Get local YYYY-MM-DD for today
                const today = new Date();
                const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

                // If it's today, filter out past times
                if (date === todayStr) {
                    const now = new Date();
                    const currentHour = now.getHours();
                    const currentMin = now.getMinutes();

                    availableSlots = availableSlots.filter(h => {
                        const [hStr, mStr] = h.split(':');
                        const hour = parseInt(hStr);
                        const min = parseInt(mStr);

                        // Margen de 30 min
                        if (hour > currentHour) return true;
                        if (hour === currentHour && min > currentMin + 30) return true;
                        return false;
                    });
                }

                setSlots(availableSlots);
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Error cargando horarios';
            setError(message);
            setSlots([]); // Empty on error
        } finally {
            setLoading(false);
        }
    }, [isConfigured]);

    return { slots, loading, error, fetchSlots };
}

/**
 * Hook for managing a single appointment's lifecycle
 */
export function useAppointmentActions(appointmentId?: string, slug?: string) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { isConfigured, isDemo, shouldCallApi } = useApiMode(slug ?? null);

    const updateStatus = useCallback(async (status: 'Pendiente' | 'Confirmado' | 'Cancelado') => {
        if (!appointmentId) return;

        setLoading(true);
        setError(null);

        try {
            if (shouldCallApi) {
                await sheetsService.updateAppointmentStatus(appointmentId, status);
            } else {
                logger.debug('[DEMO] Updated status:', appointmentId, status);
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Error actualizando estado';
            setError(message);
            throw new Error(message);
        } finally {
            setLoading(false);
        }
    }, [appointmentId, shouldCallApi, isDemo]);

    const deleteAppointment = useCallback(async () => {
        if (!appointmentId) return;

        setLoading(true);
        setError(null);

        try {
            if (shouldCallApi) {
                await sheetsService.deleteAppointment(appointmentId);
            } else {
                logger.debug('[DEMO] Deleted appointment:', appointmentId);
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Error eliminando turno';
            setError(message);
            throw new Error(message);
        } finally {
            setLoading(false);
        }
    }, [appointmentId, shouldCallApi, isDemo]);

    return { updateStatus, deleteAppointment, loading, error };
}
