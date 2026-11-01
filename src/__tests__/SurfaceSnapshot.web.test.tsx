/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
import { Text } from 'react-native';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useTheme } from '../theme/use-theme';
import {
  SurfaceLevelProvider,
  useSurfaceFill,
  useSurfaceFillForSnapshot,
  useSurfaceSnapshot,
  useSurfaceLevelValue,
} from '../styles/surface-levels';
import { useSurfaceLayer } from '../surface/use-surface-layer';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
function Probe() {
  const theme = useTheme();
  const surface = useSurfaceSnapshot();
  const combined = { fill: useSurfaceFillForSnapshot(theme, surface), level: surface.level };
  const fill = useSurfaceFill();
  const level = useSurfaceLevelValue();
  const layer = useSurfaceLayer();
  return <Text testID="snapshot">{JSON.stringify({ combined, fill, level, layer })}</Text>;
}

it('matches the public hooks across nested fill, level and live theme changes on web', () => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  try {
    for (const mode of ['light', 'dark'] as const) {
      for (const level of [0, 1, 2, 3] as const) {
        for (const fill of [undefined, '#445566', 'rgba(20,40,60,.5)']) {
          act(() =>
            root.render(
              <BloomThemeProvider mode={mode} colorPreset="oxy" fonts={false}>
                <SurfaceLevelProvider level={3} fill="#aa5500">
                  <SurfaceLevelProvider level={level} fill={fill}>
                    <Probe />
                  </SurfaceLevelProvider>
                </SurfaceLevelProvider>
              </BloomThemeProvider>,
            ),
          );
          const text = container.querySelector('[data-testid="snapshot"]')?.textContent;
          if (!text) throw new Error('Missing backing snapshot');
          const value = JSON.parse(text);
          expect(value.combined).toEqual({ fill: value.fill, level: value.level });
          expect(value.layer.parentFill).toBe(value.fill);
          expect(value.layer.parentLevel).toBe(value.level);
        }
      }
    }
  } finally {
    act(() => root.unmount());
    container.remove();
  }
});

it('uses the same default backing without a surface provider on web', () => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  try {
    act(() =>
      root.render(
        <BloomThemeProvider mode="dark" colorPreset="oxy" fonts={false}>
          <Probe />
        </BloomThemeProvider>,
      ),
    );
    const text = container.querySelector('[data-testid="snapshot"]')?.textContent;
    if (!text) throw new Error('Missing backing snapshot');
    const value = JSON.parse(text);
    expect(value.combined).toEqual({ fill: value.fill, level: 0 });
    expect(value.layer.parentFill).toBe(value.fill);
    expect(value.layer.parentLevel).toBe(0);
  } finally {
    act(() => root.unmount());
    container.remove();
  }
});
