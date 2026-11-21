import type { ReactNode } from 'react';

import type { Binding } from '../binding';
import type { Child } from '../node';
import { type ColorToken, resolveSpace, type SpaceToken } from '../tokens';
import type { ControlDraw, ControlRenderer } from './draw';

/**
 * A product component's slot: a language child drawn where the component puts
 * it, or `undefined` when none is given (so the component's own default, which
 * an absent prop draws, stays).
 */
export function slot(d: ControlDraw, child: Child | undefined): ReactNode {
  return child === undefined ? undefined : d.render(child);
}

/** A length a product component takes as a number, given as a space token. */
export function length(token: SpaceToken | undefined): number | undefined {
  return token === undefined ? undefined : resolveSpace(token);
}

/** How a product node maps onto its Bloom component, beyond its data (taken as it is). */
export interface ProductSpec {
  /**
   * The props a node's binding (its `binding` prop) is drawn as: the value
   * and its setter (`['value', 'onValueChange']`).
   */
  readonly binding?: readonly [value: string, set: string];
  /** Options that are language children, where Bloom takes a node. */
  readonly slots?: readonly string[];
  /** Options that are space tokens, where Bloom takes a number. */
  readonly lengths?: readonly string[];
  /** Props from the node's own modifiers (a variant, a size, a tone). */
  readonly own?: (d: ControlDraw) => Record<string, unknown>;
  /** The component's own colours, painted from their roles. */
  readonly colors?: (d: ControlDraw) => Readonly<Record<string, ColorToken | undefined>>;
}

/**
 * A product node's renderer: its Bloom component with the node's content props
 * and options as Bloom takes them, its binding as the value and its setter, its slots drawn, its lengths resolved and
 * its own modifiers; its content (the node's child, a list keyed by `.id()`)
 * as Bloom's children. A press goes on a host around it.
 */
export function product(host: unknown, spec: ProductSpec = {}): ControlRenderer {
  return (d) => {
    const { options, binding, ...content } = d.node.props as {
      options?: Readonly<Record<string, unknown>>;
      binding?: Binding<unknown>;
    };
    const props: Record<string, unknown> = { ...options, ...content };
    if (spec.binding !== undefined && binding !== undefined) {
      props[spec.binding[0]] = binding[0];
      props[spec.binding[1]] = binding[1];
    }
    for (const key of spec.slots ?? []) props[key] = slot(d, options?.[key] as Child | undefined);
    for (const key of spec.lengths ?? [])
      props[key] = length(options?.[key] as SpaceToken | undefined);
    Object.assign(props, spec.own?.(d));
    const child = d.node.children[0];
    const children = child === undefined ? [] : [d.render(child)];
    return d.pressAround((press) =>
      spec.colors === undefined
        ? d.component(host, { ...press, ...props }, ...children)
        : d.painted(host, { ...press, ...props }, spec.colors(d), ...children),
    );
  };
}
