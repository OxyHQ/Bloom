/**
 * `SettingsSelect` alone — the one select for a settings row — for an app that
 * draws its own rows. It links neither the rows (`settings-modal/rows`) nor the
 * dialog, which Metro would bundle through a barrel it cannot tree-shake.
 */
export { SettingsSelect } from './SettingsSelect';
export type { SettingsSelectProps } from './types';
