import React, { Children, Fragment, isValidElement, memo, useMemo } from 'react';
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  View,
  type GestureResponderEvent,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useTheme } from '../theme/use-theme';
import { Text } from '../typography/Typography';
import { borderRadius } from '../styles/tokens';
import { useInteractionState } from '../hooks/use-interaction-state';
import { useDirectionProps, useIsRtl } from '../hooks/use-is-rtl';
import { interactiveWebCss, useInteractiveWebCss } from '../styles/interactive-web-css';
import type { WebCssStyle } from '../styles/web-view-style';
import { BUTTON_TRANSITION_MS } from '../button/shared';
import type { Theme } from '../theme/types';
import type { BreadcrumbItemProps, BreadcrumbProps } from './types';

/**
 * The breadcrumb, coloured from Bloom's theme through the neutral ramp
 * (`button/shared.ts`).
 *
 *   list        row, gap 10, padding-x 4, scrolls horizontally, no scrollbar
 *   separator   12×12 chevron, 1.5 stroke, text-tertiary
 *   item        caption-1-medium (Inter 12/16, tracking 0.15), gap 6 (icon 16 ↔ label)
 *   link/button padding 2 × 4, margin-x −4, text-tertiary;
 *               hover: text-secondary on a background/primary/hover pill
 *   current     text-secondary, not interactive, aria-current="page"
 *
 *   text-tertiary   neutral-400 / dark neutral-600
 *   text-secondary  neutral-500 (both modes)
 *   hover surface   neutral-100 / dark neutral-700 at 60%
 *
 * Bloom uses the full pill for the interactive item rather than a 6px corner,
 * like every other pressable. Hover is driven from state so native paints the same.
 */

interface BreadcrumbPalette {
  tertiary: string;
  secondary: string;
  hover: string;
  ring: string;
}

function resolveBreadcrumbPalette(theme: Theme): BreadcrumbPalette {
  const c = theme.colors;
  return { tertiary: c.textSecondary, secondary: c.text, hover: c.backgroundSecondary, ring: c.primary };
}

const STYLE_ID = 'bloom-breadcrumb-web-css';
const SELECTOR = '[data-bloom-breadcrumb-item]';

// A `ring-2` focus ring (no offset) on the link/button, hung off a
// `dataSet` attribute because a class never reaches the DOM on a
// react-native-web primitive (see `chip/Chip.tsx`). `base` restores the row
// layout the shared reset's `inline-flex`/`justify-content` would override.
const BREADCRUMB_CSS = interactiveWebCss({
  selector: SELECTOR,
  varPrefix: 'bloom-breadcrumb',
  base: `
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    text-decoration: none;
  `,
  transition: `background-color ${BUTTON_TRANSITION_MS}ms ease`,
  hover: { declarations: 'cursor: pointer;' },
  outlineOffset: 0,
  extraRules: `${SELECTOR} * {
  transition: color ${BUTTON_TRANSITION_MS}ms ease;
}`,
});

const IS_WEB = Platform.OS === 'web';

/**
 * `ChevronRightSmall`, path for path. It points the READING direction: the
 * row mirrors in a right-to-left layout (flex order follows the direction on
 * both platforms), so a fixed right-pointing chevron would point back at the
 * crumb it came from. A glyph is a sign, not an inset — no logical style key
 * can flip it — so it reads `useIsRtl()` and mirrors itself with `scaleX`.
 */
function Chevron({ color, rtl }: { color: string; rtl: boolean }) {
  return (
    <View
      aria-hidden
      style={{ width: 12, height: 12, flexShrink: 0, ...(rtl ? { transform: [{ scaleX: -1 }] } : null) }}
    >
      <Svg width={12} height={12} viewBox="0 0 12 12" fill="none">
        <Path
          d="M4.5 3L7.14645 5.64645C7.34171 5.84171 7.34171 6.15829 7.14645 6.35355L4.5 9"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}

const BreadcrumbComponent: React.FC<BreadcrumbProps> = ({
  children,
  separator,
  accessibilityLabel = 'Breadcrumb',
  style,
  testID,
}) => {
  const theme = useTheme();
  const rtl = useIsRtl();
  const directionProps = useDirectionProps();
  const palette = useMemo(() => resolveBreadcrumbPalette(theme), [theme]);
  const items = Children.toArray(children).filter(isValidElement);
  // A caller's separator is theirs to mirror (or not — a "/" needs nothing);
  // it is hidden from assistive technology like the chevron, since the list
  // structure already says where one crumb ends.
  const between =
    separator !== undefined ? (
      <View aria-hidden style={{ flexShrink: 0, flexDirection: 'row', alignItems: 'center' }}>
        {separator}
      </View>
    ) : (
      <Chevron color={palette.tertiary} rtl={rtl} />
    );

  return (
    <View
      {...directionProps}
      role="navigation"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={[{ width: '100%', flexDirection: 'row', alignItems: 'center' }, style]}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ alignItems: 'center' }}
      >
        <View
          role="list"
          style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 4, paddingRight: 4 }}
        >
          {items.map((item, index) => (
            <Fragment key={item.key ?? index}>
              {index > 0 ? between : null}
              {item}
            </Fragment>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const BreadcrumbItemComponent: React.FC<BreadcrumbItemProps> = ({
  children,
  icon: Icon,
  leading,
  href,
  onPress,
  current = false,
  accessibilityLabel,
  style,
  textStyle,
  testID,
}) => {
  const theme = useTheme();
  useInteractiveWebCss(STYLE_ID, BREADCRUMB_CSS);
  const palette = useMemo(() => resolveBreadcrumbPalette(theme), [theme]);
  const { state: hovered, onIn: onHoverIn, onOut: onHoverOut } = useInteractionState();

  const foreground = current || hovered ? palette.secondary : palette.tertiary;
  const name =
    accessibilityLabel ??
    (typeof children === 'string' || typeof children === 'number' ? String(children) : undefined);

  const content = (
    <>
      {leading}
      {Icon ? <Icon width={16} height={16} fill={foreground} /> : null}
      {children != null ? (
        typeof children === 'string' || typeof children === 'number' ? (
          <Text selectable={false} variant="caption-1-medium" numberOfLines={1} style={[{ color: foreground }, textStyle]}>
            {children}
          </Text>
        ) : (
          children
        )
      ) : null}
    </>
  );

  if (current) {
    return (
      <View
        role="listitem"
        {...(IS_WEB ? ({ 'aria-current': 'page' } as Record<string, unknown>) : {})}
        testID={testID}
        style={[{ flexDirection: 'row', alignItems: 'center', gap: 6 }, style]}
      >
        {content}
      </View>
    );
  }

  const pillStyle: WebCssStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: -4,
    marginRight: -4,
    paddingLeft: 4,
    paddingRight: 4,
    paddingTop: 2,
    paddingBottom: 2,
    borderRadius: borderRadius.full,
    backgroundColor: hovered ? palette.hover : 'transparent',
    '--bloom-breadcrumb-ring': palette.ring,
  };

  const hoverProps = { onHoverIn, onHoverOut };

  return (
    <View role="listitem" style={{ flexDirection: 'row', alignItems: 'center' }}>
      {href != null ? (
        <Pressable
          {...(IS_WEB
            ? ({ dataSet: { bloomBreadcrumbItem: '' }, href } as Record<string, unknown>)
            : {})}
          role="link"
          accessibilityLabel={name}
          onPress={(event: GestureResponderEvent) => {
            if (onPress) {
              // A router link: the caller navigates, not the browser.
              if (IS_WEB) event.preventDefault();
              onPress();
            } else if (!IS_WEB) {
              void Linking.openURL(href);
            }
          }}
          {...hoverProps}
          testID={testID}
          style={[pillStyle, style]}
        >
          {content}
        </Pressable>
      ) : (
        <Pressable
          {...(IS_WEB ? ({ dataSet: { bloomBreadcrumbItem: '' } } as Record<string, unknown>) : {})}
          role="button"
          accessibilityLabel={name}
          onPress={onPress}
          {...hoverProps}
          testID={testID}
          style={[pillStyle, style]}
        >
          {content}
        </Pressable>
      )}
    </View>
  );
};

export const Breadcrumb = memo(BreadcrumbComponent);
Breadcrumb.displayName = 'Breadcrumb';

export const BreadcrumbItem = memo(BreadcrumbItemComponent);
BreadcrumbItem.displayName = 'BreadcrumbItem';
