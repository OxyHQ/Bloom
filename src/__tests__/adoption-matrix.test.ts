/**
 * @jest-environment node
 */

/**
 * The adoption matrix is GENERATED, and every shortfall in it is CLASSIFIED.
 *
 * Three properties, and each of them is the one that fails first without a gate:
 *
 *   1. `docs/adoption-matrix.mdx` is byte-identical to a fresh render, so a
 *      family that changes what it reads cannot ship a matrix describing a
 *      library Bloom no longer is. (Same arrangement as `design-tokens/tokens.json`.)
 *
 *   2. The classification is an EQUALITY with the derived set. A family that
 *      starts matching a contract and reads nothing has to be argued about — it
 *      cannot arrive as a silent blank — and a classification whose family no
 *      longer matches has to be deleted rather than left as a claim about code
 *      that moved. This is the assertion that makes the matrix falsifiable; a
 *      list of known gaps with no equality behind it is a list that only grows.
 *
 *   3. Every family that reads the field contract is EXERCISED by
 *      `FieldMembership.test.tsx`. That gate is a table, and a table a new
 *      subject does not join is how `aria-state-web.test.tsx` came to leave
 *      three `progressbar` siblings unmeasured while reporting green.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  CLASSIFICATION,
  CONTRACTS,
  MATRIX_PATH,
  matrix,
  renderAdoptionMatrix,
  unread,
  withVerdict,
} from './support/adoption-matrix';

const ROWS = matrix();

describe('the shipped adoption matrix is generated, not maintained', () => {
  it('is byte-identical to a fresh render', () => {
    expect(readFileSync(MATRIX_PATH, 'utf8')).toBe(renderAdoptionMatrix());
  });

  it('says so in the file itself', () => {
    expect(readFileSync(MATRIX_PATH, 'utf8')).toContain('AUTO-GENERATED');
  });

  it('covers every family exactly once', () => {
    const families = ROWS.map((row) => row.family);
    expect(new Set(families).size).toBe(families.length);
    // The families are the directories under `src/`, so this is the whole
    // catalogue rather than a list someone kept up to date.
    expect(families.length).toBeGreaterThan(100);
  });
});

describe('every shortfall is classified, as an equality', () => {
  it.each(CONTRACTS.map((contract) => [contract.key, contract] as const))(
    '%s: the classified set IS the set that applies and does not read',
    (key) => {
      const derived = unread(ROWS, key).sort();
      const declared = Object.keys(CLASSIFICATION[key] ?? {}).sort();
      // Both directions in one assertion, and the families are named in the
      // failure output — which is the point: the fix is either to adopt the
      // contract or to say in writing why it does not apply.
      expect(declared).toEqual(derived);
    },
  );

  it('leaves nothing unclassified', () => {
    const offenders = CONTRACTS.flatMap((contract) =>
      withVerdict(ROWS, contract.key, 'unclassified').map((family) => `${contract.key}: ${family}`),
    );
    expect(offenders).toEqual([]);
  });

  it('gives every classification a reason of its own', () => {
    for (const [key, families] of Object.entries(CLASSIFICATION)) {
      for (const [family, entry] of Object.entries(families)) {
        const where = `${key}/${family}`;
        // A verdict with no argument behind it is the shape an exemption list
        // takes just before it becomes permanent.
        expect([where, entry.reason.length > 40]).toEqual([where, true]);
      }
    }
  });
});

describe('the field contract', () => {
  const READERS = withVerdict(ROWS, 'field', 'reads');

  it('is read by the families the audit adopted it in', () => {
    // Named rather than counted: a count moves for the wrong reasons, and this
    // list is the deliverable of the adoption work.
    expect(READERS).toEqual([
      'checkbox',
      'date-picker',
      'delivery-slot',
      'field',
      'file-upload',
      'input-group',
      'input-otp',
      'mail-compose',
      'phone-input',
      'radio',
      'rating',
      'segmented-control',
      'select',
      'slider',
      'stepper',
      'switch',
      'tag-field',
      'text-field',
      'textarea',
    ]);
  });

  it('has every one of those families exercised by FieldMembership.test.tsx', () => {
    const gate = readFileSync(join(__dirname, 'FieldMembership.test.tsx'), 'utf8');
    // `field` itself publishes the contract rather than consuming it, and its
    // own suite is `FieldAssociation.test.tsx`.
    const consumers = READERS.filter((family) => family !== 'field');
    const missing = consumers.filter((family) => !gate.includes(`'../${family}'`));
    expect(missing).toEqual([]);
  });
});
