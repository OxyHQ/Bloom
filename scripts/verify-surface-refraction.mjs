/**
 * Start Storybook, then run with CHROME_PATH pointing to an installed Chrome.
 * Changes ONLY pixels outside a gray pane and checks its subtle transmission and displacement.
 * Capture the full viewport: screenshot clip bounds can truncate Chromium's
 * backdrop input, falsely reporting no lateral refraction. Crop on canvas later.
 */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let puppeteer;
for (const location of ['puppeteer-core', '/home/nate/Oxy/Homiio/node_modules/puppeteer-core']) {
  try {
    puppeteer = require(location);
    break;
  } catch {
    /* Try the local browser tools. */
  }
}
if (!puppeteer) throw new Error('Install puppeteer-core to run this browser check.');
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH ?? '/opt/google/chrome/chrome',
  headless: true,
  args: ['--no-sandbox'],
});
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 800, height: 600, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const mode of ['light', 'dark']) {
    await page.goto(
      `${process.env.STORYBOOK_URL ?? 'http://localhost:6006'}/iframe.html?id=base-surface--material&viewMode=story&globals=theme:${mode}`,
      { waitUntil: 'networkidle0' },
    );
    await page.waitForSelector('.bloom-surface--material');
    const rim = await page.evaluate(() => {
      const source = document.querySelector('.bloom-surface--material');
      const fixture = document.createElement('div');
      fixture.id = 'refraction-check';
      fixture.style.cssText = 'position:fixed;inset:0;z-index:999999';
      const pane = source.cloneNode(false);
      Object.assign(pane.style, {
        position: 'absolute',
        left: '250px',
        top: '200px',
        width: '200px',
        height: '80px',
        borderRadius: '20px',
      });
      fixture.append(pane);
      document.body.append(fixture);
      return getComputedStyle(pane, '::after').boxShadow;
    });
    // Compare only colours outside the pane: body transmission must stay small,
    // and the visible material must respond to displacement beyond ordinary blur.
    const captureSides = async () => {
      const shots = [];
      for (const side of ['#ff0000', '#00ff00']) {
        await page.$eval(
          '#refraction-check',
          (element, color) => {
            element.style.background = `linear-gradient(90deg, ${color} 0 250px, #888888 250px 450px, ${color} 450px)`;
          },
          side,
        );
        await page.evaluate(
          () =>
            new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
        );
        shots.push(await page.screenshot({ encoding: 'base64' }));
      }
      return shots;
    };
    for (const fill of ['rgba(255,255,255,0.9)', 'rgba(112,52,204,0.9)']) {
      await page.$eval(
        '#refraction-check',
        (fixture, color) =>
          fixture.firstElementChild.style.setProperty('--bloom-surface-fill', color),
        fill,
      );
      const enabled = await captureSides();
      const disable = await page.addStyleTag({
        content: '#refraction-check .bloom-surface::before { filter: none !important; }',
      });
      const disabled = await captureSides();
      await disable.evaluate((element) => element.remove());
      const result = await page.evaluate(
        async (captures) => {
          const canvas = document.createElement('canvas');
          canvas.width = 200;
          canvas.height = 80;
          const context = canvas.getContext('2d');
          const pixels = await Promise.all(
            captures.map(async (capture) => {
              const image = new Image();
              image.src = `data:image/png;base64,${capture}`;
              await image.decode();
              context.clearRect(0, 0, 200, 80);
              context.drawImage(image, -250, -200);
              return context.getImageData(0, 0, 200, 80).data;
            }),
          );
          let bodyChanged = 0,
            bodyMaxResponse = 0,
            materialDisplacement = 0;
          for (let y = 20; y < 60; y++)
            for (let x = 0; x < 200; x++) {
              const offset = (y * 200 + x) * 4;
              let response = 0,
                displacement = 0;
              for (let c = 0; c < 3; c++) {
                const active = pixels[0][offset + c] - pixels[1][offset + c];
                const control = pixels[2][offset + c] - pixels[3][offset + c];
                response += Math.abs(active);
                displacement += Math.abs(active - control);
              }
              if (x >= 10 && x < 190) {
                bodyMaxResponse = Math.max(bodyMaxResponse, response);
                if (response > 3) bodyChanged++;
              }
              if (x >= 10 && x < 190 && displacement > 3) materialDisplacement++;
            }
          return { bodyChanged, bodyMaxResponse, materialDisplacement };
        },
        [...enabled, ...disabled],
      );
      console.log(JSON.stringify({ mode, fill, ...result, rim }));
      if (
        result.bodyChanged < 10 ||
        result.bodyMaxResponse > 60 ||
        result.materialDisplacement < 10
      )
        throw new Error(`Subtle refractive material failed in ${mode} (${fill})`);
    }
    await page.$eval('#refraction-check', (fixture) => {
      fixture.style.background =
        'repeating-linear-gradient(35deg, #123456 0 5px, #ef9944 5px 10px)';
      Object.assign(fixture.firstElementChild.style, {
        width: '120px',
        height: '40px',
        padding: '0',
        minHeight: '0',
        minWidth: '0',
        borderRadius: '999px',
        cornerShape: 'round',
        boxShadow: 'none',
      });
    });
    const captureCorner = async (rule) => {
      const override = rule ? await page.addStyleTag({ content: rule }) : null;
      await page.evaluate(
        () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
      );
      const capture = await page.screenshot({ encoding: 'base64' });
      await override?.evaluate((element) => element.remove());
      return capture;
    };
    const corners = await page.evaluate(
      async (captures) => {
        const canvas = document.createElement('canvas');
        canvas.width = 136;
        canvas.height = 56;
        const context = canvas.getContext('2d');
        const pixels = await Promise.all(
          captures.map(async (capture) => {
            const image = new Image();
            image.src = `data:image/png;base64,${capture}`;
            await image.decode();
            context.clearRect(0, 0, 136, 56);
            context.drawImage(image, -242, -192);
            return context.getImageData(0, 0, 136, 56).data;
          }),
        );
        return pixels.slice(1).map((sample) => {
          let changed = 0;
          for (let y = 0; y < 56; y++)
            for (let x = 0; x < 136; x++) {
              const centerX = x < 28 ? 28 : x >= 108 ? 108 : x;
              // Exclude antialiased boundary pixels; only inspect outside the capsule.
              if (Math.hypot(x + 0.5 - centerX, y + 0.5 - 28) <= 22) continue;
              const offset = (y * 136 + x) * 4;
              let delta = 0;
              for (let channel = 0; channel < 3; channel++)
                delta += Math.abs(sample[offset + channel] - pixels[0][offset + channel]);
              if (delta > 12) changed++;
            }
          return changed;
        });
      },
      [
        await captureCorner(
          '#refraction-check .bloom-surface::before { display: none !important; }',
        ),
        await captureCorner(''),
        // Mutation control proves the pixel check detects a lost rounded contour.
        await captureCorner('#refraction-check .bloom-surface { border-radius: 0 !important; }'),
      ],
    );
    console.log(
      JSON.stringify({ mode, outsideCornerPixels: corners[0], squareCornerPixels: corners[1] }),
    );
    if (corners[0] !== 0 || corners[1] < 10)
      throw new Error(`Rounded refraction clipping failed in ${mode}`);
  }
  if (errors.length) throw new Error(errors.join('\n'));
} finally {
  await browser.close();
}
