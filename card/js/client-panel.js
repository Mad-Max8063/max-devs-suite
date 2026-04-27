// ============================================
// client-panel.js — Panel de edición para clientes premium
// Acceso: /edit/{cardId}?token={editToken}
// Permite editar: perfil básico + galería + compartir
// ============================================
import '../css/styles.css';


import { sanitize, getCardUrl, resizeImage, resizeBanner, resizeGalleryImage, dataUriToFile } from './utils.js';
import {
    uploadImage,
    addGalleryImageSecure,
    deleteGalleryImageSecure,
    updateGalleryCaptionSecure,
    updateBusinessProfileSecure,
    updateActiveModulesSecure,
} from './supabase-v2029.js';
import { injectSubscriptionBanner } from '../../shared/SubscriptionBanner.js';

const STYLE_PRESETS = [
    { key: 'caps',   label: 'Nombre en Mayúsculas', icon: 'fa-solid fa-font',               css: '.card-name { text-transform: uppercase !important; letter-spacing: 1px; }' },
    { key: 'square', label: 'Iconos Cuadrados',     icon: 'fa-solid fa-square',              css: '.social-icon { border-radius: 12px !important; }' },
    { key: 'border', label: 'Foto con Borde',       icon: 'fa-solid fa-circle-user',         css: '.card-avatar-ring { border: 3px solid var(--brand-primary) !important; padding: 4px; }' },
    { key: 'glass',  label: 'Efecto Cristal',       icon: 'fa-solid fa-wand-magic-sparkles', css: '.card-body { backdrop-filter: blur(20px) !important; background: rgba(255,255,255,0.05) !important; }' },
    { key: 'shadow', label: 'Botones con Brillo',   icon: 'fa-solid fa-bolt',                css: '.btn-primary { box-shadow: 0 10px 20px -5px var(--brand-primary) !important; }' },
];
const FREE_GALLERY_LIMIT = 3;
const PREMIUM_GALLERY_LIMIT = 12;
const ACCENT_MARKERS = {
    start: '/* suito:accent-color:start */',
    end: '/* suito:accent-color:end */',
};

function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizePresetCss(value) {
    return String(value || '')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\s*([{}:;,])\s*/g, '$1')
        .replace(/\s+/g, ' ')
        .trim();
}

function getPresetMarkers(key) {
    return {
        start: `/* suito:quick-style:${key}:start */`,
        end: `/* suito:quick-style:${key}:end */`,
    };
}

function getPresetBlock(preset) {
    const markers = getPresetMarkers(preset.key);
    return `${markers.start}\n${preset.css}\n${markers.end}`;
}

function getMarkedPresetRegex(key) {
    const markers = getPresetMarkers(key);
    return new RegExp(`\\s*${escapeRegExp(markers.start)}[\\s\\S]*?${escapeRegExp(markers.end)}\\s*`, 'g');
}

function hasPresetCSS(text, preset) {
    if (!text || !preset) return false;
    if (getMarkedPresetRegex(preset.key).test(text)) return true;
    return normalizePresetCss(text).includes(normalizePresetCss(preset.css));
}

function removePresetCSS(text, preset) {
    const withoutMarkedBlock = String(text || '').replace(getMarkedPresetRegex(preset.key), '\n');
    const normalizedPreset = normalizePresetCss(preset.css);
    const parts = withoutMarkedBlock.split(/(?<=})\s*/);
    const withoutLegacySnippet = parts
        .filter(part => normalizePresetCss(part) !== normalizedPreset)
        .join('\n');

    return withoutLegacySnippet.trim().replace(/\n{3,}/g, '\n\n');
}

function getAccentBlock(color) {
    return `${ACCENT_MARKERS.start}
:root { --suito-accent-color: ${color}; }
.card-title,
.section-title,
.footer-brand-name,
.card-location,
.referral-link {
    color: var(--suito-accent-color) !important;
}
.btn-secondary {
    color: var(--suito-accent-color) !important;
    border-color: color-mix(in srgb, var(--suito-accent-color) 42%, transparent) !important;
}
#btn-save-contact {
    background: var(--suito-accent-color) !important;
    color: #fff !important;
    box-shadow: 0 12px 28px color-mix(in srgb, var(--suito-accent-color) 35%, transparent) !important;
}
.referral-link {
    text-shadow: 0 0 10px color-mix(in srgb, var(--suito-accent-color) 65%, transparent) !important;
}
${ACCENT_MARKERS.end}`;
}

function getAccentRegex() {
    return new RegExp(`\\s*${escapeRegExp(ACCENT_MARKERS.start)}[\\s\\S]*?${escapeRegExp(ACCENT_MARKERS.end)}\\s*`, 'g');
}

function getAccentColorFromCss(text) {
    const match = String(text || '').match(/--suito-accent-color:\s*(#[0-9a-f]{3}(?:[0-9a-f]{3})?)\s*;/i);
    return match ? sanitizeColor(match[1]) : '';
}

function setAccentColorCss(text, color) {
    const cleaned = String(text || '').replace(getAccentRegex(), '\n').trim();
    const block = getAccentBlock(sanitizeColor(color));
    return cleaned ? `${cleaned}\n\n${block}` : block;
}

export function renderClientPanel(container, card) {
    const data = {
        _id:        card.id,
        _token:     card.edit_token || '',
        _slug:      card.slug || card._id,
        name:       card.name || '',
        profession: card.profession || '',
        description: card.description || '',
        phone:      card.phone || '',
        email:      card.email || '',
        location:   card.location || '',
        instagram:  card.instagram || '',
        facebook:   card.facebook || '',
        linkedin:   card.linkedin || '',
        website:    card.website || '',
        bookingUrl: card.bookingUrl || card.booking_url || '',
        photo:      card.photo || card.photo_url || '',
        coverPhoto: card.coverPhoto || card.cover_url || '',
        activeModules: card.activeModules || card.active_modules || ['card'],
        isPremium: card.isPremium || card.is_premium || false,
        whatsappMessage: card.whatsapp_message || '',
        fontFamily: card.font_family || 'Inter',
        socialColor: card.social_color || card.primary_color || card.color_primario || '#8B5CF6',
        cardTheme: card.card_theme || 'obsidian',
        customCss: card.custom_css || '',
        accentColor: getAccentColorFromCss(card.custom_css) || card.primary_color || card.color_primario || '#8B5CF6',
        gallery: (card.gallery_images || card.gallery || []).map(img => ({
            id:      img.id,
            src:     img.image_url || img.src || '',
            caption: img.caption || '',
        })),
    };

    container.innerHTML = buildPanelHTML(data);
    wirePanelEvents(container, data);
    enforcePremiumDesignLock(data.isPremium, container.querySelector('#cp-design-section'));

    // Inject Subscription Banner at the top
    const bannerContainer = container.querySelector('#subscription-banner-root');
    if (bannerContainer) {
        injectSubscriptionBanner('subscription-banner-root', card);
    }
}

// ——— HTML ———

function buildPanelHTML(data) {
    return `
    <div class="card-container animate-fade-in" style="padding: 16px; min-height: 100dvh; background: transparent;">

      <!-- Subscription Banner -->
      <div id="subscription-banner-root" style="margin-bottom: 20px;"></div>

      <!-- Header Premium -->
      <div style="text-align: center; margin-bottom: 20px; padding: 28px 16px 20px; background: var(--premium-gradient); border-radius: 28px; position: relative; overflow: hidden;">
        <div style="position: absolute; inset: 0; background: radial-gradient(circle at 30% 20%, rgba(255,255,255,0.15), transparent 50%), radial-gradient(circle at 70% 80%, rgba(255,255,255,0.1), transparent 50%);"></div>
        <div style="position: relative; z-index: 1;">
          <div style="display: inline-flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.15); backdrop-filter: blur(8px); padding: 6px 16px; border-radius: 20px; font-size: 10px; font-weight: 800; color: rgba(255,255,255,0.9); letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 12px; border: 1px solid rgba(255,255,255,0.2);">
            <span style="font-size: 14px;">✨</span> SUITO EDITOR
          </div>
          <h1 style="color: #fff; font-size: 1.5rem; font-weight: 800; letter-spacing: -0.5px; margin: 0 0 6px; text-shadow: 0 2px 12px rgba(0,0,0,0.15);">Tu Panel de Control</h1>
          <p style="color: rgba(255,255,255,0.75); font-size: 13px; font-weight: 500; margin: 0;">Personalizá tu presencia digital</p>
        </div>
      </div>

      <!-- Install App Banner (PWA) -->
      <div id="pwa-install-banner" style="display:none; background: rgba(255,255,255,0.75); backdrop-filter: blur(16px); border: 1px solid rgba(139,92,246,0.15); border-radius: 20px; padding: 14px 16px; margin-bottom: 16px; align-items: center; gap: 12px; box-shadow: 0 4px 20px rgba(139,92,246,0.08);">
        <div style="width: 40px; height: 40px; background: var(--premium-gradient); border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 4px 12px rgba(139,92,246,0.2);">
          <span style="color: #fff; font-size: 18px;">📲</span>
        </div>
        <div style="flex: 1; min-width: 0;">
          <p style="font-weight: 800; font-size: 12px; color: var(--on-surface); margin: 0 0 2px;">Guardá tu panel como App</p>
          <p style="font-size: 10px; color: var(--on-surface-variant); margin: 0; line-height: 1.4; opacity: 0.6;">Accedé con un toque desde tu celular.</p>
        </div>
        <button id="btn-pwa-install" style="background: var(--premium-gradient); color: white; border: none; border-radius: 12px; padding: 10px 16px; font-size: 11px; font-weight: 800; cursor: pointer; flex-shrink: 0; white-space: nowrap; box-shadow: 0 4px 12px rgba(139,92,246,0.25); transition: all 0.25s;">
          Instalar
        </button>
      </div>

      <!-- Tabs -->
      <div class="cp-tabs" id="cp-tabs">
        <button class="cp-tab active" data-tab="profile">
            <span class="material-symbols-outlined" style="font-size:18px;">account_circle</span> Perfil
        </button>
        <button class="cp-tab" data-tab="gallery">
            <span class="material-symbols-outlined" style="font-size:18px;">photo_library</span> Galería
        </button>
        <button class="cp-tab" data-tab="design">
            <span class="material-symbols-outlined" style="font-size:18px;">palette</span> Diseño
        </button>
        <button class="cp-tab" data-tab="share">
            <span class="material-symbols-outlined" style="font-size:18px;">share</span> Compartir
        </button>
      </div>

      <!-- ═══ TAB: PERFIL ═══ -->
      <div class="cp-panel active" id="tab-profile">
        
        <!-- Live Preview Header -->
        <div class="glass-card" style="padding: 0; overflow: hidden; margin-bottom: 24px; border-radius: 28px; box-shadow: var(--premium-shadow);">
            <div class="card-header" style="margin-bottom: 40px; border-radius: 28px 28px 0 0;">
                <div class="card-cover-wrapper" style="height: 180px; background: var(--premium-gradient);">
                    <!-- Cover Image -->
                    ${data.coverPhoto ? `<img id="cp-cover-preview" src="${sanitize(data.coverPhoto)}" alt="Portada" class="card-cover">` : `<div id="cp-cover-preview" class="card-cover"></div>`}
                    <div class="card-cover-overlay"></div>
                    <!-- Cover Edit Button -->
                    <label style="position: absolute; top: 16px; right: 16px; background: rgba(255,255,255,0.9); backdrop-filter: blur(8px); padding: 8px 16px; border-radius: 14px; font-size: 11px; font-weight: 800; cursor: pointer; color: var(--primary); display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); transition: all 0.2s;">
                        <span class="material-symbols-outlined" style="font-size:16px;">edit</span> Portada
                        <input type="file" id="cp-cover-file" accept="image/*" style="display:none">
                    </label>
                </div>
                <!-- Avatar Edit Button -->
                <div class="card-avatar-container" style="bottom: -50px;">
                    <label style="cursor: pointer; display: block; position: relative; transition: transform 0.2s;">
                        <div class="card-avatar-ring" style="width: 110px; height: 110px; border: 5px solid #fff; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
                            <img id="cp-avatar-preview" src="${sanitize(data.photo) || '/assets/suito-symbol.png'}" class="card-avatar">
                        </div>
                        <div style="position: absolute; bottom: 8px; right: 8px; background: var(--primary); color: white; width: 34px; height: 34px; border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 6px 15px rgba(139, 92, 246, 0.4); border: 3px solid #fff;">
                            <span class="material-symbols-outlined" style="font-size: 18px; font-weight: bold;">photo_camera</span>
                        </div>
                        <input type="file" id="cp-avatar-file" accept="image/*" style="display:none">
                    </label>
                </div>
            </div>
            <div style="text-align: center; padding: 10px 0 20px;">
                <span class="section-badge" style="background: var(--surface-2); padding: 6px 16px; font-size: 10px; border-radius: 12px; font-weight: 800;">VISTA PREVIA REAL</span>
            </div>
        </div>

        <div class="glass-card" style="margin-top:12px;">
          <div class="form-section">
            <div class="section-header" style="margin-bottom: 12px;">
                <h2 class="section-title">Información Básica</h2>
            </div>
            <div class="cp-fields">
              <label class="cp-label">Nombre / Negocio ${data.isPremium ? ' <span style="color:var(--accent-purple);font-size:10px;"><i class="fa-solid fa-lock"></i> Premium</span>' : ''}</label>
              <input class="cp-input" id="cp-name" type="text" value="${sanitize(data.name)}" placeholder="Ej: Juan García" maxlength="60" ${data.isPremium ? 'disabled style="opacity: 0.6; cursor: not-allowed;" title="Premium: Por seguridad, contactanos para cambiar esto"' : ''}>

              <label class="cp-label">Profesión / Especialidad ${data.isPremium ? ' <span style="color:var(--accent-purple);font-size:10px;"><i class="fa-solid fa-lock"></i> Premium</span>' : ''}</label>
              <input class="cp-input" id="cp-profession" type="text" value="${sanitize(data.profession)}" placeholder="Ej: Diseñador Gráfico" maxlength="60" ${data.isPremium ? 'disabled style="opacity: 0.6; cursor: not-allowed;" title="Premium: Por seguridad, contactanos para cambiar esto"' : ''}>

              ${data.isPremium ? `
              <div style="background: rgba(139, 92, 246, 0.1); border: 1px dashed var(--accent-purple); border-radius: 8px; padding: 12px; margin-bottom: 16px; font-size: 11px; color: var(--text-muted); line-height: 1.4;">
                <i class="fa-solid fa-circle-info" style="color: var(--accent-purple);"></i> Tu identidad está protegida. Si cambiaste de negocio o vas a ceder tu tarjeta Premium, contactanos a <b>hola@suito.pro</b> (aplica descuento por traspaso).
              </div>
              ` : ''}

              <label class="cp-label">Descripción breve</label>
              <textarea class="cp-input" id="cp-description" rows="3" placeholder="Contá en pocas palabras qué hacés..." maxlength="160">${sanitize(data.description)}</textarea>

              <label class="cp-label">WhatsApp (Argentina)</label>
              <div style="display:flex; align-items:center; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:12px; padding-left:14px; overflow:hidden;">
                <span style="font-family:var(--font-mono,monospace); font-size:14px; color:var(--text-muted); padding-right:8px; border-right:1px solid rgba(255,255,255,0.1); margin-right:8px; white-space:nowrap;">+54</span>
                <input class="cp-input" id="cp-phone" type="tel" value="${sanitize(data.phone).replace(/^54/, '')}" placeholder="9 11 1234-5678" style="border:none; background:transparent; padding-left:0; width:100%;">
              </div>

              <label class="cp-label">Mensaje predefinido de WhatsApp</label>
              <textarea class="cp-input" id="cp-whatsapp-message" rows="2" placeholder="Ej: Hola! Vi tu tarjeta y me gustaría hacer una consulta." maxlength="200">${sanitize(data.whatsappMessage)}</textarea>

              <label class="cp-label">Email</label>
              <input class="cp-input" id="cp-email" type="email" value="${sanitize(data.email)}" placeholder="vos@tuempresa.com">

              <label class="cp-label">Ubicación</label>
              <input class="cp-input" id="cp-location" type="text" value="${sanitize(data.location)}" placeholder="Ej: Buenos Aires, Argentina" maxlength="80">

              <label class="cp-label">Instagram (sin @)</label>
              <input class="cp-input" id="cp-instagram" type="text" value="${sanitize(data.instagram)}" placeholder="tu.usuario" maxlength="60">

              <label class="cp-label">Facebook</label>
              <input class="cp-input" id="cp-facebook" type="text" value="${sanitize(data.facebook)}" placeholder="https://facebook.com/tupagina" maxlength="100">

              <label class="cp-label">LinkedIn</label>
              <input class="cp-input" id="cp-linkedin" type="url" value="${sanitize(data.linkedin)}" placeholder="https://linkedin.com/in/tuusuario" maxlength="200">

              <label class="cp-label">Sitio web</label>
              <input class="cp-input" id="cp-website" type="url" value="${sanitize(data.website)}" placeholder="https://tuempresa.com">

              <!-- Module Toggle: Appointments -->
              <div class="cp-toggle-row" style="display:flex; align-items:center; justify-content:space-between; padding:16px 0; border-top: 1px solid rgba(255,255,255,0.08); margin-top:20px;">
                  <div style="flex:1; padding-right:12px;">
                      <label class="cp-label" style="margin-bottom:2px; display:block;">Gestor de Turnos</label>
                      <p style="font-size:11px; opacity:0.5; margin:0; line-height:1.3;">Activá el módulo si sos un profesional que da turnos online.</p>
                  </div>
                  <label class="cp-switch">
                      <input type="checkbox" id="cp-toggle-appointments" ${data.activeModules.includes('appointments') ? 'checked' : ''}>
                      <span class="cp-slider"></span>
                  </label>
              </div>

              <div id="cp-booking-section" style="${data.activeModules.includes('appointments') ? '' : 'display:none;'} transition: all 0.3s ease;">
                <label class="cp-label">Link de Turnos</label>
                <input class="cp-input" id="cp-bookingUrl" type="url" value="${sanitize(data.bookingUrl)}" placeholder="https://turnos.suito.pro/#/.../booking" maxlength="200">
              </div>
            </div>
          </div>
        </div>

        <style>
            .cp-switch { position:relative; width:44px; height:24px; display:inline-block; flex-shrink:0; }
            .cp-switch input { opacity:0; width:0; height:0; }
            .cp-slider { position:absolute; inset:0; background:rgba(255,255,255,0.1); border-radius:30px; transition:.3s; cursor:pointer; }
            .cp-slider::before { content:''; position:absolute; height:18px; width:18px; left:3px; bottom:3px; background:#fff; border-radius:50%; transition:.3s; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
            .cp-switch input:checked + .cp-slider { background: var(--primary); }
            .cp-switch input:checked + .cp-slider::before { transform:translateX(20px); }
            .cp-switch input:disabled + .cp-slider { opacity: 0.5; cursor: not-allowed; }
        </style>

        <div class="ge-actions" style="margin-top:24px; display: flex; flex-direction: column; gap: 12px;">
          <button type="button" class="btn-save" id="cp-save-profile" style="background: var(--premium-gradient); border-radius: 20px;">
            <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">stars</span>
            Guardar cambios del perfil
          </button>
          <div id="cp-profile-feedback" style="display:none;text-align:center;color:#059669;font-size:14px;font-weight:700;background:#ecfdf5;padding:14px;border-radius:18px;border: 1px solid #10b981;">
            ✅ ¡Perfil actualizado correctamente!
          </div>
        </div>
      </div>

      <!-- TAB: DISEÑO -->
      <div class="cp-panel" id="tab-design">
        <div class="glass-card" id="cp-design-section" style="position:relative; overflow:hidden;">
          <div class="form-section">
            <div class="section-header" style="margin-bottom: 12px;">
                <h2 class="section-title">Diseño y Marca</h2>
            </div>
            <p class="section-hint">Personalizá tipografía, color social, tema y CSS avanzado para tu tarjeta pública.</p>

            <div class="cp-fields">
              <label class="cp-label">Tipografía</label>
              <select class="cp-input" id="cp-font-family">
                ${buildFontOptions(data.fontFamily)}
              </select>

              <div style="background:rgba(255,255,255,0.03); padding:16px; border-radius:16px; border:1px solid rgba(255,255,255,0.05);">
                <div style="display:flex; align-items:center; justify-content:space-between;">
                  <div>
                    <label class="cp-label" style="margin:0;">Iconos con colores originales</label>
                    <p style="font-size:11px; color:var(--text-muted); margin:0;">WhatsApp verde, Instagram fucsia, etc.</p>
                  </div>
                  <label class="cp-switch">
                    <input type="checkbox" id="cp-use-official-colors" ${data.socialColor === 'official' ? 'checked' : ''}>
                    <span class="cp-slider"></span>
                  </label>
                </div>
              </div>

              <div id="custom-social-color-wrap" style="${data.socialColor === 'official' ? 'display:none;' : ''}">
                <label class="cp-label"><i class="fa-solid fa-palette"></i> Color de tu marca (Iconos)</label>
                <div style="display:flex; gap:10px; align-items:center;">
                  <input class="cp-input" id="cp-social-color" type="color" value="${sanitizeColor(data.socialColor)}" style="width:58px; min-width:58px; padding:4px;">
                  <input class="cp-input" id="cp-social-color-text" type="text" value="${sanitizeColor(data.socialColor)}" maxlength="7" placeholder="#8B5CF6">
                </div>
              </div>

              <div>
                <label class="cp-label"><i class="fa-solid fa-droplet"></i> Textos destacados y Agendar</label>
                <p class="section-hint">Cambia el color de los textos violeta, el boton Compartir y el boton Agendar.</p>
                <div style="display:flex; gap:10px; align-items:center; margin-top:8px;">
                  <input class="cp-input" id="cp-accent-color" type="color" value="${sanitizeColor(data.accentColor)}" style="width:58px; min-width:58px; padding:4px;">
                  <input class="cp-input" id="cp-accent-color-text" type="text" value="${sanitizeColor(data.accentColor)}" maxlength="7" placeholder="#8B5CF6">
                </div>
              </div>

              <label class="cp-label">Tema visual</label>
              <select class="cp-input" id="cp-card-theme">
                ${buildThemeOptions(data.cardTheme)}
              </select>

              <style>
                .qs-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px; }
                .qs-chip {
                    background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 16px; padding: 14px 10px; display: flex; flex-direction: column;
                    align-items: center; gap: 10px; cursor: pointer; text-align: center;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); user-select: none;
                    color: var(--text-muted); font-size: 11px; font-weight: 500;
                }
                .qs-chip i { font-size: 20px; opacity: 0.6; transition: all 0.3s ease; }
                .qs-chip:hover { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.2); }
                .qs-chip.qs-active {
                    background: rgba(139, 92, 246, 0.15); border-color: var(--accent-purple, #8B5CF6);
                    box-shadow: 0 0 15px rgba(139, 92, 246, 0.2);
                }
                .qs-chip.qs-active i { color: var(--accent-purple, #8B5CF6); opacity: 1; transform: scale(1.1); }
                .qs-chip.qs-active span { color: #fff; }
              </style>

              <label class="cp-label" style="margin-top:20px;">Estilos Rápidos</label>
              <p class="section-hint">Activá o desactivá estilos con un toque.</p>
              <div class="qs-grid">
                ${STYLE_PRESETS.map(p => `
                  <div class="qs-chip${hasPresetCSS(data.customCss, p) ? ' qs-active' : ''}" data-qs-key="${p.key}">
                    <i class="${p.icon}"></i>
                    <span>${p.label}</span>
                  </div>
                `).join('')}
              </div>

              <button type="button" id="qs-advanced-toggle" style="background:none; border:none; color:var(--text-muted); font-size:11px; padding:0; cursor:pointer; opacity:0.6; display:flex; align-items:center; gap:5px;">
                <i class="fa-solid fa-chevron-right" id="qs-chevron"></i> Ajustes Técnicos (CSS)
              </button>
              <div id="qs-advanced-wrap" style="display:none; margin-top:12px;">
                <textarea class="cp-input" id="cp-custom-css" rows="5" placeholder=".card-name { text-transform: uppercase; }" maxlength="4000">${sanitize(data.customCss)}</textarea>
                <p class="section-hint" style="margin-top:6px;">Se aplica solo en tarjetas Premium. Evitá reglas globales si no son necesarias.</p>
              </div>
            </div>
          </div>
        </div>
        <div class="ge-actions" style="margin-top:24px; display:flex; flex-direction:column; gap:12px;">
          <button type="button" class="btn-save" id="cp-save-design" style="background: var(--premium-gradient); border-radius: 20px;">
            <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">palette</span>
            Guardar diseño
          </button>
          <div id="cp-design-feedback" style="display:none;text-align:center;color:#059669;font-size:14px;font-weight:700;background:#ecfdf5;padding:14px;border-radius:18px;border: 1px solid #10b981;">
            Diseño actualizado correctamente
          </div>
        </div>
      </div>

      <!-- ═══ TAB: GALERÍA ═══ -->
      <div class="cp-panel" id="tab-gallery">
        <div class="glass-card">
          <div class="form-section">
            <div class="section-label">Fotos de trabajos</div>
            <p class="section-hint">Subí hasta ${data.isPremium ? '12' : '3'} fotos y escribí una descripción de cada una. Tus clientes las van a ver en tu tarjeta.</p>

            <div class="gallery-upload">
              <div class="gallery-grid" id="cp-gallery-grid">
                ${buildGalleryThumbs(data.gallery)}
                ${data.gallery.length < getGalleryLimit(data.isPremium) ? buildAddBtn() : ''}
              </div>
              <input type="file" id="cp-gallery-input" accept="image/*" multiple style="display:none">
              <div id="cp-gallery-feedback" style="display:none;text-align:center;font-size:13px;font-weight:700;margin-top:12px;padding:12px;border-radius:16px;"></div>
            </div>
          </div>
        </div>

        <div class="ge-actions">
          <button type="button" class="btn btn-secondary ge-save-btn" id="cp-save-captions">
            💾 Guardar descripciones
          </button>
          <div id="cp-captions-feedback" style="display:none;text-align:center;color:#10b981;font-size:13px;font-weight:600;margin-top:8px;">
            ✅ Descripciones guardadas
          </div>
        </div>
      </div>

      <!-- ═══ TAB: COMPARTIR ═══ -->
      <div class="cp-panel" id="tab-share">
        <div class="glass-card">
          <div class="form-section">
            <div class="section-label">🔗 Tu tarjeta pública</div>
            <p class="section-hint">Este es el link que podés compartir con tus clientes por WhatsApp, Instagram o como quieras.</p>
            <div class="share-box" style="margin-top:12px;">
              <input type="text" id="cp-share-url" readonly value="${getCardUrl(data._slug)}">
              <button type="button" class="btn-copy" id="cp-copy-btn">Copiar</button>
            </div>
            <div class="ge-whatsapp-row" style="margin-top:16px;">
              <a id="cp-whatsapp-link" class="btn-whatsapp" target="_blank" rel="noopener"
                 href="https://wa.me/?text=${encodeURIComponent(`👋 ¡Hola! Te comparto mi tarjeta profesional:\n\n*${data.name}*\n${data.profession}\n\n🔗 ${getCardUrl(data._slug)}`)}">
                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.555 4.12 1.52 5.855L0 24l6.335-1.652A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.82a9.8 9.8 0 0 1-5.01-1.372l-.36-.213-3.712.968.993-3.608-.236-.374A9.77 9.77 0 0 1 2.18 12 9.82 9.82 0 0 1 12 2.18 9.82 9.82 0 0 1 21.82 12 9.82 9.82 0 0 1 12 21.82z"/>
                </svg>
                Compartir por WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>

    </div>
    `;
}

function buildGalleryThumbs(gallery) {
    return gallery.map((item, i) => `
        <div class="gallery-thumb-wrapper" data-index="${i}">
          <div class="gallery-thumb">
            <img src="${sanitize(item.src)}" alt="${sanitize(item.caption || 'Trabajo ' + (i + 1))}" loading="lazy">
            <button type="button" class="gallery-remove" data-index="${i}">✕</button>
          </div>
          <input type="text" class="gallery-caption-input" data-index="${i}"
            placeholder="Ej: Instalación de aire split" value="${sanitize(item.caption || '')}" maxlength="60">
        </div>
    `).join('');
}

function buildAddBtn() {
    return `
        <label for="cp-gallery-input" class="gallery-add-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <span>Agregar</span>
        </label>
    `;
}

function buildFontOptions(currentFont) {
    const fonts = ['Inter', 'Plus Jakarta Sans', 'Montserrat', 'Poppins', 'Playfair Display', 'Lora', 'Roboto Slab'];
    return fonts.map(font => `
        <option value="${font}" ${font === currentFont ? 'selected' : ''}>${font}</option>
    `).join('');
}

function buildThemeOptions(currentTheme) {
    const themes = [
        ['obsidian', 'Obsidian'],
        ['luminous', 'Luminous'],
        ['emerald', 'Emerald'],
        ['rose', 'Rose'],
    ];
    return themes.map(([value, label]) => `
        <option value="${value}" ${value === currentTheme ? 'selected' : ''}>${label}</option>
    `).join('');
}

function sanitizeColor(value) {
    const color = String(value || '').trim();
    if (color === 'official') return '#8B5CF6';
    return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color) ? color : '#8B5CF6';
}

// ——— Event Wiring ———

function getGalleryLimit(isPremium) {
    return isPremium ? PREMIUM_GALLERY_LIMIT : FREE_GALLERY_LIMIT;
}

function validateGalleryUpload(currentPhotosCount, isPremium) {
    const maxPhotos = getGalleryLimit(isPremium);

    if (currentPhotosCount >= maxPhotos) {
        return {
            allowed: false,
            message: isPremium
                ? `Has alcanzado el limite maximo de ${PREMIUM_GALLERY_LIMIT} fotos.`
                : `Limite de ${FREE_GALLERY_LIMIT} fotos alcanzado. Actualiza a Premium para subir hasta ${PREMIUM_GALLERY_LIMIT} fotos.`,
        };
    }

    return { allowed: true, remaining: maxPhotos - currentPhotosCount };
}

function updateGalleryUI(container, currentPhotosCount, isPremium) {
    const addButton = container.querySelector('.gallery-add-btn');
    if (!addButton) return;

    addButton.style.display = currentPhotosCount >= getGalleryLimit(isPremium) ? 'none' : 'flex';
}

function showGalleryFeedback(container, message, type = 'warning') {
    const feedback = container.querySelector('#cp-gallery-feedback');
    if (!feedback || !message) return;

    const isError = type === 'error';
    feedback.textContent = message;
    feedback.style.display = 'block';
    feedback.style.color = isError ? '#991b1b' : '#92400e';
    feedback.style.background = isError ? '#fee2e2' : '#fef3c7';
    feedback.style.border = `1px solid ${isError ? '#ef4444' : '#f59e0b'}`;
    setTimeout(() => { feedback.style.display = 'none'; }, 3500);
}

function wirePanelEvents(container, data) {
    wirePwaInstall(container);
    wireTabs(container);
    wireDesignEvents(container);
    wireProfileEvents(container, data);
    wireGalleryEvents(container, data);
    wireModuleEvents(container, data);
    wireCopyBtn(container, data);
}

function wirePwaInstall(container) {
    const banner = container.querySelector('#pwa-install-banner');
    const installBtn = container.querySelector('#btn-pwa-install');
    if (!banner || !installBtn) return;

    let deferredPrompt = null;

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        banner.style.display = 'flex';
    });

    installBtn.addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                banner.style.display = 'none';
            }
            deferredPrompt = null;
        } else {
            // Fallback para iOS (Safari no soporta beforeinstallprompt)
            banner.innerHTML = `
              <div style="font-size: 24px;">📱</div>
              <div style="flex:1; font-size:12px; color: var(--text-muted); line-height:1.5;">
                En <b>Safari</b>: tocá <b>Compartir</b> → <b>"Agregar a pantalla de inicio"</b>.<br>
                En <b>Chrome</b>: tocá el menú ⋮ → <b>"Instalar app"</b>.
              </div>
            `;
        }
    });

    // Si ya está instalada como PWA, ocultamos el banner
    if (window.matchMedia('(display-mode: standalone)').matches) {
        banner.style.display = 'none';
    }
}

function wireTabs(container) {
    container.querySelectorAll('.cp-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            container.querySelectorAll('.cp-tab').forEach(b => b.classList.remove('active'));
            container.querySelectorAll('.cp-panel').forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            container.querySelector(`#tab-${btn.dataset.tab}`)?.classList.add('active');
        });
    });
}

function wireProfileEvents(container, data) {
    // Avatar upload
    const avatarFile = container.querySelector('#cp-avatar-file');
    avatarFile?.addEventListener('change', async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const dataUrl = await resizeImage(file, 200);
        container.querySelector('#cp-avatar-preview').src = dataUrl;
        data._pendingAvatar = dataUrl;
    });

    // Cover upload
    const coverFile = container.querySelector('#cp-cover-file');
    coverFile?.addEventListener('change', async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const dataUrl = await resizeBanner(file, 480);
        const preview = container.querySelector('#cp-cover-preview');
        if (preview.tagName === 'IMG') {
            preview.src = dataUrl;
        } else {
            preview.style.background = `url(${dataUrl}) center/cover`;
        }
        data._pendingCover = dataUrl;
    });

    // Save profile
    const saveBtn = container.querySelector('#cp-save-profile');
    saveBtn?.addEventListener('click', async () => {
        saveBtn.disabled = true;
        saveBtn.textContent = '⏳ Guardando...';

        try {
            // Upload images if changed
            if (data._pendingAvatar) {
                const file = dataUriToFile(data._pendingAvatar, 'avatar.jpg');
                const url = await uploadImage(file, data._id, 'avatar');
                data.photo = url;
                delete data._pendingAvatar;
            }
            if (data._pendingCover) {
                const file = dataUriToFile(data._pendingCover, 'cover.jpg');
                const url = await uploadImage(file, data._id, 'cover');
                data.coverPhoto = url;
                delete data._pendingCover;
            }

            // Update profile via secure RPC (including image URLs)
            const profilePayload = {
                nombre_negocio: container.querySelector('#cp-name')?.value || '',
                profession:     container.querySelector('#cp-profession')?.value || '',
                description:    container.querySelector('#cp-description')?.value || '',
                telefono:       '54' + (container.querySelector('#cp-phone')?.value || '').replace(/\D/g, ''),
                email:          container.querySelector('#cp-email')?.value || '',
                location:       container.querySelector('#cp-location')?.value || '',
                foto_url:       data.photo || '',
                cover_url:      data.coverPhoto || '',
                instagram:      container.querySelector('#cp-instagram')?.value || '',
                facebook:       container.querySelector('#cp-facebook')?.value || '',
                linkedin:       container.querySelector('#cp-linkedin')?.value || '',
                website:        container.querySelector('#cp-website')?.value || '',
                booking_url:    container.querySelector('#cp-bookingUrl')?.value || '',
                whatsapp_message: container.querySelector('#cp-whatsapp-message')?.value || '',
            };

            if (data.isPremium) {
                profilePayload.font_family = container.querySelector('#cp-font-family')?.value || 'Inter';
                profilePayload.social_color = container.querySelector('#cp-use-official-colors')?.checked
                    ? 'official'
                    : sanitizeColor(container.querySelector('#cp-social-color-text')?.value || '');
                profilePayload.card_theme = container.querySelector('#cp-card-theme')?.value || 'obsidian';
                profilePayload.custom_css = setAccentColorCss(
                    container.querySelector('#cp-custom-css')?.value || '',
                    container.querySelector('#cp-accent-color-text')?.value || '#8B5CF6'
                );
            }

            await updateBusinessProfileSecure(data._id, data._token, profilePayload);

            const feedback = container.querySelector('#cp-profile-feedback');
            feedback.style.display = 'block';
            setTimeout(() => { feedback.style.display = 'none'; }, 3500);
            const designFeedback = container.querySelector('#cp-design-feedback');
            if (designFeedback) {
                designFeedback.style.display = 'block';
                setTimeout(() => { designFeedback.style.display = 'none'; }, 3500);
            }
        } catch (err) {
            console.error('[ClientPanel] Save profile error:', err);
            const errMsg = err?.message || err?.details || '';
            if (errMsg.includes('PREMIUM_REQUIRED')) {
                showPremiumBlockedFeedback(container, 'Necesitás el plan Premium para cambiar tu foto de perfil o portada.');
            } else {
                alert('Error al guardar. Revisá tu conexión e intentá de nuevo.');
            }
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = '💾 Guardar cambios';
        }
    });
}

function enforcePremiumDesignLock(isPremium, designSectionElement) {
    if (!designSectionElement || isPremium) return;

    designSectionElement.classList.add('suito-locked-feature');
    designSectionElement.querySelectorAll('input, select, textarea, .qs-chip').forEach(input => {
        input.disabled = true;
    });

    if (designSectionElement.querySelector('.suito-premium-overlay')) return;

    const overlay = document.createElement('div');
    overlay.className = 'suito-premium-overlay';
    overlay.style.cssText = `
        position:absolute; inset:0; z-index:10; display:flex; align-items:center; justify-content:center;
        padding:20px; text-align:center; background:rgba(18,18,18,0.84); backdrop-filter:blur(8px);
        -webkit-backdrop-filter:blur(8px); border-radius:inherit;
    `;
    overlay.innerHTML = `
        <div class="suito-premium-banner" style="max-width:360px;">
            <span class="material-symbols-outlined" style="color:#D4AF37; font-size:34px; font-variation-settings:'FILL' 1;">workspace_premium</span>
            <h4 style="color:#fff; margin:10px 0 6px; font-size:18px;">Personalización Premium</h4>
            <p style="color:rgba(255,255,255,0.72); margin:0 0 16px; font-size:13px; line-height:1.45;">Desbloqueá tipografías, temas, color de redes y CSS avanzado.</p>
            <a href="https://suito.pro#precios" target="_blank" rel="noopener" class="suito-upgrade-btn" style="display:inline-flex; align-items:center; justify-content:center; min-height:40px; padding:0 18px; border-radius:14px; background:var(--primary); color:#121212; font-weight:900; text-decoration:none;">Ver Premium</a>
        </div>
    `;

    designSectionElement.appendChild(overlay);
}

function wireGalleryEvents(container, data) {
    const galleryInput = container.querySelector('#cp-gallery-input');

    galleryInput?.addEventListener('change', async (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        const validation = validateGalleryUpload(data.gallery.length, data.isPremium);
        if (!validation.allowed) {
            showGalleryFeedback(container, validation.message);
            e.target.value = '';
            updateGalleryUI(container, data.gallery.length, data.isPremium);
            return;
        }

        const remaining = validation.remaining;
        const toProcess = files.slice(0, remaining);
        if (files.length > remaining) {
            showGalleryFeedback(container, `Se subiran ${remaining} foto${remaining === 1 ? '' : 's'}: alcanzaste el limite de ${getGalleryLimit(data.isPremium)}.`);
        }

        try {
            for (const file of toProcess) {
                const dataUrl = await resizeGalleryImage(file, 300);
                const uploadFile = dataUriToFile(dataUrl, file.name);
                const imageUrl = await uploadImage(uploadFile, data._id, 'gallery');
                const dbImage = await addGalleryImageSecure(data._id, data._token, imageUrl, '', data.gallery.length);
                data.gallery.push({ id: dbImage?.id, src: imageUrl, caption: '' });
            }
        } catch (err) {
            console.error('[ClientPanel] Gallery upload error:', err);
            showGalleryFeedback(container, 'Error al subir imagenes. Intenta de nuevo.', 'error');
        } finally {
            e.target.value = '';
        }
        rerenderGallery(container, data);
    });

    wireGalleryRemoveAndCaptions(container, data);

    const saveCaptionsBtn = container.querySelector('#cp-save-captions');
    saveCaptionsBtn?.addEventListener('click', async () => {
        // Sync captions from DOM
        container.querySelectorAll('.gallery-caption-input').forEach(input => {
            const idx = parseInt(input.dataset.index || '0');
            if (data.gallery[idx]) data.gallery[idx].caption = input.value;
        });

        saveCaptionsBtn.disabled = true;
        saveCaptionsBtn.innerHTML = '⏳ Guardando...';
        try {
            for (const item of data.gallery) {
                if (item.id && item.caption !== undefined) {
                    await updateGalleryCaptionSecure(item.id, data._id, data._token, item.caption);
                }
            }
            const feedback = container.querySelector('#cp-captions-feedback');
            feedback.style.display = 'block';
            setTimeout(() => { feedback.style.display = 'none'; }, 3000);
        } catch (err) {
            console.error('[ClientPanel] Save captions error:', err);
            alert('Error al guardar descripciones. Intentá de nuevo.');
        } finally {
            saveCaptionsBtn.disabled = false;
            saveCaptionsBtn.innerHTML = '💾 Guardar descripciones';
        }
    });
}

function wireGalleryRemoveAndCaptions(container, data) {
    container.querySelectorAll('.gallery-remove').forEach(btn => {
        btn.addEventListener('click', async () => {
            const index = parseInt(btn.dataset.index || '0');
            const item = data.gallery[index];
            if (item?.id) {
                await deleteGalleryImageSecure(item.id, data._id, data._token);
            }
            data.gallery.splice(index, 1);
            rerenderGallery(container, data);
        });
    });

    container.querySelectorAll('.gallery-caption-input').forEach(input => {
        input.addEventListener('input', () => {
            const idx = parseInt(input.dataset.index || '0');
            if (data.gallery[idx]) data.gallery[idx].caption = input.value;
        });
    });
}

function rerenderGallery(container, data) {
    const grid = container.querySelector('#cp-gallery-grid');
    if (!grid) return;
    const maxPhotos = getGalleryLimit(data.isPremium);
    grid.innerHTML = buildGalleryThumbs(data.gallery) + (data.gallery.length < maxPhotos ? buildAddBtn() : '');
    wireGalleryRemoveAndCaptions(container, data);
    updateGalleryUI(container, data.gallery.length, data.isPremium);
}

function wireDesignEvents(container) {
    const colorPicker = container.querySelector('#cp-social-color');
    const colorText = container.querySelector('#cp-social-color-text');
    const accentPicker = container.querySelector('#cp-accent-color');
    const accentText = container.querySelector('#cp-accent-color-text');
    const designSaveBtn = container.querySelector('#cp-save-design');

    colorPicker?.addEventListener('input', () => {
        if (colorText) colorText.value = sanitizeColor(colorPicker.value);
    });

    colorText?.addEventListener('input', () => {
        const color = sanitizeColor(colorText.value);
        if (colorPicker && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(colorText.value.trim())) {
            colorPicker.value = color;
        }
    });

    accentPicker?.addEventListener('input', () => {
        if (accentText) accentText.value = sanitizeColor(accentPicker.value);
    });

    accentText?.addEventListener('input', () => {
        const color = sanitizeColor(accentText.value);
        if (accentPicker && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(accentText.value.trim())) {
            accentPicker.value = color;
        }
    });

    const officialToggle = container.querySelector('#cp-use-official-colors');
    const customColorWrap = container.querySelector('#custom-social-color-wrap');
    officialToggle?.addEventListener('change', () => {
        if (customColorWrap) customColorWrap.style.display = officialToggle.checked ? 'none' : '';
    });

    designSaveBtn?.addEventListener('click', () => {
        container.querySelector('#cp-save-profile')?.click();
    });

    wireQuickStyles(container);
}

function wireQuickStyles(container) {
    const textarea = container.querySelector('#cp-custom-css');

    const syncQuickStyleChips = () => {
        if (!textarea) return;
        STYLE_PRESETS.forEach(p => {
            const chip = container.querySelector(`.qs-chip[data-qs-key="${p.key}"]`);
            if (chip) chip.classList.toggle('qs-active', hasPresetCSS(textarea.value, p));
        });
    };

    container.querySelectorAll('.qs-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const preset = STYLE_PRESETS.find(p => p.key === chip.dataset.qsKey);
            if (!preset || !textarea) return;

            const shouldActivate = !hasPresetCSS(textarea.value, preset);

            if (shouldActivate) {
                const current = removePresetCSS(textarea.value, preset);
                const presetBlock = getPresetBlock(preset);
                textarea.value = current ? `${current}\n\n${presetBlock}` : presetBlock;
            } else {
                textarea.value = removePresetCSS(textarea.value, preset);
            }

            syncQuickStyleChips();
        });
    });

    textarea?.addEventListener('input', syncQuickStyleChips);
    syncQuickStyleChips();

    const advToggle = container.querySelector('#qs-advanced-toggle');
    const advWrap = container.querySelector('#qs-advanced-wrap');
    const chevron = container.querySelector('#qs-chevron');
    advToggle?.addEventListener('click', () => {
        const isOpen = advWrap.style.display !== 'none';
        advWrap.style.display = isOpen ? 'none' : 'block';
        if (chevron) chevron.className = isOpen ? 'fa-solid fa-chevron-right' : 'fa-solid fa-chevron-down';
    });
}

function wireCopyBtn(container, data) {
    const copyBtn = container.querySelector('#cp-copy-btn');
    copyBtn?.addEventListener('click', () => {
        const url = getCardUrl(data._slug);
        navigator.clipboard.writeText(url).then(() => {
            copyBtn.textContent = '✓ Copiado';
            copyBtn.classList.add('copied');
            setTimeout(() => {
                copyBtn.textContent = 'Copiar';
                copyBtn.classList.remove('copied');
            }, 2000);
        });
    });
}

// ——— Premium Feedback UI ———

function showPremiumBlockedFeedback(container, message) {
    // Remove any existing premium feedback
    container.querySelector('#cp-premium-feedback')?.remove();

    const feedback = document.createElement('div');
    feedback.id = 'cp-premium-feedback';
    feedback.style.cssText = `
        text-align: center; color: #b45309; font-size: 13px; font-weight: 700;
        background: linear-gradient(135deg, #fef3c7, #fde68a); padding: 16px;
        border-radius: 18px; border: 1px solid #f59e0b; margin-top: 12px;
        animation: fadeInUp 0.3s ease-out;
    `;
    feedback.innerHTML = `
        <span style="font-size: 20px; display: block; margin-bottom: 6px;">👑</span>
        ${message}<br>
        <a href="https://suito.pro/premium" target="_blank" rel="noopener"
           style="color: #8B5CF6; font-weight: 800; text-decoration: underline; font-size: 12px; margin-top: 8px; display: inline-block;">
            Ver planes Premium →
        </a>
    `;

    const actionsDiv = container.querySelector('.ge-actions');
    if (actionsDiv) {
        actionsDiv.appendChild(feedback);
    } else {
        container.querySelector('#tab-profile')?.appendChild(feedback);
    }

    setTimeout(() => { feedback.remove(); }, 8000);
}

function wireModuleEvents(container, data) {
    const toggleAppts = container.querySelector('#cp-toggle-appointments');
    const bookingSection = container.querySelector('#cp-booking-section');

    toggleAppts?.addEventListener('change', async () => {
        const isActive = toggleAppts.checked;
        const currentModules = data.activeModules || ['card'];
        
        // Calcular nuevos módulos manteniendo 'card' siempre y evitando duplicados
        const newModules = isActive 
            ? [...new Set([...currentModules, 'appointments'])]
            : currentModules.filter(m => m !== 'appointments');

        toggleAppts.disabled = true;
        
        try {
            await updateActiveModulesSecure(data._id, data._token, newModules);
            data.activeModules = newModules;
            
            // Efecto visual suave para ocultar/mostrar la sección del link
            if (bookingSection) {
                if (isActive) {
                    bookingSection.style.display = 'block';
                    setTimeout(() => bookingSection.style.opacity = '1', 10);
                } else {
                    bookingSection.style.opacity = '0';
                    setTimeout(() => bookingSection.style.display = 'none', 300);
                }
            }
        } catch (err) {
            console.error('[ClientPanel] Module toggle error:', err);
            toggleAppts.checked = !isActive; // Revertir UI
            alert('No pudimos actualizar los módulos. Verificá tu conexión.');
        } finally {
            toggleAppts.disabled = false;
        }
    });
}
