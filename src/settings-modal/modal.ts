/**
 * Lean entry for the settings dialog itself: the `SettingsModal` shell, the
 * row chrome its pages are built from, and the saved-toast hook. Same
 * components as `settings-modal`, without linking the Storage, Tools or Plan
 * pages (and with them `Select`, `FileUpload`, `Pagination`, `DropdownMenu`)
 * or the text/date fields' `TextField` and calendar. Metro does not tree-shake
 * barrel exports, so the full entry put all of those in any bundle that drew
 * the modal — and a lazy modal chunk sharing `Select` with another lazy chunk
 * hoisted it into the first-paint common chunk.
 */
export { SettingsModal } from './SettingsModal';
export {
  SettingsCard,
  SettingsRow,
  SettingsSection,
  SettingsSectionLabel,
  SettingsValueField,
} from './SettingsRows';
export { useSettingsSavedToast } from './context';

export type {
  SettingsCardProps,
  SettingsIcon,
  SettingsModalLabels,
  SettingsModalPage,
  SettingsModalPageNavigation,
  SettingsModalProps,
  SettingsNavGroup,
  SettingsNavItem,
  SettingsRowProps,
  SettingsSectionLabelProps,
  SettingsSectionProps,
  SettingsValueFieldProps,
} from './types';
