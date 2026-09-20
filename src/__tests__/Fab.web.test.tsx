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
  const Icon = () => <span>+</span>;
  it('renders an accessible static action', () => {
    const c = mount(<Fab icon={Icon} accessibilityLabel="Create" />);
    const button = getByRole(c, 'button', { name: 'Create' });
    expect(button.style.height).toBe('56px');
    expect(button.style.width).toBe('56px');
    expect(button.style.position).not.toBe('fixed');
    expect(button.style.bottom).toBe('');
  });
  it('blocks a disabled action at the DOM boundary', () => {
    const onPress = jest.fn();
    const c = mount(<Fab icon={Icon} label="Compose" disabled onPress={onPress} />);
    const button = getByRole(c, 'button', { name: 'Compose' });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onPress).not.toHaveBeenCalled();
  });
  it('uses the shared loading contract', () => {
    const c = mount(<Fab icon={Icon} accessibilityLabel="Create" loading />);
    expect(getByRole(c, 'button', { name: 'Create' })).toHaveAttribute('aria-busy', 'true');
  });
});
