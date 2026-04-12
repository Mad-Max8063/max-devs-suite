// ============================================
// shared/supabase.js — Única fuente de verdad del cliente Supabase
// ============================================
// Todos los módulos (landing, admin, card, turnos) importan desde aquí.
// Elimina las 4 inicializaciones separadas que causaban colisiones de sesión.

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('[Suito] Faltan variables de entorno VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
