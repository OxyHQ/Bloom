import {
  PlaybackProgress as BloomPlaybackProgress,
  type PlaybackProgressProps,
  PlayButton as BloomPlayButton,
  type PlayButtonProps,
} from '@oxy.so/bloom/media-controls';

import { Node, type ViewModifiers } from '../node';
import type { PlaybackTimes, PlayButtonSize, PlayButtonStyle } from '../tokens';
import type { ControlRenderer } from './draw';
import { product } from './product';

/** Media controls: the play button and the playback scrubber. */
export type MediaControlKind = 'playButton' | 'playbackProgress';

/** Bloom `PlayButton`'s words and its role (`interactive: false` inside a pressable poster). */
export type PlayButtonOptions = Pick<
  PlayButtonProps,
  'interactive' | 'subject' | 'playLabel' | 'pauseLabel'
>;
/** Bloom `PlaybackProgress`'s data and handlers. */
export type PlaybackProgressOptions = Omit<
  PlaybackProgressProps,
  'value' | 'duration' | 'disabled' | 'timesPosition' | 'style' | 'testID' | 'accessibilityLabel'
>;

/** Bloom `PlayButton`: play or pause; `.onPress()` is what it does. */
export interface PlayButtonView extends ViewModifiers<PlayButtonView> {
  /** `sm`, `md` (default) or `lg`. */
  size(value: PlayButtonSize): PlayButtonView;
  /** `accent` (default), `inverse` or `plain`. */
  style(value: PlayButtonStyle): PlayButtonView;
  /** A spinning ring in place of the glyph; it stays pressable. */
  loading(value?: boolean): PlayButtonView;
  disabled(value?: boolean): PlayButtonView;
}
/** Bloom `PlaybackProgress`: the position in the media, which a drag or a key seeks. */
export interface PlaybackProgressView extends ViewModifiers<PlaybackProgressView> {
  /** Where the times go when shown: `inline` (default) or `below`. */
  style(value: PlaybackTimes): PlaybackProgressView;
  disabled(value?: boolean): PlaybackProgressView;
}

/** Bloom `PlayButton`: `playing` draws the pause glyph and names it Pause. */
export function PlayButton(playing: boolean, options: PlayButtonOptions = {}): PlayButtonView {
  return new Node('playButton', { playing, options }, []);
}
/** Bloom `PlaybackProgress` at `value` of `duration`, in seconds. */
export function PlaybackProgress(
  value: number,
  duration: number,
  options: PlaybackProgressOptions = {},
): PlaybackProgressView {
  return new Node('playbackProgress', { value, duration, options }, []);
}

export const MEDIA_CONTROLS: Record<MediaControlKind, ControlRenderer> = {
  playButton: (d) => {
    const { playing, options } = d.node.props as { playing: boolean; options: PlayButtonOptions };
    return d.component(BloomPlayButton, {
      ...d.props(),
      ...options,
      playing,
      size: d.own('size')?.value,
      variant: d.own('style')?.value,
      loading: d.own('loading')?.value,
      disabled: d.own('disabled')?.value,
    });
  },
  playbackProgress: product(BloomPlaybackProgress, {
    own: (d) => ({ timesPosition: d.own('style')?.value, disabled: d.own('disabled')?.value }),
  }),
};
