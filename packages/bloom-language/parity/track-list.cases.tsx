import { RiDeleteBinLine, RiPlayListAddLine } from '@oxy.so/bloom/icons';
import {
  EpisodeList,
  EpisodeRow,
  SelectionBar,
  TrackList,
  TrackListEmpty,
  TrackListHeader,
  TrackRow,
  TrackRowSkeleton,
} from '@oxy.so/bloom/track-list';

import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/index';
import { toElement } from '../src/render';
import { type ParityCase, Themed } from './support/cases';

const press = () => {};
const set = () => {};
const COVER = 'https://cdn.oxy.so/cover.jpg';
const TRACKS = [
  {
    id: 'a',
    title: 'Lanterns Over Kessel Bay',
    artists: [{ id: 'm', name: 'Mira Vale' }],
    album: 'Low Tide Hymns',
    cover: COVER,
    duration: 214,
    plays: '4,812,330',
    dateAdded: '3 days ago',
  },
  {
    id: 'b',
    title: 'Paper Moons',
    artists: [{ name: 'Mira Vale' }, { name: 'Oren Reed' }],
    album: 'Low Tide Hymns',
    cover: COVER,
    duration: 187,
    explicit: true,
    liked: true,
    downloaded: true,
  },
  {
    id: 'c',
    title: 'Slow Orbit',
    artists: [{ name: 'Mira Vale' }],
    duration: 243,
    unavailable: true,
  },
];
const TRACK = TRACKS[0] as (typeof TRACKS)[number];
const MENU = () => [
  { key: 'queue', label: 'Add to queue', icon: RiPlayListAddLine, onPress: press },
  { key: 'remove', label: 'Remove', icon: RiDeleteBinLine, onPress: press, destructive: true },
];
const COLUMNS = ['index', 'title', 'album', 'plays', 'duration', 'actions'] as const;
const ACTIONS = [
  { key: 'queue', label: 'Add to queue', icon: RiPlayListAddLine, onPress: press },
  { key: 'remove', label: 'Remove', icon: RiDeleteBinLine, onPress: press, destructive: true },
];
const EPISODES = [
  {
    id: 'e1',
    title: 'The long way round',
    show: 'Field Notes',
    description: 'Where the river bends, and what it carries.',
    cover: COVER,
    date: '12 Mar',
    duration: 2712,
    progress: 900,
    saved: true,
  },
  { id: 'e2', title: 'Low tide', show: 'Field Notes', duration: 1800, played: true },
];
const EPISODE = EPISODES[0] as (typeof EPISODES)[number];

export const TRACK_LIST_CASES: ParityCase[] = [
  {
    name: 'TrackList, the current track paused',
    language: () =>
      toElement(
        L.TrackList(TRACKS, {
          currentTrackId: 'a',
          isPlaying: false,
          onPlay: press,
          onLikedChange: set,
          onArtistPress: press,
          menuItems: MENU,
          showDownloaded: true,
          width: '768',
        }).label('Album'),
      ),
    bloom: () => (
      <TrackList
        tracks={TRACKS}
        currentTrackId="a"
        isPlaying={false}
        onPlay={press}
        onLikedChange={set}
        onArtistPress={press}
        menuItems={MENU}
        showDownloaded
        width={768}
        accessibilityLabel="Album"
      />
    ),
  },
  {
    name: 'TrackList compact, selected, reorderable, header tinted',
    language: () =>
      toElement(
        L.TrackList(TRACKS, {
          columns: [...COLUMNS],
          selectedIds: ['b'],
          onSelectionChange: set,
          reorderable: true,
          onReorder: set,
          stickyHeaderOffset: '56',
          width: '640',
        })
          .density('compact')
          .tint('surface'),
      ),
    bloom: () => (
      <Themed>
        {(colors) => (
          <TrackList
            tracks={TRACKS}
            columns={[...COLUMNS]}
            selectedIds={['b']}
            onSelectionChange={set}
            reorderable
            onReorder={set}
            stickyHeaderOffset={56}
            width={640}
            density="compact"
            headerBackground={colors.backgroundSecondary}
          />
        )}
      </Themed>
    ),
  },
  {
    name: 'TrackList narrow, grouped',
    language: () =>
      toElement(
        L.TrackList(TRACKS, {
          groups: [
            { key: 'd1', title: 'Disc 1', startIndex: 0 },
            { key: 'd2', title: 'Disc 2', startIndex: 2 },
          ],
          width: '360',
        }),
      ),
    bloom: () => (
      <TrackList
        tracks={TRACKS}
        groups={[
          { key: 'd1', title: 'Disc 1', startIndex: 0 },
          { key: 'd2', title: 'Disc 2', startIndex: 2 },
        ]}
        width={360}
      />
    ),
  },
  ...ENUMS.density.map((density) => ({
    name: `TrackListHeader ${density}`,
    language: () =>
      toElement(
        L.TrackListHeader([...COLUMNS], {
          reorderable: true,
          likeable: true,
          hasMenu: true,
        }).density(density),
      ),
    bloom: () => (
      <TrackListHeader
        columns={[...COLUMNS]}
        reorderable
        likeable
        hasMenu
        density={density === 'compact' ? 'compact' : 'comfortable'}
      />
    ),
  })),
  {
    name: 'TrackRow current, paused',
    language: () =>
      toElement(
        L.TrackRow(TRACK, 0, {
          columns: [...COLUMNS],
          current: true,
          playing: false,
          onPlay: press,
          onLikedChange: set,
          menuItems: MENU,
          width: '768',
        }).onPress(press),
      ),
    bloom: () => (
      <TrackRow
        track={TRACK}
        index={0}
        columns={[...COLUMNS]}
        current
        playing={false}
        onPlay={press}
        onLikedChange={set}
        menuItems={MENU}
        width={768}
        onPress={press}
      />
    ),
  },
  {
    name: 'TrackRow compact, selected, reorderable',
    language: () =>
      toElement(
        L.TrackRow(TRACKS[1] as typeof TRACK, 1, {
          selected: true,
          reorderable: true,
          onMoveUp: set,
          onMoveDown: set,
          showDownloaded: true,
          width: '640',
        }).density('compact'),
      ),
    bloom: () => (
      <TrackRow
        track={TRACKS[1] as typeof TRACK}
        index={1}
        selected
        reorderable
        onMoveUp={set}
        onMoveDown={set}
        showDownloaded
        width={640}
        density="compact"
      />
    ),
  },
  {
    name: 'TrackRowSkeleton',
    language: () => toElement(L.TrackRowSkeleton({ count: 3, width: '768' })),
    bloom: () => <TrackRowSkeleton count={3} width={768} />,
  },
  {
    name: 'TrackRowSkeleton compact',
    language: () =>
      toElement(L.TrackRowSkeleton({ columns: [...COLUMNS], width: '360' }).density('compact')),
    bloom: () => <TrackRowSkeleton columns={[...COLUMNS]} width={360} density="compact" />,
  },
  {
    name: 'TrackListEmpty',
    language: () =>
      toElement(
        L.TrackListEmpty('Nothing here yet', {
          description: 'Songs you like show up here.',
          actionLabel: 'Find songs',
          onAction: press,
        }),
      ),
    bloom: () => (
      <TrackListEmpty
        title="Nothing here yet"
        description="Songs you like show up here."
        actionLabel="Find songs"
        onAction={press}
      />
    ),
  },
  ...ENUMS.selectionBarPlacement.map((placement) => ({
    name: `SelectionBar ${placement}`,
    language: () =>
      toElement(L.SelectionBar(2, ACTIONS, { onClear: press, width: '768' }).style(placement)),
    bloom: () => (
      <SelectionBar count={2} actions={ACTIONS} onClear={press} width={768} placement={placement} />
    ),
  })),
  {
    name: 'SelectionBar narrow',
    language: () =>
      toElement(
        L.SelectionBar(3, ACTIONS, {
          onClear: press,
          clearLabel: 'Clear',
          formatCount: (count) => `${count} songs`,
          width: '360',
        }).style('inline'),
      ),
    bloom: () => (
      <SelectionBar
        count={3}
        actions={ACTIONS}
        onClear={press}
        clearLabel="Clear"
        formatCount={(count) => `${count} songs`}
        width={360}
        placement="inline"
      />
    ),
  },
  {
    name: 'EpisodeRow',
    language: () =>
      toElement(
        L.EpisodeRow(EPISODE, {
          index: 0,
          current: true,
          playing: false,
          onPlay: press,
          onSavedChange: set,
          onDownloadedChange: set,
          menuItems: MENU,
          divider: true,
          width: '768',
        }).onPress(press),
      ),
    bloom: () => (
      <EpisodeRow
        episode={EPISODE}
        index={0}
        current
        playing={false}
        onPlay={press}
        onSavedChange={set}
        onDownloadedChange={set}
        menuItems={MENU}
        divider
        width={768}
        onPress={press}
      />
    ),
  },
  {
    name: 'EpisodeRow narrow, played',
    language: () => toElement(L.EpisodeRow(EPISODES[1] as typeof EPISODE, { width: '360' })),
    bloom: () => <EpisodeRow episode={EPISODES[1] as typeof EPISODE} width={360} />,
  },
  {
    name: 'EpisodeList',
    language: () =>
      toElement(
        L.EpisodeList(EPISODES, {
          currentEpisodeId: 'e1',
          isPlaying: true,
          onPlay: press,
          onPress: press,
          onSavedChange: set,
          width: '768',
        }).label('Field Notes'),
      ),
    bloom: () => (
      <EpisodeList
        episodes={EPISODES}
        currentEpisodeId="e1"
        isPlaying
        onPlay={press}
        onPress={press}
        onSavedChange={set}
        width={768}
        accessibilityLabel="Field Notes"
      />
    ),
  },
];

/**
 * The now-playing bars loop while a track plays, so two side by side (the
 * story's pairs) are read at different frames. Compared by the Jest suites, as
 * they mount, and left out of the story.
 */
export const TRACK_LIST_CASES_MOVING: ParityCase[] = [
  {
    name: 'TrackList, the current track playing',
    language: () =>
      toElement(
        L.TrackList(TRACKS, {
          currentTrackId: 'a',
          isPlaying: true,
          onPlay: press,
          onLikedChange: set,
          onArtistPress: press,
          menuItems: MENU,
          showDownloaded: true,
          width: '768',
        }).label('Album'),
      ),
    bloom: () => (
      <TrackList
        tracks={TRACKS}
        currentTrackId="a"
        isPlaying
        onPlay={press}
        onLikedChange={set}
        onArtistPress={press}
        menuItems={MENU}
        showDownloaded
        width={768}
        accessibilityLabel="Album"
      />
    ),
  },
  {
    name: 'TrackRow current, playing',
    language: () =>
      toElement(
        L.TrackRow(TRACK, 0, {
          columns: [...COLUMNS],
          current: true,
          playing: true,
          onPlay: press,
          onLikedChange: set,
          menuItems: MENU,
          width: '768',
        }).onPress(press),
      ),
    bloom: () => (
      <TrackRow
        track={TRACK}
        index={0}
        columns={[...COLUMNS]}
        current
        playing
        onPlay={press}
        onLikedChange={set}
        menuItems={MENU}
        width={768}
        onPress={press}
      />
    ),
  },
];
