/**
 * Lean entry for the committing settings fields, to pair with
 * `settings-modal/modal` or `settings-modal/rows`. Kept apart from the modal
 * shell because `SettingsDateField` links the calendar, `Popover` and
 * `TextField`, which a modal of switches and values never needs.
 */
export { SettingsTextField, SettingsDateField } from './SettingsFields';
export type { SettingsDateFieldProps, SettingsTextFieldProps } from './types';
