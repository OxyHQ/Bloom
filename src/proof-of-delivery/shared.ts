/**
 * The pure decisions behind the door step: what a stroke looks like as a path,
 * whether a proof has been given, and what is still missing.
 *
 * All of it is exported because none of it can be measured where it is used.
 * **A jest test cannot see a canvas** — react-native-svg renders to a native
 * view on one platform and to a `<path>` on the other, and jsdom paints
 * neither — so the drawing is verified in a real browser
 * (`scripts/verify-signature-pad.mjs`) and the GEOMETRY is verified here, as a
 * function of points, where every boundary is reachable: no points, one point,
 * two, a hundred.
 */
import { hairlineOn, surfaceFillOn, surfaceTextOn } from '../styles/surface-levels';
import type { SurfaceTextPaint } from '../styles/surface-levels';
import type { Theme } from '../theme/types';
import { PROOF_GEOMETRY, PROOF_ORDER } from './constants';
import type {
  ProofKind,
  ProofOfDeliveryValue,
  SignaturePoint,
  SignatureStroke,
  SignatureValue,
} from './types';

export interface ProofPaint {
  surface: string;
  hairline: string;
  /** The pad's own fill — the next level up from whatever it is drawn on. */
  pad: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  /** The text rungs that clear AA on the PAD, which is not the form's fill. */
  padText: SurfaceTextPaint;
}

export function resolveProofPaint(theme: Theme, surface: string): ProofPaint {
  const text = surfaceTextOn(theme, surface);
  const pad = surfaceFillOn(theme, surface);
  return {
    surface,
    hairline: hairlineOn(theme, surface),
    pad,
    text: text.text,
    textSecondary: text.textSecondary,
    textTertiary: text.textTertiary,
    padText: surfaceTextOn(theme, pad),
  };
}

/** The empty value: nothing drawn, nothing typed, nothing photographed. */
export const EMPTY_SIGNATURE: SignatureValue = { strokes: [], typedName: '' };

export const EMPTY_PROOF: ProofOfDeliveryValue = {
  signature: EMPTY_SIGNATURE,
  photos: [],
  code: '',
  recipient: '',
  note: '',
};

/** Fills the gaps in a partial value with the empty one, leaving the rest alone. */
export function completeProofValue(
  value: Partial<ProofOfDeliveryValue> | undefined,
): ProofOfDeliveryValue {
  return {
    signature: value?.signature ?? EMPTY_SIGNATURE,
    photos: value?.photos ?? EMPTY_PROOF.photos,
    code: value?.code ?? '',
    recipient: value?.recipient ?? '',
    note: value?.note ?? '',
  };
}

/**
 * One stroke as SVG path data, smoothed.
 *
 *   no points     `''` — nothing drawn is not a path of length zero, it is no
 *                 path at all, and an `<path d="">` is an element the browser
 *                 still lays out
 *   one point     a DOT: a zero-length line with a round cap, which is what a
 *                 full stop in a signature is. Without this a tap lays down
 *                 nothing and the reader taps harder
 *   two or more   a move, then a quadratic through the MIDPOINTS of successive
 *                 points, ending on the last point. Midpoint smoothing is what
 *                 turns a 60-samples-a-second polyline into something that
 *                 reads as handwriting; joining the raw points draws the
 *                 pointer's own stair-stepping
 *
 * Coordinates are rounded to two places: a signature does not need a
 * ten-thousandth of a pixel, and the untrimmed floats triple the size of a
 * value an app is about to upload.
 */
export function signaturePath(stroke: SignatureStroke): string {
  if (stroke.length === 0) return '';
  const r = (n: number) => Math.round(n * 100) / 100;
  const first = stroke[0]!;
  if (stroke.length === 1) return `M${r(first.x)} ${r(first.y)}l0 0`;

  let d = `M${r(first.x)} ${r(first.y)}`;
  for (let i = 1; i < stroke.length - 1; i += 1) {
    const point = stroke[i]!;
    const next = stroke[i + 1]!;
    d += `Q${r(point.x)} ${r(point.y)} ${r((point.x + next.x) / 2)} ${r((point.y + next.y) / 2)}`;
  }
  const last = stroke[stroke.length - 1]!;
  d += `L${r(last.x)} ${r(last.y)}`;
  return d;
}

/**
 * Whether a point is far enough from the last one to be worth keeping.
 *
 * A pointer reports the same coordinate many times while a finger rests, and
 * every repeat is a quadratic segment of length zero that the smoothing then
 * has to average. Dropping them is what keeps the path proportional to the
 * MOVEMENT rather than to the duration of the press.
 */
export function shouldKeepSignaturePoint(
  last: SignaturePoint | undefined,
  point: SignaturePoint,
  minDistance: number = PROOF_GEOMETRY.smoothing,
): boolean {
  if (last === undefined) return true;
  return Math.abs(point.x - last.x) + Math.abs(point.y - last.y) >= minDistance;
}

/** Whether anything has been drawn. A stroke with no points is not one. */
export function hasSignatureInk(value: SignatureValue | undefined): boolean {
  return (value?.strokes ?? []).some((stroke) => stroke.length > 0);
}

/**
 * Whether a signature has been GIVEN, by either path.
 *
 * Drawn ink and a typed name are the same answer, and this is the one place
 * that is decided — so a screen-reader user who typed their name is never told
 * the signature is missing.
 */
export function isSignatureGiven(value: SignatureValue | undefined): boolean {
  return hasSignatureInk(value) || (value?.typedName ?? '').trim() !== '';
}

/**
 * Whether one proof has been given.
 *
 * A code counts only once it is FULL: `InputOtp` reports every keystroke, and
 * "2 of 4 digits" is not a code the recipient read out. `codeLength` is
 * therefore part of the question rather than something the caller checks after.
 */
export function isProofGiven(
  kind: ProofKind,
  value: ProofOfDeliveryValue,
  codeLength: number,
): boolean {
  switch (kind) {
    case 'signature':
      return isSignatureGiven(value.signature);
    case 'photo':
      return value.photos.length > 0;
    case 'code':
      return value.code.length >= codeLength;
    case 'recipient':
      return value.recipient.trim() !== '';
    case 'note':
      return value.note.trim() !== '';
  }
}

/**
 * The required proofs that have not been given, in the order they were asked.
 *
 * A proof that is required but NOT DRAWN cannot be missing: an app that asks for
 * four proofs and requires a fifth it never showed would refuse a delivery over
 * a control nobody could see. The intersection is taken deliberately, and the
 * ORDER is the drawn order so the summary reads down the form.
 */
export function missingProofs(
  value: ProofOfDeliveryValue,
  required: readonly ProofKind[],
  shown: readonly ProofKind[],
  codeLength: number,
): ProofKind[] {
  return shown.filter((kind) => required.includes(kind) && !isProofGiven(kind, value, codeLength));
}

/** The proofs to draw, in the canonical order, with anything unknown dropped. */
export function orderProofs(proofs: readonly ProofKind[]): ProofKind[] {
  return PROOF_ORDER.filter((kind) => proofs.includes(kind));
}
