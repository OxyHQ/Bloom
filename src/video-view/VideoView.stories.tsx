import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { provideExpoVideo, type VideoViewLikeProps } from '../media-flight/expo-video-module';
import { VideoView } from './index';

/**
 * Storybook is a Vite bundle, where the optional-peer `require` cannot run, so
 * the view is handed over with `provideExpoVideo` — exactly what an ESM web
 * consumer does. The view handed over is a stand-in that writes the `<video>`
 * the way expo-video's web view does: `playsInline={props.playsInline}`, so the
 * attribute appears only when the prop arrives. Inspect the element: the first
 * story carries `playsinline`, the second does not.
 */
function StoryExpoVideoView({ style, contentFit, nativeControls, playsInline }: VideoViewLikeProps) {
  return React.createElement('video', {
    src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    autoPlay: true,
    muted: true,
    loop: true,
    controls: nativeControls ?? true,
    playsInline,
    style: { ...StyleSheet.flatten(style), objectFit: contentFit },
  });
}

provideExpoVideo({ VideoView: StoryExpoVideoView });

const PLAYER = { playing: true, play: () => {}, pause: () => {} };

const meta: Meta<typeof VideoView> = {
  title: 'Base/Video View',
  component: VideoView,
  parameters: { controls: { disable: true } },
};

export default meta;

type Story = StoryObj<typeof VideoView>;

function Frame({ caption, children }: { caption: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <View style={{ width: 320, height: 180, borderRadius: 12, overflow: 'hidden' }}>
        {children}
      </View>
      <Text>{caption}</Text>
    </View>
  );
}

export const PlaysInline: Story = {
  render: () => (
    <Frame caption="Default: the <video> carries playsinline">
      <VideoView player={PLAYER} contentFit="cover" nativeControls={false} style={{ width: '100%', height: '100%' }} />
    </Frame>
  ),
};

export const OptedOut: Story = {
  render: () => (
    <Frame caption="playsInline={false}: no playsinline attribute">
      <VideoView
        player={PLAYER}
        playsInline={false}
        contentFit="cover"
        nativeControls={false}
        style={{ width: '100%', height: '100%' }}
      />
    </Frame>
  ),
};
