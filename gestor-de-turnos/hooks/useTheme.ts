import { useEffect } from 'react';
import { useProfile } from '../context/AppContext';

/**
 * Color presets for business branding
 */
export const COLOR_PRESETS = [
    { name: 'Violeta', hex: '#7c3aed', emoji: '💜' },
    { name: 'Rosa', hex: '#ec4899', emoji: '💗' },
    { name: 'Azul', hex: '#3b82f6', emoji: '💙' },
    { name: 'Verde', hex: '#10b981', emoji: '💚' },
    { name: 'Naranja', hex: '#f97316', emoji: '🧡' },
    { name: 'Rojo', hex: '#ef4444', emoji: '❤️' },
    { name: 'Negro', hex: '#1f2937', emoji: '🖤' },
    { name: 'Dorado', hex: '#d97706', emoji: '✨' },
] as const;

export const DEFAULT_PRIMARY = '#7c3aed';

/**
 * Darken a hex color by a percentage (0-1)
 */
function darkenHex(hex: string, amount: number = 0.15): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, Math.floor((num >> 16) * (1 - amount)));
    const g = Math.max(0, Math.floor(((num >> 8) & 0x00ff) * (1 - amount)));
    const b = Math.max(0, Math.floor((num & 0x0000ff) * (1 - amount)));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/**
 * Hook that applies the business's custom color to the entire app
 * by overriding the CSS custom property `--color-primary`.
 *
 * All Tailwind classes like bg-primary, text-primary, etc.
 * automatically inherit the new color.
 */
export function useTheme() {
    const { profile } = useProfile();

    useEffect(() => {
        const color = profile?.ColorPrimario || DEFAULT_PRIMARY;
        const root = document.documentElement;

        root.style.setProperty('--color-primary', color);
        root.style.setProperty('--color-primary-dark', darkenHex(color));
    }, [profile?.ColorPrimario]);
}

/**
 * Apply a color immediately (for live preview in config page)
 */
export function applyThemeColor(color: string) {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', color);
    root.style.setProperty('--color-primary-dark', darkenHex(color));
}
