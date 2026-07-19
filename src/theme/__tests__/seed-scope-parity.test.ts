/**
 * Parity guard for the dynamic seed-scope path.
 *
 * A named preset is just a fixed seed fed through the same colour engine, so
 * `buildSeedScopeVars({ seed: preset.hex, ... })` MUST produce the identical
 * token record as the preset path (`buildScopeVars(name, mode)`), including the
 * Tailwind v4 `--color-*` aliases. If the role → token mapping in
 * `seed-scope.ts` ever drifts from `getPresetVars`, this fails.
 */
import { APP_COLOR_NAMES, APP_COLOR_PRESETS, type AppColorName } from '../color-presets';
import { buildScopeVars } from '../color-scope/style-builder';
import { buildSeedScopeVars } from '../color-scope/seed-scope';

describe('buildSeedScopeVars parity with preset scope', () => {
  const modes: Array<'light' | 'dark'> = ['light', 'dark'];

  for (const name of APP_COLOR_NAMES as readonly AppColorName[]) {
    for (const mode of modes) {
      it(`matches preset "${name}" in ${mode} mode`, () => {
        const preset = APP_COLOR_PRESETS[name];
        const fromPreset = buildScopeVars(name, mode);
        const fromSeed = buildSeedScopeVars({ seed: preset.hex, mode });
        expect(fromSeed).toEqual(fromPreset);
      });
    }
  }
});
