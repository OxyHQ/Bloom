import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import type { SortablePhoto } from '../sortable-media';

/** One point of a drawn stroke, in the pad's own coordinates. */
export interface SignaturePoint {
  x: number;
  y: number;
}

/** One unbroken line: the points between a finger going down and coming up. */
export type SignatureStroke = readonly SignaturePoint[];

/**
 * A signature, which is EITHER drawn OR typed and never has to be both.
 *
 * Both halves live in one value because they are one answer to one question.
 * A pad that reported only strokes would make the typed name a second field the
 * app had to remember to collect, and the first app that forgot it would ship a
 * signature step no screen-reader user could complete.
 */
export interface SignatureValue {
  /** What was drawn, oldest stroke first. */
  strokes: readonly SignatureStroke[];
  /** What was typed instead. */
  typedName?: string;
}

/**
 * The five things an app can ask for at the door.
 *
 * Each is independent: an app asks for none, one, or all five, and says
 * separately which of the ones it asked for it will not accept a delivery
 * without.
 */
export type ProofKind = 'signature' | 'photo' | 'code' | 'recipient' | 'note';

/** Everything collected at the door. */
export interface ProofOfDeliveryValue {
  signature: SignatureValue;
  /** The photos, in order, handed to `SortablePhotoGrid` unchanged. */
  photos: readonly SortablePhoto[];
  /** The code the recipient read out. Digits only — `InputOtp` cleans it. */
  code: string;
  /** Who took it. */
  recipient: string;
  /** Anything else about how it went. */
  note: string;
}

/** What the whole thing reports: the value, and what is still missing from it. */
export interface ProofOfDeliveryResult extends ProofOfDeliveryValue {
  /**
   * The REQUIRED proofs that have not been given, in the order they were asked.
   * Empty means the delivery can be recorded.
   */
  missing: readonly ProofKind[];
}

/** Every word the family speaks, in one prop. */
export interface ProofOfDeliveryLabels {
  /** Over the signature block. Default `"Signature"`. */
  signature?: string;
  /** The pad's own name and hint. Defaults `"Signature"` / `"Sign with your finger"`. */
  signaturePad?: string;
  signatureHint?: string;
  /** Said instead of the hint once something has been drawn. Default `"Signed"`. */
  signed?: string;
  /** The clear control. Default `"Clear the signature"`. */
  clear?: string;
  /** The typed alternative's label and placeholder. Defaults `"Or type your name"` / `"Full name"`. */
  typeName?: string;
  typeNamePlaceholder?: string;
  /** Over the photo block. Default `"Photo"`. */
  photo?: string;
  /** Under it. Default `"Where you left it, or the parcel with the recipient."`. */
  photoHint?: string;
  /** Over the code block. Default `"Delivery code"`. */
  code?: string;
  /** Under it. Default `"Ask the recipient to read out the code in their app."`. */
  codeHint?: string;
  /** Over the recipient block. Default `"Who received it"`. */
  recipient?: string;
  recipientPlaceholder?: string;
  /** Over the note block. Default `"Note"`. */
  note?: string;
  notePlaceholder?: string;
  /** The submit control. Default `"Confirm the delivery"`. */
  submit?: string;
  /** Marks a block the app will not accept without. Default `"Required"`. */
  required?: string;
  /** Shown on a required block that is still empty, after a submit. Default `"This is needed before you can confirm."`. */
  missing?: string;
  /** The line over the missing list, after a failed submit. Default `` (n) => n === 1 ? 'One thing is still missing' : `${n} things are still missing` ``. */
  missingSummary?: (count: number) => string;
}

export interface SignaturePadProps {
  /** Controlled value. */
  value?: SignatureValue;
  /** Uncontrolled initial value. Default no strokes and no typed name. */
  defaultValue?: SignatureValue;
  onChange?: (value: SignatureValue) => void;
  /** Called with the finished stroke each time the finger comes up. */
  onStrokeEnd?: (stroke: SignatureStroke) => void;
  /** How tall the drawing surface is. Default 180. */
  height?: number;
  /** The ink. Default the theme's text colour — a signature is writing, not a brand mark. */
  ink?: string;
  /** How thick the ink is. Default 2.5. */
  strokeWidth?: number;
  /**
   * Draws the "or type your name" field under the pad. Default `true`.
   *
   * SETTING IT TO `false` REMOVES THE ONLY PATH A SCREEN-READER USER HAS. Do it
   * only where the app collects the name somewhere else on the same screen.
   */
  typed?: boolean;
  /** Stops drawing and typing, and dims the whole block. */
  disabled?: boolean;
  labels?: ProofOfDeliveryLabels;
  /** Names the block. Default `"Signature"`. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  /** Derives `-pad`, `-stroke-<n>`, `-clear`, `-typed`. */
  testID?: string;
}

export interface ProofOfDeliveryProps {
  /** Which proofs are drawn, in the order they are asked. Default all five. */
  proofs?: readonly ProofKind[];
  /**
   * Which of the drawn proofs the app will not record a delivery without.
   * Default none — every proof is optional until an app says otherwise.
   */
  required?: readonly ProofKind[];
  /** Controlled value. Any field left out falls back to the empty one. */
  value?: Partial<ProofOfDeliveryValue>;
  /** Uncontrolled initial value. */
  defaultValue?: Partial<ProofOfDeliveryValue>;
  onChange?: (value: ProofOfDeliveryValue) => void;
  /**
   * The one result. It fires on EVERY press, with `missing` filled in — see
   * `ProofOfDelivery`'s note on why the confirm control is never disabled.
   */
  onSubmit?: (result: ProofOfDeliveryResult) => void;
  /** Opens the app's own picker. Without it the photo block draws no add tile. */
  onAddPhoto?: () => void;
  /** Draws the retry control on a failed photo. */
  onRetryPhoto?: (id: string) => void;
  /** How many boxes the code has. Default `4`. */
  codeLength?: number;
  /** How tall the signature pad is. Default 180. */
  signatureHeight?: number;
  /** Hides the add tile once this many photos are in. Default `4`. */
  maxPhotos?: number;
  /** Dims the confirm control and stops the press while the app is saving. */
  submitting?: boolean;
  /** Stops every control. */
  disabled?: boolean;
  /** A heading over the whole thing. */
  title?: string;
  /** A line under the heading. */
  description?: string;
  /** Replaces the confirm control entirely. */
  actions?: ReactNode;
  labels?: ProofOfDeliveryLabels;
  /** Names the form. Default `"Proof of delivery"`. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  /** Derives `-signature`, `-photo`, `-code`, `-recipient`, `-note`, `-submit`. */
  testID?: string;
}
