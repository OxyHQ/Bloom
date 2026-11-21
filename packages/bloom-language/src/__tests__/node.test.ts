import { HStack, Text, VStack, Spacer, Icon } from '../primitives';
import { Node } from '../node';

const Glyph = () => null;

describe('a chain is immutable data', () => {
  it('returns a new node per modifier and leaves the node it was called on unchanged', () => {
    const base = Text('hello');
    const padded = base.padding('md');
    const tinted = padded.foreground('muted');
    expect(base.modifiers).toEqual([]);
    expect(padded.modifiers.map((m) => m.key)).toEqual(['p:all:md']);
    expect(tinted.modifiers.map((m) => m.key)).toEqual(['p:all:md', 'fg:muted']);
    expect(tinted).not.toBe(padded);
    expect(tinted).toBeInstanceOf(Node);
  });

  it('keeps modifiers in the order they were chained', () => {
    const a = Text('x').padding('md').background('surface');
    const b = Text('x').background('surface').padding('md');
    expect(a.modifiers.map((m) => m.kind)).toEqual(['padding', 'background']);
    expect(b.modifiers.map((m) => m.kind)).toEqual(['background', 'padding']);
  });

  it('shares one modifier list between branches without either seeing the other', () => {
    const base = HStack().spacing('sm');
    const left = base.padding('leading', 'md');
    const right = base.padding('trailing', 'md');
    expect(left.modifiers.map((m) => m.key)).toEqual(['gap:sm', 'p:leading:md']);
    expect(right.modifiers.map((m) => m.key)).toEqual(['gap:sm', 'p:trailing:md']);
  });

  it('holds children, conditionals and arrays as given', () => {
    const items = ['a', 'b'];
    const tree = VStack(
      Text('title'),
      false,
      null,
      items.map((item) => Text(item).id(item)),
      Spacer(),
      Icon(Glyph),
    );
    expect(tree.kind).toBe('stack');
    expect(tree.children).toHaveLength(6);
    expect(tree.children[1]).toBe(false);
    expect(Array.isArray(tree.children[3])).toBe(true);
  });
});

describe('the typed vocabulary', () => {
  it('rejects raw values and modifiers a kind does not take', () => {
    // These lines are the test: each must be a type error. `tsc` fails the
    // package typecheck if any of them compiles.
    // @ts-expect-error a raw number is not a space token
    Text('x').padding(12);
    // @ts-expect-error a hex is not a colour role
    Text('x').foreground('#ff0000');
    // @ts-expect-error a stack has no line limit
    HStack().lines(2);
    // @ts-expect-error a text has no spacing
    Text('x').spacing('sm');
    // @ts-expect-error a string is not a container child
    HStack('loose text');
    // @ts-expect-error `count && Text(count)` leaves 0 in the tree; write `count ? Text(count) : null`
    HStack(0 && Text('0'));
    // @ts-expect-error a delay is one of Bloom's durations; no app writes Tailwind's delay-1000
    Text('x').delay('1000');
    expect(true).toBe(true);
  });
});
