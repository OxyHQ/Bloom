import type { ReactNode } from 'react';
import {
  type BoardColumn,
  BoardDragHandle as BloomBoardDragHandle,
  type ControlledProjectBoardProps,
  type GroupedProjectBoardProps,
  ProjectBoard as BloomProjectBoard,
  ProjectBoardCardContent as BloomProjectBoardCardContent,
  type ProjectBoardLane,
  type ProjectBoardTemplateProps,
} from '@oxy.so/bloom/project-board';

import { type Child, Node, type ViewModifiers } from '../node';
import type { SpaceToken } from '../tokens';
import type { ControlRenderer } from './draw';
import { product, type TextSlot } from './product';

/** The project board: a board of columns (or of lanes of columns), its cards and their handles. */
export type ProjectBoardKind = 'projectBoard' | 'projectBoardCardContent' | 'boardDragHandle';

type Drawn = 'style' | 'className' | 'testID' | 'accessibilityLabel';

/** A Bloom render prop as the language takes it: the same arguments, a view returned. */
type Rendered<F> = F extends (...args: infer A) => ReactNode ? (...args: A) => Child : F;
/** Bloom's props with its render props (`K`) returning views. */
type Views<P, K extends keyof P> = Omit<P, K> & { [Q in keyof Pick<P, K>]: Rendered<P[Q]> };

type BoardRenders =
  | 'renderCard'
  | 'renderColumnHeader'
  | 'renderColumnActions'
  | 'renderColumnFooter'
  | 'renderEmptyColumn';
type LaneRenders = BoardRenders | 'renderLaneHeader' | 'renderLaneActions';
/** A column's width is a space token. */
type Width = { readonly columnWidth?: SpaceToken };

/**
 * Bloom's embedded board's data: how it reads an item, its moves and its
 * handlers; its render props return views. A column's style is not taken.
 */
export type ProjectBoardOptions<Item> = Views<
  Omit<
    ControlledProjectBoardProps<Item>,
    Drawn | 'variant' | 'columns' | 'columnWidth' | 'columnStyle'
  >,
  BoardRenders
> &
  Width;
/** Bloom's grouped board's data, as the embedded board's, with its lanes' handlers. */
export type GroupedProjectBoardOptions<Item> = Views<
  Omit<GroupedProjectBoardProps<Item>, Drawn | 'variant' | 'lanes' | 'columnWidth' | 'columnStyle'>,
  LaneRenders
> &
  Width;
/** Bloom's ticket board's data; `headerActions` is a language child. */
export type ProjectBoardTemplateOptions = Omit<
  ProjectBoardTemplateProps,
  Drawn | 'headerActions'
> & {
  readonly headerActions?: Child;
};

type CardSlots = 'preview' | 'actions' | 'badges' | 'footer';
type CardTexts = 'header' | 'title' | 'description';
/**
 * Bloom `ProjectBoardCardContent`'s slots: `preview`, `actions`, `badges` and
 * `footer` are views; `header`, `title` and `description` a string (drawn in
 * the card's own text style) or a view.
 */
export type ProjectBoardCardContentOptions = { readonly [K in CardSlots]?: Child } & {
  readonly [K in CardTexts]?: TextSlot;
};

/** Bloom `ProjectBoard`; `.label()` names it. */
export type ProjectBoardView = ViewModifiers<ProjectBoardView>;
/** Bloom `ProjectBoardCardContent`: a card's content in the board's card geometry. */
export type ProjectBoardCardContentView = ViewModifiers<ProjectBoardCardContentView>;
/** Bloom `BoardDragHandle`: what a card is dragged by; `.onPress()` opens it, `.label()` names it. */
export type BoardDragHandleView = ViewModifiers<BoardDragHandleView>;

/** Bloom `ProjectBoard` of `columns` (its `embedded` variant): the app owns the items and their moves. */
export function ProjectBoard<Item>(
  columns: readonly BoardColumn<Item>[],
  options: ProjectBoardOptions<Item>,
): ProjectBoardView {
  return new Node('projectBoard', { variant: 'embedded', columns, options }, []);
}
/** Bloom `ProjectBoard` of `lanes` (its `grouped` variant): boards stacked in collapsible lanes. */
export function GroupedProjectBoard<Item>(
  lanes: readonly ProjectBoardLane<Item>[],
  options: GroupedProjectBoardOptions<Item>,
): ProjectBoardView {
  return new Node('projectBoard', { variant: 'grouped', lanes, options }, []);
}
/** Bloom `ProjectBoard`'s ticket board: its header, columns of tickets and their dialogs. */
export function ProjectBoardTemplate(options: ProjectBoardTemplateOptions = {}): ProjectBoardView {
  return new Node('projectBoard', { options }, []);
}
/** Bloom `ProjectBoardCardContent` around `content` (the card's body), with its slots. */
export function ProjectBoardCardContent(
  content: Child,
  options: ProjectBoardCardContentOptions = {},
): ProjectBoardCardContentView {
  return new Node('projectBoardCardContent', { options }, content === undefined ? [] : [content]);
}
/** Bloom `BoardDragHandle` around `content`. */
export function BoardDragHandle(content: Child): BoardDragHandleView {
  return new Node('boardDragHandle', {}, [content]);
}

export const PROJECT_BOARDS: Record<ProjectBoardKind, ControlRenderer> = {
  projectBoard: product(BloomProjectBoard, {
    slots: ['headerActions'],
    lengths: ['columnWidth'],
    renders: [
      'renderCard',
      'renderColumnHeader',
      'renderColumnActions',
      'renderColumnFooter',
      'renderEmptyColumn',
      'renderLaneHeader',
      'renderLaneActions',
    ],
  }),
  projectBoardCardContent: product(BloomProjectBoardCardContent, {
    slots: ['preview', 'header', 'actions', 'badges', 'title', 'description', 'footer'],
  }),
  boardDragHandle: product(BloomBoardDragHandle, { press: true }),
};
