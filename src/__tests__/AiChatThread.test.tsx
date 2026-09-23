import React, { createRef } from 'react';
import { act, render } from '@testing-library/react-native';

const scrollTo = jest.fn();
const scrollToEnd = jest.fn();

// The shared mock's ScrollView is a bare host element with no imperative
// handle; every scroll the thread makes goes through `ref.scrollTo` /
// `ref.scrollToEnd`, so the mock has to hand one over.
jest.mock('react-native', () => {
  const actual = jest.requireActual('react-native');
  const ReactActual = jest.requireActual('react');
  const ScrollView = ReactActual.forwardRef((props: Record<string, unknown>, ref: unknown) => {
    ReactActual.useImperativeHandle(ref, () => ({
      scrollTo: (...args: unknown[]) => scrollTo(...args),
      scrollToEnd: (...args: unknown[]) => scrollToEnd(...args),
    }));
    return ReactActual.createElement('ScrollView', props, props.children);
  });
  return { ...actual, ScrollView };
});

import { Text } from 'react-native';
import { AiChatContainer, AiChatThread, AiChatUserMessage, useAiChatChromeInsets } from '../ai-chat';
import type { AiChatChromeInsets, AiChatThreadHandle } from '../ai-chat';
import { resolvedStyle } from './support/rendered-style';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

type ScrollProps = {
  contentContainerStyle: Record<string, unknown>;
  scrollIndicatorInsets?: { top: number; bottom: number };
  onContentSizeChange: (width: number, height: number) => void;
  onLayout: (event: { nativeEvent: { layout: { height: number } } }) => void;
  onScroll?: (event: {
    nativeEvent: { contentOffset: { y: number }; layoutMeasurement: { height: number } };
  }) => void;
  scrollEventThrottle?: number;
};

function renderIn(ui: React.ReactElement) {
  return render(<BloomThemeProvider mode="light">{ui}</BloomThemeProvider>);
}

/** The thread's own `ScrollView` props, which is where every signal arrives. */
function scroller(api: ReturnType<typeof renderIn>): ScrollProps {
  return api.getByTestId('thread').props as unknown as ScrollProps;
}

/** A viewport 400 tall holding 1000 of content, with the reader at `offset`. */
function settle(api: ReturnType<typeof renderIn>, height: number, offset = 0) {
  act(() => {
    scroller(api).onLayout({ nativeEvent: { layout: { height: 400 } } });
    // The first content size is the mount, never a growth.
    scroller(api).onContentSizeChange(0, height);
    scroller(api).onScroll?.({
      nativeEvent: { contentOffset: { y: offset }, layoutMeasurement: { height: 400 } },
    });
  });
}

beforeEach(() => {
  scrollTo.mockClear();
  scrollToEnd.mockClear();
});

describe('AiChatThread follow', () => {
  it('follows the newest turn as the content grows, and not on the first measure', () => {
    const api = renderIn(
      <AiChatThread testID="thread">
        <AiChatUserMessage>hello</AiChatUserMessage>
      </AiChatThread>,
    );
    act(() => scroller(api).onContentSizeChange(0, 500));
    expect(scrollToEnd).not.toHaveBeenCalled();
    act(() => scroller(api).onContentSizeChange(0, 700));
    expect(scrollToEnd).toHaveBeenCalledWith({ animated: true });
  });

  it('leaves the scroll alone with `autoFollow={false}`', () => {
    const api = renderIn(
      <AiChatThread testID="thread" autoFollow={false}>
        <AiChatUserMessage>hello</AiChatUserMessage>
      </AiChatThread>,
    );
    settle(api, 500);
    act(() => scroller(api).onContentSizeChange(0, 900));
    expect(scrollToEnd).not.toHaveBeenCalled();
  });

  it('honours `followAnimated={false}`', () => {
    const api = renderIn(
      <AiChatThread testID="thread" followAnimated={false}>
        <AiChatUserMessage>hello</AiChatUserMessage>
      </AiChatThread>,
    );
    settle(api, 500);
    act(() => scroller(api).onContentSizeChange(0, 900));
    expect(scrollToEnd).toHaveBeenCalledWith({ animated: false });
  });

  it('follows only from inside `followThreshold`, measured before the growth', () => {
    const api = renderIn(
      <AiChatThread testID="thread" followThreshold={50}>
        <AiChatUserMessage>hello</AiChatUserMessage>
      </AiChatThread>,
    );
    // 1000 of content, 400 viewport, reader at 300: 300px from the bottom.
    settle(api, 1000, 300);
    act(() => scroller(api).onContentSizeChange(0, 1200));
    expect(scrollToEnd).not.toHaveBeenCalled();

    // Back within 50 of the bottom of the 1200 now standing: 1200 − 780 − 400 = 20.
    act(() =>
      scroller(api).onScroll?.({
        nativeEvent: { contentOffset: { y: 780 }, layoutMeasurement: { height: 400 } },
      }),
    );
    act(() => scroller(api).onContentSizeChange(0, 1400));
    expect(scrollToEnd).toHaveBeenCalledTimes(1);
  });

  it('attaches no scroll listener when nothing is listening', () => {
    const api = renderIn(<AiChatThread testID="thread">turns</AiChatThread>);
    expect(scroller(api).onScroll).toBeUndefined();
    expect(scroller(api).scrollEventThrottle).toBeUndefined();
  });
});

describe('AiChatThread upward pagination', () => {
  it('fires `onStartReached` near the TOP, once per approach, re-arming below the threshold', () => {
    const onStartReached = jest.fn();
    const api = renderIn(
      <AiChatThread testID="thread" onStartReached={onStartReached} onStartReachedThreshold={300}>
        turns
      </AiChatThread>,
    );
    const scroll = (y: number) =>
      act(() =>
        scroller(api).onScroll?.({
          nativeEvent: { contentOffset: { y }, layoutMeasurement: { height: 400 } },
        }),
      );

    scroll(1200);
    expect(onStartReached).not.toHaveBeenCalled();
    scroll(280);
    expect(onStartReached).toHaveBeenCalledTimes(1);
    // Still in the zone: one approach, one call.
    scroll(120);
    expect(onStartReached).toHaveBeenCalledTimes(1);
    // Away and back again is a second approach.
    scroll(900);
    scroll(100);
    expect(onStartReached).toHaveBeenCalledTimes(2);
  });

  it('anchors the page that answers `onStartReached` instead of moving the reader', () => {
    const onStartReached = jest.fn();
    const api = renderIn(
      <AiChatThread testID="thread" maintainStartPosition onStartReached={onStartReached}>
        turns
      </AiChatThread>,
    );
    settle(api, 1000, 900);
    act(() =>
      scroller(api).onScroll?.({
        nativeEvent: { contentOffset: { y: 100 }, layoutMeasurement: { height: 400 } },
      }),
    );
    expect(onStartReached).toHaveBeenCalledTimes(1);

    // 600px of history lands above the reader.
    act(() => scroller(api).onContentSizeChange(0, 1600));
    expect(scrollTo).toHaveBeenCalledWith({ y: 700, animated: false });
    expect(scrollToEnd).not.toHaveBeenCalled();

    // The next growth is an ordinary one: the thread follows it again.
    act(() => scroller(api).onContentSizeChange(0, 1800));
    expect(scrollToEnd).toHaveBeenCalledTimes(1);
  });

  it('anchors nothing without a page it asked for', () => {
    const api = renderIn(
      <AiChatThread testID="thread" maintainStartPosition>
        turns
      </AiChatThread>,
    );
    settle(api, 1000, 100);
    act(() => scroller(api).onContentSizeChange(0, 1600));
    expect(scrollTo).not.toHaveBeenCalled();
    expect(scrollToEnd).toHaveBeenCalledTimes(1);
  });
});

describe('AiChatThreadHandle', () => {
  it('drives the scroll from a ref — the cursor jump a host cannot do from props', () => {
    const ref = createRef<AiChatThreadHandle>();
    renderIn(
      <AiChatThread ref={ref} testID="thread">
        turns
      </AiChatThread>,
    );
    act(() => ref.current?.scrollToOffset({ offset: 420 }));
    expect(scrollTo).toHaveBeenCalledWith({ y: 420, animated: false });
    act(() => ref.current?.scrollToOffset({ offset: 0, animated: true }));
    expect(scrollTo).toHaveBeenLastCalledWith({ y: 0, animated: true });
    act(() => ref.current?.scrollToEnd());
    expect(scrollToEnd).toHaveBeenCalledWith({ animated: true });
    expect(ref.current?.getScrollView()).toBeTruthy();
  });
});

describe('AiChatContainer floatingChrome', () => {
  // The fades are decorative and hidden from assistive tech, which the default
  // queries honour.
  const HIDDEN = { includeHiddenElements: true };

  function floating(extra: Partial<React.ComponentProps<typeof AiChatContainer>> = {}) {
    return renderIn(
      <AiChatContainer testID="chat" floatingChrome title="coding scenario" composer={<Text>composer</Text>} {...extra}>
        <AiChatThread testID="thread">
          <AiChatUserMessage>hello</AiChatUserMessage>
        </AiChatThread>
      </AiChatContainer>,
    );
  }

  /** The container measuring its chrome: header block `top` tall, footer `bottom`. */
  function measure(api: ReturnType<typeof renderIn>, top: number, bottom: number) {
    act(() => {
      (api.getByTestId('chat-chrome-top').props.onLayout as (e: unknown) => void)({
        nativeEvent: { layout: { height: top } },
      });
      (api.getByTestId('chat-chrome-bottom').props.onLayout as (e: unknown) => void)({
        nativeEvent: { layout: { height: bottom } },
      });
    });
  }

  function scrollTo_(api: ReturnType<typeof renderIn>, y: number, content: number) {
    act(() =>
      scroller(api).onScroll?.({
        nativeEvent: { contentOffset: { y }, layoutMeasurement: { height: 400 }, contentSize: { height: content } },
      } as never),
    );
  }

  it('floats the header and the footer absolutely over the transcript, passing touches through', () => {
    const api = floating();
    const top = api.getByTestId('chat-chrome-top');
    const bottom = api.getByTestId('chat-chrome-bottom');
    expect(resolvedStyle(top.props.style)).toMatchObject({ position: 'absolute', top: 0, left: 0, right: 0 });
    expect(resolvedStyle(bottom.props.style)).toMatchObject({ position: 'absolute', bottom: 0, left: 0, right: 0 });
    expect(top.props.pointerEvents).toBe('box-none');
    expect(bottom.props.pointerEvents).toBe('box-none');
    // The breadcrumb and the composer are inside the floating blocks.
    expect(api.getByText('coding scenario')).toBeTruthy();
    expect(api.getByText('composer')).toBeTruthy();
    // The thread still fills the card: nothing in flow above or below it.
    expect(resolvedStyle(scroller(api) as never).flex).toBeUndefined();
    expect(resolvedStyle(api.getByTestId('thread').props.style).flex).toBe(1);
  });

  it('pads the thread content by the measured chrome, so the resting turns clear it', () => {
    const api = floating();
    measure(api, 60, 100);
    const content = scroller(api).contentContainerStyle;
    expect(content.paddingTop).toBe(76); // header block + the thread's own 16
    expect(content.paddingBottom).toBe(100);
    expect(scroller(api).scrollIndicatorInsets).toEqual({ top: 60, bottom: 100 });
    // And the scroll is listened to, so the edges can fade.
    expect(scroller(api).onScroll).toBeDefined();
  });

  it('fades an edge in only while the transcript runs under it', () => {
    const api = floating();
    measure(api, 60, 100);
    settle(api, 1000, 600);
    // 1000 content, 400 viewport: range 600. At the end: only the top is covered.
    scrollTo_(api, 600, 1000);
    expect(api.getByTestId('chat-fade-top', HIDDEN)).toBeTruthy();
    expect(api.queryByTestId('chat-fade-bottom', HIDDEN)).toBeNull();
    // Mid-thread: both.
    scrollTo_(api, 300, 1000);
    expect(api.getByTestId('chat-fade-bottom', HIDDEN)).toBeTruthy();
    // At the top: only the bottom.
    scrollTo_(api, 0, 1000);
    expect(api.queryByTestId('chat-fade-top', HIDDEN)).toBeNull();
    expect(api.getByTestId('chat-fade-bottom', HIDDEN)).toBeTruthy();
  });

  it('draws no fades without a surface to fade to', () => {
    const api = floating({ surface: false });
    measure(api, 60, 100);
    settle(api, 1000, 300);
    scrollTo_(api, 300, 1000);
    expect(api.queryByTestId('chat-fade-top', HIDDEN)).toBeNull();
    expect(api.queryByTestId('chat-fade-bottom', HIDDEN)).toBeNull();
  });

  it('holds the reader still when only the chrome resizes, and follows real turns as before', () => {
    const api = floating();
    measure(api, 60, 100);
    settle(api, 1000, 600); // at the end
    // The composer grows by 40: the content grows by exactly that.
    measure(api, 60, 140);
    act(() => scroller(api).onContentSizeChange(0, 1040));
    expect(scrollToEnd).toHaveBeenCalledWith({ animated: false });
    expect(scrollToEnd).not.toHaveBeenCalledWith({ animated: true });

    // Mid-thread, the header block growing by 20 is absorbed into the offset.
    scrollToEnd.mockClear();
    scrollTo_(api, 300, 1040);
    measure(api, 80, 140);
    act(() => scroller(api).onContentSizeChange(0, 1060));
    expect(scrollTo).toHaveBeenCalledWith({ y: 320, animated: false });
    expect(scrollToEnd).not.toHaveBeenCalled();

    // A new turn is still a growth the thread follows, smoothly.
    act(() => scroller(api).onContentSizeChange(0, 1300));
    expect(scrollToEnd).toHaveBeenCalledWith({ animated: true });
  });

  it('hands custom children the insets, and nothing outside it', () => {
    let seen: AiChatChromeInsets | null | undefined;
    function Probe() {
      seen = useAiChatChromeInsets();
      return null;
    }
    const api = renderIn(
      <AiChatContainer testID="chat" floatingChrome title="t" composer={null}>
        <Probe />
      </AiChatContainer>,
    );
    measure(api, 48, 90);
    expect(seen).toEqual({ top: 48, bottom: 90 });

    renderIn(
      <AiChatContainer title="t" composer={null}>
        <Probe />
      </AiChatContainer>,
    );
    expect(seen).toBeNull();
  });
});

describe('AiChatContainer without floatingChrome', () => {
  it('stacks as before: no floating blocks, and the thread pads, listens and scrolls exactly as alone', () => {
    const api = renderIn(
      <AiChatContainer testID="chat" title="coding scenario" composer={<Text>composer</Text>}>
        <AiChatThread testID="thread">turns</AiChatThread>
      </AiChatContainer>,
    );
    expect(api.queryByTestId('chat-chrome-top')).toBeNull();
    expect(api.queryByTestId('chat-chrome-bottom')).toBeNull();
    const content = scroller(api).contentContainerStyle;
    expect(content.paddingTop).toBe(16);
    expect('paddingBottom' in content).toBe(false);
    expect(scroller(api).scrollIndicatorInsets).toBeUndefined();
    expect(scroller(api).onScroll).toBeUndefined();

    const alone = renderIn(<AiChatThread testID="thread">turns</AiChatThread>);
    expect(scroller(alone).contentContainerStyle).toEqual(content);
  });
});
