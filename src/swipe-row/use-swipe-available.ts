import { useTouchInput } from '../styles/pointer';

/**
 * Whether a drag is the right affordance for THIS pointer.
 *
 * Native is always yes. Web is yes only where the pointer is COARSE: a web
 * build runs on a phone as readily as on a desktop, and the answer is a
 * property of the input device, not of the platform the bundle was built for.
 * A mouse gets the hover affordance its family draws instead — a drag is
 * undiscoverable with a pointer, and a `pointerdown`-driven pan fights text
 * selection.
 *
 * It is a HOOK rather than a constant because the answer changes without a
 * reload: a tablet with a keyboard folio attached and detached is the same
 * document, and a desktop window dragged to a touchscreen is too.
 */
export function useSwipeAvailable(): boolean {
  return useTouchInput();
}
