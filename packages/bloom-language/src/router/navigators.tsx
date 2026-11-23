import type { ReactNode } from 'react';

import { isNode, type Child } from '../node';
import { toElement } from '../render';
import { AppLayoutHost } from './app-layout';
import { StackHost } from './stack';
import { TabViewHost } from './tabs';

/** What a layout draws: its navigator, or any view (an `Embed` of a layout of the app's own). */
export function drawNavigation(child: Child): ReactNode {
  if (isNode(child)) {
    switch (child.kind) {
      case 'appLayout':
        return <AppLayoutHost node={child} />;
      case 'navStack':
        return <StackHost node={child} />;
      case 'tabView':
        return <TabViewHost />;
    }
  }
  return toElement(child);
}
