import { useEffect, useId, useMemo, useRef, useSyncExternalStore } from 'react';
import { BloomImage } from '@oxy.so/bloom/image';
import { useVideoPlayback } from '@oxy.so/bloom/video-playback';
import { VideoView as BloomVideoView, type VideoViewProps } from '@oxy.so/bloom/video-view';

import { Node, type ContentFit, type ViewModifiers } from '../node';
import { Observable } from '../observable';
import { type ControlRenderer, defineControls } from './draw';
import {
  isVideoModel,
  subscribeVideoPlayer,
  type VideoModel,
  videoAttach,
  videoPause,
  videoPlay,
  videoPlayerOf,
  videoRelease,
} from './video-pool';

/** expo-video's view, inline by default: the one way an Oxy app paints a video (Bloom `video-view`). */
export type VideoViewKind = 'video';

/** A URL as Bloom's `URL` struct carries it, or its text. */
type UrlLike = string | { readonly absoluteString: string };

/** Bloom `VideoView`: a player's picture. */
export interface VideoView extends ViewModifiers<VideoView> {
  /** How the picture fills its box: `contain` by default. */
  contentFit(value: ContentFit): VideoView;
  /** The platform's playback controls over it. */
  nativeControls(value: boolean): VideoView;
  /** Whether it can float in picture in picture. */
  allowsPictureInPicture(value: boolean): VideoView;
  /** The image drawn until the video's first frame (Bloom's `VideoPlayer` and `Video(url)`). */
  poster(url: UrlLike): VideoView;
  /** AVKit's gravity: `fill` covers the box (cropped), `fit` shows the whole picture. */
  videoGravity(value: 'fill' | 'fit'): VideoView;
  /** The platform's playback controls: `automatic` shows them, `hidden` does not. */
  controls(value: 'hidden' | 'automatic'): VideoView;
  /** Plays without sound (a `Video(url)`'s own player). */
  muted(value?: boolean): VideoView;
  /** Starts again when it ends (a `Video(url)`'s own player). */
  loops(value?: boolean): VideoView;
  /** Plays while it is on screen and pauses off it, the one audible video at a time. */
  autoplay(value?: boolean): VideoView;
}

/**
 * Bloom `VideoView`: the picture of `source`, which is the app's own expo-video player, a Bloom
 * `VideoPlayer` (`Video(player:)`), or a URL whose player the view builds and owns
 * (`Video(url:poster:)`), drawn from the pool's decoders.
 */
export function Video(
  source: VideoViewProps['player'] | VideoModel | UrlLike,
  poster?: UrlLike,
): VideoView {
  const view = new Node('video', { player: source }, []) as unknown as VideoView;
  return poster === undefined ? view : view.poster(poster);
}

/** A `Video(url:)`'s own player: the Bloom `VideoPlayer`'s fields, made by the view. */
class OwnedPlayer extends Observable {
  isMuted = false;
  loops = false;
  currentTime = 0;
  duration = 0;
  isPlaying = false;
  constructor(readonly url: string) {
    super();
  }
}

const urlText = (url: UrlLike | undefined): string | undefined =>
  url === undefined ? undefined : typeof url === 'string' ? url : url.absoluteString;

interface LanguageVideoProps extends Record<string, unknown> {
  source: unknown;
  poster?: UrlLike;
  muted?: boolean;
  loops?: boolean;
  autoplay?: boolean;
}

/** A Bloom player (or a URL's own) drawn from the pool, with its poster until its first frame. */
function LanguageVideo({
  source,
  poster,
  muted,
  loops,
  autoplay,
  style,
  ...props
}: LanguageVideoProps) {
  const url =
    typeof source === 'string' || !isVideoModel(source) ? urlText(source as UrlLike) : undefined;
  const owned = useMemo(() => (url === undefined ? undefined : new OwnedPlayer(url)), [url]);
  const model = (owned ?? source) as VideoModel;
  useEffect(() => {
    videoAttach(model);
    return owned ? () => videoRelease(owned) : undefined;
  }, [model, owned]);
  if (owned) {
    if (muted !== undefined && owned.isMuted !== muted) owned.$set('isMuted', muted);
    if (loops !== undefined && owned.loops !== loops) owned.$set('loops', loops);
  }
  const player = useSyncExternalStore(
    (listener) => subscribeVideoPlayer(model, listener),
    () => videoPlayerOf(model),
    () => videoPlayerOf(model),
  );
  // `.autoplay()`: the playback election's answer (visible, on a visible screen, elected).
  const target = useRef(null);
  const id = useId();
  const { shouldPlay } = useVideoPlayback({ id, target, silent: model.isMuted });
  useEffect(() => {
    if (!autoplay) return;
    if (shouldPlay) videoPlay(model);
    else videoPause(model);
  }, [autoplay, shouldPlay, model]);
  const playing = useSyncExternalStore(
    (listener) => model.$subscribe(['isPlaying'], listener),
    () => model.isPlaying,
    () => model.isPlaying,
  );
  const posterURL = urlText(poster);
  const view = (
    <BloomVideoView
      ref={target}
      {...props}
      style={style as VideoViewProps['style']}
      player={player as never}
    />
  );
  if (posterURL === undefined || playing) return view;
  return (
    <>
      {view}
      <BloomImage
        source={posterURL}
        contentFit={props.contentFit === 'contain' ? 'contain' : 'cover'}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
    </>
  );
}

const VIDEOS: Record<VideoViewKind, ControlRenderer> = {
  video: (d) => {
    const props = d.props();
    const gravity = d.own('videoGravity')?.value;
    const controls = d.own('controls')?.value;
    Object.assign(props, {
      contentFit:
        gravity === 'fill' ? 'cover' : gravity === 'fit' ? 'contain' : d.own('contentFit')?.value,
      nativeControls:
        controls === undefined ? d.own('nativeControls')?.value : controls === 'automatic',
      allowsPictureInPicture: d.own('allowsPictureInPicture')?.value,
    });
    const source = (d.node.props as { player: unknown }).player;
    // The app's own expo-video player: drawn as it is.
    if (
      source !== null &&
      typeof source === 'object' &&
      !isVideoModel(source) &&
      !('absoluteString' in source)
    ) {
      return d.component(BloomVideoView, { ...props, player: source });
    }
    return d.component(LanguageVideo, {
      ...props,
      source,
      poster: d.own('poster')?.value,
      muted: d.own('muted')?.value as boolean | undefined,
      loops: d.own('loops')?.value,
      autoplay: d.own('autoplay')?.value,
    });
  },
};
defineControls(VIDEOS);
