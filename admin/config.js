// ============================================
// config.js — Suito Admin Panel Configuration
// ============================================
// Supabase connection is handled exclusively by @shared/supabase.js
// via VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY env vars.
export const CONFIG = {
    // Base URLs for deployed products (update when deployed to Hostinger)
    products: {
        tarjetaVirtual: 'https://suito.pro/card',
        gestorTurnos: 'https://suito.pro/turnos',
    },
    // Pricing in ARS (editable from the panel — these are fallback defaults)
    pricing: {
        tarjeta: { monthly: 4900, quarterly: 12500 },
        turnos: { monthly: 9900, quarterly: 25000 },
        combo: { monthly: 12900, quarterly: 33000 },
    }
};