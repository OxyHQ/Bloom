import type { RefObject } from 'react';
import type { View } from 'react-native';
import type { PasteData } from './types';

/** Native: the platform input pastes on its own; there is no paste to claim. */
export function usePasteCapture(
  _ref: RefObject<View | null>,
  _handler: ((paste: PasteData) => boolean) | undefined,
): void {}
