/** Real original-engine gate through runtime: one object, authored Stop outro,
 * queued reactions, visible pixels and no repeated geometry preparation.
 * BLOOM_PLAYWRIGHT_MODULE may point to an installed Playwright package.
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.BLOOM_PLAYWRIGHT_MODULE || 'playwright');
const base = process.argv[2] || 'http://localhost:6006';
const custom = JSON.parse(execFileSync('bun', ['-e', `
import { FOLD_CONFIG } from './src/agent-avatar/model';
import { legacyRecipe } from './src/agent-avatar/legacy-recipe';
const config={...FOLD_CONFIG,foldShape:'crane'};
console.log(JSON.stringify({config,legacy:legacyRecipe(config)}));
`], {cwd:new URL('..',import.meta.url),encoding:'utf8'}));
assert.ok(custom.legacy?.points, 'Use a migrated contour');
const browser = await chromium.launch({args:['--no-sandbox']});
try {
  for (const recipe of [
    {config:{motion:35,lookAt:'wander',character:{preset:'blue_beret'}}},
    custom,
  ]) {
    const page = await browser.newPage();
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    page.on('console',message=>{
      if(/GL_INVALID|GL ERROR|GLES shader compilation failed/i.test(message.text())) errors.push(message.text());
    });
    await page.route('**/__bloom_continuity.html',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><body>'}));
    await page.goto(`${base}/__bloom_continuity.html`);
    await page.evaluate(async recipe=>{
      window.gate={errors:[],events:[],characters:[],deleted:0,paints:0,hashes:[],minPainted:Infinity};
      const instantiate=WebAssembly.instantiate;
      WebAssembly.instantiate=async function(...args){
        const result=await instantiate.apply(WebAssembly,args);
        if(result.instance?.exports.Vd instanceof WebAssembly.Memory) gate.memory=result.instance.exports.Vd;
        return result;
      };
      gate.engine=await import('/bloom-character/legacy-engine.mjs');
      gate.lease=recipe.legacy ? await gate.engine.acquireLegacyEngine(recipe.legacy.points) : null;
      gate.module=gate.lease?.module || await gate.engine.getCharacterEngine();
      const Native=gate.module.Character;
      const identity=character=>{
        const view=new DataView(gate.memory.buffer);
        return {ptr:character.$$.ptr,impl:view.getUint32(character.$$.ptr,true)};
      };
      const event=(kind,data={})=>gate.events.push({kind,at:performance.now(),...data});
      const proto=Native.prototype;
      for(const name of ['delete','applyActivity','playReaction']) {
        const method=proto[name];
        proto[name]=function(...args){
          const before=identity(this),result=method.apply(this,args);
          if(name==='delete')gate.deleted++;
          event(name,{...before,result,command:args[0]?.command,reaction:name==='playReaction'?args[0]:undefined});
          return result;
        };
      }
      gate.module.Character=function(...args){
        const character=new Native(...args);
        gate.characters.push(character);
        event('construct',identity(character));
        return character;
      };
      gate.module.Character.prototype=proto;
      const mode=gate.module.controllerMode;
      gate.module.controllerMode=(character,enabled)=>{
        const before=gate.module.controllerState(character);
        const result=mode(character,enabled);
        if(enabled!==undefined)event('mode',{...identity(character),enabled,before:{phase:before.phase,activity:before.activity,settled:before.settled}});
        return result;
      };
      gate.canvas=document.createElement('canvas');
      gate.canvas.style.cssText='width:96px;height:96px';
      document.body.appendChild(gate.canvas);
      gate.props={...recipe,interactive:true,workingKey:0,reactionKey:0,workingCycles:1,paused:false};
      gate.runtime=await import('/bloom-character/runtime.mjs');
      gate.control=await gate.runtime.createAvatar(gate.canvas,gate.props,{
        onReady:()=>gate.ready=true,
        onError:error=>gate.errors.push(String(error)),
        onPaint:()=>{
          gate.paints++;
          if(gate.paints%3)return;
          const bytes=gate.canvas.getContext('2d').getImageData(0,0,gate.canvas.width,gate.canvas.height).data;
          let painted=0,hash=0;
          for(let i=0;i<bytes.length;i++){hash=(Math.imul(hash,31)+bytes[i])|0;if(i%4===3&&bytes[i]>24)painted++;}
          gate.minPainted=Math.min(gate.minPainted,painted);gate.hashes.push(hash);
        },
      });
      gate.accepted=()=>gate.events.filter(event=>event.kind==='playReaction'&&event.result===0).length;
      gate.update=patch=>{gate.props={...gate.props,...patch};gate.control.update(gate.props);};
    },recipe);
    const wait=async (predicate,timeout=45000)=>{
      try {await page.waitForFunction(predicate,{}, {timeout});}
      catch(error){console.error(JSON.stringify(await page.evaluate(()=>({errors:gate.errors,diagnostics:gate.control.diagnostics(),events:gate.events,state:gate.module.controllerState(gate.characters[0]),nativeStats:gate.characters[0].stats()})),(_,value)=>typeof value==='bigint'?value.toString():value,2));throw error;}
      assert.deepEqual(await page.evaluate(()=>gate.errors),[]);
    };
    await wait(()=>gate.ready || gate.errors.length);
    const initial=await page.evaluate(()=>({ptr:gate.characters[0].$$.ptr,preparation:gate.characters[0].preparationStats().completed.toString(),meshBuilds:gate.characters[0].stats().meshBuilds,renderables:gate.characters[0].stats().renderables}));
    await page.evaluate(()=>gate.update({reactionKey:1}));
    await wait(()=>gate.accepted()>=1);
    await page.evaluate(()=>gate.update({workingKey:1}));
    await wait(()=>gate.control.diagnostics().activityMode);
    // Request React while the same native character is in Work. Runtime must
    // deliver Stop, finish its authored 3D outro, and queue a Busy reaction.
    await page.evaluate(()=>gate.update({reactionKey:2}));
    await wait(()=>!gate.control.diagnostics().activityMode && gate.accepted()>=2);
    // A second Work episode must also return via its original automatic Stop.
    await page.evaluate(()=>gate.update({workingKey:2}));
    await wait(()=>gate.control.diagnostics().activityMode);
    await wait(()=>!gate.control.diagnostics().activityMode);
    await page.evaluate(()=>gate.update({reactionKey:3}));
    await wait(()=>gate.accepted()>=3);
    await page.waitForTimeout(350);
    const result=await page.evaluate(()=>({
      constructions:gate.characters.length,deleted:gate.deleted,
      ptr:gate.characters[0].$$.ptr,
      impl:new DataView(gate.memory.buffer).getUint32(gate.characters[0].$$.ptr,true),
      initialImpl:gate.events.find(e=>e.kind==='construct').impl,
      preparation:gate.characters[0].preparationStats().completed.toString(),
      meshBuilds:gate.characters[0].stats().meshBuilds,
      renderables:gate.characters[0].stats().renderables,
      paints:gate.paints,hashes:new Set(gate.hashes).size,minPainted:gate.minPainted,
      exits:gate.events.filter(e=>e.kind==='mode'&&e.enabled===false).slice(1),
      stops:gate.events.filter(e=>e.kind==='applyActivity'&&e.command===2),
      stats:gate.runtime.runtimeStats(),errors:gate.errors,
    }));
    assert.equal(result.constructions,1);assert.equal(result.deleted,0);
    assert.equal(result.ptr,initial.ptr);assert.equal(result.impl,result.initialImpl);
    assert.equal(result.preparation,initial.preparation);assert.equal(result.meshBuilds,initial.meshBuilds);
    assert.equal(result.renderables,initial.renderables);
    assert.ok(result.paints>10&&result.hashes>4&&result.minPainted>100,'Retain painted moving 3D pixels through every switch');
    assert.equal(result.exits.length,2);assert.ok(result.exits.every(e=>e.before.settled),'Wait for exact original Stop outro');
    assert.equal(result.stops.length,2);assert.ok(result.stops.every(e=>e.result===0));
    assert.deepEqual(result.errors,[]);assert.deepEqual(errors,[]);
    await page.evaluate(()=>{gate.control.dispose();gate.lease?.release();});
    await wait(()=>gate.runtime.runtimeStats().instances===0&&gate.engine.legacyEngineStats().characters===0);
    assert.equal(await page.evaluate(()=>gate.runtime.runtimeStats().surface.contexts),0);
    console.log(JSON.stringify({contour:!!recipe.legacy,...result}));
    await page.close();
  }
  console.log('PASS: repeated React/Work retain native identity, geometry, authored outro and painted pixels.');
} finally {await browser.close();}
