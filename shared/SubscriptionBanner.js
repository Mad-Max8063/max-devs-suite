import { resolveAccessPriority } from './access-resolver.js';
import { supabase } from './supabase.js';
import {
  ASSISTED_UPGRADE_MESSAGE,
  BETA_TURNOS_MESSAGE,
  buildAssistedUpgradeWhatsAppUrl,
  trackSuitoEvent,
} from './assisted-upgrade.js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

/**
 * SubscriptionBanner - Educational UI for SaaS conversion.
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
  const isPremium = business.is_premium === true;
  const isActive = status === 'active';

  if (isPremium || isActive) {
    container.replaceChildren();
    container.hidden = true;
    return;
  }

  let bgColor = 'bg-blue-600';
  let message = '';
  let buttonText = 'Ver Planes';

  if (status === 'trial' && hasAccess) {
    const daysLeft = trialEnd ? Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24)) : 0;
    bgColor = 'bg-gradient-to-r from-indigo-600 to-purple-600';
    message = `Estas en Periodo de Prueba Premium (${daysLeft} dias restantes).`;
    buttonText = 'Suscribirme Ahora';
  } else if (!hasAccess && (status === 'trial' || status === 'expired' || status === 'basic')) {
    bgColor = 'bg-red-600';
    message = status === 'basic' ? 'Subi a Premium para eliminar marcas y mas.' : 'Tu periodo de prueba ha finalizado.';
    buttonText = 'Recuperar Premium';
  } else {
    container.replaceChildren();
    container.hidden = true;
    return;
  }

  const assistedUrl = buildAssistedUpgradeWhatsAppUrl(ASSISTED_UPGRADE_MESSAGE);
  const betaTurnosUrl = buildAssistedUpgradeWhatsAppUrl(BETA_TURNOS_MESSAGE);
  const isExpiredOrBasic = !hasAccess && (status === 'trial' || status === 'expired' || status === 'basic');
  const helperText = isExpiredOrBasic
    ? 'Tu tarjeta sigue activa en modo basico. Si queres mejorarla o consultar funciones avanzadas, podemos ayudarte por WhatsApp.'
    : 'Suscribite ahora y congela tu precio por 3 meses.';

  container.hidden = false;
  container.innerHTML = `
    <div class="${bgColor} text-white p-3 md:p-4 rounded-xl shadow-lg animate-in fade-in slide-in-from-top-4 duration-500" style="display:flex;flex-direction:column;gap:14px;align-items:stretch;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;">
        <div class="flex items-center gap-3" style="display:flex;align-items:center;gap:12px;min-width:220px;flex:1;">
          <div class="bg-white/20 p-2 rounded-full">
              <i class="fas fa-crown text-yellow-300"></i>
          </div>
          <div>
              <p class="font-bold text-sm md:text-base">${message}</p>
              <p class="text-xs text-white/80">${helperText}</p>
          </div>
        </div>
        <button id="btn-subscribe-now" class="bg-white text-indigo-600 px-6 py-2 rounded-lg font-bold text-sm hover:bg-indigo-50 transition-colors shadow-sm whitespace-nowrap" style="border:0;min-height:42px;cursor:pointer;">
          ${buttonText}
        </button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;">
        <a id="btn-assisted-upgrade" href="${assistedUrl}" target="_blank" rel="noopener" style="display:flex;align-items:center;justify-content:center;gap:8px;min-height:42px;padding:10px 14px;border-radius:12px;background:rgba(255,255,255,0.16);color:#fff;text-decoration:none;font-weight:800;font-size:13px;border:1px solid rgba(255,255,255,0.22);">
          <i class="fab fa-whatsapp"></i> Hablar por WhatsApp
        </a>
        <a id="btn-beta-turnos-interest" href="${betaTurnosUrl}" target="_blank" rel="noopener" style="display:flex;align-items:center;justify-content:center;gap:8px;min-height:42px;padding:10px 14px;border-radius:12px;background:rgba(255,255,255,0.1);color:#fff;text-decoration:none;font-weight:800;font-size:13px;border:1px solid rgba(255,255,255,0.16);">
          <i class="fas fa-calendar-check"></i> Pedir acceso anticipado
        </a>
      </div>
    </div>
  `;

  document.getElementById('btn-assisted-upgrade')?.addEventListener('click', () => {
    trackSuitoEvent('upgrade_assisted_clicked', { surface: 'subscription_banner', business_id: business.id || '' });
    trackSuitoEvent('whatsapp_upgrade_opened', { surface: 'subscription_banner', business_id: business.id || '' });
  });

  document.getElementById('btn-beta-turnos-interest')?.addEventListener('click', () => {
    trackSuitoEvent('beta_turnos_interest_clicked', { surface: 'subscription_banner', business_id: business.id || '' });
    trackSuitoEvent('whatsapp_upgrade_opened', { surface: 'subscription_banner', business_id: business.id || '' });
  });

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
          'Authorization': `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify({
          business_id: business.id,
          plan_type: business.plan || 'tarjeta',
        }),
      });

      const data = await response.json();
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        alert('Error al generar el link de pago. Por favor, reintenta.');
        btn.disabled = false;
        btn.innerText = buttonText;
      }
    } catch (e) {
      console.error('Subscription error:', e);
      alert('Hubo un problema de conexion. Intenta de nuevo.');
      btn.disabled = false;
      btn.innerText = buttonText;
    }
  });
}
