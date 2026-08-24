/**
 * Browser gate for `level-picker` — the half of the component jest cannot see.
 *
 * Everything below needs a real layout, a real pointer or real focus: where the
 * knob is PAINTED (a `calc()` of a percentage plus an inset, which jsdom
 * resolves to nothing), whether a drag survives leaving the rail, whether the
 * end captions actually replace the summary row, whether the details region
 * arrives at the height its contents measure, and whether `inert` keeps a
 * collapsed row out of the tab order.
 *
 * Real input only — `page.mouse` and `page.keyboard` go through the browser's
 * own hit testing and focus model. A synthetic `element.dispatchEvent` would
 * pass against a rail nothing can reach.
 *
 * VISIBILITY, NOT PRESENCE. Both collapsible regions stay mounted at
 * `max-height: 0`, so every "is it showing" question below is answered by a
 * rendered height and a computed opacity. A presence check would report both
 * regions open at all times.
 *
 * Mutation-verified, each case against the one thing it measures:
 *   - `LEVEL_STOP_INSET` 13 → 0 fails the three geometry cases.
 *   - removing `setPointerCapture` fails the drag-past-the-rail case.
 *   - `active = pointerOver || focused || dragging` → `dragging` fails the two
 *     hover cases.
 *   - dropping `ArrowRight` from the key switch fails the keyboard case.
 *   - freezing `detailsHeight` at 0 fails the reveal's height case (and, with
 *     it, the menu case — the rows it hovers are inside that region).
 *   - removing `inert={!isExpanded}` fails the tab-stop case.
 *
 * Usage: start Storybook for THIS worktree, then
 *   node scripts/verify-level-picker.mjs [--url http://localhost:6022]
 */
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

// puppeteer-core is not a Bloom dependency — this is a local verification tool,
// not part of the package. Resolve it from a sibling repo that already has it.
const PUPPETEER_PATHS = ['/home/nate/Oxy/Homiio/node_modules/puppeteer-core', 'puppeteer-core'];

function loadPuppeteer() {
  for (const candidate of PUPPETEER_PATHS) {
    try {
      return require(candidate);
    } catch {
      // try the next candidate
    }
  }
  throw new Error(`Could not resolve puppeteer-core. Tried: ${PUPPETEER_PATHS.join(', ')}`);
}

const CHROME = process.env.CHROME_PATH ?? '/opt/google/chrome/chrome';
const argUrl = process.argv.indexOf('--url');
const BASE = argUrl !== -1 ? process.argv[argUrl + 1] : 'http://localhost:6022';
const OUT = '/tmp/bloom-level-picker-shots';

const STORY = 'forms-levelpicker--basic';
const MENU_STORY = 'forms-levelpicker--in-a-menu';

/** `constants.ts`'s own values. The gate asserts the SPEC, not the source. */
const STOP_INSET = 13;
const LEVELS = 5;
const PICKER = 'level-picker';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function rectOf(page, testId) {
  return page.evaluate((id) => {
    const el = document.querySelector(`[data-testid="${id}"]`);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
      x: r.x, y: r.y, width: r.width, height: r.height,
      left: r.left, right: r.right, top: r.top, bottom: r.bottom,
      opacity: Number(getComputedStyle(el).opacity),
    };
  }, testId);
}

/**
 * Showing, as a user reads it: it occupies space AND is not faded out. A
 * collapsed region is still in the DOM with its rows laid out inside the clip,
 * so `querySelector` says yes to both regions at every moment.
 */
const showing = (rect) => rect !== null && rect.height > 1 && rect.opacity > 0.5;

const centre = (r) => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 });

async function valueNow(page) {
  return page.evaluate(
    (id) => {
      const el = document.querySelector(`[data-testid="${id}-track"]`);
      return el === null ? null : Number(el.getAttribute('aria-valuenow'));
    },
    PICKER,
  );
}

/** Where the knob's centre sits, and where the spec says it should. */
async function knobCentre(page, id = PICKER) {
  const thumb = await rectOf(page, `${id}-thumb`);
  return thumb === null ? null : thumb.left + thumb.width / 2;
}

function expectedCentre(track, index) {
  const fraction = index / (LEVELS - 1);
  return track.left + fraction * track.width + (STOP_INSET - fraction * 2 * STOP_INSET);
}

async function openStory(page, storyId) {
  await page.goto(`${BASE}/iframe.html?id=${storyId}&viewMode=story`, {
    waitUntil: 'networkidle2',
  });
  // Wait for the STORY, not for a fixed number of milliseconds. A dev server
  // that has just re-transformed a module serves the page long before it can
  // serve the graph behind it, and a sleep tuned to a warm server reports
  // "the component did not render" for a cold one — a harness failure wearing
  // a component failure's clothes, which is the worst thing a gate can say.
  await page.waitForSelector(`[data-testid="${PICKER}"], [data-testid="menu-level-picker"]`, {
    timeout: 30000,
  });
  await sleep(900);
  // Give the pointer a POSITION before anything is clicked. Puppeteer's mouse
  // has none until it is moved, and a `click()` from that state sends the move
  // and the press in the same tick — measured, the first press then lands
  // before the page has a hover at all and the rail ignores it. Nothing a real
  // user does reaches that state; the settle keeps the gate measuring the
  // component rather than the harness.
  await page.mouse.move(NEUTRAL.x, NEUTRAL.y);
  await sleep(120);
}

/** Somewhere in the story with nothing on it, to park the pointer. */
const NEUTRAL = { x: 700, y: 700 };

/** A real pointer move ONTO a row: two moves, so the row sees movement. */
async function hover(page, rect) {
  const target = centre(rect);
  await page.mouse.move(target.x - 40, target.y);
  await sleep(120);
  await page.mouse.move(target.x, target.y);
  await sleep(400);
}

/** Every check runs unconditionally, so a short run means something threw. */
const EXPECTED_CASES = 25;

const results = [];
function record(name, pass, detail) {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

const near = (a, b, tolerance) => Math.abs(a - b) <= tolerance;

async function main() {
  mkdirSync(OUT, { recursive: true });
  const puppeteer = loadPuppeteer();
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: false,
    args: ['--no-sandbox', '--window-size=1280,900'],
    defaultViewport: { width: 1280, height: 900 },
  });

  try {
    const page = await browser.newPage();
    await page.emulateMediaFeatures([
      { name: 'prefers-reduced-motion', value: 'no-preference' },
    ]);

    // ------------------------------------------------------------- geometry
    await openStory(page, STORY);
    const track = await rectOf(page, `${PICKER}-track`);
    if (track === null) {
      const diag = await page.evaluate(() => ({
        url: location.href,
        ids: Array.from(document.querySelectorAll('[data-testid]')).map((e) => e.getAttribute('data-testid')).slice(0, 20),
      }));
      throw new Error(`the rail did not render: ${JSON.stringify(diag)}`);
    }
    // Vacuity floor: a rail narrow enough for the inset to be the whole story
    // would make every position assertion below trivially true.
    record(
      'the rail is laid out wide enough for the stops to differ',
      track.width > 4 * STOP_INSET,
      `width=${track.width.toFixed(1)}`,
    );

    record(
      'the knob starts on the stop the value names',
      near(await knobCentre(page), expectedCentre(track, 1), 1),
      `knob=${(await knobCentre(page)).toFixed(1)} expected=${expectedCentre(track, 1).toFixed(1)}`,
    );

    // ------------------------------------------------------------ hover swap
    // Before anything is clicked, so nothing is focused and the swap can only
    // be the pointer's doing.
    await hover(page, track);
    const captionsHovered = await rectOf(page, `${PICKER}-captions`);
    const summaryHovered = await rectOf(page, `${PICKER}-summary`);
    record(
      'hovering the rail swaps the summary row for the end captions',
      showing(captionsHovered) && summaryHovered.opacity < 0.1,
      `captions=${captionsHovered?.opacity.toFixed(2)} summary=${summaryHovered?.opacity.toFixed(2)}`,
    );
    await page.screenshot({ path: `${OUT}/hover-captions.png` });

    await page.mouse.move(NEUTRAL.x, NEUTRAL.y);
    await sleep(400);
    const captionsIdle = await rectOf(page, `${PICKER}-captions`);
    const summaryIdle = await rectOf(page, `${PICKER}-summary`);
    record(
      'moving away brings the summary row back',
      captionsIdle.opacity < 0.1 && summaryIdle.opacity > 0.9,
      `captions=${captionsIdle.opacity.toFixed(2)} summary=${summaryIdle.opacity.toFixed(2)}`,
    );

    // -------------------------------------------------------- click geometry
    await page.mouse.click(track.right - 3, centre(track).y);
    await sleep(300);
    const atMax = await knobCentre(page);
    record(
      'clicking the far right of the rail selects the last level',
      (await valueNow(page)) === LEVELS - 1,
      `value=${await valueNow(page)}`,
    );
    record(
      'and the knob stays ON the rail rather than half off its end',
      near(atMax, track.right - STOP_INSET, 1),
      `knob=${atMax.toFixed(1)} expected=${(track.right - STOP_INSET).toFixed(1)}`,
    );

    await page.mouse.click(track.left + 3, centre(track).y);
    await sleep(300);
    const atMin = await knobCentre(page);
    record(
      'clicking the far left selects the first level, inset by the same amount',
      (await valueNow(page)) === 0 && near(atMin, track.left + STOP_INSET, 1),
      `value=${await valueNow(page)} knob=${atMin.toFixed(1)} expected=${(track.left + STOP_INSET).toFixed(1)}`,
    );
    await page.screenshot({ path: `${OUT}/rail.png` });

    // -------------------------------------------------------- pointer capture
    // Press on the rail, then steer from well outside it — below the panel
    // entirely. Without pointer capture the moves land on whatever is under the
    // cursor and the rail never hears them again. Both targets stay INSIDE the
    // viewport: Chrome dispatches nothing at a negative coordinate, which is
    // indistinguishable from a drag that stopped being delivered.
    await page.mouse.move(track.left + 3, centre(track).y);
    await page.mouse.down();
    await page.mouse.move(track.right + 150, track.bottom + 220, { steps: 8 });
    await sleep(200);
    const draggedOut = await valueNow(page);
    await page.mouse.move(20, track.bottom + 220, { steps: 8 });
    await sleep(200);
    const draggedBack = await valueNow(page);
    await page.mouse.up();
    await sleep(200);
    record(
      'a drag that leaves the rail keeps steering it',
      draggedOut === LEVELS - 1 && draggedBack === 0,
      `out=${draggedOut} back=${draggedBack}`,
    );

    // -------------------------------------------------------------- keyboard
    // The drag left the rail focused and the level at 0, so what follows is the
    // keyboard alone — the pointer is parked far away.
    record(
      'the keyboard case starts focused on the rail at the first level',
      (await valueNow(page)) === 0 &&
        (await page.evaluate(
          (id) => document.activeElement === document.querySelector(`[data-testid="${id}-track"]`),
          PICKER,
        )),
      `value=${await valueNow(page)}`,
    );

    await page.keyboard.press('ArrowRight');
    await sleep(300);
    record(
      'ArrowRight steps one level and moves the knob to that stop',
      (await valueNow(page)) === 1 && near(await knobCentre(page), expectedCentre(track, 1), 1),
      `value=${await valueNow(page)} knob=${(await knobCentre(page)).toFixed(1)}`,
    );

    await page.keyboard.press('End');
    await sleep(300);
    record(
      'End jumps to the last level',
      (await valueNow(page)) === LEVELS - 1,
      `value=${await valueNow(page)}`,
    );

    // A row faded by FOCUS must still take a click. The pointer is parked far
    // away and the rail holds focus, so the row is invisible — and if that also
    // made it stop taking clicks, the click would fall through to the container,
    // blur the rail, and only a SECOND click would reach the row. Measured
    // before the fix; the two cases below are the fade and the click, because
    // the click case alone would pass on a row that never faded at all.
    const fadedSummary = await rectOf(page, `${PICKER}-summary`);
    record(
      'a focused rail fades the summary row',
      fadedSummary.opacity < 0.1,
      `opacity=${fadedSummary.opacity.toFixed(2)}`,
    );
    await page.mouse.click(centre(fadedSummary).x, centre(fadedSummary).y);
    await sleep(600);
    record(
      'and the faded row still takes the click',
      showing(await rectOf(page, `${PICKER}-details`)),
      `details=${(await rectOf(page, `${PICKER}-details`)).height.toFixed(1)}px`,
    );

    // ---------------------------------------------------------- the reveal
    // A fresh load rather than a blur, so this block measures the reveal and
    // nothing that happened to the page before it. Without the reset a single
    // broken drag leaks — a lost `pointerup` leaves the picker mid-gesture and
    // every case after it fails too, which turns one defect into eight and
    // makes the gate worse at saying WHICH thing broke.
    await openStory(page, STORY);
    const railBefore = await rectOf(page, `${PICKER}-slider`);
    const detailsBefore = await rectOf(page, `${PICKER}-details`);
    const rowBefore = await rectOf(page, 'details-format');
    record(
      'the details are not showing, while the rail is',
      showing(railBefore) && !showing(detailsBefore),
      `rail=${railBefore.height.toFixed(1)}px details=${detailsBefore.height.toFixed(1)}px`,
    );
    // The rows exist the whole time — which is why the case above cannot be a
    // presence check.
    record(
      'the collapsed rows are in the DOM all along',
      rowBefore !== null,
      rowBefore === null ? 'nothing to clip' : '',
    );

    const summary = await rectOf(page, `${PICKER}-summary`);
    // Sample the region's height every frame across the reveal. The MEASURED
    // height is what makes this an animation at all: with no measurement the
    // region falls back to `max-height: auto` and SNAPS open — still correct,
    // still visible, and indistinguishable from an animated reveal to every
    // before/after assertion. Only the frames in between can tell them apart.
    await page.evaluate((picker) => {
      window.__samples = [];
      const el = document.querySelector(`[data-testid="${picker}-details"]`);
      const started = performance.now();
      const tick = () => {
        window.__samples.push(el.getBoundingClientRect().height);
        if (performance.now() - started < 500) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, PICKER);
    await page.mouse.click(centre(summary).x, centre(summary).y);
    await sleep(700);
    const samples = await page.evaluate(() => window.__samples ?? []);

    const detailsAfter = await rectOf(page, `${PICKER}-details`);
    const railAfter = await rectOf(page, `${PICKER}-slider`);
    const firstRow = await rectOf(page, 'details-format');
    const lastRow = await rectOf(page, 'details-colour-space');
    const contentHeight = lastRow.bottom - detailsAfter.top;
    record(
      'pressing the summary row shows the details',
      showing(detailsAfter),
      `height=${detailsAfter.height.toFixed(1)} opacity=${detailsAfter.opacity.toFixed(2)}`,
    );
    record(
      'and gives the region the height its own contents measure',
      near(detailsAfter.height, contentHeight, 2) && firstRow.top >= detailsAfter.top - 1,
      `region=${detailsAfter.height.toFixed(1)} contents=${contentHeight.toFixed(1)}`,
    );
    const partial = samples.filter((h) => h > 2 && h < detailsAfter.height - 5);
    record(
      'and gets there by animating, rather than snapping open',
      partial.length > 0 && samples.length > 5,
      `frames=${samples.length} partial=${partial.length} range=${Math.min(...samples).toFixed(0)}..${Math.max(...samples).toFixed(0)}`,
    );
    record(
      'and puts the rail away',
      !showing(railAfter),
      `rail=${railAfter.height.toFixed(1)}px opacity=${railAfter.opacity.toFixed(2)}`,
    );
    await page.screenshot({ path: `${OUT}/revealed.png` });

    // -------------------------------------------------------------- inert
    // Collapse again, then walk the tab order. A row inside a zero-height clip
    // is still focusable in a browser that has not been told otherwise, and a
    // tab stop that scrolls to nothing is the failure `inert` prevents.
    const reachable = async () => {
      await page.evaluate(() => document.body.focus());
      const seen = [];
      for (let i = 0; i < 12; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await page.keyboard.press('Tab');
        // eslint-disable-next-line no-await-in-loop
        const where = await page.evaluate((picker) => {
          const active = document.activeElement;
          if (active === null) return 'none';
          const region = document.querySelector(`[data-testid="${picker}-details"]`);
          return region !== null && region.contains(active) ? 'in-details' : 'elsewhere';
        }, PICKER);
        seen.push(where);
      }
      return seen;
    };
    const expandedTabs = await reachable();
    // The positive control, taken FIRST: the same walk, the same rows, reaching
    // them while the region is open. Without it "no tab stop" below is also
    // what a walk that never moved focus would report.
    record(
      'an expanded details region is in the tab order',
      expandedTabs.includes('in-details'),
      `stops=${expandedTabs.filter((s) => s === 'in-details').length}`,
    );

    // Re-measured, because the reveal MOVED it: the rail collapsing pulls the
    // summary row up by its whole height, so the rect taken before the reveal
    // now points at the first details row.
    const summaryMoved = await rectOf(page, `${PICKER}-summary`);
    record(
      'the reveal moved the summary row up, to where the rail was',
      summaryMoved.top < summary.top - 30,
      `before=${summary.top.toFixed(1)} after=${summaryMoved.top.toFixed(1)}`,
    );
    await page.mouse.click(centre(summaryMoved).x, centre(summaryMoved).y);
    await sleep(600);
    const collapsedNow = await rectOf(page, `${PICKER}-details`);
    record(
      'the summary row closes it again',
      !showing(collapsedNow),
      `height=${collapsedNow.height.toFixed(1)}`,
    );
    const collapsedTabs = await reachable();
    record(
      'a collapsed one holds no tab stop at all',
      !collapsedTabs.includes('in-details'),
      `stops=${collapsedTabs.filter((s) => s === 'in-details').length}`,
    );

    // ------------------------------------------------------------ in a menu
    // The composition claim: the details region holds real flyout sub-menus,
    // and the panel resizes around the reveal rather than clipping it.
    await openStory(page, MENU_STORY);
    const menuSummary = await rectOf(page, 'menu-level-picker-summary');
    const panelBefore = await rectOf(page, 'menu-picker-panel');
    await page.mouse.click(centre(menuSummary).x, centre(menuSummary).y);
    await sleep(700);
    const panelAfter = await rectOf(page, 'menu-picker-panel');
    record(
      'the menu panel grows around the reveal',
      panelAfter.height > panelBefore.height + 10,
      `before=${panelBefore.height.toFixed(1)} after=${panelAfter.height.toFixed(1)}`,
    );

    // A REAL move onto the row. The reveal has just slid a sub-trigger under
    // the parked pointer, and layout motion is deliberately not hover intent
    // (`floating/menu-sub-flyout`), so hovering has to be something the pointer
    // does rather than something the layout does.
    const subTrigger = await rectOf(page, 'format-submenu-trigger');
    await hover(page, subTrigger);
    const flyout = await rectOf(page, 'format-submenu');
    record(
      'a sub-menu inside the details region still flies out beside the panel',
      showing(flyout) && flyout.left >= panelAfter.right - 8,
      flyout === null
        ? 'no flyout'
        : `flyout.left=${flyout.left.toFixed(1)} panel.right=${panelAfter.right.toFixed(1)}`,
    );
    await page.screenshot({ path: `${OUT}/in-a-menu.png` });

    let failed = results.filter((r) => !r.pass).length;
    // Vacuity floor: a run that bailed early must not read as success.
    if (results.length < EXPECTED_CASES) {
      console.log(`FAIL  ran ${results.length} of ${EXPECTED_CASES} checks`);
      failed += 1;
    }
    console.log(`\n${results.length - failed}/${results.length} level-picker checks pass`);
    console.log(`screenshots in ${OUT}`);
    process.exitCode = failed === 0 ? 0 : 1;
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
