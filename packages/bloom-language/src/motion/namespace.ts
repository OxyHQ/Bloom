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
}

/** A namespace for matched geometry, one per component instance. */
export function useNamespace(): Namespace {
  return useState<Namespace>(() => ({ frames: new Map() }))[0];
}
