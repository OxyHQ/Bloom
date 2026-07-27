// Chainable gesture-handler mock. Every builder method returns the same
// builder object so tests can construct gesture pipelines of any shape
// without exploding. We mirror the real API surface used by Bloom's
// BottomSheet (and the services BS we're consolidating). New methods can
// be added here without breaking existing tests.
//
// The event callbacks are RECORDED on `__handlers` and a composed gesture keeps
// its members on `__members`, so a suite can fire a real gesture callback with a
// real event payload instead of reaching into the component. That is the only way
// to test a policy that lives inside a gesture callback — e.g. which region of a
// toast row a tap landed in, which is measured against the row's CAPPED width.
export type MockGesture = {
  __handlers: Record<string, ((event: never) => void) | undefined>;
  __members: MockGesture[];
} & Record<string, (...args: never[]) => unknown>;

const gestureBuilder = (): MockGesture => {
  const handlers: MockGesture['__handlers'] = {};
  const record =
    (name: string) =>
    (fn: (event: never) => void) => {
      handlers[name] = fn;
      return builder;
    };
  const builder = {
    enabled: () => builder,
    simultaneousWithExternalGesture: () => builder,
    withRef: () => builder,
    manualActivation: () => builder,
    activeOffsetY: () => builder,
    activeOffsetX: () => builder,
    failOffsetY: () => builder,
    failOffsetX: () => builder,
    // Tap tolerances — the tab bar widens both so a drifting finger still taps.
    maxDistance: () => builder,
    maxDuration: () => builder,
    onBegin: record('onBegin'),
    onStart: record('onStart'),
    onUpdate: record('onUpdate'),
    onChange: record('onChange'),
    onEnd: record('onEnd'),
    onFinalize: record('onFinalize'),
    onTouchesDown: record('onTouchesDown'),
    onTouchesMove: record('onTouchesMove'),
    onTouchesUp: record('onTouchesUp'),
    onTouchesCancelled: record('onTouchesCancelled'),
    __handlers: handlers,
    __members: [] as MockGesture[],
  } as unknown as MockGesture;
  return builder;
};

export const Gesture = {
  Pan: gestureBuilder,
  Tap: gestureBuilder,
  Native: gestureBuilder,
  // A composed gesture is itself chainable, so return a builder too — one that
  // keeps its members reachable.
  Race: (...gestures: unknown[]): MockGesture => {
    const composed = gestureBuilder();
    composed.__members = gestures as MockGesture[];
    return composed;
  },
};

export const GestureDetector = ({ children }: { children: React.ReactNode }) => children;

// GestureHandlerRootView passthrough — preserves children in render output
// so testing-library can still find them.
export const GestureHandlerRootView = ({ children }: { children: React.ReactNode }) => children;

// Type alias used by withRef<GestureType>() — value not needed at runtime.
export type GestureType = unknown;
