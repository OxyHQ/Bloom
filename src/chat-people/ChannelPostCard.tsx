import React, { memo, useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { Avatar } from '../avatar/Avatar';
import { Button } from '../button';
import { useInteractionState } from '../hooks/use-interaction-state';
import { RiChat3Line } from '../icons/remix/RiChat3Line';
import { RiEyeLine } from '../icons/remix/RiEyeLine';
import { RiMore2Line } from '../icons/remix/RiMore2Line';
import { RiPushpinFill } from '../icons/remix/RiPushpinFill';
import { RiShareForwardLine } from '../icons/remix/RiShareForwardLine';
import { RiVerifiedBadgeFill } from '../icons/remix/RiVerifiedBadgeFill';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { resolveChatPeoplePaint } from './shared';
import type { ChannelPostCardProps } from './types';

/**
 * `ChannelPostCard`: one broadcast in a channel.
 *
 *   header    32 avatar · channel name (+ verified mark, + pin mark) · time
 *   media     edge to edge inside the card's radius
 *   body      the post
 *   reactions the caller's row of chips
 *   footer    views (eye) · forwards (arrow) on the left; "128 comments" and
 *             share on the right
 *
 * COUNTS ARE STRINGS. "12.4K" is a locale decision and an abbreviation policy
 * the app already made for its feed; a card that formats numbers itself would
 * disagree with the list it sits in, in the one place a reader compares them
 * side by side.
 *
 * The eye and the forward arrow are DECORATIVE — the counts beside them are
 * text, so the glyph would announce a second time. The accessible names for
 * both live in `labels`, on the row that holds each pair.
 */

const RADIUS = 16;

function ChannelPostCardComponent({
  channelName,
  channelAvatar,
  channelAvatarVariant,
  verified = false,
  time,
  children,
  media,
  views,
  forwards,
  reactions,
  comments,
  onComments,
  onShare,
  shareLabel = 'Share',
  onPress,
  pinned = false,
  onMore,
  moreLabel = 'Post options',
  labels,
  style,
  testID,
}: ChannelPostCardProps) {
  const theme = useTheme();
  const paint = useMemo(() => resolveChatPeoplePaint(theme), [theme]);
  const { state: hovered, onIn, onOut } = useInteractionState();
  const viewsLabel = labels?.views ?? ((count: string) => `${count} views`);
  const forwardsLabel = labels?.forwards ?? ((count: string) => `${count} forwards`);

  const header = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingRight: onMore === undefined ? 0 : 28,
      }}
    >
      <Avatar
        source={channelAvatar}
        variant={channelAvatarVariant}
        name={channelName}
        size={32}
      />
      <View style={{ flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Text
          variant="body-semibold"
          numberOfLines={1}
          style={{ color: paint.text, flexShrink: 1 }}
          testID={testID ? `${testID}-channel` : undefined}
        >
          {channelName}
        </Text>
        {verified ? <RiVerifiedBadgeFill width={14} height={14} fill={paint.accent} /> : null}
        {pinned ? (
          <View
            accessibilityLabel={labels?.pinned ?? 'Pinned'}
            testID={testID ? `${testID}-pinned` : undefined}
          >
            <RiPushpinFill width={13} height={13} fill={paint.textTertiary} />
          </View>
        ) : null}
      </View>
      <Text
        variant="caption-1-regular"
        style={{ color: paint.textSecondary }}
        testID={testID ? `${testID}-time` : undefined}
      >
        {time}
      </Text>
    </View>
  );

  const body = (
    <>
      {header}
      {media === undefined ? null : (
        <View
          style={{
            borderRadius: RADIUS - 6,
            overflow: 'hidden',
            backgroundColor: paint.rowHighlight,
          }}
          testID={testID ? `${testID}-media` : undefined}
        >
          {media}
        </View>
      )}
      {children === undefined ? null : typeof children === 'string' ? (
        <Text variant="body-regular" style={{ color: paint.text }}>
          {children}
        </Text>
      ) : (
        children
      )}
      {reactions}
    </>
  );

  const shell = {
    gap: 10,
    borderRadius: RADIUS,
    paddingTop: 12,
    paddingRight: 12,
    paddingBottom: 12,
    paddingLeft: 12,
  };

  const footer =
    views === undefined &&
    forwards === undefined &&
    comments === undefined &&
    onShare === undefined ? null : (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          paddingTop: 8,
          paddingRight: 12,
          paddingBottom: 12,
          paddingLeft: 12,
          flexWrap: 'wrap',
        }}
      >
        {views === undefined ? null : (
          <View
            accessibilityLabel={viewsLabel(views)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            testID={testID ? `${testID}-views` : undefined}
          >
            <RiEyeLine width={14} height={14} fill={paint.textSecondary} />
            <Text variant="caption-1-regular" style={{ color: paint.textSecondary }}>
              {views}
            </Text>
          </View>
        )}
        {forwards === undefined ? null : (
          <View
            accessibilityLabel={forwardsLabel(forwards)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            testID={testID ? `${testID}-forwards` : undefined}
          >
            <RiShareForwardLine width={14} height={14} fill={paint.textSecondary} />
            <Text variant="caption-1-regular" style={{ color: paint.textSecondary }}>
              {forwards}
            </Text>
          </View>
        )}
        <View style={{ flex: 1 }} />
        {comments === undefined ? null : (
          <Button
            variant="text"
            size="small"
            leadingIcon={RiChat3Line}
            onPress={onComments}
            testID={testID ? `${testID}-comments` : undefined}
          >
            {comments}
          </Button>
        )}
        {onShare === undefined ? null : (
          <Button
            variant="text"
            size="small"
            iconOnly
            leadingIcon={RiShareForwardLine}
            accessibilityLabel={shareLabel}
            onPress={onShare}
            testID={testID ? `${testID}-share` : undefined}
          />
        )}
      </View>
    );

  return (
    <View
      style={[
        {
          borderRadius: RADIUS,
          borderWidth: 1,
          borderColor: paint.border,
          backgroundColor:
            hovered && onPress !== undefined ? paint.rowHighlight : paint.surfaceRaised,
        },
        style,
      ]}
      testID={testID}
    >
      {onPress === undefined ? (
        <View style={shell}>{body}</View>
      ) : (
        <Pressable
          role="button"
          accessibilityLabel={`${channelName}, ${time}`}
          onPress={onPress}
          onHoverIn={onIn}
          onHoverOut={onOut}
          style={shell}
          testID={testID ? `${testID}-open` : undefined}
        >
          {body}
        </Pressable>
      )}
      {footer}
      {/* A SIBLING of the card's press target, laid over its top-right corner
          rather than nested in the header. A `<button>` inside a `<button>` is
          invalid HTML, and react-dom says so loudly; on native it is two
          overlapping announcements for one gesture. */}
      {onMore === undefined ? null : (
        <Pressable
          role="button"
          accessibilityLabel={moreLabel}
          onPress={onMore}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{
            position: 'absolute',
            top: 12,
            right: 10,
            width: 24,
            height: 24,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          testID={testID ? `${testID}-more` : undefined}
        >
          <RiMore2Line width={16} height={16} fill={paint.textSecondary} />
        </Pressable>
      )}
    </View>
  );
}

export const ChannelPostCard = memo(ChannelPostCardComponent);
ChannelPostCard.displayName = 'ChannelPostCard';
