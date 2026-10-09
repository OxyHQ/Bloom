/** Restore keyboard focus only after the opener's modal boundary becomes available. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium,expect}=require(process.env.BLOOM_PLAYWRIGHT_MODULE||'playwright');
const base=process.argv[2]||'http://localhost:6006';
const browser=await chromium.launch({args:['--no-sandbox']});
try{
 for(const placement of ['center','end','bottom'])for(const reducedMotion of ['reduce','no-preference']){
  const page=await browser.newPage({viewport:{width:1100,height:900},reducedMotion});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`${base}/iframe.html?id=base-dialog--focus-restoration&viewMode=story&args=placement:${placement}`);
  const opener=page.getByRole('button',{name:'Open focus dialog'});
  await opener.waitFor({timeout:120000});
  for(const close of ['escape','button']){
   await opener.focus();await page.keyboard.press('Enter');
   const dialog=page.getByRole('dialog',{name:'Focus restoration'});
   await expect(dialog).toBeVisible();
   await expect(page.getByTestId('focus-boundary')).toHaveAttribute('inert','');
   await expect.poll(()=>dialog.evaluate(el=>el.contains(document.activeElement))).toBe(true);
   if(close==='escape')await page.keyboard.press('Escape');else await page.getByRole('button',{name:'Finish'}).click();
   await expect(dialog).toHaveCount(0);
   await expect(page.getByTestId('focus-boundary')).not.toHaveAttribute('inert','');
   await expect(opener).toBeFocused();
  }
  assert.deepEqual(errors,[]);console.log({placement,reducedMotion,passed:true});await page.close();
 }
}finally{await browser.close();}
