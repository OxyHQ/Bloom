/** React Native as host names: what the renderer creates is asserted directly. */
export const View = 'View';
export const Text = 'Text';
export const Pressable = 'Pressable';
export const Platform = {
  OS: 'ios',
  select: <T>(spec: { ios?: T; default?: T }) => spec.ios ?? spec.default,
};
export const StyleSheet = {
  hairlineWidth: 0.5,
  create: <T>(styles: T) => styles,
  flatten: (style: unknown) => style,
};
export const useWindowDimensions = () => ({ width: 400, height: 800, scale: 1, fontScale: 1 });
/** The system's scheme; the lens menu reads it for its `auto` scheme. */
export const useColorScheme = () => 'light';
