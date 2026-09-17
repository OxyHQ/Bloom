import { readFileSync } from 'node:fs';
import { join } from 'node:path';

type Point = [x: number, y: number];

/** Flatten one `d` into closed polygons, sampling cubics at 200 steps. */
function flatten(d: string): Point[][] {
  const tokens = d.match(/[MLHVCZ]|-?\d*\.?\d+/gi) ?? [];
  const rings: Point[][] = [];
  let ring: Point[] = [];
  let cursor: Point = [0, 0];
  let start: Point = [0, 0];
  let i = 0;
  const num = () => Number(tokens[i++]);

  const cubic = (c1: Point, c2: Point, end: Point) => {
    for (let t = 1; t <= 200; t += 1) {
      const s = t / 200;
      const u = 1 - s;
      ring.push([
        u * u * u * cursor[0] + 3 * u * u * s * c1[0] + 3 * u * s * s * c2[0] + s * s * s * end[0],
        u * u * u * cursor[1] + 3 * u * u * s * c1[1] + 3 * u * s * s * c2[1] + s * s * s * end[1],
      ]);
    }
    cursor = end;
  };

  while (i < tokens.length) {
    const command = tokens[i++];
    switch (command) {
      case 'M': {
        if (ring.length > 0) rings.push(ring);
        ring = [];
        cursor = [num(), num()];
        start = cursor;
        ring.push(cursor);
        break;
      }
      case 'L':
        cursor = [num(), num()];
        ring.push(cursor);
        break;
      case 'H':
        cursor = [num(), cursor[1]];
        ring.push(cursor);
        break;
      case 'V':
        cursor = [cursor[0], num()];
        ring.push(cursor);
        break;
      case 'C':
        cubic([num(), num()], [num(), num()], [num(), num()]);
        break;
      case 'Z':
        cursor = start;
        break;
      default:
        throw new Error(`unhandled path command: ${String(command)}`);
    }
  }
  if (ring.length > 0) rings.push(ring);
  return rings;
}

/** Total enclosed area of every subpath, by the shoelace formula. */
function ink(d: string): number {
  return flatten(d).reduce((total, ring) => {
    let twice = 0;
    for (let i = 0; i < ring.length; i += 1) {
      const [x1, y1] = ring[i]!;
      const [x2, y2] = ring[(i + 1) % ring.length]!;
      twice += x1 * y2 - x2 * y1;
    }
    return total + Math.abs(twice) / 2;
  }, 0);
}

const SRC = join(__dirname, '..');

/**
 * The `path:` a `createSinglePathSVG` icon is built from, read from the SOURCE.
 *
 * Not from a render: `useCommonSVGProps` is a hook, so pulling the element out
 * of one of these outside React is a different thing being measured. The string
 * in the file is what ships.
 */
function pathOf(file: string): string {
  const text = readFileSync(join(SRC, file), 'utf8');
  const match = /path:\s*'([^']+)'/.exec(text);
  if (!match) throw new Error(`no path literal in ${file}`);
  return match[1]!;
}

const PLAY = 'icons/remix/RiPlayFill.tsx';
const STOCK_PAUSE = 'icons/remix/RiPauseFill.tsx';
const BLOOM_PAUSE = 'media-controls/PauseGlyph.tsx';

describe('the pause glyph carries the play triangle`s ink', () => {
  it('measures a known shape correctly before measuring either glyph', () => {
    // A 10 × 10 square, and the same square with one corner cut by a cubic that
    // stays on the straight line — area unchanged, so the sampler is not adding
    // or losing area of its own.
    expect(ink('M0 0H10V10H0V0Z')).toBeCloseTo(100, 6);
    expect(ink('M0 0H10V10H0V0Z M20 0H22V14H20V0Z')).toBeCloseTo(128, 6);
  });

  it('the stock pause is barely over half the triangle — the bug', () => {
    const play = ink(pathOf(PLAY));
    const stock = ink(pathOf(STOCK_PAUSE));
    expect(play).toBeCloseTo(95.5, 0);
    expect(stock).toBeCloseTo(56, 6);
    expect(stock / play).toBeCloseTo(0.59, 2);
  });

  it('PlayButton draws Bloom`s pause, not the stock one', () => {
    const text = readFileSync(join(SRC, 'media-controls/PlayButton.tsx'), 'utf8');
    expect(text).toContain('PauseGlyph');
    expect(text).not.toContain('RiPauseFill');
  });

  it('Bloom`s pause is within 5% of the triangle, at the same vertical extent', () => {
    const play = ink(pathOf(PLAY));
    const pause = ink(pathOf(BLOOM_PAUSE));
    expect(pause / play).toBeGreaterThan(0.95);
    expect(pause / play).toBeLessThan(1.05);

    // Same top and bottom as the triangle (y 4 → 20): equal area alone would
    // also be satisfied by two short fat bars, which would not read as a pause.
    const ys = flatten(pathOf(BLOOM_PAUSE)).flat().map(([, y]) => y);
    expect(Math.min(...ys)).toBe(4);
    expect(Math.max(...ys)).toBe(20);

    // Still TWO bars with a real gap between them, not one block.
    const xs = flatten(pathOf(BLOOM_PAUSE)).map((ring) => ring.map(([x]) => x));
    expect(xs).toHaveLength(2);
    const right = Math.max(...xs[0]!);
    const left = Math.min(...xs[1]!);
    expect(left - right).toBeGreaterThanOrEqual(4);
  });
});
