import { fn } from 'storybook/test';
import { List, ListSelectionBar } from '../list';
import { EmptyState } from '../empty-state';
import { ListItem } from '../list';
import type React from 'react';
import { useMemo, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { RiArchiveLine } from '../icons/remix/RiArchiveLine';
import { RiDeleteBinLine } from '../icons/remix/RiDeleteBinLine';
import { RiMailOpenLine } from '../icons/remix/RiMailOpenLine';
import { RiSpamLine } from '../icons/remix/RiSpamLine';
import { RiTimeLine } from '../icons/remix/RiTimeLine';
import { Chip } from '../chip';
import { RiFileTextLine } from '../icons/remix/RiFileTextLine';
import { Sidebar } from '../sidebar';
import type { SidebarTree } from '../sidebar/types';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { groupMailByDay } from './shared';
import type { MailAction, MailSummary, MailSwipeActions } from './types';

const meta: Meta = {
  id: 'blocks-mail-mail-list',
  title: 'Patterns/Mail/Mail List',
};

export default meta;

type Story = StoryObj;

// ---------------------------------------------------------------------------
//  Demo data — invented people, invented companies, invented mail
// ---------------------------------------------------------------------------

const face = (seed: string) => `https://picsum.photos/seed/${seed}/160/160`;

const DAY = 86_400_000;
const NOW = Date.UTC(2026, 2, 14, 15, 0, 0);

// The POINTER's rail: every action at once, on hover and on keyboard focus.
const ROW_ACTIONS: MailAction[] = [
  { key: 'archive', label: 'Archive', icon: RiArchiveLine },
  { key: 'snooze', label: 'Snooze', icon: RiTimeLine },
  { key: 'delete', label: 'Delete', icon: RiDeleteBinLine, tone: 'negative' },
];

// The THUMB's panes: one action per direction, and nothing drawn at rest.
const ROW_SWIPE_ACTIONS: MailSwipeActions = {
  left: [{ key: 'archive', label: 'Archive', icon: RiArchiveLine, tone: 'accent' }],
  right: [
    { key: 'snooze', label: 'Snooze', icon: RiTimeLine },
    { key: 'delete', label: 'Delete', icon: RiDeleteBinLine, tone: 'negative' },
  ],
};

const BULK_ACTIONS: MailAction[] = [
  { key: 'read', label: 'Mark as read', icon: RiMailOpenLine },
  { key: 'archive', label: 'Archive', icon: RiArchiveLine },
  { key: 'spam', label: 'Report spam', icon: RiSpamLine },
  { key: 'delete', label: 'Delete', icon: RiDeleteBinLine, tone: 'negative' },
];

const MAIL: MailSummary[] = [
  {
    id: 'roof',
    sender: { name: 'Mireia Solans', avatar: face('mireia') },
    subject: 'Roof survey — the tiles on the north pitch',
    snippet: 'The surveyor came back this morning and the short version is that we only need',
    time: '14:02',
    date: NOW - 2 * 3_600_000,
    unread: true,
    hasAttachment: true,
    threadCount: 4,
    labels: [{ id: 'work', name: 'Work', tone: 'info' }],
  },
  {
    id: 'invoice',
    sender: { name: 'Bastia Ferrers', avatar: face('bastia') },
    subject: 'Invoice 2214 is ready',
    snippet: 'No rush on this one — it covers February and the two extra site visits.',
    time: '11:20',
    date: NOW - 5 * 3_600_000,
    unread: true,
    starred: true,
    labels: [
      { id: 'money', name: 'Finance', tone: 'success' },
      { id: 'urgent', name: 'Urgent', tone: 'warning' },
      { id: 'q1', name: 'Q1', tone: 'default' },
    ],
  },
  {
    id: 'lunch',
    sender: { name: 'Tordera Studio', avatar: face('tordera') },
    subject: 'Thursday',
    snippet: 'Are we still on for one o’clock?',
    time: '09:47',
    date: NOW - 8 * 3_600_000,
    threadCount: 2,
  },
  {
    id: 'draft',
    sender: { name: 'Nuria Palau' },
    subject: 'Re: the balcony railings',
    snippet: 'I had a look at the drawing and I think the spacing is',
    time: '08:15',
    date: NOW - 10 * 3_600_000,
    draft: true,
  },
  {
    id: 'newsletter',
    sender: { name: 'The Long Field', avatar: face('longfield') },
    subject:
      'A very long subject line that keeps going well past the width of any reasonable list column and then keeps going some more',
    snippet:
      'And a snippet that is just as long, because the two of them together are what decides whether this row pushes the whole list sideways or truncates the way it should.',
    time: 'Yesterday',
    date: NOW - DAY - 3 * 3_600_000,
    labels: [{ id: 'reading', name: 'Reading', tone: 'default' }],
  },
  {
    id: 'permit',
    sender: { name: 'Vall de Nit Council', avatar: face('council') },
    subject: 'Permit 8841: decision',
    snippet: 'Your application has been approved subject to the two conditions attached.',
    time: 'Yesterday',
    date: NOW - DAY - 9 * 3_600_000,
    hasAttachment: true,
    starred: true,
  },
  {
    id: 'quote',
    sender: { name: 'Pere Aguiló', avatar: face('pere') },
    subject: 'Quote for the shutters',
    snippet: 'Three options, cheapest first. The middle one is what I would pick.',
    time: '11 Mar',
    date: NOW - 3 * DAY,
    threadCount: 6,
  },
];

function Frame({ width, children }: { width: number; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View
      style={{
        width,
        maxWidth: '100%',
        backgroundColor: theme.colors.background,
        paddingTop: 8,
        paddingBottom: 8,
      }}
    >
      {children}
    </View>
  );
}

// ---------------------------------------------------------------------------
//  Stories
// ---------------------------------------------------------------------------

/**
 * The phone inbox. No action icon is drawn in a row at rest — archive, snooze
 * and delete are behind the drag.
 *
 * Nothing forces the gesture on: `useSwipeAvailable()` answers it from the
 * POINTER, so this story swipes on a phone and in a browser emulating one, and
 * rightly does not under a mouse — where the same actions would be the rail.
 */
export const Inbox: Story = {
  // The phone inbox IS the page: no harness padding, so 390 means 390.
  parameters: { bleed: true },
  render: () => {
    const sections = useMemo(
      () => groupMailByDay(MAIL, { now: NOW, formatDate: () => '11 March' }),
      [],
    );
    const [selected, setSelected] = useState<string | undefined>('invoice');
    return (
      <Frame width={390}>
        <List
          sections={sections.map((section) => ({
            id: section.key,
            title: section.title,
            items: section.mails.map((mail) => ({
              id: mail.id,
              mail: { ...mail, onStarredChange: fn().mockName('onStarredChange') },
              active: mail.id === selected,
              onPress: () => setSelected(mail.id),
              onAction: fn().mockName('onAction'),
              swipeActions: mail.swipeActions ?? ROW_SWIPE_ACTIONS,
            })),
          }))}
          accessibilityLabel={'Inbox'}
          testID={'inbox'}
          empty={<EmptyState title="No messages" description="New messages will appear here." />}
        />
      </Frame>
    );
  },
};

/**
 * The same row beside a conversation row, at the same width. One rhythm: the
 * 36 avatar, the name line with the time on the right, one line under it, and a
 * small right column — 56px minimum in both content recipes.
 */
export const BesideAConversation: Story = {
  parameters: { bleed: true },
  render: () => (
    <Frame width={390}>
      <View style={{ gap: 8 }}>
        <Text variant="caption-1-semibold">Mail</Text>
        <ListItem
          mail={{ ...MAIL[0]!, onStarredChange: fn().mockName('onStarredChange') }}
          onPress={fn().mockName('onPress')}
          testID="beside-mail"
        />
        <ListItem
          mail={{ ...MAIL[2]! }}
          onPress={fn().mockName('onPress')}
          testID="beside-mail-read"
        />
        <Text variant="caption-1-semibold">Conversations</Text>
        <ListItem
          conversation={{
            name: 'Mireia Solans',
            avatar: face('mireia'),
            preview: { text: 'The surveyor came back this morning' },
            time: '14:02',
            unreadCount: 4,
          }}
          onPress={fn().mockName('onPress')}
          testID="beside-chat"
        />
        <ListItem
          conversation={{
            name: 'Tordera Studio',
            avatar: face('tordera'),
            preview: { text: 'Are we still on for one o’clock?' },
            time: '09:47',
          }}
          onPress={fn().mockName('onPress')}
          testID="beside-chat-read"
        />
      </View>
    </Frame>
  ),
};

export const CompactDesktop: Story = {
  render: () => {
    const sections = useMemo(
      () => groupMailByDay(MAIL, { now: NOW, formatDate: () => '11 March' }),
      [],
    );
    const [selected, setSelected] = useState<string | undefined>('roof');
    return (
      <Frame width={1040}>
        <List
          sections={sections.map((section) => ({
            id: section.key,
            title: section.title,
            items: section.mails.map((mail) => ({
              id: mail.id,
              mail: { ...mail, onStarredChange: fn().mockName('onStarredChange') },
              active: mail.id === selected,
              onPress: () => setSelected(mail.id),
              actions: mail.actions ?? ROW_ACTIONS,
            })),
          }))}
          accessibilityLabel={'Inbox'}
          testID={'inbox-compact'}
          empty={<EmptyState title="No messages" description="New messages will appear here." />}
        />
      </Frame>
    );
  },
};

export const BulkSelection: Story = {
  render: () => {
    const [checked, setChecked] = useState<string[]>(['roof', 'invoice']);
    return (
      <Frame width={720}>
        <List
          items={MAIL.slice(0, 5).map((mail) => ({
            id: mail.id,
            mail: { ...mail },
            checked: checked.includes(mail.id),
            selecting: checked.length > 0,
            onCheckedChange: (next: boolean) =>
              setChecked(
                next
                  ? [...checked.filter((id) => id !== mail.id), mail.id]
                  : checked.filter((id) => id !== mail.id),
              ),
          }))}
          accessibilityLabel={'Inbox'}
          testID={'inbox-bulk'}
          empty={<EmptyState title="No messages" description="New messages will appear here." />}
          header={
            <ListSelectionBar
              count={checked.length}
              total={MAIL.slice(0, 5).map((mail) => mail.id).length}
              onSelectAll={(next) =>
                setChecked(next ? MAIL.slice(0, 5).map((mail) => mail.id) : [])
              }
              onClear={() => setChecked([])}
              actions={BULK_ACTIONS}
              onAction={fn().mockName('onAction')}
              testID={'inbox-bulk' + '-selection'}
            />
          }
        />
      </Frame>
    );
  },
};

export const WithMailboxTree: Story = {
  render: () => {
    const { width } = useWindowDimensions();
    const tree: SidebarTree = {
      label: 'Mailboxes',
      folders: [
        {
          key: 'mailboxes',
          label: 'Mailboxes',
          defaultOpen: true,
          items: [
            { key: 'inbox', label: 'Inbox', meta: '12' },
            { key: 'starred', label: 'Starred' },
            { key: 'drafts', label: 'Drafts', meta: '2' },
            { key: 'sent', label: 'Sent' },
            { key: 'archive', label: 'Archive' },
          ],
        },
        {
          key: 'labels',
          label: 'Labels',
          items: [
            { key: 'work', label: 'Work' },
            { key: 'finance', label: 'Finance' },
            { key: 'reading', label: 'Reading' },
          ],
        },
      ],
    };
    const [selected, setSelected] = useState<string | undefined>('roof');
    return (
      <View style={{ flexDirection: 'row', width: '100%', height: 520 }}>
        {/* The mailbox tree is `Sidebar`'s `tree` prop — this family never grew
            one of its own. */}
        <Sidebar tree={tree} selectedTreeItem="inbox" collapsed={width < 700} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Frame width={680}>
            <List
              items={MAIL.map((mail) => ({
                id: mail.id,
                mail: { ...mail },
                active: mail.id === selected,
                onPress: () => setSelected(mail.id),
                actions: mail.actions ?? ROW_ACTIONS,
              }))}
              accessibilityLabel={'Inbox'}
              testID={'inbox-tree'}
              empty={
                <EmptyState title="No messages" description="New messages will appear here." />
              }
            />
          </Frame>
        </View>
      </View>
    );
  },
};

export const Row: Story = {
  render: () => (
    <Frame width={420}>
      <View style={{ gap: 4 }}>
        <Text variant="caption-1-semibold">Unread</Text>
        <ListItem mail={{ ...MAIL[0]! }} onPress={fn().mockName('onPress')} testID="row-unread" />
        <Text variant="caption-1-semibold">Read, starred, three labels</Text>
        <ListItem
          mail={{ ...MAIL[1]!, unread: false }}
          onPress={fn().mockName('onPress')}
          testID="row-read"
        />
        <Text variant="caption-1-semibold">Draft</Text>
        <ListItem mail={{ ...MAIL[3]! }} onPress={fn().mockName('onPress')} testID="row-draft" />
        <Text variant="caption-1-semibold">Selected</Text>
        <ListItem
          mail={{ ...MAIL[2]! }}
          active={true}
          onPress={fn().mockName('onPress')}
          testID="row-selected"
        />
        <Text variant="caption-1-semibold">Multi-selected</Text>
        <ListItem
          mail={{ ...MAIL[5]! }}
          checked
          onCheckedChange={fn().mockName('onCheckedChange')}
          onPress={fn().mockName('onPress')}
          testID="row-checked"
        />
        <Text variant="caption-1-semibold">Long subject and long snippet, compact</Text>
        <ListItem mail={{ ...MAIL[4]! }} onPress={fn().mockName('onPress')} testID="row-long" />
      </View>
    </Frame>
  ),
};

export const SelectionBar: Story = {
  render: () => (
    <Frame width={560}>
      <ListSelectionBar
        count={3}
        total={7}
        actions={BULK_ACTIONS}
        onSelectAll={fn().mockName('onSelectAll')}
        onClear={fn().mockName('onClear')}
        onAction={fn().mockName('onAction')}
        testID="bar"
      />
    </Frame>
  ),
};

export const LoadingAndEmpty: Story = {
  render: () => (
    <View style={{ gap: 24, width: '100%' }}>
      <Frame width={390}>
        <List
          items={[]}
          loading={true}
          loadingCount={5}
          accessibilityLabel={'Inbox'}
          testID={'loading'}
          empty={<EmptyState title="No messages" description="New messages will appear here." />}
        />
      </Frame>
      <Frame width={390}>
        <List
          items={[]}
          accessibilityLabel={'Inbox'}
          testID={'empty'}
          empty={<EmptyState title="No messages" description="New messages will appear here." />}
        />
      </Frame>
    </View>
  ),
};

/** Real pointer regression fixture: sibling controls must not open the row. */
export const PointerTargets: Story = {
  render: () => {
    const [opened, setOpened] = useState(0);
    const [starred, setStarred] = useState(false);
    const [checked, setChecked] = useState(false);
    const [archived, setArchived] = useState(0);
    return (
      <View style={{ width: 700, maxWidth: '100%', gap: 12 }}>
        <Text testID="hit-opened">{String(opened)}</Text>
        <Text testID="hit-archived">{String(archived)}</Text>
        {(['compact'] as const).map((density) => (
          <ListItem
            key={density}
            mail={{
              sender: { name: 'Pointer Sender' },
              subject: 'Click subject',
              snippet: 'Click preview',
              time: '09:41',
              hasAttachment: true,
              threadCount: 2,
              starred: starred,
              onStarredChange: setStarred,
            }}
            testID={`hit-${density}`}
            onPress={() => setOpened((n) => n + 1)}
          />
        ))}
        <ListItem
          mail={{ sender: { name: 'Action Sender' }, subject: 'Archive separately' }}
          testID="hit-actions"
          onPress={() => setOpened((n) => n + 1)}
          actions={[
            {
              key: 'archive',
              label: 'Archive',
              icon: RiArchiveLine,
              onPress: () => setArchived((n) => n + 1),
            },
          ]}
        />
        <ListItem
          mail={{ sender: { name: 'Selected Sender' }, subject: 'Select separately' }}
          testID="hit-selection"
          checked={checked}
          onCheckedChange={setChecked}
          onPress={() => setOpened((n) => n + 1)}
        />
      </View>
    );
  },
};

/** Secondary controls share the text column across avatar and density changes. */
export const Attachments: Story = {
  parameters: { bleed: true },
  render: () => {
    const [opened, setOpened] = useState('');
    return (
      <Frame width={520}>
        <Text testID="attachment-result">{opened}</Text>
        {(['compact'] as const).flatMap((density) =>
          (['avatar', 'hidden', 'selection'] as const).map((mode) => {
            const id = `attachments-${density}-${mode}`;
            return (
              <ListItem
                key={id}
                mail={{
                  sender: { name: 'Mireia Solans' },
                  subject: 'Roof survey',
                  snippet: 'The revised measurements are attached.',
                  time: '14:02',
                  showAvatar: mode !== 'hidden',
                  hasAttachment: true,
                }}
                onCheckedChange={mode === 'selection' ? () => undefined : undefined}
                active={mode === 'selection'}
                actions={ROW_ACTIONS}
                onPress={() => setOpened('message')}
                attachments={
                  <>
                    <Chip
                      leadingIcon={RiFileTextLine}
                      size="lg"
                      variant="outlined"
                      onPress={() => setOpened(`${id}-file`)}
                      testID={`${id}-file`}
                    >
                      survey.pdf
                    </Chip>
                    <Chip
                      leadingIcon={RiFileTextLine}
                      size="lg"
                      variant="outlined"
                      onPress={() => setOpened(`${id}-long-file`)}
                      style={{ maxWidth: 240 }}
                    >
                      measurements-and-revised-plan-for-the-roof.csv
                    </Chip>
                  </>
                }
                testID={id}
              />
            );
          }),
        )}
      </Frame>
    );
  },
};
