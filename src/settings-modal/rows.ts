/**
 * Lightweight entry for settings rows drawn outside the dialog — a preference
 * card on a screen or in a sheet. Same components as `settings-modal`, without
 * linking `SettingsModal`, the storage/tools/plan pages or the date field's
 * calendar in Metro, which does not tree-shake barrel exports.
 */
export {
  SettingsCard,
  SettingsRow,
  SettingsSection,
  SettingsSectionLabel,
  SettingsValueField,
} from './SettingsRows';
export type {
  SettingsCardProps,
  SettingsIcon,
  SettingsRowProps,
  SettingsSectionLabelProps,
  SettingsSectionProps,
  SettingsValueFieldProps,
} from './types';
