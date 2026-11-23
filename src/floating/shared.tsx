import { useMenuDensity } from './use-menu-density';
import { useMenuRowAlignment } from './menu-row-alignment';
import { KEYBOARD_ACTIVATION, type PopupSubmenu, usePopupNavigationRow } from './popup-navigation';
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
 * A menu row's geometry is its own (the density's inset, height and gap, the
 * checkbox gutter), and bending `Item`'s defaults to it would push the menu's
 * shape onto its several dozen other callers.
 *
 * So the row is its own one-node pressable here, and the three things `Item` was
 * carrying are each two lines below. `Item` is untouched and still serves every
 * other row in the library.
 *
 * ── ONE NODE, NOT TWO ────────────────────────────────────────────────────────
 *
 * `Item` renders a `Pressable` wrapping a `View`: the pressable holds the
 * interaction and the view holds the geometry. A style landing on the pressable
 * would then style a box that hugs nothing. `button/Button.tsx` collapsed the
 * same two nodes for the same reason — layout and visuals are one box in the
 * DOM, so a layout style and a visual style cannot land in different places.
 */
import type React from 'react';
import { type ComponentRef, createContext, useContext, useEffect, useRef } from 'react';
import {
  AccessibilityInfo,
  Platform,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { StyledPressable, type WebAriaProps } from '../styles/styled-primitives';
import { useInteractionState } from '../hooks/use-interaction-state';
import { FOCUS_SETTLE_MS } from '../hooks/use-accessibility-focus';
import {
  ROW_DISABLED_DIM_STYLE,
  ROW_GUTTER_END_STYLE,
  ROW_GUTTER_STYLE,
  ROW_INSET_STYLE,
  ROW_LEADING_STYLE,
  ROW_STYLE,
  ROW_TEXT_STYLE,
  ROW_TRAILING_STYLE,
} from './constants';
import { useMenuPalette } from './menu-palette';
import { MENU_FONT_FAMILY } from './menu-type';
import type { WebCssStyle } from '../styles/web-view-style';
import type { BloomIconComponent } from '../icons/icon-component';

/**
 * The row highlight's `transition-colors` (150ms). Web only: on
 * native a style transition is not something a `Pressable` animates, and the
 * highlight is a press flash there anyway.
 */
const ROW_TRANSITION: WebCssStyle | null =
  Platform.OS === 'web'
    ? {
        transitionProperty: 'background-color',
        transitionDuration: '150ms',
        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
      }
    : null;

/**
 * The ink of what a row draws on itself while the accent highlights it (a
 * desktop platform's `MenuPalette.rowActive`): the accent's foreground, for its
 * shortcut, check, radio dot and chevron. Null while the row is not highlighted
 * with the accent, where each part keeps its own colour.
 */
const MenuRowInkContext = createContext<string | null>(null);
MenuRowInkContext.displayName = 'BloomMenuRowInkContext';

export function useMenuRowInk(): string | null {
  return useContext(MenuRowInkContext);
}

/**
 * A glyph a row draws itself (the check, the sub-menu chevron): the density's
 * glyph size, in the row's ink while the accent highlights it, else `fill`.
 */
export function MenuRowGlyph({ Icon, fill }: { Icon: BloomIconComponent; fill: string }) {
  const ink = useMenuRowInk();
  const density = useMenuDensity();
  return <Icon width={density.glyphSize} height={density.glyphSize} fill={ink ?? fill} />;
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
export type MenuRowRole = 'menuitem' | 'checkbox' | 'radio' | 'button' | 'option';

export interface MenuRowShellProps {
  nativeID?: string;
  onLayout?: import('react-native').PressableProps['onLayout'];
  /** Suggestions keep DOM focus in their typing field and own the highlight. */
  controlledHighlight?: boolean;
  onPointerMove?: import('react-native').PressableProps['onPointerMove'];
  onHoverChange?: () => void;
  href?: string;
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
  /**
   * Paint the highlight at rest — the `selected` row (`MENU_ITEM_ACTIVE`),
   * the current choice of a radio or checkbox row.
   */
  selected?: boolean;
  current?: boolean;
  /** Indent to line up with the rows that carry an indicator. */
  inset?: boolean;
  /** This row carries an out-of-flow indicator at the named edge. */
  gutter?: 'leading' | 'trailing';
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  /** A plain-string child, rendered as the row's own label. */
  title?: string;
  /**
   * The check or radio mark, drawn in the row's own gutter at `gutter`'s edge
   * so it takes the row's ink while highlighted. Only a desktop platform's
   * rows draw it here (`menu-rows.tsx`); elsewhere the mark is laid over the
   * row from outside, as it always was.
   */
  indicator?: React.ReactNode;
  onPress: (event: GestureResponderEvent) => void;
  /** The submenu this row opens, for a platform popup's keyboard (`popup-navigation.tsx`). */
  submenu?: PopupSubmenu;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  children?: React.ReactNode;
}

function safeMatches(
  target: { matches?: (selector: string) => boolean },
  selector: string,
): boolean {
  try {
    return target.matches?.(selector) ?? true;
  } catch {
    // An engine without `:focus-visible` (jsdom) — treat every focus as visible.
    return true;
  }
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
  nativeID,
  onLayout,
  controlledHighlight = false,
  onPointerMove,
  onHoverChange,
  href,
  role,
  checked,
  expanded,
  hasPopup,
  disabled,
  destructive = false,
  selected = false,
  current = false,
  inset = false,
  gutter,
  leading,
  trailing,
  title,
  indicator,
  onPress,
  submenu,
  accessibilityLabel,
  style,
  testID,
  children,
}: MenuRowShellProps) {
  const column = useMenuRowAlignment({ gutter: gutter === 'leading', leading: leading != null });
  const insetToColumn = inset || (column.gutter && gutter !== 'leading');
  const leadingSpacer = column.leading && leading == null;
  const { state: hovered, onIn: onHoverIn, onOut: onHoverOut } = useInteractionState();
  const { state: pressed, onIn: onPressIn, onOut: onPressOut } = useInteractionState();
  const { state: focused, onIn: onFocus, onOut: onBlur } = useInteractionState();
  const palette = useMenuPalette();
  const density = useMenuDensity();
  // In a platform popup the keyboard moves an active row (`popup-navigation`);
  // Enter activates it as a press would.
  const navigation = usePopupNavigationRow({
    disabled: !!disabled,
    label: accessibilityLabel ?? (typeof title === 'string' ? title : undefined),
    activate: () => onPress?.(KEYBOARD_ACTIVATION),
    submenu,
  });
  // The keyboard made this row the active one in a platform popup: the screen reader's focus moves
  // to it, as VoiceOver's follows a menu's highlight (a hover never moves it). The web's rows take
  // real focus instead (`menu-keyboard.ts`).
  const rowRef = useRef<ComponentRef<typeof View> | null>(null);
  useEffect(() => {
    if (!navigation.byKeys || Platform.OS === 'web') return;
    // After the accessibility service has the row: a popup opened from the keys is committed in
    // this same frame (`use-accessibility-focus.ts`).
    const timer = setTimeout(() => {
      if (rowRef.current) AccessibilityInfo.sendAccessibilityEvent(rowRef.current, 'focus');
    }, FOCUS_SETTLE_MS);
    return () => clearTimeout(timer);
  }, [navigation.byKeys]);
  // `MENU_ITEM_INTERACTIVE` + `MENU_ITEM_ACTIVE`: hover, keyboard focus
  // and the current selection all paint the same `dropdown-item-hover-background`.
  const highlighted =
    !disabled &&
    ((!controlledHighlight && (hovered || focused || navigation.active)) ||
      pressed ||
      selected ||
      current);

  // A desktop platform highlights with the accent, and everything on the row takes its ink.
  const active = highlighted ? palette.rowActive : null;
  const labelColor = disabled
    ? palette.textDisabled
    : active
      ? active.text
      : destructive
        ? palette.destructive
        : palette.text;
  // A desktop's row geometry, over the density's.
  const desktopGeometry = density.desktop
    ? {
        minHeight: density.height,
        paddingTop: (density.height - (density.rowType.lineHeight ?? 16)) / 2,
        paddingBottom: (density.height - (density.rowType.lineHeight ?? 16)) / 2,
        paddingLeft: 8,
        paddingRight: 8,
      }
    : null;

  return (
    <StyledPressable
      ref={navigation.inPopup ? rowRef : undefined}
      nativeID={nativeID}
      onLayout={onLayout}
      tabIndex={role === 'option' ? -1 : undefined}
      onPointerMove={disabled ? undefined : onPointerMove}
      {...(role === 'option' ? { 'aria-selected': selected } : {})}
      {...(Platform.OS === 'web' && href != null && !disabled ? { href } : {})}
      role={
        Platform.OS === 'web' && (role === 'checkbox' || role === 'radio')
          ? `menuitem${role}`
          : role
      }
      // `radio` and `checkbox` are roles BOTH platforms have, so they travel on
      // `accessibilityRole` as well. `menuitem` has no React Native counterpart,
      // so the row announces itself as a button there — which is what `Item` did.
      accessibilityRole={
        href != null ? 'link' : role === 'menuitem' || role === 'option' ? 'button' : role
      }
      accessibilityLabel={accessibilityLabel ?? title}
      // One spelling, both platforms: react-native-web reads only `aria-*` and
      // React Native folds these two back into `accessibilityState`. The disabled
      // half travels on the `disabled` prop, which both platforms map.
      {...(checked == null ? {} : { 'aria-checked': checked })}
      {...(current ? { 'aria-current': 'page' as const } : {})}
      {...(expanded == null ? {} : { 'aria-expanded': expanded })}
      {...(hasPopup == null ? {} : { 'aria-haspopup': hasPopup })}
      disabled={disabled}
      onPress={disabled ? undefined : onPress}
      onPressIn={disabled ? undefined : onPressIn}
      onPressOut={disabled ? undefined : onPressOut}
      // React Native types these on `Pressable` and only a platform with a real
      // pointer ever calls them, so there is no `Platform.OS` branch to write and
      // a touch never flashes a hover state on its way to a press.
      onHoverIn={
        disabled
          ? undefined
          : () => {
              onHoverIn();
              navigation.hover();
              onHoverChange?.();
            }
      }
      onHoverOut={disabled ? undefined : onHoverOut}
      onFocus={
        disabled
          ? undefined
          : (event: { target?: unknown }) => {
              // `focus-visible` only, matching `focus-visible:bg-…`: a
              // mouse press also focuses the row, and a `keepOpen` row must not
              // stay painted after the pointer has left it.
              const target = event.target as { matches?: (selector: string) => boolean };
              if (typeof target?.matches === 'function' && !safeMatches(target, ':focus-visible')) {
                return;
              }
              onFocus();
            }
      }
      onBlur={onBlur}
      style={[
        ROW_STYLE,
        density.rowStyle,
        disabled ? ROW_CURSOR.disabled : density.desktop ? ROW_CURSOR.desktop : ROW_CURSOR.enabled,
        disabled && title == null ? ROW_DISABLED_DIM_STYLE : null,
        gutter === 'leading'
          ? ROW_GUTTER_STYLE
          : gutter === 'trailing'
            ? ROW_GUTTER_END_STYLE
            : insetToColumn
              ? ROW_INSET_STYLE
              : null,
        ROW_TRANSITION,
        {
          backgroundColor: highlighted ? (active?.fill ?? palette.rowHighlight) : 'transparent',
          ...desktopGeometry,
          ...(density.rowRadius != null ? { borderRadius: density.rowRadius } : null),
          // The arrow, not the hand (`ROW_CURSOR.desktop`): native spells it `auto`.
          ...(density.desktop && !disabled && Platform.OS !== 'web'
            ? { cursor: 'auto' as const }
            : null),
          ...(gutter === 'leading' || insetToColumn ? { paddingLeft: density.gutter } : null),
          ...(gutter === 'trailing' ? { paddingRight: density.gutter } : null),
          ...(density.touch ? { minHeight: 44 } : null),
          // The gap between the row's icon and its label, on every platform
          // ("QSearch": a native menu once drew its icons against their labels).
          columnGap: density.itemGap,
        },
        style,
      ]}
      testID={testID}
    >
      <MenuRowInkContext.Provider value={active?.text ?? null}>
        {indicator !== undefined ? (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              ...(gutter === 'trailing'
                ? { right: density.indicatorInset }
                : { left: density.indicatorInset }),
              width: density.indicatorSize,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {indicator}
          </View>
        ) : null}
        {leading != null || leadingSpacer ? (
          <View
            style={[
              ROW_LEADING_STYLE,
              { width: density.leadingSize, alignItems: 'center', justifyContent: 'center' },
            ]}
            {...(leadingSpacer ? { 'aria-hidden': true } : null)}
          >
            {leading}
          </View>
        ) : null}
        {title != null ? (
          <Text
            numberOfLines={1}
            // `text-body-medium`, in Inter (a desktop's body, `DESKTOP_TEXT_STYLES.body`).
            // A desktop's menu is as wide as its widest row, so its label counts at
            // its own width: it grows and shrinks without a zero basis, which made
            // a panel sized by its content cut every label at the width floor
            // (OxyOS's dock menu).
            style={
              density.desktop
                ? [
                    DESKTOP_ROW_TEXT_STYLE,
                    { ...density.rowType, ...MENU_FONT_FAMILY },
                    { color: labelColor },
                    DESKTOP_LABEL_FLEX,
                  ]
                : [
                    ROW_TEXT_STYLE,
                    { ...density.rowType, ...MENU_FONT_FAMILY },
                    { color: labelColor },
                  ]
            }
          >
            {title}
          </Text>
        ) : (
          children
        )}
        {/* No wrapper: the shortcut's own `ms-auto` and the chevron's have to act
          on a direct flex child of the row, and a slot view would absorb them. */}
        {trailing}
      </MenuRowInkContext.Provider>
    </StyledPressable>
  );
}

/** `ROW_TEXT_STYLE` less its grow: a desktop's label grows and shrinks from its own width. */
const DESKTOP_ROW_TEXT_STYLE = { minWidth: 0 } as const;
const DESKTOP_LABEL_FLEX = { flexGrow: 1, flexShrink: 1 } as const;

/**
 * The row's pointer, web only: the hand over an enabled row, a desktop
 * platform's arrow (its pointer stays the arrow over a menu, as over a button;
 * the hand is a link's alone), and `not-allowed` over a disabled one.
 */
export const ROW_CURSOR = StyleSheet.create(
  Platform.OS === 'web'
    ? {
        enabled: { cursor: 'pointer' },
        desktop: { cursor: 'default' as 'auto' },
        disabled: { cursor: 'not-allowed' as 'auto' },
      }
    : { enabled: {}, desktop: {}, disabled: {} },
);

/**
 * The sub-trigger's chevron slot, pushed to the trailing edge. A component
 * because both sub-menu forks render it and only the glyph differs.
 */
export function MenuRowChevron({ children }: { children: React.ReactNode }) {
  return <View style={ROW_TRAILING_STYLE}>{children}</View>;
}

/**
 * What a sub-trigger adds to a row, so its chevron is pushed to the far edge even
 * when the label is short. The intent is spelled twice (here AND the chevron's
 * own `marginInlineStart: 'auto'`); both are kept, because the first is what
 * native's Yoga acts on and the second is what survives a caller replacing the
 * row's justification.
 */
export const SUB_TRIGGER_STYLE = { justifyContent: 'space-between' } as const;
