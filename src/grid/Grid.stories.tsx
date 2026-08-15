import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import * as Grid from './index';
import { Text } from '../typography';
import { useTheme } from '../theme';

const meta: Meta = {
  title: 'Components/Grid',
};

export default meta;

type Story = StoryObj;

function Cell({ label }: { label: string }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        backgroundColor: colors.backgroundSecondary,
        borderRadius: 8,
        paddingVertical: 16,
        alignItems: 'center',
      }}
    >
      <Text>{label}</Text>
    </View>
  );
}

/**
 * `Row` + `Col` are a twelfths-free proportional grid: `width` is a FRACTION of
 * the row (0…1), not a column count. `Row` owns the gap and negative-margins
 * itself so the outer edges stay flush; `Col` reads that gap from context, which
 * is why a `Col` outside a `Row` has no gutter rather than a wrong one.
 */
export const Halves: Story = {
  render: () => (
    <View style={{ width: 420 }}>
      <Grid.Row gap={12}>
        <Grid.Col width={1 / 2}>
          <Cell label="1/2" />
        </Grid.Col>
        <Grid.Col width={1 / 2}>
          <Cell label="1/2" />
        </Grid.Col>
      </Grid.Row>
    </View>
  ),
};

/** Uneven splits — the fractions are yours to choose and need not be equal. */
export const Uneven: Story = {
  render: () => (
    <View style={{ width: 420, gap: 12 }}>
      <Grid.Row gap={12}>
        <Grid.Col width={2 / 3}>
          <Cell label="2/3" />
        </Grid.Col>
        <Grid.Col width={1 / 3}>
          <Cell label="1/3" />
        </Grid.Col>
      </Grid.Row>
      <Grid.Row gap={12}>
        <Grid.Col width={1 / 4}>
          <Cell label="1/4" />
        </Grid.Col>
        <Grid.Col width={1 / 4}>
          <Cell label="1/4" />
        </Grid.Col>
        <Grid.Col width={1 / 2}>
          <Cell label="1/2" />
        </Grid.Col>
      </Grid.Row>
    </View>
  ),
};

/** `gap={0}` collapses the gutters without changing the fractions. */
export const NoGap: Story = {
  render: () => (
    <View style={{ width: 420 }}>
      <Grid.Row>
        <Grid.Col width={1 / 3}>
          <Cell label="1/3" />
        </Grid.Col>
        <Grid.Col width={1 / 3}>
          <Cell label="1/3" />
        </Grid.Col>
        <Grid.Col width={1 / 3}>
          <Cell label="1/3" />
        </Grid.Col>
      </Grid.Row>
    </View>
  ),
};
