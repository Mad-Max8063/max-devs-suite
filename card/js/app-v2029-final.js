// ============================================
// app.js — Main router & app orchestration
// ============================================

import { getCard } from './supabase-v2029.js';
import { getSubscriptionStatus } from './engine-v2029.js';

window.__appRouterActive = true;
const app = document.getElementById('app');

const resolveMasterToken = () => {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_MASTER_TOKEN) {
        return import.meta.env.VITE_MASTER_TOKEN;
    }

    console.warn('[Security] VITE_MASTER_TOKEN ausente en variables de entorno. Autenticación maestra denegada.');
    return null;
};

const MASTER_TOKEN = resolveMasterToken();

// --- PWA Nuclear Reset v2030 & Service Worker Registration ---
if ('serviceWorker' in navigator) {
    const RESET_KEY = 'suito_v2030_reset';

    if (!localStorage.getItem(RESET_KEY)) {
        Promise.all([
            navigator.serviceWorker.getRegistrations().then(regs =>
                Promise.all(regs.map(r => r.unregister()))
            ),
            caches.keys().then(names =>
                Promise.all(names.map(n => caches.delete(n)))
            )
        ]).then(() => {
            localStorage.setItem(RESET_KEY, Date.now().toString());
            window.location.reload();
        }).catch(() => {
            localStorage.setItem(RESET_KEY, 'failed');
            window.location.reload();
        });
    } else {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/card/sw-v2030.js', { scope: '/card/' })
                .then(reg => console.log('[PWA] SW v2030 registered:', reg.scope))
                .catch(err => console.error('[PWA] SW registration failed:', err));
        });
    }
}

function navigate() {
    const path = window.location.pathname;
    const search = window.location.search;

    // Clear container
    app.innerHTML = '';
    app.className = 'app-container';
    app.classList.remove('landing-mode');

    console.log('[Router] Path:', path);

    // Normalización de slug robusta: quita barra final y toma el último segmento
    // Esto soporta slugs con guiones y evita problemas con la profundidad de la URL
    const cleanPath = path.replace(/\/$/, "");
    const segments = cleanPath.split("/");
    const slug = segments.pop();

    const isEdit = segments.includes('edit');
    const isCard = segments.includes('card') || (segments.length === 0 && slug !== '');

    if (isEdit && slug) {
        // — Gallery edit mode —
        const cardId = slug;
        const params = new URLSearchParams(search);
        const token = params.get('token') || '';
        if (token && token !== MASTER_TOKEN) {
            localStorage.setItem('last_card_url', `edit/${cardId}?token=${token}`);
        } else {
            localStorage.setItem('last_card_url', `card/${cardId}`);
        }

        app.innerHTML = `
            <div class="loading-screen" style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; background:#121212; position:relative; overflow:hidden;">
                {/* Mesh Background Decorative */}
                <div style="position:fixed; inset:0; background-image: radial-gradient(at 20% 0%, rgba(212, 175, 55, 0.1) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(184, 134, 11, 0.05) 0px, transparent 50%); filter:blur(60px); z-index:0;"></div>
                
                <div class="card-avatar-ring" style="width:100px; height:100px; margin-bottom:24px; animation: suito-pulse 2s infinite; border: 3px solid rgba(212, 175, 55, 0.3); background: #1E1E1E; border-radius: 50%; display:flex; align-items:center; justify-content:center; z-index:1; position:relative;">
                    <svg viewBox="15 15 90 90" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:70%; height:70%;">
                      <defs>
                        <linearGradient id="suitoGold" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stop-color="#D4AF37" />
                          <stop offset="50%" stop-color="#F9E498" />
                          <stop offset="100%" stop-color="#B8860B" />
                        </linearGradient>
                      </defs>
                      <circle cx="60" cy="60" r="45" stroke="url(#suitoGold)" stroke-width="4" />
                      <path d="M60 28V35M60 85V92M72 45C72 38 65 35 60 35C52 35 48 40 48 45C48 55 72 55 72 65C72 75 65 85 55 85C48 85 45 80 45 75" stroke="url(#suitoGold)" stroke-width="6" stroke-linecap="round" />
                    </svg>
                </div>
                <h2 style="color:#D4AF37; font-size:1.8rem; margin-bottom:8px; font-weight:900; letter-spacing:-0.05em; z-index:1; position:relative;">Suito Editor</h2>
                <div class="spinner" style="border-top-color:#D4AF37; width:24px; height:24px; border-width:3px; z-index:1; position:relative;"></div>
                <p style="color:rgba(255,255,255,0.5); margin-top:16px; font-weight:600; font-size:0.9rem; z-index:1; position:relative;">Preparando tu panel mágico...</p>
            </div>
            <style>
                @keyframes suito-pulse {
                    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(212, 175, 55, 0.3); }
                    70% { transform: scale(1); box-shadow: 0 0 0 20px rgba(212, 175, 55, 0); }
                    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(212, 175, 55, 0); }
                }
            </style>
        `;

        getCard(cardId).then(card => {
            if (!card) {
                app.innerHTML = `
                    <div style="text-align:center; padding:60px 20px;">
                      <h2 style="margin-bottom:8px;">Tarjeta no encontrada</h2>
                      <p style="color:var(--text-secondary);">Esta tarjeta no existe o el link está dañado.</p>
                    </div>`;
                return;
            }

            if (!token && token !== MASTER_TOKEN) {
                app.innerHTML = `
                    <div style="text-align:center; padding:60px 20px;">
                      <h2 style="margin-bottom:8px;">🔒 Acceso denegado</h2>
                      <p style="color:var(--text-secondary);">No tenés permiso para editar esta tarjeta.</p>
                    </div>`;
                return;
            }

            // edit_token is intentionally absent from public reads. Pass the URL
            // token to SECURITY DEFINER RPCs, which validate it before writes.
            card.edit_token = token;

            const editView = document.createElement('div');
            editView.className = 'view active';
            app.innerHTML = '';
            app.appendChild(editView);

            // Premium/Trial clients get full editing panel; basic clients get gallery-only
            const status = getSubscriptionStatus(card);
            const isPremium = status === 'premium';
            const panelModule = isPremium
                ? import('./client-panel.js')
                : import('./gallery-editor.js');

            panelModule.then((mod) => {
                if (isPremium) {
                    mod.renderClientPanel(editView, card);
                } else {
                    mod.renderGalleryEditor(editView, card);
                }
            }).catch(err => {
                console.error('[Router] Error loading editor:', err);
                app.innerHTML = '<div class="error-container">Error cargando el editor. Reintentá.</div>';
            });
        });

    } else if (isCard && slug) {
        // — Landing mode: fetch card from Supabase (fullscreen) —
        const cardId = slug;
        localStorage.setItem('last_card_url', `card/${cardId}`);
        app.classList.add('landing-mode');

        app.innerHTML = '<div class="loading-screen"><div class="spinner suito-favicon-coin"></div><p>Cargando tarjeta...</p></div>';

        getCard(cardId).then(card => {
            if (!card) {
                app.innerHTML = `
                    <div style="text-align:center; padding:60px 20px;">
                      <h2 style="margin-bottom:8px;">Tarjeta no encontrada</h2>
                      <p style="color:var(--text-secondary);">Esta tarjeta no existe o el link está dañado.</p>
                    </div>`;
                return;
            }

            try {
                const data = dbToAppFormat(card);
                updateMeta(data);

                const landingView = document.createElement('div');
                landingView.className = 'view active';
                app.innerHTML = '';
                app.appendChild(landingView);

                import('./engine-v2029.js').then((mod) => {
                    mod.renderLanding(landingView, data);
                }).catch(err => {
                    console.error('[Router] Error loading engine:', err);
                    app.innerHTML = '<div class="error-container">Error cargando el motor de diseño. Reintentá.</div>';
                });
            } catch (renderErr) {
                console.error('[Router] Render Error:', renderErr);
                app.innerHTML = `
                    <div style="text-align:center; padding:60px 20px;">
                        <h2 style="color: #ef4444; margin-bottom:8px;">Error de Carga</h2>
                        <p style="color:#9ca3af; margin-bottom: 20px;">${renderErr.message}</p>
                        <button onclick="window.location.reload()" style="padding:10px 20px;background:#8b5cf6;border:none;border-radius:8px;color:white;cursor:pointer;">
                            Reintentar
                        </button>
                    </div>`;
            }
        }).catch(fetchErr => {
            console.error('[Router] getCard failed:', fetchErr);
            app.innerHTML = `
                <div style="text-align:center; padding:60px 20px;">
                    <h2 style="color:#ef4444; margin-bottom:8px;">Sin conexión</h2>
                    <p style="color:#9ca3af; margin-bottom:20px;">No se pudo cargar la tarjeta. Verificá tu conexión.</p>
                    <button onclick="window.location.reload()" style="padding:10px 20px;background:#8b5cf6;border:none;border-radius:8px;color:white;cursor:pointer;">
                        Reintentar
                    </button>
                </div>`;
        });

    } else if (path === '/preview') {
        // — Preview mode: data from localStorage —
        const previewView = document.createElement('div');
        previewView.className = 'view active';
        app.appendChild(previewView);

        const data = window.__previewData || {};

        import('./engine-v2029.js').then((mod) => {
            mod.renderPreview(
                previewView,
                data,
                () => { navigateTo('/'); },
                () => { }
            );
        });

    } else {
        // — Editor mode (protected) —
        if (sessionStorage.getItem('editor_auth') === 'ok') {
            loadEditor();
        } else {
            // If user has a saved card (PWA opened from home screen), go to it
            const lastCard = localStorage.getItem('last_card_url');
            if (lastCard) {
                navigateTo(lastCard);
                return;
            }
            showPasswordGate();
        }
    }
}

// SHA-256 hash of the admin password
const ADMIN_HASH = 'ca74a826607abd0b1777146954a4040b05d19dc5eb34ea07ce483b96f4bb23ef';

async function hashPassword(pwd) {
    const data = new TextEncoder().encode(pwd);
    const buf = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function showPasswordGate() {
    app.innerHTML = `
      <div class="password-gate">
        <div class="gate-card">
          <div class="gate-icon" style="width:48px; height:48px; margin: 0 auto;">
            <svg viewBox="15 15 90 90" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%; height:100%;">
               <defs>
                 <linearGradient id="suitoGold" x1="0%" y1="0%" x2="100%" y2="100%">
                   <stop offset="0%" stop-color="#D4AF37" />
                   <stop offset="50%" stop-color="#F9E498" />
                   <stop offset="100%" stop-color="#B8860B" />
                 </linearGradient>
               </defs>
               <circle cx="60" cy="60" r="45" stroke="url(#suitoGold)" stroke-width="4" />
               <path d="M60 28V35M60 85V92M72 45C72 38 65 35 60 35C52 35 48 40 48 45C48 55 72 55 72 65C72 75 65 85 55 85C48 85 45 80 45 75" stroke="url(#suitoGold)" stroke-width="6" stroke-linecap="round" />
            </svg>
          </div>
          <h2>Acceso restringido</h2>
          <p>Ingresá el código de acceso para crear tarjetas</p>
          <form id="gate-form" autocomplete="off">
            <input type="password" id="gate-password" placeholder="Código de acceso" autocomplete="off" required>
            <div class="gate-error" id="gate-error" style="display:none;">Código incorrecto</div>
            <button type="submit" class="btn btn-primary">Ingresar</button>
          </form>
          <div class="gate-footer">
            <a href="https://wa.me/5491162621406?text=${encodeURIComponent('Hola! Me interesa sumarme al ecosistema Suito y crear mi propia Suite.')}" target="_blank" rel="noopener">
              ¿Querés tu Suite? Contactanos
            </a>
          </div>
        </div>
      </div>`;

    document.getElementById('gate-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const pwd = document.getElementById('gate-password').value;
        const hash = await hashPassword(pwd);

        if (hash === ADMIN_HASH) {
            sessionStorage.setItem('editor_auth', 'ok');
            loadEditor();
        } else {
            const errorEl = document.getElementById('gate-error');
            errorEl.style.display = 'block';
            document.getElementById('gate-password').value = '';
            document.getElementById('gate-password').focus();
        }
    });
}

function loadEditor() {
    app.innerHTML = '';
    const editorView = document.createElement('div');
    editorView.className = 'view active';
    app.appendChild(editorView);

    import('./editor.js').then((mod) => {
        window.__editorModule = mod;
        mod.initEditor(editorView, (data) => {
            window.__previewData = data;
            navigateTo('/preview');
        });
    });
}

// Transform Supabase DB format → app display format
function dbToAppFormat(card) {
    // Ya viene formateado desde getCard de supabase.js para Suito
    return card;
}

// Client-side navigation
export function navigateTo(path) {
    window.history.pushState({}, '', path);
    navigate();
}

function updateMeta(data) {
    document.title = `${data.name} — ${data.profession}`;
    setMetaTag('og:title', `${data.name} — ${data.profession}`);
    setMetaTag('og:description', data.description || `Contactá a ${data.name}`);
    setMetaTag('og:type', 'profile');
    setMetaTag('og:image', `${window.location.origin}/api/og/${data.slug || ''}`);
    setNamedMetaTag('theme-color', data.primary_color || data.color_primario || '#D4AF37');
}

function setMetaTag(property, content) {
    let tag = document.querySelector(`meta[property="${property}"]`);
    if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('property', property);
        document.head.appendChild(tag);
    }
    tag.setAttribute('content', content);
}

function setNamedMetaTag(name, content) {
    let tag = document.querySelector(`meta[name="${name}"]`);
    if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('name', name);
        document.head.appendChild(tag);
    }
    tag.setAttribute('content', content);
}

// Listen for back/forward
window.addEventListener('popstate', navigate);

// Initial route
navigate();
