import { createContext, useContext, useRef, type ReactNode, type RefObject } from 'react';
import { BlurTargetView } from 'expo-blur';
import { Platform, StyleSheet, type View } from 'react-native';

type BlurTargetRef = RefObject<View | null>;

const BlurTargetContext = createContext<BlurTargetRef | null>(null);

/**
 * Gives Android overlay blurs a real view to sample.
 *
 * Expo Blur 56+ intentionally disables the Dimezis implementation unless a
 * `BlurTargetView` is supplied. Bloom's sheets render their backdrop inside a
 * native `Modal`, so the target must live around the app content in the
 * underlying window and travel to the modal through React context.
 *
 * Only modal backdrops consume this target. Ordinary in-tree BlurViews never
 * target their own ancestor, avoiding the recursive capture/crash that causes.
 */
export function BloomBlurTargetProvider({ children }: { children: ReactNode }) {
  const targetRef = useRef<View>(null);

  if (Platform.OS !== 'android') {
    return <>{children}</>;
  }

  return (
    <BlurTargetContext.Provider value={targetRef}>
      <BlurTargetView ref={targetRef} style={styles.target}>
        {children}
      </BlurTargetView>
    </BlurTargetContext.Provider>
  );
}

/** Internal target used only by Bloom's native modal backdrops. */
export function useBloomBlurTarget(): BlurTargetRef | null {
  return useContext(BlurTargetContext);
}

const styles = StyleSheet.create({
  target: {
    flex: 1,
  },
});
