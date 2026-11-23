// What NativeWind's native runtime reads from React Native beyond Bloom's
// React Native stand-in (`__mocks__/react-native.ts`), as React Native's
// Android implementation answers it.
const RN = require('react-native') as Record<string, unknown>;
if (typeof RN.PlatformColor !== 'function')
  RN.PlatformColor = (...names: string[]) => ({ resource_paths: names });
