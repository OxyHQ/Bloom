import { createContext } from 'react';

/** What a `Presence` hands a child that left: call `onLeft` when its removal has played. */
export interface Leaving {
  readonly onLeft: () => void;
}

/**
 * Set inside a child a web `Presence` keeps while it leaves. A `MotionView`
 * with an `exit` reads it and plays the exit; nothing else re-renders. Native
 * never sets it: there a removal plays after the unmount, natively.
 */
export const LeavingContext = createContext<Leaving | undefined>(undefined);

/** The props a child takes to be kept by a web `Presence` while it leaves. */
export interface PresenceChildProps {
  /** Set: a `MotionView` with an `exit` inside the child plays its removal. */
  exit?: boolean;
}
