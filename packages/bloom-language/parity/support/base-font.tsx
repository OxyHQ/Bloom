/**
 * React Native's `Text` as an Oxy app draws it: `@oxy.so/app-preset` 6.8.0
 * (`metro/base-font`) sends every React Native `Text` to a host that puts
 * Bloom's base face first in its style. On Android and iOS that is Inter, on a
 * text with no text ancestor (a nested text inherits its parent's family); on
 * the web it is the document's family (`fontFamily: inherit`), on every text.
 *
 * It is the baseline `RawText` is measured against, and the Text a screen
 * moved from React Native's draws before the move (the codemod's corpus).
 */
import { type ComponentProps, createContext, useContext } from 'react';
import * as RN from 'react-native';

const IS_WEB = RN.Platform.OS === 'web';
const BASE_FONT = { fontFamily: IS_WEB ? 'inherit' : 'Inter' };

/** React Native's own context: whether this text is inside another (the web needs none). */
const TextAncestor =
  (RN as unknown as { unstable_TextAncestorContext?: React.Context<boolean> })
    .unstable_TextAncestorContext ?? createContext(false);

/** React Native's Text props, its ref among them (a prop in React 19). */
type Props = ComponentProps<typeof RN.Text>;

export function BaseFontText(props: Props) {
  const nested = useContext(TextAncestor);
  if (nested && !IS_WEB) return <RN.Text {...props} />;
  return <RN.Text {...props} style={[BASE_FONT, props.style]} />;
}
