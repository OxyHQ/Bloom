import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { QueuePanel } from './QueuePanel';
import { RecentlyPlayedList } from './RecentlyPlayedList';
import { moveQueueItem } from './shared';
import type { QueuePanelTab, QueueSection, QueueTrack } from './types';

const meta: Meta = {
  title: 'Blocks/Music/Queue Panel',
};

export default meta;

type Story = StoryObj;

// ---------------------------------------------------------------------------
//  Demo data — invented artists and records.
// ---------------------------------------------------------------------------

const cover = (seed: string) => `https://picsum.photos/seed/${seed}/120/120`;

const NOW: QueueTrack = {
  id: 'now',
  title: 'Harbour Lights',
  artists: 'Ilse Marn',
  cover: cover('harbour'),
  meta: '3:41',
};

const QUEUE: QueueTrack[] = [
  { id: 'q1', title: 'Slow Tide', artists: 'The Quiet Coast', cover: cover('tide'), meta: '4:02' },
  { id: 'q2', title: 'Paper Moons', artists: 'Juno Vale, Oren Fisk', cover: cover('moons'), meta: '2:58', explicit: true },
  { id: 'q3', title: 'Signal Fires', artists: 'Northwind Choir', cover: cover('fires'), meta: '5:10' },
];

const CONTEXT: QueueTrack[] = [
  { id: 'c1', title: 'Neon Rain', artists: 'Kestrel Park', cover: cover('neon'), meta: '3:25' },
  { id: 'c2', title: 'Overpass', artists: 'Mara Lind', cover: cover('overpass'), meta: '4:44' },
  { id: 'c3', title: 'After Hours Radio', artists: 'Kestrel Park', cover: cover('radio'), meta: '3:12' },
  { id: 'c4', title: 'Tail Lights', artists: 'Soft Engines', cover: cover('tail'), meta: '2:49', explicit: true },
  { id: 'c5', title: 'Long Way Home', artists: 'Ilse Marn', cover: cover('home'), meta: '6:03' },
  { id: 'c6', title: 'City in Blue', artists: 'The Quiet Coast', meta: '3:57' },
];

const RECENT: QueueTrack[] = [
  { id: 'r1', title: 'Glasshouse', artists: 'Juno Vale', cover: cover('glass'), meta: '12 min ago' },
  { id: 'now', title: 'Harbour Lights', artists: 'Ilse Marn', cover: cover('harbour'), meta: 'Now' },
  { id: 'r2', title: 'Low Orbit', artists: 'Oren Fisk', cover: cover('orbit'), meta: '1 hour ago' },
  { id: 'r3', title: 'Morning Ferry', artists: 'Northwind Choir', cover: cover('ferry'), meta: 'Yesterday' },
];

function Canvas({ children, width }: { children: React.ReactNode; width?: number }) {
  const theme = useTheme();
  return (
    <View
      style={{
        padding: 16,
        gap: 16,
        backgroundColor: theme.colors.background,
        width: '100%',
        maxWidth: width,
        minHeight: 760,
      }}
    >
      {children}
    </View>
  );
}

function InteractiveQueue({
  variant,
  height = 720,
  width,
  initialTab = 'queue',
}: {
  variant?: 'panel' | 'sheet';
  height?: number;
  width?: number;
  initialTab?: QueuePanelTab;
}) {
  const [queue, setQueue] = useState(QUEUE);
  const [context, setContext] = useState(CONTEXT);
  const [nowPlaying, setNowPlaying] = useState<QueueTrack>(NOW);
  const [playing, setPlaying] = useState(true);
  const [tab, setTab] = useState<QueuePanelTab>(initialTab);
  const [closed, setClosed] = useState(false);

  const setter = (section: QueueSection) => (section === 'queue' ? setQueue : setContext);

  if (closed) {
    return (
      <Text variant="body-medium" onPress={() => setClosed(false)}>
        Queue closed — press to reopen
      </Text>
    );
  }

  return (
    <QueuePanel
      testID="queue"
      variant={variant}
      width={width}
      style={{ height, maxWidth: '100%' }}
      nowPlaying={nowPlaying}
      playing={playing}
      queue={queue}
      context={context}
      contextName="Night Drive"
      recentlyPlayed={RECENT}
      tab={tab}
      onTabChange={setTab}
      onReorder={(section, from, to) => setter(section)((list) => moveQueueItem(list, from, to))}
      onRemove={(section, index) => setter(section)((list) => list.filter((_, i) => i !== index))}
      onClearQueue={() => setQueue([])}
      onPlay={(section, _index, track) => {
        if (section === 'now') setPlaying((p) => !p);
        else setNowPlaying(track);
      }}
      onClose={() => setClosed(true)}
    />
  );
}

/** Drag a handle, use ArrowUp/ArrowDown on a focused handle, or open a row's menu. */
export const Interactive: Story = {
  render: () => (
    <Canvas>
      <InteractiveQueue />
    </Canvas>
  ),
};

/** The history tab. */
export const RecentlyPlayed: Story = {
  render: () => (
    <Canvas>
      <InteractiveQueue initialTab="recent" height={480} />
    </Canvas>
  ),
};

/** Only a now-playing track, then nothing at all. */
export const States: Story = {
  render: () => (
    <Canvas>
      <View style={{ flexDirection: 'row', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <QueuePanel style={{ height: 260, maxWidth: '100%' }} nowPlaying={NOW} playing={false} onClose={() => {}} />
        <QueuePanel style={{ height: 300, maxWidth: '100%' }} onClose={() => {}} />
        <QueuePanel
          style={{ height: 300, maxWidth: '100%' }}
          queue={QUEUE.slice(0, 2)}
          onClose={() => {}}
          labels={{ queueTab: 'Up next', recentTab: 'History', nextInQueue: 'Added by you' }}
        />
      </View>
      <View style={{ width: '100%', maxWidth: 360 }}>
        <Text variant="caption-1-medium">RecentlyPlayedList on its own, and empty</Text>
        <RecentlyPlayedList items={RECENT} currentId="now" onPlay={() => {}} />
        <RecentlyPlayedList items={[]} />
      </View>
    </Canvas>
  ),
};

/** The flat `sheet` variant at phone width, as it sits inside a bottom sheet. */
export const Narrow: Story = {
  render: () => (
    <Canvas width={390}>
      <InteractiveQueue variant="sheet" height={720} />
    </Canvas>
  ),
};

/** A wide app frame: content beside the panel. */
export const Wide: Story = {
  render: function WideStory() {
    const theme = useTheme();
    return (
      <View style={{ flexDirection: 'row', gap: 8, padding: 8, height: 760, backgroundColor: theme.colors.background }}>
        <View style={{ flex: 1, borderRadius: 8, backgroundColor: theme.colors.backgroundSecondary }} />
        <InteractiveQueue height={744} width={380} />
      </View>
    );
  },
};

/** Dark mode: the panel and the sheet. */
export const Dark: Story = {
  render: () => (
    <BloomThemeProvider mode="dark">
      <DarkCanvas />
    </BloomThemeProvider>
  ),
};

function DarkCanvas() {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        padding: 16,
        backgroundColor: theme.colors.background,
      }}
    >
      <InteractiveQueue height={720} />
      <View style={{ width: '100%', maxWidth: 390 }}>
        <InteractiveQueue variant="sheet" height={720} initialTab="recent" />
      </View>
    </View>
  );
}
