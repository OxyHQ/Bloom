import type { ReactElement } from 'react';
import {
  MediaInsetBorder as BloomMediaInsetBorder,
  type MediaInsetBorderProps,
} from '@oxy.so/bloom/media-inset-border';

import { Node, type Child, type ViewModifiers } from '../node';
import { type CornerName, resolveCorner } from '../tokens';
import type { ControlRenderer } from './draw';

/** A hairline drawn inside a media edge, so a white photo still has a boundary (Bloom `media-inset-border`). */
export type MediaInsetBorderKind = 'mediaInsetBorder';

/**
 * Bloom `MediaInsetBorder`: a theme hairline that fills its parent, over the
 * media it edges.
 */
export interface MediaInsetBorderView extends ViewModifiers<MediaInsetBorderView> {
  /** The full-contrast border, to line up with opaque borders beside it (softened by default). */
  opaque(value?: boolean): MediaInsetBorderView;
  /** The corner of the media it edges, so the hairline follows it (Bloom's `sm` by default). */
  mediaCorner(value: Exclude<CornerName, 'concentric'>): MediaInsetBorderView;
}

/** Bloom `MediaInsetBorder`, over the views it holds (usually none). */
export function MediaInsetBorder(...children: Child[]): MediaInsetBorderView {
  return new Node('mediaInsetBorder', null, children);
}

/** The border with the media's corner first in its style, as an app writes it, then its box. */
function MediaInsetBorderAt({
  radius,
  style,
  ...props
}: MediaInsetBorderProps & { radius: number }): ReactElement {
  return <BloomMediaInsetBorder {...props} style={[{ borderRadius: radius }, style]} />;
}

export const MEDIA_INSET_BORDERS: Record<MediaInsetBorderKind, ControlRenderer> = {
  mediaInsetBorder: (d) => {
    const props = d.props();
    props.opaque = d.own('opaque')?.value;
    const corner = d.own('mediaCorner')?.value;
    if (corner === undefined)
      return d.component(BloomMediaInsetBorder, props, ...d.children(d.node.children));
    props.radius = resolveCorner(corner);
    return d.component(MediaInsetBorderAt, props, ...d.children(d.node.children));
  },
};
