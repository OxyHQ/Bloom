import { Collapsible as BloomCollapsible } from '@oxy.so/bloom/collapsible';
import type { SurfaceTransition } from '@oxy.so/bloom/motion';

import { Node, type Child, type ViewModifiers } from '../node';
import type { ControlRenderer } from './draw';

/** A measured reveal with no trigger of its own (Bloom `collapsible`). */
export type CollapsibleKind = 'collapsible';

/** Bloom `Collapsible`: its content, revealed while `open`. */
export interface CollapsibleView extends ViewModifiers<CollapsibleView> {
  /** How it opens and shuts: a duration and curve (300ms ease-in-out by default). */
  revealMotion(value: SurfaceTransition): CollapsibleView;
  /** Mounted open, it opens from nothing (for content that arrives while the person watches). */
  revealsOnAppear(value?: boolean): CollapsibleView;
  /** `false` unmounts the content once it has shut (it stays mounted by default). */
  keepsMounted(value: boolean): CollapsibleView;
}

/**
 * Bloom `Collapsible`: `children`, shown while `open` is true. What opens it is
 * the screen's (a row, a button): the collapsible draws no trigger.
 */
export function Collapsible(open: boolean, ...children: Child[]): CollapsibleView {
  return new Node('collapsible', { open }, children);
}

export const COLLAPSIBLES: Record<CollapsibleKind, ControlRenderer> = {
  collapsible: (d) => {
    const props = d.props();
    Object.assign(props, {
      open: (d.node.props as { open: boolean }).open,
      transition: d.own('revealMotion')?.value,
      appear: d.own('revealsOnAppear')?.value,
      keepMounted: d.own('keepsMounted')?.value,
    });
    return d.component(BloomCollapsible, props, ...d.children(d.node.children));
  },
};
