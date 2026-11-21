import { Avatar } from '@oxy.so/bloom/avatar';
import { RiArchiveLine, RiArrowRightSLine, RiStarLine } from '@oxy.so/bloom/icons';
import { List, ListItem, ListSelectionBar, VirtualList } from '@oxy.so/bloom/list';
import { Text } from '@oxy.so/bloom/typography';

import { ENUMS } from '../src/generated/spec.generated';
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
const nameRow = (name: string) => L.ListItem(name);
const keyOf = (name: string) => name;

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
  ...ENUMS.density.map((density) => ({
    name: `a ${density} row, active, pressable`,
    language: () =>
      toElement(
        L.ListItem('Inbox').density(density).active(true).onPress(press).onLongPress(press),
      ),
    bloom: () => (
      <ListItem
        title="Inbox"
        density={density === 'compact' ? 'compact' : 'comfortable'}
        active
        onPress={press}
        onLongPress={press}
      />
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
          .listHeader(L.Text('Header'))
          .listFooter(L.Text('Footer')),
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
          .refreshable(false, press)
          .listHeader(L.Text('Top'))
          .listFooter(L.Text('End'))
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
