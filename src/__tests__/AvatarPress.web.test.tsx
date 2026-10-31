/** @jest-environment jsdom */
import { act, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Avatar } from '../avatar';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

it('tracks press and cancellation and preserves accessible and callback behavior', () => {
  jest.useFakeTimers();
  const node = document.createElement('div');
  document.body.append(node);
  const root = createRoot(node);
  const first = jest.fn();
  const second = jest.fn();
  const render = (onPress?: () => void) => (
    <StrictMode>
      <BloomThemeProvider fonts={false}>
        <Avatar name="Ada" onPress={onPress} />
      </BloomThemeProvider>
    </StrictMode>
  );
  const mouse = (target: EventTarget, type: string) =>
    act(() => {
      target.dispatchEvent(
        new MouseEvent(type, {
          bubbles: true,
          cancelable: true,
          button: 0,
          buttons: type === 'mousedown' ? 1 : 0,
          clientX: 5,
          clientY: 5,
        }),
      );
    });
  try {
    act(() => root.render(render(first)));
    const button = node.querySelector('[role="button"]');
    if (!(button instanceof HTMLElement)) throw new Error('Avatar button missing');
    expect(button.getAttribute('aria-label')).toBe('Ada');
    expect(getComputedStyle(button).opacity).toBe('');
    mouse(button, 'mousedown');
    act(() => jest.advanceTimersByTime(50));
    expect(getComputedStyle(button).opacity).toBe('0.7');
    mouse(document, 'mouseup');
    expect(getComputedStyle(button).opacity).toBe('');
    mouse(button, 'click');
    expect(first).toHaveBeenCalledTimes(1);
    mouse(button, 'mousedown');
    act(() => jest.advanceTimersByTime(50));
    expect(getComputedStyle(button).opacity).toBe('0.7');
    act(() => document.dispatchEvent(new Event('scroll', { bubbles: false })));
    expect(getComputedStyle(button).opacity).toBe('');
    expect(first).toHaveBeenCalledTimes(1);
    act(() => root.render(render(second)));
    expect(node.querySelector('[role="button"]')).toBe(button);
    mouse(button, 'click');
    expect(second).toHaveBeenCalledTimes(1);
    expect(first).toHaveBeenCalledTimes(1);
    mouse(button, 'mousedown');
    act(() => jest.advanceTimersByTime(50));
    expect(getComputedStyle(button).opacity).toBe('0.7');
    act(() => root.render(render()));
    expect(node.querySelector('[role="button"]')).toBeNull();
    act(() => root.render(render(second)));
    const replacement = node.querySelector('[role="button"]');
    if (!(replacement instanceof HTMLElement)) throw new Error('Avatar button missing');
    expect(getComputedStyle(replacement).opacity).toBe('');
  } finally {
    act(() => root.unmount());
    node.remove();
    jest.useRealTimers();
  }
});
