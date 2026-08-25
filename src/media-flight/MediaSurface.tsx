/**
 * ONE renderer for "an image or a video, painted into a box".
 *
 * Both the flight layer and the media gallery need exactly this, and they need
 * it to be the same code: a flight that lands inside the gallery hands its
 * surface over frame-for-frame, so two renderers that disagree by a pixel of
 * `contentFit` or a corner radius show the swap.
 *
 * BOTH ARMS RENDER THE SAME BOX — an `Animated.View` with the media filling it —
 * rather than the image arm rendering an animated `Image` directly. That is the
 * property that makes an image and a video interchangeable at a call site: the
 * caller's style means the same thing either way, the corner radius clips a
 * platform video surface the way it rounds an image, and the transform lands on
 * a node reanimated is allowed to drive (expo-video's own host is not one).
 */
import { memo, useCallback, useEffect, useRef, useState, type ComponentProps } from 'react';
import {
  Platform,
  StyleSheet,
  View,
  type ImageStyle,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Image } from 'expo-image';
import Animated from 'react-native-reanimated';

import { SLOT_IDENTITY_CHURN_LIMIT } from './constants';
import { handOffFlight } from './store';
import type { MediaSurfaceContent, MediaVideoSlot } from './types';
import {
  loadExpoVideo,
  warnExpoVideoUnavailable,
  type VideoSurfaceType,
} from './expo-video-module';

/**
 * Exactly what `Animated.View` accepts, taken from the component rather than
 * restated: a caller hands this component the output of `useAnimatedStyle` and a
 * hand-written `StyleProp<ViewStyle>` would reject it.
 */
export type MediaSurfaceStyle = ComponentProps<typeof Animated.View>['style'];

/**
 * The style a STILL accepts. The intersection is what lets one value reach both
 * an `Image` and a `View`: `ViewStyle` and `ImageStyle` disagree on exactly one
 * key (`overflow`, which `ViewStyle` also allows to be `'scroll'`), and the
 * intersection narrows it to the two values both accept.
 */
export type MediaPosterStyle = StyleProp<ViewStyle & ImageStyle>;

// Web-only: a media surface is never a drag source. Written as an inline
// conditional SPREAD rather than a `Platform.select` returning `undefined` —
// spreading a `T | undefined` into JSX crashes tsc 5.9 outright
// (`getIntersectionTypeFacts: type.types is not iterable`), and the gallery
// already wrote it this way for the same reason.
const webDraggableProps = Platform.OS === 'web' ? { draggable: false } : {};

export interface MediaSurfaceProps {
  /** What to paint: a still image, or a consumer-owned expo-video player. */
  content: MediaSurfaceContent;
  /** Size, radius and transform of the box. May carry an animated style. */
  style?: MediaSurfaceStyle;
  /** How the media fills the box. Defaults to `'contain'`. */
  contentFit?: 'contain' | 'cover';
  /**
   * Android's rendering surface for the video arm. Defaults to `'textureView'`
   * and is CAPTURED ON FIRST RENDER: expo-video documents that this prop must
   * not change at runtime, and a `surfaceView` is composited outside the app's
   * view hierarchy — it ignores its parent's clip, radius and transform, which
   * is every property a flying box relies on.
   */
  surfaceType?: VideoSurfaceType;
  /**
   * Paint the video yourself, keeping your own `ref` and expo-video props.
   *
   * When this is given, Bloom builds no `VideoView` at all and the optional
   * peer is never loaded on this path — the consumer already imported
   * expo-video to write the slot. See {@link MediaVideoSlot}.
   */
  renderVideo?: MediaVideoSlot;
  /** Whether the video arm shows expo-video's own controls. Defaults to `false`. */
  nativeControls?: boolean;
  accessibilityLabel?: string;
  /**
   * Passed through as a PROP, never as a style key: react-native-web resolves
   * the RN-only `box-none`/`box-only` values from the prop path only.
   */
  pointerEvents?: 'auto' | 'none' | 'box-none' | 'box-only';
  /**
   * Set this on the DESTINATION surface of a media flight, to the same id the
   * flight was started with. When this surface presents its first frame it tells
   * the layer to let the flying copy go.
   *
   * It exists so the ordering knowledge stays in Bloom. The alternative is a
   * consumer releasing the flight on a timer — and the timer is always wrong,
   * because a fullscreen video route measured ~1 s from tap to first frame
   * against production while a flight animation lasts ~300 ms. Whoever guessed
   * would be choosing between a hole and a surface that overstays.
   *
   * Leave it unset on an origin surface, and on the flight layer's own: a
   * surface that handed off to itself would release on its own first frame.
   */
  flightId?: string;
  /**
   * Render the video arm with NO player, unbinding this element from it while
   * the element is still in the DOM.
   *
   * expo-video's web player mirrors pause across every element bound to it, and
   * a `<video>` removed from the DOM is auto-paused by the browser, so a dying
   * element pauses the one the viewer is watching.
   *
   * Setting this for one commit runs expo-video's own `[props.player]` effect
   * early — and the half that matters is `removeAttribute('src'); load()`
   * (`VideoView.web.js:206`), not the unbind beside it. The media element load
   * algorithm pauses WITHOUT firing `pause` (measured in real Chrome, with
   * controls), so the element goes quiet and its later removal fires nothing.
   * Unbinding alone does not help: `unmountVideoView` never clears the handler
   * it installed. See `releaseFlight`, and
   * `scripts/probe-expo-video-listener-leak.mjs`, which measures that in real
   * Chrome against expo-video's real class — including that grafting the
   * missing `_removeListeners` into it makes the leak go away.
   */
  detached?: boolean;
}

/**
 * A still image, or a video fed by a player the CONSUMER owns.
 *
 * The video arm mounts a `VideoView` around the caller's `player`. Bloom never
 * creates, replaces or releases that player — handing one player to a new view
 * is what moves a playing video between surfaces without restarting it, and it
 * is the reason this component takes a player object rather than a source URL.
 */
export const MediaSurface = memo(function MediaSurface({
  content,
  style,
  contentFit = 'contain',
  surfaceType = 'textureView',
  renderVideo,
  nativeControls = false,
  accessibilityLabel,
  pointerEvents,
  flightId,
  detached = false,
}: MediaSurfaceProps) {
  // Captured once — see `surfaceType` above. A consumer changing it later gets
  // the value the view was mounted with, which is the only value expo-video
  // supports.
  const [mountedSurfaceType] = useState(surfaceType);

  // A slot rebuilt on every render republishes this surface to the layer on
  // every render, which nothing at runtime reports — the picture is correct and
  // the app is doing work in proportion to how often its rows re-render. The
  // counter lives in an effect rather than in render: a render-phase ref write
  // makes the React Compiler bail on the whole component.
  const slotChurn = useRef(0);
  useEffect(() => {
    if (renderVideo === undefined) return;
    slotChurn.current += 1;
    if (slotChurn.current === SLOT_IDENTITY_CHURN_LIMIT) warnSlotNotMemoised();
  }, [renderVideo]);

  // Both arms report the same fact — "there is a picture here now" — because the
  // destination of a flight can be either, and a caller should not have to know
  // which one it wired. expo-video raises `onFirstFrameRender` from `loadeddata`
  // on web; expo-image raises `onLoad` once the source is decoded and displayed.
  const reportLive = useCallback(() => {
    if (flightId !== undefined) handOffFlight(flightId);
  }, [flightId]);

  const still = content.kind === 'video' ? content.poster : content.uri;
  // Loaded for the video arm only, and only when Bloom is the one building the
  // element — an image surface must never make an app resolve an optional
  // native peer, and neither must a consumer that brought its own view.
  const expoVideo =
    content.kind === 'video' && renderVideo === undefined ? loadExpoVideo() : null;
  if (content.kind === 'video' && renderVideo === undefined && expoVideo === null) {
    // Degrade to the poster rather than to nothing: a black hole where a video
    // should be reads as a broken app, a still frame reads as a video that has
    // not started. The warning is what makes the difference visible to the
    // developer, once, in dev.
    warnExpoVideoUnavailable();
  }

  return (
    <Animated.View style={[styles.box, style]} pointerEvents={pointerEvents}>
      {still === undefined ? null : (
        // Behind the video (and the whole picture on the image arm), so the box
        // is never empty while a first frame decodes and a flight that starts
        // before playback still carries a picture. This is also why a flight
        // never has to wait for a decode: an unpainted `<video>` sets no
        // `poster` attribute and an Android TextureView runs with the ExoPlayer
        // shutter off, so neither draws anything opaque over this.
        <Image
          source={{ uri: still }}
          contentFit={contentFit}
          style={StyleSheet.absoluteFill}
          transition={0}
          accessibilityLabel={accessibilityLabel}
          // Only the arm that IS the picture reports being live. On the video
          // arm the poster is scenery: handing off on it would release the
          // flying surface while the destination still had no video.
          onLoad={content.kind === 'video' ? undefined : reportLive}
          {...webDraggableProps}
        />
      )}
      {content.kind === 'video' && renderVideo !== undefined
        ? renderVideo({
            player: detached ? null : content.player,
            // The same style Bloom's own view gets, for the same reason: a
            // replaced element that is not told its size paints at 300x150.
            style: [StyleSheet.absoluteFill, styles.fillReplaced],
            contentFit,
          })
        : null}
      {content.kind === 'video' && renderVideo === undefined && expoVideo !== null ? (
        <expoVideo.VideoView
          player={detached ? null : content.player}
          contentFit={contentFit}
          surfaceType={mountedSurfaceType}
          nativeControls={nativeControls}
          // `absoluteFill` ALONE does not size this, and the reason is a CSS
          // rule rather than a bug: expo-video renders a DOM `<video>`, which is
          // a REPLACED element, and `position:absolute; inset:0` with
          // `width/height:auto` resolves a replaced element to its INTRINSIC
          // size — 300x150, the `<video>` default — instead of stretching it.
          // Measured: inside a 320x200 box the element computed
          // `left/right/top/bottom: 0px` and `width: 300px; height: 150px`, so
          // it sat at the default while the box animated around it and then
          // jumped when metadata arrived. The poster escapes this only because
          // expo-image sizes its own element.
          style={[StyleSheet.absoluteFill, styles.fillReplaced]}
          accessibilityLabel={accessibilityLabel}
          onFirstFrameRender={reportLive}
        />
      ) : null}
    </Animated.View>
  );
});

MediaSurface.displayName = 'MediaSurface';

let hasWarnedAboutSlotChurn = false;

/**
 * One warning per module lifetime, and none in production — same mechanism as
 * `warnExpoVideoUnavailable`.
 */
function warnSlotNotMemoised(): void {
  if (process.env.NODE_ENV === 'production' || hasWarnedAboutSlotChurn) return;
  hasWarnedAboutSlotChurn = true;
  // eslint-disable-next-line no-console
  console.warn(
    `[Bloom] A \`renderVideo\` slot changed identity ${SLOT_IDENTITY_CHURN_LIMIT} times. ` +
      'It is part of what a media host publishes to the flight layer and is compared by ' +
      'identity, so a slot rebuilt on every render republishes the surface on every render. ' +
      'Wrap it in `useCallback` with the props it actually reads.',
  );
}

/**
 * The STILL of a media item — a video's poster, or the image itself — and never
 * a video view.
 *
 * This is what every surface that is not the live one renders: an off-screen
 * gallery page, a thumbnail-strip tile, an origin placeholder while its media is
 * in flight. Mounting a `MediaSurface` there instead would put a second
 * `VideoView` on the same player, which is precisely what the "one live surface
 * per id" contract forbids — and on a thumbnail strip it would mean one decoder
 * per tile.
 */
export function MediaPoster({
  content,
  style,
  contentFit = 'cover',
  accessibilityLabel,
}: {
  content: MediaSurfaceContent;
  style?: MediaPosterStyle;
  contentFit?: 'contain' | 'cover';
  accessibilityLabel?: string;
}) {
  const uri = content.kind === 'video' ? content.poster : content.uri;
  if (uri === undefined) return <EmptyMediaSurface style={style} />;
  return (
    <Image
      source={{ uri }}
      contentFit={contentFit}
      style={style}
      transition={0}
      accessibilityLabel={accessibilityLabel}
      {...webDraggableProps}
    />
  );
}

/**
 * A box with no media at all — what a gallery page renders for a video item
 * whose poster is unknown, so the layout never collapses.
 */
export function EmptyMediaSurface({ style }: { style?: MediaPosterStyle }) {
  return <View style={[styles.empty, style]} pointerEvents="none" />;
}

const styles = StyleSheet.create({
  /**
   * Explicit size for a REPLACED element. Redundant for a `<div>` and
   * load-bearing for a `<video>` — see the note at the call site.
   */
  fillReplaced: {
    width: '100%',
    height: '100%',
  },
  box: {
    // What makes the box's corner radius actually clip a video, and the other
    // half of why the Android surface has to be a `textureView`.
    overflow: 'hidden',
  },
  empty: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
});
