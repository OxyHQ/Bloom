/**
 * Prices the glass fill alpha: what a given alpha buys in VISIBLE glassiness and
 * what it costs in label legibility.
 *
 * MEASUREMENT ONLY. Nothing here changes `GLASS_FILL_ALPHA`, nothing in the
 * library imports it, and it is not a gate — it exists because the trade the
 * shipped 0.85 makes was argued in prose and never rendered, and "is it glassy"
 * is a question about painted pixels that no unit test can answer.
 *
 * Usage — start the Storybook DEV server (not a static build; this reads the
 * theme modules through Vite), then:
 *
 *   node scripts/measure-glass-alpha.mjs [--url http://localhost:6006] [--image out.png]
 *
 * ── HOW THE ALPHA IS VARIED ─────────────────────────────────────────────────
 *
 * `GLASS_FILL_ALPHA` is a module constant, so seven alphas cannot be seven
 * renders of the component. Instead this CLONES the real
 * `button.bloom-btn--glass` node Storybook rendered and overrides exactly one
 * thing on the clone: `background-color`, to the same rgb at a different alpha.
 * That is precisely what `resolveGlassColors` would have produced — the hairline
 * is the fill at FULL strength, and the rim highlight, drop shadow, sheen
 * gradient and `backdrop-filter` are all alpha-independent — so a clone is the
 * real material at another alpha rather than a mock of it. The rgb is read off
 * the live button, and the script refuses to run if that button is not painting
 * at the shipped alpha.
 *
 * ── WHY EVERY NUMBER IS COMPUTED IN THE PAGE ────────────────────────────────
 *
 * The contrast sweep needs `buildTheme`, and the Vite dev server serves Bloom's
 * own TypeScript with Bloom's own resolution (`react-native` → `react-native-web`,
 * so `Platform.OS === 'web'`, which is the platform being measured). Running it
 * in the page rather than in node means the analytic half and the painted half
 * come from one module graph instead of two, and there is one copy of the WCAG
 * maths rather than two that can drift.
 *
 * ── THE THREE MEASUREMENTS ──────────────────────────────────────────────────
 *
 * 1. BACKDROP RESPONSE — how far the painted pane moves when the backdrop goes
 *    from white to black. The existing translucency proof from
 *    `theme/__tests__/glass-colors.test.ts`, taken here from real pixels rather
 *    than from the composition model, so the two can be compared.
 *
 * 2. BLUR VISIBILITY — the one thing no current gate measures. `backdrop-filter`
 *    only acts on the fraction of the backdrop that gets THROUGH the pane, so
 *    the blur can be running at full radius and be invisible. Over a hard stripe
 *    pattern this reads two ways: how much stripe structure survives inside the
 *    pane, and how much the picture CHANGES when the blur is switched off. The
 *    second is the honest answer to "can you see the blur".
 *
 * 3. LABEL CONTRAST — the composited-pane WCAG ratio over Bloom's five neutral
 *    surfaces, every preset, both modes, counted against AA. CONTROLLED against
 *    the shipped gate: the 0.85 row must reproduce the count `glass-colors.test.ts`
 *    pins, or the sweep is measuring a different material than the library ships.
 */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const puppeteer = require('/home/nate/Oxy/Homiio/node_modules/puppeteer-core');

/** The sweep. Measured high-to-low; 0.85 doubles as the control row. */
const ALPHAS = [0.85, 0.75, 0.65, 0.55, 0.45, 0.35, 0.25];

/**
 * Stripe period in CSS px, deliberately far below the material's 10px blur
 * radius: a working blur then flattens the pattern completely, so the residual
 * amplitude measures the BACKDROP getting through rather than a blur too weak
 * for the pattern.
 */
const STRIPE_PX = 4;

/** Seeded picsum — deterministic per seed, so the strip is reproducible. */
const PHOTO_URL = 'https://picsum.photos/seed/bloom-glass/1200/400';

/**
 * What `theme/__tests__/glass-colors.test.ts` pins for `primary` at the shipped
 * alpha. If this sweep's own 0.85 row does not reproduce it, the composition
 * here has drifted from the library's and every other row is unverified.
 */
const SHIPPED_PRIMARY_AA_FAILURES = 45;

/**
 * How large a per-pixel change counts as "you can see the blur", out of 255.
 * Around the level at which a difference stops being a measurement and starts
 * being something a person notices side by side; the table prints the raw
 * numbers, so a reader who disagrees can draw the line somewhere else.
 */
const LEGIBLE_BLUR = 8;

const argUrl = process.argv.indexOf('--url');
const BASE = argUrl !== -1 ? process.argv[argUrl + 1] : 'http://localhost:6006';
const argImage = process.argv.indexOf('--image');
const IMAGE_OUT = argImage !== -1 ? process.argv[argImage + 1] : null;

const STRIPES = `repeating-linear-gradient(90deg, #000 0 ${STRIPE_PX}px, #fff ${STRIPE_PX}px ${STRIPE_PX * 2}px)`;

const browser = await puppeteer.launch({
  executablePath: '/opt/google/chrome/chrome',
  headless: false,
  args: ['--no-sandbox'],
  defaultViewport: { width: 1280, height: 900, deviceScaleFactor: 1 },
});
const page = await browser.newPage();
page.on('pageerror', (e) => console.log('PAGEERROR', e.message));

await page.goto(`${BASE}/iframe.html?id=components-button--glass&viewMode=story`, {
  waitUntil: 'networkidle0',
});
await page.waitForSelector('button.bloom-btn--glass');

// ── Build the harness, and report the live fill it was cloned from ──────────
const built = await page.evaluate(
  async ({ alphas, stripes, photo }) => {
    const source = document.querySelector('button.bloom-btn--glass');
    if (!source) throw new Error('no glass button on the page');

    /**
     * The "flat page" backdrop is Bloom's OWN `background` token, read live off
     * the provider's CSS variables rather than picked to look plausible — it is
     * the surface a consumer's page actually is, and the whole question is what
     * the material does there.
     */
    const flat = getComputedStyle(document.documentElement)
      .getPropertyValue('--background')
      .trim();
    if (!flat) throw new Error('no --background token on the document');
    const bg = getComputedStyle(source).backgroundColor;
    const parts = /rgba?\(([^)]*)\)/
      .exec(bg)?.[1]
      ?.split(/[\s,/]+/)
      .filter(Boolean)
      .map(Number);
    if (!parts || parts.length < 4) throw new Error(`unreadable fill: ${bg}`);
    const rgb = `${parts[0]}, ${parts[1]}, ${parts[2]}`;

    const harness = document.createElement('div');
    harness.id = 'glass-harness';
    harness.style.cssText = 'position:absolute;inset:0;background:#fff;z-index:99999;padding:8px;';
    document.body.appendChild(harness);

    const backdrops = { white: '#ffffff', black: '#000000', stripes, photo: `url(${photo})`, flat };
    /** Which backdrops get a blur-off twin: the ones with something to blur. */
    const TEXTURED = ['stripes', 'photo', 'flat'];
    for (const [name, background] of Object.entries(backdrops)) {
      for (const alpha of alphas) {
        // The blur-off twin turns "the blur is invisible" into a measurement
        // rather than an impression. `flat` is in the list precisely BECAUSE
        // nothing should change there — it is the negative control for the
        // other two, and it is also the case a consumer's page actually is.
        for (const blur of TEXTURED.includes(name) ? [true, false] : [true]) {
          const box = document.createElement('div');
          box.setAttribute('data-cell', `${name}|${alpha}|${blur ? 'blur' : 'noblur'}`);
          box.style.cssText =
            'display:inline-flex;align-items:center;justify-content:center;width:150px;height:56px;margin:2px;background-size:cover;background-position:center;';
          // A colour token goes on `background`; a gradient or a url goes on
          // `background-image`, so `background-size: cover` above still applies.
          if (/^(url\(|repeating-|linear-)/.test(background)) box.style.backgroundImage = background;
          else box.style.background = background;

          const clone = source.cloneNode(true);
          // The LABEL comes out of the measurement clones, and only out of
          // these — the strip below keeps it. A scanline across the pane hits
          // white text otherwise, and white text on a dark backdrop swamps
          // every amplitude reading: the first version of this measured the
          // label and reported a 4px stripe pattern as almost perfectly legible
          // through a fully blurred pane. Nothing about the material changes —
          // background, border, shadow and `backdrop-filter` all live on this
          // node — and the label is priced separately in the contrast half.
          clone.replaceChildren();
          clone.style.width = '120px';
          clone.style.backgroundColor = `rgba(${rgb}, ${alpha})`;
          if (!blur) {
            clone.style.backdropFilter = 'none';
            clone.style.setProperty('-webkit-backdrop-filter', 'none');
          }
          box.appendChild(clone);
          harness.appendChild(box);
        }
      }
    }

    // Wait for the photograph, or its cells sample a blank box.
    await new Promise((resolve) => {
      const probe = new Image();
      probe.onload = resolve;
      probe.onerror = resolve;
      probe.src = photo;
    });
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

    const rects = {};
    for (const box of document.querySelectorAll('[data-cell]')) {
      const btn = box.querySelector('button');
      if (!btn) continue;
      const r = btn.getBoundingClientRect();
      rects[box.getAttribute('data-cell')] = { x: r.x, y: r.y, w: r.width, h: r.height };
    }

    // The override is only honest if it reproduces the untouched node at the
    // shipped alpha. Compare the clone's painted slot against the source's.
    const shippedClone = document.querySelector('[data-cell^="white|0.85|"] button');
    const overrideMatchesSource =
      shippedClone !== null && getComputedStyle(shippedClone).backgroundColor === bg;

    return {
      rgb,
      alpha: parts[3],
      flat,
      rects,
      overrideMatchesSource,
      cells: Object.keys(rects).length,
    };
  },
  { alphas: ALPHAS, stripes: STRIPES, photo: PHOTO_URL },
);

if (!built.overrideMatchesSource) {
  console.log(
    'INVALID: the 0.85 clone does not paint the same fill as the untouched button, so the alpha override is not reproducing the shipped material.',
  );
  await browser.close();
  process.exit(1);
}
// white + black, plus a blur/no-blur pair for each of stripes, photo and flat.
const EXPECTED_CELLS = ALPHAS.length * (2 + 3 * 2);
if (built.cells !== EXPECTED_CELLS) {
  console.log(`INVALID: laid out ${built.cells} cells, expected ${EXPECTED_CELLS}.`);
  await browser.close();
  process.exit(1);
}

/**
 * Read the PAINTED pixel, not the computed style: a translucent surface reports
 * a plausible `background-color` for a slot it is not using, and `backdrop-filter`
 * has no computed-style representation of its RESULT at all. Screenshot, load
 * the capture back into the page, sample it on a canvas.
 */
const shot = await page.screenshot({ encoding: 'base64' });

const results = await page.evaluate(
  async ({ data, rects, alphas, shippedAlpha }) => {
    const [{ buildTheme }, { APP_COLOR_PRESETS }, { withAlpha }, { GLASS_SHEEN }] =
      await Promise.all([
        import('/src/theme/build-theme.ts'),
        import('/src/theme/color-presets.ts'),
        import('/src/theme/color-utils.ts'),
        import('/src/theme/glass-colors.ts'),
      ]);

    // ── colour maths, one copy, serving both halves ───────────────────────
    const parse = (value) => {
      const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value.trim());
      if (hex) {
        const h = hex[1].length === 3 ? hex[1].replace(/./g, (c) => c + c) : hex[1];
        return {
          r: parseInt(h.slice(0, 2), 16),
          g: parseInt(h.slice(2, 4), 16),
          b: parseInt(h.slice(4, 6), 16),
          a: 1,
        };
      }
      const fn = /^rgba?\(([^)]*)\)$/.exec(value.trim());
      if (!fn) throw new Error(`unparseable colour: ${value}`);
      const p = fn[1].split(/[\s,/]+/).filter(Boolean).map(Number);
      return { r: p[0], g: p[1], b: p[2], a: p[3] ?? 1 };
    };
    const over = (top, bottom) => ({
      r: top.r * top.a + bottom.r * (1 - top.a),
      g: top.g * top.a + bottom.g * (1 - top.a),
      b: top.b * top.a + bottom.b * (1 - top.a),
      a: 1,
    });
    const luminance = ({ r, g, b }) => {
      const ch = (v) => {
        const c = v / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      };
      return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
    };
    const contrast = (a, b) => {
      const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
      return (hi + 0.05) / (lo + 0.05);
    };

    // ── 1 + 2: sample the capture ─────────────────────────────────────────
    const img = new Image();
    img.src = `data:image/png;base64,${data}`;
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    const scan = {};
    for (const [key, r] of Object.entries(rects)) {
      // Three scanlines, all below the 1px lit rim and above the bottom edge,
      // inset from the pill's curved ends so no sample lands on the border or
      // outside it. Three rather than one so a single row of compositor noise
      // cannot move a reading.
      const rgb = [];
      for (const fraction of [0.35, 0.5, 0.65]) {
        const line = ctx.getImageData(
          Math.round(r.x + 14),
          Math.round(r.y + r.h * fraction),
          Math.round(r.w - 28),
          1,
        ).data;
        for (let i = 0; i < line.length; i += 4) rgb.push(line[i], line[i + 1], line[i + 2]);
      }
      scan[key] = rgb;
    }

    const at = (backdrop, alpha, blur = true) => {
      const v = scan[`${backdrop}|${alpha}|${blur ? 'blur' : 'noblur'}`];
      if (!v || v.length === 0) throw new Error(`no samples for ${backdrop}|${alpha}`);
      return v;
    };
    const mean = (rgb) => {
      let r = 0;
      let g = 0;
      let b = 0;
      for (let i = 0; i < rgb.length; i += 3) {
        r += rgb[i];
        g += rgb[i + 1];
        b += rgb[i + 2];
      }
      const n = rgb.length / 3;
      return { r: r / n, g: g / n, b: b / n, a: 1 };
    };
    /** Peak-to-trough luminance across the scanline, reported in 0..255. */
    const amplitude = (rgb) => {
      let lo = Infinity;
      let hi = -Infinity;
      for (let i = 0; i < rgb.length; i += 3) {
        const l = luminance({ r: rgb[i], g: rgb[i + 1], b: rgb[i + 2] });
        lo = Math.min(lo, l);
        hi = Math.max(hi, l);
      }
      return (hi - lo) * 255;
    };
    const maxChannelDiff = (a, b) =>
      Math.max(Math.abs(a.r - b.r), Math.abs(a.g - b.g), Math.abs(a.b - b.b));
    const maxPixelDiff = (a, b) => {
      let worst = 0;
      for (let i = 0; i < Math.min(a.length, b.length); i++) {
        worst = Math.max(worst, Math.abs(a[i] - b[i]));
      }
      return worst;
    };

    const meanPixelDiff = (a, b) => {
      let total = 0;
      const n = Math.min(a.length, b.length);
      for (let i = 0; i < n; i++) total += Math.abs(a[i] - b[i]);
      return total / n;
    };

    const painted = alphas.map((alpha) => ({
      alpha,
      response: maxChannelDiff(mean(at('white', alpha)), mean(at('black', alpha))),
      stripeAmp: amplitude(at('stripes', alpha, true)),
      stripeAmpNoBlur: amplitude(at('stripes', alpha, false)),
      blurStripes: maxPixelDiff(at('stripes', alpha, true), at('stripes', alpha, false)),
      blurPhotoMax: maxPixelDiff(at('photo', alpha, true), at('photo', alpha, false)),
      blurPhotoMean: meanPixelDiff(at('photo', alpha, true), at('photo', alpha, false)),
      blurFlat: maxPixelDiff(at('flat', alpha, true), at('flat', alpha, false)),
    }));

    // ── 3: label contrast over the composited pane ────────────────────────
    const SURFACE_KEYS = [
      'background',
      'backgroundSecondary',
      'backgroundTertiary',
      'card',
      'contrast50',
    ];
    const PRESETS = Object.keys(APP_COLOR_PRESETS);
    const MODES = ['light', 'dark'];
    const AA = 4.5;
    const pane = (fill, alpha, backdrop) =>
      over(parse(GLASS_SHEEN.bottom), over(parse(withAlpha(fill, alpha)), backdrop));

    const contrastRows = alphas.map((alpha) => {
      const tally = {
        primary: { fail: 0, worst: Infinity, failing: new Set() },
        destructive: { fail: 0, worst: Infinity, failing: new Set() },
      };
      let rows = 0;
      for (const preset of PRESETS) {
        for (const mode of MODES) {
          const c = buildTheme(preset, mode).colors;
          const fills = [
            { name: 'primary', fill: c.primary, onFill: c.primaryForeground },
            { name: 'destructive', fill: c.negative, onFill: c.negativeForeground },
          ];
          for (const key of SURFACE_KEYS) {
            const backdrop = parse(c[key]);
            for (const { name, fill, onFill } of fills) {
              const surface = pane(fill, alpha, backdrop);
              const ratio = contrast(surface, over(parse(onFill), surface));
              if (name === 'primary') rows++;
              if (ratio < AA) {
                tally[name].fail++;
                tally[name].failing.add(`${preset}/${mode}`);
              }
              tally[name].worst = Math.min(tally[name].worst, ratio);
            }
          }
        }
      }
      return {
        alpha,
        rowsPerFill: rows,
        primaryFailures: tally.primary.fail,
        primaryWorst: tally.primary.worst,
        primaryFailingCombos: [...tally.primary.failing].sort(),
        destructiveFailures: tally.destructive.fail,
        destructiveWorst: tally.destructive.worst,
      };
    });

    return { painted, contrastRows, shippedAlpha };
  },
  { data: shot, rects: built.rects, alphas: ALPHAS, shippedAlpha: built.alpha },
);

// ── CONTROL: is `backdrop-filter` doing anything at all in this browser? ─────
// Every "the blur is invisible" reading below is worthless if the answer is no,
// and a browser that silently ignored the filter would produce exactly the
// comfortable table. At the most transparent alpha the stripes must be far
// flatter with the blur on than with it off.
const mostOpen = results.painted[results.painted.length - 1];
if (!(mostOpen.stripeAmpNoBlur > mostOpen.stripeAmp * 3)) {
  console.log(
    `INVALID: backdrop-filter appears inert — at alpha ${mostOpen.alpha} the stripes read ${mostOpen.stripeAmp.toFixed(1)} blurred and ${mostOpen.stripeAmpNoBlur.toFixed(1)} unblurred.`,
  );
  await browser.close();
  process.exit(1);
}

const pad = (s, n) => String(s).padEnd(n);

console.log(`fill read off the live button: rgba(${built.rgb}, ${built.alpha})`);
console.log(
  `control: backdrop-filter is live — at alpha ${mostOpen.alpha} the stripes read ${mostOpen.stripeAmpNoBlur.toFixed(1)} unblurred and ${mostOpen.stripeAmp.toFixed(1)} blurred.\n`,
);

console.log('1. TRANSLUCENCY — how much backdrop the pane lets through\n');
console.log(pad('alpha', 8) + pad('backdrop response', 20) + pad('step', 9) + 'linear in (1 - alpha)?');

/**
 * Linearity is checked on the STEPS, not against the composition model. The
 * model uses the sheen's BOTTOM stop while the samples are taken mid-pane,
 * where the gradient has not reached it, so measurement sits a consistent ~1.5%
 * above the model at every row — a constant offset, which is exactly what a
 * linearity check must not mistake for a bend.
 */
const steps = results.painted.slice(1).map((r, i) => results.painted[i].response - r.response);
const meanStep = steps.reduce((a, b) => a + b, 0) / steps.length;
let bend = 0;
results.painted.forEach((r, i) => {
  const step = i === 0 ? null : results.painted[i - 1].response - r.response;
  if (step !== null) bend = Math.max(bend, Math.abs(step - meanStep));
  console.log(
    pad(r.alpha.toFixed(2), 8) +
      pad(r.response.toFixed(1), 20) +
      pad(step === null ? '—' : step.toFixed(1), 9) +
      (step === null ? '' : Math.abs(step - meanStep) <= 1.5 ? 'yes' : 'NO — bends here'),
  );
});
console.log(
  `\n  Every step is ${meanStep.toFixed(1)} +/- ${bend.toFixed(1)} out of 255 for each 0.10 of alpha, so the response is linear in (1 - alpha).`,
);
console.log(
  '  backdrop response = how far the painted pane moves between a white and a black backdrop, 0..255.',
);

console.log('\n\n2. BLUR VISIBILITY — how much of the blur you can actually see\n');
console.log(
  pad('alpha', 8) +
    pad('stripes: amp thru pane', 24) +
    pad('same, blur off', 17) +
    pad('blur delta, stripes', 21) +
    pad('photo (max/mean)', 19) +
    'flat page',
);
for (const r of results.painted) {
  console.log(
    pad(r.alpha.toFixed(2), 8) +
      pad(r.stripeAmp.toFixed(1), 24) +
      pad(r.stripeAmpNoBlur.toFixed(1), 17) +
      pad(r.blurStripes.toFixed(0), 21) +
      pad(`${r.blurPhotoMax.toFixed(0)} / ${r.blurPhotoMean.toFixed(1)}`, 19) +
      r.blurFlat.toFixed(0),
  );
}
console.log(
  '\n  amp thru pane = how much of a 4px black/white stripe pattern is still legible THROUGH the pane, 0..255.',
);
console.log(
  '  blur delta    = the largest per-pixel change switching the blur OFF makes. This is "can you see the blur".',
);
console.log(
  '  flat page     = the same delta over a flat surface. It is a negative control AND the case a real page is.',
);

const first = results.contrastRows[0];
console.log('\n\n3. LABEL CONTRAST vs the COMPOSITED pane');
console.log(`${first.rowsPerFill} rows per fill (18 presets x 2 modes x 5 Bloom surfaces)\n`);
console.log(
  pad('alpha', 8) +
    pad('primary rows < AA', 19) +
    pad('worst', 9) +
    pad('failing presets', 18) +
    pad('destructive < AA', 18) +
    'worst',
);
for (const r of results.contrastRows) {
  console.log(
    pad(r.alpha.toFixed(2), 8) +
      pad(`${r.primaryFailures} / ${r.rowsPerFill}`, 19) +
      pad(r.primaryWorst.toFixed(2), 9) +
      pad(new Set(r.primaryFailingCombos.map((c) => c.split('/')[0])).size, 18) +
      pad(`${r.destructiveFailures} / ${r.rowsPerFill}`, 18) +
      r.destructiveWorst.toFixed(2),
  );
}

// ── CONTROL: does the shipped row reproduce what the shipped gate pins? ──────
const shippedRow = results.contrastRows.find((r) => Math.abs(r.alpha - built.alpha) < 0.001);
if (!shippedRow || shippedRow.primaryFailures !== SHIPPED_PRIMARY_AA_FAILURES) {
  console.log(
    `\nINVALID: at the shipped ${built.alpha} this sweep counts ${shippedRow?.primaryFailures} primary rows below AA, but glass-colors.test.ts pins ${SHIPPED_PRIMARY_AA_FAILURES}.`,
  );
  await browser.close();
  process.exit(1);
}
console.log(
  `\ncontrol: the ${built.alpha} row reproduces the ${SHIPPED_PRIMARY_AA_FAILURES} failures glass-colors.test.ts pins, so the rest of the column measures the shipped material.`,
);

// ── The strip: the artefact a person actually judges ─────────────────────────
if (IMAGE_OUT) {
  await page.setViewport({ width: 1360, height: 480, deviceScaleFactor: 2 });
  await page.evaluate(
    async ({ alphas, rgb, stripes, photo, flat }) => {
      const source = document.querySelector('button.bloom-btn--glass');
      const harness = document.getElementById('glass-harness');
      harness.replaceChildren();
      // `width/height: max-content` rather than `inset: 0`, so the element
      // screenshot below crops to the strip instead of trailing a page of white.
      harness.style.cssText =
        'position:absolute;top:0;left:0;width:max-content;height:max-content;background:#fff;z-index:99999;padding:16px;font:600 12px system-ui,sans-serif;color:#111;';

      const header = document.createElement('div');
      header.style.cssText = 'display:flex;margin:0 0 6px 92px;';
      for (const alpha of alphas) {
        const h = document.createElement('div');
        h.style.cssText = 'width:168px;text-align:center;';
        h.textContent = `${alpha.toFixed(2)}${alpha === 0.85 ? '  (shipped)' : ''}`;
        header.appendChild(h);
      }
      harness.appendChild(header);

      for (const [label, background] of [
        ['flat page', flat],
        ['photograph', `url(${photo})`],
        ['hard stripes', stripes],
      ]) {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;margin-bottom:8px;';
        const name = document.createElement('div');
        name.style.cssText = 'width:92px;';
        name.textContent = label;
        row.appendChild(name);

        const band = document.createElement('div');
        band.style.cssText =
          'display:flex;height:108px;align-items:center;background-size:cover;background-position:center;';
        if (/^(url\(|repeating-|linear-)/.test(background)) band.style.backgroundImage = background;
        else band.style.background = background;
        for (const alpha of alphas) {
          const cell = document.createElement('div');
          cell.style.cssText = 'width:168px;display:flex;align-items:center;justify-content:center;';
          const clone = source.cloneNode(true);
          clone.style.backgroundColor = `rgba(${rgb}, ${alpha})`;
          cell.appendChild(clone);
          band.appendChild(cell);
        }
        row.appendChild(band);
        harness.appendChild(row);
      }

      // Wait for the photograph, or the strip captures an empty band.
      await new Promise((resolve) => {
        const probe = new Image();
        probe.onload = resolve;
        probe.onerror = resolve;
        probe.src = photo;
      });
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    },
    { alphas: ALPHAS, rgb: built.rgb, stripes: STRIPES, photo: PHOTO_URL, flat: built.flat },
  );
  await new Promise((r) => setTimeout(r, 1500));
  const strip = await page.$('#glass-harness');
  await strip.screenshot({ path: IMAGE_OUT });
  console.log(`\nwrote ${IMAGE_OUT}`);
}

await browser.close();

// ── Where the two curves cross, on the backdrop a page actually has ─────────
// Named against the PHOTOGRAPH rather than the stripes: a 4px black/white
// pattern is the most extreme texture that exists, so an alpha can move it
// visibly while doing nothing to any real content. The flat column is the
// answer for an ordinary page, and it is the same at every alpha.
const legible = results.painted.find((r) => r.blurPhotoMax >= LEGIBLE_BLUR);
console.log('\n');
if (legible) {
  const cost = results.contrastRows.find((c) => c.alpha === legible.alpha);
  console.log(
    `Over a photograph the blur first changes the picture by ${LEGIBLE_BLUR}/255 or more at alpha ${legible.alpha.toFixed(2)}, where ${cost.primaryFailures} of ${cost.rowsPerFill} primary rows and ${cost.destructiveFailures} destructive rows fall below AA.`,
  );
} else {
  console.log(
    `No alpha in this sweep moves a photograph by ${LEGIBLE_BLUR}/255 through the pane.`,
  );
}
const flatWorst = Math.max(...results.painted.map((r) => r.blurFlat));
console.log(
  `Over a FLAT page the blur changes at most ${flatWorst.toFixed(0)}/255 at ANY alpha in the sweep — there is nothing behind the pane to blur.`,
);
console.log('\nThe shipped alpha is unchanged; this only prices the alternatives.');
