import { createElement, type ReactElement } from 'react';
import { View } from 'react-native';

import { Node, type Child, type ViewNode } from '../node';
import { HStack, Spacer } from '../primitives';
import type { ENUMS } from '../generated/spec.generated';
import { resolveSpace } from '../tokens';
import { type ControlRenderer, defineControls } from './draw';

export type ToolbarGroupKind = 'toolbarGroup' | 'toolbarSpacer';
/** A toolbar spacer's kind: a fixed gap, or the free space. */
export type ToolbarSpacerKind = (typeof ENUMS.toolbarSpacer)[number];

/**
 * SwiftUI's `ToolbarItemGroup`: a header toolbar's items that share one
 * background. Each group is one glass: one lens base on Android and OxyOS
 * (a menu from any item grows out of the whole group), one Liquid Glass or
 * Surface capsule elsewhere, and items the system bar groups on iOS.
 */
export interface ToolbarGroupView extends ViewNode {
  /** Keys the view among its siblings (a list's item, a branch): its identity. */
  id(value: string | number): ToolbarGroupView;
}
/** SwiftUI's `ToolbarSpacer`: a fixed gap between groups, or the free space. */
export interface ToolbarSpacerView extends ViewNode {
  /** Keys the view among its siblings (a list's item, a branch): its identity. */
  id(value: string | number): ToolbarSpacerView;
}

/** Toolbar items that share one background (Apple: group items that perform similar actions). */
export function ToolbarGroup(...items: Child[]): ToolbarGroupView {
  return new Node('toolbarGroup', null, items);
}

/** A gap between toolbar groups: `fixed` (the default, a small gap) or `flexible` (the free space). */
export function ToolbarSpacer(kind: ToolbarSpacerKind = 'fixed'): ToolbarSpacerView {
  return new Node('toolbarSpacer', { kind }, []);
}

/** A fixed toolbar spacer's width, in points: Bloom's `sm` gap. */
export const TOOLBAR_SPACER_WIDTH = resolveSpace('sm');
const FIXED = { width: TOOLBAR_SPACER_WIDTH } as const;
const FLEXIBLE = Spacer();

const TOOLBAR_GROUPS: Record<ToolbarGroupKind, ControlRenderer> = {
  // One glass around the group's items: the lens base, Liquid Glass or a Surface capsule.
  toolbarGroup: (d) => d.render(HStack(...d.node.children).glass()) as ReactElement,
  toolbarSpacer: (d) =>
    (d.node.props as { kind: ToolbarSpacerKind }).kind === 'flexible'
      ? (d.render(FLEXIBLE) as ReactElement)
      : createElement(View, { key: d.key, style: FIXED }),
};
defineControls(TOOLBAR_GROUPS);
