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
  /** Destination index in the full column after removing the moving occurrence. */
  toIndex?: number;
  /** Stable insertion anchor; useful when the visible board is filtered. */
  beforeItemId?: string;
}

export interface ControlledProjectBoardProps<Item> {
  /** Hide template chrome; parent must provide bounded height, as with the ticket board. */
  variant: 'embedded';
  columns: readonly BoardColumn<Item>[];
  getItemId: (item: Item) => string;
  getItemLabel?: (item: Item) => string;
  /** Use an explicit BoardDragHandle when cards contain independent controls. */
  dragMode?: 'card' | 'handle';
  /** Disable same-column ordering when a consumer uses an external sort. */
  allowReorder?: boolean;
  renderCard: (
    item: Item,
    column: BoardColumn<Item>,
    state: { isDragging: boolean; isOverlay?: boolean },
  ) => ReactNode;
  renderColumnHeader?: (column: BoardColumn<Item>, state: { isDropTarget: boolean }) => ReactNode;
  renderColumnActions?: (column: BoardColumn<Item>) => ReactNode;
  /** Share spare room using the existing panel deck; widths remain a minimum. */
  fillColumns?: boolean;
  /** Enable controlled column reordering only when the product persists it. */
  onColumnOrderChange?: (order: readonly string[]) => void;
  renderColumnFooter?: (column: BoardColumn<Item>) => ReactNode;
  renderEmptyColumn?: (column: BoardColumn<Item>) => ReactNode;
  /** Request only: update columns after accepting the move. No internal data copy. */
  onMove?: (move: BoardMove) => void;
  /** Disables pointer, keyboard and accessibility moves. Also disable supplied mutation actions. */
  readOnly?: boolean;
  columnWidth?: number;
  columnStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  className?: string;
  accessibilityLabel?: string;
  testID?: string;
}

export interface BoardDragHandleProps {
  /** Normal activation; ignored while dragging and during the landing click. */
  onPress?: () => void;
  children: ReactNode;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
  className?: string;
  testID?: string;
}

export interface ProjectBoardLane<Item> {
  id: string;
  title: string;
  columns: readonly BoardColumn<Item>[];
  collapsed?: boolean;
}

/** Vertically grouped boards; Bloom owns the lane viewports and scrolling. */
export interface GroupedProjectBoardProps<Item>
  extends Omit<
    ControlledProjectBoardProps<Item>,
    'variant' | 'columns' | 'onMove' | 'onColumnOrderChange' | 'renderColumnFooter'
  > {
  variant: 'grouped';
  lanes: readonly ProjectBoardLane<Item>[];
  onLaneCollapsedChange: (laneId: string, collapsed: boolean) => void;
  renderLaneHeader?: (lane: ProjectBoardLane<Item>) => ReactNode;
  /** Independent actions outside the collapse trigger. */
  renderLaneActions?: (lane: ProjectBoardLane<Item>) => ReactNode;
  renderColumnFooter?: (column: BoardColumn<Item>, lane: ProjectBoardLane<Item>) => ReactNode;
  onMove?: (move: BoardMove, laneId: string) => void;
  onColumnOrderChange?: (order: readonly string[], laneId: string) => void;
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

export interface ProjectBoardTemplateProps {
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

export type ProjectBoardProps<Item = ProjectTicket> =
  | ProjectBoardTemplateProps
  | ControlledProjectBoardProps<Item>
  | GroupedProjectBoardProps<Item>;
