import { useContext, useMemo, type ReactNode } from 'react';
import { ScreenHostContext } from './context';

/**
 * Whether the screens below are the ones in front. A navigator that keeps
 * screens mounted out of sight — a stack's covered scenes, a pager's other pages
 * — wraps each in this, so their Screens go inactive by themselves: videos
 * stop, scroll stops driving the chrome, and reselect, the status bar and the
 * floating action yield to the screen in front.
 */
export function ScreenActivity({ active, children }: { active: boolean; children: ReactNode }) {
  const host = useContext(ScreenHostContext);
  const value = useMemo(() => ({ ...host, active: host.active && active }), [host, active]);
  return <ScreenHostContext.Provider value={value}>{children}</ScreenHostContext.Provider>;
}
