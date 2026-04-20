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

        data.forEach(row => {
            const monthlyElements = document.querySelectorAll(`[data-price-plan="${row.id}"][data-price-period="monthly"]`);
            const quarterlyElements = document.querySelectorAll(`[data-price-plan="${row.id}"][data-price-period="quarterly"]`);

            const formattedMonthly = new Intl.NumberFormat('es-AR', {
                style: 'currency',
                currency: 'ARS',
                maximumFractionDigits: 0
            }).format(row.monthly);

            const formattedQuarterly = new Intl.NumberFormat('es-AR', {
                style: 'currency',
                currency: 'ARS',
                maximumFractionDigits: 0
            }).format(row.quarterly);

            monthlyElements.forEach(el => { el.textContent = formattedMonthly; });
            quarterlyElements.forEach(el => { el.textContent = formattedQuarterly; });
        });

        console.log('[Pricing] Successfully hydrated from Supabase.');
    } catch (err) {
        console.error('[Pricing] Error loading live prices, using fallbacks:', err);
    }
}
