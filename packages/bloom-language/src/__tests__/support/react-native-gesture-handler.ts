import { createElement, type ReactNode } from 'react';

/**
 * Gesture Handler's builder as data: a gesture records what it is given under
 * the builder method's name (`onUpdate`, `enabled`, …), a composed one its
 * members, so a suite fires a gesture's own callbacks with a payload.
 */
export interface RecordedGesture {
  readonly config: Record<string, unknown>;
  readonly members: readonly RecordedGesture[];
}
/** The builder methods Bloom's gesture layer calls. */
const METHODS = [
  'enabled',
  'manualActivation',
  'simultaneousWithExternalGesture',
  'activeOffsetX',
  'activeOffsetY',
  'failOffsetX',
  'failOffsetY',
  'onBegin',
  'onStart',
  'onUpdate',
  'onEnd',
  'onFinalize',
  'onTouchesDown',
  'onTouchesMove',
] as const;
type Builder = RecordedGesture & Record<(typeof METHODS)[number], (value: unknown) => Builder>;

function builder(members: readonly RecordedGesture[] = []): Builder {
  const config: Record<string, unknown> = {};
  const gesture = { config, members } as Builder;
  for (const method of METHODS) {
    gesture[method] = (value) => {
      config[method] = value;
      return gesture;
    };
  }
  return gesture;
}
const compose = (...members: RecordedGesture[]): RecordedGesture => builder(members);
export const Gesture = {
  Pan: () => builder(),
  Tap: () => builder(),
  Native: () => builder(),
  Race: compose,
  Simultaneous: compose,
  Exclusive: compose,
};
/** A host named `GestureDetector` carrying its gesture, around the view it detects on. */
export function GestureDetector({ gesture, children }: { gesture: unknown; children: ReactNode }) {
  return createElement('GestureDetector', { gesture }, children);
}
