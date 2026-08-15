import React, { useState } from 'react';
import { Image, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  DEFAULT_ASPECT_RATIO,
  fetchAspectRatio,
  getAspectRatio,
  hasAspectRatio,
  setAspectRatio,
} from './index';
import { Text } from '../typography';
import { Button } from '../button';
import { Card } from '../card';
import { useTheme } from '../theme';

const meta: Meta = {
  title: 'Foundations/Image aspect-ratio cache',
};

export default meta;

type Story = StoryObj;

/** Cache-busted so each run starts cold; the ratios are genuinely unknown at first. */
function photos(seed: string, count = 4): string[] {
  const shapes = [
    [640, 400],
    [400, 640],
    [800, 300],
    [500, 500],
  ] as const;
  return Array.from({ length: count }, (_, i) => {
    const [w, h] = shapes[i % shapes.length] ?? [640, 400];
    return `https://picsum.photos/seed/${seed}-${i}/${w}/${h}`;
  });
}

const WIDTH = 260;

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Card variant="outlined" radius="radius-16" style={{ padding: 16, gap: 10, width: WIDTH + 32 }}>
      <Text style={{ fontWeight: '600' }}>{label}</Text>
      {children}
    </Card>
  );
}

/** No space reserved: each image resizes its slot the moment it loads. */
function Unreserved({ uris }: { uris: string[] }) {
  return (
    <View style={{ gap: 8 }}>
      {uris.map((uri) => (
        <Image key={uri} source={{ uri }} style={{ width: WIDTH }} resizeMode="cover" />
      ))}
      <Text style={{ fontSize: 12, opacity: 0.7 }}>
        Nothing below these images can hold its position.
      </Text>
    </View>
  );
}

/** Space reserved from the cache, falling back to the shared default. */
function Reserved({ uris }: { uris: string[] }) {
  const [, force] = useState(0);
  for (const uri of uris) {
    if (!hasAspectRatio(uri)) {
      void fetchAspectRatio(uri).then(() => force((n) => n + 1));
    }
  }
  return (
    <View style={{ gap: 8 }}>
      {uris.map((uri) => {
        const ratio = getAspectRatio(uri) ?? DEFAULT_ASPECT_RATIO;
        return (
          <View key={uri} style={{ width: WIDTH, aspectRatio: ratio }}>
            <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          </View>
        );
      })}
      <Text style={{ fontSize: 12, opacity: 0.7 }}>
        Every slot has a height before the bytes arrive.
      </Text>
    </View>
  );
}

/**
 * The problem, and what the cache buys.
 *
 * An image's shape is not known until it loads. A list that reserves no space
 * reflows every time one arrives, which throws the reading position down the
 * page — the feed that jumps while you are reading it.
 *
 * Press "Load again" to see it cold. The left column resizes as each image
 * lands; the right column reserves a box first and never moves. The SECOND run
 * is the interesting one: the ratios are cached, so the right column is correct
 * on the very first frame rather than settling into place.
 */
export const ReflowVersusReserved: Story = {
  render: function ReflowStory() {
    const [run, setRun] = useState(0);
    const uris = photos(`bloom-${run}`);
    return (
      <View style={{ gap: 12 }}>
        <Button onPress={() => setRun((n) => n + 1)}>Load again (new, uncached images)</Button>
        <View style={{ flexDirection: 'row', gap: 16, alignItems: 'flex-start' }}>
          <Row label="No reservation — reflows">
            <Unreserved key={run} uris={uris} />
          </Row>
          <Row label="Reserved from the cache — stable">
            <Reserved key={run} uris={uris} />
          </Row>
        </View>
      </View>
    );
  },
};

/**
 * `hasAspectRatio` is not the same as `getAspectRatio() !== undefined` once you
 * fall back: "not measured yet" and "measured, and it happens to equal the
 * default" want different behaviour, and only the first should settle.
 */
export const KnownVersusGuessed: Story = {
  render: function KnownStory() {
    const { colors } = useTheme();
    const [, force] = useState(0);
    const uris = photos('known', 3);
    return (
      <View style={{ gap: 8, width: 420 }}>
        <Button onPress={() => { for (const u of uris) void fetchAspectRatio(u).then(() => force((n) => n + 1)); }}>
          Measure them
        </Button>
        {uris.map((uri) => {
          const known = hasAspectRatio(uri);
          return (
            <View
              key={uri}
              style={{
                padding: 10,
                borderRadius: 8,
                backgroundColor: known ? colors.primarySubtle : colors.backgroundSecondary,
              }}
            >
              <Text style={{ fontSize: 12 }}>
                {known ? 'measured' : 'unknown — reserving the default'} ·{' '}
                {(getAspectRatio(uri) ?? DEFAULT_ASPECT_RATIO).toFixed(3)}
              </Text>
            </View>
          );
        })}
      </View>
    );
  },
};

/**
 * `setAspectRatio(uri, ratio)` records a ratio you ALREADY know — most media
 * DTOs carry the dimensions. That is strictly better than measuring: the layout
 * is right on frame one, which no amount of caching after the fact achieves.
 */
export const SeededFromTheApi: Story = {
  render: function SeededStory() {
    const uri = 'https://picsum.photos/seed/seeded/900/300';
    // Pretend the API told us: 900 × 300.
    setAspectRatio(uri, 900 / 300);
    return (
      <View style={{ gap: 8, width: 420 }}>
        <Text style={{ fontSize: 12, opacity: 0.7 }}>
          Ratio seeded before render: {getAspectRatio(uri)?.toFixed(3)}
        </Text>
        <View style={{ width: 400, aspectRatio: getAspectRatio(uri) ?? DEFAULT_ASPECT_RATIO }}>
          <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        </View>
      </View>
    );
  },
};
