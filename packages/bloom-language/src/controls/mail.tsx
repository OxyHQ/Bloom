import {
  MailComposeSurface as BloomMailComposeSurface,
  type MailComposeSurfaceProps,
  type MailRecipient,
  MailRecipientField as BloomMailRecipientField,
  type MailRecipientFieldProps,
} from '@oxy.so/bloom/mail-compose';
import {
  type MailAddress,
  MailMessage as BloomMailMessage,
  type MailMessageProps,
  MailQuoteToggle as BloomMailQuoteToggle,
  type MailQuoteToggleProps,
  MailThread as BloomMailThread,
  type MailThreadMessage,
  type MailThreadProps,
} from '@oxy.so/bloom/mail-thread';
import {
  type NoteEditorAction,
  NoteEditorToolbar as BloomNoteEditorToolbar,
  type NoteEditorToolbarProps,
} from '@oxy.so/bloom/note-editor';

import type { Binding } from '../binding';
import { type Child, Node, type ViewModifiers } from '../node';
import type { MailComposeStyle, NoteToolbarSize, SpaceToken } from '../tokens';
import type { ControlRenderer } from './draw';
import { product } from './product';

/** Mail: the compose surface and its recipients, a thread and its messages; a note's toolbar. */
export type MailKind =
  | 'mailComposeSurface'
  | 'mailRecipientField'
  | 'mailMessage'
  | 'mailThread'
  | 'mailQuoteToggle'
  | 'noteEditorToolbar';

type Drawn = 'style' | 'testID' | 'accessibilityLabel';

type ComposeSlots = 'header' | 'toolbar' | 'footer';
/**
 * Bloom `MailComposeSurface`'s title, its state and handlers, its words; its
 * header (the recipients), toolbar and footer are language children.
 */
export type MailComposeSurfaceOptions = Omit<
  MailComposeSurfaceProps,
  Drawn | 'variant' | 'sending' | 'children' | ComposeSlots
> & { readonly [K in ComposeSlots]?: Child };
/** Bloom `MailRecipientField`'s text, suggestions, handlers and words; its `trailing` is a language child. */
export type MailRecipientFieldOptions = Omit<
  MailRecipientFieldProps,
  'style' | 'testID' | 'recipients' | 'onRecipientsChange' | 'disabled' | 'trailing'
> & { readonly trailing?: Child };
type MessageSlots = 'trimmed' | 'menu';
/** Bloom `MailMessage`'s addresses, dates, state and handlers; its trimmed quote and menu are language children. */
export type MailMessageOptions = Omit<
  MailMessageProps,
  'style' | 'testID' | 'sender' | 'children' | MessageSlots
> & { readonly [K in MessageSlots]?: Child };
type ThreadSlots = 'quickReply' | 'header';
/**
 * Bloom `MailThread`'s subject, labels, state and handlers; its quick reply
 * and header are language children, the gap between its messages a space token.
 */
export type MailThreadOptions = Omit<
  MailThreadProps,
  Drawn | 'messages' | 'messageGap' | ThreadSlots
> & { readonly messageGap?: SpaceToken } & { readonly [K in ThreadSlots]?: Child };
/** Bloom `MailQuoteToggle`'s state and words. */
export type MailQuoteToggleOptions = Omit<MailQuoteToggleProps, 'style' | 'testID' | 'children'>;
/** Bloom `NoteEditorToolbar`'s words. */
export type NoteEditorToolbarOptions = Omit<
  NoteEditorToolbarProps,
  Drawn | 'actions' | 'size' | 'disabled'
>;

/** Bloom `MailComposeSurface`: a message being written. */
export interface MailComposeSurfaceView extends ViewModifiers<MailComposeSurfaceView> {
  /** `docked` (default): a window in a corner; `sheet`: the whole pane. */
  style(value: MailComposeStyle): MailComposeSurfaceView;
  /** The message is being sent: its send button says so and waits. */
  loading(value?: boolean): MailComposeSurfaceView;
}
/** Bloom `MailRecipientField`: the recipients of one line (To, Cc, Bcc). */
export interface MailRecipientFieldView extends ViewModifiers<MailRecipientFieldView> {
  disabled(value?: boolean): MailRecipientFieldView;
}
export type MailMessageView = ViewModifiers<MailMessageView>;
export type MailThreadView = ViewModifiers<MailThreadView>;
export type MailQuoteToggleView = ViewModifiers<MailQuoteToggleView>;
/** Bloom `NoteEditorToolbar`: a note's formatting actions, the overflow in a menu. */
export interface NoteEditorToolbarView extends ViewModifiers<NoteEditorToolbarView> {
  /** `md` (default) or `sm`. */
  size(value: NoteToolbarSize): NoteEditorToolbarView;
  disabled(value?: boolean): NoteEditorToolbarView;
}

/** Bloom `MailComposeSurface` round `body` (the message's editor). */
export function MailComposeSurface(
  body?: Child,
  options: MailComposeSurfaceOptions = {},
): MailComposeSurfaceView {
  return new Node('mailComposeSurface', { options }, body === undefined ? [] : [body]);
}
/** Bloom `MailRecipientField`: it edits the recipients `recipients` holds. */
export function MailRecipientField(
  recipients: Binding<MailRecipient[]>,
  options: MailRecipientFieldOptions = {},
): MailRecipientFieldView {
  return new Node('mailRecipientField', { binding: recipients, options }, []);
}
/** Bloom `MailMessage` from `sender`; `body` is what it shows expanded. */
export function MailMessage(
  sender: MailAddress,
  body?: Child,
  options: MailMessageOptions = {},
): MailMessageView {
  return new Node('mailMessage', { sender, options }, body === undefined ? [] : [body]);
}
/** Bloom `MailThread` of `messages`, collapsed as Bloom collapses them. */
export function MailThread(
  messages: readonly MailThreadMessage[],
  options: MailThreadOptions = {},
): MailThreadView {
  return new Node('mailThread', { messages, options }, []);
}
/** Bloom `MailQuoteToggle`: the trimmed `quote`, folded behind its toggle. */
export function MailQuoteToggle(
  quote?: Child,
  options: MailQuoteToggleOptions = {},
): MailQuoteToggleView {
  return new Node('mailQuoteToggle', { options }, quote === undefined ? [] : [quote]);
}
/** Bloom `NoteEditorToolbar` named `label` (Bloom requires a name), of `actions`. */
export function NoteEditorToolbar(
  label: string,
  actions: readonly NoteEditorAction[],
  options: NoteEditorToolbarOptions = {},
): NoteEditorToolbarView {
  return new Node('noteEditorToolbar', { accessibilityLabel: label, actions, options }, []);
}

export const MAILS: Record<MailKind, ControlRenderer> = {
  mailComposeSurface: product(BloomMailComposeSurface, {
    slots: ['header', 'toolbar', 'footer'],
    own: (d) => ({ variant: d.own('style')?.value, sending: d.own('loading')?.value }),
  }),
  mailRecipientField: product(BloomMailRecipientField, {
    binding: ['recipients', 'onRecipientsChange'],
    slots: ['trailing'],
    own: (d) => ({ disabled: d.own('disabled')?.value }),
  }),
  mailMessage: product(BloomMailMessage, { slots: ['trimmed', 'menu'] }),
  mailThread: product(BloomMailThread, {
    slots: ['quickReply', 'header'],
    lengths: ['messageGap'],
  }),
  mailQuoteToggle: product(BloomMailQuoteToggle),
  noteEditorToolbar: product(BloomNoteEditorToolbar, {
    own: (d) => ({ size: d.own('size')?.value, disabled: d.own('disabled')?.value }),
  }),
};
