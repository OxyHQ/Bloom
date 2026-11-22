import { ViewportProvider } from '@oxy.so/bloom/viewport';

import { Node, type Child, type ViewNode } from '../node';
import type { ControlRenderer } from './draw';

/**
 * Native clipping geometry for what scrolls (Bloom `viewport`). Its provider
 * is a view around what it holds, with no box of its own; its hooks
 * (`useViewportBinding`, `useInView`) are used as they are inside a `view()`.
 */
export type ViewportKind = 'viewport';

/** Bloom `ViewportProvider`: a scope of clipping viewports for what it holds. */
export interface ViewportView extends ViewNode {
  /** Starts a chain of its own (a portaled dialog's), not inside the enclosing one. */
  root(): ViewportView;
}

/** Bloom `ViewportProvider` around `children`. */
export function Viewport(...children: Child[]): ViewportView {
  return new Node('viewport', null, children);
}

export const VIEWPORTS: Record<ViewportKind, ControlRenderer> = {
  viewport: (d) => {
    const props = d.props();
    props.root = d.own('root') === undefined ? undefined : true;
    return d.component(ViewportProvider, props, ...d.children(d.node.children));
  },
};
