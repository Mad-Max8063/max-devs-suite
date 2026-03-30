// ============================================
// editor.js — Editor form logic
// ============================================

import { resizeImage, resizeBanner, resizeGalleryImage, dataUriToFile } from './utils.js';
import { createCard, updateCard, uploadImage, getSupabaseClient } from './supabase.js';

const FIELDS = ['name', 'profession', 'description', 'phone', 'email', 'location', 'instagram', 'linkedin', 'website', 'bookingUrl'];
const MAX_DESC = 160;

// Default empty data (no demo info)
const DEFAULT_DATA = {
  name: '',
  profession: '',
  description: '',
  phone: '+54 ',
  email: '',
  location: '',
  instagram: '',
  linkedin: '',
  website: '',
  coverPhoto: '',
  bookingUrl: ''
};

export function initEditor(container, onPreview) {
  // Persist data across gallery re-inits (adding/removing images calls initEditor again)
  let data = container.__editorData || { ...DEFAULT_DATA };
  container.__editorData = data;

  const coverPreviewStyle = data.coverPhoto
    ? `background-image: url('${data.coverPhoto}'); background-size: cover; background-position: center;`
    : '';

  container.innerHTML = `
    <div class="editor-header">
      <h1>✨ Tu Tarjeta Virtual</h1>
      <p>Completá tus datos y compartí tu perfil profesional</p>
    </div>

    <form id="editor-form" autocomplete="off">
      <!-- Avatar -->
      <div class="avatar-upload">
        <label for="photo-input" class="avatar-preview" id="avatar-preview">
          <img src="${data.photo || 'assets/default-avatar.svg'}" alt="Avatar" id="avatar-img">
          <div class="upload-hint">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Cambiar
          </div>
        </label>
        <input type="file" id="photo-input" accept="image/*">
        <span class="avatar-label">Tocá para subir tu foto</span>
      </div>

      <!-- Cover Photo -->
      <div class="cover-upload-section">
        <div class="section-label">Imagen de portada</div>
        <label for="cover-input" class="cover-preview" id="cover-preview" style="${coverPreviewStyle}">
          <div class="cover-placeholder ${data.coverPhoto ? 'has-image' : ''}" id="cover-placeholder">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
            <span>Subir imagen de portada</span>
            <small>Aparece detrás de tu foto de perfil</small>
          </div>
          <div class="cover-overlay" id="cover-overlay">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Cambiar
          </div>
        </label>
        <input type="file" id="cover-input" accept="image/*">
        ${data.coverPhoto ? '<button type="button" class="btn-remove-cover" id="btn-remove-cover">✕ Quitar portada</button>' : ''}
      </div>

      <!-- Datos principales -->
      <div class="glass-card">
        <div class="form-section">
          <div class="section-label">Información principal</div>

          <div class="form-group">
            <label>Nombre completo <span class="required">*</span></label>
            <input type="text" id="field-name" placeholder="Ej: María González" value="${data.name || ''}" required>
          </div>

          <div class="form-group">
            <label>Profesión / Especialidad <span class="required">*</span></label>
            <input type="text" id="field-profession" placeholder="Ej: Diseñadora UX/UI" value="${data.profession || ''}" required>
          </div>

          <div class="form-group">
            <label>Descripción corta</label>
            <textarea id="field-description" placeholder="Ej: +5 años ayudando a empresas a diseñar productos digitales" maxlength="${MAX_DESC}">${data.description || ''}</textarea>
            <div class="char-count"><span id="desc-count">${(data.description || '').length}</span>/${MAX_DESC}</div>
          </div>
        </div>
      </div>

      <!-- Contacto -->
      <div class="glass-card">
        <div class="form-section">
          <div class="section-label">Datos de contacto</div>

          <div class="form-group">
            <label>Teléfono <span class="required">*</span></label>
            <input type="tel" id="field-phone" placeholder="Ej: +54 11 1234-5678" value="${data.phone || ''}" required>
          </div>

          <div class="form-group">
            <label>Email</label>
            <input type="email" id="field-email" placeholder="Ej: maria@ejemplo.com" value="${data.email || ''}">
          </div>

          <div class="form-group">
            <label>Ubicación</label>
            <input type="text" id="field-location" placeholder="Ej: Buenos Aires, Argentina" value="${data.location || ''}">
          </div>
        </div>
      </div>

      <!-- Redes -->
      <div class="glass-card">
        <div class="form-section">
          <div class="section-label">Redes sociales (opcional)</div>

          <div class="form-group">
            <label>Instagram</label>
            <div class="social-input-wrapper">
              <span class="prefix">@</span>
              <input type="text" id="field-instagram" placeholder="tu.usuario" value="${data.instagram || ''}">
            </div>
          </div>

          <div class="form-group">
            <label>LinkedIn</label>
            <input type="url" id="field-linkedin" placeholder="https://linkedin.com/in/tuusuario" value="${data.linkedin || ''}">
          </div>

          <div class="form-group">
            <label>Sitio web</label>
            <input type="url" id="field-website" placeholder="https://tuportfolio.com" value="${data.website || ''}">
          </div>
        </div>
      </div>

      <!-- Link de Turnos -->
      <div class="glass-card">
        <div class="form-section">
          <div class="section-label">📅 Link de turnos (opcional)</div>
          <p class="section-hint">Si usás nuestro Gestor de Turnos, tocá "Detectar" para conectarlo automáticamente.</p>

          <div class="form-group">
            <label>URL de reserva</label>
            <div style="display: flex; gap: 8px; align-items: center;">
              <input type="url" id="field-bookingUrl" placeholder="https://gestor-de-turnos.pages.dev/#/tu-negocio/booking" value="${data.bookingUrl || ''}" style="flex: 1;">
              <button type="button" id="btn-detect-booking" class="btn-detect" title="Detectar link de turnos automáticamente">
                🔍 Detectar
              </button>
            </div>
            <div id="booking-status" style="margin-top: 6px; font-size: 0.75rem;"></div>
          </div>
        </div>
      </div>

      <!-- Galería de trabajos -->
      <div class="glass-card">
        <div class="form-section">
          <div class="section-label">Fotos de trabajos (opcional)</div>
          <p class="section-hint">Mostrá tus trabajos realizados. Máximo 4 fotos con descripción.</p>

          <div class="gallery-upload" id="gallery-upload">
            <div class="gallery-grid" id="gallery-grid">
              ${(data.gallery || []).map((item, i) => {
    const src = typeof item === 'string' ? item : item.src;
    const caption = typeof item === 'string' ? '' : (item.caption || '');
    return `
                <div class="gallery-thumb-wrapper" data-index="${i}">
                  <div class="gallery-thumb">
                    <img src="${src}" alt="Trabajo ${i + 1}">
                    <button type="button" class="gallery-remove" data-index="${i}">✕</button>
                  </div>
                  <input type="text" class="gallery-caption-input" data-index="${i}" 
                    placeholder="Ej: Instalación de aire split" value="${caption}" maxlength="60">
                </div>
              `}).join('')}
              ${(data.gallery || []).length < 4 ? `
                <label for="gallery-input" class="gallery-add-btn">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  <span>Agregar</span>
                </label>
              ` : ''}
            </div>
            <input type="file" id="gallery-input" accept="image/*" multiple style="display:none">
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="btn-group">
        <button type="submit" class="btn btn-primary" id="btn-preview">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          Previsualizar tarjeta
        </button>
      </div>
    </form>
  `;

  // — Wire up events —

  // Photo upload
  const photoInput = container.querySelector('#photo-input');
  const avatarImg = container.querySelector('#avatar-img');

  photoInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const dataUrl = await resizeImage(file, 200);
    avatarImg.src = dataUrl;
    data.photo = dataUrl;
  });

  // Cover photo upload
  const coverInput = container.querySelector('#cover-input');
  const coverPreview = container.querySelector('#cover-preview');
  const coverPlaceholder = container.querySelector('#cover-placeholder');
  const coverOverlay = container.querySelector('#cover-overlay');

  coverInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const dataUrl = await resizeBanner(file, 480);
    data.coverPhoto = dataUrl;

    // Update preview
    coverPreview.style.backgroundImage = `url('${dataUrl}')`;
    coverPreview.style.backgroundSize = 'cover';
    coverPreview.style.backgroundPosition = 'center';
    coverPlaceholder.classList.add('has-image');

    // Add remove button if not present
    if (!container.querySelector('#btn-remove-cover')) {
      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'btn-remove-cover';
      removeBtn.id = 'btn-remove-cover';
      removeBtn.textContent = '✕ Quitar portada';
      removeBtn.addEventListener('click', () => removeCover(data, coverPreview, coverPlaceholder, removeBtn));
      coverInput.parentElement.appendChild(removeBtn);
    }
  });

  // Remove cover button (if already rendered)
  const removeCoverBtn = container.querySelector('#btn-remove-cover');
  if (removeCoverBtn) {
    removeCoverBtn.addEventListener('click', () => {
      removeCover(data, coverPreview, coverPlaceholder, removeCoverBtn);
    });
  }

  // Text fields auto-save
  FIELDS.forEach((field) => {
    const input = container.querySelector(`#field-${field}`);
    if (!input) return;
    input.addEventListener('input', () => {
      data[field] = input.value;

      if (field === 'description') {
        container.querySelector('#desc-count').textContent = input.value.length;
      }
    });
  });

  // Detect booking URL from Gestor de Turnos
  const detectBtn = container.querySelector('#btn-detect-booking');
  const bookingStatus = container.querySelector('#booking-status');
  if (detectBtn) {
    detectBtn.addEventListener('click', async () => {
      detectBtn.disabled = true;
      detectBtn.textContent = '⏳';
      bookingStatus.textContent = 'Buscando...';
      bookingStatus.style.color = '#6b7280';

      try {
        // Try to find a business by matching the card name to a slug
        const nameSlug = (data.name || '').toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim();

        if (!nameSlug) {
          bookingStatus.innerHTML = '⚠️ Completá el nombre primero';
          bookingStatus.style.color = '#f59e0b';
          detectBtn.disabled = false;
          detectBtn.textContent = '🔍 Detectar';
          return;
        }

        // Search for matching business in Supabase
        const sb = getSupabaseClient();
        const { data: businesses } = await sb
          .from('businesses')
          .select('slug, nombre_negocio')
          .or(`slug.eq.${nameSlug},nombre_negocio.ilike.%${data.name}%`)
          .limit(5);

        if (businesses && businesses.length > 0) {
          const match = businesses[0];
          const bookingUrl = `https://gestor-de-turnos.pages.dev/#/${match.slug}/booking`;
          const bookingInput = container.querySelector('#field-bookingUrl');
          bookingInput.value = bookingUrl;
          data.bookingUrl = bookingUrl;
          bookingStatus.innerHTML = `✅ Conectado con <strong>${match.nombre_negocio}</strong>`;
          bookingStatus.style.color = '#22c55e';
        } else {
          bookingStatus.innerHTML = '❌ No se encontró un Gestor de Turnos vinculado. <a href="https://gestor-de-turnos.pages.dev/#/register" target="_blank" style="color: #8b5cf6;">Crear cuenta →</a>';
          bookingStatus.style.color = '#ef4444';
        }
      } catch (err) {
        bookingStatus.textContent = '⚠️ Error al buscar. Podés pegar el link manualmente.';
        bookingStatus.style.color = '#f59e0b';
      }

      detectBtn.disabled = false;
      detectBtn.textContent = '🔍 Detectar';
    });
  }

  // Form submit → save to Supabase → preview
  const form = container.querySelector('#editor-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validate required
    if (!data.name || !data.profession || !data.phone) {
      showMissingFields(container);
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-sm"></span> Guardando...';

    try {
      // 1. Create card in Supabase (without images initially)
      const card = await createCard({
        name: data.name,
        profession: data.profession,
        description: data.description,
        phone: data.phone,
        email: data.email,
        location: data.location,
        instagram: data.instagram,
        linkedin: data.linkedin,
        website: data.website,
        booking_url: data.bookingUrl,
        photo_url: '',
        cover_url: '',
      });

      // 2. Upload avatar using the real card ID
      let photoUrl = '';
      if (data.photo && data.photo.startsWith('data:')) {
        const photoFile = dataUriToFile(data.photo, 'avatar.jpg');
        photoUrl = await uploadImage(photoFile, card.id, 'avatar');
      }

      // 3. Upload cover using the real card ID
      let coverUrl = '';
      if (data.coverPhoto && data.coverPhoto.startsWith('data:')) {
        const coverFile = dataUriToFile(data.coverPhoto, 'cover.jpg');
        coverUrl = await uploadImage(coverFile, card.id, 'cover');
      }

      // 4. Update card with image URLs if any were uploaded
      if (photoUrl || coverUrl) {
        const updates = {};
        if (photoUrl) updates.photo_url = photoUrl;
        if (coverUrl) updates.cover_url = coverUrl;
        await updateCard(card.id, updates);
      }

      // 5. Upload gallery images
      if (data.gallery && data.gallery.length > 0) {
        const { addGalleryImage, uploadImage: upload } = await import('./supabase.js');
        for (let i = 0; i < data.gallery.length; i++) {
          const item = data.gallery[i];
          if (item.src && item.src.startsWith('data:')) {
            const file = dataUriToFile(item.src, `gallery-${i}.jpg`);
            const imgUrl = await upload(file, card.id, 'gallery');
            await addGalleryImage(card.id, imgUrl, item.caption || '', i);
          }
        }
      }

      // 6. Set final data for preview
      data._id = card.id;
      data._editToken = card.edit_token;
      data.photo = photoUrl;
      data.coverPhoto = coverUrl;

      onPreview(data);
    } catch (err) {
      console.error('Error saving card:', err);
      submitBtn.disabled = false;
      submitBtn.innerHTML = '👁 Previsualizar tarjeta';
      alert('Error al guardar. Revisá tu conexión e intentá de nuevo.');
    }
  });

  // Sync all form values from DOM into data (called before re-renders)
  function syncFormData() {
    FIELDS.forEach((field) => {
      const input = container.querySelector(`#field-${field}`);
      if (input) data[field] = input.value;
    });
    // Sync gallery captions from DOM
    if (data.gallery) {
      container.querySelectorAll('.gallery-caption-input').forEach((input) => {
        const index = parseInt(input.dataset.index);
        if (data.gallery[index]) {
          if (typeof data.gallery[index] === 'string') {
            data.gallery[index] = { src: data.gallery[index], caption: '' };
          }
          data.gallery[index].caption = input.value;
        }
      });
    }
    // Sync photo/cover from current data (already handled by their change events)
  }

  // Gallery upload
  const galleryInput = container.querySelector('#gallery-input');
  if (galleryInput) {
    galleryInput.addEventListener('change', async (e) => {
      const files = Array.from(e.target.files);
      if (!files.length) return;

      // Sync ALL form values before re-rendering
      syncFormData();

      if (!data.gallery) data.gallery = [];
      data.gallery = data.gallery.map(item =>
        typeof item === 'string' ? { src: item, caption: '' } : item
      );
      const remaining = 4 - data.gallery.length;
      const toProcess = files.slice(0, remaining);

      for (const file of toProcess) {
        const dataUrl = await resizeGalleryImage(file, 300);
        data.gallery.push({ src: dataUrl, caption: '' });
      }
      initEditor(container, onPreview);
    });
  }

  // Gallery remove buttons
  container.querySelectorAll('.gallery-remove').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      syncFormData();
      const index = parseInt(btn.dataset.index);
      if (!data.gallery) return;
      data.gallery.splice(index, 1);
      initEditor(container, onPreview);
    });
  });

  // Gallery caption inputs
  container.querySelectorAll('.gallery-caption-input').forEach((input) => {
    input.addEventListener('input', () => {
      const index = parseInt(input.dataset.index);
      if (!data.gallery || !data.gallery[index]) return;
      if (typeof data.gallery[index] === 'string') {
        data.gallery[index] = { src: data.gallery[index], caption: '' };
      }
      data.gallery[index].caption = input.value;
    });
  });
}

function removeCover(data, coverPreview, coverPlaceholder, removeBtn) {
  data.coverPhoto = '';
  coverPreview.style.backgroundImage = '';
  coverPlaceholder.classList.remove('has-image');
  if (removeBtn) removeBtn.remove();
}

function showMissingFields(container) {
  const required = ['name', 'profession', 'phone'];
  required.forEach((f) => {
    const input = container.querySelector(`#field-${f}`);
    if (!input.value.trim()) {
      input.style.borderColor = '#ef4444';
      input.addEventListener('input', () => {
        input.style.borderColor = 'transparent';
      }, { once: true });
    }
  });
}

export function getEditorData() {
  return window.__lastEditorData || {};
}

