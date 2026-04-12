/**
 * Application Constants
 * 
 * Centralizes magic strings and values used throughout the app.
 */

// Slugs
export const DEMO_SLUG = 'demo';

// Appointment statuses
export const STATUS_PENDING = 'Pendiente';
export const STATUS_CONFIRMED = 'Confirmado';

// Days of week (JavaScript convention: 0 = Sunday)
export const DAYS_OF_WEEK = {
    SUNDAY: 0,
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
    SATURDAY: 6,
} as const;

// Day names in Spanish
export const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'] as const;
export const DAY_NAMES_FULL = [
    'Domingo',
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
    'Sábado',
] as const;

// Day info for UI components (array form with id, name, short)
export const DAYS_OF_WEEK_LIST = [
    { id: 0, name: 'Domingo', short: 'Dom' },
    { id: 1, name: 'Lunes', short: 'Lun' },
    { id: 2, name: 'Martes', short: 'Mar' },
    { id: 3, name: 'Miércoles', short: 'Mié' },
    { id: 4, name: 'Jueves', short: 'Jue' },
    { id: 5, name: 'Viernes', short: 'Vie' },
    { id: 6, name: 'Sábado', short: 'Sáb' },
] as const;

// All available time slots for schedule configuration
export const ALL_TIME_SLOTS = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
    '20:00', '20:30', '21:00',
] as const;

// Default values
export const DEFAULT_SERVICE = 'Servicio General';
export const DEFAULT_SENA = 2000;
export const DEFAULT_TURNO_DURATION = 60; // minutes

// ============================================
// SERVICE TYPES
// ============================================
export interface Service {
    id: string;
    nombre: string;
    duracion: number; // minutes
    precio: number;   // ARS
    sena: number;     // ARS (deposit)
    activo: boolean;
    orden: number;
}

export interface BusinessCategory {
    id: string;
    nombre: string;
    emoji: string;
    descripcion: string;
    servicios: Omit<Service, 'activo' | 'orden'>[];
}

// ============================================
// BUSINESS CATEGORIES WITH PRESETS
// Buenos Aires 2025 — Ordered by market demand
// ============================================
export const BUSINESS_CATEGORIES: BusinessCategory[] = [
    // ── CORE (Top 5 by demand) ──────────────────
    {
        id: 'peluqueria',
        nombre: 'Peluquería Unisex',
        emoji: '💇',
        descripcion: 'Cortes, coloración, peinados y tratamientos capilares',
        servicios: [
            { id: 'pel-1', nombre: 'Corte Mujer', duracion: 40, precio: 38000, sena: 5000 },
            { id: 'pel-2', nombre: 'Corte Hombre', duracion: 25, precio: 18000, sena: 3000 },
            { id: 'pel-3', nombre: 'Corte Niño/a', duracion: 20, precio: 16000, sena: 0 },
            { id: 'pel-4', nombre: 'Brushing', duracion: 30, precio: 20000, sena: 0 },
            { id: 'pel-5', nombre: 'Coloración', duracion: 60, precio: 95000, sena: 15000 },
            { id: 'pel-6', nombre: 'Mechas / Balayage', duracion: 120, precio: 150000, sena: 30000 },
            { id: 'pel-7', nombre: 'Peinado / Recogido', duracion: 45, precio: 55000, sena: 10000 },
            { id: 'pel-8', nombre: 'Tratamiento Capilar (Keratina/Botox)', duracion: 60, precio: 75000, sena: 15000 },
        ],
    },
    {
        id: 'barberia',
        nombre: 'Barbería',
        emoji: '💈',
        descripcion: 'Cortes masculinos, barba y tratamientos',
        servicios: [
            { id: 'bar-1', nombre: 'Corte Caballero', duracion: 30, precio: 20000, sena: 3000 },
            { id: 'bar-2', nombre: 'Arreglo de Barba', duracion: 20, precio: 15000, sena: 0 },
            { id: 'bar-3', nombre: 'Corte + Barba', duracion: 45, precio: 32000, sena: 5000 },
            { id: 'bar-4', nombre: 'Corte Niño', duracion: 20, precio: 15000, sena: 0 },
            { id: 'bar-5', nombre: 'Cejas', duracion: 10, precio: 5000, sena: 0 },
        ],
    },
    {
        id: 'unas',
        nombre: 'Manicuría y Uñas',
        emoji: '💅',
        descripcion: 'Manicuría, esculpidas, semipermanente y pedicuría',
        servicios: [
            { id: 'una-1', nombre: 'Manicuría Clásica', duracion: 30, precio: 12000, sena: 0 },
            { id: 'una-2', nombre: 'Esmaltado Semipermanente', duracion: 45, precio: 18000, sena: 3000 },
            { id: 'una-3', nombre: 'Esculpidas Acrílico', duracion: 90, precio: 28000, sena: 5000 },
            { id: 'una-4', nombre: 'Esculpidas Poligel', duracion: 90, precio: 30000, sena: 5000 },
            { id: 'una-5', nombre: 'Pedicuría', duracion: 45, precio: 25000, sena: 0 },
            { id: 'una-6', nombre: 'Retiro Esculpidas', duracion: 30, precio: 8000, sena: 0 },
        ],
    },
    {
        id: 'cejas-pestanas',
        nombre: 'Cejas y Pestañas',
        emoji: '👁️',
        descripcion: 'Perfilado, laminado, lifting y extensiones',
        servicios: [
            { id: 'cep-1', nombre: 'Perfilado de Cejas', duracion: 15, precio: 13000, sena: 0 },
            { id: 'cep-2', nombre: 'Laminado de Cejas', duracion: 30, precio: 20000, sena: 3000 },
            { id: 'cep-3', nombre: 'Lifting de Pestañas', duracion: 45, precio: 25000, sena: 5000 },
            { id: 'cep-4', nombre: 'Extensiones Clásicas', duracion: 90, precio: 28000, sena: 5000 },
            { id: 'cep-5', nombre: 'Extensiones 3D/4D', duracion: 120, precio: 34000, sena: 5000 },
            { id: 'cep-6', nombre: 'Tinte de Cejas / Henna', duracion: 15, precio: 13000, sena: 0 },
        ],
    },
    {
        id: 'depilacion',
        nombre: 'Depilación',
        emoji: '✨',
        descripcion: 'Depilación con cera y láser',
        servicios: [
            { id: 'dep-1', nombre: 'Axilas', duracion: 15, precio: 9000, sena: 0 },
            { id: 'dep-2', nombre: 'Cavado / Bikini', duracion: 20, precio: 10000, sena: 0 },
            { id: 'dep-3', nombre: 'Media Pierna', duracion: 30, precio: 15000, sena: 0 },
            { id: 'dep-4', nombre: 'Piernas Completas', duracion: 60, precio: 22000, sena: 3000 },
            { id: 'dep-5', nombre: 'Bozo', duracion: 10, precio: 7000, sena: 0 },
            { id: 'dep-6', nombre: 'Rostro Completo', duracion: 20, precio: 18000, sena: 0 },
        ],
    },

    // ── SECONDARY ───────────────────────────────
    {
        id: 'estetica-facial',
        nombre: 'Estética Facial',
        emoji: '🧖',
        descripcion: 'Limpieza facial, peelings y tratamientos anti-age',
        servicios: [
            { id: 'est-1', nombre: 'Limpieza Facial Profunda', duracion: 60, precio: 48000, sena: 10000 },
            { id: 'est-2', nombre: 'Peeling Químico', duracion: 45, precio: 60000, sena: 10000 },
            { id: 'est-3', nombre: 'Microneedling / Dermapen', duracion: 45, precio: 38500, sena: 10000 },
            { id: 'est-4', nombre: 'Radiofrecuencia Facial', duracion: 30, precio: 45000, sena: 10000 },
        ],
    },
    {
        id: 'masajes',
        nombre: 'Masajes y Bienestar',
        emoji: '💆',
        descripcion: 'Masajes descontracturantes, relajantes y drenaje',
        servicios: [
            { id: 'mas-1', nombre: 'Masaje Descontracturante', duracion: 60, precio: 35000, sena: 5000 },
            { id: 'mas-2', nombre: 'Masaje Relajante', duracion: 60, precio: 35000, sena: 5000 },
            { id: 'mas-3', nombre: 'Drenaje Linfático', duracion: 60, precio: 35000, sena: 5000 },
            { id: 'mas-4', nombre: 'Reflexología', duracion: 45, precio: 30000, sena: 5000 },
        ],
    },

    // ── PERSONALIZADO ───────────────────────────
    {
        id: 'personalizado',
        nombre: 'Personalizado',
        emoji: '✏️',
        descripcion: 'Configurá tus propios servicios desde cero',
        servicios: [],
    },
];
