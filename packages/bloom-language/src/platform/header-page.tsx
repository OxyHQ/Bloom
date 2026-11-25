/**
 * A `Header` as Bloom's `PageHeader`: Android and OxyOS, the web, and iOS
 * outside a native stack (or `.inPage()`). On Android a floating header's
 * controls take the lens (Bloom gives its islands the lens material); on the
 * web, Bloom's frosted islands.
 */
import type { ComponentType } from 'react';
import { PageHeader } from '@oxy.so/bloom/page-header';

import { type Child, type HeadingLevel, isNode, type Node, type ScrollOffset } from '../node';
import { drawLeaf, type Paint, paintedLeaf } from '../paint';
import { isAppColor, role } from '../style';
import type {
  AppToken,
  ColorToken,
  HeaderPresentation,
  HeaderTone,
  ScrimFalloff,
  ScrollEdge,
  TitleAlign,
  TitleDisplay,
  TitleReveal,
} from '../tokens';
import { valuesOf } from './values';
import type { NodeHostProps } from './host.types';

/** The large title: the ramp's first title step, as Bloom draws a screen's own heading. */
const LARGE_TITLE = 'title-1-bold' as const;

export function readHeader(node: Node) {
  const values = valuesOf(node);
  return {
    title: (node.props as { title?: string | Node }).title,
    display: (values.titleDisplay as TitleDisplay | undefined) ?? 'inline',
    subtitle: values.subtitle as string | Node | undefined,
    toolbar: (values.toolbar as readonly Child[] | undefined) ?? [],
    leading: (values.toolbarLeading as readonly Child[] | undefined) ?? [],
    onBack: values.onBack as (() => void) | null | undefined,
    backLabel: values.backLabel as string | undefined,
    headingLevel: values.headingLevel as HeadingLevel | undefined,
    scrollEdge: values.scrollEdge as ScrollEdge | undefined,
    scrollY: values.scrollY as ScrollOffset | undefined,
    presentation: values.presentation as HeaderPresentation | undefined,
    testID: values.testID as string | undefined,
    inPage: values.inPage as boolean | undefined,
    safeArea: values.safeArea as boolean | undefined,
    titleAlign: values.titleAlign as TitleAlign | undefined,
    accessory: values.accessory as Child | undefined,
    tone: values.tone as HeaderTone | undefined,
    scrimColor: values.scrimColor as ColorToken | AppToken<'color'> | undefined,
    scrimFalloff: values.scrimFalloff as ScrimFalloff | undefined,
    titleReveal: values.titleReveal as TitleReveal | undefined,
  };
}

/** `PageHeader` as a painted host (which types its host's props loosely). */
const PAINTED_HEADER = PageHeader as unknown as ComponentType<Record<string, unknown>>;

const scrimPaints = new Map<ColorToken, Paint>();

/** A scrim colour painted from its role, from the theme: one paint per token. */
function scrimPaint(color: ColorToken): Paint {
  let paint = scrimPaints.get(color);
  if (paint === undefined) {
    const { role: name, opacity } = role(color);
    paint = {
      style: undefined,
      styleRoles: [],
      propRoles: [opacity === undefined ? ['scrimColor', name] : ['scrimColor', name, opacity]],
    };
    scrimPaints.set(color, paint);
  }
  return paint;
}

export function PageHeaderHost({ node, render, palette }: NodeHostProps) {
  const header = readHeader(node);
  const props = {
    // A title or subtitle that is a view is drawn in its place as it is.
    title: isNode(header.title) ? render(header.title) : header.title,
    titleVariant: header.display === 'large' ? LARGE_TITLE : undefined,
    subtitle: isNode(header.subtitle) ? render(header.subtitle) : header.subtitle,
    presentation: header.presentation,
    scrim: header.scrollEdge,
    scrollY: header.scrollY,
    onBack: header.onBack,
    backLabel: header.backLabel,
    headingLevel: header.headingLevel,
    leading: header.leading.length > 0 ? render(header.leading) : undefined,
    actions: header.toolbar.length > 0 ? render(header.toolbar) : undefined,
    safeArea: header.safeArea,
    titleAlign: header.titleAlign,
    accessory: header.accessory === undefined ? undefined : render(header.accessory),
    tone: header.tone,
    scrimFalloff: header.scrimFalloff,
    titleReveal: header.titleReveal,
    testID: header.testID,
  };
  // An app's own colour is the scrim's as written, in both schemes.
  if (isAppColor(header.scrimColor))
    return <PageHeader {...props} scrimColor={header.scrimColor.value} />;
  if (header.scrimColor !== undefined) {
    return drawLeaf(
      paintedLeaf(palette, {
        ...props,
        host: PAINTED_HEADER,
        paint: scrimPaint(header.scrimColor),
      }),
    );
  }
  return <PageHeader {...props} />;
}
