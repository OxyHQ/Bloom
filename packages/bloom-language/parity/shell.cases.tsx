import { AppShell } from '@oxy.so/bloom/app-shell';
import { RiChatNewLine } from '@oxy.so/bloom/icons/RiChatNewLine';
import { RiSettings3Line } from '@oxy.so/bloom/icons/RiSettings3Line';
import { Text } from '@oxy.so/bloom/typography';

import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/primitives';
import { AppLayout, Panel, Stack } from '../src/router/nodes';
import { shellLayoutOf, sidebarOf } from '../src/router/shell-panels';
import type { ParityCase } from './support/cases';

const change = (_open: boolean) => {};
const resize = (_width: number) => {};
const press = () => {};
const NAVIGATOR = <Text>navigator</Text>;

/** The shell an `AppLayout` draws: its semantic layout, panels and sidebar, the navigator in its panel. */
function language(layout: ReturnType<typeof AppLayout>) {
  const sidebar = sidebarOf(layout as never, (value) => value as () => void);
  return (
    <AppShell
      safeArea={false}
      {...shellLayoutOf(layout as never, NAVIGATOR, undefined)}
      {...(sidebar ? { sidebar } : {})}
    />
  );
}

/** Allo's chats shell: a rail with its own rows and compose, a joined split the list's width resizes. */
const split: ParityCase[] = [
  {
    name: 'a joined split: a resizable list whose width is the app’s state, the navigator beside it',
    isolated: true,
    language: () =>
      language(
        AppLayout(Stack())
          .panelAppearance('joined')
          .panels(
            Panel('list', L.Text('list'))
              .resizable([360, resize])
              .minWidth('280')
              .maxWidth('520')
              .resizeLabel('Resize the list'),
            Panel('detail'),
            null,
          ),
      ),
    bloom: () => (
      <AppShell
        safeArea={false}
        panelLayout={{
          appearance: 'joined',
          panels: [
            {
              id: 'list',
              content: <Text>list</Text>,
              width: 360,
              onWidthChange: resize,
              minWidth: 280,
              maxWidth: 520,
              resizable: true,
              resizeLabel: 'Resize the list',
            },
            { id: 'detail', content: NAVIGATOR },
          ],
        }}
      />
    ),
  },
  {
    name: 'a rail sidebar: its logo, its own rows and compose, the destination in front; the shell’s widths',
    isolated: true,
    language: () =>
      language(
        AppLayout(Stack())
          .sidebar(
            L.Sidebar(
              L.NavItem('Settings', RiSettings3Line).id('settings').secondary().onPress(press),
            )
              .variant('rail')
              .searchable(false)
              .primaryAction(RiChatNewLine, 'New chat', press),
          )
          .activeDestination('settings')
          .navFrom('md')
          .contentMaxWidth('none')
          .reserveBottomBarSpace(false),
      ),
    bloom: () => (
      <AppShell
        safeArea={false}
        navFrom="md"
        contentMaxWidth="none"
        reserveBottomBarSpace={false}
        sidebar={{
          variant: 'rail',
          showSearch: false,
          secondaryItems: [
            { key: 'settings', label: 'Settings', icon: RiSettings3Line, onPress: press },
          ],
          selected: 'settings',
          primaryAction: { label: 'New chat', icon: RiChatNewLine, onPress: press },
        }}
      />
    ),
  },
];

export const SHELL_CASES: ParityCase[] = [
  ...split,

  ...ENUMS.shellLayout.map((layout) => ({
    name: `the ${layout} layout, the navigator in the main panel`,
    language: () => language(AppLayout(Stack()).shellLayout(layout).panels(Panel('main'))),
    bloom: () => (
      <AppShell
        safeArea={false}
        layout={layout}
        panelLayout={{ panels: [{ id: 'main', content: NAVIGATOR }] }}
      />
    ),
  })),
  ...ENUMS.shellPresentation.map((presentation) => ({
    name: `framed ${presentation}`,
    language: () =>
      language(AppLayout(Stack()).shellLayout('workspace').shellPresentation(presentation)),
    bloom: () => <AppShell safeArea={false} layout="workspace" presentation={presentation} />,
  })),
  {
    name: 'a workspace with a resizable collection and an open inspector',
    isolated: true,
    language: () =>
      language(
        AppLayout(Stack())
          .shellLayout('workspace')
          .panels(
            Panel('list', L.Text('list')).panelRole('collection').resizable().width('360'),
            Panel('main').panelRole('main'),
            Panel('details', L.Text('details'))
              .panelRole('inspector')
              .label('Details')
              .presented([true, change]),
          ),
      ),
    bloom: () => (
      <AppShell
        safeArea={false}
        layout="workspace"
        panelLayout={{
          panels: [
            {
              id: 'list',
              role: 'collection',
              content: <Text>list</Text>,
              resizable: true,
              width: 360,
            },
            { id: 'main', role: 'main', content: NAVIGATOR },
            {
              id: 'details',
              role: 'inspector',
              label: 'Details',
              content: <Text>details</Text>,
              open: true,
              onOpenChange: change,
            },
          ],
        }}
      />
    ),
  },
  {
    name: 'a deck: a hidden panel kept mounted',
    language: () =>
      language(
        AppLayout(Stack())
          .shellLayout('deck')
          .panels(
            Panel('main'),
            Panel('later', L.Text('later')).hidden().keepMounted().minWidth('320').maxWidth('448'),
          ),
      ),
    bloom: () => (
      <AppShell
        safeArea={false}
        layout="deck"
        panelLayout={{
          panels: [
            { id: 'main', content: NAVIGATOR },
            {
              id: 'later',
              content: <Text>later</Text>,
              visible: false,
              keepMounted: true,
              minWidth: 320,
              maxWidth: 448,
            },
          ],
        }}
      />
    ),
  },
];
