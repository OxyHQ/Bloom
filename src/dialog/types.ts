import type { GestureResponderEvent, StyleProp, ViewStyle } from 'react-native';

import type { ResponsiveDialogPlacement } from './placement';

export type { DialogPlacement, ResponsiveDialogPlacement } from './placement';

/**
 * Side-sheet inset (px) from the root overlay's edges. Lets a host place a
 * `left`/`right` placement "inside its own shell" — e.g. offset from the top
 * by a header, or from the anchored edge by a nav rail.
 */
export type DialogInset = {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
};

/**
 * Imperative open/close handle returned by `useDialogControl`.
 *
 * Consumers receive an instance of `DialogControlProps`, which is a stable
 * object whose `open`/`close` methods proxy to whichever `Dialog` instance
 * has currently registered itself via the internal ref. Re-rendering the
 * dialog under the same control does not break the handle.
 */
export type DialogControlRefProps = {
  open: () => void;
  close: (callback?: () => void) => void;
};

export type DialogControlProps = DialogControlRefProps & {
  id: string;
  ref: React.RefObject<DialogControlRefProps | null>;
};

export type DialogContextProps = {
  close: DialogControlProps['close'];
  isWithinDialog: boolean;
};

/**
 * Color of a declarative `DialogAction`. Maps to bloom's theme palette:
 *
 * - `'default'`  -> theme primary (filled CTA)
 * - `'cancel'`   -> theme secondary (auto-dismiss, no `onPress` required)
 * - `'destructive'` -> theme negative
 */
export type DialogActionColor = 'default' | 'cancel' | 'destructive';

export type DialogAction = {
  label: string;
  onPress?: (e: GestureResponderEvent) => void;
  color?: DialogActionColor;
  disabled?: boolean;
  /**
   * Defaults to `true`. When `true`, the dialog closes (and runs the close
   * animation) before `onPress` is invoked, which gives the surrounding
   * screen transition a chance to start before the action's side effects
   * (navigation, network, etc.) kick in. Set `false` to keep the dialog
   * mounted (e.g. while an async confirmation is in flight).
   */
  shouldCloseOnPress?: boolean;
  testID?: string;
};

/**
 * Props accepted by the unified `<Dialog>` component.
 *
 * Open/close is driven by EITHER of two mutually-exclusive modes:
 *
 *   - **Imperative `control`** (`useDialogControl()` + `control.open()` /
 *     `control.close()`). The legacy default; unchanged.
 *   - **Controlled `open`** (an `open` boolean + `onClose`). When `open` is
 *     provided it wins and `control` is ignored.
 *
 * Rendering modes (orthogonal to open/close mode) — pick whichever fits:
 *
 *   1. **Declarative (`title` / `description` / `actions`).** Most common
 *      confirm/cancel surface. Bloom renders the title, description and
 *      action row for you.
 *
 *   2. **Custom children.** Pass any JSX as `children` and bloom renders it
 *      verbatim inside the dialog frame. Combine with `title` to keep the
 *      header consistent.
 *
 *   3. **Imperative `alert()`.** Bypass the JSX layer entirely — see the
 *      module-level `alert()` helper.
 *
 * `placement` controls the surface anchor — centered modal (default), an
 * anchored side-sheet (`left`/`right`), or a bottom-sheet (`bottom`) — and may
 * be a responsive map that collapses to a bottom-sheet on narrow viewports.
 */
export type DialogProps = React.PropsWithChildren<{
  /**
   * Imperative open/close handle from `useDialogControl()`. Optional — omit it
   * when driving the dialog with the controlled `open` prop instead.
   */
  control?: DialogControlProps;
  /**
   * Controlled open state (opt-in). When provided, the dialog is driven by
   * this boolean and `onClose`, and `control` is ignored.
   */
  open?: boolean;
  /**
   * Fires after the dialog has finished closing. In controlled mode it is the
   * close request the host must answer by flipping `open` to `false`.
   */
  onClose?: () => void;
  testID?: string;
  /** Optional dialog header text. Rendered above `description` / `children`. */
  title?: string;
  /** Optional supporting copy, rendered below the title. */
  description?: string;
  /**
   * Optional action row. When provided, bloom renders the appropriate
   * confirm/cancel/destructive buttons for you. Order is preserved.
   */
  actions?: DialogAction[];
  /**
   * Surface anchor. Defaults to `'center'` (the centered modal — current
   * behavior). `'left'`/`'right'` render an anchored side-sheet, `'bottom'` a
   * bottom-sheet. A responsive map resolves by viewport width, e.g.
   * `{ base: 'bottom', md: 'left' }` (drawer on wide, sheet on narrow).
   */
  placement?: ResponsiveDialogPlacement;
  /** Side-sheet width (px) on wide screens. Defaults to `460`. */
  width?: number;
  /** Centered-card max width (px). Defaults to `480`. */
  maxWidth?: number;
  /** Bottom-sheet max height as a fraction of the viewport height. Defaults to `0.9`. */
  maxHeightRatio?: number;
  /** Side-sheet inset (px) from the root overlay's edges. */
  inset?: DialogInset;
  /** Whether to render the drag handle in bottom-sheet mode. Defaults to `true`. */
  showHandle?: boolean;
  /**
   * Inner padding (px) of the dialog content container, applied uniformly across
   * every placement (centered panel, side-sheet body, bottom-sheet body).
   * Defaults to `20`.
   *
   * The default chrome padding is correct for the declarative
   * `title`/`description`/`actions` layout, but a host passing pure custom
   * `children` that already own their insets can set `contentPadding={0}` to
   * render flush content and manage padding itself. Omitting the prop keeps the
   * 20px default on every surface.
   */
  contentPadding?: number;
  /** Whether tapping the backdrop dismisses the dialog. Defaults to `true`. */
  dismissOnBackdrop?: boolean;
  /**
   * Style overrides applied to the inner content container on native (the
   * floating bottom-sheet card) and to the modal panel on web.
   */
  style?: StyleProp<ViewStyle>;
  /** Style overrides for the side/bottom placement panel surface. */
  panelStyle?: StyleProp<ViewStyle>;
  /** NativeWind classes for the side/bottom placement panel surface. */
  panelClassName?: string;
  /** Style for the root overlay (theme-var scope, rail offset, etc.). */
  containerStyle?: StyleProp<ViewStyle>;
  /** NativeWind classes for the root overlay (e.g. `"md:left-[4.75rem]"`). */
  containerClassName?: string;
  /** Accessibility label, applied to the dialog role on web. */
  label?: string;
  /**
   * Stacking layer index within a coordinated surface stack. Multiplies
   * `Z_INDEX_LAYER_STEP` onto this dialog's overlay z-indices (backdrop +
   * panel) so a dialog presented on top of another paints above it. Defaults to
   * `0` — the single-dialog case, byte-for-byte unchanged. Set by the shared
   * surface stack (`src/surfaces`); direct consumers rarely need it. No-op for
   * the `bottom` placement, which already stacks in mount order (native RN
   * `<Modal>` / the web portal), so `layer` is harmless there.
   */
  layer?: number;
}>;

/**
 * Web-only options. Native uses bloom's `BottomSheet` underneath which has
 * its own positioning model.
 */
export type DialogWebOptions = {
  alignCenter?: boolean;
};
