// ============================================
// clients.js — Client Management (Supabase)
// ============================================
// Backed by the 'businesses' table (unified source of truth).
// Bidirectional translation layer maps admin form fields ↔ businesses columns.

import { supabase } from '@shared/supabase.js';

const STORAGE_KEY = 'suito_clients';

// ——— Auth helper ———
async function getUserId() {
    const { data: { session } } = await supabase.auth.getSession();
    return session ? session.user.id : null;
}

// ——— Image Processing & Upload ———

/**
 * Resizes and compresses an image using Canvas
 * @param {File} file 
 * @param {Object} options { maxWidth, maxHeight, quality }
 * @returns {Promise<Blob>}
 */
async function processImage(file, { maxWidth = 1200, maxHeight = 1200, quality = 0.8 } = {}) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Calculate dimensions
                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    resolve(blob);
                }, 'image/jpeg', quality);
            };
            img.onerror = reject;
        };
        reader.onerror = reject;
    });
}

/**
 * Uploads a file to Supabase Storage
 */
async function uploadToSupabase(blob, fileName, bucket = 'images') {
    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, blob, {
            contentType: 'image/jpeg',
            upsert: true
        });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

    return publicUrl;
}

/**
 * Initializes the image upload buttons in the modal
 */
export function initImageUploads(showToast) {
    const fileProfile = document.getElementById('file-profile');
    const fileCover = document.getElementById('file-cover');
    const inputProfile = document.getElementById('clientFotoUrl');
    const inputCover = document.getElementById('clientCoverUrl');

    const handleUpload = async (file, type, event) => {
        if (!file) return;
        
        const originalBtn = event.target.closest('.form-group').querySelector('button');
        const originalIcon = originalBtn.innerHTML;
        
        try {
            originalBtn.disabled = true;
            originalBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            
            // 1. Process (Resize/Compress)
            const options = type === 'profile' 
                ? { maxWidth: 400, maxHeight: 400, quality: 0.8 }
                : { maxWidth: 1200, maxHeight: 800, quality: 0.7 };
            
            showToast(`Procesando imagen de ${type}...`, 'info');
            const processedBlob = await processImage(file, options);
            
            // 2. Upload
            const timestamp = Date.now();
            const clientId = document.getElementById('clientId')?.value || document.getElementById('clientSlug')?.value || 'tmp';
            const fileName = `admin/uploads/${clientId}/${type}_${timestamp}.jpg`;
            
            showToast(`Subiendo a la nube...`, 'info');
            const publicUrl = await uploadToSupabase(processedBlob, fileName);
            
            // 3. Update Input
            if (type === 'profile') inputProfile.value = publicUrl;
            else inputCover.value = publicUrl;
            
            showToast('¡Imagen cargada y optimizada!', 'success');
        } catch (error) {
            console.error('Upload error:', error);
            showToast('Error al subir la imagen: ' + error.message, 'error');
        } finally {
            originalBtn.disabled = false;
            originalBtn.innerHTML = originalIcon;
        }
    };

    fileProfile?.addEventListener('change', (e) => handleUpload(e.target.files[0], 'profile', e));
    fileCover?.addEventListener('change', (e) => handleUpload(e.target.files[0], 'cover', e));
}

// ——— businesses row → admin client object ———
function businessToClient(b) {
    return {
        id:             b.id,
        name:           b.contact_name || b.nombre_negocio || '',
        business:       b.nombre_negocio || '',
        whatsapp:       b.telefono || '',
        email:          b.email || '',
        slug:           b.slug || '',
        plan:           b.plan || 'tarjeta',
        status:         b.status || 'active',
        is_premium:     b.is_premium || false,
        force_watermark:b.force_watermark || false,
        card_id:        b.slug || '',
        notes:          b.notes || '',
        transfer_email: b.transfer_email || null,
        free_until:     b.free_until || null,
        paid_until:     b.paid_until || null,
        profession:     b.profession || '',
        foto_url:       b.foto_url || '',
        cover_url:      b.cover_url || '',
        edit_token:     b.edit_token || null,
        created_at:     b.created_at,
        // --- New Monetization Fields ---
        subscription_status: b.subscription_status || 'basic',
        trial_ends_at:       b.trial_ends_at || null,
        locked_price:        b.locked_price || null,
        price_lock_ends_at:  b.price_lock_ends_at || null,
    };
}

// ——— admin client form → businesses columns ———
// Accepts a superset: basic admin fields + optional business-specific fields.
function clientToBusiness(clientData, userId = null, { partial = false } = {}) {
    const row = {
        contact_name:   clientData.name?.trim()            || null,
        nombre_negocio: clientData.business?.trim()        || clientData.name?.trim() || '',
        telefono:       clientData.whatsapp?.trim()        || '',
        email:          clientData.email?.trim()           || '',
        slug:           clientData.slug?.trim()            || '',
        plan:           clientData.plan                    || 'tarjeta',
        status:         clientData.status                  || 'active',
        is_premium:     clientData.is_premium              || false,
        force_watermark:clientData.force_watermark         || false,
        notes:          clientData.notes?.trim()           || null,
        transfer_email: clientData.transfer_email?.trim()  || null,
        free_until:     clientData.free_until              || null,
        paid_until:     clientData.paid_until              || null,
        profession:     clientData.profession?.trim()      || null,
        foto_url:       clientData.foto_url                || null,
        cover_url:      clientData.cover_url               || null,
        gallery_images: clientData.gallery_images          || [],
        // Map edit_token only if provided to avoid accidental rotation during partial updates
        edit_token:     clientData.edit_token,
        // --- New Monetization Fields ---
        subscription_status: clientData.subscription_status === undefined ? undefined : clientData.subscription_status,
        trial_ends_at:       clientData.trial_ends_at       === undefined ? undefined : clientData.trial_ends_at,
        locked_price:        clientData.locked_price        === undefined ? undefined : clientData.locked_price,
        price_lock_ends_at:  clientData.price_lock_ends_at  === undefined ? undefined : clientData.price_lock_ends_at
    };
    if (userId) row.user_id = userId;

    // Pass through optional business-specific fields if provided
    const extra = [
        'active_modules', 'profession', 'instagram', 'location',
        'valor_sena', 'fecha_vencimiento', 'notificaciones_email',
        'recordatorios_activos', 'foto_url', 'cover_url',
    ];
    extra.forEach(f => { if (clientData[f] !== undefined) row[f] = clientData[f]; });

    if (partial) {
        const has = (key) => Object.prototype.hasOwnProperty.call(clientData, key);
        const keep = {
            contact_name: has('name'),
            nombre_negocio: has('business') || has('name'),
            telefono: has('whatsapp'),
            email: has('email'),
            slug: has('slug'),
            plan: has('plan'),
            status: has('status'),
            is_premium: has('is_premium'),
            force_watermark: has('force_watermark'),
            notes: has('notes'),
            transfer_email: has('transfer_email'),
            free_until: has('free_until'),
            paid_until: has('paid_until'),
            profession: has('profession'),
            foto_url: has('foto_url'),
            cover_url: has('cover_url'),
            gallery_images: has('gallery_images'),
            edit_token: has('edit_token') && clientData.edit_token != null,
            subscription_status: has('subscription_status'),
            trial_ends_at: has('trial_ends_at'),
            locked_price: has('locked_price'),
            price_lock_ends_at: has('price_lock_ends_at'),
        };

        Object.keys(row).forEach((key) => {
            if (keep[key] === false) delete row[key];
        });
    }

    return row;
}

// ——— Migration: localStorage → Supabase (businesses) ———
let migrationDone = false;

async function performMigration() {
    if (migrationDone) return;
    migrationDone = true;

    const localData = localStorage.getItem(STORAGE_KEY);
    if (!localData) return;

    let clients;
    try {
        clients = JSON.parse(localData);
    } catch (e) {
        console.error('[Migration] Error parsing localStorage data:', e);
        return;
    }

    if (!Array.isArray(clients) || clients.length === 0) {
        localStorage.removeItem(STORAGE_KEY);
        return;
    }

    const userId = await getUserId();
    if (!userId) {
        migrationDone = false;
        return;
    }

    console.log(`[Migration] Migrating ${clients.length} client(s) to businesses...`);

    const rows = clients.map(c => {
        if (!c.edit_token) {
            c.edit_token = Array.from(crypto.getRandomValues(new Uint8Array(16)))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
        }
        return clientToBusiness(c, userId);
    });

    const { error } = await supabase.from('businesses').insert(rows);

    if (!error) {
        console.log('[Migration] Success — purging localStorage.');
        localStorage.removeItem(STORAGE_KEY);
    } else {
        console.error('[Migration] Insert failed (localStorage preserved):', error);
        migrationDone = false;
    }
}

window.addEventListener('load', () => setTimeout(performMigration, 1200));

// ——— DAO ———
export async function getClients() {
    try {
        const { data, error } = await supabase
            .from('businesses')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data ?? []).map(businessToClient);
    } catch (err) {
        console.error('[clients] getClients error:', err);
        return [];
    }
}

export async function addClient(clientData) {
    const userId = await getUserId();
    if (!userId) throw new Error('Usuario no autenticado');

    // Nuevos clientes tienen user_id = null — el cliente lo reclamará al registrarse
    // (turnos via claim_business RPC, tarjeta via edit_token en el panel)
    // Ensure edit_token exists for new clients
    if (!clientData.edit_token) {
        clientData.edit_token = Array.from(crypto.getRandomValues(new Uint8Array(16)))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }
    const row = clientToBusiness(clientData);

    const { data, error } = await supabase
        .from('businesses')
        .insert(row)
        .select()
        .single();

    if (error) {
        console.error('[clients] addClient error:', error);
        throw error;
    }
    return businessToClient(data);
}

export async function updateClient(id, updates) {
    const row = clientToBusiness(updates, null, { partial: true });
    
    // Remove nullish keys that shouldn't overwrite existing business data.
    // In particular, admin benefit buttons are partial updates and must not
    // accidentally blank customer profile fields.
    Object.keys(row).forEach(k => {
        if (row[k] === undefined) delete row[k];
        if (row[k] === null && updates[k] === undefined) delete row[k];
    });

    if (Object.keys(row).length === 0) {
        console.warn('[clients] updateClient called with no writable fields:', updates);
        return null;
    }

    console.log('[updateClient] Attempting update for ID:', id, 'with data:', row);

    const { error } = await supabase
        .from('businesses')
        .update(row)
        .eq('id', id);

    if (error) {
        console.error('[clients] updateClient error details:', error);
        throw error;
    }

    const { data, error: fetchError } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', id)
        .maybeSingle();

    if (fetchError) {
        console.warn('[clients] updateClient: update succeeded but refresh failed:', fetchError);
        return null;
    }

    return data ? businessToClient(data) : null;
}

export async function updateClientBenefits(id, updates) {
    const { error } = await supabase.rpc('admin_update_business_benefits', {
        p_business_id: id,
        p_is_premium: updates.is_premium ?? null,
        p_subscription_status: updates.subscription_status ?? null,
        p_trial_ends_at: updates.trial_ends_at ?? null,
        p_free_until: updates.free_until ?? null,
        p_clear_trial_ends_at: updates.clear_trial_ends_at === true,
        p_clear_free_until: updates.clear_free_until === true,
    });

    if (error) {
        console.error('[clients] updateClientBenefits error details:', error);
        throw error;
    }

    const { data, error: fetchError } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', id)
        .maybeSingle();

    if (fetchError) {
        console.warn('[clients] updateClientBenefits: update succeeded but refresh failed:', fetchError);
        return null;
    }

    return data ? businessToClient(data) : null;
}

export async function deleteClient(id) {
    const { error } = await supabase
        .from('businesses')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('[clients] deleteClient error:', error);
        throw error;
    }
    return true;
}

export async function getClientStats() {
    const clients = await getClients();
    return {
        total:   clients.length,
        active:  clients.filter(c => c.status === 'active').length,
        tarjeta: clients.filter(c => c.plan === 'tarjeta').length,
        turnos:  clients.filter(c => c.plan === 'turnos').length,
        combo:   clients.filter(c => c.plan === 'combo').length,
    };
}
