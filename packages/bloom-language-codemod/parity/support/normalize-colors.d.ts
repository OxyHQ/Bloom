/** React Native's colour normaliser, which its package ships without a declaration. */
declare module '@react-native/normalize-colors' {
  /** A colour as React Native reads it: `0xRRGGBBAA`, or null when it is no colour. */
  export default function normalizeColor(color: unknown): number | null;
}
