import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => cleanup());

// Route-level tests lazy-load page chunks; on a loaded machine (parallel workers, CI) the first
// `findBy*` can exceed Testing Library's 1 s default. A longer wait only delays failing tests.
configure({ asyncUtilTimeout: 5000 });

// jsdom lacks these browser APIs used by Takeoff/Spar positioning and layout observers.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;

if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

Element.prototype.scrollIntoView ??= function scrollIntoView() {};
