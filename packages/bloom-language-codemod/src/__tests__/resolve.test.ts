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
    ['text-left', 'physical-edge'],
    ['mx-auto', 'annotated'],
    ['text-sm', 'text-on-view'],
    ['hover:bg-card', 'state-off-pressable'],
    ['group-hover:bg-card', 'variant:group-hover'],
    ['!p-4', 'important'],
    ['not-a-class', 'unknown'],
  ])('keeps %s as JSX (%s)', (className, code) => {
    expect(codes(className)).toContain(code);
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
