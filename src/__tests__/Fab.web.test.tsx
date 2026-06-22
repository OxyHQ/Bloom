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

  it('uses position: sticky for the default bottom-right placement (NOT fixed)', () => {
    const c = mount(<Fab accessibilityLabel="Add" icon={<span>+</span>} />);
    const fab = getByRole(c, 'button');
    expect(fab.style.position).toBe('sticky');
    expect(fab.style.bottom).toBe('16px');
    expect(fab.style.alignSelf).toBe('flex-end');
  });

  it('sets margin-top: auto for bottom placements so a short column pins the FAB to the bottom', () => {
    const c = mount(<Fab accessibilityLabel="Add" icon={<span>+</span>} />);
    expect(getByRole(c, 'button').style.marginTop).toBe('auto');
  });

  it('does NOT set margin-top: auto for top placements', () => {
    const c = mount(<Fab accessibilityLabel="Add" placement="top-right" icon={<span>+</span>} />);
    const fab = getByRole(c, 'button');
    expect(fab.style.marginTop).toBe('');
    expect(fab.style.top).toBe('16px');
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
});
