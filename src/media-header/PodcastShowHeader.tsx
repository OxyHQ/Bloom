import React, { memo } from 'react';
import { Pressable, View } from 'react-native';

import { Chip } from '../chip';
import { useInteractionState } from '../hooks/use-interaction-state';
import { PlayButton } from '../media-controls/PlayButton';
import { Rating } from '../rating';
import type { WebCssStyle } from '../styles/web-view-style';
import { webDataSet } from '../styles/web-data';
import { Text } from '../typography';
import { FollowButton } from './MediaActionBar';
import { ClampedText, Cover, HeaderTitle, InlineLink, MediaHeaderFrame, useMediaHeaderPaint } from './parts';
import { selectTitleVariant, type MediaHeaderPaint } from './shared';
import type { LatestEpisode, PodcastShowHeaderProps } from './types';

/**
 * The header of a podcast show.
 *
 *   band       cover 232 (narrow 200 centred), radius 12 · "Podcast" · title
 *              (display steps) · publisher link (title-3-semibold)
 *   below      rating · category chips · Follow pill · `actions`
 *              description (clamped, "Show more") · "Latest episode" callout
 *
 * The callout is a card (radius 16) with the episode's date · duration, title,
 * two lines of description and a small play button.
 */

function LatestEpisodeCard({
  episode,
  label,
  paint,
  testID,
}: {
  episode: LatestEpisode;
  label: string;
  paint: MediaHeaderPaint;
  testID?: string;
}) {
  const { state: hovered, onIn, onOut } = useInteractionState();
  const card: WebCssStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: hovered && episode.onPress ? paint.wash : paint.card,
    '--bloom-media-header-ring': paint.ring,
  };
  const meta = [episode.date, episode.duration].filter(Boolean).join(' · ');
  const content = (
    <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
      <Text variant="caption-1-semibold" style={{ color: paint.accent }}>
        {label}
      </Text>
      <Text variant="headline-semibold" numberOfLines={2} style={{ color: paint.text }}>
        {episode.title}
      </Text>
      {episode.description ? (
        <Text variant="body-regular" numberOfLines={2} style={{ color: paint.textMuted }}>
          {episode.description}
        </Text>
      ) : null}
      {meta ? (
        <Text variant="body-2-medium" style={{ color: paint.textMuted }}>
          {meta}
        </Text>
      ) : null}
    </View>
  );
  return (
    <View style={{ position: 'relative' }} testID={testID}>
      {episode.onPress ? (
        <Pressable
          {...webDataSet({ bloomMediaHeaderPress: '' })}
          role="button"
          accessibilityLabel={`${label}: ${episode.title}`}
          onPress={episode.onPress}
          onHoverIn={onIn}
          onHoverOut={onOut}
          style={[card, { paddingRight: episode.onPlayPress ? 80 : 16 }]}
        >
          {content}
        </Pressable>
      ) : (
        <View style={[card, { paddingRight: episode.onPlayPress ? 80 : 16 }]}>{content}</View>
      )}
      {episode.onPlayPress ? (
        <View style={{ position: 'absolute', right: 16, top: 0, bottom: 0, justifyContent: 'center' }}>
          <PlayButton
            playing={episode.playing ?? false}
            onPress={episode.onPlayPress}
            subject={episode.title}
            testID={testID ? `${testID}-play` : undefined}
          />
        </View>
      ) : null}
    </View>
  );
}

function PodcastShowHeaderComponent({
  title,
  cover,
  publisher,
  onPublisherPress,
  rating,
  ratingCount,
  categories,
  onCategoryPress,
  following = false,
  onFollowChange,
  description,
  descriptionLines = 3,
  latestEpisode,
  typeLabel = 'Podcast',
  latestEpisodeLabel = 'Latest episode',
  showMoreLabel,
  showLessLabel,
  artworkColor,
  actions,
  headingLevel = 1,
  style,
  testID,
}: PodcastShowHeaderProps) {
  const paint = useMediaHeaderPaint(artworkColor);
  const hasRatingRow = rating !== undefined || (categories && categories.length > 0) || onFollowChange;

  const below = (
    <View style={{ gap: 16 }}>
      {hasRatingRow ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
          {rating !== undefined ? (
            <Rating value={rating} count={ratingCount} testID={testID ? `${testID}-rating` : undefined} />
          ) : null}
          {(categories ?? []).map((category) => (
            <Chip
              key={category}
              size="small"
              variant="outlined"
              color="default"
              onPress={onCategoryPress ? () => onCategoryPress(category) : undefined}
              accessibilityLabel={category}
            >
              {category}
            </Chip>
          ))}
          {onFollowChange ? (
            <FollowButton
              following={following}
              onFollowChange={onFollowChange}
              style={{ marginLeft: 4 }}
              testID={testID ? `${testID}-follow` : undefined}
            />
          ) : null}
        </View>
      ) : null}
      {actions}
      {description ? (
        <ClampedText
          lines={descriptionLines}
          color={paint.text}
          linkColor={paint.text}
          ring={paint.ring}
          showMoreLabel={showMoreLabel}
          showLessLabel={showLessLabel}
          testID={testID ? `${testID}-description` : undefined}
        >
          {description}
        </ClampedText>
      ) : null}
      {latestEpisode ? (
        <LatestEpisodeCard
          episode={latestEpisode}
          label={latestEpisodeLabel}
          paint={paint}
          testID={testID ? `${testID}-latest` : undefined}
        />
      ) : null}
    </View>
  );

  return (
    <MediaHeaderFrame
      paint={paint}
      style={style}
      testID={testID}
      actions={below}
      coverWidth={(wide) => (wide ? 232 : 200)}
      cover={({ wide }) => (
        <Cover source={cover} size={wide ? 232 : 200} radius={12} paint={paint} testID={testID ? `${testID}-cover` : undefined} />
      )}
    >
      {({ textWidth }) => (
        <>
          <Text variant="body-medium" style={{ color: paint.onBand }}>
            {typeLabel}
          </Text>
          <HeaderTitle
            variant={selectTitleVariant(title, textWidth)}
            color={paint.onBand}
            level={headingLevel}
            numberOfLines={3}
            testID={testID ? `${testID}-title` : undefined}
          >
            {title}
          </HeaderTitle>
          {publisher ? (
            <View style={{ flexDirection: 'row', marginTop: 4 }}>
              <InlineLink
                label={publisher}
                onPress={onPublisherPress}
                color={paint.onBand}
                variant="title-3-semibold"
                ring={paint.ring}
                testID={testID ? `${testID}-publisher` : undefined}
              />
            </View>
          ) : null}
        </>
      )}
    </MediaHeaderFrame>
  );
}

export const PodcastShowHeader = memo(PodcastShowHeaderComponent);
PodcastShowHeader.displayName = 'PodcastShowHeader';
