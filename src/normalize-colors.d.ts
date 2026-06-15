/**
 * Ambient declaration for `@react-native/normalize-colors`.
 *
 * The package ships JS-only (`module.exports = normalizeColor`) with no bundled
 * type declarations, so `tsc` can't see its shape. It arrives transitively via
 * react-native / react-native-web — Bloom only references it in tests, as the
 * exact parser React Native (native) and react-native-web use behind
 * `StyleSheet`/`processColor` to validate that a color string is renderable.
 *
 * Typed to match the package's runtime contract (`index.js`): a default export
 * that takes a CSS color string or a packed 32-bit RGBA number and returns the
 * normalized packed RGBA integer, or `null` when the input is unparseable.
 */
declare module '@react-native/normalize-colors' {
  /**
   * Parse a CSS color string (or packed RGBA number) into a packed 32-bit RGBA
   * integer (`0xRRGGBBAA`). Returns `null` when the input cannot be parsed — an
   * unparseable color renders nothing in React Native / react-native-web.
   */
  const normalizeColor: (color: string | number) => number | null;
  export default normalizeColor;
}
