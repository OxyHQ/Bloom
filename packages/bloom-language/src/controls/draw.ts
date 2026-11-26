import {
  type ComponentType,
  createElement,
  Fragment,
  type ReactElement,
  type ReactNode,
} from 'react';

import {
  type Child,
  isNode,
  type Modifier,
  type Node,
  type NodeKind,
  type Press,
  type TextRuns,
} from '../node';
import type { Binding } from '../binding';
import type { TextTraits } from '../style';
import type { ColorToken, InkToken, Role } from '../tokens';
import type { InsetRoom } from '../chrome/safe-area-inset';
import type { Palette } from '../paint';

/** What a product component's colour prop is painted from: a role, or a list of colours. */
export type ProductColor = InkToken | readonly InkToken[];

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
  /** `.role()`: what the view is to assistive technology. */
  readonly role: Role | undefined;
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
   * painted from their colour roles (a role at an opacity included), read from
   * the theme in the leaf that draws it; an app's own colour is passed as it
   * is. A prop given a list of colours (each a role or an app's own colour) is
   * painted as a list.
   */
  painted(
    host: unknown,
    props: Record<string, unknown>,
    colors: Readonly<Record<string, ProductColor | undefined>>,
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
  /**
   * The room a scrolling control's content makes for views pinned at its
   * edges (`.safeAreaInset()`, `.safeAreaBar()`): its content container's
   * padding adds it. Absent when nothing is pinned.
   */
  readonly room?: InsetRoom;
  /** A language child, drawn where the control is. */
  render(child: Child): ReactNode;
  /** Runs of a text (strings and spans), drawn as runs of the text the control is in. */
  runs(runs: TextRuns): ReactNode;
  /**
   * Runs a function of the control makes as it draws (a markdown's text and
   * links, Bloom calling the function as it renders), drawn as `runs` draws
   * them: they did not exist when the tree was read, so where they take the
   * environment or the theme and the tree did not read it, they read it
   * where they are drawn.
   */
  lateRuns(runs: TextRuns): ReactNode;
  /**
   * A React element drawn where the control is: a language root
   * (`toElement(chain)`) as part of this tree, with no boundary of its own;
   * any other element as it is.
   */
  embed(content: ReactNode): ReactNode;
  /**
   * A language child drawn as a tree of its own, which paints from the theme
   * where it is drawn: for what a Bloom component that re-themes what it
   * holds holds (an immersive player's slot), whose theme is not this tree's.
   */
  tree(child: Child): ReactNode;
  /**
   * What the control's tree paints from (`usePalette`): for a colour a
   * control paints itself, and for a component that keeps a render function
   * across renders (a list's `renderItem`), which renews it when it changes.
   */
  readonly palette: Palette;
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

/** Each control kind's renderer, from the family module that defines it (`defineControls`). */
const renderers = new Map<NodeKind, ControlRenderer>();

/**
 * Declares a family's renderers. A family's module calls it once, beside the
 * constructors of its nodes, so a node's renderer is loaded by the import that
 * makes the node: an app's bundle carries the families it imports and no other
 * (each family is an entry of its own, `@oxy.so/bloom-language/<family>`).
 */
export function defineControls(table: Partial<Record<NodeKind, ControlRenderer>>): void {
  for (const [kind, renderer] of Object.entries(table))
    if (renderer !== undefined) renderers.set(kind as NodeKind, renderer);
}

/** The renderer of a control kind, once its family's module has loaded. */
export function controlOf(kind: NodeKind): ControlRenderer | undefined {
  return renderers.get(kind);
}

/** How a family draws a view a modifier presents over the screen (`.fullScreenCover(…, Gallery(…))`). */
export type CoverRenderer = (
  isPresented: Binding<boolean>,
  content: Node,
  render: (child: Child) => ReactNode,
) => ReactElement;

const covers = new Map<NodeKind, CoverRenderer>();

/** Declares how a family draws its node as a cover, beside its renderers (`defineControls`). */
export function defineCover(kind: NodeKind, renderer: CoverRenderer): void {
  covers.set(kind, renderer);
}

/** How a kind is drawn as a cover, once its family's module has loaded. */
export function coverOf(kind: NodeKind): CoverRenderer | undefined {
  return covers.get(kind);
}

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
