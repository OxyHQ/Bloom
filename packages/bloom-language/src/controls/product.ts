import type { ReactNode } from 'react';

import type { Binding } from '../binding';
import type { Child } from '../node';
import { type CornerName, resolveCorner, resolveSpace, type SpaceToken } from '../tokens';
import type { ControlDraw, ControlRenderer, ProductColor } from './draw';

/**
 * A product component's slot: a language child drawn where the component puts
 * it, or `undefined` when none is given (so the component's own default, which
 * an absent prop draws, stays). A string is the component's own: a slot that
 * takes one draws it in its own text style.
 */
export function slot(d: ControlDraw, child: string | Child | undefined): ReactNode {
  return child === undefined || typeof child === 'string' ? child : d.render(child);
}

/** A slot that is a string the component draws in its own text style, or a view. */
export type TextSlot = string | Child;

/** A length a product component takes as a number, given as a space token. */
export function length(token: SpaceToken | undefined): number | undefined {
  return token === undefined ? undefined : resolveSpace(token);
}

/**
 * Bloom's density of a content rhythm (an activity feed's, an order timeline's),
 * from the node's `.density()`: the language's `default` is its `comfortable`.
 */
export function rhythm(d: ControlDraw): 'comfortable' | 'compact' | undefined {
  const density = d.own('density')?.value;
  return density === undefined ? undefined : density === 'compact' ? 'compact' : 'comfortable';
}

/** A corner a product component takes as a radius: a corner rung. */
export type CornerToken = Exclude<CornerName, 'concentric'>;

/** How a product node maps onto its Bloom component, beyond its data (taken as it is). */
export interface ProductSpec {
  /**
   * The props a node's binding (its `binding` prop) is drawn as: the value
   * and its setter (`['value', 'onValueChange']`).
   */
  readonly binding?: readonly [value: string, set: string];
  /** Options that are language children, where Bloom takes a node. */
  readonly slots?: readonly string[];
  /**
   * Options that are functions returning a language child, where Bloom takes
   * a function returning a node (a board's `renderCard`): the same arguments,
   * the view drawn. Set only when given, as Bloom reads some by their presence.
   */
  readonly renders?: readonly string[];
  /** Options that are space tokens, where Bloom takes a number. */
  readonly lengths?: readonly string[];
  /** Options that are corner tokens, where Bloom takes a radius. */
  readonly corners?: readonly string[];
  /** The component takes `.onPress()` and its name itself, rather than a host around it. */
  readonly press?: true;
  /** Props from the node's own modifiers (a variant, a size, a tone). */
  readonly own?: (d: ControlDraw) => Record<string, unknown>;
  /** The component's own colours, painted from their roles; a list (a gradient) as a list. */
  readonly colors?: (d: ControlDraw) => Readonly<Record<string, ProductColor | undefined>>;
}

/**
 * A product node's renderer: its Bloom component with the node's content props
 * and options as Bloom takes them, its binding as the value and its setter, its slots drawn, its lengths resolved and
 * its render functions drawing views, and its own modifiers; its content (the node's child, a list keyed by `.id()`)
 * as Bloom's children. A press goes on a host around it, unless the component
 * takes it itself (`press`).
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
    for (const key of spec.renders ?? []) {
      const render = options?.[key] as ((...args: unknown[]) => Child) | undefined;
      if (render !== undefined) props[key] = (...args: unknown[]) => d.render(render(...args));
    }
    for (const key of spec.lengths ?? [])
      props[key] = length(options?.[key] as SpaceToken | undefined);
    for (const key of spec.corners ?? []) {
      const corner = options?.[key] as CornerToken | undefined;
      props[key] = corner === undefined ? undefined : resolveCorner(corner);
    }
    Object.assign(props, spec.own?.(d));
    const child = d.node.children[0];
    const children = child === undefined ? [] : [d.render(child)];
    const drawn = (press: Record<string, unknown>) =>
      spec.colors === undefined
        ? d.component(host, { ...press, ...props }, ...children)
        : d.painted(host, { ...press, ...props }, spec.colors(d), ...children);
    return spec.press ? drawn(d.props()) : d.pressAround(drawn);
  };
}
