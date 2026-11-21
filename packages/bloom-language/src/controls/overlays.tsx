import type { ControlRenderer } from './draw';

/** Overlays and feedback: dialogs, alerts, popovers, toasts. */
export type OverlayKind = never;

/** The renderer of each kind in this family. */
export const OVERLAYS: Partial<Record<OverlayKind, ControlRenderer>> = {};
