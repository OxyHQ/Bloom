import type { GestureResponderEvent } from 'react-native';

/** Router callbacks only replace an unmodified primary activation of an anchor. */
export function isPlainLinkActivation(event: GestureResponderEvent): boolean {
  const native = event.nativeEvent as GestureResponderEvent['nativeEvent'] & {
    button?: number;
    metaKey?: boolean;
    ctrlKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
  };
  return (
    !event.defaultPrevented &&
    (native.button == null || native.button === 0) &&
    !native.metaKey &&
    !native.ctrlKey &&
    !native.shiftKey &&
    !native.altKey
  );
}
