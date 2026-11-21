import {
  EmptyMediaSurface as BloomEmptyMediaSurface,
  MediaFlightHost as BloomMediaFlightHost,
  MediaFlightLayer as BloomMediaFlightLayer,
  MediaPoster as BloomMediaPoster,
  MediaSurface as BloomMediaSurface,
  type MediaSurfaceContent,
  type MediaVideoSlotProps,
  type VideoSurfaceType,
} from '@oxy.so/bloom/media-flight';

import { Node, type Child, type ViewModifiers, type ViewNode } from '../node';
import type { ControlDraw, ControlRenderer } from './draw';

/**
 * Shared-element media that survives a route change (Bloom `media-flight`).
 * Its views are nodes; its controller (`useMediaFlight()`: `measureAnchor`,
 * `flyTo`, `flyBack`, `handOff`, all by id) is used as it is inside a `view()`.
 */
export type MediaFlightKind =
  | 'mediaFlightLayer'
  | 'mediaFlightHost'
  | 'mediaSurface'
  | 'mediaPoster'
  | 'emptyMediaSurface';

/** How media fills its box: `contain` or `cover`. */
export type MediaFit = 'contain' | 'cover';

/** What a video slot draws the player with: the player, its box's style and its fit. */
export type VideoSlot = (props: MediaVideoSlotProps) => Child;

/** The surface's own options, shared by a flight host and a bare surface. */
interface SurfaceModifiers<Self> {
  contentFit(value: MediaFit): Self;
  /** The platform's playback controls over a video. */
  nativeControls(value: boolean): Self;
  /** Android's video surface: `textureView` (default; it clips and transforms) or `surfaceView`. */
  surfaceType(value: VideoSurfaceType): Self;
  /** The flight this surface lands from: it shows its poster while that flight is in the air. */
  flightId(value: string): Self;
  /** Draws the video yourself, with the player Bloom hands it (a view of your own). */
  videoSlot(value: VideoSlot): Self;
}

/** Bloom `MediaFlightLayer`: where flights paint, once at the app's root. */
export type MediaFlightLayerView = ViewNode;
/** Bloom `MediaFlightHost`: media a flight takes off from and lands in, known by its id. */
export interface MediaFlightHostView
  extends ViewModifiers<MediaFlightHostView>,
    SurfaceModifiers<MediaFlightHostView> {}
/** Bloom `MediaSurface`: a still or a consumer-owned video in a box. */
export interface MediaSurfaceView
  extends ViewModifiers<MediaSurfaceView>,
    SurfaceModifiers<MediaSurfaceView> {}
/** Bloom `MediaPoster`: the still of an image or a video. */
export interface MediaPosterView extends ViewModifiers<MediaPosterView> {
  contentFit(value: MediaFit): MediaPosterView;
}
/** Bloom `EmptyMediaSurface`: the box of media with nothing to show. */
export type EmptyMediaSurfaceView = ViewModifiers<EmptyMediaSurfaceView>;

/** Bloom `MediaFlightLayer`. */
export function MediaFlightLayer(): MediaFlightLayerView {
  return new Node('mediaFlightLayer', null, []);
}
/** Bloom `MediaFlightHost`: `content` (an image `{ uri }` or a video `{ kind: 'video', player }`) as anchor `id`. */
export function MediaFlightHost(id: string, content: MediaSurfaceContent): MediaFlightHostView {
  return new Node('mediaFlightHost', { id, content }, []);
}
/** Bloom `MediaSurface`: `content` in the view's box. */
export function MediaSurface(content: MediaSurfaceContent): MediaSurfaceView {
  return new Node('mediaSurface', { content }, []);
}
/** Bloom `MediaPoster`: `content`'s still. */
export function MediaPoster(content: MediaSurfaceContent): MediaPosterView {
  return new Node('mediaPoster', { content }, []);
}
/** Bloom `EmptyMediaSurface`. */
export function EmptyMediaSurface(): EmptyMediaSurfaceView {
  return new Node('emptyMediaSurface', null, []);
}

function surfaceProps(d: ControlDraw): Record<string, unknown> {
  const props = d.props();
  const slot = d.own('videoSlot')?.value;
  Object.assign(props, {
    content: (d.node.props as { content: MediaSurfaceContent }).content,
    contentFit: d.own('contentFit')?.value,
    nativeControls: d.own('nativeControls')?.value,
    surfaceType: d.own('surfaceType')?.value,
    flightId: d.own('flightId')?.value,
    renderVideo:
      slot === undefined ? undefined : (video: MediaVideoSlotProps) => d.render(slot(video)),
  });
  return props;
}

export const MEDIA_FLIGHTS: Record<MediaFlightKind, ControlRenderer> = {
  mediaFlightLayer: (d) => d.component(BloomMediaFlightLayer, d.props()),
  mediaFlightHost: (d) => {
    const props = surfaceProps(d);
    props.id = (d.node.props as { id: string }).id;
    return d.component(BloomMediaFlightHost, props);
  },
  mediaSurface: (d) => d.component(BloomMediaSurface, surfaceProps(d)),
  mediaPoster: (d) => {
    const props = d.props();
    props.content = (d.node.props as { content: MediaSurfaceContent }).content;
    props.contentFit = d.own('contentFit')?.value;
    return d.component(BloomMediaPoster, props);
  },
  emptyMediaSurface: (d) => d.component(BloomEmptyMediaSurface, d.props()),
};
