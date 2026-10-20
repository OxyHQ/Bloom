import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, useWindowDimensions, type View, type ViewStyle } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { Avatar } from '../avatar';
import { Breadcrumb, BreadcrumbItem } from '../breadcrumb';
import { useIsRtl } from '../hooks/use-is-rtl';
import { RiAddLine } from '../icons/remix/RiAddLine';
import { RiInbox2Line } from '../icons/remix/RiInbox2Line';
import { RiKanbanView2 } from '../icons/remix/RiKanbanView2';
import { RiMenuLine } from '../icons/remix/RiMenuLine';
import { useMessages } from '../locale/messages';
import { StyledPressable, StyledView } from '../styles/styled-primitives';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { CreateTicketDialog } from './CreateTicketDialog';
import { ProjectBoardControls } from './ProjectBoardControls';
import { ProjectBoardEmptyState } from './ProjectBoardEmptyState';
import {
  RiMoreLine,
  RiArrowRightSLine as SourceArrow,
  SourceAvatar,
  SourceChip,
  RiFolder6Line as SourceFolder,
  SourceText,
  SourceView,
} from './SourcePrimitives';
import { TicketDetailDialog } from './TicketDetailDialog';
import { ProjectBoardCanvas } from './ProjectBoardCanvas';
import { useBoardEngine } from './use-board-engine';
import { projectBoardMove } from './board-engine';
import { cx, PRIORITY_STYLES } from './constants';
import { useProjectBoardPlatform } from './context';
import { PROJECT_BOARD_MESSAGES } from './messages';
import { cloneColumns, moveTicket, sortColumns, updateTicket } from './shared';
import type {
  BoardSort,
  NewProjectTicket,
  ProjectBoardProps,
  ProjectBoardTemplateProps,
  ControlledProjectBoardProps,
  ProjectColumn,
  ProjectMember,
  ProjectTicket,
  TicketPriority,
} from './types';

const getTicketId = (ticket: ProjectTicket) => ticket.id;
const getTicketLabel = (ticket: ProjectTicket) => ticket.code;
const EMPTY_COLUMNS: readonly ProjectColumn[] = [];
const EMPTY_MEMBERS: Readonly<Record<string, ProjectMember>> = {};

function MemberAvatars({
  ids,
  members,
}: {
  ids: string[];
  members: Readonly<Record<string, ProjectMember>>;
}) {
  return (
    <SourceView
      className="flex items-center ps-1"
      accessibilityLabel={ids
        .map((id) => members[id]?.name)
        .filter(Boolean)
        .join(', ')}
    >
      {ids.map((id, index) => {
        const member = members[id];
        return (
          member && (
            <SourceAvatar
              key={id}
              size="sm"
              source={member.avatar}
              alt={member.name}
              initials={member.initials}
              className={cx(
                'size-[22px] ring-2 ring-background-primary-default',
                index > 0 && '-ms-1.5',
              )}
            />
          )
        );
      })}
    </SourceView>
  );
}
function TicketCard({
  ticket,
  members,
}: {
  ticket: ProjectTicket;
  members: Readonly<Record<string, ProjectMember>>;
}) {
  return (
    <SourceView className="flex w-full flex-col gap-2 p-3">
      <SourceView className="flex min-h-[22px] items-start justify-between gap-3">
        <SourceView className="flex min-w-0 items-center text-body-2-medium text-text-secondary">
          <SourceText className="shrink-0 text-body-2-medium text-text-secondary">
            {ticket.code}
          </SourceText>
          <SourceArrow className="size-[15px] shrink-0 text-foreground-icon-tertiary rtl:rotate-180" />
          <SourceText className="truncate text-body-2-medium text-text-secondary">
            {ticket.area}
          </SourceText>
        </SourceView>
        <MemberAvatars ids={ticket.assignees} members={members} />
      </SourceView>
      <SourceView className="flex flex-col items-start gap-2">
        <SourceView className="flex items-center gap-1.5">
          <SourceChip className={cx('text-body-2-medium', PRIORITY_STYLES[ticket.priority])}>
            {ticket.priority}
          </SourceChip>
          <SourceChip className="gap-1 bg-background-primary-default text-body-2-medium text-text-primary ring-1 ring-inset ring-border-button-default">
            <SourceFolder className="size-[13px] shrink-0 opacity-30" />
            <SourceText className="text-body-2-medium text-text-secondary">
              {ticket.project}
            </SourceText>
          </SourceChip>
        </SourceView>
        <SourceView className="flex w-full flex-col gap-[5px]">
          <SourceText className="text-body-medium text-text-primary">{ticket.title}</SourceText>
          <SourceText className="text-body-2-medium text-text-secondary">{ticket.since}</SourceText>
        </SourceView>
      </SourceView>
    </SourceView>
  );
}

export function ProjectBoardBase<Item>(props: ProjectBoardProps<Item>) {
  return 'columns' in props ? (
    <ControlledProjectBoard {...props} />
  ) : (
    <TicketProjectBoard {...props} />
  );
}

function ControlledProjectBoard<Item>(props: ControlledProjectBoardProps<Item>) {
  const engine = useBoardEngine(props);
  return <ProjectBoardCanvas {...props} engine={engine} />;
}

function TicketProjectBoard({
  onMenuClick,
  title: titleProp,
  teamName: teamNameProp,
  ownerName = 'Mertcan',
  headerActions,
  onInboxClick,
  initialColumns = EMPTY_COLUMNS,
  members = EMPTY_MEMBERS,
  projects: suppliedProjects,
  currentUserId,
  onColumnsChange,
  onTicketOpen,
  onCopyTicketLink,
  onCopyTicketId,
  initialTicketId,
  style,
  className,
  accessibilityLabel,
  testID = 'project-board',
}: ProjectBoardTemplateProps) {
  const { colors } = useTheme();
  const { messages: m } = useMessages(PROJECT_BOARD_MESSAGES);
  const title = titleProp ?? m.defaultTitle;
  const teamName = teamNameProp ?? m.defaultTeam;
  const direction = useIsRtl() ? 'rtl' : 'ltr';
  const { Button, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } =
    useProjectBoardPlatform();
  const reducedMotion = useReducedMotion();
  const { width } = useWindowDimensions();
  const [columns, setColumns] = useState(() => cloneColumns(initialColumns));
  const columnsRef = useRef(columns);
  columnsRef.current = columns;
  const [sort, setSort] = useState<BoardSort>('manual');
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | 'all'>('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [showDone, setShowDone] = useState(true);
  const [fillColumns, setFillColumns] = useState(true);
  const projects = useMemo(
    () =>
      suppliedProjects ?? [
        ...new Set(columns.flatMap((column) => column.tickets.map((ticket) => ticket.project))),
      ],
    [suppliedProjects, columns],
  );
  const filteredColumns = useMemo(
    () =>
      columns
        .filter((column) => showDone || column.id !== 'done')
        .map((column) => ({
          ...column,
          tickets: column.tickets.filter(
            (ticket) =>
              (priorityFilter === 'all' || ticket.priority === priorityFilter) &&
              (projectFilter === 'all' || ticket.project === projectFilter),
          ),
        })),
    [columns, showDone, priorityFilter, projectFilter],
  );
  const [create, setCreate] = useState<{ columnId?: string } | null>(null);
  const [detailId, setDetailId] = useState<string | null>(initialTicketId ?? null);
  const nextTicket = useRef(90);
  const [sequence, setSequence] = useState(90);
  const commit = useCallback(
    (next: ProjectColumn[]) => {
      columnsRef.current = next;
      setColumns(next);
      onColumnsChange?.(cloneColumns(next));
    },
    [onColumnsChange],
  );
  const engineColumns = useMemo(
    () => columns.map((column) => ({ ...column, items: column.tickets })),
    [columns],
  );
  const engineVisibleColumns = useMemo(
    () => filteredColumns.map((column) => ({ ...column, items: column.tickets })),
    [filteredColumns],
  );
  const engine = useBoardEngine({
    columns: engineColumns,
    visibleColumns: engineVisibleColumns,
    getItemId: getTicketId,
    getItemLabel: getTicketLabel,
    onBegin: () => setSort('manual'),
    onMove: (move) => {
      const next = projectBoardMove(
        columnsRef.current.map((column) => ({ ...column, items: column.tickets })),
        getTicketId,
        move,
      );
      commit(
        next.map((column) => ({
          ...columnsRef.current.find((source) => source.id === column.id)!,
          tickets: [...column.items],
        })),
      );
    },
  });
  const visibleColumns = engine.renderedColumns;
  const { scrollView, columnScrolls, measure } = engine;
  const openDetail = useCallback(
    (id: string) => {
      if (engine.suppressOpen()) return;
      setDetailId(id);
      const ticket = columnsRef.current
        .flatMap((column) => column.tickets)
        .find((ticket) => ticket.id === id);
      if (ticket) onTicketOpen?.(ticket);
    },
    [onTicketOpen, engine.suppressOpen],
  );
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const linkedTicket = () => {
      const id = new URLSearchParams(window.location.hash.slice(1)).get('ticket');
      if (
        id &&
        columnsRef.current.some((column) => column.tickets.some((ticket) => ticket.id === id))
      )
        setDetailId(id);
    };
    linkedTicket();
    window.addEventListener('hashchange', linkedTicket);
    return () => window.removeEventListener('hashchange', linkedTicket);
  }, []);
  const detailColumn = columns.find((column) =>
    column.tickets.some((ticket) => ticket.id === detailId),
  );
  const detailTicket = detailColumn?.tickets.find((ticket) => ticket.id === detailId);
  const [availableWidth, setAvailableWidth] = useState(width);
  const columnWidth =
    fillColumns && width > 1440
      ? Math.max(
          273,
          (availableWidth -
            (width >= 640 ? 24 : 12) -
            (width >= 1024 ? 28 : width >= 640 ? 24 : 12) -
            8 * (visibleColumns.length - 1)) /
            Math.max(1, visibleColumns.length),
        )
      : 273;

  function addTicket(draft: NewProjectTicket) {
    const sequence = nextTicket.current++;
    let id = `ticket-new-${sequence}`;
    while (columnsRef.current.some((column) => column.tickets.some((ticket) => ticket.id === id)))
      id = `ticket-new-${nextTicket.current++}`;
    const ticket: ProjectTicket = {
      id,
      code: `FE-${sequence}`,
      area: 'Project board',
      title: draft.title,
      description: draft.description,
      createdBy: currentUserId,
      since: 'Since just now',
      priority: draft.priority,
      project: draft.project,
      assignees: draft.assignees,
    };
    commit(
      columnsRef.current.map((column) =>
        column.id === draft.columnId ? { ...column, tickets: [ticket, ...column.tickets] } : column,
      ),
    );
    setSequence(nextTicket.current);
    requestAnimationFrame(() => {
      const index = visibleColumns.findIndex((column) => column.id === draft.columnId);
      scrollView.current?.scrollTo({
        x: Math.max(0, index * (columnWidth + 8)),
        animated: !reducedMotion,
      });
      columnScrolls.current[draft.columnId]?.scrollTo({
        y: 0,
        animated: !reducedMotion,
      });
      measure();
    });
  }
  return (
    <StyledView
      className={className}
      style={[
        {
          direction,
          flex: 1,
          minHeight: 0,
          width: '100%',
          flexDirection: 'column',
          gap: 10,
        },
        style,
      ]}
      accessibilityLabel={accessibilityLabel ?? m.board}
      testID={testID}
    >
      <SourceView className="flex w-full shrink-0 flex-col gap-2 sm:gap-0">
        <Breadcrumb>
          <BreadcrumbItem leading={<Avatar size="xs" color="blue" initials={teamName[0]} />}>
            {teamName}
          </BreadcrumbItem>
          <BreadcrumbItem leading={<Avatar size="xs" color="neutral" initials={ownerName[0]} />}>
            {ownerName}
          </BreadcrumbItem>
          <BreadcrumbItem current icon={RiKanbanView2}>
            {m.board}
          </BreadcrumbItem>
        </Breadcrumb>
        <SourceView className="flex w-full flex-wrap items-end justify-between gap-2">
          <SourceView className="flex min-w-0 items-center gap-1.5">
            {onMenuClick && width < 1024 && (
              <Button
                appearance="plain"
                iconOnly
                icon={RiMenuLine}
                size="md"
                accessibilityLabel={m.navigation}
                onPress={onMenuClick}
                className="lg:hidden"
              />
            )}
            <SourceText className="px-1 text-title-2-medium whitespace-nowrap text-text-primary">
              {title}
            </SourceText>
          </SourceView>
          <SourceView className="flex w-full flex-wrap items-center justify-start gap-2.5 sm:w-auto sm:justify-end">
            {headerActions}
            <Button
              appearance="plain"
              iconOnly
              icon={RiInbox2Line}
              size="md"
              accessibilityLabel={m.inbox}
              onPress={onInboxClick}
            />
            <ProjectBoardControls
              sort={sort}
              onSort={(value) => {
                setSort(value);
                commit(sortColumns(columnsRef.current, value));
              }}
              priority={priorityFilter}
              onPriority={setPriorityFilter}
              project={projectFilter}
              onProject={setProjectFilter}
              projects={projects}
              showDone={showDone}
              onShowDone={setShowDone}
              fillColumns={fillColumns}
              onFillColumns={setFillColumns}
            />
            <Button
              size="md"
              leadingIcon={RiAddLine}
              onPress={() => setCreate({})}
              disabled={!columns.length}
            >
              {m.newTicket}
            </Button>
          </SourceView>
        </SourceView>
      </SourceView>
      <ProjectBoardCanvas
        engine={engine}
        variant="template"
        columns={engineColumns}
        getItemId={getTicketId}
        getItemLabel={getTicketLabel}
        columnWidth={columnWidth}
        onWidthChange={setAvailableWidth}
        onItemPress={(ticket) => openDetail(ticket.id)}
        itemAccessibilityLabel={(ticket) => m.openTicket(ticket.code, ticket.title)}
        testID={testID}
        renderCard={(ticket) => <TicketCard ticket={ticket} members={members} />}
        renderEmptyColumn={() => <ProjectBoardEmptyState />}
        renderColumnHeader={(column) => (
          <StyledView className="flex h-5 shrink-0 flex-row items-center justify-between px-3">
            <StyledView className="flex min-w-0 flex-row items-center gap-1.5">
              <Text variant="body-medium">{column.title}</Text>
              <Text variant="body-medium" style={{ color: colors.textSecondary }}>
                {column.items.length}/{columns.find((source) => source.id === column.id)?.limit}
              </Text>
            </StyledView>
            <StyledView className="flex flex-row items-center gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <StyledPressable
                    accessibilityLabel={`${m.actions}: ${column.title}`}
                    className="flex size-5 cursor-pointer items-center justify-center rounded-md transition-colors duration-150 hover:bg-background-tertiary-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring"
                  >
                    <RiMoreLine className="size-5" />
                  </StyledPressable>
                </DropdownMenuTrigger>
                <DropdownMenuContent label={`${m.actions}: ${column.title}`}>
                  <DropdownMenuItem onPress={() => setCreate({ columnId: column.id })}>
                    {m.addTicket}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onPress={() => {
                      setSort('title');
                      commit(sortColumns(columnsRef.current, 'title'));
                    }}
                  >
                    {m.sortTitle}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <StyledPressable
                accessibilityRole="button"
                accessibilityLabel={m.addTicketTo(column.title)}
                onPress={() => setCreate({ columnId: column.id })}
                className="flex size-5 cursor-pointer items-center justify-center rounded-md transition-colors duration-150 hover:bg-background-tertiary-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring"
              >
                <RiAddLine width={20} height={20} fill={colors.icon} />
              </StyledPressable>
            </StyledView>
          </StyledView>
        )}
      />
      {create && (
        <CreateTicketDialog
          title={title}
          initialColumnId={create.columnId}
          code={`FE-${sequence}`}
          columns={columns}
          projects={projects}
          members={members}
          onClose={() => setCreate(null)}
          onCreate={addTicket}
        />
      )}
      {detailTicket && detailColumn && (
        <TicketDetailDialog
          key={detailId}
          title={title}
          ticket={detailTicket}
          column={detailColumn}
          columns={columns}
          members={members}
          projects={projects}
          currentUserId={currentUserId}
          onClose={() => setDetailId(null)}
          onUpdate={(patch) => commit(updateTicket(columnsRef.current, detailTicket.id, patch))}
          onMove={(columnId) => {
            if (columnId !== detailColumn.id)
              commit(moveTicket(columnsRef.current, detailTicket.id, columnId));
          }}
          onCopyTicketLink={onCopyTicketLink}
          onCopyTicketId={onCopyTicketId}
        />
      )}
    </StyledView>
  );
}
