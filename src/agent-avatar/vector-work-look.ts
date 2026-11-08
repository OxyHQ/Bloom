import { renderVectorFrame } from './vector-frame';
import type { VectorData } from './vector-types';
/** Fit the automatic work direction once per character, to its visible work scene. */
export function vectorWorkLook(asset: VectorData): {yaw:number;pitch:number} {
  const frame=renderVectorFrame(asset,{action:'work',time:1});
  const measure=(role:string)=>{
    const path=frame.paths.find(p=>p.role===role);
    if(!path) return undefined;
    const n=(path.d.match(/-?\d+(?:\.\d+)?/g)??[]).map(Number);
    const xs=n.filter((_,i)=>i%2===0),ys=n.filter((_,i)=>i%2===1);
    if(!xs.length)return undefined;
    const left=Math.min(...xs),right=Math.max(...xs),top=Math.min(...ys),bottom=Math.max(...ys);
    return {x:(left+right)/2,y:(top+bottom)/2,width:right-left,height:bottom-top};
  };
  const body=measure('body'),panel=measure('panel');
  if(!body||!panel)return {yaw:.35,pitch:.35};
  return {yaw:Math.max(-.6,Math.min(.6,(panel.x-body.x)/Math.max(1,body.width/2))),pitch:Math.max(-.45,Math.min(.45,(panel.y-body.y)/Math.max(1,body.height/2)))};
}
