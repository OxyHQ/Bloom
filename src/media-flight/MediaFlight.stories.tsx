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
    // AWAIT before hiding the origin. In an app this is the line before
    // `router.push`, and it is the whole ordering contract: the promise resolves
    // once the layer has committed its surface, which on web is the moment that
    // surface joined expo-video's mounted set — while the origin's was still in
    // it. Hiding the origin first is what makes a video restart at zero.
    await flight.flyTo('story-media', to, CONTENT, {
      from: from ?? undefined,
      contentFit: 'cover',
      cornerRadius: 16,
    });
    setFlying(true);
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

      {/* The DEGRADED path: no origin was measured, so there is nothing to fly
          FROM. Exercised on purpose — this is the shape a user reports as "it
          appeared full-size and just sat there", and no test that passes `from`
          can reach it. */}
      <Pressable
        onPress={() => {
          void (async () => {
            const to = await measure(targetRef.current);
            if (!to) return;
            setFlying(true);
            await flight.flyTo('story-media', to, CONTENT, { contentFit: 'cover' });
          })();
        }}
        testID="flight-nofrom"
      >
        <Text>Fly with NO origin rect</Text>
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

/**
 * HOW LONG AFTER `flyTo` RESOLVES DOES THE SURFACE ACTUALLY PRESENT PIXELS?
 *
 * `flyTo` resolves on the layer's COMMIT, deliberately — waiting for a decode
 * would put the whole decode in front of the user's tap. But committing a
 * surface is not painting one, and measured in a consuming app there was a
 * ~350 ms window where the origin had already gone and the flight had not yet
 * drawn: the exact hole the transition exists to cover.
 *
 * This is the A/B that says whether that window is the POSTER being fetched
 * cold. `warm` flies a URI the page has already rendered (so it is in the image
 * cache); `cold` flies the same image with a cache-buster, which is what a
 * consumer gets when the origin never actually requested that URL — and
 * expo-video's web `VideoView` renders NO `poster` attribute, so a feed showing
 * video may never have fetched its poster at all.
 *
 * Driven by `scripts/verify-media-flight.mjs --paint-latency`.
 */
function PaintLatencyDemo() {
  const flight = useMediaFlight();
  const targetRef = React.useRef<View | null>(null);

  const fly = React.useCallback(
    async (id: string, uri: string) => {
      const to = await measure(targetRef.current);
      if (!to) return;
      // Stamped on `window` so the harness can time from RESOLUTION — the
      // moment the consumer would navigate — rather than from the click.
      await flight.flyTo(id, to, { uri }, { contentFit: 'cover' });
      (window as unknown as { __flightResolvedAt?: number }).__flightResolvedAt =
        performance.now();
    },
    [flight],
  );

  return (
    <View style={{ gap: 12 }}>
      {/* Rendered so the browser has it decoded: this is what makes `warm` warm. */}
      <Image source={{ uri: PHOTO }} style={{ width: 96, height: 96 }} />
      <Pressable onPress={() => void fly('warm', PHOTO)} testID="fly-warm">
        <Text>Fly a poster the page already painted</Text>
      </Pressable>
      <Pressable
        onPress={() => void fly('cold', `${PHOTO}&cachebust=${Date.now()}`)}
        testID="fly-cold"
      >
        <Text>Fly a poster the page has never requested</Text>
      </Pressable>
      <View ref={targetRef} style={{ width: 320, height: 200 }} />
      <MediaFlightLayer />
    </View>
  );
}

export const PaintLatency: Story = {
  render: () => <PaintLatencyDemo />,
};
