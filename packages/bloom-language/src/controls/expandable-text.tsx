import { ExpandableText as BloomExpandableText } from '@oxy.so/bloom/expandable-text';

import type { Binding } from '../binding';
import type { ENUMS } from '../generated/spec.generated';
import { Node, type ViewModifiers } from '../node';
import { isAppColor, textVariant } from '../style';
import type { ColorToken } from '../tokens';
import type { ControlRenderer } from './draw';

/** Text clamped to a few lines, with a control to read the rest (Bloom `expandable-text`). */
export type ExpandableTextKind = 'expandableText';

/** Where its control sits: `below` the text (default), or `inline` at the end of its last line. */
export type ExpandableTextStyle = (typeof ENUMS.expandableTextStyle)[number];

/** Wording of your own for its control (Bloom speaks it in the locale). */
export interface ExpandableTextLabels {
  readonly more?: string;
  readonly less?: string;
}

/** Bloom `ExpandableText`: drawn with its control only when something is hidden. */
export interface ExpandableTextView extends ViewModifiers<ExpandableTextView> {
  /** Lines shown while collapsed (3 by default; 0 never clamps). */
  lines(value: number): ExpandableTextView;
  /** `below` (a review, a bio) or `inline` (a description that opens for good). */
  style(value: ExpandableTextStyle): ExpandableTextView;
  labels(value: ExpandableTextLabels): ExpandableTextView;
}

/**
 * Bloom `ExpandableText`: `text`, clamped; `expanded` holds whether it is open
 * when the screen owns it. Its type and colour are the text environment's
 * (`.font()`, `.weight()`, `.foreground()`), as a `Text`'s are.
 */
export function ExpandableText(text: string, expanded?: Binding<boolean>): ExpandableTextView {
  return new Node('expandableText', { text, expanded }, []);
}

export const EXPANDABLE_TEXTS: Record<ExpandableTextKind, ControlRenderer> = {
  expandableText: (d) => {
    const { text, expanded } = d.node.props as { text: string; expanded?: Binding<boolean> };
    const ink = d.text.foreground;
    const labels = d.own('labels')?.value as ExpandableTextLabels | undefined;
    const props = d.props();
    Object.assign(props, {
      numberOfLines: d.own('lines')?.value,
      toggle: d.own('style')?.value,
      variant: textVariant(d.text),
      color: isAppColor(ink) ? ink.value : undefined,
      moreLabel: labels?.more,
      lessLabel: labels?.less,
      testID: d.testID,
    });
    if (expanded !== undefined) [props.expanded, props.onExpandedChange] = expanded;
    return d.painted(
      BloomExpandableText,
      props,
      { color: isAppColor(ink) ? undefined : (ink as ColorToken | undefined) },
      text,
    );
  },
};
