import { type ComponentType, forwardRef, type ReactNode } from 'react';
import { StyleSheet, Text } from 'react-native';
import { DetailDialog } from '@bloom/dialog/DetailDialog';
import * as Accordion from '@bloom/accordion';
import { AppShellPanels } from '@bloom/app-shell';
import { Button } from '@bloom/button';
import { Dialog } from '@bloom/dialog';
import * as Menu from '@bloom/dropdown-menu';
import { Portal, PortalOutlet, PortalProvider } from '@bloom/portal';
import { Screen, ScreenScrollView } from '@bloom/screen';
import * as Select from '@bloom/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@bloom/tooltip';
import { ProjectBoard, ProjectBoardCardContent } from '@bloom/project-board';
import type { ProjectColumn, ProjectMember } from '@bloom/project-board';
import { ProjectBoardPlatformContext } from '@bloom/project-board/context';
import { CreateTicketDialog } from '@bloom/project-board/CreateTicketDialog';
import { ProjectBoardCardSurface } from '@bloom/project-board/ProjectBoardCardSurface';
import { ProjectBoardEmptyState } from '@bloom/project-board/ProjectBoardEmptyState';
import {
  TicketAssigneeIcon,
  TicketFavoriteIcon,
  TicketStatusIcon,
  TicketUrgencyIcon,
} from '@bloom/project-board/ProjectBoardIcons';
import {
  TicketGenieSurface,
  TicketCornerGenieSurface,
} from '@bloom/project-board/TicketGenieSurface';
import { TicketTokenChart } from '@bloom/project-board/TicketTokenChart';
import type { Cases } from '../support/cases';

// The baseline's react-native-css draws a `transition-*` class through
// Reanimated's named `createAnimatedComponent` (`support/baseline.ts` lends it
// the mock's identity one). Reanimated 4's animated component consumes the CSS
// transition keys (its CSS engine runs them) and hands the view the rest: model
// that, so the dump shows what the view is given. Every transition here is of a
// value native never changes (hover is the web's), so it draws nothing there.
// Only react-native-css reads the named export; Bloom's own code takes the default.
const reanimated = require('react-native-reanimated');
reanimated.createAnimatedComponent = (Component: ComponentType<{ style?: unknown }>) =>
  forwardRef<unknown, { style?: unknown }>(function Animated(props, ref) {
    const style = Object.fromEntries(
      Object.entries(StyleSheet.flatten(props.style as never) ?? {}).filter(
        ([key]) => !key.startsWith('transition'),
      ),
    );
    return <Component {...props} ref={ref} style={style} />;
  });

const platform = {
  DetailDialog,
  ...Accordion,
  Screen,
  AppShellPanels,
  ScreenScrollView,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TicketGenieSurface,
  TicketCornerGenieSurface,
  Button,
  Dialog,
  Portal,
  ...Select,
  ...Menu,
};

const MEMBERS: Record<string, ProjectMember> = {
  maya: { id: 'maya', name: 'Maya Chen', initials: 'MC' },
  noah: { id: 'noah', name: 'Noah Williams', initials: 'NW' },
};

const COLUMNS: ProjectColumn[] = [
  {
    id: 'backlog',
    title: 'Backlog',
    limit: 8,
    tickets: [
      {
        id: 't-1',
        code: 'FE-1',
        area: 'Design',
        title: 'Prepare launch',
        since: '2d',
        priority: 'Low',
        project: 'Bloom',
        assignees: ['maya', 'noah'],
      },
      {
        id: 't-2',
        code: 'FE-2',
        area: 'Docs',
        title: 'Write the brief',
        since: '3d',
        priority: 'Medium',
        project: 'vibl',
        assignees: [],
      },
    ],
  },
  {
    id: 'in-progress',
    title: 'In progress',
    limit: 4,
    tickets: [
      {
        id: 't-3',
        code: 'FE-3',
        area: 'Board',
        title: 'Ship the board',
        description: 'Styles without className.',
        createdBy: 'maya',
        since: '1h',
        priority: 'High',
        project: 'Bloom',
        assignees: ['noah', 'maya'],
        isFavorite: true,
        comments: [
          { id: 'c-1', author: 'Maya Chen', body: 'Looks good.', time: '1h' },
          { id: 'c-2', author: 'Noah Williams', body: 'Shipping.', time: 'now' },
        ],
        resources: [{ label: 'Spec', href: 'https://example.com/spec' }],
        tokenUsage: {
          data: [
            { label: 'Sep 1', value: 3 },
            { label: 'Sep 2', value: 5 },
          ],
          headline: '8',
          delta: '+2',
          startLabel: 'Sep 1',
          endLabel: 'Sep 2',
        },
      },
      {
        id: 't-4',
        code: 'FE-4',
        area: 'Board',
        title: 'Fix the overlay',
        since: 'now',
        priority: 'Urgent',
        project: 'firstview',
        assignees: ['maya'],
      },
    ],
  },
  { id: 'done', title: 'Done', limit: 8, tickets: [] },
];

const portal = (children: ReactNode) => (
  <PortalProvider>
    {children}
    <PortalOutlet />
  </PortalProvider>
);

const board = (extra: Record<string, unknown> = {}) => (
  <ProjectBoard
    initialColumns={COLUMNS}
    members={MEMBERS}
    projects={['vibl', 'firstview', 'Bloom']}
    currentUserId="maya"
    {...extra}
  />
);

const create = (initialColumnId?: string) =>
  portal(
    <ProjectBoardPlatformContext.Provider value={platform}>
      <CreateTicketDialog
        title="Board"
        initialColumnId={initialColumnId}
        code="FE-90"
        columns={COLUMNS}
        projects={['Bloom', 'vibl']}
        members={MEMBERS}
        onClose={() => {}}
        onCreate={() => {}}
      />
    </ProjectBoardPlatformContext.Provider>,
  );

export const CASES: Cases = {
  'ProjectBoardCardContent plain': () => <ProjectBoardCardContent title="Ship the board" />,
  'ProjectBoardCardContent loaded': () => (
    <ProjectBoardCardContent
      preview={<Text>Preview</Text>}
      header="BLM-12"
      actions={<Text>…</Text>}
      badges={<Text>High</Text>}
      title="Ship the board"
      description="Styles without className"
      footer={<Text>Footer</Text>}
      testID="card"
    >
      <Text>Body</Text>
    </ProjectBoardCardContent>
  ),
  TicketTokenChart: () => (
    <TicketTokenChart
      title="Tokens"
      plotHeight={190}
      data={[
        { label: 'Jun 1', value: 3 },
        { label: 'Jun 2', value: 5 },
      ]}
    />
  ),
  'ProjectBoardCardSurface card': () => (
    <ProjectBoardCardSurface>
      <Text>Card</Text>
    </ProjectBoardCardSurface>
  ),
  'ProjectBoardCardSurface handle': () => (
    <ProjectBoardCardSurface wholeCardDrag={false}>
      <Text>Card</Text>
    </ProjectBoardCardSurface>
  ),
  'ProjectBoardCardSurface overlay': () => (
    <ProjectBoardCardSurface overlay>
      <Text>Card</Text>
    </ProjectBoardCardSurface>
  ),
  ProjectBoardEmptyState: () => <ProjectBoardEmptyState />,
  'Ticket icons': () => (
    <>
      <TicketStatusIcon status="backlog" />
      <TicketStatusIcon status="in-progress" />
      <TicketAssigneeIcon />
      <TicketUrgencyIcon />
      <TicketFavoriteIcon />
      <TicketFavoriteIcon selected />
    </>
  ),
  'ProjectBoard template': () => board({ onMenuClick: () => {}, ownerName: 'Maya' }),
  'ProjectBoard empty': () =>
    board({ initialColumns: COLUMNS.map((column) => ({ ...column, tickets: [] })) }),
  'ProjectBoard detail loaded': () => portal(board({ initialTicketId: 't-3' })),
  'ProjectBoard detail plain': () => portal(board({ initialTicketId: 't-2' })),
  'ProjectBoard controlled': () => (
    <ProjectBoard
      variant="embedded"
      columns={[
        { id: 'a', title: 'Planned', items: [{ id: 'x', title: 'Brief' }] },
        { id: 'b', title: 'Complete', items: [] },
      ]}
      getItemId={(item: { id: string }) => item.id}
      renderCard={(item: { title: string }) => <ProjectBoardCardContent title={item.title} />}
    />
  ),
  'CreateTicketDialog plain': () => create(),
  'CreateTicketDialog column': () => create('backlog'),
};
