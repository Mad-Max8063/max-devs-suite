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
        { url: "/assets/suito-logo.png", title: "Brand Identity" }
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

const BRAND_STYLE_ID = 'suito-dynamic-brand-styles';
const FONT_PREFIX = 'suito-font-';
const DEFAULT_FONT = 'Inter';
const ALLOWED_THEMES = new Set(['obsidian', 'luminous', 'emerald', 'rose']);

function normalizeHexColor(value, fallback) {
    const color = String(value || '').trim();
    return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color) ? color : fallback;
}

function hexToRgbString(hex) {
    const normalized = normalizeHexColor(hex, '#7c3aed').replace('#', '');
    const fullHex = normalized.length === 3
        ? normalized.split('').map(char => char + char).join('')
        : normalized;
    const num = parseInt(fullHex, 16);
    return `${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}`;
}

function darkenHex(hex, amount = 0.15) {
    const normalized = normalizeHexColor(hex, '#7c3aed').replace('#', '');
    const fullHex = normalized.length === 3
        ? normalized.split('').map(char => char + char).join('')
        : normalized;
    const num = parseInt(fullHex, 16);
    const factor = Math.max(0, Math.min(1, 1 - amount));
    const r = Math.floor(((num >> 16) & 255) * factor);
    const g = Math.floor(((num >> 8) & 255) * factor);
    const b = Math.floor((num & 255) * factor);
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function normalizeFontFamily(value) {
    const font = String(value || '').trim();
    if (!font || font.length > 48) return DEFAULT_FONT;
    return /^[a-z0-9][a-z0-9\s-]*$/i.test(font) ? font : DEFAULT_FONT;
}

function sanitizeStyleId(value) {
    return String(value).replace(/[^a-z0-9_-]/gi, '').toLowerCase();
}

function sanitizePremiumCss(value) {
    return String(value || '')
        .replace(/<\/?style[^>]*>/gi, '')
        .replace(/@import[^;]+;/gi, '')
        .replace(/javascript:/gi, '');
}

function upsertMeta(name, content) {
    let tag = document.querySelector(`meta[name="${name}"]`);
    if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('name', name);
        document.head.appendChild(tag);
    }
    tag.setAttribute('content', content);
}

export function applyPremiumBranding(dbData = {}) {
    const head = document.head;
    const isPremium = getSubscriptionStatus(dbData) === 'premium';
    const primaryColor = normalizeHexColor(
        dbData.primary_color || dbData.color_primario,
        '#7c3aed'
    );
    const primaryDark = darkenHex(primaryColor);
    const primaryRgb = hexToRgbString(primaryColor);
    const fontFamily = isPremium ? normalizeFontFamily(dbData.font_family) : DEFAULT_FONT;
    const isOfficialColors = isPremium && dbData.social_color === 'official';
    const socialColor = isOfficialColors
        ? primaryColor
        : (isPremium ? normalizeHexColor(dbData.social_color, primaryColor) : primaryColor);
    const theme = isPremium && ALLOWED_THEMES.has(dbData.card_theme)
        ? dbData.card_theme
        : (isPremium ? 'obsidian' : 'luminous');
    const customCss = isPremium ? sanitizePremiumCss(dbData.custom_css) : '';

    if (fontFamily !== DEFAULT_FONT) {
        const fontId = `${FONT_PREFIX}${sanitizeStyleId(fontFamily)}`;
        if (!document.getElementById(fontId)) {
            if (!document.querySelector('link[href="https://fonts.googleapis.com"]')) {
                const preconnectGoogle = document.createElement('link');
                preconnectGoogle.rel = 'preconnect';
                preconnectGoogle.href = 'https://fonts.googleapis.com';
                head.appendChild(preconnectGoogle);
            }

            if (!document.querySelector('link[href="https://fonts.gstatic.com"]')) {
                const preconnectStatic = document.createElement('link');
                preconnectStatic.rel = 'preconnect';
                preconnectStatic.href = 'https://fonts.gstatic.com';
                preconnectStatic.crossOrigin = 'anonymous';
                head.appendChild(preconnectStatic);
            }

            const fontLink = document.createElement('link');
            fontLink.id = fontId;
            fontLink.rel = 'stylesheet';
            fontLink.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily).replace(/%20/g, '+')}:wght@300;400;600;700;800&display=swap`;
            head.appendChild(fontLink);
        }
    }

    const styleEl = document.createElement('style');
    styleEl.id = BRAND_STYLE_ID;
    styleEl.textContent = `
        :root {
            --color-primary: ${primaryColor};
            --color-primary-dark: ${primaryDark};
            --color-primary-rgb: ${primaryRgb};
            --brand-primary: ${primaryColor};
            --brand-social: ${socialColor};
            --brand-font: '${fontFamily}', sans-serif;
            --primary: ${primaryColor};
            --primary-container: ${primaryDark};
            --theme-gradient: linear-gradient(135deg, ${primaryColor} 0%, ${primaryDark} 100%);
        }

        body,
        .suito-container,
        .card-container {
            font-family: var(--brand-font) !important;
        }

        .btn-primary,
        .suito-btn-primary,
        .cp-switch input:checked + .cp-slider {
            background: var(--brand-primary) !important;
        }

        .card-title,
        .section-title,
        .footer-brand-name,
        .card-location,
        .referral-link {
            color: var(--brand-primary) !important;
        }

        ${isOfficialColors ? `
        .social-icons-bar .social-icon[aria-label="WhatsApp"] { background: #25D366 !important; }
        .social-icons-bar .social-icon[aria-label="Instagram"] { background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%) !important; }
        .social-icons-bar .social-icon[aria-label="Facebook"] { background: #1877F2 !important; }
        .social-icons-bar .social-icon[aria-label="LinkedIn"] { background: #0A66C2 !important; }
        .social-icons-bar .social-icon[aria-label="TikTok"] { background: #000000 !important; }
        .social-icons-bar .social-icon[aria-label="YouTube"] { background: #FF0000 !important; }
        .social-icons-bar .social-icon[aria-label="Email"] { background: #EA4335 !important; }
        ` : `
        .social-icons-bar .social-icon {
            background: var(--brand-social) !important;
        }
        `}

        .social-icon svg,
        .suito-btn-icon svg {
            fill: #fff;
        }

        @keyframes suito-pulse {
            0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(37, 211, 102, 0.4); }
            70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(37, 211, 102, 0); }
            100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(37, 211, 102, 0); }
        }

        @keyframes suito-glow-breath {
            0%, 100% { text-shadow: 0 0 5px var(--brand-primary), 0 0 10px rgba(255,255,255,0.2); transform: scale(1); }
            50% { text-shadow: 0 0 15px var(--brand-primary), 0 0 20px var(--brand-primary); transform: scale(1.02); }
        }

        .social-icons-bar .social-icon[aria-label="WhatsApp"] {
            animation: suito-pulse 3s infinite ease-in-out;
            will-change: transform, box-shadow;
        }

        .referral-link {
            display: inline-block;
            animation: suito-glow-breath 4s infinite ease-in-out;
            will-change: transform, text-shadow;
        }

        body[data-theme="luminous"] .card-container {
            background: linear-gradient(180deg, rgba(255,255,255,0.96), rgba(246,248,255,0.98));
        }

        body[data-theme="emerald"] {
            --secondary: #10B981;
            --tertiary: #14B8A6;
        }

        body[data-theme="rose"] {
            --secondary: #F43F5E;
            --tertiary: #EC4899;
        }

        ${customCss ? `\n/* Premium Custom CSS */\n${customCss}` : ''}
    `;

    const existingStyle = document.getElementById(BRAND_STYLE_ID);
    if (existingStyle) {
        head.replaceChild(styleEl, existingStyle);
    } else {
        head.appendChild(styleEl);
    }

    document.body.setAttribute('data-theme', theme);
    document.documentElement.style.setProperty('--color-primary', primaryColor);
    document.documentElement.style.setProperty('--color-primary-dark', primaryDark);
    document.documentElement.style.setProperty('--color-primary-rgb', primaryRgb);
    upsertMeta('theme-color', primaryColor);
}

let activeGalleryInstance = null;
let lightboxKeydownBound = false;

class SuitoGallery {
    constructor(galleryData) {
        this.photos = (galleryData || [])
            .map((photo, index) => ({
                src: photo.src || photo.url || photo.image_url || '',
                caption: photo.caption || photo.title || `Trabajo ${index + 1}`,
            }))
            .filter(photo => photo.src);
        this.currentIndex = 0;
        this.touchStartX = 0;
        this.touchEndX = 0;

        if (this.photos.length > 0) {
            this.initLightboxDOM();
        }
    }

    renderGallerySection(containerElement) {
        if (!containerElement || this.photos.length === 0) return;
        containerElement.innerHTML = '';

        const wrapper = document.createElement('div');
        wrapper.className = 'suito-gallery-wrapper';

        const revealBtn = document.createElement('button');
        revealBtn.type = 'button';
        revealBtn.className = 'suito-gallery-reveal-btn';
        revealBtn.setAttribute('aria-expanded', 'false');
        revealBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                <circle cx="12" cy="13" r="4"></circle>
            </svg>
            <span>Ver galeria de trabajos (${this.photos.length} fotos)</span>
        `;

        const grid = document.createElement('div');
        grid.className = 'suito-gallery-grid suito-hidden';

        this.photos.forEach((photo, index) => {
            const item = document.createElement('button');
            item.type = 'button';
            item.className = 'suito-gallery-item';
            item.setAttribute('aria-label', photo.caption || `Trabajo ${index + 1}`);

            const imgWrap = document.createElement('div');
            imgWrap.className = 'suito-gallery-item-img-wrap';

            const img = document.createElement('img');
            img.src = photo.src;
            img.loading = 'lazy';
            img.alt = photo.caption || `Trabajo ${index + 1}`;
            imgWrap.appendChild(img);
            item.appendChild(imgWrap);

            if (photo.caption) {
                const caption = document.createElement('span');
                caption.className = 'suito-gallery-item-caption';
                caption.textContent = photo.caption;
                item.appendChild(caption);
            }

            item.addEventListener('click', () => this.openLightbox(index));
            grid.appendChild(item);
        });

        revealBtn.addEventListener('click', () => {
            revealBtn.classList.add('suito-fade-out');
            revealBtn.setAttribute('aria-expanded', 'true');
            setTimeout(() => {
                revealBtn.hidden = true;
                grid.classList.remove('suito-hidden');
                grid.classList.add('suito-expanded');
            }, 240);
        });

        wrapper.appendChild(revealBtn);
        wrapper.appendChild(grid);
        containerElement.appendChild(wrapper);
    }

    initLightboxDOM() {
        if (document.getElementById('suito-lightbox')) return;

        const lightbox = document.createElement('div');
        lightbox.id = 'suito-lightbox';
        lightbox.className = 'suito-lightbox suito-hidden';
        lightbox.setAttribute('role', 'dialog');
        lightbox.setAttribute('aria-modal', 'true');
        lightbox.innerHTML = `
            <button type="button" class="suito-lb-close" aria-label="Cerrar">&times;</button>
            <button type="button" class="suito-lb-prev" aria-label="Foto anterior">&#10094;</button>
            <div class="suito-lb-content">
                <img class="suito-lb-img" src="" alt="">
                <div class="suito-lb-caption"></div>
            </div>
            <button type="button" class="suito-lb-next" aria-label="Foto siguiente">&#10095;</button>
        `;

        document.body.appendChild(lightbox);
        this.bindLightboxEvents(lightbox);
    }

    bindLightboxEvents(lightbox) {
        if (lightbox.dataset.bound === 'true') return;
        lightbox.dataset.bound = 'true';

        const closeBtn = lightbox.querySelector('.suito-lb-close');
        const prevBtn = lightbox.querySelector('.suito-lb-prev');
        const nextBtn = lightbox.querySelector('.suito-lb-next');
        const imgElement = lightbox.querySelector('.suito-lb-img');

        closeBtn.addEventListener('click', () => activeGalleryInstance?.closeLightbox());
        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            activeGalleryInstance?.navigate(-1);
        });
        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            activeGalleryInstance?.navigate(1);
        });

        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) activeGalleryInstance?.closeLightbox();
        });

        imgElement.addEventListener('touchstart', e => {
            if (!activeGalleryInstance) return;
            activeGalleryInstance.touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        imgElement.addEventListener('touchend', e => {
            if (!activeGalleryInstance) return;
            activeGalleryInstance.touchEndX = e.changedTouches[0].screenX;
            activeGalleryInstance.handleSwipe();
        }, { passive: true });

        if (!lightboxKeydownBound) {
            lightboxKeydownBound = true;
            document.addEventListener('keydown', (e) => {
                const currentLightbox = document.getElementById('suito-lightbox');
                if (!activeGalleryInstance || currentLightbox?.classList.contains('suito-hidden')) return;
                if (e.key === 'Escape') activeGalleryInstance.closeLightbox();
                if (e.key === 'ArrowLeft') activeGalleryInstance.navigate(-1);
                if (e.key === 'ArrowRight') activeGalleryInstance.navigate(1);
            });
        }
    }

    openLightbox(index) {
        activeGalleryInstance = this;
        this.currentIndex = index;
        this.updateLightboxContent();
        const lightbox = document.getElementById('suito-lightbox');
        lightbox?.classList.remove('suito-hidden');
        document.body.style.overflow = 'hidden';
        lightbox?.querySelector('.suito-lb-close')?.focus();
    }

    closeLightbox() {
        const lightbox = document.getElementById('suito-lightbox');
        lightbox?.classList.add('suito-hidden');
        document.body.style.overflow = '';
    }

    navigate(direction) {
        this.currentIndex += direction;
        if (this.currentIndex < 0) this.currentIndex = this.photos.length - 1;
        if (this.currentIndex >= this.photos.length) this.currentIndex = 0;
        this.updateLightboxContent();
    }

    handleSwipe() {
        const threshold = 50;
        if (this.touchEndX < this.touchStartX - threshold) this.navigate(1);
        if (this.touchEndX > this.touchStartX + threshold) this.navigate(-1);
    }

    updateLightboxContent() {
        const lightbox = document.getElementById('suito-lightbox');
        if (!lightbox) return;

        const imgElement = lightbox.querySelector('.suito-lb-img');
        const captionElement = lightbox.querySelector('.suito-lb-caption');
        const photo = this.photos[this.currentIndex];
        imgElement.src = photo.src;
        imgElement.alt = photo.caption || `Trabajo ${this.currentIndex + 1}`;
        captionElement.textContent = photo.caption || `${this.currentIndex + 1} / ${this.photos.length}`;
    }
}

window.renderUpgradeModal = function() {
    const modal = document.createElement('div');
    modal.className = 'upgrade-modal-overlay';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.8); z-index:9999; display:flex; align-items:center; justify-content:center; padding:20px;';
    modal.innerHTML = `
        <div class="glass-card" style="background:#1E1E1E; padding:32px; border-radius:28px; max-width:400px; text-align:center; position:relative; border: 1px solid rgba(var(--color-primary-rgb), 0.2);">
            <button onclick="this.closest('.upgrade-modal-overlay').remove()" style="position:absolute; top:16px; right:16px; background:transparent; border:none; color:#fff; cursor:pointer;"><span class="material-symbols-outlined">close</span></button>
            <span class="material-symbols-outlined" style="font-size:48px; color:var(--color-primary); margin-bottom:16px;">workspace_premium</span>
            <h3 style="color:#fff; font-size:24px; margin-bottom:12px; font-weight:600;">Función Premium</h3>
            <p style="color:#A0A0A0; margin-bottom:24px; line-height:1.5;">El gestor de turnos es una característica exclusiva de la edición Gold & Obsidian. Actualizá tu plan para habilitar las reservas automáticas.</p>
            <a href="https://suito.pro?action=upgrade" target="_blank" class="btn-primary" style="display:inline-block; text-decoration:none; width:100%; box-sizing:border-box; background:var(--theme-gradient); color:#fff; padding:12px 24px; border-radius:16px; font-weight:600;">Ver Planes</a>
        </div>
    `;
    document.body.appendChild(modal);
};

export function renderLanding(container, data) {
    injectTheme(data);
    applyPremiumBranding(data);
    container.innerHTML = buildCardHTML(data);
    attachCardEvents(container, data);
    injectDynamicManifest(data);
    wireInstallButton();
}

export function renderPreview(container, data, onBack, onSave) {
    injectTheme(data);
    applyPremiumBranding(data);
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
    const whatsappMessage = data.whatsapp_message || data.whatsappMessage || '';
    const rawGallery = data.gallery || [];
    const gallery = isPremium ? rawGallery : rawGallery.slice(0, 3);

    return `
        ${!isPremium ? `
        <div class="trial-banner" style="background:var(--color-primary); color:#fff; text-align:center; padding:8px; font-size:14px; position:sticky; top:0; z-index:100;">
            Muestra limitada (Trial Vencido) 
            <a href="https://suito.pro?ref=expired" target="_blank" style="color:#fff; font-weight:bold; margin-left:8px;">Activar Premium</a>
        </div>
        ` : ''}
        <div class="card-container animate-fade-in${!isPremium ? ' card-degraded' : ''}">
            <!-- Cover & Avatar -->
            <div class="card-header">
                <div class="card-cover-wrapper">
                    ${coverPhoto ? `<img src="${coverPhoto}" alt="Cover" class="card-cover">` : '<div class="card-cover" style="background:var(--theme-gradient);height:200px;"></div>'}
                    <div class="card-cover-overlay"></div>
                </div>
                <div class="card-avatar-container">
                    <div class="card-avatar-ring">
                        <img src="${photo || '/assets/suito-symbol.png'}" alt="${name}" class="card-avatar">
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
                    <div class="suito-gallery-mount"></div>
                </div>
                ` : ''}

                <!-- Social Icons -->
                ${(() => {
                    const activeModules = data.activeModules || data.active_modules || [];
                    const hasAppointments = activeModules.includes('appointments');
                    const showBooking = bookingUrl && hasAppointments && isPremium;
                    const rawPhone = (data.telefono || data.phone || '').replace(/\D/g, '');
                    const phoneWith54 = rawPhone.startsWith('54') ? rawPhone : `54${rawPhone}`;
                    const phone = phoneWith54.startsWith('549') ? phoneWith54 : phoneWith54.replace(/^54/, '549');

                    const icons = [];
                    if (phone) {
                        const defaultMsg = "Hola! Vi tu tarjeta y me gustaría hacer una consulta.";
                        const msg = whatsappMessage || defaultMsg;
                        icons.push(`<a href="https://wa.me/${phone}?text=${encodeURIComponent(msg)}" target="_blank" class="social-icon" style="background:#25D366;" aria-label="WhatsApp"><svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z\"/></svg></a>`);
                    }
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

    const status = getSubscriptionStatus(data);
    const rawGallery = data.gallery || [];
    const galleryData = status === 'premium' ? rawGallery : rawGallery.slice(0, 3);
    const galleryRoot = container.querySelector('.suito-gallery-mount');
    if (galleryRoot) {
        new SuitoGallery(galleryData).renderGallerySection(galleryRoot);
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
        theme_color: data.primary_color || data.color_primario || '#7c3aed',
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
