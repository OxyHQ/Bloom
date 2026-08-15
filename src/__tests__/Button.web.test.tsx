/**
 * @jest-environment jsdom
 */

import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { getByRole, getByText, getByLabelText, fireEvent } from '@testing-library/dom';
import '@testing-library/jest-dom';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { buildTheme } from '../theme/build-theme';
import { SHADOW_BOX } from '../design-tokens/shadows';
import {
  GLASS_BLUR_FILTER,
  GLASS_RIM_HIGHLIGHT,
  glassBackgroundImage,
  glassMaterialTint,
  resolveGlassColors,
} from '../theme/glass-colors';
import {
  Button,
  OutlineButton,
  LinkButton,
  DestructiveButton,
} from '../button/Button.web';

// react-dom 19 logs a guard unless this flag is set in test environments.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

function mount(ui: React.ReactElement): HTMLElement {
  act(() => {
    root.render(
      <BloomThemeProvider mode="light" colorPreset="teal">
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

describe('Button.web', () => {
  it('renders a real <button> element', () => {
    const c = mount(<Button>Click me</Button>);
    const btn = getByRole(c, 'button', { name: 'Click me' });
    expect(btn.tagName).toBe('BUTTON');
  });

  it('defaults to type="button"', () => {
    const c = mount(<Button>Default</Button>);
    expect(getByRole(c, 'button')).toHaveAttribute('type', 'button');
  });

  it('supports type="submit" for form participation', () => {
    const onSubmit = jest.fn((e: Event) => e.preventDefault());
    const c = mount(
      <form onSubmit={onSubmit as unknown as React.FormEventHandler}>
        <Button type="submit">Submit</Button>
      </form>,
    );
    const btn = getByRole(c, 'button', { name: 'Submit' });
    expect(btn).toHaveAttribute('type', 'submit');
    act(() => {
      fireEvent.click(btn);
    });
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('fires both onClick and onPress on click', () => {
    const onClick = jest.fn();
    const onPress = jest.fn();
    const c = mount(
      <Button onClick={onClick} onPress={onPress}>
        Go
      </Button>,
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
      <Button disabled onPress={onPress}>
        Nope
      </Button>,
    );
    const btn = getByRole(c, 'button');
    expect(btn).toBeDisabled();
    act(() => {
      fireEvent.click(btn);
    });
    expect(onPress).not.toHaveBeenCalled();
  });

  it('does not fire onPress when loading and marks aria-busy', () => {
    const onPress = jest.fn();
    const c = mount(
      <Button loading onPress={onPress}>
        Saving
      </Button>,
    );
    const btn = getByRole(c, 'button');
    expect(btn).toHaveAttribute('aria-busy', 'true');
    act(() => {
      fireEvent.click(btn);
    });
    expect(onPress).not.toHaveBeenCalled();
  });

  it('keeps children mounted while loading so width is preserved', () => {
    const c = mount(<Button loading>Submit</Button>);
    expect(getByText(c, 'Submit')).toBeTruthy();
  });

  it('passes className through so consumer layout classes win', () => {
    const c = mount(<Button className="w-full custom">Wide</Button>);
    const btn = getByRole(c, 'button');
    expect(btn).toHaveClass('bloom-btn');
    expect(btn).toHaveClass('w-full');
    expect(btn).toHaveClass('custom');
  });

  // Parity with the native fork's "the button IS the node its parent lays out"
  // suite in `Button.test.tsx`. Both platforms render ONE node, so a caller's
  // layout class reaches the box the parent actually lays out; a wrapper element
  // added here would scope it away exactly the way native's `Animated.View` did.
  it('renders the classed button as the outermost node — no wrapper element', () => {
    const c = mount(
      <div data-testid="host">
        <Button className="flex-1">Wide</Button>
      </div>,
    );
    const host = c.querySelector('[data-testid="host"]');
    expect(host?.children).toHaveLength(1);
    expect(host?.firstElementChild?.tagName).toBe('BUTTON');
    expect(host?.firstElementChild).toHaveClass('flex-1');
  });

  it('applies aria-label from accessibilityLabel', () => {
    const c = mount(<Button accessibilityLabel="Save changes">Save</Button>);
    expect(getByLabelText(c, 'Save changes')).toBeTruthy();
  });

  it('exposes testID as data-testid', () => {
    const c = mount(<Button testID="my-btn">Test</Button>);
    expect(c.querySelector('[data-testid="my-btn"]')?.tagName).toBe('BUTTON');
  });

  describe('asChild', () => {
    it('renders the child element (anchor) instead of a button', () => {
      const c = mount(
        <Button asChild>
          <a href="/go">Go</a>
        </Button>,
      );
      const link = getByRole(c, 'link', { name: 'Go' });
      expect(link.tagName).toBe('A');
      expect(link).toHaveAttribute('href', '/go');
      expect(link).toHaveClass('bloom-btn');
    });

    it('merges onPress onto the child', () => {
      const onPress = jest.fn();
      const c = mount(
        <Button asChild onPress={onPress}>
          <a href="/go">Go</a>
        </Button>,
      );
      act(() => {
        fireEvent.click(getByRole(c, 'link'));
      });
      expect(onPress).toHaveBeenCalledTimes(1);
    });
  });

  describe('web variants', () => {
    it('OutlineButton renders a button', () => {
      const c = mount(<OutlineButton>Outline</OutlineButton>);
      expect(getByRole(c, 'button', { name: 'Outline' }).tagName).toBe('BUTTON');
    });

    it('LinkButton renders with the link modifier class', () => {
      const c = mount(<LinkButton>Link</LinkButton>);
      expect(getByRole(c, 'button', { name: 'Link' })).toHaveClass('bloom-btn--link');
    });

    it('DestructiveButton renders a button', () => {
      const c = mount(<DestructiveButton>Delete</DestructiveButton>);
      expect(getByRole(c, 'button', { name: 'Delete' }).tagName).toBe('BUTTON');
    });
  });

  describe('size aliases', () => {
    it('accepts shadcn-style sm size', () => {
      const c = mount(<Button size="sm">Small</Button>);
      expect(getByRole(c, 'button', { name: 'Small' }).tagName).toBe('BUTTON');
    });

    it('size="icon" selects the icon variant', () => {
      const c = mount(
        <Button size="icon" accessibilityLabel="icon">
          x
        </Button>,
      );
      expect(getByRole(c, 'button', { name: 'icon' }).tagName).toBe('BUTTON');
    });
  });

  // Regression: passing `style` as a React-Native `StyleProp` ARRAY (the
  // `style={[base, cond && override]}` idiom used across the ecosystem) used to
  // spread the raw array into the DOM button's inline style, producing numeric
  // keys and throwing at runtime:
  //   "Failed to set an indexed property [0] on 'CSSStyleDeclaration'".
  describe('style prop flattening', () => {
    it('renders without crashing when style is an array with a falsy hole', () => {
      const showBg = false;
      const c = mount(
        <Button style={[{ marginTop: 10 }, showBg && { backgroundColor: 'rgb(9, 9, 9)' }]}>
          Styled
        </Button>,
      );
      const btn = getByRole(c, 'button', { name: 'Styled' });
      expect(btn.tagName).toBe('BUTTON');
      // The array is flattened onto the button; falsy entries are skipped.
      expect(btn.style.marginTop).toBe('10px');
      expect(btn.style.backgroundColor).not.toBe('rgb(9, 9, 9)');
      // The crash signature: a leaked numeric ("0") style key.
      expect(btn.getAttribute('style') ?? '').not.toMatch(/(^|;)\s*0\s*:/);
    });

    it('later array entries win, mirroring RN precedence, and override base', () => {
      const c = mount(
        <Button style={[{ marginTop: 1 }, { marginTop: 9, backgroundColor: 'rgb(1, 2, 3)' }]}>
          Override
        </Button>,
      );
      const btn = getByRole(c, 'button', { name: 'Override' });
      expect(btn.style.marginTop).toBe('9px');
      // Caller style is spread after the variant container style, so it wins.
      expect(btn.style.backgroundColor).toBe('rgb(1, 2, 3)');
    });

    it('accepts a single style object', () => {
      const c = mount(<Button style={{ marginTop: 5 }}>Solo</Button>);
      expect(getByRole(c, 'button', { name: 'Solo' }).style.marginTop).toBe('5px');
    });

    it('flattens an array style onto the asChild child element too', () => {
      const c = mount(
        <Button asChild style={[{ marginTop: 7 }, false]}>
          <a href="/go">Go</a>
        </Button>,
      );
      const link = getByRole(c, 'link', { name: 'Go' });
      expect(link.tagName).toBe('A');
      expect(link.style.marginTop).toBe('7px');
    });
  });
});

/**
 * The FILLED variants are GLASS, and every layer of it comes from
 * `theme/glass-colors.ts` — the same module the native fork's `GlassSurface`
 * reads. Nothing here restates a colour: each assertion names the token it
 * expects, so a change to the material moves the component and this test
 * together, while a change to only ONE fork fails.
 *
 * Worth pinning rather than eyeballing because a glass surface that has lost a
 * layer still renders as a perfectly plausible button — a missing blur, a
 * missing sheen or a missing rim all look like a slightly flatter fill, and none
 * of them throws.
 */
describe('the filled variants are glass', () => {
  // The preset `mount()` renders under. Read from one place so the fixture and
  // the component cannot disagree about which palette they are talking about —
  // they did, and the failure looked like a wrong colour rather than a wrong
  // preset.
  const PRESET = 'teal';

  function glassOf(mode: 'light' | 'dark', destructive: boolean) {
    const theme = buildTheme(PRESET, mode);
    return {
      theme,
      glass: resolveGlassColors(theme.colors, destructive ? 'error' : 'primary'),
    };
  }

  /**
   * jsdom rewrites a colour it is ASSIGNED into its own canonical spelling, so
   * Bloom's space-separated `rgb(191 31 39)` reads back comma-separated. Compare
   * through the same normalisation rather than against the raw token.
   */
  function sameColour(actual: string, token: string): void {
    const canon = (v: string) => v.replace(/[\s,]+/g, ' ').trim();
    expect(canon(actual)).toBe(canon(token));
  }

  it.each([
    ['primary', false],
    ['destructive', true],
  ] as const)('paints %s from the glass tokens, not an opaque brand fill', (variant, destructive) => {
    const { theme, glass } = glassOf('light', destructive);
    const c = mount(<Button variant={variant}>Go</Button>);
    const btn = getByRole(c, 'button');

    // The fill is a LAYER, not the background slot — so the backdrop filter
    // below has something to show through.
    expect(btn.style.backgroundColor).toBe('transparent');
    expect(btn.style.backgroundImage).toBe(glassBackgroundImage(glass.fill, theme.isDark));
    // …and the fill is the `*Subtle` tint, i.e. genuinely translucent. An opaque
    // one would mean a hand-composed colour crept back in.
    expect(glass.fill).toMatch(/^rgba\(/);

    sameColour(btn.style.borderColor, glass.hairline);
    expect(btn.style.borderWidth).toBe(`${glass.hairlineWidth}px`);

    // The label is the half of the pair that is legible on that tint — NOT
    // `primaryForeground`, which is sized for the opaque fill this replaced and
    // would be white on a pale wash.
    sameColour(btn.style.color, glass.fillForeground);

    // Rim first, drop after: the inset has to be listed before the outer layers
    // or it paints under them.
    expect(btn.style.boxShadow).toBe(`${GLASS_RIM_HIGHLIGHT}, ${SHADOW_BOX.glass}`);
    expect(btn.style.boxShadow).toContain('inset');

    expect(btn.style.backdropFilter).toBe(GLASS_BLUR_FILTER);
  });

  it('follows the SCHEME for the material, not the tone', () => {
    // A light material in dark mode is a bright card — the failure
    // `frosted-icon-button` documents at length. The tint is the only layer that
    // flips, so comparing the two background images is the whole assertion.
    const light = mount(<Button>Go</Button>).querySelector('button')?.style.backgroundImage;
    act(() => root.unmount());
    container.remove();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => {
      root.render(
        <BloomThemeProvider mode="dark" colorPreset={PRESET}>
          <Button>Go</Button>
        </BloomThemeProvider>,
      );
    });
    const dark = container.querySelector('button')?.style.backgroundImage;
    expect(light).toBeTruthy();
    expect(dark).not.toBe(light);
    expect(dark).toContain(glassMaterialTint(true));
    expect(light).toContain(glassMaterialTint(false));
  });

  it('leaves the UNfilled variants alone — glass is not a blanket', () => {
    // `outline` and `link` are transparent by design; giving them a pane would
    // make every button a surface.
    for (const element of [<OutlineButton>O</OutlineButton>, <LinkButton>L</LinkButton>]) {
      act(() => root.unmount());
      container.remove();
      container = document.createElement('div');
      document.body.appendChild(container);
      root = createRoot(container);
      act(() => {
        root.render(
          <BloomThemeProvider mode="light" colorPreset={PRESET}>
            {element}
          </BloomThemeProvider>,
        );
      });
      const btn = container.querySelector('button');
      expect(btn?.style.backdropFilter ?? '').toBe('');
      expect(btn?.style.backgroundImage ?? '').toBe('');
    }
  });
});
