/**
 * The three pinned slots — `topBar`, `bottomBar` and `floatingAction` — and the
 * one rule they exist to enforce: NOTHING a consumer writes should have to
 * position itself.
 *
 * Every app that has drawn a phone tab bar or a compose button over a page has
 * written the same four lines: `position: fixed`, a hardcoded `bottom`, a
 * safe-area inset copied from somewhere, and a negative margin to escape
 * whatever padding the page had. All four are wrong in at least one place — a
 * fixed bar is wrong inside an embedded shell, a hardcoded bottom is wrong on a
 * notched phone, and a negative margin is wrong the moment the page's padding
 * changes. The shell knows all four answers, so it answers them here and the
 * consumer passes plain content.
 *
 * The anchoring itself forks, and has to:
 *
 * - WEB + document scroll — `position: fixed`. The document is what scrolls, so
 *   the only box that stays put is the viewport.
 * - everything else (web `container`/`fixed`, and all of native) — absolute
 *   inside the shell's own frame, which IS the bounded box. Native has no
 *   `fixed`; Yoga ignores it silently, which would leave a native bar scrolling
 *   away with no error to explain it.
 *
 * Each wrapper is `pointerEvents="box-none"` as a PROP (a style entry is
 * dropped): the bar's own content takes presses, the empty space around it does
 * not, so a full-width FAB wrapper never swallows a tap on the content behind
 * it.
 */
import React, { memo, useCallback, useContext, useRef, useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

import { WEB_POSITION_FIXED, WEB_POSITION_STICKY, type WebCssStyle } from '../styles/web-view-style';
import { BottomBarSlotContext } from '../layout/bottom-bar-slot';
import { useClaimBottomEdge } from '../layout/bottom-edge';
import { Z_INDEX } from '../styles/z-index';

/** The safe-area insets, or zeros outside a `SafeAreaProvider`. */
export function useShellInsets(): { top: number; bottom: number } {
  // `useContext(SafeAreaInsetsContext)` rather than `useSafeAreaInsets()`: the
  // hook THROWS outside a provider, and `AppShell` is mounted at an app's root,
  // where making a previously-optional provider mandatory would be a breaking
  // change for every consumer that never had a bar to inset.
  const insets = useContext(SafeAreaInsetsContext);
  return { top: insets?.top ?? 0, bottom: insets?.bottom ?? 0 };
}

/** Pinned to the bottom of the viewport (document scroll) or of the frame. */
function anchorBottom(doc: boolean): WebCssStyle {
  return {
    position: doc ? WEB_POSITION_FIXED : 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: Z_INDEX.floating,
  };
}

export interface AppShellBottomBarProps {
  children: React.ReactNode;
  /** Document scroll: pin to the viewport rather than to the frame. */
  doc: boolean;
  /** Reports the bar's measured height so the page can reserve it. */
  onHeightChange: (height: number) => void;
  testID?: string;
}

/**
 * The bottom bar: edge to edge, with the bottom safe-area inset applied as
 * PADDING so the bar's own background still paints under the home indicator
 * instead of leaving a stripe of page showing through.
 */
const AppShellBottomBarComponent: React.FC<AppShellBottomBarProps> = ({
  children,
  doc,
  onHeightChange,
  testID,
}) => {
  const insets = useShellInsets();
  const [height, setHeight] = useState(0);
  const measuredHeight = useRef(0);
  // Layout already includes the safe-area padding. Publish, but never read,
  // the registry here: using its result in this wrapper would feed back into
  // the next measurement. Other edge claims combine with this one by max.
  useClaimBottomEdge(height);
  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const rawHeight = event.nativeEvent.layout.height;
    if (!Number.isFinite(rawHeight)) return;
    const next = Math.max(0, Math.round(rawHeight));
    if (measuredHeight.current === next) return;
    measuredHeight.current = next;
    setHeight(next);
    onHeightChange(next);
  }, [onHeightChange]);
  return (
    <View
      testID={testID}
      pointerEvents="box-none"
      onLayout={onLayout}
      style={[anchorBottom(doc), { paddingBottom: insets.bottom }]}
    >
      <BottomBarSlotContext.Provider value={insets.bottom}>{children}</BottomBarSlotContext.Provider>
    </View>
  );
};
export const AppShellBottomBar = memo(AppShellBottomBarComponent);
AppShellBottomBar.displayName = 'AppShellBottomBar';

export interface AppShellFloatingActionProps {
  children: React.ReactNode;
  doc: boolean;
  /** Distance from the bottom of the viewport/frame: the bar's height plus the gutter. */
  offset: number;
  gutter: number;
  placement: 'start' | 'end';
  onHeightChange: (height: number) => void;
  testID?: string;
}

/**
 * The compose/FAB corner. The wrapper spans the full width and ALIGNS its child
 * rather than being positioned by one side, so `placement` is a one-word change
 * and the button never needs to know its own width.
 */
const AppShellFloatingActionComponent: React.FC<AppShellFloatingActionProps> = ({
  children,
  doc,
  offset,
  gutter,
  placement,
  onHeightChange,
  testID,
}) => (
  <View
    testID={testID}
    pointerEvents="box-none"
    onLayout={(event: LayoutChangeEvent) => onHeightChange(Math.round(event.nativeEvent.layout.height))}
    style={[
      anchorBottom(doc),
      {
        bottom: offset,
        paddingLeft: gutter,
        paddingRight: gutter,
        alignItems: placement === 'end' ? 'flex-end' : 'flex-start',
      },
    ]}
  >
    {children}
  </View>
);
export const AppShellFloatingAction = memo(AppShellFloatingActionComponent);
AppShellFloatingAction.displayName = 'AppShellFloatingAction';

export interface AppShellTopBarProps {
  children: React.ReactNode;
  doc: boolean;
  testID?: string;
}

/**
 * The phone header. It is a sibling ABOVE the shell's columns, not a child of
 * the content, so it spans the shell edge to edge without a negative margin —
 * which is the whole reason it is a slot instead of something the page draws.
 *
 * `sticky` in document mode (it belongs to the page, so it may be scrolled past
 * only as far as `top: 0`); in `container`/`fixed` and on native it is simply
 * outside the scroller, which pins it by construction.
 */
const AppShellTopBarComponent: React.FC<AppShellTopBarProps> = ({ children, doc, testID }) => {
  const insets = useShellInsets();
  const pinned: WebCssStyle = doc ? { position: WEB_POSITION_STICKY, top: 0 } : {};
  return (
    <View testID={testID} style={[{ zIndex: Z_INDEX.floating, paddingTop: insets.top }, pinned]}>
      {children}
    </View>
  );
};
export const AppShellTopBar = memo(AppShellTopBarComponent);
AppShellTopBar.displayName = 'AppShellTopBar';
