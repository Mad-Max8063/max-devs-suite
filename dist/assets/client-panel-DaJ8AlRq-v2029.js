import{s as r,g as m,r as A,a as q,d as f,b as $}from"./utils-D2FUlLYF-v2029.js";import{u as x,a as z,b as L,c as C,d as T,e as I}from"./card-C7mr9vn4-v2029.js";import"./modulepreload-polyfill-B5Qt9EMX-v2029.js";import"./supabase-BW7mDqrU-v2029.js";import"./vendor-supabase-BW_Ct9fl-v2029.js";import"./vendor-CWnJSrkj-v2029.js";function X(i,e){const t={_id:e.id,_token:e.edit_token||"",_slug:e.slug||e._id,name:e.name||"",profession:e.profession||"",description:e.description||"",phone:e.phone||"",email:e.email||"",location:e.location||"",instagram:e.instagram||"",facebook:e.facebook||"",linkedin:e.linkedin||"",website:e.website||"",bookingUrl:e.bookingUrl||e.booking_url||"",photo:e.photo||e.photo_url||"",coverPhoto:e.coverPhoto||e.cover_url||"",activeModules:e.activeModules||e.active_modules||["card"],isPremium:e.isPremium||e.is_premium||!1,gallery:(e.gallery_images||e.gallery||[]).map(a=>({id:a.id,src:a.image_url||a.src||"",caption:a.caption||""}))};i.innerHTML=M(t),G(i,t)}function M(i){return`
    <div class="card-container animate-fade-in" style="padding: 16px; min-height: 100dvh; background: transparent;">

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
      <div id="pwa-install-banner" style="display:none; background: rgba(255,255,255,0.75); backdrop-filter: blur(16px); border: 1px solid rgba(139,92,246,0.15); border-radius: 20px; padding: 14px 16px; margin-bottom: 16px; display: flex; align-items: center; gap: 12px; box-shadow: 0 4px 20px rgba(139,92,246,0.08);">
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
                    ${i.coverPhoto?`<img id="cp-cover-preview" src="${r(i.coverPhoto)}" alt="Portada" class="card-cover">`:'<div id="cp-cover-preview" class="card-cover"></div>'}
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
                            <img id="cp-avatar-preview" src="${r(i.photo)||"/card/assets/suito-logo.png"}" class="card-avatar">
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
              <label class="cp-label">Nombre / Negocio ${i.isPremium?' <span style="color:var(--accent-purple);font-size:10px;"><i class="fa-solid fa-lock"></i> Premium</span>':""}</label>
              <input class="cp-input" id="cp-name" type="text" value="${r(i.name)}" placeholder="Ej: Juan García" maxlength="60" ${i.isPremium?'disabled style="opacity: 0.6; cursor: not-allowed;" title="Premium: Por seguridad, contactanos para cambiar esto"':""}>

              <label class="cp-label">Profesión / Especialidad ${i.isPremium?' <span style="color:var(--accent-purple);font-size:10px;"><i class="fa-solid fa-lock"></i> Premium</span>':""}</label>
              <input class="cp-input" id="cp-profession" type="text" value="${r(i.profession)}" placeholder="Ej: Diseñador Gráfico" maxlength="60" ${i.isPremium?'disabled style="opacity: 0.6; cursor: not-allowed;" title="Premium: Por seguridad, contactanos para cambiar esto"':""}>

              ${i.isPremium?`
              <div style="background: rgba(139, 92, 246, 0.1); border: 1px dashed var(--accent-purple); border-radius: 8px; padding: 12px; margin-bottom: 16px; font-size: 11px; color: var(--text-muted); line-height: 1.4;">
                <i class="fa-solid fa-circle-info" style="color: var(--accent-purple);"></i> Tu identidad está protegida. Si cambiaste de negocio o vas a ceder tu tarjeta Premium, contactanos a <b>hola@suito.pro</b> (aplica descuento por traspaso).
              </div>
              `:""}

              <label class="cp-label">Descripción breve</label>
              <textarea class="cp-input" id="cp-description" rows="3" placeholder="Contá en pocas palabras qué hacés..." maxlength="160">${r(i.description)}</textarea>

              <label class="cp-label">WhatsApp (con código de país)</label>
              <input class="cp-input" id="cp-phone" type="tel" value="${r(i.phone)}" placeholder="+54 9 11 1234-5678">

              <label class="cp-label">Email</label>
              <input class="cp-input" id="cp-email" type="email" value="${r(i.email)}" placeholder="vos@tuempresa.com">

              <label class="cp-label">Ubicación</label>
              <input class="cp-input" id="cp-location" type="text" value="${r(i.location)}" placeholder="Ej: Buenos Aires, Argentina" maxlength="80">

              <label class="cp-label">Instagram (sin @)</label>
              <input class="cp-input" id="cp-instagram" type="text" value="${r(i.instagram)}" placeholder="tu.usuario" maxlength="60">

              <label class="cp-label">Facebook</label>
              <input class="cp-input" id="cp-facebook" type="text" value="${r(i.facebook)}" placeholder="https://facebook.com/tupagina" maxlength="100">

              <label class="cp-label">LinkedIn</label>
              <input class="cp-input" id="cp-linkedin" type="url" value="${r(i.linkedin)}" placeholder="https://linkedin.com/in/tuusuario" maxlength="200">

              <label class="cp-label">Sitio web</label>
              <input class="cp-input" id="cp-website" type="url" value="${r(i.website)}" placeholder="https://tuempresa.com">

              <!-- Module Toggle: Appointments -->
              <div class="cp-toggle-row" style="display:flex; align-items:center; justify-content:space-between; padding:16px 0; border-top: 1px solid rgba(255,255,255,0.08); margin-top:20px;">
                  <div style="flex:1; padding-right:12px;">
                      <label class="cp-label" style="margin-bottom:2px; display:block;">Gestor de Turnos</label>
                      <p style="font-size:11px; opacity:0.5; margin:0; line-height:1.3;">Activá el módulo si sos un profesional que da turnos online.</p>
                  </div>
                  <label class="cp-switch">
                      <input type="checkbox" id="cp-toggle-appointments" ${i.activeModules.includes("appointments")?"checked":""}>
                      <span class="cp-slider"></span>
                  </label>
              </div>

              <div id="cp-booking-section" style="${i.activeModules.includes("appointments")?"":"display:none;"} transition: all 0.3s ease;">
                <label class="cp-label">Link de Turnos</label>
                <input class="cp-input" id="cp-bookingUrl" type="url" value="${r(i.bookingUrl)}" placeholder="https://turnos.suito.pro/#/.../booking" maxlength="200">
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

      <!-- ═══ TAB: GALERÍA ═══ -->
      <div class="cp-panel" id="tab-gallery">
        <div class="glass-card">
          <div class="form-section">
            <div class="section-label">Fotos de trabajos</div>
            <p class="section-hint">Subí hasta 4 fotos y escribí una descripción de cada una. Tus clientes las van a ver en tu tarjeta.</p>

            <div class="gallery-upload">
              <div class="gallery-grid" id="cp-gallery-grid">
                ${S(i.gallery)}
                ${i.gallery.length<4?P():""}
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
              <input type="text" id="cp-share-url" readonly value="${m(i._slug)}">
              <button type="button" class="btn-copy" id="cp-copy-btn">Copiar</button>
            </div>
            <div class="ge-whatsapp-row" style="margin-top:16px;">
              <a id="cp-whatsapp-link" class="btn-whatsapp" target="_blank" rel="noopener"
                 href="https://wa.me/?text=${encodeURIComponent(`👋 ¡Hola! Te comparto mi tarjeta profesional:

*${i.name}*
${i.profession}

🔗 ${m(i._slug)}`)}">
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
    `}function S(i){return i.map((e,t)=>`
        <div class="gallery-thumb-wrapper" data-index="${t}">
          <div class="gallery-thumb">
            <img src="${e.src}" alt="${r(e.caption||"Trabajo "+(t+1))}">
            <button type="button" class="gallery-remove" data-index="${t}">✕</button>
          </div>
          <input type="text" class="gallery-caption-input" data-index="${t}"
            placeholder="Ej: Instalación de aire split" value="${r(e.caption||"")}" maxlength="60">
        </div>
    `).join("")}function P(){return`
        <label for="cp-gallery-input" class="gallery-add-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <span>Agregar</span>
        </label>
    `}function G(i,e){j(i),U(i),B(i,e),R(i,e),D(i,e),H(i,e)}function j(i){const e=i.querySelector("#pwa-install-banner"),t=i.querySelector("#btn-pwa-install");if(!e||!t)return;let a=null;window.addEventListener("beforeinstallprompt",l=>{l.preventDefault(),a=l,e.style.display="flex"}),t.addEventListener("click",async()=>{if(a){a.prompt();const{outcome:l}=await a.userChoice;l==="accepted"&&(e.style.display="none"),a=null}else e.innerHTML=`
              <div style="font-size: 24px;">📱</div>
              <div style="flex:1; font-size:12px; color: var(--text-muted); line-height:1.5;">
                En <b>Safari</b>: tocá <b>Compartir</b> → <b>"Agregar a pantalla de inicio"</b>.<br>
                En <b>Chrome</b>: tocá el menú ⋮ → <b>"Instalar app"</b>.
              </div>
            `}),window.matchMedia("(display-mode: standalone)").matches&&(e.style.display="none")}function U(i){i.querySelectorAll(".cp-tab").forEach(e=>{e.addEventListener("click",()=>{var t;i.querySelectorAll(".cp-tab").forEach(a=>a.classList.remove("active")),i.querySelectorAll(".cp-panel").forEach(a=>a.classList.remove("active")),e.classList.add("active"),(t=i.querySelector(`#tab-${e.dataset.tab}`))==null||t.classList.add("active")})})}function B(i,e){const t=i.querySelector("#cp-avatar-file");t==null||t.addEventListener("change",async s=>{var p;const n=(p=s.target.files)==null?void 0:p[0];if(!n)return;const o=await A(n,200);i.querySelector("#cp-avatar-preview").src=o,e._pendingAvatar=o});const a=i.querySelector("#cp-cover-file");a==null||a.addEventListener("change",async s=>{var c;const n=(c=s.target.files)==null?void 0:c[0];if(!n)return;const o=await q(n,480),p=i.querySelector("#cp-cover-preview");p.tagName==="IMG"?p.src=o:p.style.background=`url(${o}) center/cover`,e._pendingCover=o});const l=i.querySelector("#cp-save-profile");l==null||l.addEventListener("click",async()=>{var s,n,o,p,c,b,u,d,h,w,k;l.disabled=!0,l.textContent="⏳ Guardando...";try{if(e._pendingAvatar){const v=f(e._pendingAvatar,"avatar.jpg"),y=await x(v,e._id,"avatar");e.photo=y,delete e._pendingAvatar}if(e._pendingCover){const v=f(e._pendingCover,"cover.jpg"),y=await x(v,e._id,"cover");e.coverPhoto=y,delete e._pendingCover}await z(e._id,e._token,{nombre_negocio:((s=i.querySelector("#cp-name"))==null?void 0:s.value)||"",profession:((n=i.querySelector("#cp-profession"))==null?void 0:n.value)||"",description:((o=i.querySelector("#cp-description"))==null?void 0:o.value)||"",telefono:((p=i.querySelector("#cp-phone"))==null?void 0:p.value)||"",email:((c=i.querySelector("#cp-email"))==null?void 0:c.value)||"",location:((b=i.querySelector("#cp-location"))==null?void 0:b.value)||"",instagram:((u=i.querySelector("#cp-instagram"))==null?void 0:u.value)||"",facebook:((d=i.querySelector("#cp-facebook"))==null?void 0:d.value)||"",linkedin:((h=i.querySelector("#cp-linkedin"))==null?void 0:h.value)||"",website:((w=i.querySelector("#cp-website"))==null?void 0:w.value)||"",booking_url:((k=i.querySelector("#cp-bookingUrl"))==null?void 0:k.value)||""});const g=i.querySelector("#cp-profile-feedback");g.style.display="block",setTimeout(()=>{g.style.display="none"},3500)}catch(g){console.error("[ClientPanel] Save profile error:",g),alert("Error al guardar. Revisá tu conexión e intentá de nuevo.")}finally{l.disabled=!1,l.textContent="💾 Guardar cambios"}})}function R(i,e){const t=i.querySelector("#cp-gallery-input");t==null||t.addEventListener("change",async l=>{const s=Array.from(l.target.files||[]);if(!s.length)return;const n=4-e.gallery.length,o=s.slice(0,n);for(const p of o){const c=await $(p,300),b=f(c,p.name),u=await x(b,e._id,"gallery"),d=await L(e._id,e._token,u,"",e.gallery.length);e.gallery.push({id:d==null?void 0:d.id,src:u,caption:""})}E(i,e)}),_(i,e);const a=i.querySelector("#cp-save-captions");a==null||a.addEventListener("click",async()=>{i.querySelectorAll(".gallery-caption-input").forEach(l=>{const s=parseInt(l.dataset.index||"0");e.gallery[s]&&(e.gallery[s].caption=l.value)}),a.disabled=!0,a.innerHTML="⏳ Guardando...";try{for(const s of e.gallery)s.id&&s.caption!==void 0&&await C(s.id,e._id,e._token,s.caption);const l=i.querySelector("#cp-captions-feedback");l.style.display="block",setTimeout(()=>{l.style.display="none"},3e3)}catch(l){console.error("[ClientPanel] Save captions error:",l),alert("Error al guardar descripciones. Intentá de nuevo.")}finally{a.disabled=!1,a.innerHTML="💾 Guardar descripciones"}})}function _(i,e){i.querySelectorAll(".gallery-remove").forEach(t=>{t.addEventListener("click",async()=>{const a=parseInt(t.dataset.index||"0"),l=e.gallery[a];l!=null&&l.id&&await I(l.id,e._id,e._token),e.gallery.splice(a,1),E(i,e)})}),i.querySelectorAll(".gallery-caption-input").forEach(t=>{t.addEventListener("input",()=>{const a=parseInt(t.dataset.index||"0");e.gallery[a]&&(e.gallery[a].caption=t.value)})})}function E(i,e){const t=i.querySelector("#cp-gallery-grid");t&&(t.innerHTML=S(e.gallery)+(e.gallery.length<4?P():""),_(i,e))}function H(i,e){const t=i.querySelector("#cp-copy-btn");t==null||t.addEventListener("click",()=>{const a=m(e._slug);navigator.clipboard.writeText(a).then(()=>{t.textContent="✓ Copiado",t.classList.add("copied"),setTimeout(()=>{t.textContent="Copiar",t.classList.remove("copied")},2e3)})})}function D(i,e){const t=i.querySelector("#cp-toggle-appointments"),a=i.querySelector("#cp-booking-section");t==null||t.addEventListener("change",async()=>{const l=t.checked,s=e.activeModules||["card"],n=l?[...new Set([...s,"appointments"])]:s.filter(o=>o!=="appointments");t.disabled=!0;try{await T(e._id,e._token,n),e.activeModules=n,a&&(l?(a.style.display="block",setTimeout(()=>a.style.opacity="1",10)):(a.style.opacity="0",setTimeout(()=>a.style.display="none",300)))}catch(o){console.error("[ClientPanel] Module toggle error:",o),t.checked=!l,alert("No pudimos actualizar los módulos. Verificá tu conexión.")}finally{t.disabled=!1}})}export{X as renderClientPanel};
