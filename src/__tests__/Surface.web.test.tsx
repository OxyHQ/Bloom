/** @jest-environment jsdom */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
jest.mock('../theme/use-theme', () => ({
  useTheme: () => ({ isDark: false, colors: {
    card: '#ffffff', background: '#ffffff', text: '#17251e', textSecondary: '#65716a',
    primary: '#166534', primaryForeground: '#ffffff', negative: '#991b1b', negativeForeground: '#ffffff',
    primarySubtle: 'rgba(22,101,52,0.13)', primarySubtleForeground: '#14532d',
  } }),
}));
import { SurfacePaint } from '../surface/SurfacePaint';
import { Surface } from '../surface/Surface.web';
import { Button } from '../button/Button.web';
import { SURFACE_REFRACTION_ID } from '../surface/web-refraction';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); });

it('uses real RN web layout styles and keeps the material on the same root', () => {
  act(() => root.render(<Surface testID="surface" className="caller-surface" style={[{ paddingHorizontal: 16 }, { flexDirection: 'row', borderRadius: 13 }]}><span>Content</span></Surface>));
  const surface = container.querySelector('[data-testid="surface"]') as HTMLElement;
  expect(surface.className).toContain('caller-surface');
  expect(surface.className).toContain('bloom-surface--glass');
  expect(getComputedStyle(surface).display).toBe('flex');
  expect(getComputedStyle(surface).flexDirection).toBe('row');
  expect(getComputedStyle(surface).paddingLeft).toBe('16px');
  expect(getComputedStyle(surface).paddingRight).toBe('16px');
  expect(getComputedStyle(surface).borderTopLeftRadius).toBe('13px');
  expect(surface.style.getPropertyValue('--bloom-surface-fill')).toBe('rgba(255, 255, 255, 0.25)');
});

it('shares one filter and identical optical recipes with disabled Button', () => {
  document.getElementById(`${SURFACE_REFRACTION_ID}-defs`)?.remove();
  act(() => root.render(<><Surface testID="surface"><span>Panel</span></Surface><Button disabled>Disabled</Button></>));
  expect(document.querySelectorAll(`#${SURFACE_REFRACTION_ID}`)).toHaveLength(1);
  const surfaceCss = document.getElementById('bloom-surface-web-css')!.textContent!;
  const buttonCss = document.getElementById('bloom-button-web-css')!.textContent!;
  for (const rule of [`filter: url(#${SURFACE_REFRACTION_ID})`, 'backdrop-filter: blur(3px)', 'inset 2px 2px 1px', 'rgba(255, 255, 255, 0.18)']) {
    expect(surfaceCss).toContain(rule);
    expect(buttonCss).toContain(rule);
  }
});

it('solid material removes the glass layer while retaining caller fill', () => {
  act(() => root.render(<Surface material="solid" fill="rgb(9, 20, 30)" testID="solid" />));
  const surface = container.querySelector('[data-testid="solid"]') as HTMLElement;
  expect(surface.className).not.toContain('bloom-surface--glass');
  expect(getComputedStyle(surface).backgroundColor).toBe('rgb(9, 20, 30)');
});

it('the universal paint entry renders web optics without a platform barrel', () => {
  act(() => root.render(<SurfacePaint fill="rgba(12, 34, 56, 0.25)" radius={19} />));
  const paint = container.querySelector('.bloom-surface-paint--glass') as HTMLElement;
  expect(paint).not.toBeNull();
  expect(paint.style.getPropertyValue('--bloom-surface-paint-fill')).toBe('rgba(12, 34, 56, 0.25)');
  expect(getComputedStyle(paint).position).toBe('absolute');
  expect(getComputedStyle(paint).pointerEvents).toBe('none');
  expect(getComputedStyle(paint).borderTopLeftRadius).toBe('19px');
  expect(container.querySelector('svg')).toBeNull();
  expect(document.getElementById(SURFACE_REFRACTION_ID)).not.toBeNull();
});
