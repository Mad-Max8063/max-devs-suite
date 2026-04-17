const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./card-C7mr9vn4-v2029.js","./modulepreload-polyfill-B5Qt9EMX-v2029.js","./supabase-BW7mDqrU-v2029.js","./vendor-supabase-BW_Ct9fl-v2029.js","./vendor-CWnJSrkj-v2029.js","./card-yzqEvSC5-v2029.css"])))=>i.map(i=>d[i]);
import{g as P,f as U,u as E,h as j,_ as T}from"./card-C7mr9vn4-v2029.js";import{r as A,a as z,d as b,b as M}from"./utils-D2FUlLYF-v2029.js";import"./modulepreload-polyfill-B5Qt9EMX-v2029.js";import"./supabase-BW7mDqrU-v2029.js";import"./vendor-supabase-BW_Ct9fl-v2029.js";import"./vendor-CWnJSrkj-v2029.js";const $=["name","profession","description","phone","email","location","instagram","linkedin","website","bookingUrl"],S=160,B={name:"",profession:"",description:"",phone:"+54 ",email:"",location:"",instagram:"",linkedin:"",website:"",coverPhoto:"",bookingUrl:""};function q(o,u){let e=o.__editorData||{...B};o.__editorData=e;const c=e.coverPhoto?`background-image: url('${e.coverPhoto}'); background-size: cover; background-position: center;`:"";o.innerHTML=`
    <div class="editor-header">
      <h1>✨ Tu Tarjeta Virtual</h1>
      <p>Completá tus datos y compartí tu perfil profesional</p>
    </div>

    <form id="editor-form" autocomplete="off">
      <!-- Avatar -->
      <div class="avatar-upload">
        <label for="photo-input" class="avatar-preview" id="avatar-preview">
          <img src="${e.photo||"/card/assets/suito-logo.png"}" alt="Avatar" id="avatar-img">
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
        <label for="cover-input" class="cover-preview" id="cover-preview" style="${c}">
          <div class="cover-placeholder ${e.coverPhoto?"has-image":""}" id="cover-placeholder">
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
        ${e.coverPhoto?'<button type="button" class="btn-remove-cover" id="btn-remove-cover">✕ Quitar portada</button>':""}
      </div>

      <!-- Datos principales -->
      <div class="glass-card">
        <div class="form-section">
          <div class="section-label">Información principal</div>

          <div class="form-group">
            <label>Nombre completo <span class="required">*</span></label>
            <input type="text" id="field-name" placeholder="Ej: María González" value="${e.name||""}" required>
          </div>

          <div class="form-group">
            <label>Profesión / Especialidad <span class="required">*</span></label>
            <input type="text" id="field-profession" placeholder="Ej: Diseñadora UX/UI" value="${e.profession||""}" required>
          </div>

          <div class="form-group">
            <label>Descripción corta</label>
            <textarea id="field-description" placeholder="Ej: +5 años ayudando a empresas a diseñar productos digitales" maxlength="${S}">${e.description||""}</textarea>
            <div class="char-count"><span id="desc-count">${(e.description||"").length}</span>/${S}</div>
          </div>
        </div>
      </div>

      <!-- Contacto -->
      <div class="glass-card">
        <div class="form-section">
          <div class="section-label">Datos de contacto</div>

          <div class="form-group">
            <label>Teléfono <span class="required">*</span></label>
            <input type="tel" id="field-phone" placeholder="Ej: +54 11 1234-5678" value="${e.phone||""}" required>
          </div>

          <div class="form-group">
            <label>Email</label>
            <input type="email" id="field-email" placeholder="Ej: maria@ejemplo.com" value="${e.email||""}">
          </div>

          <div class="form-group">
            <label>Ubicación</label>
            <input type="text" id="field-location" placeholder="Ej: Buenos Aires, Argentina" value="${e.location||""}">
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
              <input type="text" id="field-instagram" placeholder="tu.usuario" value="${e.instagram||""}">
            </div>
          </div>

          <div class="form-group">
            <label>LinkedIn</label>
            <input type="url" id="field-linkedin" placeholder="https://linkedin.com/in/tuusuario" value="${e.linkedin||""}">
          </div>

          <div class="form-group">
            <label>Sitio web</label>
            <input type="url" id="field-website" placeholder="https://tuportfolio.com" value="${e.website||""}">
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
              <input type="url" id="field-bookingUrl" placeholder="https://gestor-de-turnos.pages.dev/#/tu-negocio/booking" value="${e.bookingUrl||""}" style="flex: 1;">
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
              ${(e.gallery||[]).map((a,t)=>{const r=typeof a=="string"?a:a.src,l=typeof a=="string"?"":a.caption||"";return`
                <div class="gallery-thumb-wrapper" data-index="${t}">
                  <div class="gallery-thumb">
                    <img src="${r}" alt="Trabajo ${t+1}">
                    <button type="button" class="gallery-remove" data-index="${t}">✕</button>
                  </div>
                  <input type="text" class="gallery-caption-input" data-index="${t}" 
                    placeholder="Ej: Instalación de aire split" value="${l}" maxlength="60">
                </div>
              `}).join("")}
              ${(e.gallery||[]).length<4?`
                <label for="gallery-input" class="gallery-add-btn">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  <span>Agregar</span>
                </label>
              `:""}
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
  `;const _=o.querySelector("#photo-input"),L=o.querySelector("#avatar-img");_.addEventListener("change",async a=>{const t=a.target.files[0];if(!t)return;const r=await A(t,200);L.src=r,e.photo=r});const h=o.querySelector("#cover-input"),g=o.querySelector("#cover-preview"),m=o.querySelector("#cover-placeholder");o.querySelector("#cover-overlay"),h.addEventListener("change",async a=>{const t=a.target.files[0];if(!t)return;const r=await z(t,480);if(e.coverPhoto=r,g.style.backgroundImage=`url('${r}')`,g.style.backgroundSize="cover",g.style.backgroundPosition="center",m.classList.add("has-image"),!o.querySelector("#btn-remove-cover")){const l=document.createElement("button");l.type="button",l.className="btn-remove-cover",l.id="btn-remove-cover",l.textContent="✕ Quitar portada",l.addEventListener("click",()=>C(e,g,m,l)),h.parentElement.appendChild(l)}});const y=o.querySelector("#btn-remove-cover");y&&y.addEventListener("click",()=>{C(e,g,m,y)}),$.forEach(a=>{const t=o.querySelector(`#field-${a}`);t&&t.addEventListener("input",()=>{e[a]=t.value,a==="description"&&(o.querySelector("#desc-count").textContent=t.value.length)})});const d=o.querySelector("#btn-detect-booking"),n=o.querySelector("#booking-status");d&&d.addEventListener("click",async()=>{d.disabled=!0,d.textContent="⏳",n.textContent="Buscando...",n.style.color="#6b7280";try{const a=(e.name||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9\s-]/g,"").replace(/\s+/g,"-").replace(/-+/g,"-").trim();if(!a){n.innerHTML="⚠️ Completá el nombre primero",n.style.color="#f59e0b",d.disabled=!1,d.textContent="🔍 Detectar";return}const t=P(),{data:r}=await t.from("businesses").select("slug, nombre_negocio").or(`slug.eq.${a},nombre_negocio.ilike.%${e.name}%`).limit(5);if(r&&r.length>0){const l=r[0],i=`https://gestor-de-turnos.pages.dev/#/${l.slug}/booking`,s=o.querySelector("#field-bookingUrl");s.value=i,e.bookingUrl=i,n.innerHTML=`✅ Conectado con <strong>${l.nombre_negocio}</strong>`,n.style.color="#22c55e"}else n.innerHTML='❌ No se encontró un Gestor de Turnos vinculado. <a href="https://gestor-de-turnos.pages.dev/#/register" target="_blank" style="color: #8b5cf6;">Crear cuenta →</a>',n.style.color="#ef4444"}catch{n.textContent="⚠️ Error al buscar. Podés pegar el link manualmente.",n.style.color="#f59e0b"}d.disabled=!1,d.textContent="🔍 Detectar"});const k=o.querySelector("#editor-form");k.addEventListener("submit",async a=>{if(a.preventDefault(),!e.name||!e.profession||!e.phone){F(o);return}const t=k.querySelector('button[type="submit"]');t.disabled=!0,t.innerHTML='<span class="spinner-sm"></span> Guardando...';try{const r=await U({name:e.name,profession:e.profession,description:e.description,phone:e.phone,email:e.email,location:e.location,instagram:e.instagram,linkedin:e.linkedin,website:e.website,booking_url:e.bookingUrl,photo_url:"",cover_url:""});let l="";if(e.photo&&e.photo.startsWith("data:")){const s=b(e.photo,"avatar.jpg");l=await E(s,r.id,"avatar")}let i="";if(e.coverPhoto&&e.coverPhoto.startsWith("data:")){const s=b(e.coverPhoto,"cover.jpg");i=await E(s,r.id,"cover")}if(l||i){const s={};l&&(s.photo_url=l),i&&(s.cover_url=i),await j(r.id,s)}if(e.gallery&&e.gallery.length>0){const{addGalleryImage:s,uploadImage:I}=await T(async()=>{const{addGalleryImage:p,uploadImage:v}=await import("./card-C7mr9vn4-v2029.js").then(f=>f.s);return{addGalleryImage:p,uploadImage:v}},__vite__mapDeps([0,1,2,3,4,5]),import.meta.url);for(let p=0;p<e.gallery.length;p++){const v=e.gallery[p];if(v.src&&v.src.startsWith("data:")){const f=b(v.src,`gallery-${p}.jpg`),D=await I(f,r.id,"gallery");await s(r.id,D,v.caption||"",p)}}}e._id=r.id,e._editToken=r.edit_token,e.photo=l,e.coverPhoto=i,u(e)}catch(r){console.error("Error saving card:",r),t.disabled=!1,t.innerHTML="👁 Previsualizar tarjeta",alert("Error al guardar. Revisá tu conexión e intentá de nuevo.")}});function x(){$.forEach(a=>{const t=o.querySelector(`#field-${a}`);t&&(e[a]=t.value)}),e.gallery&&o.querySelectorAll(".gallery-caption-input").forEach(a=>{const t=parseInt(a.dataset.index);e.gallery[t]&&(typeof e.gallery[t]=="string"&&(e.gallery[t]={src:e.gallery[t],caption:""}),e.gallery[t].caption=a.value)})}const w=o.querySelector("#gallery-input");w&&w.addEventListener("change",async a=>{const t=Array.from(a.target.files);if(!t.length)return;x(),e.gallery||(e.gallery=[]),e.gallery=e.gallery.map(i=>typeof i=="string"?{src:i,caption:""}:i);const r=4-e.gallery.length,l=t.slice(0,r);for(const i of l){const s=await M(i,300);e.gallery.push({src:s,caption:""})}q(o,u)}),o.querySelectorAll(".gallery-remove").forEach(a=>{a.addEventListener("click",t=>{t.preventDefault(),x();const r=parseInt(a.dataset.index);e.gallery&&(e.gallery.splice(r,1),q(o,u))})}),o.querySelectorAll(".gallery-caption-input").forEach(a=>{a.addEventListener("input",()=>{const t=parseInt(a.dataset.index);!e.gallery||!e.gallery[t]||(typeof e.gallery[t]=="string"&&(e.gallery[t]={src:e.gallery[t],caption:""}),e.gallery[t].caption=a.value)})})}function C(o,u,e,c){o.coverPhoto="",u.style.backgroundImage="",e.classList.remove("has-image"),c&&c.remove()}function F(o){["name","profession","phone"].forEach(e=>{const c=o.querySelector(`#field-${e}`);c.value.trim()||(c.style.borderColor="#ef4444",c.addEventListener("input",()=>{c.style.borderColor="transparent"},{once:!0}))})}function V(){return window.__lastEditorData||{}}export{V as getEditorData,q as initEditor};
