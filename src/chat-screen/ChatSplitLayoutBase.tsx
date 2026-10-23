import { memo, useMemo } from 'react';
import { View } from 'react-native';

import { useControllableState } from '../hooks/use-controllable-state';
import { AppShellRegionContext, type AppShellRegionValue } from '../layout/app-shell-region';
import { useMessages } from '../locale/messages';
import { CHAT_SCREEN_MESSAGES } from './messages';
import {
  CHAT_LIST_PANE_WIDTH,
  CHAT_INFO_PANE_WIDTH,
  CHAT_SPLIT_BREAKPOINT,
  useChatScreenPaint,
} from './shared';
import type { ChatSplitLayoutProps } from './types';

/** Chat-domain slots delegate geometry, retention and resizing to the shared panel compositor. */
export function createChatSplitLayout({
  AppShellPanels,
  AppShellPanel,
}: {
  AppShellPanels: typeof import('../app-shell')['AppShellPanels'];
  AppShellPanel: typeof import('../app-shell')['AppShellPanel'];
}) {
  function ChatSplitLayoutComponent({
    list,
    children,
    info,
    pane = 'conversation',
    listWidth,
    onListWidthChange,
    defaultListWidth = CHAT_LIST_PANE_WIDTH,
    minWidth = 280,
    maxWidth = 480,
    infoWidth = CHAT_INFO_PANE_WIDTH,
    resizable = true,
    resizeLabel: resizeLabelProp,
    breakpoint = CHAT_SPLIT_BREAKPOINT,
    compact,
    style,
    testID,
  }: ChatSplitLayoutProps) {
    const paint = useChatScreenPaint();
    const { messages } = useMessages(CHAT_SCREEN_MESSAGES);
    const [width, setWidth] = useControllableState({
      value: listWidth,
      defaultValue: defaultListWidth,
      onChange: onListWidthChange,
    });
    const widths = useMemo(() => ({ list: width }), [width]);
    const region = useMemo<AppShellRegionValue>(
      () => ({
        flow: 'bounded',
        framed: false,
        gutter: 0,
        viewportInset: { top: 0, bottom: 0 },
        bottomReserve: 0,
        underBottomBar: false,
        revealed: false,
        maskColor: paint.page,
      }),
      [paint.page],
    );
    const selected = pane === 'info' && !info ? 'conversation' : pane;
    const collapseBelow =
      compact === true ? Number.MAX_SAFE_INTEGER : compact === false ? 0 : breakpoint;

    return (
      <View
        testID={testID}
        style={[
          { flexGrow: 1, flexShrink: 1, minWidth: 0, minHeight: 0, backgroundColor: paint.page },
          style,
        ]}
      >
        <AppShellRegionContext.Provider value={region}>
          <AppShellPanels
            appearance="separated"
            collapseBelow={collapseBelow}
            show={selected}
            widths={widths}
            testID={testID ? `${testID}-panels` : undefined}
          >
            <AppShellPanel
              id="list"
              appearance="plain"
              scroll="content"
              keepMounted
              width={width}
              minWidth={minWidth}
              maxWidth={maxWidth}
              resizable={resizable}
              resizeLabel={resizeLabelProp ?? messages.resizeList}
              onWidthChange={setWidth}
              testID={testID ? `${testID}-list` : undefined}
            >
              {list}
            </AppShellPanel>
            <AppShellPanel
              id="conversation"
              appearance="plain"
              scroll="content"
              keepMounted
              testID={testID ? `${testID}-conversation` : undefined}
            >
              {children}
            </AppShellPanel>
            {info ? (
              <AppShellPanel
                id="info"
                appearance="plain"
                scroll="content"
                keepMounted
                width={infoWidth}
                minWidth={infoWidth}
                maxWidth={infoWidth}
                testID={testID ? `${testID}-info` : undefined}
              >
                {info}
              </AppShellPanel>
            ) : null}
          </AppShellPanels>
        </AppShellRegionContext.Provider>
      </View>
    );
  }
  const ChatSplitLayout = memo(ChatSplitLayoutComponent);
  ChatSplitLayout.displayName = 'ChatSplitLayout';
  return ChatSplitLayout;
}
