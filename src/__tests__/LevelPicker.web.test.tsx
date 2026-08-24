/**
 * @jest-environment jsdom
 */

/**
 * The WEB fork, rendered through the real react-native-web into jsdom.
 *
 * What is here is what jsdom can honestly answer: which element the rail IS,
 * the attributes it carries, which keys move it, and which region is `inert`.
 * What is NOT here is anything that needs layout or a pointer — the rail's
 * width is 0 in jsdom, so a drag would map to whatever the clamp returns, and a
 * passing assertion would mean nothing. `scripts/verify-level-picker.mjs` drives
 * those in a real browser.
 */
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { fireEvent, getByRole, getByText } from '@testing-library/dom';
import '@testing-library/jest-dom';

// The fork renders raw DOM for the rail and react-native-web for the summary
// row, so the row has to be the REAL thing: under the repo-wide `react-native`
// mock the row would emit props no browser reads and every assertion about it
// would pass either way.
jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { LevelPicker } from '../level-picker/index.web';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const LEVELS = ['Draft', 'Standard', 'Fine', 'Very fine', 'Maximum'];

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

const testId = (host: HTMLElement, id: string): HTMLElement => {
  const node = host.querySelector(`[data-testid="${id}"]`);
  if (node === null) throw new Error(`no [data-testid="${id}"]`);
  return node as HTMLElement;
};

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe('LevelPicker.web', () => {
  it('renders the rail as a focusable role="slider"', () => {
    const c = mount(
      <LevelPicker
        testID="picker"
        accessibilityLabel="Quality"
        levels={LEVELS}
        value={2}
        onValueChange={() => {}}
      />,
    );
    const rail = getByRole(c, 'slider', { name: 'Quality' });
    expect(rail.tagName).toBe('DIV');
    expect(rail).toHaveAttribute('tabindex', '0');
  });

  it('states its value with the flat aria-value props and names the level', () => {
    const c = mount(
      <LevelPicker
        testID="picker"
        accessibilityLabel="Quality"
        levels={LEVELS}
        value={3}
        onValueChange={() => {}}
      />,
    );
    const rail = getByRole(c, 'slider');
    expect(rail).toHaveAttribute('aria-valuemin', '0');
    expect(rail).toHaveAttribute('aria-valuemax', '4');
    expect(rail).toHaveAttribute('aria-valuenow', '3');
    expect(rail).toHaveAttribute('aria-valuetext', 'Very fine');
  });

  it('steps one level per arrow key, in both axes', () => {
    const onValueChange = jest.fn();
    const c = mount(
      <LevelPicker
        testID="picker"
        accessibilityLabel="Quality"
        levels={LEVELS}
        value={2}
        onValueChange={onValueChange}
      />,
    );
    const rail = getByRole(c, 'slider');
    act(() => {
      fireEvent.keyDown(rail, { key: 'ArrowRight' });
    });
    expect(onValueChange).toHaveBeenLastCalledWith(3);
    act(() => {
      fireEvent.keyDown(rail, { key: 'ArrowLeft' });
    });
    expect(onValueChange).toHaveBeenLastCalledWith(1);
    act(() => {
      fireEvent.keyDown(rail, { key: 'ArrowUp' });
    });
    expect(onValueChange).toHaveBeenLastCalledWith(3);
    act(() => {
      fireEvent.keyDown(rail, { key: 'ArrowDown' });
    });
    expect(onValueChange).toHaveBeenLastCalledWith(1);
  });

  it('sends Home and End to the two ends', () => {
    const onValueChange = jest.fn();
    const c = mount(
      <LevelPicker
        testID="picker"
        accessibilityLabel="Quality"
        levels={LEVELS}
        value={2}
        onValueChange={onValueChange}
      />,
    );
    const rail = getByRole(c, 'slider');
    act(() => {
      fireEvent.keyDown(rail, { key: 'Home' });
    });
    expect(onValueChange).toHaveBeenLastCalledWith(0);
    act(() => {
      fireEvent.keyDown(rail, { key: 'End' });
    });
    expect(onValueChange).toHaveBeenLastCalledWith(LEVELS.length - 1);
  });

  it('does not report a change at either end, or for a key it does not own', () => {
    const onValueChange = jest.fn();
    const c = mount(
      <LevelPicker
        testID="picker"
        accessibilityLabel="Quality"
        levels={LEVELS}
        value={0}
        onValueChange={onValueChange}
      />,
    );
    const rail = getByRole(c, 'slider');
    act(() => {
      fireEvent.keyDown(rail, { key: 'ArrowLeft' });
      fireEvent.keyDown(rail, { key: 'Home' });
      fireEvent.keyDown(rail, { key: 'Enter' });
    });
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('makes the region that is not showing inert, on both sides of the reveal', () => {
    const collapsed = mount(
      <LevelPicker
        testID="picker"
        accessibilityLabel="Quality"
        levels={LEVELS}
        value={0}
        onValueChange={() => {}}
        expanded={false}
      />,
    );
    const details = testId(collapsed, 'picker-details');
    expect(details).toHaveAttribute('inert');
    expect(details).toHaveAttribute('aria-hidden', 'true');
    // React writes a length of zero without a unit, which is valid CSS.
    expect(details.style.maxHeight).toBe('0');
    expect(getByRole(collapsed, 'slider')).toBeInTheDocument();

    const expanded = mount(
      <LevelPicker
        testID="picker"
        accessibilityLabel="Quality"
        levels={LEVELS}
        value={0}
        onValueChange={() => {}}
        expanded
      />,
    );
    expect(testId(expanded, 'picker-details')).not.toHaveAttribute('inert');
    // The rail is the one out of the way now, and `inert` takes its focusability
    // with it — a `tabindex="0"` inside an inert region is still a tab stop in a
    // browser that has not shipped `inert`.
    const rail = getByRole(expanded, 'slider', { hidden: true });
    expect(rail).toHaveAttribute('tabindex', '-1');
    expect(rail.closest('[inert]')).not.toBeNull();
  });

  it('leaves an expanded region at its natural height when nothing can measure it', () => {
    // The `ResizeObserver` guard, which is also the SSR path: with no observer
    // the region must not be clipped to a height of zero it never measured.
    expect(typeof ResizeObserver).toBe('undefined');
    const c = mount(
      <LevelPicker
        testID="picker"
        accessibilityLabel="Quality"
        levels={LEVELS}
        value={0}
        onValueChange={() => {}}
        expanded
      />,
    );
    expect(testId(c, 'picker-details').style.maxHeight).toBe('');
  });

  it('renders the summary row as a menu item that says whether it is open', () => {
    const collapsed = mount(
      <LevelPicker
        testID="picker"
        accessibilityLabel="Quality"
        levels={LEVELS}
        value={0}
        onValueChange={() => {}}
        detailsLabel="Advanced"
        expanded={false}
      />,
    );
    const row = getByRole(collapsed, 'menuitem', { name: 'Advanced' });
    expect(row).toHaveAttribute('aria-expanded', 'false');
    expect(getByText(collapsed, 'Advanced')).toBeInTheDocument();

    const expanded = mount(
      <LevelPicker
        testID="picker"
        accessibilityLabel="Quality"
        levels={LEVELS}
        value={0}
        onValueChange={() => {}}
        detailsLabel="Advanced"
        expanded
      />,
    );
    expect(getByRole(expanded, 'menuitem', { name: 'Advanced' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('keeps the end captions out of the accessibility tree', () => {
    // They caption the SCALE and duplicate nothing the value announces; a
    // screen reader reading "Faster Sharper" after every level would be noise.
    const c = mount(
      <LevelPicker
        testID="picker"
        accessibilityLabel="Quality"
        levels={LEVELS}
        value={0}
        onValueChange={() => {}}
        minLabel="Faster"
        maxLabel="Sharper"
      />,
    );
    const captions = testId(c, 'picker-captions');
    expect(captions).toHaveAttribute('aria-hidden', 'true');
    expect(captions).toHaveTextContent('Faster');
    expect(captions).toHaveTextContent('Sharper');
  });

  it('draws one stop per level, and the fill and knob at the current one', () => {
    const c = mount(
      <LevelPicker
        testID="picker"
        accessibilityLabel="Quality"
        levels={LEVELS}
        value={1}
        onValueChange={() => {}}
      />,
    );
    const rail = getByRole(c, 'slider');
    // The rail's children are the fill, one span per level, and the knob.
    expect(rail.children).toHaveLength(LEVELS.length + 2);
    // `calc(25% + 6.5px)`: a quarter along, less the share of the end inset
    // that a quarter of the way costs. The formula is asserted directly in
    // `LevelPicker.test.tsx`; this is that formula reaching the DOM.
    expect(testId(c, 'picker-thumb').style.left).toBe('calc(25% + 6.5px)');
  });
});
