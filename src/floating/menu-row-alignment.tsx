/**
 * `alignRows`: rows line up the way a desktop menu's do.
 *
 * A check or radio row draws its indicator in a leading gutter, and a row with
 * a `leading` icon starts its label after the icon. Without alignment a plain
 * row beside them starts its label further left, and the caller had to work
 * out `inset` per row and pass blank leading spacers. Under an aligned surface
 * every row REGISTERS what it draws at its leading edge, and the surface tells
 * every row what the column needs: the gutter if any row has an indicator, an
 * icon-width slot if any row has an icon.
 *
 * Opt-in per surface (`Content` / `SubContent`), so a menu that never asked
 * keeps its approved layout. A web flyout is its own surface and aligns its
 * own rows (inheriting the parent's opt-in); a native inline sub-menu sits in
 * the parent's column and aligns with it.
 */
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { useIsomorphicLayoutEffect } from '../theme/use-isomorphic-layout-effect';

export interface MenuRowTraits {
  gutter: boolean;
  leading: boolean;
}

interface MenuRowAlignment extends MenuRowTraits {
  register: (traits: MenuRowTraits) => () => void;
}

const MenuRowAlignmentContext = createContext<MenuRowAlignment | null>(null);
MenuRowAlignmentContext.displayName = 'BloomMenuRowAlignmentContext';

/** Whether the surface around this point aligns its rows. */
export function useMenuRowsAligned(): boolean {
  return useContext(MenuRowAlignmentContext) !== null;
}

export function MenuRowAlignmentScope({
  enabled,
  children,
}: {
  enabled: boolean | undefined;
  children?: React.ReactNode;
}) {
  const [counts, setCounts] = useState({ gutter: 0, leading: 0 });
  const register = useCallback((traits: MenuRowTraits) => {
    const step = (sign: 1 | -1) =>
      setCounts((current) => ({
        gutter: current.gutter + (traits.gutter ? sign : 0),
        leading: current.leading + (traits.leading ? sign : 0),
      }));
    step(1);
    return () => step(-1);
  }, []);
  const hasGutter = counts.gutter > 0;
  const hasLeading = counts.leading > 0;
  const value = useMemo<MenuRowAlignment | null>(
    () => (enabled ? { register, gutter: hasGutter, leading: hasLeading } : null),
    [enabled, register, hasGutter, hasLeading],
  );
  return (
    <MenuRowAlignmentContext.Provider value={value}>{children}</MenuRowAlignmentContext.Provider>
  );
}

/**
 * A row's half: register what it draws, and read what the column needs. Both
 * answers are `false` outside an aligned surface.
 */
export function useMenuRowAlignment(own: MenuRowTraits): MenuRowTraits {
  const alignment = useContext(MenuRowAlignmentContext);
  const register = alignment?.register;
  useIsomorphicLayoutEffect(() => {
    if (!register || (!own.gutter && !own.leading)) return undefined;
    return register(own);
  }, [register, own.gutter, own.leading]);
  return {
    gutter: alignment?.gutter ?? false,
    leading: alignment?.leading ?? false,
  };
}
