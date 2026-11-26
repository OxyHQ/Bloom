// A test stub of Mention's skeletons.
import type { ReactElement } from 'react';
export function SettingsSkeleton({ count = 5 }: { count?: number }): ReactElement | null {
  return count > 0 ? null : null;
}
