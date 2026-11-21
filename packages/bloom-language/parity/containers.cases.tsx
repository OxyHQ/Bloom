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
  SelectionCard,
} from '@oxy.so/bloom/card';
import { CappedChipRow, Chip, ChipRow } from '@oxy.so/bloom/chip';
import { EmptyState } from '@oxy.so/bloom/empty-state';
import { ErrorBoundary } from '@oxy.so/bloom/error-boundary';
import {
  GroupedSection,
  GroupedSectionCollapse,
  GroupedSectionDivider,
  GroupedSectionIcon,
  GroupedSectionItem,
} from '@oxy.so/bloom/grouped-section';
import { RiArrowRightLine, RiHeart3Line, RiInbox2Line, RiSettings3Line } from '@oxy.so/bloom/icons';
import { Item } from '@oxy.so/bloom/item';
import { Kbd } from '@oxy.so/bloom/kbd';
import { tokens } from '@oxy.so/bloom/styles';
import { Tabs, TabsContent, TabsTrigger } from '@oxy.so/bloom/tabs';
import { Text } from '@oxy.so/bloom/typography';

import * as C from '../src/controls/containers';
import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/primitives';
import { toElement } from '../src/render';
import { navigate } from '../src/router/nodes';
import { type ParityCase, Themed } from './support/cases';

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

// ── Wave 2's remaining containers ────────────────────────────────

const { space } = tokens;
/** Padding on every edge, as the language writes it (logical longhands). */
const padded = (value: number) => ({
  paddingTop: value,
  paddingBottom: value,
  paddingStart: value,
  paddingEnd: value,
});
const setOrder = (_from: string, _to: string) => {};

const more: ParityCase[] = [
  ...(['checkbox', 'radio', 'tab'] as const).map((role) => ({
    name: `Chip role ${role}`,
    language: () => toElement(C.Chip(L.Text('Mine')).toggle([true, setOn]).role(role)),
    bloom: () => (
      <Chip checked onCheckedChange={setOn} role={role}>
        Mine
      </Chip>
    ),
  })),
  {
    name: 'Chip inverted, chosen',
    language: () => toElement(C.Chip(L.Text('Mine')).style('inverted').selected()),
    bloom: () => (
      <Chip variant="inverted" selected>
        Mine
      </Chip>
    ),
  },
  {
    name: 'ChipRow',
    language: () =>
      toElement(
        C.ChipRow(C.Chip(L.Text('All')), C.Chip(L.Text('Unread')))
          .spacing('xs')
          .label('Filters'),
      ),
    bloom: () => (
      <ChipRow gap={space.xs} accessibilityLabel="Filters">
        <Chip>All</Chip>
        <Chip>Unread</Chip>
      </ChipRow>
    ),
  },
  {
    name: 'ChipRow a radio group, inset and disabled',
    language: () =>
      toElement(
        C.ChipRow(
          C.Chip(L.Text('Day')).toggle([true, setOn]).role('radio'),
          C.Chip(L.Text('Week')).toggle([false, setOn]).role('radio'),
        )
          .role('radiogroup')
          .contentInset('lg')
          .disabled()
          .testID('range'),
      ),
    bloom: () => (
      <ChipRow role="radiogroup" contentInset={space.lg} disabled testID="range">
        <Chip checked onCheckedChange={setOn} role="radio">
          Day
        </Chip>
        <Chip checked={false} onCheckedChange={setOn} role="radio">
          Week
        </Chip>
      </ChipRow>
    ),
  },
  {
    name: 'ChipRow fading into the card',
    language: () =>
      toElement(C.ChipRow(C.Chip(L.Text('All')), C.Chip(L.Text('Unread'))).fade('card')),
    bloom: () => (
      <Themed>
        {(c) => (
          <ChipRow fadeColor={c.card}>
            <Chip>All</Chip>
            <Chip>Unread</Chip>
          </ChipRow>
        )}
      </Themed>
    ),
  },
  {
    name: 'CappedChipRow',
    language: () =>
      toElement(
        C.CappedChipRow(C.Chip(L.Text('Design')), C.Chip(L.Text('Code')))
          .lines(1)
          .spacing('sm')
          .role('list')
          .label('Topics'),
      ),
    bloom: () => (
      <CappedChipRow maxLines={1} gap={space.sm} role="list" accessibilityLabel="Topics">
        <Chip>Design</Chip>
        <Chip>Code</Chip>
      </CappedChipRow>
    ),
  },
  ...(['comfortable', 'compact'] as const).map((density) => ({
    name: `Row density ${density}`,
    language: () => toElement(C.Row('Ana Lima').subtitle('Online').density(density)),
    bloom: () => <Item title="Ana Lima" subtitle="Online" contentDensity={density} />,
  })),
  {
    name: 'GroupedSection compact',
    language: () =>
      toElement(
        C.GroupedSection(C.GroupedSectionItem('Wi-Fi'), C.GroupedSectionItem('Bluetooth'))
          .title('Network')
          .density('compact'),
      ),
    bloom: () => (
      <GroupedSection title="Network" density="compact">
        <GroupedSectionItem title="Wi-Fi" />
        <GroupedSectionItem title="Bluetooth" />
      </GroupedSection>
    ),
  },
  {
    name: 'GroupedSectionItem with a box',
    language: () =>
      toElement(C.GroupedSectionItem('Wi-Fi').padding('md').frame({ minHeight: '56' })),
    bloom: () => (
      <GroupedSectionItem title="Wi-Fi" style={{ ...padded(space.md), minHeight: 56 }} />
    ),
  },
  {
    name: 'GroupedSectionItem pressable, with a box',
    language: () =>
      toElement(C.GroupedSectionItem('Wi-Fi').onPress(onPress).padding('xs').testID('wifi')),
    bloom: () => (
      <GroupedSectionItem title="Wi-Fi" onPress={onPress} testID="wifi" style={padded(space.xs)} />
    ),
  },
  ...([true, false] as const).map((open) => ({
    name: `GroupedSection with icons, a divider and a collapse ${open ? 'open' : 'closed'}`,
    language: () =>
      toElement(
        C.GroupedSection(
          C.GroupedSectionItem('Wi-Fi').leadingView(
            C.GroupedSectionIcon(RiSettings3Line).tint('success').testID('icon'),
          ),
          C.GroupedSectionDivider().inset('lg'),
          C.GroupedSectionItem('Bluetooth').leadingView(C.GroupedSectionIcon(RiInbox2Line)),
          C.GroupedSectionCollapse(open, C.GroupedSectionItem('Advanced')).testID('more'),
        ),
      ),
    bloom: () => (
      <GroupedSection>
        <GroupedSectionItem
          title="Wi-Fi"
          icon={
            <GroupedSectionIcon tone="success" testID="icon">
              {({ color, size }) => <RiSettings3Line width={size} height={size} fill={color} />}
            </GroupedSectionIcon>
          }
        />
        <GroupedSectionDivider inset={space.lg} />
        <GroupedSectionItem
          title="Bluetooth"
          icon={
            <GroupedSectionIcon>
              {({ color, size }) => <RiInbox2Line width={size} height={size} fill={color} />}
            </GroupedSectionIcon>
          }
        />
        <GroupedSectionCollapse open={open} testID="more">
          <GroupedSectionItem title="Advanced" />
        </GroupedSectionCollapse>
      </GroupedSection>
    ),
  })),
  {
    name: 'EmptyState with an illustration, content, suggestions and a caption',
    language: () =>
      toElement(
        C.EmptyState('No posts', L.Badge('New'))
          .description('Follow someone to fill your feed.')
          .illustration(L.Badge(3))
          .suggestions(
            L.Button(L.Icon(RiHeart3Line), L.Text('Popular')).id('popular').onPress(onPress),
            L.Button(L.Text('Nearby')).id('nearby').onPress(onPress),
          )
          .suggestionsLabel('Try')
          .caption(L.Badge('Or wait')),
      ),
    bloom: () => (
      <EmptyState
        title="No posts"
        description="Follow someone to fill your feed."
        illustration={<Badge content={3} />}
        suggestions={[
          { id: 'popular', label: 'Popular', icon: RiHeart3Line, onPress },
          { id: 'nearby', label: 'Nearby', onPress },
        ]}
        suggestionsLabel="Try"
        footer={<Badge content="Or wait" />}
      >
        <Badge content="New" />
      </EmptyState>
    ),
  },
  {
    name: 'EmptyState whose action navigates, holding a band open',
    language: () =>
      toElement(
        C.EmptyState('Nothing here')
          .action(L.Button(L.Text('Explore')).onPress(navigate('/explore')))
          .frame({ minHeight: '200' }),
      ),
    bloom: () => (
      <EmptyState title="Nothing here" action={{ label: 'Explore', onPress }} minHeight={200} />
    ),
  },
  {
    name: 'Tabs reorderable, an icon-only tab, a trailing control and a long press',
    language: () =>
      toElement(
        C.Tabs(
          ['inbox', setTab],
          C.TabItem('inbox', 'Inbox').reorderable(),
          C.TabItem('starred', 'Starred').icon(RiHeart3Line).iconOnly().reorderable(),
          C.TabItem('later', 'Later').trailing(L.Badge(2)).onLongPress(onPress),
        ).onReorder(setOrder),
      ),
    bloom: () => (
      <Tabs value="inbox" onValueChange={setTab} onReorder={setOrder}>
        <TabsTrigger value="inbox" label="Inbox" reorderable />
        <TabsTrigger
          value="starred"
          label="Starred"
          leadingIcon={RiHeart3Line}
          iconOnly
          reorderable
        />
        <TabsTrigger
          value="later"
          label="Later"
          trailing={<Badge content={2} />}
          onLongPress={onPress}
        />
      </Tabs>
    ),
  },
  {
    name: 'Tabs with their content',
    language: () =>
      toElement(
        C.Tabs(
          ['posts', setTab],
          C.TabItem('posts', 'Posts'),
          C.TabItem('replies', 'Replies'),
          C.TabContent('posts', L.Text('Your posts')).padding('md'),
          C.TabContent('replies', L.Text('Your replies')),
        ),
      ),
    bloom: () => (
      <Tabs value="posts" onValueChange={setTab}>
        <TabsTrigger value="posts" label="Posts" />
        <TabsTrigger value="replies" label="Replies" />
        <TabsContent value="posts" style={padded(space.md)}>
          <Text>Your posts</Text>
        </TabsContent>
        <TabsContent value="replies">
          <Text>Your replies</Text>
        </TabsContent>
      </Tabs>
    ),
  },
  ...([true, false] as const).map((selected) => ({
    name: `SelectionCard, one of a set, ${selected ? 'chosen' : 'not chosen'}`,
    language: () =>
      toElement(
        C.SelectionCard('Pro').description('For creators').selected(selected).onPress(onPress),
      ),
    bloom: () => (
      <SelectionCard
        selection="single"
        selected={selected}
        onPress={onPress}
        title="Pro"
        description="For creators"
      />
    ),
  })),
  {
    name: 'SelectionCard toggled, compact, with an icon, a mark, an illustration and a body',
    language: () =>
      toElement(
        C.SelectionCard('Backups', L.Badge('Daily'))
          .toggle([true, setOn])
          .icon(RiSettings3Line)
          .indicator('check')
          .illustration(L.Badge(1))
          .density('compact')
          .invalid()
          .testID('backups'),
      ),
    bloom: () => (
      <SelectionCard
        selection="multiple"
        selected
        onPress={onPress}
        title="Backups"
        icon={RiSettings3Line}
        indicator="check"
        media={<Badge content={1} />}
        compact
        invalid
        testID="backups"
      >
        <Badge content="Daily" />
      </SelectionCard>
    ),
  },
  {
    name: 'SelectionCard disabled, with padding',
    language: () =>
      toElement(C.SelectionCard('Team').selected(false).onPress(onPress).disabled().padding('sm')),
    bloom: () => (
      <SelectionCard
        selection="single"
        selected={false}
        onPress={onPress}
        title="Team"
        disabled
        style={padded(space.sm)}
      />
    ),
  },
  {
    name: 'ErrorBoundary with a box, around working content',
    language: () => toElement(C.ErrorBoundary(L.Badge(1)).padding('md').frame({ minHeight: '56' })),
    bloom: () => (
      <ErrorBoundary style={{ ...padded(space.md), minHeight: 56 }}>
        <Badge content={1} />
      </ErrorBoundary>
    ),
  },
  {
    name: 'ErrorBoundary that caught, its fallback a view of the error, in its box',
    language: () =>
      toElement(
        C.ErrorBoundary(L.Embed(<Broken />))
          .fallback(({ error }) => L.Badge(error.message))
          .padding('sm'),
      ),
    bloom: () => (
      <ErrorBoundary
        fallback={({ error }) => <Badge content={error.message} />}
        style={padded(space.sm)}
      >
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
  ...more,
];
