/**
 * A `SettingsModal` as Bloom's `SettingsModal`, on every platform: its
 * `SettingsGroup`s its navigation groups, each `SettingsItem` a row that opens
 * its page (built only while the page is shown) or runs its press.
 */
import type { Binding } from '../binding';
import {
  SettingsModal,
  type SettingsModalPage,
  type SettingsModalProps,
  type SettingsNavGroup,
  type SettingsNavItem,
} from '@oxy.so/bloom/settings-modal';

import type { Child, IconComponent, Node, Press } from '../node';
import { nodesOf, valuesOf } from '../platform/values';
import type { NodeHostProps } from '../platform/host.types';
import type { SettingsView } from '../tokens';
import { defined } from './defined';

interface Navigation {
  groups: SettingsNavGroup[];
  pages: Record<string, SettingsModalPage>;
}

/** The settings' groups and pages, from the node's rows. */
export function settingsNavigation(
  node: Node,
  render: NodeHostProps['render'],
  press: NodeHostProps['press'],
): Navigation {
  const pages: Record<string, SettingsModalPage> = {};
  const groups = nodesOf(node.children)
    .filter((row) => row.kind === 'settingsGroup')
    .map((group): SettingsNavGroup => {
      const { label } = group.props as { label: string };
      const items = nodesOf(group.children)
        .filter((row) => row.kind === 'settingsItem')
        .map((item): SettingsNavItem => {
          const values = valuesOf(item);
          const props = item.props as { label: string; icon: IconComponent };
          const key = (values.id as string | undefined) ?? props.label;
          const content = values.content as (() => Child) | undefined;
          if (content) {
            pages[key] = defined({
              title: (values.title as string | undefined) ?? props.label,
              fullBleed: values.fullBleed as boolean | undefined,
              content: () => render(content()),
            });
          }
          return defined({
            key,
            label: props.label,
            icon: props.icon,
            page: content ? key : undefined,
            onPress: press(values.onPress as Press | undefined),
            disabled: values.disabled as boolean | undefined,
          });
        });
      return defined({ key: valuesOf(group).id as string | undefined, label, items });
    });
  return { groups, pages };
}

export function SettingsHost({ node, render, press }: NodeHostProps) {
  const values = valuesOf(node);
  const { groups, pages } = settingsNavigation(node, render, press);
  const presented = values.presented as Binding<boolean> | undefined;
  const props: SettingsModalProps = defined({
    groups,
    pages,
    open: presented?.[0] ?? false,
    onClose: presented ? () => presented[1](false) : undefined,
    page: values.selection as string | undefined,
    onPageChange: values.onSelect as ((page: string) => void) | undefined,
    initialView: values.initialView as SettingsView | undefined,
    headerPresentation: values.presentation as SettingsModalProps['headerPresentation'],
    testID: values.testID as string | undefined,
  });
  return <SettingsModal {...props} />;
}
