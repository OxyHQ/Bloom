// The native parity suite draws the language's Android files (OxyOS takes them
// too), so Bloom's components see the same platform.
const { Platform } = require('react-native') as { Platform: { OS: string } };
Platform.OS = 'android';

// React Native gives every app a frame callback; Bloom's environment in Node
// has none, so a component that focuses on the next frame (an open Search)
// gets one here, as on a device.
const nextFrame = globalThis as { requestAnimationFrame?: unknown; cancelAnimationFrame?: unknown };
nextFrame.requestAnimationFrame ??= (callback: () => void) => setTimeout(callback, 0);
nextFrame.cancelAnimationFrame ??= clearTimeout;
