import type { StyleProp, ViewStyle } from 'react-native';

import type { MessageMediaSource } from '../message-media/types';

export interface StickerProps {
  /**
   * URL of the Lottie animation (JSON or `.lottie`). Omit it for a still
   * sticker; the `fallback` is then the sticker.
   */
  animation?: string;
  /**
   * The still image of the same sticker. Shown while the animation loads, when
   * it cannot play (no Lottie player installed, the file failed), and always
   * when the person asked for reduced motion.
   */
  fallback: MessageMediaSource;
  /** Square edge. Default 128. */
  size?: number;
  /** Default true. */
  loop?: boolean;
  /** Hold the current frame — e.g. while the sticker is scrolled out of view. */
  paused?: boolean;
  /**
   * A sticker IS its meaning; with no name it announces "Sticker" and conveys
   * nothing. Pass what the pack author gave it — its emoji or its word.
   */
  accessibilityLabel?: string;
  /**
   * Hide it from assistive technology because its container already names it —
   * `StickerMessage` does, on its pressable. Default false.
   */
  decorative?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** What `Sticker` needs from a Lottie player, whichever platform supplies it. */
export interface LottiePlayerProps {
  uri: string;
  loop: boolean;
  paused: boolean;
  onLoad?: () => void;
  onError?: (error: string) => void;
  style?: StyleProp<ViewStyle>;
}
