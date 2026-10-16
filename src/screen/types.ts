import type { ReactNode } from 'react';
import type { ScrollViewProps, ViewProps } from 'react-native';
import type { ScrollRestorationBinding } from '../scroll/types';
import type { ScrollHandlerProcessed } from 'react-native-reanimated';

export interface ScreenProps extends ViewProps {
  header?: ReactNode;
  /** Disable all descendant scroll writers when a navigator retains this screen. */
  active?: boolean;
  /** inherit shell navigation motion; shared establishes a shell; isolated resets it for a modal. */
  navigationScope?: 'inherit' | 'shared' | 'isolated';
  /** Web document flow: bind window scrolling automatically, reserve chrome clearance, and keep chrome sticky within this column. Explicit list bindings take priority. */
  documentScroll?: boolean;
  bottomBar?: ReactNode;
  /** Standalone action; with navigation use BottomBar.action instead. */
  primaryAction?: ReactNode;
  /** Initial footprint before layout; include any safe area in custom values. */
  headerHeight?: number;
  bottomBarHeight?: number;
  /** Extra visual clearance beyond the measured bottom chrome. */
  contentClearance?: number;
}

export interface ScreenScrollOptions {
  /** Only the focused screen/list may drive chrome. */
  active?: boolean;
  /** Existing restoration binding for this same scroll ref. */
  restoration?: ScrollRestorationBinding;
  handler?: ScrollHandlerProcessed | null;
}

export interface ScreenScrollViewProps
  extends Omit<ScrollViewProps, 'onScroll'>,
    ScreenScrollOptions {
  /** Utilities for the content container, resolved by Bloom's own interop. */
  contentContainerClassName?: string;
  /**
   * Called once each time the end of the content comes within
   * `onEndReachedThreshold` viewports — on native from the scroll view, in a web
   * `Screen documentScroll` from the window. Re-arms when the user scrolls back
   * out of range or the content changes length, so a page that arrives still
   * short of the viewport asks for the next one. Guard on your own in-flight flag.
   */
  onEndReached?: () => void;
  /** Viewport-relative distance from the end that fires `onEndReached`. Default 2, as `FlatList`. */
  onEndReachedThreshold?: number;
}
