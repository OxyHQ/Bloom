import { createElement, type ReactElement } from 'react';
import { act } from 'react-test-renderer';

import { ListItem, VirtualList } from '../controls/list';
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
