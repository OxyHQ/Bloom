import { act } from 'react-test-renderer';

import {
  Admonition,
  Card,
  CardTitle,
  Chip,
  EmptyState,
  ErrorBoundary,
  GroupedSection,
  GroupedSectionItem,
  Row,
  SelectionCard,
  TabItem,
  Tabs,
} from '../controls/containers';
import { Button, Icon, Text, VStack } from '../primitives';
import { EnvContext, navigatorEnv } from '../env';
import { navigate as navigateTo } from '../router/nodes';
import { createElement } from 'react';
import { toElement } from '../render';
import { RiAddLine } from '@oxy.so/bloom/icons/RiAddLine';
import { hosts, mount, only, quietRenderer } from './support/mount';

quietRenderer();

describe('containers', () => {
  it('a card takes its appearance, its corner and its press as Bloom’s Card props', () => {
    const onPress = jest.fn();
    const card = only(
      mount(
        toElement(
          Card(CardTitle('Plan').lines(1))
            .style('outline')
            .radius('radius-16')
            .elevation('none')
            .padding('md')
            .onPress(onPress),
        ),
      ),
      'Card',
    );
    expect(card.props).toMatchObject({
      appearance: 'outline',
      radius: 'radius-16',
      elevation: 'none',
    });
    expect(card.props.style).toMatchObject({ paddingTop: 12, paddingStart: 12 });
    card.props.onPress();
    expect(onPress).toHaveBeenCalled();
  });

  it('tabs read and write their selection through the binding', () => {
    const set = jest.fn();
    const renderer = mount(
      toElement(Tabs(['a', set], TabItem('a', 'All'), TabItem('b', 'Mine').count(2))),
    );
    const tabs = only(renderer, 'Tabs');
    expect(tabs.props.value).toBe('a');
    act(() => tabs.props.onValueChange('b'));
    expect(set).toHaveBeenCalledWith('b');
    expect(hosts(renderer, 'TabsTrigger').map((t) => t.props.count)).toEqual([undefined, 2]);
  });

  it('a chip toggles through its binding, its glyph before the label', () => {
    const set = jest.fn();
    const chip = only(
      mount(toElement(Chip(Icon(RiAddLine), Text('Open')).toggle([true, set]))),
      'Chip',
    );
    expect(chip.props).toMatchObject({ checked: true, leadingIcon: RiAddLine, children: 'Open' });
    chip.props.onCheckedChange(false);
    expect(set).toHaveBeenCalledWith(false);
  });

  it('an empty state’s action is its Button: label, glyph, press and state', () => {
    const retry = jest.fn();
    const state = only(
      mount(
        toElement(
          EmptyState('Nothing here').action(
            Button(Icon(RiAddLine), Text('Retry')).disabled().onPress(retry),
          ),
        ),
      ),
      'EmptyState',
    );
    expect(state.props.action).toMatchObject({ label: 'Retry', icon: RiAddLine, disabled: true });
    state.props.action.onPress();
    expect(retry).toHaveBeenCalled();
  });

  it('a row and a grouped item draw their slots as language views', () => {
    const renderer = mount(
      toElement(
        GroupedSection(
          GroupedSectionItem('Wi-Fi').value('Home').chevron(),
          Row('Ana').subtitle('Online').leadingView(Icon(RiAddLine)),
        ).title('Network'),
      ),
    );
    expect(only(renderer, 'GroupedSection').props.title).toBe('Network');
    expect(only(renderer, 'GroupedSectionItem').props).toMatchObject({
      title: 'Wi-Fi',
      value: 'Home',
      showChevron: true,
    });
    expect(only(renderer, 'Item').props.leading).toBeTruthy();
  });

  it('an admonition’s text is its words, inside Bloom’s own parts', () => {
    const renderer = mount(toElement(Admonition(Text('Saved.')).style('tip')));
    expect(only(renderer, 'AdmonitionRoot').props.type).toBe('tip');
    expect(only(renderer, 'AdmonitionText').props.children).toBe('Saved.');
  });

  it('an empty state’s actions and suggestions take a navigate() through the screen’s navigator', () => {
    const navigate = jest.fn();
    const renderer = mount(
      createElement(
        EnvContext.Provider,
        { value: navigatorEnv(navigate) },
        toElement(
          EmptyState('No posts', Text('Follow someone to fill it.'))
            .action(Button(Text('Explore')).onPress(navigateTo('/explore')))
            .suggestions(
              Button(Icon(RiAddLine), Text('Invite')).id('invite').onPress(navigateTo('/invite')),
            )
            .illustration(Text('Art'))
            .caption(Text('Or wait')),
        ),
      ),
    );
    const state = only(renderer, 'EmptyState');
    act(() => state.props.action.onPress());
    expect(navigate).toHaveBeenCalledWith('/explore', undefined);
    expect(state.props.suggestions).toMatchObject([
      { id: 'invite', label: 'Invite', icon: RiAddLine },
    ]);
    act(() => state.props.suggestions[0].onPress());
    expect(navigate).toHaveBeenLastCalledWith('/invite', undefined);
    expect(state.props.illustration).toBeDefined();
    expect(state.props.footer).toBeDefined();
    expect(state.props.children).toBeDefined();
  });

  it('a chip takes its role and the inverted look; a selection card toggles through its binding', () => {
    const set = jest.fn();
    const renderer = mount(
      toElement(
        VStack(
          Chip(Text('Mine')).role('checkbox').style('inverted').label('Mine'),
          SelectionCard('Pro', Text('For creators')).toggle([false, set]).indicator('check'),
        ),
      ),
    );
    expect(only(renderer, 'Chip').props).toMatchObject({ role: 'checkbox', variant: 'inverted' });
    expect(only(renderer, 'Chip').props.accessibilityRole).toBeUndefined();
    const card = only(renderer, 'SelectionCard');
    expect(card.props).toMatchObject({ selection: 'multiple', selected: false, title: 'Pro' });
    act(() => card.props.onPress());
    expect(set).toHaveBeenCalledWith(true);
  });

  it('an error boundary’s fallback can be a view of what it caught', () => {
    const renderer = mount(
      toElement(
        ErrorBoundary(Text('Feed'))
          .fallback(({ error }) => Text(error.message))
          .padding('md'),
      ),
    );
    const boundary = only(renderer, 'ErrorBoundary');
    expect(typeof boundary.props.fallback).toBe('function');
    expect(boundary.props.style).toBeDefined();
  });
});
