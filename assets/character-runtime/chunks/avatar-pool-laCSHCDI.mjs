import{n as e,t}from"../runtime.mjs";var n=1e3,r=1001,i=1002,a=1003,o=1004,s=1005,c=1006,l=1007,u=1008,d=1009,f=1010,p=1011,m=1012,h=1013,g=1014,_=1015,v=1016,y=1017,b=1018,x=1020,S=35902,C=35899,w=1021,T=1022,E=1023,D=1026,O=1027,k=1028,A=1029,j=1030,ee=1031,te=1033,M=33776,N=33777,P=33778,ne=33779,F=35840,re=35841,ie=35842,ae=35843,oe=36196,se=37492,I=37496,ce=37488,le=37489,ue=37490,de=37491,fe=37808,pe=37809,me=37810,he=37811,ge=37812,_e=37813,ve=37814,ye=37815,be=37816,xe=37817,Se=37818,Ce=37819,we=37820,Te=37821,Ee=36492,De=36494,Oe=36495,ke=36283,Ae=36284,je=36285,L=36286,Me=2300,Ne=2301,Pe=2302,R=2303,Fe=2400,z=2401,B=2402,Ie=3200,Le=`srgb`,Re=`srgb-linear`,ze=`linear`,Be=`srgb`,Ve=7680,He=35044,Ue=35048,We=`300 es`,Ge=2e3;function Ke(e){for(let t=e.length-1;t>=0;--t)if(e[t]>=65535)return!0;return!1}function qe(e){return ArrayBuffer.isView(e)&&!(e instanceof DataView)}function Je(e){return document.createElementNS(`http://www.w3.org/1999/xhtml`,e)}function Ye(){let e=Je(`canvas`);return e.style.display=`block`,e}var Xe={};function Ze(...e){let t=`THREE.`+e.shift();console.log(t,...e)}function Qe(e){let t=e[0];if(typeof t==`string`&&t.startsWith(`TSL:`)){let t=e[1];t&&t.isStackTrace?e[0]+=` `+t.getLocation():e[1]=`Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.`}return e}function V(...e){e=Qe(e);let t=`THREE.`+e.shift();{let n=e[0];n&&n.isStackTrace?console.warn(n.getError(t)):console.warn(t,...e)}}function H(...e){e=Qe(e);let t=`THREE.`+e.shift();{let n=e[0];n&&n.isStackTrace?console.error(n.getError(t)):console.error(t,...e)}}function $e(...e){let t=e.join(` `);t in Xe||(Xe[t]=!0,V(...e))}function et(e,t,n){return new Promise(function(r,i){function a(){switch(e.clientWaitSync(t,e.SYNC_FLUSH_COMMANDS_BIT,0)){case e.WAIT_FAILED:i();break;case e.TIMEOUT_EXPIRED:setTimeout(a,n);break;default:r()}}setTimeout(a,n)})}var tt={0:1,2:6,4:7,3:5,1:0,6:2,7:4,5:3},nt=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){let n=this._listeners;return n!==void 0&&n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){let n=this._listeners;if(n===void 0)return;let r=n[e];if(r!==void 0){let e=r.indexOf(t);e!==-1&&r.splice(e,1)}}dispatchEvent(e){let t=this._listeners;if(t===void 0)return;let n=t[e.type];if(n!==void 0){e.target=this;let t=n.slice(0);for(let n=0,r=t.length;n<r;n++)t[n].call(this,e);e.target=null}}},rt=`00.01.02.03.04.05.06.07.08.09.0a.0b.0c.0d.0e.0f.10.11.12.13.14.15.16.17.18.19.1a.1b.1c.1d.1e.1f.20.21.22.23.24.25.26.27.28.29.2a.2b.2c.2d.2e.2f.30.31.32.33.34.35.36.37.38.39.3a.3b.3c.3d.3e.3f.40.41.42.43.44.45.46.47.48.49.4a.4b.4c.4d.4e.4f.50.51.52.53.54.55.56.57.58.59.5a.5b.5c.5d.5e.5f.60.61.62.63.64.65.66.67.68.69.6a.6b.6c.6d.6e.6f.70.71.72.73.74.75.76.77.78.79.7a.7b.7c.7d.7e.7f.80.81.82.83.84.85.86.87.88.89.8a.8b.8c.8d.8e.8f.90.91.92.93.94.95.96.97.98.99.9a.9b.9c.9d.9e.9f.a0.a1.a2.a3.a4.a5.a6.a7.a8.a9.aa.ab.ac.ad.ae.af.b0.b1.b2.b3.b4.b5.b6.b7.b8.b9.ba.bb.bc.bd.be.bf.c0.c1.c2.c3.c4.c5.c6.c7.c8.c9.ca.cb.cc.cd.ce.cf.d0.d1.d2.d3.d4.d5.d6.d7.d8.d9.da.db.dc.dd.de.df.e0.e1.e2.e3.e4.e5.e6.e7.e8.e9.ea.eb.ec.ed.ee.ef.f0.f1.f2.f3.f4.f5.f6.f7.f8.f9.fa.fb.fc.fd.fe.ff`.split(`.`),it=1234567,at=Math.PI/180,ot=180/Math.PI;function st(){let e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0,r=Math.random()*4294967295|0;return(rt[e&255]+rt[e>>8&255]+rt[e>>16&255]+rt[e>>24&255]+`-`+rt[t&255]+rt[t>>8&255]+`-`+rt[t>>16&15|64]+rt[t>>24&255]+`-`+rt[n&63|128]+rt[n>>8&255]+`-`+rt[n>>16&255]+rt[n>>24&255]+rt[r&255]+rt[r>>8&255]+rt[r>>16&255]+rt[r>>24&255]).toLowerCase()}function U(e,t,n){return Math.max(t,Math.min(n,e))}function ct(e,t){return(e%t+t)%t}function lt(e,t,n,r,i){return r+(e-t)*(i-r)/(n-t)}function ut(e,t,n){return e===t?0:(n-e)/(t-e)}function dt(e,t,n){return(1-n)*e+n*t}function ft(e,t,n,r){return dt(e,t,1-Math.exp(-n*r))}function pt(e,t=1){return t-Math.abs(ct(e,t*2)-t)}function mt(e,t,n){return e<=t?0:e>=n?1:(e=(e-t)/(n-t),e*e*(3-2*e))}function ht(e,t,n){return e<=t?0:e>=n?1:(e=(e-t)/(n-t),e*e*e*(e*(e*6-15)+10))}function gt(e,t){return e+Math.floor(Math.random()*(t-e+1))}function _t(e,t){return e+Math.random()*(t-e)}function vt(e){return e*(.5-Math.random())}function yt(e){e!==void 0&&(it=e);let t=it+=1831565813;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}function bt(e){return e*at}function xt(e){return e*ot}function St(e){return e>0&&Number.isInteger(e)&&2**Math.round(Math.log2(e))===e}function Ct(e){return 2**Math.ceil(Math.log(e)/Math.LN2)}function wt(e){return 2**Math.floor(Math.log(e)/Math.LN2)}function Tt(e,t,n,r,i){let a=Math.cos,o=Math.sin,s=a(n/2),c=o(n/2),l=a((t+r)/2),u=o((t+r)/2),d=a((t-r)/2),f=o((t-r)/2),p=a((r-t)/2),m=o((r-t)/2);switch(i){case`XYX`:e.set(s*u,c*d,c*f,s*l);break;case`YZY`:e.set(c*f,s*u,c*d,s*l);break;case`ZXZ`:e.set(c*d,c*f,s*u,s*l);break;case`XZX`:e.set(s*u,c*m,c*p,s*l);break;case`YXY`:e.set(c*p,s*u,c*m,s*l);break;case`ZYZ`:e.set(c*m,c*p,s*u,s*l);break;default:V(`MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: `+i)}}function Et(e,t){switch(t.constructor){case Float32Array:return e;case Uint32Array:return e/4294967295;case Uint16Array:return e/65535;case Uint8Array:case Uint8ClampedArray:return e/255;case Int32Array:return Math.max(e/2147483647,-1);case Int16Array:return Math.max(e/32767,-1);case Int8Array:return Math.max(e/127,-1);default:throw Error(`THREE.MathUtils: Invalid component type.`)}}function W(e,t){switch(t.constructor){case Float32Array:return e;case Uint32Array:return Math.round(e*4294967295);case Uint16Array:return Math.round(e*65535);case Uint8Array:case Uint8ClampedArray:return Math.round(e*255);case Int32Array:return Math.round(e*2147483647);case Int16Array:return Math.round(e*32767);case Int8Array:return Math.round(e*127);default:throw Error(`THREE.MathUtils: Invalid component type.`)}}var Dt={DEG2RAD:at,RAD2DEG:ot,generateUUID:st,clamp:U,euclideanModulo:ct,mapLinear:lt,inverseLerp:ut,lerp:dt,damp:ft,pingpong:pt,smoothstep:mt,smootherstep:ht,randInt:gt,randFloat:_t,randFloatSpread:vt,seededRandom:yt,degToRad:bt,radToDeg:xt,isPowerOfTwo:St,ceilPowerOfTwo:Ct,floorPowerOfTwo:wt,setQuaternionFromProperEuler:Tt,normalize:W,denormalize:Et},G=class e{static{e.prototype.isVector2=!0}constructor(e=0,t=0){this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw Error(`THREE.Vector2: index is out of range: `+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw Error(`THREE.Vector2: index is out of range: `+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,n=this.y,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6],this.y=r[1]*t+r[4]*n+r[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=U(this.x,e.x,t.x),this.y=U(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=U(this.x,e,t),this.y=U(this.y,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(U(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(U(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let n=Math.cos(t),r=Math.sin(t),i=this.x-e.x,a=this.y-e.y;return this.x=i*n-a*r+e.x,this.y=i*r+a*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},Ot=class{constructor(e=0,t=0,n=0,r=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=r}static slerpFlat(e,t,n,r,i,a,o){let s=n[r+0],c=n[r+1],l=n[r+2],u=n[r+3],d=i[a+0],f=i[a+1],p=i[a+2],m=i[a+3];if(u!==m||s!==d||c!==f||l!==p){let e=s*d+c*f+l*p+u*m;e<0&&(d=-d,f=-f,p=-p,m=-m,e=-e);let t=1-o;if(e<.9995){let n=Math.acos(e),r=Math.sin(n);t=Math.sin(t*n)/r,o=Math.sin(o*n)/r,s=s*t+d*o,c=c*t+f*o,l=l*t+p*o,u=u*t+m*o}else{s=s*t+d*o,c=c*t+f*o,l=l*t+p*o,u=u*t+m*o;let e=1/Math.sqrt(s*s+c*c+l*l+u*u);s*=e,c*=e,l*=e,u*=e}}e[t]=s,e[t+1]=c,e[t+2]=l,e[t+3]=u}static multiplyQuaternionsFlat(e,t,n,r,i,a){let o=n[r],s=n[r+1],c=n[r+2],l=n[r+3],u=i[a],d=i[a+1],f=i[a+2],p=i[a+3];return e[t]=o*p+l*u+s*f-c*d,e[t+1]=s*p+l*d+c*u-o*f,e[t+2]=c*p+l*f+o*d-s*u,e[t+3]=l*p-o*u-s*d-c*f,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,r){return this._x=e,this._y=t,this._z=n,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let n=e._x,r=e._y,i=e._z,a=e._order,o=Math.cos,s=Math.sin,c=o(n/2),l=o(r/2),u=o(i/2),d=s(n/2),f=s(r/2),p=s(i/2);switch(a){case`XYZ`:this._x=d*l*u+c*f*p,this._y=c*f*u-d*l*p,this._z=c*l*p+d*f*u,this._w=c*l*u-d*f*p;break;case`YXZ`:this._x=d*l*u+c*f*p,this._y=c*f*u-d*l*p,this._z=c*l*p-d*f*u,this._w=c*l*u+d*f*p;break;case`ZXY`:this._x=d*l*u-c*f*p,this._y=c*f*u+d*l*p,this._z=c*l*p+d*f*u,this._w=c*l*u-d*f*p;break;case`ZYX`:this._x=d*l*u-c*f*p,this._y=c*f*u+d*l*p,this._z=c*l*p-d*f*u,this._w=c*l*u+d*f*p;break;case`YZX`:this._x=d*l*u+c*f*p,this._y=c*f*u+d*l*p,this._z=c*l*p-d*f*u,this._w=c*l*u-d*f*p;break;case`XZY`:this._x=d*l*u-c*f*p,this._y=c*f*u-d*l*p,this._z=c*l*p+d*f*u,this._w=c*l*u+d*f*p;break;default:V(`Quaternion: .setFromEuler() encountered an unknown order: `+a)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let n=t/2,r=Math.sin(n);return this._x=e.x*r,this._y=e.y*r,this._z=e.z*r,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,n=t[0],r=t[4],i=t[8],a=t[1],o=t[5],s=t[9],c=t[2],l=t[6],u=t[10],d=n+o+u;if(d>0){let e=.5/Math.sqrt(d+1);this._w=.25/e,this._x=(l-s)*e,this._y=(i-c)*e,this._z=(a-r)*e}else if(n>o&&n>u){let e=2*Math.sqrt(1+n-o-u);this._w=(l-s)/e,this._x=.25*e,this._y=(r+a)/e,this._z=(i+c)/e}else if(o>u){let e=2*Math.sqrt(1+o-n-u);this._w=(i-c)/e,this._x=(r+a)/e,this._y=.25*e,this._z=(s+l)/e}else{let e=2*Math.sqrt(1+u-n-o);this._w=(a-r)/e,this._x=(i+c)/e,this._y=(s+l)/e,this._z=.25*e}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<1e-8?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(U(this.dot(e),-1,1)))}rotateTowards(e,t){let n=this.angleTo(e);if(n===0)return this;let r=Math.min(1,t/n);return this.slerp(e,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x*=e,this._y*=e,this._z*=e,this._w*=e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let n=e._x,r=e._y,i=e._z,a=e._w,o=t._x,s=t._y,c=t._z,l=t._w;return this._x=n*l+a*o+r*c-i*s,this._y=r*l+a*s+i*o-n*c,this._z=i*l+a*c+n*s-r*o,this._w=a*l-n*o-r*s-i*c,this._onChangeCallback(),this}slerp(e,t){let n=e._x,r=e._y,i=e._z,a=e._w,o=this.dot(e);o<0&&(n=-n,r=-r,i=-i,a=-a,o=-o);let s=1-t;if(o<.9995){let e=Math.acos(o),c=Math.sin(e);s=Math.sin(s*e)/c,t=Math.sin(t*e)/c,this._x=this._x*s+n*t,this._y=this._y*s+r*t,this._z=this._z*s+i*t,this._w=this._w*s+a*t,this._onChangeCallback()}else this._x=this._x*s+n*t,this._y=this._y*s+r*t,this._z=this._z*s+i*t,this._w=this._w*s+a*t,this.normalize();return this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),n=Math.random(),r=Math.sqrt(1-n),i=Math.sqrt(n);return this.set(r*Math.sin(e),r*Math.cos(e),i*Math.sin(t),i*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},K=class e{static{e.prototype.isVector3=!0}constructor(e=0,t=0,n=0){this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw Error(`THREE.Vector3: index is out of range: `+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw Error(`THREE.Vector3: index is out of range: `+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(At.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(At.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,n=this.y,r=this.z,i=e.elements;return this.x=i[0]*t+i[3]*n+i[6]*r,this.y=i[1]*t+i[4]*n+i[7]*r,this.z=i[2]*t+i[5]*n+i[8]*r,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,n=this.y,r=this.z,i=e.elements,a=1/(i[3]*t+i[7]*n+i[11]*r+i[15]);return this.x=(i[0]*t+i[4]*n+i[8]*r+i[12])*a,this.y=(i[1]*t+i[5]*n+i[9]*r+i[13])*a,this.z=(i[2]*t+i[6]*n+i[10]*r+i[14])*a,this}applyQuaternion(e){let t=this.x,n=this.y,r=this.z,i=e.x,a=e.y,o=e.z,s=e.w,c=2*(a*r-o*n),l=2*(o*t-i*r),u=2*(i*n-a*t);return this.x=t+s*c+a*u-o*l,this.y=n+s*l+o*c-i*u,this.z=r+s*u+i*l-a*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,n=this.y,r=this.z,i=e.elements;return this.x=i[0]*t+i[4]*n+i[8]*r,this.y=i[1]*t+i[5]*n+i[9]*r,this.z=i[2]*t+i[6]*n+i[10]*r,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=U(this.x,e.x,t.x),this.y=U(this.y,e.y,t.y),this.z=U(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=U(this.x,e,t),this.y=U(this.y,e,t),this.z=U(this.z,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(U(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let n=e.x,r=e.y,i=e.z,a=t.x,o=t.y,s=t.z;return this.x=r*s-i*o,this.y=i*a-n*s,this.z=n*o-r*a,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return kt.copy(this).projectOnVector(e),this.sub(kt)}reflect(e){return this.sub(kt.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(U(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y,r=this.z-e.z;return t*t+n*n+r*r}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){let r=Math.sin(t)*e;return this.x=r*Math.sin(n),this.y=Math.cos(t)*e,this.z=r*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),r=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=r,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,n=Math.sqrt(1-t*t);return this.x=n*Math.cos(e),this.y=t,this.z=n*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},kt=new K,At=new Ot,q=class e{static{e.prototype.isMatrix3=!0}constructor(e,t,n,r,i,a,o,s,c){this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,r,i,a,o,s,c)}set(e,t,n,r,i,a,o,s,c){let l=this.elements;return l[0]=e,l[1]=r,l[2]=o,l[3]=t,l[4]=i,l[5]=s,l[6]=n,l[7]=a,l[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,r=t.elements,i=this.elements,a=n[0],o=n[3],s=n[6],c=n[1],l=n[4],u=n[7],d=n[2],f=n[5],p=n[8],m=r[0],h=r[3],g=r[6],_=r[1],v=r[4],y=r[7],b=r[2],x=r[5],S=r[8];return i[0]=a*m+o*_+s*b,i[3]=a*h+o*v+s*x,i[6]=a*g+o*y+s*S,i[1]=c*m+l*_+u*b,i[4]=c*h+l*v+u*x,i[7]=c*g+l*y+u*S,i[2]=d*m+f*_+p*b,i[5]=d*h+f*v+p*x,i[8]=d*g+f*y+p*S,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[1],r=e[2],i=e[3],a=e[4],o=e[5],s=e[6],c=e[7],l=e[8];return t*a*l-t*o*c-n*i*l+n*o*s+r*i*c-r*a*s}invert(){let e=this.elements,t=e[0],n=e[1],r=e[2],i=e[3],a=e[4],o=e[5],s=e[6],c=e[7],l=e[8],u=l*a-o*c,d=o*s-l*i,f=c*i-a*s,p=t*u+n*d+r*f;if(p===0)return this.set(0,0,0,0,0,0,0,0,0);let m=1/p;return e[0]=u*m,e[1]=(r*c-l*n)*m,e[2]=(o*n-r*a)*m,e[3]=d*m,e[4]=(l*t-r*s)*m,e[5]=(r*i-o*t)*m,e[6]=f*m,e[7]=(n*s-c*t)*m,e[8]=(a*t-n*i)*m,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,r,i,a,o){let s=Math.cos(i),c=Math.sin(i);return this.set(n*s,n*c,-n*(s*a+c*o)+a+e,-r*c,r*s,-r*(-c*a+s*o)+o+t,0,0,1),this}scale(e,t){return $e(`Matrix3: .scale() is deprecated. Use .makeScale() instead.`),this.premultiply(jt.makeScale(e,t)),this}rotate(e){return $e(`Matrix3: .rotate() is deprecated. Use .makeRotation() instead.`),this.premultiply(jt.makeRotation(-e)),this}translate(e,t){return $e(`Matrix3: .translate() is deprecated. Use .makeTranslation() instead.`),this.premultiply(jt.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,n=e.elements;for(let e=0;e<9;e++)if(t[e]!==n[e])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}},jt=new q,Mt=new q().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Nt=new q().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function Pt(){let e={enabled:!0,workingColorSpace:Re,spaces:{},convert:function(e,t,n){return this.enabled===!1||t===n||!t||!n||(this.spaces[t].transfer===`srgb`&&(e.r=Ft(e.r),e.g=Ft(e.g),e.b=Ft(e.b)),this.spaces[t].primaries!==this.spaces[n].primaries&&(e.applyMatrix3(this.spaces[t].toXYZ),e.applyMatrix3(this.spaces[n].fromXYZ)),this.spaces[n].transfer===`srgb`&&(e.r=It(e.r),e.g=It(e.g),e.b=It(e.b))),e},workingToColorSpace:function(e,t){return this.convert(e,this.workingColorSpace,t)},colorSpaceToWorking:function(e,t){return this.convert(e,t,this.workingColorSpace)},getPrimaries:function(e){return this.spaces[e].primaries},getTransfer:function(e){return e===``?ze:this.spaces[e].transfer},getToneMappingMode:function(e){return this.spaces[e].outputColorSpaceConfig.toneMappingMode||`standard`},getLuminanceCoefficients:function(e,t=this.workingColorSpace){return e.fromArray(this.spaces[t].luminanceCoefficients)},define:function(e){Object.assign(this.spaces,e)},_getMatrix:function(e,t,n){return e.copy(this.spaces[t].toXYZ).multiply(this.spaces[n].fromXYZ)},_getDrawingBufferColorSpace:function(e){return this.spaces[e].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(e=this.workingColorSpace){return this.spaces[e].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(t,n){return $e(`ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace().`),e.workingToColorSpace(t,n)},toWorkingColorSpace:function(t,n){return $e(`ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking().`),e.colorSpaceToWorking(t,n)}},t=[.64,.33,.3,.6,.15,.06],n=[.2126,.7152,.0722],r=[.3127,.329];return e.define({[Re]:{primaries:t,whitePoint:r,transfer:ze,toXYZ:Mt,fromXYZ:Nt,luminanceCoefficients:n,workingColorSpaceConfig:{unpackColorSpace:Le},outputColorSpaceConfig:{drawingBufferColorSpace:Le}},[Le]:{primaries:t,whitePoint:r,transfer:Be,toXYZ:Mt,fromXYZ:Nt,luminanceCoefficients:n,outputColorSpaceConfig:{drawingBufferColorSpace:Le}}}),e}var J=Pt();function Ft(e){return e<.04045?e*.0773993808:(e*.9478672986+.0521327014)**2.4}function It(e){return e<.0031308?e*12.92:1.055*e**.41666-.055}var Lt,Rt=class{static getDataURL(e,t=`image/png`){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>`u`)return e.src;let n;if(e instanceof HTMLCanvasElement)n=e;else{Lt===void 0&&(Lt=Je(`canvas`)),Lt.width=e.width,Lt.height=e.height;let t=Lt.getContext(`2d`);e instanceof ImageData?t.putImageData(e,0,0):t.drawImage(e,0,0,e.width,e.height),n=Lt}return n.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<`u`&&e instanceof HTMLCanvasElement||typeof ImageBitmap<`u`&&e instanceof ImageBitmap){let t=Je(`canvas`);t.width=e.width,t.height=e.height;let n=t.getContext(`2d`);n.drawImage(e,0,0,e.width,e.height);let r=n.getImageData(0,0,e.width,e.height),i=r.data;for(let e=0;e<i.length;e++)i[e]=Ft(i[e]/255)*255;return n.putImageData(r,0,0),t}if(e.data){let t=e.data.slice(0);for(let e=0;e<t.length;e++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[e]=Math.floor(Ft(t[e]/255)*255):t[e]=Ft(t[e]);return{data:t,width:e.width,height:e.height}}return V(`ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied.`),e}},zt=0,Bt=class{constructor(e=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:zt++}),this.uuid=st(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){let t=this.data;return typeof HTMLVideoElement<`u`&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):typeof VideoFrame<`u`&&t instanceof VideoFrame?e.set(t.displayWidth,t.displayHeight,0):t===null?e.set(0,0,0):e.set(t.width,t.height,t.depth||0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e==`string`;if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let n={uuid:this.uuid,url:``},r=this.data;if(r!==null){let e;if(Array.isArray(r)){e=[];for(let t=0,n=r.length;t<n;t++)r[t].isDataTexture?e.push(Vt(r[t].image)):e.push(Vt(r[t]))}else e=Vt(r);n.url=e}return t||(e.images[this.uuid]=n),n}};function Vt(e){return typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<`u`&&e instanceof HTMLCanvasElement||typeof ImageBitmap<`u`&&e instanceof ImageBitmap?Rt.getDataURL(e):e.data?{data:Array.from(e.data),width:e.width,height:e.height,type:e.data.constructor.name}:(V(`Texture: Unable to serialize Texture.`),{})}var Ht=0,Ut=new K,Wt=class e extends nt{constructor(t=e.DEFAULT_IMAGE,n=e.DEFAULT_MAPPING,i=r,a=r,o=c,s=u,l=E,f=d,p=e.DEFAULT_ANISOTROPY,m=``){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Ht++}),this.uuid=st(),this.name=``,this.source=new Bt(t),this.mipmaps=[],this.mapping=n,this.channel=0,this.wrapS=i,this.wrapT=a,this.magFilter=o,this.minFilter=s,this.anisotropy=p,this.format=l,this.internalFormat=null,this.type=f,this.offset=new G(0,0),this.repeat=new G(1,1),this.center=new G(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new q,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=m,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(t&&t.depth&&t.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(Ut).x}get height(){return this.source.getSize(Ut).y}get depth(){return this.source.getSize(Ut).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(let t in e){let n=e[t];if(n===void 0){V(`Texture.setValues(): parameter '${t}' has value of undefined.`);continue}let r=this[t];r===void 0?V(`Texture.setValues(): property '${t}' does not exist.`):r&&n&&r.isVector2&&n.isVector2||r&&n&&r.isVector3&&n.isVector3||r&&n&&r.isMatrix3&&n.isMatrix3?r.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e==`string`;if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let n={metadata:{version:4.7,type:`Texture`,generator:`Texture.toJSON`},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:`dispose`})}transformUv(e){if(this.mapping!==300)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case n:e.x-=Math.floor(e.x);break;case r:e.x=e.x<0?0:1;break;case i:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x-=Math.floor(e.x)}if(e.y<0||e.y>1)switch(this.wrapT){case n:e.y-=Math.floor(e.y);break;case r:e.y=e.y<0?0:1;break;case i:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y-=Math.floor(e.y)}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};Wt.DEFAULT_IMAGE=null,Wt.DEFAULT_MAPPING=300,Wt.DEFAULT_ANISOTROPY=1;var Gt=class e{static{e.prototype.isVector4=!0}constructor(e=0,t=0,n=0,r=1){this.x=e,this.y=t,this.z=n,this.w=r}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,r){return this.x=e,this.y=t,this.z=n,this.w=r,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw Error(`THREE.Vector4: index is out of range: `+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw Error(`THREE.Vector4: index is out of range: `+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w===void 0?1:e.w,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,n=this.y,r=this.z,i=this.w,a=e.elements;return this.x=a[0]*t+a[4]*n+a[8]*r+a[12]*i,this.y=a[1]*t+a[5]*n+a[9]*r+a[13]*i,this.z=a[2]*t+a[6]*n+a[10]*r+a[14]*i,this.w=a[3]*t+a[7]*n+a[11]*r+a[15]*i,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,r,i,a=.01,o=.1,s=e.elements,c=s[0],l=s[4],u=s[8],d=s[1],f=s[5],p=s[9],m=s[2],h=s[6],g=s[10];if(Math.abs(l-d)<a&&Math.abs(u-m)<a&&Math.abs(p-h)<a){if(Math.abs(l+d)<o&&Math.abs(u+m)<o&&Math.abs(p+h)<o&&Math.abs(c+f+g-3)<o)return this.set(1,0,0,0),this;t=Math.PI;let e=(c+1)/2,s=(f+1)/2,_=(g+1)/2,v=(l+d)/4,y=(u+m)/4,b=(p+h)/4;return e>s&&e>_?e<a?(n=0,r=.707106781,i=.707106781):(n=Math.sqrt(e),r=v/n,i=y/n):s>_?s<a?(n=.707106781,r=0,i=.707106781):(r=Math.sqrt(s),n=v/r,i=b/r):_<a?(n=.707106781,r=.707106781,i=0):(i=Math.sqrt(_),n=y/i,r=b/i),this.set(n,r,i,t),this}let _=Math.sqrt((h-p)*(h-p)+(u-m)*(u-m)+(d-l)*(d-l));return Math.abs(_)<.001&&(_=1),this.x=(h-p)/_,this.y=(u-m)/_,this.z=(d-l)/_,this.w=Math.acos((c+f+g-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=U(this.x,e.x,t.x),this.y=U(this.y,e.y,t.y),this.z=U(this.z,e.z,t.z),this.w=U(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=U(this.x,e,t),this.y=U(this.y,e,t),this.z=U(this.z,e,t),this.w=U(this.w,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(U(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},Kt=class extends nt{constructor(e=1,t=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:c,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},n),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=n.depth,this.scissor=new Gt(0,0,e,t),this.scissorTest=!1,this.viewport=new Gt(0,0,e,t),this.textures=[];let r=new Wt({width:e,height:t,depth:n.depth}),i=n.count;for(let e=0;e<i;e++)this.textures[e]=r.clone(),this.textures[e].isRenderTargetTexture=!0,this.textures[e].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveColorBuffer=n.resolveColorBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.storeMultisampledColorBuffer=n.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=n.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=n.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview,this.useArrayDepthTexture=n.useArrayDepthTexture}_setTextureOptions(e={}){let t={minFilter:c,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let e=0;e<this.textures.length;e++)this.textures[e].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),e!==null&&e.renderTarget===null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,n=1){if(this.width!==e||this.height!==t||this.depth!==n){this.width=e,this.height=t,this.depth=n;for(let r=0,i=this.textures.length;r<i;r++)this.textures[r].image.width=e,this.textures[r].image.height=t,this.textures[r].image.depth=n,this.textures[r].isData3DTexture!==!0&&(this.textures[r].isArrayTexture=this.textures[r].image.depth>1);this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,n=e.textures.length;t<n;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;let n=Object.assign({},e.textures[t].image);this.textures[t].source=new Bt(n)}if(this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveColorBuffer=e.resolveColorBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,this.storeMultisampledColorBuffer=e.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=e.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=e.storeMultisampledStencilBuffer,e.depthTexture!==null){if(e.depthTexture.renderTarget===e){let t=e.depthTexture.clone();t.renderTarget=null,this.depthTexture=t}else this.depthTexture=e.depthTexture}return this.samples=e.samples,this.multiview=e.multiview,this.useArrayDepthTexture=e.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:`dispose`})}},qt=class extends Kt{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}},Jt=class extends Wt{constructor(e=null,t=1,n=1,i=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:i},this.magFilter=a,this.minFilter=a,this.wrapR=r,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}},Yt=class extends Wt{constructor(e=null,t=1,n=1,i=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:i},this.magFilter=a,this.minFilter=a,this.wrapR=r,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}},Y=class e{static{e.prototype.isMatrix4=!0}constructor(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h)}set(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h){let g=this.elements;return g[0]=e,g[4]=t,g[8]=n,g[12]=r,g[1]=i,g[5]=a,g[9]=o,g[13]=s,g[2]=c,g[6]=l,g[10]=u,g[14]=d,g[3]=f,g[7]=p,g[11]=m,g[15]=h,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new e().fromArray(this.elements)}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){let t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return this.determinantAffine()===0?(e.set(1,0,0),t.set(0,1,0),n.set(0,0,1),this):(e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this)}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){if(e.determinantAffine()===0)return this.identity();let t=this.elements,n=e.elements,r=1/Xt.setFromMatrixColumn(e,0).length(),i=1/Xt.setFromMatrixColumn(e,1).length(),a=1/Xt.setFromMatrixColumn(e,2).length();return t[0]=n[0]*r,t[1]=n[1]*r,t[2]=n[2]*r,t[3]=0,t[4]=n[4]*i,t[5]=n[5]*i,t[6]=n[6]*i,t[7]=0,t[8]=n[8]*a,t[9]=n[9]*a,t[10]=n[10]*a,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,n=e.x,r=e.y,i=e.z,a=Math.cos(n),o=Math.sin(n),s=Math.cos(r),c=Math.sin(r),l=Math.cos(i),u=Math.sin(i);if(e.order===`XYZ`){let e=a*l,n=a*u,r=o*l,i=o*u;t[0]=s*l,t[4]=-s*u,t[8]=c,t[1]=n+r*c,t[5]=e-i*c,t[9]=-o*s,t[2]=i-e*c,t[6]=r+n*c,t[10]=a*s}else if(e.order===`YXZ`){let e=s*l,n=s*u,r=c*l,i=c*u;t[0]=e+i*o,t[4]=r*o-n,t[8]=a*c,t[1]=a*u,t[5]=a*l,t[9]=-o,t[2]=n*o-r,t[6]=i+e*o,t[10]=a*s}else if(e.order===`ZXY`){let e=s*l,n=s*u,r=c*l,i=c*u;t[0]=e-i*o,t[4]=-a*u,t[8]=r+n*o,t[1]=n+r*o,t[5]=a*l,t[9]=i-e*o,t[2]=-a*c,t[6]=o,t[10]=a*s}else if(e.order===`ZYX`){let e=a*l,n=a*u,r=o*l,i=o*u;t[0]=s*l,t[4]=r*c-n,t[8]=e*c+i,t[1]=s*u,t[5]=i*c+e,t[9]=n*c-r,t[2]=-c,t[6]=o*s,t[10]=a*s}else if(e.order===`YZX`){let e=a*s,n=a*c,r=o*s,i=o*c;t[0]=s*l,t[4]=i-e*u,t[8]=r*u+n,t[1]=u,t[5]=a*l,t[9]=-o*l,t[2]=-c*l,t[6]=n*u+r,t[10]=e-i*u}else if(e.order===`XZY`){let e=a*s,n=a*c,r=o*s,i=o*c;t[0]=s*l,t[4]=-u,t[8]=c*l,t[1]=e*u+i,t[5]=a*l,t[9]=n*u-r,t[2]=r*u-n,t[6]=o*l,t[10]=i*u+e}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(Qt,e,$t)}lookAt(e,t,n){let r=this.elements;return nn.subVectors(e,t),nn.lengthSq()===0&&(nn.z=1),nn.normalize(),en.crossVectors(n,nn),en.lengthSq()===0&&(Math.abs(n.z)===1?nn.x+=1e-4:nn.z+=1e-4,nn.normalize(),en.crossVectors(n,nn)),en.normalize(),tn.crossVectors(nn,en),r[0]=en.x,r[4]=tn.x,r[8]=nn.x,r[1]=en.y,r[5]=tn.y,r[9]=nn.y,r[2]=en.z,r[6]=tn.z,r[10]=nn.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,r=t.elements,i=this.elements,a=n[0],o=n[4],s=n[8],c=n[12],l=n[1],u=n[5],d=n[9],f=n[13],p=n[2],m=n[6],h=n[10],g=n[14],_=n[3],v=n[7],y=n[11],b=n[15],x=r[0],S=r[4],C=r[8],w=r[12],T=r[1],E=r[5],D=r[9],O=r[13],k=r[2],A=r[6],j=r[10],ee=r[14],te=r[3],M=r[7],N=r[11],P=r[15];return i[0]=a*x+o*T+s*k+c*te,i[4]=a*S+o*E+s*A+c*M,i[8]=a*C+o*D+s*j+c*N,i[12]=a*w+o*O+s*ee+c*P,i[1]=l*x+u*T+d*k+f*te,i[5]=l*S+u*E+d*A+f*M,i[9]=l*C+u*D+d*j+f*N,i[13]=l*w+u*O+d*ee+f*P,i[2]=p*x+m*T+h*k+g*te,i[6]=p*S+m*E+h*A+g*M,i[10]=p*C+m*D+h*j+g*N,i[14]=p*w+m*O+h*ee+g*P,i[3]=_*x+v*T+y*k+b*te,i[7]=_*S+v*E+y*A+b*M,i[11]=_*C+v*D+y*j+b*N,i[15]=_*w+v*O+y*ee+b*P,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[4],r=e[8],i=e[12],a=e[1],o=e[5],s=e[9],c=e[13],l=e[2],u=e[6],d=e[10],f=e[14],p=e[3],m=e[7],h=e[11],g=e[15],_=s*f-c*d,v=o*f-c*u,y=o*d-s*u,b=a*f-c*l,x=a*d-s*l,S=a*u-o*l;return t*(m*_-h*v+g*y)-n*(p*_-h*b+g*x)+r*(p*v-m*b+g*S)-i*(p*y-m*x+h*S)}determinantAffine(){let e=this.elements,t=e[0],n=e[4],r=e[8],i=e[1],a=e[5],o=e[9],s=e[2],c=e[6],l=e[10];return t*(a*l-o*c)-n*(i*l-o*s)+r*(i*c-a*s)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){let r=this.elements;return e.isVector3?(r[12]=e.x,r[13]=e.y,r[14]=e.z):(r[12]=e,r[13]=t,r[14]=n),this}invert(){let e=this.elements,t=e[0],n=e[1],r=e[2],i=e[3],a=e[4],o=e[5],s=e[6],c=e[7],l=e[8],u=e[9],d=e[10],f=e[11],p=e[12],m=e[13],h=e[14],g=e[15],_=t*o-n*a,v=t*s-r*a,y=t*c-i*a,b=n*s-r*o,x=n*c-i*o,S=r*c-i*s,C=l*m-u*p,w=l*h-d*p,T=l*g-f*p,E=u*h-d*m,D=u*g-f*m,O=d*g-f*h,k=_*O-v*D+y*E+b*T-x*w+S*C;if(k===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let A=1/k;return e[0]=(o*O-s*D+c*E)*A,e[1]=(r*D-n*O-i*E)*A,e[2]=(m*S-h*x+g*b)*A,e[3]=(d*x-u*S-f*b)*A,e[4]=(s*T-a*O-c*w)*A,e[5]=(t*O-r*T+i*w)*A,e[6]=(h*y-p*S-g*v)*A,e[7]=(l*S-d*y+f*v)*A,e[8]=(a*D-o*T+c*C)*A,e[9]=(n*T-t*D-i*C)*A,e[10]=(p*x-m*y+g*_)*A,e[11]=(u*y-l*x-f*_)*A,e[12]=(o*w-a*E-s*C)*A,e[13]=(t*E-n*w+r*C)*A,e[14]=(m*v-p*b-h*_)*A,e[15]=(l*b-u*v+d*_)*A,this}scale(e){let t=this.elements,n=e.x,r=e.y,i=e.z;return t[0]*=n,t[4]*=r,t[8]*=i,t[1]*=n,t[5]*=r,t[9]*=i,t[2]*=n,t[6]*=r,t[10]*=i,t[3]*=n,t[7]*=r,t[11]*=i,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],r=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,r))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let n=Math.cos(t),r=Math.sin(t),i=1-n,a=e.x,o=e.y,s=e.z,c=i*a,l=i*o;return this.set(c*a+n,c*o-r*s,c*s+r*o,0,c*o+r*s,l*o+n,l*s-r*a,0,c*s-r*o,l*s+r*a,i*s*s+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,r,i,a){return this.set(1,n,i,0,e,1,a,0,t,r,1,0,0,0,0,1),this}compose(e,t,n){let r=this.elements,i=t._x,a=t._y,o=t._z,s=t._w,c=i+i,l=a+a,u=o+o,d=i*c,f=i*l,p=i*u,m=a*l,h=a*u,g=o*u,_=s*c,v=s*l,y=s*u,b=n.x,x=n.y,S=n.z;return r[0]=(1-(m+g))*b,r[1]=(f+y)*b,r[2]=(p-v)*b,r[3]=0,r[4]=(f-y)*x,r[5]=(1-(d+g))*x,r[6]=(h+_)*x,r[7]=0,r[8]=(p+v)*S,r[9]=(h-_)*S,r[10]=(1-(d+m))*S,r[11]=0,r[12]=e.x,r[13]=e.y,r[14]=e.z,r[15]=1,this}decompose(e,t,n){let r=this.elements;e.x=r[12],e.y=r[13],e.z=r[14];let i=this.determinantAffine();if(i===0)return n.set(1,1,1),t.identity(),this;let a=Xt.set(r[0],r[1],r[2]).length(),o=Xt.set(r[4],r[5],r[6]).length(),s=Xt.set(r[8],r[9],r[10]).length();i<0&&(a=-a),Zt.copy(this);let c=1/a,l=1/o,u=1/s;return Zt.elements[0]*=c,Zt.elements[1]*=c,Zt.elements[2]*=c,Zt.elements[4]*=l,Zt.elements[5]*=l,Zt.elements[6]*=l,Zt.elements[8]*=u,Zt.elements[9]*=u,Zt.elements[10]*=u,t.setFromRotationMatrix(Zt),n.x=a,n.y=o,n.z=s,this}makePerspective(e,t,n,r,i,a,o=Ge,s=!1){let c=this.elements,l=2*i/(t-e),u=2*i/(n-r),d=(t+e)/(t-e),f=(n+r)/(n-r),p,m;if(s)p=i/(a-i),m=a*i/(a-i);else if(o===2e3)p=-(a+i)/(a-i),m=-2*a*i/(a-i);else if(o===2001)p=-a/(a-i),m=-a*i/(a-i);else throw Error(`THREE.Matrix4.makePerspective(): Invalid coordinate system: `+o);return c[0]=l,c[4]=0,c[8]=d,c[12]=0,c[1]=0,c[5]=u,c[9]=f,c[13]=0,c[2]=0,c[6]=0,c[10]=p,c[14]=m,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(e,t,n,r,i,a,o=Ge,s=!1){let c=this.elements,l=2/(t-e),u=2/(n-r),d=-(t+e)/(t-e),f=-(n+r)/(n-r),p,m;if(s)p=1/(a-i),m=a/(a-i);else if(o===2e3)p=-2/(a-i),m=-(a+i)/(a-i);else if(o===2001)p=-1/(a-i),m=-i/(a-i);else throw Error(`THREE.Matrix4.makeOrthographic(): Invalid coordinate system: `+o);return c[0]=l,c[4]=0,c[8]=0,c[12]=d,c[1]=0,c[5]=u,c[9]=0,c[13]=f,c[2]=0,c[6]=0,c[10]=p,c[14]=m,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(e){let t=this.elements,n=e.elements;for(let e=0;e<16;e++)if(t[e]!==n[e])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}},Xt=new K,Zt=new Y,Qt=new K(0,0,0),$t=new K(1,1,1),en=new K,tn=new K,nn=new K,rn=new Y,an=new Ot,on=class e{constructor(t=0,n=0,r=0,i=e.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=n,this._z=r,this._order=i}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,r=this._order){return this._x=e,this._y=t,this._z=n,this._order=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){let r=e.elements,i=r[0],a=r[4],o=r[8],s=r[1],c=r[5],l=r[9],u=r[2],d=r[6],f=r[10];switch(t){case`XYZ`:this._y=Math.asin(U(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-l,f),this._z=Math.atan2(-a,i)):(this._x=Math.atan2(d,c),this._z=0);break;case`YXZ`:this._x=Math.asin(-U(l,-1,1)),Math.abs(l)<.9999999?(this._y=Math.atan2(o,f),this._z=Math.atan2(s,c)):(this._y=Math.atan2(-u,i),this._z=0);break;case`ZXY`:this._x=Math.asin(U(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-u,f),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(s,i));break;case`ZYX`:this._y=Math.asin(-U(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(d,f),this._z=Math.atan2(s,i)):(this._x=0,this._z=Math.atan2(-a,c));break;case`YZX`:this._z=Math.asin(U(s,-1,1)),Math.abs(s)<.9999999?(this._x=Math.atan2(-l,c),this._y=Math.atan2(-u,i)):(this._x=0,this._y=Math.atan2(o,f));break;case`XZY`:this._z=Math.asin(-U(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(d,c),this._y=Math.atan2(o,i)):(this._x=Math.atan2(-l,f),this._y=0);break;default:V(`Euler: .setFromRotationMatrix() encountered an unknown order: `+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return rn.makeRotationFromQuaternion(e),this.setFromRotationMatrix(rn,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return an.setFromEuler(this),this.setFromQuaternion(an,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};on.DEFAULT_ORDER=`XYZ`;var sn=class{constructor(){this.mask=1}set(e){this.mask=1<<e>>>0}enable(e){this.mask|=1<<e}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e}disable(e){this.mask&=~(1<<e)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return!!(this.mask&1<<e)}},cn=0,ln=new K,un=new Ot,dn=new Y,fn=new K,pn=new K,mn=new K,hn=new Ot,gn=new K(1,0,0),_n=new K(0,1,0),vn=new K(0,0,1),yn={type:`added`},bn={type:`removed`},xn={type:`childadded`,child:null},Sn={type:`childremoved`,child:null},Cn=class e extends nt{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:cn++}),this.uuid=st(),this.name=``,this.type=`Object3D`,this.parent=null,this.children=[],this.up=e.DEFAULT_UP.clone();let t=new K,n=new on,r=new Ot,i=new K(1,1,1);function a(){r.setFromEuler(n,!1)}function o(){n.setFromQuaternion(r,void 0,!1)}n._onChange(a),r._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:n},quaternion:{configurable:!0,enumerable:!0,value:r},scale:{configurable:!0,enumerable:!0,value:i},modelViewMatrix:{value:new Y},normalMatrix:{value:new q}}),this.matrix=new Y,this.matrixWorld=new Y,this.matrixAutoUpdate=e.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=e.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new sn,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return un.setFromAxisAngle(e,t),this.quaternion.multiply(un),this}rotateOnWorldAxis(e,t){return un.setFromAxisAngle(e,t),this.quaternion.premultiply(un),this}rotateX(e){return this.rotateOnAxis(gn,e)}rotateY(e){return this.rotateOnAxis(_n,e)}rotateZ(e){return this.rotateOnAxis(vn,e)}translateOnAxis(e,t){return ln.copy(e).applyQuaternion(this.quaternion),this.position.add(ln.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(gn,e)}translateY(e){return this.translateOnAxis(_n,e)}translateZ(e){return this.translateOnAxis(vn,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(dn.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?fn.copy(e):fn.set(e,t,n);let r=this.parent;this.updateWorldMatrix(!0,!1),pn.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?dn.lookAt(pn,fn,this.up):dn.lookAt(fn,pn,this.up),this.quaternion.setFromRotationMatrix(dn),r&&(dn.extractRotation(r.matrixWorld),un.setFromRotationMatrix(dn),this.quaternion.premultiply(un.invert()))}add(e){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return e===this?(H(`Object3D.add: object can't be added as a child of itself.`,e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(yn),xn.child=e,this.dispatchEvent(xn),xn.child=null):H(`Object3D.add: object not an instance of THREE.Object3D.`,e),this)}remove(e){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.remove(arguments[e]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(bn),Sn.child=e,this.dispatchEvent(Sn),Sn.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),dn.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),dn.multiply(e.parent.matrixWorld)),e.applyMatrix4(dn),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(yn),xn.child=e,this.dispatchEvent(xn),xn.child=null,this}getObjectById(e){return this.getObjectByProperty(`id`,e)}getObjectByName(e){return this.getObjectByProperty(`name`,e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,r=this.children.length;n<r;n++){let r=this.children[n].getObjectByProperty(e,t);if(r!==void 0)return r}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);let r=this.children;for(let i=0,a=r.length;i<a;i++)r[i].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(pn,e,mn),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(pn,hn,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}intersectsFrustum(){}traverse(e){e(this);let t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let e=this.pivot;if(e!==null){let t=e.x,n=e.y,r=e.z,i=this.matrix.elements;i[12]+=t-i[0]*t-i[4]*n-i[8]*r,i[13]+=n-i[1]*t-i[5]*n-i[9]*r,i[14]+=r-i[2]*t-i[6]*n-i[10]*r}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].updateMatrixWorld(e)}updateWorldMatrix(e,t,n=!1){let r=this.parent;if(e===!0&&r!==null&&r.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||n)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,n=!0),t===!0){let e=this.children;for(let t=0,r=e.length;t<r;t++)e[t].updateWorldMatrix(!1,!0,n)}}toJSON(e){let t=e===void 0||typeof e==`string`,n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:`Object`,generator:`Object3D.toJSON`});let r={};r.uuid=this.uuid,r.type=this.type,r.name=this.name,r.castShadow=this.castShadow,r.receiveShadow=this.receiveShadow,r.visible=this.visible,r.frustumCulled=this.frustumCulled,r.renderOrder=this.renderOrder,r.static=this.static,r.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(r.userData=this.userData),r.layers=this.layers.mask,r.matrix=this.matrix.toArray(),r.up=this.up.toArray(),this.pivot!==null&&(r.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(r.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(r.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(r.type=`InstancedMesh`,r.count=this.count,r.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(r.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(r.type=`BatchedMesh`,r.perObjectFrustumCulled=this.perObjectFrustumCulled,r.sortObjects=this.sortObjects,r.drawRanges=this._drawRanges,r.reservedRanges=this._reservedRanges,r.geometryInfo=this._geometryInfo.map(e=>({...e,boundingBox:e.boundingBox?e.boundingBox.toJSON():void 0,boundingSphere:e.boundingSphere?e.boundingSphere.toJSON():void 0})),r.instanceInfo=this._instanceInfo.map(e=>({...e})),r.availableInstanceIds=this._availableInstanceIds.slice(),r.availableGeometryIds=this._availableGeometryIds.slice(),r.nextIndexStart=this._nextIndexStart,r.nextVertexStart=this._nextVertexStart,r.geometryCount=this._geometryCount,r.maxInstanceCount=this._maxInstanceCount,r.maxVertexCount=this._maxVertexCount,r.maxIndexCount=this._maxIndexCount,r.geometryInitialized=this._geometryInitialized,r.matricesTexture=this._matricesTexture.toJSON(e),r.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(r.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(r.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(r.boundingBox=this.boundingBox.toJSON()));function i(t,n){return t[n.uuid]===void 0&&(t[n.uuid]=n.toJSON(e)),n.uuid}if(this.isScene)this.background&&(this.background.isColor?r.background=this.background.toJSON():this.background.isTexture&&(r.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(r.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){r.geometry=i(e.geometries,this.geometry);let t=this.geometry.parameters;if(t!==void 0&&t.shapes!==void 0){let n=t.shapes;if(Array.isArray(n))for(let t=0,r=n.length;t<r;t++){let r=n[t];i(e.shapes,r)}else i(e.shapes,n)}}if(this.isSkinnedMesh&&(r.bindMode=this.bindMode,r.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(i(e.skeletons,this.skeleton),r.skeleton=this.skeleton.uuid)),this.material!==void 0){if(Array.isArray(this.material)){let t=[];for(let n=0,r=this.material.length;n<r;n++)t.push(i(e.materials,this.material[n]));r.material=t}else r.material=i(e.materials,this.material)}if(this.children.length>0){r.children=[];for(let t=0;t<this.children.length;t++)r.children.push(this.children[t].toJSON(e).object)}if(this.animations.length>0){r.animations=[];for(let t=0;t<this.animations.length;t++){let n=this.animations[t];r.animations.push(i(e.animations,n))}}if(t){let t=a(e.geometries),r=a(e.materials),i=a(e.textures),o=a(e.images),s=a(e.shapes),c=a(e.skeletons),l=a(e.animations),u=a(e.nodes);t.length>0&&(n.geometries=t),r.length>0&&(n.materials=r),i.length>0&&(n.textures=i),o.length>0&&(n.images=o),s.length>0&&(n.shapes=s),c.length>0&&(n.skeletons=c),l.length>0&&(n.animations=l),u.length>0&&(n.nodes=u)}return n.object=r,n;function a(e){let t=[];for(let n in e){let r=e[n];delete r.metadata,t.push(r)}return t}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.pivot=e.pivot===null?null:e.pivot.clone(),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let t=0;t<e.children.length;t++){let n=e.children[t];this.add(n.clone())}return this}dispose(){this.dispatchEvent({type:`dispose`})}};Cn.DEFAULT_UP=new K(0,1,0),Cn.DEFAULT_MATRIX_AUTO_UPDATE=!0,Cn.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var wn=class extends Cn{constructor(){super(),this.isGroup=!0,this.type=`Group`}},Tn={type:`move`},En=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new wn,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new wn,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new K,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new K),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new wn,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new K,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new K,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:`connected`,data:e}),this}disconnect(e){return this.dispatchEvent({type:`disconnected`,data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let r=null,i=null,a=null,o=this._targetRay,s=this._grip,c=this._hand;if(e&&t.session.visibilityState!==`visible-blurred`){if(c&&e.hand){a=!0;for(let r of e.hand.values()){let e=t.getJointPose(r,n),i=this._getHandJoint(c,r);e!==null&&(i.matrix.fromArray(e.transform.matrix),i.matrix.decompose(i.position,i.rotation,i.scale),i.matrixWorldNeedsUpdate=!0,i.jointRadius=e.radius),i.visible=e!==null}let r=c.joints[`index-finger-tip`],i=c.joints[`thumb-tip`],o=r.position.distanceTo(i.position);c.inputState.pinching&&o>.025?(c.inputState.pinching=!1,this.dispatchEvent({type:`pinchend`,handedness:e.handedness,target:this})):!c.inputState.pinching&&o<=.015&&(c.inputState.pinching=!0,this.dispatchEvent({type:`pinchstart`,handedness:e.handedness,target:this}))}else s!==null&&e.gripSpace&&(i=t.getPose(e.gripSpace,n),i!==null&&(s.matrix.fromArray(i.transform.matrix),s.matrix.decompose(s.position,s.rotation,s.scale),s.matrixWorldNeedsUpdate=!0,i.linearVelocity?(s.hasLinearVelocity=!0,s.linearVelocity.copy(i.linearVelocity)):s.hasLinearVelocity=!1,i.angularVelocity?(s.hasAngularVelocity=!0,s.angularVelocity.copy(i.angularVelocity)):s.hasAngularVelocity=!1,s.eventsEnabled&&s.dispatchEvent({type:`gripUpdated`,data:e,target:this})));o!==null&&(r=t.getPose(e.targetRaySpace,n),r===null&&i!==null&&(r=i),r!==null&&(o.matrix.fromArray(r.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,r.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(r.linearVelocity)):o.hasLinearVelocity=!1,r.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(r.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(Tn)))}return o!==null&&(o.visible=r!==null),s!==null&&(s.visible=i!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let n=new wn;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}},Dn={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},On={h:0,s:0,l:0},kn={h:0,s:0,l:0};function An(e,t,n){return n<0&&(n+=1),n>1&&--n,n<1/6?e+(t-e)*6*n:n<1/2?t:n<2/3?e+(t-e)*6*(2/3-n):e}var X=class{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){let t=e;t&&t.isColor?this.copy(t):typeof t==`number`?this.setHex(t):typeof t==`string`&&this.setStyle(t)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=Le){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,J.colorSpaceToWorking(this,t),this}setRGB(e,t,n,r=J.workingColorSpace){return this.r=e,this.g=t,this.b=n,J.colorSpaceToWorking(this,r),this}setHSL(e,t,n,r=J.workingColorSpace){if(e=ct(e,1),t=U(t,0,1),n=U(n,0,1),t===0)this.r=this.g=this.b=n;else{let r=n<=.5?n*(1+t):n+t-n*t,i=2*n-r;this.r=An(i,r,e+1/3),this.g=An(i,r,e),this.b=An(i,r,e-1/3)}return J.colorSpaceToWorking(this,r),this}setStyle(e,t=Le){function n(t){t!==void 0&&parseFloat(t)<1&&V(`Color: Alpha component of `+e+` will be ignored.`)}let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(e)){let i,a=r[1],o=r[2];switch(a){case`rgb`:case`rgba`:if(i=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(i[4]),this.setRGB(Math.min(255,parseInt(i[1],10))/255,Math.min(255,parseInt(i[2],10))/255,Math.min(255,parseInt(i[3],10))/255,t);if(i=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(i[4]),this.setRGB(Math.min(100,parseInt(i[1],10))/100,Math.min(100,parseInt(i[2],10))/100,Math.min(100,parseInt(i[3],10))/100,t);break;case`hsl`:case`hsla`:if(i=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(i[4]),this.setHSL(parseFloat(i[1])/360,parseFloat(i[2])/100,parseFloat(i[3])/100,t);break;default:V(`Color: Unknown color model `+e)}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(e)){let n=r[1],i=n.length;if(i===3)return this.setRGB(parseInt(n.charAt(0),16)/15,parseInt(n.charAt(1),16)/15,parseInt(n.charAt(2),16)/15,t);if(i===6)return this.setHex(parseInt(n,16),t);V(`Color: Invalid hex color `+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=Le){let n=Dn[e.toLowerCase()];return n===void 0?V(`Color: Unknown color `+e):this.setHex(n,t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=Ft(e.r),this.g=Ft(e.g),this.b=Ft(e.b),this}copyLinearToSRGB(e){return this.r=It(e.r),this.g=It(e.g),this.b=It(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=Le){return J.workingToColorSpace(jn.copy(this),e),Math.round(U(jn.r*255,0,255))*65536+Math.round(U(jn.g*255,0,255))*256+Math.round(U(jn.b*255,0,255))}getHexString(e=Le){return(`000000`+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=J.workingColorSpace){J.workingToColorSpace(jn.copy(this),t);let n=jn.r,r=jn.g,i=jn.b,a=Math.max(n,r,i),o=Math.min(n,r,i),s,c,l=(o+a)/2;if(o===a)s=0,c=0;else{let e=a-o;switch(c=l<=.5?e/(a+o):e/(2-a-o),a){case n:s=(r-i)/e+(r<i?6:0);break;case r:s=(i-n)/e+2;break;case i:s=(n-r)/e+4}s/=6}return e.h=s,e.s=c,e.l=l,e}getRGB(e,t=J.workingColorSpace){return J.workingToColorSpace(jn.copy(this),t),e.r=jn.r,e.g=jn.g,e.b=jn.b,e}getStyle(e=Le){J.workingToColorSpace(jn.copy(this),e);let t=jn.r,n=jn.g,r=jn.b;return e===`srgb`?`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(r*255)})`:`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${r.toFixed(3)})`}offsetHSL(e,t,n){return this.getHSL(On),this.setHSL(On.h+e,On.s+t,On.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(On),e.getHSL(kn);let n=dt(On.h,kn.h,t),r=dt(On.s,kn.s,t),i=dt(On.l,kn.l,t);return this.setHSL(n,r,i),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,n=this.g,r=this.b,i=e.elements;return this.r=i[0]*t+i[3]*n+i[6]*r,this.g=i[1]*t+i[4]*n+i[7]*r,this.b=i[2]*t+i[5]*n+i[8]*r,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},jn=new X;X.NAMES=Dn;var Mn=class extends Cn{constructor(){super(),this.isScene=!0,this.type=`Scene`,this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new on,this.environmentIntensity=1,this.environmentRotation=new on,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`observe`,{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),t.object.backgroundBlurriness=this.backgroundBlurriness,t.object.backgroundIntensity=this.backgroundIntensity,t.object.backgroundRotation=this.backgroundRotation.toArray(),t.object.environmentIntensity=this.environmentIntensity,t.object.environmentRotation=this.environmentRotation.toArray(),t}},Nn=new K,Pn=new K,Fn=new K,In=new K,Ln=new K,Rn=new K,zn=new K,Bn=new K,Vn=new K,Hn=new K,Un=new Gt,Wn=new Gt,Gn=new Gt,Kn=class e{constructor(e=new K,t=new K,n=new K){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,r){r.subVectors(n,t),Nn.subVectors(e,t),r.cross(Nn);let i=r.lengthSq();return i>0?r.multiplyScalar(1/Math.sqrt(i)):r.set(0,0,0)}static getBarycoord(e,t,n,r,i){Nn.subVectors(r,t),Pn.subVectors(n,t),Fn.subVectors(e,t);let a=Nn.dot(Nn),o=Nn.dot(Pn),s=Nn.dot(Fn),c=Pn.dot(Pn),l=Pn.dot(Fn),u=a*c-o*o;if(u===0)return i.set(0,0,0),null;let d=1/u,f=(c*s-o*l)*d,p=(a*l-o*s)*d;return i.set(1-f-p,p,f)}static containsPoint(e,t,n,r){return this.getBarycoord(e,t,n,r,In)!==null&&In.x>=0&&In.y>=0&&In.x+In.y<=1}static getInterpolation(e,t,n,r,i,a,o,s){return this.getBarycoord(e,t,n,r,In)===null?(s.x=0,s.y=0,`z`in s&&(s.z=0),`w`in s&&(s.w=0),null):(s.setScalar(0),s.addScaledVector(i,In.x),s.addScaledVector(a,In.y),s.addScaledVector(o,In.z),s)}static getInterpolatedAttribute(e,t,n,r,i,a){return Un.setScalar(0),Wn.setScalar(0),Gn.setScalar(0),Un.fromBufferAttribute(e,t),Wn.fromBufferAttribute(e,n),Gn.fromBufferAttribute(e,r),a.setScalar(0),a.addScaledVector(Un,i.x),a.addScaledVector(Wn,i.y),a.addScaledVector(Gn,i.z),a}static isFrontFacing(e,t,n,r){return Nn.subVectors(n,t),Pn.subVectors(e,t),Nn.cross(Pn).dot(r)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,r){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[r]),this}setFromAttributeAndIndices(e,t,n,r){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,r),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return Nn.subVectors(this.c,this.b),Pn.subVectors(this.a,this.b),Nn.cross(Pn).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return e.getNormal(this.a,this.b,this.c,t)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,n){return e.getBarycoord(t,this.a,this.b,this.c,n)}getInterpolation(t,n,r,i,a){return e.getInterpolation(t,this.a,this.b,this.c,n,r,i,a)}containsPoint(t){return e.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return e.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let n=this.a,r=this.b,i=this.c,a,o;Ln.subVectors(r,n),Rn.subVectors(i,n),Bn.subVectors(e,n);let s=Ln.dot(Bn),c=Rn.dot(Bn);if(s<=0&&c<=0)return t.copy(n);Vn.subVectors(e,r);let l=Ln.dot(Vn),u=Rn.dot(Vn);if(l>=0&&u<=l)return t.copy(r);let d=s*u-l*c;if(d<=0&&s>=0&&l<=0)return a=s/(s-l),t.copy(n).addScaledVector(Ln,a);Hn.subVectors(e,i);let f=Ln.dot(Hn),p=Rn.dot(Hn);if(p>=0&&f<=p)return t.copy(i);let m=f*c-s*p;if(m<=0&&c>=0&&p<=0)return o=c/(c-p),t.copy(n).addScaledVector(Rn,o);let h=l*p-f*u;if(h<=0&&u-l>=0&&f-p>=0)return zn.subVectors(i,r),o=(u-l)/(u-l+(f-p)),t.copy(r).addScaledVector(zn,o);let g=1/(h+m+d);return a=m*g,o=d*g,t.copy(n).addScaledVector(Ln,a).addScaledVector(Rn,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},qn=class{constructor(e=new K(1/0,1/0,1/0),t=new K(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(Yn.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(Yn.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let n=Yn.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let n=e.geometry;if(n!==void 0){let r=n.getAttribute(`position`);if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0)for(let t=0,n=r.count;t<n;t++)e.isMesh===!0?e.getVertexPosition(t,Yn):Yn.fromBufferAttribute(r,t),Yn.applyMatrix4(e.matrixWorld),this.expandByPoint(Yn);else e.boundingBox===void 0?(n.boundingBox===null&&n.computeBoundingBox(),Xn.copy(n.boundingBox)):(e.boundingBox===null&&e.computeBoundingBox(),Xn.copy(e.boundingBox)),Xn.applyMatrix4(e.matrixWorld),this.union(Xn)}let r=e.children;for(let e=0,n=r.length;e<n;e++)this.expandByObject(r[e],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,Yn),Yn.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(rr),ir.subVectors(this.max,rr),Zn.subVectors(e.a,rr),Qn.subVectors(e.b,rr),$n.subVectors(e.c,rr),er.subVectors(Qn,Zn),tr.subVectors($n,Qn),nr.subVectors(Zn,$n);let t=[0,-er.z,er.y,0,-tr.z,tr.y,0,-nr.z,nr.y,er.z,0,-er.x,tr.z,0,-tr.x,nr.z,0,-nr.x,-er.y,er.x,0,-tr.y,tr.x,0,-nr.y,nr.x,0];return!sr(t,Zn,Qn,$n,ir)||(t=[1,0,0,0,1,0,0,0,1],!sr(t,Zn,Qn,$n,ir))?!1:(ar.crossVectors(er,tr),t=[ar.x,ar.y,ar.z],sr(t,Zn,Qn,$n,ir))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,Yn).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(Yn).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()||(Jn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),Jn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),Jn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),Jn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),Jn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),Jn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),Jn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),Jn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(Jn)),this}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}},Jn=[new K,new K,new K,new K,new K,new K,new K,new K],Yn=new K,Xn=new qn,Zn=new K,Qn=new K,$n=new K,er=new K,tr=new K,nr=new K,rr=new K,ir=new K,ar=new K,or=new K;function sr(e,t,n,r,i){for(let a=0,o=e.length-3;a<=o;a+=3){or.fromArray(e,a);let o=i.x*Math.abs(or.x)+i.y*Math.abs(or.y)+i.z*Math.abs(or.z),s=t.dot(or),c=n.dot(or),l=r.dot(or);if(Math.max(-Math.max(s,c,l),Math.min(s,c,l))>o)return!1}return!0}var cr=new K,lr=new G,ur=0,dr=class extends nt{constructor(e,t,n=!1){if(super(),Array.isArray(e))throw TypeError(`THREE.BufferAttribute: array should be a Typed Array.`);this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:ur++}),this.name=``,this.array=e,this.itemSize=t,this.count=e===void 0?0:e.length/t,this.normalized=n,this.usage=He,this.updateRanges=[],this.gpuType=_,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let r=0,i=this.itemSize;r<i;r++)this.array[e+r]=t.array[n+r];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)lr.fromBufferAttribute(this,t),lr.applyMatrix3(e),this.setXY(t,lr.x,lr.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)cr.fromBufferAttribute(this,t),cr.applyMatrix3(e),this.setXYZ(t,cr.x,cr.y,cr.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)cr.fromBufferAttribute(this,t),cr.applyMatrix4(e),this.setXYZ(t,cr.x,cr.y,cr.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)cr.fromBufferAttribute(this,t),cr.applyNormalMatrix(e),this.setXYZ(t,cr.x,cr.y,cr.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)cr.fromBufferAttribute(this,t),cr.transformDirection(e),this.setXYZ(t,cr.x,cr.y,cr.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=Et(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=W(n,this.array)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=Et(t,this.array)),t}setX(e,t){return this.normalized&&(t=W(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=Et(t,this.array)),t}setY(e,t){return this.normalized&&(t=W(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=Et(t,this.array)),t}setZ(e,t){return this.normalized&&(t=W(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=Et(t,this.array)),t}setW(e,t){return this.normalized&&(t=W(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=W(t,this.array),n=W(n,this.array)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,r){return e*=this.itemSize,this.normalized&&(t=W(t,this.array),n=W(n,this.array),r=W(r,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=r,this}setXYZW(e,t,n,r,i){return e*=this.itemSize,this.normalized&&(t=W(t,this.array),n=W(n,this.array),r=W(r,this.array),i=W(i,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=r,this.array[e+3]=i,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return e.name=this.name,e.usage=this.usage,e.gpuType=this.gpuType,e}dispose(){this.dispatchEvent({type:`dispose`})}},fr=class extends dr{constructor(e,t,n){super(new Uint16Array(e),t,n)}},pr=class extends dr{constructor(e,t,n){super(new Uint32Array(e),t,n)}},mr=class extends dr{constructor(e,t,n){super(new Float32Array(e),t,n)}},hr=new qn,gr=new K,_r=new K,vr=class{constructor(e=new K,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let n=this.center;t===void 0?hr.setFromPoints(e).getCenter(n):n.copy(t);let r=0;for(let t=0,i=e.length;t<i;t++)r=Math.max(r,n.distanceToSquared(e[t]));return this.radius=Math.sqrt(r),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius*=e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;gr.subVectors(e,this.center);let t=gr.lengthSq();if(t>this.radius*this.radius){let e=Math.sqrt(t),n=(e-this.radius)*.5;this.center.addScaledVector(gr,n/e),this.radius+=n}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(_r.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(gr.copy(e.center).add(_r)),this.expandByPoint(gr.copy(e.center).sub(_r))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}},yr=0,br=new Y,xr=new Cn,Sr=new K,Cr=new qn,wr=new qn,Tr=new K,Er=class e extends nt{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:yr++}),this.uuid=st(),this.name=``,this.type=`BufferGeometry`,this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(e){return this.index=Array.isArray(e)?new(Ke(e)?pr:fr)(e,1):e,this}setIndirect(e,t=0){return this.indirect=e,this.indirectOffset=t,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let t=new q().getNormalMatrix(e);n.applyNormalMatrix(t),n.needsUpdate=!0}let r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(e),r.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(e){return br.makeRotationFromQuaternion(e),this.applyMatrix4(br),this}rotateX(e){return br.makeRotationX(e),this.applyMatrix4(br),this}rotateY(e){return br.makeRotationY(e),this.applyMatrix4(br),this}rotateZ(e){return br.makeRotationZ(e),this.applyMatrix4(br),this}translate(e,t,n){return br.makeTranslation(e,t,n),this.applyMatrix4(br),this}scale(e,t,n){return br.makeScale(e,t,n),this.applyMatrix4(br),this}lookAt(e){return xr.lookAt(e),xr.updateMatrix(),this.applyMatrix4(xr.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Sr).negate(),this.translate(Sr.x,Sr.y,Sr.z),this}setFromPoints(e){let t=this.getAttribute(`position`);if(t===void 0){let t=[];for(let n=0,r=e.length;n<r;n++){let r=e[n];t.push(r.x,r.y,r.z||0)}this.setAttribute(`position`,new mr(t,3))}else{let n=Math.min(e.length,t.count);for(let r=0;r<n;r++){let n=e[r];t.setXYZ(r,n.x,n.y,n.z||0)}e.length>t.count&&V(`BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry.`),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new qn);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute)H(`BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.`,this),this.boundingBox.set(new K(-1/0,-1/0,-1/0),new K(1/0,1/0,1/0));else{if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let e=0,n=t.length;e<n;e++){let n=t[e];Cr.setFromBufferAttribute(n),this.morphTargetsRelative?(Tr.addVectors(this.boundingBox.min,Cr.min),this.boundingBox.expandByPoint(Tr),Tr.addVectors(this.boundingBox.max,Cr.max),this.boundingBox.expandByPoint(Tr)):(this.boundingBox.expandByPoint(Cr.min),this.boundingBox.expandByPoint(Cr.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&H(`BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.`,this)}}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new vr);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute)H(`BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.`,this),this.boundingSphere.set(new K,1/0);else if(e){let n=this.boundingSphere.center;if(Cr.setFromBufferAttribute(e),t)for(let e=0,n=t.length;e<n;e++){let n=t[e];wr.setFromBufferAttribute(n),this.morphTargetsRelative?(Tr.addVectors(Cr.min,wr.min),Cr.expandByPoint(Tr),Tr.addVectors(Cr.max,wr.max),Cr.expandByPoint(Tr)):(Cr.expandByPoint(wr.min),Cr.expandByPoint(wr.max))}Cr.getCenter(n);let r=0;for(let t=0,i=e.count;t<i;t++)Tr.fromBufferAttribute(e,t),r=Math.max(r,n.distanceToSquared(Tr));if(t)for(let i=0,a=t.length;i<a;i++){let a=t[i],o=this.morphTargetsRelative;for(let t=0,i=a.count;t<i;t++)Tr.fromBufferAttribute(a,t),o&&(Sr.fromBufferAttribute(e,t),Tr.add(Sr)),r=Math.max(r,n.distanceToSquared(Tr))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&H(`BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.`,this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){H(`BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)`);return}let n=t.position,r=t.normal,i=t.uv,a=this.getAttribute(`tangent`);(a===void 0||a.count!==n.count)&&(a=new dr(new Float32Array(4*n.count),4),this.setAttribute(`tangent`,a));let o=[],s=[];for(let e=0;e<n.count;e++)o[e]=new K,s[e]=new K;let c=new K,l=new K,u=new K,d=new G,f=new G,p=new G,m=new K,h=new K;function g(e,t,r){c.fromBufferAttribute(n,e),l.fromBufferAttribute(n,t),u.fromBufferAttribute(n,r),d.fromBufferAttribute(i,e),f.fromBufferAttribute(i,t),p.fromBufferAttribute(i,r),l.sub(c),u.sub(c),f.sub(d),p.sub(d);let a=1/(f.x*p.y-p.x*f.y);isFinite(a)&&(m.copy(l).multiplyScalar(p.y).addScaledVector(u,-f.y).multiplyScalar(a),h.copy(u).multiplyScalar(f.x).addScaledVector(l,-p.x).multiplyScalar(a),o[e].add(m),o[t].add(m),o[r].add(m),s[e].add(h),s[t].add(h),s[r].add(h))}let _=this.groups;_.length===0&&(_=[{start:0,count:e.count}]);for(let t=0,n=_.length;t<n;++t){let n=_[t],r=n.start,i=n.count;for(let t=r,n=r+i;t<n;t+=3)g(e.getX(t+0),e.getX(t+1),e.getX(t+2))}let v=new K,y=new K,b=new K,x=new K;function S(e){b.fromBufferAttribute(r,e),x.copy(b);let t=o[e];v.copy(t),v.sub(b.multiplyScalar(b.dot(t))).normalize(),y.crossVectors(x,t);let n=y.dot(s[e])<0?-1:1;a.setXYZW(e,v.x,v.y,v.z,n)}for(let t=0,n=_.length;t<n;++t){let n=_[t],r=n.start,i=n.count;for(let t=r,n=r+i;t<n;t+=3)S(e.getX(t+0)),S(e.getX(t+1)),S(e.getX(t+2))}this._transformed=!0}computeVertexNormals(){let e=this.index,t=this.getAttribute(`position`);if(t!==void 0){let n=this.getAttribute(`normal`);if(n===void 0||n.count!==t.count)n=new dr(new Float32Array(t.count*3),3),this.setAttribute(`normal`,n);else for(let e=0,t=n.count;e<t;e++)n.setXYZ(e,0,0,0);let r=new K,i=new K,a=new K,o=new K,s=new K,c=new K,l=new K,u=new K;if(e)for(let d=0,f=e.count;d<f;d+=3){let f=e.getX(d+0),p=e.getX(d+1),m=e.getX(d+2);r.fromBufferAttribute(t,f),i.fromBufferAttribute(t,p),a.fromBufferAttribute(t,m),l.subVectors(a,i),u.subVectors(r,i),l.cross(u),o.fromBufferAttribute(n,f),s.fromBufferAttribute(n,p),c.fromBufferAttribute(n,m),o.add(l),s.add(l),c.add(l),n.setXYZ(f,o.x,o.y,o.z),n.setXYZ(p,s.x,s.y,s.z),n.setXYZ(m,c.x,c.y,c.z)}else for(let e=0,o=t.count;e<o;e+=3)r.fromBufferAttribute(t,e+0),i.fromBufferAttribute(t,e+1),a.fromBufferAttribute(t,e+2),l.subVectors(a,i),u.subVectors(r,i),l.cross(u),n.setXYZ(e+0,l.x,l.y,l.z),n.setXYZ(e+1,l.x,l.y,l.z),n.setXYZ(e+2,l.x,l.y,l.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)Tr.fromBufferAttribute(e,t),Tr.normalize(),e.setXYZ(t,Tr.x,Tr.y,Tr.z)}toNonIndexed(){function t(e,t){let n=e.array,r=e.itemSize,i=e.normalized,a=new n.constructor(t.length*r),o=0,s=0;for(let i=0,c=t.length;i<c;i++){o=e.isInterleavedBufferAttribute?t[i]*e.data.stride+e.offset:t[i]*r;for(let e=0;e<r;e++)a[s++]=n[o++]}return new dr(a,r,i)}if(this.index===null)return V(`BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed.`),this;let n=new e,r=this.index.array,i=this.attributes;for(let e in i){let a=i[e],o=t(a,r);n.setAttribute(e,o)}let a=this.morphAttributes;for(let e in a){let i=[],o=a[e];for(let e=0,n=o.length;e<n;e++){let n=o[e],a=t(n,r);i.push(a)}n.morphAttributes[e]=i}n.morphTargetsRelative=this.morphTargetsRelative;let o=this.groups;for(let e=0,t=o.length;e<t;e++){let t=o[e];n.addGroup(t.start,t.count,t.materialIndex)}return n}toJSON(){let e={metadata:{version:4.7,type:`BufferGeometry`,generator:`BufferGeometry.toJSON`}};if(e.uuid=this.uuid,e.type=this.parameters!==void 0&&this._transformed===!0?`BufferGeometry`:this.type,e.name=this.name,Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){let t=this.parameters;for(let n in t)t[n]!==void 0&&(e[n]=t[n]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let n=this.attributes;for(let t in n){let r=n[t];e.data.attributes[t]=r.toJSON(e.data)}let r={},i=!1;for(let t in this.morphAttributes){let n=this.morphAttributes[t],a=[];for(let t=0,r=n.length;t<r;t++){let r=n[t];a.push(r.toJSON(e.data))}a.length>0&&(r[t]=a,i=!0)}i&&(e.data.morphAttributes=r,e.data.morphTargetsRelative=this.morphTargetsRelative);let a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));let o=this.boundingSphere;return o!==null&&(e.data.boundingSphere=o.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let n=e.index;n!==null&&this.setIndex(n.clone());let r=e.attributes;for(let e in r){let n=r[e];this.setAttribute(e,n.clone(t))}let i=e.morphAttributes;for(let e in i){let n=[],r=i[e];for(let e=0,i=r.length;e<i;e++)n.push(r[e].clone(t));this.morphAttributes[e]=n}this.morphTargetsRelative=e.morphTargetsRelative;let a=e.groups;for(let e=0,t=a.length;e<t;e++){let t=a[e];this.addGroup(t.start,t.count,t.materialIndex)}let o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());let s=e.boundingSphere;return s!==null&&(this.boundingSphere=s.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this._transformed=e._transformed,this}dispose(){this.dispatchEvent({type:`dispose`})}},Dr=class{constructor(e,t){this.isInterleavedBuffer=!0,this.array=e,this.stride=t,this.count=e===void 0?0:e.length/t,this.usage=He,this.updateRanges=[],this.version=0,this.uuid=st()}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.array=new e.array.constructor(e.array),this.count=e.count,this.stride=e.stride,this.usage=e.usage,this}copyAt(e,t,n){e*=this.stride,n*=t.stride;for(let r=0,i=this.stride;r<i;r++)this.array[e+r]=t.array[n+r];return this}set(e,t=0){return this.array.set(e,t),this}clone(e){e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=st()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer);let t=new this.array.constructor(e.arrayBuffers[this.array.buffer._uuid]),n=new this.constructor(t,this.stride);return n.setUsage(this.usage),n}onUpload(e){return this.onUploadCallback=e,this}toJSON(e){e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=st()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer)));let t={uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride};return t.usage=this.usage,t}},Or=new K,kr=class e{constructor(e,t,n,r=!1){this.isInterleavedBufferAttribute=!0,this.name=``,this.data=e,this.itemSize=t,this.offset=n,this.normalized=r}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(e){this.data.needsUpdate=e}applyMatrix4(e){for(let t=0,n=this.data.count;t<n;t++)Or.fromBufferAttribute(this,t),Or.applyMatrix4(e),this.setXYZ(t,Or.x,Or.y,Or.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)Or.fromBufferAttribute(this,t),Or.applyNormalMatrix(e),this.setXYZ(t,Or.x,Or.y,Or.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)Or.fromBufferAttribute(this,t),Or.transformDirection(e),this.setXYZ(t,Or.x,Or.y,Or.z);return this}getComponent(e,t){let n=this.array[e*this.data.stride+this.offset+t];return this.normalized&&(n=Et(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=W(n,this.array)),this.data.array[e*this.data.stride+this.offset+t]=n,this}setX(e,t){return this.normalized&&(t=W(t,this.array)),this.data.array[e*this.data.stride+this.offset]=t,this}setY(e,t){return this.normalized&&(t=W(t,this.array)),this.data.array[e*this.data.stride+this.offset+1]=t,this}setZ(e,t){return this.normalized&&(t=W(t,this.array)),this.data.array[e*this.data.stride+this.offset+2]=t,this}setW(e,t){return this.normalized&&(t=W(t,this.array)),this.data.array[e*this.data.stride+this.offset+3]=t,this}getX(e){let t=this.data.array[e*this.data.stride+this.offset];return this.normalized&&(t=Et(t,this.array)),t}getY(e){let t=this.data.array[e*this.data.stride+this.offset+1];return this.normalized&&(t=Et(t,this.array)),t}getZ(e){let t=this.data.array[e*this.data.stride+this.offset+2];return this.normalized&&(t=Et(t,this.array)),t}getW(e){let t=this.data.array[e*this.data.stride+this.offset+3];return this.normalized&&(t=Et(t,this.array)),t}setXY(e,t,n){return e=e*this.data.stride+this.offset,this.normalized&&(t=W(t,this.array),n=W(n,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this}setXYZ(e,t,n,r){return e=e*this.data.stride+this.offset,this.normalized&&(t=W(t,this.array),n=W(n,this.array),r=W(r,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this.data.array[e+2]=r,this}setXYZW(e,t,n,r,i){return e=e*this.data.stride+this.offset,this.normalized&&(t=W(t,this.array),n=W(n,this.array),r=W(r,this.array),i=W(i,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this.data.array[e+2]=r,this.data.array[e+3]=i,this}clone(t){if(t===void 0){Ze(`InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.`);let e=[];for(let t=0;t<this.count;t++){let n=t*this.data.stride+this.offset;for(let t=0;t<this.itemSize;t++)e.push(this.data.array[n+t])}return new dr(new this.array.constructor(e),this.itemSize,this.normalized)}return t.interleavedBuffers===void 0&&(t.interleavedBuffers={}),t.interleavedBuffers[this.data.uuid]===void 0&&(t.interleavedBuffers[this.data.uuid]=this.data.clone(t)),new e(t.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(e){if(e===void 0){Ze(`InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.`);let e=[];for(let t=0;t<this.count;t++){let n=t*this.data.stride+this.offset;for(let t=0;t<this.itemSize;t++)e.push(this.data.array[n+t])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:e,normalized:this.normalized}}return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.toJSON(e)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}},Ar=new K,jr=new K,Mr=new q,Nr=class{constructor(e=new K(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,r){return this.normal.set(e,t,n),this.constant=r,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){let r=Ar.subVectors(n,t).cross(jr.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(r,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t,n=!0){let r=e.delta(Ar),i=this.normal.dot(r);if(i===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let a=-(e.start.dot(this.normal)+this.constant)/i;return n===!0&&(a<0||a>1)?null:t.copy(e.start).addScaledVector(r,a)}intersectsLine(e){let t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let n=t||Mr.getNormalMatrix(e),r=this.coplanarPoint(Ar).applyMatrix4(e),i=this.normal.applyMatrix3(n).normalize();return this.constant=-r.dot(i),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(e){return this.normal.fromArray(e.normal),this.constant=e.constant,this}},Pr=0,Fr=class extends nt{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Pr++}),this.uuid=st(),this.name=``,this.type=`Material`,this.blending=1,this.side=0,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=204,this.blendDst=205,this.blendEquation=100,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new X(0,0,0),this.blendAlpha=0,this.depthFunc=3,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=519,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Ve,this.stencilZFail=Ve,this.stencilZPass=Ve,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let n=e[t];if(n===void 0){V(`Material: parameter '${t}' has value of undefined.`);continue}let r=this[t];r===void 0?V(`Material: '${t}' is not a property of THREE.${this.type}.`):r&&r.isColor?r.set(n):r&&r.isVector2&&n&&n.isVector2||r&&r.isEuler&&n&&n.isEuler||r&&r.isVector3&&n&&n.isVector3?r.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e==`string`;t&&(e={textures:{},images:{}});let n={metadata:{version:4.7,type:`Material`,generator:`Material.toJSON`}};n.uuid=this.uuid,n.type=this.type,n.blending=this.blending,n.side=this.side,n.shadowSide=this.shadowSide,n.vertexColors=this.vertexColors,n.opacity=this.opacity,n.transparent=this.transparent,n.blendSrc=this.blendSrc,n.blendDst=this.blendDst,n.blendEquation=this.blendEquation,n.blendSrcAlpha=this.blendSrcAlpha,n.blendDstAlpha=this.blendDstAlpha,n.blendEquationAlpha=this.blendEquationAlpha,n.blendColor=this.blendColor.getHex(),n.blendAlpha=this.blendAlpha,n.depthFunc=this.depthFunc,n.depthTest=this.depthTest,n.depthWrite=this.depthWrite,n.colorWrite=this.colorWrite,n.clipIntersection=this.clipIntersection,n.clipShadows=this.clipShadows,n.stencilWriteMask=this.stencilWriteMask,n.stencilFunc=this.stencilFunc,n.stencilRef=this.stencilRef,n.stencilFuncMask=this.stencilFuncMask,n.stencilFail=this.stencilFail,n.stencilZFail=this.stencilZFail,n.stencilZPass=this.stencilZPass,n.stencilWrite=this.stencilWrite,n.polygonOffset=this.polygonOffset,n.polygonOffsetFactor=this.polygonOffsetFactor,n.polygonOffsetUnits=this.polygonOffsetUnits,n.dithering=this.dithering,n.alphaTest=this.alphaTest,n.alphaHash=this.alphaHash,n.alphaToCoverage=this.alphaToCoverage,n.premultipliedAlpha=this.premultipliedAlpha,n.forceSinglePass=this.forceSinglePass,n.allowOverride=this.allowOverride,n.visible=this.visible,n.toneMapped=this.toneMapped,n.name=this.name,this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(n.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(n.clippingPlanes=this.clippingPlanes.map(e=>e.toJSON())),this.rotation!==void 0&&(n.rotation=this.rotation),this.depthPacking!==void 0&&(n.depthPacking=this.depthPacking),this.linewidth!==void 0&&(n.linewidth=this.linewidth),this.linecap!==void 0&&(n.linecap=this.linecap),this.linejoin!==void 0&&(n.linejoin=this.linejoin),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.wireframe!==void 0&&(n.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(n.flatShading=this.flatShading),this.fog!==void 0&&(n.fog=this.fog),Object.keys(this.userData).length>0&&(n.userData=this.userData);function r(e){let t=[];for(let n in e){let r=e[n];delete r.metadata,t.push(r)}return t}if(t){let t=r(e.textures),i=r(e.images);t.length>0&&(n.textures=t),i.length>0&&(n.images=i)}return n}fromJSON(e,t){if(e.uuid!==void 0&&(this.uuid=e.uuid),e.name!==void 0&&(this.name=e.name),e.color!==void 0&&this.color!==void 0&&this.color.setHex(e.color),e.roughness!==void 0&&(this.roughness=e.roughness),e.metalness!==void 0&&(this.metalness=e.metalness),e.sheen!==void 0&&(this.sheen=e.sheen),e.sheenColor!==void 0&&(this.sheenColor=new X().setHex(e.sheenColor)),e.sheenRoughness!==void 0&&(this.sheenRoughness=e.sheenRoughness),e.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(e.emissive),e.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(e.specular),e.specularIntensity!==void 0&&(this.specularIntensity=e.specularIntensity),e.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(e.specularColor),e.shininess!==void 0&&(this.shininess=e.shininess),e.clearcoat!==void 0&&(this.clearcoat=e.clearcoat),e.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=e.clearcoatRoughness),e.dispersion!==void 0&&(this.dispersion=e.dispersion),e.retroreflectivity!==void 0&&(this.retroreflectivity=e.retroreflectivity),e.iridescence!==void 0&&(this.iridescence=e.iridescence),e.iridescenceIOR!==void 0&&(this.iridescenceIOR=e.iridescenceIOR),e.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessRange=e.iridescenceThicknessRange),e.transmission!==void 0&&(this.transmission=e.transmission),e.thickness!==void 0&&(this.thickness=e.thickness),e.attenuationDistance!==void 0&&(this.attenuationDistance=e.attenuationDistance),e.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(e.attenuationColor),e.anisotropy!==void 0&&(this.anisotropy=e.anisotropy),e.anisotropyRotation!==void 0&&(this.anisotropyRotation=e.anisotropyRotation),e.fog!==void 0&&(this.fog=e.fog),e.flatShading!==void 0&&(this.flatShading=e.flatShading),e.blending!==void 0&&(this.blending=e.blending),e.combine!==void 0&&(this.combine=e.combine),e.side!==void 0&&(this.side=e.side),e.shadowSide!==void 0&&(this.shadowSide=e.shadowSide),e.opacity!==void 0&&(this.opacity=e.opacity),e.transparent!==void 0&&(this.transparent=e.transparent),e.alphaTest!==void 0&&(this.alphaTest=e.alphaTest),e.alphaHash!==void 0&&(this.alphaHash=e.alphaHash),e.depthFunc!==void 0&&(this.depthFunc=e.depthFunc),e.depthTest!==void 0&&(this.depthTest=e.depthTest),e.depthWrite!==void 0&&(this.depthWrite=e.depthWrite),e.colorWrite!==void 0&&(this.colorWrite=e.colorWrite),e.clippingPlanes!==void 0&&(this.clippingPlanes=e.clippingPlanes.map(e=>new Nr().fromJSON(e))),e.clipIntersection!==void 0&&(this.clipIntersection=e.clipIntersection),e.clipShadows!==void 0&&(this.clipShadows=e.clipShadows),e.depthPacking!==void 0&&(this.depthPacking=e.depthPacking),e.blendSrc!==void 0&&(this.blendSrc=e.blendSrc),e.blendDst!==void 0&&(this.blendDst=e.blendDst),e.blendEquation!==void 0&&(this.blendEquation=e.blendEquation),e.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=e.blendSrcAlpha),e.blendDstAlpha!==void 0&&(this.blendDstAlpha=e.blendDstAlpha),e.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=e.blendEquationAlpha),e.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(e.blendColor),e.blendAlpha!==void 0&&(this.blendAlpha=e.blendAlpha),e.stencilWriteMask!==void 0&&(this.stencilWriteMask=e.stencilWriteMask),e.stencilFunc!==void 0&&(this.stencilFunc=e.stencilFunc),e.stencilRef!==void 0&&(this.stencilRef=e.stencilRef),e.stencilFuncMask!==void 0&&(this.stencilFuncMask=e.stencilFuncMask),e.stencilFail!==void 0&&(this.stencilFail=e.stencilFail),e.stencilZFail!==void 0&&(this.stencilZFail=e.stencilZFail),e.stencilZPass!==void 0&&(this.stencilZPass=e.stencilZPass),e.stencilWrite!==void 0&&(this.stencilWrite=e.stencilWrite),e.wireframe!==void 0&&(this.wireframe=e.wireframe),e.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=e.wireframeLinewidth),e.wireframeLinecap!==void 0&&(this.wireframeLinecap=e.wireframeLinecap),e.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=e.wireframeLinejoin),e.rotation!==void 0&&(this.rotation=e.rotation),e.linewidth!==void 0&&(this.linewidth=e.linewidth),e.linecap!==void 0&&(this.linecap=e.linecap),e.linejoin!==void 0&&(this.linejoin=e.linejoin),e.dashSize!==void 0&&(this.dashSize=e.dashSize),e.gapSize!==void 0&&(this.gapSize=e.gapSize),e.scale!==void 0&&(this.scale=e.scale),e.polygonOffset!==void 0&&(this.polygonOffset=e.polygonOffset),e.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=e.polygonOffsetFactor),e.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=e.polygonOffsetUnits),e.dithering!==void 0&&(this.dithering=e.dithering),e.alphaToCoverage!==void 0&&(this.alphaToCoverage=e.alphaToCoverage),e.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=e.premultipliedAlpha),e.forceSinglePass!==void 0&&(this.forceSinglePass=e.forceSinglePass),e.allowOverride!==void 0&&(this.allowOverride=e.allowOverride),e.visible!==void 0&&(this.visible=e.visible),e.toneMapped!==void 0&&(this.toneMapped=e.toneMapped),e.userData!==void 0&&(this.userData=e.userData),e.vertexColors!==void 0&&(this.vertexColors=typeof e.vertexColors==`number`?e.vertexColors>0:e.vertexColors),e.size!==void 0&&(this.size=e.size),e.sizeAttenuation!==void 0&&(this.sizeAttenuation=e.sizeAttenuation),e.map!==void 0&&(this.map=t[e.map]||null),e.matcap!==void 0&&(this.matcap=t[e.matcap]||null),e.alphaMap!==void 0&&(this.alphaMap=t[e.alphaMap]||null),e.bumpMap!==void 0&&(this.bumpMap=t[e.bumpMap]||null),e.bumpScale!==void 0&&(this.bumpScale=e.bumpScale),e.normalMap!==void 0&&(this.normalMap=t[e.normalMap]||null),e.normalMapType!==void 0&&(this.normalMapType=e.normalMapType),e.normalScale!==void 0){let t=e.normalScale;Array.isArray(t)===!1&&(t=[t,t]),this.normalScale=new G().fromArray(t)}return e.displacementMap!==void 0&&(this.displacementMap=t[e.displacementMap]||null),e.displacementScale!==void 0&&(this.displacementScale=e.displacementScale),e.displacementBias!==void 0&&(this.displacementBias=e.displacementBias),e.roughnessMap!==void 0&&(this.roughnessMap=t[e.roughnessMap]||null),e.metalnessMap!==void 0&&(this.metalnessMap=t[e.metalnessMap]||null),e.emissiveMap!==void 0&&(this.emissiveMap=t[e.emissiveMap]||null),e.emissiveIntensity!==void 0&&(this.emissiveIntensity=e.emissiveIntensity),e.specularMap!==void 0&&(this.specularMap=t[e.specularMap]||null),e.specularIntensityMap!==void 0&&(this.specularIntensityMap=t[e.specularIntensityMap]||null),e.specularColorMap!==void 0&&(this.specularColorMap=t[e.specularColorMap]||null),e.envMap!==void 0&&(this.envMap=t[e.envMap]||null),e.envMapRotation!==void 0&&this.envMapRotation.fromArray(e.envMapRotation),e.envMapIntensity!==void 0&&(this.envMapIntensity=e.envMapIntensity),e.reflectivity!==void 0&&(this.reflectivity=e.reflectivity),e.refractionRatio!==void 0&&(this.refractionRatio=e.refractionRatio),e.lightMap!==void 0&&(this.lightMap=t[e.lightMap]||null),e.lightMapIntensity!==void 0&&(this.lightMapIntensity=e.lightMapIntensity),e.aoMap!==void 0&&(this.aoMap=t[e.aoMap]||null),e.aoMapIntensity!==void 0&&(this.aoMapIntensity=e.aoMapIntensity),e.gradientMap!==void 0&&(this.gradientMap=t[e.gradientMap]||null),e.clearcoatMap!==void 0&&(this.clearcoatMap=t[e.clearcoatMap]||null),e.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=t[e.clearcoatRoughnessMap]||null),e.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=t[e.clearcoatNormalMap]||null),e.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new G().fromArray(e.clearcoatNormalScale)),e.iridescenceMap!==void 0&&(this.iridescenceMap=t[e.iridescenceMap]||null),e.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=t[e.iridescenceThicknessMap]||null),e.transmissionMap!==void 0&&(this.transmissionMap=t[e.transmissionMap]||null),e.thicknessMap!==void 0&&(this.thicknessMap=t[e.thicknessMap]||null),e.anisotropyMap!==void 0&&(this.anisotropyMap=t[e.anisotropyMap]||null),e.sheenColorMap!==void 0&&(this.sheenColorMap=t[e.sheenColorMap]||null),e.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=t[e.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,n=null;if(t!==null){let e=t.length;n=Array(e);for(let r=0;r!==e;++r)n[r]=t[r].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:`dispose`})}set needsUpdate(e){e===!0&&this.version++}},Ir=new K,Lr=new K,Rr=new K,zr=new K,Br=class{constructor(e=new K,t=new K(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,Ir)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=Ir.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(Ir.copy(this.origin).addScaledVector(this.direction,t),Ir.distanceToSquared(e))}distanceSqToSegment(e,t,n,r){Lr.copy(e).add(t).multiplyScalar(.5),Rr.copy(t).sub(e).normalize(),zr.copy(this.origin).sub(Lr);let i=e.distanceTo(t)*.5,a=-this.direction.dot(Rr),o=zr.dot(this.direction),s=-zr.dot(Rr),c=zr.lengthSq(),l=Math.abs(1-a*a),u,d,f,p;if(l>0){if(u=a*s-o,d=a*o-s,p=i*l,u>=0){if(d>=-p){if(d<=p){let e=1/l;u*=e,d*=e,f=u*(u+a*d+2*o)+d*(a*u+d+2*s)+c}else d=i,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*s)+c}else d=-i,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*s)+c}else d<=-p?(u=Math.max(0,-(-a*i+o)),d=u>0?-i:Math.min(Math.max(-i,-s),i),f=-u*u+d*(d+2*s)+c):d<=p?(u=0,d=Math.min(Math.max(-i,-s),i),f=d*(d+2*s)+c):(u=Math.max(0,-(a*i+o)),d=u>0?i:Math.min(Math.max(-i,-s),i),f=-u*u+d*(d+2*s)+c)}else d=a>0?-i:i,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*s)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,u),r&&r.copy(Lr).addScaledVector(Rr,d),f}intersectSphere(e,t){if(e.radius<0)return null;Ir.subVectors(e.center,this.origin);let n=Ir.dot(this.direction),r=Ir.dot(Ir)-n*n,i=e.radius*e.radius;if(r>i)return null;let a=Math.sqrt(i-r),o=n-a,s=n+a;return s<0?null:o<0?this.at(s,t):this.at(o,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){let n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,r,i,a,o,s,c=1/this.direction.x,l=1/this.direction.y,u=1/this.direction.z,d=this.origin;return c>=0?(n=(e.min.x-d.x)*c,r=(e.max.x-d.x)*c):(n=(e.max.x-d.x)*c,r=(e.min.x-d.x)*c),l>=0?(i=(e.min.y-d.y)*l,a=(e.max.y-d.y)*l):(i=(e.max.y-d.y)*l,a=(e.min.y-d.y)*l),n>a||i>r||((i>n||isNaN(n))&&(n=i),(a<r||isNaN(r))&&(r=a),u>=0?(o=(e.min.z-d.z)*u,s=(e.max.z-d.z)*u):(o=(e.max.z-d.z)*u,s=(e.min.z-d.z)*u),n>s||o>r)||((o>n||n!==n)&&(n=o),(s<r||r!==r)&&(r=s),r<0)?null:this.at(n>=0?n:r,t)}intersectsBox(e){return this.intersectBox(e,Ir)!==null}intersectTriangle(e,t,n,r,i){let a=this.origin,o=this.direction,s=o.x,c=o.y,l=o.z,u=e.x-a.x,d=e.y-a.y,f=e.z-a.z,p=t.x-a.x,m=t.y-a.y,h=t.z-a.z,g=n.x-a.x,_=n.y-a.y,v=n.z-a.z,y=Math.abs(s),b=Math.abs(c),x=Math.abs(l),S,C,w,T,E,D,O,k,A,j,ee,te;if(y>=b&&y>=x?(w=s,D=u,A=p,te=g,s>=0?(S=c,C=l,T=d,E=f,O=m,k=h,j=_,ee=v):(S=l,C=c,T=f,E=d,O=h,k=m,j=v,ee=_)):b>=x?(w=c,D=d,A=m,te=_,c>=0?(S=l,C=s,T=f,E=u,O=h,k=p,j=v,ee=g):(S=s,C=l,T=u,E=f,O=p,k=h,j=g,ee=v)):(w=l,D=f,A=h,te=v,l>=0?(S=s,C=c,T=u,E=d,O=p,k=m,j=g,ee=_):(S=c,C=s,T=d,E=u,O=m,k=p,j=_,ee=g)),w===0)return null;let M=S/w,N=C/w,P=1/w,ne=T-M*D,F=E-N*D,re=O-M*A,ie=k-N*A,ae=j-M*te,oe=ee-N*te,se=ae*ie-oe*re,I=ne*oe-F*ae,ce=re*F-ie*ne;if(r){if(se<0||I<0||ce<0)return null}else if((se<0||I<0||ce<0)&&(se>0||I>0||ce>0))return null;let le=se+I+ce;if(le===0)return null;let ue=P*(se*D+I*A+ce*te);return(le>0?ue<0:ue>0)?null:this.at(ue/le,i)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},Vr=class extends Fr{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type=`MeshBasicMaterial`,this.color=new X(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new on,this.combine=0,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap=`round`,this.wireframeLinejoin=`round`,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}},Hr=new Y,Ur=new Br,Wr=new vr,Gr=new K,Kr=new K,qr=new K,Jr=new K,Yr=new K,Xr=new K,Zr=new K,Qr=new K,$r=class extends Cn{constructor(e=new Er,t=new Vr){super(),this.isMesh=!0,this.type=`Mesh`,this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let e=this.geometry.morphAttributes,t=Object.keys(e);if(t.length>0){let n=e[t[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let e=0,t=n.length;e<t;e++){let t=n[e].name||String(e);this.morphTargetInfluences.push(0),this.morphTargetDictionary[t]=e}}}}getVertexPosition(e,t){let n=this.geometry,r=n.attributes.position,i=n.morphAttributes.position,a=n.morphTargetsRelative;t.fromBufferAttribute(r,e);let o=this.morphTargetInfluences;if(i&&o){Xr.set(0,0,0);for(let n=0,r=i.length;n<r;n++){let r=o[n],s=i[n];r!==0&&(Yr.fromBufferAttribute(s,e),a?Xr.addScaledVector(Yr,r):Xr.addScaledVector(Yr.sub(t),r))}t.add(Xr)}return t}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let n=this.geometry,r=this.material,i=this.matrixWorld;r!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),Wr.copy(n.boundingSphere),Wr.applyMatrix4(i),Ur.copy(e.ray).recast(e.near),!(Wr.containsPoint(Ur.origin)===!1&&(Ur.intersectSphere(Wr,Gr)===null||Ur.origin.distanceToSquared(Gr)>(e.far-e.near)**2))&&(Hr.copy(i).invert(),Ur.copy(e.ray).applyMatrix4(Hr),(n.boundingBox===null||Ur.intersectsBox(n.boundingBox)!==!1)&&this._computeIntersections(e,t,Ur)))}_computeIntersections(e,t,n){let r,i=this.geometry,a=this.material,o=i.index,s=i.attributes.position,c=i.attributes.uv,l=i.attributes.uv1,u=i.attributes.normal,d=i.groups,f=i.drawRange;if(o!==null){if(Array.isArray(a))for(let i=0,s=d.length;i<s;i++){let s=d[i],p=a[s.materialIndex],m=Math.max(s.start,f.start),h=Math.min(o.count,Math.min(s.start+s.count,f.start+f.count));for(let i=m,a=h;i<a;i+=3){let a=o.getX(i),d=o.getX(i+1),f=o.getX(i+2);r=ti(this,p,e,n,c,l,u,a,d,f),r&&(r.faceIndex=Math.floor(i/3),r.face.materialIndex=s.materialIndex,t.push(r))}}else{let i=Math.max(0,f.start),s=Math.min(o.count,f.start+f.count);for(let d=i,f=s;d<f;d+=3){let i=o.getX(d),s=o.getX(d+1),f=o.getX(d+2);r=ti(this,a,e,n,c,l,u,i,s,f),r&&(r.faceIndex=Math.floor(d/3),t.push(r))}}}else if(s!==void 0){if(Array.isArray(a))for(let i=0,o=d.length;i<o;i++){let o=d[i],p=a[o.materialIndex],m=Math.max(o.start,f.start),h=Math.min(s.count,Math.min(o.start+o.count,f.start+f.count));for(let i=m,a=h;i<a;i+=3){let a=i,s=i+1,d=i+2;r=ti(this,p,e,n,c,l,u,a,s,d),r&&(r.faceIndex=Math.floor(i/3),r.face.materialIndex=o.materialIndex,t.push(r))}}else{let i=Math.max(0,f.start),o=Math.min(s.count,f.start+f.count);for(let s=i,d=o;s<d;s+=3){let i=s,o=s+1,d=s+2;r=ti(this,a,e,n,c,l,u,i,o,d),r&&(r.faceIndex=Math.floor(s/3),t.push(r))}}}}};function ei(e,t,n,r,i,a,o,s){let c;if(c=t.side===1?r.intersectTriangle(o,a,i,!0,s):r.intersectTriangle(i,a,o,t.side===0,s),c===null)return null;Qr.copy(s),Qr.applyMatrix4(e.matrixWorld);let l=n.ray.origin.distanceTo(Qr);return l<n.near||l>n.far?null:{distance:l,point:Qr.clone(),object:e}}function ti(e,t,n,r,i,a,o,s,c,l){e.getVertexPosition(s,Kr),e.getVertexPosition(c,qr),e.getVertexPosition(l,Jr);let u=ei(e,t,n,r,Kr,qr,Jr,Zr);if(u){let e=new K;Kn.getBarycoord(Zr,Kr,qr,Jr,e),i&&(u.uv=Kn.getInterpolatedAttribute(i,s,c,l,e,new G)),a&&(u.uv1=Kn.getInterpolatedAttribute(a,s,c,l,e,new G)),o&&(u.normal=Kn.getInterpolatedAttribute(o,s,c,l,e,new K),u.normal.dot(r.direction)>0&&u.normal.multiplyScalar(-1));let t={a:s,b:c,c:l,normal:new K,materialIndex:0};Kn.getNormal(Kr,qr,Jr,t.normal),u.face=t,u.barycoord=e}return u}var ni=class extends Wt{constructor(e=null,t=1,n=1,r,i,o,s,c,l=a,u=a,d,f){super(null,o,s,c,l,u,r,i,d,f),this.isDataTexture=!0,this.image={data:e,width:t,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}},ri=class extends dr{constructor(e,t,n,r=1){super(e,t,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=r}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){let e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}},ii=new Y,ai=new Y,oi=[],si=new qn,ci=new Y,li=new $r,ui=new vr,di=class extends $r{constructor(e,t,n){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new ri(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let e=0;e<n;e++)this.setMatrixAt(e,ci)}computeBoundingBox(){let e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new qn),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,ii),si.copy(e.boundingBox).applyMatrix4(ii),this.boundingBox.union(si)}computeBoundingSphere(){let e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new vr),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,ii),ui.copy(e.boundingSphere).applyMatrix4(ii),this.boundingSphere.union(ui)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),e.morphTexture!==null&&(this.morphTexture=e.morphTexture.clone()),e.instanceColor!==null&&(this.instanceColor=e.instanceColor.clone()),this.count=e.count,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}getColorAt(e,t){return this.instanceColor===null?t.setRGB(1,1,1):t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){return t.fromArray(this.instanceMatrix.array,e*16)}getMorphAt(e,t){let n=t.morphTargetInfluences,r=this.morphTexture.source.data.data,i=e*(n.length+1)+1;for(let e=0;e<n.length;e++)n[e]=r[i+e]}raycast(e,t){let n=this.matrixWorld,r=this.count;if(li.geometry=this.geometry,li.material=this.material,li.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),ui.copy(this.boundingSphere),ui.applyMatrix4(n),e.ray.intersectsSphere(ui)!==!1))for(let i=0;i<r;i++){this.getMatrixAt(i,ii),ai.multiplyMatrices(n,ii),li.matrixWorld=ai,li.raycast(e,oi);for(let e=0,n=oi.length;e<n;e++){let n=oi[e];n.instanceId=i,n.object=this,t.push(n)}oi.length=0}}setColorAt(e,t){return this.instanceColor===null&&(this.instanceColor=new ri(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),t.toArray(this.instanceColor.array,e*3),this}setMatrixAt(e,t){return t.toArray(this.instanceMatrix.array,e*16),this}setMorphAt(e,t){let n=t.morphTargetInfluences,r=n.length+1;this.morphTexture===null&&(this.morphTexture=new ni(new Float32Array(r*this.count),r,this.count,k,_));let i=this.morphTexture.source.data.data,a=0;for(let e=0;e<n.length;e++)a+=n[e];let o=this.geometry.morphTargetsRelative?1:1-a,s=r*e;return i[s]=o,i.set(n,s+1),this}updateMorphTargets(){}dispose(){super.dispose(),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null)}},fi=new vr,pi=new G(.5,.5),mi=new K,hi=class{constructor(e=new Nr,t=new Nr,n=new Nr,r=new Nr,i=new Nr,a=new Nr){this.planes=[e,t,n,r,i,a]}set(e,t,n,r,i,a){let o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(n),o[3].copy(r),o[4].copy(i),o[5].copy(a),this}copy(e){let t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=Ge,n=!1){let r=this.planes,i=e.elements,a=i[0],o=i[1],s=i[2],c=i[3],l=i[4],u=i[5],d=i[6],f=i[7],p=i[8],m=i[9],h=i[10],g=i[11],_=i[12],v=i[13],y=i[14],b=i[15];if(r[0].setComponents(c-a,f-l,g-p,b-_).normalize(),r[1].setComponents(c+a,f+l,g+p,b+_).normalize(),r[2].setComponents(c+o,f+u,g+m,b+v).normalize(),r[3].setComponents(c-o,f-u,g-m,b-v).normalize(),n)r[4].setComponents(s,d,h,y).normalize(),r[5].setComponents(c-s,f-d,g-h,b-y).normalize();else if(r[4].setComponents(c-s,f-d,g-h,b-y).normalize(),t===2e3)r[5].setComponents(c+s,f+d,g+h,b+y).normalize();else if(t===2001)r[5].setComponents(s,d,h,y).normalize();else throw Error(`THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: `+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),fi.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),fi.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(fi)}intersectsSprite(e){return fi.center.set(0,0,0),fi.radius=.7071067811865476+pi.distanceTo(e.center),fi.applyMatrix4(e.matrixWorld),this.intersectsSphere(fi)}intersectsSphere(e){let t=this.planes,n=e.center,r=-e.radius;for(let e=0;e<6;e++)if(t[e].distanceToPoint(n)<r)return!1;return!0}intersectsBox(e){let t=this.planes;for(let n=0;n<6;n++){let r=t[n];if(mi.x=r.normal.x>0?e.max.x:e.min.x,mi.y=r.normal.y>0?e.max.y:e.min.y,mi.z=r.normal.z>0?e.max.z:e.min.z,r.distanceToPoint(mi)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}},gi=class extends Wt{constructor(e=[],t=301,n,r,i,a,o,s,c,l){super(e,t,n,r,i,a,o,s,c,l),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}},_i=class extends Wt{constructor(e,t,n=g,r,i,o,s=a,c=a,l,u=D,d=1){if(u!==1026&&u!==1027)throw Error(`THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat`);super({width:e,height:t,depth:d},r,i,o,s,c,u,n,l),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new Bt(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return t.compareFunction=this.compareFunction,t}},vi=class extends _i{constructor(e,t=g,n=301,r,i,o=a,s=a,c,l=D){let u={width:e,height:e,depth:1},d=[u,u,u,u,u,u];super(e,e,t,n,r,i,o,s,c,l),this.image=d,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}},yi=class extends Wt{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}},bi=class e extends Er{constructor(e=1,t=1,n=1,r=1,i=1,a=1){super(),this.type=`BoxGeometry`,this.parameters={width:e,height:t,depth:n,widthSegments:r,heightSegments:i,depthSegments:a};let o=this;r=Math.floor(r),i=Math.floor(i),a=Math.floor(a);let s=[],c=[],l=[],u=[],d=0,f=0;p(`z`,`y`,`x`,-1,-1,n,t,e,a,i,0),p(`z`,`y`,`x`,1,-1,n,t,-e,a,i,1),p(`x`,`z`,`y`,1,1,e,n,t,r,a,2),p(`x`,`z`,`y`,1,-1,e,n,-t,r,a,3),p(`x`,`y`,`z`,1,-1,e,t,n,r,i,4),p(`x`,`y`,`z`,-1,-1,e,t,-n,r,i,5),this.setIndex(s),this.setAttribute(`position`,new mr(c,3)),this.setAttribute(`normal`,new mr(l,3)),this.setAttribute(`uv`,new mr(u,2));function p(e,t,n,r,i,a,p,m,h,g,_){let v=a/h,y=p/g,b=a/2,x=p/2,S=m/2,C=h+1,w=g+1,T=0,E=0,D=new K;for(let a=0;a<w;a++){let o=a*y-x;for(let s=0;s<C;s++)D[e]=(s*v-b)*r,D[t]=o*i,D[n]=S,c.push(D.x,D.y,D.z),D[e]=0,D[t]=0,D[n]=m>0?1:-1,l.push(D.x,D.y,D.z),u.push(s/h),u.push(1-a/g),T+=1}for(let e=0;e<g;e++)for(let t=0;t<h;t++){let n=d+t+C*e,r=d+t+C*(e+1),i=d+(t+1)+C*(e+1),a=d+(t+1)+C*e;s.push(n,r,a),s.push(r,i,a),E+=6}o.addGroup(f,E,_),f+=E,d+=T}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}},xi=class e extends Er{constructor(e=1,t=1,n=1,r=1){super(),this.type=`PlaneGeometry`,this.parameters={width:e,height:t,widthSegments:n,heightSegments:r};let i=e/2,a=t/2,o=Math.floor(n),s=Math.floor(r),c=o+1,l=s+1,u=e/o,d=t/s,f=[],p=[],m=[],h=[];for(let e=0;e<l;e++){let t=e*d-a;for(let n=0;n<c;n++){let r=n*u-i;p.push(r,-t,0),m.push(0,0,1),h.push(n/o),h.push(1-e/s)}}for(let e=0;e<s;e++)for(let t=0;t<o;t++){let n=t+c*e,r=t+c*(e+1),i=t+1+c*(e+1),a=t+1+c*e;f.push(n,r,a),f.push(r,i,a)}this.setIndex(f),this.setAttribute(`position`,new mr(p,3)),this.setAttribute(`normal`,new mr(m,3)),this.setAttribute(`uv`,new mr(h,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.width,t.height,t.widthSegments,t.heightSegments)}};function Si(e){let t={};for(let n in e){t[n]={};for(let r in e[n]){let i=e[n][r];if(wi(i))i.isRenderTargetTexture?(V(`UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms().`),t[n][r]=null):t[n][r]=i.clone();else if(Array.isArray(i)){if(wi(i[0])){let e=[];for(let t=0,n=i.length;t<n;t++)e[t]=i[t].clone();t[n][r]=e}else t[n][r]=i.slice()}else t[n][r]=i}}return t}function Ci(e){let t={};for(let n=0;n<e.length;n++){let r=Si(e[n]);for(let e in r)t[e]=r[e]}return t}function wi(e){return e&&(e.isColor||e.isMatrix3||e.isMatrix4||e.isVector2||e.isVector3||e.isVector4||e.isTexture||e.isQuaternion)}function Ti(e){let t=[];for(let n=0;n<e.length;n++)t.push(e[n].clone());return t}function Ei(e){let t=e.getRenderTarget();return t===null?e.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:J.workingColorSpace}var Di={clone:Si,merge:Ci},Oi=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,ki=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,Ai=class extends Fr{constructor(e){super(),this.isShaderMaterial=!0,this.type=`ShaderMaterial`,this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Oi,this.fragmentShader=ki,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=Si(e.uniforms),this.uniformsGroups=Ti(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let n in this.uniforms){let r=this.uniforms[n].value;r&&r.isTexture?t.uniforms[n]={type:`t`,value:r.toJSON(e).uuid}:r&&r.isColor?t.uniforms[n]={type:`c`,value:r.getHex()}:r&&r.isVector2?t.uniforms[n]={type:`v2`,value:r.toArray()}:r&&r.isVector3?t.uniforms[n]={type:`v3`,value:r.toArray()}:r&&r.isVector4?t.uniforms[n]={type:`v4`,value:r.toArray()}:r&&r.isMatrix3?t.uniforms[n]={type:`m3`,value:r.toArray()}:r&&r.isMatrix4?t.uniforms[n]={type:`m4`,value:r.toArray()}:t.uniforms[n]={value:r}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let n={};for(let e in this.extensions)this.extensions[e]===!0&&(n[e]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}fromJSON(e,t){if(super.fromJSON(e,t),e.uniforms!==void 0)for(let n in e.uniforms){let r=e.uniforms[n];switch(this.uniforms[n]={},r.type){case`t`:this.uniforms[n].value=t[r.value]||null;break;case`c`:this.uniforms[n].value=new X().setHex(r.value);break;case`v2`:this.uniforms[n].value=new G().fromArray(r.value);break;case`v3`:this.uniforms[n].value=new K().fromArray(r.value);break;case`v4`:this.uniforms[n].value=new Gt().fromArray(r.value);break;case`m3`:this.uniforms[n].value=new q().fromArray(r.value);break;case`m4`:this.uniforms[n].value=new Y().fromArray(r.value);break;default:this.uniforms[n].value=r.value}}if(e.defines!==void 0&&(this.defines=e.defines),e.vertexShader!==void 0&&(this.vertexShader=e.vertexShader),e.fragmentShader!==void 0&&(this.fragmentShader=e.fragmentShader),e.glslVersion!==void 0&&(this.glslVersion=e.glslVersion),e.extensions!==void 0)for(let t in e.extensions)this.extensions[t]=e.extensions[t];return e.lights!==void 0&&(this.lights=e.lights),e.clipping!==void 0&&(this.clipping=e.clipping),this}},ji=class extends Ai{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type=`RawShaderMaterial`}},Mi=class extends Fr{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type=`MeshDepthMaterial`,this.depthPacking=Ie,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},Ni=class extends Fr{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type=`MeshDistanceMaterial`,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}};function Pi(e,t){return!e||e.constructor===t?e:typeof t.BYTES_PER_ELEMENT==`number`?new t(e):Array.prototype.slice.call(e)}function Fi(e){return e!==void 0&&e.inTangents!==void 0&&e.outTangents!==void 0}var Ii=class{constructor(e,t,n,r){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=r===void 0?new t.constructor(n):r,this.sampleValues=t,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,n=this._cachedIndex,r=t[n],i=t[n-1];validate_interval:{seek:{let a;linear_scan:{forward_scan:if(!(e<r)){for(let a=n+2;;){if(r===void 0){if(e<i)break forward_scan;return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===a)break;if(i=r,r=t[++n],e<r)break seek}a=t.length;break linear_scan}if(!(e>=i)){let o=t[1];e<o&&(n=2,i=o);for(let a=n-2;;){if(i===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===a)break;if(r=i,i=t[--n-1],e>=i)break seek}a=n,n=0;break linear_scan}break validate_interval}for(;n<a;){let r=n+a>>>1;e<t[r]?a=r:n=r+1}if(r=t[n],i=t[n-1],i===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(r===void 0)return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,i,r)}return this.interpolate_(n,i,e,r)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,n=this.sampleValues,r=this.valueSize,i=e*r;for(let e=0;e!==r;++e)t[e]=n[i+e];return t}interpolate_(){throw Error(`THREE.Interpolant: Call to abstract method.`)}intervalChanged_(){}},Li=class extends Ii{constructor(e,t,n,r){super(e,t,n,r),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:Fe,endingEnd:Fe}}intervalChanged_(e,t,n){let r=this.parameterPositions,i=e-2,a=e+1,o=r[i],s=r[a];if(o===void 0)switch(this.getSettings_().endingStart){case z:i=e,o=2*t-n;break;case B:i=r.length-2,o=t+r[i]-r[i+1];break;default:i=e,o=n}if(s===void 0)switch(this.getSettings_().endingEnd){case z:a=e,s=2*n-t;break;case B:a=1,s=n+r[1]-r[0];break;default:a=e-1,s=t}let c=(n-t)*.5,l=this.valueSize;this._weightPrev=c/(t-o),this._weightNext=c/(s-n),this._offsetPrev=i*l,this._offsetNext=a*l}interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=e*o,c=s-o,l=this._offsetPrev,u=this._offsetNext,d=this._weightPrev,f=this._weightNext,p=(n-t)/(r-t),m=p*p,h=m*p,g=-d*h+2*d*m-d*p,_=(1+d)*h+(-1.5-2*d)*m+(-.5+d)*p+1,v=(-1-f)*h+(1.5+f)*m+.5*p,y=f*h-f*m;for(let e=0;e!==o;++e)i[e]=g*a[l+e]+_*a[c+e]+v*a[s+e]+y*a[u+e];return i}},Ri=class extends Ii{constructor(e,t,n,r){super(e,t,n,r)}interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=e*o,c=s-o,l=(n-t)/(r-t),u=1-l;for(let e=0;e!==o;++e)i[e]=a[c+e]*u+a[s+e]*l;return i}},zi=class extends Ii{constructor(e,t,n,r){super(e,t,n,r)}interpolate_(e){return this.copySampleValue_(e-1)}},Bi=class extends Ii{interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=e*o,c=s-o,l=this.inTangents,u=this.outTangents;if(!l||!u){let e=(n-t)/(r-t),l=1-e;for(let t=0;t!==o;++t)i[t]=a[c+t]*l+a[s+t]*e;return i}let d=o*2,f=e-1;for(let p=0;p!==o;++p){let o=a[c+p],m=a[s+p],h=f*d+p*2,g=u[h],_=u[h+1],v=e*d+p*2,y=l[v],b=l[v+1],x=Ui(n,t,g,y,r);i[p]=Vi(x,o,_,b,m)}return i}};function Vi(e,t,n,r,i){let a=1-e;return a*a*a*t+3*a*a*e*n+3*a*e*e*r+e*e*e*i}function Hi(e,t,n,r,i){let a=1-e;return 3*a*a*(n-t)+6*a*e*(r-n)+3*e*e*(i-r)}function Ui(e,t,n,r,i){let a=(e-t)/(i-t);for(let o=0;o<8;o++){let o=Vi(a,t,n,r,i)-e;if(Math.abs(o)<1e-10)break;let s=Hi(a,t,n,r,i);if(Math.abs(s)<1e-10)break;a=Math.max(0,Math.min(1,a-o/s))}return a}var Wi=class{constructor(e,t,n,r){if(e===void 0)throw Error(`THREE.KeyframeTrack: track name is undefined`);if(t===void 0||t.length===0)throw Error(`THREE.KeyframeTrack: no keyframes in track named `+e);this.name=e,this.times=Pi(t,this.TimeBufferType),this.values=Pi(n,this.ValueBufferType),this.setInterpolation(r||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,n;if(t.toJSON!==this.toJSON)n=t.toJSON(e);else{n={name:e.name,times:Pi(e.times,Array),values:Pi(e.values,Array)};let t=e.getInterpolation();t!==e.DefaultInterpolation&&(n.interpolation=t),Fi(e.settings)&&(n.settings={inTangents:Pi(e.settings.inTangents,Array),outTangents:Pi(e.settings.outTangents,Array)})}return n.type=e.ValueTypeName,n}InterpolantFactoryMethodDiscrete(e){return new zi(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new Ri(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new Li(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodBezier(e){let t=new Bi(this.times,this.values,this.getValueSize(),e);return this.settings&&(t.inTangents=this.settings.inTangents,t.outTangents=this.settings.outTangents),t}setInterpolation(e){let t;switch(e){case Me:t=this.InterpolantFactoryMethodDiscrete;break;case Ne:t=this.InterpolantFactoryMethodLinear;break;case Pe:t=this.InterpolantFactoryMethodSmooth;break;case R:t=this.InterpolantFactoryMethodBezier}if(t===void 0){let t=`unsupported interpolation for `+this.ValueTypeName+` keyframe track named `+this.name;if(this.createInterpolant===void 0){if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw Error(t)}return V(`KeyframeTrack:`,t),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Me;case this.InterpolantFactoryMethodLinear:return Ne;case this.InterpolantFactoryMethodSmooth:return Pe;case this.InterpolantFactoryMethodBezier:return R}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let n=0,r=t.length;n!==r;++n)t[n]+=e}return this}scale(e){if(e!==1){let t=this.times;for(let n=0,r=t.length;n!==r;++n)t[n]*=e;Fi(this.settings)&&(Gi(this.settings.inTangents,e),Gi(this.settings.outTangents,e))}return this}trim(e,t){let n=this.times,r=n.length,i=0,a=r-1;for(;i!==r&&n[i]<e;)++i;for(;a!==-1&&n[a]>t;)--a;if(++a,i!==0||a!==r){i>=a&&(a=Math.max(a,1),i=a-1);let e=this.getValueSize();this.times=n.slice(i,a),this.values=this.values.slice(i*e,a*e)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(H(`KeyframeTrack: Invalid value size in track.`,this),e=!1);let n=this.times,r=this.values,i=n.length;i===0&&(H(`KeyframeTrack: Track is empty.`,this),e=!1);let a=null;for(let t=0;t!==i;t++){let r=n[t];if(typeof r==`number`&&isNaN(r)){H(`KeyframeTrack: Time is not a valid number.`,this,t,r),e=!1;break}if(a!==null&&a>r){H(`KeyframeTrack: Out of order keys.`,this,t,r,a),e=!1;break}a=r}if(r!==void 0&&qe(r))for(let t=0,n=r.length;t!==n;++t){let n=r[t];if(isNaN(n)){H(`KeyframeTrack: Value is not a valid number.`,this,t,n),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),n=this.getValueSize(),r=this.getInterpolation()===Pe,i=e.length-1,a=1;for(let o=1;o<i;++o){let i=!1,s=e[o];if(s!==e[o+1]&&(o!==1||s!==e[0])){if(r)i=!0;else{let e=o*n,r=e-n,a=e+n;for(let o=0;o!==n;++o){let n=t[e+o];if(n!==t[r+o]||n!==t[a+o]){i=!0;break}}}}if(i){if(o!==a){e[a]=e[o];let r=o*n,i=a*n;for(let e=0;e!==n;++e)t[i+e]=t[r+e]}++a}}if(i>0){e[a]=e[i];for(let e=i*n,r=a*n,o=0;o!==n;++o)t[r+o]=t[e+o];++a}return a===e.length?(this.times=e,this.values=t):(this.times=e.slice(0,a),this.values=t.slice(0,a*n)),this}clone(){let e=this.times.slice(),t=this.values.slice(),n=this.constructor,r=new n(this.name,e,t);return r.createInterpolant=this.createInterpolant,Fi(this.settings)&&(r.settings={inTangents:this.settings.inTangents.slice(),outTangents:this.settings.outTangents.slice()}),r}};function Gi(e,t){for(let n=0,r=e.length;n!==r;n+=2)e[n]*=t}Wi.prototype.ValueTypeName=``,Wi.prototype.TimeBufferType=Float32Array,Wi.prototype.ValueBufferType=Float32Array,Wi.prototype.DefaultInterpolation=Ne;var Ki=class extends Wi{constructor(e,t,n){super(e,t,n)}};Ki.prototype.ValueTypeName=`bool`,Ki.prototype.ValueBufferType=Array,Ki.prototype.DefaultInterpolation=Me,Ki.prototype.InterpolantFactoryMethodLinear=void 0,Ki.prototype.InterpolantFactoryMethodSmooth=void 0;var qi=class extends Wi{constructor(e,t,n,r){super(e,t,n,r)}};qi.prototype.ValueTypeName=`color`;var Ji=class extends Wi{constructor(e,t,n,r){super(e,t,n,r)}};Ji.prototype.ValueTypeName=`number`;var Yi=class extends Ii{constructor(e,t,n,r){super(e,t,n,r)}interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=(n-t)/(r-t),c=e*o;for(let e=c+o;c!==e;c+=4)Ot.slerpFlat(i,0,a,c-o,a,c,s);return i}},Xi=class extends Wi{constructor(e,t,n,r){super(e,t,n,r)}InterpolantFactoryMethodLinear(e){return new Yi(this.times,this.values,this.getValueSize(),e)}};Xi.prototype.ValueTypeName=`quaternion`,Xi.prototype.InterpolantFactoryMethodSmooth=void 0;var Zi=class extends Wi{constructor(e,t,n){super(e,t,n)}};Zi.prototype.ValueTypeName=`string`,Zi.prototype.ValueBufferType=Array,Zi.prototype.DefaultInterpolation=Me,Zi.prototype.InterpolantFactoryMethodLinear=void 0,Zi.prototype.InterpolantFactoryMethodSmooth=void 0;var Qi=class extends Wi{constructor(e,t,n,r){super(e,t,n,r)}};Qi.prototype.ValueTypeName=`vector`;var $i=new K,ea=new Ot,ta=new K,na=class extends Cn{constructor(){super(),this.isCamera=!0,this.type=`Camera`,this.matrixWorldInverse=new Y,this.projectionMatrix=new Y,this.projectionMatrixInverse=new Y,this.coordinateSystem=Ge,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorld.decompose($i,ea,ta),ta.x===1&&ta.y===1&&ta.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose($i,ea,ta.set(1,1,1)).invert()}updateWorldMatrix(e,t,n=!1){super.updateWorldMatrix(e,t,n),this.matrixWorld.decompose($i,ea,ta),ta.x===1&&ta.y===1&&ta.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose($i,ea,ta.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}},ra=new K,ia=new G,aa=new G,oa=class extends na{constructor(e=50,t=1,n=.1,r=2e3){super(),this.isPerspectiveCamera=!0,this.type=`PerspectiveCamera`,this.fov=e,this.zoom=1,this.near=n,this.far=r,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=ot*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(at*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return ot*2*Math.atan(Math.tan(at*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,n){ra.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(ra.x,ra.y).multiplyScalar(-e/ra.z),ra.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(ra.x,ra.y).multiplyScalar(-e/ra.z)}getViewSize(e,t){return this.getViewBounds(e,ia,aa),t.subVectors(aa,ia)}setViewOffset(e,t,n,r,i,a){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=r,this.view.width=i,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(at*.5*this.fov)/this.zoom,n=2*t,r=this.aspect*n,i=-.5*r,a=this.view;if(this.view!==null&&this.view.enabled){let e=a.fullWidth,o=a.fullHeight;i+=a.offsetX*r/e,t-=a.offsetY*n/o,r*=a.width/e,n*=a.height/o}let o=this.filmOffset;o!==0&&(i+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(i,i+r,t,t-n,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}},sa=class extends na{constructor(e=-1,t=1,n=1,r=-1,i=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type=`OrthographicCamera`,this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=r,this.near=i,this.far=a,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,r,i,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=r,this.view.width=i,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,r=(this.top+this.bottom)/2,i=n-e,a=n+e,o=r+t,s=r-t;if(this.view!==null&&this.view.enabled){let e=(this.right-this.left)/this.view.fullWidth/this.zoom,t=(this.top-this.bottom)/this.view.fullHeight/this.zoom;i+=e*this.view.offsetX,a=i+e*this.view.width,o-=t*this.view.offsetY,s=o-t*this.view.height}this.projectionMatrix.makeOrthographic(i,a,o,s,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}},ca=class extends Er{constructor(){super(),this.isInstancedBufferGeometry=!0,this.type=`InstancedBufferGeometry`,this.instanceCount=1/0}copy(e){return super.copy(e),this.instanceCount=e.instanceCount,this}toJSON(){let e=super.toJSON();return e.instanceCount=this.instanceCount,e.isInstancedBufferGeometry=!0,e}},la=-90,ua=1,da=class extends Cn{constructor(e,t,n){super(),this.type=`CubeCamera`,this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let r=new oa(la,ua,e,t);r.layers=this.layers,this.add(r);let i=new oa(la,ua,e,t);i.layers=this.layers,this.add(i);let a=new oa(la,ua,e,t);a.layers=this.layers,this.add(a);let o=new oa(la,ua,e,t);o.layers=this.layers,this.add(o);let s=new oa(la,ua,e,t);s.layers=this.layers,this.add(s);let c=new oa(la,ua,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[n,r,i,a,o,s]=t;for(let e of t)this.remove(e);if(e===2e3)n.up.set(0,1,0),n.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),i.up.set(0,0,-1),i.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),s.up.set(0,1,0),s.lookAt(0,0,-1);else if(e===2001)n.up.set(0,-1,0),n.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),i.up.set(0,0,1),i.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),s.up.set(0,-1,0),s.lookAt(0,0,-1);else throw Error(`THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: `+e);for(let e of t)this.add(e),e.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:r}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[i,a,o,s,c,l]=this.children,u=e.getRenderTarget(),d=e.getActiveCubeFace(),f=e.getActiveMipmapLevel(),p=e.xr.enabled;e.xr.enabled=!1;let m=n.texture.generateMipmaps;n.texture.generateMipmaps=!1;let h=!1;h=e.isWebGLRenderer===!0?e.state.buffers.depth.getReversed():e.reversedDepthBuffer,e.setRenderTarget(n,0,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,i),e.setRenderTarget(n,1,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,a),e.setRenderTarget(n,2,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,o),e.setRenderTarget(n,3,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,s),e.setRenderTarget(n,4,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,c),n.texture.generateMipmaps=m,e.setRenderTarget(n,5,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,l),e.setRenderTarget(u,d,f),e.xr.enabled=p,n.texture.needsPMREMUpdate=!0}},fa=class extends oa{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}},pa=`\\[\\]\\.:\\/`,ma=RegExp(`[\\[\\]\\.:\\/]`,`g`),ha=`[^\\[\\]\\.:\\/]`,ga=`[^`+pa.replace(`\\.`,``)+`]`,_a=`((?:WC+[\\/:])*)`.replace(`WC`,ha),va=`(WCOD+)?`.replace(`WCOD`,ga),ya=`(?:\\.(WC+)(?:\\[(.+)\\])?)?`.replace(`WC`,ha),ba=`\\.(WC+)(?:\\[(.+)\\])?`.replace(`WC`,ha),xa=RegExp(`^`+_a+va+ya+ba+`$`),Sa=[`material`,`materials`,`bones`,`map`],Ca=class{constructor(e,t,n){let r=n||wa.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,r)}getValue(e,t){this.bind();let n=this._targetGroup.nCachedObjects_,r=this._bindings[n];r!==void 0&&r.getValue(e,t)}setValue(e,t){let n=this._bindings;for(let r=this._targetGroup.nCachedObjects_,i=n.length;r!==i;++r)n[r].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].unbind()}},wa=class e{constructor(t,n,r){this.path=n,this.parsedPath=r||e.parseTrackName(n),this.node=e.findNode(t,this.parsedPath.nodeName),this.rootNode=t,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(t,n,r){return t&&t.isAnimationObjectGroup?new e.Composite(t,n,r):new e(t,n,r)}static sanitizeNodeName(e){return e.replace(/\s/g,`_`).replace(ma,``)}static parseTrackName(e){let t=xa.exec(e);if(t===null)throw Error(`THREE.PropertyBinding: Cannot parse trackName: `+e);let n={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},r=n.nodeName&&n.nodeName.lastIndexOf(`.`);if(r!==void 0&&r!==-1){let e=n.nodeName.substring(r+1);Sa.indexOf(e)!==-1&&(n.nodeName=n.nodeName.substring(0,r),n.objectName=e)}if(n.propertyName===null||n.propertyName.length===0)throw Error(`THREE.PropertyBinding: can not parse propertyName from trackName: `+e);return n}static findNode(e,t){if(t===void 0||t===``||t===`.`||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let n=e.skeleton.getBoneByName(t);if(n!==void 0)return n}if(e.children){let n=function(e){for(let r=0;r<e.length;r++){let i=e[r];if(i.name===t||i.uuid===t)return i;let a=n(i.children);if(a)return a}return null},r=n(e.children);if(r)return r}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)e[t++]=n[r]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)n[r]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)n[r]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)n[r]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let t=this.node,n=this.parsedPath,r=n.objectName,i=n.propertyName,a=n.propertyIndex;if(t||(t=e.findNode(this.rootNode,n.nodeName),this.node=t),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!t){V(`PropertyBinding: No target node found for track: `+this.path+`.`);return}if(r){let e=n.objectIndex;switch(r){case`materials`:if(!t.material){H(`PropertyBinding: Can not bind to material as node does not have a material.`,this);return}if(!t.material.materials){H(`PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.`,this);return}t=t.material.materials;break;case`bones`:if(!t.skeleton){H(`PropertyBinding: Can not bind to bones as node does not have a skeleton.`,this);return}t=t.skeleton.bones;for(let n=0;n<t.length;n++)if(t[n].name===e){e=n;break}break;case`map`:if(`map`in t){t=t.map;break}if(!t.material){H(`PropertyBinding: Can not bind to material as node does not have a material.`,this);return}if(!t.material.map){H(`PropertyBinding: Can not bind to material.map as node.material does not have a map.`,this);return}t=t.material.map;break;default:if(t[r]===void 0){H(`PropertyBinding: Can not bind to objectName of node undefined.`,this);return}t=t[r]}if(e!==void 0){if(t[e]===void 0){H(`PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.`,this,t);return}t=t[e]}}let o=t[i];if(o===void 0){let e=n.nodeName;H(`PropertyBinding: Trying to update property for track: `+e+`.`+i+` but it wasn't found.`,t);return}let s=this.Versioning.None;this.targetObject=t,t.isMaterial===!0?s=this.Versioning.NeedsUpdate:t.isObject3D===!0&&(s=this.Versioning.MatrixWorldNeedsUpdate);let c=this.BindingType.Direct;if(a!==void 0){if(i===`morphTargetInfluences`){if(!t.geometry){H(`PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.`,this);return}if(!t.geometry.morphAttributes){H(`PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.`,this);return}t.morphTargetDictionary[a]!==void 0&&(a=t.morphTargetDictionary[a])}c=this.BindingType.ArrayElement,this.resolvedProperty=o,this.propertyIndex=a}else o.fromArray!==void 0&&o.toArray!==void 0?(c=this.BindingType.HasFromToArray,this.resolvedProperty=o):Array.isArray(o)?(c=this.BindingType.EntireArray,this.resolvedProperty=o):this.propertyName=i;this.getValue=this.GetterByBindingType[c],this.setValue=this.SetterByBindingTypeAndVersioning[c][s]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};wa.Composite=Ca,wa.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3},wa.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2},wa.prototype.GetterByBindingType=[wa.prototype._getValue_direct,wa.prototype._getValue_array,wa.prototype._getValue_arrayElement,wa.prototype._getValue_toArray],wa.prototype.SetterByBindingTypeAndVersioning=[[wa.prototype._setValue_direct,wa.prototype._setValue_direct_setNeedsUpdate,wa.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[wa.prototype._setValue_array,wa.prototype._setValue_array_setNeedsUpdate,wa.prototype._setValue_array_setMatrixWorldNeedsUpdate],[wa.prototype._setValue_arrayElement,wa.prototype._setValue_arrayElement_setNeedsUpdate,wa.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[wa.prototype._setValue_fromArray,wa.prototype._setValue_fromArray_setNeedsUpdate,wa.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]],class e{static{e.prototype.isMatrix2=!0}constructor(e,t,n,r){this.elements=[1,0,0,1],e!==void 0&&this.set(e,t,n,r)}identity(){return this.set(1,0,0,1),this}fromArray(e,t=0){for(let n=0;n<4;n++)this.elements[n]=e[n+t];return this}set(e,t,n,r){let i=this.elements;return i[0]=e,i[2]=t,i[1]=n,i[3]=r,this}};function Ta(e,t,n,r){let i=Ea(r);switch(n){case w:return e*t;case k:return e*t/i.components*i.byteLength;case A:return e*t/i.components*i.byteLength;case j:return e*t*2/i.components*i.byteLength;case ee:return e*t*2/i.components*i.byteLength;case T:return e*t*3/i.components*i.byteLength;case E:return e*t*4/i.components*i.byteLength;case te:return e*t*4/i.components*i.byteLength;case M:case N:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*8;case P:case ne:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case re:case ae:return Math.max(e,16)*Math.max(t,8)/4;case F:case ie:return Math.max(e,8)*Math.max(t,8)/2;case oe:case se:case ce:case le:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*8;case I:case ue:case de:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case fe:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case pe:return Math.floor((e+4)/5)*Math.floor((t+3)/4)*16;case me:return Math.floor((e+4)/5)*Math.floor((t+4)/5)*16;case he:return Math.floor((e+5)/6)*Math.floor((t+4)/5)*16;case ge:return Math.floor((e+5)/6)*Math.floor((t+5)/6)*16;case _e:return Math.floor((e+7)/8)*Math.floor((t+4)/5)*16;case ve:return Math.floor((e+7)/8)*Math.floor((t+5)/6)*16;case ye:return Math.floor((e+7)/8)*Math.floor((t+7)/8)*16;case be:return Math.floor((e+9)/10)*Math.floor((t+4)/5)*16;case xe:return Math.floor((e+9)/10)*Math.floor((t+5)/6)*16;case Se:return Math.floor((e+9)/10)*Math.floor((t+7)/8)*16;case Ce:return Math.floor((e+9)/10)*Math.floor((t+9)/10)*16;case we:return Math.floor((e+11)/12)*Math.floor((t+9)/10)*16;case Te:return Math.floor((e+11)/12)*Math.floor((t+11)/12)*16;case Ee:case De:case Oe:return Math.ceil(e/4)*Math.ceil(t/4)*16;case ke:case Ae:return Math.ceil(e/4)*Math.ceil(t/4)*8;case je:case L:return Math.ceil(e/4)*Math.ceil(t/4)*16}throw Error(`Unable to determine texture byte length for ${n} format.`)}function Ea(e){switch(e){case d:case f:return{byteLength:1,components:1};case m:case p:case v:return{byteLength:2,components:1};case y:case b:return{byteLength:2,components:4};case g:case h:case _:return{byteLength:4,components:1};case S:case C:return{byteLength:4,components:3}}throw Error(`THREE.TextureUtils: Unknown texture type ${e}.`)}typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`register`,{detail:{revision:`186`}})),typeof window<`u`&&(window.__THREE__?V(`WARNING: Multiple instances of Three.js being imported.`):window.__THREE__=`186`);function Da(){let e=null,t=!1,n=null,r=null;function i(t,a){r=e.requestAnimationFrame(i),n(t,a)}return{start:function(){t!==!0&&n!==null&&e!==null&&(r=e.requestAnimationFrame(i),t=!0)},stop:function(){e!==null&&e.cancelAnimationFrame(r),t=!1},setAnimationLoop:function(e){n=e},setContext:function(t){e=t}}}function Oa(e){let t=new WeakMap;function n(t,n){let r=t.array,i=t.usage,a=r.byteLength,o=e.createBuffer();e.bindBuffer(n,o),e.bufferData(n,r,i),t.onUploadCallback();let s;if(r instanceof Float32Array)s=e.FLOAT;else if(typeof Float16Array<`u`&&r instanceof Float16Array)s=e.HALF_FLOAT;else if(r instanceof Uint16Array)s=t.isFloat16BufferAttribute?e.HALF_FLOAT:e.UNSIGNED_SHORT;else if(r instanceof Int16Array)s=e.SHORT;else if(r instanceof Uint32Array)s=e.UNSIGNED_INT;else if(r instanceof Int32Array)s=e.INT;else if(r instanceof Int8Array)s=e.BYTE;else if(r instanceof Uint8Array)s=e.UNSIGNED_BYTE;else if(r instanceof Uint8ClampedArray)s=e.UNSIGNED_BYTE;else throw Error(`THREE.WebGLAttributes: Unsupported buffer data format: `+r);return{buffer:o,type:s,bytesPerElement:r.BYTES_PER_ELEMENT,version:t.version,size:a}}function r(t,n,r){let i=n.array,a=n.updateRanges;if(e.bindBuffer(r,t),a.length===0)e.bufferSubData(r,0,i);else{a.sort((e,t)=>e.start-t.start);let t=0;for(let e=1;e<a.length;e++){let n=a[t],r=a[e];r.start<=n.start+n.count+1?n.count=Math.max(n.count,r.start+r.count-n.start):(++t,a[t]=r)}a.length=t+1;for(let t=0,n=a.length;t<n;t++){let n=a[t];e.bufferSubData(r,n.start*i.BYTES_PER_ELEMENT,i,n.start,n.count)}n.clearUpdateRanges()}n.onUploadCallback()}function i(e){return e.isInterleavedBufferAttribute&&(e=e.data),t.get(e)}function a(n){n.isInterleavedBufferAttribute&&(n=n.data);let r=t.get(n);r&&(e.deleteBuffer(r.buffer),t.delete(n))}function o(e,i){if(e.isInterleavedBufferAttribute&&(e=e.data),e.isGLBufferAttribute){let n=t.get(e);(!n||n.version<e.version)&&t.set(e,{buffer:e.buffer,type:e.type,bytesPerElement:e.elementSize,version:e.version});return}let a=t.get(e);if(a===void 0)t.set(e,n(e,i));else if(a.version<e.version){if(a.size!==e.array.byteLength)throw Error(`THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.`);r(a.buffer,e,i),a.version=e.version}}return{get:i,remove:a,update:o}}var Z={alphahash_fragment:`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,alphahash_pars_fragment:`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,alphamap_fragment:`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,alphamap_pars_fragment:`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,alphatest_fragment:`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,alphatest_pars_fragment:`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,aomap_fragment:`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,aomap_pars_fragment:`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,batching_pars_vertex:`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
	}
#endif`,batching_vertex:`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,begin_vertex:`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,beginnormal_vertex:`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,bsdfs:`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,iridescence_fragment:`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,bumpmap_pars_fragment:`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,clipping_planes_fragment:`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,clipping_planes_pars_fragment:`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,clipping_planes_pars_vertex:`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,clipping_planes_vertex:`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,color_fragment:`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,color_pars_fragment:`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,color_pars_vertex:`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,color_vertex:`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif`,common:`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
#define inverseTransformDirection transformDirectionByInverseViewMatrix
vec3 transformNormalByInverseViewMatrix( in vec3 normal, in mat4 viewMatrix ) {
	return normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz );
}
vec3 transformDirectionByInverseViewMatrix( in vec3 dir, in mat4 viewMatrix ) {
	return normalize( ( vec4( dir, 0.0 ) * viewMatrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,cube_uv_reflection_fragment:`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,defaultnormal_vertex:`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
#endif`,displacementmap_pars_vertex:`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,displacementmap_vertex:`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,emissivemap_fragment:`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,emissivemap_pars_fragment:`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,colorspace_fragment:`gl_FragColor = linearToOutputTexel( gl_FragColor );`,colorspace_pars_fragment:`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,envmap_fragment:`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif`,envmap_common_pars_fragment:`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,envmap_pars_fragment:`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,envmap_pars_vertex:`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,envmap_physical_pars_fragment:`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = transformDirectionByInverseViewMatrix( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_RETROREFLECTION
		vec3 getIBLRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 retroVec = normalize( mix( viewDir, normal, pow4( roughness ) ) );
				retroVec = transformDirectionByInverseViewMatrix( retroVec, viewMatrix );
				vec4 envMapColor = textureCubeUV( envMap, envMapRotation * retroVec, roughness );
				return envMapColor.rgb * envMapIntensity;
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
		#ifdef USE_RETROREFLECTION
			vec3 getIBLAnisotropyRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
				#ifdef ENVMAP_TYPE_CUBE_UV
					vec3 bentNormal = cross( bitangent, viewDir );
					bentNormal = normalize( cross( bentNormal, bitangent ) );
					bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
					return getIBLRetroRadiance( viewDir, bentNormal, roughness );
				#else
					return vec3( 0.0 );
				#endif
			}
		#endif
	#endif
#endif`,envmap_vertex:`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,fog_vertex:`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,fog_pars_vertex:`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,fog_fragment:`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,fog_pars_fragment:`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,gradientmap_pars_fragment:`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,lightmap_pars_fragment:`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,lights_lambert_fragment:`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,lights_lambert_pars_fragment:`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,lights_pars_begin:`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_SUN_LIGHTS > 0
	struct SunLight {
		vec3 direction;
		vec3 color;
	};
	uniform SunLight sunLights[ NUM_SUN_LIGHTS ];
	void getSunLightInfo( const in SunLight sunLight, out IncidentLight light ) {
		light.color = sunLight.color;
		light.direction = sunLight.direction;
		light.visible = true;
	}
#endif
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif
#include <lightprobes_pars_fragment>`,lights_toon_fragment:`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,lights_toon_pars_fragment:`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,lights_phong_fragment:`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,lights_phong_pars_fragment:`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,lights_physical_fragment:`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_RETROREFLECTION
	material.retroreflectivity = retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,lights_physical_pars_fragment:`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	vec2 dfg;
	vec3 multiScatteringCompensation;
	#ifdef USE_RETROREFLECTION
		float retroreflectivity;
	#endif
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0Dielectric;
		vec3 iridescenceF0Metallic;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		return 0.5 / max( gv + gl, EPSILON );
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec2 fab, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec2 fab, const in vec3 specularColor, const in float specularF90, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
 
 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	vec3 specularBRDF = BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	#ifdef USE_RETROREFLECTION
		vec3 retroViewDir = reflect( - geometryViewDir, geometryNormal );
		vec3 retroSpecularBRDF = BRDF_GGX( directLight.direction, retroViewDir, geometryNormal, material );
		specularBRDF = mix( specularBRDF, retroSpecularBRDF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directSpecular += irradiance * specularBRDF * material.multiScatteringCompensation;
	vec3 halfDir = normalize( directLight.direction + geometryViewDir );
	float dotVH = saturate( dot( geometryViewDir, halfDir ) );
	vec3 F = F_Schlick( material.specularColor, material.specularF90, dotVH );
	#ifdef USE_RETROREFLECTION
		vec3 retroHalfDir = normalize( directLight.direction + retroViewDir );
		float dotRetroVH = saturate( dot( retroViewDir, retroHalfDir ) );
		vec3 retroF = F_Schlick( material.specularColor, material.specularF90, dotRetroVH );
		F = mix( F, retroF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - F );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScattering, multiScattering );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScattering, multiScattering );
	#endif
	vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - singleScattering - multiScattering );
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		sheenSpecularIndirect += irradiance * material.sheenColor * sheenAlbedo * RECIPROCAL_PI;
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( material.dfg, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceF0Metallic, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( material.dfg, material.diffuseColor, material.specularF90, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,lights_fragment_begin:`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		vec3 iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		vec3 iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( iridescenceFresnelDielectric, iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0Dielectric = Schlick_to_F0( iridescenceFresnelDielectric, 1.0, dotNVi );
		material.iridescenceF0Metallic = Schlick_to_F0( iridescenceFresnelMetallic, 1.0, dotNVi );
	}
#endif
#ifdef STANDARD
	float dotNVms = saturate( dot( geometryNormal, geometryViewDir ) );
	material.dfg = texture2D( dfgLUT, vec2( material.roughness, dotNVms ) ).rg;
	#if ( NUM_SUN_LIGHTS > 0 || NUM_DIR_LIGHTS > 0 || NUM_POINT_LIGHTS > 0 || NUM_SPOT_LIGHTS > 0 )
		float EssMs = material.dfg.x + material.dfg.y;
		material.multiScatteringCompensation = 1.0 + material.specularColorBlended * ( 1.0 / EssMs - 1.0 );
	#endif
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SUN_LIGHTS > 0 ) && defined( RE_Direct )
	SunLight sunLight;
	#if defined( USE_SHADOWMAP ) && NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHTS; i ++ ) {
		sunLight = sunLights[ i ];
		getSunLightInfo( sunLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SUN_LIGHT_SHADOWS )
		sunLightShadow = sunLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getSunShadow( sunShadowMap[ i ], sunLightShadow, UNROLLED_LOOP_INDEX ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
	#ifdef USE_LIGHT_PROBES_GRID
		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;
		vec3 probeWorldNormal = transformNormalByInverseViewMatrix( geometryNormal, viewMatrix );
		irradiance += getLightProbeGridIrradiance( probeWorldPos, probeWorldNormal );
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,lights_fragment_maps:`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_CUBE_UV )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		vec3 iblRadiance = getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		vec3 iblRadiance = getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_RETROREFLECTION
		#ifdef USE_ANISOTROPY
			vec3 retroIBLRadiance = getIBLAnisotropyRetroRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
		#else
			vec3 retroIBLRadiance = getIBLRetroRadiance( geometryViewDir, geometryNormal, material.roughness );
		#endif
		iblRadiance = mix( iblRadiance, retroIBLRadiance, saturate( material.retroreflectivity ) );
	#endif
	radiance += iblRadiance;
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,lights_fragment_end:`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,lightprobes_pars_fragment:`#ifdef USE_LIGHT_PROBES_GRID
uniform highp sampler3D probesSH;
uniform vec3 probesMin;
uniform vec3 probesMax;
uniform vec3 probesResolution;
vec3 getLightProbeGridIrradiance( vec3 worldPos, vec3 worldNormal ) {
	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 resMinusOne = res - 1.0;
	vec3 probeSpacing = gridRange / resMinusOne;
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.0, 1.0 );
	uvw = uvw * resMinusOne / res + 0.5 / res;
	float nz          = res.z;
	float paddedSlices = nz + 2.0;
	float atlasDepth  = 7.0 * paddedSlices;
	float uvZBase     = uvw.z * nz + 1.0;
	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );
	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );
	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;
	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;
	vec3 result = c0 * 0.886227;
	result += c1 * 2.0 * 0.511664 * y;
	result += c2 * 2.0 * 0.511664 * z;
	result += c3 * 2.0 * 0.511664 * x;
	result += c4 * 2.0 * 0.429043 * x * y;
	result += c5 * 2.0 * 0.429043 * y * z;
	result += c6 * ( 0.743125 * z * z - 0.247708 );
	result += c7 * 2.0 * 0.429043 * x * z;
	result += c8 * 0.429043 * ( x * x - y * y );
	return max( result, vec3( 0.0 ) );
}
#endif`,logdepthbuf_fragment:`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,logdepthbuf_pars_fragment:`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,logdepthbuf_pars_vertex:`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,logdepthbuf_vertex:`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,map_fragment:`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,map_pars_fragment:`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,map_particle_fragment:`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,map_particle_pars_fragment:`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,metalnessmap_fragment:`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,metalnessmap_pars_fragment:`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,morphinstance_vertex:`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,morphcolor_vertex:`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,morphnormal_vertex:`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,morphtarget_pars_vertex:`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,morphtarget_vertex:`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,normal_fragment_begin:`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#ifdef DOUBLE_SIDED
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#ifdef DOUBLE_SIDED
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,normal_fragment_maps:`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#if defined( USE_PACKED_NORMALMAP )
		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );
	#endif
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,normal_pars_fragment:`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,normal_pars_vertex:`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,normal_vertex:`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,normalmap_pars_fragment:`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,clearcoat_normal_fragment_begin:`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,clearcoat_normal_fragment_maps:`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,clearcoat_pars_fragment:`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,iridescence_pars_fragment:`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,opaque_fragment:`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,packing:`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}`,premultiplied_alpha_fragment:`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,project_vertex:`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,dithering_fragment:`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,dithering_pars_fragment:`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,roughnessmap_fragment:`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,roughnessmap_pars_fragment:`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,shadowmap_pars_fragment:`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		#define SUN_LIGHT_CASCADES 2
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#else
			uniform sampler2D sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#endif
		uniform mat4 sunShadowMatrix[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		uniform vec4 sunShadowCascade[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
		struct SunLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SunLightShadow sunLightShadows[ NUM_SUN_LIGHT_SHADOWS ];
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			shadowCoord.z += shadowBias;
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				float radius = shadowRadius * texelSize.x;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_SUN_LIGHT_SHADOWS > 0
		float getSunShadow(
			#if defined( SHADOWMAP_TYPE_PCF )
				sampler2DShadow shadowMap,
			#else
				sampler2D shadowMap,
			#endif
			SunLightShadow sunLightShadow,
			int shadowIndex
		) {
			vec4 shadowWorldPosition = vec4( vSunShadowWorldPosition.xyz + vSunShadowWorldNormal * sunLightShadow.shadowNormalBias, 1.0 );
			float viewDepth = vSunShadowWorldPosition.w;
			int cascadeOffset = shadowIndex * SUN_LIGHT_CASCADES;
			float shadow = 1.0;
			for ( int i = SUN_LIGHT_CASCADES - 1; i >= 0; i -- ) {
				vec4 cascade = sunShadowCascade[ cascadeOffset + i ];
				if ( viewDepth >= cascade.x && viewDepth < cascade.y ) {
					float cascadeShadow = getShadow(
						shadowMap,
						sunLightShadow.shadowMapSize,
						sunLightShadow.shadowIntensity,
						sunLightShadow.shadowBias,
						sunLightShadow.shadowRadius,
						sunShadowMatrix[ cascadeOffset + i ] * shadowWorldPosition
					);
					shadow = mix( cascadeShadow, shadow, smoothstep( cascade.z, cascade.y, viewDepth ) );
				}
			}
			return shadow;
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float dp = ( shadowCameraNear * ( shadowCameraFar - viewSpaceZ ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp -= shadowBias;
			#else
				float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp += shadowBias;
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			vec2 sample0 = vogelDiskSample( 0, 5, phi );
			vec2 sample1 = vogelDiskSample( 1, 5, phi );
			vec2 sample2 = vogelDiskSample( 2, 5, phi );
			vec2 sample3 = vogelDiskSample( 3, 5, phi );
			vec2 sample4 = vogelDiskSample( 4, 5, phi );
			shadow = (
				texture( shadowMap, vec4( bd3D + ( tangent * sample0.x + bitangent * sample0.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample1.x + bitangent * sample1.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample2.x + bitangent * sample2.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample3.x + bitangent * sample3.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample4.x + bitangent * sample4.y ) * texelSize, dp ) )
			) * 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`,shadowmap_pars_vertex:`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,shadowmap_vertex:`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#ifdef HAS_NORMAL
		vec3 shadowWorldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
	#else
		vec3 shadowWorldNormal = vec3( 0.0 );
	#endif
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_SUN_LIGHT_SHADOWS > 0
		vSunShadowWorldPosition = vec4( worldPosition.xyz, - mvPosition.z );
		vSunShadowWorldNormal = shadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,shadowmask_pars_fragment:`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHT_SHADOWS; i ++ ) {
		sunLight = sunLightShadows[ i ];
		shadow *= receiveShadow ? getSunShadow( sunShadowMap[ i ], sunLight, UNROLLED_LOOP_INDEX ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,skinbase_vertex:`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,skinning_pars_vertex:`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,skinning_vertex:`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,skinnormal_vertex:`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,specularmap_fragment:`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,specularmap_pars_fragment:`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,tonemapping_fragment:`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,tonemapping_pars_fragment:`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,transmission_fragment:`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,transmission_pars_fragment:`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,uv_pars_fragment:`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,uv_pars_vertex:`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,uv_vertex:`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,worldpos_vertex:`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,background_vert:`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,background_frag:`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,backgroundCube_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,backgroundCube_frag:`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,cube_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,cube_frag:`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,depth_vert:`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,depth_frag:`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,distance_vert:`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,distance_frag:`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`,equirect_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,equirect_frag:`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,linedashed_vert:`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,linedashed_frag:`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,meshbasic_vert:`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,meshbasic_frag:`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshlambert_vert:`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,meshlambert_frag:`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshmatcap_vert:`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,meshmatcap_frag:`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshnormal_vert:`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,meshnormal_frag:`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,meshphong_vert:`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,meshphong_frag:`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshphysical_vert:`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,meshphysical_frag:`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_RETROREFLECTION
	uniform float retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
 	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshtoon_vert:`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,meshtoon_frag:`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,points_vert:`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,points_frag:`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,shadow_vert:`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,shadow_frag:`uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,sprite_vert:`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,sprite_frag:`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`},Q={common:{diffuse:{value:new X(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new q},alphaMap:{value:null},alphaMapTransform:{value:new q},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new q}},envmap:{envMap:{value:null},envMapRotation:{value:new q},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new q}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new q}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new q},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new q},normalScale:{value:new G(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new q},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new q}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new q}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new q}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new X(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new K},probesMax:{value:new K},probesResolution:{value:new K}},points:{diffuse:{value:new X(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new q},alphaTest:{value:0},uvTransform:{value:new q}},sprite:{diffuse:{value:new X(16777215)},opacity:{value:1},center:{value:new G(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new q},alphaMap:{value:null},alphaMapTransform:{value:new q},alphaTest:{value:0}}},ka={basic:{uniforms:Ci([Q.common,Q.specularmap,Q.envmap,Q.aomap,Q.lightmap,Q.fog]),vertexShader:Z.meshbasic_vert,fragmentShader:Z.meshbasic_frag},lambert:{uniforms:Ci([Q.common,Q.specularmap,Q.envmap,Q.aomap,Q.lightmap,Q.emissivemap,Q.bumpmap,Q.normalmap,Q.displacementmap,Q.fog,Q.lights,{emissive:{value:new X(0)},envMapIntensity:{value:1}}]),vertexShader:Z.meshlambert_vert,fragmentShader:Z.meshlambert_frag},phong:{uniforms:Ci([Q.common,Q.specularmap,Q.envmap,Q.aomap,Q.lightmap,Q.emissivemap,Q.bumpmap,Q.normalmap,Q.displacementmap,Q.fog,Q.lights,{emissive:{value:new X(0)},specular:{value:new X(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:Z.meshphong_vert,fragmentShader:Z.meshphong_frag},standard:{uniforms:Ci([Q.common,Q.envmap,Q.aomap,Q.lightmap,Q.emissivemap,Q.bumpmap,Q.normalmap,Q.displacementmap,Q.roughnessmap,Q.metalnessmap,Q.fog,Q.lights,{emissive:{value:new X(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Z.meshphysical_vert,fragmentShader:Z.meshphysical_frag},toon:{uniforms:Ci([Q.common,Q.aomap,Q.lightmap,Q.emissivemap,Q.bumpmap,Q.normalmap,Q.displacementmap,Q.gradientmap,Q.fog,Q.lights,{emissive:{value:new X(0)}}]),vertexShader:Z.meshtoon_vert,fragmentShader:Z.meshtoon_frag},matcap:{uniforms:Ci([Q.common,Q.bumpmap,Q.normalmap,Q.displacementmap,Q.fog,{matcap:{value:null}}]),vertexShader:Z.meshmatcap_vert,fragmentShader:Z.meshmatcap_frag},points:{uniforms:Ci([Q.points,Q.fog]),vertexShader:Z.points_vert,fragmentShader:Z.points_frag},dashed:{uniforms:Ci([Q.common,Q.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Z.linedashed_vert,fragmentShader:Z.linedashed_frag},depth:{uniforms:Ci([Q.common,Q.displacementmap]),vertexShader:Z.depth_vert,fragmentShader:Z.depth_frag},normal:{uniforms:Ci([Q.common,Q.bumpmap,Q.normalmap,Q.displacementmap,{opacity:{value:1}}]),vertexShader:Z.meshnormal_vert,fragmentShader:Z.meshnormal_frag},sprite:{uniforms:Ci([Q.sprite,Q.fog]),vertexShader:Z.sprite_vert,fragmentShader:Z.sprite_frag},background:{uniforms:{uvTransform:{value:new q},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Z.background_vert,fragmentShader:Z.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new q}},vertexShader:Z.backgroundCube_vert,fragmentShader:Z.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Z.cube_vert,fragmentShader:Z.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Z.equirect_vert,fragmentShader:Z.equirect_frag},distance:{uniforms:Ci([Q.common,Q.displacementmap,{referencePosition:{value:new K},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Z.distance_vert,fragmentShader:Z.distance_frag},shadow:{uniforms:Ci([Q.lights,Q.fog,{color:{value:new X(0)},opacity:{value:1}}]),vertexShader:Z.shadow_vert,fragmentShader:Z.shadow_frag}};ka.physical={uniforms:Ci([ka.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new q},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new q},clearcoatNormalScale:{value:new G(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new q},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new q},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new q},sheen:{value:0},sheenColor:{value:new X(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new q},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new q},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new q},transmissionSamplerSize:{value:new G},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new q},attenuationDistance:{value:0},attenuationColor:{value:new X(0)},specularColor:{value:new X(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new q},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new q},anisotropyVector:{value:new G},anisotropyMap:{value:null},anisotropyMapTransform:{value:new q}}]),vertexShader:Z.meshphysical_vert,fragmentShader:Z.meshphysical_frag};var Aa={r:0,b:0,g:0},ja=new Y,Ma=new q;Ma.set(-1,0,0,0,1,0,0,0,1);function Na(e,t,n,r,i,a){let o=new X(0),s=i===!0?0:1,c,l,u=null,d=0,f=null;function p(e){let n=e.isScene===!0?e.background:null;if(n&&n.isTexture){let r=e.backgroundBlurriness>0;n=t.get(n,r)}return n}function m(t){let r=!1,i=p(t);i===null?g(o,s):i&&i.isColor&&(g(i,1),r=!0);let c=e.xr.getEnvironmentBlendMode();c===`additive`?n.buffers.color.setClear(0,0,0,1,a):c===`alpha-blend`&&n.buffers.color.setClear(0,0,0,0,a),(e.autoClear||r)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil))}function h(t,n){let i=p(n);i&&(i.isCubeTexture||i.mapping===306)?(l===void 0&&(l=new $r(new bi(1,1,1),new Ai({name:`BackgroundCubeMaterial`,uniforms:Si(ka.backgroundCube.uniforms),vertexShader:ka.backgroundCube.vertexShader,fragmentShader:ka.backgroundCube.fragmentShader,side:1,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute(`normal`),l.geometry.deleteAttribute(`uv`),l.onBeforeRender=function(e,t,n){this.matrixWorld.copyPosition(n.matrixWorld)},Object.defineProperty(l.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),r.update(l)),l.material.uniforms.envMap.value=i,l.material.uniforms.backgroundBlurriness.value=n.backgroundBlurriness,l.material.uniforms.backgroundIntensity.value=n.backgroundIntensity,l.material.uniforms.backgroundRotation.value.setFromMatrix4(ja.makeRotationFromEuler(n.backgroundRotation)).transpose(),i.isCubeTexture&&i.isRenderTargetTexture===!1&&l.material.uniforms.backgroundRotation.value.premultiply(Ma),l.material.toneMapped=J.getTransfer(i.colorSpace)!==Be,(u!==i||d!==i.version||f!==e.toneMapping)&&(l.material.needsUpdate=!0,u=i,d=i.version,f=e.toneMapping),l.layers.enableAll(),t.unshift(l,l.geometry,l.material,0,0,null)):i&&i.isTexture&&(c===void 0&&(c=new $r(new xi(2,2),new Ai({name:`BackgroundMaterial`,uniforms:Si(ka.background.uniforms),vertexShader:ka.background.vertexShader,fragmentShader:ka.background.fragmentShader,side:0,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute(`normal`),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),r.update(c)),c.material.uniforms.t2D.value=i,c.material.uniforms.backgroundIntensity.value=n.backgroundIntensity,c.material.toneMapped=J.getTransfer(i.colorSpace)!==Be,i.matrixAutoUpdate===!0&&i.updateMatrix(),c.material.uniforms.uvTransform.value.copy(i.matrix),(u!==i||d!==i.version||f!==e.toneMapping)&&(c.material.needsUpdate=!0,u=i,d=i.version,f=e.toneMapping),c.layers.enableAll(),t.unshift(c,c.geometry,c.material,0,0,null))}function g(t,r){t.getRGB(Aa,Ei(e)),n.buffers.color.setClear(Aa.r,Aa.g,Aa.b,r,a)}function _(){l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0),c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0)}return{getClearColor:function(){return o},setClearColor:function(e,t=1){o.set(e),s=t,g(o,s)},getClearAlpha:function(){return s},setClearAlpha:function(e){s=e,g(o,s)},render:m,addToRenderList:h,dispose:_}}function Pa(e,t){let n=e.getParameter(e.MAX_VERTEX_ATTRIBS),r={},i=f(null),a=i,o=!1;function s(n,r,i,s,c){let u=!1,f=d(n,s,i,r);a!==f&&(a=f,l(a.object)),u=p(n,s,i,c),u&&m(n,s,i,c),c!==null&&t.update(c,e.ELEMENT_ARRAY_BUFFER),(u||o)&&(o=!1,b(n,r,i,s),c!==null&&e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,t.get(c).buffer))}function c(){return e.createVertexArray()}function l(t){return e.bindVertexArray(t)}function u(t){return e.deleteVertexArray(t)}function d(e,t,n,i){let a=i.wireframe===!0,o=r[t.id];o===void 0&&(o={},r[t.id]=o);let s=e.isInstancedMesh===!0?e.id:0,l=o[s];l===void 0&&(l={},o[s]=l);let u=l[n.id];u===void 0&&(u={},l[n.id]=u);let d=u[a];return d===void 0&&(d=f(c()),u[a]=d),d}function f(e){let t=[],r=[],i=[];for(let e=0;e<n;e++)t[e]=0,r[e]=0,i[e]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:t,enabledAttributes:r,attributeDivisors:i,object:e,attributes:{},index:null}}function p(e,t,n,r){let i=a.attributes,o=t.attributes,s=0,c=n.getAttributes();for(let t in c)if(c[t].location>=0){let n=i[t],r=o[t];if(r===void 0&&(t===`instanceMatrix`&&e.instanceMatrix&&(r=e.instanceMatrix),t===`instanceColor`&&e.instanceColor&&(r=e.instanceColor)),n===void 0||n.attribute!==r||r&&n.data!==r.data)return!0;s++}return a.attributesNum!==s||a.index!==r}function m(e,t,n,r){let i={},o=t.attributes,s=0,c=n.getAttributes();for(let t in c)if(c[t].location>=0){let n=o[t];n===void 0&&(t===`instanceMatrix`&&e.instanceMatrix&&(n=e.instanceMatrix),t===`instanceColor`&&e.instanceColor&&(n=e.instanceColor));let r={};r.attribute=n,n&&n.data&&(r.data=n.data),i[t]=r,s++}a.attributes=i,a.attributesNum=s,a.index=r}function h(){let e=a.newAttributes;for(let t=0,n=e.length;t<n;t++)e[t]=0}function g(e){_(e,0)}function _(t,n){let r=a.newAttributes,i=a.enabledAttributes,o=a.attributeDivisors;r[t]=1,i[t]===0&&(e.enableVertexAttribArray(t),i[t]=1),o[t]!==n&&(e.vertexAttribDivisor(t,n),o[t]=n)}function v(){let t=a.newAttributes,n=a.enabledAttributes;for(let r=0,i=n.length;r<i;r++)n[r]!==t[r]&&(e.disableVertexAttribArray(r),n[r]=0)}function y(t,n,r,i,a,o,s){s===!0?e.vertexAttribIPointer(t,n,r,a,o):e.vertexAttribPointer(t,n,r,i,a,o)}function b(n,r,i,a){h();let o=a.attributes,s=i.getAttributes(),c=r.defaultAttributeValues;for(let r in s){let i=s[r];if(i.location>=0){let s=o[r];if(s===void 0&&(r===`instanceMatrix`&&n.instanceMatrix&&(s=n.instanceMatrix),r===`instanceColor`&&n.instanceColor&&(s=n.instanceColor)),s!==void 0){let r=s.normalized,o=s.itemSize,c=t.get(s);if(c===void 0)continue;let l=c.buffer,u=c.type,d=c.bytesPerElement,f=u===e.INT||u===e.UNSIGNED_INT||s.gpuType===1013;if(s.isInterleavedBufferAttribute){let t=s.data,c=t.stride,p=s.offset;if(t.isInstancedInterleavedBuffer){for(let e=0;e<i.locationSize;e++)_(i.location+e,t.meshPerAttribute);n.isInstancedMesh!==!0&&a._maxInstanceCount===void 0&&(a._maxInstanceCount=t.meshPerAttribute*t.count)}else for(let e=0;e<i.locationSize;e++)g(i.location+e);e.bindBuffer(e.ARRAY_BUFFER,l);for(let e=0;e<i.locationSize;e++)y(i.location+e,o/i.locationSize,u,r,c*d,(p+o/i.locationSize*e)*d,f)}else{if(s.isInstancedBufferAttribute){for(let e=0;e<i.locationSize;e++)_(i.location+e,s.meshPerAttribute);n.isInstancedMesh!==!0&&a._maxInstanceCount===void 0&&(a._maxInstanceCount=s.meshPerAttribute*s.count)}else for(let e=0;e<i.locationSize;e++)g(i.location+e);e.bindBuffer(e.ARRAY_BUFFER,l);for(let e=0;e<i.locationSize;e++)y(i.location+e,o/i.locationSize,u,r,o*d,o/i.locationSize*e*d,f)}}else if(c!==void 0){let t=c[r];if(t!==void 0)switch(t.length){case 2:e.vertexAttrib2fv(i.location,t);break;case 3:e.vertexAttrib3fv(i.location,t);break;case 4:e.vertexAttrib4fv(i.location,t);break;default:e.vertexAttrib1fv(i.location,t)}}}}v()}function x(){T();for(let e in r){let t=r[e];for(let e in t){let n=t[e];for(let e in n){let t=n[e];for(let e in t)u(t[e].object),delete t[e];delete n[e]}}delete r[e]}}function S(e){if(r[e.id]===void 0)return;let t=r[e.id];for(let e in t){let n=t[e];for(let e in n){let t=n[e];for(let e in t)u(t[e].object),delete t[e];delete n[e]}}delete r[e.id]}function C(e){for(let t in r){let n=r[t];for(let t in n){let r=n[t];if(r[e.id]===void 0)continue;let i=r[e.id];for(let e in i)u(i[e].object),delete i[e];delete r[e.id]}}}function w(e){for(let t in r){let n=r[t],i=e.isInstancedMesh===!0?e.id:0,a=n[i];if(a!==void 0){for(let e in a){let t=a[e];for(let e in t)u(t[e].object),delete t[e];delete a[e]}delete n[i],Object.keys(n).length===0&&delete r[t]}}}function T(){E(),o=!0,a!==i&&(a=i,l(a.object))}function E(){i.geometry=null,i.program=null,i.wireframe=!1}return{setup:s,reset:T,resetDefaultState:E,dispose:x,releaseStatesOfGeometry:S,releaseStatesOfObject:w,releaseStatesOfProgram:C,initAttributes:h,enableAttribute:g,disableUnusedAttributes:v}}function Fa(e,t,n){let r;function i(e){r=e}function a(t,i){e.drawArrays(r,t,i),n.update(i,r,1)}function o(t,i,a){a!==0&&(e.drawArraysInstanced(r,t,i,a),n.update(i,r,a))}function s(e,i,a){if(a===0)return;t.get(`WEBGL_multi_draw`).multiDrawArraysWEBGL(r,e,0,i,0,a);let o=0;for(let e=0;e<a;e++)o+=i[e];n.update(o,r,1)}this.setMode=i,this.render=a,this.renderInstances=o,this.renderMultiDraw=s}function Ia(e,t,n,r){let i;function a(){if(i!==void 0)return i;if(t.has(`EXT_texture_filter_anisotropic`)===!0){let n=t.get(`EXT_texture_filter_anisotropic`);i=e.getParameter(n.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else i=0;return i}function o(t){return t===1023||r.convert(t)===e.getParameter(e.IMPLEMENTATION_COLOR_READ_FORMAT)}function s(n){let i=n===1016&&(t.has(`EXT_color_buffer_half_float`)||t.has(`EXT_color_buffer_float`));return!(n!==1009&&n!==1015&&!i&&r.convert(n)!==e.getParameter(e.IMPLEMENTATION_COLOR_READ_TYPE))}function c(t){if(t===`highp`){if(e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.HIGH_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.HIGH_FLOAT).precision>0)return`highp`;t=`mediump`}return t===`mediump`&&e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.MEDIUM_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.MEDIUM_FLOAT).precision>0?`mediump`:`lowp`}let l=n.precision===void 0?`highp`:n.precision,u=c(l);u!==l&&(V(`WebGLRenderer:`,l,`not supported, using`,u,`instead.`),l=u);let d=n.logarithmicDepthBuffer===!0,f=n.reversedDepthBuffer===!0&&t.has(`EXT_clip_control`);n.reversedDepthBuffer===!0&&f===!1&&V(`WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.`);let p=e.getParameter(e.MAX_TEXTURE_IMAGE_UNITS),m=e.getParameter(e.MAX_VERTEX_TEXTURE_IMAGE_UNITS),h=e.getParameter(e.MAX_TEXTURE_SIZE),g=e.getParameter(e.MAX_CUBE_MAP_TEXTURE_SIZE),_=e.getParameter(e.MAX_VERTEX_ATTRIBS),v=e.getParameter(e.MAX_VERTEX_UNIFORM_VECTORS),y=e.getParameter(e.MAX_VARYING_VECTORS),b=e.getParameter(e.MAX_FRAGMENT_UNIFORM_VECTORS),x=e.getParameter(e.MAX_SAMPLES),S=e.getParameter(e.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:a,getMaxPrecision:c,textureFormatReadable:o,textureTypeReadable:s,precision:l,logarithmicDepthBuffer:d,reversedDepthBuffer:f,maxTextures:p,maxVertexTextures:m,maxTextureSize:h,maxCubemapSize:g,maxAttributes:_,maxVertexUniforms:v,maxVaryings:y,maxFragmentUniforms:b,maxSamples:x,samples:S}}function La(e){let t=this,n=null,r=0,i=!1,a=!1,o=new Nr,s=new q,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(e,t){let n=e.length!==0||t||r!==0||i;return i=t,r=e.length,n},this.beginShadows=function(){a=!0,u(null)},this.endShadows=function(){a=!1},this.setGlobalState=function(e,t){n=u(e,t,0)},this.setState=function(t,o,s){let d=t.clippingPlanes,f=t.clipIntersection,p=t.clipShadows,m=e.get(t);if(!i||d===null||d.length===0||a&&!p)a?u(null):l();else{let e=a?0:r,t=e*4,i=m.clippingState||null;c.value=i,i=u(d,o,t,s);for(let e=0;e!==t;++e)i[e]=n[e];m.clippingState=i,this.numIntersection=f?this.numPlanes:0,this.numPlanes+=e}};function l(){c.value!==n&&(c.value=n,c.needsUpdate=r>0),t.numPlanes=r,t.numIntersection=0}function u(e,n,r,i){let a=e===null?0:e.length,l=null;if(a!==0){if(l=c.value,i!==!0||l===null){let t=r+a*4,i=n.matrixWorldInverse;s.getNormalMatrix(i),(l===null||l.length<t)&&(l=new Float32Array(t));for(let t=0,n=r;t!==a;++t,n+=4)o.copy(e[t]).applyMatrix4(i,s),o.normal.toArray(l,n),l[n+3]=o.constant}c.value=l,c.needsUpdate=!0}return t.numPlanes=a,t.numIntersection=0,l}}var Ra=4,za=6,Ba=20,Va=256,Ha=new sa,Ua=new X,Wa=null,Ga=0,Ka=0,qa=!1,Ja=new K,Ya=new K,Xa=class{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(e,t=0,n=.1,r=100,i={}){let{size:a=256,position:o=Ja}=i;Wa=this._renderer.getRenderTarget(),Ga=this._renderer.getActiveCubeFace(),Ka=this._renderer.getActiveMipmapLevel(),qa=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(a);let s=this._allocateTargets();return s.depthBuffer=!0,this._sceneToCubeUV(e,n,r,s,o),t>0&&this._blur(s,0,0,t),this._applyPMREM(s),this._cleanup(s),s}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=ro(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=no(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=2**this._lodMax}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodMeshes.length;e++)this._lodMeshes[e].geometry.dispose()}_cleanup(e){this._renderer.setRenderTarget(Wa,Ga,Ka),this._renderer.xr.enabled=qa,e.scissorTest=!1,$a(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===301||e.mapping===302?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),Wa=this._renderer.getRenderTarget(),Ga=this._renderer.getActiveCubeFace(),Ka=this._renderer.getActiveMipmapLevel(),qa=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let n=t||this._allocateTargets();return this._textureToCubeUV(e,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,n={magFilter:c,minFilter:c,generateMipmaps:!1,type:v,format:E,colorSpace:Re,depthBuffer:!1},r=Qa(e,t,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Qa(e,t,n);let{_lodMax:r}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods}=Za(r)),this._blurMaterial=to(r,e,t),this._ggxMaterial=eo(r,e,t)}return r}_compileMaterial(e){let t=new $r(new Er,e);this._renderer.compile(t,Ha)}_sceneToCubeUV(e,t,n,r,i){let a=new oa(90,1,t,n),o=[1,-1,1,1,1,1],s=[1,1,1,-1,-1,-1],c=this._renderer,l=c.autoClear,u=c.toneMapping;c.getClearColor(Ua),c.toneMapping=0,c.autoClear=!1,c.state.buffers.depth.getReversed()&&(c.setRenderTarget(r),c.clearDepth(),c.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new $r(new bi,new Vr({name:`PMREM.Background`,side:1,depthWrite:!1,depthTest:!1})));let d=this._backgroundBox,f=d.material,p=!1,m=e.background;m?m.isColor&&(f.color.copy(m),e.background=null,p=!0):(f.color.copy(Ua),p=!0);for(let t=0;t<6;t++){let n=t%3;n===0?(a.up.set(0,o[t],0),a.position.set(i.x,i.y,i.z),a.lookAt(i.x+s[t],i.y,i.z)):n===1?(a.up.set(0,0,o[t]),a.position.set(i.x,i.y,i.z),a.lookAt(i.x,i.y+s[t],i.z)):(a.up.set(0,o[t],0),a.position.set(i.x,i.y,i.z),a.lookAt(i.x,i.y,i.z+s[t]));let l=this._cubeSize;$a(r,n*l,t>2?l:0,l,l),c.setRenderTarget(r),p&&c.render(d,a),c.render(e,a)}c.toneMapping=u,c.autoClear=l,e.background=m}_textureToCubeUV(e,t){let n=this._renderer,r=e.mapping===301||e.mapping===302;r?(this._cubemapMaterial===null&&(this._cubemapMaterial=ro()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=no());let i=r?this._cubemapMaterial:this._equirectMaterial,a=this._lodMeshes[0];a.material=i;let o=i.uniforms;o.envMap.value=e;let s=this._cubeSize;$a(t,0,0,3*s,2*s),n.setRenderTarget(t),n.render(a,Ha)}_applyPMREM(e){let t=this._renderer,n=t.autoClear;t.autoClear=!1;let r=this._lodMeshes.length;for(let t=1;t<r;t++)this._applyGGXFilter(e,t-1,t);t.autoClear=n}_applyGGXFilter(e,t,n){let r=this._renderer,i=this._pingPongRenderTarget,a=this._ggxMaterial,o=this._lodMeshes[n];o.material=a;let s=a.uniforms,c=n/(this._lodMeshes.length-1),l=t/(this._lodMeshes.length-1),u=Math.sqrt(c*c-l*l)*(c*1.25),{_lodMax:d}=this,f=this._sizeLods[n],p=3*f*(n>d-Ra?n-d+Ra:0),m=4*(this._cubeSize-f);s.envMap.value=e.texture,s.roughness.value=u,s.mipInt.value=d-t,$a(i,p,m,3*f,2*f),r.setRenderTarget(i),r.render(o,Ha),s.envMap.value=i.texture,s.roughness.value=0,s.mipInt.value=d-n,$a(e,p,m,3*f,2*f),r.setRenderTarget(e),r.render(o,Ha)}_blur(e,t,n,r){let i=this._pingPongRenderTarget,a=Math.min(r,Math.PI)/Math.SQRT2;this._blurPass(e,i,t,n,a),this._blurPass(i,e,n,n,a)}_blurPass(e,t,n,r,i){let a=this._renderer,o=this._blurMaterial,s=this._lodMeshes[r];s.material=o;let c=o.uniforms;c.envMap.value=e.texture,c.sigma.value=i,c.mipInt.value=this._lodMax-n;let l=this._sizeLods[r];$a(t,3*l*(r>this._lodMax-Ra?r-this._lodMax+Ra:0),4*(this._cubeSize-l),3*l,2*l),a.setRenderTarget(t),a.render(s,Ha)}};function Za(e){let t=[],n=[],r=e,i=e-Ra+1+za;for(let e=0;e<i;e++){let e=2**r;t.push(e);let i=1/(e-2),a=-i,o=1+i,s=[a,a,o,a,o,o,a,a,o,o,a,o],c=new Float32Array(108),l=new Float32Array(108);for(let e=0;e<6;e++){let t=e%3*2/3-1,n=e>2?0:-1,r=[t,n,0,t+2/3,n,0,t+2/3,n+1,0,t,n,0,t+2/3,n+1,0,t,n+1,0];c.set(r,18*e);for(let t=0;t<6;t++){let n=s[t*2]*2-1,r=s[t*2+1]*2-1;e===0?Ya.set(1,r,n):e===1?Ya.set(-n,1,-r):e===2?Ya.set(-n,r,1):e===3?Ya.set(-1,r,-n):e===4?Ya.set(-n,-1,r):Ya.set(n,r,-1),Ya.toArray(l,(e*6+t)*3)}}let u=new Er;u.setAttribute(`position`,new dr(c,3)),u.setAttribute(`outputDirection`,new dr(l,3)),n.push(new $r(u,null)),r>Ra&&r--}return{lodMeshes:n,sizeLods:t}}function Qa(e,t,n){let r=new qt(e,t,n);return r.texture.mapping=306,r.texture.name=`PMREM.cubeUv`,r.scissorTest=!0,r}function $a(e,t,n,r,i){e.viewport.set(t,n,r,i),e.scissor.set(t,n,r,i)}function eo(e,t,n){return new Ai({name:`PMREMGGXConvolution`,defines:{GGX_SAMPLES:Va,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/n,CUBEUV_MAX_MIP:`${e}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:io(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float roughness;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359

			// Van der Corput radical inverse
			float radicalInverse_VdC(uint bits) {
				bits = (bits << 16u) | (bits >> 16u);
				bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
				bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
				bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
				bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
				return float(bits) * 2.3283064365386963e-10; // / 0x100000000
			}

			// Hammersley sequence
			vec2 hammersley(uint i, uint N) {
				return vec2(float(i) / float(N), radicalInverse_VdC(i));
			}

			// GGX VNDF importance sampling (Eric Heitz 2018)
			// "Sampling the GGX Distribution of Visible Normals"
			// https://jcgt.org/published/0007/04/01/
			vec3 importanceSampleGGX_VNDF(vec2 Xi, vec3 V, float roughness) {
				float alpha = roughness * roughness;

				// Section 4.1: Orthonormal basis
				vec3 T1 = vec3(1.0, 0.0, 0.0);
				vec3 T2 = cross(V, T1);

				// Section 4.2: Parameterization of projected area
				float r = sqrt(Xi.x);
				float phi = 2.0 * PI * Xi.y;
				float t1 = r * cos(phi);
				float t2 = r * sin(phi);
				float s = 0.5 * (1.0 + V.z);
				t2 = (1.0 - s) * sqrt(1.0 - t1 * t1) + s * t2;

				// Section 4.3: Reprojection onto hemisphere
				vec3 Nh = t1 * T1 + t2 * T2 + sqrt(max(0.0, 1.0 - t1 * t1 - t2 * t2)) * V;

				// Section 3.4: Transform back to ellipsoid configuration
				return normalize(vec3(alpha * Nh.x, alpha * Nh.y, max(0.0, Nh.z)));
			}

			void main() {
				vec3 N = normalize(vOutputDirection);
				vec3 V = N; // Assume view direction equals normal for pre-filtering

				vec3 prefilteredColor = vec3(0.0);
				float totalWeight = 0.0;

				// For very low roughness, just sample the environment directly
				if (roughness < 0.001) {
					gl_FragColor = vec4(bilinearCubeUV(envMap, N, mipInt), 1.0);
					return;
				}

				// Tangent space basis for VNDF sampling
				vec3 up = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
				vec3 tangent = normalize(cross(up, N));
				vec3 bitangent = cross(N, tangent);

				for(uint i = 0u; i < uint(GGX_SAMPLES); i++) {
					vec2 Xi = hammersley(i, uint(GGX_SAMPLES));

					// For PMREM, V = N, so in tangent space V is always (0, 0, 1)
					vec3 H_tangent = importanceSampleGGX_VNDF(Xi, vec3(0.0, 0.0, 1.0), roughness);

					// Transform H back to world space
					vec3 H = normalize(tangent * H_tangent.x + bitangent * H_tangent.y + N * H_tangent.z);
					vec3 L = normalize(2.0 * dot(V, H) * H - V);

					float NdotL = max(dot(N, L), 0.0);

					if(NdotL > 0.0) {
						// Sample environment at fixed mip level
						// VNDF importance sampling handles the distribution filtering
						vec3 sampleColor = bilinearCubeUV(envMap, L, mipInt);

						// Weight by NdotL for the split-sum approximation
						// VNDF PDF naturally accounts for the visible microfacet distribution
						prefilteredColor += sampleColor * NdotL;
						totalWeight += NdotL;
					}
				}

				if (totalWeight > 0.0) {
					prefilteredColor = prefilteredColor / totalWeight;
				}

				gl_FragColor = vec4(prefilteredColor, 1.0);
			}
		`,blending:0,depthTest:!1,depthWrite:!1})}function to(e,t,n){return new Ai({name:`SphericalGaussianBlur`,defines:{SAMPLES:Ba,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/n,CUBEUV_MAX_MIP:`${e}.0`},uniforms:{envMap:{value:null},sigma:{value:0},mipInt:{value:0}},vertexShader:io(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float sigma;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359
			#define GOLDEN_ANGLE 2.39996322973

			void main() {

				if ( sigma == 0.0 ) {

					gl_FragColor = vec4( bilinearCubeUV( envMap, vOutputDirection, mipInt ), 1.0 );
					return;

				}

				vec3 outputDirection = normalize( vOutputDirection );

				vec3 up = abs( outputDirection.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
				vec3 tangent = normalize( cross( up, outputDirection ) );
				vec3 bitangent = cross( outputDirection, tangent );

				// Truncate the kernel at three standard deviations or at the antipode.
				float thetaMax = min( 3.0 * sigma, PI );
				float truncation = 1.0 - exp( - 0.5 * thetaMax * thetaMax / ( sigma * sigma ) );

				vec3 accumColor = vec3( 0.0 );
				float accumWeight = 0.0;

				for ( int i = 0; i < SAMPLES; i ++ ) {

					// Stratified inverse-CDF sampling of the Gaussian, placed on a golden-angle spiral.
					float stratum = ( float( i ) + 0.5 ) / float( SAMPLES );
					float theta = sigma * sqrt( - 2.0 * log( 1.0 - stratum * truncation ) );
					float phi = float( i ) * GOLDEN_ANGLE;

					vec3 offset = cos( phi ) * tangent + sin( phi ) * bitangent;
					vec3 sampleDirection = cos( theta ) * outputDirection + sin( theta ) * offset;

					// Correct the planar sample density to solid angle.
					float weight = sin( theta ) / theta;

					accumColor += weight * bilinearCubeUV( envMap, sampleDirection, mipInt );
					accumWeight += weight;

				}

				gl_FragColor = vec4( accumColor / accumWeight, 1.0 );

			}
		`,blending:0,depthTest:!1,depthWrite:!1})}function no(){return new Ai({name:`EquirectangularToCubeUV`,uniforms:{envMap:{value:null}},vertexShader:io(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:0,depthTest:!1,depthWrite:!1})}function ro(){return new Ai({name:`CubemapToCubeUV`,uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:io(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:0,depthTest:!1,depthWrite:!1})}function io(){return`

		precision mediump float;
		precision mediump int;

		attribute vec3 outputDirection;

		varying vec3 vOutputDirection;

		void main() {

			vOutputDirection = outputDirection;
			gl_Position = vec4( position, 1.0 );

		}
	`}var ao=class extends qt{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let n={width:e,height:e,depth:1},r=[n,n,n,n,n,n];this.texture=new gi(r),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},r=new bi(5,5,5),i=new Ai({name:`CubemapFromEquirect`,uniforms:Si(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:1,blending:0});i.uniforms.tEquirect.value=t;let a=new $r(r,i),o=t.minFilter;return t.minFilter===1008&&(t.minFilter=c),new da(1,10,this).update(e,a),t.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(e,t=!0,n=!0,r=!0){let i=e.getRenderTarget();for(let i=0;i<6;i++)e.setRenderTarget(this,i),e.clear(t,n,r);e.setRenderTarget(i)}};function oo(e){let t=new WeakMap,n=new WeakMap,r=null;function i(e,t=!1){return e==null?null:t?o(e):a(e)}function a(n){if(n&&n.isTexture){let r=n.mapping;if(r===303||r===304){if(t.has(n)){let e=t.get(n).texture;return s(e,n.mapping)}{let r=n.image;if(r&&r.height>0){let i=new ao(r.height);return i.fromEquirectangularTexture(e,n),t.set(n,i),n.addEventListener(`dispose`,l),s(i.texture,n.mapping)}return null}}}return n}function o(t){if(t&&t.isTexture){let i=t.mapping,a=i===303||i===304,o=i===301||i===302;if(a||o){let i=n.get(t),s=i===void 0?0:i.texture.pmremVersion;if(t.isRenderTargetTexture&&t.pmremVersion!==s)return r===null&&(r=new Xa(e)),i=a?r.fromEquirectangular(t,i):r.fromCubemap(t,i),i.texture.pmremVersion=t.pmremVersion,n.set(t,i),i.texture;if(i!==void 0)return i.texture;{let s=t.image;return a&&s&&s.height>0||o&&s&&c(s)?(r===null&&(r=new Xa(e)),i=a?r.fromEquirectangular(t):r.fromCubemap(t),i.texture.pmremVersion=t.pmremVersion,n.set(t,i),t.addEventListener(`dispose`,u),i.texture):null}}}return t}function s(e,t){return t===303?e.mapping=301:t===304&&(e.mapping=302),e}function c(e){let t=0;for(let n=0;n<6;n++)e[n]!==void 0&&t++;return t===6}function l(e){let n=e.target;n.removeEventListener(`dispose`,l);let r=t.get(n);r!==void 0&&(t.delete(n),r.dispose())}function u(e){let t=e.target;t.removeEventListener(`dispose`,u);let r=n.get(t);r!==void 0&&(n.delete(t),r.dispose())}function d(){t=new WeakMap,n=new WeakMap,r!==null&&(r.dispose(),r=null)}return{get:i,dispose:d}}function so(e){let t={};function n(n){if(t[n]!==void 0)return t[n];let r=e.getExtension(n);return t[n]=r,r}return{has:function(e){return n(e)!==null},init:function(){n(`EXT_color_buffer_float`),n(`WEBGL_clip_cull_distance`),n(`OES_texture_float_linear`),n(`EXT_color_buffer_half_float`),n(`WEBGL_multisampled_render_to_texture`),n(`WEBGL_render_shared_exponent`)},get:function(e){let t=n(e);return t===null&&$e(`WebGLRenderer: `+e+` extension not supported.`),t}}}function co(e,t,n,r){let i={},a=new WeakMap;function o(e){let s=e.target;s.index!==null&&t.remove(s.index);for(let e in s.attributes)t.remove(s.attributes[e]);s.removeEventListener(`dispose`,o),delete i[s.id];let c=a.get(s);c&&(t.remove(c),a.delete(s)),r.releaseStatesOfGeometry(s),s.isInstancedBufferGeometry===!0&&delete s._maxInstanceCount,n.memory.geometries--}function s(e,t){return i[t.id]===!0||(t.addEventListener(`dispose`,o),i[t.id]=!0,n.memory.geometries++),t}function c(n){let r=n.attributes;for(let n in r)t.update(r[n],e.ARRAY_BUFFER)}function l(e){let n=[],r=e.index,i=e.attributes.position,o=0;if(i===void 0)return;if(r!==null){let e=r.array;o=r.version;for(let t=0,r=e.length;t<r;t+=3){let r=e[t+0],i=e[t+1],a=e[t+2];n.push(r,i,i,a,a,r)}}else{let e=i.array;o=i.version;for(let t=0,r=e.length/3-1;t<r;t+=3){let e=t+0,r=t+1,i=t+2;n.push(e,r,r,i,i,e)}}let s=new(i.count>=65535?pr:fr)(n,1);s.version=o;let c=a.get(e);c&&t.remove(c),a.set(e,s)}function u(e){let t=a.get(e);if(t){let n=e.index;n!==null&&t.version<n.version&&l(e)}else l(e);return a.get(e)}return{get:s,update:c,getWireframeAttribute:u}}function lo(e,t,n){let r;function i(e){r=e}let a,o;function s(e){a=e.type,o=e.bytesPerElement}function c(t,i){e.drawElements(r,i,a,t*o),n.update(i,r,1)}function l(t,i,s){s!==0&&(e.drawElementsInstanced(r,i,a,t*o,s),n.update(i,r,s))}function u(e,i,o){if(o===0)return;t.get(`WEBGL_multi_draw`).multiDrawElementsWEBGL(r,i,0,a,e,0,o);let s=0;for(let e=0;e<o;e++)s+=i[e];n.update(s,r,1)}this.setMode=i,this.setIndex=s,this.render=c,this.renderInstances=l,this.renderMultiDraw=u}function uo(e){let t={geometries:0,textures:0},n={frame:0,calls:0,triangles:0,points:0,lines:0};function r(t,r,i){switch(n.calls++,r){case e.TRIANGLES:n.triangles+=t/3*i;break;case e.LINES:n.lines+=t/2*i;break;case e.LINE_STRIP:n.lines+=i*(t-1);break;case e.LINE_LOOP:n.lines+=i*t;break;case e.POINTS:n.points+=i*t;break;default:H(`WebGLInfo: Unknown draw mode:`,r)}}function i(){n.calls=0,n.triangles=0,n.points=0,n.lines=0}return{memory:t,render:n,programs:null,autoReset:!0,reset:i,update:r}}function fo(e,t,n){let r=new WeakMap,i=new Gt;function a(a,o,s){let c=a.morphTargetInfluences,l=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,u=l===void 0?0:l.length,d=r.get(o);if(d===void 0||d.count!==u){d!==void 0&&d.texture.dispose();let e=o.morphAttributes.position!==void 0,n=o.morphAttributes.normal!==void 0,a=o.morphAttributes.color!==void 0,s=o.morphAttributes.position||[],c=o.morphAttributes.normal||[],l=o.morphAttributes.color||[],f=0;e===!0&&(f=1),n===!0&&(f=2),a===!0&&(f=3);let p=o.attributes.position.count*f,m=1;p>t.maxTextureSize&&(m=Math.ceil(p/t.maxTextureSize),p=t.maxTextureSize);let h=new Float32Array(p*m*4*u),g=new Jt(h,p,m,u);g.type=_,g.needsUpdate=!0;let v=f*4;for(let t=0;t<u;t++){let r=s[t],o=c[t],u=l[t],d=p*m*4*t;for(let t=0;t<r.count;t++){let s=t*v;e===!0&&(i.fromBufferAttribute(r,t),h[d+s+0]=i.x,h[d+s+1]=i.y,h[d+s+2]=i.z,h[d+s+3]=0),n===!0&&(i.fromBufferAttribute(o,t),h[d+s+4]=i.x,h[d+s+5]=i.y,h[d+s+6]=i.z,h[d+s+7]=0),a===!0&&(i.fromBufferAttribute(u,t),h[d+s+8]=i.x,h[d+s+9]=i.y,h[d+s+10]=i.z,h[d+s+11]=u.itemSize===4?i.w:1)}}d={count:u,texture:g,size:new G(p,m)},r.set(o,d);function y(){g.dispose(),r.delete(o),o.removeEventListener(`dispose`,y)}o.addEventListener(`dispose`,y)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)s.getUniforms().setValue(e,`morphTexture`,a.morphTexture,n);else{let t=0;for(let e=0;e<c.length;e++)t+=c[e];let n=o.morphTargetsRelative?1:1-t;s.getUniforms().setValue(e,`morphTargetBaseInfluence`,n),s.getUniforms().setValue(e,`morphTargetInfluences`,c)}s.getUniforms().setValue(e,`morphTargetsTexture`,d.texture,n),s.getUniforms().setValue(e,`morphTargetsTextureSize`,d.size)}return{update:a}}function po(e,t,n,r,i){let a=new WeakMap;function o(r){let o=i.render.frame,s=r.geometry,l=t.get(r,s);if(a.get(l)!==o&&(t.update(l),a.set(l,o)),r.isInstancedMesh&&(r.hasEventListener(`dispose`,c)===!1&&r.addEventListener(`dispose`,c),a.get(r)!==o&&(n.update(r.instanceMatrix,e.ARRAY_BUFFER),r.instanceColor!==null&&n.update(r.instanceColor,e.ARRAY_BUFFER),a.set(r,o))),r.isSkinnedMesh){let e=r.skeleton;a.get(e)!==o&&(e.update(),a.set(e,o))}return l}function s(){a=new WeakMap}function c(e){let t=e.target;t.removeEventListener(`dispose`,c),r.releaseStatesOfObject(t),n.remove(t.instanceMatrix),t.instanceColor!==null&&n.remove(t.instanceColor)}return{update:o,dispose:s}}var mo={1:`LINEAR_TONE_MAPPING`,2:`REINHARD_TONE_MAPPING`,3:`CINEON_TONE_MAPPING`,4:`ACES_FILMIC_TONE_MAPPING`,6:`AGX_TONE_MAPPING`,7:`NEUTRAL_TONE_MAPPING`,5:`CUSTOM_TONE_MAPPING`};function ho(e,t,n,r,i,a){let o=new qt(t,n,{type:e,depthBuffer:i,stencilBuffer:a,samples:r?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1}),s=null,c=null,l=new Er;l.setAttribute(`position`,new mr([-1,3,0,-1,-1,0,3,-1,0],3)),l.setAttribute(`uv`,new mr([0,2,0,0,2,0],2));let u=new ji({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:!1,depthWrite:!1}),d=new $r(l,u),f=new sa(-1,1,1,-1,0,1),p=null,m=null,h=!1,g,_=null,y=[],b=!1;this.setSize=function(e,t){o.setSize(e,t),s!==null&&s.setSize(e,t),c!==null&&c.setSize(e,t);for(let n=0;n<y.length;n++){let r=y[n];r.setSize&&r.setSize(e,t)}},this.setEffects=function(e){y=e,b=y.length>0&&y[0].isRenderPass===!0;let t=o.width,n=o.height;y.length>0&&s===null&&(s=new qt(t,n,{type:v,depthBuffer:!1,stencilBuffer:!1}),c=new qt(t,n,{type:v,depthBuffer:!1,stencilBuffer:!1}));for(let e=0;e<y.length;e++){let r=y[e];r.setSize&&r.setSize(t,n)}},this.begin=function(e,t){if(h||e.toneMapping===0&&y.length===0)return!1;if(_=t,t!==null){let e=t.width,n=t.height;(o.width!==e||o.height!==n)&&this.setSize(e,n)}return b===!1&&e.setRenderTarget(o),g=e.toneMapping,e.toneMapping=0,!0},this.hasRenderPass=function(){return b},this.end=function(e,t){e.toneMapping=g,h=!0;let n=o,r=s;for(let i=0;i<y.length;i++){let a=y[i];a.enabled!==!1&&(a.render(e,r,n,t),a.needsSwap!==!1&&(n=r,r=r===s?c:s))}if(p!==e.outputColorSpace||m!==e.toneMapping){p=e.outputColorSpace,m=e.toneMapping,u.defines={},J.getTransfer(p)===`srgb`&&(u.defines.SRGB_TRANSFER=``);let t=mo[m];t&&(u.defines[t]=``),u.needsUpdate=!0}u.uniforms.tDiffuse.value=n.texture,e.setRenderTarget(_),e.render(d,f),_=null,h=!1},this.isCompositing=function(){return h},this.dispose=function(){o.dispose(),s!==null&&s.dispose(),c!==null&&c.dispose(),l.dispose(),u.dispose()}}var go=new Wt,_o=new _i(1,1),vo=new Jt,yo=new Yt,bo=new gi,xo=[],So=[],Co=new Float32Array(16),wo=new Float32Array(9),To=new Float32Array(4);function Eo(e,t,n){let r=e[0];if(r<=0||r>0)return e;let i=t*n,a=xo[i];if(a===void 0&&(a=new Float32Array(i),xo[i]=a),t!==0){r.toArray(a,0);for(let r=1,i=0;r!==t;++r)i+=n,e[r].toArray(a,i)}return a}function Do(e,t){if(e.length!==t.length)return!1;for(let n=0,r=e.length;n<r;n++)if(e[n]!==t[n])return!1;return!0}function Oo(e,t){for(let n=0,r=t.length;n<r;n++)e[n]=t[n]}function ko(e,t){let n=So[t];n===void 0&&(n=new Int32Array(t),So[t]=n);for(let r=0;r!==t;++r)n[r]=e.allocateTextureUnit();return n}function Ao(e,t){let n=this.cache;n[0]!==t&&(e.uniform1f(this.addr,t),n[0]=t)}function jo(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2f(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(Do(n,t))return;e.uniform2fv(this.addr,t),Oo(n,t)}}function Mo(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3f(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else if(t.r!==void 0)(n[0]!==t.r||n[1]!==t.g||n[2]!==t.b)&&(e.uniform3f(this.addr,t.r,t.g,t.b),n[0]=t.r,n[1]=t.g,n[2]=t.b);else{if(Do(n,t))return;e.uniform3fv(this.addr,t),Oo(n,t)}}function No(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4f(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(Do(n,t))return;e.uniform4fv(this.addr,t),Oo(n,t)}}function Po(e,t){let n=this.cache,r=t.elements;if(r===void 0){if(Do(n,t))return;e.uniformMatrix2fv(this.addr,!1,t),Oo(n,t)}else{if(Do(n,r))return;To.set(r),e.uniformMatrix2fv(this.addr,!1,To),Oo(n,r)}}function Fo(e,t){let n=this.cache,r=t.elements;if(r===void 0){if(Do(n,t))return;e.uniformMatrix3fv(this.addr,!1,t),Oo(n,t)}else{if(Do(n,r))return;wo.set(r),e.uniformMatrix3fv(this.addr,!1,wo),Oo(n,r)}}function Io(e,t){let n=this.cache,r=t.elements;if(r===void 0){if(Do(n,t))return;e.uniformMatrix4fv(this.addr,!1,t),Oo(n,t)}else{if(Do(n,r))return;Co.set(r),e.uniformMatrix4fv(this.addr,!1,Co),Oo(n,r)}}function Lo(e,t){let n=this.cache;n[0]!==t&&(e.uniform1i(this.addr,t),n[0]=t)}function Ro(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2i(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(Do(n,t))return;e.uniform2iv(this.addr,t),Oo(n,t)}}function zo(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3i(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else{if(Do(n,t))return;e.uniform3iv(this.addr,t),Oo(n,t)}}function Bo(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4i(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(Do(n,t))return;e.uniform4iv(this.addr,t),Oo(n,t)}}function Vo(e,t){let n=this.cache;n[0]!==t&&(e.uniform1ui(this.addr,t),n[0]=t)}function Ho(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2ui(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(Do(n,t))return;e.uniform2uiv(this.addr,t),Oo(n,t)}}function Uo(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3ui(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else{if(Do(n,t))return;e.uniform3uiv(this.addr,t),Oo(n,t)}}function Wo(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4ui(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(Do(n,t))return;e.uniform4uiv(this.addr,t),Oo(n,t)}}function Go(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i);let a;this.type===e.SAMPLER_2D_SHADOW?(_o.compareFunction=n.isReversedDepthBuffer()?518:515,a=_o):a=go,n.setTexture2D(t||a,i)}function Ko(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i),n.setTexture3D(t||yo,i)}function qo(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i),n.setTextureCube(t||bo,i)}function Jo(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i),n.setTexture2DArray(t||vo,i)}function Yo(e){switch(e){case 5126:return Ao;case 35664:return jo;case 35665:return Mo;case 35666:return No;case 35674:return Po;case 35675:return Fo;case 35676:return Io;case 5124:case 35670:return Lo;case 35667:case 35671:return Ro;case 35668:case 35672:return zo;case 35669:case 35673:return Bo;case 5125:return Vo;case 36294:return Ho;case 36295:return Uo;case 36296:return Wo;case 35678:case 36198:case 36298:case 36306:case 35682:return Go;case 35679:case 36299:case 36307:return Ko;case 35680:case 36300:case 36308:case 36293:return qo;case 36289:case 36303:case 36311:case 36292:return Jo}}function Xo(e,t){e.uniform1fv(this.addr,t)}function Zo(e,t){let n=Eo(t,this.size,2);e.uniform2fv(this.addr,n)}function Qo(e,t){let n=Eo(t,this.size,3);e.uniform3fv(this.addr,n)}function $o(e,t){let n=Eo(t,this.size,4);e.uniform4fv(this.addr,n)}function es(e,t){let n=Eo(t,this.size,4);e.uniformMatrix2fv(this.addr,!1,n)}function ts(e,t){let n=Eo(t,this.size,9);e.uniformMatrix3fv(this.addr,!1,n)}function ns(e,t){let n=Eo(t,this.size,16);e.uniformMatrix4fv(this.addr,!1,n)}function rs(e,t){e.uniform1iv(this.addr,t)}function is(e,t){e.uniform2iv(this.addr,t)}function as(e,t){e.uniform3iv(this.addr,t)}function os(e,t){e.uniform4iv(this.addr,t)}function ss(e,t){e.uniform1uiv(this.addr,t)}function cs(e,t){e.uniform2uiv(this.addr,t)}function ls(e,t){e.uniform3uiv(this.addr,t)}function us(e,t){e.uniform4uiv(this.addr,t)}function ds(e,t,n){let r=this.cache,i=t.length,a=ko(n,i);Do(r,a)||(e.uniform1iv(this.addr,a),Oo(r,a));let o;o=this.type===e.SAMPLER_2D_SHADOW?_o:go;for(let e=0;e!==i;++e)n.setTexture2D(t[e]||o,a[e])}function fs(e,t,n){let r=this.cache,i=t.length,a=ko(n,i);Do(r,a)||(e.uniform1iv(this.addr,a),Oo(r,a));for(let e=0;e!==i;++e)n.setTexture3D(t[e]||yo,a[e])}function ps(e,t,n){let r=this.cache,i=t.length,a=ko(n,i);Do(r,a)||(e.uniform1iv(this.addr,a),Oo(r,a));for(let e=0;e!==i;++e)n.setTextureCube(t[e]||bo,a[e])}function ms(e,t,n){let r=this.cache,i=t.length,a=ko(n,i);Do(r,a)||(e.uniform1iv(this.addr,a),Oo(r,a));for(let e=0;e!==i;++e)n.setTexture2DArray(t[e]||vo,a[e])}function hs(e){switch(e){case 5126:return Xo;case 35664:return Zo;case 35665:return Qo;case 35666:return $o;case 35674:return es;case 35675:return ts;case 35676:return ns;case 5124:case 35670:return rs;case 35667:case 35671:return is;case 35668:case 35672:return as;case 35669:case 35673:return os;case 5125:return ss;case 36294:return cs;case 36295:return ls;case 36296:return us;case 35678:case 36198:case 36298:case 36306:case 35682:return ds;case 35679:case 36299:case 36307:return fs;case 35680:case 36300:case 36308:case 36293:return ps;case 36289:case 36303:case 36311:case 36292:return ms}}var gs=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=Yo(t.type)}},_s=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=hs(t.type)}},vs=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){let r=this.seq;for(let i=0,a=r.length;i!==a;++i){let a=r[i];a.setValue(e,t[a.id],n)}}},ys=/(\w+)(\])?(\[|\.)?/g;function bs(e,t){e.seq.push(t),e.map[t.id]=t}function xs(e,t,n){let r=e.name,i=r.length;for(ys.lastIndex=0;;){let a=ys.exec(r),o=ys.lastIndex,s=a[1],c=a[2]===`]`,l=a[3];if(c&&(s|=0),l===void 0||l===`[`&&o+2===i){bs(n,l===void 0?new gs(s,e,t):new _s(s,e,t));break}{let e=n.map[s];e===void 0&&(e=new vs(s),bs(n,e)),n=e}}}var Ss=class{constructor(e,t){this.seq=[],this.map={};let n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let r=0;r<n;++r){let n=e.getActiveUniform(t,r);xs(n,e.getUniformLocation(t,n.name),this)}let r=[],i=[];for(let t of this.seq)t.type===e.SAMPLER_2D_SHADOW||t.type===e.SAMPLER_CUBE_SHADOW||t.type===e.SAMPLER_2D_ARRAY_SHADOW?r.push(t):i.push(t);r.length>0&&(this.seq=r.concat(i))}setValue(e,t,n,r){let i=this.map[t];i!==void 0&&i.setValue(e,n,r)}setOptional(e,t,n){let r=t[n];r!==void 0&&this.setValue(e,n,r)}static upload(e,t,n,r){for(let i=0,a=t.length;i!==a;++i){let a=t[i],o=n[a.id];o.needsUpdate!==!1&&a.setValue(e,o.value,r)}}static seqWithValue(e,t){let n=[];for(let r=0,i=e.length;r!==i;++r){let i=e[r];i.id in t&&n.push(i)}return n}};function Cs(e,t,n){let r=e.createShader(t);return e.shaderSource(r,n),e.compileShader(r),r}var ws=37297,Ts=0;function Es(e,t){let n=e.split(`
`),r=[],i=Math.max(t-6,0),a=Math.min(t+6,n.length);for(let e=i;e<a;e++){let i=e+1;r.push(`${i===t?`>`:` `} ${i}: ${n[e]}`)}return r.join(`
`)}var Ds=new q;function Os(e){J._getMatrix(Ds,J.workingColorSpace,e);let t=`mat3( ${Ds.elements.map(e=>e.toFixed(4))} )`;switch(J.getTransfer(e)){case ze:return[t,`LinearTransferOETF`];case Be:return[t,`sRGBTransferOETF`];default:return V(`WebGLProgram: Unsupported color space: `,e),[t,`LinearTransferOETF`]}}function ks(e,t,n){let r=e.getShaderParameter(t,e.COMPILE_STATUS),i=(e.getShaderInfoLog(t)||``).trim();if(r&&i===``)return``;let a=/ERROR: 0:(\d+)/.exec(i);if(a){let r=parseInt(a[1]);return n.toUpperCase()+`

`+i+`

`+Es(e.getShaderSource(t),r)}return i}function As(e,t){let n=Os(t);return[`vec4 ${e}( vec4 value ) {`,`	return ${n[1]}( vec4( value.rgb * ${n[0]}, value.a ) );`,`}`].join(`
`)}var js={1:`Linear`,2:`Reinhard`,3:`Cineon`,4:`ACESFilmic`,6:`AgX`,7:`Neutral`,5:`Custom`};function Ms(e,t){let n=js[t];return n===void 0?(V(`WebGLProgram: Unsupported toneMapping:`,t),`vec3 `+e+`( vec3 color ) { return LinearToneMapping( color ); }`):`vec3 `+e+`( vec3 color ) { return `+n+`ToneMapping( color ); }`}var Ns=new K;function Ps(){return J.getLuminanceCoefficients(Ns),[`float luminance( const in vec3 rgb ) {`,`	const vec3 weights = vec3( ${Ns.x.toFixed(4)}, ${Ns.y.toFixed(4)}, ${Ns.z.toFixed(4)} );`,`	return dot( weights, rgb );`,`}`].join(`
`)}function Fs(e){return[e.extensionClipCullDistance?`#extension GL_ANGLE_clip_cull_distance : require`:``,e.extensionMultiDraw?`#extension GL_ANGLE_multi_draw : require`:``].filter(Rs).join(`
`)}function Is(e){let t=[];for(let n in e){let r=e[n];r!==!1&&t.push(`#define `+n+` `+r)}return t.join(`
`)}function Ls(e,t){let n={},r=e.getProgramParameter(t,e.ACTIVE_ATTRIBUTES);for(let i=0;i<r;i++){let r=e.getActiveAttrib(t,i),a=r.name,o=1;r.type===e.FLOAT_MAT2&&(o=2),r.type===e.FLOAT_MAT3&&(o=3),r.type===e.FLOAT_MAT4&&(o=4),n[a]={type:r.type,location:e.getAttribLocation(t,a),locationSize:o}}return n}function Rs(e){return e!==``}function zs(e,t){let n=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return e.replace(/NUM_SUN_LIGHTS/g,t.numSunLights).replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,n).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,t.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function Bs(e,t){return e.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}var Vs=/^[ \t]*#include +<([\w\d./]+)>/gm;function Hs(e){return e.replace(Vs,Ws)}var Us=new Map;function Ws(e,t){let n=Z[t];if(n===void 0){let e=Us.get(t);if(e!==void 0)n=Z[e],V(`WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.`,t,e);else throw Error(`THREE.WebGLProgram: Can not resolve #include <`+t+`>`)}return Hs(n)}var Gs=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Ks(e){return e.replace(Gs,qs)}function qs(e,t,n,r){let i=``;for(let e=parseInt(t);e<parseInt(n);e++)i+=r.replace(/\[\s*i\s*\]/g,`[ `+e+` ]`).replace(/UNROLLED_LOOP_INDEX/g,e);return i}function Js(e){let t=`precision ${e.precision} float;
	precision ${e.precision} int;
	precision ${e.precision} sampler2D;
	precision ${e.precision} samplerCube;
	precision ${e.precision} sampler3D;
	precision ${e.precision} sampler2DArray;
	precision ${e.precision} sampler2DShadow;
	precision ${e.precision} samplerCubeShadow;
	precision ${e.precision} sampler2DArrayShadow;
	precision ${e.precision} isampler2D;
	precision ${e.precision} isampler3D;
	precision ${e.precision} isamplerCube;
	precision ${e.precision} isampler2DArray;
	precision ${e.precision} usampler2D;
	precision ${e.precision} usampler3D;
	precision ${e.precision} usamplerCube;
	precision ${e.precision} usampler2DArray;
	`;return e.precision===`highp`?t+=`
#define HIGH_PRECISION`:e.precision===`mediump`?t+=`
#define MEDIUM_PRECISION`:e.precision===`lowp`&&(t+=`
#define LOW_PRECISION`),t}var Ys={1:`SHADOWMAP_TYPE_PCF`,3:`SHADOWMAP_TYPE_VSM`};function Xs(e){return Ys[e.shadowMapType]||`SHADOWMAP_TYPE_BASIC`}var Zs={301:`ENVMAP_TYPE_CUBE`,302:`ENVMAP_TYPE_CUBE`,306:`ENVMAP_TYPE_CUBE_UV`};function Qs(e){return e.envMap===!1?`ENVMAP_TYPE_CUBE`:Zs[e.envMapMode]||`ENVMAP_TYPE_CUBE`}var $s={302:`ENVMAP_MODE_REFRACTION`};function ec(e){return e.envMap===!1?`ENVMAP_MODE_REFLECTION`:$s[e.envMapMode]||`ENVMAP_MODE_REFLECTION`}var tc={0:`ENVMAP_BLENDING_MULTIPLY`,1:`ENVMAP_BLENDING_MIX`,2:`ENVMAP_BLENDING_ADD`};function nc(e){return e.envMap===!1?`ENVMAP_BLENDING_NONE`:tc[e.combine]||`ENVMAP_BLENDING_NONE`}function rc(e){let t=e.envMapCubeUVHeight;if(t===null)return null;let n=Math.log2(t)-2,r=1/t;return{texelWidth:1/(3*Math.max(2**n,112)),texelHeight:r,maxMip:n}}function ic(e,t,n,r){let i=e.getContext(),a=n.defines,o=n.vertexShader,s=n.fragmentShader,c=Xs(n),l=Qs(n),u=ec(n),d=nc(n),f=rc(n),p=Fs(n),m=Is(a),h=i.createProgram(),g,_,v=n.glslVersion?`#version `+n.glslVersion+`
`:``;n.isRawShaderMaterial?(g=[`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,m].filter(Rs).join(`
`),g.length>0&&(g+=`
`),_=[`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,m].filter(Rs).join(`
`),_.length>0&&(_+=`
`)):(g=[Js(n),`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,m,n.extensionClipCullDistance?`#define USE_CLIP_DISTANCE`:``,n.batching?`#define USE_BATCHING`:``,n.batchingColor?`#define USE_BATCHING_COLOR`:``,n.instancing?`#define USE_INSTANCING`:``,n.instancingColor?`#define USE_INSTANCING_COLOR`:``,n.instancingMorph?`#define USE_INSTANCING_MORPH`:``,n.useFog&&n.fog?`#define USE_FOG`:``,n.useFog&&n.fogExp2?`#define FOG_EXP2`:``,n.map?`#define USE_MAP`:``,n.envMap?`#define USE_ENVMAP`:``,n.envMap?`#define `+u:``,n.lightMap?`#define USE_LIGHTMAP`:``,n.aoMap?`#define USE_AOMAP`:``,n.bumpMap?`#define USE_BUMPMAP`:``,n.normalMap?`#define USE_NORMALMAP`:``,n.normalMapObjectSpace?`#define USE_NORMALMAP_OBJECTSPACE`:``,n.normalMapTangentSpace?`#define USE_NORMALMAP_TANGENTSPACE`:``,n.displacementMap?`#define USE_DISPLACEMENTMAP`:``,n.emissiveMap?`#define USE_EMISSIVEMAP`:``,n.anisotropy?`#define USE_ANISOTROPY`:``,n.anisotropyMap?`#define USE_ANISOTROPYMAP`:``,n.clearcoatMap?`#define USE_CLEARCOATMAP`:``,n.clearcoatRoughnessMap?`#define USE_CLEARCOAT_ROUGHNESSMAP`:``,n.clearcoatNormalMap?`#define USE_CLEARCOAT_NORMALMAP`:``,n.iridescenceMap?`#define USE_IRIDESCENCEMAP`:``,n.iridescenceThicknessMap?`#define USE_IRIDESCENCE_THICKNESSMAP`:``,n.specularMap?`#define USE_SPECULARMAP`:``,n.specularColorMap?`#define USE_SPECULAR_COLORMAP`:``,n.specularIntensityMap?`#define USE_SPECULAR_INTENSITYMAP`:``,n.roughnessMap?`#define USE_ROUGHNESSMAP`:``,n.metalnessMap?`#define USE_METALNESSMAP`:``,n.alphaMap?`#define USE_ALPHAMAP`:``,n.alphaHash?`#define USE_ALPHAHASH`:``,n.transmission?`#define USE_TRANSMISSION`:``,n.transmissionMap?`#define USE_TRANSMISSIONMAP`:``,n.thicknessMap?`#define USE_THICKNESSMAP`:``,n.sheenColorMap?`#define USE_SHEEN_COLORMAP`:``,n.sheenRoughnessMap?`#define USE_SHEEN_ROUGHNESSMAP`:``,n.mapUv?`#define MAP_UV `+n.mapUv:``,n.alphaMapUv?`#define ALPHAMAP_UV `+n.alphaMapUv:``,n.lightMapUv?`#define LIGHTMAP_UV `+n.lightMapUv:``,n.aoMapUv?`#define AOMAP_UV `+n.aoMapUv:``,n.emissiveMapUv?`#define EMISSIVEMAP_UV `+n.emissiveMapUv:``,n.bumpMapUv?`#define BUMPMAP_UV `+n.bumpMapUv:``,n.normalMapUv?`#define NORMALMAP_UV `+n.normalMapUv:``,n.displacementMapUv?`#define DISPLACEMENTMAP_UV `+n.displacementMapUv:``,n.metalnessMapUv?`#define METALNESSMAP_UV `+n.metalnessMapUv:``,n.roughnessMapUv?`#define ROUGHNESSMAP_UV `+n.roughnessMapUv:``,n.anisotropyMapUv?`#define ANISOTROPYMAP_UV `+n.anisotropyMapUv:``,n.clearcoatMapUv?`#define CLEARCOATMAP_UV `+n.clearcoatMapUv:``,n.clearcoatNormalMapUv?`#define CLEARCOAT_NORMALMAP_UV `+n.clearcoatNormalMapUv:``,n.clearcoatRoughnessMapUv?`#define CLEARCOAT_ROUGHNESSMAP_UV `+n.clearcoatRoughnessMapUv:``,n.iridescenceMapUv?`#define IRIDESCENCEMAP_UV `+n.iridescenceMapUv:``,n.iridescenceThicknessMapUv?`#define IRIDESCENCE_THICKNESSMAP_UV `+n.iridescenceThicknessMapUv:``,n.sheenColorMapUv?`#define SHEEN_COLORMAP_UV `+n.sheenColorMapUv:``,n.sheenRoughnessMapUv?`#define SHEEN_ROUGHNESSMAP_UV `+n.sheenRoughnessMapUv:``,n.specularMapUv?`#define SPECULARMAP_UV `+n.specularMapUv:``,n.specularColorMapUv?`#define SPECULAR_COLORMAP_UV `+n.specularColorMapUv:``,n.specularIntensityMapUv?`#define SPECULAR_INTENSITYMAP_UV `+n.specularIntensityMapUv:``,n.transmissionMapUv?`#define TRANSMISSIONMAP_UV `+n.transmissionMapUv:``,n.thicknessMapUv?`#define THICKNESSMAP_UV `+n.thicknessMapUv:``,n.vertexTangents&&n.flatShading===!1?`#define USE_TANGENT`:``,n.vertexNormals?`#define HAS_NORMAL`:``,n.vertexColors?`#define USE_COLOR`:``,n.vertexAlphas?`#define USE_COLOR_ALPHA`:``,n.vertexUv1s?`#define USE_UV1`:``,n.vertexUv2s?`#define USE_UV2`:``,n.vertexUv3s?`#define USE_UV3`:``,n.pointsUvs?`#define USE_POINTS_UV`:``,n.flatShading?`#define FLAT_SHADED`:``,n.skinning?`#define USE_SKINNING`:``,n.morphTargets?`#define USE_MORPHTARGETS`:``,n.morphNormals&&n.flatShading===!1?`#define USE_MORPHNORMALS`:``,n.morphColors?`#define USE_MORPHCOLORS`:``,n.morphTargetsCount>0?`#define MORPHTARGETS_TEXTURE_STRIDE `+n.morphTextureStride:``,n.morphTargetsCount>0?`#define MORPHTARGETS_COUNT `+n.morphTargetsCount:``,n.doubleSided?`#define DOUBLE_SIDED`:``,n.flipSided?`#define FLIP_SIDED`:``,n.shadowMapEnabled?`#define USE_SHADOWMAP`:``,n.shadowMapEnabled?`#define `+c:``,n.sizeAttenuation?`#define USE_SIZEATTENUATION`:``,n.numLightProbes>0?`#define USE_LIGHT_PROBES`:``,n.logarithmicDepthBuffer?`#define USE_LOGARITHMIC_DEPTH_BUFFER`:``,n.reversedDepthBuffer?`#define USE_REVERSED_DEPTH_BUFFER`:``,`uniform mat4 modelMatrix;`,`uniform mat4 modelViewMatrix;`,`uniform mat4 projectionMatrix;`,`uniform mat4 viewMatrix;`,`uniform mat3 normalMatrix;`,`uniform vec3 cameraPosition;`,`uniform bool isOrthographic;`,`#ifdef USE_INSTANCING`,`	attribute mat4 instanceMatrix;`,`#endif`,`#ifdef USE_INSTANCING_COLOR`,`	attribute vec3 instanceColor;`,`#endif`,`#ifdef USE_INSTANCING_MORPH`,`	uniform sampler2D morphTexture;`,`#endif`,`attribute vec3 position;`,`attribute vec3 normal;`,`attribute vec2 uv;`,`#ifdef USE_UV1`,`	attribute vec2 uv1;`,`#endif`,`#ifdef USE_UV2`,`	attribute vec2 uv2;`,`#endif`,`#ifdef USE_UV3`,`	attribute vec2 uv3;`,`#endif`,`#ifdef USE_TANGENT`,`	attribute vec4 tangent;`,`#endif`,`#if defined( USE_COLOR_ALPHA )`,`	attribute vec4 color;`,`#elif defined( USE_COLOR )`,`	attribute vec3 color;`,`#endif`,`#ifdef USE_SKINNING`,`	attribute vec4 skinIndex;`,`	attribute vec4 skinWeight;`,`#endif`,`
`].filter(Rs).join(`
`),_=[Js(n),`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,m,n.useFog&&n.fog?`#define USE_FOG`:``,n.useFog&&n.fogExp2?`#define FOG_EXP2`:``,n.alphaToCoverage?`#define ALPHA_TO_COVERAGE`:``,n.map?`#define USE_MAP`:``,n.matcap?`#define USE_MATCAP`:``,n.envMap?`#define USE_ENVMAP`:``,n.envMap?`#define `+l:``,n.envMap?`#define `+u:``,n.envMap?`#define `+d:``,f?`#define CUBEUV_TEXEL_WIDTH `+f.texelWidth:``,f?`#define CUBEUV_TEXEL_HEIGHT `+f.texelHeight:``,f?`#define CUBEUV_MAX_MIP `+f.maxMip+`.0`:``,n.lightMap?`#define USE_LIGHTMAP`:``,n.aoMap?`#define USE_AOMAP`:``,n.bumpMap?`#define USE_BUMPMAP`:``,n.normalMap?`#define USE_NORMALMAP`:``,n.normalMapObjectSpace?`#define USE_NORMALMAP_OBJECTSPACE`:``,n.normalMapTangentSpace?`#define USE_NORMALMAP_TANGENTSPACE`:``,n.packedNormalMap?`#define USE_PACKED_NORMALMAP`:``,n.emissiveMap?`#define USE_EMISSIVEMAP`:``,n.anisotropy?`#define USE_ANISOTROPY`:``,n.anisotropyMap?`#define USE_ANISOTROPYMAP`:``,n.clearcoat?`#define USE_CLEARCOAT`:``,n.clearcoatMap?`#define USE_CLEARCOATMAP`:``,n.clearcoatRoughnessMap?`#define USE_CLEARCOAT_ROUGHNESSMAP`:``,n.clearcoatNormalMap?`#define USE_CLEARCOAT_NORMALMAP`:``,n.dispersion?`#define USE_DISPERSION`:``,n.retroreflection?`#define USE_RETROREFLECTION`:``,n.iridescence?`#define USE_IRIDESCENCE`:``,n.iridescenceMap?`#define USE_IRIDESCENCEMAP`:``,n.iridescenceThicknessMap?`#define USE_IRIDESCENCE_THICKNESSMAP`:``,n.specularMap?`#define USE_SPECULARMAP`:``,n.specularColorMap?`#define USE_SPECULAR_COLORMAP`:``,n.specularIntensityMap?`#define USE_SPECULAR_INTENSITYMAP`:``,n.roughnessMap?`#define USE_ROUGHNESSMAP`:``,n.metalnessMap?`#define USE_METALNESSMAP`:``,n.alphaMap?`#define USE_ALPHAMAP`:``,n.alphaTest?`#define USE_ALPHATEST`:``,n.alphaHash?`#define USE_ALPHAHASH`:``,n.sheen?`#define USE_SHEEN`:``,n.sheenColorMap?`#define USE_SHEEN_COLORMAP`:``,n.sheenRoughnessMap?`#define USE_SHEEN_ROUGHNESSMAP`:``,n.transmission?`#define USE_TRANSMISSION`:``,n.transmissionMap?`#define USE_TRANSMISSIONMAP`:``,n.thicknessMap?`#define USE_THICKNESSMAP`:``,n.vertexTangents&&n.flatShading===!1?`#define USE_TANGENT`:``,n.vertexColors||n.instancingColor?`#define USE_COLOR`:``,n.vertexAlphas||n.batchingColor?`#define USE_COLOR_ALPHA`:``,n.vertexUv1s?`#define USE_UV1`:``,n.vertexUv2s?`#define USE_UV2`:``,n.vertexUv3s?`#define USE_UV3`:``,n.pointsUvs?`#define USE_POINTS_UV`:``,n.gradientMap?`#define USE_GRADIENTMAP`:``,n.flatShading?`#define FLAT_SHADED`:``,n.doubleSided?`#define DOUBLE_SIDED`:``,n.flipSided?`#define FLIP_SIDED`:``,n.shadowMapEnabled?`#define USE_SHADOWMAP`:``,n.shadowMapEnabled?`#define `+c:``,n.premultipliedAlpha?`#define PREMULTIPLIED_ALPHA`:``,n.numLightProbes>0?`#define USE_LIGHT_PROBES`:``,n.numLightProbeGrids>0?`#define USE_LIGHT_PROBES_GRID`:``,n.decodeVideoTexture?`#define DECODE_VIDEO_TEXTURE`:``,n.decodeVideoTextureEmissive?`#define DECODE_VIDEO_TEXTURE_EMISSIVE`:``,n.logarithmicDepthBuffer?`#define USE_LOGARITHMIC_DEPTH_BUFFER`:``,n.reversedDepthBuffer?`#define USE_REVERSED_DEPTH_BUFFER`:``,`uniform mat4 viewMatrix;`,`uniform vec3 cameraPosition;`,`uniform bool isOrthographic;`,n.toneMapping===0?``:`#define TONE_MAPPING`,n.toneMapping===0?``:Z.tonemapping_pars_fragment,n.toneMapping===0?``:Ms(`toneMapping`,n.toneMapping),n.dithering?`#define DITHERING`:``,n.opaque?`#define OPAQUE`:``,Z.colorspace_pars_fragment,As(`linearToOutputTexel`,n.outputColorSpace),Ps(),n.useDepthPacking?`#define DEPTH_PACKING `+n.depthPacking:``,`
`].filter(Rs).join(`
`)),o=Hs(o),o=zs(o,n),o=Bs(o,n),s=Hs(s),s=zs(s,n),s=Bs(s,n),o=Ks(o),s=Ks(s),n.isRawShaderMaterial!==!0&&(v=`#version 300 es
`,g=[p,`#define attribute in`,`#define varying out`,`#define texture2D texture`].join(`
`)+`
`+g,_=[`#define varying in`,n.glslVersion===`300 es`?``:`layout(location = 0) out highp vec4 pc_fragColor;`,n.glslVersion===`300 es`?``:`#define gl_FragColor pc_fragColor`,`#define gl_FragDepthEXT gl_FragDepth`,`#define texture2D texture`,`#define textureCube texture`,`#define texture2DProj textureProj`,`#define texture2DLodEXT textureLod`,`#define texture2DProjLodEXT textureProjLod`,`#define textureCubeLodEXT textureLod`,`#define texture2DGradEXT textureGrad`,`#define texture2DProjGradEXT textureProjGrad`,`#define textureCubeGradEXT textureGrad`].join(`
`)+`
`+_);let y=v+g+o,b=v+_+s,x=Cs(i,i.VERTEX_SHADER,y),S=Cs(i,i.FRAGMENT_SHADER,b);i.attachShader(h,x),i.attachShader(h,S),n.index0AttributeName===void 0?n.hasPositionAttribute===!0&&i.bindAttribLocation(h,0,`position`):i.bindAttribLocation(h,0,n.index0AttributeName),i.linkProgram(h);function C(t){if(e.debug.checkShaderErrors){let n=i.getProgramInfoLog(h)||``,r=i.getShaderInfoLog(x)||``,a=i.getShaderInfoLog(S)||``,o=n.trim(),s=r.trim(),c=a.trim(),l=!0,u=!0;if(i.getProgramParameter(h,i.LINK_STATUS)===!1){if(l=!1,typeof e.debug.onShaderError==`function`)e.debug.onShaderError(i,h,x,S);else{let e=ks(i,x,`vertex`),n=ks(i,S,`fragment`);H(`WebGLProgram: Shader Error `+i.getError()+` - VALIDATE_STATUS `+i.getProgramParameter(h,i.VALIDATE_STATUS)+`

Material Name: `+t.name+`
Material Type: `+t.type+`

Program Info Log: `+o+`
`+e+`
`+n)}}else o===``?(s===``||c===``)&&(u=!1):V(`WebGLProgram: Program Info Log:`,o);u&&(t.diagnostics={runnable:l,programLog:o,vertexShader:{log:s,prefix:g},fragmentShader:{log:c,prefix:_}})}i.deleteShader(x),i.deleteShader(S),w=new Ss(i,h),T=Ls(i,h)}let w;this.getUniforms=function(){return w===void 0&&C(this),w};let T;this.getAttributes=function(){return T===void 0&&C(this),T};let E=n.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return E===!1&&(E=i.getProgramParameter(h,ws)),E},this.destroy=function(){r.releaseStatesOfProgram(this),i.deleteProgram(h),this.program=void 0},this.type=n.shaderType,this.name=n.shaderName,this.id=Ts++,this.cacheKey=t,this.usedTimes=1,this.program=h,this.vertexShader=x,this.fragmentShader=S,this}var ac=0,oc=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e,t,n){let r=this._getShaderCacheForMaterial(e);return r.has(t)===!1&&(r.add(t),t.usedTimes++),r.has(n)===!1&&(r.add(n),n.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let e of t)e.usedTimes--,e.usedTimes===0&&this.shaderCache.delete(e.code);return this.materialCache.delete(e),this}getVertexShaderStage(e){return this._getShaderStage(e.vertexShader)}getFragmentShaderStage(e){return this._getShaderStage(e.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){let t=this.shaderCache,n=t.get(e);return n===void 0&&(n=new sc(e),t.set(e,n)),n}},sc=class{constructor(e){this.id=ac++,this.code=e,this.usedTimes=0}};function cc(e){return e===1030||e===37490||e===36285}function lc(e,t,n,r,i,a){let o=new sn,s=new oc,c=new Set,l=[],u=new Map,d=r.logarithmicDepthBuffer,f=r.precision,p={MeshDepthMaterial:`depth`,MeshDistanceMaterial:`distance`,MeshNormalMaterial:`normal`,MeshBasicMaterial:`basic`,MeshLambertMaterial:`lambert`,MeshPhongMaterial:`phong`,MeshToonMaterial:`toon`,MeshStandardMaterial:`physical`,MeshPhysicalMaterial:`physical`,MeshMatcapMaterial:`matcap`,LineBasicMaterial:`basic`,LineDashedMaterial:`dashed`,PointsMaterial:`points`,ShadowMaterial:`shadow`,SpriteMaterial:`sprite`};function m(e){return c.add(e),e===0?`uv`:`uv${e}`}function h(i,o,l,u,h,g){let _=u.fog,v=h.geometry,y=i.isMeshStandardMaterial||i.isMeshLambertMaterial||i.isMeshPhongMaterial?u.environment:null,b=i.isMeshStandardMaterial||i.isMeshLambertMaterial&&!i.envMap||i.isMeshPhongMaterial&&!i.envMap,x=t.get(i.envMap||y,b),S=x&&x.mapping===306?x.image.height:null,C=p[i.type];i.precision!==null&&(f=r.getMaxPrecision(i.precision),f!==i.precision&&V(`WebGLProgram.getParameters:`,i.precision,`not supported, using`,f,`instead.`));let w=v.morphAttributes.position||v.morphAttributes.normal||v.morphAttributes.color,T=w===void 0?0:w.length,E=0;v.morphAttributes.position!==void 0&&(E=1),v.morphAttributes.normal!==void 0&&(E=2),v.morphAttributes.color!==void 0&&(E=3);let D,O,k,A;if(C){let e=ka[C];D=e.vertexShader,O=e.fragmentShader}else{D=i.vertexShader,O=i.fragmentShader;let e=s.getVertexShaderStage(i),t=s.getFragmentShaderStage(i);s.update(i,e,t),k=e.id,A=t.id}let j=e.getRenderTarget(),ee=e.state.buffers.depth.getReversed(),te=h.isInstancedMesh===!0,M=h.isBatchedMesh===!0,N=!!i.map,P=!!i.matcap,ne=!!x,F=!!i.aoMap,re=!!i.lightMap,ie=!!i.bumpMap&&i.wireframe===!1,ae=!!i.normalMap,oe=!!i.displacementMap,se=!!i.emissiveMap,I=!!i.metalnessMap,ce=!!i.roughnessMap,le=i.anisotropy>0,ue=i.clearcoat>0,de=i.dispersion>0,fe=i.retroreflectivity>0,pe=i.iridescence>0,me=i.sheen>0,he=i.transmission>0,ge=le&&!!i.anisotropyMap,_e=ue&&!!i.clearcoatMap,ve=ue&&!!i.clearcoatNormalMap,ye=ue&&!!i.clearcoatRoughnessMap,be=pe&&!!i.iridescenceMap,xe=pe&&!!i.iridescenceThicknessMap,Se=me&&!!i.sheenColorMap,Ce=me&&!!i.sheenRoughnessMap,we=!!i.specularMap,Te=!!i.specularColorMap,Ee=!!i.specularIntensityMap,De=he&&!!i.transmissionMap,Oe=he&&!!i.thicknessMap,ke=!!i.gradientMap,Ae=!!i.alphaMap,je=i.alphaTest>0,L=!!i.alphaHash,Me=!!i.extensions,Ne=0;i.toneMapped&&(j===null||j.isXRRenderTarget===!0)&&(Ne=e.toneMapping);let Pe={shaderID:C,shaderType:i.type,shaderName:i.name,vertexShader:D,fragmentShader:O,defines:i.defines,customVertexShaderID:k,customFragmentShaderID:A,isRawShaderMaterial:i.isRawShaderMaterial===!0,glslVersion:i.glslVersion,precision:f,batching:M,batchingColor:M&&h._colorsTexture!==null,instancing:te,instancingColor:te&&h.instanceColor!==null,instancingMorph:te&&h.morphTexture!==null,outputColorSpace:j===null?e.outputColorSpace:j.isXRRenderTarget===!0?j.texture.colorSpace:J.workingColorSpace,alphaToCoverage:!!i.alphaToCoverage,map:N,matcap:P,envMap:ne,envMapMode:ne&&x.mapping,envMapCubeUVHeight:S,aoMap:F,lightMap:re,bumpMap:ie,normalMap:ae,displacementMap:oe,emissiveMap:se,normalMapObjectSpace:ae&&i.normalMapType===1,normalMapTangentSpace:ae&&i.normalMapType===0,packedNormalMap:ae&&i.normalMapType===0&&cc(i.normalMap.format),metalnessMap:I,roughnessMap:ce,anisotropy:le,anisotropyMap:ge,clearcoat:ue,clearcoatMap:_e,clearcoatNormalMap:ve,clearcoatRoughnessMap:ye,dispersion:de,retroreflection:fe,iridescence:pe,iridescenceMap:be,iridescenceThicknessMap:xe,sheen:me,sheenColorMap:Se,sheenRoughnessMap:Ce,specularMap:we,specularColorMap:Te,specularIntensityMap:Ee,transmission:he,transmissionMap:De,thicknessMap:Oe,gradientMap:ke,opaque:i.transparent===!1&&i.blending===1&&i.alphaToCoverage===!1,alphaMap:Ae,alphaTest:je,alphaHash:L,combine:i.combine,mapUv:N&&m(i.map.channel),aoMapUv:F&&m(i.aoMap.channel),lightMapUv:re&&m(i.lightMap.channel),bumpMapUv:ie&&m(i.bumpMap.channel),normalMapUv:ae&&m(i.normalMap.channel),displacementMapUv:oe&&m(i.displacementMap.channel),emissiveMapUv:se&&m(i.emissiveMap.channel),metalnessMapUv:I&&m(i.metalnessMap.channel),roughnessMapUv:ce&&m(i.roughnessMap.channel),anisotropyMapUv:ge&&m(i.anisotropyMap.channel),clearcoatMapUv:_e&&m(i.clearcoatMap.channel),clearcoatNormalMapUv:ve&&m(i.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:ye&&m(i.clearcoatRoughnessMap.channel),iridescenceMapUv:be&&m(i.iridescenceMap.channel),iridescenceThicknessMapUv:xe&&m(i.iridescenceThicknessMap.channel),sheenColorMapUv:Se&&m(i.sheenColorMap.channel),sheenRoughnessMapUv:Ce&&m(i.sheenRoughnessMap.channel),specularMapUv:we&&m(i.specularMap.channel),specularColorMapUv:Te&&m(i.specularColorMap.channel),specularIntensityMapUv:Ee&&m(i.specularIntensityMap.channel),transmissionMapUv:De&&m(i.transmissionMap.channel),thicknessMapUv:Oe&&m(i.thicknessMap.channel),alphaMapUv:Ae&&m(i.alphaMap.channel),vertexTangents:!!v.attributes.tangent&&(ae||le),vertexNormals:!!v.attributes.normal,vertexColors:i.vertexColors,vertexAlphas:i.vertexColors===!0&&!!v.attributes.color&&v.attributes.color.itemSize===4,pointsUvs:h.isPoints===!0&&!!v.attributes.uv&&(N||Ae),fog:!!_,useFog:i.fog===!0,fogExp2:!!_&&_.isFogExp2,flatShading:i.wireframe===!1&&(i.flatShading===!0||v.attributes.normal===void 0&&ae===!1&&(i.isMeshLambertMaterial||i.isMeshPhongMaterial||i.isMeshStandardMaterial||i.isMeshPhysicalMaterial)),sizeAttenuation:i.sizeAttenuation===!0,logarithmicDepthBuffer:d,reversedDepthBuffer:ee,skinning:h.isSkinnedMesh===!0,hasPositionAttribute:v.attributes.position!==void 0,morphTargets:v.morphAttributes.position!==void 0,morphNormals:v.morphAttributes.normal!==void 0,morphColors:v.morphAttributes.color!==void 0,morphTargetsCount:T,morphTextureStride:E,numSunLights:o.sun.length,numDirLights:o.directional.length,numPointLights:o.point.length,numSpotLights:o.spot.length,numSpotLightMaps:o.spotLightMap.length,numRectAreaLights:o.rectArea.length,numHemiLights:o.hemi.length,numSunLightShadows:o.sunShadowMap.length,numDirLightShadows:o.directionalShadowMap.length,numPointLightShadows:o.pointShadowMap.length,numSpotLightShadows:o.spotShadowMap.length,numSpotLightShadowsWithMaps:o.numSpotLightShadowsWithMaps,numLightProbes:o.numLightProbes,numLightProbeGrids:g.length,numClippingPlanes:a.numPlanes,numClipIntersection:a.numIntersection,dithering:i.dithering,shadowMapEnabled:e.shadowMap.enabled&&l.length>0,shadowMapType:e.shadowMap.type,toneMapping:Ne,decodeVideoTexture:N&&i.map.isVideoTexture===!0&&J.getTransfer(i.map.colorSpace)===`srgb`,decodeVideoTextureEmissive:se&&i.emissiveMap.isVideoTexture===!0&&J.getTransfer(i.emissiveMap.colorSpace)===`srgb`,premultipliedAlpha:i.premultipliedAlpha,doubleSided:i.side===2,flipSided:i.side===1,useDepthPacking:i.depthPacking>=0,depthPacking:i.depthPacking||0,index0AttributeName:i.index0AttributeName,extensionClipCullDistance:Me&&i.extensions.clipCullDistance===!0&&n.has(`WEBGL_clip_cull_distance`),extensionMultiDraw:(Me&&i.extensions.multiDraw===!0||M)&&n.has(`WEBGL_multi_draw`),rendererExtensionParallelShaderCompile:n.has(`KHR_parallel_shader_compile`),customProgramCacheKey:i.customProgramCacheKey()};return Pe.vertexUv1s=c.has(1),Pe.vertexUv2s=c.has(2),Pe.vertexUv3s=c.has(3),c.clear(),Pe}function g(t){let n=[];if(t.shaderID?n.push(t.shaderID):(n.push(t.customVertexShaderID),n.push(t.customFragmentShaderID)),t.defines!==void 0)for(let e in t.defines)n.push(e),n.push(t.defines[e]);return t.isRawShaderMaterial===!1&&(_(n,t),v(n,t),n.push(e.outputColorSpace)),n.push(t.customProgramCacheKey),n.join()}function _(e,t){e.push(t.precision),e.push(t.outputColorSpace),e.push(t.envMapMode),e.push(t.envMapCubeUVHeight),e.push(t.mapUv),e.push(t.alphaMapUv),e.push(t.lightMapUv),e.push(t.aoMapUv),e.push(t.bumpMapUv),e.push(t.normalMapUv),e.push(t.displacementMapUv),e.push(t.emissiveMapUv),e.push(t.metalnessMapUv),e.push(t.roughnessMapUv),e.push(t.anisotropyMapUv),e.push(t.clearcoatMapUv),e.push(t.clearcoatNormalMapUv),e.push(t.clearcoatRoughnessMapUv),e.push(t.iridescenceMapUv),e.push(t.iridescenceThicknessMapUv),e.push(t.sheenColorMapUv),e.push(t.sheenRoughnessMapUv),e.push(t.specularMapUv),e.push(t.specularColorMapUv),e.push(t.specularIntensityMapUv),e.push(t.transmissionMapUv),e.push(t.thicknessMapUv),e.push(t.combine),e.push(t.fogExp2),e.push(t.sizeAttenuation),e.push(t.morphTargetsCount),e.push(t.morphAttributeCount),e.push(t.numSunLights),e.push(t.numDirLights),e.push(t.numPointLights),e.push(t.numSpotLights),e.push(t.numSpotLightMaps),e.push(t.numHemiLights),e.push(t.numRectAreaLights),e.push(t.numSunLightShadows),e.push(t.numDirLightShadows),e.push(t.numPointLightShadows),e.push(t.numSpotLightShadows),e.push(t.numSpotLightShadowsWithMaps),e.push(t.numLightProbes),e.push(t.shadowMapType),e.push(t.toneMapping),e.push(t.numClippingPlanes),e.push(t.numClipIntersection),e.push(t.depthPacking)}function v(e,t){o.disableAll(),t.instancing&&o.enable(0),t.instancingColor&&o.enable(1),t.instancingMorph&&o.enable(2),t.matcap&&o.enable(3),t.envMap&&o.enable(4),t.normalMapObjectSpace&&o.enable(5),t.normalMapTangentSpace&&o.enable(6),t.clearcoat&&o.enable(7),t.iridescence&&o.enable(8),t.alphaTest&&o.enable(9),t.vertexColors&&o.enable(10),t.vertexAlphas&&o.enable(11),t.vertexUv1s&&o.enable(12),t.vertexUv2s&&o.enable(13),t.vertexUv3s&&o.enable(14),t.vertexTangents&&o.enable(15),t.anisotropy&&o.enable(16),t.alphaHash&&o.enable(17),t.batching&&o.enable(18),t.dispersion&&o.enable(19),t.retroreflection&&o.enable(24),t.batchingColor&&o.enable(20),t.gradientMap&&o.enable(21),t.packedNormalMap&&o.enable(22),t.vertexNormals&&o.enable(23),e.push(o.mask),o.disableAll(),t.fog&&o.enable(0),t.useFog&&o.enable(1),t.flatShading&&o.enable(2),t.logarithmicDepthBuffer&&o.enable(3),t.reversedDepthBuffer&&o.enable(4),t.skinning&&o.enable(5),t.morphTargets&&o.enable(6),t.morphNormals&&o.enable(7),t.morphColors&&o.enable(8),t.premultipliedAlpha&&o.enable(9),t.shadowMapEnabled&&o.enable(10),t.doubleSided&&o.enable(11),t.flipSided&&o.enable(12),t.useDepthPacking&&o.enable(13),t.dithering&&o.enable(14),t.transmission&&o.enable(15),t.sheen&&o.enable(16),t.opaque&&o.enable(17),t.pointsUvs&&o.enable(18),t.decodeVideoTexture&&o.enable(19),t.decodeVideoTextureEmissive&&o.enable(20),t.alphaToCoverage&&o.enable(21),t.numLightProbeGrids>0&&o.enable(22),t.hasPositionAttribute&&o.enable(23),e.push(o.mask)}function y(e){let t=p[e.type],n;if(t){let e=ka[t];n=Di.clone(e.uniforms)}else n=e.uniforms;return n}function b(t,n){let r=u.get(n);return r===void 0?(r=new ic(e,n,t,i),l.push(r),u.set(n,r)):++r.usedTimes,r}function x(e){if(--e.usedTimes===0){let t=l.indexOf(e);l[t]=l[l.length-1],l.pop(),u.delete(e.cacheKey),e.destroy()}}function S(e){s.remove(e)}function C(){s.dispose()}return{getParameters:h,getProgramCacheKey:g,getUniforms:y,acquireProgram:b,releaseProgram:x,releaseShaderCache:S,programs:l,dispose:C}}function uc(){let e=new WeakMap;function t(t){return e.has(t)}function n(t){let n=e.get(t);return n===void 0&&(n={},e.set(t,n)),n}function r(t){e.delete(t)}function i(t,n,r){e.get(t)[n]=r}function a(){e=new WeakMap}return{has:t,get:n,remove:r,update:i,dispose:a}}function dc(e,t){return e.groupOrder===t.groupOrder?e.renderOrder===t.renderOrder?e.material.id===t.material.id?e.materialVariant===t.materialVariant?e.z===t.z?e.id-t.id:e.z-t.z:e.materialVariant-t.materialVariant:e.material.id-t.material.id:e.renderOrder-t.renderOrder:e.groupOrder-t.groupOrder}function fc(e,t){return e.groupOrder===t.groupOrder?e.renderOrder===t.renderOrder?e.z===t.z?e.id-t.id:t.z-e.z:e.renderOrder-t.renderOrder:e.groupOrder-t.groupOrder}function pc(){let e=[],t=0,n=[],r=[],i=[];function a(){t=0,n.length=0,r.length=0,i.length=0}function o(e){let t=0;return e.isInstancedMesh&&(t+=2),e.isSkinnedMesh&&(t+=1),t}function s(n,r,i,a,s,c){let l=e[t];return l===void 0?(l={id:n.id,object:n,geometry:r,material:i,materialVariant:o(n),groupOrder:a,renderOrder:n.renderOrder,z:s,group:c},e[t]=l):(l.id=n.id,l.object=n,l.geometry=r,l.material=i,l.materialVariant=o(n),l.groupOrder=a,l.renderOrder=n.renderOrder,l.z=s,l.group=c),t++,l}function c(e,t,a,o,c,l,u){u.reversedDepth===!0&&(c=-c);let d=s(e,t,a,o,c,l);a.transmission>0?r.push(d):a.transparent===!0?i.push(d):n.push(d)}function l(e,t,a,o,c,l){let u=s(e,t,a,o,c,l);a.transmission>0?r.unshift(u):a.transparent===!0?i.unshift(u):n.unshift(u)}function u(e,t){n.length>1&&n.sort(e||dc),r.length>1&&r.sort(t||fc),i.length>1&&i.sort(t||fc)}function d(){for(let n=t,r=e.length;n<r;n++){let t=e[n];if(t.id===null)break;t.id=null,t.object=null,t.geometry=null,t.material=null,t.group=null}}return{opaque:n,transmissive:r,transparent:i,init:a,push:c,unshift:l,finish:d,sort:u}}function mc(){let e=new WeakMap;function t(t,n){let r=e.get(t),i;return r===void 0?(i=new pc,e.set(t,[i])):n>=r.length?(i=new pc,r.push(i)):i=r[n],i}function n(){e=new WeakMap}return{get:t,dispose:n}}function hc(){let e={};return{get:function(t){if(e[t.id]!==void 0)return e[t.id];let n;switch(t.type){case`SunLight`:case`DirectionalLight`:n={direction:new K,color:new X};break;case`SpotLight`:n={position:new K,direction:new K,color:new X,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case`PointLight`:n={position:new K,color:new X,distance:0,decay:0};break;case`HemisphereLight`:n={direction:new K,skyColor:new X,groundColor:new X};break;case`RectAreaLight`:n={color:new X,position:new K,halfWidth:new K,halfHeight:new K}}return e[t.id]=n,n}}}function gc(){let e={};return{get:function(t){if(e[t.id]!==void 0)return e[t.id];let n;switch(t.type){case`SunLight`:case`DirectionalLight`:n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new G};break;case`SpotLight`:n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new G};break;case`PointLight`:n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new G,shadowCameraNear:1,shadowCameraFar:1e3}}return e[t.id]=n,n}}}var _c=0;function vc(e,t){return(t.castShadow?2:0)-(e.castShadow?2:0)+ +!!t.map-!!e.map}function yc(e){let t=new hc,n=gc(),r={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let e=0;e<9;e++)r.probe.push(new K);let i=new K,a=new Y,o=new Y;function s(i){let a=0,o=0,s=0;for(let e=0;e<9;e++)r.probe[e].set(0,0,0);let c=0,l=0,u=0,d=0,f=0,p=0,m=0,h=0,g=0,_=0,v=0,y=0,b=0,x=0;i.sort(vc);for(let e=0,S=i.length;e<S;e++){let S=i[e],C=S.color,w=S.intensity,T=S.distance,E=null;if(S.shadow&&S.shadow.map&&(E=S.shadow.map.texture.format===1030?S.shadow.map.texture:S.shadow.map.depthTexture||S.shadow.map.texture),S.isAmbientLight)a+=C.r*w,o+=C.g*w,s+=C.b*w;else if(S.isLightProbe){for(let e=0;e<9;e++)r.probe[e].addScaledVector(S.sh.coefficients[e],w);x++}else if(S.isSunLight){let e=t.get(S);if(e.color.copy(S.color).multiplyScalar(S.intensity),S.castShadow){let e=S.shadow,t=n.get(S);t.shadowIntensity=e.intensity,t.shadowBias=e.bias,t.shadowNormalBias=e.normalBias,t.shadowRadius=e.radius,t.shadowMapSize.copy(e.mapSize).multiply(e.getFrameExtents()),r.sunShadow[l]=t,r.sunShadowMap[l]=E;let i=e.getViewportCount();for(let t=0;t<i;t++)r.sunShadowMatrix[u+t]=e.getMatrix(t),r.sunShadowCascade[u+t]=e._cascadeData[t];u+=i,l++}r.sun[c]=e,c++}else if(S.isDirectionalLight){let e=t.get(S);if(e.color.copy(S.color).multiplyScalar(S.intensity),S.castShadow){let e=S.shadow,t=n.get(S);t.shadowIntensity=e.intensity,t.shadowBias=e.bias,t.shadowNormalBias=e.normalBias,t.shadowRadius=e.radius,t.shadowMapSize=e.mapSize,r.directionalShadow[d]=t,r.directionalShadowMap[d]=E,r.directionalShadowMatrix[d]=S.shadow.matrix,g++}r.directional[d]=e,d++}else if(S.isSpotLight){let e=t.get(S);e.position.setFromMatrixPosition(S.matrixWorld),e.color.copy(C).multiplyScalar(w),e.distance=T,e.coneCos=Math.cos(S.angle),e.penumbraCos=Math.cos(S.angle*(1-S.penumbra)),e.decay=S.decay,r.spot[p]=e;let i=S.shadow;if(S.map&&(r.spotLightMap[y]=S.map,y++,i.updateMatrices(S),S.castShadow&&b++),r.spotLightMatrix[p]=i.matrix,S.castShadow){let e=n.get(S);e.shadowIntensity=i.intensity,e.shadowBias=i.bias,e.shadowNormalBias=i.normalBias,e.shadowRadius=i.radius,e.shadowMapSize=i.mapSize,r.spotShadow[p]=e,r.spotShadowMap[p]=E,v++}p++}else if(S.isRectAreaLight){let e=t.get(S);e.color.copy(C).multiplyScalar(w),e.halfWidth.set(S.width*.5,0,0),e.halfHeight.set(0,S.height*.5,0),r.rectArea[m]=e,m++}else if(S.isPointLight){let e=t.get(S);if(e.color.copy(S.color).multiplyScalar(S.intensity),e.distance=S.distance,e.decay=S.decay,S.castShadow){let e=S.shadow,t=n.get(S);t.shadowIntensity=e.intensity,t.shadowBias=e.bias,t.shadowNormalBias=e.normalBias,t.shadowRadius=e.radius,t.shadowMapSize=e.mapSize,t.shadowCameraNear=e.camera.near,t.shadowCameraFar=e.camera.far,r.pointShadow[f]=t,r.pointShadowMap[f]=E,r.pointShadowMatrix[f]=S.shadow.matrix,_++}r.point[f]=e,f++}else if(S.isHemisphereLight){let e=t.get(S);e.skyColor.copy(S.color).multiplyScalar(w),e.groundColor.copy(S.groundColor).multiplyScalar(w),r.hemi[h]=e,h++}}m>0&&(e.has(`OES_texture_float_linear`)===!0?(r.rectAreaLTC1=Q.LTC_FLOAT_1,r.rectAreaLTC2=Q.LTC_FLOAT_2):(r.rectAreaLTC1=Q.LTC_HALF_1,r.rectAreaLTC2=Q.LTC_HALF_2)),r.ambient[0]=a,r.ambient[1]=o,r.ambient[2]=s;let S=r.hash;(S.sunLength!==c||S.directionalLength!==d||S.pointLength!==f||S.spotLength!==p||S.rectAreaLength!==m||S.hemiLength!==h||S.numSunShadows!==l||S.numDirectionalShadows!==g||S.numPointShadows!==_||S.numSpotShadows!==v||S.numSpotMaps!==y||S.numLightProbes!==x)&&(r.sun.length=c,r.directional.length=d,r.spot.length=p,r.rectArea.length=m,r.point.length=f,r.hemi.length=h,r.sunShadow.length=l,r.sunShadowMap.length=l,r.sunShadowMatrix.length=u,r.sunShadowCascade.length=u,r.directionalShadow.length=g,r.directionalShadowMap.length=g,r.directionalShadowMatrix.length=g,r.pointShadow.length=_,r.pointShadowMap.length=_,r.pointShadowMatrix.length=_,r.spotShadow.length=v,r.spotShadowMap.length=v,r.spotLightMatrix.length=v+y-b,r.spotLightMap.length=y,r.numSpotLightShadowsWithMaps=b,r.numLightProbes=x,S.sunLength=c,S.directionalLength=d,S.pointLength=f,S.spotLength=p,S.rectAreaLength=m,S.hemiLength=h,S.numSunShadows=l,S.numDirectionalShadows=g,S.numPointShadows=_,S.numSpotShadows=v,S.numSpotMaps=y,S.numLightProbes=x,r.version=_c++)}function c(e,t){let n=0,s=0,c=0,l=0,u=0,d=0,f=t.matrixWorldInverse;for(let t=0,p=e.length;t<p;t++){let p=e[t];if(p.isSunLight){let e=r.sun[n];e.direction.setFromMatrixPosition(p.matrixWorld),e.direction.transformDirection(f),n++}else if(p.isDirectionalLight){let e=r.directional[s];e.direction.setFromMatrixPosition(p.matrixWorld),i.setFromMatrixPosition(p.target.matrixWorld),e.direction.sub(i),e.direction.transformDirection(f),s++}else if(p.isSpotLight){let e=r.spot[l];e.position.setFromMatrixPosition(p.matrixWorld),e.position.applyMatrix4(f),e.direction.setFromMatrixPosition(p.matrixWorld),i.setFromMatrixPosition(p.target.matrixWorld),e.direction.sub(i),e.direction.transformDirection(f),l++}else if(p.isRectAreaLight){let e=r.rectArea[u];e.position.setFromMatrixPosition(p.matrixWorld),e.position.applyMatrix4(f),o.identity(),a.copy(p.matrixWorld),a.premultiply(f),o.extractRotation(a),e.halfWidth.set(p.width*.5,0,0),e.halfHeight.set(0,p.height*.5,0),e.halfWidth.applyMatrix4(o),e.halfHeight.applyMatrix4(o),u++}else if(p.isPointLight){let e=r.point[c];e.position.setFromMatrixPosition(p.matrixWorld),e.position.applyMatrix4(f),c++}else if(p.isHemisphereLight){let e=r.hemi[d];e.direction.setFromMatrixPosition(p.matrixWorld),e.direction.transformDirection(f),d++}}}return{setup:s,setupView:c,state:r}}function bc(e){let t=new yc(e),n=[],r=[],i=[];function a(e){d.camera=e,n.length=0,r.length=0,i.length=0}function o(e){n.push(e)}function s(e){r.push(e)}function c(e){i.push(e)}function l(){t.setup(n)}function u(e){t.setupView(n,e)}let d={lightsArray:n,shadowsArray:r,lightProbeGridArray:i,camera:null,lights:t,transmissionRenderTarget:{},textureUnits:0};return{init:a,state:d,setupLights:l,setupLightsView:u,pushLight:o,pushShadow:s,pushLightProbeGrid:c}}function xc(e){let t=new WeakMap;function n(n,r=0){let i=t.get(n),a;return i===void 0?(a=new bc(e),t.set(n,[a])):r>=i.length?(a=new bc(e),i.push(a)):a=i[r],a}function r(){t=new WeakMap}return{get:n,dispose:r}}var Sc=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,Cc=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`,wc=[new K(1,0,0),new K(-1,0,0),new K(0,1,0),new K(0,-1,0),new K(0,0,1),new K(0,0,-1)],Tc=[new K(0,-1,0),new K(0,-1,0),new K(0,0,1),new K(0,0,-1),new K(0,-1,0),new K(0,-1,0)],Ec=new Y,Dc=new K,Oc=new K;function kc(e,t,n){let r=new hi,i=new G,o=new G,s=new Gt,l=new Mi,u=new Ni,d={},f=n.maxTextureSize,p={0:1,1:0,2:2},m=new Ai({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new G},radius:{value:4}},vertexShader:Sc,fragmentShader:Cc}),h=m.clone();h.defines.HORIZONTAL_PASS=1;let y=new Er;y.setAttribute(`position`,new dr(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let b=new $r(y,m),x=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=1;let S=this.type;this.render=function(t,n,l){if(x.enabled===!1||x.autoUpdate===!1&&x.needsUpdate===!1||t.length===0)return;this.type===2&&(V(`WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead.`),this.type=1);let u=e.getRenderTarget(),d=e.getActiveCubeFace(),p=e.getActiveMipmapLevel(),m=e.state;m.setBlending(0),m.buffers.depth.getReversed()===!0?m.buffers.color.setClear(0,0,0,0):m.buffers.color.setClear(1,1,1,1),m.buffers.depth.setTest(!0),m.setScissorTest(!1);let h=S!==this.type;h&&n.traverse(function(e){e.material&&(Array.isArray(e.material)?e.material.forEach(e=>e.needsUpdate=!0):e.material.needsUpdate=!0)});for(let u=0,d=t.length;u<d;u++){let d=t[u],p=d.shadow;if(p===void 0){V(`WebGLShadowMap:`,d,`has no shadow.`);continue}if(p.autoUpdate===!1&&p.needsUpdate===!1)continue;i.copy(p.mapSize);let y=p.getFrameExtents();i.multiply(y),o.copy(p.mapSize),(i.x>f||i.y>f)&&(i.x>f&&(o.x=Math.floor(f/y.x),i.x=o.x*y.x,p.mapSize.x=o.x),i.y>f&&(o.y=Math.floor(f/y.y),i.y=o.y*y.y,p.mapSize.y=o.y));let b=e.state.buffers.depth.getReversed();if(p.camera._reversedDepth=b,p.map===null||h===!0){if(p.map!==null&&(p.map.depthTexture!==null&&(p.map.depthTexture.dispose(),p.map.depthTexture=null),p.map.dispose()),this.type===3){if(d.isPointLight){V(`WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.`);continue}p.map=new qt(i.x,i.y,{format:j,type:v,minFilter:c,magFilter:c,generateMipmaps:!1}),p.map.texture.name=d.name+`.shadowMap`,p.map.depthTexture=new _i(i.x,i.y,_),p.map.depthTexture.name=d.name+`.shadowMapDepth`,p.map.depthTexture.format=D,p.map.depthTexture.compareFunction=null,p.map.depthTexture.minFilter=a,p.map.depthTexture.magFilter=a}else d.isPointLight?(p.map=new ao(i.x),p.map.depthTexture=new vi(i.x,g)):(p.map=new qt(i.x,i.y),p.map.depthTexture=new _i(i.x,i.y,g)),p.map.depthTexture.name=d.name+`.shadowMap`,p.map.depthTexture.format=D,this.type===1?(p.map.depthTexture.compareFunction=b?518:515,p.map.depthTexture.minFilter=c,p.map.depthTexture.magFilter=c):(p.map.depthTexture.compareFunction=null,p.map.depthTexture.minFilter=a,p.map.depthTexture.magFilter=a);p.camera.updateProjectionMatrix()}p.map.isWebGLCubeRenderTarget!==!0&&(p.map.width!==i.x||p.map.height!==i.y)&&p.map.setSize(i.x,i.y);let x=p.map.isWebGLCubeRenderTarget?6:p.getViewportCount();d.isPointLight!==!0&&p.updateMatrices(d,l);for(let t=0;t<x;t++){let i=p.getCamera(t);if(d.isPointLight){let e=p.camera,n=p.matrix,r=d.distance||e.far;r!==e.far&&(e.far=r,e.updateProjectionMatrix()),Dc.setFromMatrixPosition(d.matrixWorld),e.position.copy(Dc),Oc.copy(e.position),Oc.add(wc[t]),e.up.copy(Tc[t]),e.lookAt(Oc),e.updateMatrixWorld(),n.makeTranslation(-Dc.x,-Dc.y,-Dc.z),Ec.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),p._frustum.setFromProjectionMatrix(Ec,e.coordinateSystem,e.reversedDepth)}if(p.map.isWebGLCubeRenderTarget)e.setRenderTarget(p.map,t),e.clear();else{t===0&&(e.setRenderTarget(p.map),e.clear());let n=p.getViewport(t);s.set(o.x*n.x,o.y*n.y,o.x*n.z,o.y*n.w),m.viewport(s)}r=p.getFrustum(t),T(n,l,i,d,this.type)}p.isPointLightShadow!==!0&&this.type===3&&C(p,l),p.needsUpdate=!1}S=this.type,x.needsUpdate=!1,e.setRenderTarget(u,d,p)};function C(n,r){let a=t.update(b);m.defines.VSM_SAMPLES!==n.blurSamples&&(m.defines.VSM_SAMPLES=n.blurSamples,h.defines.VSM_SAMPLES=n.blurSamples,m.needsUpdate=!0,h.needsUpdate=!0),n.mapPass===null?n.mapPass=new qt(i.x,i.y,{format:j,type:v}):(n.mapPass.width!==n.map.width||n.mapPass.height!==n.map.height)&&n.mapPass.setSize(n.map.width,n.map.height),m.uniforms.shadow_pass.value=n.map.depthTexture,m.uniforms.resolution.value.set(n.map.width,n.map.height),m.uniforms.radius.value=n.radius,e.setRenderTarget(n.mapPass),e.clear(),e.renderBufferDirect(r,null,a,m,b,null),h.uniforms.shadow_pass.value=n.mapPass.texture,h.uniforms.resolution.value.set(n.map.width,n.map.height),h.uniforms.radius.value=n.radius,e.setRenderTarget(n.map),e.clear(),e.renderBufferDirect(r,null,a,h,b,null)}function w(t,n,r,i){let a=null,o=r.isPointLight===!0?t.customDistanceMaterial:t.customDepthMaterial;if(o!==void 0)a=o;else if(a=r.isPointLight===!0?u:l,e.localClippingEnabled&&n.clipShadows===!0&&Array.isArray(n.clippingPlanes)&&n.clippingPlanes.length!==0||n.displacementMap&&n.displacementScale!==0||n.alphaMap&&n.alphaTest>0||n.map&&n.alphaTest>0||n.alphaToCoverage===!0){let e=a.uuid,t=n.uuid,r=d[e];r===void 0&&(r={},d[e]=r);let i=r[t];i===void 0&&(i=a.clone(),r[t]=i,n.addEventListener(`dispose`,E)),a=i}if(a.visible=n.visible,a.wireframe=n.wireframe,i===3?a.side=n.shadowSide===null?n.side:n.shadowSide:a.side=n.shadowSide===null?p[n.side]:n.shadowSide,a.alphaMap=n.alphaMap,a.alphaTest=n.alphaToCoverage===!0?.5:n.alphaTest,a.map=n.map,a.clipShadows=n.clipShadows,a.clippingPlanes=n.clippingPlanes,a.clipIntersection=n.clipIntersection,a.displacementMap=n.displacementMap,a.displacementScale=n.displacementScale,a.displacementBias=n.displacementBias,a.wireframeLinewidth=n.wireframeLinewidth,a.linewidth=n.linewidth,r.isPointLight===!0&&a.isMeshDistanceMaterial===!0){let t=e.properties.get(a);t.light=r}return a}function T(n,i,a,o,s){if(n.visible===!1)return;if(n.layers.test(i.layers)&&(n.isMesh||n.isLine||n.isPoints)&&(n.castShadow||n.receiveShadow&&s===3)&&(!n.frustumCulled||n.intersectsFrustum(r))){n.modelViewMatrix.multiplyMatrices(a.matrixWorldInverse,n.matrixWorld);let r=t.update(n),c=n.material;if(Array.isArray(c)){let t=r.groups;for(let l=0,u=t.length;l<u;l++){let u=t[l],d=c[u.materialIndex];if(d&&d.visible){let t=w(n,d,o,s);n.onBeforeShadow(e,n,i,a,r,t,u),e.renderBufferDirect(a,null,r,t,n,u),n.onAfterShadow(e,n,i,a,r,t,u)}}}else if(c.visible){let t=w(n,c,o,s);n.onBeforeShadow(e,n,i,a,r,t,null),e.renderBufferDirect(a,null,r,t,n,null),n.onAfterShadow(e,n,i,a,r,t,null)}}let c=n.children;for(let e=0,t=c.length;e<t;e++)T(c[e],i,a,o,s)}function E(e){e.target.removeEventListener(`dispose`,E);for(let t in d){let n=d[t],r=e.target.uuid;r in n&&(n[r].dispose(),delete n[r])}}}function Ac(e,t){function n(){let t=!1,n=new Gt,r=null,i=new Gt(0,0,0,0);return{setMask:function(n){r!==n&&!t&&(e.colorMask(n,n,n,n),r=n)},setLocked:function(e){t=e},setClear:function(t,r,a,o,s){s===!0&&(t*=o,r*=o,a*=o),n.set(t,r,a,o),i.equals(n)===!1&&(e.clearColor(t,r,a,o),i.copy(n))},reset:function(){t=!1,r=null,i.set(-1,0,0,0)}}}function r(){let n=!1,r=!1,i=null,a=null,o=null;return{setReversed:function(e){if(r!==e){let n=t.get(`EXT_clip_control`);e?n.clipControlEXT(n.LOWER_LEFT_EXT,n.ZERO_TO_ONE_EXT):n.clipControlEXT(n.LOWER_LEFT_EXT,n.NEGATIVE_ONE_TO_ONE_EXT),r=e;let i=o;o=null,this.setClear(i)}},getReversed:function(){return r},setTest:function(t){t?I(e.DEPTH_TEST):ce(e.DEPTH_TEST)},setMask:function(t){i!==t&&!n&&(e.depthMask(t),i=t)},setFunc:function(t){if(r&&(t=tt[t]),a!==t){switch(t){case 0:e.depthFunc(e.NEVER);break;case 1:e.depthFunc(e.ALWAYS);break;case 2:e.depthFunc(e.LESS);break;case 3:e.depthFunc(e.LEQUAL);break;case 4:e.depthFunc(e.EQUAL);break;case 5:e.depthFunc(e.GEQUAL);break;case 6:e.depthFunc(e.GREATER);break;case 7:e.depthFunc(e.NOTEQUAL);break;default:e.depthFunc(e.LEQUAL)}a=t}},setLocked:function(e){n=e},setClear:function(t){o!==t&&(o=t,r&&(t=1-t),e.clearDepth(t))},reset:function(){n=!1,i=null,a=null,o=null,r=!1}}}function i(){let t=!1,n=null,r=null,i=null,a=null,o=null,s=null,c=null,l=null;return{setTest:function(n){t||(n?I(e.STENCIL_TEST):ce(e.STENCIL_TEST))},setMask:function(r){n!==r&&!t&&(e.stencilMask(r),n=r)},setFunc:function(t,n,o){(r!==t||i!==n||a!==o)&&(e.stencilFunc(t,n,o),r=t,i=n,a=o)},setOp:function(t,n,r){(o!==t||s!==n||c!==r)&&(e.stencilOp(t,n,r),o=t,s=n,c=r)},setLocked:function(e){t=e},setClear:function(t){l!==t&&(e.clearStencil(t),l=t)},reset:function(){t=!1,n=null,r=null,i=null,a=null,o=null,s=null,c=null,l=null}}}let a=new n,o=new r,s=new i,c=new WeakMap,l=new WeakMap,u={},d={},f={},p=new WeakMap,m=[],h=null,g=!1,_=null,v=null,y=null,b=null,x=null,S=null,C=null,w=new X(0,0,0),T=0,E=!1,D=null,O=null,k=null,A=null,j=null,ee=e.getParameter(e.MAX_COMBINED_TEXTURE_IMAGE_UNITS),te=!1,M=0,N=e.getParameter(e.VERSION);N.indexOf(`WebGL`)===-1?N.indexOf(`OpenGL ES`)!==-1&&(M=parseFloat(/^OpenGL ES (\d)/.exec(N)[1]),te=M>=2):(M=parseFloat(/^WebGL (\d)/.exec(N)[1]),te=M>=1);let P=null,ne={},F=e.getParameter(e.SCISSOR_BOX),re=e.getParameter(e.VIEWPORT),ie=new Gt().fromArray(F),ae=new Gt().fromArray(re);function oe(t,n,r,i){let a=new Uint8Array(4),o=e.createTexture();e.bindTexture(t,o),e.texParameteri(t,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(t,e.TEXTURE_MAG_FILTER,e.NEAREST);for(let o=0;o<r;o++)t===e.TEXTURE_3D||t===e.TEXTURE_2D_ARRAY?e.texImage3D(n,0,e.RGBA,1,1,i,0,e.RGBA,e.UNSIGNED_BYTE,a):e.texImage2D(n+o,0,e.RGBA,1,1,0,e.RGBA,e.UNSIGNED_BYTE,a);return o}let se={};se[e.TEXTURE_2D]=oe(e.TEXTURE_2D,e.TEXTURE_2D,1),se[e.TEXTURE_CUBE_MAP]=oe(e.TEXTURE_CUBE_MAP,e.TEXTURE_CUBE_MAP_POSITIVE_X,6),se[e.TEXTURE_2D_ARRAY]=oe(e.TEXTURE_2D_ARRAY,e.TEXTURE_2D_ARRAY,1,1),se[e.TEXTURE_3D]=oe(e.TEXTURE_3D,e.TEXTURE_3D,1,1),a.setClear(0,0,0,1),o.setClear(1),s.setClear(0),I(e.DEPTH_TEST),o.setFunc(3),ge(!1),_e(1),I(e.CULL_FACE),me(0);function I(t){u[t]!==!0&&(e.enable(t),u[t]=!0)}function ce(t){u[t]!==!1&&(e.disable(t),u[t]=!1)}function le(t,n){return f[t]!==n&&(e.bindFramebuffer(t,n),f[t]=n,t===e.DRAW_FRAMEBUFFER&&(f[e.FRAMEBUFFER]=n),t===e.FRAMEBUFFER&&(f[e.DRAW_FRAMEBUFFER]=n),!0)}function ue(t,n){let r=m,i=!1;if(t){r=p.get(n),r===void 0&&(r=[],p.set(n,r));let a=t.textures;if(r.length!==a.length||r[0]!==e.COLOR_ATTACHMENT0){for(let t=0,n=a.length;t<n;t++)r[t]=e.COLOR_ATTACHMENT0+t;r.length=a.length,i=!0}}else r[0]!==e.BACK&&(r[0]=e.BACK,i=!0);i&&e.drawBuffers(r)}function de(t){return h!==t&&(e.useProgram(t),h=t,!0)}let fe={100:e.FUNC_ADD,101:e.FUNC_SUBTRACT,102:e.FUNC_REVERSE_SUBTRACT};fe[103]=e.MIN,fe[104]=e.MAX;let pe={200:e.ZERO,201:e.ONE,202:e.SRC_COLOR,204:e.SRC_ALPHA,210:e.SRC_ALPHA_SATURATE,208:e.DST_COLOR,206:e.DST_ALPHA,203:e.ONE_MINUS_SRC_COLOR,205:e.ONE_MINUS_SRC_ALPHA,209:e.ONE_MINUS_DST_COLOR,207:e.ONE_MINUS_DST_ALPHA,211:e.CONSTANT_COLOR,212:e.ONE_MINUS_CONSTANT_COLOR,213:e.CONSTANT_ALPHA,214:e.ONE_MINUS_CONSTANT_ALPHA};function me(t,n,r,i,a,o,s,c,l,u){if(t===0)g===!0&&(ce(e.BLEND),g=!1);else if(g===!1&&(I(e.BLEND),g=!0),t!==5){if(t!==_||u!==E){if((v!==100||x!==100)&&(e.blendEquation(e.FUNC_ADD),v=100,x=100),u)switch(t){case 1:e.blendFuncSeparate(e.ONE,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case 2:e.blendFunc(e.ONE,e.ONE);break;case 3:e.blendFuncSeparate(e.ZERO,e.ONE_MINUS_SRC_COLOR,e.ZERO,e.ONE);break;case 4:e.blendFuncSeparate(e.DST_COLOR,e.ONE_MINUS_SRC_ALPHA,e.ZERO,e.ONE);break;default:H(`WebGLState: Invalid blending: `,t)}else switch(t){case 1:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case 2:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE,e.ONE,e.ONE);break;case 3:H(`WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true`);break;case 4:H(`WebGLState: MultiplyBlending requires material.premultipliedAlpha = true`);break;default:H(`WebGLState: Invalid blending: `,t)}y=null,b=null,S=null,C=null,w.set(0,0,0),T=0,_=t,E=u}}else a||=n,o||=r,s||=i,(n!==v||a!==x)&&(e.blendEquationSeparate(fe[n],fe[a]),v=n,x=a),(r!==y||i!==b||o!==S||s!==C)&&(e.blendFuncSeparate(pe[r],pe[i],pe[o],pe[s]),y=r,b=i,S=o,C=s),(c.equals(w)===!1||l!==T)&&(e.blendColor(c.r,c.g,c.b,l),w.copy(c),T=l),_=t,E=!1}function he(t,n){t.side===2?ce(e.CULL_FACE):I(e.CULL_FACE);let r=t.side===1;n&&(r=!r),ge(r),t.blending===1&&t.transparent===!1?me(0):me(t.blending,t.blendEquation,t.blendSrc,t.blendDst,t.blendEquationAlpha,t.blendSrcAlpha,t.blendDstAlpha,t.blendColor,t.blendAlpha,t.premultipliedAlpha),o.setFunc(t.depthFunc),o.setTest(t.depthTest),o.setMask(t.depthWrite),a.setMask(t.colorWrite);let i=t.stencilWrite;s.setTest(i),i&&(s.setMask(t.stencilWriteMask),s.setFunc(t.stencilFunc,t.stencilRef,t.stencilFuncMask),s.setOp(t.stencilFail,t.stencilZFail,t.stencilZPass)),ye(t.polygonOffset,t.polygonOffsetFactor,t.polygonOffsetUnits),t.alphaToCoverage===!0?I(e.SAMPLE_ALPHA_TO_COVERAGE):ce(e.SAMPLE_ALPHA_TO_COVERAGE)}function ge(t){D!==t&&(t?e.frontFace(e.CW):e.frontFace(e.CCW),D=t)}function _e(t){t===0?ce(e.CULL_FACE):(I(e.CULL_FACE),t!==O&&(t===1?e.cullFace(e.BACK):t===2?e.cullFace(e.FRONT):e.cullFace(e.FRONT_AND_BACK))),O=t}function ve(t){t!==k&&(te&&e.lineWidth(t),k=t)}function ye(t,n,r){t?(I(e.POLYGON_OFFSET_FILL),(A!==n||j!==r)&&(A=n,j=r,o.getReversed()&&(n=-n),e.polygonOffset(n,r))):ce(e.POLYGON_OFFSET_FILL)}function be(t){t?I(e.SCISSOR_TEST):ce(e.SCISSOR_TEST)}function xe(t){t===void 0&&(t=e.TEXTURE0+ee-1),P!==t&&(e.activeTexture(t),P=t)}function Se(t,n,r){r===void 0&&(r=P===null?e.TEXTURE0+ee-1:P);let i=ne[r];i===void 0&&(i={type:void 0,texture:void 0},ne[r]=i),(i.type!==t||i.texture!==n)&&(P!==r&&(e.activeTexture(r),P=r),e.bindTexture(t,n||se[t]),i.type=t,i.texture=n)}function Ce(){let t=ne[P];t!==void 0&&t.type!==void 0&&(e.bindTexture(t.type,null),t.type=void 0,t.texture=void 0)}function we(){try{e.compressedTexImage2D(...arguments)}catch(e){H(`WebGLState:`,e)}}function Te(){try{e.compressedTexImage3D(...arguments)}catch(e){H(`WebGLState:`,e)}}function Ee(){try{e.texSubImage2D(...arguments)}catch(e){H(`WebGLState:`,e)}}function De(){try{e.texSubImage3D(...arguments)}catch(e){H(`WebGLState:`,e)}}function Oe(){try{e.compressedTexSubImage2D(...arguments)}catch(e){H(`WebGLState:`,e)}}function ke(){try{e.compressedTexSubImage3D(...arguments)}catch(e){H(`WebGLState:`,e)}}function Ae(){try{e.texStorage2D(...arguments)}catch(e){H(`WebGLState:`,e)}}function je(){try{e.texStorage3D(...arguments)}catch(e){H(`WebGLState:`,e)}}function L(){try{e.texImage2D(...arguments)}catch(e){H(`WebGLState:`,e)}}function Me(){try{e.texImage3D(...arguments)}catch(e){H(`WebGLState:`,e)}}function Ne(t){return d[t]===void 0?e.getParameter(t):d[t]}function Pe(t,n){d[t]!==n&&(e.pixelStorei(t,n),d[t]=n)}function R(t){ie.equals(t)===!1&&(e.scissor(t.x,t.y,t.z,t.w),ie.copy(t))}function Fe(t){ae.equals(t)===!1&&(e.viewport(t.x,t.y,t.z,t.w),ae.copy(t))}function z(t,n){let r=l.get(n);r===void 0&&(r=new WeakMap,l.set(n,r));let i=r.get(t);i===void 0&&(i=e.getUniformBlockIndex(n,t.name),r.set(t,i))}function B(t,n){let r=l.get(n).get(t);c.get(n)!==r&&(e.uniformBlockBinding(n,r,t.__bindingPointIndex),c.set(n,r))}function Ie(){e.disable(e.BLEND),e.disable(e.CULL_FACE),e.disable(e.DEPTH_TEST),e.disable(e.POLYGON_OFFSET_FILL),e.disable(e.SCISSOR_TEST),e.disable(e.STENCIL_TEST),e.disable(e.SAMPLE_ALPHA_TO_COVERAGE),e.blendEquation(e.FUNC_ADD),e.blendFunc(e.ONE,e.ZERO),e.blendFuncSeparate(e.ONE,e.ZERO,e.ONE,e.ZERO),e.blendColor(0,0,0,0),e.colorMask(!0,!0,!0,!0),e.clearColor(0,0,0,0),e.depthMask(!0),e.depthFunc(e.LESS),o.setReversed(!1),e.clearDepth(1),e.stencilMask(4294967295),e.stencilFunc(e.ALWAYS,0,4294967295),e.stencilOp(e.KEEP,e.KEEP,e.KEEP),e.clearStencil(0),e.cullFace(e.BACK),e.frontFace(e.CCW),e.polygonOffset(0,0),e.activeTexture(e.TEXTURE0),e.bindFramebuffer(e.FRAMEBUFFER,null),e.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),e.bindFramebuffer(e.READ_FRAMEBUFFER,null),e.useProgram(null),e.lineWidth(1),e.scissor(0,0,e.canvas.width,e.canvas.height),e.viewport(0,0,e.canvas.width,e.canvas.height),e.pixelStorei(e.PACK_ALIGNMENT,4),e.pixelStorei(e.UNPACK_ALIGNMENT,4),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!1),e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),e.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,e.BROWSER_DEFAULT_WEBGL),e.pixelStorei(e.PACK_ROW_LENGTH,0),e.pixelStorei(e.PACK_SKIP_PIXELS,0),e.pixelStorei(e.PACK_SKIP_ROWS,0),e.pixelStorei(e.UNPACK_ROW_LENGTH,0),e.pixelStorei(e.UNPACK_IMAGE_HEIGHT,0),e.pixelStorei(e.UNPACK_SKIP_PIXELS,0),e.pixelStorei(e.UNPACK_SKIP_ROWS,0),e.pixelStorei(e.UNPACK_SKIP_IMAGES,0),u={},d={},P=null,ne={},f={},p=new WeakMap,m=[],h=null,g=!1,_=null,v=null,y=null,b=null,x=null,S=null,C=null,w=new X(0,0,0),T=0,E=!1,D=null,O=null,k=null,A=null,j=null,ie.set(0,0,e.canvas.width,e.canvas.height),ae.set(0,0,e.canvas.width,e.canvas.height),a.reset(),o.reset(),s.reset()}return{buffers:{color:a,depth:o,stencil:s},enable:I,disable:ce,bindFramebuffer:le,drawBuffers:ue,useProgram:de,setBlending:me,setMaterial:he,setFlipSided:ge,setCullFace:_e,setLineWidth:ve,setPolygonOffset:ye,setScissorTest:be,activeTexture:xe,bindTexture:Se,unbindTexture:Ce,compressedTexImage2D:we,compressedTexImage3D:Te,texImage2D:L,texImage3D:Me,pixelStorei:Pe,getParameter:Ne,updateUBOMapping:z,uniformBlockBinding:B,texStorage2D:Ae,texStorage3D:je,texSubImage2D:Ee,texSubImage3D:De,compressedTexSubImage2D:Oe,compressedTexSubImage3D:ke,scissor:R,viewport:Fe,reset:Ie}}function jc(e,t,d,f,p,m,h){let g=t.has(`WEBGL_multisampled_render_to_texture`)?t.get(`WEBGL_multisampled_render_to_texture`):null,_=typeof navigator>`u`?!1:/OculusBrowser/g.test(navigator.userAgent),v=new G,y=new WeakMap,b=new Set,x,S=new WeakMap,C=!1;try{C=typeof OffscreenCanvas<`u`&&new OffscreenCanvas(1,1).getContext(`2d`)!==null}catch{}function w(e,t){return C?new OffscreenCanvas(e,t):Je(`canvas`)}function T(e,t,n){let r=1,i=Ne(e);if((i.width>n||i.height>n)&&(r=n/Math.max(i.width,i.height)),r<1){if(typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<`u`&&e instanceof HTMLCanvasElement||typeof ImageBitmap<`u`&&e instanceof ImageBitmap||typeof VideoFrame<`u`&&e instanceof VideoFrame){let n=Math.floor(r*i.width),a=Math.floor(r*i.height);x===void 0&&(x=w(n,a));let o=t?w(n,a):x;return o.width=n,o.height=a,o.getContext(`2d`).drawImage(e,0,0,n,a),V(`WebGLRenderer: Texture has been resized from (`+i.width+`x`+i.height+`) to (`+n+`x`+a+`).`),o}return`data`in e&&V(`WebGLRenderer: Image in DataTexture is too big (`+i.width+`x`+i.height+`).`),e}return e}function E(e){return e.generateMipmaps}function D(t){e.generateMipmap(t)}function k(t){return t.isWebGLCubeRenderTarget?e.TEXTURE_CUBE_MAP:t.isWebGL3DRenderTarget?e.TEXTURE_3D:t.isWebGLArrayRenderTarget||t.isCompressedArrayTexture?e.TEXTURE_2D_ARRAY:e.TEXTURE_2D}function A(n,r,i,a,o,s=!1){if(n!==null){if(e[n]!==void 0)return e[n];V(`WebGLRenderer: Attempt to use non-existing WebGL internal format '`+n+`'`)}let c;a&&(c=t.get(`EXT_texture_norm16`),c||V(`WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension`));let l=r;if(r===e.RED&&(i===e.FLOAT&&(l=e.R32F),i===e.HALF_FLOAT&&(l=e.R16F),i===e.UNSIGNED_BYTE&&(l=e.R8),i===e.UNSIGNED_SHORT&&c&&(l=c.R16_EXT),i===e.SHORT&&c&&(l=c.R16_SNORM_EXT)),r===e.RED_INTEGER&&(i===e.UNSIGNED_BYTE&&(l=e.R8UI),i===e.UNSIGNED_SHORT&&(l=e.R16UI),i===e.UNSIGNED_INT&&(l=e.R32UI),i===e.BYTE&&(l=e.R8I),i===e.SHORT&&(l=e.R16I),i===e.INT&&(l=e.R32I)),r===e.RG&&(i===e.FLOAT&&(l=e.RG32F),i===e.HALF_FLOAT&&(l=e.RG16F),i===e.UNSIGNED_BYTE&&(l=e.RG8),i===e.UNSIGNED_SHORT&&c&&(l=c.RG16_EXT),i===e.SHORT&&c&&(l=c.RG16_SNORM_EXT)),r===e.RG_INTEGER&&(i===e.UNSIGNED_BYTE&&(l=e.RG8UI),i===e.UNSIGNED_SHORT&&(l=e.RG16UI),i===e.UNSIGNED_INT&&(l=e.RG32UI),i===e.BYTE&&(l=e.RG8I),i===e.SHORT&&(l=e.RG16I),i===e.INT&&(l=e.RG32I)),r===e.RGB_INTEGER&&(i===e.UNSIGNED_BYTE&&(l=e.RGB8UI),i===e.UNSIGNED_SHORT&&(l=e.RGB16UI),i===e.UNSIGNED_INT&&(l=e.RGB32UI),i===e.BYTE&&(l=e.RGB8I),i===e.SHORT&&(l=e.RGB16I),i===e.INT&&(l=e.RGB32I)),r===e.RGBA_INTEGER&&(i===e.UNSIGNED_BYTE&&(l=e.RGBA8UI),i===e.UNSIGNED_SHORT&&(l=e.RGBA16UI),i===e.UNSIGNED_INT&&(l=e.RGBA32UI),i===e.BYTE&&(l=e.RGBA8I),i===e.SHORT&&(l=e.RGBA16I),i===e.INT&&(l=e.RGBA32I)),r===e.RGB&&(i===e.UNSIGNED_SHORT&&c&&(l=c.RGB16_EXT),i===e.SHORT&&c&&(l=c.RGB16_SNORM_EXT),i===e.UNSIGNED_INT_5_9_9_9_REV&&(l=e.RGB9_E5),i===e.UNSIGNED_INT_10F_11F_11F_REV&&(l=e.R11F_G11F_B10F)),r===e.RGBA){let t=s?ze:J.getTransfer(o);i===e.FLOAT&&(l=e.RGBA32F),i===e.HALF_FLOAT&&(l=e.RGBA16F),i===e.UNSIGNED_BYTE&&(l=t===`srgb`?e.SRGB8_ALPHA8:e.RGBA8),i===e.UNSIGNED_SHORT&&c&&(l=c.RGBA16_EXT),i===e.SHORT&&c&&(l=c.RGBA16_SNORM_EXT),i===e.UNSIGNED_SHORT_4_4_4_4&&(l=e.RGBA4),i===e.UNSIGNED_SHORT_5_5_5_1&&(l=e.RGB5_A1)}return(l===e.R16F||l===e.R32F||l===e.RG16F||l===e.RG32F||l===e.RGBA16F||l===e.RGBA32F)&&t.get(`EXT_color_buffer_float`),l}function j(t,n){let r;return t?n===null||n===1014||n===1020?r=e.DEPTH24_STENCIL8:n===1015?r=e.DEPTH32F_STENCIL8:n===1012&&(r=e.DEPTH24_STENCIL8,V(`DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.`)):n===null||n===1014||n===1020?r=e.DEPTH_COMPONENT24:n===1015?r=e.DEPTH_COMPONENT32F:n===1012&&(r=e.DEPTH_COMPONENT16),r}function ee(e,t){return E(e)===!0||e.isFramebufferTexture&&e.minFilter!==1003&&e.minFilter!==1006?Math.log2(Math.max(t.width,t.height))+1:e.mipmaps!==void 0&&e.mipmaps.length>0?e.mipmaps.length:e.isCompressedTexture&&Array.isArray(e.image)?t.mipmaps.length:1}function te(e){let t=e.target;t.removeEventListener(`dispose`,te),N(t),t.isVideoTexture&&y.delete(t),t.isHTMLTexture&&b.delete(t)}function M(e){let t=e.target;t.removeEventListener(`dispose`,M),ne(t)}function N(e){let t=f.get(e);if(t.__webglInit===void 0)return;let n=e.source,r=S.get(n);if(r){let i=r[t.__cacheKey];i.usedTimes--,i.usedTimes===0&&P(e),Object.keys(r).length===0&&S.delete(n)}f.remove(e)}function P(t){let n=f.get(t);e.deleteTexture(n.__webglTexture);let r=t.source,i=S.get(r);delete i[n.__cacheKey],h.memory.textures--}function ne(t){let n=f.get(t);if(t.depthTexture&&(t.depthTexture.dispose(),f.remove(t.depthTexture)),t.isWebGLCubeRenderTarget)for(let t=0;t<6;t++){if(Array.isArray(n.__webglFramebuffer[t]))for(let r=0;r<n.__webglFramebuffer[t].length;r++)e.deleteFramebuffer(n.__webglFramebuffer[t][r]);else e.deleteFramebuffer(n.__webglFramebuffer[t]);n.__webglDepthbuffer&&e.deleteRenderbuffer(n.__webglDepthbuffer[t])}else{if(Array.isArray(n.__webglFramebuffer))for(let t=0;t<n.__webglFramebuffer.length;t++)e.deleteFramebuffer(n.__webglFramebuffer[t]);else e.deleteFramebuffer(n.__webglFramebuffer);if(n.__webglDepthbuffer&&e.deleteRenderbuffer(n.__webglDepthbuffer),n.__webglMultisampledFramebuffer&&e.deleteFramebuffer(n.__webglMultisampledFramebuffer),n.__webglColorRenderbuffer)for(let t=0;t<n.__webglColorRenderbuffer.length;t++)n.__webglColorRenderbuffer[t]&&e.deleteRenderbuffer(n.__webglColorRenderbuffer[t]);n.__webglDepthRenderbuffer&&e.deleteRenderbuffer(n.__webglDepthRenderbuffer)}let r=t.textures;for(let t=0,n=r.length;t<n;t++){let n=f.get(r[t]);n.__webglTexture&&(e.deleteTexture(n.__webglTexture),h.memory.textures--),f.remove(r[t])}f.remove(t)}let F=0;function re(){F=0}function ie(){return F}function ae(e){F=e}function oe(){let e=F;return e>=p.maxTextures&&V(`WebGLTextures: Trying to use `+(e+1)+` texture units while this GPU supports only `+p.maxTextures),F+=1,e}function se(e){let t=[];return t.push(e.wrapS),t.push(e.wrapT),t.push(e.wrapR||0),t.push(e.magFilter),t.push(e.minFilter),t.push(e.anisotropy),t.push(e.internalFormat),t.push(e.format),t.push(e.type),t.push(e.generateMipmaps),t.push(e.premultiplyAlpha),t.push(e.flipY),t.push(e.unpackAlignment),t.push(e.colorSpace),t.join()}function I(t,n){let r=f.get(t);if(t.isVideoTexture&&L(t),t.isRenderTargetTexture===!1&&t.isExternalTexture!==!0&&t.version>0&&r.__version!==t.version){let e=t.image;if(e===null)V(`WebGLRenderer: Texture marked for update but no image data found.`);else if(e.complete===!1)V(`WebGLRenderer: Texture marked for update but image is incomplete`);else{ve(r,t,n);return}}else t.isExternalTexture&&(r.__webglTexture=t.sourceTexture?t.sourceTexture:null);d.bindTexture(e.TEXTURE_2D,r.__webglTexture,e.TEXTURE0+n)}function ce(t,n){let r=f.get(t);t.isRenderTargetTexture===!1&&t.version>0&&r.__version!==t.version?ve(r,t,n):(t.isExternalTexture&&(r.__webglTexture=t.sourceTexture?t.sourceTexture:null),d.bindTexture(e.TEXTURE_2D_ARRAY,r.__webglTexture,e.TEXTURE0+n))}function le(t,n){let r=f.get(t);t.isRenderTargetTexture===!1&&t.version>0&&r.__version!==t.version?ve(r,t,n):d.bindTexture(e.TEXTURE_3D,r.__webglTexture,e.TEXTURE0+n)}function ue(t,n){let r=f.get(t);t.isCubeDepthTexture!==!0&&t.version>0&&r.__version!==t.version?ye(r,t,n):d.bindTexture(e.TEXTURE_CUBE_MAP,r.__webglTexture,e.TEXTURE0+n)}let de={[n]:e.REPEAT,[r]:e.CLAMP_TO_EDGE,[i]:e.MIRRORED_REPEAT},fe={[a]:e.NEAREST,[o]:e.NEAREST_MIPMAP_NEAREST,[s]:e.NEAREST_MIPMAP_LINEAR,[c]:e.LINEAR,[l]:e.LINEAR_MIPMAP_NEAREST,[u]:e.LINEAR_MIPMAP_LINEAR},pe={512:e.NEVER,519:e.ALWAYS,513:e.LESS,515:e.LEQUAL,514:e.EQUAL,518:e.GEQUAL,516:e.GREATER,517:e.NOTEQUAL};function me(n,r){if(r.type===1015&&t.has(`OES_texture_float_linear`)===!1&&(r.magFilter===1006||r.magFilter===1007||r.magFilter===1005||r.magFilter===1008||r.minFilter===1006||r.minFilter===1007||r.minFilter===1005||r.minFilter===1008)&&V(`WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device.`),e.texParameteri(n,e.TEXTURE_WRAP_S,de[r.wrapS]),e.texParameteri(n,e.TEXTURE_WRAP_T,de[r.wrapT]),(n===e.TEXTURE_3D||n===e.TEXTURE_2D_ARRAY)&&e.texParameteri(n,e.TEXTURE_WRAP_R,de[r.wrapR]),e.texParameteri(n,e.TEXTURE_MAG_FILTER,fe[r.magFilter]),e.texParameteri(n,e.TEXTURE_MIN_FILTER,fe[r.minFilter]),r.compareFunction&&(e.texParameteri(n,e.TEXTURE_COMPARE_MODE,e.COMPARE_REF_TO_TEXTURE),e.texParameteri(n,e.TEXTURE_COMPARE_FUNC,pe[r.compareFunction])),t.has(`EXT_texture_filter_anisotropic`)===!0){if(r.magFilter===1003||r.minFilter!==1005&&r.minFilter!==1008||r.type===1015&&t.has(`OES_texture_float_linear`)===!1)return;if(r.anisotropy>1||f.get(r).__currentAnisotropy){let i=t.get(`EXT_texture_filter_anisotropic`);e.texParameterf(n,i.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(r.anisotropy,p.getMaxAnisotropy())),f.get(r).__currentAnisotropy=r.anisotropy}}}function he(t,n){let r=!1;t.__webglInit===void 0&&(t.__webglInit=!0,n.addEventListener(`dispose`,te));let i=n.source,a=S.get(i);a===void 0&&(a={},S.set(i,a));let o=se(n);if(o!==t.__cacheKey){a[o]===void 0&&(a[o]={texture:e.createTexture(),usedTimes:0},h.memory.textures++,r=!0),a[o].usedTimes++;let i=a[t.__cacheKey];i!==void 0&&(a[t.__cacheKey].usedTimes--,i.usedTimes===0&&P(n)),t.__cacheKey=o,t.__webglTexture=a[o].texture}return r}function ge(e,t,n){return Math.floor(Math.floor(e/n)/t)}function _e(t,n,r,i){let a=t.updateRanges;if(a.length===0)d.texSubImage2D(e.TEXTURE_2D,0,0,0,n.width,n.height,r,i,n.data);else{a.sort((e,t)=>e.start-t.start);let o=0;for(let e=1;e<a.length;e++){let t=a[o],r=a[e],i=t.start+t.count,s=ge(r.start,n.width,4),c=ge(t.start,n.width,4);r.start<=i+1&&s===c&&ge(r.start+r.count-1,n.width,4)===s?t.count=Math.max(t.count,r.start+r.count-t.start):(++o,a[o]=r)}a.length=o+1;let s=d.getParameter(e.UNPACK_ROW_LENGTH),c=d.getParameter(e.UNPACK_SKIP_PIXELS),l=d.getParameter(e.UNPACK_SKIP_ROWS);d.pixelStorei(e.UNPACK_ROW_LENGTH,n.width);for(let t=0,o=a.length;t<o;t++){let o=a[t],s=Math.floor(o.start/4),c=Math.ceil(o.count/4),l=s%n.width,u=Math.floor(s/n.width),f=c;d.pixelStorei(e.UNPACK_SKIP_PIXELS,l),d.pixelStorei(e.UNPACK_SKIP_ROWS,u),d.texSubImage2D(e.TEXTURE_2D,0,l,u,f,1,r,i,n.data)}t.clearUpdateRanges(),d.pixelStorei(e.UNPACK_ROW_LENGTH,s),d.pixelStorei(e.UNPACK_SKIP_PIXELS,c),d.pixelStorei(e.UNPACK_SKIP_ROWS,l)}}function ve(t,n,r){let i=e.TEXTURE_2D;(n.isDataArrayTexture||n.isCompressedArrayTexture)&&(i=e.TEXTURE_2D_ARRAY),n.isData3DTexture&&(i=e.TEXTURE_3D);let a=he(t,n),o=n.source;d.bindTexture(i,t.__webglTexture,e.TEXTURE0+r);let s=f.get(o);if(o.version!==s.__version||a===!0){if(d.activeTexture(e.TEXTURE0+r),!(typeof ImageBitmap<`u`&&n.image instanceof ImageBitmap)){let t=J.getPrimaries(J.workingColorSpace),r=n.colorSpace===``?null:J.getPrimaries(n.colorSpace),i=n.colorSpace===``||t===r?e.NONE:e.BROWSER_DEFAULT_WEBGL;d.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,n.flipY),d.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,n.premultiplyAlpha),d.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,i)}d.pixelStorei(e.UNPACK_ALIGNMENT,n.unpackAlignment);let t=T(n.image,!1,p.maxTextureSize);t=Me(n,t);let c=m.convert(n.format,n.colorSpace),l=m.convert(n.type),u=A(n.internalFormat,c,l,n.normalized,n.colorSpace,n.isVideoTexture);me(i,n);let f,h=n.mipmaps,g=n.isVideoTexture!==!0,_=s.__version===void 0||a===!0,v=o.dataReady,y=ee(n,t);if(n.isDepthTexture)u=j(n.format===O,n.type),_&&(g?d.texStorage2D(e.TEXTURE_2D,1,u,t.width,t.height):d.texImage2D(e.TEXTURE_2D,0,u,t.width,t.height,0,c,l,null));else if(n.isDataTexture){if(h.length>0){g&&_&&d.texStorage2D(e.TEXTURE_2D,y,u,h[0].width,h[0].height);for(let t=0,n=h.length;t<n;t++)f=h[t],g?v&&d.texSubImage2D(e.TEXTURE_2D,t,0,0,f.width,f.height,c,l,f.data):d.texImage2D(e.TEXTURE_2D,t,u,f.width,f.height,0,c,l,f.data);n.generateMipmaps=!1}else g?(_&&d.texStorage2D(e.TEXTURE_2D,y,u,t.width,t.height),v&&_e(n,t,c,l)):d.texImage2D(e.TEXTURE_2D,0,u,t.width,t.height,0,c,l,t.data)}else if(n.isCompressedTexture){if(n.isCompressedArrayTexture){g&&_&&d.texStorage3D(e.TEXTURE_2D_ARRAY,y,u,h[0].width,h[0].height,t.depth);for(let r=0,i=h.length;r<i;r++)if(f=h[r],n.format!==1023){if(c!==null){if(g){if(v){if(n.layerUpdates.size>0){let t=Ta(f.width,f.height,n.format,n.type);for(let i of n.layerUpdates){let n=f.data.subarray(i*t/f.data.BYTES_PER_ELEMENT,(i+1)*t/f.data.BYTES_PER_ELEMENT);d.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,r,0,0,i,f.width,f.height,1,c,n)}}else d.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,r,0,0,0,f.width,f.height,t.depth,c,f.data)}}else d.compressedTexImage3D(e.TEXTURE_2D_ARRAY,r,u,f.width,f.height,t.depth,0,f.data,0,0)}else V(`WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()`)}else g?v&&d.texSubImage3D(e.TEXTURE_2D_ARRAY,r,0,0,0,f.width,f.height,t.depth,c,l,f.data):d.texImage3D(e.TEXTURE_2D_ARRAY,r,u,f.width,f.height,t.depth,0,c,l,f.data);n.layerUpdates.size>0&&n.clearLayerUpdates()}else{g&&_&&d.texStorage2D(e.TEXTURE_2D,y,u,h[0].width,h[0].height);for(let t=0,r=h.length;t<r;t++)f=h[t],n.format===1023?g?v&&d.texSubImage2D(e.TEXTURE_2D,t,0,0,f.width,f.height,c,l,f.data):d.texImage2D(e.TEXTURE_2D,t,u,f.width,f.height,0,c,l,f.data):c===null?V(`WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()`):g?v&&d.compressedTexSubImage2D(e.TEXTURE_2D,t,0,0,f.width,f.height,c,f.data):d.compressedTexImage2D(e.TEXTURE_2D,t,u,f.width,f.height,0,f.data)}}else if(n.isDataArrayTexture){if(g){if(_&&d.texStorage3D(e.TEXTURE_2D_ARRAY,y,u,t.width,t.height,t.depth),v){if(n.layerUpdates.size>0){let r=Ta(t.width,t.height,n.format,n.type);for(let i of n.layerUpdates){let n=t.data.subarray(i*r/t.data.BYTES_PER_ELEMENT,(i+1)*r/t.data.BYTES_PER_ELEMENT);d.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,i,t.width,t.height,1,c,l,n)}n.clearLayerUpdates()}else d.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,0,t.width,t.height,t.depth,c,l,t.data)}}else d.texImage3D(e.TEXTURE_2D_ARRAY,0,u,t.width,t.height,t.depth,0,c,l,t.data)}else if(n.isData3DTexture)g?(_&&d.texStorage3D(e.TEXTURE_3D,y,u,t.width,t.height,t.depth),v&&d.texSubImage3D(e.TEXTURE_3D,0,0,0,0,t.width,t.height,t.depth,c,l,t.data)):d.texImage3D(e.TEXTURE_3D,0,u,t.width,t.height,t.depth,0,c,l,t.data);else if(n.isFramebufferTexture){if(_){if(g)d.texStorage2D(e.TEXTURE_2D,y,u,t.width,t.height);else{let n=t.width,r=t.height;for(let t=0;t<y;t++)d.texImage2D(e.TEXTURE_2D,t,u,n,r,0,c,l,null),n>>=1,r>>=1}}}else if(n.isHTMLTexture){if(`texElementImage2D`in e){let r=e.canvas;if(r.hasAttribute(`layoutsubtree`)||r.setAttribute(`layoutsubtree`,`true`),t.parentNode!==r){r.appendChild(t),b.add(n),r.onpaint=e=>{let t=e.changedElements;for(let e of b)t.includes(e.image)&&(e.needsUpdate=!0)},r.requestPaint();return}if(e.texElementImage2D.length===3)e.texElementImage2D(e.TEXTURE_2D,e.RGBA8,t);else{let n=e.RGBA,r=e.RGBA,i=e.UNSIGNED_BYTE;e.texElementImage2D(e.TEXTURE_2D,0,n,r,i,t)}e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE)}}else if(h.length>0){if(g&&_){let t=Ne(h[0]);d.texStorage2D(e.TEXTURE_2D,y,u,t.width,t.height)}for(let t=0,n=h.length;t<n;t++)f=h[t],g?v&&d.texSubImage2D(e.TEXTURE_2D,t,0,0,c,l,f):d.texImage2D(e.TEXTURE_2D,t,u,c,l,f);n.generateMipmaps=!1}else if(g){if(_){let n=Ne(t);d.texStorage2D(e.TEXTURE_2D,y,u,n.width,n.height)}v&&d.texSubImage2D(e.TEXTURE_2D,0,0,0,c,l,t)}else d.texImage2D(e.TEXTURE_2D,0,u,c,l,t);E(n)&&D(i),s.__version=o.version,n.onUpdate&&n.onUpdate(n)}t.__version=n.version}function ye(t,n,r){if(n.image.length!==6)return;let i=he(t,n),a=n.source;d.bindTexture(e.TEXTURE_CUBE_MAP,t.__webglTexture,e.TEXTURE0+r);let o=f.get(a);if(a.version!==o.__version||i===!0){d.activeTexture(e.TEXTURE0+r);let t=J.getPrimaries(J.workingColorSpace),s=n.colorSpace===``?null:J.getPrimaries(n.colorSpace),c=n.colorSpace===``||t===s?e.NONE:e.BROWSER_DEFAULT_WEBGL;d.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,n.flipY),d.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,n.premultiplyAlpha),d.pixelStorei(e.UNPACK_ALIGNMENT,n.unpackAlignment),d.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,c);let l=n.isCompressedTexture||n.image[0].isCompressedTexture,u=n.image[0]&&n.image[0].isDataTexture,f=[];for(let e=0;e<6;e++)!l&&!u?f[e]=T(n.image[e],!0,p.maxCubemapSize):f[e]=u?n.image[e].image:n.image[e],f[e]=Me(n,f[e]);let h=f[0],g=m.convert(n.format,n.colorSpace),_=m.convert(n.type),v=A(n.internalFormat,g,_,n.normalized,n.colorSpace),y=n.isVideoTexture!==!0,b=o.__version===void 0||i===!0,x=a.dataReady,S=ee(n,h);me(e.TEXTURE_CUBE_MAP,n);let C;if(l){y&&b&&d.texStorage2D(e.TEXTURE_CUBE_MAP,S,v,h.width,h.height);for(let t=0;t<6;t++){C=f[t].mipmaps;for(let r=0;r<C.length;r++){let i=C[r];n.format===1023?y?x&&d.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r,0,0,i.width,i.height,g,_,i.data):d.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r,v,i.width,i.height,0,g,_,i.data):g===null?V(`WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()`):y?x&&d.compressedTexSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r,0,0,i.width,i.height,g,i.data):d.compressedTexImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r,v,i.width,i.height,0,i.data)}}}else{if(C=n.mipmaps,y&&b){C.length>0&&S++;let t=Ne(f[0]);d.texStorage2D(e.TEXTURE_CUBE_MAP,S,v,t.width,t.height)}for(let t=0;t<6;t++)if(u){y?x&&d.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,0,0,f[t].width,f[t].height,g,_,f[t].data):d.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,v,f[t].width,f[t].height,0,g,_,f[t].data);for(let n=0;n<C.length;n++){let r=C[n].image[t].image;y?x&&d.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,n+1,0,0,r.width,r.height,g,_,r.data):d.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,n+1,v,r.width,r.height,0,g,_,r.data)}}else{y?x&&d.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,0,0,g,_,f[t]):d.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,v,g,_,f[t]);for(let n=0;n<C.length;n++){let r=C[n];y?x&&d.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,n+1,0,0,g,_,r.image[t]):d.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,n+1,v,g,_,r.image[t])}}}E(n)&&D(e.TEXTURE_CUBE_MAP),o.__version=a.version,n.onUpdate&&n.onUpdate(n)}t.__version=n.version}function be(t,n,r,i,a,o){let s=m.convert(r.format,r.colorSpace),c=m.convert(r.type),l=A(r.internalFormat,s,c,r.normalized,r.colorSpace),u=f.get(n),p=f.get(r);if(p.__renderTarget=n,!u.__hasExternalTextures){let t=Math.max(1,n.width>>o),r=Math.max(1,n.height>>o);a===e.TEXTURE_3D||a===e.TEXTURE_2D_ARRAY?d.texImage3D(a,o,l,t,r,n.depth,0,s,c,null):d.texImage2D(a,o,l,t,r,0,s,c,null)}d.bindFramebuffer(e.FRAMEBUFFER,t),je(n)?g.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,i,a,p.__webglTexture,0,Ae(n)):(a===e.TEXTURE_2D||a>=e.TEXTURE_CUBE_MAP_POSITIVE_X&&a<=e.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&e.framebufferTexture2D(e.FRAMEBUFFER,i,a,p.__webglTexture,o),d.bindFramebuffer(e.FRAMEBUFFER,null)}function xe(t,n,r){if(e.bindRenderbuffer(e.RENDERBUFFER,t),n.depthBuffer){let i=n.depthTexture,a=i&&i.isDepthTexture?i.type:null,o=j(n.stencilBuffer,a),s=n.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;je(n)?g.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,Ae(n),o,n.width,n.height):r?e.renderbufferStorageMultisample(e.RENDERBUFFER,Ae(n),o,n.width,n.height):e.renderbufferStorage(e.RENDERBUFFER,o,n.width,n.height),e.framebufferRenderbuffer(e.FRAMEBUFFER,s,e.RENDERBUFFER,t)}else{let t=n.textures;for(let i=0;i<t.length;i++){let a=t[i],o=m.convert(a.format,a.colorSpace),s=m.convert(a.type),c=A(a.internalFormat,o,s,a.normalized,a.colorSpace);je(n)?g.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,Ae(n),c,n.width,n.height):r?e.renderbufferStorageMultisample(e.RENDERBUFFER,Ae(n),c,n.width,n.height):e.renderbufferStorage(e.RENDERBUFFER,c,n.width,n.height)}}e.bindRenderbuffer(e.RENDERBUFFER,null)}function Se(t,n,r){let i=n.isWebGLCubeRenderTarget===!0;if(d.bindFramebuffer(e.FRAMEBUFFER,t),!(n.depthTexture&&n.depthTexture.isDepthTexture))throw Error(`THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.`);let a=f.get(n.depthTexture);if(a.__renderTarget=n,a.__webglTexture&&n.depthTexture.image.width===n.width&&n.depthTexture.image.height===n.height||(n.depthTexture.image.width=n.width,n.depthTexture.image.height=n.height,n.depthTexture.needsUpdate=!0),i){if(a.__webglInit===void 0&&(a.__webglInit=!0,n.depthTexture.addEventListener(`dispose`,te)),a.__webglTexture===void 0){a.__webglTexture=e.createTexture(),d.bindTexture(e.TEXTURE_CUBE_MAP,a.__webglTexture),me(e.TEXTURE_CUBE_MAP,n.depthTexture);let t=m.convert(n.depthTexture.format),r=m.convert(n.depthTexture.type),i;n.depthTexture.format===1026?i=e.DEPTH_COMPONENT24:n.depthTexture.format===1027&&(i=e.DEPTH24_STENCIL8);for(let a=0;a<6;a++)e.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+a,0,i,n.width,n.height,0,t,r,null)}}else I(n.depthTexture,0);let o=a.__webglTexture,s=Ae(n),c=i?e.TEXTURE_CUBE_MAP_POSITIVE_X+r:e.TEXTURE_2D,l=n.depthTexture.format===1027?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;if(n.depthTexture.format===1026)je(n)?g.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,l,c,o,0,s):e.framebufferTexture2D(e.FRAMEBUFFER,l,c,o,0);else if(n.depthTexture.format===1027)je(n)?g.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,l,c,o,0,s):e.framebufferTexture2D(e.FRAMEBUFFER,l,c,o,0);else throw Error(`THREE.WebGLTextures: Unknown depthTexture format.`)}function Ce(t){let n=f.get(t),r=t.isWebGLCubeRenderTarget===!0;if(n.__boundDepthTexture!==t.depthTexture){let e=t.depthTexture;if(n.__depthDisposeCallback&&n.__depthDisposeCallback(),e){let t=()=>{delete n.__boundDepthTexture,delete n.__depthDisposeCallback,e.removeEventListener(`dispose`,t)};e.addEventListener(`dispose`,t),n.__depthDisposeCallback=t}n.__boundDepthTexture=e}if(t.depthTexture&&!n.__autoAllocateDepthBuffer){if(r)for(let e=0;e<6;e++)Se(n.__webglFramebuffer[e],t,e);else{let e=t.texture.mipmaps;e&&e.length>0?Se(n.__webglFramebuffer[0],t,0):Se(n.__webglFramebuffer,t,0)}}else if(r){n.__webglDepthbuffer=[];for(let r=0;r<6;r++)if(d.bindFramebuffer(e.FRAMEBUFFER,n.__webglFramebuffer[r]),n.__webglDepthbuffer[r]===void 0)n.__webglDepthbuffer[r]=e.createRenderbuffer(),xe(n.__webglDepthbuffer[r],t,!1);else{let i=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,a=n.__webglDepthbuffer[r];e.bindRenderbuffer(e.RENDERBUFFER,a),e.framebufferRenderbuffer(e.FRAMEBUFFER,i,e.RENDERBUFFER,a)}}else{let r=t.texture.mipmaps;if(r&&r.length>0?d.bindFramebuffer(e.FRAMEBUFFER,n.__webglFramebuffer[0]):d.bindFramebuffer(e.FRAMEBUFFER,n.__webglFramebuffer),n.__webglDepthbuffer===void 0)n.__webglDepthbuffer=e.createRenderbuffer(),xe(n.__webglDepthbuffer,t,!1);else{let r=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,i=n.__webglDepthbuffer;e.bindRenderbuffer(e.RENDERBUFFER,i),e.framebufferRenderbuffer(e.FRAMEBUFFER,r,e.RENDERBUFFER,i)}}d.bindFramebuffer(e.FRAMEBUFFER,null)}function we(t,n,r){let i=f.get(t);n!==void 0&&be(i.__webglFramebuffer,t,t.texture,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,0),r!==void 0&&Ce(t)}function Te(t){let n=t.texture,r=f.get(t),i=f.get(n);t.addEventListener(`dispose`,M);let a=t.textures,o=t.isWebGLCubeRenderTarget===!0,s=a.length>1;if(s||(i.__webglTexture===void 0&&(i.__webglTexture=e.createTexture()),i.__version=n.version,h.memory.textures++),o){r.__webglFramebuffer=[];for(let t=0;t<6;t++)if(n.mipmaps&&n.mipmaps.length>0){r.__webglFramebuffer[t]=[];for(let i=0;i<n.mipmaps.length;i++)r.__webglFramebuffer[t][i]=e.createFramebuffer()}else r.__webglFramebuffer[t]=e.createFramebuffer()}else{if(n.mipmaps&&n.mipmaps.length>0){r.__webglFramebuffer=[];for(let t=0;t<n.mipmaps.length;t++)r.__webglFramebuffer[t]=e.createFramebuffer()}else r.__webglFramebuffer=e.createFramebuffer();if(s)for(let t=0,n=a.length;t<n;t++){let n=f.get(a[t]);n.__webglTexture===void 0&&(n.__webglTexture=e.createTexture(),h.memory.textures++)}if(t.samples>0&&je(t)===!1){r.__webglMultisampledFramebuffer=e.createFramebuffer(),r.__webglColorRenderbuffer=[],d.bindFramebuffer(e.FRAMEBUFFER,r.__webglMultisampledFramebuffer);for(let n=0;n<a.length;n++){let i=a[n];r.__webglColorRenderbuffer[n]=e.createRenderbuffer(),e.bindRenderbuffer(e.RENDERBUFFER,r.__webglColorRenderbuffer[n]);let o=m.convert(i.format,i.colorSpace),s=m.convert(i.type),c=A(i.internalFormat,o,s,i.normalized,i.colorSpace,t.isXRRenderTarget===!0),l=Ae(t);e.renderbufferStorageMultisample(e.RENDERBUFFER,l,c,t.width,t.height),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+n,e.RENDERBUFFER,r.__webglColorRenderbuffer[n])}e.bindRenderbuffer(e.RENDERBUFFER,null),t.depthBuffer&&(r.__webglDepthRenderbuffer=e.createRenderbuffer(),xe(r.__webglDepthRenderbuffer,t,!0)),d.bindFramebuffer(e.FRAMEBUFFER,null)}}if(o){d.bindTexture(e.TEXTURE_CUBE_MAP,i.__webglTexture),me(e.TEXTURE_CUBE_MAP,n);for(let i=0;i<6;i++)if(n.mipmaps&&n.mipmaps.length>0)for(let a=0;a<n.mipmaps.length;a++)be(r.__webglFramebuffer[i][a],t,n,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+i,a);else be(r.__webglFramebuffer[i],t,n,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+i,0);E(n)&&D(e.TEXTURE_CUBE_MAP),d.unbindTexture()}else if(s){for(let n=0,i=a.length;n<i;n++){let i=a[n],o=f.get(i),s=e.TEXTURE_2D;(t.isWebGL3DRenderTarget||t.isWebGLArrayRenderTarget)&&(s=t.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY),d.bindTexture(s,o.__webglTexture),me(s,i),be(r.__webglFramebuffer,t,i,e.COLOR_ATTACHMENT0+n,s,0),E(i)&&D(s)}d.unbindTexture()}else{let a=e.TEXTURE_2D;if((t.isWebGL3DRenderTarget||t.isWebGLArrayRenderTarget)&&(a=t.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY),d.bindTexture(a,i.__webglTexture),me(a,n),n.mipmaps&&n.mipmaps.length>0)for(let i=0;i<n.mipmaps.length;i++)be(r.__webglFramebuffer[i],t,n,e.COLOR_ATTACHMENT0,a,i);else be(r.__webglFramebuffer,t,n,e.COLOR_ATTACHMENT0,a,0);E(n)&&D(a),d.unbindTexture()}t.depthBuffer&&Ce(t)}function Ee(e){let t=e.textures;for(let n=0,r=t.length;n<r;n++){let r=t[n];if(E(r)){let t=k(e),n=f.get(r).__webglTexture;d.bindTexture(t,n),D(t),d.unbindTexture()}}}let De=[],Oe=[];function ke(t){if(t.samples>0){if(je(t)===!1){let n=t.textures,r=t.width,i=t.height,a=e.COLOR_BUFFER_BIT,o=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,s=f.get(t),c=n.length>1;if(c)for(let t=0;t<n.length;t++)d.bindFramebuffer(e.FRAMEBUFFER,s.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.RENDERBUFFER,null),d.bindFramebuffer(e.FRAMEBUFFER,s.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.TEXTURE_2D,null,0);d.bindFramebuffer(e.READ_FRAMEBUFFER,s.__webglMultisampledFramebuffer);let l=t.texture.mipmaps;l&&l.length>0?d.bindFramebuffer(e.DRAW_FRAMEBUFFER,s.__webglFramebuffer[0]):d.bindFramebuffer(e.DRAW_FRAMEBUFFER,s.__webglFramebuffer);for(let l=0;l<n.length;l++){if(t.resolveDepthBuffer&&(t.depthBuffer&&(a|=e.DEPTH_BUFFER_BIT),t.stencilBuffer&&t.resolveStencilBuffer&&(a|=e.STENCIL_BUFFER_BIT)),c){e.framebufferRenderbuffer(e.READ_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.RENDERBUFFER,s.__webglColorRenderbuffer[l]);let t=f.get(n[l]).__webglTexture;e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,t,0)}e.blitFramebuffer(0,0,r,i,0,0,r,i,a,e.NEAREST),_===!0&&(De.length=0,Oe.length=0,De.push(e.COLOR_ATTACHMENT0+l),t.depthBuffer&&t.storeMultisampledDepthBuffer===!1&&(De.push(o),Oe.push(o),e.invalidateFramebuffer(e.DRAW_FRAMEBUFFER,Oe)),e.invalidateFramebuffer(e.READ_FRAMEBUFFER,De))}if(d.bindFramebuffer(e.READ_FRAMEBUFFER,null),d.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),c)for(let t=0;t<n.length;t++){d.bindFramebuffer(e.FRAMEBUFFER,s.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.RENDERBUFFER,s.__webglColorRenderbuffer[t]);let r=f.get(n[t]).__webglTexture;d.bindFramebuffer(e.FRAMEBUFFER,s.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.TEXTURE_2D,r,0)}d.bindFramebuffer(e.DRAW_FRAMEBUFFER,s.__webglMultisampledFramebuffer)}else if(t.depthBuffer&&t.storeMultisampledDepthBuffer===!1&&_){let n=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;e.invalidateFramebuffer(e.DRAW_FRAMEBUFFER,[n])}}}function Ae(e){return Math.min(p.maxSamples,e.samples)}function je(e){let n=f.get(e);return e.samples>0&&t.has(`WEBGL_multisampled_render_to_texture`)===!0&&n.__useRenderToTexture!==!1}function L(e){let t=h.render.frame;y.get(e)!==t&&(y.set(e,t),e.update())}function Me(e,t){let n=e.colorSpace,r=e.format,i=e.type;return e.isCompressedTexture===!0||e.isVideoTexture===!0||n!==`srgb-linear`&&n!==``&&(J.getTransfer(n)===`srgb`?(r!==1023||i!==1009)&&V(`WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType.`):H(`WebGLTextures: Unsupported texture color space:`,n)),t}function Ne(e){return typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement?(v.width=e.naturalWidth||e.width,v.height=e.naturalHeight||e.height):typeof VideoFrame<`u`&&e instanceof VideoFrame?(v.width=e.displayWidth,v.height=e.displayHeight):(v.width=e.width,v.height=e.height),v}this.allocateTextureUnit=oe,this.resetTextureUnits=re,this.getTextureUnits=ie,this.setTextureUnits=ae,this.setTexture2D=I,this.setTexture2DArray=ce,this.setTexture3D=le,this.setTextureCube=ue,this.rebindTextures=we,this.setupRenderTarget=Te,this.updateRenderTargetMipmap=Ee,this.updateMultisampleRenderTarget=ke,this.setupDepthRenderbuffer=Ce,this.setupFrameBufferTexture=be,this.useMultisampledRTT=je,this.isReversedDepthBuffer=function(){return d.buffers.depth.getReversed()}}function Mc(e,t){function n(n,r=``){let i,a=J.getTransfer(r);if(n===1009)return e.UNSIGNED_BYTE;if(n===1017)return e.UNSIGNED_SHORT_4_4_4_4;if(n===1018)return e.UNSIGNED_SHORT_5_5_5_1;if(n===35902)return e.UNSIGNED_INT_5_9_9_9_REV;if(n===35899)return e.UNSIGNED_INT_10F_11F_11F_REV;if(n===1010)return e.BYTE;if(n===1011)return e.SHORT;if(n===1012)return e.UNSIGNED_SHORT;if(n===1013)return e.INT;if(n===1014)return e.UNSIGNED_INT;if(n===1015)return e.FLOAT;if(n===1016)return e.HALF_FLOAT;if(n===1021)return e.ALPHA;if(n===1022)return e.RGB;if(n===1023)return e.RGBA;if(n===1026)return e.DEPTH_COMPONENT;if(n===1027)return e.DEPTH_STENCIL;if(n===1028)return e.RED;if(n===1029)return e.RED_INTEGER;if(n===1030)return e.RG;if(n===1031)return e.RG_INTEGER;if(n===1033)return e.RGBA_INTEGER;if(n===33776||n===33777||n===33778||n===33779){if(a===`srgb`){if(i=t.get(`WEBGL_compressed_texture_s3tc_srgb`),i!==null){if(n===33776)return i.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===33777)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===33778)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===33779)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null}else if(i=t.get(`WEBGL_compressed_texture_s3tc`),i!==null){if(n===33776)return i.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===33777)return i.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===33778)return i.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===33779)return i.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null}if(n===35840||n===35841||n===35842||n===35843){if(i=t.get(`WEBGL_compressed_texture_pvrtc`),i!==null){if(n===35840)return i.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===35841)return i.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===35842)return i.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===35843)return i.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null}if(n===36196||n===37492||n===37496||n===37488||n===37489||n===37490||n===37491){if(i=t.get(`WEBGL_compressed_texture_etc`),i!==null){if(n===36196||n===37492)return a===`srgb`?i.COMPRESSED_SRGB8_ETC2:i.COMPRESSED_RGB8_ETC2;if(n===37496)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:i.COMPRESSED_RGBA8_ETC2_EAC;if(n===37488)return i.COMPRESSED_R11_EAC;if(n===37489)return i.COMPRESSED_SIGNED_R11_EAC;if(n===37490)return i.COMPRESSED_RG11_EAC;if(n===37491)return i.COMPRESSED_SIGNED_RG11_EAC}else return null}if(n===37808||n===37809||n===37810||n===37811||n===37812||n===37813||n===37814||n===37815||n===37816||n===37817||n===37818||n===37819||n===37820||n===37821){if(i=t.get(`WEBGL_compressed_texture_astc`),i!==null){if(n===37808)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:i.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===37809)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:i.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===37810)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:i.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===37811)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:i.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===37812)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:i.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===37813)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:i.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===37814)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:i.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===37815)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:i.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===37816)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:i.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===37817)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:i.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===37818)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:i.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===37819)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:i.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===37820)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:i.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===37821)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:i.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null}if(n===36492||n===36494||n===36495){if(i=t.get(`EXT_texture_compression_bptc`),i!==null){if(n===36492)return a===`srgb`?i.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:i.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===36494)return i.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===36495)return i.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null}if(n===36283||n===36284||n===36285||n===36286){if(i=t.get(`EXT_texture_compression_rgtc`),i!==null){if(n===36283)return i.COMPRESSED_RED_RGTC1_EXT;if(n===36284)return i.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===36285)return i.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===36286)return i.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null}return n===1020?e.UNSIGNED_INT_24_8:e[n]===void 0?null:e[n]}return{convert:n}}var Nc=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,Pc=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`,Fc=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){let n=new yi(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=n}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,n=new Ai({vertexShader:Nc,fragmentShader:Pc,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new $r(new xi(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},Ic=class extends nt{constructor(e,t){super();let n=this,r=null,i=1,a=null,o=`local-floor`,s=1,c=null,l=null,u=null,f=null,p=null,m=null,h=typeof XRWebGLBinding<`u`,_=new Fc,v={},y=t.getContextAttributes(),b=null,S=null,C=[],w=[],T=new G,k=null,A=null,j=new oa;j.viewport=new Gt;let ee=new oa;ee.viewport=new Gt;let te=[j,ee],M=new fa,N=null,P=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(e){let t=C[e];return t===void 0&&(t=new En,C[e]=t),t.getTargetRaySpace()},this.getControllerGrip=function(e){let t=C[e];return t===void 0&&(t=new En,C[e]=t),t.getGripSpace()},this.getHand=function(e){let t=C[e];return t===void 0&&(t=new En,C[e]=t),t.getHandSpace()};function ne(e){let t=w.indexOf(e.inputSource);if(t===-1)return;let n=C[t];n!==void 0&&(n.update(e.inputSource,e.frame,c||a),n.dispatchEvent({type:e.type,data:e.inputSource}))}function F(){r.removeEventListener(`select`,ne),r.removeEventListener(`selectstart`,ne),r.removeEventListener(`selectend`,ne),r.removeEventListener(`squeeze`,ne),r.removeEventListener(`squeezestart`,ne),r.removeEventListener(`squeezeend`,ne),r.removeEventListener(`end`,F),r.removeEventListener(`inputsourceschange`,re);for(let e=0;e<C.length;e++){let t=w[e];t!==null&&(w[e]=null,C[e].disconnect(t))}N=null,P=null,_.reset();for(let e in v)delete v[e];if(e.setRenderTarget(b),p=null,f=null,u=null,r=null,S=null,ue.stop(),n.isPresenting=!1,e.setPixelRatio(k),e.setSize(T.width,T.height,!1),A!==null){let e=A.camera;e.fov=A.fov,e.zoom=A.zoom,e.updateProjectionMatrix(),A=null}n.dispatchEvent({type:`sessionend`})}this.setFramebufferScaleFactor=function(e){i=e,n.isPresenting===!0&&V(`WebXRManager: Cannot change framebuffer scale while presenting.`)},this.setReferenceSpaceType=function(e){o=e,n.isPresenting===!0&&V(`WebXRManager: Cannot change reference space type while presenting.`)},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function(e){c=e},this.getBaseLayer=function(){return f===null?p:f},this.getBinding=function(){return u===null&&h&&(u=new XRWebGLBinding(r,t)),u},this.getFrame=function(){return m},this.getSession=function(){return r},this.setSession=async function(l){if(r=l,r!==null){if(b=e.getRenderTarget(),r.addEventListener(`select`,ne),r.addEventListener(`selectstart`,ne),r.addEventListener(`selectend`,ne),r.addEventListener(`squeeze`,ne),r.addEventListener(`squeezestart`,ne),r.addEventListener(`squeezeend`,ne),r.addEventListener(`end`,F),r.addEventListener(`inputsourceschange`,re),y.xrCompatible!==!0&&await t.makeXRCompatible(),k=e.getPixelRatio(),e.getSize(T),h&&`createProjectionLayer`in XRWebGLBinding.prototype){let n=null,a=null,o=null;y.depth&&(o=y.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,n=y.stencil?O:D,a=y.stencil?x:g);let s={colorFormat:t.RGBA8,depthFormat:o,scaleFactor:i};u=this.getBinding(),f=u.createProjectionLayer(s),r.updateRenderState({layers:[f]}),e.setPixelRatio(1),e.setSize(f.textureWidth,f.textureHeight,!1),S=new qt(f.textureWidth,f.textureHeight,{format:E,type:d,depthTexture:new _i(f.textureWidth,f.textureHeight,a,void 0,void 0,void 0,void 0,void 0,void 0,n),stencilBuffer:y.stencil,colorSpace:e.outputColorSpace,samples:y.antialias?4:0,resolveDepthBuffer:f.ignoreDepthValues===!1,resolveStencilBuffer:f.ignoreDepthValues===!1,storeMultisampledDepthBuffer:f.ignoreDepthValues===!1,storeMultisampledStencilBuffer:f.ignoreDepthValues===!1})}else{let n={antialias:y.antialias,alpha:!0,depth:y.depth,stencil:y.stencil,framebufferScaleFactor:i};p=new XRWebGLLayer(r,t,n),r.updateRenderState({baseLayer:p}),e.setPixelRatio(1),e.setSize(p.framebufferWidth,p.framebufferHeight,!1),S=new qt(p.framebufferWidth,p.framebufferHeight,{format:E,type:d,colorSpace:e.outputColorSpace,stencilBuffer:y.stencil,resolveDepthBuffer:p.ignoreDepthValues===!1,resolveStencilBuffer:p.ignoreDepthValues===!1,storeMultisampledDepthBuffer:p.ignoreDepthValues===!1,storeMultisampledStencilBuffer:p.ignoreDepthValues===!1})}S.isXRRenderTarget=!0,this.setFoveation(s),c=null,a=await r.requestReferenceSpace(o),ue.setContext(r),ue.start(),n.isPresenting=!0,n.dispatchEvent({type:`sessionstart`})}},this.getEnvironmentBlendMode=function(){if(r!==null)return r.environmentBlendMode},this.getDepthTexture=function(){return _.getDepthTexture()};function re(e){for(let t=0;t<e.removed.length;t++){let n=e.removed[t],r=w.indexOf(n);r>=0&&(w[r]=null,C[r].disconnect(n))}for(let t=0;t<e.added.length;t++){let n=e.added[t],r=w.indexOf(n);if(r===-1){for(let e=0;e<C.length;e++)if(e>=w.length){w.push(n),r=e;break}else if(w[e]===null){w[e]=n,r=e;break}if(r===-1)break}let i=C[r];i&&i.connect(n)}}let ie=new K,ae=new K;function oe(e,t,n){ie.setFromMatrixPosition(t.matrixWorld),ae.setFromMatrixPosition(n.matrixWorld);let r=ie.distanceTo(ae),i=t.projectionMatrix.elements,a=n.projectionMatrix.elements,o=i[14]/(i[10]-1),s=i[14]/(i[10]+1),c=(i[9]+1)/i[5],l=(i[9]-1)/i[5],u=(i[8]-1)/i[0],d=(a[8]+1)/a[0],f=o*u,p=o*d,m=r/(-u+d),h=m*-u;if(t.matrixWorld.decompose(e.position,e.quaternion,e.scale),e.translateX(h),e.translateZ(m),e.matrixWorld.compose(e.position,e.quaternion,e.scale),e.matrixWorldInverse.copy(e.matrixWorld).invert(),i[10]===-1)e.projectionMatrix.copy(t.projectionMatrix),e.projectionMatrixInverse.copy(t.projectionMatrixInverse);else{let t=o+m,n=s+m,i=f-h,a=p+(r-h),u=c*s/n*t,d=l*s/n*t;e.projectionMatrix.makePerspective(i,a,u,d,t,n),e.projectionMatrixInverse.copy(e.projectionMatrix).invert()}}function se(e,t){t===null?e.matrixWorld.copy(e.matrix):e.matrixWorld.multiplyMatrices(t.matrixWorld,e.matrix),e.matrixWorldInverse.copy(e.matrixWorld).invert()}this.updateCamera=function(e){if(r===null)return;let t=e.near,n=e.far;_.texture!==null&&(_.depthNear>0&&(t=_.depthNear),_.depthFar>0&&(n=_.depthFar)),M.near=ee.near=j.near=t,M.far=ee.far=j.far=n,(N!==M.near||P!==M.far)&&(r.updateRenderState({depthNear:M.near,depthFar:M.far}),N=M.near,P=M.far),M.layers.mask=e.layers.mask|6,j.layers.mask=M.layers.mask&-5,ee.layers.mask=M.layers.mask&-3;let i=e.parent,a=M.cameras;se(M,i);for(let e=0;e<a.length;e++)se(a[e],i);a.length===2?oe(M,j,ee):M.projectionMatrix.copy(j.projectionMatrix),A===null&&e.isPerspectiveCamera&&(A={camera:e,fov:e.fov,zoom:e.zoom}),I(e,M,i)};function I(e,t,n){n===null?e.matrix.copy(t.matrixWorld):(e.matrix.copy(n.matrixWorld),e.matrix.invert(),e.matrix.multiply(t.matrixWorld)),e.matrix.decompose(e.position,e.quaternion,e.scale),e.updateMatrixWorld(!0),e.projectionMatrix.copy(t.projectionMatrix),e.projectionMatrixInverse.copy(t.projectionMatrixInverse),e.isPerspectiveCamera&&(e.fov=ot*2*Math.atan(1/e.projectionMatrix.elements[5]),e.zoom=1)}this.getCamera=function(){return M},this.getFoveation=function(){if(f!==null||p!==null)return s},this.setFoveation=function(e){s=e,f!==null&&(f.fixedFoveation=e),p!==null&&p.fixedFoveation!==void 0&&(p.fixedFoveation=e)},this.hasDepthSensing=function(){return _.texture!==null},this.getDepthSensingMesh=function(){return _.getMesh(M)},this.getCameraTexture=function(e){return v[e]};let ce=null;function le(t,i){if(l=i.getViewerPose(c||a),m=i,l!==null){let t=l.views;p!==null&&(e.setRenderTargetFramebuffer(S,p.framebuffer),e.setRenderTarget(S));let i=!1;t.length!==M.cameras.length&&(M.cameras.length=0,i=!0);for(let n=0;n<t.length;n++){let r=t[n],a=null;if(p!==null)a=p.getViewport(r);else{let t=u.getViewSubImage(f,r);a=t.viewport,n===0&&(e.setRenderTargetTextures(S,t.colorTexture,t.depthStencilTexture),e.setRenderTarget(S))}let o=te[n];o===void 0&&(o=new oa,o.layers.enable(n),o.viewport=new Gt,te[n]=o),o.matrix.fromArray(r.transform.matrix),o.matrix.decompose(o.position,o.quaternion,o.scale),o.projectionMatrix.fromArray(r.projectionMatrix),o.projectionMatrixInverse.copy(o.projectionMatrix).invert(),o.viewport.set(a.x,a.y,a.width,a.height),n===0&&(M.matrix.copy(o.matrix),M.matrix.decompose(M.position,M.quaternion,M.scale)),i===!0&&M.cameras.push(o)}let a=r.enabledFeatures;if(a&&a.includes(`depth-sensing`)&&r.depthUsage==`gpu-optimized`&&h){u=n.getBinding();let e=u.getDepthInformation(t[0]);e&&e.isValid&&e.texture&&_.init(e,r.renderState)}if(a&&a.includes(`camera-access`)&&h){e.state.unbindTexture(),u=n.getBinding();for(let e=0;e<t.length;e++){let n=t[e].camera;if(n){let e=v[n];e||(e=new yi,v[n]=e);let t=u.getCameraImage(n);e.sourceTexture=t}}}}for(let e=0;e<C.length;e++){let t=w[e],n=C[e];t!==null&&n!==void 0&&n.update(t,i,c||a)}ce&&ce(t,i),i.detectedPlanes&&n.dispatchEvent({type:`planesdetected`,data:i}),m=null}let ue=new Da;ue.setAnimationLoop(le),this.setAnimationLoop=function(e){ce=e},this.dispose=function(){}}},Lc=new Y,Rc=new q;Rc.set(-1,0,0,0,1,0,0,0,1);function zc(e,t){function n(e,t){e.matrixAutoUpdate===!0&&e.updateMatrix(),t.value.copy(e.matrix)}function r(t,n){n.color.getRGB(t.fogColor.value,Ei(e)),n.isFog?(t.fogNear.value=n.near,t.fogFar.value=n.far):n.isFogExp2&&(t.fogDensity.value=n.density)}function i(e,t,n,r,i){t.isNodeMaterial?t.uniformsNeedUpdate=!1:t.isMeshBasicMaterial?a(e,t):t.isMeshLambertMaterial?(a(e,t),t.envMap&&(e.envMapIntensity.value=t.envMapIntensity)):t.isMeshToonMaterial?(a(e,t),d(e,t)):t.isMeshPhongMaterial?(a(e,t),u(e,t),t.envMap&&(e.envMapIntensity.value=t.envMapIntensity)):t.isMeshStandardMaterial?(a(e,t),f(e,t),t.isMeshPhysicalMaterial&&p(e,t,i)):t.isMeshMatcapMaterial?(a(e,t),m(e,t)):t.isMeshDepthMaterial?a(e,t):t.isMeshDistanceMaterial?(a(e,t),h(e,t)):t.isMeshNormalMaterial?a(e,t):t.isLineBasicMaterial?(o(e,t),t.isLineDashedMaterial&&s(e,t)):t.isPointsMaterial?c(e,t,n,r):t.isSpriteMaterial?l(e,t):t.isShadowMaterial?(e.color.value.copy(t.color),e.opacity.value=t.opacity):t.isShaderMaterial&&(t.uniformsNeedUpdate=!1)}function a(e,r){e.opacity.value=r.opacity,r.color&&e.diffuse.value.copy(r.color),r.emissive&&e.emissive.value.copy(r.emissive).multiplyScalar(r.emissiveIntensity),r.map&&(e.map.value=r.map,n(r.map,e.mapTransform)),r.alphaMap&&(e.alphaMap.value=r.alphaMap,n(r.alphaMap,e.alphaMapTransform)),r.bumpMap&&(e.bumpMap.value=r.bumpMap,n(r.bumpMap,e.bumpMapTransform),e.bumpScale.value=r.bumpScale,r.side===1&&(e.bumpScale.value*=-1)),r.normalMap&&(e.normalMap.value=r.normalMap,n(r.normalMap,e.normalMapTransform),e.normalScale.value.copy(r.normalScale),r.side===1&&e.normalScale.value.negate()),r.displacementMap&&(e.displacementMap.value=r.displacementMap,n(r.displacementMap,e.displacementMapTransform),e.displacementScale.value=r.displacementScale,e.displacementBias.value=r.displacementBias),r.emissiveMap&&(e.emissiveMap.value=r.emissiveMap,n(r.emissiveMap,e.emissiveMapTransform)),r.specularMap&&(e.specularMap.value=r.specularMap,n(r.specularMap,e.specularMapTransform)),r.alphaTest>0&&(e.alphaTest.value=r.alphaTest);let i=t.get(r),a=i.envMap,o=i.envMapRotation;a&&(e.envMap.value=a,e.envMapRotation.value.setFromMatrix4(Lc.makeRotationFromEuler(o)).transpose(),a.isCubeTexture&&a.isRenderTargetTexture===!1&&e.envMapRotation.value.premultiply(Rc),e.reflectivity.value=r.reflectivity,e.ior.value=r.ior,e.refractionRatio.value=r.refractionRatio),r.lightMap&&(e.lightMap.value=r.lightMap,e.lightMapIntensity.value=r.lightMapIntensity,n(r.lightMap,e.lightMapTransform)),r.aoMap&&(e.aoMap.value=r.aoMap,e.aoMapIntensity.value=r.aoMapIntensity,n(r.aoMap,e.aoMapTransform))}function o(e,t){e.diffuse.value.copy(t.color),e.opacity.value=t.opacity,t.map&&(e.map.value=t.map,n(t.map,e.mapTransform))}function s(e,t){e.dashSize.value=t.dashSize,e.totalSize.value=t.dashSize+t.gapSize,e.scale.value=t.scale}function c(e,t,r,i){e.diffuse.value.copy(t.color),e.opacity.value=t.opacity,e.size.value=t.size*r,e.scale.value=i*.5,t.map&&(e.map.value=t.map,n(t.map,e.uvTransform)),t.alphaMap&&(e.alphaMap.value=t.alphaMap,n(t.alphaMap,e.alphaMapTransform)),t.alphaTest>0&&(e.alphaTest.value=t.alphaTest)}function l(e,t){e.diffuse.value.copy(t.color),e.opacity.value=t.opacity,e.rotation.value=t.rotation,t.map&&(e.map.value=t.map,n(t.map,e.mapTransform)),t.alphaMap&&(e.alphaMap.value=t.alphaMap,n(t.alphaMap,e.alphaMapTransform)),t.alphaTest>0&&(e.alphaTest.value=t.alphaTest)}function u(e,t){e.specular.value.copy(t.specular),e.shininess.value=Math.max(t.shininess,1e-4)}function d(e,t){t.gradientMap&&(e.gradientMap.value=t.gradientMap)}function f(e,t){e.metalness.value=t.metalness,t.metalnessMap&&(e.metalnessMap.value=t.metalnessMap,n(t.metalnessMap,e.metalnessMapTransform)),e.roughness.value=t.roughness,t.roughnessMap&&(e.roughnessMap.value=t.roughnessMap,n(t.roughnessMap,e.roughnessMapTransform)),t.envMap&&(e.envMapIntensity.value=t.envMapIntensity)}function p(e,t,r){e.ior.value=t.ior,t.sheen>0&&(e.sheenColor.value.copy(t.sheenColor).multiplyScalar(t.sheen),e.sheenRoughness.value=t.sheenRoughness,t.sheenColorMap&&(e.sheenColorMap.value=t.sheenColorMap,n(t.sheenColorMap,e.sheenColorMapTransform)),t.sheenRoughnessMap&&(e.sheenRoughnessMap.value=t.sheenRoughnessMap,n(t.sheenRoughnessMap,e.sheenRoughnessMapTransform))),t.clearcoat>0&&(e.clearcoat.value=t.clearcoat,e.clearcoatRoughness.value=t.clearcoatRoughness,t.clearcoatMap&&(e.clearcoatMap.value=t.clearcoatMap,n(t.clearcoatMap,e.clearcoatMapTransform)),t.clearcoatRoughnessMap&&(e.clearcoatRoughnessMap.value=t.clearcoatRoughnessMap,n(t.clearcoatRoughnessMap,e.clearcoatRoughnessMapTransform)),t.clearcoatNormalMap&&(e.clearcoatNormalMap.value=t.clearcoatNormalMap,n(t.clearcoatNormalMap,e.clearcoatNormalMapTransform),e.clearcoatNormalScale.value.copy(t.clearcoatNormalScale),t.side===1&&e.clearcoatNormalScale.value.negate())),t.dispersion>0&&(e.dispersion.value=t.dispersion),t.retroreflectivity>0&&(e.retroreflectivity.value=t.retroreflectivity),t.iridescence>0&&(e.iridescence.value=t.iridescence,e.iridescenceIOR.value=t.iridescenceIOR,e.iridescenceThicknessMinimum.value=t.iridescenceThicknessRange[0],e.iridescenceThicknessMaximum.value=t.iridescenceThicknessRange[1],t.iridescenceMap&&(e.iridescenceMap.value=t.iridescenceMap,n(t.iridescenceMap,e.iridescenceMapTransform)),t.iridescenceThicknessMap&&(e.iridescenceThicknessMap.value=t.iridescenceThicknessMap,n(t.iridescenceThicknessMap,e.iridescenceThicknessMapTransform))),t.transmission>0&&(e.transmission.value=t.transmission,e.transmissionSamplerMap.value=r.texture,e.transmissionSamplerSize.value.set(r.width,r.height),t.transmissionMap&&(e.transmissionMap.value=t.transmissionMap,n(t.transmissionMap,e.transmissionMapTransform)),e.thickness.value=t.thickness,t.thicknessMap&&(e.thicknessMap.value=t.thicknessMap,n(t.thicknessMap,e.thicknessMapTransform)),e.attenuationDistance.value=t.attenuationDistance,e.attenuationColor.value.copy(t.attenuationColor)),t.anisotropy>0&&(e.anisotropyVector.value.set(t.anisotropy*Math.cos(t.anisotropyRotation),t.anisotropy*Math.sin(t.anisotropyRotation)),t.anisotropyMap&&(e.anisotropyMap.value=t.anisotropyMap,n(t.anisotropyMap,e.anisotropyMapTransform))),e.specularIntensity.value=t.specularIntensity,e.specularColor.value.copy(t.specularColor),t.specularColorMap&&(e.specularColorMap.value=t.specularColorMap,n(t.specularColorMap,e.specularColorMapTransform)),t.specularIntensityMap&&(e.specularIntensityMap.value=t.specularIntensityMap,n(t.specularIntensityMap,e.specularIntensityMapTransform))}function m(e,t){t.matcap&&(e.matcap.value=t.matcap)}function h(e,n){let r=t.get(n).light;e.referencePosition.value.setFromMatrixPosition(r.matrixWorld),e.nearDistance.value=r.shadow.camera.near,e.farDistance.value=r.shadow.camera.far}return{refreshFogUniforms:r,refreshMaterialUniforms:i}}function Bc(e,t,n,r){let i={},a={},o=[],s=e.getParameter(e.MAX_UNIFORM_BUFFER_BINDINGS);function c(e,t){let n=t.program;r.uniformBlockBinding(e,n)}function l(e,n){let o=i[e.id];o===void 0&&(g(e),o=u(e),i[e.id]=o,e.addEventListener(`dispose`,v));let s=n.program;r.updateUBOMapping(e,s);let c=t.render.frame;a[e.id]!==c&&(f(e),a[e.id]=c)}function u(t){let n=d();t.__bindingPointIndex=n;let r=e.createBuffer(),i=t.__size,a=t.usage;return e.bindBuffer(e.UNIFORM_BUFFER,r),e.bufferData(e.UNIFORM_BUFFER,i,a),e.bindBuffer(e.UNIFORM_BUFFER,null),e.bindBufferBase(e.UNIFORM_BUFFER,n,r),r}function d(){for(let e=0;e<s;e++)if(o.indexOf(e)===-1)return o.push(e),e;return H(`WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached.`),0}function f(t){let n=i[t.id],r=t.uniforms,a=t.__cache;e.bindBuffer(e.UNIFORM_BUFFER,n);for(let e=0,t=r.length;e<t;e++){let t=r[e];if(Array.isArray(t))for(let n=0,r=t.length;n<r;n++)p(t[n],e,n,a);else p(t,e,0,a)}e.bindBuffer(e.UNIFORM_BUFFER,null)}function p(t,n,r,i){if(h(t,n,r,i)===!0){let n=t.__offset,r=t.value;if(Array.isArray(r)){let e=0;for(let n=0;n<r.length;n++){let i=r[n],a=_(i);m(i,t.__data,e),typeof i!=`number`&&typeof i!=`boolean`&&!i.isMatrix3&&!ArrayBuffer.isView(i)&&(e+=a.storage/Float32Array.BYTES_PER_ELEMENT)}}else m(r,t.__data,0);e.bufferSubData(e.UNIFORM_BUFFER,n,t.__data)}}function m(e,t,n){typeof e==`number`||typeof e==`boolean`?t[0]=e:e.isMatrix3?(t[0]=e.elements[0],t[1]=e.elements[1],t[2]=e.elements[2],t[3]=0,t[4]=e.elements[3],t[5]=e.elements[4],t[6]=e.elements[5],t[7]=0,t[8]=e.elements[6],t[9]=e.elements[7],t[10]=e.elements[8],t[11]=0):ArrayBuffer.isView(e)?t.set(new e.constructor(e.buffer,e.byteOffset,t.length)):e.toArray(t,n)}function h(e,t,n,r){let i=e.value,a=t+`_`+n;if(r[a]===void 0)return r[a]=typeof i==`number`||typeof i==`boolean`?i:ArrayBuffer.isView(i)?i.slice():i.clone(),!0;{let e=r[a];if(typeof i==`number`||typeof i==`boolean`){if(e!==i)return r[a]=i,!0}else if(ArrayBuffer.isView(i))return!0;else if(e.equals(i)===!1)return e.copy(i),!0}return!1}function g(e){let t=e.uniforms,n=0;for(let e=0,r=t.length;e<r;e++){let r=Array.isArray(t[e])?t[e]:[t[e]];for(let e=0,t=r.length;e<t;e++){let t=r[e],i=Array.isArray(t.value)?t.value:[t.value];for(let e=0,r=i.length;e<r;e++){let r=i[e],a=_(r),o=n%16,s=o%a.boundary,c=o+s;n+=s,c!==0&&16-c<a.storage&&(n+=16-c),t.__data=new Float32Array(a.storage/Float32Array.BYTES_PER_ELEMENT),t.__offset=n,n+=a.storage}}}let r=n%16;return r>0&&(n+=16-r),e.__size=n,e.__cache={},this}function _(e){let t={boundary:0,storage:0};return typeof e==`number`||typeof e==`boolean`?(t.boundary=4,t.storage=4):e.isVector2?(t.boundary=8,t.storage=8):e.isVector3||e.isColor?(t.boundary=16,t.storage=12):e.isVector4?(t.boundary=16,t.storage=16):e.isMatrix3?(t.boundary=48,t.storage=48):e.isMatrix4?(t.boundary=64,t.storage=64):e.isTexture?V(`WebGLRenderer: Texture samplers can not be part of an uniforms group.`):ArrayBuffer.isView(e)?(t.boundary=16,t.storage=e.byteLength):V(`WebGLRenderer: Unsupported uniform value type.`,e),t}function v(t){let n=t.target;n.removeEventListener(`dispose`,v);let r=o.indexOf(n.__bindingPointIndex);o.splice(r,1),e.deleteBuffer(i[n.id]),delete i[n.id],delete a[n.id]}function y(){for(let t in i)e.deleteBuffer(i[t]);o=[],i={},a={}}return{bind:c,update:l,dispose:y}}var Vc=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]),Hc=null;function Uc(){return Hc===null&&(Hc=new ni(Vc,16,16,j,v),Hc.name=`DFG_LUT`,Hc.minFilter=c,Hc.magFilter=c,Hc.wrapS=r,Hc.wrapT=r,Hc.generateMipmaps=!1,Hc.needsUpdate=!0),Hc}var Wc=class{constructor(e={}){let{canvas:t=Ye(),context:n=null,depth:r=!0,stencil:i=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:s=!0,preserveDrawingBuffer:c=!1,powerPreference:l=`default`,failIfMajorPerformanceCaveat:f=!1,reversedDepthBuffer:p=!1,outputBufferType:h=d}=e;this.isWebGLRenderer=!0;let _;if(n!==null){if(typeof WebGLRenderingContext<`u`&&n instanceof WebGLRenderingContext)throw Error(`THREE.WebGLRenderer: WebGL 1 is not supported since r163.`);_=n.getContextAttributes().alpha}else _=a;let S=h,C=new Set([te,ee,A]),w=new Set([d,g,m,x,y,b]),T=new Uint32Array(4),E=new Int32Array(4),D=new K,O=null,k=null,j=[],M=[],N=null;this.domElement=t,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=0,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let P=this,ne=!1,F=null,re=null,ie=null,ae=null;this._outputColorSpace=Le;let oe=0,se=0,I=null,ce=-1,le=null,ue=new Gt,de=new Gt,fe=null,pe=new X(0),me=0,he=t.width,ge=t.height,_e=1,ve=null,ye=null,be=new Gt(0,0,he,ge),xe=new Gt(0,0,he,ge),Se=!1,Ce=new hi,we=!1,Te=!1,Ee=new Y,De=new K,Oe=new Gt,ke={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},Ae=!1;function je(){return I===null?_e:1}let L=n;function Me(e,n){return t.getContext(e,n)}let Ne,Pe,R,Fe,z,B,Ie,Re,ze,Be,Ve,He,Ue,We,Ke,qe,Je,Xe,Qe,$e,tt,nt,rt;try{let e={alpha:!0,depth:r,stencil:i,antialias:o,premultipliedAlpha:s,preserveDrawingBuffer:c,powerPreference:l,failIfMajorPerformanceCaveat:f};if(`setAttribute`in t&&t.setAttribute(`data-engine`,`three.js r186`),t.addEventListener(`webglcontextlost`,ot,!1),t.addEventListener(`webglcontextrestored`,st,!1),t.addEventListener(`webglcontextcreationerror`,U,!1),L===null){let t=`webgl2`;if(L=Me(t,e),L===null)throw Me(t)?Error(`THREE.WebGLRenderer: Error creating WebGL context with your selected attributes.`):Error(`THREE.WebGLRenderer: Error creating WebGL context.`)}it()}catch(e){throw t.removeEventListener(`webglcontextlost`,ot,!1),t.removeEventListener(`webglcontextrestored`,st,!1),t.removeEventListener(`webglcontextcreationerror`,U,!1),H(`WebGLRenderer: `+e.message),e}function it(){Ne=new so(L),Ne.init(),tt=new Mc(L,Ne),Pe=new Ia(L,Ne,e,tt),R=new Ac(L,Ne),Pe.reversedDepthBuffer&&p&&R.buffers.depth.setReversed(!0),re=L.createFramebuffer(),ie=L.createFramebuffer(),ae=L.createFramebuffer(),Fe=new uo(L),z=new uc,B=new jc(L,Ne,R,z,Pe,tt,Fe),Ie=new oo(P),Re=new Oa(L),nt=new Pa(L,Re),ze=new co(L,Re,Fe,nt),Be=new po(L,ze,Re,nt,Fe),Xe=new fo(L,Pe,B),Ke=new La(z),Ve=new lc(P,Ie,Ne,Pe,nt,Ke),He=new zc(P,z),Ue=new mc,We=new xc(Ne),Je=new Na(P,Ie,R,Be,_,s),qe=new kc(P,Be,Pe),rt=new Bc(L,Fe,Pe,R),Qe=new Fa(L,Ne,Fe),$e=new lo(L,Ne,Fe),Fe.programs=Ve.programs,P.capabilities=Pe,P.extensions=Ne,P.properties=z,P.renderLists=Ue,P.shadowMap=qe,P.state=R,P.info=Fe}S!==1009&&(N=new ho(S,t.width,t.height,o,r,i));let at=new Ic(P,L);this.xr=at,this.getContext=function(){return L},this.getContextAttributes=function(){return L.getContextAttributes()},this.forceContextLoss=function(){let e=Ne.get(`WEBGL_lose_context`);e&&e.loseContext()},this.forceContextRestore=function(){let e=Ne.get(`WEBGL_lose_context`);e&&e.restoreContext()},this.getPixelRatio=function(){return _e},this.setPixelRatio=function(e){e!==void 0&&(_e=e,this.setSize(he,ge,!1))},this.getSize=function(e){return e.set(he,ge)},this.setSize=function(e,n,r=!0){at.isPresenting?V(`WebGLRenderer: Can't change size while VR device is presenting.`):(he=e,ge=n,t.width=Math.floor(e*_e),t.height=Math.floor(n*_e),r===!0&&(t.style.width=e+`px`,t.style.height=n+`px`),N!==null&&N.setSize(t.width,t.height),this.setViewport(0,0,e,n))},this.getDrawingBufferSize=function(e){return e.set(he*_e,ge*_e).floor()},this.setDrawingBufferSize=function(e,n,r){he=e,ge=n,_e=r,t.width=Math.floor(e*r),t.height=Math.floor(n*r),this.setViewport(0,0,e,n)},this.setEffects=function(e){if(S===1009)H(`WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.`);else{if(e){for(let t=0;t<e.length;t++)if(e[t].isOutputPass===!0){V(`WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.`);break}}N.setEffects(e||[])}},this.getCurrentViewport=function(e){return e.copy(ue)},this.getViewport=function(e){return e.copy(be)},this.setViewport=function(e,t,n,r){e.isVector4?be.set(e.x,e.y,e.z,e.w):be.set(e,t,n,r),R.viewport(ue.copy(be).multiplyScalar(_e).round())},this.getScissor=function(e){return e.copy(xe)},this.setScissor=function(e,t,n,r){e.isVector4?xe.set(e.x,e.y,e.z,e.w):xe.set(e,t,n,r),R.scissor(de.copy(xe).multiplyScalar(_e).round())},this.getScissorTest=function(){return Se},this.setScissorTest=function(e){R.setScissorTest(Se=e)},this.setOpaqueSort=function(e){ve=e},this.setTransparentSort=function(e){ye=e},this.getClearColor=function(e){return e.copy(Je.getClearColor())},this.setClearColor=function(){Je.setClearColor(...arguments)},this.getClearAlpha=function(){return Je.getClearAlpha()},this.setClearAlpha=function(){Je.setClearAlpha(...arguments)},this.clear=function(e=!0,t=!0,n=!0){let r=0;if(e){let e=!1;if(I!==null){let t=I.texture.format;e=C.has(t)}if(e){let e=I.texture.type,t=w.has(e),n=Je.getClearColor(),r=Je.getClearAlpha(),i=n.r,a=n.g,o=n.b;t?(T[0]=i,T[1]=a,T[2]=o,T[3]=r,L.clearBufferuiv(L.COLOR,0,T)):(E[0]=i,E[1]=a,E[2]=o,E[3]=r,L.clearBufferiv(L.COLOR,0,E))}else r|=L.COLOR_BUFFER_BIT}t&&(r|=L.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),n&&(r|=L.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),r!==0&&L.clear(r)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(e){e.setRenderer(this),F=e},this.dispose=function(){t.removeEventListener(`webglcontextlost`,ot,!1),t.removeEventListener(`webglcontextrestored`,st,!1),t.removeEventListener(`webglcontextcreationerror`,U,!1),Je.dispose(),Ue.dispose(),We.dispose(),z.dispose(),Ie.dispose(),Be.dispose(),nt.dispose(),rt.dispose(),Ve.dispose(),at.dispose(),at.removeEventListener(`sessionstart`,mt),at.removeEventListener(`sessionend`,ht),gt.stop()};function ot(e){e.preventDefault(),Ze(`WebGLRenderer: Context Lost.`),ne=!0}function st(){Ze(`WebGLRenderer: Context Restored.`),ne=!1;let e=Fe.autoReset,t=qe.enabled,n=qe.autoUpdate,r=qe.needsUpdate,i=qe.type;it(),Fe.autoReset=e,qe.enabled=t,qe.autoUpdate=n,qe.needsUpdate=r,qe.type=i}function U(e){H(`WebGLRenderer: A WebGL context could not be created. Reason: `,e.statusMessage)}function ct(e){let t=e.target;t.removeEventListener(`dispose`,ct),lt(t)}function lt(e){ut(e),z.remove(e)}function ut(e){let t=z.get(e).programs;t!==void 0&&(t.forEach(function(e){Ve.releaseProgram(e)}),e.isShaderMaterial&&Ve.releaseShaderCache(e))}this.renderBufferDirect=function(e,t,n,r,i,a){t===null&&(t=ke);let o=i.isMesh&&i.matrixWorld.determinantAffine()<0,s=Et(e,t,n,r,i);R.setMaterial(r,o);let c=n.index,l=1;if(r.wireframe===!0){if(c=ze.getWireframeAttribute(n),c===void 0)return;l=2}let u=n.drawRange,d=n.attributes.position,f=u.start*l,p=(u.start+u.count)*l;a!==null&&(f=Math.max(f,a.start*l),p=Math.min(p,(a.start+a.count)*l)),c===null?d!=null&&(f=Math.max(f,0),p=Math.min(p,d.count)):(f=Math.max(f,0),p=Math.min(p,c.count));let m=p-f;if(m<0||m===1/0)return;nt.setup(i,r,s,n,c);let h,g=Qe;if(c!==null&&(h=Re.get(c),g=$e,g.setIndex(h)),i.isMesh)r.wireframe===!0?(R.setLineWidth(r.wireframeLinewidth*je()),g.setMode(L.LINES)):g.setMode(L.TRIANGLES);else if(i.isLine){let e=r.linewidth;e===void 0&&(e=1),R.setLineWidth(e*je()),i.isLineSegments?g.setMode(L.LINES):i.isLineLoop?g.setMode(L.LINE_LOOP):g.setMode(L.LINE_STRIP)}else i.isPoints?g.setMode(L.POINTS):i.isSprite&&g.setMode(L.TRIANGLES);if(i.isBatchedMesh){if(Ne.get(`WEBGL_multi_draw`))g.renderMultiDraw(i._multiDrawStarts,i._multiDrawCounts,i._multiDrawCount);else{let e=i._multiDrawStarts,t=i._multiDrawCounts,n=i._multiDrawCount,a=c?Re.get(c).bytesPerElement:1,o=z.get(r).currentProgram.getUniforms();for(let r=0;r<n;r++)o.setValue(L,`_gl_DrawID`,r),g.render(e[r]/a,t[r])}}else if(i.isInstancedMesh)g.renderInstances(f,m,i.count);else if(n.isInstancedBufferGeometry){let e=n._maxInstanceCount===void 0?1/0:n._maxInstanceCount,t=Math.min(n.instanceCount,e);g.renderInstances(f,m,t)}else g.render(f,m)};function dt(e,t,n,r){F!==null&&e.isNodeMaterial&&F.setObject(r,e),we===!0&&Ke.setState(e,n,!1),e.transparent===!0&&e.side===2&&e.forceSinglePass===!1?(e.side=1,e.needsUpdate=!0,St(e,t,r),e.side=0,e.needsUpdate=!0,St(e,t,r),e.side=2):St(e,t,r)}this.compile=function(e,t,n=null){n===null&&(n=e),F!==null&&F.renderStart(e,t,n),k=We.get(n),k.init(t),M.push(k),n.traverseVisible(function(e){e.isLight&&e.layers.test(t.layers)&&(k.pushLight(e),e.castShadow&&k.pushShadow(e))}),e!==n&&e.traverseVisible(function(e){e.isLight&&e.layers.test(t.layers)&&(k.pushLight(e),e.castShadow&&k.pushShadow(e))}),k.setupLights(),F!==null&&F.updateLights(k.state.lightsArray),Te=this.localClippingEnabled,we=Ke.init(this.clippingPlanes,Te),we===!0&&Ke.setGlobalState(this.clippingPlanes,t),F!==null&&qe.render(k.state.shadowsArray,n,t);let r=new Set;return e.traverse(function(e){if(!(e.isMesh||e.isPoints||e.isLine||e.isSprite))return;let i=e.material;if(i){if(Array.isArray(i))for(let a=0;a<i.length;a++){let o=i[a];dt(o,n,t,e),r.add(o)}else dt(i,n,t,e),r.add(i)}}),k=M.pop(),F!==null&&F.renderEnd(),r},this.compileAsync=function(e,t,n=null){let r=this.compile(e,t,n);return new Promise(t=>{function n(){r.forEach(function(e){let t=z.get(e).currentProgram;(t===void 0||t.isReady())&&r.delete(e)}),r.size===0?t(e):setTimeout(n,10)}Ne.get(`KHR_parallel_shader_compile`)===null?setTimeout(n,10):n()})};let ft=null;function pt(e){ft&&ft(e)}function mt(){gt.stop()}function ht(){gt.start()}let gt=new Da;gt.setAnimationLoop(pt),typeof self<`u`&&gt.setContext(self),this.setAnimationLoop=function(e){ft=e,at.setAnimationLoop(e),e===null?gt.stop():gt.start()},at.addEventListener(`sessionstart`,mt),at.addEventListener(`sessionend`,ht),this.render=function(e,t){if(t!==void 0&&t.isCamera!==!0){H(`WebGLRenderer.render: camera is not an instance of THREE.Camera.`);return}if(ne===!0)return;F!==null&&F.renderStart(e,t);let n=at.enabled===!0&&at.isPresenting===!0,r=N!==null&&(I===null||n)&&N.begin(P,I);if(e.matrixWorldAutoUpdate===!0&&e.updateMatrixWorld(),t.parent===null&&t.matrixWorldAutoUpdate===!0&&t.updateMatrixWorld(),at.enabled===!0&&at.isPresenting===!0&&(N===null||N.isCompositing()===!1)&&(at.cameraAutoUpdate===!0&&at.updateCamera(t),t=at.getCamera()),e.isScene===!0&&e.onBeforeRender(P,e,t,I),k=We.get(e,M.length),k.init(t),k.state.textureUnits=B.getTextureUnits(),M.push(k),Ee.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),Ce.setFromProjectionMatrix(Ee,Ge,t.reversedDepth),Te=this.localClippingEnabled,we=Ke.init(this.clippingPlanes,Te),O=Ue.get(e,j.length),O.init(),j.push(O),at.enabled===!0&&at.isPresenting===!0){let e=P.xr.getDepthSensingMesh();e!==null&&_t(e,t,-1/0,P.sortObjects)}_t(e,t,0,P.sortObjects),O.finish(),F!==null&&F.updateLights(k.state.lightsArray),P.sortObjects===!0&&O.sort(ve,ye),Ae=at.enabled===!1||at.isPresenting===!1||at.hasDepthSensing()===!1,Ae&&Je.addToRenderList(O,e),this.info.render.frame++,this.info.autoReset===!0&&this.info.reset(),we===!0&&Ke.beginShadows();let i=k.state.shadowsArray;if(qe.render(i,e,t),we===!0&&Ke.endShadows(),(r&&N.hasRenderPass())===!1){let n=O.opaque,r=O.transmissive;if(k.setupLights(),t.isArrayCamera){let i=t.cameras;if(r.length>0)for(let t=0,a=i.length;t<a;t++){let a=i[t];yt(n,r,e,a)}Ae&&Je.render(e);for(let t=0,n=i.length;t<n;t++){let n=i[t];vt(O,e,n,n.viewport)}}else r.length>0&&yt(n,r,e,t),Ae&&Je.render(e),vt(O,e,t)}I!==null&&se===0&&(B.updateMultisampleRenderTarget(I),B.updateRenderTargetMipmap(I)),r&&N.end(P),e.isScene===!0&&e.onAfterRender(P,e,t),nt.resetDefaultState(),ce=-1,le=null,M.pop(),M.length>0?(k=M[M.length-1],B.setTextureUnits(k.state.textureUnits),we===!0&&Ke.setGlobalState(P.clippingPlanes,k.state.camera)):k=null,j.pop(),O=j.length>0?j[j.length-1]:null,F!==null&&F.renderEnd()};function _t(e,t,n,r){if(e.visible===!1)return;if(e.layers.test(t.layers)){if(e.isGroup)n=e.renderOrder;else if(e.isLOD)e.autoUpdate===!0&&e.update(t);else if(e.isLightProbeGrid)k.pushLightProbeGrid(e);else if(e.isLight)k.pushLight(e),e.castShadow&&k.pushShadow(e);else if(e.isSprite){if(!e.frustumCulled||e.intersectsFrustum(Ce)){r&&Oe.setFromMatrixPosition(e.matrixWorld).applyMatrix4(Ee);let i=Be.update(e),a=e.material;a.visible&&O.push(e,i,a,n,Oe.z,null,t)}}else if((e.isMesh||e.isLine||e.isPoints)&&(!e.frustumCulled||e.intersectsFrustum(Ce))){let i=Be.update(e),a=e.material;if(r&&(e.boundingSphere===void 0?(i.boundingSphere===null&&i.computeBoundingSphere(),Oe.copy(i.boundingSphere.center)):(e.boundingSphere===null&&e.computeBoundingSphere(),Oe.copy(e.boundingSphere.center)),Oe.applyMatrix4(e.matrixWorld).applyMatrix4(Ee)),Array.isArray(a)){let r=i.groups;for(let o=0,s=r.length;o<s;o++){let s=r[o],c=a[s.materialIndex];c&&c.visible&&O.push(e,i,c,n,Oe.z,s,t)}}else a.visible&&O.push(e,i,a,n,Oe.z,null,t)}}let i=e.children;for(let e=0,a=i.length;e<a;e++)_t(i[e],t,n,r)}function vt(e,t,n,r){let{opaque:i,transmissive:a,transparent:o}=e;k.setupLightsView(n),we===!0&&Ke.setGlobalState(P.clippingPlanes,n),r&&R.viewport(ue.copy(r)),i.length>0&&bt(i,t,n),a.length>0&&bt(a,t,n),o.length>0&&bt(o,t,n),R.buffers.depth.setTest(!0),R.buffers.depth.setMask(!0),R.buffers.color.setMask(!0),R.setPolygonOffset(!1)}function yt(e,t,n,r){if((n.isScene===!0?n.overrideMaterial:null)!==null)return;if(k.state.transmissionRenderTarget[r.id]===void 0){let e=Ne.has(`EXT_color_buffer_half_float`)||Ne.has(`EXT_color_buffer_float`);k.state.transmissionRenderTarget[r.id]=new qt(1,1,{generateMipmaps:!0,type:e?v:d,minFilter:u,samples:Math.max(4,Pe.samples),stencilBuffer:i,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:J.workingColorSpace})}let a=k.state.transmissionRenderTarget[r.id],o=r.viewport||ue;a.setSize(o.z*P.transmissionResolutionScale,o.w*P.transmissionResolutionScale);let s=P.getRenderTarget(),c=P.getActiveCubeFace(),l=P.getActiveMipmapLevel();P.setRenderTarget(a),P.getClearColor(pe),me=P.getClearAlpha(),me<1&&P.setClearColor(16777215,.5),P.clear(),Ae&&Je.render(n);let f=P.toneMapping;P.toneMapping=0;let p=r.viewport;if(r.viewport!==void 0&&(r.viewport=void 0),k.setupLightsView(r),we===!0&&Ke.setGlobalState(P.clippingPlanes,r),bt(e,n,r),B.updateMultisampleRenderTarget(a),B.updateRenderTargetMipmap(a),Ne.has(`WEBGL_multisampled_render_to_texture`)===!1){let e=!1;for(let i=0,a=t.length;i<a;i++){let{object:a,geometry:o,material:s,group:c}=t[i];if(s.side===2&&a.layers.test(r.layers)){let t=s.side;s.side=1,s.needsUpdate=!0,xt(a,n,r,o,s,c),s.side=t,s.needsUpdate=!0,e=!0}}e===!0&&(B.updateMultisampleRenderTarget(a),B.updateRenderTargetMipmap(a))}P.setRenderTarget(s,c,l),P.setClearColor(pe,me),p!==void 0&&(r.viewport=p),P.toneMapping=f}function bt(e,t,n){let r=t.isScene===!0?t.overrideMaterial:null;for(let i=0,a=e.length;i<a;i++){let a=e[i],{object:o,geometry:s,group:c}=a,l=a.material;l.allowOverride===!0&&r!==null&&(l=r),o.layers.test(n.layers)&&xt(o,t,n,s,l,c)}}function xt(e,t,n,r,i,a){F!==null&&i.isNodeMaterial&&F.setObject(e,i),e.onBeforeRender(P,t,n,r,i,a),e.modelViewMatrix.multiplyMatrices(n.matrixWorldInverse,e.matrixWorld),e.normalMatrix.getNormalMatrix(e.modelViewMatrix),i.onBeforeRender(P,t,n,r,e,a),i.transparent===!0&&i.side===2&&i.forceSinglePass===!1?(i.side=1,i.needsUpdate=!0,P.renderBufferDirect(n,t,r,i,e,a),i.side=0,i.needsUpdate=!0,P.renderBufferDirect(n,t,r,i,e,a),i.side=2):P.renderBufferDirect(n,t,r,i,e,a),e.onAfterRender(P,t,n,r,i,a)}function St(e,t,n){t.isScene!==!0&&(t=ke);let r=z.get(e),i=k.state.lights,a=k.state.shadowsArray,o=i.state.version,s=Ve.getParameters(e,i.state,a,t,n,k.state.lightProbeGridArray),c=Ve.getProgramCacheKey(s),l=r.programs;r.environment=e.isMeshStandardMaterial||e.isMeshLambertMaterial||e.isMeshPhongMaterial?t.environment:null,r.fog=t.fog;let u=e.isMeshStandardMaterial||e.isMeshLambertMaterial&&!e.envMap||e.isMeshPhongMaterial&&!e.envMap;r.envMap=Ie.get(e.envMap||r.environment,u),r.envMapRotation=r.environment!==null&&e.envMap===null?t.environmentRotation:e.envMapRotation,l===void 0&&(e.addEventListener(`dispose`,ct),l=new Map,r.programs=l);let d=l.get(c);if(d!==void 0){if(r.currentProgram===d&&r.lightsStateVersion===o)return wt(e,s),d}else s.uniforms=Ve.getUniforms(e),F!==null&&e.isNodeMaterial&&F.build(e,n,s),e.onBeforeCompile(s,P),d=Ve.acquireProgram(s,c),l.set(c,d),r.uniforms=s.uniforms;let f=r.uniforms;return(!e.isShaderMaterial&&!e.isRawShaderMaterial||e.clipping===!0)&&(f.clippingPlanes=Ke.uniform),wt(e,s),r.needsLights=Dt(e),r.lightsStateVersion=o,r.needsLights&&(f.ambientLightColor.value=i.state.ambient,f.lightProbe.value=i.state.probe,f.sunLights.value=i.state.sun,f.sunLightShadows.value=i.state.sunShadow,f.directionalLights.value=i.state.directional,f.directionalLightShadows.value=i.state.directionalShadow,f.spotLights.value=i.state.spot,f.spotLightShadows.value=i.state.spotShadow,f.rectAreaLights.value=i.state.rectArea,f.ltc_1.value=i.state.rectAreaLTC1,f.ltc_2.value=i.state.rectAreaLTC2,f.pointLights.value=i.state.point,f.pointLightShadows.value=i.state.pointShadow,f.hemisphereLights.value=i.state.hemi,f.sunShadowMatrix.value=i.state.sunShadowMatrix,f.sunShadowCascade.value=i.state.sunShadowCascade,f.directionalShadowMatrix.value=i.state.directionalShadowMatrix,f.spotLightMatrix.value=i.state.spotLightMatrix,f.spotLightMap.value=i.state.spotLightMap,f.pointShadowMatrix.value=i.state.pointShadowMatrix),r.lightProbeGrid=k.state.lightProbeGridArray.length>0,r.currentProgram=d,r.uniformsList=null,d}function Ct(e){if(e.uniformsList===null){let t=e.currentProgram.getUniforms();e.uniformsList=Ss.seqWithValue(t.seq,e.uniforms)}return e.uniformsList}function wt(e,t){let n=z.get(e);n.outputColorSpace=t.outputColorSpace,n.batching=t.batching,n.batchingColor=t.batchingColor,n.instancing=t.instancing,n.instancingColor=t.instancingColor,n.instancingMorph=t.instancingMorph,n.skinning=t.skinning,n.morphTargets=t.morphTargets,n.morphNormals=t.morphNormals,n.morphColors=t.morphColors,n.morphTargetsCount=t.morphTargetsCount,n.numClippingPlanes=t.numClippingPlanes,n.numIntersection=t.numClipIntersection,n.vertexAlphas=t.vertexAlphas,n.vertexTangents=t.vertexTangents,n.toneMapping=t.toneMapping}function Tt(e,t){if(e.length===0)return null;if(e.length===1)return e[0].texture===null?null:e[0];D.setFromMatrixPosition(t.matrixWorld);for(let t=0,n=e.length;t<n;t++){let n=e[t];if(n.texture!==null&&n.boundingBox.containsPoint(D))return n}return null}function Et(e,t,n,r,i){t.isScene!==!0&&(t=ke),B.resetTextureUnits();let a=t.fog,o=r.isMeshStandardMaterial||r.isMeshLambertMaterial||r.isMeshPhongMaterial?t.environment:null,s=I===null?P.outputColorSpace:I.isXRRenderTarget===!0?I.texture.colorSpace:J.workingColorSpace,c=r.isMeshStandardMaterial||r.isMeshLambertMaterial&&!r.envMap||r.isMeshPhongMaterial&&!r.envMap,l=Ie.get(r.envMap||o,c),u=r.vertexColors===!0&&!!n.attributes.color&&n.attributes.color.itemSize===4,d=!!n.attributes.tangent&&(!!r.normalMap||r.anisotropy>0),f=!!n.morphAttributes.position,p=!!n.morphAttributes.normal,m=!!n.morphAttributes.color,h=0;r.toneMapped&&(I===null||I.isXRRenderTarget===!0)&&(h=P.toneMapping);let g=n.morphAttributes.position||n.morphAttributes.normal||n.morphAttributes.color,_=g===void 0?0:g.length,v=z.get(r),y=k.state.lights;if(we===!0&&(Te===!0||e!==le)){let t=e===le&&r.id===ce;Ke.setState(r,e,t)}let b=!1;r.version===v.__version?v.needsLights&&v.lightsStateVersion!==y.state.version?b=!0:v.outputColorSpace===s?i.isBatchedMesh&&v.batching===!1||!i.isBatchedMesh&&v.batching===!0||i.isBatchedMesh&&v.batchingColor===!0&&i._colorsTexture===null||i.isBatchedMesh&&v.batchingColor===!1&&i._colorsTexture!==null||i.isInstancedMesh&&v.instancing===!1||!i.isInstancedMesh&&v.instancing===!0||i.isSkinnedMesh&&v.skinning===!1||!i.isSkinnedMesh&&v.skinning===!0||i.isInstancedMesh&&v.instancingColor===!0&&i.instanceColor===null||i.isInstancedMesh&&v.instancingColor===!1&&i.instanceColor!==null||i.isInstancedMesh&&v.instancingMorph===!0&&i.morphTexture===null||i.isInstancedMesh&&v.instancingMorph===!1&&i.morphTexture!==null?b=!0:v.envMap===l?r.fog===!0&&v.fog!==a||v.numClippingPlanes!==void 0&&(v.numClippingPlanes!==Ke.numPlanes||v.numIntersection!==Ke.numIntersection)?b=!0:v.vertexAlphas===u&&v.vertexTangents===d&&v.morphTargets===f&&v.morphNormals===p&&v.morphColors===m&&v.toneMapping===h&&v.morphTargetsCount===_?!!v.lightProbeGrid!=k.state.lightProbeGridArray.length>0&&(b=!0):b=!0:b=!0:b=!0:(b=!0,v.__version=r.version);let x=v.currentProgram;b===!0&&(x=St(r,t,i),F&&r.isNodeMaterial&&F.onUpdateProgram(r,x,v));let S=!1,C=!1,w=!1,T=x.getUniforms(),E=v.uniforms;if(R.useProgram(x.program)&&(S=!0,C=!0,w=!0),r.id!==ce&&(ce=r.id,C=!0),v.needsLights){let e=Tt(k.state.lightProbeGridArray,i);v.lightProbeGrid!==e&&(v.lightProbeGrid=e,C=!0)}if(S||le!==e){R.buffers.depth.getReversed()&&e.reversedDepth!==!0&&(e._reversedDepth=!0,e.updateProjectionMatrix()),T.setValue(L,`projectionMatrix`,e.projectionMatrix),T.setValue(L,`viewMatrix`,e.matrixWorldInverse);let t=T.map.cameraPosition;t!==void 0&&t.setValue(L,De.setFromMatrixPosition(e.matrixWorld)),Pe.logarithmicDepthBuffer&&T.setValue(L,`logDepthBufFC`,2/(Math.log(e.far+1)/Math.LN2)),(r.isMeshPhongMaterial||r.isMeshToonMaterial||r.isMeshLambertMaterial||r.isMeshBasicMaterial||r.isMeshStandardMaterial||r.isShaderMaterial)&&T.setValue(L,`isOrthographic`,e.isOrthographicCamera===!0),le!==e&&(le=e,C=!0,w=!0)}if(v.needsLights&&(y.state.sunShadowMap.length>0&&T.setValue(L,`sunShadowMap`,y.state.sunShadowMap,B),y.state.directionalShadowMap.length>0&&T.setValue(L,`directionalShadowMap`,y.state.directionalShadowMap,B),y.state.spotShadowMap.length>0&&T.setValue(L,`spotShadowMap`,y.state.spotShadowMap,B),y.state.pointShadowMap.length>0&&T.setValue(L,`pointShadowMap`,y.state.pointShadowMap,B)),i.isSkinnedMesh){T.setOptional(L,i,`bindMatrix`),T.setOptional(L,i,`bindMatrixInverse`);let e=i.skeleton;e&&(e.boneTexture===null&&e.computeBoneTexture(),T.setValue(L,`boneTexture`,e.boneTexture,B))}i.isBatchedMesh&&(T.setOptional(L,i,`batchingTexture`),T.setValue(L,`batchingTexture`,i._matricesTexture,B),T.setOptional(L,i,`batchingIdTexture`),T.setValue(L,`batchingIdTexture`,i._indirectTexture,B),T.setOptional(L,i,`batchingColorTexture`),i._colorsTexture!==null&&T.setValue(L,`batchingColorTexture`,i._colorsTexture,B));let D=n.morphAttributes;if((D.position!==void 0||D.normal!==void 0||D.color!==void 0)&&Xe.update(i,n,x),(C||v.receiveShadow!==i.receiveShadow)&&(v.receiveShadow=i.receiveShadow,T.setValue(L,`receiveShadow`,i.receiveShadow)),(r.isMeshStandardMaterial||r.isMeshLambertMaterial||r.isMeshPhongMaterial)&&r.envMap===null&&t.environment!==null&&(E.envMapIntensity.value=t.environmentIntensity),E.dfgLUT!==void 0&&(E.dfgLUT.value=Uc()),C){if(T.setValue(L,`toneMappingExposure`,P.toneMappingExposure),v.needsLights&&W(E,w),a&&r.fog===!0&&He.refreshFogUniforms(E,a),He.refreshMaterialUniforms(E,r,_e,ge,k.state.transmissionRenderTarget[e.id]),v.needsLights&&v.lightProbeGrid){let e=v.lightProbeGrid;E.probesSH.value=e.texture,E.probesMin.value.copy(e.boundingBox.min),E.probesMax.value.copy(e.boundingBox.max),E.probesResolution.value.copy(e.resolution)}Ss.upload(L,Ct(v),E,B)}if(r.isShaderMaterial&&r.uniformsNeedUpdate===!0&&(Ss.upload(L,Ct(v),E,B),r.uniformsNeedUpdate=!1),r.isSpriteMaterial&&T.setValue(L,`center`,i.center),T.setValue(L,`modelViewMatrix`,i.modelViewMatrix),T.setValue(L,`normalMatrix`,i.normalMatrix),T.setValue(L,`modelMatrix`,i.matrixWorld),r.uniformsGroups!==void 0){let e=r.uniformsGroups;for(let t=0,n=e.length;t<n;t++){let n=e[t];rt.update(n,x),rt.bind(n,x)}}return x}function W(e,t){e.ambientLightColor.needsUpdate=t,e.lightProbe.needsUpdate=t,e.sunLights.needsUpdate=t,e.sunLightShadows.needsUpdate=t,e.directionalLights.needsUpdate=t,e.directionalLightShadows.needsUpdate=t,e.pointLights.needsUpdate=t,e.pointLightShadows.needsUpdate=t,e.spotLights.needsUpdate=t,e.spotLightShadows.needsUpdate=t,e.rectAreaLights.needsUpdate=t,e.hemisphereLights.needsUpdate=t}function Dt(e){return e.isMeshLambertMaterial||e.isMeshToonMaterial||e.isMeshPhongMaterial||e.isMeshStandardMaterial||e.isShadowMaterial||e.isShaderMaterial&&e.lights===!0}this.getActiveCubeFace=function(){return oe},this.getActiveMipmapLevel=function(){return se},this.getRenderTarget=function(){return I},this.setRenderTargetTextures=function(e,t,n){let r=z.get(e);r.__autoAllocateDepthBuffer=e.resolveDepthBuffer===!1,r.__autoAllocateDepthBuffer===!1&&(r.__useRenderToTexture=!1),z.get(e.texture).__webglTexture=t,z.get(e.depthTexture).__webglTexture=r.__autoAllocateDepthBuffer?void 0:n,r.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(e,t){let n=z.get(e);n.__webglFramebuffer=t,n.__useDefaultFramebuffer=t===void 0},this.setRenderTarget=function(e,t=0,n=0){I=e,oe=t,se=n;let r=null,i=!1,a=!1;if(e){let o=z.get(e);if(o.__useDefaultFramebuffer!==void 0){R.bindFramebuffer(L.FRAMEBUFFER,o.__webglFramebuffer),ue.copy(e.viewport),de.copy(e.scissor),fe=e.scissorTest,R.viewport(ue),R.scissor(de),R.setScissorTest(fe),ce=-1;return}if(o.__webglFramebuffer===void 0)B.setupRenderTarget(e);else if(o.__hasExternalTextures)B.rebindTextures(e,z.get(e.texture).__webglTexture,z.get(e.depthTexture).__webglTexture);else if(e.depthBuffer){let t=e.depthTexture;if(o.__boundDepthTexture!==t){if(t!==null&&z.has(t)&&(e.width!==t.image.width||e.height!==t.image.height))throw Error(`THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.`);B.setupDepthRenderbuffer(e)}}let s=e.texture;(s.isData3DTexture||s.isDataArrayTexture||s.isCompressedArrayTexture)&&(a=!0);let c=z.get(e).__webglFramebuffer;e.isWebGLCubeRenderTarget?(r=Array.isArray(c[t])?c[t][n]:c[t],i=!0):r=e.samples>0&&B.useMultisampledRTT(e)===!1?z.get(e).__webglMultisampledFramebuffer:Array.isArray(c)?c[n]:c,ue.copy(e.viewport),de.copy(e.scissor),fe=e.scissorTest}else ue.copy(be).multiplyScalar(_e).floor(),de.copy(xe).multiplyScalar(_e).floor(),fe=Se;if(n!==0&&(r=re),R.bindFramebuffer(L.FRAMEBUFFER,r)&&R.drawBuffers(e,r),R.viewport(ue),R.scissor(de),R.setScissorTest(fe),i){let r=z.get(e.texture);L.framebufferTexture2D(L.FRAMEBUFFER,L.COLOR_ATTACHMENT0,L.TEXTURE_CUBE_MAP_POSITIVE_X+t,r.__webglTexture,n)}else if(a){let r=t;for(let t=0;t<e.textures.length;t++){let i=z.get(e.textures[t]);L.framebufferTextureLayer(L.FRAMEBUFFER,L.COLOR_ATTACHMENT0+t,i.__webglTexture,n,r)}}else if(e!==null&&n!==0){let t=z.get(e.texture);L.framebufferTexture2D(L.FRAMEBUFFER,L.COLOR_ATTACHMENT0,L.TEXTURE_2D,t.__webglTexture,n)}ce=-1};function G(e){let t=z.get(e);return(t.__readFormat!==e.format||t.__readType!==e.type)&&(t.__readFormat=e.format,t.__readType=e.type,t.__formatReadable=Pe.textureFormatReadable(e.format),t.__typeReadable=Pe.textureTypeReadable(e.type)),t}this.readRenderTargetPixels=function(e,t,n,r,i,a,o,s=0){if(!(e&&e.isWebGLRenderTarget)){H(`WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.`);return}let c=z.get(e).__webglFramebuffer;if(e.isWebGLCubeRenderTarget&&o!==void 0&&(c=c[o]),c){R.bindFramebuffer(L.FRAMEBUFFER,c);try{let o=e.textures[s],c=o.format,l=o.type;e.textures.length>1&&L.readBuffer(L.COLOR_ATTACHMENT0+s);let u=G(o);if(u.__formatReadable===!1){H(`WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.`);return}if(u.__typeReadable===!1){H(`WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.`);return}t>=0&&t<=e.width-r&&n>=0&&n<=e.height-i&&L.readPixels(t,n,r,i,tt.convert(c),tt.convert(l),a)}finally{let e=I===null?null:z.get(I).__webglFramebuffer;R.bindFramebuffer(L.FRAMEBUFFER,e)}}},this.readRenderTargetPixelsAsync=async function(e,t,n,r,i,a,o,s=0){if(!(e&&e.isWebGLRenderTarget))throw Error(`THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.`);let c=z.get(e).__webglFramebuffer;if(e.isWebGLCubeRenderTarget&&o!==void 0&&(c=c[o]),c){if(t>=0&&t<=e.width-r&&n>=0&&n<=e.height-i){R.bindFramebuffer(L.FRAMEBUFFER,c);let o=e.textures[s],l=o.format,u=o.type;e.textures.length>1&&L.readBuffer(L.COLOR_ATTACHMENT0+s);let d=G(o);if(d.__formatReadable===!1)throw Error(`THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.`);if(d.__typeReadable===!1)throw Error(`THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.`);let f=L.createBuffer();L.bindBuffer(L.PIXEL_PACK_BUFFER,f),L.bufferData(L.PIXEL_PACK_BUFFER,a.byteLength,L.STREAM_READ),L.readPixels(t,n,r,i,tt.convert(l),tt.convert(u),0),L.bindBuffer(L.PIXEL_PACK_BUFFER,null);let p=I===null?null:z.get(I).__webglFramebuffer;R.bindFramebuffer(L.FRAMEBUFFER,p);let m=L.fenceSync(L.SYNC_GPU_COMMANDS_COMPLETE,0);return L.flush(),await et(L,m,4),L.bindBuffer(L.PIXEL_PACK_BUFFER,f),L.getBufferSubData(L.PIXEL_PACK_BUFFER,0,a),L.bindBuffer(L.PIXEL_PACK_BUFFER,null),L.deleteBuffer(f),L.deleteSync(m),a}throw Error(`THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.`)}},this.copyFramebufferToTexture=function(e,t=null,n=0){let r=2**-n,i=Math.floor(e.image.width*r),a=Math.floor(e.image.height*r),o=t===null?0:t.x,s=t===null?0:t.y;B.setTexture2D(e,0),L.copyTexSubImage2D(L.TEXTURE_2D,n,0,0,o,s,i,a),R.unbindTexture()},this.copyTextureToTexture=function(e,t,n=null,r=null,i=0,a=0){let o,s,c,l,u,d,f,p,m,h=e.isCompressedTexture?e.mipmaps[a]:e.image;if(n!==null)o=n.max.x-n.min.x,s=n.max.y-n.min.y,c=n.isBox3?n.max.z-n.min.z:1,l=n.min.x,u=n.min.y,d=n.isBox3?n.min.z:0;else{let t=2**-i;o=Math.floor(h.width*t),s=Math.floor(h.height*t),c=e.isDataArrayTexture?h.depth:e.isData3DTexture?Math.floor(h.depth*t):1,l=0,u=0,d=0}r===null?(f=0,p=0,m=0):(f=r.x,p=r.y,m=r.z);let g=tt.convert(t.format),_=tt.convert(t.type),v;t.isData3DTexture?(B.setTexture3D(t,0),v=L.TEXTURE_3D):t.isDataArrayTexture||t.isCompressedArrayTexture?(B.setTexture2DArray(t,0),v=L.TEXTURE_2D_ARRAY):(B.setTexture2D(t,0),v=L.TEXTURE_2D),R.activeTexture(L.TEXTURE0),R.pixelStorei(L.UNPACK_FLIP_Y_WEBGL,t.flipY),R.pixelStorei(L.UNPACK_PREMULTIPLY_ALPHA_WEBGL,t.premultiplyAlpha),R.pixelStorei(L.UNPACK_ALIGNMENT,t.unpackAlignment);let y=R.getParameter(L.UNPACK_ROW_LENGTH),b=R.getParameter(L.UNPACK_IMAGE_HEIGHT),x=R.getParameter(L.UNPACK_SKIP_PIXELS),S=R.getParameter(L.UNPACK_SKIP_ROWS),C=R.getParameter(L.UNPACK_SKIP_IMAGES);R.pixelStorei(L.UNPACK_ROW_LENGTH,h.width),R.pixelStorei(L.UNPACK_IMAGE_HEIGHT,h.height),R.pixelStorei(L.UNPACK_SKIP_PIXELS,l),R.pixelStorei(L.UNPACK_SKIP_ROWS,u),R.pixelStorei(L.UNPACK_SKIP_IMAGES,d);let w=e.isDataArrayTexture||e.isData3DTexture,T=t.isDataArrayTexture||t.isData3DTexture;if(e.isDepthTexture){let n=z.get(e),r=z.get(t),h=z.get(n.__renderTarget),g=z.get(r.__renderTarget);R.bindFramebuffer(L.READ_FRAMEBUFFER,h.__webglFramebuffer),R.bindFramebuffer(L.DRAW_FRAMEBUFFER,g.__webglFramebuffer);for(let n=0;n<c;n++)w&&(L.framebufferTextureLayer(L.READ_FRAMEBUFFER,L.COLOR_ATTACHMENT0,z.get(e).__webglTexture,i,d+n),L.framebufferTextureLayer(L.DRAW_FRAMEBUFFER,L.COLOR_ATTACHMENT0,z.get(t).__webglTexture,a,m+n)),L.blitFramebuffer(l,u,o,s,f,p,o,s,L.DEPTH_BUFFER_BIT,L.NEAREST);R.bindFramebuffer(L.READ_FRAMEBUFFER,null),R.bindFramebuffer(L.DRAW_FRAMEBUFFER,null)}else if(i!==0||e.isRenderTargetTexture||z.has(e)){let n=z.get(e),r=z.get(t);R.bindFramebuffer(L.READ_FRAMEBUFFER,ie),R.bindFramebuffer(L.DRAW_FRAMEBUFFER,ae);for(let e=0;e<c;e++)w?L.framebufferTextureLayer(L.READ_FRAMEBUFFER,L.COLOR_ATTACHMENT0,n.__webglTexture,i,d+e):L.framebufferTexture2D(L.READ_FRAMEBUFFER,L.COLOR_ATTACHMENT0,L.TEXTURE_2D,n.__webglTexture,i),T?L.framebufferTextureLayer(L.DRAW_FRAMEBUFFER,L.COLOR_ATTACHMENT0,r.__webglTexture,a,m+e):L.framebufferTexture2D(L.DRAW_FRAMEBUFFER,L.COLOR_ATTACHMENT0,L.TEXTURE_2D,r.__webglTexture,a),i===0?T?L.copyTexSubImage3D(v,a,f,p,m+e,l,u,o,s):L.copyTexSubImage2D(v,a,f,p,l,u,o,s):L.blitFramebuffer(l,u,o,s,f,p,o,s,L.COLOR_BUFFER_BIT,L.NEAREST);R.bindFramebuffer(L.READ_FRAMEBUFFER,null),R.bindFramebuffer(L.DRAW_FRAMEBUFFER,null)}else T?e.isDataTexture||e.isData3DTexture?L.texSubImage3D(v,a,f,p,m,o,s,c,g,_,h.data):t.isCompressedArrayTexture?L.compressedTexSubImage3D(v,a,f,p,m,o,s,c,g,h.data):L.texSubImage3D(v,a,f,p,m,o,s,c,g,_,h):e.isDataTexture?L.texSubImage2D(L.TEXTURE_2D,a,f,p,o,s,g,_,h.data):e.isCompressedTexture?L.compressedTexSubImage2D(L.TEXTURE_2D,a,f,p,h.width,h.height,g,h.data):L.texSubImage2D(L.TEXTURE_2D,a,f,p,o,s,g,_,h);R.pixelStorei(L.UNPACK_ROW_LENGTH,y),R.pixelStorei(L.UNPACK_IMAGE_HEIGHT,b),R.pixelStorei(L.UNPACK_SKIP_PIXELS,x),R.pixelStorei(L.UNPACK_SKIP_ROWS,S),R.pixelStorei(L.UNPACK_SKIP_IMAGES,C),a===0&&t.generateMipmaps&&L.generateMipmap(v),R.unbindTexture()},this.initRenderTarget=function(e){z.get(e).__webglFramebuffer===void 0&&B.setupRenderTarget(e)},this.initTexture=function(e){e.isCubeTexture?B.setTextureCube(e,0):e.isData3DTexture?B.setTexture3D(e,0):e.isDataArrayTexture||e.isCompressedArrayTexture?B.setTexture2DArray(e,0):B.setTexture2D(e,0),R.unbindTexture()},this.resetState=function(){oe=0,se=0,I=null,R.reset(),nt.reset()},typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`observe`,{detail:this}))}get coordinateSystem(){return Ge}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorSpace=J._getDrawingBufferColorSpace(e),t.unpackColorSpace=J._getUnpackColorSpace()}};function Gc(e,t,n,r,i,a,o=3e4,s){let c=null,l=null,u,d=!1,f=()=>{},p=()=>{u!==void 0&&clearTimeout(u),l&&e.deleteSync(l),c&&e.deleteBuffer(c),l=null,c=null};return{promise:new Promise((m,h)=>{f=h;let g=e=>{d||(d=!0,p(),h(e instanceof Error?e:Error(String(e))))};try{if(s&&s.length!==i*a*4)throw Error(`Avatar readback destination has the wrong length`);if(c=e.createBuffer(),!c)throw Error(`Avatar readback buffer allocation failed`);let f=e.getParameter(e.READ_FRAMEBUFFER_BINDING),h=e.getParameter(e.PIXEL_PACK_BUFFER_BINDING);try{e.bindFramebuffer(e.READ_FRAMEBUFFER,t),e.bindBuffer(e.PIXEL_PACK_BUFFER,c),e.bufferData(e.PIXEL_PACK_BUFFER,i*a*4,e.STREAM_READ),e.readPixels(n,r,i,a,e.RGBA,e.UNSIGNED_BYTE,0)}finally{e.bindBuffer(e.PIXEL_PACK_BUFFER,h),e.bindFramebuffer(e.READ_FRAMEBUFFER,f)}if(l=e.fenceSync(e.SYNC_GPU_COMMANDS_COMPLETE,0),!l)throw Error(`Avatar readback fence allocation failed`);e.flush();let _=performance.now(),v=()=>{if(!d)try{if(e.isContextLost())throw Error(`Avatar readback context lost`);let t=e.clientWaitSync(l,0,0);if(t===e.WAIT_FAILED)throw Error(`Avatar readback fence failed`);if(t===e.TIMEOUT_EXPIRED){if(performance.now()-_>=o)throw Error(`Avatar readback fence timed out`);u=setTimeout(v,4);return}let n=s??new Uint8Array(i*a*4),r=e.getParameter(e.PIXEL_PACK_BUFFER_BINDING);try{e.bindBuffer(e.PIXEL_PACK_BUFFER,c),e.getBufferSubData(e.PIXEL_PACK_BUFFER,0,n)}finally{e.bindBuffer(e.PIXEL_PACK_BUFFER,r)}d=!0,p(),m(n)}catch(e){g(e)}};u=setTimeout(v,4)}catch(e){g(e)}}),cancel(){d||(d=!0,p(),f(Error(`Avatar readback cancelled`)))}}}function Kc(e){let t=e.r*.2126+e.g*.7152+e.b*.0722,n=Math.min(.68,Math.max(.21,t));if(n===t)return;let r=+(n>t),i=(n-t)/(r-t);e.r+=(r-e.r)*i,e.g+=(r-e.g)*i,e.b+=(r-e.b)*i}var qc=class{constructor(){this.samples=new WeakMap,this.frame=0,this.evaluations=0,this.copies=0}beginFrame(){this.frame++,this.evaluations=this.copies=0}register(e,t){let n=this.samples.get(e);n?n.frame===this.frame?n.time===t&&n.count++:(n.frame=this.frame,n.time=t,n.count=1):(n={frame:this.frame,time:t,count:1,sampledFrame:-1},this.samples.set(e,n))}sample(e,t,n){let r=this.samples.get(e);if(!r||r.frame!==this.frame||r.time!==t||r.count<2){this.evaluations++,e.sample(t,n);return}r.sampledFrame!==this.frame&&(r.pose??=e.createPose(),e.sample(t,r.pose),r.sampledFrame=this.frame,this.evaluations++);let i=r.pose;if(i.length!==n.length)throw Error(`Invalid shared motion output`);for(let e=0;e<i.length;e++){let t=i[e],r=n[e];if(t.id!==r.id)throw Error(`Shared motion pose identities differ`);r.world.copy(t.world),r.normalMatrix.copy(t.normalMatrix);for(let e in t.fields){let n=t.fields[e],i=r.fields[e];for(let e=0;e<n.length;e++)i[e]=n[e]}}this.copies++}},Jc=new URL(`../assets/packed-motion-alfred-base-qGBsrbI9.bin`,import.meta.url).href,Yc=new URL(`../assets/packed-motion-blue_beret-base-BMmnGSRf.bin`,import.meta.url).href,Xc=new URL(`../assets/packed-motion-blue_spectacles-base-svr89Z5G.bin`,import.meta.url).href,Zc=new URL(`../assets/packed-motion-coral_monocle-base-BZF70fks.bin`,import.meta.url).href,Qc=new URL(`../assets/packed-motion-gus-base-DMFGsmOw.bin`,import.meta.url).href,$c=new URL(`../assets/packed-motion-lime_frog-base-1lxQ44Sn.bin`,import.meta.url).href,el=new URL(`../assets/packed-motion-lime_headphones-base-CnmCxRo5.bin`,import.meta.url).href,tl=new URL(`../assets/packed-motion-purple_heart-base-C9b2erxe.bin`,import.meta.url).href,nl=new URL(`../assets/packed-motion-alfred-work-BMHfS_E-.bin`,import.meta.url).href,rl=new URL(`../assets/packed-motion-blue_beret-work-yt3jMbTu.bin`,import.meta.url).href,il=new URL(`../assets/packed-motion-blue_spectacles-work-CBlZ4diH.bin`,import.meta.url).href,al=new URL(`../assets/packed-motion-coral_monocle-work-5qh-uRFS.bin`,import.meta.url).href,ol=new URL(`../assets/packed-motion-gus-work-DSbmf5pQ.bin`,import.meta.url).href,sl=new URL(`../assets/packed-motion-lime_frog-work-DyYXIUKb.bin`,import.meta.url).href,cl=new URL(`../assets/packed-motion-lime_headphones-work-Cd4C4xxG.bin`,import.meta.url).href,ll=new URL(`../assets/packed-motion-purple_heart-work-232eZJU3.bin`,import.meta.url).href,ul=Math.fround;function dl(e){let t=Math.imul(e^e>>>16,2146121005);return t=Math.imul(t^t>>>15,-2073254261),(t>>>24^t>>>8)/16777216}function fl(e,t){return t?(e=ul(e),ul(ul(ul(e*e)*e)*ul(ul(e*ul(ul(e*6)-15))+10))):e*e*e*(e*(e*6-15)+10)}var pl=class{constructor(e=17){if(!Number.isInteger(e)||e<0||e>4294967295)throw Error(`Breathing seed must be an unsigned 32-bit integer`);this.period=5.2+.8*dl(e^599040221),this.phase=dl(e)}sample(e,t,n=!0){if(!Number.isFinite(e)||e<0)throw Error(`Invalid breathing time`);let r=(e/this.period+this.phase)%1,i=r<.4?fl(r/.4,n)-.5:r<.47?.5:r<.91?.5-fl((r-.47)/.44,n):-.5;if(n)i=ul(i),t.y=ul(i*ul(.002)),t.scaleY=ul(ul(i*ul(.006))+1),t.scaleXZ=ul(1/ul(Math.sqrt(t.scaleY)));else{t.y=ul(i*.002);let e=i*.006+1;t.scaleY=ul(e),t.scaleXZ=ul(1/Math.sqrt(e))}return t}};function ml(e,t,n,r,i,a){if(`value`in e)for(let r=0;r<t;r++)n[r]=e.value[r];else for(let o=0;o<t;o++){let s=e.samples[r*t+o],c=e.samples[i*t+o];n[o]=a===0?s:a===1?c:s+(c-s)*a}}function hl(e,t){if(e===t)return!0;if(!e||!t||`value`in e!=`value`in t)return!1;let n=`value`in e?e.value:e.samples,r=`value`in t?t.value:t.samples;return n===r||n.length===r.length&&n.every((e,t)=>Object.is(e,r[t]))}var gl=class{constructor(e){if(this.clip=e,this.position=new K,this.rotation=new Ot,this.nextRotation=new Ot,this.scale=new K,this.scratch=[0,0,0,0],this.shear=[0,0,0],this.normalCorrection=Array(9).fill(0),!Number.isFinite(e.duration)||e.duration<=0||e.times.length<2||e.times[0]!==0||e.times[e.times.length-1]!==e.duration)throw Error(`Invalid authored motion duration`);for(let t=1;t<e.times.length;t++)if(e.times[t]<=e.times[t-1])throw Error(`Motion keyframes must increase`);if(!e.times.every(Number.isFinite))throw Error(`Invalid motion timestamps`);this.fieldEntries=e.parts.map(e=>Object.entries(e.fields)),this.transformSources=e.parts.map((t,n)=>{for(let r=0;r<n;r++){let n=e.parts[r];if(hl(t.translation,n.translation)&&hl(t.rotation,n.rotation)&&hl(t.scale,n.scale)&&hl(t.shear,n.shear)&&hl(t.normalCorrection,n.normalCorrection))return r}return n});let t=new Set;for(let n of e.parts){if(t.has(n.id))throw Error(`Duplicate motion part`);t.add(n.id);for(let[t,r]of[[n.translation,3],[n.rotation,4],[n.scale,3],...n.shear?[[n.shear,3]]:[],...n.normalCorrection?[[n.normalCorrection,9]]:[],...Object.values(n.fields).map(e=>[e,4])]){let n=`value`in t?t.value:t.samples;if(n.length!==r*(`value`in t?1:e.times.length)||!n.every(Number.isFinite))throw Error(`Invalid motion channel`)}let r=`value`in n.scale?n.scale.value:n.scale.samples;for(let e=0;e<r.length;e++){if(Math.abs(r[e])<=1e-10)throw Error(`Singular motion scale`);if(Math.sign(r[e])!==Math.sign(r[e%3]))throw Error(`Motion scale crosses a singularity`);if(n.shear&&e%3<2&&r[e]<0)throw Error(`Affine QR requires positive first two scales`)}let i=`value`in n.rotation?n.rotation.value:n.rotation.samples;for(let e=0;e<i.length;e+=4)if(Math.abs(Math.hypot(...i.slice(e,e+4))-1)>1e-6)throw Error(`Motion rotation must be a unit quaternion`)}}createPose(){return this.clip.parts.map(e=>({id:e.id,world:new Y,normalMatrix:new Y,fields:Object.fromEntries(Object.keys(e.fields).map(e=>[e,[0,0,0,0]]))}))}sample(e,t){if(!Number.isFinite(e)||t.length!==this.clip.parts.length)throw Error(`Invalid motion sampling input`);let{clip:n}=this,r=n.loop?(e%n.duration+n.duration)%n.duration:Math.max(0,Math.min(e,n.duration)),i=0,a=n.times.length-1;for(;a-i>1;){let e=i+a>>>1;n.times[e]<=r?i=e:a=e}let o=n.times[i],s=n.times[a],c=8*2**-52*Math.max(1,Math.abs(r),Math.abs(o),Math.abs(s)),l=r-o<=c?0:s-r<=c?1:(r-o)/(s-o);for(let e=0;e<n.parts.length;e++){let r=n.parts[e],o=t[e];if(o.id!==r.id)throw Error(`Motion pose identities differ`);let s=this.transformSources[e];if(s!==e){o.world.copy(t[s].world),o.normalMatrix.copy(t[s].normalMatrix);for(let[t,n]of this.fieldEntries[e])ml(n,4,o.fields[t],i,a,l)}else{if(ml(r.translation,3,this.scratch,i,a,l),this.position.fromArray(this.scratch),ml(r.scale,3,this.scratch,i,a,l),this.scale.fromArray(this.scratch),`value`in r.rotation?this.rotation.fromArray(r.rotation.value):(this.rotation.fromArray(r.rotation.samples,i*4),this.nextRotation.fromArray(r.rotation.samples,a*4),l===1?this.rotation.copy(this.nextRotation):l!==0&&this.rotation.slerp(this.nextRotation,l)),r.shear){ml(r.shear,3,this.shear,i,a,l),o.world.makeRotationFromQuaternion(this.rotation).setPosition(this.position);let e=o.world.elements;for(let t=0;t<3;t++){let n=e[t],r=e[4+t],i=e[8+t];e[t]=n*this.scale.x,e[4+t]=n*this.shear[0]+r*this.scale.y,e[8+t]=n*this.shear[1]+r*this.shear[2]+i*this.scale.z}}else o.world.compose(this.position,this.rotation,this.scale);if(o.normalMatrix.copy(o.world).invert().transpose(),r.normalCorrection){ml(r.normalCorrection,9,this.normalCorrection,i,a,l);let e=o.normalMatrix.elements;for(let t=0;t<3;t++)for(let n=0;n<3;n++)e[t*4+n]=e[t*4+n]+this.normalCorrection[t*3+n];e[3]=e[7]=e[11]=e[12]=e[13]=e[14]=0,e[15]=1}for(let[t,n]of this.fieldEntries[e])ml(n,4,o.fields[t],i,a,l)}}}},_l=class extends gl{constructor(e,t,n=1,r=6){if(super(e),this.nativeStart=t,this.loopStart=n,this.period=r,this.breathing=new pl,this.sourceBreath={y:0,scaleY:1,scaleXZ:1},this.targetBreath={y:0,scaleY:1,scaleXZ:1},this.delta=new Y,this.normalDelta=new Y,this.scaleDelta=new Y,this.inverseBody=new Y,!Number.isFinite(t)||!Number.isFinite(n)||!Number.isFinite(r)||t<1/60||n<0||r<=0||e.duration<n+r)throw Error(`Computer loop requires its complete observed interval`)}sample(e,t){if(!Number.isFinite(e)||e<0)throw Error(`Invalid Computer loop time`);let n=e<this.loopStart?e:this.loopStart+(e-this.loopStart)%this.period;if(super.sample(n,t),n===e)return;this.breathing.sample(this.nativeStart+n-1/60,this.sourceBreath,!1),this.breathing.sample(this.nativeStart+e-1/60,this.targetBreath,!1);let r=this.targetBreath.scaleXZ/this.sourceBreath.scaleXZ,i=this.targetBreath.scaleY/this.sourceBreath.scaleY,a=t[0];if(a?.id!==`mesh:0`)throw Error(`Computer loop requires its body frame`);this.inverseBody.copy(a.world).invert(),this.delta.copy(a.world).multiply(this.scaleDelta.makeScale(r,i,r)),this.delta.elements[13]+=this.targetBreath.y-this.sourceBreath.y,this.delta.multiply(this.inverseBody),this.normalDelta.copy(this.delta).invert().transpose(),this.normalDelta.elements[3]=this.normalDelta.elements[7]=this.normalDelta.elements[11]=0,this.normalDelta.setPosition(0,0,0);for(let e of t){let t=e.fields.referencePose?.[3];t!==-4&&t!==-24&&t!==-40&&(t===-16?(e.world.multiply(this.scaleDelta.makeScale(r,r,1)),e.normalMatrix.multiply(this.scaleDelta.makeScale(1/r,1/r,1))):(e.world.premultiply(this.delta),e.normalMatrix.premultiply(this.normalDelta)))}}};function vl(e){let t=new DataView(e);if(e.byteLength<16||t.getUint32(0,!0)!==1179468098||t.getUint32(4,!0)!==16790582)throw Error(`Invalid avatar motion binary header`);let n=t.getUint32(8,!0),r=t.getUint32(12,!0),i=Math.ceil((16+n)/8)*8;if(!n||i+r*8!==e.byteLength)throw Error(`Invalid avatar motion binary length`);let a=new TextDecoder(`utf-8`,{fatal:!0}).decode(new Uint8Array(e,16,n)),o=new Uint8Array(new Uint16Array([1]).buffer)[0]===1,s=new Map;return JSON.parse(a,(n,a)=>{if(typeof a!=`object`||!a||!(`$motionF64`in a))return a;let c=a.$motionF64;if(Object.keys(a).length!==1||!Array.isArray(c)||c.length!==2||!c.every(Number.isSafeInteger)||c[0]<0||c[1]<1||c[0]+c[1]>r)throw Error(`Invalid avatar motion channel range`);let l=`${c[0]}:${c[1]}`,u=s.get(l);if(!u){let n=i+c[0]*8;u=o?new Float64Array(e,n,c[1]):Float64Array.from({length:c[1]},(e,r)=>t.getFloat64(n+r*8,!0)),s.set(l,u)}return u})}var yl={schema:`bloom.avatar.computer-returns`,version:1,limitations:[`Observed single-cycle Work episodes at native command time 3. Arbitrary command-phase entry and different workingCycles are not proven by these fixtures.`,`Exact full-block paired tail proves the native handoff, not unobserved future idle behavior.`],presets:{blue_beret:{nativeStart:3,nativeStop:5.216666666666667,nativeReturn:6.266666666666667,returnTime:3.2666666666666666,nativeEnd:10,exactTailFrames:225,previousNonmatchingTime:6.25,compared:[`geometry-sha256 identity`,`draw method`,`shader defines`,`entire DrawBlock`,`entire FrameBlock`,`entire SkinBlock`],excludedChannels:[],idleTime:4.083333333333334,idleNativeStart:2.183333333333333,sampler:{matrixMax:0,normalMax:0,fieldMax:0,baseParts:7},sources:{work:{path:`.local/avatar-computer-source/blue_beret/work-raw.json`,sha256:`e528d835551e0faf7f8c5ffd445a17003c347debb103e77e35d83b9dd2598392`},idle:{path:`.local/avatar-return-source/blue_beret/idle-raw.json`,sha256:`bf0fd476dc6974678b2df560c662fc9b36068ffaaeb6ea303541a34187101000`},motion:{path:`runtime/avatar/assets/motion/blue_beret.json`,sha256:`d62023e031e37f2bf1ed6b1ea49965c59abda1d7ea27cf1d0bde213009607cbe`},computer:{path:`runtime/avatar/assets/blue_beret/computer-motion.json`,sha256:`3b3fe2c9eebd8dbb3dd44433c9e21c7110862fb80f5ee1ad1d05f7e2c3144389`}}},alfred:{nativeStart:3,nativeStop:5.216666666666667,nativeReturn:6.266666666666667,returnTime:3.2666666666666666,nativeEnd:10,exactTailFrames:225,previousNonmatchingTime:6.25,compared:[`geometry-sha256 identity`,`draw method`,`shader defines`,`entire DrawBlock`,`entire FrameBlock`,`entire SkinBlock`],excludedChannels:[],idleTime:2.5833333333333335,idleNativeStart:3.683333333333333,sampler:{matrixMax:0,normalMax:0,fieldMax:0,baseParts:9},sources:{work:{path:`.local/avatar-computer-source/alfred/work-raw.json`,sha256:`9023bd872f0817a290ff29be4b983f3ebf123416bf456d629d7164c9cb0acc01`},idle:{path:`.local/avatar-runtime-motion-actions/alfred/idle-raw.json`,sha256:`239bbb065fd8f5481c2592f88eceb991b0f94c8c1ed0dcc73f5bd0ebd558b792`},motion:{path:`runtime/avatar/assets/motion/alfred.json`,sha256:`97390b7bde431f42dd5d0fe2200afba81cc16de5f3757fef6f16c9377cece4d7`},computer:{path:`runtime/avatar/assets/alfred/computer-motion.json`,sha256:`1f43a5a5209fe50f1eb56a4966d02ad06ead79b0ba2c6a03cd9bbad94b225232`}}},purple_heart:{nativeStart:3,nativeStop:5.216666666666667,nativeReturn:6.266666666666667,returnTime:3.2666666666666666,nativeEnd:10,exactTailFrames:225,previousNonmatchingTime:6.25,compared:[`geometry-sha256 identity`,`draw method`,`shader defines`,`entire DrawBlock`,`entire FrameBlock`,`entire SkinBlock`],excludedChannels:[],idleTime:2.5833333333333335,idleNativeStart:3.683333333333333,sampler:{matrixMax:0,normalMax:0,fieldMax:0,baseParts:7},sources:{work:{path:`.local/avatar-computer-source/purple_heart/work-raw.json`,sha256:`febc9157e16fa79025d8e4c0c6119e81763670bf1f6fbfcc6f73166822728bb1`},idle:{path:`.local/avatar-runtime-motion-actions/purple_heart/idle-raw.json`,sha256:`c6ac8afc4e3c15de4531d6ae44b7d352f2c8dcbde628b2f8c689ff2a77dfcdf9`},motion:{path:`runtime/avatar/assets/motion/purple_heart.json`,sha256:`bc112b89b31df40905f9c29e78f3f49c299e2be1e8ca1c6009e486a031528b45`},computer:{path:`runtime/avatar/assets/purple_heart/computer-motion.json`,sha256:`b9ccd37d2c1cb9bcb6b9c54e366a5638b51614e6f54bb9af194b67b48499eb83`}}},lime_frog:{nativeStart:3,nativeStop:5.216666666666667,nativeReturn:6.266666666666667,returnTime:3.2666666666666666,nativeEnd:10,exactTailFrames:225,previousNonmatchingTime:6.25,compared:[`geometry-sha256 identity`,`draw method`,`shader defines`,`entire DrawBlock`,`entire FrameBlock`,`entire SkinBlock`],excludedChannels:[],idleTime:2.5833333333333335,idleNativeStart:3.683333333333333,sampler:{matrixMax:0,normalMax:0,fieldMax:0,baseParts:8},sources:{work:{path:`.local/avatar-computer-source/lime_frog/work-raw.json`,sha256:`8bc0ef22272eda4f2af037edf98438be66f37d0da9ac61220af2b193ff47b1a2`},idle:{path:`.local/avatar-runtime-motion-actions/lime_frog/idle-raw.json`,sha256:`8fa85285775d5556d0f5ba94d19bb28cc0298f01c84eb0e4b311da64990844bb`},motion:{path:`runtime/avatar/assets/motion/lime_frog.json`,sha256:`9887b3d29bc89c2359ac7d3b76ba29e3af5682d5d11323515c8ba46f321f4d79`},computer:{path:`runtime/avatar/assets/lime_frog/computer-motion.json`,sha256:`fcae5c17ad61246972dc8ee687f18e07f92666513ef72558fee951ce2904ebfc`}}},coral_monocle:{nativeStart:3,nativeStop:5.216666666666667,nativeReturn:6.266666666666667,returnTime:3.2666666666666666,nativeEnd:10,exactTailFrames:225,previousNonmatchingTime:6.25,compared:[`geometry-sha256 identity`,`draw method`,`shader defines`,`entire DrawBlock`,`entire FrameBlock`,`entire SkinBlock`],excludedChannels:[],idleTime:2.5833333333333335,idleNativeStart:3.683333333333333,sampler:{matrixMax:0,normalMax:0,fieldMax:0,baseParts:8},sources:{work:{path:`.local/avatar-computer-source/coral_monocle/work-raw.json`,sha256:`3b8217db1059da9c61e75f7c7f03453b3315b31d67379cde7b116dc425838740`},idle:{path:`.local/avatar-runtime-motion-actions/coral_monocle/idle-raw.json`,sha256:`65a8938bc8e4a2c38001e2057f24b06e0245c3f5dff4bf79c41efb5fe666a74c`},motion:{path:`runtime/avatar/assets/motion/coral_monocle.json`,sha256:`654af990773962a866808cb8b831fb7e4c87d50ea7ef53455203534ead76c55c`},computer:{path:`runtime/avatar/assets/coral_monocle/computer-motion.json`,sha256:`605815e4a8d5d4c9817a68158eb30e237466d7a899525fafeb3805a582f95af6`}}},gus:{nativeStart:3,nativeStop:5.216666666666667,nativeReturn:6.266666666666667,returnTime:3.2666666666666666,nativeEnd:10,exactTailFrames:225,previousNonmatchingTime:6.25,compared:[`geometry-sha256 identity`,`draw method`,`shader defines`,`entire DrawBlock`,`entire FrameBlock`,`entire SkinBlock`],excludedChannels:[],idleTime:2.5833333333333335,idleNativeStart:3.683333333333333,sampler:{matrixMax:0,normalMax:0,fieldMax:0,baseParts:5},sources:{work:{path:`.local/avatar-computer-source/gus/work-raw.json`,sha256:`fe497560be31bcb34dbed0589adf23a75b08e30aaa5ae603c1ba0839442dd8b6`},idle:{path:`.local/avatar-runtime-motion-actions/gus/idle-raw.json`,sha256:`367484324cd18606d19080b0a8c399b4a9bca4edd7e5d02a0d5af75f2dcda02d`},motion:{path:`runtime/avatar/assets/motion/gus.json`,sha256:`e0032cc30e1cc14cdbcdd203f64c12d96428a2a84237d372d48175c4c0cadcb0`},computer:{path:`runtime/avatar/assets/gus/computer-motion.json`,sha256:`0db66ca70959fd582a79826311b79af263627c970959ee0f56be41d4dd3a5bed`}}},blue_spectacles:{nativeStart:3,nativeStop:5.216666666666667,nativeReturn:6.266666666666667,returnTime:3.2666666666666666,nativeEnd:10,exactTailFrames:225,previousNonmatchingTime:6.25,compared:[`geometry-sha256 identity`,`draw method`,`shader defines`,`entire DrawBlock`,`entire FrameBlock`,`entire SkinBlock`],excludedChannels:[],idleTime:2.5833333333333335,idleNativeStart:3.683333333333333,sampler:{matrixMax:0,normalMax:0,fieldMax:0,baseParts:11},sources:{work:{path:`.local/avatar-computer-source/blue_spectacles/work-raw.json`,sha256:`64da7947bcdbb3b2c70fcf211dc6b7ac2a14551daa4f3e5067dee586882c101c`},idle:{path:`.local/avatar-runtime-motion-actions/blue_spectacles/idle-raw.json`,sha256:`36c91794e7dae8fb8206b0c324e808c2857921b5efaa1fa15f4ae6ab18d95a3d`},motion:{path:`runtime/avatar/assets/motion/blue_spectacles.json`,sha256:`fd690c0731b5356c243229ca803de89bd81e09aa4f269bddf1f93b062fe36970`},computer:{path:`runtime/avatar/assets/blue_spectacles/computer-motion.json`,sha256:`85d740ad5b43cb32770fbfc3e4e982099232c7b5fdb5c50a80dacd0119d8954e`}}},lime_headphones:{nativeStart:3,nativeStop:5.216666666666667,nativeReturn:6.266666666666667,returnTime:3.2666666666666666,nativeEnd:10,exactTailFrames:225,previousNonmatchingTime:6.25,compared:[`geometry-sha256 identity`,`draw method`,`shader defines`,`entire DrawBlock`,`entire FrameBlock`,`entire SkinBlock`],excludedChannels:[],idleTime:2.5833333333333335,idleNativeStart:3.683333333333333,sampler:{matrixMax:0,normalMax:0,fieldMax:0,baseParts:9},sources:{work:{path:`.local/avatar-computer-source/lime_headphones/work-raw.json`,sha256:`ffaefea0a5352ee9d88e88c7476cab5a395776f4a50cae999756ff9401aa14d6`},idle:{path:`.local/avatar-runtime-motion-actions/lime_headphones/idle-raw.json`,sha256:`e1ad361161685f4247714b9231ef5dbbd7d1839c40995b8889dd4825da5575cd`},motion:{path:`runtime/avatar/assets/motion/lime_headphones.json`,sha256:`1211c5167eca9a1e01bb282f408adbccc754dc53783baefc1d92727ee33e4c4d`},computer:{path:`runtime/avatar/assets/lime_headphones/computer-motion.json`,sha256:`92da9e788e108a5849cbff9cc8a6e0b233409771bbed11fd8476fe2938a4564b`}}}}};function bl(e,t,n){let r=t.clips.idle;if(t.schema!==`bloom.authored-hidden-eye-blink`||t.version!==1||t.preset!==n||r.duration!==e.duration||r.times.length!==e.times.length||r.samples.length!==e.times.length||!r.times.every((t,n)=>t===e.times[n])||!r.samples.every(e=>Number.isFinite(e)&&e>=0&&e<=1))throw Error(`Eye blink must match the observed preset and motion clock`);let i=e.parts.find(e=>e.id===`mesh:0`);if(!i||i.fields.eyeBlink)throw Error(`Eye blink requires an unmodified body channel`);let a=new Float64Array(r.samples.length*4);r.samples.forEach((e,t)=>{a[t*4]=e}),i.fields.eyeBlink={samples:a}}function xl(e,t){if(!Number.isFinite(t.entryTime)||t.entryTime<0||!Number.isFinite(t.coreSeconds)||t.coreSeconds<=.18||t.entryTime+t.coreSeconds>=e.duration||t.duration!==e.duration||t.times.length!==e.times.length||!t.times.every((t,n)=>t===e.times[n])||t.translation.length!==e.times.length*4||t.scale.length!==e.times.length*4||!t.translation.every(Number.isFinite)||!t.scale.every((e,t)=>Number.isFinite(e)&&(t%4==3||e>0)))throw Error(`Reaction gaze must match the observed motion clock and neutral frame`);if(t.eyeBlink&&(t.eyeBlink.length!==e.times.length*4||!t.eyeBlink.every(e=>Number.isFinite(e)&&e>=0&&e<=1)))throw Error(`Reaction blink must match the observed motion clock`);let n=e.parts.find(e=>e.id===`mesh:0`);if(!n||n.fields.gazeNeutralTranslation||n.fields.gazeNeutralScale||n.fields.eyeBlink)throw Error(`Reaction gaze requires an unmodified body channel`);return n.fields.gazeNeutralTranslation={samples:t.translation},n.fields.gazeNeutralScale={samples:t.scale},t.eyeBlink&&(n.fields.eyeBlink={samples:t.eyeBlink}),{entryTime:t.entryTime,coreSeconds:t.coreSeconds}}var Sl=Object.assign({"./assets/packed-motion/alfred.bin":Jc,"./assets/packed-motion/blue_beret.bin":Yc,"./assets/packed-motion/blue_spectacles.bin":Xc,"./assets/packed-motion/coral_monocle.bin":Zc,"./assets/packed-motion/gus.bin":Qc,"./assets/packed-motion/lime_frog.bin":$c,"./assets/packed-motion/lime_headphones.bin":el,"./assets/packed-motion/purple_heart.bin":tl}),Cl=Object.assign({"./assets/packed-motion/alfred.bin":nl,"./assets/packed-motion/blue_beret.bin":rl,"./assets/packed-motion/blue_spectacles.bin":il,"./assets/packed-motion/coral_monocle.bin":al,"./assets/packed-motion/gus.bin":ol,"./assets/packed-motion/lime_frog.bin":sl,"./assets/packed-motion/lime_headphones.bin":cl,"./assets/packed-motion/purple_heart.bin":ll}),wl=new Map,Tl=new Map;async function El(e,t){let n=t[`./assets/packed-motion/${e}.bin`];if(!n)throw Error(`Missing packed avatar motion: ${e}`);let r=await fetch(n);if(!r.ok)throw Error(`Avatar motion failed (${r.status}): ${e}`);return vl(await r.arrayBuffer())}function Dl(e,t=!0){let n=wl.get(e);if(n||(n=kl(e).catch(t=>{throw wl.delete(e),t}),wl.set(e,n)),!t)return n;let r=Tl.get(e);return r||(r=Promise.all([n,El(e,Cl)]).then(([t,n])=>Al(e,t,n)).catch(t=>{throw Tl.delete(e),t}),Tl.set(e,r)),r}var Ol=e=>({...e,parts:e.parts.filter(e=>!e.id.startsWith(`fur:`))});async function kl(e){let t=await El(e,Sl);if(t.schema!==`bloom.avatar.motion-bundle`||t.version!==1||t.preset!==e)throw Error(`Avatar motion bundle identity mismatch: ${e}`);let{motion:n}=t;if(n.preset!==e)throw Error(`Avatar motion identity mismatch: ${e}`);if(e===`lime_headphones`){if(!t.eyeBlink)throw Error(`Missing Headphones idle blink`);bl(n.clips.idle,t.eyeBlink,e)}if(e!==`blue_beret`&&(!t.reactionGaze||!n.clips.reaction))throw Error(`Missing reaction gaze frame: ${e}`);if(e===`lime_headphones`&&!t.reactionGaze?.eyeBlink)throw Error(`Missing Headphones reaction blink`);let r=t.reactionGaze&&n.clips.reaction?xl(n.clips.reaction,t.reactionGaze):void 0,i=n.reactionEnd===`return-idle`&&n.evidence?n.evidence.reaction.nativeEnd-n.evidence.idle.nativeStart:void 0;if(n.reactionEnd===`return-idle`&&(!n.clips.reaction||i===void 0||!Number.isFinite(i)||i<0||i>=n.clips.idle.duration))throw Error(`Invalid reaction return phase: ${e}`);return{idle:new gl(Ol(n.clips.idle)),reaction:n.clips.reaction?new gl(Ol(n.clips.reaction)):void 0,reactionReturnTime:i,reactionGaze:r}}function Al(e,t,n){let r=n.computer;if(n.schema!==`bloom.avatar.motion-bundle`||n.version!==1||n.preset!==e||r?.schema!==`bloom.avatar.computer-motion`||r.preset!==e)throw Error(`Computer motion identity mismatch: ${e}`);let i=n.computerLoop;if(!i||i.schema!==`bloom.avatar.computer-loop`||i.version!==1||i.preset!==e)throw Error(`Missing or invalid Computer loop: ${e}`);let a=new _l(Ol(i.clip),i.nativeStart,i.loopStart,i.period),o=new gl(Ol(r.clip)),s=yl.presets[e];if(!s)throw Error(`Missing verified Computer return: ${e}`);if(!Number.isFinite(s.returnTime)||!Number.isFinite(s.idleTime)||s.returnTime<=0||s.returnTime>r.clip.duration||s.idleTime<0||s.idleTime>=t.idle.clip.duration)throw Error(`Invalid Computer return phase: ${e}`);return{...t,work:o,workLoop:a,workReturn:{time:s.returnTime,idleTime:s.idleTime}}}function jl(e,t){let n=e.getAttribute(`position`),r=e.getAttribute(`normal`),i=e.getIndex(),a=new K().fromArray(t),o=new Kn,s=new K,c=new K,l=new K,u=new K,d=new K,f=1/0,p=i?.count??n.count;for(let e=0;e+2<p;e+=3){let t=[0,1,2].map(t=>i?i.getX(e+t):e+t);if(o.a.fromBufferAttribute(n,t[0]),o.b.fromBufferAttribute(n,t[1]),o.c.fromBufferAttribute(n,t[2]),o.getNormal(l),l.lengthSq()===0)continue;o.closestPointToPoint(a,s);let p=s.distanceToSquared(a);if(!(p>=f)){if(r){o.getBarycoord(s,c),l.set(0,0,0);for(let e=0;e<3;e++)l.addScaledVector(new K().fromBufferAttribute(r,t[e]),c.getComponent(e));l.lengthSq()<1e-20&&o.getNormal(l)}f=p,u.copy(s),d.copy(l).normalize()}}if(!Number.isFinite(f))throw Error(`Tuft requires a nondegenerate body surface`);return{point:u.toArray(),normal:d.toArray()}}function Ml(e,t){let n=t.find(e=>!e.fur),r=e.find(e=>!e.fur);if(!n?.attachmentPivot||!r)return;let i=new K().fromArray(n.attachmentPivot),a=new K().fromArray(jl(r.geometry,i.toArray()).normal),o=n.bounds.max[1]-n.bounds.min[1],s=n.bounds.max[0]-n.bounds.min[0];if(!(o>0&&s>0)||!Number.isFinite(o+s)||a.lengthSq()===0)throw Error(`Invalid tuft attachment dimensions`);let c=s*.48,l=o*.08,u=o*.1,d=o*.28,f=c*c,p=e=>{let t=e.clone().sub(i),n=Math.max(0,1-t.lengthSq()/f);return{value:l*n*n*n,gradient:t.multiplyScalar(-6*l*n*n/f)}},m=(e,t)=>{if(t)return p(e);let n=e.clone().sub(i).dot(a),r=Math.max(0,Math.min(1,n/d)),o=r*r*r*(10+r*(-15+6*r)),s=n>0&&n<d?30*r*r*(1-r)*(1-r)/d:0;return{value:-u*(1-o),gradient:a.clone().multiplyScalar(u*s)}},h=(e,t)=>e.clone().addScaledVector(a,m(e,t).value),g=(e,t,n)=>{let{gradient:r}=m(t,n);if(r.lengthSq()===0)return e;let i=1+r.dot(a);if(!(i>1e-8))throw Error(`Folded tuft attachment`);return e.clone().addScaledVector(r,-a.dot(e)/i).normalize()};for(let n of[...e,...t]){let e=n.category===`body`,t=n.geometry,r=t.getAttribute(`position`),i=(e,n)=>new K().fromBufferAttribute(t.getAttribute(e),n),o=(e,n,r)=>t.getAttribute(e).setXYZ(n,r.x,r.y,r.z);for(let s=0;s<r.count;s++){let r=i(`position`,s),c=!n.fur&&t.hasAttribute(`delta0`)?r.clone().add(i(`delta0`,s)):r,l=!n.fur&&t.hasAttribute(`delta1`)?r.clone().add(i(`delta1`,s)):r;if(m(r,e).value===0&&m(c,e).value===0&&m(l,e).value===0)continue;let u=h(r,e);if(n.fur){let n=m(r,e).gradient,c=g(i(`normal`,s),r,e),l=i(`normal0`,s);if(l.addScaledVector(a,n.dot(l)),l.addScaledVector(c,-c.dot(l)).normalize(),o(`normal`,s,c),o(`normal0`,s,l),t.hasAttribute(`delta1`)){let e=i(`delta1`,s);e.addScaledVector(a,n.dot(e)),o(`delta1`,s,e)}}else{t.hasAttribute(`delta0`)&&o(`delta0`,s,h(c,e).sub(u)),t.hasAttribute(`delta1`)&&o(`delta1`,s,h(l,e).sub(u));for(let[n,a]of[[`normal`,r],[`normal0`,c],[`normal1`,l]])t.hasAttribute(n)&&o(n,s,g(i(n,s),a,e));let a=t.getAttribute(`paletteGeometry`);if(a){let t=(n.fields.paletteReference?.[0]??0)>.5?l:r,i=g(new K(a.getY(s),a.getZ(s),a.getW(s)),t,e);a.setY(s,i.x),a.setZ(s,i.y),a.setW(s,i.z)}}o(`position`,s,u)}for(let e of Object.values(t.attributes))e.needsUpdate=!0;t.computeBoundingBox(),t.computeBoundingSphere(),n.bounds={min:t.boundingBox.min.toArray(),max:t.boundingBox.max.toArray()}}}var Nl=new WeakMap;function Pl(e){let t=new Map,n=Nl.get(e);if(n)return n;let r=e.filter(e=>e.id===0&&!e.activity),i=e.filter(e=>e.attachment===`three_lobe`&&!e.activity);if(!r.some(e=>!e.fur)||!i.some(e=>!e.fur))return t;let a=[...r,...i].map(e=>{let t=e.geometry.clone();return t.computeBoundingBox(),{...e,geometry:t,bounds:{min:t.boundingBox.min.toArray(),max:t.boundingBox.max.toArray()},category:e.id===0?`body`:`accessory`,selection:e.id===0?``:`three_lobe`,pivot:[0,0,0]}});try{let n=a.filter(e=>e.category===`body`),o=a.filter(e=>e.category===`accessory`),s=o.find(e=>!e.fur),c=n.find(e=>!e.fur),l=[0,1,2].map(e=>(s.bounds.min[e]+s.bounds.max[e])/2),u=jl(c.geometry,l).point;for(let e of o)e.attachmentPivot=u,t.set(e.id,u.slice());Ml(n,o);for(let e=0;e<a.length;e++){let t=[...r,...i][e],n=t.geometry;t.geometry=a[e].geometry,n.dispose()}return Nl.set(e,t),t}catch(e){for(let e of a)e.geometry.dispose();throw e}}function Fl(e,t,n){if(e?.pendingStart){let{pendingStart:t,...r}=e;return{...r,started:n}}if(!e||e.held!==void 0||e.kind===`idle`||e.kind===`work`&&e.continuous)return e;let r=e.kind===`work`?t.workReturn?.time:t.reaction?.clip.duration;if(r===void 0||n<e.started+r)return e;if(e.kind===`work`&&(e.remainingCycles??1)>1&&r>0){let t=Math.min(e.remainingCycles,Math.floor((n-e.started)/r));if(t<e.remainingCycles)return{...e,started:e.started+t*r,remainingCycles:e.remainingCycles-t};e={...e,started:e.started+(e.remainingCycles-1)*r,remainingCycles:1}}let i=e.started+r;if(e.kind===`reaction`&&e.queuedReaction)return Fl({kind:`reaction`,started:i},t,n);let a=e.kind===`work`?t.workReturn?.idleTime:t.reactionReturnTime;return a===void 0?e:{kind:`idle`,started:i-a}}var Il=`precision highp float;
out vec2 texCoord;
void main() {
    vec2 p = vec2((gl_VertexID << 1) & 2,gl_VertexID & 2);
    gl_Position = vec4(p*2.0-1.0,0.0,1.0);
    texCoord = p;
}
`,Ll=`precision highp float;
precision highp int;
in vec2 texCoord;
struct FrameBlock {
    mat4 viewProjection, inverseViewProjection, lightViewProjection;
    vec4 cameraPosition, keyDirectionIntensity, fillDirectionIntensity;
    vec4 ambientExposure, viewport, effects, studioParameters;
    vec4 errorBodyBounds;
    vec4 characterStudio;
    vec4 shadowParameters;
    vec4 searchLensCenterRadius, searchLensRight, searchLensUp, searchLensStyle, searchLensOptics;
    vec4 thinkingLightPositionStrength, thinkingLightColorRadius;
};
uniform FrameBlock f;
// Per-avatar camera and sampling density in the shared depth atlas.
uniform sampler2D avatarCameras;
uniform vec4 avatarGrid;
vec2 avatarPixel(vec2 uv) {
    vec2 origin=f.viewport.xy*.5-avatarGrid.xy*avatarGrid.z*.5;
    return vec2(uv.x,1.-uv.y)*f.viewport.xy-origin;
}
ivec2 avatarCell(vec2 uv) { return ivec2(floor(avatarPixel(uv)/max(avatarGrid.z,1.))); }
vec2 avatarScale(vec2 uv) {
    if(avatarGrid.z<=0.)return vec2(1.);
    ivec2 cell=avatarCell(uv);
    int index=cell.y*int(avatarGrid.x)+cell.x;
    if(any(lessThan(cell,ivec2(0)))||cell.x>=int(avatarGrid.x)||index>=int(avatarGrid.w))return vec2(1.);
    return max(texelFetch(avatarCameras,ivec2(index,0),0).xy,vec2(.0001));
}
bool sameAvatar(vec2 a,vec2 b) { return avatarGrid.z<=0.||all(equal(avatarCell(a),avatarCell(b))); }
float avatarPixels() { return avatarGrid.z>0.?avatarGrid.z:min(f.viewport.x,f.viewport.y); }
uvec2 avatarNoisePixel(vec2 uv) {
    if(avatarGrid.z<=0.)return uvec2(uv*f.viewport.xy);
    vec2 local=mod(avatarPixel(uv),avatarGrid.z);
    return uvec2(max(vec2(local.x,avatarGrid.z-local.y),vec2(0.)));
}
uniform highp sampler2D cameraDepth, ambientOcclusion;
layout(location=0) out vec4 outputColor;
vec3 worldFromDepth(vec2 uv, float depth) {
    vec4 p = f.inverseViewProjection*vec4(uv*2.0-1.0,depth*2.0-1.0,1.0);
    return p.xyz/p.w;
}
// Shared immutable sampling tables match the Metal constant-address data.
const vec2 contactDirections[8] = vec2[8](
    vec2(1.,0.),vec2(-1.,0.),vec2(0.,1.),vec2(0.,-1.),
    vec2(.7071067812,.7071067812),vec2(-.7071067812,.7071067812),
    vec2(-.7071067812,-.7071067812),vec2(.7071067812,-.7071067812)
);

float horizonContactOcclusion(vec2 uv, float centerDepth, vec3 p, vec3 normal) {
    vec2 worldPerPixel = vec2(
        length(worldFromDepth(uv+vec2(f.viewport.z,0.),centerDepth)-p),
        length(worldFromDepth(uv+vec2(0.,f.viewport.w),centerDepth)-p));
    vec2 pixelsPerWorldUnit = 1./max(worldPerPixel,vec2(.00001));
    float minimumStep = max(worldPerPixel.x,worldPerPixel.y);
    float radius = max(f.effects.w,minimumStep);
    // Contact quality is independent of whether cast shadows are enabled.
    bool compact = f.effects.y > 0. && f.effects.y < .75;
    int directionCount = compact ? 4 : 8;
    int stepCount = compact ? 6 : 8;
    // Symmetric azimuths preserve the same contact center at each quality.

    // A fixed spatial phase distributes the finite ray budget across nearby
    // pixels. The depth-aware resolve integrates those phases without changing
    // light, pigment, or animation time.
    uvec2 pixel = avatarNoisePixel(uv);
    uint noise = (pixel.x*1664525u) ^ (pixel.y*1013904223u);
    noise ^= noise >> 16u;
    noise *= 2246822519u;
    noise ^= noise >> 13u;
    float phase = float(noise & 65535u)/65536.;
    float angle = phase*6.2831853072/float(directionCount);
    float cosine = cos(angle), sine = sin(angle);
    float occlusion = 0.;
    for (int direction=0;direction<8;++direction) {
        if (direction>=directionCount) break;
        vec2 axis = contactDirections[direction];
        axis = vec2(cosine*axis.x-sine*axis.y,sine*axis.x+cosine*axis.y);
        float horizon = 0.;
        for (int step=0;step<8;++step) {
            if (step>=stepCount) break;
            uint radial = noise ^ (uint(direction)*374761393u+uint(step)*668265263u);
            radial = (radial ^ (radial >> 13u))*1274126177u;
            radial ^= radial >> 16u;
            float jitter = float(radial & 65535u)/65536.;
            float t = clamp((float(step)-.5+jitter)/float(stepCount-1),0.,1.);
            // Keep an inner sample even when a thin frame lies within one pixel.
            float reach = step == 0 ? minimumStep : mix(minimumStep,radius,t*t);
            vec2 sampleUV = uv+axis*reach*pixelsPerWorldUnit*f.viewport.zw;
            if (any(lessThan(sampleUV,vec2(0.))) || any(greaterThan(sampleUV,vec2(1.)))) continue;
            if(!sameAvatar(uv,sampleUV))continue;
            float sampleDepth = texture(cameraDepth,sampleUV).r;
            if (sampleDepth >= .99999) continue;
            vec3 delta = worldFromDepth(sampleUV,sampleDepth)-p;
            float distance = length(delta);
            if (distance <= .00001) continue;
            float elevation = max(0.,dot(normal,delta)/distance-.04);
            float falloff = 1.-smoothstep(radius*.2,radius,distance);
            // A blocker contributes its maximum horizon once, rather than
            // a separate shifted outline for every discrete sample radius.
            horizon = max(horizon,elevation*elevation*falloff);
        }
        occlusion += horizon;
    }
    return clamp(1.-occlusion/float(directionCount)*f.effects.z*2.,0.,1.);
}

// BEGIN GENERATED FELIPE
float orthoContactOcclusion(vec2 uv) {
    // A half-resolution fragment lies on a full-resolution texel boundary.
    // Center it before reconstructing normals so rounding cannot change sides.
    uv=(floor(uv*f.viewport.xy)+.5)*f.viewport.zw;

    float centerDepth=texture(cameraDepth,uv).r;
    if(centerDepth>=.99999)return 1.;
    vec3 units=2.*vec3(length(f.inverseViewProjection[0].xyz),length(f.inverseViewProjection[1].xyz),length(f.inverseViewProjection[2].xyz));
    units.xy/=avatarScale(uv);
    vec2 worldPerPixel=units.xy*f.viewport.zw;
    float left=texture(cameraDepth,uv-vec2(f.viewport.z,0.)).r;
    float right=texture(cameraDepth,uv+vec2(f.viewport.z,0.)).r;
    float down=texture(cameraDepth,uv-vec2(0.,f.viewport.w)).r;
    float up=texture(cameraDepth,uv+vec2(0.,f.viewport.w)).r;
    float dzx=abs(right-centerDepth)<abs(centerDepth-left)?right-centerDepth:centerDepth-left;
    float dzy=abs(up-centerDepth)<abs(centerDepth-down)?up-centerDepth:centerDepth-down;
    if(left>=.99999 && right>=.99999)dzx=0.;
    if(down>=.99999 && up>=.99999)dzy=0.;
    vec3 normal=normalize(vec3(dzx*units.z/worldPerPixel.x,dzy*units.z/worldPerPixel.y,-1.));
    vec2 pixelsPerWorldUnit = 1./max(worldPerPixel,vec2(.00001));
    // Match ray spacing to the AO render target. Sub-texel taps at half
    // resolution overweight whichever occluder edge lands on a sampled pixel.
    float minimumStep = max(worldPerPixel.x,worldPerPixel.y) *
        (avatarPixels()>128. ? 2. : 1.);
    float radius = max(f.effects.w,minimumStep);
    // Contact quality is independent of whether cast shadows are enabled.
    bool compact = f.effects.y > 0. && f.effects.y < .75;
    int directionCount = compact ? 4 : 8;
    int stepCount = compact ? 6 : 8;
    // Symmetric azimuths preserve the same contact center at each quality.

    // A fixed spatial phase distributes the finite ray budget across nearby
    // pixels. The depth-aware resolve integrates those phases without changing
    // light, pigment, or animation time.
    uvec2 pixel = avatarNoisePixel(uv);
    uint noise = (pixel.x*1664525u) ^ (pixel.y*1013904223u);
    noise ^= noise >> 16u;
    noise *= 2246822519u;
    noise ^= noise >> 13u;
    float phase = float(noise & 65535u)/65536.;
    float angle = phase*6.2831853072/float(directionCount);
    float cosine = cos(angle), sine = sin(angle);
    float occlusion = 0.;
    for (int direction=0;direction<8;++direction) {
        if (direction>=directionCount) break;
        vec2 axis = contactDirections[direction];
        axis = vec2(cosine*axis.x-sine*axis.y,sine*axis.x+cosine*axis.y);
        float horizon = 0.;
        for (int step=0;step<8;++step) {
            if (step>=stepCount) break;
            uint radial = noise ^ (uint(direction)*374761393u+uint(step)*668265263u);
            radial = (radial ^ (radial >> 13u))*1274126177u;
            radial ^= radial >> 16u;
            float jitter = float(radial & 65535u)/65536.;
            float t = clamp((float(step)-.5+jitter)/float(stepCount-1),0.,1.);
            // Keep an inner sample even when a thin frame lies within one pixel.
            float reach = step == 0 ? minimumStep : mix(minimumStep,radius,t*t);
            vec2 sampleUV = uv+axis*reach*pixelsPerWorldUnit*f.viewport.zw;
            if (any(lessThan(sampleUV,vec2(0.))) || any(greaterThan(sampleUV,vec2(1.)))) continue;
            if(!sameAvatar(uv,sampleUV))continue;
            float sampleDepth = texture(cameraDepth,sampleUV).r;
            if (sampleDepth >= .99999) continue;
            vec3 delta = vec3((sampleUV-uv)*units.xy,(sampleDepth-centerDepth)*units.z);
            float distance = length(delta);
            if (distance <= .00001) continue;
            float elevation = max(0.,dot(normal,delta)/distance-.04);
            float falloff = 1.-smoothstep(radius*.2,radius,distance);
            // A blocker contributes its maximum horizon once, rather than
            // a separate shifted outline for every discrete sample radius.
            horizon = max(horizon,elevation*elevation*falloff);
        }
        occlusion += horizon;
    }
    return clamp(1.-occlusion/float(directionCount)*f.effects.z*2.,0.,1.);

}
float resolveContactOcclusion(vec2 uv) {

    float center = texture(cameraDepth,uv).r;
    if(center >= .99999) return 1.;
    float left = texture(cameraDepth,uv-vec2(f.viewport.z,0.)).r;
    float right = texture(cameraDepth,uv+vec2(f.viewport.z,0.)).r;
    float down = texture(cameraDepth,uv-vec2(0.,f.viewport.w)).r;
    float up = texture(cameraDepth,uv+vec2(0.,f.viewport.w)).r;
    float sx = abs(right-center)<abs(center-left) ? right-center : center-left;
    float sy = abs(up-center)<abs(center-down) ? up-center : center-down;
    if(left>=.99999 && right>=.99999) sx=0.;
    if(down>=.99999 && up>=.99999) sy=0.;
    float depthScale = f.cameraPosition.w==0. ? 2.*length(f.inverseViewProjection[2].xyz)
        : length(worldFromDepth(uv,center+.001)-worldFromDepth(uv,center))*1000.;
    ivec2 size = textureSize(ambientOcclusion,0);
    // The half-resolution taps span more than one surface pixel. A fixed
    // world-space cutoff rejects valid neighbors on curved silhouettes and
    // exposes individual noisy contact samples as the character turns.
    vec2 cameraScale=avatarScale(uv);
    float footprint = 2.*max(length(f.inverseViewProjection[0].xyz)/(float(size.x)*cameraScale.x),
                             length(f.inverseViewProjection[1].xyz)/(float(size.y)*cameraScale.y));
    if(f.cameraPosition.w!=0.) {
        vec3 p=worldFromDepth(uv,center);
        footprint=max(length(worldFromDepth(uv+vec2(1./float(size.x),0.),center)-p),
                      length(worldFromDepth(uv+vec2(0.,1./float(size.y)),center)-p));
    }
    // Cap the footprint allowance so distinct foreground surfaces still reject
    // one another, including in small previews.
    float tolerance = clamp(footprint*1.5,.006,.02)/max(depthScale,.00001);
    vec2 coordinate = uv*vec2(size)-.5;
    ivec2 origin = ivec2(floor(coordinate+.5));
    float sum=0., weights=0.;
    int radius=avatarPixels()>256. ? 2 : 1;
    for(int y=-radius;y<=radius;++y) for(int x=-radius;x<=radius;++x) {
        ivec2 pixel=clamp(origin+ivec2(x,y),ivec2(0),size-1);
        vec2 sampleUV=(vec2(pixel)+.5)/vec2(size);
        sampleUV=(floor(sampleUV*f.viewport.xy)+.5)*f.viewport.zw;
        if(!sameAvatar(uv,sampleUV))continue;
        float depth=texture(cameraDepth,sampleUV).r;
        if(depth>=.99999) continue;
        vec2 offset=(sampleUV-uv)*f.viewport.xy;
        float separation=abs(depth-center-dot(vec2(sx,sy),offset));
        vec2 delta=abs(vec2(pixel)-coordinate);
        float weight=max(0.,float(radius+1)-delta.x)*max(0.,float(radius+1)-delta.y)
            *(1.-smoothstep(tolerance,tolerance*2.,separation));
        sum+=texelFetch(ambientOcclusion,pixel,0).r*weight;
        weights+=weight;
    }
    return weights>.00001 ? sum/weights : 1.;
}
// END GENERATED FELIPE

void main() {
#ifdef ORBIT_RESOLVE_AO
    outputColor=vec4(resolveContactOcclusion(texCoord));
    return;
#endif
#ifdef ORBIT_ORTHOGRAPHIC_AO
    outputColor=vec4(orthoContactOcclusion(texCoord));
    return;
#endif
    vec2 centeredUV=(floor(texCoord*f.viewport.xy)+.5)*f.viewport.zw;
    float centerDepth = texture(cameraDepth,centeredUV).r;
    if (centerDepth >= .99999) { outputColor=vec4(1.); return; }
    vec3 p = worldFromDepth(centeredUV,centerDepth);
    vec2 dx = vec2(f.viewport.z,0.), dy = vec2(0.,f.viewport.w);
    float leftDepth = texture(cameraDepth,centeredUV-dx).r, rightDepth = texture(cameraDepth,centeredUV+dx).r;
    float downDepth = texture(cameraDepth,centeredUV-dy).r, upDepth = texture(cameraDepth,centeredUV+dy).r;
    // Use the closer neighbor on each axis so a frame/background discontinuity
    // cannot tilt the reconstructed body normal into a false contour shadow.
    vec3 px = abs(rightDepth-centerDepth) < abs(centerDepth-leftDepth)
        ? worldFromDepth(centeredUV+dx,rightDepth)-p : p-worldFromDepth(centeredUV-dx,leftDepth);
    vec3 py = abs(upDepth-centerDepth) < abs(centerDepth-downDepth)
        ? worldFromDepth(centeredUV+dy,upDepth)-p : p-worldFromDepth(centeredUV-dy,downDepth);
    if (leftDepth >= .99999 && rightDepth >= .99999) px = worldFromDepth(centeredUV+dx,centerDepth)-p;
    if (downDepth >= .99999 && upDepth >= .99999) py = worldFromDepth(centeredUV+dy,centerDepth)-p;
    vec3 crossed = cross(px,py);
    vec3 normal = crossed/max(length(crossed),.0000000001);
    if (dot(normal,f.cameraPosition.xyz-p*f.cameraPosition.w)<0.) normal = -normal;
    outputColor = vec4(horizonContactOcclusion(centeredUV,centerDepth,p,normal));
}
`,Rl=class{constructor(e,t){this.renderer=e,this.scene=new Mn,this.camera=new na,this.geometry=new Er,this.width=0,this.height=0,this.disposed=!1,this.frame=Object.fromEntries(Object.entries(t).map(([e,t])=>{if(![4,16].includes(t.length)||!t.every(Number.isFinite))throw Error(`Invalid authored AO frame field: ${e}`);return[e,t.length===16?new Y().fromArray(t):new Gt().fromArray(t)]}));for(let e of[`viewProjection`,`inverseViewProjection`])if(!(this.frame[e]instanceof Y))throw Error(`Missing authored AO matrix: ${e}`);for(let e of[`viewport`,`cameraPosition`,`effects`])if(!(this.frame[e]instanceof Gt))throw Error(`Missing authored AO vector: ${e}`);if(this.frame.cameraPosition.w!==0)throw Error(`AuthoredOcclusion requires an orthographic scene`);this.geometry.setAttribute(`position`,new mr(new Float32Array(9),3)),this.geometry.setDrawRange(0,3);let n=()=>new qt(1,1,{format:k,type:d,minFilter:a,magFilter:a,wrapS:r,wrapT:r,depthBuffer:!1,stencilBuffer:!1,generateMipmaps:!1,colorSpace:``,samples:0});this.sampled=n(),this.resolved=n();let i=e=>new ji({glslVersion:We,vertexShader:Il,fragmentShader:Ll,defines:{[e]:1},uniforms:{f:{value:this.frame},cameraDepth:{value:null},ambientOcclusion:{value:this.sampled.texture},avatarCameras:{value:null},avatarGrid:{value:new Gt}},depthTest:!1,depthWrite:!1,blending:0,toneMapped:!1});this.sampleMaterial=i(`ORBIT_ORTHOGRAPHIC_AO`),this.sampleMaterial.uniforms.ambientOcclusion.value=null,this.resolveMaterial=i(`ORBIT_RESOLVE_AO`),this.mesh=new $r(this.geometry,this.sampleMaterial),this.mesh.frustumCulled=!1,this.scene.add(this.mesh)}resize(e,t){if(this.disposed)throw Error(`AuthoredOcclusion is disposed`);if(!Number.isInteger(e)||!Number.isInteger(t)||e<1||t<1)throw Error(`Authored AO dimensions must be positive physical pixel integers`);(this.width!==e||this.height!==t)&&(this.width=e,this.height=t,this.sampled.setSize(Math.max(1,Math.ceil(e/2)),Math.max(1,Math.ceil(t/2))),this.resolved.setSize(e,t),this.frame.viewport.set(e,t,1/e,1/t))}setAvatars(e,t,n,r,i){for(let a of[this.sampleMaterial,this.resolveMaterial])a.uniforms.avatarCameras.value=e,a.uniforms.avatarGrid.value.set(t,n,r,i)}render(e,t,n,r,i){this.resize(n,r);for(let e of[this.sampled,this.resolved])if(e.scissorTest=!!i&&(i.z<n||i.w<r),i){let t=Math.floor(i.x*e.width/n),a=Math.floor(i.y*e.height/r);e.scissor.set(t,a,Math.ceil((i.x+i.z)*e.width/n)-t,Math.ceil((i.y+i.w)*e.height/r)-a)}if(!t.elements.every(Number.isFinite)||Math.abs(t.determinant())<1e-15)throw Error(`Authored AO requires a finite invertible view-projection matrix`);let a=t.elements;if(a[3]!==0||a[7]!==0||a[11]!==0||a[15]!==1)throw Error(`Authored AO requires an orthographic view-projection matrix`);this.frame.viewProjection.copy(t),this.frame.inverseViewProjection.copy(t).invert(),this.sampleMaterial.uniforms.cameraDepth.value=e,this.resolveMaterial.uniforms.cameraDepth.value=e;let o=this.renderer,s=o.getRenderTarget(),c=o.getActiveCubeFace(),l=o.getActiveMipmapLevel(),u=o.autoClear,d=o.xr.enabled;try{o.autoClear=!1,o.xr.enabled=!1,this.mesh.material=this.sampleMaterial,o.setRenderTarget(this.sampled),o.render(this.scene,this.camera),this.mesh.material=this.resolveMaterial,o.setRenderTarget(this.resolved),o.render(this.scene,this.camera)}finally{o.setRenderTarget(s,c,l),o.autoClear=u,o.xr.enabled=d}return this.resolved.texture}dispose(){this.disposed||(this.disposed=!0,this.geometry.dispose(),this.sampleMaterial.dispose(),this.resolveMaterial.dispose(),this.sampled.dispose(),this.resolved.dispose(),this.scene.clear())}},zl=class{constructor(){this.active=!1,this.yaw=0,this.pitch=0,this.startX=0,this.startY=0,this.released=0,this.releaseYaw=0,this.releasePitch=0}get moving(){return!this.active&&Math.max(Math.abs(this.yaw),Math.abs(this.pitch))>=1e-12}down(e,t,n){this.sample(n),this.startX=Math.fround(e),this.startY=Math.fround(t),this.active=!0}move(e,t){if(!this.active)return;let n=Math.fround(Math.fround(e)-this.startX),r=Math.fround(Math.fround(t)-this.startY);this.yaw=Math.fround(Math.max(-.32,Math.min(.32,Math.fround(n*Math.fround(1.7))))),this.pitch=Math.fround(Math.max(-.22,Math.min(.22,Math.fround(r*1.5))))}up(e){this.active&&(this.active=!1,this.released=e,this.releaseYaw=this.yaw,this.releasePitch=this.pitch)}sample(e){if(this.active||!this.releaseYaw&&!this.releasePitch)return;let t=.88**(Math.max(0,e-this.released)*60);this.yaw=this.releaseYaw*t,this.pitch=this.releasePitch*t,this.moving||(this.yaw=this.pitch=this.releaseYaw=this.releasePitch=0)}reset(){this.active=!1,this.yaw=this.pitch=this.releaseYaw=this.releasePitch=0}},Bl=class{constructor(){this.yaw=0,this.pitch=0,this.yawVelocity=0,this.pitchVelocity=0,this.targetYaw=0,this.targetPitch=0}get moving(){return Math.max(Math.abs(this.yaw-this.targetYaw),Math.abs(this.pitch-this.targetPitch),Math.abs(this.yawVelocity),Math.abs(this.pitchVelocity))>=1e-12}point(e,t){if(!Number.isFinite(e)||!Number.isFinite(t))throw Error(`Invalid gaze coordinates`);this.targetYaw=(Math.max(0,Math.min(1,Math.fround(e)))-.5)*.11,this.targetPitch=(Math.max(0,Math.min(1,Math.fround(t)))-.5)*.07}advance(e){if(!Number.isFinite(e)||e<0)throw Error(`Invalid gaze interval`);if(!this.moving)return;let t=Math.exp(-22*e),n=this.yaw-this.targetYaw,r=this.pitch-this.targetPitch,i=this.yawVelocity+22*n,a=this.pitchVelocity+22*r;this.yaw=this.targetYaw+(n+i*e)*t,this.pitch=this.targetPitch+(r+a*e)*t,this.yawVelocity=(this.yawVelocity-22*i*e)*t,this.pitchVelocity=(this.pitchVelocity-22*a*e)*t,this.moving||(this.yaw=this.targetYaw,this.pitch=this.targetPitch,this.yawVelocity=this.pitchVelocity=0)}reset(){this.yaw=this.pitch=this.yawVelocity=this.pitchVelocity=0,this.targetYaw=this.targetPitch=0}},Vl=e=>{let t=Math.max(0,Math.min(1,e));return t*t*t*(10-15*t+6*t*t)};function Hl(e,t){if(!Number.isFinite(e)||!Number.isFinite(t)||t<.18)throw Error(`Invalid reaction gaze interval`);return{frozen:e<t,strength:e<t?1-Vl(e/.18):Vl((e-t)/.18)}}function Ul(e,t=!1){for(let n=0;n<3;n++){let r=e[n];if(typeof r!=`number`||!Number.isFinite(r)||t&&r<=0)throw Error(`Invalid reaction neutral frame`)}}var Wl=class{constructor(){this.basis=new Y().makeRotationY(8*Math.PI/180),this.inverseBasis=this.basis.clone().invert(),this.scratch=new Y,this.relativeEye=new Y}writeBodyCorrection(e,t,n,r,i){if(Ul(n),!Number.isFinite(e)||!Number.isFinite(t))throw Error(`Invalid reaction gaze angles`);i.copy(this.basis).multiply(this.scratch.makeRotationY(e)).multiply(this.scratch.makeRotationX(t)).multiply(this.inverseBasis);let a=n[0],o=n[1],s=n[2];r.makeTranslation(a,o,s).multiply(i).multiply(this.scratch.makeTranslation(-a,-o,-s))}writeNeutralFrame(e,t,n){Ul(e),Ul(t,!0),n.copy(this.basis).multiply(this.scratch.makeScale(t[0],t[1],t[2])),n.setPosition(e[0],e[1],e[2])}writeEyeCorrection(e,t,n,r,i,a,o,s,c){this.writeNeutralFrame(i,a,this.relativeEye),this.relativeEye.invert().multiply(o),e.writeBeforePoseCorrection(t,n,this.relativeEye,s,c,r)}},Gl=e=>Math.max(0,Math.min(1,e)),Kl=e=>e*e*(3-2*e),ql=e=>.5-Math.sin(Math.asin(1-2*Gl(e))/3);function Jl(e,t){let n=e[2],r=e[3];if(typeof n!=`number`||typeof r!=`number`||!Number.isFinite(n)||!Number.isFinite(r))throw Error(`Invalid eye morph channels`);let i=t===`integrated`?ql:Gl;return r>0?(1+i(r))/2:i(n)/2}var Yl=class{constructor(){this.x=0,this.y=0,this.velocityX=0,this.velocityY=0,this.targetX=0,this.targetY=0,this.inverseRelativePose=new Y}get moving(){return Math.max(Math.abs(this.x-this.targetX),Math.abs(this.y-this.targetY),Math.abs(this.velocityX),Math.abs(this.velocityY))>=1e-12}point(e,t){if(!Number.isFinite(e)||!Number.isFinite(t))throw Error(`Invalid eye coordinates`);this.targetX=Gl(Math.fround(e))-.5,this.targetY=Gl(Math.fround(t))-.5}advance(e){if(!Number.isFinite(e)||e<0)throw Error(`Invalid eye interval`);if(!this.moving)return;let t=Math.exp(-55*e),n=this.x-this.targetX,r=this.y-this.targetY,i=this.velocityX+55*n,a=this.velocityY+55*r;this.x=this.targetX+(n+i*e)*t,this.y=this.targetY+(r+a*e)*t,this.velocityX=(this.velocityX-55*i*e)*t,this.velocityY=(this.velocityY-55*a*e)*t,this.moving||(this.x=this.targetX,this.y=this.targetY,this.velocityX=this.velocityY=0)}writeCorrection(e,t,n,r,i=1){if(!Number.isFinite(t)||t<0||t>1)throw Error(`A measured eye blink closure in [0, 1] is required`);if(!Number.isFinite(i)||i<0||i>1)throw Error(`Eye transition strength must be in [0, 1]`);let a=(1-Kl(Gl(t*e.blinkMultiplier)))*i;if(a===0||this.x===0&&this.y===0){n.identity(),r.identity();return}let o=this.x*e.angularGain[0]*a,s=this.y*e.angularGain[1]*a,c=Math.cos(o),l=Math.sin(o),u=Math.cos(s),d=Math.sin(s),f=this.x*e.halfSize[0]*e.translationGain[0]*a,p=this.y*e.halfSize[1]*e.translationGain[1]*a,[m,h,g]=e.anchor;if(e.surface){let[t,i]=e.surface.curvature,[a,o]=e.surface.slope,s=e.surface.crossCurvature??0,g=l*d,_=c*(a-t*f-s*p)-a,v=g*(a-t*f-s*p)+u*(o-i*p-s*f)-o,y=a*f+o*p-(t*f*f+i*p*p+2*s*f*p)/2;n.set(c,g,0,m*(1-c)-h*g+f,0,u,0,h*(1-u)+p,_,v,1,y-_*m-v*h,0,0,0,1),r.copy(n).setPosition(0,0,0).invert().transpose()}else n.set(c,l*d,l*u,m*(1-c)-h*l*d-g*l*u+f,0,u,-d,h*(1-u)+g*d+p,0,0,1,0,0,0,0,1),r.copy(n).setPosition(0,0,0).invert().transpose()}writeBeforePoseCorrection(e,t,n,r,i,a=1){if(!Number.isFinite(n.determinant())||Math.abs(n.determinant())<1e-12)throw Error(`Eye expression pose must be invertible`);this.writeCorrection(e,t,r,i,a),this.inverseRelativePose.copy(n).invert(),r.premultiply(this.inverseRelativePose).multiply(n),i.copy(r).setPosition(0,0,0).invert().transpose()}reset(){this.x=this.y=this.velocityX=this.velocityY=this.targetX=this.targetY=0}},Xl={schema:`bloom.authored-eye-gaze-profiles`,version:1,provenance:{anchors:`geometry.pose.deformationCenter, proven by authored-parts.mjs transformAuthoredRecord`,halfSize:`Eye effect local half-width/height: clippo-geometry.mjs eyePrefix; preserved separately per geometry LOD`,gains:`Independent native 60Hz horizontal/vertical and 30Hz mixed hover/drag/release observations; scripts/test-avatar-eye-gaze.mjs`,sourceGeometrySha256:{"lime_frog:0":`5c86e543d07254bd9fa272242c0a127b2bab8ad1a05f875b75351652f2df88c4`,"lime_frog:1":`6705c6aedb4aa298d047dfb84236253406956fac5c173e265398827df29a78bc`,"blue_spectacles:0":`c5f5b755855e26f830b5633529b5c8f4eec9168be23f1c416c82fb9e61488e82`,"blue_spectacles:1":`125937880eec0bb2bec33af28ad2b7f975103ae25576cea69d81f745d887adab`,"lime_headphones:0":`07a938d2b3a7f5d300364e88f6393acd6149c33e62330e23199f7facb91be2ac`,"lime_headphones:1":`1ca202f9b1fb7727ca8e4cef1b1f510c5e080fe7a45da4d994b3cbe1da6aa1b5`,"coral_monocle:0":`453741aa6b59066d996ae787e1df2e2d91aa4cd917b9a4dd160fcf77832e9b8c`,"coral_monocle:1":`567e130c476cde10d33c46038187fc9aecb374350b0eeece6f5e655a9316349c`}},limitations:[`Headphones requires an explicit hidden blink signal; its morph [0,1] is not that signal.`,`Neutral reactive controller observations; reaction/Computer gaze composition requires separate evidence.`],presets:{lime_frog:{0:{1:{anchor:[-.46000000834465027,.4899999797344208,.5120980739593506],halfSize:[.17200002074241638,.18799999356269836],angularGain:[.042,.028],translationGain:[.07,-.042],blink:`integrated`,blinkMultiplier:1},2:{anchor:[-.46000000834465027,.4899999797344208,.5120980739593506],halfSize:[.17200002074241638,.18799999356269836],angularGain:[.042,.028],translationGain:[.07,-.042],blink:`integrated`,blinkMultiplier:1},3:{anchor:[.46000000834465027,.4899999797344208,.5121124386787415],halfSize:[.17200002074241638,.18799999356269836],angularGain:[.042,.028],translationGain:[.07,-.042],blink:`integrated`,blinkMultiplier:1},4:{anchor:[.46000000834465027,.4899999797344208,.5121124386787415],halfSize:[.17200002074241638,.18799999356269836],angularGain:[.042,.028],translationGain:[.07,-.042],blink:`integrated`,blinkMultiplier:1}},1:{1:{anchor:[-.46000000834465027,.4899999797344208,.5120980739593506],halfSize:[.17200002074241638,.18799999356269836],angularGain:[.042,.028],translationGain:[.07,-.042],blink:`integrated`,blinkMultiplier:1},2:{anchor:[-.46000000834465027,.4899999797344208,.5120980739593506],halfSize:[.17200002074241638,.18799999356269836],angularGain:[.042,.028],translationGain:[.07,-.042],blink:`integrated`,blinkMultiplier:1},3:{anchor:[.46000000834465027,.4899999797344208,.5121124386787415],halfSize:[.17200002074241638,.18799999356269836],angularGain:[.042,.028],translationGain:[.07,-.042],blink:`integrated`,blinkMultiplier:1},4:{anchor:[.46000000834465027,.4899999797344208,.5121124386787415],halfSize:[.17200002074241638,.18799999356269836],angularGain:[.042,.028],translationGain:[.07,-.042],blink:`integrated`,blinkMultiplier:1}}},blue_spectacles:{0:{1:{anchor:[-.3401760756969452,.03866931423544884,.5094621181488037],halfSize:[.1905951201915741,.1905951052904129],angularGain:[.042,.028],translationGain:[.07,-.042],blink:`integrated`,blinkMultiplier:1},2:{anchor:[-.3401760756969452,.03866931423544884,.5094621181488037],halfSize:[.1905951201915741,.1905951052904129],angularGain:[.042,.028],translationGain:[.07,-.042],blink:`integrated`,blinkMultiplier:1},3:{anchor:[.33213406801223755,.03866931423544884,.517117977142334],halfSize:[.1905950903892517,.1905951052904129],angularGain:[.042,.028],translationGain:[.07,-.042],blink:`integrated`,blinkMultiplier:1},4:{anchor:[.33213406801223755,.03866931423544884,.517117977142334],halfSize:[.1905950903892517,.1905951052904129],angularGain:[.042,.028],translationGain:[.07,-.042],blink:`integrated`,blinkMultiplier:1}},1:{1:{anchor:[-.3401760756969452,.03866931423544884,.5094621181488037],halfSize:[.1905951201915741,.1905951052904129],angularGain:[.042,.028],translationGain:[.07,-.042],blink:`integrated`,blinkMultiplier:1},2:{anchor:[-.3401760756969452,.03866931423544884,.5094621181488037],halfSize:[.1905951201915741,.1905951052904129],angularGain:[.042,.028],translationGain:[.07,-.042],blink:`integrated`,blinkMultiplier:1},3:{anchor:[.33213406801223755,.03866931423544884,.517117977142334],halfSize:[.1905950903892517,.1905951052904129],angularGain:[.042,.028],translationGain:[.07,-.042],blink:`integrated`,blinkMultiplier:1},4:{anchor:[.33213406801223755,.03866931423544884,.517117977142334],halfSize:[.1905950903892517,.1905951052904129],angularGain:[.042,.028],translationGain:[.07,-.042],blink:`integrated`,blinkMultiplier:1}}},lime_headphones:{0:{1:{anchor:[-.3329812288284302,-.07841390371322632,.49655792117118835],halfSize:[.2206026315689087,.19739124178886414],angularGain:[.238,.112],translationGain:[.252,-.14],blink:`external`,blinkMultiplier:1},2:{anchor:[.23228435218334198,-.0753689706325531,.5453407764434814],halfSize:[.2180550992488861,.19582310318946838],angularGain:[.238,.112],translationGain:[.252,-.14],blink:`external`,blinkMultiplier:1}},1:{1:{anchor:[-.3329812288284302,-.07841390371322632,.49655792117118835],halfSize:[.2204982340335846,.1972978264093399],angularGain:[.238,.112],translationGain:[.252,-.14],blink:`external`,blinkMultiplier:1},2:{anchor:[.23228435218334198,-.0753689706325531,.5453407764434814],halfSize:[.2180555760860443,.1958235502243042],angularGain:[.238,.112],translationGain:[.252,-.14],blink:`external`,blinkMultiplier:1}}},coral_monocle:{0:{3:{anchor:[.1820000261068344,.30000004172325134,.6229034066200256],halfSize:[.13699999451637268,.13899999856948853],angularGain:[0,0],translationGain:[.098,-.035],blink:`linear`,blinkMultiplier:6},4:{anchor:[-.2750000059604645,.30000004172325134,.6066563725471497],halfSize:[.13699999451637268,.13899999856948853],angularGain:[0,0],translationGain:[.098,-.035],blink:`linear`,blinkMultiplier:6}},1:{3:{anchor:[.1820000261068344,.30000004172325134,.6229034066200256],halfSize:[.13699999451637268,.13899999856948853],angularGain:[0,0],translationGain:[.098,-.035],blink:`linear`,blinkMultiplier:6},4:{anchor:[-.2750000059604645,.30000004172325134,.6066563725471497],halfSize:[.13699999451637268,.13899999856948853],angularGain:[0,0],translationGain:[.098,-.035],blink:`linear`,blinkMultiplier:6}}}}},Zl=`precision highp float;
in mat4 instanceMatrix;
in vec2 instanceOffset;
in vec3 instancePigment;
#ifdef FELIPE_FUR
in float strandIndex;
#else
const float strandIndex=0.;
#endif
uniform mat4 crowdProjection;
out vec3 pigment;
mat4 avatarWorld, avatarNormal;
#ifdef AUTHORED_MOTION
uniform highp sampler2D instancePose;
vec4 avatarParameters, avatarSignatureDeform;
flat out vec4 avatarColorRoughness, avatarPaletteClosure;
#endif
in vec3 position;
in vec3 normal;
#ifndef FELIPE_FUR
in vec3 delta0;
#else
const vec3 delta0=vec3(0);
#endif
in vec3 normal0;
in vec3 delta1;
#ifndef FELIPE_FUR
in vec3 normal1;
#else
const vec3 normal1=vec3(0);
#endif
#ifndef FELIPE_FUR
in vec2 authoredResponse;
#else
const vec2 authoredResponse=vec2(0);
#endif
in vec4 paletteGeometry;
#ifndef FELIPE_FUR
in uvec4 skinJoints;
#else
const uvec4 skinJoints=uvec4(0);
#endif
#ifndef FELIPE_FUR
in vec4 skinWeights;
#else
const vec4 skinWeights=vec4(0);
#endif
struct SkinBlock { mat4 joints[24]; };
uniform SkinBlock skin;
struct FrameBlock {
    mat4 viewProjection, inverseViewProjection, lightViewProjection;
    vec4 cameraPosition, keyDirectionIntensity, fillDirectionIntensity;
    vec4 ambientExposure, viewport, effects, studioParameters;
    vec4 errorBodyBounds;
    vec4 characterStudio;
    vec4 shadowParameters;
    vec4 searchLensCenterRadius, searchLensRight, searchLensUp, searchLensStyle, searchLensOptics;
    vec4 thinkingLightPositionStrength, thinkingLightColorRadius;
};
uniform FrameBlock f;
struct DrawBlock {
    mat4 world, normalMatrix;
    vec4 colorRoughness, parameters, referencePose, emissiveMetallic, coverage;
    vec4 eyeCurveOriginAmount, eyeCurveRightWidth, eyeCurveUp;
    vec4 paletteBounds;
    vec4 paletteClosure;
    vec4 paletteReference;
    vec4 fur, furEye0, furEye1, signatureDeform;
};
uniform DrawBlock d;
vec4 computerProjection(vec3 world);
// AUTHORED_COMPUTER_INTERFACE_V1
#ifdef AUTHORED_COMPUTER
flat out highp int avatarInstanceIndex;
// AUTHORED_COMPUTER_OCCLUSION_V1
flat out highp vec2 avatarCanvasOffset;
vec4 avatarComputerCamera;
vec4 avatarComputerReference,avatarComputerCoverage,avatarComputerEye0,avatarComputerEye1;
#else
#define avatarComputerReference d.referencePose
#define avatarComputerCoverage d.coverage
#define avatarComputerEye0 d.eyeCurveOriginAmount
#define avatarComputerEye1 d.eyeCurveRightWidth
#endif
#ifndef AUTHORED_MOTION
#define avatarParameters d.parameters
#define avatarSignatureDeform d.signatureDeform
#endif
out vec4 furSurface;
out vec3 furNormal;
out vec4 furLight;
out vec4 furArea0, furArea1, furArea2;
out vec3 worldPosition, worldNormal;
out vec2 responseGains;
out vec2 paletteUV;
out vec4 surfaceGeometry;
out vec3 paletteCoverageNormal;
out vec4 shadowPosition;

// Shared low-order spine deformation. The inverse Jacobian keeps the pile
// and strand normals attached to the moving surface.
vec3 signaturePosition(vec3 p, vec4 bend) {
    if(bend.w<=0.) return p;
    float h=clamp((p.y-bend.z)/bend.w,0.,1.);
    return p+vec3(-bend.x,0,bend.y)*(h*h*bend.w*.5);
}
vec3 signatureNormal(vec3 n, vec3 p, vec4 bend) {
    if(bend.w<=0.) return n;
    float h=clamp((p.y-bend.z)/bend.w,0.,1.);
    n.y+=h*(bend.x*n.x-bend.y*n.z);
    return normalize(n);
}

// BEGIN GENERATED FELIPE
#ifdef FELIPE_MATERIAL
uniform highp sampler2D furLTC1,furLTC2;
const float PI=3.14159265358979323846;
vec3 directLight(vec3 n, vec3 v, vec3 l, vec3 albedo, float roughness, float reflectance, float specularStrength, float metallic) {
    float nl = max(dot(n,l),0.), nv = max(dot(n,v),.001);
    vec3 h = normalize(l+v);
    float nh = max(dot(n,h),0.), vh = max(dot(v,h),0.);
    // Approximate the finite width of the studio source in the specular lobe.
    // Material roughness still varies, while smooth surfaces keep soft highlights.
    float materialAlpha = roughness*roughness;
    float alpha = min(1.,sqrt(materialAlpha*materialAlpha+.20*.20)), a2 = alpha*alpha;
    float denominator = nh*nh*(a2-1.)+1.;
    float distribution = a2/(PI*denominator*denominator);
    float visibility = .5 / max(nl*sqrt(nv*nv*(1.-a2)+a2) + nv*sqrt(nl*nl*(1.-a2)+a2),.00001);
    float f0 = .16*reflectance*reflectance;
    if (metallic > 0.) {
        vec3 metalF0 = mix(vec3(f0),albedo,metallic);
        vec3 fresnel = metalF0+(1.-metalF0)*pow(1.-vh,5.);
        return (albedo*(1.-metalF0)*(1.-metallic)/PI+distribution*visibility*fresnel*specularStrength)*nl;
    }
    float fresnel = f0+(1.-f0)*pow(1.-vh,5.);
    return (albedo*(1.-f0)/PI + distribution*visibility*fresnel*specularStrength) * nl;
}
vec3 felipeLTCEdge(vec3 a,vec3 b){float x=dot(a,b),y=abs(x);float v=(.8543985+(.4965155+.0145206*y)*y)/(3.417594+(4.1616724+y)*y);return cross(a,b)*(x>0.?v:.5*inversesqrt(max(1.-x*x,1e-7))-v);}
float felipeLTC(vec3 p,mat3 transform,highp vec3 rect[4]) {
    if(dot(cross(rect[1]-rect[0],rect[3]-rect[0]),p-rect[0])<0.)return 0.;
    vec3 a=normalize(transform*(rect[0]-p)),b=normalize(transform*(rect[1]-p));
    vec3 c=normalize(transform*(rect[2]-p)),d=normalize(transform*(rect[3]-p));
    vec3 ff=felipeLTCEdge(a,b)+felipeLTCEdge(b,c)+felipeLTCEdge(c,d)+felipeLTCEdge(d,a);
    float len=length(ff);return max((len*len+ff.z)/(len+1.),0.);
}
vec2 felipeRect(vec3 p,mat3 diffuseBasis,mat3 specularBasis,float fresnel,
                  vec3 light,vec2 size,float intensity) {
    vec3 z=normalize(light),right=normalize(cross(vec3(0,1,0),z))*size.x*.5;
    vec3 up=normalize(cross(z,right))*size.y*.5;
    highp vec3 rect[4];rect[0]=light+right-up;rect[1]=light-right-up;rect[2]=light-right+up;rect[3]=light+right+up;
    return intensity*vec2(felipeLTC(p,diffuseBasis,rect),fresnel*felipeLTC(p,specularBasis,rect));
}
// Lighting vectors are finite and bounded by the character/light rig. Use
// GPU math intrinsics here, retaining precise geometry and optical calculations.
// RGB is diffuse irradiance, W is the achromatic dielectric reflection.
// The same roughness/view lookup and tangent basis serve all three soft lights.
float felipeSpecular(vec3 n,vec3 v,vec3 l,float roughness) {
    float nl=max(dot(n,l),0.),nv=max(dot(n,v),.001);
    vec3 h=normalize(l+v);
    float nh=max(dot(n,h),0.),vh=max(dot(v,h),0.);
    float alpha=roughness*roughness,a2=alpha*alpha;
    float denominator=nh*nh*(a2-1.)+1.;
    float distribution=a2/(PI*denominator*denominator);
    float visibility=.5/max(nl*sqrt(nv*nv*(1.-a2)+a2)+nv*sqrt(nl*nl*(1.-a2)+a2),.00001);
    float fresnel=.04+.96*exp2((-5.55473*vh-6.98316)*vh);
    return nl*distribution*visibility*fresnel;
}
vec4 felipeLighting(vec3 n,vec3 view,vec3 p,float roughness) {

    vec2 uv=vec2(roughness,sqrt(1.-clamp(dot(n,view),0.,1.)))*(63./64.)+.5/64.;
    vec4 a=textureLod(furLTC1,uv,0.),b=textureLod(furLTC2,uv,0.);
    vec3 tangent=view-n*dot(view,n);
    if(dot(tangent,tangent)<1e-8)tangent=cross(n,abs(n.y)<.95?vec3(0,1,0):vec3(1,0,0));
    tangent=normalize(tangent);
    mat3 diffuseBasis=transpose(mat3(tangent,-cross(n,tangent),n));
    mat3 specularBasis=mat3(vec3(a.x,0,a.y),vec3(0,1,0),vec3(a.z,0,a.w))*diffuseBasis;
    float fresnel=.04*b.x+.96*b.y;
    vec2 area=felipeRect(p,diffuseBasis,specularBasis,fresnel,vec3(-6,7,1),vec2(5,6),.2);
    area+=felipeRect(p,diffuseBasis,specularBasis,fresnel,vec3(5,1,-2),vec2(4,7),1.3);
    area+=felipeRect(p,diffuseBasis,specularBasis,fresnel,vec3(0,-5,-1),vec2(5,3),1.);
    vec3 key=normalize(vec3(-5,7,6));
    vec3 hemi=mix(vec3(.6867,.7682,.8714),vec3(1),dot(n,vec3(0,1,0))*.5+.5)*.35;
    vec3 diffuse=(1.8+hemi)/PI+vec3(1./PI*max(dot(n,key),0.)*1.85+area.x);
    float specular=felipeSpecular(n,view,key,roughness)*1.85+area.y;
    return vec4(diffuse,specular);
}
vec4 furAreaVector(vec3 p,vec3 light,vec2 size,float intensity) {
    vec3 z=normalize(light),right=normalize(cross(vec3(0,1,0),z))*size.x*.5;
    vec3 up=normalize(cross(z,right))*size.y*.5;
    vec3 a=normalize(light+right-up-p),b=normalize(light-right-up-p);
    vec3 c=normalize(light-right+up-p),e=normalize(light+right+up-p);
    vec3 ff=felipeLTCEdge(a,b)+felipeLTCEdge(b,c)+felipeLTCEdge(c,e)+felipeLTCEdge(e,a);
    float len=length(ff);
    return vec4(-ff/(len+1.)*intensity,len*len/(len+1.)*intensity);
}

#endif
// END GENERATED FELIPE

vec4 computerProjection(vec3 world) {
#ifdef AUTHORED_COMPUTER
    if(avatarComputerCamera.w<=0.) return vec4(2,2,2,1);
    world.xy=world.xy*avatarComputerCamera.xy+vec2(0,avatarComputerCamera.z);
#endif
    return crowdProjection*vec4(world.xy+instanceOffset,world.z,1);
}
void main() {
#ifdef AUTHORED_COMPUTER
avatarComputerCamera=texelFetch(instancePose,ivec2(9,gl_InstanceID),0);
if(avatarComputerCamera.w<=0.) {gl_Position=vec4(2,2,2,1);return;}
avatarComputerReference=texelFetch(instancePose,ivec2(7,gl_InstanceID),0);
avatarComputerCoverage=texelFetch(instancePose,ivec2(8,gl_InstanceID),0);
avatarComputerEye0=texelFetch(instancePose,ivec2(10,gl_InstanceID),0);
avatarComputerEye1=texelFetch(instancePose,ivec2(11,gl_InstanceID),0);
avatarInstanceIndex=gl_InstanceID;
avatarCanvasOffset=instanceOffset;
#endif
    #ifdef AUTHORED_MOTION
    avatarWorld=instanceMatrix;
    avatarNormal=mat4(texelFetch(instancePose,ivec2(0,gl_InstanceID),0),texelFetch(instancePose,ivec2(1,gl_InstanceID),0),texelFetch(instancePose,ivec2(2,gl_InstanceID),0),vec4(0,0,0,1));
    avatarParameters=texelFetch(instancePose,ivec2(3,gl_InstanceID),0);
    avatarSignatureDeform=texelFetch(instancePose,ivec2(4,gl_InstanceID),0);
    avatarColorRoughness=texelFetch(instancePose,ivec2(5,gl_InstanceID),0);
    avatarPaletteClosure=texelFetch(instancePose,ivec2(6,gl_InstanceID),0);
#else
    avatarWorld=instanceMatrix*d.world;
    avatarNormal=instanceMatrix*d.normalMatrix;
#endif
    pigment=instancePigment;
    furLight=vec4(0.);
    vec3 p = position + delta0*avatarParameters.z + delta1*avatarParameters.w;
    vec3 n = normalize(normal+(normal0-normal)*avatarParameters.z+(normal1-normal)*avatarParameters.w);
    if (avatarComputerCoverage.z > .5) {
        mat4 deformation = skin.joints[skinJoints.x] * skinWeights.x
            + skin.joints[skinJoints.y] * skinWeights.y
            + skin.joints[skinJoints.z] * skinWeights.z
            + skin.joints[skinJoints.w] * skinWeights.w;
        p = (deformation * vec4(p,1.0)).xyz;
        n = normalize(mat3(deformation) * n);
    }
    furSurface = vec4(p,0);
    furNormal = n;
    vec3 paintNormal = n;
    n=signatureNormal(n,p,avatarSignatureDeform);
    p=signaturePosition(p,avatarSignatureDeform);
    vec4 world = avatarWorld*vec4(p,1.0);
    world.x += avatarParameters.y*sin(world.y*3.0);
    n = (avatarNormal*vec4(n,0.0)).xyz;
    n.y -= avatarParameters.y*3.0*cos(world.y*3.0)*n.x;
    worldPosition = world.xyz;
    worldNormal = normalize(n);
#if defined(FELIPE_KIND) && FELIPE_KIND == 1
    {
        furLight=felipeLighting(normalize(worldNormal),normalize(f.cameraPosition.xyz-worldPosition*f.cameraPosition.w),worldPosition,1.);
        furArea0=furAreaVector(worldPosition,vec3(-6,7,1),vec2(5,6),.2);
        furArea1=furAreaVector(worldPosition,vec3(5,1,-2),vec2(4,7),1.3);
        furArea2=furAreaVector(worldPosition,vec3(0,-5,-1),vec2(5,3),1.);
    }
#endif
    // Keep depth scaling in the reference normal while removing body rotation.
    vec3 inverseScale = vec3(length(avatarNormal[0].xyz), length(avatarNormal[1].xyz), length(avatarNormal[2].xyz));
    paletteCoverageNormal = normalize(paintNormal * inverseScale);
    responseGains = avatarComputerReference.w == -34.0 ? world.xy : authoredResponse;
    vec3 paintPosition = d.paletteReference.x > .5 ? position+delta1 : p;
    paletteUV = (paintPosition.xy-d.paletteBounds.xy)*d.paletteBounds.zw+.5;
    surfaceGeometry = paletteGeometry;
    if (d.paletteReference.x > .5) surfaceGeometry.yzw = paintNormal;
    shadowPosition = f.lightViewProjection*world;
#ifdef SHADOW_PASS
    gl_Position = shadowPosition;
#else
    gl_Position = computerProjection(world.xyz);
#endif
}
`,Ql=`precision highp float;
in vec3 pigment;
uniform vec2 outputInverse;
precision highp sampler2DShadow;
in vec4 furSurface;
in vec3 furNormal;
in vec4 furLight;
in vec4 furArea0, furArea1, furArea2;
in vec3 worldPosition, worldNormal;
in vec2 responseGains;
in vec2 paletteUV;
in vec4 surfaceGeometry;
in vec3 paletteCoverageNormal;
in vec4 shadowPosition;
struct FrameBlock {
    mat4 viewProjection, inverseViewProjection, lightViewProjection;
    vec4 cameraPosition, keyDirectionIntensity, fillDirectionIntensity;
    vec4 ambientExposure, viewport, effects, studioParameters;
    vec4 errorBodyBounds;
    vec4 characterStudio;
    vec4 shadowParameters;
    vec4 searchLensCenterRadius, searchLensRight, searchLensUp, searchLensStyle, searchLensOptics;
    vec4 thinkingLightPositionStrength, thinkingLightColorRadius;
};
uniform FrameBlock f;
struct DrawBlock {
    mat4 world, normalMatrix;
    vec4 colorRoughness, parameters, referencePose, emissiveMetallic, coverage;
    vec4 eyeCurveOriginAmount, eyeCurveRightWidth, eyeCurveUp;
    vec4 paletteBounds;
    vec4 paletteClosure;
    vec4 paletteReference;
    vec4 fur, furEye0, furEye1, signatureDeform;
};
uniform DrawBlock d;
// AUTHORED_COMPUTER_INTERFACE_V1
#ifdef AUTHORED_COMPUTER
flat in highp int avatarInstanceIndex;
// AUTHORED_COMPUTER_OCCLUSION_V1
flat in highp vec2 avatarCanvasOffset;
uniform mat4 crowdInverseProjection;
vec4 avatarComputerCamera;
uniform highp sampler2D instancePose;
mat4 avatarComputerWorld,avatarComputerNormal;
vec4 avatarComputerParameters;
vec4 avatarComputerReference,avatarComputerCoverage,avatarComputerEye0,avatarComputerEye1;
#else
#define avatarComputerReference d.referencePose
#define avatarComputerCoverage d.coverage
#define avatarComputerEye0 d.eyeCurveOriginAmount
#define avatarComputerEye1 d.eyeCurveRightWidth
#define avatarComputerWorld d.world
#define avatarComputerNormal d.normalMatrix
#define avatarComputerParameters d.parameters
#endif
#ifdef AUTHORED_MOTION
flat in vec4 avatarColorRoughness, avatarPaletteClosure;
#else
#define avatarColorRoughness d.colorRoughness
#define avatarPaletteClosure d.paletteClosure
#endif
uniform sampler2DShadow shadowMap;
uniform highp sampler2D shadowDepth;
uniform highp sampler2D occlusionDepth;
uniform sampler2D ambientOcclusion;
uniform sampler2D environmentBRDF;
uniform highp sampler3D studioLighting;
uniform highp sampler2D paletteField;
out vec4 outputColor;
const float PI = 3.14159265358979323846;
// Published Khronos PBR Neutral equations, also used by the Metal shader.
// Tone mapping adaptation: Copyright 2024 The Khronos Group, Inc.
// Apache-2.0. See third_party/khronos/NOTICE.txt for source and changes.
vec3 neutralTone(vec3 c) {
    float minimum = min(c.x,min(c.y,c.z));
    c -= minimum < .08 ? minimum - 6.25*minimum*minimum : .04;
    float peak = max(c.x,max(c.y,c.z));
    if (peak < .76) return c;
    float mapped = 1.0-.24*.24/(peak+.24-.76);
    c *= mapped/peak;
    return mix(c,vec3(mapped),1.0-1.0/(.15*(peak-mapped)+1.0));
}
vec3 encodeSRGB(vec3 c) {
    c = max(c,vec3(0.0));
    return mix(1.055*pow(c,vec3(1.0/2.4))-.055,12.92*c,lessThanEqual(c,vec3(.0031308)));
}
vec3 studioTone(vec3 c) {
    // Compress each highlight channel smoothly. Scaling the entire color by
    // its peak flattens the shading of saturated painted surfaces.
    c = max(c,vec3(0.));
    vec3 shoulder = max(c-.95,vec3(0.));
    return mix(.95+shoulder/(1.+shoulder/.05),c,lessThanEqual(c,vec3(.95)));
}
vec3 studioResponse(vec3 n, float roughness) {
    float mu = clamp(n.z,0.,1.);
    float rootMu = pow(mu,1./3.);
    float mappedMu = rootMu / (rootMu+pow(1.-mu,1./3.));
    vec3 size = vec3(textureSize(studioLighting,0));
    // Keep a table knot exactly at the BRDF's NdotV visibility clamp.
    const float clampKnot = .09093665666234321;
    float knot = floor((size.y-1.)*.125+.5);
    float row = mappedMu <= clampKnot ? knot*mappedMu/clampKnot
        : knot+(size.y-1.-knot)*(mappedMu-clampKnot)/(1.-clampKnot);
    float roughnessCoordinate = log(roughness/.045)/3.101092789211817;
    vec3 coordinate = vec3(atan(n.y,n.x)/(2.*PI),
        (.5+row)/size.y,
        (.5+(size.z-1.)*roughnessCoordinate)/size.z);
    return texture(studioLighting,coordinate).rgb;
}
vec3 directLight(vec3 n, vec3 v, vec3 l, vec3 albedo, float roughness, float reflectance, float specularStrength, float metallic) {
    float nl = max(dot(n,l),0.0), nv = max(dot(n,v),.001);
    vec3 h = normalize(l+v);
    float nh = max(dot(n,h),0.0), vh = max(dot(v,h),0.0);
    // Approximate the finite width of the studio source in the specular lobe.
    // Material roughness still varies, while smooth surfaces keep soft highlights.
    float materialAlpha = roughness*roughness;
    float alpha = min(1.0,sqrt(materialAlpha*materialAlpha+.20*.20)), a2 = alpha*alpha;
    float denominator = nh*nh*(a2-1.0)+1.0;
    float distribution = a2/(PI*denominator*denominator);
    float visibility = .5/max(nl*sqrt(nv*nv*(1.0-a2)+a2)+nv*sqrt(nl*nl*(1.0-a2)+a2),.00001);
    float f0 = .16*reflectance*reflectance;
    if (metallic > 0.0) {
        vec3 metalF0 = mix(vec3(f0),albedo,metallic);
        vec3 fresnel = metalF0+(1.0-metalF0)*pow(1.0-vh,5.0);
        return (albedo*(1.0-metalF0)*(1.0-metallic)/PI+distribution*visibility*fresnel*specularStrength)*nl;
    }
    float fresnel = f0+(1.0-f0)*pow(1.0-vh,5.0);
    return (albedo*(1.0-f0)/PI+distribution*visibility*fresnel*specularStrength)*nl;
}
// BEGIN GENERATED PALETTE FINISHES
uniform highp sampler2D referencePalette;
// Generated from the authored Figma finish recipes. Edit the JSON and regenerate.
bool paletteUsesAuthoredFinish(float index) { return index > 10.5; }
bool paletteUsesAuthoredBodyFinish(float index) { return abs(index-45.0) < .5 || abs(index-46.0) < .5 || abs(index-47.0) < .5 || abs(index-48.0) < .5 || abs(index-49.0) < .5 || abs(index-50.0) < .5 || abs(index-51.0) < .5 || abs(index-52.0) < .5 || abs(index-64.0) < .5 || abs(index-65.0) < .5 || abs(index-66.0) < .5 || abs(index-67.0) < .5 || abs(index-68.0) < .5 || abs(index-69.0) < .5 || abs(index-70.0) < .5 || abs(index-71.0) < .5 || abs(index-72.0) < .5 || abs(index-73.0) < .5 || abs(index-74.0) < .5 || abs(index-75.0) < .5 || abs(index-76.0) < .5 || abs(index-77.0) < .5 || abs(index-78.0) < .5; }
// Preserve frontal paint while replacing stretched side highlights with physical lighting.
float paletteAuthoredBodyWeight(vec3 referenceNormal, vec3 worldNormal, vec3 viewDirection, vec3 referenceForward) {
    float referenceCoverage = max(normalize(referenceNormal).z,0.0);
    float currentCoverage = max(dot(worldNormal,viewDirection),0.0);
    // Equal zero coverage is the reference appearance at a tangent.
    float ratio = clamp((referenceCoverage+.000001)/(currentCoverage+.000001),0.0,1.0);
    float alignment = clamp(dot(normalize(referenceForward),viewDirection),0.0,1.0);
    float viewWeight = alignment*alignment*(3.0-2.0*alignment);
    return ratio*ratio*(3.0-2.0*ratio)*viewWeight;
}
vec3 paletteStoredField(vec2 uv) { return texture(paletteField,uv).rgb; }
vec3 paletteReferenceField(float index, vec2 uv) {
    float recipe = index-128.0, row = floor(recipe/9.0);
    vec2 origin = vec2(recipe-row*9.0,row)*64.0;
    vec2 st = (origin+clamp(uv*64.0,vec2(.5),vec2(63.5)))/vec2(576.0,960.0);
    return texture(referencePalette,st).rgb;
}
vec4 palettePremultiply(vec4 color) { return vec4(color.rgb*color.a,color.a); }
vec4 paletteUnpremultiply(vec4 color) { return vec4(color.rgb/max(color.a,.000001),color.a); }
float paletteLinearChannel(float value) {
    return value <= .04045 ? value/12.92 : pow((value+.055)/1.055,2.4);
}
vec3 paletteLinear(vec3 color) { return vec3(paletteLinearChannel(color.r),paletteLinearChannel(color.g),paletteLinearChannel(color.b)); }
vec3 paletteOKLab(vec3 linear) {
    vec3 lms = vec3(dot(linear,vec3(.4122214708,.5363325363,.0514459929)),dot(linear,vec3(.2119034982,.6806995451,.1073969566)),dot(linear,vec3(.0883024619,.2817188376,.6299787005)));
    lms = pow(max(lms,vec3(0.0)),vec3(1.0/3.0));
    return vec3(dot(lms,vec3(.2104542553,.7936177850,-.0040720468)),dot(lms,vec3(1.9779984951,-2.4285922050,.4505937099)),dot(lms,vec3(.0259040371,.7827717662,-.8086757660)));
}
vec3 paletteFromOKLab(vec3 lab) {
    vec3 lms = vec3(lab.x+.3963377774*lab.y+.2158037573*lab.z,lab.x-.1055613458*lab.y-.0638541728*lab.z,lab.x-.0894841775*lab.y-1.2914855480*lab.z);
    lms = lms*lms*lms;
    return vec3(dot(lms,vec3(4.0767416621,-3.3077115913,.2309699292)),dot(lms,vec3(-1.2684380046,2.6097574011,-.3413193965)),dot(lms,vec3(-.0041960863,-.7034186147,1.7076147010)));
}
bool paletteInGamut(vec3 color) {
    return min(color.r,min(color.g,color.b)) >= -.000001 && max(color.r,max(color.g,color.b)) <= 1.000001;
}
vec3 paletteTintShape(vec3 paint, vec3 source, vec3 target) {
    vec3 delta = abs(source-target);
    if (max(delta.r,max(delta.g,delta.b)) < .000001) return paint;
    vec3 color = paletteOKLab(paint), origin = paletteOKLab(source), tint = paletteOKLab(target);
    // A pigment change shifts logit lightness by one constant. It
    // preserves the complete highlight/shadow field without clipping.
    float sourceL = clamp(origin.x,.0001,.9999);
    float targetL = clamp(tint.x,.0001,.9999);
    float lightness = clamp(color.x,0.0,1.0);
    float numerator = lightness*targetL*(1.0-sourceL);
    float mappedL = numerator/max(numerator+sourceL*(1.0-targetL)*(1.0-lightness),.00000001);
    float sourceChroma = dot(origin.yz,origin.yz);
    vec2 ab = tint.yz;
    if (sourceChroma > .00000001) {
        vec2 rotation = vec2(dot(origin.yz,tint.yz),origin.y*tint.z-origin.z*tint.y)/sourceChroma;
        ab = vec2(rotation.x*color.y-rotation.y*color.z,rotation.y*color.y+rotation.x*color.z);
    }
    vec3 result = paletteFromOKLab(vec3(mappedL,ab));
    if (!paletteInGamut(result)) {
        // Fit chroma while keeping the lighting fixed. Clipping RGB
        // directly would erase highlights on yellow and other brights.
        float low = 0.0, high = 1.0;
        for (int iteration = 0; iteration < 8; ++iteration) {
            float middle = (low+high)*.5;
            if (paletteInGamut(paletteFromOKLab(vec3(mappedL,ab*middle)))) low = middle;
            else high = middle;
        }
        result = paletteFromOKLab(vec3(mappedL,ab*low));
    }
    return clamp(result,0.0,1.0);
}
// Gaussian convolution of the authored centered stroke, clipped by the mesh.
float paletteGaussianCDF(float x) {
    float a = abs(x), t = 1.0/(1.0+.2316419*a);
    float tail = .3989422804*exp(-.5*a*a)*t*(.319381530+t*(-.356563782+t*(1.781477937+t*(-1.821255978+t*1.330274429))));
    return x < 0.0 ? tail : 1.0-tail;
}
float paletteStroke(float distance, float width, float sigma, float alignment) {
    float low = -.5*width, high = .5*width;
    if (alignment > .5) { low = 0.0; high = width; }
    if (alignment < -.5) { low = -width; high = 0.0; }
    float blur = max(sigma,.00015);
    return max(0.0,paletteGaussianCDF((high-distance)/blur)-paletteGaussianCDF((low-distance)/blur));
}
float paletteSegmentDistance(vec2 p, vec2 a, vec2 b) {
    vec2 edge = b-a;
    return length(p-a-edge*clamp(dot(p-a,edge)/max(dot(edge,edge),.00000001),0.0,1.0));
}
// Pigment layers follow the surface, with live lighting applied afterward.
vec3 headphoneFinishAlbedo(float index, vec3 pigment, vec3 surfaceNormal) {
    if (abs(index-2.0) > .25 && abs(index-3.0) > .25) return pigment;
    float strength = index < 2.5 ? 0.55 : 1.0;
    vec2 uv = normalize(surfaceNormal).xy*.5+.5;
    vec3 paint = pigment;
    vec2 delta0 = uv-vec2(0.3,0.78);
    float alpha0 = strength*0.171280277*exp(-dot(delta0,delta0)/0.2312);
    vec3 low0 = ((16.0*paint-12.0)*paint+4.0)*paint;
    vec3 curve0 = mix(low0,sqrt(max(paint,vec3(0.0))),step(vec3(.25),paint));
    paint = mix(paint,paint+(2.0*0.78-1.0)*(curve0-paint),alpha0);
    vec2 delta1 = uv-vec2(0.72,0.18);
    float alpha1 = strength*0.187939262*exp(-dot(delta1,delta1)/0.3688);
    paint = mix(paint,paint*0.8,alpha1);
    return clamp(paint,0.0,1.0);
}
vec4 paletteBase0Stops(float t) {
    if (t <= 0.0) return vec4(1.0,1.0,0.992156863,1.0);
    if (t < 0.379999995) return mix(vec4(1.0,1.0,0.992156863,1.0),vec4(0.984313725,0.988235294,0.968627451,1.0),(t-0.0)/0.379999995);
    if (t < 0.720000029) return mix(vec4(0.984313725,0.988235294,0.968627451,1.0),vec4(0.945098039,0.952941176,0.917647059,1.0),(t-0.379999995)/0.340000033);
    if (t < 1.0) return mix(vec4(0.945098039,0.952941176,0.917647059,1.0),vec4(0.874509804,0.894117647,0.839215686,1.0),(t-0.720000029)/0.279999971);
    return vec4(0.874509804,0.894117647,0.839215686,1.0);
}
vec4 paletteBase0Raw(vec2 uv) {
    vec4 value = paletteBase0Stops(length(vec2(0.53191489*uv.x+0.0*uv.y+0.345744669,0.0*uv.x+0.53191489*uv.y+0.393617034)-vec2(.5))*2.0);
    return value;
}
vec4 paletteBase0(vec2 uv) { return paletteBase0Raw(uv); }
vec4 paletteBase1Stops(float t) {
    if (t <= 0.0) return vec4(0.952941176,0.960784314,0.949019608,1.0);
    if (t < 1.0) return mix(vec4(0.952941176,0.960784314,0.949019608,1.0),vec4(0.952941176,0.960784314,0.949019608,1.0),(t-0.0)/1.0);
    return vec4(0.952941176,0.960784314,0.949019608,1.0);
}
vec4 paletteBase1Raw(vec2 uv) {
    vec4 value = paletteBase1Stops(0.0);
    return value;
}
vec4 paletteBase1(vec2 uv) { return paletteBase1Raw(uv); }
vec4 paletteBase2Stops(float t) {
    if (t <= 0.0) return vec4(0.992156863,0.870588235,0.243137255,1.0);
    if (t < 0.379999995) return mix(vec4(0.992156863,0.870588235,0.243137255,1.0),vec4(0.992156863,0.850980392,0.196078431,1.0),(t-0.0)/0.379999995);
    if (t < 0.699999988) return mix(vec4(0.992156863,0.850980392,0.196078431,1.0),vec4(0.984313725,0.839215686,0.294117647,1.0),(t-0.379999995)/0.319999993);
    if (t < 1.0) return mix(vec4(0.984313725,0.839215686,0.294117647,1.0),vec4(0.941176471,0.752941176,0.223529412,1.0),(t-0.699999988)/0.300000012);
    return vec4(0.941176471,0.752941176,0.223529412,1.0);
}
vec4 paletteBase2Raw(vec2 uv) {
    vec4 value = paletteBase2Stops(length(vec2(0.625*uv.x+0.0*uv.y+0.287499994,0.0*uv.x+0.625*uv.y+0.287499994)-vec2(.5))*2.0);
    return value;
}
vec4 paletteBase2(vec2 uv) { return paletteBase2Raw(uv); }
vec4 paletteLayer2_0Stops(float t) {
    if (t <= 0.0) return vec4(1.0,0.968627451,0.749019608,0.699999988);
    if (t < 0.579999983) return mix(vec4(1.0,0.968627451,0.749019608,0.699999988),vec4(1.0,0.952941176,0.584313725,0.280000001),(t-0.0)/0.579999983);
    if (t < 1.0) return mix(vec4(1.0,0.952941176,0.584313725,0.280000001),vec4(1.0,0.945098039,0.584313725,0.0),(t-0.579999983)/0.420000017);
    return vec4(1.0,0.945098039,0.584313725,0.0);
}
vec4 paletteLayer2_0Raw(vec2 uv) {
    vec2 local = vec2(1.13666659*uv.x+0.0*uv.y+0.294999537,0.0*uv.x+1.06562511*uv.y+0.360937558);
    if (length((local-.5)*2.0) > 1.0) return vec4(0.0);
    vec4 value = paletteLayer2_0Stops(length(vec2(1.13666659*uv.x+0.0*uv.y+0.294999537,0.0*uv.x+1.06562511*uv.y+0.360937558)-vec2(.5))*2.0);
    return value;
}
vec4 paletteLayer2_0(vec2 uv) { return paletteLayer2_0Raw(uv); }
vec4 paletteLayer2_1Stops(float t) {
    if (t <= 0.0) return vec4(1.0,0.925490196,0.607843137,0.600000024);
    if (t < 1.0) return mix(vec4(1.0,0.925490196,0.607843137,0.600000024),vec4(1.0,0.929411765,0.615686275,0.0),(t-0.0)/1.0);
    return vec4(1.0,0.929411765,0.615686275,0.0);
}
vec4 paletteLayer2_1Raw(vec2 uv) {
    vec2 local = vec2(1.54999986*uv.x+0.0*uv.y+-0.87045455,0.0*uv.x+1.00294132*uv.y+0.0308822368);
    if (length((local-.5)*2.0) > 1.0) return vec4(0.0);
    vec4 value = paletteLayer2_1Stops(length(vec2(1.54999986*uv.x+0.0*uv.y+-0.87045455,0.0*uv.x+1.00294132*uv.y+0.0308822368)-vec2(.5))*2.0);
    return value;
}
vec4 paletteLayer2_1(vec2 uv) { return paletteLayer2_1Raw(uv); }
vec4 paletteRim2_0(float t) {
    if (t <= 0.0) return vec4(1.0,0.980392157,0.807843137,0.349999994);
    if (t < 1.0) return mix(vec4(1.0,0.980392157,0.807843137,0.349999994),vec4(1.0,0.980392157,0.807843137,0.349999994),(t-0.0)/1.0);
    return vec4(1.0,0.980392157,0.807843137,0.349999994);
}
float palettePath2_0(vec2 uv) {
    vec2 p = uv*vec2(0.991865127,1.0);
    float distance = 1.0;
    distance = min(distance,paletteSegmentDistance(p,vec2(0.991865127,0.5),vec2(0.990221111,0.5410078)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.990221111,0.5410078),vec2(0.985374163,0.5811026)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.985374163,0.5811026),vec2(0.977452037,0.6201558)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.977452037,0.6201558),vec2(0.966582188,0.6580387)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.966582188,0.6580387),vec2(0.952892267,0.6946226)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.952892267,0.6946226),vec2(0.936510027,0.7297788)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.936510027,0.7297788),vec2(0.917563023,0.7633787)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.917563023,0.7633787),vec2(0.896178906,0.7952935)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.896178906,0.7952935),vec2(0.872485332,0.8253946)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.872485332,0.8253946),vec2(0.846609951,0.8535534)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.846609951,0.8535534),vec2(0.818680219,0.8796411)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.818680219,0.8796411),vec2(0.788823988,0.903529)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.788823988,0.903529),vec2(0.757168811,0.9250885)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.757168811,0.9250885),vec2(0.723842241,0.9441909)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.723842241,0.9441909),vec2(0.688972033,0.9607075)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.688972033,0.9607075),vec2(0.652685738,0.9745097)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.652685738,0.9745097),vec2(0.615111011,0.9854687)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.615111011,0.9854687),vec2(0.576375503,0.9934558)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.576375503,0.9934558),vec2(0.53660687,0.9983425)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.53660687,0.9983425),vec2(0.495932663,1.0)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.495932663,1.0),vec2(0.455258456,0.9983425)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.455258456,0.9983425),vec2(0.415489822,0.9934558)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.415489822,0.9934558),vec2(0.376754315,0.9854687)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.376754315,0.9854687),vec2(0.339179587,0.9745097)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.339179587,0.9745097),vec2(0.302893293,0.9607075)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.302893293,0.9607075),vec2(0.268023084,0.9441909)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.268023084,0.9441909),vec2(0.234696515,0.9250885)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.234696515,0.9250885),vec2(0.203041338,0.903529)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.203041338,0.903529),vec2(0.173185007,0.8796411)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.173185007,0.8796411),vec2(0.145255375,0.8535534)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.145255375,0.8535534),vec2(0.119379895,0.8253946)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.119379895,0.8253946),vec2(0.0956862207,0.7952935)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.0956862207,0.7952935),vec2(0.0743021045,0.7633787)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.0743021045,0.7633787),vec2(0.0553551001,0.7297788)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.0553551001,0.7297788),vec2(0.0389728605,0.6946226)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.0389728605,0.6946226),vec2(0.0252829397,0.6580387)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.0252829397,0.6580387),vec2(0.0144130897,0.6201558)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.0144130897,0.6201558),vec2(0.00649096377,0.5811026)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.00649096377,0.5811026),vec2(0.00164401645,0.5410078)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.00164401645,0.5410078),vec2(0.0,0.5)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.0,0.5),vec2(0.00164401645,0.4589922)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.00164401645,0.4589922),vec2(0.00649096377,0.4188974)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.00649096377,0.4188974),vec2(0.0144130897,0.3798442)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.0144130897,0.3798442),vec2(0.0252829397,0.3419613)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.0252829397,0.3419613),vec2(0.0389728605,0.3053774)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.0389728605,0.3053774),vec2(0.0553551001,0.2702212)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.0553551001,0.2702212),vec2(0.0743021045,0.2366213)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.0743021045,0.2366213),vec2(0.0956862207,0.2047065)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.0956862207,0.2047065),vec2(0.119379895,0.1746054)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.119379895,0.1746054),vec2(0.145255375,0.1464466)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.145255375,0.1464466),vec2(0.173185007,0.1203589)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.173185007,0.1203589),vec2(0.203041338,0.096471)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.203041338,0.096471),vec2(0.234696515,0.0749115)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.234696515,0.0749115),vec2(0.268023084,0.0558091)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.268023084,0.0558091),vec2(0.302893293,0.0392925)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.302893293,0.0392925),vec2(0.339179587,0.0254903)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.339179587,0.0254903),vec2(0.376754315,0.0145313)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.376754315,0.0145313),vec2(0.415489822,0.0065442)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.415489822,0.0065442),vec2(0.455258456,0.0016575)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.455258456,0.0016575),vec2(0.495932663,0.0)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.495932663,0.0),vec2(0.53660687,0.0016575)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.53660687,0.0016575),vec2(0.576375503,0.0065442)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.576375503,0.0065442),vec2(0.615111011,0.0145313)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.615111011,0.0145313),vec2(0.652685738,0.0254903)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.652685738,0.0254903),vec2(0.688972033,0.0392925)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.688972033,0.0392925),vec2(0.723842241,0.0558091)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.723842241,0.0558091),vec2(0.757168811,0.0749115)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.757168811,0.0749115),vec2(0.788823988,0.096471)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.788823988,0.096471),vec2(0.818680219,0.1203589)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.818680219,0.1203589),vec2(0.846609951,0.1464466)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.846609951,0.1464466),vec2(0.872485332,0.1746054)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.872485332,0.1746054),vec2(0.896178906,0.2047065)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.896178906,0.2047065),vec2(0.917563023,0.2366213)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.917563023,0.2366213),vec2(0.936510027,0.2702212)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.936510027,0.2702212),vec2(0.952892267,0.3053774)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.952892267,0.3053774),vec2(0.966582188,0.3419613)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.966582188,0.3419613),vec2(0.977452037,0.3798442)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.977452037,0.3798442),vec2(0.985374163,0.4188974)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.985374163,0.4188974),vec2(0.990221111,0.4589922)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.990221111,0.4589922),vec2(0.991865127,0.5)));
    return distance;
}
vec4 paletteRim2_1(float t) {
    if (t <= 0.0) return vec4(1.0,0.980392157,0.82745098,0.200000003);
    if (t < 1.0) return mix(vec4(1.0,0.980392157,0.82745098,0.200000003),vec4(1.0,0.980392157,0.82745098,0.200000003),(t-0.0)/1.0);
    return vec4(1.0,0.980392157,0.82745098,0.200000003);
}
float palettePath2_1(vec2 uv) {
    vec2 p = uv*vec2(0.991865127,1.0);
    float distance = 1.0;
    distance = min(distance,paletteSegmentDistance(p,vec2(0.991865127,0.5),vec2(0.990221111,0.5410078)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.990221111,0.5410078),vec2(0.985374163,0.5811026)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.985374163,0.5811026),vec2(0.977452037,0.6201558)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.977452037,0.6201558),vec2(0.966582188,0.6580387)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.966582188,0.6580387),vec2(0.952892267,0.6946226)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.952892267,0.6946226),vec2(0.936510027,0.7297788)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.936510027,0.7297788),vec2(0.917563023,0.7633787)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.917563023,0.7633787),vec2(0.896178906,0.7952935)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.896178906,0.7952935),vec2(0.872485332,0.8253946)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.872485332,0.8253946),vec2(0.846609951,0.8535534)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.846609951,0.8535534),vec2(0.818680219,0.8796411)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.818680219,0.8796411),vec2(0.788823988,0.903529)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.788823988,0.903529),vec2(0.757168811,0.9250885)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.757168811,0.9250885),vec2(0.723842241,0.9441909)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.723842241,0.9441909),vec2(0.688972033,0.9607075)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.688972033,0.9607075),vec2(0.652685738,0.9745097)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.652685738,0.9745097),vec2(0.615111011,0.9854687)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.615111011,0.9854687),vec2(0.576375503,0.9934558)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.576375503,0.9934558),vec2(0.53660687,0.9983425)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.53660687,0.9983425),vec2(0.495932663,1.0)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.495932663,1.0),vec2(0.455258456,0.9983425)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.455258456,0.9983425),vec2(0.415489822,0.9934558)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.415489822,0.9934558),vec2(0.376754315,0.9854687)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.376754315,0.9854687),vec2(0.339179587,0.9745097)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.339179587,0.9745097),vec2(0.302893293,0.9607075)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.302893293,0.9607075),vec2(0.268023084,0.9441909)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.268023084,0.9441909),vec2(0.234696515,0.9250885)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.234696515,0.9250885),vec2(0.203041338,0.903529)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.203041338,0.903529),vec2(0.173185007,0.8796411)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.173185007,0.8796411),vec2(0.145255375,0.8535534)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.145255375,0.8535534),vec2(0.119379895,0.8253946)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.119379895,0.8253946),vec2(0.0956862207,0.7952935)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.0956862207,0.7952935),vec2(0.0743021045,0.7633787)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.0743021045,0.7633787),vec2(0.0553551001,0.7297788)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.0553551001,0.7297788),vec2(0.0389728605,0.6946226)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.0389728605,0.6946226),vec2(0.0252829397,0.6580387)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.0252829397,0.6580387),vec2(0.0144130897,0.6201558)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.0144130897,0.6201558),vec2(0.00649096377,0.5811026)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.00649096377,0.5811026),vec2(0.00164401645,0.5410078)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.00164401645,0.5410078),vec2(0.0,0.5)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.0,0.5),vec2(0.00164401645,0.4589922)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.00164401645,0.4589922),vec2(0.00649096377,0.4188974)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.00649096377,0.4188974),vec2(0.0144130897,0.3798442)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.0144130897,0.3798442),vec2(0.0252829397,0.3419613)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.0252829397,0.3419613),vec2(0.0389728605,0.3053774)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.0389728605,0.3053774),vec2(0.0553551001,0.2702212)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.0553551001,0.2702212),vec2(0.0743021045,0.2366213)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.0743021045,0.2366213),vec2(0.0956862207,0.2047065)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.0956862207,0.2047065),vec2(0.119379895,0.1746054)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.119379895,0.1746054),vec2(0.145255375,0.1464466)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.145255375,0.1464466),vec2(0.173185007,0.1203589)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.173185007,0.1203589),vec2(0.203041338,0.096471)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.203041338,0.096471),vec2(0.234696515,0.0749115)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.234696515,0.0749115),vec2(0.268023084,0.0558091)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.268023084,0.0558091),vec2(0.302893293,0.0392925)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.302893293,0.0392925),vec2(0.339179587,0.0254903)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.339179587,0.0254903),vec2(0.376754315,0.0145313)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.376754315,0.0145313),vec2(0.415489822,0.0065442)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.415489822,0.0065442),vec2(0.455258456,0.0016575)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.455258456,0.0016575),vec2(0.495932663,0.0)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.495932663,0.0),vec2(0.53660687,0.0016575)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.53660687,0.0016575),vec2(0.576375503,0.0065442)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.576375503,0.0065442),vec2(0.615111011,0.0145313)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.615111011,0.0145313),vec2(0.652685738,0.0254903)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.652685738,0.0254903),vec2(0.688972033,0.0392925)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.688972033,0.0392925),vec2(0.723842241,0.0558091)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.723842241,0.0558091),vec2(0.757168811,0.0749115)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.757168811,0.0749115),vec2(0.788823988,0.096471)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.788823988,0.096471),vec2(0.818680219,0.1203589)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.818680219,0.1203589),vec2(0.846609951,0.1464466)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.846609951,0.1464466),vec2(0.872485332,0.1746054)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.872485332,0.1746054),vec2(0.896178906,0.2047065)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.896178906,0.2047065),vec2(0.917563023,0.2366213)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.917563023,0.2366213),vec2(0.936510027,0.2702212)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.936510027,0.2702212),vec2(0.952892267,0.3053774)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.952892267,0.3053774),vec2(0.966582188,0.3419613)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.966582188,0.3419613),vec2(0.977452037,0.3798442)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.977452037,0.3798442),vec2(0.985374163,0.4188974)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.985374163,0.4188974),vec2(0.990221111,0.4589922)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.990221111,0.4589922),vec2(0.991865127,0.5)));
    return distance;
}
vec4 paletteBase3Stops(float t) {
    if (t <= 0.0) return vec4(1.0,1.0,1.0,1.0);
    if (t < 0.600000024) return mix(vec4(1.0,1.0,1.0,1.0),vec4(0.976470588,0.980392157,0.980392157,1.0),(t-0.0)/0.600000024);
    if (t < 1.0) return mix(vec4(0.976470588,0.980392157,0.980392157,1.0),vec4(0.721568627,0.737254902,0.737254902,1.0),(t-0.600000024)/0.399999976);
    return vec4(0.721568627,0.737254902,0.737254902,1.0);
}
vec4 paletteBase3Raw(vec2 uv) {
    vec4 value = paletteBase3Stops(length(vec2(0.625*uv.x+0.0*uv.y+0.28125,0.0*uv.x+0.625*uv.y+0.34375)-vec2(.5))*2.0);
    return value;
}
vec4 paletteBase3(vec2 uv) { return paletteBase3Raw(uv); }
vec4 paletteBase5Stops(float t) {
    if (t <= 0.0) return vec4(0.988235294,0.549019608,0.635294118,1.0);
    if (t < 0.280000001) return mix(vec4(0.988235294,0.549019608,0.635294118,1.0),vec4(0.992156863,0.509803922,0.603921569,1.0),(t-0.0)/0.280000001);
    if (t < 0.529999971) return mix(vec4(0.992156863,0.509803922,0.603921569,1.0),vec4(0.996078431,0.541176471,0.62745098,1.0),(t-0.280000001)/0.24999997);
    if (t < 0.800000012) return mix(vec4(0.996078431,0.541176471,0.62745098,1.0),vec4(0.992156863,0.57254902,0.654901961,1.0),(t-0.529999971)/0.270000041);
    if (t < 1.0) return mix(vec4(0.992156863,0.57254902,0.654901961,1.0),vec4(0.988235294,0.580392157,0.658823529,1.0),(t-0.800000012)/0.199999988);
    return vec4(0.988235294,0.580392157,0.658823529,1.0);
}
vec4 paletteBase5Raw(vec2 uv) {
    vec4 value = paletteBase5Stops(0.226523951*uv.x+1.0111779*uv.y+-0.15296641);
    return value;
}
vec4 paletteBase5(vec2 uv) { return paletteBase5Raw(uv); }
vec4 paletteLayer5_0Stops(float t) {
    if (t <= 0.0) return vec4(1.0,0.784313725,0.847058824,0.479999989);
    if (t < 1.0) return mix(vec4(1.0,0.784313725,0.847058824,0.479999989),vec4(1.0,0.784313725,0.847058824,0.0),(t-0.0)/1.0);
    return vec4(1.0,0.784313725,0.847058824,0.0);
}
vec4 paletteLayer5_0Raw(vec2 uv) {
    vec2 local = vec2(0.777751016*uv.x+0.0*uv.y+0.107706662,0.0*uv.x+0.963367475*uv.y+0.0132003189);
    if (local.x < 0.0 || local.x > 1.0 || local.y < 0.0 || local.y > 1.0) return vec4(0.0);
    vec4 value = paletteLayer5_0Stops(length(vec2(1.19730439*uv.x+-0.425432719*uv.y+-0.390689283,0.270161459*uv.x+1.33704129*uv.y+-0.656679688)-vec2(.5))*2.0);
    return value;
}
vec4 paletteLayer5_0(vec2 uv) { return paletteLayer5_0Raw(uv); }
vec4 paletteLayer5_1Stops(float t) {
    if (t <= 0.0) return vec4(1.0,0.819607843,0.870588235,0.200000003);
    if (t < 1.0) return mix(vec4(1.0,0.819607843,0.870588235,0.200000003),vec4(1.0,0.819607843,0.870588235,0.0),(t-0.0)/1.0);
    return vec4(1.0,0.819607843,0.870588235,0.0);
}
vec4 paletteLayer5_1Raw(vec2 uv) {
    vec2 local = vec2(0.777751016*uv.x+0.0*uv.y+0.107706662,0.0*uv.x+0.963367475*uv.y+0.0132003189);
    if (local.x < 0.0 || local.x > 1.0 || local.y < 0.0 || local.y > 1.0) return vec4(0.0);
    vec4 value = paletteLayer5_1Stops(length(vec2(1.84921286*uv.x+0.796777044*uv.y+-0.06436562,-0.419768936*uv.x+1.71320007*uv.y+-0.346986375)-vec2(.5))*2.0);
    return value;
}
vec4 paletteLayer5_1(vec2 uv) { return paletteLayer5_1Raw(uv); }
vec4 paletteLayer5_2Stops(float t) {
    if (t <= 0.0) return vec4(0.945098039,0.42745098,0.509803922,0.469999999);
    if (t < 1.0) return mix(vec4(0.945098039,0.42745098,0.509803922,0.469999999),vec4(0.945098039,0.42745098,0.509803922,0.0),(t-0.0)/1.0);
    return vec4(0.945098039,0.42745098,0.509803922,0.0);
}
vec4 paletteLayer5_2Raw(vec2 uv) {
    vec2 local = vec2(0.777751016*uv.x+0.0*uv.y+0.107706662,0.0*uv.x+0.963367475*uv.y+0.0132003189);
    if (local.x < 0.0 || local.x > 1.0 || local.y < 0.0 || local.y > 1.0) return vec4(0.0);
    vec4 value = paletteLayer5_2Stops(length(vec2(1.52558851*uv.x+0.0*uv.y+-0.334883087,0.0*uv.x+4.69641644*uv.y+-0.989219908)-vec2(.5))*2.0);
    return value;
}
vec4 paletteLayer5_2(vec2 uv) { return paletteLayer5_2Raw(uv); }
vec4 paletteLayer5_3Stops(float t) {
    if (t <= 0.0) return vec4(1.0,0.752941176,0.819607843,0.349999994);
    if (t < 1.0) return mix(vec4(1.0,0.752941176,0.819607843,0.349999994),vec4(1.0,0.752941176,0.819607843,0.0),(t-0.0)/1.0);
    return vec4(1.0,0.752941176,0.819607843,0.0);
}
vec4 paletteLayer5_3Raw(vec2 uv) {
    vec2 local = vec2(0.777751016*uv.x+0.0*uv.y+0.107706662,0.0*uv.x+0.963367475*uv.y+0.0132003189);
    if (local.x < 0.0 || local.x > 1.0 || local.y < 0.0 || local.y > 1.0) return vec4(0.0);
    vec4 value = paletteLayer5_3Stops(length(vec2(3.14759502*uv.x+1.77175898*uv.y+-0.753417304,-0.596094926*uv.x+1.86224729*uv.y+0.708991836)-vec2(.5))*2.0);
    return value;
}
vec4 paletteLayer5_3(vec2 uv) { return paletteLayer5_3Raw(uv); }
vec4 paletteRim5_0(float t) {
    if (t <= 0.0) return vec4(1.0,0.843137255,0.882352941,0.25);
    if (t < 1.0) return mix(vec4(1.0,0.843137255,0.882352941,0.25),vec4(1.0,0.843137255,0.882352941,0.25),(t-0.0)/1.0);
    return vec4(1.0,0.843137255,0.882352941,0.25);
}
vec4 paletteRim5_1(float t) {
    if (t <= 0.0) return vec4(0.850980392,0.0784313725,0.0784313725,0.150000006);
    if (t < 1.0) return mix(vec4(0.850980392,0.0784313725,0.0784313725,0.150000006),vec4(0.850980392,0.0784313725,0.0784313725,0.150000006),(t-0.0)/1.0);
    return vec4(0.850980392,0.0784313725,0.0784313725,0.150000006);
}
float palettePath5_1(vec2 uv) {
    vec2 p = uv*vec2(0.756133803,1.0);
    float distance = 1.0;
    distance = min(distance,paletteSegmentDistance(p,vec2(0.752040876,0.65122534),vec2(0.751558632,0.635142183)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.751558632,0.635142183),vec2(0.750127426,0.619270168)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.750127426,0.619270168),vec2(0.747770544,0.603628932)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.747770544,0.603628932),vec2(0.744511274,0.588238113)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.744511274,0.588238113),vec2(0.740372903,0.573117346)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.740372903,0.573117346),vec2(0.735378719,0.55828627)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.735378719,0.55828627),vec2(0.729552009,0.543764519)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.729552009,0.543764519),vec2(0.72291606,0.529571732)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.72291606,0.529571732),vec2(0.715494159,0.515727544)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.715494159,0.515727544),vec2(0.707309594,0.502251593)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.707309594,0.502251593),vec2(0.698385651,0.489163515)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.698385651,0.489163515),vec2(0.688745619,0.476482946)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.688745619,0.476482946),vec2(0.678412785,0.464229524)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.678412785,0.464229524),vec2(0.667410435,0.452422885)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.667410435,0.452422885),vec2(0.655761858,0.441082666)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.655761858,0.441082666),vec2(0.64349034,0.430228504)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.64349034,0.430228504),vec2(0.630619168,0.419880034)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.630619168,0.419880034),vec2(0.617171631,0.410056895)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.617171631,0.410056895),vec2(0.603171015,0.400778722)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.603171015,0.400778722),vec2(0.588640607,0.392065153)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.588640607,0.392065153),vec2(0.573603695,0.383935824)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.573603695,0.383935824),vec2(0.558083567,0.376410371)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.558083567,0.376410371),vec2(0.542103509,0.369508432)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.542103509,0.369508432),vec2(0.525686808,0.363249643)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.525686808,0.363249643),vec2(0.508856753,0.35765364)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.508856753,0.35765364),vec2(0.49163663,0.352740061)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.49163663,0.352740061),vec2(0.474049727,0.348528543)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.474049727,0.348528543),vec2(0.45611933,0.345038721)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.45611933,0.345038721),vec2(0.437868728,0.342290233)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.437868728,0.342290233),vec2(0.419321207,0.340302715)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.419321207,0.340302715),vec2(0.400500055,0.339095804)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.400500055,0.339095804),vec2(0.381428559,0.338689136)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.381428559,0.338689136),vec2(0.362357071,0.339095804)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.362357071,0.339095804),vec2(0.343535941,0.340302715)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.343535941,0.340302715),vec2(0.324988455,0.342290233)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.324988455,0.342290233),vec2(0.306737901,0.345038721)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.306737901,0.345038721),vec2(0.288807563,0.348528543)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.288807563,0.348528543),vec2(0.27122073,0.352740061)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.27122073,0.352740061),vec2(0.254000686,0.35765364)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.254000686,0.35765364),vec2(0.237170719,0.363249643)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.237170719,0.363249643),vec2(0.220754114,0.369508432)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.220754114,0.369508432),vec2(0.204774159,0.376410371)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.204774159,0.376410371),vec2(0.189254138,0.383935824)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.189254138,0.383935824),vec2(0.17421734,0.392065153)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.17421734,0.392065153),vec2(0.159687049,0.400778722)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.159687049,0.400778722),vec2(0.145686552,0.410056895)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.145686552,0.410056895),vec2(0.132239137,0.419880034)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.132239137,0.419880034),vec2(0.119368088,0.430228504)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.119368088,0.430228504),vec2(0.107096692,0.441082666)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.107096692,0.441082666),vec2(0.0954482362,0.452422885)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.0954482362,0.452422885),vec2(0.0844460062,0.464229524)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.0844460062,0.464229524),vec2(0.0741132886,0.476482946)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.0741132886,0.476482946),vec2(0.0644733695,0.489163515)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.0644733695,0.489163515),vec2(0.0555495354,0.502251593)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.0555495354,0.502251593),vec2(0.0473650726,0.515727544)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.0473650726,0.515727544),vec2(0.0399432674,0.529571732)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.0399432674,0.529571732),vec2(0.0333074062,0.543764519)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.0333074062,0.543764519),vec2(0.0274807753,0.55828627)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.0274807753,0.55828627),vec2(0.0224866609,0.573117346)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.0224866609,0.573117346),vec2(0.0183483496,0.588238113)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.0183483496,0.588238113),vec2(0.0150891275,0.603628932)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.0150891275,0.603628932),vec2(0.012732281,0.619270168)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.012732281,0.619270168),vec2(0.0113010965,0.635142183)));
    distance = min(distance,paletteSegmentDistance(p,vec2(0.0113010965,0.635142183),vec2(0.0108188602,0.65122534)));
    return distance;
}
vec4 paletteBase6Stops(float t) {
    if (t <= 0.0) return vec4(1.0,0.529411765,0.411764706,1.0);
    if (t < 0.379999995) return mix(vec4(1.0,0.529411765,0.411764706,1.0),vec4(0.984313725,0.439215686,0.321568627,1.0),(t-0.0)/0.379999995);
    if (t < 0.670000017) return mix(vec4(0.984313725,0.439215686,0.321568627,1.0),vec4(0.976470588,0.415686275,0.294117647,1.0),(t-0.379999995)/0.290000021);
    if (t < 1.0) return mix(vec4(0.976470588,0.415686275,0.294117647,1.0),vec4(0.933333333,0.368627451,0.243137255,1.0),(t-0.670000017)/0.329999983);
    return vec4(0.933333333,0.368627451,0.243137255,1.0);
}
vec4 paletteBase6Raw(vec2 uv) {
    vec4 value = paletteBase6Stops(0.61012888*uv.x+0.646755457*uv.y+-0.120181575);
    return value;
}
vec4 paletteBase6(vec2 uv) { return paletteBase6Raw(uv); }
vec4 paletteLayer6_0Stops(float t) {
    if (t <= 0.0) return vec4(0.658823529,0.223529412,0.125490196,0.319999993);
    if (t < 0.550000012) return mix(vec4(0.658823529,0.223529412,0.125490196,0.319999993),vec4(0.678431373,0.243137255,0.145098039,0.170000002),(t-0.0)/0.550000012);
    if (t < 1.0) return mix(vec4(0.678431373,0.243137255,0.145098039,0.170000002),vec4(0.729411765,0.262745098,0.168627451,0.0),(t-0.550000012)/0.449999988);
    return vec4(0.729411765,0.262745098,0.168627451,0.0);
}
vec4 paletteLayer6_0Raw(vec2 uv) {
    vec2 local = vec2(4.57826247*uv.x+0.0*uv.y+-1.98724332,0.0*uv.x+4.18287799*uv.y+-0.296631784);
    if (length((local-.5)*2.0) > 1.0) return vec4(0.0);
    vec4 value = paletteLayer6_0Stops(length(vec2(4.57826247*uv.x+0.0*uv.y+-1.98724332,0.0*uv.x+4.18287799*uv.y+-0.296631784)-vec2(.5))*2.0);
    return value;
}
vec4 paletteLayer6_0(vec2 uv) { return paletteLayer6_0Raw(uv); }
vec4 paletteLayer6_1Stops(float t) {
    if (t <= 0.0) return vec4(1.0,0.941176471,0.862745098,0.540000021);
    if (t < 0.460000008) return mix(vec4(1.0,0.941176471,0.862745098,0.540000021),vec4(1.0,0.815686275,0.68627451,0.25),(t-0.0)/0.460000008);
    if (t < 1.0) return mix(vec4(1.0,0.815686275,0.68627451,0.25),vec4(1.0,0.788235294,0.647058824,0.0),(t-0.460000008)/0.539999992);
    return vec4(1.0,0.788235294,0.647058824,0.0);
}
vec4 paletteLayer6_1Raw(vec2 uv) {
    vec2 local = vec2(4.94452331*uv.x+0.0*uv.y+-1.70622248,0.0*uv.x+4.49272098*uv.y+0.162877233);
    if (length((local-.5)*2.0) > 1.0) return vec4(0.0);
    vec4 value = paletteLayer6_1Stops(length(vec2(4.94452331*uv.x+0.0*uv.y+-1.70622248,0.0*uv.x+4.49272098*uv.y+0.162877233)-vec2(.5))*2.0);
    return value;
}
vec4 paletteLayer6_1(vec2 uv) { return paletteLayer6_1Raw(uv); }
vec4 paletteLayer6_2Stops(float t) {
    if (t <= 0.0) return vec4(0.658823529,0.223529412,0.125490196,0.319999993);
    if (t < 0.550000012) return mix(vec4(0.658823529,0.223529412,0.125490196,0.319999993),vec4(0.678431373,0.243137255,0.145098039,0.170000002),(t-0.0)/0.550000012);
    if (t < 1.0) return mix(vec4(0.678431373,0.243137255,0.145098039,0.170000002),vec4(0.729411765,0.262745098,0.168627451,0.0),(t-0.550000012)/0.449999988);
    return vec4(0.729411765,0.262745098,0.168627451,0.0);
}
vec4 paletteLayer6_2Raw(vec2 uv) {
    vec2 local = vec2(4.57826247*uv.x+0.0*uv.y+-2.83909565,0.0*uv.x+4.18287799*uv.y+-0.55525261);
    if (length((local-.5)*2.0) > 1.0) return vec4(0.0);
    vec4 value = paletteLayer6_2Stops(length(vec2(4.57826247*uv.x+0.0*uv.y+-2.83909565,0.0*uv.x+4.18287799*uv.y+-0.55525261)-vec2(.5))*2.0);
    return value;
}
vec4 paletteLayer6_2(vec2 uv) { return paletteLayer6_2Raw(uv); }
vec4 paletteLayer6_3Stops(float t) {
    if (t <= 0.0) return vec4(1.0,0.941176471,0.862745098,0.259200005);
    if (t < 0.460000008) return mix(vec4(1.0,0.941176471,0.862745098,0.259200005),vec4(1.0,0.815686275,0.68627451,0.119999997),(t-0.0)/0.460000008);
    if (t < 1.0) return mix(vec4(1.0,0.815686275,0.68627451,0.119999997),vec4(1.0,0.788235294,0.647058824,0.0),(t-0.460000008)/0.539999992);
    return vec4(1.0,0.788235294,0.647058824,0.0);
}
vec4 paletteLayer6_3Raw(vec2 uv) {
    vec2 local = vec2(4.94452331*uv.x+0.0*uv.y+-2.62622298,0.0*uv.x+4.49272098*uv.y+-0.114900702);
    if (length((local-.5)*2.0) > 1.0) return vec4(0.0);
    vec4 value = paletteLayer6_3Stops(length(vec2(4.94452331*uv.x+0.0*uv.y+-2.62622298,0.0*uv.x+4.49272098*uv.y+-0.114900702)-vec2(.5))*2.0);
    return value;
}
vec4 paletteLayer6_3(vec2 uv) { return paletteLayer6_3Raw(uv); }
vec4 paletteLayer6_4Stops(float t) {
    if (t <= 0.0) return vec4(0.658823529,0.223529412,0.125490196,0.319999993);
    if (t < 0.550000012) return mix(vec4(0.658823529,0.223529412,0.125490196,0.319999993),vec4(0.678431373,0.243137255,0.145098039,0.170000002),(t-0.0)/0.550000012);
    if (t < 1.0) return mix(vec4(0.678431373,0.243137255,0.145098039,0.170000002),vec4(0.729411765,0.262745098,0.168627451,0.0),(t-0.550000012)/0.449999988);
    return vec4(0.729411765,0.262745098,0.168627451,0.0);
}
vec4 paletteLayer6_4Raw(vec2 uv) {
    vec2 local = vec2(4.57826247*uv.x+0.0*uv.y+-3.48724417,0.0*uv.x+4.18287799*uv.y+-1.12421737);
    if (length((local-.5)*2.0) > 1.0) return vec4(0.0);
    vec4 value = paletteLayer6_4Stops(length(vec2(4.57826247*uv.x+0.0*uv.y+-3.48724417,0.0*uv.x+4.18287799*uv.y+-1.12421737)-vec2(.5))*2.0);
    return value;
}
vec4 paletteLayer6_4(vec2 uv) { return paletteLayer6_4Raw(uv); }
vec4 paletteLayer6_5Stops(float t) {
    if (t <= 0.0) return vec4(1.0,0.941176471,0.862745098,0.259200005);
    if (t < 0.460000008) return mix(vec4(1.0,0.941176471,0.862745098,0.259200005),vec4(1.0,0.815686275,0.68627451,0.119999997),(t-0.0)/0.460000008);
    if (t < 1.0) return mix(vec4(1.0,0.815686275,0.68627451,0.119999997),vec4(1.0,0.788235294,0.647058824,0.0),(t-0.460000008)/0.539999992);
    return vec4(1.0,0.788235294,0.647058824,0.0);
}
vec4 paletteLayer6_5Raw(vec2 uv) {
    vec2 local = vec2(4.94452331*uv.x+0.0*uv.y+-3.32622335,0.0*uv.x+4.49272098*uv.y+-0.726012159);
    if (length((local-.5)*2.0) > 1.0) return vec4(0.0);
    vec4 value = paletteLayer6_5Stops(length(vec2(4.94452331*uv.x+0.0*uv.y+-3.32622335,0.0*uv.x+4.49272098*uv.y+-0.726012159)-vec2(.5))*2.0);
    return value;
}
vec4 paletteLayer6_5(vec2 uv) { return paletteLayer6_5Raw(uv); }
vec4 paletteLayer6_6Stops(float t) {
    if (t <= 0.0) return vec4(0.658823529,0.223529412,0.125490196,0.319999993);
    if (t < 0.550000012) return mix(vec4(0.658823529,0.223529412,0.125490196,0.319999993),vec4(0.678431373,0.243137255,0.145098039,0.170000002),(t-0.0)/0.550000012);
    if (t < 1.0) return mix(vec4(0.678431373,0.243137255,0.145098039,0.170000002),vec4(0.729411765,0.262745098,0.168627451,0.0),(t-0.550000012)/0.449999988);
    return vec4(0.729411765,0.262745098,0.168627451,0.0);
}
vec4 paletteLayer6_6Raw(vec2 uv) {
    vec2 local = vec2(4.57826247*uv.x+0.0*uv.y+-3.67242946,0.0*uv.x+4.18287799*uv.y+-1.86559707);
    if (length((local-.5)*2.0) > 1.0) return vec4(0.0);
    vec4 value = paletteLayer6_6Stops(length(vec2(4.57826247*uv.x+0.0*uv.y+-3.67242946,0.0*uv.x+4.18287799*uv.y+-1.86559707)-vec2(.5))*2.0);
    return value;
}
vec4 paletteLayer6_6(vec2 uv) { return paletteLayer6_6Raw(uv); }
vec4 paletteLayer6_7Stops(float t) {
    if (t <= 0.0) return vec4(1.0,0.941176471,0.862745098,0.259200005);
    if (t < 0.460000008) return mix(vec4(1.0,0.941176471,0.862745098,0.259200005),vec4(1.0,0.815686275,0.68627451,0.119999997),(t-0.0)/0.460000008);
    if (t < 1.0) return mix(vec4(1.0,0.815686275,0.68627451,0.119999997),vec4(1.0,0.788235294,0.647058824,0.0),(t-0.460000008)/0.539999992);
    return vec4(1.0,0.788235294,0.647058824,0.0);
}
vec4 paletteLayer6_7Raw(vec2 uv) {
    vec2 local = vec2(4.94452331*uv.x+0.0*uv.y+-3.52622346,0.0*uv.x+4.49272098*uv.y+-1.52230777);
    if (length((local-.5)*2.0) > 1.0) return vec4(0.0);
    vec4 value = paletteLayer6_7Stops(length(vec2(4.94452331*uv.x+0.0*uv.y+-3.52622346,0.0*uv.x+4.49272098*uv.y+-1.52230777)-vec2(.5))*2.0);
    return value;
}
vec4 paletteLayer6_7(vec2 uv) { return paletteLayer6_7Raw(uv); }
vec4 paletteLayer6_8Stops(float t) {
    if (t <= 0.0) return vec4(0.658823529,0.223529412,0.125490196,0.319999993);
    if (t < 0.550000012) return mix(vec4(0.658823529,0.223529412,0.125490196,0.319999993),vec4(0.678431373,0.243137255,0.145098039,0.170000002),(t-0.0)/0.550000012);
    if (t < 1.0) return mix(vec4(0.678431373,0.243137255,0.145098039,0.170000002),vec4(0.729411765,0.262745098,0.168627451,0.0),(t-0.550000012)/0.449999988);
    return vec4(0.729411765,0.262745098,0.168627451,0.0);
}
vec4 paletteLayer6_8Raw(vec2 uv) {
    vec2 local = vec2(4.57826247*uv.x+0.0*uv.y+-3.48724417,0.0*uv.x+4.18287799*uv.y+-2.58973433);
    if (length((local-.5)*2.0) > 1.0) return vec4(0.0);
    vec4 value = paletteLayer6_8Stops(length(vec2(4.57826247*uv.x+0.0*uv.y+-3.48724417,0.0*uv.x+4.18287799*uv.y+-2.58973433)-vec2(.5))*2.0);
    return value;
}
vec4 paletteLayer6_8(vec2 uv) { return paletteLayer6_8Raw(uv); }
vec4 paletteLayer6_9Stops(float t) {
    if (t <= 0.0) return vec4(1.0,0.941176471,0.862745098,0.259200005);
    if (t < 0.460000008) return mix(vec4(1.0,0.941176471,0.862745098,0.259200005),vec4(1.0,0.815686275,0.68627451,0.119999997),(t-0.0)/0.460000008);
    if (t < 1.0) return mix(vec4(1.0,0.815686275,0.68627451,0.119999997),vec4(1.0,0.788235294,0.647058824,0.0),(t-0.460000008)/0.539999992);
    return vec4(1.0,0.788235294,0.647058824,0.0);
}
vec4 paletteLayer6_9Raw(vec2 uv) {
    vec2 local = vec2(4.94452331*uv.x+0.0*uv.y+-3.32622335,0.0*uv.x+4.49272098*uv.y+-2.30008599);
    if (length((local-.5)*2.0) > 1.0) return vec4(0.0);
    vec4 value = paletteLayer6_9Stops(length(vec2(4.94452331*uv.x+0.0*uv.y+-3.32622335,0.0*uv.x+4.49272098*uv.y+-2.30008599)-vec2(.5))*2.0);
    return value;
}
vec4 paletteLayer6_9(vec2 uv) { return paletteLayer6_9Raw(uv); }
vec4 paletteLayer6_10Stops(float t) {
    if (t <= 0.0) return vec4(0.658823529,0.223529412,0.125490196,0.319999993);
    if (t < 0.550000012) return mix(vec4(0.658823529,0.223529412,0.125490196,0.319999993),vec4(0.678431373,0.243137255,0.145098039,0.170000002),(t-0.0)/0.550000012);
    if (t < 1.0) return mix(vec4(0.678431373,0.243137255,0.145098039,0.170000002),vec4(0.729411765,0.262745098,0.168627451,0.0),(t-0.550000012)/0.449999988);
    return vec4(0.729411765,0.262745098,0.168627451,0.0);
}
vec4 paletteLayer6_10Raw(vec2 uv) {
    vec2 local = vec2(4.57826247*uv.x+0.0*uv.y+-2.83909565,0.0*uv.x+4.18287799*uv.y+-3.14145876);
    if (length((local-.5)*2.0) > 1.0) return vec4(0.0);
    vec4 value = paletteLayer6_10Stops(length(vec2(4.57826247*uv.x+0.0*uv.y+-2.83909565,0.0*uv.x+4.18287799*uv.y+-3.14145876)-vec2(.5))*2.0);
    return value;
}
vec4 paletteLayer6_10(vec2 uv) { return paletteLayer6_10Raw(uv); }
vec4 paletteLayer6_11Stops(float t) {
    if (t <= 0.0) return vec4(1.0,0.941176471,0.862745098,0.259200005);
    if (t < 0.460000008) return mix(vec4(1.0,0.941176471,0.862745098,0.259200005),vec4(1.0,0.815686275,0.68627451,0.119999997),(t-0.0)/0.460000008);
    if (t < 1.0) return mix(vec4(1.0,0.815686275,0.68627451,0.119999997),vec4(1.0,0.788235294,0.647058824,0.0),(t-0.460000008)/0.539999992);
    return vec4(1.0,0.788235294,0.647058824,0.0);
}
vec4 paletteLayer6_11Raw(vec2 uv) {
    vec2 local = vec2(4.94452331*uv.x+0.0*uv.y+-2.62622298,0.0*uv.x+4.49272098*uv.y+-2.89267779);
    if (length((local-.5)*2.0) > 1.0) return vec4(0.0);
    vec4 value = paletteLayer6_11Stops(length(vec2(4.94452331*uv.x+0.0*uv.y+-2.62622298,0.0*uv.x+4.49272098*uv.y+-2.89267779)-vec2(.5))*2.0);
    return value;
}
vec4 paletteLayer6_11(vec2 uv) { return paletteLayer6_11Raw(uv); }
vec4 paletteLayer6_12Stops(float t) {
    if (t <= 0.0) return vec4(0.658823529,0.223529412,0.125490196,0.319999993);
    if (t < 0.550000012) return mix(vec4(0.658823529,0.223529412,0.125490196,0.319999993),vec4(0.678431373,0.243137255,0.145098039,0.170000002),(t-0.0)/0.550000012);
    if (t < 1.0) return mix(vec4(0.678431373,0.243137255,0.145098039,0.170000002),vec4(0.729411765,0.262745098,0.168627451,0.0),(t-0.550000012)/0.449999988);
    return vec4(0.729411765,0.262745098,0.168627451,0.0);
}
vec4 paletteLayer6_12Raw(vec2 uv) {
    vec2 local = vec2(4.57826247*uv.x+0.0*uv.y+-1.98724332,0.0*uv.x+4.18287799*uv.y+-3.36559681);
    if (length((local-.5)*2.0) > 1.0) return vec4(0.0);
    vec4 value = paletteLayer6_12Stops(length(vec2(4.57826247*uv.x+0.0*uv.y+-1.98724332,0.0*uv.x+4.18287799*uv.y+-3.36559681)-vec2(.5))*2.0);
    return value;
}
vec4 paletteLayer6_12(vec2 uv) { return paletteLayer6_12Raw(uv); }
vec4 paletteLayer6_13Stops(float t) {
    if (t <= 0.0) return vec4(1.0,0.941176471,0.862745098,0.259200005);
    if (t < 0.460000008) return mix(vec4(1.0,0.941176471,0.862745098,0.259200005),vec4(1.0,0.815686275,0.68627451,0.119999997),(t-0.0)/0.460000008);
    if (t < 1.0) return mix(vec4(1.0,0.815686275,0.68627451,0.119999997),vec4(1.0,0.788235294,0.647058824,0.0),(t-0.460000008)/0.539999992);
    return vec4(1.0,0.788235294,0.647058824,0.0);
}
vec4 paletteLayer6_13Raw(vec2 uv) {
    vec2 local = vec2(4.94452331*uv.x+0.0*uv.y+-1.70622248,0.0*uv.x+4.49272098*uv.y+-3.13341866);
    if (length((local-.5)*2.0) > 1.0) return vec4(0.0);
    vec4 value = paletteLayer6_13Stops(length(vec2(4.94452331*uv.x+0.0*uv.y+-1.70622248,0.0*uv.x+4.49272098*uv.y+-3.13341866)-vec2(.5))*2.0);
    return value;
}
vec4 paletteLayer6_13(vec2 uv) { return paletteLayer6_13Raw(uv); }
vec4 paletteLayer6_14Stops(float t) {
    if (t <= 0.0) return vec4(0.658823529,0.223529412,0.125490196,0.319999993);
    if (t < 0.550000012) return mix(vec4(0.658823529,0.223529412,0.125490196,0.319999993),vec4(0.678431373,0.243137255,0.145098039,0.170000002),(t-0.0)/0.550000012);
    if (t < 1.0) return mix(vec4(0.678431373,0.243137255,0.145098039,0.170000002),vec4(0.729411765,0.262745098,0.168627451,0.0),(t-0.550000012)/0.449999988);
    return vec4(0.729411765,0.262745098,0.168627451,0.0);
}
vec4 paletteLayer6_14Raw(vec2 uv) {
    vec2 local = vec2(4.57826247*uv.x+0.0*uv.y+-1.13539099,0.0*uv.x+4.18287799*uv.y+-3.14145876);
    if (length((local-.5)*2.0) > 1.0) return vec4(0.0);
    vec4 value = paletteLayer6_14Stops(length(vec2(4.57826247*uv.x+0.0*uv.y+-1.13539099,0.0*uv.x+4.18287799*uv.y+-3.14145876)-vec2(.5))*2.0);
    return value;
}
vec4 paletteLayer6_14(vec2 uv) { return paletteLayer6_14Raw(uv); }
vec4 paletteLayer6_15Stops(float t) {
    if (t <= 0.0) return vec4(1.0,0.941176471,0.862745098,0.259200005);
    if (t < 0.460000008) return mix(vec4(1.0,0.941176471,0.862745098,0.259200005),vec4(1.0,0.815686275,0.68627451,0.119999997),(t-0.0)/0.460000008);
    if (t < 1.0) return mix(vec4(1.0,0.815686275,0.68627451,0.119999997),vec4(1.0,0.788235294,0.647058824,0.0),(t-0.460000008)/0.539999992);
    return vec4(1.0,0.788235294,0.647058824,0.0);
}
vec4 paletteLayer6_15Raw(vec2 uv) {
    vec2 local = vec2(4.94452331*uv.x+0.0*uv.y+-0.786221991,0.0*uv.x+4.49272098*uv.y+-2.89267779);
    if (length((local-.5)*2.0) > 1.0) return vec4(0.0);
    vec4 value = paletteLayer6_15Stops(length(vec2(4.94452331*uv.x+0.0*uv.y+-0.786221991,0.0*uv.x+4.49272098*uv.y+-2.89267779)-vec2(.5))*2.0);
    return value;
}
vec4 paletteLayer6_15(vec2 uv) { return paletteLayer6_15Raw(uv); }
vec4 paletteLayer6_16Stops(float t) {
    if (t <= 0.0) return vec4(0.658823529,0.223529412,0.125490196,0.319999993);
    if (t < 0.550000012) return mix(vec4(0.658823529,0.223529412,0.125490196,0.319999993),vec4(0.678431373,0.243137255,0.145098039,0.170000002),(t-0.0)/0.550000012);
    if (t < 1.0) return mix(vec4(0.678431373,0.243137255,0.145098039,0.170000002),vec4(0.729411765,0.262745098,0.168627451,0.0),(t-0.550000012)/0.449999988);
    return vec4(0.729411765,0.262745098,0.168627451,0.0);
}
vec4 paletteLayer6_16Raw(vec2 uv) {
    vec2 local = vec2(4.57826247*uv.x+0.0*uv.y+-0.48724247,0.0*uv.x+4.18287799*uv.y+-2.58973433);
    if (length((local-.5)*2.0) > 1.0) return vec4(0.0);
    vec4 value = paletteLayer6_16Stops(length(vec2(4.57826247*uv.x+0.0*uv.y+-0.48724247,0.0*uv.x+4.18287799*uv.y+-2.58973433)-vec2(.5))*2.0);
    return value;
}
vec4 paletteLayer6_16(vec2 uv) { return paletteLayer6_16Raw(uv); }
vec4 paletteLayer6_17Stops(float t) {
    if (t <= 0.0) return vec4(1.0,0.941176471,0.862745098,0.259200005);
    if (t < 0.460000008) return mix(vec4(1.0,0.941176471,0.862745098,0.259200005),vec4(1.0,0.815686275,0.68627451,0.119999997),(t-0.0)/0.460000008);
    if (t < 1.0) return mix(vec4(1.0,0.815686275,0.68627451,0.119999997),vec4(1.0,0.788235294,0.647058824,0.0),(t-0.460000008)/0.539999992);
    return vec4(1.0,0.788235294,0.647058824,0.0);
}
vec4 paletteLayer6_17Raw(vec2 uv) {
    vec2 local = vec2(4.94452331*uv.x+0.0*uv.y+-0.0862216162,0.0*uv.x+4.49272098*uv.y+-2.30008599);
    if (length((local-.5)*2.0) > 1.0) return vec4(0.0);
    vec4 value = paletteLayer6_17Stops(length(vec2(4.94452331*uv.x+0.0*uv.y+-0.0862216162,0.0*uv.x+4.49272098*uv.y+-2.30008599)-vec2(.5))*2.0);
    return value;
}
vec4 paletteLayer6_17(vec2 uv) { return paletteLayer6_17Raw(uv); }
vec4 paletteLayer6_18Stops(float t) {
    if (t <= 0.0) return vec4(0.658823529,0.223529412,0.125490196,0.319999993);
    if (t < 0.550000012) return mix(vec4(0.658823529,0.223529412,0.125490196,0.319999993),vec4(0.678431373,0.243137255,0.145098039,0.170000002),(t-0.0)/0.550000012);
    if (t < 1.0) return mix(vec4(0.678431373,0.243137255,0.145098039,0.170000002),vec4(0.729411765,0.262745098,0.168627451,0.0),(t-0.550000012)/0.449999988);
    return vec4(0.729411765,0.262745098,0.168627451,0.0);
}
vec4 paletteLayer6_18Raw(vec2 uv) {
    vec2 local = vec2(4.57826247*uv.x+0.0*uv.y+-0.30205718,0.0*uv.x+4.18287799*uv.y+-1.86559707);
    if (length((local-.5)*2.0) > 1.0) return vec4(0.0);
    vec4 value = paletteLayer6_18Stops(length(vec2(4.57826247*uv.x+0.0*uv.y+-0.30205718,0.0*uv.x+4.18287799*uv.y+-1.86559707)-vec2(.5))*2.0);
    return value;
}
vec4 paletteLayer6_18(vec2 uv) { return paletteLayer6_18Raw(uv); }
vec4 paletteLayer6_19Stops(float t) {
    if (t <= 0.0) return vec4(1.0,0.941176471,0.862745098,0.540000021);
    if (t < 0.460000008) return mix(vec4(1.0,0.941176471,0.862745098,0.540000021),vec4(1.0,0.815686275,0.68627451,0.25),(t-0.0)/0.460000008);
    if (t < 1.0) return mix(vec4(1.0,0.815686275,0.68627451,0.25),vec4(1.0,0.788235294,0.647058824,0.0),(t-0.460000008)/0.539999992);
    return vec4(1.0,0.788235294,0.647058824,0.0);
}
vec4 paletteLayer6_19Raw(vec2 uv) {
    vec2 local = vec2(4.94452331*uv.x+0.0*uv.y+0.113778491,0.0*uv.x+4.49272098*uv.y+-1.52230777);
    if (length((local-.5)*2.0) > 1.0) return vec4(0.0);
    vec4 value = paletteLayer6_19Stops(length(vec2(4.94452331*uv.x+0.0*uv.y+0.113778491,0.0*uv.x+4.49272098*uv.y+-1.52230777)-vec2(.5))*2.0);
    return value;
}
vec4 paletteLayer6_19(vec2 uv) { return paletteLayer6_19Raw(uv); }
vec4 paletteLayer6_20Stops(float t) {
    if (t <= 0.0) return vec4(0.658823529,0.223529412,0.125490196,0.319999993);
    if (t < 0.550000012) return mix(vec4(0.658823529,0.223529412,0.125490196,0.319999993),vec4(0.678431373,0.243137255,0.145098039,0.170000002),(t-0.0)/0.550000012);
    if (t < 1.0) return mix(vec4(0.678431373,0.243137255,0.145098039,0.170000002),vec4(0.729411765,0.262745098,0.168627451,0.0),(t-0.550000012)/0.449999988);
    return vec4(0.729411765,0.262745098,0.168627451,0.0);
}
vec4 paletteLayer6_20Raw(vec2 uv) {
    vec2 local = vec2(4.57826247*uv.x+0.0*uv.y+-0.48724247,0.0*uv.x+4.18287799*uv.y+-1.12421737);
    if (length((local-.5)*2.0) > 1.0) return vec4(0.0);
    vec4 value = paletteLayer6_20Stops(length(vec2(4.57826247*uv.x+0.0*uv.y+-0.48724247,0.0*uv.x+4.18287799*uv.y+-1.12421737)-vec2(.5))*2.0);
    return value;
}
vec4 paletteLayer6_20(vec2 uv) { return paletteLayer6_20Raw(uv); }
vec4 paletteLayer6_21Stops(float t) {
    if (t <= 0.0) return vec4(1.0,0.941176471,0.862745098,0.540000021);
    if (t < 0.460000008) return mix(vec4(1.0,0.941176471,0.862745098,0.540000021),vec4(1.0,0.815686275,0.68627451,0.25),(t-0.0)/0.460000008);
    if (t < 1.0) return mix(vec4(1.0,0.815686275,0.68627451,0.25),vec4(1.0,0.788235294,0.647058824,0.0),(t-0.460000008)/0.539999992);
    return vec4(1.0,0.788235294,0.647058824,0.0);
}
vec4 paletteLayer6_21Raw(vec2 uv) {
    vec2 local = vec2(4.94452331*uv.x+0.0*uv.y+-0.0862216162,0.0*uv.x+4.49272098*uv.y+-0.726012159);
    if (length((local-.5)*2.0) > 1.0) return vec4(0.0);
    vec4 value = paletteLayer6_21Stops(length(vec2(4.94452331*uv.x+0.0*uv.y+-0.0862216162,0.0*uv.x+4.49272098*uv.y+-0.726012159)-vec2(.5))*2.0);
    return value;
}
vec4 paletteLayer6_21(vec2 uv) { return paletteLayer6_21Raw(uv); }
vec4 paletteLayer6_22Stops(float t) {
    if (t <= 0.0) return vec4(0.658823529,0.223529412,0.125490196,0.319999993);
    if (t < 0.550000012) return mix(vec4(0.658823529,0.223529412,0.125490196,0.319999993),vec4(0.678431373,0.243137255,0.145098039,0.170000002),(t-0.0)/0.550000012);
    if (t < 1.0) return mix(vec4(0.678431373,0.243137255,0.145098039,0.170000002),vec4(0.729411765,0.262745098,0.168627451,0.0),(t-0.550000012)/0.449999988);
    return vec4(0.729411765,0.262745098,0.168627451,0.0);
}
vec4 paletteLayer6_22Raw(vec2 uv) {
    vec2 local = vec2(4.57826247*uv.x+0.0*uv.y+-1.13539099,0.0*uv.x+4.18287799*uv.y+-0.55525261);
    if (length((local-.5)*2.0) > 1.0) return vec4(0.0);
    vec4 value = paletteLayer6_22Stops(length(vec2(4.57826247*uv.x+0.0*uv.y+-1.13539099,0.0*uv.x+4.18287799*uv.y+-0.55525261)-vec2(.5))*2.0);
    return value;
}
vec4 paletteLayer6_22(vec2 uv) { return paletteLayer6_22Raw(uv); }
vec4 paletteLayer6_23Stops(float t) {
    if (t <= 0.0) return vec4(1.0,0.941176471,0.862745098,0.540000021);
    if (t < 0.460000008) return mix(vec4(1.0,0.941176471,0.862745098,0.540000021),vec4(1.0,0.815686275,0.68627451,0.25),(t-0.0)/0.460000008);
    if (t < 1.0) return mix(vec4(1.0,0.815686275,0.68627451,0.25),vec4(1.0,0.788235294,0.647058824,0.0),(t-0.460000008)/0.539999992);
    return vec4(1.0,0.788235294,0.647058824,0.0);
}
vec4 paletteLayer6_23Raw(vec2 uv) {
    vec2 local = vec2(4.94452331*uv.x+0.0*uv.y+-0.786221991,0.0*uv.x+4.49272098*uv.y+-0.114900702);
    if (length((local-.5)*2.0) > 1.0) return vec4(0.0);
    vec4 value = paletteLayer6_23Stops(length(vec2(4.94452331*uv.x+0.0*uv.y+-0.786221991,0.0*uv.x+4.49272098*uv.y+-0.114900702)-vec2(.5))*2.0);
    return value;
}
vec4 paletteLayer6_23(vec2 uv) { return paletteLayer6_23Raw(uv); }
vec4 paletteLayer6_24Stops(float t) {
    if (t <= 0.0) return vec4(0.984313725,0.431372549,0.31372549,1.0);
    if (t < 0.5) return mix(vec4(0.984313725,0.431372549,0.31372549,1.0),vec4(0.984313725,0.431372549,0.31372549,1.0),(t-0.0)/0.5);
    if (t < 0.74000001) return mix(vec4(0.984313725,0.431372549,0.31372549,1.0),vec4(0.984313725,0.431372549,0.31372549,0.899999976),(t-0.5)/0.24000001);
    if (t < 1.0) return mix(vec4(0.984313725,0.431372549,0.31372549,0.899999976),vec4(0.984313725,0.431372549,0.31372549,0.0),(t-0.74000001)/0.25999999);
    return vec4(0.984313725,0.431372549,0.31372549,0.0);
}
vec4 paletteLayer6_24Raw(vec2 uv) {
    vec2 local = vec2(1.10368825*uv.x+0.0*uv.y+-0.0237101848,0.0*uv.x+1.07348198*uv.y+-0.0363037116);
    if (length((local-.5)*2.0) > 1.0) return vec4(0.0);
    vec4 value = paletteLayer6_24Stops(length(vec2(1.15526246*uv.x+0.0*uv.y+-0.0435097255,0.0*uv.x+1.1336772*uv.y+-0.0476852268)-vec2(.5))*2.0);
    return value;
}
vec4 paletteLayer6_24(vec2 uv) { return paletteLayer6_24Raw(uv); }
vec4 paletteRim6_0(float t) {
    if (t <= 0.0) return vec4(1.0,0.941176471,0.854901961,0.400000006);
    if (t < 1.0) return mix(vec4(1.0,0.941176471,0.854901961,0.400000006),vec4(1.0,0.941176471,0.854901961,0.400000006),(t-0.0)/1.0);
    return vec4(1.0,0.941176471,0.854901961,0.400000006);
}
vec4 paletteRim6_1(float t) {
    if (t <= 0.0) return vec4(1.0,0.945098039,0.831372549,0.560000002);
    if (t < 0.519999981) return mix(vec4(1.0,0.945098039,0.831372549,0.560000002),vec4(1.0,0.945098039,0.831372549,0.300000012),(t-0.0)/0.519999981);
    if (t < 1.0) return mix(vec4(1.0,0.945098039,0.831372549,0.300000012),vec4(1.0,0.945098039,0.831372549,0.129999995),(t-0.519999981)/0.480000019);
    return vec4(1.0,0.945098039,0.831372549,0.129999995);
}
vec4 paletteBase7Stops(float t) {
    if (t <= 0.0) return vec4(0.254901961,0.643137255,0.988235294,1.0);
    if (t < 0.519999981) return mix(vec4(0.254901961,0.643137255,0.988235294,1.0),vec4(0.219607843,0.615686275,0.984313725,1.0),(t-0.0)/0.519999981);
    if (t < 1.0) return mix(vec4(0.219607843,0.615686275,0.984313725,1.0),vec4(0.196078431,0.6,0.97254902,1.0),(t-0.519999981)/0.480000019);
    return vec4(0.196078431,0.6,0.97254902,1.0);
}
vec4 paletteBase7Raw(vec2 uv) {
    vec4 value = paletteBase7Stops(length(vec2(0.67567569*uv.x+0.0*uv.y+0.23648648,0.0*uv.x+0.67567569*uv.y+0.189189196)-vec2(.5))*2.0);
    return value;
}
vec4 paletteBase7(vec2 uv) { return paletteBase7Raw(uv); }
vec4 paletteLayer7_0Stops(float t) {
    if (t <= 0.0) return vec4(0.615686275,0.854901961,0.992156863,0.560000002);
    if (t < 0.529999971) return mix(vec4(0.615686275,0.854901961,0.992156863,0.560000002),vec4(0.450980392,0.77254902,1.0,0.25),(t-0.0)/0.529999971);
    if (t < 1.0) return mix(vec4(0.450980392,0.77254902,1.0,0.25),vec4(0.450980392,0.77254902,1.0,0.0),(t-0.529999971)/0.470000029);
    return vec4(0.450980392,0.77254902,1.0,0.0);
}
vec4 paletteLayer7_0Raw(vec2 uv) {
    vec2 local = vec2(1.97479543*uv.x+0.0*uv.y+0.391604239,0.0*uv.x+2.35290829*uv.y+-0.198196766);
    if (length((local-.5)*2.0) > 1.0) return vec4(0.0);
    vec4 value = paletteLayer7_0Stops(length(vec2(1.97479543*uv.x+0.0*uv.y+0.391604239,0.0*uv.x+2.35290829*uv.y+-0.198196766)-vec2(.5))*2.0);
    return value;
}
vec4 paletteLayer7_0(vec2 uv) { return paletteLayer7_0Raw(uv); }
vec4 paletteLayer7_1Stops(float t) {
    if (t <= 0.0) return vec4(0.396078431,0.737254902,1.0,0.479999989);
    if (t < 1.0) return mix(vec4(0.396078431,0.737254902,1.0,0.479999989),vec4(0.396078431,0.737254902,1.0,0.0),(t-0.0)/1.0);
    return vec4(0.396078431,0.737254902,1.0,0.0);
}
vec4 paletteLayer7_1Raw(vec2 uv) {
    vec2 local = vec2(2.297211*uv.x+0.0*uv.y+-1.36078753,0.0*uv.x+2.8907159*uv.y+0.356501116);
    if (length((local-.5)*2.0) > 1.0) return vec4(0.0);
    vec4 value = paletteLayer7_1Stops(length(vec2(2.297211*uv.x+0.0*uv.y+-1.36078753,0.0*uv.x+2.8907159*uv.y+0.356501116)-vec2(.5))*2.0);
    return value;
}
vec4 paletteLayer7_1(vec2 uv) { return paletteLayer7_1Raw(uv); }
vec4 paletteLayer7_2Stops(float t) {
    if (t <= 0.0) return vec4(0.396078431,0.737254902,1.0,0.479999989);
    if (t < 1.0) return mix(vec4(0.396078431,0.737254902,1.0,0.479999989),vec4(0.396078431,0.737254902,1.0,0.0),(t-0.0)/1.0);
    return vec4(0.396078431,0.737254902,1.0,0.0);
}
vec4 paletteLayer7_2Raw(vec2 uv) {
    vec2 local = vec2(2.50140754*uv.x+0.0*uv.y+-0.19285753,0.0*uv.x+3.89134833*uv.y+-0.231633113);
    if (length((local-.5)*2.0) > 1.0) return vec4(0.0);
    vec4 value = paletteLayer7_2Stops(length(vec2(2.50140754*uv.x+0.0*uv.y+-0.19285753,0.0*uv.x+3.89134833*uv.y+-0.231633113)-vec2(.5))*2.0);
    return value;
}
vec4 paletteLayer7_2(vec2 uv) { return paletteLayer7_2Raw(uv); }
vec4 paletteLayer7_3Stops(float t) {
    if (t <= 0.0) return vec4(0.615686275,0.854901961,0.992156863,0.560000002);
    if (t < 0.529999971) return mix(vec4(0.615686275,0.854901961,0.992156863,0.560000002),vec4(0.450980392,0.77254902,1.0,0.25),(t-0.0)/0.529999971);
    if (t < 1.0) return mix(vec4(0.450980392,0.77254902,1.0,0.25),vec4(0.450980392,0.77254902,1.0,0.0),(t-0.529999971)/0.470000029);
    return vec4(0.450980392,0.77254902,1.0,0.0);
}
vec4 paletteLayer7_3Raw(vec2 uv) {
    vec2 local = vec2(2.88623947*uv.x+0.0*uv.y+-2.41483561,0.0*uv.x+2.8907159*uv.y+-0.52921317);
    if (length((local-.5)*2.0) > 1.0) return vec4(0.0);
    vec4 value = paletteLayer7_3Stops(length(vec2(2.88623947*uv.x+0.0*uv.y+-2.41483561,0.0*uv.x+2.8907159*uv.y+-0.52921317)-vec2(.5))*2.0);
    return value;
}
vec4 paletteLayer7_3(vec2 uv) { return paletteLayer7_3Raw(uv); }
vec4 paletteLayer7_4Stops(float t) {
    if (t <= 0.0) return vec4(0.615686275,0.854901961,0.992156863,0.560000002);
    if (t < 0.529999971) return mix(vec4(0.615686275,0.854901961,0.992156863,0.560000002),vec4(0.450980392,0.77254902,1.0,0.25),(t-0.0)/0.529999971);
    if (t < 1.0) return mix(vec4(0.450980392,0.77254902,1.0,0.25),vec4(0.450980392,0.77254902,1.0,0.0),(t-0.529999971)/0.470000029);
    return vec4(0.450980392,0.77254902,1.0,0.0);
}
vec4 paletteLayer7_4Raw(vec2 uv) {
    vec2 local = vec2(2.55825771*uv.x+0.0*uv.y+0.223213889,0.0*uv.x+2.81041823*uv.y+-1.22284614);
    if (length((local-.5)*2.0) > 1.0) return vec4(0.0);
    vec4 value = paletteLayer7_4Stops(length(vec2(2.55825771*uv.x+0.0*uv.y+0.223213889,0.0*uv.x+2.81041823*uv.y+-1.22284614)-vec2(.5))*2.0);
    return value;
}
vec4 paletteLayer7_4(vec2 uv) { return paletteLayer7_4Raw(uv); }
vec4 paletteLayer7_5Stops(float t) {
    if (t <= 0.0) return vec4(0.396078431,0.737254902,1.0,0.134399998);
    if (t < 1.0) return mix(vec4(0.396078431,0.737254902,1.0,0.134399998),vec4(0.396078431,0.737254902,1.0,0.0),(t-0.0)/1.0);
    return vec4(0.396078431,0.737254902,1.0,0.0);
}
vec4 paletteLayer7_5Raw(vec2 uv) {
    vec2 local = vec2(1.44311973*uv.x+0.0*uv.y+-0.213828062,0.0*uv.x+2.40892992*uv.y+-0.988630022);
    if (length((local-.5)*2.0) > 1.0) return vec4(0.0);
    vec4 value = paletteLayer7_5Stops(length(vec2(1.44311973*uv.x+0.0*uv.y+-0.213828062,0.0*uv.x+2.40892992*uv.y+-0.988630022)-vec2(.5))*2.0);
    return value;
}
vec4 paletteLayer7_5(vec2 uv) { return paletteLayer7_5Raw(uv); }
vec4 paletteLayer7_6Stops(float t) {
    if (t <= 0.0) return vec4(0.0117647059,0.478431373,0.901960784,0.189000004);
    if (t < 1.0) return mix(vec4(0.0117647059,0.478431373,0.901960784,0.189000004),vec4(0.0274509804,0.509803922,0.933333333,0.0),(t-0.0)/1.0);
    return vec4(0.0274509804,0.509803922,0.933333333,0.0);
}
vec4 paletteLayer7_6Raw(vec2 uv) {
    vec2 local = vec2(2.50140754*uv.x+0.0*uv.y+-1.40396864,0.0*uv.x+2.8907159*uv.y+-1.52921317);
    if (length((local-.5)*2.0) > 1.0) return vec4(0.0);
    vec4 value = paletteLayer7_6Stops(length(vec2(2.50140754*uv.x+0.0*uv.y+-1.40396864,0.0*uv.x+2.8907159*uv.y+-1.52921317)-vec2(.5))*2.0);
    return value;
}
vec4 paletteLayer7_6(vec2 uv) { return paletteLayer7_6Raw(uv); }
vec4 paletteLayer7_7Stops(float t) {
    if (t <= 0.0) return vec4(0.0117647059,0.478431373,0.901960784,0.162000013);
    if (t < 1.0) return mix(vec4(0.0117647059,0.478431373,0.901960784,0.162000013),vec4(0.0274509804,0.509803922,0.933333333,0.0),(t-0.0)/1.0);
    return vec4(0.0274509804,0.509803922,0.933333333,0.0);
}
vec4 paletteLayer7_7Raw(vec2 uv) {
    vec2 local = vec2(3.12675942*uv.x+0.0*uv.y+-1.39384969,0.0*uv.x+2.4676843*uv.y+-1.79323075);
    if (length((local-.5)*2.0) > 1.0) return vec4(0.0);
    vec4 value = paletteLayer7_7Stops(length(vec2(3.12675942*uv.x+0.0*uv.y+-1.39384969,0.0*uv.x+2.4676843*uv.y+-1.79323075)-vec2(.5))*2.0);
    return value;
}
vec4 paletteLayer7_7(vec2 uv) { return paletteLayer7_7Raw(uv); }
vec4 paletteLayer7_8Stops(float t) {
    if (t <= 0.0) return vec4(0.0117647059,0.478431373,0.901960784,0.175500001);
    if (t < 1.0) return mix(vec4(0.0117647059,0.478431373,0.901960784,0.175500001),vec4(0.0274509804,0.509803922,0.933333333,0.0),(t-0.0)/1.0);
    return vec4(0.0274509804,0.509803922,0.933333333,0.0);
}
vec4 paletteLayer7_8Raw(vec2 uv) {
    vec2 local = vec2(2.68007951*uv.x+0.0*uv.y+-0.361394973,0.0*uv.x+3.0659108*uv.y+-2.07643821);
    if (length((local-.5)*2.0) > 1.0) return vec4(0.0);
    vec4 value = paletteLayer7_8Stops(length(vec2(2.68007951*uv.x+0.0*uv.y+-0.361394973,0.0*uv.x+3.0659108*uv.y+-2.07643821)-vec2(.5))*2.0);
    return value;
}
vec4 paletteLayer7_8(vec2 uv) { return paletteLayer7_8Raw(uv); }
vec4 paletteRim7_0(float t) {
    if (t <= 0.0) return vec4(0.631372549,0.839215686,0.960784314,0.289999992);
    if (t < 1.0) return mix(vec4(0.631372549,0.839215686,0.960784314,0.289999992),vec4(0.631372549,0.839215686,0.960784314,0.289999992),(t-0.0)/1.0);
    return vec4(0.631372549,0.839215686,0.960784314,0.289999992);
}
vec4 paletteBase8Stops(float t) {
    if (t <= 0.0) return vec4(1.0,0.882352941,0.415686275,1.0);
    if (t < 0.100000001) return mix(vec4(1.0,0.882352941,0.415686275,1.0),vec4(0.996078431,0.823529412,0.180392157,1.0),(t-0.0)/0.100000001);
    if (t < 0.230000004) return mix(vec4(0.996078431,0.823529412,0.180392157,1.0),vec4(0.996078431,0.8,0.156862745,1.0),(t-0.100000001)/0.130000003);
    if (t < 0.439999998) return mix(vec4(0.996078431,0.8,0.156862745,1.0),vec4(0.988235294,0.788235294,0.145098039,1.0),(t-0.230000004)/0.209999993);
    if (t < 0.639999986) return mix(vec4(0.988235294,0.788235294,0.145098039,1.0),vec4(0.992156863,0.807843137,0.156862745,1.0),(t-0.439999998)/0.199999988);
    if (t < 0.779999971) return mix(vec4(0.992156863,0.807843137,0.156862745,1.0),vec4(0.992156863,0.792156863,0.133333333,1.0),(t-0.639999986)/0.139999986);
    if (t < 0.910000026) return mix(vec4(0.992156863,0.792156863,0.133333333,1.0),vec4(0.97254902,0.752941176,0.125490196,1.0),(t-0.779999971)/0.130000055);
    if (t < 1.0) return mix(vec4(0.97254902,0.752941176,0.125490196,1.0),vec4(0.933333333,0.745098039,0.196078431,1.0),(t-0.910000026)/0.0899999738);
    return vec4(0.933333333,0.745098039,0.196078431,1.0);
}
vec4 paletteBase8Raw(vec2 uv) {
    vec4 value = paletteBase8Stops(0.0*uv.x+0.995964885*uv.y+-0.00180609536);
    return value;
}
vec4 paletteBase8(vec2 uv) { return paletteBase8Raw(uv); }
vec4 paletteLayer8_0Stops(float t) {
    if (t <= 0.0) return vec4(1.0,0.964705882,0.666666667,0.910000026);
    if (t < 0.400000006) return mix(vec4(1.0,0.964705882,0.666666667,0.910000026),vec4(1.0,0.949019608,0.545098039,0.449999988),(t-0.0)/0.400000006);
    if (t < 1.0) return mix(vec4(1.0,0.949019608,0.545098039,0.449999988),vec4(1.0,0.945098039,0.545098039,0.0),(t-0.400000006)/0.599999994);
    return vec4(1.0,0.945098039,0.545098039,0.0);
}
vec4 paletteLayer8_0Raw(vec2 uv) {
    vec2 local = vec2(2.12317971*uv.x+0.0*uv.y+-0.103091649,0.0*uv.x+1.37264398*uv.y+0.318023682);
    if (length((local-.5)*2.0) > 1.0) return vec4(0.0);
    vec4 value = paletteLayer8_0Stops(length(vec2(2.12317971*uv.x+0.0*uv.y+-0.103091649,0.0*uv.x+1.37264398*uv.y+0.318023682)-vec2(.5))*2.0);
    return value;
}
vec4 paletteLayer8_0(vec2 uv) { return paletteLayer8_0Raw(uv); }
vec4 paletteLayer8_1Stops(float t) {
    if (t <= 0.0) return vec4(1.0,0.964705882,0.666666667,0.910000026);
    if (t < 0.400000006) return mix(vec4(1.0,0.964705882,0.666666667,0.910000026),vec4(1.0,0.949019608,0.545098039,0.449999988),(t-0.0)/0.400000006);
    if (t < 1.0) return mix(vec4(1.0,0.949019608,0.545098039,0.449999988),vec4(1.0,0.945098039,0.545098039,0.0),(t-0.400000006)/0.599999994);
    return vec4(1.0,0.945098039,0.545098039,0.0);
}
vec4 paletteLayer8_1Raw(vec2 uv) {
    vec2 local = vec2(2.28650122*uv.x+0.0*uv.y+0.408208994,0.0*uv.x+1.64717278*uv.y+-0.502986967);
    if (length((local-.5)*2.0) > 1.0) return vec4(0.0);
    vec4 value = paletteLayer8_1Stops(length(vec2(2.28650122*uv.x+0.0*uv.y+0.408208994,0.0*uv.x+1.64717278*uv.y+-0.502986967)-vec2(.5))*2.0);
    return value;
}
vec4 paletteLayer8_1(vec2 uv) { return paletteLayer8_1Raw(uv); }
vec4 paletteLayer8_2Stops(float t) {
    if (t <= 0.0) return vec4(1.0,0.929411765,0.529411765,0.352600003);
    if (t < 0.5) return mix(vec4(1.0,0.929411765,0.529411765,0.352600003),vec4(1.0,0.929411765,0.529411765,0.103199999),(t-0.0)/0.5);
    if (t < 1.0) return mix(vec4(1.0,0.929411765,0.529411765,0.103199999),vec4(1.0,0.929411765,0.529411765,0.0),(t-0.5)/0.5);
    return vec4(1.0,0.929411765,0.529411765,0.0);
}
vec4 paletteLayer8_2Raw(vec2 uv) {
    vec2 local = vec2(2.7097038*uv.x+-1.40876623*uv.y+-1.00696784,0.566181271*uv.x+0.883067396*uv.y+-0.284388482);
    if (length((local-.5)*2.0) > 1.0) return vec4(0.0);
    vec4 value = paletteLayer8_2Stops(length(vec2(2.7097038*uv.x+-1.40876623*uv.y+-1.00696784,0.566181271*uv.x+0.883067396*uv.y+-0.284388482)-vec2(.5))*2.0);
    return value;
}
vec4 paletteLayer8_2(vec2 uv) { return paletteLayer8_2Raw(uv); }
vec4 paletteLayer8_3Stops(float t) {
    if (t <= 0.0) return vec4(1.0,0.88627451,0.341176471,0.184000006);
    if (t < 1.0) return mix(vec4(1.0,0.88627451,0.341176471,0.184000006),vec4(1.0,0.88627451,0.341176471,0.0),(t-0.0)/1.0);
    return vec4(1.0,0.88627451,0.341176471,0.0);
}
vec4 paletteLayer8_3Raw(vec2 uv) {
    vec2 local = vec2(1.21324555*uv.x+0.0*uv.y+0.00231497628,0.0*uv.x+3.14900679*uv.y+-1.57923979);
    if (length((local-.5)*2.0) > 1.0) return vec4(0.0);
    vec4 value = paletteLayer8_3Stops(length(vec2(1.21324555*uv.x+0.0*uv.y+0.00231497628,0.0*uv.x+3.14900679*uv.y+-1.57923979)-vec2(.5))*2.0);
    return value;
}
vec4 paletteLayer8_3(vec2 uv) { return paletteLayer8_3Raw(uv); }
vec4 paletteLayer8_4Stops(float t) {
    if (t <= 0.0) return vec4(1.0,0.929411765,0.529411765,0.532999976);
    if (t < 0.5) return mix(vec4(1.0,0.929411765,0.529411765,0.532999976),vec4(1.0,0.929411765,0.529411765,0.155999991),(t-0.0)/0.5);
    if (t < 1.0) return mix(vec4(1.0,0.929411765,0.529411765,0.155999991),vec4(1.0,0.929411765,0.529411765,0.0),(t-0.5)/0.5);
    return vec4(1.0,0.929411765,0.529411765,0.0);
}
vec4 paletteLayer8_4Raw(vec2 uv) {
    vec2 local = vec2(2.83090628*uv.x+0.0*uv.y+-2.28031267,0.0*uv.x+2.61137148*uv.y+-1.52912568);
    if (length((local-.5)*2.0) > 1.0) return vec4(0.0);
    vec4 value = paletteLayer8_4Stops(length(vec2(2.83090628*uv.x+0.0*uv.y+-2.28031267,0.0*uv.x+2.61137148*uv.y+-1.52912568)-vec2(.5))*2.0);
    return value;
}
vec4 paletteLayer8_4(vec2 uv) { return paletteLayer8_4Raw(uv); }
vec4 paletteRim8_0(float t) {
    if (t <= 0.0) return vec4(1.0,0.898039216,0.541176471,0.620000005);
    if (t < 1.0) return mix(vec4(1.0,0.898039216,0.541176471,0.620000005),vec4(1.0,0.898039216,0.541176471,0.620000005),(t-0.0)/1.0);
    return vec4(1.0,0.898039216,0.541176471,0.620000005);
}
vec4 paletteBase9Stops(float t) {
    if (t <= 0.0) return vec4(0.882352941,0.423529412,0.870588235,1.0);
    if (t < 0.270000011) return mix(vec4(0.882352941,0.423529412,0.870588235,1.0),vec4(0.843137255,0.380392157,0.831372549,1.0),(t-0.0)/0.270000011);
    if (t < 0.5) return mix(vec4(0.843137255,0.380392157,0.831372549,1.0),vec4(0.82745098,0.364705882,0.815686275,1.0),(t-0.270000011)/0.229999989);
    if (t < 0.870000005) return mix(vec4(0.82745098,0.364705882,0.815686275,1.0),vec4(0.835294118,0.376470588,0.823529412,1.0),(t-0.5)/0.370000005);
    if (t < 1.0) return mix(vec4(0.835294118,0.376470588,0.823529412,1.0),vec4(0.764705882,0.329411765,0.756862745,1.0),(t-0.870000005)/0.129999995);
    return vec4(0.764705882,0.329411765,0.756862745,1.0);
}
vec4 paletteBase9Raw(vec2 uv) {
    vec4 value = paletteBase9Stops(0.0*uv.x+0.99958396*uv.y+-0.00286793173);
    return value;
}
vec4 paletteBase9(vec2 uv) { return paletteBase9Raw(uv); }
vec4 paletteLayer9_0Stops(float t) {
    if (t <= 0.0) return vec4(1.0,0.588235294,1.0,0.949999988);
    if (t < 0.400000006) return mix(vec4(1.0,0.588235294,1.0,0.949999988),vec4(1.0,0.588235294,1.0,0.74000001),(t-0.0)/0.400000006);
    if (t < 0.75) return mix(vec4(1.0,0.588235294,1.0,0.74000001),vec4(1.0,0.588235294,1.0,0.230000004),(t-0.400000006)/0.349999994);
    if (t < 1.0) return mix(vec4(1.0,0.588235294,1.0,0.230000004),vec4(1.0,0.588235294,1.0,0.0),(t-0.75)/0.25);
    return vec4(1.0,0.588235294,1.0,0.0);
}
vec4 paletteLayer9_0Raw(vec2 uv) {
    vec4 value = paletteLayer9_0Stops(length(vec2(2.80500174*uv.x+2.18664122*uv.y+0.0622011349,-0.960052013*uv.x+1.06294823*uv.y+0.507234633)-vec2(.5))*2.0);
    return value;
}
vec4 paletteLayer9_0(vec2 uv) { return paletteLayer9_0Raw(uv); }
vec4 paletteLayer9_1Stops(float t) {
    if (t <= 0.0) return vec4(0.964705882,0.62745098,0.960784314,0.610000014);
    if (t < 0.419999987) return mix(vec4(0.964705882,0.62745098,0.960784314,0.610000014),vec4(0.964705882,0.62745098,0.960784314,0.439999998),(t-0.0)/0.419999987);
    if (t < 0.75999999) return mix(vec4(0.964705882,0.62745098,0.960784314,0.439999998),vec4(0.964705882,0.62745098,0.960784314,0.119999997),(t-0.419999987)/0.340000004);
    if (t < 1.0) return mix(vec4(0.964705882,0.62745098,0.960784314,0.119999997),vec4(0.964705882,0.62745098,0.960784314,0.0),(t-0.75999999)/0.24000001);
    return vec4(0.964705882,0.62745098,0.960784314,0.0);
}
vec4 paletteLayer9_1Raw(vec2 uv) {
    vec4 value = paletteLayer9_1Stops(length(vec2(2.57981277*uv.x+0.0*uv.y+-2.05113626,0.0*uv.x+1.08717632*uv.y+0.419561177)-vec2(.5))*2.0);
    return value;
}
vec4 paletteLayer9_1(vec2 uv) { return paletteLayer9_1Raw(uv); }
vec4 paletteLayer9_2Stops(float t) {
    if (t <= 0.0) return vec4(1.0,0.68627451,0.968627451,0.49000001);
    if (t < 0.449999988) return mix(vec4(1.0,0.68627451,0.968627451,0.49000001),vec4(1.0,0.68627451,0.968627451,0.230000004),(t-0.0)/0.449999988);
    if (t < 1.0) return mix(vec4(1.0,0.68627451,0.968627451,0.230000004),vec4(1.0,0.68627451,0.968627451,0.0),(t-0.449999988)/0.550000012);
    return vec4(1.0,0.68627451,0.968627451,0.0);
}
vec4 paletteLayer9_2Raw(vec2 uv) {
    vec4 value = paletteLayer9_2Stops(length(vec2(6.5536046*uv.x+3.51520348*uv.y+-3.47402692,-1.83083487*uv.x+2.94605374*uv.y+1.28231466)-vec2(.5))*2.0);
    return value;
}
vec4 paletteLayer9_2(vec2 uv) { return paletteLayer9_2Raw(uv); }
vec4 paletteLayer9_3Stops(float t) {
    if (t <= 0.0) return vec4(0.564705882,0.160784314,0.560784314,0.25999999);
    if (t < 0.5) return mix(vec4(0.564705882,0.160784314,0.560784314,0.25999999),vec4(0.564705882,0.160784314,0.560784314,0.170000002),(t-0.0)/0.5);
    if (t < 1.0) return mix(vec4(0.564705882,0.160784314,0.560784314,0.170000002),vec4(0.564705882,0.160784314,0.560784314,0.0),(t-0.5)/0.5);
    return vec4(0.564705882,0.160784314,0.560784314,0.0);
}
vec4 paletteLayer9_3Raw(vec2 uv) {
    vec4 value = paletteLayer9_3Stops(length(vec2(2.02699566*uv.x+0.0*uv.y+-0.513392866,0.0*uv.x+4.5850482*uv.y+-4.01315498)-vec2(.5))*2.0);
    return value;
}
vec4 paletteLayer9_3(vec2 uv) { return paletteLayer9_3Raw(uv); }
vec4 paletteRim9_0(float t) {
    if (t <= 0.0) return vec4(1.0,0.815686275,1.0,0.579999983);
    if (t < 0.5) return mix(vec4(1.0,0.815686275,1.0,0.579999983),vec4(0.949019608,0.737254902,0.952941176,0.349999994),(t-0.0)/0.5);
    if (t < 1.0) return mix(vec4(0.949019608,0.737254902,0.952941176,0.349999994),vec4(0.921568627,0.670588235,0.91372549,0.219999999),(t-0.5)/0.5);
    return vec4(0.921568627,0.670588235,0.91372549,0.219999999);
}
vec4 paletteBase10Stops(float t) {
    if (t <= 0.0) return vec4(0.274509804,0.670588235,0.992156863,1.0);
    if (t < 0.379999995) return mix(vec4(0.274509804,0.670588235,0.992156863,1.0),vec4(0.22745098,0.639215686,0.992156863,1.0),(t-0.0)/0.379999995);
    if (t < 0.800000012) return mix(vec4(0.22745098,0.639215686,0.992156863,1.0),vec4(0.211764706,0.631372549,0.996078431,1.0),(t-0.379999995)/0.420000017);
    if (t < 1.0) return mix(vec4(0.211764706,0.631372549,0.996078431,1.0),vec4(0.2,0.615686275,0.988235294,1.0),(t-0.800000012)/0.199999988);
    return vec4(0.2,0.615686275,0.988235294,1.0);
}
vec4 paletteBase10Raw(vec2 uv) {
    vec4 value = paletteBase10Stops(0.396537453*uv.x+0.967015743*uv.y+-0.1769979);
    return value;
}
vec4 paletteBase10(vec2 uv) { return paletteBase10Raw(uv); }
vec4 paletteLayer10_0Stops(float t) {
    if (t <= 0.0) return vec4(0.411764706,0.729411765,1.0,0.180000007);
    if (t < 1.0) return mix(vec4(0.411764706,0.729411765,1.0,0.180000007),vec4(0.411764706,0.729411765,1.0,0.0),(t-0.0)/1.0);
    return vec4(0.411764706,0.729411765,1.0,0.0);
}
vec4 paletteLayer10_0Raw(vec2 uv) {
    vec2 local = vec2(0.947051668*uv.x+0.0*uv.y+0.0235250639,0.0*uv.x+0.939407105*uv.y+0.0205688415);
    if (local.x < 0.0 || local.x > 1.0 || local.y < 0.0 || local.y > 1.0) return vec4(0.0);
    vec4 value = paletteLayer10_0Stops(length(vec2(0.357480504*uv.x+0.953267955*uv.y+-0.212736659,-1.12118094*uv.x+0.650104854*uv.y+0.55240238)-vec2(.5))*2.0);
    return value;
}
vec4 paletteLayer10_0(vec2 uv) { return paletteLayer10_0Raw(uv); }
vec4 paletteLayer10_1Stops(float t) {
    if (t <= 0.0) return vec4(0.674509804,0.862745098,0.980392157,0.579999983);
    if (t < 0.349999994) return mix(vec4(0.674509804,0.862745098,0.980392157,0.579999983),vec4(0.560784314,0.811764706,0.980392157,0.300000012),(t-0.0)/0.349999994);
    if (t < 1.0) return mix(vec4(0.560784314,0.811764706,0.980392157,0.300000012),vec4(0.560784314,0.811764706,0.980392157,0.0),(t-0.349999994)/0.650000006);
    return vec4(0.560784314,0.811764706,0.980392157,0.0);
}
vec4 paletteLayer10_1Raw(vec2 uv) {
    vec2 local = vec2(0.947051668*uv.x+0.0*uv.y+0.0235250639,0.0*uv.x+0.939407105*uv.y+0.0205688415);
    if (local.x < 0.0 || local.x > 1.0 || local.y < 0.0 || local.y > 1.0) return vec4(0.0);
    vec4 value = paletteLayer10_1Stops(length(vec2(2.74363314*uv.x+0.850613475*uv.y+-0.0673059682,-0.319230146*uv.x+1.59209139*uv.y+-0.0359458955)-vec2(.5))*2.0);
    return value;
}
vec4 paletteLayer10_1(vec2 uv) { return paletteLayer10_1Raw(uv); }
vec4 paletteLayer10_2Stops(float t) {
    if (t <= 0.0) return vec4(0.549019608,0.796078431,0.992156863,0.319999993);
    if (t < 1.0) return mix(vec4(0.549019608,0.796078431,0.992156863,0.319999993),vec4(0.549019608,0.796078431,0.992156863,0.0),(t-0.0)/1.0);
    return vec4(0.549019608,0.796078431,0.992156863,0.0);
}
vec4 paletteLayer10_2Raw(vec2 uv) {
    vec2 local = vec2(0.947051668*uv.x+0.0*uv.y+0.0235250639,0.0*uv.x+0.939407105*uv.y+0.0205688415);
    if (local.x < 0.0 || local.x > 1.0 || local.y < 0.0 || local.y > 1.0) return vec4(0.0);
    vec4 value = paletteLayer10_2Stops(length(vec2(1.5304973*uv.x+1.09877076*uv.y+0.0421702237,-1.33739055*uv.x+2.88040829*uv.y+0.734490068)-vec2(.5))*2.0);
    return value;
}
vec4 paletteLayer10_2(vec2 uv) { return paletteLayer10_2Raw(uv); }
vec4 paletteLayer10_3Stops(float t) {
    if (t <= 0.0) return vec4(0.062745098,0.549019608,0.921568627,0.219999999);
    if (t < 1.0) return mix(vec4(0.062745098,0.549019608,0.921568627,0.219999999),vec4(0.062745098,0.549019608,0.921568627,0.0),(t-0.0)/1.0);
    return vec4(0.062745098,0.549019608,0.921568627,0.0);
}
vec4 paletteLayer10_3Raw(vec2 uv) {
    vec2 local = vec2(0.947051668*uv.x+0.0*uv.y+0.0235250639,0.0*uv.x+0.939407105*uv.y+0.0205688415);
    if (local.x < 0.0 || local.x > 1.0 || local.y < 0.0 || local.y > 1.0) return vec4(0.0);
    vec4 value = paletteLayer10_3Stops(length(vec2(6.37297901*uv.x+-2.12339175*uv.y+-0.607522176,1.02458077*uv.x+4.75476344*uv.y+-0.581043657)-vec2(.5))*2.0);
    return value;
}
vec4 paletteLayer10_3(vec2 uv) { return paletteLayer10_3Raw(uv); }
vec4 paletteRim10_0(float t) {
    if (t <= 0.0) return vec4(0.77254902,0.898039216,0.996078431,0.550000012);
    if (t < 1.0) return mix(vec4(0.77254902,0.898039216,0.996078431,0.550000012),vec4(0.77254902,0.898039216,0.996078431,0.550000012),(t-0.0)/1.0);
    return vec4(0.77254902,0.898039216,0.996078431,0.550000012);
}
vec4 paletteBase11Stops(float t) {
    if (t <= 0.0) return vec4(1.0,0.870588235,0.384313725,1.0);
    if (t < 0.479999989) return mix(vec4(1.0,0.870588235,0.384313725,1.0),vec4(1.0,0.847058824,0.219607843,1.0),(t-0.0)/0.479999989);
    if (t < 1.0) return mix(vec4(1.0,0.847058824,0.219607843,1.0),vec4(1.0,0.874509804,0.407843137,1.0),(t-0.479999989)/0.520000011);
    return vec4(1.0,0.874509804,0.407843137,1.0);
}
vec4 paletteBase11Raw(vec2 uv) {
    vec4 value = paletteBase11Stops(1.00453198*uv.x+0.85519588*uv.y+-0.360153526);
    return value;
}
vec4 paletteBase11(vec2 uv) { return paletteBase11Raw(uv); }
vec4 paletteLayer11_0Stops(float t) {
    if (t <= 0.0) return vec4(1.0,0.850980392,0.219607843,1.0);
    if (t < 0.600000024) return mix(vec4(1.0,0.850980392,0.219607843,1.0),vec4(1.0,0.850980392,0.266666667,0.5),(t-0.0)/0.600000024);
    if (t < 1.0) return mix(vec4(1.0,0.850980392,0.266666667,0.5),vec4(1.0,0.905882353,0.584313725,0.0),(t-0.600000024)/0.399999976);
    return vec4(1.0,0.905882353,0.584313725,0.0);
}
vec4 paletteLayer11_0Raw(vec2 uv) {
    vec4 value = paletteLayer11_0Stops(length(vec2(0.714285731*uv.x+0.0*uv.y+0.278571427,0.0*uv.x+0.714285731*uv.y+0.0785714313)-vec2(.5))*2.0);
    return value;
}
vec4 paletteLayer11_0(vec2 uv) { return paletteLayer11_0Raw(uv); }
vec4 paletteLayer11_1Stops(float t) {
    if (t <= 0.0) return vec4(1.0,0.945098039,0.698039216,0.400000006);
    if (t < 0.600000024) return mix(vec4(1.0,0.945098039,0.698039216,0.400000006),vec4(1.0,0.91372549,0.584313725,0.25),(t-0.0)/0.600000024);
    if (t < 1.0) return mix(vec4(1.0,0.91372549,0.584313725,0.25),vec4(1.0,0.91372549,0.51372549,0.0),(t-0.600000024)/0.399999976);
    return vec4(1.0,0.91372549,0.51372549,0.0);
}
vec4 paletteLayer11_1Raw(vec2 uv) {
    vec4 value = paletteLayer11_1Stops(length(vec2(1.24937963*uv.x+0.0*uv.y+-0.661910653,0.0*uv.x+0.653297126*uv.y+0.139366791)-vec2(.5))*2.0);
    return value;
}
vec4 paletteLayer11_1(vec2 uv) { return paletteLayer11_1Raw(uv); }
vec4 paletteRim11_0(float t) {
    if (t <= 0.0) return vec4(1.0,0.960784314,0.760784314,0.800000012);
    if (t < 1.0) return mix(vec4(1.0,0.960784314,0.760784314,0.800000012),vec4(1.0,0.960784314,0.760784314,0.800000012),(t-0.0)/1.0);
    return vec4(1.0,0.960784314,0.760784314,0.800000012);
}
vec4 paletteRim11_1(float t) {
    if (t <= 0.0) return vec4(1.0,0.980392157,0.82745098,0.649999976);
    if (t < 0.5) return mix(vec4(1.0,0.980392157,0.82745098,0.649999976),vec4(1.0,0.980392157,0.82745098,0.5),(t-0.0)/0.5);
    if (t < 1.0) return mix(vec4(1.0,0.980392157,0.82745098,0.5),vec4(1.0,0.980392157,0.82745098,0.379999995),(t-0.5)/0.5);
    return vec4(1.0,0.980392157,0.82745098,0.379999995);
}
vec3 paletteFormLight(float index, vec3 normal) {
    // Broad surface shading strengthens volume without replacing authored color layers.
    vec3 key = normalize(vec3(-.6,.8,1.0));
    float response = (.5+.5*max(dot(normal,key),0.0))/(.5+.5*key.z);
    response = mix(1.0,response,.85);
    // Keep the pale yellow bright and warm as the surface turns away from the key.
    // Preserve the highlight response and leave contact/cast shadows separate.
    if (index > 51.5 && index < 52.5)
        return vec3(1.0)+min(response-1.0,0.0)*vec3(.20,.35,1.0)+vec3(max(response-1.0,0.0));
    return vec3(response);
}
vec3 paletteBodyDetail(vec3 color, vec3 normal, vec3 view, vec3 key, float roughness, float reflectance, float keyVisibility, float ambientVisibility) {
    // Strengthen existing contact occlusion without darkening unoccluded paint.
    color *= mix(.82,1.0,ambientVisibility);
    vec3 halfVector = key+view;
    halfVector /= max(length(halfVector),.0001);
    float spread = mix(12.0,5.0,clamp(roughness,0.0,1.0));
    float highlight = .035*clamp(reflectance/.15,0.0,1.0)*pow(max(dot(normal,halfVector),0.0),spread);
    highlight *= keyVisibility*ambientVisibility;
    // Leave headroom for the studio exposure and retain the authored color variations.
    return color+max(vec3(0.0),vec3(1.0/1.05)-color)*highlight;
}
float paletteDiffuse(vec3 normal, float keyVisibility) {
    // The authored indirect light remains when a live object blocks the key.
    float direct = .35*max(dot(normal,normalize(vec3(-.6,.8,1.0))),0.0);
    return .65+direct*keyVisibility;
}
vec3 paletteSurface(float index, vec3 pigment, vec2 position, vec4 geometry, vec2 authoredMaterial, vec3 n, vec3 v, float roughness, float reflectance, float keyVisibility, float ambientVisibility) {
    vec2 uv = vec2(position.x,1.0-position.y);
    vec3 key = normalize(vec3(-.6,.8,1.0));
    vec3 paint = vec3(0.0), sourcePigment = pigment;
    bool tintShape = false;
    if (index >= 63.5 && index < 78.5) {
        float shape = floor(index+.5)-64.0, bestDistance = 100.0, color = 0.0;
        { vec3 source = vec3(0.955973353,0.162029376,0.407240212); vec3 delta = pigment-source;
          float distance = dot(delta,delta); if (distance < bestDistance) { bestDistance = distance; color = 0.0; sourcePigment = source; } }
        { vec3 source = vec3(0.723055129,0.144128471,0.715693501); vec3 delta = pigment-source;
          float distance = dot(delta,delta); if (distance < bestDistance) { bestDistance = distance; color = 1.0; sourcePigment = source; } }
        { vec3 source = vec3(0.36130678,0.104616484,1.0); vec3 delta = pigment-source;
          float distance = dot(delta,delta); if (distance < bestDistance) { bestDistance = distance; color = 2.0; sourcePigment = source; } }
        { vec3 source = vec3(0.0630100177,0.187820772,1.0); vec3 delta = pigment-source;
          float distance = dot(delta,delta); if (distance < bestDistance) { bestDistance = distance; color = 3.0; sourcePigment = source; } }
        { vec3 source = vec3(0.0,0.439657174,1.0); vec3 delta = pigment-source;
          float distance = dot(delta,delta); if (distance < bestDistance) { bestDistance = distance; color = 4.0; sourcePigment = source; } }
        { vec3 source = vec3(0.00121410793,0.496932995,0.346704056); vec3 delta = pigment-source;
          float distance = dot(delta,delta); if (distance < bestDistance) { bestDistance = distance; color = 5.0; sourcePigment = source; } }
        { vec3 source = vec3(0.467783796,0.686685312,0.00334653576); vec3 delta = pigment-source;
          float distance = dot(delta,delta); if (distance < bestDistance) { bestDistance = distance; color = 6.0; sourcePigment = source; } }
        { vec3 source = vec3(1.0,0.603827339,0.0395462353); vec3 delta = pigment-source;
          float distance = dot(delta,delta); if (distance < bestDistance) { bestDistance = distance; color = 7.0; sourcePigment = source; } }
        { vec3 source = vec3(1.0,0.2158605,0.132868322); vec3 delta = pigment-source;
          float distance = dot(delta,delta); if (distance < bestDistance) { bestDistance = distance; color = 8.0; sourcePigment = source; } }
        index = 128.0+shape*9.0+color; tintShape = true;
    }
    if (index >= 127.5 && index < 262.5) {
        paint = paletteReferenceField(index,uv);
    }
    else if (index < 24.5) { // Todd ivory eye
        paint = paletteBase0(uv).rgb;
    }
    else if (index < 29.5) { // Iris ivory catchlight
        paint = paletteBase1(uv).rgb;
    }
    else if (index < 32.5) { // Thelma yellow orb
        paint = paletteBase2(uv).rgb;
        vec4 layer0 = paletteLayer2_0(uv);
        paint = mix(paint,layer0.rgb,layer0.a);
        vec4 layer1 = paletteLayer2_1(uv);
        paint = mix(paint,layer1.rgb,layer1.a);
        vec4 rim0 = paletteRim2_0(0.0);
        float edge0 = paletteStroke(palettePath2_0(uv),0.026399687,0.0190664404,0.0);
        paint = mix(paint,rim0.rgb,rim0.a*edge0);
        vec4 rim1 = paletteRim2_1(0.0);
        float edge1 = paletteStroke(palettePath2_1(uv),0.0659992192,0.0190664404,0.0);
        paint = mix(paint,rim1.rgb,rim1.a*edge1);
    }
    else if (index < 39.5) { // Josh ivory crescent
        paint = paletteBase3(uv).rgb;
    }
    else if (index < 45.5) { // Todd authored Lime
        paint = paletteStoredField(uv);
    }
    else if (index < 46.5) { // Iggy authored Pink
        paint = paletteBase5(uv).rgb;
        vec4 layer0 = paletteLayer5_0(uv);
        paint = mix(paint,layer0.rgb,layer0.a);
        vec4 layer1 = paletteLayer5_1(uv);
        paint = mix(paint,layer1.rgb,layer1.a);
        vec4 layer2 = paletteLayer5_2(uv);
        paint = mix(paint,layer2.rgb,layer2.a);
        vec4 layer3 = paletteLayer5_3(uv);
        paint = mix(paint,layer3.rgb,layer3.a);
        vec4 rim0 = paletteRim5_0(uv.y);
        float edge0 = paletteStroke(geometry.x,0.00572187976,0.00534042102,0.0);
        paint = mix(paint,rim0.rgb,rim0.a*edge0);
        vec4 rim1 = paletteRim5_1(uv.y);
        float edge1 = paletteStroke(palettePath5_1(uv),0.0381458651,0.0236504356,0.0);
        paint = mix(paint,rim1.rgb,rim1.a*edge1);
    }
    else if (index < 47.5) { // Iris Coral
        paint = paletteBase6(uv).rgb;
        vec4 layer0 = paletteLayer6_0(uv);
        paint = mix(paint,layer0.rgb,layer0.a);
        vec4 layer1 = paletteLayer6_1(uv);
        paint = mix(paint,layer1.rgb,layer1.a);
        vec4 layer2 = paletteLayer6_2(uv);
        paint = mix(paint,layer2.rgb,layer2.a);
        vec4 layer3 = paletteLayer6_3(uv);
        paint = mix(paint,layer3.rgb,layer3.a);
        vec4 layer4 = paletteLayer6_4(uv);
        paint = mix(paint,layer4.rgb,layer4.a);
        vec4 layer5 = paletteLayer6_5(uv);
        paint = mix(paint,layer5.rgb,layer5.a);
        vec4 layer6 = paletteLayer6_6(uv);
        paint = mix(paint,layer6.rgb,layer6.a);
        vec4 layer7 = paletteLayer6_7(uv);
        paint = mix(paint,layer7.rgb,layer7.a);
        vec4 layer8 = paletteLayer6_8(uv);
        paint = mix(paint,layer8.rgb,layer8.a);
        vec4 layer9 = paletteLayer6_9(uv);
        paint = mix(paint,layer9.rgb,layer9.a);
        vec4 layer10 = paletteLayer6_10(uv);
        paint = mix(paint,layer10.rgb,layer10.a);
        vec4 layer11 = paletteLayer6_11(uv);
        paint = mix(paint,layer11.rgb,layer11.a);
        vec4 layer12 = paletteLayer6_12(uv);
        paint = mix(paint,layer12.rgb,layer12.a);
        vec4 layer13 = paletteLayer6_13(uv);
        paint = mix(paint,layer13.rgb,layer13.a);
        vec4 layer14 = paletteLayer6_14(uv);
        paint = mix(paint,layer14.rgb,layer14.a);
        vec4 layer15 = paletteLayer6_15(uv);
        paint = mix(paint,layer15.rgb,layer15.a);
        vec4 layer16 = paletteLayer6_16(uv);
        paint = mix(paint,layer16.rgb,layer16.a);
        vec4 layer17 = paletteLayer6_17(uv);
        paint = mix(paint,layer17.rgb,layer17.a);
        vec4 layer18 = paletteLayer6_18(uv);
        paint = mix(paint,layer18.rgb,layer18.a);
        vec4 layer19 = paletteLayer6_19(uv);
        paint = mix(paint,layer19.rgb,layer19.a);
        vec4 layer20 = paletteLayer6_20(uv);
        paint = mix(paint,layer20.rgb,layer20.a);
        vec4 layer21 = paletteLayer6_21(uv);
        paint = mix(paint,layer21.rgb,layer21.a);
        vec4 layer22 = paletteLayer6_22(uv);
        paint = mix(paint,layer22.rgb,layer22.a);
        vec4 layer23 = paletteLayer6_23(uv);
        paint = mix(paint,layer23.rgb,layer23.a);
        vec4 layer24 = paletteLayer6_24(uv);
        paint = mix(paint,layer24.rgb,layer24.a);
        vec4 rim0 = paletteRim6_0(uv.y);
        float edge0 = paletteStroke(geometry.x,0.00810361188,0.00526734753,0.0);
        paint = mix(paint,rim0.rgb,rim0.a*edge0);
        vec4 rim1 = paletteRim6_1(0.59411782*uv.x+0.597377181*uv.y+-0.101082295);
        float edge1 = paletteStroke(geometry.x,0.0218797525,0.00526734753,0.0);
        paint = mix(paint,rim1.rgb,rim1.a*edge1);
    }
    else if (index < 48.5) { // Felipe authored Blue
        paint = paletteBase7(uv).rgb;
        vec4 layer0 = paletteLayer7_0(uv);
        paint = mix(paint,layer0.rgb,layer0.a);
        vec4 layer1 = paletteLayer7_1(uv);
        paint = mix(paint,layer1.rgb,layer1.a);
        vec4 layer2 = paletteLayer7_2(uv);
        paint = mix(paint,layer2.rgb,layer2.a);
        vec4 layer3 = paletteLayer7_3(uv);
        paint = mix(paint,layer3.rgb,layer3.a);
        vec4 layer4 = paletteLayer7_4(uv);
        paint = mix(paint,layer4.rgb,layer4.a);
        vec4 layer5 = paletteLayer7_5(uv);
        paint = mix(paint,layer5.rgb,layer5.a);
        vec4 layer6 = paletteLayer7_6(uv);
        paint = mix(paint,layer6.rgb,layer6.a);
        vec4 layer7 = paletteLayer7_7(uv);
        paint = mix(paint,layer7.rgb,layer7.a);
        vec4 layer8 = paletteLayer7_8(uv);
        paint = mix(paint,layer8.rgb,layer8.a);
        vec4 rim0 = paletteRim7_0(uv.y);
        float edge0 = paletteStroke(geometry.x,0.0115490528,0.00621872088,0.0);
        paint = mix(paint,rim0.rgb,rim0.a*edge0);
    }
    else if (index < 49.5) { // Alfred authored Yellow
        paint = paletteBase8(uv).rgb;
        vec4 layer0 = paletteLayer8_0(uv);
        paint = mix(paint,layer0.rgb,layer0.a);
        vec4 layer1 = paletteLayer8_1(uv);
        paint = mix(paint,layer1.rgb,layer1.a);
        vec4 layer2 = paletteLayer8_2(uv);
        paint = mix(paint,layer2.rgb,layer2.a);
        vec4 layer3 = paletteLayer8_3(uv);
        paint = mix(paint,layer3.rgb,layer3.a);
        vec4 layer4 = paletteLayer8_4(uv);
        paint = mix(paint,layer4.rgb,layer4.a);
        vec4 rim0 = paletteRim8_0(uv.y);
        float edge0 = paletteStroke(geometry.x,0.0168211318,0.00967215059,0.0);
        paint = mix(paint,rim0.rgb,rim0.a*edge0);
    }
    else if (index < 50.5) { // Jojo authored Orchid
        paint = paletteBase9(uv).rgb;
        vec4 layer0 = paletteLayer9_0(uv);
        paint = mix(paint,layer0.rgb,layer0.a);
        vec4 layer1 = paletteLayer9_1(uv);
        paint = mix(paint,layer1.rgb,layer1.a);
        vec4 layer2 = paletteLayer9_2(uv);
        paint = mix(paint,layer2.rgb,layer2.a);
        vec4 layer3 = paletteLayer9_3(uv);
        paint = mix(paint,layer3.rgb,layer3.a);
        vec4 rim0 = paletteRim9_0(0.67136091*uv.x+0.475073457*uv.y+-0.0718252882);
        float edge0 = paletteStroke(geometry.x,0.0308621311,0.014108403,0.0);
        paint = mix(paint,rim0.rgb,rim0.a*edge0);
    }
    else if (index < 51.5) { // Josh authored Cyan
        paint = paletteBase10(uv).rgb;
        vec4 layer0 = paletteLayer10_0(uv);
        paint = mix(paint,layer0.rgb,layer0.a);
        vec4 layer1 = paletteLayer10_1(uv);
        paint = mix(paint,layer1.rgb,layer1.a);
        vec4 layer2 = paletteLayer10_2(uv);
        paint = mix(paint,layer2.rgb,layer2.a);
        vec4 layer3 = paletteLayer10_3(uv);
        paint = mix(paint,layer3.rgb,layer3.a);
        vec4 rim0 = paletteRim10_0(uv.y);
        float edge0 = paletteStroke(geometry.x,0.0130434925,0.0081521827,0.0);
        paint = mix(paint,rim0.rgb,rim0.a*edge0);
    }
    else if (index < 52.5) { // Thelma authored Light Yellow
        paint = paletteBase11(uv).rgb;
        vec4 layer0 = paletteLayer11_0(uv);
        paint = mix(paint,layer0.rgb,layer0.a);
        vec4 layer1 = paletteLayer11_1(uv);
        paint = mix(paint,layer1.rgb,layer1.a);
        vec4 rim0 = paletteRim11_0(uv.y);
        float edge0 = paletteStroke(geometry.x,0.012447055,0.00647246836,0.0);
        paint = mix(paint,rim0.rgb,rim0.a*edge0);
        vec4 rim1 = paletteRim11_1(0.686415493*uv.x+0.587479889*uv.y+-0.134704933);
        float edge1 = paletteStroke(geometry.x,0.0318644613,0.00647246836,0.0);
        paint = mix(paint,rim1.rgb,rim1.a*edge1);
    }
    // Authored paint is composed in the source sRGB space, then decoded once.
    paint = paletteLinear(paint);
    if (tintShape) paint = paletteTintShape(paint,sourcePigment,pigment);
    // Preserve the authored lighting at rest. Occluders attenuate only the
    // live key contribution; the source already contains the indirect light.
    vec3 restNormal = normalize(geometry.yzw);
    float restDiffuse = paletteDiffuse(restNormal,1.0);
    float liveDiffuse = paletteDiffuse(n,keyVisibility);
    paint *= liveDiffuse/restDiffuse;
    float amplitude = min(.2,.004*pow(reflectance/.15,2.0)*pow(.65/max(roughness,.12),2.0));
    float sheen = amplitude*exp((8.0/max(roughness,.1))*(dot(reflect(-v,n),key)-1.0));
    float sourceAmplitude = min(.2,.004*pow(authoredMaterial.y/.15,2.0)*pow(.65/max(authoredMaterial.x,.12),2.0));
    float sourceSheen = sourceAmplitude*exp((8.0/max(authoredMaterial.x,.1))*(dot(reflect(vec3(0.0,0.0,-1.0),restNormal),key)-1.0));
    paint = max(vec3(0.0),paint+vec3(sheen*keyVisibility-sourceSheen))*mix(.65,1.0,ambientVisibility);
    // Cancel the neutral studio exposure. The authored source is display referred.
    return paint/1.05;
}
// END GENERATED PALETTE FINISHES
vec3 characterStudioMaterial(vec3 albedo, vec3 n, vec3 v, float roughness,
                           float reflectance, float metallic, float keyVisibility, float ambientVisibility) {
    // One neutral studio serves every pigment and part. Lights remain fixed
    // in stage space while the camera or character turns. The diffuse floor
    // preserves the matte shadow side without flattening the sculpted volume.
    vec3 key = normalize(f.keyDirectionIntensity.xyz);
    vec3 fill = normalize(f.fillDirectionIntensity.xyz);
    float diffuse = 2.*(.57*ambientVisibility+.60*max(dot(n,key),0.)*keyVisibility+.12*max(dot(n,fill),0.));
    // Finite softboxes, convolved with a roughness-dependent spherical lobe.
    // The source width bounds even a smooth material's reflection. Roughness
    // broadens and lowers the lobe instead of adding a gray ambient reflection.
    float alpha = roughness*roughness;
    float concentration = f.characterStudio.y/(.16+alpha*alpha);
    vec3 reflected = reflect(-v,n);
    float sources = exp(concentration*(dot(reflected,key)-1.))*keyVisibility
        +.22*exp(concentration*(dot(reflected,fill)-1.));
    sources *= 1.5*concentration/(concentration+4.)*f.characterStudio.z;
    // Authored glTF IOR/specular are converted to this F0 by the asset importer.
    // Dark and bright paint use the identical response; no pigment threshold,
    // per-character lift, or image-space correction changes their finish.
    float f0 = .16*reflectance*reflectance;
    vec3 paint = albedo*(1.-f0)*(1.-metallic)*diffuse*f.characterStudio.x;
    vec3 fresnel = mix(vec3(f0),albedo,metallic);
    return paint + fresnel*(.24*ambientVisibility+sources);
}
// Fixed accessory metals reflect a neutral studio with tall softboxes. The
// boxes stay in world space so reflections move across the curved surface.
float metalSoftbox(vec3 direction, vec3 center, vec2 extent, float roughness) {
    vec3 axis = abs(center.y) > .98 ? vec3(0.,0.,1.) : vec3(0.,1.,0.);
    vec3 right = normalize(cross(axis,center));
    vec3 up = cross(center,right);
    vec2 p = vec2(dot(direction,right),dot(direction,up));
    p /= extent+vec2(roughness*roughness*1.8);
    vec2 p2 = p*p;
    return exp(-dot(p2,p2))*smoothstep(.1,.5,dot(direction,center));
}
vec3 fixedAccessoryMetal(vec3 f0, vec3 n, vec3 v, float roughness,
                        float keyVisibility, float ambientVisibility) {
    vec3 reflected = reflect(-v,n);
    vec3 key = normalize(f.keyDirectionIntensity.xyz);
    vec3 fill = normalize(f.fillDirectionIntensity.xyz);
    float keyBox = metalSoftbox(reflected,key,vec2(.24,.62),roughness);
    float fillBox = metalSoftbox(reflected,fill,vec2(.18,.72),roughness);
    float topBox = metalSoftbox(reflected,normalize(vec3(.1,.92,-.38)),vec2(.65,.20),roughness);
    float room = .22+.20*smoothstep(-.55,.7,reflected.y);
    float radiance = room*ambientVisibility
        +(2.4*keyBox*keyVisibility+.9*fillBox+.8*topBox)*f.characterStudio.z;
    float grazing = pow(1.-clamp(dot(n,v),0.,1.),5.);
    vec3 fresnel = f0+(vec3(1.)-f0)*grazing;
    return fresnel*radiance;
}
vec4 covered(vec3 color, float amount) {
    float alpha = clamp(amount,0.,1.);
    return vec4(color*alpha,alpha);
}
// Matches the handoff's projectedEye, including its guarded spherical
// horizon and 1.15-pixel filter.
vec3 circleProjectedEyeDistances(vec2 point, vec4 cap, float guard, float cssPixel) {
    float guideRadius = max(0.1, 1.0 - max(0.0225, 1.25 * cssPixel) * guard);
    float eyeRadius = min(sqrt(max(0.0, 1.0 - cap.w * cap.w)), guideRadius - 0.001);
    float planeDistance = sqrt(max(0.0, guideRadius * guideRadius - eyeRadius * eyeRadius));
    if (cap.z < -eyeRadius / guideRadius) return vec3(10000.0, 10000.0, 0.0);
    float lateral = length(cap.xy);
    vec2 bearing = lateral > 0.00001 ? cap.xy / lateral : vec2(1.0, 0.0);
    vec2 p = vec2(dot(point, bearing), dot(point, vec2(-bearing.y, bearing.x)));
    float horizon = length(point) - guideRadius;
    float planeSide = (planeDistance - lateral * p.x) / max(lateral, 0.00001);
    vec2 distanceFromEdge = vec2(planeSide);
    if (abs(cap.z) > 0.0001) {
        vec2 axes = vec2(eyeRadius * abs(cap.z), eyeRadius);
        vec2 local = (p - vec2(lateral * planeDistance, 0.0)) / axes;
        // Preserve the authored coverage field. Its first-order ellipse
        // estimate diverges at the center, so optics need a separate bounded,
        // radially monotone field that cannot invent an interior horizon rim.
        vec2 ellipse = vec2(
            (dot(local, local) - 1.0) / max(2.0 * length(local / axes), 0.00001),
            (length(local) - 1.0) * min(axes.x, axes.y));
        distanceFromEdge = cap.z > 0.0 ? min(ellipse, planeSide) : max(-ellipse, planeSide);
    }
    distanceFromEdge = max(distanceFromEdge, horizon);
    // A horizon-clipped cap becomes a circular segment as it turns side-on.
    float halfWidth = cap.z >= eyeRadius / guideRadius ? eyeRadius * cap.z :
        max(0.0, (guideRadius - lateral * planeDistance + eyeRadius * cap.z) * 0.5);
    return vec3(distanceFromEdge, halfWidth);
}
// Orthographic projection of the source TorusGeometry(112, 47): the
// 112-unit centerline projects to an ellipse, and its 47-unit tube sweeps a
// disk around that ellipse. This keeps its thickness through edge-on poses.
float circleTorusDistance(vec2 point, vec3 normal) {
    const float major = 112.0 / 159.0;
    const float tube = 47.0 / 159.0;
    float aspect = abs(normal.z);
    float lateral = length(normal.xy);
    vec2 minorAxis = lateral > 0.00001 ? normal.xy / lateral : vec2(1.0, 0.0);
    vec2 p = abs(vec2(dot(point, vec2(-minorAxis.y, minorAxis.x)), dot(point, minorAxis)));
    if (aspect >= 0.999999) return abs(length(p) - major) - tube;
    if (aspect <= 0.000001) return length(vec2(max(p.x - major, 0.0), p.y)) - tube;
    vec2 axes = vec2(major, major * aspect);
    // Bisect the closest point's angle using unit vectors. Eight bounded
    // iterations avoid trigonometry and resolve the silhouette well below a
    // pixel even at 4K. The first-quadrant root also covers the inner rim.
    vec2 low = vec2(1.0, 0.0), high = vec2(0.0, 1.0);
    for (int i = 0; i < 8; ++i) {
        vec2 angle = normalize(low + high);
        float derivative = (axes.y * axes.y - axes.x * axes.x) * angle.x * angle.y +
                           axes.x * p.x * angle.y - axes.y * p.y * angle.x;
        if (derivative < 0.0) low = angle; else high = angle;
    }
    return length(p - axes * normalize(low + high)) - tube;
}
// The aperture is the ellipse eroded by the circular tube. Parameterize
// its upper boundary by the ellipse's inward normal, trimming the overlapping
// arcs at y=0. Only unresolved apertures need this bounded inversion.
float circleTorusHoleHeight(float x, vec2 axes, float tube, float maxCosine) {
    float low = 0.0, high = maxCosine;
    float aa = axes.x * axes.x, difference = axes.y * axes.y - aa;
    for (int i = 0; i < 8; ++i) {
        float cosine = 0.5 * (low + high);
        float normalLength = sqrt(aa + difference * cosine * cosine);
        float boundaryX = (axes.x - tube * axes.y / normalLength) * cosine;
        if (boundaryX < abs(x)) low = cosine; else high = cosine;
    }
    float cosine = 0.5 * (low + high);
    float normalLength = sqrt(aa + difference * cosine * cosine);
    return max(0.0, (axes.y - tube * axes.x / normalLength) * sqrt(max(0.0, 1.0 - cosine * cosine)));
}
float circleTorusHoleCoverage(vec2 center, vec2 halfPixel, vec2 majorAxis,
                              vec2 minorAxis, vec2 axes, vec2 bounds) {
    const float tube = 47.0 / 159.0;
    float halfMajor = dot(abs(majorAxis), halfPixel);
    float low = max(center.x - halfMajor, -bounds.x);
    float high = min(center.x + halfMajor, bounds.x);
    if (low >= high) return 0.0;
    float maxCosine = tube <= axes.y * axes.y / axes.x ? 1.0 :
        axes.x * bounds.x / (axes.x * axes.x - axes.y * axes.y);
    const vec4 nodes = vec4(0.1834346424956498, 0.5255324099163290,
                            0.7966664774136267, 0.9602898564975363);
    const vec4 weights = vec4(0.3626837833783620, 0.3137066458778873,
                              0.2223810344533745, 0.1012285362903763);
    float middle = 0.5 * (low + high), halfSpan = 0.5 * (high - low), area = 0.0;
    for (int i = 0; i < 8; ++i) {
        int pair = i / 2;
        float direction = (i % 2) == 0 ? -1.0 : 1.0;
        float u = middle + direction * halfSpan * nodes[pair];
        float height = circleTorusHoleHeight(u, axes, tube, maxCosine);
        float bottom = -height, top = height;
        // Each sample spans the true aperture in its minor direction. Clip
        // that span to the pixel square exactly before integrating its area.
        for (int axis = 0; axis < 2; ++axis) {
            float offset = (u - center.x) * majorAxis[axis];
            if (abs(minorAxis[axis]) > 0.000001) {
                float a = center.y + (-halfPixel[axis] - offset) / minorAxis[axis];
                float b = center.y + (halfPixel[axis] - offset) / minorAxis[axis];
                bottom = max(bottom, min(a, b));
                top = min(top, max(a, b));
            } else if (abs(offset) > halfPixel[axis]) {
                top = bottom;
            }
        }
        area += weights[pair] * max(0.0, top - bottom);
    }
    return clamp(area * halfSpan / max(4.0 * halfPixel.x * halfPixel.y, 0.00000001), 0.0, 1.0);
}
float circleTorusCoverage(vec2 point, vec3 normal, float distance) {
    // Evaluate every derivative before taking any fragment-varying branch.
    vec2 gradient = abs(vec2(dFdx(distance), dFdy(distance)));
    vec2 halfPixel = 0.5 * (abs(dFdx(point)) + abs(dFdy(point)));
    float pixelRadius = length(halfPixel);
    if (distance <= -pixelRadius) return 1.0;
    if (distance >= pixelRadius) return 0.0;
    float wide = max(max(gradient.x, gradient.y), 0.00001);
    float narrow = min(gradient.x, gradient.y);
    float coverage;
    if (narrow <= 0.000001 * wide) {
        coverage = clamp(0.5 - distance / wide, 0.0, 1.0);
    } else {
        // Exact box-filter coverage for the local edge, including diagonal
        // capsule sides. A fixed-width ramp gains area on rotated rings.
        float edge = abs(distance);
        float inner = 0.5 * (wide - narrow), outer = 0.5 * (wide + narrow);
        float corner = max(outer - edge, 0.0);
        float tail = edge < inner ? 0.5 - edge / wide : corner * corner / (2.0 * wide * narrow);
        coverage = distance > 0.0 ? tail : 1.0 - tail;
    }
    const float major = 112.0 / 159.0, tube = 47.0 / 159.0;
    float minor = major * abs(normal.z), aa = major * major, bb = minor * minor;
    float lateral = length(normal.xy);
    vec2 minorAxis = lateral > 0.00001 ? normal.xy / lateral : vec2(1.0, 0.0);
    vec2 majorAxis = vec2(-minorAxis.y, minorAxis.x);
    vec2 center = vec2(dot(point, majorAxis), dot(point, minorAxis));
    vec2 p = abs(center);
    if (tube > pixelRadius && p.x <= major && p.y <= minor &&
        dot(p * p, vec2(bb, aa)) <= aa * bb) {
        // Inside the centerline ellipse the outer contour is at least one
        // tube radius away. Inner normal offsets can overlap here; their
        // distance field must not invent translucent seams beyond the hole.
        if (minor <= tube) return 1.0;
        float holeMajor = tube <= bb / major ? major - tube :
            sqrt(max(0.0, (aa - bb) * (1.0 - tube * tube / bb)));
        vec2 bounds = vec2(holeMajor, minor - tube);
        vec2 footprint = vec2(dot(abs(majorAxis), halfPixel), dot(abs(minorAxis), halfPixel));
        if (p.x > bounds.x + footprint.x || p.y > bounds.y + footprint.y) return 1.0;
        float unresolved = 1.0 - smoothstep(2.0 * pixelRadius, 3.0 * pixelRadius, bounds.y);
        if (unresolved > 0.0) {
            float hole = circleTorusHoleCoverage(center, halfPixel, majorAxis, minorAxis,
                                                vec2(major, minor), bounds);
            coverage = mix(coverage, 1.0 - hole, unresolved);
        }
    }
    return clamp(coverage, 0.0, 1.0);
}
// Split the authored silhouette into pigment and glass, without changing any
// of its edge coverage. The torus opening exists only inside its centerline.
vec2 circleTorusCoverages(vec2 point, vec3 normal, float distance) {
    float pigment = circleTorusCoverage(point, normal, distance);
    const float major = 112.0 / 159.0, tube = 47.0 / 159.0;
    float minor = major * abs(normal.z);
    float lateral = length(normal.xy);
    vec2 minorAxis = lateral > 0.00001 ? normal.xy / lateral : vec2(1.0, 0.0);
    vec2 p = vec2(dot(point, vec2(-minorAxis.y, minorAxis.x)), dot(point, minorAxis));
    float inside = minor > tube && dot(p * p, vec2(minor * minor, major * major)) <
        major * major * minor * minor ? 1.0 : 0.0;
    return vec2(pigment, (1.0 - pigment) * inside);
}
float circleTorusOpticalField(vec2 point, vec3 normal) {
    const float major = 112.0 / 159.0, tube = 47.0 / 159.0;
    float minor = major * abs(normal.z);
    if (minor <= tube) return 0.0;
    float lateral = length(normal.xy);
    vec2 minorAxis = lateral > 0.00001 ? normal.xy / lateral : vec2(1.0, 0.0);
    vec2 p = vec2(dot(point, vec2(-minorAxis.y, minorAxis.x)), dot(point, minorAxis));
    float aa = major * major, bb = minor * minor;
    float holeMajor = tube <= bb / major ? major - tube :
        sqrt(max(0.0, (aa - bb) * (1.0 - tube * tube / bb)));
    vec2 local = p / max(vec2(holeMajor, minor - tube), vec2(0.00001));
    // The true distance has a normal discontinuity along a narrow hole's
    // medial axis. Use a smooth elliptical field for optical normals only;
    // the exact distance still controls its coverage and refracting edge.
    return -dot(local, local);
}
struct CircleSurface {
    vec2 coverage;
    vec4 edge; // inward screen normal XY, distance to rim, projected aperture half-width in pixels
};
CircleSurface circleShapeCoverage(vec2 point, vec4 cap, vec4 shape) {
    CircleSurface result;
    result.coverage = vec2(0.0);
    result.edge = vec4(0.0);
    float radius = shape.x, torusMix = shape.y;
    if (radius <= 0.0) return result;
    vec2 q = point / radius;
    float pixel = max(fwidth(q.x), fwidth(q.y));
    vec3 capDistances = circleProjectedEyeDistances(q, cap, shape.w, pixel * shape.z);
    float capDepth = -capDistances.x, opticalCapDepth = -capDistances.y;
    float torusDepth = torusMix > 0.0 ? circleTorusDistance(q, cap.xyz) : 0.0;
    float torusOpticalField = torusMix > 0.0 ? circleTorusOpticalField(q, cap.xyz) : 0.0;
    // Derivatives must precede fragment-varying mask branches. Normals from
    // alpha would disappear throughout the fully covered glass interior.
    vec2 capGradient = vec2(dFdx(opticalCapDepth), dFdy(opticalCapDepth));
    vec2 torusGradient = vec2(dFdx(torusOpticalField), dFdy(torusOpticalField));
    float edge = length(q) - 1.0;
    float edgeWidth = max(length(vec2(dFdx(edge), dFdy(edge))), 0.00001);
    float body = clamp(0.5 - edge / edgeWidth, 0.0, 1.0);
    float aa = max(pixel * 1.15, 0.00001);
    float aperture = 1.0 - smoothstep(-aa, aa, -capDepth);
    vec2 sphere = vec2(body * (1.0 - aperture), body * aperture);
    vec2 torus = torusMix > 0.0 ? circleTorusCoverages(q, cap.xyz, torusDepth) : vec2(0.0);
    result.coverage = torusMix < 0.00001 ? sphere : torusMix > 0.99999 ? torus : mix(sphere, torus, torusMix);
    vec2 weights = vec2((1.0 - torusMix) * sphere.y, torusMix * torus.y);
    weights /= max(weights.x + weights.y, 0.00001);
    vec2 gradientLengths = max(vec2(length(capGradient), length(torusGradient)), vec2(0.00001));
    vec2 inward = weights.x * capGradient / gradientLengths.x + weights.y * torusGradient / gradientLengths.y;
    inward /= max(length(inward), 0.00001);
    float distance = dot(weights, max(vec2(opticalCapDepth, torusDepth), 0.0)) / max(pixel, 0.00001);
    float torusHalfWidth = max(0.0, (112.0 * abs(cap.z) - 47.0) / 159.0);
    float apertureRadius = dot(weights, vec2(capDistances.z, torusHalfWidth));
    result.edge = vec4(inward, distance, apertureRadius / max(pixel, 0.00001));
    return result;
}
// A subtle directional sheen inside the opening. The background remains
// transparent and is composed by the host without blur or refraction.
float circleHighlight(vec4 edge, vec4 style) {
    float band = max(0.00001, min(style.x, edge.w));
    float bevel = 1.0 - smoothstep(0.0, band, edge.z);
    float radians = style.z * (3.14159265358979323846 / 180.0);
    vec2 light = vec2(sin(radians), -cos(radians));
    float facing = dot(-edge.xy, light);
    float primary = pow(max(facing, 0.0), 3.0);
    float secondary = 0.45 * pow(max(-facing, 0.0), 5.0);
    return clamp(style.y * 0.06 * bevel * (primary + secondary), 0.0, 1.0);
}
vec4 circleShapeFragment(vec2 coverage, vec3 pigment, float opacity, float highlight) {
    return covered(encodeSRGB(pigment), opacity * coverage.x) + vec4(highlight * opacity * coverage.y);
}
float studio(vec3 direction, float roughness) {
    float keyPower = max(1.0,12.0/(1.0+14.0*roughness*roughness));
    float fillPower = max(1.0,6.0/(1.0+10.0*roughness*roughness));
    return .32+.10*direction.y+4.0*(keyPower+1.0)/25.0*pow(max(0.0,dot(direction,normalize(vec3(-.55,.65,1.0)))),keyPower)
        +.8*(fillPower+1.0)/13.0*pow(max(0.0,dot(direction,normalize(vec3(.7,.15,.8)))),fillPower);
}
// Shared immutable sampling tables match the Metal constant-address data.
const vec2 shadowBlockerOffsets[33] = vec2[33](
    vec2(0.0000000000,0.0000000000),
    vec2(-0.6058984445,0.3645367950),
    vec2(0.6058984445,-0.3645367950),
    vec2(0.1417958324,-0.4794725664),
    vec2(-0.1417958324,0.4794725664),
    vec2(0.3798789795,0.7782621415),
    vec2(-0.3798789795,-0.7782621415),
    vec2(-0.3289744169,-0.1295215542),
    vec2(0.3289744169,0.1295215542),
    vec2(0.7380501237,-0.2833408104),
    vec2(-0.7380501237,0.2833408104),
    vec2(-0.2732941452,0.5480057575),
    vec2(0.2732941452,-0.5480057575),
    vec2(-0.2576231994,-0.8992387264),
    vec2(0.2576231994,0.8992387264),
    vec2(0.2131115383,0.1307037576),
    vec2(-0.2131115383,-0.1307037576),
    vec2(-0.7362928067,0.1427336778),
    vec2(0.7362928067,-0.1427336778),
    vec2(0.3328045713,-0.4491560056),
    vec2(-0.3328045713,0.4491560056),
    vec2(0.0935234621,0.8965229289),
    vec2(-0.0935234621,-0.8965229289),
    vec2(-0.3240451771,-0.2872189465),
    vec2(0.3240451771,0.2872189465),
    vec2(0.8290446333,-0.0136013238),
    vec2(-0.8290446333,0.0136013238),
    vec2(-0.4803289058,0.4547352441),
    vec2(0.4803289058,-0.4547352441),
    vec2(0.0688160950,-0.9657972588),
    vec2(-0.0688160950,0.9657972588),
    vec2(0.1098446320,0.1385068836),
    vec2(-0.1098446320,-0.1385068836)
);

const vec2 shadowFilterOffsets[64] = vec2[64](
    vec2(0.0000000000,0.0000000000),
    vec2(-0.0763360288,0.0459273192),
    vec2(0.0437591439,-0.1479684464),
    vec2(0.0873804668,0.1790173000),
    vec2(-0.2193162780,-0.0863477028),
    vec2(0.2495064809,-0.0957866766),
    vec2(-0.1318638538,0.2644116324),
    vec2(-0.0884641576,-0.3087858416),
    vec2(0.2941218657,0.1803883232),
    vec2(-0.3606022916,0.0699043789),
    vec2(0.2311829494,-0.3120065620),
    vec2(0.0423577873,0.4060449292),
    vec2(-0.3197301353,-0.2833942892),
    vec2(0.4453754691,-0.0073068394),
    vec2(-0.3361602080,0.3182483761),
    vec2(0.0340971526,-0.4785353846),
    vec2(0.3082118993,0.3886350102),
    vec2(-0.5053376295,-0.0808618708),
    vec2(0.4399979324,-0.2901372043),
    vec2(-0.1320751009,0.5255539567),
    vec2(-0.2644895609,-0.4894579468),
    vec2(0.5389601763,0.1868656035),
    vec2(-0.5362579642,0.2317266431),
    vec2(0.2443832959,-0.5453619549),
    vec2(0.1923225224,0.5796791530),
    vec2(-0.5446105743,-0.3037897484),
    vec2(0.6190454545,-0.1467808913),
    vec2(-0.3642546032,0.5366129934),
    vec2(-0.0956419072,-0.6537282020),
    vec2(0.5213383785,0.4249555829),
    vec2(-0.6831507176,0.0394850003),
    vec2(0.4850807598,-0.4988222535),
    vec2(-0.0210710230,0.7067927645),
    vec2(-0.4691689131,-0.5438322782),
    vec2(0.7241947477,0.0853697789),
    vec2(-0.6004310124,0.4325524788),
    vec2(0.1527204987,-0.7349615723),
    vec2(0.3892168311,0.6541218065),
    vec2(-0.7387660826,-0.2224022716),
    vec2(0.7041790441,-0.3394745720),
    vec2(-0.2936690935,0.7353520181),
    vec2(-0.2837051252,-0.7499123581),
    vec2(0.7245364337,0.3657555400),
    vec2(-0.7906723332,0.2223520546),
    vec2(0.4378829168,-0.7062115417),
    vec2(0.1559196677,0.8258560792),
    vec2(-0.6803459419,-0.5092657672),
    vec2(0.8549125764,-0.0849689635),
    vec2(-0.5791186291,0.6469852142),
    vec2(-0.0101129794,-0.8773477062),
    vec2(0.6062518571,0.6466629505),
    vec2(-0.8927288939,-0.0679884073),
    vec2(0.7111340715,-0.5583445619),
    vec2(-0.1486341693,0.9006893011),
    vec2(-0.5035368203,-0.7717881962),
    vec2(0.9009315094,0.2310882525),
    vec2(-0.8279092737,0.4421748697),
    vec2(0.3145860756,-0.8932306521),
    vec2(0.3746749877,0.8788157180),
    vec2(-0.8774369503,-0.3983413446),
    vec2(0.9238668962,-0.3015201527),
    vec2(-0.4815531206,0.8534776226),
    vec2(-0.2232560954,-0.9624693201),
    vec2(0.8213581418,0.5634130767)
);

vec2 shadowReceiverGradient(vec2 uv, float depth) {
    vec2 dx = dFdx(uv), dy = dFdy(uv);
    float dzdx = dFdx(depth), dzdy = dFdy(depth);
    float determinant = dx.x*dy.y-dx.y*dy.x;
    if (abs(determinant) < .0000000001) return vec2(0.);
    return vec2(dzdx*dy.y-dzdy*dx.y,dx.x*dzdy-dy.x*dzdx)/determinant;
}
float shadowVisibility(vec4 lightPosition, vec3 normal, vec3 light) {
    vec3 p = lightPosition.xyz/lightPosition.w;
    vec2 uv = p.xy*.5+.5;
    float receiverDepth = p.z*.5+.5;
    // Derivatives must be evaluated before lanes outside the light frustum return.
    vec2 gradient = shadowReceiverGradient(uv,receiverDepth);
    if (any(lessThan(uv,vec2(0.))) || any(greaterThan(uv,vec2(1.))) || p.z < -1. || p.z > 1.) return 1.;
    vec2 mapSize = vec2(textureSize(shadowMap,0));
    vec2 texel = 1./mapSize;
    bool compact = max(mapSize.x,mapSize.y) <= 512.;
    float worldWidth = max(f.shadowParameters.y,.0001);
    float depthSpan = max(f.shadowParameters.z,.0001);
    float angularRadius = max(f.shadowParameters.x,0.);
    float worldTexel = worldWidth*max(texel.x,texel.y);
    float nl = clamp(dot(normal,light),0.,1.);
    float bias = worldTexel*max(f.shadowParameters.w,0.)*(1.+.5*(1.-nl))/depthSpan;
    // Account for the receiver plane at every tap, instead of increasing a
    // constant bias until a nearby frame's shadow detaches from the face.
    float gradientLimit = 4.*worldWidth/depthSpan;
    gradient = clamp(gradient,vec2(-gradientLimit),vec2(gradientLimit));
    float centerDepth = textureLod(shadowDepth,uv,0.).r;
    // Search the entire filter support, including when the center ray is
    // unblocked. Otherwise thin frames develop hard edges at the search radius.
    float searchRadius = .06;

    float gapSum = 0., blockerCount = 0.;
    int searchCount = compact ? 13 : 33;
    for (int i=0;i<33;++i) {
        if (i>=searchCount) break;
        vec2 offset = shadowBlockerOffsets[i]*searchRadius;
        vec2 sampleUV = uv+offset;
        if (any(lessThan(sampleUV,vec2(0.))) || any(greaterThan(sampleUV,vec2(1.)))) continue;
        float sampleDepth = i==0 ? centerDepth : textureLod(shadowDepth,sampleUV,0.).r;
        float receiver = receiverDepth+dot(gradient,offset);
        if (sampleDepth < receiver-bias) {
            gapSum += max(receiver-sampleDepth,0.)*depthSpan;
            blockerCount += 1.;
        }
    }
    if (blockerCount == 0.) return 1.;
    float radius = clamp(angularRadius*(gapSum/blockerCount)/worldWidth,
                         .5*max(texel.x,texel.y),.06);

    float visibility = 0., weightSum = 0.;
    int filterCount = compact ? 24 : 64;
    for (int j=0;j<64;++j) {
        if (j>=filterCount) break;
        int i = (j*63+(filterCount-1)/2)/(filterCount-1);
        vec2 offset = shadowFilterOffsets[i]*radius;
        vec2 sampleUV = uv+offset;
        float weight = 1.-.75*dot(shadowFilterOffsets[i],shadowFilterOffsets[i]);
        float value = 1.;
        if (all(greaterThanEqual(sampleUV,vec2(0.))) && all(lessThanEqual(sampleUV,vec2(1.))))
            value = texture(shadowMap,vec3(sampleUV,receiverDepth+dot(gradient,offset)-bias));
        visibility += value*weight;
        weightSum += weight;
    }
    return visibility/weightSum;
}
vec3 occlusionPosition(vec2 uv, float depth) {
#ifdef AUTHORED_COMPUTER
    vec4 p=crowdInverseProjection*vec4(uv*2.-1.,depth*2.-1.,1.);
    vec3 world=p.xyz/p.w;
    world.xy=(world.xy-avatarCanvasOffset-vec2(0.,avatarComputerCamera.z))/avatarComputerCamera.xy;
    return world;
#else
    vec4 p=f.inverseViewProjection*vec4(uv*2.-1.,depth*2.-1.,1.);
    return p.xyz/p.w;
#endif
}
float contactOcclusion(vec2 uv, vec3 world, vec3 normal) {
    // Resolve the fixed sampling phases on this surface only. Depth and
    // receiver-plane rejection keep accessory edges and transparency sharp.
    ivec2 size = textureSize(ambientOcclusion,0);
    ivec2 origin = clamp(ivec2(uv*vec2(size)),ivec2(0),size-1);
    float sum = 0., weights = 0.;
    float tolerance = min(.012,max(.002,f.effects.w*.04));
    for (int y=-2;y<=2;++y) for (int x=-2;x<=2;++x) {
        ivec2 pixel = clamp(origin+ivec2(x,y),ivec2(0),size-1);
        vec2 sampleUV = (vec2(pixel)+.5)/vec2(size);
        float depth = texelFetch(occlusionDepth,pixel,0).r;
        if (depth >= .99999) continue;
        vec3 position = occlusionPosition(sampleUV,depth);
        float separation = abs(dot(position-world,normal));
        float weight = float((3-abs(x))*(3-abs(y)))*(1.-smoothstep(tolerance,tolerance*2.,separation));
        sum += texelFetch(ambientOcclusion,pixel,0).r*weight;
        weights += weight;
    }
    return weights > .00001 ? sum/weights : 1.;
}
// Analytic color and shape effects for the playground gestures.
vec3 playgroundBody(vec3 color,vec3 world) {
    if(d.paletteReference.y!=9.0) return color;
    float radius=max(f.errorBodyBounds.w,.01);
    float top=f.errorBodyBounds.y;
    float mask=smoothstep(top-radius*.65,top+radius*.10,world.y);
    vec3 pigment=vec3(1.0,.004,.022);
    float shade=.86+.14*clamp(max(color.x,max(color.y,color.z)),0.0,1.0);
    return mix(color,pigment*shade,mask*d.paletteReference.z*.98);
}
// Payment light is confined to two prepared quads. No screen-space bloom pass.
float paymentStrokeDistance(vec2 p,vec2 a,vec2 b) {
    vec2 v=b-a;
    return length(p-a-v*clamp(dot(p-a,v)/max(dot(v,v),.00001),0.,1.));
}
vec4 paymentLight(vec2 uv,vec4 style,float opacity) {
    vec2 q=(uv-.5)*2.;
    float t=clamp(style.x,0.,1.);
    vec3 mint=vec3(.10,.86,.94),white=vec3(.90,1.,.98);
    if(style.w == -41.) {
        // Measure in reader space so both legs keep the same rounded weight.
        vec2 p=(uv-.5)*vec2(.90,.60);
        float reveal=smoothstep(.015,.36,t);
        vec2 a=vec2(-.15,.008),b=vec2(-.042,-.078),c=vec2(.17,.122);
        float first=clamp(reveal/.36,0.,1.);
        float second=clamp((reveal-.36)/.64,0.,1.);
        vec2 tip=reveal<.36?mix(a,b,first):mix(b,c,second);
        float distance=paymentStrokeDistance(p,a,mix(a,b,first));
        if(reveal>.36) distance=min(distance,paymentStrokeDistance(p,b,tip));
        float bloom=smoothstep(.25,.38,t)*(1.-smoothstep(.43,.72,t));
        float aa=max(fwidth(distance),.0008);
        float weight=.018*(1.+.06*bloom);
        float core=1.-smoothstep(weight-aa,weight+aa,distance);
        float inner=exp(-distance*distance/.0012)*(.36+.20*bloom);
        float aura=exp(-distance*distance/.008)*(.15+.22*bloom);
        float travel=(1.-smoothstep(.37,.55,t))*smoothstep(0.,.02,t);
        vec2 delta=p-tip;
        float spark=exp(-dot(delta,delta)/.00018)*travel;
        float tipGlow=exp(-dot(delta,delta)/.0018)*travel*.40;
        float birth=smoothstep(0.,.02,t);
        float luminance=clamp(core+inner+aura+tipGlow,0.,1.);
        return covered(mix(mint,white,clamp(core+spark,0.,1.)),opacity*birth*luminance);
    }
    // The completed stroke releases its light, followed by a softer echo.
    float release=smoothstep(.30,.98,t);
    vec2 center=vec2(.12,-.17+.20*release);
    vec2 delta=q-center;
    float radius=.08+.68*release;
    float radial=length(delta*vec2(1.,1.10));
    float distance=abs(radial-radius);
    float echoDistance=abs(radial-radius*.70);
    float envelope=smoothstep(.29,.44,t)*(1.-smoothstep(.57,1.,t));
    float upper=.18+.82*smoothstep(-.32,.46,delta.y);
    float ring=exp(-distance*distance/.0018)*.44+exp(-distance*distance/.020)*.24;
    float echo=exp(-echoDistance*echoDistance/.008)*.14;
    float seed=exp(-dot(delta,delta)/.028)*smoothstep(0.,.035,t)*(1.-smoothstep(.13,.32,t))*.70;
    float glow=(ring+echo)*envelope*upper+seed;
    float sharp=seed;
    for(int i=0;i<2;++i) {
        float delay=float(i)*.09;
        float flight=smoothstep(.35+delay,.97,t);
        float life=smoothstep(.34+delay,.44+delay,t)*(1.-smoothstep(.60+delay,.96,t));
        vec2 origin=vec2(.315,.003);
        vec2 at=origin+(i==0?vec2(-.05*flight-.07*sin(flight*3.14159),.68*flight):vec2(-.55*flight,.48*flight));
        vec2 p=q-at;
        float size=i==0?1.:.66;
        p/=size;
        float point=exp(-dot(p,p)/.0018);
        float cross=exp(-abs(p.x)*62.-abs(p.y)*14.)+exp(-abs(p.x)*14.-abs(p.y)*62.);
        float haze=exp(-dot(p,p)/.018)*.26;
        vec2 tail=p+vec2(.015,.085);
        float trail=exp(-tail.x*tail.x/.0018-tail.y*tail.y/.012)*.18;
        glow+=(point*.65+cross*.30+haze+trail)*life;
        sharp+=(point+cross*.35)*life;
    }
    float edge=1.-smoothstep(.86,1.,max(abs(q.x),abs(q.y)));
    vec3 color=mix(vec3(.16,.68,1.),mint,.55+.45*envelope);
    return covered(mix(color,white,clamp(sharp,0.,1.)),opacity*edge*clamp(glow,0.,.96));
}

vec4 playgroundEffect(vec2 uv, vec4 style, vec4 coverage) {
    float kind=style.x;
    vec2 q=uv*2.0-1.0;
    if (style.w == -27.0) {
        float top=length(q-vec2(clamp(q.x,-.58,.58),.62))-.20;
        float bottom=length(q-vec2(clamp(q.x,-.58,.58),-.62))-.20;
        vec2 axis=vec2(1.16,1.24), start=vec2(-.58,-.62);
        float diagonal=length(q-start-axis*clamp(dot(q-start,axis)/dot(axis,axis),0.0,1.0))-.20;
        float d=min(top,min(bottom,diagonal));
        return covered(vec3(.78,.87,.35),coverage.x*(1.0-smoothstep(-.035,.035,d)));
    }
    if (style.w == -30.0) {
        float taper=1.0-.70*uv.x;
        float profile=exp(-q.y*q.y/(.26*taper*taper));
        float fade=pow(max(0.0,1.0-uv.x),.7)*smoothstep(0.0,.08,uv.x);
        vec3 stem=mix(encodeSRGB(style.xyz),vec3(1.0),smoothstep(.12,.60,uv.x));
        return covered(stem,coverage.x*profile*fade);
    }
    if (kind==4.0 || kind==8.0) {
        vec2 curved=q;
        if(kind==8.0) curved.y=-curved.y;
        float distance=10.0;
        for (int segment=0;segment<12;++segment) {
            float x0=-.78+float(segment)*.13, x1=x0+.13;
            vec2 a=vec2(x0,.30-1.10*x0*x0), b=vec2(x1,.30-1.10*x1*x1);
            vec2 axis=b-a;
            float along=clamp(dot(curved-a,axis)/dot(axis,axis),0.0,1.0);
            distance=min(distance,length(curved-a-along*axis));
        }
        float aa=clamp(fwidth(distance),.015,.10);
        float thickness=kind==4.0?.11:.12;
        float ink=1.0-smoothstep(thickness-aa,thickness+aa,distance);

        return covered(vec3(.006),coverage.x*ink);
    }
    if (kind==9.0) {
        float edge=max(length(q/vec2(.87,1.0))-.90,q.y-.22);
        float aa=max(fwidth(edge),.02);
        return covered(vec3(.006),coverage.x*(1.0-smoothstep(-aa,aa,edge)));
    }
    return vec4(0.0);
}

// A bounded finite source illuminates the character and the socket lip.
vec3 thinkingIllumination(vec3 world,vec3 n,vec3 albedo) {
    if ((avatarComputerCoverage.y <= 0. && avatarComputerReference.w != -38.) || f.thinkingLightPositionStrength.w <= 0.) return vec3(0.);
    vec3 delta=f.thinkingLightPositionStrength.xyz-world;
    float distance2=max(dot(delta,delta),.0001);
    float radius2=f.thinkingLightColorRadius.w*f.thinkingLightColorRadius.w;
    float amount=pow(radius2/(distance2+radius2),1.35)*max(dot(n,delta*inversesqrt(distance2)),0.);
    if (avatarComputerReference.w == -38.) {
        float radius=max(length(avatarComputerWorld[1].xyz),.0001);
        float height=dot(world-avatarComputerWorld[3].xyz,avatarComputerWorld[1].xyz)/(radius*radius);
        float lip=smoothstep(-1.72,-1.36,height);
        // The broad luminous globe is reflected across the rounded upper lip.
        float areaResponse=.20+.80*max(dot(n,delta*inversesqrt(distance2)),0.);
        float reflection=pow(radius2/(distance2+radius2),1.35)*areaResponse;
        return f.thinkingLightColorRadius.xyz*reflection*f.thinkingLightPositionStrength.w*(.13*lip);
    }
    return f.thinkingLightColorRadius.xyz*(.10+.90*albedo)*amount*f.thinkingLightPositionStrength.w;
}
// The touch source is attached to the hand, including its fitted layout.
vec3 workingTouchLight(vec3 world,vec3 n,vec3 albedo) {
    if(avatarComputerReference.w != -40. || avatarComputerEye0.w <= 0.) return vec3(0.);
    vec3 center=(avatarComputerWorld*vec4(avatarComputerEye0.xyz,1.)).xyz;
    vec3 delta=center-world;
    float distance2=max(dot(delta,delta),.00001);
    float radius=avatarComputerEye1.w*length(avatarComputerWorld[0].xyz);
    float falloff=pow(radius*radius/(radius*radius+distance2),2.);
    float facing=max(dot(n,delta*inversesqrt(distance2)),0.);
    return avatarComputerEye1.xyz*(.08+.92*albedo)*
        (.55*avatarComputerEye0.w*falloff*facing);
}

// Rounded field, contact shadow and cursor share one surface and coverage.
vec4 replyCardMaterial(vec2 p, float front, float cursor, vec3 pigment) {
    vec2 q=abs(p)-vec2(.435,.20);
    float fieldDistance=length(max(q,vec2(0.)))+min(max(q.x,q.y),0.)-.075;
    float aa=max(fwidth(fieldDistance),.0001);
    float field=(1.-smoothstep(-aa,aa,fieldDistance))*front;
    float contact=(1.-smoothstep(0.,.025,abs(fieldDistance)))*.14;
    vec3 color=mix(pigment,vec3(.95,.97,1.)*(1.-contact),field);
    q=abs(p-vec2(-.31,0.))-vec2(.002,.13);
    float cursorDistance=length(max(q,vec2(0.)))+min(max(q.x,q.y),0.)-.04;
    aa=max(fwidth(cursorDistance),.0001);
    float ink=(1.-smoothstep(-aa,aa,cursorDistance))*field*cursor;
    color=mix(color,vec3(.025,.07,.14),ink);
    return vec4(color,mix(.34,.40,field));
}

// Pigment is fixed along the authored stroke, never normalized by reveal
// progress or animated with time. Deposited paint keeps its exact color.
vec3 creatingPigment(float position) {
    float x=clamp(position,0.,1.)*6.;
    if(x<1.) return mix(vec3(0.890005,0.043234,0.039682),vec3(1.000000,0.214041,0.013412),smoothstep(0.,1.,x-0.));
    if(x<2.) return mix(vec3(1.000000,0.214041,0.013412),vec3(1.000000,0.587016,0.019607),smoothstep(0.,1.,x-1.));
    if(x<3.) return mix(vec3(1.000000,0.587016,0.019607),vec3(0.033105,0.447988,0.132868),smoothstep(0.,1.,x-2.));
    if(x<4.) return mix(vec3(0.033105,0.447988,0.132868),vec3(0.013412,0.263273,0.848088),smoothstep(0.,1.,x-3.));
    if(x<5.) return mix(vec3(0.013412,0.263273,0.848088),vec3(0.100482,0.088982,0.710566),smoothstep(0.,1.,x-4.));
    return mix(vec3(0.100482,0.088982,0.710566),vec3(0.420033,0.050876,0.587016),smoothstep(0.,1.,x-5.));
}

vec3 creatingPaintPoint(float t) {
    float u=1.-t;
    vec3 p=vec3(-.30,-.43,.068)*(u*u*u)+vec3(.35,-.29,.068)*(3.*u*u*t)+
        vec3(-.30,.25,.068)*(3.*u*t*t)+vec3(.27,.40,.068)*(t*t*t);
    return p;
}
// A stationary contact shadow anchors the deposited paint to the canvas.
float creatingCanvasShadow(vec2 uv, float progress) {
    float shadow=0.;
    for (int i=0;i<16;++i) {
        float t0=float(i)/16., t1=min(float(i+1)/16.,progress);
        if(t0>=progress) break;
        vec3 a=creatingPaintPoint(t0),b=creatingPaintPoint(t1);
        vec2 x=a.xy+vec2(.28,-.30)*(a.z-.042);
        vec2 y=b.xy+vec2(.28,-.30)*(b.z-.042);
        vec2 edge=y-x;
        float along=clamp(dot(uv-x,edge)/max(dot(edge,edge),.000001),0.,1.);
        float t=mix(t0,t1,along),height=mix(a.z,b.z,along)-.042;
        float cap=sqrt(max(0.,min(1.,min(t,1.-t)/.045)));
        float width=(.082+.040*sin(3.141592653589793*t)+.014*t)*cap;
        float distance=max(0.,length(uv-mix(x,y,along))-width);
        float softness=.010+.095*height;
        shadow=max(shadow,exp(-.5*distance*distance/(softness*softness))*.29/(1.+height));
    }
    return shadow;
}

// BEGIN GENERATED FELIPE
uniform highp sampler2D furLTC1,furLTC2;
vec3 felipeDisplay(vec3 color) {
    const mat3 inputMatrix=mat3(vec3(.59719,.076,.0284),vec3(.35458,.90834,.13383),vec3(.04823,.01566,.83777));
    const mat3 outputMatrix=mat3(vec3(1.60475,-.10208,-.00327),vec3(-.53108,1.10813,-.07276),vec3(-.07367,-.00605,1.07602));
    color=inputMatrix*(color*(.8/.6));
    color=(color*(color+.0245786)-.000090537)/(color*(.983729*color+.432951)+.238081);
    color=encodeSRGB(clamp(outputMatrix*color,0.,1.));
    float hi=max(max(color.r,color.g),color.b),lo=min(min(color.r,color.g),color.b);
    float chroma=hi-lo,lightness=(hi+lo)*.5;
    if(chroma>.00001){float sat=clamp(chroma/max(1.-abs(2.*lightness-1.),.00001),0.,1.);color=mix(vec3(lightness),color,(1.-pow(1.-sat,2.))/max(sat,.00001));}
    return color;
}
vec3 felipeLTCEdge(vec3 a,vec3 b){float x=dot(a,b),y=abs(x);float v=(.8543985+(.4965155+.0145206*y)*y)/(3.417594+(4.1616724+y)*y);return cross(a,b)*(x>0.?v:.5*inversesqrt(max(1.-x*x,1e-7))-v);}
float felipeLTC(vec3 p,mat3 transform,highp vec3 rect[4]) {
    if(dot(cross(rect[1]-rect[0],rect[3]-rect[0]),p-rect[0])<0.)return 0.;
    vec3 a=normalize(transform*(rect[0]-p)),b=normalize(transform*(rect[1]-p));
    vec3 c=normalize(transform*(rect[2]-p)),d=normalize(transform*(rect[3]-p));
    vec3 ff=felipeLTCEdge(a,b)+felipeLTCEdge(b,c)+felipeLTCEdge(c,d)+felipeLTCEdge(d,a);
    float len=length(ff);return max((len*len+ff.z)/(len+1.),0.);
}
vec2 felipeRect(vec3 p,mat3 diffuseBasis,mat3 specularBasis,float fresnel,
                  vec3 light,vec2 size,float intensity) {
    vec3 z=normalize(light),right=normalize(cross(vec3(0,1,0),z))*size.x*.5;
    vec3 up=normalize(cross(z,right))*size.y*.5;
    highp vec3 rect[4];rect[0]=light+right-up;rect[1]=light-right-up;rect[2]=light-right+up;rect[3]=light+right+up;
    return intensity*vec2(felipeLTC(p,diffuseBasis,rect),fresnel*felipeLTC(p,specularBasis,rect));
}
// Lighting vectors are finite and bounded by the character/light rig. Use
// GPU math intrinsics here, retaining precise geometry and optical calculations.
// RGB is diffuse irradiance, W is the achromatic dielectric reflection.
// The same roughness/view lookup and tangent basis serve all three soft lights.
float felipeSpecular(vec3 n,vec3 v,vec3 l,float roughness) {
    float nl=max(dot(n,l),0.),nv=max(dot(n,v),.001);
    vec3 h=normalize(l+v);
    float nh=max(dot(n,h),0.),vh=max(dot(v,h),0.);
    float alpha=roughness*roughness,a2=alpha*alpha;
    float denominator=nh*nh*(a2-1.)+1.;
    float distribution=a2/(PI*denominator*denominator);
    float visibility=.5/max(nl*sqrt(nv*nv*(1.-a2)+a2)+nv*sqrt(nl*nl*(1.-a2)+a2),.00001);
    float fresnel=.04+.96*exp2((-5.55473*vh-6.98316)*vh);
    return nl*distribution*visibility*fresnel;
}
vec4 felipeLighting(vec3 n,vec3 view,vec3 p,float roughness) {

    vec2 uv=vec2(roughness,sqrt(1.-clamp(dot(n,view),0.,1.)))*(63./64.)+.5/64.;
    vec4 a=textureLod(furLTC1,uv,0.),b=textureLod(furLTC2,uv,0.);
    vec3 tangent=view-n*dot(view,n);
    if(dot(tangent,tangent)<1e-8)tangent=cross(n,abs(n.y)<.95?vec3(0,1,0):vec3(1,0,0));
    tangent=normalize(tangent);
    mat3 diffuseBasis=transpose(mat3(tangent,-cross(n,tangent),n));
    mat3 specularBasis=mat3(vec3(a.x,0,a.y),vec3(0,1,0),vec3(a.z,0,a.w))*diffuseBasis;
    float fresnel=.04*b.x+.96*b.y;
    vec2 area=felipeRect(p,diffuseBasis,specularBasis,fresnel,vec3(-6,7,1),vec2(5,6),.2);
    area+=felipeRect(p,diffuseBasis,specularBasis,fresnel,vec3(5,1,-2),vec2(4,7),1.3);
    area+=felipeRect(p,diffuseBasis,specularBasis,fresnel,vec3(0,-5,-1),vec2(5,3),1.);
    vec3 key=normalize(vec3(-5,7,6));
    vec3 hemi=mix(vec3(.6867,.7682,.8714),vec3(1),dot(n,vec3(0,1,0))*.5+.5)*.35;
    vec3 diffuse=(1.8+hemi)/PI+vec3(1./PI*max(dot(n,key),0.)*1.85+area.x);
    float specular=felipeSpecular(n,view,key,roughness)*1.85+area.y;
    return vec4(diffuse,specular);
}
vec4 furBodyLighting(vec3 n,vec3 view) {
    float area=max(dot(furArea0.xyz,n)+furArea0.w,0.)+
        max(dot(furArea1.xyz,n)+furArea1.w,0.)+max(dot(furArea2.xyz,n)+furArea2.w,0.);
    vec3 key=normalize(vec3(-5,7,6));
    vec3 hemi=mix(vec3(.6867,.7682,.8714),vec3(1),n.y*.5+.5)*.35;
    vec3 diffuse=(1.8+hemi)/PI+vec3(1./PI*max(dot(n,key),0.)*1.85+area);
    return vec4(diffuse,furLight.w);
}
vec4 felipeMaterial(int material) {


    vec3 n=normalize(worldNormal),view=normalize(f.cameraPosition.xyz-worldPosition*f.cameraPosition.w);
    vec3 albedo=avatarColorRoughness.xyz*pigment,emission=vec3(0);float alpha=avatarComputerCoverage.x;
    float roughness=avatarColorRoughness.w;
    // Smooth matte body: retain pigment, studio lighting and live occlusion
    // without fiber coverage, triplanar pile textures or derivative relief.
    if(material>0) roughness=1.;
    vec4 light=material==1 ? furBodyLighting(n,view) : felipeLighting(n,view,worldPosition,roughness);
    vec3 color=albedo*light.xyz+light.w;
    float occlusion=f.effects.y>0.?texture(ambientOcclusion,gl_FragCoord.xy*outputInverse).r:1.;
    color*=occlusion;
    color+=thinkingIllumination(worldPosition,n,albedo)+workingTouchLight(worldPosition,n,albedo);
    color=playgroundBody(color,worldPosition);
    return covered(felipeDisplay(color+emission),alpha);
}
// END GENERATED FELIPE

void main() {
#ifdef AUTHORED_COMPUTER
avatarComputerReference=texelFetch(instancePose,ivec2(7,avatarInstanceIndex),0);
avatarComputerCoverage=texelFetch(instancePose,ivec2(8,avatarInstanceIndex),0);
avatarComputerEye0=texelFetch(instancePose,ivec2(10,avatarInstanceIndex),0);
avatarComputerEye1=texelFetch(instancePose,ivec2(11,avatarInstanceIndex),0);
avatarComputerParameters=texelFetch(instancePose,ivec2(3,avatarInstanceIndex),0);
avatarComputerCamera=texelFetch(instancePose,ivec2(9,avatarInstanceIndex),0);
avatarComputerNormal=mat4(texelFetch(instancePose,ivec2(0,avatarInstanceIndex),0),texelFetch(instancePose,ivec2(1,avatarInstanceIndex),0),texelFetch(instancePose,ivec2(2,avatarInstanceIndex),0),vec4(0,0,0,1));
avatarComputerWorld=mat4(texelFetch(instancePose,ivec2(12,avatarInstanceIndex),0),texelFetch(instancePose,ivec2(13,avatarInstanceIndex),0),texelFetch(instancePose,ivec2(14,avatarInstanceIndex),0),texelFetch(instancePose,ivec2(15,avatarInstanceIndex),0));
#endif
#ifdef FELIPE_MATERIAL
    outputColor=felipeMaterial(FELIPE_KIND);
    return;
#endif
    if(d.fur.x>0. || d.fur.w<0.) { outputColor=felipeMaterial(d.fur.x>0.?1:0); return; }
    if (avatarComputerReference.w == -34.0) {
        CircleSurface circle = circleShapeCoverage(responseGains, avatarComputerEye0, d.emissiveMetallic);
        if (circle.coverage.y <= 0.0 || d.paletteBounds.x <= 0.0) {
            outputColor = covered(encodeSRGB(avatarColorRoughness.xyz), avatarComputerCoverage.x * circle.coverage.x);
            return;
        }
        circle.edge.y = -circle.edge.y; // GLES derivatives use bottom-up framebuffer coordinates.
        outputColor = circleShapeFragment(circle.coverage, avatarColorRoughness.xyz, avatarComputerCoverage.x,
            circleHighlight(circle.edge, d.paletteBounds));
        return;
    }

    vec3 n = normalize(worldNormal), v = normalize(f.cameraPosition.xyz-worldPosition*f.cameraPosition.w);
    if (f.studioParameters.z == 1.) { outputColor = vec4(n*.5+.5,1.); return; }
    if (f.studioParameters.z == 2.) { outputColor = vec4(worldPosition*.25+.5,1.); return; }
    if (f.studioParameters.z == 3.) { outputColor=covered(encodeSRGB(avatarColorRoughness.xyz),avatarComputerCoverage.x); return; }
    if (avatarComputerReference.w == -41. || avatarComputerReference.w == -42.) {
        outputColor=paymentLight(responseGains,avatarComputerReference,avatarComputerCoverage.x);return;
    }
    if (avatarComputerReference.w == -36.) {
        vec2 q=(responseGains-.5)*2.;
        float r2=dot(q,q);
        float glow=(.7*exp(-3.2*r2)+.3*exp(-9.*r2))*(1.-smoothstep(.72,1.,length(q)));
        outputColor=covered(vec3(1.,.70,.30),avatarComputerCoverage.x*glow);return;
    }
    if (avatarComputerReference.w == -37.) {
        // A curved reflection describes the clear shell around a small warm core.
        float facing=clamp(dot(n,v),0.,1.);
        float fresnel=.04+.96*pow(1.-facing,5.);
        float radius=max(length(avatarComputerWorld[0].xyz),.0001);
        vec3 offset=(worldPosition-avatarComputerWorld[3].xyz)/radius;
        vec3 ray=refract(-v,n,1./1.46);
        float travel=max(-dot(offset,ray),0.);
        vec3 closest=offset+ray*travel;
        float distance2=dot(closest,closest);
        float glow=clamp(avatarComputerReference.x,0.,1.);
        float core=exp(-20.*distance2);
        float aura=exp(-4.5*distance2);
        float lightAlpha=glow*(.70*core+.26*aura+.03*exp(-1.6*distance2));
        vec3 reflected=reflect(-v,n);
        vec2 panel=vec2((reflected.x+.68)/.17,(reflected.y-.45)/.75);
        float panelY2=panel.y*panel.y;
        float reflection=exp(-panel.x*panel.x-panelY2*panelY2)*smoothstep(.05,.4,reflected.z);
        float height=dot(offset,normalize(avatarComputerWorld[1].xyz));
        float neck=(1.-smoothstep(-.90,-.50,height))*(.2+.8*pow(1.-facing,1.5));
        float glassAlpha=clamp(.12+.62*fresnel+.42*reflection+.18*neck,0.,.88);
        vec3 glassTint=mix(vec3(1.,.66,.22),vec3(1.,.98,.88),clamp(.25*fresnel+reflection,0.,1.));
        vec3 amber=mix(vec3(1.,.32,.035),vec3(1.,.67,.20),sqrt(glow));
        vec3 lightTint=mix(amber,vec3(1.,.985,.83),pow(core,.45)*glow);
        float alpha=glassAlpha+lightAlpha*(1.-glassAlpha);
        vec3 premultiplied=glassTint*glassAlpha+lightTint*lightAlpha*(1.-glassAlpha);
        outputColor=vec4(premultiplied,alpha)*avatarComputerCoverage.x;return;
    }
    if (avatarComputerReference.w == -43.0 && responseGains.x > avatarComputerReference.x) discard;
    if (avatarComputerReference.w == -35.0) {outputColor=covered(encodeSRGB(avatarColorRoughness.xyz),avatarComputerCoverage.x);return;}
    if (avatarComputerReference.w == -26.0 || avatarComputerReference.w == -27.0 || avatarComputerReference.w == -30.0) { outputColor=playgroundEffect(responseGains,avatarComputerReference,avatarComputerCoverage);return; }
    if (avatarComputerReference.w == -16.) {
        vec2 p=(responseGains-.5)*2.;
        float radius=dot(p,p);
        float shadow=(.78*exp(-3.1*radius)+.22*exp(-8.4*radius))
            *(1.-smoothstep(.74,1.,length(p)));
        outputColor=covered(vec3(.44,.455,.48),avatarComputerCoverage.x*shadow);
        return;
    }
    if (avatarComputerReference.w == -4.) {
        vec2 uv = responseGains;
        vec2 q = abs(uv)-vec2(.715,.290);
        float contour = length(max(q,vec2(0.)))+min(max(q.x,q.y),0.)-.110;
        float edge = 1.-smoothstep(.003,.020,abs(contour));
        float bevel = 1.-abs(dot(n,normalize(avatarComputerNormal[2].xyz)));
        float fresnel = .04+.96*pow(1.-clamp(abs(dot(n,v)),0.,1.),5.);
        float reflection = pow(max(dot(reflect(-v,n),normalize(f.keyDirectionIntensity.xyz)),0.),64.);
        reflection += .30*pow(max(dot(reflect(-v,n),normalize(f.fillDirectionIntensity.xyz)),0.),24.);
        float presence = avatarComputerReference.z, power = avatarComputerReference.y;
        float band = uv.x+.24*uv.y-(-1.12+2.24*presence);
        float arrival = exp(-band*band/.012)*4.*presence*(1.-presence);
        // The reflection coordinate is signed. GLSL pow is undefined below zero.
        float softboxDistance = (uv.x+.24*uv.y+.47+.25*n.x)/.18;
        float softbox = exp(-softboxDistance*softboxDistance);
        float farewell = max(presence-power,0.)*edge;
        float highlight = .55*reflection+.20*fresnel+.22*edge+.045*softbox+
            arrival*(.09+.30*edge)+.18*farewell;
        float touch = 0.;
        for(int i=0;i<2;++i) {
            vec4 stamp = i==0 ? avatarComputerEye0 : avatarComputerEye1;
            vec2 distance = (uv-stamp.xy)/max(stamp.w,.001);
            float r2 = dot(distance,distance);
            touch += stamp.z*(.88*exp(-3.*r2)+.18*exp(-.6*r2));
        }
        vec3 tint = encodeSRGB(avatarColorRoughness.xyz)*(1.-.24*bevel);
        vec3 glass = mix(tint,vec3(1.),clamp(highlight,0.,.82));
        float opacity = avatarComputerReference.x*(.18+.82*power)+.28*bevel+.09*edge+
            .12*highlight;
        // A contact is light on the surface, not part of the pane's tint.
        // Composite it independently so clear glass cannot dilute the glint.
        float light = clamp(touch,0.,.94)*avatarComputerCoverage.x;
        outputColor = covered(vec3(.94,.98,1.),light)+
            covered(glass,clamp(opacity,0.,.82)*avatarComputerCoverage.x)*(1.-light);return;
    }
    if (avatarComputerReference.w == -24.) {
        vec2 size = surfaceGeometry.zw;
        float radius = .5*min(size.x,size.y);
        vec2 q = abs(surfaceGeometry.xy)*size*.5-(size*.5-radius);
        float distance = length(max(q,vec2(0.)))+min(max(q.x,q.y),0.)-radius;
        float aa = max(fwidth(distance),.0003);
        float shape = 1.-smoothstep(-aa,aa,distance);
        float power = smoothstep(.05,.95,avatarComputerReference.x);
        float reveal = avatarComputerReference.z>.5 ? 1. : smoothstep(responseGains.x,responseGains.x+.020,avatarComputerReference.y);
        outputColor = covered(encodeSRGB(avatarColorRoughness.xyz),avatarComputerCoverage.x*power*shape*reveal);return;
    }
    vec3 key = normalize(f.keyDirectionIntensity.xyz), fill = normalize(f.fillDirectionIntensity.xyz);
    float roughness = clamp(avatarColorRoughness.w,.045,1.0), reflectance = avatarComputerParameters.x;
    vec3 albedo = avatarColorRoughness.xyz;
    // AUTHORED_COMPUTER_HAND_PIGMENT_V1
    if (avatarComputerReference.w == -40.0) albedo *= pigment;
    if(avatarComputerReference.w == -44.0)
        albedo=mix(creatingPigment(avatarComputerReference.z),vec3(.09,.042,.018),smoothstep(.10,.65,responseGains.x));
    if(avatarComputerReference.w == -45.0) {
        float front=smoothstep(.88,.99,dot(n,normalize(avatarComputerNormal[2].xyz)));
        albedo*=1.-front*creatingCanvasShadow(responseGains,avatarComputerReference.x);
    }
    if(avatarComputerReference.w == -43.0) {
        albedo=creatingPigment(responseGains.x);
        float distance=(responseGains.x-avatarComputerReference.z)/.13;
        float wet=avatarComputerReference.y*exp(-distance*distance);
        roughness=mix(roughness,.18,wet);

    }
    float materialCoverage = avatarComputerCoverage.x;
    float metallic = clamp(d.emissiveMetallic.w,0.0,1.0);
    if (avatarComputerReference.w == -46.0) {
        vec3 axis=normalize(avatarComputerNormal[2].xyz);
        float face=smoothstep(.90,.99,abs(dot(n,axis)));
        float inlay=smoothstep(.5,.9,surfaceGeometry.x);
        vec2 p=responseGains;
        vec2 q=abs(p)-vec2(.39,.22);
        float edge=length(max(q,vec2(0.)))+min(max(q.x,q.y),0.)-.07;
        float aa=max(fwidth(edge),.0003);
        float border=(1.-smoothstep(.0012-aa,.0012+aa,abs(edge+.024)))*face;
        // Fine brushing resolves only when there are enough pixels to show it.
        float grainPhase=p.y*640.;
        float grain=sin(grainPhase)*(1.-smoothstep(.8,2.5,fwidth(grainPhase)));
        albedo=mix(vec3(.008,.011,.016),vec3(.32,.35,.40),1.-face);
        albedo*=1.+.025*grain*face;
        albedo=mix(albedo,vec3(.26,.285,.32),border*.70);
        albedo=mix(albedo,vec3(.62,.65,.70),inlay);
        roughness=mix(.18,.30,face);
        roughness=mix(roughness,.21,inlay);metallic=.90;
    }
    if (avatarComputerReference.w == -47.0) {
        float face=smoothstep(.90,.99,dot(n,normalize(avatarComputerNormal[2].xyz)));
        vec2 p=responseGains;
        float groove=min(abs(abs(p.x)-.025),abs(abs(p.y)-.019));
        float aa=max(fwidth(groove),.0003);
        float cut=(1.-smoothstep(.0013-aa,.0013+aa,groove))*face;
        albedo=mix(vec3(.62,.48,.26),vec3(.08,.065,.04),cut);
        roughness=mix(.23,.40,cut);metallic=.90;
        n=normalize(n+face*1.4*(normalize(avatarComputerNormal[0].xyz)*p.x+
                                normalize(avatarComputerNormal[1].xyz)*p.y));
    }
    if (avatarComputerReference.w == -39.) {
        float front=smoothstep(.98,.999,dot(n,normalize(avatarComputerNormal[2].xyz)));
        vec4 material=replyCardMaterial(responseGains,front,avatarComputerReference.x,albedo);
        albedo=material.xyz;roughness=material.w;
    }
    if (avatarComputerReference.w == -38.) {
        float scale2=max(dot(avatarComputerWorld[1].xyz,avatarComputerWorld[1].xyz),.000001);
        float height=dot(worldPosition-avatarComputerWorld[3].xyz,avatarComputerWorld[1].xyz)/scale2;
        float insulator=smoothstep(-2.14,-2.115,height)*(1.-smoothstep(-2.055,-2.03,height));
        albedo=mix(albedo,vec3(.012,.015,.021),insulator);
        roughness=mix(roughness,.52,insulator);
        metallic=1.-insulator;
    }
    float shadow = f.effects.x > 0.0 ? shadowVisibility(shadowPosition,n,key) : 1.0;
    float occlusion = f.effects.y > 0. && (avatarComputerCoverage.w <= 0. || f.studioParameters.x <= 0.)
        ? texture(ambientOcclusion,gl_FragCoord.xy*outputInverse).r : 1.;
    if (f.studioParameters.x > 0.) {
        vec3 materialColor;
        if (avatarComputerReference.w == -46.0 || avatarComputerReference.w == -47.0) {
            float ambientVisibility=f.effects.y>0. ? contactOcclusion(gl_FragCoord.xy*outputInverse,worldPosition,n) : 1.;
            ambientVisibility=max(ambientVisibility,1.-f.characterStudio.w);
            materialColor=fixedAccessoryMetal(albedo,n,v,roughness,shadow,ambientVisibility);
            if (avatarComputerReference.w == -46.0) {
                vec3 reflected=reflect(-v,n);
                // Reflection of a finite softbox, fixed in the surrounding room.
                // Its broad edge travels with the card's pose, never with time.
                vec3 hit=worldPosition+reflected*2.2;
                float band=(hit.x+.4*hit.y-.55)/.28;
                float sheen=exp(-band*band)*smoothstep(.05,.55,reflected.z);
                float face=smoothstep(.90,.99,abs(dot(n,normalize(avatarComputerNormal[2].xyz))));
                float inlay=smoothstep(.5,.9,surfaceGeometry.x);
                // A narrow strip reflection crosses the flat silver face.
                // Its direction changes with the card, without bending normals.
                vec2 foilUV=responseGains-vec2(.145,0.);
                float foilBand=(foilUV.x+.55*foilUV.y+.12*dot(reflected,normalize(avatarComputerNormal[0].xyz)))/.055;
                float foil=exp(-foilBand*foilBand);
                materialColor*=mix(1.,.35+.30*foil,inlay);
                materialColor+=vec3(.016,.020,.026)*sheen*face*(1.-inlay);
            }
        } else if (avatarComputerCoverage.w > 0.) {
            float ambientVisibility = f.effects.y > 0. ? contactOcclusion(gl_FragCoord.xy*outputInverse,worldPosition,n) : 1.;
            ambientVisibility = max(ambientVisibility,1.-f.characterStudio.w);
            bool palette = avatarComputerReference.w == -23.0;
            bool authoredPalette = palette && paletteUsesAuthoredFinish(avatarComputerReference.x);
            bool continuedBody = authoredPalette && paletteUsesAuthoredBodyFinish(avatarComputerReference.x);
            // A fixed camera axis preserves the front in both projection modes.
            float authoredWeight = continuedBody
                ? paletteAuthoredBodyWeight(paletteCoverageNormal,n,normalize(f.cameraPosition.xyz),avatarComputerNormal[2].xyz) : 1.0;
            bool blendBody = continuedBody && authoredWeight < 1.0;
            float paletteAmbient = blendBody ? 1.0 : ambientVisibility;
            materialColor = authoredPalette
                ? paletteSurface(avatarComputerReference.x,albedo,paletteUV,surfaceGeometry,avatarComputerReference.yz,n,v,roughness,reflectance,shadow,paletteAmbient)
                : characterStudioMaterial(palette ? headphoneFinishAlbedo(avatarComputerReference.x,albedo,surfaceGeometry.yzw) : albedo,
                                          n,v,roughness,reflectance,metallic,shadow,ambientVisibility);
            if (avatarComputerReference.w == -38.)
                materialColor = mix(materialColor,fixedAccessoryMetal(albedo,n,v,roughness,
                    shadow,ambientVisibility),metallic);
            if (avatarComputerReference.w == -33.)
                materialColor = fixedAccessoryMetal(avatarComputerReference.xyz,n,v,roughness,
                                                    shadow,ambientVisibility);
            if (blendBody) {
                // Blend the shadowed linear values, then apply contact shading once.
                vec3 physical = characterStudioMaterial(albedo,n,v,roughness,reflectance,metallic,shadow,1.0);
                materialColor = mix(physical,materialColor,authoredWeight) * mix(.65,1.0,ambientVisibility);
            }
            if (authoredPalette && avatarPaletteClosure.w > 0.0) {
                vec3 closedMaterial = characterStudioMaterial(avatarPaletteClosure.rgb,n,v,
                    roughness,reflectance,metallic,shadow,ambientVisibility);
                materialColor = mix(materialColor,closedMaterial,avatarPaletteClosure.w);
            }
            if (continuedBody) {
                materialColor *= paletteFormLight(avatarComputerReference.x,n);
                materialColor = paletteBodyDetail(materialColor,n,v,key,roughness,reflectance,shadow,ambientVisibility);
            }
        } else {
            // Legacy props retain their authored view-space response. Character
            // materials above use the fixed stage lighting in every view.
            vec3 viewZ = normalize(f.cameraPosition.xyz);
            vec3 viewUp = abs(viewZ.y) > .999 ? vec3(0,0,1) : vec3(0,1,0);
            vec3 viewX = normalize(cross(viewUp,viewZ));
            vec3 viewY = cross(viewZ,viewX);
            vec3 viewNormal = vec3(dot(n,viewX),dot(n,viewY),dot(n,viewZ));
            vec3 integrated = studioResponse(viewNormal,roughness);
            if (avatarComputerReference.w == -1.0) {
                // Same padded-solid diffuse response as the Metal backend.
                integrated.x *= sqrt(max(integrated.x*0.5,0.0));
            }
            integrated.x *= responseGains.x;
            float f0 = .16*reflectance*reflectance;
            float reflection = (f0*integrated.y+(1.-f0)*integrated.z)*responseGains.y;
            materialColor = albedo*(1.-f0)*integrated.x+reflection;
            if (metallic > 0.) {
                vec3 metalF0 = mix(vec3(f0),albedo,metallic);
                // The shared table is calibrated for painted dielectrics. Keep
                // metallic highlights bounded, preserving the rim's color/shape.
                float metalLobe = 1.3*integrated.y/(1.3+integrated.y);
                vec3 metalReflection = mix(vec3(reflection),albedo*metalLobe,metallic);
                materialColor = albedo*(1.-metalF0)*(1.-metallic)*integrated.x+metalReflection;
            }
        }
        vec3 color = materialColor*f.studioParameters.y*(avatarComputerCoverage.w > 0. ? 1. : occlusion)+d.emissiveMetallic.xyz;


        // The delivered characters use Blender Standard / sRGB. Preserve that
        // single display transform rather than a second custom tone shoulder.
        color += thinkingIllumination(worldPosition,n,albedo);
        color += workingTouchLight(worldPosition,n,albedo);
        color = playgroundBody(color,worldPosition);
        vec3 displayLinear = avatarComputerCoverage.w > 0. ? clamp(color,0.,1.) : studioTone(color);
        outputColor = covered(encodeSRGB(displayLinear),materialCoverage);
        return;
    }
    if (avatarComputerReference.w == -33.) albedo = avatarComputerReference.xyz;
    float specularStrength = f.ambientExposure.w;
    vec3 color = directLight(n,v,key,albedo,roughness,reflectance,specularStrength,metallic)*f.keyDirectionIntensity.w*shadow;
    color += directLight(n,v,fill,albedo,roughness,reflectance,specularStrength,metallic)*f.fillDirectionIntensity.w;
    float f0 = .16*reflectance*reflectance;
    vec2 brdf = texture(environmentBRDF,vec2(max(dot(n,v),0.0),roughness)).rg;
    vec3 ambient = albedo*f.ambientExposure.z*(1.0-metallic);
    ambient += studio(reflect(-v,n),roughness*(2.0-roughness))*(mix(vec3(f0),albedo,metallic)*brdf.x+brdf.y)*specularStrength;
    color += ambient*f.ambientExposure.x*occlusion;
    color = color*f.ambientExposure.y+d.emissiveMetallic.xyz;


    color += thinkingIllumination(worldPosition,n,albedo);
    color += workingTouchLight(worldPosition,n,albedo);
    color=playgroundBody(color,worldPosition);
    outputColor = covered(encodeSRGB(neutralTone(color)),materialCoverage);
}
`,$l={purpose:`One fixed pose for material/camera regression. Not an animation controller.`,preset:`blue_beret`,frame:{viewProjection:[.5494505167007446,0,0,0,0,.5494505167007446,0,0,0,0,-.10050251334905624,0,0,0,-.6080402135848999,1],inverseViewProjection:[1.8200000524520874,0,0,0,0,1.8200000524520874,0,0,0,0,-9.949999809265137,0,0,0,-6.050000190734863,1],lightViewProjection:[.35728874802589417,.12126781046390533,.08570991456508636,0,0,.3435921370983124,-.11427989602088928,0,.21437321603298187,-.20211303234100342,-.142849862575531,0,4.967053612858763e-8,0,-.010100960731506348,1],cameraPosition:[0,0,4,0],keyDirectionIntensity:[-.6000000238418579,.800000011920929,1,74e3],fillDirectionIntensity:[.8500000238418579,.20000000298023224,.699999988079071,12e3],ambientExposure:[45e3,2604166729724966e-20,.6399999856948853,.699999988079071],viewport:[320,320,.0031250000465661287,.0031250000465661287],effects:[0,1,1.100000023841858,.2199999988079071],studioParameters:[1,1.0499999523162842,0,.18000000715255737],errorBodyBounds:[0,0,0,0],characterStudio:[.5,2,1,.6499999761581421],shadowParameters:[.3499999940395355,4.800000190734863,9.899999618530273,.6499999761581421],searchLensCenterRadius:[0,0,0,0],searchLensRight:[0,0,0,0],searchLensUp:[0,0,0,0],searchLensStyle:[0,0,0,0],searchLensOptics:[0,0,0,0],thinkingLightPositionStrength:[0,0,0,0],thinkingLightColorRadius:[0,0,0,0]},parts:[{world:[.6769375205039978,-.07887189835309982,-.755359411239624,0,.23283253610134125,.9310319423675537,.11144474148750305,0,.7188032865524292,-.26011762022972107,.6713371872901917,0,.006750068627297878,.000454270513728261,.012810113839805126,1],normalMatrix:[.6540250778198242,-.07620230317115784,-.7297925353050232,0,.24943193793296814,.9974080920219421,.11939000338315964,0,.6944738626480103,-.25131338834762573,.6486143469810486,0,0,0,0,1],colorRoughness:[.12011300027370453,.26866400241851807,.7135189771652222,1],parameters:[.5,0,0,0],referencePose:[48,.7799999713897705,.23408909142017365,-23],emissiveMetallic:[0,0,0,0],coverage:[1,1,0,1],eyeCurveOriginAmount:[0,0,0,0],eyeCurveRightWidth:[0,0,0,0],eyeCurveUp:[0,0,0,0],paletteBounds:[-2.9802322387695312e-8,0,.500000536441803,.54648357629776],paletteClosure:[0,0,0,0],paletteReference:[0,0,0,0],fur:[.03293785825371742,1.8298810720443726,1.8181817531585693,.054999999701976776],furEye0:[-.2310408651828766,.24406471848487854,.09041033685207367,.11582860350608826],furEye1:[.1910574734210968,.24406471848487854,.09037365764379501,.11582860350608826],signatureDeform:[0,0,0,0]},{world:[.7633371353149414,0,-.6460002660751343,0,.11399049311876297,.9654775857925415,.13469526171684265,0,.6354740262031555,-.17978723347187042,.7508989572525024,0,.008605778217315674,-.016119465231895447,.022853732109069824,1],normalMatrix:[.763337254524231,-1.4901161193847656e-8,-.646000325679779,0,.11833533644676208,1.0022776126861572,.13982929289340973,0,.6354740262031555,-.17978721857070923,.7508990168571472,0,0,0,0,1],colorRoughness:[.00518151605501771,.006512091029435396,.006512091029435396,.550000011920929],parameters:[.5,0,0,0],referencePose:[0,0,0,0],emissiveMetallic:[0,0,0,0],coverage:[1,0,0,1],eyeCurveOriginAmount:[0,0,0,0],eyeCurveRightWidth:[0,0,0,0],eyeCurveUp:[0,0,0,0],paletteBounds:[0,0,0,0],paletteClosure:[0,0,0,0],paletteReference:[0,0,0,0],fur:[0,0,0,-1],furEye0:[0,0,0,0],furEye1:[0,0,0,0],signatureDeform:[0,0,0,0]},{world:[.7633371353149414,0,-.6460002660751343,0,.11399049311876297,.9654775857925415,.13469526171684265,0,.6354740262031555,-.17978723347187042,.7508989572525024,0,.008605778217315674,-.016119465231895447,.022853732109069824,1],normalMatrix:[.763337254524231,-1.4901161193847656e-8,-.646000325679779,0,.11833533644676208,1.0022776126861572,.13982929289340973,0,.6354740262031555,-.17978721857070923,.7508990168571472,0,0,0,0,1],colorRoughness:[.00518151605501771,.006512091029435396,.006512091029435396,.550000011920929],parameters:[.5,0,0,0],referencePose:[0,0,0,0],emissiveMetallic:[0,0,0,0],coverage:[1,0,0,1],eyeCurveOriginAmount:[0,0,0,0],eyeCurveRightWidth:[0,0,0,0],eyeCurveUp:[0,0,0,0],paletteBounds:[0,0,0,0],paletteClosure:[0,0,0,0],paletteReference:[0,0,0,0],fur:[0,0,0,-1],furEye0:[0,0,0,0],furEye1:[0,0,0,0],signatureDeform:[0,0,0,0]},{world:[.762068510055542,-.010384359396994114,-.6474130153656006,0,.1241941973567009,.9836506843566895,.13041122257709503,0,.6354740262031555,-.17978723347187042,.7508989572525024,0,.00016091018915176392,.0010123848915100098,.01852002739906311,1],normalMatrix:[.7620685696601868,-.010384351015090942,-.6474131345748901,0,.1241942048072815,.9836506843566895,.13041120767593384,0,.6354740858078003,-.17978723347187042,.7508990168571472,0,0,0,0,1],colorRoughness:[.026241200044751167,.027320899069309235,.028426000848412514,.5],parameters:[.5,0,0,0],referencePose:[0,0,0,0],emissiveMetallic:[0,0,0,0],coverage:[1,0,0,1],eyeCurveOriginAmount:[0,0,0,0],eyeCurveRightWidth:[0,0,0,0],eyeCurveUp:[0,0,0,0],paletteBounds:[0,0,0,0],paletteClosure:[0,0,0,0],paletteReference:[0,0,0,0],fur:[0,0,0,-1],furEye0:[0,0,0,0],furEye1:[0,0,0,0],signatureDeform:[0,0,0,0]},{world:[.762068510055542,-.010384359396994114,-.6474130153656006,0,.1241941973567009,.9836506843566895,.13041122257709503,0,.6354740262031555,-.17978723347187042,.7508989572525024,0,.00016091018915176392,.0010123848915100098,.01852002739906311,1],normalMatrix:[.7620685696601868,-.010384351015090942,-.6474131345748901,0,.1241942048072815,.9836506843566895,.13041120767593384,0,.6354740858078003,-.17978723347187042,.7508990168571472,0,0,0,0,1],colorRoughness:[.026241200044751167,.027320899069309235,.028426000848412514,.5],parameters:[.5,0,0,0],referencePose:[0,0,0,0],emissiveMetallic:[0,0,0,0],coverage:[1,0,0,1],eyeCurveOriginAmount:[0,0,0,0],eyeCurveRightWidth:[0,0,0,0],eyeCurveUp:[0,0,0,0],paletteBounds:[0,0,0,0],paletteClosure:[0,0,0,0],paletteReference:[0,0,0,0],fur:[0,0,0,-1],furEye0:[0,0,0,0],furEye1:[0,0,0,0],signatureDeform:[0,0,0,0]},{world:[.762068510055542,-.010384359396994114,-.6474130153656006,0,.1241941973567009,.9836506843566895,.13041122257709503,0,.6354740262031555,-.17978723347187042,.7508989572525024,0,.00016091018915176392,.0010123848915100098,.01852002739906311,1],normalMatrix:[.7620685696601868,-.010384351015090942,-.6474131345748901,0,.1241942048072815,.9836506843566895,.13041120767593384,0,.6354740858078003,-.17978723347187042,.7508990168571472,0,0,0,0,1],colorRoughness:[.026241200044751167,.027320899069309235,.028426000848412514,.5],parameters:[.5,0,0,0],referencePose:[0,0,0,0],emissiveMetallic:[0,0,0,0],coverage:[1,0,0,1],eyeCurveOriginAmount:[0,0,0,0],eyeCurveRightWidth:[0,0,0,0],eyeCurveUp:[0,0,0,0],paletteBounds:[0,0,0,0],paletteClosure:[0,0,0,0],paletteReference:[0,0,0,0],fur:[0,0,0,-1],furEye0:[0,0,0,0],furEye1:[0,0,0,0],signatureDeform:[0,0,0,0]}],copy:{args:[44.71000000000001,29.710000000000008,230.57999999999996,230.57999999999996,0,0,320,320],sourceWidth:512,sourceHeight:320,sourceType:`HTMLCanvasElement`,destinationWidth:320,destinationHeight:320,destinationCss:{x:0,y:0,width:320,height:320,top:0,right:320,bottom:320,left:0},transform:[1,0,0,1,0,0],globalAlpha:1,imageSmoothingEnabled:!0,imageSmoothingQuality:`low`},sourceTextures:[{name:`furPile`,id:4,width:512,height:512,format:6408,type:5121,components:4,parameters:{10240:9729,10241:9987,10242:10497,10243:10497},file:`furPile.bin`,sha256:`f06727e864bf6d3f422aa01ad7aec27775801452260cd9e79ce39ab4bfe8ffa3`,sourceFile:`texture-4.bin`},{name:`furCards`,id:5,width:512,height:512,format:6408,type:5121,components:4,parameters:{10240:9729,10241:9987,10242:33071,10243:33071},file:`furCards.bin`,sha256:`49d575ae2830f78b29c449131e33dd7929dfaa68246cfd6cc7c4868a179e1004`,sourceFile:`texture-5.bin`},{name:`furLTC1`,id:6,width:64,height:64,format:6408,type:5126,components:4,parameters:{10240:9729,10241:9729,10242:33071,10243:33071},file:`furLTC1.bin`,sha256:`cf5cf21e5c112d2095c7e2418cb0a1ac54636e275d73e42f3453646c67f26814`,sourceFile:`texture-6.bin`},{name:`furLTC2`,id:7,width:64,height:64,format:6408,type:5126,components:4,parameters:{10240:9729,10241:9729,10242:33071,10243:33071},file:`furLTC2.bin`,sha256:`3b1b09080b26104498db277c14fc1733786465c6958e7a8403d688b1e24c2ff5`,sourceFile:`texture-7.bin`}]},eu=new URL(`../assets/computer-geometry-uSZzT583.bin`,import.meta.url).href,tu=new URL(`../assets/computer-geometry-DTkXbiN0.json`,import.meta.url).href,nu=new URL(`../assets/computer-material-vpK-WaF1.json`,import.meta.url).href,ru=new URL(`../assets/geometry-low-ByQxB_nR.bin`,import.meta.url).href,iu=new URL(`../assets/geometry-low-4Cm496Mv.json`,import.meta.url).href,au=new URL(`../assets/geometry-DMvQoOl2.bin`,import.meta.url).href,ou=new URL(`../assets/geometry-CthS61Br.json`,import.meta.url).href,su=new URL(`../assets/material-C7e3KRNm.json`,import.meta.url).href,cu=new URL(`../assets/reference-wYoveiOB.png`,import.meta.url).href,lu=new URL(`../assets/computer-geometry-so24EYz6.bin`,import.meta.url).href,uu=new URL(`../assets/computer-geometry-DXJcZaai.json`,import.meta.url).href,du=new URL(`../assets/computer-material-pj7H1QLb.json`,import.meta.url).href,fu=new URL(`../assets/geometry-CO6mKd2l.bin`,import.meta.url).href,pu=new URL(`../assets/geometry-low-DsSP3M4G.json`,import.meta.url).href,mu=new URL(`../assets/geometry-C8mRYEXR.bin`,import.meta.url).href,hu=new URL(`../assets/geometry-Dautc2sf.json`,import.meta.url).href,gu=new URL(`../assets/material-DQ0XgHgy.json`,import.meta.url).href,_u=new URL(`../assets/reference-H6kqI7bP.png`,import.meta.url).href,vu=new URL(`../assets/computer-geometry-4OFr3sao.bin`,import.meta.url).href,yu=new URL(`../assets/computer-geometry-DrqBa5Gt.json`,import.meta.url).href,bu=new URL(`../assets/computer-material-Cc1ufmGt.json`,import.meta.url).href,xu=new URL(`../assets/geometry-low-CODxblW3.bin`,import.meta.url).href,Su=new URL(`../assets/geometry-low-D4gzDxog.json`,import.meta.url).href,Cu=new URL(`../assets/geometry-64QCAMWN.bin`,import.meta.url).href,wu=new URL(`../assets/geometry-CE1rmuE-.json`,import.meta.url).href,Tu=new URL(`../assets/material-W-xnTbkZ.json`,import.meta.url).href,Eu=new URL(`../assets/reference-C2goyefQ.png`,import.meta.url).href,Du=new URL(`../assets/computer-geometry-kl6LRhFu.bin`,import.meta.url).href,Ou=new URL(`../assets/computer-geometry-BGsaO-dU.json`,import.meta.url).href,ku=new URL(`../assets/computer-material-DOzauS52.json`,import.meta.url).href,Au=new URL(`../assets/geometry-low-B-M19jbq.bin`,import.meta.url).href,ju=new URL(`../assets/geometry-low-BDKL02N6.json`,import.meta.url).href,Mu=new URL(`../assets/geometry-Cnxf5sdK.bin`,import.meta.url).href,Nu=new URL(`../assets/geometry-ChGJdLSG.json`,import.meta.url).href,Pu=new URL(`../assets/material-PIpe_RG2.json`,import.meta.url).href,Fu=new URL(`../assets/reference-DJNhIOY2.png`,import.meta.url).href,Iu=new URL(`../assets/computer-geometry-2FhSUBsP.bin`,import.meta.url).href,Lu=new URL(`../assets/computer-geometry-NxqT9z8T.json`,import.meta.url).href,Ru=new URL(`../assets/computer-material-BXySuXUY.json`,import.meta.url).href,zu=new URL(`../assets/geometry-low-CCo87iVh.bin`,import.meta.url).href,Bu=new URL(`../assets/geometry-low-B_gimyGe.json`,import.meta.url).href,Vu=new URL(`../assets/geometry-D35uNHRF.bin`,import.meta.url).href,Hu=new URL(`../assets/geometry-CsAgQd-s.json`,import.meta.url).href,Uu=new URL(`../assets/material-BbQYpXx7.json`,import.meta.url).href,Wu=new URL(`../assets/reference-DKlI2XTs.png`,import.meta.url).href,Gu=new URL(`../assets/computer-geometry-8sFp0fYB.bin`,import.meta.url).href,Ku=new URL(`../assets/computer-geometry-Cn1QZ2Gg.json`,import.meta.url).href,qu=new URL(`../assets/computer-material-BH5KK6aw.json`,import.meta.url).href,Ju=new URL(`../assets/geometry-Djz7eF4I.bin`,import.meta.url).href,Yu=new URL(`../assets/geometry-low-CNGUYtPJ.json`,import.meta.url).href,Xu=new URL(`../assets/geometry-V5mpIThN.bin`,import.meta.url).href,Zu=new URL(`../assets/geometry-BK1IibrK.json`,import.meta.url).href,Qu=new URL(`../assets/material-FPcmb08I.json`,import.meta.url).href,$u=new URL(`../assets/reference-Oomytcuv.png`,import.meta.url).href,ed=new URL(`../assets/computer-geometry-AndqqGl8.bin`,import.meta.url).href,td=new URL(`../assets/computer-geometry-BzmKhFZA.json`,import.meta.url).href,nd=new URL(`../assets/computer-material-V2yltqDB.json`,import.meta.url).href,rd=new URL(`../assets/geometry-low-C-E9AND7.bin`,import.meta.url).href,id=new URL(`../assets/geometry-low-D2RtLGsB.json`,import.meta.url).href,ad=new URL(`../assets/geometry-C0W7RsZa.bin`,import.meta.url).href,od=new URL(`../assets/geometry-C9oThjW5.json`,import.meta.url).href,sd=new URL(`../assets/material-CRAJ5ZBf.json`,import.meta.url).href,cd=new URL(`../assets/reference-WQ0QYPrL.png`,import.meta.url).href,ld=new URL(`../assets/computer-geometry-E8p2QDhI.bin`,import.meta.url).href,ud=new URL(`../assets/computer-geometry-CjuEECj6.json`,import.meta.url).href,dd=new URL(`../assets/computer-material-Cn75v0Yz.json`,import.meta.url).href,fd=new URL(`../assets/geometry-low-DACTAeB2.bin`,import.meta.url).href,pd=new URL(`../assets/geometry-low-BViYexDG.json`,import.meta.url).href,md=new URL(`../assets/geometry-CXJKj_gB.bin`,import.meta.url).href,hd=new URL(`../assets/geometry-nJ7Yrw_9.json`,import.meta.url).href,gd=new URL(`../assets/material-IOJV4bM_.json`,import.meta.url).href,_d=new URL(`../assets/reference-BX4Nw3ys.png`,import.meta.url).href;function vd(e,t){let n=t.map(t=>t.componentType===`uint16`?new Uint16Array(e,t.byteOffset,t.count):new Uint32Array(e,t.byteOffset,t.count)),r=0,i=!1;for(let e of n)if(r+=e.length,!i){for(let t=e.length-1;t>=0;t--)if(e[t]>=65535){i=!0;break}}let a=i?Uint32Array:Uint16Array;if(n.length===1&&n[0]instanceof a)return n[0];let o=new a(r),s=0;for(let e of n)o.set(e,s),s+=e.length;return o}var yd=[`blue_beret`,`alfred`,`purple_heart`,`lime_frog`,`coral_monocle`,`gus`,`blue_spectacles`,`lime_headphones`],bd=Object.assign({"./assets/alfred/computer-geometry.bin":eu,"./assets/alfred/computer-geometry.json":tu,"./assets/alfred/computer-material.json":nu,"./assets/alfred/geometry-low.bin":ru,"./assets/alfred/geometry-low.json":iu,"./assets/alfred/geometry.bin":au,"./assets/alfred/geometry.json":ou,"./assets/alfred/material.json":su,"./assets/alfred/reference.png":cu,"./assets/blue_beret/computer-geometry.bin":lu,"./assets/blue_beret/computer-geometry.json":uu,"./assets/blue_beret/computer-material.json":du,"./assets/blue_beret/geometry-low.bin":fu,"./assets/blue_beret/geometry-low.json":pu,"./assets/blue_beret/geometry.bin":mu,"./assets/blue_beret/geometry.json":hu,"./assets/blue_beret/material.json":gu,"./assets/blue_beret/reference.png":_u,"./assets/blue_spectacles/computer-geometry.bin":vu,"./assets/blue_spectacles/computer-geometry.json":yu,"./assets/blue_spectacles/computer-material.json":bu,"./assets/blue_spectacles/geometry-low.bin":xu,"./assets/blue_spectacles/geometry-low.json":Su,"./assets/blue_spectacles/geometry.bin":Cu,"./assets/blue_spectacles/geometry.json":wu,"./assets/blue_spectacles/material.json":Tu,"./assets/blue_spectacles/reference.png":Eu,"./assets/coral_monocle/computer-geometry.bin":Du,"./assets/coral_monocle/computer-geometry.json":Ou,"./assets/coral_monocle/computer-material.json":ku,"./assets/coral_monocle/geometry-low.bin":Au,"./assets/coral_monocle/geometry-low.json":ju,"./assets/coral_monocle/geometry.bin":Mu,"./assets/coral_monocle/geometry.json":Nu,"./assets/coral_monocle/material.json":Pu,"./assets/coral_monocle/reference.png":Fu,"./assets/gus/computer-geometry.bin":Iu,"./assets/gus/computer-geometry.json":Lu,"./assets/gus/computer-material.json":Ru,"./assets/gus/geometry-low.bin":zu,"./assets/gus/geometry-low.json":Bu,"./assets/gus/geometry.bin":Vu,"./assets/gus/geometry.json":Hu,"./assets/gus/material.json":Uu,"./assets/gus/reference.png":Wu,"./assets/lime_frog/computer-geometry.bin":Gu,"./assets/lime_frog/computer-geometry.json":Ku,"./assets/lime_frog/computer-material.json":qu,"./assets/lime_frog/geometry-low.bin":Ju,"./assets/lime_frog/geometry-low.json":Yu,"./assets/lime_frog/geometry.bin":Xu,"./assets/lime_frog/geometry.json":Zu,"./assets/lime_frog/material.json":Qu,"./assets/lime_frog/reference.png":$u,"./assets/lime_headphones/computer-geometry.bin":ed,"./assets/lime_headphones/computer-geometry.json":td,"./assets/lime_headphones/computer-material.json":nd,"./assets/lime_headphones/geometry-low.bin":rd,"./assets/lime_headphones/geometry-low.json":id,"./assets/lime_headphones/geometry.bin":ad,"./assets/lime_headphones/geometry.json":od,"./assets/lime_headphones/material.json":sd,"./assets/lime_headphones/reference.png":cd,"./assets/purple_heart/computer-geometry.bin":ld,"./assets/purple_heart/computer-geometry.json":ud,"./assets/purple_heart/computer-material.json":dd,"./assets/purple_heart/geometry-low.bin":fd,"./assets/purple_heart/geometry-low.json":pd,"./assets/purple_heart/geometry.bin":md,"./assets/purple_heart/geometry.json":hd,"./assets/purple_heart/material.json":gd,"./assets/purple_heart/reference.png":_d});function xd(e,t){let n=bd[`./assets/${e}/${t}`];if(!n)throw Error(`Missing avatar asset: ${e}/${t}`);return n}async function Sd(e){let t=await fetch(e);if(!t.ok)throw Error(`Avatar resource failed (${t.status}): ${e}`);return t}async function Cd(e,t=`high`,n=!1){let r=await wd(e,t);if(n){let t=new Set(r.material.parts.map(e=>e.id)),n=await wd(e,`computer`,t);for(let e of r.parts){let t=n.material.parts.find(t=>t.id===e.id);e.renderOrder=e.fur?t.furRenderOrder:t.renderOrder}r.parts.push(...n.parts),r.material.parts.push(...n.material.parts.filter(e=>!t.has(e.id)))}return r}async function wd(e,t,n){let r=t===`low`?`geometry-low`:`geometry`,i=t===`computer`?`computer-`:``,[a,o,s]=await Promise.all([Sd(xd(e,`${i}${r}.json`)).then(e=>e.json()),Sd(xd(e,`${i}material.json`)).then(e=>e.json()),Sd(xd(e,`${i}${r}.bin`)).then(e=>e.arrayBuffer())]);return Td(e,a,o,s,t===`computer`,n)}function Td(e,t,n,r,i=!1,a){if(t.buffer.byteLength!==r.byteLength||n.parts.length!==t.parts.length)throw Error(`Inconsistent avatar resources: ${e}`);let o=[];for(let e of t.parts){if(a?.has(e.id))continue;let t=n.parts[e.id],s=new ca,c=new Dr(new Float32Array(r,e.vertices.byteOffset,e.vertices.byteLength/4),24),l={positionDelta0:`delta0`,normalTarget0:`normal0`,positionDelta1:`delta1`,normalTarget1:`normal1`};for(let[t,n]of Object.entries(e.vertices.attributes))s.setAttribute(l[t]??t,new kr(c,n.components,n.byteOffset/4));let u=new fr(new Uint16Array(e.vertices.count*4),4);u.gpuType=h,s.setAttribute(`skinJoints`,u),s.setAttribute(`skinWeights`,new mr(new Float32Array(e.vertices.count*4),4)),s.setIndex(new dr(vd(r,e.indices),1)),o.push({geometry:s,id:e.id,kind:t.materialKind,fur:!1,fields:t.fields,label:t.label,attachment:t.attachment,universal:t.universal,activity:i?`computer`:void 0,colorRole:e.id===0||t.attachment===`three_lobe`||i&&t.fields.referencePose?.[3]===-40?`body`:void 0,transparent:t.transparent,depthWrite:t.depthWrite,depthTest:t.depthTest,doubleSided:t.doubleSided,renderOrder:t.renderOrder})}return{preset:e,material:n,parts:o}}var Ed=new URL(`../assets/furLTC1-B2s2_r7O.bin`,import.meta.url).href,Dd=new URL(`../assets/furLTC2-DzS6pv45.bin`,import.meta.url).href,Od=Xl.presets,kd=Float32Array.from({length:384},(e,t)=>+(t%16%5==0));function Ad(e){return Object.fromEntries(Object.entries(e).map(([e,t])=>[e,t.length===16?new Y().fromArray(t):new Gt().fromArray(t)]))}async function jd(e){let t=await fetch(e);if(!t.ok)throw Error(`Avatar resource failed (${t.status}): ${e}`);return t.arrayBuffer()}var Md=class{constructor(e,t={}){if(this.canvas=e,this.scene=new Mn,this.camera=new sa(-1.82,1.82,1.82,-1.82,.1,20),this.batches=[],this.assets=new Map,this.pendingAssets=new Map,this.retiredAssets=[],this.assetClaims=new Map,this.sizeRevision=0,this.fits=new ni(new Float32Array(800),200,1,E,_),this.cameras=new ni(new Float32Array(800),200,1,E,_),this.materials=[],this.textures=[],this.geometries=[],this.depthMaterials=[],this.depthTarget=new qt(1,1,{depthBuffer:!0,depthTexture:new _i(1,1,g)}),this.disabledShadow=new _i(1,1,g),this.colorTarget=new qt(1,1,{depthBuffer:!0,samples:4,resolveDepthBuffer:!1,storeMultisampledDepthBuffer:!1}),this.renderBounds=new Gt,this.presentScene=new Mn,this.presentGeometry=new xi(2,2),this.presentMaterial=new ji({glslVersion:We,vertexShader:`precision highp float; in vec3 position; out vec2 uv; void main(){uv=position.xy*.5+.5;gl_Position=vec4(position,1);}`,fragmentShader:`precision highp float;
      in vec2 uv; out vec4 color;
      uniform sampler2D image; uniform vec2 surface;
      uniform vec4 grid; uniform highp sampler2D fits;
      void main(){
        vec2 pixel=vec2(uv.x,1.-uv.y)*surface;
        vec2 cell=floor((pixel-surface*.5)/grid.x+grid.yz*.5);
        if(any(lessThan(cell,vec2(0)))||any(greaterThanEqual(cell,grid.yz))||cell.y*grid.y+cell.x>=grid.w){color=vec4(0);return;}
        vec4 fit=texelFetch(fits,ivec2(int(cell.y*grid.y+cell.x),0),0);
        vec2 origin=surface*.5+(cell-grid.yz*.5)*grid.x;
        vec2 local=(pixel-origin)/grid.x;
        vec2 sourceLocal=fit.xy+local*fit.zw;
        if(any(lessThan(sourceLocal,vec2(0)))||any(greaterThanEqual(sourceLocal,vec2(1)))){color=vec4(0);return;}
        vec2 halfPixel=surface/vec2(textureSize(image,0))*.5;
        vec2 samplePixel=origin+clamp(sourceLocal*grid.x,halfPixel,vec2(grid.x)-halfPixel);
        vec2 coordinate=samplePixel/surface;
        color=texture(image,vec2(coordinate.x,1.-coordinate.y));
      }`,uniforms:{image:{value:this.colorTarget.texture},surface:{value:new G},grid:{value:new Gt},fits:{value:this.fits}},depthTest:!1,depthWrite:!1,premultipliedAlpha:!0}),this.raf=0,this.urgentFrame=!0,this.presentationCapacity=!0,this.presentationQueued=!1,this.maxFrameRate=60,this.disposed=!1,this.count=1,this.frames=0,this.fitPasses=0,this.elapsed=0,this.timedFrames=0,this.ready=!1,this.width=320,this.height=320,this.cols=1,this.rows=1,this.paused=!0,this.time=0,this.reactionComposer=new Wl,this.reactionEyes=new Yl,this.previousTime=0,this.attributesDirty=!0,this.cropCache=new Map,this.fitsDirty=!0,this.fitGeneration=0,this.fitReads=[],this.renderFailure=null,this.fitPending=!0,this.backingPixels=320,this.poseObject=new Cn,this.pointerIndex=null,this.hoverIndex=null,this.pointerPivot=new K,this.rotatedPivot=new K,this.pointerBasis=new Y().makeRotationY(8*Math.PI/180),this.pointerInverse=this.pointerBasis.clone().invert(),this.pointerMatrix=new Y,this.pointerPitch=new Y,this.eyeWorld=new Y,this.eyeNormal=new Y,this.projection=new Y,this.inverseProjection=new Y,this.partWorld=new Y,this.partNormal=new Y,this.states=[],this.poseSharing=new qc,this.inViewport=!0,this.contextLost=!1,this.visibilityChanged=()=>{this.previousTime=0,this.hidden()||!this.inViewport||this.contextLost?(this.cancelFitReads(),this.cancelFrame(),this.raf=0):this.invalidate()},this.onContextLost=()=>{this.cancelFitReads(),this.contextLost=!0,this.visibilityChanged()},this.onContextRestored=()=>{this.contextLost=!1,this.previousTime=0,this.resize()},this.tick=e=>{if(this.raf=0,!this.presentationCapacity){this.presentationQueued=!0;return}if(this.fitReads.length||this.renderFailure||this.disposed||!this.ready||this.hidden()||!this.inViewport||this.contextLost)return;if(this.states.every(e=>e.rendering===!1)){this.previousTime=0;return}if(!this.urgentFrame&&this.previousTime&&e-this.previousTime<1e3/this.maxFrameRate-1){this.invalidate(!1);return}this.urgentFrame=!1;let t=this.previousTime?(e-this.previousTime)/1e3:0;!this.paused&&this.previousTime&&(this.time+=t,this.elapsed+=t,this.timedFrames++),this.previousTime=e;let n=this.projection.multiplyMatrices(this.camera.projectionMatrix,this.camera.matrixWorldInverse);this.inverseProjection.copy(n).invert();let r=this.fitPending;if(this.poseSharing.beginFrame(),!r)for(let e of this.states){let t=e.motion;if(e.rendering===!1||e.poseOverride||t?.kind!==`idle`||t.pendingStart)continue;let n=this.asset(e.preset)?.samplers?.idle;if(!n)continue;let r=t.held??this.time-t.started;(e.poseSampler!==n||e.poseSampleTime!==r)&&this.poseSharing.register(n,r)}let i=this.poseObject,a=!1;for(let[t,n]of this.states.entries()){if(n.rendering===!1&&!r)continue;let o=this.asset(n.preset);if(i.position.set(0,this.paused||r||n.poseOverride||o?.samplers?0:Math.sin(this.time*1.8+n.phase)*.025,0),i.rotation.set(r?0:-n.look.y*.12,r?0:n.look.x*.18,this.paused||r||n.poseOverride||o?.samplers?0:Math.sin(this.time+n.phase)*.02),i.scale.setScalar(1),n.entrance&&!r){n.entrance.pendingStart&&(n.entrance.started=this.time,delete n.entrance.pendingStart);let e=Math.min(1,Math.max(0,n.entrance.held??this.time-n.entrance.started)),t=1-(1-e)**3;i.scale.setScalar(.1+.9*t),i.position.x-=.26*Math.sin(Math.PI*e)*(1-e),i.position.y-=.55*(1-t),i.rotation.z-=.32*(1-t),e===1&&(n.entrance=void 0)}if(n.wander&&!r&&!this.paused&&n.motion?.held===void 0&&(!n.motion||n.motion.kind===`idle`)&&this.hoverIndex!==t&&this.pointerIndex!==t&&this.time>=n.wander.next){let e=n.phase+ ++n.wander.step*2.399963;this.queueGaze(t,.5+Math.sin(e)*.28,.5+Math.sin(e*1.73)*.2),n.wander.next=this.time+1.8+(1+Math.sin(e*.7))*1.2}if(i.updateMatrix(),n.matrix.copy(i.matrix),!n.poseOverride&&o?.samplers&&!r&&(!this.paused||n.motion)){let e=o.samplers,t=n.motion;n.motion=Fl(n.motion,e,this.time),t?.pendingStart&&n.reactionGaze?.motion===t&&(n.reactionGaze.motion=n.motion);let r=n.motion,i=r?.kind===`work`&&r.continuous?e.workLoop:e[r?.kind??`idle`];n.pose&&n.poseSampler===i||(n.pose=i.createPose(),n.poseSampler=i,n.poseSampleTime=void 0);let a=r?.held??(r?this.time-r.started:this.time+n.phase);n.poseSampleTime!==a&&(this.poseSharing.sample(i,a,n.pose),n.poseSampleTime=a)}let s=n.motion?.kind===`reaction`?o?.samplers?.reactionGaze:void 0;if(s&&n.motion){n.reactionGaze?.motion!==n.motion&&(n.reactionGaze={motion:n.motion,yaw:n.gaze.yaw,pitch:n.gaze.pitch,x:n.eyes.x,y:n.eyes.y,strength:1,frozen:!0});let e=Hl((n.motion.held??this.time-n.motion.started)-s.entryTime,s.coreSeconds);n.reactionGaze.strength=e.strength,n.reactionGaze.frozen=e.frozen}else n.reactionGaze=void 0;n.normalMatrix.copy(n.matrix).setPosition(0,0,0),n.pointer.sample(e/1e3);let c=n.motion?.kind===`work`,l=n.reactionGaze,u=l?.strength??1,d=c?0:n.pointer.yaw+(l?.frozen?l.yaw:n.gaze.yaw)*u,f=c?0:n.pointer.pitch+(l?.frozen?l.pitch:n.gaze.pitch)*u;if(!r&&(d||f)){if(this.pointerMatrix.copy(this.pointerBasis).multiply(this.pointerPitch.makeRotationY(d)).multiply(this.pointerPitch.makeRotationX(f)).multiply(this.pointerInverse),n.normalMatrix.premultiply(this.pointerMatrix),l){let e=(n.poseOverride?.get(`mesh:0`)??n.pose?.[0])?.fields.gazeNeutralTranslation;if(!e)throw Error(`Reaction is missing its independent neutral frame`);this.pointerPivot.fromArray(e),this.rotatedPivot.copy(this.pointerPivot).applyMatrix4(this.pointerMatrix),this.pointerMatrix.setPosition(this.pointerPivot.sub(this.rotatedPivot))}else if(o?.source.preset!==`blue_beret`){let e=n.poseOverride?.get(`mesh:0`)?.world??(!this.paused||n.motion?n.pose?.[0]?.world:void 0)??o.parts[0].material.uniforms.d.value.world;this.pointerPivot.setFromMatrixPosition(e),this.rotatedPivot.copy(this.pointerPivot).applyMatrix4(this.pointerMatrix),this.pointerMatrix.setPosition(this.pointerPivot.sub(this.rotatedPivot))}n.matrix.premultiply(this.pointerMatrix)}let p=r?void 0:n.poseOverride?.get(`mesh:0`)?.fields.camera??(!this.paused||n.motion?n.pose?.[0]?.fields.camera:void 0),m=this.cameras.image.data,h=t*4;for(let e=0;e<4;e++){let t=Math.fround(p?.[e]??+(e<2));m[h+e]!==t&&(m[h+e]=t,a=!0)}}a&&(this.cameras.clearUpdateRanges(),this.cameras.addUpdateRange(0,this.count*4),this.cameras.needsUpdate=!0),this.occlusion.setAvatars(this.cameras,Math.min(this.count,this.cols),this.rows,this.backingPixels,this.count);for(let e of this.materials)e.uniforms.crowdProjection.value.copy(n);this.batches.forEach(e=>{let{mesh:t,part:n}=e,i=e.slots.filter(e=>this.states[e].rendering!==!1),a=this.attributesDirty||!e.renderedSlots||i.length!==e.renderedSlots.length||i.some((t,n)=>t!==e.renderedSlots[n]);e.renderedSlots=i,t.count=i.length,e.visible=!1;let o=0,s=t.geometry.getAttribute(`instanceOffset`),c=t.geometry.getAttribute(`instancePigment`);i.forEach((i,l)=>{let u=this.states[i];if(n.motionTexture){let i=r?void 0:u.poseOverride?.get(`${n.source.fur?`fur`:`mesh`}:${n.source.id}`)??(!this.paused||u.motion?u.pose?.[u.motion?.kind===`work`?u.motion.continuous?n.workLoopPart:n.workPart:n.motionPart]:void 0);i?(this.partWorld.multiplyMatrices(u.matrix,i.world),this.partNormal.multiplyMatrices(u.normalMatrix,i.normalMatrix)):(this.partWorld.multiplyMatrices(u.matrix,n.material.uniforms.d.value.world),this.partNormal.multiplyMatrices(u.normalMatrix,n.material.uniforms.d.value.normalMatrix));let a=u.reactionGaze,s=u.poseOverride?.get(`mesh:0`)??(!this.paused||u.motion?u.pose?.[0]:void 0),c=s?.fields.eyeBlink?.[0],d=!a||c!==void 0;if(!r&&n.eyeProfile&&u.motion?.kind!==`work`&&(n.eyeProfile.blink!==`external`||d)&&(a?.strength??1)>0&&((a?.frozen?a.x:u.eyes.x)||(a?.frozen?a.y:u.eyes.y))){let e=n.eyeProfile.blink===`external`?c??0:Jl(i?.fields.parameters??n.source.fields.parameters,n.eyeProfile.blink);if(a){this.reactionEyes.x=a.frozen?a.x:u.eyes.x,this.reactionEyes.y=a.frozen?a.y:u.eyes.y;let t=s?.fields;if(!t?.gazeNeutralTranslation||!t.gazeNeutralScale)throw Error(`Reaction is missing its independent ocular frame`);this.reactionComposer.writeEyeCorrection(this.reactionEyes,n.eyeProfile,e,a.strength,t.gazeNeutralTranslation,t.gazeNeutralScale,i?.world??n.material.uniforms.d.value.world,this.eyeWorld,this.eyeNormal)}else u.eyes.writeCorrection(n.eyeProfile,e,this.eyeWorld,this.eyeNormal);this.partWorld.multiply(this.eyeWorld),this.partNormal.multiply(this.eyeNormal)}t.setMatrixAt(l,this.partWorld);let f=n.motionTexture.image.data;for(let e=0;e<12;e++)f[l*64+e]=this.partNormal.elements[e];f.set(i?.fields.parameters??n.source.fields.parameters,l*64+12),f.set(i?.fields.signatureDeform??n.source.fields.signatureDeform,l*64+16),f.set(i?.fields.colorRoughness??n.source.fields.colorRoughness,l*64+20),f.set(i?.fields.paletteClosure??n.source.fields.paletteClosure,l*64+24),f.set(i?.fields.referencePose??n.source.fields.referencePose,l*64+28),f.set(i?.fields.coverage??n.source.fields.coverage,l*64+32);let p=i?.fields.camera,m=l*64+36;if(f[m]=p?.[0]??1,f[m+1]=p?.[1]??1,f[m+2]=p?.[2]??0,f[m+3]=p?.[3]??+!n.source.activity,e.visible||=f[m+3]>0,f.set(i?.fields.eyeCurveOriginAmount??n.source.fields.eyeCurveOriginAmount,l*64+40),f.set(i?.fields.eyeCurveRightWidth??n.source.fields.eyeCurveRightWidth,l*64+44),f.set(this.partWorld.elements,l*64+48),n.source.fur){let e=this.partWorld.elements,t=Math.max(Math.hypot(e[0],e[1],e[2]),Math.hypot(e[4],e[5],e[6]),Math.hypot(e[8],e[9],e[10])),r=n.source.fields.fur[1]*n.source.fields.fur[2]*t*Math.abs($l.frame.viewProjection[5])*(p?.[1]??1)*this.backingPixels*.5;o=Math.max(o,Math.min(8192,160+r*r*.027)*Dt.clamp((r-12)/48,0,1))}}else t.setMatrixAt(l,u.matrix),e.visible=!0;if(!a)return;s.setXY(l,(i%this.cols-(Math.min(this.count,this.cols)-1)/2)*3.64,((this.rows-1)/2-Math.floor(i/this.cols))*3.64);let d=u.color;if(n.source.colorRole!==`body`)c.setXYZ(l,1,1,1);else if(n.source.attachment===`three_lobe`||n.source.activity===`computer`){let e=this.asset(u.preset).source.material.parts[0].fields.colorRoughness,t=n.source.fields.colorRoughness;c.setXYZ(l,d.r*e[0]/Math.max(t[0],1e-6),d.g*e[1]/Math.max(t[1],1e-6),d.b*e[2]/Math.max(t[2],1e-6))}else c.setXYZ(l,d.r,d.g,d.b)}),i.length&&(t.instanceMatrix.clearUpdateRanges(),t.instanceMatrix.addUpdateRange(0,i.length*16),t.instanceMatrix.needsUpdate=!0),n.source.fur&&n.motionTexture&&t.geometry.setDrawRange(0,Math.ceil(o)*12),i.length&&n.motionTexture&&(n.motionTexture.clearUpdateRanges(),i.length===1&&n.motionTexture.image.height>1&&n.motionTexture.addUpdateRange(0,64),n.motionTexture.needsUpdate=!0),a&&i.length&&(s.clearUpdateRanges(),s.addUpdateRange(0,i.length*2),c.clearUpdateRanges(),c.addUpdateRange(0,i.length*3),s.needsUpdate=c.needsUpdate=!0)}),this.attributesDirty=!1,this.updateRenderBounds(),this.renderer.info.autoReset=!1,this.renderer.info.reset(),this.batches.forEach(({mesh:e,part:t,visible:n})=>{e.visible=n&&t.depth!==null,t.depth&&(e.material=t.depth)}),this.renderer.setRenderTarget(this.depthTarget),this.renderer.render(this.scene,this.camera);let o=this.occlusion.render(this.depthTarget.depthTexture,n,this.depthTarget.width,this.depthTarget.height,this.renderBounds);if(this.batches.forEach(({mesh:e,part:t,visible:n})=>{e.visible=n,e.material=t.material,t.material.uniforms.ambientOcclusion.value=o}),this.renderer.setRenderTarget(this.colorTarget),this.renderer.render(this.scene,this.camera),this.updateCrops(),r){this.fitPasses++,this.fitReads.length||this.invalidate();return}let s=this.renderer.getPixelRatio();if(this.renderer.setScissor(this.renderBounds.x/s,this.renderBounds.y/s,this.renderBounds.z/s,this.renderBounds.w/s),this.renderer.setScissorTest(this.colorTarget.scissorTest),this.renderer.setRenderTarget(this.outputTarget??null),this.renderer.render(this.presentScene,this.camera),this.renderer.setScissorTest(!1),this.frames++,this.host&&this.outputTarget){let{__webglFramebuffer:e}=this.renderer.properties.get(this.outputTarget);this.host.onFrame({framebuffer:e,width:this.outputTarget.width,height:this.outputTarget.height,columns:Math.min(this.count,this.cols),rows:this.rows,pixels:this.backingPixels,renderedIndices:this.states.flatMap((e,t)=>e.rendering===!1?[]:[t])})}this.onFrame?.();let c=!1;for(let e of this.states){if(e.rendering===!1)continue;let n=e.gaze.yaw,r=e.gaze.pitch,i=e.eyes.x,a=e.eyes.y;e.gaze.advance(t),e.eyes.advance(t),e.gazePending&&=(e.gaze.point(e.gazeTarget.x,e.gazeTarget.y),this.asset(e.preset)?.parts.some(e=>e.eyeProfile)&&e.eyes.point(e.gazeTarget.x,e.gazeTarget.y),!1),c||=n!==e.gaze.yaw||r!==e.gaze.pitch||e.gaze.moving||i!==e.eyes.x||a!==e.eyes.y||e.eyes.moving}c||this.states.some(e=>e.rendering!==!1&&(e.pointer.moving||!this.paused&&e.entrance&&e.entrance.held===void 0))||!this.paused&&this.states.some(e=>e.rendering!==!1&&!e.poseOverride&&(!this.asset(e.preset)?.samplers||!e.motion||e.motion.held===void 0&&(e.motion.kind===`idle`||e.motion.continuous||this.time-e.motion.started<this.asset(e.preset).samplers[e.motion.kind].clip.duration)))?this.invalidate(!1):this.previousTime=0},this.host=t.host,!e&&!this.host)throw Error(`Avatar engine requires a canvas or a render host`);this.allowPoseOverrides=t.poseOverrides??!1,this.onFrame=t.onFrame,this.onError=t.onError,this.resolveAsset=t.resolveAsset,this.lazyWork=t.lazyWork??!1,this.assetLoader=t.assetLoader??Cd,this.maxFrameRate=this.validFrameRate(t.maxFrameRate??60),this.defaultPreset=t.preset??`blue_beret`,this.count=this.validCount(t.count??1),this.pixels=Math.max(48,Number.isFinite(t.size)?t.size:320),this.detail=this.pixels<=128?`low`:`high`,this.fits.needsUpdate=!0;let n=new Map,r=e=>{let t={type:e,preventDefault(){}};for(let r of n.get(e)??[])r(t)};if(this.host&&typeof this.host.context.texStorage2D!=`function`)throw Error(`Avatar render host requires a WebGL2 context`);let i=this.host?{width:1,height:1,style:{},getContext:e=>e===`webgl2`?this.host.context:null,addEventListener(e,t){let r=n.get(e)??new Set;r.add(t),n.set(e,r)},removeEventListener(e,t){n.get(e)?.delete(t)},setAttribute(){}}:e;this.renderer=new Wc({canvas:i,alpha:!0,antialias:!1}),this.disabledShadow.compareFunction=515,this.disabledShadow.needsUpdate=!0,this.occlusion=new Rl(this.renderer,$l.frame),this.renderer.setPixelRatio(Math.min(this.pixelRatio(),2)),this.renderer.setClearColor(0,0),this.renderer.outputColorSpace=Re,this.presentScene.add(new $r(this.presentGeometry,this.presentMaterial)),this.camera.position.z=4,this.camera.updateMatrixWorld(),this.host?(this.outputTarget=new qt(1,1,{depthBuffer:!1}),this.unsubscribeHost=this.host.subscribe?.({resize:()=>this.resize(),visibility:this.visibilityChanged,contextLost:()=>{r(`webglcontextlost`),this.onContextLost()},contextRestored:()=>{r(`webglcontextrestored`),this.onContextRestored()}})):(this.observer=new ResizeObserver(()=>this.resize()),this.observer.observe(e),this.visibilityObserver=new IntersectionObserver(([e])=>{this.inViewport=e?.isIntersecting??!1,this.visibilityChanged()}),this.visibilityObserver.observe(e),document.addEventListener(`visibilitychange`,this.visibilityChanged),e.addEventListener(`webglcontextlost`,this.onContextLost),e.addEventListener(`webglcontextrestored`,this.onContextRestored)),this.loaded=this.load()}hidden(){return this.host?this.host.isHidden():document.hidden}pixelRatio(){return this.host?this.host.getSize().pixelRatio:window.devicePixelRatio||1}cancelFrame(){this.host?this.host.cancelFrame(this.raf):cancelAnimationFrame(this.raf)}async load(){let e=await Promise.all([Ed,Dd].map(jd));this.disposed||(this.textures=e.map((e,t)=>{let n=$l.sourceTextures[t+2],i=n.type===5126,a=new ni(i?new Float32Array(e):new Uint8Array(e),n.width,n.height,E,i?_:d);return a.wrapS=a.wrapT=r,a.minFilter=a.magFilter=c,a.generateMipmaps=!1,a.needsUpdate=!0,a}),await this.ensureAsset(this.defaultPreset),!this.disposed&&(this.ready=!0,this.setCount(this.count)))}asset(e){return this.assets.get(`${e}:${this.detail}`)}ensureAsset(e,t=this.detail,n=!this.lazyWork||this.states.some(t=>t.preset===e&&t.motion?.kind===`work`)){let r=`${e}:${t}`,i=`${r}:${n?`work`:`base`}`;if(!yd.includes(e)&&!this.resolveAsset)return Promise.reject(Error(`Unsupported avatar: ${e}`));let a=this.assets.get(r);if(a&&(!n||a.activities))return Promise.resolve(a);let o=this.pendingAssets.get(i);if(o)return o;let s=(yd.includes(e)?Promise.all([this.assetLoader(e,t,n),Dl(e,n)]).then(([e,t])=>(Pl(e.parts),{source:e,samplers:t,eyeProfiles:void 0})):this.resolveAsset(e,t,n)).then(({source:i,samplers:a,eyeProfiles:o})=>{if(this.disposed)throw i.parts.forEach(e=>e.geometry.dispose()),Error(`Avatar engine disposed during loading`);let s={source:i,parts:i.parts.map(n=>{n.geometry.setAttribute(`instanceOffset`,new ri(new Float32Array(400),2).setUsage(Ue)),n.geometry.setAttribute(`instancePigment`,new ri(new Float32Array(600).fill(1),3).setUsage(Ue));let r=a||this.allowPoseOverrides?new ni(new Float32Array(64),16,1,E,_):null,s=a?.idle.clip.parts.findIndex(e=>e.id===`${n.fur?`fur`:`mesh`}:${n.id}`)??-1,c=a?.work?.clip.parts.findIndex(e=>e.id===`${n.fur?`fur`:`mesh`}:${n.id}`)??-1,l=a?.workLoop?.clip.parts.findIndex(e=>e.id===`${n.fur?`fur`:`mesh`}:${n.id}`)??-1;if(a&&s<0&&!n.activity)throw Error(`Missing motion part: ${e}/${n.id}`);let u=this.material(n,i.material.frame);r&&(u.defines.AUTHORED_MOTION=1,u.defines.AUTHORED_COMPUTER=1,u.uniforms.instancePose={value:r});let d=n.fur||n.depthWrite===!1?null:new ji({glslVersion:We,vertexShader:Zl,fragmentShader:`precision highp float; out vec4 color; void main(){color=vec4(1);}`,uniforms:u.uniforms,defines:r?{AUTHORED_MOTION:1,AUTHORED_COMPUTER:1}:{},colorWrite:!1});return this.geometries.push(n.geometry),this.materials.push(u),d&&this.depthMaterials.push(d),{source:n,material:u,depth:d,motionTexture:r,motionPart:s,workPart:c,workLoopPart:l,eyeProfile:n.fur?null:(o?o[n.id]:Od[i.preset]?.[t===`high`?`1`:`0`]?.[n.id])??null}}),samplers:a,activities:n},c=this.assets.get(r);return c?.activities&&!n?(this.disposeAsset(s),c):(c&&this.retiredAssets.push(c),this.assets.set(r,s),t===`high`&&yd.includes(e)&&this.cropCache.set(`${e}:high:320`,i.material.crop),s)}).finally(()=>this.pendingAssets.delete(i));return this.pendingAssets.set(i,s),s}material(e,t){let n=Ad(t);return new ji({glslVersion:We,vertexShader:Zl,fragmentShader:Ql,defines:{...e.universal?{}:{FELIPE_MATERIAL:1,FELIPE_KIND:e.kind},...e.fur?{FELIPE_FUR:1}:{}},uniforms:{f:{value:n},d:{value:Ad(e.fields)},skin:{value:{joints:kd}},crowdProjection:{value:new Y},crowdInverseProjection:{value:this.inverseProjection},outputInverse:{value:new G},ambientOcclusion:{value:null},shadowMap:{value:this.disabledShadow},shadowDepth:{value:null},occlusionDepth:{value:this.depthTarget.depthTexture},environmentBRDF:{value:null},studioLighting:{value:null},paletteField:{value:null},referencePalette:{value:null},furLTC1:{value:this.textures[0]},furLTC2:{value:this.textures[1]}},premultipliedAlpha:!0,transparent:e.transparent??(e.fur||e.fields.coverage[0]<1),depthWrite:e.depthWrite??!e.fur,depthTest:e.depthTest??!0,side:e.doubleSided||e.fur?2:0})}validCount(e){return Math.max(1,Math.min(200,Math.floor(Number.isFinite(e)?e:1)))}setCount(e){if(this.disposed)return;let t=this.validCount(e);if(!(this.ready&&this.count===t&&this.states.length===t)&&(this.pointerIndex!==null&&this.pointerIndex>=t&&this.endPointer(),this.hoverIndex!==null&&this.hoverIndex>=t&&this.selectHover(null),this.count=t,this.ready)){for(;this.states.length<this.count;)this.states.push({preset:this.defaultPreset,matrix:new Y,normalMatrix:new Y,color:new X(1,1,1),colorHex:null,look:new G,pointer:new zl,gaze:new Bl,eyes:new Yl,gazeTarget:new G(.5,.5),gazePending:!1,phase:this.states.length*2.399,revision:0});this.states.length=this.count;for(let e of this.states)this.resolvePigment(e);this.rebuildBatches()}}pruneAssets(){let e=new Set([this.defaultPreset,...this.states.map(e=>e.preset),...this.assetClaims.keys()]),t=[...this.assets].filter(([t])=>!e.has(t.slice(0,t.lastIndexOf(`:`)))&&!this.pendingAssets.has(`${t}:base`)&&!this.pendingAssets.has(`${t}:work`));for(let[e,n]of t.slice(0,Math.max(0,t.length-4))){this.assets.delete(e),this.disposeAsset(n);for(let t of this.cropCache.keys())t.startsWith(e+`:`)&&this.cropCache.delete(t)}}disposeAsset(e){for(let t of e.parts)t.motionTexture?.dispose(),t.source.geometry.dispose(),t.material.dispose(),t.depth?.dispose(),this.geometries=this.geometries.filter(e=>e!==t.source.geometry),this.materials=this.materials.filter(e=>e!==t.material),t.depth&&(this.depthMaterials=this.depthMaterials.filter(e=>e!==t.depth))}async ensureCurrentDetail(e,t){for(let t of e)this.assetClaims.set(t,(this.assetClaims.get(t)??0)+1);let n=()=>{for(let t of e){let e=this.assetClaims.get(t)-1;e?this.assetClaims.set(t,e):this.assetClaims.delete(t)}this.disposed||this.pruneAssets()};try{let r;do r=this.detail,await Promise.all(e.map(e=>this.ensureAsset(e,r,t)));while(!this.disposed&&r!==this.detail);return n}catch(e){throw n(),e}}getInstancePreset(e){return this.states[e]?.preset}hasPreset(e){return!!this.asset(e)}cancelPresetChange(e){let t=this.states[e];t&&t.revision++}async setPreset(e,t,n=()=>!0){await this.loaded;let r=this.states[e];if(!r||this.disposed)return;let i=++r.revision;if(r.preset===t&&this.asset(t))return;let a=await this.ensureCurrentDetail([t]);try{if(this.disposed||this.states[e]!==r||i!==r.revision||!n())return;r.preset!==t&&(this.pointerIndex===e&&this.endPointer(),r.pointer.reset(),r.gaze.reset(),r.eyes.reset(),r.gazeTarget.set(.5,.5),r.gazePending=!1,r.motion=void 0,r.pose=void 0,r.poseOverride=void 0),r.preset=t,this.resolvePigment(r),this.rebuildBatches()}finally{a()}}async setPresets(e){await this.loaded;let t=this.states.map((t,n)=>({state:t,revision:++t.revision,preset:e[n%e.length]}));if(t.some(e=>!e.preset))throw Error(`An avatar preset is required`);let n=await this.ensureCurrentDetail([...new Set(t.map(e=>e.preset))]);try{if(this.disposed)return;t.forEach(({state:e,revision:t,preset:n},r)=>{this.states[r]===e&&e.revision===t&&(e.preset!==n&&(this.endPointer(),e.pointer.reset(),e.gaze.reset(),e.eyes.reset(),e.gazeTarget.set(.5,.5),e.gazePending=!1,e.motion=void 0,e.pose=void 0,e.poseOverride=void 0),e.preset=n,this.resolvePigment(e))}),this.rebuildBatches()}finally{n()}}rebuildBatches(){for(let{mesh:e}of this.batches)this.scene.remove(e),e.dispose();this.batches=[];for(let e of this.retiredAssets)this.disposeAsset(e);this.retiredAssets=[];let e=new Map;this.states.forEach((t,n)=>{let r=e.get(t.preset)??[];r.push(n),e.set(t.preset,r)});for(let[t,n]of e){let e=this.asset(t);for(let t of e.parts){if(t.motionTexture&&t.motionTexture.image.height<n.length){let e=Math.min(200,2**Math.ceil(Math.log2(n.length)));t.motionTexture.dispose(),t.motionTexture.image={data:new Float32Array(e*64),width:16,height:e},t.motionTexture.needsUpdate=!0}let e=t.source.geometry,r=new di(e,t.material,n.length);r.frustumCulled=!1,r.renderOrder=t.source.renderOrder??0,r.instanceMatrix.setUsage(Ue),this.scene.add(r),this.batches.push({mesh:r,part:t,slots:n,visible:!0})}for(let t of n)this.fits.image.data.set(e.source.material.crop,t*4)}this.fits.needsUpdate=!0,this.resize()}async setSize(e){if(!Number.isFinite(e)||this.disposed)return;this.pixels=Math.max(48,e);let t=++this.sizeRevision,n=this.pixels<=128?`low`:`high`;for(this.resize(),await this.loaded;!this.disposed&&t===this.sizeRevision&&n!==this.detail;){if(await Promise.all([...new Set(this.states.map(e=>e.preset))].map(e=>this.ensureAsset(e,n))),this.disposed||t!==this.sizeRevision)return;this.states.some(e=>!this.assets.has(`${e.preset}:${n}`))||(this.detail=n,this.rebuildBatches())}}setPose(e,t){if(!this.allowPoseOverrides)throw Error(`Pose overrides were not enabled`);if(this.disposed)return;let n=this.states[e];if(n){if(t){let e=this.asset(n.preset);if(!e)throw Error(`Avatar assets are not ready`);let r=new Map(t.map(e=>[e.id,e]));if(r.size!==t.length||r.size!==e.parts.length)throw Error(`Pose parts must match the selected avatar`);for(let t of e.parts){let e=r.get(`${t.source.fur?`fur`:`mesh`}:${t.source.id}`);if(!e||!e.world.elements.every(Number.isFinite)||!e.normalMatrix.elements.every(Number.isFinite))throw Error(`Invalid pose transform or part identity`);for(let t of[`parameters`,`signatureDeform`,`colorRoughness`,`paletteClosure`,`referencePose`,`coverage`,`eyeCurveOriginAmount`,`eyeCurveRightWidth`,`camera`]){let n=e.fields[t];if(n&&(n.length!==4||!n.every(Number.isFinite)))throw Error(`Invalid pose field: ${t}`)}let n=e.fields.camera;if(n&&(n[0]<=0||n[1]<=0||n[3]<0||n[3]>1))throw Error(`Invalid pose camera`)}let i=n.poseOverride??new Map;for(let e of r.values()){let t=i.get(e.id);if(!t)i.set(e.id,{id:e.id,world:e.world.clone(),normalMatrix:e.normalMatrix.clone(),fields:Object.fromEntries(Object.entries(e.fields).map(([e,t])=>[e,t.slice()]))});else{t.world.copy(e.world),t.normalMatrix.copy(e.normalMatrix);for(let n of Object.keys(t.fields))n in e.fields||delete t.fields[n];for(let[n,r]of Object.entries(e.fields)){let e=t.fields[n]??(t.fields[n]=[]);for(let t=0;t<r.length;t++)e[t]=r[t]}}}n.poseOverride=i}else n.poseOverride=void 0;this.invalidate()}}resetAppearance(e){(e===void 0||this.pointerIndex===e)&&this.endPointer(),(e===void 0||this.hoverIndex===e)&&(this.hoverIndex=null),this.attributesDirty=!0;for(let t of e===void 0?this.states:this.states.slice(e,e+1))t.motion=void 0,t.poseOverride=void 0,t.colorHex=null,this.resolvePigment(t),t.look.set(0,0),t.pointer.reset(),t.gaze.reset(),t.eyes.reset(),t.gazeTarget.set(.5,.5),t.gazePending=!1;this.invalidate()}setMotionFrame(e,t,n){let r=this.states[e];return!r||!this.asset(r.preset)?.samplers||!Number.isFinite(n)||t!==`idle`&&t!==`reaction`&&t!==`work`||!this.asset(r.preset)?.samplers?.[t]?!1:(r.poseOverride=void 0,r.motion={kind:t,started:this.time,held:Math.max(0,n)},this.invalidate(),!0)}canReact(e){let t=this.states[e];return!!t&&!!this.asset(t.preset)?.samplers?.reaction}canIdle(e){let t=this.states[e];return!!t&&!!this.asset(t.preset)?.samplers?.idle}canWork(e){let t=this.states[e];if(!t)return!1;let n=this.asset(t.preset);return!!n?.samplers?.work&&n.parts.some(e=>e.source.activity===`computer`)}async prepareWork(e){await this.loaded;let t=this.states[e];if(!t||this.disposed)return!1;let n=t.preset,r=t.revision;if(this.asset(n)?.activities)return this.canWork(e);let i=await this.ensureCurrentDetail([n],!0);try{return!this.disposed&&(this.rebuildBatches(),this.states[e]===t&&t.preset===n&&t.revision===r&&this.canWork(e))}finally{i()}}work(e,t=!1,n=1){let r=this.states[e];return!r||!this.canWork(e)||t&&!this.asset(r.preset)?.samplers?.workLoop?!1:(r.poseOverride=void 0,r.motion={kind:`work`,started:this.time,pendingStart:!0,continuous:t,remainingCycles:Number.isFinite(n)?Math.max(1,Math.floor(n)):1},this.setPaused(!1),!0)}react(e){let t=this.states[e];if(!t||t.pointer.active||!this.asset(t.preset)?.samplers?.reaction)return!1;let n=this.asset(t.preset).samplers.reaction.clip;return t.motion?.kind===`reaction`&&t.motion.held===void 0&&(t.motion.pendingStart||this.time-t.motion.started<n.duration)?(t.motion.queuedReaction=!0,this.invalidate(),!0):(t.poseOverride=void 0,t.motion={kind:`reaction`,started:this.time,pendingStart:!0},t.reactionGaze={motion:t.motion,yaw:t.gaze.yaw,pitch:t.gaze.pitch,x:t.eyes.x,y:t.eyes.y,strength:1,frozen:!0},this.setPaused(!1),!0)}idle(e){let t=this.states[e];return!t||!this.asset(t.preset)?.samplers?!1:(t.poseOverride=void 0,t.motion={kind:`idle`,started:this.time},this.setPaused(!1),!0)}validFrameRate(e){if(e!==1/0&&(!Number.isFinite(e)||e<1||e>240))throw Error(`Frame rate must be 1–240 or Infinity`);return e}setMaxFrameRate(e){this.maxFrameRate=this.validFrameRate(e),this.invalidate()}setPaused(e){e&&this.states.forEach(e=>{e.motion=void 0}),this.paused!==e&&(this.previousTime=0),this.paused=e,this.invalidate()}entrance(e){let t=this.states[e];t&&(t.entrance={started:this.time,pendingStart:!0},this.invalidate())}setWander(e,t){let n=this.states[e];n&&(n.wander=t?{next:this.time,step:0}:void 0,this.invalidate())}setGaze(e,t,n){if(!Number.isFinite(t)||!Number.isFinite(n))throw Error(`Invalid avatar gaze`);this.queueGaze(e,Dt.clamp(t,0,1),Dt.clamp(n,0,1))}setLook(e,t,n){let r=this.states[e];r&&(t=Number.isFinite(t)?Dt.clamp(t,-1,1):0,n=Number.isFinite(n)?Dt.clamp(n,-1,1):0,(r.look.x!==t||r.look.y!==n)&&(r.look.set(t,n),this.invalidate()))}setColor(e,t){let n=this.states[e];if(n){if(!/^#[0-9a-f]{6}$/i.test(t))throw Error(`Body color must be #RRGGBB`);this.attributesDirty=!0,n.colorHex=t,this.resolvePigment(n),this.invalidate()}}clearColor(e){let t=this.states[e];t&&(t.colorHex=null,this.resolvePigment(t),this.attributesDirty=!0,this.invalidate())}setInstancePaused(e,t){let n=this.states[e];if(!n)return;let r=n.motion??={kind:`idle`,started:-n.phase};t&&r.held===void 0?r.held=this.time-r.started:!t&&r.held!==void 0&&(r.started=this.time-r.held,delete r.held),n.entrance&&(t&&n.entrance.held===void 0?n.entrance.held=this.time-n.entrance.started:!t&&n.entrance.held!==void 0&&(n.entrance.started=this.time-n.entrance.held,delete n.entrance.held)),this.invalidate()}setInstanceRendering(e,t){let n=this.states[e];n&&n.rendering!==t&&(n.rendering=t,t&&(this.cropCache.has(`${n.preset}:${this.detail}:${this.backingPixels}`)||(this.fitsDirty=this.fitPending=!0),this.invalidate()))}resolvePigment(e){let t=this.asset(e.preset).source.material.parts[0].fields.colorRoughness;e.colorHex?e.color.set(e.colorHex):e.color.setRGB(t[0],t[1],t[2]),Kc(e.color),e.color.r/=Math.max(t[0],1e-6),e.color.g/=Math.max(t[1],1e-6),e.color.b/=Math.max(t[2],1e-6)}hitTest(e,t){if(!Number.isFinite(e)||!Number.isFinite(t)||e<0||t<0||e>=this.width||t>=this.height)return null;let n=Math.min(this.count,this.cols),r=Math.floor((e-this.width/2)/this.pixels+n/2),i=Math.floor((t-this.height/2)/this.pixels+this.rows/2),a=i*this.cols+r;return r>=0&&r<n&&i>=0&&i<this.rows&&a<this.count?a:null}pointerCoordinates(e,t,n){let r=this.width/2+(e%this.cols-Math.min(this.count,this.cols)/2)*this.pixels,i=this.height/2+(Math.floor(e/this.cols)-this.rows/2)*this.pixels,a=this.fits.image.data;return[a[e*4]+(t-r)/this.pixels*a[e*4+2],a[e*4+1]+(n-i)/this.pixels*a[e*4+3]]}beginPointer(e,t){if(!this.ready||this.fitPending||this.pointerIndex!==null)return null;let n=this.hitTest(e,t);return n===null||!this.states[n]?null:(this.selectHover(n),this.pointerIndex=n,this.queueGaze(n,...this.pointerCoordinates(n,e,t)),this.states[n].pointer.down(...this.pointerCoordinates(n,e,t),performance.now()/1e3),this.invalidate(),n)}queueGaze(e,t,n){let r=this.states[e];!r||this.asset(r.preset)?.source.preset===`blue_beret`||r.gazeTarget.x===t&&r.gazeTarget.y===n||(r.gazeTarget.set(t,n),r.gazePending=!0,this.invalidate())}selectHover(e){this.hoverIndex!==e&&(this.hoverIndex!==null&&this.queueGaze(this.hoverIndex,.5,.5),this.hoverIndex=e)}endPointer(e,t){this.pointerIndex!==null&&(this.states[this.pointerIndex]?.pointer.up(performance.now()/1e3),this.pointerIndex=null,e!==void 0&&t!==void 0&&this.point(e,t),this.invalidate())}point(e,t){if(!this.ready||this.fitPending||!Number.isFinite(e)||!Number.isFinite(t))return;if(this.pointerIndex!==null){let n=this.pointerIndex,r=this.pointerCoordinates(n,e,t);this.states[n]?.pointer.move(...r),this.queueGaze(n,...r),this.invalidate();return}let n=this.hitTest(e,t);this.selectHover(n),n!==null&&this.queueGaze(n,...this.pointerCoordinates(n,e,t))}resize(){if(this.disposed)return;this.cancelFitReads(),this.attributesDirty=!0,this.fitsDirty=!0;let e=this.pixels<=64?1:this.pixels<=128?1.5:2;this.backingPixels=Math.max(64,Math.min(512,Math.round(this.pixels*Math.min(this.pixelRatio(),e)))),this.renderer.setPixelRatio(this.backingPixels/this.pixels),this.fitPending=this.states.some(e=>e.rendering!==!1&&!this.cropCache.has(`${e.preset}:${this.detail}:${this.backingPixels}`));let{width:t,height:n}=this.host?this.host.getSize():this.canvas.getBoundingClientRect();this.width=Math.max(1,t),this.height=Math.max(1,n),this.cols=Math.max(1,Math.floor(this.width/this.pixels)),this.rows=Math.ceil(this.count/this.cols);for(let{part:e}of this.batches){if(!e.source.fur)continue;let t=e.source.fields,n=new K().setFromMatrixScale(new Y().fromArray(t.world)),r=t.fur[1]*t.fur[2]*Math.max(n.x,n.y,n.z)*Math.abs($l.frame.viewProjection[5])*this.backingPixels*.5,i=Math.min(8192,160+r*r*.027)*Dt.clamp((r-12)/48,0,1);e.source.geometry.setDrawRange(0,Math.ceil(i)*12)}for(let e of this.materials)e.uniforms.f.value.viewport.set(this.backingPixels,this.backingPixels,1/this.backingPixels,1/this.backingPixels);let r=3.64/this.pixels;this.camera.left=-this.width*r/2,this.camera.right=this.width*r/2,this.camera.top=this.height*r/2,this.camera.bottom=-this.height*r/2,this.camera.updateProjectionMatrix(),this.renderer.setSize(this.width,this.height,!1);let i=this.renderer.getPixelRatio();this.colorTarget.setSize(Math.round(this.width*i),Math.round(this.height*i)),this.depthTarget.setSize(this.colorTarget.width,this.colorTarget.height),this.outputTarget?.setSize(this.colorTarget.width,this.colorTarget.height);for(let e of this.materials)e.uniforms.outputInverse.value.set(1/this.colorTarget.width,1/this.colorTarget.height);this.presentMaterial.uniforms.surface.value.set(this.width,this.height),this.presentMaterial.uniforms.grid.value.set(this.pixels,Math.min(this.count,this.cols),this.rows,this.count),this.invalidate()}setPresentationCapacity(e){this.disposed||this.presentationCapacity===e||(this.presentationCapacity=e,e?this.presentationQueued&&(this.presentationQueued=!1,this.invalidate(!1)):this.raf&&(this.cancelFrame(),this.raf=0,this.presentationQueued=!0))}invalidate(e=!0){this.urgentFrame||=e,this.presentationCapacity?this.raf||this.disposed||this.hidden()||!this.inViewport||this.contextLost||(this.raf=this.host?this.host.requestFrame(this.tick):requestAnimationFrame(this.tick)):this.presentationQueued=!0}updateRenderBounds(){let e=this.colorTarget.width,t=this.colorTarget.height,n=this.renderBounds;if(n.set(0,0,e,t),this.states.some(e=>e.rendering===!1)){let r=this.cols,i=0,a=this.rows,o=0;this.states.forEach((e,t)=>{if(e.rendering===!1)return;let n=t%this.cols,s=Math.floor(t/this.cols);r=Math.min(r,n),i=Math.max(i,n+1),a=Math.min(a,s),o=Math.max(o,s+1)});let s=(e-Math.min(this.count,this.cols)*this.backingPixels)/2,c=(t-this.rows*this.backingPixels)/2,l=Math.max(0,Math.floor(s+r*this.backingPixels)-8),u=Math.max(0,Math.floor(c+(this.rows-o)*this.backingPixels)-8),d=Math.min(e,Math.ceil(s+i*this.backingPixels)+8),f=Math.min(t,Math.ceil(c+(this.rows-a)*this.backingPixels)+8);n.set(l,u,Math.max(0,d-l),Math.max(0,f-u))}for(let r of[this.depthTarget,this.colorTarget])r.scissor.copy(n),r.scissorTest=n.z<e||n.w<t;this.outputTarget&&(this.outputTarget.scissor.copy(n),this.outputTarget.scissorTest=this.colorTarget.scissorTest)}cancelFitReads(){this.fitGeneration++;for(let e of this.fitReads)e.cancel();this.fitReads=[]}fittedCrop(e,t,n){let r=t,i=t,a=-1,o=-1;for(let n=0;n<t;n++)for(let s=0;s<t;s++)e[((t-n-1)*t+s)*4+3]<=24||(r=Math.min(r,s),a=Math.max(a,s),i=Math.min(i,n),o=Math.max(o,n));if(a<r)return n;let s=Math.max(a-r+1,o-i+1)*1.22;return[(r+a-s)/(2*t),(i+o-s)/(2*t),s/t,s/t]}applyCachedFits(){let e=!1,t=this.backingPixels;this.states.forEach((n,r)=>{if(n.rendering===!1)return;let i=this.cropCache.get(`${n.preset}:${this.detail}:${t}`);if(!i)return;let a=this.fits.image.data;i.some((e,t)=>Math.abs(a[r*4+t]-e)>1e-7)&&(a.set(i,r*4),e=!0)}),e&&(this.fits.needsUpdate=!0),this.fitPending=this.states.some(e=>e.rendering!==!1&&!this.cropCache.has(`${e.preset}:${this.detail}:${t}`)),this.fitsDirty=this.fitPending}updateCrops(){if(!this.fitsDirty||this.fitReads.length)return;let e=this.backingPixels,t=this.renderer.getPixelRatio(),n=new Map;if(this.states.forEach((r,i)=>{if(r.rendering===!1)return;let a=`${r.preset}:${this.detail}:${e}`;if(this.cropCache.has(a)||n.has(a))return;let o=Math.round(this.width*t/2+(i%this.cols-Math.min(this.count,this.cols)/2)*e),s=Math.round(this.height*t/2+(Math.floor(i/this.cols)-this.rows/2)*e);n.set(a,{left:o,bottom:this.colorTarget.height-s-e,fallback:this.asset(r.preset).source.material.crop.slice()})}),!n.size){this.applyCachedFits();return}if(this.host){for(let[t,r]of n){let n=new Uint8Array(e*e*4);this.renderer.readRenderTargetPixels(this.colorTarget,r.left,r.bottom,e,e,n),this.cropCache.set(t,this.fittedCrop(n,e,r.fallback))}this.applyCachedFits();return}let r=this.fitGeneration,i=this.renderer.getContext(),{__webglFramebuffer:a}=this.renderer.properties.get(this.colorTarget),o=n.entries(),s=[],c=async()=>{for(let[t,n]of o){if(this.disposed||r!==this.fitGeneration)return;let o=Gc(i,a,n.left,n.bottom,e,e);this.fitReads.push(o);try{let r=await o.promise;s.push({key:t,crop:this.fittedCrop(r,e,n.fallback)})}finally{let e=this.fitReads.indexOf(o);e>=0&&this.fitReads.splice(e,1)}}};Promise.all([c(),c()]).then(()=>{if(!(this.disposed||r!==this.fitGeneration)){this.fitReads=[];for(let{key:e,crop:t}of s)this.cropCache.set(e,t);this.applyCachedFits(),this.invalidate()}}).catch(e=>{this.disposed||r!==this.fitGeneration||(i.isContextLost()?this.onContextLost():(this.cancelFitReads(),this.renderFailure=e instanceof Error?e:Error(String(e)),this.cancelFrame(),this.raf=0,this.onError?.(this.renderFailure)))})}stats(){return{ready:this.ready,surfaceFinish:`smooth`,retainedCanvasCulling:!0,activeAtlasScissor:!0,asyncFitReadback:!this.host,pendingFitReads:this.fitReads.length,presentationCapacity:this.presentationCapacity,presentationQueued:this.presentationQueued,renderFailure:this.renderFailure?.message??null,renderedPixels:this.renderBounds.z*this.renderBounds.w,atlasPixels:this.colorTarget.width*this.colorTarget.height,renderBounds:this.renderBounds.toArray(),lazyWork:this.lazyWork,renderer:`original-assets-three`,parity:!1,missing:[`full animation controllers and transitions`,`cross-phase action entry and interruptions`,`reaction pointer blending and input arbitration`,`catalog part mixing beyond the eight presets`],presets:[...new Set(this.states.map(e=>e.preset))],detail:this.detail,motionPresets:[...this.assets].filter(([,e])=>e.samplers).map(([,e])=>e.source.preset),count:this.count,renderedInstances:this.states.filter(e=>e.rendering!==!1).length,frames:this.frames,fitPasses:this.fitPasses,poseEvaluations:this.poseSharing.evaluations,sharedPoseCopies:this.poseSharing.copies,suspended:this.hidden()||!this.inViewport||this.contextLost,frameRateLimit:this.maxFrameRate===1/0?null:this.maxFrameRate,observedFrameRate:this.elapsed?this.timedFrames/this.elapsed:0,columns:this.cols,rows:this.rows,width:this.width,height:this.height,requiredHeight:this.rows*this.pixels,pixelRatio:this.renderer.getPixelRatio(),backingPixelsPerAvatar:this.backingPixels,cachedFits:this.cropCache.size,cachedAssets:this.assets.size,pendingAssets:this.pendingAssets.size,poseTextureBytes:[...this.assets.values()].reduce((e,t)=>e+t.parts.reduce((e,t)=>e+(t.motionTexture?.image.data?.byteLength??0),0),0),resources:{geometries:this.renderer.info.memory.geometries,textures:this.renderer.info.memory.textures,programs:this.renderer.info.programs?.length},states:this.states.map((e,t)=>({index:t,phase:e.phase,motion:e.poseOverride?`held-pose`:this.asset(e.preset)?.samplers?e.motion?.kind??(this.paused?`reference`:`idle`):`provisional`,motionTime:e.motion?.held??(e.motion?this.time-e.motion.started:this.time+e.phase),preset:e.preset,renderedParts:this.asset(e.preset)?.source.parts.map(e=>({id:e.id,label:e.label,colorRole:e.colorRole})),pigment:e.color.toArray(),look:e.look.toArray(),pointer:{active:e.pointer.active,yaw:e.pointer.yaw,pitch:e.pointer.pitch},gaze:{yaw:e.gaze.yaw,pitch:e.gaze.pitch,target:e.gazeTarget.toArray()},eyes:{x:e.eyes.x,y:e.eyes.y}})),contexts:+!this.disposed,drawCalls:this.renderer.info.render.calls,triangles:this.renderer.info.render.triangles}}dispose(){this.cancelFitReads(),!this.disposed&&(this.disposed=!0,this.cancelFrame(),this.observer?.disconnect(),this.visibilityObserver?.disconnect(),this.unsubscribeHost?.(),this.host||(document.removeEventListener(`visibilitychange`,this.visibilityChanged),this.canvas.removeEventListener(`webglcontextlost`,this.onContextLost),this.canvas.removeEventListener(`webglcontextrestored`,this.onContextRestored)),this.batches.forEach(({mesh:e})=>e.dispose()),this.fits.dispose(),this.cameras.dispose(),this.assets.forEach(e=>e.parts.forEach(e=>e.motionTexture?.dispose())),this.retiredAssets.forEach(e=>e.parts.forEach(e=>e.motionTexture?.dispose())),this.geometries.forEach(e=>e.dispose()),this.materials.forEach(e=>e.dispose()),this.textures.forEach(e=>e.dispose()),this.occlusion.dispose(),this.depthTarget.dispose(),this.disabledShadow.dispose(),this.depthMaterials.forEach(e=>e.dispose()),this.colorTarget.dispose(),this.outputTarget?.dispose(),this.presentGeometry.dispose(),this.presentMaterial.dispose(),this.renderer.dispose(),this.host||this.renderer.forceContextLoss())}},Nd=new WeakMap,Pd=new Set,Fd,Id,Ld=0,Rd=!1,zd=!1,Bd,Vd=5e3,Hd=5e3,Ud=5e3,Wd=3e4,Gd=2,Kd=22,qd=72,Jd=new Set,Yd=!1,Xd=250,Zd=()=>typeof document<`u`&&document.hidden;function Qd(e,t){let n=e,r=Date.now(),i=!1,a,o=()=>{i||(i=!0,clearTimeout(a),Jd.delete(l))},s=()=>{i||Zd()||(r=Date.now(),a=setTimeout(c,Math.min(Xd,n)))},c=()=>{if(a=void 0,i||Zd())return;let e=Math.max(0,Date.now()-r);e<=500&&(n-=e),n<=0?(o(),t()):s()},l={visibilityChanged(){clearTimeout(a),a=void 0,s()}};return!Yd&&typeof document<`u`&&typeof document.addEventListener==`function`&&(document.addEventListener(`visibilitychange`,()=>{for(let e of Jd)e.visibilityChanged()}),Yd=!0),Jd.add(l),s(),o}var $d=`
struct Out { @builtin(position) position:vec4f, @location(0) uv:vec2f };
@group(0) @binding(0) var atlas:texture_2d<f32>;
@group(0) @binding(1) var linearSampler:sampler;
@group(0) @binding(2) var<uniform> rect:vec4f;
@vertex fn vertex(@builtin(vertex_index) i:u32)->Out {
  let positions=array<vec2f,3>(vec2f(-1,1),vec2f(-1,-3),vec2f(3,1));
  let uvs=array<vec2f,3>(vec2f(0,0),vec2f(0,2),vec2f(2,0));
  var output:Out;output.position=vec4f(positions[i],0,1);output.uv=uvs[i];return output;
}
@fragment fn fragment(input:Out)->@location(0) vec4f {
  // drawImage filters outside its source rectangle within the original image.
  // Clamp only at the atlas boundary, matching the existing presentation.
  return textureSample(atlas,linearSampler,rect.xy+input.uv*rect.zw);
}`,ef=e=>e instanceof Error?e:Error(String(e)),tf=e=>e.getContext(`webgpu`),nf=e=>{for(let t of[...Pd])try{e(t)}catch(e){queueMicrotask(()=>{throw e})}};function rf(e){!zd||Bd||Fd!==e||e.retired||(Bd=setTimeout(()=>{Bd=void 0,Fd===e&&!e.retired&&(zd=!1)},Wd))}function af(e,t){e.retired||(e.retired=!0,Fd===e&&(Fd=void 0),clearTimeout(Bd),Bd=void 0,Rd=!1,Ld=Date.now()+Ud,nf(e=>e.failed(t)),e.device.destroy())}function of(e,t){e.retired||(e.retired=!0,Fd===e&&(Fd=void 0),clearTimeout(Bd),Bd=void 0,e.device.destroy(),Pd.size&&(zd?(Ld=Date.now()+Ud,nf(e=>e.failed(t))):(zd=!0,Rd=!0,nf(e=>e.recovering()),Ld=0,cf().then(e=>{Rd=!1,nf(e?t=>t.restored(e):e=>e.failed(t))}))))}async function sf(){let e=globalThis.navigator?.gpu;if(!e||typeof document>`u`)return null;let t=!1,n,r,i=new Promise(e=>{r=Qd(Vd,()=>{t=!0,n?.destroy(),e(null)})}),a=(async()=>{try{let r=await e.requestAdapter();if(!r||r.info?.isFallbackAdapter===!0||t)return null;if(n=await r.requestDevice(),t)return n.destroy(),null;let i=e.getPreferredCanvasFormat();n.pushErrorScope(`validation`);let a=n.createShaderModule({code:$d}),o=await n.createRenderPipelineAsync({layout:`auto`,vertex:{module:a,entryPoint:`vertex`},fragment:{module:a,entryPoint:`fragment`,targets:[{format:i}]},primitive:{topology:`triangle-list`}});if(t)return n.destroy(),null;let s=document.createElement(`canvas`);s.width=s.height=1;let c=tf(s);if(!c)throw Error(`WebGPU canvas unavailable`);c.configure({device:n,format:i,alphaMode:`premultiplied`,colorSpace:`srgb`}),c.unconfigure();let l=await n.popErrorScope();if(l||t)throw l??Error(`WebGPU initialization expired`);let u={device:n,pipeline:o,sampler:n.createSampler({minFilter:`linear`,magFilter:`linear`}),format:i,retired:!1};return n.addEventListener(`uncapturederror`,e=>af(u,ef(e.error))),n.lost.then(e=>of(u,Error(e.message||`WebGPU device lost`))),u}catch{return n?.destroy(),null}})(),o=await Promise.race([a,i]);return r?.(),o}function cf(){return Fd&&!Fd.retired?Promise.resolve(Fd):Id||(Date.now()<Ld?Promise.resolve(null):(Id=sf().then(e=>(e&&!e.retired?Fd=e:Ld=Date.now()+Ud,e?.retired?null:e)).finally(()=>{Id=void 0}),Id))}async function lf(e,t){let n=await cf();if(!n||n.retired)return null;let r=!1,i=Rd,a=!1,o,s=0,c=0,l=new Set,u=new Set,d=()=>{for(let e of[...u])e.finish(!1)},f=()=>{let e=o;o=void 0,s=c=0;let t=[];for(let e of l)e.buffer&&t.push(e.buffer),e.buffer=e.binding=e.atlas=e.rect=void 0;e?.destroy();for(let e of t)e.destroy()},p=t=>{r||a||(a=!0,i=!0,d(),f(),e(t))},m={recovering(){r||a||(i=!0,d(),f(),t?.(!0))},restored(e){r||a||(n=e,i=!1,t?.(!1))},failed:p};Pd.add(m);let h={backend:`webgpu`,get maxTextureDimension2D(){return n.device.limits.maxTextureDimension2D},attach(e){if(r||a)return null;let t=Nd.get(e);if(t?.owner?.active)return null;if(!t){let r=Math.min(globalThis.devicePixelRatio||1,2),i=n.device.limits.maxTextureDimension2D;if(Math.round(e.clientWidth*r)>i||Math.round(e.clientHeight*r)>i)return null;let a=tf(e);if(!a)return null;t={context:a},Nd.set(e,t)}let i={canvas:e,state:t,active:!0};return t.owner=i,l.add(i),i},present(e,t){if(r||a||i||n.retired)return Promise.resolve(!1);if(u.size>=Gd)return Promise.reject(Error(`WebGPU presentation capacity exceeded`));if(!t.length)return Promise.resolve(!0);let d=n,f=d.device.limits.maxTextureDimension2D;try{if(!(e.width>0&&e.height>0&&e.width<=f&&e.height<=f))throw Error(`WebGPU atlas dimensions exceed device limits`);let i=e.width,p=e.height,m=0,h=0;for(let n of t){let t=n.target;if(!l.has(t)||!t.active)throw Error(`WebGPU target is not attached`);if(![n.destinationWidth,n.destinationHeight].every(e=>Number.isInteger(e)&&e>0&&e<=f))throw Error(`WebGPU destination dimensions exceed device limits`);if(![n.sourceX,n.sourceY,n.sourceWidth,n.sourceHeight].every(Number.isFinite)||n.sourceX<0||n.sourceY<0||n.sourceWidth<=0||n.sourceHeight<=0||n.sourceX+n.sourceWidth>e.width||n.sourceY+n.sourceHeight>e.height)throw Error(`Invalid WebGPU source rectangle`);i=Math.min(i,n.sourceX),p=Math.min(p,n.sourceY),m=Math.max(m,n.sourceX+n.sourceWidth),h=Math.max(h,n.sourceY+n.sourceHeight)}if(!o||s!==e.width||c!==e.height){let t=o;s=e.width,c=e.height,o=d.device.createTexture({size:[s,c],format:`rgba8unorm`,usage:Kd}),t?.destroy()}let g=Math.max(0,Math.floor(i)-1),_=Math.max(0,Math.floor(p)-1),v=Math.min(e.width,Math.ceil(m)+1),y=Math.min(e.height,Math.ceil(h)+1);d.device.queue.copyExternalImageToTexture({source:e,origin:{x:g,y:_}},{texture:o,origin:{x:g,y:_},premultipliedAlpha:!0,colorSpace:`srgb`},[v-g,y-_]);let b=d.device.createCommandEncoder();for(let n of t){let t=n.target,{canvas:r,state:i}=t;r.width!==n.destinationWidth&&(r.width=n.destinationWidth),r.height!==n.destinationHeight&&(r.height=n.destinationHeight),i.configured!==d&&(i.context.configure({device:d.device,format:d.format,alphaMode:`premultiplied`,colorSpace:`srgb`}),i.configured=d),t.buffer||=d.device.createBuffer({size:16,usage:qd});let a=n.sourceX/e.width,s=n.sourceY/e.height,c=n.sourceWidth/e.width,l=n.sourceHeight/e.height,u=t.rect;u&&u[0]===a&&u[1]===s&&u[2]===c&&u[3]===l||(t.rect=[a,s,c,l],d.device.queue.writeBuffer(t.buffer,0,new Float32Array(t.rect))),t.binding&&t.atlas===o||(t.binding=d.device.createBindGroup({layout:d.pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:o.createView()},{binding:1,resource:d.sampler},{binding:2,resource:{buffer:t.buffer}}]}),t.atlas=o);let f=b.beginRenderPass({colorAttachments:[{view:i.context.getCurrentTexture().createView(),loadOp:`clear`,storeOp:`store`,clearValue:{r:0,g:0,b:0,a:0}}]});f.setPipeline(d.pipeline),f.setBindGroup(0,t.binding),f.draw(3),f.end()}d.device.queue.submit([b.finish()]);let x,S=!1,C,w=new Promise(e=>{x=e}),T=d.device.queue.onSubmittedWorkDone(),E={finish(e){S||(S=!0,u.delete(E),x(e))}};return u.add(E),C=Qd(Hd,()=>{of(d,Error(`WebGPU presentation timed out`)),E.finish(!1)}),T.then(()=>{C?.();let e=!r&&!a&&!d.retired&&n===d;e&&rf(d),E.finish(e)},e=>{C?.(),of(d,ef(e)),E.finish(!1)}),w}catch(e){return p(ef(e)),Promise.resolve(!1)}},release(e){let t=e;if(!l.delete(t))return;t.active=!1,t.state.owner===t&&(t.state.owner=void 0);let n=t.buffer;t.buffer=t.binding=t.atlas=t.rect=void 0,n?.destroy()},dispose(){if(!r){r=!0,Pd.delete(m);for(let e of[...l])h.release(e);f(),d()}}};return i&&t?.(!0),h}function uf(){let e=document.createElement(`canvas`),t=e.getContext(`2d`,{willReadFrequently:!0});if(!t)throw Error(`Avatar CPU presentation canvas unavailable`);let n=Array.from({length:2},()=>({busy:!1,bytes:new Uint8Array,read:void 0})),r=!1,i=0,a,o=Promise.resolve(!0);return{backend:`pbo`,present(s,c){if(r||!c.length)return Promise.resolve(!1);let l=n.find(e=>!e.busy);if(!l)throw Error(`Avatar CPU presentation capacity exceeded`);let u=Math.max(0,Math.floor(Math.min(...c.map(e=>e.sourceX)))-1),d=Math.max(0,Math.floor(Math.min(...c.map(e=>e.sourceY)))-1),f=Math.min(s.width,Math.ceil(Math.max(...c.map(e=>e.sourceX+e.sourceWidth)))+1),p=Math.min(s.height,Math.ceil(Math.max(...c.map(e=>e.sourceY+e.sourceHeight)))+1),m=f-u,h=p-d,g=s.getContext(`webgl2`);if(!g)throw Error(`Avatar presentation context unavailable`);l.busy=!0,l.bytes.length!==m*h*4&&(l.bytes=new Uint8Array(m*h*4));let _=Gc(g,null,u,s.height-p,m,h,3e4,l.bytes);l.read=_;let v=o,y=i,b=_.promise.then(async n=>{if(await v,r||i!==y||document.hidden)return!1;(e.width!==s.width||e.height!==s.height)&&(e.width=s.width,e.height=s.height),a&&a.width===m&&a.height===h||(a=new ImageData(m,h));let o=a.data;for(let e=0;e<h;e++){let t=(h-e-1)*m*4,r=e*m*4;for(let e=0;e<m;e++,t+=4,r+=4){let e=n[t+3];if(o[r+3]=e,e===255)o[r]=n[t],o[r+1]=n[t+1],o[r+2]=n[t+2];else if(e===0)o[r]=o[r+1]=o[r+2]=0;else{let i=255/e;o[r]=Math.round(n[t]*i),o[r+1]=Math.round(n[t+1]*i),o[r+2]=Math.round(n[t+2]*i)}}}t.putImageData(a,u,d);let l=!1;for(let t of c)t.isCurrent()&&(l=!0,t.context.clearRect(0,0,t.destinationWidth,t.destinationHeight),t.context.drawImage(e,t.sourceX,t.sourceY,t.sourceWidth,t.sourceHeight,0,0,t.destinationWidth,t.destinationHeight),t.onPresented?.());return l}).catch(e=>{if(r||i!==y||document.hidden||g.isContextLost())return!1;throw e}).finally(()=>{l.busy=!1,l.read=void 0});return o=b.catch(()=>!1),b},cancelPending(){i++;for(let e of n)e.read?.cancel()},dispose(){if(!r){r=!0,i++;for(let e of n)e.read?.cancel(),e.bytes=new Uint8Array;a=void 0,e.width=e.height=0}}}}function df(e,t,n={}){let r=null,i=t=>{let n=e.getBoundingClientRect();return[t.clientX-n.left,t.clientY-n.top]},a=a=>{if(r||a.button!==0||!a.isPrimary)return;let o=i(a),s=n.enabled===!1?t.hitTest(...o):t.beginPointer(...o);s!==null&&(n.onSelect?.(s),n.enabled!==!1&&(r={id:a.pointerId,index:s,x:a.clientX,y:a.clientY,dragged:!1},e.setPointerCapture(a.pointerId)))},o=e=>{n.enabled===!1||r&&r.id!==e.pointerId||(r&&(r.dragged||=Math.hypot(e.clientX-r.x,e.clientY-r.y)>=6),t.point(...i(e)))},s=a=>{if(!r||a&&r.id!==a.pointerId)return;let o=r;r=null,a?.type===`pointerup`?t.endPointer(...i(a)):(t.endPointer(),t.point(-1,-1)),e.hasPointerCapture(o.id)&&e.releasePointerCapture(o.id),a?.type===`pointerup`&&!o.dragged&&Math.hypot(a.clientX-o.x,a.clientY-o.y)<6&&n.onTap?.(o.index)},c=()=>{s(),t.point(-1,-1)},l=()=>{!r&&n.enabled!==!1&&t.point(-1,-1)};return e.addEventListener(`pointerdown`,a),e.addEventListener(`pointermove`,o),e.addEventListener(`pointerup`,s),e.addEventListener(`pointercancel`,s),e.addEventListener(`lostpointercapture`,s),e.addEventListener(`pointerleave`,l),window.addEventListener(`blur`,c),()=>{e.removeEventListener(`pointerdown`,a),e.removeEventListener(`pointermove`,o),e.removeEventListener(`pointerup`,s),e.removeEventListener(`pointercancel`,s),e.removeEventListener(`lostpointercapture`,s),e.removeEventListener(`pointerleave`,l),window.removeEventListener(`blur`,c),s(),l()}}var ff=e=>{throw Error(`Avatar catalog: ${e}`)},$=(e,t)=>(e.min[t]+e.max[t])/2,pf=e=>({min:[0,1,2].map(t=>Math.min(...e.map(e=>e.bounds.min[t]))),max:[0,1,2].map(t=>Math.max(...e.map(e=>e.bounds.max[t])))}),mf=e=>e.pieces.filter(e=>e.category===`eyes`&&e.attachment!==`brows`&&!e.fur);function hf(e){let t=mf(e),n=[-1,1].map(e=>t.filter(t=>Math.sign($(t.bounds,0))===e));return n.some(e=>!e.length)&&ff(`catalog face anchors missing`),n.map(pf)}function gf(e,t,n){let r=e.body.geometry.getAttribute(`position`),i=e.body.geometry.getIndex();if(!i)return-1/0;let a=-1/0;for(let e=0;e<i.count;e+=3){let[o,s,c]=[0,1,2].map(t=>{let n=i.getX(e+t);return[r.getX(n),r.getY(n),r.getZ(n)]}),l=(s[1]-c[1])*(o[0]-c[0])+(c[0]-s[0])*(o[1]-c[1]);if(Math.abs(l)<1e-12)continue;let u=((s[1]-c[1])*(t-c[0])+(c[0]-s[0])*(n-c[1]))/l,d=((c[1]-o[1])*(t-c[0])+(o[0]-c[0])*(n-c[1]))/l,f=1-u-d;Math.min(u,d,f)>=-1e-6&&(a=Math.max(a,u*o[2]+d*s[2]+f*c[2]))}return a}function _f(e,t,n,r,{singleEye:i=!1,faceLayout:a,tuftLayout:o}={}){let s=n===`eyes`?mf(t):t.pieces.filter(e=>e.category===n&&e.selection===r&&!e.fur);s.length||ff(`missing catalog ${n}:${r}`);let c=e=>e.body.bounds.max[0]-e.body.bounds.min[0];if(n===`eyes`||n===`eyewear`){let o=i?pf(mf(e)):null,l=o?r===`monocle`?[o,o]:[0,1].map(e=>({min:o.min.map((t,n)=>n===0&&e===1?$(o,0):t),max:o.max.map((t,n)=>n===0&&e===0?$(o,0):t)})):n===`eyes`&&a?a.centers.map(e=>{let[t,n,r]=e;return{min:[t-a.radius,n-a.radius,r],max:[t+a.radius,n+a.radius,r+a.radius]}}):hf(e),u=hf(t),d=e=>Math.abs($(e[1],0)-$(e[0],0)),f=e.body.attachment===`metal`||e.body.label===`metal`,p=n===`eyes`?a?a.radius/(u.reduce((e,t)=>e+Math.max(t.max[0]-t.min[0],t.max[1]-t.min[1])/2,0)/2):f?1:Math.max(.65,Math.min(1.2,c(e)/c(t))):Math.max(.25,Math.min(2,d(l)/d(u)));if(n===`eyes`){let t=l.map(t=>gf(e,$(t,0),$(t,1)));return s.map(e=>{let n=$(e.bounds,0)<0?0:1,r=[0,1,2].map(e=>$(u[n],e)),i=[0,1].map(e=>$(l[n],e)-r[e]),a=(u[n].max[2]-u[n].min[2])*p,o=t[n],s=Math.max(l[n].min[2],o-a*.35);return i.push(s-(u[n].min[2]-r[2])*p-r[2]),{part:e,scale:p,origin:r,translate:i}})}let m=[0,1,2].map(e=>($(u[0],e)+$(u[1],e))/2),h=[0,1,2].map(e=>($(l[0],e)+$(l[1],e))/2),g=[0,1].map(e=>s.filter(t=>Math.abs($(t.bounds,0)-m[0])>d(u)*.15&&($(t.bounds,0)<m[0]?0:1)===e)).map(e=>{if(!e.length)return null;let t=Math.max(...e.map(e=>e.bounds.max[2]));return pf(e.filter(e=>e.bounds.max[2]>t-.05))}),_=g.filter(e=>e!==null),v=_.length?Math.min(..._.map(e=>e.min[2])):Math.max(...s.map(e=>e.bounds.max[2]))-.05,y=_.length?p:Math.max(.25,Math.min(2,(Math.max(...l.map(e=>e.max[0]))-Math.min(...l.map(e=>e.min[0])))*1.18/(Math.max(...s.map(e=>e.bounds.max[0]))-Math.min(...s.map(e=>e.bounds.min[0])))));return s.map(e=>{let t=$(e.bounds,0)-m[0];if(Math.abs(t)<=d(u)*.15)return{part:e,scale:y,origin:m,translate:h.map((e,t)=>t===2?Math.max(...l.map(e=>e.max[2]))+.012-((v-m[2])*y+m[2]):e-m[t])};let n=t<0?0:1,a=g[n],o=Math.min(i&&r===`monocle`?4:2,Math.max(Math.min(p,1.2),(l[n].max[0]-l[n].min[0])*1.08/(a.max[0]-a.min[0]))),s=[0,1,2].map(e=>$(u[n],e)),c=[0,1].map(e=>$(l[n],e)-s[e]);return c.push(l[n].max[2]+.012-((a.min[2]-s[2])*o+s[2])),{part:e,scale:o,origin:s,translate:c}})}n!==`accessory`&&ff(`unknown catalog fitting category`);let l=e.body.attachment===`metal`||e.body.label===`metal`,u=(l?.56:Math.max(.35,Math.min(1.5,c(e)/c(t))))*(r===`three_lobe`?o?.scale??1:1),d=[$(t.body.bounds,0),t.body.bounds.max[1],$(t.body.bounds,2)],f=[l?.02:$(e.body.bounds,0),e.body.bounds.max[1],l?0:$(e.body.bounds,2)];if(r===`bow`){let n=hf(t),r=hf(e);for(let e=0;e<2;e++)d[e]=($(n[0],e)+$(n[1],e))/2,f[e]=($(r[0],e)+$(r[1],e))/2}let p=f.map((e,t)=>e-d[t]);if(r===`three_lobe`&&o){let e=s[0].attachmentPivot;e||ff(`missing tuft attachment anchor`);let n=bf(t.body,e);return s.map(e=>({part:e,scale:u,origin:n,translate:p,rotationZ:o.rotationZ}))}return s.map(e=>({part:e,scale:u,origin:d,translate:p}))}function vf({scale:e,rotationZ:t=0,origin:n,translate:r}){if(t===0)return new Y().makeScale(e,e,e).setPosition(...n.map((t,n)=>t*(1-e)+r[n]));let i=new Y().makeRotationZ(t).scale(new K(e,e,e)),a=new K().fromArray(n).applyMatrix4(i).negate().add(new K().fromArray(n)).add(new K().fromArray(r));return i.setPosition(a)}function yf(e,t){let{scale:n,origin:r,translate:i,rotationZ:a=0}=t;(!Number.isFinite(n)||n<=0||n>8||!Number.isFinite(a)||[...r,...i].some(e=>!Number.isFinite(e)))&&ff(`invalid part transform`),a!==0&&(e.attachment!==`three_lobe`||e.universal===!0)&&ff(`rotation currently requires a FELIPE Tuft material`);let o=Math.cos(a),s=Math.sin(a),c=e=>a===0?e.map((e,t)=>Math.fround((e-r[t])*n+r[t]+i[t])):[Math.fround(o*(e[0]-r[0])*n-s*(e[1]-r[1])*n+r[0]+i[0]),Math.fround(s*(e[0]-r[0])*n+o*(e[1]-r[1])*n+r[1]+i[1]),Math.fround((e[2]-r[2])*n+r[2]+i[2])],l=e.geometry.clone(),u=l.getAttribute(`position`);for(let e=0;e<u.count;e++)u.setXYZ(e,...c([u.getX(e),u.getY(e),u.getZ(e)]));if(!e.fur&&(n!==1||a!==0))for(let e of[`delta0`,`delta1`]){let t=l.getAttribute(e);if(t)for(let e=0;e<t.count;e++)t.setXYZ(e,Math.fround((a===0?t.getX(e):o*t.getX(e)-s*t.getY(e))*n),Math.fround((a===0?t.getY(e):s*t.getX(e)+o*t.getY(e))*n),Math.fround(t.getZ(e)*n))}if(a!==0){for(let t of e.fur?[`normal`,`normal0`,`delta1`]:[`normal`,`normal0`,`normal1`]){let e=l.getAttribute(t);if(e)for(let t=0;t<e.count;t++){let n=e.getX(t),r=e.getY(t);e.setXYZ(t,o*n-s*r,s*n+o*r,e.getZ(t))}}let t=l.getAttribute(`paletteGeometry`);if(!e.fur&&t)for(let e=0;e<t.count;e++){let n=t.getY(e),r=t.getZ(e);t.setY(e,o*n-s*r),t.setZ(e,s*n+o*r)}l.computeBoundingBox(),l.computeBoundingSphere()}let d=Object.fromEntries(Object.entries(e.fields).map(([e,t])=>[e,[...t]])),f=d.paletteBounds;if(f&&(f[2]||f[3])){let e=c([f[0],f[1],0]);f[0]=e[0],f[1]=e[1],f[2]=Math.fround(f[2]/n),f[3]=Math.fround(f[3]/n)}return{...e,geometry:l,fields:d,bounds:a===0?{min:c(e.bounds.min),max:c(e.bounds.max)}:{min:l.boundingBox.min.toArray(),max:l.boundingBox.max.toArray()},pivot:c(e.pivot),attachmentPivot:e.attachmentPivot?c(e.attachmentPivot):e.attachmentPivot}}function bf(e,t){let n=e.geometry.getAttribute(`position`),r=e.geometry.getIndex();r||ff(`body attachment surface has no triangles`);let i=new Kn,a=new K().fromArray(t),o=new K,s=new K,c=1/0;for(let e=0;e<r.count;e+=3){i.a.fromBufferAttribute(n,r.getX(e)),i.b.fromBufferAttribute(n,r.getX(e+1)),i.c.fromBufferAttribute(n,r.getX(e+2)),i.closestPointToPoint(a,o);let t=o.distanceToSquared(a);t<c&&(c=t,s.copy(o))}return Number.isFinite(c)||ff(`empty body attachment surface`),s.toArray()}function xf(e,t,n,r){let i=e.geometry.getAttribute(`position`),a=e.geometry.getIndex(),o=r?-1/0:1/0;if(!a)return o;for(let e=0;e<a.count;e+=3){let s=a.getX(e),c=a.getX(e+1),l=a.getX(e+2),u=i.getX(s),d=i.getZ(s),f=i.getX(c),p=i.getZ(c),m=i.getX(l),h=i.getZ(l),g=(p-h)*(u-m)+(m-f)*(d-h);if(Math.abs(g)<1e-12)continue;let _=((p-h)*(t-m)+(m-f)*(n-h))/g,v=((h-d)*(t-m)+(u-m)*(n-h))/g,y=1-_-v;if(Math.min(_,v,y)<-1e-7)continue;let b=_*i.getY(s)+v*i.getY(c)+y*i.getY(l);o=r?Math.max(o,b):Math.min(o,b)}return o}function Sf(e,t){let n=t[0],r=(e,t)=>(e-n.origin[t])*n.scale+n.origin[t]+n.translate[t],i=pf(t.map(e=>({bounds:e.part.bounds}))),a=[0,2].map(t=>Math.max(e.body.bounds.min[t],r(i.min[t],t))),o=[0,2].map(t=>Math.min(e.body.bounds.max[t],r(i.max[t],t))),s=-1/0,c,l=(i,a)=>{let o=xf(e.body,i,a,!0),l=(i-n.origin[0]-n.translate[0])/n.scale+n.origin[0],u=(a-n.origin[2]-n.translate[2])/n.scale+n.origin[2],d=Math.min(...t.map(e=>xf(e.part,l,u,!1))),f=o-r(d,1);Number.isFinite(f)&&f>s&&(s=f,c=[i,o,a])};for(let e=0;e<=12;e++)for(let t=0;t<=12;t++)l(a[0]+(o[0]-a[0])*e/12,a[1]+(o[1]-a[1])*t/12);let u=e.body.geometry.getAttribute(`position`);for(let e=0;e<u.count;e+=Math.max(1,Math.floor(u.count/128)))l(u.getX(e),u.getZ(e));return c?{shift:s,root:c}:void 0}function Cf(e,t,n,r,i){if(!n.length)return n;let a=n[0],o=r===`bow`?a.part.pivot:a.part.attachmentPivot;o||ff(`missing ${r} attachment anchor`);let s=e=>{let t=e.map((e,t)=>(e-a.origin[t])*a.scale),n=a.rotationZ??0,r=Math.cos(n),i=Math.sin(n);return[t[0]*r-t[1]*i,t[0]*i+t[1]*r,t[2]].map((e,t)=>e+a.origin[t]+a.translate[t])},c,l,u=[`felipe_beret`,`beret`,`beanie`,`hat`,`crown`].includes(r)?Sf(e,n):void 0;if(u){let r=Sf(t,n.map(({part:e})=>({part:e,scale:1,origin:[0,0,0],translate:[0,0,0]})));c=[0,u.shift-Math.max(0,r?.shift??0)*a.scale-(e.body.bounds.max[1]-e.body.bounds.min[1])*.004,0],l=u.root}else if(r===`headphones`){let n=[0,1,2].map(e=>$(t.body.bounds,e)),r=[0,1,2].map(t=>$(e.body.bounds,t)),i=s(n);c=r.map((e,t)=>e-i[t]),l=r}else{let n=s(bf(t.body,o)),u=r===`three_lobe`?[i?$(e.body.bounds,0)+(e.body.bounds.max[0]-e.body.bounds.min[0])*i.x:n[0],e.body.bounds.max[1]+(a.part.bounds.max[1]-a.part.bounds.min[1])*a.scale*.5,n[2]]:n;l=bf(e.body,u),c=l.map((e,t)=>e-n[t])}return n.map(t=>{let n=t.translate.map((e,t)=>e+c[t]),i=r===`headphones`?bf(e.body,s(t.part.attachmentPivot).map((e,t)=>e+c[t])):l;return{...t,translate:n,attachmentRoot:i}})}var wf=(e,t,n,r,i,a)=>({eyes:{size:e,spread:t,rise:n},tuft:{x:r,scale:i,rotationZ:a*Math.PI/180}}),Tf={circle:wf(1.45,1.55,.015,.06,.95,-15),rounded_triangle:wf(1.3,1.4,-.025,.04,.8,-28),capsule:wf(1.3,1.65,0,-.3,1.05,24),slender:wf(1.25,1.12,.065,-.06,.9,10),pocket:wf(1.1,1.4,.03,.24,.85,-30),petal:wf(1.05,1.15,.015,-.2,.88,22),squircle:wf(1.15,1.4,.035,-.28,1.05,22),rounded_head_two_ears:{...wf(1.28,1,0,.28,.75,-30),singleEyeRise:-.14},circle_two_ears:wf(1.65,1.7,.025,.22,.65,-38),six_lobed_flower:wf(1.05,1.18,0,-.09,.88,10),heart:wf(1.4,1.6,.005,.27,.85,-32),four_lobed_butterfly:wf(1.4,1.45,.015,-.28,.85,24),twelve_scalloped_rosette:wf(1.25,1.4,.005,.12,.85,-20),rounded_cube:wf(1.5,1.65,.015,-.24,.92,20),rounded_diamond:wf(1.35,1.55,-.025,.08,.78,-28),star:wf(1.15,1.2,.045,.015,.7,-15),cloud:wf(1.1,1.55,-.01,.25,.82,-32),shield:wf(1.15,1.2,.035,-.18,.78,25),pebble:wf(1.1,1.25,.02,.15,.9,-35),clippo:wf(1,1,0,.015,1.05,-18)};function Ef(e){let t=Tf[e===`todd`?`rounded_head_two_ears`:e];if(!t)throw Error(`Missing avatar layout: ${e}`);return t}function Df(e,t,n=!1){if(t===`clippo`)return e.face;let r=Ef(t),{size:i,spread:a}=r.eyes,o=r.eyes.rise+(n?r.singleEyeRise??0:0),s=e.face.radius*i,c=(e.face.centers[0][0]+e.face.centers[1][0])/2,l=e.body.bounds.max[1]-e.body.bounds.min[1];return{radius:s,centers:e.face.centers.map(([n,r])=>{let i=c+(n-c)*a,u=r+l*o,d=gf(e,i,u);if(!Number.isFinite(d))throw Error(`Eye layout misses body surface: ${t}`);return[i,u,d-s*.3]})}}function Of(e,t){let[n,r]=e.pieces.filter(e=>!e.fur&&e.category===`eyes`);if(!n||!r)throw Error(`Missing Cyclops source eye`);let i=e=>e.bounds.min.map((t,n)=>(t+e.bounds.max[n])/2),a=t.radius*2,o=[0,1].map(e=>(t.centers[0][e]+t.centers[1][e])/2).concat(Math.max(...t.centers.map(e=>e[2]))+t.radius*.5),s=(e,t,n)=>{let r=i(e);return yf(e,{origin:r,scale:t,translate:n.map((e,t)=>e-r[t])})},c=[s(n,a*2/(n.bounds.max[0]-n.bounds.min[0]),o)],l=i(r),u=c[0].bounds.max[2];for(let[e,[t,n,i]]of[[.57,0,0],[.53,0,0],[.275,0,0],[.065,-.19,.23]].entries()){let d=a*t*2/(r.bounds.max[0]-r.bounds.min[0]),f=[o[0]+n*a,o[1]+i*a,u+.006-(r.bounds.max[2]-l[2])*d],p=s(r,d,f);if(e===1){let e=p.geometry.getAttribute(`position`);for(let t=0;t<e.count;t++){let n=Math.atan2(e.getY(t)-f[1],e.getX(t)-f[0]),r=.2*Math.sin(n*53)+.09*Math.sin(n*91);for(let e of[`normal`,`normal0`,`normal1`,`paletteGeometry`]){let i=p.geometry.getAttribute(e),a=+(e===`paletteGeometry`),o=[i.getComponent(t,a)+Math.cos(n)*r,i.getComponent(t,a+1)+Math.sin(n)*r,i.getComponent(t,a+2)],s=Math.hypot(...o);s>1e-8&&o.forEach((e,n)=>i.setComponent(t,a+n,e/s))}}}c.push(p),u=p.bounds.max[2]}return c}function kf(e,t,n){let r=e.body.attachment===`metal`||e.body.label===`metal`,i=r?e:t,a=i.pieces.filter(e=>e.category===`eyes`&&!e.fur);if(a.length!==6)throw Error(`Clippo requires two eyes, two pupils and two brows`);if(r)return a.map(e=>({donor:i,placement:{part:e,scale:1,origin:[0,0,0],translate:[0,0,0]}}));if(n?.kind!==`clippo-face`||n.eyes.length!==2)throw Error(`Missing Clippo construction anchors`);let o=e.face;if(!(o.radius>0)||o.centers.length!==2)throw Error(`Missing target Clippo face layout`);let s=o.radius/.21;return a.map(e=>{let r=(e.bounds.min[0]+e.bounds.max[0])/2<0?0:1,i=n.eyes[r];if(!(i.eyeScale>0)||i.center.length!==3)throw Error(`Invalid Clippo source eye scale`);let a=o.centers[r].map((e,t)=>e+(t===2?.14*s:0));return{donor:t,placement:{part:e,scale:s/i.eyeScale,origin:i.center,translate:a.map((e,t)=>e-i.center[t])}}})}function Af(e){let t=Math.fround;return[...[0,1].map(n=>t(t(e.min[n]+e.max[n])*.5)),...[0,1].map(n=>t(t(t(t(e.max[n]-e.min[n])*.5)*t(n?1.1:1.16))+t(.008)))]}var jf=new URL(`../assets/geometry-BTFa17wc.bin`,import.meta.url).href,Mf=new URL(`../assets/geometry-OwRO3lfs.json`,import.meta.url).href,Nf=new URL(`../assets/material-CWbv_tbJ.json`,import.meta.url).href,Pf=new URL(`../assets/geometry-WoKw8CFo.bin`,import.meta.url).href,Ff=new URL(`../assets/geometry-DXSwvN0_.json`,import.meta.url).href,If=new URL(`../assets/material-CXKfD_Dd.json`,import.meta.url).href,Lf=new URL(`../assets/geometry-Dv6FfOeJ.bin`,import.meta.url).href,Rf=new URL(`../assets/geometry-DzNZ-Mt3.json`,import.meta.url).href,zf=new URL(`../assets/material-BFI-3LHv.json`,import.meta.url).href,Bf=new URL(`../assets/geometry-B4ElBbg3.bin`,import.meta.url).href,Vf=new URL(`../assets/geometry-BqhQRk1W.json`,import.meta.url).href,Hf=new URL(`../assets/material-BVRQKC7I.json`,import.meta.url).href,Uf=new URL(`../assets/geometry-HrE6xacc.bin`,import.meta.url).href,Wf=new URL(`../assets/geometry-BL75SZM_.json`,import.meta.url).href,Gf=new URL(`../assets/material-DfSqePut.json`,import.meta.url).href,Kf=new URL(`../assets/geometry-t60HcdL1.bin`,import.meta.url).href,qf=new URL(`../assets/geometry-DEbVqYnX.json`,import.meta.url).href,Jf=new URL(`../assets/material-R4facdQH.json`,import.meta.url).href,Yf=new URL(`../assets/geometry-DjOuGBLx.bin`,import.meta.url).href,Xf=new URL(`../assets/geometry-BjeeHY8_.json`,import.meta.url).href,Zf=new URL(`../assets/material-LTv2F1Vo.json`,import.meta.url).href,Qf=new URL(`../assets/geometry-KkiZzq02.bin`,import.meta.url).href,$f=new URL(`../assets/geometry-DKzkp4Jj.json`,import.meta.url).href,ep=new URL(`../assets/material-DiVOB9ms.json`,import.meta.url).href,tp=new URL(`../assets/geometry-C8mRYEXR.bin`,import.meta.url).href,np=new URL(`../assets/geometry-izH6aKKy.json`,import.meta.url).href,rp=new URL(`../assets/material-BoaEMhW2.json`,import.meta.url).href,ip=new URL(`../assets/geometry-CO6mKd2l.bin`,import.meta.url).href,ap=new URL(`../assets/geometry-DmeKCdAi.json`,import.meta.url).href,op=new URL(`../assets/material-19-_S_wi.json`,import.meta.url).href,sp=new URL(`../assets/geometry-CUk83oaL.bin`,import.meta.url).href,cp=new URL(`../assets/geometry-DvRcqPwe.json`,import.meta.url).href,lp=new URL(`../assets/material-CmyfCZYK.json`,import.meta.url).href,up=new URL(`../assets/geometry-BLkOFRHM.bin`,import.meta.url).href,dp=new URL(`../assets/geometry-ByWVyM3q.json`,import.meta.url).href,fp=new URL(`../assets/material-srTN7chL.json`,import.meta.url).href,pp=new URL(`../assets/geometry-S-S5dyBW.bin`,import.meta.url).href,mp=new URL(`../assets/geometry-DOdbnlJm.json`,import.meta.url).href,hp=new URL(`../assets/material-kSAVIxbx.json`,import.meta.url).href,gp=new URL(`../assets/geometry-BlM7WBLk.bin`,import.meta.url).href,_p=new URL(`../assets/geometry-Dipwd9su.json`,import.meta.url).href,vp=new URL(`../assets/material-DaNSvDOI.json`,import.meta.url).href,yp=new URL(`../assets/geometry-DDYIC6aS.bin`,import.meta.url).href,bp=new URL(`../assets/geometry-BUrN-K_g.json`,import.meta.url).href,xp=new URL(`../assets/material-6raYOKQ_.json`,import.meta.url).href,Sp=new URL(`../assets/geometry-D34g7-N1.bin`,import.meta.url).href,Cp=new URL(`../assets/geometry-C_l60Ao3.json`,import.meta.url).href,wp=new URL(`../assets/material-CWtgq7Jt.json`,import.meta.url).href,Tp=new URL(`../assets/geometry-xGrmeeG4.bin`,import.meta.url).href,Ep=new URL(`../assets/geometry-CLSmQmoi.json`,import.meta.url).href,Dp=new URL(`../assets/material-CQ6_IPcI.json`,import.meta.url).href,Op=new URL(`../assets/geometry-Dy1TW2PB.bin`,import.meta.url).href,kp=new URL(`../assets/geometry-BxnJV3QV.json`,import.meta.url).href,Ap=new URL(`../assets/material-DWyWg7oh.json`,import.meta.url).href,jp=new URL(`../assets/geometry-DtrwGhZn.bin`,import.meta.url).href,Mp=new URL(`../assets/geometry-uYIBU3ov.json`,import.meta.url).href,Np=new URL(`../assets/material-DTaAF6ek.json`,import.meta.url).href,Pp=new URL(`../assets/geometry-DhPPTBok.bin`,import.meta.url).href,Fp=new URL(`../assets/geometry-YgBg_ld2.json`,import.meta.url).href,Ip=new URL(`../assets/material-CXrCte2w.json`,import.meta.url).href,Lp=new URL(`../assets/geometry-DOHj_FT2.bin`,import.meta.url).href,Rp=new URL(`../assets/geometry-CPonTa4R.json`,import.meta.url).href,zp=new URL(`../assets/material-Pza9ndlv.json`,import.meta.url).href,Bp=new URL(`../assets/geometry-Bz_GAoyM.bin`,import.meta.url).href,Vp=new URL(`../assets/geometry-G9MJMq4p.json`,import.meta.url).href,Hp=new URL(`../assets/material-JmNDC229.json`,import.meta.url).href,Up=new URL(`../assets/geometry-DDYIC6aS.bin`,import.meta.url).href,Wp=new URL(`../assets/geometry-Cp4M6i7D.json`,import.meta.url).href,Gp=new URL(`../assets/material-OZX_63TY.json`,import.meta.url).href,Kp=new URL(`../assets/geometry-D34g7-N1.bin`,import.meta.url).href,qp=new URL(`../assets/geometry-BX0WQIX1.json`,import.meta.url).href,Jp=new URL(`../assets/material-CqDfLwek.json`,import.meta.url).href,Yp=new URL(`../assets/geometry-qC0vHX1L.bin`,import.meta.url).href,Xp=new URL(`../assets/geometry-JshxaVrE.json`,import.meta.url).href,Zp=new URL(`../assets/material-BcyqpYt_.json`,import.meta.url).href,Qp=new URL(`../assets/geometry-DflTC8wk.bin`,import.meta.url).href,$p=new URL(`../assets/geometry-SeWAXhPD.json`,import.meta.url).href,em=new URL(`../assets/material-BRVEzlCc.json`,import.meta.url).href,tm=new URL(`../assets/geometry-CLsBB4WQ.bin`,import.meta.url).href,nm=new URL(`../assets/geometry-VeJsBHjy.json`,import.meta.url).href,rm=new URL(`../assets/material-CSzKN9Ul.json`,import.meta.url).href,im=new URL(`../assets/geometry-Bul-YatC.bin`,import.meta.url).href,am=new URL(`../assets/geometry-DVFTEJuV.json`,import.meta.url).href,om=new URL(`../assets/material-BPenrW2m.json`,import.meta.url).href,sm=new URL(`../assets/geometry-shvoryLJ.bin`,import.meta.url).href,cm=new URL(`../assets/geometry-BFufagPo.json`,import.meta.url).href,lm=new URL(`../assets/material-CQpmrHLw.json`,import.meta.url).href,um=new URL(`../assets/geometry-DB6wVIcA.bin`,import.meta.url).href,dm=new URL(`../assets/geometry-FPnZi4PF.json`,import.meta.url).href,fm=new URL(`../assets/material-CjnmFEnQ.json`,import.meta.url).href,pm=new URL(`../assets/geometry-Li6zPuT1.bin`,import.meta.url).href,mm=new URL(`../assets/geometry-Porl2AZP.json`,import.meta.url).href,hm=new URL(`../assets/material-BEz3iia9.json`,import.meta.url).href,gm=new URL(`../assets/geometry-JepB0EWi.bin`,import.meta.url).href,_m=new URL(`../assets/geometry-BZ-TUYgp.json`,import.meta.url).href,vm=new URL(`../assets/material-BBbCYYFe.json`,import.meta.url).href,ym=new URL(`../assets/geometry-C4KIFesq.bin`,import.meta.url).href,bm=new URL(`../assets/geometry-COojCaI-.json`,import.meta.url).href,xm=new URL(`../assets/material-CXYNmTik.json`,import.meta.url).href,Sm=new URL(`../assets/geometry-BK-mUcZb.bin`,import.meta.url).href,Cm=new URL(`../assets/geometry-CV3YgDWK.json`,import.meta.url).href,wm=new URL(`../assets/material-BSBcnXaC.json`,import.meta.url).href,Tm=new URL(`../assets/geometry-DZ4Y7GDU.bin`,import.meta.url).href,Em=new URL(`../assets/geometry-BxHzNqZH.json`,import.meta.url).href,Dm=new URL(`../assets/material-D1Wb0xpI.json`,import.meta.url).href,Om=new URL(`../assets/geometry-wsfA6sgp.bin`,import.meta.url).href,km=new URL(`../assets/geometry-CdNScfXH.json`,import.meta.url).href,Am=new URL(`../assets/material-Dd9hHI7n.json`,import.meta.url).href,jm=new URL(`../assets/geometry-CCHuX_wE.bin`,import.meta.url).href,Mm=new URL(`../assets/geometry-BmS6kE2Y.json`,import.meta.url).href,Nm=new URL(`../assets/material-DdMEm9Aa.json`,import.meta.url).href,Pm=new URL(`../assets/geometry-DVmtlcIg.bin`,import.meta.url).href,Fm=new URL(`../assets/geometry-6TdxPxgj.json`,import.meta.url).href,Im=new URL(`../assets/material-B2vVSbXc.json`,import.meta.url).href,Lm=new URL(`../assets/geometry-B3rw-nBE.bin`,import.meta.url).href,Rm=new URL(`../assets/geometry-_m25dele.json`,import.meta.url).href,zm=new URL(`../assets/material-DSs7CUDy.json`,import.meta.url).href,Bm=new URL(`../assets/geometry-BAvWe66A.bin`,import.meta.url).href,Vm=new URL(`../assets/geometry-DtHo7UJU.json`,import.meta.url).href,Hm=new URL(`../assets/material-BzPY7sJY.json`,import.meta.url).href,Um=new URL(`../assets/geometry-GwbntpyN.bin`,import.meta.url).href,Wm=new URL(`../assets/geometry-DQnebIlC.json`,import.meta.url).href,Gm=new URL(`../assets/material-C2qH4Bdi.json`,import.meta.url).href,Km=new URL(`../assets/geometry-DrHGMxlj.bin`,import.meta.url).href,qm=new URL(`../assets/geometry-Dh2fQyuC.json`,import.meta.url).href,Jm=new URL(`../assets/material-Dyu0C8g-.json`,import.meta.url).href,Ym=new URL(`../assets/geometry-DgmRDiaT.bin`,import.meta.url).href,Xm=new URL(`../assets/geometry-DhHiJoKx.json`,import.meta.url).href,Zm=new URL(`../assets/material--Y5xXkag.json`,import.meta.url).href,Qm=new URL(`../assets/geometry-OqRIHaM_.bin`,import.meta.url).href,$m=new URL(`../assets/geometry-CjlztW-F.json`,import.meta.url).href,eh=new URL(`../assets/material-7p24nenI.json`,import.meta.url).href,th=new URL(`../assets/geometry-CQAwAt2H.bin`,import.meta.url).href,nh=new URL(`../assets/geometry-D1698zrF.json`,import.meta.url).href,rh=new URL(`../assets/material-_1mBOAqr.json`,import.meta.url).href,ih=new URL(`../assets/geometry-Cgtbkld_.bin`,import.meta.url).href,ah=new URL(`../assets/geometry-BHbzMsJl.json`,import.meta.url).href,oh=new URL(`../assets/material-CSVMbfIn.json`,import.meta.url).href,sh=new URL(`../assets/geometry-HyEmlJw-.bin`,import.meta.url).href,ch=new URL(`../assets/geometry-BN0EO417.json`,import.meta.url).href,lh=new URL(`../assets/material-UdyZZ8oz.json`,import.meta.url).href,uh=new URL(`../assets/geometry-Bgf8shsq.bin`,import.meta.url).href,dh=new URL(`../assets/geometry-fM95txkV.json`,import.meta.url).href,fh=new URL(`../assets/material-BM4slwr6.json`,import.meta.url).href,ph=new URL(`../assets/geometry-ChoRT0Or.bin`,import.meta.url).href,mh=new URL(`../assets/geometry-CmlmLnip.json`,import.meta.url).href,hh=new URL(`../assets/material-PfBrUyFh.json`,import.meta.url).href,gh=new URL(`../assets/geometry-cNLGJ4Th.bin`,import.meta.url).href,_h=new URL(`../assets/geometry-C0Ipuv67.json`,import.meta.url).href,vh=new URL(`../assets/material-Dkeu2xFP.json`,import.meta.url).href,yh=new URL(`../assets/geometry-CF49H-qx.bin`,import.meta.url).href,bh=new URL(`../assets/geometry-fLZMIDMW.json`,import.meta.url).href,xh=new URL(`../assets/material-Dqtf8qW0.json`,import.meta.url).href,Sh=new URL(`../assets/geometry-DgT-GMym.bin`,import.meta.url).href,Ch=new URL(`../assets/geometry-BflYNi7y.json`,import.meta.url).href,wh=new URL(`../assets/material-D9yGEOsK.json`,import.meta.url).href,Th=new URL(`../assets/geometry-D2yN9d1k.bin`,import.meta.url).href,Eh=new URL(`../assets/geometry-CTKL67_v.json`,import.meta.url).href,Dh=new URL(`../assets/material-CF4_k2RB.json`,import.meta.url).href,Oh=new URL(`../assets/geometry-BPHd7mmZ.bin`,import.meta.url).href,kh=new URL(`../assets/geometry-CG7QERBM.json`,import.meta.url).href,Ah=new URL(`../assets/material-Bw0IHv3e.json`,import.meta.url).href,jh=new URL(`../assets/geometry-BBKPx19i.bin`,import.meta.url).href,Mh=new URL(`../assets/geometry-CMY3Ubye.json`,import.meta.url).href,Nh=new URL(`../assets/material-nJaxzG7X.json`,import.meta.url).href,Ph=new URL(`../assets/geometry-C21JgGNl.bin`,import.meta.url).href,Fh=new URL(`../assets/geometry-DfVzt42m.json`,import.meta.url).href,Ih=new URL(`../assets/material-rLqbiik1.json`,import.meta.url).href,Lh=new URL(`../assets/geometry-CbMNspJw.bin`,import.meta.url).href,Rh=new URL(`../assets/geometry-Cixj09DK.json`,import.meta.url).href,zh=new URL(`../assets/material-6RNaBXJp.json`,import.meta.url).href,Bh=new URL(`../assets/geometry-CxG-LMks.bin`,import.meta.url).href,Vh=new URL(`../assets/geometry-CPR45hPn.json`,import.meta.url).href,Hh=new URL(`../assets/material-Lz00GJeg.json`,import.meta.url).href,Uh=new URL(`../assets/geometry-V5mpIThN.bin`,import.meta.url).href,Wh=new URL(`../assets/geometry-CIkXNP86.json`,import.meta.url).href,Gh=new URL(`../assets/material-CJzPgH8p.json`,import.meta.url).href,Kh=new URL(`../assets/geometry-Djz7eF4I.bin`,import.meta.url).href,qh=new URL(`../assets/geometry-h6NOrGlq.json`,import.meta.url).href,Jh=new URL(`../assets/material-BjTWxFgz.json`,import.meta.url).href,Yh=new URL(`../assets/geometry-DduJlEir.bin`,import.meta.url).href,Xh=new URL(`../assets/geometry-BImfoL89.json`,import.meta.url).href,Zh=new URL(`../assets/material-2lVmfC1N.json`,import.meta.url).href,Qh=new URL(`../assets/geometry-LFXDWtqt.bin`,import.meta.url).href,$h=new URL(`../assets/geometry-Be4UAG7U.json`,import.meta.url).href,eg=new URL(`../assets/material-DSUAmpZP.json`,import.meta.url).href,tg=new URL(`../assets/geometry-DqEPsDlZ.bin`,import.meta.url).href,ng=new URL(`../assets/geometry-DbxKX1xO.json`,import.meta.url).href,rg=new URL(`../assets/material-Bno-8C0W.json`,import.meta.url).href,ig=new URL(`../assets/geometry-9ZRUVyI6.bin`,import.meta.url).href,ag=new URL(`../assets/geometry-BgqtWpq-.json`,import.meta.url).href,og=new URL(`../assets/material-DkG9mGhM.json`,import.meta.url).href,sg=new URL(`../assets/geometry-GAwYraYf.bin`,import.meta.url).href,cg=new URL(`../assets/geometry-DRte854E.json`,import.meta.url).href,lg=new URL(`../assets/material-CtIpo9uK.json`,import.meta.url).href,ug=new URL(`../assets/geometry-BThansED.bin`,import.meta.url).href,dg=new URL(`../assets/geometry-BcFSb4Zh.json`,import.meta.url).href,fg=new URL(`../assets/material-6Y7KjP14.json`,import.meta.url).href,pg=new URL(`../assets/geometry-C97Wb59S.bin`,import.meta.url).href,mg=new URL(`../assets/geometry-B-4gSjl0.json`,import.meta.url).href,hg=new URL(`../assets/material-DQb1nmnR.json`,import.meta.url).href,gg=new URL(`../assets/geometry-CYUUVO9z.bin`,import.meta.url).href,_g=new URL(`../assets/geometry-DNFhaOig.json`,import.meta.url).href,vg=new URL(`../assets/material-BY0IrCGd.json`,import.meta.url).href,yg=new URL(`../assets/geometry-DTrxDt9C.bin`,import.meta.url).href,bg=new URL(`../assets/geometry-D8niMYQ_.json`,import.meta.url).href,xg=new URL(`../assets/material-DyWFR3h1.json`,import.meta.url).href,Sg=new URL(`../assets/geometry-BYEy-j3u.bin`,import.meta.url).href,Cg=new URL(`../assets/geometry-BWxGSzzt.json`,import.meta.url).href,wg=new URL(`../assets/material-CpMPTBuF.json`,import.meta.url).href,Tg=new URL(`../assets/geometry-BrxF-osz.bin`,import.meta.url).href,Eg=new URL(`../assets/geometry-jh7lV-uw.json`,import.meta.url).href,Dg=new URL(`../assets/material-Cfex3Ql_.json`,import.meta.url).href,Og=new URL(`../assets/geometry-B7FAzS1F.bin`,import.meta.url).href,kg=new URL(`../assets/geometry-2pURe-Kn.json`,import.meta.url).href,Ag=new URL(`../assets/material-DEaKHfDN.json`,import.meta.url).href,jg=new URL(`../assets/geometry-BiK7FtQX.bin`,import.meta.url).href,Mg=new URL(`../assets/geometry-BsWKJT6i.json`,import.meta.url).href,Ng=new URL(`../assets/material-yBISC-jU.json`,import.meta.url).href,Pg=new URL(`../assets/geometry-BMPV_Hsg.bin`,import.meta.url).href,Fg=new URL(`../assets/geometry-Hap2bo7L.json`,import.meta.url).href,Ig=new URL(`../assets/material-BcYkk3ll.json`,import.meta.url).href,Lg=new URL(`../assets/geometry-DDYIC6aS.bin`,import.meta.url).href,Rg=new URL(`../assets/geometry-BNMzmgll.json`,import.meta.url).href,zg=new URL(`../assets/material-CixhQnYS.json`,import.meta.url).href,Bg=new URL(`../assets/geometry-D34g7-N1.bin`,import.meta.url).href,Vg=new URL(`../assets/geometry-D9lF6FLH.json`,import.meta.url).href,Hg=new URL(`../assets/material-BkMsbnL9.json`,import.meta.url).href,Ug=new URL(`../assets/geometry-CQAwAt2H.bin`,import.meta.url).href,Wg=new URL(`../assets/geometry-CTsuyrDZ.json`,import.meta.url).href,Gg=new URL(`../assets/material-HrT5tD94.json`,import.meta.url).href,Kg=new URL(`../assets/geometry-Cgtbkld_.bin`,import.meta.url).href,qg=new URL(`../assets/geometry-CrvwbE-6.json`,import.meta.url).href,Jg=new URL(`../assets/material-BSnkxnpl.json`,import.meta.url).href,Yg=new URL(`../assets/geometry-DAZa6NBL.bin`,import.meta.url).href,Xg=new URL(`../assets/geometry-DSyduoFt.json`,import.meta.url).href,Zg=new URL(`../assets/material-dDBJCy9-.json`,import.meta.url).href,Qg=new URL(`../assets/geometry-ClI8rpFr.bin`,import.meta.url).href,$g=new URL(`../assets/geometry-C_7Z-X7j.json`,import.meta.url).href,e_=new URL(`../assets/material-DEKjTM3C.json`,import.meta.url).href,t_=new URL(`../assets/geometry-D7GAMkpP.bin`,import.meta.url).href,n_=new URL(`../assets/geometry-C7x8IeHX.json`,import.meta.url).href,r_=new URL(`../assets/material-D4i1hBC1.json`,import.meta.url).href,i_=new URL(`../assets/geometry-T-7IYkmQ.bin`,import.meta.url).href,a_=new URL(`../assets/geometry-BlmVRd3r.json`,import.meta.url).href,o_=new URL(`../assets/material-CIbmVcQQ.json`,import.meta.url).href,s_=new URL(`../assets/geometry-BsAr1mz-.bin`,import.meta.url).href,c_=new URL(`../assets/geometry-DRSEz9lw.json`,import.meta.url).href,l_=new URL(`../assets/material-BNp8l0oa.json`,import.meta.url).href,u_=new URL(`../assets/geometry-CuSwc6Vq.bin`,import.meta.url).href,d_=new URL(`../assets/geometry-CYID7hnN.json`,import.meta.url).href,f_=new URL(`../assets/material-DLSM1AwK.json`,import.meta.url).href,p_=new URL(`../assets/geometry-V5mpIThN.bin`,import.meta.url).href,m_=new URL(`../assets/geometry-H8JzNDU1.json`,import.meta.url).href,h_=new URL(`../assets/material-DQslPigd.json`,import.meta.url).href,g_=new URL(`../assets/geometry-Djz7eF4I.bin`,import.meta.url).href,__=new URL(`../assets/geometry-DTRcWIBb.json`,import.meta.url).href,v_=new URL(`../assets/material-Bu1beJit.json`,import.meta.url).href,y_=new URL(`../assets/geometry-DZvNtSgq.bin`,import.meta.url).href,b_=new URL(`../assets/geometry-CAxTQj9F.json`,import.meta.url).href,x_=new URL(`../assets/material-DuDpMyEA.json`,import.meta.url).href,S_=new URL(`../assets/geometry-CXPF8M1d.bin`,import.meta.url).href,C_=new URL(`../assets/geometry-BqrHvByf.json`,import.meta.url).href,w_=new URL(`../assets/material-CVSRBAW3.json`,import.meta.url).href,T_=new URL(`../assets/geometry-DRrKS7_i.bin`,import.meta.url).href,E_=new URL(`../assets/geometry-QAcgG-n2.json`,import.meta.url).href,D_=new URL(`../assets/material-CdgPz2Ze.json`,import.meta.url).href,O_=new URL(`../assets/geometry-BD4lLBTf.bin`,import.meta.url).href,k_=new URL(`../assets/geometry-DibZ314G.json`,import.meta.url).href,A_=new URL(`../assets/material-B0RKr4tz.json`,import.meta.url).href,j_=new URL(`../assets/geometry-DDYIC6aS.bin`,import.meta.url).href,M_=new URL(`../assets/geometry-Dn3tdd69.json`,import.meta.url).href,N_=new URL(`../assets/material-BKybwRJl.json`,import.meta.url).href,P_=new URL(`../assets/geometry-D34g7-N1.bin`,import.meta.url).href,F_=new URL(`../assets/geometry-BLcYALBV.json`,import.meta.url).href,I_=new URL(`../assets/material-BEKpGaDX.json`,import.meta.url).href,L_=new URL(`../assets/geometry-DQBDgAad.bin`,import.meta.url).href,R_=new URL(`../assets/geometry-CQ8TViEm.json`,import.meta.url).href,z_=new URL(`../assets/material-n1BkoPp2.json`,import.meta.url).href,B_=new URL(`../assets/geometry-uCngZTcL.bin`,import.meta.url).href,V_=new URL(`../assets/geometry-DW5Zl8BW.json`,import.meta.url).href,H_=new URL(`../assets/material-BsCoypig.json`,import.meta.url).href,U_=new URL(`../assets/geometry-CpYs-xNI.bin`,import.meta.url).href,W_=new URL(`../assets/geometry-fKdprFWD.json`,import.meta.url).href,G_=new URL(`../assets/material-DzSpmvA1.json`,import.meta.url).href,K_=new URL(`../assets/geometry-C7QFQ1BU.bin`,import.meta.url).href,q_=new URL(`../assets/geometry-Cvq411cH.json`,import.meta.url).href,J_=new URL(`../assets/material-B6XMTn8L.json`,import.meta.url).href,Y_=new URL(`../assets/geometry-7BHXPH-R.bin`,import.meta.url).href,X_=new URL(`../assets/geometry-DDDfxj8N.json`,import.meta.url).href,Z_=new URL(`../assets/material-BklD9Aiu.json`,import.meta.url).href,Q_=new URL(`../assets/geometry-LUw4F0gC.bin`,import.meta.url).href,$_=new URL(`../assets/geometry-OaPBQTNZ.json`,import.meta.url).href,ev=new URL(`../assets/material-D7utDAQY.json`,import.meta.url).href,tv=new URL(`../assets/index-PiPWqvvK.json`,import.meta.url).href,nv=Object.assign({"./assets/catalog-library/accessory/beanie/high/geometry.bin":jf,"./assets/catalog-library/accessory/beanie/high/geometry.json":Mf,"./assets/catalog-library/accessory/beanie/high/material.json":Nf,"./assets/catalog-library/accessory/beanie/low/geometry.bin":Pf,"./assets/catalog-library/accessory/beanie/low/geometry.json":Ff,"./assets/catalog-library/accessory/beanie/low/material.json":If,"./assets/catalog-library/accessory/beret/high/geometry.bin":Lf,"./assets/catalog-library/accessory/beret/high/geometry.json":Rf,"./assets/catalog-library/accessory/beret/high/material.json":zf,"./assets/catalog-library/accessory/beret/low/geometry.bin":Bf,"./assets/catalog-library/accessory/beret/low/geometry.json":Vf,"./assets/catalog-library/accessory/beret/low/material.json":Hf,"./assets/catalog-library/accessory/bow/high/geometry.bin":Uf,"./assets/catalog-library/accessory/bow/high/geometry.json":Wf,"./assets/catalog-library/accessory/bow/high/material.json":Gf,"./assets/catalog-library/accessory/bow/low/geometry.bin":Kf,"./assets/catalog-library/accessory/bow/low/geometry.json":qf,"./assets/catalog-library/accessory/bow/low/material.json":Jf,"./assets/catalog-library/accessory/crown/high/geometry.bin":Yf,"./assets/catalog-library/accessory/crown/high/geometry.json":Xf,"./assets/catalog-library/accessory/crown/high/material.json":Zf,"./assets/catalog-library/accessory/crown/low/geometry.bin":Qf,"./assets/catalog-library/accessory/crown/low/geometry.json":$f,"./assets/catalog-library/accessory/crown/low/material.json":ep,"./assets/catalog-library/accessory/felipe_beret/high/geometry.bin":tp,"./assets/catalog-library/accessory/felipe_beret/high/geometry.json":np,"./assets/catalog-library/accessory/felipe_beret/high/material.json":rp,"./assets/catalog-library/accessory/felipe_beret/low/geometry.bin":ip,"./assets/catalog-library/accessory/felipe_beret/low/geometry.json":ap,"./assets/catalog-library/accessory/felipe_beret/low/material.json":op,"./assets/catalog-library/accessory/hat/high/geometry.bin":sp,"./assets/catalog-library/accessory/hat/high/geometry.json":cp,"./assets/catalog-library/accessory/hat/high/material.json":lp,"./assets/catalog-library/accessory/hat/low/geometry.bin":up,"./assets/catalog-library/accessory/hat/low/geometry.json":dp,"./assets/catalog-library/accessory/hat/low/material.json":fp,"./assets/catalog-library/accessory/headphones/high/geometry.bin":pp,"./assets/catalog-library/accessory/headphones/high/geometry.json":mp,"./assets/catalog-library/accessory/headphones/high/material.json":hp,"./assets/catalog-library/accessory/headphones/low/geometry.bin":gp,"./assets/catalog-library/accessory/headphones/low/geometry.json":_p,"./assets/catalog-library/accessory/headphones/low/material.json":vp,"./assets/catalog-library/accessory/none/high/geometry.bin":yp,"./assets/catalog-library/accessory/none/high/geometry.json":bp,"./assets/catalog-library/accessory/none/high/material.json":xp,"./assets/catalog-library/accessory/none/low/geometry.bin":Sp,"./assets/catalog-library/accessory/none/low/geometry.json":Cp,"./assets/catalog-library/accessory/none/low/material.json":wp,"./assets/catalog-library/accessory/orb/high/geometry.bin":Tp,"./assets/catalog-library/accessory/orb/high/geometry.json":Ep,"./assets/catalog-library/accessory/orb/high/material.json":Dp,"./assets/catalog-library/accessory/orb/low/geometry.bin":Op,"./assets/catalog-library/accessory/orb/low/geometry.json":kp,"./assets/catalog-library/accessory/orb/low/material.json":Ap,"./assets/catalog-library/accessory/three_lobe/high/geometry.bin":jp,"./assets/catalog-library/accessory/three_lobe/high/geometry.json":Mp,"./assets/catalog-library/accessory/three_lobe/high/material.json":Np,"./assets/catalog-library/accessory/three_lobe/low/geometry.bin":Pp,"./assets/catalog-library/accessory/three_lobe/low/geometry.json":Fp,"./assets/catalog-library/accessory/three_lobe/low/material.json":Ip,"./assets/catalog-library/body/capsule/high/geometry.bin":Lp,"./assets/catalog-library/body/capsule/high/geometry.json":Rp,"./assets/catalog-library/body/capsule/high/material.json":zp,"./assets/catalog-library/body/capsule/low/geometry.bin":Bp,"./assets/catalog-library/body/capsule/low/geometry.json":Vp,"./assets/catalog-library/body/capsule/low/material.json":Hp,"./assets/catalog-library/body/circle/high/geometry.bin":Up,"./assets/catalog-library/body/circle/high/geometry.json":Wp,"./assets/catalog-library/body/circle/high/material.json":Gp,"./assets/catalog-library/body/circle/low/geometry.bin":Kp,"./assets/catalog-library/body/circle/low/geometry.json":qp,"./assets/catalog-library/body/circle/low/material.json":Jp,"./assets/catalog-library/body/circle_two_ears/high/geometry.bin":Yp,"./assets/catalog-library/body/circle_two_ears/high/geometry.json":Xp,"./assets/catalog-library/body/circle_two_ears/high/material.json":Zp,"./assets/catalog-library/body/circle_two_ears/low/geometry.bin":Qp,"./assets/catalog-library/body/circle_two_ears/low/geometry.json":$p,"./assets/catalog-library/body/circle_two_ears/low/material.json":em,"./assets/catalog-library/body/clippo/high/geometry.bin":tm,"./assets/catalog-library/body/clippo/high/geometry.json":nm,"./assets/catalog-library/body/clippo/high/material.json":rm,"./assets/catalog-library/body/clippo/low/geometry.bin":im,"./assets/catalog-library/body/clippo/low/geometry.json":am,"./assets/catalog-library/body/clippo/low/material.json":om,"./assets/catalog-library/body/cloud/high/geometry.bin":sm,"./assets/catalog-library/body/cloud/high/geometry.json":cm,"./assets/catalog-library/body/cloud/high/material.json":lm,"./assets/catalog-library/body/cloud/low/geometry.bin":um,"./assets/catalog-library/body/cloud/low/geometry.json":dm,"./assets/catalog-library/body/cloud/low/material.json":fm,"./assets/catalog-library/body/four_lobed_butterfly/high/geometry.bin":pm,"./assets/catalog-library/body/four_lobed_butterfly/high/geometry.json":mm,"./assets/catalog-library/body/four_lobed_butterfly/high/material.json":hm,"./assets/catalog-library/body/four_lobed_butterfly/low/geometry.bin":gm,"./assets/catalog-library/body/four_lobed_butterfly/low/geometry.json":_m,"./assets/catalog-library/body/four_lobed_butterfly/low/material.json":vm,"./assets/catalog-library/body/heart/high/geometry.bin":ym,"./assets/catalog-library/body/heart/high/geometry.json":bm,"./assets/catalog-library/body/heart/high/material.json":xm,"./assets/catalog-library/body/heart/low/geometry.bin":Sm,"./assets/catalog-library/body/heart/low/geometry.json":Cm,"./assets/catalog-library/body/heart/low/material.json":wm,"./assets/catalog-library/body/pebble/high/geometry.bin":Tm,"./assets/catalog-library/body/pebble/high/geometry.json":Em,"./assets/catalog-library/body/pebble/high/material.json":Dm,"./assets/catalog-library/body/pebble/low/geometry.bin":Om,"./assets/catalog-library/body/pebble/low/geometry.json":km,"./assets/catalog-library/body/pebble/low/material.json":Am,"./assets/catalog-library/body/petal/high/geometry.bin":jm,"./assets/catalog-library/body/petal/high/geometry.json":Mm,"./assets/catalog-library/body/petal/high/material.json":Nm,"./assets/catalog-library/body/petal/low/geometry.bin":Pm,"./assets/catalog-library/body/petal/low/geometry.json":Fm,"./assets/catalog-library/body/petal/low/material.json":Im,"./assets/catalog-library/body/pocket/high/geometry.bin":Lm,"./assets/catalog-library/body/pocket/high/geometry.json":Rm,"./assets/catalog-library/body/pocket/high/material.json":zm,"./assets/catalog-library/body/pocket/low/geometry.bin":Bm,"./assets/catalog-library/body/pocket/low/geometry.json":Vm,"./assets/catalog-library/body/pocket/low/material.json":Hm,"./assets/catalog-library/body/rounded_cube/high/geometry.bin":Um,"./assets/catalog-library/body/rounded_cube/high/geometry.json":Wm,"./assets/catalog-library/body/rounded_cube/high/material.json":Gm,"./assets/catalog-library/body/rounded_cube/low/geometry.bin":Km,"./assets/catalog-library/body/rounded_cube/low/geometry.json":qm,"./assets/catalog-library/body/rounded_cube/low/material.json":Jm,"./assets/catalog-library/body/rounded_diamond/high/geometry.bin":Ym,"./assets/catalog-library/body/rounded_diamond/high/geometry.json":Xm,"./assets/catalog-library/body/rounded_diamond/high/material.json":Zm,"./assets/catalog-library/body/rounded_diamond/low/geometry.bin":Qm,"./assets/catalog-library/body/rounded_diamond/low/geometry.json":$m,"./assets/catalog-library/body/rounded_diamond/low/material.json":eh,"./assets/catalog-library/body/rounded_head_two_ears/high/geometry.bin":th,"./assets/catalog-library/body/rounded_head_two_ears/high/geometry.json":nh,"./assets/catalog-library/body/rounded_head_two_ears/high/material.json":rh,"./assets/catalog-library/body/rounded_head_two_ears/low/geometry.bin":ih,"./assets/catalog-library/body/rounded_head_two_ears/low/geometry.json":ah,"./assets/catalog-library/body/rounded_head_two_ears/low/material.json":oh,"./assets/catalog-library/body/rounded_triangle/high/geometry.bin":sh,"./assets/catalog-library/body/rounded_triangle/high/geometry.json":ch,"./assets/catalog-library/body/rounded_triangle/high/material.json":lh,"./assets/catalog-library/body/rounded_triangle/low/geometry.bin":uh,"./assets/catalog-library/body/rounded_triangle/low/geometry.json":dh,"./assets/catalog-library/body/rounded_triangle/low/material.json":fh,"./assets/catalog-library/body/shield/high/geometry.bin":ph,"./assets/catalog-library/body/shield/high/geometry.json":mh,"./assets/catalog-library/body/shield/high/material.json":hh,"./assets/catalog-library/body/shield/low/geometry.bin":gh,"./assets/catalog-library/body/shield/low/geometry.json":_h,"./assets/catalog-library/body/shield/low/material.json":vh,"./assets/catalog-library/body/six_lobed_flower/high/geometry.bin":yh,"./assets/catalog-library/body/six_lobed_flower/high/geometry.json":bh,"./assets/catalog-library/body/six_lobed_flower/high/material.json":xh,"./assets/catalog-library/body/six_lobed_flower/low/geometry.bin":Sh,"./assets/catalog-library/body/six_lobed_flower/low/geometry.json":Ch,"./assets/catalog-library/body/six_lobed_flower/low/material.json":wh,"./assets/catalog-library/body/slender/high/geometry.bin":Th,"./assets/catalog-library/body/slender/high/geometry.json":Eh,"./assets/catalog-library/body/slender/high/material.json":Dh,"./assets/catalog-library/body/slender/low/geometry.bin":Oh,"./assets/catalog-library/body/slender/low/geometry.json":kh,"./assets/catalog-library/body/slender/low/material.json":Ah,"./assets/catalog-library/body/squircle/high/geometry.bin":jh,"./assets/catalog-library/body/squircle/high/geometry.json":Mh,"./assets/catalog-library/body/squircle/high/material.json":Nh,"./assets/catalog-library/body/squircle/low/geometry.bin":Ph,"./assets/catalog-library/body/squircle/low/geometry.json":Fh,"./assets/catalog-library/body/squircle/low/material.json":Ih,"./assets/catalog-library/body/star/high/geometry.bin":Lh,"./assets/catalog-library/body/star/high/geometry.json":Rh,"./assets/catalog-library/body/star/high/material.json":zh,"./assets/catalog-library/body/star/low/geometry.bin":Bh,"./assets/catalog-library/body/star/low/geometry.json":Vh,"./assets/catalog-library/body/star/low/material.json":Hh,"./assets/catalog-library/body/todd/high/geometry.bin":Uh,"./assets/catalog-library/body/todd/high/geometry.json":Wh,"./assets/catalog-library/body/todd/high/material.json":Gh,"./assets/catalog-library/body/todd/low/geometry.bin":Kh,"./assets/catalog-library/body/todd/low/geometry.json":qh,"./assets/catalog-library/body/todd/low/material.json":Jh,"./assets/catalog-library/body/twelve_scalloped_rosette/high/geometry.bin":Yh,"./assets/catalog-library/body/twelve_scalloped_rosette/high/geometry.json":Xh,"./assets/catalog-library/body/twelve_scalloped_rosette/high/material.json":Zh,"./assets/catalog-library/body/twelve_scalloped_rosette/low/geometry.bin":Qh,"./assets/catalog-library/body/twelve_scalloped_rosette/low/geometry.json":$h,"./assets/catalog-library/body/twelve_scalloped_rosette/low/material.json":eg,"./assets/catalog-library/eyes/clippo/high/geometry.bin":tg,"./assets/catalog-library/eyes/clippo/high/geometry.json":ng,"./assets/catalog-library/eyes/clippo/high/material.json":rg,"./assets/catalog-library/eyes/clippo/low/geometry.bin":ig,"./assets/catalog-library/eyes/clippo/low/geometry.json":ag,"./assets/catalog-library/eyes/clippo/low/material.json":og,"./assets/catalog-library/eyes/crescent_inset/high/geometry.bin":sg,"./assets/catalog-library/eyes/crescent_inset/high/geometry.json":cg,"./assets/catalog-library/eyes/crescent_inset/high/material.json":lg,"./assets/catalog-library/eyes/crescent_inset/low/geometry.bin":ug,"./assets/catalog-library/eyes/crescent_inset/low/geometry.json":dg,"./assets/catalog-library/eyes/crescent_inset/low/material.json":fg,"./assets/catalog-library/eyes/cyclops/high/geometry.bin":pg,"./assets/catalog-library/eyes/cyclops/high/geometry.json":mg,"./assets/catalog-library/eyes/cyclops/high/material.json":hg,"./assets/catalog-library/eyes/cyclops/low/geometry.bin":gg,"./assets/catalog-library/eyes/cyclops/low/geometry.json":_g,"./assets/catalog-library/eyes/cyclops/low/material.json":vg,"./assets/catalog-library/eyes/dots/high/geometry.bin":yg,"./assets/catalog-library/eyes/dots/high/geometry.json":bg,"./assets/catalog-library/eyes/dots/high/material.json":xg,"./assets/catalog-library/eyes/dots/low/geometry.bin":Sg,"./assets/catalog-library/eyes/dots/low/geometry.json":Cg,"./assets/catalog-library/eyes/dots/low/material.json":wg,"./assets/catalog-library/eyes/double_highlights/high/geometry.bin":Tg,"./assets/catalog-library/eyes/double_highlights/high/geometry.json":Eg,"./assets/catalog-library/eyes/double_highlights/high/material.json":Dg,"./assets/catalog-library/eyes/double_highlights/low/geometry.bin":Og,"./assets/catalog-library/eyes/double_highlights/low/geometry.json":kg,"./assets/catalog-library/eyes/double_highlights/low/material.json":Ag,"./assets/catalog-library/eyes/highlight_capsules/high/geometry.bin":jg,"./assets/catalog-library/eyes/highlight_capsules/high/geometry.json":Mg,"./assets/catalog-library/eyes/highlight_capsules/high/material.json":Ng,"./assets/catalog-library/eyes/highlight_capsules/low/geometry.bin":Pg,"./assets/catalog-library/eyes/highlight_capsules/low/geometry.json":Fg,"./assets/catalog-library/eyes/highlight_capsules/low/material.json":Ig,"./assets/catalog-library/eyes/oval/high/geometry.bin":Lg,"./assets/catalog-library/eyes/oval/high/geometry.json":Rg,"./assets/catalog-library/eyes/oval/high/material.json":zg,"./assets/catalog-library/eyes/oval/low/geometry.bin":Bg,"./assets/catalog-library/eyes/oval/low/geometry.json":Vg,"./assets/catalog-library/eyes/oval/low/material.json":Hg,"./assets/catalog-library/eyes/round_inset/high/geometry.bin":Ug,"./assets/catalog-library/eyes/round_inset/high/geometry.json":Wg,"./assets/catalog-library/eyes/round_inset/high/material.json":Gg,"./assets/catalog-library/eyes/round_inset/low/geometry.bin":Kg,"./assets/catalog-library/eyes/round_inset/low/geometry.json":qg,"./assets/catalog-library/eyes/round_inset/low/material.json":Jg,"./assets/catalog-library/eyes/sleepy_lids/high/geometry.bin":Yg,"./assets/catalog-library/eyes/sleepy_lids/high/geometry.json":Xg,"./assets/catalog-library/eyes/sleepy_lids/high/material.json":Zg,"./assets/catalog-library/eyes/sleepy_lids/low/geometry.bin":Qg,"./assets/catalog-library/eyes/sleepy_lids/low/geometry.json":$g,"./assets/catalog-library/eyes/sleepy_lids/low/material.json":e_,"./assets/catalog-library/eyes/sparkle_capsules/high/geometry.bin":t_,"./assets/catalog-library/eyes/sparkle_capsules/high/geometry.json":n_,"./assets/catalog-library/eyes/sparkle_capsules/high/material.json":r_,"./assets/catalog-library/eyes/sparkle_capsules/low/geometry.bin":i_,"./assets/catalog-library/eyes/sparkle_capsules/low/geometry.json":a_,"./assets/catalog-library/eyes/sparkle_capsules/low/material.json":o_,"./assets/catalog-library/eyes/swept_lids/high/geometry.bin":s_,"./assets/catalog-library/eyes/swept_lids/high/geometry.json":c_,"./assets/catalog-library/eyes/swept_lids/high/material.json":l_,"./assets/catalog-library/eyes/swept_lids/low/geometry.bin":u_,"./assets/catalog-library/eyes/swept_lids/low/geometry.json":d_,"./assets/catalog-library/eyes/swept_lids/low/material.json":f_,"./assets/catalog-library/eyes/todd/high/geometry.bin":p_,"./assets/catalog-library/eyes/todd/high/geometry.json":m_,"./assets/catalog-library/eyes/todd/high/material.json":h_,"./assets/catalog-library/eyes/todd/low/geometry.bin":g_,"./assets/catalog-library/eyes/todd/low/geometry.json":__,"./assets/catalog-library/eyes/todd/low/material.json":v_,"./assets/catalog-library/eyewear/classic_sunglasses/high/geometry.bin":y_,"./assets/catalog-library/eyewear/classic_sunglasses/high/geometry.json":b_,"./assets/catalog-library/eyewear/classic_sunglasses/high/material.json":x_,"./assets/catalog-library/eyewear/classic_sunglasses/low/geometry.bin":S_,"./assets/catalog-library/eyewear/classic_sunglasses/low/geometry.json":C_,"./assets/catalog-library/eyewear/classic_sunglasses/low/material.json":w_,"./assets/catalog-library/eyewear/monocle/high/geometry.bin":T_,"./assets/catalog-library/eyewear/monocle/high/geometry.json":E_,"./assets/catalog-library/eyewear/monocle/high/material.json":D_,"./assets/catalog-library/eyewear/monocle/low/geometry.bin":O_,"./assets/catalog-library/eyewear/monocle/low/geometry.json":k_,"./assets/catalog-library/eyewear/monocle/low/material.json":A_,"./assets/catalog-library/eyewear/none/high/geometry.bin":j_,"./assets/catalog-library/eyewear/none/high/geometry.json":M_,"./assets/catalog-library/eyewear/none/high/material.json":N_,"./assets/catalog-library/eyewear/none/low/geometry.bin":P_,"./assets/catalog-library/eyewear/none/low/geometry.json":F_,"./assets/catalog-library/eyewear/none/low/material.json":I_,"./assets/catalog-library/eyewear/round_sunglasses/high/geometry.bin":L_,"./assets/catalog-library/eyewear/round_sunglasses/high/geometry.json":R_,"./assets/catalog-library/eyewear/round_sunglasses/high/material.json":z_,"./assets/catalog-library/eyewear/round_sunglasses/low/geometry.bin":B_,"./assets/catalog-library/eyewear/round_sunglasses/low/geometry.json":V_,"./assets/catalog-library/eyewear/round_sunglasses/low/material.json":H_,"./assets/catalog-library/eyewear/separate_trapezoid_lenses/high/geometry.bin":U_,"./assets/catalog-library/eyewear/separate_trapezoid_lenses/high/geometry.json":W_,"./assets/catalog-library/eyewear/separate_trapezoid_lenses/high/material.json":G_,"./assets/catalog-library/eyewear/separate_trapezoid_lenses/low/geometry.bin":K_,"./assets/catalog-library/eyewear/separate_trapezoid_lenses/low/geometry.json":q_,"./assets/catalog-library/eyewear/separate_trapezoid_lenses/low/material.json":J_,"./assets/catalog-library/eyewear/tall_oval_frames/high/geometry.bin":Y_,"./assets/catalog-library/eyewear/tall_oval_frames/high/geometry.json":X_,"./assets/catalog-library/eyewear/tall_oval_frames/high/material.json":Z_,"./assets/catalog-library/eyewear/tall_oval_frames/low/geometry.bin":Q_,"./assets/catalog-library/eyewear/tall_oval_frames/low/geometry.json":$_,"./assets/catalog-library/eyewear/tall_oval_frames/low/material.json":ev,"./assets/catalog-library/index.json":tv}),rv=e=>{let t=nv[`./assets/catalog-library/${e}`];if(!t)throw Error(`Missing authored catalog asset: ${e}`);return t},iv,av=new Map,ov=new Map,sv=50331648;function cv(e,t){let n=new Set;for(let e of t.pieces){for(let t of Object.values(e.geometry.attributes)){let e=t,r=(e.data?.array??e.array)?.buffer;r&&n.add(r)}let t=e.geometry.getIndex();t&&n.add(t.array.buffer)}ov.delete(e),ov.set(e,[...n].reduce((e,t)=>e+t.byteLength,0));let r=[...ov.values()].reduce((e,t)=>e+t,0);for(let[e,t]of ov){if(r<=sv)break;ov.delete(e),av.delete(e),r-=t}return t}function lv(){return iv??=Sd(rv(`index.json`)).then(e=>e.json()).catch(e=>{throw iv=void 0,e})}function uv(e,t,n){let r=`${e}:${t}:${n}`,i=av.get(r);if(i&&ov.has(r)){let e=ov.get(r);ov.delete(r),ov.set(r,e)}return i||(i=(async()=>{let i=(await lv()).donors[e]?.[t];if(!i)throw Error(`Unknown avatar ${e}: ${t}`);let a=i[n],[o,s,c]=await Promise.all([Sd(rv(`${a}/geometry.json`)).then(e=>e.json()),Sd(rv(`${a}/material.json`)).then(e=>e.json()),Sd(rv(`${a}/geometry.bin`)).then(e=>e.arrayBuffer())]);s.preset=i.signaturePreset,s.crop=[0,0,1,1];let l=Td(i.signaturePreset,o,s,c,!1,void 0),u=l.parts.map(e=>{let n=s.parts.find(t=>t.id===e.id);if(!n?.bounds||!n.pivot)throw Error(`Missing semantic part metadata: ${r}/${e.id}`);return{...e,bounds:n.bounds,pivot:n.pivot,attachmentPivot:n.attachmentPivot,category:n.category,selection:n.selection??(i.selectedPartIds.includes(e.id)?t:``)}}),d=u.find(e=>e.id===0&&!e.fur);if(!d)throw Error(`Missing catalog body: ${r}`);return{body:d,pieces:u,face:`centers`in i.face?i.face:i.face[n],source:l,selectedPartIds:i.selectedPartIds,signaturePreset:i.signaturePreset,construction:i.construction?.[n],sceneBounds:s.sceneBounds,referenceBounds:s.referenceBounds,aggregateBounds:s.aggregateBounds,furMaskIndices:s.furMaskIndices}})().then(e=>cv(r,e)).catch(e=>{throw av.delete(r),e}),av.set(r,i)),i}var dv={scale:1,origin:[0,0,0],translate:[0,0,0]};async function fv(e,t){let[n,r,i,a,o]=await Promise.all([uv(`body`,e.shape,t),uv(`eyes`,e.eyes===`none`?`oval`:e.eyes,t),e.eyewear===`none`?null:uv(`eyewear`,e.eyewear,t),e.accessory===`none`?null:uv(`accessory`,e.accessory,t),e.eyes===`cyclops`?uv(`eyes`,`todd`,t):null]),s={...n,face:Df(n,e.shape,e.eyes===`cyclops`)};if(e.eyeSpacing!==void 0&&e.eyeSpacing!==1){if(!Number.isFinite(e.eyeSpacing)||e.eyeSpacing<.5||e.eyeSpacing>1.5)throw Error(`Invalid avatar eye spacing`);let t=(s.face.centers[0][0]+s.face.centers[1][0])/2;s.face={...s.face,centers:s.face.centers.map(([n,r,i])=>{let a=t+(n-t)*e.eyeSpacing,o=gf(s,a,r);return[a,r,Number.isFinite(o)?o-s.face.radius*.3:i]})}}let c=[],l=[],u=(e,t)=>{for(let n of e.pieces.filter(e=>e.id===t.part.id)){let r=yf(n,t);t.attachmentRoot&&(r.attachmentPivot=[...t.attachmentRoot]),c.push({part:r,sourcePart:n,donor:e,transform:vf(t)})}};for(let e of s.pieces.filter(e=>s.selectedPartIds.includes(e.id)&&!e.fur))u(s,{part:e,...dv});let d=()=>({body:c[0].part,pieces:[...c.map(e=>e.part),...l],face:s.face});if(e.eyes===`clippo`)for(let{donor:t,placement:i}of kf(s,r,r.construction?.kind===`clippo-face`?r.construction:void 0)){if(t===s&&e.eyeSpacing!==void 0&&e.eyeSpacing!==1){let e=(i.part.bounds.min[0]+i.part.bounds.max[0])/2<0?0:1,t=n.face.centers[e];i.translate=i.translate.map((n,r)=>n+s.face.centers[e][r]-t[r])}u(t,i)}else if(e.eyes===`cyclops`){let e=r.pieces.filter(e=>r.selectedPartIds.includes(e.id)&&!e.fur);if(!e[0]||e.length!==5)throw Error(`Missing complete Cyclops donor`);let t=e=>[0,1,2].map(t=>(e.bounds.min[t]+e.bounds.max[t])/2);if(r.construction?.kind!==`cyclops`)throw Error(`Missing Cyclops construction anchors`);let n=r.construction.center,i=s.face.radius*2/r.construction.radius,a=[0,1].map(e=>(s.face.centers[0][e]+s.face.centers[1][e])/2).concat(Math.max(...s.face.centers.map(e=>e[2]))+s.face.radius*.5),l=Of(o,s.face),d=0;for(let[o,s]of e.entries()){let e=o===0?n:t(s);u(r,{part:s,scale:i,origin:e,translate:(o===0?a:[a[0]+(e[0]-n[0])*i,a[1]+(e[1]-n[1])*i,d+.006-(s.bounds.max[2]-e[2])*i]).map((t,n)=>t-e[n])});let f=c[c.length-1];f.part.geometry.dispose();let p=l[o];f.part={...f.part,geometry:p.geometry,bounds:p.bounds,pivot:p.pivot,attachmentPivot:p.attachmentPivot},d=f.part.bounds.max[2]}}else for(let t of _f(s,r,`eyes`,e.eyes===`none`?`oval`:e.eyes,{faceLayout:s.face}))e.eyes===`none`?l.push(yf(t.part,t)):u(r,t);if(a){let t=e.eyes===`cyclops`?s:d(),n=Ef(e.shape).tuft,r=_f(t,a,`accessory`,e.accessory,{tuftLayout:n});for(let i of Cf(t,a,r,e.accessory,n))u(a,i)}if(i)for(let t of _f(d(),i,`eyewear`,e.eyewear,{singleEye:e.eyes===`cyclops`}))u(i,t);e.accessory===`three_lobe`&&Ml(c.filter(e=>e.part.category===`body`).map(e=>e.part),c.filter(e=>e.part.category===`accessory`).map(e=>e.part));let f=new Y().fromArray(s.body.fields.world),p=new Y().fromArray(s.body.fields.normalMatrix),m=new Map,h=0;for(let e of c){let t=m.get(e.sourcePart),n=c.find(t=>t!==e&&t.donor===e.donor&&t.sourcePart.id===e.sourcePart.id&&m.has(t.sourcePart));t===void 0&&(t=n?m.get(n.sourcePart):h++),m.set(e.sourcePart,t),e.part.id=t;let r=new Y().fromArray(e.donor.body.fields.world).invert(),i=new Y().multiplyMatrices(r,new Y().fromArray(e.sourcePart.fields.world)),a=e.transform.clone().invert();e.part.fields.world=f.clone().multiply(e.transform).multiply(i).multiply(a).toArray();let o=e.transform.clone().setPosition(0,0,0),s=new Y().fromArray(e.donor.body.fields.normalMatrix).invert().multiply(new Y().fromArray(e.sourcePart.fields.normalMatrix));e.part.fields.normalMatrix=p.clone().multiply(o).multiply(s).multiply(o.clone().invert()).toArray(),e.part.renderOrder=t,e.part.colorRole=e.part.category===`body`||e.part.attachment===`three_lobe`?`body`:void 0}let g=c.filter(e=>e.part.category===`eyes`&&!e.part.fur),_=c.some(e=>e.part.category===`body`&&e.part.fur);if(!r.furMaskIndices||r.furMaskIndices.length!==2)throw Error(`Missing catalog eye fur masks`);let v=r.furMaskIndices.map(t=>{if(e.eyes===`none`||t===null||!_)return[0,0,0,0];let n=g[t];if(!n)throw Error(`Missing catalog eye fur mask surface`);return Af(n.part.bounds)});for(let{part:e}of c)e.category===`body`&&(e.fields.furEye0=v[0],e.fields.furEye1=v[1]);for(let e of l)e.geometry.dispose();let y=c.filter(e=>!e.part.fur).map(({part:e})=>({id:e.id,materialKind:e.kind,fields:e.fields,label:e.label,attachment:e.attachment,fur:c.some(t=>t.part.id===e.id&&t.part.fur),universal:e.universal,transparent:e.transparent,depthWrite:e.depthWrite,depthTest:e.depthTest,doubleSided:e.doubleSided,renderOrder:e.renderOrder})),b={...s.source.material,preset:s.signaturePreset,parts:y,crop:[0,0,1,1]};return{source:{preset:s.signaturePreset,material:b,parts:c.map(e=>e.part)},bindings:c,body:s}}var pv=new URL(`../assets/material-D_gyKzeF.json`,import.meta.url).href,mv=new URL(`../assets/motion-CGuxr_IN.bin`,import.meta.url).href,hv=new URL(`../assets/centering-1LyuTxIa.json`,import.meta.url).href,gv=new URL(`../assets/material-CokwBZ3w.json`,import.meta.url).href,_v=new URL(`../assets/motion-JsIW2tAn.bin`,import.meta.url).href,vv=new URL(`../assets/material-C7W4vLmv.json`,import.meta.url).href,yv=new URL(`../assets/motion-Bf1Yg7JB.bin`,import.meta.url).href,bv=new URL(`../assets/material-DCK-LemR.json`,import.meta.url).href,xv=new URL(`../assets/motion-xJsouvZq.bin`,import.meta.url).href,Sv=new URL(`../assets/material-DnWWhE3Y.json`,import.meta.url).href,Cv=new URL(`../assets/motion-DRBQ2rrP.bin`,import.meta.url).href,wv=new URL(`../assets/material-G2QVFghU.json`,import.meta.url).href,Tv=new URL(`../assets/motion-Df2d34-6.bin`,import.meta.url).href,Ev=new URL(`../assets/geometry-ByTZgMIu.bin`,import.meta.url).href,Dv=new URL(`../assets/geometry-BY_XOqNh.json`,import.meta.url).href,Ov=new URL(`../assets/material-Uwr7c-9L.json`,import.meta.url).href,kv=new URL(`../assets/motion-DvbVw2wN.bin`,import.meta.url).href,Av=new URL(`../assets/material-CDZwmjaL.json`,import.meta.url).href,jv=new URL(`../assets/motion-BnhwfHZb.bin`,import.meta.url).href,Mv=new URL(`../assets/material-d7-bi9Ul.json`,import.meta.url).href,Nv=new URL(`../assets/motion-DDlHmGyy.bin`,import.meta.url).href,Pv=new URL(`../assets/material-OkhggZwp.json`,import.meta.url).href,Fv=new URL(`../assets/motion-CDyHjlna.bin`,import.meta.url).href,Iv=new URL(`../assets/material-gOKsJKnV.json`,import.meta.url).href,Lv=new URL(`../assets/motion-cgWG9Gy2.bin`,import.meta.url).href,Rv=new URL(`../assets/material-B0PKwrWL.json`,import.meta.url).href,zv=new URL(`../assets/motion-dBMzdJ6s.bin`,import.meta.url).href,Bv=new URL(`../assets/material-CtaAe_Y3.json`,import.meta.url).href,Vv=new URL(`../assets/motion-GRNG5BYD.bin`,import.meta.url).href,Hv=new URL(`../assets/material-0hlMV-_N.json`,import.meta.url).href,Uv=new URL(`../assets/motion-DiOaFSMm.bin`,import.meta.url).href,Wv=new URL(`../assets/scene-centers-DZ4-6xO8.json`,import.meta.url).href,Gv=new URL(`../assets/material-CokwBZ3w.json`,import.meta.url).href,Kv=new URL(`../assets/motion-BdedR1Uk.bin`,import.meta.url).href,qv=new URL(`../assets/material-DCZjz9LH.json`,import.meta.url).href,Jv=new URL(`../assets/motion--1tcpmc1.bin`,import.meta.url).href,Yv=new URL(`../assets/material-CokwBZ3w.json`,import.meta.url).href,Xv=new URL(`../assets/motion-D1LBZdQ2.bin`,import.meta.url).href,Zv=new URL(`../assets/material-CokwBZ3w.json`,import.meta.url).href,Qv=new URL(`../assets/motion-BczQS-1F.bin`,import.meta.url).href,$v=new URL(`../assets/material-ChWJDhm1.json`,import.meta.url).href,ey=new URL(`../assets/motion-C4QMmkom.bin`,import.meta.url).href,ty=new URL(`../assets/material-CtaAe_Y3.json`,import.meta.url).href,ny=new URL(`../assets/motion-CHmAhP6z.bin`,import.meta.url).href,ry=new URL(`../assets/material-2QcfdizH.json`,import.meta.url).href,iy=new URL(`../assets/motion-BhVwUNJ-.bin`,import.meta.url).href,ay={schema:`bloom.avatar.catalog-centering`,version:1,times:[0,.016666666666666607,.033333333333333215,.04999999999999982,.06666666666666687,.08333333333333348,.10000000000000009,.1166666666666667,.1333333333333333,.1499999999999999,.16666666666666652,.18333333333333313,.20000000000000018,.21666666666666679,.2333333333333334,.25,.2666666666666666,.2833333333333332,.2999999999999998,.3166666666666669,.3333333333333335,.3500000000000001,.3666666666666667,.3833333333333333,.3999999999999999,.4166666666666665,.4333333333333331,.4500000000000002,.4666666666666668,.4833333333333334,.5,.5166666666666666,.5333333333333332,.5499999999999998,.5666666666666669,.5833333333333335,.6000000000000001,.6166666666666667,.6333333333333333,.6499999999999999,.6666666666666665,.6833333333333331,.7000000000000002,.7166666666666668,.7333333333333334,.75,.7666666666666666,.7833333333333332,.7999999999999998,.8166666666666669,.8333333333333335,.8500000000000001,.8666666666666667,.8833333333333333,.8999999999999999,.9166666666666665,.9333333333333331,.9500000000000002,.9666666666666668,.9833333333333334,1,1.0166666666666666,1.0333333333333332,1.0499999999999998,1.0666666666666664,1.083333333333333,1.0999999999999996,1.1166666666666663,1.1333333333333337,1.1500000000000004,1.166666666666667,1.1833333333333336,1.2000000000000002,1.2166666666666668,1.2333333333333334,1.25,1.2666666666666666,1.2833333333333332,1.2999999999999998,1.3166666666666664,1.333333333333333,1.3499999999999996,1.3666666666666663,1.3833333333333337,1.4000000000000004,1.416666666666667,1.4333333333333336,1.4500000000000002,1.4666666666666668,1.4833333333333334,1.5,1.5166666666666666,1.5333333333333332,1.5499999999999998,1.5666666666666664,1.583333333333333,1.5999999999999996,1.6166666666666663,1.6333333333333337,1.6500000000000004,1.666666666666667,1.6833333333333336,1.7000000000000002,1.7166666666666668,1.7333333333333334,1.75,1.7666666666666666,1.7833333333333332,1.7999999999999998,1.8166666666666664,1.833333333333333,1.8499999999999996,1.8666666666666663,1.8833333333333337,1.9000000000000004,1.916666666666667,1.9333333333333336,1.9500000000000002,1.9666666666666668,1.9833333333333334,2,2.0166666666666666,2.033333333333333,2.05,2.0666666666666664,2.083333333333333,2.0999999999999996,2.1166666666666663,2.1333333333333337,2.1500000000000004,2.166666666666667,2.1833333333333336,2.2,2.216666666666667,2.2333333333333334,2.25,2.2666666666666666,2.283333333333333,2.3,2.3166666666666664,2.333333333333333,2.3499999999999996,2.3666666666666663,2.3833333333333337,2.4000000000000004,2.416666666666667,2.4333333333333336,2.45,2.466666666666667,2.4833333333333334,2.5,2.5166666666666666,2.533333333333333,2.55,2.5666666666666664,2.583333333333333,2.5999999999999996,2.6166666666666663,2.6333333333333337,2.6500000000000004,2.666666666666667,2.6833333333333336,2.7,2.716666666666667,2.7333333333333334,2.75,2.7666666666666666,2.783333333333333,2.8,2.8166666666666664,2.833333333333333,2.8499999999999996,2.8666666666666663,2.8833333333333337,2.9000000000000004,2.916666666666667,2.9333333333333336,2.95,2.966666666666667,2.9833333333333334,3,3.0166666666666666,3.033333333333333,3.05,3.0666666666666664,3.083333333333333,3.0999999999999996,3.1166666666666663,3.1333333333333337,3.1500000000000004,3.166666666666667,3.1833333333333336,3.2,3.216666666666667,3.2333333333333334,3.25,3.2666666666666666,3.283333333333333,3.3,3.3166666666666664,3.333333333333333,3.3499999999999996,3.3666666666666663,3.3833333333333337,3.4000000000000004,3.416666666666667,3.4333333333333336,3.45,3.466666666666667,3.4833333333333334,3.5,3.5166666666666666,3.533333333333333,3.55,3.5666666666666664,3.583333333333333,3.5999999999999996,3.6166666666666663,3.6333333333333337,3.6500000000000004,3.666666666666667,3.6833333333333336,3.7,3.716666666666667,3.7333333333333334,3.75,3.7666666666666666,3.783333333333333,3.8,3.8166666666666664,3.833333333333333,3.8499999999999996,3.8666666666666663,3.8833333333333337,3.9000000000000004,3.916666666666667,3.9333333333333336,3.95,3.966666666666667,3.9833333333333334,4],body:[0,0,0,0,.024067955636146988,.08940740733169004,.18499015376120762,.29891213295196545,.4187979547977956,.5324311755444021,.6284954078989037,.6973270855104351,.7315957604420602,.7268464751278334,.6825599825330823,.6235264530029571,.5623151153831175,.49999998398666595,.4376849326568846,.376473600374823,.3174399480758036,.261599023639268,.20987655256746268,.16307998587752046,.12186866726017065,.08672392017177909,.05791998363309156,.03549385378348537,.01921581934636218,.008560002432318683,.0026745790756369124,.0003520851752225982,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,.00010204230218963341,.0007891637896754904,.002573908582395479,.005892752125887523,.011109891013675644,.018520829974091706,.028356134328215443,.040784952923360096,.05591887734657262,.07381528871144502,.09448116883161249,.11787694342091957,.14391975948911742,.17248737124425398,.20342182315949997,.23653294621774446,.27160208901842275,.3083857821621195,.34661939729739333,.3860207741409337,.42629380479549395,.4671322822878349,.5082233114088728,.5492511012049542,.5899006053424581,.6298612131812884,.6688303154105836,.7065169444133192,.7426454773498009,.7769592845289329,.8092244458361574,.8392332976869401,.866808052040261,.8918046089065566,.9141159918750905,.9336762510305114,.9504641647019018,.9645061865834608,.9758810977748448,.9847229503989328,.9912252077158947,.9956437733122117,.9983013018568336,.9995904833359054,.9999775876709754,.9999999676397209,.9999999836530549,.9999999836530549,.9999999836530549,.9999999836530549,.9758674735968946,.9098206372077118,.8113854469309784,.6900878932271668,.5554539238545256,.4170096066713087,.2842808383932622,.16679367520225055,.07407407553207825,.015648021169328667,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],shadow:[0,0,1,.9996479239419584,.9973254017359326,.9914399528438744,.9807842146933557,.9645062026778317,.9420800474357764,.9132760638967249,.8781314341544582,.8369198555603329,.7901233435056332,.7384006068423573,.6825595743713974,.6235270265074055,.5623149497851931,.5,.4376850502148068,.3764729734925945,.3174386778107533,.2615993931576427,.20987796735775385,.16307839662181767,.12186834736831066,.08672322605227374,.057919187893914446,.035494684885919926,.01921550943646857,.008560811826434696,.0026741613096049584,.0003530592055818311,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,.00010137343526607032,.0007900136679355824,.0025727878743388877,.005893641788227398,.011109130250881774,.018519877932401396,.028356596788909047,.040783581698249735,.05591968427418368,.07381384341649451,.09448004166797754,.1178763314002468,.14391881735653037,.17248864792306806,.2034215282220148,.23653218956133268,.2716004068919953,.30838498135078357,.3466202446245862,.38601955458609927,.4262927734723198,.46713228534175083,.5082234829814976,.5492517591786654,.5899007589025103,.6298611183936855,.6688304651642425,.7065169136333288,.7426460563985864,.7769592164183018,.8092248078274275,.8392330924840337,.8668084146942542,.8918043947132006,.9141157265154455,.9336764299771735,.9504642204208046,.9645061890230048,.9758810968256132,.9847229796099569,.9912251897256276,.9956437824875642,.9983012302889842,.9995905122220533,.9999775659727502,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],verification:{bodyError:1.4341103693471524e-8,shadowError:8673617379884035e-34,independentError:1.5480904752562807e-9}},oy={circle:[0,0,.030628085136413574],clippo:[-.042096883058547974,.05092686414718628,.12451113387942314],todd:[.00020810961723327637,-.07642936706542969,756978988647461e-19],rounded_triangle:[-5.960464477539063e-8,19073486328125e-19,.0003063976764678955],capsule:[0,-2.9802322387695312e-8,.03611272573471069],rounded_head_two_ears:[.00048613548278808594,4366040229797363e-20,1436471939086914e-20],six_lobed_flower:[-2.9802322387695312e-8,0,.06110873818397522],heart:[-4.172325134277344e-7,.0001322031021118164,.03524711728096008],four_lobed_butterfly:[-8.940696716308594e-8,4354119300842285e-20,.021767884492874146],circle_two_ears:[43511390686035156e-21,.0001291036605834961,.030456066131591797],twelve_scalloped_rosette:[0,0,.033443719148635864],rounded_cube:[1.7881393432617188e-7,0,.03298333287239075],rounded_diamond:[0,2.9802322387695312e-8,.026502877473831177],slender:[0,-.01748800277709961,.054837703704833984],pocket:[.01331406831741333,0,.0641242265701294],petal:[.02013203501701355,-.01225823163986206,.05670878291130066],star:[-.0007615089416503906,.042151451110839844,.05370610952377319],cloud:[-.006078898906707764,0,.059544503688812256],shield:[0,-.006021618843078613,.05865868926048279],pebble:[.05024704337120056,.028103113174438477,.05215352773666382],squircle:[0,0,.050325602293014526]},sy=Object.assign({"./assets/catalog-computer/capsule/material.json":pv,"./assets/catalog-computer/capsule/motion.bin":mv,"./assets/catalog-computer/centering.json":hv,"./assets/catalog-computer/circle/material.json":gv,"./assets/catalog-computer/circle/motion.bin":_v,"./assets/catalog-computer/circle_two_ears/material.json":vv,"./assets/catalog-computer/circle_two_ears/motion.bin":yv,"./assets/catalog-computer/clippo/material.json":bv,"./assets/catalog-computer/clippo/motion.bin":xv,"./assets/catalog-computer/cloud/material.json":Sv,"./assets/catalog-computer/cloud/motion.bin":Cv,"./assets/catalog-computer/four_lobed_butterfly/material.json":wv,"./assets/catalog-computer/four_lobed_butterfly/motion.bin":Tv,"./assets/catalog-computer/geometry.bin":Ev,"./assets/catalog-computer/geometry.json":Dv,"./assets/catalog-computer/heart/material.json":Ov,"./assets/catalog-computer/heart/motion.bin":kv,"./assets/catalog-computer/pebble/material.json":Av,"./assets/catalog-computer/pebble/motion.bin":jv,"./assets/catalog-computer/petal/material.json":Mv,"./assets/catalog-computer/petal/motion.bin":Nv,"./assets/catalog-computer/pocket/material.json":Pv,"./assets/catalog-computer/pocket/motion.bin":Fv,"./assets/catalog-computer/rounded_cube/material.json":Iv,"./assets/catalog-computer/rounded_cube/motion.bin":Lv,"./assets/catalog-computer/rounded_diamond/material.json":Rv,"./assets/catalog-computer/rounded_diamond/motion.bin":zv,"./assets/catalog-computer/rounded_head_two_ears/material.json":Bv,"./assets/catalog-computer/rounded_head_two_ears/motion.bin":Vv,"./assets/catalog-computer/rounded_triangle/material.json":Hv,"./assets/catalog-computer/rounded_triangle/motion.bin":Uv,"./assets/catalog-computer/scene-centers.json":Wv,"./assets/catalog-computer/shield/material.json":Gv,"./assets/catalog-computer/shield/motion.bin":Kv,"./assets/catalog-computer/six_lobed_flower/material.json":qv,"./assets/catalog-computer/six_lobed_flower/motion.bin":Jv,"./assets/catalog-computer/slender/material.json":Yv,"./assets/catalog-computer/slender/motion.bin":Xv,"./assets/catalog-computer/squircle/material.json":Zv,"./assets/catalog-computer/squircle/motion.bin":Qv,"./assets/catalog-computer/star/material.json":$v,"./assets/catalog-computer/star/motion.bin":ey,"./assets/catalog-computer/todd/material.json":ty,"./assets/catalog-computer/todd/motion.bin":ny,"./assets/catalog-computer/twelve_scalloped_rosette/material.json":ry,"./assets/catalog-computer/twelve_scalloped_rosette/motion.bin":iy}),cy=e=>{let t=sy[`./assets/catalog-computer/${e}`];if(!t)throw Error(`Missing catalog Computer asset: ${e}`);return t},ly=new Map,uy;function dy(e){let t=ly.get(e);return t||(t=Promise.all([Sd(cy(`${e}/motion.bin`)).then(e=>e.arrayBuffer()).then(vl),Sd(cy(`${e}/material.json`)).then(e=>e.json())]).then(([t,n])=>{let r=t;if(r.schema!==`bloom.avatar.catalog-computer`||r.version!==1||r.shape!==e)throw Error(`Invalid catalog Computer identity`);return{document:r,material:n}}).catch(t=>{throw ly.delete(e),t}),ly.set(e,t)),uy??=Promise.all([Sd(cy(`geometry.json`)).then(e=>e.json()),Sd(cy(`geometry.bin`)).then(e=>e.arrayBuffer())]).then(([e,t])=>({manifest:e,binary:t})).catch(e=>{throw uy=void 0,e}),Promise.all([t,uy])}var fy=class extends gl{constructor(e,t,n){super(e),this.centerDelta=t,this.contactShadows=n}sample(e,t){super.sample(e,t);let n=ay.times,r=Math.max(0,Math.min(e,n[n.length-1])),i=0,a=n.length-1;for(;a-i>1;){let e=i+a>>>1;n[e]<=r?i=e:a=e}let o=(r-n[i])/(n[a]-n[i]),s=ay.body[i]+(ay.body[a]-ay.body[i])*o,c=ay.shadow[i]+(ay.shadow[a]-ay.shadow[i])*o;for(let e of t)e.id===`mesh:0`?(e.world.elements[12]-=this.centerDelta[0]*s,e.world.elements[13]-=this.centerDelta[1]*s):this.contactShadows.has(e.id)&&(e.world.elements[12]-=this.centerDelta[0]*c)}};async function py(e,t){let[{document:n,material:r},{manifest:i,binary:a}]=await dy(t),o=structuredClone(r),s=Td(e.source.preset,i,o,a,!0),c=Math.max(...e.source.parts.map(e=>e.id))+1;for(let e of s.parts)e.id+=c,e.activity=`computer`,e.colorRole=e.fields.referencePose?.[3]===-40?`body`:void 0;for(let e of o.parts)e.id+=c;e.source.parts.push(...s.parts),e.source.material.parts.push(...o.parts);let l=e.bindings[0].part,u={...n.clip,parts:n.clip.parts.map(e=>({...e,id:e.id===`mesh:0`?`mesh:0`:`mesh:${c+Number(e.id.split(`:`)[1])}`,fields:e.id===`mesh:0`?{...e.fields,...Object.fromEntries([`paletteBounds`,`furEye0`,`furEye1`].filter(e=>l.fields[e]).map(e=>[e,{value:l.fields[e]}]))}:e.fields}))},d=structuredClone(e.body.sceneBounds);for(let{part:t}of e.bindings)for(let e=0;e<3;e++)d.min[e]=Math.min(d.min[e],t.bounds.min[e]),d.max[e]=Math.max(d.max[e],t.bounds.max[e]);let f=oy[t];if(!f)throw Error(`Missing Computer scene reference: ${t}`);let p=[0,1].map(e=>(d.min[e]+d.max[e])/2-f[e]),m=s.parts.filter(e=>e.fields.referencePose?.[3]===-16).slice(0,2);if(m.length!==2)throw Error(`Missing Computer contact shadows`);return new fy(u,p,new Set(m.map(e=>`mesh:${e.id}`)))}function my(e){return async(t,n,r=!0)=>{if(!t.startsWith(`catalog:`))throw Error(`Unknown avatar asset: ${t}`);let i=JSON.parse(t.slice(8));if(!i||[`shape`,`eyes`,`eyewear`,`accessory`].some(e=>typeof i[e]!=`string`))throw Error(`Invalid avatar catalog recipe`);let a=await fv(i,n);try{let{samplers:t,eyeProfiles:o}=await e(a,n,r?await py(a,i.shape):void 0);if(!t.idle||!t.reaction||r&&!t.work)throw Error(`Incomplete avatar catalog animation`);if(i.previewPart===`eyes`){let e=new Set(a.bindings.filter(e=>e.part.category===`eyes`).map(e=>e.part));a.source.parts=a.source.parts.filter(t=>e.has(t)?!0:(t.geometry.dispose(),!1))}return{source:a.source,samplers:t,eyeProfiles:o}}catch(e){for(let e of a.source.parts)e.geometry.dispose();throw e}}}var hy=new URL(`../assets/catalog-motion-alfred-base-Ctzdi_7K.bin`,import.meta.url).href,gy=new URL(`../assets/catalog-motion-blue_beret-base-D8Y-uCtk.bin`,import.meta.url).href,_y=new URL(`../assets/catalog-motion-blue_spectacles-base-DDz1XIoI.bin`,import.meta.url).href,vy=new URL(`../assets/catalog-motion-clippo-special-low-base-BnkmR-AL.bin`,import.meta.url).href,yy=new URL(`../assets/catalog-motion-clippo-special-base-BGfgU8ux.bin`,import.meta.url).href,by=new URL(`../assets/catalog-motion-coral_monocle-base-D-2vrHOI.bin`,import.meta.url).href,xy=new URL(`../assets/catalog-motion-gus-base-Ds3Beaol.bin`,import.meta.url).href,Sy=new URL(`../assets/catalog-motion-lime_frog-base-D6nXfWMf.bin`,import.meta.url).href,Cy=new URL(`../assets/catalog-motion-lime_headphones-base-CMdc-mXT.bin`,import.meta.url).href,wy=new URL(`../assets/catalog-motion-purple_heart-base-DQ1liTyD.bin`,import.meta.url).href,Ty=new URL(`../assets/catalog-motion-alfred-work-D5qAkCuL.bin`,import.meta.url).href,Ey=new URL(`../assets/catalog-motion-blue_beret-work-uptd_BN1.bin`,import.meta.url).href,Dy=new URL(`../assets/catalog-motion-blue_spectacles-work-CTqSQlG8.bin`,import.meta.url).href,Oy=new URL(`../assets/catalog-motion-clippo-special-low-work-DW-rQa_7.bin`,import.meta.url).href,ky=new URL(`../assets/catalog-motion-clippo-special-work-CasComgJ.bin`,import.meta.url).href,Ay=new URL(`../assets/catalog-motion-coral_monocle-work-P_IC3vRk.bin`,import.meta.url).href,jy=new URL(`../assets/catalog-motion-gus-work-BDfVf6WQ.bin`,import.meta.url).href,My=new URL(`../assets/catalog-motion-lime_frog-work-C6lB2L7L.bin`,import.meta.url).href,Ny=new URL(`../assets/catalog-motion-lime_headphones-work-eRVCqhkX.bin`,import.meta.url).href,Py=new URL(`../assets/catalog-motion-purple_heart-work-Duol7J0V.bin`,import.meta.url).href;function Fy(e){if(e.part.category===`accessory`&&e.sourcePart.selection===`felipe_beret`){e.preserveMaterial=!0,e.part.universal=e.sourcePart.universal,e.preserveFields=[...new Set([...e.preserveFields??[],`colorRoughness`,`parameters`])];for(let t of[`colorRoughness`,`parameters`])e.part.fields[t]=[...e.sourcePart.fields[t]]}}var Iy=[`catalogSizeL0`,`catalogSizeL1`,`catalogSizeL2`,`catalogSizeL3`],Ly=[`catalogSizeQ0`,`catalogSizeQ1`,`catalogSizeQ2`,`catalogSizeQ3`],Ry=class extends gl{constructor(e,t,n,r,i){if(!e.clip.parts.find(e=>e.id===`mesh:0`))throw Error(`Catalog observations require an explicit body frame`);let a=t.map(e=>({id:e.targetId,translation:{value:[0,0,0]},rotation:{value:[0,0,0,1]},scale:{value:[1,1,1]},fields:Object.fromEntries(Object.entries(e.fields).filter(([,e])=>e.length===4).map(([e,t])=>[e,{value:t}]))}));for(let e of i?.clip.parts??[]){let t=a.find(t=>t.id===e.id);t?t.fields={...t.fields,...e.fields}:a.push(e)}if(i?.clip.parts.some(e=>`camera`in e.fields))for(let e of a)e.fields.camera??={value:[1,1,0,1]};let o=i?.clip??e.clip;super({...o,parts:a}),this.observed=e,this.base=i,this.baseBodyIndex=-1,this.body=new Y,this.normal=new Y,this.sourceInverse=new Y,this.sourceNormalInverse=new Y,this.local=new Y,this.localNormal=new Y,this.linear=new Y,this.sizeDelta=new Y,this.semantic=new K,this.parentTurn=new Y,this.eyeTurn=new Y,this.pivotInParent=new K,this.transformed=new K,this.displacement=new K;for(let e of[n,r])if(!Number.isFinite(e.ground)||!Number.isFinite(e.height)||e.height<=0)throw Error(`Invalid catalog retarget dimensions`);if(this.centerDelta=r.ground+r.height/2-(n.ground+n.height/2),this.heightRatio=r.height/n.height,this.targetBodyIndex=this.clip.parts.findIndex(e=>e.id===`mesh:0`),this.bodyPigmentTargets=t.filter(e=>e.inheritBodyPigment).map(e=>this.clip.parts.findIndex(t=>t.id===e.targetId)),this.bodyPigmentTargets.length&&(this.targetBodyIndex<0||!this.clip.parts[this.targetBodyIndex].fields.colorRoughness||this.bodyPigmentTargets.some(e=>e<0||!this.clip.parts[e].fields.colorRoughness)))throw Error(`Body pigment inheritance requires explicit RGB channels`);if(this.sourcePose=e.createPose(),this.sourceBodyIndex=this.sourcePose.findIndex(e=>e.id===`mesh:0`),this.basePose=i?.createPose(),this.basePose){if(this.baseBodyIndex=this.basePose.findIndex(e=>e.id===`mesh:0`),this.baseBodyIndex<0)throw Error(`Catalog activity requires its captured body frame`);if(i.clip.duration>e.clip.duration+1e-9)throw Error(`Catalog activity exceeds observed attachment timeline`)}this.mappings=t.map(t=>{let n=this.sourcePose.findIndex(e=>e.id===t.sourceId),r=this.clip.parts.findIndex(e=>e.id===t.targetId);if(n<0||r<0)throw Error(`Missing observed catalog motion binding`);if(t.sourcePivot.length!==3||t.targetPivot.length!==3||![...t.sourcePivot,...t.targetPivot].every(Number.isFinite))throw Error(`Invalid catalog motion pivot`);let i=new K().fromArray(t.sourcePivot),a=t.geometryTransform.elements[1]!==0||t.geometryTransform.elements[4]!==0?t.geometryTransform.clone().setPosition(0,0,0):void 0;if(t.attachmentAnchor&&(t.category!==`accessory`||t.attachmentAnchor.length!==3||!t.attachmentAnchor.every(Number.isFinite)))throw Error(`Invalid catalog attachment anchor`);return{source:n,parent:this.sourcePose.findIndex(e=>e.id===(t.sourceParentId??`mesh:0`)),sourceSceneCenter:t.sourceSceneCenter??[0,0],target:r,category:t.category,pivot:i,shift:new K().fromArray(t.targetPivot).sub(i),fit:t.geometryTransform.clone(),sizeDelta:Math.cbrt(t.geometryTransform.determinant())-1,eyeHeightRatio:t.eyeHeightRatio??this.heightRatio,attachmentAnchor:t.attachmentAnchor?new K().fromArray(t.attachmentAnchor):void 0,inverseFit:t.geometryTransform.clone().invert(),normalFit:a,inverseNormalFit:a?.clone().invert(),sceneCenterDelta:t.sceneCenterDelta??[0,0],defaults:Object.entries(t.fields).filter(([,e])=>e.length===4),animated:Object.entries(e.clip.parts[n].fields).filter(([e,n])=>`samples`in n&&t.fields[e]?.length===4&&!t.preserveFields?.includes(e)).map(([e])=>e)}}),this.baseMappings=(this.basePose??[]).map((e,t)=>({source:t,target:this.clip.parts.findIndex(t=>t.id===e.id),fields:Object.keys(e.fields)}))}sample(e,t){if(!Number.isFinite(e)||t.length!==this.clip.parts.length)throw Error(`Invalid catalog motion output`);this.observed.sample(e,this.sourcePose);let n=this.sourcePose[this.sourceBodyIndex];if(this.sourceInverse.copy(n.world).invert(),this.sourceNormalInverse.copy(n.normalMatrix).invert(),this.base&&this.basePose){this.base.sample(e,this.basePose);let t=this.basePose[this.baseBodyIndex];this.body.copy(t.world),this.normal.copy(t.normalMatrix)}else{this.body.copy(n.world),this.normal.copy(n.normalMatrix);let e=this.body.elements;e[12]-=e[4]*this.centerDelta,e[13]+=(Math.hypot(e[4],e[5],e[6])-e[5])*this.centerDelta,e[14]-=e[6]*this.centerDelta}for(let e of this.mappings){let n=this.sourcePose[e.source],r=t[e.target];if(r.id!==this.clip.parts[e.target].id)throw Error(`Catalog pose identity changed`);if(e.category===`body`)r.world.copy(this.body),r.normalMatrix.copy(this.normal);else{let t=this.sourcePose[e.parent];this.sourceInverse.copy(t.world).invert(),this.sourceNormalInverse.copy(t.normalMatrix).invert();let i=n.fields.catalogCenterWeight?.[0]??0;if(this.local.copy(n.world),this.local.elements[12]+=e.sourceSceneCenter[0]*i,this.local.elements[13]+=e.sourceSceneCenter[1]*i,this.local.premultiply(this.sourceInverse),this.localNormal.copy(this.sourceNormalInverse).multiply(n.normalMatrix),e.category===`eyes`&&this.base&&n.fields.catalogAnchorX){let t=n.fields.catalogAnchorX,r=n.fields.catalogAnchorY,i=n.fields.catalogAnchorZ;if(this.displacement.set(t[0]*e.shift.x+r[0]*e.shift.y+i[0]*e.shift.z,t[1]*e.shift.x+r[1]*e.shift.y+i[1]*e.shift.z,t[2]*e.shift.x+r[2]*e.shift.y+i[2]*e.shift.z),n.fields.catalogSizeL0&&e.sizeDelta!==0){let t=this.sizeDelta.elements,r=e.sizeDelta;for(let e=0;e<4;e++){let i=n.fields[Iy[e]],a=n.fields[Ly[e]];for(let n=0;n<4;n++)t[e*4+n]=i[n]*r+a[n]*r*r}this.displacement.x+=t[12]-t[0]*e.shift.x-t[4]*e.shift.y-t[8]*e.shift.z,this.displacement.y+=t[13]-t[1]*e.shift.x-t[5]*e.shift.y-t[9]*e.shift.z,this.displacement.z+=t[14]-t[2]*e.shift.x-t[6]*e.shift.y-t[10]*e.shift.z,this.linear.copy(this.local).setPosition(0,0,0).transpose().multiply(this.localNormal),t[12]=t[13]=t[14]=0,this.sizeDelta.premultiply(this.sourceInverse);for(let e=0;e<16;e++)this.local.elements[e]+=t[e];this.localNormal.copy(this.local).setPosition(0,0,0).invert().transpose().multiply(this.linear)}this.displacement.applyMatrix4(this.linear.copy(this.sourceInverse).setPosition(0,0,0));let a=this.local.elements;a[12]+=this.displacement.x,a[13]+=this.displacement.y,a[14]+=this.displacement.z}else if(e.category===`eyes`){this.eyeTurn.makeBasis(this.semantic.set(n.world.elements[0],n.world.elements[1],n.world.elements[2]).normalize(),this.transformed.set(n.world.elements[4],n.world.elements[5],n.world.elements[6]).normalize(),this.displacement.set(n.world.elements[8],n.world.elements[9],n.world.elements[10]).normalize()),this.parentTurn.copy(this.sourceInverse).setPosition(0,0,0),this.linear.copy(this.local).setPosition(0,0,0),this.pivotInParent.copy(e.pivot).applyMatrix4(this.eyeTurn).applyMatrix4(this.parentTurn),this.semantic.copy(e.pivot).applyMatrix4(this.linear).sub(this.pivotInParent).add(this.displacement.setFromMatrixPosition(this.local)),this.transformed.copy(e.shift).applyMatrix4(this.linear),this.displacement.copy(e.shift).applyMatrix4(this.eyeTurn).applyMatrix4(this.parentTurn);let t=this.local.elements;t[12]+=this.semantic.x*(e.eyeHeightRatio-1)+this.displacement.x-this.transformed.x,t[13]+=this.semantic.y*(e.eyeHeightRatio-1)+this.displacement.y-this.transformed.y,t[14]+=this.displacement.z-this.transformed.z}else this.local.premultiply(e.fit).multiply(e.inverseFit),e.normalFit&&this.localNormal.premultiply(e.normalFit).multiply(e.inverseNormalFit);e.attachmentAnchor&&(this.linear.copy(this.local).setPosition(0,0,0),this.transformed.copy(e.attachmentAnchor).applyMatrix4(this.linear),this.displacement.copy(e.attachmentAnchor).sub(this.transformed),this.local.setPosition(this.displacement)),r.world.copy(this.body).multiply(this.local),r.normalMatrix.copy(this.normal).multiply(this.localNormal),r.world.elements[12]+=(e.sceneCenterDelta[0]-e.sourceSceneCenter[0])*(e.attachmentAnchor?0:i),r.world.elements[13]+=(e.sceneCenterDelta[1]-e.sourceSceneCenter[1])*(e.attachmentAnchor?0:i)}for(let[t,n]of e.defaults){let e=r.fields[t];for(let t=0;t<4;t++)e[t]=n[t]}for(let t of e.animated){let e=r.fields[t],i=n.fields[t];for(let t=0;t<4;t++)e[t]=i[t]}}if(this.basePose){for(let e of this.baseMappings){let n=this.basePose[e.source],r=t[e.target];r.world.copy(n.world),r.normalMatrix.copy(n.normalMatrix);for(let t of e.fields)for(let e=0;e<4;e++)r.fields[t][e]=n.fields[t][e]}let e=this.basePose[this.baseBodyIndex].fields.camera;if(e)for(let n of t)for(let t=0;t<4;t++)n.fields.camera[t]=e[t]}if(this.bodyPigmentTargets.length){let e=t[this.targetBodyIndex].fields.colorRoughness;for(let n of this.bodyPigmentTargets){let r=t[n].fields.colorRoughness;for(let t=0;t<3;t++)r[t]=e[t]}}}},zy=Object.assign({"./assets/catalog-motion/alfred.bin":hy,"./assets/catalog-motion/blue_beret.bin":gy,"./assets/catalog-motion/blue_spectacles.bin":_y,"./assets/catalog-motion/clippo-special-low.bin":vy,"./assets/catalog-motion/clippo-special.bin":yy,"./assets/catalog-motion/coral_monocle.bin":by,"./assets/catalog-motion/gus.bin":xy,"./assets/catalog-motion/lime_frog.bin":Sy,"./assets/catalog-motion/lime_headphones.bin":Cy,"./assets/catalog-motion/purple_heart.bin":wy}),By=Object.assign({"./assets/catalog-motion/alfred.bin":Ty,"./assets/catalog-motion/blue_beret.bin":Ey,"./assets/catalog-motion/blue_spectacles.bin":Dy,"./assets/catalog-motion/clippo-special-low.bin":Oy,"./assets/catalog-motion/clippo-special.bin":ky,"./assets/catalog-motion/coral_monocle.bin":Ay,"./assets/catalog-motion/gus.bin":jy,"./assets/catalog-motion/lime_frog.bin":My,"./assets/catalog-motion/lime_headphones.bin":Ny,"./assets/catalog-motion/purple_heart.bin":Py}),Vy=new Map;async function Hy(e,t){let n=`${e}:${t?`work`:`base`}`,r=Vy.get(n);return r||(r=(async()=>{let n=(t?By:zy)[`./assets/catalog-motion/${e}.bin`];if(!n)throw Error(`Missing semantic catalog motion ${e}`);let r=await fetch(n);if(!r.ok)throw Error(`Catalog motion HTTP ${r.status}`);let i=vl(await r.arrayBuffer());if(i.schema!==`bloom.avatar.catalog-motion-library`||i.version!==1||i.preset!==e||!i.materialCalibrated)throw Error(`Unvalidated catalog motion library`);return i})().catch(e=>{throw Vy.delete(n),e}),Vy.set(n,r)),r}async function Uy(e,t){let n=await Hy(e,!1);if(!t)return n;let r=await Hy(e,!0);if(r.rigs.length!==n.rigs.length||r.workNativeStart!==n.workNativeStart)throw Error(`Catalog work does not match the base rig`);return{...n,rigs:n.rigs.map((e,t)=>{let n=r.rigs[t]?.work;if(!n)throw Error(`Missing catalog work rig`);return{...e,work:n}})}}function Wy(e,t){return`${e?`fur`:`mesh`}:${t}`}async function Gy(e,t,n=!0){let r=await Uy(e.body.signaturePreset,n);if(!e.bindings.some(({part:t,sourcePart:n})=>t.category===`eyes`&&!n.selection&&(e.body.body.attachment===`metal`||e.body.body.label===`metal`)))return r;let i=await Uy(t===`high`?`clippo-special`:`clippo-special-low`,n);if(e.body.signaturePreset!==`lime_frog`)throw Error(`Unobserved asymmetric Clippo signature`);return{...r,rigs:[...r.rigs,...i.rigs]}}async function Ky(e,t){let n=[],r=structuredClone(e.body.sceneBounds);for(let{part:t}of e.bindings)for(let e=0;e<3;e++)r.min[e]=Math.min(r.min[e],t.bounds.min[e]),r.max[e]=Math.max(r.max[e],t.bounds.max[e]);let i=[0,1].map(e=>(r.min[e]+r.max[e])/2),a=[];for(let r of e.bindings){Fy(r);let{part:o,sourcePart:s}=r,c=o.category===`body`,l=!s.selection&&o.category===`eyes`&&(e.body.body.attachment===`metal`||e.body.body.label===`metal`),u=l?`clippo-special`:s.selection,d=0,f=t.rigs[0].parts[0];if(!c){let e=!1;for(let n=0;n<t.rigs.length;n++){let r=t.rigs[n].parts.find(e=>e.category===o.category&&e.selection===u&&e.sourcePart===s.id);if(r){d=n,f=r,e=!0;break}}if(!e)throw Error(`Missing catalog observation ${o.category}/${s.selection}/${s.id}`)}let p=Wy(!!o.fur,f.id),m=c?p:`${p}@${d}`;a.push({rig:d,id:p,merged:m});let h=t.rigs[d].idle.parts.find(e=>e.id===p);if(!h)throw Error(`Missing catalog material observation`);if(!c)for(let[e,t]of Object.entries(h.fields)){if(r.preserveFields?.includes(e))continue;let n=`value`in t?t.value:t.samples;o.fields[e]=Array.from(n.slice(0,4))}r.preserveMaterial||(o.universal=t.rigs[d].render[p].universal);let g=e.source.material.parts.find(e=>e.id===o.id);g&&(g.fields=o.fields,g.universal=o.universal);let _=(await uv(c||l?`body`:o.category,c?`circle`:l?`clippo`:u,t.rigs[d].sourceDetail??`high`)).pieces.find(e=>e.id===f.sourcePart&&!!e.fur==!!o.fur);if(!_)throw Error(`Missing catalog motion source anchor`);n.push({sourceId:m,inheritBodyPigment:o.attachment===`three_lobe`,sourceParentId:d?`mesh:parent${d}`:`mesh:0`,eyeHeightRatio:l?1:void 0,attachmentAnchor:o.category===`accessory`?o.attachmentPivot??void 0:void 0,sourceSceneCenter:t.rigs[d].sceneCenter,targetId:Wy(!!o.fur,o.id),category:o.category,sourcePivot:_.pivot,targetPivot:o.pivot,geometryTransform:r.transform,fields:o.fields,preserveFields:r.preserveFields,sceneCenterDelta:t.rigs[d].sceneCenter.map((e,t)=>e-i[t])})}let o=e.source.parts.find(e=>e.id===0&&!e.fur).fields.colorRoughness;for(let{part:t}of e.bindings)if(t.attachment===`three_lobe`){let e=t.fields.colorRoughness;for(let t=0;t<3;t++)e[t]=o[t]}return{bindings:n,merge:e=>{let n=t.rigs[0][e];if(!n)throw Error(`Missing catalog ${e} observation`);let r=a.map(({rig:r,id:i,merged:a})=>{let o=t.rigs[r][e];if(!o)throw Error(`Missing catalog ${e} rig`);if(o.duration!==n.duration||o.times.length!==n.times.length||!o.times.every((e,t)=>e===n.times[t]))throw Error(`Catalog observation clocks differ`);let s=o.parts.find(e=>e.id===i);if(!s)throw Error(`Missing catalog channel ${i}`);return{...s,id:a}});for(let n of new Set(a.map(e=>e.rig))){if(n===0)continue;let i=t.rigs[n][e]?.parts.find(e=>e.id===`mesh:0`);if(!i)throw Error(`Missing catalog rig parent`);r.push({...i,id:`mesh:parent${n}`})}if(!r.some(e=>e.id===`mesh:0`))throw Error(`Missing catalog parent frame`);return new gl({...n,parts:r})},dimensions:{ground:t.rigs[0].sourceGround,height:t.rigs[0].sourceHeight},destination:{ground:e.body.body.bounds.min[1],height:e.body.body.bounds.max[1]-e.body.body.bounds.min[1]}}}async function qy(e,t,n){let r=await Gy(e,t,!!n),i=await Ky(e,r),a=(e,t)=>new Ry(i.merge(e),i.bindings,i.dimensions,i.destination,t),o=a(`idle`),s=a(`reaction`),c=n?a(`work`,n):void 0,l=e=>((e-r.idleNativeStart)%o.clip.duration+o.clip.duration)%o.clip.duration;return{samplers:{idle:o,reaction:s,work:c,reactionReturnTime:l(r.rigs[0].returnNativeTime),workReturn:c?{time:c.clip.duration,idleTime:l(r.workNativeStart+c.clip.duration)}:void 0},eyeProfiles:{}}}var Jy=new Set,Yy=e=>{let t=e.clientWidth;return t<=64?64:t<=128?128:320},Xy=()=>new DOMException(`Avatar attachment aborted`,`AbortError`),Zy=class{constructor(e,n){this.stage=document.createElement(`canvas`),this.entries=[],this.limit=1,this.recovering=!1,this.sequence=0,this.onVisibility=()=>{document.hidden&&this.cpuPresenter?.cancelPending()},this.presentations=new Set,this.presentation={webgpuFrames:0,pboFrames:0,directFrames:0,completed:0,maximumPending:0},this.columns=1,this.disposed=!1,this.failed=!1,this.cell=e,this.stage.dataset.avatarRenderer=`shared-editor-scene`,this.stage.setAttribute(`aria-hidden`,`true`),this.stage.style.cssText=`position:fixed;left:0;top:0;width:${e}px;height:${e}px;opacity:0;pointer-events:none`,document.body.append(this.stage);try{this.engine=new Md(this.stage,{count:1,size:e,preset:n,lazyWork:!0,resolveAsset:my(qy),onFrame:()=>this.paint(),onError:()=>this.fail()})}catch(e){throw this.stage.remove(),e}let r=this.stage.getContext(`webgl2`),i=r.getParameter(r.MAX_VIEWPORT_DIMS),a=Math.min(r.getParameter(r.MAX_TEXTURE_SIZE),r.getParameter(r.MAX_RENDERBUFFER_SIZE),i[0],i[1]);this.limit=Math.min(200,Math.max(1,Math.floor(a/512))**2),document.addEventListener(`visibilitychange`,this.onVisibility),this.observer=new IntersectionObserver(e=>{for(let n of e){let e=this.entries.findIndex(e=>e?.canvas===n.target),r=this.entries[e];r&&(r.visible!==n.isIntersecting&&r.revision++,r.visible=n.isIntersecting,r.ready&&(this.engine.setInstancePaused(e,t(r.props)||!r.visible),this.engine.setInstanceRendering(e,r.visible&&(!t(r.props)||r.dirty||!r.painted))))}})}initializePresenter(e=!1){return this.presenterReady?this.presenterReady:!e&&this.entries.filter(Boolean).length<2?Promise.resolve():(this.presenterReady=lf(()=>this.fail(),e=>{if(!(this.disposed||this.failed)){this.recovering=e;for(let[t,n]of this.entries.entries())n?.target&&(n.revision++,n.dirty=!0,!e&&n.ready&&n.visible&&this.engine.setInstanceRendering(t,!0));this.updateCapacity()}}).then(e=>{if(!e)return;if(this.disposed||this.failed){e.dispose();return}let t=Math.min(this.limit,Math.max(1,Math.floor(e.maxTextureDimension2D/512))**2);this.entries.length>t?e.dispose():(this.limit=t,this.presenter=e)}),this.presenterReady)}get capacity(){return this.limit}updateCapacity(){this.engine.setPresentationCapacity(!this.recovering&&this.presentations.size<2)}fail(){if(!(this.disposed||this.failed)){this.failed=!0;for(let e of[...this.entries])try{e?.onRenderError?.()}catch(e){queueMicrotask(()=>{throw e})}}}get available(){return!this.disposed&&!this.failed&&(this.entries.length<this.capacity||this.entries.some(e=>!e))}layout(){if(this.disposed)return;let e=Math.max(1,this.entries.length);this.columns=Math.ceil(Math.sqrt(e)),this.stage.style.width=`${this.columns*this.cell}px`,this.stage.style.height=`${Math.ceil(e/this.columns)*this.cell}px`,this.engine.setCount(e),this.entries.forEach((e,t)=>{e&&(e.dirty=!0,e.revision++,e.ready&&e.visible&&this.engine.setInstanceRendering(t,!0))})}resolution(){return this.disposed?Promise.resolve():(this.resizing||=(async()=>{for(;!this.disposed;){let e=Math.max(64,...this.entries.filter(e=>!!e).map(e=>e.size));if(e===this.cell)return;this.cell=e,this.layout(),await this.engine.setSize(e)}})().finally(()=>{this.resizing=void 0}),this.resizing)}release(e,t){if(this.entries[e]===t){for(this.observer.unobserve(t.canvas),t.target&&this.presenter?.release(t.target),this.engine.setInstancePaused(e,!0),this.engine.setInstanceRendering(e,!1),this.entries[e]=void 0;this.entries.length&&!this.entries[this.entries.length-1];)this.entries.pop();this.entries.length?this.layout():(this.disposed=!0,this.observer.disconnect(),document.removeEventListener(`visibilitychange`,this.onVisibility),this.engine.dispose(),this.cpuPresenter?.dispose(),this.presenter?.dispose(),this.stage.remove(),Jy.delete(this))}}paint(){if(this.disposed||this.failed||this.recovering)return;let e=this.stage.width,n=this.stage.height,r=++this.sequence,i=e/this.columns,a=Math.min(devicePixelRatio||1,2),o=this.entries.flatMap((o,s)=>{if(!o?.ready||!o.visible||t(o.props)&&o.painted&&!o.dirty)return[];let c=Math.max(1,Math.round(o.width*a)),l=Math.max(1,Math.round(o.height*a));o.context&&(o.canvas.width!==c&&(o.canvas.width=c),o.canvas.height!==l&&(o.canvas.height=l));let u=o.revision;return[{entry:o,index:s,width:c,height:l,isCurrent:()=>!this.disposed&&!this.failed&&this.entries[s]===o&&o.revision===u&&r>=o.delivered&&this.stage.width===e&&this.stage.height===n&&o.ready&&o.visible&&o.canvas.width===c&&o.canvas.height===l,sourceX:s%this.columns*i,sourceY:Math.floor(s/this.columns)*i}]}),s=e=>{if(!e.isCurrent())return;let{entry:n,index:i}=e;if(n.delivered=r,n.dirty=!1,t(n.props)&&this.engine.setInstanceRendering(i,!1),!n.painted){n.painted=!0;try{n.onReady?.()}catch(e){queueMicrotask(()=>{throw e})}}},c=o.filter(e=>e.entry.context&&e.width*e.height<=16384),l=c.length>=4?c:[],u=o.filter(e=>e.entry.target),d=new Set([...l,...u]),f=[];try{l.length&&(this.cpuPresenter??=uf(),this.presentation.pboFrames++,f.push(this.cpuPresenter.present(this.stage,l.map(e=>({context:e.entry.context,sourceX:e.sourceX,sourceY:e.sourceY,sourceWidth:i,sourceHeight:i,destinationWidth:e.width,destinationHeight:e.height,isCurrent:e.isCurrent,onPresented:()=>{e.entry.delivered=r}}))).then(e=>(e&&l.forEach(s),e)))),u.length&&this.presenter&&(this.presentation.webgpuFrames++,f.push(this.presenter.present(this.stage,u.map(e=>({target:e.entry.target,sourceX:e.sourceX,sourceY:e.sourceY,sourceWidth:i,sourceHeight:i,destinationWidth:e.width,destinationHeight:e.height}))).then(e=>(e&&u.forEach(s),e))));let e=!1;for(let t of o){if(d.has(t)||!t.entry.context)continue;let n=t.entry.context;n.clearRect(0,0,t.width,t.height),n.drawImage(this.stage,t.sourceX,t.sourceY,i,i,0,0,t.width,t.height),s(t),e=!0}e&&this.presentation.directFrames++}catch{Promise.all(f).catch(()=>{}),this.fail();return}if(!f.length)return;let p;p=Promise.all(f).then(e=>{e.some(Boolean)&&this.presentation.completed++}).catch(()=>this.fail()).finally(()=>{this.presentations.delete(p),!this.disposed&&!this.failed&&this.updateCapacity()}),this.presentations.add(p),this.presentation.maximumPending=Math.max(this.presentation.maximumPending,this.presentations.size),this.updateCapacity()}async attach(n,r,i,a,o,s){if(s?.aborted)throw Xy();let c=this.entries.findIndex(e=>!e);if(c<0&&(c=this.entries.length),!this.available||c>=this.capacity)throw Error(`Editor scene capacity exceeded`);let l={canvas:n,revision:0,delivered:0,props:r,ready:!1,visible:!0,dirty:!0,painted:!1,size:Yy(n),width:n.clientWidth,height:n.clientHeight,onReady:a};this.entries[c]=l;let u=!1,d=()=>{},f,p,m=new Promise((e,t)=>{p=t});m.catch(()=>{});let h=()=>{u||(u=!0,s?.removeEventListener(`abort`,g),d(),f?.disconnect(),this.release(c,l),p?.(Xy()))},g=()=>h();l.onRenderError=()=>{u||(h(),o?.())},s?.addEventListener(`abort`,g,{once:!0});let _=e=>Promise.race([e,m]);try{if(await _(this.engine.loaded),await _(this.initializePresenter()),this.failed)throw Error(`Avatar presentation unavailable`);if(l.target=this.presenter?.attach(n)??void 0,!l.target&&(l.context=n.getContext(`2d`)??void 0,!l.context&&(await _(this.initializePresenter(!0)),l.target=this.presenter?.attach(n)??void 0,!l.target)))throw Error(`Editor canvas unavailable`);this.layout(),await _(this.resolution()),await _(this.engine.setPreset(c,i.preset)),this.engine.resetAppearance(c),this.engine.idle(c);let a=!1,s=!1,p={enabled:!!r.interactive&&!t(r),onTap:()=>this.engine.react(c)},m=(e,t)=>{let r=n.getBoundingClientRect();return[c%this.columns*this.cell+e*this.cell/Math.max(1,r.width),Math.floor(c/this.columns)*this.cell+t*this.cell/Math.max(1,r.height)]};d=df(n,{hitTest:(e,t)=>this.engine.hitTest(...m(e,t)),beginPointer:(e,t)=>{let n=this.engine.beginPointer(...m(e,t));return a=n===c,n},point:(e,t)=>{e===-1&&t===-1?(s&&this.engine.point(-1,-1),s=!1):(s=!0,this.engine.point(...m(e,t)))},endPointer:(e,t)=>{a&&(a=!1,e===void 0||t===void 0?this.engine.endPointer():this.engine.endPointer(...m(e,t)))}},p);let{update:g,setPresentation:v}=e(this.engine,c,l,i,{isDisposed:()=>u,wait:_,dispose:h,onPresentation:e=>{l.revision++,p.enabled=!!e.interactive&&!t(e)}});return await g(r,i),this.observer.observe(n),f=new ResizeObserver(([e])=>{u||(l.width=e?.contentRect.width??n.clientWidth,l.height=e?.contentRect.height??n.clientHeight,l.size=Yy(n),l.dirty=!0,l.revision++,this.resolution().then(()=>{u||(this.engine.setInstancePaused(c,t(l.props)||!l.visible),this.engine.setInstanceRendering(c,l.visible))}).catch(()=>{u||(h(),o?.())}))}),f.observe(n),{update:g,setPresentation:v,dispose:h}}catch(e){throw h(),e}}};async function Qy(e,t,n,r,i,a){if(a?.aborted)throw Xy();let o=Yy(e),s=[...Jy].find(e=>e.cell===o&&e.available);return s||(s=new Zy(o,n.preset),Jy.add(s)),s.attach(e,t,n,r,i,a)}function $y(){return[...Jy].map(e=>({cell:e.cell,capacity:e.capacity,avatars:e.entries.filter(Boolean).length,pending:e.entries.filter(e=>e&&!e.ready).length,activeIndices:e.entries.flatMap((e,t)=>e?[t]:[]),presentation:{...e.presentation,webgpuTargets:e.entries.filter(e=>e?.target).length,canvas2dTargets:e.entries.filter(e=>e?.context).length},stats:e.engine.stats()}))}export{Qy as attachEditorAvatar,$y as editorPoolDiagnostics};