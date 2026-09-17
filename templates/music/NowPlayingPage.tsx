import React, { useMemo } from 'react';
import { Image, ScrollView, View } from 'react-native';

import { Button } from '../../src/button';
import { resolveButtonRamps } from '../../src/button/shared';
import { RiCloseLine } from '../../src/icons/remix';
import { LyricsPreviewCard, LyricsView, activeLyricIndex } from '../../src/lyrics';
import { FriendActivityCard } from '../../src/media-card';
import { LikeButton } from '../../src/media-controls';
import { ArtistAbout } from '../../src/media-header';
import { FullScreenPlayer, SleepTimerMenu, type MediaPlayerTrack } from '../../src/media-player';
import { useTheme } from '../../src/theme/use-theme';
import { Text } from '../../src/typography';
import { ARTIST_BY_ID, FRIENDS, SHOW_BY_ID, TRACK_BY_ID, ALBUM_BY_ID } from './data';
import { useMusicLayout, usePaneSurface } from './parts';
import { lyricsOf, usePlayer, usePosition, type Playable } from './PlayerContext';
import { useMusicRouter } from './router';

/**
 * Everything that shows the loaded item on its own: the desktop side card,
 * the lyrics pane, the full-screen player (the phone's overlay and the
 * desktop's immersive view), all driven by the one player and its clock.
 */

export function playerTrack(item: Playable): MediaPlayerTrack {
  return { title: item.title, artists: item.artists, artwork: item.artwork, explicit: item.explicit };
}

/** The main artist of a track, for the about card. */
function artistOf(item: Playable | null) {
  const id = item?.kind === 'track' ? item.artists[0]?.id : undefined;
  return id ? ARTIST_BY_ID[id] : undefined;
}

export function AboutArtist({ item }: { item: Playable | null }) {
  const artist = artistOf(item);
  if (!artist) return null;
  return (
    <ArtistAbout
      title={`About ${artist.name}`}
      image={artist.banner}
      bio={artist.bio}
      stats={[
        { value: artist.listeners, label: 'Monthly listeners' },
        { value: artist.followers, label: 'Followers' },
      ]}
      cities={artist.cities.slice(0, 3)}
    />
  );
}

// ---------------------------------------------------------------------------
//  Lyrics
// ---------------------------------------------------------------------------

/** Synced lyrics for the loaded track, following the clock; a press seeks. */
export function LiveLyrics({ size }: { size?: 'large' | 'medium' | 'small' }) {
  const player = usePlayer();
  const position = usePosition();
  const lines = lyricsOf(player.current);
  return (
    <LyricsView
      lines={lines}
      currentTime={position}
      artworkColor={player.current?.artworkColor}
      onSeekLine={(line) => player.seek(line.time ?? 0)}
      providerText="Lyrics licensed from the song’s publisher"
      emptyText={player.current?.kind === 'episode' ? 'Episodes don’t have lyrics' : undefined}
      size={size}
    />
  );
}

function LivePreviewCard({ onShowLyrics }: { onShowLyrics: () => void }) {
  const player = usePlayer();
  const position = usePosition();
  const lines = lyricsOf(player.current);
  if (!lines) return null;
  return (
    <LyricsPreviewCard
      lines={lines}
      currentTime={position}
      artworkColor={player.current?.artworkColor}
      onShowLyrics={onShowLyrics}
      onSeekLine={(line) => player.seek(line.time ?? 0)}
    />
  );
}

// ---------------------------------------------------------------------------
//  Desktop side card
// ---------------------------------------------------------------------------

export function NowPlayingSide({ onClose, onShowLyrics }: { onClose: () => void; onShowLyrics: () => void }) {
  const player = usePlayer();
  const router = useMusicRouter();
  const theme = useTheme();
  const surface = usePaneSurface();
  const item = player.current;

  return (
    <View style={{ flex: 1, minHeight: 0, backgroundColor: surface, borderRadius: 8, overflow: 'hidden' }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingTop: 12,
          paddingLeft: 16,
          paddingRight: 8,
          paddingBottom: 4,
        }}
      >
        <Text role="heading" variant="headline-semibold" numberOfLines={1} style={{ flex: 1 }}>
          {player.context?.name ?? 'Now playing'}
        </Text>
        <Button
          variant="ghost"
          size="small"
          iconOnly
          icon={RiCloseLine}
          accessibilityLabel="Hide now playing view"
          onPress={onClose}
        />
      </View>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingLeft: 16, paddingRight: 16, paddingBottom: 16, gap: 20 }}
      >
        {item ? (
          <>
            <Image
              source={{ uri: item.artwork }}
              accessibilityLabel={`${item.parentTitle} cover`}
              style={{ width: '100%', aspectRatio: 1, borderRadius: 12, marginTop: 8 }}
            />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                <Text variant="title-2-bold" numberOfLines={2}>
                  {item.title}
                </Text>
                <Text variant="body-2-medium" numberOfLines={1} style={{ color: theme.colors.textSecondary }}>
                  {item.artists.map((a) => a.name).join(', ')}
                </Text>
              </View>
              <LikeButton liked={player.liked.has(item.id)} onLikedChange={(on) => player.setLiked(item.id, on)} />
            </View>
            {item.kind === 'track' ? (
              <LivePreviewCard onShowLyrics={onShowLyrics} />
            ) : (
              <View style={{ gap: 6 }}>
                <Text variant="headline-semibold">About this show</Text>
                <Text variant="body-2-regular" style={{ color: theme.colors.textSecondary }}>
                  {SHOW_BY_ID[item.parentId]?.description}
                </Text>
                <Button
                  variant="secondary"
                  size="small"
                  style={{ alignSelf: 'flex-start' }}
                  onPress={() => router.navigate({ name: 'podcast', id: item.parentId })}
                >
                  Go to show
                </Button>
              </View>
            )}
            <AboutArtist item={item} />
          </>
        ) : null}
        <View style={{ gap: 4 }}>
          <Text role="heading" variant="headline-semibold" style={{ marginBottom: 4 }}>
            Friend activity
          </Text>
          {FRIENDS.map((friend) => {
            const track = TRACK_BY_ID[friend.trackId]!;
            return (
              <FriendActivityCard
                key={friend.id}
                name={friend.name}
                avatar={friend.avatar}
                track={track.title}
                artist={ARTIST_BY_ID[track.artistIds[0]!]!.name}
                context={friend.context}
                contextType={friend.contextType}
                live={friend.live}
                time={friend.time}
                onPress={() => router.navigate({ name: 'album', id: ALBUM_BY_ID[track.albumId]!.id })}
              />
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
//  The full-screen player
// ---------------------------------------------------------------------------

export interface FullPlayerProps {
  onCollapse: () => void;
  onQueuePress?: () => void;
  queueActive?: boolean;
  onDevicePress?: () => void;
  onLyricsPress?: () => void;
}

/** `FullScreenPlayer` fed from the player. It fills its parent. */
export function FullPlayer({ onCollapse, onQueuePress, queueActive, onDevicePress, onLyricsPress }: FullPlayerProps) {
  const player = usePlayer();
  const position = usePosition();
  const router = useMusicRouter();
  const item = player.current;
  const sung = useMemo(() => (lyricsOf(item) ?? []).filter((line) => line.text.length > 0), [item]);
  if (!item) return null;
  const episode = item.kind === 'episode';

  return (
    <FullScreenPlayer
      testID="music-full-player"
      track={playerTrack(item)}
      artworkColor={item.artworkColor}
      contextLabel={`Playing from ${player.context?.type ?? 'album'}`}
      contextName={player.context?.name ?? item.parentTitle}
      onCollapse={onCollapse}
      onArtistPress={(artist) => artist.id && router.navigate({ name: 'artist', id: artist.id })}
      liked={player.liked.has(item.id)}
      onLikedChange={(on) => player.setLiked(item.id, on)}
      transport={
        episode
          ? {
              variant: 'podcast',
              playing: player.playing,
              onPlayPause: player.toggle,
              subject: item.title,
              onSkipBack: () => player.seekBy(-15),
              onSkipForward: () => player.seekBy(30),
              playbackRate: player.rate,
              onPlaybackRateChange: player.setRate,
              trailing: (
                <SleepTimerMenu
                  value={player.sleep}
                  onValueChange={player.setSleep}
                  remaining={player.sleep === 'off' ? undefined : '14:52'}
                />
              ),
            }
          : {
              playing: player.playing,
              onPlayPause: player.toggle,
              subject: item.title,
              onPrevious: player.previous,
              onNext: player.next,
              shuffle: player.shuffle,
              onShuffleChange: player.setShuffle,
              repeat: player.repeat,
              onRepeatChange: player.setRepeat,
            }
      }
      position={position}
      duration={item.duration}
      onSeek={player.seek}
      deviceName={player.device.id === 'this' ? undefined : player.device.name}
      onDevicePress={onDevicePress}
      onShare={() => {}}
      queueActive={queueActive}
      onQueuePress={onQueuePress}
      lyrics={
        sung.length > 0
          ? {
              lines: sung.map((line) => line.text),
              activeIndex: activeLyricIndex(sung, position),
              onPress: onLyricsPress,
            }
          : undefined
      }
      aboutArtist={<AboutArtist item={item} />}
    />
  );
}

/**
 * The desktop's immersive view: the full player, and beside it — from 1100 wide,
 * for a track — the synced lyrics following the clock.
 */
export function ImmersivePlayer({ onCollapse, onQueuePress, onDevicePress }: FullPlayerProps) {
  const { width } = useMusicLayout();
  const player = usePlayer();
  const theme = useTheme();
  const withLyrics = width >= 1100 && player.current?.kind === 'track';
  return (
    <View
      style={{ flex: 1, minHeight: 0, flexDirection: 'row', backgroundColor: resolveButtonRamps(theme).neutral[950] }}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <FullPlayer onCollapse={onCollapse} onQueuePress={onQueuePress} onDevicePress={onDevicePress} />
      </View>
      {withLyrics ? (
        <View style={{ width: Math.min(640, Math.round(width * 0.42)), minHeight: 0 }}>
          <LiveLyrics size="medium" />
        </View>
      ) : null}
    </View>
  );
}
