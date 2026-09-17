import React, { Children, createContext, Fragment, isValidElement, memo, useContext, useMemo } from 'react';
import { Platform, Pressable, View, type TextStyle } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { Text } from '../typography/Typography';
import { useInteractionState } from '../hooks/use-interaction-state';
import { NOT_DISABLED, interactiveWebCss, useInteractiveWebCss } from '../styles/interactive-web-css';
import type { WebCssStyle } from '../styles/web-view-style';
import {
  BUTTON_RADIUS,
  BUTTON_SHADOW,
  BUTTON_TRANSITION_MS,
  mixColor,
  resolveButtonRamps,
} from '../button/shared';
import type { Theme } from '../theme/types';
import type { ButtonGroupItemProps, ButtonGroupProps, ButtonGroupSize } from './types';

/**
 * A group of secondary-style buttons fused into one control — one bordered,
 * shadowed container, items divided by 1px hairlines, only the outer ends
 * rounded. Colours come from the same Bloom-derived ramps as `Button`
 * (`button/shared.ts`), and like `Button` the container is a full pill.
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

const GroupContext = createContext<{ size: ButtonGroupSize; palette: GroupPalette } | null>(null);

const ButtonGroupComponent: React.FC<ButtonGroupProps> = ({
  size = 'medium',
  children,
  accessibilityLabel,
  style,
  testID,
}) => {
  const theme = useTheme();
  useInteractiveWebCss(STYLE_ID, BUTTON_GROUP_CSS);
  const palette = useMemo(() => resolveGroupPalette(theme), [theme]);
  const context = useMemo(() => ({ size, palette }), [size, palette]);
  const items = Children.toArray(children).filter(isValidElement);

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
        {items.map((item, index) => (
          <Fragment key={item.key ?? index}>
            {/* `divide-x`: a hairline BETWEEN items, never at the ends. */}
            {index > 0 ? <View style={{ width: 1, backgroundColor: palette.divider }} /> : null}
            {item}
          </Fragment>
        ))}
      </View>
    </GroupContext.Provider>
  );
};

const ButtonGroupItemComponent: React.FC<ButtonGroupItemProps> = ({
  onPress,
  children,
  size: sizeProp,
  selected = false,
  disabled = false,
  iconOnly = false,
  leadingIcon: LeadingIcon,
  trailingIcon: TrailingIcon,
  accessibilityLabel,
  style,
  testID,
}) => {
  const theme = useTheme();
  const group = useContext(GroupContext);
  const palette = useMemo(() => group?.palette ?? resolveGroupPalette(theme), [group, theme]);
  const size = sizeProp ?? group?.size ?? 'medium';
  const geometry = GEOMETRY[size];
  const { state: hovered, onIn: onHoverIn, onOut: onHoverOut } = useInteractionState();
  const { state: pressed, onIn: onPressIn, onOut: onPressOut } = useInteractionState();

  const background = disabled
    ? palette.disabledBackground
    : pressed
      ? palette.active
      : hovered || selected
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
    '--bloom-button-group-ring': palette.ring,
  };

  const labelStyle: TextStyle = { color: foreground };

  return (
    <Pressable
      {...(IS_WEB ? ({ dataSet: { bloomButtonGroupItem: '' } } as Record<string, unknown>) : {})}
      style={[containerStyle, style]}
      onPress={disabled ? undefined : onPress}
      onPressIn={disabled ? undefined : onPressIn}
      onPressOut={disabled ? undefined : onPressOut}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      // Both spellings: react-native-web reads only `aria-pressed`, React Native
      // has no `aria-pressed` and reads `accessibilityState`.
      accessibilityState={{ disabled, selected }}
      aria-pressed={selected}
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
