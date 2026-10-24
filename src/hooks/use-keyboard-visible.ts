import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

/**
 * Whether the native software keyboard is up. Always false on the web, where
 * the browser resizes the visual viewport instead of covering the page.
 */
export function useKeyboardVisible(): boolean {
  const [visible, setVisible] = useState(
    () => Platform.OS !== 'web' && (Keyboard.isVisible?.() ?? false),
  );
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const show = Keyboard.addListener('keyboardDidShow', () => setVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return visible;
}
