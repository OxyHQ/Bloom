import type { ComponentType, ReactNode, RefObject } from 'react';
import type { StyleProp, TextInput, ViewStyle } from 'react-native';

import type { Props as IconProps } from '../icons/shared';

// ---------------------------------------------------------------------------
//  Permissions
// ---------------------------------------------------------------------------

/** One mode of the permission picker. */
export interface ComposerPanelPermissionOption {
  id: string;
  label: string;
  description: string;
  /** A Bloom icon component (e.g. `RiSpeedUpFill` from `@oxyhq/bloom/icons`). */
  icon: ComponentType<IconProps>;
  /** Draw the glyph mirrored on the vertical axis (branch and route marks). */
  flip?: boolean;
}

// ---------------------------------------------------------------------------
//  Add menu
// ---------------------------------------------------------------------------

export interface ComposerPanelAddMenuRow {
  id: string;
  label: string;
  /** Muted inline description after the label. */
  description?: string;
  /** A Bloom icon, drawn in the secondary icon colour. */
  icon?: ComponentType<IconProps>;
  /** Icon box: 20 for "Add" rows (default), 24 for illustrated "Plugins" rows. */
  iconSize?: 20 | 24;
  /** Your own 24px artwork, drawn instead of `icon`. */
  image?: ReactNode;
}

export interface ComposerPanelAddMenuGroup {
  label: string;
  rows: ReadonlyArray<ComposerPanelAddMenuRow>;
}

// ---------------------------------------------------------------------------
//  Attachments
// ---------------------------------------------------------------------------

export type ComposerPanelAttachmentKind =
  | 'image'
  | 'document'
  | 'spreadsheet'
  | 'presentation'
  | 'code'
  | 'video';

export interface ComposerPanelAttachment {
  id: string;
  name: string;
  kind: ComposerPanelAttachmentKind;
  /** Thumbnail URI for image tiles. */
  src?: string;
  /** Your own 24px artwork for a non-image tile. Defaults to the kind's Remix file glyph. */
  icon?: ReactNode;
  /**
   * 0–100 draws the upload ring around the tile (closed at 100). Leave it out
   * once the file has landed — that also reveals the dismiss.
   */
  progress?: number;
}

// ---------------------------------------------------------------------------
//  Status tab
// ---------------------------------------------------------------------------

export interface ComposerPanelStatusTabProps {
  /** Branch name, beside the (mirrored) merge glyph. */
  branch?: string;
  /** Project folder, beside the folder glyph. */
  project?: string;
  /** Context window used, in percent. Omit to hide the meter. */
  context?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  Model picker
// ---------------------------------------------------------------------------

export interface ModelPickerModel {
  id: string;
  name: string;
}

export interface ModelPickerProvider {
  id: string;
  name: string;
  /**
   * The provider's monochrome mark. Receives the box size (20 or 18 in the rail,
   * 16 on a row) and the mark colour (black at 30%, inverted in dark).
   * Omit it and the rail shows the provider's initial instead.
   */
  logo?: (props: { size: number; color: string }) => ReactNode;
  /** The rail draws some marks at 18px, the rest at 20px. */
  logoSize?: 18 | 20;
  models: ReadonlyArray<ModelPickerModel>;
}

/** The picker's fixed strings, overridable for localisation. */
export interface ModelPickerLabels {
  /** Default `'Models'`. */
  models?: string;
  /** Default `'Quick Search'`. */
  quickSearch?: string;
  /** Default `'Search models'`. */
  searchPlaceholder?: string;
  /** Default `'Close search'`. */
  closeSearch?: string;
  /** Default `'No models match'`. */
  noMatches?: string;
  /** Default `'Providers'`. */
  providers?: string;
  /** Default `'Effort'`. */
  effort?: string;
  /** Default `'Faster'`. */
  faster?: string;
  /** Default `'Smarter'`. */
  smarter?: string;
}

export interface ModelPickerProps {
  /** Every provider's lineup. The rail lists them in order. */
  providers: ReadonlyArray<ModelPickerProvider>;
  /** Controlled model id. */
  value?: string;
  /** Initial model id when uncontrolled. Defaults to the first provider's first model. */
  defaultValue?: string;
  onValueChange?: (modelId: string) => void;
  /** Controlled effort stop, an index into `effortLevels`. */
  effort?: number;
  /** Initial stop when uncontrolled. Default `1` ("Medium"). */
  defaultEffort?: number;
  onEffortChange?: (effort: number) => void;
  /** The effort stops, "Faster" → "Smarter". Defaults to six stops. */
  effortLevels?: ReadonlyArray<string>;
  labels?: ModelPickerLabels;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  Panel
// ---------------------------------------------------------------------------

/** The panel's fixed strings, overridable for localisation. */
export interface ComposerPanelLabels {
  /** Default `'Message'` — the prompt's accessible name. */
  message?: string;
  /** Default `'Add attachment'`. */
  add?: string;
  /** Default `'Add to chat'`. */
  addMenu?: string;
  /** Default `'Permissions'`. */
  permissions?: string;
  /** Default `'Permission mode'`. */
  permissionMode?: string;
  /** Default `'Learn more'`. */
  learnMore?: string;
  /** Default `'Voice input'`. */
  voice?: string;
  /** Default `'Send message'`. */
  send?: string;
  /** Default `'Remove'` — prefixed to the file name on a tile's dismiss. */
  remove?: string;
}

export interface ComposerPanelProps {
  /** Controlled draft. */
  value?: string;
  /** Initial draft when uncontrolled. */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Fires on the send button and on Enter (web; Shift+Enter breaks the line). */
  onSubmit?: (value: string) => void;
  /** Greys out send while a turn is in flight. */
  disabled?: boolean;
  /** Default `'Hi, what do you need today?'`. */
  placeholder?: string;

  /** The permission modes. Defaults to four (`COMPOSER_PANEL_PERMISSIONS`). */
  permissions?: ReadonlyArray<ComposerPanelPermissionOption>;
  /** Controlled permission id. */
  permission?: string;
  /** Initial permission id when uncontrolled. Default the first mode. */
  defaultPermission?: string;
  onPermissionChange?: (permission: string) => void;
  /** Shows "Learn more" in the permission panel's header and handles its press. */
  onLearnMore?: () => void;

  /** The add menu's groups. Defaults to "Add" and "Plugins" rows; `[]` hides the button. */
  addMenu?: ReadonlyArray<ComposerPanelAddMenuGroup>;
  /** A row of the add menu was chosen. The menu closes itself. */
  onAddMenuSelect?: (rowId: string) => void;

  /** The model catalogue. Omit to hide the model picker. */
  providers?: ReadonlyArray<ModelPickerProvider>;
  /** Controlled model id; see `ModelPicker`. */
  model?: string;
  defaultModel?: string;
  onModelChange?: (modelId: string) => void;
  /** Controlled effort stop. */
  effort?: number;
  defaultEffort?: number;
  onEffortChange?: (effort: number) => void;
  effortLevels?: ReadonlyArray<string>;
  modelPickerLabels?: ModelPickerLabels;

  /** Controlled voice-input state (the mic swaps to equalizer bars). */
  listening?: boolean;
  /** Initial voice-input state when uncontrolled. Default `false`. */
  defaultListening?: boolean;
  onListeningChange?: (listening: boolean) => void;

  /** Tiles above the prompt. Each one's `progress` drives its upload ring. */
  attachments?: ReadonlyArray<ComposerPanelAttachment>;
  onRemoveAttachment?: (id: string) => void;

  /** The tab on the card's top edge — typically `<ComposerPanelStatusTab />`. */
  status?: ReactNode;

  /** The prompt field itself, for focus or a scripted demo. */
  inputRef?: RefObject<TextInput | null>;
  labels?: ComposerPanelLabels;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface ComposerAttachmentsProps
  extends Omit<ComposerPanelProps, 'attachments' | 'onRemoveAttachment'> {
  /** Files to show. `progress: 0` queues one for the simulated upload. */
  attachments: ReadonlyArray<ComposerPanelAttachment>;
  /** How long one simulated upload takes, in ms. Default 1100. */
  uploadDuration?: number;
  /** Pause before a queued file starts drawing its ring, in ms. Default 240. */
  uploadGap?: number;
  /** The list after a dismiss. */
  onAttachmentsChange?: (attachments: ComposerPanelAttachment[]) => void;
  onUploadComplete?: (attachment: ComposerPanelAttachment) => void;
  /** Fires once every queued file has landed. */
  onAllUploaded?: () => void;
}

// ---------------------------------------------------------------------------
//  Internal: the anchored panel each platform fork provides
// ---------------------------------------------------------------------------

export interface ComposerPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The trigger the panel anchors to. */
  anchorRef: RefObject<unknown>;
  label: string;
  side: 'top' | 'bottom';
  sideOffset: number;
  /**
   * Catch the outside press instead of letting it through. Only the model picker
   * sets it: its effort panel is a SECOND portaled surface, and a non-modal
   * picker would read a press inside that panel as an outside press.
   */
  modal?: boolean;
  /** Panel box: width, radius, padding, shadow… Colours are the caller's. */
  style?: StyleProp<ViewStyle>;
  testID?: string;
  children?: ReactNode;
}

// ---------------------------------------------------------------------------
//  Pill composer
// ---------------------------------------------------------------------------

/** The pill composer's fixed strings, overridable for localisation. */
export interface ComposerPillLabels {
  /** Default `'Message'` — the field's accessible name. */
  message?: string;
  /** Default `'Add attachment'`. */
  add?: string;
  /** Default `'Add to chat'`. */
  addMenu?: string;
  /** Default `'Model settings'` — the model panel's name. */
  modelSettings?: string;
  /** Default `'Models'`. */
  models?: string;
  /** Default `'Model'` — the radio group's name. */
  modelGroup?: string;
  /** Default `'Effort'`. */
  effort?: string;
  /** Default `'Faster'`. */
  faster?: string;
  /** Default `'Smarter'`. */
  smarter?: string;
  /** Default `'Voice input'`. */
  voice?: string;
  /** Default `'Send message'`. */
  send?: string;
}

export interface ComposerPillProps {
  /** Controlled field value. */
  value?: string;
  /** Initial value when uncontrolled. */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Fires on the send button and on Enter. */
  onSubmit?: (value: string) => void;
  /** Greys out send (40%) while a turn is in flight. */
  disabled?: boolean;
  /** Default `'Ask me anything'`. */
  placeholder?: string;
  /** The shorter placeholder below 640 wide, where the full one clips. Default `'Ask me'`. */
  compactPlaceholder?: string;

  /** The add menu's groups. Default the Composer Panel's "Add" and "Plugins" rows; `[]` hides the button. */
  addMenu?: ReadonlyArray<ComposerPanelAddMenuGroup>;
  onAddMenuSelect?: (rowId: string) => void;

  /** Model names for the model menu. Omit to hide the model button. */
  models?: ReadonlyArray<string>;
  /** Controlled model name. */
  model?: string;
  /** Initial model when uncontrolled. Default the first. */
  defaultModel?: string;
  onModelChange?: (model: string) => void;
  /** Controlled effort stop, an index into `effortLevels`. */
  effort?: number;
  /** Default `1` ("Medium"). */
  defaultEffort?: number;
  onEffortChange?: (effort: number) => void;
  /** Default `MODEL_PICKER_EFFORT_LEVELS`. */
  effortLevels?: ReadonlyArray<string>;

  /** Controlled voice-input state (the mic swaps to equalizer bars). */
  listening?: boolean;
  defaultListening?: boolean;
  onListeningChange?: (listening: boolean) => void;

  /**
   * Paint the pill's own surface and `shadow-xs`. Default `true`; turn it off
   * inside a `ComposerLoader`, which paints the surface behind its light.
   */
  surface?: boolean;
  /**
   * Put the add, model and mic controls on frosted glass chips — the
   * agent-working treatment, paired with an active `ComposerLoader`. Each control
   * drops its own paint (480ms) so the light passing behind shows through.
   */
  glass?: boolean;

  /** The field itself, for focus or a scripted demo. */
  inputRef?: RefObject<TextInput | null>;
  labels?: ComposerPillLabels;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  Status bar
// ---------------------------------------------------------------------------

export interface ComposerStatusBarFolder {
  /** Muted path prefix, e.g. `users/desktop/`. */
  prefix: string;
  name: string;
}

export interface ComposerStatusBarLabels {
  /** Default `'Local Folders'`. */
  folders?: string;
  /** Default `(percent) => \`Context ${percent}%\``. */
  context?: (percent: number) => string;
}

export interface ComposerStatusBarProps {
  /** Branch name beside the mirrored merge glyph. Omit to hide. */
  branch?: string;
  onBranchPress?: () => void;
  /** The folder menu's rows. Omit to hide the project item. */
  folders?: ReadonlyArray<ComposerStatusBarFolder>;
  /** Controlled folder (by `name`). */
  folder?: string;
  /** Initial folder when uncontrolled. Default the first. */
  defaultFolder?: string;
  onFolderChange?: (name: string) => void;
  /** Agent mode on the right (∞ + a dropdown caret). Omit to hide. */
  mode?: string;
  onModePress?: () => void;
  /** Context window used, in percent. Omit to hide the meter. */
  context?: number;
  labels?: ComposerStatusBarLabels;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
