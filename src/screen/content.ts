import { createContext } from 'react';
import type { ViewStyle } from 'react-native';

/** The body contract does not style its enclosing header, cover or overlays. */
export type ScreenKind = 'document' | 'collection' | 'table' | 'canvas' | 'form';
export const ScreenKindContext = createContext<ScreenKind | undefined>(undefined);

export function screenContentStyle(
  kind: ScreenKind | undefined,
  full: boolean,
  wide: boolean,
): ViewStyle {
  const reading = kind === 'document' || kind === 'form';
  return {
    width: '100%',
    minWidth: 0,
    ...(reading
      ? {
          alignSelf: 'center',
          maxWidth: full ? undefined : kind === 'form' ? 640 : 768,
          paddingLeft: wide ? 40 : 24,
          paddingRight: wide ? 40 : 24,
        }
      : {}),
  };
}
