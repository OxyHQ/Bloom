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
});
