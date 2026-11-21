import { createElement, type ReactElement } from 'react';
import {
  ChoiceList as BloomChoiceList,
  type ChoiceListOption,
  type ChoiceListOptionState,
  type ChoiceListProps,
} from '@oxy.so/bloom/choice-list';

import type { Binding } from '../binding';
import { ENUMS } from '../generated/spec.generated';
import { Node, type Child, type ViewModifiers } from '../node';
import { paddingStyle, type Resolved } from '../style';
import {
  ALIGNMENT,
  resolveCorner,
  resolveSpace,
  type Alignment,
  type Axis,
  type CornerName,
  type Edge,
  type PaddingToken,
  type SpaceToken,
} from '../tokens';
import type { ControlRenderer } from './draw';

/** A few choices, one chosen, one keyboard stop (Bloom `choice-list`). */
export type ChoiceListKind = 'choiceList';

/**
 * Each option's own box: its padding by edge (`{ all: 'sm' }`, `{ horizontal: 'xs' }`,
 * as `.padding(edge, token)` names them), its corner and how it aligns its content.
 */
export interface ChoiceOptionBox {
  readonly padding?: Readonly<Partial<Record<Edge, PaddingToken>>>;
  readonly corner?: Exclude<CornerName, 'concentric'>;
  readonly align?: Alignment;
}

/** Bloom `ChoiceList`: the binding's choice among its options. */
export interface ChoiceListView extends ViewModifiers<ChoiceListView> {
  /** The options' arrangement and the arrows that move through it: `horizontal` (default) or `vertical`. */
  axis(value: Axis): ChoiceListView;
  /** Between options: `lg` by default. */
  spacing(value: SpaceToken): ChoiceListView;
  /** Each option's own box. */
  optionBox(value: ChoiceOptionBox): ChoiceListView;
  disabled(value?: boolean): ChoiceListView;
}

/**
 * Bloom `ChoiceList`: `label` names the whole, the binding holds the chosen
 * option's value, and `content` draws each option (decorative: the option is
 * the control, named by its `label`).
 */
export function ChoiceList<Value extends string>(
  label: string,
  choice: Binding<Value>,
  options: readonly ChoiceListOption<Value>[],
  content: (
    option: Readonly<ChoiceListOption<Value>>,
    state: Readonly<ChoiceListOptionState>,
  ) => Child,
): ChoiceListView {
  return new Node('choiceList', { label, choice, options, content }, []);
}

/** An option box as the style Bloom's `optionStyle` takes. */
function optionStyle(box: ChoiceOptionBox): Resolved {
  const style: Resolved = {};
  const { padding, corner, align } = box;
  for (const edge of ENUMS.edge) {
    const token = padding?.[edge];
    if (token !== undefined) paddingStyle(style, edge, resolveSpace(token));
  }
  if (corner !== undefined) style.borderRadius = resolveCorner(corner);
  if (align !== undefined) style.alignItems = ALIGNMENT[align];
  return style;
}

/**
 * Bloom's `ChoiceList` with its options' spacing as the list's `gap`, before
 * the view's box in its `style`, where an app writes it.
 */
function SpacedChoiceList({
  gap,
  style,
  ...props
}: ChoiceListProps & { gap: number }): ReactElement {
  return createElement(BloomChoiceList, { ...props, style: [{ gap }, style] });
}

export const CHOICE_LISTS: Record<ChoiceListKind, ControlRenderer> = {
  choiceList: (d) => {
    const { label, choice, options, content } = d.node.props as {
      label: string;
      choice: Binding<string>;
      options: readonly ChoiceListOption[];
      content: (
        option: Readonly<ChoiceListOption>,
        state: Readonly<ChoiceListOptionState>,
      ) => Child;
    };
    const spacing = d.own('spacing')?.value as SpaceToken | undefined;
    const box = d.own('optionBox')?.value;
    const props = d.props();
    Object.assign(props, {
      label,
      value: choice[0],
      onValueChange: choice[1],
      options,
      renderContent: (option: Readonly<ChoiceListOption>, state: Readonly<ChoiceListOptionState>) =>
        d.render(content(option, state)),
      orientation: d.own('axis')?.value,
      disabled: d.own('disabled')?.value,
      optionStyle: box === undefined ? undefined : optionStyle(box),
    });
    if (spacing === undefined) return d.component(BloomChoiceList, props);
    props.gap = resolveSpace(spacing);
    return d.component(SpacedChoiceList, props);
  },
};
