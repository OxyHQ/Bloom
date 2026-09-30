import type { PropsWithChildren } from 'react';
import { Portal } from '../portal/index.web';
export function AvatarFlightHost({ children }: PropsWithChildren) {
  return <Portal>{children}</Portal>;
}
