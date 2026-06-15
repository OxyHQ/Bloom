import { APP_COLOR_NAMES } from '../color-presets';
import { getPresetVars } from '../preset-vars';

// Captures the CURRENT resolved rgb for every preset×mode×token from the
// existing --color-* output (the sRGB oracle). Written once; later tasks
// assert the new pipeline matches this. DO NOT update this snapshot in later
// tasks — it is the immutable parity oracle.
describe('golden token snapshot (current pipeline)', () => {
  for (const name of APP_COLOR_NAMES) {
    for (const mode of ['light', 'dark'] as const) {
      it(`${name}/${mode} resolved --color-* matches snapshot`, () => {
        const vars = getPresetVars(name, mode, { includeResolvedColorVars: true });
        const resolved = Object.fromEntries(
          Object.entries(vars).filter(([k]) => k.startsWith('--color-')),
        );
        expect(resolved).toMatchSnapshot();
      });
    }
  }
});
