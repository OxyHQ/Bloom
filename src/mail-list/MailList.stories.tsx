import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { RiArchiveLine } from '../icons/remix/RiArchiveLine';
import { RiDeleteBinLine } from '../icons/remix/RiDeleteBinLine';
import { RiMailOpenLine } from '../icons/remix/RiMailOpenLine';
import { RiSpamLine } from '../icons/remix/RiSpamLine';
import { RiTimeLine } from '../icons/remix/RiTimeLine';
import { Sidebar } from '../sidebar';
import type { SidebarTree } from '../sidebar/types';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { MailList } from './MailList';
import { MailRow } from './MailRow';
import { MailSelectionBar } from './MailSelectionBar';
import { groupMailByDay } from './shared';
import type { MailAction, MailSummary } from './types';

const meta: Meta = {
  title: 'Blocks/Mail/Mail List',
};

export default meta;

type Story = StoryObj;

// ---------------------------------------------------------------------------
//  Demo data — invented people, invented companies, invented mail
// ---------------------------------------------------------------------------

const face = (seed: string) => `https://picsum.photos/seed/${seed}/160/160`;

const DAY = 86_400_000;
const NOW = Date.UTC(2026, 2, 14, 15, 0, 0);

const ROW_ACTIONS: MailAction[] = [
  { key: 'archive', label: 'Archive', icon: RiArchiveLine },
  { key: 'snooze', label: 'Snooze', icon: RiTimeLine },
  { key: 'delete', label: 'Delete', icon: RiDeleteBinLine, tone: 'negative' },
];

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

export const Inbox: Story = {
  render: () => {
    const sections = useMemo(
      () => groupMailByDay(MAIL, { now: NOW, formatDate: () => '11 March' }),
      [],
    );
    const [selected, setSelected] = useState<string | undefined>('invoice');
    return (
      <Frame width={390}>
        <MailList
          sections={sections}
          selectedId={selected}
          onMailPress={setSelected}
          rowActions={ROW_ACTIONS}
          onMailStarredChange={() => undefined}
          accessibilityLabel="Inbox"
          testID="inbox"
        />
      </Frame>
    );
  },
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
        <MailList
          density="compact"
          sections={sections}
          selectedId={selected}
          onMailPress={setSelected}
          rowActions={ROW_ACTIONS}
          onMailStarredChange={() => undefined}
          accessibilityLabel="Inbox"
          testID="inbox-compact"
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
        <MailList
          mails={MAIL.slice(0, 5)}
          density="compact"
          checkedIds={checked}
          onCheckedIdsChange={setChecked}
          bulkActions={BULK_ACTIONS}
          onBulkAction={() => undefined}
          accessibilityLabel="Inbox"
          testID="inbox-bulk"
        />
      </Frame>
    );
  },
};

export const WithMailboxTree: Story = {
  render: () => {
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
      <View style={{ flexDirection: 'row', height: 520 }}>
        {/* The mailbox tree is `Sidebar`'s `tree` prop — this family never grew
            one of its own. */}
        <Sidebar tree={tree} selectedTreeItem="inbox" />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Frame width={680}>
            <MailList
              density="compact"
              mails={MAIL}
              selectedId={selected}
              onMailPress={setSelected}
              rowActions={ROW_ACTIONS}
              accessibilityLabel="Inbox"
              testID="inbox-tree"
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
        <MailRow {...MAIL[0]!} onPress={() => undefined} testID="row-unread" />
        <Text variant="caption-1-semibold">Read, starred, three labels</Text>
        <MailRow {...MAIL[1]!} unread={false} onPress={() => undefined} testID="row-read" />
        <Text variant="caption-1-semibold">Draft</Text>
        <MailRow {...MAIL[3]!} onPress={() => undefined} testID="row-draft" />
        <Text variant="caption-1-semibold">Selected</Text>
        <MailRow {...MAIL[2]!} selected onPress={() => undefined} testID="row-selected" />
        <Text variant="caption-1-semibold">Multi-selected</Text>
        <MailRow
          {...MAIL[5]!}
          checked
          onCheckedChange={() => undefined}
          onPress={() => undefined}
          testID="row-checked"
        />
        <Text variant="caption-1-semibold">Long subject and long snippet, compact</Text>
        <MailRow {...MAIL[4]!} density="compact" onPress={() => undefined} testID="row-long" />
      </View>
    </Frame>
  ),
};

export const SelectionBar: Story = {
  render: () => (
    <Frame width={560}>
      <MailSelectionBar
        count={3}
        total={7}
        actions={BULK_ACTIONS}
        onSelectAll={() => undefined}
        onClear={() => undefined}
        onAction={() => undefined}
        testID="bar"
      />
    </Frame>
  ),
};

export const LoadingAndEmpty: Story = {
  render: () => (
    <View style={{ gap: 24, width: '100%' }}>
      <Frame width={390}>
        <MailList loading loadingCount={5} accessibilityLabel="Inbox" testID="loading" />
      </Frame>
      <Frame width={390}>
        <MailList mails={[]} accessibilityLabel="Inbox" testID="empty" />
      </Frame>
    </View>
  ),
};
