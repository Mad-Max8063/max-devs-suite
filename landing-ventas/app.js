// ==========================================
// Lógica Comercial de Max Devs Solutions Onboarding
// ==========================================

const waNumber = "5491162621406"; // Tu teléfono (Max Devs)

// Manejo de Vistas (SPA cruda)
const landingView = document.getElementById('landing-view');
const onboardingView = document.getElementById('onboarding-view');
const form = document.getElementById('onboarding-form');

// Secciones del formulario basadas en Producto
const sectionTarjeta = document.getElementById('section-tarjeta');
const sectionGestor = document.getElementById('section-gestor');
const inputService = document.getElementById('selected-service');

// Leer parámetos URL para links virales
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const service = params.get('service');
    const ref = params.get('ref');

    // Si viene de una tarjeta o gestor "FREE", autoseleccionar
    if (service) {
        startOnboarding(service);
        if (ref) {
            console.log(`Referral tracked: ${ref}`); // Para analytics futuros
            window.localStorage.setItem('lead_ref', ref);
        }
    }
});

function startOnboarding(serviceType) {
    // serviceType puede ser 'tarjeta', 'gestor' o 'combo'
    inputService.value = serviceType;

    // Ajustar campos requeridos según servicio
    if (serviceType === 'tarjeta' || serviceType === 'combo') {
        sectionTarjeta.style.display = 'block';
        document.getElementById('card-prof').required = true;
    } else {
        sectionTarjeta.style.display = 'none';
        document.getElementById('card-prof').required = false;
    }

    if (serviceType === 'gestor' || serviceType === 'combo') {
        sectionGestor.style.display = 'block';
        document.getElementById('biz-name').required = true;
    } else {
        sectionGestor.style.display = 'none';
        document.getElementById('biz-name').required = false;
    }

    // Scroll
    window.scrollTo(0, 0);

    // Swap views
    landingView.classList.remove('active');
    setTimeout(() => {
        onboardingView.classList.add('active');
    }, 50);
}

function goBackToLanding() {
    onboardingView.classList.remove('active');
    setTimeout(() => {
        landingView.classList.add('active');
    }, 50);
}

// Envío a WhatsApp (Ahora con Storage)
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = 'Subiendo archivos, por favor espera... ⏳';
    submitBtn.disabled = true;

    try {
        const service = inputService.value.toUpperCase();
        const name = document.getElementById('user-name').value.trim();
        const phone = document.getElementById('user-phone').value.trim();
        const origin = window.localStorage.getItem('lead_ref') || 'Tráfico Orgánico';

        // 1. Subida de archivos a Supabase Storage
        let profileUrl = '';
        let coverUrl = '';

        const profileFile = document.getElementById('img-profile').files[0];
        if (profileFile) {
            const ext = profileFile.name.split('.').pop();
            const fileName = `profile_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
            const { data, error } = await window.supabaseClient.storage.from('leads-media').upload(fileName, profileFile);
            if (!error) {
                profileUrl = window.supabaseClient.storage.from('leads-media').getPublicUrl(fileName).data.publicUrl;
            } else {
                console.error("Error subiendo perfil:", error);
            }
        }

        const coverFile = document.getElementById('img-cover').files[0];
        if (coverFile) {
            const ext = coverFile.name.split('.').pop();
            const fileName = `cover_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
            const { data, error } = await window.supabaseClient.storage.from('leads-media').upload(fileName, coverFile);
            if (!error) {
                coverUrl = window.supabaseClient.storage.from('leads-media').getPublicUrl(fileName).data.publicUrl;
            } else {
                console.error("Error subiendo portada:", error);
            }
        }

        // Variables para los detalles estructurados
        let prof = '', ig = '', address = '', bname = '', bdep = '', bserv = '';

        // Construcción del mensaje estructurado para WhatsApp
        let payload = `⚡ *Hola Suito* ⚡\nMe interesa contratar el servicio: *${service}*\n\n`;
        payload += `*Mis datos de contacto:*\n👤 Nombre: ${name}\n📱 WhatsApp: ${phone}\n🔗 Origen: ${origin}\n\n`;

        if (service === 'TARJETA' || service === 'COMBO') {
            prof = document.getElementById('card-prof').value.trim();
            ig = document.getElementById('card-ig').value.trim();
            address = document.getElementById('card-address').value.trim();

            payload += `*📋 Datos para Tarjeta Virtual:*\n`;
            payload += `- Profesión: ${prof}\n`;
            if (ig) payload += `- Instagram: ${ig}\n`;
            if (address) payload += `- Ubicación: ${address}\n`;
            payload += `\n`;
        }

        if (service === 'GESTOR' || service === 'COMBO') {
            bname = document.getElementById('biz-name').value.trim();
            bdep = document.getElementById('biz-deposit').value.trim();
            bserv = document.getElementById('biz-service').value.trim();

            payload += `*📆 Datos para Gestor de Turnos:*\n`;
            payload += `- Negocio: ${bname}\n`;
            if (bdep) payload += `- Valor de Seña $ ARS: ${bdep}\n`;
            if (bserv) payload += `- Servicio principal: ${bserv}\n`;
            payload += `\n`;
        }

        if (profileUrl || coverUrl) {
            payload += `*🖼️ Recursos Gráficos:*\n`;
            if (profileUrl) payload += `- Foto Perfil: ${profileUrl}\n`;
            if (coverUrl) payload += `- Portada: ${coverUrl}\n`;
            payload += `\n`;
        }

        payload += `\n_¿Me confirmas por favor disponibilidad y precios para arrancar?_`;

        // 2. Insertar Lead silenciosamente en Base de Datos
        await window.supabaseClient.from('leads').insert([{
            name: name,
            phone: phone,
            service_type: service,
            profile_img_url: profileUrl || null,
            cover_img_url: coverUrl || null,
            details: {
                profession: prof,
                instagram: ig,
                address: address,
                business_name: bname,
                deposit: bdep,
                primary_service: bserv,
                origin: origin
            }
        }]);

        // 3. Abrir WhatsApp con el payload
        const encoded = encodeURIComponent(payload);
        const waUrl = `https://wa.me/${waNumber}?text=${encoded}`;
        window.open(waUrl, '_blank');

    } catch (e) {
        console.error("Error procesando solicitud:", e);
        alert("Ocurrió un error al procesar tu solicitud. Igualmente serás redirigido a conversar con nosotros.");
        window.open(`https://wa.me/${waNumber}?text=Hola,%20me%20interesa%20contratar%20la%20Suite`, '_blank');
    } finally {
        // Restaurar estado del botón
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
    }
});
