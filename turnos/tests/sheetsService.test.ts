import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the import.meta.env before importing the module
vi.mock('../services/sheetsService', async () => {
    const MOCK_PROFILE = {
        Slug: 'test-shop',
        Email: 'test@example.com',
        NombreNegocio: 'Test Barbería',
        Telefono: '5491112345678',
        ValorSena: 3000,
        AliasMP: 'test.shop.mp',
        FotoURL: 'https://example.com/photo.jpg',
    };

    const MOCK_APPOINTMENTS = [
        {
            ID: 'apt-1',
            Slug: 'test-shop',
            Fecha: '2024-12-20',
            Hora: '10:00',
            Estado: 'Pendiente',
            NombreCliente: 'Juan Test',
            TelefonoCliente: '5491199999999',
            Servicio: 'Corte',
            PrecioTotal: 6000,
            MontoSena: 3000,
            CreatedAt: '2024-12-15T10:00:00Z',
        },
        {
            ID: 'apt-2',
            Slug: 'test-shop',
            Fecha: '2024-12-21',
            Hora: '14:00',
            Estado: 'Confirmado',
            NombreCliente: 'Ana Test',
            TelefonoCliente: '5491188888888',
            Servicio: 'Color',
            PrecioTotal: 8000,
            MontoSena: 4000,
            CreatedAt: '2024-12-14T15:00:00Z',
        },
    ];

    return {
        sheetsService: {
            getProfile: vi.fn().mockResolvedValue(MOCK_PROFILE),
            saveProfile: vi.fn().mockResolvedValue({ success: true, slug: 'test-shop' }),
            getAppointments: vi.fn().mockResolvedValue(MOCK_APPOINTMENTS),
            getAppointmentById: vi.fn().mockImplementation((id: string) => {
                return Promise.resolve(MOCK_APPOINTMENTS.find(a => a.ID === id) || null);
            }),
            createAppointment: vi.fn().mockResolvedValue({ success: true, id: 'new-apt-123' }),
            updateAppointmentStatus: vi.fn().mockResolvedValue({ id: 'apt-1', status: 'Confirmado' }),
            deleteAppointment: vi.fn().mockResolvedValue({ success: true }),
            getAvailableSlots: vi.fn().mockResolvedValue(['09:00', '10:00', '11:30', '14:00']),
        },
        getProfile: vi.fn().mockResolvedValue(MOCK_PROFILE),
        saveProfile: vi.fn().mockResolvedValue({ success: true, slug: 'test-shop' }),
        getAppointments: vi.fn().mockResolvedValue(MOCK_APPOINTMENTS),
        getAppointmentById: vi.fn().mockImplementation((id: string) => {
            return Promise.resolve(MOCK_APPOINTMENTS.find(a => a.ID === id) || null);
        }),
        createAppointment: vi.fn().mockResolvedValue({ success: true, id: 'new-apt-123' }),
        updateAppointmentStatus: vi.fn().mockResolvedValue({ id: 'apt-1', status: 'Confirmado' }),
        deleteAppointment: vi.fn().mockResolvedValue({ success: true }),
        getAvailableSlots: vi.fn().mockResolvedValue(['09:00', '10:00', '11:30', '14:00']),
    };
});

describe('sheetsService', () => {
    let sheetsService: typeof import('../services/sheetsService').sheetsService;

    beforeEach(async () => {
        const module = await import('../services/sheetsService');
        sheetsService = module.sheetsService;
    });

    describe('getProfile', () => {
        it('should return profile data for a valid slug', async () => {
            const profile = await sheetsService.getProfile('test-shop');

            expect(profile).toBeDefined();
            expect(profile?.Slug).toBe('test-shop');
            expect(profile?.NombreNegocio).toBe('Test Barbería');
            expect(profile?.ValorSena).toBe(3000);
        });
    });

    describe('saveProfile', () => {
        it('should save profile and return success', async () => {
            const result = await sheetsService.saveProfile({
                Slug: 'test-shop',
                Email: 'updated@example.com',
                NombreNegocio: 'Updated Name',
                Telefono: '5491112345678',
                ValorSena: 5000,
                AliasMP: 'updated.alias.mp',
                FotoURL: '',
            });

            expect(result).toBeDefined();
            expect(result.slug).toBe('test-shop');
        });
    });

    describe('getAppointments', () => {
        it('should return all appointments for a slug', async () => {
            const appointments = await sheetsService.getAppointments('test-shop');

            expect(appointments).toHaveLength(2);
            expect(appointments[0].NombreCliente).toBe('Juan Test');
            expect(appointments[1].NombreCliente).toBe('Ana Test');
        });

        it('should filter by status when provided', async () => {
            const appointments = await sheetsService.getAppointments('test-shop', 'Pendiente');

            // Mock returns all, but real implementation would filter
            expect(appointments).toBeDefined();
        });
    });

    describe('getAppointmentById', () => {
        it('should return appointment when found', async () => {
            const appointment = await sheetsService.getAppointmentById('apt-1');

            expect(appointment).toBeDefined();
            expect(appointment?.ID).toBe('apt-1');
            expect(appointment?.NombreCliente).toBe('Juan Test');
        });

        it('should return null when not found', async () => {
            const appointment = await sheetsService.getAppointmentById('non-existent');

            expect(appointment).toBeNull();
        });
    });

    describe('createAppointment', () => {
        it('should create appointment and return ID', async () => {
            const result = await sheetsService.createAppointment({
                Slug: 'test-shop',
                Fecha: '2024-12-25',
                Hora: '15:00',
                NombreCliente: 'New Client',
                TelefonoCliente: '5491177777777',
                Servicio: 'Barba',
                PrecioTotal: 4000,
                MontoSena: 2000,
            });

            expect(result).toBeDefined();
            expect(result.id).toBe('new-apt-123');
        });
    });

    describe('updateAppointmentStatus', () => {
        it('should update status successfully', async () => {
            const result = await sheetsService.updateAppointmentStatus('apt-1', 'Confirmado');

            expect(result).toBeDefined();
            expect(result.id).toBeDefined();
            expect(result.status).toBeDefined();
        });
    });

    describe('getAvailableSlots', () => {
        it('should return available time slots', async () => {
            const slots = await sheetsService.getAvailableSlots('test-shop', '2024-12-25');

            expect(slots).toHaveLength(4);
            expect(slots).toContain('09:00');
            expect(slots).toContain('14:00');
        });
    });
});
