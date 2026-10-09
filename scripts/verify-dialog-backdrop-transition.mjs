import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, expect } = require(process.env.BLOOM_PLAYWRIGHT_MODULE || 'playwright');
const base = process.argv[2] || 'http://localhost:6006';
const browser = await chromium.launch({ args: ['--no-sandbox'] });
try {
  for (const width of [390,1440]) for (const placement of ['end', 'center', 'bottom']) for (const reduced of [false, true]) for (const rtl of [false,true]) {
    const page = await browser.newPage({ viewport:{width,height:900}, reducedMotion:reduced?'reduce':'no-preference' });
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto(`${base}/iframe.html?id=base-dialog--backdrop-transition${placement==='end'?'':`-${placement}`}&viewMode=story`);
    const trigger=page.getByRole('button',{name:'Open timed surface',exact:true});
    await expect(trigger).toBeVisible({timeout:120000});
    if(rtl)await page.evaluate(()=>document.documentElement.dir='rtl');
    const samples = rtl ? [1340, 740] : [100, 700];
    const pixels = async () => {
      const data = (await page.screenshot()).toString('base64');
      return page.evaluate(async ({data,samples}) => {
        const image=new Image();image.src=`data:image/png;base64,${data}`;await image.decode();
        const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
        const context=canvas.getContext('2d');context.drawImage(image,0,0);
        return samples.map(x=>[...context.getImageData(x,850,1,1).data].slice(0,3));
      },{data,samples});
    };
    const before=placement==='end'&&width===1440?await pixels():null;
    await page.evaluate(()=>{
      window.__surfaceFrames=[];const start=performance.now();
      const sample=()=>{const p=document.querySelector('[role="dialog"]');if(p)window.__surfaceFrames.push(getComputedStyle(p).transform);if(performance.now()-start<700)requestAnimationFrame(sample);};requestAnimationFrame(sample);
    });
    await trigger.focus();await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect.poll(()=>page.evaluate(()=>[...document.querySelectorAll('*')].filter(node=>getComputedStyle(node).backgroundImage.includes('69.75%')).length)).toBe(1);
    const read=()=>page.evaluate(()=>{
      const node=[...document.querySelectorAll('*')].find(node=>getComputedStyle(node).backgroundImage.includes('69.75%'));
      const css=getComputedStyle(node);
      const panel=document.querySelector('[role="dialog"]');const pc=getComputedStyle(panel);
      return {image:css.backgroundImage,opacity:Number(css.opacity),blur:[...document.querySelectorAll('*')].some(n=>getComputedStyle(n).backdropFilter.startsWith('blur(')),duration:pc.transitionDuration,animation:pc.animationDuration};
    });
    await expect.poll(async()=>(await read()).opacity).toBe(1);
    const state=await read();expect(state.image).toContain(rtl?'270deg':'90deg');expect(state.blur).toBe(false);
    if(placement==='end')expect(state.duration).toBe(reduced?'0s':'0.3s');
    if(placement==='center')expect(state.animation).toBe(reduced?'0s':'0.3s');
    if(!reduced)expect(await page.evaluate(()=>new Set(window.__surfaceFrames).size)).toBeGreaterThan(2);
    if(before){
      const after=await pixels();
      for(let i=0;i<samples.length;i++){
        const position=rtl?1440-samples[i]:samples[i];const alpha=.36*Math.min(1,position/(1440*.6975));
        for(let channel=0;channel<3;channel++)expect(Math.abs(after[i][channel]-before[i][channel]*(1-alpha))).toBeLessThan(4);
      }
    }
    const closingAt=Date.now();await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);
    if(!reduced)expect(Date.now()-closingAt).toBeGreaterThanOrEqual(250);
    await expect(trigger).toBeFocused();
    if(!reduced){
      await page.keyboard.press('Enter');await expect(page.getByRole('dialog')).toBeVisible();
      await page.emulateMedia({reducedMotion:'reduce'});
      if(placement==='end')await expect.poll(async()=>(await read()).duration).toBe('0s');
      await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);
      await expect(trigger).toBeFocused();
    }
    expect(errors).toEqual([]);
    console.log({width,placement,reduced,rtl,paint:true,focus:true});await page.close();
  }
} finally {await browser.close();}
