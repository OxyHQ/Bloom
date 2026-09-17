import React from 'react';
import { Platform, View } from 'react-native';

import { Badge } from '../badge';
import { resolveButtonRamps } from '../button/shared';
import { useControllableState } from '../hooks/use-controllable-state';
import {
  Select,
  SelectContent,
  SelectIcon,
  SelectItem,
  SelectItemText,
  SelectTrigger,
  SelectValue,
} from '../select';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import type { DataTableSelectOption, DataTableSelectProps } from './types';

/** `size-[18px]` — an option icon. */
const OPTION_ICON_SIZE = 18;

/**
 * A width class on a flex item: when the column is narrower than the select
 * (the table at its minimum width), the trigger shrinks — never below its own
 * content (`min-width: auto` on a CSS flex item). Web only; native keeps the
 * fixed width.
 */
const SHRINK_TO_CONTENT: WebCssStyle | null =
  Platform.OS === 'web'
    ? { flexShrink: 1, minWidth: 'min-content' as unknown as number, alignSelf: 'auto' }
    : null;

/** The row the trigger is a flex item of. */
const ROW = { flexDirection: 'row', alignSelf: 'stretch' } as const;

function OptionMark({ option, color }: { option: DataTableSelectOption; color: string }) {
  if (option.icon) {
    const Icon = option.icon;
    return <Icon width={OPTION_ICON_SIZE} height={OPTION_ICON_SIZE} fill={color} />;
  }
  if (option.dot) return <Badge dot color={option.dot} />;
  return null;
}

/**
 * The in-row select used in Bloom's dashboard tables: a `w-[Npx]` select
 * whose options lead with a `StatusDot` or an 18px icon, the trigger showing
 * the chosen option's mark `gap-[5px]` before its label. An option with an
 * icon trims the trigger's left inset to 8 (`pl-2`).
 */
export function DataTableSelect({
  label,
  options,
  value: valueProp,
  defaultValue,
  onValueChange,
  width,
  size = 'md',
  disabled,
  testID,
}: DataTableSelectProps) {
  const theme = useTheme();
  const { neutral } = resolveButtonRamps(theme);
  const [value, setValue] = useControllableState<string | undefined>({
    value: valueProp,
    defaultValue,
    onChange: (next) => {
      if (next !== undefined) onValueChange?.(next);
    },
  });
  const current = options.find((option) => option.value === value);

  return (
    <View style={ROW}>
      <Select value={value} onValueChange={setValue} size={size} disabled={disabled}>
        <SelectTrigger
          label={label}
          testID={testID}
          className={current?.icon ? 'pl-2' : undefined}
          style={[{ width }, SHRINK_TO_CONTENT]}
        >
          <SelectValue leading={current ? <OptionMark option={current} color={neutral[500]} /> : null} />
          <SelectIcon />
        </SelectTrigger>
        <SelectContent<DataTableSelectOption>
          label={label}
          items={[...options]}
          renderItem={(item) => (
            <SelectItem value={item.value} label={item.label} leading={<OptionMark option={item} color={neutral[500]} />}>
              <SelectItemText>{item.label}</SelectItemText>
            </SelectItem>
          )}
        />
      </Select>
    </View>
  );
}
