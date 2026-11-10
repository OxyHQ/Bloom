import type { ReactNode } from 'react';
import { StyledView } from '../styles/styled-primitives';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';

export interface AgentCreatorSectionProps {
  /** The section's name, above its card. */
  title: string;
  /** Rows of the card: compose them with `AgentCreatorField`, or hand in a row of your own. */
  children: ReactNode;
}

/**
 * A titled card of the host's own, below the editor's details card: what an agent HAS beyond who
 * it is (how it works, what it remembers). Same surface, radius and row geometry as the details
 * card, so a host's sections and the built-in rows read as one editor. Handed to `AgentCreator`
 * as `sections`.
 */
export function AgentCreatorSection({ title, children }: AgentCreatorSectionProps) {
  const { colors } = useTheme();
  return (
    <StyledView className="mt-[15px] gap-2">
      <Text variant="body-2-medium" className="px-3" style={{ color: colors.textSecondary }}>
        {title}
      </Text>
      <StyledView
        className="overflow-hidden rounded-2xl bg-background-secondary-default ps-3"
        style={{ backgroundColor: colors.backgroundSecondary }}
      >
        {children}
      </StyledView>
    </StyledView>
  );
}
