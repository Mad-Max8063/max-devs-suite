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

// ——————— Cards ———————

export async function createCard(data) {
    const db = getClient();
    const cardId = generateId(8);
    const editToken = generateId(12);

    const { data: card, error } = await db
        .from('cards')
        .insert({
            id: cardId,
            edit_token: editToken,
            name: data.name,
            profession: data.profession,
            description: data.description || '',
            phone: data.phone,
            email: data.email || '',
            location: data.location || '',
            photo_url: data.photo_url || '',
            cover_url: data.cover_url || '',
            instagram: data.instagram || '',
            linkedin: data.linkedin || '',
            website: data.website || '',
            booking_url: data.booking_url || '',
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating card:', error);
        throw error;
    }
    return card;
}

export async function updateCard(cardId, updates) {
    const db = getClient();
    const { data: card, error } = await db
        .from('cards')
        .update(updates)
        .eq('id', cardId)
        .select()
        .single();

    if (error) {
        console.error('Error updating card:', error);
        throw error;
    }
    return card;
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
            photo: 'assets/suito-logo.png',
            coverPhoto: 'assets/demo-cover.png',
            primary_color: '#8B5CF6',
            instagram: 'suito.pro',
            website: 'https://suito.pro',
            bookingUrl: 'https://turnos.suito.pro/#/demo/booking',
            isPremium: true,
            _id: 'suito',
            gallery: []
        };
    }

    const db = getClient();
    const { data: business, error } = await db
        .from('businesses')
        .select('*')
        .eq('slug', slug)
        .single();

    if (error) {
        console.error('Error fetching Suito profile:', error);
        return null;
    }

    const isPremium = business.is_premium || false;
    const activeModules = business.active_modules || ['appointments', 'card'];
    const hasAppointments = activeModules.includes('appointments');

    // Gallery format logic
    let gallery = [];
    if (Array.isArray(business.gallery_images)) {
        gallery = business.gallery_images.map(g => ({
            src: g.image_url,
            caption: g.caption || ''
        }));
    }

    // Map DB entity 'business' to 'card' legacy format for the UI
    const card = {
        name: business.nombre_negocio,
        profession: business.profession || 'Profesional',
        description: business.description || '',
        phone: business.telefono || '',
        email: business.email || '',
        location: business.location || '',
        photo: business.foto_url || 'assets/default-avatar.svg',
        coverPhoto: business.cover_url || '',
        primary_color: business.color_primario || '',
        instagram: business.instagram || '',
        facebook: business.facebook || '',
        website: business.website || '',
        bookingUrl: hasAppointments ? `https://turnos.suito.pro/#/${business.slug}/booking` : '',
        isPremium: isPremium,
        _id: business.slug, // Usamos el slug como ID para el editor
        edit_token: business.edit_token || '', // Necesario para el router
        gallery: gallery
    };

    return card;
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
