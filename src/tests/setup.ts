/**
 * Vitest setup file
 * Global test configuration and mocks
 */

import { beforeAll, afterEach } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

beforeAll(() => {
  console.log('🧪 Test suite starting...');
});

afterEach(() => {
  // Clear localStorage after each test
  localStorage.clear();
});
