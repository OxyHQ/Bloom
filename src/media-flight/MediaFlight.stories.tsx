import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { MediaFlightLayer } from './MediaFlightLayer';
import { useMediaFlight } from './use-media-flight';
import type { MediaSurfaceContent, MeasuredRect } from './types';

/**
 * The flight layer's whole behaviour is motion between two measured rects, and
 * every way it can be wrong is invisible to jest: a frozen mapper (a missing
 * reanimated deps array on web), a surface that paints under the app instead of
 * over it, and a layer that swallows the click meant for the button underneath
 * it all render identically in a snapshot.
 *
 * So these stories are the instrument. Each one measures a real thumbnail and a
 * real target box in a real browser and asks the layer to move a surface between
 * them; `scripts/verify-overlay-stacking.mjs` drives {@link ClickThrough} with
 * trusted input, which is the only way to tell a layer that is `pointer-events:
 * none` from one that merely looks like it.
 */
const meta: Meta = {
  title: 'Overlays/MediaFlight',
};

export default meta;

type Story = StoryObj;

const PHOTO =
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200';

const CONTENT: MediaSurfaceContent = { uri: PHOTO };

function measure(node: View | null): Promise<MeasuredRect | null> {
  return new Promise((resolve) => {
    if (!node) {
      resolve(null);
      return;
    }
    node.measureInWindow((x, y, width, height) => {
      resolve(width > 0 && height > 0 ? { x, y, width, height } : null);
    });
  });
}

/**
 * A thumbnail and a big empty target, with the layer flying a picture between
 * them — the two-screen case collapsed into one story, because what has to be
 * observable is the MOTION and the layer's independence from whoever asked for
 * it, not the routing.
 */
function FlightDemo() {
  const flight = useMediaFlight();
  const thumbRef = React.useRef<View | null>(null);
  const targetRef = React.useRef<View | null>(null);
  const [flying, setFlying] = React.useState(false);

  const send = React.useCallback(async () => {
    const from = await measure(thumbRef.current);
    const to = await measure(targetRef.current);
    if (!to) return;
    setFlying(true);
    flight.flyTo('story-media', to, CONTENT, {
      from: from ?? undefined,
      contentFit: 'cover',
      cornerRadius: 16,
    });
  }, [flight]);

  const back = React.useCallback(() => {
    setFlying(false);
    flight.flyBack('story-media');
  }, [flight]);

  return (
    <View style={{ gap: 16 }}>
      <Pressable
        ref={(node) => {
          thumbRef.current = node;
          // The origin DECLARES where it wants the surface; `flyBack` measures
          // this same node to know where to land.
          flight.registerAnchor('story-media', node);
        }}
        onPress={() => {
          void send();
        }}
        testID="flight-thumb"
      >
        {/* While the surface is in flight the origin renders a HOLE, not a
            second copy — one live surface per id is the contract, and two
            copies is exactly what it exists to prevent. */}
        {flying ? (
          <View
            style={{ width: 96, height: 96, borderRadius: 16, backgroundColor: '#2224' }}
          />
        ) : (
          <Image
            source={{ uri: PHOTO }}
            style={{ width: 96, height: 96, borderRadius: 16 }}
          />
        )}
      </Pressable>

      <View
        ref={targetRef}
        style={{
          width: 320,
          height: 200,
          borderRadius: 16,
          borderWidth: 1,
          borderStyle: 'dashed',
          borderColor: '#888',
        }}
      />

      <Pressable onPress={back} testID="flight-back">
        <Text>Fly back</Text>
      </Pressable>
    </View>
  );
}

export const FlyToAndBack: Story = {
  render: () => (
    <View style={{ gap: 16 }}>
      <FlightDemo />
      {/* Mounted ONCE, at the root. In an app this lives in `app/_layout.tsx`. */}
      <MediaFlightLayer />
    </View>
  ),
};

/**
 * The stacking / hit-testing case, and the one `verify-overlay-stacking.mjs`
 * drives: a flying surface is parked directly over a button, and the button
 * must still receive the click. Reading `pointerEvents` off the node would
 * report a surface the user cannot actually click through as fine, so the
 * assertion is the `result` line, which only the button can write.
 */
function ClickThroughDemo() {
  const flight = useMediaFlight();
  const targetRef = React.useRef<View | null>(null);
  const [result, setResult] = React.useState('idle');

  const cover = React.useCallback(async () => {
    const to = await measure(targetRef.current);
    if (!to) return;
    flight.flyTo('story-cover', to, CONTENT, { contentFit: 'cover' });
  }, [flight]);

  // The testIDs and the `result: ` prefix are the protocol
  // `scripts/verify-overlay-stacking.mjs` drives every case with.
  return (
    <View style={{ gap: 12 }}>
      <Pressable
        onPress={() => {
          void cover();
        }}
        testID="open-first"
      >
        <Text>Park a flying surface over the button</Text>
      </Pressable>

      <View ref={targetRef}>
        <Pressable onPress={() => setResult('flight')} testID="top-action">
          <Text>Press me</Text>
        </Pressable>
      </View>

      <Text testID="result">result: {result}</Text>
      <MediaFlightLayer />
    </View>
  );
}

export const ClickThrough: Story = {
  render: () => <ClickThroughDemo />,
};
