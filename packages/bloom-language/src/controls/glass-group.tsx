import { View } from 'react-native';

import { Node, type Child, type ViewModifiers } from '../node';
import { getPlatformGlassGroup, systemGlassGroup } from '../platform/glass-group-host';
import { resolveSpace, type SpaceToken } from '../tokens';
import { type ControlRenderer, defineControls } from './draw';

/**
 * SwiftUI's `GlassEffectContainer`: the glasses inside render together. Each
 * platform draws it with its own container (see docs/bloom-language.mdx,
 * Glass groups): one lens base drawn as its glasses on Android and OxyOS,
 * UIKit's glass container on iOS, and a plain view on the web, where each
 * glass is its own `Surface`.
 */
export type GlassGroupKind = 'glassGroup';

export interface GlassGroupView extends ViewModifiers<GlassGroupView> {
  /**
   * The distance at which the group's glasses blend into one shape (SwiftUI's
   * container `spacing`; a stack's gap is `.spacing()`). iOS and Android read it.
   */
  blend(value: SpaceToken): GlassGroupView;
}

/** A glass group around `children`: their glasses render, blend and morph together. */
export function GlassGroup(...children: Child[]): GlassGroupView {
  return new Node('glassGroup', null, children);
}

const GLASS_GROUPS: Record<GlassGroupKind, ControlRenderer> = {
  glassGroup: (d) => {
    const blend = d.own('blend')?.value;
    const points = blend === undefined ? undefined : resolveSpace(blend as SpaceToken);
    // iOS: a group of glass icon buttons is SwiftUI's own glass, morphing by `glassID`.
    const system = systemGlassGroup?.({ node: d.node, blend: points, press: d.press });
    if (system) return d.around(system);
    const host = getPlatformGlassGroup();
    const props = d.props();
    if (host === null) return d.component(View, props, ...d.children(d.node.children));
    props.blend = points;
    return d.component(host, props, ...d.children(d.node.children));
  },
};
defineControls(GLASS_GROUPS);
