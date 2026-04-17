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
            const fileName = `admin/uploads/${type}_${timestamp}.jpg`;
            
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
    };
}

// ——— admin client form → businesses columns ———
// Accepts a superset: basic admin fields + optional business-specific fields.
function clientToBusiness(clientData, userId = null) {
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
        // Ensure edit_token exists for new clients
        edit_token:     clientData.edit_token              || Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    };
    if (userId) row.user_id = userId;

    // Pass through optional business-specific fields if provided
    const extra = [
        'active_modules', 'profession', 'instagram', 'location',
        'valor_sena', 'fecha_vencimiento', 'notificaciones_email',
        'recordatorios_activos', 'foto_url', 'cover_url',
    ];
    extra.forEach(f => { if (clientData[f] !== undefined) row[f] = clientData[f]; });

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

    const rows = clients.map(c => clientToBusiness(c, userId));

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
    const row = clientToBusiness(updates);
    
    // Remove nullish keys that shouldn't overwrite existing business data
    Object.keys(row).forEach(k => {
        if (row[k] === null && updates[k] === undefined) delete row[k];
    });

    console.log('[updateClient] Attempting update for ID:', id, 'with data:', row);

    const { data, error } = await supabase
        .from('businesses')
        .update(row)
        .eq('id', id)
        .select(); // Removed .single() to avoid PGRST116 during debug

    if (error) {
        console.error('[clients] updateClient error details:', error);
        throw error;
    }

    if (!data || data.length === 0) {
        console.warn('[clients] updateClient: No rows were updated. Check RLS or ID.');
        return null;
    }

    return businessToClient(data[0]);
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
