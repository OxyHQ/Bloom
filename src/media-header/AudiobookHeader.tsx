import React, { memo } from 'react';
import { View } from 'react-native';

import { Rating } from '../rating';
import { Text } from '../typography';
import { Cover, HeaderTitle, InlineLink, MediaHeaderFrame, MetaLine, ProgressBar, useMediaHeaderPaint } from './parts';
import { selectTitleVariant } from './shared';
import type { AudiobookHeaderProps } from './types';

/**
 * The header of an audiobook.
 *
 *   band     2:3 cover 200×300 (narrow 160×240 centred), radius 6 · "Audiobook"
 *            · title (display steps) · author link (title-3-semibold) ·
 *            narrator (body-medium muted) · duration • chapters · rating
 *   progress bar 200 + "4 h 10 min left", under the meta, when `progress` is set
 */

function AudiobookHeaderComponent({
  title,
  cover,
  typeLabel = 'Audiobook',
  author,
  onAuthorPress,
  narrator,
  duration,
  chapters,
  progress,
  progressLabel,
  rating,
  ratingCount,
  artworkColor,
  actions,
  headingLevel = 1,
  style,
  testID,
}: AudiobookHeaderProps) {
  const paint = useMediaHeaderPaint(artworkColor);
  return (
    <MediaHeaderFrame
      paint={paint}
      style={style}
      testID={testID}
      actions={actions}
      coverWidth={(wide) => (wide ? 200 : 160)}
      cover={({ wide }) => (
        <Cover source={cover} size={wide ? 200 : 160} shape="book" paint={paint} testID={testID ? `${testID}-cover` : undefined} />
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
          {author ? (
            <View style={{ flexDirection: 'row' }}>
              <InlineLink
                label={author}
                onPress={onAuthorPress}
                color={paint.onBand}
                variant="title-3-semibold"
                ring={paint.ring}
                testID={testID ? `${testID}-author` : undefined}
              />
            </View>
          ) : null}
          {narrator ? (
            <Text variant="body-medium" style={{ color: paint.onBandMuted }}>
              {narrator}
            </Text>
          ) : null}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <MetaLine
              segments={[duration, chapters]}
              color={paint.onBand}
              mutedColor={paint.onBandMuted}
              ring={paint.ring}
            />
            {rating !== undefined ? (
              <View style={{ paddingLeft: 4 }}>
                <Rating value={rating} count={ratingCount} testID={testID ? `${testID}-rating` : undefined} />
              </View>
            ) : null}
          </View>
          {progress !== undefined ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <ProgressBar
                value={progress}
                label="Listening progress"
                fill={paint.onBand}
                rail={paint.bandRail}
                width={200}
                testID={testID ? `${testID}-progress` : undefined}
              />
              {progressLabel ? (
                <Text variant="body-2-medium" style={{ color: paint.onBandMuted }}>
                  {progressLabel}
                </Text>
              ) : null}
            </View>
          ) : null}
        </>
      )}
    </MediaHeaderFrame>
  );
}

export const AudiobookHeader = memo(AudiobookHeaderComponent);
AudiobookHeader.displayName = 'AudiobookHeader';
