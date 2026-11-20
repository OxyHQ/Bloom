/**
 * A `Header` as Bloom's `PageHeader`: Android and OxyOS, the web, and iOS
 * outside a native stack. On Android a floating header's controls take the
 * lens (Bloom gives its islands the lens material); on the web, Bloom's
 * frosted islands.
 */
import { PageHeader } from '@oxy.so/bloom/page-header';

import type { Child, Node, ScrollOffset } from '../node';
import type { HeaderPresentation, ScrollEdge, TitleDisplay } from '../tokens';
import { valuesOf } from './values';
import type { NodeHostProps } from './host.types';

/** The large title: the ramp's first title step, as Bloom draws a screen's own heading. */
const LARGE_TITLE = 'title-1-bold' as const;

export function readHeader(node: Node) {
  const values = valuesOf(node);
  return {
    title: (node.props as { title?: string }).title,
    display: (values.titleDisplay as TitleDisplay | undefined) ?? 'inline',
    subtitle: values.subtitle as string | undefined,
    toolbar: (values.toolbar as readonly Child[] | undefined) ?? [],
    leading: (values.toolbarLeading as readonly Child[] | undefined) ?? [],
    onBack: values.onBack as (() => void) | null | undefined,
    scrollEdge: values.scrollEdge as ScrollEdge | undefined,
    scrollY: values.scrollY as ScrollOffset | undefined,
    presentation: values.presentation as HeaderPresentation | undefined,
    testID: values.testID as string | undefined,
  };
}

export function PageHeaderHost({ node, render }: NodeHostProps) {
  const header = readHeader(node);
  return (
    <PageHeader
      title={header.title}
      titleVariant={header.display === 'large' ? LARGE_TITLE : undefined}
      subtitle={header.subtitle}
      presentation={header.presentation}
      scrim={header.scrollEdge}
      scrollY={header.scrollY}
      onBack={header.onBack}
      leading={header.leading.length > 0 ? render(header.leading) : undefined}
      actions={header.toolbar.length > 0 ? render(header.toolbar) : undefined}
      testID={header.testID}
    />
  );
}
