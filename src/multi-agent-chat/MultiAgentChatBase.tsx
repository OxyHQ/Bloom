import { type ComponentRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { View } from 'react-native';
import { Platform, ScrollView, Share, useWindowDimensions } from 'react-native';
import Animated from 'react-native-reanimated';
import { AgentAvatar } from '../agent-avatar';
import { AvatarFlightLayer, avatarJoinFlights, useAvatarFlights } from '../avatar-flight';
import { StreamedText } from '../agent-chat/AgentChatMessage';
import { Button, IconButton } from '../button';
import { useDialogControl } from '../dialog/context';
import { useDirectionProps } from '../hooks/use-is-rtl';
import {
  AgentProfile,
  AgentReply,
  AgentReplyActions,
  AgentReplyBubble,
  AgentReplyIdentity,
} from '../agent-reply';
import { RiCheckLine } from '../icons/remix/RiCheckLine';
import { RiFileCopyLine } from '../icons/remix/RiFileCopyLine';
import { RiGroupLine } from '../icons/remix/RiGroupLine';
import { RiMenuLine } from '../icons/remix/RiMenuLine';
import { RiMoreFill } from '../icons/remix/RiMoreFill';
import { RiShare2Line } from '../icons/remix/RiShare2Line';
import { RiThumbDownLine } from '../icons/remix/RiThumbDownLine';
import { RiThumbUpLine } from '../icons/remix/RiThumbUpLine';
import { useMessages, formatMessage } from '../locale/messages';
import { OverlayRoot, TOAST_LAYER_Z } from '../overlay';
import { StyledPressable, StyledView } from '../styles/styled-primitives';
import { TextFieldInput } from '../text-field';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { ChatDialogFrame, SupportCopy } from './ChatDialogFrame';
import { ChatSidebar } from './ChatSidebar';
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
import { Marketplace } from './Marketplace';
import {
  DEFAULT_PLUGINS,
  MARKETPLACE_ITEMS,
  addMarketplaceBot,
  type MarketplaceItem,
} from './marketplace-data';
import { MULTI_AGENT_CHAT_MESSAGES } from './messages';
import { WORKSPACE_MODELS } from './model-catalog';
import { ScrollSurface } from '../layout/ScrollSurface';
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
/** The reply waits for the first-message flight to land on it: the flight's length. */
const REPLY_DELAY_MS = 800;

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
  const { Portal, Dialog, ComposerPanel, AgentCreator, Dropdown: D } = useChatComponents();
  const { colors } = useTheme();
  const directionProps = useDirectionProps();
  const flights = useAvatarFlights();
  const handoffGeneration = useRef(0),
    sending = useRef(false),
    starting = useRef(false);
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
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const follow = useRef(true);
  const offsets = useRef<Record<string, number>>({});
  const chat: Conversation = workspace.chats.find((c) => c.id === workspace.activeId) ??
    workspace.chats[0] ?? {
      id: 'draft-chat',
      title: '',
      agentIds: workspace.agents[0] ? [workspace.agents[0].id] : [],
      messages: [],
    };
  const participants =
    chat?.agentIds.flatMap((id) => workspace.agents.find((a) => a.id === id) ?? []) ?? [];
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
    setEditor(current.current.agents.find((agent) => agent.id === defaultEditorId) ?? null);
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
  const chooseAgents = (ids: string[] = [], existingId: string | null = null) => {
    handoffGeneration.current++;
    flights.cancel();
    setSelected(ids);
    setEditingChatId(existingId);
    open('picker');
  };
  const startChat = async () => {
    if (starting.current) return;
    const ids = [...new Set(selected)].filter((id) => workspace.agents.some((a) => a.id === id));
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
        ? workspace.chats.find((c) => c.agentIds.length === 1 && c.agentIds[0] === ids[0])
        : undefined;
    if (existing) {
      selectChat(existing.id);
      close();
      return;
    }
    starting.current = true;
    const generation = ++handoffGeneration.current;
    const selectedAgents = ids.flatMap((id) => workspace.agents.find((a) => a.id === id) ?? []);
    // The chosen avatars leave the picker's preview and land in the new conversation's.
    await flights.launch(
      ids.length > 1
        ? selectedAgents.map((agent, index) => ({
            key: agent.id,
            character: agent.avatar,
            from: `picker:${agent.id}`,
            to: `empty:${agent.id}`,
            path: 'straight' as const,
            ease: 'out' as const,
            duration: 700,
            delay: index * 80,
          }))
        : [],
    );
    starting.current = false;
    if (generation !== handoffGeneration.current) return;
    setEditor(null);
    update((s) => ({ ...s, chats: [next, ...s.chats], activeId: id }));
    follow.current = true;
    close();
  };
  const copy = async (text: string, message = messages.copied) => {
    try {
      if (onCopy) await onCopy(text);
      else if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard)
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
    flights.cancel();
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
    if (!chat || !text.trim() || replies.pending[chat.id] || sending.current) return;
    sending.current = true;
    const id = chat.id,
      generation = ++handoffGeneration.current;
    // In a group's first message the avatars leave the empty chat: the one answering lands on its
    // reply, the others merge into the header's profile.
    const [responder, ...waiting] = participants;
    const flying = await flights.launch(
      !chat.messages.length && responder && waiting.length
        ? [
            {
              key: responder.id,
              character: responder.avatar,
              from: `empty:${responder.id}`,
              to: `reply:${responder.id}`,
              duration: REPLY_DELAY_MS,
            },
            ...avatarJoinFlights(waiting, {
              from: (agent) => `empty:${agent.id}`,
              to: 'profile',
              character: (agent) => agent.avatar,
            }),
          ]
        : [],
    );
    sending.current = false;
    if (generation !== handoffGeneration.current) return;
    setDrafts((s) => ({ ...s, [id]: '' }));
    follow.current = true;
    void replies.send(text, id, flying ? REPLY_DELAY_MS : 0, chat);
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
            chats: s.chats.map((c) => (c.id === target.id ? { ...c, pinned: !c.pinned } : c)),
          }));
        if (action === 'rename') {
          setRename(target.customTitle || target.title);
          open('rename');
        }
        if (action === 'edit') {
          if (target.agentIds.length > 1) chooseAgents(target.agentIds, target.id);
          else {
            const agent = workspace.agents.find((a) => a.id === target.agentIds[0]);
            if (agent) edit(agent);
          }
        }
        if (action === 'copy') void copy(transcript(target), messages.conversationCopied);
        if (action === 'copy-id') void copy(target.id, messages.conversationIDCopied);
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
    <AgentReplyActions
      vote={feedback[id] ?? null}
      onVoteChange={(value) => setFeedback((s) => ({ ...s, [id]: value }))}
      onCopy={() => {
        void copy(text, messages.responseCopied);
      }}
    />
  );
  return (
    <StyledView
      {...directionProps}
      collapsable={false}
      className={`flex h-dvh min-h-0 overflow-hidden bg-background-full p-3 text-text-primary flex-row ${className ?? ''}`}
      style={[{ flex: 1, minHeight: 0 }, style]}
      testID={testID}
    >
      {!phone && (
        <StyledView className="me-4 hidden min-h-0 shrink-0 md:block" style={{ width: 260 }}>
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
              <AgentProfile
                agents={participants}
                label={participants.length ? undefined : messages.chooseYourTeammates}
                accessibilityLabel={
                  participants.length === 1
                    ? formatMessage(messages.editAgent, participants[0]!.name)
                    : messages.editConversationAgents
                }
                avatarRef={flights.anchor('profile')}
                expanded={
                  participants.length === 1
                    ? editor?.id === participants[0]!.id
                    : panel === 'picker'
                }
                onPress={() =>
                  participants.length === 1 ? edit(participants[0]!) : chooseAgents(chat?.agentIds)
                }
              />
            </StyledView>
          </StyledView>
          {phone && (
            <StyledView style={{ position: 'absolute', top: 12, insetInlineStart: 12 }}>
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
              onPress={() => chat && void copy(transcript(chat), messages.conversationCopied)}
              className="rounded p-1 text-foreground-icon-secondary outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring"
            >
              <RiShare2Line width={16} height={16} fill={colors.textSecondary} />
            </StyledPressable>
            <D.DropdownMenu>
              <D.DropdownMenuTrigger asChild>
                <StyledPressable
                  accessibilityRole="button"
                  accessibilityLabel={messages.conversationOptions}
                  className="rounded p-1 text-foreground-icon-secondary"
                >
                  <RiMoreFill width={16} height={16} fill={colors.textSecondary} />
                </StyledPressable>
              </D.DropdownMenuTrigger>
              <D.DropdownMenuContent
                label={messages.conversationOptions}
                align="end"
                className="rounded-[14px] p-1"
                style={{ borderRadius: 14, padding: 4 }}
              >
                <D.DropdownMenuLabel>{messages.inThisConversation}</D.DropdownMenuLabel>
                {participants.map((agent) => (
                  <D.DropdownMenuItem
                    key={agent.id}
                    onPress={() => edit(agent)}
                    leading={<AgentAvatar character={agent.avatar} size={20} />}
                    className="px-2 py-1.5 text-body-medium"
                  >
                    {formatMessage(messages.editAgent, agent.name)}
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
            chat?.messages.length ? 'pb-4 pt-2' : 'flex items-center justify-center p-4'
          }
          contentContainerStyle={{ flexGrow: 1 }}
          scrollEventThrottle={16}
          onScroll={(event) => {
            const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
            follow.current = contentSize.height - contentOffset.y - layoutMeasurement.height < 100;
            if (chat) offsets.current[chat.id] = contentOffset.y;
          }}
          onContentSizeChange={() => {
            if (follow.current) scroll.current?.scrollToEnd({ animated: false });
          }}
        >
          {!chat || !chat.messages.length ? (
            <StyledView className="flex-1 items-center justify-center gap-4 px-4 py-8">
              <SelectedAgentPreview agents={participants} flights={flights} anchor="empty" />
              <StyledView className="flex flex-col items-center gap-1.5">
                <Text variant="title-3-semibold" style={{ textAlign: 'center' }}>
                  {participants.length > 1
                    ? messages.aFewMindsOneConversation
                    : participants[0]
                      ? formatMessage(messages.sayHelloTo, participants[0].name)
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
                    ? formatMessage(
                        messages.areHereSendAMessageToGet,
                        participants.map((a) => a.name).join(', '),
                      )
                    : (participants[0]?.description ?? messages.chooseAnAgentOrCreateYourOwn)}
                </Text>
              </StyledView>
              {!chat && <Button onPress={() => chooseAgents()}>{messages.startChat}</Button>}
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
                ...(replies.thinking[chat.id] ? [replies.thinking[chat.id]!] : []),
              ].map((message) => {
                const agent = workspace.agents.find((a) => a.id === message.agentId);
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
                  <AgentReply
                    key={message.id}
                    identity={
                      agent && (
                        <AgentReplyIdentity
                          character={agent.avatar}
                          name={agent.name}
                          thinking={thinking}
                          workingKey={replies.pending[chat.id] ?? agent.id}
                          avatarRef={thinking ? flights.anchor(`reply:${agent.id}`) : undefined}
                          avatarHidden={thinking && flights.isLanding(`reply:${agent.id}`)}
                          onPress={() => edit(agent)}
                          pressLabel={formatMessage(messages.editAgent, agent.name)}
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
                      <AgentReplyBubble>
                        <StreamedText text={text} paragraphs />
                      </AgentReplyBubble>
                    )}
                  </AgentReply>
                );
              })}
            </StyledView>
          )}
        </ScrollSurface>
        {chat && (
          <StyledView className="p-1">
            <ComposerPanel
              value={drafts[chat.id] ?? ''}
              onValueChange={(value) => setDrafts((s) => ({ ...s, [chat.id]: value }))}
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
                <RiCheckLine width={16} height={16} fill={colors.textSecondary} />
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
          mode={panel === 'editor' ? 'editor' : panel === 'navigation' ? 'navigation' : 'center'}
          preview={
            panel === 'picker' ? (
              <SelectedAgentPreview
                caption
                agents={selected.flatMap((id) => workspace.agents.find((a) => a.id === id) ?? [])}
                flights={flights}
                anchor="picker"
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
                      c.id === targetChat?.id ? { ...c, customTitle: rename.trim() } : c,
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
                    c.id === targetChat?.id ? { ...c, customTitle: rename.trim() } : c,
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
                        picked ? ids.filter((id) => id !== agent.id) : [...ids, agent.id],
                      )
                    }
                    className={`h-10 max-w-full rounded-full border px-2 shadow-none transition-colors hover:bg-background-tertiary-default active:bg-background-tertiary-hover ${picked ? 'border-foreground-icon-secondary bg-background-tertiary-default text-text-primary dark:bg-background-tertiary-hover dark:hover:bg-background-tertiary-hover dark:active:bg-background-tertiary-hover' : 'border-transparent bg-background-secondary-default text-text-secondary'}`}
                    style={{
                      height: 40,
                      maxWidth: '100%',
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: picked ? colors.textSecondary : 'transparent',
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
                          <AgentAvatar character={agent.avatar} size={24} />
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
                      {formatMessage(messages.editAgent, agent.name)}
                    </Button>
                  )
                );
              })}
              <Button
                appearance="plain"
                onPress={() => {
                  void copy(transcript(targetChat), messages.conversationCopied);
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
              <Button appearance="plain" onPress={() => removeChat(targetChat.id)}>
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
              const created = conversationFor(workspace.agents, [id], chatId('chat'));
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
      <AvatarFlightLayer flights={flights} />
    </StyledView>
  );
}
