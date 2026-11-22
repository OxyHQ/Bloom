import { AppShell } from '@oxy.so/bloom/app-shell';
import { Text } from '@oxy.so/bloom/typography';

import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/primitives';
import { AppLayout, Panel, Stack } from '../src/router/nodes';
import { shellLayoutOf } from '../src/router/shell-panels';
import type { ParityCase } from './support/cases';

const change = (_open: boolean) => {};
const NAVIGATOR = <Text>navigator</Text>;

/** The shell an `AppLayout` draws: its semantic layout and panels, the navigator in its panel. */
function language(layout: ReturnType<typeof AppLayout>) {
  return <AppShell safeArea={false} {...shellLayoutOf(layout as never, NAVIGATOR, undefined)} />;
}

export const SHELL_CASES: ParityCase[] = [
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
