/**
 * A `BottomBar` as Bloom's `BottomBar`, on every platform: its capsule of tabs
 * with the sliding selection, the fold as the page scrolls, and the action
 * beside it. On Android and OxyOS Bloom draws the capsule with the lens; on
 * iOS and the web, with its floating material (the system blur on iOS).
 *
 * Its action is the shell's: while the screen in front shows a primary action
 * of its own, the bar's steps aside, as the shell's own FAB does.
 */
import { createElement } from 'react';
import { useScreenActionClaimed } from '@oxy.so/bloom/app-shell/hooks';
import { BottomBar } from '@oxy.so/bloom/bottom-bar';

import { resolveIconSize } from '../tokens';
import type { Child, IconComponent, Node, Progress, TabProps } from '../node';
import { nodesOf, valuesOf } from './values';
import type { NodeHostProps } from './host.types';

/** A tab's glyph: Bloom's 24pt rung, which the bar tints. */
const GLYPH = resolveIconSize('lg');

function glyphOf(icon: IconComponent) {
  return createElement(icon, { width: GLYPH, height: GLYPH });
}

function itemsOf(node: Node) {
  return nodesOf(node.children)
    .filter((tab) => tab.kind === 'tab')
    .map((tab) => {
      const { label, icon } = tab.props as TabProps;
      const values = valuesOf(tab);
      const activeIcon = values.activeIcon as IconComponent | undefined;
      return {
        name: String(values.id ?? label),
        label,
        icon: glyphOf(icon),
        activeIcon: activeIcon ? glyphOf(activeIcon) : undefined,
        badge: values.badge as number | undefined,
      };
    });
}

const NOOP = () => {};

export function BottomBarHost({ node, render }: NodeHostProps) {
  const values = valuesOf(node);
  const items = itemsOf(node);
  const action = useScreenActionClaimed() ? undefined : values.action;
  return (
    <BottomBar
      items={items}
      value={(values.selection as string | undefined) ?? ''}
      onValueChange={(values.onSelect as ((id: string) => void) | undefined) ?? NOOP}
      action={action ? render(action as Child) : undefined}
      minimizeProgress={values.minimize as Progress | undefined}
      activeProgress={values.progress as Progress | undefined}
      hideProgress={values.hide as Progress | undefined}
      testID={values.testID as string | undefined}
    />
  );
}
