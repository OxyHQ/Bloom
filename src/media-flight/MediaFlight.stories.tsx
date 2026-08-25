import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { StyleSheet } from 'react-native';

import { MediaFlightLayer } from './MediaFlightLayer';
import { provideExpoVideo, type VideoViewLikeProps } from './expo-video-module';
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

/**
 * THE VIDEO ARM, WHICH WAS UNOBSERVABLE UNTIL NOW.
 *
 * Measured: in a Vite bundle `typeof require` is `undefined`, so the
 * optional-peer `require` cannot run, `loadExpoVideo()` returns null and
 * `MediaSurface` degrades to its poster — **no `<video>` was ever created in
 * this harness**. Every flight story flew an image, so the video arm's geometry
 * had never been observed at all.
 *
 * `provideExpoVideo` closes that. It is not a test hook: it is what any ESM web
 * consumer needs, for exactly the reason above. Here it installs a `VideoView`
 * that renders a REAL `<video>` and applies the incoming style the way
 * expo-video's own web view does (`{...StyleSheet.flatten(style), objectFit}`),
 * so the element under measurement receives EXACTLY what `MediaSurface` passes
 * — otherwise the gate would be measuring the double instead of the mechanism.
 *
 * `BrokenVideoView` is the positive control: same component, but it applies
 * WIDTH and not HEIGHT. That reproduces the reported shape — an element whose
 * width tracks the box while its height sits at the `<video>` default of 150 —
 * so the gate can be shown to fail on it before it is trusted when it passes.
 */
/**
 * A 3.7 kB H.264 clip, inline so the harness needs no server and no network.
 * Real Chrome decodes it; Playwright's Chromium would not, which is why these
 * gates launch the packaged Chrome.
 */
const TINY_MP4 = 'data:video/mp4;base64,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';

function makeVideoView(applyHeight: boolean) {
  return function StoryVideoView(props: VideoViewLikeProps) {
    const flat = (StyleSheet.flatten(props.style) ?? {}) as Record<string, unknown>;
    const style: Record<string, unknown> = { ...flat, objectFit: props.contentFit };
    if (!applyHeight) delete style.height;
    if (!applyHeight) { delete style.top; delete style.bottom; }
    // `player == null` means MediaSurface has UNBOUND this element on its way
    // out. Mirroring expo-video, which drops the source in exactly that case —
    // and it is what makes "did it keep playing" observable at all.
    const detached = props.player == null;
    return React.createElement('video', {
      'data-testid': detached ? 'story-video-detached' : 'story-video',
      src: TINY_MP4,
      autoPlay: true,
      muted: true,
      loop: true,
      playsInline: true,
      style,
    });
  };
}
const INERT_PLAYER = { playing: false, play: () => {}, pause: () => {} };
const VIDEO_CONTENT: MediaSurfaceContent = {
  kind: 'video',
  player: INERT_PLAYER,
  poster: PHOTO,
};

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

      {/* The VIDEO arm, with the same options the reporting app uses. The
          second button installs a view that applies width and not height —
          the positive control for the geometry assertion. */}
      {([
        ['flight-video', true, 'Fly a VIDEO'],
        ['flight-video-broken', false, 'Fly a VIDEO (height not applied)'],
      ] as const).map(([testID, applyHeight, label]) => (
        <Pressable
          key={testID}
          onPress={() => {
            void (async () => {
              provideExpoVideo({ VideoView: makeVideoView(applyHeight) });
              const from = await measure(thumbRef.current);
              const to = await measure(targetRef.current);
              if (!to) return;
              setFlying(true);
              await flight.flyTo('story-video', to, VIDEO_CONTENT, {
                from: from ?? undefined,
                contentFit: 'contain',
                cornerRadius: 0,
              });
            })();
          }}
          testID={testID}
        >
          <Text>{label}</Text>
        </Pressable>
      ))}
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
