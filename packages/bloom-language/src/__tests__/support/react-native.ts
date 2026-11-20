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
