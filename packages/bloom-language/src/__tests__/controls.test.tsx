import { createElement, type ReactElement } from 'react';
import { act } from 'react-test-renderer';

import { ListItem, VirtualList } from '../controls/list';
import { ReviewCard } from '../controls/listings';
import { MenuItemOptions } from '../controls/menu-item';
import type { Child } from '../node';
import { toElement } from '../render';
import { LIGHT, PaintContext } from './support/bloom-theme';
import { mount, only, quietRenderer } from './support/mount';

quietRenderer();

const row = (name: string): Child => ListItem(name);
/** The same tree `mount` draws, for an update. */
const themed = (element: ReactElement) =>
  createElement(PaintContext.Provider, { value: LIGHT }, element);

describe('VirtualList()', () => {
  it('keeps its renderItem while its row function is the same, as a useCallback does', () => {
    const r = mount(toElement(VirtualList(['Ana', 'Rui'], row)));
    const first = only(r, 'VirtualList').props.renderItem;
    act(() => r.update(themed(toElement(VirtualList(['Ana', 'Rui', 'Mia'], row)))));
    const list = only(r, 'VirtualList');
    expect(list.props.renderItem).toBe(first);
    expect(list.props.data).toEqual(['Ana', 'Rui', 'Mia']);
  });

  it('draws each item with the latest row function', () => {
    const r = mount(toElement(VirtualList(['Ana'], row)));
    const other = (name: string): Child => ListItem(`${name}!`);
    act(() => r.update(themed(toElement(VirtualList(['Ana'], other)))));
    const drawn = only(r, 'VirtualList').props.renderItem({ item: 'Ana', index: 0 });
    expect(drawn.props.title).toBe('Ana!');
  });
});

describe('a node’s other editable values', () => {
  it('each is a modifier taking a binding, drawn as Bloom’s value and setter', () => {
    const setExpanded = jest.fn();
    const card = only(
      mount(toElement(ReviewCard('Ana', 'Lovely').expanded([true, setExpanded]))),
      'ReviewCard',
    );
    expect(card.props.expanded).toBe(true);
    card.props.onExpandedChange(false);
    expect(setExpanded).toHaveBeenCalledWith(false);
  });

  it('one not chained draws neither, so Bloom keeps the value itself', () => {
    const card = only(mount(toElement(ReviewCard('Ana', 'Lovely'))), 'ReviewCard');
    expect('expanded' in card.props).toBe(false);
    expect('onExpandedChange' in card.props).toBe(false);
  });

  it('a menu item’s choices are one binding: a group’s new choice writes every group’s', () => {
    const setChosen = jest.fn();
    const groups = [
      { id: 'size', title: 'Size', options: [{ id: 'l', label: 'Large' }] },
      { id: 'extra', title: 'Extras', options: [{ id: 'basil', label: 'Basil' }] },
    ];
    const options = only(
      mount(
        toElement(MenuItemOptions(groups, { total: '€12' }).value([{ size: ['l'] }, setChosen])),
      ),
      'MenuItemOptions',
    );
    expect(options.props.value).toEqual({ size: ['l'] });
    options.props.onValueChange('extra', ['basil']);
    expect(setChosen).toHaveBeenCalledWith({ size: ['l'], extra: ['basil'] });
  });
});
