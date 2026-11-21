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
import { STAT_BAR_CASES } from '../../parity/stat-bar.cases';
import { STICKER_CASES } from '../../parity/sticker.cases';
import { TABLE_CASES } from '../../parity/table.cases';
import { LIST_CASES } from '../../parity/list.cases';
import { CAROUSEL_CASES } from '../../parity/carousel.cases';
import { MARKDOWN_CASES } from '../../parity/markdown.cases';
import { SLIDER_CASES } from '../../parity/slider.cases';
import { ACCORDION_CASES } from '../../parity/accordion.cases';
import { CODE_CASES } from '../../parity/code.cases';
import { STEPPER_CASES } from '../../parity/stepper.cases';
import { TOOLTIP_CASES } from '../../parity/tooltip.cases';
import { BREADCRUMB_CASES } from '../../parity/breadcrumb.cases';
import { ACTIVITY_HEATMAP_CASES } from '../../parity/activity-heatmap.cases';
import { TAG_FIELD_CASES } from '../../parity/tag-field.cases';
import { FILE_UPLOAD_CASES } from '../../parity/file-upload.cases';
import { VIDEO_CASES } from '../../parity/video-view.cases';
import { INPUT_OTP_CASES } from '../../parity/input-otp.cases';
import { COLOR_SWATCH_PICKER_CASES } from '../../parity/color-swatch-picker.cases';
import { ANIMATED_CHECK_CASES } from '../../parity/animated-check.cases';
import { CONTEXT_MENU_CASES } from '../../parity/context-menu.cases';
import { COLLAPSIBLE_CASES } from '../../parity/collapsible.cases';

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
  statBar: STAT_BAR_CASES,
  sticker: STICKER_CASES,
  table: TABLE_CASES,
  list: LIST_CASES,
  carousel: CAROUSEL_CASES,
  markdown: MARKDOWN_CASES,
  slider: SLIDER_CASES,
  accordion: ACCORDION_CASES,
  code: CODE_CASES,
  stepper: STEPPER_CASES,
  tooltip: TOOLTIP_CASES,
  breadcrumb: BREADCRUMB_CASES,
  activityHeatmap: ACTIVITY_HEATMAP_CASES,
  tagField: TAG_FIELD_CASES,
  fileUpload: FILE_UPLOAD_CASES,
  video: VIDEO_CASES,
  inputOtp: INPUT_OTP_CASES,
  colorSwatchPicker: COLOR_SWATCH_PICKER_CASES,
  animatedCheck: ANIMATED_CHECK_CASES,
  contextMenu: CONTEXT_MENU_CASES,
  collapsible: COLLAPSIBLE_CASES,
} satisfies Record<string, readonly ParityCase[]>;
export type Family = keyof typeof FAMILIES;
export type Side = 'bloom' | 'language';
