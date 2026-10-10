/** @jest-environment jsdom */
import React from 'react';
import {
  act,
  render,
  cleanup,
  fireEvent,
} from '@testing-library/react-native/pure';
jest.mock('react-native', () => {
  const base = jest.requireActual('../../__mocks__/react-native');
  const real = jest.requireActual('react-native-web');
  const engine = jest.requireActual(
    'react-native-web/dist/cjs/vendor/react-native/Animated/AnimatedImplementation',
  );
  return {
    ...base,
    Platform: { ...base.Platform, OS: 'ios' },
    Easing: real.Easing,
    Animated: { ...base.Animated, Value: engine.Value, timing: engine.timing },
  };
});
jest.mock('../hooks/use-prefers-reduced-motion', () => ({
  usePrefersReducedMotion: jest.fn(() => false),
}));
import { Text, TextInput, View } from 'react-native';
import { Collapsible } from '../collapsible/Collapsible';
import { usePrefersReducedMotion } from '../hooks/use-prefers-reduced-motion';
import { resolvedStyle } from './support/rendered-style';
const reduced = jest.mocked(usePrefersReducedMotion);
beforeEach(() => {
  jest.useFakeTimers();
  reduced.mockReturnValue(false);
});
afterEach(async () => {
  jest.useRealTimers();
  await cleanup();
  jest.restoreAllMocks();
});
it('uses the real native JS animation engine for natural height and settles live reduced motion', () => {
  const draw = (open: boolean) => (
    <Collapsible open={open} testID="body">
      <Text>Content</Text>
    </Collapsible>
  );
  const ui = render(draw(false));
  const body = () => ui.getByTestId('body', { includeHiddenElements: true });
  ui.rerender(draw(true));
  const measured = ui.UNSAFE_root.findAll(
    (node) =>
      node.props.collapsable === false &&
      typeof node.props.onLayout === 'function',
  )[0]!;
  act(() =>
    measured.props.onLayout({
      nativeEvent: { layout: { height: 940, width: 300, x: 0, y: 0 } },
    }),
  );
  const height = () =>
    (
      resolvedStyle(body().props.style).maxHeight as { __getValue(): number }
    ).__getValue();
  expect(height()).toBe(0);
  act(() => jest.advanceTimersByTime(150));
  expect(height()).toBeGreaterThan(0);
  expect(height()).toBeLessThan(940);
  act(() => jest.advanceTimersByTime(250));
  expect(height()).toBe(940);
  ui.rerender(draw(false));
  expect(body().props.importantForAccessibility).toBe('no-hide-descendants');
  expect(body().props.pointerEvents).toBe('none');
  act(() => jest.advanceTimersByTime(100));
  expect(height()).toBeGreaterThan(0);
  reduced.mockReturnValue(true);
  ui.rerender(draw(false));
  expect(height()).toBe(0);
  expect(ui.queryByText('Content')).toBeNull();
  expect(ui.getByText('Content', { includeHiddenElements: true })).toBeTruthy();
  ui.rerender(draw(true));
  expect(height()).toBe(940);
  expect(ui.getByText('Content')).toBeTruthy();
});
it('only restores observable focus that was within the native body', () => {
  reduced.mockReturnValue(true);
  const focus = jest.fn();
  const target = { current: { focus } };
  const draw = (open: boolean) => (
    <Collapsible open={open} returnFocusRef={target} testID="body">
      <TextInput testID="input" />
    </Collapsible>
  );
  const ui = render(draw(true));
  fireEvent(ui.getByTestId('body'), 'focus');
  ui.rerender(draw(false));
  expect(focus).toHaveBeenCalledTimes(1);
  ui.rerender(draw(true));
  fireEvent(ui.getByTestId('body'), 'focus');
  fireEvent(ui.getByTestId('body'), 'blur');
  ui.rerender(draw(false));
  expect(focus).toHaveBeenCalledTimes(1);
});
it('blurs only the public focused TextInput contained by the native host before returning focus', () => {
  reduced.mockReturnValue(true);
  const inside = { blur: jest.fn() };
  const outside = { blur: jest.fn() };
  let focused: typeof inside | null = inside;
  const original = Object.getOwnPropertyDescriptor(TextInput, 'State');
  Object.defineProperty(TextInput, 'State', {
    configurable: true,
    value: { currentlyFocusedInput: () => focused },
  });
  const focus = jest.fn();
  const target = { current: { focus } };
  const draw = (open: boolean) => (
    <Collapsible open={open} returnFocusRef={target} testID="body">
      <TextInput />
    </Collapsible>
  );
  const ui = render(draw(true), {
    createNodeMock: (element) =>
      (element.props as { testID?: string }).testID === 'body'
        ? { contains: (node: unknown) => node === inside }
        : null,
  });
  ui.rerender(draw(false));
  expect(inside.blur).toHaveBeenCalledTimes(1);
  expect(focus).toHaveBeenCalledTimes(1);
  focused = outside;
  ui.rerender(draw(true));
  ui.rerender(draw(false));
  expect(outside.blur).not.toHaveBeenCalled();
  expect(focus).toHaveBeenCalledTimes(1);
  if (original) Object.defineProperty(TextInput, 'State', original);
  else delete (TextInput as unknown as { State?: unknown }).State;
});
