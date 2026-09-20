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

import { AiChatThread, AiChatUserMessage } from '../ai-chat';
import type { AiChatThreadHandle } from '../ai-chat';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

type ScrollProps = {
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
