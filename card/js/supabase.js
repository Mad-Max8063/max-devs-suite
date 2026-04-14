console.log("cachebust-20260412");
// ============================================
// supabase.js — Supabase client & API functions
// ============================================

import { supabase } from '@shared/supabase.js';

// Compatibilidad: getClient() retorna el cliente compartido
function getClient() {
    return supabase;
}

// ——————— ID Generation ———————

function generateId(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
        id += chars[array[i] % chars.length];
    }
    return id;
}

// ——————— Cards (Unified as Businesses) ———————

export async function createCard(data) {
    const db = getClient();
    const slug = data.slug || generateId(6).toLowerCase();
    const editToken = generateId(12);

    const { data: business, error } = await db
        .from('businesses')
        .insert({
            nombre_negocio: data.name,
            profession: data.profession || 'Profesional',
            description: data.description || '',
            telefono: data.phone,
            email: data.email || '',
            location: data.location || '',
            foto_url: data.photo_url || '',
            cover_url: data.cover_url || '',
            instagram: data.instagram || '',
            linkedin: data.linkedin || '',
            website: data.website || '',
            booking_url: data.booking_url || '',
            slug: slug,
            edit_token: editToken,
            plan: 'tarjeta',
            status: 'active',
            active_modules: ['card']
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating business/card:', error);
        throw error;
    }
    return business;
}

export async function updateCard(businessId, updates) {
    const db = getClient();
    
    // Map internal fields to DB fields if needed
    const dbUpdates = { ...updates };
    if (updates.name) dbUpdates.nombre_negocio = updates.name;
    if (updates.phone) dbUpdates.telefono = updates.phone;
    if (updates.photo_url) dbUpdates.foto_url = updates.photo_url;

    const { data: business, error } = await db
        .from('businesses')
        .update(dbUpdates)
        .eq('id', businessId)
        .select()
        .single();

    if (error) {
        console.error('Error updating business:', error);
        throw error;
    }
    return business;
}

export async function getCard(slug) {
    // 🛡️ Fallback Hardcoded para la Agencia (Suito)
    if (slug === 'suito' || slug === 'agency') {
        return {
            name: 'Suito',
            profession: 'Plataforma de Soluciones Digitales',
            description: 'Expertos en crear soluciones digitales de alto impacto. Desarrollamos tu ecosistema de ventas con Suito.',
            phone: '5491162621406',
            email: 'hola@suito.pro',
            location: 'Buenos Aires, Argentina',
            photo: '/card/assets/suito-logo.png',
            coverPhoto: '/card/assets/cover.png',
            primary_color: '#8B5CF6',
            instagram: 'suito.pro',
            website: 'https://suito.pro',
            bookingUrl: 'https://turnos.suito.pro/#/demo/booking',
            isPremium: true,
            id: 'suito',
            gallery: []
        };
    }

    const db = getClient();
    
    // Si parece un UUID, permitimos buscar por ID, si no, solo por slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
    
    let query = db
        .from('businesses')
        .select('*');

    if (isUUID) {
        query = query.or(`id.eq.${slug},slug.eq.${slug}`);
    } else {
        query = query.eq('slug', slug);
    }

    const { data: business, error } = await query.maybeSingle();

    if (error) {
        console.error('[Supabase] Error detallado:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
        });
        throw error;
    }

    if (business) {
        console.log('[Supabase] Business data columns:', Object.keys(business));
    }

    const isPremium = business.is_premium || false;
    const activeModules = business.active_modules || ['card'];
    const hasAppointments = activeModules.includes('appointments');

    // Gallery format logic (from joined table)
    let gallery = [];
    if (Array.isArray(business.gallery_images)) {
        gallery = business.gallery_images
            .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
            .map(g => ({
                id: g.id,
                src: g.image_url,
                caption: g.caption || ''
            }));
    }

    // Map DB entity 'business' to 'card' display format
    const cardData = {
        id: business.id,
        _id: business.id, // Legacy compatibility
        name: business.nombre_negocio,
        profession: business.profession || 'Profesional',
        description: business.description || '',
        phone: business.telefono || '',
        email: business.email || '',
        location: business.location || '',
        photo: business.foto_url || '/card/assets/suito-logo.png',
        coverPhoto: business.cover_url || '',
        primary_color: business.color_primario || '#8B5CF6',
        instagram: business.instagram || '',
        facebook: business.facebook || '',
        linkedin: business.linkedin || '',
        website: business.website || '',
        bookingUrl: hasAppointments ? `https://turnos.suito.pro/#/${business.slug}/booking` : (business.booking_url || ''),
        isPremium: isPremium,
        slug: business.slug,
        edit_token: business.edit_token || '',
        gallery: gallery
    };

    return cardData;
}

// ——————— Image Upload ———————

export async function uploadImage(file, cardId, folder = 'photos') {
    const db = getClient();
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `${cardId}/${folder}/${Date.now()}.${ext}`;

    const { data, error } = await db.storage
        .from('images')
        .upload(fileName, file, {
            contentType: file.type,
            upsert: false,
        });

    if (error) {
        console.error('Error uploading image:', error);
        throw error;
    }

    const { data: urlData } = db.storage
        .from('images')
        .getPublicUrl(fileName);

    return urlData.publicUrl;
}

// Upload a data URI (base64) as a file
export async function uploadDataUri(dataUri, cardId, folder = 'photos') {
    const response = await fetch(dataUri);
    const blob = await response.blob();
    const ext = blob.type.split('/')[1] || 'jpg';
    const file = new File([blob], `${Date.now()}.${ext}`, { type: blob.type });
    return uploadImage(file, cardId, folder);
}

// ——————— Gallery ———————

export async function addGalleryImage(cardId, imageUrl, caption, sortOrder = 0) {
    const db = getClient();
    const { data, error } = await db
        .from('gallery_images')
        .insert({
            card_id: cardId,
            image_url: imageUrl,
            caption: caption || '',
            sort_order: sortOrder,
        })
        .select()
        .single();

    if (error) {
        console.error('Error adding gallery image:', error);
        throw error;
    }
    return data;
}

export async function deleteGalleryImage(imageId) {
    const db = getClient();
    const { error } = await db
        .from('gallery_images')
        .delete()
        .eq('id', imageId);

    if (error) {
        console.error('Error deleting gallery image:', error);
        throw error;
    }
}

export async function getGalleryImages(cardId) {
    const db = getClient();
    const { data, error } = await db
        .from('gallery_images')
        .select('*')
        .eq('card_id', cardId)
        .order('sort_order');

    if (error) {
        console.error('Error fetching gallery:', error);
        return [];
    }
    return data || [];
}

export function getSupabaseClient() {
    return getClient();
}

export async function updateGalleryCaption(imageId, caption) {
    const db = getClient();
    const { error } = await db
        .from('gallery_images')
        .update({ caption: caption })
        .eq('id', imageId);

    if (error) {
        console.error('Error updating caption:', error);
        throw error;
    }
}
