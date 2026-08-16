import type { StyleProp, ViewStyle } from 'react-native';

export interface SwitchProps {
  /** Current on/off state */
  value: boolean;
  /** Called when the user toggles the switch */
  onValueChange: (value: boolean) => void;
  /** Whether the switch is disabled */
  disabled?: boolean;
  /** Container style */
  style?: StyleProp<ViewStyle>;
  /** Size variant */
  size?: 'default' | 'sm';
  /**
   * The switch's accessible NAME, and the only way to give it one.
   *
   * A switch draws a track and a thumb and no text, so there is nothing for
   * assistive technology to read a name from: without this it announces
   * "switch, on" and nothing else. An adjacent caption is a SIBLING, not a
   * label — neither platform associates the two — so the name has to be stated
   * here even when the screen already shows the words.
   *
   * One spelling reaches both platforms. react-native-web's `createDOMProps`
   * emits `aria-label` from it, and React Native reads it directly. (This is
   * the opposite of `accessibilityState`, which reaches native alone — the two
   * are not the same rule.)
   *
   * Omitting it warns once in development; see `use-accessible-name-warning`.
   */
  accessibilityLabel?: string;
  testID?: string;
}
