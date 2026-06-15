import { buildTheme } from '../build-theme';
import { APP_COLOR_NAMES } from '../color-presets';

it('theme.colors snapshot for all presets (catches unintended palette shifts)', () => {
  const all = Object.fromEntries(
    APP_COLOR_NAMES.flatMap((n) => (['light', 'dark'] as const).map(
      (m) => [`${n}/${m}`, buildTheme(n, m).colors] as const)),
  );
  expect(all).toMatchSnapshot();
});
