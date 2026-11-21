import {
  VideoPlaybackProvider,
  VideoViewabilityProvider,
  VideoViewabilityScope as BloomVideoViewabilityScope,
  type ViewableKeysStore,
} from '@oxy.so/bloom/video-playback';

import { Node, type Child, type ViewNode } from '../node';
import type { ControlDraw, ControlRenderer } from './draw';

/**
 * Which video plays (Bloom `video-playback`): one audible player app-wide,
 * visibility-driven autoplay. Its providers are views around what they hold;
 * its hooks (`useVideoPlayback`, `useViewableVisible`…) are used as they are
 * inside a `view()`.
 */
export type VideoPlaybackKind = 'videoPlayback' | 'videoViewability' | 'videoViewabilityScope';

/** Bloom `VideoPlaybackProvider`: the election of the one playing video, for what it holds. */
export interface VideoPlaybackView extends ViewNode {
  /** Whether a visible video starts on its own (the viewer's preference by default). */
  autoplay(value: boolean): VideoPlaybackView;
}
/** Bloom `VideoViewabilityProvider`: the keys a list has on screen, for the players inside it. */
export type VideoViewabilityView = ViewNode;
/** Bloom `VideoViewabilityScope`: what it holds is visible as the list's item `key` is. */
export type VideoViewabilityScopeView = ViewNode;

/** Bloom `VideoPlaybackProvider` around `children` (once, at the app's root). */
export function VideoPlayback(...children: Child[]): VideoPlaybackView {
  return new Node('videoPlayback', null, children);
}
/**
 * Bloom `VideoViewabilityProvider` around `children`: `viewable` is the keys on
 * screen (a set derived while rendering) or the store a list publishes them to.
 */
export function VideoViewability(
  viewable: ReadonlySet<string> | ViewableKeysStore,
  ...children: Child[]
): VideoViewabilityView {
  return new Node('videoViewability', { viewable }, children);
}
/** Bloom `VideoViewabilityScope` around `children`: visible as the item `key` is. */
export function VideoViewabilityScope(
  key: string,
  ...children: Child[]
): VideoViewabilityScopeView {
  return new Node('videoViewabilityScope', { viewabilityKey: key }, children);
}

const children = (d: ControlDraw) => d.children(d.node.children);

export const VIDEO_PLAYBACK: Record<VideoPlaybackKind, ControlRenderer> = {
  videoPlayback: (d) => {
    const props = d.props();
    props.autoplay = d.own('autoplay')?.value;
    return d.component(VideoPlaybackProvider, props, ...children(d));
  },
  videoViewability: (d) => {
    const { viewable } = d.node.props as { viewable: ReadonlySet<string> | ViewableKeysStore };
    const props = d.props();
    if (viewable instanceof Set) props.viewableKeys = viewable;
    else props.store = viewable;
    return d.component(VideoViewabilityProvider, props, ...children(d));
  },
  videoViewabilityScope: (d) => {
    const props = d.props();
    props.viewabilityKey = (d.node.props as { viewabilityKey: string }).viewabilityKey;
    return d.component(BloomVideoViewabilityScope, props, ...children(d));
  },
};
