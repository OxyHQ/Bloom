import {
  type BoardColumn,
  BoardDragHandle,
  ProjectBoard,
  ProjectBoardCardContent,
  type ProjectBoardLane,
  type ProjectColumn,
} from '@oxy.so/bloom/project-board';
import { Text } from '@oxy.so/bloom/typography';

import * as L from '../src/index';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

type Task = { id: string; title: string };

const COLUMNS: BoardColumn<Task>[] = [
  {
    id: 'planned',
    title: 'Planned',
    items: [
      { id: 'brief', title: 'Write the launch brief' },
      { id: 'deck', title: 'Draft the deck' },
    ],
  },
  { id: 'doing', title: 'Doing', items: [{ id: 'site', title: 'Ship the site' }] },
  { id: 'done', title: 'Done', items: [] },
];
const LANES: ProjectBoardLane<Task>[] = [
  { id: 'web', title: 'Web', columns: COLUMNS },
  { id: 'app', title: 'App', columns: COLUMNS.slice(0, 2), collapsed: true },
];
const TICKETS: ProjectColumn[] = [
  {
    id: 'backlog',
    title: 'Backlog',
    limit: 8,
    tickets: [
      {
        id: 'B-1',
        title: 'Prepare launch',
        code: 'B-1',
        area: 'Design',
        since: 'Now',
        priority: 'High',
        project: 'Bloom',
        assignees: ['ana'],
      },
    ],
  },
  { id: 'done', title: 'Done', limit: 8, tickets: [] },
];
const MEMBERS = { ana: { id: 'ana', name: 'Ana Lima', initials: 'AL' } };

const id = (task: Task) => task.id;
const label = (task: Task) => task.title;
const move = () => {};
const press = () => {};
const collapse = () => {};

/** A card as an app draws one: its title on a drag handle, in the board's card geometry. */
const card = (task: Task) => (
  <ProjectBoardCardContent
    header={
      <BoardDragHandle accessibilityLabel={`Move ${task.title}`} onPress={press}>
        <Text>{task.title}</Text>
      </BoardDragHandle>
    }
    description="Two points"
  />
);
const cardView = (task: Task) =>
  L.ProjectBoardCardContent(undefined, {
    header: L.BoardDragHandle(L.Text(task.title)).label(`Move ${task.title}`).onPress(press),
    description: 'Two points',
  });

const boards: ParityCase[] = [
  {
    name: 'ProjectBoard, cards on drag handles, named',
    language: () =>
      toElement(
        L.ProjectBoard(COLUMNS, {
          getItemId: id,
          getItemLabel: label,
          dragMode: 'handle',
          onMove: move,
          renderCard: cardView,
        }).label('Launch board'),
      ),
    bloom: () => (
      <ProjectBoard
        variant="embedded"
        columns={COLUMNS}
        getItemId={id}
        getItemLabel={label}
        dragMode="handle"
        onMove={move}
        renderCard={card}
        accessibilityLabel="Launch board"
      />
    ),
  },
  {
    name: 'ProjectBoard, read only, every column render, a column width',
    language: () =>
      toElement(
        L.ProjectBoard(COLUMNS, {
          getItemId: id,
          readOnly: true,
          allowReorder: false,
          fillColumns: true,
          columnWidth: '256',
          renderCard: (task) => L.Text(task.title),
          renderColumnHeader: (column, { isDropTarget }) =>
            L.Text(`${column.title}${isDropTarget ? ' (drop)' : ''}`),
          renderColumnActions: (column) => L.Text(`${column.items.length}`),
          renderColumnFooter: (column) => L.Text(`Add to ${column.title}`),
          renderEmptyColumn: () => L.Text('Nothing here'),
        }),
      ),
    bloom: () => (
      <ProjectBoard
        variant="embedded"
        columns={COLUMNS}
        getItemId={id}
        readOnly
        allowReorder={false}
        fillColumns
        columnWidth={256}
        renderCard={(task) => <Text>{task.title}</Text>}
        renderColumnHeader={(column, { isDropTarget }) => (
          <Text>{`${column.title}${isDropTarget ? ' (drop)' : ''}`}</Text>
        )}
        renderColumnActions={(column) => <Text>{`${column.items.length}`}</Text>}
        renderColumnFooter={(column) => <Text>{`Add to ${column.title}`}</Text>}
        renderEmptyColumn={() => <Text>Nothing here</Text>}
      />
    ),
  },
  {
    name: 'GroupedProjectBoard, a lane collapsed, lane renders',
    language: () =>
      toElement(
        L.GroupedProjectBoard(LANES, {
          getItemId: id,
          onLaneCollapsedChange: collapse,
          renderCard: (task) => L.Text(task.title),
          renderLaneHeader: (lane) => L.Text(lane.title),
          renderLaneActions: (lane) => L.Text(`${lane.columns.length} columns`),
          renderColumnFooter: (column, lane) => L.Text(`${lane.title}: ${column.title}`),
        }).label('Lanes'),
      ),
    bloom: () => (
      <ProjectBoard
        variant="grouped"
        lanes={LANES}
        getItemId={id}
        onLaneCollapsedChange={collapse}
        renderCard={(task) => <Text>{task.title}</Text>}
        renderLaneHeader={(lane) => <Text>{lane.title}</Text>}
        renderLaneActions={(lane) => <Text>{`${lane.columns.length} columns`}</Text>}
        renderColumnFooter={(column, lane) => <Text>{`${lane.title}: ${column.title}`}</Text>}
        accessibilityLabel="Lanes"
      />
    ),
  },
  {
    name: 'ProjectBoardTemplate, its tickets and header actions',
    language: () =>
      toElement(
        L.ProjectBoardTemplate({
          title: 'Launch',
          teamName: 'Oxy',
          ownerName: 'Maya',
          initialColumns: TICKETS,
          members: MEMBERS,
          headerActions: L.Text('Inbox'),
        }),
      ),
    bloom: () => (
      <ProjectBoard
        title="Launch"
        teamName="Oxy"
        ownerName="Maya"
        initialColumns={TICKETS}
        members={MEMBERS}
        headerActions={<Text>Inbox</Text>}
      />
    ),
  },
];

const cards: ParityCase[] = [
  {
    name: 'ProjectBoardCardContent, text slots',
    language: () =>
      toElement(
        L.ProjectBoardCardContent(undefined, {
          header: 'B-1',
          title: 'Prepare launch',
          description: 'Design',
        }),
      ),
    bloom: () => (
      <ProjectBoardCardContent header="B-1" title="Prepare launch" description="Design" />
    ),
  },
  {
    name: 'ProjectBoardCardContent, every slot a view, a body',
    language: () =>
      toElement(
        L.ProjectBoardCardContent(L.Text('Body'), {
          preview: L.Text('Preview'),
          header: L.Text('Header'),
          actions: L.Text('⋯'),
          badges: L.Text('High'),
          title: L.Text('Title'),
          description: L.Text('Description'),
          footer: L.Text('Footer'),
        }),
      ),
    bloom: () => (
      <ProjectBoardCardContent
        preview={<Text>Preview</Text>}
        header={<Text>Header</Text>}
        actions={<Text>⋯</Text>}
        badges={<Text>High</Text>}
        title={<Text>Title</Text>}
        description={<Text>Description</Text>}
        footer={<Text>Footer</Text>}
      >
        <Text>Body</Text>
      </ProjectBoardCardContent>
    ),
  },
  {
    name: 'ProjectBoardCardContent, empty',
    language: () => toElement(L.ProjectBoardCardContent(undefined)),
    bloom: () => <ProjectBoardCardContent />,
  },
  {
    name: 'BoardDragHandle outside a board, named, growing',
    language: () =>
      toElement(L.BoardDragHandle(L.Text('Move me')).label('Move the card').onPress(press).grow()),
    bloom: () => (
      <BoardDragHandle accessibilityLabel="Move the card" onPress={press} style={{ flex: 1 }}>
        <Text>Move me</Text>
      </BoardDragHandle>
    ),
  },
];

export const PROJECT_BOARD_CASES: ParityCase[] = [...boards, ...cards];
