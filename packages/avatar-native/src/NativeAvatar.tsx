import { useEffect, useRef, useState } from 'react';
import { View, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';
import { NativeView } from './bridge';
import { attachNativeAvatar, type NativeAttachment } from './pool';
import type { Capabilities, RenderValue } from './types';

export type NativeAvatarProps = {
  runtimeUrl: string;
  value: RenderValue;
  onReady?(): void;
  onError(): void;
  onCapabilities?(value: Capabilities): void;
  observeSnapshot?(capture: (() => Promise<{ uri: string } | null>) | null): void;
};

/** Native layout remains in React Native; only the atlas rendering is shared. */
export function NativeAvatar(props: NativeAvatarProps) {
  const latest = useRef(props);
  latest.current = props;
  const attachment = useRef<NativeAttachment | undefined>(undefined);
  const fail = useRef<() => void>(() => {});
  const [surface, setSurface] = useState<{ contextId: number; surfaceId: number }>();
  const [size, setSize] = useState({ width: 0, height: 0 });
  const dimensions = useRef(size);
  dimensions.current = size;
  const hasSize = size.width > 0 && size.height > 0;
  const gesture = useRef<{ x: number; y: number; dragged: boolean } | undefined>(undefined);
  const interactive =
    !!props.value.interactive &&
    !props.value.paused &&
    !props.value.portrait &&
    !props.value.reduced;
  useEffect(() => {
    if (!hasSize) return;
    const abort = new AbortController();
    const failCurrent = () => {
      if (abort.signal.aborted) return;
      abort.abort();
      attachment.current = undefined;
      setSurface(undefined);
      latest.current.onError();
    };
    fail.current = failCurrent;
    void attachNativeAvatar(
      props.runtimeUrl,
      latest.current.value,
      dimensions.current.width,
      dimensions.current.height,
      {
        onReady: () => {
          if (!abort.signal.aborted) latest.current.onReady?.();
        },
        onError: failCurrent,
        onCapabilities: (value) => latest.current.onCapabilities?.(value),
      },
      abort.signal,
    )
      .then((next) => {
        if (abort.signal.aborted) {
          next.dispose();
          return;
        }
        attachment.current = next;
        next.resize(dimensions.current.width, dimensions.current.height);
        next.update(latest.current.value);
        setSurface({ contextId: next.contextId, surfaceId: next.surfaceId });
      })
      .catch((error) => {
        if (!abort.signal.aborted && error?.name !== 'AbortError') latest.current.onError();
      });
    return () => {
      abort.abort();
      attachment.current = undefined;
      if (fail.current === failCurrent) fail.current = () => {};
      setSurface(undefined);
    };
  }, [props.runtimeUrl, hasSize]);
  useEffect(() => {
    attachment.current?.update(props.value);
  }, [props.value]);
  useEffect(() => {
    if (!interactive) {
      attachment.current?.pointerEnd();
      gesture.current = undefined;
    }
  }, [interactive]);
  useEffect(() => {
    props.observeSnapshot?.(async () => {
      try {
        const uri = await attachment.current?.snapshot();
        return uri ? { uri } : null;
      } catch {
        return null;
      }
    });
    return () => props.observeSnapshot?.(null);
  }, [props.observeSnapshot]);
  const layout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize((old) => (old.width === width && old.height === height ? old : { width, height }));
    attachment.current?.resize(width, height);
  };
  const end = (event?: GestureResponderEvent) => {
    const old = gesture.current;
    gesture.current = undefined;
    const point = event?.nativeEvent;
    attachment.current?.pointerEnd(point?.locationX, point?.locationY);
    if (
      point &&
      old &&
      !old.dragged &&
      Math.hypot(point.locationX - old.x, point.locationY - old.y) < 6
    )
      attachment.current?.react();
  };
  return (
    <View
      style={{ flex: 1 }}
      onLayout={layout}
      onStartShouldSetResponder={() => interactive}
      onResponderGrant={(event) => {
        const { locationX: x, locationY: y } = event.nativeEvent;
        if (attachment.current?.pointerDown(x, y)) gesture.current = { x, y, dragged: false };
      }}
      onResponderMove={(event) => {
        const old = gesture.current;
        if (!old) return;
        const { locationX: x, locationY: y } = event.nativeEvent;
        if (Math.hypot(x - old.x, y - old.y) >= 6) old.dragged = true;
        attachment.current?.pointerMove(x, y);
      }}
      onPointerMove={(event) => {
        if (interactive && event.nativeEvent.pointerType === 'mouse' && !gesture.current)
          attachment.current?.pointerMove(event.nativeEvent.offsetX, event.nativeEvent.offsetY);
      }}
      onPointerLeave={() => attachment.current?.pointerLeave()}
      onResponderRelease={end}
      onResponderTerminate={() => end()}
    >
      {surface && (
        <NativeView
          key={surface.surfaceId}
          style={{ flex: 1 }}
          contextId={surface.contextId}
          surfaceId={surface.surfaceId}
          onSurfaceError={() => {
            if (attachment.current?.surfaceId === surface.surfaceId) fail.current();
          }}
          onSurfaceReady={(event: { nativeEvent: { visible: boolean } }) => {
            if (attachment.current?.surfaceId !== surface.surfaceId) return;
            attachment.current.visibility(event.nativeEvent.visible);
            attachment.current.surfaceReady();
          }}
          onVisibilityChanged={(event: { nativeEvent: { visible: boolean } }) =>
            attachment.current?.surfaceId === surface.surfaceId &&
            attachment.current.visibility(event.nativeEvent.visible)
          }
        />
      )}
    </View>
  );
}
