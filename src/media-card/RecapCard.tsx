import React, { memo, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { mixColor } from '../button/shared';
import { RiShareForwardLine } from '../icons/remix/RiShareForwardLine';
import { Box as SkeletonBox } from '../skeleton';
import { borderRadius } from '../styles/tokens';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { Artwork, CoverGradient, useMediaCardCss } from './parts';
import { IS_WEB, RECAP_RADIUS, resolveCoverTint, resolveMediaCardPaint, webData, type CoverTint } from './shared';
import type { RecapCardProps } from './types';

/**
 * The share pill over a generated cover. Not `Button`: its fill is the cover's
 * light text colour and its label the cover's own colour, in BOTH modes — a
 * theme-painted button would be dark-on-dark on a dark cover in dark mode.
 */
function SharePill({ label, onPress, tint, testID }: { label: string; onPress: () => void; tint: CoverTint; testID?: string }) {
  const [hovered, setHovered] = useState(false);
  const style: WebCssStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    height: 36,
    paddingLeft: 14,
    paddingRight: 16,
    borderRadius: borderRadius.full,
    backgroundColor: hovered ? mixColor(tint.text, tint.top, 0.12) : tint.text,
    ...(IS_WEB ? { transitionProperty: 'background-color', transitionDuration: '150ms' } : null),
  };
  return (
    <Pressable
      {...webData({ bloomMediaCardShare: '' })}
      role="button"
      accessibilityLabel={label}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={style}
      testID={testID}
    >
      <View aria-hidden pointerEvents="none">
        <RiShareForwardLine width={16} height={16} fill={tint.bottom} />
      </View>
      <Text variant="body-semibold" style={{ color: tint.bottom }}>
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * A yearly or monthly listening summary.
 *
 *   radius 20, padding 24, a diagonal gradient generated from `artworkColor`
 *   (stepped dark enough for light text; neutral without it)
 *   the eyebrow (headline-medium, muted), the number (display-2-bold), the
 *   unit (title-3-medium); then each highlight — a 56 cover (round for an
 *   artist) with its label (caption) and title (headline-semibold); then Share
 *
 * It stretches to its parent; `style` sets a width.
 */
function RecapCardComponent({
  eyebrow,
  value,
  unit,
  artworkColor,
  highlights,
  onShare,
  shareLabel = 'Share',
  skeleton = false,
  style,
  testID,
}: RecapCardProps) {
  const theme = useTheme();
  useMediaCardCss();
  const paint = useMemo(() => resolveMediaCardPaint(theme), [theme]);
  const tint = useMemo(() => resolveCoverTint(theme, artworkColor), [theme, artworkColor]);

  if (skeleton) {
    return (
      <View aria-busy accessibilityLabel="Loading" style={style} testID={testID}>
        <SkeletonBox width="100%" height={360} borderRadius={RECAP_RADIUS} />
      </View>
    );
  }

  return (
    <View
      {...webData({ bloomMediaCard: 'recap' })}
      style={[{ position: 'relative', borderRadius: RECAP_RADIUS, overflow: 'hidden', backgroundColor: tint.top }, style]}
      testID={testID}
    >
      <CoverGradient top={tint.top} bottom={tint.bottom} />
      <View style={{ paddingLeft: 24, paddingRight: 24, paddingTop: 24, paddingBottom: 24, gap: 20 }}>
        <View style={{ gap: 4 }}>
          {eyebrow ? (
            <Text variant="headline-medium" style={{ color: tint.textMuted }}>
              {eyebrow}
            </Text>
          ) : null}
          <Text variant="display-2-bold" numberOfLines={1} adjustsFontSizeToFit style={{ color: tint.text }} testID={testID ? `${testID}-value` : undefined}>
            {value}
          </Text>
          {unit ? (
            <Text variant="title-3-medium" style={{ color: tint.text }}>
              {unit}
            </Text>
          ) : null}
        </View>
        {highlights && highlights.length > 0 ? (
          <View style={{ gap: 12 }}>
            {highlights.map((item, index) => (
              <View key={`${index}-${item.title}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Artwork source={item.artwork} width={56} height={56} round={item.round} radius={6} paint={paint} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text variant="caption-1-medium" numberOfLines={1} style={{ color: tint.textMuted }}>
                    {item.label}
                  </Text>
                  <Text variant="headline-semibold" numberOfLines={1} style={{ color: tint.text }}>
                    {item.title}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}
        {onShare ? <SharePill label={shareLabel} onPress={onShare} tint={tint} testID={testID ? `${testID}-share` : undefined} /> : null}
      </View>
    </View>
  );
}

export const RecapCard = memo(RecapCardComponent);
RecapCard.displayName = 'RecapCard';
