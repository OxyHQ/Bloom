import { Avatar } from '@oxy.so/bloom/avatar';
import { RiArchiveLine, RiArrowRightSLine, RiStarLine } from '@oxy.so/bloom/icons';
import { List, ListItem, ListSelectionBar, VirtualList } from '@oxy.so/bloom/list';
import { Screen } from '@oxy.so/bloom/screen';
import { Text } from '@oxy.so/bloom/typography';

import { ENUMS, NODE_DENSITIES } from '../src/generated/spec.generated';
import * as L from '../src/index';
import { toElement } from '../src/render';
import { type ParityCase, Themed } from './support/cases';

const press = () => {};
const set = () => {};
const ACTIONS = [{ key: 'archive', label: 'Archive', icon: RiArchiveLine }];
const ENTRIES = [
  { id: 'a', title: 'Ana Lima', supporting: 'Design' },
  { id: 'b', title: 'Rui Costa', supporting: 'Support' },
];
const SECTIONS = [{ id: 'team', title: 'Team', items: ENTRIES }];
const NAMES = ['Ana', 'Rui', 'Mia'];
const nameRow = ({ item }: { item: string }) => L.ListItem(item);
const keyOf = (name: string) => name;
/** A grid's rows: a full-width row (its tabs), then cells. */
const GRID = ['Tabs', 'Ana', 'Rui', 'Mia', 'Eva'];
const spanTabs = (layout: { span?: number }, item: string) => {
  if (item === 'Tabs') layout.span = 3;
};
/** React Native's `keyboardDismissMode` for each of the language's. */
const DISMISS_MODE = {
  never: 'none',
  immediately: 'on-drag',
  interactively: 'interactive',
} as const;

const rows: ParityCase[] = [
  {
    name: 'a row',
    language: () => toElement(L.ListItem('Ana Lima')),
    bloom: () => <ListItem title="Ana Lima" />,
  },
  {
    name: 'a row with a supporting line, leading and trailing views',
    language: () =>
      toElement(
        L.ListItem('Ana Lima')
          .supporting('Design lead')
          .supportingLines(2)
          .prefix(L.Avatar(null, { name: 'Ana Lima' }))
          .trailing(L.Icon(RiArrowRightSLine))
          .label('Ana Lima, design lead'),
      ),
    bloom: () => (
      <Themed>
        {(c) => (
          <ListItem
            title="Ana Lima"
            supporting="Design lead"
            supportingLines={2}
            leading={<Avatar name="Ana Lima" />}
            trailing={<RiArrowRightSLine size="md" fill={c.text} />}
            label="Ana Lima, design lead"
          />
        )}
      </Themed>
    ),
  },
  // A row takes a control's densities; `comfortable` is a content density.
  ...NODE_DENSITIES.listItem.map((density) => ({
    name: `a ${density} row, active, pressable`,
    language: () =>
      toElement(
        L.ListItem('Inbox').density(density).active(true).onPress(press).onLongPress(press),
      ),
    bloom: () => (
      <ListItem title="Inbox" density={density} active onPress={press} onLongPress={press} />
    ),
  })),
  {
    name: 'a compact row of its own padding, disabled, a link',
    language: () =>
      toElement(
        L.ListItem('Docs')
          .density('compact')
          .compactPadding('xs')
          .disabled()
          .link('/docs')
          .onPrefetch(press),
      ),
    bloom: () => (
      <ListItem
        title="Docs"
        density="compact"
        compactPadding={4}
        disabled
        href="/docs"
        onPrefetch={press}
      />
    ),
  },
  {
    name: 'a body of its own, a footnote and attachments',
    language: () =>
      toElement(
        L.ListItem()
          .content(L.Text('Custom body').weight('semibold'))
          .footnote(L.Text('12 files'))
          .attachments(L.Text('photo.jpg')),
      ),
    bloom: () => (
      <ListItem
        content={<Text style={{ fontWeight: '600' }}>Custom body</Text>}
        footer={<Text>12 files</Text>}
        attachments={<Text>photo.jpg</Text>}
      />
    ),
  },
  {
    name: 'a selectable row, selecting, with actions',
    language: () =>
      toElement(
        L.ListItem('Report.pdf')
          .checkable([true, set])
          .selecting(true)
          .selectionLabel('Select Report.pdf')
          .rowActions(ACTIONS, set),
      ),
    bloom: () => (
      <ListItem
        title="Report.pdf"
        checked
        onCheckedChange={set}
        selecting
        selectionLabel="Select Report.pdf"
        actions={ACTIONS}
        onAction={set}
      />
    ),
  },
  {
    name: 'a row with swipe actions',
    language: () =>
      toElement(
        L.ListItem('Thread')
          .swipeActions({ right: ACTIONS }, { right: 'archive' })
          .swipeEnabled(false)
          .rowActions(ACTIONS, set),
      ),
    bloom: () => (
      <ListItem
        title="Thread"
        swipeActions={{ right: ACTIONS }}
        fullSwipeAction={{ right: 'archive' }}
        swipeEnabled={false}
        actions={ACTIONS}
        onAction={set}
      />
    ),
  },
  {
    name: 'a title view',
    language: () =>
      toElement(L.ListItem(L.Text('Starred').foreground('primary')).prefix(L.Icon(RiStarLine))),
    bloom: () => (
      <Themed>
        {(c) => (
          <ListItem
            title={<Text style={{ color: c.primary }}>Starred</Text>}
            leading={<RiStarLine size="md" fill={c.text} />}
          />
        )}
      </Themed>
    ),
  },
];

const recipes: ParityCase[] = [
  {
    name: 'a person',
    language: () =>
      toElement(
        L.PersonRow({
          name: 'Ana Lima',
          subtitle: '@ana',
          status: 'online',
          actionLabel: 'Add',
          onAction: press,
        }),
      ),
    bloom: () => (
      <ListItem
        person={{
          name: 'Ana Lima',
          subtitle: '@ana',
          status: 'online',
          actionLabel: 'Add',
          onAction: press,
        }}
      />
    ),
  },
  {
    name: 'a call',
    language: () =>
      toElement(L.CallRow({ name: 'Rui', direction: 'missed', mode: 'video', meta: 'Yesterday' })),
    bloom: () => (
      <ListItem call={{ name: 'Rui', direction: 'missed', mode: 'video', meta: 'Yesterday' }} />
    ),
  },
  {
    name: 'a conversation',
    language: () =>
      toElement(
        L.ConversationRow({
          name: 'Ana',
          preview: { text: 'See you soon' },
          time: '12:41',
          unreadCount: 3,
        }),
      ),
    bloom: () => (
      <ListItem
        conversation={{
          name: 'Ana',
          preview: { text: 'See you soon' },
          time: '12:41',
          unreadCount: 3,
        }}
      />
    ),
  },
  {
    name: 'a mail',
    language: () =>
      toElement(
        L.MailRow({
          sender: { name: 'Mireia' },
          subject: 'Roof survey',
          snippet: 'Measurements attached',
          unread: true,
        }),
      ),
    bloom: () => (
      <ListItem
        mail={{
          sender: { name: 'Mireia' },
          subject: 'Roof survey',
          snippet: 'Measurements attached',
          unread: true,
        }}
      />
    ),
  },
  {
    name: 'a mail, starred',
    language: () =>
      toElement(
        L.MailRow({ sender: { name: 'Mireia' }, subject: 'Roof survey', time: '09:12' }).starred([
          true,
          set,
        ]),
      ),
    bloom: () => (
      <ListItem
        mail={{
          sender: { name: 'Mireia' },
          subject: 'Roof survey',
          time: '09:12',
          starred: true,
          onStarredChange: set,
        }}
      />
    ),
  },
];

const lists: ParityCase[] = [
  {
    name: 'a list',
    language: () => toElement(L.List(ENTRIES)),
    bloom: () => <List items={ENTRIES} />,
  },
  ...ENUMS.listSeparator.map((separator) => ({
    name: `a list, ${separator} separators`,
    language: () => toElement(L.List(ENTRIES).separator(separator).label('People')),
    bloom: () => <List items={ENTRIES} separator={separator} accessibilityLabel="People" />,
  })),
  {
    name: 'a list in sections, sticky, scrolling, with its header and footer',
    language: () =>
      toElement(
        L.SectionedList(SECTIONS)
          .stickyHeaders()
          .scrollable()
          .scrollHeight('320')
          .headerContent(L.Text('Header'))
          .footerContent(L.Text('Footer')),
      ),
    bloom: () => (
      <List
        sections={SECTIONS}
        stickyHeaders
        scrollable
        height={320}
        header={<Text>Header</Text>}
        footer={<Text>Footer</Text>}
      />
    ),
  },
  {
    name: 'an empty list',
    language: () => toElement(L.List([]).emptyState(L.Text('Nobody yet'))),
    bloom: () => <List items={[]} empty={<Text>Nobody yet</Text>} />,
  },
  {
    name: 'a loading list',
    language: () => toElement(L.List([]).loading().loadingRows(3)),
    bloom: () => <List items={[]} loading loadingCount={3} />,
  },
];

const virtual: ParityCase[] = [
  {
    // What an app's contentContainerStyle wrote: its padding and gap.
    name: 'a virtual list with content margins and a gap',
    language: () =>
      toElement(
        L.VirtualList(NAMES, nameRow)
          .itemKey(keyOf)
          .contentMargins('horizontal', 'lg')
          .contentMargins('bottom', '2xl')
          .spacing('sm'),
      ),
    bloom: () => (
      <VirtualList
        data={NAMES}
        keyExtractor={keyOf}
        renderItem={({ item }) => <ListItem title={item} />}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 8 }}
      />
    ),
  },
  {
    // Mention's lists: a query's isRefetching and refetch.
    name: 'a virtual list refreshed by its query',
    language: () =>
      toElement(
        L.VirtualList(NAMES, nameRow)
          .itemKey(keyOf)
          .refreshable({ refreshing: true, onRefresh: press }),
      ),
    bloom: () => (
      <VirtualList
        data={NAMES}
        keyExtractor={keyOf}
        renderItem={({ item }) => <ListItem title={item} />}
        refreshing
        onRefresh={press}
      />
    ),
  },
  {
    // Mention's notifications: the content grows to the list only while it is empty.
    name: 'a virtual list whose content grows while it is empty',
    language: () =>
      toElement(
        L.VirtualList([] as string[], nameRow)
          .itemKey(keyOf)
          .contentGrows([].length === 0)
          .emptyState(L.Text('Nothing yet')),
      ),
    bloom: () => (
      <VirtualList
        data={[] as string[]}
        keyExtractor={keyOf}
        renderItem={({ item }) => <ListItem title={item} />}
        contentContainerStyle={{ flexGrow: 1 }}
        ListEmptyComponent={<Text>Nothing yet</Text>}
      />
    ),
  },
  {
    name: 'a virtual list whose content keeps its height',
    language: () =>
      toElement(
        L.VirtualList(NAMES, nameRow)
          .itemKey(keyOf)
          .contentGrows(NAMES.length === 0),
      ),
    bloom: () => (
      <VirtualList
        data={NAMES}
        keyExtractor={keyOf}
        renderItem={({ item }) => <ListItem title={item} />}
      />
    ),
  },
  {
    name: 'a virtual list with a numeric padding all round',
    language: () => toElement(L.VirtualList(NAMES, nameRow).itemKey(keyOf).contentMargins('6')),
    bloom: () => (
      <VirtualList
        data={NAMES}
        keyExtractor={keyOf}
        renderItem={({ item }) => <ListItem title={item} />}
        contentContainerStyle={{ padding: 6 }}
      />
    ),
  },
  {
    name: 'a virtual list',
    language: () => toElement(L.VirtualList(NAMES, nameRow).itemKey(keyOf)),
    bloom: () => (
      <VirtualList
        data={NAMES}
        keyExtractor={keyOf}
        renderItem={({ item }) => <ListItem title={item} />}
      />
    ),
  },
  {
    name: 'a virtual list with its header, footer, end and refresh',
    language: () =>
      toElement(
        L.VirtualList(NAMES, nameRow)
          .estimatedItemSize(56)
          .onEndReached(press, 0.5)
          .refreshable([false, press])
          .headerContent(L.Text('Top'))
          .footerContent(L.Text('End'))
          .tuning({ drawDistance: 500 })
          .testID('names'),
      ),
    bloom: () => (
      <VirtualList
        data={NAMES}
        renderItem={({ item }) => <ListItem title={item} />}
        estimatedItemSize={56}
        onEndReached={press}
        onEndReachedThreshold={0.5}
        refreshing={false}
        onRefresh={press}
        ListHeaderComponent={<Text>Top</Text>}
        ListFooterComponent={<Text>End</Text>}
        drawDistance={500}
        testID="names"
      />
    ),
  },
  {
    // Mention's profile media grid: a full-width row spans the columns, under a header kept to its content.
    name: 'a virtual grid whose full-width row spans its columns, under a header kept to its content',
    language: () =>
      toElement(
        L.VirtualList(GRID, nameRow)
          .itemKey(keyOf)
          .columns(3)
          .itemLayout(spanTabs)
          .headerContent(L.Text('Top'))
          .headerFitsContent(),
      ),
    bloom: () => (
      <VirtualList
        data={GRID}
        keyExtractor={keyOf}
        renderItem={({ item }) => <ListItem title={item} />}
        numColumns={3}
        overrideItemLayout={spanTabs}
        ListHeaderComponent={<Text>Top</Text>}
        ListHeaderComponentStyle={{ flexGrow: 0, flexShrink: 0, alignSelf: 'stretch' }}
      />
    ),
  },
  {
    name: 'a virtual list whose row reads its index',
    language: () =>
      toElement(L.VirtualList(NAMES, ({ item, index }) => L.ListItem(`${index}. ${item}`))),
    bloom: () => (
      <VirtualList
        data={NAMES}
        renderItem={({ item, index }) => <ListItem title={`${index}. ${item}`} />}
      />
    ),
  },
  {
    name: 'a virtual list that is its screen’s scroller',
    language: () => <Screen>{toElement(L.VirtualList(NAMES, nameRow).screen())}</Screen>,
    bloom: () => (
      <Screen>
        <VirtualList
          data={NAMES}
          renderItem={({ item }) => <ListItem title={item} />}
          screen={{}}
        />
      </Screen>
    ),
  },
  {
    name: 'a virtual list bound to its screen, inactive',
    language: () => (
      <Screen>{toElement(L.VirtualList(NAMES, nameRow).screen({ active: false }))}</Screen>
    ),
    bloom: () => (
      <Screen>
        <VirtualList
          data={NAMES}
          renderItem={({ item }) => <ListItem title={item} />}
          screen={{ active: false }}
        />
      </Screen>
    ),
  },
  ...ENUMS.scrollbarVisibility.map((scrollbar) => ({
    name: `a virtual list's scrollbar ${scrollbar}`,
    language: () => toElement(L.VirtualList(NAMES, nameRow).scrollbar(scrollbar)),
    bloom: () => (
      <VirtualList
        data={NAMES}
        renderItem={({ item }) => <ListItem title={item} />}
        scrollbar={scrollbar}
      />
    ),
  })),
  ...ENUMS.keyboardDismiss.map((dismiss) => ({
    name: `a virtual list's keyboard: taps handled, dismissed ${dismiss}`,
    language: () =>
      toElement(
        L.VirtualList(NAMES, nameRow).keyboardTaps('handled').scrollDismissesKeyboard(dismiss),
      ),
    bloom: () => (
      <VirtualList
        data={NAMES}
        renderItem={({ item }) => <ListItem title={item} />}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={DISMISS_MODE[dismiss]}
      />
    ),
  })),
  {
    name: 'a virtual list’s engine tuning',
    language: () =>
      toElement(
        L.VirtualList(NAMES, nameRow).tuning({
          overscan: 4,
          removeClippedSubviews: false,
          maxToRenderPerBatch: 10,
          windowSize: 10,
          initialNumToRender: 10,
          recycleItems: true,
          maintainVisibleContentPosition: true,
          drawDistance: 400,
          maxItemsInRecyclePool: 24,
        }),
      ),
    bloom: () => (
      <VirtualList
        data={NAMES}
        renderItem={({ item }) => <ListItem title={item} />}
        overscan={4}
        removeClippedSubviews={false}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={10}
        recycleItems
        maintainVisibleContentPosition
        drawDistance={400}
        maxItemsInRecyclePool={24}
      />
    ),
  },
  {
    name: 'an empty virtual list',
    language: () => toElement(L.VirtualList([], nameRow).emptyState(L.Text('Nothing'))),
    bloom: () => (
      <VirtualList
        data={[]}
        renderItem={({ item }: { item: string }) => <ListItem title={item} />}
        ListEmptyComponent={<Text>Nothing</Text>}
      />
    ),
  },
];

const bars: ParityCase[] = [
  {
    name: 'a selection bar',
    language: () => toElement(L.ListSelectionBar(2, 10)),
    bloom: () => <ListSelectionBar count={2} total={10} />,
  },
  {
    name: 'a selection bar, selecting, with its actions',
    language: () =>
      toElement(
        L.ListSelectionBar(10, 10)
          .selecting(true)
          .onSelectAll(set)
          .onClear(press)
          .rowActions(ACTIONS, set)
          .labels({ clearSelection: 'Done' }),
      ),
    bloom: () => (
      <ListSelectionBar
        count={10}
        total={10}
        selecting
        onSelectAll={set}
        onClear={press}
        actions={ACTIONS}
        onAction={set}
        strings={{ clearSelection: 'Done' }}
      />
    ),
  },
];

export const LIST_CASES: readonly ParityCase[] = [
  ...rows,
  ...recipes,
  ...lists,
  ...virtual,
  ...bars,
];
