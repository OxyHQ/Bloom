/** Separate, explicitly bounded backend-precision gate. Does not weaken the
 * exact Chromium or 1:1 gates. Paints PNGs on actual opaque backgrounds and
 * produces a contact sheet; no device timing occurs during this analysis. */
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
const require = createRequire(import.meta.url),
  { PNG } = require('pngjs'),
  puppeteer = require(process.env.BLOOM_PUPPETEER_MODULE || 'puppeteer-core');
const input = process.env.AVATAR_QUANTIZATION_INPUT;
if (!input) throw Error('AVATAR_QUANTIZATION_INPUT must identify the physical all-images report');
const output = process.env.AVATAR_QUANTIZATION_OUTPUT || '.local/avatar-webgpu-quantization';
const sourceBytes = await readFile(input);
const source = JSON.parse(sourceBytes);
assert.deepEqual(
  source.cases.map((test) => `${test.cssSize}:${test.kind}`).sort(),
  [64, 96, 112, 320]
    .flatMap((size) => ['idle', 'reaction', 'work'].map((kind) => `${size}:${kind}`))
    .sort(),
  'Preserve every distinct size/state pair',
);
const limits = { premultipliedChannel: 1, alpha: 2, compositedRGB: 3 };
const tokens = JSON.parse(
  execFileSync(
    'bun',
    [
      '-e',
      "import {getResolvedTokens} from './src/theme/token-registry';console.log(JSON.stringify({light:getResolvedTokens('oxy','light')['--surface'],dark:getResolvedTokens('oxy','dark')['--surface']}));",
    ],
    { encoding: 'utf8' },
  ),
);
const backgrounds = [
  { name: 'Negro', color: '#000000' },
  { name: 'Blanco', color: '#ffffff' },
  { name: 'Surface clara · oxy', color: tokens.light },
  { name: 'Surface oscura · oxy', color: tokens.dark },
];
const cells = [];
for (const test of source.cases) {
  assert.deepEqual(
    test.cells.map((cell) => cell.index).sort((a, b) => a - b),
    Array.from({ length: 10 }, (_, i) => i),
  );
  assert.equal(test.sourceTile, test.cssSize === 64 ? 64 : test.cssSize === 320 ? 512 : 192);
  for (const cell of test.cells) {
    assert(cell.referencePNG && cell.actualPNG, 'All image pairs are required');
    const reference = PNG.sync.read(Buffer.from(cell.referencePNG.split(',')[1], 'base64')),
      actual = PNG.sync.read(Buffer.from(cell.actualPNG.split(',')[1], 'base64'));
    assert.equal(reference.width, test.cssSize * 2);
    assert.equal(reference.height, test.cssSize * 2);
    assert.equal(actual.width, reference.width);
    assert.equal(actual.height, reference.height);
    let changed = 0,
      maxPremult = 0,
      maxAlpha = 0,
      alphaMassA = 0,
      alphaMassB = 0,
      ax = 0,
      ay = 0,
      bx = 0,
      by = 0;
    for (let i = 0; i < reference.data.length; i += 4) {
      const a = reference.data,
        b = actual.data,
        x = (i / 4) % reference.width,
        y = Math.floor(i / 4 / reference.width);
      let different = false;
      for (let c = 0; c < 4; c++) if (a[i + c] !== b[i + c]) different = true;
      if (different) changed++;
      maxAlpha = Math.max(maxAlpha, Math.abs(a[i + 3] - b[i + 3]));
      for (let c = 0; c < 3; c++)
        maxPremult = Math.max(
          maxPremult,
          Math.abs(
            Math.round((a[i + c] * a[i + 3]) / 255) - Math.round((b[i + c] * b[i + 3]) / 255),
          ),
        );
      alphaMassA += a[i + 3];
      alphaMassB += b[i + 3];
      ax += x * a[i + 3];
      ay += y * a[i + 3];
      bx += x * b[i + 3];
      by += y * b[i + 3];
    }
    cells.push({
      cssSize: test.cssSize,
      sourceTile: test.sourceTile,
      kind: test.kind,
      index: cell.index,
      width: reference.width,
      height: reference.height,
      pixels: reference.width * reference.height,
      changed,
      maxPremult,
      maxAlpha,
      alphaCentroidShift: Math.hypot(
        ax / alphaMassA - bx / alphaMassB,
        ay / alphaMassA - by / alphaMassB,
      ),
      referencePNG: cell.referencePNG,
      actualPNG: cell.actualPNG,
    });
  }
}
assert.equal(cells.length, 120, 'Preserve the four sizes, three states and ten characters');
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH,
  headless: true,
  args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
});
let painted, contact;
try {
  const page = await browser.newPage();
  painted = await page.evaluate(
    async ({ cells, backgrounds }) => {
      const result = [];
      for (const cell of cells) {
        const a = new Image(),
          b = new Image();
        a.src = cell.referencePNG;
        b.src = cell.actualPNG;
        await Promise.all([a.decode(), b.decode()]);
        const canvas = document.createElement('canvas');
        canvas.width = cell.width;
        canvas.height = cell.height;
        const context = canvas.getContext('2d', { willReadFrequently: true }),
          composites = [];
        for (const background of backgrounds) {
          context.fillStyle = background.color;
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.drawImage(a, 0, 0);
          const before = context.getImageData(0, 0, canvas.width, canvas.height).data;
          context.fillStyle = background.color;
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.drawImage(b, 0, 0);
          const after = context.getImageData(0, 0, canvas.width, canvas.height).data;
          let changed = 0,
            max = 0,
            absolute = 0,
            worst = [0, 0];
          for (let i = 0; i < before.length; i += 4) {
            let difference = 0;
            for (let c = 0; c < 3; c++) {
              const delta = Math.abs(before[i + c] - after[i + c]);
              difference = Math.max(difference, delta);
              absolute += delta;
            }
            if (difference) changed++;
            if (difference > max) {
              max = difference;
              worst = [(i / 4) % canvas.width, Math.floor(i / 4 / canvas.width)];
            }
          }
          composites.push({
            background: background.name,
            color: background.color,
            changed,
            max,
            meanAbsolute: absolute / (canvas.width * canvas.height * 3),
            worst,
          });
        }
        result.push(composites);
      }
      return result;
    },
    { cells, backgrounds },
  );
  cells.forEach((cell, index) => {
    cell.composites = painted[index];
  });
  const selected = [];
  for (const size of [64, 96, 112, 320])
    for (const kind of ['idle', 'work']) {
      const candidates = cells
        .filter((cell) => cell.cssSize === size && cell.kind === kind)
        .sort(
          (a, b) =>
            Math.max(...b.composites.map((x) => x.max)) -
              Math.max(...a.composites.map((x) => x.max)) ||
            b.changed / b.pixels - a.changed / a.pixels,
        );
      selected.push(candidates[0]);
    }
  const worst = cells.reduce(
    (best, cell) =>
      Math.max(...cell.composites.map((x) => x.max)) >
      Math.max(...best.composites.map((x) => x.max))
        ? cell
        : best,
    cells[0],
  );
  contact = await page.evaluate(
    async ({ selected, worst, backgrounds }) => {
      const cellWidth = 140,
        labelWidth = 180,
        rowHeight = 170,
        header = 95,
        width = labelWidth + cellWidth * 8,
        height = header + rowHeight * selected.length + 430;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      context.fillStyle = '#dedede';
      context.fillRect(0, 0, width, height);
      context.fillStyle = '#181818';
      context.font = 'bold 24px sans-serif';
      context.fillText('WebView 148 · referencia Canvas2D / presentación WebGPU', 20, 32);
      context.font = '14px sans-serif';
      context.fillText(
        'PNG reales. Pares: referencia izquierda, WebGPU derecha. Vista general escalada; detalle inferior a píxel entero.',
        20,
        57,
      );
      for (let bg = 0; bg < 4; bg++) {
        context.font = '13px sans-serif';
        context.fillText(backgrounds[bg].name, labelWidth + bg * cellWidth * 2 + 8, 83);
      }
      for (let row = 0; row < selected.length; row++) {
        const cell = selected[row],
          a = new Image(),
          b = new Image();
        a.src = cell.referencePNG;
        b.src = cell.actualPNG;
        await Promise.all([a.decode(), b.decode()]);
        const y = header + row * rowHeight;
        context.fillStyle = '#181818';
        context.font = '13px sans-serif';
        context.fillText(`${cell.sourceTile} → ${cell.width}px`, 12, y + 25);
        context.fillText(`${cell.kind} · slot ${cell.index}`, 12, y + 46);
        context.fillText(
          `máx. RGB ${Math.max(...cell.composites.map((x) => x.max))}/255`,
          12,
          y + 67,
        );
        for (let bg = 0; bg < 4; bg++)
          for (let arm = 0; arm < 2; arm++) {
            const x = labelWidth + (bg * 2 + arm) * cellWidth;
            context.fillStyle = backgrounds[bg].color;
            context.fillRect(x + 3, y + 4, 134, 134);
            context.imageSmoothingEnabled = true;
            context.drawImage(arm ? b : a, x + 6, y + 7, 128, 128);
            context.fillStyle = '#181818';
            context.fillText(arm ? 'WebGPU' : 'Referencia', x + 8, y + 158);
          }
      }
      const y = header + selected.length * rowHeight;
      context.fillStyle = '#181818';
      context.font = 'bold 18px sans-serif';
      context.fillText(
        `Detalle del mayor error medido · ${worst.sourceTile}→${worst.width}px · ${worst.kind} · slot ${worst.index}`,
        15,
        y + 28,
      );
      const a = new Image(),
        b = new Image();
      a.src = worst.referencePNG;
      b.src = worst.actualPNG;
      await Promise.all([a.decode(), b.decode()]);
      for (let bg = 0; bg < 4; bg++) {
        const point = worst.composites[bg].worst,
          sx = Math.max(0, Math.min(worst.width - 16, point[0] - 8)),
          sy = Math.max(0, Math.min(worst.height - 16, point[1] - 8));
        for (let arm = 0; arm < 2; arm++) {
          const x = labelWidth + (bg * 2 + arm) * cellWidth;
          context.fillStyle = backgrounds[bg].color;
          context.fillRect(x + 3, y + 45, 134, 134);
          context.imageSmoothingEnabled = false;
          context.drawImage(arm ? b : a, sx, sy, 16, 16, x + 6, y + 48, 128, 128);
          context.fillStyle = '#181818';
          context.font = '13px sans-serif';
          context.fillText(arm ? 'WebGPU ×8' : 'Referencia ×8', x + 5, y + 198);
        }
      }
      context.font = '14px sans-serif';
      context.fillText(
        'Escala, geometría, MSAA y animación no cambian. Las diferencias de cuantización se miden por separado; no son identidad binaria.',
        15,
        y + 242,
      );
      return canvas.toDataURL('image/png');
    },
    { selected, worst, backgrounds },
  );
} finally {
  await browser.close();
}
const summary = {
  sourceRevision: source.sourceRevision,
  inputSHA256: createHash('sha256').update(sourceBytes).digest('hex'),
  measurement: 'Physical PNG pairs; composited offline in one Canvas2D backend. No timing claim.',
  limits,
  backgrounds,
  cases: cells.length,
  pixels: cells.reduce((sum, cell) => sum + cell.pixels, 0),
  maxPremult: Math.max(...cells.map((cell) => cell.maxPremult)),
  maxAlpha: Math.max(...cells.map((cell) => cell.maxAlpha)),
  maxCompositedRGB: Math.max(...cells.flatMap((cell) => cell.composites.map((value) => value.max))),
  maxAlphaCentroidShift: Math.max(...cells.map((cell) => cell.alphaCentroidShift)),
  sameSizeExact: cells
    .filter((cell) => cell.sourceTile === cell.width)
    .every((cell) => cell.changed === 0),
  cells: cells.map(({ referencePNG, actualPNG, ...cell }) => cell),
};
await mkdir(output, { recursive: true });
await writeFile(`${output}/report.json`, JSON.stringify(summary, null, 2) + '\n');
await writeFile(`${output}/contact-sheet.png`, Buffer.from(contact.split(',')[1], 'base64'));
console.log(JSON.stringify({ ...summary, cells: undefined }));
assert(summary.sameSizeExact, '1:1 presentation remains an exact gate');
assert(summary.maxPremult <= limits.premultipliedChannel);
assert(summary.maxAlpha <= limits.alpha);
assert(
  summary.maxCompositedRGB <= limits.compositedRGB,
  'Painted opaque-background output exceeds the independent precision envelope',
);
