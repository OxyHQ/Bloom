// The shapes of `@oxy.so/bloom/surfaces`: a render callback named by a type alias.
import type { ReactNode } from 'react';

export interface SurfaceControls {
  dismiss: (result?: unknown) => void;
}
/** A surface's content factory: receives its own controls. */
export type SurfaceRenderFn = (surface: SurfaceControls) => ReactNode;
export interface PresentOptions {
  contentPadding?: number;
}
