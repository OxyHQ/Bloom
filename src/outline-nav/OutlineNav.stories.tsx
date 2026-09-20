import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Card, CardBody } from '../card';
import { Divider } from '../divider';
import { Text } from '../typography';
import { useTheme } from '../theme/use-theme';
import { OutlineNav } from './OutlineNav';
import type { OutlineHeading } from './types';

const meta: Meta = {
  title: 'Blocks/Notes/Outline Nav',
  parameters: { layout: 'fullscreen', bleed: true },
};

export default meta;
type Story = StoryObj;

const HEADINGS: OutlineHeading[] = [
  { id: 'intro', label: 'Before you start', level: 1 },
  { id: 'kit', label: 'What to bring', level: 2 },
  { id: 'lens', label: 'The long lens, and when it is wrong', level: 3 },
  { id: 'stool', label: 'The folding stool', level: 3 },
  { id: 'tide', label: 'Reading the tide chart', level: 1 },
  { id: 'slack', label: 'Slack water', level: 2 },
  { id: 'turn', label: 'When the channel turns', level: 2 },
  { id: 'wind', label: 'Wind off the point', level: 3 },
  { id: 'after', label: 'Afterwards', level: 1 },
  { id: 'notes', label: 'Writing it up before it fades', level: 2 },
];

/** A document that opens at level 3 and only later has a level 1. */
const RAGGED: OutlineHeading[] = [
  { id: 'a', label: 'A stray third-level heading', level: 3 },
  { id: 'b', label: 'Another one', level: 3 },
  { id: 'c', label: 'The real top', level: 1 },
  { id: 'd', label: 'Under it', level: 2 },
];

function Page({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={{ backgroundColor: colors.background, padding: 24, minHeight: 460 }}>
      {children}
    </View>
  );
}

/** The side column of a wide screen. */
export const Full: Story = {
  render: function FullStory() {
    const [active, setActive] = useState('slack');
    return (
      <Page>
        <View style={{ width: 280 }}>
          <OutlineNav
            headings={HEADINGS}
            activeId={active}
            onSelect={(heading) => setActive(heading.id)}
            testID="outline"
          />
        </View>
      </Page>
    );
  },
};

/** Beside the document it describes — the app does the jumping. */
export const InALayout: Story = {
  render: function LayoutStory() {
    const [active, setActive] = useState('tide');
    const current = HEADINGS.find((heading) => heading.id === active);
    return (
      <Page>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 32, maxWidth: 1040 }}>
          <View style={{ flex: 1, maxWidth: 640, gap: 12 }}>
            <Text variant="title-1-semibold">Harbour walk — what to bring</Text>
            <Divider />
            <Card variant="outlined">
              <CardBody>
                <Text variant="body-regular">
                  {`The app scrolled to “${current?.label ?? '—'}”. OutlineNav emitted the heading; it did not move anything itself.`}
                </Text>
              </CardBody>
            </Card>
            <Text variant="body-regular">
              Slack water is at 06:40, which gives about forty minutes before the channel turns.
              The line length here is the thing to look at: a column of body text this wide is
              what the outline sits beside all day.
            </Text>
          </View>
          <View style={{ width: 260 }}>
            <OutlineNav headings={HEADINGS} activeId={active} onSelect={(h) => setActive(h.id)} />
          </View>
        </View>
      </Page>
    );
  },
};

/** `compact`: touch-sized rows, no title, the deep levels dropped. */
export const Compact: Story = {
  render: function CompactStory() {
    const [active, setActive] = useState('turn');
    return (
      <Page>
        <View style={{ width: 340, gap: 24 }}>
          <OutlineNav
            headings={HEADINGS}
            activeId={active}
            onSelect={(heading) => setActive(heading.id)}
            variant="compact"
            testID="compact"
          />
          <Divider />
          <Text variant="caption-1-medium">compactMaxLevel = 1</Text>
          <OutlineNav
            headings={HEADINGS}
            activeId="after"
            variant="compact"
            compactMaxLevel={1}
          />
        </View>
      </Page>
    );
  },
};

/** The edges: nothing to show, one heading, ragged levels, no progress bar. */
export const Edges: Story = {
  render: () => (
    <Page>
      <View style={{ flexDirection: 'row', gap: 32, flexWrap: 'wrap' }}>
        <View style={{ width: 240 }}>
          <Text variant="caption-1-medium">empty</Text>
          <OutlineNav headings={[]} />
        </View>
        <View style={{ width: 240 }}>
          <Text variant="caption-1-medium">one heading</Text>
          <OutlineNav headings={[HEADINGS[0]!]} activeId="intro" />
        </View>
        <View style={{ width: 240 }}>
          <Text variant="caption-1-medium">ragged levels</Text>
          <OutlineNav headings={RAGGED} activeId="d" />
        </View>
        <View style={{ width: 240 }}>
          <Text variant="caption-1-medium">no progress, own title</Text>
          <OutlineNav headings={HEADINGS.slice(0, 5)} activeId="kit" hideProgress title="Sections" />
        </View>
      </View>
    </Page>
  ),
};

/** 360px, with a long heading that has to truncate rather than wrap. */
export const Phone: Story = {
  render: function PhoneStory() {
    const [active, setActive] = useState('lens');
    return (
      <Page>
        <ScrollView style={{ width: '100%', maxWidth: 360 }}>
          <OutlineNav
            headings={[
              ...HEADINGS,
              {
                id: 'long',
                label: 'A heading long enough that it cannot possibly fit on one line of a phone',
                level: 2,
              },
            ]}
            activeId={active}
            onSelect={(heading) => setActive(heading.id)}
            variant="compact"
            compactMaxLevel={3}
          />
        </ScrollView>
      </Page>
    );
  },
};
