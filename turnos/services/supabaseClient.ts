/**
 * Supabase Client — Re-exporta el singleton canónico de shared/supabase.js
 *
 * NO crear un segundo createClient() aquí — causaría colisiones de sesión
 * de auth entre los módulos card, admin y turnos.
 *
 * El alias @shared está definido en vite.config.ts → resolve.alias.
 */
export { supabase } from '@shared/supabase.js';
export { supabase as default } from '@shared/supabase.js';
