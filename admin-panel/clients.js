// ============================================
// clients.js — Client Management (localStorage)
// ============================================
// Uses localStorage for immediate functionality.
// Ready to migrate to Supabase table `admin_clients` when created.

const STORAGE_KEY = 'suito_clients';

// Auto-migrate from old key if exists
if (!localStorage.getItem('suito_clients') && localStorage.getItem('maxdevs_clients')) {
    localStorage.setItem('suito_clients', localStorage.getItem('maxdevs_clients'));
    localStorage.removeItem('maxdevs_clients');
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

export function getClients() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

function saveClients(clients) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
}

export function addClient(clientData) {
    const clients = getClients();
    const newClient = {
        id: generateId(),
        name: clientData.name,
        business: clientData.business || '',
        whatsapp: clientData.whatsapp || '',
        email: clientData.email || '',
        plan: clientData.plan || 'tarjeta', // tarjeta | turnos | combo
        status: 'active',
        slug: clientData.slug || clientData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        isPremium: clientData.isPremium || false,
        cardId: clientData.cardId || null,
        notes: clientData.notes || '',
        createdAt: new Date().toISOString(),
        paidUntil: null,
        freeUntil: clientData.freeUntil || null,
    };
    clients.unshift(newClient);
    saveClients(clients);
    return newClient;
}

export function updateClient(id, updates) {
    const clients = getClients();
    const index = clients.findIndex(c => c.id === id);
    if (index === -1) return null;
    clients[index] = { ...clients[index], ...updates };
    saveClients(clients);
    return clients[index];
}

export function deleteClient(id) {
    const clients = getClients();
    const filtered = clients.filter(c => c.id !== id);
    saveClients(filtered);
}

export function getClientStats() {
    const clients = getClients();
    const active = clients.filter(c => c.status === 'active');
    return {
        total: clients.length,
        active: active.length,
        tarjeta: active.filter(c => c.plan === 'tarjeta').length,
        turnos: active.filter(c => c.plan === 'turnos').length,
        combo: active.filter(c => c.plan === 'combo').length,
    };
}
