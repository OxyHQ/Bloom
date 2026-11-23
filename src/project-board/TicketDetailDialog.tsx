import { DetailDialogSection } from '../dialog/DetailDialogSection';
import { RiStarLine } from '../icons/remix/RiStarLine';
import { RiStarFill } from '../icons/remix/RiStarFill';
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, type TextStyle, View } from 'react-native';
import { Avatar } from '../avatar';
import { Chip } from '../chip';
import { RiArrowUpLine } from '../icons/remix/RiArrowUpLine';
import { RiCheckLine } from '../icons/remix/RiCheckLine';
import { RiCheckboxCircleLine } from '../icons/remix/RiCheckboxCircleLine';
import { RiEditLine } from '../icons/remix/RiEditLine';
import { RiFileCopyLine } from '../icons/remix/RiFileCopyLine';
import { RiFolder6Line } from '../icons/remix/RiFolder6Line';
import { RiLinkM } from '../icons/remix/RiLinkM';
import { RiMore2Fill } from '../icons/remix/RiMore2Fill';
import { IS_WEB } from '../styles/platform';
import { webDataSet } from '../styles/web-data';
import { Text } from '../typography';
import { writeClipboardText } from '../hooks/clipboard';
import { openExternal } from '../hooks/link-activation';
import { TicketTokenChart } from './TicketTokenChart';
import { useIsRtl } from '../hooks/use-is-rtl';
import { useMessages } from '../locale/messages';
import { Textarea } from '../textarea';
import { useColorTokens } from '../theme/color-tokens';
import { BoardTooltip } from './BoardTooltip';
import { MemberAvatars } from './MemberAvatars';
import { COLOR_TRANSITION, DIALOG_CHIP, useChipFills, useChipLabels } from './chips';
import { createTokenStyles } from '../theme/color-tokens';
import { useProjectBoardPlatform } from './context';
import { PROJECT_BOARD_MESSAGES } from './messages';
import { PRIORITIES, PropertySelect } from './ProjectBoardControls';
import { TicketAssigneeIcon, TicketStatusIcon } from './ProjectBoardIcons';
import { RiRestartLine } from './RiRestartLine';
import {
  ELLIPSIS,
  NOWRAP,
  PRE_WRAP_ANYWHERE,
  TYPE,
  WRAP_ANYWHERE,
  useBoardText,
  useIconFill,
} from './styles';
import { useProjectBoardWebCss } from './web-css';
import type { ProjectColumn, ProjectMember, ProjectTicket, TicketPriority } from './types';

const styles = StyleSheet.create({
  // A menu row's `px-2` (its `py-1.5` lost to the row's own 4px).
  action: { paddingInline: 8 },
  actionIcon: { width: 18, height: 18, flexShrink: 0 },
  actionLabel: { overflow: 'hidden', lineHeight: TYPE.body.lineHeight, fontWeight: 500 },
  // `z-[120] rounded-[14px] p-1` lost to the menu panel's own chrome.
  menu: { width: 220 },
  column: { flexDirection: 'column' },
  comment: { position: 'relative', flexDirection: 'column', gap: 3, borderRadius: 16, padding: 12 },
  connector: { position: 'absolute', insetInlineStart: 23.5, top: 36, bottom: -12, width: 1 },
  author: { flexDirection: 'row', minWidth: 0, alignItems: 'center', gap: 8 },
  face: { width: 24, height: 24 },
  byline: {
    flexDirection: 'row',
    minWidth: 0,
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: 8,
  },
  truncate: { overflow: 'hidden' },
  noShrink: { flexShrink: 0 },
  body: { paddingInlineStart: 29, fontSize: 14 },
  composer: { position: 'relative' },
  send: { width: 13.333, height: 13.333 },
  srOnly: {
    borderWidth: 0,
    width: 1,
    height: 1,
    margin: -1,
    padding: 0,
    position: 'absolute',
    overflow: 'hidden',
  },
  details: { flexDirection: 'column', gap: 12 },
  creator: { flexDirection: 'row', alignItems: 'center', gap: 13, ...TYPE.body },
  glyph: { width: 18, height: 18 },
  copy: { flexDirection: 'column', gap: 6 },
  editor: { flexDirection: 'column', gap: 12 },
  editorActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  value: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  menuRow: { borderRadius: 10, paddingInline: 8 },
  member: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  link: { borderRadius: 6 },
});
const useStyles = createTokenStyles((t) => ({
  // The colour (and type) sit on these rows as their classes set them.
  person: { flexDirection: 'row', alignItems: 'center', gap: 6, color: t.foreground },
  assignees: {
    margin: -4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 6,
    padding: 4,
    ...TYPE.body,
    color: t.foreground,
  },
}));
/** `sr-only`'s clip and nowrap, which only the web has. */
const SR_ONLY_WEB = IS_WEB
  ? ({ clipPath: 'inset(50%)', whiteSpace: 'nowrap' } as TextStyle)
  : undefined;
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
  const tokens = useColorTokens();
  useProjectBoardWebCss();
  const text = useBoardText();
  const fills = useChipFills();
  const labels = useChipLabels();
  const own = useStyles();
  const iconFill = useIconFill();
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
    <DropdownMenuItem style={styles.action} onPress={run}>
      <Icon fill={iconFill} style={[styles.actionIcon, text.icon]} />
      <Text style={[styles.actionLabel, ELLIPSIS]}>{label}</Text>
    </DropdownMenuItem>
  );
  return (
    <DetailDialog
      startOpen
      onClose={onClose}
      label={`${ticket.code}: ${m.properties}`}
      closeLabel={m.closeDetails}
      testID="ticket-detail"
      header={ticket.code}
      subtitle={[boardTitle, ticket.area].filter(Boolean).join(' · ')}
      actions={
        <Button.Group accessibilityLabel={m.actions}>
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
            <DropdownMenuContent label={m.actions} style={styles.menu}>
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
        </Button.Group>
      }
      scrollFooter={
        <View accessibilityLabel={m.comments}>
          <View style={styles.column} accessibilityLiveRegion="polite">
            {(ticket.comments ?? []).map((entry, index) => {
              const author = Object.values(members).find((p) => p.name === entry.author);
              const authorName = entry.author ?? m.you;
              return (
                <View
                  key={entry.id}
                  style={styles.comment}
                  // The web draws the thread's connector as the entry's `::after`.
                  {...webDataSet({ bloomBoardComment: '' })}
                >
                  {Platform.OS !== 'web' && index < (ticket.comments?.length ?? 0) - 1 && (
                    <View pointerEvents="none" style={[styles.connector, text.connector]} />
                  )}
                  <View style={styles.author}>
                    <View style={styles.face}>
                      <Avatar
                        source={author?.avatar}
                        initials={author?.initials}
                        name={authorName}
                        color="neutral"
                        alt={authorName}
                        size={24}
                      />
                    </View>
                    <View style={styles.byline}>
                      <Text style={[styles.truncate, text.body, ELLIPSIS]}>{authorName}</Text>
                      <Text style={[styles.noShrink, text.captionMuted]}>{entry.time}</Text>
                    </View>
                  </View>
                  <Text style={[styles.body, text.bodyMuted, PRE_WRAP_ANYWHERE]}>{entry.body}</Text>
                </View>
              );
            })}
          </View>
          <View style={styles.composer}>
            <Textarea
              accessibilityLabel={m.addComment}
              placeholder={m.enterComment}
              value={comment}
              onValueChange={setComment}
              rows={1}
              maxLength={2000}
              resize="none"
              bare
              fieldStyle={{
                height: 72,
                borderRadius: 12,
                backgroundColor: tokens.surface,
                paddingTop: 12,
                paddingBottom: 40,
                paddingLeft: 12,
                paddingRight: 12,
              }}
            />
            <Button
              accessibilityLabel={m.postComment}
              size="sm"
              disabled={!comment.trim()}
              style={{
                position: 'absolute',
                bottom: 8,
                // `end-2 p-0`, as the class set them, beside the physical side.
                insetInlineEnd: 8,
                padding: 0,
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
              icon={<RiArrowUpLine style={styles.send} />}
            />
          </View>
        </View>
      }
    >
      <Text style={[styles.srOnly, SR_ONLY_WEB]} accessibilityLiveRegion="polite">
        {copyMessage}
      </Text>

      <View style={styles.details} accessibilityLabel={m.description}>
        {creator && (
          <View style={styles.creator}>
            <Text style={text.bodyMuted}>{m.createdBy}</Text>
            <View style={own.person}>
              <View style={styles.glyph}>
                <Avatar
                  source={creator.avatar}
                  initials={creator.initials}
                  alt={creator.name}
                  size={18}
                />
              </View>
              <Text style={text.body}>{creator.name}</Text>
            </View>
          </View>
        )}
        <View style={styles.copy}>
          <Text accessibilityRole="header" style={[text.headline, WRAP_ANYWHERE]}>
            {ticket.title}
          </Text>
          {editingDescription ? (
            <View style={styles.editor}>
              <Textarea
                accessibilityLabel={m.ticketDescription}
                value={draft}
                onValueChange={setDraft}
                rows={4}
                maxLength={5000}
                autoFocus
              />
              <View style={styles.editorActions}>
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
            <Text style={[text.bodyRegularMuted, PRE_WRAP_ANYWHERE]}>
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
            icon: <TicketStatusIcon status={c.id} style={text.icon} />,
          }))}
          onChange={onMove}
          renderValue={
            <View style={styles.value}>
              <TicketStatusIcon status={column.id} style={text.icon} />
              <Text style={text.body}>{column.title}</Text>
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
            // Its hover fills (`ticket-detail-*-hover`) are the same tokens as its rest.
            <Chip
              bare
              style={[DIALOG_CHIP, COLOR_TRANSITION, fills[ticket.priority]]}
              textStyle={[labels[ticket.priority], NOWRAP]}
            >
              {m.priorityLabels[ticket.priority]}
            </Chip>
          }
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Pressable
              accessibilityLabel={m.editAssignees}
              style={own.assignees}
              {...webDataSet({ bloomBoardProperty: '' })}
            >
              {ticket.assignees.length ? (
                <>
                  <MemberAvatars ids={ticket.assignees.slice(0, 3)} members={members} size={18} />
                  <Text style={text.body}>
                    {owner?.name ?? ticket.assignees[0]}
                    {ticket.assignees.length > 1 ? ` +${ticket.assignees.length - 1}` : ''}
                  </Text>
                </>
              ) : (
                <>
                  <TicketAssigneeIcon style={[styles.glyph, text.icon]} />
                  <Text style={text.bodyMuted}>{m.assignee}</Text>
                </>
              )}
            </Pressable>
          </DropdownMenuTrigger>
          <DropdownMenuContent label={m.editAssignees} style={styles.menu}>
            {Object.values(members).map((p) => (
              <DropdownMenuCheckboxItem
                key={p.id}
                style={styles.menuRow}
                checked={ticket.assignees.includes(p.id)}
                onCheckedChange={(selected) =>
                  onUpdate({
                    assignees: selected
                      ? [...ticket.assignees, p.id]
                      : ticket.assignees.filter((id) => id !== p.id),
                  })
                }
              >
                <View style={styles.member}>
                  <View style={styles.glyph}>
                    <Avatar source={p.avatar} initials={p.initials} size={18} />
                  </View>
                  <Text style={text.body}>{p.name}</Text>
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
            <View style={styles.value}>
              <RiFolder6Line fill={iconFill} style={[styles.glyph, text.icon]} />
              <Text style={text.body}>{ticket.project}</Text>
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
              {...({ href: r.href, target: '_blank', rel: 'noreferrer' } as object)}
              style={styles.link}
              {...webDataSet({ bloomBoardLink: '' })}
              onPress={Platform.OS === 'web' ? undefined : () => openExternal(r.href)}
            >
              {/* `ticket-detail-resource-*`: the info pair, as Low's. */}
              <Chip bare style={[DIALOG_CHIP, fills.Low]} textStyle={[labels.Low, NOWRAP]}>
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
