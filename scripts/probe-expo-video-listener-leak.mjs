/**
 * Does an UNMOUNTED expo-video web view still control the player?
 *
 * Yes: `unmountVideoView` deletes the element from `_mountedVideos` and never
 * removes the `on*` handlers `_addListeners` installed, so the element keeps
 * mirroring — and when the browser auto-pauses it for leaving the document, it
 * pauses every view that is still mounted. Measured against expo-video 57.0.2.
 *
 * NOT A GATE. It exits non-zero only if its own controls stop discriminating;
 * the leak itself is REPORTED, because the day expo-video fixes it is the day
 * Bloom can drop the `player={null}` commit in `MediaSurface`/`releaseFlight`
 * that steps around it. Run it before touching that code.
 *
 * It loads the REAL `node_modules/expo-video/build/VideoPlayer.web.js`, with
 * only its two `import` lines and its `export` keywords removed so a classic
 * script can evaluate it — that is what makes this a measurement of THEIR class
 * rather than of a double of ours, and it is the first thing worth doubting.
 * The `<video>` elements are real, in real Chrome, with a real H.264 clip.
 *
 * Usage:  node scripts/probe-expo-video-listener-leak.mjs
 *         CHROME_PATH=/opt/google/chrome/chrome  DISPLAY=:99
 */
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const HERE = dirname(fileURLToPath(import.meta.url));

// puppeteer-core is not a Bloom dependency — this is a local tool, not part of
// the package. Same resolution as `verify-media-flight.mjs`.
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
const PLAYER_SOURCE = join(HERE, '..', 'node_modules', 'expo-video', 'build', 'VideoPlayer.web.js');
const VERSION = JSON.parse(
  readFileSync(join(HERE, '..', 'node_modules', 'expo-video', 'package.json'), 'utf8'),
).version;

/**
 * A 3.7 kB H.264 clip, inline so this needs no server and no network. Real
 * Chrome decodes it; a Playwright Chromium would not, which is why this script
 * launches the packaged Chrome.
 */
const CLIP = readFileSync(join(HERE, '..', 'src', 'media-flight', 'MediaFlight.stories.tsx'), 'utf8')
  .match(/const TINY_MP4 = '([^']+)';/)?.[1];
if (!CLIP) throw new Error('could not read TINY_MP4 out of MediaFlight.stories.tsx');

const source = readFileSync(PLAYER_SOURCE, 'utf8')
  .split('\n')
  .filter((line) => !line.startsWith('import '))
  .join('\n')
  .replace(/^export default class/m, 'class')
  .replace(/^export function/gm, 'function');

const browser = await loadPuppeteer().launch({
  executablePath: CHROME,
  headless: false,
  args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'],
});

try {
  const page = await browser.newPage();
  await page.setContent('<body></body>');
  await page.evaluate(() => {
    globalThis.expo = { SharedObject: class { addListener() {} removeListener() {} emit() {} } };
    globalThis.resolveAssetSource = () => null;
    globalThis.useMemo = () => { throw new Error('unused'); };
  });
  await page.addScriptTag({ content: `${source}\nwindow.VideoPlayerWeb = VideoPlayerWeb;` });

  const out = await page.evaluate(async (clip) => {
    const settle = (ms) => new Promise((r) => setTimeout(r, ms));
    const el = () => {
      const v = document.createElement('video');
      v.src = clip; v.muted = true; v.loop = true; v.playsInline = true;
      document.body.appendChild(v);
      return v;
    };
    const two = () => {
      const player = new window.VideoPlayerWeb({ uri: clip });
      const a = el(); const b = el();
      player.mountVideoView(a); player.mountVideoView(b);
      return { player, a, b };
    };
    const report = {};

    // THE DEFECT: unmount one view the documented way, then let the DOM drop it.
    {
      const { player, a, b } = two();
      player.play();
      await settle(300);
      report.bothPlaying = !a.paused && !b.paused;
      player.unmountVideoView(a);
      report.leftTheSet = !player._mountedVideos.has(a);
      report.handlerStillInstalled = typeof a.onpause === 'function';
      a.remove();
      await settle(300);
      report.unmountedViewPausedTheLiveOne = b.paused;
      report.playerReportsPlaying = player.playing;
    }

    // CONTROL 1: the same removal WITHOUT unmounting. If this did not pause the
    // other view, the mirror is not what is being observed above.
    {
      const { player, a, b } = two();
      player.play();
      await settle(300);
      a.remove();
      await settle(300);
      report.control_mirrorWorksWithoutUnmount = b.paused;
    }

    // CONTROL 2: nothing removed at all. If this paused, the harness would be
    // measuring something other than the removal.
    {
      const { player, b } = two();
      player.play();
      await settle(600);
      report.control_stillPlayingWhenNothingRemoved = !b.paused;
    }

    // The other half of the same file: a view mounted onto a player whose first
    // element is paused is BORN paused, because `_synchronizeWithFirstVideo`
    // copies play state and not just position.
    {
      const player = new window.VideoPlayerWeb({ uri: clip });
      const a = el();
      player.mountVideoView(a);
      player.play();
      await settle(300);
      a.pause();
      await settle(100);
      const c = el();
      player.mountVideoView(c);
      await settle(200);
      report.newViewBornPaused = c.paused;
    }

    return report;
  }, CLIP);

  console.log(`expo-video ${VERSION}, ${CHROME}`);
  for (const [key, value] of Object.entries(out)) console.log(`  ${key.padEnd(38)} ${value}`);

  const controlsHold =
    out.bothPlaying === true &&
    out.control_mirrorWorksWithoutUnmount === true &&
    out.control_stillPlayingWhenNothingRemoved === true;
  if (!controlsHold) {
    console.error('\nCONTROLS FAILED — this run measures nothing. Do not read the result above.');
    process.exit(1);
  }

  const leaking = out.leftTheSet === true && out.unmountedViewPausedTheLiveOne === true;
  console.log(
    leaking
      ? '\nLEAK PRESENT: an unmounted view still pauses the live one. Bloom needs the\n' +
        '`player={null}` commit (see `releaseFlight`) — do not remove it.'
      : '\nLEAK GONE: an unmounted view no longer controls the player. Bloom can drop\n' +
        'the `player={null}` commit, and the tests that pin it, once this is the\n' +
        'lowest version consumers install.',
  );
} finally {
  await browser.close();
}
