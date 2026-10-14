import type { PropsWithChildren } from 'react';

/** Native flights are decorative and stay in the screen's own absolute overlay: no touch-blocking window. */
export function AvatarFlightHost({ children }: PropsWithChildren) {
  return <>{children}</>;
}
