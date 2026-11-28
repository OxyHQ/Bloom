/**
 * Lets a bun script import Bloom's theme source, which reaches `react-native` for
 * `Platform` (`build-theme.ts`) and `processColor` (`color-scope/resolve-scope.ts`).
 * Bun cannot load react-native's Flow source, and the Swift generators only need the
 * pure colour pipeline behind those imports, so the module is replaced by the two
 * names, as a native platform that is not adaptive sees them.
 *
 * Call it BEFORE the first dynamic `import()` of a theme module.
 */
import { plugin } from 'bun';

export function stubReactNative(): void {
  plugin({
    name: 'bloom-swift-theme-react-native-stub',
    setup(build) {
      build.module('react-native', () => ({
        loader: 'object',
        exports: {
          Platform: {
            OS: 'ios',
            select: (options: Record<string, unknown>) =>
              options.ios ?? options.native ?? options.default,
          },
          // `adaptive-colors.ts` reads the scheme only for an adaptive theme, which the
          // generators never ask for.
          Appearance: { getColorScheme: () => 'light' },
          // Reached through the theme barrel's accessibility and style helpers, never called.
          AccessibilityInfo: {},
          StyleSheet: { create: <T>(styles: T) => styles, hairlineWidth: 1 },
          // `applyScopeTokens` only asks whether a value is a colour at all.
          processColor: (color: unknown) => (typeof color === 'string' ? 1 : null),
        },
      }));
    },
  });
}
