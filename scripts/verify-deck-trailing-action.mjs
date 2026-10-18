import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const browser = await chromium.launch();
try {
 for (const dir of ['ltr', 'rtl']) {
  const page = await browser.newPage({viewport:{width:1280,height:680}});
  await page.goto(`${process.env.STORYBOOK_URL ?? 'http://localhost:6007'}/iframe.html?id=blocks-app-shell--modular-deck&viewMode=story`);
  const action = page.getByTestId('modular-deck-panels-trailing-action');
  await action.waitFor({state:'attached'});
  await page.evaluate(dir => { document.documentElement.dir=dir;document.querySelectorAll('[dir]').forEach(e=>e.setAttribute('dir',dir)); }, dir);
  await page.waitForTimeout(200);
  assert.equal(await action.evaluate(e=>getComputedStyle(e).visibility),'hidden');
  await page.evaluate(dir => scrollTo(dir==='rtl'?-100000:100000,0),dir);
  await page.waitForTimeout(200);
  assert.equal(await action.evaluate(e=>getComputedStyle(e).visibility),'visible');
  const button=page.getByRole('button',{name:'Add column',exact:true});
  await button.focus();
  await page.waitForTimeout(180);
  assert.equal(await button.evaluate(e=>getComputedStyle(e).opacity),'1');
  const count=await page.locator('[data-bloom-panel-index]').count();
  await button.press('Enter');
  assert.equal(await page.locator('[data-bloom-panel-index]').count(),count+1);
  await page.waitForTimeout(700);
  const last = await page.locator('[data-bloom-panel-index]').last().boundingBox();
  assert.ok(last.x >= 0 && last.x + last.width <= 1281, `${dir} selection reveals added panel`);
  await page.setViewportSize({width:3200,height:680});
  await page.evaluate(()=>scrollTo(0,0));
  await page.waitForTimeout(300);
  const state=await page.evaluate(()=>({height:document.scrollingElement.scrollHeight,clientHeight:document.scrollingElement.clientHeight,width:document.scrollingElement.scrollWidth,client:document.scrollingElement.clientWidth,opacity:getComputedStyle(document.querySelector('[data-bloom-shell-nav]'),'::before').opacity}));
  assert.equal(state.width,state.client);
  assert.equal(state.height,state.clientHeight);
  assert.equal(state.opacity,'0',`${dir} navigation has no elevation without horizontal overflow`);
  assert.equal(await action.evaluate(e=>getComputedStyle(e).visibility),'visible');
  await page.close();
 }
 console.log('PASS trailing Deck action: logical end, keyboard creation, and no false navigation elevation without overflow');
} finally {await browser.close();}
