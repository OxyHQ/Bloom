import { scriptJson } from './character-html';

/** One document per burst of stills; its module, donors and GL pool survive between jobs. */
export function characterStillHtml(runtimeUrl: string) {
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no"><style>html,body{margin:0;width:100%;height:100%;overflow:hidden;background:transparent}canvas{position:absolute;left:0;top:0;display:block;pointer-events:none}</style></head><body><script type="module">
const report = value => window.ReactNativeWebView.postMessage(value);
let held, generation=0, closed=false;
const pending=new Set();
const release = value => { if(!value) return; if(value.controller && !value.released){value.released=true;value.controller.dispose();} value.canvas.remove(); };
try {
 const {createAvatar}=await import(${scriptJson(runtimeUrl)});
 window.renderStill=async job=>{
  const turn=++generation;
  for(const previous of pending) release(previous); pending.clear();
  const canvas=document.createElement('canvas');
  canvas.style.width=job.css+'px'; canvas.style.height=job.css+'px';
  document.body.append(canvas);
  let discarded=false;
  const work={canvas,controller:undefined}; pending.add(work);
  try {
   let painted, failed;
   const ready=new Promise((resolve,reject)=>{painted=resolve;failed=reject;});
   const created=createAvatar(canvas,{character:job.character,paused:true,portrait:true,reduced:true,previewPart:job.previewPart},{onReady:painted,onError:()=>failed(Error('Still failed')),onCapabilities:value=>report('capabilities:'+JSON.stringify({id:job.id,value}))}).then(value=>{
    work.controller=value;
    if(discarded || closed || turn!==generation) release(work);
    return value;
   });
   // onReady may fire before createAvatar returns its controller. Wait for both.
   await Promise.all([created,ready]);
   if(closed || turn!==generation) {release(work);return;}
   const uri=canvas.toDataURL('image/png');
   release(held); held=work;
   report('snapshot:'+JSON.stringify({id:job.id,uri}));
  } catch {
   discarded=true;
   release(work);
   if(!closed && turn===generation) report('snapshot:'+JSON.stringify({id:job.id,uri:null}));
  } finally {pending.delete(work);}
 };
 report('loaded');
} catch {report('error');}
window.addEventListener('pagehide',()=>{closed=true;generation++;release(held);held=undefined;for(const work of pending) release(work);pending.clear();},{once:true});
</script></body></html>`;
}
