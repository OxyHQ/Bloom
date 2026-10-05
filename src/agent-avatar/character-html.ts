/** Escape script delimiters in saved recipes; never interpolate appearance text as HTML. */
export const scriptJson = (value: unknown) =>
  JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');

export function characterHtml(runtimeUrl: string, props: unknown) {
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no"><style>html,body{margin:0;width:100%;height:100%;overflow:hidden;background:transparent}canvas{display:block;width:100%;height:100%;touch-action:none}</style></head><body><canvas id="avatar"></canvas><script type="module">
let controller, latest=${scriptJson(props)};
const report = type => window.ReactNativeWebView.postMessage(type);
window.updateCharacter = value => { latest=value; try { controller?.update(value); } catch { report('error'); } };
try {
 const {createAvatar}=await import(${scriptJson(runtimeUrl)});
 controller=await createAvatar(document.querySelector('canvas'),latest,{onReady:()=>report('ready'),onError:()=>report('error'),onCapabilities:value=>report('capabilities:'+JSON.stringify(value))});
 controller.update(latest);
 report('loaded');
} catch { report('error'); }
window.addEventListener('pagehide',()=>controller?.dispose(),{once:true});
</script></body></html>`;
}
