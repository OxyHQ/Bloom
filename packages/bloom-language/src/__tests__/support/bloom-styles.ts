export * as tokens from '../../../../../src/styles/tokens';
export { adoptStyleSheet } from '../../../../../src/styles/adopt-style-sheet';
/** Bloom's first surface level, as the stand-in theme paints it. */
export function resolveSurfaceLevel(theme: { colors: Record<string, string> }, _level: number) {
  return {
    background: theme.colors.backgroundSecondary,
    border: theme.colors.border,
    text: theme.colors.text,
    textSecondary: theme.colors.textSecondary,
  };
}
