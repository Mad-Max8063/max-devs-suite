// ============================================
// app.js — Main router & app orchestration
// ============================================

import { getCard } from './supabase.js';

window.__appRouterActive = true;
const app = document.getElementById('app');

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
        localStorage.setItem('last_card_url', `edit/${cardId}?token=${token}`);

        app.innerHTML = '<div class="loading-screen"><div class="spinner"></div><p>Cargando editor...</p></div>';

        getCard(cardId).then(card => {
            if (!card) {
                app.innerHTML = `
                    <div style="text-align:center; padding:60px 20px;">
                      <h2 style="margin-bottom:8px;">Tarjeta no encontrada</h2>
                      <p style="color:var(--text-secondary);">Esta tarjeta no existe o el link está dañado.</p>
                    </div>`;
                return;
            }

            if (card.edit_token !== token) {
                app.innerHTML = `
                    <div style="text-align:center; padding:60px 20px;">
                      <h2 style="margin-bottom:8px;">🔒 Acceso denegado</h2>
                      <p style="color:var(--text-secondary);">No tenés permiso para editar esta tarjeta.</p>
                    </div>`;
                return;
            }

            const editView = document.createElement('div');
            editView.className = 'view active';
            app.innerHTML = '';
            app.appendChild(editView);

            import('./gallery-editor.js').then((mod) => {
                mod.renderGalleryEditor(editView, card);
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

        app.innerHTML = '<div class="loading-screen"><div class="spinner"></div><p>Cargando tarjeta...</p></div>';

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
                // Transform DB format to app format
                const data = dbToAppFormat(card);
                updateMeta(data);

                const landingView = document.createElement('div');
                landingView.className = 'view active';
                app.innerHTML = '';
                app.appendChild(landingView);

                // Usamos la ruta absoluta del build para evitar errores de profundidad en Hostinger
                import('/card/js/card.js').then((mod) => {
                    mod.renderLanding(landingView, data);
                }).catch(async (err) => {
                    console.warn('[Router] Absolute import failed, trying fallback...', err);
                    try {
                        const mod = await import('./card.js');
                        mod.renderLanding(landingView, data);
                    } catch (fallbackErr) {
                        console.error('[Router] All imports failed:', fallbackErr);
                        throw fallbackErr;
                    }
                });
            } catch (renderErr) {
                console.error('[Router] Render Error:', renderErr);
                app.innerHTML = `
                    <div style="text-align:center; padding:60px 20px; color: white;">
                        <h2 style="margin-bottom:8px; color: #ef4444;">Error de Carga (v7)</h2>
                        <p style="color:#9ca3af; margin-bottom: 20px;">No se pudo renderizar el diseño de la tarjeta.</p>
                        <div style="font-family: monospace; font-size: 0.7rem; background: #000; padding: 10px; border-radius: 8px; margin-bottom: 20px;">
                            ${renderErr.message}
                        </div>
                        <button onclick="window.location.reload()" style="padding: 10px 20px; background: #8b5cf6; border: none; border-radius: 8px; color: white; cursor: pointer;">
                            Reintentar
                        </button>
                    </div>`;
            }
        });

    } else if (path === '/preview') {
        // — Preview mode: data from localStorage —
        const previewView = document.createElement('div');
        previewView.className = 'view active';
        app.appendChild(previewView);

        const data = window.__previewData || {};

        import('./card.js').then((mod) => {
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
          <div class="gate-icon">🔒</div>
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

// Listen for back/forward
window.addEventListener('popstate', navigate);

// Initial route
navigate();
