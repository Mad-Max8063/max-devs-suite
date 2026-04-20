import { resolveAccessPriority } from './access-resolver.js';
import { supabase } from './supabase.js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

/**
 * SubscriptionBanner — Educational UI for SaaS conversion.
 * Logic:
 * - If Trial: Show countdown + "Unlock Premium" button.
 * - If Expired: Show "Restore Premium" button (high urgency).
 * - If Active/Vitalicio: Hide.
 */
export async function injectSubscriptionBanner(containerId, business) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const hasAccess = resolveAccessPriority(business);
  const status = business.subscription_status || 'basic';
  const now = new Date();
  const trialEnd = business.trial_ends_at ? new Date(business.trial_ends_at) : null;
  
  let bannerHTML = '';
  let bgColor = 'bg-blue-600';
  let message = '';
  let buttonText = 'Ver Planes';

  if (status === 'trial' && hasAccess) {
    // Active Trial
    const daysLeft = trialEnd ? Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24)) : 0;
    bgColor = 'bg-gradient-to-r from-indigo-600 to-purple-600';
    message = `💎 Estás en Periodo de Prueba Premium (${daysLeft} días restantes).`;
    buttonText = 'Suscribirme Ahora';
  } else if (!hasAccess && (status === 'trial' || status === 'expired' || status === 'basic')) {
    // Expired or Basic (soft degrade)
    bgColor = 'bg-red-600';
    message = status === 'basic' ? '🚀 ¡Subí a Premium para eliminar marcas y más!' : '⚠️ Tu periodo de prueba ha finalizado.';
    buttonText = 'Recuperar Premium';
  } else {
    // Fully active or bonified - don't show banner
    container.innerHTML = '';
    return;
  }

  container.innerHTML = `
    <div class="${bgColor} text-white p-3 md:p-4 rounded-xl shadow-lg flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
      <div class="flex items-center gap-3">
        <div class="bg-white/20 p-2 rounded-full">
            <i class="fas fa-crown text-yellow-300"></i>
        </div>
        <div>
            <p class="font-bold text-sm md:text-base">${message}</p>
            <p class="text-xs text-white/80">Evitá cortes de servicio y congelá tu precio hoy.</p>
        </div>
      </div>
      <button id="btn-subscribe-now" class="bg-white text-indigo-600 px-6 py-2 rounded-lg font-bold text-sm hover:bg-indigo-50 transition-colors shadow-sm whitespace-nowrap">
        ${buttonText}
      </button>
    </div>
  `;

  // Attach event listener
  document.getElementById('btn-subscribe-now')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-subscribe-now');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';

    try {
        const functionUrl = `${SUPABASE_URL}/functions/v1/create-pricing-checkout`;
        
        const { data: { session } } = await supabase.auth.getSession();
        
        const response = await fetch(functionUrl, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session?.access_token || ''}`
            },
            body: JSON.stringify({ 
                business_id: business.id, 
                plan_type: business.plan || 'tarjeta' 
            })
        });

        const data = await response.json();
        if (data.checkout_url) {
            window.location.href = data.checkout_url;
        } else {
            alert('Error al generar el link de pago. Por favor, reintentá.');
            btn.disabled = false;
            btn.innerText = buttonText;
        }
    } catch (e) {
        console.error('Subscription error:', e);
        alert('Hubo un problema de conexión. Intentá de nuevo.');
        btn.disabled = false;
        btn.innerText = buttonText;
    }
  });
}
