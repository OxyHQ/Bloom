import { createElement, type ReactNode } from 'react';

/**
 * Gesture Handler 3's hooks as data: a gesture is its config, a composed one
 * its members, so a suite fires a gesture's own callbacks with a payload.
 */
export interface RecordedGesture {
  readonly config: Record<string, unknown>;
  readonly members: readonly RecordedGesture[];
}
const gesture = (config: Record<string, unknown>): RecordedGesture => ({ config, members: [] });
export const usePanGesture = gesture;
export const useTapGesture = gesture;
export const useCompetingGestures = (...members: RecordedGesture[]): RecordedGesture => ({
  config: {},
  members,
});
/** A host named `GestureDetector` carrying its gesture, around the view it detects on. */
export function GestureDetector({ gesture, children }: { gesture: unknown; children: ReactNode }) {
  return createElement('GestureDetector', { gesture }, children);
}
