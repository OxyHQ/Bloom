import { normalizeBloomSize } from '../appearance/legacy';
import { useBloomAppearance } from '../appearance';
import { resolveBloomColors } from '../appearance/colors';
import React, { memo, useCallback, useMemo } from 'react';
import { View, Platform, Pressable } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import type { TypeScaleVariant } from '../typography';
import { TYPE_SCALE } from '../typography/scale';

import { space, DISABLED_OPACITY } from '../styles/tokens';
import { useRingOffsetStyle } from '../styles/surface-levels';
import { resolveButtonRamps } from '../button/shared';
import { focusRingShadow, interactiveWebCss, useInteractiveWebCss } from '../styles/interactive-web-css';
import type { WebCssStyle } from '../styles/web-view-style';
import { RadioIndicator } from '../radio-indicator';
import { useFieldMembership } from '../field/membership';
import { RadioCard } from './RadioCard';
import type { RadioGroupProps, RadioProps } from './types';

/**
 * The radio: the dot is `RadioIndicator`, this is the row.
 *
 *              small           medium        large
 *   dot        14              16            20
 *   label      body-2-medium   body-medium   headline-medium
 *   gap        8               8             8
 *
 * `large` extends the ramp beyond the standard two sizes — the same rungs
 * `Checkbox` uses, so a form mixing the two lines up. Disabled dims the whole
 * row to 50%. The radio has no hover or press paint, and no press scale.
 */
const SIZE_CONFIG: Record<
  NonNullable<RadioProps['size']>,
  { indicator: number; label: TypeScaleVariant; description: TypeScaleVariant }
> = {
  xs: { indicator: 12, label: 'caption-1-medium', description: 'caption-1-regular' },
  sm: { indicator: 14, label: 'body-2-medium', description: 'body-2-regular' },
  md: { indicator: 16, label: 'body-medium', description: 'body-regular' },
  lg: { indicator: 20, label: 'headline-medium', description: 'body-regular' },
};

/** The `gap-2` between the dot and its label, at every size. */
const LABEL_GAP = 8;

/** Space between the label and the description under it. */
const DESCRIPTION_GAP = 2;

const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 } as const;

// ---------------------------------------------------------------------------
//  Keyboard focus on web
//
//  The row is the focusable element, but the ring belongs on the DOT (`ring-2
//  ring-offset-2` — a white 2px offset in both modes, Tailwind's default): the row's own outline is suppressed and the ring is drawn
//  on the dot's wrapper while the row has keyboard focus. The hooks are `data-*`
//  attributes through `dataSet` — a class never reaches the DOM here; see
//  `chip/Chip.tsx`.
// ---------------------------------------------------------------------------

const STYLE_ID = 'bloom-radio-web-css';
const ROW = '[data-bloom-radio]';
const DOT = '[data-bloom-radio-dot]';

const BLOOM_RADIO_CSS = interactiveWebCss({
  selector: ROW,
  varPrefix: 'bloom-radio',
  base: `
    display: flex;
    align-items: flex-start;
    justify-content: flex-start;
    box-sizing: border-box;
  `,
  transition: 'none',
  hover: { declarations: 'opacity: 1;' },
  outlineOffset: 2,
  extraRules: `${ROW}:disabled,
${ROW}[aria-disabled="true"] {
  cursor: not-allowed;
}
${ROW}:focus-visible {
  outline: none;
}
${ROW}:focus-visible ${DOT} {
  box-shadow: ${focusRingShadow('--bloom-radio-ring')};
}`,
});

const IS_WEB = Platform.OS === 'web';

const RadioComponent = function Radio<Value extends string = string>({
  value,
  checked: checkedProp,
  selected,
  onValueChange: onValueChangeProp,
  onSelect,
  label,
  description,
  size: sizeProp,
  disabled = false,
  tone: toneProp,
  style,
  labelStyle,
  accessibilityLabel,
  nativeID,
  testID,
}: RadioProps<Value>) {
  const onValueChange = onValueChangeProp ?? onSelect;
  const checked = checkedProp ?? selected ?? false;
  const theme = useTheme();
  // ADJACENT label (see `field/membership.ts`); the field's `disabled` is a
  // constraint, so a radio inside a disabled field cannot re-enable itself.
  const field = useFieldMembership({
    accessibilityLabel,
    label,
    labelPlacement: 'adjacent',
    disabled,
    nativeID,
  });
  const isDisabled = field.disabled;
  const ringOffset = useRingOffsetStyle();
  const { size: scopedSize, tone } = useBloomAppearance({ size: normalizeBloomSize(sizeProp), tone: toneProp }, { size: 'md', tone: 'accent' });
  const size = scopedSize;
  const { background: color, foreground } = resolveBloomColors(theme.colors, tone, 'solid');
  useInteractiveWebCss(STYLE_ID, BLOOM_RADIO_CSS);
  const sizeConfig = SIZE_CONFIG[size];
  const { accent } = useMemo(() => resolveButtonRamps(theme), [theme]);
  const hasText = Boolean(label || description);

  const handlePress = useCallback(() => {
    // Re-choosing the chosen option is a no-op. A radio, unlike a checkbox, has
    // no "off" — firing here would make a group's `onValueChange` report a
    // change that did not happen.
    if (isDisabled || checked) return;
    onValueChange?.(value);
  }, [isDisabled, checked, onValueChange, value]);

  const rowStyle: WebCssStyle = {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: LABEL_GAP,
    // `opacity-50` on the whole row.
    opacity: isDisabled ? DISABLED_OPACITY : 1,
    // The `:focus-visible` ring colour, read by the adopted sheet.
    '--bloom-radio-ring': color ?? accent[500],
    ...ringOffset,
  };

  return (
    <Pressable
      {...(IS_WEB ? ({ dataSet: { bloomRadio: '' } } as Record<string, unknown>) : {})}
      style={[rowStyle, style]}
      onPress={handlePress}
      disabled={isDisabled}
      nativeID={field.nativeID}
      aria-describedby={field.describedBy}
      accessibilityRole="radio"
      // `aria-checked`, not `accessibilityState`: react-native-web never reads
      // the latter, so an option that set only it announced no state at all.
      // React Native folds `aria-checked` back into `accessibilityState`, so
      // this one prop is the spelling both platforms honour, and `disabled`
      // travels on the `disabled` prop, which both map.
      aria-checked={checked}
      accessibilityLabel={field.accessibilityLabel}
      hitSlop={HIT_SLOP}
      testID={testID}
    >
      <View
        {...(IS_WEB ? ({ dataSet: { bloomRadioDot: '' } } as Record<string, unknown>) : {})}
        style={{
          borderRadius: sizeConfig.indicator / 2,
          // Centre the dot on the label's first line box.
          marginTop: hasText ? (TYPE_SCALE[sizeConfig.label].lineHeight - sizeConfig.indicator) / 2 : 0,
        }}
      >
        <RadioIndicator selected={checked} size={sizeConfig.indicator} selectedColor={color} selectedForeground={foreground} />
      </View>

      {hasText && (
        <View style={{ flex: 1 }}>
          {label && (
            <Text variant={sizeConfig.label} style={[{ color: theme.colors.text }, labelStyle]}>
              {label}
            </Text>
          )}
          {description && (
            <Text
              variant={sizeConfig.description}
              style={{ color: theme.colors.textSecondary, marginTop: label ? DESCRIPTION_GAP : 0 }}
            >
              {description}
            </Text>
          )}
        </View>
      )}
    </Pressable>
  );
};

export const Radio = memo(RadioComponent) as typeof RadioComponent;

/**
 * A set of radios that own one value between them.
 *
 * The group exists because a lone radio cannot express the thing that makes a
 * radio a radio: exactly one of N. Rendering the options from data is also what
 * lets the group carry `role="radiogroup"` and its accessible name — a
 * screen reader announces "2 of 4" only when the options are inside one.
 */
const RadioGroupComponent = function RadioGroup<Value extends string = string>({
  label,
  value,
  onValueChange: onValueChangeProp,
  onSelect,
  options,
  size: sizeProp,
  disabled = false,
  tone: toneProp,
  style,
  labelStyle,
  variant = 'default',
  testID,
}: RadioGroupProps<Value>) {
  const onValueChange = onValueChangeProp ?? onSelect;
  // The group is one control made of several, so a `Field` around it names the
  // GROUP and disables every option — `multiple` is the field's side of that
  // (`docs/field.mdx`), and each radio keeps its own id and its own name.
  // `label` here is a NAME, not rendered text — the group draws no label of its
  // own — so it goes in as the caller's name and outranks the field's.
  const field = useFieldMembership({ accessibilityLabel: label, disabled });
  const isDisabled = field.disabled;
  const { size: scopedSize, tone } = useBloomAppearance({size: normalizeBloomSize(sizeProp), tone: toneProp}, {size: 'md', tone: 'accent'});
  const size = scopedSize;
  return (
    <View
      style={[{ gap: space.sm }, style]}
      accessibilityRole="radiogroup"
      accessibilityLabel={field.accessibilityLabel}
      aria-label={field.accessibilityLabel}
      aria-describedby={field.describedBy}
      aria-invalid={field.invalid || undefined}
      testID={testID}
    >
      {options.map((option) =>
        variant === 'card' ? (
          <RadioCard
            key={option.value}
            value={option.value}
            checked={option.value === value}
            onValueChange={onValueChange}
            title={option.label ?? option.value}
            description={option.description}
            disabled={isDisabled || option.disabled === true}
            tone={tone}
            testID={option.testID}
          />
        ) : (
        <Radio
          key={option.value}
          value={option.value}
          checked={option.value === value}
          onValueChange={onValueChange}
          label={option.label}
          description={option.description}
          size={size}
          disabled={isDisabled || option.disabled === true}
          tone={tone}
          labelStyle={labelStyle}
          testID={option.testID}
        />
        ),
      )}
    </View>
  );
};

export const RadioGroup = memo(RadioGroupComponent) as typeof RadioGroupComponent;
