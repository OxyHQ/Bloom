import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { filterColor, parseLook, type RGB } from '../../../../src/surface/filter-color';
import { materialFilter, SURFACE_LOOKS } from '../../../../src/surface/optics';
const require = createRequire(process.env.PLAYWRIGHT_PACKAGE_JSON!);
const playwright = require('playwright');
const engine = process.env.BROWSER ?? 'webkit';
const output = process.env.FIELD_OUTPUT ?? '.local/issue-663/minimal-webkit';
mkdirSync(output, { recursive: true });
const records = [];
for (const mode of ['light', 'dark'] as const)
  for (const backing of ['black', 'white', 'stripes'])
    for (const kind of ['backdrop', 'filter']) {
      const name = `${mode}-${backing}-${kind}`;
      if (process.env.PROBE_CASE && !process.env.PROBE_CASE.split(',').includes(name)) continue;
      const args = engine === 'chromium' ? ['--no-sandbox'] : [];
      const browser = await playwright[engine].launch({
        executablePath: process.env.BROWSER_PATH,
        headless: process.env.HEADED !== '1',
        args,
      });
      const page = await browser.newPage({
        viewport: { width: 800, height: 400 },
        deviceScaleFactor: 1,
      });
      const errors: string[] = [];
      page.on('pageerror', (e: Error) => errors.push(e.message));
      try {
        const chain = materialFilter(SURFACE_LOOKS[mode]);
        const background =
          backing === 'stripes'
            ? 'repeating-linear-gradient(90deg,#000 0px,#000 32px,#fff 32px,#fff 64px)'
            : backing;
        const tint = mode === 'light' ? [211, 224, 241] : [24, 38, 53];
        const style =
          kind === 'backdrop'
            ? `backdrop-filter:${chain};-webkit-backdrop-filter:${chain};background:rgba(${tint.join(',')},.72)`
            : `filter:${chain};background:${background}`;
        await page.setContent(
          `<style>body{margin:0}.scene{position:relative;width:800px;height:400px;background:${background}}.sample{position:absolute;inset:40px;${style}}</style><div class="scene"><div class="sample"></div></div>`,
        );
        await page.evaluate(() => {
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
        await page.waitForTimeout(1200);
        const state = await page.evaluate(() => {
          const sample = document.querySelector('.sample')!;
          const s = getComputedStyle(sample);
          return {
            supports: {
              backdrop: CSS.supports('backdrop-filter', 'blur(24px)'),
              prefixed: CSS.supports('-webkit-backdrop-filter', 'blur(24px)'),
            },
            computed: {
              filter: s.filter,
              backdrop: s.backdropFilter,
              prefixed: s.getPropertyValue('-webkit-backdrop-filter'),
              background: s.backgroundColor,
            },
            probe: (window as any).probe,
            userAgent: navigator.userAgent,
          };
        });
        const png = await page.screenshot({ path: `${output}/${name}.png`, timeout: 15000 });
        const samples = await page.evaluate(
          async (data: string) => {
            const img = new Image();
            img.src = data;
            await img.decode();
            const c = document.createElement('canvas');
            c.width = img.width;
            c.height = img.height;
            const ctx = c.getContext('2d')!;
            ctx.drawImage(img, 0, 0);
            return Array.from({ length: 16 }, (_, i) => {
              const x = 256 + i * 8;
              return {
                x,
                y: 200,
                rgb: Array.from(ctx.getImageData(x, 200, 1, 1).data).slice(0, 3),
              };
            });
          },
          `data:image/png;base64,${png.toString('base64')}`,
        );
        const gpu = await page.evaluate(() => {
          const gl = document.createElement('canvas').getContext('webgl');
          if (!gl) return null;
          const ext = gl.getExtension('WEBGL_debug_renderer_info');
          return {
            renderer: gl.getParameter(gl.RENDERER),
            vendor: gl.getParameter(gl.VENDOR),
            unmasked: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : null,
          };
        });
        const filtered =
          backing === 'stripes'
            ? null
            : filterColor((backing === 'black' ? [0, 0, 0] : [1, 1, 1]) as RGB, parseLook(chain)!);
        const expected =
          filtered?.map((v, i) =>
            Math.round(kind === 'filter' ? v * 255 : v * 255 * 0.28 + tint[i]! * 0.72),
          ) ?? null;
        const env = Object.fromEntries(
          [
            'WEBKIT_DISABLE_COMPOSITING_MODE',
            'WEBKIT_FORCE_COMPOSITING_MODE',
            'WEBKIT_DISABLE_DMABUF_RENDERER',
            'LIBGL_ALWAYS_SOFTWARE',
            'GDK_BACKEND',
            'DISPLAY',
            'WAYLAND_DISPLAY',
          ].map((key) => [key, process.env[key] ?? null]),
        );
        records.push({
          name,
          engine,
          browser: browser.version(),
          executable: process.env.BROWSER_PATH,
          headless: process.env.HEADED !== '1',
          args,
          env,
          chain,
          state,
          expected,
          samples,
          gpu,
          errors,
        });
      } catch (error) {
        records.push({ name, error: String(error), errors });
      } finally {
        await browser.close();
        writeFileSync(`${output}/minimal.json`, JSON.stringify(records, null, 2) + '\n');
      }
    }
