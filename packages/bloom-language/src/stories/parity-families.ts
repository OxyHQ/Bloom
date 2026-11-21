import type { ParityCase } from '../../parity/support/cases';
import { TEXT_CASES } from '../../parity/text.cases';
import { ICON_CASES, ICON_CASES_EVERY } from '../../parity/icon.cases';
import { MATERIAL_CASES } from '../../parity/material.cases';
import { AVATAR_CASES } from '../../parity/avatar.cases';
import { PIECES_CASES } from '../../parity/pieces.cases';
import { BUTTON_CASES } from '../../parity/button.cases';
import { LAYOUT_CASES } from '../../parity/layout.cases';
import { VARIANT_CASES } from '../../parity/variants.cases';
import { INPUT_CASES } from '../../parity/inputs.cases';
import { CONTAINER_CASES } from '../../parity/containers.cases';
import { OVERLAY_CASES } from '../../parity/overlays.cases';
import { SCREEN_CASES } from '../../parity/screen.cases';
import { SHEET_CASES } from '../../parity/sheet.cases';
import { NAVIGATION_CASES } from '../../parity/navigation.cases';
import { COMMAND_CASES } from '../../parity/command.cases';
import { SHELL_CASES } from '../../parity/shell.cases';
import { TOOLBAR_CASES } from '../../parity/toolbar.cases';
import { SETTINGS_CASES } from '../../parity/settings.cases';
import { DATE_PICKER_CASES } from '../../parity/date-picker.cases';
import { RATING_CASES } from '../../parity/rating.cases';

/** Every parity family's cases, by the name a story and a frame's URL give it. */
export const FAMILIES = {
  text: TEXT_CASES,
  icons: ICON_CASES,
  everyIcon: ICON_CASES_EVERY,
  material: MATERIAL_CASES,
  avatars: AVATAR_CASES,
  pieces: PIECES_CASES,
  buttons: BUTTON_CASES,
  layout: LAYOUT_CASES,
  variants: VARIANT_CASES,
  input: INPUT_CASES,
  container: CONTAINER_CASES,
  overlays: OVERLAY_CASES,
  screen: SCREEN_CASES,
  sheet: SHEET_CASES,
  navigation: NAVIGATION_CASES,
  command: COMMAND_CASES,
  shell: SHELL_CASES,
  toolbar: TOOLBAR_CASES,
  settings: SETTINGS_CASES,
  datePicker: DATE_PICKER_CASES,
  rating: RATING_CASES,
} satisfies Record<string, readonly ParityCase[]>;
export type Family = keyof typeof FAMILIES;
export type Side = 'bloom' | 'language';
