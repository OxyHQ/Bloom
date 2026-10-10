import { useEffect, useRef, useState } from 'react';
import { Linking, Platform, ScrollView, useWindowDimensions } from 'react-native';
import { TicketTokenChart } from './TicketTokenChart';
import { useDialogControl } from '../dialog/context';
import { useIsRtl } from '../hooks/use-is-rtl';
import { useMessages } from '../locale/messages';
import { Textarea } from '../textarea';
import { BoardTooltip } from './BoardTooltip';
import { cx } from './constants';
import { useProjectBoardPlatform } from './context';
import { PROJECT_BOARD_MESSAGES } from './messages';
import { PRIORITIES, PropertySelect } from './ProjectBoardControls';
import { TicketAssigneeIcon, TicketFavoriteIcon, TicketStatusIcon } from './ProjectBoardIcons';
import {
  SourceAvatar as Avatar,
  SourceChip as Chip,
  SourcePressable as Pressable,
  RiArrowRightSLine,
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
const TOOL_BUTTON = 'size-6 rounded-lg text-foreground-icon-secondary [&>svg]:size-[18px]';
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
    CloseButton,
    Dialog,
    TicketCornerGenieSurface,
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuCheckboxItem,
  } = useProjectBoardPlatform();
  const control = useDialogControl();
  const rtl = useIsRtl();
  const { width: viewportWidth } = useWindowDimensions();
  const [comment, setComment] = useState('');
  const [editingDescription, setEditingDescription] = useState(false);
  const [draft, setDraft] = useState(ticket.description ?? '');
  const [copyMessage, setCopyMessage] = useState('');
  const [scrollFade, setScrollFade] = useState(0);
  const copyResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sequence = useRef(0);
  useEffect(
    () => () => {
      if (copyResetTimer.current) clearTimeout(copyResetTimer.current);
    },
    [],
  );
  const creator = members[ticket.createdBy ?? ticket.assignees[0] ?? 'maya'];
  const owner = members[ticket.assignees[0] ?? ''];
  async function copy(kind: 'link' | 'id') {
    if (copyResetTimer.current) clearTimeout(copyResetTimer.current);
    try {
      if (kind === 'link' && onCopyTicketLink) await onCopyTicketLink(ticket);
      else if (kind === 'id' && onCopyTicketId) await onCopyTicketId(ticket.code);
      else if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        const url = new URL(window.location.href);
        url.hash = `ticket=${encodeURIComponent(ticket.id)}`;
        await navigator.clipboard.writeText(kind === 'id' ? ticket.code : url.toString());
      } else throw new Error('Product clipboard callback required.');
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
          author: currentUserId ? (members[currentUserId]?.name ?? currentUserId) : 'you',
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
    <Dialog
      control={control}
      startOpen
      onClose={onClose}
      label={`${ticket.code}: ${m.properties}`}
      presentation="custom"
      exitDuration={560}
      placement="center"
      width={609}
      maxWidth={609}
      contentPadding={0}
      scrollable={false}
      morph={false}
      containerClassName="fixed inset-0 z-100 flex items-stretch justify-end overflow-hidden p-3 max-sm:p-2"
      containerStyle={{
        alignItems: 'flex-end',
        justifyContent: 'flex-start',
        padding: viewportWidth < 640 ? 8 : 12,
      }}
      panelStyle={{
        width: '100%',
        maxWidth: 609,
        height: '100%',
        maxHeight: '100%',
        backgroundColor: 'transparent',
      }}
    >
      <View className="h-full w-full max-w-[609px] outline-none" style={{ flex: 1, minHeight: 0 }}>
        <TicketCornerGenieSurface>
          <View
            className="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl bg-ticket-detail-surface outline-none"
            style={{ flex: 1, minHeight: 0 }}
          >
            <View className="flex shrink-0 items-center justify-between gap-3 px-6 pt-6 pb-5 max-sm:px-4 max-sm:pt-4">
              <View className="flex min-w-0 flex-wrap items-center gap-1.5">
                <View className="flex min-w-0 items-center gap-0.5 text-body-2-medium text-text-secondary">
                  <Text className="shrink-0 text-body-2-medium text-text-secondary">
                    {boardTitle}
                  </Text>
                  <RiArrowRightSLine className="size-[15px] shrink-0 rtl:rotate-180" />
                  <Text className="shrink-0 text-body-2-medium text-text-secondary">
                    {ticket.code}
                  </Text>
                  <RiArrowRightSLine className="size-[15px] shrink-0 rtl:rotate-180" />
                  <Text className="truncate text-body-2-medium text-text-secondary">
                    {ticket.area}
                  </Text>
                </View>
                <View className="flex items-center gap-1.5">
                  <BoardTooltip label={ticket.isFavorite ? m.favoriteRemove : m.favoriteAdd}>
                    <Button
                      appearance="outline"
                      tone="neutral"
                      size="xs"
                      style={{
                        width: 24,
                        height: 24,
                        minHeight: 24,
                        borderRadius: 8,
                        paddingLeft: 0,
                        paddingRight: 0,
                      }}
                      iconOnly
                      icon={
                        <TicketFavoriteIcon
                          selected={ticket.isFavorite}
                          className={cx(
                            'size-[17px]',
                            ticket.isFavorite && 'text-ticket-detail-favorite',
                          )}
                        />
                      }
                      className={cx(
                        TOOL_BUTTON,
                        '[&>svg]:size-[17px]',
                        ticket.isFavorite && 'text-ticket-detail-favorite [&_path]:fill-current',
                      )}
                      accessibilityLabel={ticket.isFavorite ? m.favoriteRemove : m.favoriteAdd}
                      pressed={!!ticket.isFavorite}
                      onPress={() => onUpdate({ isFavorite: !ticket.isFavorite })}
                    />
                  </BoardTooltip>
                  <BoardTooltip label={copyMessage === m.linkCopied ? m.linkCopied : m.copyLink}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={m.copyLink}
                      className={cx('flex items-center justify-center', TOOL_BUTTON, 'group')}
                      dataSet={{ copied: String(copyMessage === m.linkCopied) }}
                      onPress={() => {
                        void copy('link');
                      }}
                    >
                      <View className="relative inline-flex shrink-0 items-center justify-center size-[18px]">
                        <RiLinkM
                          className="absolute size-[18px] scale-100 opacity-100 blur-[0px] transition-all duration-200 ease-out group-data-[copied=true]:scale-75 group-data-[copied=true]:opacity-0 group-data-[copied=true]:blur-[2px] motion-reduce:transition-none"
                          style={{
                            opacity: copyMessage === m.linkCopied ? 0 : 1,
                          }}
                        />
                        <RiCheckLine
                          className="absolute size-[18px] scale-75 opacity-0 blur-[2px] transition-all duration-200 ease-out group-data-[copied=true]:scale-100 group-data-[copied=true]:opacity-100 group-data-[copied=true]:blur-[0px] motion-reduce:transition-none"
                          style={{
                            opacity: copyMessage === m.linkCopied ? 1 : 0,
                          }}
                        />
                      </View>
                    </Pressable>
                  </BoardTooltip>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Pressable
                        accessibilityLabel={m.actions}
                        className={cx(
                          'flex items-center justify-center border border-border-button-default bg-background-primary-default shadow-xs hover:bg-background-primary-hover',
                          TOOL_BUTTON,
                        )}
                      >
                        <RiMore2Fill className="size-[18px]" />
                      </Pressable>
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
                      {action(
                        copyMessage === m.idCopied ? m.idCopied : m.copyId,
                        RiFileCopyLine,
                        () => {
                          void copy('id');
                        },
                      )}
                      {action(
                        column.id === 'done' ? m.reopen : m.markDone,
                        column.id === 'done' ? RiRestartLine : RiCheckboxCircleLine,
                        () => onMove(column.id === 'done' ? 'todo' : 'done'),
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </View>
              </View>
              <CloseButton
                size="sm"
                className="self-start"
                accessibilityLabel={m.closeDetails}
                onPress={() => control.close()}
              />
              <Text className="sr-only" accessibilityLiveRegion="polite">
                {copyMessage}
              </Text>
            </View>
            <View className="relative min-h-0 flex-1">
              <ScrollView
                accessibilityLabel={m.properties}
                style={{ flex: 1, minHeight: 0 }}
                onScroll={(e) =>
                  setScrollFade(Math.min(1, Math.max(0, e.nativeEvent.contentOffset.y) / 24))
                }
                scrollEventThrottle={16}
                contentContainerStyle={{ flexGrow: 1 }}
              >
                <View className="flex min-h-full flex-col" style={{ flexGrow: 1 }}>
                  <View className="flex flex-col gap-5 px-6 max-sm:px-4">
                    <View className="flex flex-col gap-3" accessibilityLabel={m.description}>
                      {creator && (
                        <View className="flex items-center gap-[13px] text-body-medium">
                          <Text className="text-body-medium text-text-secondary">
                            {m.createdBy}
                          </Text>
                          <View className="flex items-center gap-1.5 text-text-primary">
                            <Avatar
                              source={creator.avatar}
                              initials={creator.initials}
                              alt={creator.name}
                              className="size-[18px]"
                            />
                            <Text className="text-body-medium text-text-primary">
                              {creator.name}
                            </Text>
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
                    <View
                      accessibilityLabel={m.properties}
                      className="flex items-start gap-5 max-sm:flex-col max-sm:gap-2"
                    >
                      <Text className="w-[70px] shrink-0 pt-0.5 text-body-medium text-text-secondary">
                        {m.properties}
                      </Text>
                      <View className="flex min-w-0 flex-wrap items-center gap-x-5 gap-y-3">
                        <PropertySelect
                          label={m.status}
                          value={column.id}
                          options={columns.map((c) => ({
                            id: c.id,
                            label: c.title,
                            icon: (
                              <TicketStatusIcon
                                status={c.id}
                                className="text-foreground-icon-secondary"
                              />
                            ),
                          }))}
                          onChange={onMove}
                          renderValue={
                            <View className="flex items-center gap-1.5">
                              <TicketStatusIcon
                                status={column.id}
                                className="text-foreground-icon-secondary"
                              />
                              <Text className="text-body-medium text-text-primary">
                                {column.title}
                              </Text>
                            </View>
                          }
                        />
                        <PropertySelect
                          chip
                          label={m.priority}
                          value={ticket.priority}
                          options={PRIORITIES.map((p) => ({ id: p, label: p }))}
                          onChange={(p) => onUpdate({ priority: p as TicketPriority })}
                          renderValue={
                            <Chip
                              className={cx(
                                'px-[7px] py-0.5 text-body-medium transition-colors duration-150',
                                PRIORITY_HOVERS[ticket.priority],
                                PRIORITY_STYLES[ticket.priority],
                              )}
                            >
                              {ticket.priority}
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
                                  <View className="flex items-center -space-x-1.5">
                                    {ticket.assignees.slice(0, 3).map((id, i) => {
                                      const p = members[id];
                                      return (
                                        p && (
                                          <Avatar
                                            key={id}
                                            source={p.avatar}
                                            initials={p.initials}
                                            alt={p.name}
                                            className={cx(
                                              'size-[18px] ring-2 ring-ticket-detail-surface',
                                              i > 0 && '-ms-1.5',
                                            )}
                                          />
                                        )
                                      );
                                    })}
                                  </View>
                                  <Text className="text-body-medium text-text-primary">
                                    {owner?.name ?? ticket.assignees[0]}
                                    {ticket.assignees.length > 1
                                      ? ` +${ticket.assignees.length - 1}`
                                      : ''}
                                  </Text>
                                </>
                              ) : (
                                <>
                                  <TicketAssigneeIcon className="size-[18px] text-foreground-icon-tertiary" />
                                  <Text className="text-body-medium text-text-tertiary">
                                    {m.assignee}
                                  </Text>
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
                                  <Avatar
                                    className="size-[18px]"
                                    source={p.avatar}
                                    initials={p.initials}
                                  />
                                  <Text className="text-body-medium text-text-primary">
                                    {p.name}
                                  </Text>
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
                              <Text className="text-body-medium text-text-primary">
                                {ticket.project}
                              </Text>
                            </View>
                          }
                        />
                      </View>
                    </View>
                    {!!ticket.resources?.length && (
                      <View
                        className="flex items-start gap-5 max-sm:flex-col max-sm:gap-2"
                        accessibilityLabel={m.resources}
                      >
                        <Text className="w-[71px] shrink-0 pt-0.5 text-body-medium text-text-secondary">
                          {m.resources}
                        </Text>
                        <View className="flex flex-wrap gap-2">
                          {ticket.resources.map((r) => (
                            <Pressable
                              key={r.href}
                              accessibilityRole="link"
                              accessibilityLabel={r.label}
                              href={r.href}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring"
                              onPress={
                                Platform.OS === 'web'
                                  ? undefined
                                  : () => {
                                      void Linking.openURL(r.href);
                                    }
                              }
                            >
                              <Chip className="bg-ticket-detail-resource-background px-[7px] py-0.5 text-body-medium text-ticket-detail-resource-text">
                                {r.label}
                              </Chip>
                            </Pressable>
                          ))}
                        </View>
                      </View>
                    )}
                    {ticket.tokenUsage && (
                      <TicketTokenChart title={m.tokens} {...ticket.tokenUsage} plotHeight={190} />
                    )}
                  </View>
                  <View
                    accessibilityLabel={m.comments}
                    className="mt-auto flex flex-col gap-2.5 px-3 pb-3"
                  >
                    <View className="flex flex-col" accessibilityLiveRegion="polite">
                      {(ticket.comments ?? []).map((entry, index) => {
                        const author = Object.values(members).find((p) => p.name === entry.author);
                        return (
                          <View
                            key={entry.id}
                            className="relative flex flex-col gap-[3px] rounded-2xl p-3 after:pointer-events-none after:absolute after:top-9 after:-bottom-3 after:start-[23.5px] after:w-px after:bg-border-button-default last:after:hidden"
                          >
                            {Platform.OS !== 'web' &&
                              index < (ticket.comments?.length ?? 0) - 1 && (
                                <View
                                  pointerEvents="none"
                                  className="absolute top-9 -bottom-3 start-[23.5px] w-px bg-border-button-default"
                                />
                              )}
                            <View className="flex min-w-0 items-center gap-2">
                              <Avatar
                                source={author?.avatar}
                                initials={entry.author === 'you' ? 'ME' : author?.initials}
                                alt={entry.author === 'you' ? m.you : entry.author}
                                className="size-6"
                                size={24}
                              />
                              <View className="flex min-w-0 flex-wrap items-center gap-x-2">
                                <Text className="truncate text-body-medium text-text-primary">
                                  {entry.author === 'you' ? m.you : entry.author}
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
                </View>
              </ScrollView>
              <View
                pointerEvents="none"
                className="pointer-events-none absolute inset-x-0 top-0 z-10 h-6"
              >
                <View
                  className="absolute inset-0 backdrop-blur-[1px] [mask-image:linear-gradient(to_bottom,black,transparent)]"
                  style={{ opacity: scrollFade }}
                />
                <View
                  className="absolute inset-x-0 top-0 h-4 backdrop-blur-[4px] [mask-image:linear-gradient(to_bottom,black,transparent)]"
                  style={{ opacity: scrollFade }}
                />
                <View
                  className="absolute inset-0 bg-linear-to-b from-ticket-detail-surface to-transparent"
                  style={{ opacity: scrollFade }}
                />
              </View>
            </View>
          </View>
        </TicketCornerGenieSurface>
      </View>
    </Dialog>
  );
}
