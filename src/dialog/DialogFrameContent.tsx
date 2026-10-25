import type React from 'react';
import { createContext, useContext, useLayoutEffect, useRef, useState, useCallback } from 'react';
import { useDialogFrame } from './DialogMorph';
import { TypographyScope, type TypographyMode } from '../typography/TypographyScope';
import { FrameAppearanceContext } from './frame-appearance';
import type { AppColorName } from '../theme/color-presets';
import type { DialogHeaderConfig, DialogScreenFrame } from './types';

/** Internal stable host: frame declarations run below the panel's morph provider. */
/**
 * The header a Dialog shows with `frame`: the frame's fields over the Dialog's
 * own. A frame that declares no header (one that only sizes content loading in)
 * turns none on: the nav bar and its close control appear only when the Dialog
 * or the frame asks for them.
 */
export function frameHeader(
  header: DialogHeaderConfig | undefined,
  frame: DialogScreenFrame | undefined,
): DialogHeaderConfig | undefined {
  return frame?.header ? { ...header, ...frame.header } : header;
}

export function DialogFrameContent({
  frame,
  children,
}: React.PropsWithChildren<{ frame?: DialogScreenFrame }>) {
  useDialogFrame(frame);
  return <>{children}</>;
}

function InheritedScope({ children }: React.PropsWithChildren) {
  return <>{children}</>;
}

const FrameKeyContext = createContext<string | undefined>(undefined);

/** Frame identity above the panel, independent from its child morph declaration. */
export function DialogFrameProvider({
  frameKey,
  colorPreset,
  typography,
  ColorScope = InheritedScope,
  children,
}: React.PropsWithChildren<{
  frameKey?: string;
  colorPreset?: AppColorName;
  typography?: TypographyMode;
  ColorScope?: React.ComponentType<{
    children: React.ReactNode;
    colorPreset?: AppColorName;
    asChild?: boolean;
  }>;
}>) {
  const [override, setOverride] = useState<{
    owner: symbol;
    preset?: AppColorName;
    typography?: TypographyMode;
  }>();
  const contribute = useCallback(
    (preset: AppColorName | undefined, typography?: TypographyMode) => {
      const owner = Symbol();
      setOverride({ owner, preset, typography });
      return () => setOverride((current) => (current?.owner === owner ? undefined : current));
    },
    [],
  );
  return (
    <FrameKeyContext.Provider value={frameKey}>
      <FrameAppearanceContext.Provider value={contribute}>
        <TypographyScope mode={override ? override.typography : typography}>
          <ColorScope asChild colorPreset={override ? override.preset : colorPreset}>
            {children}
          </ColorScope>
        </TypographyScope>
      </FrameAppearanceContext.Provider>
    </FrameKeyContext.Provider>
  );
}

/** Reset only a new screen in a mounted, dialog-owned scroller. */
export function useDialogFrameScrollReset(enabled: boolean, reset: () => void): void {
  const key = useContext(FrameKeyContext);
  const previous = useRef(key);
  useLayoutEffect(() => {
    const before = previous.current;
    previous.current = key;
    if (enabled && key !== undefined && before !== undefined && key !== before) reset();
  }, [key, enabled, reset]);
}
