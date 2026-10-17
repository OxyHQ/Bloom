import { createContext, useContext, type PropsWithChildren } from 'react';
import { Platform } from 'react-native';

export type TypographyMode = 'default' | 'system';
export interface TypographyScopeProps extends PropsWithChildren {
  /** Change only font family; Bloom's semantic size/weight/spacing scales remain intact. */
  mode?: TypographyMode;
}
const TypographyContext = createContext<TypographyMode>('default');

export function TypographyScope({ mode, children }: TypographyScopeProps) {
  const inherited = useContext(TypographyContext);
  return (
    <TypographyContext.Provider value={mode ?? inherited}>{children}</TypographyContext.Provider>
  );
}

/** Shared by Bloom text and every control composed from it. */
export function useTypographySystemFamily() {
  const mode = useContext(TypographyContext);
  return mode === 'system'
    ? {
        fontFamily:
          Platform.OS === 'web'
            ? 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            : Platform.OS === 'ios'
              ? 'System'
              : 'sans-serif',
      }
    : undefined;
}
