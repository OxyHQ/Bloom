/** Real editor: body-only choices, current paint, and edits preserve selected parts. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
const puppeteer = createRequire(import.meta.url)(process.env.BLOOM_PUPPETEER_MODULE || 'puppeteer-core');
const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH, headless: true, args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
const report = { shapes: [], errors: [] };
const output = '.local/avatar-shape-selector';
await mkdir(output, { recursive: true });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1100, height: 1200 });
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  page.on('pageerror', e => report.errors.push(e.message));
  page.on('console', m => { if (/GL_INVALID|GL_OUT_OF_MEMORY/.test(m.text())) report.errors.push(m.text()); });
  await page.goto('http://localhost:6006/iframe.html?id=application-agent-avatar-characters--editor&viewMode=story');
  await page.waitForSelector('[role="listbox"][aria-label="Avatar shape"]', { timeout: 90000 });
  await page.evaluate(() => {
    window.shapeList = () => document.querySelector('[role="listbox"][aria-label="Avatar shape"]');
    window.selectorDiag = () => globalThis[Symbol.for('bloom.character.runtimes')].get(new URL('/bloom-character/runtime.mjs',document.baseURI).href).diagnostics();
    window.selectedPixels = () => {
      const c = shapeList().querySelector('[aria-selected="true"] canvas');
      if (!c?.width || !c.height) return { painted: 0, blue: 0 };
      const data=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
      let painted=0,blue=0;
      for(let i=0;i<data.length;i+=4) if(data[i+3]>40) {painted++;if(data[i+2]>data[i]*1.3&&data[i+2]>data[i+1]*1.1)blue++;}
      return {painted,blue};
    };
  });
  const settle = () => page.waitForFunction(async () => {
    const pools=await selectorDiag();
    return pools.length && pools.every(p=>p.pending===0) && selectedPixels().painted>40;
  }, {timeout:90000});
  await settle();
  await page.click('[aria-label="Blue avatar"]');
  await page.waitForFunction(()=>selectedPixels().blue>selectedPixels().painted*.75 && selectedPixels().painted>40,{timeout:90000});
  const expected = ['clippo','todd','circle','rounded_triangle','capsule','rounded_head_two_ears','six_lobed_flower','heart','four_lobed_butterfly','circle_two_ears','twelve_scalloped_rosette','rounded_cube','rounded_diamond','slender','pocket','petal','star','cloud','shield','pebble','squircle'];
  for (const [index, shape] of expected.entries()) {
    await page.focus('[role="listbox"][aria-label="Avatar shape"]');
    await page.keyboard.press(index === 0 ? 'Home' : 'ArrowRight');
    await page.waitForFunction(shape=>JSON.parse(document.querySelector('[data-testid="universal-avatar-config"]').textContent).selections?.shape===shape,{},shape);
    await settle();
    const result=await page.evaluate(async()=>({
      pools:await selectorDiag(),pixels:selectedPixels(),
      saved:JSON.parse(document.querySelector('[data-testid="universal-avatar-config"]').textContent),
      images:shapeList().querySelectorAll('img').length,
    }));
    assert.equal(result.images,0,'No fixed-color shape PNGs');
    assert(result.pixels.blue>result.pixels.painted*.75,`${shape}: selected color reaches the body`);
    for(const pool of result.pools.filter(p=>p.cell===64)) for(const state of pool.stats.states.filter(s=>pool.activeIndices.includes(s.index))) {
      const recipe=JSON.parse(state.preset.slice('catalog:'.length));
      if (recipe.previewPart === 'eyes') {
        assert(state.renderedParts.length>0);
        assert(!state.renderedParts.some(p=>p.id===0),'Eye preview never submits body geometry');
        continue;
      }
      assert.equal(recipe.eyes,'none');assert.equal(recipe.eyewear,'none');assert.equal(recipe.accessory,'none');
    }
    assert.equal(result.saved.preset,undefined,'Custom avatar has no template dependency');
    assert.notEqual(result.saved.selections.eyes,'none','Choosing a shape keeps the main face');
    assert.notEqual(result.saved.selections.accessory,'none','Choosing a shape keeps the main accessory');
    assert(await page.$eval('[data-testid="agent-avatar-color-selector"]',e=>e.getBoundingClientRect().height>=38),'Palette remains visible');
    report.shapes.push(shape);
    if(shape==='clippo'||shape==='rounded_cube') await page.screenshot({path:`${output}/${shape}.png`});
  }
  assert.deepEqual(report.errors,[]);
  console.log(JSON.stringify(report));
} finally {
  await writeFile(`${output}/report.json`,JSON.stringify(report,null,2));
  await browser.close();
}
