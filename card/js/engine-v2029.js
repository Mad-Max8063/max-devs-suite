/**
 * Suito Virtual Card - Gold & Obsidian Edition
 * Personalized for: Matías Maximiliano (Max) Bernal
 * v2.0.0 - Integrated VCard & Gallery Fix - 2026-04-21
 */

import { downloadVCard } from './vcard.js';
import { resolveAccessPriority } from '../../shared/access-resolver.js';

const CARD_DATA = {
    profile: {
        name: "Matías Maximiliano (Max) Bernal",
        title: "Suito",
        bio: "Innovando soluciones digitales con Suito",
        // Usamos SVG para el avatar por directiva
        avatar: "suito-logo-svg",
        cover: "/card/assets/cover.png",
        location: "Buenos Aires, Argentina",
        verified: true,
        isPremium: false // Si es true, oculta el branding de Suito
    },
    contact: {
        whatsapp: "5491162621406", 
        email: "hola@suito.pro",
        website: "https://suito.pro",
        instagram: "suito.pro"
    },
    services: [
        {
            id: 1,
            title: "Software & Web con IA",
            description: "Desarrollo de aplicaciones y landing pages de alto impacto utilizando inteligencia artificial para optimizar tiempos y resultados.",
            icon: "bolt",
            price: "Desde $500"
        },
        {
            id: 2,
            title: "Consultoría Estratégica",
            description: "Asesoría personalizada sobre transformación digital y cómo implementar el ecosistema Suito en tu modelo de negocio.",
            icon: "lightbulb",
            price: "Consulta"
        }
    ],
    gallery: [
        { url: "/card/assets/cover.png", title: "Suito Gold & Obsidian Project" },
        { url: "/assets/favicon.svg", title: "Brand Identity" }
    ]
};


function shareCard() {
    if (navigator.share) {
        navigator.share({
            title: CARD_DATA.profile.name,
            text: CARD_DATA.profile.bio,
            url: window.location.href
        }).catch(console.error);
    } else {
        alert("Enlace de tarjeta copiado al portapapeles");
        navigator.clipboard.writeText(window.location.href);
    }
}

export function getSubscriptionStatus(user) {
    const created_at = new Date(user.created_at || Date.now());
    const days_active = (Date.now() - created_at.getTime()) / (1000 * 3600 * 24);
    
    // Si es Premium (manual), Vitalicio, o está en sus primeros 3 días, es 'premium'
    const isPremiumActive = user.isPremium || user.is_premium || user.plan_status === 'premium' || user.subscription_status === 'premium';
    
    return (isPremiumActive || days_active <= 3) ? 'premium' : 'basic';
}

function injectTheme(data) {
    const status = getSubscriptionStatus(data);
    document.body.classList.remove('theme-gold', 'theme-luminous');
    document.body.classList.add(status === 'premium' ? 'theme-gold' : 'theme-luminous');
}

window.renderUpgradeModal = function() {
    const modal = document.createElement('div');
    modal.className = 'upgrade-modal-overlay';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.8); z-index:9999; display:flex; align-items:center; justify-content:center; padding:20px;';
    modal.innerHTML = `
        <div class="glass-card" style="background:#1E1E1E; padding:32px; border-radius:28px; max-width:400px; text-align:center; position:relative; border: 1px solid rgba(212, 175, 55, 0.2);">
            <button onclick="this.closest('.upgrade-modal-overlay').remove()" style="position:absolute; top:16px; right:16px; background:transparent; border:none; color:#fff; cursor:pointer;"><span class="material-symbols-outlined">close</span></button>
            <span class="material-symbols-outlined" style="font-size:48px; color:#D4AF37; margin-bottom:16px;">workspace_premium</span>
            <h3 style="color:#fff; font-size:24px; margin-bottom:12px; font-weight:600;">Función Premium</h3>
            <p style="color:#A0A0A0; margin-bottom:24px; line-height:1.5;">El gestor de turnos es una característica exclusiva de la edición Gold & Obsidian. Actualizá tu plan para habilitar las reservas automáticas.</p>
            <a href="https://suito.pro?action=upgrade" target="_blank" class="btn-primary" style="display:inline-block; text-decoration:none; width:100%; box-sizing:border-box; background:linear-gradient(135deg, #D4AF37 0%, #A67C00 100%); color:#fff; padding:12px 24px; border-radius:16px; font-weight:600;">Ver Planes</a>
        </div>
    `;
    document.body.appendChild(modal);
};

export function renderLanding(container, data) {
    injectTheme(data);
    container.innerHTML = buildCardHTML(data);
    attachCardEvents(container, data);
    injectDynamicManifest(data);
    wireInstallButton();
}

export function renderPreview(container, data, onBack, onSave) {
    injectTheme(data);
    container.innerHTML = buildCardHTML(data);
    attachCardEvents(container, data);
    // Add back button for preview mode
    const backBtn = document.createElement('button');
    backBtn.className = 'btn-secondary';
    backBtn.style.cssText = 'position:fixed;top:16px;left:16px;z-index:100;padding:8px 16px;border-radius:12px;';
    backBtn.innerHTML = '<span class="material-symbols-outlined">arrow_back</span> Volver';
    backBtn.onclick = onBack;
    container.prepend(backBtn);
}

function buildCardHTML(data) {
    const name = data.name || 'Sin nombre';
    const profession = data.profession || '';
    const description = data.description || '';
    const phone = data.phone || '';
    const email = data.email || '';
    const location = data.location || '';
    const photo = data.photo || data.photo_url || '';
    const coverPhoto = data.coverPhoto || data.cover_url || '';
    const facebook = data.facebook || '';
    const instagram = data.instagram || '';
    const linkedin = data.linkedin || '';
    const website = data.website || '';
    const bookingUrl = data.bookingUrl || data.booking_url || '';
    const status = getSubscriptionStatus(data);
    const isPremium = status === 'premium';
    const rawGallery = data.gallery || [];
    const gallery = isPremium ? rawGallery : rawGallery.slice(0, 2);

    return `
        ${!isPremium ? `
        <div class="trial-banner" style="background:#8B5CF6; color:#fff; text-align:center; padding:8px; font-size:14px; position:sticky; top:0; z-index:100;">
            Muestra limitada (Trial Vencido) 
            <a href="https://suito.pro?ref=expired" target="_blank" style="color:#fff; font-weight:bold; margin-left:8px;">Activar Premium</a>
        </div>
        ` : ''}
        <div class="card-container animate-fade-in${!isPremium ? ' card-degraded' : ''}">
            <!-- Cover & Avatar -->
            <div class="card-header">
                <div class="card-cover-wrapper">
                    ${coverPhoto ? `<img src="${coverPhoto}" alt="Cover" class="card-cover">` : '<div class="card-cover" style="background:linear-gradient(135deg,#8B5CF6,#EC4899);height:200px;"></div>'}
                    <div class="card-cover-overlay"></div>
                </div>
                <div class="card-avatar-container">
                    <div class="card-avatar-ring">
                        ${(photo && !photo.includes('favicon.svg')) ? `<img src="${photo}" alt="${name}" class="card-avatar">` : 
                        (isPremium ? 
                        `<svg viewBox="15 15 90 90" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%; height:100%;">
                           <defs>
                             <linearGradient id="suitoGold" x1="0%" y1="0%" x2="100%" y2="100%">
                               <stop offset="0%" stop-color="#D4AF37" />
                               <stop offset="50%" stop-color="#F9E498" />
                               <stop offset="100%" stop-color="#B8860B" />
                             </linearGradient>
                           </defs>
                           <circle cx="60" cy="60" r="45" stroke="url(#suitoGold)" stroke-width="4" />
                           <path d="M60 28V35M60 85V92M72 45C72 38 65 35 60 35C52 35 48 40 48 45C48 55 72 55 72 65C72 75 65 85 55 85C48 85 45 80 45 75" stroke="url(#suitoGold)" stroke-width="6" stroke-linecap="round" />
                         </svg>` : 
                         `<svg viewBox="15 15 90 90" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%; height:100%;">
                           <defs>
                             <linearGradient id="suitoLuminous" x1="0%" y1="0%" x2="100%" y2="100%">
                               <stop offset="0%" stop-color="#8B5CF6" />
                               <stop offset="100%" stop-color="#3B82F6" />
                             </linearGradient>
                           </defs>
                           <circle cx="60" cy="60" r="45" stroke="url(#suitoLuminous)" stroke-width="4" />
                           <path d="M60 28V35M60 85V92M72 45C72 38 65 35 60 35C52 35 48 40 48 45C48 55 72 55 72 65C72 75 65 85 55 85C48 85 45 80 45 75" stroke="url(#suitoLuminous)" stroke-width="6" stroke-linecap="round" />
                         </svg>`)
                        }
                    </div>
                </div>
            </div>

            <!-- Profile Info -->
            <div class="card-body">
                <div class="card-profile-info">
                    <h1 class="card-name">${name}</h1>
                    <p class="card-title">${profession}</p>
                    ${description ? `<p class="card-bio">${description}</p>` : ''}
                    ${location ? `
                        <a href="${location.startsWith('http') ? location : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`}" target="_blank" class="card-location" style="text-decoration:none;">
                            <span class="material-symbols-outlined" style="pointer-events:none;">location_on</span>
                            <span style="pointer-events:none; text-decoration:underline; text-underline-offset:2px;">${location.startsWith('http') ? 'Ubicación / Mapa' : location}</span>
                        </a>
                    ` : ''}
                </div>

                <!-- Quick Actions -->
                <div class="card-actions">
                    <button class="btn-primary" id="btn-save-contact" style="background: linear-gradient(135deg, #10b981, #059669);">
                        <span class="material-symbols-outlined">person_add</span>
                        Agendar
                    </button>
                    <button class="btn-secondary" onclick="navigator.share ? navigator.share({title:'${name}',url:window.location.href}).catch(()=>{}) : navigator.clipboard.writeText(window.location.href)">
                        <span class="material-symbols-outlined">share</span>
                        Compartir
                    </button>
                    <button id="install-btn" class="btn-secondary" style="display:none;">
                        <span class="material-symbols-outlined">download</span>
                        Instalar app
                    </button>
                </div>

                <!-- Contact Links -->
                ${(() => {
                    const activeModules = data.activeModules || data.active_modules || [];
                    const hasAppointments = activeModules.includes('appointments');
                    const showBooking = bookingUrl && hasAppointments;

                    return (email || instagram || facebook || linkedin || website || showBooking) ? `
                    <div class="card-section">
                        <div class="section-header">
                            <h2 class="section-title">Contacto</h2>
                        </div>
                        <div class="services-grid">
                            ${email ? `<a href="mailto:${email}" class="service-card glass-card" style="text-decoration:none;"><span class="material-symbols-outlined">mail</span><p>${email}</p></a>` : ''}
                            ${instagram ? `<a href="https://instagram.com/${instagram}" target="_blank" class="service-card glass-card" style="text-decoration:none;"><span class="material-symbols-outlined">photo_camera</span><p>@${instagram}</p></a>` : ''}
                            ${facebook ? `<a href="${facebook}" target="_blank" class="service-card glass-card" style="text-decoration:none;"><span class="material-symbols-outlined">facebook</span><p>Facebook</p></a>` : ''}
                            ${linkedin ? `<a href="${linkedin}" target="_blank" class="service-card glass-card" style="text-decoration:none;"><span class="material-symbols-outlined">work</span><p>LinkedIn</p></a>` : ''}
                            ${website ? `<a href="${website}" target="_blank" class="service-card glass-card" style="text-decoration:none;"><span class="material-symbols-outlined">language</span><p>Web</p></a>` : ''}
                            ${showBooking ? (
                                isPremium 
                                ? `<a href="${bookingUrl}" target="_blank" class="service-card glass-card" style="text-decoration:none;"><span class="material-symbols-outlined">calendar_month</span><p>Agendar Turno</p></a>`
                                : `<button onclick="window.renderUpgradeModal()" class="service-card glass-card" style="text-decoration:none; width:100%; border:none; text-align:left; cursor:pointer; background:rgba(255,255,255,0.05); color:inherit;"><span class="material-symbols-outlined">calendar_month</span><p style="display:flex; align-items:center; gap:4px; margin:0;">Agendar Turno <span class="material-symbols-outlined" style="font-size:16px; opacity:0.6;">lock</span></p></button>`
                            ) : ''}
                        </div>
                    </div>
                    ` : '';
                })()}

                <!-- Gallery -->
                ${gallery.length > 0 ? `
                <div class="card-section">
                    <div class="section-header">
                        <h2 class="section-title">Galería</h2>
                    </div>
                    <div class="masonry-gallery">
                        ${gallery.map((img, i) => `
                            <div class="gallery-item animate-fade-in" style="animation-delay: ${i * 0.1}s">
                                <img src="${img.src || img.url}" alt="${img.caption || img.title || ''}" loading="lazy">
                                ${(img.caption || img.title) ? `<div class="gallery-overlay"><span>${img.caption || img.title}</span></div>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
            </div>

            <!-- Footer -->
            <footer class="card-footer">
                <div class="footer-divider"></div>
                ${(!isPremium || data.forceWatermark) ? `
                    <div class="suito-referral" style="text-align:center; margin-bottom:16px;">
                        <p class="referral-text" style="color:var(--on-surface-variant); font-size:14px; margin-bottom:8px;">¿Querés una tarjeta como esta?</p>
                        <a href="https://suito.pro?ref=card" target="_blank" class="referral-link" style="color:var(--primary); font-weight:600; text-decoration:none;">Obtené la tuya en Suito.pro</a>
                    </div>
                ` : ''}
                <div class="footer-brand">
                    <span class="footer-brand-name">Suito</span>
                    <span class="footer-brand-tagline">Gold & Obsidian</span>
                </div>
            </footer>
        </div>
    `;
}

function attachCardEvents(container, data) {
    const saveBtn = container.querySelector('#btn-save-contact');
    if (saveBtn) {
        saveBtn.onclick = () => downloadVCard(data);
    }
}

function injectDynamicManifest(data) {
    const manifest = {
        name: data.nombre_negocio || data.name || 'Tarjeta Digital',
        short_name: (data.nombre_negocio || data.name || 'Tarjeta').slice(0, 12),
        start_url: `/card/${data.slug}`,
        scope: '/card/',
        display: 'standalone',
        background_color: '#121212',
        theme_color: data.color_primario || '#D4AF37',
        icons: [
            { src: '/card/assets/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/card/assets/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
    };
    const blob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
    const link = document.querySelector('link[rel="manifest"]');
    if (link) link.href = URL.createObjectURL(blob);
}

let _deferredInstallPrompt = null;

function wireInstallButton() {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        _deferredInstallPrompt = e;
        const btn = document.getElementById('install-btn');
        if (btn) btn.style.display = '';
    });

    // In case the PWA is already installed
    window.addEventListener('appinstalled', () => {
        const btn = document.getElementById('install-btn');
        if (btn) btn.style.display = 'none';
        _deferredInstallPrompt = null;
    });

    document.addEventListener('click', (e) => {
        if (e.target.closest('#install-btn') && _deferredInstallPrompt) {
            _deferredInstallPrompt.prompt();
            _deferredInstallPrompt.userChoice.then(() => {
                _deferredInstallPrompt = null;
                const btn = document.getElementById('install-btn');
                if (btn) btn.style.display = 'none';
            });
        }
    });
}
