import { useCallback, useRef, useState } from 'react';
import { resolveAvatarCharacter, type AvatarCharacter } from '../agent-avatar/character';
import type { AgentCreatorAgent } from './types';
const key = (value: AvatarCharacter) => JSON.stringify(resolveAvatarCharacter(value));
const snapshot = (value: AvatarCharacter): AvatarCharacter => Object.freeze({ ...value });
const LIMIT = 50;
const createHistory = (agent: AgentCreatorAgent) => ({
  id: agent.id,
  propKey: key(agent.avatar),
  current: snapshot(agent.avatar),
  original: snapshot(agent.avatar),
  past: [] as AvatarCharacter[],
  future: [] as AvatarCharacter[],
  pending: new Set<string>(),
  transaction: undefined as AvatarCharacter | undefined,
});

/** Character-only history. Parent echoes acknowledge edits; unrelated profile data never enters history. */
export function useCharacterHistory(
  agent: AgentCreatorAgent,
  onChange: (agent: AgentCreatorAgent) => void,
) {
  const latest = useRef({ agent, onChange });
  latest.current = { agent, onChange };
  const [, render] = useState(0);
  const state = useRef<ReturnType<typeof createHistory> | null>(null);
  state.current ??= createHistory(agent);
  const incoming = key(agent.avatar),
    s = state.current;
  if (s.id !== agent.id || s.propKey !== incoming) {
    if (s.id !== agent.id || !s.pending.has(incoming)) {
      s.id = agent.id;
      s.current = snapshot(agent.avatar);
      s.original = snapshot(agent.avatar);
      s.past = [];
      s.future = [];
      s.pending.clear();
      s.transaction = undefined;
    } else s.pending.delete(incoming);
    s.propKey = incoming;
  }
  const emit = useCallback((value: AvatarCharacter) => {
    const s = state.current!;
    s.current = snapshot(value);
    s.pending.add(key(value));
    // Only unacknowledged own writes are retained, with a fixed bound during deferred parent updates.
    if (s.pending.size > 128) s.pending.delete(s.pending.values().next().value!);
    render((v) => v + 1);
    latest.current.onChange({ ...latest.current.agent, avatar: s.current });
  }, []);
  const end = useCallback(() => {
    const s = state.current!,
      start = s.transaction;
    s.transaction = undefined;
    if (!start || key(start) === key(s.current)) return;
    s.past = [...s.past, start].slice(-LIMIT);
    render((v) => v + 1);
  }, []);
  const change = useCallback(
    (value: AvatarCharacter) => {
      const s = state.current!;
      if (key(value) === key(s.current)) return;
      if (!s.transaction) s.past = [...s.past, s.current].slice(-LIMIT);
      s.future = [];
      emit(value);
    },
    [emit],
  );
  const undo = useCallback(() => {
    end();
    const s = state.current!,
      next = s.past.pop();
    if (!next) return;
    s.future = [...s.future, s.current].slice(-LIMIT);
    emit(next);
  }, [emit, end]);
  const redo = useCallback(() => {
    end();
    const s = state.current!,
      next = s.future.pop();
    if (!next) return;
    s.past = [...s.past, s.current].slice(-LIMIT);
    emit(next);
  }, [emit, end]);
  return {
    character: s.current,
    canUndo: s.past.length > 0,
    canRedo: s.future.length > 0,
    canRestore: key(s.current) !== key(s.original),
    change,
    undo,
    redo,
    end,
    begin: useCallback(() => {
      state.current!.transaction ??= state.current!.current;
    }, []),
    restore: useCallback(() => {
      end();
      change(state.current!.original);
    }, [change, end]),
  };
}
