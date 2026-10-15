import type { RefObject } from 'react';
import type { View } from 'react-native';
import type { KeyCommand } from './types';

/**
 * Native: hardware-key modifiers do not reach JavaScript through the text
 * input, so key commands arrive through `onKeyPress` (key name only).
 */
/** Native: focus is reported through `onFocus`/`onBlur` only. */
export function containsFocus(_ref: RefObject<View | null>): boolean {
  return false;
}

export function useKeyCapture(
  _ref: RefObject<View | null>,
  _handler: ((command: KeyCommand) => boolean) | undefined,
): void {}
