import { useRef } from 'react';
import { Platform } from 'react-native';

/**
 * The slice of a key event this hook reads. react-native-web hands a Pressable
 * the DOM event (`key` on the event itself); React Native 0.88 types
 * `onKeyDown` with its own synthetic event (`key` under `nativeEvent`). Typed
 * structurally so the handlers satisfy RN's prop type without claiming either
 * shape — and read from both.
 */
export interface ChoiceKeyEvent {
  key?: string;
  repeat?: boolean;
  nativeEvent?: { key?: string; repeat?: boolean };
  target: unknown;
  currentTarget: unknown;
  preventDefault(): void;
  stopPropagation(): void;
}

const isSpace = (event: ChoiceKeyEvent) => {
  const key = event.key ?? event.nativeEvent?.key;
  return key === ' ' || key === 'Spacebar';
};

/** RNW Pressable activates Enter for every role, but Space only for buttons.
 * Checkbox/radio rows own the missing Space gesture. Native keeps Pressable's
 * platform handling. Activation waits for keyup and is cancelled by blur. */
export function useChoiceSpaceKey(disabled: boolean, activate: () => void) {
  const armed = useRef(false);
  if (Platform.OS !== 'web') return {};
  return {
    onKeyDown(event: ChoiceKeyEvent) {
      if (!isSpace(event)) return;
      if (event.target !== event.currentTarget || disabled) return;
      event.preventDefault();
      event.stopPropagation();
      if (!(event.repeat ?? event.nativeEvent?.repeat)) armed.current = true;
    },
    onKeyUp(event: ChoiceKeyEvent) {
      if (!isSpace(event)) return;
      const wasArmed = armed.current;
      armed.current = false;
      if (event.target !== event.currentTarget || disabled || !wasArmed) return;
      event.preventDefault();
      event.stopPropagation();
      activate();
    },
    onBlur() {
      armed.current = false;
    },
  };
}
