/**
 * Bounded codec for the original renderer's ORBAST1 appearance records.
 * Verified against the 108 recovered presets. Unsupported extensions fail closed;
 * opaque model fields are retained, never guessed into new geometry parameters.
 * This is an optional runtime asset and imports no package into Bloom's graph.
 */
const MAGIC = 'ORBAST1\0';
const RIG = 'ORBRIG1\0';
const HERE = 'ORBHERE1';
const LIMIT = 65536;
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder('utf-8', { fatal: true });
const fail = (message) => { throw new Error(`Appearance codec: ${message}`); };
const finite = (n) => typeof n === 'number' && Number.isFinite(n) && Math.abs(n) <= 3.4028234663852886e38;
function vector(value, n, label, positive = false) {
  if (!Array.isArray(value) || value.length !== n || value.some(v => !finite(v) || (positive && v <= 0))) fail(`invalid ${label}`);
  return value.slice();
}
function transform(value) {
  return { position: vector(value.position ?? [0,0,0],3,'position'), rotation: vector(value.rotation ?? [0,0,0],3,'rotation'), scale: vector(value.scale ?? [1,1,1],3,'scale',true) };
}
class Reader {
  constructor(bytes) {
    if (!(bytes instanceof Uint8Array) || bytes.length > LIMIT) fail('expected at most 64 KB of Uint8Array');
    this.b = bytes; this.v = new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength); this.i = 0;
  }
  need(n) { if (!Number.isInteger(n) || n < 0 || this.i+n > this.b.length) fail('truncated record'); }
  bytes(n) { this.need(n); const b=this.b.slice(this.i,this.i+n);this.i+=n;return b; }
  u8() { this.need(1);return this.b[this.i++]; }
  bool() { const n=this.u8();if(n>1)fail('invalid presence flag');return n; }
  u32() { this.need(4);const n=this.v.getUint32(this.i,true);this.i+=4;return n; }
  count() { const n=this.u32();if(n>256)fail('collection exceeds limit');return n; }
  f() { this.need(4);const n=this.v.getFloat32(this.i,true);this.i+=4;if(!finite(n))fail('non-finite scalar');return n; }
  vec(n) { return Array.from({length:n},()=>this.f()); }
  str() { const n=this.u32();if(n>4096)fail('string exceeds limit');return textDecoder.decode(this.bytes(n)); }
  zero(n=1) { for(let j=0;j<n;j++)if(this.u8()!==0)fail('unsupported model extension'); }
  tag(s) { return this.i+s.length <= this.b.length && s.split('').every((c,j)=>this.b[this.i+j]===c.charCodeAt(0)); }
  trans() { return {position:this.vec(3),rotation:this.vec(3),scale:this.vec(3)}; }
  optional(fn) { return this.bool() ? fn.call(this) : null; }
  map(read) { const entries=[];const keys=new Set();for(let n=this.count();n;n--){const key=this.str();if(keys.has(key))fail('duplicate map key');keys.add(key);entries.push([key,read.call(this)]);}return Object.fromEntries(entries); }
}
class Writer {
  constructor() { this.a=[]; }
  bytes(b) { for(const n of b)this.a.push(n);if(this.a.length>LIMIT)fail('record exceeds 64 KB'); }
  u8(n) { if(!Number.isInteger(n)||n<0||n>255)fail('invalid byte');this.a.push(n); }
  u32(n) { if(!Number.isInteger(n)||n<0||n>4096)fail('invalid length');const b=new Uint8Array(4);new DataView(b.buffer).setUint32(0,n,true);this.bytes(b); }
  f(n) { if(!finite(n))fail('non-finite scalar');const b=new Uint8Array(4);new DataView(b.buffer).setFloat32(0,n,true);this.bytes(b); }
  vec(a,n) { vector(a,n,'vector').forEach(v=>this.f(v)); }
  str(s) { if(typeof s!=='string')fail('invalid string');const b=textEncoder.encode(s);this.u32(b.length);this.bytes(b); }
  tag(s) { this.bytes(textEncoder.encode(s)); }
  zero(n=1) { for(let j=0;j<n;j++)this.u8(0); }
  trans(t) { this.vec(t.position,3);this.vec(t.rotation,3);this.vec(t.scale,3); }
  optional(v,fn) { this.u8(v==null?0:1);if(v!=null)fn.call(this,v); }
  map(m,fn) { const entries=Object.entries(m);if(entries.length>256)fail('collection exceeds limit');this.u32(entries.length);for(const[k,v]of entries){this.str(k);fn.call(this,v);} }
  finish() { if(this.a.length>LIMIT)fail('record exceeds 64 KB');return Uint8Array.from(this.a); }
}
function readModel(r) {
  // Only the observed zero-valued model prefix is supported; its schema is unknown.
  r.zero(4);
  const m={bodyScale:r.vec(3),upperBodyStart:r.f(),upperBodyScale:r.f(),eyes:[]};
  for(let j=0;j<2;j++){r.zero();m.eyes.push(r.optional(r.trans));}
  // Unnamed flags and scalar remain opaque until their semantics are proven.
  m.opaqueEyeFlags=[r.bool(),r.bool(),r.bool()];
  m.opaqueEyeScalar=m.eyes.some(Boolean)?r.f():null;
  m.eyeScale=r.vec(3);m.pupilScale=r.vec(3);
  m.eyewear=r.optional(r.trans);r.zero();
  m.accessories=r.map(r.trans);
  m.materials=r.map(function(){const flags=this.u8();if(flags>7)fail('unsupported material flags');return {flags,albedo:flags&1?this.vec(3):null,roughness:flags&2?this.f():null,reflectance:flags&4?this.f():null};});
  r.zero();m.headphonesCushionScale=r.vec(3);return m;
}
function writeModel(w,m) {
  w.zero(4);w.vec(m.bodyScale,3);w.f(m.upperBodyStart);w.f(m.upperBodyScale);
  if(!Array.isArray(m.eyes)||m.eyes.length!==2)fail('expected two eye transforms');
  for(const eye of m.eyes){w.zero();w.optional(eye,w.trans);}
  if(!Array.isArray(m.opaqueEyeFlags)||m.opaqueEyeFlags.length!==3)fail('invalid model flags');
  for(const n of m.opaqueEyeFlags){if(n!==0&&n!==1)fail('invalid model flag');w.u8(n);}
  if(m.eyes.some(Boolean))w.f(m.opaqueEyeScalar);
  w.vec(m.eyeScale,3);w.vec(m.pupilScale,3);w.optional(m.eyewear,w.trans);w.zero();
  w.map(m.accessories,w.trans);
  w.map(m.materials,function(mat){const flags=mat.flags;if(!Number.isInteger(flags)||flags<0||flags>7)fail('unsupported material flags');this.u8(flags);if(flags&1)this.vec(mat.albedo,3);if(flags&2)this.f(mat.roughness);if(flags&4)this.f(mat.reflectance);});
  w.zero();w.vec(m.headphonesCushionScale,3);
}
/** Decode only recognized, fully consumed record layouts. */
export function decodeAppearance(bytes) {
  const r=new Reader(bytes);if(!r.tag(MAGIC))fail('unsupported record version');r.i+=8;
  const a={version:1,shape:r.str(),color:r.str(),eyes:r.str(),eyewear:r.str()};
  a.accessories=Array.from({length:r.count()},()=>r.str());a.accessoryColors=r.map(r.str);
  a.constrained=r.bool();a.depth=r.f();a.model=r.optional(function(){return readModel(this);});
  a.rig=null;a.hereCharacter=null;
  if(r.tag(RIG)){r.i+=8;a.rig=r.vec(5);}
  if(r.tag(HERE)){r.i+=8;a.hereCharacter={id:r.str(),name:r.str()};}
  if(r.i!==bytes.length)fail('unsupported trailing extension');return a;
}
/** Encode a decoded record without changing its selection or opaque metadata. */
export function encodeAppearance(a) {
  if(a.version!==1)fail('unsupported record version');const w=new Writer();w.tag(MAGIC);
  for(const k of ['shape','color','eyes','eyewear'])w.str(a[k]);
  if(!Array.isArray(a.accessories)||a.accessories.length>256)fail('invalid accessories');
  w.u32(a.accessories.length);a.accessories.forEach(v=>w.str(v));w.map(a.accessoryColors,w.str);
  if(a.constrained!==0&&a.constrained!==1)fail('invalid constrained flag');w.u8(a.constrained);w.f(a.depth);
  w.optional(a.model,function(m){writeModel(this,m);});
  if(a.rig){w.tag(RIG);w.vec(a.rig,5);}
  if(a.hereCharacter){w.tag(HERE);w.str(a.hereCharacter.id);w.str(a.hereCharacter.name);}
  return w.finish();
}
function defaultModel() {
  return {bodyScale:[1,1,1],upperBodyStart:Math.fround(.35),upperBodyScale:1,eyes:[null,null],opaqueEyeFlags:[0,0,0],opaqueEyeScalar:null,eyeScale:[1,1,1],pupilScale:[1,1,1],eyewear:null,accessories:{},materials:{},headphonesCushionScale:[1,1,1]};
}
function rgb(value) {
  if(typeof value==='string'){
    if(!/^#[\da-f]{6}$/i.test(value))fail('bodyColor must be #RRGGBB');
    return [1,3,5].map(i=>parseInt(value.slice(i,i+2),16)/255);
  }
  const a=vector(value,3,'bodyColor');if(a.some(v=>v<0||v>1))fail('bodyColor outside [0,1]');return a;
}
/**
 * Return validated/normalized original-engine state. Does not mutate input bytes
 * or the Character. Caller restores the result once after selections settle.
 * Named Here presets are protected: demotion changes their authored appearance.
 * Explicit {allowPresetDemotion:true} opts into this visible change for research;
 * consumers should normally customize an already editable component state.
 * Supports bodyColor (#RRGGBB or RGB01), bodyScale, eyeTransforms (two transforms),
 * eyeScale, pupilScale, restingEyeClosure and eyeGazeScale. Unsupported keys throw.
 * Eye transform rotations are degrees; positions use renderer body units.
 */
export function customizeAppearance(engine,bytes,patch,options={}) {
  const allowed=new Set(['bodyColor','bodyScale','eyeTransforms','eyeScale','pupilScale','restingEyeClosure','eyeGazeScale']);
  if(!patch||typeof patch!=='object'||Array.isArray(patch))fail('invalid patch');
  for(const key of Object.keys(patch))if(!allowed.has(key))fail(`unsupported patch ${key}`);
  if(typeof engine?.validateAppearance!=='function'||typeof engine?.normalizeAppearance!=='function')fail('original validator is required');
  const a=decodeAppearance(bytes);
  if(Object.keys(patch).length===0)return bytes.slice();
  if(a.hereCharacter&&!options.allowPresetDemotion)fail('named preset customization would change its authored appearance');
  a.hereCharacter=null;a.model??=defaultModel();const m=a.model;
  if(patch.bodyColor!==undefined){const prev=m.materials.body??{flags:0,albedo:null,roughness:null,reflectance:null};m.materials.body={...prev,flags:prev.flags|1,albedo:rgb(patch.bodyColor)};}
  for(const key of ['bodyScale','eyeScale','pupilScale'])if(patch[key]!==undefined)m[key]=vector(patch[key],3,key,true);
  if(patch.eyeTransforms!==undefined){
    if(!Array.isArray(patch.eyeTransforms)||patch.eyeTransforms.length!==2)fail('expected two eyeTransforms');
    m.eyes=patch.eyeTransforms.map(transform);m.opaqueEyeFlags=[0,1,1];m.opaqueEyeScalar??=0;
  }
  if(patch.restingEyeClosure!==undefined||patch.eyeGazeScale!==undefined){
    a.rig??=[0,1,1,1,1];
    if(patch.restingEyeClosure!==undefined){const n=patch.restingEyeClosure;if(!finite(n)||n<0||n>1)fail('invalid restingEyeClosure');a.rig[0]=n;}
    if(patch.eyeGazeScale!==undefined){const v=vector(patch.eyeGazeScale,2,'eyeGazeScale');if(v.some(n=>n<0))fail('negative eyeGazeScale');a.rig[3]=v[0];a.rig[4]=v[1];}
  }
  const result=encodeAppearance(a);const error=engine.validateAppearance(result);if(error)fail(error);
  const normalized=engine.normalizeAppearance(result);const normalizedError=engine.validateAppearance(normalized);if(normalizedError)fail(normalizedError);
  return normalized;
}
