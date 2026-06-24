import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

/** Edge a wide-screen side-sheet anchors to. */
export type ResponsiveSheetSide = 'left' | 'right';

/**
 * Inset (px) of the wide-screen side-sheet from its container edges. Lets a
 * host place the sheet "inside its own shell" — e.g. offset from the top by a
 * header, or from the left by a nav rail — with margins on every side.
 */
export interface ResponsiveSheetInset {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}

/**
 * @deprecated Use `<Dialog placement={{ base: 'bottom', md: 'left' }}>` from
 * `@oxyhq/bloom/dialog` instead. `ResponsiveSheet` is now a thin wrapper over
 * `<Dialog>` retained for the migration window.
 *
 * A responsive overlay sheet: an anchored side-sheet on wide screens and a
 * bottom-sheet (with drag handle) on small screens, switching by viewport
 * width. It is a plain controlled component — the host drives `open`/`onClose`
 * from its own state.
 */
export interface ResponsiveSheetProps {
  /** Whether the sheet is open. Controlled by the host. */
  open: boolean;
  /** Fired when the sheet requests to close (backdrop tap, Escape on web). */
  onClose: () => void;
  /** Anchor edge on wide screens. Defaults to `'left'`. */
  side?: ResponsiveSheetSide;
  /** Viewport width (px) below which the sheet renders as a bottom-sheet. Defaults to `768`. */
  breakpoint?: number;
  /** Side-sheet width (px) on wide screens. Capped to fit. Defaults to `460`. */
  width?: number;
  /** Bottom-sheet max height as a fraction of the viewport height. Defaults to `0.9`. */
  maxHeightRatio?: number;
  /** Side-sheet inset (px) from the container edges. Defaults to `0` on all sides. */
  inset?: ResponsiveSheetInset;
  /** Whether to render the drag handle in bottom-sheet mode. Defaults to `true`. */
  showHandle?: boolean;
  /** Whether tapping the backdrop closes the sheet. Defaults to `true`. */
  dismissOnBackdrop?: boolean;
  /** Style for the panel surface (e.g. brand color). Composed after defaults. */
  panelStyle?: StyleProp<ViewStyle>;
  /** NativeWind classes for the panel surface. */
  panelClassName?: string;
  /** Style for the root overlay (theme-var scope, rail offset, etc.). */
  containerStyle?: StyleProp<ViewStyle>;
  /** NativeWind classes for the root overlay (e.g. `"md:left-[4.75rem]"`). */
  containerClassName?: string;
  /** Accessibility label for the sheet panel and the backdrop dismiss button. */
  label?: string;
  /** Sheet content. */
  children: ReactNode;
}
