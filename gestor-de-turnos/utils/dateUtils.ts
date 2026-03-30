/**
 * Date utility functions - centralized date formatting
 * to avoid duplication across pages.
 */

/**
 * Format a date string (YYYY-MM-DD) into a localized Spanish display format.
 * Example: "2024-12-20" → "Vie 20 Dic"
 */
export function formatDate(dateStr: string): string {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('es-AR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
    });
}

/**
 * Format a date string (YYYY-MM-DD) into a long Spanish display format.
 * Example: "2024-12-20" → "Viernes 20 de Diciembre de 2024"
 */
export function formatDateLong(dateStr: string): string {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('es-AR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

/**
 * Get today's date in YYYY-MM-DD format.
 */
export function getTodayString(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
}
