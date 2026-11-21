import {
  type ComponentType,
  createElement,
  Fragment,
  type ReactElement,
  type ReactNode,
} from 'react';

import { type Child, isNode, type Modifier, type Node, type Press } from '../node';
import type { TextTraits } from '../style';
import type { ColorToken } from '../tokens';

/**
 * What a control's renderer is handed (see `controls/index.ts`): its node, its
 * own modifiers, and the renderer's ways of drawing a Bloom component as a view
 * of the language. A control maps its node onto the Bloom component an app
 * writes today and draws it with these, so its box (padding, frame, fill…), its
 * placement and its accessibility props reach it as they reach any view.
 */
export interface ControlDraw {
  readonly node: Node;
  /** The node's own modifier of this kind (the last one chained), if any. */
  own<K extends Modifier['kind']>(kind: K): Extract<Modifier, { kind: K }> | undefined;
  /** `.label()`: the control's accessible name. */
  readonly label: string | undefined;
  readonly hint: string | undefined;
  readonly testID: string | undefined;
  /**
   * The text environment the control is drawn in: its own `.font()`,
   * `.weight()` and `.foreground()` over what it inherits, as a `Text` there
   * reads them. For a component that sets text.
   */
  readonly text: TextTraits;
  /** The view's React key, for the component that is its outermost host. */
  readonly key: string | number | undefined;
  /**
   * The view's press and accessibility props, and its key, for a component
   * that is the outermost host: what the component takes as its own props.
   */
  props(): Record<string, unknown>;
  /** Draws a Bloom component with the view's innermost box as its `style`, when it has one. */
  component(host: unknown, props: Record<string, unknown>, ...children: ReactNode[]): ReactElement;
  /**
   * Draws a Bloom component as `component` does, with the props `colors` names
   * painted from their colour roles (a role at an opacity included; a list of
   * them for a list prop, a scale), read from the theme in the leaf that draws it.
   */
  painted(
    host: unknown,
    props: Record<string, unknown>,
    colors: Readonly<Record<string, ColorToken | readonly ColorToken[] | undefined>>,
    ...children: ReactNode[]
  ): ReactElement;
  /**
   * `element` in a view of its own that takes the view's box, when it has
   * one: for a component whose `style` is not its outer box.
   */
  around(element: ReactElement): ReactElement;
  /**
   * Draws what `drawn` returns, with the view's press on a host around it when
   * the view is pressable (for a component that takes no press of its own).
   */
  pressAround(drawn: (props: Record<string, unknown>) => ReactElement): ReactElement;
  /** A language child, drawn where the control is. */
  render(child: Child): ReactNode;
  /** Children, one slot each, as a stack draws them. */
  children(children: readonly Child[]): ReactNode[];
  /**
   * A press as a handler, in the view's environment: a function as it is, a
   * `navigate()` through the navigator the view is drawn under. For a Bloom
   * prop that takes a handler (an empty state's action, a suggestion).
   */
  press(value: Press | undefined): (() => void) | undefined;
}

/** A control's renderer: its node, drawn as the Bloom component it stands for. */
export type ControlRenderer = (draw: ControlDraw) => ReactElement;

/** The value of `node`'s last modifier of this kind (another node's, read as data). */
export function lastOf<K extends Modifier['kind']>(
  node: Node,
  kind: K,
): Extract<Modifier, { kind: K }> | undefined {
  let found: Extract<Modifier, { kind: K }> | undefined;
  for (const modifier of node.modifiers)
    if (modifier.kind === kind) found = modifier as Extract<Modifier, { kind: K }>;
  return found;
}

/** Language children, flattened to nodes (arrays flattened, absent ones left out). */
export function nodesOf(children: readonly Child[]): Node[] {
  const out: Node[] = [];
  for (const child of children) {
    if (Array.isArray(child)) out.push(...nodesOf(child));
    else if (isNode(child)) out.push(child);
  }
  return out;
}

/** A slot of views (a leading or trailing view) as one element. */
export function slot(d: ControlDraw, children: readonly Child[] | undefined): ReactNode {
  if (children === undefined || children.length === 0) return undefined;
  if (children.length === 1) return d.render(children[0] as Child);
  return createElement(Fragment, null, ...d.children(children));
}

const boxedAs = new Map<string, Map<unknown, ComponentType<Record<string, unknown>>>>();

/**
 * `host` taking the view's box as its `prop` instead of its `style`: for a Bloom
 * component whose outer box is another prop (Search's `containerStyle`). The
 * one component per host and prop draws no view of its own.
 */
export function boxAs(
  host: ComponentType<never>,
  prop: string,
): ComponentType<Record<string, unknown>> {
  let byHost = boxedAs.get(prop);
  if (byHost === undefined) {
    byHost = new Map();
    boxedAs.set(prop, byHost);
  }
  let boxed = byHost.get(host);
  if (boxed === undefined) {
    const named = ({ style, ...props }: Record<string, unknown>) =>
      createElement(host as ComponentType<Record<string, unknown>>, { ...props, [prop]: style });
    named.displayName = `BoxAs(${prop})`;
    boxed = named;
    byHost.set(host, boxed);
  }
  return boxed;
}
