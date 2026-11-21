import type { ParityCase } from '../../parity/support/cases';
import { AVATAR_CASES } from '../../parity/avatar.cases';
import { BUTTON_CASES } from '../../parity/button.cases';
import { ICON_CASES, ICON_CASES_EVERY } from '../../parity/icon.cases';
import { LAYOUT_CASES } from '../../parity/layout.cases';
import { OVERLAY_CASES } from '../../parity/overlays.cases';
import { PIECES_CASES } from '../../parity/pieces.cases';
import { SCREEN_CASES } from '../../parity/screen.cases';
import { SHELL_CASES } from '../../parity/shell.cases';
import { SETTINGS_CASES } from '../../parity/settings.cases';
import { SHEET_CASES } from '../../parity/sheet.cases';
import { MATERIAL_CASES } from '../../parity/material.cases';
import { NAVIGATION_CASES } from '../../parity/navigation.cases';
import { TEXT_CASES } from '../../parity/text.cases';
import { TOOLBAR_CASES } from '../../parity/toolbar.cases';
import { VARIANT_CASES } from '../../parity/variants.cases';

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
  screen: SCREEN_CASES,
  sheet: SHEET_CASES,
  navigation: NAVIGATION_CASES,
  overlays: OVERLAY_CASES,
  settings: SETTINGS_CASES,
  shell: SHELL_CASES,
  toolbar: TOOLBAR_CASES,
} satisfies Record<string, readonly ParityCase[]>;
export type Family = keyof typeof FAMILIES;
export type Side = 'bloom' | 'language';
