/** @jest-environment jsdom */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
jest.mock('../theme/use-theme', () => ({
  useTheme: () => ({ isDark: false, colors: {
    backgroundSecondary: '#eeeeee', backgroundTertiary: '#dddddd', textTertiary: '#888888', border: '#999999', card: '#ffffff', background: '#ffffff', text: '#17251e', textSecondary: '#65716a',
    primary: '#166534', primaryForeground: '#ffffff', negative: '#991b1b', negativeForeground: '#ffffff',
    primarySubtle: 'rgba(22,101,52,0.13)', primarySubtleForeground: '#14532d',
  } }),
}));
import { Button, BLOOM_BUTTON_CSS } from '../button/Button.web';
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let container: HTMLDivElement;
let root: Root;
beforeEach(() => { jest.useFakeTimers(); container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); jest.useRealTimers(); });

it.each(['solid', 'subtle', 'outline'] as const)('keeps %s opaque material and its rim when disabled', appearance => {
  act(() => root.render(<Button appearance={appearance} disabled>Disabled</Button>));
  const button = container.querySelector('button')!;
  expect(button.disabled).toBe(true);
  expect(button.className).toContain('bloom-btn--surface');
  expect(button.style.getPropertyValue('--bloom-btn-bg-disabled')).toBe('#eeeeee');
  expect(BLOOM_BUTTON_CSS).not.toContain('backdrop-filter:');
  expect(BLOOM_BUTTON_CSS).not.toContain('filter: url(');
  expect(BLOOM_BUTTON_CSS).toContain('inset 2px 2px 1px');
});
it('composites a subtle semantic tint over the stable card background', () => {
  act(() => root.render(<Button appearance="subtle">Subtle</Button>));
  const button = container.querySelector('button')!;
  expect(button.style.getPropertyValue('--bloom-btn-bg')).toBe('rgb(225, 235, 229)');
  expect(button.style.getPropertyValue('--bloom-btn-fg')).toBe('#14532d');
});
it('preserves an opaque brand pair and keeps plain actions unfilled', () => {
  act(() => root.render(<><Button colors={{background:'#123456',foreground:'#ffffff'}}>Brand</Button><Button appearance="plain">Plain</Button></>));
  const [brand, plain] = container.querySelectorAll('button');
  expect(brand!.style.getPropertyValue('--bloom-btn-bg')).toBe('#123456');
  expect(brand!.style.getPropertyValue('--bloom-btn-fg')).toBe('#ffffff');
  expect(plain!.className).not.toContain('bloom-btn--surface');
});
