import { useState } from 'react';

/** A view's frame in the window, as `getBoundingClientRect()` gives it on both platforms. */
export interface Frame {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/**
 * Where each `.matchedGeometry(id, namespace)` view was last laid out, and in
 * which animation scope: SwiftUI's `@Namespace`. A view that mounts with an id
 * another one in the namespace last had moves from that frame to its own, when
 * the scope's value has changed since (`.animation('slide', selected)`), so a
 * reflow that changed no value never animates.
 */
export interface Namespace {
  readonly frames: Map<string, { readonly frame: Frame; readonly value: unknown }>;
  /**
   * A namespace that outlives screens (`transitionNamespace()`): the views
   * with each id that are on screen now, wherever they are, so the one that
   * arrives flies from where another is, and the one that stays flies back
   * when the other leaves.
   */
  readonly landers?: Map<string, Set<Lander>>;
}

/** A matched view in a namespace that outlives screens. */
export interface Lander {
  /** Where it is now, in the window. */
  measure(): Frame | undefined;
  /** Flies in from `from` to where it is, over every screen. */
  land(from: Frame): void;
}

/** A namespace for matched geometry, one per component instance. */
export function useNamespace(): Namespace {
  return useState<Namespace>(() => ({ frames: new Map() }))[0];
}

/**
 * A namespace for matched geometry between screens, declared once at module
 * scope and named by both: SwiftUI's `matchedTransitionSource` beside a
 * navigation transition. A view that arrives with an id another one has (on
 * the screen under it, or on the screen it replaced) flies from that one's
 * frame to its own in a layer over every screen; when it leaves and the other
 * is still there, the other flies back from it.
 */
export function transitionNamespace(): Namespace {
  return { frames: new Map(), landers: new Map() };
}
