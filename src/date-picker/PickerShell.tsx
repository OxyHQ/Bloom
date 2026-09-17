import React, { useMemo } from 'react';
import { Platform, View, type StyleProp, type ViewStyle } from 'react-native';

import { Button } from '../button';
import type { ButtonIconComponent } from '../button/types';
import { RiCalendarLine as CalendarIcon } from '../icons/remix';
import { Popover, PopoverContent, PopoverTrigger } from '../popover';
import { useTheme } from '../theme/use-theme';
import { resolveCalendarPalette, type CalendarPalette } from './palette';

/**
 * The chrome both pickers share (`date-picker/shared.tsx`).
 *
 * TRIGGER: a secondary button (bordered card surface, shadow-xs,
 * neutral hover border) with a 20px calendar icon and a `px-1` label, 38 tall —
 * `p-2` around a 20px row plus the border. That IS Bloom's secondary `Button`
 * at medium, except the height, so it is one, held at 38. Like every Bloom
 * button it is a full pill rather than a 10px corner.
 *
 * POPUP: Bloom's `Popover`, so the overlay rules (portal, stack rank, outside
 * press and Escape) are the shared ones. On web its panel chrome is: radius 24,
 * no border, `background-secondary-default`, the two-layer
 * `shadow-dropdown`, 4px below the trigger and aligned to its end. On native the
 * popover is a bottom sheet, which keeps the sheet's own shape and takes only
 * the surface colour.
 */

/** 8px inset (`p-2`) + 20px row + 1px border top and bottom. */
const TRIGGER_HEIGHT = 38;

export function usePickerPalette(): CalendarPalette {
  const theme = useTheme();
  return useMemo(() => resolveCalendarPalette(theme), [theme]);
}

export function PickerShell({
  open,
  onOpenChange,
  triggerText,
  accessibilityLabel,
  disabled,
  palette,
  style,
  testID,
  trailingIcon,
  sideOffset = 4,
  children,
}: {
  /** A glyph after the label (the meeting scheduler's chevron). */
  trailingIcon?: ButtonIconComponent;
  /** Gap between trigger and popup. The pickers use 4, the scheduler 8. */
  sideOffset?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerText: string;
  accessibilityLabel: string;
  disabled?: boolean;
  palette: CalendarPalette;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  children: React.ReactNode;
}) {
  const panelStyle: ViewStyle =
    Platform.OS === 'web'
      ? {
          width: 'auto',
          // The shorthand, matching the panel class it overrides: a longhand
          // loses to react-native-web's `padding` shorthand on web.
          padding: 0,
          borderWidth: 0,
          borderRadius: 24,
          backgroundColor: palette.popup,
          boxShadow: palette.shadowDropdown,
        }
      : { backgroundColor: palette.popup };

  return (
    <Popover open={open} onOpenChange={disabled ? undefined : onOpenChange}>
      <PopoverTrigger asChild disabled={disabled}>
        <Button
          variant="secondary"
          size="medium"
          leadingIcon={CalendarIcon}
          trailingIcon={trailingIcon}
          disabled={disabled}
          accessibilityLabel={`${accessibilityLabel}, ${triggerText}`}
          style={[{ height: TRIGGER_HEIGHT }, style]}
          testID={testID}
        >
          {triggerText}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        label={accessibilityLabel}
        side="bottom"
        align="end"
        sideOffset={sideOffset}
        style={panelStyle}
      >
        {Platform.OS === 'web' ? children : <View style={{ alignItems: 'center' }}>{children}</View>}
      </PopoverContent>
    </Popover>
  );
}

/** Cancel / Apply — Bloom's `Button`s. `gap-2.5`. */
export function PickerActions({
  onCancel,
  onApply,
  applyDisabled,
  testID,
}: {
  onCancel: () => void;
  onApply: () => void;
  applyDisabled: boolean;
  testID?: string;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <Button variant="secondary" onPress={onCancel} testID={testID ? `${testID}-cancel` : undefined}>
        Cancel
      </Button>
      <Button onPress={onApply} disabled={applyDisabled} testID={testID ? `${testID}-apply` : undefined}>
        Apply
      </Button>
    </View>
  );
}
