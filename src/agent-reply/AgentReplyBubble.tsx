import { StyledView } from '../styles/styled-primitives';
import type { AgentReplyBubbleProps } from './types';

/** The tinted surface an agent's reply is set on. */
export function AgentReplyBubble({ children, style, className }: AgentReplyBubbleProps) {
  return (
    <StyledView
      className={`rounded-[var(--radius-2-5xl)] bg-background-tertiary-default p-3 ${className ?? ''}`}
      style={style}
    >
      {children}
    </StyledView>
  );
}
