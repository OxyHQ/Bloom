import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import type { CSSProperties } from 'react';
import { usePrefersReducedMotion } from '../hooks/use-prefers-reduced-motion';
import { pointerEventsStyle } from '../styles/pointer-events';
import { DEFAULT_DRIFT_MS, DEFAULT_DRIFT_SCALE, DEFAULT_FADE_MS, RELEASE_SLACK_MS } from './shared';
import type { AmbientPhotoProps } from './types';

type Layer = HTMLDivElement & { driftAnimation?: Animation };

const LAYER: CSSProperties = {
  position: 'absolute',
  inset: 0,
  backgroundPosition: 'center',
  backgroundSize: 'cover',
  backgroundRepeat: 'no-repeat',
  opacity: 0,
};

/** `decode()` leaves the bitmap ready; `onload` only says the bytes are here. */
function decoded(image: HTMLImageElement): Promise<void> {
  if (image.decode) return image.decode();
  return new Promise((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = reject;
  });
}

/**
 * WEB fork of {@link AmbientPhoto}: two DOM layers that cross-fade, written
 * straight to the DOM rather than through React state. The photo is the one
 * thing on an ambient screen that never stops moving, and each change is an
 * opacity cross-fade that must not wait for a render.
 *
 * Measured on a Chromecast (Chrome 90), and kept:
 * - a new photo is fetched and DECODED before it starts fading in, so decoding
 *   never lands on the first frame of the fade;
 * - `will-change` is set only while a fade runs: left on, it kept two
 *   full-screen layers as textures on a device with little memory;
 * - the layer that faded out lets go of its image;
 * - the drift is a Web Animation on `transform` (compositor-only), to 1.04.
 */
export function AmbientPhoto({
  source,
  fadeMs = DEFAULT_FADE_MS,
  drift = true,
  driftMs = DEFAULT_DRIFT_MS,
  driftScale = DEFAULT_DRIFT_SCALE,
  onShown,
  style,
  testID,
}: AmbientPhotoProps) {
  const layers = useRef<[Layer | null, Layer | null]>([null, null]);
  const active = useRef(0);
  const requested = useRef<string | null>(null);
  const releaseTimer = useRef(0);
  // The latest props, read when a photo that was requested earlier is shown.
  // The system's reduced-motion setting stops the drift; the fade stays.
  const still = usePrefersReducedMotion();
  const latest = useRef({ fadeMs, drift: drift && !still, driftMs, driftScale, onShown });
  latest.current = { fadeMs, drift: drift && !still, driftMs, driftScale, onShown };

  useEffect(() => {
    if (!source || source === requested.current) return;
    requested.current = source;
    const image = new Image();
    image.src = source;
    decoded(image).then(
      () => {
        // A newer photo was asked for while this one decoded: it wins.
        if (requested.current !== source) return;
        const [first, second] = layers.current;
        if (!first || !second) return;
        const options = latest.current;
        const incoming = active.current === 0 ? second : first;
        const outgoing = active.current === 0 ? first : second;
        incoming.style.backgroundImage = `url(${JSON.stringify(source)})`;
        incoming.driftAnimation?.cancel();
        incoming.driftAnimation = options.drift
          ? incoming.animate(
              [{ transform: 'scale(1)' }, { transform: `scale(${options.driftScale})` }],
              { duration: options.driftMs, easing: 'ease-out', fill: 'forwards' },
            )
          : undefined;
        incoming.style.transition =
          outgoing.style.transition = `opacity ${options.fadeMs}ms ease-in-out`;
        incoming.style.willChange = outgoing.style.willChange = 'opacity, transform';
        incoming.style.opacity = '1';
        outgoing.style.opacity = '0';
        active.current = 1 - active.current;
        options.onShown?.(source);
        window.clearTimeout(releaseTimer.current);
        releaseTimer.current = window.setTimeout(() => {
          incoming.style.willChange = outgoing.style.willChange = '';
          outgoing.style.backgroundImage = 'none';
          outgoing.driftAnimation?.cancel();
          outgoing.driftAnimation = undefined;
        }, options.fadeMs + RELEASE_SLACK_MS);
      },
      () => {
        // A photo that cannot load leaves the current one on screen.
        if (requested.current === source) requested.current = null;
      },
    );
  }, [source]);

  useEffect(
    () => () => {
      window.clearTimeout(releaseTimer.current);
      for (const layer of layers.current) layer?.driftAnimation?.cancel();
    },
    [],
  );

  return (
    <View style={[styles.root, pointerEventsStyle('none'), style]} testID={testID} aria-hidden>
      <div
        style={LAYER}
        ref={(node) => {
          layers.current[0] = node;
        }}
      />
      <div
        style={LAYER}
        ref={(node) => {
          layers.current[1] = node;
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, overflow: 'hidden' },
});
