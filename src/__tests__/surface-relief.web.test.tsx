/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Surface } from '../surface/Surface.web';
import { SurfacePaint } from '../surface/SurfacePaint';
import { Card } from '../card/Card';
import { Button } from '../button/Button.web';
import { useSurfaceFill, useSurfaceLevelValue } from '../styles/surface-levels';
import { resolveSurfaceOptics } from '../surface/shared';
import { surfaceMaterialCss } from '../surface/web-material';

jest.mock('react-native', () => jest.requireActual('react-native-web'));
jest.mock('../theme/use-theme', () => ({
  useTheme: () => ({
    isDark: false,
    colors: {
      backgroundSecondary: '#eeeeee',
      backgroundTertiary: '#dddddd',
      textTertiary: '#888888',
      error: '#991b1b',
      errorSubtle: 'rgba(153,27,27,0.13)',
      errorSubtleForeground: '#7f1d1d',
      card: '#ffffff',
      background: '#ffffff',
      text: '#17251e',
      border: '#999999',
      textSecondary: '#65716a',
      primary: '#166534',
      primaryForeground: '#ffffff',
      negative: '#991b1b',
      negativeForeground: '#ffffff',
      primarySubtle: 'rgba(22,101,52,0.13)',
      primarySubtleForeground: '#14532d',
    },
  }),
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});
const host = (id: string) => container.querySelector(`[data-testid="${id}"]`) as HTMLElement;
const property = (id: string, name: string) => host(id).style.getPropertyValue(name);

function Probe() {
  return (
    <span data-testid="probe" data-fill={useSurfaceFill()} data-level={useSurfaceLevelValue()} />
  );
}

it('shares relief while preserving semantic action pairs and nested backing', () => {
  act(() =>
    root.render(
      <Surface fill="#123456" testID="panel">
        <Card testID="card">
          <Probe />
          <Button testID="accent">Continue</Button>
          <Button tone="danger" testID="danger">
            Delete
          </Button>
          <Button appearance="subtle" testID="subtle">
            Later
          </Button>
        </Card>
      </Surface>,
    ),
  );
  const relief = resolveSurfaceOptics(false).bodyShadow;
  expect(property('panel', '--bloom-surface-body-shadow')).toBe(relief);
  expect(property('accent', '--bloom-surface-body-shadow')).toBe(relief);
  expect(property('danger', '--bloom-surface-body-shadow')).toBe(relief);
  expect(property('accent', '--bloom-btn-bg')).toBe('rgba(22, 101, 52, 0.72)');
  expect(property('danger', '--bloom-btn-bg')).toBe('rgba(153, 27, 27, 0.72)');
  expect(property('accent', '--bloom-btn-fg')).toBe('#ffffff');
  expect(property('danger', '--bloom-btn-fg')).toBe('#fff');
  expect(property('subtle', '--bloom-btn-fg')).toBe('#14532d');
  expect(host('probe').getAttribute('data-level')).toBe('2');
  expect(host('probe').getAttribute('data-fill')).not.toBe(property('panel', '--bloom-surface'));
  expect(property('panel', '--bloom-surface')).toBe('rgb(84, 109, 133)');
});

it('does not inherit relief through a clear surface or an explicit sheen opt-out', () => {
  act(() =>
    root.render(
      <Surface>
        <Surface testID="clear" fill="transparent" />
        <SurfacePaint testID="quiet" fill="#123456" sheen={false} />
        <Button material="flat" testID="flat">
          Flat
        </Button>
      </Surface>,
    ),
  );
  expect(host('clear').className).not.toContain('bloom-surface--material');
  expect(property('quiet', '--bloom-surface-body-shadow')).toBe('none');
  expect(host('flat').className).not.toContain('bloom-btn--surface');
});

it('removes body relief in every reduced-transparency and contrast CSS path', () => {
  const css = surfaceMaterialCss('.relief-host', 'var(--fill)');
  for (const scope of [
    ':root[data-bloom-transparency="reduced"] .relief-host',
    ':root[data-bloom-contrast="more"] .relief-host',
  ]) {
    for (const layer of ['before', 'after']) {
      const rule = css.split(`${scope}::${layer} {`)[1]?.split('}')[0];
      expect(rule).toContain('box-shadow: none;');
      expect(rule).toContain('backdrop-filter: none;');
    }
  }
  for (const query of [
    'prefers-reduced-transparency: reduce',
    'prefers-contrast: more',
    'forced-colors: active',
  ]) {
    for (const layer of ['before', 'after']) {
      const rule = css
        .split(`@media (${query}) {`)[1]
        ?.split(`.relief-host::${layer} {`)[1]
        ?.split('}')[0];
      expect(rule).toContain('box-shadow: none;');
    }
  }
});
