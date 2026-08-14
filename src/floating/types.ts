import type { GestureResponderEvent, StyleProp, View, ViewStyle } from 'react-native';

/**
 * What a family's ROOT publishes to its own trigger and surface: the open
 * state, and the box the surface anchors to. Each of the four families owns its
 * OWN context object built on this shape — one shared context would make a
 * menu nested inside a popover drive the popover.
 */
export interface OverlayShellContextValue {
  open: boolean;
  setOpen: (next: boolean) => void;
  /** The trigger wrapper. Measured by the web forks, unused on native. */
  anchorRef: React.RefObject<View | null>;
}

/**
 * Which side of its anchor a floating surface PREFERS. It is a preference:
 * `overlay/dropdown-placement` flips to the other side when the named one does
 * not fit and clamps when neither does.
 */
export type FloatingSide = 'top' | 'bottom';

/**
 * How the surface lines up with its anchor horizontally — Radix/shadcn's
 * `align`, mapped straight onto `resolveDropdownPlacement`'s own axis.
 */
export type FloatingAlign = 'start' | 'center' | 'end';

/** A viewport-relative anchor box. A right-click point is a zero-area anchor. */
export interface FloatingAnchor {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/**
 * The positioning props every anchored Bloom surface takes, spelled the way
 * Radix/shadcn spells them so a call site ports across unchanged.
 */
export interface FloatingPositionProps {
  /** Preferred side of the anchor. Defaults to `'bottom'`. */
  side?: FloatingSide;
  /** Horizontal alignment against the anchor. Defaults per component. */
  align?: FloatingAlign;
  /** Gap between the anchor and the surface, on the `side` axis. */
  sideOffset?: number;
  /** Shift along the `align` axis, applied before the viewport clamp. */
  alignOffset?: number;
}

export interface FloatingPanelProps extends FloatingPositionProps {
  /** Rendered only while true — `OverlayRoot` takes its stack rank on mount. */
  open: boolean;
  /**
   * Viewport-relative box to anchor against, or `null` while it is still being
   * measured (the panel renders nothing until it has one).
   */
  anchor: FloatingAnchor | null;
  /** Dismiss on backdrop press and Escape. Defaults to `true`. */
  dismissible?: boolean;
  /** Called for a user-initiated dismissal (backdrop press or Escape). */
  onDismiss: () => void;
  /** Accessible name of the panel. */
  label?: string;
  /**
   * ARIA role of the panel itself. `'menu'` for the three menu families,
   * `'dialog'` for a popover.
   */
  role: 'menu' | 'dialog';
  /** Floor for the panel width. A menu passes its anchor's width. */
  minWidth?: number;
  maxWidth?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  children?: React.ReactNode;
}

/**
 * The props a trigger hands to whatever it renders — either Bloom's own
 * `Pressable`, or the caller's single child under `asChild`.
 *
 * `aria-expanded` is the one state prop here, and it is deliberately the only
 * one: React Native types exactly four boolean `aria-*` props (`busy`,
 * `checked`, `disabled`, `expanded`, `selected`) and folds them back into
 * `accessibilityState`, so it is the spelling that reaches BOTH platforms.
 * `aria-haspopup` is read by react-native-web but has no React Native type at
 * all, so setting it would need a cast on a prop native never sees — the
 * trigger states that it is expanded and leaves the popup kind to the surface's
 * own `role`.
 */
export interface TriggerHandleProps {
  onPress: (event: GestureResponderEvent) => void;
  onLongPress?: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityRole?: 'button';
  'aria-expanded'?: boolean;
}
