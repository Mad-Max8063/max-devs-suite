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
        card_id:        b.slug || '',
        notes:          b.notes || '',
        transfer_email: b.transfer_email || null,
        free_until:     b.free_until || null,
        paid_until:     b.paid_until || null,
        created_at:     b.created_at,
    };
}

// ——— admin client form → businesses columns ———
// Accepts a superset: basic admin fields + optional business-specific fields.
function clientToBusiness(clientData, userId = null) {
    const row = {
        contact_name:   clientData.name            || null,
        nombre_negocio: clientData.business        || clientData.name || '',
        telefono:       clientData.whatsapp        || '',
        email:          clientData.email           || '',
        slug:           clientData.slug            || '',
        plan:           clientData.plan            || 'tarjeta',
        status:         clientData.status          || 'active',
        is_premium:     clientData.is_premium      || false,
        notes:          clientData.notes           || null,
        transfer_email: clientData.transfer_email  || null,
        free_until:     clientData.free_until      || null,
        paid_until:     clientData.paid_until      || null,
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

    const row = clientToBusiness(clientData, userId);

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

    const { data, error } = await supabase
        .from('businesses')
        .update(row)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('[clients] updateClient error:', error);
        throw error;
    }
    return businessToClient(data);
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
