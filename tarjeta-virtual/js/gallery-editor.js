// ============================================
// gallery-editor.js — Mini-editor for professionals
// Only gallery editing, core info stays locked
// Uses Supabase for storage & data
// ============================================

import { sanitize, getCardUrl, resizeGalleryImage, dataUriToFile } from './utils.js';
import { uploadImage, addGalleryImage, deleteGalleryImage, getGalleryImages, updateGalleryCaption } from './supabase.js';

export function renderGalleryEditor(container, card) {
  // card comes from Supabase (DB format with _id etc.)
  const data = {
    name: card.name,
    profession: card.profession,
    photo: card.photo_url,
    _id: card.id,
    gallery: (card.gallery_images || []).map(img => ({
      id: img.id,
      src: img.image_url,
      caption: img.caption || '',
    })),
  };

  container.innerHTML = buildGalleryEditorHTML(data);
  wireGalleryEditorEvents(container, data);
}

function buildGalleryEditorHTML(data) {
  const galleryThumbs = data.gallery.map((item, i) => `
    <div class="gallery-thumb-wrapper" data-index="${i}">
      <div class="gallery-thumb">
        <img src="${item.src}" alt="${item.caption || 'Trabajo ' + (i + 1)}">
        <button type="button" class="gallery-remove" data-index="${i}">✕</button>
      </div>
      <input type="text" class="gallery-caption-input" data-index="${i}" 
        placeholder="Ej: Instalación de aire split" value="${sanitize(item.caption || '')}" maxlength="60">
    </div>
  `).join('');

  const addBtn = data.gallery.length < 4 ? `
    <label for="ge-gallery-input" class="gallery-add-btn">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="12" y1="5" x2="12" y2="19"/>
        <line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
      <span>Agregar</span>
    </label>
  ` : '';

  return `
    <div class="gallery-editor-view">
      <div class="ge-header">
        <h1 class="ge-title">📸 Personalizá tu tarjeta</h1>
        <p class="ge-subtitle">Agregá fotos de tus trabajos para mostrar a tus clientes. Podés cambiarlas cuando quieras.</p>
      </div>

      <!-- Card preview (read-only compact) -->
      <div class="ge-preview-card glass-card">
        <div class="ge-preview-info">
          ${data.photo ? `<img src="${data.photo}" class="ge-avatar" alt="${sanitize(data.name)}">` : ''}
          <div>
            <h3 class="ge-name">${sanitize(data.name)}</h3>
            <p class="ge-profession">${sanitize(data.profession)}</p>
          </div>
        </div>
      </div>

      <!-- Gallery editor section -->
      <div class="glass-card">
        <div class="form-section">
          <div class="section-label">Fotos de trabajos</div>
          <p class="section-hint">Subí hasta 4 fotos y escribí una breve descripción de cada una. Tus clientes van a poder verlas.</p>

          <div class="gallery-upload">
            <div class="gallery-grid" id="ge-gallery-grid">
              ${galleryThumbs}
              ${addBtn}
            </div>
            <input type="file" id="ge-gallery-input" accept="image/*" multiple style="display:none">
          </div>
        </div>
      </div>

      <!-- Save captions button -->
      <div class="ge-actions">
        <button type="button" class="btn btn-secondary ge-save-btn" id="ge-save-captions">
          💾 Guardar descripciones
        </button>
        <div class="ge-save-feedback" id="ge-save-feedback" style="display:none;">
          <span class="ge-save-success">✅ Descripciones guardadas correctamente</span>
        </div>
      </div>

      <!-- Share button -->
      <div class="ge-actions">
        <button type="button" class="btn-primary ge-share-btn" id="ge-generate">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
            <polyline points="16 6 12 2 8 6"/>
            <line x1="12" y1="2" x2="12" y2="15"/>
          </svg>
          Compartir mi tarjeta
        </button>
      </div>

      <!-- Share result (hidden initially) -->
      <div class="ge-share-result" id="ge-share-result" style="display:none">
        <div class="glass-card">
          <div class="form-section">
            <div class="section-label">🔗 Tu link para compartir</div>
            <p class="section-hint">Copiá este link y envialo a tus clientes por WhatsApp o como quieras.</p>
            <div class="share-box">
              <input type="text" id="ge-share-url" readonly>
              <button type="button" class="btn-copy" id="ge-copy-btn">Copiar</button>
            </div>
            <div class="ge-whatsapp-row">
              <a id="ge-whatsapp-link" class="btn-whatsapp" target="_blank" rel="noopener">
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

function wireGalleryEditorEvents(container, data) {
  const galleryInput = container.querySelector('#ge-gallery-input');
  const generateBtn = container.querySelector('#ge-generate');

  // Gallery upload — save directly to Supabase
  if (galleryInput) {
    galleryInput.addEventListener('change', async (e) => {
      const files = Array.from(e.target.files);
      if (!files.length) return;

      const remaining = 4 - data.gallery.length;
      const toProcess = files.slice(0, remaining);

      for (const file of toProcess) {
        // Resize locally
        const dataUrl = await resizeGalleryImage(file, 300);
        // Upload to Supabase Storage
        const uploadFile = dataUriToFile(dataUrl, file.name);
        const imageUrl = await uploadImage(uploadFile, data._id, 'gallery');
        // Save to gallery_images table
        const dbImage = await addGalleryImage(data._id, imageUrl, '', data.gallery.length);
        data.gallery.push({ id: dbImage.id, src: imageUrl, caption: '' });
      }
      // Re-render
      renderGalleryEditor_internal(container, data);
    });
  }

  // Remove gallery items
  container.querySelectorAll('.gallery-remove').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const index = parseInt(btn.dataset.index);
      const item = data.gallery[index];
      // Delete from Supabase
      if (item.id) {
        await deleteGalleryImage(item.id);
      }
      data.gallery.splice(index, 1);
      renderGalleryEditor_internal(container, data);
    });
  });

  // Caption inputs — save on blur to avoid too many API calls
  container.querySelectorAll('.gallery-caption-input').forEach(input => {
    input.addEventListener('input', () => {
      const index = parseInt(input.dataset.index);
      if (data.gallery[index]) {
        data.gallery[index].caption = input.value;
      }
    });
  });

  // Save captions to Supabase
  const saveCaptionsBtn = container.querySelector('#ge-save-captions');
  if (saveCaptionsBtn) {
    saveCaptionsBtn.addEventListener('click', async () => {
      // Sync captions from DOM first
      container.querySelectorAll('.gallery-caption-input').forEach(input => {
        const index = parseInt(input.dataset.index);
        if (data.gallery[index]) {
          data.gallery[index].caption = input.value;
        }
      });

      saveCaptionsBtn.disabled = true;
      saveCaptionsBtn.innerHTML = '<span class="spinner-sm"></span> Guardando...';

      try {
        for (const item of data.gallery) {
          if (item.id && item.caption !== undefined) {
            await updateGalleryCaption(item.id, item.caption);
          }
        }
        // Show success feedback
        const feedback = container.querySelector('#ge-save-feedback');
        feedback.style.display = 'block';
        saveCaptionsBtn.innerHTML = '✅ Guardado';
        setTimeout(() => {
          saveCaptionsBtn.disabled = false;
          saveCaptionsBtn.innerHTML = '💾 Guardar descripciones';
          feedback.style.display = 'none';
        }, 3000);
      } catch (err) {
        console.error('Error saving captions:', err);
        saveCaptionsBtn.disabled = false;
        saveCaptionsBtn.innerHTML = '💾 Guardar descripciones';
        alert('Error al guardar. Intentá de nuevo.');
      }
    });
  }

  // Generate share link (short URL!)
  if (generateBtn) {
    generateBtn.addEventListener('click', () => {
      const cardUrl = getCardUrl(data._id);
      const shareResult = container.querySelector('#ge-share-result');
      const shareUrlInput = container.querySelector('#ge-share-url');
      const copyBtn = container.querySelector('#ge-copy-btn');
      const whatsappLink = container.querySelector('#ge-whatsapp-link');

      shareUrlInput.value = cardUrl;
      shareResult.style.display = 'block';

      shareResult.scrollIntoView({ behavior: 'smooth', block: 'center' });

      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(cardUrl).then(() => {
          copyBtn.textContent = '✓ Copiado';
          copyBtn.classList.add('copied');
          setTimeout(() => {
            copyBtn.textContent = 'Copiar';
            copyBtn.classList.remove('copied');
          }, 2000);
        });
      });

      const message = `👋 ¡Hola! Te comparto mi tarjeta profesional:\n\n*${data.name}*\n${data.profession}\n\n🔗 ${cardUrl}`;
      whatsappLink.href = `https://wa.me/?text=${encodeURIComponent(message)}`;
    });
  }
}

// Internal re-render (data already transformed)
function renderGalleryEditor_internal(container, data) {
  container.innerHTML = buildGalleryEditorHTML(data);
  wireGalleryEditorEvents(container, data);
}
