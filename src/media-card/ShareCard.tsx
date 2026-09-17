import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { ExplicitBadge } from '../media-controls';
import { RiMusic2Fill } from '../icons/remix/RiMusic2Fill';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { Artwork, CoverGradient } from './parts';
import { RECAP_RADIUS, resolveCoverTint, resolveMediaCardPaint, webData } from './shared';
import type { ShareCardProps } from './types';

/**
 * A track laid out to be shared as an image.
 *
 *   radius 20, padding 24, the gradient generated from `artworkColor` (stepped
 *   dark enough for light text; neutral without it)
 *   the cover (full width, square, radius 12); the title (title-2-bold) with
 *   the explicit badge; the artist (headline-medium, muted); an optional lyrics
 *   excerpt in a block of the gradient's darker stop (radius 12, padding 16,
 *   title-3-bold lines); then `footer`
 *
 * Default width 320; `style` sets another. Static — nothing in it presses.
 */
function ShareCardComponent({
  title,
  artist,
  lyrics,
  footer,
  explicit = false,
  artwork,
  artworkVariant,
  artworkColor,
  style,
  testID,
}: ShareCardProps) {
  const theme = useTheme();
  const paint = useMemo(() => resolveMediaCardPaint(theme), [theme]);
  const tint = useMemo(() => resolveCoverTint(theme, artworkColor), [theme, artworkColor]);
  const [coverWidth, setCoverWidth] = React.useState(0);

  return (
    <View
      {...webData({ bloomMediaCard: 'share' })}
      style={[{ width: 320, borderRadius: RECAP_RADIUS, overflow: 'hidden', backgroundColor: tint.top }, style]}
      testID={testID}
    >
      <CoverGradient top={tint.top} bottom={tint.bottom} />
      <View style={{ paddingLeft: 24, paddingRight: 24, paddingTop: 24, paddingBottom: 24, gap: 16 }}>
        <View
          style={{ width: '100%', aspectRatio: 1 }}
          onLayout={(event) => setCoverWidth(event.nativeEvent.layout.width)}
        >
          {coverWidth > 0 ? (
            <Artwork
              source={artwork}
              variant={artworkVariant}
              width={coverWidth}
              height={coverWidth}
              radius={12}
              icon={RiMusic2Fill}
              paint={paint}
              testID={testID ? `${testID}-artwork` : undefined}
            />
          ) : null}
        </View>
        <View style={{ gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text variant="title-2-bold" numberOfLines={2} style={{ flexShrink: 1, color: tint.text }}>
              {title}
            </Text>
            {explicit ? <ExplicitBadge /> : null}
          </View>
          <Text variant="headline-medium" numberOfLines={1} style={{ color: tint.textMuted }}>
            {artist}
          </Text>
        </View>
        {lyrics && lyrics.length > 0 ? (
          <View
            style={{ borderRadius: 12, paddingLeft: 16, paddingRight: 16, paddingTop: 16, paddingBottom: 16, backgroundColor: tint.bottom, gap: 4 }}
            testID={testID ? `${testID}-lyrics` : undefined}
          >
            {lyrics.map((line, index) => (
              <Text key={`${index}-${line}`} variant="title-3-bold" style={{ color: tint.text }}>
                {line}
              </Text>
            ))}
          </View>
        ) : null}
        {footer}
      </View>
    </View>
  );
}

export const ShareCard = memo(ShareCardComponent);
ShareCard.displayName = 'ShareCard';
