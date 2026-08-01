import type { ReactNode } from 'react';
import type { GestureResponderEvent, StyleProp, ViewStyle } from 'react-native';

import type { ResponsiveDialogPlacement } from './placement';

export type { DialogPlacement, ResponsiveDialogPlacement } from './placement';

/**
 * Config for the Dialog's OWN navigation header — a DISTINCT surface mode from
 * the declarative `title`/`description`/`actions` centered-heading path. When
 * present it turns the Dialog into a scrolling page with a sticky, gradient top
 * bar (left + right slots) and a large collapsing title that lives in the
 * Dialog's own scroll content; as the large title scrolls under the bar a small
 * title cross-fades into the bar center. Screens render NO header of their own.
 *
 * A surface seeds this from its registry config; a mounted screen may override
 * or augment any field at runtime via `useDialogHeader` (a dynamic title, a Save
 * action on the right, etc.).
 */
export interface DialogHeaderConfig {
  /** Collapsing title — rendered large in-content and small in the nav bar. */
  title?: string;
  /**
   * A branded node rendered centered in the nav bar INSTEAD of the collapsing
   * text title — e.g. a product wordmark. Always visible (it never collapses),
   * and it suppresses the large in-content title/subtitle entirely, so the
   * surface starts flush under the bar. `title`/`subtitle` are ignored while
   * this is set. Must be referentially stable (memoize it) so the header does
   * not thrash.
   */
  titleContent?: ReactNode;
  /** Supporting copy under the large title (and, optionally, in the bar). */
  subtitle?: string;
  /**
   * Whether to render the large collapsing title in the scroll content.
   * Defaults to `true`. When `false`, only the small nav-bar title shows (always
   * visible, no collapse) and the content starts flush under the bar.
   */
  largeTitle?: boolean;
  /** Custom left slot node. Overrides the default back button. */
  left?: ReactNode;
  /** Custom right slot node. Overrides the default close button. */
  right?: ReactNode;
  /**
   * When set, the default left slot renders a back button that calls this. A
   * custom `left` node still wins. Set by the surface host when the surface can
   * navigate back.
   */
  onBack?: () => void;
  /**
   * Whether the default right slot renders a close button (dismiss). Defaults to
   * `true`. A custom `right` node still wins. `false` suppresses the close
   * affordance entirely (e.g. a blocking surface).
   */
  showClose?: boolean;

  // -------------------------------------------------------------------------
  //  Rich navigation-header fields (all OPTIONAL + backward-compatible).
  //
  //  Modeled on iOS `UINavigationBar` / SwiftUI `.toolbar` + Material 3
  //  `TopAppBar`. Nav-row trailing = [actions…] + [primaryAction]; the
  //  collapsing large-title zone stacks title → search → segments → progress.
  //  A screen that sets none of these renders byte-for-byte as before. Object
  //  fields are compared by identity — memoize them so the header does not
  //  thrash (same contract as `left`/`right`).
  // -------------------------------------------------------------------------

  /**
   * The ONE trailing call-to-action (Upload / Use photo / Save / Done) — a
   * proper Bloom `Button` rendered at the trailing edge of the nav row, AFTER
   * any `actions`. Standardizes what screens used to cram into `right`; supports
   * `disabled` and a `loading` spinner (async submit). When set (and no explicit
   * `right`), the default close affordance moves to the leading edge if the
   * screen has no `onBack`, so there is always exactly one dismiss control.
   */
  primaryAction?: {
    label: string;
    onPress: () => void;
    disabled?: boolean;
    loading?: boolean;
  };

  /**
   * Trailing icon buttons (share / more / sort), rendered as frosted circles
   * BEFORE `primaryAction`. Past {@link DIALOG_HEADER_MAX_INLINE_ACTIONS} the
   * surplus collapses into a "more" overflow menu (Material pattern) built on
   * Bloom's `Menu` — never hand-rolled. Each item's `accessibilityLabel` is also
   * its overflow-menu row text.
   */
  actions?: Array<{
    icon: ReactNode;
    accessibilityLabel: string;
    onPress: () => void;
    disabled?: boolean;
  }>;

  /**
   * A search field in the collapsing large-title zone (iOS `.searchable` style:
   * sits under the title and scrolls away with it). Requires a scrolling surface
   * (`scrollable !== false`) — it lives in the same in-content block as the large
   * title. Built on Bloom's `Search`.
   */
  search?: {
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    onSubmit?: () => void;
  };

  /**
   * A segmented control row UNDER the title (Material secondary row) for view
   * switching. Requires a scrolling surface (lives in the large-title zone).
   * Built on Bloom's `SegmentedControl` (`type="tabs"`).
   */
  segments?: {
    items: Array<{ key: string; label: string }>;
    value: string;
    onChange: (key: string) => void;
  };

  /**
   * Over a banner / dark media canvas, `'onImage'` strengthens the gradient
   * scrim and forces light-content title + default icon buttons so the chrome
   * stays legible over the media. `'default'` (the default) is unchanged.
   */
  tone?: 'default' | 'onImage';

  /**
   * A thin step/progress indicator for wizards, rendered in the large-title zone
   * below any title/search/segments. `step` is 1-based; the bar fills
   * `step / total`.
   */
  progress?: {
    step: number;
    total: number;
  };
}

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
   * Turns on the Dialog's OWN navigation header (see {@link DialogHeaderConfig}).
   * When present the Dialog renders a sticky gradient nav bar + a large
   * collapsing title over its own scroll content, and its content is inset below
   * the bar — a DISTINCT mode from the declarative
   * `title`/`description`/`actions` centered heading (a confirm/alert dialog
   * passes NO `header` and is unchanged). Screens render no header of their own;
   * the title/slots come from this config, refined at runtime by a mounted
   * screen's `useDialogHeader` contribution.
   */
  header?: DialogHeaderConfig;
  /**
   * Open-INTENT seed for a freshly-mounted placement branch, distinct from the
   * controlled `open` prop. It ONLY seeds a branch's initial visible state on
   * mount — it never switches the dialog into controlled close semantics, so
   * the imperative `control.close()` still owns the exit animation and fires
   * `onClose` post-exit (no synchronous-`onClose` entry leak). Set by the
   * surface stack so a responsive `Dialog` that swaps its inner component across
   * a breakpoint (centered card ↔ bottom sheet on resize) re-mounts the new
   * branch ALREADY OPEN instead of blank. Ignored when the controlled `open`
   * prop is provided (that path seeds itself).
   */
  startOpen?: boolean;
  /**
   * Whether the dialog wraps its content in an internal scroll container.
   * Defaults to `true`. Set `false` when the content owns its own scrolling
   * primitive (a `FlatList` / `SectionList` / any VirtualizedList, or its own
   * `ScrollView`): the surface then renders children WITHOUT a ScrollView wrap —
   * a bounded, overflow-clipped card on the centered/side placements and a
   * non-scrollable `BottomSheet` body on the bottom placement — so the child
   * gets a bounded height and owns its scroll, and no "VirtualizedList inside a
   * plain ScrollView" warning is emitted.
   */
  scrollable?: boolean;
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
   * Whether the panel MORPHS across an in-place content swap. Defaults to
   * `true`.
   *
   * When the content inside an OPEN dialog is replaced (a nav-within drill-in,
   * as opposed to presenting a new surface on top), the panel animates from the
   * outgoing content's size to the incoming one's while the incoming content
   * fades in, instead of hard-cutting. The swap is signalled by the content
   * itself through `useDialogFrame` — a dialog whose content never declares a
   * frame is unaffected either way.
   *
   * The centered card morphs its height (about its centre) and its `maxWidth`;
   * the bottom sheet morphs its height from its anchored edge; side sheets have
   * fixed geometry and never morph. Morphing also requires the Dialog to own the
   * scroll container: a `scrollable={false}` surface owns its own size, so its
   * content only cross-fades.
   *
   * Set `false` for content that must never be resized into — e.g. a full-bleed
   * picker that always fills the surface.
   */
  morph?: boolean;
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
}>;

/**
 * Web-only options. Native uses bloom's `BottomSheet` underneath which has
 * its own positioning model.
 */
export type DialogWebOptions = {
  alignCenter?: boolean;
};
