import '@testing-library/jest-dom';
import { vi, beforeEach } from 'vitest';

// Mock import.meta.env
Object.defineProperty(import.meta, 'env', {
    value: {
        DEV: true,
        PROD: false,
        MODE: 'test',
    },
});

// Mock fetch
global.fetch = vi.fn();

// Reset mocks before each test
beforeEach(() => {
    vi.clearAllMocks();
});
