import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ComposerLoader } from '../../src/composer-loader';
import { useTheme } from '../../src/theme/use-theme';

const meta: Meta = {
  id: 'labs-loader-optics',
  title: 'Labs/Loader Optics',
  parameters: { layout: 'fullscreen' },
};
export default meta;

/** Pixel fixture: physical position and dimensions from the authorized Pixel capture. */
function Optics({
  taper,
  width = 996 / 2.625,
  radius,
}: {
  taper: number;
  width?: number;
  radius?: number;
}) {
  const theme = useTheme();
  return (
    <View style={{ minHeight: 920, backgroundColor: theme.colors.background }}>
      <ComposerLoader
        active
        taper={taper}
        radius={radius}
        testID="optics-loader"
        style={{ position: 'absolute', left: 16, top: 413 / 2.625, width }}
      >
        <View style={{ height: 136 / 2.625 }} />
      </ComposerLoader>
    </View>
  );
}
export const Plain: StoryObj = { render: () => <Optics taper={0} /> };
export const Taper: StoryObj = { render: () => <Optics taper={0.5} /> };

export const NarrowTaper: StoryObj = { render: () => <Optics taper={0.5} width={240} /> };
export const CornerTaper: StoryObj = {
  render: () => <Optics taper={0.5} width={240} radius={12} />,
};
