import { resolveHeaderActionLayout } from '../page-header/action-layout';
import type { HeaderAction } from '../page-header/types';
import { RiSearchLine } from '../icons/remix/RiSearchLine';

const action = (id: string, props: Partial<HeaderAction> = {}): HeaderAction => ({
  id,
  label: id,
  icon: RiSearchLine,
  onPress: jest.fn(),
  ...props,
});
const measured = (actions: readonly HeaderAction[]) =>
  new Map(actions.map(({ id }) => [id, { full: 90, compact: 44 }]));

it('retains essential stop/close and higher-priority commands before optional actions', () => {
  const actions = [
    action('share'),
    action('stop', { essential: true, priority: -10 }),
    action('save', { priority: 10 }),
    action('close', { overflow: 'never' }),
  ];
  const layout = resolveHeaderActionLayout(actions, measured(actions), 132, 44);
  expect(layout.inline).toEqual(['stop', 'close']);
  expect(layout.overflow).toEqual(['share', 'save']);
  expect(layout.requiredWidth).toBe(132);
});

it('collapses labels before moving commands and keeps their original order', () => {
  const actions = [action('first'), action('second')];
  expect(resolveHeaderActionLayout(actions, measured(actions), 134, 44)).toEqual({
    inline: ['first', 'second'],
    compact: ['second'],
    overflow: [],
    requiredWidth: 134,
  });
  expect(resolveHeaderActionLayout(actions, measured(actions), 88, 44).compact).toEqual([
    'first',
    'second',
  ]);
});

it('accounts for the overflow trigger and gaps rather than overfilling the row', () => {
  const actions = [action('first'), action('second'), action('third')];
  const layout = resolveHeaderActionLayout(actions, measured(actions), 100, 44, 8);
  expect(layout.inline).toEqual(['first']);
  expect(layout.overflow).toEqual(['second', 'third']);
  expect(layout.requiredWidth).toBe(96);
});

it('keeps a text-only action named and refuses to hide essentials in an impossible width', () => {
  const actions = [action('stop', { icon: undefined, essential: true, overflow: 'always' })];
  const layout = resolveHeaderActionLayout(actions, measured(actions), 10, 44);
  expect(layout.inline).toEqual(['stop']);
  expect(layout.compact).toEqual([]);
  expect(layout.overflow).toEqual([]);
  expect(layout.requiredWidth).toBe(90);
});

it('is independent of translated labels, busy/selected/disabled and group metadata', () => {
  const actions = [action('a', { group: 'edit' }), action('b', { group: 'edit' })];
  const changed = actions.map((item) => ({
    ...item,
    label: 'Same translated label',
    busy: true,
    disabled: true,
    selected: true,
  }));
  expect(resolveHeaderActionLayout(changed, measured(actions), 88, 44)).toEqual(
    resolveHeaderActionLayout(actions, measured(actions), 88, 44),
  );
});

it('excludes explicitly invisible actions and keeps always-overflow commands out of the row', () => {
  const actions = [action('hidden', { visible: false }), action('menu', { overflow: 'always' })];
  expect(resolveHeaderActionLayout(actions, measured(actions), 500, 44)).toEqual({
    inline: [],
    compact: [],
    overflow: ['menu'],
    requiredWidth: 44,
  });
});

it('requires stable distinct IDs and accessible names without using labels as keys', () => {
  expect(() => resolveHeaderActionLayout([action('x'), action('x')], new Map(), 100, 44)).toThrow(
    'unique nonempty IDs',
  );
  expect(() =>
    resolveHeaderActionLayout([action('x', { label: ' ' })], new Map(), 100, 44),
  ).toThrow('requires a label');
});
