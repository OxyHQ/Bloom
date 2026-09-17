import React, { useState } from 'react';
import { View } from 'react-native';

import { EpisodeHeader, PodcastShowHeader } from '../../src/media-header';
import { Shelf } from '../../src/media-shelf';
import { useTheme } from '../../src/theme/use-theme';
import { EpisodeList, type Episode } from '../../src/track-list';
import { Text } from '../../src/typography';
import { EPISODE_BY_ID, SHOWS, SHOW_BY_ID, episodesOf, type DemoEpisode } from './data';
import {
  PageBody,
  PageScroll,
  PodcastTile,
  SectionTitle,
  episodeProgress,
  showPlay,
  useMusicLayout,
  usePageWidth,
} from './parts';
import { usePlayer, usePosition } from './PlayerContext';
import { useMusicRouter } from './router';

/**
 * A show and one of its episodes. Playing an episode switches the now-playing
 * bar to its podcast transport (speed, back 15, forward 30, sleep timer), and
 * the progress bars here follow the clock.
 */

function useEpisodeLibrary() {
  const [saved, setSaved] = useState<ReadonlySet<string>>(() => new Set(['quiet-cartography-ep-2']));
  const [downloaded, setDownloaded] = useState<ReadonlySet<string>>(() => new Set(['quiet-cartography-ep-1']));
  const toggle = (set: ReadonlySet<string>, id: string, on: boolean) => {
    const next = new Set(set);
    if (on) next.add(id);
    else next.delete(id);
    return next;
  };
  return {
    saved,
    downloaded,
    setSaved: (id: string, on: boolean) => setSaved((s) => toggle(s, id, on)),
    setDownloaded: (id: string, on: boolean) => setDownloaded((s) => toggle(s, id, on)),
  };
}

/** Plays `episode` from its show, resuming where the listener stopped. */
function usePlayEpisode() {
  const player = usePlayer();
  return (episode: DemoEpisode, resumeAt?: number) => {
    if (player.current?.id === episode.id) {
      player.toggle();
      return;
    }
    const play = showPlay(SHOW_BY_ID[episode.showId]!);
    player.play(
      play.items,
      play.items.findIndex((p) => p.id === episode.id),
      play.context,
    );
    if (resumeAt && !episode.played) setTimeout(() => player.seek(resumeAt), 0);
  };
}

function LiveEpisodeList({
  episodes,
  library,
}: {
  episodes: DemoEpisode[];
  library: ReturnType<typeof useEpisodeLibrary>;
}) {
  const player = usePlayer();
  const position = usePosition();
  const router = useMusicRouter();
  const playEpisode = usePlayEpisode();
  const { gutter } = useMusicLayout();
  const width = usePageWidth() - gutter * 2;
  const list: Episode[] = episodes.map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    cover: SHOW_BY_ID[e.showId]!.artwork,
    date: e.date,
    duration: e.duration,
    progress: episodeProgress(e, player.current?.id, position),
    played: e.played && player.current?.id !== e.id,
    saved: library.saved.has(e.id),
    downloaded: library.downloaded.has(e.id),
  }));
  return (
    <EpisodeList
      testID="music-episodes"
      episodes={list}
      width={Math.min(width, 900)}
      currentEpisodeId={player.current?.id}
      isPlaying={player.playing}
      onPlay={(episode) => playEpisode(EPISODE_BY_ID[episode.id]!, episode.progress)}
      onPause={() => player.toggle()}
      onPress={(episode) => router.navigate({ name: 'episode', id: episode.id })}
      onSavedChange={(episode, on) => library.setSaved(episode.id, on)}
      onDownloadedChange={(episode, on) => library.setDownloaded(episode.id, on)}
      menuItems={(episode) => [
        {
          key: 'queue',
          label: 'Add to queue',
          onPress: () =>
            player.addToQueue(
              showPlay(SHOW_BY_ID[EPISODE_BY_ID[episode.id]!.showId]!).items.filter((p) => p.id === episode.id),
            ),
        },
        { key: 'share', label: 'Share episode', onPress: () => {} },
      ]}
    />
  );
}

export function PodcastPage({ id }: { id: string }) {
  const show = SHOW_BY_ID[id]!;
  const player = usePlayer();
  const router = useMusicRouter();
  const { gutter, tileSize } = useMusicLayout();
  const [following, setFollowing] = useState(id === 'quiet-cartography');
  const library = useEpisodeLibrary();
  const playEpisode = usePlayEpisode();
  const episodes = episodesOf(id);
  const latest = episodes[0]!;

  return (
    <PageScroll key={id} testID="music-podcast">
      <PodcastShowHeader
        title={show.title}
        cover={show.artwork}
        artworkColor={show.artworkColor}
        publisher={show.publisher}
        onPublisherPress={() => {}}
        rating={show.rating}
        ratingCount={show.ratingCount}
        categories={show.categories}
        onCategoryPress={() => router.navigate({ name: 'search' })}
        following={following}
        onFollowChange={setFollowing}
        description={show.description}
        latestEpisode={{
          title: latest.title,
          date: latest.date,
          duration: `${Math.round(latest.duration / 60)} min`,
          description: latest.description,
          onPress: () => router.navigate({ name: 'episode', id: latest.id }),
          playing: player.current?.id === latest.id && player.playing,
          onPlayPress: () => playEpisode(latest, latest.progress),
        }}
      />
      <PageBody gap={40}>
        <View style={{ gap: 8, maxWidth: 900 }}>
          <SectionTitle>All episodes</SectionTitle>
          <LiveEpisodeList episodes={episodes} library={library} />
        </View>
        <Shelf title="You might also like" contentInset={gutter}>
          {SHOWS.filter((s) => s.id !== id).map((s) => (
            <PodcastTile key={s.id} id={s.id} size={tileSize} />
          ))}
        </Shelf>
      </PageBody>
    </PageScroll>
  );
}

function LiveEpisodeHeader({ episode }: { episode: DemoEpisode }) {
  const player = usePlayer();
  const position = usePosition();
  const router = useMusicRouter();
  const playEpisode = usePlayEpisode();
  const show = SHOW_BY_ID[episode.showId]!;
  const [saved, setSaved] = useState(false);
  const [download, setDownload] = useState<'idle' | 'downloaded'>('idle');
  const listened = episodeProgress(episode, player.current?.id, position);
  const current = player.current?.id === episode.id;
  return (
    <EpisodeHeader
      title={episode.title}
      cover={show.artwork}
      artworkColor={show.artworkColor}
      showTitle={show.title}
      onShowPress={() => router.navigate({ name: 'podcast', id: show.id })}
      date={episode.longDate}
      duration={`${Math.round(episode.duration / 60)} min`}
      playing={current && player.playing}
      onPlayPress={() => playEpisode(episode, listened)}
      progress={listened !== undefined ? listened / episode.duration : undefined}
      remainingLabel={
        listened !== undefined ? `${Math.max(1, Math.round((episode.duration - listened) / 60))} min left` : undefined
      }
      saved={saved}
      onSavedChange={setSaved}
      onSharePress={() => {}}
      download={download}
      onDownloadPress={() => setDownload((d) => (d === 'idle' ? 'downloaded' : 'idle'))}
      onMorePress={() => {}}
    />
  );
}

export function EpisodePage({ id }: { id: string }) {
  const episode = EPISODE_BY_ID[id]!;
  const theme = useTheme();
  const library = useEpisodeLibrary();
  const others = episodesOf(episode.showId).filter((e) => e.id !== id);

  return (
    <PageScroll key={id} testID="music-episode">
      <LiveEpisodeHeader episode={episode} />
      <PageBody gap={40}>
        <View style={{ gap: 12, maxWidth: 720 }}>
          <SectionTitle>Episode description</SectionTitle>
          <Text variant="body-regular" style={{ color: theme.colors.textSecondary }}>
            {episode.description} Recorded on location with the archivists, sailors and cartographers who still keep the
            story going. Chapters: 00:00 Cold open · 04:12 The first sighting · 18:40 A second expedition · 31:05 What
            the soundings said.
          </Text>
        </View>
        <View style={{ gap: 8, maxWidth: 900 }}>
          <SectionTitle>More episodes</SectionTitle>
          <LiveEpisodeList episodes={others} library={library} />
        </View>
      </PageBody>
    </PageScroll>
  );
}
