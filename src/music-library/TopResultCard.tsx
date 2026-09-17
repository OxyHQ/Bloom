import React, { memo, useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { PlayButton } from '../media-controls';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { borderRadius } from '../styles/tokens';
import type { WebCssStyle } from '../styles/web-view-style';
import { webDataSet } from '../styles/web-data';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { Cover } from './Cover';
import { IS_WEB, MUSIC_LIBRARY_CSS, MUSIC_LIBRARY_STYLE_ID, resolveMusicLibraryPaint } from './shared';
import type { TopResultCardProps, TopResultKind } from './types';

/**
 * The large first search result.
 *
 *   card      16 radius, the panel surface (the background 3% toward the text);
 *             hover takes the row-hover fill. 20 padding, 20 gap.
 *   cover     92, 6 radius — a circle for artists and profiles
 *   title     title-1-bold, one line
 *   meta      a full-pill kind label (caption-1-semibold on the text colour's
 *             wash) · 8 · subtitle body-medium muted
 *   play      a 48 accent PlayButton 20 from the bottom-right corner. On web it
 *             fades in on hover or keyboard focus inside the card (and stays
 *             while playing); on touch and native it is always shown.
 *
 * Accessibility: the card is a `button` named "<title>, <kind>, <subtitle>";
 * the play button is its own sibling control ("Play <title>"), never nested
 * inside the card's pressable.
 */

const KIND_LABELS: Record<TopResultKind, string> = {
  song: 'Song',
  artist: 'Artist',
  album: 'Album',
  playlist: 'Playlist',
  podcast: 'Podcast',
  episode: 'Episode',
  audiobook: 'Audiobook',
  profile: 'Profile',
};

const COVER = 92;

function TopResultCardComponent({
  title,
  kind,
  kindLabel,
  subtitle,
  cover,
  onPress,
  onPlayPress,
  playing = false,
  accessibilityLabel,
  style,
  testID,
}: TopResultCardProps) {
  const theme = useTheme();
  useEffect(() => {
    adoptStyleSheet(MUSIC_LIBRARY_STYLE_ID, MUSIC_LIBRARY_CSS);
  }, []);
  const paint = useMemo(() => resolveMusicLibraryPaint(theme), [theme]);
  const [hovered, setHovered] = useState(false);
  const label = kindLabel ?? KIND_LABELS[kind];
  const round = kind === 'artist' || kind === 'profile';
  const name = accessibilityLabel ?? [title, label, subtitle].filter(Boolean).join(', ');

  const cardStyle: WebCssStyle = {
    borderRadius: 16,
    padding: 20,
    gap: 20,
    backgroundColor: hovered ? paint.hover : paint.surface,
    '--bloom-music-ring': paint.ring,
    ...(IS_WEB ? { transitionProperty: 'background-color', transitionDuration: '150ms' } : null),
  };

  return (
    <View
      {...webDataSet({ bloomTopResult: '' })}
      // Hover is the WHOLE card, play button included, so moving onto the button
      // does not drop the card's fill.
      onPointerEnter={IS_WEB ? () => setHovered(true) : undefined}
      onPointerLeave={IS_WEB ? () => setHovered(false) : undefined}
      style={[{ position: 'relative', minWidth: 0 }, style]}
      testID={testID}
    >
      <Pressable
        {...webDataSet({ bloomMusicFocusable: '' })}
        role="button"
        accessibilityLabel={name}
        onPress={onPress}
        style={cardStyle}
        testID={testID ? `${testID}-card` : undefined}
      >
        <Cover
          source={cover}
          size={COVER}
          round={round}
          radius={6}
          kind={kind}
          placeholder={paint.placeholder}
          glyphColor={paint.textMuted}
        />
        <View style={{ gap: 8, paddingRight: onPlayPress ? 64 : 0 }}>
          <Text variant="title-1-bold" numberOfLines={1} style={{ color: paint.text }}>
            {title}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <View
              style={{
                borderRadius: borderRadius.full,
                backgroundColor: paint.selected,
                paddingLeft: 10,
                paddingRight: 10,
                paddingTop: 3,
                paddingBottom: 3,
                flexShrink: 0,
              }}
            >
              <Text variant="caption-1-semibold" style={{ color: paint.text }}>
                {label}
              </Text>
            </View>
            {subtitle ? (
              <Text variant="body-medium" numberOfLines={1} style={{ color: paint.textMuted, flexShrink: 1 }}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>
      </Pressable>
      {onPlayPress ? (
        <View
          {...webDataSet({ bloomTopResultPlay: '', playing: String(playing) })}
          style={{ position: 'absolute', right: 20, bottom: 20 }}
        >
          <PlayButton
            playing={playing}
            subject={title}
            onPress={onPlayPress}
            testID={testID ? `${testID}-play` : undefined}
          />
        </View>
      ) : null}
    </View>
  );
}

export const TopResultCard = memo(TopResultCardComponent);
TopResultCard.displayName = 'TopResultCard';
