import { describe, it, expect } from 'vitest';
import { formatDate, formatDateLong, getTodayString } from '../utils/dateUtils';

describe('dateUtils', () => {

    describe('formatDate', () => {
        it('should format a valid date string in short Spanish format', () => {
            const result = formatDate('2024-12-20');
            // Should contain the day number and short month
            expect(result).toContain('20');
            // Month should be some form of "dic" (December in Spanish)
            expect(result.toLowerCase()).toMatch(/dic/);
        });

        it('should handle different months correctly', () => {
            const january = formatDate('2025-01-15');
            expect(january.toLowerCase()).toMatch(/ene/); // Enero

            const june = formatDate('2025-06-01');
            expect(june.toLowerCase()).toMatch(/jun/);
        });

        it('should include weekday abbreviation', () => {
            // 2024-12-20 is a Friday
            const result = formatDate('2024-12-20');
            expect(result.toLowerCase()).toMatch(/vie/); // Viernes
        });

        it('should handle first day of year', () => {
            const result = formatDate('2025-01-01');
            expect(result).toContain('1');
            expect(result.toLowerCase()).toMatch(/ene/);
        });

        it('should handle last day of year', () => {
            const result = formatDate('2025-12-31');
            expect(result).toContain('31');
            expect(result.toLowerCase()).toMatch(/dic/);
        });
    });

    describe('formatDateLong', () => {
        it('should format a date in long Spanish format', () => {
            const result = formatDateLong('2024-12-20');
            // Should contain full weekday, day number, month, and year
            expect(result.toLowerCase()).toMatch(/viernes/);
            expect(result).toContain('20');
            expect(result.toLowerCase()).toMatch(/diciembre/);
            expect(result).toContain('2024');
        });

        it('should format January correctly', () => {
            const result = formatDateLong('2025-01-01');
            expect(result.toLowerCase()).toMatch(/enero/);
            expect(result).toContain('2025');
        });

        it('should handle leap year day', () => {
            const result = formatDateLong('2024-02-29');
            expect(result).toContain('29');
            expect(result.toLowerCase()).toMatch(/febrero/);
        });
    });

    describe('getTodayString', () => {
        it('should return a string in YYYY-MM-DD format', () => {
            const result = getTodayString();
            expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });

        it('should return today\'s date', () => {
            const result = getTodayString();
            const today = new Date();
            const expected = today.toISOString().split('T')[0];
            expect(result).toBe(expected);
        });

        it('should have valid year, month, and day ranges', () => {
            const result = getTodayString();
            const [year, month, day] = result.split('-').map(Number);
            expect(year).toBeGreaterThanOrEqual(2024);
            expect(month).toBeGreaterThanOrEqual(1);
            expect(month).toBeLessThanOrEqual(12);
            expect(day).toBeGreaterThanOrEqual(1);
            expect(day).toBeLessThanOrEqual(31);
        });
    });
});
