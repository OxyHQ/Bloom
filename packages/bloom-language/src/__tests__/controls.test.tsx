import { createElement, type ReactElement } from 'react';
import { act } from 'react-test-renderer';

import { MOTION } from '@oxy.so/bloom/motion';

import { Accordion } from '../controls/accordion';
import { AgentChatHistory } from '../controls/agent-chat';
import { ConversationSidebar } from '../controls/agents';
import { Collapsible } from '../controls/collapsible';
import { HoverCard } from '../controls/hover-card';
import { ListItem, VirtualList } from '../controls/list';
import { ReviewCard } from '../controls/listings';
import { SignaturePad } from '../controls/logistics';
import { MenuItemOptions } from '../controls/menu-item';
import { Notification } from '../controls/notification';
import { RatingBar } from '../controls/rating';
import { Meter } from '../controls/stat-bar';
import { Tooltip } from '../controls/tooltip';
import type { Child } from '../node';
import { Text } from '../primitives';
import { defineTokens } from '../tokens';
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

describe('a reveal takes a timed motion token', () => {
  const app = defineTokens({ motion: { reply: { duration: 180, easing: [0.4, 0, 0.2, 1] } } });

  it('is Bloom’s own spec by name, or the app’s spec itself', () => {
    const shown = (motion: 'slide' | typeof app.motion.reply) =>
      only(mount(toElement(Collapsible(true, Text('a')).revealMotion(motion))), 'Collapsible').props
        .transition;
    expect(shown('slide')).toBe(MOTION.slide);
    expect(shown(app.motion.reply)).toBe(app.motion.reply);
    const accordion = only(
      mount(toElement(Accordion(['a', () => {}]).revealMotion('fade'))),
      'Accordion',
    );
    expect(accordion.props.transition).toBe(MOTION.fade);
  });

  it('none chained hands Bloom none: a collapsible’s ease, an accordion’s spring', () => {
    expect(
      only(mount(toElement(Collapsible(true, Text('a')))), 'Collapsible').props.transition,
    ).toBeUndefined();
    expect(
      only(mount(toElement(Accordion(['a', () => {}]))), 'Accordion').props.transition,
    ).toBeUndefined();
  });

  it('a bar’s reveal is Bloom’s: its state, its wait in ms, and its motion’s duration and curve', () => {
    const meter = only(
      mount(
        toElement(
          Meter(0.5)
            .reveal({ visible: true, once: true, delay: 'fast' })
            .revealMotion('enter')
            .label('a'),
        ),
      ),
      'Meter',
    );
    expect(meter.props.reveal).toEqual({ visible: true, once: true, delay: 150, ...MOTION.enter });
    const bar = only(
      mount(toElement(RatingBar('Value', 3).reveal({ visible: false }))),
      'RatingBar',
    );
    expect(bar.props.reveal).toEqual({ visible: false });
    // A motion with no reveal reveals nothing: the bar fills as it always does.
    const plain = only(mount(toElement(Meter(0.5).revealMotion('enter').label('a'))), 'Meter');
    expect(plain.props.reveal).toBeUndefined();
  });
});

describe('a selection a press reports', () => {
  it('is a binding: its id selects, a press writes it', () => {
    const select = jest.fn();
    const history = only(
      mount(toElement(AgentChatHistory([]).selection(['t1', select]))),
      'AgentChatHistory',
    );
    expect(history.props.activeId).toBe('t1');
    expect(history.props.onSelect).toBe(select);
  });

  it('a conversation sidebar’s open conversation is its binding, its destination a sidebar’s selection', () => {
    const open = jest.fn();
    const go = jest.fn();
    const sidebar = only(
      mount(toElement(ConversationSidebar([], ['c1', open]).destination(['home', go]))),
      'ConversationSidebar',
    );
    expect(sidebar.props).toMatchObject({
      activeId: 'c1',
      onSelect: open,
      selected: 'home',
      selectedTreeItem: 'home',
    });
    sidebar.props.onNavigate({ key: 'search', label: 'Search' });
    sidebar.props.onTreeItemPress({ key: 'q1', label: 'Q1' });
    expect(go.mock.calls).toEqual([['search'], ['q1']]);
  });

  it('a conversation sidebar with no destination bound draws no sidebar selection', () => {
    const sidebar = only(
      mount(toElement(ConversationSidebar([], ['c1', jest.fn()]))),
      'ConversationSidebar',
    );
    for (const prop of ['selected', 'selectedTreeItem', 'onNavigate', 'onTreeItemPress'])
      expect(prop in sidebar.props).toBe(false);
  });
});
