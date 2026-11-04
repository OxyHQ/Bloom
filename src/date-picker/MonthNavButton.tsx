import Svg, { Path } from 'react-native-svg';

import { GlyphButton } from '../button/GlyphButton';

/** The chevron box, and the button's: a 16px target with 8px of reach around it. */
export const MONTH_NAV_SIZE = 16;

/** The month-nav chevron: a 2px round-capped stroke in a 16 box, turned left or right. */
export function MonthChevron({ direction, color }: { direction: 'left' | 'right'; color: string }) {
  return (
    <Svg width={MONTH_NAV_SIZE} height={MONTH_NAV_SIZE} viewBox="0 0 16 16" fill="none">
      <Path
        d={
          direction === 'left'
            ? 'M9 4L5.70711 7.29289C5.31658 7.68342 5.31658 8.31658 5.70711 8.70711L9 12'
            : 'M7 4L10.2929 7.29289C10.6834 7.68342 10.6834 8.31658 10.2929 8.70711L7 12'
        }
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export interface MonthNavButtonProps {
  direction: 'left' | 'right';
  accessibilityLabel: string;
  onPress: () => void;
  disabled?: boolean;
  /** The chevron's colour. */
  color: string;
  /** The chevron's colour while disabled; the button itself is not dimmed. Default `color`. */
  disabledColor?: string;
  /** The wash under a pointer or a press. */
  hoverFill: string;
  /** The focus ring's colour. */
  ring: string;
  testID?: string;
}

/**
 * The previous / next month control of every month header — the date picker's
 * panel, the calendar's month switcher, the chart cards' range pill: a 16px
 * `GlyphButton` (a full pill, a neutral wash on hover, its focus ring) with
 * 8px of reach around it, drawing {@link MonthChevron}. Disabled, the chevron
 * takes `disabledColor` instead of the whole control fading.
 */
export function MonthNavButton({
  direction,
  accessibilityLabel,
  onPress,
  disabled = false,
  color,
  disabledColor,
  hoverFill,
  ring,
  testID,
}: MonthNavButtonProps) {
  return (
    <GlyphButton
      size={MONTH_NAV_SIZE}
      hitSlop={8}
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      disabled={disabled}
      disabledOpacity={1}
      hoverFill={hoverFill}
      ring={ring}
      testID={testID}
    >
      <MonthChevron direction={direction} color={disabled ? (disabledColor ?? color) : color} />
    </GlyphButton>
  );
}
