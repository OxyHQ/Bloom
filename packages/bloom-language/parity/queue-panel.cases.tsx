import { QueuePanel, QueuePanelRow, RecentlyPlayedList } from '@oxy.so/bloom/queue-panel';
import { Text } from '@oxy.so/bloom/typography';

import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/index';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

const press = () => {};
const COVER = 'https://cdn.oxy.so/cover.jpg';
const NOW = { id: 'n', title: 'Night Drive', artists: 'Lumen Vale', cover: COVER, meta: '3:45' };
const QUEUE = [
  { id: 'a', title: 'Tidewater', artists: 'The Quiet Orchard', cover: COVER, meta: '4:02' },
  { id: 'b', title: 'Slow Mornings', artists: 'Maya', explicit: true, meta: '2:58' },
];
const CONTEXT = [{ id: 'c', title: 'Glasshouse', artists: 'Lumen Vale', meta: '3:11' }];
const RECENT = [{ id: 'r', title: 'Harbour Lights', artists: 'Maya', meta: '2 hours ago' }];
const TRACK = QUEUE[0] as (typeof QUEUE)[number];

export const QUEUE_PANEL_CASES: ParityCase[] = [
  ...ENUMS.queuePanelStyle.map((variant) => ({
    name: `QueuePanel ${variant}`,
    language: () =>
      toElement(
        L.QueuePanel({
          nowPlaying: NOW,
          playing: false,
          queue: QUEUE,
          context: CONTEXT,
          contextName: 'Night Drive',
          onReorder: press,
          onRemove: press,
          onPlay: press,
          onClearQueue: press,
          onClose: press,
          width: '320',
        }).style(variant),
      ),
    bloom: () => (
      <QueuePanel
        nowPlaying={NOW}
        playing={false}
        queue={QUEUE}
        context={CONTEXT}
        contextName="Night Drive"
        onReorder={press}
        onRemove={press}
        onPlay={press}
        onClearQueue={press}
        onClose={press}
        width={320}
        variant={variant}
      />
    ),
  })),
  {
    name: 'QueuePanel recently played',
    language: () => toElement(L.QueuePanel({ recentlyPlayed: RECENT, tab: 'recent' })),
    bloom: () => <QueuePanel recentlyPlayed={RECENT} tab="recent" />,
  },
  {
    name: 'QueuePanel empty',
    language: () => toElement(L.QueuePanel({ onClose: press })),
    bloom: () => <QueuePanel onClose={press} />,
  },
  {
    name: 'QueuePanelRow',
    language: () => toElement(L.QueuePanelRow(TRACK, { trailing: L.Text('More') }).onPress(press)),
    bloom: () => <QueuePanelRow track={TRACK} trailing={<Text>More</Text>} onPress={press} />,
  },
  {
    name: 'QueuePanelRow current, paused, highlighted, named',
    language: () =>
      toElement(
        L.QueuePanelRow(TRACK, { current: true, playing: false, highlighted: true })
          .label('Play Tidewater now')
          .onPress(press),
      ),
    bloom: () => (
      <QueuePanelRow
        track={TRACK}
        current
        playing={false}
        highlighted
        accessibilityLabel="Play Tidewater now"
        onPress={press}
      />
    ),
  },
  {
    name: 'RecentlyPlayedList',
    language: () =>
      toElement(
        L.RecentlyPlayedList([...RECENT, ...QUEUE], {
          onPlay: press,
          currentId: 'a',
          playing: false,
        }),
      ),
    bloom: () => (
      <RecentlyPlayedList
        items={[...RECENT, ...QUEUE]}
        onPlay={press}
        currentId="a"
        playing={false}
      />
    ),
  },
  {
    name: 'RecentlyPlayedList empty',
    language: () => toElement(L.RecentlyPlayedList([])),
    bloom: () => <RecentlyPlayedList items={[]} />,
  },
];
