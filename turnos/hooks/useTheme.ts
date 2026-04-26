import { useEffect } from 'react';
import { useProfile } from '../context/AppContext';
import { darkenHex, hexToRgbString, normalizeHex } from '../../shared/colorUtils';

export type ColorFamily = 'Vibrant' | 'Pastel' | 'Corporate' | 'Signature';

export interface ThemeColor {
    id: string;
    hex: string;
    family: ColorFamily;
    label: string;
    name: string;
}

/**
 * Color presets for business branding, grouped for richer color-picking UIs.
 */
export const COLOR_PRESETS: ThemeColor[] = [
    { id: 'suito-violet', hex: '#7c3aed', family: 'Signature', label: 'Violeta Suito', name: 'Violeta' },
    { id: 'suito-gold', hex: '#D4AF37', family: 'Signature', label: 'Dorado Suito', name: 'Dorado' },
    { id: 'obsidian', hex: '#1C1C1C', family: 'Signature', label: 'Obsidiana', name: 'Obsidiana' },
    { id: 'neon-blue', hex: '#3B82F6', family: 'Vibrant', label: 'Azul Electrico', name: 'Azul' },
    { id: 'coral-red', hex: '#EF4444', family: 'Vibrant', label: 'Rojo Coral', name: 'Rojo' },
    { id: 'sunset-orange', hex: '#F97316', family: 'Vibrant', label: 'Naranja Ocaso', name: 'Naranja' },
    { id: 'fuchsia-pop', hex: '#D946EF', family: 'Vibrant', label: 'Fucsia Vivo', name: 'Fucsia' },
    { id: 'blush-pink', hex: '#FBCFE8', family: 'Pastel', label: 'Rosa Empolvado', name: 'Rosa' },
    { id: 'mint-breeze', hex: '#6EE7B7', family: 'Pastel', label: 'Menta Suave', name: 'Menta' },
    { id: 'lavender-mist', hex: '#C4B5FD', family: 'Pastel', label: 'Lavanda', name: 'Lavanda' },
    { id: 'sand-dune', hex: '#FDE047', family: 'Pastel', label: 'Arena Calida', name: 'Arena' },
    { id: 'navy-trust', hex: '#1E3A8A', family: 'Corporate', label: 'Azul Marino', name: 'Marino' },
    { id: 'emerald-health', hex: '#065F46', family: 'Corporate', label: 'Verde Esmeralda', name: 'Esmeralda' },
    { id: 'slate-pro', hex: '#334155', family: 'Corporate', label: 'Pizarra', name: 'Pizarra' },
    { id: 'burgundy-law', hex: '#7F1D1D', family: 'Corporate', label: 'Borgona', name: 'Borgona' },
];

export const COLOR_FAMILIES: ColorFamily[] = ['Signature', 'Vibrant', 'Pastel', 'Corporate'];

export const DEFAULT_PRIMARY = '#7c3aed';

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
        const color = normalizeHex(profile?.ColorPrimario || DEFAULT_PRIMARY, DEFAULT_PRIMARY);
        const root = document.documentElement;

        root.style.setProperty('--color-primary', color);
        root.style.setProperty('--color-primary-dark', darkenHex(color));
        root.style.setProperty('--color-primary-rgb', hexToRgbString(color));
    }, [profile?.ColorPrimario]);
}

/**
 * Apply a color immediately (for live preview in config page)
 */
export function applyThemeColor(color: string) {
    const normalized = normalizeHex(color, DEFAULT_PRIMARY);
    const root = document.documentElement;
    root.style.setProperty('--color-primary', normalized);
    root.style.setProperty('--color-primary-dark', darkenHex(normalized));
    root.style.setProperty('--color-primary-rgb', hexToRgbString(normalized));
}
