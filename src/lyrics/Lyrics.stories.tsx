import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { LyricsPreviewCard, LyricsView, type LyricLine } from './index';

const meta: Meta = {
  title: 'Blocks/Music/Lyrics',
};

export default meta;

type Story = StoryObj;

// ---------------------------------------------------------------------------
//  Demo data — an invented song ("Paper Lanterns" by Juniper Vale).
// ---------------------------------------------------------------------------

const WORDS = [
  'Streetlights hum a quiet tune',
  'Paper lanterns chase the moon',
  'We were counting every train',
  'Rolling out beneath the rain',
  '',
  'Hold the night a little longer',
  'Every hour makes us stronger',
  'If the morning finds us here',
  'Let it find us without fear',
  '',
  'Oh, the city never sleeps',
  'Keeps the secrets that it keeps',
  'We could drive until the sea',
  'Just the radio and me',
  '',
  'Hold the night a little longer',
  'Every hour makes us stronger',
  'Paper lanterns, burning slow',
  'Show me where the rivers go',
];

const LINES: LyricLine[] = WORDS.map((text, index) => ({ time: 4 + index * 3.5, text }));
const DURATION = 4 + WORDS.length * 3.5 + 4;
const PLAIN = WORDS.join('\n');
const PROVIDER = 'Lyrics licensed from the song’s publisher';

/** A fake player clock that loops, and a seek. */
function useFakeClock(start = 12) {
  const [time, setTime] = useState(start);
  useEffect(() => {
    const id = setInterval(() => setTime((t) => (t + 0.25 >= DURATION ? 0 : t + 0.25)), 250);
    return () => clearInterval(id);
  }, []);
  return [time, setTime] as const;
}

function Page({ children, width }: { children: React.ReactNode; width?: number }) {
  const theme = useTheme();
  return (
    <View
      style={{
        gap: 24,
        padding: 16,
        backgroundColor: theme.colors.background,
        width: '100%',
        maxWidth: width,
        minHeight: '100%',
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

function SyncedDemo({
  artworkColor,
  height = 640,
  startAt,
}: {
  artworkColor?: string;
  height?: number;
  startAt?: number;
}) {
  const [time, setTime] = useFakeClock(startAt);
  return (
    <View style={{ height, borderRadius: 16, overflow: 'hidden' }}>
      <LyricsView
        lines={LINES}
        currentTime={time}
        onSeekLine={(line) => setTime(line.time ?? 0)}
        artworkColor={artworkColor}
        providerText={PROVIDER}
        testID="lyrics"
      />
    </View>
  );
}

/** Synced lyrics on an artwork colour, following a fake clock. Press a line to seek; scroll to see the pill. */
export const Synced: Story = {
  render: () => (
    <Page>
      <SyncedDemo artworkColor="#6d4bd8" />
    </Page>
  ),
};

/** No artwork colour: the neutral surface under the theme's text colour. */
export const Neutral: Story = {
  render: () => (
    <Page>
      <SyncedDemo />
    </Page>
  ),
};

/** Narrow (390): the small type step. */
export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: () => (
    <Page width={390}>
      <SyncedDemo artworkColor="#d0473c" height={700} />
    </Page>
  ),
};

/** Artwork colours from deep to pale: the shade deepens until white text keeps 7:1. */
export const ArtworkColours: Story = {
  render: function ArtworkColours() {
    const colours = ['#1db98a', '#f4d35e', '#f7f3ea', '#101820', 'not-a-colour'];
    return (
      <Page>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
          {colours.map((colour) => (
            <View key={colour} style={{ flexGrow: 1, flexBasis: 280, maxWidth: 340, gap: 8 }}>
              <Caption>{colour}</Caption>
              <LyricsPreviewCard lines={LINES} currentTime={20} artworkColor={colour} onShowLyrics={() => {}} />
            </View>
          ))}
        </View>
      </Page>
    );
  },
};

/** Lines without times: plain text, nothing scrolls or seeks. And no lyrics at all. */
export const UnsyncedAndEmpty: Story = {
  render: () => (
    <Page>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
        <View style={{ flexGrow: 1, flexBasis: 300, height: 520, borderRadius: 16, overflow: 'hidden' }}>
          <LyricsView text={PLAIN} artworkColor="#2f6fb5" providerText={PROVIDER} />
        </View>
        <View style={{ flexGrow: 1, flexBasis: 300, height: 520, borderRadius: 16, overflow: 'hidden' }}>
          <LyricsView lines={[]} />
        </View>
      </View>
    </Page>
  ),
};

function PreviewDemo({ artworkColor }: { artworkColor?: string }) {
  const [time, setTime] = useFakeClock(8);
  return (
    <LyricsPreviewCard
      lines={LINES}
      currentTime={time}
      artworkColor={artworkColor}
      onSeekLine={(line) => setTime(line.time ?? 0)}
      onShowLyrics={() => {}}
      providerText={PROVIDER}
      testID="preview"
    />
  );
}

/** The preview card: five lines around the current one, following the clock. */
export const PreviewCard: Story = {
  render: () => (
    <Page>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
        <View style={{ flexGrow: 1, flexBasis: 300, maxWidth: 400 }}>
          <PreviewDemo artworkColor="#b5476d" />
        </View>
        <View style={{ flexGrow: 1, flexBasis: 300, maxWidth: 400 }}>
          <PreviewDemo />
        </View>
        <View style={{ flexGrow: 1, flexBasis: 300, maxWidth: 400 }}>
          <LyricsPreviewCard text={PLAIN} visibleLines={4} onShowLyrics={() => {}} />
        </View>
      </View>
    </Page>
  ),
};

/** Dark mode: the neutral and artwork variants side by side. */
export const Dark: Story = {
  render: () => (
    <BloomThemeProvider mode="dark">
      <Page>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
          <View style={{ flexGrow: 1, flexBasis: 300 }}>
            <SyncedDemo height={520} />
          </View>
          <View style={{ flexGrow: 1, flexBasis: 300 }}>
            <SyncedDemo artworkColor="#6d4bd8" height={520} startAt={30} />
          </View>
        </View>
        <View style={{ flexGrow: 1, flexBasis: 300, maxWidth: 400 }}>
          <PreviewDemo />
        </View>
      </Page>
    </BloomThemeProvider>
  ),
};
