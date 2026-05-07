// ==========================================
// Landing - Logica de Onboarding Suito
// ==========================================
import { supabase } from '../shared/supabase.js';

const landingView    = document.getElementById('landing-view');
const onboardingView = document.getElementById('onboarding-view');
const successView    = document.getElementById('success-view');
const form           = document.getElementById('onboarding-form');
const inputService   = document.getElementById('selected-service');
const AUTO_ONBOARD_ENABLED = import.meta.env.VITE_AUTO_ONBOARD_ENABLED === 'true';

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

    import('./pricing-loader.js?v=2.1').then(m => m.initDynamicPricing());
});

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

window.goEmailFallback = function() {
    const name = document.getElementById('user-name')?.value || '';
    const plan = document.getElementById('selected-service')?.value || '';
    const subject = encodeURIComponent('Error en Registro - Suito');
    const body = encodeURIComponent(`Hola! Intente registrarme en la web pero tuve un error. Mis datos:\n- Nombre: ${name}\n- Plan: ${plan}`);
    window.location.href = `mailto:hola@suito.pro?subject=${subject}&body=${body}`;
};

function showError(msg) {
    const form = document.getElementById('onboarding-form');
    if (!form) return;

    let errorDiv = document.getElementById('onboarding-error');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.id = 'onboarding-error';
        errorDiv.className = 'error-feedback-box';
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

function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = String(value || '');
    return div.innerHTML;
}

function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

function renderAutoOnboardingSuccess(result, service) {
    const successTitle = document.getElementById('success-title');
    const successMsg = document.getElementById('success-message');
    const betaRequested = result.beta_turnos_requested || service === 'TURNOS' || service === 'COMBO';

    if (successTitle) successTitle.textContent = 'Tu tarjeta ya esta activa';
    if (!successMsg) return;

    successMsg.innerHTML = `
      <span style="display:block;margin-bottom:18px;">
        Bienvenido/a a Suito. Tu tarjeta ya esta creada.
        Te mandamos el acceso privado al editor por email para confirmar que esa casilla es tuya.
      </span>
      <span style="display:grid;gap:10px;margin:18px 0;">
        <a href="${escapeHtml(result.card_url)}" target="_blank" rel="noopener" class="btn btn-gold" style="justify-content:center;">Ver mi tarjeta</a>
        <a href="${escapeHtml(result.whatsapp_url)}" target="_blank" rel="noopener" class="btn btn-ghost" style="justify-content:center;">Abrir instrucciones en WhatsApp</a>
      </span>
      <span style="display:block;color:var(--fg-dim);font-size:14px;line-height:1.55;">
        Revisa tu email para abrir el editor privado. Ahi podes completar tu descripcion, cargar foto y portada, revisar tu mensaje de WhatsApp y dejarla lista para compartir.
        ${betaRequested ? '<br><br>Tambien recibimos tu interes por la beta privada de turnos. No queda activada para todos automaticamente: te contactamos si tu caso encaja con la validacion actual.' : ''}
      </span>
    `;
}

function renderPendingLeadSuccess(service) {
    const successTitle = document.getElementById('success-title');
    const successMsg = document.getElementById('success-message');
    const betaRequested = service === 'TURNOS' || service === 'COMBO';

    if (successTitle) successTitle.textContent = betaRequested ? 'Postulacion recibida' : 'Solicitud recibida';
    if (!successMsg) return;

    successMsg.innerHTML = betaRequested
        ? 'Gracias por postularte a la beta privada. Revisamos tu caso y, si encaja con la validacion actual, te contactamos para avanzar.'
        : 'Recibimos tus datos. Te contactaremos para activar tu cuenta.';
}

if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearError();

        const submitBtn = document.getElementById('submit-btn');
        if (submitBtn) {
            submitBtn.textContent = 'Creando tu tarjeta...';
            submitBtn.disabled = true;
        }

        try {
            const rawService = inputService.value.toUpperCase();
            const service = rawService === 'GESTOR' ? 'TURNOS' : rawService;
            const rawName = document.getElementById('user-name').value;
            const phone = document.getElementById('user-phone').value.trim();
            const email = document.getElementById('user-email').value.trim();
            const origin = window.localStorage.getItem('lead_ref') || 'Trafico Organico';
            const name = rawName.trim().replace(/\s+/g, ' ');

            if (!name || name.length < 3) {
                showError('Por favor, ingresa tu nombre completo.');
                return;
            }
            if (!phone || phone.replace(/\D/g, '').length < 8) {
                showError('Por favor, ingresa un numero de WhatsApp valido (minimo 8 digitos).');
                return;
            }
            if (!isValidEmail(email)) {
                showError('Necesitamos un email valido para enviarte el acceso privado al editor.');
                return;
            }

            const bname = document.getElementById('biz-name')?.value.trim() || '';
            const occupation = document.getElementById('user-occupation')?.value.trim() || '';

            let profileUrl = '';
            let coverUrl = '';
            const BUCKET = 'images';

            const profileFile = document.getElementById('img-profile')?.files[0];
            if (profileFile) {
                const ext = profileFile.name.split('.').pop();
                const fileName = `leads/profile_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
                const { error: uploadError } = await supabase.storage.from(BUCKET).upload(fileName, profileFile);
                if (!uploadError) {
                    profileUrl = supabase.storage.from(BUCKET).getPublicUrl(fileName).data.publicUrl;
                } else {
                    console.error('[Landing] Error upload perfil:', uploadError);
                }
            }

            const coverFile = document.getElementById('img-cover')?.files[0];
            if (coverFile) {
                const ext = coverFile.name.split('.').pop();
                const fileName = `leads/cover_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
                const { error: uploadError } = await supabase.storage.from(BUCKET).upload(fileName, coverFile);
                if (!uploadError) {
                    coverUrl = supabase.storage.from(BUCKET).getPublicUrl(fileName).data.publicUrl;
                } else {
                    console.error('[Landing] Error upload portada:', uploadError);
                }
            }

            let ig = '', address = '', bdep = '', bserv = '';
            if (service === 'TARJETA' || service === 'COMBO') {
                ig = document.getElementById('card-ig')?.value.trim() || '';
                address = document.getElementById('card-address')?.value.trim() || '';
            }
            if (service === 'TURNOS' || service === 'COMBO') {
                bdep = document.getElementById('biz-deposit')?.value?.trim() || '';
                bserv = document.getElementById('biz-service')?.value.trim() || '';
            }

            const onboardingPayload = {
                    name,
                    phone,
                    email,
                    service,
                    business_name: bname,
                    profession: occupation,
                    instagram: ig,
                    address,
                    profile_img_url: profileUrl || '',
                    cover_img_url: coverUrl || '',
                    deposit: bdep,
                    primary_service: bserv,
                    origin,
            };

            if (AUTO_ONBOARD_ENABLED) {
                const { data: onboardingResult, error: onboardingError } = await supabase.functions.invoke('auto-onboard', {
                    body: onboardingPayload
                });

                if (onboardingError || !onboardingResult?.ok) {
                    console.error('[Landing] Auto onboarding error:', onboardingError || onboardingResult);
                    throw new Error(onboardingResult?.error || onboardingError?.message || 'AUTO_ONBOARD_ERROR');
                }

                renderAutoOnboardingSuccess(onboardingResult, service);
            } else {
                const { error: insertError } = await supabase.from('leads').insert([{
                    name,
                    phone,
                    email,
                    service_type: service,
                    profile_img_url: profileUrl || null,
                    cover_img_url: coverUrl || null,
                    details: {
                        profession: occupation,
                        instagram: ig,
                        address,
                        business_name: bname,
                        deposit: bdep,
                        primary_service: bserv,
                        origin,
                    },
                    status: 'pending'
                }]);

                if (insertError) {
                    console.error('[Landing] Error Supabase Lead Insert:', insertError);
                    throw new Error('DATABASE_ERROR');
                }

                renderPendingLeadSuccess(service);
            }

            showOnly(successView);
            form.reset();
        } catch (err) {
            console.error('[Landing] Catch Error:', err);
            showError('Hubo un problema al crear tu tarjeta. Podes intentarlo de nuevo o escribirnos por Email.');
        } finally {
            if (submitBtn) {
                submitBtn.textContent = 'Enviar Solicitud ->';
                submitBtn.disabled = false;
            }
        }
    });
}
