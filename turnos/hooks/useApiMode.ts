import { useMemo } from 'react';
import { DEMO_SLUG } from '../constants';

/**
 * Centralized hook for determining API mode.
 * Replaces the repeated `isConfigured && !isDemo` pattern across the codebase.
 *
 * @param slug - The current entrepreneur slug
 */
export function useApiMode(slug: string | null) {
    const isConfigured = !!import.meta.env.VITE_SUPABASE_URL;
    const isDemo = slug === DEMO_SLUG || slug === 'demo';

    const shouldCallApi = useMemo(
        () => isConfigured && !isDemo,
        [isConfigured, isDemo]
    );

    return { isConfigured, isDemo, shouldCallApi };
}
