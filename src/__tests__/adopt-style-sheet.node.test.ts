/**
 * @jest-environment node
 */

import { adoptStyleSheet, dropStyleSheet } from '../styles/adopt-style-sheet';

/* Centralising the injection also centralised the `typeof document` guard that
 * used to sit in each fork. It has to stay: `adoptStyleSheet` is reached from a
 * platform-neutral component (`BottomSheetBase`) and from every server render,
 * where throwing would take the whole page down rather than lose a stylesheet.
 * Needs its own file — jest picks the environment per file. */
describe('adoptStyleSheet with no document (native / SSR)', () => {
  it('the environment under test genuinely has no document', () => {
    expect(typeof document).toBe('undefined');
  });

  it('is a no-op rather than a throw', () => {
    expect(() => adoptStyleSheet('bloom-test', '.x {}')).not.toThrow();
    expect(() => dropStyleSheet('bloom-test')).not.toThrow();
  });
});
