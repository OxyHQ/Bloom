import type { BloomSize } from '@oxy.so/bloom/appearance';
import {
  InputGroup as BloomInputGroup,
  InputGroupAddon as BloomInputGroupAddon,
} from '@oxy.so/bloom/input-group';

import { Node, type Child, type ViewModifiers } from '../node';
import type { ControlDraw, ControlRenderer } from './draw';

/** A control with things attached to it, one bordered box (Bloom `input-group`). */
export type InputGroupKind = 'inputGroup' | 'inputGroupAddon';

/** What an addon holds: a string (Bloom's subdued label) or a view. */
export type InputGroupContent = string | Child;

/** Bloom `InputGroup`: the one shell around a control and its addons. */
export interface InputGroupView extends ViewModifiers<InputGroupView> {
  size(value: BloomSize): InputGroupView;
  invalid(value?: boolean): InputGroupView;
  disabled(value?: boolean): InputGroupView;
}
/** Bloom `InputGroupAddon`: what sits before or after the control. */
export interface InputGroupAddonView extends ViewModifiers<InputGroupAddonView> {
  /** A hairline on its inner edge (for a button). */
  divider(value?: boolean): InputGroupAddonView;
  /** No padding of its own: it reaches the shell's edge (a control with its own hit area). */
  flush(value?: boolean): InputGroupAddonView;
}

/**
 * Bloom `InputGroup`: its children in order, the addons before the control
 * leading and the rest trailing; the control (a `TextField`, a `Search`)
 * draws bare in the group's shell.
 */
export function InputGroup(...children: Child[]): InputGroupView {
  return new Node('inputGroup', null, children);
}
/** Bloom `InputGroupAddon`: a string (drawn as Bloom's subdued label) or views. */
export function InputGroupAddon(...content: InputGroupContent[]): InputGroupAddonView {
  return new Node('inputGroupAddon', { content }, []);
}

const content = (d: ControlDraw) =>
  (d.node.props as { content: readonly InputGroupContent[] }).content.map((part) =>
    typeof part === 'string' ? part : d.render(part),
  );

export const INPUT_GROUPS: Record<InputGroupKind, ControlRenderer> = {
  inputGroup: (d) => {
    const props = d.props();
    Object.assign(props, {
      size: d.own('size')?.value,
      invalid: d.own('invalid')?.value,
      disabled: d.own('disabled')?.value,
    });
    return d.component(BloomInputGroup, props, ...d.children(d.node.children));
  },
  inputGroupAddon: (d) => {
    const props = d.props();
    Object.assign(props, {
      divider: d.own('divider')?.value,
      noPadding: d.own('flush')?.value,
    });
    return d.component(BloomInputGroupAddon, props, ...content(d));
  },
};
