/**
 * @jest-environment jsdom
 */

import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { getByRole, getByText, getByLabelText, fireEvent } from '@testing-library/dom';
import '@testing-library/jest-dom';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
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
