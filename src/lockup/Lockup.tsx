import { memo } from 'react';
import { View } from 'react-native';

import { Avatar } from '../avatar';
import { useShelfCell } from '../media-shelf/use-shelf-cell';
import { PressableScale } from '../pressable-scale';
import { IS_WEB } from '../styles/platform';
import { interactiveWebCss, useInteractiveWebCss } from '../styles/interactive-web-css';
import { hairlineOn, useRingOffsetStyle, useSurfaceFill } from '../styles/surface-levels';
import type { WebCssStyle } from '../styles/web-view-style';
import { webDataSet } from '../styles/web-data';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import {
  LOCKUP_LINK,
  LOCKUP_METRICS,
  LOCKUP_PRESS_SCALE,
  LOCKUP_RANK_WIDTH,
  LOCKUP_STYLE_ID,
} from './shared';
import type { LockupProps } from './types';

const LOCKUP_CSS = interactiveWebCss({
  selector: LOCKUP_LINK,
  varPrefix: 'bloom-lockup',
  // A react-native-web `View` lays out with `display: flex`; the button reset's
  // `inline-flex` would change how the press target fills its row.
  reset: 'none',
  transition: 'opacity 120ms ease',
  outlineOffset: 2,
});

/** Hides the icon from assistive technology: the title already names the product. */
const DECORATIVE = {
  accessibilityElementsHidden: true,
  importantForAccessibility: 'no-hide-descendants' as const,
  ...(IS_WEB ? { 'aria-hidden': true } : null),
};

/**
 * A product, the way a store lists one: its icon, its name, a line about it
 * and its action.
 *
 *   sm   [icon 48] 12 [title / subtitle]                      [action]
 *   md   [icon 64] 14 [title / subtitle / caption]            [action]
 *   lg   [icon 128] 20 [title ×2 / subtitle / caption
 *                       12 [action]]
 *
 * The icon is an `Avatar` (an `ImageResolver` id, a URL or an image source) in
 * the squircle, with a hairline so a white icon still has an edge on a white
 * page. A `rank` sits between the icon and the text, centred in 24. The title is text-primary,
 * the subtitle and caption text-secondary.
 *
 * With `onPress` / `href` the icon and the text are ONE link, named by the text
 * it contains, and `action` is its sibling: a button inside a link is invalid
 * on the web and announces as one control on native. The press target shrinks
 * slightly while held (`PressableScale`, off under reduced motion) and carries
 * Bloom's focus ring.
 *
 * The divider is a hairline from the text's start to the row's end, painted
 * against the actual backing; in a `paged` or `grid` shelf it separates the
 * rows of a column without the caller counting them.
 */
function LockupComponent({
  title,
  subtitle,
  caption,
  icon,
  iconVariant,
  iconShape = 'squircle',
  rank,
  action,
  size = 'md',
  onPress,
  href,
  accessibilityLabel,
  divider: dividerProp,
  titleNumberOfLines,
  headingLevel = 1,
  style,
  testID,
}: LockupProps) {
  useInteractiveWebCss(LOCKUP_STYLE_ID, LOCKUP_CSS);
  const theme = useTheme();
  const fill = useSurfaceFill();
  const ringOffset = useRingOffsetStyle();
  const cell = useShelfCell();
  const metrics = LOCKUP_METRICS[size];
  const large = size === 'lg';
  const divider = dividerProp ?? (cell && cell.rows > 1 ? !cell.lastInColumn : false);
  const titleLines = titleNumberOfLines ?? metrics.titleLines;

  const iconNode = (
    <View {...DECORATIVE} testID={testID ? `${testID}-icon` : undefined}>
      <Avatar
        source={icon ?? undefined}
        variant={iconVariant ?? (large ? 'full' : 'thumb')}
        size={metrics.icon}
        shape={iconShape}
        name={title}
        ring={{ colors: hairlineOn(theme, fill), width: 1 }}
      />
    </View>
  );

  const text = (
    <View style={{ flex: 1, minWidth: 0, gap: large ? 4 : 1 }}>
      <Text
        variant={metrics.title}
        numberOfLines={titleLines > 0 ? titleLines : undefined}
        style={{ color: theme.colors.text }}
        {...(large ? { role: 'heading' as const, 'aria-level': headingLevel } : null)}
        testID={testID ? `${testID}-title` : undefined}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text
          variant={metrics.subtitle}
          numberOfLines={large ? 2 : 1}
          style={{ color: theme.colors.textSecondary }}
          testID={testID ? `${testID}-subtitle` : undefined}
        >
          {subtitle}
        </Text>
      ) : null}
      {caption != null && caption !== false ? (
        typeof caption === 'string' ? (
          <Text
            variant={metrics.caption}
            numberOfLines={1}
            style={{ color: theme.colors.textSecondary }}
            testID={testID ? `${testID}-caption` : undefined}
          >
            {caption}
          </Text>
        ) : (
          <View style={{ flexDirection: 'row' }} testID={testID ? `${testID}-caption` : undefined}>
            {caption}
          </View>
        )
      ) : null}
      {large && action ? (
        <View
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 }}
          testID={testID ? `${testID}-action` : undefined}
        >
          {action}
        </View>
      ) : null}
    </View>
  );

  const rankNode =
    rank != null ? (
      <Text
        variant={large ? 'title-2-semibold' : 'headline-semibold'}
        style={{ color: theme.colors.text, width: LOCKUP_RANK_WIDTH, textAlign: 'center' }}
        testID={testID ? `${testID}-rank` : undefined}
      >
        {rank}
      </Text>
    ) : null;

  // `lg`'s action belongs to the text column, under the title; anywhere else it
  // closes the row. Either way it never sits inside the link.
  const identity = (
    <>
      {iconNode}
      {rankNode}
      {text}
    </>
  );
  const rowStyle = {
    flexDirection: 'row' as const,
    alignItems: large ? ('flex-start' as const) : ('center' as const),
    gap: metrics.gap,
    flex: 1,
    minWidth: 0,
  };
  const linkStyle: WebCssStyle = {
    ...rowStyle,
    ...(ringOffset as WebCssStyle),
    '--bloom-lockup-ring': theme.colors.primary,
    borderRadius: 8,
  };

  const pressable = onPress || href;
  // A link around a large header with an action inside it would nest the
  // action in the link, so `lg` is never pressable as a whole.
  const body =
    pressable && !large ? (
      <PressableScale
        {...webDataSet({ bloomLockupLink: '' })}
        role="link"
        targetScale={LOCKUP_PRESS_SCALE}
        accessibilityLabel={accessibilityLabel}
        onPress={(event) => {
          if (IS_WEB && href && onPress) event.preventDefault();
          onPress?.();
        }}
        {...(href ? { href } : null)}
        style={linkStyle}
        testID={testID ? `${testID}-link` : undefined}
      >
        {identity}
      </PressableScale>
    ) : (
      <View style={rowStyle}>{identity}</View>
    );

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingTop: metrics.padding,
          paddingBottom: metrics.padding,
          minWidth: 0,
        },
        style,
      ]}
      testID={testID}
    >
      {body}
      {!large && action ? (
        <View style={{ flexShrink: 0 }} testID={testID ? `${testID}-action` : undefined}>
          {action}
        </View>
      ) : null}
      {divider ? (
        <View
          {...DECORATIVE}
          style={{
            position: 'absolute',
            bottom: 0,
            insetInlineStart:
              metrics.icon + metrics.gap + (rank != null ? LOCKUP_RANK_WIDTH + metrics.gap : 0),
            insetInlineEnd: 0,
            height: 1,
            backgroundColor: hairlineOn(theme, fill),
          }}
          testID={testID ? `${testID}-divider` : undefined}
        />
      ) : null}
    </View>
  );
}

export const Lockup = memo(LockupComponent);
Lockup.displayName = 'Lockup';
