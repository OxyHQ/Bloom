import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { filterColor, parseLook, type RGB } from '../../../../src/surface/filter-color';
import { SURFACE_LOOKS, materialFilter } from '../../../../src/surface/optics';
const require = createRequire(process.env.PLAYWRIGHT_PACKAGE_JSON!);
const { chromium } = require('playwright');
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 960, height: 960 }, deviceScaleFactor: 1 });
const colors: RGB[] = [[0,0,0],[255,255,255],[255,0,0],[0,255,0],[0,0,255],[255,255,0],[255,0,255],[0,255,255],[115,77,38]];
const results = [];
for (const mode of ['light','dark'] as const) {
 const filter = materialFilter(SURFACE_LOOKS[mode]);
 await page.setContent(`<style>body{margin:0;display:grid;grid-template-columns:repeat(3,320px)}.tile{width:320px;height:320px;position:relative;overflow:hidden}.paint{position:absolute;inset:0;backdrop-filter:${filter}}</style>${colors.map(c=>`<div class="tile" style="background:rgb(${c.join(',')})"><div class="paint"></div></div>`).join('')}`);
 await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 const png = await page.screenshot({ path: `docs/audits/issue-663/surface-backing/filter-${mode}.png` });
 const pixels = await page.evaluate(async (data:string) => {const img = new Image(); img.src = data; await img.decode(); const canvas = document.createElement('canvas'); canvas.width=img.width; canvas.height=img.height; const ctx=canvas.getContext('2d')!;ctx.drawImage(img,0,0); return Array.from({length:9},(_,i)=>Array.from(ctx.getImageData((i%3)*320+160,Math.floor(i/3)*320+160,1,1).data).slice(0,3));}, `data:image/png;base64,${png.toString('base64')}`);
 results.push({mode,filter, samples:colors.map((color,i)=>{const expected=filterColor(color.map(v=>v/255) as unknown as RGB,parseLook(filter)!).map(v=>v*255);const painted=pixels[i];return {color,expected,painted,maxChannelError:Math.max(...expected.map((v,c)=>Math.abs(v-painted[c])))};})});
}
for (const result of results) for (const sample of result.samples) {
 if (sample.maxChannelError > 1) throw new Error('Filter pixel mismatch exceeds 1/255');
}
writeFileSync('docs/audits/issue-663/surface-backing/pixels.json',JSON.stringify({browser:browser.version(),results},null,2)+'\n');
await browser.close();
