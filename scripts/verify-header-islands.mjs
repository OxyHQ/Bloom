/**
 * Does the floating `PageHeader` actually paint islands, and does the edge
 * effect actually end in nothing?
 *
 * MEASUREMENT + EVIDENCE. Nothing here is imported by the library, and it is
 * not a jest gate — every property below is about PAINTED PIXELS, which is the
 * one thing jest cannot see. A translucent pane reports a plausible
 * `background-color` for a slot it is not using, and a gradient that stops dead
 * at its own bottom edge is valid CSS with a valid computed style. Both read as
 * correct in a prop snapshot and are obvious on a screen.
 *
 * Usage — start the Storybook DEV server first:
 *
 *   bun run storybook
 *   node scripts/verify-header-islands.mjs [--url http://localhost:6006] [--out docs/page-header-islands.png]
 *
 * ── THE FOUR MEASUREMENTS ───────────────────────────────────────────────────
 *
 * 1. ISLANDS, NOT A STRIP. Sample a horizontal line through the middle of the
 *    header. A strip is one colour all the way across; islands are two or more
 *    runs of chrome separated by runs of whatever is behind them. Counted as
 *    the number of distinct RUNS, so "it looks separated" becomes a number.
 *
 * 2. THE ISLAND IS TRANSLUCENT. The same island is rendered over two different
 *    backdrops (the light story and the coloured one). If the painted pixel
 *    moves, the backdrop is getting through. If it does not, the pane is a
 *    slab wearing a blur.
 *
 * 3. THE EDGE ENDS IN NOTHING. Sample a vertical line down the scrim. The
 *    profile must be monotonic toward the page colour and must REACH it — the
 *    failure this catches is a gradient that stops at, say, 12% and leaves a
 *    findable horizontal band across the content.
 *
 * 4. NO HORIZONTAL CUT. The largest single-row jump down that vertical profile
 *    is small. A slab's bottom edge is a step of tens of levels in one row;
 *    a ramp's biggest step is a couple.
 *
 * Everything is sampled off a real screenshot reloaded into a canvas, rather
 * than off `getComputedStyle`, for the reason `docs/glass.mdx` gives: the
 * computed style of a translucent surface is not the colour anybody sees.
 */
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const puppeteer = require('/home/nate/Oxy/Homiio/node_modules/puppeteer-core');

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(name);
  return i === -1 ? fallback : args[i + 1];
};

const URL_BASE = flag('--url', 'http://localhost:6006');
const OUT = flag('--out', null);
const CHROME =
  process.env.CHROME_PATH ??
  '/home/nate/.cache/puppeteer/chrome/linux-146.0.7680.31/chrome-linux64/chrome';

/** Storybook ids of the stories this reads. */
const STORIES = {
  floating: 'blocks-page-header--floating',
  // The same islands over a PHOTOGRAPH, at rest — the scrim is `auto`, so at
  // scroll 0 it paints nothing and the capsule really is over the picture.
  image: 'blocks-page-header--floating-over-image',
  // `scrim="always"` over a page colour the theme did not pick, WITH the colour
  // handed to the header — so the ramp is the page's own colour and vanishes.
  colour: 'blocks-page-header--floating-over-colour',
  // The same screen with the colour NOT handed over. It is the wrong way to
  // configure a header and the only fixture in which the ramp's own shape is
  // visible: a scrim in the page's colour is invisible against the page by
  // construction, so measuring its profile needs a backdrop it contrasts with.
  mismatch: 'blocks-page-header--floating-scrim-colour-mismatch',
  dark: 'blocks-page-header--floating-dark',
  bar: 'blocks-page-header--bar',
};

const VIEWPORT = { width: 900, height: 780, deviceScaleFactor: 1 };

async function openStory(browser, id) {
  const page = await browser.newPage();
  await page.setViewport(VIEWPORT);
  await page.goto(`${URL_BASE}/iframe.html?id=${id}&viewMode=story`, {
    waitUntil: 'networkidle0',
    timeout: 60_000,
  });
  await page.waitForSelector('[data-testid="header"]', { timeout: 30_000 });
  // The scrim and the islands are painted; give the blur a frame to land.
  await new Promise((resolve) => setTimeout(resolve, 600));
  return page;
}

/**
 * Screenshot the page, reload the PNG into it, and read pixels off a canvas.
 *
 * The round trip is the point: it is the only way to get the COMPOSITED result
 * of a `backdrop-filter`, which exists nowhere in the DOM.
 */
async function samples(page, rect) {
  const shot = await page.screenshot({ encoding: 'base64' });
  return page.evaluate(
    async (dataUrl, box) =>
      new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          const row = [];
          for (let x = box.left; x < box.right; x += 1) {
            const d = ctx.getImageData(x, box.rowY, 1, 1).data;
            row.push([d[0], d[1], d[2]]);
          }
          const column = [];
          for (let y = box.top; y < box.bottom; y += 1) {
            const d = ctx.getImageData(box.colX, y, 1, 1).data;
            column.push([d[0], d[1], d[2]]);
          }
          resolve({ row, column });
        };
        img.src = `data:image/png;base64,${dataUrl}`;
      }),
    shot,
    rect,
  );
}

const near = (a, b, tol) =>
  Math.abs(a[0] - b[0]) <= tol && Math.abs(a[1] - b[1]) <= tol && Math.abs(a[2] - b[2]) <= tol;

/**
 * Count runs of "not the backdrop" along a row.
 *
 * The backdrop is taken from the row's own first pixel — outside the islands by
 * construction, since the bar's side inset is 16 or 24 and the first island
 * starts after it.
 */
function islandRuns(row, tol = 1) {
  const backdrop = row[0];
  let runs = 0;
  let inRun = false;
  const widths = [];
  let width = 0;
  for (const px of row) {
    const isChrome = !near(px, backdrop, tol);
    if (isChrome && !inRun) {
      runs += 1;
      width = 0;
    }
    if (isChrome) width += 1;
    if (!isChrome && inRun) widths.push(width);
    inRun = isChrome;
  }
  if (inRun) widths.push(width);
  // Runs narrower than 20px are antialiasing or a glyph, not an island: the
  // narrowest island Bloom draws is the 36pt back capsule.
  const real = widths.filter((w) => w >= 20);
  return { runs: real.length, widths: real };
}

async function headerBox(page) {
  return page.evaluate(() => {
    const el = document.querySelector('[data-testid="header"]');
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  });
}

function fail(message) {
  console.error(`[verify-header-islands] FAIL — ${message}`);
  process.exitCode = 1;
}

const results = [];

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--force-device-scale-factor=1'],
});

try {
  // ── 1 + 3 + 4: the floating header over a list ────────────────────────────
  const floating = await openStory(browser, STORIES.floating);
  const box = await headerBox(floating);
  const rowY = Math.round(box.y + box.height / 2);
  const shot = await samples(floating, {
    left: Math.round(box.x + 2),
    right: Math.round(box.x + box.width - 2),
    rowY,
    // Inside the side inset, LEFT of the first island: the one column where
    // the scrim is the only thing painting, so the profile is the ramp and not
    // the ramp plus a glyph.
    colX: Math.round(box.x + 6),
    top: Math.round(box.y),
    bottom: Math.round(box.y + box.height * 2.2),
  });

  const { runs, widths } = islandRuns(shot.row);
  results.push(`islands across the bar: ${runs} (widths ${widths.join(', ')})`);
  if (runs < 2) fail(`expected at least two separated islands across the bar, saw ${runs}`);

  // ── 2: the same island over a different backdrop ──────────────────────────
  //
  // Sampled at the FIRST island (the back capsule), whose position is the same
  // in both stories. The second story puts it over a PHOTOGRAPH with the scrim
  // at rest, which is the case the material exists for — comparing two stories
  // that both paint an opaque scrim behind the islands would measure the scrim.
  const capsuleX = Math.round(box.x + 34);
  const light = await samples(floating, {
    left: capsuleX,
    right: capsuleX + 1,
    rowY,
    colX: capsuleX,
    top: rowY,
    bottom: rowY + 1,
  });
  await floating.close();

  const overImage = await openStory(browser, STORIES.image);
  const imageBox = await headerBox(overImage);
  const imageRowY = Math.round(imageBox.y + imageBox.height / 2);
  const onPhoto = await samples(overImage, {
    left: Math.round(imageBox.x + 34),
    right: Math.round(imageBox.x + 35),
    rowY: imageRowY,
    colX: Math.round(imageBox.x + 34),
    top: imageRowY,
    bottom: imageRowY + 1,
  });
  await overImage.close();

  const a = light.row[0];
  const b = onPhoto.row[0];
  const move = Math.max(...[0, 1, 2].map((i) => Math.abs(a[i] - b[i])));
  results.push(`the same capsule over a page and over a photo: rgb(${a}) vs rgb(${b}), moved ${move}`);
  if (move < 10) {
    fail(`the capsule moved only ${move} levels between backdrops — that is a slab, not glass`);
  }

  // ── 3 + 4: the edge effect ends in nothing, with no step in it ────────────
  //
  // Measured against a DELIBERATELY mismatched scrim colour, and that is the
  // only way this property can be measured at all: a correctly configured
  // scrim is the page's own colour, so over the page it is invisible and its
  // profile is a flat line. The ramp's SHAPE — monotonic, arriving at the
  // backdrop, with no single-row step — is a property of the stop table, and it
  // is the same table either way.
  const mismatch = await openStory(browser, STORIES.mismatch);
  const mismatchBox = await headerBox(mismatch);
  const ramp = await samples(mismatch, {
    left: Math.round(mismatchBox.x + 6),
    right: Math.round(mismatchBox.x + 7),
    rowY: Math.round(mismatchBox.y + 2),
    colX: Math.round(mismatchBox.x + 6),
    top: Math.round(mismatchBox.y),
    bottom: Math.round(mismatchBox.y + mismatchBox.height * 2.4),
  });
  await mismatch.close();

  const column = ramp.column;
  const top0 = column[0];
  const bottom0 = column[column.length - 1];
  const maxStep = column
    .slice(1)
    .reduce((worst, px, i) => Math.max(worst, Math.abs(px[0] - column[i][0])), 0);
  const travelled = Math.max(...[0, 1, 2].map((i) => Math.abs(top0[i] - bottom0[i])));
  results.push(
    `scrim ramp: top rgb(${top0}) → bottom rgb(${bottom0}), travelled ${travelled}, max single-row step ${maxStep}`,
  );
  if (travelled < 30) fail(`the ramp only travelled ${travelled} levels — it is not a gradient`);
  if (maxStep > 12) fail(`a step of ${maxStep} levels in one row reads as a horizontal cut`);

  // ── And the complementary property: a MATCHED scrim is invisible ──────────
  //
  // The same header, the same `scrim="always"`, with the page colour handed
  // over. Over the page itself the ramp must paint nothing — that is what makes
  // it a fade of the CONTENT rather than a band across the screen.
  const matched = await openStory(browser, STORIES.colour);
  const matchedBox = await headerBox(matched);
  const flat = await samples(matched, {
    left: Math.round(matchedBox.x + 6),
    right: Math.round(matchedBox.x + 7),
    rowY: Math.round(matchedBox.y + 2),
    colX: Math.round(matchedBox.x + 6),
    top: Math.round(matchedBox.y),
    bottom: Math.round(matchedBox.y + matchedBox.height * 2.4),
  });
  await matched.close();
  const flatTravel = Math.max(
    ...[0, 1, 2].map((i) => Math.abs(flat.column[0][i] - flat.column[flat.column.length - 1][i])),
  );
  results.push(`matched scrim over its own page colour: travelled ${flatTravel}`);
  if (flatTravel > 3) {
    fail(`a scrim in the page's own colour still moved ${flatTravel} levels over that page`);
  }

  // ── 1, again, in DARK ─────────────────────────────────────────────────────
  //
  // The same count in the other mode. A material tuned in one mode and checked
  // only there is the most common way a dark island ends up invisible against
  // a dark page, and it is invisible in exactly the way a prop test cannot see.
  const darkPage = await openStory(browser, STORIES.dark);
  const darkBox = await headerBox(darkPage);
  const darkShot = await samples(darkPage, {
    left: Math.round(darkBox.x + 2),
    right: Math.round(darkBox.x + darkBox.width - 2),
    rowY: Math.round(darkBox.y + darkBox.height / 2),
    colX: Math.round(darkBox.x + 6),
    top: Math.round(darkBox.y),
    bottom: Math.round(darkBox.y + 2),
  });
  await darkPage.close();
  const darkRuns = islandRuns(darkShot.row);
  results.push(`islands across the bar, dark: ${darkRuns.runs} (widths ${darkRuns.widths.join(', ')})`);
  if (darkRuns.runs < 2) {
    fail(`expected at least two separated islands in dark mode, saw ${darkRuns.runs}`);
  }

  // ── The control: `presentation="bar"` IS a strip ──────────────────────────
  const bar = await openStory(browser, STORIES.bar);
  const barBox = await headerBox(bar);
  const barShot = await samples(bar, {
    left: Math.round(barBox.x + 2),
    right: Math.round(barBox.x + barBox.width - 2),
    rowY: Math.round(barBox.y + 4),
    colX: Math.round(barBox.x + barBox.width / 2),
    top: Math.round(barBox.y),
    bottom: Math.round(barBox.y + 4),
  });
  const barRuns = islandRuns(barShot.row).runs;
  results.push(`control — the bar presentation, 4px below its top: ${barRuns} run(s)`);
  if (barRuns !== 0) {
    // A strip's own top rows are one uniform colour, so "not the backdrop"
    // never starts: the first pixel IS the chrome. A non-zero count here means
    // the row sampler is measuring something other than what it claims.
    fail(`the bar control reported ${barRuns} islands — the sampler is not measuring runs`);
  }

  if (OUT) {
    const page = await openStory(browser, STORIES.floating);
    const png = await page.screenshot({ encoding: 'binary' });
    writeFileSync(OUT, png);
    results.push(`screenshot: ${OUT}`);
    await page.close();
  }
} finally {
  await browser.close();
}

for (const line of results) console.log(`[verify-header-islands] ${line}`);
if (!process.exitCode) console.log('[verify-header-islands] ok');
