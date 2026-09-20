import React, { Children, createContext, Fragment, isValidElement, memo, useContext, useMemo } from 'react';
import { Platform, Pressable, View, type TextStyle } from 'react-native';

import { useInheritedControl } from '../control-surface';
import { GlassIsland } from '../glass';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography/Typography';
import { useInteractionState } from '../hooks/use-interaction-state';
import { resolveSurfaceLevel } from '../styles/surface-levels';
import { NOT_DISABLED, interactiveWebCss, useInteractiveWebCss } from '../styles/interactive-web-css';
import { withAlpha } from '../theme/color-utils';
import type { WebCssStyle } from '../styles/web-view-style';
import {
  BUTTON_RADIUS,
  BUTTON_SHADOW,
  BUTTON_TRANSITION_MS,
  mixColor,
  resolveButtonRamps,
} from '../button/shared';
import type { ControlMaterial } from '../control-surface/types';
import type { Theme } from '../theme/types';
import type { ButtonGroupItemProps, ButtonGroupProps, ButtonGroupSize } from './types';

/**
 * A group of buttons the consumer has declared as ONE control.
 *
 * ── TWO MATERIALS, ONE GROUP ────────────────────────────────────────────────
 *
 * `solid` is the original: one bordered, shadowed container, items divided by
 * 1px hairlines, only the outer ends rounded, colours from the same
 * Bloom-derived ramps as `Button` (`button/shared.ts`).
 *
 * `glass` is the same group as a floating ISLAND — one translucent pane
 * (`glass/GlassIsland`) that the items sit FLUSH on. The group owns the
 * material and the items paint no fill of their own at rest; a second fill
 * under a translucent pane is the thing that makes a row of controls read as a
 * row of cards rather than as one island, and a second BLUR is not available at
 * all on Android.
 *
 * Neither is a decoration a caller has to ask for by name. The variant is
 * INHERITED from the nearest `ControlSurface`, so `<ButtonGroup>` inside a
 * floating `PageHeader` is glass and the same group inside a card is solid,
 * with no prop either way. An explicit `variant` still wins.
 *
 *              medium    small
 *   item h     34        30       (plus the container's 1px border = 36 / 32)
 *   padding-x  12        10
 *   gap        4         4
 *   icon       20        18
 *   text       body-medium (Inter 14/20 500)
 */

const GEOMETRY = {
  medium: { height: 34, paddingHorizontal: 12, iconSize: 20 },
  small: { height: 30, paddingHorizontal: 10, iconSize: 18 },
} as const satisfies Record<ButtonGroupSize, { height: number; paddingHorizontal: number; iconSize: number }>;

interface GroupPalette {
  groupBorder: string;
  divider: string;
  background: string;
  hover: string;
  active: string;
  disabledBackground: string;
  foreground: string;
  disabledForeground: string;
  ring: string;
}

function resolveGroupPalette(theme: Theme): GroupPalette {
  const { accent, neutral: n } = resolveButtonRamps(theme);
  return theme.isDark
    ? {
        groupBorder: mixColor(n[800], n[600], 0.6),
        divider: n[700],
        background: n[800],
        // `color-mix(neutral-700 60%, transparent)` over the group's own surface.
        hover: mixColor(n[800], n[700], 0.6),
        active: n[800],
        disabledBackground: n[800],
        foreground: theme.colors.text,
        disabledForeground: n[600],
        ring: accent[500],
      }
    : {
        groupBorder: n[200],
        divider: n[200],
        background: theme.colors.card,
        hover: n[100],
        active: n[200],
        disabledBackground: n[100],
        foreground: theme.colors.text,
        disabledForeground: n[400],
        ring: accent[500],
      };
}

/**
 * The items' paint on a GLASS island.
 *
 * Every state that is not "at rest" is an alpha of the theme's own `text` — an
 * ink wash, not a fill. That is the one recipe that works on a pane whose
 * composited colour Bloom cannot predict: a fixed neutral tuned against the
 * island's own fill goes invisible the moment a photograph behind it moves the
 * pane 40 levels, while a wash of the label's colour keeps the same relation to
 * the label at every composite.
 *
 * `transparent` at rest is load-bearing rather than tidy. It is what makes the
 * island ONE pane: give the items a fill and the group is a row of chips inside
 * a capsule, which is the shape this variant exists to stop.
 *
 * The disabled label is read off the island's own fill with `surfaceTextOn`
 * rather than picked from the ramp, because a ramp stop measured against the
 * page is not measured against this surface.
 */
function resolveGlassItemPalette(theme: Theme): GroupPalette {
  const { accent } = resolveButtonRamps(theme);
  const level = resolveSurfaceLevel(theme, 1);
  const ink = theme.colors.text;
  const wash = theme.isDark ? { hover: 0.12, active: 0.2 } : { hover: 0.08, active: 0.14 };
  return {
    // The island owns the box: the group draws neither border nor divider.
    groupBorder: 'transparent',
    divider: withAlpha(ink, theme.isDark ? 0.16 : 0.12),
    background: 'transparent',
    hover: withAlpha(ink, wash.hover),
    active: withAlpha(ink, wash.active),
    disabledBackground: 'transparent',
    foreground: ink,
    disabledForeground: level.textGraphical,
    ring: accent[500],
  };
}

// ---------------------------------------------------------------------------
//  Keyboard focus on web — an inset `ring-2`. Items are react-native-web
//  `Pressable`s, so the rules hang off a `dataSet` attribute (a class never
//  reaches the DOM; see `chip/Chip.tsx`). Hover and press are driven from state
//  so they paint identically on native; the sheet only carries the ring, and
//  undoes the shared recipe's disabled opacity dip, since a disabled item has
//  its own paint.
// ---------------------------------------------------------------------------

const STYLE_ID = 'bloom-button-group-web-css';
const SELECTOR = '[data-bloom-button-group-item]';

const BUTTON_GROUP_CSS = interactiveWebCss({
  selector: SELECTOR,
  varPrefix: 'bloom-button-group',
  base: `
    flex-direction: row;
    border: none;
  `,
  transition: `background-color ${BUTTON_TRANSITION_MS}ms ease, color ${BUTTON_TRANSITION_MS}ms ease`,
  hover: { declarations: 'cursor: pointer;' },
  outlineOffset: -2,
  extraRules: `${SELECTOR}:disabled,
${SELECTOR}[aria-disabled="true"] {
  opacity: 1;
  cursor: not-allowed;
}
${SELECTOR}${NOT_DISABLED}:focus-visible {
  position: relative;
  z-index: 1;
}`,
});

const IS_WEB = Platform.OS === 'web';

interface GroupContextValue {
  size: ButtonGroupSize;
  material: ControlMaterial;
  palette: GroupPalette;
}

const GroupContext = createContext<GroupContextValue | null>(null);

const ButtonGroupComponent: React.FC<ButtonGroupProps> = ({
  variant,
  size: sizeProp,
  dividers,
  children,
  accessibilityLabel,
  style,
  testID,
}) => {
  const theme = useTheme();
  useInteractiveWebCss(STYLE_ID, BUTTON_GROUP_CSS);
  const material = useInheritedControl('material', variant, 'solid');
  const size = useInheritedControl('density', sizeProp, 'medium');
  const palette = useMemo(
    () => (material === 'glass' ? resolveGlassItemPalette(theme) : resolveGroupPalette(theme)),
    [material, theme],
  );
  const context = useMemo<GroupContextValue>(
    () => ({ size, material, palette }),
    [size, material, palette],
  );
  const items = Children.toArray(children).filter(isValidElement);
  const showDividers = dividers ?? material === 'solid';

  const row = items.map((item, index) => (
    <Fragment key={item.key ?? index}>
      {/* `divide-x`: a hairline BETWEEN items, never at the ends. */}
      {showDividers && index > 0 ? (
        <View style={{ width: 1, backgroundColor: palette.divider }} />
      ) : null}
      {item}
    </Fragment>
  ));

  if (material === 'glass') {
    return (
      <GroupContext.Provider value={context}>
        {/*
          The island mounts its own `ControlSurface` with `material: 'glass'`,
          so an item rendered through a trigger's `asChild` — outside this
          group's own children, in a caller's tree — still paints flush.
        */}
        <GlassIsland
          role="group"
          accessibilityLabel={accessibilityLabel}
          style={style}
          testID={testID}
        >
          {row}
        </GlassIsland>
      </GroupContext.Provider>
    );
  }

  return (
    <GroupContext.Provider value={context}>
      <View
        role="group"
        accessibilityLabel={accessibilityLabel}
        testID={testID}
        style={[
          {
            flexDirection: 'row',
            alignItems: 'stretch',
            alignSelf: 'flex-start',
            borderWidth: 1,
            borderColor: palette.groupBorder,
            borderRadius: BUTTON_RADIUS,
            backgroundColor: palette.background,
            boxShadow: BUTTON_SHADOW[theme.isDark ? 'dark' : 'light'],
            overflow: 'hidden',
          },
          style,
        ]}
      >
        {row}
      </View>
    </GroupContext.Provider>
  );
};

const ButtonGroupItemComponent: React.FC<ButtonGroupItemProps> = ({
  onPress,
  onLongPress,
  children,
  size: sizeProp,
  variant,
  selected,
  disabled = false,
  iconOnly = false,
  leadingIcon: LeadingIcon,
  trailingIcon: TrailingIcon,
  accessibilityLabel,
  accessibilityRole = 'button',
  hitSlop,
  'aria-expanded': ariaExpanded,
  'aria-haspopup': ariaHasPopup,
  style,
  testID,
}) => {
  const theme = useTheme();
  const group = useContext(GroupContext);
  // An item can be rendered OUTSIDE its group's children — an anchored family's
  // `asChild` trigger clones it into the caller's tree — so the material falls
  // back to the inherited `ControlSurface` (which `GlassIsland` mounts) before
  // it falls back to `solid`.
  const inheritedMaterial = useInheritedControl('material', undefined, 'solid');
  const inheritedDensity = useInheritedControl('density', undefined, 'medium');
  const material = variant ?? group?.material ?? inheritedMaterial;
  const palette = useMemo(
    () =>
      group && group.material === material
        ? group.palette
        : material === 'glass'
          ? resolveGlassItemPalette(theme)
          : resolveGroupPalette(theme),
    [group, material, theme],
  );
  const size = sizeProp ?? group?.size ?? inheritedDensity;
  const geometry = GEOMETRY[size];
  const { state: hovered, onIn: onHoverIn, onOut: onHoverOut } = useInteractionState();
  const { state: pressed, onIn: onPressIn, onOut: onPressOut } = useInteractionState();

  const background = disabled
    ? palette.disabledBackground
    : pressed
      ? palette.active
      : hovered || selected === true
        ? palette.hover
        : palette.background;
  const foreground = disabled ? palette.disabledForeground : palette.foreground;

  const containerStyle: WebCssStyle = {
    height: geometry.height,
    minWidth: iconOnly ? geometry.height : undefined,
    width: iconOnly ? geometry.height : undefined,
    paddingHorizontal: iconOnly ? 0 : geometry.paddingHorizontal,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: background,
    // On glass the island does not clip (a clipping node loses its iOS drop
    // shadow), so the item rounds its OWN highlight. On solid the container
    // clips and a square item is what makes the fused ends read as one pill.
    borderRadius: material === 'glass' ? BUTTON_RADIUS : undefined,
    '--bloom-button-group-ring': palette.ring,
  };

  const labelStyle: TextStyle = { color: foreground };

  return (
    <Pressable
      {...(IS_WEB ? ({ dataSet: { bloomButtonGroupItem: '' } } as Record<string, unknown>) : {})}
      style={[containerStyle, style]}
      onPress={disabled ? undefined : onPress}
      onLongPress={disabled ? undefined : onLongPress}
      onPressIn={disabled ? undefined : onPressIn}
      onPressOut={disabled ? undefined : onPressOut}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      hitSlop={hitSlop}
      disabled={disabled}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      // Both spellings: react-native-web reads only `aria-pressed`, React Native
      // has no `aria-pressed` and reads `accessibilityState`.
      //
      // `selected` is UNDEFINED, not false, on an item that is not a toggle —
      // an action in a toolbar (attach, link) is pressed and done, and
      // `aria-pressed="false"` on it makes a screen reader announce "not
      // pressed", which says it has a state it does not have. Only an item
      // whose caller passed the prop carries the attribute.
      accessibilityState={{ disabled, selected, expanded: ariaExpanded }}
      aria-pressed={selected}
      aria-expanded={ariaExpanded}
      aria-haspopup={ariaHasPopup}
      testID={testID}
    >
      {LeadingIcon ? (
        <LeadingIcon width={geometry.iconSize} height={geometry.iconSize} fill={foreground} />
      ) : null}
      {!iconOnly && children != null ? (
        typeof children === 'string' || typeof children === 'number' ? (
          <Text variant="body-medium" numberOfLines={1} style={labelStyle}>
            {children}
          </Text>
        ) : (
          children
        )
      ) : null}
      {!iconOnly && TrailingIcon ? (
        <TrailingIcon width={geometry.iconSize} height={geometry.iconSize} fill={foreground} />
      ) : null}
    </Pressable>
  );
};

export const ButtonGroup = memo(ButtonGroupComponent);
ButtonGroup.displayName = 'ButtonGroup';

export const ButtonGroupItem = memo(ButtonGroupItemComponent);
ButtonGroupItem.displayName = 'ButtonGroupItem';
