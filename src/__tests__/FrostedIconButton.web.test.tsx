/** @jest-environment jsdom */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
jest.mock('../theme/use-theme', () => ({
  useTheme: () => ({
    isDark: false,
    colors: {
      backgroundSecondary: '#eeeeee',
      backgroundTertiary: '#dddddd',
      textTertiary: '#888888',
      border: '#999999',
      card: '#ffffff',
      background: '#ffffff',
      text: '#17251e',
      textSecondary: '#65716a',
      primary: '#166534',
      primaryForeground: '#ffffff',
      negative: '#991b1b',
      negativeForeground: '#ffffff',
      primarySubtle: 'rgba(22,101,52,0.13)',
      primarySubtleForeground: '#14532d',
    },
  }),
}));
import { FrostedIconButton } from '../frosted-icon-button/FrostedIconButton.web';
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  jest.useFakeTimers();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  jest.useRealTimers();
});

it('composes the actual Button root with numeric size, icon size and caller layout', () => {
  const Icon = ({ width, height }: { width?: number; height?: number }) => (
    <svg data-testid="glyph" width={width} height={height} />
  );
  act(() =>
    root.render(
      <FrostedIconButton
        size={40}
        icon={Icon}
        accessibilityLabel="Save"
        className="caller"
        style={[{ marginTop: 8 }, { borderRadius: 12 }]}
      />,
    ),
  );
  const button = container.querySelector('button')!;
  expect(container.children).toHaveLength(1);
  expect(button.className).toContain('bloom-btn--surface');
  expect(button.className).toContain('caller');
  expect(button.getAttribute('aria-label')).toBe('Save');
  expect(button.style.width).toBe('40px');
  expect(button.style.height).toBe('40px');
  expect(button.style.marginTop).toBe('8px');
  expect(button.style.borderRadius).toBe('12px');
  expect(container.querySelector('svg')!.getAttribute('width')).toBe('22');
});
it('forwards each activation and controlled toggle once; disabled stays inert', () => {
  const press = jest.fn(),
    click = jest.fn(),
    toggle = jest.fn();
  const ui = (disabled = false) => (
    <FrostedIconButton
      checked
      disabled={disabled}
      accessibilityLabel="Saved"
      onPress={press}
      onClick={click}
      onCheckedChange={toggle}
    />
  );
  act(() => root.render(ui()));
  const button = container.querySelector('button')!;
  expect(button.getAttribute('aria-pressed')).toBe('true');
  act(() => button.click());
  expect(press).toHaveBeenCalledTimes(1);
  expect(click).toHaveBeenCalledTimes(1);
  expect(toggle).toHaveBeenCalledWith(false);
  act(() => root.render(ui(true)));
  act(() => button.click());
  expect(button.disabled).toBe(true);
  expect(press).toHaveBeenCalledTimes(1);
  expect(toggle).toHaveBeenCalledTimes(1);
});
it.each([
  ['xs', 28],
  ['sm', 32],
  ['md', 36],
  ['lg', 44],
] as const)('preserves %s diameter', (size, diameter) => {
  act(() => root.render(<FrostedIconButton size={size} accessibilityLabel="Back" />));
  expect(container.querySelector('button')!.style.width).toBe(`${diameter}px`);
});
it('honours the web accessible name and form type', () => {
  act(() =>
    root.render(
      <FrostedIconButton accessibilityLabel="Old" aria-label="Save" type="submit" id="save" />,
    ),
  );
  const button = container.querySelector('button')!;
  expect(button.getAttribute('aria-label')).toBe('Save');
  expect(button.type).toBe('submit');
  expect(button.id).toBe('save');
});
