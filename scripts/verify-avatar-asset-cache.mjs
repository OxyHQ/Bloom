import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const puppeteer=createRequire(import.meta.url)(process.env.BLOOM_PUPPETEER_MODULE||'puppeteer-core');
const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH,headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
const errors=[];
try {
 const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.setRequestInterception(true);page.on('request',r=>r.url().endsWith('/avatar-cache-check.html')?r.respond({contentType:'text/html',body:'<!doctype html><canvas style="width:128px;height:128px"></canvas>'}):r.continue());
 await page.goto('http://localhost:6006/avatar-cache-check.html');
 const result=await page.evaluate(async()=>{
  const [{AuthoredAvatarEngine},{loadAuthoredAsset}]=await Promise.all([import('/runtime/avatar/authored-engine.ts'),import('/runtime/avatar/catalog.ts')]);
  let release;
  const waiting=new Promise(r=>release=r);
  const engine=new AuthoredAvatarEngine(document.querySelector('canvas'),{count:2,size:64,resolveAsset:async(key,detail)=>{
    if(key==='delayed')await waiting;
    return {source:await loadAuthoredAsset('lime_frog',detail),samplers:null,eyeProfiles:{}};
  }});
  await engine.loaded;engine.setPaused(true);
  // A multi-avatar request keeps its first ready asset alive while another
  // asset is still loading, even if later edits trigger cache eviction.
  const concurrent=engine.setPresets(['waiting-ready','delayed']);
  for(let i=0;i<12;i++)await engine.setPreset(0,`edited:${i}`);
  const during=engine.stats();release();await concurrent;
  if(engine.stats().states[0].preset!=='edited:11'||engine.stats().states[1].preset!=='delayed')throw Error('Async edit overwrote a newer avatar');
  for(let i=12;i<22;i++)await engine.setPreset(0,`edited:${i}`);
  const after=engine.stats();
  engine.setGaze(0,0,1);const gaze=engine.stats().states[0].gaze.target;
  await engine.setSize(320);const resized=engine.stats();
  engine.dispose();return {during:during.cachedAssets,after:after.cachedAssets,resized:resized.cachedAssets,gaze,contexts:engine.stats().contexts};
 });
 assert(result.during<=9);assert(result.after<=7);assert(result.resized<=10);assert.deepEqual(result.gaze,[0,1]);assert.equal(result.contexts,0);assert.deepEqual(errors,[]);console.log(JSON.stringify(result));
}finally{await browser.close();}
