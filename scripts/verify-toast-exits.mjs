// Browser regression: exit must retain each row's stack offset and width.
// Start Storybook, then set PUPPETEER_MODULE and CHROME_PATH when not installed locally.
import { createRequire } from 'node:module';

import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);

const puppeteer = require(process.env.PUPPETEER_MODULE || 'puppeteer-core');

const baseUrl = process.env.STORYBOOK_URL || 'http://localhost:6012';
const delay=ms=>new Promise(r=>setTimeout(r,ms));

(async()=>{const b=await puppeteer.launch({executablePath:process.env.CHROME_PATH || '/usr/bin/chromium',headless:true,args:['--no-sandbox']});
try{const p=await b.newPage();
await p.setViewport({width:1000,height:800});
p.on('pageerror',e=>console.log('pageerror',e.message));
for(const story of ['close-button','sequential-unstacked','sequential-stacked']){await p.goto(baseUrl+'/iframe.html?id=base-toast--'+story+'&viewMode=story',{waitUntil:'networkidle0'});
await p.mouse.move(10,10);
const click=label=>p.evaluate(label=>Array.from(document.querySelectorAll('button,[role=button]')).find(e=>e.textContent.trim()===label).click(),label);
if(story==='close-button'){await click('Close button');
await delay(1000);
}else {await click('One 3s');
await delay(500);
await click('Two');
await delay(1000);
}await p.evaluate(()=>{window.exitFrames=[];
window.exitDone=new Promise(resolve=>{let start=performance.now();
function f(t){const nodes=Array.from(document.querySelectorAll('*')).filter(e=>e.children.length===0&&/^(Dismiss me with the close button|Row one|Row two)$/.test(e.textContent));
window.exitFrames.push({t:Math.round(t-start),rows:nodes.map(e=>{let n=e,opacity=1;
while(n){opacity*=Number(getComputedStyle(n).opacity);
n=n.parentElement;
}const r=e.getBoundingClientRect();
return{text:e.textContent,x:r.x,y:r.y,w:r.width,h:r.height,opacity}})});
if(t-start<5500)requestAnimationFrame(f);
else resolve(window.exitFrames)}requestAnimationFrame(f)})});
if(story==='close-button')await p.click('[aria-label=Close]');
const frames=await p.evaluate(()=>window.exitDone);
const title=story==='close-button'?'Dismiss me with the close button':'Row one';

const baseline=frames.flatMap(f=>f.rows).find(r=>r.text===title&&r.opacity===1);

const exiting=frames.flatMap(f=>f.rows).filter(r=>r.text===title&&r.opacity>0&&r.opacity<0.99);

assert(baseline&&exiting.length>2, story+': missing exit frames');

for(const row of exiting){assert(Math.abs(row.y-baseline.y)<=13,story+': exit jumped out of its slot');
assert(Math.abs(row.w-baseline.w)<1,story+': exit lost stack width');
}
assert(!frames.at(-1).rows.some(r=>r.text===title),story+': dismissed row remains');

console.log(story+': exit position, width and completion passed');
}} finally{await b.close()}})().catch(e=>{console.error(e);
process.exit(1)});

