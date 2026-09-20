import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import type { ChatComposerAttachment } from '../chat-composer/types';

/**
 * One addressee, as the field holds it.
 *
 * A recipient is a PERSON: a face, a name, an address and a verdict on whether
 * that address is usable. That is why this family has a field of its own rather
 * than a generic tag input — a tag has none of those four — and why it is still
 * built on `Chip` and still a `Field` member, so the two can be unified the day
 * they converge.
 */
export interface MailRecipient {
  id: string;
  /** The display name. With none, the address is drawn. */
  name?: string;
  address: string;
  /** An avatar URL, or an id the `ImageResolver` knows. */
  avatar?: string;
  /**
   * The address did not parse, or the directory rejected it. The chip turns to
   * the error tone and the FIELD reports invalid, so a `Field`'s error text and
   * the chip say the same thing.
   */
  invalid?: boolean;
}

/** A contact the field offers while the reader types. */
export interface MailRecipientSuggestion {
  id: string;
  name?: string;
  address: string;
  avatar?: string;
}

/** Every string this family draws that is not app data. */
export interface MailComposeStrings {
  to: string;
  cc: string;
  bcc: string;
  subject: string;
  /** The control that reveals the cc and bcc rows. */
  showCopies: string;
  hideCopies: string;
  /** `(name) => 'Remove <name>'` — announced on a recipient chip's remove. */
  removeRecipient: (name: string) => string;
  /** Names the suggestion list. */
  suggestions: string;
  send: string;
  sending: string;
  attach: string;
  discard: string;
  minimize: string;
  expand: string;
  close: string;
  /** The default surface title. */
  title: string;
}

export interface MailRecipientFieldProps {
  /**
   * "To", "Cc", "Bcc" — drawn in the gutter AND the control's own name.
   *
   * Optional so an enclosing `Field` can name the row instead: with no `label`
   * the gutter is EMPTY (the field already draws those words above the control
   * — a field's label and a control's are alternatives, not layers) and the
   * input takes the field's label as its accessible name. With neither, nothing
   * names the input, which is the one combination to avoid.
   */
  label?: string;
  recipients: readonly MailRecipient[];
  onRecipientsChange: (recipients: MailRecipient[]) => void;
  /** The inline input's text. Controlled; the field holds nothing. */
  value?: string;
  onChangeText?: (value: string) => void;
  /**
   * The typed text should become a recipient — Enter, or a comma. Parsing it
   * is the app's: only the app knows its directory and its address grammar.
   */
  onSubmit?: (text: string) => void;
  suggestions?: readonly MailRecipientSuggestion[];
  onSuggestionPress?: (suggestion: MailRecipientSuggestion) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Marks the whole field invalid. A recipient's own `invalid` also does. */
  invalid?: boolean;
  /** A slot at the trailing edge of the row — where the cc/bcc reveal sits. */
  trailing?: ReactNode;
  /** The control's id. Inside a `Field` the field supplies one. */
  nativeID?: string;
  accessibilityLabel?: string;
  strings?: Partial<MailComposeStrings>;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface MailComposeHeaderProps {
  to: readonly MailRecipient[];
  onToChange: (recipients: MailRecipient[]) => void;
  cc?: readonly MailRecipient[];
  onCcChange?: (recipients: MailRecipient[]) => void;
  bcc?: readonly MailRecipient[];
  onBccChange?: (recipients: MailRecipient[]) => void;
  /**
   * Whether the cc and bcc rows are showing. Uncontrolled, the reveal opens
   * them — and they open ALREADY OPEN when either arrives non-empty, because a
   * reply-all that hid its own copies would be a message sent to people the
   * writer cannot see.
   */
  copiesVisible?: boolean;
  onCopiesVisibleChange?: (visible: boolean) => void;
  subject?: string;
  onSubjectChange?: (subject: string) => void;
  /** The inline input text of each row, and its suggestions. */
  query?: string;
  onQueryChange?: (value: string) => void;
  onQuerySubmit?: (field: 'to' | 'cc' | 'bcc', text: string) => void;
  suggestions?: readonly MailRecipientSuggestion[];
  onSuggestionPress?: (field: 'to' | 'cc' | 'bcc', suggestion: MailRecipientSuggestion) => void;
  disabled?: boolean;
  strings?: Partial<MailComposeStrings>;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * The frame's two shapes. `sheet` fills whatever presented it — a `Dialog` in
 * its sheet placement, a `BottomSheet`, a full-screen route — and draws no
 * frame of its own; `docked` is the desktop panel, with its own surface, its
 * own hairline and a minimise.
 */
export type MailComposeVariant = 'sheet' | 'docked';

export interface MailComposeSurfaceProps {
  variant?: MailComposeVariant;
  /** The bar's title. Defaults to "New message". */
  title?: string;
  /** Collapses a `docked` panel to its title bar. Ignored by `sheet`. */
  minimized?: boolean;
  onMinimizedChange?: (minimized: boolean) => void;
  /** Present only when the app can promote the panel to a full window. */
  onExpand?: () => void;
  onClose?: () => void;
  /** The recipient/subject block — `MailComposeHeader`, usually. */
  header?: ReactNode;
  /** The body. A slot: this family writes no rich-text engine. */
  children?: ReactNode;
  /**
   * The formatting toolbar, in the footer above the send row. A SLOT, on
   * purpose — `note-editor`'s `NoteEditorToolbar` is the one Bloom ships, and a
   * second one built here would be a second one to keep in step.
   */
  toolbar?: ReactNode;
  /** Pending attachments. Rendered through `chat-composer`'s strip. */
  attachments?: readonly ChatComposerAttachment[];
  onAttachmentRemove?: (id: string) => void;
  onAttach?: () => void;
  onSend?: () => void;
  /** Disables send and swaps its label. */
  sending?: boolean;
  /** Disables send without saying anything is in flight — an empty `to`, say. */
  sendDisabled?: boolean;
  onDiscard?: () => void;
  /** Extra footer content between the attach control and the send button. */
  footer?: ReactNode;
  strings?: Partial<MailComposeStrings>;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
