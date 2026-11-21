/**
 * A `Rail` as Bloom's `Rail`, on every platform: each `RailItem` an item, its
 * glyphs the views the app gave it, drawn where the rail is.
 */
import { Rail, type RailItem, type RailProps } from '@oxy.so/bloom/rail';

import type { Child, Node, ViewNode } from '../node';
import { nodesOf, valuesOf } from '../platform/values';
import type { NodeHostProps } from '../platform/host.types';
import { resolveSpace, type SpaceToken } from '../tokens';
import { defined } from './defined';

const NOOP = () => {};

function itemOf(node: Node, render: NodeHostProps['render']): RailItem {
  const values = valuesOf(node);
  const { label, icon } = node.props as { label: string; icon: ViewNode };
  const active = values.activeIcon as ViewNode | undefined;
  return defined({
    id: (values.id as string | undefined) ?? label,
    label,
    icon: render(icon),
    activeIcon: active ? render(active) : undefined,
  });
}

export function RailHost({ node, render }: NodeHostProps) {
  const values = valuesOf(node);
  const width = values.width as SpaceToken | undefined;
  const header = values.header as ViewNode | undefined;
  let footer: Child;
  for (const modifier of node.modifiers) if (modifier.kind === 'footer') footer = modifier.content;
  const props: RailProps = defined({
    items: nodesOf(node.children)
      .filter((child) => child.kind === 'railItem')
      .map((item) => itemOf(item, render)),
    onSelect: (values.onSelect as ((id: string) => void) | undefined) ?? NOOP,
    activeId: values.selection as string | undefined,
    width: width === undefined ? undefined : resolveSpace(width),
    header: header ? render(header) : undefined,
    footer: footer ? render(footer) : undefined,
    testID: values.testID as string | undefined,
  });
  return <Rail {...props} />;
}
