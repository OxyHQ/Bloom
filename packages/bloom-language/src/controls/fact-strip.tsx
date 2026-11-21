import { FactStrip as BloomFactStrip, type FactStripItem } from '@oxy.so/bloom/fact-strip';

import { isNode, Node, type Child, type Press, type ViewModifiers, type ViewNode } from '../node';
import { resolveSpace, type SpaceToken } from '../tokens';
import { type ControlDraw, type ControlRenderer, lastOf, nodesOf } from './draw';

/** A row of facts under a product's header (Bloom `fact-strip`). */
export type FactStripKind = 'factStrip' | 'fact';

/** A fact's value or caption: a string in the strip's own type, or a view. */
export type FactText = string | Child;

/** Bloom `FactStrip`: its facts side by side, a hairline between them, scrolling when they do not fit. */
export interface FactStripView extends ViewModifiers<FactStripView> {
  /** The narrowest a fact gets before the strip scrolls (`96` by default). */
  minItemWidth(value: SpaceToken): FactStripView;
  /** The scroll track's inset at each end, so the first fact lines up with the page. */
  contentInset(value: SpaceToken): FactStripView;
}
/** One fact of a `FactStrip`: a small label over a large value. It takes no box. */
export interface FactView extends ViewNode {
  /** What sits under the value (the stars, "Years old"). */
  caption(value: FactText): FactView;
  /** Makes the fact a button. */
  onPress(value: Press | undefined): FactView;
  /** The fact's one accessible name (the text it holds by default). */
  label(value: string | undefined): FactView;
  /** Its identity in the strip (its label by default). */
  id(value: string | number): FactView;
}

/** Bloom `FactStrip`: its `Fact`s, in order. */
export function FactStrip(...facts: Child[]): FactStripView {
  return new Node('factStrip', null, facts);
}
/** A fact: what it is (`label`) and the fact itself (`value`: a string is drawn large). */
export function Fact(label: string, value: FactText): FactView {
  return new Node('fact', { label, value }, []);
}

const text = (d: ControlDraw, value: FactText | undefined) =>
  typeof value === 'string' || value === undefined ? value : d.render(value);

function item(d: ControlDraw, fact: Node): FactStripItem {
  const { label, value } = fact.props as { label: string; value: FactText };
  const id = lastOf(fact, 'id')?.value;
  return {
    key: id === undefined ? label : String(id),
    label,
    value: text(d, value),
    caption: text(d, lastOf(fact, 'caption')?.value as FactText | undefined),
    accessibilityLabel: lastOf(fact, 'label')?.value,
    onPress: d.press(lastOf(fact, 'onPress')?.value),
  };
}

export const FACT_STRIPS: Partial<Record<FactStripKind, ControlRenderer>> = {
  factStrip: (d) => {
    const props = d.props();
    const minItemWidth = d.own('minItemWidth')?.value;
    const inset = d.own('contentInset')?.value;
    Object.assign(props, {
      items: nodesOf(d.node.children)
        .filter((child) => isNode(child) && child.kind === 'fact')
        .map((fact) => item(d, fact)),
      minItemWidth: minItemWidth === undefined ? undefined : resolveSpace(minItemWidth),
      contentInset: inset === undefined ? undefined : resolveSpace(inset),
    });
    return d.component(BloomFactStrip, props);
  },
};
