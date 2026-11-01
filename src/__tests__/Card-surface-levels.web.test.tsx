/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { Text } from 'react-native';
import { Card } from '../card';
import {
  resolveSurfaceLevel,
  SurfaceLevelProvider,
  surfaceFillOn,
  useSurfaceFill,
  useSurfaceLevelValue,
  type SurfaceLevel,
} from '../styles/surface-levels';
import { resolveSurfaceFill, resolveSurfaceTint } from '../surface/shared';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { buildTheme } from '../theme/build-theme';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function Probe() {
  const fill = useSurfaceFill();
  const level = useSurfaceLevelValue();
  return <Text testID="backing">{JSON.stringify({ fill, level })}</Text>;
}

it.each(['light', 'dark'] as const)(
  'publishes the correct descendant backing for all surface levels in %s mode',
  (mode) => {
    const theme = buildTheme('oxy', mode);
    for (const level of [0, 1, 2, 3] as const satisfies readonly SurfaceLevel[]) {
      for (const explicitFill of [undefined, '#445566']) {
        const parent = explicitFill ?? resolveSurfaceLevel(theme, level).background;
        const expected =
          level === 0 && parent === theme.colors.background
            ? theme.colors.card
            : surfaceFillOn(theme, parent);
        act(() =>
          root.render(
            <BloomThemeProvider fonts={false} mode={mode} colorPreset="oxy">
              <SurfaceLevelProvider level={level} fill={explicitFill}>
                <Card appearance="outline">
                  <Probe />
                </Card>
              </SurfaceLevelProvider>
            </BloomThemeProvider>,
          ),
        );
        const backing = container.querySelector('[data-testid="backing"]');
        if (!backing?.textContent) throw new Error('Missing card backing');
        expect(JSON.parse(backing.textContent)).toEqual({
          fill: resolveSurfaceFill(resolveSurfaceTint(expected), parent),
          level: Math.min(level + 1, 3),
        });
      }
    }
  },
);

it('updates the published backing when the mounted theme changes', () => {
  for (const mode of ['light', 'dark'] as const) {
    const theme = buildTheme('oxy', mode);
    const parent = resolveSurfaceLevel(theme, 2).background;
    act(() =>
      root.render(
        <BloomThemeProvider fonts={false} mode={mode} colorPreset="oxy">
          <SurfaceLevelProvider level={2}>
            <Card appearance="outline">
              <Probe />
            </Card>
          </SurfaceLevelProvider>
        </BloomThemeProvider>,
      ),
    );
    const backing = container.querySelector('[data-testid="backing"]');
    if (!backing?.textContent) throw new Error('Missing card backing');
    expect(JSON.parse(backing.textContent)).toEqual({
      fill: resolveSurfaceFill(resolveSurfaceTint(surfaceFillOn(theme, parent)), parent),
      level: 3,
    });
  }
});
