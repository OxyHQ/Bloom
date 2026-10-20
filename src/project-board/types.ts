import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { TokensChartCardProps } from '../chart-cards/TokensChartCard';

/** Items remain opaque: the product owns its schema, grouping and persistence. */
export interface BoardColumn<Item> {
  id: string;
  title: string;
  items: readonly Item[];
}

export interface BoardMove {
  itemId: string;
  fromColumnId: string;
  toColumnId: string;
}

export interface BoardProps<Item> {
  columns: readonly BoardColumn<Item>[];
  getItemId: (item: Item) => string;
  renderCard: (item: Item, column: BoardColumn<Item>, state: { isDragging: boolean }) => ReactNode;
  renderColumnHeader?: (column: BoardColumn<Item>, state: { isDropTarget: boolean }) => ReactNode;
  renderColumnFooter?: (column: BoardColumn<Item>) => ReactNode;
  renderEmptyColumn?: (column: BoardColumn<Item>) => ReactNode;
  /** Request only: update columns after accepting the move. No internal data copy. */
  onMove?: (move: BoardMove) => void;
  /** Disables pointer moves. Also disable mutation actions in supplied card slots. */
  readOnly?: boolean;
  columnWidth?: number;
  columnStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  className?: string;
  accessibilityLabel?: string;
  testID?: string;
}

export type TicketSubtask = { id: string; title: string; done: boolean };
export type TicketComment = {
  id: string;
  author: string;
  body: string;
  time: string;
};
export type ProjectMember = {
  id: string;
  name: string;
  avatar?: string;
  initials: string;
};
export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type BoardSort = 'manual' | 'priority' | 'title';
export type ProjectTicket = {
  id: string;
  code: string;
  area: string;
  title: string;
  since: string;
  description?: string;
  subtasks?: TicketSubtask[];
  comments?: TicketComment[];
  isFavorite?: boolean;
  createdBy?: string;
  priority: TicketPriority;
  project: string;
  assignees: string[];
  resources?: { label: string; href: string }[];
  tokenUsage?: Pick<
    TokensChartCardProps,
    'data' | 'headline' | 'delta' | 'startLabel' | 'endLabel'
  >;
};
export type ProjectColumn = {
  id: string;
  title: string;
  limit: number;
  tickets: ProjectTicket[];
};
export type NewProjectTicket = Pick<
  ProjectTicket,
  'title' | 'priority' | 'project' | 'assignees'
> & {
  description: string;
  columnId: string;
};

export interface ProjectBoardProps {
  onMenuClick?: () => void;
  title?: string;
  teamName?: string;
  ownerName?: string;
  /** Product notification center or other header actions. */
  headerActions?: ReactNode;
  onInboxClick?: () => void;
  /** Starting data is copied on mount; mutations never change the caller's objects. */
  initialColumns?: readonly ProjectColumn[];
  members?: Readonly<Record<string, ProjectMember>>;
  projects?: readonly string[];
  currentUserId?: string;
  /** Called for create, property edits, comments, sorting and completed moves. */
  onColumnsChange?: (columns: ProjectColumn[]) => void;
  onTicketOpen?: (ticket: ProjectTicket) => void;
  /** Use a product-specific route and clipboard implementation on native. */
  onCopyTicketLink?: (ticket: ProjectTicket) => void | Promise<void>;
  onCopyTicketId?: (code: string) => void | Promise<void>;
  initialTicketId?: string;
  style?: StyleProp<ViewStyle>;
  className?: string;
  accessibilityLabel?: string;
  testID?: string;
}
