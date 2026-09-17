import React, { memo, useCallback, useMemo } from 'react';
import { Platform, Pressable, View } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { useInteractionState } from '../hooks/use-interaction-state';
import { useInteractiveWebCss } from '../styles/interactive-web-css';
import type { WebCssStyle } from '../styles/web-view-style';
import {
  CHECKBOX_GLYPH_CSS,
  CHECKBOX_GLYPH_STYLE_ID,
  CheckboxGlyph,
  resolveCheckboxPaint,
  webDataSet,
} from './shared';
import type { CheckboxCardProps } from './types';

/**
 * `CheckboxCard`: a selectable card with the title and an optional
 * description on the left and the checkbox on the right. The whole card
 * toggles it.
 *
 *   card    radius 10, 1px border-button-default, pl 16 · pr 20 · py 12, gap 12
 *           background-primary-default; hover background-primary-hover
 *   title   body-medium, text-primary, one line
 *   desc    body-regular, text-secondary, one line, 2px under the title
 *   box     the medium `CheckboxGlyph`, 4px above and below (`py-1`), taking
 *           the card's hover paint
 *   disabled the whole card at 50% (and the box its own 50% inside it),
 *           not-allowed cursor
 *
 * Colour-only hover and no press scale; native, which has no hover, borrows
 * the hover paint while the card is held.
 */
const CARD_RADIUS = 10;
const TRANSITION_MS = 150;
const IS_WEB = Platform.OS === 'web';

const CARD_STYLE_ID = 'bloom-checkbox-card-web-css';
const CARD = '[data-bloom-checkbox-card]';
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
@media (prefers-reduced-motion: reduce) {
${CARD} {
  transition: none !important;
}
}`;

const CheckboxCardComponent: React.FC<CheckboxCardProps> = ({
  checked,
  onCheckedChange,
  title,
  description,
  disabled = false,
  indeterminate = false,
  color,
  style,
  accessibilityLabel,
  testID,
}) => {
  const theme = useTheme();
  useInteractiveWebCss(CHECKBOX_GLYPH_STYLE_ID, CHECKBOX_GLYPH_CSS);
  useInteractiveWebCss(CARD_STYLE_ID, CARD_CSS);
  const paint = useMemo(() => resolveCheckboxPaint(theme, color), [theme, color]);
  const { state: hovered, onIn: onHoverIn, onOut: onHoverOut } = useInteractionState();
  const { state: pressed, onIn: onPressIn, onOut: onPressOut } = useInteractionState();
  const highlighted = !disabled && (hovered || pressed);

  const handlePress = useCallback(() => {
    if (!disabled) onCheckedChange(!checked);
  }, [checked, disabled, onCheckedChange]);

  const cardStyle: WebCssStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    width: '100%',
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    borderColor: paint.cardBorder,
    paddingLeft: 16,
    paddingRight: 20,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: highlighted ? paint.cardBackgroundHover : paint.cardBackground,
    opacity: disabled ? 0.5 : 1,
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
      {...webDataSet({ bloomCheckboxCard: '', bloomCheckboxFocusable: '' })}
      style={[cardStyle, style]}
      onPress={handlePress}
      onPressIn={disabled ? undefined : onPressIn}
      onPressOut={disabled ? undefined : onPressOut}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      disabled={disabled}
      accessibilityRole="checkbox"
      // `aria-checked` is the one spelling both platforms honour — see `Checkbox`.
      aria-checked={indeterminate ? 'mixed' : checked}
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={description}
      testID={testID}
    >
      <View style={{ flexDirection: 'column', gap: 2, minWidth: 0, flexShrink: 1 }}>
        <Text variant="body-medium" numberOfLines={1} style={{ color: paint.text }}>
          {title}
        </Text>
        {description != null && (
          <Text variant="body-regular" numberOfLines={1} style={{ color: paint.description }}>
            {description}
          </Text>
        )}
      </View>
      <View style={{ flexShrink: 0, flexDirection: 'row', alignItems: 'center', paddingTop: 4, paddingBottom: 4 }}>
        <CheckboxGlyph
          size="medium"
          checked={checked}
          indeterminate={indeterminate}
          // The checkbox gets the card's state, so a disabled card's box is
          // dimmed twice: 50% on the box inside 50% on the card.
          disabled={disabled}
          highlighted={highlighted}
          paint={paint}
        />
      </View>
    </Pressable>
  );
};

export const CheckboxCard = memo(CheckboxCardComponent);
CheckboxCard.displayName = 'CheckboxCard';
