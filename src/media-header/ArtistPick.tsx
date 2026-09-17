import React, { memo } from 'react';
import { Pressable, View } from 'react-native';

import { Avatar } from '../avatar';
import { useInteractionState } from '../hooks/use-interaction-state';
import { RiPushpinFill } from '../icons/remix/RiPushpinFill';
import type { WebCssStyle } from '../styles/web-view-style';
import { webDataSet } from '../styles/web-data';
import { Text } from '../typography';
import { Cover, useMediaHeaderPaint } from './parts';
import type { ArtistPickProps } from './types';

/**
 * The item an artist pins to the top of their page.
 *
 *   label      "Artist pick" with a pin, caption-1-semibold muted
 *   note       a card (radius 16) with a round 24 avatar and the note, body-regular
 *   item       72 cover (radius 6) · title headline-semibold · subtitle body-regular muted
 *
 * With `onPress` the whole card is a button named by the title.
 */

function ArtistPickComponent({
  image,
  title,
  subtitle,
  note,
  avatar,
  label = 'Artist pick',
  onPress,
  style,
  testID,
}: ArtistPickProps) {
  const paint = useMediaHeaderPaint();
  const { state: hovered, onIn, onOut } = useInteractionState();
  const card: WebCssStyle = {
    gap: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: hovered && onPress ? paint.wash : 'transparent',
    '--bloom-media-header-ring': paint.ring,
  };
  const body = (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <RiPushpinFill width={14} height={14} fill={paint.textMuted} />
        <Text variant="caption-1-semibold" style={{ color: paint.textMuted }}>
          {label}
        </Text>
      </View>
      {note ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            alignSelf: 'flex-start',
            paddingTop: 6,
            paddingBottom: 6,
            paddingLeft: 6,
            paddingRight: 12,
            borderRadius: 16,
            backgroundColor: paint.card,
          }}
        >
          {avatar ? <Avatar source={avatar} size={24} /> : null}
          <Text variant="body-regular" numberOfLines={2} style={{ flexShrink: 1, color: paint.text }}>
            {note}
          </Text>
        </View>
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Cover source={image} size={72} paint={paint} shadow={false} />
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text variant="headline-semibold" numberOfLines={2} style={{ color: paint.text }}>
            {title}
          </Text>
          {subtitle ? (
            <Text variant="body-regular" numberOfLines={1} style={{ color: paint.textMuted }}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
    </>
  );
  if (!onPress) {
    return (
      <View style={[card, style]} testID={testID}>
        {body}
      </View>
    );
  }
  return (
    <Pressable
      {...webDataSet({ bloomMediaHeaderPress: '' })}
      role="button"
      accessibilityLabel={title}
      onPress={onPress}
      onHoverIn={onIn}
      onHoverOut={onOut}
      style={[card, style]}
      testID={testID}
    >
      {body}
    </Pressable>
  );
}

export const ArtistPick = memo(ArtistPickComponent);
ArtistPick.displayName = 'ArtistPick';
