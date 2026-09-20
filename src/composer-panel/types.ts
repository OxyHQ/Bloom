import type { ComponentType, ReactNode, RefObject } from 'react';
import type {
  NativeSyntheticEvent,
  StyleProp,
  TextInput,
  TextInputKeyPressEventData,
  ViewStyle,
} from 'react-native';

import type { Props as IconProps } from '../icons/shared';

// ---------------------------------------------------------------------------
//  Permissions
// ---------------------------------------------------------------------------

/** One mode of the permission picker. */
export interface ComposerPanelPermissionOption {
  id: string;
  label: string;
  description: string;
  /** A Bloom icon component (e.g. `RiSpeedUpFill` from `@oxy.so/bloom/icons`). */
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
  /**
   * Draw the row as a SWITCH, ticked or not, instead of an action.
   *
   * Omit it and the row is an action, as every row was before. A host whose
   * menu holds toggles — web search on, deep research off — could otherwise
   * only offer rows that changed something and then looked identical either
   * way.
   */
  checked?: boolean;
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
  /** Default `'Auto'` — the effort chip with no stop chosen. */
  effortAuto?: string;
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
  /**
   * Controlled effort stop, an index into `effortLevels`. `null` is "no stop
   * chosen" — the chip reads `labels.effortAuto`, the slider commits nothing and
   * the thumb is drawn hollow, so the absence of a choice never looks like one.
   */
  effort?: number | null;
  /** Initial stop when uncontrolled. Default `1` ("Medium"); `null` for no choice. */
  defaultEffort?: number | null;
  /** A stop the reader chose. The picker has no way back to `null`, so it never reports one. */
  onEffortChange?: (effort: number) => void;
  /** The effort stops, "Faster" → "Smarter". Defaults to six stops; `[]` drops the effort axis entirely. */
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
  /** Default `'Stop generating'` — send's stop state while `busy`. */
  stop?: string;
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
  /**
   * Stop the turn in flight. With `busy`, send becomes a stop control that
   * ignores `disabled` — cancelling has to stay possible while typing is not.
   * Without a handler `busy` draws no stop, so the control is never inert.
   */
  onStop?: () => void;
  /** A turn is running: send becomes stop (given `onStop`) and Enter no longer submits. */
  busy?: boolean;
  /** Greys out send while a turn is in flight. Never reaches the stop control. */
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
  /** Controlled effort stop; `null` is "no stop chosen". See `ModelPicker`. */
  effort?: number | null;
  defaultEffort?: number | null;
  onEffortChange?: (effort: number) => void;
  /** `[]` drops the effort axis from the picker. */
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
  /** Default `'Auto'` — the effort value with no stop chosen. */
  effortAuto?: string;
  /** Default `'Faster'`. */
  faster?: string;
  /** Default `'Smarter'`. */
  smarter?: string;
  /** Default `'Voice input'`. */
  voice?: string;
  /** Default `'Send message'`. */
  send?: string;
  /** Default `'Stop generating'` — send's stop state while `busy`. */
  stop?: string;
}

export interface ComposerPillProps {
  /** Controlled field value. */
  value?: string;
  /** Initial value when uncontrolled. */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Fires on the send button and on Enter. */
  onSubmit?: (value: string) => void;
  /**
   * Stop the turn in flight. With `busy`, send becomes a stop control that
   * ignores `disabled` — cancelling has to stay possible while typing is not.
   * Without a handler `busy` draws no stop, so the control is never inert.
   */
  onStop?: () => void;
  /** A turn is running: send becomes stop (given `onStop`) and Enter no longer submits. */
  busy?: boolean;
  /** Greys out send (40%) while a turn is in flight. Never reaches the stop control. */
  disabled?: boolean;
  /** Default `'Ask me anything'`. */
  placeholder?: string;
  /** The shorter placeholder below 640 wide, where the full one clips. Default `'Ask me'`. */
  compactPlaceholder?: string;

  /** The add menu's groups. Default the Composer Panel's "Add" and "Plugins" rows; `[]` hides the button. */
  addMenu?: ReadonlyArray<ComposerPanelAddMenuGroup>;
  onAddMenuSelect?: (rowId: string) => void;

  /**
   * The model menu's lineup. Omit to hide the model button.
   *
   * `{ id, name }` entries are the identity contract `ModelPicker` uses: the
   * menu keys, matches and reports the **id**, and draws the `name`. A bare
   * string is shorthand for `{ id: name, name }` — kept so the display-name form
   * still works, and the only form in which a routing id is a display string.
   */
  models?: ReadonlyArray<string | ModelPickerModel>;
  /** Controlled model **id** (a string entry's id is its name). */
  model?: string;
  /** Initial model id when uncontrolled. Default the first entry's. */
  defaultModel?: string;
  onModelChange?: (modelId: string) => void;
  /**
   * Controlled effort stop, an index into `effortLevels`. `null` is "no stop
   * chosen" — the value reads `labels.effortAuto` and the thumb is drawn hollow.
   */
  effort?: number | null;
  /** Default `1` ("Medium"); `null` for no choice. */
  defaultEffort?: number | null;
  /** A stop the reader chose. The menu has no way back to `null`, so it never reports one. */
  onEffortChange?: (effort: number) => void;
  /** Default `MODEL_PICKER_EFFORT_LEVELS`; `[]` drops the effort half of the menu. */
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

  /**
   * How many lines the pill grows to before the field scrolls instead. Default
   * `8`.
   *
   * The pill is one line at rest and measures its own content as the draft
   * wraps — a composer for an assistant has to hold a paragraph. `1` keeps the
   * fixed single-line box this had before it could grow.
   */
  maxLines?: number;

  /**
   * Drawn where send would be, while the draft is empty and no turn is in
   * flight.
   *
   * An assistant with a voice mode puts its call button here — the slot the
   * thumb is already over. Omit it and send simply sits there disabled, as
   * before. A stop always wins over it: a turn in flight is the one thing a
   * person has to be able to reach.
   */
  emptyAction?: ReactNode;

  /**
   * The field's key events, BEFORE the composer's own Enter rule, so a host
   * can take a key from it.
   *
   * Calling `preventDefault()` stops the composer acting on that key. That is
   * what a suggestion list over the composer needs: the arrows, Enter and
   * Escape have to drive the list rather than the field, and without this a
   * host could only offer a list its keyboard could not reach.
   */
  onKeyPress?: (event: NativeSyntheticEvent<TextInputKeyPressEventData>) => void;

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
