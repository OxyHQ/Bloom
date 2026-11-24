import { ProjectBoardCardContent } from './ProjectBoardCardContent';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Avatar } from '../avatar';
import { Breadcrumb, BreadcrumbItem } from '../breadcrumb';
import { useIsRtl } from '../hooks/use-is-rtl';
import { RiAddLine } from '../icons/remix/RiAddLine';
import { RiArrowRightSLine } from '../icons/remix/RiArrowRightSLine';
import { RiFolder6Line } from '../icons/remix/RiFolder6Line';
import { RiInbox2Line } from '../icons/remix/RiInbox2Line';
import { RiKanbanView2 } from '../icons/remix/RiKanbanView2';
import { RiMenuLine } from '../icons/remix/RiMenuLine';
import { useMessages } from '../locale/messages';
import { Chip } from '../chip';
import { useWindowBreakpoint } from '../hooks/use-width-class';
import { webDataSet } from '../styles/web-data';
import { Text } from '../typography';
import { fontFamilyStyle } from '../typography/Typography';
import { CreateTicketDialog } from './CreateTicketDialog';
import { ProjectBoardControls } from './ProjectBoardControls';
import { MemberAvatars } from './MemberAvatars';
import { ProjectBoardEmptyState } from './ProjectBoardEmptyState';
import { RiMoreLine } from './RiMoreLine';
import { TicketDetailDialog } from './TicketDetailDialog';
import { ProjectBoardCanvas } from './ProjectBoardCanvas';
import { useBoardEngine } from './use-board-engine';
import { projectBoardMove } from './board-engine';
import { CARD_CHIP, useChipFills, useChipLabels, useProjectChip } from './chips';
import { ELLIPSIS, NOWRAP, TYPE, useBoardText, useIconFill } from './styles';
import { createTokenStyles, useColorTokens } from '../theme/color-tokens';
import { useProjectBoardWebCss } from './web-css';
import { useProjectBoardPlatform } from './context';
import { PROJECT_BOARD_MESSAGES } from './messages';
import { cloneColumns, moveTicket, sortColumns, updateTicket } from './shared';
import type {
  BoardSort,
  NewProjectTicket,
  ProjectBoardProps,
  ProjectBoardTemplateProps,
  ControlledProjectBoardProps,
  GroupedProjectBoardProps,
  ProjectColumn,
  ProjectMember,
  ProjectTicket,
  TicketPriority,
} from './types';
import { usePrefersReducedMotion } from '../hooks/use-prefers-reduced-motion';

const getTicketId = (ticket: ProjectTicket) => ticket.id;
const getTicketLabel = (ticket: ProjectTicket) => ticket.code;
const EMPTY_COLUMNS: readonly ProjectColumn[] = [];
const EMPTY_MEMBERS: Readonly<Record<string, ProjectMember>> = {};

const styles = StyleSheet.create({
  assignees: { flexDirection: 'row', alignItems: 'center', paddingInlineStart: 4 },
  noShrink: { flexShrink: 0 },
  arrow: { width: 15, height: 15, flexShrink: 0 },
  flip: { transform: [{ rotate: '180deg' }] },
  truncate: { overflow: 'hidden' },
  folder: { width: 13, height: 13, flexShrink: 0, opacity: 0.3 },
  lanes: { flex: 1, minHeight: 0, minWidth: 0 },
  laneHeader: { flexDirection: 'row', alignItems: 'center' },
  root: { flex: 1, minHeight: 0, width: '100%', flexDirection: 'column', gap: 10 },
  header: { width: '100%', flexShrink: 0, flexDirection: 'column' },
  titleRow: {
    flexDirection: 'row',
    width: '100%',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 8,
  },
  titleGroup: { flexDirection: 'row', minWidth: 0, alignItems: 'center', gap: 6 },
  title: { paddingInline: 4 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 },
  columnTitle: { minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 6 },
  columnActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconButton: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  icon: { width: 20, height: 20 },
});
const useCardStyles = createTokenStyles((t) => ({
  // The crumbs' type and colour sit on the row as the class set them.
  crumbs: {
    flexDirection: 'row',
    minWidth: 0,
    alignItems: 'center',
    ...TYPE.caption,
    color: t.mutedForeground,
  },
}));
/** `text-title-*` set the title in the display face. */
const DISPLAY_FACE = fontFamilyStyle('display');
/** `rtl:rotate-180`: the web's `rotate`, a transform on native. */
const FLIP = Platform.OS === 'web' ? ({ rotate: '180deg' } as object) : styles.flip;

function TicketAssignees({
  ids,
  members,
}: {
  ids: string[];
  members: Readonly<Record<string, ProjectMember>>;
}) {
  return (
    <View
      style={styles.assignees}
      accessibilityLabel={ids
        .map((id) => members[id]?.name)
        .filter(Boolean)
        .join(', ')}
    >
      <MemberAvatars ids={ids} members={members} size={22} />
    </View>
  );
}
function TicketCard({
  ticket,
  members,
}: {
  ticket: ProjectTicket;
  members: Readonly<Record<string, ProjectMember>>;
}) {
  const { messages: m } = useMessages(PROJECT_BOARD_MESSAGES);
  const text = useBoardText();
  const fills = useChipFills();
  const labels = useChipLabels();
  const project = useProjectChip();
  const own = useCardStyles();
  const iconFill = useIconFill();
  const rtl = useIsRtl();
  return (
    <ProjectBoardCardContent
      header={
        <View style={own.crumbs}>
          <Text style={[styles.noShrink, text.captionMuted]}>{ticket.code}</Text>
          <RiArrowRightSLine fill={iconFill} style={[styles.arrow, text.icon, rtl && FLIP]} />
          <Text style={[styles.truncate, text.captionMuted, ELLIPSIS]}>{ticket.area}</Text>
        </View>
      }
      actions={<TicketAssignees ids={ticket.assignees} members={members} />}
      badges={
        <>
          {' '}
          <Chip
            bare
            style={[CARD_CHIP, fills[ticket.priority]]}
            textStyle={[labels[ticket.priority], NOWRAP]}
          >
            {m.priorityLabels[ticket.priority]}
          </Chip>
          <Chip bare style={[CARD_CHIP, project.chip]}>
            <RiFolder6Line style={styles.folder} />
            <Text style={text.captionMuted}>{ticket.project}</Text>
          </Chip>
        </>
      }
      title={ticket.title}
      description={ticket.since}
    />
  );
}

export function ProjectBoardBase<Item>(props: ProjectBoardProps<Item>) {
  if ('lanes' in props) return <GroupedProjectBoard {...props} />;
  return 'columns' in props ? (
    <ControlledProjectBoard {...props} />
  ) : (
    <TicketProjectBoard {...props} />
  );
}

function GroupedProjectBoard<Item>({
  lanes,
  onLaneCollapsedChange,
  renderLaneHeader,
  renderLaneActions,
  renderColumnFooter,
  onMove,
  onColumnOrderChange,
  style,
  testID = 'project-board',
  ...props
}: GroupedProjectBoardProps<Item>) {
  const { Screen, ScreenScrollView, Accordion, AccordionItem, AccordionTrigger, AccordionContent } =
    useProjectBoardPlatform();
  const [viewportHeight, setViewportHeight] = useState(0);
  return (
    <View
      style={[styles.lanes, style]}
      testID={testID}
      onLayout={(event) => setViewportHeight(event.nativeEvent.layout.height)}
    >
      <Screen scroll="auto">
        <ScreenScrollView>
          <Accordion
            type="multiple"
            value={lanes.filter((lane) => !lane.collapsed).map((lane) => lane.id)}
            onValueChange={(value) => {
              const expanded = new Set(Array.isArray(value) ? value : value ? [value] : []);
              for (const lane of lanes) {
                const collapsed = !expanded.has(lane.id);
                if (collapsed !== !!lane.collapsed) onLaneCollapsedChange(lane.id, collapsed);
              }
            }}
          >
            {lanes.map((lane) => (
              <AccordionItem key={lane.id} value={lane.id}>
                <View style={styles.laneHeader}>
                  <AccordionTrigger style={{ flex: 1 }}>
                    {renderLaneHeader?.(lane) ?? lane.title}
                  </AccordionTrigger>
                  {renderLaneActions?.(lane)}
                </View>
                <AccordionContent contentStyle={{ padding: 0 }}>
                  <View style={{ height: viewportHeight, minWidth: 0 }}>
                    {viewportHeight > 0 && (
                      <ControlledProjectBoard
                        {...props}
                        variant="embedded"
                        columns={lane.columns}
                        testID={`${testID}-lane-${lane.id}`}
                        renderColumnFooter={
                          renderColumnFooter
                            ? (column) => renderColumnFooter(column, lane)
                            : undefined
                        }
                        onMove={onMove ? (move) => onMove(move, lane.id) : undefined}
                        onColumnOrderChange={
                          onColumnOrderChange
                            ? (order) => onColumnOrderChange(order, lane.id)
                            : undefined
                        }
                      />
                    )}
                  </View>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </ScreenScrollView>
      </Screen>
    </View>
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
  ownerName,
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
  accessibilityLabel,
  testID = 'project-board',
}: ProjectBoardTemplateProps) {
  const tokens = useColorTokens();
  const text = useBoardText();
  const breakpoint = useWindowBreakpoint();
  const sm = breakpoint !== 'base';
  const lg = breakpoint === 'lg' || breakpoint === 'xl' || breakpoint === '2xl';
  useProjectBoardWebCss();
  const { messages: m } = useMessages(PROJECT_BOARD_MESSAGES);
  const title = titleProp ?? m.defaultTitle;
  const teamName = teamNameProp ?? m.defaultTeam;
  const direction = useIsRtl() ? 'rtl' : 'ltr';
  const { Button, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } =
    useProjectBoardPlatform();
  const reducedMotion = usePrefersReducedMotion();
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
  const { viewport, columnScrolls, measure } = engine;
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

  function addTicket(draft: NewProjectTicket) {
    const sequence = nextTicket.current++;
    let id = `ticket-new-${sequence}`;
    while (columnsRef.current.some((column) => column.tickets.some((ticket) => ticket.id === id)))
      id = `ticket-new-${nextTicket.current++}`;
    const ticket: ProjectTicket = {
      id,
      code: `FE-${sequence}`,
      area: m.board,
      title: draft.title,
      description: draft.description,
      createdBy: currentUserId,
      since: m.sinceJustNow,
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
      viewport.current?.reveal(draft.columnId);
      columnScrolls.current[draft.columnId]?.scrollTo({
        y: 0,
        animated: !reducedMotion,
      });
      measure();
    });
  }
  return (
    <View
      style={[styles.root, { direction }, style]}
      accessibilityLabel={accessibilityLabel ?? m.board}
      testID={testID}
    >
      <View style={[styles.header, { gap: sm ? 0 : 8 }]}>
        <Breadcrumb>
          <BreadcrumbItem leading={<Avatar size="xs" color="blue" initials={teamName[0]} />}>
            {teamName}
          </BreadcrumbItem>
          {ownerName ? (
            <BreadcrumbItem leading={<Avatar size="xs" color="neutral" initials={ownerName[0]} />}>
              {ownerName}
            </BreadcrumbItem>
          ) : null}
          <BreadcrumbItem current icon={RiKanbanView2}>
            {m.board}
          </BreadcrumbItem>
        </Breadcrumb>
        <View style={styles.titleRow}>
          <View style={styles.titleGroup}>
            {onMenuClick && (
              <Button
                appearance="plain"
                iconOnly
                icon={RiMenuLine}
                size="md"
                accessibilityLabel={m.navigation}
                onPress={onMenuClick}
                style={lg ? { display: 'none' } : undefined}
              />
            )}
            <Text style={[styles.title, text.title, DISPLAY_FACE, NOWRAP]}>{title}</Text>
          </View>
          <View
            style={[
              styles.actions,
              sm
                ? { width: 'auto', justifyContent: 'flex-end' }
                : { width: '100%', justifyContent: 'flex-start' },
            ]}
          >
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
          </View>
        </View>
      </View>
      <ProjectBoardCanvas
        engine={engine}
        variant="template"
        columns={engineColumns}
        getItemId={getTicketId}
        getItemLabel={getTicketLabel}
        columnWidth={273}
        fillColumns={fillColumns}
        onColumnOrderChange={(order) => {
          const reordered = columnsRef.current
            .filter((column) => order.includes(column.id))
            .sort((left, right) => order.indexOf(left.id) - order.indexOf(right.id));
          commit(
            columnsRef.current.map((column) =>
              order.includes(column.id) ? (reordered.shift() ?? column) : column,
            ),
          );
        }}
        onItemPress={(ticket) => openDetail(ticket.id)}
        itemAccessibilityLabel={(ticket) => m.openTicket(ticket.code, ticket.title)}
        testID={testID}
        renderCard={(ticket) => <TicketCard ticket={ticket} members={members} />}
        renderEmptyColumn={() => <ProjectBoardEmptyState />}
        renderColumnHeader={(column) => (
          <View style={styles.columnTitle}>
            <Text variant="body-medium">{column.title}</Text>
            <Text variant="body-medium" style={{ color: tokens.mutedForeground }}>
              {column.items.length}/{columns.find((source) => source.id === column.id)?.limit}
            </Text>
          </View>
        )}
        renderColumnActions={(column) => (
          <View style={styles.columnActions}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Pressable
                  accessibilityLabel={`${m.actions}: ${column.title}`}
                  style={styles.iconButton}
                  {...webDataSet({ bloomBoardIconButton: '' })}
                >
                  <RiMoreLine style={styles.icon} />
                </Pressable>
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
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={m.addTicketTo(column.title)}
              onPress={() => setCreate({ columnId: column.id })}
              style={styles.iconButton}
              {...webDataSet({ bloomBoardIconButton: '' })}
            >
              <RiAddLine width={20} height={20} fill={tokens.mutedForeground} />
            </Pressable>
          </View>
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
    </View>
  );
}
