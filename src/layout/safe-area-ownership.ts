import { createContext, useContext, useMemo } from 'react';
import { SafeAreaInsetsContext, type EdgeInsets } from 'react-native-safe-area-context';

export const NO_CONSUMED_SAFE_AREA: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 };
/** Frame occupancy stays separate from physical insets, which portals still need. */
export const SafeAreaConsumedContext = createContext(NO_CONSUMED_SAFE_AREA);

/** Insets still owed by content after its enclosing frame has consumed its edges. */
export function useContentSafeAreaInsets(): EdgeInsets {
  const physical = useContext(SafeAreaInsetsContext) ?? NO_CONSUMED_SAFE_AREA;
  const consumed = useContext(SafeAreaConsumedContext);
  return useMemo(
    () => ({
      top: Math.max(0, physical.top - consumed.top),
      right: Math.max(0, physical.right - consumed.right),
      bottom: Math.max(0, physical.bottom - consumed.bottom),
      left: Math.max(0, physical.left - consumed.left),
    }),
    [physical, consumed],
  );
}
