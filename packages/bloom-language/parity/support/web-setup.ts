// Bloom's root `__mocks__/react-native.ts` stands in for React Native in every
// suite; the web suite renders react-native-web itself, as Bloom's web suites do.
jest.mock('react-native', () => jest.requireActual('react-native-web'));

// jsdom lays nothing out and has no ResizeObserver; a component that observes
// its size (a collapsible's body) gets one that never reports, on both sides.
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}
