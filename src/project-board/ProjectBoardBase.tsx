import { useDirection } from '../direction';
import { useTemplateCopy } from '../template-copy';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Platform, ScrollView, useWindowDimensions, type View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { FadeIn, FadeOut, LinearTransition, runOnJS, useAnimatedStyle, useReducedMotion, useSharedValue } from 'react-native-reanimated';
import { Avatar } from '../avatar';
import { Chip } from '../chip';
import { RiAddLine, RiArrowRightSLine, RiFolder6Line, RiInbox2Line, RiKanbanView2, RiMenuLine } from '../icons/remix';
import { OverlayRoot } from '../overlay';
import { StyledView, StyledPressable } from '../styles/styled-primitives';
import { Text } from '../typography';
import { useTheme } from '../theme/use-theme';
import { CreateTicketDialog } from './CreateTicketDialog';
import { TicketDetailDialog } from './TicketDetailDialog';
import { ProjectBoardControls } from './ProjectBoardControls';
import { ProjectBoardEmptyState } from './ProjectBoardEmptyState';
import { useProjectBoardPlatform } from './context';
import { cloneColumns, dropTarget, moveTicket, sortColumns, updateTicket, type BoardRect } from './shared';
import type { BoardSort, NewProjectTicket, ProjectBoardProps, ProjectColumn, ProjectMember, ProjectTicket, TicketPriority } from './types';

const AnimatedView = Animated.createAnimatedComponent(StyledView);
const EMPTY_COLUMNS: readonly ProjectColumn[] = [];
const EMPTY_MEMBERS: Readonly<Record<string, ProjectMember>> = {};

function MemberAvatars({ ids, members }: { ids: string[]; members: Readonly<Record<string, ProjectMember>> }) {
  const localize = useTemplateCopy();
  return localize((<StyledView className="flex flex-row items-center ps-1" accessibilityLabel={ids.map(id => members[id]?.name).filter(Boolean).join(', ')}>
    {ids.map((id, index) => { const member = members[id]; return member && <Avatar key={id} size={22} source={member.avatar} alt={member.name} initials={member.initials} style={{ marginLeft: index > 0 ? -6 : 0 }} />; })}
  </StyledView>));
}
function TicketCard({ ticket, members }: { ticket: ProjectTicket; members: Readonly<Record<string, ProjectMember>> }) {
  const localize = useTemplateCopy();
  const { colors } = useTheme();
  const tone = ticket.priority === 'Low' ? 'info' : ticket.priority === 'Medium' ? 'warning' : ticket.priority === 'High' ? 'warning' : 'error';
  return localize((<StyledView className="relative flex w-full flex-col gap-2 rounded-xl p-3" style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.borderLight }}>
    <StyledView className="flex min-h-[22px] flex-row items-start justify-between gap-3">
      <StyledView className="flex min-w-0 flex-1 flex-row items-center"><Text variant="body-2-medium" style={{ color: colors.textSecondary }}>{ticket.code}</Text><RiArrowRightSLine width={15} height={15} fill={colors.textTertiary} /><Text numberOfLines={1} variant="body-2-medium" style={{ color: colors.textSecondary, flexShrink: 1 }}>{ticket.area}</Text></StyledView>
      <MemberAvatars ids={ticket.assignees} members={members} />
    </StyledView>
    <StyledView className="flex flex-col items-start gap-2">
      <StyledView className="flex flex-row items-center gap-1.5"><Chip color={tone} size="small">{ticket.priority}</Chip><Chip size="small" variant="outlined" color="default" startIcon={<RiFolder6Line width={13} height={13} fill={colors.textTertiary} />}>{ticket.project}</Chip></StyledView>
      <StyledView className="flex w-full flex-col gap-[5px]"><Text variant="body-medium" style={{ color: colors.text }}>{ticket.title}</Text><Text variant="body-2-medium" style={{ color: colors.textSecondary }}>{ticket.since}</Text></StyledView>
    </StyledView>
  </StyledView>));
}

export function ProjectBoardBase({ onMenuClick, title = 'Bloom Design Tasks', teamName = 'Bloom team', ownerName = 'Mertcan', headerActions, onInboxClick, initialColumns = EMPTY_COLUMNS, members = EMPTY_MEMBERS, projects: suppliedProjects, currentUserId, onColumnsChange, onTicketOpen, onCopyTicketLink, onCopyTicketId, initialTicketId, style, className, accessibilityLabel = 'Project board', testID = 'project-board' }: ProjectBoardProps) {
  const localize = useTemplateCopy();
  const { colors } = useTheme();
  const direction = useDirection();
  const boardId = useId();
  const { Button, Portal, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } = useProjectBoardPlatform();
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
  const projects = useMemo(() => suppliedProjects ?? [...new Set(columns.flatMap(column => column.tickets.map(ticket => ticket.project)))], [suppliedProjects, columns]);
  const visibleColumns = useMemo(() => columns.filter(column => showDone || column.id !== 'done').map(column => ({ ...column, tickets: column.tickets.filter(ticket => (priorityFilter === 'all' || ticket.priority === priorityFilter) && (projectFilter === 'all' || ticket.project === projectFilter)) })), [columns, showDone, priorityFilter, projectFilter]);
  const [create, setCreate] = useState<{ columnId?: string } | null>(null);
  const [detailId, setDetailId] = useState<string | null>(initialTicketId ?? null);
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
  const activeId = useRef<string | null>(null);
  const [over, setOver] = useState<{ columnId: string; index: number } | null>(null);
  const targetRef = useRef<typeof over>(null);
  const beforeKeyboard = useRef<ProjectColumn[] | null>(null);
  const keyboardActive = useRef(false);
  const lastDragEnd = useRef(0);
  const draggedWidth = useSharedValue(261);
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const fingerOffset = useRef({ x: 0, y: 0 });
  const overlayStyle = useAnimatedStyle(() => ({ position: 'absolute', left: dragX.value, top: dragY.value, width: draggedWidth.value }), [dragX, dragY, draggedWidth]);
  const detailColumn = columns.find(column => column.tickets.some(ticket => ticket.id === detailId));
  const detailTicket = detailColumn?.tickets.find(ticket => ticket.id === detailId);
  const [availableWidth, setAvailableWidth] = useState(width);
  const columnWidth = fillColumns && availableWidth > 1441 ? Math.max(273, (availableWidth - 24 - 8 * (visibleColumns.length - 1)) / Math.max(1, visibleColumns.length)) : 273;

  const measure = useCallback(() => {
    for (const [id, node] of Object.entries(columnNodes.current)) node?.measureInWindow((x, y, width, height) => { columnRects.current[id] = { x, y, width, height }; });
    for (const [id, node] of Object.entries(ticketNodes.current)) node?.measureInWindow((x, y, width, height) => { ticketRects.current[id] = { x, y, width, height }; });
    boardNode.current?.measureInWindow((x, y, width, height) => { boardRect.current = { x, y, width, height }; });
  }, []);
  const commit = useCallback((next: ProjectColumn[]) => { columnsRef.current = next; setColumns(next); onColumnsChange?.(cloneColumns(next)); }, [onColumnsChange]);
  const openDetail = useCallback((id: string) => {
    if (activeId.current || Date.now() - lastDragEnd.current < 350) return;
    setDetailId(id);
    const ticket = columnsRef.current.flatMap(column => column.tickets).find(ticket => ticket.id === id);
    if (ticket) onTicketOpen?.(ticket);
  }, [onTicketOpen]);
  const beginDrag = useCallback((id: string, x: number, y: number) => {
    const ticket = columnsRef.current.flatMap(column => column.tickets).find(ticket => ticket.id === id);
    if (!ticket) return;
    measure();
    const rect = ticketRects.current[id];
    activeId.current = id;
    fingerOffset.current = { x: rect ? x - rect.x : 0, y: rect ? y - rect.y : 0 };
    dragX.value = rect?.x ?? x; dragY.value = rect?.y ?? y; draggedWidth.value = rect?.width ?? 261;
    setSort('manual'); setActiveTicket(ticket);
  }, [measure, dragX, dragY, draggedWidth]);
  const dragOver = useCallback((x: number, y: number) => {
    if (!activeId.current) return;
    dragX.value = x - fingerOffset.current.x; dragY.value = y - fingerOffset.current.y;
    const next = dropTarget(x, y, visibleColumns, columnRects.current, ticketRects.current, activeId.current);
    if (next?.columnId !== targetRef.current?.columnId || next?.index !== targetRef.current?.index) { targetRef.current = next; setOver(next); }
    const board = boardRect.current;
    if (board && (x < board.x + 32 || x > board.x + board.width - 32)) {
      scrollX.current = Math.max(0, scrollX.current + (x < board.x + 32 ? -12 : 12));
      scrollView.current?.scrollTo({ x: scrollX.current, animated: false });
    }
    const rect = next && columnRects.current[next.columnId];
    if (next && rect && (y < rect.y + 56 || y > rect.y + rect.height - 32)) {
      const scroll = Math.max(0, (columnScrollY.current[next.columnId] ?? 0) + (y < rect.y + 56 ? -10 : 10));
      columnScrollY.current[next.columnId] = scroll;
      columnScrolls.current[next.columnId]?.scrollTo({ y: scroll, animated: false });
    }
  }, [visibleColumns, dragX, dragY]);
  const endDrag = useCallback((success: boolean) => {
    const id = activeId.current; const target = targetRef.current;
    if (!id) return;
    if (success && id && target) {
      const visible = visibleColumns.find(column => column.id === target.columnId)?.tickets.filter(ticket => ticket.id !== id) ?? [];
      const anchor = visible[target.index];
      const full = columnsRef.current.find(column => column.id === target.columnId)?.tickets.filter(ticket => ticket.id !== id) ?? [];
      const index = anchor ? full.findIndex(ticket => ticket.id === anchor.id) : full.length;
      commit(moveTicket(columnsRef.current, id, target.columnId, index));
      AccessibilityInfo.announceForAccessibility?.(`Moved ${activeTicket?.code ?? 'ticket'} to ${columnsRef.current.find(column => column.id === target.columnId)?.title ?? target.columnId}`);
    }
    activeId.current = null; targetRef.current = null; lastDragEnd.current = Date.now(); setActiveTicket(null); setOver(null);
  }, [visibleColumns, activeTicket, commit]);
  function keyboardMove(id: string, key: string) {
    const current = columnsRef.current;
    const sourceIndex = current.findIndex(column => column.tickets.some(ticket => ticket.id === id));
    const source = current[sourceIndex];
    if (!source) return;
    const index = source.tickets.findIndex(ticket => ticket.id === id);
    if (key === ' ' && !keyboardActive.current) { beforeKeyboard.current = cloneColumns(current); keyboardActive.current = true; activeId.current = id; setSort('manual'); AccessibilityInfo.announceForAccessibility?.(`Picked up ${source.tickets[index]?.code}. Use arrow keys to move, space to drop, Escape to cancel.`); return; }
    if (!keyboardActive.current) return;
    if (key === 'Escape') { if (beforeKeyboard.current) { columnsRef.current = beforeKeyboard.current; setColumns(beforeKeyboard.current); } }
    else if (key === ' ') { commit(current); }
    else {
      const shown = current.filter(column => showDone || column.id !== 'done');
      const shownIndex = shown.findIndex(column => column.id === source.id);
      const horizontalKey = direction === 'rtl' ? key === 'ArrowLeft' ? 'ArrowRight' : key === 'ArrowRight' ? 'ArrowLeft' : key : key;
      const target = horizontalKey === 'ArrowLeft' ? shown[shownIndex - 1] : horizontalKey === 'ArrowRight' ? shown[shownIndex + 1] : source;
      if (!target) return;
      const position = target.id !== source.id ? Math.min(index, target.tickets.length) : key === 'ArrowUp' ? Math.max(0, index - 1) : key === 'ArrowDown' ? Math.min(source.tickets.length - 1, index + 1) : index;
      const next = moveTicket(current, id, target.id, position);
      columnsRef.current = next; setColumns(next);
      AccessibilityInfo.announceForAccessibility?.(`${target.title}, position ${position + 1}`);
      return;
    }
    beforeKeyboard.current = null; keyboardActive.current = false; activeId.current = null; lastDragEnd.current = Date.now();
    requestAnimationFrame(() => { (ticketNodes.current[id] as (View & { focus?: () => void }) | null)?.focus?.(); });
  }
  const keyboardHandler = useRef(keyboardMove);
  keyboardHandler.current = keyboardMove;
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const onKey = (event: KeyboardEvent) => {
      if (keyboardActive.current && activeId.current && [' ', 'Escape', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) { event.preventDefault(); event.stopPropagation(); keyboardHandler.current(activeId.current, event.key); return; }
      if (event.key === ' ') {
        const nodeId = event.target instanceof Element ? event.target.closest('[id]')?.id : undefined;
        const ticket = columnsRef.current.flatMap(column => column.tickets).find(ticket => `${boardId}-${ticket.id}` === nodeId);
        if (ticket) { event.preventDefault(); event.stopPropagation(); keyboardHandler.current(ticket.id, event.key); }
      }
    };
    document.addEventListener('keydown', onKey, true);
    const linkedTicket = () => { const id = new URLSearchParams(window.location.hash.slice(1)).get('ticket'); if (id && columnsRef.current.some(column => column.tickets.some(ticket => ticket.id === id))) setDetailId(id); };
    linkedTicket(); window.addEventListener('hashchange', linkedTicket);
    return () => { document.removeEventListener('keydown', onKey, true); window.removeEventListener('hashchange', linkedTicket); };
  }, [boardId]);
  function addTicket(draft: NewProjectTicket) {
    const sequence = nextTicket.current++;
    let id = `ticket-new-${sequence}`;
    while (columnsRef.current.some(column => column.tickets.some(ticket => ticket.id === id))) id = `ticket-new-${nextTicket.current++}`;
    const ticket: ProjectTicket = { id, code: `FE-${sequence}`, area: 'Project board', title: draft.title, description: draft.description, createdBy: currentUserId, since: 'Since just now', priority: draft.priority, project: draft.project, assignees: draft.assignees };
    commit(columnsRef.current.map(column => column.id === draft.columnId ? { ...column, tickets: [ticket, ...column.tickets] } : column));
    setSequence(nextTicket.current);
    requestAnimationFrame(() => { const index = visibleColumns.findIndex(column => column.id === draft.columnId); scrollView.current?.scrollTo({ x: Math.max(0, index * (columnWidth + 8)), animated: !reducedMotion }); columnScrolls.current[draft.columnId]?.scrollTo({ y: 0, animated: !reducedMotion }); measure(); });
  }
  return localize((<StyledView className={className} style={[{ direction, flex: 1, minHeight: 0, width: '100%', flexDirection: 'column', gap: 10 }, style]} accessibilityLabel={accessibilityLabel} testID={testID}>
    <StyledView className="flex w-full shrink-0 flex-col gap-2">
      <StyledView className="flex flex-row items-center gap-1.5"><Avatar size="xs" color="blue" initials={teamName[0]} /><Text variant="body-2-medium">{teamName}</Text><Text>›</Text><Avatar size="xs" color="neutral" initials={ownerName[0]} /><Text variant="body-2-medium">{ownerName}</Text><Text>›</Text><RiKanbanView2 width={18} height={18} fill={colors.icon} /><Text variant="body-2-medium">Project board</Text></StyledView>
      <StyledView className="flex w-full flex-row flex-wrap items-end justify-between gap-2">
        <StyledView className="flex min-w-0 flex-row items-center gap-1.5">{onMenuClick && <Button iconOnly icon={<RiMenuLine width={20} height={20} fill={colors.icon} />} variant="ghost" accessibilityLabel="Open navigation" onPress={onMenuClick} />}<Text variant="title-2-medium" style={{ color: colors.text }}>{title}</Text></StyledView>
        <StyledView className="flex flex-row flex-wrap items-center justify-end gap-2.5">{headerActions}<Button variant="secondary" size="medium" iconOnly icon={<RiInbox2Line width={20} height={20} fill={colors.icon} />} accessibilityLabel="Open project inbox" onPress={onInboxClick} /><ProjectBoardControls sort={sort} onSort={value => { setSort(value); commit(sortColumns(columnsRef.current, value)); }} priority={priorityFilter} onPriority={setPriorityFilter} project={projectFilter} onProject={setProjectFilter} projects={projects} showDone={showDone} onShowDone={setShowDone} fillColumns={fillColumns} onFillColumns={setFillColumns} /><Button size="medium" leadingIcon={RiAddLine} onPress={() => setCreate({})} disabled={!columns.length}>New ticket</Button></StyledView>
      </StyledView>
    </StyledView>
    <StyledView ref={boardNode} className="min-h-0 flex-1" onLayout={event => { setAvailableWidth(event.nativeEvent.layout.width); measure(); }}>
      <ScrollView ref={scrollView} horizontal style={{ flex: 1 }} contentContainerStyle={{ gap: 8, paddingHorizontal: 12 }} showsHorizontalScrollIndicator onScroll={event => { scrollX.current = event.nativeEvent.contentOffset.x; measure(); }} scrollEventThrottle={16} accessibilityLabel="Project board columns">
        {visibleColumns.map(column => <StyledView key={column.id} ref={node => { columnNodes.current[column.id] = node; }} onLayout={measure} className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl pt-3" style={{ width: columnWidth, minHeight: 300, backgroundColor: over?.columnId === column.id ? colors.backgroundTertiary : colors.backgroundSecondary, borderWidth: 2, borderColor: over?.columnId === column.id ? colors.primary : 'transparent' }} testID={`${testID}-column-${column.id}`}>
          <StyledView className="flex h-5 shrink-0 flex-row items-center justify-between px-3"><StyledView className="flex min-w-0 flex-row items-center gap-1.5"><Text variant="body-medium">{column.title}</Text><Text variant="body-medium" style={{ color: colors.textSecondary }}>{column.tickets.length}/{column.limit}</Text></StyledView><StyledView className="flex flex-row items-center gap-1">
            <DropdownMenu><DropdownMenuTrigger asChild><StyledPressable accessibilityLabel={`More options for ${column.title}`} className="flex size-5 items-center justify-center"><Text style={{ color: colors.icon }}>···</Text></StyledPressable></DropdownMenuTrigger><DropdownMenuContent label={`${column.title} options`}><DropdownMenuItem onPress={() => setCreate({ columnId: column.id })}>Add ticket</DropdownMenuItem><DropdownMenuItem onPress={() => { setSort('title'); commit(sortColumns(columnsRef.current, 'title')); }}>Sort by title</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
            <StyledPressable accessibilityRole="button" accessibilityLabel={`Add ticket to ${column.title}`} onPress={() => setCreate({ columnId: column.id })} className="flex size-5 items-center justify-center"><RiAddLine width={20} height={20} fill={colors.icon} /></StyledPressable>
          </StyledView></StyledView>
          <StyledView className="relative min-h-0 flex-1"><ScrollView ref={node => { columnScrolls.current[column.id] = node; }} style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 6, paddingTop: 8, paddingBottom: 6, gap: 6 }} accessibilityLabel={`${column.title} tickets`} onScroll={event => { columnScrollY.current[column.id] = event.nativeEvent.contentOffset.y; measure(); }} scrollEventThrottle={16}>
            {column.tickets.map((ticket, index) => <DraggableTicket key={ticket.id} nativeID={`${boardId}-${ticket.id}`} ticket={ticket} members={members} dragging={activeTicket?.id === ticket.id} target={over?.columnId === column.id && over.index === index} register={node => { ticketNodes.current[ticket.id] = node; }} onLayout={measure} onOpen={() => openDetail(ticket.id)} onStart={(x, y) => beginDrag(ticket.id, x, y)} onUpdate={dragOver} onEnd={endDrag} onAccessibleMove={key => { const sourceIndex = columnsRef.current.findIndex(item => item.id === column.id); const destination = key === 'next' ? columnsRef.current[sourceIndex + 1] : key === 'previous' ? columnsRef.current[sourceIndex - 1] : column; if (destination) { const currentIndex = columnsRef.current.find(item => item.id === column.id)?.tickets.findIndex(item => item.id === ticket.id) ?? 0; commit(moveTicket(columnsRef.current, ticket.id, destination.id, destination.id === column.id ? currentIndex + (key === 'up' ? -1 : 1) : 0)); } }} />)}
            {over?.columnId === column.id && over.index >= column.tickets.length && <StyledView style={{ height: 3, backgroundColor: colors.primary }} />}
          </ScrollView>{column.tickets.length === 0 && <ProjectBoardEmptyState />}</StyledView>
        </StyledView>)}
      </ScrollView>
    </StyledView>
    {activeTicket && <Portal><OverlayRoot><AnimatedView pointerEvents="none" style={overlayStyle}><TicketCard ticket={activeTicket} members={members} /></AnimatedView></OverlayRoot></Portal>}
    {create && <CreateTicketDialog title={title} initialColumnId={create.columnId} code={`FE-${sequence}`} columns={columns} projects={projects} members={members} onClose={() => setCreate(null)} onCreate={addTicket} />}
    {detailTicket && detailColumn && <TicketDetailDialog key={detailId} title={title} ticket={detailTicket} column={detailColumn} columns={columns} members={members} projects={projects} currentUserId={currentUserId} onClose={() => setDetailId(null)} onUpdate={patch => commit(updateTicket(columnsRef.current, detailTicket.id, patch))} onMove={columnId => { if (columnId !== detailColumn.id) commit(moveTicket(columnsRef.current, detailTicket.id, columnId)); }} onCopyTicketLink={onCopyTicketLink} onCopyTicketId={onCopyTicketId} />}
  </StyledView>));
}

function DraggableTicket({ nativeID, ticket, members, dragging, target, register, onLayout, onOpen, onStart, onUpdate, onEnd, onAccessibleMove }: {
  nativeID: string; ticket: ProjectTicket; members: Readonly<Record<string, ProjectMember>>; dragging: boolean; target: boolean;
  register: (node: View | null) => void; onLayout: () => void; onOpen: () => void;
  onStart: (x: number, y: number) => void; onUpdate: (x: number, y: number) => void; onEnd: (success: boolean) => void; onAccessibleMove: (direction: 'up' | 'down' | 'next' | 'previous') => void;
}) {
  const localize = useTemplateCopy();
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const callbacks = useRef({ onStart, onUpdate, onEnd });
  callbacks.current = { onStart, onUpdate, onEnd };
  const start = useCallback((x: number, y: number) => callbacks.current.onStart(x, y), []);
  const update = useCallback((x: number, y: number) => callbacks.current.onUpdate(x, y), []);
  const finish = useCallback((success: boolean) => callbacks.current.onEnd(success), []);
  const gesture = useMemo(() => Gesture.Pan().activateAfterLongPress(Platform.OS === 'web' ? 0 : 180).minDistance(5)
    .onStart(event => { runOnJS(start)(event.absoluteX, event.absoluteY); })
    .onUpdate(event => { runOnJS(update)(event.absoluteX, event.absoluteY); })
    .onFinalize((_event, success) => { runOnJS(finish)(success); }), [start, update, finish]);

  return localize((<GestureDetector gesture={gesture}><AnimatedView entering={reducedMotion ? undefined : FadeIn.duration(320)} exiting={reducedMotion ? undefined : FadeOut.duration(320)} layout={reducedMotion ? undefined : LinearTransition.duration(260)} className="shrink-0 rounded-xl" style={{ opacity: dragging ? 0.2 : 1, borderTopWidth: target ? 3 : 0, borderTopColor: colors.primary }}>
    <StyledPressable nativeID={nativeID} ref={register} onLayout={onLayout} onPress={onOpen} accessibilityRole="button" accessibilityLabel={`Open ${ticket.code}: ${ticket.title}`} aria-haspopup="dialog" accessibilityHint="Press Enter to open. Space picks up, arrow keys move, space drops, Escape cancels." accessibilityActions={[{ name: 'moveUp', label: 'Move up' }, { name: 'moveDown', label: 'Move down' }, { name: 'nextColumn', label: 'Move to next column' }, { name: 'previousColumn', label: 'Move to previous column' }]} onAccessibilityAction={event => { const action = event.nativeEvent.actionName; onAccessibleMove(action === 'moveUp' ? 'up' : action === 'moveDown' ? 'down' : action === 'nextColumn' ? 'next' : 'previous'); }}>
      <TicketCard ticket={ticket} members={members} />
    </StyledPressable>
  </AnimatedView></GestureDetector>));
}
