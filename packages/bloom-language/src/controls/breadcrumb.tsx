import type { BloomSize } from '@oxy.so/bloom/appearance';
import {
  Breadcrumb as BloomBreadcrumb,
  BreadcrumbItem as BloomBreadcrumbItem,
  type BreadcrumbHoverMenu,
} from '@oxy.so/bloom/breadcrumb';

import { Node, type Child, type IconComponent, type ViewModifiers } from '../node';
import type { ControlRenderer } from './draw';

/** The trail of ancestor pages, separated by chevrons (Bloom `breadcrumb`). */
export type BreadcrumbKind = 'breadcrumb' | 'breadcrumbItem';

/** Bloom `Breadcrumb`: its items, named with `.label()`. */
export interface BreadcrumbView extends ViewModifiers<BreadcrumbView> {
  size(value: BloomSize): BreadcrumbView;
  /** A trail too long for its row collapses its middle into a menu (it scrolls by default). */
  collapses(): BreadcrumbView;
  /** What sits between items, in place of the chevron. */
  separatorView(value: Child): BreadcrumbView;
  /** The collapsed middle's name (`Show hidden pages`). */
  labels(value: { readonly overflow?: string }): BreadcrumbView;
}
/** Bloom `BreadcrumbItem`: an ancestor page, or the current one. */
export interface BreadcrumbItemView extends ViewModifiers<BreadcrumbItemView> {
  size(value: BloomSize): BreadcrumbItemView;
  icon(value: IconComponent): BreadcrumbItemView;
  /** What leads it (an avatar, a favicon). */
  prefix(value: Child): BreadcrumbItemView;
  /** A link: an anchor on the web, opened on native unless `.onPress` is set. */
  link(href: string): BreadcrumbItemView;
  /** The current page: announced as such, not pressable. */
  active(value: boolean | undefined): BreadcrumbItemView;
  disabled(value?: boolean): BreadcrumbItemView;
  /** A menu of its children under the pointer (the web). */
  hoverMenu(value: BreadcrumbHoverMenu): BreadcrumbItemView;
}

/** Bloom `Breadcrumb`: its `BreadcrumbItem`s, the current page last. */
export function Breadcrumb(...items: Child[]): BreadcrumbView {
  return new Node('breadcrumb', null, items);
}
/** Bloom `BreadcrumbItem`: a title (a string in its type) or a view. */
export function BreadcrumbItem(title: string | Child): BreadcrumbItemView {
  return new Node('breadcrumbItem', { title }, []);
}

export const BREADCRUMBS: Record<BreadcrumbKind, ControlRenderer> = {
  breadcrumb: (d) => {
    const props = d.props();
    const separator = d.own('separatorView')?.value;
    Object.assign(props, {
      size: d.own('size')?.value,
      overflow: d.own('collapses') === undefined ? undefined : 'collapse',
      separator: separator === undefined ? undefined : d.render(separator),
      overflowLabel: (d.own('labels')?.value as { overflow?: string } | undefined)?.overflow,
    });
    return d.component(BloomBreadcrumb, props, ...d.children(d.node.children));
  },
  breadcrumbItem: (d) => {
    const { title } = d.node.props as { title: string | Child };
    const props = d.props();
    const prefix = d.own('prefix')?.value;
    Object.assign(props, {
      size: d.own('size')?.value,
      icon: d.own('icon')?.value,
      leading: prefix === undefined ? undefined : d.render(prefix),
      href: d.own('link')?.value,
      current: d.own('active')?.value,
      disabled: d.own('disabled')?.value,
      hoverMenu: d.own('hoverMenu')?.value,
    });
    return d.component(
      BloomBreadcrumbItem,
      props,
      typeof title === 'string' ? title : d.render(title),
    );
  },
};
