/**
 * One resolved palette per theme: `useColorTokens()` and `useTheme().colors`
 * hold the same colour for every token and the field it feeds
 * (`COLOR_FIELDS`), in every mode, `mode="adaptive"` included. In an adaptive
 * theme on Android and iOS the platform's colours (here a mocked dynamic
 * palette, `__mocks__/dynamic-palette.ts`) overlay the preset's in both, so a
 * family moved from one reader to the other paints the same colour.
 */
import { Platform, Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { BloomThemeProvider } from '../BloomThemeProvider';
import { buildPresetPalette } from '../build-theme';
import { APP_COLOR_NAMES } from '../color-presets';
import { COLOR_FIELDS } from '../color-scope/resolve-scope';
import { useColorTokens } from '../color-tokens';
import { useTheme } from '../use-theme';

jest.mock('../adaptive-colors', () => jest.requireActual('../adaptive-colors.native'));
jest.mock('expo-router/build/color/index.js', () =>
  jest.requireActual('../../../__mocks__/dynamic-palette'),
);

const { Color } = jest.requireActual('../../../__mocks__/dynamic-palette') as {
  Color: { android: { dynamic: Record<string, string> }; ios: Record<string, string> };
};

const camel = (name: string) => name.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase());
const TOKEN_FIELDS = Object.entries(COLOR_FIELDS).map(
  ([token, [field]]) => [token, field] as const,
);

function Probe() {
  const { colors } = useTheme();
  const tokens = useColorTokens() as Record<string, string>;
  return <Text testID="probe">{JSON.stringify({ colors, tokens })}</Text>;
}

function readers(mode: 'light' | 'dark' | 'adaptive', colorPreset = 'oxy' as const) {
  const { getByTestId, unmount } = render(
    <BloomThemeProvider colorPreset={colorPreset} mode={mode} fonts={false}>
      <Probe />
    </BloomThemeProvider>,
  );
  const value = JSON.parse(getByTestId('probe').props.children as string) as {
    colors: Record<string, string>;
    tokens: Record<string, string>;
  };
  unmount();
  return value;
}

const originalOS = Platform.OS;
afterEach(() => {
  Platform.OS = originalOS;
});

describe.each(['android', 'ios'] as const)('on %s', (os) => {
  beforeEach(() => {
    Platform.OS = os;
  });

  it.each(['light', 'dark', 'adaptive'] as const)('%s: every token is its field', (mode) => {
    const { colors, tokens } = readers(mode);
    for (const [token, field] of TOKEN_FIELDS) {
      expect([token, tokens[camel(token)]]).toEqual([token, colors[field]]);
    }
  });

  it('adaptive paints the platform palette through both readers', () => {
    const platform = os === 'android' ? Color.android.dynamic.primary : Color.ios.systemBlue;
    const { colors, tokens } = readers('adaptive');
    expect(colors.primary).toBe(platform);
    expect(tokens.primary).toBe(platform);
    expect(tokens.background).toBe(
      os === 'android' ? Color.android.dynamic.surface : Color.ios.systemBackground,
    );
  });
});

/**
 * The aliases the platform answers with a role of their own: in an adaptive
 * theme each can differ from its token, so a family reading one keeps reading
 * `colors` (docs/theme.mdx, *Which reader*). Every other alias is its token.
 */
const OWN_PLATFORM_ROLE = [
  'primaryDark',
  'primaryLight',
  'textTertiary',
  'negative',
  'negativeForeground',
  'negativeSubtle',
  'negativeSubtleForeground',
].sort();

it('adaptive: every alias but the platform’s own roles is its token, on Android and iOS', () => {
  const differs = new Set<string>();
  for (const os of ['android', 'ios'] as const) {
    Platform.OS = os;
    const { colors } = readers('adaptive');
    for (const [, [own, ...aliases]] of Object.entries(COLOR_FIELDS)) {
      for (const alias of aliases) if (colors[alias] !== colors[own]) differs.add(alias);
    }
  }
  expect([...differs].sort()).toEqual(OWN_PLATFORM_ROLE);
});

it('every preset, light and dark: the token record holds each field’s colour', () => {
  for (const preset of APP_COLOR_NAMES) {
    for (const mode of ['light', 'dark'] as const) {
      const { theme, vars } = buildPresetPalette(preset, mode);
      for (const [token, field] of TOKEN_FIELDS) {
        expect([preset, mode, token, vars[`--${token}`]]).toEqual([
          preset,
          mode,
          token,
          theme.colors[field],
        ]);
      }
    }
  }
});

it('the web has no platform palette: adaptive is the preset’s', () => {
  Platform.OS = 'web';
  const adaptive = buildPresetPalette('oxy', 'light', true);
  const preset = buildPresetPalette('oxy', 'light');
  expect(adaptive.vars).toEqual(preset.vars);
  expect(adaptive.theme.colors).toEqual(preset.theme.colors);
});
