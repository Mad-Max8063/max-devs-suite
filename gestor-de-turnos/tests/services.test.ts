import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock sheetsService with services-related endpoints
vi.mock('../services/sheetsService', async () => {
    const MOCK_SERVICES = {
        categoriaId: 'barberia',
        services: [
            { id: 'bar-1', nombre: 'Corte Caballero', duracion: 30, precio: 20000, sena: 3000, activo: true, orden: 0 },
            { id: 'bar-2', nombre: 'Arreglo de Barba', duracion: 20, precio: 15000, sena: 0, activo: true, orden: 1 },
            { id: 'bar-3', nombre: 'Corte + Barba', duracion: 45, precio: 32000, sena: 5000, activo: false, orden: 2 },
        ],
    };

    return {
        sheetsService: {
            getServices: vi.fn().mockResolvedValue(MOCK_SERVICES),
            saveServices: vi.fn().mockResolvedValue({ success: true }),
            getProfile: vi.fn().mockResolvedValue({ Slug: 'test-shop', NotificacionesEmail: true }),
            getAppointments: vi.fn().mockResolvedValue([]),
            createAppointment: vi.fn().mockResolvedValue({ success: true, id: 'apt-1' }),
            updateAppointmentStatus: vi.fn().mockResolvedValue({ success: true, id: 'apt-1', status: 'Confirmado' }),
            deleteAppointment: vi.fn().mockResolvedValue({ success: true }),
            getAvailableSlots: vi.fn().mockResolvedValue([]),
            saveProfile: vi.fn().mockResolvedValue({ success: true }),
            getAppointmentById: vi.fn().mockResolvedValue(null),
        },
    };
});

describe('sheetsService — Services CRUD', () => {
    let sheetsService: typeof import('../services/sheetsService').sheetsService;

    beforeEach(async () => {
        vi.clearAllMocks();
        const module = await import('../services/sheetsService');
        sheetsService = module.sheetsService;
    });

    describe('getServices', () => {
        it('should fetch services for a given slug', async () => {
            const result = await sheetsService.getServices('test-shop');

            expect(result).toBeDefined();
            expect(result.categoriaId).toBe('barberia');
            expect(result.services).toHaveLength(3);
        });

        it('should return correct service structure', async () => {
            const result = await sheetsService.getServices('test-shop');
            const first = result.services[0];

            expect(first).toHaveProperty('id');
            expect(first).toHaveProperty('nombre');
            expect(first).toHaveProperty('duracion');
            expect(first).toHaveProperty('precio');
            expect(first).toHaveProperty('sena');
            expect(first).toHaveProperty('activo');
            expect(first).toHaveProperty('orden');
        });

        it('should include both active and inactive services', async () => {
            const result = await sheetsService.getServices('test-shop');

            const activeCount = result.services.filter(s => s.activo).length;
            const inactiveCount = result.services.filter(s => !s.activo).length;

            expect(activeCount).toBe(2);
            expect(inactiveCount).toBe(1);
        });

        it('should maintain correct ordering', async () => {
            const result = await sheetsService.getServices('test-shop');

            expect(result.services[0].nombre).toBe('Corte Caballero');
            expect(result.services[1].nombre).toBe('Arreglo de Barba');
            expect(result.services[2].nombre).toBe('Corte + Barba');
        });
    });

    describe('saveServices', () => {
        it('should save services and return success', async () => {
            const services = [
                { id: 'bar-1', nombre: 'Corte', duracion: 30, precio: 20000, sena: 3000, activo: true, orden: 0 },
            ];

            const result = await sheetsService.saveServices('test-shop', services, 'barberia');

            expect(result).toBeDefined();
            expect(result.success).toBe(true);
        });

        it('should call saveServices with correct arguments', async () => {
            const services = [
                { id: 'new-1', nombre: 'Tinte', duracion: 60, precio: 50000, sena: 10000, activo: true, orden: 0 },
            ];

            await sheetsService.saveServices('my-shop', services, 'peluqueria');

            expect(sheetsService.saveServices).toHaveBeenCalledWith('my-shop', services, 'peluqueria');
        });

        it('should handle empty services array', async () => {
            const result = await sheetsService.saveServices('test-shop', [], null);

            expect(result.success).toBe(true);
        });
    });
});

describe('sheetsService — Appointment with EmailCliente', () => {
    let sheetsService: typeof import('../services/sheetsService').sheetsService;

    beforeEach(async () => {
        vi.clearAllMocks();
        const module = await import('../services/sheetsService');
        sheetsService = module.sheetsService;
    });

    it('should create appointment with email', async () => {
        const result = await sheetsService.createAppointment({
            Slug: 'test-shop',
            Fecha: '2025-03-01',
            Hora: '10:00',
            NombreCliente: 'Maria Test',
            TelefonoCliente: '5491199999999',
            EmailCliente: 'maria@test.com',
            Servicio: 'Corte',
            PrecioTotal: 20000,
            MontoSena: 3000,
        });

        expect(result).toBeDefined();
        expect(result.id).toBe('apt-1');
    });

    it('should create appointment without email (optional)', async () => {
        const result = await sheetsService.createAppointment({
            Slug: 'test-shop',
            Fecha: '2025-03-01',
            Hora: '11:00',
            NombreCliente: 'Juan Test',
            TelefonoCliente: '5491188888888',
        });

        expect(result).toBeDefined();
        expect(result.id).toBe('apt-1');
    });

    it('should return status when updating appointment', async () => {
        const result = await sheetsService.updateAppointmentStatus('apt-1', 'Confirmado');

        expect(result).toBeDefined();
        expect(result.status).toBe('Confirmado');
    });
});
