/** Gallery navigation, field geometry and flat overlay paint in Chromium. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, expect } = require(process.env.BLOOM_PLAYWRIGHT_MODULE || 'playwright');
const base = process.argv[2] || 'http://localhost:6006';
const browser = await chromium.launch({ args: ['--no-sandbox'] });
try {
  for (const rtl of [false, true]) for (const reduce of [false, true]) {
    const page = await browser.newPage({ viewport: { width: 1100, height: 950 }, reducedMotion: reduce ? 'reduce' : 'no-preference' });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto(`${base}/iframe.html?id=base-carousel--footer-loop&viewMode=story`);
    const gallery = page.getByTestId('footer-gallery'); await gallery.waitFor({ timeout: 120000 });
    if (rtl) await page.evaluate(() => { document.documentElement.dir = 'rtl'; });
    const track = gallery.locator('[data-bloom-carousel-track]');
    const previous = gallery.getByRole('button', { name: 'Previous slide', exact: true });
    const next = gallery.getByRole('button', { name: 'Next slide', exact: true });
    await expect(previous).toBeEnabled();
    await previous.click(); await expect(page.getByTestId('loop-index')).toHaveText('2');
    await expect.poll(() => track.evaluate(el => Math.abs(el.scrollLeft))).toBeGreaterThan(900);
    await next.click(); await expect(page.getByTestId('loop-index')).toHaveText('0');
    await expect.poll(() => track.evaluate(el => Math.abs(el.scrollLeft))).toBeLessThan(2);
    await track.focus(); await page.keyboard.press(rtl ? 'ArrowRight' : 'ArrowLeft');
    await expect(page.getByTestId('loop-index')).toHaveText('2');
    await expect.poll(() => track.evaluate(el => Math.abs(el.scrollLeft))).toBeGreaterThan(900);
    await page.keyboard.press(rtl ? 'ArrowLeft' : 'ArrowRight'); await expect(page.getByTestId('loop-index')).toHaveText('0');
    const boxes = await Promise.all([track, previous, gallery.getByRole('button', { name: 'Photo 1', exact: true })].map(l => l.boundingBox()));
    assert.ok(boxes[1].y >= boxes[0].y + boxes[0].height); assert.ok(Math.abs(boxes[1].y - boxes[2].y) < 12);
    await page.goto(`${base}/iframe.html?id=base-carousel--footer-loop&viewMode=story&args=arrowsPlacement:overlay`);
    await gallery.waitFor();
    if (rtl) await page.evaluate(() => { document.documentElement.dir = 'rtl'; });
    await expect.poll(async () => {
      const geometry = await gallery.evaluate(el => {
        const track = el.querySelector('[data-bloom-carousel-track]').getBoundingClientRect();
        const arrows = el.querySelector('[data-testid="footer-gallery-overlay-arrows"]').getBoundingClientRect();
        return {left:arrows.left-track.left,right:track.right-arrows.right};
      });
      return Math.abs(geometry[rtl ? 'right' : 'left'] + 12) < 1 && Math.abs(geometry[rtl ? 'left' : 'right'] - 20) < 1;
    }).toBe(true);
    await page.goto(`${base}/iframe.html?id=base-radio--keyboard-rows&viewMode=story`);
    const radios = page.getByRole('radio'); await expect(radios).toHaveCount(3);
    if (rtl) await page.evaluate(() => { document.documentElement.dir = 'rtl'; });
    await radios.first().focus(); await page.keyboard.press(rtl ? 'ArrowLeft' : 'ArrowRight');
    await expect(radios.last()).toBeFocused(); await expect(radios.last()).toHaveAttribute('aria-checked','true');
    await page.keyboard.press('ArrowDown'); await expect(radios.first()).toBeFocused();
    await page.goto(`${base}/iframe.html?id=base-search--custom-affordances&viewMode=story`);
    const input = page.getByRole('search', { name: 'Custom search' }); await input.waitFor();
    if (rtl) await page.evaluate(() => { document.documentElement.dir = 'rtl'; });
    const clear = page.getByTestId('searchTextInputClearBtn');
    const geometry = await input.evaluate(el => {
      const clear = document.querySelector('[data-testid=searchTextInputClearBtn]');
      const icon = el.parentElement.querySelector('svg');
      const a=el.getBoundingClientRect(), b=clear.getBoundingClientRect();
      const field=el.closest('.bloom-demo-search-layout').getBoundingClientRect();
      const iconRect=icon?.getBoundingClientRect();
      return { input:{left:a.left,right:a.right},clear:{left:b.left,right:b.right,width:b.width}, icon:icon?.getBoundingClientRect().width, font:getComputedStyle(el).fontSize, height:field.height, leftIcon:iconRect.left-field.left, rightIcon:field.right-iconRect.right, leftClear:b.left-field.left,rightClear:field.right-b.right };
    });
    assert.equal(geometry.height,44); assert.equal(geometry[rtl ? 'rightIcon' : 'leftIcon'],16); assert.equal(geometry[rtl ? 'leftClear' : 'rightClear'],16);
    assert.equal(geometry.font,'16px'); assert.equal(geometry.clear.width,24); assert.equal(geometry.icon,24);
    assert.ok(rtl ? geometry.clear.right <= geometry.input.left : geometry.clear.left >= geometry.input.right);
    await page.getByRole('button',{name:'Toggle disabled'}).click(); await expect(clear).toBeDisabled(); await expect(input).toBeDisabled();
    await page.getByRole('button',{name:'Toggle disabled'}).click(); await clear.click(); await expect(input).toHaveValue('');
    assert.deepEqual(errors, []); console.log({ rtl, reduce, controls: true }); await page.close();
  }
  for (const mode of ['light', 'dark']) for (const placement of ['center', 'end', 'bottom']) {
    const page=await browser.newPage({viewport:{width:1100,height:900}});
    await page.goto(`${base}/iframe.html?id=base-dialog--flat-material&viewMode=story&args=placement:${placement}&globals=theme:${mode}`);
    await page.getByRole('button',{name:'Open flat panel'}).click();
    const dialog=page.getByRole('dialog',{name:'Material panel'}); await dialog.waitFor();
    await expect.poll(()=>dialog.evaluate(el=>getComputedStyle(el).backgroundColor)).toBe('rgb(243, 215, 182)');
    assert.equal(await dialog.locator(':scope > .bloom-surface-paint').count(),0);
    await expect.poll(async () => {
    const bounds = await dialog.boundingBox();
    const screenshot = await page.screenshot();
    const pixel = await page.evaluate(async ({base64,x,y}) => {
      const image = new Image(); image.src = `data:image/png;base64,${base64}`; await image.decode();
      const canvas = document.createElement('canvas'); canvas.width=image.width; canvas.height=image.height;
      const context=canvas.getContext('2d'); context.drawImage(image,0,0);
      return Array.from(context.getImageData(x,y,1,1).data);
    }, {base64: screenshot.toString('base64'), x: Math.round(bounds.x+bounds.width/2), y: Math.round(bounds.y+bounds.height-30)});
    return pixel;
    }).toEqual([243,215,182,255]);
    await page.keyboard.press('Escape'); await expect(dialog).toHaveCount(0);
    await page.goto(`${base}/iframe.html?id=base-dialog--flat-material&viewMode=story&args=placement:${placement};material:surface&globals=theme:${mode}`);
    await page.getByRole('button',{name:'Open flat panel'}).click();
    await page.getByRole('dialog',{name:'Material panel'}).waitFor();
    assert.ok(await page.getByRole('dialog',{name:'Material panel'}).locator('.bloom-surface-paint').count() > 0);
    console.log({mode,placement,flat:true,standardPaint:true}); await page.close();
  }
  const page=await browser.newPage();
  await page.goto(`${base}/iframe.html?id=base-popover--flat-material&viewMode=story`);
  await page.getByRole('button',{name:'Open flat popover'}).click();
  const popover=page.getByTestId('flat-popover'); await popover.waitFor();
  await expect(popover).not.toHaveClass(/bloom-floating-surface/);
  await expect.poll(()=>popover.evaluate(el=>getComputedStyle(el).backgroundColor)).toBe('rgb(243, 215, 182)');
  assert.equal(await popover.evaluate(el=>getComputedStyle(el,'::before').backdropFilter),'none');
  console.log({popover:true}); await page.close();
} finally { await browser.close(); }
