import type { PropsWithChildren, RefObject } from 'react';
import type { ScrollViewProps } from 'react-native';

/** A mounted native viewport or target supporting window-space measurement. */
export interface VisibilityHandle {
  measureInWindow(callback: (x: number, y: number, width: number, height: number) => void): void;
}
/** ScrollView exposes measurement through its native scroll host. */
export type ViewportHandle = VisibilityHandle | { getNativeScrollRef(): VisibilityHandle | null };
export interface ViewportProviderProps extends PropsWithChildren {
  /** Start a separate clipping chain, e.g. in a portaled dialog. */
  root?: boolean;
}
export interface ViewportBindingOptions extends Pick<ScrollViewProps, 'onScroll' | 'onLayout' | 'onContentSizeChange'> {
  /** The actual scrolling/clipping host. Keep its ref on the ScrollView. */
  viewportRef: RefObject<ViewportHandle | null>;
}
export interface InViewOptions {
  /** Required visible area fraction, from 0 to 1. Defaults to 0. */
  threshold?: number;
  /** Stop observing after the threshold is first reached. Defaults to false. */
  once?: boolean;
}
