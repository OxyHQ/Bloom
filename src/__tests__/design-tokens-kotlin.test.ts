import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { KOTLIN_THEME_PATH, renderBloomThemeKotlin } from '../../scripts/native-theme-kotlin';
import { APP_COLOR_NAMES } from '../theme/color-presets';

const REPO_ROOT = join(__dirname, '..', '..');

describe('the native runtime theme is generated, not maintained', () => {
  const kotlin = renderBloomThemeKotlin();

  it('is byte-identical to a fresh render', () => {
    // A colour changed in the engine or a token in the spec and not regenerated fails here,
    // rather than an Android build drawing a palette Bloom no longer paints.
    expect(readFileSync(join(REPO_ROOT, KOTLIN_THEME_PATH), 'utf8')).toBe(kotlin);
  });

  it('carries every preset Bloom ships', () => {
    for (const name of APP_COLOR_NAMES) {
      expect(kotlin).toContain(`"${name}" -> preset`);
    }
  });

  it('reads every colour role from the theme in scope, never a constant', () => {
    expect(kotlin).toContain(
      'val muted: Color @Composable @ReadOnlyComposable get() = BloomTheme.palette.mutedForeground',
    );
  });
});
