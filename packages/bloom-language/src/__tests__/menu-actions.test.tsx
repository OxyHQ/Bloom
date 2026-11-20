/**
 * Tagged rows: plain data until one is chosen, when the menu's actions()
 * body runs (once, for that choice) and the tag's action with it. Each
 * platform's menu, against its stand-ins.
 */
import { createElement, type ReactNode } from 'react';
import { RiDeleteBinLine } from '@oxy.so/bloom/icons/RiDeleteBinLine';
import { RiLinkM } from '@oxy.so/bloom/icons/RiLinkM';

import { act, Glyph, hosts, mount, only, quietRenderer } from './support/mount';
import { actions, Button, Icon, Item, Menu, menu, Section } from '../primitives';
import { toElement } from '../render';

const host = (name: string) => (props: { children?: ReactNode }) =>
  createElement(name, props, props.children);

jest.mock('@expo/ui/swift-ui', () => ({
  Host: host('Host'),
  Menu: (props: { label: ReactNode; children?: ReactNode }) =>
    createElement('SwiftMenu', props, props.label, props.children),
  Button: 'SwiftButton',
  Toggle: 'SwiftToggle',
  Section: host('SwiftSection'),
  Divider: 'SwiftDivider',
  RNHostView: host('RNHostView'),
}));
jest.mock('@expo/ui/swift-ui/modifiers', () => ({
  disabled: (value?: boolean) => ({ disabled: value }),
  menuActionDismissBehavior: (value: string) => ({ dismiss: value }),
}));

quietRenderer();

/** The post's actions: a hook-bearing body, counted. */
function postActions() {
  const built = jest.fn();
  const copy = jest.fn();
  const remove = jest.fn();
  const PostActions = actions(function postActionsBody(props: { id: string }) {
    built(props.id);
    return { copy: () => copy(props.id), delete: () => remove(props.id) };
  });
  return { built, copy, remove, PostActions };
}

const trigger = Button(Icon(Glyph)).style('plain').shape('circle').label('More');

function rows() {
  return [
    Item('Copy link').icon(RiLinkM).tag('copy'),
    Section(Item('Delete').icon(RiDeleteBinLine).destructive().tag('delete')),
    Item('Report').icon(Glyph).tag('report'),
  ];
}

describe('iOS: tagged rows are the system menu', () => {
  it('rows are SwiftUI buttons with their icons’ SF Symbols; an icon with none draws no glyph', () => {
    const { built, PostActions } = postActions();
    const r = mount(toElement(Menu(trigger, ...rows()).actions(PostActions({ id: 'p1' }))));
    expect(hosts(r, 'DropdownMenu')).toHaveLength(0);
    const buttons = hosts(r, 'SwiftButton');
    expect(buttons.map((button) => [button.props.label, button.props.systemImage])).toEqual([
      ['Copy link', 'link'],
      ['Delete', 'trash'],
      ['Report', undefined],
    ]);
    expect(built).not.toHaveBeenCalled();
  });

  it('choosing a row runs its tag’s action once, through the actions body', () => {
    const { built, copy, remove, PostActions } = postActions();
    const r = mount(toElement(Menu(trigger, ...rows()).actions(PostActions({ id: 'p1' }))));
    const copyRow = hosts(r, 'SwiftButton').find((button) => button.props.label === 'Copy link');
    act(() => copyRow?.props.onPress());
    expect(copy).toHaveBeenCalledWith('p1');
    expect(copy).toHaveBeenCalledTimes(1);
    expect(remove).not.toHaveBeenCalled();
    expect(built).toHaveBeenCalledTimes(1);
    // The choice's component has left: a re-render builds nothing.
    act(() => r.update(toElement(Menu(trigger, ...rows()).actions(PostActions({ id: 'p1' })))));
    expect(built).toHaveBeenCalledTimes(1);
  });

  it('a menu() content is still built only while open: Bloom’s menu', () => {
    const Rows = menu(() => [Item('Copy')]);
    const r = mount(toElement(Menu(trigger, Rows())));
    expect(hosts(r, 'SwiftMenu')).toHaveLength(0);
    expect(only(r, 'DropdownMenu')).toBeTruthy();
  });
});
