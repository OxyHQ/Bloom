import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { filterColor, parseLook, type RGB } from '../../../../src/surface/filter-color';
import { parseRgba } from '../../../../src/theme/color-utils';
import { contrastRatio } from '../../../../src/styles/color-contrast';
const require = createRequire(process.env.PLAYWRIGHT_PACKAGE_JSON!);
const playwright = require('playwright');
const engine = process.env.BROWSER ?? 'webkit';
const output = process.env.FIELD_OUTPUT ?? '.local/issue-663/single-webkit';
mkdirSync(output, { recursive: true });
const records = [];
for (const mode of ['light', 'dark'])
  for (const backing of ['black', 'white'])
    for (const edge of [false, true])
      for (const baked of [false, true]) {
        const name = `${mode}-${backing}-${edge ? 'edge' : 'body'}-${baked ? 'forced-baked' : 'live'}`;
        const browser = await playwright[engine].launch({
          executablePath: process.env.BROWSER_PATH,
          args: engine === 'chromium' ? ['--no-sandbox'] : [],
        });
        const page = await browser.newPage({
          viewport: { width: 800, height: 1000 },
          deviceScaleFactor: 1,
        });
        const errors: string[] = [];
        page.on('pageerror', (e: Error) => errors.push(e.message));
        try {
          await page.addInitScript(() => {
            (window as any).probe = { raf: 0, timer: 0 };
            setInterval(() => {
              (window as any).probe.timer++;
            }, 16);
            const tick = () => {
              (window as any).probe.raf++;
              requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
          });
          await page.goto(
            `http://127.0.0.1:6042/iframe.html?id=base-input--single-material-body-contrast&globals=theme:${mode};colorPreset:blue`,
            { timeout: 120000 },
          );
          await page.getByTestId('single-field').waitFor({ timeout: 120000 });
          await page.evaluate(async (backing: string) => {
            document.querySelector<HTMLElement>(
              '[data-testid="single-backing"]',
            )!.style.backgroundColor = backing;
            await document.fonts.ready;
          }, backing);
          const initial = await page.evaluate(() => {
            const host = document.querySelector<HTMLElement>('.bloom-surface-paint')!;
            const s = getComputedStyle(host);
            const b = getComputedStyle(host, '::before');
            return {
              tint: b.backgroundColor,
              filter: s.getPropertyValue('--bloom-surface-filter').trim(),
              automaticBake: host.getAttribute('data-bloom-material'),
              hostCount: document.querySelectorAll('.bloom-surface-paint').length,
            };
          });
          const tint = parseRgba(initial.tint)!;
          const filtered = filterColor(
            (backing === 'black' ? [0, 0, 0] : [1, 1, 1]) as RGB,
            parseLook(initial.filter)!,
          );
          const expected = filtered.map((v, i) =>
            Math.round(v * 255 * (1 - tint.a) + [tint.r, tint.g, tint.b][i]! * tint.a),
          );
          if (!edge)
            await page.addStyleTag({
              content: '.bloom-surface-paint::after{display:none!important}',
            });
          if (baked)
            await page.evaluate(
              (color: string) => {
                const host = document.querySelector<HTMLElement>('.bloom-surface-paint')!;
                host.style.setProperty('--bloom-surface-baked-body', color);
                host.setAttribute('data-bloom-material', 'baked');
              },
              `rgb(${expected.join(',')})`,
            );
          const before = await page.evaluate(() => (window as any).probe);
          await page.waitForTimeout(1200);
          const after = await page.evaluate(() => (window as any).probe);
          const target = await page.evaluate(() => {
            const el = document.querySelector<HTMLInputElement>('[data-testid="single-field"]')!;
            const host = document.querySelector<HTMLElement>('.bloom-surface-paint')!;
            const r = el.getBoundingClientRect(),
              h = host.getBoundingClientRect();
            const b = getComputedStyle(host, '::before'),
              a = getComputedStyle(host, '::after');
            return {
              rect: { x: r.x, y: r.y, width: r.width, height: r.height },
              paint: { x: h.x, y: h.y, width: h.width, height: h.height },
              color: getComputedStyle(el, '::placeholder').color,
              bodyFilter: b.backdropFilter,
              edgeFilter: a.backdropFilter,
              bodyColor: b.backgroundColor,
              edgeDisplay: a.display,
              bake: host.getAttribute('data-bloom-material'),
            };
          });
          const normal = await page.screenshot({ path: `${output}/${name}.png`, timeout: 15000 });
          await page.addStyleTag({ content: 'input::placeholder{color:transparent!important}' });
          const blank = await page.screenshot({
            path: `${output}/${name}-backing.png`,
            timeout: 15000,
          });
          const pixels = await page.evaluate(
            async ({ normal, blank, target }) => {
              const read = async (data: string) => {
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
              const a = await read(normal),
                b = await read(blank);
              const rgb = target.color
                .match(/[\d.]+/g)!
                .slice(0, 3)
                .map(Number);
              const backgrounds = new Map();
              let ink = 0;
              const r = target.rect;
              for (let y = Math.ceil(r.y); y < Math.floor(r.y + r.height); y++)
                for (let x = Math.ceil(r.x); x < Math.floor(r.x + r.width); x++) {
                  const i = (y * a.width + x) * 4;
                  const fg = Array.from(a.data.slice(i, i + 3));
                  const bg = Array.from(b.data.slice(i, i + 3));
                  if (
                    fg.every((v, c) => v === rgb[c]) &&
                    fg.some((v, c) => Math.abs(v - bg[c]!) > 8)
                  ) {
                    ink++;
                    backgrounds.set(bg.join(','), bg);
                  }
                }
              const center =
                (Math.round(target.paint.y + target.paint.height / 2) * b.width +
                  Math.round(target.paint.x + target.paint.width - 30)) *
                4;
              return {
                ink,
                backgrounds: Array.from(backgrounds.values()) as number[][],
                center: Array.from(b.data.slice(center, center + 3)),
              };
            },
            {
              normal: `data:image/png;base64,${normal.toString('base64')}`,
              blank: `data:image/png;base64,${blank.toString('base64')}`,
              target,
            },
          );
          if (!pixels.ink) throw new Error('No exact painted foreground pixels');
          records.push({
            name,
            engine,
            browser: browser.version(),
            initial,
            target,
            expected,
            pixels,
            contrast: Math.min(
              ...pixels.backgrounds.map((rgb) =>
                contrastRatio(target.color, `rgb(${rgb.join(',')})`),
              ),
            ),
            rafDelta: after.raf - before.raf,
            timerDelta: after.timer - before.timer,
            errors,
          });
        } catch (error) {
          records.push({ name, error: String(error), errors });
        } finally {
          await browser.close();
          writeFileSync(`${output}/single.json`, JSON.stringify(records, null, 2) + '\n');
        }
      }
