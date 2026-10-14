import type { PropsWithChildren } from 'react';

import { Portal } from '../portal/index.web';

/** On web the layer is portaled to the document, so no scroller or clipped panel can cut a flight. */
export function AvatarFlightHost({ children }: PropsWithChildren) {
  return <Portal>{children}</Portal>;
}
