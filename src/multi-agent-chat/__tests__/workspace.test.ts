import {
  INITIAL_WORKSPACE,
  conversationFor,
  nextAgentIdentity,
  removeConversation,
  restoreWorkspace,
  updateConversationAgents,
} from '../data';
import { MARKETPLACE_ITEMS, addMarketplaceBot, filterMarketplace } from '../marketplace-data';
import { streamReply, waitForReply } from '../stream-reply';

describe('multi-agent workspace', () => {
  it('deduplicates membership and ignores unavailable agents', () => {
    const agent = INITIAL_WORKSPACE.agents[0]!;
    const chat = conversationFor(
      INITIAL_WORKSPACE.agents,
      [agent.id, agent.id, 'missing'],
      'group',
    );
    expect(chat.agentIds).toEqual([agent.id]);
    expect(chat.messages).toEqual([]);
  });
  it('changes membership while preserving historical replies and conversation identity', () => {
    const first = INITIAL_WORKSPACE.chats[0]!;
    const next = updateConversationAgents(INITIAL_WORKSPACE, first.id, [
      INITIAL_WORKSPACE.agents[1]!.id,
    ]);
    expect(next.chats[0]!.messages).toEqual(first.messages);
    expect(next.chats[0]!.id).toBe(first.id);
    expect(next.chats[0]!.agentIds).toEqual([INITIAL_WORKSPACE.agents[1]!.id]);
    expect(updateConversationAgents(next, first.id, ['missing'])).toBe(next);
  });
  it('removes the active chat without losing other chats', () => {
    const next = removeConversation(INITIAL_WORKSPACE, INITIAL_WORKSPACE.activeId);
    expect(next.chats.some((c) => c.id === INITIAL_WORKSPACE.activeId)).toBe(false);
    expect(next.activeId).toBe(next.chats[0]!.id);
  });
  it('restores user edits and rejects malformed and duplicate saved records', () => {
    const source = {
      ...INITIAL_WORKSPACE,
      chats: INITIAL_WORKSPACE.chats.map((c) => ({
        ...c,
        customTitle: 'My edited chat',
      })),
    };
    expect(restoreWorkspace(JSON.stringify(source))?.chats[0]?.customTitle).toBe('My edited chat');
    expect(restoreWorkspace('{bad')).toBeNull();
    expect(
      restoreWorkspace(
        JSON.stringify({
          ...source,
          agents: [source.agents[0], source.agents[0]],
        }),
      ),
    ).toBeNull();
  });
  it('creates unused identities and installs marketplace bots once', () => {
    const identity = nextAgentIdentity(INITIAL_WORKSPACE.agents);
    expect(INITIAL_WORKSPACE.agents.some((a) => a.name === identity.name)).toBe(false);
    const bot = MARKETPLACE_ITEMS.find((item) => item.kind === 'bot')!;
    const next = addMarketplaceBot(INITIAL_WORKSPACE, bot);
    expect(next.agents).toHaveLength(INITIAL_WORKSPACE.agents.length + 1);
    expect(addMarketplaceBot(next, bot)).toBe(next);
    expect(filterMarketplace('research', 'bot').every((item) => item.kind === 'bot')).toBe(true);
  });
});
describe('abortable word streaming', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());
  it('preserves the exact whitespace and paragraph breaks', async () => {
    const text = 'One  two.\n\nThree four five. ';
    const chunks: string[] = [];
    const task = streamReply(text, new AbortController().signal, (chunk) => chunks.push(chunk));
    await jest.runAllTimersAsync();
    await task;
    expect(chunks[chunks.length - 1]).toBe(text);
    expect(chunks.length).toBeGreaterThan(1);
  });
  it('cancels pending pacing and never emits a late chunk', async () => {
    const controller = new AbortController();
    const chunks: string[] = [];
    const task = streamReply('One two three four five six', controller.signal, (chunk) =>
      chunks.push(chunk),
    ).catch(() => {});
    controller.abort();
    await task;
    await jest.runAllTimersAsync();
    expect(chunks).toEqual(['One two ']);
    expect(jest.getTimerCount()).toBe(0);
  });
  it('rejects an already aborted delay without installing timers', async () => {
    const controller = new AbortController();
    controller.abort('cancelled');
    await expect(waitForReply(500, controller.signal)).rejects.toBe('cancelled');
    expect(jest.getTimerCount()).toBe(0);
  });
});
