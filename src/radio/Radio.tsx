import { useRadioGroupItem } from './use-radio-group-item';
import { RadioGroupContext } from './context';
import { useDirectionProps, useIsRtl } from '../hooks/use-is-rtl';
import { useControllableState } from '../hooks/use-controllable-state';
import { useBloomAppearance } from '../appearance';
import { resolveBloomColors } from '../appearance/colors';
import React, { memo, useCallback, useMemo, useRef, type KeyboardEvent } from 'react';
import { View, Platform } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import type { TypeScaleVariant } from '../typography';
import { TYPE_SCALE } from '../typography/scale';

import { space, DISABLED_OPACITY } from '../styles/tokens';
import { useRingOffsetStyle } from '../styles/surface-levels';
import { resolveButtonRamps } from '../button/shared';
import {
  focusRingShadow,
  interactiveWebCss,
  useInteractiveWebCss,
} from '../styles/interactive-web-css';
import type { WebCssStyle } from '../styles/web-view-style';
import { RadioIndicator } from '../radio-indicator';
import { useFieldMembership } from '../field/membership';
import { RadioCard } from './RadioCard';
import { RadioChip } from './RadioChip';
import { RadioHost, RadioGroupHost, RadioLabel } from './RadioHost';
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

const BLOOM_RADIO_CSS = `@layer base {${interactiveWebCss({
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
})}}`;

const IS_WEB = Platform.OS === 'web';

const RadioComponent = function Radio<Value extends string = string>({
  value,
  checked: checkedProp,
  onValueChange,
  label,
  labelContent,
  description,
  size: sizeProp,
  disabled = false,
  tone: toneProp,
  style,
  labelStyle,
  className,
  labelClassName,
  accessibilityLabel,
  nativeID,
  testID,
}: RadioProps<Value>) {
  const checked = checkedProp ?? false;
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
  const { size: scopedSize, tone } = useBloomAppearance(
    { size: sizeProp, tone: toneProp },
    { size: 'md', tone: 'accent' },
  );
  const size = scopedSize;
  const { background: color, foreground } = resolveBloomColors(theme.colors, tone, 'solid');
  useInteractiveWebCss(STYLE_ID, BLOOM_RADIO_CSS);
  const sizeConfig = SIZE_CONFIG[size];
  const { accent } = useMemo(() => resolveButtonRamps(theme), [theme]);
  const hasLabel = labelContent != null || Boolean(label);
  const hasText = hasLabel || Boolean(description);

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

  const spaceKey = useRadioGroupItem(value, isDisabled, handlePress);

  return (
    <RadioHost
      className={className}
      {...spaceKey}
      {...(IS_WEB ? ({ dataSet: { bloomRadio: '' } } as Record<string, unknown>) : {})}
      style={[
        className
          ? { '--bloom-radio-ring': rowStyle['--bloom-radio-ring'], ...ringOffset }
          : rowStyle,
        style,
      ]}
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
          marginTop: hasText
            ? (TYPE_SCALE[sizeConfig.label].lineHeight - sizeConfig.indicator) / 2
            : 0,
        }}
      >
        <RadioIndicator
          selected={checked}
          size={sizeConfig.indicator}
          selectedColor={color}
          selectedForeground={foreground}
        />
      </View>

      {hasText && (
        <View style={{ flex: 1 }}>
          {labelContent != null ? (
            <View
              pointerEvents="none"
              aria-hidden
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            >
              {labelContent}
            </View>
          ) : (
            label && (
              <RadioLabel
                className={labelClassName}
                variant={sizeConfig.label}
                style={[!labelClassName && { color: theme.colors.text }, labelStyle]}
              >
                {label}
              </RadioLabel>
            )
          )}
          {description && (
            <Text
              variant={sizeConfig.description}
              style={{
                color: theme.colors.textSecondary,
                marginTop: hasLabel ? DESCRIPTION_GAP : 0,
              }}
            >
              {description}
            </Text>
          )}
        </View>
      )}
    </RadioHost>
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
const RadioGroupComponent = function RadioGroup<Value extends string = string>(
  props: RadioGroupProps<Value>,
) {
  const {
    label,
    value: valueProp,
    defaultValue,
    onValueChange: onValueChangeProp,
    options,
    size: sizeProp,
    disabled = false,
    tone: toneProp,
    style,
    labelStyle,
    optionStyle,
    className,
    optionClassName,
    optionLabelClassName,
    appearance,
    renderOption,
    variant = 'default',
    testID,
  } = props;
  const [value, setValue] = useControllableState<Value | undefined>({
    value: valueProp,
    defaultValue,
    controlled: Object.prototype.hasOwnProperty.call(props, 'value'),
    onChange: (next) => {
      if (next !== undefined) onValueChangeProp?.(next);
    },
  });
  const onValueChange = (next: Value) => setValue(next);
  // The group is one control made of several, so a `Field` around it names the
  // GROUP and disables every option — `multiple` is the field's side of that
  // (`docs/field.mdx`), and each radio keeps its own id and its own name.
  // `label` here is a NAME, not rendered text — the group draws no label of its
  // own — so it goes in as the caller's name and outranks the field's.
  const field = useFieldMembership({ accessibilityLabel: label, disabled });
  const isDisabled = field.disabled;
  const { size: scopedSize, tone } = useBloomAppearance(
    { size: sizeProp, tone: toneProp },
    { size: 'md', tone: variant === 'chip' ? 'neutral' : 'accent' },
  );
  const size = scopedSize;
  const rtl = useIsRtl();
  const direction = useDirectionProps();
  const nodes = useRef(new Map<string, React.RefObject<View | null>>());
  const controlRef = useCallback((option: string) => {
    let ref = nodes.current.get(option);
    if (!ref) {
      ref = React.createRef<View>();
      nodes.current.set(option, ref);
    }
    return ref;
  }, []);
  React.useEffect(() => {
    const currentValues = new Set<string>(options.map((option) => option.value));
    for (const key of nodes.current.keys()) if (!currentValues.has(key)) nodes.current.delete(key);
  }, [options]);
  const enabledValues = options
    .filter((option) => !isDisabled && !option.disabled)
    .map((option) => option.value);
  const tabValue = value !== undefined && enabledValues.includes(value) ? value : enabledValues[0];
  const register = useCallback(
    (option: string, node: View | null) => {
      controlRef(option).current = node;
    },
    [controlRef],
  );
  const onKeyDown = (current: string, event: KeyboardEvent<HTMLElement>) => {
    if (
      event.target !== event.currentTarget ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      !enabledValues.length
    )
      return;
    const position = enabledValues.findIndex((option) => option === current);
    if (position < 0) return;
    let target: Value | undefined;
    if (event.key === 'Home') target = enabledValues[0];
    else if (event.key === 'End') target = enabledValues[enabledValues.length - 1];
    else {
      const delta =
        event.key === 'ArrowDown'
          ? 1
          : event.key === 'ArrowUp'
            ? -1
            : event.key === 'ArrowRight'
              ? rtl
                ? -1
                : 1
              : event.key === 'ArrowLeft'
                ? rtl
                  ? 1
                  : -1
                : 0;
      if (!delta) return;
      target = enabledValues[(position + delta + enabledValues.length) % enabledValues.length];
    }
    if (target === undefined) return;
    event.preventDefault();
    event.stopPropagation();
    const node: unknown = nodes.current.get(target)?.current;
    if (typeof HTMLElement !== 'undefined' && node instanceof HTMLElement)
      node.focus({ preventScroll: true });
    if (target !== value) onValueChange(target);
  };
  return (
    <RadioGroupContext.Provider value={{ tabValue, register, onKeyDown }}>
      <RadioGroupHost
        {...direction}
        className={className}
        style={[
          !className && {
            gap: space.sm,
            ...(variant === 'chip'
              ? { flexDirection: 'row' as const, flexWrap: 'wrap' as const }
              : {}),
          },
          style,
        ]}
        accessibilityRole="radiogroup"
        accessibilityLabel={field.accessibilityLabel}
        aria-label={field.accessibilityLabel}
        aria-describedby={field.describedBy}
        aria-invalid={field.invalid || undefined}
        aria-disabled={isDisabled || undefined}
        aria-required={field.required || undefined}
        testID={testID}
      >
        {options.map((option) => {
          const checked = option.value === value;
          const optionDisabled = isDisabled || option.disabled === true;
          const state = { checked, disabled: optionDisabled, controlRef: controlRef(option.value) };
          const optionClasses =
            typeof optionClassName === 'function' ? optionClassName(state) : optionClassName;
          const labelClasses =
            typeof optionLabelClassName === 'function'
              ? optionLabelClassName(state)
              : optionLabelClassName;
          const ownedControl =
            variant === 'chip' ? (
              <RadioChip
                key={option.value}
                value={option.value}
                checked={checked}
                onValueChange={onValueChange}
                label={option.label}
                labelContent={option.labelContent}
                accessibilityLabel={option.accessibilityLabel}
                description={option.description}
                disabled={optionDisabled}
                size={size}
                tone={tone}
                appearance={appearance}
                style={optionStyle}
                labelStyle={labelStyle}
                className={optionClasses}
                labelClassName={labelClasses}
                testID={option.testID}
              />
            ) : variant === 'card' ? (
              <RadioCard
                key={option.value}
                value={option.value}
                checked={checked}
                onValueChange={onValueChange}
                title={option.label ?? option.value}
                labelContent={option.labelContent}
                accessibilityLabel={option.accessibilityLabel}
                description={option.description}
                disabled={optionDisabled}
                tone={tone}
                style={optionStyle}
                labelStyle={labelStyle}
                className={optionClasses}
                labelClassName={labelClasses}
                testID={option.testID}
              />
            ) : (
              <Radio
                key={option.value}
                value={option.value}
                checked={checked}
                onValueChange={onValueChange}
                label={option.label}
                labelContent={option.labelContent}
                accessibilityLabel={option.accessibilityLabel}
                description={option.description}
                size={size}
                disabled={optionDisabled}
                tone={tone}
                labelStyle={labelStyle}
                style={optionStyle}
                className={optionClasses}
                labelClassName={labelClasses}
                testID={option.testID}
              />
            );
          return (
            <React.Fragment key={option.value}>
              {renderOption ? renderOption(option, ownedControl, state) : ownedControl}
            </React.Fragment>
          );
        })}
      </RadioGroupHost>
    </RadioGroupContext.Provider>
  );
};

export const RadioGroup = memo(RadioGroupComponent) as typeof RadioGroupComponent;
