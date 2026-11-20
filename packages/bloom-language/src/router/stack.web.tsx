/**
 * The web: the route in place (`Slot`, Bloom's panel-aware one), not a stack.
 * The document is the scroller (window virtualizers, `window.scrollY`
 * restoration and sticky chrome measure it), and a stack's scenes are
 * viewport-height boxes that would clip it. The browser's history is the
 * stack; a `Sheet` is the route in place too.
 */
import { Slot } from '@oxy.so/bloom/panel-routing/expo-router';

import type { Node } from '../node';

export function StackHost(_props: { node: Node }) {
  return <Slot />;
}
