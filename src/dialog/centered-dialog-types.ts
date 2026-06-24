import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

/**
 * @deprecated Use `<Dialog placement="center">` instead. `CenteredDialog` is
 * superseded by the centered placement of the canonical `<Dialog>` and is
 * slated for removal in a future major.
 *
 * Props for the declarative `<CenteredDialog>` primitive.
 *
 * This is the simple, controlled centered-modal surface — distinct from the
 * imperative `useDialogControl()` + `<Dialog control={…}>` API in the same
 * module. Reach for `<CenteredDialog>` when you already own the open/closed
 * boolean (a `useState`, a query flag, a route param) and just want Bloom to
 * render the dimmed backdrop + a snug, theme-styled centered card.
 *
 * All spacing/colour/radius come from Bloom theme tokens — the card reads
 * compact out of the box (`compact` defaults to `true`).
 */
export type CenteredDialogProps = {
  /** Whether the dialog is mounted + visible. */
  visible: boolean;
  /**
   * Close request — fired on backdrop tap (when `dismissible`), the close
   * button, the hardware back button (Android), and `Escape` (web). The
   * caller owns the visible state, so it must flip `visible` to `false` here.
   */
  onClose: () => void;
  /**
   * Optional header title. When set (or when `showClose` is `true`) Bloom
   * renders a tight header row above the content.
   */
  title?: string;
  /**
   * Tap-outside / back-button / Escape dismisses the dialog. Defaults to
   * `true`. Set `false` for blocking flows (e.g. a destructive confirm that
   * must be answered via an explicit action).
   */
  dismissible?: boolean;
  /** Max card width in px. Defaults to {@link DEFAULT_MAX_WIDTH} (440). */
  maxWidth?: number;
  /**
   * Tight, snug spacing (the Bloom default). Set `false` for a roomier card
   * with larger padding and header/footer gaps. Defaults to `true`.
   */
  compact?: boolean;
  /**
   * Render a close (✕) icon button in the header. Defaults to `true` when a
   * `title` is provided, otherwise `false` (a chromeless card owns its own
   * dismissal affordances).
   */
  showClose?: boolean;
  /** Card body. Scrolls within the height cap when it overflows. */
  children?: ReactNode;
  /**
   * Optional footer slot for actions (e.g. a Bloom `<Button>` row). Rendered
   * below the scrollable body with a hairline separator.
   */
  footer?: ReactNode;
  /**
   * Accessibility label for the dialog surface. Falls back to `title` when
   * omitted.
   */
  accessibilityLabel?: string;
  /** Accessibility label for the header close (✕) button. */
  closeAccessibilityLabel?: string;
  /** Accessibility label for the dimmed backdrop's tap-to-dismiss affordance. */
  backdropAccessibilityLabel?: string;
  /** Style overrides merged onto the centered card container. */
  cardStyle?: StyleProp<ViewStyle>;
  /** Style overrides merged onto the scrollable content container. */
  contentStyle?: StyleProp<ViewStyle>;
  testID?: string;
};
