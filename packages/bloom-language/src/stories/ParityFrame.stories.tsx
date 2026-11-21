import type { Meta, StoryObj } from '@storybook/react-vite';
import { View } from 'react-native';

import { FAMILIES, type Family, type Side } from './parity-families';

/**
 * One side of one parity case, alone in a frame of its own: what a
 * `Language/Parity` table draws for an isolated case (one that pins to the
 * document), so both sides land where the same frame puts them.
 */
function ParityFrame({ family, index, side }: { family: Family; index: number; side: Side }) {
  const c = FAMILIES[family]?.[index];
  return <View testID="parity-frame">{c ? c[side]() : null}</View>;
}

const meta: Meta<typeof ParityFrame> = {
  title: 'Language/Parity frame',
  component: ParityFrame,
  parameters: { layout: 'fullscreen' },
  argTypes: {
    family: { control: 'select', options: Object.keys(FAMILIES) },
    index: { control: 'number' },
    side: { control: 'radio', options: ['bloom', 'language'] },
  },
};
export default meta;

export const OneSide: StoryObj<typeof ParityFrame> = {
  args: { family: 'navigation', index: 0, side: 'bloom' },
};
