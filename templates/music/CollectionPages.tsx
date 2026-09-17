import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

import { Button } from '../../src/button';
import { Dialog, useDialogControl } from '../../src/dialog';
import {
  RiAddLine,
  RiDeleteBinLine,
  RiHeart3Line,
  RiPlayListAddLine,
  RiRefreshLine,
  RiUserLine,
} from '../../src/icons/remix';
import { MediaCard } from '../../src/media-card';
import { formatDuration } from '../../src/media-controls';
import {
  CollectionHeader,
  MediaActionBar,
  StickyMediaTopBar,
  useMediaHeaderScroll,
  type DownloadState,
  type MediaViewMode,
} from '../../src/media-header';
import { Shelf } from '../../src/media-shelf';
import { TextFieldInput } from '../../src/text-field';
import { useTheme } from '../../src/theme/use-theme';
import { SelectionBar, TrackList, TrackListEmpty, type Track, type TrackMenuItem } from '../../src/track-list';
import { Text } from '../../src/typography';
import {
  ALBUM_BY_ID,
  ARTIST_BY_ID,
  ME,
  MIX_BY_ID,
  PLAYLIST_BY_ID,
  TRACKS,
  TRACK_BY_ID,
  albumsBy,
  cover,
  tracksOf,
} from './data';
import {
  AlbumTile,
  BackButton,
  PageBody,
  PageScroll,
  SectionTitle,
  albumPlay,
  useContextPlay,
  useMusicLayout,
} from './parts';
import { playableFromTrack, playablesFromTrackIds, toListTrack, usePlayer, type PlayContext } from './PlayerContext';
import { useMusicRouter } from './router';

/**
 * The collection pages: an album (disc groups, more by the artist), a playlist
 * the listener owns (reorder, edit details, date added, bulk actions on a
 * selection, recommended songs), Liked Songs and a generated mix. Each has the
 * header band, the action bar, and the compact top bar that takes over once
 * the header scrolls away.
 */

function summaryOf(trackIds: readonly string[]): string {
  const seconds = trackIds.reduce((sum, id) => sum + TRACK_BY_ID[id]!.duration, 0);
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return `${trackIds.length} songs, ${h > 0 ? `${h} hr ` : ''}${m} min`;
}

/** Idle → downloading (a fake progress) → downloaded, and back to idle. */
function useFakeDownload(): { state: DownloadState; progress: number; press: () => void } {
  const [state, setState] = useState<DownloadState>('idle');
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (state !== 'downloading') return undefined;
    const id = setInterval(() => {
      setProgress((p) => {
        if (p >= 1) {
          setState('downloaded');
          return 1;
        }
        return Math.min(1, p + 0.1);
      });
    }, 200);
    return () => clearInterval(id);
  }, [state]);
  return {
    state,
    progress,
    press: () => {
      if (state === 'idle') {
        setProgress(0);
        setState('downloading');
      } else setState('idle');
    },
  };
}

/** The track table wired to the player: rows play in `context`, likes and menus go through it. */
function useTrackActions(trackIds: readonly string[], context: PlayContext) {
  const player = usePlayer();
  const router = useMusicRouter();
  const items = useMemo(() => playablesFromTrackIds(trackIds), [trackIds]);
  const menuItems = (track: Track): TrackMenuItem[] => {
    const demo = TRACK_BY_ID[track.id]!;
    return [
      {
        key: 'queue',
        label: 'Add to queue',
        icon: RiPlayListAddLine,
        onPress: () => player.addToQueue([playableFromTrack(demo)]),
      },
      {
        key: 'like',
        label: player.liked.has(track.id) ? 'Remove from Liked Songs' : 'Save to Liked Songs',
        icon: RiHeart3Line,
        onPress: () => player.setLiked(track.id, !player.liked.has(track.id)),
      },
      {
        key: 'artist',
        label: 'Go to artist',
        icon: RiUserLine,
        onPress: () => router.navigate({ name: 'artist', id: demo.artistIds[0]! }),
      },
    ];
  };
  return {
    items,
    currentTrackId: player.context?.id === context.id ? player.current?.id : undefined,
    isPlaying: player.playing,
    onPlay: (_: Track, index: number) => player.play(items, index, context),
    onPause: () => player.toggle(),
    onLikedChange: (track: Track, liked: boolean) => player.setLiked(track.id, liked),
    onArtistPress: (artist: { id?: string }) => artist.id && router.navigate({ name: 'artist', id: artist.id }),
    onAlbumPress: (track: Track) => router.navigate({ name: 'album', id: TRACK_BY_ID[track.id]!.albumId }),
    menuItems,
  };
}

// ---------------------------------------------------------------------------
//  Album
// ---------------------------------------------------------------------------

export function AlbumPage({ id }: { id: string }) {
  const album = ALBUM_BY_ID[id]!;
  const artist = ARTIST_BY_ID[album.artistId]!;
  const player = usePlayer();
  const router = useMusicRouter();
  const { mobile, gutter, tileSize } = useMusicLayout();
  const play = useMemo(() => albumPlay(album), [album]);
  const state = useContextPlay(play);
  const actions = useTrackActions(album.trackIds, play.context);
  const download = useFakeDownload();
  const [view, setView] = useState<MediaViewMode>('list');
  const { progress, onScroll } = useMediaHeaderScroll({ start: mobile ? 360 : 300 });
  const tracks = tracksOf(album).map((t) => toListTrack(t, player.liked.has(t.id), { number: t.number }));
  const groups =
    album.disc2At !== undefined
      ? [
          { key: 'disc-1', title: 'Disc 1', startIndex: 0 },
          { key: 'disc-2', title: 'Disc 2', startIndex: album.disc2At },
        ]
      : undefined;

  return (
    <PageScroll
      key={id}
      testID="music-album"
      onScroll={onScroll}
      overlay={
        <StickyMediaTopBar
          title={album.title}
          playing={state.playing}
          onPlayPress={state.onPlay}
          artworkColor={album.artworkColor}
          progress={progress}
          leading={mobile ? <BackButton /> : undefined}
        />
      }
    >
      <CollectionHeader
        typeLabel={
          album.type === 'ep'
            ? 'EP'
            : album.type === 'single'
              ? 'Single'
              : album.type === 'compilation'
                ? 'Compilation'
                : 'Album'
        }
        title={album.title}
        cover={album.artwork}
        artworkColor={album.artworkColor}
        owners={[
          {
            name: artist.name,
            avatar: artist.photo,
            onPress: () => router.navigate({ name: 'artist', id: artist.id }),
          },
        ]}
        year={album.year}
        summary={summaryOf(album.trackIds)}
        saves={album.saves}
        actions={
          <MediaActionBar
            playing={state.playing}
            onPlayPress={state.onPlay}
            playSubject={album.title}
            shuffle={player.shuffle}
            onShuffleChange={player.setShuffle}
            liked={player.liked.has(album.id)}
            onLikedChange={(on) => player.setLiked(album.id, on)}
            download={download.state}
            downloadProgress={download.progress}
            onDownloadPress={download.press}
            onMorePress={() => {}}
            view={view}
            onViewChange={setView}
          />
        }
      />
      <View style={{ paddingLeft: mobile ? 8 : gutter, paddingRight: mobile ? 8 : gutter, gap: 16 }}>
        <TrackList
          testID="music-album-tracks"
          tracks={tracks}
          columns={['index', 'title', 'plays', 'duration', 'actions']}
          density={view === 'compact' ? 'compact' : 'comfortable'}
          groups={groups}
          selectable={false}
          stickyHeaderOffset={64}
          accessibilityLabel={album.title}
          currentTrackId={actions.currentTrackId}
          isPlaying={actions.isPlaying}
          onPlay={actions.onPlay}
          onPause={actions.onPause}
          onLikedChange={actions.onLikedChange}
          onArtistPress={actions.onArtistPress}
          menuItems={actions.menuItems}
        />
        <View style={{ paddingLeft: 8, gap: 2 }}>
          <Text variant="body-2-medium">September 12, {album.year}</Text>
          <CaptionLine>
            © {album.year} {artist.name} under exclusive licence to Tidewater Records
          </CaptionLine>
        </View>
      </View>
      <View style={{ paddingTop: 32 }}>
        <PageBody>
          <Shelf
            title={`More by ${artist.name}`}
            onTitlePress={() => router.navigate({ name: 'artist', id: artist.id })}
            onShowAll={() => router.navigate({ name: 'artist', id: artist.id })}
            contentInset={gutter}
          >
            {albumsBy(artist.id)
              .filter((a) => a.id !== album.id)
              .map((a) => (
                <AlbumTile key={a.id} id={a.id} size={tileSize} showArtist={false} />
              ))}
          </Shelf>
        </PageBody>
      </View>
    </PageScroll>
  );
}

function CaptionLine({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <Text variant="caption-1-regular" style={{ color: theme.colors.textSecondary }}>
      {children}
    </Text>
  );
}

// ---------------------------------------------------------------------------
//  Playlist, Liked Songs, mix
// ---------------------------------------------------------------------------

export function PlaylistPage({ id, kind = 'playlist' }: { id: string; kind?: 'playlist' | 'mix' }) {
  const player = usePlayer();
  const router = useMusicRouter();
  const theme = useTheme();
  const { mobile, gutter, width } = useMusicLayout();
  const liked = id === 'liked';
  const mix = kind === 'mix' ? MIX_BY_ID[id] : undefined;
  const source = PLAYLIST_BY_ID[id];

  const [trackIds, setTrackIds] = useState<string[]>(() => source?.trackIds ?? mix?.trackIds ?? []);
  const [details, setDetails] = useState({
    title: liked ? 'Liked Songs' : (source?.title ?? mix?.title ?? ''),
    description: liked ? '' : (source?.description ?? mix?.description ?? ''),
  });
  const [draft, setDraft] = useState(details);
  const [selected, setSelected] = useState<string[]>([]);
  const [view, setView] = useState<MediaViewMode>('list');
  const [recommendSeed, setRecommendSeed] = useState(0);
  const editDialog = useDialogControl();
  const download = useFakeDownload();
  const { progress, onScroll } = useMediaHeaderScroll({ start: mobile ? 380 : 300 });

  // Liked Songs follows the player's likes, newest first.
  const ids = liked
    ? TRACKS.filter((t) => player.liked.has(t.id))
        .map((t) => t.id)
        .reverse()
    : trackIds;
  const context: PlayContext = { id, name: details.title, type: mix ? 'mix' : 'playlist' };
  const play = useMemo(() => ({ items: playablesFromTrackIds(ids), context }), [ids.join(','), details.title]);
  const state = useContextPlay(play);
  const actions = useTrackActions(ids, context);
  const mine = liked || !!source?.mine;
  const editable = !!source?.mine;

  const tracks = ids.map((trackId, i) =>
    toListTrack(TRACK_BY_ID[trackId]!, player.liked.has(trackId), {
      dateAdded: liked ? ['Today', 'Yesterday', '3 days ago', 'Sep 2, 2026'][Math.min(3, i)] : source?.dateAdded[i],
      downloaded: download.state === 'downloaded',
    }),
  );

  const recommended = useMemo(() => {
    const pool = TRACKS.filter((t) => !trackIds.includes(t.id));
    const start = (recommendSeed * 5 + 7) % Math.max(1, pool.length - 5);
    return pool.slice(start, start + 5);
  }, [recommendSeed, trackIds]);

  const coverImage = liked
    ? undefined
    : (source?.artwork ??
      (mix
        ? cover(mix.id, mix.artworkColor, '#fde68a')
        : cover(`${id}-mosaic`, source?.artworkColor ?? '#334155', '#94a3b8')));
  const artworkColor = source?.artworkColor ?? mix?.artworkColor;

  return (
    <View style={{ flex: 1, minHeight: 0 }}>
      <PageScroll
        key={id}
        testID="music-playlist"
        onScroll={onScroll}
        overlay={
          <StickyMediaTopBar
            title={details.title}
            playing={state.playing}
            onPlayPress={state.onPlay}
            artworkColor={liked ? theme.colors.primary : artworkColor}
            progress={progress}
            leading={mobile ? <BackButton /> : undefined}
          />
        }
      >
        <CollectionHeader
          variant={liked ? 'liked' : 'default'}
          typeLabel={liked ? 'Playlist' : mix ? 'Mix' : source?.mine ? 'Public playlist' : 'Playlist'}
          title={details.title}
          description={details.description || undefined}
          cover={coverImage}
          artworkColor={artworkColor}
          owners={[
            source && !source.mine
              ? { name: source.owner }
              : { name: ME.name, avatar: ME.avatar, onPress: () => router.navigate({ name: 'profile' }) },
            ...(source?.collaborative ? [{ name: 'Mika Oduya', avatar: ARTIST_BY_ID['odessa-rowe']!.photo }] : []),
          ]}
          summary={ids.length > 0 ? summaryOf(ids) : '0 songs'}
          saves={liked || mix ? undefined : source?.saves}
          editable={editable}
          onEdit={() => {
            setDraft(details);
            editDialog.open();
          }}
          actions={
            <MediaActionBar
              playing={state.playing}
              onPlayPress={state.onPlay}
              playSubject={details.title}
              playDisabled={ids.length === 0}
              shuffle={player.shuffle}
              onShuffleChange={player.setShuffle}
              liked={mine ? undefined : player.liked.has(id)}
              onLikedChange={mine ? undefined : (on) => player.setLiked(id, on)}
              download={download.state}
              downloadProgress={download.progress}
              onDownloadPress={download.press}
              onMorePress={() => {}}
              onSearchPress={() => router.navigate({ name: 'search' })}
              view={view}
              onViewChange={setView}
            />
          }
        />
        <View style={{ paddingLeft: mobile ? 8 : gutter, paddingRight: mobile ? 8 : gutter, gap: 16 }}>
          {tracks.length === 0 ? (
            <TrackListEmpty
              icon={RiHeart3Line}
              title="Songs you like will appear here"
              description="Save songs by tapping the heart icon."
              actionLabel="Find songs"
              onAction={() => router.navigate({ name: 'search' })}
            />
          ) : (
            <TrackList
              testID="music-playlist-tracks"
              tracks={tracks}
              columns={['index', 'title', 'album', 'dateAdded', 'duration', 'actions']}
              density={view === 'compact' ? 'compact' : 'comfortable'}
              stickyHeaderOffset={64}
              accessibilityLabel={details.title}
              currentTrackId={actions.currentTrackId}
              isPlaying={actions.isPlaying}
              onPlay={actions.onPlay}
              onPause={actions.onPause}
              onLikedChange={actions.onLikedChange}
              onArtistPress={actions.onArtistPress}
              onAlbumPress={actions.onAlbumPress}
              menuItems={(track, index) => [
                ...actions.menuItems(track),
                ...(editable
                  ? [
                      {
                        key: 'remove',
                        label: 'Remove from this playlist',
                        icon: RiDeleteBinLine,
                        destructive: true,
                        onPress: () => setTrackIds((list) => list.filter((_, i) => i !== index)),
                      },
                    ]
                  : []),
              ]}
              selectedIds={selected}
              onSelectionChange={setSelected}
              reorderable={editable}
              onReorder={(from, to) =>
                setTrackIds((list) => {
                  const next = list.slice();
                  const [moved] = next.splice(from, 1);
                  next.splice(to, 0, moved!);
                  return next;
                })
              }
              showDownloaded
            />
          )}
        </View>

        {editable ? (
          <View style={{ paddingTop: 40 }}>
            <PageBody gap={12}>
              <SectionTitle
                trailing={
                  <Button
                    variant="ghost"
                    size="small"
                    leadingIcon={RiRefreshLine}
                    onPress={() => setRecommendSeed((s) => s + 1)}
                  >
                    Refresh
                  </Button>
                }
              >
                Recommended songs
              </SectionTitle>
              <CaptionLine>Based on what’s in this playlist</CaptionLine>
              <View testID="music-recommended">
                {recommended.map((track) => (
                  <RecommendedRow
                    key={track.id}
                    trackId={track.id}
                    onAdd={() => setTrackIds((list) => [...list, track.id])}
                  />
                ))}
              </View>
            </PageBody>
          </View>
        ) : null}
      </PageScroll>

      <SelectionBar
        testID="music-selection-bar"
        count={selected.length}
        width={width}
        onClear={() => setSelected([])}
        style={{ marginBottom: mobile ? 168 : 0 }}
        actions={[
          {
            key: 'queue',
            label: 'Add to queue',
            icon: RiPlayListAddLine,
            onPress: () => {
              player.addToQueue(playablesFromTrackIds(selected));
              setSelected([]);
            },
          },
          {
            key: 'like',
            label: 'Like',
            icon: RiHeart3Line,
            onPress: () => {
              selected.forEach((trackId) => player.setLiked(trackId, true));
              setSelected([]);
            },
          },
          ...(editable
            ? [
                {
                  key: 'remove',
                  label: 'Remove',
                  icon: RiDeleteBinLine,
                  destructive: true,
                  onPress: () => {
                    setTrackIds((list) => list.filter((t) => !selected.includes(t)));
                    setSelected([]);
                  },
                },
              ]
            : []),
        ]}
      />

      <Dialog
        control={editDialog}
        title="Edit details"
        width={480}
        actions={[
          { label: 'Save', onPress: () => setDetails(draft) },
          { label: 'Cancel', color: 'cancel' },
        ]}
      >
        <View style={{ gap: 12 }}>
          <TextFieldInput
            label="Name"
            value={draft.title}
            onChangeText={(title) => setDraft((d) => ({ ...d, title }))}
          />
          <TextFieldInput
            label="Description"
            value={draft.description}
            onChangeText={(description) => setDraft((d) => ({ ...d, description }))}
          />
        </View>
      </Dialog>
    </View>
  );
}

function RecommendedRow({ trackId, onAdd }: { trackId: string; onAdd: () => void }) {
  const player = usePlayer();
  const track = TRACK_BY_ID[trackId]!;
  const album = ALBUM_BY_ID[track.albumId]!;
  const item = playableFromTrack(track);
  const current = player.current?.id === trackId;
  return (
    <MediaCard
      layout="row"
      title={track.title}
      subtitle={item.artists.map((a) => a.name).join(', ')}
      meta={[album.title]}
      artwork={album.artwork}
      artworkColor={album.artworkColor}
      typeLabel="Song"
      current={current}
      playing={current && player.playing}
      onPlay={() =>
        current
          ? player.toggle()
          : player.play([item], 0, { id: `recommended-${trackId}`, name: 'Recommended songs', type: 'playlist' })
      }
      trailing={
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <Text variant="body-2-regular">{formatDuration(track.duration)}</Text>
          <Button
            variant="secondary"
            size="small"
            leadingIcon={RiAddLine}
            onPress={onAdd}
            accessibilityLabel={`Add ${track.title} to playlist`}
          >
            Add
          </Button>
        </View>
      }
    />
  );
}
