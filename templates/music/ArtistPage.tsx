import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { formatDuration } from '../../src/media-controls';
import {
  ArtistAbout,
  ArtistHero,
  ArtistPick,
  DiscographyFilter,
  MediaActionBar,
  PopularTracks,
  StickyMediaTopBar,
  useMediaHeaderScroll,
} from '../../src/media-header';
import { Shelf } from '../../src/media-shelf';
import { ALBUM_BY_ID, ARTISTS, ARTIST_BY_ID, EVENTS, albumsBy, popularTracksOf } from './data';
import {
  AlbumTile,
  ArtistTile,
  BackButton,
  EventTile,
  PageBody,
  PageScroll,
  SectionTitle,
  artistPlay,
  useContextPlay,
  WithPageWidth,
  useMusicLayout,
} from './parts';
import { usePlayer } from './PlayerContext';
import { useMusicRouter } from './router';

/**
 * The artist page: the hero over the banner, the action row (play, shuffle,
 * follow), popular tracks beside the artist's pick, the discography with its
 * filter, fans-also-like, concerts and the about card.
 */

const FILTER_TYPES: Record<string, readonly string[]> = {
  albums: ['album'],
  singles: ['single', 'ep'],
  compilations: ['compilation'],
};

export function ArtistPage({ id }: { id: string }) {
  const artist = ARTIST_BY_ID[id]!;
  const player = usePlayer();
  const router = useMusicRouter();
  const { mobile, gutter, tileSize } = useMusicLayout();
  const play = useMemo(() => artistPlay(artist), [artist]);
  const state = useContextPlay(play);
  const [following, setFollowing] = useState(id === 'lumen-vale');
  const [discography, setDiscography] = useState('albums');
  const [expanded, setExpanded] = useState(false);
  const { progress, onScroll } = useMediaHeaderScroll({ start: mobile ? 260 : 340 });
  const popular = popularTracksOf(id);
  const releases = albumsBy(id).filter((a) => FILTER_TYPES[discography]!.includes(a.type));
  const events = EVENTS.filter((e) => e.artistId === id);
  /** The artist's pinned release: their newest one. */
  const pick = [...albumsBy(id)].sort((a, b) => Number(b.year) - Number(a.year))[0];

  return (
    <PageScroll
      key={id}
      testID="music-artist"
      onScroll={onScroll}
      overlay={
        <StickyMediaTopBar
          title={artist.name}
          playing={state.playing}
          onPlayPress={state.onPlay}
          artworkColor={artist.artworkColor}
          progress={progress}
          leading={mobile ? <BackButton /> : undefined}
        />
      }
    >
      <ArtistHero
        name={artist.name}
        banner={artist.banner}
        avatar={artist.photo}
        verified={artist.verified}
        listeners={`${artist.listeners} monthly listeners`}
        artworkColor={artist.artworkColor}
        actions={
          <MediaActionBar
            playing={state.playing}
            onPlayPress={state.onPlay}
            playSubject={artist.name}
            shuffle={player.shuffle}
            onShuffleChange={player.setShuffle}
            following={following}
            onFollowChange={setFollowing}
            onMorePress={() => {}}
          />
        }
      />

      <View style={{ paddingTop: 8 }}>
        <PageBody gap={40}>
          <WithPageWidth>
            {(pageWidth) => {
              const side = pageWidth >= 900;
              return (
                <View style={{ flexDirection: side ? 'row' : 'column', gap: 32, alignItems: 'flex-start' }}>
                  <PopularTracks
                    style={{ flex: side ? 1 : undefined, alignSelf: 'stretch' }}
                    tracks={popular.map((t) => ({
                      id: t.id,
                      title: t.title,
                      image: ALBUM_BY_ID[t.albumId]!.artwork,
                      plays: t.plays,
                      duration: formatDuration(t.duration),
                      explicit: t.explicit,
                    }))}
                    expanded={expanded}
                    onExpandedChange={setExpanded}
                    activeTrackId={player.context?.id === id ? player.current?.id : undefined}
                    playing={player.playing}
                    onTrackPress={(_, index) => player.play(play.items, index, play.context)}
                  />
                  <View style={{ width: side ? 320 : '100%', gap: 12 }}>
                    <SectionTitle>Artist pick</SectionTitle>
                    {pick ? (
                      <ArtistPick
                        image={pick.artwork}
                        title={pick.title}
                        subtitle={`${pick.type === 'ep' ? 'EP' : pick.type === 'single' ? 'Single' : 'Album'} · ${pick.year}`}
                        note="Our newest record. Play it loud, on the way home, after dark."
                        avatar={artist.photo}
                        label={`Posted by ${artist.name}`}
                        onPress={() => router.navigate({ name: 'album', id: pick.id })}
                      />
                    ) : null}
                  </View>
                </View>
              );
            }}
          </WithPageWidth>

          <View style={{ gap: 16 }}>
            <DiscographyFilter value={discography} onValueChange={setDiscography} onShowAll={() => {}} />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginLeft: -gutter, marginRight: -gutter }}
              contentContainerStyle={{ paddingLeft: gutter, paddingRight: gutter, gap: 16 }}
            >
              {releases.length > 0 ? (
                releases.map((album) => <AlbumTile key={album.id} id={album.id} size={tileSize} showArtist={false} />)
              ) : (
                <SectionTitle>Nothing here yet</SectionTitle>
              )}
            </ScrollView>
          </View>

          <Shelf title="Fans also like" onShowAll={() => {}} contentInset={gutter}>
            {ARTISTS.filter((a) => a.id !== id).map((a) => (
              <ArtistTile key={a.id} id={a.id} size={tileSize} />
            ))}
          </Shelf>

          {events.length > 0 ? (
            <View style={{ gap: 8 }}>
              <SectionTitle>On tour</SectionTitle>
              {events.map((event) => (
                <EventTile key={event.id} event={event} layout="row" />
              ))}
            </View>
          ) : null}

          <View style={{ maxWidth: 720 }}>
            <ArtistAbout
              image={artist.banner}
              bio={artist.bio}
              stats={[
                { value: artist.followers, label: 'Followers' },
                { value: artist.listeners, label: 'Monthly listeners' },
              ]}
              cities={artist.cities}
            />
          </View>
        </PageBody>
      </View>
    </PageScroll>
  );
}
