/**
 * The screen-reader focus pair.
 *
 * These are the one part of the overlay port that a suite CAN see, because the
 * behaviour is a call into a platform API rather than a pixel: on open the
 * cursor must move into the surface, and on close it must go back to the
 * trigger. Both are silent when wrong — a VoiceOver user is left swiping through
 * the screen behind an open menu, and everyone else sees a correct-looking app.
 *
 * What this cannot see, and a device must: whether the 50ms settle is long
 * enough on a cold sheet presentation, and whether focus lands on the first ROW
 * rather than on the container.
 */
import React, { useRef } from 'react';
import { AccessibilityInfo, Platform, View } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';

import {
  useAccessibilityFocus,
  useRestoreAccessibilityFocus,
} from '../hooks/use-accessibility-focus';

/**
 * `react-test-renderer` resolves a host ref to `null` unless it is told what a
 * node looks like, and a null ref is indistinguishable from "the hook chose not
 * to fire". Without this every assertion below would pass for the wrong reason.
 */
const nodeMock = { createNodeMock: () => ({}) };

const setFocus = AccessibilityInfo.setAccessibilityFocus as jest.Mock;

function Surface({ open }: { open: boolean }) {
  const ref = useAccessibilityFocus<View>(open);
  return <View ref={ref} />;
}

function Trigger({ open }: { open: boolean }) {
  const ref = useRef<View | null>(null);
  useRestoreAccessibilityFocus(open, ref);
  return <View ref={ref} />;
}

beforeEach(() => {
  jest.useFakeTimers();
  setFocus.mockClear();
  Platform.OS = 'ios';
});

afterEach(() => {
  jest.useRealTimers();
  Platform.OS = 'ios';
});

describe('useAccessibilityFocus', () => {
  it('moves the cursor into the surface once it has settled', () => {
    act(() => {
      TestRenderer.create(<Surface open />, nodeMock);
    });
    // Before the settle window the view is not yet in the platform's tree, and
    // a request aimed at it would be dropped silently.
    expect(setFocus).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(50);
    });
    expect(setFocus).toHaveBeenCalledTimes(1);
  });

  it('does nothing while the surface is closed', () => {
    act(() => {
      TestRenderer.create(<Surface open={false} />, nodeMock);
    });
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(setFocus).not.toHaveBeenCalled();
  });

  it('cancels a pending move if the surface closes inside the settle window', () => {
    let tree: TestRenderer.ReactTestRenderer | undefined;
    act(() => {
      tree = TestRenderer.create(<Surface open />, nodeMock);
    });
    act(() => {
      tree?.update(<Surface open={false} />);
    });
    act(() => {
      jest.advanceTimersByTime(500);
    });
    // A menu opened and dismissed faster than the settle must not yank the
    // cursor into a surface that is already gone.
    expect(setFocus).not.toHaveBeenCalled();
  });

  it('is a no-op on web, where the browser owns focus', () => {
    Platform.OS = 'web';
    act(() => {
      TestRenderer.create(<Surface open />, nodeMock);
    });
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(setFocus).not.toHaveBeenCalled();
  });
});

describe('useRestoreAccessibilityFocus', () => {
  it('gives the cursor back to the trigger on the open -> closed edge', () => {
    let tree: TestRenderer.ReactTestRenderer | undefined;
    act(() => {
      tree = TestRenderer.create(<Trigger open />, nodeMock);
    });
    act(() => {
      jest.advanceTimersByTime(500);
    });
    // Opening must not move the cursor — that is the surface's job, and doing
    // both would fight over it.
    expect(setFocus).not.toHaveBeenCalled();

    act(() => {
      tree?.update(<Trigger open={false} />);
    });
    act(() => {
      jest.advanceTimersByTime(50);
    });
    expect(setFocus).toHaveBeenCalledTimes(1);
  });

  it('does not fire for a trigger whose surface was never open', () => {
    // Every closed menu on the screen mounts with `open === false`. Keying on
    // the value rather than the EDGE would have each of them grab the cursor.
    act(() => {
      TestRenderer.create(<Trigger open={false} />, nodeMock);
    });
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(setFocus).not.toHaveBeenCalled();
  });

  it('is a no-op on web', () => {
    Platform.OS = 'web';
    let tree: TestRenderer.ReactTestRenderer | undefined;
    act(() => {
      tree = TestRenderer.create(<Trigger open />, nodeMock);
    });
    act(() => {
      tree?.update(<Trigger open={false} />);
    });
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(setFocus).not.toHaveBeenCalled();
  });
});
