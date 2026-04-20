/**
 * Suito Virtual Card - Luminous Curator Edition
 * Personalized for: Matías Maximiliano (Max) Bernal
 * v1.0.5 - Integrated VCard & Gallery Fix - 2026-04-13
 */

import { downloadVCard } from './vcard.js';
import { resolveAccessPriority } from '../../shared/access-resolver.js';

const CARD_DATA = {
    profile: {
        name: "Matías Maximiliano (Max) Bernal",
        title: "Suito",
        bio: "Innovando soluciones digitales con Suito",
        // Usamos los assets locales de /assets
        avatar: "/card/assets/suito-logo.png",
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
        { url: "/card/assets/cover.png", title: "Suito Luminous Project" },
        { url: "/card/assets/suito-logo.png", title: "Brand Identity" }
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

// ——— Exported API for app.js dynamic import ———

export function renderLanding(container, data) {
    container.innerHTML = buildCardHTML(data);
    attachCardEvents(container, data);
    injectDynamicManifest(data);
    wireInstallButton();
}

export function renderPreview(container, data, onBack, onSave) {
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
    const isPremium = data.isPremium || false;
    const hasAccess = resolveAccessPriority(data);
    const rawGallery = data.gallery || [];
    const gallery = hasAccess ? rawGallery : rawGallery.slice(0, 2);

    return `
        ${!hasAccess ? `
        <div class="trial-banner">
            Muestra limitada (Trial Vencido) 
            <a href="https://suito.pro?ref=expired" target="_blank">Activar Premium</a>
        </div>
        ` : ''}
        <div class="card-container animate-fade-in${!hasAccess ? ' card-degraded' : ''}">
            <!-- Cover & Avatar -->
            <div class="card-header">
                <div class="card-cover-wrapper">
                    ${coverPhoto ? `<img src="${coverPhoto}" alt="Cover" class="card-cover">` : '<div class="card-cover" style="background:linear-gradient(135deg,#8B5CF6,#EC4899);height:200px;"></div>'}
                    <div class="card-cover-overlay"></div>
                </div>
                <div class="card-avatar-container">
                    <div class="card-avatar-ring">
                        ${photo ? `<img src="${photo}" alt="${name}" class="card-avatar">` : `<div class="card-avatar" style="display:flex;align-items:center;justify-content:center;font-size:2rem;background:#f3e8ff;">${name.charAt(0)}</div>`}
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
                            ${showBooking ? `<a href="${bookingUrl}" target="_blank" class="service-card glass-card" style="text-decoration:none;"><span class="material-symbols-outlined">calendar_month</span><p>Agendar Turno</p></a>` : ''}
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
                ${(!hasAccess || data.forceWatermark) ? `
                    <div class="suito-referral">
                        <p class="referral-text">¿Querés una tarjeta como esta?</p>
                        <a href="https://suito.pro?ref=card" target="_blank" class="referral-link">Obtené la tuya en Suito.pro</a>
                    </div>
                ` : ''}
                <div class="footer-brand">
                    <span class="footer-brand-name">Suito</span>
                    <span class="footer-brand-tagline">Luminous</span>
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
        background_color: '#fff3fe',
        theme_color: data.color_primario || '#8200e8',
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
