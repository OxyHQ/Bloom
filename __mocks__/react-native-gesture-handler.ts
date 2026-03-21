const gestureBuilder = () => ({
  enabled: () => gestureBuilder(),
  simultaneousWithExternalGesture: () => gestureBuilder(),
  onStart: () => gestureBuilder(),
  onUpdate: () => gestureBuilder(),
  onEnd: () => gestureBuilder(),
});

export const Gesture = {
  Pan: gestureBuilder,
  Native: gestureBuilder,
};

export const GestureDetector = ({ children }: { children: React.ReactNode }) => children;
