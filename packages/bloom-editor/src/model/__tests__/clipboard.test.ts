import { canCutAsMarkdown } from '../clipboard';
import { DEFAULT_SCHEMA, extendSchema } from '../schema';
import { type BlockSnapshot, snapshotToMarkdown } from '../snapshot';

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
