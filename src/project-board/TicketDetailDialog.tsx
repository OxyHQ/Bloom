import { DetailDialogSection } from '../dialog/DetailDialogSection';
import { ButtonGroup } from '../button-group';
import { RiStarLine } from '../icons/remix/RiStarLine';
import { RiStarFill } from '../icons/remix/RiStarFill';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { writeClipboardText } from '../hooks/clipboard';
import { openExternal } from '../hooks/link-activation';
import { TicketTokenChart } from './TicketTokenChart';
import { useIsRtl } from '../hooks/use-is-rtl';
import { useMessages } from '../locale/messages';
import { Textarea } from '../textarea';
import { BoardTooltip } from './BoardTooltip';
import { MemberAvatars } from './MemberAvatars';
import { cx } from './constants';
import { useProjectBoardPlatform } from './context';
import { PROJECT_BOARD_MESSAGES } from './messages';
import { PRIORITIES, PropertySelect } from './ProjectBoardControls';
import { TicketAssigneeIcon, TicketStatusIcon } from './ProjectBoardIcons';
import {
  SourceAvatar as Avatar,
  SourceChip as Chip,
  SourcePressable as Pressable,
  RiArrowUpLine,
  RiCheckLine,
  RiCheckboxCircleLine,
  RiEditLine,
  RiFileCopyLine,
  RiFolder6Line,
  RiLinkM,
  RiMore2Fill,
  RiRestartLine,
  SourceText as Text,
  SourceView as View,
} from './SourcePrimitives';
import type { ProjectColumn, ProjectMember, ProjectTicket, TicketPriority } from './types';
const PRIORITY_STYLES = {
  Low: 'bg-ticket-detail-low-background text-ticket-detail-low-text',
  Medium: 'bg-status-yellow-background text-status-yellow-text',
  High: 'bg-status-orange-background text-status-orange-text',
  Urgent: 'bg-status-rose-background text-status-rose-text',
};
const PRIORITY_HOVERS = {
  Low: 'group-hover/priority:bg-ticket-detail-low-hover',
  Medium: 'group-hover/priority:bg-ticket-detail-medium-hover',
  High: 'group-hover/priority:bg-ticket-detail-high-hover',
  Urgent: 'group-hover/priority:bg-ticket-detail-urgent-hover',
};
export function TicketDetailDialog({
  title: boardTitle,
  ticket,
  column,
  columns,
  members,
  projects,
  currentUserId,
  onClose,
  onUpdate,
  onMove,
  onCopyTicketLink,
  onCopyTicketId,
}: {
  title: string;
  ticket: ProjectTicket;
  column: ProjectColumn;
  columns: ProjectColumn[];
  members: Readonly<Record<string, ProjectMember>>;
  projects: readonly string[];
  currentUserId?: string;
  onClose: () => void;
  onUpdate: (p: Partial<ProjectTicket>) => void;
  onMove: (id: string) => void;
  onCopyTicketLink?: (t: ProjectTicket) => void | Promise<void>;
  onCopyTicketId?: (code: string) => void | Promise<void>;
}) {
  const { messages: m } = useMessages(PROJECT_BOARD_MESSAGES);
  const {
    Button,
    DetailDialog,
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuCheckboxItem,
  } = useProjectBoardPlatform();
  const rtl = useIsRtl();
  const [comment, setComment] = useState('');
  const [editingDescription, setEditingDescription] = useState(false);
  const [draft, setDraft] = useState(ticket.description ?? '');
  const [copyMessage, setCopyMessage] = useState('');
  const copyResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sequence = useRef(0);
  useEffect(
    () => () => {
      if (copyResetTimer.current) clearTimeout(copyResetTimer.current);
    },
    [],
  );
  const creatorId = ticket.createdBy ?? ticket.assignees[0];
  const creator = creatorId === undefined ? undefined : members[creatorId];
  const owner = members[ticket.assignees[0] ?? ''];
  async function copy(kind: 'link' | 'id') {
    if (copyResetTimer.current) clearTimeout(copyResetTimer.current);
    try {
      if (kind === 'link' && onCopyTicketLink) await onCopyTicketLink(ticket);
      else if (kind === 'id' && onCopyTicketId) await onCopyTicketId(ticket.code);
      else if (kind === 'id') await writeClipboardText(ticket.code);
      else {
        // The link is the page's own address with the ticket in its hash, so
        // only the web has one; native products pass `onCopyTicketLink`.
        if (Platform.OS !== 'web' || typeof window === 'undefined')
          throw new Error('Product ticket link callback required.');
        const url = new URL(window.location.href);
        url.hash = `ticket=${encodeURIComponent(ticket.id)}`;
        await writeClipboardText(url.toString());
      }
      setCopyMessage(kind === 'id' ? m.idCopied : m.linkCopied);
    } catch {
      setCopyMessage(m.copyFailed);
    }
    copyResetTimer.current = setTimeout(() => setCopyMessage(''), 1600);
  }
  function postComment() {
    if (!comment.trim()) return;
    sequence.current++;
    onUpdate({
      comments: [
        ...(ticket.comments ?? []),
        {
          id: `${ticket.id}-comment-${Date.now()}-${sequence.current}`,
          // No `currentUserId`: the viewer, drawn as "You" in their language.
          ...(currentUserId ? { author: members[currentUserId]?.name ?? currentUserId } : {}),
          body: comment.trim(),
          time: m.justNow,
        },
      ],
    });
    setComment('');
  }
  const action = (label: string, Icon: typeof RiEditLine, run: () => void) => (
    <DropdownMenuItem className="px-2 py-1.5" onPress={run}>
      <Icon className="size-[18px] shrink-0 text-foreground-icon-secondary" />
      <Text className="truncate text-body-medium whitespace-nowrap">{label}</Text>
    </DropdownMenuItem>
  );
  return (
    <DetailDialog
      open
      onClose={onClose}
      label={`${ticket.code}: ${m.properties}`}
      closeLabel={m.closeDetails}
      testID="ticket-detail"
      header={ticket.code}
      subtitle={[boardTitle, ticket.area].filter(Boolean).join(' · ')}
      actions={
        <ButtonGroup accessibilityLabel={m.actions}>
          <BoardTooltip label={ticket.isFavorite ? m.favoriteRemove : m.favoriteAdd}>
            <Button
              iconOnly
              icon={ticket.isFavorite ? <RiStarFill /> : <RiStarLine />}
              accessibilityLabel={ticket.isFavorite ? m.favoriteRemove : m.favoriteAdd}
              pressed={!!ticket.isFavorite}
              onPress={() => onUpdate({ isFavorite: !ticket.isFavorite })}
            />
          </BoardTooltip>
          <BoardTooltip label={copyMessage === m.linkCopied ? m.linkCopied : m.copyLink}>
            <Button
              iconOnly
              icon={copyMessage === m.linkCopied ? <RiCheckLine /> : <RiLinkM />}
              accessibilityLabel={m.copyLink}
              onPress={() => {
                void copy('link');
              }}
            />
          </BoardTooltip>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button iconOnly icon={<RiMore2Fill />} accessibilityLabel={m.actions} />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              label={m.actions}
              className="z-[120] w-[220px] rounded-[14px] p-1"
              style={{ width: 220 }}
            >
              {action(m.editDescription, RiEditLine, () => {
                setDraft(ticket.description ?? '');
                setEditingDescription(true);
              })}
              {action(copyMessage === m.idCopied ? m.idCopied : m.copyId, RiFileCopyLine, () => {
                void copy('id');
              })}
              {action(
                column.id === 'done' ? m.reopen : m.markDone,
                column.id === 'done' ? RiRestartLine : RiCheckboxCircleLine,
                () => onMove(column.id === 'done' ? 'todo' : 'done'),
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </ButtonGroup>
      }
      scrollFooter={
        <View accessibilityLabel={m.comments}>
          <View className="flex flex-col" accessibilityLiveRegion="polite">
            {(ticket.comments ?? []).map((entry, index) => {
              const author = Object.values(members).find((p) => p.name === entry.author);
              const authorName = entry.author ?? m.you;
              return (
                <View
                  key={entry.id}
                  className="relative flex flex-col gap-[3px] rounded-2xl p-3 after:pointer-events-none after:absolute after:top-9 after:-bottom-3 after:start-[23.5px] after:w-px after:bg-border-button-default last:after:hidden"
                >
                  {Platform.OS !== 'web' && index < (ticket.comments?.length ?? 0) - 1 && (
                    <View
                      pointerEvents="none"
                      className="absolute top-9 -bottom-3 start-[23.5px] w-px bg-border-button-default"
                    />
                  )}
                  <View className="flex min-w-0 items-center gap-2">
                    <Avatar
                      source={author?.avatar}
                      initials={author?.initials}
                      name={authorName}
                      color="neutral"
                      alt={authorName}
                      className="size-6"
                      size={24}
                    />
                    <View className="flex min-w-0 flex-wrap items-center gap-x-2">
                      <Text className="truncate text-body-medium text-text-primary">
                        {authorName}
                      </Text>
                      <Text className="shrink-0 text-body-2-medium text-text-tertiary">
                        {entry.time}
                      </Text>
                    </View>
                  </View>
                  <Text className="ps-[29px] whitespace-pre-wrap text-body-medium text-text-secondary wrap-anywhere">
                    {entry.body}
                  </Text>
                </View>
              );
            })}
          </View>
          <View className="relative">
            <Textarea
              accessibilityLabel={m.addComment}
              placeholder={m.enterComment}
              value={comment}
              onValueChange={setComment}
              rows={1}
              maxLength={2000}
              resize="none"
              fieldClassName="h-[72px] rounded-xl bg-background-secondary-default pt-3 pb-10"
              fieldStyle={{ paddingLeft: 12, paddingRight: 12 }}
            />
            <Button
              accessibilityLabel={m.postComment}
              size="sm"
              disabled={!comment.trim()}
              className="absolute end-2 bottom-2 size-6 rounded-full p-0"
              style={{
                position: 'absolute',
                bottom: 8,
                [rtl ? 'left' : 'right']: 8,
                width: 24,
                height: 24,
                minHeight: 24,
                borderRadius: 12,
                paddingLeft: 0,
                paddingRight: 0,
              }}
              onPress={postComment}
              iconOnly
              icon={<RiArrowUpLine className="size-[13.333px]" />}
            />
          </View>
        </View>
      }
    >
      <Text className="sr-only" accessibilityLiveRegion="polite">
        {copyMessage}
      </Text>

      <View className="flex flex-col gap-3" accessibilityLabel={m.description}>
        {creator && (
          <View className="flex items-center gap-[13px] text-body-medium">
            <Text className="text-body-medium text-text-secondary">{m.createdBy}</Text>
            <View className="flex items-center gap-1.5 text-text-primary">
              <Avatar
                source={creator.avatar}
                initials={creator.initials}
                alt={creator.name}
                className="size-[18px]"
              />
              <Text className="text-body-medium text-text-primary">{creator.name}</Text>
            </View>
          </View>
        )}
        <View className="flex flex-col gap-1.5">
          <Text
            accessibilityRole="header"
            className="text-headline-medium text-text-primary wrap-anywhere"
          >
            {ticket.title}
          </Text>
          {editingDescription ? (
            <View className="flex flex-col gap-3">
              <Textarea
                accessibilityLabel={m.ticketDescription}
                value={draft}
                onValueChange={setDraft}
                rows={4}
                maxLength={5000}
                autoFocus
              />
              <View className="flex justify-end gap-2">
                <Button
                  appearance="outline"
                  tone="neutral"
                  size="sm"
                  onPress={() => setEditingDescription(false)}
                >
                  {m.cancel}
                </Button>
                <Button
                  size="sm"
                  disabled={!draft.trim()}
                  onPress={() => {
                    onUpdate({ description: draft.trim() });
                    setEditingDescription(false);
                  }}
                >
                  {m.saveDescription}
                </Button>
              </View>
            </View>
          ) : (
            <Text className="whitespace-pre-wrap text-body-regular text-text-secondary wrap-anywhere">
              {ticket.description ?? ''}
            </Text>
          )}
        </View>
      </View>
      <DetailDialogSection label={m.properties} accessibilityLabel={m.properties}>
        <PropertySelect
          label={m.status}
          value={column.id}
          options={columns.map((c) => ({
            id: c.id,
            label: c.title,
            icon: <TicketStatusIcon status={c.id} className="text-foreground-icon-secondary" />,
          }))}
          onChange={onMove}
          renderValue={
            <View className="flex items-center gap-1.5">
              <TicketStatusIcon status={column.id} className="text-foreground-icon-secondary" />
              <Text className="text-body-medium text-text-primary">{column.title}</Text>
            </View>
          }
        />
        <PropertySelect
          chip
          label={m.priority}
          value={ticket.priority}
          options={PRIORITIES.map((p) => ({ id: p, label: m.priorityLabels[p] }))}
          onChange={(p) => onUpdate({ priority: p as TicketPriority })}
          renderValue={
            <Chip
              className={cx(
                'px-[7px] py-0.5 text-body-medium transition-colors duration-150',
                PRIORITY_HOVERS[ticket.priority],
                PRIORITY_STYLES[ticket.priority],
              )}
            >
              {m.priorityLabels[ticket.priority]}
            </Chip>
          }
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Pressable
              accessibilityLabel={m.editAssignees}
              className="-m-1 flex items-center gap-1.5 rounded-md p-1 text-body-medium text-text-primary hover:bg-background-primary-hover"
            >
              {ticket.assignees.length ? (
                <>
                  <MemberAvatars ids={ticket.assignees.slice(0, 3)} members={members} size={18} />
                  <Text className="text-body-medium text-text-primary">
                    {owner?.name ?? ticket.assignees[0]}
                    {ticket.assignees.length > 1 ? ` +${ticket.assignees.length - 1}` : ''}
                  </Text>
                </>
              ) : (
                <>
                  <TicketAssigneeIcon className="size-[18px] text-foreground-icon-tertiary" />
                  <Text className="text-body-medium text-text-tertiary">{m.assignee}</Text>
                </>
              )}
            </Pressable>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            label={m.editAssignees}
            className="z-[120] w-[220px] rounded-[14px] p-1"
            style={{ width: 220 }}
          >
            {Object.values(members).map((p) => (
              <DropdownMenuCheckboxItem
                key={p.id}
                className="rounded-2lg px-2 py-1.5 hover:bg-background-secondary-hover"
                checked={ticket.assignees.includes(p.id)}
                onCheckedChange={(selected) =>
                  onUpdate({
                    assignees: selected
                      ? [...ticket.assignees, p.id]
                      : ticket.assignees.filter((id) => id !== p.id),
                  })
                }
              >
                <View className="flex items-center gap-2">
                  <Avatar className="size-[18px]" source={p.avatar} initials={p.initials} />
                  <Text className="text-body-medium text-text-primary">{p.name}</Text>
                </View>
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <PropertySelect
          label={m.project}
          value={ticket.project}
          options={projects.map((p) => ({ id: p, label: p }))}
          onChange={(project) => onUpdate({ project })}
          renderValue={
            <View className="flex items-center gap-1.5">
              <RiFolder6Line className="size-[18px] text-foreground-icon-secondary" />
              <Text className="text-body-medium text-text-primary">{ticket.project}</Text>
            </View>
          }
        />
      </DetailDialogSection>
      {!!ticket.resources?.length && (
        <DetailDialogSection label={m.resources} accessibilityLabel={m.resources}>
          {ticket.resources.map((r) => (
            <Pressable
              key={r.href}
              accessibilityRole="link"
              accessibilityLabel={r.label}
              href={r.href}
              target="_blank"
              rel="noreferrer"
              className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring"
              onPress={Platform.OS === 'web' ? undefined : () => openExternal(r.href)}
            >
              <Chip className="bg-ticket-detail-resource-background px-[7px] py-0.5 text-body-medium text-ticket-detail-resource-text">
                {r.label}
              </Chip>
            </Pressable>
          ))}
        </DetailDialogSection>
      )}
      {ticket.tokenUsage && (
        <TicketTokenChart title={m.tokens} {...ticket.tokenUsage} plotHeight={190} />
      )}
    </DetailDialog>
  );
}
