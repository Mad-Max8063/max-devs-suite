// ============================================
// pricing.js — Data Access Layer for dynamic pricing
// ============================================
import { supabase } from '@shared/supabase.js';
import { CONFIG } from './config.js';

/**
 * Fetches pricing from Supabase. Falls back to CONFIG.pricing on error.
 * Returns: { tarjeta: { monthly, quarterly }, turnos: {...}, combo: {...} }
 */
export async function getPricing() {
    try {
        const { data, error } = await supabase
            .from('pricing')
            .select('id, monthly, quarterly');

        if (error) throw error;
        if (!data || data.length === 0) throw new Error('No pricing rows');

        const pricing = {};
        data.forEach(row => {
            pricing[row.id] = {
                monthly: Number(row.monthly),
                quarterly: Number(row.quarterly),
            };
        });

        // Validate all three plans exist
        if (!pricing.tarjeta || !pricing.turnos || !pricing.combo) {
            throw new Error('Incomplete pricing data');
        }

        return pricing;
    } catch (err) {
        console.warn('[pricing] Fallback to config.js:', err.message);
        return { ...CONFIG.pricing };
    }
}

/**
 * Updates pricing for all plans in Supabase.
 * @param {Object} pricing - { tarjeta: { monthly, quarterly }, turnos: {...}, combo: {...} }
 */
export async function updatePricing(pricing) {
    const plans = ['tarjeta', 'turnos', 'combo'];

    for (const plan of plans) {
        const { error } = await supabase
            .from('pricing')
            .update({
                monthly: pricing[plan].monthly,
                quarterly: pricing[plan].quarterly,
            })
            .eq('id', plan);

        if (error) throw new Error(`Error updating ${plan}: ${error.message}`);
    }
}

/**
 * Applies inflation percentage to all plans. Rounds to nearest $50.
 * @param {Object} currentPricing - current pricing object
 * @param {number} percentage - e.g. 3.4 for 3.4%
 * @returns {Object} new pricing object with inflated values (not yet saved)
 */
export function applyInflation(currentPricing, percentage) {
    const factor = 1 + percentage / 100;
    const roundTo50 = (val) => Math.round(val * factor / 50) * 50;

    const newPricing = {};
    for (const plan of ['tarjeta', 'turnos', 'combo']) {
        newPricing[plan] = {
            monthly: roundTo50(currentPricing[plan].monthly),
            quarterly: roundTo50(currentPricing[plan].quarterly),
        };
    }
    return newPricing;
}
