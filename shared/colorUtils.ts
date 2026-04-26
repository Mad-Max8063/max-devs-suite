export function normalizeHex(hex: string, fallback = '#7c3aed'): string {
  const value = hex.trim();
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value)) {
    return value.length === 4
      ? `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`.toLowerCase()
      : value.toLowerCase();
  }
  return fallback;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = normalizeHex(hex);
  const num = parseInt(normalized.slice(1), 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function darkenHex(hex: string, amount = 0.15): string {
  const { r, g, b } = hexToRgb(hex);
  const factor = Math.max(0, Math.min(1, 1 - amount));
  const nextR = Math.max(0, Math.floor(r * factor));
  const nextG = Math.max(0, Math.floor(g * factor));
  const nextB = Math.max(0, Math.floor(b * factor));
  return `#${((nextR << 16) | (nextG << 8) | nextB).toString(16).padStart(6, '0')}`;
}

export function hexToRgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  const safeAlpha = Math.max(0, Math.min(1, alpha));
  return `rgba(${r}, ${g}, ${b}, ${safeAlpha})`;
}

export function hexToRgbString(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  return `${r}, ${g}, ${b}`;
}

export function getContrastColor(hex: string): 'white' | 'black' {
  const { r, g, b } = hexToRgb(hex);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62 ? 'black' : 'white';
}
