// ============================================
// config.js — Suito Admin Panel Configuration
// ============================================
// NOTE: The Supabase anon key is public by design.
// Real security is enforced via Row Level Security (RLS) policies.
// Triggering new deployment with unified secrets - v1.0.1
export const CONFIG = {
    supabase: {
        url: 'https://bfsttdiokdqyvwjuvcbp.supabase.co',
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmc3R0ZGlva2RxeXZ3anV2Y2JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNzc1NDUsImV4cCI6MjA4Nzk1MzU0NX0.TqmEpfSlN25f9eZjw3ULIhJ0PiHAH3NuNCQEoESPD-w',
    },
    // Base URLs for deployed products (update when deployed to Hostinger)
    products: {
        tarjetaVirtual: 'https://tarjetas.suito.pro',
        gestorTurnos: 'https://turnos.suito.pro',
    },
    // Pricing in ARS (editable from the panel)
    pricing: {
        tarjeta: { monthly: 4900, quarterly: 12500 },
        turnos: { monthly: 9900, quarterly: 25000 },
        combo: { monthly: 12900, quarterly: 33000 },
    }
};