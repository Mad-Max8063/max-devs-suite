import"./modulepreload-polyfill-B5Qt9EMX-v2029.js";import{s as p}from"./supabase-BW7mDqrU-v2029.js";import"./vendor-supabase-BW_Ct9fl-v2029.js";import"./vendor-CWnJSrkj-v2029.js";const $={supabase:{url:"https://bfsttdiokdqyvwjuvcbp.supabase.co",anonKey:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmc3R0ZGlva2RxeXZ3anV2Y2JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNzc1NDUsImV4cCI6MjA4Nzk1MzU0NX0.TqmEpfSlN25f9eZjw3ULIhJ0PiHAH3NuNCQEoESPD-w"},products:{tarjetaVirtual:"https://suito.pro/card",gestorTurnos:"https://suito.pro/turnos"},pricing:{tarjeta:{monthly:4900,quarterly:12500},turnos:{monthly:9900,quarterly:25e3},combo:{monthly:12900,quarterly:33e3}}},T="suito_clients";async function N(){const{data:{session:e}}=await p.auth.getSession();return e?e.user.id:null}async function D(e,{maxWidth:t=1200,maxHeight:n=1200,quality:o=.8}={}){return new Promise((a,i)=>{const s=new FileReader;s.readAsDataURL(e),s.onload=r=>{const d=new Image;d.src=r.target.result,d.onload=()=>{const u=document.createElement("canvas");let m=d.width,c=d.height;m>c?m>t&&(c*=t/m,m=t):c>n&&(m*=n/c,c=n),u.width=m,u.height=c,u.getContext("2d").drawImage(d,0,0,m,c),u.toBlob(v=>{a(v)},"image/jpeg",o)},d.onerror=i},s.onerror=i})}async function Z(e,t,n="images"){const{data:o,error:a}=await p.storage.from(n).upload(t,e,{contentType:"image/jpeg",upsert:!0});if(a)throw a;const{data:{publicUrl:i}}=p.storage.from(n).getPublicUrl(t);return i}function X(e){const t=document.getElementById("file-profile"),n=document.getElementById("file-cover"),o=document.getElementById("clientFotoUrl"),a=document.getElementById("clientCoverUrl"),i=async(s,r,d)=>{if(!s)return;const u=d.target.closest(".form-group").querySelector("button"),m=u.innerHTML;try{u.disabled=!0,u.innerHTML='<i class="fas fa-spinner fa-spin"></i>';const c=r==="profile"?{maxWidth:400,maxHeight:400,quality:.8}:{maxWidth:1200,maxHeight:800,quality:.7};e(`Procesando imagen de ${r}...`,"info");const f=await D(s,c),v=Date.now(),y=`admin/uploads/${r}_${v}.jpg`;e("Subiendo a la nube...","info");const b=await Z(f,y);r==="profile"?o.value=b:a.value=b,e("¡Imagen cargada y optimizada!","success")}catch(c){console.error("Upload error:",c),e("Error al subir la imagen: "+c.message,"error")}finally{u.disabled=!1,u.innerHTML=m}};t==null||t.addEventListener("change",s=>i(s.target.files[0],"profile",s)),n==null||n.addEventListener("change",s=>i(s.target.files[0],"cover",s))}function j(e){return{id:e.id,name:e.contact_name||e.nombre_negocio||"",business:e.nombre_negocio||"",whatsapp:e.telefono||"",email:e.email||"",slug:e.slug||"",plan:e.plan||"tarjeta",status:e.status||"active",is_premium:e.is_premium||!1,force_watermark:e.force_watermark||!1,card_id:e.slug||"",notes:e.notes||"",transfer_email:e.transfer_email||null,free_until:e.free_until||null,paid_until:e.paid_until||null,profession:e.profession||"",foto_url:e.foto_url||"",cover_url:e.cover_url||"",edit_token:e.edit_token||null,created_at:e.created_at}}function q(e,t=null){var a,i,s,r,d,u,m,c,f;const n={contact_name:((a=e.name)==null?void 0:a.trim())||null,nombre_negocio:((i=e.business)==null?void 0:i.trim())||((s=e.name)==null?void 0:s.trim())||"",telefono:((r=e.whatsapp)==null?void 0:r.trim())||"",email:((d=e.email)==null?void 0:d.trim())||"",slug:((u=e.slug)==null?void 0:u.trim())||"",plan:e.plan||"tarjeta",status:e.status||"active",is_premium:e.is_premium||!1,force_watermark:e.force_watermark||!1,notes:((m=e.notes)==null?void 0:m.trim())||null,transfer_email:((c=e.transfer_email)==null?void 0:c.trim())||null,free_until:e.free_until||null,paid_until:e.paid_until||null,profession:((f=e.profession)==null?void 0:f.trim())||null,foto_url:e.foto_url||null,cover_url:e.cover_url||null,gallery_images:e.gallery_images||[],edit_token:e.edit_token||Math.random().toString(36).substring(2,15)+Math.random().toString(36).substring(2,15)};return t&&(n.user_id=t),["active_modules","profession","instagram","location","valor_sena","fecha_vencimiento","notificaciones_email","recordatorios_activos","foto_url","cover_url"].forEach(v=>{e[v]!==void 0&&(n[v]=e[v])}),n}let B=!1;async function Q(){if(B)return;B=!0;const e=localStorage.getItem(T);if(!e)return;let t;try{t=JSON.parse(e)}catch(i){console.error("[Migration] Error parsing localStorage data:",i);return}if(!Array.isArray(t)||t.length===0){localStorage.removeItem(T);return}const n=await N();if(!n){B=!1;return}console.log(`[Migration] Migrating ${t.length} client(s) to businesses...`);const o=t.map(i=>q(i,n)),{error:a}=await p.from("businesses").insert(o);a?(console.error("[Migration] Insert failed (localStorage preserved):",a),B=!1):(console.log("[Migration] Success — purging localStorage."),localStorage.removeItem(T))}window.addEventListener("load",()=>setTimeout(Q,1200));async function E(){try{const{data:e,error:t}=await p.from("businesses").select("*").order("created_at",{ascending:!1});if(t)throw t;return(e??[]).map(j)}catch(e){return console.error("[clients] getClients error:",e),[]}}async function P(e){if(!await N())throw new Error("Usuario no autenticado");const n=q(e),{data:o,error:a}=await p.from("businesses").insert(n).select().single();if(a)throw console.error("[clients] addClient error:",a),a;return j(o)}async function Y(e,t){const n=q(t);Object.keys(n).forEach(i=>{n[i]===null&&t[i]===void 0&&delete n[i]}),console.log("[updateClient] Attempting update for ID:",e,"with data:",n);const{data:o,error:a}=await p.from("businesses").update(n).eq("id",e).select();if(a)throw console.error("[clients] updateClient error details:",a),a;return!o||o.length===0?(console.warn("[clients] updateClient: No rows were updated. Check RLS or ID."),null):j(o[0])}async function K(e){const{error:t}=await p.from("businesses").delete().eq("id",e);if(t)throw console.error("[clients] deleteClient error:",t),t;return!0}async function ee(){const e=await E();return{total:e.length,active:e.filter(t=>t.status==="active").length,tarjeta:e.filter(t=>t.plan==="tarjeta").length,turnos:e.filter(t=>t.plan==="turnos").length,combo:e.filter(t=>t.plan==="combo").length}}async function te(){try{const{data:e,error:t}=await p.from("pricing").select("id, monthly, quarterly");if(t)throw t;if(!e||e.length===0)throw new Error("No pricing rows");const n={};if(e.forEach(o=>{n[o.id]={monthly:Number(o.monthly),quarterly:Number(o.quarterly)}}),!n.tarjeta||!n.turnos||!n.combo)throw new Error("Incomplete pricing data");return n}catch(e){return console.warn("[pricing] Fallback to config.js:",e.message),{...$.pricing}}}async function ne(e){const t=["tarjeta","turnos","combo"];for(const n of t){const{error:o}=await p.from("pricing").update({monthly:e[n].monthly,quarterly:e[n].quarterly}).eq("id",n);if(o)throw new Error(`Error updating ${n}: ${o.message}`)}}function ae(e,t){const n=1+t/100,o=i=>Math.round(i*n/50)*50,a={};for(const i of["tarjeta","turnos","combo"])a[i]={monthly:o(e[i].monthly),quarterly:o(e[i].quarterly)};return a}console.log("cachebust-v2029-FINAL");let C="dashboard",S="all",I=null,w=null;const M=new Map;document.addEventListener("DOMContentLoaded",async()=>{w=await te(),oe(),me(),X(g),re(),le(),pe(),await _(),ge()});function oe(){document.querySelectorAll(".nav-links li").forEach(e=>{e.addEventListener("click",t=>{t.preventDefault();const n=e.dataset.section;A(n)})}),document.querySelectorAll("[data-goto]").forEach(e=>{e.addEventListener("click",t=>{t.preventDefault(),A(e.dataset.goto)})})}async function A(e){C=e,document.querySelectorAll(".nav-links li").forEach(n=>{n.classList.toggle("active",n.dataset.section===e)}),document.querySelectorAll(".section-content").forEach(n=>{n.style.display="none"});const t=document.getElementById(`section-${e}`);t&&(t.style.display="block",t.style.animation="fadeSlideIn 0.4s ease"),document.getElementById("sidebar").classList.remove("open"),e==="dashboard"&&await _(),e==="clients"&&await k(),e==="leads"&&await R(),e==="pricing"&&U()}async function _(){await ie(),x(),await se()}async function ie(){const e=document.getElementById("statsGrid");e.innerHTML='<div class="loading">Cargando estadísticas...</div>';try{const t=await ee();e.innerHTML=`
            <div class="stat-card">
                <div class="stat-icon purple"><i class="fa-solid fa-users"></i></div>
                <div class="stat-details">
                    <h3>Clientes Activos</h3>
                    <h2>${t.active}</h2>
                    <p class="trend info">${t.total} total registrados</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon blue"><i class="fa-solid fa-address-card"></i></div>
                <div class="stat-details">
                    <h3>Tarjetas Virtuales</h3>
                    <h2>${t.tarjeta+t.combo}</h2>
                    <p class="trend info">${t.tarjeta} solo + ${t.combo} en combo</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon green"><i class="fa-solid fa-calendar-check"></i></div>
                <div class="stat-details">
                    <h3>Gestores de Turno</h3>
                    <h2>${t.turnos+t.combo}</h2>
                    <p class="trend info">${t.turnos} solo + ${t.combo} en combo</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon gradient"><i class="fa-solid fa-layer-group"></i></div>
                <div class="stat-details">
                    <h3>Combos Vendidos</h3>
                    <h2>${t.combo}</h2>
                    <p class="trend info">${t.active>0?Math.round(t.combo/t.active*100):0}% adopción combo</p>
                </div>
            </div>
        `}catch(t){console.error("[renderStats] error:",t),e.innerHTML='<p class="error-text">Error al cargar estadísticas. Reintentá recargando la página.</p>'}}function x(){const e=w;document.getElementById("pricingQuickView").innerHTML=`
        <div class="price-item">
            <div class="price-info">
                <div class="price-icon blue-bg"><i class="fa-solid fa-address-card"></i></div>
                <div><h4>Tarjeta Virtual</h4><span>Mensual</span></div>
            </div>
            <div class="price-amount">$${e.tarjeta.monthly.toLocaleString("es-AR")}</div>
        </div>
        <div class="price-item">
            <div class="price-info">
                <div class="price-icon green-bg"><i class="fa-solid fa-calendar-check"></i></div>
                <div><h4>Gestor de Turnos</h4><span>Mensual</span></div>
            </div>
            <div class="price-amount">$${e.turnos.monthly.toLocaleString("es-AR")}</div>
        </div>
        <div class="price-item combo-highlight">
            <div class="price-info">
                <div class="price-icon gradient-bg"><i class="fa-solid fa-star"></i></div>
                <div>
                    <h4>Pack Emprendedor</h4>
                    <span class="discount-badge">Ahorro ~13%</span>
                </div>
            </div>
            <div class="price-amount">$${e.combo.monthly.toLocaleString("es-AR")}</div>
        </div>
    `}async function se(){const e=document.getElementById("recentClientsTable"),t=document.getElementById("emptyDashboard");e.innerHTML='<tr><td colspan="4" class="loading">Cargando clientes...</td></tr>';try{const o=(await E()).slice(0,5);if(o.length===0){e.innerHTML="",t.style.display="flex";return}t.style.display="none",e.innerHTML=o.map(a=>`
            <tr>
                <td>
                    <div class="client-cell">
                        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(a.business||a.name)}&background=${F(a.plan)}&color=fff&size=32" alt="${l(a.name)}">
                        <div>
                            <strong>${l(a.business||a.name)}</strong>
                            <small style="display:block;color:var(--text-muted);font-size:12px">${l(a.name)}</small>
                        </div>
                    </div>
                </td>
                <td><span class="badge-service ${l(a.plan)}">${G(a.plan)}</span></td>
                <td><span class="status ${l(a.status)}">${a.status==="active"?"Activo":"Inactivo"}</span></td>
                <td>
                    <button class="action-btn" onclick="window._editClient('${l(a.id)}')" title="Editar">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                </td>
            </tr>
        `).join("")}catch(n){console.error("[renderRecentClients] error:",n),e.innerHTML='<tr><td colspan="4" class="error-text">Error al cargar clientes recientes.</td></tr>'}}async function k(){const e=document.getElementById("clientsGrid"),t=document.getElementById("emptyClients");e.innerHTML='<div class="loading">Cargando clientes...</div>',t.style.display="none";try{let n=await E();const o=document.getElementById("searchInput").value.toLowerCase();if(S!=="all"&&(n=n.filter(a=>a.plan===S)),o&&(n=n.filter(a=>a.name.toLowerCase().includes(o)||a.business&&a.business.toLowerCase().includes(o)||a.email&&a.email.toLowerCase().includes(o))),n.length===0){e.innerHTML="",t.style.display="flex";return}t.style.display="none",e.innerHTML=n.map(a=>`
            <div class="client-card" data-plan="${l(a.plan)}">
                <div class="client-card-header">
                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(a.business||a.name)}&background=${F(a.plan)}&color=fff&size=48" alt="${l(a.name)}">
                    <div>
                        <h4>${l(a.business||a.name)}</h4>
                        <span class="badge-service ${l(a.plan)}">${G(a.plan)}</span>
                    </div>
                    <span class="status ${l(a.status)}">${a.status==="active"?"Activo":"Inactivo"}</span>
                </div>
                <div class="client-card-body">
                    <div class="client-detail"><i class="fa-solid fa-user"></i> ${l(a.name)}</div>
                    ${a.whatsapp?`<div class="client-detail"><i class="fa-brands fa-whatsapp"></i> ${l(a.whatsapp)}</div>`:""}
                    ${a.email?`<div class="client-detail"><i class="fa-solid fa-envelope"></i> ${l(a.email)}</div>`:""}
                    <div class="client-detail"><i class="fa-solid fa-link"></i> /${l(a.slug)}</div>
                    ${a.is_premium?'<div class="client-detail" style="color:var(--accent-purple);font-weight:600;"><i class="fa-solid fa-star"></i> Nivel Premium</div>':'<div class="client-detail text-muted"><i class="fa-regular fa-star"></i> Nivel Gratuito</div>'}
                    ${a.free_until?`<div class="client-detail highlight-text"><i class="fa-solid fa-gift"></i> Bonificado hasta: ${new Date(a.free_until).toLocaleDateString()}</div>`:""}
                    ${a.notes?`<div class="client-detail notes"><i class="fa-solid fa-sticky-note"></i> ${l(a.notes)}</div>`:""}
                </div>
                <div class="client-card-footer">
                    <div class="card-footer-actions">
                        ${a.plan!=="turnos"?`<a href="${$.products.tarjetaVirtual}/${l(a.card_id||a.slug)}" target="_blank" class="action-btn-link" title="Ver Tarjeta"><i class="fa-solid fa-address-card"></i></a>`:""}
                        ${a.plan!=="tarjeta"?`<a href="${$.products.gestorTurnos}/#/${l(a.slug)}" target="_blank" class="action-btn-link" title="Ver Turnos"><i class="fa-solid fa-calendar"></i></a>`:""}
                        <button class="action-btn-link purple" onclick="window._deliverClient('${l(a.id)}')" title="Entregar por WhatsApp"><i class="fa-solid fa-paper-plane"></i></button>
                        <button class="action-btn-link silver" onclick="window._copyLink('${l(a.id)}')" title="Copiar Link"><i class="fa-solid fa-copy"></i></button>
                    </div>
                    <div class="card-footer-manage">
                        <button class="action-btn" onclick="window._editClient('${l(a.id)}')" title="Editar"><i class="fa-solid fa-pen"></i></button>
                        <button class="action-btn danger" onclick="window._deleteClient('${l(a.id)}', '${l(a.business||a.name)}')" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
            </div>
        `).join("")}catch(n){console.error("[renderClients] error:",n),e.innerHTML='<p class="error-text">Error al cargar clientes. Reintentá recargando la página.</p>'}}function re(){document.querySelectorAll(".pill").forEach(e=>{e.addEventListener("click",()=>{document.querySelectorAll(".pill").forEach(t=>t.classList.remove("active")),e.classList.add("active"),S=e.dataset.filter,k()})})}function le(){document.getElementById("searchInput").addEventListener("input",()=>{C==="clients"&&k()})}function U(){var a,i;const e=w,t=(s,r,d,u,m,c="")=>`
        <div class="pricing-card${s==="combo"?" featured":""}">
            ${s==="combo"?'<div class="pricing-badge">MÁS POPULAR</div>':""}
            <div class="pricing-card-icon ${d}"><i class="fa-solid fa-${r}"></i></div>
            <h3>${u}</h3>
            <div class="pricing-edit-fields">
                <label>Mensual ($)
                    <input type="number" id="price-${s}-monthly" value="${e[s].monthly}" min="0" step="50" class="pricing-input">
                </label>
                <label>Trimestral ($)
                    <input type="number" id="price-${s}-quarterly" value="${e[s].quarterly}" min="0" step="50" class="pricing-input">
                </label>
            </div>
            ${c}
            <ul class="pricing-features">${m}</ul>
        </div>`,n=s=>`<li><i class="fa-solid fa-check"></i> ${s}</li>`,o=s=>`<li><i class="fa-solid fa-star" style="color:var(--accent-purple)"></i> ${s}</li>`;document.getElementById("pricingCards").innerHTML=t("tarjeta","address-card","blue-bg","Tarjeta Virtual",n("PWA instalable")+n("Compartir por WhatsApp")+n("Galería de imágenes")+n("Exportar contacto vCard")+n("Open Graph optimizado")+n("Editable en tiempo real"))+t("turnos","calendar-check","green-bg","Gestor de Turnos",n("Agenda inteligente")+n("Reserva online 24/7")+n("Integración MercadoPago")+n("Confirmación por WhatsApp")+n("Multi-tenant (slug único)")+n("Bloqueo de horarios"))+t("combo","star","gradient-bg","Pack Emprendedor",n("Todo de Tarjeta Virtual")+n("Todo de Gestor de Turnos")+o('Botón "Reservar" integrado')+o("Ecosistema unificado")+o("Soporte prioritario"),`<div class="pricing-savings">Ahorrás $${(e.tarjeta.monthly+e.turnos.monthly-e.combo.monthly).toLocaleString("es-AR")}/mes vs individual</div>`),(a=document.getElementById("btnSavePricing"))==null||a.addEventListener("click",ce),(i=document.getElementById("btnApplyInflation"))==null||i.addEventListener("click",de),ue()}async function ce(){const e=document.getElementById("btnSavePricing");e.disabled=!0,e.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';try{const t={tarjeta:{monthly:Number(document.getElementById("price-tarjeta-monthly").value),quarterly:Number(document.getElementById("price-tarjeta-quarterly").value)},turnos:{monthly:Number(document.getElementById("price-turnos-monthly").value),quarterly:Number(document.getElementById("price-turnos-quarterly").value)},combo:{monthly:Number(document.getElementById("price-combo-monthly").value),quarterly:Number(document.getElementById("price-combo-quarterly").value)}};await ne(t),w=t,U(),x(),g("Precios actualizados correctamente")}catch(t){console.error("[handleSavePricing]",t),g("Error al guardar precios. Revisá la consola.")}finally{e.disabled=!1,e.innerHTML='<i class="fa-solid fa-floppy-disk"></i> Guardar Precios'}}function de(){const e=document.getElementById("inflationPercent"),t=parseFloat(e.value);if(isNaN(t)||t<=0||t>100){g("Ingresá un porcentaje válido (ej: 3.4)");return}const n=ae(w,t);for(const o of["tarjeta","turnos","combo"])document.getElementById(`price-${o}-monthly`).value=n[o].monthly,document.getElementById(`price-${o}-quarterly`).value=n[o].quarterly;g(`Inflación del ${t}% aplicada. Revisá y hacé click en "Guardar Precios".`)}function ue(){const e=document.getElementById("clientPlan");if(!e)return;const t=w;e.innerHTML=`
        <option value="tarjeta">Tarjeta Virtual — $${t.tarjeta.monthly.toLocaleString("es-AR")}/mes</option>
        <option value="turnos">Gestor de Turnos — $${t.turnos.monthly.toLocaleString("es-AR")}/mes</option>
        <option value="combo">Pack Emprendedor — $${t.combo.monthly.toLocaleString("es-AR")}/mes</option>
    `}function me(){const e=document.getElementById("clientModal"),t=document.getElementById("clientForm");document.getElementById("btnNewClient").addEventListener("click",()=>H()),document.getElementById("modalClose").addEventListener("click",()=>L()),document.getElementById("modalCancel").addEventListener("click",()=>L()),e.addEventListener("click",n=>{n.target===e&&L()}),document.getElementById("clientName").addEventListener("input",n=>{const o=document.getElementById("clientSlug");I||(o.value=n.target.value.toLowerCase().replace(/\s+/g,"-").replace(/[^a-z0-9-]/g,""))}),t.addEventListener("submit",async n=>{n.preventDefault();const o={name:document.getElementById("clientName").value,business:document.getElementById("clientBusiness").value,whatsapp:document.getElementById("clientWhatsapp").value,email:document.getElementById("clientEmail").value,slug:document.getElementById("clientSlug").value,plan:document.getElementById("clientPlan").value,is_premium:document.getElementById("clientPremium").checked,force_watermark:document.getElementById("clientForceWatermark").checked,free_until:document.getElementById("clientFreeUntil").value||null,transfer_email:document.getElementById("clientTransferEmail").value||null,notes:document.getElementById("clientNotes").value,profession:document.getElementById("clientProfession").value||null,foto_url:document.getElementById("clientFotoUrl").value||null,cover_url:document.getElementById("clientCoverUrl").value||null};try{I?(await Y(I,o),g("Cliente actualizado ✅")):(await P(o),g("Cliente creado exitosamente 🎉")),L(),await _(),C==="clients"&&await k()}catch(a){g("Error al guardar cliente ❌"),console.error(a)}})}function H(e=null){const t=document.getElementById("clientModal");I=e?e.id:null,document.getElementById("modalTitle").textContent=e?"Editar Cliente":"Nuevo Cliente",document.getElementById("modalSubmitText").textContent=e?"Actualizar":"Guardar",document.getElementById("clientName").value=(e==null?void 0:e.name)||"",document.getElementById("clientBusiness").value=(e==null?void 0:e.business)||"",document.getElementById("clientWhatsapp").value=(e==null?void 0:e.whatsapp)||"",document.getElementById("clientEmail").value=(e==null?void 0:e.email)||"",document.getElementById("clientSlug").value=(e==null?void 0:e.slug)||"",document.getElementById("clientPlan").value=(e==null?void 0:e.plan)||"tarjeta",document.getElementById("clientPremium").checked=(e==null?void 0:e.is_premium)||!1,document.getElementById("clientForceWatermark").checked=(e==null?void 0:e.force_watermark)||!1,document.getElementById("clientFreeUntil").value=(e==null?void 0:e.free_until)||"",document.getElementById("clientTransferEmail").value=(e==null?void 0:e.transfer_email)||"",document.getElementById("clientNotes").value=(e==null?void 0:e.notes)||"",document.getElementById("clientProfession").value=(e==null?void 0:e.profession)||"",document.getElementById("clientFotoUrl").value=(e==null?void 0:e.foto_url)||"",document.getElementById("clientCoverUrl").value=(e==null?void 0:e.cover_url)||"";const n=document.getElementById("gallery-vcard-controls"),o=document.getElementById("btnOpenGalleryEditor"),a=document.getElementById("btnCopyEditorLink"),i=document.getElementById("copyLinkFeedback");if(e&&e.plan!=="turnos"){n.style.display="block";const s=()=>{const r=e.slug||e.id,d=e.edit_token;return d?`https://suito.pro/edit/${r}?token=${d}`:null};o.onclick=()=>{const r=s();r?window.open(r,"_blank"):alert("Este cliente no tiene un token de edición generado. Por favor guardá los cambios primero.")},a.onclick=()=>{const r=s();r?navigator.clipboard.writeText(r).then(()=>{i.style.display="block",setTimeout(()=>{i.style.display="none"},3e3)}).catch(()=>{prompt("Copiá este link y enviáselo al cliente:",r)}):alert("Este cliente no tiene un token de edición. Por favor guardá los cambios primero.")}}else n.style.display="none";t.classList.add("active"),document.getElementById("clientName").focus()}function L(){document.getElementById("clientModal").classList.remove("active"),I=null,document.getElementById("clientForm").reset()}window._editClient=async function(e){const n=(await E()).find(o=>o.id===e);n&&H(n)};window._deleteClient=async function(e,t){confirm(`¿Eliminar a "${t}"? Esta acción no se puede deshacer.`)&&(await K(e),g("Cliente eliminado"),await _(),C==="clients"&&await k())};function pe(){document.getElementById("hamburger").addEventListener("click",()=>{document.getElementById("sidebar").classList.add("open")}),document.getElementById("sidebarClose").addEventListener("click",()=>{document.getElementById("sidebar").classList.remove("open")})}function g(e){const t=document.getElementById("toastContainer"),n=document.createElement("div");n.className="toast",n.textContent=e,t.appendChild(n),requestAnimationFrame(()=>n.classList.add("show")),setTimeout(()=>{n.classList.remove("show"),setTimeout(()=>n.remove(),300)},3e3)}async function R(){const e=document.getElementById("leadsGrid"),t=document.getElementById("emptyLeads");e.innerHTML='<div class="loading">Cargando solicitudes...</div>',M.clear();try{const{data:n,error:o}=await p.from("leads").select("*").order("created_at",{ascending:!1});if(o)throw o;if(!n||n.length===0){e.innerHTML="",t.style.display="flex";return}t.style.display="none",n.forEach(a=>M.set(String(a.id),a)),e.innerHTML=n.map(a=>{var i,s,r;return`
            <div class="lead-card animate-fade-in">
                <div class="lead-header">
                    <div class="lead-user">
                        <img src="${a.profile_img_url||`https://ui-avatars.com/api/?name=${encodeURIComponent(a.name)}&background=6366f1&color=fff`}" alt="${l(a.name)}">
                        <div>
                            <h4>${l(a.name)}</h4>
                            <span class="lead-date">${new Date(a.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                    <span class="badge-service ${l(a.service_type.toLowerCase())}">${l(a.service_type)}</span>
                </div>
                <div class="lead-body">
                    <div class="lead-info"><strong>WhatsApp:</strong> ${l(a.phone)}</div>
                    <div class="lead-info"><strong>Negocio:</strong> ${l(((i=a.details)==null?void 0:i.business_name)||"No especificado")}</div>
                    <div class="lead-info"><strong>Profesión:</strong> ${l(((s=a.details)==null?void 0:s.profession)||"No especificada")}</div>
                    <div class="lead-info"><strong>Origen:</strong> ${l(((r=a.details)==null?void 0:r.origin)||"Directo")}</div>
                </div>
                <div class="lead-footer">
                    <button class="primary-btn sm"
                            data-lead-id="${l(String(a.id))}"
                            onclick="window._activateLead('${l(String(a.id))}')"
                            title="Activa al cliente y provisiona sus apps automáticamente">
                        <i class="fa-solid fa-bolt"></i> ⚡ Activar Cliente
                    </button>
                    <a href="https://wa.me/549${encodeURIComponent(a.phone)}" target="_blank" class="action-btn-link purple" title="Hablar por WhatsApp">
                        <i class="fa-brands fa-whatsapp"></i>
                    </a>
                </div>
            </div>
        `}).join("")}catch(n){console.error("[renderLeads] error:",n),e.innerHTML=`<p class="error-text">Error al cargar solicitudes: ${l(n.message)}</p>`}}async function ge(){try{const{count:e,error:t}=await p.from("leads").select("*",{count:"exact",head:!0});if(!t&&e>0){const n=document.getElementById("leadsBadge");n.textContent=e,n.style.display="inline-flex"}}catch(e){console.error("[checkNewLeads] error:",e)}}window._deliverClient=async function(e){const n=(await E()).find(u=>u.id===e);if(!n)return;const o="https://suito.pro",a=n.card_id||n.slug,i=n.plan==="tarjeta"||n.plan==="combo",s=n.plan==="turnos"||n.plan==="combo";let r=`¡Hola ${n.name}! 👋 Te escribo de *Suito*.

`;if(i&&(r+=`📇 *Tu Tarjeta Virtual:*
`,r+=`🔗 Ver: ${o}/card/${a}
`,n.edit_token&&(r+=`✏️ Editar (solo vos): ${o}/edit/${a}?token=${n.edit_token}
`),r+=`
`),s){if(!n.edit_token){g("⚠️ Este cliente no tiene edit_token — guardá los cambios antes de enviar el link.");return}r+=`📅 *Tu Gestor de Turnos:*
`,r+=`🔐 Crear contraseña (1ra vez): ${o}/turnos/#/register?slug=${a}&token=${n.edit_token}
`,r+=`📊 Tu panel: ${o}/turnos/#/${a}/
`,r+=`_Usá el mismo email con el que te registramos._

`}r+="¡Cualquier duda avisame! 💪";const d=`https://wa.me/549${n.whatsapp}?text=${encodeURIComponent(r)}`;window.open(d,"_blank")};window._copyLink=async function(e){const n=(await E()).find(i=>i.id===e);if(!n)return;const a=`${n.plan==="turnos"?$.products.gestorTurnos:$.products.tarjetaVirtual}/${n.plan==="turnos"?"#/":""}${n.card_id||n.slug}`;navigator.clipboard.writeText(a).then(()=>{g("Enlace copiado al portapapeles 📋")})};window._activateLead=async function(e){var o,a,i,s,r,d,u,m;const t=M.get(e);if(!t){g("❌ Lead no encontrado en caché");return}const n=document.querySelector(`[data-lead-id="${e}"]`);n&&(n.disabled=!0,n.innerHTML="⏳ Activando...");try{const c=t.service_type.toLowerCase(),f=(((o=t.details)==null?void 0:o.business_name)||t.name).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g,"-").replace(/[^a-z0-9-]/g,""),v=new Date;v.setDate(v.getDate()+30);const y=await P({name:t.name,business:((a=t.details)==null?void 0:a.business_name)||t.name,whatsapp:t.phone,email:t.email||"",slug:f,plan:c,status:"active",notes:`Activado desde lead #${t.id}. Profesión: ${((i=t.details)==null?void 0:i.profession)||"—"}. Origen: ${((s=t.details)==null?void 0:s.origin)||"—"}.`,foto_url:t.profile_img_url||"",cover_url:t.cover_img_url||"",profession:((r=t.details)==null?void 0:r.profession)||"",instagram:((d=t.details)==null?void 0:d.instagram)||"",location:((u=t.details)==null?void 0:u.address)||"",valor_sena:(m=t.details)!=null&&m.deposit?Number(t.details.deposit):2e3,is_premium:!1,fecha_vencimiento:v.toISOString().split("T")[0],notificaciones_email:!0,recordatorios_activos:!0,active_modules:c==="tarjeta"?["card"]:c==="turnos"?["appointments"]:["card","appointments"]});await p.from("leads").update({status:"converted",converted_at:new Date().toISOString()}).eq("id",e);const b="https://suito.pro",O=c==="tarjeta"||c==="combo",J=c==="turnos"||c==="combo";let h=`¡Hola ${t.name}! 🎉 Tu suite en *Suito* ya está activa. 🚀

`;if(O&&(h+=`📇 *Tu Tarjeta Virtual:*
`,h+=`🔗 Ver: ${b}/card/${f}
`,y!=null&&y.edit_token&&(h+=`✏️ Editar (solo vos): ${b}/edit/${f}?token=${y.edit_token}
`),h+=`
`),J){if(!(y!=null&&y.edit_token)){g("⚠️ El cliente se activó pero falta edit_token — no se envió link de registro.");return}h+=`📅 *Tu Gestor de Turnos:*
`,h+=`🔐 Crear contraseña (1ra vez): ${b}/turnos/#/register?slug=${f}&token=${y.edit_token}
`,h+=`📊 Tu panel: ${b}/turnos/#/${f}/
`,h+=`_Usá el mismo email con el que te registramos._

`}h+="¡Cualquier duda estoy acá! 💪";const W=`https://wa.me/549${t.phone.replace(/\D/g,"")}?text=${encodeURIComponent(h)}`;window.open(W,"_blank"),g(`✅ ${t.name} activado exitosamente`),await R(),await _()}catch(c){console.error("[_activateLead] error:",c),g("❌ Error al activar cliente. Revisá la consola."),n&&(n.disabled=!1,n.innerHTML='<i class="fa-solid fa-bolt"></i> ⚡ Activar Cliente')}};function F(e){return{tarjeta:"3b82f6",turnos:"10b981",combo:"8b5cf6"}[e]||"6366f1"}function G(e){return{tarjeta:"Tarjeta Virtual",turnos:"Gestor Turnos",combo:"Pack Emprendedor"}[e]||e}function l(e){return e==null?"":String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}document.addEventListener("DOMContentLoaded",async()=>{const{data:{session:e}}=await p.auth.getSession();e?V():z()});function V(){document.getElementById("login-overlay").style.display="none",document.querySelector(".dashboard-container").style.display="flex"}function z(){document.getElementById("login-overlay").style.display="flex",document.querySelector(".dashboard-container").style.display="none"}window.handleLogin=async function(e){e&&e.preventDefault();const t=document.getElementById("login-email").value,n=document.getElementById("login-password").value,o=document.getElementById("login-error"),a=document.getElementById("login-btn"),i=document.getElementById("login-btn-text");o.style.display="none",a.disabled=!0,i.textContent="Verificando...";const{error:s}=await p.auth.signInWithPassword({email:t,password:n});if(s){o.textContent="Credenciales inválidas. Verificá email y contraseña.",o.style.display="block",a.disabled=!1,i.textContent="Ingresar";return}V()};window.handleLogout=async function(){await p.auth.signOut(),z()};
