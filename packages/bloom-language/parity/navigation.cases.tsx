import {
  RiComputerLine,
  RiFileLine,
  RiFolderLine,
  RiHome5Fill,
  RiHome5Line,
  RiSearchLine,
  RiSettings3Line,
} from '@oxy.so/bloom/icons';
import { PageFooter } from '@oxy.so/bloom/page-footer';
import { Rail } from '@oxy.so/bloom/rail';
import { Sidebar } from '@oxy.so/bloom/sidebar';
import { Text } from '@oxy.so/bloom/typography';

import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/primitives';
import { toElement } from '../src/render';
import { type ParityCase, Themed } from './support/cases';

const noop = () => {};
const select = (_id: string) => {};
const typed = (_query: string) => {};
const dropped = () => {};

const TEAM = {
  name: 'Acme',
  email: 'team@acme.dev',
  avatar: { initials: 'A', shape: 'squircle' as const },
  footer: { label: 'Oxy', version: '1.0' },
};
const PLAN = { name: 'Ana Lima', plan: 'Pro Plan', actionLabel: 'Upgrade', onAction: noop };
const STEPS = [
  { key: 'invite', label: 'Invite your team' },
  { key: 'import', label: 'Import your notes', completed: true },
  { key: 'connect', label: 'Connect a calendar' },
];

const sidebars: ParityCase[] = [
  ...ENUMS.modePresentation.map((presentation) => ({
    name: `modes, ${presentation}, one selected`,
    language: () =>
      toElement(
        L.Sidebar(
          L.SidebarMode('Search', RiSearchLine).id('search').shortcut('⌥⌃1'),
          L.SidebarMode('Computer', RiComputerLine).id('computer'),
          L.NavItem('Home', RiHome5Line).id('home'),
        )
          .mode('computer')
          .onModeChange(select)
          .modePresentation(presentation)
          .modesLabel('Mode'),
      ),
    bloom: () => (
      <Sidebar
        items={[{ key: 'home', label: 'Home', icon: RiHome5Line }]}
        modes={[
          { key: 'search', label: 'Search', icon: RiSearchLine, shortcut: '⌥⌃1' },
          { key: 'computer', label: 'Computer', icon: RiComputerLine },
        ]}
        mode="computer"
        onModeChange={select}
        modesPresentation={presentation}
        modesLabel="Mode"
      />
    ),
  })),
  ...ENUMS.teamPlacement.map((placement) => ({
    name: `a team, placed in the ${placement}`,
    language: () =>
      toElement(L.Sidebar(L.NavItem('Home', RiHome5Line)).team(TEAM).teamPlacement(placement)),
    bloom: () => (
      <Sidebar
        items={[{ key: 'Home', label: 'Home', icon: RiHome5Line }]}
        team={TEAM}
        teamPlacement={placement}
      />
    ),
  })),
  {
    name: 'a plan card at the foot',
    language: () => toElement(L.Sidebar(L.NavItem('Home', RiHome5Line)).plan(PLAN)),
    bloom: () => (
      <Sidebar items={[{ key: 'Home', label: 'Home', icon: RiHome5Line }]} plan={PLAN} />
    ),
  },
  {
    name: 'a getting-started card with its leading mark',
    language: () =>
      toElement(
        L.Sidebar(L.NavItem('Home', RiHome5Line)).onboarding({
          title: 'Get started',
          leading: L.Text('O'),
          steps: STEPS,
          visibleCount: 2,
          onPress: noop,
          onSeeAll: noop,
          seeAllLabel: 'See every step',
        }),
      ),
    bloom: () => (
      <Sidebar
        items={[{ key: 'Home', label: 'Home', icon: RiHome5Line }]}
        onboarding={{
          title: 'Get started',
          leading: <Text>O</Text>,
          steps: STEPS,
          visibleCount: 2,
          onPress: noop,
          onSeeAll: noop,
          seeAllLabel: 'See every step',
        }}
      />
    ),
  },
  {
    name: 'a quick search held by the app',
    language: () =>
      toElement(
        L.Sidebar(L.NavItem('Home', RiHome5Line), L.NavItem('Search', RiSearchLine)).query([
          'ho',
          typed,
        ]),
      ),
    bloom: () => (
      <Sidebar
        items={[
          { key: 'Home', label: 'Home', icon: RiHome5Line },
          { key: 'Search', label: 'Search', icon: RiSearchLine },
        ]}
        searchQuery="ho"
        onSearchQueryChange={typed}
      />
    ),
  },
  {
    name: 'a tree that takes drops: draggable rows and their rules',
    language: () =>
      toElement(
        L.Sidebar(
          L.TreeSection(
            'Private',
            L.TreeItem('Roadmap', L.TreeItem('Q1').id('q1').draggable()).id('roadmap').draggable(),
            L.TreeItem('Team').id('team').draggable().dropBeside(false),
            L.TreeItem('Notes').id('notes').draggable().droppable(false),
          ).id('private'),
          L.TreeSection('Shared', L.TreeItem('Theirs').id('theirs')).id('shared').droppable(false),
        ).onDrop(dropped),
      ),
    bloom: () => (
      <Sidebar
        tree={[
          {
            key: 'private',
            label: 'Private',
            items: [
              {
                key: 'roadmap',
                label: 'Roadmap',
                draggable: true,
                items: [{ key: 'q1', label: 'Q1', draggable: true }],
              },
              { key: 'team', label: 'Team', draggable: true, dropBeside: false },
              { key: 'notes', label: 'Notes', draggable: true, droppable: false },
            ],
          },
          {
            key: 'shared',
            label: 'Shared',
            droppable: false,
            items: [{ key: 'theirs', label: 'Theirs' }],
          },
        ]}
        onTreeItemDrop={dropped}
      />
    ),
  },
  {
    name: 'destinations, one secondary, one selected',
    language: () =>
      toElement(
        L.Sidebar(
          L.NavItem('Home', RiHome5Line).id('home').activeIcon(RiHome5Fill).link('/'),
          L.NavItem('Search', RiSearchLine).id('search').badge(3).shortcut('⌘K').onPress(noop),
          L.NavItem('Settings', RiSettings3Line).id('settings').secondary(),
        ).selection('home'),
      ),
    bloom: () => (
      <Sidebar
        items={[
          { key: 'home', label: 'Home', icon: RiHome5Line, activeIcon: RiHome5Fill, href: '/' },
          {
            key: 'search',
            label: 'Search',
            icon: RiSearchLine,
            badge: 3,
            shortcut: '⌘K',
            onPress: noop,
          },
        ]}
        secondaryItems={[{ key: 'settings', label: 'Settings', icon: RiSettings3Line }]}
        selected="home"
        selectedTreeItem="home"
      />
    ),
  },
  {
    name: 'a tree: a section with a folder and nested rows, selected',
    language: () =>
      toElement(
        L.Sidebar(
          L.TreeSection(
            'Projects',
            L.TreeFolder('Archive', L.TreeItem('Old').id('old')).id('archive').expanded(true),
            L.TreeItem('Roadmap', L.TreeItem('Q1').id('q1').subtitle('Planning').meta('3'))
              .id('roadmap')
              .icon(RiFileLine),
          )
            .id('projects')
            .collapsible()
            .emptyLabel('Nothing yet'),
        )
          .selection('q1')
          .onSelect(select),
      ),
    bloom: () => (
      <Sidebar
        tree={[
          {
            key: 'projects',
            label: 'Projects',
            items: [
              {
                key: 'roadmap',
                label: 'Roadmap',
                icon: RiFileLine,
                items: [{ key: 'q1', label: 'Q1', description: 'Planning', meta: '3' }],
              },
            ],
            folders: [
              {
                key: 'archive',
                label: 'Archive',
                open: true,
                items: [{ key: 'old', label: 'Old' }],
              },
            ],
            collapsible: true,
            emptyLabel: 'Nothing yet',
          },
        ]}
        selected="q1"
        selectedTreeItem="q1"
        onNavigate={noop}
        onTreeItemPress={noop}
      />
    ),
  },
  {
    name: 'a row’s actions, a loading section with an error',
    language: () =>
      toElement(
        L.Sidebar(
          L.TreeSection('Teams', L.TreeItem('Design').trailing(L.Text('+')))
            .trailing(L.Text('new'))
            .loading()
            .error('Offline'),
        ),
      ),
    bloom: () => (
      <Sidebar
        tree={[
          {
            label: 'Teams',
            actions: <Text>new</Text>,
            items: [{ key: 'Design', label: 'Design', actions: <Text>+</Text> }],
            loading: true,
            error: 'Offline',
          },
        ]}
      />
    ),
  },
  ...ENUMS.sidebarSurface.map((surface) => ({
    name: `surface ${surface}`,
    language: () =>
      toElement(L.Sidebar(L.NavItem('Home', RiHome5Line)).surface(surface).searchable(false)),
    bloom: () => (
      <Sidebar
        items={[{ key: 'Home', label: 'Home', icon: RiHome5Line }]}
        surface={surface}
        showSearch={false}
      />
    ),
  })),
  ...ENUMS.sidebarSize.map((size) => ({
    name: `size ${size}`,
    language: () => toElement(L.Sidebar(L.NavItem('Home', RiHome5Line)).size(size)),
    bloom: () => (
      <Sidebar items={[{ key: 'Home', label: 'Home', icon: RiHome5Line }]} size={size} />
    ),
  })),
  {
    name: 'the rail variant, collapsed, no theme toggle, a header, toolbar and footer',
    language: () =>
      toElement(
        L.Sidebar(L.NavItem('Home', RiHome5Line))
          .variant('rail')
          .collapsed()
          .onCollapsedChange(noop)
          .themeToggle(false)
          .header(L.Text('Oxy'))
          .toolbar(L.Text('tools'))
          .footer(L.Text('me'))
          .label('Navigation')
          .testID('nav'),
      ),
    bloom: () => (
      <Sidebar
        items={[{ key: 'Home', label: 'Home', icon: RiHome5Line }]}
        variant="rail"
        collapsed
        onCollapsedChange={noop}
        showThemeToggle={false}
        header={<Text>Oxy</Text>}
        toolbar={<Text>tools</Text>}
        footer={<Text>me</Text>}
        accessibilityLabel="Navigation"
        testID="nav"
      />
    ),
  },
  {
    name: 'a logo and an account',
    language: () =>
      toElement(
        L.Sidebar(L.NavItem('Home', RiHome5Line))
          .logo({ wordmark: 'Oxy', accessibilityLabel: 'Oxy home' })
          .account({ name: 'Ada Lovelace', email: 'ada@oxy.so' }),
      ),
    bloom: () => (
      <Sidebar
        items={[{ key: 'Home', label: 'Home', icon: RiHome5Line }]}
        logo={{ wordmark: 'Oxy', accessibilityLabel: 'Oxy home' }}
        account={{ name: 'Ada Lovelace', email: 'ada@oxy.so' }}
      />
    ),
  },
];

const rails: ParityCase[] = [
  {
    name: 'a rail of three, one active, with its header, footer and width',
    language: () =>
      toElement(
        L.Rail(
          L.RailItem('Home', L.Icon(RiHome5Line).foreground('muted'))
            .id('home')
            .activeIcon(L.Icon(RiHome5Fill).foreground('primary')),
          L.RailItem('Files', L.Icon(RiFolderLine).foreground('muted')).id('files'),
          L.RailItem('Settings', L.Icon(RiSettings3Line).foreground('muted')).id('settings'),
        )
          .selection('home')
          .onSelect(select)
          .header(L.Text('O'))
          .footer(L.Text('me'))
          .width('96')
          .testID('rail'),
      ),
    bloom: () => (
      <Themed>
        {(c) => (
          <Rail
            items={[
              {
                id: 'home',
                label: 'Home',
                icon: <RiHome5Line size="md" fill={c.textSecondary} />,
                activeIcon: <RiHome5Fill size="md" fill={c.primary} />,
              },
              {
                id: 'files',
                label: 'Files',
                icon: <RiFolderLine size="md" fill={c.textSecondary} />,
              },
              {
                id: 'settings',
                label: 'Settings',
                icon: <RiSettings3Line size="md" fill={c.textSecondary} />,
              },
            ]}
            activeId="home"
            onSelect={select}
            header={<Text>O</Text>}
            footer={<Text>me</Text>}
            width={96}
            testID="rail"
          />
        )}
      </Themed>
    ),
  },
];

const footers: ParityCase[] = [
  {
    name: 'a page footer with its actions',
    language: () => toElement(L.PageFooter(L.Text('2 selected')).toolbar(L.Text('Delete'))),
    bloom: () => (
      <PageFooter actions={<Text>Delete</Text>}>
        <Text>2 selected</Text>
      </PageFooter>
    ),
  },
  ...ENUMS.footerPinning.map((pinning) => ({
    name: `pinned ${pinning}`,
    // A document footer is fixed where its anchor measures, in the window.
    ...(pinning === 'document' ? { isolated: true as const } : {}),
    language: () => toElement(L.PageFooter().toolbar(L.Text('Save')).pinning(pinning)),
    bloom: () => <PageFooter actions={<Text>Save</Text>} position={pinning} />,
  })),
  ...ENUMS.scrollEdge.map((edge) => ({
    name: `scrim ${edge}, no safe area`,
    language: () =>
      toElement(
        L.PageFooter().toolbar(L.Text('Save')).scrollEdge(edge).ignoresSafeArea().testID('foot'),
      ),
    bloom: () => (
      <PageFooter actions={<Text>Save</Text>} scrim={edge} safeArea={false} testID="foot" />
    ),
  })),
];

export const NAVIGATION_CASES: ParityCase[] = [...sidebars, ...rails, ...footers];
