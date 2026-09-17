import React, { memo, useEffect, useMemo, type ReactNode } from 'react';
import { Platform, Pressable, View } from 'react-native';

import { resolveButtonRamps } from '../button/shared';
import { useInteractionState } from '../hooks/use-interaction-state';
import { RiCheckLine } from '../icons/remix/RiCheckLine';
import { RadioIndicator } from '../radio-indicator';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import type { WebCssStyle } from '../styles/web-view-style';
import { webDataSet } from '../styles/web-data';
import type { Theme } from '../theme/types';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import type { ListingEditorIcon } from './types';
import { DISABLED_OPACITY } from '../styles/tokens';

/**
 * The large selectable card the listing editor's pickers are built from.
 * Internal: `OfferingEditor` uses it as a checkbox, `AddressPrecisionPicker`
 * as a radio.
 *
 *   card       radius 16, 1px neutral-200 border (dark neutral-700), the card
 *              colour as fill in light (none in dark);
 *              selected: a 2px text-primary border (the padding gives the extra
 *              pixel back, so nothing moves)
 *   hover      border neutral-400 (dark neutral-500) and a neutral-50 wash
 *              (dark neutral-900) — web pointer; native borrows it while held
 *   head       p 20 (16 compact): an optional 44 icon tile (radius 12,
 *              neutral-100 / dark neutral-800; selected: text-primary with the
 *              icon in the page colour), title headline-semibold, description
 *              body-regular text-secondary, the indicator on the right
 *   indicator  `check`: a 22 circle, 1.5px neutral-300 ring at rest, filled
 *              text-primary with a page-coloured tick when selected;
 *              `radio`: Bloom's `RadioIndicator` at 20 in text-primary
 *   media      an optional node above the head, inset 12, radius 12
 *   body       `children`, under a hairline, p 20 — rendered OUTSIDE the
 *              pressable, so fields inside are not nested in a control
 *   disabled   50% opacity
 *
 * Colour-only hover; no scale.
 */

const IS_WEB = Platform.OS === 'web';
export const SELECTION_CARD_RADIUS = 16;

const STYLE_ID = 'bloom-listing-editor-card-web-css';
const HEAD = '[data-bloom-selection-card-head]';
const CSS = `
${HEAD} {
  outline: none;
  cursor: pointer;
}
${HEAD}[aria-disabled="true"] {
  cursor: default;
}
${HEAD}:focus-visible {
  outline: 2px solid var(--bloom-selection-card-ring, currentColor);
  outline-offset: 3px;
}
`;

export interface SelectionPaint {
  /** The card's own fill: the card colour in light, none in dark. */
  fill: string;
  border: string;
  borderHover: string;
  borderSelected: string;
  wash: string;
  iconTile: string;
  icon: string;
  text: string;
  textSecondary: string;
  indicatorRing: string;
  page: string;
  hairline: string;
  ring: string;
  error: string;
}

export function resolveSelectionPaint(theme: Theme): SelectionPaint {
  const { accent, neutral: n } = resolveButtonRamps(theme);
  const dark = theme.isDark;
  return {
    fill: dark ? 'transparent' : theme.colors.card,
    border: dark ? n[700] : n[200],
    borderHover: dark ? n[500] : n[400],
    borderSelected: theme.colors.text,
    wash: dark ? n[900] : n[50],
    iconTile: dark ? n[800] : n[100],
    icon: theme.colors.text,
    text: theme.colors.text,
    textSecondary: theme.colors.textSecondary,
    indicatorRing: dark ? n[600] : n[300],
    page: theme.colors.background,
    hairline: dark ? n[800] : n[200],
    ring: accent[500],
    error: theme.colors.error,
  };
}

export function useSelectionCardCss() {
  useEffect(() => {
    if (IS_WEB) adoptStyleSheet(STYLE_ID, CSS);
  }, []);
}

/** The 22px check circle. */
export function CheckCircle({ selected, paint, size = 22 }: { selected: boolean; paint: SelectionPaint; size?: number }) {
  return (
    <View
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: selected ? 0 : 1.5,
        borderColor: paint.indicatorRing,
        backgroundColor: selected ? paint.borderSelected : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {selected ? <RiCheckLine width={size - 8} height={size - 8} fill={paint.page} /> : null}
    </View>
  );
}

export interface SelectionCardProps {
  /** `multiple` is a `checkbox`, `single` a `radio`. */
  selection: 'multiple' | 'single';
  selected: boolean;
  onPress: () => void;
  title: string;
  description?: string;
  icon?: ListingEditorIcon;
  indicator?: 'check' | 'radio';
  media?: ReactNode;
  compact?: boolean;
  disabled?: boolean;
  children?: ReactNode;
  accessibilityLabel?: string;
  style?: WebCssStyle;
  testID?: string;
}

function SelectionCardComponent({
  selection,
  selected,
  onPress,
  title,
  description,
  icon: Icon,
  indicator = selection === 'single' ? 'radio' : 'check',
  media,
  compact = false,
  disabled = false,
  children,
  accessibilityLabel,
  style,
  testID,
}: SelectionCardProps) {
  const theme = useTheme();
  useSelectionCardCss();
  const paint = useMemo(() => resolveSelectionPaint(theme), [theme]);
  const { state: hovered, onIn: onHoverIn, onOut: onHoverOut } = useInteractionState();
  const { state: pressed, onIn: onPressIn, onOut: onPressOut } = useInteractionState();
  const highlighted = !disabled && (hovered || pressed);

  const borderWidth = selected ? 2 : 1;
  const inset = (compact ? 16 : 20) - (borderWidth - 1);
  const hasBody = children != null && children !== false;

  const cardStyle: WebCssStyle = {
    borderRadius: SELECTION_CARD_RADIUS,
    backgroundColor: paint.fill,
    borderWidth,
    borderColor: selected ? paint.borderSelected : highlighted ? paint.borderHover : paint.border,
    opacity: disabled ? DISABLED_OPACITY : 1,
    ...(IS_WEB ? { transitionProperty: 'border-color, background-color', transitionDuration: '120ms' } : null),
    ...style,
  };

  const headStyle: WebCssStyle = {
    borderTopLeftRadius: SELECTION_CARD_RADIUS - borderWidth,
    borderTopRightRadius: SELECTION_CARD_RADIUS - borderWidth,
    borderBottomLeftRadius: hasBody ? 0 : SELECTION_CARD_RADIUS - borderWidth,
    borderBottomRightRadius: hasBody ? 0 : SELECTION_CARD_RADIUS - borderWidth,
    backgroundColor: highlighted && !selected ? paint.wash : 'transparent',
    '--bloom-selection-card-ring': paint.ring,
  };

  const headContent = (
    <>
      {media ? (
        <View
          style={{
            marginTop: 12 - (borderWidth - 1),
            marginLeft: 12 - (borderWidth - 1),
            marginRight: 12 - (borderWidth - 1),
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          {media}
        </View>
      ) : null}
      <View
        style={{
          flexDirection: 'row',
          alignItems: media ? 'flex-start' : 'center',
          gap: 14,
          paddingTop: media ? 14 : inset,
          paddingBottom: inset,
          paddingLeft: inset,
          paddingRight: inset,
        }}
      >
        {indicator === 'radio' && media ? (
          <View style={{ paddingTop: 2 }}>
            <RadioIndicator selected={selected} size={20} selectedColor={paint.borderSelected} />
          </View>
        ) : null}
        {Icon ? (
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: selected ? paint.borderSelected : paint.iconTile,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon width={22} height={22} fill={selected ? paint.page : paint.icon} />
          </View>
        ) : null}
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text variant="headline-semibold" style={{ color: paint.text }}>
            {title}
          </Text>
          {description ? (
            <Text variant="body-regular" style={{ color: paint.textSecondary }}>
              {description}
            </Text>
          ) : null}
        </View>
        {indicator === 'check' ? <CheckCircle selected={selected} paint={paint} /> : null}
        {indicator === 'radio' && !media ? (
          <RadioIndicator selected={selected} size={20} selectedColor={paint.borderSelected} />
        ) : null}
      </View>
    </>
  );

  // The role is spelled as a literal on each branch, so the source census can
  // see that each one carries its state and its name.
  const headProps = {
    accessibilityHint: description,
    accessibilityState: { checked: selected, disabled },
    'aria-disabled': disabled || undefined,
    disabled,
    onPress,
    onPressIn,
    onPressOut,
    onHoverIn,
    onHoverOut,
    ...webDataSet({ bloomSelectionCardHead: '' }),
    testID: testID ? `${testID}-control` : undefined,
    style: headStyle,
  };

  return (
    <View testID={testID} style={cardStyle}>
      {selection === 'multiple' ? (
        <Pressable role="checkbox" accessibilityLabel={accessibilityLabel ?? title} aria-checked={selected} {...headProps}>
          {headContent}
        </Pressable>
      ) : (
        <Pressable role="radio" accessibilityLabel={accessibilityLabel ?? title} aria-checked={selected} {...headProps}>
          {headContent}
        </Pressable>
      )}
      {hasBody ? (
        <View
          testID={testID ? `${testID}-body` : undefined}
          style={{
            borderTopWidth: 1,
            borderTopColor: paint.hairline,
            paddingTop: inset,
            paddingBottom: inset,
            paddingLeft: inset,
            paddingRight: inset,
            gap: 20,
          }}
        >
          {children}
        </View>
      ) : null}
    </View>
  );
}

export const SelectionCard = memo(SelectionCardComponent);
SelectionCard.displayName = 'SelectionCard';
