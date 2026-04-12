// ============================================
// auth.js — Supabase Auth Management for Admin Panel
// ============================================
// Uses the singleton client from supabaseClient.js to prevent
// session desynchronization with clients.js and app.js.
import { supabase } from './supabaseClient.js';

document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session } } = await supabase.auth.getSession();
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

    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });

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
    await supabase.auth.signOut();
    showLogin();
};
