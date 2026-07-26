// Chainable gesture-handler mock. Every builder method returns the same
// builder object so tests can construct gesture pipelines of any shape
// without exploding. We mirror the real API surface used by Bloom's
// BottomSheet (and the services BS we're consolidating). New methods can
// be added here without breaking existing tests.
const gestureBuilder = () => {
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
    onBegin: () => builder,
    onStart: () => builder,
    onUpdate: () => builder,
    onChange: () => builder,
    onEnd: () => builder,
    onFinalize: () => builder,
    onTouchesDown: () => builder,
    onTouchesMove: () => builder,
    onTouchesUp: () => builder,
    onTouchesCancelled: () => builder,
  };
  return builder;
};

export const Gesture = {
  Pan: gestureBuilder,
  Tap: gestureBuilder,
  Native: gestureBuilder,
  // A composed gesture is itself chainable, so return a builder too.
  Race: (..._gestures: unknown[]) => gestureBuilder(),
};

export const GestureDetector = ({ children }: { children: React.ReactNode }) => children;

// GestureHandlerRootView passthrough — preserves children in render output
// so testing-library can still find them.
export const GestureHandlerRootView = ({ children }: { children: React.ReactNode }) => children;

// Type alias used by withRef<GestureType>() — value not needed at runtime.
export type GestureType = unknown;
