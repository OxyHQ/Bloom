import type { ComponentType } from 'react';
import {
  Platform,
  UIManager,
  View,
  requireNativeComponent,
  type NativeSyntheticEvent,
  type ViewProps,
} from 'react-native';

export interface PredictiveBackHostProps extends ViewProps {
  enabled: boolean;
  destinationTag: number;
  sessionKey: string;
  settledGestureId: number;
  onBackCommitted: (event: NativeSyntheticEvent<{ sessionKey: string; gestureId: number }>) => void;
}

let nativeHost: ComponentType<PredictiveBackHostProps> | null | undefined;
function loadNativeHost() {
  if (nativeHost === undefined) {
    nativeHost =
      Platform.OS === 'android' && UIManager?.getViewManagerConfig?.('BloomPredictiveBackHost')
        ? requireNativeComponent<PredictiveBackHostProps>('BloomPredictiveBackHost')
        : null;
  }
  return nativeHost;
}

export const isPredictiveBackAvailable = (): boolean => loadNativeHost() !== null;

/** Native rendering and gesture ownership; no JavaScript work per frame. */
export function PredictiveBackHost({
  enabled,
  destinationTag,
  sessionKey,
  settledGestureId,
  onBackCommitted,
  ...props
}: PredictiveBackHostProps) {
  const NativeHost = loadNativeHost();
  return NativeHost ? (
    <NativeHost
      {...props}
      enabled={enabled}
      destinationTag={destinationTag}
      sessionKey={sessionKey}
      settledGestureId={settledGestureId}
      onBackCommitted={onBackCommitted}
    />
  ) : (
    <View {...props} />
  );
}
