import type { RefObject } from 'react';
import type { ViewInstance } from './view-ref';
import type { KeyCommand } from './types';

/**
 * Native: hardware-key modifiers do not reach JavaScript through the text
 * input, so key commands arrive through `onKeyPress` (key name only).
 */
/** Native: focus is reported through `onFocus`/`onBlur` only. */
export function containsFocus(_ref: RefObject<ViewInstance | null>): boolean {
  return false;
}

export function useKeyCapture(
  _ref: RefObject<ViewInstance | null>,
  _handler: ((command: KeyCommand) => boolean) | undefined,
): void {}
