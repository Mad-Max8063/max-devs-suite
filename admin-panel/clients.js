// ============================================
// clients.js — Client Management (Supabase)
// ============================================
// Migration: localStorage -> Supabase table `admin_clients`
// Enforces security via Row Level Security (RLS).

import { CONFIG } from './config.js';

const STORAGE_KEY = 'suito_clients';
let supabase;

function getClient() {
    if (!supabase) {
        supabase = window.supabase.createClient(CONFIG.supabase.url, CONFIG.supabase.anonKey);
    }
    return supabase;
}

async function getUserId() {
    const sb = getClient();
    const { data: { session } } = await sb.auth.getSession();
    return session ? session.user.id : null;
}

/**
 * Migrates local data to Supabase if exists and user is logged in.
 * Internal function, called on initial load.
 */
async function performMigration() {
    const localData = localStorage.getItem(STORAGE_KEY);
    if (!localData) return;

    try {
        const clients = JSON.parse(localData);
        if (!Array.isArray(clients) || clients.length === 0) {
            localStorage.removeItem(STORAGE_KEY);
            return;
        }

        const userId = await getUserId();
        if (!userId) return; // Need to be logged in to migrate

        console.log(`Migrating ${clients.length} clients to Supabase...`);

        const sb = getClient();
        const clientsToUpload = clients.map(c => ({
            user_id: userId,
            name: c.name,
            business: c.business || '',
            whatsapp: c.whatsapp || '',
            email: c.email || '',
            slug: c.slug || '',
            plan: c.plan || 'tarjeta',
            status: c.status || 'active',
            is_premium: c.is_premium || false,
            card_id: c.card_id || '',
            notes: c.notes || '',
            free_until: c.free_until || null,
            paid_until: c.paid_until || null
        }));

        const { error } = await sb.from('admin_clients').insert(clientsToUpload);

        if (!error) {
            console.log('Migration successful!');
            localStorage.removeItem(STORAGE_KEY);
        } else {
            console.error('Migration error:', error);
        }
    } catch (e) {
        console.error('Error parsing local clients for migration:', e);
    }
}

// Perform migration check on load
// (Wrapped in a self-invoking async function or called explicitly)
window.addEventListener('load', () => {
    setTimeout(performMigration, 1000); // Wait for auth to settle
});

export async function getClients() {
    const userId = await getUserId();
    if (!userId) return [];

    const sb = getClient();
    const { data, error } = await sb
        .from('admin_clients')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching clients:', error);
        return [];
    }
    return data;
}

export async function addClient(clientData) {
    const userId = await getUserId();
    if (!userId) throw new Error('User not authenticated');

    const sb = getClient();
    const { data, error } = await sb
        .from('admin_clients')
        .insert({
            user_id: userId,
            ...clientData
        })
        .select()
        .single();

    if (error) {
        console.error('Error adding client:', error);
        throw error;
    }
    return data;
}

export async function updateClient(id, updates) {
    const userId = await getUserId();
    if (!userId) throw new Error('User not authenticated');

    const sb = getClient();
    const { data, error } = await sb
        .from('admin_clients')
        .update(updates)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

    if (error) {
        console.error('Error updating client:', error);
        throw error;
    }
    return data;
}

export async function deleteClient(id) {
    const userId = await getUserId();
    if (!userId) throw new Error('User not authenticated');

    const sb = getClient();
    const { error } = await sb
        .from('admin_clients')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

    if (error) {
        console.error('Error deleting client:', error);
        throw error;
    }
    return true;
}

export async function getClientStats() {
    const clients = await getClients();
    return {
        total: clients.length,
        active: clients.filter(c => c.status === 'active').length,
        tarjeta: clients.filter(c => c.plan === 'tarjeta').length,
        turnos: clients.filter(c => c.plan === 'turnos').length,
        combo: clients.filter(c => c.plan === 'combo').length,
    };
}
