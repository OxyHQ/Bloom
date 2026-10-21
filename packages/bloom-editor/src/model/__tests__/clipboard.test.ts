import { canCutAsMarkdown, cutSourceMatches } from '../clipboard';
import { DEFAULT_SCHEMA, extendSchema } from '../schema';
import { type BlockSnapshot, documentFromSnapshot, snapshotToMarkdown } from '../snapshot';

const schema = extendSchema(DEFAULT_SCHEMA, [
  { type: 'image', hasText: false, canHaveChildren: false, props: ['fileId', 'url'] },
]);
const safe = (snapshot: BlockSnapshot[]) =>
  canCutAsMarkdown(snapshot, snapshotToMarkdown(snapshot), schema);

it('allows ordinary paragraphs that the current paste actually reconstructs', () => {
  expect(
    safe([
      { type: 'paragraph', text: [{ text: 'First' }] },
      { type: 'paragraph', text: [{ text: 'Second' }] },
    ]),
  ).toBe(true);
});

it.each<BlockSnapshot>([
  { type: 'image', props: { fileId: 'attachment' } },
  { type: 'paragraph', text: [{ text: 'Important', bold: true }] },
  { type: 'paragraph', text: [{ text: 'Red' }], props: { color: 'red' } },
  { type: 'paragraph', text: [{ text: '# Literal markdown' }] },
  {
    type: 'toggle',
    text: [{ text: 'Parent' }],
    children: [{ type: 'paragraph', text: [{ text: 'Child' }] }],
  },
])('refuses a snapshot whose type, metadata, marks or structure would change: %j', (block) => {
  expect(safe([block])).toBe(false);
});

it('bounds the check before rebuilding a large clipboard document', () => {
  const block = { type: 'paragraph', text: [{ text: 'x' }] };
  expect(safe(Array.from({ length: 2_001 }, () => block))).toBe(false);
  expect(safe([{ type: 'paragraph', text: [{ text: 'x'.repeat(1_000_001) }] }])).toBe(false);
});

it('detects a changed subtree even when its exported text and shape are identical', () => {
  let id = 0;
  const before = documentFromSnapshot(
    [
      {
        type: 'toggle',
        text: [{ text: 'Parent' }],
        children: [{ type: 'paragraph', text: [{ text: 'Child' }] }],
      },
    ],
    () => `b${++id}`,
  );
  const parent = before.root[0];
  if (!parent) throw new Error('Missing parent');
  const child = before.blocks[parent]?.children[0];
  if (!child) throw new Error('Missing child');
  const parentBlock = before.blocks[parent];
  const childBlock = before.blocks[child];
  if (!parentBlock || !childBlock) throw new Error('Missing blocks');
  const current = {
    ...before,
    blocks: {
      ...before.blocks,
      [parent]: { ...parentBlock, children: ['replacement'] },
      replacement: { ...childBlock, id: 'replacement' },
    },
  };
  expect(cutSourceMatches(before, before, [parent])).toBe(true);
  expect(cutSourceMatches(before, current, [parent])).toBe(false);
});
