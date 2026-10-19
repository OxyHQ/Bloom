import { type BlockSnapshot, DEFAULT_SCHEMA, documentFromSnapshot, EditorStore } from '../../model';
import {
  clearBlockSelection,
  extendBlockSelection,
  selectBlocks,
  stepBlockSelection,
} from '../block-selection';
import { UiStore } from '../ui-store';

const p = (id: string, children?: BlockSnapshot[]): BlockSnapshot => ({
  type: 'paragraph',
  text: [{ text: id }],
  ...(children && { children }),
});

function setup() {
  const blocks = [p('A', [p('A1')]), p('B'), p('C')];
  const ids = ['A', 'A1', 'B', 'C'];
  let i = 0;
  const store = new EditorStore({
    document: documentFromSnapshot(blocks, () => ids[i++] as string),
    schema: DEFAULT_SCHEMA,
    newId: () => 'n',
  });
  return { store, ui: new UiStore() };
}

describe('block selection', () => {
  it('extends from the block being edited to the one Shift-clicked', () => {
    const { store, ui } = setup();
    expect(extendBlockSelection(store, ui, 'C')).toBe(false);
    ui.set({ focused: 'A1' });
    expect(extendBlockSelection(store, ui, 'C')).toBe(true);
    expect(ui.get()).toMatchObject({
      selectedBlocks: ['A', 'B', 'C'],
      selectionAnchor: 'A1',
      selectionHead: 'C',
    });
    // From a selection, its anchor stays where it began.
    extendBlockSelection(store, ui, 'B');
    expect(ui.get().selectedBlocks).toEqual(['A', 'B']);
  });

  it('moves with arrows, and grows and shrinks with Shift', () => {
    const { store, ui } = setup();
    selectBlocks(ui, ['B']);
    stepBlockSelection(store, ui, 'down', true);
    expect(ui.get().selectedBlocks).toEqual(['B', 'C']);
    stepBlockSelection(store, ui, 'up', true);
    expect(ui.get().selectedBlocks).toEqual(['B']);
    stepBlockSelection(store, ui, 'up', true);
    // The head in A's children takes the range up to A.
    expect(ui.get().selectedBlocks).toEqual(['A', 'B']);
    stepBlockSelection(store, ui, 'down', false);
    expect(ui.get().selectedBlocks).toEqual(['C']);
    expect(stepBlockSelection(store, ui, 'down', false)).toBe(false);
    clearBlockSelection(ui);
    expect(ui.get()).toMatchObject({
      selectedBlocks: [],
      selectionAnchor: null,
      selectionHead: null,
    });
  });
});
