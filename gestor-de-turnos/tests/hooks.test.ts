import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCreateAppointment, useAvailableSlots, useAppointmentActions } from '../hooks/useAppointments';

// Mock the sheetsService
vi.mock('../services/sheetsService', () => ({
    sheetsService: {
        createAppointment: vi.fn().mockResolvedValue({ id: 'new-apt-123' }),
        getAvailableSlots: vi.fn().mockResolvedValue(['09:00', '10:00', '14:00']),
        updateAppointmentStatus: vi.fn().mockResolvedValue({ success: true }),
        deleteAppointment: vi.fn().mockResolvedValue({ success: true }),
    },
}));

// Note: import.meta.env is mocked in setup.ts
// This means hooks will run in demo mode during tests

describe('useCreateAppointment', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should initialize with correct default state', () => {
        const { result } = renderHook(() => useCreateAppointment());

        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
        expect(result.current.createdId).toBeNull();
    });

    it('should create appointment and return an ID', async () => {
        // In demo mode, this generates a demo- prefixed ID
        const { result } = renderHook(() => useCreateAppointment());

        let appointmentId: string;
        await act(async () => {
            appointmentId = await result.current.create({
                Slug: 'test-shop',
                Fecha: '2024-12-25',
                Hora: '15:00',
                NombreCliente: 'Test Client',
                TelefonoCliente: '5491112345678',
            });
        });

        // Should return some ID (demo- prefix in demo mode)
        expect(appointmentId!).toBeDefined();
        expect(result.current.loading).toBe(false);
    });

    it('should reset state when reset is called', () => {
        const { result } = renderHook(() => useCreateAppointment());

        act(() => {
            result.current.reset();
        });

        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
        expect(result.current.createdId).toBeNull();
    });
});

describe('useAvailableSlots', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should initialize with empty slots', () => {
        const { result } = renderHook(() => useAvailableSlots());

        expect(result.current.slots).toEqual([]);
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
    });

    it('should return slots after fetching', async () => {
        const { result } = renderHook(() => useAvailableSlots());

        await act(async () => {
            await result.current.fetchSlots('test-shop', '2024-12-25');
        });

        // Should return some slots (demo mode uses default slots)
        expect(result.current.slots.length).toBeGreaterThan(0);
        expect(result.current.loading).toBe(false);
    });
});

describe('useAppointmentActions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should initialize with correct default state', () => {
        const { result } = renderHook(() => useAppointmentActions('apt-1'));

        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
    });

    it('should update status without error', async () => {
        const { result } = renderHook(() => useAppointmentActions('apt-1'));

        await act(async () => {
            await result.current.updateStatus('Confirmado');
        });

        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
    });

    it('should delete appointment without error', async () => {
        const { result } = renderHook(() => useAppointmentActions('apt-1'));

        await act(async () => {
            await result.current.deleteAppointment();
        });

        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
    });

    it('should not perform actions when no appointmentId is provided', async () => {
        const { result } = renderHook(() => useAppointmentActions());

        await act(async () => {
            await result.current.updateStatus('Confirmado');
        });

        // Should not throw and loading should stay false
        expect(result.current.loading).toBe(false);
    });
});
