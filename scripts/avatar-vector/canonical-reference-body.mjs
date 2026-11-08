/** Undo the baked planar viewing basis offline; animation sees neutral geometry. */
export function referenceBodyCanonicalizer(square) {
  const edges = square.map((a,i)=> {const b=square[(i+1)%square.length];return [b[0]-a[0],b[1]-a[1]]});
  const dominant = target => {
    let x=0,y=0;
    for(let [dx,dy] of edges){let angle=(Math.atan2(dy,dx)*180/Math.PI+180)%180;if(Math.abs(angle-target)>2)continue;if(dy<0){dx=-dx;dy=-dy;}x+=dx;y+=dy;}
    const length=Math.hypot(x,y);return [x/length,y/length];
  };
  const x=dominant(15),y=dominant(115),det=x[0]*y[1]-x[1]*y[0];
  const unproject=([px,py])=>[(y[1]*px-y[0]*py)/det,(-x[1]*px+x[0]*py)/det];
  const projected=square.map(unproject);
  const width=Math.max(...projected.map(p=>p[0]))-Math.min(...projected.map(p=>p[0]));
  const height=Math.max(...projected.map(p=>p[1]))-Math.min(...projected.map(p=>p[1]));
  const common=new Set(['star','hex','square','sparkle','flower','clover','cloud']);
  const turns={heart:-25.5,tablet:-15,wedge:-25.5,teardrop:-25.5,pebble:-25.5};
  return (name, points) => {
    if(name==='blob')return points;
    const min=axis=>Math.min(...points.map(p=>p[axis]));const max=axis=>Math.max(...points.map(p=>p[axis]));
    const center=[(min(0)+max(0))/2,(min(1)+max(1))/2];
    const angle=(turns[name]??0)*Math.PI/180;
    let result=points.map(([px,py])=>{
      const p=[px-center[0],py-center[1]];
      if(common.has(name)){const q=unproject(p);return [q[0]*height/width,q[1]];}
      return [p[0]*Math.cos(angle)-p[1]*Math.sin(angle),p[0]*Math.sin(angle)+p[1]*Math.cos(angle)];
    });
    // Recover each petaled form's own two-axis frame from opposite lobe peaks.
    // A least-squares affine fit removes residual skew without averaging contours.
    if (['star', 'sparkle', 'flower'].includes(name)) {
      const original=points.map(p=>[p[0]-center[0],p[1]-center[1]]);
      const radii=original.map(p=>Math.hypot(...p));
      const count=name==='sparkle'?4:6;
      const peaks=original.map((point,index)=>({point,index,radius:radii[index],angle:Math.atan2(point[1],point[0])}))
        .filter(({index:i})=>radii[i]>radii[(i+radii.length-1)%radii.length]&&radii[i]>radii[(i+1)%radii.length])
        .sort((a,b)=>b.radius-a.radius).slice(0,count).sort((a,b)=>a.angle-b.angle);
      const top=peaks.reduce((best,p,i)=>Math.abs(p.angle-Math.PI/2)<Math.abs(peaks[best].angle-Math.PI/2)?i:best,0);
      let xx=0,xy=0,yx=0,yy=0;
      peaks.forEach(({point},i)=>{const a=Math.PI/2+(i-top)*2*Math.PI/count;const x=Math.cos(a),y=Math.sin(a);xx+=point[0]*x*2/count;xy+=point[0]*y*2/count;yx+=point[1]*x*2/count;yy+=point[1]*y*2/count;});
      const determinant=xx*yy-xy*yx;
      result=original.map(([px,py])=>[(yy*px-xy*py)/determinant,(-yx*px+xx*py)/determinant]);
      const upper=result[peaks[top].index],lower=result[peaks[(top+count/2)%count].index];
      const turn=Math.PI/2-Math.atan2(upper[1]-lower[1],upper[0]-lower[0]);
      result=result.map(([px,py])=>[px*Math.cos(turn)-py*Math.sin(turn),px*Math.sin(turn)+py*Math.cos(turn)]);
    }
    // One uniform normalization preserves the body's occupied area and identity.
    const area=ps=>Math.abs(ps.reduce((sum,a,i)=>{const b=ps[(i+1)%ps.length];return sum+a[0]*b[1]-b[0]*a[1]},0));
    const scale=Math.sqrt(area(points)/area(result));result=result.map(p=>p.map(v=>v*scale));
    const cx=(Math.min(...result.map(p=>p[0]))+Math.max(...result.map(p=>p[0])))/2;
    const cy=(Math.min(...result.map(p=>p[1]))+Math.max(...result.map(p=>p[1])))/2;
    return result.map(([px,py])=>[px-cx+center[0],py-cy+center[1]]);
  };
}
