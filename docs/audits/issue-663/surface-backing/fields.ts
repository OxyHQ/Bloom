import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { contrastRatio } from '../../../../src/styles/color-contrast';
const require = createRequire(process.env.PLAYWRIGHT_PACKAGE_JSON!);
const playwright = require('playwright');
const engine = ['webkit', 'firefox'].includes(process.env.BROWSER ?? '')
  ? process.env.BROWSER!
  : 'chromium';
const browser = await playwright[engine].launch({
  executablePath: process.env.BROWSER_PATH ?? process.env.CHROME_PATH,
  args: engine === 'chromium' ? ['--no-sandbox'] : [],
});
const page = await browser.newPage({
  viewport: { width: 800, height: 1000 },
  deviceScaleFactor: 1,
});
const output = process.env.FIELD_OUTPUT ?? '.local/issue-663/field-body';
mkdirSync(output, { recursive: true });
const records = [];
const preset = process.env.COLOR_PRESET ?? 'blue';
for (const mode of (process.env.MODES ?? 'light,dark').split(','))
  for (const dir of ['ltr', 'rtl'])
    for (const backing of ['black', 'white']) {
      const name = `${mode}-${dir}-${backing}`;
      await page.goto(
        `http://127.0.0.1:6042/iframe.html?id=base-input--material-body-contrast&globals=theme:${mode};colorPreset:${preset}`,
      );
      await page.locator('[data-testid="body-xs"]').waitFor({ timeout: 120000 });
      await page.evaluate(
        async ({ dir, backing }) => {
          document.documentElement.dir = dir;
          for (const panel of document.querySelectorAll<HTMLElement>('[data-testid^=body-panel]'))
            panel.style.backgroundColor = backing;
          await document.fonts.ready;
        },
        { dir, backing },
      );
      await page.waitForTimeout(500);
      const targets = await page.evaluate(() =>
        Array.from(document.querySelectorAll('input')).map((el) => {
          const s = getComputedStyle(el),
            p = getComputedStyle(el, '::placeholder');
          const r = el.getBoundingClientRect();
          let parent: HTMLElement | null = el.parentElement;
          while (parent && !parent.querySelector('.bloom-surface-paint'))
            parent = parent.parentElement;
          const paint = parent?.querySelector('.bloom-surface-paint');
          const b = paint?.getBoundingClientRect();
          return {
            id: el.dataset.testid,
            rect: { x: r.x, y: r.y, width: r.width, height: r.height },
            paint: b ? { x: b.x, y: b.y, width: b.width, height: b.height } : null,
            font: s.fontSize,
            lineHeight: s.lineHeight,
            padding: [s.paddingTop, s.paddingRight, s.paddingBottom, s.paddingLeft],
            color: p.color,
            backing: el.closest('[data-testid^=body-panel]')
              ? getComputedStyle(el.closest('[data-testid^=body-panel]')!).backgroundColor
              : null,
          };
        }),
      );
      const normal = await page.screenshot({ path: `${output}/${name}.png` });
      await page.addStyleTag({ content: 'input::placeholder {color:transparent!important}' });
      const blank = await page.screenshot({ path: `${output}/${name}-backing.png` });
      const samples = await page.evaluate(
        async ({ normal, blank, targets }) => {
          const decode = async (data: string) => {
            const img = new Image();
            img.src = data;
            await img.decode();
            const c = document.createElement('canvas');
            c.width = img.width;
            c.height = img.height;
            const ctx = c.getContext('2d')!;
            ctx.drawImage(img, 0, 0);
            return { data: ctx.getImageData(0, 0, c.width, c.height).data, width: c.width };
          };
          const a = await decode(normal),
            b = await decode(blank);
          return targets.map((target: any) => {
            const r = target.rect;
            const fg = target.color
              .match(/[\d.]+/g)
              .slice(0, 3)
              .map(Number);
            let minY = Infinity,
              maxY = -Infinity,
              minX = Infinity,
              maxX = -Infinity;
            const backgrounds = new Map();
            let ink = 0;
            for (let y = Math.ceil(r.y); y < Math.floor(r.y + r.height); y++)
              for (let x = Math.ceil(r.x); x < Math.floor(r.x + r.width); x++) {
                const i = (y * a.width + x) * 4;
                const actual = Array.from(a.data.slice(i, i + 3)),
                  base = Array.from(b.data.slice(i, i + 3));
                const delta = Math.max(...actual.map((v, c) => Math.abs(v - base[c])));
                if (delta < 8) continue;
                minY = Math.min(minY, y);
                maxY = Math.max(maxY, y);
                minX = Math.min(minX, x);
                maxX = Math.max(maxX, x);
                if (Math.max(...actual.map((v, c) => Math.abs(v - fg[c]))) === 0) {
                  backgrounds.set(base.join(','), base);
                  ink++;
                }
              }
            return {
              ...target,
              ink,
              glyphBounds: { minY, maxY, minX, maxX },
              backgrounds: Array.from(backgrounds.values()),
            };
          });
        },
        {
          normal: `data:image/png;base64,${normal.toString('base64')}`,
          blank: `data:image/png;base64,${blank.toString('base64')}`,
          targets,
        },
      );
      if (samples.some((sample: { ink: number }) => sample.ink === 0))
        throw new Error('No exact painted foreground in one or more fields');
      records.push({
        name,
        samples: samples.map((sample: any) => ({
          ...sample,
          minimumContrast: Math.min(
            ...sample.backgrounds.map((rgb: number[]) =>
              contrastRatio(sample.color, `rgb(${rgb.join(',')})`),
            ),
          ),
        })),
      });
    }
writeFileSync(
  `${output}/fields.json`,
  JSON.stringify({ engine, preset, browser: browser.version(), records }, null, 2) + '\n',
);
await browser.close();
