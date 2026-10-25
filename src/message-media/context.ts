import { createContext, useContext } from 'react';

/**
 * The long press of the bubble a media block sits in.
 *
 * A media block's own controls (a picture's frame, a file row, a play button)
 * are the deepest pressables under the finger, so on native they take the touch
 * and the bubble's `onLongPress` never fires: on Android a photo, a voice note
 * or a document could not open the message menu at all, and reply, react and
 * delete were out of reach except by swiping. `MessageBubble` publishes its long
 * press here and every pressable in this family hands it on through
 * `HoldPressable`.
 */
export const MessageMediaHoldContext = createContext<(() => void) | undefined>(undefined);

/** The enclosing bubble's long press, or `undefined` outside a bubble. */
export function useMessageMediaHold(): (() => void) | undefined {
  return useContext(MessageMediaHoldContext);
}
