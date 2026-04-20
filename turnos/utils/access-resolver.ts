// ============================================
// turnos/utils/access-resolver.ts — 4-Tier Access Priority Resolution
// ============================================
// Single source of truth for premium/access evaluation.

export function resolveAccessPriority(userObject: any): boolean {
    if (!userObject) return false;
    
    const now = new Date();

    // Tier 1: Permanent override (admin/legacy)
    if (userObject.is_premium === true || userObject.isPremium === true || userObject.IsPremium === true) {
        return true;
    }

    // Tier 2: Temporary bonification
    const freeUntil = userObject.free_until || userObject.freeUntil || userObject.FreeUntil || null;
    if (freeUntil && new Date(freeUntil) > now) {
        return true;
    }

    // Tier 3: Paid subscription
    const subStatus = userObject.subscription_status || userObject.subscriptionStatus || userObject.SubscriptionStatus || 'basic';
    if (subStatus === 'active') {
        return true;
    }

    // Tier 4: Active trial
    const trialEndsAt = userObject.trial_ends_at || userObject.trialEndsAt || userObject.TrialEndsAt || null;
    if (subStatus === 'trial' && trialEndsAt && new Date(trialEndsAt) > now) {
        return true;
    }

    return false;
}
