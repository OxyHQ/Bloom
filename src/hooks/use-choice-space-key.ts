import { useRef, type KeyboardEvent } from 'react';
import { Platform } from 'react-native';

/** RNW Pressable activates Enter for every role, but Space only for buttons.
 * Checkbox/radio rows own the missing Space gesture. Native keeps Pressable's
 * platform handling. Activation waits for keyup and is cancelled by blur. */
export function useChoiceSpaceKey(disabled: boolean, activate: () => void) {
  const armed = useRef(false);
  if (Platform.OS !== 'web') return {};
  return {
    onKeyDown(event: KeyboardEvent<HTMLElement>) {
      if (event.key !== ' ' && event.key !== 'Spacebar') return;
      if (event.target !== event.currentTarget || disabled) return;
      event.preventDefault();
      event.stopPropagation();
      if (!event.repeat) armed.current = true;
    },
    onKeyUp(event: KeyboardEvent<HTMLElement>) {
      if (event.key !== ' ' && event.key !== 'Spacebar') return;
      const wasArmed = armed.current;
      armed.current = false;
      if (event.target !== event.currentTarget || disabled || !wasArmed) return;
      event.preventDefault();
      event.stopPropagation();
      activate();
    },
    onBlur() { armed.current = false; },
  };
}
