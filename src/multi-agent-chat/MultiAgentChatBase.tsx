import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, ScrollView, Share, useWindowDimensions } from 'react-native';
import Animated, { useReducedMotion, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { AgentAvatar, FOLD_CONFIG } from '../agent-avatar';
import { Button, IconButton } from '../button';
import { useDialogControl } from '../dialog/context';
import { useDirection } from '../direction';
import { RiAddLine, RiMenuLine, RiMoreFill, RiEditLine, RiSearchLine, RiSettings3Line, RiShoppingBag3Line, RiGroupLine, RiThumbUpLine, RiThumbDownLine, RiFileCopyLine, RiCloseLine } from '../icons/remix';
import { StyledView, StyledPressable } from '../styles/styled-primitives';
import { TextFieldInput } from '../text-field';
import { useTemplateCopy } from '../template-copy';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { useChatComponents } from './context';
import { conversationFor, updateConversationAgents, removeConversation, nextAgentIdentity, formatDemoReply, type Agent, type Conversation } from './data';
import { addMarketplaceBot, DEFAULT_PLUGINS, filterMarketplace, marketplaceAgentId, type MarketplaceItem } from './marketplace-data';
import { useWorkspace } from './use-workspace';
import { chatId, useReplies } from './use-replies';
import type { MultiAgentChatProps } from './types';
import type { View } from 'react-native';
import { SelectedAgentPreview } from './SelectedAgentPreview';
import { AvatarHandoff } from './AvatarHandoff';
import { EditorRail } from './EditorRail';
import { ReplyHeader, ReplyRow } from './ReplyRow';
import { captureAvatars, measureAvatar, type AvatarNodes, type AvatarHandoffState, type AvatarRect } from './handoff';

const AnimatedView = Animated.createAnimatedComponent(StyledView);
type Panel = 'picker' | 'rename' | 'options' | 'marketplace' | 'settings' | 'editor' | 'navigation' | null;

function AgentStack({ agents, size = 40, nodes }: { agents: Agent[]; size?: number; nodes?:AvatarNodes }) {
  return <StyledView style={{ width: size, height: size }} accessibilityLabel={agents.map(a => a.name).join(', ')}>
    {agents.slice(0, 3).map((agent, i) => <StyledView key={agent.id} ref={(node:View|null)=>{if(nodes){if(node)nodes.set(agent.id,node);else nodes.delete(agent.id);}}} collapsable={false} style={{ width:agents.length===1?size:size*.65,height:agents.length===1?size:size*.65,position: 'absolute', left: agents.length === 1 ? 0 : i === 1 ? size * .4 : i === 2 ? size * .2 : 0, top: i === 2 ? size * .4 : 0 }}>
      <AgentAvatar config={agent.avatar} size={agents.length === 1 ? size : size * .65} label={agent.name} />
    </StyledView>)}
  </StyledView>;
}
function ReplyText({ text }: { text: string }) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const opacity = useSharedValue(reduced ? 1 : 0);
  React.useEffect(() => { opacity.value = withTiming(1, { duration: reduced ? 0 : 420 }); }, [opacity, reduced]);
  const animated = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: (1 - opacity.value) * 4 }] }), [opacity]);
  return <AnimatedView style={animated}><Text variant="body-regular" style={{ color: colors.text }}>{text}</Text></AnimatedView>;
}

/** Shared workspace implementation. Platform bindings select Bloom's existing surfaces only. */
export function MultiAgentChatBase(props: MultiAgentChatProps) {
  const { defaultEditorId, onCopy, voices, onPreviewVoice, className, style, testID = 'multi-agent-chat' } = props;
  const { Dialog, ComposerPanel, AgentCreator } = useChatComponents();
  const { colors } = useTheme(); const direction = useDirection(); const localize = useTemplateCopy();
  const reduced=useReducedMotion();
  const root=useRef<View>(null),pickerAvatars=useRef<AvatarNodes>(new Map()),emptyAvatars=useRef<AvatarNodes>(new Map()),headerAvatars=useRef<AvatarNodes>(new Map()),replyAvatars=useRef<AvatarNodes>(new Map());
  const [handoff,setHandoff]=useState<AvatarHandoffState|null>(null),[flightOrigin,setFlightOrigin]=useState<AvatarRect|null>(null);
  const handoffGeneration=useRef(0),sending=useRef(false),starting=useRef(false);
  const finishHandoff=useCallback(()=>setHandoff(null),[]);
  const arriveAvatar=useCallback((id:string)=>setHandoff(current=>{if(!current||current.arrived.includes(id))return current;const arrived=[...current.arrived,id];return arrived.length===current.avatars.length?null:{...current,arrived};}),[]);
  const resolveFlightTarget=useCallback((id:string)=>handoff?.kind==='group'?emptyAvatars.current.get(id):id===handoff?.responderId?replyAvatars.current.get(id):(headerAvatars.current.get(id)??headerAvatars.current.values().next().value),[handoff?.kind,handoff?.responderId]);
  const { width } = useWindowDimensions(); const compact = width < 1100; const phone = width < 768;
  const { workspace, current, update } = useWorkspace(props);
  const replies = useReplies(current, update, props.onRespond);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [editor, setEditor] = useState<Agent | null>(() => workspace.agents.find(a => a.id === defaultEditorId) ?? null);
  const [panel, setPanel] = useState<Panel>(null);
  const [selected, setSelected] = useState<string[]>([]); const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [targetChatId, setTargetChatId] = useState<string | null>(null); const [rename, setRename] = useState('');
  const [query, setQuery] = useState(''); const [searchOpen, setSearchOpen] = useState(false);
  const [marketKind, setMarketKind] = useState<'all' | 'plugin' | 'bot'>('all'); const [marketItem, setMarketItem] = useState<MarketplaceItem | null>(null);
  const [feedback, setFeedback] = useState<Record<string, 'up' | 'down'>>({});
  const surface = useDialogControl(); const scroll = useRef<ScrollView>(null); const follow = useRef(true);
  const offsets = useRef<Record<string, number>>({});
  const chat = workspace.chats.find(c => c.id === workspace.activeId);
  const participants = chat?.agentIds.flatMap(id => workspace.agents.find(a => a.id === id) ?? []) ?? [];
  const targetChat = workspace.chats.find(c => c.id === targetChatId) ?? chat;
  const open = useCallback((next: Panel) => { setPanel(next); surface.open(); }, [surface]);
  const initialEditorOpened = useRef(false);
  useEffect(() => { if (!initialEditorOpened.current && defaultEditorId && compact && editor) { initialEditorOpened.current = true; open('editor'); } }, [defaultEditorId, compact, editor, open]);
  const close = () => surface.close();
  const edit = (agent: Agent) => { setEditor({ ...agent, avatar: { ...agent.avatar } }); if (compact) open('editor'); };
  const saveAgent = (agent: Agent) => {
    setEditor(agent);
    update(s => ({ ...s, agents: s.agents.some(a => a.id === agent.id) ? s.agents.map(a => a.id === agent.id ? agent : a) : [...s.agents, agent] }));
  };
  const createAgent = () => { const agent = { id: chatId('agent'), ...nextAgentIdentity(workspace.agents), label: 'Agent', description: '' }; update(s => ({ ...s, agents: [...s.agents, agent] })); edit(agent); };
  const chooseAgents = (ids: string[] = [], existingId: string | null = null) => { handoffGeneration.current++;setHandoff(null); setSelected(ids); setEditingChatId(existingId); open('picker'); };
  const startChat = async () => {
    if(starting.current)return;
    const ids = [...new Set(selected)].filter(id => workspace.agents.some(a => a.id === id)); if (!ids.length) return;
    if (editingChatId) { update(s => updateConversationAgents(s, editingChatId, ids)); close(); return; }
    const id = chatId('chat'); const next = conversationFor(workspace.agents, ids, id);
    starting.current=true;const generation=++handoffGeneration.current;
    const selectedAgents=ids.flatMap(id=>workspace.agents.find(a=>a.id===id)??[]);
    const [avatars,origin]=await Promise.all([ids.length>1&&!reduced?captureAvatars(selectedAgents,pickerAvatars.current):Promise.resolve([]),measureAvatar(root.current??undefined)]);
    starting.current=false;if(generation!==handoffGeneration.current)return;
    setFlightOrigin(origin);setHandoff(avatars.length?{chatId:id,kind:'group',avatars,arrived:[]}:null);setEditor(null);
    update(s => ({ ...s, chats: [next, ...s.chats], activeId: id })); follow.current = true; close();
  };
  const copy = async (text: string, message = 'Copied') => {
    try {
      if (onCopy) await onCopy(text);
      else if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) await navigator.clipboard.writeText(text);
      else await Share.share({ message: text });
      replies.setNotice(message);
    } catch { replies.setNotice('Couldn’t copy. Please try again.'); }
  };
  const transcript = (conversation: Conversation) => conversation.messages.map(m => `${m.role === 'user' ? 'You' : workspace.agents.find(a => a.id === m.agentId)?.name ?? 'Agent'}: ${m.text}`).join('\n\n');
  const selectChat = (id: string) => {
    handoffGeneration.current++;setHandoff(null);
    update(s => ({ ...s, activeId: id })); follow.current = !offsets.current[id];
    requestAnimationFrame(() => scroll.current?.scrollTo({ y: offsets.current[id] ?? 0, animated: false }));
    if (panel === 'navigation') close();
  };
  const removeChat = (id: string) => { replies.stop(id); update(s => removeConversation(s, id)); close(); };
  const sendMessage=async(text:string)=>{
    if(!chat||!text.trim()||replies.pending[chat.id]||sending.current)return;
    sending.current=true;const id=chat.id,generation=++handoffGeneration.current;
    const [avatars,origin]=await Promise.all([!chat.messages.length&&participants.length>1&&!reduced?captureAvatars(participants,emptyAvatars.current):Promise.resolve([]),measureAvatar(root.current??undefined)]);
    sending.current=false;if(generation!==handoffGeneration.current)return;
    setFlightOrigin(origin);setHandoff(avatars.length?{chatId:id,kind:'first',responderId:participants[0]?.id,avatars,arrived:[]}:null);
    setDrafts(s=>({...s,[id]:''}));follow.current=true;void replies.send(text,id);
  };
  const editPanel = editor && <AgentCreator agent={editor} onChange={saveAgent} voices={voices} onPreviewVoice={onPreviewVoice} onClose={() => { setEditor(null); if (panel === 'editor') close(); }} style={{ flex: 1 }} />;
  const sortedChats = useMemo(() => workspace.chats.filter(c => (c.customTitle || c.title).toLocaleLowerCase().includes(query.toLocaleLowerCase())).sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned)), [workspace.chats, query]);
  const sidebar = <StyledView className="flex-1 gap-3 rounded-3xl p-3" style={{ backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, minHeight: 300 }}>
    <StyledView className="flex-row items-center justify-between gap-2">
      <Text variant="headline-medium">Your agents</Text>
      <IconButton icon={RiAddLine} accessibilityLabel="Create agent" onPress={createAgent} />
    </StyledView>
    <StyledView className="flex-row items-center gap-2">
      <Button variant="secondary" size="small" onPress={() => chooseAgents()} leadingIcon={RiAddLine} style={{ flex: 1 }}>New chat</Button>
      <IconButton icon={RiSearchLine} accessibilityLabel="Search chats" onPress={() => setSearchOpen(s => !s)} />
    </StyledView>
    {searchOpen && <TextFieldInput label="Search chats" value={query} onChangeText={setQuery} placeholder="Search chats" />}
    <ScrollView style={{ flex: 1 }}>
      <StyledView className="gap-1">
        {sortedChats.map(c => {
          const agents = c.agentIds.flatMap(id => workspace.agents.find(a => a.id === id) ?? []);
          const active = c.id === workspace.activeId;
          return <StyledView key={c.id} className="flex-row items-center gap-1 rounded-xl" style={{ backgroundColor: active ? colors.backgroundTertiary : 'transparent' }}>
            <StyledPressable accessibilityRole="button" accessibilityLabel={c.customTitle || c.title} onPress={() => selectChat(c.id)} className="min-w-0 flex-1 flex-row items-center gap-2 px-2 py-2.5">
              <AgentStack agents={agents} size={28} />
              <Text numberOfLines={1} variant="body-medium" style={{ flex: 1, color: active ? colors.text : colors.textSecondary }}>{c.pinned ? '✦ ' : ''}{c.customTitle || c.title}</Text>
            </StyledPressable>
            <IconButton icon={RiMoreFill} accessibilityLabel={`Options for ${c.customTitle || c.title}`} size="small" onPress={() => { setTargetChatId(c.id); open('options'); }} />
          </StyledView>;
        })}
        {!sortedChats.length && <Text variant="body-regular">No conversations</Text>}
      </StyledView>
    </ScrollView>
    <Button variant="ghost" leadingIcon={RiShoppingBag3Line} onPress={() => { setQuery(''); setMarketItem(null); open('marketplace'); }}>Marketplace</Button>
    <Button variant="ghost" leadingIcon={RiSettings3Line} onPress={() => open('settings')}>Settings</Button>
  </StyledView>;
  const title = panel === 'picker' ? editingChatId ? 'Edit group' : 'Chat with your agents' : panel === 'rename' ? 'Rename chat' : panel === 'marketplace' ? marketItem?.name ?? 'Marketplace' : panel === 'editor' ? 'Edit agent' : panel === 'settings' ? 'Settings' : panel === 'navigation' ? 'Conversations' : 'Conversation options';
  const messageActions = (id: string, text: string) => <StyledView className="mt-1 flex-row items-center gap-1">
    {(['up', 'down'] as const).map(value => <StyledPressable key={value} accessibilityRole="button" accessibilityLabel={value === 'up' ? 'Helpful response' : 'Unhelpful response'} accessibilityState={{ selected: feedback[id] === value }} aria-pressed={feedback[id] === value} onPress={() => setFeedback(s => ({ ...s, [id]: value }))} className="h-[22px] w-[22px] items-center justify-center rounded-md" style={{ backgroundColor: colors.backgroundTertiary }}>
      {value === 'up' ? <RiThumbUpLine width={12} height={12} fill={feedback[id] === value ? colors.primary : colors.textTertiary} /> : <RiThumbDownLine width={12} height={12} fill={feedback[id] === value ? colors.primary : colors.textTertiary} />}
    </StyledPressable>)}
    <IconButton icon={RiFileCopyLine} accessibilityLabel="Copy response" size="small" onPress={() => { void copy(text, 'Response copied'); }} />
  </StyledView>;
  return localize(<StyledView ref={root} collapsable={false} className={className} style={[{ flex: 1, flexDirection: 'row', gap: 16, padding: 12, minHeight: 480, direction, backgroundColor: colors.background }, style]} testID={testID}>
    {!phone && <StyledView style={{ width: 260 }}>{sidebar}</StyledView>}
    <StyledView className="min-w-0 flex-1 overflow-hidden rounded-3xl" style={{ backgroundColor: colors.backgroundSecondary, borderWidth: 1, borderColor: colors.border }}>
      <StyledView className="flex-row items-center gap-2 p-3">
        {phone && <IconButton icon={RiMenuLine} accessibilityLabel="Open conversations" onPress={() => open('navigation')} />}
        <AgentStack agents={participants} size={32} nodes={headerAvatars.current} />
        <Text variant="headline-medium" numberOfLines={1} style={{ flex: 1 }}>{chat?.customTitle || chat?.title || 'New chat'}</Text>
        {chat && <><IconButton icon={RiEditLine} accessibilityLabel="Edit agent" onPress={() => participants[0] && edit(participants[0])} /><IconButton icon={RiMoreFill} accessibilityLabel="Conversation options" onPress={() => { setTargetChatId(chat.id); open('options'); }} /></>}
      </StyledView>
      <ScrollView ref={scroll} style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, paddingBottom: 16 }} scrollEventThrottle={16}
        onScroll={event => { const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent; follow.current = contentSize.height - contentOffset.y - layoutMeasurement.height < 100; if (chat) offsets.current[chat.id] = contentOffset.y; }}
        onContentSizeChange={() => { if (follow.current) scroll.current?.scrollToEnd({ animated: false }); }}>
        {!chat || !chat.messages.length ? <StyledView className="flex-1 items-center justify-center gap-4 px-4 py-8">
          <SelectedAgentPreview agents={participants} nodes={emptyAvatars.current} hidden={handoff?.kind==='group'&&handoff.chatId===chat?.id?handoff.avatars.filter(a=>!handoff.arrived.includes(a.agent.id)).map(a=>a.agent.id):[]} />
          <Text variant="title-3-semibold" style={{ textAlign: 'center' }}>{participants.length > 1 ? 'A few minds. One conversation.' : participants[0] ? `Say hello to ${participants[0].name}` : 'Chat with your agents'}</Text>
          <Text variant="body-regular" style={{ maxWidth: 420, textAlign: 'center', color: colors.textSecondary }}>{participants.length > 1 ? `${participants.map(a => a.name).join(', ')} are here. Send a message to get everyone’s perspective.` : participants[0]?.description ?? 'Choose an agent or create your own to start a conversation.'}</Text>
          {!chat && <Button onPress={() => chooseAgents()}>Start chat</Button>}
        </StyledView> : <StyledView className="gap-3 px-3 pt-2">
          <StyledView className="items-center"><Text variant="body-2-medium" style={{ color: colors.textSecondary }}>Today</Text></StyledView>
          {chat.messages.map(message => {
            const agent = workspace.agents.find(a => a.id === message.agentId); const text = formatDemoReply(message.text);
            if (message.role === 'user') return <StyledView key={message.id} className="self-end rounded-[20px] p-3" style={{ maxWidth: 520, backgroundColor: colors.card }}><Text variant="body-regular">{message.text}</Text></StyledView>;
            return <ReplyRow key={message.id} actions={replies.streaming[chat.id] !== message.id && messageActions(message.id,text)}>
              {!!text && <StyledView className="rounded-[20px] p-3" style={{ backgroundColor: colors.backgroundTertiary }}><ReplyText text={text} /></StyledView>}
              <StyledView className="flex-row items-center justify-between gap-2 px-3">
                {agent && <ReplyHeader agent={agent} thinking={false} onEdit={()=>edit(agent)} />}
              </StyledView>
            </ReplyRow>;
          })}
        </StyledView>}
        {chat && replies.thinking[chat.id] && (()=>{const agent=workspace.agents.find(a=>a.id===replies.thinking[chat.id]);return agent&&<StyledView className="px-6 py-3"><ReplyHeader agent={agent} thinking workingKey={replies.pending[chat.id]} nodes={replyAvatars.current} arriving={handoff?.kind==='first'&&handoff.chatId===chat.id&&handoff.responderId===agent.id&&!handoff.arrived.includes(agent.id)} onEdit={()=>edit(agent)} /></StyledView>;})()}
      </ScrollView>
      {!!replies.notice && <Text variant="caption-1-regular" accessibilityRole="alert" style={{ color: colors.textSecondary, padding: 8 }}>{replies.notice}</Text>}
      {chat && <StyledView className="p-1">
        <ComposerPanel value={drafts[chat.id] ?? ''} onValueChange={value => setDrafts(s => ({ ...s, [chat.id]: value }))} onSubmit={text=>{void sendMessage(text);}} disabled={!!replies.pending[chat.id]} status={null} defaultPermission="bypass" style={{ borderRadius: 20 }} />
        {!!replies.pending[chat.id] && <Button variant="ghost" size="small" onPress={() => replies.stop(chat.id)}>Stop response</Button>}
      </StyledView>}
    </StyledView>
    <EditorRail active={!!editor&&!compact}>{editPanel}</EditorRail>
    <Dialog control={surface} title={title} maxWidth={panel === 'picker' ? 600 : panel === 'marketplace' ? 900 : 480} placement={panel === 'editor' ? 'right' : 'center'} width={356} onClose={() => { setPanel(null); if (compact) setEditor(null); }}
      actions={panel === 'picker' ? [{ label: editingChatId ? 'Save changes' : `Start chat${selected.length ? ` · ${selected.length} agents` : ''}`, onPress: ()=>{void startChat();}, disabled: !selected.length }] : panel === 'rename' ? [{ label: 'Save name', disabled: !rename.trim(), onPress: () => { update(s => ({ ...s, chats: s.chats.map(c => c.id === targetChat?.id ? { ...c, customTitle: rename.trim() } : c) })); close(); } }] : undefined}>
      {panel === 'navigation' && sidebar}
      {panel === 'editor' && editPanel}
      {panel === 'rename' && <TextFieldInput label="Chat name" value={rename} onChangeText={setRename} maxLength={100} />}
      {panel === 'picker' && <StyledView className="gap-5">
        <SelectedAgentPreview caption agents={selected.flatMap(id => workspace.agents.find(a => a.id === id) ?? [])} nodes={pickerAvatars.current} hidden={handoff?.kind==='group'?handoff.avatars.map(a=>a.agent.id):[]} />
        <StyledView className="flex-row flex-wrap justify-center gap-2">
          {workspace.agents.map(agent => { const picked = selected.includes(agent.id); return <StyledPressable key={agent.id} accessibilityRole="button" accessibilityLabel={agent.name} accessibilityState={{ selected: picked }} aria-pressed={picked} onPress={() => setSelected(ids => picked ? ids.filter(id => id !== agent.id) : [...ids, agent.id])} className="h-10 flex-row items-center gap-2 rounded-full border px-2" style={{ borderColor: picked ? colors.textSecondary : 'transparent', backgroundColor: picked ? colors.backgroundTertiary : colors.backgroundSecondary }}><AgentAvatar config={agent.avatar} size={24} label={agent.name} /><Text variant="body-medium">{agent.name}</Text></StyledPressable>; })}
        </StyledView>
      </StyledView>}
      {panel === 'options' && targetChat && <StyledView className="gap-2">
        <Button variant="ghost" onPress={() => { update(s => ({ ...s, chats: s.chats.map(c => c.id === targetChat.id ? { ...c, pinned: !c.pinned } : c) })); close(); }}>{targetChat.pinned ? 'Unpin chat' : 'Pin chat'}</Button>
        <Button variant="ghost" onPress={() => { setRename(targetChat.customTitle || targetChat.title); setPanel('rename'); }}>Rename chat</Button>
        <Button variant="ghost" leadingIcon={RiGroupLine} onPress={() => chooseAgents(targetChat.agentIds, targetChat.id)}>Edit group</Button>
        {targetChat.agentIds.map(id => { const agent = workspace.agents.find(a => a.id === id); return agent && <Button key={id} variant="ghost" onPress={() => { if (!compact) close(); edit(agent); }}>Edit {agent.name}</Button>; })}
        <Button variant="ghost" onPress={() => { void copy(transcript(targetChat), 'Conversation copied'); }}>Copy conversation</Button>
        <Button variant="ghost" onPress={() => { void copy(targetChat.id, 'Conversation ID copied'); }}>Copy conversation ID</Button>
        <Button variant="ghost" onPress={() => removeChat(targetChat.id)}>Remove chat</Button>
      </StyledView>}
      {panel === 'settings' && <StyledView className="gap-3"><Text variant="body-regular">Your workspace has {workspace.agents.length} agents and {workspace.chats.length} conversations.</Text><Button onPress={() => { setPanel('marketplace'); setQuery(''); }}>Manage plugins and agents</Button><Button variant="secondary" onPress={() => { void copy(JSON.stringify(workspace), 'Workspace copied'); }}>Export workspace</Button></StyledView>}
      {panel === 'marketplace' && <StyledView className="gap-3">
        {marketItem ? <><Button variant="ghost" onPress={() => setMarketItem(null)}>Back to marketplace</Button><Text variant="title-3-semibold">{marketItem.name}</Text><Text variant="body-regular">{marketItem.detail}</Text><Text variant="caption-1-regular">By {marketItem.developer}</Text>{marketItem.skills.map(skill => <StyledView key={skill.name} className="gap-1"><Text variant="body-medium">{skill.name}</Text><Text variant="body-regular">{skill.description}</Text></StyledView>)}<Button onPress={() => { if (marketItem.kind === 'bot') update(s => addMarketplaceBot(s, marketItem)); else update(s => { const installed = s.installedPlugins ?? DEFAULT_PLUGINS; return { ...s, installedPlugins: installed.includes(marketItem.id) ? installed.filter(id => id !== marketItem.id) : [...installed, marketItem.id] }; }); }}>{marketItem.kind === 'bot' ? workspace.agents.some(a => a.id === marketplaceAgentId(marketItem.id)) ? 'Added' : 'Add agent' : (workspace.installedPlugins ?? DEFAULT_PLUGINS).includes(marketItem.id) ? 'Disconnect' : 'Connect'}</Button></> : <>
          <TextFieldInput label="Search marketplace" value={query} onChangeText={setQuery} />
          <StyledView className="flex-row gap-2">{(['all', 'plugin', 'bot'] as const).map(kind => <Button key={kind} variant={marketKind === kind ? 'primary' : 'ghost'} size="small" onPress={() => setMarketKind(kind)}>{kind === 'all' ? 'All' : kind === 'plugin' ? 'Plugins' : 'Agents'}</Button>)}</StyledView>
          <StyledView className="flex-row flex-wrap gap-3">{filterMarketplace(query, marketKind).map(item => <StyledPressable key={item.id} accessibilityRole="button" accessibilityLabel={item.name} onPress={() => setMarketItem(item)} className="gap-2 rounded-3xl border p-4" style={{ width: 240, borderColor: colors.border, backgroundColor: colors.card }}>{item.avatar && <AgentAvatar config={item.avatar} size={48} label={item.name} />}<Text variant="body-medium">{item.name}</Text><Text variant="body-regular" style={{ color: colors.textSecondary }}>{item.description}</Text></StyledPressable>)}</StyledView>
        </>}
      </StyledView>}
    </Dialog>
    {handoff&&handoff.chatId===chat?.id&&<AvatarHandoff handoff={handoff} origin={flightOrigin} resolveTarget={resolveFlightTarget} onArrive={arriveAvatar} onFinish={finishHandoff} />}
  </StyledView>);
}
