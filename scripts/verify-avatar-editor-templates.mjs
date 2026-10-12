/** Creation templates are copied; edits produce independent configurations. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
const puppeteer=createRequire(import.meta.url)(process.env.BLOOM_PUPPETEER_MODULE||'puppeteer-core');
const output='.local/avatar-editor-templates';await mkdir(output,{recursive:true});
const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH,headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
const report={templates:[],errors:[]};
try{
 const page=await browser.newPage();await page.setViewport({width:1100,height:1200});await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto('http://localhost:6006/iframe.html?id=application-agent-avatar-characters--editor&viewMode=story');await page.waitForSelector('[data-testid="universal-avatar-config"]',{timeout:90000});
 const saved=()=>page.$eval('[data-testid="universal-avatar-config"]',e=>JSON.parse(e.textContent));
 const settle=()=>page.waitForFunction(async()=>{const runtime=globalThis[Symbol.for('bloom.character.runtimes')]?.get(new URL('/bloom-character/runtime.mjs',document.baseURI).href);if(!runtime)return false;const pools=await runtime.diagnostics();return pools.length>0&&pools.every(p=>!p.pending&&p.stats.frames>1)},{timeout:90000});
 const choose=async(title)=>{await page.click('[aria-label="Avatar style"]');await page.waitForSelector('[role="radio"]');for(const radio of await page.$$('[role="radio"]'))if(await radio.evaluate((el,title)=>el.getAttribute('aria-label')===title||el.textContent.trim()===title,title)){await radio.click();return}throw Error('Missing template '+title)};
 const templates=[
 ['Todd',{preset:'lime_frog',selections:{eyes:'clippo',eyewear:'none',accessory:'bow',color:'coral'}}],
 ['Alfred',{preset:'alfred',selections:{eyes:'cyclops',eyewear:'monocle',accessory:'bow',color:'cyan'}}],
 ['Iris',{preset:'coral_monocle',selections:{eyes:'clippo',eyewear:'round_sunglasses',accessory:'none'}}],
 ['Felipe',{selections:{eyes:'sleepy_lids',eyewear:'none',accessory:'felipe_beret',shape:'six_lobed_flower',color:'blue'},bodyColor:'#ff9547'}],
 ];
 await settle();
 for(const [title,config]of templates){
  await choose(title);assert.deepEqual(await saved(),config);await settle();
  await page.screenshot({path:`${output}/${title.toLowerCase()}.png`});
  await page.click('[aria-label="Blue avatar"]');const edited=await saved();assert.equal(edited.preset,undefined);assert(edited.selections.shape);assert.equal(edited.selections.eyes,config.selections.eyes);assert.equal(edited.selections.accessory,config.selections.accessory);assert.equal(edited.selections.color,'blue');
  report.templates.push(title);
 }
 await page.click('[aria-label="Custom avatar color"]');await page.waitForSelector('input[aria-label="Hex color"]');
 const hex=await page.$('input[aria-label="Hex color"]');await hex.click({clickCount:3});await hex.type('#000000');await hex.press('Enter');
 await page.waitForFunction(()=>JSON.parse(document.querySelector('[data-testid="universal-avatar-config"]').textContent).bodyColor==='#000000');
 assert.equal((await saved()).preset,undefined);await page.keyboard.press('Escape');await settle();
 await page.screenshot({path:`${output}/black-engine-bound.png`});report.unrestrictedSavedBlack=true;
 assert.deepEqual(report.errors,[]);console.log(JSON.stringify(report));
}finally{await writeFile(`${output}/report.json`,JSON.stringify(report,null,2));await browser.close()}
