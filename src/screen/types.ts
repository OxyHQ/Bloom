import type { AppColorName } from '../theme/color-presets';
import type { ReactNode, Ref } from 'react';
import type { ScrollViewProps, ViewProps, StyleProp, ViewStyle } from 'react-native';
import type { ScrollRestorationBinding } from '../scroll/types';
import type { ScrollHandlerProcessed } from 'react-native-reanimated';

export interface ScreenProps extends ViewProps {
  /** Local screen recipe, including its enclosing panel surface. Restored on departure. */
  colorPreset?: AppColorName;
  header?: ReactNode;
  /**
   * auto uses the host's document/column viewport. content lets an explicit list
   * bind the scroll/inset contract. none reserves chrome around a bounded canvas
   * (board, map or editor) without adding a scrolling viewport.
   */
  scroll?: 'auto' | 'content' | 'none';
  /** Overlay chrome paints above content without reserving its height. */
  headerPlacement?: 'inset' | 'overlay';
  /**
   * `overlay` floats `bottomBar` over the content, whose scroller pads its end
   * clear of it (a reply prompt under a thread). `inset` (default) keeps the
   * content above it (a chat composer the thread is anchored to).
   */
  bottomBarPlacement?: 'inset' | 'overlay';
  /** Disable all descendant scroll writers when a navigator retains this screen. */
  active?: boolean;
  /** inherit shell navigation motion; shared establishes a shell; isolated resets it for a modal. */
  navigationScope?: 'inherit' | 'shared' | 'isolated';
  /** Web document flow: bind window scrolling automatically, reserve chrome clearance, and keep chrome sticky within this column. Explicit list bindings take priority. */
  documentScroll?: boolean;
  bottomBar?: ReactNode;
  /**
   * Navigation hides by default; `visible` keeps its position while typing.
   * Native `follow` moves bottom chrome with the keyboard and makes ScreenScrollView
   * keep the focused input above it. Requires react-native-keyboard-controller and
   * its root KeyboardProvider. Web retains the ordinary Screen viewport.
   */
  bottomBarKeyboardBehavior?: 'hide' | 'visible' | 'follow';
  /** Standalone action; with navigation use BottomBar.action instead. */
  primaryAction?: ReactNode;
  /**
   * What reselecting this screen means — pressing the place the reader is
   * already on: usually `{ refresh }`. Answered only while the screen is active.
   * Content inside the screen can declare it with `useScreenReselectHandler`.
   */
  reselect?: import('./reselect').ScreenReselectHandler;
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
  /**
   * How to move this scroller. With it, the scroller answers its screen's
   * reselect (back to the top) and `useFrontScroller()` while it is active.
   * Bloom's own scrollers pass it; a list bound by hand should too.
   */
  scrollToOffset?: (offset: number) => void;
}

export interface ScreenScrollViewProps
  extends Omit<ScrollViewProps, 'onScroll'>,
    Omit<ScreenScrollOptions, 'scrollToOffset'> {
  /** Observes the existing screen viewport on both platforms; creates no scroll owner. */
  onScroll?: ScrollViewProps['onScroll'];
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

export interface ScreenPagerHandle {
  scrollToIndex(index: number, options?: { animated?: boolean }): void;
}
export interface ScreenPagerProps<Item> {
  data: readonly Item[];
  keyExtractor(item: Item, index: number): string;
  renderItem(info: { item: Item; index: number; viewportHeight: number }): ReactNode;
  onIndexChange?(index: number): void;
  onEndReached?(): void;
  /** Number of useful viewports before the end. */
  onEndReachedThreshold?: number;
  /** Keep distant items as correctly sized placeholders on web. */
  renderRadius?: number;
  ref?: Ref<ScreenPagerHandle>;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** Platform bindings used by shared implementations that render screen chrome. */
export interface ScreenComponents {
  Screen: typeof import('./Screen').Screen;
  ScreenScrollView: typeof import('./ScreenScrollView').ScreenScrollView;
}
