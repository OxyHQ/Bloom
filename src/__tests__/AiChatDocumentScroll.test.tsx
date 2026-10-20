/**
 * @jest-environment jsdom
 *
 * `AiChatShell scroll="document"`: the page scrolls the DOCUMENT, on the only
 * platform that has one. Rendered through react-native-web into a real
 * document, because every claim here is about CSS and the window:
 *
 * - **Document flow** uses AppShell tracks and the existing document owner;
 *   no nested overflow viewport may capture the conversation's scroll.
 * - **Shared Screen chrome** stays sticky while turns remain in one stacking
 *   context below it, including descendants carrying their own z-index.
 * - **One imperative owner** answers the thread handle and scroll observer in
 *   the same coordinate space. Bounded mode reuses Screen's local viewport.
 */
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => {
  // Wide enough for the in-flow sidebar and the panel, before `Dimensions`
  // caches its first read.
  Object.defineProperty(document.documentElement, 'clientWidth', {
    value: 1440,
    configurable: true,
  });
  Object.defineProperty(document.documentElement, 'clientHeight', {
    value: 900,
    configurable: true,
  });
  return jest.requireActual('react-native-web');
});

import { NativeScrollEvent, NativeSyntheticEvent, Text, View } from 'react-native';

import {
  AiChatContainer,
  AiChatShell,
  AiChatThread,
  type AiChatThreadHandle,
} from '../ai-chat/index.web';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;
const scrollTo = jest.fn();

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  scrollTo.mockClear();
  window.scrollTo = scrollTo as unknown as typeof window.scrollTo;
  Object.defineProperty(window, 'scrollY', { value: 0, configurable: true, writable: true });
  Object.defineProperty(document, 'scrollingElement', {
    value: document.documentElement,
    configurable: true,
  });
  document.documentElement.scrollTop = 0;
  Object.defineProperty(window, 'innerHeight', { value: 900, configurable: true });
  Object.defineProperty(document.documentElement, 'scrollHeight', {
    value: 2400,
    configurable: true,
  });
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function mount({
  scroll,
  threadRef,
  onScroll,
}: {
  scroll?: 'container' | 'document';
  threadRef?: React.Ref<AiChatThreadHandle>;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
}) {
  act(() => {
    root.render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <AiChatShell
          scroll={scroll}
          sidebar={<Text testID="sidebar">nav</Text>}
          mobileSidebar={<Text>nav</Text>}
          panel={() => <View testID="panel" />}
        >
          <AiChatContainer
            testID="chat"
            title="Chat"
            composer={<Text testID="composer">compose</Text>}
          >
            <AiChatThread ref={threadRef} testID="thread" onScroll={onScroll} autoFollow={false}>
              <Text>turn</Text>
            </AiChatThread>
          </AiChatContainer>
        </AiChatShell>
      </BloomThemeProvider>,
    );
  });
}

const byTestId = (id: string) => {
  const node = container.querySelector(`[data-testid="${id}"]`);
  if (!node) throw new Error(`no ${id}`);
  return node as HTMLElement;
};
const style = (node: Element) => getComputedStyle(node);

describe('AiChatShell scroll="document"', () => {
  it('grows the page instead of scrolling inside it, and pins the sidebar and the panel', () => {
    mount({ scroll: 'document' });
    // AppShell owns the navigation region and context track. Navigation is
    // shared shell chrome; it is not a second workspace panel.
    expect(style(byTestId('ai-chat-shell-navigation')).position).toBe('sticky');
    expect(style(byTestId('ai-chat-shell-panels-context')).position).toBe('sticky');
    expect(byTestId('sidebar').closest('[data-testid="ai-chat-shell-navigation"]')).not.toBeNull();
    // No scroll container between the chat and the document.
    let node: HTMLElement | null = byTestId('thread');
    while (node && node !== container) {
      expect(['auto', 'scroll', 'hidden']).not.toContain(style(node).overflowY);
      node = node.parentElement;
    }
  });

  it('pins the header and the composer to the screen, on a ContentPanel card', () => {
    mount({ scroll: 'document' });
    expect(style(byTestId('chat-header')).position).toBe('sticky');
    expect(style(byTestId('chat-bottom')).position).toBe('sticky');
    const track = byTestId('ai-chat-shell-panels-conversation');
    // The panel provides the only frame; AiChatContainer contributes a Screen.
    expect(track.querySelectorAll('[data-testid="content-panel-surface"]')).toHaveLength(1);
    expect(byTestId('chat').closest('[data-testid="content-panel-content"]')).not.toBeNull();
  });

  it('keeps the whole conversation one layer under the chrome', () => {
    // A turn's own parts may carry a z-index (a search log, a progress card);
    // if the conversation were not its own stacking context, the highest of
    // them would climb over the header and the composer.
    mount({ scroll: 'document' });
    let layer = byTestId('thread').parentElement;
    let isolated = false;
    while (layer && layer !== byTestId('chat')) {
      if (style(layer).zIndex === '0' || style(layer).isolation === 'isolate') isolated = true;
      layer = layer.parentElement;
    }
    expect(isolated).toBe(true);
    expect(Number(style(byTestId('chat-header')).zIndex)).toBeGreaterThan(0);
    expect(Number(style(byTestId('chat-bottom')).zIndex)).toBeGreaterThan(0);
  });

  it('drives the same document owner through the thread handle', () => {
    const ref = React.createRef<AiChatThreadHandle>();
    mount({ scroll: 'document', threadRef: ref });

    act(() => ref.current?.scrollToEnd({ animated: false }));
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 2400, behavior: 'auto' });

    act(() => ref.current?.scrollToOffset({ offset: 120, animated: true }));
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 120, behavior: 'smooth' });
    expect(ref.current?.getScrollView()).toBeTruthy();
    expect(
      (
        ref.current?.getScrollView() as unknown as { getScrollableNode(): Element }
      ).getScrollableNode(),
    ).toBe(document.documentElement);
  });

  it('reports offsets and extent in the document owner’s coordinate space', () => {
    jest.useFakeTimers();
    try {
      const onScroll = jest.fn();
      mount({ scroll: 'document', onScroll });
      // A browser's client rect moves as the page scrolls; jsdom's does not.
      // The thread sits 100px down the page.
      const top = 100;
      byTestId('thread').getBoundingClientRect = () => ({ top: top - window.scrollY }) as DOMRect;
      onScroll.mockClear();

      window.scrollY = 300;
      document.documentElement.scrollTop = 300;
      act(() => {
        window.dispatchEvent(new Event('scroll'));
        jest.advanceTimersByTime(50);
      });
      const { nativeEvent } = onScroll.mock.calls[onScroll.mock.calls.length - 1][0];
      expect(nativeEvent.contentOffset.y).toBe(300);
      expect(nativeEvent.contentSize.height).toBe(2400);
      expect(nativeEvent.layoutMeasurement.height).toBe(window.innerHeight);
    } finally {
      jest.useRealTimers();
    }
  });
});

describe('AiChatShell scroll="container"', () => {
  it('reuses the Screen element viewport without adding a second thread scroller', () => {
    const ref = React.createRef<AiChatThreadHandle>();
    mount({ threadRef: ref });
    const viewport = byTestId('chat-viewport');
    expect(style(viewport).overflowY).toBe('auto');
    expect(style(byTestId('thread')).overflowY).not.toBe('auto');
    expect(
      (
        ref.current?.getScrollView() as unknown as { getScrollableNode(): Element }
      ).getScrollableNode(),
    ).toBe(viewport);
    expect(
      byTestId('ai-chat-shell-panels-conversation').querySelectorAll(
        '[data-testid="content-panel-surface"]',
      ),
    ).toHaveLength(1);
  });
});
