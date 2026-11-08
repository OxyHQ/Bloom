import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { referenceBodyCanonicalizer } from './avatar-vector/canonical-reference-body.mjs';
const marks=JSON.parse(fs.readFileSync(new URL('./avatar-vector/reference-outlines.json',import.meta.url)));
const outlines=Object.fromEntries(marks.map(mark=>{const numbers=mark.body.match(/-?\d+(?:\.\d+)?/g).map(Number);return [mark.id,numbers.flatMap((n,i)=>i%2?[]:[[n,-numbers[i+1]]])]}));
const canonicalize=referenceBodyCanonicalizer(outlines.square);
const area=points=>Math.abs(points.reduce((sum,a,i)=>{const b=points[(i+1)%points.length];return sum+a[0]*b[1]-b[0]*a[1]},0));
test('retains circular geometry exactly and every organic contour vertex and area',()=>{
 assert.deepEqual(canonicalize('blob',outlines.blob),outlines.blob);
 for(const [id,points]of Object.entries(outlines)){const neutral=canonicalize(id,points);assert.equal(neutral.length,points.length);assert.ok(neutral.every(p=>p.every(Number.isFinite)));assert.ok(Math.abs(area(neutral)/area(points)-1)<1e-10,id);}
});
test('neutral square edges are level and perpendicular rather than the baked 100-degree basis',()=>{
 const points=canonicalize('square',outlines.square);let aligned=0,total=0;
 for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy);total+=length;if(Math.min(Math.abs(dx),Math.abs(dy))/length<.025)aligned+=length;}
 assert.ok(aligned/total>.7,`Only ${aligned/total} of perimeter aligned`);
});
