import type { Meta, StoryObj } from '@storybook/react-vite';
import { View } from 'react-native';

import { BloomImage, type BloomImageContentFit } from './index';
import { Text } from '../typography';

const meta: Meta = {
  parameters: { controls: { disable: true } },
  id: 'foundations-image',
  title: 'Composition/Images/Image',
};

export default meta;

type Story = StoryObj;

/**
 * A wide picture drawn inline, so the story works offline. The plain
 * `data:image/svg+xml,` form: react-native-web re-encodes the `;utf8,` form
 * (see the ImageResolver story).
 */
const WIDE = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='320' height='160'>` +
    `<rect width='320' height='160' fill='hsl(210 70% 55%)'/>` +
    `<circle cx='160' cy='80' r='56' fill='hsl(40 90% 60%)'/>` +
    `</svg>`,
)}`;

const FITS: BloomImageContentFit[] = ['cover', 'contain', 'fill', 'none', 'scale-down'];

/** The same wide picture in a square box, at each `contentFit`. */
export const ContentFit: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, padding: 16 }}>
      {FITS.map((fit) => (
        <View key={fit} style={{ gap: 6 }}>
          <BloomImage
            source={WIDE}
            alt={`contentFit ${fit}`}
            contentFit={fit}
            style={{ width: 120, height: 120, borderRadius: 12 }}
          />
          <Text>{fit}</Text>
        </View>
      ))}
    </View>
  ),
};
