// ============================================
// app.js — Max Devs Admin Dashboard
// ============================================
import { CONFIG } from './config.js';
import { getClients, addClient, updateClient, deleteClient, getClientStats } from './clients.js';

// ——— State ———
let currentSection = 'dashboard';
let currentFilter = 'all';
let editingClientId = null;

// ——— Init ———
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initModal();
    initFilters();
    initSearch();
    initMobile();
    renderDashboard();
});

// ——— Navigation ———
function initNavigation() {
    document.querySelectorAll('.nav-links li').forEach(li => {
        li.addEventListener('click', (e) => {
            e.preventDefault();
            const section = li.dataset.section;
            switchSection(section);
        });
    });

    // "View All" / "Editar" links
    document.querySelectorAll('[data-goto]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            switchSection(link.dataset.goto);
        });
    });
}

function switchSection(section) {
    currentSection = section;
    
    // Update nav
    document.querySelectorAll('.nav-links li').forEach(li => {
        li.classList.toggle('active', li.dataset.section === section);
    });

    // Show/hide sections
    document.querySelectorAll('.section-content').forEach(el => {
        el.style.display = 'none';
    });
    const target = document.getElementById(`section-${section}`);
    if (target) {
        target.style.display = 'block';
        target.style.animation = 'fadeSlideIn 0.4s ease';
    }

    // Close mobile sidebar
    document.getElementById('sidebar').classList.remove('open');

    // Re-render section
    if (section === 'dashboard') renderDashboard();
    if (section === 'clients') renderClients();
    if (section === 'pricing') renderPricing();
}

// ——— Dashboard ———
function renderDashboard() {
    renderStats();
    renderPricingQuick();
    renderRecentClients();
}

function renderStats() {
    const stats = getClientStats();
    const grid = document.getElementById('statsGrid');
    grid.innerHTML = `
        <div class="stat-card">
            <div class="stat-icon purple"><i class="fa-solid fa-users"></i></div>
            <div class="stat-details">
                <h3>Clientes Activos</h3>
                <h2>${stats.active}</h2>
                <p class="trend info">${stats.total} total registrados</p>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon blue"><i class="fa-solid fa-address-card"></i></div>
            <div class="stat-details">
                <h3>Tarjetas Virtuales</h3>
                <h2>${stats.tarjeta + stats.combo}</h2>
                <p class="trend info">${stats.tarjeta} solo + ${stats.combo} en combo</p>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon green"><i class="fa-solid fa-calendar-check"></i></div>
            <div class="stat-details">
                <h3>Gestores de Turno</h3>
                <h2>${stats.turnos + stats.combo}</h2>
                <p class="trend info">${stats.turnos} solo + ${stats.combo} en combo</p>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon gradient"><i class="fa-solid fa-layer-group"></i></div>
            <div class="stat-details">
                <h3>Combos Vendidos</h3>
                <h2>${stats.combo}</h2>
                <p class="trend info">${stats.active > 0 ? Math.round(stats.combo / stats.active * 100) : 0}% adopción combo</p>
            </div>
        </div>
    `;
}

function renderPricingQuick() {
    const p = CONFIG.pricing;
    document.getElementById('pricingQuickView').innerHTML = `
        <div class="price-item">
            <div class="price-info">
                <div class="price-icon blue-bg"><i class="fa-solid fa-address-card"></i></div>
                <div><h4>Tarjeta Virtual</h4><span>Mensual</span></div>
            </div>
            <div class="price-amount">$${p.tarjeta.monthly.toLocaleString('es-AR')}</div>
        </div>
        <div class="price-item">
            <div class="price-info">
                <div class="price-icon green-bg"><i class="fa-solid fa-calendar-check"></i></div>
                <div><h4>Gestor de Turnos</h4><span>Mensual</span></div>
            </div>
            <div class="price-amount">$${p.turnos.monthly.toLocaleString('es-AR')}</div>
        </div>
        <div class="price-item combo-highlight">
            <div class="price-info">
                <div class="price-icon gradient-bg"><i class="fa-solid fa-star"></i></div>
                <div>
                    <h4>Pack Emprendedor</h4>
                    <span class="discount-badge">Ahorro ~13%</span>
                </div>
            </div>
            <div class="price-amount">$${p.combo.monthly.toLocaleString('es-AR')}</div>
        </div>
    `;
}

function renderRecentClients() {
    const clients = getClients().slice(0, 5);
    const tbody = document.getElementById('recentClientsTable');
    const empty = document.getElementById('emptyDashboard');

    if (clients.length === 0) {
        tbody.innerHTML = '';
        empty.style.display = 'flex';
        return;
    }
    empty.style.display = 'none';

    tbody.innerHTML = clients.map(c => `
        <tr>
            <td>
                <div class="client-cell">
                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(c.business || c.name)}&background=${getPlanColor(c.plan)}&color=fff&size=32" alt="${c.name}">
                    <div>
                        <strong>${c.business || c.name}</strong>
                        <small style="display:block;color:var(--text-muted);font-size:12px">${c.name}</small>
                    </div>
                </div>
            </td>
            <td><span class="badge-service ${c.plan}">${getPlanLabel(c.plan)}</span></td>
            <td><span class="status ${c.status}">${c.status === 'active' ? 'Activo' : 'Inactivo'}</span></td>
            <td>
                <button class="action-btn" onclick="window._editClient('${c.id}')" title="Editar">
                    <i class="fa-solid fa-pen"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// ——— Clients Section ———
function renderClients() {
    let clients = getClients();
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();

    if (currentFilter !== 'all') {
        clients = clients.filter(c => c.plan === currentFilter);
    }
    if (searchTerm) {
        clients = clients.filter(c =>
            c.name.toLowerCase().includes(searchTerm) ||
            (c.business && c.business.toLowerCase().includes(searchTerm)) ||
            (c.email && c.email.toLowerCase().includes(searchTerm))
        );
    }

    const grid = document.getElementById('clientsGrid');
    const empty = document.getElementById('emptyClients');

    if (clients.length === 0) {
        grid.innerHTML = '';
        empty.style.display = 'flex';
        return;
    }
    empty.style.display = 'none';

    grid.innerHTML = clients.map(c => `
        <div class="client-card" data-plan="${c.plan}">
            <div class="client-card-header">
                <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(c.business || c.name)}&background=${getPlanColor(c.plan)}&color=fff&size=48" alt="${c.name}">
                <div>
                    <h4>${c.business || c.name}</h4>
                    <span class="badge-service ${c.plan}">${getPlanLabel(c.plan)}</span>
                </div>
                <span class="status ${c.status}">${c.status === 'active' ? 'Activo' : 'Inactivo'}</span>
            </div>
            <div class="client-card-body">
                <div class="client-detail"><i class="fa-solid fa-user"></i> ${c.name}</div>
                ${c.whatsapp ? `<div class="client-detail"><i class="fa-brands fa-whatsapp"></i> ${c.whatsapp}</div>` : ''}
                ${c.email ? `<div class="client-detail"><i class="fa-solid fa-envelope"></i> ${c.email}</div>` : ''}
                <div class="client-detail"><i class="fa-solid fa-link"></i> /${c.slug}</div>
                ${c.isPremium ? `<div class="client-detail" style="color:var(--accent-purple);font-weight:600;"><i class="fa-solid fa-star"></i> Nivel Premium</div>` : `<div class="client-detail text-muted"><i class="fa-regular fa-star"></i> Nivel Gratuito</div>`}
                ${c.notes ? `<div class="client-detail notes"><i class="fa-solid fa-sticky-note"></i> ${c.notes}</div>` : ''}
            </div>
            <div class="client-card-footer">
                ${c.plan !== 'turnos' ? `<a href="${CONFIG.products.tarjetaVirtual}/card/${c.cardId || c.slug}" target="_blank" class="action-link"><i class="fa-solid fa-address-card"></i> Tarjeta</a>` : ''}
                ${c.plan !== 'tarjeta' ? `<a href="${CONFIG.products.gestorTurnos}/#/${c.slug}" target="_blank" class="action-link"><i class="fa-solid fa-calendar"></i> Turnos</a>` : ''}
                ${c.whatsapp ? `<a href="https://wa.me/549${c.whatsapp}" target="_blank" class="action-link"><i class="fa-brands fa-whatsapp"></i> WhatsApp</a>` : ''}
                <button class="action-btn" onclick="window._editClient('${c.id}')" title="Editar"><i class="fa-solid fa-pen"></i></button>
                <button class="action-btn danger" onclick="window._deleteClient('${c.id}', '${(c.business || c.name).replace(/'/g, "\\'")}')" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

function initFilters() {
    document.querySelectorAll('.pill').forEach(pill => {
        pill.addEventListener('click', () => {
            document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            currentFilter = pill.dataset.filter;
            renderClients();
        });
    });
}

function initSearch() {
    document.getElementById('searchInput').addEventListener('input', () => {
        if (currentSection === 'clients') renderClients();
    });
}

// ——— Pricing Section ———
function renderPricing() {
    const p = CONFIG.pricing;
    document.getElementById('pricingCards').innerHTML = `
        <div class="pricing-card">
            <div class="pricing-card-icon blue-bg"><i class="fa-solid fa-address-card"></i></div>
            <h3>Tarjeta Virtual</h3>
            <div class="pricing-price">$${p.tarjeta.monthly.toLocaleString('es-AR')}<span>/mes</span></div>
            <div class="pricing-quarterly">Trimestral: $${p.tarjeta.quarterly.toLocaleString('es-AR')}</div>
            <ul class="pricing-features">
                <li><i class="fa-solid fa-check"></i> PWA instalable</li>
                <li><i class="fa-solid fa-check"></i> Compartir por WhatsApp</li>
                <li><i class="fa-solid fa-check"></i> Galería de imágenes</li>
                <li><i class="fa-solid fa-check"></i> Exportar contacto vCard</li>
                <li><i class="fa-solid fa-check"></i> Open Graph optimizado</li>
                <li><i class="fa-solid fa-check"></i> Editable en tiempo real</li>
            </ul>
        </div>
        <div class="pricing-card">
            <div class="pricing-card-icon green-bg"><i class="fa-solid fa-calendar-check"></i></div>
            <h3>Gestor de Turnos</h3>
            <div class="pricing-price">$${p.turnos.monthly.toLocaleString('es-AR')}<span>/mes</span></div>
            <div class="pricing-quarterly">Trimestral: $${p.turnos.quarterly.toLocaleString('es-AR')}</div>
            <ul class="pricing-features">
                <li><i class="fa-solid fa-check"></i> Agenda inteligente</li>
                <li><i class="fa-solid fa-check"></i> Reserva online 24/7</li>
                <li><i class="fa-solid fa-check"></i> Integración MercadoPago</li>
                <li><i class="fa-solid fa-check"></i> Confirmación por WhatsApp</li>
                <li><i class="fa-solid fa-check"></i> Multi-tenant (slug único)</li>
                <li><i class="fa-solid fa-check"></i> Bloqueo de horarios</li>
            </ul>
        </div>
        <div class="pricing-card featured">
            <div class="pricing-badge">MÁS POPULAR</div>
            <div class="pricing-card-icon gradient-bg"><i class="fa-solid fa-star"></i></div>
            <h3>Pack Emprendedor</h3>
            <div class="pricing-price">$${p.combo.monthly.toLocaleString('es-AR')}<span>/mes</span></div>
            <div class="pricing-quarterly">Trimestral: $${p.combo.quarterly.toLocaleString('es-AR')}</div>
            <div class="pricing-savings">Ahorrás $${((p.tarjeta.monthly + p.turnos.monthly) - p.combo.monthly).toLocaleString('es-AR')}/mes vs individual</div>
            <ul class="pricing-features">
                <li><i class="fa-solid fa-check"></i> Todo de Tarjeta Virtual</li>
                <li><i class="fa-solid fa-check"></i> Todo de Gestor de Turnos</li>
                <li><i class="fa-solid fa-star" style="color:var(--accent-purple)"></i> Botón "Reservar" integrado</li>
                <li><i class="fa-solid fa-star" style="color:var(--accent-purple)"></i> Ecosistema unificado</li>
                <li><i class="fa-solid fa-star" style="color:var(--accent-purple)"></i> Soporte prioritario</li>
            </ul>
        </div>
    `;
}

// ——— Modal ———
function initModal() {
    const modal = document.getElementById('clientModal');
    const form = document.getElementById('clientForm');

    document.getElementById('btnNewClient').addEventListener('click', () => openModal());
    document.getElementById('modalClose').addEventListener('click', () => closeModal());
    document.getElementById('modalCancel').addEventListener('click', () => closeModal());
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    // Auto-generate slug from name
    document.getElementById('clientName').addEventListener('input', (e) => {
        const slugField = document.getElementById('clientSlug');
        if (!editingClientId) {
            slugField.value = e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        }
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = {
            name: document.getElementById('clientName').value,
            business: document.getElementById('clientBusiness').value,
            whatsapp: document.getElementById('clientWhatsapp').value,
            email: document.getElementById('clientEmail').value,
            slug: document.getElementById('clientSlug').value,
            plan: document.getElementById('clientPlan').value,
            isPremium: document.getElementById('clientPremium').checked,
            notes: document.getElementById('clientNotes').value,
        };

        if (editingClientId) {
            updateClient(editingClientId, data);
            showToast('Cliente actualizado ✅');
        } else {
            addClient(data);
            showToast('Cliente creado exitosamente 🎉');
        }

        closeModal();
        renderDashboard();
        if (currentSection === 'clients') renderClients();
    });
}

function openModal(client = null) {
    const modal = document.getElementById('clientModal');
    editingClientId = client ? client.id : null;

    document.getElementById('modalTitle').textContent = client ? 'Editar Cliente' : 'Nuevo Cliente';
    document.getElementById('modalSubmitText').textContent = client ? 'Actualizar' : 'Guardar';

    document.getElementById('clientName').value = client?.name || '';
    document.getElementById('clientBusiness').value = client?.business || '';
    document.getElementById('clientWhatsapp').value = client?.whatsapp || '';
    document.getElementById('clientEmail').value = client?.email || '';
    document.getElementById('clientSlug').value = client?.slug || '';
    document.getElementById('clientPlan').value = client?.plan || 'tarjeta';
    document.getElementById('clientPremium').checked = client?.isPremium || false;
    document.getElementById('clientNotes').value = client?.notes || '';

    modal.classList.add('active');
    document.getElementById('clientName').focus();
}

function closeModal() {
    document.getElementById('clientModal').classList.remove('active');
    editingClientId = null;
    document.getElementById('clientForm').reset();
}

// ——— Global Actions (called from onclick in rendered HTML) ———
window._editClient = function(id) {
    const client = getClients().find(c => c.id === id);
    if (client) openModal(client);
};

window._deleteClient = function(id, name) {
    if (confirm(`¿Eliminar a "${name}"? Esta acción no se puede deshacer.`)) {
        deleteClient(id);
        showToast('Cliente eliminado');
        renderDashboard();
        if (currentSection === 'clients') renderClients();
    }
};

// ——— Mobile ———
function initMobile() {
    document.getElementById('hamburger').addEventListener('click', () => {
        document.getElementById('sidebar').classList.add('open');
    });
    document.getElementById('sidebarClose').addEventListener('click', () => {
        document.getElementById('sidebar').classList.remove('open');
    });
}

// ——— Toast ———
function showToast(message) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);
    
    requestAnimationFrame(() => toast.classList.add('show'));
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ——— Helpers ———
function getPlanColor(plan) {
    return { tarjeta: '3b82f6', turnos: '10b981', combo: '8b5cf6' }[plan] || '6366f1';
}

function getPlanLabel(plan) {
    return { tarjeta: 'Tarjeta Virtual', turnos: 'Gestor Turnos', combo: 'Pack Emprendedor' }[plan] || plan;
}
