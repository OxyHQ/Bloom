import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AccessibilityInfo,
  Platform,
  ScrollView,
  useWindowDimensions,
  type View,
  type ViewStyle,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
  type AnimatedStyle,
} from 'react-native-reanimated';
import { Avatar } from '../avatar';
import { Breadcrumb, BreadcrumbItem } from '../breadcrumb';
import { useIsRtl } from '../hooks/use-is-rtl';
import { RiAddLine } from '../icons/remix/RiAddLine';
import { RiInbox2Line } from '../icons/remix/RiInbox2Line';
import { RiKanbanView2 } from '../icons/remix/RiKanbanView2';
import { RiMenuLine } from '../icons/remix/RiMenuLine';
import { useMessages } from '../locale/messages';
import { OverlayRoot } from '../overlay';
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
import { TicketPresenceList } from './TicketPresence';
import { cx, PRIORITY_STYLES } from './constants';
import { useProjectBoardPlatform } from './context';
import { PROJECT_BOARD_MESSAGES } from './messages';
import {
  cloneColumns,
  dropTarget,
  moveTicket,
  sortColumns,
  updateTicket,
  type BoardRect,
} from './shared';
import type {
  BoardSort,
  NewProjectTicket,
  ProjectBoardProps,
  ProjectColumn,
  ProjectMember,
  ProjectTicket,
  TicketPriority,
} from './types';

const AnimatedView = Animated.createAnimatedComponent(StyledView);
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
  overlay = false,
}: {
  ticket: ProjectTicket;
  members: Readonly<Record<string, ProjectMember>>;
  overlay?: boolean;
}) {
  return (
    <SourceView
      className={cx(
        'relative flex w-full flex-col gap-2 rounded-xl bg-background-primary-default p-3 text-start shadow-[0_1px_1px_rgb(0_0_0/0.05)] dark:bg-background-primary-default/60',
        'ring-[2.5px] ring-transparent transition-[box-shadow,opacity] duration-200 ease-out motion-reduce:transition-none',
        overlay
          ? 'cursor-grabbing dark:backdrop-blur-[12px]'
          : 'cursor-grab hover:shadow-sm hover:ring-border-button-hover active:cursor-grabbing',
      )}
    >
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
          <SourceChip
            className={cx(
              'text-body-2-medium',
              PRIORITY_STYLES[ticket.priority],
            )}
          >
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
          <SourceText className="text-body-medium text-text-primary">
            {ticket.title}
          </SourceText>
          <SourceText className="text-body-2-medium text-text-secondary">
            {ticket.since}
          </SourceText>
        </SourceView>
      </SourceView>
    </SourceView>
  );
}

export function ProjectBoardBase({
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
}: ProjectBoardProps) {
  const { colors } = useTheme();
  const { messages: m } = useMessages(PROJECT_BOARD_MESSAGES);
  const title = titleProp ?? m.defaultTitle;
  const teamName = teamNameProp ?? m.defaultTeam;
  const direction = useIsRtl() ? 'rtl' : 'ltr';
  const boardId = useId();
  const {
    Button,
    Portal,
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
  } = useProjectBoardPlatform();
  const reducedMotion = useReducedMotion();
  const { width } = useWindowDimensions();
  const [columns, setColumns] = useState(() => cloneColumns(initialColumns));
  const columnsRef = useRef(columns);
  columnsRef.current = columns;
  const [sort, setSort] = useState<BoardSort>('manual');
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | 'all'>(
    'all',
  );
  const [projectFilter, setProjectFilter] = useState('all');
  const [showDone, setShowDone] = useState(true);
  const [fillColumns, setFillColumns] = useState(true);
  const projects = useMemo(
    () =>
      suppliedProjects ?? [
        ...new Set(
          columns.flatMap((column) =>
            column.tickets.map((ticket) => ticket.project),
          ),
        ),
      ],
    [suppliedProjects, columns],
  );
  const visibleColumns = useMemo(
    () =>
      columns
        .filter((column) => showDone || column.id !== 'done')
        .map((column) => ({
          ...column,
          tickets: column.tickets.filter(
            (ticket) =>
              (priorityFilter === 'all' ||
                ticket.priority === priorityFilter) &&
              (projectFilter === 'all' || ticket.project === projectFilter),
          ),
        })),
    [columns, showDone, priorityFilter, projectFilter],
  );
  const [create, setCreate] = useState<{ columnId?: string } | null>(null);
  const [detailId, setDetailId] = useState<string | null>(
    initialTicketId ?? null,
  );
  const nextTicket = useRef(90);
  const [sequence, setSequence] = useState(90);
  const columnNodes = useRef<Record<string, View | null>>({});
  const ticketNodes = useRef<Record<string, View | null>>({});
  const columnRects = useRef<Record<string, BoardRect>>({});
  const ticketRects = useRef<Record<string, BoardRect>>({});
  const scrollView = useRef<ScrollView>(null);
  const columnScrolls = useRef<Record<string, ScrollView | null>>({});
  const scrollX = useRef(0);
  const columnScrollY = useRef<Record<string, number>>({});
  const boardRect = useRef<BoardRect | null>(null);
  const boardNode = useRef<View>(null);
  const [activeTicket, setActiveTicket] = useState<ProjectTicket | null>(null);
  const [droppingId, setDroppingId] = useState<string | null>(null);
  const activeId = useRef<string | null>(null);
  const [over, setOver] = useState<{ columnId: string; index: number } | null>(
    null,
  );
  const targetRef = useRef<typeof over>(null);
  const beforeKeyboard = useRef<ProjectColumn[] | null>(null);
  const beforePointer = useRef<ProjectColumn[] | null>(null);
  const keyboardActive = useRef(false);
  const lastDragEnd = useRef(0);
  const draggedWidth = useSharedValue(261);
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const fingerOffset = useRef({ x: 0, y: 0 });
  const dropFrame = useRef(0);
  const dropGeneration = useRef(0);
  useEffect(() => () => {
    dropGeneration.current++;
    if (dropFrame.current) cancelAnimationFrame(dropFrame.current);
    cancelAnimation(dragX);
    cancelAnimation(dragY);
    cancelAnimation(draggedWidth);
  }, [dragX, dragY, draggedWidth]);
  const finishDrop = useCallback((generation?: number) => {
    if (generation !== undefined && generation !== dropGeneration.current) return;
    setActiveTicket(null);
    setDroppingId(null);
  }, []);
  const overlayStyle = useAnimatedStyle(
    () => ({
      position: 'absolute',
      left: dragX.value,
      top: dragY.value,
      width: draggedWidth.value,
    }),
    [dragX, dragY, draggedWidth],
  );
  const detailColumn = columns.find((column) =>
    column.tickets.some((ticket) => ticket.id === detailId),
  );
  const detailTicket = detailColumn?.tickets.find(
    (ticket) => ticket.id === detailId,
  );
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

  const measure = useCallback(() => {
    for (const [id, node] of Object.entries(columnNodes.current))
      node?.measureInWindow((x, y, width, height) => {
        columnRects.current[id] = { x, y, width, height };
      });
    for (const [id, node] of Object.entries(ticketNodes.current))
      node?.measureInWindow((x, y, width, height) => {
        ticketRects.current[id] = { x, y, width, height };
      });
    boardNode.current?.measureInWindow((x, y, width, height) => {
      boardRect.current = { x, y, width, height };
    });
  }, []);
  const commit = useCallback(
    (next: ProjectColumn[]) => {
      columnsRef.current = next;
      setColumns(next);
      onColumnsChange?.(cloneColumns(next));
    },
    [onColumnsChange],
  );
  const openDetail = useCallback(
    (id: string) => {
      if (activeId.current || Date.now() - lastDragEnd.current < 350) return;
      setDetailId(id);
      const ticket = columnsRef.current
        .flatMap((column) => column.tickets)
        .find((ticket) => ticket.id === id);
      if (ticket) onTicketOpen?.(ticket);
    },
    [onTicketOpen],
  );
  const beginDrag = useCallback(
    (id: string, x: number, y: number) => {
      const ticket = columnsRef.current
        .flatMap((column) => column.tickets)
        .find((ticket) => ticket.id === id);
      if (!ticket) return;
      measure();
      const rect = ticketRects.current[id];
      activeId.current = id;
      beforePointer.current = cloneColumns(columnsRef.current);
      dropGeneration.current++;
      cancelAnimation(dragX);
      cancelAnimation(dragY);
      cancelAnimation(draggedWidth);
      if (dropFrame.current) cancelAnimationFrame(dropFrame.current);
      setDroppingId(null);
      fingerOffset.current = {
        x: rect ? x - rect.x : 0,
        y: rect ? y - rect.y : 0,
      };
      dragX.value = rect?.x ?? x;
      dragY.value = rect?.y ?? y;
      draggedWidth.value = rect?.width ?? 261;
      setSort('manual');
      setActiveTicket(ticket);
    },
    [measure, dragX, dragY, draggedWidth],
  );
  const dragOver = useCallback(
    (x: number, y: number) => {
      if (!activeId.current) return;
      dragX.value = x - fingerOffset.current.x;
      dragY.value = y - fingerOffset.current.y;
      const next = dropTarget(
        x,
        y,
        visibleColumns,
        columnRects.current,
        ticketRects.current,
        activeId.current,
      );
      if (
        next?.columnId !== targetRef.current?.columnId ||
        next?.index !== targetRef.current?.index
      ) {
        targetRef.current = next;
        setOver(next);
      }
      if (next) {
        const current = columnsRef.current;
        const source = current.find((column) => column.tickets.some((ticket) => ticket.id === activeId.current));
        if (source && source.id !== next.columnId) {
          const preview = moveTicket(current, activeId.current, next.columnId, next.index);
          columnsRef.current = preview;
          setColumns(preview);
        }
      }
      const board = boardRect.current;
      if (board && (x < board.x + 32 || x > board.x + board.width - 32)) {
        scrollX.current = Math.max(
          0,
          scrollX.current + (x < board.x + 32 ? -12 : 12),
        );
        scrollView.current?.scrollTo({ x: scrollX.current, animated: false });
      }
      const rect = next && columnRects.current[next.columnId];
      if (next && rect && (y < rect.y + 56 || y > rect.y + rect.height - 32)) {
        const scroll = Math.max(
          0,
          (columnScrollY.current[next.columnId] ?? 0) +
            (y < rect.y + 56 ? -10 : 10),
        );
        columnScrollY.current[next.columnId] = scroll;
        columnScrolls.current[next.columnId]?.scrollTo({
          y: scroll,
          animated: false,
        });
      }
    },
    [visibleColumns, dragX, dragY],
  );
  const endDrag = useCallback(
    (success: boolean) => {
      const id = activeId.current;
      const target = targetRef.current;
      if (!id) return;
      if (success && id && target) {
        const visible =
          visibleColumns
            .find((column) => column.id === target.columnId)
            ?.tickets.filter((ticket) => ticket.id !== id) ?? [];
        const anchor = visible[target.index];
        const full =
          columnsRef.current
            .find((column) => column.id === target.columnId)
            ?.tickets.filter((ticket) => ticket.id !== id) ?? [];
        const index = anchor
          ? full.findIndex((ticket) => ticket.id === anchor.id)
          : full.length;
        commit(moveTicket(columnsRef.current, id, target.columnId, index));
        AccessibilityInfo.announceForAccessibility?.(
          `${activeTicket?.code ?? ''}, ${columnsRef.current.find((column) => column.id === target.columnId)?.title ?? target.columnId}`,
        );
      } else if (beforePointer.current) {
        columnsRef.current = beforePointer.current;
        setColumns(beforePointer.current);
      }
      beforePointer.current = null;
      activeId.current = null;
      targetRef.current = null;
      lastDragEnd.current = Date.now();
      setOver(null);
      if (reducedMotion) {
        finishDrop();
        return;
      }
      setDroppingId(id);
      const generation = ++dropGeneration.current;
      // React first mounts the destination ticket; its window rect is the
      // landing position even after a column reorder or a scaled preview.
      dropFrame.current = requestAnimationFrame(() => {
        const node = ticketNodes.current[id];
        if (!node) {
          finishDrop(generation);
          return;
        }
        node.measureInWindow((x, y, width) => {
          if (generation !== dropGeneration.current) return;
          if (![x, y, width].every(Number.isFinite) || width <= 0) {
            finishDrop(generation);
            return;
          }
          const config = { duration: 320, easing: Easing.bezier(0.22, 1, 0.36, 1) };
          dragX.value = withTiming(x, config);
          draggedWidth.value = withTiming(width, config);
          dragY.value = withTiming(y, config, (finished) => {
            if (finished) runOnJS(finishDrop)(generation);
          });
        });
      });
    },
    [visibleColumns, activeTicket, commit, reducedMotion, finishDrop, dragX, dragY, draggedWidth],
  );
  function keyboardMove(id: string, key: string) {
    const current = columnsRef.current;
    const sourceIndex = current.findIndex((column) =>
      column.tickets.some((ticket) => ticket.id === id),
    );
    const source = current[sourceIndex];
    if (!source) return;
    const index = source.tickets.findIndex((ticket) => ticket.id === id);
    if (key === ' ' && !keyboardActive.current) {
      beforeKeyboard.current = cloneColumns(current);
      keyboardActive.current = true;
      activeId.current = id;
      setSort('manual');
      AccessibilityInfo.announceForAccessibility?.(
        `${source.tickets[index]?.code}, ${m.keyboardHint}`,
      );
      return;
    }
    if (!keyboardActive.current) return;
    if (key === 'Escape') {
      if (beforeKeyboard.current) {
        columnsRef.current = beforeKeyboard.current;
        setColumns(beforeKeyboard.current);
      }
    } else if (key === ' ') {
      commit(current);
    } else {
      const shown = current.filter(
        (column) => showDone || column.id !== 'done',
      );
      const shownIndex = shown.findIndex((column) => column.id === source.id);
      const horizontalKey =
        direction === 'rtl'
          ? key === 'ArrowLeft'
            ? 'ArrowRight'
            : key === 'ArrowRight'
              ? 'ArrowLeft'
              : key
          : key;
      const target =
        horizontalKey === 'ArrowLeft'
          ? shown[shownIndex - 1]
          : horizontalKey === 'ArrowRight'
            ? shown[shownIndex + 1]
            : source;
      if (!target) return;
      const position =
        target.id !== source.id
          ? Math.min(index, target.tickets.length)
          : key === 'ArrowUp'
            ? Math.max(0, index - 1)
            : key === 'ArrowDown'
              ? Math.min(source.tickets.length - 1, index + 1)
              : index;
      const next = moveTicket(current, id, target.id, position);
      columnsRef.current = next;
      setColumns(next);
      AccessibilityInfo.announceForAccessibility?.(
        `${target.title}, ${position + 1}`,
      );
      return;
    }
    beforeKeyboard.current = null;
    keyboardActive.current = false;
    activeId.current = null;
    lastDragEnd.current = Date.now();
    requestAnimationFrame(() => {
      (
        ticketNodes.current[id] as (View & { focus?: () => void }) | null
      )?.focus?.();
    });
  }
  const keyboardHandler = useRef(keyboardMove);
  keyboardHandler.current = keyboardMove;
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const onKey = (event: KeyboardEvent) => {
      if (
        keyboardActive.current &&
        activeId.current &&
        [
          ' ',
          'Escape',
          'ArrowLeft',
          'ArrowRight',
          'ArrowUp',
          'ArrowDown',
        ].includes(event.key)
      ) {
        event.preventDefault();
        event.stopPropagation();
        keyboardHandler.current(activeId.current, event.key);
        return;
      }
      if (event.key === ' ') {
        const nodeId =
          event.target instanceof Element
            ? event.target.closest('[id]')?.id
            : undefined;
        const ticket = columnsRef.current
          .flatMap((column) => column.tickets)
          .find((ticket) => `${boardId}-${ticket.id}` === nodeId);
        if (ticket) {
          event.preventDefault();
          event.stopPropagation();
          keyboardHandler.current(ticket.id, event.key);
        }
      }
    };
    document.addEventListener('keydown', onKey, true);
    const linkedTicket = () => {
      const id = new URLSearchParams(window.location.hash.slice(1)).get(
        'ticket',
      );
      if (
        id &&
        columnsRef.current.some((column) =>
          column.tickets.some((ticket) => ticket.id === id),
        )
      )
        setDetailId(id);
    };
    linkedTicket();
    window.addEventListener('hashchange', linkedTicket);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      window.removeEventListener('hashchange', linkedTicket);
    };
  }, [boardId]);
  function addTicket(draft: NewProjectTicket) {
    const sequence = nextTicket.current++;
    let id = `ticket-new-${sequence}`;
    while (
      columnsRef.current.some((column) =>
        column.tickets.some((ticket) => ticket.id === id),
      )
    )
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
        column.id === draft.columnId
          ? { ...column, tickets: [ticket, ...column.tickets] }
          : column,
      ),
    );
    setSequence(nextTicket.current);
    requestAnimationFrame(() => {
      const index = visibleColumns.findIndex(
        (column) => column.id === draft.columnId,
      );
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
          <BreadcrumbItem
            leading={<Avatar size="xs" color="blue" initials={teamName[0]} />}
          >
            {teamName}
          </BreadcrumbItem>
          <BreadcrumbItem
            leading={
              <Avatar size="xs" color="neutral" initials={ownerName[0]} />
            }
          >
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
      <StyledView
        ref={boardNode}
        className="-mx-3 min-h-0 flex-1 overflow-x-auto overflow-y-hidden overscroll-x-contain [scrollbar-width:thin] sm:-mx-6 lg:-me-7"
        style={{
          marginLeft: width >= 640 ? -24 : -12,
          marginRight: width >= 1024 ? -28 : width >= 640 ? -24 : -12,
        }}
        onLayout={(event) => {
          setAvailableWidth(event.nativeEvent.layout.width);
          measure();
        }}
      >
        <ScrollView
          ref={scrollView}
          horizontal
          style={{ flex: 1 }}
          contentContainerStyle={{
            gap: 8,
            paddingLeft: width >= 640 ? 24 : 12,
            paddingRight: width >= 1024 ? 28 : width >= 640 ? 24 : 12,
          }}
          showsHorizontalScrollIndicator
          onScroll={(event) => {
            scrollX.current = event.nativeEvent.contentOffset.x;
            measure();
          }}
          scrollEventThrottle={16}
          accessibilityLabel={m.columns}
        >
          {visibleColumns.map((column) => (
            <StyledView
              key={column.id}
              ref={(node) => {
                columnNodes.current[column.id] = node;
              }}
              onLayout={measure}
              className={cx(
                'relative flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-2-5xl bg-background-secondary-default pt-3',
                'ring-2 ring-inset ring-transparent transition-[box-shadow,background-color] duration-150 ease-out',
                over?.columnId === column.id &&
                  'bg-background-secondary-hover ring-border-button-hover',
              )}
              style={{ width: columnWidth, minHeight: 300 }}
              testID={`${testID}-column-${column.id}`}
            >
              <StyledView className="flex h-5 shrink-0 flex-row items-center justify-between px-3">
                <StyledView className="flex min-w-0 flex-row items-center gap-1.5">
                  <Text variant="body-medium">{column.title}</Text>
                  <Text
                    variant="body-medium"
                    style={{ color: colors.textSecondary }}
                  >
                    {column.tickets.length}/{column.limit}
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
                    <DropdownMenuContent
                      label={`${m.actions}: ${column.title}`}
                    >
                      <DropdownMenuItem
                        onPress={() => setCreate({ columnId: column.id })}
                      >
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
              <StyledView className="relative min-h-0 flex-1">
                <ScrollView
                  ref={(node) => {
                    columnScrolls.current[column.id] = node;
                  }}
                  style={{ flex: 1 }}
                  contentContainerStyle={{
                    paddingHorizontal: 6,
                    paddingTop: 8,
                  }}
                  accessibilityLabel={column.title}
                  onScroll={(event) => {
                    columnScrollY.current[column.id] =
                      event.nativeEvent.contentOffset.y;
                    measure();
                  }}
                  scrollEventThrottle={16}
                >
                  <TicketPresenceList tickets={column.tickets} retainId={beforePointer.current ? activeTicket?.id : undefined}>
                    {({ ticket, present }, paintStyle, onHeight) => present || (activeTicket?.id === ticket.id && beforePointer.current !== null) ? (
                    <DraggableTicket
                      key={ticket.id}
                      nativeID={`${boardId}-${ticket.id}`}
                      ticket={ticket}
                      interactive={present}
                      members={members}
                      dragging={activeTicket?.id === ticket.id}
                      landing={droppingId === ticket.id}
                      paintStyle={paintStyle}
                      onHeight={onHeight}
                      target={
                        over?.columnId === column.id && over.index === column.tickets.findIndex((item) => item.id === ticket.id)
                      }
                      register={(node) => {
                        if (present) ticketNodes.current[ticket.id] = node;
                      }}
                      onLayout={measure}
                      onOpen={() => openDetail(ticket.id)}
                      onStart={(x, y) => beginDrag(ticket.id, x, y)}
                      onUpdate={dragOver}
                      onEnd={endDrag}
                      onAccessibleMove={(key) => {
                        const sourceIndex = columnsRef.current.findIndex(
                          (item) => item.id === column.id,
                        );
                        const destination =
                          key === 'next'
                            ? columnsRef.current[sourceIndex + 1]
                            : key === 'previous'
                              ? columnsRef.current[sourceIndex - 1]
                              : column;
                        if (destination) {
                          const currentIndex =
                            columnsRef.current
                              .find((item) => item.id === column.id)
                              ?.tickets.findIndex(
                                (item) => item.id === ticket.id,
                              ) ?? 0;
                          commit(
                            moveTicket(
                              columnsRef.current,
                              ticket.id,
                              destination.id,
                              destination.id === column.id
                                ? currentIndex + (key === 'up' ? -1 : 1)
                                : 0,
                            ),
                          );
                        }
                      }}
                    />
                    ) : (
                      <SourceView onLayout={(event) => onHeight(event.nativeEvent.layout.height)}>
                        <AnimatedView style={paintStyle}>
                          <SourceView className="pointer-events-none opacity-20">
                            <TicketCard overlay ticket={ticket} members={members} />
                          </SourceView>
                        </AnimatedView>
                      </SourceView>
                    )}
                  </TicketPresenceList>
                  {over?.columnId === column.id &&
                    over.index >= column.tickets.length && (
                      <StyledView
                        style={{ height: 3, backgroundColor: colors.primary }}
                      />
                    )}
                </ScrollView>
                {column.tickets.length === 0 && <ProjectBoardEmptyState />}
              </StyledView>
            </StyledView>
          ))}
        </ScrollView>
      </StyledView>
      {activeTicket && (
        <Portal>
          <OverlayRoot>
            <AnimatedView
              testID="project-board-drag-overlay"
              pointerEvents="none"
              aria-hidden
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={overlayStyle}
            >
              <TicketCard overlay ticket={activeTicket} members={members} />
            </AnimatedView>
          </OverlayRoot>
        </Portal>
      )}
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
          onUpdate={(patch) =>
            commit(updateTicket(columnsRef.current, detailTicket.id, patch))
          }
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

function DraggableTicket({
  nativeID,
  ticket,
  interactive,
  members,
  dragging,
  landing,
  paintStyle,
  onHeight,
  target,
  register,
  onLayout,
  onOpen,
  onStart,
  onUpdate,
  onEnd,
  onAccessibleMove,
}: {
  nativeID: string;
  ticket: ProjectTicket;
  interactive: boolean;
  members: Readonly<Record<string, ProjectMember>>;
  dragging: boolean;
  landing: boolean;
  paintStyle: AnimatedStyle<ViewStyle>;
  onHeight: (height: number) => void;
  target: boolean;
  register: (node: View | null) => void;
  onLayout: () => void;
  onOpen: () => void;
  onStart: (x: number, y: number) => void;
  onUpdate: (x: number, y: number) => void;
  onEnd: (success: boolean) => void;
  onAccessibleMove: (direction: 'up' | 'down' | 'next' | 'previous') => void;
}) {
  const { colors } = useTheme();
  const { messages: m } = useMessages(PROJECT_BOARD_MESSAGES);
  const callbacks = useRef({ onStart, onUpdate, onEnd });
  callbacks.current = { onStart, onUpdate, onEnd };
  const start = useCallback(
    (x: number, y: number) => callbacks.current.onStart(x, y),
    [],
  );
  const update = useCallback(
    (x: number, y: number) => callbacks.current.onUpdate(x, y),
    [],
  );
  const finish = useCallback(
    (success: boolean) => callbacks.current.onEnd(success),
    [],
  );
  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .activateAfterLongPress(Platform.OS === 'web' ? 0 : 180)
        .minDistance(5)
        .onStart((event) => {
          runOnJS(start)(event.absoluteX, event.absoluteY);
        })
        .onUpdate((event) => {
          runOnJS(update)(event.absoluteX, event.absoluteY);
        })
        .onFinalize((_event, success) => {
          runOnJS(finish)(success);
        }),
    [start, update, finish],
  );

  return (
    <GestureDetector gesture={gesture}>
      <AnimatedView
        className="shrink-0 touch-manipulation rounded-xl outline-none focus-visible:ring-[2.5px] focus-visible:ring-border-button-hover"
        style={{
          opacity: landing ? 0 : dragging ? 0.2 : 1,
          borderTopWidth: target ? 3 : 0,
          borderTopColor: colors.primary,
        }}
      >
        <StyledPressable
          nativeID={interactive ? nativeID : undefined}
          ref={register}
          onLayout={(event) => {
            onHeight(event.nativeEvent.layout.height);
            onLayout();
          }}
          onPress={interactive ? onOpen : undefined}
          accessibilityRole="button"
          accessibilityLabel={m.openTicket(ticket.code, ticket.title)}
          aria-haspopup="dialog"
          accessibilityHint={m.keyboardHint}
          accessibilityActions={[
            { name: 'moveUp', label: m.moveUp },
            { name: 'moveDown', label: m.moveDown },
            { name: 'nextColumn', label: m.nextColumn },
            { name: 'previousColumn', label: m.previousColumn },
          ]}
          onAccessibilityAction={(event) => {
            const action = event.nativeEvent.actionName;
            onAccessibleMove(
              action === 'moveUp'
                ? 'up'
                : action === 'moveDown'
                  ? 'down'
                  : action === 'nextColumn'
                    ? 'next'
                    : 'previous',
            );
          }}
        >
          <AnimatedView style={paintStyle}>
            <TicketCard ticket={ticket} members={members} />
          </AnimatedView>
        </StyledPressable>
      </AnimatedView>
    </GestureDetector>
  );
}
