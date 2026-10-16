import { InputSync, sameInInput } from '../input-sync';
import { VALUE_ONLY_MARKS } from '../reconcile';
import { applyTextEdit, segmentsToPlainText } from '../segments';
import type { RichTextChange, Segment, TextSelection } from '../model-types';

/**
 * The native input as far as the sync sees it: what it shows, typing that
 * changes it at once and reports it, and commands (`setValue`,
 * `setSelection`) that land later, after whatever was typed meanwhile, each
 * `setValue` reported when it lands.
 */
class FakeInput {
  shown: Segment[] = [];
  selection: TextSelection = { start: 0, end: 0 };
  private queue: (() => void)[] = [];
  sync!: InputSync;
  readonly changes: RichTextChange[] = [];
  /** The app's value: what the sync last gave it, or what it was given. */
  value: Segment[];

  constructor(initial: Segment[]) {
    this.value = initial;
    this.sync = new InputSync(initial, {
      setValue: (next) =>
        this.queue.push(() => {
          // Only what the input can show reaches it.
          this.shown = next.map((segment) => {
            const shown = { ...segment };
            for (const key of VALUE_ONLY_MARKS) delete shown[key];
            return shown;
          });
          this.report();
        }),
      setSelection: (selection) =>
        this.queue.push(() => {
          this.selection = selection;
        }),
    });
  }

  /** The input loads what it was mounted with. */
  mount(initial: Segment[]): void {
    // A loading state first, as the input reports before its content loads.
    this.shown = [];
    this.report();
    this.shown = initial.map((segment) => ({ text: segment.text }));
    this.report();
  }

  private report(): void {
    const change = this.sync.report(this.shown);
    if (change) {
      this.changes.push(change);
      this.value = change.segments;
    }
  }

  /** The person types at the caret. */
  type(text: string): void {
    const at = this.selection.start;
    this.shown = applyTextEdit(this.shown, { index: at, deleteCount: 0, insert: text });
    this.selection = { start: at + text.length, end: at + text.length };
    this.sync.select(this.selection);
    this.report();
  }

  /** A change from elsewhere, as the app hands it to the sync. */
  remote(index: number, insert: string): void {
    const at = Math.min(index, segmentsToPlainText(this.value).length);
    this.value = applyTextEdit(this.value, { index: at, deleteCount: 0, insert });
    this.sync.update(this.value);
  }

  /** The input works through the commands it was sent. */
  flush(): void {
    while (this.queue.length > 0) this.queue.shift()?.();
  }

  get text(): string {
    return segmentsToPlainText(this.shown);
  }
}

const plain = (text: string): Segment[] => [{ text }];

describe('InputSync', () => {
  it('ignores the input loading, then takes what the person types', () => {
    const input = new FakeInput(plain('hola'));
    input.mount(plain('hola'));
    expect(input.changes).toEqual([]);
    input.selection = { start: 4, end: 4 };
    input.type('!');
    expect(input.changes.map((c) => c.edit)).toEqual([{ index: 4, deleteCount: 0, insert: '!' }]);
    expect(segmentsToPlainText(input.value)).toBe('hola!');
  });

  it('gives the input a change from elsewhere, keeping the caret on the same text', () => {
    const input = new FakeInput(plain('mundo'));
    input.mount(plain('mundo'));
    input.selection = { start: 5, end: 5 };
    input.sync.select(input.selection);
    input.remote(0, 'hola ');
    input.flush();
    expect(input.text).toBe('hola mundo');
    expect(input.selection).toEqual({ start: 10, end: 10 });
    expect(input.changes).toEqual([]);
  });

  it('keeps what the person typed while a change from elsewhere was on its way', () => {
    const input = new FakeInput(plain('ab'));
    input.mount(plain('ab'));
    input.selection = { start: 2, end: 2 };
    input.sync.select(input.selection);
    // Someone else's change is sent to the input...
    input.remote(0, 'X');
    // ...and the person types before it lands.
    input.type('c');
    input.flush();
    expect(input.text).toBe('Xabc');
    expect(segmentsToPlainText(input.value)).toBe('Xabc');
    // The caret stays after what the person typed.
    expect(input.selection).toEqual({ start: 4, end: 4 });
  });

  it('lets the person type in text with marks the input cannot show', () => {
    const coloured: Segment[] = [{ text: 'rojo', color: 'red' }, { text: ' fin' }];
    const input = new FakeInput(coloured);
    input.mount(coloured);
    input.selection = { start: 4, end: 4 };
    input.type('s');
    expect(input.value).toEqual([{ text: 'rojos', color: 'red' }, { text: ' fin' }]);
    // A colour change alone does not touch the input.
    input.sync.update([{ text: 'rojos fin', color: 'blue' }]);
    input.flush();
    expect(input.text).toBe('rojos fin');
  });

  it('never loses a word, however typing and changes from elsewhere interleave', () => {
    let seed = 7;
    const random = () => {
      seed = (seed * 1103515245 + 12345) % 2 ** 31;
      return seed / 2 ** 31;
    };
    for (let run = 0; run < 300; run += 1) {
      const input = new FakeInput(plain('·'));
      input.mount(plain('·'));
      const typed: string[] = [];
      const inserted: string[] = [];
      for (let step = 0; step < 40; step += 1) {
        const roll = random();
        if (roll < 0.45) {
          const length = input.text.length;
          const at = Math.floor(random() * (length + 1));
          input.selection = { start: at, end: at };
          input.sync.select(input.selection);
          const char = String.fromCharCode(97 + (step % 26));
          typed.push(char);
          input.type(char);
        } else if (roll < 0.8) {
          const char = String.fromCharCode(65 + (step % 26));
          inserted.push(char);
          input.remote(Math.floor(random() * 50), char);
        } else {
          input.flush();
        }
      }
      input.flush();
      const final = segmentsToPlainText(input.value);
      expect(input.text).toBe(final);
      expect(sameInInput(input.shown, input.value)).toBe(true);
      const count = (text: string, char: string) => [...text].filter((c) => c === char).length;
      for (const char of new Set([...typed, ...inserted])) {
        const expected =
          typed.filter((c) => c === char).length + inserted.filter((c) => c === char).length;
        expect(count(final, char)).toBe(expected);
      }
    }
  });
});
