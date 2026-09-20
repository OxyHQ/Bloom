import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { SidebarFolder } from '../sidebar';
import type { SidebarTreeFolder } from '../sidebar';
import { Text } from '../typography';
import { useTheme } from '../theme/use-theme';
import { NoteCard } from './NoteCard';
import { NoteCardSkeleton } from './NoteCardSkeleton';
import type { NoteCardProps } from './types';

const meta: Meta = {
  title: 'Blocks/Notes/Note Card',
  parameters: { layout: 'fullscreen', bleed: true },
};

export default meta;
type Story = StoryObj;

const LONG_EXCERPT =
  'The tide chart says slack water is at 06:40, which gives us about forty minutes before the channel turns. Bring the long lens, the folding stool and the flask — last time we stood in the wind for two hours and came back with nothing but a headache and one blurred heron.';

const NOTES: NoteCardProps[] = [
  {
    title: 'Harbour walk — what to bring',
    excerpt: LONG_EXCERPT,
    tags: ['field notes', 'tide', 'autumn'],
    meta: { edited: '2 min ago', notebook: 'Field notes', attachments: 2 },
    pinned: true,
  },
  {
    title: 'Kitchen rebuild — the awkward corner',
    excerpt:
      'The run under the window is 1,840mm, which is two 600 units and a 640 filler. The filler is the problem: it lands exactly where the old gas pipe comes through the floor.',
    tags: ['house'],
    meta: { edited: 'Yesterday', notebook: 'House' },
    tone: 'warning',
  },
  {
    title: 'Reading list, winter',
    checklist: [
      { id: 'a', label: 'The Salt Path — finish part two', done: true },
      { id: 'b', label: 'Borrow the Ravensdale essays from Priya' },
      { id: 'c', label: 'Return the two overdue ones', done: true },
      { id: 'd', label: 'Find the sequel — the library says it is in' },
      { id: 'e', label: 'Write up the short one before it fades' },
    ],
    checklistTotal: 9,
    tags: ['reading', 'winter'],
    meta: { edited: '3 days ago', notebook: 'Lists' },
    tone: 'info',
  },
  {
    title: 'Bank details and the flat',
    excerpt: 'Held behind the passphrase.',
    meta: { edited: 'Last week', locked: true, notebook: 'Private' },
    tone: 'error',
  },
  {
    title: 'A title that keeps going and going, well past what one line of a preview card can reasonably hold',
    excerpt:
      'Short body. The point of this one is the title above it, which has to truncate rather than push the excerpt off the bottom of the card.',
    tags: ['long', 'truncation', 'edge case', 'overflow', 'more'],
    meta: { edited: '12 Mar', notebook: 'Scratch', attachments: 7 },
    tone: 'success',
  },
  {
    title: 'Untitled',
    meta: { edited: 'Just now' },
  },
];

function Board({ children, width = 1120 }: { children: React.ReactNode; width?: number }) {
  const { colors } = useTheme();
  return (
    <View style={{ backgroundColor: colors.background, padding: 24, minHeight: 360 }}>
      <View style={{ maxWidth: width, flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
        {children}
      </View>
    </View>
  );
}

function Column({ children, width = 720 }: { children: React.ReactNode; width?: number }) {
  const { colors } = useTheme();
  return (
    <View style={{ backgroundColor: colors.background, padding: 24, minHeight: 360 }}>
      <View style={{ maxWidth: width, gap: 8 }}>{children}</View>
    </View>
  );
}

/** The board: six notes at the `grid` density, one of each thing a note can be. */
export const Grid: Story = {
  render: () => (
    <Board>
      {NOTES.map((note, index) => (
        <View key={note.title} style={{ width: 260 }}>
          <NoteCard {...note} onPress={() => {}} testID={`note-${index}`} />
        </View>
      ))}
    </Board>
  ),
};

/** The same six notes as list rows: one line of excerpt, the trail inline. */
export const Rows: Story = {
  render: () => (
    <Column>
      {NOTES.map((note, index) => (
        <NoteCard key={note.title} {...note} density="row" onPress={() => {}} testID={`row-${index}`} />
      ))}
    </Column>
  ),
};

/** Multi-select: the card becomes a checkbox and a press toggles it. */
export const MultiSelect: Story = {
  render: function MultiSelectStory() {
    const [picked, setPicked] = useState<string[]>([NOTES[1]!.title]);
    return (
      <Column>
        <Text variant="caption-1-regular">{`${picked.length} selected`}</Text>
        {NOTES.slice(0, 4).map((note) => (
          <NoteCard
            key={note.title}
            {...note}
            density="row"
            selectable
            selected={picked.includes(note.title)}
            onSelectedChange={(next) =>
              setPicked((prev) =>
                next ? [...prev, note.title] : prev.filter((title) => title !== note.title),
              )
            }
          />
        ))}
      </Column>
    );
  },
};

/** One note is the open one — `aria-current`, the tone's own edge. */
export const Selected: Story = {
  render: () => (
    <Column>
      <NoteCard {...NOTES[0]!} density="row" selected onPress={() => {}} />
      <NoteCard {...NOTES[1]!} density="row" onPress={() => {}} />
      <NoteCard {...NOTES[2]!} density="row" onPress={() => {}} />
    </Column>
  ),
};

/** Every tone, so a board of colour-coded notes can be read as a set. */
export const Tones: Story = {
  render: () => (
    <Board>
      {(['default', 'primary', 'success', 'warning', 'error', 'info'] as const).map((tone) => (
        <View key={tone} style={{ width: 240 }}>
          <NoteCard
            title={`Tone: ${tone}`}
            excerpt="The wash is the tone's subtle tint composited over whatever is behind the card, and the quiet lines are re-measured against the result."
            tags={[tone]}
            tone={tone}
            meta={{ edited: '1 hr ago', notebook: 'Palette' }}
            onPress={() => {}}
          />
        </View>
      ))}
    </Board>
  ),
};

/** Loading, and the bare empty note — the two states a list starts and ends in. */
export const LoadingAndEmpty: Story = {
  render: () => (
    <Board width={820}>
      <View style={{ width: 240 }}>
        <NoteCardSkeleton />
      </View>
      <View style={{ width: 240 }}>
        <NoteCard title="" loading />
      </View>
      <View style={{ width: 240 }}>
        <NoteCard title="Untitled" onPress={() => {}} />
      </View>
      <View style={{ width: 320 }}>
        <NoteCardSkeleton density="row" />
      </View>
    </Board>
  ),
};

/** 360px: the width every one of these has to survive. */
export const Phone: Story = {
  render: () => (
    <Column width={360}>
      {NOTES.map((note) => (
        <NoteCard key={note.title} {...note} density="row" onPress={() => {}} />
      ))}
      <NoteCard {...NOTES[0]!} onPress={() => {}} />
      <NoteCard {...NOTES[2]!} onPress={() => {}} />
    </Column>
  ),
};

const NOTEBOOKS: SidebarTreeFolder[] = [
  {
    key: 'field',
    label: 'Field notes',
    defaultOpen: true,
    items: [
      { key: 'tide', label: 'Tide and weather', meta: '2m' },
      { key: 'birds', label: 'Bird counts', meta: '3d' },
      { key: 'coast', label: 'Coast path', meta: '1w' },
    ],
  },
  {
    key: 'house',
    label: 'House',
    items: [
      { key: 'kitchen', label: 'Kitchen rebuild', meta: '1d' },
      { key: 'garden', label: 'Garden', meta: '2w' },
    ],
  },
];

/**
 * The notebook tree is `Sidebar`'s, not this family's — `SidebarFolder` beside
 * a column of note rows is the whole notes screen.
 */
export const WithNotebookTree: Story = {
  render: function WithNotebookTreeStory() {
    const { colors } = useTheme();
    const [selected, setSelected] = useState('tide');
    return (
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          backgroundColor: colors.background,
          padding: 24,
          gap: 24,
        }}
      >
        <View style={{ width: 236, gap: 10 }}>
          <Text variant="caption-1-medium">Notebooks</Text>
          {NOTEBOOKS.map((folder) => (
            <SidebarFolder
              key={folder.key}
              folder={folder}
              selectedItem={selected}
              onItemPress={(item) => setSelected(item.key)}
            />
          ))}
        </View>
        <View style={{ flex: 1, maxWidth: 560, gap: 8 }}>
          {NOTES.slice(0, 4).map((note) => (
            <NoteCard key={note.title} {...note} density="row" onPress={() => {}} />
          ))}
        </View>
      </View>
    );
  },
};
