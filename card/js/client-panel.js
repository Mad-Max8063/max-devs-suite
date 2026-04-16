// ============================================
// client-panel.js — Panel de edición para clientes premium
// Acceso: /edit/{cardId}?token={editToken}
// Permite editar: perfil básico + galería + compartir
// ============================================

import { sanitize, getCardUrl, resizeImage, resizeBanner, resizeGalleryImage, dataUriToFile } from './utils.js';
import {
    uploadImage,
    addGalleryImageSecure,
    deleteGalleryImageSecure,
    updateGalleryCaptionSecure,
    updateBusinessProfileSecure,
} from './supabase-v2028.js';

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
        gallery: (card.gallery_images || card.gallery || []).map(img => ({
            id:      img.id,
            src:     img.image_url || img.src || '',
            caption: img.caption || '',
        })),
    };

    container.innerHTML = buildPanelHTML(data);
    wirePanelEvents(container, data);
}

// ——— HTML ———

function buildPanelHTML(data) {
    return `
    <div class="card-container animate-fade-in" style="padding: 16px; min-height: 100dvh; background: transparent;">

      <!-- Header -->
      <div class="ge-header" style="text-align: center; margin-bottom: 20px; padding-top: 8px;">
        <h1 class="card-name" style="color: var(--primary); font-size: 1.5rem;">✨ Tu Panel Suito</h1>
        <p class="card-bio" style="margin: 4px auto 0;">Personalizá tu presencia digital en tiempo real.</p>
      </div>

      <!-- Tabs -->
      <div class="cp-tabs" id="cp-tabs">
        <button class="cp-tab active" data-tab="profile">👤 Mi Perfil</button>
        <button class="cp-tab" data-tab="gallery">📸 Galería</button>
        <button class="cp-tab" data-tab="share">🔗 Compartir</button>
      </div>

      <!-- ═══ TAB: PERFIL ═══ -->
      <div class="cp-panel active" id="tab-profile">
        
        <!-- Live Preview Header -->
        <div class="glass-card" style="padding: 0; overflow: hidden; margin-bottom: 16px; border-radius: var(--radius-card);">
            <div class="card-header" style="margin-bottom: 40px; border-radius: var(--radius-card) var(--radius-card) 0 0;">
                <div class="card-cover-wrapper" style="height: 140px;">
                    <!-- Cover Image -->
                    ${data.coverPhoto ? `<img id="cp-cover-preview" src="${sanitize(data.coverPhoto)}" alt="Portada" class="card-cover">` : `<div id="cp-cover-preview" class="card-cover" style="background:linear-gradient(135deg,#8B5CF6,#EC4899);"></div>`}
                    <div class="card-cover-overlay"></div>
                    <!-- Cover Edit Button -->
                    <label style="position: absolute; top: 12px; right: 12px; background: rgba(255,255,255,0.85); backdrop-filter: blur(4px); padding: 6px 14px; border-radius: 20px; font-size: 11px; font-weight: 700; cursor: pointer; color: var(--primary); display: flex; align-items: center; gap: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); transition: transform 0.2s;">
                        <span class="material-symbols-outlined" style="font-size:16px;">edit</span> Cambiar Portada
                        <input type="file" id="cp-cover-file" accept="image/*" style="display:none">
                    </label>
                </div>
                <!-- Avatar Edit Button -->
                <div class="card-avatar-container" style="bottom: -35px;">
                    <label style="cursor: pointer; display: block; position: relative; transition: transform 0.2s;">
                        <div class="card-avatar-ring" style="width: 84px; height: 84px; border-width: 3px;">
                            <img id="cp-avatar-preview" src="${sanitize(data.photo) || '/card/assets/suito-logo.png'}" class="card-avatar">
                        </div>
                        <div style="position: absolute; bottom: 2px; right: 2px; background: var(--primary); color: white; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.2); border: 2px solid white;">
                            <span class="material-symbols-outlined" style="font-size: 15px;">photo_camera</span>
                        </div>
                        <input type="file" id="cp-avatar-file" accept="image/*" style="display:none">
                    </label>
                </div>
            </div>
            <div style="text-align: center; padding-bottom: 20px;">
                <p class="section-badge" style="display: inline-block; background: var(--surface-2); padding: 6px 12px;">Vista previa visual</p>
            </div>
        </div>

        <div class="glass-card" style="margin-top:12px;">
          <div class="form-section">
            <div class="section-header" style="margin-bottom: 12px;">
                <h2 class="section-title">Información Básica</h2>
            </div>
            <div class="cp-fields">
              <label class="cp-label">Nombre / Negocio</label>
              <input class="cp-input" id="cp-name" type="text" value="${sanitize(data.name)}" placeholder="Ej: Juan García" maxlength="60">

              <label class="cp-label">Profesión / Especialidad</label>
              <input class="cp-input" id="cp-profession" type="text" value="${sanitize(data.profession)}" placeholder="Ej: Diseñador Gráfico" maxlength="60">

              <label class="cp-label">Descripción breve</label>
              <textarea class="cp-input" id="cp-description" rows="3" placeholder="Contá en pocas palabras qué hacés..." maxlength="160">${sanitize(data.description)}</textarea>

              <label class="cp-label">WhatsApp (con código de país)</label>
              <input class="cp-input" id="cp-phone" type="tel" value="${sanitize(data.phone)}" placeholder="+54 9 11 1234-5678">

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

              <label class="cp-label">Link de Turnos (Dejalo vacío para ocultar el botón)</label>
              <input class="cp-input" id="cp-bookingUrl" type="url" value="${sanitize(data.bookingUrl)}" placeholder="https://turnos.suito.pro/#/.../booking" maxlength="200">
            </div>
          </div>
        </div>

        <div class="ge-actions" style="margin-top:20px; display: flex; flex-direction: column; gap: 8px;">
          <button type="button" class="btn-save" id="cp-save-profile">
            <span class="material-symbols-outlined">save</span>
            Guardar todos los cambios
          </button>
          <div id="cp-profile-feedback" style="display:none;text-align:center;color:var(--tertiary);font-size:13px;font-weight:700;background:rgba(16,185,129,0.1);padding:10px;border-radius:12px;">
            ¡Perfil actualizado correctamente!
          </div>
        </div>
      </div>

      <!-- ═══ TAB: GALERÍA ═══ -->
      <div class="cp-panel" id="tab-gallery">
        <div class="glass-card">
          <div class="form-section">
            <div class="section-label">Fotos de trabajos</div>
            <p class="section-hint">Subí hasta 4 fotos y escribí una descripción de cada una. Tus clientes las van a ver en tu tarjeta.</p>

            <div class="gallery-upload">
              <div class="gallery-grid" id="cp-gallery-grid">
                ${buildGalleryThumbs(data.gallery)}
                ${data.gallery.length < 4 ? buildAddBtn() : ''}
              </div>
              <input type="file" id="cp-gallery-input" accept="image/*" multiple style="display:none">
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
            <img src="${item.src}" alt="${sanitize(item.caption || 'Trabajo ' + (i + 1))}">
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

// ——— Event Wiring ———

function wirePanelEvents(container, data) {
    wireTabs(container);
    wireProfileEvents(container, data);
    wireGalleryEvents(container, data);
    wireCopyBtn(container, data);
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

            // Update profile via secure RPC
            await updateBusinessProfileSecure(data._id, data._token, {
                nombre_negocio: container.querySelector('#cp-name')?.value || '',
                profession:     container.querySelector('#cp-profession')?.value || '',
                description:    container.querySelector('#cp-description')?.value || '',
                telefono:       container.querySelector('#cp-phone')?.value || '',
                email:          container.querySelector('#cp-email')?.value || '',
                location:       container.querySelector('#cp-location')?.value || '',
                instagram:      container.querySelector('#cp-instagram')?.value || '',
                facebook:       container.querySelector('#cp-facebook')?.value || '',
                linkedin:       container.querySelector('#cp-linkedin')?.value || '',
                website:        container.querySelector('#cp-website')?.value || '',
                booking_url:    container.querySelector('#cp-bookingUrl')?.value || '',
            });

            const feedback = container.querySelector('#cp-profile-feedback');
            feedback.style.display = 'block';
            setTimeout(() => { feedback.style.display = 'none'; }, 3500);
        } catch (err) {
            console.error('[ClientPanel] Save profile error:', err);
            alert('Error al guardar. Revisá tu conexión e intentá de nuevo.');
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = '💾 Guardar cambios';
        }
    });
}

function wireGalleryEvents(container, data) {
    const galleryInput = container.querySelector('#cp-gallery-input');

    galleryInput?.addEventListener('change', async (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        const remaining = 4 - data.gallery.length;
        const toProcess = files.slice(0, remaining);

        for (const file of toProcess) {
            const dataUrl = await resizeGalleryImage(file, 300);
            const uploadFile = dataUriToFile(dataUrl, file.name);
            const imageUrl = await uploadImage(uploadFile, data._id, 'gallery');
            const dbImage = await addGalleryImageSecure(data._id, data._token, imageUrl, '', data.gallery.length);
            data.gallery.push({ id: dbImage?.id, src: imageUrl, caption: '' });
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
    grid.innerHTML = buildGalleryThumbs(data.gallery) + (data.gallery.length < 4 ? buildAddBtn() : '');
    wireGalleryRemoveAndCaptions(container, data);
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
