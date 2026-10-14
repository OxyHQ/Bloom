import { StyledView } from '../styles/styled-primitives';
import type { AgentReplyBubbleProps } from './types';

/** The side padding, in px, that the top and bottom are made to look like. */
const INSET = 12;
/** Bloom's body text: what a reply is set in unless the caller says otherwise. */
const BODY = { fontSize: 14, lineHeight: 20 } as const;

/**
 * The tinted surface an agent's reply is set on. Its padding is equal on every side as the eye
 * reads it, not as the box is cut: a line of text carries leading above and below its glyphs, so
 * the top and bottom padding is the side padding less half of that leading. Say what the text is
 * set in with `text` when it is not Bloom's body (14 on 20).
 */
export function AgentReplyBubble({
  children,
  style,
  className,
  text = BODY,
}: AgentReplyBubbleProps) {
  const vertical = Math.max(0, INSET - (text.lineHeight - text.fontSize) / 2);
  return (
    <StyledView
      className={`rounded-[var(--radius-2-5xl)] bg-background-tertiary-default px-3 ${className ?? ''}`}
      style={[{ paddingVertical: vertical }, style]}
    >
      {children}
    </StyledView>
  );
}
