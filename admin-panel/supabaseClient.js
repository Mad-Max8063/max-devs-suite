// ============================================
// supabaseClient.js — Singleton Supabase Client
// ============================================
// Single source of truth for the Supabase client instance.
// All modules (clients.js, auth.js, app.js) import from here
// to avoid multiple createClient calls and session desynchronization.
//
// ES module scripts are deferred by the browser, so the CDN <script>
// tag that sets window.supabase is guaranteed to have executed first.
import { CONFIG } from './config.js';

export const supabase = window.supabase.createClient(
    CONFIG.supabase.url,
    CONFIG.supabase.anonKey
);
