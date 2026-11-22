import { View } from 'react-native';

import { Node, type Child, type ViewModifiers } from '../node';
import { getPlatformGlassGroup } from '../platform/glass-group-host';
import { resolveSpace, type SpaceToken } from '../tokens';
import type { ControlRenderer } from './draw';

/**
 * SwiftUI's `GlassEffectContainer`: the glasses inside render together. Each
 * platform draws it with its own container (see docs/bloom-language.mdx,
 * Glass groups): one lens base on Android and OxyOS, UIKit's glass container
 * on iOS, and a plain view on the web, where each glass is its own `Surface`.
 */
export type GlassGroupKind = 'glassGroup';

export interface GlassGroupView extends ViewModifiers<GlassGroupView> {
  /**
   * The distance at which the group's glasses blend into one shape (SwiftUI's
   * container `spacing`; a stack's gap is `.spacing()`). iOS reads it.
   */
  blend(value: SpaceToken): GlassGroupView;
}

/** A glass group around `children`: their glasses render, blend and morph together. */
export function GlassGroup(...children: Child[]): GlassGroupView {
  return new Node('glassGroup', null, children);
}

export const GLASS_GROUPS: Record<GlassGroupKind, ControlRenderer> = {
  glassGroup: (d) => {
    const host = getPlatformGlassGroup();
    const blend = d.own('blend')?.value;
    const props = d.props();
    if (host === null) return d.component(View, props, ...d.children(d.node.children));
    props.blend = blend === undefined ? undefined : resolveSpace(blend as SpaceToken);
    return d.component(host, props, ...d.children(d.node.children));
  },
};
