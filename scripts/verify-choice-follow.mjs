/** Composite labels and follow recipes retain real pointer/keyboard semantics. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium,expect}=require(process.env.BLOOM_PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({args:['--no-sandbox']});
const base=process.argv[2]||'http://localhost:6006';
try{
 for(const mode of ['light','dark']) for(const rtl of [false,true]) for(const reducedMotion of ['no-preference','reduce']){
  const page=await browser.newPage({viewport:{width:1000,height:850},reducedMotion});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`${base}/iframe.html?id=base-checkbox--label-content&viewMode=story&globals=theme:${mode}`);
  const checkbox=page.getByRole('checkbox',{name:'Four stars and up',exact:true});
  await checkbox.waitFor({timeout:120000});
  if(rtl) await page.evaluate(()=>document.documentElement.dir='rtl');
  await expect(checkbox).toHaveAttribute('aria-checked','false');
  const rect=await checkbox.boundingBox();
  await page.mouse.click(rect.x+rect.width-4,rect.y+rect.height/2);
  await expect(checkbox).toHaveAttribute('aria-checked','true');
  await checkbox.focus();await page.keyboard.press('Space');
  await expect(checkbox).toHaveAttribute('aria-checked','false');
  assert.equal(await page.getByRole('checkbox').count(),2);
  await expect(page.getByRole('checkbox',{name:'Unavailable rating'})).toHaveAttribute('aria-disabled','true');
  await expect(page.getByRole('radio',{name:'Newest first'})).toHaveAttribute('aria-checked','true');
  const radio=page.getByRole('radio',{name:'Most helpful'});await radio.focus();await page.keyboard.press('Space');
  await expect(radio).toHaveAttribute('aria-checked','true');
  await expect(page.getByRole('radio',{name:'Newest first'})).toHaveAttribute('aria-checked','false');
  await page.goto(`${base}/iframe.html?id=controls-follow-button--styled&viewMode=story&globals=theme:${mode}`);
  const follow=page.getByTestId('styled-follow');await follow.waitFor({timeout:120000});
  if(rtl) await page.evaluate(()=>document.documentElement.dir='rtl');
  const style=()=>follow.evaluate(el=>{const s=getComputedStyle(el);return{height:el.getBoundingClientRect().height,width:el.getBoundingClientRect().width,bg:s.backgroundColor,border:s.borderTopWidth,image:s.backgroundImage}});
  await expect.poll(async()=>(await style()).height).toBe(40);
  await expect.poll(async()=>(await style()).bg).toBe(mode==='light'?'rgb(238, 240, 241)':'rgb(64, 64, 64)');
  assert.equal((await style()).image,'none');assert.equal((await style()).border,'1px');
  const labels=follow.locator('.bloom-demo-follow-label');await expect(labels).toHaveCount(4);
  for(const label of await labels.all()){
   assert.deepEqual(await label.evaluate(el=>{const s=getComputedStyle(el);return[s.color,s.fontSize,s.lineHeight,s.fontWeight]}),[mode==='light'?'rgb(18, 52, 86)':'rgb(171, 205, 239)','16px','20px','600']);
  }
  assert.equal(await page.getByTestId('default-follow').evaluate(el=>el.getBoundingClientRect().height),32);
  const before=await style();const identity=await labels.first().elementHandle();
  await follow.focus();await page.keyboard.press('Space');await expect(follow).toHaveAttribute('aria-pressed','true');
  await expect.poll(async()=>page.getByTestId('styled-follow-following-label').evaluate(el=>getComputedStyle(el).opacity)).toBe('1');
  assert.equal((await style()).width,before.width);
  await page.getByRole('button',{name:'Toggle loading'}).click();await expect(follow).toHaveAttribute('aria-busy','true');
  assert.equal(await labels.first().evaluate((el,before)=>el===before,identity),true);
  assert.equal((await style()).width,before.width);
  await page.getByRole('button',{name:'Toggle loading'}).click();
  await page.getByRole('button',{name:'Toggle disabled'}).click();await expect(follow).toBeDisabled();
  assert.deepEqual(errors,[]);console.log({mode,rtl,reducedMotion,passed:true});await page.close();
 }
}finally{await browser.close();}
