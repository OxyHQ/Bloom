import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../button';
import { RiFileTextLine, RiGlobalLine, RiSearchLine, RiBookOpenLine } from '../icons/remix';
import { useTheme } from '../theme/use-theme';
import { WebSearch } from './index';
import type { WebSearchStep } from './types';

const meta: Meta<typeof WebSearch> = {
  title: 'Blocks/Web Search',
  component: WebSearch,
};

export default meta;

type Story = StoryObj<typeof WebSearch>;

/** Paints the theme background, so the dark globals read as a dark page. */
function Frame({ children, testID }: { children: React.ReactNode; testID?: string }) {
  const { colors } = useTheme();
  return (
    <View testID={testID} style={{ padding: 40, width: 560, maxWidth: '100%', gap: 40, backgroundColor: colors.background }}>
      {children}
    </View>
  );
}

/** Demo data: an agent researching budget keyboards. */
const STEPS: WebSearchStep[] = [
  { label: 'Researching budget mechanical keyboards', icon: RiSearchLine, heading: true },
  {
    label: 'Searched the web for',
    query: 'best budget mechanical keyboard',
    icon: RiGlobalLine,
    meta: '10 results',
    sources: [
      { title: 'The best budget mechanical keyboards in 2025', domain: 'www.pcgamer.com', href: 'https://www.pcgamer.com' },
      { title: 'The 6 Best Budget Keyboards - Winter 2025', domain: 'www.rtings.com', href: 'https://www.rtings.com' },
      { title: 'Keychron V1 Max review: the new default', domain: 'www.theverge.com', href: 'https://www.theverge.com' },
      { title: "What's the best keyboard under $100?", domain: 'www.reddit.com', brand: 'reddit', href: 'https://www.reddit.com' },
      { title: 'Budget boards compared, sound tests included', domain: 'github.com', brand: 'github', href: 'https://github.com' },
      { title: 'Best cheap mechanical keyboards', domain: 'www.tomshardware.com', href: 'https://www.tomshardware.com' },
      { title: 'Keyboard buying guide', domain: 'www.wired.com' },
    ],
  },
  {
    label: 'Searched Reddit for',
    brand: 'reddit',
    query: 'r/mechanicalkeyboards budget',
    meta: '7 posts',
    sources: [
      { title: 'Keychron V1 Max after six months', domain: 'www.reddit.com', brand: 'reddit', href: 'https://www.reddit.com' },
      { title: 'Aula F75 vs Keychron V1', domain: 'www.reddit.com', brand: 'reddit', href: 'https://www.reddit.com' },
    ],
  },
  { label: 'Searched X for', brand: 'x', query: 'aula f75 review', meta: '12 posts' },
  { label: 'Read', icon: RiFileTextLine, query: 'rtings.com/keyboard/reviews/best/budget', dwell: 1600 },
];

/** Every unit revealed: heading, trail, both sources rows. Press "Sources" to fly the marks out. */
export const Settled: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame testID="settled">
      <WebSearch testID="ws" steps={STEPS} revealed={99} />
    </Frame>
  ),
};

/** The streaming demo: units land on a fixed pacing, the newest step shimmers, "Working" trails. */
export const Streaming: Story = {
  parameters: { controls: { disable: true } },
  render: function Render() {
    const [run, setRun] = useState(0);
    const [done, setDone] = useState(false);
    return (
      <Frame testID="streaming">
        <WebSearch key={run} testID="ws" steps={STEPS} onComplete={() => setDone(true)} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Button size="sm" onPress={() => {
              setDone(false);
              setRun((n) => n + 1);
            }} appearance="outline" tone="neutral">
            {done ? 'Replay' : 'Restart'}
          </Button>
        </View>
      </Frame>
    );
  },
};

/** Driven by `revealed`, mid-run: the newest step shimmers and the indicator trails the heading's edge. */
export const Controlled: Story = {
  parameters: { controls: { disable: true } },
  render: function Render() {
    const [revealed, setRevealed] = useState(3);
    return (
      <Frame testID="controlled">
        <WebSearch testID="ws" steps={STEPS} revealed={revealed} working="Reading sources" />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Button size="sm" onPress={() => setRevealed((n) => Math.max(0, n - 1))} appearance="outline" tone="neutral">
            Back
          </Button>
          <Button size="sm" onPress={() => setRevealed((n) => n + 1)} appearance="outline" tone="neutral">
            Next unit
          </Button>
        </View>
      </Frame>
    );
  },
};

/** No heading: the trail starts on its own guide and the indicator sits on the glyphs' edge. */
export const WithoutHeading: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame testID="no-heading">
      <WebSearch testID="ws" steps={STEPS.slice(1)} revealed={3} working="Reading sources" />
      <WebSearch testID="ws-done" steps={STEPS.slice(1)} revealed={99} working={false} />
    </Frame>
  ),
};

/** Glyph kinds: brand marks (colour, and monochrome that follows the text), a supplied icon, none. */
export const Glyphs: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame testID="glyphs">
      <WebSearch
        testID="ws"
        revealed={99}
        steps={[
          { label: 'Searched GitHub for', brand: 'github', query: 'bloom tokens', meta: '4 repos' },
          { label: 'Searched Google for', brand: 'google', query: 'color-mix oklab', meta: '5 results' },
          { label: 'Watched on Twitch', brand: 'twitch' },
          { label: 'Read the docs', icon: RiBookOpenLine },
          {
            label: 'Opened',
            meta: '3 pages',
            sources: [
              { title: 'Figma community file', domain: 'figma.com', brand: 'figma', href: 'https://figma.com' },
              { title: 'Notion spec', domain: 'notion.so', brand: 'notion', href: 'https://notion.so' },
              { title: 'Internal wiki', domain: 'wiki.internal', icon: <RiBookOpenLine width={12} height={12} fill="#8b5cf6" /> },
            ],
          },
          { label: 'No glyph at all' },
        ]}
      />
    </Frame>
  ),
};

/** Reduced motion: everything lands settled, no shimmer, no flights. */
export const ReducedMotion: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame testID="reduced">
      <WebSearch testID="ws" steps={STEPS} reduce />
    </Frame>
  ),
};

/** A single instance whose controls are applied directly to the rendered component. */
export const Playground: StoryObj<typeof WebSearch> = {
  args: { steps: STEPS, run: false, revealed: 8 },
  parameters: { controls: { disable: false, include: ['run', 'revealed'] } },
  argTypes: { run: { control: 'boolean' }, revealed: { if: { arg: 'run', truthy: false }, control: { type: 'number', min: 0, max: 12 } } },
  render: function Playground(args) {

    return <View style={{ width: 440, maxWidth: '100%' }}><WebSearch {...args} revealed={args.run ? undefined : args.revealed} /></View>;
  },
};
