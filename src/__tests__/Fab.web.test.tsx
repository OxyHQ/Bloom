/**
 * @jest-environment jsdom
 */

import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { getByRole, getByText, getByLabelText, fireEvent } from '@testing-library/dom';
import '@testing-library/jest-dom';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Fab } from '../fab/Fab.web';
import { BottomEdgeProvider, useClaimBottomEdge } from '../layout/bottom-edge';
import { TabBarMinimizeProvider, useMinimizeState } from '../tab-bar/context';

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

describe('Fab.web', () => {
  function InitiallyMinimizedFab(props: React.ComponentProps<typeof Fab>) {
    useMinimizeState().target.value = 1;
    return <Fab {...props} />;
  }

  it('moves above a bottom-edge claim registered after the first render', () => {
    function Claim() {
      useClaimBottomEdge(74);
      return null;
    }

    const c = mount(
      <BottomEdgeProvider>
        <Claim />
        <Fab accessibilityLabel="Add" icon={<span>+</span>} />
      </BottomEdgeProvider>,
    );

    expect(getByRole(c, 'button').style.bottom).toBe('90px');
  });

  it('follows the shorter live tab-bar height when minimized', () => {
    function Claim() {
      useClaimBottomEdge(74);
      return null;
    }

    const c = mount(
      <TabBarMinimizeProvider>
        <BottomEdgeProvider>
          <Claim />
          <InitiallyMinimizedFab accessibilityLabel="Add" icon={<span>+</span>} />
        </BottomEdgeProvider>
      </TabBarMinimizeProvider>,
    );

    expect(getByRole(c, 'button').style.bottom).toBe('76px');
  });

  it('renders a real <button> element', () => {
    const c = mount(<Fab accessibilityLabel="Add" icon={<span>+</span>} />);
    const fab = getByRole(c, 'button', { name: 'Add' });
    expect(fab.tagName).toBe('BUTTON');
  });

  it('defaults to type="button"', () => {
    const c = mount(<Fab accessibilityLabel="Add" icon={<span>+</span>} />);
    expect(getByRole(c, 'button')).toHaveAttribute('type', 'button');
  });

  it('fires both onClick and onPress on click', () => {
    const onClick = jest.fn();
    const onPress = jest.fn();
    const c = mount(
      <Fab accessibilityLabel="Add" onClick={onClick} onPress={onPress} icon={<span>+</span>} />,
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
      <Fab accessibilityLabel="Add" disabled onPress={onPress} icon={<span>+</span>} />,
    );
    const fab = getByRole(c, 'button');
    expect(fab).toBeDisabled();
    act(() => {
      fireEvent.click(fab);
    });
    expect(onPress).not.toHaveBeenCalled();
  });

  it('uses sticky positioning for the default placement without escaping its column', () => {
    const c = mount(<Fab accessibilityLabel="Add" icon={<span>+</span>} />);
    const fab = getByRole(c, 'button');
    expect(fab.style.position).toBe('sticky');
    expect(fab.style.bottom).toBe('16px');
    expect(fab.style.alignSelf).toBe('flex-end');
    expect(fab.style.marginRight).toBe('16px');
  });

  it('uses the flex-column free space to pin short content to the bottom', () => {
    const c = mount(<Fab accessibilityLabel="Add" icon={<span>+</span>} />);
    expect(getByRole(c, 'button').style.marginTop).toBe('auto');
  });

  it('anchors top placements to their requested inline edge', () => {
    const c = mount(<Fab accessibilityLabel="Add" placement="top-right" icon={<span>+</span>} />);
    const fab = getByRole(c, 'button');
    expect(fab.style.marginTop).toBe('');
    expect(fab.style.top).toBe('16px');
    expect(fab.style.alignSelf).toBe('flex-end');
    expect(fab.style.marginRight).toBe('16px');
  });

  it('applies no positioning for placement="static"', () => {
    const c = mount(<Fab accessibilityLabel="Add" placement="static" icon={<span>+</span>} />);
    const fab = getByRole(c, 'button');
    expect(fab.style.position).toBe('');
    expect(fab.style.marginTop).toBe('');
  });

  it('renders an extended label', () => {
    const c = mount(<Fab label="Compose" icon={<span>+</span>} />);
    expect(getByText(c, 'Compose')).toBeTruthy();
  });

  it('injects the variant foreground as the icon fill', () => {
    const c = mount(<Fab accessibilityLabel="Add" icon={<svg data-testid="icon" />} />);
    expect(c.querySelector('[data-testid="icon"]')).toHaveAttribute('fill', 'rgb(255 255 255)');
  });

  it('collapses an extended FAB to its icon when the tab bar minimizes', () => {
    const c = mount(
      <TabBarMinimizeProvider>
        <InitiallyMinimizedFab
          label="Compose"
          icon={<span>+</span>}
          minimizeBehavior="collapse"
        />
      </TabBarMinimizeProvider>,
    );

    const fab = c.querySelector('button');
    const label = getByText(c, 'Compose').parentElement;
    expect(fab?.style.minWidth).toBe('56px');
    expect(fab?.style.paddingLeft).toBe('0px');
    expect(fab?.style.gap).toBe('0');
    expect(label).toHaveAttribute('aria-hidden', 'true');
    expect(label?.style.opacity).toBe('0');
    expect(label?.style.gridTemplateColumns).toBe('minmax(0, 0fr)');
  });

  it('hides the whole FAB when the tab bar minimizes in hide mode', () => {
    const c = mount(
      <TabBarMinimizeProvider>
        <InitiallyMinimizedFab label="Compose" icon={<span>+</span>} minimizeBehavior="hide" />
      </TabBarMinimizeProvider>,
    );

    expect(c.querySelector('button')).toBeNull();
  });

  it('applies aria-label from accessibilityLabel', () => {
    const c = mount(<Fab accessibilityLabel="Add post" icon={<span>+</span>} />);
    expect(getByLabelText(c, 'Add post')).toBeTruthy();
  });

  it('passes className through so consumer layout classes win', () => {
    const c = mount(<Fab accessibilityLabel="Add" className="my-fab" icon={<span>+</span>} />);
    const fab = getByRole(c, 'button');
    expect(fab).toHaveClass('bloom-fab');
    expect(fab).toHaveClass('my-fab');
  });

  it('exposes testID as data-testid', () => {
    const c = mount(<Fab accessibilityLabel="Add" testID="my-fab" icon={<span>+</span>} />);
    expect(c.querySelector('[data-testid="my-fab"]')?.tagName).toBe('BUTTON');
  });

  it('accepts a numeric size as a raw pixel diameter', () => {
    const c = mount(<Fab accessibilityLabel="Add" size={48} icon={<span>+</span>} />);
    const fab = getByRole(c, 'button');
    expect(fab.style.width).toBe('48px');
    expect(fab.style.height).toBe('48px');
  });

  it('keeps preset sizes working (medium = 56px diameter)', () => {
    const c = mount(<Fab accessibilityLabel="Add" size="medium" icon={<span>+</span>} />);
    const fab = getByRole(c, 'button');
    expect(fab.style.width).toBe('56px');
    expect(fab.style.height).toBe('56px');
  });

  // Regression: `style` / `labelStyle` are React-Native `StyleProp`s (array-
  // capable — the native fork passes `style={[placementStyle(...), {...}, style]}`).
  // Spreading a raw array into the DOM element's inline style used to produce
  // numeric keys and throw at runtime:
  //   "Failed to set an indexed property [0] on 'CSSStyleDeclaration'".
  describe('style prop flattening', () => {
    it('renders without crashing when style is an array with a falsy hole', () => {
      const showBorder = false;
      const c = mount(
        <Fab
          accessibilityLabel="Add"
          icon={<span>+</span>}
          style={[{ marginBottom: 10 }, showBorder && { borderColor: 'rgb(9, 9, 9)' }]}
        />,
      );
      const fab = getByRole(c, 'button');
      expect(fab.tagName).toBe('BUTTON');
      // The array is flattened onto the button; falsy entries are skipped.
      expect(fab.style.marginBottom).toBe('10px');
      // The crash signature: a leaked numeric ("0") style key.
      expect(fab.getAttribute('style') ?? '').not.toMatch(/(^|;)\s*0\s*:/);
    });

    it('later array entries win, mirroring RN precedence, and override the base container style', () => {
      const c = mount(
        <Fab
          accessibilityLabel="Add"
          icon={<span>+</span>}
          // `zIndex: 7` overrides the container's default zIndex (50).
          style={[{ zIndex: 3 }, { zIndex: 7, backgroundColor: 'rgb(1, 2, 3)' }]}
        />,
      );
      const fab = getByRole(c, 'button');
      expect(fab.style.zIndex).toBe('7');
      // Caller style is spread after the variant container style, so it wins.
      expect(fab.style.backgroundColor).toBe('rgb(1, 2, 3)');
    });

    it('accepts a single style object', () => {
      const c = mount(
        <Fab accessibilityLabel="Add" icon={<span>+</span>} style={{ marginBottom: 5 }} />,
      );
      expect(getByRole(c, 'button').style.marginBottom).toBe('5px');
    });

    it('flattens an array labelStyle onto the extended-FAB label span', () => {
      const c = mount(
        <Fab
          label="Compose"
          icon={<span>+</span>}
          labelStyle={[{ fontWeight: '700' }, false, { letterSpacing: 2 }]}
        />,
      );
      const label = getByText(c, 'Compose');
      expect(label.tagName).toBe('SPAN');
      expect(label.style.fontWeight).toBe('700');
      expect(label.style.letterSpacing).toBe('2px');
      // No leaked numeric style key from the array spread.
      expect(label.getAttribute('style') ?? '').not.toMatch(/(^|;)\s*0\s*:/);
    });
  });
});
