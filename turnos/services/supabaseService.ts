/**
 * Supabase Service — Drop-in replacement for sheetsService
 * 
 * Same interface, same exports. Consumers don't need to change.
 * Uses Supabase PostgreSQL instead of Google Apps Script + Sheets.
 */
import { supabase } from './supabaseClient';
import { logger } from '../utils/logger';

// ============================================
// TYPES (same as sheetsService)
// ============================================
export interface Profile {
    Slug: string;
    Email: string;
    NombreNegocio: string;
    Telefono: string;
    ValorSena: number;
    AliasMP: string;
    LinkPago?: string;
    QrImageUrl?: string;
    ModoSandbox?: boolean;
    FotoURL: string;
    NotificacionesEmail?: boolean;
    RecordatoriosActivos?: boolean;
    FechaVencimiento?: string;
    ColorPrimario?: string;
    IsPremium?: boolean;
    Profession?: string;
    Description?: string;
    Location?: string;
    Facebook?: string;
    Instagram?: string;
    Website?: string;
    whatsapp_message?: string;
    CoverURL?: string;
    GalleryImages?: { image_url: string; caption?: string }[];
    ActiveModules?: string[];
    id?: string;
    subscription_status?: 'basic' | 'trial' | 'active' | 'expired' | 'none';
    trial_ends_at?: string;
    locked_price?: number;
    price_lock_ends_at?: string;
    free_until?: string;
    force_watermark?: boolean;
}

export interface Appointment {
    ID: string;
    Slug: string;
    Fecha: string;
    Hora: string;
    Estado: 'Pendiente' | 'Confirmado' | 'Cancelado';
    NombreCliente: string;
    TelefonoCliente: string;
    EmailCliente?: string;
    Servicio: string;
    PrecioTotal: number;
    MontoSena: number;
    CreatedAt: string;
    CancellationToken?: string;
}

export interface CreateAppointmentData {
    Slug: string;
    Fecha: string;
    Hora: string;
    NombreCliente: string;
    TelefonoCliente: string;
    EmailCliente?: string;
    Servicio?: string;
    PrecioTotal?: number;
    MontoSena?: number;
}

export interface ScheduleConfig {
    duracionTurno: number;
    frecuenciaTurnos: number;
    horariosPorDia: Record<number, string[]>;
}

export interface ServicesData {
    categoriaId: string | null;
    services: Array<{
        id: string;
        nombre: string;
        duracion: number;
        precio: number;
        sena: number;
        activo: boolean;
        orden: number;
    }>;
}

export interface BlockedDate {
    Fecha: string;
    Motivo: string;
}

export interface CancellationAppointment {
    ID: string;
    Slug: string;
    NombreNegocio: string;
    Fecha: string;
    Hora: string;
    Servicio: string;
    Estado: 'Pendiente' | 'Confirmado' | 'Cancelado';
    CanCancel: boolean;
    Reason: 'ok' | 'already_cancelled' | 'too_late';
}

export interface CancellationResult {
    appointmentId: string | null;
    result: 'cancelled' | 'already_cancelled' | 'too_late' | 'not_found';
}

export interface AuthResult {
    user: {
        email: string;
        slug: string;
        subscription_status: string;
        trial_ends_at?: string;
        createdAt: string;
    };
    token: string;
}

// ============================================
// HELPERS
// ============================================

/** Cache slug → business_id to avoid repeated lookups */
const businessCache = new Map<string, string>();

async function getBusinessId(slug: string): Promise<string | null> {
    if (businessCache.has(slug)) return businessCache.get(slug)!;

    const { data, error } = await supabase
        .from('businesses')
        .select('id')
        .eq('slug', slug)
        .single();

    if (error || !data) return null;
    businessCache.set(slug, data.id);
    return data.id;
}

function clearBusinessCache(slug?: string) {
    if (slug) businessCache.delete(slug);
    else businessCache.clear();
}

// ============================================
// PROFILE OPERATIONS
// ============================================
export async function getProfile(slug: string): Promise<Profile | null> {
    const { data, error } = await supabase
        .from('businesses')
        .select(`
            id, slug, nombre_negocio, telefono, email, valor_sena, alias_mp, 
            link_pago, qr_image_url, modo_sandbox, foto_url, color_primario, 
            notificaciones_email, recordatorios_activos, fecha_vencimiento, 
            is_premium, profession, description, location, facebook, 
            instagram, website, whatsapp_message, cover_url, gallery_images, 
            active_modules, subscription_status, trial_ends_at, locked_price, 
            price_lock_ends_at, free_until, force_watermark
        `)
        .eq('slug', slug)
        .single();

    if (error || !data) return null;
    
    return {
        id: data.id,
        Slug: data.slug,
        Email: data.email || '',
        NombreNegocio: data.nombre_negocio,
        Telefono: data.telefono || '',
        ValorSena: data.valor_sena || 2000,
        AliasMP: data.alias_mp || '',
        LinkPago: data.link_pago || '',
        QrImageUrl: data.qr_image_url || '',
        ModoSandbox: data.modo_sandbox || false,
        FotoURL: data.foto_url || '',
        NotificacionesEmail: data.notificaciones_email !== false,
        RecordatoriosActivos: data.recordatorios_activos !== false,
        FechaVencimiento: data.fecha_vencimiento || '',
        ColorPrimario: data.color_primario || '',
        IsPremium: data.is_premium || false,
        Profession: data.profession || '',
        Description: data.description || '',
        Location: data.location || '',
        Facebook: data.facebook || '',
        Instagram: data.instagram || '',
        Website: data.website || '',
        whatsapp_message: data.whatsapp_message || '',
        CoverURL: data.cover_url || '',
        GalleryImages: data.gallery_images || [],
        ActiveModules: data.active_modules || ['card'],
        subscription_status: data.subscription_status || 'none',
        trial_ends_at: data.trial_ends_at,
        locked_price: data.locked_price,
        price_lock_ends_at: data.price_lock_ends_at,
        force_watermark: data.force_watermark || false,
    };
}

export async function saveProfile(profile: Profile): Promise<{ slug: string }> {
    const { error } = await supabase
        .from('businesses')
        .update({
            nombre_negocio: profile.NombreNegocio,
            telefono: profile.Telefono,
            email: profile.Email,
            valor_sena: profile.ValorSena,
            alias_mp: profile.AliasMP,
            link_pago: profile.LinkPago || '',
            qr_image_url: profile.QrImageUrl || '',
            modo_sandbox: profile.ModoSandbox || false,
            foto_url: profile.FotoURL || '',
            color_primario: profile.ColorPrimario || '',
            notificaciones_email: profile.NotificacionesEmail !== false,
            recordatorios_activos: profile.RecordatoriosActivos !== false,
            is_premium: profile.IsPremium || false,
            profession: profile.Profession || '',
            description: profile.Description || '',
            location: profile.Location || '',
            facebook: profile.Facebook || '',
            instagram: profile.Instagram || '',
            website: profile.Website || '',
            whatsapp_message: profile.whatsapp_message || '',
            cover_url: profile.CoverURL || '',
            gallery_images: profile.GalleryImages || [],
            active_modules: profile.ActiveModules || ['card'],
            updated_at: new Date().toISOString(),
        })
        .eq('slug', profile.Slug);

    if (error) throw new Error(error.message);
    return { slug: profile.Slug };
}

// ============================================
// APPOINTMENT OPERATIONS
// ============================================
export async function getAppointments(
    slug: string,
    status?: 'Pendiente' | 'Confirmado' | 'Cancelado' | 'all'
): Promise<Appointment[]> {
    const businessId = await getBusinessId(slug);
    if (!businessId) return [];

    let query = supabase
        .from('appointments')
        .select('*')
        .eq('business_id', businessId)
        .order('fecha', { ascending: true })
        .order('hora', { ascending: true });

    if (status && status !== 'all') {
        query = query.eq('estado', status);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return (data || []).map(row => ({
        ID: row.id,
        Slug: slug,
        Fecha: row.fecha,
        Hora: row.hora,
        Estado: row.estado,
        NombreCliente: row.nombre_cliente,
        TelefonoCliente: row.telefono_cliente,
        EmailCliente: row.email_cliente || '',
        Servicio: row.servicio || '',
        PrecioTotal: row.precio_total || 0,
        MontoSena: row.monto_sena || 0,
        CreatedAt: row.created_at,
        CancellationToken: row.cancellation_token || undefined,
    }));
}

export async function getAppointmentById(id: string): Promise<Appointment | null> {
    const { data, error } = await supabase
        .from('appointments')
        .select('*, businesses!inner(slug)')
        .eq('id', id)
        .single();

    if (error || !data) return null;

    return {
        ID: data.id,
        Slug: (data.businesses as any).slug,
        Fecha: data.fecha,
        Hora: data.hora,
        Estado: data.estado,
        NombreCliente: data.nombre_cliente,
        TelefonoCliente: data.telefono_cliente,
        EmailCliente: data.email_cliente || '',
        Servicio: data.servicio || '',
        PrecioTotal: data.precio_total || 0,
        MontoSena: data.monto_sena || 0,
        CreatedAt: data.created_at,
        CancellationToken: data.cancellation_token || undefined,
    };
}

export async function createAppointment(
    aptData: CreateAppointmentData
): Promise<{ id: string }> {
    const businessId = await getBusinessId(aptData.Slug);
    if (!businessId) throw new Error('Negocio no encontrado');

    const { data, error } = await supabase
        .from('appointments')
        .insert({
            business_id: businessId,
            fecha: aptData.Fecha,
            hora: aptData.Hora,
            nombre_cliente: aptData.NombreCliente,
            telefono_cliente: aptData.TelefonoCliente,
            email_cliente: aptData.EmailCliente || '',
            servicio: aptData.Servicio || '',
            precio_total: aptData.PrecioTotal || 0,
            monto_sena: aptData.MontoSena || 0,
        })
        .select('id')
        .single();

    if (error) {
        // Handle unique constraint violation (double booking)
        if (error.code === '23505') {
            throw new Error('Este horario ya está reservado. Por favor selecciona otro.');
        }
        throw new Error(error.message);
    }

    return { id: data.id };
}

export async function updateAppointmentStatus(
    id: string,
    status: 'Pendiente' | 'Confirmado' | 'Cancelado'
): Promise<{ id: string; status: string }> {
    const { error } = await supabase
        .from('appointments')
        .update({ estado: status })
        .eq('id', id);

    if (error) throw new Error(error.message);
    return { id, status };
}

export async function getAppointmentForCancellation(
    slug: string,
    token: string
): Promise<CancellationAppointment | null> {
    const { data, error } = await supabase
        .rpc('get_appointment_for_cancellation', {
            p_slug: slug,
            p_token: token,
        })
        .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return null;

    const row = data as any;

    return {
        ID: row.appointment_id,
        Slug: row.business_slug,
        NombreNegocio: row.business_name,
        Fecha: row.fecha,
        Hora: row.hora,
        Servicio: row.servicio || '',
        Estado: row.estado,
        CanCancel: row.can_cancel === true,
        Reason: row.reason || 'ok',
    };
}

export async function cancelAppointmentByToken(
    slug: string,
    token: string
): Promise<CancellationResult> {
    const { data, error } = await supabase
        .rpc('cancel_appointment_by_token', {
            p_slug: slug,
            p_token: token,
        })
        .single();

    if (error) throw new Error(error.message);

    const row = data as any;

    return {
        appointmentId: row.appointment_id || null,
        result: row.result,
    };
}

export async function deleteAppointment(id: string): Promise<{ success: boolean }> {
    const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id);

    if (error) throw new Error(error.message);
    return { success: true };
}

// ============================================
// SCHEDULE OPERATIONS
// ============================================
export async function getSchedule(slug: string): Promise<ScheduleConfig> {
    const businessId = await getBusinessId(slug);
    if (!businessId) return { duracionTurno: 60, frecuenciaTurnos: 30, horariosPorDia: {} };

    const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('business_id', businessId);

    if (error || !data || data.length === 0) {
        return { duracionTurno: 60, frecuenciaTurnos: 30, horariosPorDia: {} };
    }

    const schedule: ScheduleConfig = {
        duracionTurno: data[0].duracion_turno || 60,
        frecuenciaTurnos: data[0].frecuencia_turnos || 30,
        horariosPorDia: {},
    };

    data.forEach(row => {
        if (row.horarios && row.horarios.length > 0) {
            schedule.horariosPorDia[row.dia_semana] = row.horarios;
        }
    });

    logger.debug('[supabaseService] getSchedule:', {
        slug,
        days: Object.keys(schedule.horariosPorDia),
    });

    return schedule;
}

export async function saveSchedule(
    slug: string,
    config: ScheduleConfig
): Promise<{ success: boolean }> {
    const businessId = await getBusinessId(slug);
    if (!businessId) throw new Error('Negocio no encontrado');

    // Delete existing schedule
    await supabase
        .from('schedules')
        .delete()
        .eq('business_id', businessId);

    // Insert new rows
    const rows = Object.entries(config.horariosPorDia)
        .filter(([, slots]) => slots && slots.length > 0)
        .map(([day, slots]) => ({
            business_id: businessId,
            dia_semana: parseInt(day, 10),
            horarios: slots,
            duracion_turno: config.duracionTurno || 60,
            frecuencia_turnos: config.frecuenciaTurnos || 30,
        }));

    const rowsToInsert = rows.length > 0
        ? rows
        : [{
            business_id: businessId,
            dia_semana: 0,
            horarios: [],
            duracion_turno: config.duracionTurno || 60,
            frecuencia_turnos: config.frecuenciaTurnos || 30,
        }];

    const { error } = await supabase.from('schedules').insert(rowsToInsert);
    if (error) throw new Error(error.message);

    return { success: true };
}

export async function getAvailableSlots(
    slug: string,
    date: string
): Promise<string[]> {
    const businessId = await getBusinessId(slug);
    if (!businessId) return [];

    // Get day of week
    const [year, month, day] = date.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    const dayOfWeek = dateObj.getDay();

    // Get schedule for this day
    const { data: scheduleData } = await supabase
        .from('schedules')
        .select('horarios')
        .eq('business_id', businessId)
        .eq('dia_semana', dayOfWeek)
        .single();

    if (!scheduleData || !scheduleData.horarios) return [];
    const daySlots: string[] = scheduleData.horarios;

    // Check if date is blocked
    const { data: blockedData } = await supabase
        .from('blocked_dates')
        .select('id')
        .eq('business_id', businessId)
        .eq('fecha', date)
        .limit(1);

    if (blockedData && blockedData.length > 0) return [];

    // Get booked slots through a privacy-preserving RPC.
    const { data: busySlots, error: busySlotsError } = await supabase.rpc('get_busy_slots', {
        p_business_id: businessId,
        p_date: date,
    });

    if (busySlotsError) throw new Error(busySlotsError.message);

    return daySlots.filter(slot => !(busySlots || []).includes(slot));
}

export async function getBlockedDates(slug: string): Promise<BlockedDate[]> {
    const businessId = await getBusinessId(slug);
    if (!businessId) return [];

    const { data, error } = await supabase
        .from('blocked_dates')
        .select('*')
        .eq('business_id', businessId);

    if (error || !data) return [];

    return data.map(row => ({
        Fecha: row.fecha,
        Motivo: row.motivo || '',
    }));
}

export async function saveBlockedDates(
    slug: string,
    fechas: BlockedDate[]
): Promise<{ success: boolean }> {
    const businessId = await getBusinessId(slug);
    if (!businessId) throw new Error('Negocio no encontrado');

    // Delete existing
    await supabase
        .from('blocked_dates')
        .delete()
        .eq('business_id', businessId);

    // Insert new
    if (fechas.length > 0) {
        const rows = fechas.map(f => ({
            business_id: businessId,
            fecha: f.Fecha,
            motivo: f.Motivo || '',
        }));
        const { error } = await supabase.from('blocked_dates').insert(rows);
        if (error) throw new Error(error.message);
    }

    return { success: true };
}

// ============================================
// SERVICE OPERATIONS
// ============================================
export async function getServices(slug: string): Promise<ServicesData> {
    const businessId = await getBusinessId(slug);
    if (!businessId) return { categoriaId: null, services: [] };

    const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('business_id', businessId)
        .order('orden', { ascending: true });

    if (error || !data) return { categoriaId: null, services: [] };

    return {
        categoriaId: data.length > 0 ? (data[0].categoria_id || null) : null,
        services: data.map(row => ({
            id: row.id,
            nombre: row.nombre,
            duracion: row.duracion || 60,
            precio: row.precio || 0,
            sena: row.sena || 0,
            activo: row.activo !== false,
            orden: row.orden || 0,
        })),
    };
}

export async function saveServices(
    slug: string,
    services: ServicesData['services'],
    categoriaId: string | null
): Promise<{ success: boolean }> {
    const businessId = await getBusinessId(slug);
    if (!businessId) throw new Error('Negocio no encontrado');

    // Delete existing services
    await supabase
        .from('services')
        .delete()
        .eq('business_id', businessId);

    // Insert new services
    if (services.length > 0) {
        const rows = services.map(s => ({
            business_id: businessId,
            nombre: s.nombre,
            duracion: s.duracion || 60,
            precio: s.precio || 0,
            sena: s.sena || 0,
            activo: s.activo !== false,
            orden: s.orden || 0,
            categoria_id: categoriaId || '',
        }));
        const { error } = await supabase.from('services').insert(rows);
        if (error) throw new Error(error.message);
    }

    return { success: true };
}

// ============================================
// AUTHENTICATION OPERATIONS
// ============================================
export async function registerUser(
    email: string,
    _passwordHash: string,  // Ignored — Supabase Auth handles hashing
    slug: string,
    businessName?: string,
    rawPassword?: string
): Promise<AuthResult> {
    // Use raw password for Supabase Auth (the hash is ignored)
    const password = rawPassword || _passwordHash;

    // Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { slug, business_name: businessName || slug },
        },
    });

    if (authError) {
        if (authError.message.includes('already registered')) {
            throw new Error('Email ya registrado');
        }
        throw new Error(authError.message);
    }

    if (!authData.user) throw new Error('Error al crear usuario');

    // Create business profile with 7-day trial (explicit milliseconds calculation)
    const trial_ends_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { error: bizError } = await supabase
        .from('businesses')
        .insert({
            user_id: authData.user.id,
            slug,
            nombre_negocio: businessName || slug,
            email,
            valor_sena: 2000,
            notificaciones_email: true,
            recordatorios_activos: true,
            fecha_vencimiento: trial_ends_at.split('T')[0],
            is_premium: false,
            subscription_status: 'trial',
            trial_ends_at
        });

    if (bizError) {
        if (bizError.code === '23505') {
            throw new Error('Este identificador ya está en uso. Por favor elige otro.');
        }
        throw new Error(bizError.message);
    }

    return {
        user: {
            email,
            slug,
            subscription_status: 'trial',
            trial_ends_at,
            createdAt: new Date().toISOString()
        },
        token: authData.session?.access_token || '',
    };
}

export async function loginUser(
    email: string,
    _passwordHash: string,  // Ignored in Supabase mode
    rawPassword?: string
): Promise<AuthResult> {
    const password = rawPassword || _passwordHash;

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        throw new Error('Credenciales inválidas');
    }

    // Get the user's business slug and status
    const { data: bizData } = await supabase
        .from('businesses')
        .select('slug, subscription_status, trial_ends_at')
        .eq('user_id', data.user.id)
        .single();

    return {
        user: {
            email: data.user.email || email,
            slug: bizData?.slug || '',
            subscription_status: bizData?.subscription_status || 'free',
            trial_ends_at: bizData?.trial_ends_at,
            createdAt: data.user.created_at,
        },
        token: data.session.access_token,
    };
}

// ============================================
// STORAGE OPERATIONS
// ============================================

/**
 * Converts a data URI produced by resizeImage() to a Blob, uploads it to
 * the `images` bucket, and returns the public URL.
 *
 * Path structure: `${slug}/${folder}/${Date.now()}.jpg`
 * Folders: 'photo' | 'cover' | 'gallery'
 */
export async function uploadBusinessImage(
    dataUri: string,
    folder: 'photo' | 'cover' | 'gallery',
    slug: string
): Promise<string> {
    const [header, base64Data] = dataUri.split(',');
    const mimeType = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg';
    const ext = mimeType === 'image/png' ? 'png' : 'jpg';

    const byteChars = atob(base64Data);
    const byteArray = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) {
        byteArray[i] = byteChars.charCodeAt(i);
    }
    const blob = new Blob([byteArray], { type: mimeType });

    const path = `${slug}/${folder}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage
        .from('images')
        .upload(path, blob, { contentType: mimeType, upsert: true });

    if (error) throw new Error(error.message);

    const { data } = supabase.storage.from('images').getPublicUrl(path);
    return data.publicUrl;
}

/**
 * Updates the subscription status of a business.
 * Used for testing and payment integration (e.g. Mercado Pago webhooks).
 */
export async function updateSubscriptionStatus(
    slug: string,
    status: 'trial' | 'active' | 'expired',
    isPremium: boolean,
    trialEndsAt?: string
): Promise<void> {
    const updateData: any = {
        subscription_status: status,
        is_premium: isPremium
    };

    if (trialEndsAt) {
        updateData.trial_ends_at = trialEndsAt;
        updateData.fecha_vencimiento = trialEndsAt.split('T')[0];
    }

    const { error } = await supabase
        .from('businesses')
        .update(updateData)
        .eq('slug', slug);

    if (error) throw new Error(error.message);
    logger.info(`Subscription updated for ${slug}: ${status} (Premium: ${isPremium})`);
}

// ============================================
// EXPORT — same interface as sheetsService
// ============================================
export const sheetsService = {
    // Profile
    getProfile,
    saveProfile,

    // Storage
    uploadBusinessImage,

    // Appointments
    getAppointments,
    getAppointmentById,
    createAppointment,
    updateAppointmentStatus,
    getAppointmentForCancellation,
    cancelAppointmentByToken,
    deleteAppointment,

    // Schedule
    getAvailableSlots,
    getSchedule,
    saveSchedule,
    getBlockedDates,
    saveBlockedDates,

    // Services
    getServices,
    saveServices,

    // Auth
    registerUser,
    loginUser,
    updateSubscriptionStatus,
};

export default sheetsService;
