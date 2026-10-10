import { pickMessages } from '../locale/messages';
import { SHAPE_MESSAGES } from './messages';
import type { NamedShapeName } from './paths';

/** The named shapes, in the order a picker should show them. */
export const ORDER: readonly NamedShapeName[] = [
  'square',
  'slanted',
  'arch',
  'semicircle',
  'oval',
  'pill',
  'triangle',
  'arrow',
  'fan',
  'diamond',
  'clamshell',
  'pentagon',
  'gem',
  'very-sunny',
  'sunny',
  '4-sided-cookie',
  '6-sided-cookie',
  '7-sided-cookie',
  '9-sided-cookie',
  '12-sided-cookie',
  '4-leaf-clover',
  '8-leaf-clover',
  'burst',
  'soft-burst',
  'boom',
  'soft-boom',
  'flower',
  'puffy',
  'puffy-diamond',
  'ghost-ish',
  'pixel-circle',
  'pixel-triangle',
  'bun',
  'heart',
];

/**
 * A shape picker's rows — each named shape and its display name in `locale`
 * (the app's, from `BloomProvider locale`; the runtime's when omitted), in
 * {@link ORDER}. So a consumer re-derives neither the order nor
 * the words.
 */
export function labels(locale?: string): { name: NamedShapeName; label: string }[] {
  const { shapes } = pickMessages(SHAPE_MESSAGES, locale);
  return ORDER.map((name) => ({ name, label: shapes[name] }));
}

/**
 * The shape picker's rows in English. {@link labels} gives them in
 * the app's language.
 */
export const LABELS: { name: NamedShapeName; label: string }[] = labels('en');
