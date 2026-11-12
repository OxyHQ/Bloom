/**
 * A section's title starts where its rows' content does: the glyph, the avatar or, for a
 * title-only row, the label. Alia's "Chats" and Gemies' "Your gemies" stood 8 to the start of
 * their rows, because the title had no inset of its own and the rows carry theirs.
 */
import { render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { Sidebar, type SidebarTree } from '../sidebar';
import { TREE_INSET } from '../sidebar/SidebarTreeSection';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

const avatar = <></>;

const TREE: SidebarTree[] = [
  {
    key: 'agents',
    label: 'Your gemies',
    items: [{ key: 'lumi', label: 'Lumi', description: 'Last line', leading: avatar }],
  },
  { key: 'chats', label: 'Chats', items: [{ key: 'c1', label: 'Launch plan', meta: '2h' }] },
  {
    key: 'projects',
    label: 'Projects',
    actions: <></>,
    items: [{ key: 'p1', label: 'Site', items: [{ key: 'p1c', label: 'Hero copy' }] }],
  },
];

type Node = { props: { style?: unknown } };
const start = (node: Node) => {
  const style = StyleSheet.flatten(node.props.style as never) as Record<string, unknown>;
  return Number(style?.paddingInlineStart ?? 0);
};

it.each([
  { section: 'agents', row: 'lumi', name: 'Lumi, Last line' },
  { section: 'chats', row: 'c1', name: 'Launch plan, 2h' },
  { section: 'projects', row: 'p1', name: 'Site' },
])("the $section title starts at its rows' content edge", ({ section, row, name }) => {
  const view = render(
    <BloomThemeProvider mode="light">
      <Sidebar items={[]} tree={TREE} showSearch={false} showThemeToggle={false} />
    </BloomThemeProvider>,
  );
  const label = view.getByTestId(`sidebar-tree-label-${section}`) as unknown as Node;
  // The row's own inset and its press target's: the content starts after both.
  const line = view.getByTestId(`sidebar-tree-row-${row}`) as unknown as Node;
  const press = view.getByLabelText(name) as unknown as Node;
  expect(start(label)).toBe(TREE_INSET);
  expect(start(line) + start(press)).toBe(TREE_INSET);
});
