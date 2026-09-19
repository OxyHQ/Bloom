import React, { memo } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';

import { Badge } from '../badge';
import { RiChat3Line } from '../icons/remix/RiChat3Line';
import { useImageResolver } from '../image-resolver/context';
import type { WebCssStyle } from '../styles/web-view-style';
import { webDataSet } from '../styles/web-data';
import { Text } from '../typography';
import {
  MAINTENANCE_CATEGORY,
  MAINTENANCE_PRIORITY,
  MAINTENANCE_STAGE,
  MAINTENANCE_STAGES,
} from './constants';
import { HousingCard, IconTile, useHousingPalette, useHousingWebCss } from './parts';
import { HOUSING_TILE_RADIUS, resolveImageUri } from './shared';
import { TenancyTimeline } from './TenancyTimeline';
import type { MaintenancePhoto, MaintenanceRequestCardProps, TenancyTimelineEvent } from './types';

/**
 * One repair request, from the tenant's report to the fix.
 *
 *   card        the housing card, 16 between blocks
 *   header      a 40 category tile (radius 12, neutral-100 / 700, 20 icon),
 *               title headline-semibold, "Plumbing · #1042" body-2-regular
 *               text-secondary; the stage `Badge` (subtle) on the right
 *   chips       the priority `Badge` (label-small, subtle: low neutral, medium info,
 *               high warning, urgent error)
 *   description body-regular, clamped to 3 lines
 *   photos      a horizontal strip of 64 squares, radius 12, 8 apart; each a
 *               button with `onPressPhoto` ("Leaking pipe, photo 1 of 3")
 *   timeline    `TenancyTimeline` at `compact` density: reported →
 *               acknowledged → scheduled → resolved. Stages before `stage` are
 *               complete, `stage` itself current (complete once resolved),
 *               the rest upcoming; each with its date and actor
 *   footer      a hairline, then the comment count (a 16 chat icon +
 *               body-2-medium; a button with `onPressComments`) and `actions`
 */

const PHOTO_SIZE = 64;

function MaintenanceRequestCardComponent({
  title,
  category,
  categoryLabel,
  reference,
  description,
  photos,
  onPressPhoto,
  priority,
  priorityLabel,
  stage,
  stages,
  stageLabels,
  showTimeline = true,
  commentCount,
  commentsLabel = (count: number) => (count === 1 ? '1 comment' : `${count} comments`),
  onPressComments,
  actions,
  photoVariant = 'thumb',
  photoLabel = (photo: MaintenancePhoto, position: number, total: number) =>
    photo.alt ? `${photo.alt}, photo ${position} of ${total}` : `Photo ${position} of ${total}`,
  style,
  testID,
}: MaintenanceRequestCardProps) {
  useHousingWebCss();
  const palette = useHousingPalette();
  const resolver = useImageResolver();
  const id = (part: string) => (testID ? `${testID}-${part}` : undefined);

  const categoryInfo = MAINTENANCE_CATEGORY[category];
  const stageIndex = MAINTENANCE_STAGES.indexOf(stage);
  const stageInfo = MAINTENANCE_STAGE[stage];
  const stageWord = (s: typeof stage) => stageLabels?.[s] ?? MAINTENANCE_STAGE[s].label;
  const priorityInfo = priority ? MAINTENANCE_PRIORITY[priority] : null;

  const events: TenancyTimelineEvent[] = MAINTENANCE_STAGES.map((s, index) => ({
    id: s,
    title: stageWord(s),
    date: stages?.[s]?.date,
    actor: stages?.[s]?.actor,
    tone: index <= stageIndex ? MAINTENANCE_STAGE[stage].tone : 'primary',
    state:
      index < stageIndex || (index === stageIndex && stage === 'resolved')
        ? 'complete'
        : index === stageIndex
          ? 'current'
          : 'upcoming',
  }));

  const commentText = commentCount != null ? commentsLabel(commentCount) : null;
  const ring: WebCssStyle = { '--bloom-housing-ring': palette.ring };

  const comments = commentText ? (
    onPressComments ? (
      <Pressable
        {...webDataSet({ bloomHousingFocus: '' })}
        accessibilityRole="button"
        accessibilityLabel={commentText}
        onPress={onPressComments}
        testID={id('comments')}
        style={[{ flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 6 }, ring]}
      >
        <RiChat3Line width={16} height={16} fill={palette.textSecondary} />
        <Text variant="body-2-medium" style={{ color: palette.text, textDecorationLine: 'underline' }}>
          {commentText}
        </Text>
      </Pressable>
    ) : (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }} testID={id('comments')}>
        <RiChat3Line width={16} height={16} fill={palette.textSecondary} />
        <Text variant="body-2-medium" style={{ color: palette.textSecondary }}>
          {commentText}
        </Text>
      </View>
    )
  ) : null;

  return (
    <HousingCard style={[{ gap: 16 }, style]} testID={testID}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
        <IconTile icon={categoryInfo.icon} testID={id('category-icon')} />
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text
            role="heading"
            aria-level={3}
            variant="headline-semibold"
            numberOfLines={3}
            style={{ color: palette.text }}
            testID={id('title')}
          >
            {title}
          </Text>
          <Text variant="body-2-regular" numberOfLines={1} style={{ color: palette.textSecondary }}>
            {[categoryLabel ?? categoryInfo.label, reference].filter(Boolean).join(' · ')}
          </Text>
        </View>
        <Badge
          content={stageWord(stage)}
          color={stageInfo.tone}
          variant="subtle"
          size="medium"
          testID={id('stage')}
        />
      </View>

      {priorityInfo ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {/* A `Badge`, like every other status in the housing families: it is
              read, not pressed. */}
          <Badge
            size="label-small"
            variant="subtle"
            color={priorityInfo.tone}
            content={priorityLabel ?? priorityInfo.label}
            testID={id('priority')}
          />
        </View>
      ) : null}

      {description ? (
        <Text variant="body-regular" numberOfLines={3} style={{ color: palette.text }} testID={id('description')}>
          {description}
        </Text>
      ) : null}

      {photos && photos.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          testID={id('photos')}
          contentContainerStyle={{ gap: 8 }}
        >
          {photos.map((photo, index) => {
            const uri = resolveImageUri(photo.source, resolver, photoVariant);
            const tile = {
              width: PHOTO_SIZE,
              height: PHOTO_SIZE,
              borderRadius: HOUSING_TILE_RADIUS,
              overflow: 'hidden' as const,
              backgroundColor: palette.tile,
            };
            const image = uri ? (
              <Image source={{ uri }} resizeMode="cover" style={{ width: '100%', height: '100%' }} />
            ) : null;
            const name = photoLabel(photo, index + 1, photos.length);
            return onPressPhoto ? (
              <Pressable
                key={`${photo.source}-${index}`}
                {...webDataSet({ bloomHousingFocus: '' })}
                accessibilityRole="button"
                accessibilityLabel={name}
                onPress={() => onPressPhoto(index)}
                testID={id(`photo-${index}`)}
                style={[tile, ring]}
              >
                {image}
              </Pressable>
            ) : (
              <View
                key={`${photo.source}-${index}`}
                accessible
                accessibilityRole="image"
                accessibilityLabel={name}
                testID={id(`photo-${index}`)}
                style={tile}
              >
                {image}
              </View>
            );
          })}
        </ScrollView>
      ) : null}

      {showTimeline ? (
        <TenancyTimeline events={events} density="compact" testID={id('timeline')} />
      ) : null}

      {comments || actions != null ? (
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            paddingTop: 16,
            borderTopWidth: 1,
            borderTopColor: palette.hairline,
          }}
        >
          {comments ?? <View />}
          {actions != null ? (
            <View
              testID={id('actions')}
              style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}
            >
              {actions}
            </View>
          ) : null}
        </View>
      ) : null}
    </HousingCard>
  );
}

export const MaintenanceRequestCard = memo(MaintenanceRequestCardComponent);
MaintenanceRequestCard.displayName = 'MaintenanceRequestCard';
