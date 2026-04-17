function k(e){const s=["BEGIN:VCARD","VERSION:3.0",`FN:${e.name||""}`,`N:${(e.name||"").split(" ").reverse().join(";")};;;`];if(e.profession&&(s.push(`ORG:${e.profession}`),s.push(`TITLE:${e.profession}`)),e.phone&&s.push(`TEL;TYPE=CELL:${e.phone}`),e.email&&s.push(`EMAIL;TYPE=INTERNET:${e.email}`),e.location&&s.push(`ADR;TYPE=WORK:;;${e.location};;;;`),e.website&&s.push(`URL:${e.website}`),e.instagram&&s.push(`X-SOCIALPROFILE;TYPE=instagram:https://instagram.com/${e.instagram.replace("@","")}`),e.linkedin&&s.push(`X-SOCIALPROFILE;TYPE=linkedin:${e.linkedin}`),e.description&&s.push(`NOTE:${e.description}`),e.photo&&e.photo.startsWith("data:image")){const t=e.photo.split(",")[1];t&&t.length<5e4&&s.push(`PHOTO;ENCODING=b;TYPE=JPEG:${t}`)}else e.photo&&e.photo.startsWith("https://")&&s.push(`PHOTO;VALUE=uri:${e.photo}`);return s.push("END:VCARD"),s.join(`\r
`)}function E(e){const s=k(e),t=new Blob([s],{type:"text/vcard;charset=utf-8"}),o=URL.createObjectURL(t),n=document.createElement("a");n.href=o,n.download=`${(e.name||"contacto").replace(/\s+/g,"_")}.vcf`,n.style.display="none",document.body.appendChild(n),n.click(),setTimeout(()=>{URL.revokeObjectURL(o),document.body.removeChild(n)},100)}function x(e,s){e.innerHTML=g(s),y(e,s),L(s),w()}function _(e,s,t,o){e.innerHTML=g(s),y(e,s);const n=document.createElement("button");n.className="btn-secondary",n.style.cssText="position:fixed;top:16px;left:16px;z-index:100;padding:8px 16px;border-radius:12px;",n.innerHTML='<span class="material-symbols-outlined">arrow_back</span> Volver',n.onclick=t,e.prepend(n)}function g(e){const s=e.name||"Sin nombre",t=e.profession||"",o=e.description||"";e.phone;const n=e.email||"",i=e.location||"",u=e.photo||e.photo_url||"",v=e.coverPhoto||e.cover_url||"",c=e.facebook||"",l=e.instagram||"",p=e.linkedin||"",d=e.website||"",f=e.bookingUrl||e.booking_url||"",$=e.isPremium||!1,b=e.gallery||[];return`
        <div class="card-container animate-fade-in">
            <!-- Cover & Avatar -->
            <div class="card-header">
                <div class="card-cover-wrapper">
                    ${v?`<img src="${v}" alt="Cover" class="card-cover">`:'<div class="card-cover" style="background:linear-gradient(135deg,#8B5CF6,#EC4899);height:200px;"></div>'}
                    <div class="card-cover-overlay"></div>
                </div>
                <div class="card-avatar-container">
                    <div class="card-avatar-ring">
                        ${u?`<img src="${u}" alt="${s}" class="card-avatar">`:`<div class="card-avatar" style="display:flex;align-items:center;justify-content:center;font-size:2rem;background:#f3e8ff;">${s.charAt(0)}</div>`}
                    </div>
                </div>
            </div>

            <!-- Profile Info -->
            <div class="card-body">
                <div class="card-profile-info">
                    <h1 class="card-name">${s}</h1>
                    <p class="card-title">${t}</p>
                    ${o?`<p class="card-bio">${o}</p>`:""}
                    ${i?`
                        <a href="${i.startsWith("http")?i:`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(i)}`}" target="_blank" class="card-location" style="text-decoration:none;">
                            <span class="material-symbols-outlined" style="pointer-events:none;">location_on</span>
                            <span style="pointer-events:none; text-decoration:underline; text-underline-offset:2px;">${i.startsWith("http")?"Ubicación / Mapa":i}</span>
                        </a>
                    `:""}
                </div>

                <!-- Quick Actions -->
                <div class="card-actions">
                    <button class="btn-primary" id="btn-save-contact" style="background: linear-gradient(135deg, #10b981, #059669);">
                        <span class="material-symbols-outlined">person_add</span>
                        Agendar
                    </button>
                    <button class="btn-secondary" onclick="navigator.share ? navigator.share({title:'${s}',url:window.location.href}).catch(()=>{}) : navigator.clipboard.writeText(window.location.href)">
                        <span class="material-symbols-outlined">share</span>
                        Compartir
                    </button>
                    <button id="install-btn" class="btn-secondary" style="display:none;">
                        <span class="material-symbols-outlined">download</span>
                        Instalar app
                    </button>
                </div>

                <!-- Contact Links -->
                ${(()=>{const m=(e.activeModules||e.active_modules||[]).includes("appointments"),h=f&&m;return n||l||c||p||d||h?`
                    <div class="card-section">
                        <div class="section-header">
                            <h2 class="section-title">Contacto</h2>
                        </div>
                        <div class="services-grid">
                            ${n?`<a href="mailto:${n}" class="service-card glass-card" style="text-decoration:none;"><span class="material-symbols-outlined">mail</span><p>${n}</p></a>`:""}
                            ${l?`<a href="https://instagram.com/${l}" target="_blank" class="service-card glass-card" style="text-decoration:none;"><span class="material-symbols-outlined">photo_camera</span><p>@${l}</p></a>`:""}
                            ${c?`<a href="${c}" target="_blank" class="service-card glass-card" style="text-decoration:none;"><span class="material-symbols-outlined">facebook</span><p>Facebook</p></a>`:""}
                            ${p?`<a href="${p}" target="_blank" class="service-card glass-card" style="text-decoration:none;"><span class="material-symbols-outlined">work</span><p>LinkedIn</p></a>`:""}
                            ${d?`<a href="${d}" target="_blank" class="service-card glass-card" style="text-decoration:none;"><span class="material-symbols-outlined">language</span><p>Web</p></a>`:""}
                            ${h?`<a href="${f}" target="_blank" class="service-card glass-card" style="text-decoration:none;"><span class="material-symbols-outlined">calendar_month</span><p>Agendar Turno</p></a>`:""}
                        </div>
                    </div>
                    `:""})()}

                <!-- Gallery -->
                ${b.length>0?`
                <div class="card-section">
                    <div class="section-header">
                        <h2 class="section-title">Galería</h2>
                    </div>
                    <div class="masonry-gallery">
                        ${b.map((a,m)=>`
                            <div class="gallery-item animate-fade-in" style="animation-delay: ${m*.1}s">
                                <img src="${a.src||a.url}" alt="${a.caption||a.title||""}" loading="lazy">
                                ${a.caption||a.title?`<div class="gallery-overlay"><span>${a.caption||a.title}</span></div>`:""}
                            </div>
                        `).join("")}
                    </div>
                </div>
                `:""}
            </div>

            <!-- Footer -->
            <footer class="card-footer">
                <div class="footer-divider"></div>
                ${!$||e.forceWatermark?`
                    <div class="suito-referral">
                        <p class="referral-text">¿Querés una tarjeta como esta?</p>
                        <a href="https://suito.pro?ref=card" target="_blank" class="referral-link">Obtené la tuya en Suito.pro</a>
                    </div>
                `:""}
                <div class="footer-brand">
                    <span class="footer-brand-name">Suito</span>
                    <span class="footer-brand-tagline">Luminous</span>
                </div>
            </footer>
        </div>
    `}function y(e,s){const t=e.querySelector("#btn-save-contact");t&&(t.onclick=()=>E(s))}function L(e){const s={name:e.nombre_negocio||e.name||"Tarjeta Digital",short_name:(e.nombre_negocio||e.name||"Tarjeta").slice(0,12),start_url:`/card/${e.slug}`,scope:"/card/",display:"standalone",background_color:"#fff3fe",theme_color:e.color_primario||"#8200e8",icons:[{src:"/card/assets/icon-192.png",sizes:"192x192",type:"image/png"},{src:"/card/assets/icon-512.png",sizes:"512x512",type:"image/png",purpose:"any maskable"}]},t=new Blob([JSON.stringify(s)],{type:"application/json"}),o=document.querySelector('link[rel="manifest"]');o&&(o.href=URL.createObjectURL(t))}let r=null;function w(){window.addEventListener("beforeinstallprompt",e=>{e.preventDefault(),r=e;const s=document.getElementById("install-btn");s&&(s.style.display="")}),window.addEventListener("appinstalled",()=>{const e=document.getElementById("install-btn");e&&(e.style.display="none"),r=null}),document.addEventListener("click",e=>{e.target.closest("#install-btn")&&r&&(r.prompt(),r.userChoice.then(()=>{r=null;const s=document.getElementById("install-btn");s&&(s.style.display="none")}))})}export{x as renderLanding,_ as renderPreview};
