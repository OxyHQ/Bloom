import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { RAINBOW_DARK, RAINBOW_LIGHT } from '../rainbow-artwork';

/**
 * The custom-colour swatch's artwork is part of every app that loads the agent editor. At
 * 390 x 390 px it was ~262 KB gzipped of that editor's JavaScript (Allo and Homiio raised their
 * bundle budgets for it); the swatch is drawn at 26 px.
 */
const MODULE = join(__dirname, '..', 'rainbow-artwork.ts');
const BUDGET_GZIP_BYTES = 16 * 1024;
/** 4x the 26 px swatch: past any screen density it is drawn on. */
const MAX_SIDE_PX = 104;

function pngSize(dataUri: string): { width: number; height: number } {
  const png = Buffer.from(dataUri.replace(/^data:image\/png;base64,/, ''), 'base64');
  expect(png.subarray(1, 4).toString('latin1')).toBe('PNG');
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
}

it('stays within its bundle budget', () => {
  const gzipped = gzipSync(readFileSync(MODULE)).length;
  expect(gzipped).toBeLessThanOrEqual(BUDGET_GZIP_BYTES);
});

it.each([
  ['light', RAINBOW_LIGHT],
  ['dark', RAINBOW_DARK],
])('draws the %s swatch from a bitmap no larger than it is shown', (_theme, uri) => {
  const { width, height } = pngSize(uri);
  expect(width).toBeLessThanOrEqual(MAX_SIDE_PX);
  expect(height).toBeLessThanOrEqual(MAX_SIDE_PX);
  // Sharp on a 3x screen (78 px).
  expect(width).toBeGreaterThanOrEqual(78);
});
