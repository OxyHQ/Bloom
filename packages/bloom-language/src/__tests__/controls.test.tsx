import { createElement, Fragment, memo, type ReactElement } from 'react';
import { act, create } from 'react-test-renderer';

import { MOTION } from '@oxy.so/bloom/motion';

import { Accordion } from '../controls/accordion';
import { AgentChatHistory } from '../controls/agent-chat';
import { ConversationSidebar } from '../controls/agents';
import { CallScreen } from '../controls/call-ui';
import { CartPanel } from '../controls/cart-panel';
import { Collapsible } from '../controls/collapsible';
import { HoverCard } from '../controls/hover-card';
import { ListItem, MailRow, VirtualList } from '../controls/list';
import { ReviewCard } from '../controls/listings';
import { MenuItemOptions } from '../controls/menu-item';
import { NowPlayingBar } from '../controls/media-player';
import { Notification } from '../controls/notification';
import { RatingBar } from '../controls/rating';
import { ShareSheet } from '../controls/share-sheet';
import { Meter } from '../controls/stat-bar';
import { Tooltip } from '../controls/tooltip';
import { EpisodeRow, TrackRow } from '../controls/track-list';
import type { Child } from '../node';
import { Text } from '../primitives';
import { defineTokens } from '../tokens';
import { toElement } from '../render';
import { LIGHT, PaintContext } from './support/bloom-theme';
import { mount, only, quietRenderer } from './support/mount';

quietRenderer();

const row = ({ item }: { item: string }): Child => ListItem(item);
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

  it('hands a renderItem of FlashList’s signature through: its element as it is, memoised rows kept', () => {
    let drawn = 0;
    function Post({ title }: { title: string }) {
      drawn += 1;
      return createElement('Post', { title });
    }
    // An app's named renderItem, as the codemod carries it: `VirtualList(posts, renderPost)`.
    const renderPost = ({ item }: { item: string }) => createElement(Post, { title: item });
    type RenderItem = (info: { item: string; index: number }) => ReactElement | null;
    // FlashList's rows are memoised on their item and the list's renderItem.
    const Row = memo(({ item, renderItem }: { item: string; renderItem: RenderItem }) =>
      renderItem({ item, index: 0 }),
    );
    const rows = (renderItem: RenderItem) =>
      createElement(
        Fragment,
        null,
        ['Ana', 'Rui'].map((item) => createElement(Row, { key: item, item, renderItem })),
      );
    const r = mount(toElement(VirtualList(['Ana', 'Rui'], renderPost)));
    const first = only(r, 'VirtualList').props.renderItem as RenderItem;
    act(() => r.update(themed(toElement(VirtualList(['Ana', 'Rui'], renderPost)))));
    const second = only(r, 'VirtualList').props.renderItem as RenderItem;
    expect(second).toBe(first);
    let list!: ReturnType<typeof create>;
    act(() => {
      list = create(rows(first));
    });
    act(() => list.update(rows(second)));
    expect(
      list.root
        .findAll((node) => (node.type as unknown) === 'Post')
        .map((node) => node.props.title),
    ).toEqual(['Ana', 'Rui']);
    // Each row drawn once: the second render kept them.
    expect(drawn).toBe(2);
  });

  it('draws each item with the latest row function', () => {
    const r = mount(toElement(VirtualList(['Ana'], row)));
    const other = ({ item, index }: { item: string; index: number }): Child =>
      ListItem(`${item}!${index}`);
    act(() => r.update(themed(toElement(VirtualList(['Ana'], other)))));
    const drawn = only(r, 'VirtualList').props.renderItem({ item: 'Ana', index: 0 });
    expect(drawn.props.title).toBe('Ana!0');
  });

  it('hands Bloom its screen, scrollbar, keyboard and tuning props as they are', () => {
    const list = only(
      mount(
        toElement(
          VirtualList(['Ana'], row)
            .screen()
            .scrollbar('never')
            .keyboardTaps('handled')
            .scrollDismissesKeyboard('immediately')
            .tuning({ overscan: 4, windowSize: 10 }),
        ),
      ),
      'VirtualList',
    );
    expect(list.props).toMatchObject({
      screen: {},
      scrollbar: 'never',
      keyboardShouldPersistTaps: 'handled',
      keyboardDismissMode: 'on-drag',
      overscan: 4,
      windowSize: 10,
    });
  });

  it('hands Bloom a grid’s item layout, and one header style that keeps the header to its content', () => {
    const span = (layout: { span?: number }, item: string) => {
      if (item === 'Tabs') layout.span = 3;
    };
    const grid = () =>
      toElement(VirtualList(['Tabs', 'Ana'], row).columns(3).itemLayout(span).headerFitsContent());
    const r = mount(grid());
    const first = only(r, 'VirtualList').props;
    expect(first).toMatchObject({ numColumns: 3, overrideItemLayout: span });
    expect(first.ListHeaderComponentStyle).toEqual({
      flexGrow: 0,
      flexShrink: 0,
      alignSelf: 'stretch',
    });
    // The same object on every render, so a memoised header wrapper is not drawn again.
    act(() => r.update(themed(grid())));
    expect(only(r, 'VirtualList').props.ListHeaderComponentStyle).toBe(
      first.ListHeaderComponentStyle,
    );
    const plain = only(mount(toElement(VirtualList(['Ana'], row))), 'VirtualList').props;
    expect(plain.ListHeaderComponentStyle).toBeUndefined();
    expect(plain.overrideItemLayout).toBeUndefined();
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

describe('a value inside Bloom’s own data', () => {
  it('a cart panel’s tip and promo are bindings, drawn into Bloom’s tip and promo', () => {
    const setTip = jest.fn();
    const setCode = jest.fn();
    const apply = jest.fn();
    const tips = [{ id: '10', label: '10%' }];
    const panel = only(
      mount(
        toElement(
          CartPanel('Forno', [])
            .tip(['10', setTip], tips, { label: 'Tip' })
            .promo(['SPRING', setCode], { onApply: apply }),
        ),
      ),
      'CartPanel',
    );
    expect(panel.props.tip).toEqual({
      label: 'Tip',
      options: tips,
      value: '10',
      onValueChange: setTip,
    });
    expect(panel.props.promo).toEqual({ onApply: apply, value: 'SPRING', onChangeText: setCode });
  });

  it('a cart panel with neither draws no tip or promo row', () => {
    const panel = only(mount(toElement(CartPanel('Forno', []))), 'CartPanel');
    expect(panel.props.tip).toBeUndefined();
    expect(panel.props.promo).toBeUndefined();
  });

  it('a share sheet’s search is a binding, drawn into Bloom’s search', () => {
    const setQuery = jest.fn();
    const submit = jest.fn();
    const sheet = only(
      mount(toElement(ShareSheet().search(['an', setQuery], { onSubmit: submit }))),
      'ShareSheet',
    );
    expect(sheet.props.search).toEqual({ onSubmit: submit, value: 'an', onValueChange: setQuery });
    expect(only(mount(toElement(ShareSheet())), 'ShareSheet').props.search).toBeUndefined();
  });

  it('a call screen’s toggles are bindings, each drawing its button into the bar', () => {
    const mute = jest.fn();
    const end = jest.fn();
    const screen = only(
      mount(
        toElement(
          CallScreen('Ana', 'active', { controls: { onEndCall: end } })
            .muted([true, mute])
            .size('lg'),
        ),
      ),
      'CallScreen',
    );
    expect(screen.props.controls).toEqual({
      onEndCall: end,
      muted: true,
      onMutedChange: mute,
      size: 'lg',
      children: undefined,
    });
    const bare = only(mount(toElement(CallScreen('Ana', 'active'))), 'CallScreen');
    expect(bare.props.controls).toBeUndefined();
  });

  it('a mail row’s star is a binding, drawn into its data', () => {
    const star = jest.fn();
    const data = { sender: { name: 'Ana' }, subject: 'Hi' };
    const row = only(mount(toElement(MailRow(data).starred([false, star]))), 'ListItem');
    expect(row.props.mail).toEqual({ ...data, starred: false, onStarredChange: star });
    expect(only(mount(toElement(MailRow(data))), 'ListItem').props.mail).toBe(data);
  });

  it('a track row’s like and an episode row’s save and download are bindings, drawn into the item', () => {
    const like = jest.fn();
    const track = { id: 'a', title: 'A', artists: [], duration: 1 };
    const row = only(mount(toElement(TrackRow(track, 0).liked([true, like]))), 'TrackRow');
    expect(row.props.track).toEqual({ ...track, liked: true });
    row.props.onLikedChange(row.props.track, false);
    expect(like).toHaveBeenCalledWith(false);
    const plain = only(mount(toElement(TrackRow(track, 0))), 'TrackRow');
    expect(plain.props.track).toBe(track);
    expect('onLikedChange' in plain.props).toBe(false);

    const save = jest.fn();
    const episode = { id: 'e', title: 'E', duration: 1 };
    const episodeRow = only(
      mount(toElement(EpisodeRow(episode).saved([false, save]))),
      'EpisodeRow',
    );
    expect(episodeRow.props.episode).toEqual({ ...episode, saved: false });
    episodeRow.props.onSavedChange(episodeRow.props.episode, true);
    expect(save).toHaveBeenCalledWith(true);
    expect('onDownloadedChange' in episodeRow.props).toBe(false);
  });

  it('a player’s shuffle, repeat and rate are bindings, drawn into its transport', () => {
    const shuffle = jest.fn();
    const pause = jest.fn();
    const track = { id: 'a', title: 'A', artists: [] };
    const bar = only(
      mount(
        toElement(
          NowPlayingBar(track, {
            transport: { playing: true, onPlayPause: pause },
            position: 0,
            duration: 1,
          }).shuffle([true, shuffle]),
        ),
      ),
      'NowPlayingBar',
    );
    expect(bar.props.transport).toEqual({
      playing: true,
      onPlayPause: pause,
      shuffle: true,
      onShuffleChange: shuffle,
    });
  });
});
