/**
 * `struct X: MenuActions` and `struct X: MenuContent` are the embedded language's `actions()` and
 * `menu()` nodes: a body the menu runs, with its props, giving the tag → action table or the rows.
 */
interface MenuActionsProps {
  readonly body: (props: object) => Readonly<Record<string, (() => void) | undefined>>;
  readonly props: object;
}
interface MenuContentProps {
  readonly body: (props: object) => unknown;
  readonly props: object;
}
interface MenuNode<P> {
  readonly kind: string;
  readonly props: P;
}

// Required, not imported: see bloom.cost.test.tsx.
const { RowActions, RowMenu } = require('./bloom/menus.bloom') as {
  RowActions: (props: { id: string; onOpen: (id: string) => void }) => MenuNode<MenuActionsProps>;
  RowMenu: (props: { choices: { id: string; label: string }[] }) => MenuNode<MenuContentProps>;
};

it("is the actions() node, whose body gives each tag's action", () => {
  const opened: string[] = [];
  const node = RowActions({ id: 'p1', onOpen: (id) => opened.push(id) });
  expect(node.kind).toBe('menuActions');
  const table = node.props.body(node.props.props);
  expect(Object.keys(table)).toEqual(['open']);
  table.open?.();
  expect(opened).toEqual(['p1']);
});

it('is the menu() node, whose body gives the rows (a `for` is a nested list, as a menu reads it)', () => {
  const node = RowMenu({ choices: [{ id: 'a', label: 'A' }] });
  expect(node.kind).toBe('menuContent');
  const rows = node.props.body(node.props.props) as readonly (
    | MenuNode<unknown>
    | readonly MenuNode<unknown>[]
  )[];
  expect(rows.flat().map((row) => row.kind)).toEqual(['menuItem', 'menuItem']);
});
