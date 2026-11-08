/** Canonical editor regression: real input, async edits, interrupted actions and visible parts. */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import puppeteer from "puppeteer-core";
const output = process.env.OUTPUT_DIR || ".local/avatar-editor-regressions";
await mkdir(output, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH,
  headless: true,
  args: ["--no-sandbox"],
});
const errors = [];
const results = [];
try {
  const page = await browser.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewport({ width: 1100, height: 1000 });
  await page.goto(
    `${process.env.STORYBOOK_URL || "http://localhost:6006"}/iframe.html?id=agents-agent-creator--basic&viewMode=story`,
    { waitUntil: "networkidle2" },
  );
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const select = async (title) => {
    await page.waitForSelector('[aria-label="Avatar style"]', {
      timeout: 60000,
    });
    await page.click('[aria-label="Avatar style"]');
    await page.waitForFunction(
      (name) =>
        [...document.querySelectorAll("[role=option]")].some(
          (node) => node.textContent.trim() === name,
        ),
      {},
      title,
    );
    const options = await page.$$("[role=option]");
    for (const option of options)
      if (
        (await option.evaluate((node) => node.textContent.trim())) === title
      ) {
        await option.click();
        const expected = await page.evaluate(async (title) => {
          const { CHARACTER_PRESETS, CHARACTER_TEMPLATES } = await import('/src/agent-creator/constants.ts');
          const { resolveAvatarCharacter } = await import('/src/agent-avatar/character.ts');
          const { vectorGeometryKey } = await import('/src/agent-avatar/vector-compose.ts');
          const preset = CHARACTER_PRESETS.find(item => item.title === title);
          return vectorGeometryKey(resolveAvatarCharacter(CHARACTER_TEMPLATES[preset.id]));
        }, title);
        await page.waitForFunction(expected => {
          const avatar = document.querySelector('[data-bloom-vector-avatar]');
          return avatar?.dataset.geometry === expected && avatar.getAttribute('aria-busy') === 'false';
        }, { timeout: 30000 }, expected);
        return;
      }
    throw Error(`Missing template ${title}`);
  };
  const sample = () =>
    page.$eval("[data-bloom-vector-avatar]", (node) => ({
      geometry: node.dataset.geometry,
      action: node.dataset.action,
      paths: [...node.querySelectorAll("path")].map((path) => ({
        d: path.getAttribute("d"),
        fill: path.getAttribute("fill"),
      })),
    }));
  const settled = () =>
    page.waitForFunction(() => {
      const node = document.querySelector("[data-bloom-vector-avatar]");
      return (
        node &&
        node.getAttribute("aria-busy") !== "true" &&
        node.querySelectorAll("path").length > 0
      );
    });
  // Vary authored hats/glasses and flat shapes using the same public selector.
  for (const title of ["Felipe", "Jojo", "Blob bot", "Star bot", "Cloud bot"]) {
    await select(title);
    await settled();
    const avatar = await page.$("[data-bloom-vector-avatar]");
    const box = await avatar.boundingBox();
    for (const [direction, x, y] of [
      ["left", 0.15, 0.5],
      ["right", 0.85, 0.5],
      ["down", 0.5, 0.85],
    ]) {
      await page.mouse.move(box.x + box.width * x, box.y + box.height * y);
      await wait(180);
      const state = await sample();
      assert.ok(state.paths.length > 1, `${title}/${direction}: missing parts`);
      assert.ok(
        state.paths.every((path) => path.d && !/NaN|Infinity/.test(path.d)),
        `${title}: invalid geometry`,
      );
      await avatar.screenshot({
        path: `${output}/${title.replaceAll(" ", "-")}-${direction}.png`,
      });
    }
    results.push({ title, ...(await sample()) });
  }
  // Rapid edits must settle on the last complete geometry, not a stale async load.
  await page.click('[aria-label="Sleepy lids"]');
  await page.click('[aria-label="Oval"]');
  await page.waitForFunction(() => {
    const avatar = document.querySelector('[data-bloom-vector-avatar]');
    return avatar?.dataset.geometry && JSON.parse(avatar.dataset.geometry)[1] === 'oval' && avatar.getAttribute('aria-busy') === 'false';
  });
  await settled();
  const colors = await page.$$(
    '[data-testid="agent-avatar-color-selector"] [aria-pressed]',
  );
  assert.ok(colors.length >= 3, "Missing color choices");
  const contrasts = [];
  for (const color of colors.slice(0, 3)) {
    await color.click();
    await wait(80);
    const ratio = await page.$eval("[data-bloom-vector-avatar]", (node) => {
      const paths = [...node.querySelectorAll("path")]
        .filter((path) => !path.closest("defs"))
        .map((path) => ({
          fill: getComputedStyle(path).fill,
          box: path.getBBox(),
        }))
        .sort(
          (a, b) => b.box.width * b.box.height - a.box.width * a.box.height,
        );
      const luminance = (fill) => {
        const rgb = fill
          .match(/[\d.]+/g)
          .slice(0, 3)
          .map(Number)
          .map((value) => value / 255)
          .map((value) =>
            value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
          );
        return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
      };
      const a = luminance(paths[0].fill),
        b = luminance(paths[1].fill);
      return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    });
    assert.ok(ratio >= 3, `Eye/body contrast ${ratio.toFixed(2)} below3:1`);
    contrasts.push(ratio);
  }
  await wait(100);
  const painted = await sample();
  assert.ok(
    painted.paths.some((path) => path.fill),
    "Color edit removed painted paths",
  );
  const press = async (label) => {
    for (const button of await page.$$("[role=button],button"))
      if (
        (await button.evaluate((node) => node.textContent.trim())) === label
      ) {
        await button.click();
        return;
      }
    throw Error(`Missing action ${label}`);
  };
  await press("Work");
  await page.waitForFunction(
    () =>
      document.querySelector("[data-bloom-vector-avatar]").dataset.action ===
      "work",
  );
  for (const time of [0.6, 1.5, 2.4]) {
    await page.waitForFunction(
      (t) =>
        Number(
          document.querySelector("[data-bloom-vector-avatar]").dataset.time,
        ) >= t,
      {},
      time,
    );
    await (
      await page.$("[data-bloom-vector-avatar]")
    ).screenshot({ path: `${output}/work-${time}.png` });
  }
  await press("React");
  await wait(100);
  await press("Work");
  await page.waitForFunction(
    () =>
      document.querySelector("[data-bloom-vector-avatar]").dataset.action ===
      "idle",
    { timeout: 15000 },
  );
  await settled();
  assert.ok((await sample()).paths.length > 1, "Interrupted work lost avatar");
  assert.equal(await page.$("canvas"), null, "Editor must stay SVG");
  assert.deepEqual(errors, []);
  await page.screenshot({ path: `${output}/editor-final.png` });
  await writeFile(
    `${output}/report.json`,
    JSON.stringify(
      {
        errors,
        templates: results.map(({ title, geometry, paths }) => ({
          title,
          geometry,
          pathCount: paths.length,
        })),
        rapidEdits: true,
        contrastRatios: contrasts,
        interruptedWorkReturnsIdle: true,
      },
      null,
      2,
    ),
  );
  console.log(`Avatar editor regressions passed: ${output}`);
} finally {
  await browser.close();
}
