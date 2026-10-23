import type React from 'react';
import { memo, useContext, useState } from 'react';
import { Pressable, Text, type PressableStateCallbackType, type ViewStyle } from 'react-native';

import { SpinnerIcon } from '../loading/SpinnerIcon';
import { DISABLED_OPACITY } from '../styles/tokens';
import { IS_WEB } from '../styles/platform';
import { ENGAGEMENT_HIT_SLOP, ENGAGEMENT_ICON_SIZE, ENGAGEMENT_SPINNER_SIZE } from './constants';
import { EngagementBarContext, type EngagementPress } from './context';
import { EngagementCountRoll } from './EngagementCountRoll';
import { EngagementPop } from './EngagementPop';
import type { EngagementActionProps } from './types';

/** The hook the bar's web sheet hangs hover and focus off. Native has no `dataSet`. */
const WEB_DATA = IS_WEB
  ? ({ dataSet: { bloomEngagementAction: '' } } as Record<string, unknown>)
  : null;

const DIMMED: ViewStyle = { opacity: DISABLED_OPACITY };

/**
 * One action in an `EngagementBar`: a glyph, an optional count, and a press.
 *
 * Built for a feed, where one is mounted per action per row. At rest it is ONE
 * pressable host with the glyph and, when there is a count, one text — no style
 * wrapper, no animated node, no mapper. It reads the bar's context and holds one
 * state slot.
 *
 * - Press feedback is the platform's own pressed state (`style` as a function),
 *   so a held action paints its tone's tint without a shared value.
 * - The pop and the count roll mount ONLY between an accepted press and the
 *   end of their animation, and only on the action that was pressed. A change
 *   that did not come from a press (a refetch, a recycled row) never animates.
 */
function EngagementActionComponent({
  icon: Icon,
  activeIcon,
  accessibilityLabel,
  accessibilityHint,
  count,
  active,
  tone = 'primary',
  onPress,
  onLongPress,
  accessibilityActions,
  onAccessibilityAction,
  popOnActivate = false,
  rollCount = false,
  busy = false,
  disabled = false,
  hitSlop = ENGAGEMENT_HIT_SLOP,
  testID,
}: EngagementActionProps) {
  const bar = useContext(EngagementBarContext);
  if (!bar) throw new Error('EngagementAction must be rendered inside an EngagementBar.');
  const [press, setPress] = useState<EngagementPress | null>(null);

  const on = active === true;
  const tonePaint = bar.paint.tones[tone];
  const color = on ? tonePaint.color : bar.paint.restColor;
  const shown = count != null && count !== 0 ? count : null;
  const label = shown === null ? null : bar.formatCount(shown);

  const popping = press !== null && popOnActivate && on && !press.active;
  const rolling =
    press !== null && rollCount && label !== null && press.label !== null && press.label !== label;
  const Glyph = on && activeIcon ? activeIcon : Icon;
  const countStyle = on ? tonePaint.activeCount : bar.paint.restCount;

  let glyph: React.ReactNode;
  if (busy) {
    glyph = <SpinnerIcon key="busy" size={ENGAGEMENT_SPINNER_SIZE} color={bar.paint.restColor} />;
  } else if (popping) {
    glyph = (
      <EngagementPop
        key={`pop-${press.id}`}
        icon={Glyph}
        color={color}
        // The roll outlasts the pop, so whichever is running last clears the press.
        onDone={rolling ? undefined : setPress}
      />
    );
  } else {
    glyph = (
      <Glyph key="glyph" width={ENGAGEMENT_ICON_SIZE} height={ENGAGEMENT_ICON_SIZE} fill={color} />
    );
  }

  let countNode: React.ReactNode = null;
  if (rolling && press.label !== null) {
    countNode = (
      <EngagementCountRoll
        key={`roll-${press.id}`}
        from={press.label}
        to={label}
        up={(shown ?? 0) > (press.count ?? 0)}
        style={countStyle}
        onDone={setPress}
      />
    );
  } else if (label !== null) {
    countNode = (
      <Text key="count" style={countStyle} selectable={false}>
        {label}
      </Text>
    );
  }

  const blocked = disabled || busy;
  const rest = disabled ? [tonePaint.rest, DIMMED] : tonePaint.rest;

  return (
    <Pressable
      {...WEB_DATA}
      role="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      // BOTH spellings of the toggle state: react-native-web drops
      // `accessibilityState` and React Native has no `aria-pressed`.
      {...(active === undefined ? null : { 'aria-pressed': on })}
      accessibilityState={
        active === undefined && !blocked ? undefined : { selected: on, busy, disabled: blocked }
      }
      aria-disabled={disabled || undefined}
      aria-busy={busy || undefined}
      accessibilityActions={accessibilityActions}
      onAccessibilityAction={onAccessibilityAction}
      disabled={blocked}
      onPress={
        onPress
          ? () => {
              if (onPress() === false) return;
              bar.haptic('light');
              if (popOnActivate || rollCount) {
                setPress({ id: (press?.id ?? 0) + 1, active: on, count: shown, label });
              }
            }
          : undefined
      }
      onLongPress={
        onLongPress
          ? () => {
              bar.haptic('medium');
              onLongPress();
            }
          : undefined
      }
      hitSlop={hitSlop}
      style={({ pressed }: PressableStateCallbackType) =>
        pressed && !blocked ? tonePaint.pressed : rest
      }
      testID={testID}
    >
      {/* A lone child, not a one-item list: `Pressable` renders its children beside
          its own debug view, and a list there costs a Fragment fiber per action. */}
      {countNode === null ? glyph : [glyph, countNode]}
    </Pressable>
  );
}

export const EngagementAction = memo(EngagementActionComponent);
EngagementAction.displayName = 'EngagementAction';
