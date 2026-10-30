import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { AmbientPhoto } from './index';
import { Text } from '../typography';

const meta: Meta<typeof AmbientPhoto> = {
  id: 'base-ambient-photo',
  title: 'Components/Media/Ambient Photo',
  component: AmbientPhoto,
};

export default meta;

type Story = StoryObj<typeof AmbientPhoto>;

/** Self-contained "photos": two gradients, so the story needs no network. */
const PHOTOS = [
  ['#1d3557', '#e76f51'],
  ['#2a9d8f', '#f4a261'],
  ['#3a0ca3', '#4cc9f0'],
].map(
  ([from, to]) =>
    `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="1280" height="720" fill="url(#g)"/><circle cx="900" cy="260" r="140" fill="#ffffff" fill-opacity="0.25"/></svg>`,
    )}`,
);

/**
 * The next photo every six seconds, as an ambient frame's timer would ask for
 * it. Each one is decoded before it fades in over the last, and drifts slowly
 * while it rests. The caption reads `onShown`.
 */
function Cycling() {
  const [index, setIndex] = useState(0);
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setIndex((current) => current + 1), 6000);
    return () => clearInterval(timer);
  }, []);
  return (
    <View style={{ height: 360, borderRadius: 16, overflow: 'hidden' }}>
      <AmbientPhoto
        source={PHOTOS[index % PHOTOS.length]}
        onShown={(source) => setShown(PHOTOS.indexOf(source) + 1)}
      />
      <Text style={{ position: 'absolute', left: 16, bottom: 12, color: '#ffffff' }}>
        Photo {shown} of {PHOTOS.length}
      </Text>
    </View>
  );
}

export const Default: Story = {
  render: () => <Cycling />,
};
