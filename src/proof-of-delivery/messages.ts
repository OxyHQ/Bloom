import { defineMessages, type MessageCatalog } from '../locale/messages';
import { plural } from '../locale/plural';
import type { ProofOfDeliveryLabels } from './types';

/**
 * Every fixed string the proof-of-delivery family draws or announces, in each
 * Bloom language. A caller's `labels` and `accessibilityLabel` still win.
 */
export interface ProofOfDeliveryMessages {
  labels: Required<ProofOfDeliveryLabels>;
  /** Names the form. */
  proofOfDelivery: string;
}

export const PROOF_OF_DELIVERY_MESSAGES: MessageCatalog<ProofOfDeliveryMessages> =
  defineMessages<ProofOfDeliveryMessages>('PROOF_OF_DELIVERY_MESSAGES', {
    labels: {
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
      missingSummary: (n) =>
        plural('en', n, {
          one: 'One thing is still missing',
          other: '{n} things are still missing',
        }),
    },
    proofOfDelivery: 'Proof of delivery',
  });
