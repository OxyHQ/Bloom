import { CategoryBar as BloomCategoryBar, type CategoryBarItem } from '@oxy.so/bloom/category-bar';

import type { Binding } from '../binding';
import { Node, type Child, type ViewModifiers } from '../node';
import { resolveSpace, type ColorToken, type SpaceToken } from '../tokens';
import { slot, type ControlRenderer } from './draw';

/** A scrolling strip of icon-over-label categories with a fixed trailing slot (Bloom `category-bar`). */
export type CategoryBarKind = 'categoryBar';

/** The web arrows' names, in your own words (Bloom speaks them in the locale). */
export interface CategoryBarLabels {
  readonly previous?: string;
  readonly next?: string;
}

/** Bloom `CategoryBar`: its items, the binding's the selected one. */
export interface CategoryBarView extends ViewModifiers<CategoryBarView> {
  /** Content pinned after the strip (a Filters button); it never scrolls. */
  trailing(...value: Child[]): CategoryBarView;
  /** Between items: `3xl` (32) by default. */
  spacing(value: SpaceToken): CategoryBarView;
  /** The surface behind the bar, which the web edge fades blend into (the page's by default). */
  backdrop(value: ColorToken): CategoryBarView;
  labels(value: CategoryBarLabels): CategoryBarView;
}

/**
 * Bloom `CategoryBar`: `label` names the tablist, `items` are its categories
 * (`{ key, label, icon }`), the binding holds the selected key (`undefined`
 * selects none). A press sets it, the selected one's included.
 */
export function CategoryBar(
  label: string,
  items: readonly CategoryBarItem[],
  selection: Binding<string | undefined>,
): CategoryBarView {
  return new Node('categoryBar', { label, items, selection }, []);
}

export const CATEGORY_BARS: Record<CategoryBarKind, ControlRenderer> = {
  categoryBar: (d) => {
    const { label, items, selection } = d.node.props as {
      label: string;
      items: readonly CategoryBarItem[];
      selection: Binding<string | undefined>;
    };
    const spacing = d.own('spacing')?.value as SpaceToken | undefined;
    const labels = d.own('labels')?.value as CategoryBarLabels | undefined;
    const props = d.props();
    Object.assign(props, {
      items,
      value: selection[0],
      onValueChange: selection[1],
      accessibilityLabel: label,
      trailing: slot(d, d.own('trailing')?.value),
      gap: spacing === undefined ? undefined : resolveSpace(spacing),
      previousLabel: labels?.previous,
      nextLabel: labels?.next,
    });
    return d.painted(BloomCategoryBar, props, { fadeColor: d.own('backdrop')?.value });
  },
};
