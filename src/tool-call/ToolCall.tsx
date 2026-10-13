import React, { memo, useMemo } from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';

import { resolveBloomColors } from '../appearance/colors';
import { Collapsible } from '../collapsible';
import { useInteractionState } from '../hooks/use-interaction-state';
import { useIsRtl } from '../hooks/use-is-rtl';
import { usePrefersReducedMotion } from '../hooks/use-prefers-reduced-motion';
import { useControllableState } from '../hooks/use-controllable-state';
import { RiArrowDownSLine } from '../icons/remix/RiArrowDownSLine';
import { RiArrowRightSLine } from '../icons/remix/RiArrowRightSLine';
import { RiCheckLine } from '../icons/remix/RiCheckLine';
import { RiErrorWarningLine } from '../icons/remix/RiErrorWarningLine';
import { RiLoader4Line } from '../icons/remix/RiLoader4Line';
import { RiWrenchLine } from '../icons/remix/RiWrenchLine';
import { Loading } from '../loading';
import { useMessages } from '../locale/messages';
import { IS_WEB } from '../styles/platform';
import { interactiveWebCss, useInteractiveWebCss } from '../styles/interactive-web-css';
import { StyledView } from '../styles/styled-primitives';
import { useRingOffsetStyle } from '../styles/surface-levels';
import type { WebCssStyle } from '../styles/web-view-style';
import { borderRadius } from '../styles/tokens';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { useInToolCallList } from './context';
import { TOOL_CALL_MESSAGES } from './messages';
import { TOOL_CALL_GEOMETRY, formatDuration } from './shared';
import type { ToolCallProps } from './types';

/**
 * One tool call in an assistant reply: what ran, whether it is still running,
 * finished or failed, and, when given an `onPress` or a body, the way into its
 * result. Rungs and type are in `shared.ts`; the model is in `docs/tool-call.mdx`.
 *
 * The status is carried three ways at once so no one of them is load-bearing:
 * the indicator, its colour, and a word (`Running`/`Done`/`Failed`) kept in a
 * live region for assistive technology.
 */

// ---------------------------------------------------------------------------
//  Keyboard focus on web
//
//  A pressable row is a react-native-web `Pressable`: keyboard-reachable, with
//  the outline reset and no inline style able to carry `:focus-visible`. The
//  shared recipe in `styles/interactive-web-css.ts` draws the ring; the hook is
//  a `data-*` attribute through `dataSet` (see `chip/Chip.tsx` for why neither
//  a class nor a literal `data-*` prop reaches the DOM here).
// ---------------------------------------------------------------------------

const STYLE_ID = 'bloom-tool-call-web-css';

const TOOL_CALL_CSS = interactiveWebCss({
  selector: '[data-bloom-tool-call]',
  varPrefix: 'bloom-tool-call',
  reset: 'none',
  transition: 'background-color 120ms ease, border-color 120ms ease',
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

function ToolCallComponent({
  name,
  label,
  status,
  detail,
  error,
  durationMs,
  icon: Icon = RiWrenchLine,
  onPress,
  children,
  expanded,
  defaultExpanded = false,
  onExpandedChange,
  size = 'md',
  className,
  style,
  ref,
  testID,
}: ToolCallProps) {
  const theme = useTheme();
  const rtl = useIsRtl();
  const reducedMotion = usePrefersReducedMotion();
  const inList = useInToolCallList();
  const { messages } = useMessages(TOOL_CALL_MESSAGES);
  const geometry = TOOL_CALL_GEOMETRY[size];
  const ringOffset = useRingOffsetStyle();
  const { state: pressed, onIn: onPressIn, onOut: onPressOut } = useInteractionState();
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

  const success = resolveBloomColors(theme.colors, 'success', 'subtle').foreground;
  const danger = resolveBloomColors(theme.colors, 'danger', 'subtle').foreground;

  const headerStyle = useMemo(
    (): WebCssStyle => ({
      flexDirection: 'row',
      alignItems: 'center',
      gap: geometry.gap,
      paddingVertical: geometry.paddingVertical,
      // Longhands, never `paddingHorizontal`: see `item/Item.tsx` for the web cascade this avoids.
      paddingLeft: geometry.paddingHorizontal,
      paddingRight: geometry.paddingHorizontal,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: failed ? danger : theme.colors.border,
      backgroundColor: pressed
        ? theme.colors.backgroundTertiary
        : hovered
          ? theme.colors.contrast50
          : theme.colors.backgroundSecondary,
      // The `:focus-visible` ring colour and its gap, read by the adopted sheet.
      '--bloom-tool-call-ring': theme.colors.primary,
      ...ringOffset,
    }),
    [geometry, failed, danger, theme, pressed, hovered, ringOffset],
  );

  const indicator = running ? (
    <Loading
      size="xs"
      tone="accent"
      iconSize={geometry.icon}
      // The shared spinner turns forever, so under reduced motion it rests as a still glyph.
      spinnerIcon={
        reducedMotion ? (
          <RiLoader4Line width={geometry.icon} height={geometry.icon} fill={theme.colors.primary} />
        ) : undefined
      }
    />
  ) : failed ? (
    <RiErrorWarningLine width={geometry.icon} height={geometry.icon} fill={danger} />
  ) : (
    <RiCheckLine width={geometry.icon} height={geometry.icon} fill={success} />
  );

  const Chevron = hasBody ? RiArrowDownSLine : RiArrowRightSLine;
  const chevronFlip = hasBody ? (open ? '180deg' : '0deg') : rtl ? '180deg' : '0deg';

  const content = (
    <>
      <View aria-hidden>
        <Icon width={geometry.icon} height={geometry.icon} fill={theme.colors.textSecondary} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text variant={geometry.title} numberOfLines={1} style={{ color: theme.colors.text }}>
          {label ?? name}
        </Text>
        {secondary ? (
          <Text
            variant={geometry.secondary}
            numberOfLines={failed ? 2 : 1}
            style={{ color: failed ? danger : theme.colors.textSecondary }}
          >
            {secondary}
          </Text>
        ) : null}
      </View>
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
      {/* A live region that exists from the first render, so the change to `Done` or `Failed` is announced. */}
      <View
        aria-live={failed ? 'assertive' : 'polite'}
        accessibilityLiveRegion={failed ? 'assertive' : 'polite'}
        testID={testID ? `${testID}-status` : undefined}
      >
        <View aria-hidden>{indicator}</View>
        <Text style={VISUALLY_HIDDEN}>{statusText}</Text>
      </View>
      {interactive ? (
        <View
          aria-hidden
          style={{ transform: [{ rotate: chevronFlip }] }}
          testID={testID ? `${testID}-chevron` : undefined}
        >
          <Chevron width={geometry.icon} height={geometry.icon} fill={theme.colors.textTertiary} />
        </View>
      ) : null}
    </>
  );

  // The whole row is one control, so its name carries what a sighted reader gets from the row.
  const rowLabel = [label ?? name, statusText, secondary].filter(Boolean).join(', ');

  const handlePress = () => {
    onPress?.();
    if (hasBody) setOpen(!open);
  };

  return (
    <StyledView
      ref={ref}
      role={inList ? 'listitem' : undefined}
      className={className}
      style={style}
      testID={testID}
    >
      {interactive ? (
        <Pressable
          role="button"
          accessibilityLabel={rowLabel}
          onPress={handlePress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          onHoverIn={onHoverIn}
          onHoverOut={onHoverOut}
          // Both spellings: react-native-web reads only `aria-*`, React Native only `accessibilityState`.
          accessibilityState={{ expanded: hasBody ? open : undefined, busy: running }}
          aria-expanded={hasBody ? open : undefined}
          aria-busy={running}
          {...(IS_WEB ? ({ dataSet: { bloomToolCall: '' } } as Record<string, unknown>) : {})}
          style={headerStyle}
          testID={testID ? `${testID}-row` : undefined}
        >
          {content}
        </Pressable>
      ) : (
        <View aria-busy={running} style={headerStyle} testID={testID ? `${testID}-row` : undefined}>
          {content}
        </View>
      )}
      {hasBody ? (
        <Collapsible open={open} contentStyle={{ paddingTop: 6 }}>
          {children}
        </Collapsible>
      ) : null}
    </StyledView>
  );
}

export const ToolCall = memo(ToolCallComponent);
ToolCall.displayName = 'ToolCall';
