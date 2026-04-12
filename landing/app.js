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

// Exponer globalmente para los onclick del HTML
window.startOnboarding = function startOnboarding(serviceType) {
    inputService.value = serviceType;

    const isTarjeta = serviceType === 'tarjeta' || serviceType === 'combo';
    const isGestor  = serviceType === 'gestor'  || serviceType === 'combo';

    if (sectionTarjeta) {
        sectionTarjeta.style.display = isTarjeta ? 'block' : 'none';
        const cardProf = document.getElementById('card-prof');
        if (cardProf) cardProf.required = isTarjeta;
    }

    if (sectionGestor) {
        sectionGestor.style.display = isGestor ? 'block' : 'none';
        const bizName = document.getElementById('biz-name');
        if (bizName) bizName.required = isGestor;
    }

    showOnly(onboardingView);
};

window.goBackToLanding = function goBackToLanding() {
    showOnly(landingView);
};

// ——— Form submit ———
if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = document.getElementById('submit-btn');
        if (submitBtn) {
            submitBtn.textContent = 'Enviando... ⏳';
            submitBtn.disabled = true;
        }

        try {
            const service = inputService.value.toUpperCase();
            const name    = document.getElementById('user-name').value.trim();
            const phone   = document.getElementById('user-phone').value.trim();
            const email   = document.getElementById('user-email').value.trim();
            const origin  = window.localStorage.getItem('lead_ref') || 'Tráfico Orgánico';

            // ——— Subida de imágenes ———
            let profileUrl = '';
            let coverUrl   = '';

            const profileFile = document.getElementById('img-profile')?.files[0];
            if (profileFile) {
                const ext      = profileFile.name.split('.').pop();
                const fileName = `profile_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
                const { error } = await supabase.storage.from('leads-media').upload(fileName, profileFile);
                if (!error) {
                    profileUrl = supabase.storage.from('leads-media').getPublicUrl(fileName).data.publicUrl;
                }
            }

            const coverFile = document.getElementById('img-cover')?.files[0];
            if (coverFile) {
                const ext      = coverFile.name.split('.').pop();
                const fileName = `cover_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
                const { error } = await supabase.storage.from('leads-media').upload(fileName, coverFile);
                if (!error) {
                    coverUrl = supabase.storage.from('leads-media').getPublicUrl(fileName).data.publicUrl;
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
            }]);

            if (insertError) {
                console.error('[Landing] Error insertando lead:', insertError);
                // El formulario igual muestra éxito — el equipo puede ser contactado por WhatsApp de fallback
            }

            // ——— Mostrar pantalla de éxito ———
            showOnly(successView);
            form.reset();

        } catch (err) {
            console.error('[Landing] Error inesperado:', err);
            // Fallback: abrir WhatsApp si algo falla catastróficamente
            window.open(`https://wa.me/5491162621406?text=${encodeURIComponent('Hola, me interesa contratar Suito')}`, '_blank');
        } finally {
            if (submitBtn) {
                submitBtn.textContent = 'Enviar Solicitud 🚀';
                submitBtn.disabled = false;
            }
        }
    });
}
