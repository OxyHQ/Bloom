import { useContext, useEffect, type ReactNode } from 'react';
import { ScreenReselectScope, useScreenReselect } from '../screen/reselect';
import { TabPagerContext } from '../tab-pager/context';

/** Hands the scope's reselect to a tab pager above the shell, for its bar and sidebar. */
function PagerReselect() {
  const register = useContext(TabPagerContext)?.registerReselect;
  const reselect = useScreenReselect();
  useEffect(() => register?.(reselect), [register, reselect]);
  return null;
}

/**
 * The shell's reselect scope: its routes' screens and scrollers answer one
 * reselect, which a `TabPagerProvider` above uses when its destination in
 * front is pressed again.
 */
export function ShellReselectScope({ children }: { children: ReactNode }) {
  return (
    <ScreenReselectScope>
      <PagerReselect />
      {children}
    </ScreenReselectScope>
  );
}
