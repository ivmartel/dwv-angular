/**
 * Unit test setup: browser APIs missing in jsdom.
 */

/**
 * No-op ResizeObserver (jsdom does not provide it).
 */
class ResizeObserverStub implements ResizeObserver {
  observe() { /* no-op */ }
  unobserve() { /* no-op */ }
  disconnect() { /* no-op */ }
}

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = ResizeObserverStub;
}
