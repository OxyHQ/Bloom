import React, { useState } from 'react';
import { View } from 'react-native';

import { Button } from '../../src/button';
import { Dialog, useDialogControl } from '../../src/dialog';
import { RiShareForwardLine } from '../../src/icons/remix';
import { ProfileCard, RecapCard, ShareCard } from '../../src/media-card';
import { ProfileHeader } from '../../src/media-header';
import { Shelf } from '../../src/media-shelf';
import { useTheme } from '../../src/theme/use-theme';
import { Text } from '../../src/typography';
import { ALBUM_BY_ID, ARTIST_BY_ID, FOLLOWERS, ME, PLAYLISTS, RECAP, SHOW_BY_ID, TRACK_BY_ID } from './data';
import { ArtistTile, PageBody, PageScroll, PlaylistTile, SectionTitle, WithPageWidth, useMusicLayout } from './parts';
import { lyricsOf, playableFromTrack, usePlayer } from './PlayerContext';

/**
 * The listener's own profile: the header with public stats, top artists,
 * public playlists, followers to follow back, and the year's recap with a share
 * card for the song playing now.
 */

export function ProfilePage() {
  const theme = useTheme();
  const player = usePlayer();
  const { gutter, tileSize } = useMusicLayout();
  const [following, setFollowing] = useState<ReadonlySet<string>>(() => new Set(['p-2']));
  const share = useDialogControl();
  const publicPlaylists = PLAYLISTS.filter((p) => p.mine);
  const track =
    player.current?.kind === 'track' ? player.current : playableFromTrack(TRACK_BY_ID['lanterns-over-kessel-bay-3']!);
  const excerpt = (lyricsOf(track) ?? [])
    .filter((l) => l.text)
    .slice(4, 7)
    .map((l) => l.text);

  const shareCard = (
    <ShareCard
      title={track.title}
      artist={track.artists.map((a) => a.name).join(', ')}
      artwork={track.artwork}
      artworkColor={track.artworkColor}
      explicit={track.explicit}
      lyrics={excerpt}
      footer={
        <Text variant="caption-1-semibold" style={{ color: '#ffffff' }}>
          Shared by {ME.name}
        </Text>
      }
      style={{ width: '100%', maxWidth: 360 }}
    />
  );

  return (
    <PageScroll testID="music-profile">
      <ProfileHeader
        name={ME.name}
        avatar={ME.avatar}
        artworkColor={ME.artworkColor}
        stats={[
          { label: `${publicPlaylists.length} public playlists` },
          { label: `${FOLLOWERS.length} followers`, onPress: () => {} },
          { label: '88 following', onPress: () => {} },
        ]}
        onEditPress={() => {}}
        onMorePress={() => {}}
      />
      <PageBody gap={40}>
        <Shelf title="Top artists this month" subtitle="Only visible to you" onShowAll={() => {}} contentInset={gutter}>
          {['lumen-vale', 'odessa-rowe', 'kiko-marenne', 'paper-lanterns', 'arlo-tamsin', 'north-ferry'].map((id) => (
            <ArtistTile key={id} id={id} size={tileSize} />
          ))}
        </Shelf>

        <Shelf title="Public playlists" onShowAll={() => {}} contentInset={gutter}>
          {publicPlaylists.map((p) => (
            <PlaylistTile key={p.id} id={p.id} size={tileSize} />
          ))}
        </Shelf>

        <Shelf title="Followers" contentInset={gutter}>
          {FOLLOWERS.map((person) => {
            const on = following.has(person.id);
            return (
              <ProfileCard
                key={person.id}
                name={person.name}
                artwork={person.avatar}
                followers={person.followers}
                followsYou={person.followsYou}
                size={tileSize}
                action={
                  <Button
                    variant={on ? 'secondary' : 'primary'}
                    size="xs"
                    accessibilityLabel={`Follow ${person.name}`}
                    aria-pressed={on}
                    onPress={() =>
                      setFollowing((set) => {
                        const next = new Set(set);
                        if (on) next.delete(person.id);
                        else next.add(person.id);
                        return next;
                      })
                    }
                  >
                    {on ? 'Following' : person.followsYou ? 'Follow back' : 'Follow'}
                  </Button>
                }
              />
            );
          })}
        </Shelf>

        <View style={{ gap: 16 }}>
          <SectionTitle>Your year in sound</SectionTitle>
          <WithPageWidth>
            {(pageWidth) => {
              const wide = pageWidth >= 880;
              return (
                <View
                  style={{
                    flexDirection: wide ? 'row' : 'column',
                    gap: 24,
                    alignItems: wide ? 'flex-start' : 'stretch',
                  }}
                >
                  <RecapCard
                    eyebrow={RECAP.eyebrow}
                    value={RECAP.value}
                    unit={RECAP.unit}
                    artworkColor={RECAP.artworkColor}
                    highlights={[
                      {
                        label: 'Top artist',
                        title: 'Lumen Vale',
                        artwork: ARTIST_BY_ID['lumen-vale']!.photo,
                        round: true,
                      },
                      {
                        label: 'Top song',
                        title: 'Lanterns',
                        artwork: ALBUM_BY_ID['lanterns-over-kessel-bay']!.artwork,
                      },
                      {
                        label: 'Top podcast',
                        title: 'Quiet Cartography',
                        artwork: SHOW_BY_ID['quiet-cartography']!.artwork,
                      },
                    ]}
                    onShare={() => share.open()}
                    style={{ flex: wide ? 1 : undefined, maxWidth: 640 }}
                  />
                  <View style={{ gap: 12, width: wide ? 360 : '100%' }}>
                    {shareCard}
                    <Button
                      variant="secondary"
                      leadingIcon={RiShareForwardLine}
                      onPress={() => share.open()}
                      style={{ alignSelf: 'flex-start' }}
                    >
                      Share this song
                    </Button>
                    <Text variant="caption-1-regular" style={{ color: theme.colors.textSecondary }}>
                      The card follows the song that’s playing.
                    </Text>
                  </View>
                </View>
              );
            }}
          </WithPageWidth>
        </View>
      </PageBody>

      <Dialog
        control={share}
        title="Share"
        width={420}
        actions={[{ label: 'Copy link' }, { label: 'Close', color: 'cancel' }]}
      >
        <View style={{ alignItems: 'center' }}>{shareCard}</View>
      </Dialog>
    </PageScroll>
  );
}
