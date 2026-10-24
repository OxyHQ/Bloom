import { useAppForeground } from '../hooks/use-app-state';
import { useScreenContext } from './context';

/**
 * Whether the reader can see this screen: its `Screen` is active (the focused
 * route, the visible panel, the foreground page) and the app is in the
 * foreground. Outside a `Screen` only the app's state counts.
 */
export function useScreenVisible(): boolean {
  const active = useScreenContext()?.active ?? true;
  return useAppForeground() && active;
}
