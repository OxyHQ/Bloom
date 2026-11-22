/**
 * The Chrome check draws each case in a table cell (`Language/Parity`): a
 * case that draws only through a portal (an open dialog) leaves both cells
 * empty there, so it must be `isolated`, drawn alone in a frame of its own.
 * Every case the stories show either draws in its cell, says it draws
 * nothing on the web, or is isolated.
 */
import { FAMILIES } from '../src/stories/parity-families';
import { drawsInPlace } from './support/web';

describe('every case Chrome compares in a cell draws in it', () => {
  for (const [family, cases] of Object.entries(FAMILIES))
    for (const c of cases) {
      if (c.isolated || c.drawsNothing?.includes('web')) continue;
      it(`${family}: ${c.name}`, () => {
        expect(drawsInPlace(c.bloom())).toBe(true);
        expect(drawsInPlace(c.language())).toBe(true);
      });
    }
});
