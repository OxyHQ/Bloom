import {
  AlbumCard,
  ArtistCard,
  AudiobookCard,
  EpisodeCard,
  EventCard,
  FriendActivityCard,
  GenreCard,
  MediaCard,
  MixCard,
  PlaylistCard,
  PodcastCard,
  ProfileCard,
  QuickAccessTile,
  RecapCard,
  ShareCard,
  SongCard,
} from '@oxy.so/bloom/media-card';
import { Text } from '@oxy.so/bloom/typography';

import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/index';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

const press = () => {};
const COVER = 'https://cdn.oxy.so/cover.jpg';
const FACE = 'https://cdn.oxy.so/face.jpg';
const MENU = [
  { label: 'Add to queue', onPress: press },
  { label: 'Share', onPress: press },
];
const PLAYS = { onPlay: press, menuItems: MENU, artwork: COVER };

const sizes: ParityCase[] = ENUMS.mediaCardSize.flatMap((size) =>
  ENUMS.mediaCardLayout.map((layout) => ({
    name: `MediaCard ${size} ${layout}`,
    language: () =>
      toElement(
        L.MediaCard('Night Drive', { ...PLAYS, subtitle: 'Mara Vell', meta: ['2026'] })
          .size(size)
          .style(layout)
          .onPress(press),
      ),
    bloom: () => (
      <MediaCard
        title="Night Drive"
        {...PLAYS}
        subtitle="Mara Vell"
        meta={['2026']}
        size={size}
        layout={layout}
        onPress={press}
      />
    ),
  })),
);

const cards: ParityCase[] = [
  {
    name: 'MediaCard slots, a cover of its own',
    language: () =>
      toElement(
        L.MediaCard('Night Drive', {
          subtitle: L.Text('Mara Vell'),
          titleAccessory: L.Text('E'),
          titleLeading: L.Text('▶'),
          artworkOverlay: L.Text('12'),
          footer: L.Text('12 min left'),
          artworkSize: '96',
          artworkRadius: 'md',
          renderArtwork: () => L.Text('Cover'),
          eyebrow: '12 Sep',
          description: 'A late drive.',
        })
          .loading()
          .label('Night Drive, album'),
      ),
    bloom: () => (
      <MediaCard
        title="Night Drive"
        subtitle={<Text>Mara Vell</Text>}
        titleAccessory={<Text>E</Text>}
        titleLeading={<Text>▶</Text>}
        artworkOverlay={<Text>12</Text>}
        footer={<Text>12 min left</Text>}
        artworkSize={96}
        artworkRadius={12}
        renderArtwork={() => <Text>Cover</Text>}
        eyebrow="12 Sep"
        description="A late drive."
        loading
        accessibilityLabel="Night Drive, album"
      />
    ),
  },
  {
    name: 'MediaCard row with a trailing slot, selected',
    language: () =>
      toElement(
        L.MediaCard('Night Drive', { trailing: L.Text('3:45'), selected: true, current: true })
          .style('row')
          .size('small'),
      ),
    bloom: () => (
      <MediaCard
        title="Night Drive"
        trailing={<Text>3:45</Text>}
        selected
        current
        layout="row"
        size="small"
      />
    ),
  },
  {
    name: 'MediaCard skeleton',
    language: () => toElement(L.MediaCard('Night Drive', { skeleton: true })),
    bloom: () => <MediaCard title="Night Drive" skeleton />,
  },
  ...ENUMS.mediaCardLayout.map((layout) => ({
    name: `SongCard ${layout}`,
    language: () =>
      toElement(
        L.SongCard('Night Drive', {
          ...PLAYS,
          artists: ['Mara Vell', { name: 'Juno Park', id: 'j' }],
          onPressArtist: press,
          album: 'Late Hours',
          explicit: true,
          duration: '3:45',
          liked: true,
          onLikedChange: press,
          playing: true,
        }).style(layout),
      ),
    bloom: () => (
      <SongCard
        title="Night Drive"
        {...PLAYS}
        artists={['Mara Vell', { name: 'Juno Park', id: 'j' }]}
        onPressArtist={press}
        album="Late Hours"
        explicit
        duration="3:45"
        liked
        onLikedChange={press}
        playing
        layout={layout}
      />
    ),
  })),
  {
    name: 'AlbumCard',
    language: () =>
      toElement(
        L.AlbumCard('Late Hours', { ...PLAYS, artist: 'Mara Vell', year: '2026', albumType: 'ep' }),
      ),
    bloom: () => (
      <AlbumCard title="Late Hours" {...PLAYS} artist="Mara Vell" year="2026" albumType="ep" />
    ),
  },
  {
    name: 'ArtistCard verified, large',
    language: () =>
      toElement(
        L.ArtistCard('Mara Vell', { ...PLAYS, verified: true, followers: '1.2M followers' }).size(
          'large',
        ),
      ),
    bloom: () => (
      <ArtistCard name="Mara Vell" {...PLAYS} verified followers="1.2M followers" size="large" />
    ),
  },
  {
    name: 'PlaylistCard mosaic, collaborative',
    language: () =>
      toElement(
        L.PlaylistCard('Focus', {
          onPlay: press,
          owner: 'Maya',
          trackCount: '42 songs',
          mosaic: [COVER, COVER, COVER, COVER],
          collaborative: true,
        }),
      ),
    bloom: () => (
      <PlaylistCard
        title="Focus"
        onPlay={press}
        owner="Maya"
        trackCount="42 songs"
        mosaic={[COVER, COVER, COVER, COVER]}
        collaborative
      />
    ),
  },
  {
    name: 'MixCard',
    language: () =>
      toElement(
        L.MixCard('Daily Mix 1', {
          onPlay: press,
          artworkColor: '#3a6ea5',
          faces: [FACE, FACE],
          description: 'Mara Vell, Juno Park and more',
        }),
      ),
    bloom: () => (
      <MixCard
        title="Daily Mix 1"
        onPlay={press}
        artworkColor="#3a6ea5"
        faces={[FACE, FACE]}
        description="Mara Vell, Juno Park and more"
      />
    ),
  },
  {
    name: 'PodcastCard',
    language: () => toElement(L.PodcastCard('Field Notes', { ...PLAYS, publisher: 'Oxy Audio' })),
    bloom: () => <PodcastCard title="Field Notes" {...PLAYS} publisher="Oxy Audio" />,
  },
  ...ENUMS.mediaCardLayout.map((layout) => ({
    name: `EpisodeCard ${layout}, in progress`,
    language: () =>
      toElement(
        L.EpisodeCard('Rivers', {
          ...PLAYS,
          show: 'Field Notes',
          date: '12 Sep',
          duration: '48 min',
          description: 'Where the water goes.',
          progress: 0.4,
          remaining: '29 min left',
          actions: L.Text('Save'),
        }).style(layout),
      ),
    bloom: () => (
      <EpisodeCard
        title="Rivers"
        {...PLAYS}
        show="Field Notes"
        date="12 Sep"
        duration="48 min"
        description="Where the water goes."
        progress={0.4}
        remaining="29 min left"
        actions={<Text>Save</Text>}
        layout={layout}
      />
    ),
  })),
  {
    name: 'EpisodeCard played',
    language: () => toElement(L.EpisodeCard('Rivers', { show: 'Field Notes', played: true })),
    bloom: () => <EpisodeCard title="Rivers" show="Field Notes" played />,
  },
  {
    name: 'AudiobookCard',
    language: () =>
      toElement(
        L.AudiobookCard('The Long Shore', {
          ...PLAYS,
          author: 'Ines Calder',
          narrator: 'Ana Lima',
          duration: '11 h 20 min',
          progress: 0.25,
        }),
      ),
    bloom: () => (
      <AudiobookCard
        title="The Long Shore"
        {...PLAYS}
        author="Ines Calder"
        narrator="Ana Lima"
        duration="11 h 20 min"
        progress={0.25}
      />
    ),
  },
  ...ENUMS.mediaCardSize.map((size) => ({
    name: `GenreCard ${size}`,
    language: () =>
      toElement(
        L.GenreCard('Jazz', { color: '#8a4fff', artwork: COVER }).size(size).onPress(press),
      ),
    bloom: () => (
      <GenreCard title="Jazz" color="#8a4fff" artwork={COVER} size={size} onPress={press} />
    ),
  })),
  {
    name: 'EventCard',
    language: () =>
      toElement(
        L.EventCard('Mara Vell live', {
          month: 'Oct',
          day: '14',
          image: COVER,
          venue: 'Coliseu',
          city: 'Lisbon',
          time: 'Fri 20:00',
          action: L.Text('Tickets'),
        }),
      ),
    bloom: () => (
      <EventCard
        title="Mara Vell live"
        month="Oct"
        day="14"
        image={COVER}
        venue="Coliseu"
        city="Lisbon"
        time="Fri 20:00"
        action={<Text>Tickets</Text>}
      />
    ),
  },
  {
    name: 'EventCard sold out, row',
    language: () =>
      toElement(
        L.EventCard('Mara Vell live', { month: 'Oct', day: '14', soldOut: true }).style('row'),
      ),
    bloom: () => <EventCard title="Mara Vell live" month="Oct" day="14" soldOut layout="row" />,
  },
  {
    name: 'ProfileCard',
    language: () =>
      toElement(
        L.ProfileCard('Maya', {
          artwork: FACE,
          followsYou: true,
          followers: '214 followers',
          action: L.Text('Follow'),
        }),
      ),
    bloom: () => (
      <ProfileCard
        name="Maya"
        artwork={FACE}
        followsYou
        followers="214 followers"
        action={<Text>Follow</Text>}
      />
    ),
  },
  {
    name: 'FriendActivityCard',
    language: () =>
      toElement(
        L.FriendActivityCard('Maya', {
          avatar: FACE,
          track: 'Night Drive',
          artist: 'Mara Vell',
          context: 'Late Hours',
          contextType: 'album',
          time: '12 min',
        }).onPress(press),
      ),
    bloom: () => (
      <FriendActivityCard
        name="Maya"
        avatar={FACE}
        track="Night Drive"
        artist="Mara Vell"
        context="Late Hours"
        contextType="album"
        time="12 min"
        onPress={press}
      />
    ),
  },
  {
    name: 'QuickAccessTile playing, round',
    language: () =>
      toElement(
        L.QuickAccessTile('Mara Vell', { artwork: FACE, round: true, onPlay: press, playing: true })
          .loading()
          .onPress(press),
      ),
    bloom: () => (
      <QuickAccessTile
        title="Mara Vell"
        artwork={FACE}
        round
        onPlay={press}
        playing
        loading
        onPress={press}
      />
    ),
  },
  {
    name: 'RecapCard',
    language: () =>
      toElement(
        L.RecapCard('48,210', {
          eyebrow: 'Your 2026 in sound',
          unit: 'minutes listened',
          artworkColor: '#3a6ea5',
          highlights: [
            { label: 'Top artist', title: 'Mara Vell', artwork: FACE, round: true },
            { label: 'Top song', title: 'Night Drive', artwork: COVER },
          ],
          onShare: press,
        }),
      ),
    bloom: () => (
      <RecapCard
        value="48,210"
        eyebrow="Your 2026 in sound"
        unit="minutes listened"
        artworkColor="#3a6ea5"
        highlights={[
          { label: 'Top artist', title: 'Mara Vell', artwork: FACE, round: true },
          { label: 'Top song', title: 'Night Drive', artwork: COVER },
        ]}
        onShare={press}
      />
    ),
  },
  {
    name: 'ShareCard',
    language: () =>
      toElement(
        L.ShareCard('Night Drive', {
          artist: 'Mara Vell',
          artwork: COVER,
          lyrics: ['The road hums low', 'and the lights go by'],
          explicit: true,
          footer: L.Text('oxy.so'),
        }),
      ),
    bloom: () => (
      <ShareCard
        title="Night Drive"
        artist="Mara Vell"
        artwork={COVER}
        lyrics={['The road hums low', 'and the lights go by']}
        explicit
        footer={<Text>oxy.so</Text>}
      />
    ),
  },
];

/** Live listening: the bars move on the JS thread, so Jest compares it as it mounts, not Chrome. */
export const MEDIA_CARD_MOVING_CASES: ParityCase[] = [
  {
    name: 'FriendActivityCard live',
    language: () =>
      toElement(
        L.FriendActivityCard('Maya', {
          avatar: FACE,
          track: 'Night Drive',
          artist: 'Mara Vell',
          live: true,
        }),
      ),
    bloom: () => (
      <FriendActivityCard name="Maya" avatar={FACE} track="Night Drive" artist="Mara Vell" live />
    ),
  },
];

export const MEDIA_CARD_CASES: ParityCase[] = [...sizes, ...cards];
