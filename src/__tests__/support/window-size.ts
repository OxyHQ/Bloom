import * as ReactNative from 'react-native';

/**
 * The window at a size, for a test: both ways Bloom reads it, React Native's
 * `useWindowDimensions` and `Dimensions.get('window')` (what Bloom's width
 * classes read, `hooks/use-width-class.ts`, so a resize re-renders only at a
 * threshold). Spied, so `jest.restoreAllMocks()` undoes it, as does the
 * returned `mockRestore()`.
 */
export function mockWindowSize(size: {
  width: number;
  height: number;
  scale?: number;
  fontScale?: number;
}) {
  const window = { scale: 1, fontScale: 1, ...size };
  const spies = [
    jest.spyOn(ReactNative, 'useWindowDimensions').mockReturnValue(window),
    jest.spyOn(ReactNative.Dimensions, 'get').mockReturnValue(window),
  ];
  return { mockRestore: () => spies.forEach((spy) => spy.mockRestore()) };
}
