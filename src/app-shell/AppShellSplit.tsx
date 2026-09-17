/**
 * The `split` variant's panes: a list, a detail and an optional info pane, each
 * scrolling on its own, with a draggable divider between the first two.
 *
 * Why the panes scroll and the page does not: three columns that each keep
 * their own position is a bounded-box layout by definition. There is one
 * document, so at most one region can scroll it — a "split" that scrolled the
 * document would move all three columns together, which is the layout it exists
 * to avoid. `resolveScrollMode` therefore gives `split` a one-screen frame.
 *
 * The divider is `AiChatResizeHandle`, the grip `ai-chat` already ships: a 20px
 * strip straddling the pane's edge with a grip that follows the pointer,
 * pointer-capture dragging on web, a `PanResponder` on native, and arrow-key
 * nudges when `onNudge` is given. Writing a second one would have meant a second
 * set of the same three bugs.
 */
import React, { memo, useCallback, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { AiChatResizeHandle } from '../ai-chat/AiChatShell';
import { Z_INDEX } from '../styles/z-index';
import { useTheme } from '../theme/use-theme';

export interface AppShellSplitPanesProps {
  list?: React.ReactNode;
  detail?: React.ReactNode;
  info?: React.ReactNode;
  /** Which panes have room right now. */
  showList: boolean;
  showDetail: boolean;
  showInfo: boolean;
  /** The list pane's resting width; a drag moves it within min/max. */
  listWidth: number;
  listMinWidth: number;
  listMaxWidth: number;
  onListWidthChange?: (width: number) => void;
  infoWidth: number;
  resizable: boolean;
  /** The shell wraps each pane in its own `ScrollView` unless the page owns one. */
  paneScroll: boolean;
  resizeLabel: string;
  testID?: string;
}

/** One pane: a bounded column that scrolls its own overflow. */
function Pane({
  children,
  scroll,
  style,
  testID,
}: {
  children: React.ReactNode;
  scroll: boolean;
  style: React.ComponentProps<typeof View>['style'];
  testID?: string;
}) {
  return (
    <View testID={testID} style={[{ minWidth: 0, alignSelf: 'stretch' }, style]}>
      {scroll ? (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
          {children}
        </ScrollView>
      ) : (
        <View style={{ flex: 1, minHeight: 0 }}>{children}</View>
      )}
    </View>
  );
}

const AppShellSplitPanesComponent: React.FC<AppShellSplitPanesProps> = ({
  list,
  detail,
  info,
  showList,
  showDetail,
  showInfo,
  listWidth,
  listMinWidth,
  listMaxWidth,
  onListWidthChange,
  infoWidth,
  resizable,
  paneScroll,
  resizeLabel,
  testID,
}) => {
  const theme = useTheme();
  const [width, setWidth] = useState(listWidth);
  const widthAtDragStart = useRef(listWidth);

  const clamp = useCallback(
    (next: number) => Math.min(listMaxWidth, Math.max(listMinWidth, next)),
    [listMaxWidth, listMinWidth],
  );
  const commit = useCallback(
    (next: number) => {
      const clamped = clamp(next);
      setWidth(clamped);
      onListWidthChange?.(clamped);
    },
    [clamp, onListWidthChange],
  );
  const onResizeStart = useCallback(() => {
    widthAtDragStart.current = width;
  }, [width]);
  const onResize = useCallback((dx: number) => commit(widthAtDragStart.current + dx), [commit]);
  const onNudge = useCallback((dx: number) => commit(width + dx), [commit, width]);

  /**
   * The divider carries the z-index, NOT the grip inside it.
   *
   * react-native-web gives every `View` `position: relative; z-index: 0`, which
   * makes each one a stacking context — so the grip's own `z-index: 10` only
   * ranks it inside the divider, and the detail pane (a later sibling at the
   * same level) painted over the 10px of grip that straddles it. Measured: a
   * hit test at the divider's centre returned the pane, and the drag never
   * started. Raising the DIVIDER lifts the whole context over both panes.
   */
  const divider = {
    width: 1,
    alignSelf: 'stretch' as const,
    zIndex: Z_INDEX.floating,
    backgroundColor: theme.colors.border,
  };
  // Only the panes that are actually drawn count: alone, a pane fills the row.
  const solo = [showList, showDetail, showInfo].filter(Boolean).length === 1;

  return (
    <View style={{ flexGrow: 1, flexShrink: 1, minWidth: 0, flexDirection: 'row' }}>
      {showList ? (
        <Pane
          testID={testID ? `${testID}-pane-list` : undefined}
          scroll={paneScroll}
          style={solo ? { flexGrow: 1, flexShrink: 1, flexBasis: 0 } : { width, flexShrink: 0 }}
        >
          {list}
        </Pane>
      ) : null}
      {showList && !solo ? (
        <View style={divider}>
          {resizable ? (
            <AiChatResizeHandle
              label={resizeLabel}
              onResizeStart={onResizeStart}
              onResize={onResize}
              onNudge={onNudge}
              testID={testID ? `${testID}-divider` : undefined}
            />
          ) : null}
        </View>
      ) : null}
      {showDetail ? (
        <Pane
          testID={testID ? `${testID}-pane-detail` : undefined}
          scroll={paneScroll}
          style={{ flexGrow: 1, flexShrink: 1, flexBasis: 0 }}
        >
          {detail}
        </Pane>
      ) : null}
      {showInfo && !solo ? <View style={divider} /> : null}
      {showInfo ? (
        <Pane
          testID={testID ? `${testID}-pane-info` : undefined}
          scroll={paneScroll}
          style={solo ? { flexGrow: 1, flexShrink: 1, flexBasis: 0 } : { width: infoWidth, flexShrink: 0 }}
        >
          {info}
        </Pane>
      ) : null}
    </View>
  );
};

export const AppShellSplitPanes = memo(AppShellSplitPanesComponent);
AppShellSplitPanes.displayName = 'AppShellSplitPanes';
