import type { PropsWithChildren } from 'react';
/** Decorative native flights stay in the workspace's absolute overlay and never open a touch-blocking window. */
export function AvatarFlightHost({ children }: PropsWithChildren) {
  return <>{children}</>;
}
