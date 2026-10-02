import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { View } from 'react-native';
import { Platform, ScrollView, Share, useWindowDimensions } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { AgentAvatar } from '../agent-avatar';
import { StreamedText } from '../agent-chat/AgentChatMessage';
import { Button, IconButton } from '../button';
import { useDialogControl } from '../dialog/context';
import { useDirectionProps } from '../hooks/use-is-rtl';
import { RiCheckLine } from '../icons/remix/RiCheckLine';
import { RiFileCopyLine } from '../icons/remix/RiFileCopyLine';
import { RiGroupLine } from '../icons/remix/RiGroupLine';
import { RiMenuLine } from '../icons/remix/RiMenuLine';
import { RiMoreFill } from '../icons/remix/RiMoreFill';
import { RiShare2Line } from '../icons/remix/RiShare2Line';
import { RiThumbDownLine } from '../icons/remix/RiThumbDownLine';
import { RiThumbUpLine } from '../icons/remix/RiThumbUpLine';
import { useMessages } from '../locale/messages';
import { OverlayRoot, TOAST_LAYER_Z } from '../overlay';
import { StyledPressable, StyledView } from '../styles/styled-primitives';
import { TextFieldInput } from '../text-field';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { AvatarHandoff } from './AvatarHandoff';
import { ChatDialogFrame, SupportCopy } from './ChatDialogFrame';
import { ChatSidebar } from './ChatSidebar';
import { ChatAgentProfile } from './ChatAgentProfile';
import { useChatComponents } from './context';
import {
  conversationFor,
  formatDemoReply,
  nextAgentIdentity,
  removeConversation,
  updateConversationAgents,
  type Agent,
  type Conversation,
} from './data';
import { EditorRail } from './EditorRail';
import {
  captureAvatars,
  measureAvatar,
  type AvatarHandoffState,
  type AvatarNodes,
  type AvatarRect,
} from './handoff';
import { Marketplace } from './Marketplace';
import {
  DEFAULT_PLUGINS,
  MARKETPLACE_ITEMS,
  addMarketplaceBot,
  type MarketplaceItem,
} from './marketplace-data';
import { MULTI_AGENT_CHAT_MESSAGES, formatChatMessage } from './messages';
import { WORKSPACE_MODELS } from './model-catalog';
import { ReplyHeader, ReplyRow } from './ReplyRow';
import { ScrollSurface } from './ScrollSurface';
import { SelectedAgentPreview } from './SelectedAgentPreview';
import type { MultiAgentChatProps } from './types';
import { chatId, useReplies } from './use-replies';
import { useWorkspace } from './use-workspace';

const AnimatedView = Animated.createAnimatedComponent(StyledView);
type Panel =
  | 'picker'
  | 'rename'
  | 'options'
  | 'marketplace'
  | 'settings'
  | 'editor'
  | 'navigation'
  | 'support'
  | null;

/** Shared workspace implementation. Platform bindings select Bloom's existing surfaces only. */
export function MultiAgentChatBase(props: MultiAgentChatProps) {
  const { messages } = useMessages(MULTI_AGENT_CHAT_MESSAGES);
  const {
    defaultEditorId = 'security',
    onCopy,
    voices,
    onPreviewVoice,
    className,
    style,
    testID = 'multi-agent-chat',
  } = props;
  const {
    Portal,
    Dialog,
    ComposerPanel,
    AgentCreator,
    Dropdown: D,
  } = useChatComponents();
  const { colors } = useTheme();
  const directionProps = useDirectionProps();
  const reduced = useReducedMotion();
  const root = useRef<View>(null),
    pickerAvatars = useRef<AvatarNodes>(new Map()),
    emptyAvatars = useRef<AvatarNodes>(new Map()),
    profileAvatarRef = useRef<View>(null),
    replyAvatars = useRef<AvatarNodes>(new Map());
  const [handoff, setHandoff] = useState<AvatarHandoffState | null>(null),
    [flightOrigin, setFlightOrigin] = useState<AvatarRect | null>(null);
  const handoffGeneration = useRef(0),
    sending = useRef(false),
    starting = useRef(false);
  const finishHandoff = useCallback(() => setHandoff(null), []);
  const arriveAvatar = useCallback(
    (id: string) =>
      setHandoff((current) => {
        if (!current || current.arrived.includes(id)) return current;
        const arrived = [...current.arrived, id];
        return arrived.length === current.avatars.length
          ? null
          : { ...current, arrived };
      }),
    [],
  );
  const resolveFlightTarget = useCallback(
    (id: string) =>
      handoff?.kind === 'group'
        ? emptyAvatars.current.get(id)
        : id === handoff?.responderId
          ? replyAvatars.current.get(id)
          : (profileAvatarRef.current ?? undefined),
    [handoff?.kind, handoff?.responderId],
  );
  const { width } = useWindowDimensions();
  const compact = width < 1100;
  const phone = width < 768;
  const { workspace, current, update, loaded } = useWorkspace(props);
  const replies = useReplies(current, update, props.onRespond);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [editor, setEditor] = useState<Agent | null>(
    () => workspace.agents.find((a) => a.id === defaultEditorId) ?? null,
  );
  const [panel, setPanel] = useState<Panel>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [targetChatId, setTargetChatId] = useState<string | null>(null);
  const [rename, setRename] = useState('');
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [marketItem, setMarketItem] = useState<MarketplaceItem | null>(null);
  const [feedback, setFeedback] = useState<Record<string, 'up' | 'down'>>({});
  const surface = useDialogControl();
  const scroll = useRef<ScrollView>(null);
  const follow = useRef(true);
  const offsets = useRef<Record<string, number>>({});
  const chat: Conversation = workspace.chats.find(
    (c) => c.id === workspace.activeId,
  ) ??
    workspace.chats[0] ?? {
      id: 'draft-chat',
      title: '',
      agentIds: workspace.agents[0] ? [workspace.agents[0].id] : [],
      messages: [],
    };
  const participants =
    chat?.agentIds.flatMap(
      (id) => workspace.agents.find((a) => a.id === id) ?? [],
    ) ?? [];
  const targetChat = workspace.chats.find((c) => c.id === targetChatId) ?? chat;
  const open = useCallback(
    (next: Panel) => {
      setPanel(next);
      surface.open();
    },
    [surface],
  );
  const restoredEditor = useRef(false);
  useEffect(() => {
    if (!loaded || restoredEditor.current) return;
    restoredEditor.current = true;
    setEditor(
      current.current.agents.find((agent) => agent.id === defaultEditorId) ??
        null,
    );
  }, [loaded, current, defaultEditorId]);
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const id = new URL(window.location.href).searchParams.get('marketplace');
    const item = MARKETPLACE_ITEMS.find((entry) => entry.id === id);
    if (item) {
      setMarketItem(item);
      setPanel('marketplace');
    }
  }, []);
  const initialEditorOpened = useRef(false);
  useEffect(() => {
    if (!initialEditorOpened.current && defaultEditorId && compact && editor) {
      initialEditorOpened.current = true;
      open('editor');
    }
  }, [defaultEditorId, compact, editor, open]);
  const close = () => surface.close();
  const edit = (agent: Agent) => {
    if (!compact) close();
    setEditor({ ...agent, avatar: { ...agent.avatar } });
    if (compact) open('editor');
  };
  const saveAgent = useCallback(
    (agent: Agent) => {
      setEditor(agent);
      update((s) => {
        const previous = s.agents.find((a) => a.id === agent.id);
        return {
          ...s,
          agents: previous
            ? s.agents.map((a) => (a.id === agent.id ? agent : a))
            : [...s.agents, agent],
          chats: s.chats.map((c) =>
            c.agentIds.length === 1 &&
            c.agentIds[0] === agent.id &&
            (c.title === previous?.name || c.title === previous?.label)
              ? { ...c, title: agent.name }
              : c,
          ),
        };
      });
    },
    [update],
  );
  const createAgent = () => {
    const agent = {
      id: chatId('agent'),
      ...nextAgentIdentity(workspace.agents),
      label: '',
      description: '',
    };
    const created = conversationFor([agent], [agent.id], chatId('chat'));
    update((s) => ({
      ...s,
      agents: [...s.agents, agent],
      chats: [created, ...s.chats],
      activeId: created.id,
    }));
    edit(agent);
  };
  const chooseAgents = (
    ids: string[] = [],
    existingId: string | null = null,
  ) => {
    handoffGeneration.current++;
    setHandoff(null);
    setSelected(ids);
    setEditingChatId(existingId);
    open('picker');
  };
  const startChat = async () => {
    if (starting.current) return;
    const ids = [...new Set(selected)].filter((id) =>
      workspace.agents.some((a) => a.id === id),
    );
    if (!ids.length) return;
    if (editingChatId) {
      replies.stop(editingChatId);
      update((s) => updateConversationAgents(s, editingChatId, ids));
      close();
      return;
    }
    const id = chatId('chat');
    const next = conversationFor(workspace.agents, ids, id);
    const existing =
      ids.length === 1
        ? workspace.chats.find(
            (c) => c.agentIds.length === 1 && c.agentIds[0] === ids[0],
          )
        : undefined;
    if (existing) {
      selectChat(existing.id);
      close();
      return;
    }
    starting.current = true;
    const generation = ++handoffGeneration.current;
    const selectedAgents = ids.flatMap(
      (id) => workspace.agents.find((a) => a.id === id) ?? [],
    );
    const [avatars, origin] = await Promise.all([
      ids.length > 1 && !reduced
        ? captureAvatars(selectedAgents, pickerAvatars.current)
        : Promise.resolve([]),
      measureAvatar(root.current ?? undefined),
    ]);
    starting.current = false;
    if (generation !== handoffGeneration.current) return;
    setFlightOrigin(origin);
    setHandoff(
      avatars.length
        ? { chatId: id, kind: 'group', avatars, arrived: [] }
        : null,
    );
    setEditor(null);
    update((s) => ({ ...s, chats: [next, ...s.chats], activeId: id }));
    follow.current = true;
    close();
  };
  const copy = async (text: string, message = messages.copied) => {
    try {
      if (onCopy) await onCopy(text);
      else if (
        Platform.OS === 'web' &&
        typeof navigator !== 'undefined' &&
        navigator.clipboard
      )
        await navigator.clipboard.writeText(text);
      else await Share.share({ message: text });
      replies.setNotice(message);
    } catch {
      replies.setNotice(messages.couldnTCopyPleaseTryAgain);
    }
  };
  const transcript = (conversation: Conversation) =>
    conversation.messages
      .map(
        (m) =>
          `${m.role === 'user' ? messages.you : (workspace.agents.find((a) => a.id === m.agentId)?.name ?? messages.agent)}: ${m.text}`,
      )
      .join('\n\n');
  const selectChat = (id: string) => {
    handoffGeneration.current++;
    setHandoff(null);
    update((s) => ({ ...s, activeId: id }));
    follow.current = !offsets.current[id];
    requestAnimationFrame(() =>
      scroll.current?.scrollTo({
        y: offsets.current[id] ?? 0,
        animated: false,
      }),
    );
    if (panel === 'navigation') close();
  };
  const removeChat = (id: string) => {
    replies.stop(id);
    update((s) => removeConversation(s, id));
    setDrafts((s) => {
      const next = { ...s };
      delete next[id];
      return next;
    });
    replies.setNotice(messages.chatRemoved);
  };
  const sendMessage = async (text: string) => {
    if (!chat || !text.trim() || replies.pending[chat.id] || sending.current)
      return;
    sending.current = true;
    const id = chat.id,
      generation = ++handoffGeneration.current;
    const [avatars, origin] = await Promise.all([
      !chat.messages.length && participants.length > 1 && !reduced
        ? captureAvatars(participants, emptyAvatars.current)
        : Promise.resolve([]),
      measureAvatar(root.current ?? undefined),
    ]);
    sending.current = false;
    if (generation !== handoffGeneration.current) return;
    setFlightOrigin(origin);
    setHandoff(
      avatars.length
        ? {
            chatId: id,
            kind: 'first',
            responderId: participants[0]?.id,
            avatars,
            arrived: [],
          }
        : null,
    );
    setDrafts((s) => ({ ...s, [id]: '' }));
    follow.current = true;
    void replies.send(text, id, avatars.length ? 800 : 0, chat);
  };
  const editPanel = useMemo(
    () =>
      editor && (
        <AgentCreator
          agent={editor}
          onChange={saveAgent}
          voices={voices}
          onPreviewVoice={onPreviewVoice}
          onClose={() => {
            setEditor(null);
            if (panel === 'editor') surface.close();
          }}
          style={{ flex: 1 }}
        />
      ),
    [AgentCreator, editor, saveAgent, voices, onPreviewVoice, panel, surface],
  );
  const sortedChats = useMemo(
    () =>
      workspace.chats
        .filter((c) =>
          `${c.customTitle || c.title} ${workspace.agents
            .filter((a) => c.agentIds.includes(a.id))
            .map((a) => `${a.name} ${a.label}`)
            .join(' ')} ${c.messages[c.messages.length - 1]?.text ?? ''}`
            .toLocaleLowerCase()
            .includes(query.toLocaleLowerCase()),
        )
        .sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned)),
    [workspace.chats, workspace.agents, query],
  );
  const sidebar = (
    <ChatSidebar
      agents={workspace.agents}
      chats={sortedChats}
      activeId={workspace.activeId}
      pending={replies.pending}
      query={query}
      searchOpen={searchOpen}
      onQuery={setQuery}
      onSearch={setSearchOpen}
      onSelect={selectChat}
      onCreate={createAgent}
      onPicker={() => chooseAgents()}
      onMarketplace={() => {
        setMarketItem(null);
        setPanel('marketplace');
      }}
      onSettings={() => setPanel('settings')}
      onSupport={() => open('support')}
      onAction={(target, action) => {
        setTargetChatId(target.id);
        if (action === 'pin')
          update((s) => ({
            ...s,
            chats: s.chats.map((c) =>
              c.id === target.id ? { ...c, pinned: !c.pinned } : c,
            ),
          }));
        if (action === 'rename') {
          setRename(target.customTitle || target.title);
          open('rename');
        }
        if (action === 'edit') {
          if (target.agentIds.length > 1)
            chooseAgents(target.agentIds, target.id);
          else {
            const agent = workspace.agents.find(
              (a) => a.id === target.agentIds[0],
            );
            if (agent) edit(agent);
          }
        }
        if (action === 'copy')
          void copy(transcript(target), messages.conversationCopied);
        if (action === 'copy-id')
          void copy(target.id, messages.conversationIDCopied);
        if (action === 'remove') removeChat(target.id);
      }}
    />
  );
  const title =
    panel === 'picker'
      ? editingChatId
        ? messages.editGroup
        : messages.chatWithYourAgents
      : panel === 'rename'
        ? messages.renameChat
        : panel === 'marketplace'
          ? (marketItem?.name ?? messages.marketplace)
          : panel === 'editor'
            ? messages.editAgentTitle
            : panel === 'support'
              ? messages.aLittleHelp
              : panel === 'settings'
                ? messages.settings
                : panel === 'navigation'
                  ? messages.conversations
                  : messages.conversationOptions;
  const messageActions = (id: string, text: string) => (
    <StyledView className="mt-1 flex-row items-center gap-1">
      {(['up', 'down'] as const).map((value) => (
        <StyledPressable
          key={value}
          accessibilityRole="button"
          accessibilityLabel={
            value === 'up'
              ? messages.helpfulResponse
              : messages.unhelpfulResponse
          }
          accessibilityState={{ selected: feedback[id] === value }}
          aria-pressed={feedback[id] === value}
          onPress={() => setFeedback((s) => ({ ...s, [id]: value }))}
          className="h-[22px] w-[22px] items-center justify-center rounded-md"
          style={{ backgroundColor: colors.backgroundTertiary }}
        >
          {value === 'up' ? (
            <RiThumbUpLine
              width={12}
              height={12}
              fill={
                feedback[id] === value ? colors.primary : colors.textTertiary
              }
            />
          ) : (
            <RiThumbDownLine
              width={12}
              height={12}
              fill={
                feedback[id] === value ? colors.primary : colors.textTertiary
              }
            />
          )}
        </StyledPressable>
      ))}
      <StyledPressable
        accessibilityRole="button"
        accessibilityLabel={messages.copyResponse}
        className="flex size-[22px] items-center justify-center rounded-md bg-background-tertiary-default text-foreground-icon-tertiary outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring"
        onPress={() => {
          void copy(text, messages.responseCopied);
        }}
      >
        <RiFileCopyLine width={12} height={12} fill={colors.textTertiary} />
      </StyledPressable>
    </StyledView>
  );
  return (
    <StyledView
      {...directionProps}
      ref={root}
      collapsable={false}
      className={`flex h-dvh min-h-0 overflow-hidden bg-background-full p-3 text-text-primary flex-row ${className ?? ''}`}
      style={[{ flex: 1, minHeight: 0 }, style]}
      testID={testID}
    >
      {!phone && (
        <StyledView
          className="me-4 hidden min-h-0 shrink-0 md:block"
          style={{ width: 260 }}
        >
          {sidebar}
        </StyledView>
      )}
      <StyledView
        accessibilityLabel={messages.agentConversation}
        className="flex min-h-0 min-w-0 flex-1 flex-col rounded-3xl bg-background-secondary-default"
      >
        <StyledView className="relative h-[100px] shrink-0">
          <StyledView
            pointerEvents="box-none"
            className="absolute inset-0 flex-row justify-center px-16 pt-1.5"
          >
            <StyledView
              pointerEvents="box-none"
              className="min-w-0 max-w-full items-center self-start"
            >
              <ChatAgentProfile
                agents={participants}
                avatarRef={profileAvatarRef}
                expanded={
                  participants.length === 1
                    ? editor?.id === participants[0]!.id
                    : panel === 'picker'
                }
                onPress={() =>
                  participants.length === 1
                    ? edit(participants[0]!)
                    : chooseAgents(chat?.agentIds)
                }
              />
            </StyledView>
          </StyledView>
          {phone && (
            <StyledView
              style={{ position: 'absolute', top: 12, insetInlineStart: 12 }}
            >
              <IconButton
                icon={RiMenuLine}
                accessibilityLabel={messages.openConversations}
                size="sm"
                onPress={() => open('navigation')}
              />
            </StyledView>
          )}
          <StyledView
            className="flex-row items-center gap-2"
            style={{ position: 'absolute', top: 12, insetInlineEnd: 12 }}
          >
            <StyledPressable
              accessibilityRole="button"
              accessibilityLabel={messages.copyConversation}
              onPress={() =>
                chat && void copy(transcript(chat), messages.conversationCopied)
              }
              className="rounded p-1 text-foreground-icon-secondary outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring"
            >
              <RiShare2Line
                width={16}
                height={16}
                fill={colors.textSecondary}
              />
            </StyledPressable>
            <D.DropdownMenu>
              <D.DropdownMenuTrigger asChild>
                <StyledPressable
                  accessibilityRole="button"
                  accessibilityLabel={messages.conversationOptions}
                  className="rounded p-1 text-foreground-icon-secondary"
                >
                  <RiMoreFill
                    width={16}
                    height={16}
                    fill={colors.textSecondary}
                  />
                </StyledPressable>
              </D.DropdownMenuTrigger>
              <D.DropdownMenuContent
                label={messages.conversationOptions}
                align="end"
                className="rounded-[14px] p-1"
                style={{ borderRadius: 14, padding: 4 }}
              >
                <D.DropdownMenuLabel>
                  {messages.inThisConversation}
                </D.DropdownMenuLabel>
                {participants.map((agent) => (
                  <D.DropdownMenuItem
                    key={agent.id}
                    onPress={() => edit(agent)}
                    leading={<AgentAvatar config={agent.avatar} size={20} />}
                    className="px-2 py-1.5 text-body-medium"
                  >
                    {formatChatMessage(messages.editAgent, agent.name)}
                  </D.DropdownMenuItem>
                ))}
                <D.DropdownMenuItem
                  onPress={() => chooseAgents(chat?.agentIds)}
                  leading={<RiGroupLine width={16} height={16} />}
                  className="px-2 py-1.5 text-body-medium"
                >
                  {messages.startAGroupChat}
                </D.DropdownMenuItem>
              </D.DropdownMenuContent>
            </D.DropdownMenu>
          </StyledView>
        </StyledView>
        <ScrollSurface
          scrollRef={scroll}
          label={messages.messages}
          className="flex-1"
          contentClassName={
            chat?.messages.length
              ? 'pb-4 pt-2'
              : 'flex items-center justify-center p-4'
          }
          contentContainerStyle={{ flexGrow: 1 }}
          scrollEventThrottle={16}
          onScroll={(event) => {
            const { contentOffset, contentSize, layoutMeasurement } =
              event.nativeEvent;
            follow.current =
              contentSize.height - contentOffset.y - layoutMeasurement.height <
              100;
            if (chat) offsets.current[chat.id] = contentOffset.y;
          }}
          onContentSizeChange={() => {
            if (follow.current)
              scroll.current?.scrollToEnd({ animated: false });
          }}
        >
          {!chat || !chat.messages.length ? (
            <StyledView className="flex-1 items-center justify-center gap-4 px-4 py-8">
              <SelectedAgentPreview
                agents={participants}
                nodes={emptyAvatars.current}
                hidden={
                  handoff?.kind === 'group' && handoff.chatId === chat?.id
                    ? handoff.avatars
                        .filter((a) => !handoff.arrived.includes(a.agent.id))
                        .map((a) => a.agent.id)
                    : []
                }
              />
              <StyledView className="flex flex-col items-center gap-1.5">
                <Text
                  variant="title-3-semibold"
                  style={{ textAlign: 'center' }}
                >
                  {participants.length > 1
                    ? messages.aFewMindsOneConversation
                    : participants[0]
                      ? formatChatMessage(
                          messages.sayHelloTo,
                          participants[0].name,
                        )
                      : messages.chatWithYourAgents}
                </Text>
                <Text
                  variant="body-regular"
                  style={{
                    maxWidth: 420,
                    textAlign: 'center',
                    color: colors.textSecondary,
                  }}
                >
                  {participants.length > 1
                    ? formatChatMessage(
                        messages.areHereSendAMessageToGet,
                        participants.map((a) => a.name).join(', '),
                      )
                    : (participants[0]?.description ??
                      messages.chooseAnAgentOrCreateYourOwn)}
                </Text>
              </StyledView>
              {!chat && (
                <Button onPress={() => chooseAgents()}>
                  {messages.startChat}
                </Button>
              )}
            </StyledView>
          ) : (
            <StyledView>
              {/* DOM block margins collapse; RN flex margins add. Keep the same 16px inter-row gap. */}
              <StyledView
                className="mb-4 mt-3 flex justify-center items-center"
                style={{ marginBottom: 4 }}
              >
                <Text className="rounded-full bg-background-tertiary-default px-[7px] py-1 text-body-2-medium text-text-secondary">
                  {messages.today}
                </Text>
              </StyledView>
              {[
                ...chat.messages,
                ...(replies.thinking[chat.id]
                  ? [replies.thinking[chat.id]!]
                  : []),
              ].map((message) => {
                const agent = workspace.agents.find(
                  (a) => a.id === message.agentId,
                );
                const text = formatDemoReply(message.text);
                if (message.role === 'user')
                  return (
                    <StyledView
                      key={message.id}
                      className="me-3 ms-auto mt-3 w-fit max-w-[min(520px,calc(100%-24px))] rounded-[var(--radius-2-5xl)] bg-background-primary-default p-3 text-start text-body-regular whitespace-pre-wrap break-words"
                      style={{
                        alignSelf: 'flex-end',
                        maxWidth: Platform.OS === 'web' ? undefined : '94%',
                      }}
                    >
                      <Text variant="body-regular">{message.text}</Text>
                    </StyledView>
                  );
                const thinking = replies.thinking[chat.id]?.id === message.id;
                return (
                  <ReplyRow
                    key={message.id}
                    header={
                      agent && (
                        <ReplyHeader
                          agent={agent}
                          thinking={thinking}
                          workingKey={replies.pending[chat.id]}
                          nodes={thinking ? replyAvatars.current : undefined}
                          arriving={
                            thinking &&
                            handoff?.kind === 'first' &&
                            handoff.chatId === chat.id &&
                            handoff.responderId === agent.id &&
                            !handoff.arrived.includes(agent.id)
                          }
                          onEdit={() => edit(agent)}
                        />
                      )
                    }
                    actions={
                      !thinking &&
                      replies.streaming[chat.id] !== message.id &&
                      messageActions(message.id, text)
                    }
                  >
                    {!!text && (
                      <StyledView className="rounded-[var(--radius-2-5xl)] bg-background-tertiary-default p-3">
                        <StreamedText text={text} paragraphs />
                      </StyledView>
                    )}
                  </ReplyRow>
                );
              })}
            </StyledView>
          )}
        </ScrollSurface>
        {chat && (
          <StyledView className="p-1">
            <ComposerPanel
              value={drafts[chat.id] ?? ''}
              onValueChange={(value) =>
                setDrafts((s) => ({ ...s, [chat.id]: value }))
              }
              onSubmit={(text) => {
                void sendMessage(text);
              }}
              disabled={!!replies.pending[chat.id]}
              busy={!!replies.pending[chat.id]}
              onStop={() => replies.stop(chat.id)}
              providers={props.providers ?? WORKSPACE_MODELS}
              status={null}
              defaultPermission="bypass"
              defaultModel="anthropic/fable-5"
              style={{ borderRadius: 20 }}
            />
          </StyledView>
        )}
      </StyledView>
      {!!replies.notice && (
        <Portal>
          <OverlayRoot
            zIndex={TOAST_LAYER_Z}
            style={{
              justifyContent: 'flex-end',
              alignItems: 'center',
              padding: 20,
            }}
          >
            <StyledView
              pointerEvents="none"
              className="max-w-[calc(100%-32px)] rounded-xl border border-border-button-default bg-background-primary-default px-4 py-3 shadow-lg"
              style={{ maxWidth: '100%' }}
            >
              <StyledView className="flex flex-row items-center gap-2">
                <RiCheckLine
                  width={16}
                  height={16}
                  fill={colors.textSecondary}
                />
                <Text
                  accessibilityRole="alert"
                  aria-live="polite"
                  className="text-body-regular text-text-primary"
                >
                  {replies.notice}
                </Text>
              </StyledView>
            </StyledView>
          </OverlayRoot>
        </Portal>
      )}
      <EditorRail active={!!editor && !compact}>{editPanel}</EditorRail>
      <Dialog
        presentation="custom"
        exitDuration={panel === 'editor' ? 280 : 240}
        contentPadding={0}
        scrollable={false}
        control={surface}
        label={title}
        maxWidth={100000}
        placement="center"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          maxWidth: '100%',
        }}
        containerStyle={{ padding: 0, paddingHorizontal: 0 }}
        onClose={() => {
          setPanel(null);
          if (compact && panel === 'editor') setEditor(null);
        }}
      >
        <ChatDialogFrame
          title={title}
          mode={
            panel === 'editor'
              ? 'editor'
              : panel === 'navigation'
                ? 'navigation'
                : 'center'
          }
          preview={
            panel === 'picker' ? (
              <SelectedAgentPreview
                caption
                agents={selected.flatMap(
                  (id) => workspace.agents.find((a) => a.id === id) ?? [],
                )}
                nodes={pickerAvatars.current}
                hidden={
                  handoff?.kind === 'group'
                    ? handoff.avatars.map((a) => a.agent.id)
                    : []
                }
              />
            ) : undefined
          }
          footer={
            panel === 'picker' ? (
              <Button
                className="w-full rounded-full"
                style={{ width: '100%', borderRadius: 999 }}
                onPress={() => {
                  void startChat();
                }}
                disabled={!selected.length}
              >
                {messages.pickerAction(!!editingChatId, selected.length)}
              </Button>
            ) : panel === 'rename' ? (
              <Button
                className="w-full rounded-full"
                style={{ width: '100%', borderRadius: 999 }}
                disabled={!rename.trim()}
                onPress={() => {
                  update((s) => ({
                    ...s,
                    chats: s.chats.map((c) =>
                      c.id === targetChat?.id
                        ? { ...c, customTitle: rename.trim() }
                        : c,
                    ),
                  }));
                  close();
                }}
              >
                {messages.saveName}
              </Button>
            ) : undefined
          }
        >
          {panel === 'navigation' && sidebar}
          {panel === 'editor' && editPanel}
          {panel === 'rename' && (
            <TextFieldInput
              label={messages.chatName}
              autoFocus
              value={rename}
              onChangeText={setRename}
              maxLength={100}
              onSubmitEditing={() => {
                if (!rename.trim()) return;
                update((s) => ({
                  ...s,
                  chats: s.chats.map((c) =>
                    c.id === targetChat?.id
                      ? { ...c, customTitle: rename.trim() }
                      : c,
                  ),
                }));
                close();
              }}
            />
          )}
          {panel === 'picker' && (
            <StyledView
              className="flex flex-wrap justify-center gap-2 flex-row"
              role="group"
              accessibilityLabel={messages.chooseYourTeammates}
            >
              {workspace.agents.map((agent) => {
                const picked = selected.includes(agent.id);
                return (
                  <Button
                    key={agent.id}
                    appearance="plain"
                    tone="neutral"
                    accessibilityLabel={agent.name}
                    pressed={picked}
                    onPress={() =>
                      setSelected((ids) =>
                        picked
                          ? ids.filter((id) => id !== agent.id)
                          : [...ids, agent.id],
                      )
                    }
                    className={`h-10 max-w-full rounded-full border px-2 shadow-none transition-colors hover:bg-background-tertiary-default active:bg-background-tertiary-hover ${picked ? 'border-foreground-icon-secondary bg-background-tertiary-default text-text-primary dark:bg-background-tertiary-hover dark:hover:bg-background-tertiary-hover dark:active:bg-background-tertiary-hover' : 'border-transparent bg-background-secondary-default text-text-secondary'}`}
                    style={{
                      height: 40,
                      maxWidth: '100%',
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: picked
                        ? colors.textSecondary
                        : 'transparent',
                      backgroundColor: picked
                        ? colors.backgroundTertiary
                        : colors.backgroundSecondary,
                      boxShadow: 'none',
                      paddingStart: 8,
                      paddingEnd: 8,
                    }}
                  >
                    <StyledView className="inline-flex items-center justify-center px-1 shrink-0 flex-row">
                      <StyledView className="flex min-w-0 items-center gap-2 flex-row">
                        <StyledView className="size-6 shrink-0" aria-hidden>
                          <AgentAvatar config={agent.avatar} size={24} />
                        </StyledView>
                        <Text
                          className={`truncate text-body-medium ${picked ? 'text-text-primary' : 'text-text-secondary'}`}
                          numberOfLines={1}
                        >
                          {agent.name}
                        </Text>
                      </StyledView>
                    </StyledView>
                  </Button>
                );
              })}
            </StyledView>
          )}
          {panel === 'options' && targetChat && (
            <StyledView className="gap-2">
              <Button
                appearance="plain"
                onPress={() => {
                  update((s) => ({
                    ...s,
                    chats: s.chats.map((c) =>
                      c.id === targetChat.id ? { ...c, pinned: !c.pinned } : c,
                    ),
                  }));
                  close();
                }}
              >
                {targetChat.pinned ? messages.unpinChat : messages.pinChat}
              </Button>
              <Button
                appearance="plain"
                onPress={() => {
                  setRename(targetChat.customTitle || targetChat.title);
                  setPanel('rename');
                }}
              >
                {messages.renameChat}
              </Button>
              <Button
                appearance="plain"
                leadingIcon={RiGroupLine}
                onPress={() => chooseAgents(targetChat.agentIds, targetChat.id)}
              >
                {messages.editGroup}
              </Button>
              {targetChat.agentIds.map((id) => {
                const agent = workspace.agents.find((a) => a.id === id);
                return (
                  agent && (
                    <Button
                      key={id}
                      appearance="plain"
                      onPress={() => {
                        if (!compact) close();
                        edit(agent);
                      }}
                    >
                      {formatChatMessage(messages.editAgent, agent.name)}
                    </Button>
                  )
                );
              })}
              <Button
                appearance="plain"
                onPress={() => {
                  void copy(
                    transcript(targetChat),
                    messages.conversationCopied,
                  );
                }}
              >
                {messages.copyConversation}
              </Button>
              <Button
                appearance="plain"
                onPress={() => {
                  void copy(targetChat.id, messages.conversationIDCopied);
                }}
              >
                {messages.copyConversationID}
              </Button>
              <Button
                appearance="plain"
                onPress={() => removeChat(targetChat.id)}
              >
                {messages.removeChat}
              </Button>
            </StyledView>
          )}
          {panel === 'support' && (
            <StyledView
              className="space-y-4 text-body-regular text-text-secondary"
              style={{ gap: 16 }}
            >
              <SupportCopy text={messages.useToCreateABotOrStart} term="+" />
              <SupportCopy
                text={messages.openTheMarketplaceToExplorePluginsAnd}
                term={messages.marketplace}
              />
              <Text className="text-body-regular text-text-secondary">
                {messages.sendWithEnterUseShiftEnterFor}
              </Text>
            </StyledView>
          )}
        </ChatDialogFrame>
      </Dialog>
      {(panel === 'marketplace' || panel === 'settings') && (
        <Marketplace
          initialItem={marketItem?.id}
          defaultPage={panel === 'settings' ? 'general' : 'marketplace'}
          agents={workspace.agents}
          installedPlugins={workspace.installedPlugins ?? DEFAULT_PLUGINS}
          onClose={() => setPanel(null)}
          onCopy={copy}
          onChat={(id) => {
            setSelected([id]);
            const existing = workspace.chats.find(
              (c) => c.agentIds.length === 1 && c.agentIds[0] === id,
            );
            if (existing) selectChat(existing.id);
            else {
              const created = conversationFor(
                workspace.agents,
                [id],
                chatId('chat'),
              );
              update((s) => ({
                ...s,
                chats: [created, ...s.chats],
                activeId: created.id,
              }));
            }
            setPanel(null);
          }}
          onAddBot={(item) => update((s) => addMarketplaceBot(s, item))}
          onTogglePlugin={(id) =>
            update((s) => {
              const installed = s.installedPlugins ?? DEFAULT_PLUGINS;
              return {
                ...s,
                installedPlugins: installed.includes(id)
                  ? installed.filter((value) => value !== id)
                  : [...installed, id],
              };
            })
          }
        />
      )}
      {handoff && handoff.chatId === chat?.id && (
        <AvatarHandoff
          handoff={handoff}
          origin={flightOrigin}
          resolveTarget={resolveFlightTarget}
          onArrive={arriveAvatar}
          onFinish={finishHandoff}
        />
      )}
    </StyledView>
  );
}
