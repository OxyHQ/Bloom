import { createContext, useContext } from 'react';

/**
 * Whether the navigator has finished bringing the screen in. A stack scene
 * pushed over another is false until its push transition ends; every other
 * screen (a stack's first, a pager's page, a panel, the web) is true from the
 * start.
 */
export const ScreenEnteredContext = createContext(true);
ScreenEnteredContext.displayName = 'BloomScreenEntered';

/**
 * Whether this screen's push transition has ended: until it has, the screen
 * shows what the reader opened (its header, the item itself, a skeleton) and
 * keeps what can wait (a thread's replies, a reply composer) for afterwards, so
 * the native transition starts at once and runs without that work on its
 * frames. True wherever no transition brings the screen in.
 */
export function useScreenEntered(): boolean {
  return useContext(ScreenEnteredContext);
}
