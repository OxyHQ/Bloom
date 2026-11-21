import { act } from 'react-test-renderer';

import {
  Admonition,
  Card,
  CardTitle,
  Chip,
  EmptyState,
  GroupedSection,
  GroupedSectionItem,
  Row,
  TabItem,
  Tabs,
} from '../controls/containers';
import { Button, Icon, Text } from '../primitives';
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
});
