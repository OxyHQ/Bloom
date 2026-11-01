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
  FOCUS_SETTLE_MS,
  useAccessibilityFocus,
  useItemAccessibilityFocus,
  useRestoreAccessibilityFocus,
} from '../hooks/use-accessibility-focus';

/**
 * `react-test-renderer` resolves a host ref to `null` unless it is told what a
 * node looks like, and a null ref is indistinguishable from "the hook chose not
 * to fire". Without this every assertion below would pass for the wrong reason.
 */
const node = {};
const nodeMock = { createNodeMock: () => node };

const setFocus = AccessibilityInfo.sendAccessibilityEvent as jest.Mock;
const legacySetFocus = AccessibilityInfo.setAccessibilityFocus as jest.Mock;

function Surface({ open }: { open: boolean }) {
  const ref = useAccessibilityFocus<React.ComponentRef<typeof View>>(open);
  return <View ref={ref} />;
}

function Trigger({ open }: { open: boolean }) {
  const ref = useRef<React.ComponentRef<typeof View> | null>(null);
  useRestoreAccessibilityFocus(open, ref);
  return <View ref={ref} />;
}

beforeEach(() => {
  jest.useFakeTimers();
  setFocus.mockClear();
  legacySetFocus.mockClear();
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
    // The view itself, through the renderer: never the deprecated tag-based API,
    // whose Android path needs the legacy UIManager constants a bridgeless host
    // may not install.
    expect(setFocus).toHaveBeenCalledWith(node, 'focus');
    expect(legacySetFocus).not.toHaveBeenCalled();
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

describe('useItemAccessibilityFocus', () => {
  /** A collection drawing the items `shown` (a virtualized list), `current` the one the keys moved to. */
  function Items({ shown, current }: { shown: readonly string[]; current: string | null }) {
    const focusItem = useItemAccessibilityFocus(current);
    return (
      <>
        {shown.map((key) => (
          <View key={key} testID={key} ref={(view) => focusItem(key, view)} />
        ))}
      </>
    );
  }
  const nodes = new Map<string, object>();
  const itemMock = {
    createNodeMock: (element: React.ReactElement<{ testID?: string }>) => {
      const key = element.props.testID ?? '';
      const made = nodes.get(key) ?? { key };
      nodes.set(key, made);
      return made;
    },
  };
  const focused = () => setFocus.mock.calls.map(([view]) => (view as { key: string }).key);
  beforeEach(() => nodes.clear());

  it('moves the cursor to the item the current key changes to, once it has settled', () => {
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(<Items shown={['a', 'b', 'c']} current={null} />, itemMock);
    });
    act(() => renderer.update(<Items shown={['a', 'b', 'c']} current="b" />));
    expect(setFocus).not.toHaveBeenCalled();
    act(() => {
      jest.advanceTimersByTime(FOCUS_SETTLE_MS);
    });
    expect(focused()).toEqual(['b']);
    act(() => renderer.update(<Items shown={['a', 'b', 'c']} current="c" />));
    act(() => {
      jest.advanceTimersByTime(FOCUS_SETTLE_MS);
    });
    expect(focused()).toEqual(['b', 'c']);
  });

  it('takes nothing as the collection appears with an item current, or as that row is drawn again', () => {
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(<Items shown={['a', 'b']} current="b" />, itemMock);
    });
    act(() => renderer.update(<Items shown={['a']} current="b" />));
    act(() => renderer.update(<Items shown={['a', 'b']} current="b" />));
    act(() => {
      jest.runOnlyPendingTimers();
    });
    expect(setFocus).not.toHaveBeenCalled();
  });

  it('moves the cursor to an item not drawn yet as it is drawn', () => {
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(<Items shown={['a', 'b']} current="a" />, itemMock);
    });
    act(() => renderer.update(<Items shown={['a', 'b']} current="z" />));
    act(() => {
      jest.runOnlyPendingTimers();
    });
    expect(setFocus).not.toHaveBeenCalled();
    act(() => renderer.update(<Items shown={['y', 'z']} current="z" />));
    act(() => {
      jest.advanceTimersByTime(FOCUS_SETTLE_MS);
    });
    expect(focused()).toEqual(['z']);
  });

  it('is native only', () => {
    Platform.OS = 'web';
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(<Items shown={['a', 'b']} current={null} />, itemMock);
    });
    act(() => renderer.update(<Items shown={['a', 'b']} current="b" />));
    act(() => {
      jest.runOnlyPendingTimers();
    });
    expect(setFocus).not.toHaveBeenCalled();
  });
});
