/** @jest-environment jsdom */
import {
  SURFACE_FILTER,
  SURFACE_EDGE_GLOW,
  SURFACE_HIGHLIGHT_FILTER,
  resolveSurfaceTint,
  resolveSurfaceFill,
} from '../surface/shared';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
jest.mock('../theme/use-theme', () => ({
  useTheme: () => ({
    isDark: false,
    colors: {
      backgroundSecondary: '#eeeeee',
      backgroundTertiary: '#dddddd',
      textTertiary: '#888888',
      border: '#999999',
      card: '#ffffff',
      background: '#ffffff',
      text: '#17251e',
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
import {
  SurfaceLevelProvider,
  useSurfaceFill,
  useSurfaceLevelValue,
  surfaceFillOn,
} from '../styles/surface-levels';
import { useTheme } from '../theme/use-theme';
import { SurfacePaint } from '../surface/SurfacePaint';
import { Surface } from '../surface/Surface.web';
import { useSurfaceBacking } from '../surface/use-surface-backing';
import { Button } from '../button/Button.web';

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

it('uses real RN web layout styles and keeps the material on the same root', () => {
  act(() =>
    root.render(
      <Surface
        testID="surface"
        className="caller-surface"
        style={[{ paddingHorizontal: 16 }, { flexDirection: 'row', borderRadius: 13 }]}
      >
        <span>Content</span>
      </Surface>,
    ),
  );
  const surface = container.querySelector('[data-testid="surface"]') as HTMLElement;
  expect(surface.className).toContain('caller-surface');
  expect(surface.className).toContain('bloom-surface--material');
  expect(getComputedStyle(surface).display).toBe('flex');
  expect(getComputedStyle(surface).flexDirection).toBe('row');
  expect(getComputedStyle(surface).paddingLeft).toBe('16px');
  expect(getComputedStyle(surface).paddingRight).toBe('16px');
  expect(getComputedStyle(surface).borderTopLeftRadius).toBe('13px');
  expect(surface.style.getPropertyValue('--bloom-surface-fill')).toBe('rgba(255, 255, 255, 0.9)');
});

it('shares one glass material across Surface and disabled Button', () => {
  act(() =>
    root.render(
      <>
        <Surface testID="surface">
          <span>Panel</span>
        </Surface>
        <Button disabled>Disabled</Button>
      </>,
    ),
  );
  const surfaceCss = document.getElementById('bloom-surface-web-css')!.textContent!;
  const buttonCss = document.getElementById('bloom-button-web-css')!.textContent!;
  for (const css of [surfaceCss, buttonCss]) {
    const glass = css.match(/::before\s*\{[^}]+\}/g)?.find((rule) => rule.includes('z-index: -2'));
    expect(glass).toContain(`backdrop-filter: var(--bloom-surface-filter, ${SURFACE_FILTER})`);
    const edge = css.match(/::after\s*\{[^}]+\}/g)?.find((rule) => rule.includes('z-index: -1'));
    expect(edge).toContain(
      `backdrop-filter: var(--bloom-surface-highlight-filter, ${SURFACE_HIGHLIGHT_FILTER})`,
    );
    expect(edge).toContain('mask-composite: add, intersect, exclude');
    expect(edge).toContain(`mask-image: var(--bloom-surface-edge-glow, ${SURFACE_EDGE_GLOW})`);
    expect(css).not.toContain('feDisplacementMap');
    expect(css).not.toMatch(/filter:\s*url\(/);
  }
  const surface = document.querySelector('[data-testid="surface"]') as HTMLElement;
  expect(surface.style.getPropertyValue('--bloom-surface-highlight-filter')).toBe(
    SURFACE_HIGHLIGHT_FILTER,
  );
});

it('retains caller colour with subtle translucency beneath the optical edge', () => {
  act(() => root.render(<Surface fill="rgb(9, 20, 30)" testID="solid" />));
  const surface = container.querySelector('[data-testid="solid"]') as HTMLElement;
  expect(surface.className).toContain('bloom-surface--material');
  expect(surface.style.getPropertyValue('--bloom-surface-fill')).toBe('rgba(9, 20, 30, 0.9)');
});

it('the universal paint entry renders web optics without a platform barrel', () => {
  act(() => root.render(<SurfacePaint fill="rgba(12, 34, 56, 0.25)" radius={19} />));
  const paint = container.querySelector('.bloom-surface-paint') as HTMLElement;
  expect(paint).not.toBeNull();
  expect(paint.style.getPropertyValue('--bloom-surface-paint-fill')).toBe('rgba(12, 34, 56, 0.25)');
  expect(getComputedStyle(paint).position).toBe('absolute');
  expect(getComputedStyle(paint).pointerEvents).toBe('none');
  expect(getComputedStyle(paint).borderTopLeftRadius).toBe('19px');
  expect(container.querySelector('svg')).toBeNull();
  expect(document.querySelector('svg')).toBeNull();
});

it.each(['solid', 'subtle', 'outline'] as const)(
  'keeps %s disabled material and native disabled semantics on latest Button',
  (appearance) => {
    act(() =>
      root.render(
        <Button appearance={appearance} disabled>
          Unavailable
        </Button>,
      ),
    );
    const button = container.querySelector('button')!;
    expect(button.disabled).toBe(true);
    expect(button.className).toContain('bloom-btn--surface');
    expect(document.querySelector('svg')).toBeNull();
  },
);
it('keeps plain actions unfilled and forwards the original activation event', () => {
  const onPress = jest.fn();
  act(() =>
    root.render(
      <Button appearance="plain" onPress={onPress}>
        Inline
      </Button>,
    ),
  );
  const button = container.querySelector('button')!;
  expect(button.className).not.toContain('bloom-btn--surface');
  act(() => button.click());
  expect(onPress.mock.calls[0][0].type).toBe('click');
});
it('uses the explicit brand pair and exposes persistent pressed state', () => {
  act(() =>
    root.render(
      <Button pressed colors={{ background: '#123456', foreground: '#ffffff' }}>
        Brand
      </Button>,
    ),
  );
  const button = container.querySelector('button')!;
  expect(button.getAttribute('aria-pressed')).toBe('true');
  expect(button.style.getPropertyValue('--bloom-btn-bg')).toBe('rgba(17, 48, 79, 0.9)');
  expect(button.style.getPropertyValue('--bloom-btn-fg')).toBe('#ffffff');
});

it('can turn the edge light off without dropping the glass', () => {
  act(() =>
    root.render(
      <SurfacePaint testID="pane" fill="rgba(255,255,255,.25)" radius={20} rim={false} />,
    ),
  );
  const pane = container.querySelector('[data-testid="pane"]') as HTMLElement;
  expect(pane.className).toContain('bloom-surface-paint');
  expect(pane.style.getPropertyValue('--bloom-surface-filter')).toBe(SURFACE_FILTER);
  expect(pane.style.getPropertyValue('--bloom-surface-highlight-filter')).toBe('none');
});

// The rim owns the edge even on semantic outline buttons.
it.each(['solid', 'subtle', 'outline'] as const)(
  'keeps %s semantic borders transparent in every state',
  (appearance) => {
    act(() => root.render(<Button appearance={appearance}>Action</Button>));
    const button = container.querySelector('button')!;
    for (const state of ['', '-hover', '-active', '-disabled']) {
      expect(button.style.getPropertyValue(`--bloom-btn-border${state}`)).toBe('rgba(0, 0, 0, 0)');
    }
  },
);

function SurfaceProbe() {
  return (
    <span data-testid="probe" data-fill={useSurfaceFill()} data-level={useSurfaceLevelValue()} />
  );
}

it('publishes its actual fill to hooks and CSS and steps again inside a nested surface', () => {
  act(() =>
    root.render(
      <Surface fill="#123456" testID="outer">
        <Surface testID="inner">
          <SurfaceProbe />
        </Surface>
      </Surface>,
    ),
  );
  const outer = container.querySelector('[data-testid="outer"]') as HTMLElement;
  const inner = container.querySelector('[data-testid="inner"]') as HTMLElement;
  const outerFill = resolveSurfaceFill(resolveSurfaceTint('#123456'), '#ffffff');
  const innerTint = resolveSurfaceTint(surfaceFillOn(useTheme(), outerFill));
  const expected = resolveSurfaceFill(innerTint, outerFill);
  expect(outer.style.getPropertyValue('--bloom-surface')).toBe(outerFill);
  expect(inner.style.getPropertyValue('--bloom-surface-fill')).toBe(innerTint);
  expect(inner.style.getPropertyValue('--bloom-surface')).toBe(expected);
  expect(container.querySelector('[data-testid="probe"]')?.getAttribute('data-fill')).toBe(
    expected,
  );
  expect(container.querySelector('[data-testid="probe"]')?.getAttribute('data-level')).toBe('2');
});

it('continues stepping off the real parent after the named ladder ends', () => {
  act(() =>
    root.render(
      <SurfaceLevelProvider level={3} fill="#123456">
        <Surface testID="deep">
          <SurfaceProbe />
        </Surface>
      </SurfaceLevelProvider>,
    ),
  );
  const pane = container.querySelector('[data-testid="deep"]') as HTMLElement;
  expect(pane.style.getPropertyValue('--bloom-surface-fill')).toBe(
    resolveSurfaceTint(surfaceFillOn(useTheme(), '#123456')),
  );
  expect(container.querySelector('[data-testid="probe"]')?.getAttribute('data-level')).toBe('3');
});

it('preserves caller alpha while publishing its estimated composite over the parent', () => {
  act(() =>
    root.render(
      <SurfaceLevelProvider level={1} fill="#000000">
        <Surface style={{ backgroundColor: 'rgba(255,255,255,0.5)' }} testID="custom">
          <SurfaceProbe />
        </Surface>
      </SurfaceLevelProvider>,
    ),
  );
  const pane = container.querySelector('[data-testid="custom"]') as HTMLElement;
  expect(pane.style.getPropertyValue('--bloom-surface-fill')).toBe('rgba(255,255,255,0.5)');
  expect(container.querySelector('[data-testid="probe"]')?.getAttribute('data-fill')).toBe(
    'rgb(128, 128, 128)',
  );
});

it('forwards the original layout host ref and accessibility semantics', () => {
  const ref = React.createRef<React.ElementRef<typeof Surface>>();
  act(() =>
    root.render(<Surface ref={ref} role="toolbar" accessibilityLabel="Tools" testID="host" />),
  );
  const host = container.querySelector('[data-testid="host"]');
  expect(ref.current).toBe(host);
  expect(host?.getAttribute('role')).toBe('toolbar');
  expect(host?.getAttribute('aria-label')).toBe('Tools');
});

it('keeps an explicitly transparent surface on its enclosing fill and depth', () => {
  act(() =>
    root.render(
      <SurfaceLevelProvider level={2} fill="#123456">
        <Surface style={{ backgroundColor: 'transparent' }} testID="clear">
          <SurfaceProbe />
        </Surface>
      </SurfaceLevelProvider>,
    ),
  );
  expect(container.querySelector('[data-testid="clear"]')?.className).not.toContain(
    'bloom-surface--material',
  );
  expect(container.querySelector('[data-testid="probe"]')?.getAttribute('data-fill')).toBe(
    '#123456',
  );
  expect(container.querySelector('[data-testid="probe"]')?.getAttribute('data-level')).toBe('2');
});

function DockedProbe({ background }: { background: string }) {
  const backing = useSurfaceBacking('#ffffff', [
    { backgroundColor: '#ff0000' },
    { backgroundColor: background },
  ]);
  return (
    <div data-testid="docked" style={backing.vars as React.CSSProperties}>
      <SurfaceLevelProvider level={backing.level} fill={backing.fill}>
        <SurfaceProbe />
      </SurfaceLevelProvider>
    </div>
  );
}
it.each([
  ['#123456', '#123456'],
  ['transparent', '#000000'],
  ['rgba(255,255,255,0.5)', 'rgb(128, 128, 128)'],
])('publishes docked %s paint without adding depth', (background, expected) => {
  act(() =>
    root.render(
      <SurfaceLevelProvider level={2} fill="#000000">
        <DockedProbe background={background!} />
      </SurfaceLevelProvider>,
    ),
  );
  expect(container.querySelector('[data-testid="probe"]')?.getAttribute('data-fill')).toBe(
    expected,
  );
  expect(container.querySelector('[data-testid="probe"]')?.getAttribute('data-level')).toBe('2');
  expect(
    (container.querySelector('[data-testid="docked"]') as HTMLElement).style.getPropertyValue(
      '--bloom-surface',
    ),
  ).toBe(background === 'transparent' ? '' : expected);
});

it('gives an explicit radius precedence over caller style on the material host', () => {
  act(() =>
    root.render(<Surface testID="explicit-radius" radius={20} style={{ borderRadius: 8 }} />),
  );
  const pane = container.querySelector('[data-testid="explicit-radius"]') as HTMLElement;
  expect(getComputedStyle(pane).borderTopLeftRadius).toBe('20px');
});
