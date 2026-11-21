/**
 * A `Command` as Bloom's `Command` palette, on every platform: its
 * `CommandItem` rows its items, a `CommandGroup`'s under that group.
 */
import { Command, type CommandItem, type CommandProps } from '@oxy.so/bloom/command';

import type { IconComponent, Modifier, Node, Press } from '../node';
import { nodesOf, valuesOf } from '../platform/values';
import type { NodeHostProps } from '../platform/host.types';
import { defined } from './defined';

const NOOP = () => {};

function itemOf(node: Node, group: string | undefined, press: NodeHostProps['press']): CommandItem {
  const values = valuesOf(node);
  const { label } = node.props as { label: string };
  const keywords = values.keywords as readonly string[] | undefined;
  return defined({
    id: (values.id as string | undefined) ?? label,
    label,
    description: values.subtitle as string | undefined,
    icon: values.icon as IconComponent | undefined,
    keywords: keywords ? [...keywords] : undefined,
    shortcut: values.shortcut as string | undefined,
    group,
    disabled: values.disabled as boolean | undefined,
    onSelect: press(values.onPress as Press | undefined) ?? NOOP,
  });
}

/** Every command in order: ungrouped ones, and each group's under its title. */
export function commandItems(node: Node, press: NodeHostProps['press']): CommandItem[] {
  const out: CommandItem[] = [];
  for (const row of nodesOf(node.children)) {
    if (row.kind === 'commandItem') out.push(itemOf(row, undefined, press));
    else if (row.kind === 'commandGroup') {
      const { title } = row.props as { title: string };
      for (const item of nodesOf(row.children))
        if (item.kind === 'commandItem') out.push(itemOf(item, title, press));
    }
  }
  return out;
}

export function CommandHost({ node, press }: NodeHostProps) {
  const values = valuesOf(node);
  let query: Extract<Modifier, { kind: 'query' }> | undefined;
  for (const modifier of node.modifiers) if (modifier.kind === 'query') query = modifier;
  const props: CommandProps = defined({
    open: (values.presented as boolean | undefined) ?? false,
    onOpenChange: (values.onPresentedChange as ((open: boolean) => void) | undefined) ?? NOOP,
    items: commandItems(node, press),
    placeholder: values.placeholder as string | undefined,
    emptyText: values.emptyLabel as string | undefined,
    query: query?.value,
    onQueryChange: query?.onChange,
    filter: values.filter as CommandProps['filter'],
    testID: values.testID as string | undefined,
  });
  return <Command {...props} />;
}
