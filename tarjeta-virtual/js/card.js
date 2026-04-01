/**
 * Suito Virtual Card - Luminous Curator Edition
 * Personalized for: Matías Maximiliano (Max) Bernal
 */

const CARD_DATA = {
    profile: {
        name: "Matías Maximiliano (Max) Bernal",
        title: "Max Devs Solutions",
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
        email: "max@maxdevssolutions.com",
        website: "https://suito.pro",
        instagram: "maxdevs.solutions"
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

// Initial render
document.addEventListener('DOMContentLoaded', renderCard);
