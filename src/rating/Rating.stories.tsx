import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Rating } from './Rating';
import { RatingBar } from './RatingBar';
import { Text } from '../typography';
import { useTheme } from '../theme/use-theme';

const meta: Meta = {
  title: 'Base/Rating',
};

export default meta;

type Story = StoryObj;

function Caption({ children }: { children: string }) {
  const theme = useTheme();
  return (
    <Text variant="caption-1-medium" style={{ color: theme.colors.textSecondary }}>
      {children}
    </Text>
  );
}

/** Both sizes: value only, both count styles, a string count, and no rating yet. */
export const Matrix: Story = {
  render: function RatingMatrix() {
    const theme = useTheme();
    return (
      <View style={{ gap: 20, padding: 16, backgroundColor: theme.colors.background }}>
        {(['medium', 'small'] as const).map((size) => (
          <View key={size} style={{ gap: 12 }}>
            <Caption>{size}</Caption>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 24 }}>
              <Rating size={size} value={4.92} />
              <Rating size={size} value={4.92} count={128} />
              <Rating size={size} value={5} count={12} countStyle="reviews" />
              <Rating size={size} value="4.8" count="1.2k" countStyle="reviews" />
              <Rating size={size} value={null} />
            </View>
          </View>
        ))}
      </View>
    );
  },
};

/** A category breakdown (label flexes) and a star distribution (bar flexes), narrow and wide. */
export const Breakdown: Story = {
  render: function RatingBreakdown() {
    const theme = useTheme();
    const categories: Array<[string, number]> = [
      ['Cleanliness', 4.9],
      ['Accuracy', 4.8],
      ['Check-in', 5],
      ['Communication', 4.7],
      ['Location', 4.4],
      ['Value', 4.6],
    ];
    const distribution: Array<[string, number]> = [
      ['5', 0.86],
      ['4', 0.1],
      ['3', 0.03],
      ['2', 0.01],
      ['1', 0],
    ];
    return (
      <View style={{ gap: 24, padding: 16, backgroundColor: theme.colors.background }}>
        {[300, 560].map((width) => (
          <View key={width} style={{ width, gap: 16 }}>
            <Caption>{`${width} wide`}</Caption>
            <Rating value={4.81} count={214} countStyle="reviews" />
            <View style={{ gap: 12 }}>
              {categories.map(([label, value]) => (
                <RatingBar key={label} label={label} value={value} display={value.toFixed(1)} />
              ))}
            </View>
            <View style={{ gap: 8 }}>
              {distribution.map(([label, fraction]) => (
                <RatingBar
                  key={label}
                  label={label}
                  labelWidth={12}
                  value={fraction}
                  max={1}
                  display={`${Math.round(fraction * 100)}%`}
                />
              ))}
            </View>
          </View>
        ))}
      </View>
    );
  },
};
