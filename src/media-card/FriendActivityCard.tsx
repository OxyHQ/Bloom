import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { RiDiscFill } from '../icons/remix/RiDiscFill';
import { RiMusic2Fill } from '../icons/remix/RiMusic2Fill';
import { RiUser3Fill } from '../icons/remix/RiUser3Fill';
import { NowPlayingIndicator } from '../media-controls';
import { Box as SkeletonBox, Circle as SkeletonCircle } from '../skeleton';
import { borderRadius } from '../styles/tokens';
import type { WebCssStyle } from '../styles/web-view-style';
import { webDataSet } from '../styles/web-data';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { Artwork, CardLink, useMediaCardCss } from './parts';
import { composeName, resolveMediaCardPaint, ROW_PADDING, ROW_RADIUS } from './shared';
import type { FriendActivityCardProps } from './types';

const AVATAR = 40;
const DOT = 12;

/**
 * What a friend is listening to.
 *
 *   avatar   40 round; `live` adds a 12 accent dot ringed 2px in the page
 *            colour at its bottom-right
 *   line 1   the name (body-semibold) · right: the relative `time`, or — live —
 *            the moving now-playing bars
 *   line 2   "Track — Artist" (body-2-regular)
 *   line 3   a note (playlist) or disc (album) glyph and the context (caption)
 *
 * A row with the same wash, padding and link-under-content as the other cards.
 *
 * Name: "Maya Ortiz, Listening now, Night Drive by Mara Vell, Late Hours".
 */
function FriendActivityCardComponent({
  name,
  avatar,
  track,
  artist,
  context,
  contextType = 'playlist',
  live = false,
  time,
  liveLabel = 'Listening now',
  onPress,
  href,
  selected = false,
  skeleton = false,
  accessibilityLabel,
  style,
  testID,
}: FriendActivityCardProps) {
  const theme = useTheme();
  useMediaCardCss();
  const paint = useMemo(() => resolveMediaCardPaint(theme), [theme]);

  if (skeleton) {
    return (
      <View aria-busy accessibilityLabel="Loading" style={[{ flexDirection: 'row', gap: 12, padding: ROW_PADDING }, style]} testID={testID}>
        <SkeletonCircle size={AVATAR} />
        <View style={{ flex: 1, gap: 8, justifyContent: 'center' }}>
          <SkeletonBox width="35%" height={12} borderRadius={4} />
          <SkeletonBox width="60%" height={10} borderRadius={4} />
        </View>
      </View>
    );
  }

  const label =
    accessibilityLabel ??
    composeName([name, live ? liveLabel : time, `${track} by ${artist}`, context]);
  const ContextGlyph = contextType === 'album' ? RiDiscFill : RiMusic2Fill;

  const rootStyle: WebCssStyle = {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingLeft: ROW_PADDING,
    paddingRight: ROW_PADDING,
    paddingTop: ROW_PADDING,
    paddingBottom: ROW_PADDING,
    borderRadius: ROW_RADIUS,
    backgroundColor: selected ? paint.selected : undefined,
    '--bloom-media-card-hover': selected ? paint.selectedHover : paint.hover,
  };

  return (
    <View
      {...webDataSet({ bloomMediaCard: 'activity', ...(onPress || href ? { bloomMediaCardHover: '' } : null) })}
      style={[rootStyle, style]}
      testID={testID}
    >
      <CardLink name={label} onPress={onPress} href={href} selected={selected} radius={ROW_RADIUS} paint={paint} testID={testID} />
      <View pointerEvents="none" style={{ width: AVATAR, height: AVATAR }}>
        <Artwork source={avatar} width={AVATAR} height={AVATAR} round radius={0} icon={RiUser3Fill} paint={paint} />
        {live ? (
          <View
            testID={testID ? `${testID}-live-dot` : undefined}
            style={{
              position: 'absolute',
              right: -2,
              bottom: -2,
              width: DOT + 4,
              height: DOT + 4,
              borderRadius: borderRadius.full,
              backgroundColor: paint.surface,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View style={{ width: DOT, height: DOT, borderRadius: borderRadius.full, backgroundColor: paint.accent }} />
          </View>
        ) : null}
      </View>
      <View pointerEvents="none" style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text variant="body-semibold" numberOfLines={1} style={{ flex: 1, minWidth: 0, color: paint.text }}>
            {name}
          </Text>
          {live ? (
            <NowPlayingIndicator size={12} label={liveLabel} testID={testID ? `${testID}-live` : undefined} />
          ) : time ? (
            <Text variant="caption-1-regular" numberOfLines={1} style={{ color: paint.textSecondary }}>
              {time}
            </Text>
          ) : null}
        </View>
        <Text variant="body-2-regular" numberOfLines={1} style={{ color: paint.textSecondary }}>
          <Text variant="body-2-medium" style={{ color: paint.text }}>
            {track}
          </Text>
          {` — ${artist}`}
        </Text>
        {context ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View aria-hidden>
              <ContextGlyph width={12} height={12} fill={paint.textSecondary} />
            </View>
            <Text variant="caption-1-regular" numberOfLines={1} style={{ flexShrink: 1, color: paint.textSecondary }}>
              {context}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

export const FriendActivityCard = memo(FriendActivityCardComponent);
FriendActivityCard.displayName = 'FriendActivityCard';
