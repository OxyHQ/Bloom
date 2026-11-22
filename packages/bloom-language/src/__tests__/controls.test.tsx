import { createElement, type ReactElement } from 'react';
import { act } from 'react-test-renderer';

import { HoverCard } from '../controls/hover-card';
import { ListItem, VirtualList } from '../controls/list';
import { ReviewCard } from '../controls/listings';
import { SignaturePad } from '../controls/logistics';
import { MenuItemOptions } from '../controls/menu-item';
import { Notification } from '../controls/notification';
import { Tooltip } from '../controls/tooltip';
import type { Child } from '../node';
import { Text } from '../primitives';
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

describe('a component’s waits are duration tokens', () => {
  it('each is Bloom’s milliseconds, its own default named by its value', () => {
    const card = only(
      mount(toElement(HoverCard(Text('@ana'), Text('Ana')).openDelay('400').closeDelay('fast'))),
      'HoverCard',
    );
    expect(card.props.openDelay).toBe(400);
    expect(card.props.closeDelay).toBe(150);
    const tooltip = only(
      mount(
        toElement(
          Tooltip(Text('i'), 'About')
            .presented([false, () => {}])
            .openDelay('1000'),
        ),
      ),
      'Tooltip',
    );
    expect(tooltip.props.delay).toBe(1000);
  });

  it('none chained hands Bloom none, so its own waits hold', () => {
    const card = only(mount(toElement(HoverCard(Text('@ana'), Text('Ana')))), 'HoverCard');
    expect(card.props.openDelay).toBeUndefined();
    expect(card.props.closeDelay).toBeUndefined();
  });

  it('a notification’s entrance wait is in Bloom’s seconds, divided exactly', () => {
    const notification = only(
      mount(toElement(Notification('Copied').autoDismiss('4000').introDelay('normal'))),
      'Notification',
    );
    expect(notification.props.autoDismissDuration).toBe(4000);
    expect(notification.props.introDelay).toBe(0.2);
    const atOnce = only(mount(toElement(Notification('Copied').introDelay('0'))), 'Notification');
    expect(atOnce.props.introDelay).toBe(0);
  });
});

describe('a signature’s stroke', () => {
  it('is a border width token, as a shape’s outline is: Bloom’s own width by its value', () => {
    const pad = (width?: 'thick' | '2.5') =>
      only(
        mount(toElement(width === undefined ? SignaturePad() : SignaturePad().strokeWidth(width))),
        'SignaturePad',
      ).props;
    expect(pad('2.5').strokeWidth).toBe(2.5);
    expect(pad('thick').strokeWidth).toBe(2);
    expect(pad().strokeWidth).toBeUndefined();
  });
});
