import{s as d,b,d as f,g as w}from"./utils-D2FUlLYF-v2029.js";import{u as x,b as k,e as S,c as C}from"./card-C7mr9vn4-v2029.js";import"./modulepreload-polyfill-B5Qt9EMX-v2029.js";import"./supabase-BW7mDqrU-v2029.js";import"./vendor-supabase-BW_Ct9fl-v2029.js";import"./vendor-CWnJSrkj-v2029.js";function I(s,e){const n={name:e.name,profession:e.profession,photo:e.photo_url,_id:e.id,_token:e.edit_token||"",gallery:(e.gallery_images||[]).map(i=>({id:i.id,src:i.image_url,caption:i.caption||""}))};s.innerHTML=y(n),v(s,n)}function y(s){const e=s.gallery.map((i,l)=>`
    <div class="gallery-thumb-wrapper" data-index="${l}">
      <div class="gallery-thumb">
        <img src="${i.src}" alt="${i.caption||"Trabajo "+(l+1)}">
        <button type="button" class="gallery-remove" data-index="${l}">✕</button>
      </div>
      <input type="text" class="gallery-caption-input" data-index="${l}" 
        placeholder="Ej: Instalación de aire split" value="${d(i.caption||"")}" maxlength="60">
    </div>
  `).join(""),n=s.gallery.length<4?`
    <label for="ge-gallery-input" class="gallery-add-btn">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="12" y1="5" x2="12" y2="19"/>
        <line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
      <span>Agregar</span>
    </label>
  `:"";return`
    <div class="gallery-editor-view">
      <div class="ge-header">
        <h1 class="ge-title">📸 Personalizá tu tarjeta</h1>
        <p class="ge-subtitle">Agregá fotos de tus trabajos para mostrar a tus clientes. Podés cambiarlas cuando quieras.</p>
      </div>

      <!-- Card preview (read-only compact) -->
      <div class="ge-preview-card glass-card">
        <div class="ge-preview-info">
          ${s.photo?`<img src="${s.photo}" class="ge-avatar" alt="${d(s.name)}">`:""}
          <div>
            <h3 class="ge-name">${d(s.name)}</h3>
            <p class="ge-profession">${d(s.profession)}</p>
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
              ${e}
              ${n}
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
  `}function v(s,e){const n=s.querySelector("#ge-gallery-input"),i=s.querySelector("#ge-generate");n&&n.addEventListener("change",async a=>{const t=Array.from(a.target.files);if(!t.length)return;const o=4-e.gallery.length,r=t.slice(0,o);for(const c of r){const p=await b(c,300),h=f(p,c.name),g=await x(h,e._id,"gallery"),m=await k(e._id,e._token,g,"",e.gallery.length);e.gallery.push({id:m.id,src:g,caption:""})}u(s,e)}),s.querySelectorAll(".gallery-remove").forEach(a=>{a.addEventListener("click",async t=>{t.preventDefault();const o=parseInt(a.dataset.index),r=e.gallery[o];r.id&&await S(r.id,e._id,e._token),e.gallery.splice(o,1),u(s,e)})}),s.querySelectorAll(".gallery-caption-input").forEach(a=>{a.addEventListener("input",()=>{const t=parseInt(a.dataset.index);e.gallery[t]&&(e.gallery[t].caption=a.value)})});const l=s.querySelector("#ge-save-captions");l&&l.addEventListener("click",async()=>{s.querySelectorAll(".gallery-caption-input").forEach(a=>{const t=parseInt(a.dataset.index);e.gallery[t]&&(e.gallery[t].caption=a.value)}),l.disabled=!0,l.innerHTML='<span class="spinner-sm"></span> Guardando...';try{for(const t of e.gallery)t.id&&t.caption!==void 0&&await C(t.id,e._id,e._token,t.caption);const a=s.querySelector("#ge-save-feedback");a.style.display="block",l.innerHTML="✅ Guardado",setTimeout(()=>{l.disabled=!1,l.innerHTML="💾 Guardar descripciones",a.style.display="none"},3e3)}catch(a){console.error("Error saving captions:",a),l.disabled=!1,l.innerHTML="💾 Guardar descripciones",alert("Error al guardar. Intentá de nuevo.")}}),i&&i.addEventListener("click",()=>{const a=w(e._id),t=s.querySelector("#ge-share-result"),o=s.querySelector("#ge-share-url"),r=s.querySelector("#ge-copy-btn"),c=s.querySelector("#ge-whatsapp-link");o.value=a,t.style.display="block",t.scrollIntoView({behavior:"smooth",block:"center"}),r.addEventListener("click",()=>{navigator.clipboard.writeText(a).then(()=>{r.textContent="✓ Copiado",r.classList.add("copied"),setTimeout(()=>{r.textContent="Copiar",r.classList.remove("copied")},2e3)})});const p=`👋 ¡Hola! Te comparto mi tarjeta profesional:

*${e.name}*
${e.profession}

🔗 ${a}`;c.href=`https://wa.me/?text=${encodeURIComponent(p)}`})}function u(s,e){s.innerHTML=y(e),v(s,e)}export{I as renderGalleryEditor};
