/**
 * Start Storybook, then run with CHROME_PATH pointing to an installed Chrome.
 * Changes ONLY pixels outside a gray pane and samples its painted interior.
 * Capture the full viewport: screenshot clip bounds can truncate Chromium's
 * backdrop input, falsely reporting no lateral refraction. Crop on canvas later.
 */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let puppeteer;
for (const location of ['puppeteer-core', '/home/nate/Oxy/Homiio/node_modules/puppeteer-core']) {
  try { puppeteer = require(location); break; } catch { /* Try the local browser tools. */ }
}
if (!puppeteer) throw new Error('Install puppeteer-core to run this browser check.');
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH ?? '/opt/google/chrome/chrome',
  headless: true, args: ['--no-sandbox'],
});
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 800, height: 600, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const mode of ['light', 'dark']) {
    await page.goto(`${process.env.STORYBOOK_URL ?? 'http://localhost:6006'}/iframe.html?id=base-surface--material&viewMode=story&globals=theme:${mode}`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('.bloom-surface--glass');
    const rim = await page.evaluate(() => {
      const source = document.querySelector('.bloom-surface--glass');
      const fixture = document.createElement('div');
      fixture.id = 'refraction-check';
      fixture.style.cssText = 'position:fixed;inset:0;z-index:999999';
      const pane = source.cloneNode(false);
      Object.assign(pane.style, { position: 'absolute', left: '250px', top: '200px', width: '200px', height: '80px', borderRadius: '20px' });
      fixture.append(pane);
      document.body.append(fixture);
      return getComputedStyle(pane, '::after').boxShadow;
    });
    const measure = async () => {
      const shots = [];
      for (const side of ['#ff0000', '#00ff00']) {
        await page.$eval('#refraction-check', (element, color) => {
          element.style.background = `linear-gradient(90deg, ${color} 0 250px, #888888 250px 450px, ${color} 450px)`;
        }, side);
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        shots.push(await page.screenshot({ encoding: 'base64' }));
      }
      return page.evaluate(async (captures) => {
        const images = await Promise.all(captures.map(capture => new Promise(resolve => {
          const image = new Image(); image.onload = () => resolve(image); image.src = `data:image/png;base64,${capture}`;
        })));
        const canvas = document.createElement('canvas'); canvas.width = 200; canvas.height = 80;
        const context = canvas.getContext('2d');
        const pixels = images.map(image => {
          context.clearRect(0, 0, 200, 80); context.drawImage(image, -250, -200);
          return context.getImageData(0, 0, 200, 80).data;
        });
        let changed = 0;
        for (let y = 10; y < 70; y++) for (let x = 10; x < 190; x++) {
          const offset = (y * 200 + x) * 4;
          let delta = 0;
          for (let channel = 0; channel < 3; channel++) delta += Math.abs(pixels[0][offset + channel] - pixels[1][offset + channel]);
          if (delta > 12) changed++;
        }
        return changed;
      }, shots);
    };
    const refracted = await measure();
    await page.screenshot({path:'/tmp/surface-fixture-'+mode+'.png'});
    // Negative control: keep tint, sheen, blur and sampling area; remove displacement.
    await page.addStyleTag({ content: '#refraction-check .bloom-surface::before { filter: none !important; }' });
    const withoutDisplacement = await measure();
    console.log(JSON.stringify({ mode, refracted, withoutDisplacement, rim }));
    if (refracted < 100 || withoutDisplacement !== 0) throw new Error(`Lateral refraction failed in ${mode}`);
    if (mode === 'light' ? !rim.includes('0.5') : rim.includes('0.5')) throw new Error(`Wrong ${mode} rim`);
  }
  if (errors.length) throw new Error(errors.join('\n'));
} finally { await browser.close(); }
