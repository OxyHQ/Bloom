/**
 * @jest-environment jsdom
 */

import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { getByRole, getByText, getByLabelText, fireEvent } from '@testing-library/dom';
import '@testing-library/jest-dom';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Button, LinkButton, BLOOM_BUTTON_CSS } from '../button/Button.web';
import { BUTTON_RADIUS, LINK_BUTTON_UNDERLINE_OFFSET } from '../button/shared';

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

  it('fires one universal activation on click', () => {
    const onPress = jest.fn();
    const c = mount(
      <Button onPress={onPress}>
        Go
      </Button>,
    );
    act(() => {
      fireEvent.click(getByRole(c, 'button'));
    });
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
      const c = mount(<Button appearance="outline" tone="neutral">Outline</Button>);
      expect(getByRole(c, 'button', { name: 'Outline' }).tagName).toBe('BUTTON');
    });

    it('LinkButton renders with the link modifier class', () => {
      const c = mount(<Button href="#" appearance="plain" tone="accent">Link</Button>);
      expect(getByRole(c, 'link', { name: 'Link' })).toHaveClass('bloom-btn--link');
    });

    it('LinkButton is a bare label: no height, no padding, 4px gap', () => {
      const c = mount(<Button href="#" appearance="plain" tone="accent">Link</Button>);
      const el = getByRole(c, 'link', { name: 'Link' });
      expect(el.style.height).toBe('');
      expect(el.style.paddingLeft).toBe('0px');
      expect(el.style.getPropertyValue('--bloom-btn-gap')).toBe('4px');
    });

    it('href renders a real anchor, and drops the href while disabled', () => {
      const c = mount(
        <>
          <Button href="/docs" appearance="plain" tone="accent">Docs</Button>
          <Button href="/off" disabled appearance="plain" tone="accent">
            Off
          </Button>
        </>,
      );
      const link = getByRole(c, 'link', { name: 'Docs' });
      expect(link.tagName).toBe('A');
      expect(link).toHaveAttribute('href', '/docs');
      const off = getByText(c, 'Off').closest('a');
      expect(off).not.toHaveAttribute('href');
      expect(off).toHaveAttribute('aria-disabled', 'true');
    });

    it('DestructiveButton renders a button', () => {
      const c = mount(<Button appearance="solid" tone="danger">Delete</Button>);
      expect(getByRole(c, 'button', { name: 'Delete' }).tagName).toBe('BUTTON');
    });
  });

  // -------------------------------------------------------------------------
  //  `underline`, `linkTone="text"` and `textVariant` — the inline text action
  //  four families hand-rolled. The web fork expresses the underline as a
  //  MODIFIER CLASS, because a rest underline and a hover one are two different
  //  rules and only a stylesheet can hold the second.
  // -------------------------------------------------------------------------
  describe('underline and the reading tone', () => {
    it('link underlines on hover by default, and says so in its class', () => {
      const c = mount(<LinkButton>Link</LinkButton>);
      const el = getByRole(c, 'button', { name: 'Link' });
      expect(el).toHaveClass('bloom-btn--underline-hover');
      expect(el).not.toHaveClass('bloom-btn--underline-rest');
    });

    it('underline="rest" swaps the modifier', () => {
      const c = mount(
        <Button variant="link" underline="rest">
          Clear all
        </Button>,
      );
      const el = getByRole(c, 'button', { name: 'Clear all' });
      expect(el).toHaveClass('bloom-btn--underline-rest');
      expect(el).not.toHaveClass('bloom-btn--underline-hover');
    });

    it('underline="none" removes it from a link', () => {
      const c = mount(
        <Button variant="link" underline="none">
          Plain
        </Button>,
      );
      const el = getByRole(c, 'button', { name: 'Plain' });
      expect(el.className).not.toMatch(/bloom-btn--underline/);
    });

    it('a non-link variant carries no underline modifier unless asked', () => {
      let c = mount(<Button>Save</Button>);
      expect(getByRole(c, 'button', { name: 'Save' }).className).not.toMatch(
        /bloom-btn--underline/,
      );
      c = mount(
        <Button underline="rest" variant="secondary">
          Cancel
        </Button>,
      );
      expect(getByRole(c, 'button', { name: 'Cancel' })).toHaveClass('bloom-btn--underline-rest');
    });

    it('the stylesheet has a rest rule and a hover rule, and they are different', () => {
      // The classes are inert without the rules; assert the sheet the fork
      // adopts, since jsdom applies neither.
      expect(BLOOM_BUTTON_CSS).toContain('.bloom-btn--underline-rest {');
      expect(BLOOM_BUTTON_CSS).toMatch(/\.bloom-btn--underline-hover[^{]*:hover \{/);
      expect(BLOOM_BUTTON_CSS).toContain(`text-underline-offset: ${LINK_BUTTON_UNDERLINE_OFFSET}px`);
    });

    it('linkTone="text" paints the reading colour and hands the hover one to CSS', () => {
      const c = mount(
        <Button variant="link" linkTone="text" underline="rest">
          Show more
        </Button>,
      );
      const el = getByRole(c, 'button', { name: 'Show more' });
      // A hover FOREGROUND is the thing this tone needs and no variant needed
      // before, so it arrives as its own custom property; the hover rule reads
      // it, falling back to the rest colour for every other variant.
      const rest = el.style.getPropertyValue('--bloom-btn-fg');
      const hover = el.style.getPropertyValue('--bloom-btn-fg-hover');
      expect(rest).not.toBe('');
      expect(hover).not.toBe('');
      expect(hover).not.toBe(rest);
      expect(BLOOM_BUTTON_CSS).toContain('color: var(--bloom-btn-fg-hover, var(--bloom-btn-fg));');
    });

    it('every OTHER variant keeps its rest colour on hover', () => {
      const c = mount(<Button variant="primary">Save</Button>);
      const el = getByRole(c, 'button', { name: 'Save' });
      expect(el.style.getPropertyValue('--bloom-btn-fg-hover')).toBe(
        el.style.getPropertyValue('--bloom-btn-fg'),
      );
    });

    it('textVariant replaces the ramp step, keeping the size`s box', () => {
      const c = mount(
        <Button size="small" textVariant="caption-1-semibold">
          Back
        </Button>,
      );
      const el = getByRole(c, 'button', { name: 'Back' });
      expect(el.style.fontSize).toBe('12px');
      expect(el.style.fontWeight).toBe('600');
      // The BOX is the size's, not the ramp step's.
      expect(el.style.height).toBe('32px');
    });

    it('numberOfLines={1} truncates instead of clipping silently', () => {
      const c = mount(<Button numberOfLines={1}>A label far longer than its button</Button>);
      const label = getByText(c, 'A label far longer than its button');
      expect(label.style.textOverflow).toBe('ellipsis');
      expect(label.style.overflow).toBe('hidden');
    });

    it('accessibilityRole overrides the role, for a link with no href', () => {
      const c = mount(
        <Button variant="link" accessibilityRole="link">
          128 reviews
        </Button>,
      );
      const el = getByRole(c, 'link', { name: '128 reviews' });
      expect(el.tagName).toBe('BUTTON');
      expect(el).not.toHaveAttribute('href');
    });
  });

  describe('size aliases', () => {
    it('accepts shadcn-style sm size', () => {
      const c = mount(<Button size="sm">Small</Button>);
      expect(getByRole(c, 'button', { name: 'Small' }).tagName).toBe('BUTTON');
    });

    it('size="icon" selects the icon variant', () => {
      const c = mount(
        <Button size="md" accessibilityLabel="icon">
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

  // -------------------------------------------------------------------------
  //  Geometry parity with the native fork — both read `button/shared.ts`, and
  //  `Button.test.tsx` pins the same rows against the native fork.
  // -------------------------------------------------------------------------
  describe('geometry', () => {
    const GEOMETRY = [
      { size: 'xs', height: '24px' },
      { size: 'sm', height: '32px' },
      { size: 'md', height: '36px' },
      { size: 'lg', height: '44px' },
    ] as const;

    it.each(GEOMETRY)('$size matches the native table', ({ size, height }) => {
      const c = mount(
        <Button size={size} appearance="outline" tone="neutral">
          Save changes
        </Button>,
      );
      const btn = getByRole(c, 'button', { name: 'Save changes' });
      expect(btn.style.height).toBe(height);
      expect(btn.style.borderRadius).toBe(`${BUTTON_RADIUS}px`);
    });

    it.each(GEOMETRY)('$size icon variant is an unpadded square', ({ size, height }) => {
      const c = mount(<Button size={size} icon={() => null} accessibilityLabel="Act" appearance="outline" tone="neutral" />);
      const btn = getByRole(c, 'button', { name: 'Act' });
      expect(btn.style.width).toBe(height);
      expect(btn.style.height).toBe(height);
      expect(btn.style.paddingLeft).toBe('0px');
    });
  });

  describe('shared semantic paint', () => {
    it('paints through custom properties so interaction rules can override the fill', () => {
      const c = mount(<Button>Go</Button>);
      const btn = getByRole(c, 'button', { name: 'Go' });
      expect(btn).toHaveClass('bloom-btn--gradient');
      expect(btn.style.getPropertyValue('--bloom-btn-bg-image')).toContain('linear-gradient');
      expect(btn.style.getPropertyValue('--bloom-btn-bg-image-hover')).not.toBe(btn.style.getPropertyValue('--bloom-btn-bg-image'));
      expect(btn.style.getPropertyValue('--bloom-btn-bg-image-active')).not.toBe(btn.style.getPropertyValue('--bloom-btn-bg-image'));
      expect(btn.style.getPropertyValue('--bloom-btn-bg')).not.toBe('');
      expect(btn.style.backgroundColor).toBe('');
    });

    it('has no press scale', () => {
      const c = mount(<Button>Go</Button>);
      expect(getByRole(c, 'button', { name: 'Go' }).style.getPropertyValue('--bloom-btn-press-scale')).toBe('1');
    });

    it('keeps outline appearances flat', () => {
      const c = mount(<Button appearance="outline" tone="neutral">Cancel</Button>);
      expect(getByRole(c, 'button', { name: 'Cancel' })).not.toHaveClass('bloom-btn--gradient');
    });

    it('iconOnly sizes the icon component and drops the label', () => {
      const Glyph = jest.fn((props: { width?: number }) => <svg data-width={props.width} />);
      const c = mount(
        <Button size="xs" icon={Glyph} accessibilityLabel="Add" />,
      );
      const btn = getByRole(c, 'button', { name: 'Add' });
      expect(btn.textContent).toBe('');
      expect(btn.querySelector('svg')?.getAttribute('data-width')).toBe('14');
    });
  });
});
