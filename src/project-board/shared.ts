import type { BoardSort, ProjectColumn, ProjectTicket } from './types';

export function cloneColumns(
  columns: readonly ProjectColumn[],
): ProjectColumn[] {
  return columns.map((column) => ({
    ...column,
    tickets: column.tickets.map((ticket) => ({
      ...ticket,
      assignees: [...ticket.assignees],
      comments: ticket.comments?.map((comment) => ({ ...comment })),
      subtasks: ticket.subtasks?.map((task) => ({ ...task })),
    })),
  }));
}

/** Insert by full-column index so a filtered view does not destroy hidden tickets. */
export function moveTicket(
  columns: ProjectColumn[],
  id: string,
  destination: string,
  index = 0,
): ProjectColumn[] {
  const source = columns.find((column) =>
    column.tickets.some((ticket) => ticket.id === id),
  );
  const target = columns.find((column) => column.id === destination);
  const ticket = source?.tickets.find((item) => item.id === id);
  if (!source || !target || !ticket) return columns;
  return columns.map((column) => {
    if (column.id !== source.id && column.id !== destination) return column;
    const tickets = column.tickets.filter((item) => item.id !== id);
    if (column.id === destination)
      tickets.splice(Math.max(0, Math.min(index, tickets.length)), 0, ticket);
    return { ...column, tickets };
  });
}

export function updateTicket(
  columns: ProjectColumn[],
  id: string,
  patch: Partial<ProjectTicket>,
): ProjectColumn[] {
  return columns.map((column) => ({
    ...column,
    tickets: column.tickets.map((ticket) =>
      ticket.id === id ? { ...ticket, ...patch, id: ticket.id } : ticket,
    ),
  }));
}

export function sortColumns(
  columns: ProjectColumn[],
  sort: BoardSort,
): ProjectColumn[] {
  if (sort === 'manual') return columns;
  const rank = { Urgent: 0, High: 1, Medium: 2, Low: 3 };
  return columns.map((column) => ({
    ...column,
    tickets: [...column.tickets].sort((a, b) =>
      sort === 'priority'
        ? rank[a.priority] - rank[b.priority]
        : a.title.localeCompare(b.title),
    ),
  }));
}

export type BoardRect = { x: number; y: number; width: number; height: number };
/** Choose the column first; nearest-card comparisons across columns steal drops. */
export function dropTarget(
  x: number,
  y: number,
  columns: ProjectColumn[],
  columnRects: Record<string, BoardRect>,
  ticketRects: Record<string, BoardRect>,
  movingId: string,
) {
  const column = columns.find((item) => {
    const rect = columnRects[item.id];
    return (
      rect &&
      x >= rect.x &&
      x <= rect.x + rect.width &&
      y >= rect.y &&
      y <= rect.y + rect.height
    );
  });
  if (!column) return null;
  let index = column.tickets.length;
  for (let i = 0; i < column.tickets.length; i++) {
    const ticket = column.tickets[i];
    if (!ticket || ticket.id === movingId) continue;
    const rect = ticketRects[ticket.id];
    if (rect && y < rect.y + rect.height / 2) {
      index = i;
      break;
    }
  }
  const fromIndex = column.tickets.findIndex(
    (ticket) => ticket.id === movingId,
  );
  if (fromIndex >= 0 && fromIndex < index) index--;
  return { columnId: column.id, index };
}
