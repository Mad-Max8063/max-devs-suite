import { supabase } from '../shared/supabase.js';

/**
 * pricing-loader.js
 * Fetches live pricing from Supabase and hydrates the landing page.
 * Implements the "Price Lock" visual feedback.
 */

export async function initDynamicPricing() {
    console.log('[Pricing] Initializing live pricing...');
    try {
        const { data, error } = await supabase
            .from('pricing')
            .select('id, monthly, quarterly');

        if (error) throw error;
        if (!data) return;

        const formatPrice = (value, suffix = '') => {
            const formatted = new Intl.NumberFormat('es-AR', {
                style: 'currency',
                currency: 'ARS',
                maximumFractionDigits: 0
            }).format(Number(value || 0));
            return `${formatted}${suffix}`;
        };

        data.forEach(row => {
            const monthlyElements = document.querySelectorAll(`[data-price-plan="${row.id}"][data-price-period="monthly"]`);
            const quarterlyElements = document.querySelectorAll(`[data-price-plan="${row.id}"][data-price-period="quarterly"]`);

            monthlyElements.forEach(el => {
                el.textContent = formatPrice(row.monthly, el.dataset.priceSuffix || '');
            });
            quarterlyElements.forEach(el => {
                el.textContent = formatPrice(row.quarterly, el.dataset.priceSuffix || '');
            });
        });

        console.log('[Pricing] Successfully hydrated from Supabase.');
    } catch (err) {
        console.error('[Pricing] Error loading live prices, using fallbacks:', err);
    }
}
