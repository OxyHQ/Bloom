/**
 * The menu ROW itself, and the pieces of its shape that both the row set and
 * BOTH sub-menu implementations need.
 *
 * `menu-rows.tsx` is universal; `menu-sub-inline.tsx` and `menu-sub-flyout.tsx`
 * are the native and web halves of the sub trio and cannot import it (it imports
 * them). This module is what they share instead of each re-deriving a row's
 * inset, its type or its `inset` gutter — a sub-trigger that disagreed with the
 * rows above it by two pixels is exactly the drift this prevents.
 *
 * ── WHY THIS IS NOT `item/Item` ANY MORE ─────────────────────────────────────
 *
 * Every menu row used to BE an `Item`, for the good reason that the disabled
 * treatment, the destructive colour and the ARIA state then lived in one place.
 * That is incompatible with expressing a row's shape as classes: `Item` writes
 * its padding, gap, radius, minimum height and background into an inline
 * `style`, and on web an inline style outranks a class whatever the array order
 * — so every geometry class a menu row (or a CALLER) passed would be silently
 * discarded. Conditioning `Item`'s own defaults on the presence of a `className`
 * would push the same trap onto its several dozen other callers.
 *
 * So the row is its own one-node pressable here, and the three things `Item` was
 * carrying are each two lines below. `Item` is untouched and still serves every
 * other row in the library.
 *
 * ── ONE NODE, NOT TWO ────────────────────────────────────────────────────────
 *
 * `Item` renders a `Pressable` wrapping a `View`: the pressable holds the
 * interaction and the view holds the geometry. A class landing on the pressable
 * would then style a box that hugs nothing. `button/Button.tsx` collapsed the
 * same two nodes for the same reason — layout and visuals are one box in the
 * DOM, so a layout class and a visual class cannot land in different places.
 */
import React from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';

import {
  StyledPressable,
  StyledText,
  StyledView,
  type WebAriaProps,
} from '../styles/styled-primitives';
import { useInteractionState } from '../hooks/use-interaction-state';
import {
  ROW_CHEVRON_CLASS,
  ROW_CLASS,
  ROW_DISABLED_CLASS,
  ROW_ENABLED_CLASS,
  ROW_GUTTER_CLASS,
  ROW_GUTTER_END_CLASS,
  ROW_HIGHLIGHT_CLASS,
  ROW_INSET_CLASS,
  ROW_LEADING_CLASS,
  ROW_TEXT_CLASS,
  ROW_TEXT_DESTRUCTIVE_CLASS,
} from './constants';

/**
 * Join class strings, dropping the empty ones.
 *
 * Deliberately a CONCATENATION and never a substitution: a caller's `className`
 * is appended to the row's own, so a single layout utility cannot strip the
 * chrome (Bloom AGENTS.md, "Never let a component's own default `className`
 * compete with the caller's"). What the caller then gets is Tailwind's ordinary
 * cascade — two utilities for one property are resolved by the order Tailwind
 * emits them in, not by the order of the attribute — which is the same contract
 * every shadcn consumer already works under, and the `style` prop is still there
 * as the unambiguous override.
 */
export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}

/**
 * A string child becomes the row's LABEL so the row colours it (destructive,
 * disabled); anything else is rendered verbatim, which is shadcn's own
 * `<Icon /><Text>…</Text>` composition.
 */
export function splitChildren(children: React.ReactNode): {
  title?: string;
  body?: React.ReactNode;
} {
  return typeof children === 'string' ? { title: children } : { body: children };
}

/**
 * Which ARIA role the row renders, and therefore which state it announces.
 *
 * `menuitem` carries no state of its own (a sub-trigger's `expanded` is a
 * separate prop); `checkbox` and `radio` both carry a CHECKED one, which is what
 * `aria-checked` spells. Spelling it `aria-*` is what makes it reach both
 * platforms: react-native-web reads only `aria-*` and React Native folds
 * `aria-checked` back into `accessibilityState`, so one prop covers both.
 */
export type MenuRowRole = 'menuitem' | 'checkbox' | 'radio';

export interface MenuRowShellProps {
  role: MenuRowRole;
  /** `aria-checked`, for the two roles that have a checked state. */
  checked?: boolean;
  /** `aria-expanded`, for a sub-trigger. */
  expanded?: boolean;
  /**
   * `aria-haspopup` — what this row OPENS, for the rows that open something.
   *
   * The companion to `expanded` and not a duplicate of it: `aria-expanded`
   * announces that the thing is open or shut, `aria-haspopup` announces that
   * there is a thing at all and what kind. A sub-trigger with only the first
   * says "collapsed" without ever saying "submenu", so a screen-reader user
   * cannot tell it from an ordinary row that happens to toggle something.
   *
   * Deliberately NOT derived from `expanded`: an ordinary row must not carry it,
   * and the two are separate claims.
   */
  hasPopup?: WebAriaProps['aria-haspopup'];
  disabled: boolean;
  destructive?: boolean;
  /** Indent to line up with the rows that carry an indicator. */
  inset?: boolean;
  /** This row carries an out-of-flow indicator at the named edge. */
  gutter?: 'leading' | 'trailing';
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  /** A plain-string child, rendered as the row's own label. */
  title?: string;
  onPress: () => void;
  accessibilityLabel?: string;
  className?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  children?: React.ReactNode;
}

/**
 * One menu row.
 *
 * The highlight rides component state rather than the CSS `:hover` pseudo-class,
 * which is both what the target does (Radix's `data-[highlighted]` is a JS-driven
 * roving highlight, not `:hover`) and the only mechanism that behaves the same on
 * a platform with no pointer at all.
 */
export function MenuRowShell({
  role,
  checked,
  expanded,
  hasPopup,
  disabled,
  destructive = false,
  inset = false,
  gutter,
  leading,
  trailing,
  title,
  onPress,
  accessibilityLabel,
  className,
  style,
  testID,
  children,
}: MenuRowShellProps) {
  const { state: hovered, onIn: onHoverIn, onOut: onHoverOut } = useInteractionState();
  const { state: pressed, onIn: onPressIn, onOut: onPressOut } = useInteractionState();
  const highlighted = (hovered || pressed) && !disabled;

  const rowClass = cx(
    ROW_CLASS,
    disabled ? ROW_DISABLED_CLASS : ROW_ENABLED_CLASS,
    gutter === 'leading'
      ? ROW_GUTTER_CLASS
      : gutter === 'trailing'
        ? ROW_GUTTER_END_CLASS
        : inset
          ? ROW_INSET_CLASS
          : false,
    highlighted && ROW_HIGHLIGHT_CLASS,
    className,
  );

  return (
    <StyledPressable
      role={role}
      // `radio` and `checkbox` are roles BOTH platforms have, so they travel on
      // `accessibilityRole` as well. `menuitem` has no React Native counterpart,
      // so the row announces itself as a button there — which is what `Item` did.
      accessibilityRole={role === 'menuitem' ? 'button' : role}
      accessibilityLabel={accessibilityLabel ?? title}
      // One spelling, both platforms: react-native-web reads only `aria-*` and
      // React Native folds these two back into `accessibilityState`. The disabled
      // half travels on the `disabled` prop, which both platforms map.
      {...(checked == null ? {} : { 'aria-checked': checked })}
      {...(expanded == null ? {} : { 'aria-expanded': expanded })}
      {...(hasPopup == null ? {} : { 'aria-haspopup': hasPopup })}
      disabled={disabled}
      onPress={disabled ? undefined : onPress}
      onPressIn={disabled ? undefined : onPressIn}
      onPressOut={disabled ? undefined : onPressOut}
      // React Native types these on `Pressable` and only a platform with a real
      // pointer ever calls them, so there is no `Platform.OS` branch to write and
      // a touch never flashes a hover state on its way to a press.
      onHoverIn={disabled ? undefined : onHoverIn}
      onHoverOut={disabled ? undefined : onHoverOut}
      className={rowClass}
      style={style}
      testID={testID}>
      {leading != null ? (
        <StyledView className={ROW_LEADING_CLASS}>{leading}</StyledView>
      ) : null}
      {title != null ? (
        <StyledText
          numberOfLines={1}
          className={destructive ? ROW_TEXT_DESTRUCTIVE_CLASS : ROW_TEXT_CLASS}>
          {title}
        </StyledText>
      ) : (
        children
      )}
      {/* No wrapper: the shortcut's own `ms-auto` and the chevron's have to act
          on a direct flex child of the row, and a slot view would absorb them. */}
      {trailing}
    </StyledPressable>
  );
}

/**
 * The sub-trigger's chevron slot — `size-4 shrink-0 ms-auto`. A component rather
 * than a class string because both sub-menu forks render it and only the glyph
 * differs.
 */
export function MenuRowChevron({ children }: { children: React.ReactNode }) {
  return <StyledView className={ROW_CHEVRON_CLASS}>{children}</StyledView>;
}

/**
 * `justify-between` — what a sub-trigger adds to a row, so its chevron is pushed
 * to the far edge even when the label is short. The target spells the same
 * intent twice (`justify-between` on the row AND `ms-auto` on the chevron); both
 * are kept, because the first is what native's Yoga acts on and the second is
 * what survives a caller replacing the row's justification.
 */
export const SUB_TRIGGER_CLASS = 'justify-between';
