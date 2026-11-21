import {
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

const sidebars: ParityCase[] = [
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
