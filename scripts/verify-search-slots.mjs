/** Public field slots preserve input/clear behavior and field state paint. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, expect } = require(process.env.BLOOM_PLAYWRIGHT_MODULE || 'playwright');
const base = process.argv[2] || 'http://localhost:6006';
const browser = await chromium.launch({ args:['--no-sandbox'] });
try {
 for (const mode of ['light','dark']) for (const rtl of [false,true]) {
  const page=await browser.newPage({ viewport:{width:1000,height:850} });
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`${base}/iframe.html?id=base-search--styled-slots&viewMode=story&globals=theme:${mode}`);
  const input=page.getByRole('search',{name:'Styled search'});
  await input.waitFor({timeout:120000});
  if(rtl) await page.evaluate(()=>{document.documentElement.dir='rtl';});
  const field=page.locator('.bloom-demo-search-field');
  const chrome=page.locator('.bloom-demo-search-chrome');
  const container=page.locator('.bloom-demo-search-container');
  const state=()=>chrome.evaluate(el=>{const s=getComputedStyle(el);return{bg:s.backgroundColor,border:s.borderTopColor,borderWidth:s.borderTopWidth,radius:s.borderRadius}});
  await expect.poll(async()=> (await state()).bg).toBe(mode==='light'?'rgb(238, 240, 241)':'rgb(64, 64, 64)');
  assert.equal(await container.evaluate(el=>el.getBoundingClientRect().width),360);
  assert.equal(await field.evaluate(el=>el.getBoundingClientRect().height),44);
  assert.equal(await field.evaluate(el=>getComputedStyle(el).paddingLeft),'12px');
  assert.equal(await field.evaluate(el=>getComputedStyle(el).paddingRight),'12px');
  assert.equal((await state()).radius,'14px');
  assert.equal((await state()).borderWidth,'1px');
  assert.equal(await page.getByRole('search',{name:'Default search'}).evaluate(el=>el.closest('[data-bloom-field-box]').getBoundingClientRect().height),36);
  await input.fill('linen');
  await expect.poll(async()=> (await state()).border).not.toBe('rgb(171, 205, 239)');
  const clear=page.getByTestId('searchTextInputClearBtn');
  const bounds=await Promise.all([input.boundingBox(),clear.boundingBox(),container.boundingBox()]);
  assert.ok(rtl?bounds[1].x<bounds[0].x:bounds[1].x>bounds[0].x,'clear stays at trailing edge');
  await clear.click();await expect(input).toHaveValue('');
  await page.getByRole('button',{name:'Toggle disabled'}).click();
  await expect(input).toHaveAttribute('aria-disabled','true');
  await expect.poll(async()=> (await state()).bg).not.toBe(mode==='light'?'rgb(238, 240, 241)':'rgb(64, 64, 64)');
  await page.getByRole('button',{name:'Toggle disabled'}).click();
  await page.getByRole('button',{name:'Toggle invalid'}).click();
  await expect(input).toHaveAttribute('aria-invalid','true');
  await expect.poll(async()=> (await state()).border).not.toBe('rgb(171, 205, 239)');
  assert.deepEqual(errors,[]);console.log({mode,rtl,passed:true});await page.close();
 }
}finally{await browser.close();}
