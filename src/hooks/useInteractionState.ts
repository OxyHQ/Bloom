import { useCallback, useState } from 'react';

export function useInteractionState() {
  const [state, setState] = useState(false);

  const onIn = useCallback(() => {
    setState(true);
  }, []);
  const onOut = useCallback(() => {
    setState(false);
  }, []);

  return { state, onIn, onOut };
}

/**
 * Tracks multiple interaction states (hovered, focused, pressed) in one hook.
 *
 * Returns stable handler objects suitable for spreading onto Pressable-like components.
 * On web, `hoverHandlers` can be spread as `onMouseEnter`/`onMouseLeave`.
 */
export function useInteractionStates() {
  const { state: hovered, onIn: onHoverIn, onOut: onHoverOut } = useInteractionState();
  const { state: focused, onIn: onFocus, onOut: onBlur } = useInteractionState();
  const { state: pressed, onIn: onPressIn, onOut: onPressOut } = useInteractionState();

  return {
    hovered,
    focused,
    pressed,
    hoverHandlers: { onHoverIn, onHoverOut } as const,
    focusHandlers: { onFocus, onBlur } as const,
    pressHandlers: { onPressIn, onPressOut } as const,
  };
}
