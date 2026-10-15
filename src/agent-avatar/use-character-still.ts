import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { PixelRatio, Platform } from 'react-native';
import type { ResolvedAvatarCharacter } from './character';
import { CharacterRuntimeContext } from './context';
import { defaultCharacterStills, stillBucket, stillKey } from './character-still';
import { renderWebStill } from './character-still-web';

/**
 * The still of a character at a rendered size: a `data:image/png` URI, or `undefined` while it is
 * being drawn (or if it could not be). `enabled: false` asks for nothing at all, so a live
 * avatar costs the cache nothing. A still already in memory is answered on the first render.
 */
export function useCharacterStill(
  character: ResolvedAvatarCharacter | undefined,
  size: number,
  enabled: boolean,
): string | undefined {
  const { runtimeUrl, stills: provided } = useContext(CharacterRuntimeContext);
  const stills = useMemo(
    () =>
      provided ??
      (runtimeUrl
        ? defaultCharacterStills(runtimeUrl, Platform.OS === 'web' ? renderWebStill : null)
        : undefined),
    [provided, runtimeUrl],
  );
  const css = stillBucket(size);
  const ratio = Math.min(PixelRatio.get(), 2);
  const key = useMemo(
    () => (character ? stillKey(character, css, ratio) : undefined),
    [character, css, ratio],
  );
  // The effect keys on the content address, so a caller that writes the character inline each
  // render does not restart the request.
  const latest = useRef(character);
  latest.current = character;
  const [drawn, setDrawn] = useState<{ stills: unknown; key: string; uri: string }>();
  const cached = enabled && stills && key ? stills.peek(key) : undefined;
  useEffect(() => {
    const target = latest.current;
    if (!enabled || !stills || !key || !target || cached) return;
    const request = stills.request(key, target, css, ratio);
    let current = true;
    void request.promise.then((uri) => {
      if (current && uri) setDrawn({ stills, key, uri });
    });
    return () => {
      current = false;
      request.cancel();
    };
  }, [enabled, stills, key, css, ratio, cached]);
  return cached ?? (drawn && drawn.stills === stills && drawn.key === key ? drawn.uri : undefined);
}
