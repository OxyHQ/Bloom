import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { MusicApp } from './MusicApp';
import { StudioApp } from './StudioPages';

/**
 * The music streaming template: one app with a shared player — a fake playback
 * clock that every play button, now-playing row, the bar, the mini player, the
 * queue and the lyrics follow. Pages navigate for real (cards, links, the
 * library, back and forward). From 768 wide it is the three-pane desktop app
 * over the now-playing bar; below, a phone app with the mini player above the
 * tab bar and the full player over everything. The creator studio is a
 * separate app frame.
 */
const meta: Meta = {
  title: 'Templates/Music',
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj;

/** The home feed: filter chips, quick access, mixes, episodes to finish, releases, artists, shows, audiobooks, concerts. The side pane shows the now-playing card from 1280 wide. */
export const Home: Story = {
  render: () => <MusicApp />,
};

/** An album with two discs, the compact top bar once the header scrolls away, and more by the artist. */
export const Album: Story = {
  render: () => <MusicApp route={{ name: 'album', id: 'lanterns-over-kessel-bay' }} />,
};

/** The listener's own playlist: drag or Alt+arrows to reorder, select rows for the selection bar, edit details, recommended songs. */
export const Playlist: Story = {
  render: () => <MusicApp route={{ name: 'playlist', id: 'late-night-drive' }} />,
};

/** Liked Songs follows the player's likes. */
export const LikedSongs: Story = {
  name: 'Liked songs',
  render: () => <MusicApp route={{ name: 'playlist', id: 'liked' }} />,
};

/** The artist: hero, popular tracks, the artist pick, discography by type, fans also like, tour dates, about. */
export const Artist: Story = {
  render: () => <MusicApp route={{ name: 'artist', id: 'lumen-vale' }} />,
};

/** Search before typing: recent searches and the browse grid. */
export const Search: Story = {
  render: () => <MusicApp route={{ name: 'search' }} />,
};

/** Search with a query: result tabs, the top result beside songs, then artists, albums, playlists and shows. */
export const SearchResults: Story = {
  name: 'Search results',
  render: () => <MusicApp route={{ name: 'search', query: 'lumen' }} />,
};

/** A show, with an episode playing: the bar switches to the podcast transport (speed, back 15, forward 30, sleep timer). */
export const Podcast: Story = {
  render: () => <MusicApp route={{ name: 'podcast', id: 'quiet-cartography' }} loaded="episode" />,
};

/** One episode, resuming where the listener stopped. */
export const Episode: Story = {
  render: () => <MusicApp route={{ name: 'episode', id: 'quiet-cartography-ep-1' }} loaded="episode" />,
};

/** The full player, playing: immersive on desktop with the lyrics following the clock; the phone's expanded player. */
export const NowPlaying: Story = {
  name: 'Now playing',
  render: () => <MusicApp fullPlayerOpen playing />,
};

/** The side pane on lyrics, following playback. */
export const Lyrics: Story = {
  render: () => <MusicApp playing sidePane="lyrics" />,
};

/** The side pane on the queue. */
export const Queue: Story = {
  render: () => <MusicApp sidePane="queue" />,
};

/** The device picker open from the now-playing bar. */
export const DevicePicker: Story = {
  name: 'Device picker',
  render: () => <MusicApp devicePickerOpen />,
};

/** Playing on another device: the lit device button and the connect banner. */
export const ListeningElsewhere: Story = {
  name: 'Listening on another device',
  render: () => <MusicApp deviceId="living" playing />,
};

/** The listener's profile: top artists, public playlists, followers, the year's recap and a share card. */
export const ProfileAndRecap: Story = {
  name: 'Profile & recap',
  render: () => <MusicApp route={{ name: 'profile' }} />,
};

/** The creator studio dashboard. */
export const CreatorStudio: Story = {
  name: 'Creator studio',
  render: () => <StudioApp />,
};

/** The release catalogue. */
export const StudioReleases: Story = {
  name: 'Creator studio — releases',
  render: () => <StudioApp initialPage="releases" />,
};

/** The new-release flow: uploads, metadata, credits, artwork, timeline and pitch. */
export const StudioNewRelease: Story = {
  name: 'Creator studio — new release',
  render: () => <StudioApp initialPage="new-release" />,
};
