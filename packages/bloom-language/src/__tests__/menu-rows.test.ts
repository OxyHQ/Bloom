import { useState } from 'react';

import { Button, Divider, Icon, Item, Section, Submenu, menu } from '../primitives';
import { clear } from '../glass';
import {
  menuHandlers,
  pressableTrigger,
  readMenuRows,
  setApart,
  splitTriggerGlass,
} from '../platform/menu-rows';
import type { Node } from '../node';
import { Glyph } from './support/mount';

const PostMenu = menu(function PostMenu(props: { title: string }) {
  return [Item(props.title)];
});
const WithHook = menu(function WithHook() {
  useState(0);
  return Item('x');
});

describe('a menu’s rows as data', () => {
  it('reads items, sections, submenus and dividers, with positional ids', () => {
    const copy = jest.fn();
    const rows = readMenuRows([
      Item('Copy').icon(Glyph).onPress(copy),
      Divider(),
      Section(Item('Pin').checked(true), Item('Delete').destructive().disabled()).title('Post'),
      Submenu('Share', Item('Link').keepOpen()).icon(Glyph),
      false,
      [Item('Mapped')],
    ]);
    expect(rows.map((row) => [row.kind, row.id])).toEqual([
      ['item', 'r0'],
      ['divider', 'r1'],
      ['section', 'r2'],
      ['submenu', 'r3'],
      ['item', 'r4'],
    ]);
    expect(rows[0]).toMatchObject({
      title: 'Copy',
      icon: Glyph,
      checked: undefined,
      onPress: copy,
    });
    const section = rows[2];
    expect(section?.kind === 'section' && section.title).toBe('Post');
    expect(section?.kind === 'section' && section.rows).toMatchObject([
      { id: 'r2.0', title: 'Pin', checked: true },
      { id: 'r2.1', title: 'Delete', destructive: true, disabled: true },
    ]);
    expect(rows[3]).toMatchObject({
      title: 'Share',
      icon: Glyph,
      rows: [{ id: 'r3.0', keepOpen: true }],
    });
    expect(Object.keys(menuHandlers(rows))).toEqual(['r0']);
  });

  it('builds a menu() content by calling its body, which may use hooks', () => {
    expect(readMenuRows([PostMenu({ title: 'Report' })])).toMatchObject([{ title: 'Report' }]);
    // Outside a component the hook throws: the body runs only where the menu is presented.
    expect(() => readMenuRows([WithHook()])).toThrow();
  });

  it('sets a section apart from the rows beside it, never twice beside a divider', () => {
    const rows = readMenuRows([
      Item('a'),
      Section(Item('b')),
      Section(Item('c')),
      Divider(),
      Item('d'),
    ]);
    expect(rows.map((_, index) => setApart(rows, index))).toEqual([
      false,
      true,
      true,
      false,
      false,
    ]);
  });

  it('the trigger keeps its own press and opens the menu after it', () => {
    const order: string[] = [];
    const trigger = pressableTrigger(
      Button(Icon(Glyph)).onPress(() => order.push('own')),
      () => order.push('open'),
    ) as Node;
    const presses = trigger.modifiers.filter((m) => m.kind === 'onPress');
    const press = presses[presses.length - 1];
    (press as { value: (event: never) => void }).value(undefined as never);
    expect(order).toEqual(['own', 'open']);
  });

  it('a trigger on glass hands its glass to the menu', () => {
    const glass = clear.tint('primary');
    const { trigger, glass: taken } = splitTriggerGlass(
      Button(Icon(Glyph)).glass(glass).shape('circle'),
    );
    expect(taken).toBe(glass);
    expect((trigger as Node).modifiers.map((m) => m.kind)).toEqual(['shape']);
  });
});
