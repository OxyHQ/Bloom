import type { TabBarItem } from '../tab-bar/types';
import type { TabPage } from './types';

/**
 * The pages as two index spaces, converted in one place.
 *
 * Every page is a pager page; only some draw a bar item. A PAGE index and a BAR
 * index therefore stop being the same number the moment one page has no item
 * (a camera to the left of Home), and getting the conversion wrong does not
 * fail loudly: the bar copies `activeProgress` into its geometry raw and
 * unclamped, so a page position in a bar-units slot parks the highlight one
 * item away from the page in front.
 */
export interface PageModel {
  pages: readonly TabPage[];
  /** For each page, where the highlight sits, in bar units. */
  barPositions: readonly number[];
  /** For each page, 1 when it draws no bar item, else 0. */
  chromeHidden: readonly number[];
  /** Page index by name, or -1. */
  indexOf: (name: string) => number;
  /** The bar item a page draws, or -1 when it draws none. */
  barIndexOf: (pageIndex: number) => number;
  /** Which page a pathname is, or -1 — the common answer, for a pushed route. */
  indexForPathname: (pathname: string | null | undefined) => number;
}

export function createPageModel(pages: readonly TabPage[]): PageModel {
  const barNames = pages.filter((page) => page.bar).map((page) => page.name);
  const barIndexOf = (pageIndex: number) => {
    const page = pages[pageIndex];
    return page?.bar ? barNames.indexOf(page.name) : -1;
  };
  // A page without an item still has a highlight position: its nearest drawn
  // neighbour, the one before it first. The capsule then stays on the item the
  // reader came from instead of sliding out of the pill while the bar fades.
  const barPositions = pages.map((_, index) => {
    for (let before = index; before >= 0; before -= 1) {
      const bar = barIndexOf(before);
      if (bar >= 0) return bar;
    }
    for (let after = index + 1; after < pages.length; after += 1) {
      const bar = barIndexOf(after);
      if (bar >= 0) return bar;
    }
    return 0;
  });
  return {
    pages,
    barPositions,
    chromeHidden: pages.map((page) => (page.bar ? 0 : 1)),
    indexOf: (name) => pages.findIndex((page) => page.name === name),
    barIndexOf,
    indexForPathname: (pathname) =>
      pathname ? pages.findIndex((page) => page.href === pathname) : -1,
  };
}

/** The bar's items, in bar order. */
export function barItemsOf(pages: readonly TabPage[]): TabBarItem[] {
  return pages.flatMap((page) => (page.bar ? [{ ...page.bar, name: page.name }] : []));
}

/** What the model depends on. Labels and icons are not part of it. */
export function pagesStructure(pages: readonly TabPage[]): string {
  return pages
    .map((page) => `${page.name}\u0000${page.href}\u0000${page.preload ? 1 : 0}${page.bar ? 1 : 0}`)
    .join('\u0001');
}

/**
 * A page position (`position + offset`: 1.4 is 40% of the way from page 1 to
 * page 2) read through a per-page table, interpolated between the two pages the
 * finger is between so the value tracks it 1:1. A worklet: the pager calls it
 * from `onPageScroll` on the UI thread.
 */
export function valueAtPage(table: readonly number[], position: number): number {
  'worklet';
  const last = table.length - 1;
  if (last < 0) return 0;
  if (position <= 0) return table[0] as number;
  if (position >= last) return table[last] as number;
  const from = Math.floor(position);
  const start = table[from] as number;
  return start + ((table[from + 1] as number) - start) * (position - from);
}
