/**
 * The haptics settings row alone. `@oxy.so/bloom/preferences` also hands out the
 * video-autoplay row, whose `SettingsSelect` links `Select`; Metro does not
 * tree-shake barrel exports, so a screen with only this row imports it here.
 */
export { useHapticsSettingRow } from './use-haptics-setting-row';
