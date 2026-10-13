import React, { memo, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { PendingStepIcon, resolvePalette } from '../agent-progress/AgentProgress';
import { Badge } from '../badge';
import { Button } from '../button';
import { Card } from '../card';
import { useAccessibilityFocus } from '../hooks/use-accessibility-focus';
import { useMessages } from '../locale/messages';
import { IS_WEB } from '../styles/platform';
import { space } from '../styles/tokens';
import { StyledView } from '../styles/styled-primitives';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { AGENT_PLAN_MESSAGES } from './messages';
import type { AgentPlanProps } from './types';

/**
 * A plan the agent proposes and the user approves or rejects.
 *
 *   card      a `Card`: title, the steps (the pending glyph `AgentProgress`
 *             draws, then the step), and one footer
 *   footer    `Approve` (solid accent) and `Reject` (outline neutral) while
 *             the decision is `pending`; afterwards a status badge reading
 *             "Approved" or "Rejected", so the outcome is text, not colour
 *
 * A rejected plan strikes its steps through. After a press the deciding
 * button unmounts, so focus moves to the status: the browser's focus on web,
 * the screen reader's cursor on native.
 */

function AgentPlanComponent({
  title,
  steps,
  decision = 'pending',
  onApprove,
  onReject,
  approveLabel,
  rejectLabel,
  disabled = false,
  loading = false,
  className,
  style,
  testID,
  ref,
}: AgentPlanProps) {
  const theme = useTheme();
  const { messages } = useMessages(AGENT_PLAN_MESSAGES);
  const palette = resolvePalette(theme);
  const pending = decision === 'pending';
  const blocked = disabled || loading;

  // Set by a press, so a decision that arrives from elsewhere moves nothing.
  const [pressed, setPressed] = useState<'approve' | 'reject' | null>(null);
  const moveFocus = pressed !== null && !pending;
  const statusRef = useAccessibilityFocus<View>(moveFocus);
  useEffect(() => {
    if (IS_WEB && moveFocus) (statusRef.current as unknown as HTMLElement | null)?.focus();
  }, [moveFocus, statusRef]);

  const decide = (choice: 'approve' | 'reject') => {
    setPressed(choice);
    (choice === 'approve' ? onApprove : onReject)?.();
  };

  return (
    <Card
      ref={ref}
      appearance="outline"
      className={className}
      style={[styles.card, style]}
      testID={testID}
    >
      <Text variant="body-semibold">{title ?? messages.title}</Text>
      <View role="list" style={styles.steps}>
        {steps.map((step, index) => (
          <View key={`${index}-${step}`} role="listitem" style={styles.step}>
            <PendingStepIcon palette={palette} />
            <Text
              variant="body-regular"
              style={[
                styles.stepText,
                decision === 'rejected' && {
                  color: theme.colors.textTertiary,
                  textDecorationLine: 'line-through',
                },
              ]}
            >
              {step}
            </Text>
          </View>
        ))}
      </View>
      {pending && (
        <View role="group" aria-label={messages.decision} style={styles.actions}>
          <Button
            appearance="solid"
            tone="accent"
            size="sm"
            disabled={blocked}
            loading={loading && pressed === 'approve'}
            onPress={() => decide('approve')}
            testID={testID ? `${testID}-approve` : undefined}
          >
            {approveLabel ?? messages.approve}
          </Button>
          <Button
            appearance="outline"
            tone="neutral"
            size="sm"
            disabled={blocked}
            loading={loading && pressed === 'reject'}
            onPress={() => decide('reject')}
            testID={testID ? `${testID}-reject` : undefined}
          >
            {rejectLabel ?? messages.reject}
          </Button>
        </View>
      )}
      {/* Mounted before the decision lands, so assistive technology hears it arrive. */}
      <StyledView
        ref={statusRef}
        role="status"
        tabIndex={-1}
        style={pending ? undefined : styles.status}
        testID={testID ? `${testID}-status` : undefined}
      >
        {!pending && (
          <Badge
            appearance="subtle"
            tone={decision === 'approved' ? 'success' : 'danger'}
            size="label-medium"
            content={decision === 'approved' ? messages.approved : messages.rejected}
          />
        )}
      </StyledView>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: space.lg, gap: space.md, alignSelf: 'stretch' },
  steps: { gap: space.sm },
  step: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  stepText: { flex: 1, minWidth: 0 },
  actions: { flexDirection: 'row', gap: space.sm },
  status: { alignSelf: 'flex-start' },
});

export const AgentPlan = memo(AgentPlanComponent);
AgentPlan.displayName = 'AgentPlan';
