import React, { memo, useEffect, useMemo } from 'react';
import { View } from 'react-native';

import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { LyricsLineRow, LyricsPill, type LyricLineState } from './LyricsParts';
import {
  DEFAULT_EMPTY_TEXT,
  LYRICS_CSS,
  LYRICS_STYLE_ID,
  activeLyricIndex,
  lyricsPreviewWindow,
  normalizeLyricLines,
  resolveLyricsPalette,
} from './shared';
import type { LyricsPreviewCardProps } from './types';

/**
 * A card with a few lines of the lyrics around the one playing, for a
 * now-playing screen below the fold.
 *
 *   card      radius 16, padding 20, the lyrics background (`artworkColor`
 *             shade or the neutral surface)
 *   heading   headline-bold, active colour
 *   lines     title-3 (18/26) semibold, the active one bold; 4 or 5 of them,
 *             the active line second from the top
 *   footer    "Show lyrics" pill (left) and the provider text
 *
 * The window moves one line at a time with playback — the lines do not
 * animate. Unsynced lyrics show their first lines in the full colour.
 */
function LyricsPreviewCardComponent({
  lines: linesProp,
  text,
  currentTime,
  artworkColor,
  title = 'Lyrics',
  visibleLines = 5,
  onShowLyrics,
  showLyricsLabel = 'Show lyrics',
  onSeekLine,
  providerText,
  emptyText = DEFAULT_EMPTY_TEXT,
  style,
  testID,
}: LyricsPreviewCardProps) {
  const theme = useTheme();
  useEffect(() => {
    adoptStyleSheet(LYRICS_STYLE_ID, LYRICS_CSS);
  }, []);
  const palette = useMemo(() => resolveLyricsPalette(theme, artworkColor), [theme, artworkColor]);
  const { lines, synced } = useMemo(() => normalizeLyricLines(linesProp, text), [linesProp, text]);
  const active = synced ? activeLyricIndex(lines, currentTime) : -1;
  // Unsynced text has blank separators between verses; a preview skips them.
  const pool = synced ? lines : lines.filter((line) => line.text.trim().length > 0);
  const { start, end } = lyricsPreviewWindow(pool.length, active, visibleLines);

  const cardStyle: WebCssStyle = {
    borderRadius: 16,
    paddingTop: 20,
    paddingBottom: 20,
    paddingLeft: 20,
    paddingRight: 20,
    gap: 16,
    backgroundColor: palette.background,
    '--bloom-lyrics-ring': palette.ring,
  };

  return (
    <View role="region" accessibilityLabel={title} style={[cardStyle, style]} testID={testID}>
      <Text variant="headline-bold" style={{ color: palette.active }}>
        {title}
      </Text>
      {pool.length === 0 ? (
        <Text variant="body-medium" style={{ color: palette.upcoming }}>
          {emptyText}
        </Text>
      ) : (
        <View style={{ gap: 6 }}>
          {pool.slice(start, end).map((line, offset) => {
            const index = start + offset;
            const state: LyricLineState = !synced
              ? 'plain'
              : index === active
                ? 'active'
                : index < active
                  ? 'past'
                  : 'upcoming';
            return (
              <LyricsLineRow
                key={line.key ?? index}
                line={line}
                index={index}
                state={state}
                variant={state === 'active' ? 'title-3-bold' : 'title-3-semibold'}
                palette={palette}
                onSeekLine={synced ? onSeekLine : undefined}
                gapHeight={16}
                testID={testID ? `${testID}-line-${index}` : undefined}
              />
            );
          })}
        </View>
      )}
      {onShowLyrics || providerText ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          {onShowLyrics ? (
            <LyricsPill
              label={showLyricsLabel}
              palette={palette}
              onPress={onShowLyrics}
              testID={testID ? `${testID}-show` : undefined}
            />
          ) : null}
          {providerText ? (
            <Text variant="caption-1-regular" style={{ color: palette.muted, flexShrink: 1 }}>
              {providerText}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export const LyricsPreviewCard = memo(LyricsPreviewCardComponent);
LyricsPreviewCard.displayName = 'LyricsPreviewCard';
