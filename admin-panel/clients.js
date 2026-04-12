// ============================================
// clients.js — Client Management (Supabase)
// ============================================
// Persistence layer for the admin_clients table.
// All Supabase calls are async with try/catch error propagation.

import { supabase } from './supabaseClient.js';

const STORAGE_KEY = 'suito_clients';

// ——— Auth helper ———
async function getUserId() {
    const { data: { session } } = await supabase.auth.getSession();
    return session ? session.user.id : null;
}

// ——— Migration: localStorage → Supabase ———
// Guard prevents duplicate runs within the same page session.
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
        // Not authenticated yet; migration will retry on next load after login.
        migrationDone = false;
        return;
    }

    console.log(`[Migration] Migrating ${clients.length} client(s) to Supabase...`);

    const clientsToUpload = clients.map(c => ({
        user_id:        userId,
        name:           c.name           || '',
        business:       c.business       || '',
        whatsapp:       c.whatsapp       || '',
        email:          c.email          || '',
        slug:           c.slug           || '',
        plan:           c.plan           || 'tarjeta',
        status:         c.status         || 'active',
        is_premium:     c.is_premium     || false,
        card_id:        c.card_id        || '',
        notes:          c.notes          || '',
        transfer_email: c.transfer_email || null,   // field previously missing from mapper
        free_until:     c.free_until     || null,
        paid_until:     c.paid_until     || null,
    }));

    const { error } = await supabase.from('admin_clients').insert(clientsToUpload);

    if (!error) {
        console.log('[Migration] Success — purging localStorage.');
        localStorage.removeItem(STORAGE_KEY);
    } else {
        // Preserve localStorage on failure so no data is lost.
        console.error('[Migration] Insert failed (localStorage preserved):', error);
        migrationDone = false;  // Allow retry on next session
    }
}

// Trigger migration after auth has had time to settle.
window.addEventListener('load', () => setTimeout(performMigration, 1200));

// ——— DAO ———
export async function getClients() {
    try {
        const { data, error } = await supabase
            .from('admin_clients')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data ?? [];
    } catch (err) {
        console.error('[clients] getClients error:', err);
        return [];
    }
}

export async function addClient(clientData) {
    const userId = await getUserId();
    if (!userId) throw new Error('Usuario no autenticado');

    const { data, error } = await supabase
        .from('admin_clients')
        .insert({ user_id: userId, ...clientData })
        .select()
        .single();

    if (error) {
        console.error('[clients] addClient error:', error);
        throw error;
    }
    return data;
}

export async function updateClient(id, updates) {
    const { data, error } = await supabase
        .from('admin_clients')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('[clients] updateClient error:', error);
        throw error;
    }
    return data;
}

export async function deleteClient(id) {
    const { error } = await supabase
        .from('admin_clients')
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
