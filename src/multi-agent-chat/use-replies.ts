import type { RefObject } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { WORKING_SECONDS } from '../agent-avatar/working';
import { useMessages } from '../locale/messages';
import { demoReply, type Conversation, type Message, type Workspace } from './data';
import { MULTI_AGENT_CHAT_MESSAGES, formatChatMessage } from './messages';
import { streamReply, waitForReply } from './stream-reply';
import type { MultiAgentChatProps } from './types';

let sequence = 0;
export function chatId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${(++sequence).toString(36)}`;
}
export function useReplies(
  current: RefObject<Workspace>,
  update: (change: (w: Workspace) => Workspace) => void,
  onRespond: MultiAgentChatProps['onRespond'],
) {
  const { messages } = useMessages(MULTI_AGENT_CHAT_MESSAGES);
  const jobs = useRef(new Map<string, AbortController>());
  const [pending, setPending] = useState<Record<string, string>>({});
  const [thinking, setThinking] = useState<Record<string, Message>>({});
  const [streaming, setStreaming] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState('');
  const stop = useCallback((id: string) => {
    jobs.current.get(id)?.abort();
    jobs.current.delete(id);
    setPending((s) => {
      const next = { ...s };
      delete next[id];
      return next;
    });
    setThinking((s) => {
      const next = { ...s };
      delete next[id];
      return next;
    });
    setStreaming((s) => {
      const next = { ...s };
      delete next[id];
      return next;
    });
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 3500);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(
    () => () => {
      jobs.current.forEach((job) => job.abort());
      jobs.current.clear();
    },
    [],
  );
  const send = useCallback(
    async (text: string, id: string, arrivalMs = 0, draft?: Conversation) => {
      const chat = current.current.chats.find((c) => c.id === id) ?? draft;
      if (!chat || !text.trim() || jobs.current.has(id)) return;
      const participants = chat.agentIds.flatMap(
        (agentId) => current.current.agents.find((agent) => agent.id === agentId) ?? [],
      );
      if (!participants.length) return;
      const history: Message[] = [
        ...chat.messages,
        { id: chatId('message'), role: 'user', text: text.trim() },
      ];
      update((s) => ({
        ...s,
        activeId: id,
        chats: s.chats.some((c) => c.id === id)
          ? s.chats.map((c) => (c.id === id ? { ...c, messages: history } : c))
          : [
              {
                ...chat,
                title: participants.map((a) => a.name).join(' + '),
                messages: history,
              },
              ...s.chats,
            ],
      }));
      const controller = new AbortController();
      jobs.current.set(id, controller);
      setPending((s) => ({
        ...s,
        [id]: controller.signal.aborted ? '' : chatId('turn'),
      }));
      setNotice('');
      const active = () => !controller.signal.aborted && jobs.current.get(id) === controller;
      try {
        for (const agent of participants) {
          if (!active()) break;
          const reply: Message = {
            id: chatId('reply'),
            role: 'agent',
            agentId: agent.id,
            text: '',
          };
          setThinking((s) => ({ ...s, [id]: reply }));
          try {
            const [response] = await Promise.all([
              onRespond
                ? onRespond(agent, history, controller.signal)
                : Promise.resolve(
                    demoReply(agent, history.filter((m) => m.role === 'user').length - 1),
                  ),
              waitForReply(
                WORKING_SECONDS * 2000 + 350 + (agent.id === participants[0]?.id ? arrivalMs : 0),
                controller.signal,
              ),
            ]);
            if (!active()) break;
            update((s) => ({
              ...s,
              chats: s.chats.map((c) =>
                c.id === id ? { ...c, messages: [...c.messages, reply] } : c,
              ),
            }));
            setThinking((s) => {
              const next = { ...s };
              delete next[id];
              return next;
            });
            setStreaming((s) => ({ ...s, [id]: reply.id }));
            await waitForReply(180, controller.signal);
            await streamReply(response, controller.signal, (visible) => {
              if (!active()) return;
              update((s) => ({
                ...s,
                chats: s.chats.map((c) =>
                  c.id === id
                    ? {
                        ...c,
                        messages: c.messages.map((m) =>
                          m.id === reply.id ? { ...m, text: visible } : m,
                        ),
                      }
                    : c,
                ),
              }));
            });
          } catch {
            if (active()) setNotice(formatChatMessage(messages.responseFailed, agent.name));
          }
        }
      } finally {
        if (jobs.current.get(id) === controller) stop(id);
      }
    },
    [current, update, onRespond, stop, messages],
  );
  return { pending, thinking, streaming, notice, setNotice, send, stop };
}
