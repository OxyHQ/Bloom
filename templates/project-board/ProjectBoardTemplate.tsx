import type { ReactNode } from 'react';
import { ProjectBoard } from '../../src/project-board';
import { PROJECT_COLUMNS, PROJECT_MEMBERS } from './project-board-data';
import { ticketBrief, ticketDemoActivity } from './ticket-detail-data';

/** Demo-only history, resources and token series remain outside the package. */
export const PROJECT_BOARD_DEMO_COLUMNS = PROJECT_COLUMNS.map((column) => ({
  ...column,
  tickets: column.tickets.map((ticket) => {
    const activity = ticketDemoActivity(ticket);
    return {
      ...ticket,
      createdBy: ticket.assignees[0] ?? 'maya',
      description: ticketBrief(ticket).description.split('\n\n').slice(-1)[0],
      comments: activity.comments,
      resources: activity.resources,
      tokenUsage: {
        data: activity.series,
        headline: activity.total,
        delta: activity.change,
        startLabel: 'Sep 1',
        endLabel: 'Sep 16',
      },
    };
  }),
}));

export function ProjectBoardTemplate({
  onMenuClick,
  headerActions,
}: {
  onMenuClick?: () => void;
  headerActions?: ReactNode;
} = {}) {
  return (
    <ProjectBoard
      onMenuClick={onMenuClick}
      headerActions={headerActions}
      initialColumns={PROJECT_BOARD_DEMO_COLUMNS}
      members={PROJECT_MEMBERS}
      projects={['vibl', 'firstview', 'Bloom']}
      currentUserId="maya"
    />
  );
}
