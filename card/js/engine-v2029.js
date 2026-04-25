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

                <!-- Social Icons -->
                ${(() => {
                    const activeModules = data.activeModules || data.active_modules || [];
                    const hasAppointments = activeModules.includes('appointments');
                    const showBooking = bookingUrl && hasAppointments && isPremium;
                    const phone = (data.telefono || '').replace(/\D/g, '');

                    const icons = [];
                    if (phone) icons.push(`<a href="https://wa.me/${phone}" target="_blank" class="social-icon" style="background:#25D366;" aria-label="WhatsApp"><svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg></a>`);
                    if (email) icons.push(`<a href="mailto:${email}" class="social-icon" style="background:#EA4335;" aria-label="Email"><svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg></a>`);
                    if (instagram) icons.push(`<a href="https://instagram.com/${instagram.replace('@','')}" target="_blank" class="social-icon" style="background:#E4405F;" aria-label="Instagram"><svg viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg></a>`);
                    if (facebook) icons.push(`<a href="${facebook}" target="_blank" class="social-icon" style="background:#1877F2;" aria-label="Facebook"><svg viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></a>`);
                    if (linkedin) icons.push(`<a href="${linkedin}" target="_blank" class="social-icon" style="background:#0A66C2;" aria-label="LinkedIn"><svg viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg></a>`);
                    if (website) icons.push(`<a href="${website.startsWith('http') ? website : 'https://' + website}" target="_blank" class="social-icon" style="background:var(--primary);" aria-label="Website"><svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg></a>`);
                    if (showBooking) icons.push(`<a href="${bookingUrl}" target="_blank" class="social-icon" style="background:var(--primary);" aria-label="Agendar turno"><svg viewBox="0 0 24 24"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z"/></svg></a>`);

                    return icons.length > 0 ? `<div class="social-icons-bar">${icons.join('')}</div>` : '';
                })()}
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
