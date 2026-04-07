// ============================================
// auth.js — Supabase Auth Management for Admin Panel
// ============================================
import { CONFIG } from './config.js';

let _authClient = null;

function getAuthClient() {
    if (!_authClient) {
        _authClient = window.supabase.createClient(CONFIG.supabase.url, CONFIG.supabase.anonKey);
    }
    return _authClient;
}

document.addEventListener('DOMContentLoaded', async () => {
    const sb = getAuthClient();
    const { data: { session } } = await sb.auth.getSession();
    if (session) {
        showDashboard();
    } else {
        showLogin();
    }
});

function showDashboard() {
    document.getElementById('login-overlay').style.display = 'none';
    document.querySelector('.dashboard-container').style.display = 'flex';
}

function showLogin() {
    document.getElementById('login-overlay').style.display = 'flex';
    document.querySelector('.dashboard-container').style.display = 'none';
}

window.handleLogin = async function(e) {
    if (e) e.preventDefault();
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-password').value;
    const errEl = document.getElementById('login-error');
    const btn = document.getElementById('login-btn');
    const btnText = document.getElementById('login-btn-text');

    errEl.style.display = 'none';
    btn.disabled = true;
    btnText.textContent = 'Verificando...';

    const sb = getAuthClient();
    const { data, error } = await sb.auth.signInWithPassword({ email, password: pass });

    if (error) {
        errEl.textContent = 'Credenciales inválidas. Verificá email y contraseña.';
        errEl.style.display = 'block';
        btn.disabled = false;
        btnText.textContent = 'Ingresar';
        return;
    }
    showDashboard();
};

window.handleLogout = async function() {
    const sb = getAuthClient();
    await sb.auth.signOut();
    showLogin();
};
