import { describe, expect, it } from 'vitest';
import { generateTimeSlots } from '../../shared/timeUtils';

describe('timeUtils', () => {
    describe('generateTimeSlots', () => {
        it('generates slots using the requested interval', () => {
            expect(generateTimeSlots('08:00', '09:00', 15)).toEqual([
                '08:00',
                '08:15',
                '08:30',
                '08:45',
                '09:00',
            ]);
        });

        it('keeps the existing 30-minute schedule grid compatible', () => {
            const slots = generateTimeSlots('08:00', '21:00', 30);
            expect(slots[0]).toBe('08:00');
            expect(slots[1]).toBe('08:30');
            expect(slots.at(-1)).toBe('21:00');
        });

        it('returns an empty list for invalid or unsafe intervals', () => {
            expect(generateTimeSlots('08:00', '09:00', 0)).toEqual([]);
            expect(generateTimeSlots('08:00', '09:00', -15)).toEqual([]);
            expect(generateTimeSlots('bad', '09:00', 15)).toEqual([]);
        });
    });
});
