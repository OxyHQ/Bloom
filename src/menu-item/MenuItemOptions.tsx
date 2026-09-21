import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { Button } from '../button';
import { Checkbox } from '../checkbox';
import { Divider } from '../divider';
import { Field } from '../field';
import { RadioGroup } from '../radio';
import type { RadioOption } from '../radio';
import { StepperRow } from '../stepper';
import { useSurfaceFill } from '../styles/surface-levels';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { MENU_ITEM_GROUP_GAP } from './constants';
import {
  describeOptionRule,
  optionDisabled,
  optionGroupRule,
  optionSubtitle,
  resolveMenuItemPaint,
  toggleOptionSelection,
} from './shared';
import type { MenuItemOptionGroup, MenuItemOptionsProps } from './types';

/**
 * Choosing a dish: the questions, how many of it, and what that comes to.
 *
 *   group     a `Field` whose label is the question and the rule ("Size
 *             Choose 1"), then the controls, then the group's error
 *   controls  `RadioGroup` when at most one may be chosen, a column of
 *             `Checkbox` otherwise. Bloom's own, through the `Field` contract —
 *             `docs/composition.mdx` names hand-rolled `role="radiogroup"` as
 *             debt and keeps a list of the three families that carry it, and
 *             this is not a fourth.
 *   quantity  `StepperRow`
 *   footer    ONE `Button`, full width, carrying the running price after the
 *             label ("Add to basket · €16.40")
 *
 * IT IS CONTENT, NOT A SURFACE. On a phone it is what a `BottomSheet` holds; on
 * a desktop what a `Dialog` holds. It paints no backdrop, claims no edge and
 * owns no open state, so the same tree works in either — building a sheet in
 * here would be a third one beside the two Bloom already ships.
 *
 * IT ADDS NOTHING UP. `total` is a string the app formatted, like every other
 * amount in Bloom's commerce families, because currency, locale, rounding and
 * how an option's delta applies are decisions this component cannot make for
 * three different apps.
 *
 * THE CAP IS ENFORCED BY DISABLING, NOT BY EVICTING. At a group's `max`, the
 * options that are not already chosen go disabled. A reader who presses a
 * fourth extra and watches the first one disappear has been told nothing about
 * the rule.
 */

function GroupLabel({ title, rule, color }: { title: string; rule: string; color: string }) {
  // A nested `Text`, not a `View`: `Label` renders its children INSIDE a `Text`,
  // and a `View` in a `Text` is a div in a span on web and unreliable on native.
  return (
    <>
      {title}
      <Text variant="body-regular" style={{ color }}>
        {`  ${rule}`}
      </Text>
    </>
  );
}

function OptionGroup({
  group,
  chosen,
  onValueChange,
  disabled,
  secondary,
  testID,
}: {
  group: MenuItemOptionGroup;
  chosen: ReadonlyArray<string>;
  onValueChange: MenuItemOptionsProps['onValueChange'];
  disabled: boolean;
  secondary: string;
  testID?: string;
}) {
  const rule = optionGroupRule(group);
  const ruleText = describeOptionRule(group);
  const label = <GroupLabel title={group.title} rule={ruleText} color={secondary} />;

  const body = rule.multiple ? (
    <View style={{ gap: 12 }} testID={testID ? `${testID}-options` : undefined}>
      {group.options.map((option) => (
        <Checkbox
          key={option.id}
          checked={chosen.includes(option.id)}
          onCheckedChange={() => onValueChange(group.id, toggleOptionSelection(chosen, option.id, rule))}
          label={option.label}
          description={optionSubtitle(option)}
          disabled={disabled || optionDisabled(option, chosen, rule)}
          testID={testID ? `${testID}-option-${option.id}` : undefined}
        />
      ))}
    </View>
  ) : (
    <RadioGroup
      // The field's label is a NODE, so it publishes no `labelText` for the
      // group to take its name from — the name is written here, and it carries
      // the rule as well, which the drawn label says and `aria-labelledby`
      // cannot reach on native.
      label={`${group.title}, ${ruleText}`}
      value={chosen[0]}
      onValueChange={(next: string) => onValueChange(group.id, toggleOptionSelection(chosen, next, rule))}
      options={group.options.map(
        (option): RadioOption => ({
          value: option.id,
          label: option.label,
          description: optionSubtitle(option),
          disabled: option.disabled,
          testID: testID ? `${testID}-option-${option.id}` : undefined,
        }),
      )}
      testID={testID ? `${testID}-options` : undefined}
    />
  );

  return (
    <Field
      label={label}
      error={group.error}
      required={rule.required}
      disabled={disabled}
      multiple={rule.multiple}
      testID={testID}
    >
      {body}
    </Field>
  );
}

function MenuItemOptionsComponent({
  groups,
  value,
  onValueChange,
  quantity,
  onQuantityChange,
  quantityLabel = 'Quantity',
  total,
  onSubmit,
  submitLabel = 'Add to basket',
  submitDisabled = false,
  disabled = false,
  header,
  accessibilityLabel = 'Options',
  style,
  testID,
}: MenuItemOptionsProps) {
  const theme = useTheme();
  const surface = useSurfaceFill();
  const paint = useMemo(() => resolveMenuItemPaint(theme, surface), [theme, surface]);

  return (
    <View style={[{ gap: MENU_ITEM_GROUP_GAP }, style]} testID={testID}>
      {header}
      {groups.length > 0 ? (
        <View
          role="group"
          accessibilityLabel={accessibilityLabel}
          aria-label={accessibilityLabel}
          style={{ gap: MENU_ITEM_GROUP_GAP }}
          testID={testID ? `${testID}-groups` : undefined}
        >
          {groups.map((group, index) => (
            <React.Fragment key={group.id}>
              {index > 0 ? <Divider color={paint.rule} /> : null}
              <OptionGroup
                group={group}
                chosen={value[group.id] ?? []}
                onValueChange={onValueChange}
                disabled={disabled}
                secondary={paint.textSecondary}
                testID={testID ? `${testID}-group-${group.id}` : undefined}
              />
            </React.Fragment>
          ))}
        </View>
      ) : null}

      {onQuantityChange ? (
        <StepperRow
          title={quantityLabel}
          value={quantity ?? 1}
          min={1}
          onValueChange={onQuantityChange}
          disabled={disabled}
          stepperStyle={{ flexShrink: 0 }}
          testID={testID ? `${testID}-quantity` : undefined}
        />
      ) : null}

      {onSubmit ? (
        <Button
          variant="primary"
          size="large"
          fullWidth
          disabled={disabled || submitDisabled}
          onPress={onSubmit}
          testID={testID ? `${testID}-submit` : undefined}
        >
          {total ? `${submitLabel} · ${total}` : submitLabel}
        </Button>
      ) : total ? (
        <View
          style={{ flexDirection: 'row', alignItems: 'baseline', gap: 12 }}
          testID={testID ? `${testID}-total` : undefined}
        >
          <Text variant="title-3-semibold" style={{ flex: 1, color: paint.text }}>
            {submitLabel}
          </Text>
          <Text
            variant="title-3-semibold"
            testID={testID ? `${testID}-total-amount` : undefined}
            style={{ color: paint.text, fontVariant: ['tabular-nums'] }}
          >
            {total}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export const MenuItemOptions = memo(MenuItemOptionsComponent);
MenuItemOptions.displayName = 'MenuItemOptions';
