import React, { memo } from 'react';
import { View } from 'react-native';

import { RiAddCircleLine } from '../icons/remix/RiAddCircleLine';
import { RiCheckboxCircleFill } from '../icons/remix/RiCheckboxCircleFill';
import { RiShareForwardLine } from '../icons/remix/RiShareForwardLine';
import { PlayButton } from '../media-controls/PlayButton';
import { Text } from '../typography';
import { DownloadButton, MediaIconButton, MediaMoreButton } from './MediaActionBar';
import { Cover, HeaderTitle, InlineLink, MediaHeaderFrame, MetaLine, ProgressBar, useMediaHeaderPaint } from './parts';
import { selectTitleVariant } from './shared';
import type { EpisodeHeaderProps } from './types';

/**
 * The header of one podcast episode.
 *
 *   band     cover 160 (narrow 120, left), radius 8 · show link (headline-semibold)
 *            · title (display-3 … title-1) · "Podcast episode"
 *   row      PlayButton large · date · duration · progress (bar 120 + "23 min
 *            left") · save toggle · share · download · more
 *
 * Save is a toggle named `saveLabel` ("Save episode") with `aria-pressed`;
 * saved draws the accent check circle.
 */

function EpisodeHeaderComponent({
  title,
  cover,
  showTitle,
  onShowPress,
  date,
  duration,
  playing,
  onPlayPress,
  progress,
  remainingLabel,
  saved = false,
  onSavedChange,
  saveLabel = 'Save episode',
  onSharePress,
  shareLabel = 'Share',
  download = 'idle',
  downloadProgress,
  onDownloadPress,
  onMorePress,
  typeLabel = 'Podcast episode',
  artworkColor,
  actions,
  headingLevel = 1,
  style,
  testID,
}: EpisodeHeaderProps) {
  const paint = useMediaHeaderPaint(artworkColor);

  const row = (
    <View style={{ gap: 16 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 16, rowGap: 8 }}>
        <PlayButton
          playing={playing}
          onPress={onPlayPress}
          size="large"
          subject={title}
          testID={testID ? `${testID}-play` : undefined}
        />
        <MetaLine segments={[date, duration]} color={paint.text} mutedColor={paint.textMuted} ring={paint.ring} />
        {progress !== undefined ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <ProgressBar
              value={progress}
              label="Listening progress"
              fill={paint.accent}
              rail={paint.rail}
              width={120}
              testID={testID ? `${testID}-progress` : undefined}
            />
            {remainingLabel ? (
              <Text variant="body-2-medium" style={{ color: paint.textMuted }}>
                {remainingLabel}
              </Text>
            ) : null}
          </View>
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          {onSavedChange ? (
            <MediaIconButton
              icon={saved ? RiCheckboxCircleFill : RiAddCircleLine}
              size={28}
              pressed={saved}
              accessibilityLabel={saveLabel}
              onPress={() => onSavedChange(!saved)}
              testID={testID ? `${testID}-save` : undefined}
            />
          ) : null}
          {onSharePress ? (
            <MediaIconButton
              icon={RiShareForwardLine}
              size={24}
              accessibilityLabel={shareLabel}
              onPress={onSharePress}
              testID={testID ? `${testID}-share` : undefined}
            />
          ) : null}
          {onDownloadPress ? (
            <DownloadButton
              state={download}
              progress={downloadProgress}
              onPress={onDownloadPress}
              testID={testID ? `${testID}-download` : undefined}
            />
          ) : null}
          {onMorePress ? <MediaMoreButton onPress={onMorePress} testID={testID ? `${testID}-more` : undefined} /> : null}
        </View>
      </View>
      {actions}
    </View>
  );

  return (
    <MediaHeaderFrame
      paint={paint}
      style={style}
      testID={testID}
      actions={row}
      centerCoverOnNarrow={false}
      coverWidth={(wide) => (wide ? 160 : 120)}
      cover={({ wide }) => (
        <Cover source={cover} size={wide ? 160 : 120} radius={8} paint={paint} testID={testID ? `${testID}-cover` : undefined} />
      )}
    >
      {({ textWidth }) => {
        // An episode title is a sentence — start two steps down.
        const variant = selectTitleVariant(title, textWidth);
        const capped =
          variant === 'large-title-bold' || variant === 'display-1-bold' || variant === 'display-2-bold'
            ? 'display-3-bold'
            : variant;
        return (
          <>
            <View style={{ flexDirection: 'row' }}>
              <InlineLink
                label={showTitle}
                onPress={onShowPress}
                color={paint.onBand}
                variant="headline-semibold"
                ring={paint.ring}
                testID={testID ? `${testID}-show` : undefined}
              />
            </View>
            <HeaderTitle
              variant={capped}
              color={paint.onBand}
              level={headingLevel}
              numberOfLines={3}
              testID={testID ? `${testID}-title` : undefined}
            >
              {title}
            </HeaderTitle>
            <Text variant="body-medium" style={{ color: paint.onBandMuted }}>
              {typeLabel}
            </Text>
          </>
        );
      }}
    </MediaHeaderFrame>
  );
}

export const EpisodeHeader = memo(EpisodeHeaderComponent);
EpisodeHeader.displayName = 'EpisodeHeader';
