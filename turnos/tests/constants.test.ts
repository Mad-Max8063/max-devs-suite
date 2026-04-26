import { describe, it, expect } from 'vitest';
import {
    DEMO_SLUG,
    STATUS_PENDING,
    STATUS_CONFIRMED,
    DAYS_OF_WEEK,
    DAY_NAMES,
    DAY_NAMES_FULL,
    DAYS_OF_WEEK_LIST,
    ALL_TIME_SLOTS,
    BUSINESS_CATEGORIES,
    DEFAULT_SENA,
    DEFAULT_TURNO_DURATION,
} from '../constants';

describe('Constants', () => {

    describe('Slugs and Statuses', () => {
        it('should have correct demo slug', () => {
            expect(DEMO_SLUG).toBe('demo');
        });

        it('should have correct status constants', () => {
            expect(STATUS_PENDING).toBe('Pendiente');
            expect(STATUS_CONFIRMED).toBe('Confirmado');
        });

        it('should have reasonable default values', () => {
            expect(DEFAULT_SENA).toBeGreaterThan(0);
            expect(DEFAULT_TURNO_DURATION).toBeGreaterThanOrEqual(15);
            expect(DEFAULT_TURNO_DURATION).toBeLessThanOrEqual(120);
        });
    });

    describe('Days of Week', () => {
        it('should map Sunday to 0 (JS convention)', () => {
            expect(DAYS_OF_WEEK.SUNDAY).toBe(0);
        });

        it('should have 7 day names', () => {
            expect(DAY_NAMES).toHaveLength(7);
            expect(DAY_NAMES_FULL).toHaveLength(7);
        });

        it('should have correct short/full day names', () => {
            expect(DAY_NAMES[0]).toBe('Dom');
            expect(DAY_NAMES_FULL[0]).toBe('Domingo');
            expect(DAY_NAMES[6]).toBe('Sáb');
            expect(DAY_NAMES_FULL[6]).toBe('Sábado');
        });

        it('should have 7 days in DAYS_OF_WEEK_LIST with correct structure', () => {
            expect(DAYS_OF_WEEK_LIST).toHaveLength(7);
            DAYS_OF_WEEK_LIST.forEach((day, index) => {
                expect(day).toHaveProperty('id', index);
                expect(day).toHaveProperty('name');
                expect(day).toHaveProperty('short');
            });
        });
    });

    describe('Time Slots', () => {
        it('should have time slots from 08:00 to 21:00', () => {
            expect(ALL_TIME_SLOTS[0]).toBe('08:00');
            expect(ALL_TIME_SLOTS[ALL_TIME_SLOTS.length - 1]).toBe('21:00');
        });

        it('should have 30-minute interval slots', () => {
            // Verify consecutive slots differ by 30 minutes
            expect(ALL_TIME_SLOTS[0]).toBe('08:00');
            expect(ALL_TIME_SLOTS[1]).toBe('08:30');
            expect(ALL_TIME_SLOTS[2]).toBe('09:00');
        });

        it('should have all slots in valid HH:MM format', () => {
            ALL_TIME_SLOTS.forEach(slot => {
                expect(slot).toMatch(/^\d{2}:\d{2}$/);
            });
        });
    });

    describe('Business Categories', () => {
        it('should have at least 5 categories', () => {
            expect(BUSINESS_CATEGORIES.length).toBeGreaterThanOrEqual(5);
        });

        it('should have a "personalizado" category with empty services', () => {
            const custom = BUSINESS_CATEGORIES.find(c => c.id === 'personalizado');
            expect(custom).toBeDefined();
            expect(custom!.servicios).toHaveLength(0);
        });

        it('should have valid structure for each category', () => {
            BUSINESS_CATEGORIES.forEach(cat => {
                expect(cat).toHaveProperty('id');
                expect(cat).toHaveProperty('label');
                expect(cat).toHaveProperty('nombre');
                expect(cat).toHaveProperty('group');
                expect(cat).toHaveProperty('icon');
                expect(cat).toHaveProperty('searchTags');
                expect(cat).toHaveProperty('descripcion');
                expect(cat).toHaveProperty('servicios');
                expect(cat.id).toBeTruthy();
                expect(cat.label).toBeTruthy();
                expect(cat.nombre).toBeTruthy();
                expect(cat.icon).toBeTruthy();
                expect(Array.isArray(cat.searchTags)).toBe(true);
            });
        });

        it('should have valid services within each category', () => {
            BUSINESS_CATEGORIES.forEach(cat => {
                cat.servicios.forEach(service => {
                    expect(service).toHaveProperty('id');
                    expect(service).toHaveProperty('nombre');
                    expect(service).toHaveProperty('duracion');
                    expect(service).toHaveProperty('precio');
                    expect(service).toHaveProperty('sena');
                    expect(service.duracion).toBeGreaterThan(0);
                    expect(service.precio).toBeGreaterThanOrEqual(0);
                    expect(service.sena).toBeGreaterThanOrEqual(0);
                });
            });
        });

        it('should have unique category IDs', () => {
            const ids = BUSINESS_CATEGORIES.map(c => c.id);
            const uniqueIds = new Set(ids);
            expect(uniqueIds.size).toBe(ids.length);
        });

        it('should have unique service IDs across all categories', () => {
            const allIds: string[] = [];
            BUSINESS_CATEGORIES.forEach(cat => {
                cat.servicios.forEach(s => allIds.push(s.id));
            });
            const uniqueIds = new Set(allIds);
            expect(uniqueIds.size).toBe(allIds.length);
        });

        it('should have barbería category with reasonable prices in ARS', () => {
            const barberia = BUSINESS_CATEGORIES.find(c => c.id === 'barberia');
            expect(barberia).toBeDefined();
            barberia!.servicios.forEach(s => {
                expect(s.precio).toBeGreaterThanOrEqual(5000);
                expect(s.precio).toBeLessThanOrEqual(100000);
            });
        });
    });
});
