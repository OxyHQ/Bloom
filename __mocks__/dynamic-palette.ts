/**
 * A platform's dynamic palette for tests of `mode="adaptive"`: a stand-in for
 * expo-router's `Color` proxy (`expo-router/build/color/index.js`), which
 * `theme/adaptive-colors.native.ts` reads for Material You and iOS dynamic
 * colours. Every colour it is asked for is a fixed hex derived from its name,
 * unlike any preset's, so a test shows which reader painted what: a component
 * that paints the preset's colour where the theme holds the platform's fails.
 *
 * Map it (or `jest.mock` it) over that module, with `adaptive-colors` resolved
 * to its native file.
 */

/** A colour's fixed hex: FNV-1a over its name. */
function hex(name: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < name.length; i++) {
    hash ^= name.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return `#${((hash >>> 0) & 0xffffff).toString(16).padStart(6, '0')}`;
}

function palette(prefix: string): Record<string, string> {
  return new Proxy({} as Record<string, string>, {
    get: (_, name) => (typeof name === 'string' ? hex(`${prefix}${name}`) : undefined),
  });
}

export const Color = {
  android: { dynamic: palette('android.dynamic.') },
  ios: palette('ios.'),
};
