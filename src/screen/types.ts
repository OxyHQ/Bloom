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
  /** Web document scroller: keep chrome sticky inside this column. */
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

export interface ScreenScrollViewProps extends Omit<ScrollViewProps, 'onScroll'>, ScreenScrollOptions {}
