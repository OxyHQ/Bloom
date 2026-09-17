// Web variant of the `./composer-panel` barrel: binds the web panel
// (`ComposerPopover.web` → `floating/FloatingPanel`), which a bundler resolving
// `package.json#exports` reaches only through this file.
export { ComposerPanel } from './ComposerPanel.web';
export { ComposerAttachments } from './ComposerAttachments.web';
export { ModelPicker } from './ModelPicker.web';
export { ComposerPanelStatusTab } from './ComposerPanelStatusTab';
export { ComposerPill } from './ComposerPill.web';
export { ComposerStatusBar } from './ComposerStatusBar.web';
export {
  COMPOSER_PANEL_ADD_MENU,
  COMPOSER_PANEL_PERMISSIONS,
  MODEL_PICKER_EFFORT_LEVELS,
} from './shared';
export type {
  ComposerAttachmentsProps,
  ComposerPanelAddMenuGroup,
  ComposerPanelAddMenuRow,
  ComposerPanelAttachment,
  ComposerPanelAttachmentKind,
  ComposerPanelLabels,
  ComposerPanelPermissionOption,
  ComposerPanelProps,
  ComposerPanelStatusTabProps,
  ComposerPillLabels,
  ComposerPillProps,
  ComposerStatusBarFolder,
  ComposerStatusBarLabels,
  ComposerStatusBarProps,
  ModelPickerLabels,
  ModelPickerModel,
  ModelPickerProps,
  ModelPickerProvider,
} from './types';
