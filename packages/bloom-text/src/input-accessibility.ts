import type { RefObject } from 'react';
import type { View } from 'react-native';
import type { RichTextInputProps } from './types';

export type InputAccessibility = Pick<
  RichTextInputProps,
  | 'accessibilityLabel'
  | 'aria-controls'
  | 'aria-activedescendant'
  | 'aria-expanded'
  | 'aria-autocomplete'
>;

/** Native accessibility is forwarded to the native input itself. */
export function useInputAccessibility(
  _ref: RefObject<View | null>,
  _props: InputAccessibility,
): void {}
