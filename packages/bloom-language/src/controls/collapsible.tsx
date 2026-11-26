import { Collapsible as BloomCollapsible } from '@oxy.so/bloom/collapsible';
import { resolveTimedMotion, type TimedMotionToken } from '../motion/tokens';
import { Node, type Child, type ViewModifiers } from '../node';
import { type ControlRenderer, defineControls } from './draw';

/** A measured reveal with no trigger of its own (Bloom `collapsible`). */
export type CollapsibleKind = 'collapsible';

/** Bloom `Collapsible`: its content, revealed while `open`. */
export interface CollapsibleView extends ViewModifiers<CollapsibleView> {
  /** How it opens and shuts: a timed motion token (Bloom's 300ms ease-in-out by default). */
  revealMotion(value: TimedMotionToken): CollapsibleView;
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

const COLLAPSIBLES: Record<CollapsibleKind, ControlRenderer> = {
  collapsible: (d) => {
    const props = d.props();
    const motion = d.own('revealMotion')?.value;
    Object.assign(props, {
      open: (d.node.props as { open: boolean }).open,
      transition: motion === undefined ? undefined : resolveTimedMotion(motion),
      appear: d.own('revealsOnAppear')?.value,
      keepMounted: d.own('keepsMounted')?.value,
    });
    return d.component(BloomCollapsible, props, ...d.children(d.node.children));
  },
};
defineControls(COLLAPSIBLES);
