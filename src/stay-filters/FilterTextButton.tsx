import React, { memo, useEffect, useMemo } from 'react';
import { Pressable } from 'react-native';

import { resolveButtonRamps } from '../button/shared';
import { FOCUS_RING_OFFSET_COLOR } from '../checkbox/shared';
import { useInteractionState } from '../hooks/use-interaction-state';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import type { WebCssStyle } from '../styles/web-view-style';
import { webDataSet } from '../styles/web-data';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';

/**
 * The underlined text action of a filters surface ("Clear all", "Show more").
 * Internal.
 *
 *   label     body-semibold, text-primary, underlined
 *   hover     text-secondary (web pointer); press the same — colour only
 *   disabled  text-tertiary, not pressable
 *   target    8px of padding around the label, taken back out with negative
 *             margins so the underline still aligns with the content edge
 *
 * Why not `Button`: its `link` variant paints the accent (or neutral-500) and
 * underlines only on hover; here the underline IS the affordance at rest and the
 * label stays the reading colour, so it sits quietly beside the primary action.
 */

const STYLE_ID = 'bloom-filter-text-button-web-css';
const SELECTOR = '[data-bloom-filter-text-button]';
const CSS = `
${SELECTOR} {
  outline: none;
  cursor: pointer;
}
${SELECTOR}[aria-disabled="true"] {
  cursor: default;
}
${SELECTOR}:focus-visible {
  box-shadow: 0 0 0 2px ${FOCUS_RING_OFFSET_COLOR}, 0 0 0 4px var(--bloom-filter-text-button-ring, currentColor);
}
`;

const PAD = 8;

export interface FilterTextButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  /** Set for a disclosure ("Show more"); emitted as `aria-expanded`. */
  expanded?: boolean;
  testID?: string;
}

function FilterTextButtonComponent({ label, onPress, disabled = false, expanded, testID }: FilterTextButtonProps) {
  const theme = useTheme();
  useEffect(() => {
    adoptStyleSheet(STYLE_ID, CSS);
  }, []);
  const { accent } = useMemo(() => resolveButtonRamps(theme), [theme]);
  const { state: hovered, onIn: onHoverIn, onOut: onHoverOut } = useInteractionState();
  const { state: pressed, onIn: onPressIn, onOut: onPressOut } = useInteractionState();
  const color = disabled
    ? theme.colors.textTertiary
    : hovered || pressed
      ? theme.colors.textSecondary
      : theme.colors.text;

  const style: WebCssStyle = {
    paddingTop: PAD,
    paddingBottom: PAD,
    paddingLeft: PAD,
    paddingRight: PAD,
    marginTop: -PAD,
    marginBottom: -PAD,
    marginLeft: -PAD,
    marginRight: -PAD,
    borderRadius: 8,
    '--bloom-filter-text-button-ring': accent[500],
  };

  return (
    <Pressable
      role="button"
      accessibilityLabel={label}
      accessibilityState={expanded === undefined ? { disabled } : { disabled, expanded }}
      aria-expanded={expanded}
      aria-disabled={disabled || undefined}
      disabled={disabled}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      testID={testID}
      {...webDataSet({ bloomFilterTextButton: '' })}
      style={style}
    >
      <Text variant="body-semibold" style={{ color, textDecorationLine: 'underline' }}>
        {label}
      </Text>
    </Pressable>
  );
}

export const FilterTextButton = memo(FilterTextButtonComponent);
FilterTextButton.displayName = 'FilterTextButton';
