import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Collapsible } from '../collapsible';
import { space } from '../styles/tokens';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';

const RULE_WIDTH = 2;

/**
 * The model's reasoning, folded under whatever heads it: indented behind a rule, muted, and opened
 * and closed by `open`. A string is set as secondary text; anything else is yours to style. The
 * one body of every thinking row: `AgentThinking`'s disclosure and the thinking agent of
 * `AgentReplyIdentity` both use it.
 */
export function ThinkingReasoning({
  open,
  children,
  testID,
}: {
  open: boolean;
  children: ReactNode;
  testID?: string;
}) {
  const theme = useTheme();
  return (
    <Collapsible open={open} testID={testID}>
      <View
        style={{
          marginStart: space.md,
          paddingStart: space.md,
          paddingVertical: space.xs,
          borderStartColor: theme.colors.border,
          borderStartWidth: RULE_WIDTH,
        }}
      >
        {typeof children === 'string' ? (
          <Text variant="body-2-regular" style={{ color: theme.colors.textSecondary }}>
            {children}
          </Text>
        ) : (
          children
        )}
      </View>
    </Collapsible>
  );
}
