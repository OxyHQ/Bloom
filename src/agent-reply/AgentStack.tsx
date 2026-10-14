import { AgentAvatar } from '../agent-avatar';
import { StyledView } from '../styles/styled-primitives';
import type { AgentStackProps } from './types';

/** Up to three agents' avatars overlapped in one square, or the one agent's alone. */
export function AgentStack({ agents, size = 40 }: AgentStackProps) {
  if (agents.length === 1)
    return <AgentAvatar character={agents[0]!.avatar} size={size} label={agents[0]!.name} />;
  return (
    <StyledView
      className="relative shrink-0"
      style={{ width: size, height: size }}
      accessibilityLabel={agents.map((agent) => agent.name).join(', ')}
    >
      {agents.slice(0, 3).map((agent, i) => (
        <StyledView
          key={agent.id}
          className="absolute"
          style={{
            left: i === 1 ? size * 0.4 : i === 2 ? size * 0.2 : 0,
            top: i === 2 ? size * 0.4 : 0,
          }}
        >
          <AgentAvatar character={agent.avatar} size={size * 0.65} label={agent.name} />
        </StyledView>
      ))}
    </StyledView>
  );
}
