/** Real browser hit testing: the eye orbit must leave the live preview reachable. */
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH,
  headless: true,
  args: ['--no-sandbox'],
});
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1000, height: 1000 });
  await page.goto(
    `${process.env.STORYBOOK_URL || 'http://localhost:6006'}/iframe.html?id=agents-agent-creator--basic&viewMode=story`,
    { waitUntil: 'networkidle2' },
  );
  await page.click('[aria-label="Avatar style"]');
  await page.waitForFunction(() =>
    [...document.querySelectorAll('[role=option]')].some(
      (node) => node.textContent.trim() === 'Blob bot',
    ),
  );
  for (const option of await page.$$('[role=option]')) {
    if ((await option.evaluate((node) => node.textContent)).trim() === 'Blob bot') {
      await option.click();
      break;
    }
  }
  await page.waitForSelector('[data-bloom-vector-avatar]');
  const avatar = await page.$('[data-bloom-vector-avatar]');
  const box = await avatar.boundingBox();
  const samples = [];
  for (const [name, x, y] of [
    ['center', 0.5, 0.5],
    ['left', 0.15, 0.5],
    ['right', 0.85, 0.5],
    ['down', 0.5, 0.85],
  ]) {
    const point = { x: box.x + box.width * x, y: box.y + box.height * y };
    await page.mouse.move(point.x, point.y);
    const reachable = await page.evaluate(
      ({ x, y }) => !!document.elementFromPoint(x, y)?.closest('[data-bloom-vector-avatar]'),
      point,
    );
    assert.ok(reachable, `${name}: orbit intercepts preview input`);
    await page.waitForFunction(
      () => Number(document.querySelector('[data-bloom-vector-avatar]').dataset.tracking) > 0.99,
    );
    await new Promise((resolve) => setTimeout(resolve, 350));
    samples.push(
      await avatar.evaluate((node) => ({
        name: node.dataset.gazeYaw,
        yaw: Number(node.dataset.gazeYaw),
        pitch: Number(node.dataset.gazePitch),
      })),
    );
  }
  assert.ok(
    Math.abs(samples[0].yaw) < 0.03 && Math.abs(samples[0].pitch) < 0.03,
    'Center gaze must be centered',
  );
  assert.ok(
    samples[1].yaw < -0.4 && samples[2].yaw > 0.4,
    'Pointer must drive both horizontal directions',
  );
  assert.ok(samples[3].pitch > 0.25, 'Pointer must drive downward gaze');
  await page.click('[aria-label="Sleepy lids"]');
  await page.waitForFunction(
    () =>
      document.querySelector('[aria-label="Sleepy lids"]').getAttribute('aria-pressed') === 'true',
  );
  const chip = await page.$('[aria-label="Sleepy lids"]');
  await chip.hover();
  const before = await chip.boundingBox();
  await page.mouse.wheel({ deltaX: 90, deltaY: 0 });
  await new Promise((resolve) => setTimeout(resolve, 500));
  const after = await chip.boundingBox();
  assert.ok(
    Math.hypot(before.x - after.x, before.y - after.y) > 5,
    'Eye chip horizontal wheel must rotate the orbit',
  );
  console.log(
    JSON.stringify({ previewReachable: true, chipSelection: true, wheel: true, gaze: samples }),
  );
} finally {
  await browser.close();
}
