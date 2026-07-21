import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import type { DialogInset, ResponsiveDialogPlacement } from '../dialog/types';

/**
 * How a surface renders — the placement + the `Dialog` sizing/chrome options a
 * surface needs. This is the CONTENT-AGNOSTIC presentation config: it never
 * references a route or screen name (Bloom's stack knows nothing about routes;
 * the SDK layers its route registry on top).
 *
 * The values map 1:1 onto the shared {@link ../dialog/types#DialogProps}, so a
 * surface reads/behaves identically to a hand-mounted `<Dialog>` with the same
 * props — only stacked/coordinated by {@link SurfaceHost}.
 */
export interface SurfacePresentation {
  /**
   * Surface anchor. Defaults to `{ base: 'bottom', md: 'center' }` — a bottom
   * sheet on narrow viewports that becomes a centered modal on wide ones (the
   * ecosystem's canonical responsive "sheet"). Pass `'center'` for a plain
   * modal, `'left'`/`'right'` for a drawer, or any responsive placement map.
   */
  placement?: ResponsiveDialogPlacement;
  /** Side-sheet width (px) on wide screens. Forwarded to `Dialog`. */
  width?: number;
  /** Centered-card max width (px). Forwarded to `Dialog`. */
  maxWidth?: number;
  /** Bottom-sheet max height as a fraction of the viewport height. */
  maxHeightRatio?: number;
  /** Side-sheet inset (px) from the root overlay's edges. */
  inset?: DialogInset;
  /** Whether to render the drag handle in bottom-sheet mode. */
  showHandle?: boolean;
  /**
   * Whether tapping the backdrop / pressing Escape / Android-back dismisses the
   * surface. Defaults to `true`. Set `false` for a blocking surface that must be
   * dismissed programmatically (e.g. an unanswered required prompt).
   */
  dismissOnBackdrop?: boolean;
  /** Inner padding (px) of the surface content container. Forwarded to `Dialog`. */
  contentPadding?: number;
  /** Style overrides applied to the inner content container. */
  style?: StyleProp<ViewStyle>;
  /** Style overrides for the side/bottom placement panel surface. */
  panelStyle?: StyleProp<ViewStyle>;
  /** NativeWind classes for the side/bottom placement panel surface. */
  panelClassName?: string;
  /** Style for the root overlay (theme-var scope, rail offset, etc.). */
  containerStyle?: StyleProp<ViewStyle>;
  /** NativeWind classes for the root overlay. */
  containerClassName?: string;
  /** Accessibility label applied to the surface's dialog role. */
  label?: string;
  /** Stable testID forwarded to the underlying `Dialog`. */
  testID?: string;
}

/** Options accepted by `present` / `SurfaceControls.present`. */
export type PresentOptions = SurfacePresentation;

/**
 * Controls handed to a presented surface — both as the argument to its render
 * function AND via {@link ../surfaces/useSurface#useSurface}. This is the DEPTH
 * axis only: a surface can dismiss ITSELF (resolving its own `present()`
 * promise) or `present` a CHILD surface stacked above it. Navigation WITHIN a
 * surface (route history / drill-in) is deliberately NOT here — that is the
 * SDK's route layer, which composes on top of this stack.
 */
export interface SurfaceControls {
  /**
   * Dismiss THIS surface, resolving the promise returned by the `present` call
   * that created it with `result` (or `undefined`). Resolves immediately; the
   * exit animation is cosmetic.
   */
  dismiss: (result?: unknown) => void;
  /**
   * Stack a CHILD surface directly above this one. Resolves with the child's
   * dismissal result. The child paints above (higher layer) and captures
   * backdrop/Escape/back until it is dismissed.
   */
  present: <Result = unknown>(
    render: SurfaceRenderFn,
    opts?: PresentOptions,
  ) => Promise<Result>;
}

/** A surface's content factory — receives its own {@link SurfaceControls}. */
export type SurfaceRenderFn = (surface: SurfaceControls) => ReactNode;

/** Lifecycle status of a stacked surface. */
export type SurfaceStatus = 'open' | 'closing';

/**
 * One entry in the surface stack. `resolve` fulfils the `present()` promise; the
 * `settled` guard makes resolution idempotent (resolve-once); `generation` is
 * the per-entry stale-callback guard (carried from `BottomSheetBase`'s
 * `closeGenerationRef`, keyed per entry id) so a completion callback from a
 * superseded close cycle can never tear down the wrong state.
 */
export interface SurfaceEntry {
  id: string;
  render: SurfaceRenderFn;
  presentation: SurfacePresentation;
  status: SurfaceStatus;
  resolve: (result: unknown) => void;
  settled: boolean;
  generation: number;
}

/** Options for the built-in {@link ../surfaces/prompts#confirm} surface. */
export interface SurfaceConfirmOptions {
  /** Headline. */
  title: string;
  /** Supporting copy. */
  message?: string;
  /** Confirm button label. Defaults to `'Confirm'`. */
  confirmLabel?: string;
  /** Cancel button label. Defaults to `'Cancel'`. */
  cancelLabel?: string;
  /** Style the confirm button as destructive (negative color). */
  destructive?: boolean;
  /** Hide the cancel button (a single-action acknowledgement). */
  hideCancel?: boolean;
  /**
   * Backdrop / Escape / back dismiss (resolving `false`). Defaults to `true`;
   * pass `false` for a blocking confirm that must be answered by a button.
   */
  dismissible?: boolean;
  /** Placement override. Defaults to `'center'`. */
  placement?: ResponsiveDialogPlacement;
}

/** Options for the built-in {@link ../surfaces/prompts#prompt} surface. */
export interface SurfacePromptOptions {
  /** Headline. */
  title: string;
  /** Supporting copy. */
  message?: string;
  /** Input placeholder. */
  placeholder?: string;
  /** Initial input value. */
  defaultValue?: string;
  /** Accessibility label for the input. Defaults to the `title`. */
  inputLabel?: string;
  /** Submit button label. Defaults to `'OK'`. */
  confirmLabel?: string;
  /** Cancel button label. Defaults to `'Cancel'`. */
  cancelLabel?: string;
  /**
   * Backdrop / Escape / back dismiss (resolving `null`). Defaults to `true`;
   * pass `false` for a blocking prompt.
   */
  dismissible?: boolean;
  /** Placement override. Defaults to `'center'`. */
  placement?: ResponsiveDialogPlacement;
}
