import { createContext } from 'react';

import type { HapticStrength } from '../hooks/use-haptics';
import type { EngagementPaint } from './paint';

export interface EngagementBarContextValue {
  paint: EngagementPaint;
  formatCount: (count: number) => string;
  haptic: (strength: HapticStrength) => void;
}

/**
 * What `EngagementBar` resolves once for every action in it: paint, the count
 * format and haptics. An action reads this and nothing else, so a mounted action
 * holds one context subscription instead of one per concern.
 */
export const EngagementBarContext = createContext<EngagementBarContextValue | null>(null);

/** What an action looked like when an accepted press asked for motion. */
export interface EngagementPress {
  /** Keys the animated nodes, so a second press restarts them. */
  id: number;
  active: boolean;
  count: number | null;
  label: string | null;
}

/** An animated node's way to say it is finished: the action clears its press. */
export type EngagementMotionDone = (press: null) => void;
