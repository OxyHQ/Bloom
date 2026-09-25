import { createContext, useContext } from 'react';
import { useSharedValue, type SharedValue } from 'react-native-reanimated';

/**
 * The open keyboard's height under a `BottomSheet`, for content that owns a
 * bottom inset of its own. Native only: the sheet's shell writes it, web leaves
 * it at 0 (the browser owns keyboard layout).
 *
 * `DialogBottomSheet` reads it to fold its safe-area spacer while the keyboard
 * is up: the keyboard covers the gesture bar the spacer clears, so keeping it
 * floated the sheet's buttons a bar's height above the keyboard (Android 16).
 *
 * Internal: not in the family barrel.
 */
const SheetKeyboardContext = createContext<SharedValue<number> | null>(null);

export const SheetKeyboardProvider = SheetKeyboardContext.Provider;

/** The sheet's keyboard height, or a constant 0 outside a sheet. */
export function useSheetKeyboardHeight(): SharedValue<number> {
  const none = useSharedValue(0);
  return useContext(SheetKeyboardContext) ?? none;
}
