import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import {
  AGENT_LOG_SOFT_EASE,
  AgentLogReveal,
  AgentLogRow,
  AgentLogShimmerText,
  AgentLogWorkingRow,
  useAgentLogMotion,
  useAgentLogRevealTicker,
} from '../agent-log';
import { mixColor, resolveButtonRamps } from '../button/shared';
import { RiArrowDownSLine } from '../icons/remix';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import type { WebCssStyle } from '../styles/web-view-style';
import type { Theme } from '../theme/types';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import type { TaskListChip, TaskListProps, TaskListStep, TaskListTask } from './types';

/**
 * The agent's working log
 * as it happens.
 *
 * One entry per task ("Found project files"), each holding the steps the agent
 * actually took. A data-driven transcript meant to sit inline in a chat thread:
 * it streams its own units in, one per tick, so the thread grows the way the work
 * does. A task shows its `runningTitle` with a travelling shimmer while its steps
 * are still arriving, then swaps to `title` once they have all landed.
 *
 * The reveal, the clipping edge and the curved guide all come from `agent-log`,
 * which `WebSearch` shares.
 *
 * Geometry, resolved from the class vocabulary:
 *
 *   tasks       column, 5px apart
 *   header      full-width button, py 2, radius 6: icon 16 (icon-secondary),
 *               gap 8, title body-medium text-secondary truncated, chevron 16
 *               (icon-tertiary → icon-secondary on hover)
 *   steps       list 2 below the header, indented 8 (under the icon's centre);
 *               each row py 4 body-regular text-secondary
 *   chip        inline, ml 3 mr 2, lifted 1px, radius 6, border 1, py 2, pr 6,
 *               pl 6 (4 with an icon), icon slot 14 + gap 4, label caption-2-medium
 *               text-primary truncated; border at 50% and background-secondary
 *               at rest, border-button-hover and background-tertiary on hover
 *
 * Motion: the title swap is 260ms on the soft curve (4px lift and 3px blur each
 * way, the old title leaving out of flow); collapse is height 300ms soft +
 * opacity 220ms ease-out; the chevron turns 300ms `ease`; chip colours 150ms.
 */

const IS_WEB = Platform.OS === 'web';

// ---------------------------------------------------------------------------
//  Palette
// ---------------------------------------------------------------------------

export interface TaskListPalette {
  textPrimary: string;
  textSecondary: string;
  iconSecondary: string;
  iconTertiary: string;
  chipBorder: string;
  chipBorderHover: string;
  chipSurface: string;
  chipSurfaceHover: string;
  ring: string;
}

/**
 * Semantic tokens mapped onto Bloom's ramps (`button/shared`):
 *
 *                                  light                   dark
 *   text-primary                   text                    text
 *   text-secondary                 neutral-500             neutral-500
 *   foreground-icon-secondary      neutral-500             neutral-500
 *   foreground-icon-tertiary       neutral-400             neutral-600
 *   border-button-default/50       neutral-200 @50% over   neutral-700 @50% over
 *                                  the chip surface        the chip surface
 *   border-button-hover            neutral-300             neutral-500
 *   background-secondary-default   neutral-100             neutral-900
 *   background-tertiary-default    neutral-200             neutral-800
 *   border-focus-ring              accent-500              accent-500
 */
export function resolveTaskListPalette(theme: Theme): TaskListPalette {
  const { accent, neutral: n } = resolveButtonRamps(theme);
  const shared = {
    textPrimary: theme.colors.text,
    textSecondary: n[500],
    iconSecondary: n[500],
    ring: accent[500],
  };
  return theme.isDark
    ? {
        ...shared,
        iconTertiary: n[600],
        chipBorder: mixColor(n[900], n[700], 0.5),
        chipBorderHover: n[500],
        chipSurface: n[900],
        chipSurfaceHover: n[800],
      }
    : {
        ...shared,
        iconTertiary: n[400],
        chipBorder: mixColor(n[100], n[200], 0.5),
        chipBorderHover: n[300],
        chipSurface: n[100],
        chipSurfaceHover: n[200],
      };
}

// ---------------------------------------------------------------------------
//  Web CSS: header focus ring, chip hover + inline alignment.
// ---------------------------------------------------------------------------

const STYLE_ID = 'bloom-task-list-web-css';
const HEADER_SELECTOR = '[data-bloom-task-list-header]';
const CHIP_SELECTOR = '[data-bloom-task-list-chip]';
const WEB_CSS = `
${HEADER_SELECTOR} {
  outline: none;
  cursor: pointer;
  text-align: left;
}
${HEADER_SELECTOR}:focus-visible {
  box-shadow: 0 0 0 2px var(--bloom-task-list-ring);
}
${CHIP_SELECTOR} {
  vertical-align: middle;
  transition: border-color 150ms ease, background-color 150ms ease;
}
${CHIP_SELECTOR}:hover {
  border-color: var(--bloom-task-list-chip-border-hover) !important;
  background-color: var(--bloom-task-list-chip-surface-hover) !important;
}
`;

// ---------------------------------------------------------------------------
//  Motion
// ---------------------------------------------------------------------------

/** CSS `ease`. */
const CSS_EASE = Easing.bezier(0.25, 0.1, 0.25, 1);
/** Motion's `easeOut`. */
const EASE_OUT = Easing.bezier(0, 0, 0.58, 1);

const TITLE_SWAP_MS = 260;
const TITLE_SHIFT = 4;
const TITLE_BLUR = 3;
const COLLAPSE_HEIGHT_MS = 300;
const COLLAPSE_OPACITY_MS = 220;
const CHEVRON_MS = 300;

/** `ml-2`: puts the trunk under the centre of the header's 16px icon. */
const STEPS_INDENT = 8;

// ---------------------------------------------------------------------------
//  Title swap
// ---------------------------------------------------------------------------

interface TitleLayer {
  id: number;
  label: string;
  running: boolean;
}

/**
 * One title in the swap: enters from 4px below and 3px of blur, or leaves 4px
 * up into the same blur (out of flow, `popLayout`), then reports it is gone.
 */
function TitleSwapLayer({
  layer,
  phase,
  animate,
  color,
  onExited,
}: {
  layer: TitleLayer;
  phase: 'enter' | 'exit';
  animate: boolean;
  color: string;
  onExited?: (id: number) => void;
}) {
  // 0 = hidden below/above, 1 = settled.
  const progress = useSharedValue(phase === 'enter' && animate ? 0 : 1);

  useEffect(() => {
    if (!animate) {
      if (phase === 'exit') onExited?.(layer.id);
      return;
    }
    const done = (finished?: boolean) => {
      'worklet';
      if (finished && phase === 'exit' && onExited) runOnJS(onExited)(layer.id);
    };
    progress.value = withTiming(
      phase === 'enter' ? 1 : 0,
      { duration: TITLE_SWAP_MS, easing: AGENT_LOG_SOFT_EASE },
      done,
    );
    // Mount-only: each layer plays its one transition.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle((): WebCssStyle => {
    const offset = phase === 'enter' ? TITLE_SHIFT : -TITLE_SHIFT;
    const base: WebCssStyle = {
      opacity: progress.value,
      transform: [{ translateY: offset * (1 - progress.value) }],
    };
    if (!IS_WEB) return base;
    return {
      ...base,
      filter: progress.value >= 1 ? 'none' : `blur(${TITLE_BLUR * (1 - progress.value)}px)`,
    };
  }, [progress, phase]);

  return (
    <Animated.View
      aria-hidden={phase === 'exit' ? true : undefined}
      style={[
        phase === 'exit' ? { position: 'absolute', top: 0, left: 0, right: 0 } : null,
        animatedStyle,
      ]}
    >
      <Text variant="body-medium" numberOfLines={1} style={{ color }}>
        {layer.running ? <AgentLogShimmerText>{layer.label}</AgentLogShimmerText> : layer.label}
      </Text>
    </Animated.View>
  );
}

/** Cross-fades the running title to the settled one in place. */
function TaskTitle({
  label,
  running,
  reduce,
  color,
}: {
  label: string;
  running: boolean;
  reduce: boolean;
  color: string;
}) {
  const nextId = useRef(1);
  const [current, setCurrent] = useState<TitleLayer>({ id: 0, label, running });
  const [leaving, setLeaving] = useState<TitleLayer[]>([]);
  // The first title renders settled (`AnimatePresence initial={false}`).
  const [entered, setEntered] = useState(false);

  if (current.label !== label) {
    // A new label: the old one leaves, the new one enters. Setting state during
    // render keeps both on the same frame.
    setLeaving((list) => [...list, current]);
    setCurrent({ id: nextId.current++, label, running });
    setEntered(true);
  } else if (current.running !== running) {
    setCurrent({ ...current, running });
  }

  const onExited = useCallback((id: number) => {
    setLeaving((list) => list.filter((layer) => layer.id !== id));
  }, []);

  return (
    <View style={{ position: 'relative', flexDirection: 'row', minWidth: 0, overflow: 'hidden' }}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <TitleSwapLayer
          key={current.id}
          layer={current}
          phase="enter"
          animate={entered && !reduce}
          color={color}
        />
      </View>
      {leaving.map((layer) => (
        <TitleSwapLayer
          key={layer.id}
          layer={layer}
          phase="exit"
          animate={!reduce}
          color={color}
          onExited={onExited}
        />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
//  Collapse
// ---------------------------------------------------------------------------

/**
 * `motion.div animate={{ height: open ? "auto" : 0, opacity }}` with no
 * `initial`: renders at its target on mount and only animates when `open`
 * changes. Children stay mounted, so a step's reveal is never replayed.
 */
function Collapse({
  open,
  reduce,
  children,
}: {
  open: boolean;
  reduce: boolean;
  children: React.ReactNode;
}) {
  const height = useSharedValue(open ? 1 : 0);
  const opacity = useSharedValue(open ? 1 : 0);
  const measured = useSharedValue(0);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const target = open ? 1 : 0;
    if (reduce) {
      height.value = target;
      opacity.value = target;
      return;
    }
    height.value = withTiming(target, { duration: COLLAPSE_HEIGHT_MS, easing: AGENT_LOG_SOFT_EASE });
    opacity.value = withTiming(target, { duration: COLLAPSE_OPACITY_MS, easing: EASE_OUT });
  }, [open, reduce, height, opacity]);

  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      measured.value = event.nativeEvent.layout.height;
    },
    [measured],
  );

  const animatedStyle = useAnimatedStyle(
    () => ({
      opacity: opacity.value,
      height: height.value >= 1 ? 'auto' : height.value * measured.value,
    }),
    [height, opacity, measured],
  );

  return (
    <Animated.View style={[{ overflow: 'hidden' }, animatedStyle]}>
      <View onLayout={onLayout}>{children}</View>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
//  Rows
// ---------------------------------------------------------------------------

function Chip({ chip, palette }: { chip: TaskListChip; palette: TaskListPalette }) {
  const hoverVars: WebCssStyle = {
    '--bloom-task-list-chip-border-hover': palette.chipBorderHover,
    '--bloom-task-list-chip-surface-hover': palette.chipSurfaceHover,
  };
  return (
    <View
      {...(IS_WEB ? ({ dataSet: { bloomTaskListChip: '' } } as Record<string, unknown>) : {})}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          maxWidth: '100%',
          marginLeft: 3,
          marginRight: 2,
          transform: [{ translateY: -1 }],
          borderRadius: 6,
          borderTopWidth: 1,
          borderRightWidth: 1,
          borderBottomWidth: 1,
          borderLeftWidth: 1,
          borderTopColor: palette.chipBorder,
          borderRightColor: palette.chipBorder,
          borderBottomColor: palette.chipBorder,
          borderLeftColor: palette.chipBorder,
          backgroundColor: palette.chipSurface,
          paddingTop: 2,
          paddingBottom: 2,
          paddingRight: 6,
          paddingLeft: chip.icon ? 4 : 6,
        },
        hoverVars,
      ]}
    >
      {chip.icon ? (
        <View
          aria-hidden
          style={{ width: 14, height: 14, flexShrink: 0, alignItems: 'center', justifyContent: 'center' }}
        >
          {chip.icon}
        </View>
      ) : null}
      <Text
        variant="caption-2-medium"
        numberOfLines={1}
        style={{ flexShrink: 1, color: palette.textPrimary }}
      >
        {chip.label}
      </Text>
    </View>
  );
}

function StepRow({
  step,
  active,
  first,
  last,
  reduce,
  palette,
  testID,
}: {
  step: TaskListStep;
  active: boolean;
  first: boolean;
  last: boolean;
  reduce: boolean;
  palette: TaskListPalette;
  testID?: string;
}) {
  return (
    <AgentLogRow first={first} last={last} reduce={reduce} testID={testID}>
      <Text
        variant="body-regular"
        style={{ paddingTop: 4, paddingBottom: 4, color: palette.textSecondary }}
      >
        {active ? <AgentLogShimmerText>{step.label}</AgentLogShimmerText> : step.label}
        {step.chips?.map((chip, index) => (
          <Chip key={`${chip.label}-${index}`} chip={chip} palette={palette} />
        ))}
      </Text>
    </AgentLogRow>
  );
}

/**
 * One task: its header, and the steps that reveal beneath it. Holds the per-task
 * state a hook cannot own inside the list's map — whether the reader collapsed it.
 */
function TaskSection({
  task,
  headIndex,
  endIndex,
  revealed,
  total,
  collapseOnComplete,
  reduce,
  palette,
  testID,
}: {
  task: TaskListTask;
  headIndex: number;
  endIndex: number;
  revealed: number;
  total: number;
  collapseOnComplete: boolean | 'all';
  reduce: boolean;
  palette: TaskListPalette;
  testID?: string;
}) {
  // null until the reader touches it, so `collapseOnComplete` stays in charge
  // right up to the moment they decide otherwise.
  const [manualOpen, setManualOpen] = useState<boolean | null>(null);
  const [hovered, setHovered] = useState(false);

  const done = revealed >= endIndex;
  const Icon = task.icon;
  // "all" waits for the whole log rather than this task, so a stack of tasks
  // closes as a single movement.
  const collapsed = collapseOnComplete === 'all' ? revealed >= total : collapseOnComplete && done;
  const open = manualOpen ?? !collapsed;
  const label = done ? task.title : (task.runningTitle ?? task.title);

  const rotation = useSharedValue(open ? 180 : 0);
  useEffect(() => {
    const target = open ? 180 : 0;
    rotation.value = reduce ? target : withTiming(target, { duration: CHEVRON_MS, easing: CSS_EASE });
  }, [open, reduce, rotation]);
  const chevronStyle = useAnimatedStyle(
    () => ({ transform: [{ rotate: `${rotation.value}deg` }] }),
    [rotation],
  );

  const ringStyle: WebCssStyle = { '--bloom-task-list-ring': palette.ring };

  return (
    <AgentLogReveal reduce={reduce} testID={testID}>
      <Pressable
        {...(IS_WEB ? ({ dataSet: { bloomTaskListHeader: '' } } as Record<string, unknown>) : {})}
        testID={testID ? `${testID}-header` : undefined}
        role="button"
        accessibilityLabel={label}
        aria-expanded={open}
        accessibilityState={{ expanded: open }}
        onPress={() => setManualOpen(!open)}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        style={[
          {
            width: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            borderRadius: 6,
            paddingTop: 2,
            paddingBottom: 2,
          },
          ringStyle,
        ]}
      >
        {Icon ? (
          <View aria-hidden style={{ width: 16, height: 16, flexShrink: 0 }}>
            <Icon width={16} height={16} fill={palette.iconSecondary} />
          </View>
        ) : null}
        <View style={{ flex: 1, minWidth: 0 }}>
          <TaskTitle label={label} running={!done} reduce={reduce} color={palette.textSecondary} />
        </View>
        <Animated.View aria-hidden style={[{ width: 16, height: 16, flexShrink: 0 }, chevronStyle]}>
          <RiArrowDownSLine
            width={16}
            height={16}
            fill={hovered ? palette.iconSecondary : palette.iconTertiary}
          />
        </Animated.View>
      </Pressable>

      <Collapse open={open} reduce={reduce}>
        <View role="list" aria-live="polite" style={{ marginTop: 2, marginLeft: STEPS_INDENT }}>
          {task.steps.map((step, stepIndex) => {
            const unit = headIndex + 1 + stepIndex;
            if (revealed <= unit) return null;
            // Last REVEALED step, not last in the data: the guide ends on the
            // newest branch and extends as the log grows.
            const lastShown = stepIndex === Math.min(revealed - headIndex - 2, task.steps.length - 1);
            return (
              <StepRow
                key={`${step.label}-${stepIndex}`}
                step={step}
                active={!reduce && revealed === unit + 1 && revealed < total}
                first={stepIndex === 0}
                last={lastShown}
                reduce={reduce}
                palette={palette}
                testID={testID ? `${testID}-step-${stepIndex}` : undefined}
              />
            );
          })}
        </View>
      </Collapse>
    </AgentLogReveal>
  );
}

// ---------------------------------------------------------------------------
//  Component
// ---------------------------------------------------------------------------

function TaskListComponent({
  tasks,
  run = true,
  stepInterval = 850,
  startDelay = 320,
  revealed: controlledRevealed,
  collapseOnComplete = false,
  working = 'Working',
  onComplete,
  reduce: reduceProp,
  style,
  testID,
}: TaskListProps) {
  const theme = useTheme();
  const palette = useMemo(() => resolveTaskListPalette(theme), [theme]);
  const systemReduce = useAgentLogMotion();
  const reduce = reduceProp ?? systemReduce;

  useEffect(() => {
    if (IS_WEB) adoptStyleSheet(STYLE_ID, WEB_CSS);
  }, []);

  // Each task contributes a header unit and one unit per step, so a single
  // counter walks the whole log and a header lands a tick ahead of its steps.
  const spans = useMemo(() => {
    let offset = 0;
    return tasks.map((task) => {
      const headIndex = offset;
      offset += 1 + task.steps.length;
      return { task, headIndex, endIndex: offset };
    });
  }, [tasks]);
  const rowCount = spans.length > 0 ? spans[spans.length - 1]!.endIndex : 0;
  // One tick past the last row, so the final step holds and shimmers. Skipped
  // when controlled, where the caller knows when the work is genuinely done.
  const total = rowCount + (controlledRevealed === undefined ? 1 : 0);

  const revealed = useAgentLogRevealTicker({
    total,
    run,
    stepInterval,
    startDelay,
    revealed: controlledRevealed,
    onComplete,
  });

  // 5px, not a scale step: collapsed, the tasks read as one column of headers.
  return (
    <View testID={testID} style={[{ width: '100%', flexDirection: 'column', gap: 5 }, style]}>
      {spans.map(({ task, headIndex, endIndex }, taskIndex) =>
        revealed <= headIndex ? null : (
          <TaskSection
            key={`${task.title}-${taskIndex}`}
            task={task}
            headIndex={headIndex}
            endIndex={endIndex}
            revealed={revealed}
            total={total}
            collapseOnComplete={collapseOnComplete}
            reduce={reduce}
            palette={palette}
            testID={testID ? `${testID}-task-${taskIndex}` : undefined}
          />
        ),
      )}
      {working !== false && revealed > 0 && revealed < total ? (
        <AgentLogWorkingRow
          label={working}
          reduce={reduce}
          testID={testID ? `${testID}-working` : undefined}
        />
      ) : null}
    </View>
  );
}

export const TaskList = memo(TaskListComponent);
TaskList.displayName = 'TaskList';
