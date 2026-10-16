/**
 * Fractional keys: strings that sort in the order of their blocks, with room
 * between any two, so a block is placed or moved by writing one key on itself
 * and never renumbers its siblings. The algorithm is the one in David
 * Greenspan's "Implementing Fractional Indexing" (as in `fractional-indexing`,
 * written out here because that package ships only ES modules): an integer
 * part whose length is told by its head character, then a fraction.
 */
const DIGITS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const ZERO = DIGITS[0] as string;
const SMALLEST_INTEGER = 'A00000000000000000000000000';

function integerLength(head: string): number {
  if (head >= 'a' && head <= 'z') return head.charCodeAt(0) - 'a'.charCodeAt(0) + 2;
  if (head >= 'A' && head <= 'Z') return 'Z'.charCodeAt(0) - head.charCodeAt(0) + 2;
  throw new Error(`Invalid fractional key head: ${head}`);
}

function integerPart(key: string): string {
  const length = integerLength(key[0] as string);
  if (length > key.length) throw new Error(`Invalid fractional key: ${key}`);
  return key.slice(0, length);
}

function validateKey(key: string): void {
  if (key === SMALLEST_INTEGER) throw new Error(`Invalid fractional key: ${key}`);
  const integer = integerPart(key);
  const fraction = key.slice(integer.length);
  if (fraction.endsWith(ZERO)) throw new Error(`Invalid fractional key: ${key}`);
}

/** A string strictly between two fractions (`b` null means no upper bound). */
function midpoint(a: string, b: string | null): string {
  if (b !== null && a >= b) throw new Error(`${a} >= ${b}`);
  if (a.endsWith(ZERO) || (b !== null && b.endsWith(ZERO))) throw new Error('Trailing zero');
  if (b) {
    let n = 0;
    while ((a[n] ?? ZERO) === b[n]) n += 1;
    if (n > 0) return b.slice(0, n) + midpoint(a.slice(n), b.slice(n));
  }
  const digitA = a ? DIGITS.indexOf(a[0] as string) : 0;
  const digitB = b !== null ? DIGITS.indexOf(b[0] as string) : DIGITS.length;
  if (digitB - digitA > 1) return DIGITS[Math.round(0.5 * (digitA + digitB))] as string;
  if (b && b.length > 1) return b.slice(0, 1);
  return (DIGITS[digitA] as string) + midpoint(a.slice(1), null);
}

function incrementInteger(x: string): string | null {
  const [head, ...digits] = x.split('') as [string, ...string[]];
  let carry = true;
  for (let i = digits.length - 1; carry && i >= 0; i -= 1) {
    const d = DIGITS.indexOf(digits[i] as string) + 1;
    if (d === DIGITS.length) digits[i] = ZERO;
    else {
      digits[i] = DIGITS[d] as string;
      carry = false;
    }
  }
  if (carry) {
    if (head === 'Z') return `a${ZERO}`;
    if (head === 'z') return null;
    const next = String.fromCharCode(head.charCodeAt(0) + 1);
    if (next > 'a') digits.push(ZERO);
    else digits.pop();
    return next + digits.join('');
  }
  return head + digits.join('');
}

function decrementInteger(x: string): string | null {
  const [head, ...digits] = x.split('') as [string, ...string[]];
  let borrow = true;
  for (let i = digits.length - 1; borrow && i >= 0; i -= 1) {
    const d = DIGITS.indexOf(digits[i] as string) - 1;
    if (d === -1) digits[i] = DIGITS[DIGITS.length - 1] as string;
    else {
      digits[i] = DIGITS[d] as string;
      borrow = false;
    }
  }
  if (borrow) {
    if (head === 'a') return `Z${DIGITS[DIGITS.length - 1]}`;
    if (head === 'A') return null;
    const next = String.fromCharCode(head.charCodeAt(0) - 1);
    if (next < 'Z') digits.push(DIGITS[DIGITS.length - 1] as string);
    else digits.pop();
    return next + digits.join('');
  }
  return head + digits.join('');
}

/**
 * A key that sorts after `a` and before `b` (either may be null: no bound).
 * Throws when `a >= b`.
 */
export function keyBetween(a: string | null, b: string | null): string {
  if (a !== null) validateKey(a);
  if (b !== null) validateKey(b);
  if (a !== null && b !== null && a >= b) throw new Error(`${a} >= ${b}`);
  if (a === null) {
    if (b === null) return `a${ZERO}`;
    const integer = integerPart(b);
    const fraction = b.slice(integer.length);
    if (integer === SMALLEST_INTEGER) return integer + midpoint('', fraction);
    if (integer < b) return integer;
    const lower = decrementInteger(integer);
    if (lower === null) throw new Error('Cannot go below the smallest key');
    return lower;
  }
  if (b === null) {
    const integer = integerPart(a);
    const fraction = a.slice(integer.length);
    const higher = incrementInteger(integer);
    return higher === null ? integer + midpoint(fraction, null) : higher;
  }
  const integerA = integerPart(a);
  const fractionA = a.slice(integerA.length);
  const integerB = integerPart(b);
  const fractionB = b.slice(integerB.length);
  if (integerA === integerB) return integerA + midpoint(fractionA, fractionB);
  const higher = incrementInteger(integerA);
  if (higher === null) throw new Error('Cannot go above the largest key');
  return higher < b ? higher : integerA + midpoint(fractionA, null);
}

/** Whether `key` is a well-formed fractional key. */
export function isFractionalKey(key: unknown): key is string {
  if (typeof key !== 'string' || key.length === 0) return false;
  try {
    validateKey(key);
    return true;
  } catch {
    return false;
  }
}
