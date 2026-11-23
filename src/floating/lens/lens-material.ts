/**
 * Which material the controls of a region take when they do not say: a floating header, a toolbar
 * or a bar publishes `'lens'` for its controls, so they are drawn by the native lens without each
 * consumer writing a prop. Inside a lens base the region is the surface, so a lens is never drawn
 * inside a lens.
 */
import { createContext, useContext } from 'react';

import { useInSeparateWindow } from '../../blur/blur-target';
import { getNativeLens, useInLensBase } from './native-lens';

export type ControlMaterial = 'lens' | 'surface';

const LensMaterialContext = createContext<ControlMaterial>('surface');

export const LensMaterialProvider = LensMaterialContext.Provider;

/**
 * The material of the region the control sits in; an explicit `material` prop wins over it.
 * Inside a lens base (a lens group, a bar, a Surface on the lens) it is the surface: a lens is
 * never drawn inside a lens.
 */
export function useControlMaterial(): ControlMaterial {
  const region = useContext(LensMaterialContext);
  return useInLensBase() ? 'surface' : region;
}

/**
 * Whether a control floats: its material, said by its prop or by its region (a floating header, a
 * toolbar, a bar), is the lens, whether or not the lens can draw it here. A floating control is
 * Bloom's one floating size (`FLOATING_CONTROL_SIZE`, 44), whatever size it is given: the control
 * decides it, never its caller.
 */
export function useFloatingControl(material: string | undefined): boolean {
  const region = useContext(LensMaterialContext);
  return (material ?? region) === 'lens';
}

/**
 * Whether the region is a floating one (a floating header, a toolbar, a bar, a FAB): a fixed layer the
 * window draws the lens of. Outside one a control on the lens is in the page's content, and its lens is
 * drawn in its own place (`LensButtonHost inContent`), so it scrolls and stacks with the page instead of
 * being drawn above it by the window.
 */
export function useInFloatingRegion(): boolean {
  return useContext(LensMaterialContext) === 'lens';
}

/**
 * Whether a control may be drawn by the lens here: the native lens exists, the control is not inside
 * a lens base (a lens is never drawn inside a lens), and this is not a separate
 * window (a `<Modal>`: Dialog, BottomSheet), where there is no content behind to refract and the lens
 * would draw an empty dark box. There a control keeps the shared paint.
 */
export function useLensAvailable(): boolean {
  const separateWindow = useInSeparateWindow();
  const inBase = useInLensBase();
  return !separateWindow && !inBase && getNativeLens() != null;
}
