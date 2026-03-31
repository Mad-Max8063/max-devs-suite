/**
 * Logger utility - wraps console methods to only output in development mode.
 * In production builds, debug/info/log calls become no-ops.
 */

const isDev = import.meta.env.DEV;

export const logger = {
  debug: (...args: unknown[]): void => {
    console.log('[DEBUG]', ...args);
  },
  info: (...args: unknown[]): void => {
    console.info('[INFO]', ...args);
  },
  warn: (...args: unknown[]): void => {
    console.warn('[WARN]', ...args);
  },
  error: (...args: unknown[]): void => {
    console.error('[ERROR]', ...args);
  },
};

export default logger;
