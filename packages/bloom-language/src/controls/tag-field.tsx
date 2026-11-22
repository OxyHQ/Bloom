import type { BloomSize } from '@oxy.so/bloom/appearance';
import {
  TagField as BloomTagField,
  type TagFieldLabels,
  type TagSuggestion,
} from '@oxy.so/bloom/tag-field';
import type { AccentTone } from '@oxy.so/bloom/theme';

import type { Binding } from '../binding';
import { Node, type ViewModifiers } from '../node';
import type { ControlRenderer } from './draw';

/** Tags as an input: removable chips, a caret after them and suggestions (Bloom `tag-field`). */
export type TagFieldKind = 'tagField';

/** Bloom `TagField`: the binding's tags. */
export interface TagFieldView extends ViewModifiers<TagFieldView> {
  placeholder(value: string): TagFieldView;
  /** What it suggests as the person types, and the most it lists. */
  tagSuggestions(value: ReadonlyArray<string | TagSuggestion>, max?: number): TagFieldView;
  /** A typed tag that is no suggestion can be added (on by default). */
  allowsCreate(value: boolean): TagFieldView;
  /** The most tags, and what reaching it does. */
  max(value: number): TagFieldView;
  onMaxReached(value: () => void): TagFieldView;
  /** What a typed tag becomes (trimmed and lower-cased by default). */
  normalize(value: (raw: string) => string): TagFieldView;
  /** The typed text, when the screen owns it. */
  query(value: Binding<string>): TagFieldView;
  /** The chips' tone. */
  tint(value: AccentTone): TagFieldView;
  size(value: BloomSize): TagFieldView;
  disabled(value?: boolean): TagFieldView;
  invalid(value?: boolean): TagFieldView;
  labels(value: TagFieldLabels): TagFieldView;
}

/** Bloom `TagField`: the binding's tags; `title` is its visible label (and name). */
export function TagField(tags: Binding<ReadonlyArray<string>>, title?: string): TagFieldView {
  return new Node('tagField', { tags, title }, []);
}

export const TAG_FIELDS: Record<TagFieldKind, ControlRenderer> = {
  tagField: (d) => {
    const { tags, title } = d.node.props as {
      tags: Binding<ReadonlyArray<string>>;
      title?: string;
    };
    const suggestions = d.own('tagSuggestions')?.value;
    const query = d.own('query')?.value;
    const props = d.props();
    Object.assign(props, {
      value: tags[0],
      onChange: tags[1],
      label: title,
      placeholder: d.own('placeholder')?.value,
      allowCreate: d.own('allowsCreate')?.value,
      max: d.own('max')?.value,
      onMaxReached: d.own('onMaxReached')?.value,
      normalize: d.own('normalize')?.value,
      tone: d.own('tint')?.value,
      size: d.own('size')?.value,
      disabled: d.own('disabled')?.value,
      invalid: d.own('invalid')?.value,
      labels: d.own('labels')?.value,
    });
    if (suggestions !== undefined) [props.suggestions, props.maxSuggestions] = suggestions;
    if (query !== undefined) [props.inputValue, props.onInputValueChange] = query;
    return d.component(BloomTagField, props);
  },
};
