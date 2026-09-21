/**
 * The pure decisions `shipment-request` makes, kept out of the render so each
 * one can be walked at its boundary.
 */
import type { ShipmentLoad } from './types';

/**
 * What a weight field KEEPS of what was typed.
 *
 * Digits, and one decimal separator — a comma is accepted and emitted as a dot,
 * because half of Europe types one and no app wants to parse both. Everything
 * else goes, including the unit: `"18,5 kg"` is `"18.5"`. The unit is drawn
 * beside the field and never stored, so an app parses a number rather than a
 * sentence.
 *
 * A leading separator becomes `"0."`, because `".5"` is a number a person means
 * and `Number('.5')` happening to work is not a reason to store it that way.
 */
export function sanitizeWeight(text: string): string {
  const cleaned = text.replace(/,/g, '.').replace(/[^\d.]/g, '');
  const firstDot = cleaned.indexOf('.');
  if (firstDot === -1) return cleaned;
  const head = cleaned.slice(0, firstDot);
  const tail = cleaned.slice(firstDot + 1).replace(/\./g, '');
  return `${head === '' ? '0' : head}.${tail}`;
}

/**
 * Whether the load has been described enough to ask for quotes.
 *
 * It is the FORM's question, not the app's: an app that prices a job has its
 * own rules, and this only answers whether every control the picker draws has
 * been answered. Exported so a submit button can be disabled from the same
 * decision the picker makes, rather than from a second copy of it.
 */
export function isShipmentLoadComplete(load: ShipmentLoad): boolean {
  return (
    load.kind !== null &&
    load.size !== null &&
    load.weight.trim() !== '' &&
    Number(load.weight) > 0 &&
    load.quantity >= 1
  );
}

/**
 * The next selection of extras, in the OPTIONS' order.
 *
 * Reporting in the options' order rather than the tap order means the value is
 * stable: a form that round-trips through a server does not reorder its own
 * switches, and two equal selections compare equal.
 */
export function toggleShipmentExtra(
  options: readonly { key: string }[],
  selected: readonly string[],
  key: string,
): string[] {
  const next = new Set(selected);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  return options.map((option) => option.key).filter((candidate) => next.has(candidate));
}

/** Joins the non-empty parts of an accessible name. */
export function joinShipmentName(
  parts: ReadonlyArray<string | false | null | undefined>,
  separator = ', ',
): string {
  return parts
    .filter((part): part is string => typeof part === 'string' && part !== '')
    .join(separator);
}
