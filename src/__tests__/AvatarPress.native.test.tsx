import { StrictMode } from 'react';
import { fireEvent, render } from '@testing-library/react-native';

// Native Pressability can unmount without delivering onPressOut. The real
// react-native Pressable was also verified in the consuming Expo harness.
jest.mock('react-native', () => {
  const React = require('react') as typeof import('react');
  const native = jest.requireActual<typeof import('../../__mocks__/react-native')>('react-native');
  type Props = {
    children?: React.ReactNode;
    style?: unknown | ((state: { pressed: boolean }) => unknown);
    onPressIn?: () => void;
    onPressOut?: () => void;
    [key: string]: unknown;
  };
  function Pressable({ children, style, onPressIn, onPressOut, ...props }: Props) {
    const [pressed, setPressed] = React.useState(false);
    return React.createElement(
      'Pressable',
      {
        ...props,
        accessible: true,
        style: typeof style === 'function' ? style({ pressed }) : style,
        onPressIn: () => {
          setPressed(true);
          onPressIn?.();
        },
        onPressOut: () => {
          setPressed(false);
          onPressOut?.();
        },
      },
      children,
    );
  }
  return { ...native, Pressable };
});

import { StyleSheet } from 'react-native';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Avatar } from '../avatar';

it('does not retain pressed opacity when the native control is removed and restored mid-press', () => {
  const onPress = jest.fn();
  const element = (enabled: boolean) => (
    <StrictMode>
      <BloomThemeProvider fonts={false}>
        <Avatar name="Ada" onPress={enabled ? onPress : undefined} />
      </BloomThemeProvider>
    </StrictMode>
  );
  const tree = render(element(true));
  fireEvent(tree.getByRole('button'), 'pressIn');
  expect(StyleSheet.flatten(tree.getByRole('button').props.style)?.opacity).toBe(0.7);
  tree.rerender(element(false));
  expect(tree.queryByRole('button')).toBeNull();
  tree.rerender(element(true));
  expect(StyleSheet.flatten(tree.getByRole('button').props.style)?.opacity).not.toBe(0.7);
});
