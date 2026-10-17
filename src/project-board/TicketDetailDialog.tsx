import { useTemplateCopy } from '../template-copy';
import { useEffect, useRef, useState } from 'react';
import { Platform, Linking } from 'react-native';
import { Avatar } from '../avatar';
import { Checkbox } from '../checkbox';
import { TokensChartCard } from '../chart-cards/TokensChartCard';
import { Textarea } from '../textarea';
import { StyledView, StyledPressable } from '../styles/styled-primitives';
import { RiArrowUpLine, RiLinkM, RiMore2Line, RiStarLine } from '../icons/remix';
import { Text } from '../typography';
import { useTheme } from '../theme/use-theme';
import { useDialogControl } from '../dialog/context';
import { useProjectBoardPlatform } from './context';
import { PRIORITIES, PropertySelect } from './ProjectBoardControls';
import type { ProjectColumn, ProjectMember, ProjectTicket, TicketPriority } from './types';

export function TicketDetailDialog({ title: boardTitle, ticket, column, columns, members, projects, currentUserId, onClose, onUpdate, onMove, onCopyTicketLink, onCopyTicketId }: {
  title: string; ticket: ProjectTicket; column: ProjectColumn; columns: ProjectColumn[];
  members: Readonly<Record<string, ProjectMember>>; projects: readonly string[]; currentUserId?: string;
  onClose: () => void; onUpdate: (patch: Partial<ProjectTicket>) => void; onMove: (columnId: string) => void;
  onCopyTicketLink?: (ticket: ProjectTicket) => void | Promise<void>;
  onCopyTicketId?: (code: string) => void | Promise<void>;
}) {
  const localize = useTemplateCopy();
  const { Button, CloseButton, Dialog, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } = useProjectBoardPlatform();
  const control = useDialogControl();
  const { colors } = useTheme();
  const [comment, setComment] = useState('');
  const [editingDescription, setEditingDescription] = useState(false);
  const [draft, setDraft] = useState(ticket.description ?? '');
  const [copyMessage, setCopyMessage] = useState('');
  const copyResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sequence = useRef(0);
  useEffect(() => () => { if (copyResetTimer.current) clearTimeout(copyResetTimer.current); }, []);
  const creator = members[ticket.createdBy ?? ticket.assignees[0] ?? ''];
  async function copy(kind: 'link' | 'id') {
    if (copyResetTimer.current) clearTimeout(copyResetTimer.current);
    try {
      const callback = kind === 'link' ? onCopyTicketLink : onCopyTicketId;
      if (callback) {
        if (kind === 'link') await onCopyTicketLink?.(ticket);
        else await onCopyTicketId?.(ticket.code);
      } else if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        const url = new URL(window.location.href);
        url.hash = `ticket=${encodeURIComponent(ticket.id)}`;
        await navigator.clipboard.writeText(kind === 'id' ? ticket.code : url.toString());
      } else throw new Error('A product clipboard callback is required on native.');
      setCopyMessage(kind === 'id' ? 'Ticket ID copied' : 'Ticket link copied');
    } catch { setCopyMessage('Could not copy. Please try again.'); }
    copyResetTimer.current = setTimeout(() => setCopyMessage(''), 1600);
  }
  function postComment() {
    if (!comment.trim()) return;
    sequence.current++;
    onUpdate({ comments: [...(ticket.comments ?? []), { id: `${ticket.id}-comment-${Date.now()}-${sequence.current}`, author: currentUserId ? members[currentUserId]?.name ?? currentUserId : 'you', body: comment.trim(), time: 'Just now' }] });
    setComment('');
  }
  const iconStyle = { width: 26, height: 26, alignItems: 'center' as const, justifyContent: 'center' as const, borderRadius: 8 };
  return localize((<Dialog control={control} startOpen onClose={onClose} label={`${ticket.code} ticket details`} placement={{ base: 'bottom', md: 'right' }} width={609} contentPadding={0}>
    <StyledView className="flex flex-col">
      <StyledView className="flex flex-row items-start justify-between gap-3 px-6 pt-6 pb-5">
        <StyledView className="flex flex-1 flex-row flex-wrap items-center gap-1.5">
          <Text variant="caption-1-medium" style={{ color: colors.textSecondary }}>{boardTitle} › {ticket.code} › {ticket.area}</Text>
          <StyledPressable accessibilityRole="button" accessibilityLabel={ticket.isFavorite ? 'Remove from favorites' : 'Add to favorites'} aria-pressed={!!ticket.isFavorite} accessibilityState={{ selected: !!ticket.isFavorite }} style={iconStyle} onPress={() => onUpdate({ isFavorite: !ticket.isFavorite })}><RiStarLine width={17} height={17} fill={ticket.isFavorite ? colors.warning : colors.icon} /></StyledPressable>
          <StyledPressable accessibilityRole="button" accessibilityLabel="Copy ticket link" style={iconStyle} onPress={() => { void copy('link'); }}><RiLinkM width={18} height={18} fill={colors.icon} /></StyledPressable>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><StyledPressable accessibilityLabel="Ticket actions" style={[iconStyle, { borderColor: colors.border, borderWidth: 1 }]}><RiMore2Line width={18} height={18} fill={colors.icon} /></StyledPressable></DropdownMenuTrigger>
            <DropdownMenuContent label="Ticket actions" style={{ width: 220 }}>
              <DropdownMenuItem onPress={() => { setDraft(ticket.description ?? ''); setEditingDescription(true); }}>Edit description</DropdownMenuItem>
              <DropdownMenuItem onPress={() => { void copy('id'); }}>Copy ticket ID</DropdownMenuItem>
              {(column.id === 'done' ? columns.some(item => item.id === 'todo') : columns.some(item => item.id === 'done')) && <DropdownMenuItem onPress={() => onMove(column.id === 'done' ? 'todo' : 'done')}>{column.id === 'done' ? 'Reopen ticket' : 'Mark as done'}</DropdownMenuItem>}
            </DropdownMenuContent>
          </DropdownMenu>
        </StyledView>
        <CloseButton size="sm" accessibilityLabel="Close ticket details" onPress={() => control.close()} />
      </StyledView>
      {!!copyMessage && <Text accessibilityLiveRegion="polite" style={{ color: colors.textSecondary, paddingHorizontal: 24 }}>{copyMessage}</Text>}
      <StyledView className="flex flex-col gap-5 px-6">
        <StyledView className="flex flex-col gap-3" accessibilityLabel="Description">
          {creator && <StyledView className="flex flex-row items-center gap-[13px]"><Text variant="body-medium" style={{ color: colors.textSecondary }}>Created by</Text><Avatar source={creator.avatar} initials={creator.initials} alt={creator.name} size={18} /><Text variant="body-medium">{creator.name}</Text></StyledView>}
          <StyledView className="flex flex-col gap-1.5">
            <Text variant="title-2-medium" style={{ color: colors.text }}>{ticket.title}</Text>
            {editingDescription ? <StyledView className="flex flex-col gap-3">
              <Textarea accessibilityLabel="Ticket description" value={draft} onChangeText={setDraft} rows={4} maxLength={5000} autoFocus />
              <StyledView className="flex flex-row justify-end gap-2"><Button variant="secondary" size="small" onPress={() => setEditingDescription(false)}>Cancel</Button><Button size="small" disabled={!draft.trim()} onPress={() => { onUpdate({ description: draft.trim() }); setEditingDescription(false); }}>Save description</Button></StyledView>
            </StyledView> : <Text variant="body-regular" style={{ color: colors.textSecondary }}>{ticket.description ?? ''}</Text>}
          </StyledView>
        </StyledView>
        <StyledView className="flex flex-row flex-wrap items-start gap-5" accessibilityLabel="Ticket properties">
          <Text variant="body-medium" style={{ color: colors.textSecondary, width: 70 }}>Properties</Text>
          <StyledView className="flex flex-1 flex-row flex-wrap items-center gap-x-5 gap-y-3">
            <PropertySelect label="Ticket status" value={column.id} options={columns.map(item => ({ id: item.id, label: item.title }))} onChange={onMove} />
            <PropertySelect label="Ticket priority" value={ticket.priority} options={PRIORITIES.map(priority => ({ id: priority, label: priority }))} onChange={priority => onUpdate({ priority: priority as TicketPriority })} />
            <DropdownMenu><DropdownMenuTrigger asChild><StyledPressable className="flex flex-row items-center gap-1.5 rounded-md p-1" accessibilityLabel="Edit assignees">
              <StyledView className="flex flex-row items-center">{ticket.assignees.slice(0, 3).map((id, index) => { const person = members[id]; return person && <Avatar key={id} source={person.avatar} initials={person.initials} alt={person.name} size={18} style={{ marginLeft: index > 0 ? -6 : 0 }} />; })}</StyledView>
              <Text variant="body-medium" style={{ color: colors.text }}>{ticket.assignees.length ? `${members[ticket.assignees[0] ?? '']?.name ?? ticket.assignees[0]}${ticket.assignees.length > 1 ? ` +${ticket.assignees.length - 1}` : ''}` : 'Assignee'}</Text>
            </StyledPressable></DropdownMenuTrigger><DropdownMenuContent label="Ticket assignees" style={{ width: 220 }}>{Object.values(members).map(person => <Checkbox key={person.id} checked={ticket.assignees.includes(person.id)} onCheckedChange={selected => onUpdate({ assignees: selected ? [...ticket.assignees, person.id] : ticket.assignees.filter(id => id !== person.id) })} label={person.name} />)}</DropdownMenuContent></DropdownMenu>
            <PropertySelect label="Ticket project" value={ticket.project} options={projects.map(project => ({ id: project, label: project }))} onChange={project => onUpdate({ project })} />
          </StyledView>
        </StyledView>
        {!!ticket.resources?.length && <StyledView className="flex flex-row flex-wrap items-start gap-5" accessibilityLabel="Resources"><Text variant="body-medium" style={{ color: colors.textSecondary, width: 71 }}>Resources</Text><StyledView className="flex flex-1 flex-row flex-wrap gap-2">{ticket.resources.map(resource => <Button key={resource.href} size="xs" variant="secondary" href={resource.href} target="_blank" rel="noreferrer" onPress={Platform.OS === 'web' ? undefined : () => { void Linking.openURL(resource.href); }}>{resource.label}</Button>)}</StyledView></StyledView>}
        {ticket.tokenUsage && <TokensChartCard title="Tokens burned" {...ticket.tokenUsage} plotHeight={190} />}
      </StyledView>
      <StyledView className="mt-auto flex flex-col gap-2.5 px-3 pb-3" accessibilityLabel="Comments">
        <StyledView className="flex flex-col" accessibilityLiveRegion="polite">
          {(ticket.comments ?? []).map(entry => { const author = Object.values(members).find(person => person.name === entry.author); return <StyledView key={entry.id} className="relative flex flex-col gap-[3px] rounded-2xl p-3">
            <StyledView className="flex flex-row items-center gap-2"><Avatar source={author?.avatar} initials={entry.author === 'you' ? 'ME' : author?.initials} alt={entry.author === 'you' ? 'You' : entry.author} size={24} /><Text variant="body-medium" style={{ color: colors.text }}>{entry.author === 'you' ? 'You' : entry.author}</Text><Text variant="caption-1-medium" style={{ color: colors.textTertiary }}>{entry.time}</Text></StyledView>
            <StyledView className="ps-[29px]"><Text variant="body-medium" style={{ color: colors.textSecondary }}>{entry.body}</Text></StyledView>
          </StyledView>; })}
        </StyledView>
        <StyledView className="relative"><Textarea accessibilityLabel="Add a comment" placeholder="Enter your comment" value={comment} onChangeText={setComment} rows={1} maxLength={2000} resize="none" /><StyledView className="absolute end-2 bottom-2"><Button accessibilityLabel="Post comment" size="xs" disabled={!comment.trim()} onPress={postComment} iconOnly icon={<RiArrowUpLine width={14} height={14} fill={colors.primaryForeground} />} /></StyledView></StyledView>
      </StyledView>
    </StyledView>
  </Dialog>));
}
