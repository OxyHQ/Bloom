/**
 * @jest-environment jsdom
 *
 * `AiChatShell scroll="document"`: the page scrolls the DOCUMENT, on the only
 * platform that has one. Rendered through react-native-web into a real
 * document, because every claim here is about CSS and the window:
 *
 * - **Nothing in the frame is a scroll container.** The shell grows with the
 *   page and clips with `overflow: clip`; the sidebar and the panel are sticky
 *   rails one screen tall.
 * - **The chat's chrome is pinned in the flow.** The header and the composer
 *   are sticky at the screen's gutter, and the card carries a frame the size of
 *   the screen that masks the gutter around it.
 * - **The thread has no scroller of its own.** It follows through the window,
 *   in its own frame: offset 0 is the thread's top, and the content runs to the
 *   end of the page.
 * - **`container` is untouched.** Without the prop the thread is still a
 *   `ScrollView`.
 */
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => {
  // Wide enough for the in-flow sidebar and the panel, before `Dimensions`
  // caches its first read.
  Object.defineProperty(document.documentElement, 'clientWidth', { value: 1440, configurable: true });
  Object.defineProperty(document.documentElement, 'clientHeight', { value: 900, configurable: true });
  return jest.requireActual('react-native-web');
});

import { NativeScrollEvent, NativeSyntheticEvent, Text, View } from 'react-native';

import { AiChatContainer, AiChatShell, AiChatThread, type AiChatThreadHandle } from '../ai-chat';
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
  Object.defineProperty(document.documentElement, 'scrollHeight', { value: 2400, configurable: true });
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
          panel={() => <View testID="panel" />}>
          <AiChatContainer testID="chat" title="Chat" composer={<Text testID="composer">compose</Text>}>
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
    // The sidebar's column and the panel's rail: sticky, one screen tall.
    for (const id of ['sidebar', 'panel']) {
      const rail = byTestId(id).parentElement as HTMLElement;
      expect(style(rail).position).toBe('sticky');
      expect(rail.style.height || style(rail).height).toContain('100dvh');
    }
    // No scroll container between the chat and the document.
    let node: HTMLElement | null = byTestId('thread');
    while (node && node !== container) {
      expect(['auto', 'scroll', 'hidden']).not.toContain(style(node).overflowY);
      node = node.parentElement;
    }
  });

  it('pins the header and the composer to the screen, and frames the card', () => {
    mount({ scroll: 'document' });
    expect(style(byTestId('chat-chrome-top')).position).toBe('sticky');
    expect(style(byTestId('chat-chrome-bottom')).position).toBe('sticky');
    const frame = byTestId('chat-frame');
    expect(style(frame).position).toBe('sticky');
    expect(frame.getAttribute('data-bloom-ai-chat-frame')).not.toBeNull();
  });

  it('keeps the whole conversation one layer under the frame and the chrome', () => {
    // A turn's own parts may carry a z-index (a search log, a progress card);
    // if the conversation were not its own stacking context, the highest of
    // them would climb over the frame and show in the gutter.
    mount({ scroll: 'document' });
    const layer = byTestId('thread').parentElement as HTMLElement;
    expect(style(layer).zIndex).toBe('0');
    expect(Number(style(byTestId('chat-frame')).zIndex)).toBeGreaterThan(0);
    expect(Number(style(byTestId('chat-chrome-top')).zIndex)).toBeGreaterThan(Number(style(byTestId('chat-frame')).zIndex));
    expect(Number(style(byTestId('chat-chrome-bottom')).zIndex)).toBeGreaterThan(Number(style(byTestId('chat-frame')).zIndex));
  });

  it('drives the window from the thread handle, in the thread’s own frame', () => {
    const ref = React.createRef<AiChatThreadHandle>();
    mount({ scroll: 'document', threadRef: ref });
    const top = byTestId('thread').getBoundingClientRect().top;

    act(() => ref.current?.scrollToEnd({ animated: false }));
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 2400, behavior: 'auto' });

    act(() => ref.current?.scrollToOffset({ offset: 120, animated: true }));
    expect(scrollTo).toHaveBeenLastCalledWith({ top: top + 120, behavior: 'smooth' });
    expect(ref.current?.getScrollView()).toBeNull();
  });

  it('reports the window to onScroll, measured from the thread’s top to the end of the page', () => {
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
      act(() => {
        window.dispatchEvent(new Event('scroll'));
        jest.advanceTimersByTime(50);
      });
      const { nativeEvent } = onScroll.mock.calls[onScroll.mock.calls.length - 1][0];
      expect(nativeEvent.contentOffset.y).toBe(300 - top);
      expect(nativeEvent.contentSize.height).toBe(2400 - top);
      expect(nativeEvent.layoutMeasurement.height).toBe(window.innerHeight);
    } finally {
      jest.useRealTimers();
    }
  });
});

describe('AiChatShell scroll="container"', () => {
  it('keeps the thread a scroller of its own', () => {
    mount({});
    expect(byTestId('thread').getAttribute('data-bloom-ai-chat-scroll')).toBe('thin');
    expect(container.querySelector('[data-testid="chat-frame"]')).toBeNull();
  });
});
