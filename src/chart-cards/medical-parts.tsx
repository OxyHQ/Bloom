import type React from 'react';
import { useEffect, useMemo } from 'react';
import { Platform, View, type StyleProp, type ViewStyle } from 'react-native';

import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { TABULAR } from './primitives/ChartHeader';
import { FadeOnChange } from './primitives/FadeOnChange';
import { useChartCardPalette } from './primitives/use-chart-palette';
import { RollingText } from '../motion/RollingText';
import { useCountUp } from '../motion/use-count-up';
import { useCommonMessages } from '../locale/common-messages';
import { MonthChevron, MonthNavButton } from '../date-picker/MonthNavButton';

/**
 * Chrome shared by the medical dashboard cards (`StepsCard`,
 * `MostActiveDaysCard`): `WeekRangePill`, the header with a suffix caption,
 * the card shell geometry, and a focus ring for their raw buttons.
 */

/** `h-[330px] rounded-[20px] p-2.5 gap-4`. */
export const MEDICAL_CARD_HEIGHT = 330;
export const MEDICAL_CARD_STYLE: ViewStyle = {
  paddingTop: 10,
  paddingBottom: 10,
  paddingLeft: 10,
  paddingRight: 10,
};

/** Extra colours these cards need beyond `useChartCardPalette()`. */
export interface MedicalPalette {
  /** `background-secondary-hover` — the nav chevrons' hover. */
  secondaryHover: string;
  /** `border-button-hover` — the selected day's border. */
  buttonBorderHover: string;
  /** `background-primary-hover` over the inner panel — a day cell's hover. */
  cellHover: string;
  /** `border-focus-ring`. */
  focusRing: string;
}

export function useMedicalPalette(): MedicalPalette {
  const theme = useTheme();
  const palette = useChartCardPalette();
  return useMemo(() => {
    return {
      secondaryHover: theme.colors.backgroundTertiary,
      buttonBorderHover: theme.colors.border,
      cellHover: theme.colors.contrast50,
      focusRing: theme.colors.primary,
    };
  }, [theme, palette.inner]);
}

// ---------------------------------------------------------------------------
//  Focus ring (web): `focus-visible:ring-2 ring-border-focus-ring`
// ---------------------------------------------------------------------------

const CHART_CSS_ID = 'bloom-chart-card-parts';
/**
 * Focus rings for the cards' raw pressables, and CSS transitions for SVG shapes
 * (react-native-svg's shapes take no `style`, so the easing hangs off a `data-*`
 * hook on the plot that wraps them). Reduced motion drops the easing.
 */
const CHART_CSS = `[data-bloom-chart-focus] { outline: none; }
[data-bloom-chart-focus="outset"]:focus-visible { box-shadow: 0 0 0 2px var(--bloom-chart-ring, currentColor); }
[data-bloom-chart-focus="inset"]:focus-visible { box-shadow: inset 0 0 0 2px var(--bloom-chart-ring, currentColor); }
[data-bloom-chart-ease="funnel"] path, [data-bloom-chart-ease="funnel"] rect { transition: fill 200ms cubic-bezier(0, 0, 0.2, 1), opacity 200ms cubic-bezier(0, 0, 0.2, 1); }
[data-bloom-chart-ease="steps"] rect[fill="none"] { transition: opacity 150ms cubic-bezier(0, 0, 0.2, 1); }
@media (prefers-reduced-motion: reduce) {
  [data-bloom-chart-ease] path, [data-bloom-chart-ease] rect { transition: none; }
}`;

type WebDataSet = { dataSet?: Record<string, string> };

function useChartCss(): void {
  useEffect(() => {
    if (Platform.OS === 'web') adoptStyleSheet(CHART_CSS_ID, CHART_CSS);
  }, []);
}

/**
 * Props for a raw pressable that needs a keyboard focus ring: the
 * `data-*` hook plus the ring colour as a custom property. Adopts the sheet once.
 * Web only; native has no keyboard focus ring to draw.
 */
export function useChartFocusRing(
  kind: 'outset' | 'inset',
  color: string,
): { hook: WebDataSet; ring: WebCssStyle | null } {
  useChartCss();
  if (Platform.OS !== 'web') return { hook: {}, ring: null };
  return { hook: { dataSet: { bloomChartFocus: kind } }, ring: { '--bloom-chart-ring': color } };
}

/**
 * The `data-*` hook that eases the SVG shapes inside a plot on web: `funnel` —
 * every shape's fill and opacity over 200ms; `steps` — the hover outline's
 * opacity over 150ms. Native snaps.
 */
export function useSvgEase(kind: 'funnel' | 'steps'): WebDataSet {
  useChartCss();
  return Platform.OS === 'web' ? { dataSet: { bloomChartEase: kind } } : {};
}

// ---------------------------------------------------------------------------
//  Headline with a suffix
// ---------------------------------------------------------------------------

export interface MedicalHeadlineProps {
  label: string;
  value: number;
  format: (value: number) => string;
  /** `caption-1-medium` after the number, on its baseline ("total steps"). */
  suffix?: string;
  /** Roll the number (`useCountUp`) and replay the fade when this changes. Omit for a static number. */
  fadeKey?: string | number;
  testID?: string;
}

/**
 * The left column of the medical cards' header: label `body-medium`
 * text-secondary, 2px, then the number `title-1-medium` text-primary tabular
 * with its suffix `caption-1-medium` text-secondary 4px after it, sharing the
 * number's baseline.
 */
export function MedicalHeadline({
  label,
  value,
  format,
  suffix,
  fadeKey,
  testID,
}: MedicalHeadlineProps) {
  const palette = useChartCardPalette();
  const rolled = useCountUp(value);
  const animated = fadeKey !== undefined;
  const number = (
    <Text
      variant="title-1-medium"
      numberOfLines={1}
      testID={testID ? `${testID}-headline` : undefined}
      style={[{ color: palette.text }, TABULAR]}
    >
      {format(animated ? rolled : value)}
    </Text>
  );
  return (
    <View style={{ minWidth: 0, flex: 1, flexDirection: 'column', gap: 2 }}>
      <Text variant="body-medium" numberOfLines={1} style={{ color: palette.textSecondary }}>
        {label}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
        {animated ? <FadeOnChange fadeKey={fadeKey}>{number}</FadeOnChange> : number}
        {suffix ? (
          <Text
            variant="caption-1-medium"
            numberOfLines={1}
            style={{ color: palette.textSecondary }}
          >
            {suffix}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

/** The header row: headline on the left, the pill on the right, `px-1.5 pt-1.5`, 8px apart. */
export function MedicalHeader({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        width: '100%',
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 8,
        paddingLeft: 6,
        paddingRight: 6,
        paddingTop: 6,
      }}
    >
      {children}
    </View>
  );
}

// ---------------------------------------------------------------------------
//  WeekRangePill
// ---------------------------------------------------------------------------

export interface WeekRangePillProps {
  label: string;
  /** With `onPrev` / `onNext` the chevrons are buttons and the label rolls on change; without, a static pill. */
  onPrev?: () => void;
  onNext?: () => void;
  /** Accessible names of the chevrons. Default `"Previous"` / `"Next"`. */
  prevLabel?: string;
  nextLabel?: string;
  /** Default 151 (the week pill); the month switcher is 128. */
  width?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * `WeekRangePill`: 32 tall, radius 10 (a panel radius — the pill is not a
 * button), 1px `border-button`, `background-primary`, `shadow-xs`, padding 4,
 * a 16px chevron at each end and the label (`body-medium` text-primary)
 * centred between them. The chevrons are the date picker's `MonthNavButton`s
 * (16px full pills with a `background-secondary-hover` wash, 150ms).
 */
export function WeekRangePill({
  label,
  onPrev,
  onNext,
  prevLabel: prevLabelProp,
  nextLabel: nextLabelProp,
  width = 151,
  style,
  testID,
}: WeekRangePillProps) {
  const common = useCommonMessages();
  const prevLabel = prevLabelProp ?? common.previous;
  const nextLabel = nextLabelProp ?? common.next;
  const palette = useChartCardPalette();
  const medical = useMedicalPalette();
  const interactive = !!(onPrev || onNext);
  const noop = () => {};
  return (
    <View
      testID={testID}
      style={[
        {
          width,
          height: 32,
          flexShrink: 0,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 4,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: palette.pill.border,
          backgroundColor: palette.pill.background,
          boxShadow: palette.pill.shadow,
          paddingTop: 4,
          paddingBottom: 4,
          paddingLeft: 4,
          paddingRight: 4,
        },
        style,
      ]}
    >
      {interactive ? (
        <MonthNavButton
          direction="left"
          accessibilityLabel={prevLabel}
          onPress={onPrev ?? noop}
          color={palette.textSecondary}
          hoverFill={medical.secondaryHover}
          ring={medical.focusRing}
          testID={testID ? `${testID}-prev` : undefined}
        />
      ) : (
        <View aria-hidden style={{ width: 16, height: 16, flexShrink: 0 }}>
          <MonthChevron direction="left" color={palette.textSecondary} />
        </View>
      )}
      {interactive ? (
        <RollingText
          value={label}
          align="center"
          clip
          variant="body-medium"
          numberOfLines={1}
          style={{ color: palette.text }}
          containerStyle={{ flex: 1, minWidth: 0 }}
        />
      ) : (
        <Text
          variant="body-medium"
          numberOfLines={1}
          style={{ flex: 1, textAlign: 'center', color: palette.text }}
        >
          {label}
        </Text>
      )}
      {interactive ? (
        <MonthNavButton
          direction="right"
          accessibilityLabel={nextLabel}
          onPress={onNext ?? noop}
          color={palette.textSecondary}
          hoverFill={medical.secondaryHover}
          ring={medical.focusRing}
          testID={testID ? `${testID}-next` : undefined}
        />
      ) : (
        <View aria-hidden style={{ width: 16, height: 16, flexShrink: 0 }}>
          <MonthChevron direction="right" color={palette.textSecondary} />
        </View>
      )}
    </View>
  );
}
