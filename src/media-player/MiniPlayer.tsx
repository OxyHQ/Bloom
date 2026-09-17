import React, { memo, useContext, useMemo, useRef } from 'react';
import { PanResponder, Pressable, View } from 'react-native';

import { mixColor, resolveButtonRamps } from '../button/shared';
import { LikeButton } from '../media-controls/LikeButton';
import { PlayButton } from '../media-controls/PlayButton';
import { clamp, resolveMediaControlsPaint } from '../media-controls/shared';
import { resolveMenuPalette } from '../floating/menu-palette';
import { useTheme } from '../theme/use-theme';
import type { Theme } from '../theme/types';
import { Text } from '../typography';
import { BloomThemeContext } from '../theme/BloomThemeProvider';
import { DEVICE_GLYPHS } from './device-icons';
import { ImmersiveTheme, immersiveDarkTheme } from './ImmersiveTheme';
import { Artwork } from './TrackText';
import { artistNames, IS_WEB, resolveArtworkTint } from './shared';
import type { MiniPlayerProps } from './types';
import { webDataSet } from '../styles/web-data';

export const MINI_PLAYER_HEIGHT = 56;
/** Horizontal travel that counts as a swipe (native). */
export const MINI_PLAYER_SWIPE = 48;

export interface MiniPlayerSurface {
  /** The bar's fill. */
  background: string;
  /** Whether it is the artwork tint (content paints with the dark theme) or the neutral fallback. */
  tinted: boolean;
  /** The fallback's hairline; `null` on a tint. */
  border: string | null;
}

/**
 * The bar's fill for an artwork colour: the colour darkened until the dark
 * theme's text AND muted text clear 4.5:1 on it, or — absent or unparseable —
 * the floating-surface recipe (card with a neutral-200 hairline; dark
 * neutral-800 with neutral-700) under the app's own theme.
 */
export function resolveMiniPlayerSurface(
  theme: Theme,
  preset: Parameters<typeof immersiveDarkTheme>[1],
  artworkColor: string | undefined,
): MiniPlayerSurface {
  const dark = immersiveDarkTheme(theme, preset);
  const darkPaint = resolveMediaControlsPaint(dark);
  const tint = resolveArtworkTint(artworkColor, darkPaint.text, darkPaint.textMuted);
  if (tint.background) return { background: tint.background, tinted: true, border: null };
  const menu = resolveMenuPalette(theme);
  return { background: menu.surface, tinted: false, border: menu.border };
}

function MiniPlayerContent({
  track,
  playing,
  onPlayPause,
  onPress,
  position,
  duration,
  liked = false,
  onLikedChange,
  deviceName,
  onNext,
  onPrevious,
  openLabel = 'Open player',
  testID,
  tinted,
  background,
}: MiniPlayerProps & MiniPlayerSurface) {
  const theme = useTheme();
  const paint = useMemo(() => resolveMediaControlsPaint(theme), [theme]);
  const { accent } = useMemo(() => resolveButtonRamps(theme), [theme]);
  const id = (part: string) => (testID ? `${testID}-${part}` : undefined);
  const progress = duration > 0 ? clamp(position / duration, 0, 1) : 0;
  // On the artwork tint an accent line has no contrast guarantee; the text colour does.
  const deviceColor = tinted ? paint.text : theme.isDark ? accent[400] : accent[600];
  const DeviceGlyph = DEVICE_GLYPHS.speaker;

  const swipe = useRef({ onNext, onPrevious });
  swipe.current = { onNext, onPrevious };
  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy) * 2,
        onPanResponderRelease: (_e, g) => {
          if (g.dx <= -MINI_PLAYER_SWIPE) swipe.current.onNext?.();
          else if (g.dx >= MINI_PLAYER_SWIPE) swipe.current.onPrevious?.();
        },
      }),
    [],
  );
  const swipeable = !IS_WEB && (!!onNext || !!onPrevious);

  const secondary = deviceName ?? artistNames(track.artists);
  const name = `${openLabel}: ${track.title}, ${artistNames(track.artists)}`;

  return (
    <>
      <Pressable
        role="button"
        accessibilityLabel={name}
        onPress={onPress}
        {...(swipeable ? pan.panHandlers : null)}
        style={{
          flex: 1,
          minWidth: 0,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          alignSelf: 'stretch',
          paddingLeft: 8,
        }}
        testID={id('open')}
      >
        <Artwork source={track.artwork} size={40} radius={8} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text variant="body-2-semibold" numberOfLines={1} style={{ color: paint.text }}>
            {track.title}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: 0 }}>
            {deviceName ? (
              <View pointerEvents="none" testID={id('device')}>
                <DeviceGlyph width={12} height={12} fill={deviceColor} />
              </View>
            ) : null}
            <Text
              variant="caption-1-regular"
              numberOfLines={1}
              style={{ color: deviceName ? deviceColor : paint.textMuted, flexShrink: 1 }}
            >
              {secondary}
            </Text>
          </View>
        </View>
      </Pressable>
      {onLikedChange ? <LikeButton liked={liked} onLikedChange={onLikedChange} testID={id('like')} /> : null}
      <PlayButton
        playing={playing}
        onPress={onPlayPause}
        variant="plain"
        size="small"
        subject={track.title}
        style={{ marginRight: 8 }}
        testID={id('play')}
      />
      <View
        pointerEvents="none"
        aria-hidden
        importantForAccessibility="no-hide-descendants"
        style={{
          position: 'absolute',
          left: 8,
          right: 8,
          bottom: 0,
          height: 2,
          borderRadius: 1,
          overflow: 'hidden',
          // The rail is the text colour composited at 24% over the bar's own fill.
          backgroundColor: mixColor(background, paint.text, 0.24),
        }}
        testID={id('progress')}
      >
        <View
          style={{ width: `${progress * 100}%`, height: 2, backgroundColor: paint.text }}
          testID={id('progress-fill')}
        />
      </View>
    </>
  );
}

/**
 * The phone's floating now-playing bar, above the tab bar.
 *
 *   56 tall, 12 corner (a panel, not a pill), 8 side margin
 *   40 cover (8 corner) · title (body-2-semibold) / artist or device line · like · play
 *   a 2px progress line along the bottom, 8 in from each side
 *
 * The fill is the artwork colour darkened for contrast (`resolveArtworkTint`);
 * the content then paints with the dark theme, so it reads light-on-colour in
 * a light app too. No colour → the floating surface under the app's theme.
 *
 * The cover and text are ONE button ("Open player: Title, Artist"); like and
 * play are siblings rather than nested inside it. While casting, the artist
 * line becomes the device, accent with a speaker glyph. On native a horizontal
 * swipe past 48 calls `onNext` (left) / `onPrevious` (right). Titles truncate
 * — nothing scrolls.
 */
function MiniPlayerComponent(props: MiniPlayerProps) {
  const theme = useTheme();
  const ctx = useContext(BloomThemeContext);
  const surface = useMemo(
    () => resolveMiniPlayerSurface(theme, ctx?.colorPreset ?? 'oxy', props.artworkColor),
    [theme, ctx?.colorPreset, props.artworkColor],
  );
  return (
    <View
      {...webDataSet({ bloomMiniPlayer: surface.tinted ? 'tinted' : 'neutral' })}
      style={[
        {
          height: MINI_PLAYER_HEIGHT,
          marginLeft: 8,
          marginRight: 8,
          borderRadius: 12,
          overflow: 'hidden',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          backgroundColor: surface.background,
          borderWidth: surface.border ? 1 : 0,
          borderColor: surface.border ?? undefined,
        },
        props.style,
      ]}
      testID={props.testID}
    >
      <ImmersiveTheme enabled={surface.tinted}>
        <MiniPlayerContent {...props} {...surface} />
      </ImmersiveTheme>
    </View>
  );
}

export const MiniPlayer = memo(MiniPlayerComponent);
MiniPlayer.displayName = 'MiniPlayer';
