import { useContext, useEffect, useRef } from 'react';
import { BloomImage } from '../image/BloomImage';
import { AvatarSnapshotObserver } from './context';
import type { ResolvedAvatarCharacter } from './character';
import { useCharacterStillResult } from './use-character-still';

/** Already-frozen native previews share the provider's one drawing document. */
export function NativePortrait({
  character,
  size,
  previewPart,
  onReady,
  onError,
}: {
  character: ResolvedAvatarCharacter;
  size: number;
  previewPart?: 'eyes';
  onReady?(): void;
  onError(): void;
}) {
  const { uri, failed } = useCharacterStillResult(character, size, true, previewPart);
  const observe = useContext(AvatarSnapshotObserver);
  const presented = useRef<string | undefined>(undefined);
  const firstReady = useRef(false);
  const latest = useRef(uri);
  latest.current = uri;
  useEffect(() => {
    if (failed) onError();
  }, [failed, onError]);
  useEffect(() => {
    observe?.(async () =>
      presented.current && presented.current === latest.current ? { uri: presented.current } : null,
    );
    return () => observe?.(null);
  }, [observe]);
  if (!uri) return null;
  return (
    <BloomImage
      source={uri}
      contentFit="contain"
      style={{ width: '100%', height: '100%' }}
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      onLoad={() => {
        if (latest.current !== uri) return;
        presented.current = uri;
        if (!firstReady.current) {
          firstReady.current = true;
          onReady?.();
        }
      }}
      onError={() => {
        if (latest.current === uri) onError();
      }}
    />
  );
}
