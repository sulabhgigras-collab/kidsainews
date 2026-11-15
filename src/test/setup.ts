import "@testing-library/jest-dom";
import { vi, afterEach } from "vitest";

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mock window.speechSynthesis
Object.defineProperty(window, "speechSynthesis", {
  writable: true,
  value: {
    speak: vi.fn(),
    cancel: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    getVoices: vi.fn(() => []),
    speaking: false,
    pending: false,
    paused: false,
    onvoiceschanged: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  },
});

// Mock SpeechSynthesisUtterance
vi.stubGlobal(
  "SpeechSynthesisUtterance",
  class {
    text = "";
    rate = 1;
    pitch = 1;
    onend: (() => void) | null = null;
    onerror: (() => void) | null = null;
  }
);

// Mock IntersectionObserver
vi.stubGlobal(
  "IntersectionObserver",
  class {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }
);

// Provide a working localStorage mock
// Node.js --localstorage-file breaks jsdom's localStorage proxy, so we always replace it
// with a Proxy-based mock that supports Object.keys() correctly.
function createLocalStorageMock() {
  const store: Record<string, string> = {};

  return new Proxy(store, {
    get(_target, prop: string) {
      if (prop === "getItem") return (key: string) => store[key] ?? null;
      if (prop === "setItem") return (key: string, value: string) => { store[key] = String(value); };
      if (prop === "removeItem") return (key: string) => { delete store[key]; };
      if (prop === "clear") return () => { Object.keys(store).forEach((k) => delete store[k]); };
      if (prop === "length") return Object.keys(store).length;
      if (prop === "key") return (i: number) => Object.keys(store)[i] ?? null;
      return store[prop];
    },
    set(_target, prop: string, value) {
      store[prop] = String(value);
      return true;
    },
    deleteProperty(_target, prop: string) {
      delete store[prop];
      return true;
    },
    ownKeys() {
      return Object.keys(store);
    },
    getOwnPropertyDescriptor(_target, prop: string) {
      if (prop in store) {
        return { configurable: true, enumerable: true, value: store[prop] };
      }
      return undefined;
    },
    has(_target, prop: string) {
      return prop in store;
    },
  });
}

const mockStorage = createLocalStorageMock();
Object.defineProperty(window, "localStorage", { value: mockStorage, writable: true, configurable: true });
Object.defineProperty(globalThis, "localStorage", { value: mockStorage, writable: true, configurable: true });

// Clean up localStorage between tests
afterEach(() => {
  localStorage.clear();
});
