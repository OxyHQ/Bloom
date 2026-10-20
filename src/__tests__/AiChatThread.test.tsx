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

// ScreenScrollView delegates native work to Animated.ScrollView. Preserve the
// imperative native mock and execute each composed scroll handler here.
jest.mock('react-native-reanimated', () => {
  const actual = jest.requireActual('../../__mocks__/react-native-reanimated');
  const ScrollView = jest.requireMock('react-native').ScrollView;
  return {
    ...actual,
    __esModule: true,
    default: { ...actual.default, ScrollView },
    useAnimatedScrollHandler:
      (handlers: { onScroll?: (event: unknown) => void }) =>
      (event: { nativeEvent?: Record<string, unknown> }) => {
        const nativeEvent = event.nativeEvent ?? event;
        handlers.onScroll?.({ contentSize: { width: 0, height: 0 }, ...nativeEvent });
      },
  };
});

import { Text } from 'react-native';
import { Screen, ScreenScrollView } from '../screen';
import { PageHeader } from '../page-header';
import { PageFooter } from '../page-footer';
import {
  AiChatContainer,
  AiChatThread,
  AiChatUserMessage,
  useAiChatChromeInsets,
} from '../ai-chat';
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
  const props = api.getByTestId('thread').props;
  return {
    ...props,
    contentContainerStyle: resolvedStyle(props.contentContainerStyle),
  } as ScrollProps;
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

  it('keeps following a streamed answer whose growths land before the scroll event does', () => {
    // Android, streaming: the follow's `scrollToEnd` has not produced its scroll
    // event when the next chunk grows the content. The offset on record is the
    // old one, and measured against it the reader looked 100px up — the follow
    // dropped for good.
    const api = renderIn(
      <AiChatThread testID="thread" followThreshold={50}>
        <AiChatUserMessage>hello</AiChatUserMessage>
      </AiChatThread>,
    );
    settle(api, 1000, 600);
    act(() => scroller(api).onContentSizeChange(0, 1100));
    act(() => scroller(api).onContentSizeChange(0, 1200));
    act(() => scroller(api).onContentSizeChange(0, 1300));
    expect(scrollToEnd).toHaveBeenCalledTimes(3);

    // It lands; the next growth is measured normally again and still follows.
    act(() =>
      scroller(api).onScroll?.({
        nativeEvent: { contentOffset: { y: 900 }, layoutMeasurement: { height: 400 } },
      }),
    );
    act(() => scroller(api).onContentSizeChange(0, 1400));
    expect(scrollToEnd).toHaveBeenCalledTimes(4);
  });

  it('stops following when the reader scrolls up, and tells `onScroll` the end moved away', () => {
    const onScroll = jest.fn();
    const api = renderIn(
      <AiChatThread testID="thread" followThreshold={50} onScroll={onScroll}>
        <AiChatUserMessage>hello</AiChatUserMessage>
      </AiChatThread>,
    );
    settle(api, 1000, 600);
    act(() => scroller(api).onContentSizeChange(0, 1100));
    expect(scrollToEnd).toHaveBeenCalledTimes(1);
    // The reader takes over mid-follow, upward.
    act(() =>
      scroller(api).onScroll?.({
        nativeEvent: { contentOffset: { y: 400 }, layoutMeasurement: { height: 400 } },
      }),
    );
    onScroll.mockClear();
    act(() => scroller(api).onContentSizeChange(0, 1300));
    expect(scrollToEnd).toHaveBeenCalledTimes(1);
    // No scroll happened, yet the host hears where the end is now: 500 below.
    expect(onScroll).toHaveBeenCalledTimes(1);
    const { contentOffset, layoutMeasurement, contentSize } = onScroll.mock.calls[0][0].nativeEvent;
    expect(contentSize.height - contentOffset.y - layoutMeasurement.height).toBe(500);
  });

  it('follows the growth after a jump from the ref, before the jump has landed', () => {
    const ref = createRef<AiChatThreadHandle>();
    const api = renderIn(
      <AiChatThread ref={ref} testID="thread" followThreshold={50}>
        <AiChatUserMessage>hello</AiChatUserMessage>
      </AiChatThread>,
    );
    settle(api, 1000, 100);
    act(() => ref.current?.scrollToEnd());
    act(() => scroller(api).onContentSizeChange(0, 1200));
    expect(scrollToEnd).toHaveBeenCalledTimes(2);
  });

  it('tracks viewport position for follow/resize without requiring a host observer', () => {
    const api = renderIn(<AiChatThread testID="thread">turns</AiChatThread>);
    expect(api.UNSAFE_getByType(ScreenScrollView).props.onScroll).toBeDefined();
    // Internal following and shared header/footer metrics both need position.
    expect(scroller(api).onScroll).toBeDefined();
    expect(scroller(api).scrollEventThrottle).toBe(16);
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
      <AiChatContainer
        testID="chat"
        floatingChrome
        title="coding scenario"
        composer={<Text>composer</Text>}
        {...extra}
      >
        <AiChatThread testID="thread">
          <AiChatUserMessage>hello</AiChatUserMessage>
        </AiChatThread>
      </AiChatContainer>,
    );
  }

  /** The container measuring its chrome: header block `top` tall, footer `bottom`. */
  function measure(api: ReturnType<typeof renderIn>, top: number, bottom: number) {
    act(() => {
      (api.getByTestId('chat-header').props.onLayout as (e: unknown) => void)({
        nativeEvent: { layout: { height: top } },
      });
      (api.getByTestId('chat-bottom').props.onLayout as (e: unknown) => void)({
        nativeEvent: { layout: { height: bottom } },
      });
    });
  }

  function scrollTo_(api: ReturnType<typeof renderIn>, y: number, content: number) {
    act(() =>
      scroller(api).onScroll?.({
        nativeEvent: {
          contentOffset: { y },
          layoutMeasurement: { height: 400 },
          contentSize: { height: content },
        },
      } as never),
    );
  }

  it('floats the header and the footer absolutely over the transcript, passing touches through', () => {
    const api = floating();
    const top = api.getByTestId('chat-header');
    const bottom = api.getByTestId('chat-bottom');
    expect(resolvedStyle(top.props.style)).toMatchObject({
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
    });
    expect(resolvedStyle(bottom.props.style)).toMatchObject({
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
    });
    expect(top.props.pointerEvents).toBe('box-none');
    expect(bottom.props.pointerEvents).toBe('box-none');
    // The breadcrumb and the composer are inside the floating blocks.
    expect(api.getByText('coding scenario')).toBeTruthy();
    expect(api.getByText('composer')).toBeTruthy();
    // The thread still fills the card: nothing in flow above or below it.
    expect(resolvedStyle(scroller(api) as never).flex).toBeUndefined();
    expect(resolvedStyle(api.getByTestId('thread').props.style).flex).toBe(1);
  });

  it('lets Screen reserve measured chrome while the thread keeps its own padding', () => {
    const api = floating();
    measure(api, 60, 100);
    const content = scroller(api).contentContainerStyle;
    expect(content.paddingTop).toBe(16);
    expect(content.paddingBottom).toBe(12);
    // Overlay headers reserve no top clearance. Screen owns the footer inset.
    expect(resolvedStyle(api.getByTestId('chat-content').props.style)).toMatchObject({
      paddingTop: 0,
      paddingBottom: 100,
    });
    expect(api.UNSAFE_getByType(Screen).props.headerPlacement).toBe('overlay');
  });

  it('delegates scroll-linked edge paint to PageHeader and PageFooter', () => {
    const api = floating();
    measure(api, 60, 100);
    settle(api, 1000, 600);
    scrollTo_(api, 300, 1000);
    expect(api.UNSAFE_getByType(Screen).props.header.type).toBe(PageHeader);
    expect(api.UNSAFE_getByType(Screen).props.bottomBar.type).toBe(PageFooter);
    expect(api.UNSAFE_getByType(Screen).props.bottomBar.props.scrim).toBe('auto');
    // The shared primitive owns its full ramp, including the 55% tail. A
    // second chat fade used to squeeze that ramp into the final tenth.
    expect(api.queryByTestId('chat-fade-top', HIDDEN)).toBeNull();
    expect(api.queryByTestId('chat-fade-top-surface', HIDDEN)).toBeNull();
    expect(api.queryByTestId('chat-fade-bottom', HIDDEN)).toBeNull();
  });

  it('uses the shared scrim when the containing host supplies the surface', () => {
    const api = floating({ surface: false });
    measure(api, 60, 100);
    expect(api.UNSAFE_getByType(Screen).props.header.props.scrimColor).toBeUndefined();
    expect(resolvedStyle(api.getByTestId('chat').props.style).backgroundColor).toBe('transparent');
  });

  it('holds the reader still when chrome resizes its viewport, and follows real turns', () => {
    const api = floating();
    measure(api, 60, 100);
    settle(api, 1000, 600);
    // Screen reserves chrome outside the native list. A growing composer
    // shrinks its viewport without adding another 40px to the transcript.
    measure(api, 60, 140);
    act(() => scroller(api).onLayout({ nativeEvent: { layout: { height: 360 } } }));
    expect(scrollToEnd).toHaveBeenCalledWith({ animated: false });
    expect(scrollToEnd).not.toHaveBeenCalledWith({ animated: true });

    scrollToEnd.mockClear();
    scrollTo_(api, 300, 1000);
    measure(api, 60, 160);
    act(() => scroller(api).onLayout({ nativeEvent: { layout: { height: 340 } } }));
    expect(scrollTo).not.toHaveBeenCalled();
    expect(scrollToEnd).not.toHaveBeenCalled();

    act(() => scroller(api).onContentSizeChange(0, 1300));
    expect(scrollToEnd).toHaveBeenCalledWith({ animated: true });
  });

  it('adapts Screen clearances for custom children in either container mode', () => {
    let seen: AiChatChromeInsets | null | undefined;
    function Probe() {
      seen = useAiChatChromeInsets();
      return null;
    }
    const api = renderIn(
      <AiChatContainer testID="chat" floatingChrome title="t" composer={<Text>composer</Text>}>
        <Probe />
      </AiChatContainer>,
    );
    measure(api, 48, 90);
    expect(seen).toEqual({ top: 0, bottom: 90 });

    renderIn(
      <AiChatContainer title="t" composer={null}>
        <Probe />
      </AiChatContainer>,
    );
    expect(seen).toEqual({ top: 56, bottom: 0 });
  });
});

describe('AiChatContainer without floatingChrome', () => {
  it('reserves its Screen header while keeping the same thread and own padding', () => {
    const api = renderIn(
      <AiChatContainer testID="chat" title="coding scenario" composer={<Text>composer</Text>}>
        <AiChatThread testID="thread">turns</AiChatThread>
      </AiChatContainer>,
    );
    expect(api.getByTestId('chat-header')).toBeTruthy();
    expect(api.getByTestId('chat-bottom')).toBeTruthy();
    expect(api.UNSAFE_getByType(Screen).props.headerPlacement).toBe('inset');
    const content = scroller(api).contentContainerStyle;
    expect(content.paddingTop).toBe(16);
    expect(content.paddingBottom).toBe(12);
    expect(scroller(api).scrollIndicatorInsets).toBeUndefined();
    expect(api.UNSAFE_getByType(ScreenScrollView).props.onScroll).toBeDefined();

    const alone = renderIn(<AiChatThread testID="thread">turns</AiChatThread>);
    expect(scroller(alone).contentContainerStyle).toEqual(content);
  });
});
