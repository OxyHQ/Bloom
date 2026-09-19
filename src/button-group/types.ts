import type { GestureResponderEvent, StyleProp, ViewStyle } from 'react-native';

import type { ControlMaterial } from '../control-surface/types';
import type { ButtonIconComponent } from '../button/types';
import type { WebAriaProps } from '../styles/styled-primitives';

/** The two group sizes: 34px (`medium`) and 30px (`small`) items. */
export type ButtonGroupSize = 'medium' | 'small';

export interface ButtonGroupProps {
  /**
   * The material the group paints: `solid` (an opaque bordered pill, Bloom's
   * default chrome) or `glass` (one translucent island the items sit flush on).
   *
   * Omitted, it is INHERITED from the nearest `ControlSurface` — which is what a
   * `PageHeader`'s action slot mounts — and falls back to `solid`. So a group in
   * a floating header needs no variant written on it, and the same group in a
   * card is solid without one either. Precedence and its limits:
   * `docs/composition.mdx`.
   */
  variant?: ControlMaterial;
  /**
   * Size for every item that does not set its own. Inherited from the nearest
   * `ControlSurface` when omitted, then `medium`.
   */
  size?: ButtonGroupSize;
  /**
   * Whether to draw the 1px hairlines BETWEEN items.
   *
   * Defaults to `true` for `solid` and `false` for `glass`. A divider is how a
   * solid pill says "these are separate controls, fused"; on a translucent
   * island the press highlight already says it, and a hairline over a moving
   * backdrop reads as an artifact of the material.
   */
  dividers?: boolean;
  /** `ButtonGroupItem` children. */
  children: React.ReactNode;
  /** Names the group. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface ButtonGroupItemProps {
  /**
   * Press handler. Receives the event, so a handler composed onto this item by
   * an anchored family's `asChild` trigger can `preventDefault()` it — see
   * `floating/TriggerSlot.tsx`.
   */
  onPress?: (event: GestureResponderEvent) => void;
  /** Label. Ignored when `iconOnly`. */
  children?: React.ReactNode;
  /** Overrides the group's size. */
  size?: ButtonGroupSize;
  /** Overrides the group's material. Rarely needed; the group owns it. */
  variant?: ControlMaterial;
  /** Highlights the item like its hover state and announces it as pressed. */
  selected?: boolean;
  disabled?: boolean;
  /** Square item showing only `leadingIcon` — name it with `accessibilityLabel`. */
  iconOnly?: boolean;
  /** Icon component before the label, sized and coloured by the item. */
  leadingIcon?: ButtonIconComponent;
  /** Icon component after the label. */
  trailingIcon?: ButtonIconComponent;
  accessibilityLabel?: string;

  // ── The trigger contract ────────────────────────────────────────────────
  //
  // Declared, not spread. An anchored family's `asChild` trigger merges
  // `TriggerHandleProps` onto its child, and a child whose props are a closed
  // list DROPS the ones it does not declare — silently, since every one of them
  // is optional. Naming them is what makes `<PopoverTrigger asChild>` around an
  // item announce its own expanded state instead of looking like a plain
  // button. Gate: `button-group-trigger.test.tsx`.

  /** Long-press handler, composed by a `ContextMenu` trigger. */
  onLongPress?: (event: GestureResponderEvent) => void;
  /** Set by an anchored family: whether the surface this opens is showing. */
  'aria-expanded'?: boolean;
  /** Set by an anchored family: what kind of surface this opens. */
  'aria-haspopup'?: WebAriaProps['aria-haspopup'];
  /** Set by an anchored family. The item is a `button` either way. */
  accessibilityRole?: 'button';

  /**
   * Extra touch area around the item, in px.
   *
   * NOT set by the group, and deliberately not defaulted: items in a group are
   * adjacent, so slop on one overlaps its neighbour and the press lands on
   * whichever the platform happens to hit-test first. It is for an item that
   * stands ALONE in its own island — a page header's back capsule, where 4px on
   * each side turns the 36pt capsule into a 44pt target with nothing beside it
   * to steal from.
   */
  hitSlop?: number | { top?: number; bottom?: number; left?: number; right?: number };

  style?: StyleProp<ViewStyle>;
  testID?: string;
}
