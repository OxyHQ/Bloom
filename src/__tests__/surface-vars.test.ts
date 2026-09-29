import {
  hairlineOn,
  resolveSurfaceLevel,
  SURFACE_LEVELS,
  SURFACE_VAR,
  surfaceFillOn,
  surfaceTextOn,
  surfaceVars,
} from '../styles/surface-levels';
import { RING_OFFSET_VAR } from '../styles/interactive-web-css';
import { buildTheme } from '../theme/build-theme';
import { APP_COLOR_NAMES } from '../theme/color-presets';

/**
 * The variable bundle is the SAME answer as the JS primitives, not a second
 * derivation of it: a className reading `--bloom-hairline` must paint exactly
 * what `hairlineOn()` returns, over every preset × mode × rung. An EQUALITY, so
 * a tweak to either side that the other did not take goes red.
 */
describe('surfaceVars', () => {
  // ONE theme derivation per preset x mode, and one `it` walking the rungs:
  // re-deriving per case (512 themes) takes the jest worker down with the known
  // vm crash (`AGENTS.md`), exactly as `surface-levels.test.ts` records.
  const themes = APP_COLOR_NAMES.flatMap((preset) =>
    (['light', 'dark'] as const).map((mode) => ({ label: `${preset}/${mode}`, theme: buildTheme(preset, mode) })),
  );

  it('equals the primitives over every preset x mode x rung', () => {
    const mismatches: string[] = [];
    for (const { label, theme } of themes) {
      for (const level of SURFACE_LEVELS) {
        const fill = resolveSurfaceLevel(theme, level).background;
        const text = surfaceTextOn(theme, fill);
        const expected = {
          [SURFACE_VAR.fill]: fill,
          [SURFACE_VAR.raised]: surfaceFillOn(theme, fill),
          [SURFACE_VAR.hairline]: hairlineOn(theme, fill),
          [SURFACE_VAR.textSecondary]: text.textSecondary,
          [SURFACE_VAR.textTertiary]: text.textTertiary,
          [SURFACE_VAR.textGraphical]: text.textGraphical,
          [RING_OFFSET_VAR]: fill,
        };
        if (JSON.stringify(surfaceVars(theme, fill)) !== JSON.stringify(expected)) {
          mismatches.push(`${label} rung ${level}`);
        }
      }
    }
    // Vacuity floor: the walk really covered every preset in both modes.
    expect(themes).toHaveLength(APP_COLOR_NAMES.length * 2);
    expect(mismatches).toEqual([]);
  });
});
