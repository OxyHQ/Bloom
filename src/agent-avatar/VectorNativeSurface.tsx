import * as ReactNative from 'react-native';
import {
  Platform,
  processColor,
  UIManager,
  type HostComponent,
  type NativeSyntheticEvent,
  type ViewProps,
} from 'react-native';
import type { VectorLoopTracks } from './vector-loop';

/** One frame as the native surface draws it: colours as native colour numbers, the viewBox as four numbers. */
export type NativeVectorFrame = {
  /** Changes with every frame JS draws, so a frame equal to an older one still replaces the loop's. */
  revision: number;
  viewBox: number[];
  /** The whole drawing's opacity (the entrance), as one layer. */
  opacity: number;
  paths: {
    d: string;
    clip?: string;
    fill: number;
    opacity: number;
    fillOpacity: number;
    stroke?: number;
    strokeWidth?: number;
  }[];
};
/** A complete rest loop (`VectorLoopTracks`) in the same native form. */
export type NativeVectorLoop = {
  duration: number;
  length: number;
  viewBox: number[];
  paths: {
    fill: number;
    fillOpacity: number;
    stroke?: number;
    strokeWidth?: number;
    d: string[];
    opacity: number[];
    clip?: string[];
  }[];
};
/** Plays the loop: at `epoch` (a `performance.now()` reading) the loop is `time` seconds in. */
export type NativeVectorClock = { epoch: number; time: number };

export type NativeVectorSurfaceProps = ViewProps & {
  frame?: NativeVectorFrame;
  /** The rest loop this surface is about: it answers `onLoop` with whether it has it. */
  loopKey?: string;
  /** The loop `loopKey` names, handed over once when the surface does not have it. */
  loopTracks?: NativeVectorLoop;
  /** Set while the surface plays the loop by itself; the JS thread draws nothing meanwhile. */
  loopClock?: NativeVectorClock;
  /** A non-zero id asks for a PNG of what is on screen, answered by `onCapture`. */
  capture?: number;
  onLoop?: (event: NativeSyntheticEvent<{ key: string; ready: boolean }>) => void;
  onCapture?: (event: NativeSyntheticEvent<{ id: number; data: string | null }>) => void;
};

const NAME = 'BloomAvatarSurfaceV1';

/**
 * The native avatar surface (`android/.../AvatarSurface.kt`), when the app's binary has it. It
 * draws a frame with its paths parsed once, and plays a rest loop on its own frame clock, kept
 * across starts: no shadow-tree commits, no bitmaps and no layout events per frame. A JS-only
 * update keeps the SVG drawing until the binary is rebuilt; the web always draws SVG.
 */
function resolveSurface(): HostComponent<NativeVectorSurfaceProps> | null {
  if (Platform.OS === 'web') return null;
  try {
    if (!UIManager?.getViewManagerConfig?.(NAME)) return null;
    // Through the namespace: react-native-web has no `requireNativeComponent` export.
    return ReactNative.requireNativeComponent<NativeVectorSurfaceProps>(NAME);
  } catch {
    return null;
  }
}
export const VectorNativeSurface = resolveSurface();

const color = (value: string): number => {
  const processed = processColor(value);
  return typeof processed === 'number' ? processed : 0xff000000;
};
/** A viewBox string as four numbers. */
export const viewBoxNumbers = (viewBox: string): number[] =>
  viewBox
    .trim()
    .split(/[\s,]+/)
    .map(Number);

/** The native form of one drawn path's paint. */
export function nativePaint(path: { fill: string; stroke?: string; strokeWidth?: number }): {
  fill: number;
  stroke?: number;
  strokeWidth?: number;
} {
  return path.stroke === undefined
    ? { fill: color(path.fill) }
    : { fill: color(path.fill), stroke: color(path.stroke), strokeWidth: path.strokeWidth ?? 1.5 };
}

/** A complete loop in the surface's form. */
export function nativeVectorLoop(tracks: VectorLoopTracks, viewBox: string): NativeVectorLoop {
  return {
    duration: tracks.duration,
    length: tracks.length,
    viewBox: viewBoxNumbers(viewBox),
    paths: tracks.paths.map((track) => ({
      ...nativePaint(track),
      fillOpacity: track.fillOpacity,
      d: track.d,
      opacity: track.opacity,
      ...(track.clip ? { clip: track.clip } : {}),
    })),
  };
}
