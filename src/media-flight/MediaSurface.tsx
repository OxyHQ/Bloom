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
import { memo, useState, type ComponentProps } from 'react';
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

import type { MediaSurfaceContent } from './types';
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
  /** Whether the video arm shows expo-video's own controls. Defaults to `false`. */
  nativeControls?: boolean;
  accessibilityLabel?: string;
  /**
   * Passed through as a PROP, never as a style key: react-native-web resolves
   * the RN-only `box-none`/`box-only` values from the prop path only.
   */
  pointerEvents?: 'auto' | 'none' | 'box-none' | 'box-only';
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
  nativeControls = false,
  accessibilityLabel,
  pointerEvents,
}: MediaSurfaceProps) {
  // Captured once — see `surfaceType` above. A consumer changing it later gets
  // the value the view was mounted with, which is the only value expo-video
  // supports.
  const [mountedSurfaceType] = useState(surfaceType);

  const still = content.kind === 'video' ? content.poster : content.uri;
  // Loaded for the video arm only, and only when there is one — an image
  // surface must never make an app resolve an optional native peer.
  const expoVideo = content.kind === 'video' ? loadExpoVideo() : null;
  if (content.kind === 'video' && expoVideo === null) {
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
        // before playback still carries a picture.
        <Image
          source={{ uri: still }}
          contentFit={contentFit}
          style={StyleSheet.absoluteFill}
          transition={0}
          accessibilityLabel={accessibilityLabel}
          {...webDraggableProps}
        />
      )}
      {content.kind === 'video' && expoVideo !== null ? (
        <expoVideo.VideoView
          player={content.player}
          contentFit={contentFit}
          surfaceType={mountedSurfaceType}
          nativeControls={nativeControls}
          style={StyleSheet.absoluteFill}
          accessibilityLabel={accessibilityLabel}
        />
      ) : null}
    </Animated.View>
  );
});

MediaSurface.displayName = 'MediaSurface';

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
  box: {
    // What makes the box's corner radius actually clip a video, and the other
    // half of why the Android surface has to be a `textureView`.
    overflow: 'hidden',
  },
  empty: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
});
