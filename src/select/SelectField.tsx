import type React from 'react';

import { Field } from '../field';
import { SelectItemIndicator, SelectItemText } from './shared';
import type {
  SelectContentProps,
  SelectFieldProps,
  SelectIconProps,
  SelectItemProps,
  SelectOption,
  SelectProps,
  SelectTriggerProps,
  SelectValueProps,
} from './types';

/** One platform's own `Select` parts, which the compositions over `Select` are built from. */
export type SelectParts = {
  Select: (props: SelectProps) => React.ReactNode;
  SelectTrigger: (props: SelectTriggerProps) => React.ReactNode;
  SelectValue: (props: SelectValueProps) => React.ReactNode;
  SelectIcon: (props: SelectIconProps) => React.ReactNode;
  SelectContent: <T>(props: SelectContentProps<T>) => React.ReactNode;
  SelectItem: (props: SelectItemProps) => React.ReactNode;
};

/**
 * `SelectField`'s composition, drawn with the `parts` of one platform's
 * `Select`. Each fork's `SelectField` renders it with its own parts, so the web
 * field opens the anchored list and the native one the sheet.
 *
 * A component at module scope that takes the parts, never one a factory
 * builds: the React Compiler takes a factory's parameters for module globals,
 * and its function outlining moved `renderItem` to module scope, where the
 * factory's `SelectItem` did not exist (`SelectItem is not defined`). Taken as
 * a prop, the parts are inputs the compiler tracks.
 *
 * The trigger takes its name, description, invalid and disabled state from the
 * `Field` around it (`useFieldMembership`), so none of them is passed twice.
 */
export function SelectFieldFromParts<T extends string>({
  parts,
  ...props
}: SelectFieldProps<T> & { parts: SelectParts }) {
  const { Select, SelectTrigger, SelectValue, SelectIcon, SelectContent, SelectItem } = parts;
  const {
    label,
    items,
    defaultValue,
    onValueChange,
    placeholder,
    description,
    error,
    required,
    disabled,
    size,
    style,
    testID,
  } = props;
  const controlled = 'value' in props;
  return (
    <Field
      label={label}
      description={description}
      error={error}
      required={required}
      disabled={disabled}
      style={style}
    >
      <Select
        {...(controlled ? { value: props.value } : null)}
        defaultValue={defaultValue}
        onValueChange={onValueChange as ((value: string) => void) | undefined}
        disabled={disabled}
        size={size}
      >
        <SelectTrigger testID={testID}>
          <SelectValue placeholder={placeholder} />
          <SelectIcon />
        </SelectTrigger>
        <SelectContent<SelectOption<T>>
          label={label}
          items={items}
          renderItem={(item) => (
            <SelectItem value={item.value} label={item.label} disabled={item.disabled}>
              <SelectItemIndicator />
              <SelectItemText>{item.label}</SelectItemText>
            </SelectItem>
          )}
        />
      </Select>
    </Field>
  );
}
