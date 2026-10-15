import { segmentsToPlainText } from '@oxy.so/bloom-text/model';
import {
  applyBlockShortcut,
  applyInlineShortcut,
  applyTransaction,
  DEFAULT_SCHEMA,
  detectBlockShortcut,
  documentFromSnapshot,
  filterSlashItems,
  getBlock,
  type SlashItem,
  slashQuery,
  slashTriggerAt,
  validateDocument,
} from '../index';

let n = 0;
const newId = () => `s${++n}`;

describe('block shortcuts', () => {
  const typed = (text: string) =>
    detectBlockShortcut('paragraph', text, {
      index: text.length - 1,
      deleteCount: 0,
      insert: text.slice(-1),
    });

  it.each([
    ['# ', 'heading_1'],
    ['### ', 'heading_3'],
    ['- ', 'bulleted_list_item'],
    ['1. ', 'numbered_list_item'],
    ['[] ', 'todo'],
    ['> ', 'toggle'],
    ['" ', 'quote'],
    ['```', 'code'],
    ['---', 'divider'],
  ])('%j makes a %s', (prefix, type) => {
    expect(typed(prefix)?.type).toBe(type);
  });

  it('fires only at the start of a paragraph', () => {
    expect(
      detectBlockShortcut('heading_1', '# ', { index: 1, deleteCount: 0, insert: ' ' }),
    ).toBeNull();
    expect(typed('a # ')).toBeNull();
  });

  it('turns the paragraph into the type and drops the prefix', () => {
    const doc = documentFromSnapshot([{ type: 'paragraph', text: [{ text: '# Title' }] }], newId);
    const id = doc.root[0] as string;
    const shortcut = detectBlockShortcut('paragraph', '# Title', {
      index: 1,
      deleteCount: 0,
      insert: ' ',
    });
    if (!shortcut) throw new Error('no shortcut');
    const next = applyTransaction(
      doc,
      applyBlockShortcut({ doc, schema: DEFAULT_SCHEMA, newId }, id, shortcut),
    );
    expect(getBlock(next, id).type).toBe('heading_1');
    expect(segmentsToPlainText(getBlock(next, id).text ?? [])).toBe('Title');
  });

  it('makes a divider and keeps the rest of the line below it', () => {
    const doc = documentFromSnapshot([{ type: 'paragraph', text: [{ text: '---' }] }], newId);
    const id = doc.root[0] as string;
    const shortcut = detectBlockShortcut('paragraph', '---', {
      index: 2,
      deleteCount: 0,
      insert: '-',
    });
    if (!shortcut) throw new Error('no shortcut');
    const next = applyTransaction(
      doc,
      applyBlockShortcut({ doc, schema: DEFAULT_SCHEMA, newId }, id, shortcut),
    );
    expect(validateDocument(next)).toEqual([]);
    expect(next.root.map((b) => getBlock(next, b).type)).toEqual(['divider', 'paragraph']);
  });
});

describe('inline shortcuts', () => {
  const close = (text: string) =>
    applyInlineShortcut([{ text }], {
      index: text.length - 1,
      deleteCount: 0,
      insert: text.slice(-1),
    });

  it('bolds **text** and moves the caret past it', () => {
    expect(close('say **hi**')).toEqual({
      segments: [{ text: 'say ' }, { text: 'hi', bold: true }],
      caret: 6,
    });
  });

  it('handles italic, code and strike', () => {
    expect(close('*a*')?.segments).toEqual([{ text: 'a', italic: true }]);
    expect(close('`x`')?.segments).toEqual([{ text: 'x', code: true }]);
    expect(close('~~gone~~')?.segments).toEqual([{ text: 'gone', strike: true }]);
  });

  it('ignores an unmatched or spaced delimiter', () => {
    expect(close('a * b *')).toBeNull();
    expect(close('snake_case_')).toBeNull();
  });
});

describe('slash menu', () => {
  const items: SlashItem[] = [
    {
      id: 'h1',
      label: 'Heading 1',
      keywords: ['title', 'encabezado'],
      group: 'basic',
      action: { kind: 'block', type: 'heading_1' },
    },
    {
      id: 'todo',
      label: 'To-do list',
      keywords: ['check', 'tarea'],
      group: 'basic',
      action: { kind: 'block', type: 'todo' },
    },
    {
      id: 'img',
      label: 'Image',
      keywords: ['photo', 'imagen'],
      group: 'media',
      action: { kind: 'custom', id: 'image' },
    },
  ];

  it('opens on a slash at the start or after a space only', () => {
    expect(slashTriggerAt('/', 0, '/')).toBe(0);
    expect(slashTriggerAt('a /', 2, '/')).toBe(2);
    expect(slashTriggerAt('a/b', 1, '/')).toBeNull();
  });

  it('reads the query and closes on whitespace or a deleted slash', () => {
    expect(slashQuery('/hea', 0, 4)).toBe('hea');
    expect(slashQuery('/he a', 0, 5)).toBeNull();
    expect(slashQuery('hea', 0, 3)).toBeNull();
  });

  it('ranks label prefixes first and matches keywords in any language, ignoring accents', () => {
    expect(filterSlashItems(items, 'ta').map((i) => i.id)).toEqual(['todo']);
    expect(filterSlashItems(items, 'imágen').map((i) => i.id)).toEqual(['img']);
    expect(filterSlashItems(items, 'i').map((i) => i.id)).toEqual(['img', 'h1', 'todo']);
    expect(filterSlashItems(items, '')).toHaveLength(3);
  });
});
