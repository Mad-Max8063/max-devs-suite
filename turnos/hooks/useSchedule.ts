import { useState, useCallback, useEffect } from 'react';
import { logger } from '../utils/logger';
import {
    sheetsService,
    ScheduleConfig,
    BlockedDate,
} from '../services/sheetsService';
import { DAYS_OF_WEEK_LIST, ALL_TIME_SLOTS, DEFAULT_SLOT_INTERVAL } from '../constants';

// Re-export for backwards compatibility with ScheduleConfigPage imports
export { DAYS_OF_WEEK_LIST as DAYS_OF_WEEK, ALL_TIME_SLOTS };

import { useApiMode } from './useApiMode';

// Default schedule for demo mode - Extended hours to showcase full functionality
export const DEFAULT_SCHEDULE: ScheduleConfig = {
    duracionTurno: 60,
    frecuenciaTurnos: DEFAULT_SLOT_INTERVAL,
    horariosPorDia: {
        1: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'], // Lunes
        2: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'], // Martes
        3: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'], // Miércoles
        4: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'], // Jueves
        5: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'], // Viernes
        6: ['10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'], // Sábado
        // Domingo (0) no tiene horarios - día libre
    },
};

/**
 * Hook for managing entrepreneur's schedule configuration
 */
export function useSchedule(slug: string) {
    const [schedule, setSchedule] = useState<ScheduleConfig>(DEFAULT_SCHEDULE);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { isConfigured, isDemo, shouldCallApi } = useApiMode(slug);

    // Fetch schedule on mount
    const fetchSchedule = useCallback(async () => {
        if (!slug) return;

        setLoading(true);
        setError(null);

        try {
            if (shouldCallApi) {
                const data = await sheetsService.getSchedule(slug);
                logger.debug('[useSchedule] Fetched schedule:', {
                    slug,
                    duracionTurno: data.duracionTurno,
                    frecuenciaTurnos: data.frecuenciaTurnos,
                    days: Object.keys(data.horariosPorDia),
                    slotsPerDay: Object.entries(data.horariosPorDia).map(([d, s]) => `${d}:${(s as string[]).length}`)
                });

                // Smart Merge: si el backend devuelve un schedule vacío o sin días,
                // usamos los valores por defecto para que usuarios nuevos tengan horarios
                const hasAnySlots = data.horariosPorDia &&
                    Object.keys(data.horariosPorDia).length > 0 &&
                    Object.values(data.horariosPorDia).some((slots: string[]) => slots && slots.length > 0);

                if (hasAnySlots) {
                    logger.debug('[useSchedule] Using fetched schedule');
                    setSchedule(data);
                } else {
                    // Usuario nuevo: usar defaults
                    logger.debug('[useSchedule] No saved schedule found, using defaults');
                    setSchedule(DEFAULT_SCHEDULE);
                }
            } else {
                // Demo mode: use default
                logger.debug('[useSchedule] Demo mode, using defaults');
                setSchedule(DEFAULT_SCHEDULE);
            }
        } catch (err) {
            logger.error('[useSchedule] Error fetching schedule:', err);
            const message = err instanceof Error ? err.message : 'Error cargando horarios';
            setError(message);
            setSchedule(DEFAULT_SCHEDULE);
        } finally {
            setLoading(false);
        }
    }, [slug, isConfigured, isDemo, shouldCallApi]);

    // Save schedule
    const saveScheduleConfig = useCallback(async (config: ScheduleConfig) => {
        if (!slug) return;

        setSaving(true);
        setError(null);

        logger.debug('[useSchedule] Saving schedule:', {
            slug,
            duracionTurno: config.duracionTurno,
            frecuenciaTurnos: config.frecuenciaTurnos,
            days: Object.keys(config.horariosPorDia),
            slotsPerDay: Object.entries(config.horariosPorDia).map(([d, s]) => `${d}:${(s as string[]).length}`)
        });

        try {
            if (shouldCallApi) {
                const result = await sheetsService.saveSchedule(slug, config);
                logger.debug('[useSchedule] Save result:', result);
            } else {
                logger.debug('[DEMO] Saved schedule:', config);
            }
            setSchedule(config);
            logger.debug('[useSchedule] Schedule saved successfully');
        } catch (err) {
            logger.error('[useSchedule] Error saving schedule:', err);
            const message = err instanceof Error ? err.message : 'Error guardando horarios';
            setError(message);
            throw new Error(message);
        } finally {
            setSaving(false);
        }
    }, [slug, isConfigured, isDemo, shouldCallApi]);

    // Toggle a time slot for a specific day
    const toggleSlot = useCallback((day: number, slot: string) => {
        setSchedule((prev) => {
            const daySlots = prev.horariosPorDia[day] || [];
            const newSlots = daySlots.includes(slot)
                ? daySlots.filter((s) => s !== slot)
                : [...daySlots, slot].sort();

            return {
                ...prev,
                horariosPorDia: {
                    ...prev.horariosPorDia,
                    [day]: newSlots,
                },
            };
        });
    }, []);

    // Set duration
    const setDuration = useCallback((minutes: number) => {
        setSchedule((prev) => ({
            ...prev,
            duracionTurno: minutes,
        }));
    }, []);

    // Set slot grid frequency
    const setFrequency = useCallback((minutes: number) => {
        setSchedule((prev) => ({
            ...prev,
            frecuenciaTurnos: minutes,
        }));
    }, []);

    // Copy schedule from one day to others
    const copyDaySchedule = useCallback((fromDay: number, toDays: number[]) => {
        setSchedule((prev) => {
            const sourceSlots = prev.horariosPorDia[fromDay] || [];
            const newHorarios = { ...prev.horariosPorDia };
            toDays.forEach((day) => {
                newHorarios[day] = [...sourceSlots];
            });
            return { ...prev, horariosPorDia: newHorarios };
        });
    }, []);

    // Auto-fetch on mount
    useEffect(() => {
        fetchSchedule();
    }, [fetchSchedule]);

    return {
        schedule,
        loading,
        saving,
        error,
        fetchSchedule,
        saveSchedule: saveScheduleConfig,
        toggleSlot,
        setDuration,
        setFrequency,
        copyDaySchedule,
    };
}

/**
 * Hook for managing blocked dates
 */
export function useBlockedDates(slug: string) {
    const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { isConfigured, isDemo, shouldCallApi } = useApiMode(slug);

    // Fetch blocked dates
    const fetchBlockedDates = useCallback(async () => {
        if (!slug) return;

        setLoading(true);
        setError(null);

        try {
            if (shouldCallApi) {
                const data = await sheetsService.getBlockedDates(slug);
                setBlockedDates(data);
            } else {
                // Demo mode
                setBlockedDates([]);
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Error cargando fechas bloqueadas';
            setError(message);
        } finally {
            setLoading(false);
        }
    }, [slug, isConfigured, isDemo, shouldCallApi]);

    // Save blocked dates
    const saveBlockedDatesConfig = useCallback(async (fechas: BlockedDate[]) => {
        if (!slug) return;

        setSaving(true);
        setError(null);

        try {
            if (shouldCallApi) {
                await sheetsService.saveBlockedDates(slug, fechas);
            } else {
                logger.debug('[DEMO] Saved blocked dates:', fechas);
            }
            setBlockedDates(fechas);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Error guardando fechas bloqueadas';
            setError(message);
            throw new Error(message);
        } finally {
            setSaving(false);
        }
    }, [slug, isConfigured, isDemo, shouldCallApi]);

    // Add a blocked date
    const addBlockedDate = useCallback((fecha: string, motivo: string = '') => {
        setBlockedDates((prev) => {
            if (prev.some((d) => d.Fecha === fecha)) return prev;
            return [...prev, { Fecha: fecha, Motivo: motivo }];
        });
    }, []);

    // Remove a blocked date
    const removeBlockedDate = useCallback((fecha: string) => {
        setBlockedDates((prev) => prev.filter((d) => d.Fecha !== fecha));
    }, []);

    // Auto-fetch on mount
    useEffect(() => {
        fetchBlockedDates();
    }, [fetchBlockedDates]);

    return {
        blockedDates,
        loading,
        saving,
        error,
        fetchBlockedDates,
        saveBlockedDates: saveBlockedDatesConfig,
        addBlockedDate,
        removeBlockedDate,
    };
}

/**
 * Hook for consuming schedule info in client-facing pages (e.g., BookingPage)
 * Provides helper functions to check availability
 */
export function useScheduleInfo(slug: string) {
    const [schedule, setSchedule] = useState<ScheduleConfig>(DEFAULT_SCHEDULE);
    const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { isConfigured, isDemo, shouldCallApi } = useApiMode(slug);

    // Fetch both schedule and blocked dates
    useEffect(() => {
        if (!slug) return;

        const fetchData = async () => {
            setLoading(true);
            setError(null);

            try {
                if (shouldCallApi) {
                    const [scheduleData, blockedData] = await Promise.all([
                        sheetsService.getSchedule(slug),
                        sheetsService.getBlockedDates(slug),
                    ]);

                    // Smart Merge: si el backend devuelve un schedule vacío,
                    // usamos los valores por defecto
                    const hasAnySlots = scheduleData.horariosPorDia &&
                        Object.keys(scheduleData.horariosPorDia).length > 0 &&
                        Object.values(scheduleData.horariosPorDia).some((slots: string[]) => slots && slots.length > 0);

                    if (hasAnySlots) {
                        setSchedule(scheduleData);
                    } else {
                        logger.debug('[ScheduleInfo] No saved schedule found, using defaults');
                        setSchedule(DEFAULT_SCHEDULE);
                    }
                    setBlockedDates(blockedData);
                } else {
                    // Demo mode
                    setSchedule(DEFAULT_SCHEDULE);
                    setBlockedDates([]);
                }
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Error cargando configuración';
                setError(message);
                setSchedule(DEFAULT_SCHEDULE);
                setBlockedDates([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [slug, isConfigured, isDemo, shouldCallApi]);

    /**
     * Check if a specific day of week has scheduled slots
     * @param dayOfWeek - 0-6 (Sunday to Saturday)
     */
    const hasScheduleForDay = useCallback((dayOfWeek: number): boolean => {
        const slots = schedule.horariosPorDia[dayOfWeek];
        return slots && slots.length > 0;
    }, [schedule.horariosPorDia]);

    /**
     * Check if a specific date is blocked
     * @param date - Date object or string in YYYY-MM-DD format
     */
    const isDateBlocked = useCallback((date: Date | string): boolean => {
        let dateStr: string;
        if (typeof date === 'string') {
            dateStr = date;
        } else {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            dateStr = `${year}-${month}-${day}`;
        }
        return blockedDates.some(b => b.Fecha === dateStr);
    }, [blockedDates]);

    /**
     * Check if a date is available for booking
     * - Has schedule for that day of week
     * - Not blocked
     * - Not in the past
     */
    const isDateAvailable = useCallback((date: Date): boolean => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check if in the past
        if (date < today) return false;

        // Check if day of week has schedule
        const dayOfWeek = date.getDay();
        if (!hasScheduleForDay(dayOfWeek)) return false;

        // Check if blocked
        if (isDateBlocked(date)) return false;

        return true;
    }, [hasScheduleForDay, isDateBlocked]);

    /**
     * Get the list of days (0-6) that have schedules
     */
    const workingDays = Object.entries(schedule.horariosPorDia)
        .filter(([, slots]) => slots && (slots as string[]).length > 0)
        .map(([day]) => parseInt(day));

    return {
        schedule,
        blockedDates,
        loading,
        error,
        hasScheduleForDay,
        isDateBlocked,
        isDateAvailable,
        workingDays,
        duration: schedule.duracionTurno,
    };
}

