import React, { memo, useCallback, useMemo } from 'react';
import { Platform, Pressable, View } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { useInteractionState } from '../hooks/use-interaction-state';
import { mixColor, resolveButtonRamps } from '../button/shared';
import { focusRingShadow, useInteractiveWebCss } from '../styles/interactive-web-css';
import { useRingOffsetStyle } from '../styles/surface-levels';
import type { WebCssStyle } from '../styles/web-view-style';
import { webDataSet } from '../styles/web-data';
import { RadioIndicator } from '../radio-indicator';
import type { RadioCardProps } from './types';
import { DISABLED_OPACITY } from '../styles/tokens';

/**
 * `RadioCard` — the radio flavour of `CheckboxCard`: title and an optional
 * description on the left, the medium radio dot on the right, the whole card
 * selects.
 *
 *   card    radius 10, 1px border-button-default, pl 16 · pr 20 · py 12, gap 12
 *           background-primary-default; hover background-primary-hover
 *   title   body-medium, text-primary, one line
 *   desc    body-regular, text-secondary, one line, 2px under the title
 *   dot     16px `RadioIndicator`, 4px above and below (`py-1`)
 *   focus   the dot's 2px accent ring outside a 2px white offset
 *   disabled the whole card at 50%, not-allowed cursor
 *
 * Put cards in a `RadioGroup variant="card"` (or any `radiogroup`) — a lone
 * radio card cannot say "one of N". Colour-only hover and no press scale;
 * native borrows the hover paint while the card is held.
 */
const CARD_RADIUS = 10;
const DOT_SIZE = 16;
const TRANSITION_MS = 150;
const IS_WEB = Platform.OS === 'web';

const STYLE_ID = 'bloom-radio-card-web-css';
const CARD = '[data-bloom-radio-card]';
const DOT = '[data-bloom-radio-card-dot]';
const CARD_CSS = `
${CARD} {
  cursor: pointer;
  user-select: none;
}
${CARD}[aria-disabled="true"] {
  cursor: not-allowed;
}
${CARD}:focus-visible {
  outline: none;
}
${CARD}:focus-visible ${DOT} {
  box-shadow: ${focusRingShadow('--bloom-radio-ring')};
}
@media (prefers-reduced-motion: reduce) {
${CARD} {
  transition: none !important;
}
}`;

const RadioCardComponent = function RadioCard<Value extends string = string>({
  value,
  selected,
  onSelect,
  title,
  description,
  disabled = false,
  color,
  style,
  accessibilityLabel,
  testID,
}: RadioCardProps<Value>) {
  const theme = useTheme();
  const ringOffset = useRingOffsetStyle();
  useInteractiveWebCss(STYLE_ID, CARD_CSS);
  const { state: hovered, onIn: onHoverIn, onOut: onHoverOut } = useInteractionState();
  const { state: pressed, onIn: onPressIn, onOut: onPressOut } = useInteractionState();
  const highlighted = !disabled && (hovered || pressed);

  const paint = useMemo(() => {
    const { accent, neutral: n } = resolveButtonRamps(theme);
    const dark = theme.isDark;
    return {
      border: dark ? n[700] : n[200],
      background: dark ? n[800] : theme.colors.card,
      // Dark `color-mix(in srgb, neutral-700 60%, transparent)` over the page.
      backgroundHover: dark ? mixColor(theme.colors.background, n[700], 0.6) : n[100],
      title: theme.colors.text,
      description: n[500],
      ring: color ?? accent[500],
    };
  }, [theme, color]);

  const handlePress = useCallback(() => {
    // A radio has no "off": re-choosing the chosen card is a no-op.
    if (disabled || selected) return;
    onSelect(value);
  }, [disabled, selected, onSelect, value]);

  const cardStyle: WebCssStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    width: '100%',
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    borderColor: paint.border,
    paddingLeft: 16,
    paddingRight: 20,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: highlighted ? paint.backgroundHover : paint.background,
    opacity: disabled ? DISABLED_OPACITY : 1,
    '--bloom-radio-ring': paint.ring,
    ...ringOffset,
    ...(IS_WEB
      ? {
          transitionProperty: 'background-color, border-color, color',
          transitionDuration: `${TRANSITION_MS}ms`,
          transitionTimingFunction: 'ease',
        }
      : null),
  };

  return (
    <Pressable
      {...webDataSet({ bloomRadioCard: '' })}
      style={[cardStyle, style]}
      onPress={handlePress}
      onPressIn={disabled ? undefined : onPressIn}
      onPressOut={disabled ? undefined : onPressOut}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      disabled={disabled}
      accessibilityRole="radio"
      // `aria-checked` is the one spelling both platforms honour — see `Radio`.
      aria-checked={selected}
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={description}
      testID={testID}
    >
      <View style={{ flexDirection: 'column', gap: 2, minWidth: 0, flexShrink: 1 }}>
        <Text variant="body-medium" numberOfLines={1} style={{ color: paint.title }}>
          {title}
        </Text>
        {description != null && (
          <Text variant="body-regular" numberOfLines={1} style={{ color: paint.description }}>
            {description}
          </Text>
        )}
      </View>
      <View style={{ flexShrink: 0, flexDirection: 'row', alignItems: 'center', paddingTop: 4, paddingBottom: 4 }}>
        <View
          {...webDataSet({ bloomRadioCardDot: '' })}
          style={{ borderRadius: DOT_SIZE / 2 }}
        >
          <RadioIndicator selected={selected} size={DOT_SIZE} selectedColor={color} />
        </View>
      </View>
    </Pressable>
  );
};

export const RadioCard = memo(RadioCardComponent) as typeof RadioCardComponent;
