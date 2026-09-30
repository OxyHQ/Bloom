import { createContext } from 'react';
import type { DrawingContext } from './drawing';

/** Internal frame observer. A preview can retain its committed artwork for a handoff. */
export const AvatarDrawingObserver = createContext<
  ((drawing: DrawingContext) => void) | null
>(null);
