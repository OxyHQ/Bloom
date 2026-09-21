/**
 * @jest-environment jsdom
 *
 * `ProofOfDelivery` and `SignaturePad` through the REAL react-native-web, plus
 * the pure geometry and the pure completeness rules behind them.
 *
 * **A JEST TEST CANNOT SEE A CANVAS.** react-native-svg renders to a native
 * view on one platform and to a `<path>` on the other, and jsdom paints
 * neither — so the split here is deliberate:
 *
 *   - `signaturePath` and `shouldKeepSignaturePoint` are the geometry, and they
 *     are PURE. Every boundary is reachable: no points, one point (which must
 *     still lay down a dot), two, a resting finger reporting the same
 *     coordinate. They are walked directly.
 *   - `isProofGiven` / `missingProofs` are the completeness rule, and the case
 *     that matters most — a proof that is REQUIRED but was never DRAWN — cannot
 *     be reached from a render at all.
 *   - Everything else is EMITTED DOM: that the confirm control is never
 *     disabled by something missing, that the answer reaches a `role="alert"`,
 *     and that the typed path exists.
 *
 * That ink lands under a real pointer is `scripts/verify-signature-pad.mjs`.
 */
import React from 'react';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import {
  ProofOfDelivery,
  SignaturePad,
  completeProofValue,
  hasSignatureInk,
  isProofGiven,
  isSignatureGiven,
  missingProofs,
  orderProofs,
  shouldKeepSignaturePoint,
  signaturePath,
} from '../proof-of-delivery';
import type { ProofOfDeliveryResult, ProofOfDeliveryValue } from '../proof-of-delivery';
import { byTestId, click, mount, queryTestId, setupHarness } from './support/commerce-harness';

setupHarness();

const noop = () => undefined;

const value = (patch: Partial<ProofOfDeliveryValue> = {}) => completeProofValue(patch);

// ---------------------------------------------------------------------------
//  The geometry — pure, because the canvas is not visible from here
// ---------------------------------------------------------------------------

describe('a stroke becomes path data, and a tap becomes a dot', () => {
  it('draws NOTHING for no points — an empty `d` is still an element', () => {
    expect(signaturePath([])).toBe('');
  });

  it('draws a DOT for one point, which is what a full stop in a signature is', () => {
    expect(signaturePath([{ x: 10, y: 20 }])).toBe('M10 20l0 0');
  });

  it('draws a move and a line for two points', () => {
    expect(
      signaturePath([
        { x: 0, y: 0 },
        { x: 10, y: 10 },
      ]),
    ).toBe('M0 0L10 10');
  });

  it('smooths through the MIDPOINTS of the samples, not through the samples', () => {
    // Three points: one quadratic whose control is the middle sample and whose
    // end is the midpoint of the middle and the last, then a line to the last.
    expect(
      signaturePath([
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 20, y: 20 },
      ]),
    ).toBe('M0 0Q10 0 15 10L20 20');
  });

  it('rounds to two places — a signature does not need a ten-thousandth of a pixel', () => {
    expect(signaturePath([{ x: 1.23456, y: 9.87654 }])).toBe('M1.23 9.88l0 0');
  });

  it('keeps the first sample always, and drops one a resting finger repeated', () => {
    expect(shouldKeepSignaturePoint(undefined, { x: 5, y: 5 })).toBe(true);
    expect(shouldKeepSignaturePoint({ x: 5, y: 5 }, { x: 5, y: 5 })).toBe(false);
    expect(shouldKeepSignaturePoint({ x: 5, y: 5 }, { x: 6, y: 5 })).toBe(false);
    expect(shouldKeepSignaturePoint({ x: 5, y: 5 }, { x: 7, y: 5 })).toBe(true);
    // The threshold is a DISTANCE, so it adds up across both axes.
    expect(shouldKeepSignaturePoint({ x: 5, y: 5 }, { x: 6, y: 6 })).toBe(true);
  });
});

// ---------------------------------------------------------------------------
//  Whether a proof has been GIVEN
// ---------------------------------------------------------------------------

describe('a signature is given by either path, and neither outranks the other', () => {
  it('counts drawn ink', () => {
    expect(hasSignatureInk({ strokes: [[{ x: 1, y: 1 }]] })).toBe(true);
    expect(isSignatureGiven({ strokes: [[{ x: 1, y: 1 }]] })).toBe(true);
  });

  it('counts a typed name, with no ink at all', () => {
    expect(hasSignatureInk({ strokes: [], typedName: 'Nuno Peralta' })).toBe(false);
    expect(isSignatureGiven({ strokes: [], typedName: 'Nuno Peralta' })).toBe(true);
  });

  it('counts neither an empty stroke nor whitespace', () => {
    expect(isSignatureGiven({ strokes: [[]] })).toBe(false);
    expect(isSignatureGiven({ strokes: [], typedName: '   ' })).toBe(false);
    expect(isSignatureGiven(undefined)).toBe(false);
  });
});

describe('a code counts only once it is FULL', () => {
  it('refuses a half-entered code and accepts a complete one', () => {
    expect(isProofGiven('code', value({ code: '82' }), 4)).toBe(false);
    expect(isProofGiven('code', value({ code: '8214' }), 4)).toBe(true);
    expect(isProofGiven('code', value({ code: '8214' }), 6)).toBe(false);
  });

  it('answers the other four the way each of them is given', () => {
    expect(isProofGiven('photo', value({ photos: [{ id: 'a', uri: 'x' }] }), 4)).toBe(true);
    expect(isProofGiven('photo', value(), 4)).toBe(false);
    expect(isProofGiven('recipient', value({ recipient: ' ' }), 4)).toBe(false);
    expect(isProofGiven('recipient', value({ recipient: 'Nuno' }), 4)).toBe(true);
    expect(isProofGiven('note', value({ note: 'Left in the porch' }), 4)).toBe(true);
  });
});

describe('what is missing is the required proofs that were DRAWN and not given', () => {
  it('cannot report a proof the app required but never showed', () => {
    expect(missingProofs(value(), ['code'], ['recipient', 'signature'], 4)).toEqual([]);
  });

  it('reports them in the DRAWN order, so the summary reads down the form', () => {
    expect(
      missingProofs(value(), ['note', 'recipient', 'signature'], ['recipient', 'signature', 'note'], 4),
    ).toEqual(['recipient', 'signature', 'note']);
  });

  it('drops one as soon as it is given, by either path', () => {
    const shown = ['recipient', 'signature'] as const;
    expect(missingProofs(value(), [...shown], [...shown], 4)).toEqual(['recipient', 'signature']);
    expect(
      missingProofs(
        value({ recipient: 'Nuno', signature: { strokes: [], typedName: 'Nuno' } }),
        [...shown],
        [...shown],
        4,
      ),
    ).toEqual([]);
  });

  it('is empty when the app requires nothing', () => {
    expect(missingProofs(value(), [], ['recipient'], 4)).toEqual([]);
  });
});

describe('the order is the door’s, not the caller’s', () => {
  it('puts the proofs back in `PROOF_ORDER` and drops what it does not know', () => {
    expect(orderProofs(['note', 'code', 'recipient'])).toEqual(['recipient', 'code', 'note']);
    expect(orderProofs([])).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
//  The pad — emitted DOM
// ---------------------------------------------------------------------------

describe('the pad says what it is, and always offers the typed path', () => {
  it('names itself, and says SIGNED once there is ink', () => {
    mount(<SignaturePad testID="s" />);
    expect(byTestId('s-pad').getAttribute('aria-label')).toBe('Signature');
    expect(byTestId('s-pad').getAttribute('role')).toBe('img');
    expect(byTestId('s-hint').textContent).toBe('Sign with your finger');
    mount(<SignaturePad value={{ strokes: [[{ x: 1, y: 1 }]] }} testID="s" />);
    expect(byTestId('s-pad').getAttribute('aria-label')).toBe('Signature, Signed');
    expect(byTestId('s-hint').textContent).toBe('Signed');
  });

  it('draws the typed field by default, and only removes it when told to', () => {
    mount(<SignaturePad testID="s" />);
    expect(queryTestId('s-typed')).not.toBeNull();
    mount(<SignaturePad typed={false} testID="s" />);
    expect(queryTestId('s-typed')).toBeNull();
  });

  it('draws the clear control only once there is something to clear, and clears', () => {
    mount(<SignaturePad testID="s" />);
    expect(queryTestId('s-clear')).toBeNull();
  });

  it('clears the ink and KEEPS the typed name — they are two answers, not one', () => {
    const seen: Array<{ strokes: unknown[]; typedName?: string }> = [];
    mount(
      <SignaturePad
        value={{ strokes: [[{ x: 1, y: 1 }]], typedName: 'Nuno' }}
        onChange={(next) => seen.push({ strokes: [...next.strokes], typedName: next.typedName })}
        testID="s"
      />,
    );
    click(byTestId('s-clear'));
    expect(seen).toEqual([{ strokes: [], typedName: 'Nuno' }]);
  });
});

// ---------------------------------------------------------------------------
//  The form — emitted DOM
// ---------------------------------------------------------------------------

describe('the form asks for what it was told to, in the door’s order', () => {
  it('draws every proof by default', () => {
    mount(<ProofOfDelivery testID="p" />);
    for (const part of ['recipient', 'signature', 'code', 'photo', 'note']) {
      expect(queryTestId(`p-${part}`)).not.toBeNull();
    }
  });

  it('draws only the proofs it was given', () => {
    mount(<ProofOfDelivery proofs={['code']} testID="p" />);
    expect(queryTestId('p-code')).not.toBeNull();
    expect(queryTestId('p-signature')).toBeNull();
    expect(queryTestId('p-photo')).toBeNull();
  });

  it('gives the code the number of boxes the app asked for', () => {
    mount(<ProofOfDelivery proofs={['code']} codeLength={6} testID="p" />);
    expect(byTestId('p-code').querySelectorAll('input')).toHaveLength(6);
  });
});

describe('the confirm control is never disabled by something missing', () => {
  it('is pressable with everything outstanding, and reports what is missing', () => {
    const results: ProofOfDeliveryResult[] = [];
    mount(
      <ProofOfDelivery
        proofs={['recipient', 'signature']}
        required={['recipient', 'signature']}
        onSubmit={(result) => results.push(result)}
        testID="p"
      />,
    );
    expect(byTestId('p-submit').getAttribute('aria-disabled')).toBeNull();
    click(byTestId('p-submit'));
    expect(results).toHaveLength(1);
    expect(results[0]!.missing).toEqual(['recipient', 'signature']);
  });

  it('puts the answer where a screen reader gets it, in the same gesture', () => {
    mount(
      <ProofOfDelivery
        proofs={['recipient']}
        required={['recipient']}
        onSubmit={noop}
        testID="p"
      />,
    );
    expect(queryTestId('p-missing')).toBeNull();
    click(byTestId('p-submit'));
    const alert = byTestId('p-missing');
    expect(alert.getAttribute('role')).toBe('alert');
    expect(alert.textContent).toBe('One thing is still missing: Who received it.');
  });

  it('says nothing before the first press — a form red before it is filled in is wrong', () => {
    mount(
      <ProofOfDelivery proofs={['recipient']} required={['recipient']} testID="p" />,
    );
    expect(document.body.textContent).not.toContain('This is needed before you can confirm.');
  });

  it('reports NO missing proof once each one is given', () => {
    const results: ProofOfDeliveryResult[] = [];
    mount(
      <ProofOfDelivery
        proofs={['recipient', 'signature']}
        required={['recipient', 'signature']}
        value={{
          recipient: 'Nuno Peralta',
          signature: { strokes: [], typedName: 'Nuno Peralta' },
        }}
        onSubmit={(result) => results.push(result)}
        testID="p"
      />,
    );
    click(byTestId('p-submit'));
    expect(results[0]!.missing).toEqual([]);
    expect(results[0]!.recipient).toBe('Nuno Peralta');
    expect(queryTestId('p-missing')).toBeNull();
  });

  it('stops the press ONLY while the app is saving', () => {
    const results: ProofOfDeliveryResult[] = [];
    mount(
      <ProofOfDelivery
        proofs={['recipient']}
        submitting
        onSubmit={(result) => results.push(result)}
        testID="p"
      />,
    );
    click(byTestId('p-submit'));
    expect(results).toEqual([]);
  });
});

describe('the result is the whole value, whatever was controlled', () => {
  it('fills every field the caller left out', () => {
    const results: ProofOfDeliveryResult[] = [];
    mount(
      <ProofOfDelivery
        proofs={['note']}
        value={{ note: 'Left with the neighbour' }}
        onSubmit={(result) => results.push(result)}
        testID="p"
      />,
    );
    click(byTestId('p-submit'));
    expect(results[0]).toEqual({
      signature: { strokes: [], typedName: '' },
      photos: [],
      code: '',
      recipient: '',
      note: 'Left with the neighbour',
      missing: [],
    });
  });
});
