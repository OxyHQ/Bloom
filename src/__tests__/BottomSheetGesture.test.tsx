import React, { createRef } from 'react';
import { Text } from 'react-native';
import { act, render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import BottomSheet, { type BottomSheetRef } from '../bottom-sheet';

/**
 * Pan-to-dismiss is the whole point of routing the Dialog `bottom` placement
 * through `BottomSheet` on BOTH platforms. These tests assert the pan gesture
 * is actually wired (an `onEnd` worklet is registered) and that the
 * dismiss-threshold logic inside it runs end-to-end — i.e. a fast/far downward
 * swipe commits the close and fires `onDismiss`, while a small drag springs the
 * sheet back without dismissing.
 *
 * This file overrides the default gesture-handler mock (which discards the
 * registered callbacks) with a RECORDING mock that captures the pan gesture's
 * handlers. Invoking the captured `onEnd` exercises the real threshold math
 * from `bottom-sheet/BottomSheet.tsx` — there is no `Platform.OS` gating around the
 * `<GestureDetector>` or the pan builder, so this is the SAME code path web
 * runs (drag-to-dismiss is active on web).
 */

interface PanEndEvent {
  velocityY: number;
  translationY: number;
}

interface RecordedGesture {
  onEnd?: (event: PanEndEvent) => void;
  onUpdate?: (event: { translationY: number }) => void;
}

// Recorded `Gesture.Pan()` instances from the most recent render. Must be
// `mock`-prefixed so the hoisted `jest.mock` factory may reference it.
const mockPanGestures: RecordedGesture[] = [];

jest.mock('react-native-gesture-handler', () => {
  const builder = (record?: RecordedGesture) => {
    const self = {
      enabled: () => self,
      simultaneousWithExternalGesture: () => self,
      withRef: () => self,
      manualActivation: () => self,
      activeOffsetY: () => self,
      activeOffsetX: () => self,
      onStart: () => self,
      onUpdate: (fn: RecordedGesture['onUpdate']) => {
        if (record) record.onUpdate = fn;
        return self;
      },
      onEnd: (fn: RecordedGesture['onEnd']) => {
        if (record) record.onEnd = fn;
        return self;
      },
      onTouchesDown: () => self,
      onTouchesMove: () => self,
      onTouchesUp: () => self,
      onTouchesCancelled: () => self,
    };
    return self;
  };

  return {
    Gesture: {
      Pan: () => {
        const record: RecordedGesture = {};
        mockPanGestures.push(record);
        return builder(record);
      },
      Native: () => builder(),
    },
    GestureDetector: ({ children }: { children: React.ReactNode }) => children,
    GestureHandlerRootView: ({ children }: { children: React.ReactNode }) => children,
  };
});

function renderSheet(onDismiss: () => void) {
  const ref = createRef<BottomSheetRef>();
  const utils = render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      <BottomSheet ref={ref} onDismiss={onDismiss}>
        <Text>Body</Text>
      </BottomSheet>
    </BloomThemeProvider>,
  );
  // Present so the sheet mounts and the pan gesture is constructed.
  act(() => {
    ref.current?.present();
  });
  return utils;
}

describe('BottomSheet pan-to-dismiss gesture', () => {
  beforeEach(() => {
    mockPanGestures.length = 0;
  });

  it('wires a pan gesture with an onEnd handler (drag is active, not web-gated)', () => {
    renderSheet(() => {});
    // A pan gesture must have been constructed with an onEnd worklet — proof the
    // drag pipeline is built unconditionally (the source has no
    // `Platform.OS !== 'web'` guard around the GestureDetector or pan builder).
    expect(mockPanGestures.length).toBeGreaterThan(0);
    const bodyPan = mockPanGestures.find((g) => typeof g.onEnd === 'function');
    expect(bodyPan).toBeDefined();
    expect(typeof bodyPan?.onEnd).toBe('function');
  });

  it('dismisses when a fast downward swipe crosses the close threshold', () => {
    const onDismiss = jest.fn();
    renderSheet(onDismiss);
    const bodyPan = mockPanGestures.find((g) => typeof g.onEnd === 'function');

    // A high downward velocity is past `fastSwipeThreshold` (900) → the onEnd
    // worklet commits the close, which (under the reanimated mock that runs
    // withTiming callbacks synchronously) drains through to `onDismiss`.
    act(() => {
      bodyPan?.onEnd?.({ velocityY: 1500, translationY: 50 });
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('does not dismiss on a small, slow drag below the threshold', () => {
    const onDismiss = jest.fn();
    renderSheet(onDismiss);
    const bodyPan = mockPanGestures.find((g) => typeof g.onEnd === 'function');

    // Tiny translation + near-zero velocity → springs back, no close.
    act(() => {
      bodyPan?.onEnd?.({ velocityY: 10, translationY: 12 });
    });
    expect(onDismiss).not.toHaveBeenCalled();
  });
});
