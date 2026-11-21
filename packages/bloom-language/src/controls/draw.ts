import type { ReactElement, ReactNode } from 'react';

import type { Child, Modifier, Node } from '../node';

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
   * Draws what `drawn` returns, with the view's press on a host around it when
   * the view is pressable (for a component that takes no press of its own).
   */
  pressAround(drawn: (props: Record<string, unknown>) => ReactElement): ReactElement;
  /** A language child, drawn where the control is. */
  render(child: Child): ReactNode;
  /** Children, one slot each, as a stack draws them. */
  children(children: readonly Child[]): ReactNode[];
}

/** A control's renderer: its node, drawn as the Bloom component it stands for. */
export type ControlRenderer = (draw: ControlDraw) => ReactElement;
