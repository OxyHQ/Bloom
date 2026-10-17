import React, { type ComponentRef, memo, useEffect, useState } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { Badge } from '../badge';
import { Button } from '../button';
import { useAccessibilityFocus } from '../hooks/use-accessibility-focus';
import { useMessages } from '../locale/messages';
import { IS_WEB } from '../styles/platform';
import { SurfaceLevelProvider } from '../styles/surface-levels';
import { StyledView } from '../styles/styled-primitives';
import { SurfacePaint } from '../surface/SurfacePaint';
import { resolveSurfaceMaterial } from '../surface/resolve-surface-material';
import { useSurfaceLayer } from '../surface/use-surface-layer';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { TYPE_SCALE } from '../typography/scale';
import {
  CARD_RADIUS,
  CARD_WIDTH,
  PendingStepIcon,
  ROW_GAP,
  ROW_HEIGHT,
  resolvePalette,
} from './AgentProgress';
import { AGENT_PROGRESS_MESSAGES } from './messages';
import type { AgentProgressPlanProps } from './types';

/**
 * A plan the agent proposes and the user approves or rejects, drawn as the
 * `AgentProgress` card: the same surface, shadow, corner and 341px width, the
 * same header line (`body-medium`, text-secondary), the same 32px step rows
 * with the pending glyph and `body-medium` labels. Nothing in it moves: there
 * is no clock, no ring and no minimize, because a plan awaiting a decision is
 * not progress.
 *
 *   footer   `Approve` (solid accent) and `Reject` (outline neutral) while the
 *            decision is `pending`; afterwards a status badge reading
 *            "Approved" or "Rejected", so the outcome is text, not colour
 *
 * A rejected plan strikes its steps through. After a press the deciding button
 * unmounts, so focus moves to the status: the browser's focus on web, the
 * screen reader's cursor on native.
 */

function AgentProgressPlanComponent({
  title,
  steps,
  decision = 'pending',
  onApprove,
  onReject,
  approveLabel,
  rejectLabel,
  disabled = false,
  loading = false,
  style,
  testID,
  ref,
}: AgentProgressPlanProps) {
  const theme = useTheme();
  const { messages } = useMessages(AGENT_PROGRESS_MESSAGES);
  const palette = resolvePalette(theme);
  const surfaceLayer = useSurfaceLayer();
  const customSurface = StyleSheet.flatten(style);
  const material = resolveSurfaceMaterial({
    fill: String(customSurface?.backgroundColor ?? surfaceLayer.fill),
    parentFill: surfaceLayer.parentFill,
    parentLevel: surfaceLayer.parentLevel,
  });
  const pending = decision === 'pending';
  const blocked = disabled || loading;

  // Set by a press, so a decision that arrives from elsewhere moves nothing.
  const [pressed, setPressed] = useState<'approve' | 'reject' | null>(null);
  const moveFocus = pressed !== null && !pending;
  const statusRef = useAccessibilityFocus<ComponentRef<typeof View>>(moveFocus);
  useEffect(() => {
    if (IS_WEB && moveFocus) (statusRef.current as unknown as HTMLElement | null)?.focus();
  }, [moveFocus, statusRef]);

  const decide = (choice: 'approve' | 'reject') => {
    setPressed(choice);
    (choice === 'approve' ? onApprove : onReject)?.();
  };

  const card: ViewStyle = { backgroundColor: 'transparent', boxShadow: palette.shadow };

  return (
    <View
      ref={ref}
      testID={testID}
      style={[styles.card, card, style, { backgroundColor: 'transparent', ...material.vars }]}
    >
      <SurfacePaint fill={material.paintFill} radius={customSurface?.borderRadius ?? CARD_RADIUS} />
      <SurfaceLevelProvider level={material.level} fill={material.publishedFill}>
        <View style={styles.inner}>
          <View style={styles.header}>
            <Text
              numberOfLines={1}
              style={[TYPE_SCALE['body-medium'], { color: palette.textSecondary }]}
            >
              {title ?? messages.planTitle}
            </Text>
          </View>
          <View role="list" style={styles.steps}>
            {steps.map((step, index) => (
              <View key={`${index}-${step}`} role="listitem" style={styles.row}>
                <View style={styles.iconBox}>
                  <PendingStepIcon palette={palette} />
                </View>
                <Text
                  variant="body-medium"
                  numberOfLines={1}
                  style={[
                    styles.label,
                    { color: palette.textSecondary },
                    decision === 'rejected' && { textDecorationLine: 'line-through' },
                  ]}
                >
                  {step}
                </Text>
              </View>
            ))}
          </View>
          {pending && (
            <View role="group" aria-label={messages.planDecision} style={styles.actions}>
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
        </View>
      </SurfaceLevelProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    width: CARD_WIDTH,
    maxWidth: '100%',
    overflow: 'hidden',
    borderRadius: CARD_RADIUS,
  },
  inner: { paddingLeft: 10, paddingRight: 10, paddingTop: 12, paddingBottom: 10 },
  header: { flexDirection: 'row', alignItems: 'center', height: 20, paddingLeft: 4 },
  steps: { marginTop: 9, flexDirection: 'column', gap: ROW_GAP },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: ROW_HEIGHT,
    paddingLeft: 4,
    paddingRight: 4,
  },
  iconBox: { width: 14, height: 14, alignItems: 'center', justifyContent: 'center' },
  label: { flex: 1, minWidth: 0 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10, paddingLeft: 4 },
  status: { alignSelf: 'flex-start', marginTop: 10, marginLeft: 4 },
});

export const AgentProgressPlan = memo(AgentProgressPlanComponent);
AgentProgressPlan.displayName = 'AgentProgressPlan';
