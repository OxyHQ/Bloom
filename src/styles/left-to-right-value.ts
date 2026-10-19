import type { TextStyle } from 'react-native';

/**
 * A value that reads left to right in every script (an address, a URL, a phone
 * number, a date or a time) inside a right-to-left field. Left to the RTL
 * paragraph, bidi reorders its neutrals: a leading `+` jumps to the far end and
 * a half-typed `name@` or `16/` shows its symbol first. The text runs LTR while
 * the field keeps its RTL alignment. Apply it only when `useIsRtl()` is true.
 */
export const LEFT_TO_RIGHT_VALUE_IN_RTL: TextStyle = {
  writingDirection: 'ltr',
  textAlign: 'right',
};
