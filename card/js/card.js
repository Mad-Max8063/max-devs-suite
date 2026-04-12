/**
 * Suito Virtual Card - Luminous Curator Edition
 * Personalized for: Matías Maximiliano (Max) Bernal
 */

const CARD_DATA = {
    profile: {
        name: "Matías Maximiliano (Max) Bernal",
        title: "Suito",
        bio: "Innovando soluciones digitales con Suito",
        // Usamos los assets locales de /assets
        avatar: "../assets/logo.png", 
        cover: "../assets/cover.png",
        location: "Buenos Aires, Argentina",
        verified: true,
        isPremium: false // Si es true, oculta el branding de Suito
    },
    contact: {
        whatsapp: "5491162621406", 
        email: "hola@suito.pro",
        website: "https://suito.pro",
        instagram: "suito.pro"
    },
    services: [
        {
            id: 1,
            title: "Software & Web con IA",
            description: "Desarrollo de aplicaciones y landing pages de alto impacto utilizando inteligencia artificial para optimizar tiempos y resultados.",
            icon: "bolt",
            price: "Desde $500"
        },
        {
            id: 2,
            title: "Consultoría Estratégica",
            description: "Asesoría personalizada sobre transformación digital y cómo implementar el ecosistema Suito en tu modelo de negocio.",
            icon: "lightbulb",
            price: "Consulta"
        }
    ],
    gallery: [
        { url: "../assets/cover.png", title: "Suito Luminous Project" },
        { url: "../assets/logo.png", title: "Brand Identity" }
    ]
};

function renderCard() {
    const app = document.getElementById('app');
    if (!app) return;

    app.innerHTML = `
        <div class="card-container animate-fade-in">
            <!-- Cover & Avatar -->
            <div class="card-header">
                <div class="card-cover-wrapper">
                    <img src="${CARD_DATA.profile.cover}" alt="Cover" class="card-cover">
                    <div class="card-cover-overlay"></div>
                </div>
                <div class="card-avatar-container">
                    <div class="card-avatar-ring">
                        <img src="${CARD_DATA.profile.avatar}" alt="${CARD_DATA.profile.name}" class="card-avatar">
                    </div>
                </div>
            </div>

            <!-- Profile Info -->
            <div class="card-body">
                <div class="card-profile-info">
                    <div class="flex items-center justify-center gap-2 mb-1">
                        <h1 class="card-name">${CARD_DATA.profile.name}</h1>
                        ${CARD_DATA.profile.verified ? '<span class="material-symbols-outlined verified-badge">verified</span>' : ''}
                    </div>
                    <p class="card-title">${CARD_DATA.profile.title}</p>
                    <p class="card-bio">${CARD_DATA.profile.bio}</p>
                    ${CARD_DATA.profile.location ? `
                        <div class="card-location">
                            <span class="material-symbols-outlined">location_on</span>
                            <span>${CARD_DATA.profile.location}</span>
                        </div>
                    ` : ''}
                </div>

                <!-- Quick Actions -->
                <div class="card-actions">
                    <a href="https://wa.me/${CARD_DATA.contact.whatsapp}" target="_blank" class="btn-primary">
                        <span class="material-symbols-outlined">chat</span>
                        WhatsApp
                    </a>
                    <button class="btn-secondary" onclick="shareCard()">
                        <span class="material-symbols-outlined">share</span>
                        Compartir
                    </button>
                </div>

                <!-- Services Section -->
                <div class="card-section">
                    <div class="section-header">
                        <h2 class="section-title">Servicios</h2>
                        <span class="section-badge">Premium</span>
                    </div>
                    <div class="services-grid">
                        ${CARD_DATA.services.map(s => `
                            <div class="service-card glass-card">
                                <div class="service-icon-wrapper">
                                    <span class="material-symbols-outlined">${s.icon}</span>
                                </div>
                                <h3 class="service-name">${s.title}</h3>
                                <p class="service-desc">${s.description}</p>
                                <span class="service-price">${s.price}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Portfolio Gallery -->
                <div class="card-section">
                    <div class="section-header">
                        <h2 class="section-title">Explorá mi Trabajo</h2>
                    </div>
                    <div class="masonry-gallery">
                        ${CARD_DATA.gallery.map((img, i) => `
                            <div class="gallery-item animate-fade-in" style="animation-delay: ${i * 0.1}s">
                                <img src="${img.url}" alt="${img.title}" loading="lazy">
                                <div class="gallery-overlay">
                                    <span>${img.title}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <!-- Footer / System Link -->
            <footer class="card-footer">
                <div class="footer-divider"></div>
                ${!CARD_DATA.profile.isPremium ? `
                    <div class="suito-referral">
                        <p class="referral-text">¿Querés una tarjeta como esta?</p>
                        <a href="https://suito.pro?ref=card" target="_blank" class="referral-link">Obtené la tuya en Suito.pro</a>
                    </div>
                ` : ''}
                <div class="footer-brand">
                    <span class="text-primary italic font-black">Suito</span>
                    <span class="text-on-surface-variant opacity-40 font-bold ml-1 text-[10px] uppercase tracking-widest">Luminous</span>
                </div>
            </footer>
        </div>
    `;
}

function shareCard() {
    if (navigator.share) {
        navigator.share({
            title: CARD_DATA.profile.name,
            text: CARD_DATA.profile.bio,
            url: window.location.href
        }).catch(console.error);
    } else {
        alert("Enlace de tarjeta copiado al portapapeles");
        navigator.clipboard.writeText(window.location.href);
    }
}

// ——— Exported API for app.js dynamic import ———

export function renderLanding(container, data) {
    container.innerHTML = buildCardHTML(data);
}

export function renderPreview(container, data, onBack, onSave) {
    container.innerHTML = buildCardHTML(data);
    // Add back button for preview mode
    const backBtn = document.createElement('button');
    backBtn.className = 'btn-secondary';
    backBtn.style.cssText = 'position:fixed;top:16px;left:16px;z-index:100;padding:8px 16px;border-radius:12px;';
    backBtn.innerHTML = '<span class="material-symbols-outlined">arrow_back</span> Volver';
    backBtn.onclick = onBack;
    container.prepend(backBtn);
}

function buildCardHTML(data) {
    const name = data.name || 'Sin nombre';
    const profession = data.profession || '';
    const description = data.description || '';
    const phone = data.phone || '';
    const email = data.email || '';
    const location = data.location || '';
    const photo = data.photo || data.photo_url || '';
    const coverPhoto = data.coverPhoto || data.cover_url || '';
    const instagram = data.instagram || '';
    const website = data.website || '';
    const bookingUrl = data.bookingUrl || data.booking_url || '';
    const isPremium = data.isPremium || false;
    const gallery = data.gallery || [];

    return `
        <div class="card-container animate-fade-in">
            <!-- Cover & Avatar -->
            <div class="card-header">
                <div class="card-cover-wrapper">
                    ${coverPhoto ? `<img src="${coverPhoto}" alt="Cover" class="card-cover">` : '<div class="card-cover" style="background:linear-gradient(135deg,#8B5CF6,#EC4899);height:200px;"></div>'}
                    <div class="card-cover-overlay"></div>
                </div>
                <div class="card-avatar-container">
                    <div class="card-avatar-ring">
                        ${photo ? `<img src="${photo}" alt="${name}" class="card-avatar">` : `<div class="card-avatar" style="display:flex;align-items:center;justify-content:center;font-size:2rem;background:#f3e8ff;">${name.charAt(0)}</div>`}
                    </div>
                </div>
            </div>

            <!-- Profile Info -->
            <div class="card-body">
                <div class="card-profile-info">
                    <h1 class="card-name">${name}</h1>
                    <p class="card-title">${profession}</p>
                    ${description ? `<p class="card-bio">${description}</p>` : ''}
                    ${location ? `
                        <div class="card-location">
                            <span class="material-symbols-outlined">location_on</span>
                            <span>${location}</span>
                        </div>
                    ` : ''}
                </div>

                <!-- Quick Actions -->
                <div class="card-actions">
                    ${phone ? `
                        <a href="https://wa.me/${phone}" target="_blank" class="btn-primary">
                            <span class="material-symbols-outlined">chat</span>
                            WhatsApp
                        </a>
                    ` : ''}
                    <button class="btn-secondary" onclick="navigator.share ? navigator.share({title:'${name}',url:location.href}).catch(()=>{}) : navigator.clipboard.writeText(location.href)">
                        <span class="material-symbols-outlined">share</span>
                        Compartir
                    </button>
                </div>

                <!-- Contact Links -->
                ${(email || instagram || website || bookingUrl) ? `
                <div class="card-section">
                    <div class="section-header">
                        <h2 class="section-title">Contacto</h2>
                    </div>
                    <div class="services-grid">
                        ${email ? `<a href="mailto:${email}" class="service-card glass-card" style="text-decoration:none;"><span class="material-symbols-outlined">mail</span><p>${email}</p></a>` : ''}
                        ${instagram ? `<a href="https://instagram.com/${instagram}" target="_blank" class="service-card glass-card" style="text-decoration:none;"><span class="material-symbols-outlined">photo_camera</span><p>@${instagram}</p></a>` : ''}
                        ${website ? `<a href="${website}" target="_blank" class="service-card glass-card" style="text-decoration:none;"><span class="material-symbols-outlined">language</span><p>Web</p></a>` : ''}
                        ${bookingUrl ? `<a href="${bookingUrl}" target="_blank" class="service-card glass-card" style="text-decoration:none;"><span class="material-symbols-outlined">calendar_month</span><p>Agendar Turno</p></a>` : ''}
                    </div>
                </div>
                ` : ''}

                <!-- Gallery -->
                ${gallery.length > 0 ? `
                <div class="card-section">
                    <div class="section-header">
                        <h2 class="section-title">Galería</h2>
                    </div>
                    <div class="masonry-gallery">
                        ${gallery.map((img, i) => `
                            <div class="gallery-item animate-fade-in" style="animation-delay: ${i * 0.1}s">
                                <img src="${img.src || img.url}" alt="${img.caption || img.title || ''}" loading="lazy">
                                ${(img.caption || img.title) ? `<div class="gallery-overlay"><span>${img.caption || img.title}</span></div>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
            </div>

            <!-- Footer -->
            <footer class="card-footer">
                <div class="footer-divider"></div>
                ${!isPremium ? `
                    <div class="suito-referral">
                        <p class="referral-text">¿Querés una tarjeta como esta?</p>
                        <a href="https://suito.pro?ref=card" target="_blank" class="referral-link">Obtené la tuya en Suito.pro</a>
                    </div>
                ` : ''}
                <div class="footer-brand">
                    <span class="text-primary italic font-black">Suito</span>
                    <span class="text-on-surface-variant opacity-40 font-bold ml-1 text-[10px] uppercase tracking-widest">Luminous</span>
                </div>
            </footer>
        </div>
    `;
}

// Legacy: standalone render with hardcoded data
function renderCardLegacy() {
    const app = document.getElementById('app');
    if (!app) return;
    app.innerHTML = buildCardHTML({
        name: CARD_DATA.profile.name,
        profession: CARD_DATA.profile.title,
        description: CARD_DATA.profile.bio,
        phone: CARD_DATA.contact.whatsapp,
        email: CARD_DATA.contact.email,
        website: CARD_DATA.contact.website,
        instagram: CARD_DATA.contact.instagram,
        photo: CARD_DATA.profile.avatar,
        coverPhoto: CARD_DATA.profile.cover,
        location: CARD_DATA.profile.location,
        isPremium: CARD_DATA.profile.isPremium,
        gallery: CARD_DATA.gallery.map(g => ({ src: g.url, caption: g.title }))
    });
}

// Initial render (only when loaded standalone, not via dynamic import)
if (!window.__appRouterActive) {
    document.addEventListener('DOMContentLoaded', renderCardLegacy);
}
