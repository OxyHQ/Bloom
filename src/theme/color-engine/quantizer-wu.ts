/**
 * Bloom colour engine — Wu colour quantizer.
 *
 * Faithful port of Material Color Utilities' `QuantizerWu` (Apache-2.0). Builds a
 * 3-D histogram of the image in a 32³ RGB grid, computes cumulative moments, then
 * greedily splits the colour cube along the axis of greatest variance until it
 * has `maxColors` boxes — each box's mean colour is a representative. Fully
 * DETERMINISTIC (no k-means/randomness), which is why Bloom uses it directly.
 */
import { blueFromArgb, greenFromArgb, redFromArgb } from './color-utils';
import { countByColor } from './quantizer-map';

const INDEX_BITS = 5;
const SIDE_LENGTH = 33; // (1 << INDEX_BITS) + 1
const TOTAL_SIZE = 35937; // SIDE_LENGTH³

type Direction = 'red' | 'green' | 'blue';

interface Box {
  r0: number;
  r1: number;
  g0: number;
  g1: number;
  b0: number;
  b1: number;
  vol: number;
}

const makeBox = (): Box => ({ r0: 0, r1: 0, g0: 0, g1: 0, b0: 0, b1: 0, vol: 0 });

/**
 * Read a moment/weight cell. Every index here is produced by `getIndex` (or a
 * bounded loop) and is always in range for the fixed-size grids, but under
 * `noUncheckedIndexedAccess` the element type is `number | undefined`; this
 * asserts the in-range invariant honestly instead of masking it.
 */
function cell(grid: number[], index: number): number {
  const value = grid[index];
  if (value === undefined) throw new RangeError(`quantizer grid index ${index} out of range`);
  return value;
}

/** Read a colour box by index (the box array is fully pre-populated). */
function boxAt(cubes: Box[], index: number): Box {
  const box = cubes[index];
  if (box === undefined) throw new RangeError(`quantizer box index ${index} out of range`);
  return box;
}

function getIndex(r: number, g: number, b: number): number {
  return (r << (INDEX_BITS * 2)) + (r << (INDEX_BITS + 1)) + r + (g << INDEX_BITS) + g + b;
}

/** Wu-quantize `pixels` into at most `maxColors` representative ARGB colours. */
export function quantizeWu(pixels: number[], maxColors: number): number[] {
  const weights = new Array<number>(TOTAL_SIZE).fill(0);
  const momentsR = new Array<number>(TOTAL_SIZE).fill(0);
  const momentsG = new Array<number>(TOTAL_SIZE).fill(0);
  const momentsB = new Array<number>(TOTAL_SIZE).fill(0);
  const moments = new Array<number>(TOTAL_SIZE).fill(0);

  // Histogram.
  const counts = countByColor(pixels);
  const bitsToRemove = 8 - INDEX_BITS;
  for (const [pixel, count] of counts.entries()) {
    const red = redFromArgb(pixel);
    const green = greenFromArgb(pixel);
    const blue = blueFromArgb(pixel);
    const index = getIndex((red >> bitsToRemove) + 1, (green >> bitsToRemove) + 1, (blue >> bitsToRemove) + 1);
    weights[index] = cell(weights, index) + count;
    momentsR[index] = cell(momentsR, index) + count * red;
    momentsG[index] = cell(momentsG, index) + count * green;
    momentsB[index] = cell(momentsB, index) + count * blue;
    moments[index] = cell(moments, index) + count * (red * red + green * green + blue * blue);
  }

  // Cumulative moments.
  for (let r = 1; r < SIDE_LENGTH; r++) {
    const area = new Array<number>(SIDE_LENGTH).fill(0);
    const areaR = new Array<number>(SIDE_LENGTH).fill(0);
    const areaG = new Array<number>(SIDE_LENGTH).fill(0);
    const areaB = new Array<number>(SIDE_LENGTH).fill(0);
    const area2 = new Array<number>(SIDE_LENGTH).fill(0.0);
    for (let g = 1; g < SIDE_LENGTH; g++) {
      let line = 0;
      let lineR = 0;
      let lineG = 0;
      let lineB = 0;
      let line2 = 0.0;
      for (let b = 1; b < SIDE_LENGTH; b++) {
        const index = getIndex(r, g, b);
        line += cell(weights, index);
        lineR += cell(momentsR, index);
        lineG += cell(momentsG, index);
        lineB += cell(momentsB, index);
        line2 += cell(moments, index);
        area[b] = cell(area, b) + line;
        areaR[b] = cell(areaR, b) + lineR;
        areaG[b] = cell(areaG, b) + lineG;
        areaB[b] = cell(areaB, b) + lineB;
        area2[b] = cell(area2, b) + line2;
        const prev = getIndex(r - 1, g, b);
        weights[index] = cell(weights, prev) + cell(area, b);
        momentsR[index] = cell(momentsR, prev) + cell(areaR, b);
        momentsG[index] = cell(momentsG, prev) + cell(areaG, b);
        momentsB[index] = cell(momentsB, prev) + cell(areaB, b);
        moments[index] = cell(moments, prev) + cell(area2, b);
      }
    }
  }

  const volume = (cube: Box, moment: number[]): number =>
    cell(moment, getIndex(cube.r1, cube.g1, cube.b1)) -
    cell(moment, getIndex(cube.r1, cube.g1, cube.b0)) -
    cell(moment, getIndex(cube.r1, cube.g0, cube.b1)) +
    cell(moment, getIndex(cube.r1, cube.g0, cube.b0)) -
    cell(moment, getIndex(cube.r0, cube.g1, cube.b1)) +
    cell(moment, getIndex(cube.r0, cube.g1, cube.b0)) +
    cell(moment, getIndex(cube.r0, cube.g0, cube.b1)) -
    cell(moment, getIndex(cube.r0, cube.g0, cube.b0));

  const bottom = (cube: Box, direction: Direction, moment: number[]): number => {
    switch (direction) {
      case 'red':
        return (
          -cell(moment, getIndex(cube.r0, cube.g1, cube.b1)) +
          cell(moment, getIndex(cube.r0, cube.g1, cube.b0)) +
          cell(moment, getIndex(cube.r0, cube.g0, cube.b1)) -
          cell(moment, getIndex(cube.r0, cube.g0, cube.b0))
        );
      case 'green':
        return (
          -cell(moment, getIndex(cube.r1, cube.g0, cube.b1)) +
          cell(moment, getIndex(cube.r1, cube.g0, cube.b0)) +
          cell(moment, getIndex(cube.r0, cube.g0, cube.b1)) -
          cell(moment, getIndex(cube.r0, cube.g0, cube.b0))
        );
      case 'blue':
        return (
          -cell(moment, getIndex(cube.r1, cube.g1, cube.b0)) +
          cell(moment, getIndex(cube.r1, cube.g0, cube.b0)) +
          cell(moment, getIndex(cube.r0, cube.g1, cube.b0)) -
          cell(moment, getIndex(cube.r0, cube.g0, cube.b0))
        );
    }
  };

  const top = (cube: Box, direction: Direction, position: number, moment: number[]): number => {
    switch (direction) {
      case 'red':
        return (
          cell(moment, getIndex(position, cube.g1, cube.b1)) -
          cell(moment, getIndex(position, cube.g1, cube.b0)) -
          cell(moment, getIndex(position, cube.g0, cube.b1)) +
          cell(moment, getIndex(position, cube.g0, cube.b0))
        );
      case 'green':
        return (
          cell(moment, getIndex(cube.r1, position, cube.b1)) -
          cell(moment, getIndex(cube.r1, position, cube.b0)) -
          cell(moment, getIndex(cube.r0, position, cube.b1)) +
          cell(moment, getIndex(cube.r0, position, cube.b0))
        );
      case 'blue':
        return (
          cell(moment, getIndex(cube.r1, cube.g1, position)) -
          cell(moment, getIndex(cube.r1, cube.g0, position)) -
          cell(moment, getIndex(cube.r0, cube.g1, position)) +
          cell(moment, getIndex(cube.r0, cube.g0, position))
        );
    }
  };

  const variance = (cube: Box): number => {
    const dr = volume(cube, momentsR);
    const dg = volume(cube, momentsG);
    const db = volume(cube, momentsB);
    const xx =
      cell(moments, getIndex(cube.r1, cube.g1, cube.b1)) -
      cell(moments, getIndex(cube.r1, cube.g1, cube.b0)) -
      cell(moments, getIndex(cube.r1, cube.g0, cube.b1)) +
      cell(moments, getIndex(cube.r1, cube.g0, cube.b0)) -
      cell(moments, getIndex(cube.r0, cube.g1, cube.b1)) +
      cell(moments, getIndex(cube.r0, cube.g1, cube.b0)) +
      cell(moments, getIndex(cube.r0, cube.g0, cube.b1)) -
      cell(moments, getIndex(cube.r0, cube.g0, cube.b0));
    const hypotenuse = dr * dr + dg * dg + db * db;
    return xx - hypotenuse / volume(cube, weights);
  };

  const maximize = (
    cube: Box,
    direction: Direction,
    first: number,
    last: number,
    wholeR: number,
    wholeG: number,
    wholeB: number,
    wholeW: number,
  ): { cutLocation: number; maximum: number } => {
    const bottomR = bottom(cube, direction, momentsR);
    const bottomG = bottom(cube, direction, momentsG);
    const bottomB = bottom(cube, direction, momentsB);
    const bottomW = bottom(cube, direction, weights);
    let max = 0.0;
    let cut = -1;
    for (let i = first; i < last; i++) {
      let halfR = bottomR + top(cube, direction, i, momentsR);
      let halfG = bottomG + top(cube, direction, i, momentsG);
      let halfB = bottomB + top(cube, direction, i, momentsB);
      let halfW = bottomW + top(cube, direction, i, weights);
      if (halfW === 0) continue;
      let temp = (halfR * halfR + halfG * halfG + halfB * halfB) / halfW;
      halfR = wholeR - halfR;
      halfG = wholeG - halfG;
      halfB = wholeB - halfB;
      halfW = wholeW - halfW;
      if (halfW === 0) continue;
      temp += (halfR * halfR + halfG * halfG + halfB * halfB) / halfW;
      if (temp > max) {
        max = temp;
        cut = i;
      }
    }
    return { cutLocation: cut, maximum: max };
  };

  const cut = (one: Box, two: Box): boolean => {
    const wholeR = volume(one, momentsR);
    const wholeG = volume(one, momentsG);
    const wholeB = volume(one, momentsB);
    const wholeW = volume(one, weights);
    const maxR = maximize(one, 'red', one.r0 + 1, one.r1, wholeR, wholeG, wholeB, wholeW);
    const maxG = maximize(one, 'green', one.g0 + 1, one.g1, wholeR, wholeG, wholeB, wholeW);
    const maxB = maximize(one, 'blue', one.b0 + 1, one.b1, wholeR, wholeG, wholeB, wholeW);
    let direction: Direction;
    if (maxR.maximum >= maxG.maximum && maxR.maximum >= maxB.maximum) {
      if (maxR.cutLocation < 0) return false;
      direction = 'red';
    } else if (maxG.maximum >= maxR.maximum && maxG.maximum >= maxB.maximum) {
      direction = 'green';
    } else {
      direction = 'blue';
    }
    two.r1 = one.r1;
    two.g1 = one.g1;
    two.b1 = one.b1;
    switch (direction) {
      case 'red':
        one.r1 = maxR.cutLocation;
        two.r0 = one.r1;
        two.g0 = one.g0;
        two.b0 = one.b0;
        break;
      case 'green':
        one.g1 = maxG.cutLocation;
        two.r0 = one.r0;
        two.g0 = one.g1;
        two.b0 = one.b0;
        break;
      case 'blue':
        one.b1 = maxB.cutLocation;
        two.r0 = one.r0;
        two.g0 = one.g0;
        two.b0 = one.b1;
        break;
    }
    one.vol = (one.r1 - one.r0) * (one.g1 - one.g0) * (one.b1 - one.b0);
    two.vol = (two.r1 - two.r0) * (two.g1 - two.g0) * (two.b1 - two.b0);
    return true;
  };

  // Greedily split the colour cube.
  const cubes: Box[] = Array.from({ length: maxColors }, makeBox);
  const volumeVariance = new Array<number>(maxColors).fill(0.0);
  const firstCube = boxAt(cubes, 0);
  firstCube.r0 = 0;
  firstCube.g0 = 0;
  firstCube.b0 = 0;
  firstCube.r1 = SIDE_LENGTH - 1;
  firstCube.g1 = SIDE_LENGTH - 1;
  firstCube.b1 = SIDE_LENGTH - 1;
  let generatedColorCount = maxColors;
  let next = 0;
  for (let i = 1; i < maxColors; i++) {
    if (cut(boxAt(cubes, next), boxAt(cubes, i))) {
      volumeVariance[next] = boxAt(cubes, next).vol > 1 ? variance(boxAt(cubes, next)) : 0.0;
      volumeVariance[i] = boxAt(cubes, i).vol > 1 ? variance(boxAt(cubes, i)) : 0.0;
    } else {
      volumeVariance[next] = 0.0;
      i--;
    }
    next = 0;
    let temp = cell(volumeVariance, 0);
    for (let j = 1; j <= i; j++) {
      if (cell(volumeVariance, j) > temp) {
        temp = cell(volumeVariance, j);
        next = j;
      }
    }
    if (temp <= 0.0) {
      generatedColorCount = i + 1;
      break;
    }
  }

  // Mean colour of each box.
  const colors: number[] = [];
  for (let i = 0; i < generatedColorCount; i++) {
    const cube = boxAt(cubes, i);
    const weight = volume(cube, weights);
    if (weight > 0) {
      const r = Math.round(volume(cube, momentsR) / weight);
      const g = Math.round(volume(cube, momentsG) / weight);
      const b = Math.round(volume(cube, momentsB) / weight);
      colors.push(((255 << 24) | ((r & 0x0ff) << 16) | ((g & 0x0ff) << 8) | (b & 0x0ff)) >>> 0);
    }
  }
  return colors;
}
