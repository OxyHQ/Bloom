import type React from 'react';
import { createRef } from 'react';
import { Text } from 'react-native';
import { act, render } from '@testing-library/react-native';
import * as Reanimated from 'react-native-reanimated';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import BottomSheet, { type BottomSheetRef } from '../bottom-sheet';
import { useSheetKeyboardHeight } from '../bottom-sheet/context';
import { sheetFooterOffset } from '../bottom-sheet/footer-position';
import { CheckoutSheet, emptyCheckoutDraft } from '../checkout-sheet';
import { Dialog, useDialogControl } from '../dialog';

/**
 * The sheet's drags are Bloom's gesture layer (`useDrag` on Gesture Handler
 * 3's hooks). The Gesture Handler mock records each hook's config and
 * callbacks, so these fire the sheet's real callbacks with real payloads: the
 * activation decisions, how far the sheet follows the finger, and the one
 * release rule (`shouldClosePan`) with its springs. There is no `Platform.OS`
 * gating around the detectors or the drags, so this is the SAME code path web
 * runs (drag-to-dismiss is active on web).
 */

// The scroll offset is what the body drag reads to hand a touch to the
// scroller; the default mock's scroll handler drops it, so this one keeps it.
jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  ...jest.requireActual('react-native-reanimated'),
  useAnimatedScrollHandler:
    (handlers: { onScroll?: (event: unknown) => void }) => (event: unknown) =>
      handlers.onScroll?.(event),
}));

type Handler = (event: Record<string, unknown>) => void;
interface Recorded {
  __handlers: Record<string, Handler | undefined>;
  __config: Record<string, unknown>;
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { GestureStateManager } = require('react-native-gesture-handler') as {
  GestureStateManager: { __calls: Array<{ action: string; handlerTag: number }> };
};

const WINDOW_HEIGHT = 812; // the react-native mock's window

type View = ReturnType<typeof render>;

/** Every detector's gesture, outermost first: the body drag, the handle's, the scroll view's. */
function detectors(
  view: View,
): Array<{ gesture: Recorded; child: { props: Record<string, unknown> } }> {
  return view.UNSAFE_root.findAll(
    (node) => node.props.gesture !== undefined && typeof node.type === 'function',
  ).map((node) => ({ gesture: node.props.gesture as Recorded, child: node.props.children }));
}
function drags(view: View): Recorded[] {
  return detectors(view)
    .map((d) => d.gesture)
    .filter((g) => g.__handlers.onUpdate !== undefined);
}
function bodyDrag(view: View): Recorded {
  const body = drags(view)[0];
  if (!body) throw new Error('no body drag');
  return body;
}

/** The sheet's transform, as its last render drew it. */
function sheetTransform(view: View): { translateY: number; scale: number } {
  const sheet = detectors(view)[0]?.child;
  const flat = Object.assign(
    {},
    ...[sheet?.props.style].flat(Number.POSITIVE_INFINITY).filter(Boolean),
  ) as { transform?: Array<Record<string, number>> };
  const transform = flat.transform ?? [];
  return {
    translateY: transform.find((t) => 'translateY' in t)?.translateY ?? Number.NaN,
    scale: transform.find((t) => 'scale' in t)?.scale ?? Number.NaN,
  };
}

/** A whole touch the drag takes: lands, activates, moves `translation`, releases at `velocity`. */
function swipe(gesture: Recorded, translation: number, velocity: number) {
  act(() => {
    gesture.__handlers.onBegin?.({});
    gesture.__handlers.onActivate?.({});
    gesture.__handlers.onUpdate?.({
      translationX: 0,
      translationY: translation,
      velocityX: 0,
      velocityY: velocity,
    });
    gesture.__handlers.onDeactivate?.({ velocityX: 0, velocityY: velocity, canceled: false });
    gesture.__handlers.onFinalize?.({});
  });
}

function sheetTree(
  props: Partial<React.ComponentProps<typeof BottomSheet>>,
  ref = createRef<BottomSheetRef>(),
) {
  return {
    ref,
    tree: (
      <BloomThemeProvider mode="light" colorPreset="teal">
        <BottomSheet ref={ref} {...props}>
          <Text>Body</Text>
        </BottomSheet>
      </BloomThemeProvider>
    ),
  };
}

function renderSheet(props: Partial<React.ComponentProps<typeof BottomSheet>> = {}) {
  const { ref, tree } = sheetTree(props);
  const view = render(tree);
  // Present so the sheet mounts and its drags are built.
  act(() => {
    ref.current?.present();
  });
  // Draw the sheet's current transform (the mock's mapper runs at render).
  const redraw = () => view.rerender(sheetTree(props, ref).tree);
  return { view, redraw };
}

describe('BottomSheet drags (legacy body drag, the default)', () => {
  it('shares its touches with the scroll view and takes one by the pan’s own slop', () => {
    const { view } = renderSheet();
    const found = detectors(view);
    const body = bodyDrag(view);
    // The scroll view's own gesture wraps the ScrollView; no handle drag is mounted.
    const scroll = found.find((d) => d.gesture.__handlers.onUpdate === undefined)?.gesture;
    expect(drags(view)).toHaveLength(1);
    expect(scroll).toBeDefined();
    expect(body.__config).toMatchObject({
      enabled: true,
      manualActivation: false,
      activeOffsetY: undefined,
      failOffsetY: undefined,
    });
    expect(body.__config.simultaneousWith).toBe(scroll);
  });

  it('follows the finger from where the sheet was when it took the touch, and shrinks with it', () => {
    const { view, redraw } = renderSheet();
    const body = bodyDrag(view);
    act(() => {
      body.__handlers.onBegin?.({});
      body.__handlers.onActivate?.({});
      body.__handlers.onUpdate?.({ translationY: 120, velocityY: 300 });
    });
    redraw();
    const { translateY, scale } = sheetTransform(view);
    expect(translateY).toBe(120);
    expect(scale).toBeCloseTo(1 - 0.05 * (120 / WINDOW_HEIGHT), 12);
  });

  it.each([
    [false, 0],
    [true, -15],
  ])('above its rest a sheet holds (detached=%s follows at 0.3)', (detached, expected) => {
    const { view, redraw } = renderSheet({ detached });
    const body = bodyDrag(view);
    act(() => {
      body.__handlers.onBegin?.({});
      body.__handlers.onActivate?.({});
      body.__handlers.onUpdate?.({ translationY: -50, velocityY: 0 });
    });
    redraw();
    expect(sheetTransform(view).translateY).toBeCloseTo(expected, 12);
  });

  it('leaves a touch that lands on scrolled content to the scroller: no move, no release', () => {
    const onDismiss = jest.fn();
    const { view, redraw } = renderSheet({ onDismiss });
    const scrollView = view.UNSAFE_root.find(
      (node) => node.props.scrollEventThrottle === 16 && typeof node.props.onScroll === 'function',
    );
    act(() => scrollView.props.onScroll({ contentOffset: { y: 40 } }));
    swipe(bodyDrag(view), 500, 1500);
    redraw();
    expect(sheetTransform(view).translateY).toBe(0);
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('holds while a pull down meets content scrolled off the top after the drag took the touch', () => {
    const { view, redraw } = renderSheet();
    const body = bodyDrag(view);
    const scrollView = view.UNSAFE_root.find(
      (node) => node.props.scrollEventThrottle === 16 && typeof node.props.onScroll === 'function',
    );
    act(() => {
      body.__handlers.onBegin?.({});
      body.__handlers.onActivate?.({});
      body.__handlers.onUpdate?.({ translationY: 30, velocityY: 0 });
    });
    act(() => scrollView.props.onScroll({ contentOffset: { y: 20 } }));
    act(() => body.__handlers.onUpdate?.({ translationY: 90, velocityY: 0 }));
    redraw();
    expect(sheetTransform(view).translateY).toBe(30);
  });
});

describe('BottomSheet drags (manualActivation)', () => {
  it('mounts a handle drag past 8dp and a body drag that takes touches by hand, simultaneous', () => {
    const { view } = renderSheet({ manualActivation: true });
    const [body, handle] = drags(view);
    expect(handle?.__config).toMatchObject({
      enabled: true,
      activeOffsetY: [-8, 8],
      manualActivation: false,
    });
    expect(body?.__config).toMatchObject({ manualActivation: true, activeOffsetY: undefined });
    expect(body?.__config.simultaneousWith).toBe(handle);
  });

  it('takes a touch moving down past 8dp at the top, gives it up moving up', () => {
    const { view } = renderSheet({ manualActivation: true });
    const body = bodyDrag(view);
    GestureStateManager.__calls.length = 0;
    const touch = (absoluteY: number) => ({
      handlerTag: 3,
      changedTouches: [{ absoluteX: 0, absoluteY }],
    });
    act(() => {
      body.__handlers.onTouchesDown?.(touch(400));
      body.__handlers.onTouchesMove?.(touch(406)); // wait
      body.__handlers.onTouchesMove?.(touch(409)); // down 9: activate
    });
    act(() => {
      body.__handlers.onTouchesDown?.(touch(400));
      body.__handlers.onTouchesMove?.(touch(395)); // up 5: fail
    });
    expect(GestureStateManager.__calls).toEqual([
      { action: 'activate', handlerTag: 3 },
      { action: 'fail', handlerTag: 3 },
    ]);
  });

  it('the body drag only moves the sheet down from where it started', () => {
    const { view, redraw } = renderSheet({ manualActivation: true });
    const body = bodyDrag(view);
    act(() => {
      body.__handlers.onBegin?.({});
      body.__handlers.onUpdate?.({ translationY: 60, velocityY: 0 });
      body.__handlers.onUpdate?.({ translationY: -20, velocityY: 0 });
    });
    redraw();
    expect(sheetTransform(view).translateY).toBe(60);
  });
});

describe('BottomSheet geometry under a drag', () => {
  it('the keyboard lifts the dragged sheet by its height', () => {
    let keyboard!: Reanimated.SharedValue<number>;
    function KeyboardProbe() {
      keyboard = useSheetKeyboardHeight();
      return null;
    }
    const ref = createRef<BottomSheetRef>();
    const tree = () => (
      <BloomThemeProvider mode="light" colorPreset="teal">
        <BottomSheet ref={ref}>
          <KeyboardProbe />
        </BottomSheet>
      </BloomThemeProvider>
    );
    const view = render(tree());
    act(() => ref.current?.present());
    const body = bodyDrag(view);
    act(() => {
      body.__handlers.onBegin?.({});
      body.__handlers.onActivate?.({});
      body.__handlers.onUpdate?.({ translationY: 80, velocityY: 0 });
      keyboard.value = 300;
    });
    view.rerender(tree());
    expect(sheetTransform(view).translateY).toBe(80 - 300);
  });

  it('a viewport footer holds the panel’s bottom edge as the sheet moves down', () => {
    const { view, redraw } = renderSheet({
      footer: <Text>Footer</Text>,
      footerBehavior: 'viewport',
    });
    const layout = (height: number) => ({
      nativeEvent: { layout: { x: 0, y: 0, width: 375, height } },
    });
    const sheet = detectors(view)[0]?.child as { props: { onLayout: (e: unknown) => void } };
    const footer = view.getByTestId('bloom-sheet-footer');
    act(() => {
      sheet.props.onLayout(layout(500));
      footer.props.onLayout(layout(80));
    });
    const body = bodyDrag(view);
    act(() => {
      body.__handlers.onBegin?.({});
      body.__handlers.onActivate?.({});
      body.__handlers.onUpdate?.({ translationY: 100, velocityY: 0 });
    });
    redraw();
    const scale = 1 - 0.05 * (100 / WINDOW_HEIGHT);
    const footerStyle = Object.assign(
      {},
      ...[view.getByTestId('bloom-sheet-footer').props.style]
        .flat(Number.POSITIVE_INFINITY)
        .filter(Boolean),
    ) as { transform: Array<{ translateY: number }> };
    expect(sheetTransform(view).scale).toBeCloseTo(scale, 12);
    expect(footerStyle.transform[0]?.translateY).toBeCloseTo(
      sheetFooterOffset(100, scale, 500, 80),
      12,
    );
    expect(footerStyle.transform[0]?.translateY).toBeLessThan(0);
  });
});

describe('BottomSheet release', () => {
  it('dismisses when a fast downward swipe crosses the close threshold', () => {
    const onDismiss = jest.fn();
    const { view } = renderSheet({ onDismiss });
    // A high downward velocity is past `FAST_SWIPE_VELOCITY` (900): the release
    // commits the close, which (under the reanimated mock that runs withTiming
    // callbacks synchronously) drains through to `onDismiss`.
    swipe(bodyDrag(view), 50, 1500);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('a short, slow pull springs home on the sheet’s spring, from the finger’s velocity', () => {
    const spring = jest.spyOn(Reanimated, 'withSpring');
    const onDismiss = jest.fn();
    const { view, redraw } = renderSheet({ onDismiss });
    spring.mockClear();
    swipe(bodyDrag(view), 12, 10);
    expect(onDismiss).not.toHaveBeenCalled();
    // Mass 0.8, stiffness 300, damping 25: per unit of mass, as the layer plays it.
    expect(spring).toHaveBeenCalledTimes(1);
    const [target, config] = spring.mock.calls[0] as [number, Record<string, number>];
    expect(target).toBe(0);
    expect(config.velocity).toBe(10);
    expect(config.mass).toBe(1);
    expect(config.stiffness).toBeCloseTo(375, 9);
    expect(config.damping).toBeCloseTo(31.25, 9);
    redraw();
    expect(sheetTransform(view).translateY).toBe(0);
    spring.mockRestore();
  });

  it('a deep pull closes; a deep pull already moving back up does not', () => {
    const onDismiss = jest.fn();
    const { view } = renderSheet({ onDismiss });
    swipe(bodyDrag(view), 400, -400);
    expect(onDismiss).not.toHaveBeenCalled();
    swipe(bodyDrag(view), 400, -200);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('the handle drag releases by the same rule', () => {
    const onDismiss = jest.fn();
    const { view } = renderSheet({ manualActivation: true, onDismiss });
    const handle = drags(view)[1];
    expect(handle).toBeDefined();
    swipe(handle as Recorded, 50, 1500);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});

it('keeps a vetoed drag mounted, springs it home and does not announce completion', () => {
  const spring = jest.spyOn(Reanimated, 'withSpring');
  const onDismiss = jest.fn();
  const guard = jest.fn(() => false);
  const { view } = renderSheet({ onDismiss, onDismissAttempt: guard });
  spring.mockClear();
  swipe(bodyDrag(view), 500, 1500);
  expect(guard).toHaveBeenCalled();
  expect(onDismiss).not.toHaveBeenCalled();
  expect(spring).toHaveBeenLastCalledWith(
    0,
    expect.objectContaining({ velocity: 1500 }),
    undefined,
  );
  expect(view.getByText('Body')).toBeTruthy();
  spring.mockRestore();
});

it.each([false, true])('retains the timed close lifecycle and drag veto (veto=%s)', (veto) => {
  const onDismiss = jest.fn();
  const { view } = renderSheet({
    onDismiss,
    onDismissAttempt: () => !veto,
    transition: { duration: 300, easing: [0, 0, 0.58, 1] },
  });
  swipe(bodyDrag(view), 500, 1500);
  expect(onDismiss).toHaveBeenCalledTimes(veto ? 0 : 1);
  expect(Boolean(view.queryByText('Body'))).toBe(veto);
});

// The native centred Dialog is a detached `BottomSheet` with
// `enablePanDownToClose`. A swipe down is a user dismissal, so
// `dismissOnBackdrop={false}` has to refuse it there as it does on the bottom
// placement; the centred card used to pass no veto and closed on the swipe.
function CentredDialog({ allowed, onClose }: { allowed: boolean; onClose: () => void }) {
  const control = useDialogControl();
  return (
    <Dialog
      control={control}
      startOpen
      placement="center"
      dismissOnBackdrop={allowed}
      onClose={onClose}
    >
      <Text>Centred body</Text>
    </Dialog>
  );
}

it.each([
  [false, 0],
  [true, 1],
])('a centred native Dialog swipe-down honours dismissOnBackdrop=%s', (allowed, closes) => {
  const onClose = jest.fn();
  const view = render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      <CentredDialog allowed={allowed} onClose={onClose} />
    </BloomThemeProvider>,
  );
  swipe(bodyDrag(view), 500, 1500);
  // A refused swipe springs back with the body mounted; an allowed one settles
  // the card closed and reports it once.
  expect(onClose).toHaveBeenCalledTimes(closes);
  expect(Boolean(view.queryByText('Centred body'))).toBe(closes === 0);
});

// Controlled mode: a swipe the centred card commits on its own must reach the
// host's `onClose`, or the host's `open` stays true over a closed dialog.
it('a controlled centred native Dialog reports a committed swipe-down through onClose', () => {
  const onClose = jest.fn();
  const view = render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      <Dialog open placement="center" onClose={onClose}>
        <Text>Controlled body</Text>
      </Dialog>
    </BloomThemeProvider>,
  );
  swipe(bodyDrag(view), 500, 1500);
  expect(onClose).toHaveBeenCalledTimes(1);
  expect(view.queryByText('Controlled body')).toBeNull();
});

it('vetoes a checkout processing swipe through the real shared gesture handler', () => {
  const onClose = jest.fn();
  const view = render(
    <BloomThemeProvider fonts={false}>
      <CheckoutSheet
        open
        step="processing"
        direction="forward"
        request={{
          merchant: 'Shop',
          currency: 'USD',
          dueTodayMinorUnits: 599,
          items: [],
          requiresShipping: false,
          paymentMethods: ['card'],
        }}
        draft={emptyCheckoutDraft()}
        savedCards={[]}
        label={(key) => key}
        formatAmount={String}
        onClose={onClose}
        onBack={() => {}}
        onDraft={() => {}}
        onStep={() => {}}
        onAuthorize={() => {}}
        onCard={() => {}}
      />
    </BloomThemeProvider>,
  );
  expect(drags(view).length).toBeGreaterThan(0);
  for (const gesture of drags(view)) swipe(gesture, 500, 1500);
  expect(onClose).not.toHaveBeenCalled();
  expect(view.getByText('result.processing')).toBeTruthy();
});
