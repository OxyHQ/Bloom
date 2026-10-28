import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { BloomThemeProvider } from '../BloomThemeProvider';
import { BloomColorScope } from '../color-scope/ColorScope';
import { useTheme } from '../use-theme';
import {
  SurfaceLevelProvider,
  useSurfaceFill,
  useSurfaceLevelValue,
  resolveSurfaceLevel,
} from '../../styles/surface-levels';
import { useSurfaceLayer } from '../../surface/use-surface-layer';
import { resolveButtonPalette } from '../../button/shared';
import { contrastRatio } from '../../styles/color-contrast';
function Probe() {
  const theme = useTheme();
  const fill = useSurfaceFill();
  const level = useSurfaceLevelValue();
  const layer = useSurfaceLayer();
  const paint = resolveButtonPalette(
    'subtle',
    theme,
    'neutral',
    undefined,
    layer.fill,
    'surface',
  ).rest;
  return (
    <Text testID="paint">
      {JSON.stringify({
        fill,
        level,
        expected: resolveSurfaceLevel(theme, level).background,
        contrast: contrastRatio(paint.foreground, paint.background),
      })}
    </Text>
  );
}
it.each(['light', 'dark'] as const)(
  'rebases %s backing inside the opposite palette while retaining elevation',
  (outer) => {
    const { getByTestId } = render(
      <BloomThemeProvider mode={outer} fonts={false}>
        <SurfaceLevelProvider level={1} fill={outer === 'light' ? '#ffffff' : '#111111'}>
          <BloomColorScope mode={outer === 'light' ? 'dark' : 'light'}>
            <Probe />
          </BloomColorScope>
        </SurfaceLevelProvider>
      </BloomThemeProvider>,
    );
    const paint = JSON.parse(getByTestId('paint').props.children);
    expect(paint.level).toBe(1);
    expect(paint.fill).toBe(paint.expected);
    expect(paint.contrast).toBeGreaterThanOrEqual(4.5);
  },
);
it('keeps explicit nested surface fills inside a new scope', () => {
  const { getByTestId } = render(
    <BloomThemeProvider mode="light" fonts={false}>
      <BloomColorScope mode="dark">
        <SurfaceLevelProvider level={2} fill="#242424">
          <Probe />
        </SurfaceLevelProvider>
      </BloomColorScope>
    </BloomThemeProvider>,
  );
  expect(JSON.parse(getByTestId('paint').props.children)).toMatchObject({
    level: 2,
    fill: '#242424',
  });
});
