console.log("cachebust-v2029-FINAL");
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
            edit_token: null,
            isPremium: true,
            id: 'suito',
            gallery: []
        };
    }

    const db = getClient();
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
    
    // Fetch business profile (Purely from businesses table to avoid 400 errors)
    const { data: business, error: bizError } = await db
        .from('businesses')
        .select('*')
        .or(isUUID ? `id.eq.${slug},slug.eq.${slug}` : `slug.eq.${slug}`)
        .maybeSingle();

    if (bizError) {
        console.error('[Supabase] Error fetching business:', bizError);
        throw bizError;
    }

    if (!business) return null;

    console.log('[Supabase] Business found:', business.nombre_negocio);

    // Fetch gallery images in a separate call (Silent fail if table missing or relationship broken)
    let galleryItems = [];
    try {
        const { data: galleryData } = await db
            .from('gallery_images')
            .select('*')
            .eq('card_id', business.id)
            .order('sort_order', { ascending: true });
        
        galleryItems = galleryData || [];
    } catch (e) {
        console.warn('[Supabase] Could not fetch from gallery_images table, falling back to column.', e);
    }

    const isPremium = business.is_premium || false;
    const activeModules = business.active_modules || ['card'];
    const hasAppointments = activeModules.includes('appointments');

    // Gallery format logic (Unified: check both column and separate table results)
    let gallery = [];
    const sourceGallery = (galleryItems.length > 0) ? galleryItems : (business.gallery_images || []);
    
    if (Array.isArray(sourceGallery)) {
        gallery = sourceGallery.map(g => ({
            id: g.id || Math.random(),
            src: g.image_url || g.src || g,
            caption: g.caption || ''
        }));
    }

    // Map DB entity 'business' to 'card' display format (v2029-FIXED)
    const cardData = {
        id: business.id,
        _id: business.id, // Legacy compatibility
        name: business.nombre_negocio,
        profession: business.profession || 'Profesional',
        description: business.description || '',
        phone: business.telefono || '',
        email: business.email || '',
        location: business.location || '',
        // Mapeo blindado: buscamos en todas las variantes posibles
        photo: business.foto_url || business.photo_url || business.photo || '/card/assets/suito-logo.png',
        coverPhoto: business.cover_url || business.coverPhoto || '',
        primary_color: business.color_primario || '#8B5CF6',
        instagram: business.instagram || '',
        facebook: business.facebook || '',
        linkedin: business.linkedin || '',
        website: business.website || '',
        bookingUrl: hasAppointments 
            ? (business.booking_url || `https://turnos.suito.pro/#/${business.slug}/booking`) 
            : '',
        isPremium: isPremium,
        forceWatermark: business.force_watermark || false,
        activeModules: activeModules,
        slug: business.slug,
        edit_token: business.edit_token || '',
        gallery: gallery,
        // Campos de monetización y tiempo
        created_at: business.created_at,
        subscription_status: business.subscription_status || 'basic',
        plan_status: business.plan_status || business.subscription_status || 'basic',
        trial_ends_at: business.trial_ends_at || null,
        free_until: business.free_until || null,
        locked_price: business.locked_price || 0,
        price_lock_ends_at: business.price_lock_ends_at || null
    };

    return cardData;
}

// ——————— Image Compression ———————
async function compressImage(file, maxWidth = 1200, quality = 0.8) {
    if (!file.type.startsWith('image/')) return file;
    
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
                        type: 'image/webp',
                        lastModified: Date.now(),
                    });
                    resolve(compressedFile);
                }, 'image/webp', quality);
            };
            img.onerror = () => resolve(file);
        };
        reader.onerror = () => resolve(file);
    });
}

// ——————— Image Upload ———————

export async function uploadImage(file, cardId, folder = 'photos') {
    const db = getClient();
    const compressedFile = await compressImage(file);
    const ext = compressedFile.name.split('.').pop() || 'webp';
    const fileName = `${cardId}/${folder}/${Date.now()}.${ext}`;

    const { data, error } = await db.storage
        .from('images')
        .upload(fileName, compressedFile, {
            contentType: compressedFile.type,
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

// ——————— Token-authenticated operations (SECURITY DEFINER RPCs) ———————
// These bypass RLS by validating the edit_token server-side.

export async function addGalleryImageSecure(cardId, editToken, imageUrl, caption = '', sortOrder = 0) {
    const db = getClient();
    const { data, error } = await db.rpc('add_gallery_image_secure', {
        p_card_id: cardId,
        p_edit_token: editToken,
        p_image_url: imageUrl,
        p_caption: caption,
        p_sort_order: sortOrder,
    });
    if (error) { console.error('Error adding gallery image (secure):', error); throw error; }
    return typeof data === 'string' ? JSON.parse(data) : data;
}

export async function deleteGalleryImageSecure(imageId, cardId, editToken) {
    const db = getClient();
    const { error } = await db.rpc('delete_gallery_image_secure', {
        p_image_id: imageId,
        p_card_id: cardId,
        p_edit_token: editToken,
    });
    if (error) { console.error('Error deleting gallery image (secure):', error); throw error; }
}

export async function updateGalleryCaptionSecure(imageId, cardId, editToken, caption) {
    const db = getClient();
    const { error } = await db.rpc('update_gallery_caption_secure', {
        p_image_id: imageId,
        p_card_id: cardId,
        p_edit_token: editToken,
        p_caption: caption,
    });
    if (error) { console.error('Error updating caption (secure):', error); throw error; }
}

export async function updateBusinessProfileSecure(cardId, editToken, profileData) {
    const db = getClient();
    const { error } = await db.rpc('update_business_profile_secure', {
        p_card_id: cardId,
        p_edit_token: editToken,
        p_nombre_negocio: profileData.nombre_negocio ?? null,
        p_profession:     profileData.profession     ?? null,
        p_description:    profileData.description    ?? null,
        p_telefono:       profileData.telefono       ?? null,
        p_email:          profileData.email          ?? null,
        p_location:       profileData.location       ?? null,
        p_instagram:      profileData.instagram      ?? null,
        p_facebook:       profileData.facebook       ?? null,
        p_linkedin:       profileData.linkedin       ?? null,
        p_website:        profileData.website        ?? null,
        p_booking_url:    profileData.booking_url    ?? null,
    });
    if (error) { console.error('Error updating business profile (secure):', error); throw error; }
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

export async function updateActiveModulesSecure(cardId, editToken, activeModules) {
    const db = getClient();
    const { error } = await db.rpc('update_active_modules_secure', {
        p_card_id: cardId,
        p_edit_token: editToken,
        p_active_modules: activeModules,
    });
    if (error) {
        console.error('Error updating active modules (secure):', error);
        throw error;
    }
}
