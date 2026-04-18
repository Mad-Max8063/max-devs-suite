// ==========================================
// Landing — Lógica de Onboarding Suito
// ==========================================
import { supabase } from '../shared/supabase.js';

// ——— DOM refs ———
const landingView    = document.getElementById('landing-view');
const onboardingView = document.getElementById('onboarding-view');
const successView    = document.getElementById('success-view');
const form           = document.getElementById('onboarding-form');
const sectionTarjeta = document.getElementById('section-tarjeta');
const sectionGestor  = document.getElementById('section-gestor');
const inputService   = document.getElementById('selected-service');

// ——— URL params (viral referral links) ———
document.addEventListener('DOMContentLoaded', () => {
    const params  = new URLSearchParams(window.location.search);
    const service = params.get('service');
    const ref     = params.get('ref');

    if (service) {
        startOnboarding(service);
        if (ref) {
            window.localStorage.setItem('lead_ref', ref);
        }
    }
});

// ——— Navigation helpers ———
function showOnly(view) {
    [landingView, onboardingView, successView].forEach(v => {
        if (!v) return;
        v.classList.remove('active');
    });
    if (view) {
        view.classList.add('active');
        window.scrollTo(0, 0);
    }
}

// Las funciones startOnboarding y goBackToLanding ahora están inline en el HTML
// para prevenir ReferenceError si el módulo tarda en cargar.

// ——— UI Helpers ———
function showError(msg) {
    const form = document.getElementById('onboarding-form');
    if (!form) return;

    let errorDiv = document.getElementById('onboarding-error');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.id = 'onboarding-error';
        errorDiv.className = 'error-feedback-box';
        // Insertar antes del botón de submit
        const submitWrap = document.querySelector('.submit-wrap') || form.lastElementChild;
        form.insertBefore(errorDiv, submitWrap);
    }
    
    errorDiv.innerHTML = `
        <div class="error-content">
            <i class="fa-solid fa-circle-exclamation"></i>
            <p>${msg}</p>
        </div>
        <button type="button" class="wa-fallback-btn" onclick="window.goEmailFallback()">
            <span class="material-symbols-outlined text-sm align-middle mr-1">mail</span> Contactar por Email
        </button>
    `;
    errorDiv.style.display = 'block';
    errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function clearError() {
    const errorDiv = document.getElementById('onboarding-error');
    if (errorDiv) errorDiv.style.display = 'none';
}

window.goEmailFallback = function() {
    const name = document.getElementById('user-name')?.value || '';
    const plan = document.getElementById('selected-service')?.value || '';
    const subject = encodeURIComponent('Error en Registro - Suito');
    const body = encodeURIComponent(`Hola! Intenté registrarme en la web pero tuve un error. Mis datos:\n- Nombre: ${name}\n- Plan: ${plan}`);
    window.location.href = `mailto:hola@suito.pro?subject=${subject}&body=${body}`;
};

// ——— Form submit ———
if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearError();

        const submitBtn = document.getElementById('submit-btn');
        if (submitBtn) {
            submitBtn.textContent = 'Enviando... ⏳';
            submitBtn.disabled = true;
        }

        try {
            const service = inputService.value.toUpperCase();
            const rawName = document.getElementById('user-name').value;
            const phone   = document.getElementById('user-phone').value.trim();
            const email   = document.getElementById('user-email').value.trim();
            const origin  = window.localStorage.getItem('lead_ref') || 'Tráfico Orgánico';

            // Sanitización de nombre (eliminar espacios múltiples)
            const name = rawName.trim().replace(/\s+/g, ' ');

            // Validaciones básicas
            if (!name || name.length < 3) {
                showError('Por favor, ingresa tu nombre completo.');
                return;
            }
            if (!phone || phone.replace(/\D/g, '').length < 8) {
                showError('Por favor, ingresa un número de WhatsApp válido (mínimo 8 dígitos).');
                return;
            }

            // ——— Subida de imágenes ———
            let profileUrl = '';
            let coverUrl   = '';
            const BUCKET = 'images'; 

            const profileFile = document.getElementById('img-profile')?.files[0];
            if (profileFile) {
                const ext      = profileFile.name.split('.').pop();
                const fileName = `leads/profile_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
                const { error: uploadError } = await supabase.storage.from(BUCKET).upload(fileName, profileFile);
                if (!uploadError) {
                    profileUrl = supabase.storage.from(BUCKET).getPublicUrl(fileName).data.publicUrl;
                } else {
                    console.error('[Landing] Error upload perfil:', {
                        code: uploadError.code,
                        message: uploadError.message,
                        details: uploadError.details
                    });
                }
            }

            const coverFile = document.getElementById('img-cover')?.files[0];
            if (coverFile) {
                const ext      = coverFile.name.split('.').pop();
                const fileName = `leads/cover_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
                const { error: uploadError } = await supabase.storage.from(BUCKET).upload(fileName, coverFile);
                if (!uploadError) {
                    coverUrl = supabase.storage.from(BUCKET).getPublicUrl(fileName).data.publicUrl;
                } else {
                    console.error('[Landing] Error upload portada:', {
                        code: uploadError.code,
                        message: uploadError.message,
                        details: uploadError.details
                    });
                }
            }

            // ——— Datos por servicio ———
            let prof = '', ig = '', address = '', bname = '', bdep = '', bserv = '';

            if (service === 'TARJETA' || service === 'COMBO') {
                prof    = document.getElementById('card-prof')?.value.trim() || '';
                ig      = document.getElementById('card-ig')?.value.trim() || '';
                address = document.getElementById('card-address')?.value.trim() || '';
            }

            if (service === 'GESTOR' || service === 'COMBO') {
                bname = document.getElementById('biz-name')?.value.trim() || '';
                bdep  = document.getElementById('biz-deposit')?.value?.trim() || '';
                bserv = document.getElementById('biz-service')?.value.trim() || '';
            }

            // ——— Guardar lead en Supabase ———
            const { error: insertError } = await supabase.from('leads').insert([{
                name,
                phone,
                email,
                service_type:    service,
                profile_img_url: profileUrl || null,
                cover_img_url:   coverUrl   || null,
                details: {
                    profession:      prof,
                    instagram:       ig,
                    address,
                    business_name:   bname,
                    deposit:         bdep,
                    primary_service: bserv,
                    origin,
                },
                status: 'pending'
            }]);

            if (insertError) {
                console.error('[Landing] Error Supabase Lead Insert:', {
                    code: insertError.code,
                    message: insertError.message,
                    details: insertError.details
                });
                throw new Error('DATABASE_ERROR');
            }

            // ——— Mostrar pantalla de éxito ———
            showOnly(successView);
            form.reset();

        } catch (err) {
            console.error('[Landing] Catch Error:', err);
            showError('Hubo un problema al procesar tu solicitud. Podés intentarlo de nuevo o escribirnos por Email.');
        } finally {
            if (submitBtn) {
                submitBtn.textContent = 'Enviar Solicitud 🚀';
                submitBtn.disabled = false;
            }
        }
    });
}
