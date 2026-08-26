/**
 * DOES THE HAND-OFF COST A REQUEST, OR A BUFFER?
 *
 * On web a flight re-parents ONE element, so the media should neither refetch
 * nor lose what it has already buffered. Both are reasonable things to assume
 * about a `<video>` and both have been wrong before in this package, so they
 * are measured here rather than asserted.
 *
 * Two questions, each with the control that makes its answer readable:
 *
 *  - REQUESTS. Counted per phase for the clip's own URL, with the CACHE
 *    DISABLED, which is the reporting user's condition. The control is the
 *    same story built the old way (a surface at each end): a new element must
 *    produce a new request, or the counter is not watching anything.
 *  - BUFFER. `video.buffered` sampled either side of the move. The same control
 *    applies: a recreated element starts with an empty buffer.
 *
 * Usage: start Storybook, then
 *   node scripts/verify-flight-network.mjs [--url http://localhost:6006]
 */
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const PUPPETEER_PATHS = ['/home/nate/Oxy/Homiio/node_modules/puppeteer-core', 'puppeteer-core'];
function loadPuppeteer() {
  for (const c of PUPPETEER_PATHS) {
    try { return require(c); } catch { /* next */ }
  }
  throw new Error('puppeteer-core not found');
}

const CHROME = process.env.CHROME_PATH ?? '/opt/google/chrome/chrome';
const argUrl = process.argv.indexOf('--url');
const BASE = argUrl !== -1 ? process.argv[argUrl + 1] : 'http://localhost:6006';
const CLIP_FILE = process.env.CLIP ?? '/tmp/claude-1000/-home-nate-Oxy-Mention/91fdceee-f970-4fcc-8340-6395e183b5e8/scratchpad/bloom/clip/clip.mp4';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** The clip over HTTP, because a `data:` URI makes no requests to count. */
const body = readFileSync(CLIP_FILE);
const server = createServer((req, res) => {
  res.writeHead(200, {
    'content-type': 'video/mp4',
    'content-length': body.length,
    'access-control-allow-origin': '*',
    'accept-ranges': 'bytes',
  });
  res.end(body);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const CLIP_URL = `http://127.0.0.1:${server.address().port}/clip.mp4`;

const failures = [];
const report = (ok, message) => { if (!ok) failures.push(message); };

const browser = await loadPuppeteer().launch({
  executablePath: CHROME,
  headless: false,
  args: ['--no-sandbox', '--window-size=1280,900', '--autoplay-policy=no-user-gesture-required'],
  defaultViewport: { width: 1280, height: 900 },
});

async function run(story, trigger) {
  const page = await browser.newPage();
  await page.bringToFront();
  // COLD, which is the condition the stall was reported under.
  await page.setCacheEnabled(false);
  await page.evaluateOnNewDocument((url) => {
    Object.defineProperty(globalThis, '__BLOOM_CLIP_URL__', { value: url, writable: false });
  }, CLIP_URL);

  const requests = [];
  page.on('request', (r) => {
    if (r.url() === CLIP_URL) requests.push({ at: Date.now(), phase: phase });
  });
  let phase = 'load';

  await page.goto(`${BASE}/iframe.html?id=${story}&viewMode=story`, { waitUntil: 'networkidle0' });
  await page.waitForSelector(`[data-testid="${trigger}"]`, { timeout: 20000 });
  await sleep(700);

  const buffered = () => page.evaluate(() => {
    const v = document.querySelector('video');
    if (!v) return null;
    const ranges = [];
    for (let i = 0; i < v.buffered.length; i += 1) {
      ranges.push([Number(v.buffered.start(i).toFixed(2)), Number(v.buffered.end(i).toFixed(2))]);
    }
    return { ranges, t: v.currentTime, ready: v.readyState, count: document.querySelectorAll('video').length };
  });

  const before = await buffered();
  phase = 'flight';
  await page.evaluate((id) => {
    const el = document.querySelector(`[data-testid="${id}"]`);
    el?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    el?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    el?.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
  }, trigger);
  await sleep(120);
  const during = await buffered();
  await sleep(900);
  phase = 'after';
  const after = await buffered();
  await page.close();

  return {
    story,
    requests: requests.length,
    byPhase: requests.reduce((acc, r) => ({ ...acc, [r.phase]: (acc[r.phase] ?? 0) + 1 }), {}),
    before, during, after,
  };
}

try {
  const good = await run('overlays-mediaflight--reparented-video', 'reparent-fly');
  const control = await run('overlays-mediaflight--recreated-video', 'recreate-fly');

  for (const r of [good, control]) {
    console.log(
      `\n${r.story.replace('overlays-mediaflight--', '')}` +
      `\n  requests for the clip: ${r.requests}  ${JSON.stringify(r.byPhase)}` +
      `\n  buffered before: ${JSON.stringify(r.before?.ranges)}  (ready ${r.before?.ready}, ${r.before?.count} element(s))` +
      `\n  buffered during: ${JSON.stringify(r.during?.ranges)}  (ready ${r.during?.ready}, ${r.during?.count} element(s))` +
      `\n  buffered after:  ${JSON.stringify(r.after?.ranges)}  (ready ${r.after?.ready}, ${r.after?.count} element(s))`,
    );
  }

  // CONTROL FIRST: if a recreated element does not refetch, nothing here is
  // watching the network and every "no request" below means nothing.
  const controlRefetched = (control.byPhase.flight ?? 0) + (control.byPhase.after ?? 0) > 0;
  report(controlRefetched,
    `network: the control did NOT refetch (${JSON.stringify(control.byPhase)}), so the counter is not watching the media`);

  report((good.byPhase.flight ?? 0) + (good.byPhase.after ?? 0) === 0,
    `network: the hand-off cost ${JSON.stringify(good.byPhase)} request(s) for the clip — the element is not the same one`);

  // A LIMIT OF THE BUFFER HALF, stated rather than glossed: this reads
  // `document.querySelector('video')`, the FIRST element. In the control there
  // are two by the end, so its buffer line describes the surviving original and
  // not the element the destination built — which makes the buffer control
  // weak. The REQUEST count is what carries that arm: two extra fetches is a
  // new element loading from nothing.
  report(good.after?.ranges.length > 0,
    'buffer: the landed element has NO buffered range at all');
  const keptBuffer =
    good.before?.ranges.length > 0 && good.after?.ranges.length > 0 &&
    good.after.ranges[good.after.ranges.length - 1][1] >= good.before.ranges[good.before.ranges.length - 1][1] - 0.01;
  report(keptBuffer,
    `buffer: the buffered range SHRANK across the flight (${JSON.stringify(good.before?.ranges)} -> ${JSON.stringify(good.after?.ranges)})`);

  if (failures.length === 0) {
    console.log('\nPASS  the hand-off costs no request for the media');
    console.log('PASS  the moved element keeps its buffered range');
  } else {
    for (const f of failures) console.log(`\nFAIL  ${f}`);
  }
} finally {
  await browser.close();
  server.close();
}
process.exit(failures.length === 0 ? 0 : 1);
