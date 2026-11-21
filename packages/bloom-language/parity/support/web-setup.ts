// Bloom's root `__mocks__/react-native.ts` stands in for React Native in every
// suite; the web suite renders react-native-web itself, as Bloom's web suites do.
jest.mock('react-native', () => jest.requireActual('react-native-web'));

// jsdom lays nothing out and has no ResizeObserver; a measured reveal (an
// accordion's) observes its content, which here never resizes. Both sides of a
// case observe the same nothing.
class NoResize {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
(globalThis as { ResizeObserver?: unknown }).ResizeObserver ??= NoResize;
