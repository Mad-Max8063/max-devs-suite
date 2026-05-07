export const ASSISTED_UPGRADE_MESSAGE = 'Hola! Estoy usando Suito y quiero mejorar mi tarjeta / consultar funciones avanzadas 🚀';
export const BETA_TURNOS_MESSAGE = 'Hola! Estoy usando Suito y quiero saber si puedo acceder a la beta privada de turnos 🚀';

export function normalizeWhatsAppNumber(value) {
    let digits = String(value || '').replace(/\D/g, '');
    if (!digits) return '';

    if (digits.startsWith('00')) {
        digits = digits.slice(2);
    }

    if (digits.startsWith('549')) {
        return digits;
    }

    if (digits.startsWith('54')) {
        const national = digits.slice(2).replace(/^0+/, '');
        return national.startsWith('9') ? digits : `549${national}`;
    }

    digits = digits.replace(/^0+/, '');

    if (digits.startsWith('9')) {
        return `54${digits}`;
    }

    if (digits.startsWith('1115')) {
        digits = `11${digits.slice(4)}`;
    }

    return `549${digits}`;
}

export function buildWhatsAppUrl(phone, text = '', options = {}) {
    const normalizedPhone = normalizeWhatsAppNumber(phone);
    if (!normalizedPhone && options.requirePhone) return '';

    const baseUrl = normalizedPhone ? `https://wa.me/${normalizedPhone}` : 'https://wa.me/';
    return text ? `${baseUrl}?text=${encodeURIComponent(text)}` : baseUrl;
}

export function getSuitoSupportWhatsApp() {
    return import.meta.env.VITE_SUITO_SUPPORT_WHATSAPP || '';
}

export function buildAssistedUpgradeWhatsAppUrl(message = ASSISTED_UPGRADE_MESSAGE) {
    return buildWhatsAppUrl(getSuitoSupportWhatsApp(), message);
}

export function trackSuitoEvent(eventName, params = {}) {
    if (typeof window === 'undefined') return;

    if (typeof window.gtag === 'function') {
        window.gtag('event', eventName, params);
        return;
    }

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: eventName, ...params });
}
