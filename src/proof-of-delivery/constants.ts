import { RADIUS } from '../design-tokens/scales';
import type { ProofKind, ProofOfDeliveryLabels } from './types';

/** Every default word the family draws. */
export const PROOF_LABELS: Required<ProofOfDeliveryLabels> = {
  signature: 'Signature',
  signaturePad: 'Signature',
  signatureHint: 'Sign with your finger',
  signed: 'Signed',
  clear: 'Clear the signature',
  typeName: 'Or type your name',
  typeNamePlaceholder: 'Full name',
  photo: 'Photo',
  photoHint: 'Where you left it, or the parcel with the recipient.',
  code: 'Delivery code',
  codeHint: 'Ask the recipient to read out the code in their app.',
  recipient: 'Who received it',
  recipientPlaceholder: 'Name',
  note: 'Note',
  notePlaceholder: 'Anything worth recording',
  submit: 'Confirm the delivery',
  required: 'Required',
  missing: 'This is needed before you can confirm.',
  missingSummary: (count: number) =>
    count === 1 ? 'One thing is still missing' : `${count} things are still missing`,
};

/**
 * The order the door is worked through, and it is not arbitrary.
 *
 * Recipient first, because it is the one question the courier asks out loud and
 * the answer to it decides the rest. Then the two proofs the RECIPIENT takes
 * part in — the signature they give and the code they read out — then the photo,
 * which is taken after they have gone, and the note last, because it is written
 * about everything above it.
 */
export const PROOF_ORDER: readonly ProofKind[] = [
  'recipient',
  'signature',
  'code',
  'photo',
  'note',
];

/**
 * The pad's geometry.
 *
 * `baseline` is where the rule sits as a fraction of the height: a signature is
 * written ON a line, and without one a finger starts wherever it lands and the
 * capture reads as a doodle. 0.72 leaves a descender's worth of room under it.
 */
export const PROOF_GEOMETRY = {
  padHeight: 180,
  padRadius: RADIUS['radius-12'],
  baseline: 0.72,
  /** How far in from each side the baseline stops. */
  baselineInset: 16,
  strokeWidth: 2.5,
  /** Between the blocks of the form. */
  gap: 20,
  /** Between a block's own parts. */
  blockGap: 8,
  /**
   * How far a finger must travel before a press becomes a stroke. Below it a
   * single tap still records a DOT, which is what a full stop in a signature
   * is — the threshold decides smoothing, never whether ink was laid down.
   */
  smoothing: 2,
} as const;

export type ProofGeometry = typeof PROOF_GEOMETRY;
