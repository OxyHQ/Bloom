import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { AGENT_CREATOR_CARD } from './shared';

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
    <View style={styles.section}>
      <Text variant="body-2-medium" style={[styles.title, { color: colors.textSecondary }]}>
        {title}
      </Text>
      <View style={[AGENT_CREATOR_CARD, { backgroundColor: colors.backgroundSecondary }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 15, gap: 8 },
  title: { paddingInline: 12 },
});
