import { resolveClassName, splitVariants } from '../resolve';
import { chainOf, loadTable } from '../table';

const table = loadTable();

const codes = (className: string, kind: 'view' | 'pressable' | 'text' = 'view') => {
  const result = resolveClassName(className, kind, table);
  return result.ok ? [] : result.reasons.map((r) => r.code);
};

describe('the table as modifiers', () => {
  it('reads a chain of literal modifiers', () => {
    expect(chainOf(".frame({ width: 'full' }).padding('horizontal', 'lg')")).toEqual([
      { name: 'frame', args: [{ width: 'full' }] },
      { name: 'padding', args: ['horizontal', 'lg'] },
    ]);
  });
  it('reads nothing from words or placeholders', () => {
    expect(chainOf(".border(role, 'thin')")).toBeNull();
    expect(chainOf(".padding('top', 'sm') (outside the fill)")).toBeNull();
  });
});

describe('resolveClassName', () => {
  it('writes the layers in the language’s order, so the view stays one host', () => {
    const result = resolveClassName(
      'rounded-2xl overflow-hidden bg-surface p-4 flex-row',
      'view',
      table,
    );
    expect(result.ok && result.value.axis).toBe('row');
    expect(result.ok && result.value.mods.map((m) => m.name)).toEqual([
      'padding',
      'background',
      'corner',
      'clipped',
    ]);
  });
  it('maps margins, physical sides and flex exactly', () => {
    const result = resolveClassName('flex-1 mt-2 pl-4 pr-2', 'view', table);
    expect(result.ok && result.value.mods.map((m) => [m.name, ...m.args])).toEqual([
      ['padding', 'left', 'lg'],
      ['padding', 'right', 'sm'],
      ['flex', '1'],
      ['margin', 'top', 'sm'],
    ]);
  });
  it('joins a border width and its colour', () => {
    const result = resolveClassName('border-b border-border', 'view', table);
    expect(result.ok && result.value.mods).toEqual([
      { name: 'border', args: ['border', 'thin', 'bottom'] },
    ]);
  });
  it('maps a colour at an opacity, a fixed one too, but not under a live condition', () => {
    expect(codes('bg-primary/10 border-border/60 border')).toEqual([]);
    expect(codes('text-white/70', 'text')).toEqual([]);
    expect(codes('web:bg-primary/10')).toEqual([]);
    expect(codes('dark:bg-primary/10')).toEqual(['measured-difference']);
    expect(codes('hover:bg-primary/10', 'pressable')).toEqual(['measured-difference']);
  });
  it('maps a leading from a ratio of a size the text sets, and keeps one of no size', () => {
    expect(codes('text-sm leading-snug', 'text')).toEqual([]);
    expect(codes('leading-snug', 'text')).toEqual(['unsized-ratio']);
  });
  it('turns variants into when() conditions', () => {
    const result = resolveClassName('p-2 md:p-4 dark:bg-card', 'view', table);
    expect(result.ok && result.value.variants.map((v) => v.conditions)).toEqual([['md'], ['dark']]);
  });
  it('splits variants outside brackets', () => {
    expect(splitVariants('md:hover:w-[calc(1px:2)]')).toEqual({
      variants: ['md', 'hover'],
      utility: 'w-[calc(1px:2)]',
    });
  });
  it.each([
    ['border', 'border'],
    ['p-4 px-2', 'padding-overlap'],
    ['px-2 pl-4', 'padding-overlap'],
    ['mt-2 my-2', 'margin-overlap'],
    ['bg-card bg-surface', 'conflict'],
    ['rounded-t-3xl rounded-tl-lg', 'corner-overlap'],
    ['rounded-l-full rounded-tl-lg', 'corner-overlap'],
    ['md:truncate', 'not-varied'],
    ['mx-auto', 'annotated'],
    ['text-sm', 'text-on-view'],
    ['hover:bg-card', 'state-off-pressable'],
    ['group-hover:bg-card', 'variant:group-hover'],
    ['!p-4', 'important'],
    ['not-a-class', 'unknown'],
  ])('keeps %s as JSX (%s)', (className, code) => {
    expect(codes(className)).toContain(code);
  });
  it('maps physical corners, an infinite corner and a child spacing exactly', () => {
    const result = resolveClassName('rounded-l-full rounded-br-lg space-y-2', 'view', table);
    expect(result.ok && result.value.mods.map((m) => [m.name, ...m.args])).toEqual([
      ['corner', 'infinite', 'left'],
      ['corner', 'sm', 'bottom-right'],
      ['childSpacing', 'vertical', 'sm'],
    ]);
  });
  it('keeps what no variant changes under a platform, and tabular-nums on the web only', () => {
    const result = resolveClassName('web:whitespace-nowrap tabular-nums', 'text', table);
    expect(result.ok && result.value.variants).toEqual([
      {
        conditions: ['web'],
        mods: [
          { name: 'noWrap', args: [] },
          { name: 'monospacedDigit', args: [] },
        ],
      },
    ]);
  });
  it('takes a state variant on a Pressable', () => {
    expect(codes('active:opacity-70', 'pressable')).toEqual([]);
  });
  it('keeps a class the app’s theme redraws', () => {
    const result = resolveClassName('rounded-lg overflow-hidden', 'view', table, {
      overridden: new Set(['rounded-lg']),
    });
    expect(result.ok ? [] : result.reasons.map((r) => r.code)).toEqual(['app-theme']);
  });
});
