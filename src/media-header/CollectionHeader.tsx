import React, { memo, useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { useInteractionState } from '../hooks/use-interaction-state';
import { RiPencilLine } from '../icons/remix/RiPencilLine';
import { borderRadius } from '../styles/tokens';
import type { WebCssStyle } from '../styles/web-view-style';
import { webDataSet } from '../styles/web-data';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { Cover, HeaderTitle, MediaHeaderFrame, MetaLine, useMediaHeaderPaint } from './parts';
import { IS_WEB, resolveLikedGradient, selectTitleVariant } from './shared';
import type { CollectionHeaderProps } from './types';

/**
 * The header of an album, single, EP, playlist, liked songs or audiobook page.
 *
 *              wide (≥ 600)                      narrow
 *   cover      232, radius 6, drop shadow        240 centred (never wider than the band)
 *   type       body-medium, on-band              same
 *   title      large-title … title-1 bold,       display-4 … title-1
 *              by length and width (see `selectTitleVariant`)
 *   desc.      body-regular, muted, 2 lines
 *   meta       avatars 24 · names (links) · year · summary · saves
 *
 * The band runs from the tinted artwork colour to 55% of it over the page, and
 * the `actions` area continues that fade into the page. Text on the band is the
 * theme's text or background colour — whichever reads better over both ends.
 *
 * `variant="liked"`: the cover is the accent gradient with a heart and the band
 * is tinted from the accent.
 *
 * `editable`: a pencil badge sits on the cover (on web the cover also darkens
 * with "Edit" on hover) and the cover and the title press to `onEdit`.
 */

function CollectionHeaderComponent({
  typeLabel,
  title,
  description,
  cover,
  variant = 'default',
  owners,
  year,
  summary,
  saves,
  editable = false,
  onEdit,
  editLabel = 'Edit details',
  artworkColor,
  actions,
  headingLevel = 1,
  style,
  testID,
}: CollectionHeaderProps) {
  const theme = useTheme();
  const liked = variant === 'liked';
  const likedStops = useMemo(() => resolveLikedGradient(theme), [theme]);
  const paint = useMediaHeaderPaint(liked ? likedStops[0] : artworkColor);
  const { state: coverHovered, onIn, onOut } = useInteractionState();
  const canEdit = editable && !!onEdit;

  return (
    <MediaHeaderFrame
      paint={paint}
      style={style}
      testID={testID}
      actions={actions}
      coverWidth={(wide) => (wide ? 232 : 240)}
      cover={({ wide, width }) => {
        const size = wide ? 232 : Math.min(240, width - 64);
        const art = (
          <Cover source={cover} size={size} liked={liked} paint={paint} testID={testID ? `${testID}-cover` : undefined}>
            {canEdit ? (
              <>
                {IS_WEB && coverHovered ? (
                  <View
                    pointerEvents="none"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      borderRadius: 6,
                      backgroundColor: 'rgba(0, 0, 0, 0.55)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    <RiPencilLine width={40} height={40} fill="#ffffff" />
                    <Text variant="body-semibold" style={{ color: '#ffffff' }}>
                      {editLabel}
                    </Text>
                  </View>
                ) : (
                  <View
                    pointerEvents="none"
                    style={{
                      position: 'absolute',
                      right: 8,
                      bottom: 8,
                      width: 32,
                      height: 32,
                      borderRadius: borderRadius.full,
                      backgroundColor: 'rgba(0, 0, 0, 0.6)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    testID={testID ? `${testID}-edit-badge` : undefined}
                  >
                    <RiPencilLine width={16} height={16} fill="#ffffff" />
                  </View>
                )}
              </>
            ) : null}
          </Cover>
        );
        if (!canEdit) return art;
        const press: WebCssStyle = { borderRadius: 6, '--bloom-media-header-ring': paint.ring };
        return (
          <Pressable
            {...webDataSet({ bloomMediaHeaderPress: '' })}
            role="button"
            accessibilityLabel={editLabel}
            onPress={onEdit}
            onHoverIn={onIn}
            onHoverOut={onOut}
            style={press}
            testID={testID ? `${testID}-edit` : undefined}
          >
            {art}
          </Pressable>
        );
      }}
    >
      {({ wide, textWidth }) => {
        const titleVariant = selectTitleVariant(title, textWidth);
        const titlePress: WebCssStyle = {
          alignSelf: 'flex-start',
          borderRadius: 4,
          '--bloom-media-header-ring': paint.ring,
        };
        const heading = (
          <HeaderTitle
            variant={titleVariant}
            color={paint.onBand}
            level={headingLevel}
            numberOfLines={3}
            testID={testID ? `${testID}-title` : undefined}
          >
            {title}
          </HeaderTitle>
        );
        return (
          <>
            <Text variant="body-medium" style={{ color: paint.onBand }}>
              {typeLabel}
            </Text>
            {canEdit ? (
              <Pressable
                {...webDataSet({ bloomMediaHeaderPress: '' })}
                role="button"
                accessibilityLabel={`${editLabel}: ${title}`}
                onPress={onEdit}
                style={titlePress}
              >
                {heading}
              </Pressable>
            ) : (
              heading
            )}
            {description ? (
              <Text variant="body-regular" numberOfLines={2} style={{ color: paint.onBandMuted }}>
                {description}
              </Text>
            ) : null}
            <View style={{ marginTop: wide ? 8 : 4 }}>
              <MetaLine
                people={owners}
                segments={[year, summary, saves]}
                color={paint.onBand}
                mutedColor={paint.onBandMuted}
                ring={paint.ring}
                testID={testID ? `${testID}-meta` : undefined}
              />
            </View>
          </>
        );
      }}
    </MediaHeaderFrame>
  );
}

export const CollectionHeader = memo(CollectionHeaderComponent);
CollectionHeader.displayName = 'CollectionHeader';
