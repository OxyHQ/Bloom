import { AgentChat } from '@oxy.so/bloom/agent-chat';

/** Domain transport remains outside Bloom; submitted/streaming drives the loader. */
export function Conversation({
  busy,
  onSubmit,
  onStop,
}: {
  busy: boolean;
  onSubmit: (text: string) => void;
  onStop: () => void;
}) {
  return (
    <AgentChat
      messages={[]}
      status={busy ? 'streaming' : 'ready'}
      onSubmit={onSubmit}
      onStop={onStop}
    />
  );
}
