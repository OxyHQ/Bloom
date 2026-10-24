import { useId, useRef } from 'react';
import { Pressable, ScrollView, Text } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import type { ViewRef } from '../styles/native-refs';
import { useVideoPlayback, VideoPlaybackProvider } from './index';

/**
 * A feed of stand-in players. Scroll it: exactly one audible tile is "playing"
 * at a time, the one nearest the line 40% down the window; the silent tile
 * plays whenever it is on screen. Tap a tile to claim the slot by hand; the
 * claim lasts until that tile scrolls away.
 */
function Tile({ label, silent = false }: { label: string; silent?: boolean }) {
  const id = useId();
  const target = useRef<ViewRef>(null);
  const { shouldPlay, claimActive } = useVideoPlayback({ id, target, silent });
  return (
    <Pressable
      ref={target}
      onPress={claimActive}
      style={{
        height: 220,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: shouldPlay ? '#1f7a4d' : '#3a3a3a',
      }}
    >
      <Text style={{ color: '#ffffff', fontSize: 18 }}>
        {label}: {shouldPlay ? 'playing' : 'paused'}
      </Text>
    </Pressable>
  );
}

const meta: Meta<typeof VideoPlaybackProvider> = {
  id: 'base-video-playback',
  title: 'Components/Media/Video Playback',
  component: VideoPlaybackProvider,
  parameters: { controls: { disable: true } },
};

export default meta;

type Story = StoryObj<typeof VideoPlaybackProvider>;

export const Feed: Story = {
  render: () => (
    <VideoPlaybackProvider>
      <ScrollView style={{ height: 600 }} contentContainerStyle={{ gap: 16, padding: 16 }}>
        <Tile label="Video 1" />
        <Tile label="Video 2" />
        <Tile label="GIF (silent)" silent />
        <Tile label="Video 3" />
        <Tile label="Video 4" />
        <Tile label="Video 5" />
      </ScrollView>
    </VideoPlaybackProvider>
  ),
};
