import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useTheme } from '../theme/use-theme';
import {
  SurfaceLevelProvider,
  useSurfaceFill,
  useSurfaceFillForSnapshot,
  useSurfaceSnapshot,
  useSurfaceLevelValue,
  type SurfaceLevel,
} from '../styles/surface-levels';
import { useSurfaceLayer } from '../surface/use-surface-layer';

function Probe() {
  const theme = useTheme();
  const surface = useSurfaceSnapshot();
  const combined = { fill: useSurfaceFillForSnapshot(theme, surface), level: surface.level };
  const fill = useSurfaceFill();
  const level = useSurfaceLevelValue();
  const layer = useSurfaceLayer();
  return <Text testID="snapshot">{JSON.stringify({ combined, fill, level, layer })}</Text>;
}

function snapshot(screen: ReturnType<typeof render>) {
  return JSON.parse(screen.getByTestId('snapshot').props.children);
}

function tree(mode: 'light' | 'dark', level: SurfaceLevel, fill?: string) {
  return (
    <BloomThemeProvider mode={mode} colorPreset="oxy" fonts={false}>
      <SurfaceLevelProvider level={3} fill="#aa5500">
        <SurfaceLevelProvider level={level} fill={fill}>
          <Probe />
        </SurfaceLevelProvider>
      </SurfaceLevelProvider>
    </BloomThemeProvider>
  );
}

it('matches the public fill and level hooks across theme and nested backing updates', () => {
  const screen = render(tree('light', 0));
  for (const mode of ['light', 'dark'] as const) {
    for (const level of [0, 1, 2, 3] as const) {
      for (const fill of [undefined, '#445566', 'rgba(20,40,60,.5)']) {
        screen.rerender(tree(mode, level, fill));
        const value = snapshot(screen);
        expect(value.combined).toEqual({ fill: value.fill, level: value.level });
        expect(value.layer.parentFill).toBe(value.fill);
        expect(value.layer.parentLevel).toBe(value.level);
      }
    }
  }
});

it('uses the same default backing when there is no surface provider', () => {
  const screen = render(
    <BloomThemeProvider mode="dark" colorPreset="oxy" fonts={false}>
      <Probe />
    </BloomThemeProvider>,
  );
  const value = snapshot(screen);
  expect(value.combined).toEqual({ fill: value.fill, level: 0 });
  expect(value.layer.parentFill).toBe(value.fill);
  expect(value.layer.parentLevel).toBe(0);
});

it('reuses the context snapshot until its backing inputs change', () => {
  const seen: Array<ReturnType<typeof useSurfaceSnapshot>> = [];
  function IdentityProbe() {
    const theme = useTheme();
    const surface = useSurfaceSnapshot();
    useSurfaceFillForSnapshot(theme, surface);
    seen.push(surface);
    return null;
  }
  function identityTree(level: SurfaceLevel, fill: string) {
    return (
      <BloomThemeProvider mode="light" colorPreset="oxy" fonts={false}>
        <SurfaceLevelProvider level={level} fill={fill}>
          <IdentityProbe />
        </SurfaceLevelProvider>
      </BloomThemeProvider>
    );
  }
  const screen = render(identityTree(1, '#445566'));
  const initial = seen[seen.length - 1];
  screen.rerender(identityTree(1, '#445566'));
  expect(seen[seen.length - 1]).toBe(initial);
  screen.rerender(identityTree(2, '#445566'));
  const nextLevel = seen[seen.length - 1];
  expect(nextLevel).not.toBe(initial);
  expect(nextLevel).toEqual({ level: 2, fill: '#445566' });
  screen.rerender(identityTree(2, '#112233'));
  expect(seen[seen.length - 1]).not.toBe(nextLevel);
  expect(seen[seen.length - 1]).toEqual({ level: 2, fill: '#112233' });
});

function LayerOnly() {
  useSurfaceLayer();
  return null;
}

it('keeps the useSurfaceLayer missing-theme error', () => {
  const error = jest.spyOn(console, 'error').mockImplementation(() => {});
  try {
    expect(() => render(<LayerOnly />)).toThrow(
      'useTheme must be used within a <BloomThemeProvider>',
    );
  } finally {
    error.mockRestore();
  }
});
