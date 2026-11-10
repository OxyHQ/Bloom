import { createContext, useContext, useMemo, type PropsWithChildren } from 'react';
import { Platform } from 'react-native';

export type TypographyMode = 'default' | 'system';
/**
 * Which text styles Bloom's ramp is drawn in: `default` (`TYPE_SCALE`) or
 * `desktop` (`DESKTOP_TYPE_SCALE`: 13px body, tracking per size). Unset, a
 * desktop platform (`useDesktopPlatform()`) draws `desktop` and everything else
 * `default`: `BloomThemeProvider` decides it once for the tree below it.
 */
export type TypographyScale = 'default' | 'desktop';
export interface TypographyScopeProps extends PropsWithChildren {
  /** Change only font family; Bloom's semantic size/weight/spacing scales remain intact. */
  mode?: TypographyMode;
  /**
   * The text styles below this scope: `desktop` asks for the desktop text
   * styles off a desktop platform (a web application drawing a desktop's
   * chrome), `default` keeps Bloom's own ramp on one. Inherited when unset.
   */
  scale?: TypographyScale;
}

/**
 * ONE context for both, so a `Text` reads the theme and this and nothing else
 * (`text-host-cost.test.tsx`). `scale` is null until a scope or the theme
 * provider sets it.
 */
interface TypographyContextValue {
  readonly mode: TypographyMode;
  readonly scale: TypographyScale | null;
}
const DEFAULT_CONTEXT: TypographyContextValue = { mode: 'default', scale: null };
const TypographyContext = createContext<TypographyContextValue>(DEFAULT_CONTEXT);

export function TypographyScope({ mode, scale, children }: TypographyScopeProps) {
  const inherited = useContext(TypographyContext);
  const nextMode = mode ?? inherited.mode;
  const nextScale = scale ?? inherited.scale;
  const value = useMemo(() => ({ mode: nextMode, scale: nextScale }), [nextMode, nextScale]);
  return <TypographyContext.Provider value={value}>{children}</TypographyContext.Provider>;
}

/**
 * The scale a tree takes when nothing above it chose one: what the theme
 * provider sets from the platform (`desktop` on a desktop platform). A scope
 * above that already chose keeps its choice.
 */
export function TypographyPlatformDefault({
  desktop,
  children,
}: PropsWithChildren<{ desktop: boolean }>) {
  const inherited = useContext(TypographyContext);
  const scale: TypographyScale = desktop ? 'desktop' : 'default';
  const value = useMemo(
    () => (inherited.scale !== null ? inherited : { mode: inherited.mode, scale }),
    [inherited, scale],
  );
  return <TypographyContext.Provider value={value}>{children}</TypographyContext.Provider>;
}

const SYSTEM_FAMILY = {
  fontFamily:
    Platform.OS === 'web'
      ? 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      : Platform.OS === 'ios'
        ? 'System'
        : 'sans-serif',
};

/** Shared by Bloom text and every control composed from it. */
export function useTypographySystemFamily() {
  return useContext(TypographyContext).mode === 'system' ? SYSTEM_FAMILY : undefined;
}

/** Whether text below is drawn in the desktop text styles (`TypographyScale`). */
export function useDesktopTypography(): boolean {
  return useContext(TypographyContext).scale === 'desktop';
}

/** Both answers from the one context read a `Text` makes. */
export function useTypographyScope(): {
  systemFamily: typeof SYSTEM_FAMILY | undefined;
  desktop: boolean;
} {
  const { mode, scale } = useContext(TypographyContext);
  return {
    systemFamily: mode === 'system' ? SYSTEM_FAMILY : undefined,
    desktop: scale === 'desktop',
  };
}
