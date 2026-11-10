/** Measure the same packaged real-composer scene at wide/narrow and short/multiline sizes. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireLabEmulator } from '../material-lab/android-gate.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const serial = process.env.ANDROID_SERIAL;
const binary = process.env.ADB || 'adb';
const server = process.env.ADB_PORT ? ['-P', process.env.ADB_PORT] : [];
const target = [...server, '-s', serial];
const adb = (...args) =>
  execFileSync(binary, [...target, ...args], {
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  }).trim();

requireLabEmulator(
  serial,
  execFileSync(binary, [...server, 'devices'], { encoding: 'utf8' }),
  /^emulator-/.test(serial) ? adb('emu', 'avd', 'name') : '',
  adb('shell', 'getprop', 'ro.kernel.qemu'),
  process.env.AUTHORIZED_PHYSICAL_SERIAL,
);

const artifact = resolve(process.env.ARTIFACT);
mkdirSync(artifact, { recursive: true });
const environment = JSON.parse(readFileSync(resolve(artifact, 'environment.json'), 'utf8'));
assert.equal(environment.serial, serial);
assert.equal(environment.package, 'so.oxy.bloom.loaderpackagelab');
assert.equal(environment.build.packageVersion, process.env.EXPECTED_BLOOM_VERSION);
assert.equal(environment.build.softwareWindow, false);
assert.equal(environment.build.scene, 'composers');

const attrs = (xml) =>
  [...xml.matchAll(/<node\b([^>]*)\/?\s*>/g)].map((match) => {
    const result = {};
    for (const [, key, value] of match[1].matchAll(/([\w:-]+)="([^"]*)"/g)) result[key] = value;
    return result;
  });

function tree() {
  assert(
    adb('shell', 'dumpsys', 'activity', 'activities')
      .split(/\r?\n/)
      .some(
        (line) =>
          /(?:mResumedActivity|topResumedActivity|ResumedActivity:)/.test(line) &&
          line.includes('so.oxy.bloom.loaderpackagelab'),
      ),
    'The synthetic composer fixture must remain foreground',
  );
  const path = `/sdcard/bloom-composer-matrix-${Date.now()}.xml`;
  assert(adb('shell', 'uiautomator', 'dump', path).includes('dumped to'));
  const xml = adb('shell', 'cat', path);
  return { xml, nodes: attrs(xml) };
}

function stateOf(nodes) {
  const node = nodes.find((item) => item['resource-id'] === 'cases-state');
  assert(node?.text, 'Composer state text must be available to the physical probe');
  return node.text;
}

function hasState(state, key, value) {
  return state.split(' ').includes(`${key}=${value}`);
}

function boundsOf(node) {
  const match = node?.bounds?.match(/^\[(\d+),(\d+)\]\[(\d+),(\d+)\]$/);
  assert(match, `Missing native bounds for ${node?.['resource-id'] ?? node?.text ?? 'node'}`);
  const [, left, top, right, bottom] = match.map(Number);
  return { left, top, right, bottom, width: right - left, height: bottom - top };
}

function tapId(nodes, id) {
  const node = nodes.find((item) => item['resource-id'] === id);
  const b = boundsOf(node);
  adb(
    'shell',
    'input',
    'tap',
    String(Math.floor((b.left + b.right) / 2)),
    String(Math.floor((b.top + b.bottom) / 2)),
  );
}

async function waitFor(predicate, label, timeoutMs = 10_000) {
  const until = Date.now() + timeoutMs;
  let last;
  while (Date.now() < until) {
    last = tree();
    if (predicate(last)) return last;
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 250));
  }
  throw new Error(`Timed out waiting for ${label}: ${last ? stateOf(last.nodes) : 'no hierarchy'}`);
}

async function setImmediateValue(id, key, expected) {
  let current = tree();
  if (hasState(stateOf(current.nodes), key, expected)) return current;
  tapId(current.nodes, id);
  await new Promise((resolvePromise) => setTimeout(resolvePromise, 1_000));
  current = tree();
  assert(hasState(stateOf(current.nodes), key, expected), `${key} did not toggle`);
  return current;
}

async function setDelayedValue(id, pendingName, key, expected) {
  let current = tree();
  if (hasState(stateOf(current.nodes), key, expected)) return current;
  tapId(current.nodes, id);
  await new Promise((resolvePromise) => setTimeout(resolvePromise, 5_000));
  current = tree();
  const state = stateOf(current.nodes);
  assert(
    hasState(state, key, expected) && hasState(state, 'pending', 'none'),
    `${pendingName} did not settle as expected: ${state}`,
  );
  await new Promise((resolvePromise) => setTimeout(resolvePromise, 900));
  return tree();
}

async function ensureScene({ narrow, multiline, taper }) {
  // Restore access to the controls before changing the next scenario; the
  // previous sample intentionally left the same screen scrolled to its end.
  let current = tree();
  const initialScroll = current.nodes.find(
    (node) => node.class === 'android.widget.ScrollView' && node.scrollable === 'true',
  );
  assert(initialScroll, 'Missing composer fixture ScrollView');
  const initialViewport = boundsOf(initialScroll);
  const centerX = String(Math.round((initialViewport.left + initialViewport.right) / 2));
  // Keep the gesture outside centered buttons/editors so Android assigns it
  // to the ScrollView instead of a child responder.
  const scrollX = String(initialViewport.right - 20);
  let controlsVisible = false;
  for (let attempt = 0; attempt < 4; attempt++) {
    const resize = current.nodes.find((node) => node['resource-id'] === 'cases-resize');
    if (resize) {
      const bounds = boundsOf(resize);
      if (bounds.top >= 120 && bounds.bottom <= initialViewport.bottom) {
        controlsVisible = true;
        break;
      }
    }
    // A single touch only scrolls one viewport on Android; repeat until the
    // first control is wholly below the status bar and inside the ScrollView.
    adb(
      'shell',
      'input',
      'swipe',
      scrollX,
      String(initialViewport.top + 300),
      scrollX,
      String(initialViewport.bottom - 120),
      '500',
    );
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 500));
    current = tree();
  }
  assert(controlsVisible, 'Could not scroll the fixture back to its scenario controls');

  current = await setDelayedValue('cases-resize', 'resize', 'narrow', String(narrow));
  current = await setImmediateValue('cases-content', 'multiline', String(multiline));
  current = await setImmediateValue('cases-taper', 'taper', taper);
  current = await setDelayedValue('cases-busy', 'busy', 'busy', 'true');
  const state = stateOf(current.nodes);
  assert(hasState(state, 'narrow', String(narrow)), state);
  assert(hasState(state, 'multiline', String(multiline)), state);
  assert(hasState(state, 'taper', taper), state);
  assert(hasState(state, 'busy', 'true') && hasState(state, 'pending', 'none'), state);

  // The third-party Alia composer sits below the two Bloom-only owners in this
  // fixture. React Native clips its accessibility bounds to the ScrollView
  // viewport until the real scroller reaches the end, which looked like a
  // short editor even though the full multiline control was rendered below it.
  // Scroll the same mounted tree before measuring all three editors.
  const scrollView = current.nodes.find(
    (node) => node.class === 'android.widget.ScrollView' && node.scrollable === 'true',
  );
  assert(scrollView, 'Missing composer fixture ScrollView');
  const viewport = boundsOf(scrollView);
  adb(
    'shell',
    'input',
    'swipe',
    String(Math.round((viewport.left + viewport.right) / 2)),
    String(viewport.bottom - 120),
    String(Math.round((viewport.left + viewport.right) / 2)),
    String(viewport.top + 100),
    '500',
  );
  await new Promise((resolvePromise) => setTimeout(resolvePromise, 800));
  current = tree();

  const inputs = current.nodes.filter((node) => node.class === 'android.widget.EditText');
  assert.equal(
    inputs.length,
    3,
    `Expected ComposerPill, AgentChatComposer and AliaComposer editors; got ${inputs.length}`,
  );
  const inputBounds = inputs.map((node) => ({
    label: node['content-desc'] || node.text,
    resourceId: node['resource-id'],
    ...boundsOf(node),
  }));
  const loaders = ['cases-isolated-loader', 'cases-pill-loader', 'cases-agent']
    .map((id) => current.nodes.find((node) => node['resource-id'] === id))
    .map((node) => ({ id: node['resource-id'], ...boundsOf(node) }));
  assert(
    loaders.every((item) => item.width > 0 && item.height > 0),
    'All measured loader bounds must be nonzero',
  );
  if (narrow) assert(loaders[0].width < 750, `Narrow loader was not narrow: ${loaders[0].width}px`);
  if (!narrow)
    assert(loaders[0].width > 800, `Wide loader width unexpected: ${loaders[0].width}px`);
  if (multiline) {
    assert(
      inputBounds.every((item) => item.height > 105),
      `Long draft did not grow every composer: ${JSON.stringify(inputBounds)}`,
    );
  }
  assert(
    inputBounds.every((item) => item.top >= 0 && item.bottom <= 2327),
    `A composer editor is clipped by the measured screen viewport: ${JSON.stringify(inputBounds)}`,
  );
  return { state, inputBounds, loaders, xml: current.xml };
}

adb('shell', 'am', 'force-stop', 'so.oxy.bloom.loaderpackagelab');
adb(
  'shell',
  'am',
  'start',
  '-n',
  'so.oxy.bloom.loaderpackagelab/.MainActivity',
  '--es',
  'scene',
  'composers',
);
await waitFor(
  (current) => current.nodes.some((node) => node['resource-id'] === 'cases-state'),
  'composer fixture startup',
  20_000,
);

const configurations = [
  { id: 'wide-short-no-taper', narrow: false, multiline: false, taper: '0' },
  { id: 'wide-short-taper', narrow: false, multiline: false, taper: '0.5' },
  { id: 'narrow-multiline-taper', narrow: true, multiline: true, taper: '0.5' },
  { id: 'narrow-multiline-no-taper', narrow: true, multiline: true, taper: '0' },
  { id: 'repeat-narrow-multiline-no-taper', narrow: true, multiline: true, taper: '0' },
  { id: 'repeat-narrow-multiline-taper', narrow: true, multiline: true, taper: '0.5' },
  { id: 'repeat-wide-short-taper', narrow: false, multiline: false, taper: '0.5' },
  { id: 'repeat-wide-short-no-taper', narrow: false, multiline: false, taper: '0' },
];

const results = [];
for (const configuration of configurations) {
  const scene = await ensureScene(configuration);
  writeFileSync(resolve(artifact, `${configuration.id}.xml`), scene.xml);
  const report = JSON.parse(
    execFileSync(process.execPath, [resolve(here, 'measure-android.mjs')], {
      env: {
        ...process.env,
        ARTIFACT: artifact,
        CASE: configuration.id,
      },
      encoding: 'utf8',
      maxBuffer: 16 * 1024 * 1024,
    }),
  );
  results.push({
    ...configuration,
    state: scene.state,
    inputBounds: scene.inputBounds,
    loaders: scene.loaders,
    report,
  });
  console.log(
    JSON.stringify({
      case: configuration.id,
      state: scene.state,
      inputHeights: scene.inputBounds.map((input) => input.height),
      loaderWidths: scene.loaders.map((loader) => loader.width),
      frames: report.frames,
      jankyFrames: report.jankyFrames,
      gpuP95Ms: report.gpuP95Ms,
      recentFrameP95Ms: report.recentFrameP95Ms,
      cpuPercentOfOneCore: report.cpuPercentOfOneCore,
      pssKb: report.pssKb,
      thermalStatusBefore: report.thermalStatusBefore,
      thermalStatusAfter: report.thermalStatusAfter,
    }),
  );
}

writeFileSync(
  resolve(artifact, 'matrix.json'),
  `${JSON.stringify(
    {
      device: environment,
      fixtureSha256: environment.build.fixtureSha256,
      bloomVersion: environment.build.packageVersion,
      configurations: results,
      limits:
        'Descriptive Pixel 8a release samples, not a performance pass or approved threshold. AgentChatComposer retains its shipped taper; the taper switch applies to the isolated ComposerLoader and outer ComposerPill loader. AliaComposer does not expose a ComposerLoader. Each window runs all three visible loader views in one app tree; no screen recording is active during measurement.',
    },
    null,
    2,
  )}\n`,
);
