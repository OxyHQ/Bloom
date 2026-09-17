import React, { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { borderRadius } from '../styles/tokens';
import { Calendar } from '../date-picker';
import { RiCalendarLine } from '../icons/remix';
import { Popover, PopoverContent, PopoverTrigger } from '../popover';
import { TextField, TextFieldIcon, TextFieldInput } from '../text-field';
import { Text } from '../typography';
import { useSettingsPalette, useSettingsSavedToast } from './context';
import type { SettingsDateFieldProps, SettingsTextFieldProps } from './types';
import { useSettingsWebCss, webData } from './web-css';

/**
 * The Profile page's editable controls.
 *
 * `SettingsTextField` is a small (32px) design-system
 * input, 202 wide, that edits a draft and COMMITS on submit or blur — and only
 * when the draft differs from the last commit, so focusing in and out stays
 * silent. A commit shows the modal's "Saved" toast.
 *
 * `SettingsDateField` is the Date of birth control: a 32px bordered trigger
 * (border/button, background/primary, shadow-xs, hover background/primary/hover;
 * 18px calendar icon in icon/primary, body-regular label with px 2) opening
 * Bloom's calendar in a popover. Bloom keeps the trigger a full pill.
 */

const FIELD_WIDTH = 202;

export function SettingsTextField({
  label,
  value,
  onCommit,
  showSavedToast = true,
  icon,
  placeholder,
  keyboardType,
  autoComplete,
  disabled,
  testID,
}: SettingsTextFieldProps) {
  const showSaved = useSettingsSavedToast();
  const [draft, setDraft] = useState(value);
  const committed = useRef(value);

  // A new committed value from the caller replaces the draft.
  useEffect(() => {
    committed.current = value;
    setDraft(value);
  }, [value]);

  const commit = () => {
    if (draft === committed.current) return;
    committed.current = draft;
    onCommit?.(draft);
    if (showSavedToast) showSaved();
  };

  return (
    <View style={styles.field}>
      <TextField size="small" disabled={disabled}>
        {icon ? <TextFieldIcon icon={icon} /> : null}
        <TextFieldInput
          label={label}
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={commit}
          onBlur={commit}
          placeholder={placeholder}
          keyboardType={keyboardType}
          autoComplete={autoComplete}
          blurOnSubmit
          testID={testID}
        />
      </TextField>
    </View>
  );
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatBirthDate(date: Date): string {
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function SettingsDateField({
  label,
  value,
  onChange,
  formatDate = formatBirthDate,
  minDate,
  maxDate,
  showSavedToast = true,
  testID,
}: SettingsDateFieldProps) {
  useSettingsWebCss();
  const palette = useSettingsPalette();
  const showSaved = useSettingsSavedToast();
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const text = formatDate(value);

  const panel: ViewStyle =
    Platform.OS === 'web'
      ? {
          width: 'auto',
          padding: 0,
          borderWidth: 0,
          borderRadius: 24,
          backgroundColor: palette.secondary,
          boxShadow: palette.shadowDropdown,
        }
      : { backgroundColor: palette.secondary };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild label={`${label}, ${text}`} style={CENTERED}>
        <Pressable
          role="button"
          accessibilityLabel={`${label}, ${text}`}
          {...webData({ bloomSettingsPress: '' })}
          onHoverIn={() => setHovered(true)}
          onHoverOut={() => setHovered(false)}
          testID={testID}
          style={[
            styles.dateTrigger,
            {
              borderColor: palette.borderButton,
              backgroundColor: hovered ? palette.primaryHover : palette.primary,
              boxShadow: palette.shadowXs,
            },
          ]}
        >
          <RiCalendarLine width={18} height={18} fill={palette.iconPrimary} />
          <Text variant="body-regular" numberOfLines={1} style={[styles.dateText, { color: palette.text }]}>
            {text}
          </Text>
        </Pressable>
      </PopoverTrigger>
      <PopoverContent label={label} side="bottom" align="end" sideOffset={4} style={panel}>
        <Calendar
          value={value}
          defaultMonth={value}
          minDate={minDate}
          maxDate={maxDate}
          accessibilityLabel={label}
          onChange={(date) => {
            setOpen(false);
            if (date.getTime() === value.getTime()) return;
            onChange(date);
            if (showSavedToast) showSaved();
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

const styles = StyleSheet.create({
  field: {
    width: FIELD_WIDTH,
    flexShrink: 0,
  },
  dateTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 32,
    width: FIELD_WIDTH,
    flexShrink: 0,
    borderWidth: 1,
    borderRadius: borderRadius.full,
    paddingLeft: 8,
    paddingRight: 8,
  },
  dateText: {
    paddingLeft: 2,
    paddingRight: 2,
    flexShrink: 1,
  },
});

/** Trigger slots default to `alignSelf: flex-start`; these sit centred in their row. */
const CENTERED = { alignSelf: 'center' } as const;
