import React, { Children, isValidElement, memo, type ReactNode } from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';

import { resolveBloomColors } from '../appearance/colors';
import { Collapsible } from '../collapsible';
import { useControllableState } from '../hooks/use-controllable-state';
import { useInteractionState } from '../hooks/use-interaction-state';
import { useIsRtl } from '../hooks/use-is-rtl';
import { RiArrowRightSLine } from '../icons/remix/RiArrowRightSLine';
import { RiErrorWarningLine } from '../icons/remix/RiErrorWarningLine';
import { useMessages } from '../locale/messages';
import { IS_WEB } from '../styles/platform';
import { interactiveWebCss, useInteractiveWebCss } from '../styles/interactive-web-css';
import { dataHook } from '../styles/data-hook';
import { useRingOffsetStyle } from '../styles/surface-levels';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { AgentLogRow, AgentLogShimmerText } from './AgentLog';
import { AGENT_LOG_MESSAGES } from './messages';
import type { AgentLogToolCallProps, AgentLogToolCallsProps } from './types';
import { useAgentLogMotion } from './use-agent-log-motion';

/**
 * A tool call as a line of the agent log: the same plain `body-regular`
 * text-secondary row the log draws for every step, hanging off the same guide.
 * While it runs the label shimmers; when it fails the label turns to the danger
 * pair and a warning glyph leads it. A pressable call hangs a chevron on the end.
 *
 * The status is carried three ways at once so no one of them is load-bearing: the
 * shimmer or glyph, the colour, and a word (`Running` / `Done` / `Failed`) kept in
 * a live region for assistive technology.
 */

const STYLE_ID = 'bloom-agent-log-tool-call-web-css';
const TOOL_CALL_CSS = interactiveWebCss({
  selector: '[data-bloom-agent-log-tool-call]',
  varPrefix: 'bloom-agent-log-tool-call',
  reset: 'none',
  transition: 'none',
});

const MONO_FAMILY = IS_WEB ? 'var(--bloom-font-mono)' : 'JetBrains Mono';

/** Present to assistive technology, invisible to everyone else. */
const VISUALLY_HIDDEN: ViewStyle = {
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  opacity: 0,
};

/** `420ms` under a second, `2.4s` above. Units are symbols, so they are not translated. */
function formatDuration(durationMs: number): string {
  return durationMs < 1000 ? `${Math.round(durationMs)}ms` : `${(durationMs / 1000).toFixed(1)}s`;
}

function AgentLogToolCallComponent({
  name,
  label,
  status,
  detail,
  error,
  durationMs,
  onPress,
  children,
  expanded,
  defaultExpanded = false,
  onExpandedChange,
  testID,
}: AgentLogToolCallProps) {
  const theme = useTheme();
  const rtl = useIsRtl();
  const { messages } = useMessages(AGENT_LOG_MESSAGES);
  const ringOffset = useRingOffsetStyle();
  const { state: hovered, onIn: onHoverIn, onOut: onHoverOut } = useInteractionState();
  const [open, setOpen] = useControllableState({
    value: expanded,
    defaultValue: defaultExpanded,
    onChange: onExpandedChange,
  });
  useInteractiveWebCss(STYLE_ID, TOOL_CALL_CSS);

  const hasBody = children != null;
  const interactive = onPress != null || hasBody;
  const running = status === 'running';
  const failed = status === 'error';
  const statusText = running ? messages.running : failed ? messages.failed : messages.done;
  const secondary = failed && error ? error : detail;
  const title = label ?? name;
  const danger = resolveBloomColors(theme.colors, 'danger', 'subtle').foreground;
  const color = failed ? danger : theme.colors.textSecondary;

  const content = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 }}>
      {failed ? (
        <View aria-hidden>
          <RiErrorWarningLine width={14} height={14} fill={danger} />
        </View>
      ) : null}
      <Text
        variant="body-regular"
        numberOfLines={failed ? 2 : 1}
        style={[
          { color, flexShrink: 1 },
          interactive && hovered ? { textDecorationLine: 'underline' } : null,
        ]}
      >
        {running ? <AgentLogShimmerText>{title}</AgentLogShimmerText> : title}
        {secondary ? (
          <Text
            variant="body-regular"
            style={{ color: failed ? danger : theme.colors.textTertiary }}
          >
            {`  ${secondary}`}
          </Text>
        ) : null}
      </Text>
      {durationMs != null ? (
        <Text
          variant="caption-1-regular"
          style={{
            color: theme.colors.textTertiary,
            fontFamily: MONO_FAMILY,
            fontVariant: ['tabular-nums'],
          }}
        >
          {formatDuration(durationMs)}
        </Text>
      ) : null}
      {interactive ? (
        <View
          aria-hidden
          style={{
            transform: [{ rotate: hasBody ? (open ? '90deg' : '0deg') : rtl ? '180deg' : '0deg' }],
          }}
        >
          <RiArrowRightSLine width={14} height={14} fill={theme.colors.textTertiary} />
        </View>
      ) : null}
      {/* A live region that exists from the first render, so the change to `Done` or `Failed` is announced. */}
      <View
        aria-live={failed ? 'assertive' : 'polite'}
        accessibilityLiveRegion={failed ? 'assertive' : 'polite'}
        testID={testID ? `${testID}-status` : undefined}
      >
        <Text style={VISUALLY_HIDDEN}>{statusText}</Text>
      </View>
    </View>
  );

  const rowLabel = [title, statusText, secondary].filter(Boolean).join(', ');
  const handlePress = () => {
    onPress?.();
    if (hasBody) setOpen(!open);
  };
  const ringStyle: WebCssStyle = {
    alignSelf: 'flex-start',
    borderRadius: 4,
    '--bloom-agent-log-tool-call-ring': theme.colors.primary,
    ...ringOffset,
  };

  return (
    <View testID={testID}>
      {interactive ? (
        <Pressable
          {...dataHook('bloomAgentLogToolCall')}
          role="button"
          accessibilityLabel={rowLabel}
          onPress={handlePress}
          onHoverIn={onHoverIn}
          onHoverOut={onHoverOut}
          // Both spellings: react-native-web reads only `aria-*`, React Native only `accessibilityState`.
          accessibilityState={{ expanded: hasBody ? open : undefined, busy: running }}
          aria-expanded={hasBody ? open : undefined}
          aria-busy={running}
          style={ringStyle}
          testID={testID ? `${testID}-row` : undefined}
        >
          {content}
        </Pressable>
      ) : (
        <View aria-busy={running} testID={testID ? `${testID}-row` : undefined}>
          {content}
        </View>
      )}
      {hasBody ? (
        <Collapsible open={open} contentStyle={{ paddingLeft: 8 }}>
          {children}
        </Collapsible>
      ) : null}
    </View>
  );
}

export const AgentLogToolCall = memo(AgentLogToolCallComponent);
AgentLogToolCall.displayName = 'AgentLogToolCall';

/**
 * A column of tool calls hung off the log's guide: each child is one row, the
 * first starts the trunk and the last ends it. Announced as a list so a screen
 * reader says "list, 3 items".
 */
export function AgentLogToolCalls({
  children,
  reduce: reduceProp,
  accessibilityLabel,
  testID,
}: AgentLogToolCallsProps) {
  const systemReduce = useAgentLogMotion();
  const reduce = reduceProp ?? systemReduce;
  const calls = Children.toArray(children).filter(isValidElement);
  return (
    <View role="list" accessibilityLabel={accessibilityLabel} testID={testID}>
      {calls.map((call: ReactNode, index) => (
        <AgentLogRow
          key={isValidElement(call) ? (call.key ?? index) : index}
          first={index === 0}
          last={index === calls.length - 1}
          reduce={reduce}
        >
          {call}
        </AgentLogRow>
      ))}
    </View>
  );
}
AgentLogToolCalls.displayName = 'AgentLogToolCalls';
