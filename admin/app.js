console.log("cachebust-v2029-FINAL");
// ============================================
// Suito Admin Dashboard — Master Controller
// ============================================
import { CONFIG } from './config.js';
import { supabase } from '@shared/supabase.js';
import { getClients, addClient, updateClient, deleteClient, getClientStats, initImageUploads } from './clients.js';

// ——— State ———
let currentSection = 'dashboard';
let currentFilter = 'all';
let editingClientId = null;

// In-memory cache for leads — avoids unsafe JSON serialization in onclick attrs
const _leadsCache = new Map();

// ——— Init ———
document.addEventListener('DOMContentLoaded', async () => {
    initNavigation();
    initModal();
    initImageUploads(showToast);
    initFilters();
    initSearch();
    initMobile();
    await renderDashboard();
    checkNewLeads();
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

async function switchSection(section) {
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
    if (section === 'dashboard') await renderDashboard();
    if (section === 'clients') await renderClients();
    if (section === 'leads') await renderLeads();
    if (section === 'pricing') renderPricing();
}

// ——— Dashboard ———
async function renderDashboard() {
    await renderStats();
    renderPricingQuick();
    await renderRecentClients();
}

async function renderStats() {
    const grid = document.getElementById('statsGrid');
    grid.innerHTML = '<div class="loading">Cargando estadísticas...</div>';
    try {
        const stats = await getClientStats();
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
    } catch (err) {
        console.error('[renderStats] error:', err);
        grid.innerHTML = '<p class="error-text">Error al cargar estadísticas. Reintentá recargando la página.</p>';
    }
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

async function renderRecentClients() {
    const tbody = document.getElementById('recentClientsTable');
    const empty = document.getElementById('emptyDashboard');
    tbody.innerHTML = '<tr><td colspan="4" class="loading">Cargando clientes...</td></tr>';
    try {
        const clientsData = await getClients();
        const clients = clientsData.slice(0, 5);

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
                        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(c.business || c.name)}&background=${getPlanColor(c.plan)}&color=fff&size=32" alt="${escapeHtml(c.name)}">
                        <div>
                            <strong>${escapeHtml(c.business || c.name)}</strong>
                            <small style="display:block;color:var(--text-muted);font-size:12px">${escapeHtml(c.name)}</small>
                        </div>
                    </div>
                </td>
                <td><span class="badge-service ${escapeHtml(c.plan)}">${getPlanLabel(c.plan)}</span></td>
                <td><span class="status ${escapeHtml(c.status)}">${c.status === 'active' ? 'Activo' : 'Inactivo'}</span></td>
                <td>
                    <button class="action-btn" onclick="window._editClient('${escapeHtml(c.id)}')" title="Editar">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        console.error('[renderRecentClients] error:', err);
        tbody.innerHTML = '<tr><td colspan="4" class="error-text">Error al cargar clientes recientes.</td></tr>';
    }
}

// ——— Clients Section ———
async function renderClients() {
    const grid = document.getElementById('clientsGrid');
    const empty = document.getElementById('emptyClients');
    grid.innerHTML = '<div class="loading">Cargando clientes...</div>';
    empty.style.display = 'none';
    try {
        let clients = await getClients();
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

        if (clients.length === 0) {
            grid.innerHTML = '';
            empty.style.display = 'flex';
            return;
        }
        empty.style.display = 'none';

        grid.innerHTML = clients.map(c => `
            <div class="client-card" data-plan="${escapeHtml(c.plan)}">
                <div class="client-card-header">
                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(c.business || c.name)}&background=${getPlanColor(c.plan)}&color=fff&size=48" alt="${escapeHtml(c.name)}">
                    <div>
                        <h4>${escapeHtml(c.business || c.name)}</h4>
                        <span class="badge-service ${escapeHtml(c.plan)}">${getPlanLabel(c.plan)}</span>
                    </div>
                    <span class="status ${escapeHtml(c.status)}">${c.status === 'active' ? 'Activo' : 'Inactivo'}</span>
                </div>
                <div class="client-card-body">
                    <div class="client-detail"><i class="fa-solid fa-user"></i> ${escapeHtml(c.name)}</div>
                    ${c.whatsapp ? `<div class="client-detail"><i class="fa-brands fa-whatsapp"></i> ${escapeHtml(c.whatsapp)}</div>` : ''}
                    ${c.email ? `<div class="client-detail"><i class="fa-solid fa-envelope"></i> ${escapeHtml(c.email)}</div>` : ''}
                    <div class="client-detail"><i class="fa-solid fa-link"></i> /${escapeHtml(c.slug)}</div>
                    ${c.is_premium ? `<div class="client-detail" style="color:var(--accent-purple);font-weight:600;"><i class="fa-solid fa-star"></i> Nivel Premium</div>` : `<div class="client-detail text-muted"><i class="fa-regular fa-star"></i> Nivel Gratuito</div>`}
                    ${c.free_until ? `<div class="client-detail highlight-text"><i class="fa-solid fa-gift"></i> Bonificado hasta: ${new Date(c.free_until).toLocaleDateString()}</div>` : ''}
                    ${c.notes ? `<div class="client-detail notes"><i class="fa-solid fa-sticky-note"></i> ${escapeHtml(c.notes)}</div>` : ''}
                </div>
                <div class="client-card-footer">
                    <div class="card-footer-actions">
                        ${c.plan !== 'turnos' ? `<a href="${CONFIG.products.tarjetaVirtual}/${escapeHtml(c.card_id || c.slug)}" target="_blank" class="action-btn-link" title="Ver Tarjeta"><i class="fa-solid fa-address-card"></i></a>` : ''}
                        ${c.plan !== 'tarjeta' ? `<a href="${CONFIG.products.gestorTurnos}/#/${escapeHtml(c.slug)}" target="_blank" class="action-btn-link" title="Ver Turnos"><i class="fa-solid fa-calendar"></i></a>` : ''}
                        <button class="action-btn-link purple" onclick="window._deliverClient('${escapeHtml(c.id)}')" title="Entregar por WhatsApp"><i class="fa-solid fa-paper-plane"></i></button>
                        <button class="action-btn-link silver" onclick="window._copyLink('${escapeHtml(c.id)}')" title="Copiar Link"><i class="fa-solid fa-copy"></i></button>
                    </div>
                    <div class="card-footer-manage">
                        <button class="action-btn" onclick="window._editClient('${escapeHtml(c.id)}')" title="Editar"><i class="fa-solid fa-pen"></i></button>
                        <button class="action-btn danger" onclick="window._deleteClient('${escapeHtml(c.id)}', '${escapeHtml(c.business || c.name)}')" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (err) {
        console.error('[renderClients] error:', err);
        grid.innerHTML = '<p class="error-text">Error al cargar clientes. Reintentá recargando la página.</p>';
    }
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

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            name: document.getElementById('clientName').value,
            business: document.getElementById('clientBusiness').value,
            whatsapp: document.getElementById('clientWhatsapp').value,
            email: document.getElementById('clientEmail').value,
            slug: document.getElementById('clientSlug').value,
            plan: document.getElementById('clientPlan').value,
            is_premium: document.getElementById('clientPremium').checked,
            free_until: document.getElementById('clientFreeUntil').value || null,
            transfer_email: document.getElementById('clientTransferEmail').value || null,
            notes: document.getElementById('clientNotes').value,
            profession: document.getElementById('clientProfession').value || null,
            foto_url: document.getElementById('clientFotoUrl').value || null,
            cover_url: document.getElementById('clientCoverUrl').value || null,
        };

        try {
            if (editingClientId) {
                await updateClient(editingClientId, data);
                showToast('Cliente actualizado ✅');
            } else {
                await addClient(data);
                showToast('Cliente creado exitosamente 🎉');
            }

            closeModal();
            await renderDashboard();
            if (currentSection === 'clients') await renderClients();
        } catch (error) {
            showToast('Error al guardar cliente ❌');
            console.error(error);
        }
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
    document.getElementById('clientPremium').checked = client?.is_premium || false;
    document.getElementById('clientFreeUntil').value = client?.free_until || '';
    document.getElementById('clientTransferEmail').value = client?.transfer_email || '';
    document.getElementById('clientNotes').value = client?.notes || '';
    document.getElementById('clientProfession').value = client?.profession || '';
    document.getElementById('clientFotoUrl').value = client?.foto_url || '';
    document.getElementById('clientCoverUrl').value = client?.cover_url || '';

    // Gallery editor button logic
    const galleryControls = document.getElementById('gallery-vcard-controls');
    const galleryBtn = document.getElementById('btnOpenGalleryEditor');
    
    if (client && client.plan !== 'turnos') {
        galleryControls.style.display = 'block';
        galleryBtn.onclick = () => {
            const baseUrl = CONFIG.products.tarjetaVirtual;
            const slug = client.slug || client.id;
            const token = client.edit_token;
            if (token) {
                window.open(`${baseUrl}/${slug}?edit=${token}`, '_blank');
            } else {
                alert('Este cliente no tiene un token de edición generado. Por favor guardá los cambios primero.');
            }
        };
    } else {
        galleryControls.style.display = 'none';
    }

    modal.classList.add('active');
    document.getElementById('clientName').focus();
}

function closeModal() {
    document.getElementById('clientModal').classList.remove('active');
    editingClientId = null;
    document.getElementById('clientForm').reset();
}

// ——— Global Actions (called from onclick in rendered HTML) ———
window._editClient = async function(id) {
    const clients = await getClients();
    const client = clients.find(c => c.id === id);
    if (client) openModal(client);
};

window._deleteClient = async function(id, name) {
    if (confirm(`¿Eliminar a "${name}"? Esta acción no se puede deshacer.`)) {
        await deleteClient(id);
        showToast('Cliente eliminado');
        await renderDashboard();
        if (currentSection === 'clients') await renderClients();
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

// ——— Leads Section (Supabase) ———
async function renderLeads() {
    const grid = document.getElementById('leadsGrid');
    const empty = document.getElementById('emptyLeads');

    grid.innerHTML = '<div class="loading">Cargando solicitudes...</div>';
    _leadsCache.clear();

    try {
        const { data: leads, error } = await supabase
            .from('leads')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!leads || leads.length === 0) {
            grid.innerHTML = '';
            empty.style.display = 'flex';
            return;
        }

        empty.style.display = 'none';

        // Populate cache keyed by id — avoids JSON serialization in onclick attrs
        leads.forEach(l => _leadsCache.set(String(l.id), l));

        grid.innerHTML = leads.map(l => `
            <div class="lead-card animate-fade-in">
                <div class="lead-header">
                    <div class="lead-user">
                        <img src="${l.profile_img_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(l.name)}&background=6366f1&color=fff`}" alt="${escapeHtml(l.name)}">
                        <div>
                            <h4>${escapeHtml(l.name)}</h4>
                            <span class="lead-date">${new Date(l.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                    <span class="badge-service ${escapeHtml(l.service_type.toLowerCase())}">${escapeHtml(l.service_type)}</span>
                </div>
                <div class="lead-body">
                    <div class="lead-info"><strong>WhatsApp:</strong> ${escapeHtml(l.phone)}</div>
                    <div class="lead-info"><strong>Negocio:</strong> ${escapeHtml(l.details?.business_name || 'No especificado')}</div>
                    <div class="lead-info"><strong>Profesión:</strong> ${escapeHtml(l.details?.profession || 'No especificada')}</div>
                    <div class="lead-info"><strong>Origen:</strong> ${escapeHtml(l.details?.origin || 'Directo')}</div>
                </div>
                <div class="lead-footer">
                    <button class="primary-btn sm"
                            data-lead-id="${escapeHtml(String(l.id))}"
                            onclick="window._activateLead('${escapeHtml(String(l.id))}')"
                            title="Activa al cliente y provisiona sus apps automáticamente">
                        <i class="fa-solid fa-bolt"></i> ⚡ Activar Cliente
                    </button>
                    <a href="https://wa.me/549${encodeURIComponent(l.phone)}" target="_blank" class="action-btn-link purple" title="Hablar por WhatsApp">
                        <i class="fa-brands fa-whatsapp"></i>
                    </a>
                </div>
            </div>
        `).join('');
    } catch (err) {
        console.error('[renderLeads] error:', err);
        grid.innerHTML = `<p class="error-text">Error al cargar solicitudes: ${escapeHtml(err.message)}</p>`;
    }
}

async function checkNewLeads() {
    try {
        const { count, error } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true });

        if (!error && count > 0) {
            const badge = document.getElementById('leadsBadge');
            badge.textContent = count;
            badge.style.display = 'inline-flex';
        }
    } catch (err) {
        console.error('[checkNewLeads] error:', err);
    }
}

// ——— Global External Actions ———
window._deliverClient = async function(id) {
    const clients = await getClients();
    const client = clients.find(c => c.id === id);
    if (!client) return;

    const baseUrl = 'https://suito.pro';
    const slug = client.card_id || client.slug;
    const hasTarjeta = client.plan === 'tarjeta' || client.plan === 'combo';
    const hasTurnos  = client.plan === 'turnos'  || client.plan === 'combo';

    let message = `¡Hola ${client.name}! 👋 Te escribo de *Suito*.\n\n`;

    if (hasTarjeta) {
        message += `📇 *Tu Tarjeta Virtual:*\n`;
        message += `🔗 Ver: ${baseUrl}/card/${slug}\n`;
        if (client.edit_token) {
            message += `✏️ Editar (solo vos): ${baseUrl}/edit/${slug}?token=${client.edit_token}\n`;
        }
        message += `\n`;
    }

    if (hasTurnos) {
        if (!client.edit_token) {
            showToast('⚠️ Este cliente no tiene edit_token — guardá los cambios antes de enviar el link.');
            return;
        }
        message += `📅 *Tu Gestor de Turnos:*\n`;
        message += `🔐 Crear contraseña (1ra vez): ${baseUrl}/turnos/#/register?slug=${slug}&token=${client.edit_token}\n`;
        message += `📊 Tu panel: ${baseUrl}/turnos/#/${slug}/\n`;
        message += `_Usá el mismo email con el que te registramos._\n\n`;
    }

    message += `¡Cualquier duda avisame! 💪`;

    const waUrl = `https://wa.me/549${client.whatsapp}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
};

window._copyLink = async function(id) {
    const clients = await getClients();
    const client = clients.find(c => c.id === id);
    if (!client) return;

    const baseUrl = client.plan === 'turnos' ? CONFIG.products.gestorTurnos : CONFIG.products.tarjetaVirtual;
    const fullUrl = `${baseUrl}/${client.plan === 'turnos' ? '#/' : ''}${client.card_id || client.slug}`;

    navigator.clipboard.writeText(fullUrl).then(() => {
        showToast('Enlace copiado al portapapeles 📋');
    });
};

// _activateLead — Activa el cliente con 1 click.
// addClient() escribe directamente en businesses; un único insert cubre CRM + perfil.
window._activateLead = async function(id) {
    const lead = _leadsCache.get(id);
    if (!lead) { showToast('❌ Lead no encontrado en caché'); return; }

    const btn = document.querySelector(`[data-lead-id="${id}"]`);
    if (btn) { btn.disabled = true; btn.innerHTML = '⏳ Activando...'; }

    try {
        const plan = lead.service_type.toLowerCase();
        const slug = (lead.details?.business_name || lead.name)
            .toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');

        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + 30);

        // Único insert: admin/CRM fields + business profile fields en una sola llamada.
        // addClient() ahora escribe directamente en la tabla businesses.
        const newClient = await addClient({
            // Campos admin/CRM
            name:           lead.name,
            business:       lead.details?.business_name || lead.name,
            whatsapp:       lead.phone,
            email:          lead.email || '',
            slug:           slug,
            plan:           plan,
            status:         'active',
            notes:          `Activado desde lead #${lead.id}. Profesión: ${lead.details?.profession || '—'}. Origen: ${lead.details?.origin || '—'}.`,
            // Campos perfil de negocio
            foto_url:             lead.profile_img_url || '',
            cover_url:            lead.cover_img_url  || '',
            profession:           lead.details?.profession || '',
            instagram:            lead.details?.instagram  || '',
            location:             lead.details?.address    || '',
            valor_sena:           lead.details?.deposit ? Number(lead.details.deposit) : 2000,
            is_premium:           false,
            fecha_vencimiento:    trialEnd.toISOString().split('T')[0],
            notificaciones_email: true,
            recordatorios_activos:true,
            active_modules: plan === 'tarjeta' ? ['card'] :
                            plan === 'turnos'  ? ['appointments'] :
                                                ['card', 'appointments'],
        });

        // Marcar lead como convertido
        await supabase.from('leads')
            .update({ status: 'converted', converted_at: new Date().toISOString() })
            .eq('id', id);

        // Notificar al cliente por WhatsApp
        const baseUrl = 'https://suito.pro';
        const hasTarjeta = plan === 'tarjeta' || plan === 'combo';
        const hasTurnos  = plan === 'turnos'  || plan === 'combo';
        let msg = `¡Hola ${lead.name}! 🎉 Tu suite en *Suito* ya está activa. 🚀\n\n`;
        if (hasTarjeta) {
            msg += `📇 *Tu Tarjeta Virtual:*\n`;
            msg += `🔗 Ver: ${baseUrl}/card/${slug}\n`;
            if (newClient?.edit_token) {
                msg += `✏️ Editar (solo vos): ${baseUrl}/edit/${slug}?token=${newClient.edit_token}\n`;
            }
            msg += `\n`;
        }
        if (hasTurnos) {
            if (!newClient?.edit_token) {
                showToast('⚠️ El cliente se activó pero falta edit_token — no se envió link de registro.');
                return;
            }
            msg += `📅 *Tu Gestor de Turnos:*\n`;
            msg += `🔐 Crear contraseña (1ra vez): ${baseUrl}/turnos/#/register?slug=${slug}&token=${newClient.edit_token}\n`;
            msg += `📊 Tu panel: ${baseUrl}/turnos/#/${slug}/\n`;
            msg += `_Usá el mismo email con el que te registramos._\n\n`;
        }
        msg += `¡Cualquier duda estoy acá! 💪`;

        const waUrl = `https://wa.me/549${lead.phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`;
        window.open(waUrl, '_blank');

        showToast(`✅ ${lead.name} activado exitosamente`);
        await renderLeads();
        await renderDashboard();

    } catch (err) {
        console.error('[_activateLead] error:', err);
        showToast('❌ Error al activar cliente. Revisá la consola.');
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-bolt"></i> ⚡ Activar Cliente'; }
    }
};

// ——— Helpers ———
function getPlanColor(plan) {
    return { tarjeta: '3b82f6', turnos: '10b981', combo: '8b5cf6' }[plan] || '6366f1';
}

function getPlanLabel(plan) {
    return { tarjeta: 'Tarjeta Virtual', turnos: 'Gestor Turnos', combo: 'Pack Emprendedor' }[plan] || plan;
}

/** Escapes user-supplied strings before injecting into innerHTML. */
function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
