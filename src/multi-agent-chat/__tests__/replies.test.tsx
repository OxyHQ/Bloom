import { act, renderHook } from '@testing-library/react-native';
import { FOLD_CONFIG } from '../../agent-avatar/model';
import type { Workspace } from '../data';
import { useReplies } from '../use-replies';

function fixture() {
  const current = {
    current: {
      agents: ['a', 'b'].map((id) => ({
        id,
        name: id,
        label: id,
        description: '',
        avatar: { ...FOLD_CONFIG },
      })),
      chats: [
        { id: 'group', title: 'Group', agentIds: ['a', 'b'], messages: [] },
        { id: 'other', title: 'Other', agentIds: ['b'], messages: [] },
      ],
      activeId: 'group',
    } as Workspace,
  };
  const update = (change: (value: Workspace) => Workspace) => {
    current.current = change(current.current);
  };
  return { current, update };
}
describe('multi-agent reply lifecycle', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());
  it('runs participants sequentially and keeps responses in their originating conversation', async () => {
    const { current, update } = fixture();
    const onRespond = jest.fn(async (agent) => `Response ${agent.name}`);
    const { result } = renderHook(() => useReplies(current, update, onRespond));
    let task!: Promise<void>;
    act(() => {
      task = result.current.send('Question', 'group');
    });
    current.current = { ...current.current, activeId: 'other' };
    await act(async () => {
      await jest.runAllTimersAsync();
      await task;
    });
    expect(onRespond.mock.calls.map((args) => args[0].id)).toEqual(['a', 'b']);
    expect(current.current.chats[0]!.messages.map((m) => m.text)).toEqual([
      'Question',
      'Response a',
      'Response b',
    ]);
    expect(current.current.chats[1]!.messages).toEqual([]);
    expect(result.current.pending).toEqual({});
  });
  it('creates a new conversation when the last stored chat was removed', async () => {
    const { current, update } = fixture();
    current.current.chats = [];
    const onRespond = jest.fn(async () => 'Ready');
    const { result } = renderHook(() => useReplies(current, update, onRespond));
    let task!: Promise<void>;
    act(() => {
      task = result.current.send('Hello', 'draft-chat', 0, {
        id: 'draft-chat',
        title: '',
        agentIds: ['a'],
        messages: [],
      });
    });
    expect(current.current.activeId).toBe('draft-chat');
    expect(current.current.chats).toHaveLength(1);
    await act(async () => {
      await jest.runAllTimersAsync();
      await task;
    });
    expect(
      current.current.chats[0]!.messages.map((message) => message.text),
    ).toEqual(['Hello', 'Ready']);
    expect(onRespond).toHaveBeenCalledTimes(1);
  });
  it('aborts the host signal and ignores late responses, then accepts a new turn', async () => {
    const { current, update } = fixture();
    let resolve!: (value: string) => void;
    let signal!: AbortSignal;
    const onRespond = jest.fn((_agent, _messages, nextSignal) => {
      signal = nextSignal;
      return new Promise<string>((r) => {
        resolve = r;
      });
    });
    const { result } = renderHook(() => useReplies(current, update, onRespond));
    let task!: Promise<void>;
    act(() => {
      task = result.current.send('First', 'group');
    });
    act(() => result.current.stop('group'));
    expect(signal.aborted).toBe(true);
    await act(async () => {
      resolve('Late');
      await jest.runAllTimersAsync();
      await task;
    });
    expect(current.current.chats[0]!.messages.map((m) => m.text)).toEqual([
      'First',
    ]);
    act(() => {
      task = result.current.send('Second', 'group');
    });
    expect(onRespond).toHaveBeenCalledTimes(2);
    act(() => result.current.stop('group'));
    await act(async () => {
      resolve('Late again');
      await task;
    });
  });
  it('rejects duplicate sends during a turn and aborts on unmount', async () => {
    const { current, update } = fixture();
    let resolve!: (value: string) => void;
    let signal!: AbortSignal;
    const onRespond = jest.fn((_agent, _messages, s) => {
      signal = s;
      return new Promise<string>((r) => {
        resolve = r;
      });
    });
    const { result, unmount } = renderHook(() =>
      useReplies(current, update, onRespond),
    );
    let task!: Promise<void>;
    act(() => {
      task = result.current.send('Question', 'group');
      void result.current.send('Duplicate', 'group');
    });
    expect(onRespond).toHaveBeenCalledTimes(1);
    unmount();
    expect(signal.aborted).toBe(true);
    resolve('Late');
    await task;
    expect(current.current.chats[0]!.messages).toHaveLength(1);
  });
});
