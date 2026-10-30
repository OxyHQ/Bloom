/**
 * Increased contrast and the system's own accessibility settings, on native.
 *
 * iOS's Reduce Transparency and Increase Contrast and Android's high-contrast
 * text reach `useReducedTransparency()` / `useIncreasedContrast()` through
 * `BloomThemeProvider`, OR'd with its props and the platform's appearance.
 * Increased contrast reduces transparency too, and the native paint swaps the
 * edge light for a 1px hairline that holds 3:1 against the body.
 */
import React from 'react';
import { AccessibilityInfo, Platform, Text } from 'react-native';
import { act, render } from '@testing-library/react-native';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useReducedTransparency } from '../theme/reduced-transparency';
import { useIncreasedContrast } from '../theme/increased-contrast';
import { SurfacePaint } from '../surface/SurfacePaint';
import { SURFACE_CONTRAST_EDGE_RATIO, surfaceContrastEdge } from '../surface/shared';
import { contrastRatio } from '../styles/color-contrast';
import { APP_COLOR_NAMES } from '../theme/color-presets';
import { buildScopeVars } from '../theme/color-scope/style-builder';
import { resolvedStyle } from './support/rendered-style';

type Handler = (value: boolean) => void;
type Info = typeof AccessibilityInfo & Record<string, unknown>;

const info = AccessibilityInfo as Info;
const originalOS = Platform.OS;
const originalAdd = info.addEventListener;
const handlers = new Map<string, Handler>();
const removed: string[] = [];

function settings(values: Record<string, boolean | Error>) {
  for (const [name, value] of Object.entries(values)) {
    info[name] = jest.fn(() =>
      value instanceof Error ? Promise.reject(value) : Promise.resolve(value),
    );
  }
}

beforeEach(() => {
  handlers.clear();
  removed.length = 0;
  (info as { addEventListener: unknown }).addEventListener = (name: string, handler: Handler) => {
    handlers.set(name, handler);
    return { remove: () => removed.push(name) };
  };
});

afterEach(() => {
  Platform.OS = originalOS;
  (info as { addEventListener: unknown }).addEventListener = originalAdd;
  for (const name of [
    'isReduceTransparencyEnabled',
    'isDarkerSystemColorsEnabled',
    'isHighTextContrastEnabled',
  ])
    delete info[name];
});

function Probe() {
  const reduced = useReducedTransparency();
  const contrast = useIncreasedContrast();
  return <Text testID="probe">{`${reduced}/${contrast}`}</Text>;
}

async function mount(ui: React.ReactElement) {
  const tree = render(ui);
  // The native queries are promises: let them settle.
  await act(async () => {});
  return tree;
}

const read = (tree: ReturnType<typeof render>) => tree.getByTestId('probe').props.children;

describe('the system settings, on iOS', () => {
  beforeEach(() => {
    Platform.OS = 'ios';
  });

  it('reduces transparency when Reduce Transparency is on', async () => {
    settings({ isReduceTransparencyEnabled: true, isDarkerSystemColorsEnabled: false });
    const tree = await mount(
      <BloomThemeProvider fonts={false}>
        <Probe />
      </BloomThemeProvider>,
    );
    expect(read(tree)).toBe('true/false');
  });

  it('follows Increase Contrast as it changes, which reduces transparency too', async () => {
    settings({ isReduceTransparencyEnabled: false, isDarkerSystemColorsEnabled: false });
    const tree = await mount(
      <BloomThemeProvider fonts={false}>
        <Probe />
      </BloomThemeProvider>,
    );
    expect(read(tree)).toBe('false/false');
    act(() => handlers.get('darkerSystemColorsChanged')?.(true));
    expect(read(tree)).toBe('true/true');
    act(() => handlers.get('darkerSystemColorsChanged')?.(false));
    expect(read(tree)).toBe('false/false');
  });

  it('stops listening when the last provider unmounts', async () => {
    settings({ isReduceTransparencyEnabled: false, isDarkerSystemColorsEnabled: false });
    const tree = await mount(
      <BloomThemeProvider fonts={false}>
        <Probe />
      </BloomThemeProvider>,
    );
    tree.unmount();
    expect(removed.sort()).toEqual(['darkerSystemColorsChanged', 'reduceTransparencyChanged']);
  });
});

describe('the system settings, on Android', () => {
  beforeEach(() => {
    Platform.OS = 'android';
  });

  it('increases contrast with high-contrast text', async () => {
    settings({ isHighTextContrastEnabled: true });
    const tree = await mount(
      <BloomThemeProvider fonts={false}>
        <Probe />
      </BloomThemeProvider>,
    );
    expect(read(tree)).toBe('true/true');
  });

  it('leaves both off on a host that does not implement the query (OxyOS)', async () => {
    settings({ isHighTextContrastEnabled: new Error('not available') });
    const tree = await mount(
      <BloomThemeProvider fonts={false}>
        <Probe />
      </BloomThemeProvider>,
    );
    expect(read(tree)).toBe('false/false');
  });
});

it('the prop increases contrast and reduces transparency; reduce transparency alone does not raise contrast', async () => {
  Platform.OS = 'ios';
  const contrast = await mount(
    <BloomThemeProvider fonts={false} increaseContrast>
      <Probe />
    </BloomThemeProvider>,
  );
  expect(read(contrast)).toBe('true/true');
  contrast.unmount();
  const reduced = await mount(
    <BloomThemeProvider fonts={false} reduceTransparency>
      <Probe />
    </BloomThemeProvider>,
  );
  expect(read(reduced)).toBe('true/false');
});

describe('the native paint with contrast increased', () => {
  beforeEach(() => {
    Platform.OS = 'ios';
  });

  const paint = (props: Partial<React.ComponentProps<typeof SurfacePaint>>, increase: boolean) =>
    render(
      <BloomThemeProvider fonts={false} increaseContrast={increase} mode="light">
        <SurfacePaint testID="paint" fill="#f4f4f6" radius={16} {...props} />
      </BloomThemeProvider>,
    );

  it('swaps the edge light for a hairline that holds 3:1 against the body', () => {
    const tree = paint({}, true);
    const style = resolvedStyle(tree.getByTestId('paint').props.style);
    expect(style.boxShadow).toBeUndefined();
    expect(style.borderWidth).toBe(1);
    expect(contrastRatio(String(style.borderColor), '#f4f4f6')).toBeGreaterThanOrEqual(
      SURFACE_CONTRAST_EDGE_RATIO,
    );
    expect(style.backgroundColor).toBe('#f4f4f6');
  });

  it('keeps the edge light, and no border, at rest', () => {
    const style = resolvedStyle(paint({}, false).getByTestId('paint').props.style);
    expect(style.boxShadow).toEqual(expect.any(String));
    expect(style.borderWidth).toBeUndefined();
  });

  it('draws no hairline on a host that draws its own border', () => {
    const style = resolvedStyle(paint({ rim: false }, true).getByTestId('paint').props.style);
    expect(style.borderWidth).toBeUndefined();
  });
});

describe('surfaceContrastEdge', () => {
  it('holds 3:1 against every preset card and background, light and dark, and stays quieter than the text', () => {
    let checked = 0;
    for (const preset of APP_COLOR_NAMES) {
      for (const mode of ['light', 'dark'] as const) {
        const vars = buildScopeVars(preset, mode);
        const text = vars['--foreground'];
        for (const fill of [vars['--card'], vars['--background']]) {
          if (!fill || !text) continue;
          const edge = surfaceContrastEdge(fill, text);
          expect(contrastRatio(edge, fill)).toBeGreaterThanOrEqual(SURFACE_CONTRAST_EDGE_RATIO);
          expect(contrastRatio(edge, fill)).toBeLessThanOrEqual(contrastRatio(text, fill));
          checked++;
        }
      }
    }
    expect(checked).toBeGreaterThanOrEqual(APP_COLOR_NAMES.length * 4);
  });

  it('draws nothing for a clear body', () => {
    expect(surfaceContrastEdge('transparent', '#000')).toBe('transparent');
    expect(surfaceContrastEdge('rgba(0, 0, 0, 0)', '#000')).toBe('transparent');
  });
});
