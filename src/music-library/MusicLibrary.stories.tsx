import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { ContextMenuItem, ContextMenuSeparator } from '../context-menu';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { LibraryItem } from './LibraryItem';
import { LibraryPanel } from './LibraryPanel';
import type { LibraryEntry, LibraryFilter, LibrarySort, LibraryView } from './types';

const meta: Meta = {
  title: 'Blocks/Music/Library',
};

export default meta;

type Story = StoryObj;

// ---------------------------------------------------------------------------
//  Demo data — invented artists, playlists and shows.
// ---------------------------------------------------------------------------

const DAY = 86_400_000;
const NOW = Date.UTC(2026, 8, 17);
const cover = (seed: string) => `https://picsum.photos/seed/${seed}/160/160`;

const LIBRARY: LibraryEntry[] = [
  { id: 'liked', title: 'Liked Songs', kind: 'playlist', meta: 'Playlist · 412 songs', cover: cover('liked-glow'), pinned: true, downloaded: true, addedAt: NOW - 900 * DAY, lastPlayedAt: NOW - 1 * DAY },
  { id: 'night-drive', title: 'Night Drive', kind: 'playlist', subtitle: 'Maya', cover: cover('night-drive'), pinned: true, addedAt: NOW - 40 * DAY, lastPlayedAt: NOW - 0.1 * DAY },
  { id: 'lumen-vale', title: 'Lumen Vale', kind: 'artist', cover: cover('lumen-vale'), addedAt: NOW - 200 * DAY, lastPlayedAt: NOW - 2 * DAY },
  { id: 'tidewater', title: 'Tidewater Hymns', kind: 'album', subtitle: 'The Quiet Orchard', cover: cover('tidewater'), downloaded: true, addedAt: NOW - 12 * DAY, lastPlayedAt: NOW - 3 * DAY },
  { id: 'slow-mornings', title: 'Slow Mornings', kind: 'playlist', subtitle: 'Maya', cover: cover('slow-mornings'), addedAt: NOW - 5 * DAY, lastPlayedAt: NOW - 6 * DAY },
  { id: 'field-notes', title: 'Field Notes on Sound', kind: 'podcast', subtitle: 'Ines Marlow', cover: cover('field-notes'), downloaded: true, addedAt: NOW - 70 * DAY, lastPlayedAt: NOW - 4 * DAY },
  { id: 'kaito', title: 'Kaito Ferran', kind: 'artist', cover: cover('kaito-ferran'), addedAt: NOW - 30 * DAY, lastPlayedAt: NOW - 20 * DAY },
  { id: 'glass-harbor', title: 'Glass Harbor', kind: 'album', subtitle: 'Velvet Static', cover: cover('glass-harbor'), addedAt: NOW - 2 * DAY },
  { id: 'the-long-winter', title: 'The Long Winter Road', kind: 'audiobook', subtitle: 'Oona Beckett', cover: cover('long-winter'), addedAt: NOW - 90 * DAY, lastPlayedAt: NOW - 11 * DAY },
  { id: 'workouts', title: 'Workouts', kind: 'folder', meta: 'Folder · 4 playlists', addedAt: NOW - 300 * DAY, lastPlayedAt: NOW - 30 * DAY },
  { id: 'amber', title: 'Amber Frequencies', kind: 'playlist', subtitle: 'Soren Achebe', cover: cover('amber-freq'), addedAt: NOW - 15 * DAY, lastPlayedAt: NOW - 8 * DAY },
  { id: 'nora', title: 'Nora Quillfeather', kind: 'artist', cover: cover('nora-q'), downloaded: true, addedAt: NOW - 60 * DAY, lastPlayedAt: NOW - 9 * DAY },
  { id: 'deep-current', title: 'Deep Current', kind: 'podcast', subtitle: 'Harbor Talk Collective', cover: cover('deep-current'), addedAt: NOW - 8 * DAY },
  { id: 'paper-moons', title: 'Paper Moons', kind: 'album', subtitle: 'Lumen Vale', cover: cover('paper-moons'), addedAt: NOW - 100 * DAY, lastPlayedAt: NOW - 50 * DAY },
];

function contextMenu(item: LibraryEntry) {
  return (
    <>
      <ContextMenuItem onPress={() => {}}>{item.pinned ? 'Unpin' : 'Pin'}</ContextMenuItem>
      <ContextMenuItem onPress={() => {}}>{item.downloaded ? 'Remove download' : 'Download'}</ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem variant="destructive" onPress={() => {}}>
        Remove from Your Library
      </ContextMenuItem>
    </>
  );
}

function Page({ children, row = true }: { children: React.ReactNode; row?: boolean }) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: row ? 'row' : 'column',
        flexWrap: 'wrap',
        gap: 16,
        padding: 16,
        backgroundColor: theme.colors.background,
        alignItems: 'flex-start',
      }}
    >
      {children}
    </View>
  );
}

function Caption({ children }: { children: string }) {
  const theme = useTheme();
  return (
    <Text variant="caption-1-medium" style={{ color: theme.colors.textSecondary }}>
      {children}
    </Text>
  );
}

/** The whole panel, interactive: filters, search, sort and view menu, rail and expand toggles. */
function InteractivePanel({ height = 720, fullWidth = false }: { height?: number; fullWidth?: boolean }) {
  const [collapsed, setCollapsed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [selectedId, setSelectedId] = useState('night-drive');
  const [paused, setPaused] = useState(false);
  return (
    <LibraryPanel
      items={LIBRARY}
      collapsed={collapsed}
      onCollapsedChange={setCollapsed}
      expanded={expanded}
      onExpandedChange={fullWidth ? undefined : setExpanded}
      onCreatePress={() => {}}
      selectedId={selectedId}
      nowPlayingId="night-drive"
      paused={paused}
      onItemPress={(item) => {
        if (item.id === 'night-drive') setPaused((p) => !p);
        setSelectedId(item.id);
      }}
      renderContextMenu={contextMenu}
      style={{ height, width: collapsed ? undefined : fullWidth ? '100%' : expanded ? 560 : 360 }}
      testID="library"
    />
  );
}

export const Desktop: Story = {
  render: () => (
    <Page>
      <InteractivePanel />
    </Page>
  ),
};

/** The three densities side by side, with a filter and a sort applied to each. */
export const Views: Story = {
  render: function ViewsStory() {
    return (
      <Page>
        {(['compact', 'list', 'grid'] as LibraryView[]).map((view) => (
          <View key={view} style={{ gap: 8 }}>
            <Caption>{view}</Caption>
            <LibraryPanel
              items={LIBRARY}
              view={view}
              nowPlayingId="night-drive"
              selectedId="lumen-vale"
              onCreatePress={() => {}}
              style={{ width: 340, height: 620 }}
              testID={`library-${view}`}
            />
          </View>
        ))}
      </Page>
    );
  },
};

/** Controlled filter + sort: Artists, alphabetical, and Downloaded on its own. */
export const Filtered: Story = {
  render: function FilteredStory() {
    const [filter, setFilter] = useState<LibraryFilter | null>('artists');
    const [sort, setSort] = useState<LibrarySort>('alphabetical');
    const [downloaded, setDownloaded] = useState(true);
    return (
      <Page>
        <LibraryPanel
          items={LIBRARY}
          filter={filter}
          onFilterChange={setFilter}
          sort={sort}
          onSortChange={setSort}
          style={{ width: 360, height: 420 }}
          testID="library-artists"
        />
        <LibraryPanel
          items={LIBRARY}
          downloadedOnly={downloaded}
          onDownloadedOnlyChange={setDownloaded}
          query="tide"
          style={{ width: 360, height: 420 }}
          testID="library-downloaded"
        />
        <LibraryPanel
          items={LIBRARY}
          filter="audiobooks"
          query="zzz"
          style={{ width: 360, height: 420 }}
          testID="library-empty"
        />
      </Page>
    );
  },
};

/** The rail: covers only, hover for a tooltip (web), right-click for the context menu. */
export const Collapsed: Story = {
  render: () => (
    <Page>
      <LibraryPanel
        items={LIBRARY}
        collapsed
        onCollapsedChange={() => {}}
        onCreatePress={() => {}}
        nowPlayingId="night-drive"
        selectedId="lumen-vale"
        renderContextMenu={contextMenu}
        style={{ height: 720 }}
        testID="library-rail"
      />
    </Page>
  ),
};

/** Single rows in every variant and state. */
export const Items: Story = {
  render: () => (
    <Page row={false}>
      <View style={{ width: 360, gap: 4 }}>
        <Caption>list — rest, selected, now playing, paused, artist, no cover</Caption>
        <LibraryItem item={LIBRARY[4]!} onPress={() => {}} />
        <LibraryItem item={LIBRARY[3]!} selected onPress={() => {}} />
        <LibraryItem item={LIBRARY[1]!} nowPlaying onPress={() => {}} />
        <LibraryItem item={LIBRARY[1]!} nowPlaying paused onPress={() => {}} />
        <LibraryItem item={LIBRARY[2]!} onPress={() => {}} />
        <LibraryItem item={LIBRARY[9]!} onPress={() => {}} />
        <Caption>compact</Caption>
        <LibraryItem item={LIBRARY[0]!} variant="compact" onPress={() => {}} />
        <LibraryItem item={LIBRARY[1]!} variant="compact" nowPlaying onPress={() => {}} />
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {[LIBRARY[1]!, LIBRARY[2]!, LIBRARY[5]!].map((item) => (
          <View key={item.id} style={{ width: 160 }}>
            <LibraryItem item={item} variant="grid" nowPlaying={item.id === 'night-drive'} onPress={() => {}} />
          </View>
        ))}
        <LibraryItem item={LIBRARY[2]!} variant="rail" onPress={() => {}} />
      </View>
    </Page>
  ),
};

/** A 390-wide phone: the panel fills the screen, no expand toggle. */
export const Mobile: Story = {
  render: () => (
    <View style={{ width: '100%', maxWidth: 390 }}>
      <InteractivePanel height={760} fullWidth />
    </View>
  ),
};

export const Dark: Story = {
  render: () => (
    <BloomThemeProvider mode="dark">
      <Page>
        <InteractivePanel />
        <LibraryPanel
          items={LIBRARY}
          view="grid"
          nowPlayingId="night-drive"
          style={{ width: 360, height: 720 }}
        />
        <LibraryPanel items={LIBRARY} collapsed onCollapsedChange={() => {}} onCreatePress={() => {}} style={{ height: 720 }} />
      </Page>
    </BloomThemeProvider>
  ),
};
