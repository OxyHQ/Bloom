import { VideoView as BloomVideoView, type VideoViewProps } from '@oxy.so/bloom/video-view';

import { Node, type ContentFit, type ViewModifiers } from '../node';
import type { ControlRenderer } from './draw';

/** expo-video's view, inline by default: the one way an Oxy app paints a video (Bloom `video-view`). */
export type VideoViewKind = 'video';

/** Bloom `VideoView`: a player's picture. */
export interface VideoView extends ViewModifiers<VideoView> {
  /** How the picture fills its box: `contain` by default. */
  contentFit(value: ContentFit): VideoView;
  /** The platform's playback controls over it. */
  nativeControls(value: boolean): VideoView;
  /** Whether it can float in picture in picture. */
  allowsPictureInPicture(value: boolean): VideoView;
}

/** Bloom `VideoView`: the picture of `player` (the app's own expo-video player). */
export function Video(player: VideoViewProps['player']): VideoView {
  return new Node('video', { player }, []);
}

export const VIDEOS: Record<VideoViewKind, ControlRenderer> = {
  video: (d) => {
    const props = d.props();
    Object.assign(props, {
      player: (d.node.props as { player: VideoViewProps['player'] }).player,
      contentFit: d.own('contentFit')?.value,
      nativeControls: d.own('nativeControls')?.value,
      allowsPictureInPicture: d.own('allowsPictureInPicture')?.value,
    });
    return d.component(BloomVideoView, props);
  },
};
