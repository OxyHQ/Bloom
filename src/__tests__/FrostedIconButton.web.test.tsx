/**
 * @jest-environment jsdom
 */

import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { getByRole, fireEvent } from '@testing-library/dom';
import { renderToStaticMarkup } from 'react-dom/server';
import '@testing-library/jest-dom';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { FrostedIconButton } from '../frosted-icon-button/FrostedIconButton.web';
import { parseRgb } from '../theme/color-utils';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

function mount(ui: React.ReactElement, mode: 'light' | 'dark' = 'dark'): HTMLElement {
  act(() => {
    root.render(
      <BloomThemeProvider mode={mode} colorPreset="blue">
        {ui}
      </BloomThemeProvider>,
    );
  });
  return container;
}

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

// Mention's measured dark page background — the "invisible circle" bug composited
// a near-black `card` fill onto this and vanished. The frosted chip must read.
const PAGE_DARK = { r: 11, g: 11, b: 15 };

/** Composite an `rgba(...)` surface over an opaque background (source-over). */
function compositeOver(surface: string, bg: { r: number; g: number; b: number }) {
  const base = parseRgb(surface);
  const m = /rgba?\(([^)]+)\)/i.exec(surface);
  const rawAlpha = m?.[1]?.split(',')[3];
  const a = rawAlpha === undefined ? 1 : Number(rawAlpha);
  if (!base) throw new Error(`not an rgba string: ${surface}`);
  return {
    r: Math.round(bg.r * (1 - a) + base.r * a),
    g: Math.round(bg.g * (1 - a) + base.g * a),
    b: Math.round(bg.b * (1 - a) + base.b * a),
  };
}

describe('FrostedIconButton.web', () => {
  it('renders a real <button> with the accessible label', () => {
    const c = mount(<FrostedIconButton accessibilityLabel="Back" icon={<span>x</span>} />);
    const btn = getByRole(c, 'button', { name: 'Back' });
    expect(btn.tagName).toBe('BUTTON');
    expect(btn).toHaveClass('bloom-frosted-icon-btn');
  });

  it('self-injects its interaction stylesheet once', () => {
    mount(<FrostedIconButton accessibilityLabel="Back" icon={<span>x</span>} />);
    mount(<FrostedIconButton accessibilityLabel="Fwd" icon={<span>y</span>} />);
    expect(document.querySelectorAll('#bloom-frosted-icon-button-web-css')).toHaveLength(1);
  });

  // THE bug this component exists to prevent: on a dark SOLID page, a `card`-fill
  // circle composited to near-black and vanished. Prove the frosted surface is a
  // LIGHT tint that reads as a distinct, clearly-lighter circle on rgb(11,11,15).
  describe('reads on a solid dark background (nothing behind it)', () => {
    it('uses a low-opacity LIGHT tint distinguishable from the page', () => {
      const c = mount(<FrostedIconButton accessibilityLabel="Back" icon={<span>x</span>} />);
      const btn = getByRole(c, 'button');
      const surface = btn.style.backgroundColor;

      // Not the page color, and a genuine translucent (rgba) surface.
      expect(surface).not.toBe('rgb(11, 11, 15)');
      expect(surface).toMatch(/^rgba\(/);

      // The tint's BASE color is light (each channel high) — a light frost, not a
      // dark card fill.
      const base = parseRgb(surface);
      if (!base) throw new Error('unreachable');
      expect(base.r).toBeGreaterThanOrEqual(200);
      expect(base.g).toBeGreaterThanOrEqual(200);
      expect(base.b).toBeGreaterThanOrEqual(200);

      // Composited over the page it is clearly LIGHTER than rgb(11,11,15).
      const composite = compositeOver(surface, PAGE_DARK);
      expect(composite.r - PAGE_DARK.r).toBeGreaterThanOrEqual(15);
      expect(composite.g - PAGE_DARK.g).toBeGreaterThanOrEqual(15);
      expect(composite.b - PAGE_DARK.b).toBeGreaterThanOrEqual(15);
    });

    it('renders a hairline ring and a shadow that survive dark mode', () => {
      const c = mount(<FrostedIconButton accessibilityLabel="Back" icon={<span>x</span>} />);
      const btn = getByRole(c, 'button');
      // Ring: a translucent border COLOR is present inline (per-instance token).
      expect(btn.style.borderColor).toMatch(/^rgba\(/);
      // The hairline border-style/width live in the self-injected stylesheet.
      const css = document.getElementById('bloom-frosted-icon-button-web-css')?.textContent ?? '';
      expect(css).toMatch(/border-style:\s*solid/);
      expect(css).toMatch(/border-width:\s*1px/);
      // Shadow is NOT killed in dark mode.
      expect(btn.style.boxShadow).not.toBe('');
      expect(btn.style.boxShadow).toMatch(/rgba?\(/);
    });

    // jsdom's CSS engine drops `backdrop-filter`, so assert it via SSR style
    // serialization — which emits EVERY style key exactly as the browser receives
    // it (react-dom writes the same inline style on a real DOM <button>).
    it('emits a real CSS backdrop-filter blur when frosted (and drops it when active)', () => {
      const frosted = renderToStaticMarkup(
        <BloomThemeProvider mode="dark" colorPreset="blue">
          <FrostedIconButton accessibilityLabel="Back" icon={<span>x</span>} />
        </BloomThemeProvider>,
      );
      expect(frosted).toMatch(/backdrop-filter:\s*blur\(\d+px\)/);

      const active = renderToStaticMarkup(
        <BloomThemeProvider mode="dark" colorPreset="blue">
          <FrostedIconButton accessibilityLabel="Back" active icon={<span>x</span>} />
        </BloomThemeProvider>,
      );
      // Active is solid: no blur (either absent or explicitly "none").
      expect(active).not.toMatch(/backdrop-filter:\s*blur\(/);
    });
  });

  describe('active (solid "on") state', () => {
    it('fills opaque (no rgba alpha), drops the blur, and sets aria-pressed', () => {
      const c = mount(<FrostedIconButton accessibilityLabel="Mute" active icon={<span>x</span>} />);
      const btn = getByRole(c, 'button');
      // Opaque solid fill — an `rgb(...)` (not translucent `rgba`).
      expect(btn.style.backgroundColor).toMatch(/^rgb\(/);
      expect(btn.style.backgroundColor).not.toMatch(/^rgba\(/);
      expect(btn).toHaveAttribute('aria-pressed', 'true');
      expect(btn).toHaveAttribute('data-active', 'true');
      const bf = btn.style.getPropertyValue('backdrop-filter');
      expect(bf === '' || bf === 'none').toBe(true);
    });

    it('reports aria-pressed=false when not active', () => {
      const c = mount(<FrostedIconButton accessibilityLabel="Mute" icon={<span>x</span>} />);
      expect(getByRole(c, 'button')).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('icon color', () => {
    it('injects the theme icon color as a fallback fill on a bare icon', () => {
      const c = mount(
        <FrostedIconButton accessibilityLabel="Back" icon={<svg data-testid="ic" />} />,
      );
      const icon = c.querySelector('[data-testid="ic"]');
      expect(icon?.getAttribute('fill')).toMatch(/^rgb/);
    });

    it('never overrides an explicit fill on the icon', () => {
      const c = mount(
        <FrostedIconButton
          accessibilityLabel="Back"
          icon={<svg data-testid="ic" fill="rgb(1, 2, 3)" />}
        />,
      );
      expect(c.querySelector('[data-testid="ic"]')?.getAttribute('fill')).toBe('rgb(1, 2, 3)');
    });
  });

  describe('light theme', () => {
    it('uses a subtle DARK tint (base near-black) distinguishable from a white page', () => {
      const c = mount(
        <FrostedIconButton accessibilityLabel="Back" icon={<span>x</span>} />,
        'light',
      );
      const surface = getByRole(c, 'button').style.backgroundColor;
      expect(surface).toMatch(/^rgba\(/);
      const base = parseRgb(surface);
      if (!base) throw new Error('unreachable');
      expect(base.r).toBeLessThanOrEqual(60);
      expect(base.g).toBeLessThanOrEqual(60);
      expect(base.b).toBeLessThanOrEqual(60);
    });
  });

  describe('behavior', () => {
    it('fires both onClick and onPress on click', () => {
      const onClick = jest.fn();
      const onPress = jest.fn();
      const c = mount(
        <FrostedIconButton
          accessibilityLabel="Back"
          onClick={onClick}
          onPress={onPress}
          icon={<span>x</span>}
        />,
      );
      act(() => {
        fireEvent.click(getByRole(c, 'button'));
      });
      expect(onClick).toHaveBeenCalledTimes(1);
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('does not fire handlers when disabled', () => {
      const onPress = jest.fn();
      const c = mount(
        <FrostedIconButton accessibilityLabel="Back" disabled onPress={onPress} icon={<span>x</span>} />,
      );
      const btn = getByRole(c, 'button');
      expect(btn).toBeDisabled();
      act(() => {
        fireEvent.click(btn);
      });
      expect(onPress).not.toHaveBeenCalled();
    });

    it('applies preset sizes (md = 36px, sm = 32px)', () => {
      const c = mount(<FrostedIconButton accessibilityLabel="Back" size="md" icon={<span>x</span>} />);
      expect(getByRole(c, 'button').style.width).toBe('36px');
      const c2 = mount(<FrostedIconButton accessibilityLabel="Back" size="sm" icon={<span>x</span>} />);
      expect(getByRole(c2, 'button').style.width).toBe('32px');
    });

    it('does not crash on an array-form style prop (StyleProp flattening)', () => {
      const showBorder = false;
      const c = mount(
        <FrostedIconButton
          accessibilityLabel="Back"
          icon={<span>x</span>}
          style={[{ marginTop: 8 }, showBorder && { borderColor: 'rgb(9, 9, 9)' }]}
        />,
      );
      const btn = getByRole(c, 'button');
      expect(btn.style.marginTop).toBe('8px');
      expect(btn.getAttribute('style') ?? '').not.toMatch(/(^|;)\s*0\s*:/);
    });
  });
});
