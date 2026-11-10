/**
 * Which material the controls of a region take when they do not say: a floating header, a toolbar
 * or a bar publishes `'lens'` for its controls, so they are drawn by the native lens without each
 * consumer writing a prop. A control that draws the lens itself publishes `'surface'` for what it
 * holds, so a lens is never drawn inside a lens.
 */
import { createContext, useContext } from 'react';

import { useInSeparateWindow } from '../../blur/blur-target';
import { getNativeLens } from './native-lens';

export type ControlMaterial = 'lens' | 'surface';

const LensMaterialContext = createContext<ControlMaterial>('surface');

export const LensMaterialProvider = LensMaterialContext.Provider;

/** The material of the region the control sits in; an explicit `material` prop wins over it. */
export function useControlMaterial(): ControlMaterial {
  return useContext(LensMaterialContext);
}

/**
 * Whether a control may be drawn by the lens here: the native lens exists, and this is not a separate
 * window (a `<Modal>`: Dialog, BottomSheet), where there is no content behind to refract and the lens
 * would draw an empty dark box. There a control keeps the shared paint.
 */
export function useLensAvailable(): boolean {
  const separateWindow = useInSeparateWindow();
  return !separateWindow && getNativeLens() != null;
}
