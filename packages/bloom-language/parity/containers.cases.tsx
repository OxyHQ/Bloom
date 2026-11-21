import {
  Admonition,
  AdmonitionButton,
  AdmonitionContent,
  AdmonitionIcon,
  AdmonitionRoot,
  AdmonitionRow,
  AdmonitionText,
} from '@oxy.so/bloom/admonition';
import { Badge } from '@oxy.so/bloom/badge';
import { Button } from '@oxy.so/bloom/button';
import {
  Card,
  CardBody,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@oxy.so/bloom/card';
import { Chip } from '@oxy.so/bloom/chip';
import { EmptyState } from '@oxy.so/bloom/empty-state';
import { ErrorBoundary } from '@oxy.so/bloom/error-boundary';
import { GroupedSection, GroupedSectionItem } from '@oxy.so/bloom/grouped-section';
import { RiArrowRightLine, RiHeart3Line, RiInbox2Line, RiSettings3Line } from '@oxy.so/bloom/icons';
import { Item } from '@oxy.so/bloom/item';
import { Kbd } from '@oxy.so/bloom/kbd';
import { Tabs, TabsTrigger } from '@oxy.so/bloom/tabs';

import * as C from '../src/controls/containers';
import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/primitives';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

const onPress = () => {};
const setTab = (_value: string) => {};
const setOn = (_value: boolean) => {};

// ── Card ─────────────────────────────────────────────────────────

const cards: ParityCase[] = [
  {
    name: 'Card with its parts',
    language: () =>
      toElement(
        C.Card(
          C.CardHeader(C.CardTitle('Storage'), C.CardDescription('3 of 5 GB used')),
          C.CardBody(L.Badge(3)),
          C.CardFooter(L.Button(L.Text('Manage'))),
        ),
      ),
    bloom: () => (
      <Card>
        <CardHeader>
          <CardTitle>Storage</CardTitle>
          <CardDescription>3 of 5 GB used</CardDescription>
        </CardHeader>
        <CardBody>
          <Badge content={3} />
        </CardBody>
        <CardFooter>
          <Button>Manage</Button>
        </CardFooter>
      </Card>
    ),
  },
  {
    name: 'Card title and description in one line each',
    language: () =>
      toElement(C.Card(C.CardTitle('A long title').lines(1), C.CardDescription('Notes').lines(1))),
    bloom: () => (
      <Card>
        <CardTitle numberOfLines={1}>A long title</CardTitle>
        <CardDescription numberOfLines={1}>Notes</CardDescription>
      </Card>
    ),
  },
  ...ENUMS.appearance.map((style) => ({
    name: `Card style ${style}`,
    language: () => toElement(C.Card(L.Badge(1)).style(style)),
    bloom: () => (
      <Card appearance={style}>
        <Badge content={1} />
      </Card>
    ),
  })),
  ...ENUMS.tone.map((tone) => ({
    name: `Card tint ${tone}`,
    language: () => toElement(C.Card(L.Badge(1)).style('solid').tint(tone)),
    bloom: () => (
      <Card appearance="solid" tone={tone}>
        <Badge content={1} />
      </Card>
    ),
  })),
  ...ENUMS.cardRadius.map((radius) => ({
    name: `Card radius ${radius}`,
    language: () => toElement(C.Card(L.Badge(1)).radius(radius)),
    bloom: () => (
      <Card radius={radius}>
        <Badge content={1} />
      </Card>
    ),
  })),
  ...ENUMS.cardElevation.map((elevation) => ({
    name: `Card elevation ${elevation}`,
    language: () => toElement(C.Card(L.Badge(1)).elevation(elevation)),
    bloom: () => (
      <Card elevation={elevation}>
        <Badge content={1} />
      </Card>
    ),
  })),
  ...ENUMS.cardBorder.map((border) => ({
    name: `Card outline ${border}`,
    language: () => toElement(C.Card(L.Badge(1)).outline(border)),
    bloom: () => (
      <Card border={border}>
        <Badge content={1} />
      </Card>
    ),
  })),
  {
    name: 'Card clipped',
    language: () => toElement(C.Card(L.Badge(1)).clipped()),
    bloom: () => (
      <Card clipContent>
        <Badge content={1} />
      </Card>
    ),
  },
  {
    name: 'Card pressable, named',
    language: () => toElement(C.Card(L.Badge(1)).onPress(onPress).label('Open plan')),
    bloom: () => (
      <Card onPress={onPress} accessibilityLabel="Open plan">
        <Badge content={1} />
      </Card>
    ),
  },
  {
    name: 'Card pressable, disabled',
    language: () => toElement(C.Card(L.Badge(1)).onPress(onPress).disabled()),
    bloom: () => (
      <Card onPress={onPress} disabled>
        <Badge content={1} />
      </Card>
    ),
  },
  {
    name: 'Card with a padding and a width',
    language: () => toElement(C.Card(L.Badge(1)).padding('lg').frame({ width: '5xl' })),
    bloom: () => (
      <Card
        style={{ paddingTop: 16, paddingBottom: 16, paddingStart: 16, paddingEnd: 16, width: 60 }}
      >
        <Badge content={1} />
      </Card>
    ),
  },
];

// ── Row (Item) ───────────────────────────────────────────────────

const rows: ParityCase[] = [
  {
    name: 'Row title',
    language: () => toElement(C.Row('Ana Lima')),
    bloom: () => <Item title="Ana Lima" />,
  },
  {
    name: 'Row title, subtitle and slots',
    language: () =>
      toElement(
        C.Row('Ana Lima').subtitle('Online').leadingView(L.Badge(2)).trailing(L.Badge('New')),
      ),
    bloom: () => (
      <Item
        title="Ana Lima"
        subtitle="Online"
        leading={<Badge content={2} />}
        trailing={<Badge content="New" />}
      />
    ),
  },
  ...ENUMS.controlSize.map((size) => ({
    name: `Row size ${size}`,
    language: () => toElement(C.Row('Inbox').subtitle('12 unread').size(size)),
    bloom: () => <Item title="Inbox" subtitle="12 unread" size={size} />,
  })),
  {
    name: 'Row pressable, named',
    language: () => toElement(C.Row('Settings').onPress(onPress).label('Open settings')),
    bloom: () => <Item title="Settings" onPress={onPress} accessibilityLabel="Open settings" />,
  },
  {
    name: 'Row disabled',
    language: () => toElement(C.Row('Settings').onPress(onPress).disabled()),
    bloom: () => <Item title="Settings" onPress={onPress} disabled />,
  },
  {
    name: 'Row destructive',
    language: () => toElement(C.Row('Delete').onPress(onPress).destructive()),
    bloom: () => <Item title="Delete" onPress={onPress} destructive />,
  },
  {
    name: 'Row selected',
    language: () => toElement(C.Row('Light').onPress(onPress).selected()),
    bloom: () => <Item title="Light" onPress={onPress} selected />,
  },
  {
    name: 'Row active',
    language: () => toElement(C.Row('Home').onPress(onPress).active(true)),
    bloom: () => <Item title="Home" onPress={onPress} active />,
  },
  {
    name: 'Row highlighted',
    language: () => toElement(C.Row('Open file').onPress(onPress).highlighted()),
    bloom: () => <Item title="Open file" onPress={onPress} highlighted />,
  },
  {
    name: 'Row title in two lines',
    language: () => toElement(C.Row('A title long enough to wrap').lines(2)),
    bloom: () => <Item title="A title long enough to wrap" titleNumberOfLines={2} />,
  },
];

// ── GroupedSection ───────────────────────────────────────────────

const grouped: ParityCase[] = [
  {
    name: 'GroupedSection with a title, a caption and rows',
    language: () =>
      toElement(
        C.GroupedSection(
          C.GroupedSectionItem('Wi-Fi').value('Home').chevron().onPress(onPress),
          C.GroupedSectionItem('Bluetooth').description('Off').onPress(onPress),
        )
          .title('Network')
          .caption('Changes apply at once.'),
      ),
    bloom: () => (
      <GroupedSection title="Network" footer="Changes apply at once.">
        <GroupedSectionItem title="Wi-Fi" value="Home" showChevron onPress={onPress} />
        <GroupedSectionItem title="Bluetooth" description="Off" onPress={onPress} />
      </GroupedSection>
    ),
  },
  ...ENUMS.groupedSectionStyle.map((style) => ({
    name: `GroupedSection style ${style}`,
    language: () => toElement(C.GroupedSection(C.GroupedSectionItem('Name')).style(style)),
    bloom: () => (
      <GroupedSection variant={style}>
        <GroupedSectionItem title="Name" />
      </GroupedSection>
    ),
  })),
  ...ENUMS.groupedSeparator.map((separator) => ({
    name: `GroupedSection separator ${separator}`,
    language: () =>
      toElement(
        C.GroupedSection(C.GroupedSectionItem('One'), C.GroupedSectionItem('Two')).separator(
          separator,
        ),
      ),
    bloom: () => (
      <GroupedSection separator={separator}>
        <GroupedSectionItem title="One" />
        <GroupedSectionItem title="Two" />
      </GroupedSection>
    ),
  })),
  {
    name: 'GroupedSection radius',
    language: () =>
      toElement(C.GroupedSection(C.GroupedSectionItem('Name')).radius('radius-24').testID('g')),
    bloom: () => (
      <GroupedSection radius="radius-24" testID="g">
        <GroupedSectionItem title="Name" />
      </GroupedSection>
    ),
  },
  {
    name: 'GroupedSectionItem with an icon and a control',
    language: () =>
      toElement(
        C.GroupedSectionItem('Notifications')
          .leadingView(L.Badge(4))
          .trailing(L.Badge('On'))
          .testID('row'),
      ),
    bloom: () => (
      <GroupedSectionItem
        title="Notifications"
        icon={<Badge content={4} />}
        rightElement={<Badge content="On" />}
        testID="row"
      />
    ),
  },
  {
    name: 'GroupedSectionItem destructive',
    language: () => toElement(C.GroupedSectionItem('Sign out').destructive().onPress(onPress)),
    bloom: () => <GroupedSectionItem title="Sign out" destructive onPress={onPress} />,
  },
  {
    name: 'GroupedSectionItem disabled',
    language: () => toElement(C.GroupedSectionItem('Export').disabled().onPress(onPress)),
    bloom: () => <GroupedSectionItem title="Export" disabled onPress={onPress} />,
  },
  {
    name: 'GroupedSectionItem named, hinted, two lines',
    language: () =>
      toElement(
        C.GroupedSectionItem('A title long enough to wrap')
          .lines(2)
          .onPress(onPress)
          .label('Privacy')
          .hint('Opens privacy settings'),
      ),
    bloom: () => (
      <GroupedSectionItem
        title="A title long enough to wrap"
        titleNumberOfLines={2}
        onPress={onPress}
        accessibilityLabel="Privacy"
        accessibilityHint="Opens privacy settings"
      />
    ),
  },
];

// ── Chip ─────────────────────────────────────────────────────────

const chips: ParityCase[] = [
  {
    name: 'Chip',
    language: () => toElement(C.Chip(L.Text('Design'))),
    bloom: () => <Chip>Design</Chip>,
  },
  ...ENUMS.appearance.map((style) => ({
    name: `Chip style ${style}`,
    language: () => toElement(C.Chip(L.Text('Design')).style(style)),
    bloom: () => <Chip appearance={style}>Design</Chip>,
  })),
  ...ENUMS.tone.map((tone) => ({
    name: `Chip tint ${tone}`,
    language: () => toElement(C.Chip(L.Text('Design')).tint(tone)),
    bloom: () => <Chip tone={tone}>Design</Chip>,
  })),
  ...ENUMS.chipSize.map((size) => ({
    name: `Chip size ${size}`,
    language: () => toElement(C.Chip(L.Text('Design')).size(size)),
    bloom: () => <Chip size={size}>Design</Chip>,
  })),
  ...ENUMS.chipHue.map((hue) => ({
    name: `Chip hue ${hue}`,
    language: () => toElement(C.Chip(L.Text('Design')).hue(hue)),
    bloom: () => <Chip hue={hue}>Design</Chip>,
  })),
  {
    name: 'Chip with glyphs',
    language: () =>
      toElement(C.Chip(L.Icon(RiHeart3Line), L.Text('Liked'), L.Icon(RiArrowRightLine))),
    bloom: () => (
      <Chip leadingIcon={RiHeart3Line} trailingIcon={RiArrowRightLine}>
        Liked
      </Chip>
    ),
  },
  ...[true, false].map((on) => ({
    name: `Chip toggle ${on ? 'on' : 'off'}`,
    language: () => toElement(C.Chip(L.Text('Unread')).toggle([on, setOn])),
    bloom: () => (
      <Chip checked={on} onCheckedChange={setOn}>
        Unread
      </Chip>
    ),
  })),
  {
    name: 'Chip selected, pressable',
    language: () => toElement(C.Chip(L.Text('All')).selected().onPress(onPress)),
    bloom: () => (
      <Chip selected onPress={onPress}>
        All
      </Chip>
    ),
  },
  {
    name: 'Chip with a remove button',
    language: () => toElement(C.Chip(L.Text('Paris')).onClose(onPress, 'Remove Paris')),
    bloom: () => (
      <Chip onClose={onPress} closeLabel="Remove Paris">
        Paris
      </Chip>
    ),
  },
  {
    name: 'Chip disabled',
    language: () => toElement(C.Chip(L.Text('Design')).onPress(onPress).disabled()),
    bloom: () => (
      <Chip onPress={onPress} disabled>
        Design
      </Chip>
    ),
  },
];

// ── EmptyState ───────────────────────────────────────────────────

const empty: ParityCase[] = [
  {
    name: 'EmptyState title and description',
    language: () =>
      toElement(C.EmptyState('No messages').description('New messages show up here.')),
    bloom: () => <EmptyState title="No messages" description="New messages show up here." />,
  },
  ...ENUMS.emptyStateMedia.map((media) => ({
    name: `EmptyState media ${media}`,
    language: () => toElement(C.EmptyState('No messages').icon(RiInbox2Line).media(media)),
    bloom: () => <EmptyState title="No messages" icon={RiInbox2Line} media={media} />,
  })),
  ...ENUMS.emptyStateStyle.map((style) => ({
    name: `EmptyState style ${style}`,
    language: () => toElement(C.EmptyState('No messages').icon(RiInbox2Line).style(style)),
    bloom: () => <EmptyState title="No messages" icon={RiInbox2Line} variant={style} />,
  })),
  {
    name: 'EmptyState with actions',
    language: () =>
      toElement(
        C.EmptyState('Nothing saved')
          .action(L.Button(L.Icon(RiHeart3Line), L.Text('Browse')).onPress(onPress))
          .secondaryAction(
            L.Button(L.Text('Learn more')).onPress(onPress).label('Learn more about saving'),
          ),
      ),
    bloom: () => (
      <EmptyState
        title="Nothing saved"
        action={{ label: 'Browse', icon: RiHeart3Line, onPress }}
        secondaryAction={{
          label: 'Learn more',
          onPress,
          accessibilityLabel: 'Learn more about saving',
        }}
      />
    ),
  },
  {
    name: 'EmptyState action busy and disabled',
    language: () =>
      toElement(
        C.EmptyState('Offline').action(L.Button(L.Text('Retry')).onPress(onPress).loading()),
      ),
    bloom: () => <EmptyState title="Offline" action={{ label: 'Retry', onPress, loading: true }} />,
  },
  {
    name: 'EmptyState named, with a testID',
    language: () => toElement(C.EmptyState('No results').label('No results found').testID('e')),
    bloom: () => <EmptyState title="No results" accessibilityLabel="No results found" testID="e" />,
  },
];

// ── Admonition ───────────────────────────────────────────────────

const admonitions: ParityCase[] = [
  ...ENUMS.admonitionStyle.map((style) => ({
    name: `Admonition style ${style}`,
    language: () => toElement(C.Admonition(L.Text('Saved to your library.')).style(style)),
    bloom: () => <Admonition type={style}>Saved to your library.</Admonition>,
  })),
  ...ENUMS.controlSize.map((size) => ({
    name: `Admonition size ${size}`,
    language: () => toElement(C.Admonition(L.Text('Saved.')).size(size)),
    bloom: () => <Admonition size={size}>Saved.</Admonition>,
  })),
  {
    name: 'Admonition with an action, composed',
    language: () =>
      toElement(
        C.Admonition(L.Text('Sync is paused.'), L.Button(L.Text('Resume')).onPress(onPress)).style(
          'warning',
        ),
      ),
    bloom: () => (
      <AdmonitionRoot type="warning">
        <AdmonitionRow>
          <AdmonitionIcon />
          <AdmonitionContent>
            <AdmonitionText>Sync is paused.</AdmonitionText>
            <AdmonitionButton onPress={onPress}>Resume</AdmonitionButton>
          </AdmonitionContent>
        </AdmonitionRow>
      </AdmonitionRoot>
    ),
  },
  {
    name: 'Admonition pulled up under its neighbour',
    language: () => toElement(C.Admonition(L.Text('Saved.')).padding('bottom', '-md')),
    bloom: () => <Admonition style={{ marginBottom: -12 }}>Saved.</Admonition>,
  },
];

// ── Tabs ─────────────────────────────────────────────────────────

const tabs: ParityCase[] = [
  {
    name: 'Tabs',
    language: () =>
      toElement(
        C.Tabs(
          ['posts', setTab],
          C.TabItem('posts', 'Posts'),
          C.TabItem('replies', 'Replies'),
        ).label('Profile sections'),
      ),
    bloom: () => (
      <Tabs label="Profile sections" value="posts" onValueChange={setTab}>
        <TabsTrigger value="posts" label="Posts" />
        <TabsTrigger value="replies" label="Replies" />
      </Tabs>
    ),
  },
  ...ENUMS.tabsStyle.map((style) => ({
    name: `Tabs style ${style}`,
    language: () =>
      toElement(
        C.Tabs(
          ['all', setTab],
          C.TabItem('all', 'All'),
          C.TabItem('tools', 'Tools').icon(RiSettings3Line),
        ).style(style),
      ),
    bloom: () => (
      <Tabs variant={style} value="all" onValueChange={setTab}>
        <TabsTrigger value="all" label="All" />
        <TabsTrigger value="tools" label="Tools" leadingIcon={RiSettings3Line} />
      </Tabs>
    ),
  })),
  {
    name: 'Tabs full width, counts, a disabled tab',
    language: () =>
      toElement(
        C.Tabs(
          ['inbox', setTab],
          C.TabItem('inbox', 'Inbox').count(12),
          C.TabItem('sent', 'Sent').disabled().testID('sent'),
        )
          .fullWidth()
          .testID('tabs'),
      ),
    bloom: () => (
      <Tabs fullWidth value="inbox" onValueChange={setTab} testID="tabs">
        <TabsTrigger value="inbox" label="Inbox" count={12} />
        <TabsTrigger value="sent" label="Sent" disabled testID="sent" />
      </Tabs>
    ),
  },
];

// ── Kbd, ErrorBoundary ───────────────────────────────────────────

const keys: ParityCase[] = [
  { name: 'Kbd', language: () => toElement(C.Kbd('⌘K')), bloom: () => <Kbd>⌘K</Kbd> },
  ...ENUMS.kbdSize.map((size) => ({
    name: `Kbd size ${size}`,
    language: () => toElement(C.Kbd('Esc').size(size)),
    bloom: () => <Kbd size={size}>Esc</Kbd>,
  })),
];

function Broken(): never {
  throw new Error('parity: a broken view');
}

const boundaries: ParityCase[] = [
  {
    name: 'ErrorBoundary around working content',
    language: () => toElement(C.ErrorBoundary(L.Badge(1)).testID('b')),
    bloom: () => (
      <ErrorBoundary testID="b">
        <Badge content={1} />
      </ErrorBoundary>
    ),
  },
  {
    name: 'ErrorBoundary that caught, with its words',
    language: () =>
      toElement(
        C.ErrorBoundary(L.Embed(<Broken />))
          .title('This panel failed')
          .message('Try again in a moment.')
          .retryLabel('Reload'),
      ),
    bloom: () => (
      <ErrorBoundary title="This panel failed" message="Try again in a moment." retryLabel="Reload">
        <Broken />
      </ErrorBoundary>
    ),
  },
  {
    name: 'ErrorBoundary that caught, with a fallback',
    language: () => toElement(C.ErrorBoundary(L.Embed(<Broken />)).fallback(L.Badge('Failed'))),
    bloom: () => (
      <ErrorBoundary fallback={<Badge content="Failed" />}>
        <Broken />
      </ErrorBoundary>
    ),
  },
];

export const CONTAINER_CASES: ParityCase[] = [
  ...cards,
  ...rows,
  ...grouped,
  ...chips,
  ...empty,
  ...admonitions,
  ...tabs,
  ...keys,
  ...boundaries,
];
