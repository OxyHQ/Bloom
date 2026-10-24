import { cloneElement, createElement, isValidElement, type ReactNode } from 'react';
import type { BloomIconComponent } from '../icons/icon-component';
import type { SidebarNavItem } from '../sidebar/types';
import type { TabBarItem } from '../tab-bar/types';
import type { AppDestination, TabPage } from './types';

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
  pages: readonly AppDestination[];
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

export function createPageModel(pages: readonly AppDestination[]): PageModel {
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

/** The destinations that are pages, in pager order. */
export function pagesOf(destinations: readonly AppDestination[]): AppDestination[] {
  return destinations.filter((destination) => destination.page || destination.bar);
}

/** The bar's items, in bar order. */
export function barItemsOf(destinations: readonly AppDestination[]): TabBarItem[] {
  return destinations.flatMap(({ name, label, icon: Icon, activeIcon: ActiveIcon, badge, bar }) =>
    bar
      ? [
          {
            name,
            label: label ?? '',
            icon: Icon ? createElement(Icon) : null,
            activeIcon: ActiveIcon ? createElement(ActiveIcon) : undefined,
            badge,
          },
        ]
      : [],
  );
}

/** The sidebar's rows, in declaration order. */
export function sidebarItemsOf(destinations: readonly AppDestination[]): SidebarNavItem[] {
  return destinations.flatMap(
    ({ name, href, label, icon, activeIcon, badge, sidebar, onLongPress }) =>
      (sidebar ?? Boolean(label && icon)) && label && icon
        ? [
            {
              key: name,
              label,
              icon,
              activeIcon,
              href,
              badge: badge ? badge : undefined,
              onLongPress,
            },
          ]
        : [],
  );
}

/**
 * A glyph handed over as an element, as a component: the slot's size and tint
 * fill in whatever the element does not set itself (a brand mark's own fill).
 */
function iconOf(node: ReactNode): BloomIconComponent {
  return (props) =>
    isValidElement<{ width?: number; height?: number; fill?: string }>(node)
      ? cloneElement(node, { ...props, ...node.props })
      : (node as never);
}

/** The deprecated `pages` prop, as destinations. */
export function destinationsOfPages(pages: readonly TabPage[]): AppDestination[] {
  return pages.map(({ name, href, preload, bar }) => ({
    name,
    href,
    preload,
    page: true,
    bar: Boolean(bar),
    sidebar: false,
    label: bar?.label,
    icon: bar ? iconOf(bar.icon) : undefined,
    activeIcon: bar?.activeIcon ? iconOf(bar.activeIcon) : undefined,
  }));
}

/** What the model depends on. Labels, icons and badges are not part of it. */
export function pagesStructure(pages: readonly AppDestination[]): string {
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
