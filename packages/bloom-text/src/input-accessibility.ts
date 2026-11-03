import type { RefObject } from 'react';
import type { ViewInstance } from './view-ref';
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
  _ref: RefObject<ViewInstance | null>,
  _props: InputAccessibility,
): void {}
