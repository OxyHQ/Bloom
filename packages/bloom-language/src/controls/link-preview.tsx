import {
  LinkPreviewCard as BloomLinkPreviewCard,
  type LinkPreviewCardProps,
} from '@oxy.so/bloom/link-preview';

import { Node, type ViewModifiers } from '../node';
import type { ControlRenderer } from './draw';

/** An unfurled link (Bloom `link-preview`). */
export type LinkPreviewKind = 'linkPreview';

/** What is previewed: the Oxy SDK's `LinkPreview`, as it comes (its url, title, image…). */
export type LinkPreviewData = Pick<
  LinkPreviewCardProps,
  'url' | 'title' | 'description' | 'image' | 'siteName' | 'author'
>;

/** Bloom `LinkPreviewCard`: a cover, the site, the title and the description; a press opens it. */
export interface LinkPreviewView extends ViewModifiers<LinkPreviewView> {
  /** The cover fills the height the card is given, the text a footer under it (a fixed-height row). */
  coverFill(value?: boolean): LinkPreviewView;
}

/** Bloom `LinkPreviewCard` of `preview`; `.onPress()` replaces opening its url. */
export function LinkPreview(preview: LinkPreviewData): LinkPreviewView {
  return new Node('linkPreview', { preview }, []);
}

export const LINK_PREVIEWS: Record<LinkPreviewKind, ControlRenderer> = {
  linkPreview: (d) => {
    const props = d.props();
    Object.assign(props, (d.node.props as { preview: LinkPreviewData }).preview, {
      coverFill: d.own('coverFill')?.value,
    });
    return d.component(BloomLinkPreviewCard, props);
  },
};
