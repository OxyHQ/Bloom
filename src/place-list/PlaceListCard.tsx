import React, { memo, useMemo } from 'react';
import { Image, View, type ViewStyle } from 'react-native';

import { AvatarGroup } from '../avatar-group';
import { Badge } from '../badge';
import { Card, CardBody } from '../card';
import { useImageResolver } from '../image-resolver/context';
import { resolvePhoto } from '../listing-card/shared';
import { useSurfaceFill } from '../styles/surface-levels';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { PLACE_LIST_GEOMETRY, PLACE_LIST_VISIBILITY_ICON, PLACE_LIST_VISIBILITY_LABELS } from './constants';
import { composePlaceListName, placeListCountLabel, placeListSharedWithLabel, resolvePlaceListPaint } from './shared';
import type { PlaceListCardProps } from './types';

/**
 * A saved list of places — "Want to go", "Favourites", "Coffee, ranked".
 *
 *   cover   a 112 strip of the first four places' photos, 2px seams, radius
 *           12: the first tile takes two shares of the row and the rest one
 *           each, so a list with photos reads as a PLACE and not as a folder.
 *           With no photos it is one tinted tile holding `empty`
 *   body    the list's glyph and its name (`body-semibold`), then one quiet
 *           meta line — the count, then who it is shared with
 *   people  `AvatarGroup` on the right, 24 each, at most three
 *   badge   the visibility, with its own glyph: private, shared, public
 *
 * THE COUNT AND THE SHARING ARE ONE LINE, not two rows of chrome. A saved list
 * is scanned in a grid of them, and the only questions asked of a card in that
 * grid are "which list is this" and "how much is in it".
 *
 * The card is ONE press target carrying four facts, so it announces them as
 * one sentence (`composePlaceListName`) rather than leaving the reader to
 * assemble "Want to go 12 places Shared Ana Marc" out of four runs.
 *
 * `AvatarGroup` here takes no `onPressItem`: a button inside the card's own
 * press target is the nested control this library refuses everywhere, and a
 * collaborator's profile belongs on the list's own screen.
 */
function PlaceListCardComponent(props: PlaceListCardProps) {
  const {
    name,
    count,
    countLabel = placeListCountLabel,
    photos,
    photoVariant,
    empty,
    icon: Icon,
    color,
    visibility = 'private',
    visibilityLabel,
    collaborators,
    sharedWithLabel = placeListSharedWithLabel,
    onPress,
    accessibilityLabel,
    style,
    testID,
  } = props;

  const theme = useTheme();
  const surface = useSurfaceFill();
  const paint = useMemo(() => resolvePlaceListPaint(theme, surface), [theme, surface]);
  const resolver = useImageResolver();

  const { cover, coverRadius, seam, coverPhotos, gap } = PLACE_LIST_GEOMETRY;
  const uris = (photos ?? [])
    .slice(0, coverPhotos)
    .map((photo) => resolvePhoto(photo, resolver, photoVariant));

  const tile = (uri: string | undefined, key: string, flex: number): React.ReactNode => {
    const box: ViewStyle = { flex, backgroundColor: paint.tile, overflow: 'hidden' };
    return (
      <View key={key} style={box}>
        {uri ? (
          <Image
            source={{ uri }}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
            style={{ width: '100%', height: '100%' }}
          />
        ) : null}
      </View>
    );
  };

  const meta: string[] = [];
  if (count != null) meta.push(countLabel(count));
  if (collaborators && collaborators.length > 0) meta.push(sharedWithLabel(collaborators.length));

  const VisibilityIcon = PLACE_LIST_VISIBILITY_ICON[visibility];

  return (
    <Card
      radius="radius-16"
      onPress={onPress}
      accessibilityLabel={accessibilityLabel ?? composePlaceListName(props)}
      style={style}
      testID={testID}
    >
      <CardBody style={{ gap }}>
        <View
          style={{
            height: cover,
            borderRadius: coverRadius,
            overflow: 'hidden',
            flexDirection: 'row',
            gap: seam,
            backgroundColor: uris.length === 0 ? color ?? paint.tile : undefined,
            alignItems: uris.length === 0 ? 'center' : undefined,
            justifyContent: uris.length === 0 ? 'center' : undefined,
          }}
          testID={testID ? `${testID}-cover` : undefined}
        >
          {uris.length === 0
            ? empty ?? null
            : uris.map((uri, index) => tile(uri, `tile-${index}`, index === 0 ? 2 : 1))}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap }}>
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              {Icon ? (
                <View
                  aria-hidden
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                  style={{ flexShrink: 0 }}
                >
                  <Icon width={16} height={16} fill={color ?? paint.textSecondary} />
                </View>
              ) : null}
              <Text
                variant="body-semibold"
                numberOfLines={1}
                style={{ flexShrink: 1, minWidth: 0, color: paint.text }}
                testID={testID ? `${testID}-name` : undefined}
              >
                {name}
              </Text>
            </View>
            {meta.length > 0 ? (
              <Text
                variant="body-2-regular"
                numberOfLines={1}
                style={{ color: paint.textSecondary }}
                testID={testID ? `${testID}-meta` : undefined}
              >
                {meta.join(' · ')}
              </Text>
            ) : null}
          </View>

          {collaborators && collaborators.length > 0 ? (
            <View
              aria-hidden
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              testID={testID ? `${testID}-people` : undefined}
            >
              {/*
                `showInitials`: a collaborator usually has no photo in a saved
                list, and three identical grey circles say less than three
                letters do.
              */}
              <AvatarGroup items={[...collaborators]} size={24} max={3} showInitials />
            </View>
          ) : null}

          <Badge
            content={visibilityLabel ?? PLACE_LIST_VISIBILITY_LABELS[visibility]}
            icon={VisibilityIcon}
            variant="subtle"
            color="default"
            size="label-small"
          />
        </View>
      </CardBody>
    </Card>
  );
}

export const PlaceListCard = memo(PlaceListCardComponent);
PlaceListCard.displayName = 'PlaceListCard';
