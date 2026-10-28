import { useMemo, useState, type Ref } from 'react';
import { Platform } from 'react-native';
import { mergeRefs } from '../hooks/merge-refs';
import { useSurfacePresenceContent } from './use-surface-presence';

/** Native fades its host; only web needs a DOM host for content fading. */
export const useSurfacePresenceRef =
  Platform.OS === 'web' ? useWebSurfacePresenceRef : useNativeSurfacePresenceRef;

function useNativeSurfacePresenceRef<T>(
  ref: Ref<T> | undefined,
  _presence: number,
): Ref<T> | undefined {
  return ref;
}

function useWebSurfacePresenceRef<T>(ref: Ref<T> | undefined, presence: number): Ref<T> {
  const [host, setHost] = useState<T | null>(null);
  const hostRef = useMemo(() => mergeRefs([ref, setHost]), [ref]);
  useSurfacePresenceContent(host, { presence });
  return hostRef;
}
