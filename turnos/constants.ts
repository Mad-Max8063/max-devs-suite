import { generateTimeSlots } from '../shared/timeUtils';

/**
 * Application Constants
 * 
 * Centralizes magic strings and values used throughout the app.
 */

// Slugs
export const DEMO_SLUG = 'demo';

// SaaS Logic
export const MAX_FREE_SLOTS = 3; // Limit of slots for free trial expired users

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

// Default schedule grid. The schedule page can generate this dynamically per business.
export const DEFAULT_SLOT_INTERVAL = 30;
export const ALL_TIME_SLOTS = generateTimeSlots('08:00', '21:00', DEFAULT_SLOT_INTERVAL);

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
    label: string;
    nombre: string;
    group: BusinessGroup;
    icon: string;
    searchTags: string[];
    /** @deprecated Use `icon` with Material Symbols instead. */
    emoji?: string;
    descripcion: string;
    servicios: Omit<Service, 'activo' | 'orden'>[];
}

export type BusinessGroup =
    | 'Belleza y Bienestar'
    | 'Salud y Medicina'
    | 'Servicios Profesionales'
    | 'Educacion'
    | 'Hogar y Vehiculos'
    | 'Otros';

// ============================================
// BUSINESS CATEGORIES WITH PRESETS
// Buenos Aires 2025 — Ordered by market demand
// ============================================
export const BUSINESS_CATEGORIES: BusinessCategory[] = [
    // ── CORE (Top 5 by demand) ──────────────────
    {
        id: 'peluqueria',
        label: 'Peluqueria Unisex',
        group: 'Belleza y Bienestar',
        icon: 'face_retouching_natural',
        searchTags: ['peluqueria', 'pelo', 'cabello', 'corte', 'color', 'brushing', 'mechas', 'peinado'],
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
        label: 'Barberia',
        group: 'Belleza y Bienestar',
        icon: 'content_cut',
        searchTags: ['barberia', 'barbero', 'corte', 'barba', 'afeitado', 'caballero'],
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
        label: 'Manicuria y Unas',
        group: 'Belleza y Bienestar',
        icon: 'pan_tool',
        searchTags: ['unas', 'manicuria', 'pedicuria', 'semipermanente', 'esculpidas', 'poligel'],
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
        label: 'Cejas y Pestanas',
        group: 'Belleza y Bienestar',
        icon: 'visibility',
        searchTags: ['cejas', 'pestanas', 'lifting', 'laminado', 'henna', 'extensiones'],
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
        label: 'Depilacion',
        group: 'Belleza y Bienestar',
        icon: 'auto_fix_high',
        searchTags: ['depilacion', 'cera', 'laser', 'bozo', 'rostro', 'piernas'],
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
        label: 'Estetica Facial',
        group: 'Belleza y Bienestar',
        icon: 'spa',
        searchTags: ['estetica', 'facial', 'limpieza', 'peeling', 'antiage', 'dermapen'],
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
        label: 'Masajes y Bienestar',
        group: 'Belleza y Bienestar',
        icon: 'self_improvement',
        searchTags: ['masajes', 'bienestar', 'relajante', 'descontracturante', 'drenaje', 'reflexologia'],
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
        id: 'tatuajes',
        label: 'Tatuajes / Piercing',
        nombre: 'Tatuajes / Piercing',
        group: 'Belleza y Bienestar',
        icon: 'draw',
        searchTags: ['tatuaje', 'tattoo', 'piercing', 'ink', 'perforacion'],
        descripcion: 'Tatuajes, piercing y sesiones de diseno',
        servicios: [],
    },
    {
        id: 'medicina-general',
        label: 'Medico General',
        nombre: 'Medico General',
        group: 'Salud y Medicina',
        icon: 'stethoscope',
        searchTags: ['medico', 'doctor', 'clinico', 'consulta', 'salud'],
        descripcion: 'Consultas medicas generales y controles',
        servicios: [],
    },
    {
        id: 'odontologia',
        label: 'Odontologia',
        nombre: 'Odontologia',
        group: 'Salud y Medicina',
        icon: 'dentistry',
        searchTags: ['dentista', 'odontologo', 'dientes', 'ortodoncia', 'muela'],
        descripcion: 'Turnos odontologicos y tratamientos dentales',
        servicios: [],
    },
    {
        id: 'psicologia',
        label: 'Psicologia',
        nombre: 'Psicologia',
        group: 'Salud y Medicina',
        icon: 'psychology',
        searchTags: ['psicologo', 'terapia', 'salud mental', 'consulta'],
        descripcion: 'Sesiones de terapia y acompanamiento profesional',
        servicios: [],
    },
    {
        id: 'nutricion',
        label: 'Nutricion',
        nombre: 'Nutricion',
        group: 'Salud y Medicina',
        icon: 'restaurant_menu',
        searchTags: ['nutricionista', 'dieta', 'alimentacion', 'salud'],
        descripcion: 'Consultas nutricionales y planes alimentarios',
        servicios: [],
    },
    {
        id: 'kinesiologia',
        label: 'Kinesiologia',
        nombre: 'Kinesiologia',
        group: 'Salud y Medicina',
        icon: 'physical_therapy',
        searchTags: ['kinesiologo', 'rehabilitacion', 'lesion', 'fisioterapia'],
        descripcion: 'Rehabilitacion, fisioterapia y recuperacion funcional',
        servicios: [],
    },
    {
        id: 'abogado',
        label: 'Abogado / Legal',
        nombre: 'Abogado / Legal',
        group: 'Servicios Profesionales',
        icon: 'gavel',
        searchTags: ['abogado', 'leyes', 'legal', 'juridico', 'estudio'],
        descripcion: 'Consultas legales y asesoramiento juridico',
        servicios: [],
    },
    {
        id: 'contador',
        label: 'Contador / Finanzas',
        nombre: 'Contador / Finanzas',
        group: 'Servicios Profesionales',
        icon: 'calculate',
        searchTags: ['contador', 'impuestos', 'finanzas', 'afip', 'contabilidad'],
        descripcion: 'Asesoria contable, fiscal e impositiva',
        servicios: [],
    },
    {
        id: 'consultoria',
        label: 'Consultoria',
        nombre: 'Consultoria',
        group: 'Servicios Profesionales',
        icon: 'support_agent',
        searchTags: ['consultor', 'asesoria', 'negocios', 'b2b', 'estrategia'],
        descripcion: 'Consultoria profesional y sesiones de asesoria',
        servicios: [],
    },
    {
        id: 'coaching',
        label: 'Coaching',
        nombre: 'Coaching',
        group: 'Servicios Profesionales',
        icon: 'record_voice_over',
        searchTags: ['coach', 'mentoria', 'liderazgo', 'desarrollo'],
        descripcion: 'Sesiones de coaching y desarrollo personal',
        servicios: [],
    },
    {
        id: 'clases-particulares',
        label: 'Clases Particulares',
        nombre: 'Clases Particulares',
        group: 'Educacion',
        icon: 'school',
        searchTags: ['profesor', 'clases', 'apoyo', 'ingles', 'matematica'],
        descripcion: 'Clases, cursos y acompanamiento educativo',
        servicios: [],
    },
    {
        id: 'clases-musica',
        label: 'Clases de Musica',
        nombre: 'Clases de Musica',
        group: 'Educacion',
        icon: 'music_note',
        searchTags: ['musica', 'guitarra', 'piano', 'canto', 'instrumento'],
        descripcion: 'Clases de instrumentos, canto y teoria musical',
        servicios: [],
    },
    {
        id: 'taller-mecanico',
        label: 'Taller Mecanico',
        nombre: 'Taller Mecanico',
        group: 'Hogar y Vehiculos',
        icon: 'handyman',
        searchTags: ['auto', 'mecanico', 'taller', 'motor', 'service'],
        descripcion: 'Servicios mecanicos y mantenimiento vehicular',
        servicios: [],
    },
    {
        id: 'car-detailing',
        label: 'Car Detailing',
        nombre: 'Car Detailing',
        group: 'Hogar y Vehiculos',
        icon: 'local_car_wash',
        searchTags: ['lavadero', 'auto', 'limpieza', 'pulido', 'detailing'],
        descripcion: 'Limpieza, pulido y detailing vehicular',
        servicios: [],
    },
    {
        id: 'personalizado',
        label: 'Personalizado',
        group: 'Otros',
        icon: 'dashboard_customize',
        searchTags: ['personalizado', 'otro', 'crear', 'custom', 'nuevo'],
        nombre: 'Personalizado',
        emoji: '✏️',
        descripcion: 'Configurá tus propios servicios desde cero',
        servicios: [],
    },
];
