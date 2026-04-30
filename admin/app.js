// Inlining CONFIG to prevent 404 on external file in some environments
const CONFIG = {
    products: {
        tarjetaVirtual: 'https://suito.pro/card',
        gestorTurnos: 'https://suito.pro/turnos',
    },
    pricing: {
        tarjeta: { monthly: 4900, quarterly: 12500 },
        turnos: { monthly: 9900, quarterly: 25000 },
        combo: { monthly: 12900, quarterly: 33000 },
    }
};

import { supabase } from '@shared/supabase.js';
import { getClients, addClient, updateClient, updateClientBenefits, deleteClient, getClientStats, initImageUploads } from './clients.js';
import { getPricing, updatePricing, applyInflation } from './pricing.js';

// ——— State ———
let currentSection = 'dashboard';
let currentFilter = 'all';
let editingClientId = null;
let currentPricing = null; // loaded from Supabase on init

// In-memory cache for leads — avoids unsafe JSON serialization in onclick attrs
const _leadsCache = new Map();

// Business Profile State
let userBusiness = null;

function normalizeWhatsAppNumber(value) {
    let digits = String(value || '').replace(/\D/g, '');
    if (!digits) return '';

    if (digits.startsWith('00')) {
        digits = digits.slice(2);
    }

    if (digits.startsWith('549')) {
        return digits;
    }

    if (digits.startsWith('54')) {
        const national = digits.slice(2).replace(/^0+/, '');
        return national.startsWith('9') ? digits : `549${national}`;
    }

    digits = digits.replace(/^0+/, '');

    if (digits.startsWith('9')) {
        return `54${digits}`;
    }

    if (digits.startsWith('1115')) {
        digits = `11${digits.slice(4)}`;
    }

    return `549${digits}`;
}

function buildWhatsAppUrl(phone, text = '') {
    const normalizedPhone = normalizeWhatsAppNumber(phone);
    if (!normalizedPhone) return '';

    const url = new URL(`https://wa.me/${normalizedPhone}`);
    if (text) {
        url.searchParams.set('text', text);
    }
    return url.toString();
}

// ——— Init ———
document.addEventListener('DOMContentLoaded', async () => {
    currentPricing = await getPricing();
    updatePlanSelector();
    initNavigation();
    initModal();
    initImageUploads(showToast);
    initFilters();
    initSearch();
    initMobile();
    await checkSubscriptionStatus(); // Load business data first
    await renderDashboard();
    checkNewLeads();
});

// ——— Navigation ———
function initNavigation() {
    document.querySelectorAll('.nav-links li').forEach(li => {
        if (li.dataset.external) return;
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
    if (section === 'subscription') renderSubscription();
}

// ——— Dashboard ———
async function renderDashboard() {
    renderSubscriptionBanner();
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
    const p = currentPricing;
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
                            <strong>
                                ${escapeHtml(c.business || c.name)}
                                ${c.is_premium ? '<i class="fa-solid fa-crown tier-icon vitalicio" title="Plan Vitalicio"></i>' : ''}
                                ${c.free_until && new Date(c.free_until) > new Date() ? '<i class="fa-solid fa-gift tier-icon gift" title="Plan Bonificado"></i>' : ''}
                            </strong>
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
                        <h4>
                            ${escapeHtml(c.business || c.name)}
                            ${c.is_premium ? '<i class="fa-solid fa-crown tier-icon vitalicio" title="Plan Vitalicio"></i>' : ''}
                            ${c.free_until && new Date(c.free_until) > new Date() ? '<i class="fa-solid fa-gift tier-icon gift" title="Plan Bonificado"></i>' : ''}
                        </h4>
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
    const p = currentPricing;

    const planCard = (id, icon, iconClass, label, features, extra = '') => `
        <div class="pricing-card${id === 'combo' ? ' featured' : ''}">
            ${id === 'combo' ? '<div class="pricing-badge">MÁS POPULAR</div>' : ''}
            <div class="pricing-card-icon ${iconClass}"><i class="fa-solid fa-${icon}"></i></div>
            <h3>${label}</h3>
            <div class="pricing-edit-fields">
                <label>Mensual ($)
                    <input type="number" id="price-${id}-monthly" value="${p[id].monthly}" min="0" step="50" class="pricing-input">
                </label>
                <label>Trimestral ($)
                    <input type="number" id="price-${id}-quarterly" value="${p[id].quarterly}" min="0" step="50" class="pricing-input">
                </label>
            </div>
            ${extra}
            <ul class="pricing-features">${features}</ul>
        </div>`;

    const feat = (text) => `<li><i class="fa-solid fa-check"></i> ${text}</li>`;
    const featStar = (text) => `<li><i class="fa-solid fa-star" style="color:var(--accent-purple)"></i> ${text}</li>`;

    document.getElementById('pricingCards').innerHTML =
        planCard('tarjeta', 'address-card', 'blue-bg', 'Tarjeta Virtual',
            feat('PWA instalable') + feat('Compartir por WhatsApp') + feat('Galería de imágenes') +
            feat('Exportar contacto vCard') + feat('Open Graph optimizado') + feat('Editable en tiempo real')
        ) +
        planCard('turnos', 'calendar-check', 'green-bg', 'Gestor de Turnos',
            feat('Agenda inteligente') + feat('Reserva online 24/7') + feat('Integración MercadoPago') +
            feat('Confirmación por WhatsApp') + feat('Multi-tenant (slug único)') + feat('Bloqueo de horarios')
        ) +
        planCard('combo', 'star', 'gradient-bg', 'Pack Emprendedor',
            feat('Todo de Tarjeta Virtual') + feat('Todo de Gestor de Turnos') +
            featStar('Botón "Reservar" integrado') + featStar('Ecosistema unificado') + featStar('Soporte prioritario'),
            `<div class="pricing-savings">Ahorrás $${((p.tarjeta.monthly + p.turnos.monthly) - p.combo.monthly).toLocaleString('es-AR')}/mes vs individual</div>`
        );

    // Wire save button (data-wired prevents duplicate listeners on re-render)
    const btnSave = document.getElementById('btnSavePricing');
    if (btnSave && !btnSave.dataset.wired) {
        btnSave.dataset.wired = 'true';
        btnSave.addEventListener('click', handleSavePricing);
    }
    const btnInflation = document.getElementById('btnApplyInflation');
    if (btnInflation && !btnInflation.dataset.wired) {
        btnInflation.dataset.wired = 'true';
        btnInflation.addEventListener('click', handleApplyInflation);
    }

    // Update plan selector in client modal
    updatePlanSelector();
}

async function handleSavePricing() {
    const btn = document.getElementById('btnSavePricing');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';

    try {
        const newPricing = {
            tarjeta: {
                monthly: Number(document.getElementById('price-tarjeta-monthly').value),
                quarterly: Number(document.getElementById('price-tarjeta-quarterly').value),
            },
            turnos: {
                monthly: Number(document.getElementById('price-turnos-monthly').value),
                quarterly: Number(document.getElementById('price-turnos-quarterly').value),
            },
            combo: {
                monthly: Number(document.getElementById('price-combo-monthly').value),
                quarterly: Number(document.getElementById('price-combo-quarterly').value),
            },
        };

        await updatePricing(newPricing);
        currentPricing = newPricing;
        renderPricing();
        renderPricingQuick();
        showToast('Precios actualizados correctamente');
    } catch (err) {
        console.error('[handleSavePricing]', err);
        showToast('Error al guardar precios. Revisá la consola.');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar Precios';
    }
}

function handleApplyInflation() {
    const input = document.getElementById('inflationPercent');
    const pct = parseFloat(input.value);
    if (isNaN(pct) || pct <= 0 || pct > 100) {
        showToast('Ingresá un porcentaje válido (ej: 3.4)');
        return;
    }

    const preview = applyInflation(currentPricing, pct);

    // Fill inputs with preview values (user still needs to click "Guardar")
    for (const plan of ['tarjeta', 'turnos', 'combo']) {
        document.getElementById(`price-${plan}-monthly`).value = preview[plan].monthly;
        document.getElementById(`price-${plan}-quarterly`).value = preview[plan].quarterly;
    }

    showToast(`Inflación del ${pct}% aplicada. Revisá y hacé click en "Guardar Precios".`);
}

function updatePlanSelector() {
    const select = document.getElementById('clientPlan');
    if (!select) return;
    const p = currentPricing;
    select.innerHTML = `
        <option value="tarjeta">Tarjeta Virtual — $${p.tarjeta.monthly.toLocaleString('es-AR')}/mes</option>
        <option value="turnos">Gestor de Turnos — $${p.turnos.monthly.toLocaleString('es-AR')}/mes</option>
        <option value="combo">Pack Emprendedor — $${p.combo.monthly.toLocaleString('es-AR')}/mes</option>
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
            force_watermark: document.getElementById('clientForceWatermark').checked,
            disable_share: document.getElementById('clientDisableShare').checked,
            font_scale: parseFloat(document.getElementById('clientFontScale').value) || 1.0,
            free_until: document.getElementById('clientFreeUntil').value || null,
            transfer_email: document.getElementById('clientTransferEmail').value || null,
            notes: document.getElementById('clientNotes').value,
            profession: document.getElementById('clientProfession').value || null,
            foto_url: document.getElementById('clientFotoUrl').value || null,
            cover_url: document.getElementById('clientCoverUrl').value || null,
        };

        try {
            if (editingClientId) {
                const { is_premium, free_until, ...profileData } = data;
                await updateClient(editingClientId, profileData);
                await updateClientBenefits(editingClientId, {
                    is_premium,
                    free_until,
                    clear_free_until: free_until === null,
                });
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
    document.getElementById('clientForceWatermark').checked = client?.force_watermark || false;
    document.getElementById('clientDisableShare').checked = client?.disable_share || false;
    document.getElementById('clientFontScale').value = client?.font_scale || '1.0';
    document.getElementById('clientFreeUntil').value = client?.free_until || '';
    document.getElementById('clientTransferEmail').value = client?.transfer_email || '';
    document.getElementById('clientNotes').value = client?.notes || '';
    document.getElementById('clientProfession').value = client?.profession || '';
    document.getElementById('clientFotoUrl').value = client?.foto_url || '';
    document.getElementById('clientCoverUrl').value = client?.cover_url || '';

    // Gallery editor button logic
    const galleryControls = document.getElementById('gallery-vcard-controls');
    const galleryBtn = document.getElementById('btnOpenGalleryEditor');
    const copyBtn = document.getElementById('btnCopyEditorLink');
    const copyFeedback = document.getElementById('copyLinkFeedback');
    
    if (client && client.plan !== 'turnos') {
        galleryControls.style.display = 'block';

        const getEditorUrl = () => {
            const slug = client.slug || client.id;
            const token = client.edit_token;
            if (!slug || !token) return '';
            return `https://suito.pro/edit/${slug}?token=${token}`;
        };

        galleryBtn.onclick = () => {
            const url = getEditorUrl();
            if (url) {
                window.open(url, '_blank');
            } else {
                alert('Este cliente no tiene un token de edición generado. Por favor guardá los cambios primero.');
            }
        };

        copyBtn.onclick = () => {
            const url = getEditorUrl();
            if (url) {
                navigator.clipboard.writeText(url).then(() => {
                    copyFeedback.style.display = 'block';
                    setTimeout(() => { copyFeedback.style.display = 'none'; }, 3000);
                }).catch(() => {
                    prompt('Copiá este link y enviáselo al cliente:', url);
                });
            } else {
                alert('Este cliente no tiene un token de edición. Por favor guardá los cambios primero.');
            }
        };
    } else {
        galleryControls.style.display = 'none';
    }

    // --- Plan Especial Container ---
    const planEspecial = document.getElementById('planEspecialContainer');
    if (client) {
        planEspecial.style.display = 'block';
    } else {
        planEspecial.style.display = 'none';
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
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('show'));

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ——— Plan Especial Logic ———
window.bonificarPlan = async function(days) {
    if (!editingClientId) return;
    
    try {
        const clients = await getClients();
        const client = clients.find(c => c.id === editingClientId);
        
        let baseDate = new Date();
        // Si ya tiene una fecha de bonificación futura, sumar a partir de ahí
        if (client.free_until && new Date(client.free_until) > new Date()) {
            baseDate = new Date(client.free_until);
        }
        
        const newDate = new Date(baseDate.getTime() + (days * 24 * 60 * 60 * 1000));
        const free_until = newDate.toISOString().split('T')[0];
        
        await updateClientBenefits(editingClientId, { free_until });
        
        showToast(`¡Plan bonificado ${days} días! (Hasta ${free_until})`, 'success');
        
        // Actualizar UI en vivo
        document.getElementById('clientFreeUntil').value = free_until;
        await renderDashboard();
        if (currentSection === 'clients') await renderClients();
        
    } catch (err) {
        console.error('[bonificarPlan] error:', err);
        showToast('Error al bonificar plan', 'error');
    }
};

window.setVitalicio = async function() {
    if (!editingClientId) return;
    
    if (!confirm('¿Convertir este cliente a Vitalicio? Tendrá acceso premium permanente.')) return;
    
    try {
        await updateClientBenefits(editingClientId, {
            is_premium: true,
            subscription_status: 'active',
            clear_trial_ends_at: true,
            clear_free_until: true
        });
        
        showToast('¡Cliente convertido a VITALICIO! 👑', 'success');
        
        // Actualizar UI en vivo
        document.getElementById('clientPremium').checked = true;
        await renderDashboard();
        if (currentSection === 'clients') await renderClients();
        
    } catch (err) {
        console.error('[setVitalicio] error:', err);
        showToast('Error al establecer vitalicio', 'error');
    }
};

// ——— Leads Section (Supabase) ———
let _leadsDebounceTimer = null;

function _renderLeadCards(leads) {
    const grid = document.getElementById('leadsGrid');
    const empty = document.getElementById('emptyLeads');

    if (!leads || leads.length === 0) {
        grid.innerHTML = '';
        empty.style.display = 'flex';
        return;
    }

    empty.style.display = 'none';
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
                <div style="display:flex; gap:8px;">
                    <a href="${buildWhatsAppUrl(l.phone)}" target="_blank" class="action-btn-link purple" title="Hablar por WhatsApp">
                        <i class="fa-brands fa-whatsapp"></i>
                    </a>
                    <button class="action-btn danger" 
                            onclick="window._deleteLead('${escapeHtml(String(l.id))}', '${escapeHtml(l.name)}')"
                            title="Eliminar solicitud">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function filterAndRenderLeads() {
    const searchVal = (document.getElementById('leadsSearch')?.value || '').toLowerCase();
    const serviceVal = document.getElementById('leadsServiceFilter')?.value || '';

    const filtered = Array.from(_leadsCache.values()).filter(l => {
        if (serviceVal && l.service_type !== serviceVal) return false;
        if (searchVal) {
            const hay = [l.name, l.phone, l.details?.business_name || '']
                .join(' ').toLowerCase();
            if (!hay.includes(searchVal)) return false;
        }
        return true;
    });

    _renderLeadCards(filtered);
}

async function renderLeads() {
    const grid = document.getElementById('leadsGrid');

    grid.innerHTML = '<div class="loading">Cargando solicitudes...</div>';
    _leadsCache.clear();

    try {
        const { data: leads, error } = await supabase
            .from('leads')
            .select('*')
            .neq('status', 'converted')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (leads) leads.forEach(l => _leadsCache.set(String(l.id), l));

        filterAndRenderLeads();

        const searchInput = document.getElementById('leadsSearch');
        const serviceSelect = document.getElementById('leadsServiceFilter');

        if (searchInput && !searchInput._bound) {
            searchInput._bound = true;
            searchInput.addEventListener('input', () => {
                clearTimeout(_leadsDebounceTimer);
                _leadsDebounceTimer = setTimeout(filterAndRenderLeads, 300);
            });
        }
        if (serviceSelect && !serviceSelect._bound) {
            serviceSelect._bound = true;
            serviceSelect.addEventListener('change', filterAndRenderLeads);
        }
    } catch (err) {
        console.error('[renderLeads] error:', err);
        grid.innerHTML = `<p class="error-text">Error al cargar solicitudes: ${escapeHtml(err.message)}</p>`;
    }
}

async function checkNewLeads() {
    try {
        const { count, error } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .neq('status', 'converted');

        const badge = document.getElementById('leadsBadge');
        if (!error && count > 0) {
            badge.textContent = count;
            badge.style.display = 'inline-flex';
        } else if (badge) {
            badge.style.display = 'none';
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
        message += `🗓️ *Tu Gestor de Turnos:*\n`;
        message += `${baseUrl}/turnos/#/${slug}\n\n`;
    }

    message += `¡Cualquier duda avisame! ✨`;

    const waUrl = buildWhatsAppUrl(client.whatsapp, message);
    if (!waUrl) {
        showToast('El cliente no tiene un WhatsApp valido cargado.', 'error');
        return;
    }
    window.open(waUrl, '_blank');
};

// ——— Subscription Logic ———

async function checkSubscriptionStatus() {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data: business, error } = await supabase
            .from('businesses')
            .select('*')
            .eq('user_id', session.user.id)
            .maybeSingle();

        if (error) throw error;

        userBusiness = business;
        
        // If it's a business owner, show subscription tab
        if (userBusiness) {
            document.getElementById('nav-subscription').style.display = 'block';
        }
    } catch (err) {
        console.error('[checkSubscriptionStatus] error:', err);
    }
}

function renderSubscriptionBanner() {
    const container = document.getElementById('subscription-alert-container');
    if (!userBusiness) {
        container.innerHTML = '';
        return;
    }

    const isPremium = userBusiness.is_premium;
    const trialEnds = userBusiness.trial_ends_at ? new Date(userBusiness.trial_ends_at) : null;
    const isExpired = trialEnds && trialEnds < new Date() && !isPremium;

    if (isPremium) {
        container.innerHTML = `
            <div class="subscription-banner premium">
                <div class="banner-content">
                    <i class="fa-solid fa-crown"></i>
                    <div>
                        <strong>Suscripción Premium Activa</strong>
                        <p>Tenés acceso ilimitado a todas las herramientas.</p>
                    </div>
                </div>
            </div>
        `;
    } else if (isExpired) {
        container.innerHTML = `
            <div class="subscription-banner expired">
                <div class="banner-content">
                    <i class="fa-solid fa-circle-exclamation"></i>
                    <div>
                        <strong>Periodo de prueba expirado</strong>
                        <p>Tus servicios están pausados. Activá Premium para continuar.</p>
                    </div>
                </div>
                <button class="upgrade-btn" onclick="switchSection('subscription')">Activar Ahora</button>
            </div>
        `;
    } else if (trialEnds) {
        const diff = Math.ceil((trialEnds - new Date()) / (1000 * 60 * 60 * 24));
        container.innerHTML = `
            <div class="subscription-banner trial">
                <div class="banner-content">
                    <i class="fa-solid fa-clock"></i>
                    <div>
                        <strong>Periodo de prueba activo</strong>
                        <p>Te quedan ${diff} días para probar Suito gratis.</p>
                    </div>
                </div>
                <button class="upgrade-btn" onclick="switchSection('subscription')">Pasar a Premium</button>
            </div>
        `;
    }
}

function renderSubscription() {
    const container = document.getElementById('current-subscription-card');
    if (!userBusiness) {
        container.innerHTML = '<div class="panel-body"><p>No hay un negocio vinculado a esta cuenta.</p></div>';
        return;
    }

    const isPremium = userBusiness.is_premium;
    const planLabel = userBusiness.plan === 'combo' ? 'Pack Emprendedor' : (userBusiness.plan === 'turnos' ? 'Gestor de Turnos' : 'Tarjeta Virtual');
    
    container.innerHTML = `
        <div class="panel-header">
            <h2>Plan Actual: ${planLabel}</h2>
            <span class="status ${isPremium ? 'active' : 'inactive'}">${isPremium ? 'Premium' : 'Free Trial'}</span>
        </div>
        <div class="panel-body">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div>
                    <h3 style="font-size:24px; margin-bottom:8px;">${isPremium ? 'Acceso Vitalicio ✨' : 'Suscripción Mensual'}</h3>
                    <p style="color:var(--text-muted); font-size:14px; max-width:400px;">
                        ${isPremium 
                            ? 'Gracias por ser parte de Suito. Tenés acceso total a todas las funcionalidades de por vida.' 
                            : 'Activá el estado Premium para desbloquear turnos ilimitados y eliminar la marca de agua.'}
                    </p>
                </div>
                ${!isPremium ? `
                    <div style="text-align:right;">
                        <div style="font-size:32px; font-weight:700;">$${currentPricing[userBusiness.plan].monthly.toLocaleString('es-AR')}</div>
                        <div style="color:var(--text-muted); font-size:12px; margin-bottom:12px;">por mes</div>
                        <button class="primary-btn" style="width:100%;" onclick="handlePaySubscription()">
                            <i class="fa-solid fa-bolt"></i> Activar Premium
                        </button>
                    </div>
                ` : `
                    <div class="stat-icon purple" style="width:80px; height:80px; font-size:40px;">
                        <i class="fa-solid fa-crown"></i>
                    </div>
                `}
            </div>
            
            <div style="margin-top:32px; border-top:1px solid var(--border); padding-top:20px;">
                <h4 style="font-size:14px; margin-bottom:16px; color:var(--text-secondary);">Beneficios incluidos:</h4>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                    <div class="client-detail"><i class="fa-solid fa-check" style="color:var(--accent-green)"></i> Turnos ilimitados</div>
                    <div class="client-detail"><i class="fa-solid fa-check" style="color:var(--accent-green)"></i> WhatsApp automático</div>
                    <div class="client-detail"><i class="fa-solid fa-check" style="color:var(--accent-green)"></i> Sin marca de agua</div>
                    <div class="client-detail"><i class="fa-solid fa-check" style="color:var(--accent-green)"></i> Perfil optimizado</div>
                </div>
            </div>
        </div>
    `;
}

window.handlePaySubscription = async function() {
    const btn = event.target.closest('button');
    const originalContent = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generando pago...';

    try {
        // Call the Edge Function to generate checkout
        const { data, error } = await supabase.functions.invoke('create-pricing-checkout', {
            body: { 
                plan_type: userBusiness.plan,
                business_id: userBusiness.id,
                email: userBusiness.email
            }
        });

        if (error) throw error;
        if (data && data.checkout_url) {
            window.location.href = data.checkout_url;
        } else {
            throw new Error('No se recibió la URL de pago');
        }
    } catch (err) {
        console.error('[handlePaySubscription] error:', err);
        showToast('Error al conectar con Mercado Pago. Reintentá en unos minutos.', 'error');
        btn.disabled = false;
        btn.innerHTML = originalContent;
    }
}

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
        const now = new Date();
        const plan = lead.service_type.toLowerCase();
        
        // Trial calculation: 3 days for Tarjeta, 7 days for Turnos/Combo
        const trialDays = plan === 'tarjeta' ? 3 : 7;
        const trialEnd = new Date(now);
        trialEnd.setDate(trialEnd.getDate() + trialDays);

        // Price lock calculation: 90 days from now
        const priceLockEnd = new Date(now);
        priceLockEnd.setDate(priceLockEnd.getDate() + 90);

        // Get current price from memory cache
        const currentPrice = currentPricing[plan]?.monthly || 0;

        const slug = (lead.details?.business_name || lead.name)
            .toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');

        // Único insert: admin/CRM fields + business profile fields en una sola llamada.
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
            
            // --- New Monetization Fields (Hybrid-Trial) ---
            subscription_status: 'trial',
            trial_ends_at:       trialEnd.toISOString(),
            locked_price:        currentPrice,
            price_lock_ends_at:  priceLockEnd.toISOString(),

            // Campos perfil de negocio
            foto_url:             lead.profile_img_url || '',
            cover_url:            lead.cover_img_url  || '',
            profession:           lead.details?.profession || lead.details?.prof || '',
            instagram:            lead.details?.instagram  || lead.details?.ig   || '',
            location:             lead.details?.address    || '',
            valor_sena:           lead.details?.deposit ? Number(lead.details.deposit) : 2000,
            is_premium:           false,
            fecha_vencimiento:    trialEnd.toISOString().split('T')[0], // Sync for legacy checks
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

        const waUrl = buildWhatsAppUrl(lead.phone, msg);
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

// _deleteLead — Elimina una solicitud (lead) permanentemente.
window._deleteLead = async function(id, name) {
    if (!confirm(`¿Estás seguro de que querés eliminar la solicitud de "${name}"?`)) return;

    try {
        const { error } = await supabase
            .from('leads')
            .delete()
            .eq('id', id);

        if (error) throw error;

        showToast(`✅ Solicitud de ${name} eliminada`);
        _leadsCache.delete(id); // Limpiar caché local
        filterAndRenderLeads(); // Refrescar UI
        checkNewLeads();        // Actualizar contador del sidebar
    } catch (err) {
        console.error('[_deleteLead] error:', err);
        showToast('❌ Error al eliminar la solicitud');
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
