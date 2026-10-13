import React, { memo, useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';

import { AgentThinking } from '../agent-thinking';
import { useBloomAppearance } from '../appearance';
import { Button } from '../button';
import { Collapsible } from '../collapsible';
import { useControllableState } from '../hooks/use-controllable-state';
import { useDirectionProps } from '../hooks/use-is-rtl';
import { RiArrowDownSLine } from '../icons/remix/RiArrowDownSLine';
import { RiArrowUpSLine } from '../icons/remix/RiArrowUpSLine';
import { useMessages } from '../locale/messages';
import { space } from '../styles/tokens';
import { StyledView } from '../styles/styled-primitives';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import type { TypeScaleVariant } from '../typography/scale';
import { REASONING_MESSAGES } from './messages';
import type { ReasoningProps, ReasoningSize } from './types';

/**
 * A collapsible block holding a model's reasoning.
 *
 *   header   a plain `Button`: "Thought for 12 s" and a chevron, or, while
 *            `streaming`, the `AgentThinking` indicator and shimmering label
 *   body     `Collapsible`, indented under a hairline rule, secondary text
 *
 * The header is the library's own button, so press feedback, focus ring and
 * `aria-expanded` are the button's. Opening and closing follow `streaming`
 * until the user takes over: a press settles the state for the rest of that
 * stream, and the next stream starts open again.
 */

const BODY_VARIANT: Record<ReasoningSize, TypeScaleVariant> = {
  sm: 'caption-1-regular',
  md: 'body-2-regular',
  lg: 'body-regular',
};

const RULE_WIDTH = 2;

/** `durationMs` as whole minutes and the seconds left over; `0` seconds when it rounds to nothing. */
function splitDuration(durationMs: number) {
  const total = Math.max(0, Math.round(durationMs / 1000));
  return { minutes: Math.floor(total / 60), seconds: total % 60 };
}

function ReasoningComponent({
  children,
  streaming = false,
  durationMs,
  open: openProp,
  defaultOpen,
  onOpenChange,
  size: sizeProp,
  className,
  style,
  testID,
  ref,
}: ReasoningProps) {
  const theme = useTheme();
  const direction = useDirectionProps();
  const { messages } = useMessages(REASONING_MESSAGES);
  const scoped = useBloomAppearance({ size: sizeProp }, { size: 'md', tone: 'neutral' });
  const size: ReasoningSize = scoped.size === 'xs' ? 'sm' : scoped.size;

  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen ?? streaming,
    onChange: onOpenChange,
  });

  // A press settles the state until the stream turns over; a new stream resets it.
  const userToggled = useRef(false);
  const wasStreaming = useRef(streaming);
  useEffect(() => {
    if (wasStreaming.current === streaming) return;
    wasStreaming.current = streaming;
    if (streaming) userToggled.current = false;
    if (!userToggled.current) setOpen(streaming);
  }, [streaming, setOpen]);

  const toggle = () => {
    userToggled.current = true;
    setOpen(!open);
  };

  const { minutes, seconds } = splitDuration(durationMs ?? 0);
  const finishedLabel =
    durationMs === undefined
      ? messages.reasoning
      : minutes === 0 && seconds === 0
        ? messages.thoughtBriefly
        : messages.thoughtFor(minutes, seconds);

  return (
    <StyledView
      ref={ref}
      {...direction}
      className={className}
      style={[styles.root, style]}
      testID={testID}
    >
      <Button
        appearance="plain"
        tone="neutral"
        size={size}
        aria-expanded={open}
        trailingIcon={open ? RiArrowUpSLine : RiArrowDownSLine}
        onPress={toggle}
        testID={testID ? `${testID}-header` : undefined}
        style={styles.header}
      >
        {streaming ? <AgentThinking showTimer={false} /> : finishedLabel}
      </Button>
      <Collapsible open={open} testID={testID ? `${testID}-body` : undefined}>
        <StyledView
          style={[
            styles.body,
            { borderStartColor: theme.colors.border, borderStartWidth: RULE_WIDTH },
          ]}
        >
          {typeof children === 'string' ? (
            <Text variant={BODY_VARIANT[size]} style={{ color: theme.colors.textSecondary }}>
              {children}
            </Text>
          ) : (
            children
          )}
        </StyledView>
      </Collapsible>
    </StyledView>
  );
}

const styles = StyleSheet.create({
  root: { alignSelf: 'stretch' },
  header: { alignSelf: 'flex-start' },
  body: { marginStart: space.md, paddingStart: space.md, paddingVertical: space.xs },
});

export const Reasoning = memo(ReasoningComponent);
Reasoning.displayName = 'Reasoning';
