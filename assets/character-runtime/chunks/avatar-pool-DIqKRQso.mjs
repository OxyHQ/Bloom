import{a as zn,c as Lc}from"../runtime.mjs";const Ws="186",Pc=0,_o=1,Dc=2,Dr=1,Uc=2,ki=3,Fn=0,Ft=1,cn=2,dn=0,Hi=1,yo=2,xo=3,bo=4,Ic=5,xi=100,Nc=101,Fc=102,Bc=103,Oc=104,zc=200,kc=201,Gc=202,Vc=203,Pl=204,Dl=205,Hc=206,Wc=207,Xc=208,jc=209,qc=210,Yc=211,$c=212,Kc=213,Zc=214,Ka=0,Za=1,Ja=2,Yi=3,Qa=4,es=5,ts=6,ns=7,Ul=0,Jc=1,Qc=2,fn=0,Il=1,Nl=2,Fl=3,Bl=4,Ol=5,zl=6,kl=7,Gl=300,$n=301,Ti=302,ca=303,ua=304,ea=306,is=1e3,Xt=1001,rs=1002,gt=1003,e0=1004,ar=1005,wt=1006,ha=1007,jn=1008,Nt=1009,Vl=1010,Hl=1011,$i=1012,ta=1013,qt=1014,Lt=1015,pn=1016,Xs=1017,js=1018,Ki=1020,Wl=35902,Xl=35899,jl=1021,ql=1022,Pt=1023,Rn=1026,qn=1027,na=1028,qs=1029,Kn=1030,Ys=1031,$s=1033,Ur=33776,Ir=33777,Nr=33778,Fr=33779,as=35840,ss=35841,os=35842,ls=35843,cs=36196,us=37492,hs=37496,ds=37488,fs=37489,Gr=37490,ps=37491,ms=37808,vs=37809,gs=37810,_s=37811,ys=37812,xs=37813,bs=37814,ws=37815,Ss=37816,Ms=37817,Es=37818,Rs=37819,Ts=37820,As=37821,Cs=36492,Ls=36494,Ps=36495,Ds=36283,Us=36284,Vr=36285,Is=36286,t0=3200,wo=0,n0=1,bn="",Wt="srgb",Zi="srgb-linear",Hr="linear",Qe="srgb",da=7680,i0=519,r0=512,a0=513,s0=514,ia=515,o0=516,l0=517,Ks=518,c0=519,Yl=35044,fa=35048,Mi="300 es",un=2e3,Wr=2001;function u0(i){for(let e=i.length-1;e>=0;--e)if(i[e]>=65535)return!0;return!1}function Xr(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function h0(){const i=Xr("canvas");return i.style.display="block",i}const So={};function jr(...i){const e="THREE."+i.shift();console.log(e,...i)}function $l(i){const e=i[0];if(typeof e=="string"&&e.startsWith("TSL:")){const t=i[1];t&&t.isStackTrace?i[0]+=" "+t.getLocation():i[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return i}function Ce(...i){i=$l(i);const e="THREE."+i.shift();{const t=i[0];t&&t.isStackTrace?console.warn(t.getError(e)):console.warn(e,...i)}}function je(...i){i=$l(i);const e="THREE."+i.shift();{const t=i[0];t&&t.isStackTrace?console.error(t.getError(e)):console.error(e,...i)}}function Ei(...i){const e=i.join(" ");e in So||(So[e]=!0,Ce(...i))}function d0(i,e,t){return new Promise(function(n,r){function a(){switch(i.clientWaitSync(e,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:r();break;case i.TIMEOUT_EXPIRED:setTimeout(a,t);break;default:n()}}setTimeout(a,t)})}const f0={[Ka]:Za,[Ja]:ts,[Qa]:ns,[Yi]:es,[Za]:Ka,[ts]:Ja,[ns]:Qa,[es]:Yi};class ei{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});const n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){const n=this._listeners;return n===void 0?!1:n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){const n=this._listeners;if(n===void 0)return;const r=n[e];if(r!==void 0){const a=r.indexOf(t);a!==-1&&r.splice(a,1)}}dispatchEvent(e){const t=this._listeners;if(t===void 0)return;const n=t[e.type];if(n!==void 0){e.target=this;const r=n.slice(0);for(let a=0,s=r.length;a<s;a++)r[a].call(this,e);e.target=null}}}const Et=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];let Mo=1234567;const Wi=Math.PI/180,Ji=180/Math.PI;function Sn(){const i=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(Et[i&255]+Et[i>>8&255]+Et[i>>16&255]+Et[i>>24&255]+"-"+Et[e&255]+Et[e>>8&255]+"-"+Et[e>>16&15|64]+Et[e>>24&255]+"-"+Et[t&63|128]+Et[t>>8&255]+"-"+Et[t>>16&255]+Et[t>>24&255]+Et[n&255]+Et[n>>8&255]+Et[n>>16&255]+Et[n>>24&255]).toLowerCase()}function ke(i,e,t){return Math.max(e,Math.min(t,i))}function Zs(i,e){return(i%e+e)%e}function p0(i,e,t,n,r){return n+(i-e)*(r-n)/(t-e)}function m0(i,e,t){return i!==e?(t-i)/(e-i):0}function Xi(i,e,t){return(1-t)*i+t*e}function v0(i,e,t,n){return Xi(i,e,1-Math.exp(-t*n))}function g0(i,e=1){return e-Math.abs(Zs(i,e*2)-e)}function _0(i,e,t){return i<=e?0:i>=t?1:(i=(i-e)/(t-e),i*i*(3-2*i))}function y0(i,e,t){return i<=e?0:i>=t?1:(i=(i-e)/(t-e),i*i*i*(i*(i*6-15)+10))}function x0(i,e){return i+Math.floor(Math.random()*(e-i+1))}function b0(i,e){return i+Math.random()*(e-i)}function w0(i){return i*(.5-Math.random())}function S0(i){i!==void 0&&(Mo=i);let e=Mo+=1831565813;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}function M0(i){return i*Wi}function E0(i){return i*Ji}function R0(i){return i>0&&Number.isInteger(i)&&2**Math.round(Math.log2(i))===i}function T0(i){return Math.pow(2,Math.ceil(Math.log(i)/Math.LN2))}function A0(i){return Math.pow(2,Math.floor(Math.log(i)/Math.LN2))}function C0(i,e,t,n,r){const a=Math.cos,s=Math.sin,o=a(t/2),c=s(t/2),l=a((e+n)/2),h=s((e+n)/2),p=a((e-n)/2),d=s((e-n)/2),v=a((n-e)/2),g=s((n-e)/2);switch(r){case"XYX":i.set(o*h,c*p,c*d,o*l);break;case"YZY":i.set(c*d,o*h,c*p,o*l);break;case"ZXZ":i.set(c*p,c*d,o*h,o*l);break;case"XZX":i.set(o*h,c*g,c*v,o*l);break;case"YXY":i.set(c*v,o*h,c*g,o*l);break;case"ZYZ":i.set(c*g,c*v,o*h,o*l);break;default:Ce("MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+r)}}function Qt(i,e){switch(e.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:case Uint8ClampedArray:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("THREE.MathUtils: Invalid component type.")}}function et(i,e){switch(e.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:case Uint8ClampedArray:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("THREE.MathUtils: Invalid component type.")}}const ri={DEG2RAD:Wi,RAD2DEG:Ji,generateUUID:Sn,clamp:ke,euclideanModulo:Zs,mapLinear:p0,inverseLerp:m0,lerp:Xi,damp:v0,pingpong:g0,smoothstep:_0,smootherstep:y0,randInt:x0,randFloat:b0,randFloatSpread:w0,seededRandom:S0,degToRad:M0,radToDeg:E0,isPowerOfTwo:R0,ceilPowerOfTwo:T0,floorPowerOfTwo:A0,setQuaternionFromProperEuler:C0,normalize:et,denormalize:Qt};class Ve{static{Ve.prototype.isVector2=!0}constructor(e=0,t=0){this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("THREE.Vector2: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){const t=this.x,n=this.y,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6],this.y=r[1]*t+r[4]*n+r[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=ke(this.x,e.x,t.x),this.y=ke(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=ke(this.x,e,t),this.y=ke(this.y,e,t),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(ke(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const n=this.dot(e)/t;return Math.acos(ke(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){const n=Math.cos(t),r=Math.sin(t),a=this.x-e.x,s=this.y-e.y;return this.x=a*n-s*r+e.x,this.y=a*r+s*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class Bn{constructor(e=0,t=0,n=0,r=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=r}static slerpFlat(e,t,n,r,a,s,o){let c=n[r+0],l=n[r+1],h=n[r+2],p=n[r+3],d=a[s+0],v=a[s+1],g=a[s+2],m=a[s+3];if(p!==m||c!==d||l!==v||h!==g){let u=c*d+l*v+h*g+p*m;u<0&&(d=-d,v=-v,g=-g,m=-m,u=-u);let f=1-o;if(u<.9995){const w=Math.acos(u),C=Math.sin(w);f=Math.sin(f*w)/C,o=Math.sin(o*w)/C,c=c*f+d*o,l=l*f+v*o,h=h*f+g*o,p=p*f+m*o}else{c=c*f+d*o,l=l*f+v*o,h=h*f+g*o,p=p*f+m*o;const w=1/Math.sqrt(c*c+l*l+h*h+p*p);c*=w,l*=w,h*=w,p*=w}}e[t]=c,e[t+1]=l,e[t+2]=h,e[t+3]=p}static multiplyQuaternionsFlat(e,t,n,r,a,s){const o=n[r],c=n[r+1],l=n[r+2],h=n[r+3],p=a[s],d=a[s+1],v=a[s+2],g=a[s+3];return e[t]=o*g+h*p+c*v-l*d,e[t+1]=c*g+h*d+l*p-o*v,e[t+2]=l*g+h*v+o*d-c*p,e[t+3]=h*g-o*p-c*d-l*v,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,r){return this._x=e,this._y=t,this._z=n,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){const n=e._x,r=e._y,a=e._z,s=e._order,o=Math.cos,c=Math.sin,l=o(n/2),h=o(r/2),p=o(a/2),d=c(n/2),v=c(r/2),g=c(a/2);switch(s){case"XYZ":this._x=d*h*p+l*v*g,this._y=l*v*p-d*h*g,this._z=l*h*g+d*v*p,this._w=l*h*p-d*v*g;break;case"YXZ":this._x=d*h*p+l*v*g,this._y=l*v*p-d*h*g,this._z=l*h*g-d*v*p,this._w=l*h*p+d*v*g;break;case"ZXY":this._x=d*h*p-l*v*g,this._y=l*v*p+d*h*g,this._z=l*h*g+d*v*p,this._w=l*h*p-d*v*g;break;case"ZYX":this._x=d*h*p-l*v*g,this._y=l*v*p+d*h*g,this._z=l*h*g-d*v*p,this._w=l*h*p+d*v*g;break;case"YZX":this._x=d*h*p+l*v*g,this._y=l*v*p+d*h*g,this._z=l*h*g-d*v*p,this._w=l*h*p-d*v*g;break;case"XZY":this._x=d*h*p-l*v*g,this._y=l*v*p-d*h*g,this._z=l*h*g+d*v*p,this._w=l*h*p+d*v*g;break;default:Ce("Quaternion: .setFromEuler() encountered an unknown order: "+s)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){const n=t/2,r=Math.sin(n);return this._x=e.x*r,this._y=e.y*r,this._z=e.z*r,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){const t=e.elements,n=t[0],r=t[4],a=t[8],s=t[1],o=t[5],c=t[9],l=t[2],h=t[6],p=t[10],d=n+o+p;if(d>0){const v=.5/Math.sqrt(d+1);this._w=.25/v,this._x=(h-c)*v,this._y=(a-l)*v,this._z=(s-r)*v}else if(n>o&&n>p){const v=2*Math.sqrt(1+n-o-p);this._w=(h-c)/v,this._x=.25*v,this._y=(r+s)/v,this._z=(a+l)/v}else if(o>p){const v=2*Math.sqrt(1+o-n-p);this._w=(a-l)/v,this._x=(r+s)/v,this._y=.25*v,this._z=(c+h)/v}else{const v=2*Math.sqrt(1+p-n-o);this._w=(s-r)/v,this._x=(a+l)/v,this._y=(c+h)/v,this._z=.25*v}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<1e-8?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(ke(this.dot(e),-1,1)))}rotateTowards(e,t){const n=this.angleTo(e);if(n===0)return this;const r=Math.min(1,t/n);return this.slerp(e,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){const n=e._x,r=e._y,a=e._z,s=e._w,o=t._x,c=t._y,l=t._z,h=t._w;return this._x=n*h+s*o+r*l-a*c,this._y=r*h+s*c+a*o-n*l,this._z=a*h+s*l+n*c-r*o,this._w=s*h-n*o-r*c-a*l,this._onChangeCallback(),this}slerp(e,t){let n=e._x,r=e._y,a=e._z,s=e._w,o=this.dot(e);o<0&&(n=-n,r=-r,a=-a,s=-s,o=-o);let c=1-t;if(o<.9995){const l=Math.acos(o),h=Math.sin(l);c=Math.sin(c*l)/h,t=Math.sin(t*l)/h,this._x=this._x*c+n*t,this._y=this._y*c+r*t,this._z=this._z*c+a*t,this._w=this._w*c+s*t,this._onChangeCallback()}else this._x=this._x*c+n*t,this._y=this._y*c+r*t,this._z=this._z*c+a*t,this._w=this._w*c+s*t,this.normalize();return this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){const e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),n=Math.random(),r=Math.sqrt(1-n),a=Math.sqrt(n);return this.set(r*Math.sin(e),r*Math.cos(e),a*Math.sin(t),a*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class O{static{O.prototype.isVector3=!0}constructor(e=0,t=0,n=0){this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("THREE.Vector3: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(Eo.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(Eo.setFromAxisAngle(e,t))}applyMatrix3(e){const t=this.x,n=this.y,r=this.z,a=e.elements;return this.x=a[0]*t+a[3]*n+a[6]*r,this.y=a[1]*t+a[4]*n+a[7]*r,this.z=a[2]*t+a[5]*n+a[8]*r,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){const t=this.x,n=this.y,r=this.z,a=e.elements,s=1/(a[3]*t+a[7]*n+a[11]*r+a[15]);return this.x=(a[0]*t+a[4]*n+a[8]*r+a[12])*s,this.y=(a[1]*t+a[5]*n+a[9]*r+a[13])*s,this.z=(a[2]*t+a[6]*n+a[10]*r+a[14])*s,this}applyQuaternion(e){const t=this.x,n=this.y,r=this.z,a=e.x,s=e.y,o=e.z,c=e.w,l=2*(s*r-o*n),h=2*(o*t-a*r),p=2*(a*n-s*t);return this.x=t+c*l+s*p-o*h,this.y=n+c*h+o*l-a*p,this.z=r+c*p+a*h-s*l,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){const t=this.x,n=this.y,r=this.z,a=e.elements;return this.x=a[0]*t+a[4]*n+a[8]*r,this.y=a[1]*t+a[5]*n+a[9]*r,this.z=a[2]*t+a[6]*n+a[10]*r,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=ke(this.x,e.x,t.x),this.y=ke(this.y,e.y,t.y),this.z=ke(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=ke(this.x,e,t),this.y=ke(this.y,e,t),this.z=ke(this.z,e,t),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(ke(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){const n=e.x,r=e.y,a=e.z,s=t.x,o=t.y,c=t.z;return this.x=r*c-a*o,this.y=a*s-n*c,this.z=n*o-r*s,this}projectOnVector(e){const t=e.lengthSq();if(t===0)return this.set(0,0,0);const n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return pa.copy(this).projectOnVector(e),this.sub(pa)}reflect(e){return this.sub(pa.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const n=this.dot(e)/t;return Math.acos(ke(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,n=this.y-e.y,r=this.z-e.z;return t*t+n*n+r*r}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){const r=Math.sin(t)*e;return this.x=r*Math.sin(n),this.y=Math.cos(t)*e,this.z=r*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){const t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),r=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=r,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const e=Math.random()*Math.PI*2,t=Math.random()*2-1,n=Math.sqrt(1-t*t);return this.x=n*Math.cos(e),this.y=t,this.z=n*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const pa=new O,Eo=new Bn;class Pe{static{Pe.prototype.isMatrix3=!0}constructor(e,t,n,r,a,s,o,c,l){this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,r,a,s,o,c,l)}set(e,t,n,r,a,s,o,c,l){const h=this.elements;return h[0]=e,h[1]=r,h[2]=o,h[3]=t,h[4]=a,h[5]=c,h[6]=n,h[7]=s,h[8]=l,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){const t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){const t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const n=e.elements,r=t.elements,a=this.elements,s=n[0],o=n[3],c=n[6],l=n[1],h=n[4],p=n[7],d=n[2],v=n[5],g=n[8],m=r[0],u=r[3],f=r[6],w=r[1],C=r[4],M=r[7],x=r[2],S=r[5],R=r[8];return a[0]=s*m+o*w+c*x,a[3]=s*u+o*C+c*S,a[6]=s*f+o*M+c*R,a[1]=l*m+h*w+p*x,a[4]=l*u+h*C+p*S,a[7]=l*f+h*M+p*R,a[2]=d*m+v*w+g*x,a[5]=d*u+v*C+g*S,a[8]=d*f+v*M+g*R,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){const e=this.elements,t=e[0],n=e[1],r=e[2],a=e[3],s=e[4],o=e[5],c=e[6],l=e[7],h=e[8];return t*s*h-t*o*l-n*a*h+n*o*c+r*a*l-r*s*c}invert(){const e=this.elements,t=e[0],n=e[1],r=e[2],a=e[3],s=e[4],o=e[5],c=e[6],l=e[7],h=e[8],p=h*s-o*l,d=o*c-h*a,v=l*a-s*c,g=t*p+n*d+r*v;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);const m=1/g;return e[0]=p*m,e[1]=(r*l-h*n)*m,e[2]=(o*n-r*s)*m,e[3]=d*m,e[4]=(h*t-r*c)*m,e[5]=(r*a-o*t)*m,e[6]=v*m,e[7]=(n*c-l*t)*m,e[8]=(s*t-n*a)*m,this}transpose(){let e;const t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){const t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,r,a,s,o){const c=Math.cos(a),l=Math.sin(a);return this.set(n*c,n*l,-n*(c*s+l*o)+s+e,-r*l,r*c,-r*(-l*s+c*o)+o+t,0,0,1),this}scale(e,t){return Ei("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(ma.makeScale(e,t)),this}rotate(e){return Ei("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(ma.makeRotation(-e)),this}translate(e,t){return Ei("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(ma.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){const t=this.elements,n=e.elements;for(let r=0;r<9;r++)if(t[r]!==n[r])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){const n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}}const ma=new Pe,Ro=new Pe().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),To=new Pe().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function L0(){const i={enabled:!0,workingColorSpace:Zi,spaces:{},convert:function(r,a,s){return this.enabled===!1||a===s||!a||!s||(this.spaces[a].transfer===Qe&&(r.r=Mn(r.r),r.g=Mn(r.g),r.b=Mn(r.b)),this.spaces[a].primaries!==this.spaces[s].primaries&&(r.applyMatrix3(this.spaces[a].toXYZ),r.applyMatrix3(this.spaces[s].fromXYZ)),this.spaces[s].transfer===Qe&&(r.r=Ri(r.r),r.g=Ri(r.g),r.b=Ri(r.b))),r},workingToColorSpace:function(r,a){return this.convert(r,this.workingColorSpace,a)},colorSpaceToWorking:function(r,a){return this.convert(r,a,this.workingColorSpace)},getPrimaries:function(r){return this.spaces[r].primaries},getTransfer:function(r){return r===bn?Hr:this.spaces[r].transfer},getToneMappingMode:function(r){return this.spaces[r].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(r,a=this.workingColorSpace){return r.fromArray(this.spaces[a].luminanceCoefficients)},define:function(r){Object.assign(this.spaces,r)},_getMatrix:function(r,a,s){return r.copy(this.spaces[a].toXYZ).multiply(this.spaces[s].fromXYZ)},_getDrawingBufferColorSpace:function(r){return this.spaces[r].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(r=this.workingColorSpace){return this.spaces[r].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(r,a){return Ei("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),i.workingToColorSpace(r,a)},toWorkingColorSpace:function(r,a){return Ei("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),i.colorSpaceToWorking(r,a)}},e=[.64,.33,.3,.6,.15,.06],t=[.2126,.7152,.0722],n=[.3127,.329];return i.define({[Zi]:{primaries:e,whitePoint:n,transfer:Hr,toXYZ:Ro,fromXYZ:To,luminanceCoefficients:t,workingColorSpaceConfig:{unpackColorSpace:Wt},outputColorSpaceConfig:{drawingBufferColorSpace:Wt}},[Wt]:{primaries:e,whitePoint:n,transfer:Qe,toXYZ:Ro,fromXYZ:To,luminanceCoefficients:t,outputColorSpaceConfig:{drawingBufferColorSpace:Wt}}}),i}const Ge=L0();function Mn(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function Ri(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}let ai;class P0{static getDataURL(e,t="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let n;if(e instanceof HTMLCanvasElement)n=e;else{ai===void 0&&(ai=Xr("canvas")),ai.width=e.width,ai.height=e.height;const r=ai.getContext("2d");e instanceof ImageData?r.putImageData(e,0,0):r.drawImage(e,0,0,e.width,e.height),n=ai}return n.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){const t=Xr("canvas");t.width=e.width,t.height=e.height;const n=t.getContext("2d");n.drawImage(e,0,0,e.width,e.height);const r=n.getImageData(0,0,e.width,e.height),a=r.data;for(let s=0;s<a.length;s++)a[s]=Mn(a[s]/255)*255;return n.putImageData(r,0,0),t}else if(e.data){const t=e.data.slice(0);for(let n=0;n<t.length;n++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[n]=Math.floor(Mn(t[n]/255)*255):t[n]=Mn(t[n]);return{data:t,width:e.width,height:e.height}}else return Ce("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}}let D0=0;class Js{constructor(e=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:D0++}),this.uuid=Sn(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){const t=this.data;return typeof HTMLVideoElement<"u"&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):typeof VideoFrame<"u"&&t instanceof VideoFrame?e.set(t.displayWidth,t.displayHeight,0):t!==null?e.set(t.width,t.height,t.depth||0):e.set(0,0,0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];const n={uuid:this.uuid,url:""},r=this.data;if(r!==null){let a;if(Array.isArray(r)){a=[];for(let s=0,o=r.length;s<o;s++)r[s].isDataTexture?a.push(va(r[s].image)):a.push(va(r[s]))}else a=va(r);n.url=a}return t||(e.images[this.uuid]=n),n}}function va(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?P0.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(Ce("Texture: Unable to serialize Texture."),{})}let U0=0;const ga=new O;class Dt extends ei{constructor(e=Dt.DEFAULT_IMAGE,t=Dt.DEFAULT_MAPPING,n=Xt,r=Xt,a=wt,s=jn,o=Pt,c=Nt,l=Dt.DEFAULT_ANISOTROPY,h=bn){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:U0++}),this.uuid=Sn(),this.name="",this.source=new Js(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=n,this.wrapT=r,this.magFilter=a,this.minFilter=s,this.anisotropy=l,this.format=o,this.internalFormat=null,this.type=c,this.offset=new Ve(0,0),this.repeat=new Ve(1,1),this.center=new Ve(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Pe,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(e&&e.depth&&e.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(ga).x}get height(){return this.source.getSize(ga).y}get depth(){return this.source.getSize(ga).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(const t in e){const n=e[t];if(n===void 0){Ce(`Texture.setValues(): parameter '${t}' has value of undefined.`);continue}const r=this[t];if(r===void 0){Ce(`Texture.setValues(): property '${t}' does not exist.`);continue}r&&n&&r.isVector2&&n.isVector2||r&&n&&r.isVector3&&n.isVector3||r&&n&&r.isMatrix3&&n.isMatrix3?r.copy(n):this[t]=n}}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];const n={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==Gl)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case is:e.x=e.x-Math.floor(e.x);break;case Xt:e.x=e.x<0?0:1;break;case rs:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case is:e.y=e.y-Math.floor(e.y);break;case Xt:e.y=e.y<0?0:1;break;case rs:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}}Dt.DEFAULT_IMAGE=null;Dt.DEFAULT_MAPPING=Gl;Dt.DEFAULT_ANISOTROPY=1;class nt{static{nt.prototype.isVector4=!0}constructor(e=0,t=0,n=0,r=1){this.x=e,this.y=t,this.z=n,this.w=r}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,r){return this.x=e,this.y=t,this.z=n,this.w=r,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("THREE.Vector4: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){const t=this.x,n=this.y,r=this.z,a=this.w,s=e.elements;return this.x=s[0]*t+s[4]*n+s[8]*r+s[12]*a,this.y=s[1]*t+s[5]*n+s[9]*r+s[13]*a,this.z=s[2]*t+s[6]*n+s[10]*r+s[14]*a,this.w=s[3]*t+s[7]*n+s[11]*r+s[15]*a,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);const t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,r,a;const c=e.elements,l=c[0],h=c[4],p=c[8],d=c[1],v=c[5],g=c[9],m=c[2],u=c[6],f=c[10];if(Math.abs(h-d)<.01&&Math.abs(p-m)<.01&&Math.abs(g-u)<.01){if(Math.abs(h+d)<.1&&Math.abs(p+m)<.1&&Math.abs(g+u)<.1&&Math.abs(l+v+f-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;const C=(l+1)/2,M=(v+1)/2,x=(f+1)/2,S=(h+d)/4,R=(p+m)/4,_=(g+u)/4;return C>M&&C>x?C<.01?(n=0,r=.707106781,a=.707106781):(n=Math.sqrt(C),r=S/n,a=R/n):M>x?M<.01?(n=.707106781,r=0,a=.707106781):(r=Math.sqrt(M),n=S/r,a=_/r):x<.01?(n=.707106781,r=.707106781,a=0):(a=Math.sqrt(x),n=R/a,r=_/a),this.set(n,r,a,t),this}let w=Math.sqrt((u-g)*(u-g)+(p-m)*(p-m)+(d-h)*(d-h));return Math.abs(w)<.001&&(w=1),this.x=(u-g)/w,this.y=(p-m)/w,this.z=(d-h)/w,this.w=Math.acos((l+v+f-1)/2),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=ke(this.x,e.x,t.x),this.y=ke(this.y,e.y,t.y),this.z=ke(this.z,e.z,t.z),this.w=ke(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=ke(this.x,e,t),this.y=ke(this.y,e,t),this.z=ke(this.z,e,t),this.w=ke(this.w,e,t),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(ke(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class I0 extends ei{constructor(e=1,t=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:wt,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},n),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=n.depth,this.scissor=new nt(0,0,e,t),this.scissorTest=!1,this.viewport=new nt(0,0,e,t),this.textures=[];const r={width:e,height:t,depth:n.depth},a=new Dt(r),s=n.count;for(let o=0;o<s;o++)this.textures[o]=a.clone(),this.textures[o].isRenderTargetTexture=!0,this.textures[o].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveColorBuffer=n.resolveColorBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.storeMultisampledColorBuffer=n.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=n.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=n.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview,this.useArrayDepthTexture=n.useArrayDepthTexture}_setTextureOptions(e={}){const t={minFilter:wt,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let n=0;n<this.textures.length;n++)this.textures[n].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),e!==null&&e.renderTarget===null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,n=1){if(this.width!==e||this.height!==t||this.depth!==n){this.width=e,this.height=t,this.depth=n;for(let r=0,a=this.textures.length;r<a;r++)this.textures[r].image.width=e,this.textures[r].image.height=t,this.textures[r].image.depth=n,this.textures[r].isData3DTexture!==!0&&(this.textures[r].isArrayTexture=this.textures[r].image.depth>1);this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,n=e.textures.length;t<n;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;const r=Object.assign({},e.textures[t].image);this.textures[t].source=new Js(r)}if(this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveColorBuffer=e.resolveColorBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,this.storeMultisampledColorBuffer=e.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=e.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=e.storeMultisampledStencilBuffer,e.depthTexture!==null)if(e.depthTexture.renderTarget===e){const t=e.depthTexture.clone();t.renderTarget=null,this.depthTexture=t}else this.depthTexture=e.depthTexture;return this.samples=e.samples,this.multiview=e.multiview,this.useArrayDepthTexture=e.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}}class Ut extends I0{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}}class Kl extends Dt{constructor(e=null,t=1,n=1,r=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:r},this.magFilter=gt,this.minFilter=gt,this.wrapR=Xt,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}}class N0 extends Dt{constructor(e=null,t=1,n=1,r=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:r},this.magFilter=gt,this.minFilter=gt,this.wrapR=Xt,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}}class pe{static{pe.prototype.isMatrix4=!0}constructor(e,t,n,r,a,s,o,c,l,h,p,d,v,g,m,u){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,r,a,s,o,c,l,h,p,d,v,g,m,u)}set(e,t,n,r,a,s,o,c,l,h,p,d,v,g,m,u){const f=this.elements;return f[0]=e,f[4]=t,f[8]=n,f[12]=r,f[1]=a,f[5]=s,f[9]=o,f[13]=c,f[2]=l,f[6]=h,f[10]=p,f[14]=d,f[3]=v,f[7]=g,f[11]=m,f[15]=u,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new pe().fromArray(this.elements)}copy(e){const t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){const t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){const t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return this.determinantAffine()===0?(e.set(1,0,0),t.set(0,1,0),n.set(0,0,1),this):(e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this)}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){if(e.determinantAffine()===0)return this.identity();const t=this.elements,n=e.elements,r=1/si.setFromMatrixColumn(e,0).length(),a=1/si.setFromMatrixColumn(e,1).length(),s=1/si.setFromMatrixColumn(e,2).length();return t[0]=n[0]*r,t[1]=n[1]*r,t[2]=n[2]*r,t[3]=0,t[4]=n[4]*a,t[5]=n[5]*a,t[6]=n[6]*a,t[7]=0,t[8]=n[8]*s,t[9]=n[9]*s,t[10]=n[10]*s,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){const t=this.elements,n=e.x,r=e.y,a=e.z,s=Math.cos(n),o=Math.sin(n),c=Math.cos(r),l=Math.sin(r),h=Math.cos(a),p=Math.sin(a);if(e.order==="XYZ"){const d=s*h,v=s*p,g=o*h,m=o*p;t[0]=c*h,t[4]=-c*p,t[8]=l,t[1]=v+g*l,t[5]=d-m*l,t[9]=-o*c,t[2]=m-d*l,t[6]=g+v*l,t[10]=s*c}else if(e.order==="YXZ"){const d=c*h,v=c*p,g=l*h,m=l*p;t[0]=d+m*o,t[4]=g*o-v,t[8]=s*l,t[1]=s*p,t[5]=s*h,t[9]=-o,t[2]=v*o-g,t[6]=m+d*o,t[10]=s*c}else if(e.order==="ZXY"){const d=c*h,v=c*p,g=l*h,m=l*p;t[0]=d-m*o,t[4]=-s*p,t[8]=g+v*o,t[1]=v+g*o,t[5]=s*h,t[9]=m-d*o,t[2]=-s*l,t[6]=o,t[10]=s*c}else if(e.order==="ZYX"){const d=s*h,v=s*p,g=o*h,m=o*p;t[0]=c*h,t[4]=g*l-v,t[8]=d*l+m,t[1]=c*p,t[5]=m*l+d,t[9]=v*l-g,t[2]=-l,t[6]=o*c,t[10]=s*c}else if(e.order==="YZX"){const d=s*c,v=s*l,g=o*c,m=o*l;t[0]=c*h,t[4]=m-d*p,t[8]=g*p+v,t[1]=p,t[5]=s*h,t[9]=-o*h,t[2]=-l*h,t[6]=v*p+g,t[10]=d-m*p}else if(e.order==="XZY"){const d=s*c,v=s*l,g=o*c,m=o*l;t[0]=c*h,t[4]=-p,t[8]=l*h,t[1]=d*p+m,t[5]=s*h,t[9]=v*p-g,t[2]=g*p-v,t[6]=o*h,t[10]=m*p+d}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(F0,e,B0)}lookAt(e,t,n){const r=this.elements;return Ot.subVectors(e,t),Ot.lengthSq()===0&&(Ot.z=1),Ot.normalize(),Ln.crossVectors(n,Ot),Ln.lengthSq()===0&&(Math.abs(n.z)===1?Ot.x+=1e-4:Ot.z+=1e-4,Ot.normalize(),Ln.crossVectors(n,Ot)),Ln.normalize(),sr.crossVectors(Ot,Ln),r[0]=Ln.x,r[4]=sr.x,r[8]=Ot.x,r[1]=Ln.y,r[5]=sr.y,r[9]=Ot.y,r[2]=Ln.z,r[6]=sr.z,r[10]=Ot.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const n=e.elements,r=t.elements,a=this.elements,s=n[0],o=n[4],c=n[8],l=n[12],h=n[1],p=n[5],d=n[9],v=n[13],g=n[2],m=n[6],u=n[10],f=n[14],w=n[3],C=n[7],M=n[11],x=n[15],S=r[0],R=r[4],_=r[8],E=r[12],L=r[1],T=r[5],P=r[9],U=r[13],D=r[2],z=r[6],W=r[10],j=r[14],Z=r[3],I=r[7],q=r[11],Q=r[15];return a[0]=s*S+o*L+c*D+l*Z,a[4]=s*R+o*T+c*z+l*I,a[8]=s*_+o*P+c*W+l*q,a[12]=s*E+o*U+c*j+l*Q,a[1]=h*S+p*L+d*D+v*Z,a[5]=h*R+p*T+d*z+v*I,a[9]=h*_+p*P+d*W+v*q,a[13]=h*E+p*U+d*j+v*Q,a[2]=g*S+m*L+u*D+f*Z,a[6]=g*R+m*T+u*z+f*I,a[10]=g*_+m*P+u*W+f*q,a[14]=g*E+m*U+u*j+f*Q,a[3]=w*S+C*L+M*D+x*Z,a[7]=w*R+C*T+M*z+x*I,a[11]=w*_+C*P+M*W+x*q,a[15]=w*E+C*U+M*j+x*Q,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){const e=this.elements,t=e[0],n=e[4],r=e[8],a=e[12],s=e[1],o=e[5],c=e[9],l=e[13],h=e[2],p=e[6],d=e[10],v=e[14],g=e[3],m=e[7],u=e[11],f=e[15],w=c*v-l*d,C=o*v-l*p,M=o*d-c*p,x=s*v-l*h,S=s*d-c*h,R=s*p-o*h;return t*(m*w-u*C+f*M)-n*(g*w-u*x+f*S)+r*(g*C-m*x+f*R)-a*(g*M-m*S+u*R)}determinantAffine(){const e=this.elements,t=e[0],n=e[4],r=e[8],a=e[1],s=e[5],o=e[9],c=e[2],l=e[6],h=e[10];return t*(s*h-o*l)-n*(a*h-o*c)+r*(a*l-s*c)}transpose(){const e=this.elements;let t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){const r=this.elements;return e.isVector3?(r[12]=e.x,r[13]=e.y,r[14]=e.z):(r[12]=e,r[13]=t,r[14]=n),this}invert(){const e=this.elements,t=e[0],n=e[1],r=e[2],a=e[3],s=e[4],o=e[5],c=e[6],l=e[7],h=e[8],p=e[9],d=e[10],v=e[11],g=e[12],m=e[13],u=e[14],f=e[15],w=t*o-n*s,C=t*c-r*s,M=t*l-a*s,x=n*c-r*o,S=n*l-a*o,R=r*l-a*c,_=h*m-p*g,E=h*u-d*g,L=h*f-v*g,T=p*u-d*m,P=p*f-v*m,U=d*f-v*u,D=w*U-C*P+M*T+x*L-S*E+R*_;if(D===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const z=1/D;return e[0]=(o*U-c*P+l*T)*z,e[1]=(r*P-n*U-a*T)*z,e[2]=(m*R-u*S+f*x)*z,e[3]=(d*S-p*R-v*x)*z,e[4]=(c*L-s*U-l*E)*z,e[5]=(t*U-r*L+a*E)*z,e[6]=(u*M-g*R-f*C)*z,e[7]=(h*R-d*M+v*C)*z,e[8]=(s*P-o*L+l*_)*z,e[9]=(n*L-t*P-a*_)*z,e[10]=(g*S-m*M+f*w)*z,e[11]=(p*M-h*S-v*w)*z,e[12]=(o*E-s*T-c*_)*z,e[13]=(t*T-n*E+r*_)*z,e[14]=(m*C-g*x-u*w)*z,e[15]=(h*x-p*C+d*w)*z,this}scale(e){const t=this.elements,n=e.x,r=e.y,a=e.z;return t[0]*=n,t[4]*=r,t[8]*=a,t[1]*=n,t[5]*=r,t[9]*=a,t[2]*=n,t[6]*=r,t[10]*=a,t[3]*=n,t[7]*=r,t[11]*=a,this}getMaxScaleOnAxis(){const e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],r=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,r))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){const t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){const n=Math.cos(t),r=Math.sin(t),a=1-n,s=e.x,o=e.y,c=e.z,l=a*s,h=a*o;return this.set(l*s+n,l*o-r*c,l*c+r*o,0,l*o+r*c,h*o+n,h*c-r*s,0,l*c-r*o,h*c+r*s,a*c*c+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,r,a,s){return this.set(1,n,a,0,e,1,s,0,t,r,1,0,0,0,0,1),this}compose(e,t,n){const r=this.elements,a=t._x,s=t._y,o=t._z,c=t._w,l=a+a,h=s+s,p=o+o,d=a*l,v=a*h,g=a*p,m=s*h,u=s*p,f=o*p,w=c*l,C=c*h,M=c*p,x=n.x,S=n.y,R=n.z;return r[0]=(1-(m+f))*x,r[1]=(v+M)*x,r[2]=(g-C)*x,r[3]=0,r[4]=(v-M)*S,r[5]=(1-(d+f))*S,r[6]=(u+w)*S,r[7]=0,r[8]=(g+C)*R,r[9]=(u-w)*R,r[10]=(1-(d+m))*R,r[11]=0,r[12]=e.x,r[13]=e.y,r[14]=e.z,r[15]=1,this}decompose(e,t,n){const r=this.elements;e.x=r[12],e.y=r[13],e.z=r[14];const a=this.determinantAffine();if(a===0)return n.set(1,1,1),t.identity(),this;let s=si.set(r[0],r[1],r[2]).length();const o=si.set(r[4],r[5],r[6]).length(),c=si.set(r[8],r[9],r[10]).length();a<0&&(s=-s),$t.copy(this);const l=1/s,h=1/o,p=1/c;return $t.elements[0]*=l,$t.elements[1]*=l,$t.elements[2]*=l,$t.elements[4]*=h,$t.elements[5]*=h,$t.elements[6]*=h,$t.elements[8]*=p,$t.elements[9]*=p,$t.elements[10]*=p,t.setFromRotationMatrix($t),n.x=s,n.y=o,n.z=c,this}makePerspective(e,t,n,r,a,s,o=un,c=!1){const l=this.elements,h=2*a/(t-e),p=2*a/(n-r),d=(t+e)/(t-e),v=(n+r)/(n-r);let g,m;if(c)g=a/(s-a),m=s*a/(s-a);else if(o===un)g=-(s+a)/(s-a),m=-2*s*a/(s-a);else if(o===Wr)g=-s/(s-a),m=-s*a/(s-a);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return l[0]=h,l[4]=0,l[8]=d,l[12]=0,l[1]=0,l[5]=p,l[9]=v,l[13]=0,l[2]=0,l[6]=0,l[10]=g,l[14]=m,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(e,t,n,r,a,s,o=un,c=!1){const l=this.elements,h=2/(t-e),p=2/(n-r),d=-(t+e)/(t-e),v=-(n+r)/(n-r);let g,m;if(c)g=1/(s-a),m=s/(s-a);else if(o===un)g=-2/(s-a),m=-(s+a)/(s-a);else if(o===Wr)g=-1/(s-a),m=-a/(s-a);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return l[0]=h,l[4]=0,l[8]=0,l[12]=d,l[1]=0,l[5]=p,l[9]=0,l[13]=v,l[2]=0,l[6]=0,l[10]=g,l[14]=m,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(e){const t=this.elements,n=e.elements;for(let r=0;r<16;r++)if(t[r]!==n[r])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){const n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}}const si=new O,$t=new pe,F0=new O(0,0,0),B0=new O(1,1,1),Ln=new O,sr=new O,Ot=new O,Ao=new pe,Co=new Bn;class Zn{constructor(e=0,t=0,n=0,r=Zn.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=n,this._order=r}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,r=this._order){return this._x=e,this._y=t,this._z=n,this._order=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){const r=e.elements,a=r[0],s=r[4],o=r[8],c=r[1],l=r[5],h=r[9],p=r[2],d=r[6],v=r[10];switch(t){case"XYZ":this._y=Math.asin(ke(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-h,v),this._z=Math.atan2(-s,a)):(this._x=Math.atan2(d,l),this._z=0);break;case"YXZ":this._x=Math.asin(-ke(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(o,v),this._z=Math.atan2(c,l)):(this._y=Math.atan2(-p,a),this._z=0);break;case"ZXY":this._x=Math.asin(ke(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-p,v),this._z=Math.atan2(-s,l)):(this._y=0,this._z=Math.atan2(c,a));break;case"ZYX":this._y=Math.asin(-ke(p,-1,1)),Math.abs(p)<.9999999?(this._x=Math.atan2(d,v),this._z=Math.atan2(c,a)):(this._x=0,this._z=Math.atan2(-s,l));break;case"YZX":this._z=Math.asin(ke(c,-1,1)),Math.abs(c)<.9999999?(this._x=Math.atan2(-h,l),this._y=Math.atan2(-p,a)):(this._x=0,this._y=Math.atan2(o,v));break;case"XZY":this._z=Math.asin(-ke(s,-1,1)),Math.abs(s)<.9999999?(this._x=Math.atan2(d,l),this._y=Math.atan2(o,a)):(this._x=Math.atan2(-h,v),this._y=0);break;default:Ce("Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return Ao.makeRotationFromQuaternion(e),this.setFromRotationMatrix(Ao,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return Co.setFromEuler(this),this.setFromQuaternion(Co,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}Zn.DEFAULT_ORDER="XYZ";class Zl{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}}let O0=0;const Lo=new O,oi=new Bn,vn=new pe,or=new O,Li=new O,z0=new O,k0=new Bn,Po=new O(1,0,0),Do=new O(0,1,0),Uo=new O(0,0,1),Io={type:"added"},G0={type:"removed"},li={type:"childadded",child:null},_a={type:"childremoved",child:null};class Bt extends ei{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:O0++}),this.uuid=Sn(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=Bt.DEFAULT_UP.clone();const e=new O,t=new Zn,n=new Bn,r=new O(1,1,1);function a(){n.setFromEuler(t,!1)}function s(){t.setFromQuaternion(n,void 0,!1)}t._onChange(a),n._onChange(s),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:r},modelViewMatrix:{value:new pe},normalMatrix:{value:new Pe}}),this.matrix=new pe,this.matrixWorld=new pe,this.matrixAutoUpdate=Bt.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=Bt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Zl,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return oi.setFromAxisAngle(e,t),this.quaternion.multiply(oi),this}rotateOnWorldAxis(e,t){return oi.setFromAxisAngle(e,t),this.quaternion.premultiply(oi),this}rotateX(e){return this.rotateOnAxis(Po,e)}rotateY(e){return this.rotateOnAxis(Do,e)}rotateZ(e){return this.rotateOnAxis(Uo,e)}translateOnAxis(e,t){return Lo.copy(e).applyQuaternion(this.quaternion),this.position.add(Lo.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(Po,e)}translateY(e){return this.translateOnAxis(Do,e)}translateZ(e){return this.translateOnAxis(Uo,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(vn.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?or.copy(e):or.set(e,t,n);const r=this.parent;this.updateWorldMatrix(!0,!1),Li.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?vn.lookAt(Li,or,this.up):vn.lookAt(or,Li,this.up),this.quaternion.setFromRotationMatrix(vn),r&&(vn.extractRotation(r.matrixWorld),oi.setFromRotationMatrix(vn),this.quaternion.premultiply(oi.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(je("Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(Io),li.child=e,this.dispatchEvent(li),li.child=null):je("Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}const t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(G0),_a.child=e,this.dispatchEvent(_a),_a.child=null),this}removeFromParent(){const e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),vn.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),vn.multiply(e.parent.matrixWorld)),e.applyMatrix4(vn),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(Io),li.child=e,this.dispatchEvent(li),li.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,r=this.children.length;n<r;n++){const s=this.children[n].getObjectByProperty(e,t);if(s!==void 0)return s}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);const r=this.children;for(let a=0,s=r.length;a<s;a++)r[a].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Li,e,z0),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Li,k0,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);const t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}intersectsFrustum(){}traverse(e){e(this);const t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);const t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].traverseVisible(e)}traverseAncestors(e){const t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);const e=this.pivot;if(e!==null){const t=e.x,n=e.y,r=e.z,a=this.matrix.elements;a[12]+=t-a[0]*t-a[4]*n-a[8]*r,a[13]+=n-a[1]*t-a[5]*n-a[9]*r,a[14]+=r-a[2]*t-a[6]*n-a[10]*r}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);const t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].updateMatrixWorld(e)}updateWorldMatrix(e,t,n=!1){const r=this.parent;if(e===!0&&r!==null&&r.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||n)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,n=!0),t===!0){const a=this.children;for(let s=0,o=a.length;s<o;s++)a[s].updateWorldMatrix(!1,!0,n)}}toJSON(e){const t=e===void 0||typeof e=="string",n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});const r={};r.uuid=this.uuid,r.type=this.type,r.name=this.name,r.castShadow=this.castShadow,r.receiveShadow=this.receiveShadow,r.visible=this.visible,r.frustumCulled=this.frustumCulled,r.renderOrder=this.renderOrder,r.static=this.static,r.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(r.userData=this.userData),r.layers=this.layers.mask,r.matrix=this.matrix.toArray(),r.up=this.up.toArray(),this.pivot!==null&&(r.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(r.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(r.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(r.type="InstancedMesh",r.count=this.count,r.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(r.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(r.type="BatchedMesh",r.perObjectFrustumCulled=this.perObjectFrustumCulled,r.sortObjects=this.sortObjects,r.drawRanges=this._drawRanges,r.reservedRanges=this._reservedRanges,r.geometryInfo=this._geometryInfo.map(o=>({...o,boundingBox:o.boundingBox?o.boundingBox.toJSON():void 0,boundingSphere:o.boundingSphere?o.boundingSphere.toJSON():void 0})),r.instanceInfo=this._instanceInfo.map(o=>({...o})),r.availableInstanceIds=this._availableInstanceIds.slice(),r.availableGeometryIds=this._availableGeometryIds.slice(),r.nextIndexStart=this._nextIndexStart,r.nextVertexStart=this._nextVertexStart,r.geometryCount=this._geometryCount,r.maxInstanceCount=this._maxInstanceCount,r.maxVertexCount=this._maxVertexCount,r.maxIndexCount=this._maxIndexCount,r.geometryInitialized=this._geometryInitialized,r.matricesTexture=this._matricesTexture.toJSON(e),r.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(r.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(r.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(r.boundingBox=this.boundingBox.toJSON()));function a(o,c){return o[c.uuid]===void 0&&(o[c.uuid]=c.toJSON(e)),c.uuid}if(this.isScene)this.background&&(this.background.isColor?r.background=this.background.toJSON():this.background.isTexture&&(r.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(r.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){r.geometry=a(e.geometries,this.geometry);const o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){const c=o.shapes;if(Array.isArray(c))for(let l=0,h=c.length;l<h;l++){const p=c[l];a(e.shapes,p)}else a(e.shapes,c)}}if(this.isSkinnedMesh&&(r.bindMode=this.bindMode,r.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(a(e.skeletons,this.skeleton),r.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const o=[];for(let c=0,l=this.material.length;c<l;c++)o.push(a(e.materials,this.material[c]));r.material=o}else r.material=a(e.materials,this.material);if(this.children.length>0){r.children=[];for(let o=0;o<this.children.length;o++)r.children.push(this.children[o].toJSON(e).object)}if(this.animations.length>0){r.animations=[];for(let o=0;o<this.animations.length;o++){const c=this.animations[o];r.animations.push(a(e.animations,c))}}if(t){const o=s(e.geometries),c=s(e.materials),l=s(e.textures),h=s(e.images),p=s(e.shapes),d=s(e.skeletons),v=s(e.animations),g=s(e.nodes);o.length>0&&(n.geometries=o),c.length>0&&(n.materials=c),l.length>0&&(n.textures=l),h.length>0&&(n.images=h),p.length>0&&(n.shapes=p),d.length>0&&(n.skeletons=d),v.length>0&&(n.animations=v),g.length>0&&(n.nodes=g)}return n.object=r,n;function s(o){const c=[];for(const l in o){const h=o[l];delete h.metadata,c.push(h)}return c}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.pivot=e.pivot!==null?e.pivot.clone():null,this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let n=0;n<e.children.length;n++){const r=e.children[n];this.add(r.clone())}return this}dispose(){this.dispatchEvent({type:"dispose"})}}Bt.DEFAULT_UP=new O(0,1,0);Bt.DEFAULT_MATRIX_AUTO_UPDATE=!0;Bt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;class lr extends Bt{constructor(){super(),this.isGroup=!0,this.type="Group"}}const V0={type:"move"};class ya{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new lr,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new lr,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new O,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new O),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new lr,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new O,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new O,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){const t=this._hand;if(t)for(const n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let r=null,a=null,s=null;const o=this._targetRay,c=this._grip,l=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(l&&e.hand){s=!0;for(const m of e.hand.values()){const u=t.getJointPose(m,n),f=this._getHandJoint(l,m);u!==null&&(f.matrix.fromArray(u.transform.matrix),f.matrix.decompose(f.position,f.rotation,f.scale),f.matrixWorldNeedsUpdate=!0,f.jointRadius=u.radius),f.visible=u!==null}const h=l.joints["index-finger-tip"],p=l.joints["thumb-tip"],d=h.position.distanceTo(p.position),v=.02,g=.005;l.inputState.pinching&&d>v+g?(l.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!l.inputState.pinching&&d<=v-g&&(l.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else c!==null&&e.gripSpace&&(a=t.getPose(e.gripSpace,n),a!==null&&(c.matrix.fromArray(a.transform.matrix),c.matrix.decompose(c.position,c.rotation,c.scale),c.matrixWorldNeedsUpdate=!0,a.linearVelocity?(c.hasLinearVelocity=!0,c.linearVelocity.copy(a.linearVelocity)):c.hasLinearVelocity=!1,a.angularVelocity?(c.hasAngularVelocity=!0,c.angularVelocity.copy(a.angularVelocity)):c.hasAngularVelocity=!1,c.eventsEnabled&&c.dispatchEvent({type:"gripUpdated",data:e,target:this})));o!==null&&(r=t.getPose(e.targetRaySpace,n),r===null&&a!==null&&(r=a),r!==null&&(o.matrix.fromArray(r.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,r.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(r.linearVelocity)):o.hasLinearVelocity=!1,r.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(r.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(V0)))}return o!==null&&(o.visible=r!==null),c!==null&&(c.visible=a!==null),l!==null&&(l.visible=s!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){const n=new lr;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}}const Jl={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Pn={h:0,s:0,l:0},cr={h:0,s:0,l:0};function xa(i,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?i+(e-i)*6*t:t<1/2?e:t<2/3?i+(e-i)*6*(2/3-t):i}class qe{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){const r=e;r&&r.isColor?this.copy(r):typeof r=="number"?this.setHex(r):typeof r=="string"&&this.setStyle(r)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=Wt){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,Ge.colorSpaceToWorking(this,t),this}setRGB(e,t,n,r=Ge.workingColorSpace){return this.r=e,this.g=t,this.b=n,Ge.colorSpaceToWorking(this,r),this}setHSL(e,t,n,r=Ge.workingColorSpace){if(e=Zs(e,1),t=ke(t,0,1),n=ke(n,0,1),t===0)this.r=this.g=this.b=n;else{const a=n<=.5?n*(1+t):n+t-n*t,s=2*n-a;this.r=xa(s,a,e+1/3),this.g=xa(s,a,e),this.b=xa(s,a,e-1/3)}return Ge.colorSpaceToWorking(this,r),this}setStyle(e,t=Wt){function n(a){a!==void 0&&parseFloat(a)<1&&Ce("Color: Alpha component of "+e+" will be ignored.")}let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(e)){let a;const s=r[1],o=r[2];switch(s){case"rgb":case"rgba":if(a=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(a[4]),this.setRGB(Math.min(255,parseInt(a[1],10))/255,Math.min(255,parseInt(a[2],10))/255,Math.min(255,parseInt(a[3],10))/255,t);if(a=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(a[4]),this.setRGB(Math.min(100,parseInt(a[1],10))/100,Math.min(100,parseInt(a[2],10))/100,Math.min(100,parseInt(a[3],10))/100,t);break;case"hsl":case"hsla":if(a=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(a[4]),this.setHSL(parseFloat(a[1])/360,parseFloat(a[2])/100,parseFloat(a[3])/100,t);break;default:Ce("Color: Unknown color model "+e)}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(e)){const a=r[1],s=a.length;if(s===3)return this.setRGB(parseInt(a.charAt(0),16)/15,parseInt(a.charAt(1),16)/15,parseInt(a.charAt(2),16)/15,t);if(s===6)return this.setHex(parseInt(a,16),t);Ce("Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=Wt){const n=Jl[e.toLowerCase()];return n!==void 0?this.setHex(n,t):Ce("Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=Mn(e.r),this.g=Mn(e.g),this.b=Mn(e.b),this}copyLinearToSRGB(e){return this.r=Ri(e.r),this.g=Ri(e.g),this.b=Ri(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=Wt){return Ge.workingToColorSpace(Rt.copy(this),e),Math.round(ke(Rt.r*255,0,255))*65536+Math.round(ke(Rt.g*255,0,255))*256+Math.round(ke(Rt.b*255,0,255))}getHexString(e=Wt){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=Ge.workingColorSpace){Ge.workingToColorSpace(Rt.copy(this),t);const n=Rt.r,r=Rt.g,a=Rt.b,s=Math.max(n,r,a),o=Math.min(n,r,a);let c,l;const h=(o+s)/2;if(o===s)c=0,l=0;else{const p=s-o;switch(l=h<=.5?p/(s+o):p/(2-s-o),s){case n:c=(r-a)/p+(r<a?6:0);break;case r:c=(a-n)/p+2;break;case a:c=(n-r)/p+4;break}c/=6}return e.h=c,e.s=l,e.l=h,e}getRGB(e,t=Ge.workingColorSpace){return Ge.workingToColorSpace(Rt.copy(this),t),e.r=Rt.r,e.g=Rt.g,e.b=Rt.b,e}getStyle(e=Wt){Ge.workingToColorSpace(Rt.copy(this),e);const t=Rt.r,n=Rt.g,r=Rt.b;return e!==Wt?`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${r.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(r*255)})`}offsetHSL(e,t,n){return this.getHSL(Pn),this.setHSL(Pn.h+e,Pn.s+t,Pn.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(Pn),e.getHSL(cr);const n=Xi(Pn.h,cr.h,t),r=Xi(Pn.s,cr.s,t),a=Xi(Pn.l,cr.l,t);return this.setHSL(n,r,a),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){const t=this.r,n=this.g,r=this.b,a=e.elements;return this.r=a[0]*t+a[3]*n+a[6]*r,this.g=a[1]*t+a[4]*n+a[7]*r,this.b=a[2]*t+a[5]*n+a[8]*r,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const Rt=new qe;qe.NAMES=Jl;class Ns extends Bt{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Zn,this.environmentIntensity=1,this.environmentRotation=new Zn,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){const t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),t.object.backgroundBlurriness=this.backgroundBlurriness,t.object.backgroundIntensity=this.backgroundIntensity,t.object.backgroundRotation=this.backgroundRotation.toArray(),t.object.environmentIntensity=this.environmentIntensity,t.object.environmentRotation=this.environmentRotation.toArray(),t}}const Kt=new O,gn=new O,ba=new O,_n=new O,ci=new O,ui=new O,No=new O,wa=new O,Sa=new O,Ma=new O,Ea=new nt,Ra=new nt,Ta=new nt;class kt{constructor(e=new O,t=new O,n=new O){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,r){r.subVectors(n,t),Kt.subVectors(e,t),r.cross(Kt);const a=r.lengthSq();return a>0?r.multiplyScalar(1/Math.sqrt(a)):r.set(0,0,0)}static getBarycoord(e,t,n,r,a){Kt.subVectors(r,t),gn.subVectors(n,t),ba.subVectors(e,t);const s=Kt.dot(Kt),o=Kt.dot(gn),c=Kt.dot(ba),l=gn.dot(gn),h=gn.dot(ba),p=s*l-o*o;if(p===0)return a.set(0,0,0),null;const d=1/p,v=(l*c-o*h)*d,g=(s*h-o*c)*d;return a.set(1-v-g,g,v)}static containsPoint(e,t,n,r){return this.getBarycoord(e,t,n,r,_n)===null?!1:_n.x>=0&&_n.y>=0&&_n.x+_n.y<=1}static getInterpolation(e,t,n,r,a,s,o,c){return this.getBarycoord(e,t,n,r,_n)===null?(c.x=0,c.y=0,"z"in c&&(c.z=0),"w"in c&&(c.w=0),null):(c.setScalar(0),c.addScaledVector(a,_n.x),c.addScaledVector(s,_n.y),c.addScaledVector(o,_n.z),c)}static getInterpolatedAttribute(e,t,n,r,a,s){return Ea.setScalar(0),Ra.setScalar(0),Ta.setScalar(0),Ea.fromBufferAttribute(e,t),Ra.fromBufferAttribute(e,n),Ta.fromBufferAttribute(e,r),s.setScalar(0),s.addScaledVector(Ea,a.x),s.addScaledVector(Ra,a.y),s.addScaledVector(Ta,a.z),s}static isFrontFacing(e,t,n,r){return Kt.subVectors(n,t),gn.subVectors(e,t),Kt.cross(gn).dot(r)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,r){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[r]),this}setFromAttributeAndIndices(e,t,n,r){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,r),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return Kt.subVectors(this.c,this.b),gn.subVectors(this.a,this.b),Kt.cross(gn).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return kt.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return kt.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,n,r,a){return kt.getInterpolation(e,this.a,this.b,this.c,t,n,r,a)}containsPoint(e){return kt.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return kt.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){const n=this.a,r=this.b,a=this.c;let s,o;ci.subVectors(r,n),ui.subVectors(a,n),wa.subVectors(e,n);const c=ci.dot(wa),l=ui.dot(wa);if(c<=0&&l<=0)return t.copy(n);Sa.subVectors(e,r);const h=ci.dot(Sa),p=ui.dot(Sa);if(h>=0&&p<=h)return t.copy(r);const d=c*p-h*l;if(d<=0&&c>=0&&h<=0)return s=c/(c-h),t.copy(n).addScaledVector(ci,s);Ma.subVectors(e,a);const v=ci.dot(Ma),g=ui.dot(Ma);if(g>=0&&v<=g)return t.copy(a);const m=v*l-c*g;if(m<=0&&l>=0&&g<=0)return o=l/(l-g),t.copy(n).addScaledVector(ui,o);const u=h*g-v*p;if(u<=0&&p-h>=0&&v-g>=0)return No.subVectors(a,r),o=(p-h)/(p-h+(v-g)),t.copy(r).addScaledVector(No,o);const f=1/(u+m+d);return s=m*f,o=d*f,t.copy(n).addScaledVector(ci,s).addScaledVector(ui,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}}class ti{constructor(e=new O(1/0,1/0,1/0),t=new O(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(Zt.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(Zt.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){const n=Zt.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);const n=e.geometry;if(n!==void 0){const a=n.getAttribute("position");if(t===!0&&a!==void 0&&e.isInstancedMesh!==!0)for(let s=0,o=a.count;s<o;s++)e.isMesh===!0?e.getVertexPosition(s,Zt):Zt.fromBufferAttribute(a,s),Zt.applyMatrix4(e.matrixWorld),this.expandByPoint(Zt);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),ur.copy(e.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),ur.copy(n.boundingBox)),ur.applyMatrix4(e.matrixWorld),this.union(ur)}const r=e.children;for(let a=0,s=r.length;a<s;a++)this.expandByObject(r[a],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,Zt),Zt.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Pi),hr.subVectors(this.max,Pi),hi.subVectors(e.a,Pi),di.subVectors(e.b,Pi),fi.subVectors(e.c,Pi),Dn.subVectors(di,hi),Un.subVectors(fi,di),kn.subVectors(hi,fi);let t=[0,-Dn.z,Dn.y,0,-Un.z,Un.y,0,-kn.z,kn.y,Dn.z,0,-Dn.x,Un.z,0,-Un.x,kn.z,0,-kn.x,-Dn.y,Dn.x,0,-Un.y,Un.x,0,-kn.y,kn.x,0];return!Aa(t,hi,di,fi,hr)||(t=[1,0,0,0,1,0,0,0,1],!Aa(t,hi,di,fi,hr))?!1:(dr.crossVectors(Dn,Un),t=[dr.x,dr.y,dr.z],Aa(t,hi,di,fi,hr))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,Zt).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(Zt).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(yn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),yn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),yn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),yn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),yn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),yn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),yn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),yn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(yn),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}}const yn=[new O,new O,new O,new O,new O,new O,new O,new O],Zt=new O,ur=new ti,hi=new O,di=new O,fi=new O,Dn=new O,Un=new O,kn=new O,Pi=new O,hr=new O,dr=new O,Gn=new O;function Aa(i,e,t,n,r){for(let a=0,s=i.length-3;a<=s;a+=3){Gn.fromArray(i,a);const o=r.x*Math.abs(Gn.x)+r.y*Math.abs(Gn.y)+r.z*Math.abs(Gn.z),c=e.dot(Gn),l=t.dot(Gn),h=n.dot(Gn);if(Math.max(-Math.max(c,l,h),Math.min(c,l,h))>o)return!1}return!0}const ft=new O,fr=new Ve;let H0=0;class jt extends ei{constructor(e,t,n=!1){if(super(),Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:H0++}),this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=n,this.usage=Yl,this.updateRanges=[],this.gpuType=Lt,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let r=0,a=this.itemSize;r<a;r++)this.array[e+r]=t.array[n+r];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)fr.fromBufferAttribute(this,t),fr.applyMatrix3(e),this.setXY(t,fr.x,fr.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)ft.fromBufferAttribute(this,t),ft.applyMatrix3(e),this.setXYZ(t,ft.x,ft.y,ft.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)ft.fromBufferAttribute(this,t),ft.applyMatrix4(e),this.setXYZ(t,ft.x,ft.y,ft.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)ft.fromBufferAttribute(this,t),ft.applyNormalMatrix(e),this.setXYZ(t,ft.x,ft.y,ft.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)ft.fromBufferAttribute(this,t),ft.transformDirection(e),this.setXYZ(t,ft.x,ft.y,ft.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=Qt(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=et(n,this.array)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=Qt(t,this.array)),t}setX(e,t){return this.normalized&&(t=et(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=Qt(t,this.array)),t}setY(e,t){return this.normalized&&(t=et(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=Qt(t,this.array)),t}setZ(e,t){return this.normalized&&(t=et(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=Qt(t,this.array)),t}setW(e,t){return this.normalized&&(t=et(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=et(t,this.array),n=et(n,this.array)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,r){return e*=this.itemSize,this.normalized&&(t=et(t,this.array),n=et(n,this.array),r=et(r,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=r,this}setXYZW(e,t,n,r,a){return e*=this.itemSize,this.normalized&&(t=et(t,this.array),n=et(n,this.array),r=et(r,this.array),a=et(a,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=r,this.array[e+3]=a,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return e.name=this.name,e.usage=this.usage,e.gpuType=this.gpuType,e}dispose(){this.dispatchEvent({type:"dispose"})}}class Qs extends jt{constructor(e,t,n){super(new Uint16Array(e),t,n)}}class Ql extends jt{constructor(e,t,n){super(new Uint32Array(e),t,n)}}class tn extends jt{constructor(e,t,n){super(new Float32Array(e),t,n)}}const W0=new ti,Di=new O,Ca=new O;class er{constructor(e=new O,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){const n=this.center;t!==void 0?n.copy(t):W0.setFromPoints(e).getCenter(n);let r=0;for(let a=0,s=e.length;a<s;a++)r=Math.max(r,n.distanceToSquared(e[a]));return this.radius=Math.sqrt(r),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){const t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){const n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;Di.subVectors(e,this.center);const t=Di.lengthSq();if(t>this.radius*this.radius){const n=Math.sqrt(t),r=(n-this.radius)*.5;this.center.addScaledVector(Di,r/n),this.radius+=r}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(Ca.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(Di.copy(e.center).add(Ca)),this.expandByPoint(Di.copy(e.center).sub(Ca))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}}let X0=0;const Ht=new pe,La=new Bt,pi=new O,zt=new ti,Ui=new ti,bt=new O;class nn extends ei{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:X0++}),this.uuid=Sn(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(u0(e)?Ql:Qs)(e,1):this.index=e,this}setIndirect(e,t=0){return this.indirect=e,this.indirectOffset=t,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){const t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);const n=this.attributes.normal;if(n!==void 0){const a=new Pe().getNormalMatrix(e);n.applyNormalMatrix(a),n.needsUpdate=!0}const r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(e),r.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(e){return Ht.makeRotationFromQuaternion(e),this.applyMatrix4(Ht),this}rotateX(e){return Ht.makeRotationX(e),this.applyMatrix4(Ht),this}rotateY(e){return Ht.makeRotationY(e),this.applyMatrix4(Ht),this}rotateZ(e){return Ht.makeRotationZ(e),this.applyMatrix4(Ht),this}translate(e,t,n){return Ht.makeTranslation(e,t,n),this.applyMatrix4(Ht),this}scale(e,t,n){return Ht.makeScale(e,t,n),this.applyMatrix4(Ht),this}lookAt(e){return La.lookAt(e),La.updateMatrix(),this.applyMatrix4(La.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(pi).negate(),this.translate(pi.x,pi.y,pi.z),this}setFromPoints(e){const t=this.getAttribute("position");if(t===void 0){const n=[];for(let r=0,a=e.length;r<a;r++){const s=e[r];n.push(s.x,s.y,s.z||0)}this.setAttribute("position",new tn(n,3))}else{const n=Math.min(e.length,t.count);for(let r=0;r<n;r++){const a=e[r];t.setXYZ(r,a.x,a.y,a.z||0)}e.length>t.count&&Ce("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new ti);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){je("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new O(-1/0,-1/0,-1/0),new O(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let n=0,r=t.length;n<r;n++){const a=t[n];zt.setFromBufferAttribute(a),this.morphTargetsRelative?(bt.addVectors(this.boundingBox.min,zt.min),this.boundingBox.expandByPoint(bt),bt.addVectors(this.boundingBox.max,zt.max),this.boundingBox.expandByPoint(bt)):(this.boundingBox.expandByPoint(zt.min),this.boundingBox.expandByPoint(zt.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&je('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new er);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){je("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new O,1/0);return}if(e){const n=this.boundingSphere.center;if(zt.setFromBufferAttribute(e),t)for(let a=0,s=t.length;a<s;a++){const o=t[a];Ui.setFromBufferAttribute(o),this.morphTargetsRelative?(bt.addVectors(zt.min,Ui.min),zt.expandByPoint(bt),bt.addVectors(zt.max,Ui.max),zt.expandByPoint(bt)):(zt.expandByPoint(Ui.min),zt.expandByPoint(Ui.max))}zt.getCenter(n);let r=0;for(let a=0,s=e.count;a<s;a++)bt.fromBufferAttribute(e,a),r=Math.max(r,n.distanceToSquared(bt));if(t)for(let a=0,s=t.length;a<s;a++){const o=t[a],c=this.morphTargetsRelative;for(let l=0,h=o.count;l<h;l++)bt.fromBufferAttribute(o,l),c&&(pi.fromBufferAttribute(e,l),bt.add(pi)),r=Math.max(r,n.distanceToSquared(bt))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&je('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){je("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const n=t.position,r=t.normal,a=t.uv;let s=this.getAttribute("tangent");(s===void 0||s.count!==n.count)&&(s=new jt(new Float32Array(4*n.count),4),this.setAttribute("tangent",s));const o=[],c=[];for(let _=0;_<n.count;_++)o[_]=new O,c[_]=new O;const l=new O,h=new O,p=new O,d=new Ve,v=new Ve,g=new Ve,m=new O,u=new O;function f(_,E,L){l.fromBufferAttribute(n,_),h.fromBufferAttribute(n,E),p.fromBufferAttribute(n,L),d.fromBufferAttribute(a,_),v.fromBufferAttribute(a,E),g.fromBufferAttribute(a,L),h.sub(l),p.sub(l),v.sub(d),g.sub(d);const T=1/(v.x*g.y-g.x*v.y);isFinite(T)&&(m.copy(h).multiplyScalar(g.y).addScaledVector(p,-v.y).multiplyScalar(T),u.copy(p).multiplyScalar(v.x).addScaledVector(h,-g.x).multiplyScalar(T),o[_].add(m),o[E].add(m),o[L].add(m),c[_].add(u),c[E].add(u),c[L].add(u))}let w=this.groups;w.length===0&&(w=[{start:0,count:e.count}]);for(let _=0,E=w.length;_<E;++_){const L=w[_],T=L.start,P=L.count;for(let U=T,D=T+P;U<D;U+=3)f(e.getX(U+0),e.getX(U+1),e.getX(U+2))}const C=new O,M=new O,x=new O,S=new O;function R(_){x.fromBufferAttribute(r,_),S.copy(x);const E=o[_];C.copy(E),C.sub(x.multiplyScalar(x.dot(E))).normalize(),M.crossVectors(S,E);const T=M.dot(c[_])<0?-1:1;s.setXYZW(_,C.x,C.y,C.z,T)}for(let _=0,E=w.length;_<E;++_){const L=w[_],T=L.start,P=L.count;for(let U=T,D=T+P;U<D;U+=3)R(e.getX(U+0)),R(e.getX(U+1)),R(e.getX(U+2))}this._transformed=!0}computeVertexNormals(){const e=this.index,t=this.getAttribute("position");if(t!==void 0){let n=this.getAttribute("normal");if(n===void 0||n.count!==t.count)n=new jt(new Float32Array(t.count*3),3),this.setAttribute("normal",n);else for(let d=0,v=n.count;d<v;d++)n.setXYZ(d,0,0,0);const r=new O,a=new O,s=new O,o=new O,c=new O,l=new O,h=new O,p=new O;if(e)for(let d=0,v=e.count;d<v;d+=3){const g=e.getX(d+0),m=e.getX(d+1),u=e.getX(d+2);r.fromBufferAttribute(t,g),a.fromBufferAttribute(t,m),s.fromBufferAttribute(t,u),h.subVectors(s,a),p.subVectors(r,a),h.cross(p),o.fromBufferAttribute(n,g),c.fromBufferAttribute(n,m),l.fromBufferAttribute(n,u),o.add(h),c.add(h),l.add(h),n.setXYZ(g,o.x,o.y,o.z),n.setXYZ(m,c.x,c.y,c.z),n.setXYZ(u,l.x,l.y,l.z)}else for(let d=0,v=t.count;d<v;d+=3)r.fromBufferAttribute(t,d+0),a.fromBufferAttribute(t,d+1),s.fromBufferAttribute(t,d+2),h.subVectors(s,a),p.subVectors(r,a),h.cross(p),n.setXYZ(d+0,h.x,h.y,h.z),n.setXYZ(d+1,h.x,h.y,h.z),n.setXYZ(d+2,h.x,h.y,h.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){const e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)bt.fromBufferAttribute(e,t),bt.normalize(),e.setXYZ(t,bt.x,bt.y,bt.z)}toNonIndexed(){function e(o,c){const l=o.array,h=o.itemSize,p=o.normalized,d=new l.constructor(c.length*h);let v=0,g=0;for(let m=0,u=c.length;m<u;m++){o.isInterleavedBufferAttribute?v=c[m]*o.data.stride+o.offset:v=c[m]*h;for(let f=0;f<h;f++)d[g++]=l[v++]}return new jt(d,h,p)}if(this.index===null)return Ce("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const t=new nn,n=this.index.array,r=this.attributes;for(const o in r){const c=r[o],l=e(c,n);t.setAttribute(o,l)}const a=this.morphAttributes;for(const o in a){const c=[],l=a[o];for(let h=0,p=l.length;h<p;h++){const d=l[h],v=e(d,n);c.push(v)}t.morphAttributes[o]=c}t.morphTargetsRelative=this.morphTargetsRelative;const s=this.groups;for(let o=0,c=s.length;o<c;o++){const l=s[o];t.addGroup(l.start,l.count,l.materialIndex)}return t}toJSON(){const e={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,e.name=this.name,Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){const c=this.parameters;for(const l in c)c[l]!==void 0&&(e[l]=c[l]);return e}e.data={attributes:{}};const t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});const n=this.attributes;for(const c in n){const l=n[c];e.data.attributes[c]=l.toJSON(e.data)}const r={};let a=!1;for(const c in this.morphAttributes){const l=this.morphAttributes[c],h=[];for(let p=0,d=l.length;p<d;p++){const v=l[p];h.push(v.toJSON(e.data))}h.length>0&&(r[c]=h,a=!0)}a&&(e.data.morphAttributes=r,e.data.morphTargetsRelative=this.morphTargetsRelative);const s=this.groups;s.length>0&&(e.data.groups=JSON.parse(JSON.stringify(s)));const o=this.boundingSphere;return o!==null&&(e.data.boundingSphere=o.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const t={};this.name=e.name;const n=e.index;n!==null&&this.setIndex(n.clone());const r=e.attributes;for(const l in r){const h=r[l];this.setAttribute(l,h.clone(t))}const a=e.morphAttributes;for(const l in a){const h=[],p=a[l];for(let d=0,v=p.length;d<v;d++)h.push(p[d].clone(t));this.morphAttributes[l]=h}this.morphTargetsRelative=e.morphTargetsRelative;const s=e.groups;for(let l=0,h=s.length;l<h;l++){const p=s[l];this.addGroup(p.start,p.count,p.materialIndex)}const o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());const c=e.boundingSphere;return c!==null&&(this.boundingSphere=c.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this._transformed=e._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}}class j0{constructor(e,t){this.isInterleavedBuffer=!0,this.array=e,this.stride=t,this.count=e!==void 0?e.length/t:0,this.usage=Yl,this.updateRanges=[],this.version=0,this.uuid=Sn()}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.array=new e.array.constructor(e.array),this.count=e.count,this.stride=e.stride,this.usage=e.usage,this}copyAt(e,t,n){e*=this.stride,n*=t.stride;for(let r=0,a=this.stride;r<a;r++)this.array[e+r]=t.array[n+r];return this}set(e,t=0){return this.array.set(e,t),this}clone(e){e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=Sn()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer);const t=new this.array.constructor(e.arrayBuffers[this.array.buffer._uuid]),n=new this.constructor(t,this.stride);return n.setUsage(this.usage),n}onUpload(e){return this.onUploadCallback=e,this}toJSON(e){e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=Sn()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer)));const t={uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride};return t.usage=this.usage,t}}const At=new O;class eo{constructor(e,t,n,r=!1){this.isInterleavedBufferAttribute=!0,this.name="",this.data=e,this.itemSize=t,this.offset=n,this.normalized=r}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(e){this.data.needsUpdate=e}applyMatrix4(e){for(let t=0,n=this.data.count;t<n;t++)At.fromBufferAttribute(this,t),At.applyMatrix4(e),this.setXYZ(t,At.x,At.y,At.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)At.fromBufferAttribute(this,t),At.applyNormalMatrix(e),this.setXYZ(t,At.x,At.y,At.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)At.fromBufferAttribute(this,t),At.transformDirection(e),this.setXYZ(t,At.x,At.y,At.z);return this}getComponent(e,t){let n=this.array[e*this.data.stride+this.offset+t];return this.normalized&&(n=Qt(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=et(n,this.array)),this.data.array[e*this.data.stride+this.offset+t]=n,this}setX(e,t){return this.normalized&&(t=et(t,this.array)),this.data.array[e*this.data.stride+this.offset]=t,this}setY(e,t){return this.normalized&&(t=et(t,this.array)),this.data.array[e*this.data.stride+this.offset+1]=t,this}setZ(e,t){return this.normalized&&(t=et(t,this.array)),this.data.array[e*this.data.stride+this.offset+2]=t,this}setW(e,t){return this.normalized&&(t=et(t,this.array)),this.data.array[e*this.data.stride+this.offset+3]=t,this}getX(e){let t=this.data.array[e*this.data.stride+this.offset];return this.normalized&&(t=Qt(t,this.array)),t}getY(e){let t=this.data.array[e*this.data.stride+this.offset+1];return this.normalized&&(t=Qt(t,this.array)),t}getZ(e){let t=this.data.array[e*this.data.stride+this.offset+2];return this.normalized&&(t=Qt(t,this.array)),t}getW(e){let t=this.data.array[e*this.data.stride+this.offset+3];return this.normalized&&(t=Qt(t,this.array)),t}setXY(e,t,n){return e=e*this.data.stride+this.offset,this.normalized&&(t=et(t,this.array),n=et(n,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this}setXYZ(e,t,n,r){return e=e*this.data.stride+this.offset,this.normalized&&(t=et(t,this.array),n=et(n,this.array),r=et(r,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this.data.array[e+2]=r,this}setXYZW(e,t,n,r,a){return e=e*this.data.stride+this.offset,this.normalized&&(t=et(t,this.array),n=et(n,this.array),r=et(r,this.array),a=et(a,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this.data.array[e+2]=r,this.data.array[e+3]=a,this}clone(e){if(e===void 0){jr("InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.");const t=[];for(let n=0;n<this.count;n++){const r=n*this.data.stride+this.offset;for(let a=0;a<this.itemSize;a++)t.push(this.data.array[r+a])}return new jt(new this.array.constructor(t),this.itemSize,this.normalized)}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.clone(e)),new eo(e.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(e){if(e===void 0){jr("InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.");const t=[];for(let n=0;n<this.count;n++){const r=n*this.data.stride+this.offset;for(let a=0;a<this.itemSize;a++)t.push(this.data.array[r+a])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:t,normalized:this.normalized}}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.toJSON(e)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}}const Pa=new O,q0=new O,Y0=new Pe;class Nn{constructor(e=new O(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,r){return this.normal.set(e,t,n),this.constant=r,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){const r=Pa.subVectors(n,t).cross(q0.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(r,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){const e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t,n=!0){const r=e.delta(Pa),a=this.normal.dot(r);if(a===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;const s=-(e.start.dot(this.normal)+this.constant)/a;return n===!0&&(s<0||s>1)?null:t.copy(e.start).addScaledVector(r,s)}intersectsLine(e){const t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){const n=t||Y0.getNormalMatrix(e),r=this.coplanarPoint(Pa).applyMatrix4(e),a=this.normal.applyMatrix3(n).normalize();return this.constant=-r.dot(a),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(e){return this.normal.fromArray(e.normal),this.constant=e.constant,this}}let $0=0;class ra extends ei{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:$0++}),this.uuid=Sn(),this.name="",this.type="Material",this.blending=Hi,this.side=Fn,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Pl,this.blendDst=Dl,this.blendEquation=xi,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new qe(0,0,0),this.blendAlpha=0,this.depthFunc=Yi,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=i0,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=da,this.stencilZFail=da,this.stencilZPass=da,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(const t in e){const n=e[t];if(n===void 0){Ce(`Material: parameter '${t}' has value of undefined.`);continue}const r=this[t];if(r===void 0){Ce(`Material: '${t}' is not a property of THREE.${this.type}.`);continue}r&&r.isColor?r.set(n):r&&r.isVector2&&n&&n.isVector2||r&&r.isEuler&&n&&n.isEuler||r&&r.isVector3&&n&&n.isVector3?r.copy(n):this[t]=n}}toJSON(e){const t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});const n={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,n.blending=this.blending,n.side=this.side,n.shadowSide=this.shadowSide,n.vertexColors=this.vertexColors,n.opacity=this.opacity,n.transparent=this.transparent,n.blendSrc=this.blendSrc,n.blendDst=this.blendDst,n.blendEquation=this.blendEquation,n.blendSrcAlpha=this.blendSrcAlpha,n.blendDstAlpha=this.blendDstAlpha,n.blendEquationAlpha=this.blendEquationAlpha,n.blendColor=this.blendColor.getHex(),n.blendAlpha=this.blendAlpha,n.depthFunc=this.depthFunc,n.depthTest=this.depthTest,n.depthWrite=this.depthWrite,n.colorWrite=this.colorWrite,n.clipIntersection=this.clipIntersection,n.clipShadows=this.clipShadows,n.stencilWriteMask=this.stencilWriteMask,n.stencilFunc=this.stencilFunc,n.stencilRef=this.stencilRef,n.stencilFuncMask=this.stencilFuncMask,n.stencilFail=this.stencilFail,n.stencilZFail=this.stencilZFail,n.stencilZPass=this.stencilZPass,n.stencilWrite=this.stencilWrite,n.polygonOffset=this.polygonOffset,n.polygonOffsetFactor=this.polygonOffsetFactor,n.polygonOffsetUnits=this.polygonOffsetUnits,n.dithering=this.dithering,n.alphaTest=this.alphaTest,n.alphaHash=this.alphaHash,n.alphaToCoverage=this.alphaToCoverage,n.premultipliedAlpha=this.premultipliedAlpha,n.forceSinglePass=this.forceSinglePass,n.allowOverride=this.allowOverride,n.visible=this.visible,n.toneMapped=this.toneMapped,n.name=this.name,this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(n.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(n.clippingPlanes=this.clippingPlanes.map(a=>a.toJSON())),this.rotation!==void 0&&(n.rotation=this.rotation),this.depthPacking!==void 0&&(n.depthPacking=this.depthPacking),this.linewidth!==void 0&&(n.linewidth=this.linewidth),this.linecap!==void 0&&(n.linecap=this.linecap),this.linejoin!==void 0&&(n.linejoin=this.linejoin),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.wireframe!==void 0&&(n.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(n.flatShading=this.flatShading),this.fog!==void 0&&(n.fog=this.fog),Object.keys(this.userData).length>0&&(n.userData=this.userData);function r(a){const s=[];for(const o in a){const c=a[o];delete c.metadata,s.push(c)}return s}if(t){const a=r(e.textures),s=r(e.images);a.length>0&&(n.textures=a),s.length>0&&(n.images=s)}return n}fromJSON(e,t){if(e.uuid!==void 0&&(this.uuid=e.uuid),e.name!==void 0&&(this.name=e.name),e.color!==void 0&&this.color!==void 0&&this.color.setHex(e.color),e.roughness!==void 0&&(this.roughness=e.roughness),e.metalness!==void 0&&(this.metalness=e.metalness),e.sheen!==void 0&&(this.sheen=e.sheen),e.sheenColor!==void 0&&(this.sheenColor=new qe().setHex(e.sheenColor)),e.sheenRoughness!==void 0&&(this.sheenRoughness=e.sheenRoughness),e.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(e.emissive),e.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(e.specular),e.specularIntensity!==void 0&&(this.specularIntensity=e.specularIntensity),e.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(e.specularColor),e.shininess!==void 0&&(this.shininess=e.shininess),e.clearcoat!==void 0&&(this.clearcoat=e.clearcoat),e.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=e.clearcoatRoughness),e.dispersion!==void 0&&(this.dispersion=e.dispersion),e.retroreflectivity!==void 0&&(this.retroreflectivity=e.retroreflectivity),e.iridescence!==void 0&&(this.iridescence=e.iridescence),e.iridescenceIOR!==void 0&&(this.iridescenceIOR=e.iridescenceIOR),e.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessRange=e.iridescenceThicknessRange),e.transmission!==void 0&&(this.transmission=e.transmission),e.thickness!==void 0&&(this.thickness=e.thickness),e.attenuationDistance!==void 0&&(this.attenuationDistance=e.attenuationDistance),e.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(e.attenuationColor),e.anisotropy!==void 0&&(this.anisotropy=e.anisotropy),e.anisotropyRotation!==void 0&&(this.anisotropyRotation=e.anisotropyRotation),e.fog!==void 0&&(this.fog=e.fog),e.flatShading!==void 0&&(this.flatShading=e.flatShading),e.blending!==void 0&&(this.blending=e.blending),e.combine!==void 0&&(this.combine=e.combine),e.side!==void 0&&(this.side=e.side),e.shadowSide!==void 0&&(this.shadowSide=e.shadowSide),e.opacity!==void 0&&(this.opacity=e.opacity),e.transparent!==void 0&&(this.transparent=e.transparent),e.alphaTest!==void 0&&(this.alphaTest=e.alphaTest),e.alphaHash!==void 0&&(this.alphaHash=e.alphaHash),e.depthFunc!==void 0&&(this.depthFunc=e.depthFunc),e.depthTest!==void 0&&(this.depthTest=e.depthTest),e.depthWrite!==void 0&&(this.depthWrite=e.depthWrite),e.colorWrite!==void 0&&(this.colorWrite=e.colorWrite),e.clippingPlanes!==void 0&&(this.clippingPlanes=e.clippingPlanes.map(n=>new Nn().fromJSON(n))),e.clipIntersection!==void 0&&(this.clipIntersection=e.clipIntersection),e.clipShadows!==void 0&&(this.clipShadows=e.clipShadows),e.depthPacking!==void 0&&(this.depthPacking=e.depthPacking),e.blendSrc!==void 0&&(this.blendSrc=e.blendSrc),e.blendDst!==void 0&&(this.blendDst=e.blendDst),e.blendEquation!==void 0&&(this.blendEquation=e.blendEquation),e.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=e.blendSrcAlpha),e.blendDstAlpha!==void 0&&(this.blendDstAlpha=e.blendDstAlpha),e.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=e.blendEquationAlpha),e.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(e.blendColor),e.blendAlpha!==void 0&&(this.blendAlpha=e.blendAlpha),e.stencilWriteMask!==void 0&&(this.stencilWriteMask=e.stencilWriteMask),e.stencilFunc!==void 0&&(this.stencilFunc=e.stencilFunc),e.stencilRef!==void 0&&(this.stencilRef=e.stencilRef),e.stencilFuncMask!==void 0&&(this.stencilFuncMask=e.stencilFuncMask),e.stencilFail!==void 0&&(this.stencilFail=e.stencilFail),e.stencilZFail!==void 0&&(this.stencilZFail=e.stencilZFail),e.stencilZPass!==void 0&&(this.stencilZPass=e.stencilZPass),e.stencilWrite!==void 0&&(this.stencilWrite=e.stencilWrite),e.wireframe!==void 0&&(this.wireframe=e.wireframe),e.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=e.wireframeLinewidth),e.wireframeLinecap!==void 0&&(this.wireframeLinecap=e.wireframeLinecap),e.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=e.wireframeLinejoin),e.rotation!==void 0&&(this.rotation=e.rotation),e.linewidth!==void 0&&(this.linewidth=e.linewidth),e.linecap!==void 0&&(this.linecap=e.linecap),e.linejoin!==void 0&&(this.linejoin=e.linejoin),e.dashSize!==void 0&&(this.dashSize=e.dashSize),e.gapSize!==void 0&&(this.gapSize=e.gapSize),e.scale!==void 0&&(this.scale=e.scale),e.polygonOffset!==void 0&&(this.polygonOffset=e.polygonOffset),e.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=e.polygonOffsetFactor),e.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=e.polygonOffsetUnits),e.dithering!==void 0&&(this.dithering=e.dithering),e.alphaToCoverage!==void 0&&(this.alphaToCoverage=e.alphaToCoverage),e.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=e.premultipliedAlpha),e.forceSinglePass!==void 0&&(this.forceSinglePass=e.forceSinglePass),e.allowOverride!==void 0&&(this.allowOverride=e.allowOverride),e.visible!==void 0&&(this.visible=e.visible),e.toneMapped!==void 0&&(this.toneMapped=e.toneMapped),e.userData!==void 0&&(this.userData=e.userData),e.vertexColors!==void 0&&(typeof e.vertexColors=="number"?this.vertexColors=e.vertexColors>0:this.vertexColors=e.vertexColors),e.size!==void 0&&(this.size=e.size),e.sizeAttenuation!==void 0&&(this.sizeAttenuation=e.sizeAttenuation),e.map!==void 0&&(this.map=t[e.map]||null),e.matcap!==void 0&&(this.matcap=t[e.matcap]||null),e.alphaMap!==void 0&&(this.alphaMap=t[e.alphaMap]||null),e.bumpMap!==void 0&&(this.bumpMap=t[e.bumpMap]||null),e.bumpScale!==void 0&&(this.bumpScale=e.bumpScale),e.normalMap!==void 0&&(this.normalMap=t[e.normalMap]||null),e.normalMapType!==void 0&&(this.normalMapType=e.normalMapType),e.normalScale!==void 0){let n=e.normalScale;Array.isArray(n)===!1&&(n=[n,n]),this.normalScale=new Ve().fromArray(n)}return e.displacementMap!==void 0&&(this.displacementMap=t[e.displacementMap]||null),e.displacementScale!==void 0&&(this.displacementScale=e.displacementScale),e.displacementBias!==void 0&&(this.displacementBias=e.displacementBias),e.roughnessMap!==void 0&&(this.roughnessMap=t[e.roughnessMap]||null),e.metalnessMap!==void 0&&(this.metalnessMap=t[e.metalnessMap]||null),e.emissiveMap!==void 0&&(this.emissiveMap=t[e.emissiveMap]||null),e.emissiveIntensity!==void 0&&(this.emissiveIntensity=e.emissiveIntensity),e.specularMap!==void 0&&(this.specularMap=t[e.specularMap]||null),e.specularIntensityMap!==void 0&&(this.specularIntensityMap=t[e.specularIntensityMap]||null),e.specularColorMap!==void 0&&(this.specularColorMap=t[e.specularColorMap]||null),e.envMap!==void 0&&(this.envMap=t[e.envMap]||null),e.envMapRotation!==void 0&&this.envMapRotation.fromArray(e.envMapRotation),e.envMapIntensity!==void 0&&(this.envMapIntensity=e.envMapIntensity),e.reflectivity!==void 0&&(this.reflectivity=e.reflectivity),e.refractionRatio!==void 0&&(this.refractionRatio=e.refractionRatio),e.lightMap!==void 0&&(this.lightMap=t[e.lightMap]||null),e.lightMapIntensity!==void 0&&(this.lightMapIntensity=e.lightMapIntensity),e.aoMap!==void 0&&(this.aoMap=t[e.aoMap]||null),e.aoMapIntensity!==void 0&&(this.aoMapIntensity=e.aoMapIntensity),e.gradientMap!==void 0&&(this.gradientMap=t[e.gradientMap]||null),e.clearcoatMap!==void 0&&(this.clearcoatMap=t[e.clearcoatMap]||null),e.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=t[e.clearcoatRoughnessMap]||null),e.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=t[e.clearcoatNormalMap]||null),e.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new Ve().fromArray(e.clearcoatNormalScale)),e.iridescenceMap!==void 0&&(this.iridescenceMap=t[e.iridescenceMap]||null),e.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=t[e.iridescenceThicknessMap]||null),e.transmissionMap!==void 0&&(this.transmissionMap=t[e.transmissionMap]||null),e.thicknessMap!==void 0&&(this.thicknessMap=t[e.thicknessMap]||null),e.anisotropyMap!==void 0&&(this.anisotropyMap=t[e.anisotropyMap]||null),e.sheenColorMap!==void 0&&(this.sheenColorMap=t[e.sheenColorMap]||null),e.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=t[e.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;const t=e.clippingPlanes;let n=null;if(t!==null){const r=t.length;n=new Array(r);for(let a=0;a!==r;++a)n[a]=t[a].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}}const xn=new O,Da=new O,pr=new O,mr=new O;class K0{constructor(e=new O,t=new O(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,xn)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);const n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){const t=xn.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(xn.copy(this.origin).addScaledVector(this.direction,t),xn.distanceToSquared(e))}distanceSqToSegment(e,t,n,r){Da.copy(e).add(t).multiplyScalar(.5),pr.copy(t).sub(e).normalize(),mr.copy(this.origin).sub(Da);const a=e.distanceTo(t)*.5,s=-this.direction.dot(pr),o=mr.dot(this.direction),c=-mr.dot(pr),l=mr.lengthSq(),h=Math.abs(1-s*s);let p,d,v,g;if(h>0)if(p=s*c-o,d=s*o-c,g=a*h,p>=0)if(d>=-g)if(d<=g){const m=1/h;p*=m,d*=m,v=p*(p+s*d+2*o)+d*(s*p+d+2*c)+l}else d=a,p=Math.max(0,-(s*d+o)),v=-p*p+d*(d+2*c)+l;else d=-a,p=Math.max(0,-(s*d+o)),v=-p*p+d*(d+2*c)+l;else d<=-g?(p=Math.max(0,-(-s*a+o)),d=p>0?-a:Math.min(Math.max(-a,-c),a),v=-p*p+d*(d+2*c)+l):d<=g?(p=0,d=Math.min(Math.max(-a,-c),a),v=d*(d+2*c)+l):(p=Math.max(0,-(s*a+o)),d=p>0?a:Math.min(Math.max(-a,-c),a),v=-p*p+d*(d+2*c)+l);else d=s>0?-a:a,p=Math.max(0,-(s*d+o)),v=-p*p+d*(d+2*c)+l;return n&&n.copy(this.origin).addScaledVector(this.direction,p),r&&r.copy(Da).addScaledVector(pr,d),v}intersectSphere(e,t){if(e.radius<0)return null;xn.subVectors(e.center,this.origin);const n=xn.dot(this.direction),r=xn.dot(xn)-n*n,a=e.radius*e.radius;if(r>a)return null;const s=Math.sqrt(a-r),o=n-s,c=n+s;return c<0?null:o<0?this.at(c,t):this.at(o,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){const t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;const n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){const n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){const t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,r,a,s,o,c;const l=1/this.direction.x,h=1/this.direction.y,p=1/this.direction.z,d=this.origin;return l>=0?(n=(e.min.x-d.x)*l,r=(e.max.x-d.x)*l):(n=(e.max.x-d.x)*l,r=(e.min.x-d.x)*l),h>=0?(a=(e.min.y-d.y)*h,s=(e.max.y-d.y)*h):(a=(e.max.y-d.y)*h,s=(e.min.y-d.y)*h),n>s||a>r||((a>n||isNaN(n))&&(n=a),(s<r||isNaN(r))&&(r=s),p>=0?(o=(e.min.z-d.z)*p,c=(e.max.z-d.z)*p):(o=(e.max.z-d.z)*p,c=(e.min.z-d.z)*p),n>c||o>r)||((o>n||n!==n)&&(n=o),(c<r||r!==r)&&(r=c),r<0)?null:this.at(n>=0?n:r,t)}intersectsBox(e){return this.intersectBox(e,xn)!==null}intersectTriangle(e,t,n,r,a){const s=this.origin,o=this.direction,c=o.x,l=o.y,h=o.z,p=e.x-s.x,d=e.y-s.y,v=e.z-s.z,g=t.x-s.x,m=t.y-s.y,u=t.z-s.z,f=n.x-s.x,w=n.y-s.y,C=n.z-s.z,M=Math.abs(c),x=Math.abs(l),S=Math.abs(h);let R,_,E,L,T,P,U,D,z,W,j,Z;if(M>=x&&M>=S?(E=c,P=p,z=g,Z=f,c>=0?(R=l,_=h,L=d,T=v,U=m,D=u,W=w,j=C):(R=h,_=l,L=v,T=d,U=u,D=m,W=C,j=w)):x>=S?(E=l,P=d,z=m,Z=w,l>=0?(R=h,_=c,L=v,T=p,U=u,D=g,W=C,j=f):(R=c,_=h,L=p,T=v,U=g,D=u,W=f,j=C)):(E=h,P=v,z=u,Z=C,h>=0?(R=c,_=l,L=p,T=d,U=g,D=m,W=f,j=w):(R=l,_=c,L=d,T=p,U=m,D=g,W=w,j=f)),E===0)return null;const I=R/E,q=_/E,Q=1/E,Me=L-I*P,we=T-q*P,Ze=U-I*z,Fe=D-q*z,He=W-I*Z,Y=j-q*Z,ee=He*Fe-Y*Ze,_e=Me*Y-we*He,Le=Ze*we-Fe*Me;if(r){if(ee<0||_e<0||Le<0)return null}else if((ee<0||_e<0||Le<0)&&(ee>0||_e>0||Le>0))return null;const ve=ee+_e+Le;if(ve===0)return null;const Ne=Q*(ee*P+_e*z+Le*Z);return(ve>0?Ne<0:Ne>0)?null:this.at(Ne/ve,a)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class ec extends ra{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new qe(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Zn,this.combine=Ul,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}}const Fo=new pe,Vn=new K0,vr=new er,Bo=new O,gr=new O,_r=new O,yr=new O,Ua=new O,xr=new O,Oo=new O,br=new O;class Gt extends Bt{constructor(e=new nn,t=new ec){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){const t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){const r=t[n[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let a=0,s=r.length;a<s;a++){const o=r[a].name||String(a);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=a}}}}getVertexPosition(e,t){const n=this.geometry,r=n.attributes.position,a=n.morphAttributes.position,s=n.morphTargetsRelative;t.fromBufferAttribute(r,e);const o=this.morphTargetInfluences;if(a&&o){xr.set(0,0,0);for(let c=0,l=a.length;c<l;c++){const h=o[c],p=a[c];h!==0&&(Ua.fromBufferAttribute(p,e),s?xr.addScaledVector(Ua,h):xr.addScaledVector(Ua.sub(t),h))}t.add(xr)}return t}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){const n=this.geometry,r=this.material,a=this.matrixWorld;r!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),vr.copy(n.boundingSphere),vr.applyMatrix4(a),Vn.copy(e.ray).recast(e.near),!(vr.containsPoint(Vn.origin)===!1&&(Vn.intersectSphere(vr,Bo)===null||Vn.origin.distanceToSquared(Bo)>(e.far-e.near)**2))&&(Fo.copy(a).invert(),Vn.copy(e.ray).applyMatrix4(Fo),!(n.boundingBox!==null&&Vn.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(e,t,Vn)))}_computeIntersections(e,t,n){let r;const a=this.geometry,s=this.material,o=a.index,c=a.attributes.position,l=a.attributes.uv,h=a.attributes.uv1,p=a.attributes.normal,d=a.groups,v=a.drawRange;if(o!==null)if(Array.isArray(s))for(let g=0,m=d.length;g<m;g++){const u=d[g],f=s[u.materialIndex],w=Math.max(u.start,v.start),C=Math.min(o.count,Math.min(u.start+u.count,v.start+v.count));for(let M=w,x=C;M<x;M+=3){const S=o.getX(M),R=o.getX(M+1),_=o.getX(M+2);r=wr(this,f,e,n,l,h,p,S,R,_),r&&(r.faceIndex=Math.floor(M/3),r.face.materialIndex=u.materialIndex,t.push(r))}}else{const g=Math.max(0,v.start),m=Math.min(o.count,v.start+v.count);for(let u=g,f=m;u<f;u+=3){const w=o.getX(u),C=o.getX(u+1),M=o.getX(u+2);r=wr(this,s,e,n,l,h,p,w,C,M),r&&(r.faceIndex=Math.floor(u/3),t.push(r))}}else if(c!==void 0)if(Array.isArray(s))for(let g=0,m=d.length;g<m;g++){const u=d[g],f=s[u.materialIndex],w=Math.max(u.start,v.start),C=Math.min(c.count,Math.min(u.start+u.count,v.start+v.count));for(let M=w,x=C;M<x;M+=3){const S=M,R=M+1,_=M+2;r=wr(this,f,e,n,l,h,p,S,R,_),r&&(r.faceIndex=Math.floor(M/3),r.face.materialIndex=u.materialIndex,t.push(r))}}else{const g=Math.max(0,v.start),m=Math.min(c.count,v.start+v.count);for(let u=g,f=m;u<f;u+=3){const w=u,C=u+1,M=u+2;r=wr(this,s,e,n,l,h,p,w,C,M),r&&(r.faceIndex=Math.floor(u/3),t.push(r))}}}}function Z0(i,e,t,n,r,a,s,o){let c;if(e.side===Ft?c=n.intersectTriangle(s,a,r,!0,o):c=n.intersectTriangle(r,a,s,e.side===Fn,o),c===null)return null;br.copy(o),br.applyMatrix4(i.matrixWorld);const l=t.ray.origin.distanceTo(br);return l<t.near||l>t.far?null:{distance:l,point:br.clone(),object:i}}function wr(i,e,t,n,r,a,s,o,c,l){i.getVertexPosition(o,gr),i.getVertexPosition(c,_r),i.getVertexPosition(l,yr);const h=Z0(i,e,t,n,gr,_r,yr,Oo);if(h){const p=new O;kt.getBarycoord(Oo,gr,_r,yr,p),r&&(h.uv=kt.getInterpolatedAttribute(r,o,c,l,p,new Ve)),a&&(h.uv1=kt.getInterpolatedAttribute(a,o,c,l,p,new Ve)),s&&(h.normal=kt.getInterpolatedAttribute(s,o,c,l,p,new O),h.normal.dot(n.direction)>0&&h.normal.multiplyScalar(-1));const d={a:o,b:c,c:l,normal:new O,materialIndex:0};kt.getNormal(gr,_r,yr,d.normal),h.face=d,h.barycoord=p}return h}class wi extends Dt{constructor(e=null,t=1,n=1,r,a,s,o,c,l=gt,h=gt,p,d){super(null,s,o,c,l,h,r,a,p,d),this.isDataTexture=!0,this.image={data:e,width:t,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class qr extends jt{constructor(e,t,n,r=1){super(e,t,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=r}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){const e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}}const mi=new pe,zo=new pe,Sr=[],ko=new ti,J0=new pe,Ii=new Gt,Ni=new er;class Q0 extends Gt{constructor(e,t,n){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new qr(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let r=0;r<n;r++)this.setMatrixAt(r,J0)}computeBoundingBox(){const e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new ti),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,mi),ko.copy(e.boundingBox).applyMatrix4(mi),this.boundingBox.union(ko)}computeBoundingSphere(){const e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new er),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,mi),Ni.copy(e.boundingSphere).applyMatrix4(mi),this.boundingSphere.union(Ni)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),e.morphTexture!==null&&(this.morphTexture=e.morphTexture.clone()),e.instanceColor!==null&&(this.instanceColor=e.instanceColor.clone()),this.count=e.count,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}getColorAt(e,t){return this.instanceColor===null?t.setRGB(1,1,1):t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){return t.fromArray(this.instanceMatrix.array,e*16)}getMorphAt(e,t){const n=t.morphTargetInfluences,r=this.morphTexture.source.data.data,a=n.length+1,s=e*a+1;for(let o=0;o<n.length;o++)n[o]=r[s+o]}raycast(e,t){const n=this.matrixWorld,r=this.count;if(Ii.geometry=this.geometry,Ii.material=this.material,Ii.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Ni.copy(this.boundingSphere),Ni.applyMatrix4(n),e.ray.intersectsSphere(Ni)!==!1))for(let a=0;a<r;a++){this.getMatrixAt(a,mi),zo.multiplyMatrices(n,mi),Ii.matrixWorld=zo,Ii.raycast(e,Sr);for(let s=0,o=Sr.length;s<o;s++){const c=Sr[s];c.instanceId=a,c.object=this,t.push(c)}Sr.length=0}}setColorAt(e,t){return this.instanceColor===null&&(this.instanceColor=new qr(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),t.toArray(this.instanceColor.array,e*3),this}setMatrixAt(e,t){return t.toArray(this.instanceMatrix.array,e*16),this}setMorphAt(e,t){const n=t.morphTargetInfluences,r=n.length+1;this.morphTexture===null&&(this.morphTexture=new wi(new Float32Array(r*this.count),r,this.count,na,Lt));const a=this.morphTexture.source.data.data;let s=0;for(let l=0;l<n.length;l++)s+=n[l];const o=this.geometry.morphTargetsRelative?1:1-s,c=r*e;return a[c]=o,a.set(n,c+1),this}updateMorphTargets(){}dispose(){super.dispose(),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null)}}const Hn=new er,eu=new Ve(.5,.5),Mr=new O;class tc{constructor(e=new Nn,t=new Nn,n=new Nn,r=new Nn,a=new Nn,s=new Nn){this.planes=[e,t,n,r,a,s]}set(e,t,n,r,a,s){const o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(n),o[3].copy(r),o[4].copy(a),o[5].copy(s),this}copy(e){const t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=un,n=!1){const r=this.planes,a=e.elements,s=a[0],o=a[1],c=a[2],l=a[3],h=a[4],p=a[5],d=a[6],v=a[7],g=a[8],m=a[9],u=a[10],f=a[11],w=a[12],C=a[13],M=a[14],x=a[15];if(r[0].setComponents(l-s,v-h,f-g,x-w).normalize(),r[1].setComponents(l+s,v+h,f+g,x+w).normalize(),r[2].setComponents(l+o,v+p,f+m,x+C).normalize(),r[3].setComponents(l-o,v-p,f-m,x-C).normalize(),n)r[4].setComponents(c,d,u,M).normalize(),r[5].setComponents(l-c,v-d,f-u,x-M).normalize();else if(r[4].setComponents(l-c,v-d,f-u,x-M).normalize(),t===un)r[5].setComponents(l+c,v+d,f+u,x+M).normalize();else if(t===Wr)r[5].setComponents(c,d,u,M).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),Hn.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{const t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),Hn.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(Hn)}intersectsSprite(e){Hn.center.set(0,0,0);const t=eu.distanceTo(e.center);return Hn.radius=.7071067811865476+t,Hn.applyMatrix4(e.matrixWorld),this.intersectsSphere(Hn)}intersectsSphere(e){const t=this.planes,n=e.center,r=-e.radius;for(let a=0;a<6;a++)if(t[a].distanceToPoint(n)<r)return!1;return!0}intersectsBox(e){const t=this.planes;for(let n=0;n<6;n++){const r=t[n];if(Mr.x=r.normal.x>0?e.max.x:e.min.x,Mr.y=r.normal.y>0?e.max.y:e.min.y,Mr.z=r.normal.z>0?e.max.z:e.min.z,r.distanceToPoint(Mr)<0)return!1}return!0}containsPoint(e){const t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}class nc extends Dt{constructor(e=[],t=$n,n,r,a,s,o,c,l,h){super(e,t,n,r,a,s,o,c,l,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}}class Jn extends Dt{constructor(e,t,n=qt,r,a,s,o=gt,c=gt,l,h=Rn,p=1){if(h!==Rn&&h!==qn)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");const d={width:e,height:t,depth:p};super(d,r,a,s,o,c,h,n,l),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new Js(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){const t=super.toJSON(e);return t.compareFunction=this.compareFunction,t}}class tu extends Jn{constructor(e,t=qt,n=$n,r,a,s=gt,o=gt,c,l=Rn){const h={width:e,height:e,depth:1},p=[h,h,h,h,h,h];super(e,e,t,n,r,a,s,o,c,l),this.image=p,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}}class ic extends Dt{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}}class tr extends nn{constructor(e=1,t=1,n=1,r=1,a=1,s=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:n,widthSegments:r,heightSegments:a,depthSegments:s};const o=this;r=Math.floor(r),a=Math.floor(a),s=Math.floor(s);const c=[],l=[],h=[],p=[];let d=0,v=0;g("z","y","x",-1,-1,n,t,e,s,a,0),g("z","y","x",1,-1,n,t,-e,s,a,1),g("x","z","y",1,1,e,n,t,r,s,2),g("x","z","y",1,-1,e,n,-t,r,s,3),g("x","y","z",1,-1,e,t,n,r,a,4),g("x","y","z",-1,-1,e,t,-n,r,a,5),this.setIndex(c),this.setAttribute("position",new tn(l,3)),this.setAttribute("normal",new tn(h,3)),this.setAttribute("uv",new tn(p,2));function g(m,u,f,w,C,M,x,S,R,_,E){const L=M/R,T=x/_,P=M/2,U=x/2,D=S/2,z=R+1,W=_+1;let j=0,Z=0;const I=new O;for(let q=0;q<W;q++){const Q=q*T-U;for(let Me=0;Me<z;Me++){const we=Me*L-P;I[m]=we*w,I[u]=Q*C,I[f]=D,l.push(I.x,I.y,I.z),I[m]=0,I[u]=0,I[f]=S>0?1:-1,h.push(I.x,I.y,I.z),p.push(Me/R),p.push(1-q/_),j+=1}}for(let q=0;q<_;q++)for(let Q=0;Q<R;Q++){const Me=d+Q+z*q,we=d+Q+z*(q+1),Ze=d+(Q+1)+z*(q+1),Fe=d+(Q+1)+z*q;c.push(Me,we,Fe),c.push(we,Ze,Fe),Z+=6}o.addGroup(v,Z,E),v+=Z,d+=j}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new tr(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}}class nr extends nn{constructor(e=1,t=1,n=1,r=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:n,heightSegments:r};const a=e/2,s=t/2,o=Math.floor(n),c=Math.floor(r),l=o+1,h=c+1,p=e/o,d=t/c,v=[],g=[],m=[],u=[];for(let f=0;f<h;f++){const w=f*d-s;for(let C=0;C<l;C++){const M=C*p-a;g.push(M,-w,0),m.push(0,0,1),u.push(C/o),u.push(1-f/c)}}for(let f=0;f<c;f++)for(let w=0;w<o;w++){const C=w+l*f,M=w+l*(f+1),x=w+1+l*(f+1),S=w+1+l*f;v.push(C,M,S),v.push(M,x,S)}this.setIndex(v),this.setAttribute("position",new tn(g,3)),this.setAttribute("normal",new tn(m,3)),this.setAttribute("uv",new tn(u,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new nr(e.width,e.height,e.widthSegments,e.heightSegments)}}function Ai(i){const e={};for(const t in i){e[t]={};for(const n in i[t]){const r=i[t][n];if(Go(r))r.isRenderTargetTexture?(Ce("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][n]=null):e[t][n]=r.clone();else if(Array.isArray(r))if(Go(r[0])){const a=[];for(let s=0,o=r.length;s<o;s++)a[s]=r[s].clone();e[t][n]=a}else e[t][n]=r.slice();else e[t][n]=r}}return e}function Ct(i){const e={};for(let t=0;t<i.length;t++){const n=Ai(i[t]);for(const r in n)e[r]=n[r]}return e}function Go(i){return i&&(i.isColor||i.isMatrix3||i.isMatrix4||i.isVector2||i.isVector3||i.isVector4||i.isTexture||i.isQuaternion)}function nu(i){const e=[];for(let t=0;t<i.length;t++)e.push(i[t].clone());return e}function rc(i){const e=i.getRenderTarget();return e===null?i.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:Ge.workingColorSpace}const iu={clone:Ai,merge:Ct};var ru=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,au=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class mn extends ra{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=ru,this.fragmentShader=au,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=Ai(e.uniforms),this.uniformsGroups=nu(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){const t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(const r in this.uniforms){const s=this.uniforms[r].value;s&&s.isTexture?t.uniforms[r]={type:"t",value:s.toJSON(e).uuid}:s&&s.isColor?t.uniforms[r]={type:"c",value:s.getHex()}:s&&s.isVector2?t.uniforms[r]={type:"v2",value:s.toArray()}:s&&s.isVector3?t.uniforms[r]={type:"v3",value:s.toArray()}:s&&s.isVector4?t.uniforms[r]={type:"v4",value:s.toArray()}:s&&s.isMatrix3?t.uniforms[r]={type:"m3",value:s.toArray()}:s&&s.isMatrix4?t.uniforms[r]={type:"m4",value:s.toArray()}:t.uniforms[r]={value:s}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;const n={};for(const r in this.extensions)this.extensions[r]===!0&&(n[r]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}fromJSON(e,t){if(super.fromJSON(e,t),e.uniforms!==void 0)for(const n in e.uniforms){const r=e.uniforms[n];switch(this.uniforms[n]={},r.type){case"t":this.uniforms[n].value=t[r.value]||null;break;case"c":this.uniforms[n].value=new qe().setHex(r.value);break;case"v2":this.uniforms[n].value=new Ve().fromArray(r.value);break;case"v3":this.uniforms[n].value=new O().fromArray(r.value);break;case"v4":this.uniforms[n].value=new nt().fromArray(r.value);break;case"m3":this.uniforms[n].value=new Pe().fromArray(r.value);break;case"m4":this.uniforms[n].value=new pe().fromArray(r.value);break;default:this.uniforms[n].value=r.value}}if(e.defines!==void 0&&(this.defines=e.defines),e.vertexShader!==void 0&&(this.vertexShader=e.vertexShader),e.fragmentShader!==void 0&&(this.fragmentShader=e.fragmentShader),e.glslVersion!==void 0&&(this.glslVersion=e.glslVersion),e.extensions!==void 0)for(const n in e.extensions)this.extensions[n]=e.extensions[n];return e.lights!==void 0&&(this.lights=e.lights),e.clipping!==void 0&&(this.clipping=e.clipping),this}}class ji extends mn{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}}class su extends ra{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=t0,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}}class ou extends ra{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}}const Er=new O,Rr=new Bn,sn=new O;class to extends Bt{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new pe,this.projectionMatrix=new pe,this.projectionMatrixInverse=new pe,this.coordinateSystem=un,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorld.decompose(Er,Rr,sn),sn.x===1&&sn.y===1&&sn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Er,Rr,sn.set(1,1,1)).invert()}updateWorldMatrix(e,t,n=!1){super.updateWorldMatrix(e,t,n),this.matrixWorld.decompose(Er,Rr,sn),sn.x===1&&sn.y===1&&sn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Er,Rr,sn.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}}const In=new O,Vo=new Ve,Ho=new Ve;class Jt extends to{constructor(e=50,t=1,n=.1,r=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=n,this.far=r,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){const t=.5*this.getFilmHeight()/e;this.fov=Ji*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){const e=Math.tan(Wi*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return Ji*2*Math.atan(Math.tan(Wi*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,n){In.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(In.x,In.y).multiplyScalar(-e/In.z),In.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(In.x,In.y).multiplyScalar(-e/In.z)}getViewSize(e,t){return this.getViewBounds(e,Vo,Ho),t.subVectors(Ho,Vo)}setViewOffset(e,t,n,r,a,s){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=r,this.view.width=a,this.view.height=s,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=this.near;let t=e*Math.tan(Wi*.5*this.fov)/this.zoom,n=2*t,r=this.aspect*n,a=-.5*r;const s=this.view;if(this.view!==null&&this.view.enabled){const c=s.fullWidth,l=s.fullHeight;a+=s.offsetX*r/c,t-=s.offsetY*n/l,r*=s.width/c,n*=s.height/l}const o=this.filmOffset;o!==0&&(a+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(a,a+r,t,t-n,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}}class no extends to{constructor(e=-1,t=1,n=1,r=-1,a=.1,s=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=r,this.near=a,this.far=s,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,r,a,s){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=r,this.view.width=a,this.view.height=s,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,r=(this.top+this.bottom)/2;let a=n-e,s=n+e,o=r+t,c=r-t;if(this.view!==null&&this.view.enabled){const l=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;a+=l*this.view.offsetX,s=a+l*this.view.width,o-=h*this.view.offsetY,c=o-h*this.view.height}this.projectionMatrix.makeOrthographic(a,s,o,c,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}}class lu extends nn{constructor(){super(),this.isInstancedBufferGeometry=!0,this.type="InstancedBufferGeometry",this.instanceCount=1/0}copy(e){return super.copy(e),this.instanceCount=e.instanceCount,this}toJSON(){const e=super.toJSON();return e.instanceCount=this.instanceCount,e.isInstancedBufferGeometry=!0,e}}const vi=-90,gi=1;class cu extends Bt{constructor(e,t,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;const r=new Jt(vi,gi,e,t);r.layers=this.layers,this.add(r);const a=new Jt(vi,gi,e,t);a.layers=this.layers,this.add(a);const s=new Jt(vi,gi,e,t);s.layers=this.layers,this.add(s);const o=new Jt(vi,gi,e,t);o.layers=this.layers,this.add(o);const c=new Jt(vi,gi,e,t);c.layers=this.layers,this.add(c);const l=new Jt(vi,gi,e,t);l.layers=this.layers,this.add(l)}updateCoordinateSystem(){const e=this.coordinateSystem,t=this.children.concat(),[n,r,a,s,o,c]=t;for(const l of t)this.remove(l);if(e===un)n.up.set(0,1,0),n.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),a.up.set(0,0,-1),a.lookAt(0,1,0),s.up.set(0,0,1),s.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),c.up.set(0,1,0),c.lookAt(0,0,-1);else if(e===Wr)n.up.set(0,-1,0),n.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),a.up.set(0,0,1),a.lookAt(0,1,0),s.up.set(0,0,-1),s.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),c.up.set(0,-1,0),c.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(const l of t)this.add(l),l.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();const{renderTarget:n,activeMipmapLevel:r}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());const[a,s,o,c,l,h]=this.children,p=e.getRenderTarget(),d=e.getActiveCubeFace(),v=e.getActiveMipmapLevel(),g=e.xr.enabled;e.xr.enabled=!1;const m=n.texture.generateMipmaps;n.texture.generateMipmaps=!1;let u=!1;e.isWebGLRenderer===!0?u=e.state.buffers.depth.getReversed():u=e.reversedDepthBuffer,e.setRenderTarget(n,0,r),u&&e.autoClear===!1&&e.clearDepth(),e.render(t,a),e.setRenderTarget(n,1,r),u&&e.autoClear===!1&&e.clearDepth(),e.render(t,s),e.setRenderTarget(n,2,r),u&&e.autoClear===!1&&e.clearDepth(),e.render(t,o),e.setRenderTarget(n,3,r),u&&e.autoClear===!1&&e.clearDepth(),e.render(t,c),e.setRenderTarget(n,4,r),u&&e.autoClear===!1&&e.clearDepth(),e.render(t,l),n.texture.generateMipmaps=m,e.setRenderTarget(n,5,r),u&&e.autoClear===!1&&e.clearDepth(),e.render(t,h),e.setRenderTarget(p,d,v),e.xr.enabled=g,n.texture.needsPMREMUpdate=!0}}class uu extends Jt{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}}class ac{static{ac.prototype.isMatrix2=!0}constructor(e,t,n,r){this.elements=[1,0,0,1],e!==void 0&&this.set(e,t,n,r)}identity(){return this.set(1,0,0,1),this}fromArray(e,t=0){for(let n=0;n<4;n++)this.elements[n]=e[n+t];return this}set(e,t,n,r){const a=this.elements;return a[0]=e,a[2]=t,a[1]=n,a[3]=r,this}}function Wo(i,e,t,n){const r=hu(n);switch(t){case jl:return i*e;case na:return i*e/r.components*r.byteLength;case qs:return i*e/r.components*r.byteLength;case Kn:return i*e*2/r.components*r.byteLength;case Ys:return i*e*2/r.components*r.byteLength;case ql:return i*e*3/r.components*r.byteLength;case Pt:return i*e*4/r.components*r.byteLength;case $s:return i*e*4/r.components*r.byteLength;case Ur:case Ir:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*8;case Nr:case Fr:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case ss:case ls:return Math.max(i,16)*Math.max(e,8)/4;case as:case os:return Math.max(i,8)*Math.max(e,8)/2;case cs:case us:case ds:case fs:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*8;case hs:case Gr:case ps:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case ms:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case vs:return Math.floor((i+4)/5)*Math.floor((e+3)/4)*16;case gs:return Math.floor((i+4)/5)*Math.floor((e+4)/5)*16;case _s:return Math.floor((i+5)/6)*Math.floor((e+4)/5)*16;case ys:return Math.floor((i+5)/6)*Math.floor((e+5)/6)*16;case xs:return Math.floor((i+7)/8)*Math.floor((e+4)/5)*16;case bs:return Math.floor((i+7)/8)*Math.floor((e+5)/6)*16;case ws:return Math.floor((i+7)/8)*Math.floor((e+7)/8)*16;case Ss:return Math.floor((i+9)/10)*Math.floor((e+4)/5)*16;case Ms:return Math.floor((i+9)/10)*Math.floor((e+5)/6)*16;case Es:return Math.floor((i+9)/10)*Math.floor((e+7)/8)*16;case Rs:return Math.floor((i+9)/10)*Math.floor((e+9)/10)*16;case Ts:return Math.floor((i+11)/12)*Math.floor((e+9)/10)*16;case As:return Math.floor((i+11)/12)*Math.floor((e+11)/12)*16;case Cs:case Ls:case Ps:return Math.ceil(i/4)*Math.ceil(e/4)*16;case Ds:case Us:return Math.ceil(i/4)*Math.ceil(e/4)*8;case Vr:case Is:return Math.ceil(i/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function hu(i){switch(i){case Nt:case Vl:return{byteLength:1,components:1};case $i:case Hl:case pn:return{byteLength:2,components:1};case Xs:case js:return{byteLength:2,components:4};case qt:case ta:case Lt:return{byteLength:4,components:1};case Wl:case Xl:return{byteLength:4,components:3}}throw new Error(`THREE.TextureUtils: Unknown texture type ${i}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:Ws}}));typeof window<"u"&&(window.__THREE__?Ce("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=Ws);function sc(){let i=null,e=!1,t=null,n=null;function r(a,s){n=i.requestAnimationFrame(r),t(a,s)}return{start:function(){e!==!0&&t!==null&&i!==null&&(n=i.requestAnimationFrame(r),e=!0)},stop:function(){i!==null&&i.cancelAnimationFrame(n),e=!1},setAnimationLoop:function(a){t=a},setContext:function(a){i=a}}}function du(i){const e=new WeakMap;function t(o,c){const l=o.array,h=o.usage,p=l.byteLength,d=i.createBuffer();i.bindBuffer(c,d),i.bufferData(c,l,h),o.onUploadCallback();let v;if(l instanceof Float32Array)v=i.FLOAT;else if(typeof Float16Array<"u"&&l instanceof Float16Array)v=i.HALF_FLOAT;else if(l instanceof Uint16Array)o.isFloat16BufferAttribute?v=i.HALF_FLOAT:v=i.UNSIGNED_SHORT;else if(l instanceof Int16Array)v=i.SHORT;else if(l instanceof Uint32Array)v=i.UNSIGNED_INT;else if(l instanceof Int32Array)v=i.INT;else if(l instanceof Int8Array)v=i.BYTE;else if(l instanceof Uint8Array)v=i.UNSIGNED_BYTE;else if(l instanceof Uint8ClampedArray)v=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+l);return{buffer:d,type:v,bytesPerElement:l.BYTES_PER_ELEMENT,version:o.version,size:p}}function n(o,c,l){const h=c.array,p=c.updateRanges;if(i.bindBuffer(l,o),p.length===0)i.bufferSubData(l,0,h);else{p.sort((v,g)=>v.start-g.start);let d=0;for(let v=1;v<p.length;v++){const g=p[d],m=p[v];m.start<=g.start+g.count+1?g.count=Math.max(g.count,m.start+m.count-g.start):(++d,p[d]=m)}p.length=d+1;for(let v=0,g=p.length;v<g;v++){const m=p[v];i.bufferSubData(l,m.start*h.BYTES_PER_ELEMENT,h,m.start,m.count)}c.clearUpdateRanges()}c.onUploadCallback()}function r(o){return o.isInterleavedBufferAttribute&&(o=o.data),e.get(o)}function a(o){o.isInterleavedBufferAttribute&&(o=o.data);const c=e.get(o);c&&(i.deleteBuffer(c.buffer),e.delete(o))}function s(o,c){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){const h=e.get(o);(!h||h.version<o.version)&&e.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}const l=e.get(o);if(l===void 0)e.set(o,t(o,c));else if(l.version<o.version){if(l.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(l.buffer,o,c),l.version=o.version}}return{get:r,remove:a,update:s}}var fu=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,pu=`#ifdef USE_ALPHAHASH
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
#endif`,mu=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,vu=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,gu=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,_u=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,yu=`#ifdef USE_AOMAP
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
#endif`,xu=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,bu=`#ifdef USE_BATCHING
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
#endif`,wu=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,Su=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Mu=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Eu=`float G_BlinnPhong_Implicit( ) {
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
} // validated`,Ru=`#ifdef USE_IRIDESCENCE
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
#endif`,Tu=`#ifdef USE_BUMPMAP
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
#endif`,Au=`#if NUM_CLIPPING_PLANES > 0
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
#endif`,Cu=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Lu=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Pu=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,Du=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,Uu=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,Iu=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,Nu=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
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
#endif`,Fu=`#define PI 3.141592653589793
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
} // validated`,Bu=`#ifdef ENVMAP_TYPE_CUBE_UV
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
#endif`,Ou=`vec3 transformedNormal = objectNormal;
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
#endif`,zu=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,ku=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Gu=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Vu=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Hu="gl_FragColor = linearToOutputTexel( gl_FragColor );",Wu=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Xu=`#ifdef USE_ENVMAP
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
#endif`,ju=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,qu=`#ifdef USE_ENVMAP
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
#endif`,Yu=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,$u=`#ifdef USE_ENVMAP
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
#endif`,Ku=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Zu=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Ju=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Qu=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,eh=`#ifdef USE_GRADIENTMAP
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
}`,th=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,nh=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,ih=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,rh=`uniform bool receiveShadow;
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
#include <lightprobes_pars_fragment>`,ah=`#ifdef USE_ENVMAP
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
#endif`,sh=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,oh=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,lh=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,ch=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,uh=`PhysicalMaterial material;
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
#endif`,hh=`uniform sampler2D dfgLUT;
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
}`,dh=`
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
#endif`,fh=`#if defined( RE_IndirectDiffuse )
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
#endif`,ph=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,mh=`#ifdef USE_LIGHT_PROBES_GRID
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
#endif`,vh=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,gh=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,_h=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,yh=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,xh=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,bh=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,wh=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
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
#endif`,Sh=`#if defined( USE_POINTS_UV )
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
#endif`,Mh=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Eh=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Rh=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,Th=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Ah=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Ch=`#ifdef USE_MORPHTARGETS
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
#endif`,Lh=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Ph=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
vec3 nonPerturbedNormal = normal;`,Dh=`#ifdef USE_NORMALMAP_OBJECTSPACE
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
#endif`,Uh=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Ih=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Nh=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,Fh=`#ifdef USE_NORMALMAP
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
#endif`,Bh=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,Oh=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,zh=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,kh=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Gh=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Vh=`vec3 packNormalToRGB( const in vec3 normal ) {
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
}`,Hh=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Wh=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Xh=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,jh=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,qh=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Yh=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,$h=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,Kh=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,Zh=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
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
#endif`,Jh=`float getShadowMask() {
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
}`,Qh=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,ed=`#ifdef USE_SKINNING
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
#endif`,td=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,nd=`#ifdef USE_SKINNING
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
#endif`,id=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,rd=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,ad=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,sd=`#ifndef saturate
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,od=`#ifdef USE_TRANSMISSION
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
#endif`,ld=`#ifdef USE_TRANSMISSION
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
#endif`,cd=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,ud=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,hd=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,dd=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const fd=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,pd=`uniform sampler2D t2D;
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
}`,md=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,vd=`#ifdef ENVMAP_TYPE_CUBE
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
}`,gd=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,_d=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,yd=`#include <common>
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
}`,xd=`#if DEPTH_PACKING == 3200
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
}`,bd=`#define DISTANCE
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
}`,wd=`#define DISTANCE
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
}`,Sd=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,Md=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Ed=`uniform float scale;
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
}`,Rd=`uniform vec3 diffuse;
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
}`,Td=`#include <common>
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
}`,Ad=`uniform vec3 diffuse;
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
}`,Cd=`#define LAMBERT
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
}`,Ld=`#define LAMBERT
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
}`,Pd=`#define MATCAP
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
}`,Dd=`#define MATCAP
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
}`,Ud=`#define NORMAL
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
}`,Id=`#define NORMAL
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
}`,Nd=`#define PHONG
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
}`,Fd=`#define PHONG
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
}`,Bd=`#define STANDARD
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
}`,Od=`#define STANDARD
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
}`,zd=`#define TOON
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
}`,kd=`#define TOON
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
}`,Gd=`uniform float size;
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
}`,Vd=`uniform vec3 diffuse;
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
}`,Hd=`#include <common>
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
}`,Wd=`uniform vec3 color;
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
}`,Xd=`uniform float rotation;
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
}`,jd=`uniform vec3 diffuse;
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
}`,Ie={alphahash_fragment:fu,alphahash_pars_fragment:pu,alphamap_fragment:mu,alphamap_pars_fragment:vu,alphatest_fragment:gu,alphatest_pars_fragment:_u,aomap_fragment:yu,aomap_pars_fragment:xu,batching_pars_vertex:bu,batching_vertex:wu,begin_vertex:Su,beginnormal_vertex:Mu,bsdfs:Eu,iridescence_fragment:Ru,bumpmap_pars_fragment:Tu,clipping_planes_fragment:Au,clipping_planes_pars_fragment:Cu,clipping_planes_pars_vertex:Lu,clipping_planes_vertex:Pu,color_fragment:Du,color_pars_fragment:Uu,color_pars_vertex:Iu,color_vertex:Nu,common:Fu,cube_uv_reflection_fragment:Bu,defaultnormal_vertex:Ou,displacementmap_pars_vertex:zu,displacementmap_vertex:ku,emissivemap_fragment:Gu,emissivemap_pars_fragment:Vu,colorspace_fragment:Hu,colorspace_pars_fragment:Wu,envmap_fragment:Xu,envmap_common_pars_fragment:ju,envmap_pars_fragment:qu,envmap_pars_vertex:Yu,envmap_physical_pars_fragment:ah,envmap_vertex:$u,fog_vertex:Ku,fog_pars_vertex:Zu,fog_fragment:Ju,fog_pars_fragment:Qu,gradientmap_pars_fragment:eh,lightmap_pars_fragment:th,lights_lambert_fragment:nh,lights_lambert_pars_fragment:ih,lights_pars_begin:rh,lights_toon_fragment:sh,lights_toon_pars_fragment:oh,lights_phong_fragment:lh,lights_phong_pars_fragment:ch,lights_physical_fragment:uh,lights_physical_pars_fragment:hh,lights_fragment_begin:dh,lights_fragment_maps:fh,lights_fragment_end:ph,lightprobes_pars_fragment:mh,logdepthbuf_fragment:vh,logdepthbuf_pars_fragment:gh,logdepthbuf_pars_vertex:_h,logdepthbuf_vertex:yh,map_fragment:xh,map_pars_fragment:bh,map_particle_fragment:wh,map_particle_pars_fragment:Sh,metalnessmap_fragment:Mh,metalnessmap_pars_fragment:Eh,morphinstance_vertex:Rh,morphcolor_vertex:Th,morphnormal_vertex:Ah,morphtarget_pars_vertex:Ch,morphtarget_vertex:Lh,normal_fragment_begin:Ph,normal_fragment_maps:Dh,normal_pars_fragment:Uh,normal_pars_vertex:Ih,normal_vertex:Nh,normalmap_pars_fragment:Fh,clearcoat_normal_fragment_begin:Bh,clearcoat_normal_fragment_maps:Oh,clearcoat_pars_fragment:zh,iridescence_pars_fragment:kh,opaque_fragment:Gh,packing:Vh,premultiplied_alpha_fragment:Hh,project_vertex:Wh,dithering_fragment:Xh,dithering_pars_fragment:jh,roughnessmap_fragment:qh,roughnessmap_pars_fragment:Yh,shadowmap_pars_fragment:$h,shadowmap_pars_vertex:Kh,shadowmap_vertex:Zh,shadowmask_pars_fragment:Jh,skinbase_vertex:Qh,skinning_pars_vertex:ed,skinning_vertex:td,skinnormal_vertex:nd,specularmap_fragment:id,specularmap_pars_fragment:rd,tonemapping_fragment:ad,tonemapping_pars_fragment:sd,transmission_fragment:od,transmission_pars_fragment:ld,uv_pars_fragment:cd,uv_pars_vertex:ud,uv_vertex:hd,worldpos_vertex:dd,background_vert:fd,background_frag:pd,backgroundCube_vert:md,backgroundCube_frag:vd,cube_vert:gd,cube_frag:_d,depth_vert:yd,depth_frag:xd,distance_vert:bd,distance_frag:wd,equirect_vert:Sd,equirect_frag:Md,linedashed_vert:Ed,linedashed_frag:Rd,meshbasic_vert:Td,meshbasic_frag:Ad,meshlambert_vert:Cd,meshlambert_frag:Ld,meshmatcap_vert:Pd,meshmatcap_frag:Dd,meshnormal_vert:Ud,meshnormal_frag:Id,meshphong_vert:Nd,meshphong_frag:Fd,meshphysical_vert:Bd,meshphysical_frag:Od,meshtoon_vert:zd,meshtoon_frag:kd,points_vert:Gd,points_frag:Vd,shadow_vert:Hd,shadow_frag:Wd,sprite_vert:Xd,sprite_frag:jd},ue={common:{diffuse:{value:new qe(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Pe},alphaMap:{value:null},alphaMapTransform:{value:new Pe},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Pe}},envmap:{envMap:{value:null},envMapRotation:{value:new Pe},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Pe}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Pe}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Pe},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Pe},normalScale:{value:new Ve(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Pe},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Pe}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Pe}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Pe}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new qe(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new O},probesMax:{value:new O},probesResolution:{value:new O}},points:{diffuse:{value:new qe(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Pe},alphaTest:{value:0},uvTransform:{value:new Pe}},sprite:{diffuse:{value:new qe(16777215)},opacity:{value:1},center:{value:new Ve(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Pe},alphaMap:{value:null},alphaMapTransform:{value:new Pe},alphaTest:{value:0}}},ln={basic:{uniforms:Ct([ue.common,ue.specularmap,ue.envmap,ue.aomap,ue.lightmap,ue.fog]),vertexShader:Ie.meshbasic_vert,fragmentShader:Ie.meshbasic_frag},lambert:{uniforms:Ct([ue.common,ue.specularmap,ue.envmap,ue.aomap,ue.lightmap,ue.emissivemap,ue.bumpmap,ue.normalmap,ue.displacementmap,ue.fog,ue.lights,{emissive:{value:new qe(0)},envMapIntensity:{value:1}}]),vertexShader:Ie.meshlambert_vert,fragmentShader:Ie.meshlambert_frag},phong:{uniforms:Ct([ue.common,ue.specularmap,ue.envmap,ue.aomap,ue.lightmap,ue.emissivemap,ue.bumpmap,ue.normalmap,ue.displacementmap,ue.fog,ue.lights,{emissive:{value:new qe(0)},specular:{value:new qe(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:Ie.meshphong_vert,fragmentShader:Ie.meshphong_frag},standard:{uniforms:Ct([ue.common,ue.envmap,ue.aomap,ue.lightmap,ue.emissivemap,ue.bumpmap,ue.normalmap,ue.displacementmap,ue.roughnessmap,ue.metalnessmap,ue.fog,ue.lights,{emissive:{value:new qe(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Ie.meshphysical_vert,fragmentShader:Ie.meshphysical_frag},toon:{uniforms:Ct([ue.common,ue.aomap,ue.lightmap,ue.emissivemap,ue.bumpmap,ue.normalmap,ue.displacementmap,ue.gradientmap,ue.fog,ue.lights,{emissive:{value:new qe(0)}}]),vertexShader:Ie.meshtoon_vert,fragmentShader:Ie.meshtoon_frag},matcap:{uniforms:Ct([ue.common,ue.bumpmap,ue.normalmap,ue.displacementmap,ue.fog,{matcap:{value:null}}]),vertexShader:Ie.meshmatcap_vert,fragmentShader:Ie.meshmatcap_frag},points:{uniforms:Ct([ue.points,ue.fog]),vertexShader:Ie.points_vert,fragmentShader:Ie.points_frag},dashed:{uniforms:Ct([ue.common,ue.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Ie.linedashed_vert,fragmentShader:Ie.linedashed_frag},depth:{uniforms:Ct([ue.common,ue.displacementmap]),vertexShader:Ie.depth_vert,fragmentShader:Ie.depth_frag},normal:{uniforms:Ct([ue.common,ue.bumpmap,ue.normalmap,ue.displacementmap,{opacity:{value:1}}]),vertexShader:Ie.meshnormal_vert,fragmentShader:Ie.meshnormal_frag},sprite:{uniforms:Ct([ue.sprite,ue.fog]),vertexShader:Ie.sprite_vert,fragmentShader:Ie.sprite_frag},background:{uniforms:{uvTransform:{value:new Pe},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Ie.background_vert,fragmentShader:Ie.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Pe}},vertexShader:Ie.backgroundCube_vert,fragmentShader:Ie.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Ie.cube_vert,fragmentShader:Ie.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Ie.equirect_vert,fragmentShader:Ie.equirect_frag},distance:{uniforms:Ct([ue.common,ue.displacementmap,{referencePosition:{value:new O},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Ie.distance_vert,fragmentShader:Ie.distance_frag},shadow:{uniforms:Ct([ue.lights,ue.fog,{color:{value:new qe(0)},opacity:{value:1}}]),vertexShader:Ie.shadow_vert,fragmentShader:Ie.shadow_frag}};ln.physical={uniforms:Ct([ln.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Pe},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Pe},clearcoatNormalScale:{value:new Ve(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Pe},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Pe},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Pe},sheen:{value:0},sheenColor:{value:new qe(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Pe},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Pe},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Pe},transmissionSamplerSize:{value:new Ve},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Pe},attenuationDistance:{value:0},attenuationColor:{value:new qe(0)},specularColor:{value:new qe(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Pe},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Pe},anisotropyVector:{value:new Ve},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Pe}}]),vertexShader:Ie.meshphysical_vert,fragmentShader:Ie.meshphysical_frag};const Tr={r:0,b:0,g:0},qd=new pe,oc=new Pe;oc.set(-1,0,0,0,1,0,0,0,1);function Yd(i,e,t,n,r,a){const s=new qe(0);let o=r===!0?0:1,c,l,h=null,p=0,d=null;function v(w){let C=w.isScene===!0?w.background:null;if(C&&C.isTexture){const M=w.backgroundBlurriness>0;C=e.get(C,M)}return C}function g(w){let C=!1;const M=v(w);M===null?u(s,o):M&&M.isColor&&(u(M,1),C=!0);const x=i.xr.getEnvironmentBlendMode();x==="additive"?t.buffers.color.setClear(0,0,0,1,a):x==="alpha-blend"&&t.buffers.color.setClear(0,0,0,0,a),(i.autoClear||C)&&(t.buffers.depth.setTest(!0),t.buffers.depth.setMask(!0),t.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}function m(w,C){const M=v(C);M&&(M.isCubeTexture||M.mapping===ea)?(l===void 0&&(l=new Gt(new tr(1,1,1),new mn({name:"BackgroundCubeMaterial",uniforms:Ai(ln.backgroundCube.uniforms),vertexShader:ln.backgroundCube.vertexShader,fragmentShader:ln.backgroundCube.fragmentShader,side:Ft,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),l.geometry.deleteAttribute("uv"),l.onBeforeRender=function(x,S,R){this.matrixWorld.copyPosition(R.matrixWorld)},Object.defineProperty(l.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),n.update(l)),l.material.uniforms.envMap.value=M,l.material.uniforms.backgroundBlurriness.value=C.backgroundBlurriness,l.material.uniforms.backgroundIntensity.value=C.backgroundIntensity,l.material.uniforms.backgroundRotation.value.setFromMatrix4(qd.makeRotationFromEuler(C.backgroundRotation)).transpose(),M.isCubeTexture&&M.isRenderTargetTexture===!1&&l.material.uniforms.backgroundRotation.value.premultiply(oc),l.material.toneMapped=Ge.getTransfer(M.colorSpace)!==Qe,(h!==M||p!==M.version||d!==i.toneMapping)&&(l.material.needsUpdate=!0,h=M,p=M.version,d=i.toneMapping),l.layers.enableAll(),w.unshift(l,l.geometry,l.material,0,0,null)):M&&M.isTexture&&(c===void 0&&(c=new Gt(new nr(2,2),new mn({name:"BackgroundMaterial",uniforms:Ai(ln.background.uniforms),vertexShader:ln.background.vertexShader,fragmentShader:ln.background.fragmentShader,side:Fn,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),n.update(c)),c.material.uniforms.t2D.value=M,c.material.uniforms.backgroundIntensity.value=C.backgroundIntensity,c.material.toneMapped=Ge.getTransfer(M.colorSpace)!==Qe,M.matrixAutoUpdate===!0&&M.updateMatrix(),c.material.uniforms.uvTransform.value.copy(M.matrix),(h!==M||p!==M.version||d!==i.toneMapping)&&(c.material.needsUpdate=!0,h=M,p=M.version,d=i.toneMapping),c.layers.enableAll(),w.unshift(c,c.geometry,c.material,0,0,null))}function u(w,C){w.getRGB(Tr,rc(i)),t.buffers.color.setClear(Tr.r,Tr.g,Tr.b,C,a)}function f(){l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0),c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0)}return{getClearColor:function(){return s},setClearColor:function(w,C=1){s.set(w),o=C,u(s,o)},getClearAlpha:function(){return o},setClearAlpha:function(w){o=w,u(s,o)},render:g,addToRenderList:m,dispose:f}}function $d(i,e){const t=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},r=d(null);let a=r,s=!1;function o(T,P,U,D,z){let W=!1;const j=p(T,D,U,P);a!==j&&(a=j,l(a.object)),W=v(T,D,U,z),W&&g(T,D,U,z),z!==null&&e.update(z,i.ELEMENT_ARRAY_BUFFER),(W||s)&&(s=!1,M(T,P,U,D),z!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,e.get(z).buffer))}function c(){return i.createVertexArray()}function l(T){return i.bindVertexArray(T)}function h(T){return i.deleteVertexArray(T)}function p(T,P,U,D){const z=D.wireframe===!0;let W=n[P.id];W===void 0&&(W={},n[P.id]=W);const j=T.isInstancedMesh===!0?T.id:0;let Z=W[j];Z===void 0&&(Z={},W[j]=Z);let I=Z[U.id];I===void 0&&(I={},Z[U.id]=I);let q=I[z];return q===void 0&&(q=d(c()),I[z]=q),q}function d(T){const P=[],U=[],D=[];for(let z=0;z<t;z++)P[z]=0,U[z]=0,D[z]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:P,enabledAttributes:U,attributeDivisors:D,object:T,attributes:{},index:null}}function v(T,P,U,D){const z=a.attributes,W=P.attributes;let j=0;const Z=U.getAttributes();for(const I in Z)if(Z[I].location>=0){const Q=z[I];let Me=W[I];if(Me===void 0&&(I==="instanceMatrix"&&T.instanceMatrix&&(Me=T.instanceMatrix),I==="instanceColor"&&T.instanceColor&&(Me=T.instanceColor)),Q===void 0||Q.attribute!==Me||Me&&Q.data!==Me.data)return!0;j++}return a.attributesNum!==j||a.index!==D}function g(T,P,U,D){const z={},W=P.attributes;let j=0;const Z=U.getAttributes();for(const I in Z)if(Z[I].location>=0){let Q=W[I];Q===void 0&&(I==="instanceMatrix"&&T.instanceMatrix&&(Q=T.instanceMatrix),I==="instanceColor"&&T.instanceColor&&(Q=T.instanceColor));const Me={};Me.attribute=Q,Q&&Q.data&&(Me.data=Q.data),z[I]=Me,j++}a.attributes=z,a.attributesNum=j,a.index=D}function m(){const T=a.newAttributes;for(let P=0,U=T.length;P<U;P++)T[P]=0}function u(T){f(T,0)}function f(T,P){const U=a.newAttributes,D=a.enabledAttributes,z=a.attributeDivisors;U[T]=1,D[T]===0&&(i.enableVertexAttribArray(T),D[T]=1),z[T]!==P&&(i.vertexAttribDivisor(T,P),z[T]=P)}function w(){const T=a.newAttributes,P=a.enabledAttributes;for(let U=0,D=P.length;U<D;U++)P[U]!==T[U]&&(i.disableVertexAttribArray(U),P[U]=0)}function C(T,P,U,D,z,W,j){j===!0?i.vertexAttribIPointer(T,P,U,z,W):i.vertexAttribPointer(T,P,U,D,z,W)}function M(T,P,U,D){m();const z=D.attributes,W=U.getAttributes(),j=P.defaultAttributeValues;for(const Z in W){const I=W[Z];if(I.location>=0){let q=z[Z];if(q===void 0&&(Z==="instanceMatrix"&&T.instanceMatrix&&(q=T.instanceMatrix),Z==="instanceColor"&&T.instanceColor&&(q=T.instanceColor)),q!==void 0){const Q=q.normalized,Me=q.itemSize,we=e.get(q);if(we===void 0)continue;const Ze=we.buffer,Fe=we.type,He=we.bytesPerElement,Y=Fe===i.INT||Fe===i.UNSIGNED_INT||q.gpuType===ta;if(q.isInterleavedBufferAttribute){const ee=q.data,_e=ee.stride,Le=q.offset;if(ee.isInstancedInterleavedBuffer){for(let ve=0;ve<I.locationSize;ve++)f(I.location+ve,ee.meshPerAttribute);T.isInstancedMesh!==!0&&D._maxInstanceCount===void 0&&(D._maxInstanceCount=ee.meshPerAttribute*ee.count)}else for(let ve=0;ve<I.locationSize;ve++)u(I.location+ve);i.bindBuffer(i.ARRAY_BUFFER,Ze);for(let ve=0;ve<I.locationSize;ve++)C(I.location+ve,Me/I.locationSize,Fe,Q,_e*He,(Le+Me/I.locationSize*ve)*He,Y)}else{if(q.isInstancedBufferAttribute){for(let ee=0;ee<I.locationSize;ee++)f(I.location+ee,q.meshPerAttribute);T.isInstancedMesh!==!0&&D._maxInstanceCount===void 0&&(D._maxInstanceCount=q.meshPerAttribute*q.count)}else for(let ee=0;ee<I.locationSize;ee++)u(I.location+ee);i.bindBuffer(i.ARRAY_BUFFER,Ze);for(let ee=0;ee<I.locationSize;ee++)C(I.location+ee,Me/I.locationSize,Fe,Q,Me*He,Me/I.locationSize*ee*He,Y)}}else if(j!==void 0){const Q=j[Z];if(Q!==void 0)switch(Q.length){case 2:i.vertexAttrib2fv(I.location,Q);break;case 3:i.vertexAttrib3fv(I.location,Q);break;case 4:i.vertexAttrib4fv(I.location,Q);break;default:i.vertexAttrib1fv(I.location,Q)}}}}w()}function x(){E();for(const T in n){const P=n[T];for(const U in P){const D=P[U];for(const z in D){const W=D[z];for(const j in W)h(W[j].object),delete W[j];delete D[z]}}delete n[T]}}function S(T){if(n[T.id]===void 0)return;const P=n[T.id];for(const U in P){const D=P[U];for(const z in D){const W=D[z];for(const j in W)h(W[j].object),delete W[j];delete D[z]}}delete n[T.id]}function R(T){for(const P in n){const U=n[P];for(const D in U){const z=U[D];if(z[T.id]===void 0)continue;const W=z[T.id];for(const j in W)h(W[j].object),delete W[j];delete z[T.id]}}}function _(T){for(const P in n){const U=n[P],D=T.isInstancedMesh===!0?T.id:0,z=U[D];if(z!==void 0){for(const W in z){const j=z[W];for(const Z in j)h(j[Z].object),delete j[Z];delete z[W]}delete U[D],Object.keys(U).length===0&&delete n[P]}}}function E(){L(),s=!0,a!==r&&(a=r,l(a.object))}function L(){r.geometry=null,r.program=null,r.wireframe=!1}return{setup:o,reset:E,resetDefaultState:L,dispose:x,releaseStatesOfGeometry:S,releaseStatesOfObject:_,releaseStatesOfProgram:R,initAttributes:m,enableAttribute:u,disableUnusedAttributes:w}}function Kd(i,e,t){let n;function r(c){n=c}function a(c,l){i.drawArrays(n,c,l),t.update(l,n,1)}function s(c,l,h){h!==0&&(i.drawArraysInstanced(n,c,l,h),t.update(l,n,h))}function o(c,l,h){if(h===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,c,0,l,0,h);let d=0;for(let v=0;v<h;v++)d+=l[v];t.update(d,n,1)}this.setMode=r,this.render=a,this.renderInstances=s,this.renderMultiDraw=o}function Zd(i,e,t,n){let r;function a(){if(r!==void 0)return r;if(e.has("EXT_texture_filter_anisotropic")===!0){const R=e.get("EXT_texture_filter_anisotropic");r=i.getParameter(R.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else r=0;return r}function s(R){return!(R!==Pt&&n.convert(R)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(R){const _=R===pn&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(R!==Nt&&R!==Lt&&!_&&n.convert(R)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE))}function c(R){if(R==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";R="mediump"}return R==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let l=t.precision!==void 0?t.precision:"highp";const h=c(l);h!==l&&(Ce("WebGLRenderer:",l,"not supported, using",h,"instead."),l=h);const p=t.logarithmicDepthBuffer===!0,d=t.reversedDepthBuffer===!0&&e.has("EXT_clip_control");t.reversedDepthBuffer===!0&&d===!1&&Ce("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.");const v=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),g=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),m=i.getParameter(i.MAX_TEXTURE_SIZE),u=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),f=i.getParameter(i.MAX_VERTEX_ATTRIBS),w=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),C=i.getParameter(i.MAX_VARYING_VECTORS),M=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),x=i.getParameter(i.MAX_SAMPLES),S=i.getParameter(i.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:a,getMaxPrecision:c,textureFormatReadable:s,textureTypeReadable:o,precision:l,logarithmicDepthBuffer:p,reversedDepthBuffer:d,maxTextures:v,maxVertexTextures:g,maxTextureSize:m,maxCubemapSize:u,maxAttributes:f,maxVertexUniforms:w,maxVaryings:C,maxFragmentUniforms:M,maxSamples:x,samples:S}}function Jd(i){const e=this;let t=null,n=0,r=!1,a=!1;const s=new Nn,o=new Pe,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(p,d){const v=p.length!==0||d||n!==0||r;return r=d,n=p.length,v},this.beginShadows=function(){a=!0,h(null)},this.endShadows=function(){a=!1},this.setGlobalState=function(p,d){t=h(p,d,0)},this.setState=function(p,d,v){const g=p.clippingPlanes,m=p.clipIntersection,u=p.clipShadows,f=i.get(p);if(!r||g===null||g.length===0||a&&!u)a?h(null):l();else{const w=a?0:n,C=w*4;let M=f.clippingState||null;c.value=M,M=h(g,d,C,v);for(let x=0;x!==C;++x)M[x]=t[x];f.clippingState=M,this.numIntersection=m?this.numPlanes:0,this.numPlanes+=w}};function l(){c.value!==t&&(c.value=t,c.needsUpdate=n>0),e.numPlanes=n,e.numIntersection=0}function h(p,d,v,g){const m=p!==null?p.length:0;let u=null;if(m!==0){if(u=c.value,g!==!0||u===null){const f=v+m*4,w=d.matrixWorldInverse;o.getNormalMatrix(w),(u===null||u.length<f)&&(u=new Float32Array(f));for(let C=0,M=v;C!==m;++C,M+=4)s.copy(p[C]).applyMatrix4(w,o),s.normal.toArray(u,M),u[M+3]=s.constant}c.value=u,c.needsUpdate=!0}return e.numPlanes=m,e.numIntersection=0,u}}const Si=4,Qd=6,ef=20,tf=256,Fi=new no,Xo=new qe;let Ia=null,Na=0,Fa=0,Ba=!1;const nf=new O,Wn=new O;class jo{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(e,t=0,n=.1,r=100,a={}){const{size:s=256,position:o=nf}=a;Ia=this._renderer.getRenderTarget(),Na=this._renderer.getActiveCubeFace(),Fa=this._renderer.getActiveMipmapLevel(),Ba=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(s);const c=this._allocateTargets();return c.depthBuffer=!0,this._sceneToCubeUV(e,n,r,c,o),t>0&&this._blur(c,0,0,t),this._applyPMREM(c),this._cleanup(c),c}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=$o(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Yo(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodMeshes.length;e++)this._lodMeshes[e].geometry.dispose()}_cleanup(e){this._renderer.setRenderTarget(Ia,Na,Fa),this._renderer.xr.enabled=Ba,e.scissorTest=!1,_i(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===$n||e.mapping===Ti?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),Ia=this._renderer.getRenderTarget(),Na=this._renderer.getActiveCubeFace(),Fa=this._renderer.getActiveMipmapLevel(),Ba=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const n=t||this._allocateTargets();return this._textureToCubeUV(e,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){const e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,n={magFilter:wt,minFilter:wt,generateMipmaps:!1,type:pn,format:Pt,colorSpace:Zi,depthBuffer:!1},r=qo(e,t,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=qo(e,t,n);const{_lodMax:a}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods}=rf(a)),this._blurMaterial=sf(a,e,t),this._ggxMaterial=af(a,e,t)}return r}_compileMaterial(e){const t=new Gt(new nn,e);this._renderer.compile(t,Fi)}_sceneToCubeUV(e,t,n,r,a){const c=new Jt(90,1,t,n),l=[1,-1,1,1,1,1],h=[1,1,1,-1,-1,-1],p=this._renderer,d=p.autoClear,v=p.toneMapping;p.getClearColor(Xo),p.toneMapping=fn,p.autoClear=!1,p.state.buffers.depth.getReversed()&&(p.setRenderTarget(r),p.clearDepth(),p.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new Gt(new tr,new ec({name:"PMREM.Background",side:Ft,depthWrite:!1,depthTest:!1})));const m=this._backgroundBox,u=m.material;let f=!1;const w=e.background;w?w.isColor&&(u.color.copy(w),e.background=null,f=!0):(u.color.copy(Xo),f=!0);for(let C=0;C<6;C++){const M=C%3;M===0?(c.up.set(0,l[C],0),c.position.set(a.x,a.y,a.z),c.lookAt(a.x+h[C],a.y,a.z)):M===1?(c.up.set(0,0,l[C]),c.position.set(a.x,a.y,a.z),c.lookAt(a.x,a.y+h[C],a.z)):(c.up.set(0,l[C],0),c.position.set(a.x,a.y,a.z),c.lookAt(a.x,a.y,a.z+h[C]));const x=this._cubeSize;_i(r,M*x,C>2?x:0,x,x),p.setRenderTarget(r),f&&p.render(m,c),p.render(e,c)}p.toneMapping=v,p.autoClear=d,e.background=w}_textureToCubeUV(e,t){const n=this._renderer,r=e.mapping===$n||e.mapping===Ti;r?(this._cubemapMaterial===null&&(this._cubemapMaterial=$o()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Yo());const a=r?this._cubemapMaterial:this._equirectMaterial,s=this._lodMeshes[0];s.material=a;const o=a.uniforms;o.envMap.value=e;const c=this._cubeSize;_i(t,0,0,3*c,2*c),n.setRenderTarget(t),n.render(s,Fi)}_applyPMREM(e){const t=this._renderer,n=t.autoClear;t.autoClear=!1;const r=this._lodMeshes.length;for(let a=1;a<r;a++)this._applyGGXFilter(e,a-1,a);t.autoClear=n}_applyGGXFilter(e,t,n){const r=this._renderer,a=this._pingPongRenderTarget,s=this._ggxMaterial,o=this._lodMeshes[n];o.material=s;const c=s.uniforms,l=n/(this._lodMeshes.length-1),h=t/(this._lodMeshes.length-1),p=Math.sqrt(l*l-h*h),d=l*1.25,v=p*d,{_lodMax:g}=this,m=this._sizeLods[n],u=3*m*(n>g-Si?n-g+Si:0),f=4*(this._cubeSize-m);c.envMap.value=e.texture,c.roughness.value=v,c.mipInt.value=g-t,_i(a,u,f,3*m,2*m),r.setRenderTarget(a),r.render(o,Fi),c.envMap.value=a.texture,c.roughness.value=0,c.mipInt.value=g-n,_i(e,u,f,3*m,2*m),r.setRenderTarget(e),r.render(o,Fi)}_blur(e,t,n,r){const a=this._pingPongRenderTarget,s=Math.min(r,Math.PI)/Math.SQRT2;this._blurPass(e,a,t,n,s),this._blurPass(a,e,n,n,s)}_blurPass(e,t,n,r,a){const s=this._renderer,o=this._blurMaterial,c=this._lodMeshes[r];c.material=o;const l=o.uniforms;l.envMap.value=e.texture,l.sigma.value=a,l.mipInt.value=this._lodMax-n;const h=this._sizeLods[r],p=3*h*(r>this._lodMax-Si?r-this._lodMax+Si:0),d=4*(this._cubeSize-h);_i(t,p,d,3*h,2*h),s.setRenderTarget(t),s.render(c,Fi)}}function rf(i){const e=[],t=[];let n=i;const r=i-Si+1+Qd;for(let a=0;a<r;a++){const s=Math.pow(2,n);e.push(s);const o=1/(s-2),c=-o,l=1+o,h=[c,c,l,c,l,l,c,c,l,l,c,l],p=6,d=6,v=3,g=new Float32Array(v*d*p),m=new Float32Array(v*d*p);for(let f=0;f<p;f++){const w=f%3*2/3-1,C=f>2?0:-1,M=[w,C,0,w+2/3,C,0,w+2/3,C+1,0,w,C,0,w+2/3,C+1,0,w,C+1,0];g.set(M,v*d*f);for(let x=0;x<d;x++){const S=h[x*2]*2-1,R=h[x*2+1]*2-1;f===0?Wn.set(1,R,S):f===1?Wn.set(-S,1,-R):f===2?Wn.set(-S,R,1):f===3?Wn.set(-1,R,-S):f===4?Wn.set(-S,-1,R):Wn.set(S,R,-1),Wn.toArray(m,(f*d+x)*v)}}const u=new nn;u.setAttribute("position",new jt(g,v)),u.setAttribute("outputDirection",new jt(m,v)),t.push(new Gt(u,null)),n>Si&&n--}return{lodMeshes:t,sizeLods:e}}function qo(i,e,t){const n=new Ut(i,e,t);return n.texture.mapping=ea,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function _i(i,e,t,n,r){i.viewport.set(e,t,n,r),i.scissor.set(e,t,n,r)}function af(i,e,t){return new mn({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:tf,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:aa(),fragmentShader:`

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
		`,blending:dn,depthTest:!1,depthWrite:!1})}function sf(i,e,t){return new mn({name:"SphericalGaussianBlur",defines:{SAMPLES:ef,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},sigma:{value:0},mipInt:{value:0}},vertexShader:aa(),fragmentShader:`

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
		`,blending:dn,depthTest:!1,depthWrite:!1})}function Yo(){return new mn({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:aa(),fragmentShader:`

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
		`,blending:dn,depthTest:!1,depthWrite:!1})}function $o(){return new mn({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:aa(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:dn,depthTest:!1,depthWrite:!1})}function aa(){return`

		precision mediump float;
		precision mediump int;

		attribute vec3 outputDirection;

		varying vec3 vOutputDirection;

		void main() {

			vOutputDirection = outputDirection;
			gl_Position = vec4( position, 1.0 );

		}
	`}class lc extends Ut{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;const n={width:e,height:e,depth:1},r=[n,n,n,n,n,n];this.texture=new nc(r),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;const n={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},r=new tr(5,5,5),a=new mn({name:"CubemapFromEquirect",uniforms:Ai(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:Ft,blending:dn});a.uniforms.tEquirect.value=t;const s=new Gt(r,a),o=t.minFilter;return t.minFilter===jn&&(t.minFilter=wt),new cu(1,10,this).update(e,s),t.minFilter=o,s.geometry.dispose(),s.material.dispose(),this}clear(e,t=!0,n=!0,r=!0){const a=e.getRenderTarget();for(let s=0;s<6;s++)e.setRenderTarget(this,s),e.clear(t,n,r);e.setRenderTarget(a)}}function of(i){let e=new WeakMap,t=new WeakMap,n=null;function r(d,v=!1){return d==null?null:v?s(d):a(d)}function a(d){if(d&&d.isTexture){const v=d.mapping;if(v===ca||v===ua)if(e.has(d)){const g=e.get(d).texture;return o(g,d.mapping)}else{const g=d.image;if(g&&g.height>0){const m=new lc(g.height);return m.fromEquirectangularTexture(i,d),e.set(d,m),d.addEventListener("dispose",l),o(m.texture,d.mapping)}else return null}}return d}function s(d){if(d&&d.isTexture){const v=d.mapping,g=v===ca||v===ua,m=v===$n||v===Ti;if(g||m){let u=t.get(d);const f=u!==void 0?u.texture.pmremVersion:0;if(d.isRenderTargetTexture&&d.pmremVersion!==f)return n===null&&(n=new jo(i)),u=g?n.fromEquirectangular(d,u):n.fromCubemap(d,u),u.texture.pmremVersion=d.pmremVersion,t.set(d,u),u.texture;if(u!==void 0)return u.texture;{const w=d.image;return g&&w&&w.height>0||m&&w&&c(w)?(n===null&&(n=new jo(i)),u=g?n.fromEquirectangular(d):n.fromCubemap(d),u.texture.pmremVersion=d.pmremVersion,t.set(d,u),d.addEventListener("dispose",h),u.texture):null}}}return d}function o(d,v){return v===ca?d.mapping=$n:v===ua&&(d.mapping=Ti),d}function c(d){let v=0;const g=6;for(let m=0;m<g;m++)d[m]!==void 0&&v++;return v===g}function l(d){const v=d.target;v.removeEventListener("dispose",l);const g=e.get(v);g!==void 0&&(e.delete(v),g.dispose())}function h(d){const v=d.target;v.removeEventListener("dispose",h);const g=t.get(v);g!==void 0&&(t.delete(v),g.dispose())}function p(){e=new WeakMap,t=new WeakMap,n!==null&&(n.dispose(),n=null)}return{get:r,dispose:p}}function lf(i){const e={};function t(n){if(e[n]!==void 0)return e[n];const r=i.getExtension(n);return e[n]=r,r}return{has:function(n){return t(n)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(n){const r=t(n);return r===null&&Ei("WebGLRenderer: "+n+" extension not supported."),r}}}function cf(i,e,t,n){const r={},a=new WeakMap;function s(p){const d=p.target;d.index!==null&&e.remove(d.index);for(const g in d.attributes)e.remove(d.attributes[g]);d.removeEventListener("dispose",s),delete r[d.id];const v=a.get(d);v&&(e.remove(v),a.delete(d)),n.releaseStatesOfGeometry(d),d.isInstancedBufferGeometry===!0&&delete d._maxInstanceCount,t.memory.geometries--}function o(p,d){return r[d.id]===!0||(d.addEventListener("dispose",s),r[d.id]=!0,t.memory.geometries++),d}function c(p){const d=p.attributes;for(const v in d)e.update(d[v],i.ARRAY_BUFFER)}function l(p){const d=[],v=p.index,g=p.attributes.position;let m=0;if(g===void 0)return;if(v!==null){const w=v.array;m=v.version;for(let C=0,M=w.length;C<M;C+=3){const x=w[C+0],S=w[C+1],R=w[C+2];d.push(x,S,S,R,R,x)}}else{const w=g.array;m=g.version;for(let C=0,M=w.length/3-1;C<M;C+=3){const x=C+0,S=C+1,R=C+2;d.push(x,S,S,R,R,x)}}const u=new(g.count>=65535?Ql:Qs)(d,1);u.version=m;const f=a.get(p);f&&e.remove(f),a.set(p,u)}function h(p){const d=a.get(p);if(d){const v=p.index;v!==null&&d.version<v.version&&l(p)}else l(p);return a.get(p)}return{get:o,update:c,getWireframeAttribute:h}}function uf(i,e,t){let n;function r(p){n=p}let a,s;function o(p){a=p.type,s=p.bytesPerElement}function c(p,d){i.drawElements(n,d,a,p*s),t.update(d,n,1)}function l(p,d,v){v!==0&&(i.drawElementsInstanced(n,d,a,p*s,v),t.update(d,n,v))}function h(p,d,v){if(v===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,d,0,a,p,0,v);let m=0;for(let u=0;u<v;u++)m+=d[u];t.update(m,n,1)}this.setMode=r,this.setIndex=o,this.render=c,this.renderInstances=l,this.renderMultiDraw=h}function hf(i){const e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function n(a,s,o){switch(t.calls++,s){case i.TRIANGLES:t.triangles+=o*(a/3);break;case i.LINES:t.lines+=o*(a/2);break;case i.LINE_STRIP:t.lines+=o*(a-1);break;case i.LINE_LOOP:t.lines+=o*a;break;case i.POINTS:t.points+=o*a;break;default:je("WebGLInfo: Unknown draw mode:",s);break}}function r(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:r,update:n}}function df(i,e,t){const n=new WeakMap,r=new nt;function a(s,o,c){const l=s.morphTargetInfluences,h=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,p=h!==void 0?h.length:0;let d=n.get(o);if(d===void 0||d.count!==p){let E=function(){R.dispose(),n.delete(o),o.removeEventListener("dispose",E)};d!==void 0&&d.texture.dispose();const v=o.morphAttributes.position!==void 0,g=o.morphAttributes.normal!==void 0,m=o.morphAttributes.color!==void 0,u=o.morphAttributes.position||[],f=o.morphAttributes.normal||[],w=o.morphAttributes.color||[];let C=0;v===!0&&(C=1),g===!0&&(C=2),m===!0&&(C=3);let M=o.attributes.position.count*C,x=1;M>e.maxTextureSize&&(x=Math.ceil(M/e.maxTextureSize),M=e.maxTextureSize);const S=new Float32Array(M*x*4*p),R=new Kl(S,M,x,p);R.type=Lt,R.needsUpdate=!0;const _=C*4;for(let L=0;L<p;L++){const T=u[L],P=f[L],U=w[L],D=M*x*4*L;for(let z=0;z<T.count;z++){const W=z*_;v===!0&&(r.fromBufferAttribute(T,z),S[D+W+0]=r.x,S[D+W+1]=r.y,S[D+W+2]=r.z,S[D+W+3]=0),g===!0&&(r.fromBufferAttribute(P,z),S[D+W+4]=r.x,S[D+W+5]=r.y,S[D+W+6]=r.z,S[D+W+7]=0),m===!0&&(r.fromBufferAttribute(U,z),S[D+W+8]=r.x,S[D+W+9]=r.y,S[D+W+10]=r.z,S[D+W+11]=U.itemSize===4?r.w:1)}}d={count:p,texture:R,size:new Ve(M,x)},n.set(o,d),o.addEventListener("dispose",E)}if(s.isInstancedMesh===!0&&s.morphTexture!==null)c.getUniforms().setValue(i,"morphTexture",s.morphTexture,t);else{let v=0;for(let m=0;m<l.length;m++)v+=l[m];const g=o.morphTargetsRelative?1:1-v;c.getUniforms().setValue(i,"morphTargetBaseInfluence",g),c.getUniforms().setValue(i,"morphTargetInfluences",l)}c.getUniforms().setValue(i,"morphTargetsTexture",d.texture,t),c.getUniforms().setValue(i,"morphTargetsTextureSize",d.size)}return{update:a}}function ff(i,e,t,n,r){let a=new WeakMap;function s(l){const h=r.render.frame,p=l.geometry,d=e.get(l,p);if(a.get(d)!==h&&(e.update(d),a.set(d,h)),l.isInstancedMesh&&(l.hasEventListener("dispose",c)===!1&&l.addEventListener("dispose",c),a.get(l)!==h&&(t.update(l.instanceMatrix,i.ARRAY_BUFFER),l.instanceColor!==null&&t.update(l.instanceColor,i.ARRAY_BUFFER),a.set(l,h))),l.isSkinnedMesh){const v=l.skeleton;a.get(v)!==h&&(v.update(),a.set(v,h))}return d}function o(){a=new WeakMap}function c(l){const h=l.target;h.removeEventListener("dispose",c),n.releaseStatesOfObject(h),t.remove(h.instanceMatrix),h.instanceColor!==null&&t.remove(h.instanceColor)}return{update:s,dispose:o}}const pf={[Il]:"LINEAR_TONE_MAPPING",[Nl]:"REINHARD_TONE_MAPPING",[Fl]:"CINEON_TONE_MAPPING",[Bl]:"ACES_FILMIC_TONE_MAPPING",[zl]:"AGX_TONE_MAPPING",[kl]:"NEUTRAL_TONE_MAPPING",[Ol]:"CUSTOM_TONE_MAPPING"};function mf(i,e,t,n,r,a){const s=new Ut(e,t,{type:i,depthBuffer:r,stencilBuffer:a,samples:n?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1});let o=null,c=null;const l=new nn;l.setAttribute("position",new tn([-1,3,0,-1,-1,0,3,-1,0],3)),l.setAttribute("uv",new tn([0,2,0,0,2,0],2));const h=new ji({uniforms:{tDiffuse:{value:null}},vertexShader:`
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
			}`,depthTest:!1,depthWrite:!1}),p=new Gt(l,h),d=new no(-1,1,1,-1,0,1);let v=null,g=null,m=!1,u,f=null,w=[],C=!1;this.setSize=function(M,x){s.setSize(M,x),o!==null&&o.setSize(M,x),c!==null&&c.setSize(M,x);for(let S=0;S<w.length;S++){const R=w[S];R.setSize&&R.setSize(M,x)}},this.setEffects=function(M){w=M,C=w.length>0&&w[0].isRenderPass===!0;const x=s.width,S=s.height;w.length>0&&o===null&&(o=new Ut(x,S,{type:pn,depthBuffer:!1,stencilBuffer:!1}),c=new Ut(x,S,{type:pn,depthBuffer:!1,stencilBuffer:!1}));for(let R=0;R<w.length;R++){const _=w[R];_.setSize&&_.setSize(x,S)}},this.begin=function(M,x){if(m||M.toneMapping===fn&&w.length===0)return!1;if(f=x,x!==null){const S=x.width,R=x.height;(s.width!==S||s.height!==R)&&this.setSize(S,R)}return C===!1&&M.setRenderTarget(s),u=M.toneMapping,M.toneMapping=fn,!0},this.hasRenderPass=function(){return C},this.end=function(M,x){M.toneMapping=u,m=!0;let S=s,R=o;for(let _=0;_<w.length;_++){const E=w[_];E.enabled!==!1&&(E.render(M,R,S,x),E.needsSwap!==!1&&(S=R,R=R===o?c:o))}if(v!==M.outputColorSpace||g!==M.toneMapping){v=M.outputColorSpace,g=M.toneMapping,h.defines={},Ge.getTransfer(v)===Qe&&(h.defines.SRGB_TRANSFER="");const _=pf[g];_&&(h.defines[_]=""),h.needsUpdate=!0}h.uniforms.tDiffuse.value=S.texture,M.setRenderTarget(f),M.render(p,d),f=null,m=!1},this.isCompositing=function(){return m},this.dispose=function(){s.dispose(),o!==null&&o.dispose(),c!==null&&c.dispose(),l.dispose(),h.dispose()}}const cc=new Dt,Fs=new Jn(1,1),uc=new Kl,hc=new N0,dc=new nc,Ko=[],Zo=[],Jo=new Float32Array(16),Qo=new Float32Array(9),el=new Float32Array(4);function Ci(i,e,t){const n=i[0];if(n<=0||n>0)return i;const r=e*t;let a=Ko[r];if(a===void 0&&(a=new Float32Array(r),Ko[r]=a),e!==0){n.toArray(a,0);for(let s=1,o=0;s!==e;++s)o+=t,i[s].toArray(a,o)}return a}function _t(i,e){if(i.length!==e.length)return!1;for(let t=0,n=i.length;t<n;t++)if(i[t]!==e[t])return!1;return!0}function yt(i,e){for(let t=0,n=e.length;t<n;t++)i[t]=e[t]}function sa(i,e){let t=Zo[e];t===void 0&&(t=new Int32Array(e),Zo[e]=t);for(let n=0;n!==e;++n)t[n]=i.allocateTextureUnit();return t}function vf(i,e){const t=this.cache;t[0]!==e&&(i.uniform1f(this.addr,e),t[0]=e)}function gf(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(_t(t,e))return;i.uniform2fv(this.addr,e),yt(t,e)}}function _f(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(i.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(_t(t,e))return;i.uniform3fv(this.addr,e),yt(t,e)}}function yf(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(_t(t,e))return;i.uniform4fv(this.addr,e),yt(t,e)}}function xf(i,e){const t=this.cache,n=e.elements;if(n===void 0){if(_t(t,e))return;i.uniformMatrix2fv(this.addr,!1,e),yt(t,e)}else{if(_t(t,n))return;el.set(n),i.uniformMatrix2fv(this.addr,!1,el),yt(t,n)}}function bf(i,e){const t=this.cache,n=e.elements;if(n===void 0){if(_t(t,e))return;i.uniformMatrix3fv(this.addr,!1,e),yt(t,e)}else{if(_t(t,n))return;Qo.set(n),i.uniformMatrix3fv(this.addr,!1,Qo),yt(t,n)}}function wf(i,e){const t=this.cache,n=e.elements;if(n===void 0){if(_t(t,e))return;i.uniformMatrix4fv(this.addr,!1,e),yt(t,e)}else{if(_t(t,n))return;Jo.set(n),i.uniformMatrix4fv(this.addr,!1,Jo),yt(t,n)}}function Sf(i,e){const t=this.cache;t[0]!==e&&(i.uniform1i(this.addr,e),t[0]=e)}function Mf(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(_t(t,e))return;i.uniform2iv(this.addr,e),yt(t,e)}}function Ef(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(_t(t,e))return;i.uniform3iv(this.addr,e),yt(t,e)}}function Rf(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(_t(t,e))return;i.uniform4iv(this.addr,e),yt(t,e)}}function Tf(i,e){const t=this.cache;t[0]!==e&&(i.uniform1ui(this.addr,e),t[0]=e)}function Af(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(_t(t,e))return;i.uniform2uiv(this.addr,e),yt(t,e)}}function Cf(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(_t(t,e))return;i.uniform3uiv(this.addr,e),yt(t,e)}}function Lf(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(_t(t,e))return;i.uniform4uiv(this.addr,e),yt(t,e)}}function Pf(i,e,t){const n=this.cache,r=t.allocateTextureUnit();n[0]!==r&&(i.uniform1i(this.addr,r),n[0]=r);let a;this.type===i.SAMPLER_2D_SHADOW?(Fs.compareFunction=t.isReversedDepthBuffer()?Ks:ia,a=Fs):a=cc,t.setTexture2D(e||a,r)}function Df(i,e,t){const n=this.cache,r=t.allocateTextureUnit();n[0]!==r&&(i.uniform1i(this.addr,r),n[0]=r),t.setTexture3D(e||hc,r)}function Uf(i,e,t){const n=this.cache,r=t.allocateTextureUnit();n[0]!==r&&(i.uniform1i(this.addr,r),n[0]=r),t.setTextureCube(e||dc,r)}function If(i,e,t){const n=this.cache,r=t.allocateTextureUnit();n[0]!==r&&(i.uniform1i(this.addr,r),n[0]=r),t.setTexture2DArray(e||uc,r)}function Nf(i){switch(i){case 5126:return vf;case 35664:return gf;case 35665:return _f;case 35666:return yf;case 35674:return xf;case 35675:return bf;case 35676:return wf;case 5124:case 35670:return Sf;case 35667:case 35671:return Mf;case 35668:case 35672:return Ef;case 35669:case 35673:return Rf;case 5125:return Tf;case 36294:return Af;case 36295:return Cf;case 36296:return Lf;case 35678:case 36198:case 36298:case 36306:case 35682:return Pf;case 35679:case 36299:case 36307:return Df;case 35680:case 36300:case 36308:case 36293:return Uf;case 36289:case 36303:case 36311:case 36292:return If}}function Ff(i,e){i.uniform1fv(this.addr,e)}function Bf(i,e){const t=Ci(e,this.size,2);i.uniform2fv(this.addr,t)}function Of(i,e){const t=Ci(e,this.size,3);i.uniform3fv(this.addr,t)}function zf(i,e){const t=Ci(e,this.size,4);i.uniform4fv(this.addr,t)}function kf(i,e){const t=Ci(e,this.size,4);i.uniformMatrix2fv(this.addr,!1,t)}function Gf(i,e){const t=Ci(e,this.size,9);i.uniformMatrix3fv(this.addr,!1,t)}function Vf(i,e){const t=Ci(e,this.size,16);i.uniformMatrix4fv(this.addr,!1,t)}function Hf(i,e){i.uniform1iv(this.addr,e)}function Wf(i,e){i.uniform2iv(this.addr,e)}function Xf(i,e){i.uniform3iv(this.addr,e)}function jf(i,e){i.uniform4iv(this.addr,e)}function qf(i,e){i.uniform1uiv(this.addr,e)}function Yf(i,e){i.uniform2uiv(this.addr,e)}function $f(i,e){i.uniform3uiv(this.addr,e)}function Kf(i,e){i.uniform4uiv(this.addr,e)}function Zf(i,e,t){const n=this.cache,r=e.length,a=sa(t,r);_t(n,a)||(i.uniform1iv(this.addr,a),yt(n,a));let s;this.type===i.SAMPLER_2D_SHADOW?s=Fs:s=cc;for(let o=0;o!==r;++o)t.setTexture2D(e[o]||s,a[o])}function Jf(i,e,t){const n=this.cache,r=e.length,a=sa(t,r);_t(n,a)||(i.uniform1iv(this.addr,a),yt(n,a));for(let s=0;s!==r;++s)t.setTexture3D(e[s]||hc,a[s])}function Qf(i,e,t){const n=this.cache,r=e.length,a=sa(t,r);_t(n,a)||(i.uniform1iv(this.addr,a),yt(n,a));for(let s=0;s!==r;++s)t.setTextureCube(e[s]||dc,a[s])}function ep(i,e,t){const n=this.cache,r=e.length,a=sa(t,r);_t(n,a)||(i.uniform1iv(this.addr,a),yt(n,a));for(let s=0;s!==r;++s)t.setTexture2DArray(e[s]||uc,a[s])}function tp(i){switch(i){case 5126:return Ff;case 35664:return Bf;case 35665:return Of;case 35666:return zf;case 35674:return kf;case 35675:return Gf;case 35676:return Vf;case 5124:case 35670:return Hf;case 35667:case 35671:return Wf;case 35668:case 35672:return Xf;case 35669:case 35673:return jf;case 5125:return qf;case 36294:return Yf;case 36295:return $f;case 36296:return Kf;case 35678:case 36198:case 36298:case 36306:case 35682:return Zf;case 35679:case 36299:case 36307:return Jf;case 35680:case 36300:case 36308:case 36293:return Qf;case 36289:case 36303:case 36311:case 36292:return ep}}class np{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=Nf(t.type)}}class ip{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=tp(t.type)}}class rp{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){const r=this.seq;for(let a=0,s=r.length;a!==s;++a){const o=r[a];o.setValue(e,t[o.id],n)}}}const Oa=/(\w+)(\])?(\[|\.)?/g;function tl(i,e){i.seq.push(e),i.map[e.id]=e}function ap(i,e,t){const n=i.name,r=n.length;for(Oa.lastIndex=0;;){const a=Oa.exec(n),s=Oa.lastIndex;let o=a[1];const c=a[2]==="]",l=a[3];if(c&&(o=o|0),l===void 0||l==="["&&s+2===r){tl(t,l===void 0?new np(o,i,e):new ip(o,i,e));break}else{let p=t.map[o];p===void 0&&(p=new rp(o),tl(t,p)),t=p}}}class Br{constructor(e,t){this.seq=[],this.map={};const n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let s=0;s<n;++s){const o=e.getActiveUniform(t,s),c=e.getUniformLocation(t,o.name);ap(o,c,this)}const r=[],a=[];for(const s of this.seq)s.type===e.SAMPLER_2D_SHADOW||s.type===e.SAMPLER_CUBE_SHADOW||s.type===e.SAMPLER_2D_ARRAY_SHADOW?r.push(s):a.push(s);r.length>0&&(this.seq=r.concat(a))}setValue(e,t,n,r){const a=this.map[t];a!==void 0&&a.setValue(e,n,r)}setOptional(e,t,n){const r=t[n];r!==void 0&&this.setValue(e,n,r)}static upload(e,t,n,r){for(let a=0,s=t.length;a!==s;++a){const o=t[a],c=n[o.id];c.needsUpdate!==!1&&o.setValue(e,c.value,r)}}static seqWithValue(e,t){const n=[];for(let r=0,a=e.length;r!==a;++r){const s=e[r];s.id in t&&n.push(s)}return n}}function nl(i,e,t){const n=i.createShader(e);return i.shaderSource(n,t),i.compileShader(n),n}const sp=37297;let op=0;function lp(i,e){const t=i.split(`
`),n=[],r=Math.max(e-6,0),a=Math.min(e+6,t.length);for(let s=r;s<a;s++){const o=s+1;n.push(`${o===e?">":" "} ${o}: ${t[s]}`)}return n.join(`
`)}const il=new Pe;function cp(i){Ge._getMatrix(il,Ge.workingColorSpace,i);const e=`mat3( ${il.elements.map(t=>t.toFixed(4))} )`;switch(Ge.getTransfer(i)){case Hr:return[e,"LinearTransferOETF"];case Qe:return[e,"sRGBTransferOETF"];default:return Ce("WebGLProgram: Unsupported color space: ",i),[e,"LinearTransferOETF"]}}function rl(i,e,t){const n=i.getShaderParameter(e,i.COMPILE_STATUS),a=(i.getShaderInfoLog(e)||"").trim();if(n&&a==="")return"";const s=/ERROR: 0:(\d+)/.exec(a);if(s){const o=parseInt(s[1]);return t.toUpperCase()+`

`+a+`

`+lp(i.getShaderSource(e),o)}else return a}function up(i,e){const t=cp(e);return[`vec4 ${i}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}const hp={[Il]:"Linear",[Nl]:"Reinhard",[Fl]:"Cineon",[Bl]:"ACESFilmic",[zl]:"AgX",[kl]:"Neutral",[Ol]:"Custom"};function dp(i,e){const t=hp[e];return t===void 0?(Ce("WebGLProgram: Unsupported toneMapping:",e),"vec3 "+i+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+i+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}const Ar=new O;function fp(){Ge.getLuminanceCoefficients(Ar);const i=Ar.x.toFixed(4),e=Ar.y.toFixed(4),t=Ar.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${i}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function pp(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(Gi).join(`
`)}function mp(i){const e=[];for(const t in i){const n=i[t];n!==!1&&e.push("#define "+t+" "+n)}return e.join(`
`)}function vp(i,e){const t={},n=i.getProgramParameter(e,i.ACTIVE_ATTRIBUTES);for(let r=0;r<n;r++){const a=i.getActiveAttrib(e,r),s=a.name;let o=1;a.type===i.FLOAT_MAT2&&(o=2),a.type===i.FLOAT_MAT3&&(o=3),a.type===i.FLOAT_MAT4&&(o=4),t[s]={type:a.type,location:i.getAttribLocation(e,s),locationSize:o}}return t}function Gi(i){return i!==""}function al(i,e){const t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return i.replace(/NUM_SUN_LIGHTS/g,e.numSunLights).replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,e.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function sl(i,e){return i.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}const gp=/^[ \t]*#include +<([\w\d./]+)>/gm;function Bs(i){return i.replace(gp,yp)}const _p=new Map;function yp(i,e){let t=Ie[e];if(t===void 0){const n=_p.get(e);if(n!==void 0)t=Ie[n],Ce('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,n);else throw new Error("THREE.WebGLProgram: Can not resolve #include <"+e+">")}return Bs(t)}const xp=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function ol(i){return i.replace(xp,bp)}function bp(i,e,t,n){let r="";for(let a=parseInt(e);a<parseInt(t);a++)r+=n.replace(/\[\s*i\s*\]/g,"[ "+a+" ]").replace(/UNROLLED_LOOP_INDEX/g,a);return r}function ll(i){let e=`precision ${i.precision} float;
	precision ${i.precision} int;
	precision ${i.precision} sampler2D;
	precision ${i.precision} samplerCube;
	precision ${i.precision} sampler3D;
	precision ${i.precision} sampler2DArray;
	precision ${i.precision} sampler2DShadow;
	precision ${i.precision} samplerCubeShadow;
	precision ${i.precision} sampler2DArrayShadow;
	precision ${i.precision} isampler2D;
	precision ${i.precision} isampler3D;
	precision ${i.precision} isamplerCube;
	precision ${i.precision} isampler2DArray;
	precision ${i.precision} usampler2D;
	precision ${i.precision} usampler3D;
	precision ${i.precision} usamplerCube;
	precision ${i.precision} usampler2DArray;
	`;return i.precision==="highp"?e+=`
#define HIGH_PRECISION`:i.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:i.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}const wp={[Dr]:"SHADOWMAP_TYPE_PCF",[ki]:"SHADOWMAP_TYPE_VSM"};function Sp(i){return wp[i.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}const Mp={[$n]:"ENVMAP_TYPE_CUBE",[Ti]:"ENVMAP_TYPE_CUBE",[ea]:"ENVMAP_TYPE_CUBE_UV"};function Ep(i){return i.envMap===!1?"ENVMAP_TYPE_CUBE":Mp[i.envMapMode]||"ENVMAP_TYPE_CUBE"}const Rp={[Ti]:"ENVMAP_MODE_REFRACTION"};function Tp(i){return i.envMap===!1?"ENVMAP_MODE_REFLECTION":Rp[i.envMapMode]||"ENVMAP_MODE_REFLECTION"}const Ap={[Ul]:"ENVMAP_BLENDING_MULTIPLY",[Jc]:"ENVMAP_BLENDING_MIX",[Qc]:"ENVMAP_BLENDING_ADD"};function Cp(i){return i.envMap===!1?"ENVMAP_BLENDING_NONE":Ap[i.combine]||"ENVMAP_BLENDING_NONE"}function Lp(i){const e=i.envMapCubeUVHeight;if(e===null)return null;const t=Math.log2(e)-2,n=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:n,maxMip:t}}function Pp(i,e,t,n){const r=i.getContext(),a=t.defines;let s=t.vertexShader,o=t.fragmentShader;const c=Sp(t),l=Ep(t),h=Tp(t),p=Cp(t),d=Lp(t),v=pp(t),g=mp(a),m=r.createProgram();let u,f,w=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(u=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(Gi).join(`
`),u.length>0&&(u+=`
`),f=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(Gi).join(`
`),f.length>0&&(f+=`
`)):(u=[ll(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+h:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexNormals?"#define HAS_NORMAL":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+c:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Gi).join(`
`),f=[ll(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+l:"",t.envMap?"#define "+h:"",t.envMap?"#define "+p:"",d?"#define CUBEUV_TEXEL_WIDTH "+d.texelWidth:"",d?"#define CUBEUV_TEXEL_HEIGHT "+d.texelHeight:"",d?"#define CUBEUV_MAX_MIP "+d.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.retroreflection?"#define USE_RETROREFLECTION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor?"#define USE_COLOR":"",t.vertexAlphas||t.batchingColor?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+c:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.numLightProbeGrids>0?"#define USE_LIGHT_PROBES_GRID":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==fn?"#define TONE_MAPPING":"",t.toneMapping!==fn?Ie.tonemapping_pars_fragment:"",t.toneMapping!==fn?dp("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",Ie.colorspace_pars_fragment,up("linearToOutputTexel",t.outputColorSpace),fp(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(Gi).join(`
`)),s=Bs(s),s=al(s,t),s=sl(s,t),o=Bs(o),o=al(o,t),o=sl(o,t),s=ol(s),o=ol(o),t.isRawShaderMaterial!==!0&&(w=`#version 300 es
`,u=[v,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+u,f=["#define varying in",t.glslVersion===Mi?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===Mi?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+f);const C=w+u+s,M=w+f+o,x=nl(r,r.VERTEX_SHADER,C),S=nl(r,r.FRAGMENT_SHADER,M);r.attachShader(m,x),r.attachShader(m,S),t.index0AttributeName!==void 0?r.bindAttribLocation(m,0,t.index0AttributeName):t.hasPositionAttribute===!0&&r.bindAttribLocation(m,0,"position"),r.linkProgram(m);function R(T){if(i.debug.checkShaderErrors){const P=r.getProgramInfoLog(m)||"",U=r.getShaderInfoLog(x)||"",D=r.getShaderInfoLog(S)||"",z=P.trim(),W=U.trim(),j=D.trim();let Z=!0,I=!0;if(r.getProgramParameter(m,r.LINK_STATUS)===!1)if(Z=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(r,m,x,S);else{const q=rl(r,x,"vertex"),Q=rl(r,S,"fragment");je("WebGLProgram: Shader Error "+r.getError()+" - VALIDATE_STATUS "+r.getProgramParameter(m,r.VALIDATE_STATUS)+`

Material Name: `+T.name+`
Material Type: `+T.type+`

Program Info Log: `+z+`
`+q+`
`+Q)}else z!==""?Ce("WebGLProgram: Program Info Log:",z):(W===""||j==="")&&(I=!1);I&&(T.diagnostics={runnable:Z,programLog:z,vertexShader:{log:W,prefix:u},fragmentShader:{log:j,prefix:f}})}r.deleteShader(x),r.deleteShader(S),_=new Br(r,m),E=vp(r,m)}let _;this.getUniforms=function(){return _===void 0&&R(this),_};let E;this.getAttributes=function(){return E===void 0&&R(this),E};let L=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return L===!1&&(L=r.getProgramParameter(m,sp)),L},this.destroy=function(){n.releaseStatesOfProgram(this),r.deleteProgram(m),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=op++,this.cacheKey=e,this.usedTimes=1,this.program=m,this.vertexShader=x,this.fragmentShader=S,this}let Dp=0;class Up{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e,t,n){const r=this._getShaderCacheForMaterial(e);return r.has(t)===!1&&(r.add(t),t.usedTimes++),r.has(n)===!1&&(r.add(n),n.usedTimes++),this}remove(e){const t=this.materialCache.get(e);for(const n of t)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(e),this}getVertexShaderStage(e){return this._getShaderStage(e.vertexShader)}getFragmentShaderStage(e){return this._getShaderStage(e.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){const t=this.materialCache;let n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){const t=this.shaderCache;let n=t.get(e);return n===void 0&&(n=new Ip(e),t.set(e,n)),n}}class Ip{constructor(e){this.id=Dp++,this.code=e,this.usedTimes=0}}function Np(i){return i===Kn||i===Gr||i===Vr}function Fp(i,e,t,n,r,a){const s=new Zl,o=new Up,c=new Set,l=[],h=new Map,p=n.logarithmicDepthBuffer;let d=n.precision;const v={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function g(_){return c.add(_),_===0?"uv":`uv${_}`}function m(_,E,L,T,P,U){const D=T.fog,z=P.geometry,W=_.isMeshStandardMaterial||_.isMeshLambertMaterial||_.isMeshPhongMaterial?T.environment:null,j=_.isMeshStandardMaterial||_.isMeshLambertMaterial&&!_.envMap||_.isMeshPhongMaterial&&!_.envMap,Z=e.get(_.envMap||W,j),I=Z&&Z.mapping===ea?Z.image.height:null,q=v[_.type];_.precision!==null&&(d=n.getMaxPrecision(_.precision),d!==_.precision&&Ce("WebGLProgram.getParameters:",_.precision,"not supported, using",d,"instead."));const Q=z.morphAttributes.position||z.morphAttributes.normal||z.morphAttributes.color,Me=Q!==void 0?Q.length:0;let we=0;z.morphAttributes.position!==void 0&&(we=1),z.morphAttributes.normal!==void 0&&(we=2),z.morphAttributes.color!==void 0&&(we=3);let Ze,Fe,He,Y;if(q){const at=ln[q];Ze=at.vertexShader,Fe=at.fragmentShader}else{Ze=_.vertexShader,Fe=_.fragmentShader;const at=o.getVertexShaderStage(_),Ye=o.getFragmentShaderStage(_);o.update(_,at,Ye),He=at.id,Y=Ye.id}const ee=i.getRenderTarget(),_e=i.state.buffers.depth.getReversed(),Le=P.isInstancedMesh===!0,ve=P.isBatchedMesh===!0,Ne=!!_.map,mt=!!_.matcap,Be=!!Z,Xe=!!_.aoMap,rt=!!_.lightMap,ze=!!_.bumpMap&&_.wireframe===!1,lt=!!_.normalMap,xt=!!_.displacementMap,It=!!_.emissiveMap,ct=!!_.metalnessMap,ht=!!_.roughnessMap,B=_.anisotropy>0,St=_.clearcoat>0,Je=_.dispersion>0,A=_.retroreflectivity>0,y=_.iridescence>0,k=_.sheen>0,H=_.transmission>0,$=B&&!!_.anisotropyMap,ie=St&&!!_.clearcoatMap,re=St&&!!_.clearcoatNormalMap,K=St&&!!_.clearcoatRoughnessMap,te=y&&!!_.iridescenceMap,ae=y&&!!_.iridescenceThicknessMap,Ee=k&&!!_.sheenColorMap,ce=k&&!!_.sheenRoughnessMap,se=!!_.specularMap,Re=!!_.specularColorMap,Ae=!!_.specularIntensityMap,De=H&&!!_.transmissionMap,F=H&&!!_.thicknessMap,oe=!!_.gradientMap,J=!!_.alphaMap,le=_.alphaTest>0,fe=!!_.alphaHash,ne=!!_.extensions;let Te=fn;_.toneMapped&&(ee===null||ee.isXRRenderTarget===!0)&&(Te=i.toneMapping);const be={shaderID:q,shaderType:_.type,shaderName:_.name,vertexShader:Ze,fragmentShader:Fe,defines:_.defines,customVertexShaderID:He,customFragmentShaderID:Y,isRawShaderMaterial:_.isRawShaderMaterial===!0,glslVersion:_.glslVersion,precision:d,batching:ve,batchingColor:ve&&P._colorsTexture!==null,instancing:Le,instancingColor:Le&&P.instanceColor!==null,instancingMorph:Le&&P.morphTexture!==null,outputColorSpace:ee===null?i.outputColorSpace:ee.isXRRenderTarget===!0?ee.texture.colorSpace:Ge.workingColorSpace,alphaToCoverage:!!_.alphaToCoverage,map:Ne,matcap:mt,envMap:Be,envMapMode:Be&&Z.mapping,envMapCubeUVHeight:I,aoMap:Xe,lightMap:rt,bumpMap:ze,normalMap:lt,displacementMap:xt,emissiveMap:It,normalMapObjectSpace:lt&&_.normalMapType===n0,normalMapTangentSpace:lt&&_.normalMapType===wo,packedNormalMap:lt&&_.normalMapType===wo&&Np(_.normalMap.format),metalnessMap:ct,roughnessMap:ht,anisotropy:B,anisotropyMap:$,clearcoat:St,clearcoatMap:ie,clearcoatNormalMap:re,clearcoatRoughnessMap:K,dispersion:Je,retroreflection:A,iridescence:y,iridescenceMap:te,iridescenceThicknessMap:ae,sheen:k,sheenColorMap:Ee,sheenRoughnessMap:ce,specularMap:se,specularColorMap:Re,specularIntensityMap:Ae,transmission:H,transmissionMap:De,thicknessMap:F,gradientMap:oe,opaque:_.transparent===!1&&_.blending===Hi&&_.alphaToCoverage===!1,alphaMap:J,alphaTest:le,alphaHash:fe,combine:_.combine,mapUv:Ne&&g(_.map.channel),aoMapUv:Xe&&g(_.aoMap.channel),lightMapUv:rt&&g(_.lightMap.channel),bumpMapUv:ze&&g(_.bumpMap.channel),normalMapUv:lt&&g(_.normalMap.channel),displacementMapUv:xt&&g(_.displacementMap.channel),emissiveMapUv:It&&g(_.emissiveMap.channel),metalnessMapUv:ct&&g(_.metalnessMap.channel),roughnessMapUv:ht&&g(_.roughnessMap.channel),anisotropyMapUv:$&&g(_.anisotropyMap.channel),clearcoatMapUv:ie&&g(_.clearcoatMap.channel),clearcoatNormalMapUv:re&&g(_.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:K&&g(_.clearcoatRoughnessMap.channel),iridescenceMapUv:te&&g(_.iridescenceMap.channel),iridescenceThicknessMapUv:ae&&g(_.iridescenceThicknessMap.channel),sheenColorMapUv:Ee&&g(_.sheenColorMap.channel),sheenRoughnessMapUv:ce&&g(_.sheenRoughnessMap.channel),specularMapUv:se&&g(_.specularMap.channel),specularColorMapUv:Re&&g(_.specularColorMap.channel),specularIntensityMapUv:Ae&&g(_.specularIntensityMap.channel),transmissionMapUv:De&&g(_.transmissionMap.channel),thicknessMapUv:F&&g(_.thicknessMap.channel),alphaMapUv:J&&g(_.alphaMap.channel),vertexTangents:!!z.attributes.tangent&&(lt||B),vertexNormals:!!z.attributes.normal,vertexColors:_.vertexColors,vertexAlphas:_.vertexColors===!0&&!!z.attributes.color&&z.attributes.color.itemSize===4,pointsUvs:P.isPoints===!0&&!!z.attributes.uv&&(Ne||J),fog:!!D,useFog:_.fog===!0,fogExp2:!!D&&D.isFogExp2,flatShading:_.wireframe===!1&&(_.flatShading===!0||z.attributes.normal===void 0&&lt===!1&&(_.isMeshLambertMaterial||_.isMeshPhongMaterial||_.isMeshStandardMaterial||_.isMeshPhysicalMaterial)),sizeAttenuation:_.sizeAttenuation===!0,logarithmicDepthBuffer:p,reversedDepthBuffer:_e,skinning:P.isSkinnedMesh===!0,hasPositionAttribute:z.attributes.position!==void 0,morphTargets:z.morphAttributes.position!==void 0,morphNormals:z.morphAttributes.normal!==void 0,morphColors:z.morphAttributes.color!==void 0,morphTargetsCount:Me,morphTextureStride:we,numSunLights:E.sun.length,numDirLights:E.directional.length,numPointLights:E.point.length,numSpotLights:E.spot.length,numSpotLightMaps:E.spotLightMap.length,numRectAreaLights:E.rectArea.length,numHemiLights:E.hemi.length,numSunLightShadows:E.sunShadowMap.length,numDirLightShadows:E.directionalShadowMap.length,numPointLightShadows:E.pointShadowMap.length,numSpotLightShadows:E.spotShadowMap.length,numSpotLightShadowsWithMaps:E.numSpotLightShadowsWithMaps,numLightProbes:E.numLightProbes,numLightProbeGrids:U.length,numClippingPlanes:a.numPlanes,numClipIntersection:a.numIntersection,dithering:_.dithering,shadowMapEnabled:i.shadowMap.enabled&&L.length>0,shadowMapType:i.shadowMap.type,toneMapping:Te,decodeVideoTexture:Ne&&_.map.isVideoTexture===!0&&Ge.getTransfer(_.map.colorSpace)===Qe,decodeVideoTextureEmissive:It&&_.emissiveMap.isVideoTexture===!0&&Ge.getTransfer(_.emissiveMap.colorSpace)===Qe,premultipliedAlpha:_.premultipliedAlpha,doubleSided:_.side===cn,flipSided:_.side===Ft,useDepthPacking:_.depthPacking>=0,depthPacking:_.depthPacking||0,index0AttributeName:_.index0AttributeName,extensionClipCullDistance:ne&&_.extensions.clipCullDistance===!0&&t.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(ne&&_.extensions.multiDraw===!0||ve)&&t.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:t.has("KHR_parallel_shader_compile"),customProgramCacheKey:_.customProgramCacheKey()};return be.vertexUv1s=c.has(1),be.vertexUv2s=c.has(2),be.vertexUv3s=c.has(3),c.clear(),be}function u(_){const E=[];if(_.shaderID?E.push(_.shaderID):(E.push(_.customVertexShaderID),E.push(_.customFragmentShaderID)),_.defines!==void 0)for(const L in _.defines)E.push(L),E.push(_.defines[L]);return _.isRawShaderMaterial===!1&&(f(E,_),w(E,_),E.push(i.outputColorSpace)),E.push(_.customProgramCacheKey),E.join()}function f(_,E){_.push(E.precision),_.push(E.outputColorSpace),_.push(E.envMapMode),_.push(E.envMapCubeUVHeight),_.push(E.mapUv),_.push(E.alphaMapUv),_.push(E.lightMapUv),_.push(E.aoMapUv),_.push(E.bumpMapUv),_.push(E.normalMapUv),_.push(E.displacementMapUv),_.push(E.emissiveMapUv),_.push(E.metalnessMapUv),_.push(E.roughnessMapUv),_.push(E.anisotropyMapUv),_.push(E.clearcoatMapUv),_.push(E.clearcoatNormalMapUv),_.push(E.clearcoatRoughnessMapUv),_.push(E.iridescenceMapUv),_.push(E.iridescenceThicknessMapUv),_.push(E.sheenColorMapUv),_.push(E.sheenRoughnessMapUv),_.push(E.specularMapUv),_.push(E.specularColorMapUv),_.push(E.specularIntensityMapUv),_.push(E.transmissionMapUv),_.push(E.thicknessMapUv),_.push(E.combine),_.push(E.fogExp2),_.push(E.sizeAttenuation),_.push(E.morphTargetsCount),_.push(E.morphAttributeCount),_.push(E.numSunLights),_.push(E.numDirLights),_.push(E.numPointLights),_.push(E.numSpotLights),_.push(E.numSpotLightMaps),_.push(E.numHemiLights),_.push(E.numRectAreaLights),_.push(E.numSunLightShadows),_.push(E.numDirLightShadows),_.push(E.numPointLightShadows),_.push(E.numSpotLightShadows),_.push(E.numSpotLightShadowsWithMaps),_.push(E.numLightProbes),_.push(E.shadowMapType),_.push(E.toneMapping),_.push(E.numClippingPlanes),_.push(E.numClipIntersection),_.push(E.depthPacking)}function w(_,E){s.disableAll(),E.instancing&&s.enable(0),E.instancingColor&&s.enable(1),E.instancingMorph&&s.enable(2),E.matcap&&s.enable(3),E.envMap&&s.enable(4),E.normalMapObjectSpace&&s.enable(5),E.normalMapTangentSpace&&s.enable(6),E.clearcoat&&s.enable(7),E.iridescence&&s.enable(8),E.alphaTest&&s.enable(9),E.vertexColors&&s.enable(10),E.vertexAlphas&&s.enable(11),E.vertexUv1s&&s.enable(12),E.vertexUv2s&&s.enable(13),E.vertexUv3s&&s.enable(14),E.vertexTangents&&s.enable(15),E.anisotropy&&s.enable(16),E.alphaHash&&s.enable(17),E.batching&&s.enable(18),E.dispersion&&s.enable(19),E.retroreflection&&s.enable(24),E.batchingColor&&s.enable(20),E.gradientMap&&s.enable(21),E.packedNormalMap&&s.enable(22),E.vertexNormals&&s.enable(23),_.push(s.mask),s.disableAll(),E.fog&&s.enable(0),E.useFog&&s.enable(1),E.flatShading&&s.enable(2),E.logarithmicDepthBuffer&&s.enable(3),E.reversedDepthBuffer&&s.enable(4),E.skinning&&s.enable(5),E.morphTargets&&s.enable(6),E.morphNormals&&s.enable(7),E.morphColors&&s.enable(8),E.premultipliedAlpha&&s.enable(9),E.shadowMapEnabled&&s.enable(10),E.doubleSided&&s.enable(11),E.flipSided&&s.enable(12),E.useDepthPacking&&s.enable(13),E.dithering&&s.enable(14),E.transmission&&s.enable(15),E.sheen&&s.enable(16),E.opaque&&s.enable(17),E.pointsUvs&&s.enable(18),E.decodeVideoTexture&&s.enable(19),E.decodeVideoTextureEmissive&&s.enable(20),E.alphaToCoverage&&s.enable(21),E.numLightProbeGrids>0&&s.enable(22),E.hasPositionAttribute&&s.enable(23),_.push(s.mask)}function C(_){const E=v[_.type];let L;if(E){const T=ln[E];L=iu.clone(T.uniforms)}else L=_.uniforms;return L}function M(_,E){let L=h.get(E);return L!==void 0?++L.usedTimes:(L=new Pp(i,E,_,r),l.push(L),h.set(E,L)),L}function x(_){if(--_.usedTimes===0){const E=l.indexOf(_);l[E]=l[l.length-1],l.pop(),h.delete(_.cacheKey),_.destroy()}}function S(_){o.remove(_)}function R(){o.dispose()}return{getParameters:m,getProgramCacheKey:u,getUniforms:C,acquireProgram:M,releaseProgram:x,releaseShaderCache:S,programs:l,dispose:R}}function Bp(){let i=new WeakMap;function e(s){return i.has(s)}function t(s){let o=i.get(s);return o===void 0&&(o={},i.set(s,o)),o}function n(s){i.delete(s)}function r(s,o,c){i.get(s)[o]=c}function a(){i=new WeakMap}return{has:e,get:t,remove:n,update:r,dispose:a}}function Op(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.material.id!==e.material.id?i.material.id-e.material.id:i.materialVariant!==e.materialVariant?i.materialVariant-e.materialVariant:i.z!==e.z?i.z-e.z:i.id-e.id}function cl(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.z!==e.z?e.z-i.z:i.id-e.id}function ul(){const i=[];let e=0;const t=[],n=[],r=[];function a(){e=0,t.length=0,n.length=0,r.length=0}function s(d){let v=0;return d.isInstancedMesh&&(v+=2),d.isSkinnedMesh&&(v+=1),v}function o(d,v,g,m,u,f){let w=i[e];return w===void 0?(w={id:d.id,object:d,geometry:v,material:g,materialVariant:s(d),groupOrder:m,renderOrder:d.renderOrder,z:u,group:f},i[e]=w):(w.id=d.id,w.object=d,w.geometry=v,w.material=g,w.materialVariant=s(d),w.groupOrder=m,w.renderOrder=d.renderOrder,w.z=u,w.group=f),e++,w}function c(d,v,g,m,u,f,w){w.reversedDepth===!0&&(u=-u);const C=o(d,v,g,m,u,f);g.transmission>0?n.push(C):g.transparent===!0?r.push(C):t.push(C)}function l(d,v,g,m,u,f){const w=o(d,v,g,m,u,f);g.transmission>0?n.unshift(w):g.transparent===!0?r.unshift(w):t.unshift(w)}function h(d,v){t.length>1&&t.sort(d||Op),n.length>1&&n.sort(v||cl),r.length>1&&r.sort(v||cl)}function p(){for(let d=e,v=i.length;d<v;d++){const g=i[d];if(g.id===null)break;g.id=null,g.object=null,g.geometry=null,g.material=null,g.group=null}}return{opaque:t,transmissive:n,transparent:r,init:a,push:c,unshift:l,finish:p,sort:h}}function zp(){let i=new WeakMap;function e(n,r){const a=i.get(n);let s;return a===void 0?(s=new ul,i.set(n,[s])):r>=a.length?(s=new ul,a.push(s)):s=a[r],s}function t(){i=new WeakMap}return{get:e,dispose:t}}function kp(){const i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"SunLight":case"DirectionalLight":t={direction:new O,color:new qe};break;case"SpotLight":t={position:new O,direction:new O,color:new qe,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new O,color:new qe,distance:0,decay:0};break;case"HemisphereLight":t={direction:new O,skyColor:new qe,groundColor:new qe};break;case"RectAreaLight":t={color:new qe,position:new O,halfWidth:new O,halfHeight:new O};break}return i[e.id]=t,t}}}function Gp(){const i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"SunLight":case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ve};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ve};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ve,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[e.id]=t,t}}}let Vp=0;function Hp(i,e){return(e.castShadow?2:0)-(i.castShadow?2:0)+(e.map?1:0)-(i.map?1:0)}function Wp(i){const e=new kp,t=Gp(),n={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let l=0;l<9;l++)n.probe.push(new O);const r=new O,a=new pe,s=new pe;function o(l){let h=0,p=0,d=0;for(let P=0;P<9;P++)n.probe[P].set(0,0,0);let v=0,g=0,m=0,u=0,f=0,w=0,C=0,M=0,x=0,S=0,R=0,_=0,E=0,L=0;l.sort(Hp);for(let P=0,U=l.length;P<U;P++){const D=l[P],z=D.color,W=D.intensity,j=D.distance;let Z=null;if(D.shadow&&D.shadow.map&&(D.shadow.map.texture.format===Kn?Z=D.shadow.map.texture:Z=D.shadow.map.depthTexture||D.shadow.map.texture),D.isAmbientLight)h+=z.r*W,p+=z.g*W,d+=z.b*W;else if(D.isLightProbe){for(let I=0;I<9;I++)n.probe[I].addScaledVector(D.sh.coefficients[I],W);L++}else if(D.isSunLight){const I=e.get(D);if(I.color.copy(D.color).multiplyScalar(D.intensity),D.castShadow){const q=D.shadow,Q=t.get(D);Q.shadowIntensity=q.intensity,Q.shadowBias=q.bias,Q.shadowNormalBias=q.normalBias,Q.shadowRadius=q.radius,Q.shadowMapSize.copy(q.mapSize).multiply(q.getFrameExtents()),n.sunShadow[g]=Q,n.sunShadowMap[g]=Z;const Me=q.getViewportCount();for(let we=0;we<Me;we++)n.sunShadowMatrix[m+we]=q.getMatrix(we),n.sunShadowCascade[m+we]=q._cascadeData[we];m+=Me,g++}n.sun[v]=I,v++}else if(D.isDirectionalLight){const I=e.get(D);if(I.color.copy(D.color).multiplyScalar(D.intensity),D.castShadow){const q=D.shadow,Q=t.get(D);Q.shadowIntensity=q.intensity,Q.shadowBias=q.bias,Q.shadowNormalBias=q.normalBias,Q.shadowRadius=q.radius,Q.shadowMapSize=q.mapSize,n.directionalShadow[u]=Q,n.directionalShadowMap[u]=Z,n.directionalShadowMatrix[u]=D.shadow.matrix,x++}n.directional[u]=I,u++}else if(D.isSpotLight){const I=e.get(D);I.position.setFromMatrixPosition(D.matrixWorld),I.color.copy(z).multiplyScalar(W),I.distance=j,I.coneCos=Math.cos(D.angle),I.penumbraCos=Math.cos(D.angle*(1-D.penumbra)),I.decay=D.decay,n.spot[w]=I;const q=D.shadow;if(D.map&&(n.spotLightMap[_]=D.map,_++,q.updateMatrices(D),D.castShadow&&E++),n.spotLightMatrix[w]=q.matrix,D.castShadow){const Q=t.get(D);Q.shadowIntensity=q.intensity,Q.shadowBias=q.bias,Q.shadowNormalBias=q.normalBias,Q.shadowRadius=q.radius,Q.shadowMapSize=q.mapSize,n.spotShadow[w]=Q,n.spotShadowMap[w]=Z,R++}w++}else if(D.isRectAreaLight){const I=e.get(D);I.color.copy(z).multiplyScalar(W),I.halfWidth.set(D.width*.5,0,0),I.halfHeight.set(0,D.height*.5,0),n.rectArea[C]=I,C++}else if(D.isPointLight){const I=e.get(D);if(I.color.copy(D.color).multiplyScalar(D.intensity),I.distance=D.distance,I.decay=D.decay,D.castShadow){const q=D.shadow,Q=t.get(D);Q.shadowIntensity=q.intensity,Q.shadowBias=q.bias,Q.shadowNormalBias=q.normalBias,Q.shadowRadius=q.radius,Q.shadowMapSize=q.mapSize,Q.shadowCameraNear=q.camera.near,Q.shadowCameraFar=q.camera.far,n.pointShadow[f]=Q,n.pointShadowMap[f]=Z,n.pointShadowMatrix[f]=D.shadow.matrix,S++}n.point[f]=I,f++}else if(D.isHemisphereLight){const I=e.get(D);I.skyColor.copy(D.color).multiplyScalar(W),I.groundColor.copy(D.groundColor).multiplyScalar(W),n.hemi[M]=I,M++}}C>0&&(i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=ue.LTC_FLOAT_1,n.rectAreaLTC2=ue.LTC_FLOAT_2):(n.rectAreaLTC1=ue.LTC_HALF_1,n.rectAreaLTC2=ue.LTC_HALF_2)),n.ambient[0]=h,n.ambient[1]=p,n.ambient[2]=d;const T=n.hash;(T.sunLength!==v||T.directionalLength!==u||T.pointLength!==f||T.spotLength!==w||T.rectAreaLength!==C||T.hemiLength!==M||T.numSunShadows!==g||T.numDirectionalShadows!==x||T.numPointShadows!==S||T.numSpotShadows!==R||T.numSpotMaps!==_||T.numLightProbes!==L)&&(n.sun.length=v,n.directional.length=u,n.spot.length=w,n.rectArea.length=C,n.point.length=f,n.hemi.length=M,n.sunShadow.length=g,n.sunShadowMap.length=g,n.sunShadowMatrix.length=m,n.sunShadowCascade.length=m,n.directionalShadow.length=x,n.directionalShadowMap.length=x,n.directionalShadowMatrix.length=x,n.pointShadow.length=S,n.pointShadowMap.length=S,n.pointShadowMatrix.length=S,n.spotShadow.length=R,n.spotShadowMap.length=R,n.spotLightMatrix.length=R+_-E,n.spotLightMap.length=_,n.numSpotLightShadowsWithMaps=E,n.numLightProbes=L,T.sunLength=v,T.directionalLength=u,T.pointLength=f,T.spotLength=w,T.rectAreaLength=C,T.hemiLength=M,T.numSunShadows=g,T.numDirectionalShadows=x,T.numPointShadows=S,T.numSpotShadows=R,T.numSpotMaps=_,T.numLightProbes=L,n.version=Vp++)}function c(l,h){let p=0,d=0,v=0,g=0,m=0,u=0;const f=h.matrixWorldInverse;for(let w=0,C=l.length;w<C;w++){const M=l[w];if(M.isSunLight){const x=n.sun[p];x.direction.setFromMatrixPosition(M.matrixWorld),x.direction.transformDirection(f),p++}else if(M.isDirectionalLight){const x=n.directional[d];x.direction.setFromMatrixPosition(M.matrixWorld),r.setFromMatrixPosition(M.target.matrixWorld),x.direction.sub(r),x.direction.transformDirection(f),d++}else if(M.isSpotLight){const x=n.spot[g];x.position.setFromMatrixPosition(M.matrixWorld),x.position.applyMatrix4(f),x.direction.setFromMatrixPosition(M.matrixWorld),r.setFromMatrixPosition(M.target.matrixWorld),x.direction.sub(r),x.direction.transformDirection(f),g++}else if(M.isRectAreaLight){const x=n.rectArea[m];x.position.setFromMatrixPosition(M.matrixWorld),x.position.applyMatrix4(f),s.identity(),a.copy(M.matrixWorld),a.premultiply(f),s.extractRotation(a),x.halfWidth.set(M.width*.5,0,0),x.halfHeight.set(0,M.height*.5,0),x.halfWidth.applyMatrix4(s),x.halfHeight.applyMatrix4(s),m++}else if(M.isPointLight){const x=n.point[v];x.position.setFromMatrixPosition(M.matrixWorld),x.position.applyMatrix4(f),v++}else if(M.isHemisphereLight){const x=n.hemi[u];x.direction.setFromMatrixPosition(M.matrixWorld),x.direction.transformDirection(f),u++}}}return{setup:o,setupView:c,state:n}}function hl(i){const e=new Wp(i),t=[],n=[],r=[];function a(d){p.camera=d,t.length=0,n.length=0,r.length=0}function s(d){t.push(d)}function o(d){n.push(d)}function c(d){r.push(d)}function l(){e.setup(t)}function h(d){e.setupView(t,d)}const p={lightsArray:t,shadowsArray:n,lightProbeGridArray:r,camera:null,lights:e,transmissionRenderTarget:{},textureUnits:0};return{init:a,state:p,setupLights:l,setupLightsView:h,pushLight:s,pushShadow:o,pushLightProbeGrid:c}}function Xp(i){let e=new WeakMap;function t(r,a=0){const s=e.get(r);let o;return s===void 0?(o=new hl(i),e.set(r,[o])):a>=s.length?(o=new hl(i),s.push(o)):o=s[a],o}function n(){e=new WeakMap}return{get:t,dispose:n}}const jp=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,qp=`uniform sampler2D shadow_pass;
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
}`,Yp=[new O(1,0,0),new O(-1,0,0),new O(0,1,0),new O(0,-1,0),new O(0,0,1),new O(0,0,-1)],$p=[new O(0,-1,0),new O(0,-1,0),new O(0,0,1),new O(0,0,-1),new O(0,-1,0),new O(0,-1,0)],dl=new pe,Bi=new O,za=new O;function Kp(i,e,t){let n=new tc;const r=new Ve,a=new Ve,s=new nt,o=new su,c=new ou,l={},h=t.maxTextureSize,p={[Fn]:Ft,[Ft]:Fn,[cn]:cn},d=new mn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Ve},radius:{value:4}},vertexShader:jp,fragmentShader:qp}),v=d.clone();v.defines.HORIZONTAL_PASS=1;const g=new nn;g.setAttribute("position",new jt(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const m=new Gt(g,d),u=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Dr;let f=this.type;this.render=function(S,R,_){if(u.enabled===!1||u.autoUpdate===!1&&u.needsUpdate===!1||S.length===0)return;this.type===Uc&&(Ce("WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead."),this.type=Dr);const E=i.getRenderTarget(),L=i.getActiveCubeFace(),T=i.getActiveMipmapLevel(),P=i.state;P.setBlending(dn),P.buffers.depth.getReversed()===!0?P.buffers.color.setClear(0,0,0,0):P.buffers.color.setClear(1,1,1,1),P.buffers.depth.setTest(!0),P.setScissorTest(!1);const U=f!==this.type;U&&R.traverse(function(D){D.material&&(Array.isArray(D.material)?D.material.forEach(z=>z.needsUpdate=!0):D.material.needsUpdate=!0)});for(let D=0,z=S.length;D<z;D++){const W=S[D],j=W.shadow;if(j===void 0){Ce("WebGLShadowMap:",W,"has no shadow.");continue}if(j.autoUpdate===!1&&j.needsUpdate===!1)continue;r.copy(j.mapSize);const Z=j.getFrameExtents();r.multiply(Z),a.copy(j.mapSize),(r.x>h||r.y>h)&&(r.x>h&&(a.x=Math.floor(h/Z.x),r.x=a.x*Z.x,j.mapSize.x=a.x),r.y>h&&(a.y=Math.floor(h/Z.y),r.y=a.y*Z.y,j.mapSize.y=a.y));const I=i.state.buffers.depth.getReversed();if(j.camera._reversedDepth=I,j.map===null||U===!0){if(j.map!==null&&(j.map.depthTexture!==null&&(j.map.depthTexture.dispose(),j.map.depthTexture=null),j.map.dispose()),this.type===ki){if(W.isPointLight){Ce("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}j.map=new Ut(r.x,r.y,{format:Kn,type:pn,minFilter:wt,magFilter:wt,generateMipmaps:!1}),j.map.texture.name=W.name+".shadowMap",j.map.depthTexture=new Jn(r.x,r.y,Lt),j.map.depthTexture.name=W.name+".shadowMapDepth",j.map.depthTexture.format=Rn,j.map.depthTexture.compareFunction=null,j.map.depthTexture.minFilter=gt,j.map.depthTexture.magFilter=gt}else W.isPointLight?(j.map=new lc(r.x),j.map.depthTexture=new tu(r.x,qt)):(j.map=new Ut(r.x,r.y),j.map.depthTexture=new Jn(r.x,r.y,qt)),j.map.depthTexture.name=W.name+".shadowMap",j.map.depthTexture.format=Rn,this.type===Dr?(j.map.depthTexture.compareFunction=I?Ks:ia,j.map.depthTexture.minFilter=wt,j.map.depthTexture.magFilter=wt):(j.map.depthTexture.compareFunction=null,j.map.depthTexture.minFilter=gt,j.map.depthTexture.magFilter=gt);j.camera.updateProjectionMatrix()}j.map.isWebGLCubeRenderTarget!==!0&&(j.map.width!==r.x||j.map.height!==r.y)&&j.map.setSize(r.x,r.y);const q=j.map.isWebGLCubeRenderTarget?6:j.getViewportCount();W.isPointLight!==!0&&j.updateMatrices(W,_);for(let Q=0;Q<q;Q++){const Me=j.getCamera(Q);if(W.isPointLight){const we=j.camera,Ze=j.matrix,Fe=W.distance||we.far;Fe!==we.far&&(we.far=Fe,we.updateProjectionMatrix()),Bi.setFromMatrixPosition(W.matrixWorld),we.position.copy(Bi),za.copy(we.position),za.add(Yp[Q]),we.up.copy($p[Q]),we.lookAt(za),we.updateMatrixWorld(),Ze.makeTranslation(-Bi.x,-Bi.y,-Bi.z),dl.multiplyMatrices(we.projectionMatrix,we.matrixWorldInverse),j._frustum.setFromProjectionMatrix(dl,we.coordinateSystem,we.reversedDepth)}if(j.map.isWebGLCubeRenderTarget)i.setRenderTarget(j.map,Q),i.clear();else{Q===0&&(i.setRenderTarget(j.map),i.clear());const we=j.getViewport(Q);s.set(a.x*we.x,a.y*we.y,a.x*we.z,a.y*we.w),P.viewport(s)}n=j.getFrustum(Q),M(R,_,Me,W,this.type)}j.isPointLightShadow!==!0&&this.type===ki&&w(j,_),j.needsUpdate=!1}f=this.type,u.needsUpdate=!1,i.setRenderTarget(E,L,T)};function w(S,R){const _=e.update(m);d.defines.VSM_SAMPLES!==S.blurSamples&&(d.defines.VSM_SAMPLES=S.blurSamples,v.defines.VSM_SAMPLES=S.blurSamples,d.needsUpdate=!0,v.needsUpdate=!0),S.mapPass===null?S.mapPass=new Ut(r.x,r.y,{format:Kn,type:pn}):(S.mapPass.width!==S.map.width||S.mapPass.height!==S.map.height)&&S.mapPass.setSize(S.map.width,S.map.height),d.uniforms.shadow_pass.value=S.map.depthTexture,d.uniforms.resolution.value.set(S.map.width,S.map.height),d.uniforms.radius.value=S.radius,i.setRenderTarget(S.mapPass),i.clear(),i.renderBufferDirect(R,null,_,d,m,null),v.uniforms.shadow_pass.value=S.mapPass.texture,v.uniforms.resolution.value.set(S.map.width,S.map.height),v.uniforms.radius.value=S.radius,i.setRenderTarget(S.map),i.clear(),i.renderBufferDirect(R,null,_,v,m,null)}function C(S,R,_,E){let L=null;const T=_.isPointLight===!0?S.customDistanceMaterial:S.customDepthMaterial;if(T!==void 0)L=T;else if(L=_.isPointLight===!0?c:o,i.localClippingEnabled&&R.clipShadows===!0&&Array.isArray(R.clippingPlanes)&&R.clippingPlanes.length!==0||R.displacementMap&&R.displacementScale!==0||R.alphaMap&&R.alphaTest>0||R.map&&R.alphaTest>0||R.alphaToCoverage===!0){const P=L.uuid,U=R.uuid;let D=l[P];D===void 0&&(D={},l[P]=D);let z=D[U];z===void 0&&(z=L.clone(),D[U]=z,R.addEventListener("dispose",x)),L=z}if(L.visible=R.visible,L.wireframe=R.wireframe,E===ki?L.side=R.shadowSide!==null?R.shadowSide:R.side:L.side=R.shadowSide!==null?R.shadowSide:p[R.side],L.alphaMap=R.alphaMap,L.alphaTest=R.alphaToCoverage===!0?.5:R.alphaTest,L.map=R.map,L.clipShadows=R.clipShadows,L.clippingPlanes=R.clippingPlanes,L.clipIntersection=R.clipIntersection,L.displacementMap=R.displacementMap,L.displacementScale=R.displacementScale,L.displacementBias=R.displacementBias,L.wireframeLinewidth=R.wireframeLinewidth,L.linewidth=R.linewidth,_.isPointLight===!0&&L.isMeshDistanceMaterial===!0){const P=i.properties.get(L);P.light=_}return L}function M(S,R,_,E,L){if(S.visible===!1)return;if(S.layers.test(R.layers)&&(S.isMesh||S.isLine||S.isPoints)&&(S.castShadow||S.receiveShadow&&L===ki)&&(!S.frustumCulled||S.intersectsFrustum(n))){S.modelViewMatrix.multiplyMatrices(_.matrixWorldInverse,S.matrixWorld);const U=e.update(S),D=S.material;if(Array.isArray(D)){const z=U.groups;for(let W=0,j=z.length;W<j;W++){const Z=z[W],I=D[Z.materialIndex];if(I&&I.visible){const q=C(S,I,E,L);S.onBeforeShadow(i,S,R,_,U,q,Z),i.renderBufferDirect(_,null,U,q,S,Z),S.onAfterShadow(i,S,R,_,U,q,Z)}}}else if(D.visible){const z=C(S,D,E,L);S.onBeforeShadow(i,S,R,_,U,z,null),i.renderBufferDirect(_,null,U,z,S,null),S.onAfterShadow(i,S,R,_,U,z,null)}}const P=S.children;for(let U=0,D=P.length;U<D;U++)M(P[U],R,_,E,L)}function x(S){S.target.removeEventListener("dispose",x);for(const _ in l){const E=l[_],L=S.target.uuid;L in E&&(E[L].dispose(),delete E[L])}}}function Zp(i,e){function t(){let F=!1;const oe=new nt;let J=null;const le=new nt(0,0,0,0);return{setMask:function(fe){J!==fe&&!F&&(i.colorMask(fe,fe,fe,fe),J=fe)},setLocked:function(fe){F=fe},setClear:function(fe,ne,Te,be,at){at===!0&&(fe*=be,ne*=be,Te*=be),oe.set(fe,ne,Te,be),le.equals(oe)===!1&&(i.clearColor(fe,ne,Te,be),le.copy(oe))},reset:function(){F=!1,J=null,le.set(-1,0,0,0)}}}function n(){let F=!1,oe=!1,J=null,le=null,fe=null;return{setReversed:function(ne){if(oe!==ne){const Te=e.get("EXT_clip_control");ne?Te.clipControlEXT(Te.LOWER_LEFT_EXT,Te.ZERO_TO_ONE_EXT):Te.clipControlEXT(Te.LOWER_LEFT_EXT,Te.NEGATIVE_ONE_TO_ONE_EXT),oe=ne;const be=fe;fe=null,this.setClear(be)}},getReversed:function(){return oe},setTest:function(ne){ne?ee(i.DEPTH_TEST):_e(i.DEPTH_TEST)},setMask:function(ne){J!==ne&&!F&&(i.depthMask(ne),J=ne)},setFunc:function(ne){if(oe&&(ne=f0[ne]),le!==ne){switch(ne){case Ka:i.depthFunc(i.NEVER);break;case Za:i.depthFunc(i.ALWAYS);break;case Ja:i.depthFunc(i.LESS);break;case Yi:i.depthFunc(i.LEQUAL);break;case Qa:i.depthFunc(i.EQUAL);break;case es:i.depthFunc(i.GEQUAL);break;case ts:i.depthFunc(i.GREATER);break;case ns:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}le=ne}},setLocked:function(ne){F=ne},setClear:function(ne){fe!==ne&&(fe=ne,oe&&(ne=1-ne),i.clearDepth(ne))},reset:function(){F=!1,J=null,le=null,fe=null,oe=!1}}}function r(){let F=!1,oe=null,J=null,le=null,fe=null,ne=null,Te=null,be=null,at=null;return{setTest:function(Ye){F||(Ye?ee(i.STENCIL_TEST):_e(i.STENCIL_TEST))},setMask:function(Ye){oe!==Ye&&!F&&(i.stencilMask(Ye),oe=Ye)},setFunc:function(Ye,Yt,rn){(J!==Ye||le!==Yt||fe!==rn)&&(i.stencilFunc(Ye,Yt,rn),J=Ye,le=Yt,fe=rn)},setOp:function(Ye,Yt,rn){(ne!==Ye||Te!==Yt||be!==rn)&&(i.stencilOp(Ye,Yt,rn),ne=Ye,Te=Yt,be=rn)},setLocked:function(Ye){F=Ye},setClear:function(Ye){at!==Ye&&(i.clearStencil(Ye),at=Ye)},reset:function(){F=!1,oe=null,J=null,le=null,fe=null,ne=null,Te=null,be=null,at=null}}}const a=new t,s=new n,o=new r,c=new WeakMap,l=new WeakMap;let h={},p={},d={},v=new WeakMap,g=[],m=null,u=!1,f=null,w=null,C=null,M=null,x=null,S=null,R=null,_=new qe(0,0,0),E=0,L=!1,T=null,P=null,U=null,D=null,z=null;const W=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let j=!1,Z=0;const I=i.getParameter(i.VERSION);I.indexOf("WebGL")!==-1?(Z=parseFloat(/^WebGL (\d)/.exec(I)[1]),j=Z>=1):I.indexOf("OpenGL ES")!==-1&&(Z=parseFloat(/^OpenGL ES (\d)/.exec(I)[1]),j=Z>=2);let q=null,Q={};const Me=i.getParameter(i.SCISSOR_BOX),we=i.getParameter(i.VIEWPORT),Ze=new nt().fromArray(Me),Fe=new nt().fromArray(we);function He(F,oe,J,le){const fe=new Uint8Array(4),ne=i.createTexture();i.bindTexture(F,ne),i.texParameteri(F,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(F,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let Te=0;Te<J;Te++)F===i.TEXTURE_3D||F===i.TEXTURE_2D_ARRAY?i.texImage3D(oe,0,i.RGBA,1,1,le,0,i.RGBA,i.UNSIGNED_BYTE,fe):i.texImage2D(oe+Te,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,fe);return ne}const Y={};Y[i.TEXTURE_2D]=He(i.TEXTURE_2D,i.TEXTURE_2D,1),Y[i.TEXTURE_CUBE_MAP]=He(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),Y[i.TEXTURE_2D_ARRAY]=He(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),Y[i.TEXTURE_3D]=He(i.TEXTURE_3D,i.TEXTURE_3D,1,1),a.setClear(0,0,0,1),s.setClear(1),o.setClear(0),ee(i.DEPTH_TEST),s.setFunc(Yi),ze(!1),lt(_o),ee(i.CULL_FACE),Xe(dn);function ee(F){h[F]!==!0&&(i.enable(F),h[F]=!0)}function _e(F){h[F]!==!1&&(i.disable(F),h[F]=!1)}function Le(F,oe){return d[F]!==oe?(i.bindFramebuffer(F,oe),d[F]=oe,F===i.DRAW_FRAMEBUFFER&&(d[i.FRAMEBUFFER]=oe),F===i.FRAMEBUFFER&&(d[i.DRAW_FRAMEBUFFER]=oe),!0):!1}function ve(F,oe){let J=g,le=!1;if(F){J=v.get(oe),J===void 0&&(J=[],v.set(oe,J));const fe=F.textures;if(J.length!==fe.length||J[0]!==i.COLOR_ATTACHMENT0){for(let ne=0,Te=fe.length;ne<Te;ne++)J[ne]=i.COLOR_ATTACHMENT0+ne;J.length=fe.length,le=!0}}else J[0]!==i.BACK&&(J[0]=i.BACK,le=!0);le&&i.drawBuffers(J)}function Ne(F){return m!==F?(i.useProgram(F),m=F,!0):!1}const mt={[xi]:i.FUNC_ADD,[Nc]:i.FUNC_SUBTRACT,[Fc]:i.FUNC_REVERSE_SUBTRACT};mt[Bc]=i.MIN,mt[Oc]=i.MAX;const Be={[zc]:i.ZERO,[kc]:i.ONE,[Gc]:i.SRC_COLOR,[Pl]:i.SRC_ALPHA,[qc]:i.SRC_ALPHA_SATURATE,[Xc]:i.DST_COLOR,[Hc]:i.DST_ALPHA,[Vc]:i.ONE_MINUS_SRC_COLOR,[Dl]:i.ONE_MINUS_SRC_ALPHA,[jc]:i.ONE_MINUS_DST_COLOR,[Wc]:i.ONE_MINUS_DST_ALPHA,[Yc]:i.CONSTANT_COLOR,[$c]:i.ONE_MINUS_CONSTANT_COLOR,[Kc]:i.CONSTANT_ALPHA,[Zc]:i.ONE_MINUS_CONSTANT_ALPHA};function Xe(F,oe,J,le,fe,ne,Te,be,at,Ye){if(F===dn){u===!0&&(_e(i.BLEND),u=!1);return}if(u===!1&&(ee(i.BLEND),u=!0),F!==Ic){if(F!==f||Ye!==L){if((w!==xi||x!==xi)&&(i.blendEquation(i.FUNC_ADD),w=xi,x=xi),Ye)switch(F){case Hi:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case yo:i.blendFunc(i.ONE,i.ONE);break;case xo:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case bo:i.blendFuncSeparate(i.DST_COLOR,i.ONE_MINUS_SRC_ALPHA,i.ZERO,i.ONE);break;default:je("WebGLState: Invalid blending: ",F);break}else switch(F){case Hi:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case yo:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE,i.ONE,i.ONE);break;case xo:je("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case bo:je("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:je("WebGLState: Invalid blending: ",F);break}C=null,M=null,S=null,R=null,_.set(0,0,0),E=0,f=F,L=Ye}return}fe=fe||oe,ne=ne||J,Te=Te||le,(oe!==w||fe!==x)&&(i.blendEquationSeparate(mt[oe],mt[fe]),w=oe,x=fe),(J!==C||le!==M||ne!==S||Te!==R)&&(i.blendFuncSeparate(Be[J],Be[le],Be[ne],Be[Te]),C=J,M=le,S=ne,R=Te),(be.equals(_)===!1||at!==E)&&(i.blendColor(be.r,be.g,be.b,at),_.copy(be),E=at),f=F,L=!1}function rt(F,oe){F.side===cn?_e(i.CULL_FACE):ee(i.CULL_FACE);let J=F.side===Ft;oe&&(J=!J),ze(J),F.blending===Hi&&F.transparent===!1?Xe(dn):Xe(F.blending,F.blendEquation,F.blendSrc,F.blendDst,F.blendEquationAlpha,F.blendSrcAlpha,F.blendDstAlpha,F.blendColor,F.blendAlpha,F.premultipliedAlpha),s.setFunc(F.depthFunc),s.setTest(F.depthTest),s.setMask(F.depthWrite),a.setMask(F.colorWrite);const le=F.stencilWrite;o.setTest(le),le&&(o.setMask(F.stencilWriteMask),o.setFunc(F.stencilFunc,F.stencilRef,F.stencilFuncMask),o.setOp(F.stencilFail,F.stencilZFail,F.stencilZPass)),It(F.polygonOffset,F.polygonOffsetFactor,F.polygonOffsetUnits),F.alphaToCoverage===!0?ee(i.SAMPLE_ALPHA_TO_COVERAGE):_e(i.SAMPLE_ALPHA_TO_COVERAGE)}function ze(F){T!==F&&(F?i.frontFace(i.CW):i.frontFace(i.CCW),T=F)}function lt(F){F!==Pc?(ee(i.CULL_FACE),F!==P&&(F===_o?i.cullFace(i.BACK):F===Dc?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):_e(i.CULL_FACE),P=F}function xt(F){F!==U&&(j&&i.lineWidth(F),U=F)}function It(F,oe,J){F?(ee(i.POLYGON_OFFSET_FILL),(D!==oe||z!==J)&&(D=oe,z=J,s.getReversed()&&(oe=-oe),i.polygonOffset(oe,J))):_e(i.POLYGON_OFFSET_FILL)}function ct(F){F?ee(i.SCISSOR_TEST):_e(i.SCISSOR_TEST)}function ht(F){F===void 0&&(F=i.TEXTURE0+W-1),q!==F&&(i.activeTexture(F),q=F)}function B(F,oe,J){J===void 0&&(q===null?J=i.TEXTURE0+W-1:J=q);let le=Q[J];le===void 0&&(le={type:void 0,texture:void 0},Q[J]=le),(le.type!==F||le.texture!==oe)&&(q!==J&&(i.activeTexture(J),q=J),i.bindTexture(F,oe||Y[F]),le.type=F,le.texture=oe)}function St(){const F=Q[q];F!==void 0&&F.type!==void 0&&(i.bindTexture(F.type,null),F.type=void 0,F.texture=void 0)}function Je(){try{i.compressedTexImage2D(...arguments)}catch(F){je("WebGLState:",F)}}function A(){try{i.compressedTexImage3D(...arguments)}catch(F){je("WebGLState:",F)}}function y(){try{i.texSubImage2D(...arguments)}catch(F){je("WebGLState:",F)}}function k(){try{i.texSubImage3D(...arguments)}catch(F){je("WebGLState:",F)}}function H(){try{i.compressedTexSubImage2D(...arguments)}catch(F){je("WebGLState:",F)}}function $(){try{i.compressedTexSubImage3D(...arguments)}catch(F){je("WebGLState:",F)}}function ie(){try{i.texStorage2D(...arguments)}catch(F){je("WebGLState:",F)}}function re(){try{i.texStorage3D(...arguments)}catch(F){je("WebGLState:",F)}}function K(){try{i.texImage2D(...arguments)}catch(F){je("WebGLState:",F)}}function te(){try{i.texImage3D(...arguments)}catch(F){je("WebGLState:",F)}}function ae(F){return p[F]!==void 0?p[F]:i.getParameter(F)}function Ee(F,oe){p[F]!==oe&&(i.pixelStorei(F,oe),p[F]=oe)}function ce(F){Ze.equals(F)===!1&&(i.scissor(F.x,F.y,F.z,F.w),Ze.copy(F))}function se(F){Fe.equals(F)===!1&&(i.viewport(F.x,F.y,F.z,F.w),Fe.copy(F))}function Re(F,oe){let J=l.get(oe);J===void 0&&(J=new WeakMap,l.set(oe,J));let le=J.get(F);le===void 0&&(le=i.getUniformBlockIndex(oe,F.name),J.set(F,le))}function Ae(F,oe){const le=l.get(oe).get(F);c.get(oe)!==le&&(i.uniformBlockBinding(oe,le,F.__bindingPointIndex),c.set(oe,le))}function De(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),s.setReversed(!1),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),i.pixelStorei(i.PACK_ALIGNMENT,4),i.pixelStorei(i.UNPACK_ALIGNMENT,4),i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,!1),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,i.BROWSER_DEFAULT_WEBGL),i.pixelStorei(i.PACK_ROW_LENGTH,0),i.pixelStorei(i.PACK_SKIP_PIXELS,0),i.pixelStorei(i.PACK_SKIP_ROWS,0),i.pixelStorei(i.UNPACK_ROW_LENGTH,0),i.pixelStorei(i.UNPACK_IMAGE_HEIGHT,0),i.pixelStorei(i.UNPACK_SKIP_PIXELS,0),i.pixelStorei(i.UNPACK_SKIP_ROWS,0),i.pixelStorei(i.UNPACK_SKIP_IMAGES,0),h={},p={},q=null,Q={},d={},v=new WeakMap,g=[],m=null,u=!1,f=null,w=null,C=null,M=null,x=null,S=null,R=null,_=new qe(0,0,0),E=0,L=!1,T=null,P=null,U=null,D=null,z=null,Ze.set(0,0,i.canvas.width,i.canvas.height),Fe.set(0,0,i.canvas.width,i.canvas.height),a.reset(),s.reset(),o.reset()}return{buffers:{color:a,depth:s,stencil:o},enable:ee,disable:_e,bindFramebuffer:Le,drawBuffers:ve,useProgram:Ne,setBlending:Xe,setMaterial:rt,setFlipSided:ze,setCullFace:lt,setLineWidth:xt,setPolygonOffset:It,setScissorTest:ct,activeTexture:ht,bindTexture:B,unbindTexture:St,compressedTexImage2D:Je,compressedTexImage3D:A,texImage2D:K,texImage3D:te,pixelStorei:Ee,getParameter:ae,updateUBOMapping:Re,uniformBlockBinding:Ae,texStorage2D:ie,texStorage3D:re,texSubImage2D:y,texSubImage3D:k,compressedTexSubImage2D:H,compressedTexSubImage3D:$,scissor:ce,viewport:se,reset:De}}function Jp(i,e,t,n,r,a,s){const o=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,c=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),l=new Ve,h=new WeakMap,p=new Set;let d;const v=new WeakMap;let g=!1;try{g=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function m(A,y){return g?new OffscreenCanvas(A,y):Xr("canvas")}function u(A,y,k){let H=1;const $=Je(A);if(($.width>k||$.height>k)&&(H=k/Math.max($.width,$.height)),H<1)if(typeof HTMLImageElement<"u"&&A instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&A instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&A instanceof ImageBitmap||typeof VideoFrame<"u"&&A instanceof VideoFrame){const ie=Math.floor(H*$.width),re=Math.floor(H*$.height);d===void 0&&(d=m(ie,re));const K=y?m(ie,re):d;return K.width=ie,K.height=re,K.getContext("2d").drawImage(A,0,0,ie,re),Ce("WebGLRenderer: Texture has been resized from ("+$.width+"x"+$.height+") to ("+ie+"x"+re+")."),K}else return"data"in A&&Ce("WebGLRenderer: Image in DataTexture is too big ("+$.width+"x"+$.height+")."),A;return A}function f(A){return A.generateMipmaps}function w(A){i.generateMipmap(A)}function C(A){return A.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:A.isWebGL3DRenderTarget?i.TEXTURE_3D:A.isWebGLArrayRenderTarget||A.isCompressedArrayTexture?i.TEXTURE_2D_ARRAY:i.TEXTURE_2D}function M(A,y,k,H,$,ie=!1){if(A!==null){if(i[A]!==void 0)return i[A];Ce("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+A+"'")}let re;H&&(re=e.get("EXT_texture_norm16"),re||Ce("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let K=y;if(y===i.RED&&(k===i.FLOAT&&(K=i.R32F),k===i.HALF_FLOAT&&(K=i.R16F),k===i.UNSIGNED_BYTE&&(K=i.R8),k===i.UNSIGNED_SHORT&&re&&(K=re.R16_EXT),k===i.SHORT&&re&&(K=re.R16_SNORM_EXT)),y===i.RED_INTEGER&&(k===i.UNSIGNED_BYTE&&(K=i.R8UI),k===i.UNSIGNED_SHORT&&(K=i.R16UI),k===i.UNSIGNED_INT&&(K=i.R32UI),k===i.BYTE&&(K=i.R8I),k===i.SHORT&&(K=i.R16I),k===i.INT&&(K=i.R32I)),y===i.RG&&(k===i.FLOAT&&(K=i.RG32F),k===i.HALF_FLOAT&&(K=i.RG16F),k===i.UNSIGNED_BYTE&&(K=i.RG8),k===i.UNSIGNED_SHORT&&re&&(K=re.RG16_EXT),k===i.SHORT&&re&&(K=re.RG16_SNORM_EXT)),y===i.RG_INTEGER&&(k===i.UNSIGNED_BYTE&&(K=i.RG8UI),k===i.UNSIGNED_SHORT&&(K=i.RG16UI),k===i.UNSIGNED_INT&&(K=i.RG32UI),k===i.BYTE&&(K=i.RG8I),k===i.SHORT&&(K=i.RG16I),k===i.INT&&(K=i.RG32I)),y===i.RGB_INTEGER&&(k===i.UNSIGNED_BYTE&&(K=i.RGB8UI),k===i.UNSIGNED_SHORT&&(K=i.RGB16UI),k===i.UNSIGNED_INT&&(K=i.RGB32UI),k===i.BYTE&&(K=i.RGB8I),k===i.SHORT&&(K=i.RGB16I),k===i.INT&&(K=i.RGB32I)),y===i.RGBA_INTEGER&&(k===i.UNSIGNED_BYTE&&(K=i.RGBA8UI),k===i.UNSIGNED_SHORT&&(K=i.RGBA16UI),k===i.UNSIGNED_INT&&(K=i.RGBA32UI),k===i.BYTE&&(K=i.RGBA8I),k===i.SHORT&&(K=i.RGBA16I),k===i.INT&&(K=i.RGBA32I)),y===i.RGB&&(k===i.UNSIGNED_SHORT&&re&&(K=re.RGB16_EXT),k===i.SHORT&&re&&(K=re.RGB16_SNORM_EXT),k===i.UNSIGNED_INT_5_9_9_9_REV&&(K=i.RGB9_E5),k===i.UNSIGNED_INT_10F_11F_11F_REV&&(K=i.R11F_G11F_B10F)),y===i.RGBA){const te=ie?Hr:Ge.getTransfer($);k===i.FLOAT&&(K=i.RGBA32F),k===i.HALF_FLOAT&&(K=i.RGBA16F),k===i.UNSIGNED_BYTE&&(K=te===Qe?i.SRGB8_ALPHA8:i.RGBA8),k===i.UNSIGNED_SHORT&&re&&(K=re.RGBA16_EXT),k===i.SHORT&&re&&(K=re.RGBA16_SNORM_EXT),k===i.UNSIGNED_SHORT_4_4_4_4&&(K=i.RGBA4),k===i.UNSIGNED_SHORT_5_5_5_1&&(K=i.RGB5_A1)}return(K===i.R16F||K===i.R32F||K===i.RG16F||K===i.RG32F||K===i.RGBA16F||K===i.RGBA32F)&&e.get("EXT_color_buffer_float"),K}function x(A,y){let k;return A?y===null||y===qt||y===Ki?k=i.DEPTH24_STENCIL8:y===Lt?k=i.DEPTH32F_STENCIL8:y===$i&&(k=i.DEPTH24_STENCIL8,Ce("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):y===null||y===qt||y===Ki?k=i.DEPTH_COMPONENT24:y===Lt?k=i.DEPTH_COMPONENT32F:y===$i&&(k=i.DEPTH_COMPONENT16),k}function S(A,y){return f(A)===!0||A.isFramebufferTexture&&A.minFilter!==gt&&A.minFilter!==wt?Math.log2(Math.max(y.width,y.height))+1:A.mipmaps!==void 0&&A.mipmaps.length>0?A.mipmaps.length:A.isCompressedTexture&&Array.isArray(A.image)?y.mipmaps.length:1}function R(A){const y=A.target;y.removeEventListener("dispose",R),E(y),y.isVideoTexture&&h.delete(y),y.isHTMLTexture&&p.delete(y)}function _(A){const y=A.target;y.removeEventListener("dispose",_),T(y)}function E(A){const y=n.get(A);if(y.__webglInit===void 0)return;const k=A.source,H=v.get(k);if(H){const $=H[y.__cacheKey];$.usedTimes--,$.usedTimes===0&&L(A),Object.keys(H).length===0&&v.delete(k)}n.remove(A)}function L(A){const y=n.get(A);i.deleteTexture(y.__webglTexture);const k=A.source,H=v.get(k);delete H[y.__cacheKey],s.memory.textures--}function T(A){const y=n.get(A);if(A.depthTexture&&(A.depthTexture.dispose(),n.remove(A.depthTexture)),A.isWebGLCubeRenderTarget)for(let H=0;H<6;H++){if(Array.isArray(y.__webglFramebuffer[H]))for(let $=0;$<y.__webglFramebuffer[H].length;$++)i.deleteFramebuffer(y.__webglFramebuffer[H][$]);else i.deleteFramebuffer(y.__webglFramebuffer[H]);y.__webglDepthbuffer&&i.deleteRenderbuffer(y.__webglDepthbuffer[H])}else{if(Array.isArray(y.__webglFramebuffer))for(let H=0;H<y.__webglFramebuffer.length;H++)i.deleteFramebuffer(y.__webglFramebuffer[H]);else i.deleteFramebuffer(y.__webglFramebuffer);if(y.__webglDepthbuffer&&i.deleteRenderbuffer(y.__webglDepthbuffer),y.__webglMultisampledFramebuffer&&i.deleteFramebuffer(y.__webglMultisampledFramebuffer),y.__webglColorRenderbuffer)for(let H=0;H<y.__webglColorRenderbuffer.length;H++)y.__webglColorRenderbuffer[H]&&i.deleteRenderbuffer(y.__webglColorRenderbuffer[H]);y.__webglDepthRenderbuffer&&i.deleteRenderbuffer(y.__webglDepthRenderbuffer)}const k=A.textures;for(let H=0,$=k.length;H<$;H++){const ie=n.get(k[H]);ie.__webglTexture&&(i.deleteTexture(ie.__webglTexture),s.memory.textures--),n.remove(k[H])}n.remove(A)}let P=0;function U(){P=0}function D(){return P}function z(A){P=A}function W(){const A=P;return A>=r.maxTextures&&Ce("WebGLTextures: Trying to use "+(A+1)+" texture units while this GPU supports only "+r.maxTextures),P+=1,A}function j(A){const y=[];return y.push(A.wrapS),y.push(A.wrapT),y.push(A.wrapR||0),y.push(A.magFilter),y.push(A.minFilter),y.push(A.anisotropy),y.push(A.internalFormat),y.push(A.format),y.push(A.type),y.push(A.generateMipmaps),y.push(A.premultiplyAlpha),y.push(A.flipY),y.push(A.unpackAlignment),y.push(A.colorSpace),y.join()}function Z(A,y){const k=n.get(A);if(A.isVideoTexture&&B(A),A.isRenderTargetTexture===!1&&A.isExternalTexture!==!0&&A.version>0&&k.__version!==A.version){const H=A.image;if(H===null)Ce("WebGLRenderer: Texture marked for update but no image data found.");else if(H.complete===!1)Ce("WebGLRenderer: Texture marked for update but image is incomplete");else{_e(k,A,y);return}}else A.isExternalTexture&&(k.__webglTexture=A.sourceTexture?A.sourceTexture:null);t.bindTexture(i.TEXTURE_2D,k.__webglTexture,i.TEXTURE0+y)}function I(A,y){const k=n.get(A);if(A.isRenderTargetTexture===!1&&A.version>0&&k.__version!==A.version){_e(k,A,y);return}else A.isExternalTexture&&(k.__webglTexture=A.sourceTexture?A.sourceTexture:null);t.bindTexture(i.TEXTURE_2D_ARRAY,k.__webglTexture,i.TEXTURE0+y)}function q(A,y){const k=n.get(A);if(A.isRenderTargetTexture===!1&&A.version>0&&k.__version!==A.version){_e(k,A,y);return}t.bindTexture(i.TEXTURE_3D,k.__webglTexture,i.TEXTURE0+y)}function Q(A,y){const k=n.get(A);if(A.isCubeDepthTexture!==!0&&A.version>0&&k.__version!==A.version){Le(k,A,y);return}t.bindTexture(i.TEXTURE_CUBE_MAP,k.__webglTexture,i.TEXTURE0+y)}const Me={[is]:i.REPEAT,[Xt]:i.CLAMP_TO_EDGE,[rs]:i.MIRRORED_REPEAT},we={[gt]:i.NEAREST,[e0]:i.NEAREST_MIPMAP_NEAREST,[ar]:i.NEAREST_MIPMAP_LINEAR,[wt]:i.LINEAR,[ha]:i.LINEAR_MIPMAP_NEAREST,[jn]:i.LINEAR_MIPMAP_LINEAR},Ze={[r0]:i.NEVER,[c0]:i.ALWAYS,[a0]:i.LESS,[ia]:i.LEQUAL,[s0]:i.EQUAL,[Ks]:i.GEQUAL,[o0]:i.GREATER,[l0]:i.NOTEQUAL};function Fe(A,y){if(y.type===Lt&&e.has("OES_texture_float_linear")===!1&&(y.magFilter===wt||y.magFilter===ha||y.magFilter===ar||y.magFilter===jn||y.minFilter===wt||y.minFilter===ha||y.minFilter===ar||y.minFilter===jn)&&Ce("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(A,i.TEXTURE_WRAP_S,Me[y.wrapS]),i.texParameteri(A,i.TEXTURE_WRAP_T,Me[y.wrapT]),(A===i.TEXTURE_3D||A===i.TEXTURE_2D_ARRAY)&&i.texParameteri(A,i.TEXTURE_WRAP_R,Me[y.wrapR]),i.texParameteri(A,i.TEXTURE_MAG_FILTER,we[y.magFilter]),i.texParameteri(A,i.TEXTURE_MIN_FILTER,we[y.minFilter]),y.compareFunction&&(i.texParameteri(A,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(A,i.TEXTURE_COMPARE_FUNC,Ze[y.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(y.magFilter===gt||y.minFilter!==ar&&y.minFilter!==jn||y.type===Lt&&e.has("OES_texture_float_linear")===!1)return;if(y.anisotropy>1||n.get(y).__currentAnisotropy){const k=e.get("EXT_texture_filter_anisotropic");i.texParameterf(A,k.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(y.anisotropy,r.getMaxAnisotropy())),n.get(y).__currentAnisotropy=y.anisotropy}}}function He(A,y){let k=!1;A.__webglInit===void 0&&(A.__webglInit=!0,y.addEventListener("dispose",R));const H=y.source;let $=v.get(H);$===void 0&&($={},v.set(H,$));const ie=j(y);if(ie!==A.__cacheKey){$[ie]===void 0&&($[ie]={texture:i.createTexture(),usedTimes:0},s.memory.textures++,k=!0),$[ie].usedTimes++;const re=$[A.__cacheKey];re!==void 0&&($[A.__cacheKey].usedTimes--,re.usedTimes===0&&L(y)),A.__cacheKey=ie,A.__webglTexture=$[ie].texture}return k}function Y(A,y,k){return Math.floor(Math.floor(A/k)/y)}function ee(A,y,k,H){const ie=A.updateRanges;if(ie.length===0)t.texSubImage2D(i.TEXTURE_2D,0,0,0,y.width,y.height,k,H,y.data);else{ie.sort((Ee,ce)=>Ee.start-ce.start);let re=0;for(let Ee=1;Ee<ie.length;Ee++){const ce=ie[re],se=ie[Ee],Re=ce.start+ce.count,Ae=Y(se.start,y.width,4),De=Y(ce.start,y.width,4);se.start<=Re+1&&Ae===De&&Y(se.start+se.count-1,y.width,4)===Ae?ce.count=Math.max(ce.count,se.start+se.count-ce.start):(++re,ie[re]=se)}ie.length=re+1;const K=t.getParameter(i.UNPACK_ROW_LENGTH),te=t.getParameter(i.UNPACK_SKIP_PIXELS),ae=t.getParameter(i.UNPACK_SKIP_ROWS);t.pixelStorei(i.UNPACK_ROW_LENGTH,y.width);for(let Ee=0,ce=ie.length;Ee<ce;Ee++){const se=ie[Ee],Re=Math.floor(se.start/4),Ae=Math.ceil(se.count/4),De=Re%y.width,F=Math.floor(Re/y.width),oe=Ae,J=1;t.pixelStorei(i.UNPACK_SKIP_PIXELS,De),t.pixelStorei(i.UNPACK_SKIP_ROWS,F),t.texSubImage2D(i.TEXTURE_2D,0,De,F,oe,J,k,H,y.data)}A.clearUpdateRanges(),t.pixelStorei(i.UNPACK_ROW_LENGTH,K),t.pixelStorei(i.UNPACK_SKIP_PIXELS,te),t.pixelStorei(i.UNPACK_SKIP_ROWS,ae)}}function _e(A,y,k){let H=i.TEXTURE_2D;(y.isDataArrayTexture||y.isCompressedArrayTexture)&&(H=i.TEXTURE_2D_ARRAY),y.isData3DTexture&&(H=i.TEXTURE_3D);const $=He(A,y),ie=y.source;t.bindTexture(H,A.__webglTexture,i.TEXTURE0+k);const re=n.get(ie);if(ie.version!==re.__version||$===!0){if(t.activeTexture(i.TEXTURE0+k),(typeof ImageBitmap<"u"&&y.image instanceof ImageBitmap)===!1){const J=Ge.getPrimaries(Ge.workingColorSpace),le=y.colorSpace===bn?null:Ge.getPrimaries(y.colorSpace),fe=y.colorSpace===bn||J===le?i.NONE:i.BROWSER_DEFAULT_WEBGL;t.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,y.flipY),t.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,y.premultiplyAlpha),t.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,fe)}t.pixelStorei(i.UNPACK_ALIGNMENT,y.unpackAlignment);let te=u(y.image,!1,r.maxTextureSize);te=St(y,te);const ae=a.convert(y.format,y.colorSpace),Ee=a.convert(y.type);let ce=M(y.internalFormat,ae,Ee,y.normalized,y.colorSpace,y.isVideoTexture);Fe(H,y);let se;const Re=y.mipmaps,Ae=y.isVideoTexture!==!0,De=re.__version===void 0||$===!0,F=ie.dataReady,oe=S(y,te);if(y.isDepthTexture)ce=x(y.format===qn,y.type),De&&(Ae?t.texStorage2D(i.TEXTURE_2D,1,ce,te.width,te.height):t.texImage2D(i.TEXTURE_2D,0,ce,te.width,te.height,0,ae,Ee,null));else if(y.isDataTexture)if(Re.length>0){Ae&&De&&t.texStorage2D(i.TEXTURE_2D,oe,ce,Re[0].width,Re[0].height);for(let J=0,le=Re.length;J<le;J++)se=Re[J],Ae?F&&t.texSubImage2D(i.TEXTURE_2D,J,0,0,se.width,se.height,ae,Ee,se.data):t.texImage2D(i.TEXTURE_2D,J,ce,se.width,se.height,0,ae,Ee,se.data);y.generateMipmaps=!1}else Ae?(De&&t.texStorage2D(i.TEXTURE_2D,oe,ce,te.width,te.height),F&&ee(y,te,ae,Ee)):t.texImage2D(i.TEXTURE_2D,0,ce,te.width,te.height,0,ae,Ee,te.data);else if(y.isCompressedTexture)if(y.isCompressedArrayTexture){Ae&&De&&t.texStorage3D(i.TEXTURE_2D_ARRAY,oe,ce,Re[0].width,Re[0].height,te.depth);for(let J=0,le=Re.length;J<le;J++)if(se=Re[J],y.format!==Pt)if(ae!==null)if(Ae){if(F)if(y.layerUpdates.size>0){const fe=Wo(se.width,se.height,y.format,y.type);for(const ne of y.layerUpdates){const Te=se.data.subarray(ne*fe/se.data.BYTES_PER_ELEMENT,(ne+1)*fe/se.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,J,0,0,ne,se.width,se.height,1,ae,Te)}}else t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,J,0,0,0,se.width,se.height,te.depth,ae,se.data)}else t.compressedTexImage3D(i.TEXTURE_2D_ARRAY,J,ce,se.width,se.height,te.depth,0,se.data,0,0);else Ce("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Ae?F&&t.texSubImage3D(i.TEXTURE_2D_ARRAY,J,0,0,0,se.width,se.height,te.depth,ae,Ee,se.data):t.texImage3D(i.TEXTURE_2D_ARRAY,J,ce,se.width,se.height,te.depth,0,ae,Ee,se.data);y.layerUpdates.size>0&&y.clearLayerUpdates()}else{Ae&&De&&t.texStorage2D(i.TEXTURE_2D,oe,ce,Re[0].width,Re[0].height);for(let J=0,le=Re.length;J<le;J++)se=Re[J],y.format!==Pt?ae!==null?Ae?F&&t.compressedTexSubImage2D(i.TEXTURE_2D,J,0,0,se.width,se.height,ae,se.data):t.compressedTexImage2D(i.TEXTURE_2D,J,ce,se.width,se.height,0,se.data):Ce("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Ae?F&&t.texSubImage2D(i.TEXTURE_2D,J,0,0,se.width,se.height,ae,Ee,se.data):t.texImage2D(i.TEXTURE_2D,J,ce,se.width,se.height,0,ae,Ee,se.data)}else if(y.isDataArrayTexture)if(Ae){if(De&&t.texStorage3D(i.TEXTURE_2D_ARRAY,oe,ce,te.width,te.height,te.depth),F)if(y.layerUpdates.size>0){const J=Wo(te.width,te.height,y.format,y.type);for(const le of y.layerUpdates){const fe=te.data.subarray(le*J/te.data.BYTES_PER_ELEMENT,(le+1)*J/te.data.BYTES_PER_ELEMENT);t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,le,te.width,te.height,1,ae,Ee,fe)}y.clearLayerUpdates()}else t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,te.width,te.height,te.depth,ae,Ee,te.data)}else t.texImage3D(i.TEXTURE_2D_ARRAY,0,ce,te.width,te.height,te.depth,0,ae,Ee,te.data);else if(y.isData3DTexture)Ae?(De&&t.texStorage3D(i.TEXTURE_3D,oe,ce,te.width,te.height,te.depth),F&&t.texSubImage3D(i.TEXTURE_3D,0,0,0,0,te.width,te.height,te.depth,ae,Ee,te.data)):t.texImage3D(i.TEXTURE_3D,0,ce,te.width,te.height,te.depth,0,ae,Ee,te.data);else if(y.isFramebufferTexture){if(De)if(Ae)t.texStorage2D(i.TEXTURE_2D,oe,ce,te.width,te.height);else{let J=te.width,le=te.height;for(let fe=0;fe<oe;fe++)t.texImage2D(i.TEXTURE_2D,fe,ce,J,le,0,ae,Ee,null),J>>=1,le>>=1}}else if(y.isHTMLTexture){if("texElementImage2D"in i){const J=i.canvas;if(J.hasAttribute("layoutsubtree")||J.setAttribute("layoutsubtree","true"),te.parentNode!==J){J.appendChild(te),p.add(y),J.onpaint=le=>{const fe=le.changedElements;for(const ne of p)fe.includes(ne.image)&&(ne.needsUpdate=!0)},J.requestPaint();return}if(i.texElementImage2D.length===3)i.texElementImage2D(i.TEXTURE_2D,i.RGBA8,te);else{const fe=i.RGBA,ne=i.RGBA,Te=i.UNSIGNED_BYTE;i.texElementImage2D(i.TEXTURE_2D,0,fe,ne,Te,te)}i.texParameteri(i.TEXTURE_2D,i.TEXTURE_MIN_FILTER,i.LINEAR),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_S,i.CLAMP_TO_EDGE),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_T,i.CLAMP_TO_EDGE)}}else if(Re.length>0){if(Ae&&De){const J=Je(Re[0]);t.texStorage2D(i.TEXTURE_2D,oe,ce,J.width,J.height)}for(let J=0,le=Re.length;J<le;J++)se=Re[J],Ae?F&&t.texSubImage2D(i.TEXTURE_2D,J,0,0,ae,Ee,se):t.texImage2D(i.TEXTURE_2D,J,ce,ae,Ee,se);y.generateMipmaps=!1}else if(Ae){if(De){const J=Je(te);t.texStorage2D(i.TEXTURE_2D,oe,ce,J.width,J.height)}F&&t.texSubImage2D(i.TEXTURE_2D,0,0,0,ae,Ee,te)}else t.texImage2D(i.TEXTURE_2D,0,ce,ae,Ee,te);f(y)&&w(H),re.__version=ie.version,y.onUpdate&&y.onUpdate(y)}A.__version=y.version}function Le(A,y,k){if(y.image.length!==6)return;const H=He(A,y),$=y.source;t.bindTexture(i.TEXTURE_CUBE_MAP,A.__webglTexture,i.TEXTURE0+k);const ie=n.get($);if($.version!==ie.__version||H===!0){t.activeTexture(i.TEXTURE0+k);const re=Ge.getPrimaries(Ge.workingColorSpace),K=y.colorSpace===bn?null:Ge.getPrimaries(y.colorSpace),te=y.colorSpace===bn||re===K?i.NONE:i.BROWSER_DEFAULT_WEBGL;t.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,y.flipY),t.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,y.premultiplyAlpha),t.pixelStorei(i.UNPACK_ALIGNMENT,y.unpackAlignment),t.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,te);const ae=y.isCompressedTexture||y.image[0].isCompressedTexture,Ee=y.image[0]&&y.image[0].isDataTexture,ce=[];for(let ne=0;ne<6;ne++)!ae&&!Ee?ce[ne]=u(y.image[ne],!0,r.maxCubemapSize):ce[ne]=Ee?y.image[ne].image:y.image[ne],ce[ne]=St(y,ce[ne]);const se=ce[0],Re=a.convert(y.format,y.colorSpace),Ae=a.convert(y.type),De=M(y.internalFormat,Re,Ae,y.normalized,y.colorSpace),F=y.isVideoTexture!==!0,oe=ie.__version===void 0||H===!0,J=$.dataReady;let le=S(y,se);Fe(i.TEXTURE_CUBE_MAP,y);let fe;if(ae){F&&oe&&t.texStorage2D(i.TEXTURE_CUBE_MAP,le,De,se.width,se.height);for(let ne=0;ne<6;ne++){fe=ce[ne].mipmaps;for(let Te=0;Te<fe.length;Te++){const be=fe[Te];y.format!==Pt?Re!==null?F?J&&t.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ne,Te,0,0,be.width,be.height,Re,be.data):t.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ne,Te,De,be.width,be.height,0,be.data):Ce("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):F?J&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ne,Te,0,0,be.width,be.height,Re,Ae,be.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ne,Te,De,be.width,be.height,0,Re,Ae,be.data)}}}else{if(fe=y.mipmaps,F&&oe){fe.length>0&&le++;const ne=Je(ce[0]);t.texStorage2D(i.TEXTURE_CUBE_MAP,le,De,ne.width,ne.height)}for(let ne=0;ne<6;ne++)if(Ee){F?J&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ne,0,0,0,ce[ne].width,ce[ne].height,Re,Ae,ce[ne].data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ne,0,De,ce[ne].width,ce[ne].height,0,Re,Ae,ce[ne].data);for(let Te=0;Te<fe.length;Te++){const at=fe[Te].image[ne].image;F?J&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ne,Te+1,0,0,at.width,at.height,Re,Ae,at.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ne,Te+1,De,at.width,at.height,0,Re,Ae,at.data)}}else{F?J&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ne,0,0,0,Re,Ae,ce[ne]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ne,0,De,Re,Ae,ce[ne]);for(let Te=0;Te<fe.length;Te++){const be=fe[Te];F?J&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ne,Te+1,0,0,Re,Ae,be.image[ne]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ne,Te+1,De,Re,Ae,be.image[ne])}}}f(y)&&w(i.TEXTURE_CUBE_MAP),ie.__version=$.version,y.onUpdate&&y.onUpdate(y)}A.__version=y.version}function ve(A,y,k,H,$,ie){const re=a.convert(k.format,k.colorSpace),K=a.convert(k.type),te=M(k.internalFormat,re,K,k.normalized,k.colorSpace),ae=n.get(y),Ee=n.get(k);if(Ee.__renderTarget=y,!ae.__hasExternalTextures){const ce=Math.max(1,y.width>>ie),se=Math.max(1,y.height>>ie);$===i.TEXTURE_3D||$===i.TEXTURE_2D_ARRAY?t.texImage3D($,ie,te,ce,se,y.depth,0,re,K,null):t.texImage2D($,ie,te,ce,se,0,re,K,null)}t.bindFramebuffer(i.FRAMEBUFFER,A),ht(y)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,H,$,Ee.__webglTexture,0,ct(y)):($===i.TEXTURE_2D||$>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&$<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,H,$,Ee.__webglTexture,ie),t.bindFramebuffer(i.FRAMEBUFFER,null)}function Ne(A,y,k){if(i.bindRenderbuffer(i.RENDERBUFFER,A),y.depthBuffer){const H=y.depthTexture,$=H&&H.isDepthTexture?H.type:null,ie=x(y.stencilBuffer,$),re=y.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;ht(y)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,ct(y),ie,y.width,y.height):k?i.renderbufferStorageMultisample(i.RENDERBUFFER,ct(y),ie,y.width,y.height):i.renderbufferStorage(i.RENDERBUFFER,ie,y.width,y.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,re,i.RENDERBUFFER,A)}else{const H=y.textures;for(let $=0;$<H.length;$++){const ie=H[$],re=a.convert(ie.format,ie.colorSpace),K=a.convert(ie.type),te=M(ie.internalFormat,re,K,ie.normalized,ie.colorSpace);ht(y)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,ct(y),te,y.width,y.height):k?i.renderbufferStorageMultisample(i.RENDERBUFFER,ct(y),te,y.width,y.height):i.renderbufferStorage(i.RENDERBUFFER,te,y.width,y.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function mt(A,y,k){const H=y.isWebGLCubeRenderTarget===!0;if(t.bindFramebuffer(i.FRAMEBUFFER,A),!(y.depthTexture&&y.depthTexture.isDepthTexture))throw new Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");const $=n.get(y.depthTexture);if($.__renderTarget=y,(!$.__webglTexture||y.depthTexture.image.width!==y.width||y.depthTexture.image.height!==y.height)&&(y.depthTexture.image.width=y.width,y.depthTexture.image.height=y.height,y.depthTexture.needsUpdate=!0),H){if($.__webglInit===void 0&&($.__webglInit=!0,y.depthTexture.addEventListener("dispose",R)),$.__webglTexture===void 0){$.__webglTexture=i.createTexture(),t.bindTexture(i.TEXTURE_CUBE_MAP,$.__webglTexture),Fe(i.TEXTURE_CUBE_MAP,y.depthTexture);const ae=a.convert(y.depthTexture.format),Ee=a.convert(y.depthTexture.type);let ce;y.depthTexture.format===Rn?ce=i.DEPTH_COMPONENT24:y.depthTexture.format===qn&&(ce=i.DEPTH24_STENCIL8);for(let se=0;se<6;se++)i.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+se,0,ce,y.width,y.height,0,ae,Ee,null)}}else Z(y.depthTexture,0);const ie=$.__webglTexture,re=ct(y),K=H?i.TEXTURE_CUBE_MAP_POSITIVE_X+k:i.TEXTURE_2D,te=y.depthTexture.format===qn?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;if(y.depthTexture.format===Rn)ht(y)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,te,K,ie,0,re):i.framebufferTexture2D(i.FRAMEBUFFER,te,K,ie,0);else if(y.depthTexture.format===qn)ht(y)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,te,K,ie,0,re):i.framebufferTexture2D(i.FRAMEBUFFER,te,K,ie,0);else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.")}function Be(A){const y=n.get(A),k=A.isWebGLCubeRenderTarget===!0;if(y.__boundDepthTexture!==A.depthTexture){const H=A.depthTexture;if(y.__depthDisposeCallback&&y.__depthDisposeCallback(),H){const $=()=>{delete y.__boundDepthTexture,delete y.__depthDisposeCallback,H.removeEventListener("dispose",$)};H.addEventListener("dispose",$),y.__depthDisposeCallback=$}y.__boundDepthTexture=H}if(A.depthTexture&&!y.__autoAllocateDepthBuffer)if(k)for(let H=0;H<6;H++)mt(y.__webglFramebuffer[H],A,H);else{const H=A.texture.mipmaps;H&&H.length>0?mt(y.__webglFramebuffer[0],A,0):mt(y.__webglFramebuffer,A,0)}else if(k){y.__webglDepthbuffer=[];for(let H=0;H<6;H++)if(t.bindFramebuffer(i.FRAMEBUFFER,y.__webglFramebuffer[H]),y.__webglDepthbuffer[H]===void 0)y.__webglDepthbuffer[H]=i.createRenderbuffer(),Ne(y.__webglDepthbuffer[H],A,!1);else{const $=A.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,ie=y.__webglDepthbuffer[H];i.bindRenderbuffer(i.RENDERBUFFER,ie),i.framebufferRenderbuffer(i.FRAMEBUFFER,$,i.RENDERBUFFER,ie)}}else{const H=A.texture.mipmaps;if(H&&H.length>0?t.bindFramebuffer(i.FRAMEBUFFER,y.__webglFramebuffer[0]):t.bindFramebuffer(i.FRAMEBUFFER,y.__webglFramebuffer),y.__webglDepthbuffer===void 0)y.__webglDepthbuffer=i.createRenderbuffer(),Ne(y.__webglDepthbuffer,A,!1);else{const $=A.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,ie=y.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,ie),i.framebufferRenderbuffer(i.FRAMEBUFFER,$,i.RENDERBUFFER,ie)}}t.bindFramebuffer(i.FRAMEBUFFER,null)}function Xe(A,y,k){const H=n.get(A);y!==void 0&&ve(H.__webglFramebuffer,A,A.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),k!==void 0&&Be(A)}function rt(A){const y=A.texture,k=n.get(A),H=n.get(y);A.addEventListener("dispose",_);const $=A.textures,ie=A.isWebGLCubeRenderTarget===!0,re=$.length>1;if(re||(H.__webglTexture===void 0&&(H.__webglTexture=i.createTexture()),H.__version=y.version,s.memory.textures++),ie){k.__webglFramebuffer=[];for(let K=0;K<6;K++)if(y.mipmaps&&y.mipmaps.length>0){k.__webglFramebuffer[K]=[];for(let te=0;te<y.mipmaps.length;te++)k.__webglFramebuffer[K][te]=i.createFramebuffer()}else k.__webglFramebuffer[K]=i.createFramebuffer()}else{if(y.mipmaps&&y.mipmaps.length>0){k.__webglFramebuffer=[];for(let K=0;K<y.mipmaps.length;K++)k.__webglFramebuffer[K]=i.createFramebuffer()}else k.__webglFramebuffer=i.createFramebuffer();if(re)for(let K=0,te=$.length;K<te;K++){const ae=n.get($[K]);ae.__webglTexture===void 0&&(ae.__webglTexture=i.createTexture(),s.memory.textures++)}if(A.samples>0&&ht(A)===!1){k.__webglMultisampledFramebuffer=i.createFramebuffer(),k.__webglColorRenderbuffer=[],t.bindFramebuffer(i.FRAMEBUFFER,k.__webglMultisampledFramebuffer);for(let K=0;K<$.length;K++){const te=$[K];k.__webglColorRenderbuffer[K]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,k.__webglColorRenderbuffer[K]);const ae=a.convert(te.format,te.colorSpace),Ee=a.convert(te.type),ce=M(te.internalFormat,ae,Ee,te.normalized,te.colorSpace,A.isXRRenderTarget===!0),se=ct(A);i.renderbufferStorageMultisample(i.RENDERBUFFER,se,ce,A.width,A.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+K,i.RENDERBUFFER,k.__webglColorRenderbuffer[K])}i.bindRenderbuffer(i.RENDERBUFFER,null),A.depthBuffer&&(k.__webglDepthRenderbuffer=i.createRenderbuffer(),Ne(k.__webglDepthRenderbuffer,A,!0)),t.bindFramebuffer(i.FRAMEBUFFER,null)}}if(ie){t.bindTexture(i.TEXTURE_CUBE_MAP,H.__webglTexture),Fe(i.TEXTURE_CUBE_MAP,y);for(let K=0;K<6;K++)if(y.mipmaps&&y.mipmaps.length>0)for(let te=0;te<y.mipmaps.length;te++)ve(k.__webglFramebuffer[K][te],A,y,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+K,te);else ve(k.__webglFramebuffer[K],A,y,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+K,0);f(y)&&w(i.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(re){for(let K=0,te=$.length;K<te;K++){const ae=$[K],Ee=n.get(ae);let ce=i.TEXTURE_2D;(A.isWebGL3DRenderTarget||A.isWebGLArrayRenderTarget)&&(ce=A.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),t.bindTexture(ce,Ee.__webglTexture),Fe(ce,ae),ve(k.__webglFramebuffer,A,ae,i.COLOR_ATTACHMENT0+K,ce,0),f(ae)&&w(ce)}t.unbindTexture()}else{let K=i.TEXTURE_2D;if((A.isWebGL3DRenderTarget||A.isWebGLArrayRenderTarget)&&(K=A.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),t.bindTexture(K,H.__webglTexture),Fe(K,y),y.mipmaps&&y.mipmaps.length>0)for(let te=0;te<y.mipmaps.length;te++)ve(k.__webglFramebuffer[te],A,y,i.COLOR_ATTACHMENT0,K,te);else ve(k.__webglFramebuffer,A,y,i.COLOR_ATTACHMENT0,K,0);f(y)&&w(K),t.unbindTexture()}A.depthBuffer&&Be(A)}function ze(A){const y=A.textures;for(let k=0,H=y.length;k<H;k++){const $=y[k];if(f($)){const ie=C(A),re=n.get($).__webglTexture;t.bindTexture(ie,re),w(ie),t.unbindTexture()}}}const lt=[],xt=[];function It(A){if(A.samples>0){if(ht(A)===!1){const y=A.textures,k=A.width,H=A.height;let $=i.COLOR_BUFFER_BIT;const ie=A.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,re=n.get(A),K=y.length>1;if(K)for(let ae=0;ae<y.length;ae++)t.bindFramebuffer(i.FRAMEBUFFER,re.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+ae,i.RENDERBUFFER,null),t.bindFramebuffer(i.FRAMEBUFFER,re.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+ae,i.TEXTURE_2D,null,0);t.bindFramebuffer(i.READ_FRAMEBUFFER,re.__webglMultisampledFramebuffer);const te=A.texture.mipmaps;te&&te.length>0?t.bindFramebuffer(i.DRAW_FRAMEBUFFER,re.__webglFramebuffer[0]):t.bindFramebuffer(i.DRAW_FRAMEBUFFER,re.__webglFramebuffer);for(let ae=0;ae<y.length;ae++){if(A.resolveDepthBuffer&&(A.depthBuffer&&($|=i.DEPTH_BUFFER_BIT),A.stencilBuffer&&A.resolveStencilBuffer&&($|=i.STENCIL_BUFFER_BIT)),K){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,re.__webglColorRenderbuffer[ae]);const Ee=n.get(y[ae]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,Ee,0)}i.blitFramebuffer(0,0,k,H,0,0,k,H,$,i.NEAREST),c===!0&&(lt.length=0,xt.length=0,lt.push(i.COLOR_ATTACHMENT0+ae),A.depthBuffer&&A.storeMultisampledDepthBuffer===!1&&(lt.push(ie),xt.push(ie),i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,xt)),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,lt))}if(t.bindFramebuffer(i.READ_FRAMEBUFFER,null),t.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),K)for(let ae=0;ae<y.length;ae++){t.bindFramebuffer(i.FRAMEBUFFER,re.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+ae,i.RENDERBUFFER,re.__webglColorRenderbuffer[ae]);const Ee=n.get(y[ae]).__webglTexture;t.bindFramebuffer(i.FRAMEBUFFER,re.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+ae,i.TEXTURE_2D,Ee,0)}t.bindFramebuffer(i.DRAW_FRAMEBUFFER,re.__webglMultisampledFramebuffer)}else if(A.depthBuffer&&A.storeMultisampledDepthBuffer===!1&&c){const y=A.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[y])}}}function ct(A){return Math.min(r.maxSamples,A.samples)}function ht(A){const y=n.get(A);return A.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&y.__useRenderToTexture!==!1}function B(A){const y=s.render.frame;h.get(A)!==y&&(h.set(A,y),A.update())}function St(A,y){const k=A.colorSpace,H=A.format,$=A.type;return A.isCompressedTexture===!0||A.isVideoTexture===!0||k!==Zi&&k!==bn&&(Ge.getTransfer(k)===Qe?(H!==Pt||$!==Nt)&&Ce("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):je("WebGLTextures: Unsupported texture color space:",k)),y}function Je(A){return typeof HTMLImageElement<"u"&&A instanceof HTMLImageElement?(l.width=A.naturalWidth||A.width,l.height=A.naturalHeight||A.height):typeof VideoFrame<"u"&&A instanceof VideoFrame?(l.width=A.displayWidth,l.height=A.displayHeight):(l.width=A.width,l.height=A.height),l}this.allocateTextureUnit=W,this.resetTextureUnits=U,this.getTextureUnits=D,this.setTextureUnits=z,this.setTexture2D=Z,this.setTexture2DArray=I,this.setTexture3D=q,this.setTextureCube=Q,this.rebindTextures=Xe,this.setupRenderTarget=rt,this.updateRenderTargetMipmap=ze,this.updateMultisampleRenderTarget=It,this.setupDepthRenderbuffer=Be,this.setupFrameBufferTexture=ve,this.useMultisampledRTT=ht,this.isReversedDepthBuffer=function(){return t.buffers.depth.getReversed()}}function Qp(i,e){function t(n,r=bn){let a;const s=Ge.getTransfer(r);if(n===Nt)return i.UNSIGNED_BYTE;if(n===Xs)return i.UNSIGNED_SHORT_4_4_4_4;if(n===js)return i.UNSIGNED_SHORT_5_5_5_1;if(n===Wl)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===Xl)return i.UNSIGNED_INT_10F_11F_11F_REV;if(n===Vl)return i.BYTE;if(n===Hl)return i.SHORT;if(n===$i)return i.UNSIGNED_SHORT;if(n===ta)return i.INT;if(n===qt)return i.UNSIGNED_INT;if(n===Lt)return i.FLOAT;if(n===pn)return i.HALF_FLOAT;if(n===jl)return i.ALPHA;if(n===ql)return i.RGB;if(n===Pt)return i.RGBA;if(n===Rn)return i.DEPTH_COMPONENT;if(n===qn)return i.DEPTH_STENCIL;if(n===na)return i.RED;if(n===qs)return i.RED_INTEGER;if(n===Kn)return i.RG;if(n===Ys)return i.RG_INTEGER;if(n===$s)return i.RGBA_INTEGER;if(n===Ur||n===Ir||n===Nr||n===Fr)if(s===Qe)if(a=e.get("WEBGL_compressed_texture_s3tc_srgb"),a!==null){if(n===Ur)return a.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===Ir)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===Nr)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===Fr)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(a=e.get("WEBGL_compressed_texture_s3tc"),a!==null){if(n===Ur)return a.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===Ir)return a.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===Nr)return a.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===Fr)return a.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===as||n===ss||n===os||n===ls)if(a=e.get("WEBGL_compressed_texture_pvrtc"),a!==null){if(n===as)return a.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===ss)return a.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===os)return a.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===ls)return a.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===cs||n===us||n===hs||n===ds||n===fs||n===Gr||n===ps)if(a=e.get("WEBGL_compressed_texture_etc"),a!==null){if(n===cs||n===us)return s===Qe?a.COMPRESSED_SRGB8_ETC2:a.COMPRESSED_RGB8_ETC2;if(n===hs)return s===Qe?a.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:a.COMPRESSED_RGBA8_ETC2_EAC;if(n===ds)return a.COMPRESSED_R11_EAC;if(n===fs)return a.COMPRESSED_SIGNED_R11_EAC;if(n===Gr)return a.COMPRESSED_RG11_EAC;if(n===ps)return a.COMPRESSED_SIGNED_RG11_EAC}else return null;if(n===ms||n===vs||n===gs||n===_s||n===ys||n===xs||n===bs||n===ws||n===Ss||n===Ms||n===Es||n===Rs||n===Ts||n===As)if(a=e.get("WEBGL_compressed_texture_astc"),a!==null){if(n===ms)return s===Qe?a.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:a.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===vs)return s===Qe?a.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:a.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===gs)return s===Qe?a.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:a.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===_s)return s===Qe?a.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:a.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===ys)return s===Qe?a.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:a.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===xs)return s===Qe?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:a.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===bs)return s===Qe?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:a.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===ws)return s===Qe?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:a.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===Ss)return s===Qe?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:a.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===Ms)return s===Qe?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:a.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===Es)return s===Qe?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:a.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===Rs)return s===Qe?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:a.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===Ts)return s===Qe?a.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:a.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===As)return s===Qe?a.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:a.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===Cs||n===Ls||n===Ps)if(a=e.get("EXT_texture_compression_bptc"),a!==null){if(n===Cs)return s===Qe?a.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:a.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===Ls)return a.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===Ps)return a.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===Ds||n===Us||n===Vr||n===Is)if(a=e.get("EXT_texture_compression_rgtc"),a!==null){if(n===Ds)return a.COMPRESSED_RED_RGTC1_EXT;if(n===Us)return a.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===Vr)return a.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===Is)return a.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===Ki?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return{convert:t}}const em=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,tm=`
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

}`;class nm{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){const n=new ic(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=n}}getMesh(e){if(this.texture!==null&&this.mesh===null){const t=e.cameras[0].viewport,n=new mn({vertexShader:em,fragmentShader:tm,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new Gt(new nr(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class im extends ei{constructor(e,t){super();const n=this;let r=null,a=1,s=null,o="local-floor",c=1,l=null,h=null,p=null,d=null,v=null,g=null;const m=typeof XRWebGLBinding<"u",u=new nm,f={},w=t.getContextAttributes();let C=null,M=null;const x=[],S=[],R=new Ve;let _=null,E=null;const L=new Jt;L.viewport=new nt;const T=new Jt;T.viewport=new nt;const P=[L,T],U=new uu;let D=null,z=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(Y){let ee=x[Y];return ee===void 0&&(ee=new ya,x[Y]=ee),ee.getTargetRaySpace()},this.getControllerGrip=function(Y){let ee=x[Y];return ee===void 0&&(ee=new ya,x[Y]=ee),ee.getGripSpace()},this.getHand=function(Y){let ee=x[Y];return ee===void 0&&(ee=new ya,x[Y]=ee),ee.getHandSpace()};function W(Y){const ee=S.indexOf(Y.inputSource);if(ee===-1)return;const _e=x[ee];_e!==void 0&&(_e.update(Y.inputSource,Y.frame,l||s),_e.dispatchEvent({type:Y.type,data:Y.inputSource}))}function j(){r.removeEventListener("select",W),r.removeEventListener("selectstart",W),r.removeEventListener("selectend",W),r.removeEventListener("squeeze",W),r.removeEventListener("squeezestart",W),r.removeEventListener("squeezeend",W),r.removeEventListener("end",j),r.removeEventListener("inputsourceschange",Z);for(let Y=0;Y<x.length;Y++){const ee=S[Y];ee!==null&&(S[Y]=null,x[Y].disconnect(ee))}D=null,z=null,u.reset();for(const Y in f)delete f[Y];if(e.setRenderTarget(C),v=null,d=null,p=null,r=null,M=null,He.stop(),n.isPresenting=!1,e.setPixelRatio(_),e.setSize(R.width,R.height,!1),E!==null){const Y=E.camera;Y.fov=E.fov,Y.zoom=E.zoom,Y.updateProjectionMatrix(),E=null}n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(Y){a=Y,n.isPresenting===!0&&Ce("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(Y){o=Y,n.isPresenting===!0&&Ce("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return l||s},this.setReferenceSpace=function(Y){l=Y},this.getBaseLayer=function(){return d!==null?d:v},this.getBinding=function(){return p===null&&m&&(p=new XRWebGLBinding(r,t)),p},this.getFrame=function(){return g},this.getSession=function(){return r},this.setSession=async function(Y){if(r=Y,r!==null){if(C=e.getRenderTarget(),r.addEventListener("select",W),r.addEventListener("selectstart",W),r.addEventListener("selectend",W),r.addEventListener("squeeze",W),r.addEventListener("squeezestart",W),r.addEventListener("squeezeend",W),r.addEventListener("end",j),r.addEventListener("inputsourceschange",Z),w.xrCompatible!==!0&&await t.makeXRCompatible(),_=e.getPixelRatio(),e.getSize(R),m&&"createProjectionLayer"in XRWebGLBinding.prototype){let _e=null,Le=null,ve=null;w.depth&&(ve=w.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,_e=w.stencil?qn:Rn,Le=w.stencil?Ki:qt);const Ne={colorFormat:t.RGBA8,depthFormat:ve,scaleFactor:a};p=this.getBinding(),d=p.createProjectionLayer(Ne),r.updateRenderState({layers:[d]}),e.setPixelRatio(1),e.setSize(d.textureWidth,d.textureHeight,!1),M=new Ut(d.textureWidth,d.textureHeight,{format:Pt,type:Nt,depthTexture:new Jn(d.textureWidth,d.textureHeight,Le,void 0,void 0,void 0,void 0,void 0,void 0,_e),stencilBuffer:w.stencil,colorSpace:e.outputColorSpace,samples:w.antialias?4:0,resolveDepthBuffer:d.ignoreDepthValues===!1,resolveStencilBuffer:d.ignoreDepthValues===!1,storeMultisampledDepthBuffer:d.ignoreDepthValues===!1,storeMultisampledStencilBuffer:d.ignoreDepthValues===!1})}else{const _e={antialias:w.antialias,alpha:!0,depth:w.depth,stencil:w.stencil,framebufferScaleFactor:a};v=new XRWebGLLayer(r,t,_e),r.updateRenderState({baseLayer:v}),e.setPixelRatio(1),e.setSize(v.framebufferWidth,v.framebufferHeight,!1),M=new Ut(v.framebufferWidth,v.framebufferHeight,{format:Pt,type:Nt,colorSpace:e.outputColorSpace,stencilBuffer:w.stencil,resolveDepthBuffer:v.ignoreDepthValues===!1,resolveStencilBuffer:v.ignoreDepthValues===!1,storeMultisampledDepthBuffer:v.ignoreDepthValues===!1,storeMultisampledStencilBuffer:v.ignoreDepthValues===!1})}M.isXRRenderTarget=!0,this.setFoveation(c),l=null,s=await r.requestReferenceSpace(o),He.setContext(r),He.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(r!==null)return r.environmentBlendMode},this.getDepthTexture=function(){return u.getDepthTexture()};function Z(Y){for(let ee=0;ee<Y.removed.length;ee++){const _e=Y.removed[ee],Le=S.indexOf(_e);Le>=0&&(S[Le]=null,x[Le].disconnect(_e))}for(let ee=0;ee<Y.added.length;ee++){const _e=Y.added[ee];let Le=S.indexOf(_e);if(Le===-1){for(let Ne=0;Ne<x.length;Ne++)if(Ne>=S.length){S.push(_e),Le=Ne;break}else if(S[Ne]===null){S[Ne]=_e,Le=Ne;break}if(Le===-1)break}const ve=x[Le];ve&&ve.connect(_e)}}const I=new O,q=new O;function Q(Y,ee,_e){I.setFromMatrixPosition(ee.matrixWorld),q.setFromMatrixPosition(_e.matrixWorld);const Le=I.distanceTo(q),ve=ee.projectionMatrix.elements,Ne=_e.projectionMatrix.elements,mt=ve[14]/(ve[10]-1),Be=ve[14]/(ve[10]+1),Xe=(ve[9]+1)/ve[5],rt=(ve[9]-1)/ve[5],ze=(ve[8]-1)/ve[0],lt=(Ne[8]+1)/Ne[0],xt=mt*ze,It=mt*lt,ct=Le/(-ze+lt),ht=ct*-ze;if(ee.matrixWorld.decompose(Y.position,Y.quaternion,Y.scale),Y.translateX(ht),Y.translateZ(ct),Y.matrixWorld.compose(Y.position,Y.quaternion,Y.scale),Y.matrixWorldInverse.copy(Y.matrixWorld).invert(),ve[10]===-1)Y.projectionMatrix.copy(ee.projectionMatrix),Y.projectionMatrixInverse.copy(ee.projectionMatrixInverse);else{const B=mt+ct,St=Be+ct,Je=xt-ht,A=It+(Le-ht),y=Xe*Be/St*B,k=rt*Be/St*B;Y.projectionMatrix.makePerspective(Je,A,y,k,B,St),Y.projectionMatrixInverse.copy(Y.projectionMatrix).invert()}}function Me(Y,ee){ee===null?Y.matrixWorld.copy(Y.matrix):Y.matrixWorld.multiplyMatrices(ee.matrixWorld,Y.matrix),Y.matrixWorldInverse.copy(Y.matrixWorld).invert()}this.updateCamera=function(Y){if(r===null)return;let ee=Y.near,_e=Y.far;u.texture!==null&&(u.depthNear>0&&(ee=u.depthNear),u.depthFar>0&&(_e=u.depthFar)),U.near=T.near=L.near=ee,U.far=T.far=L.far=_e,(D!==U.near||z!==U.far)&&(r.updateRenderState({depthNear:U.near,depthFar:U.far}),D=U.near,z=U.far),U.layers.mask=Y.layers.mask|6,L.layers.mask=U.layers.mask&-5,T.layers.mask=U.layers.mask&-3;const Le=Y.parent,ve=U.cameras;Me(U,Le);for(let Ne=0;Ne<ve.length;Ne++)Me(ve[Ne],Le);ve.length===2?Q(U,L,T):U.projectionMatrix.copy(L.projectionMatrix),E===null&&Y.isPerspectiveCamera&&(E={camera:Y,fov:Y.fov,zoom:Y.zoom}),we(Y,U,Le)};function we(Y,ee,_e){_e===null?Y.matrix.copy(ee.matrixWorld):(Y.matrix.copy(_e.matrixWorld),Y.matrix.invert(),Y.matrix.multiply(ee.matrixWorld)),Y.matrix.decompose(Y.position,Y.quaternion,Y.scale),Y.updateMatrixWorld(!0),Y.projectionMatrix.copy(ee.projectionMatrix),Y.projectionMatrixInverse.copy(ee.projectionMatrixInverse),Y.isPerspectiveCamera&&(Y.fov=Ji*2*Math.atan(1/Y.projectionMatrix.elements[5]),Y.zoom=1)}this.getCamera=function(){return U},this.getFoveation=function(){if(!(d===null&&v===null))return c},this.setFoveation=function(Y){c=Y,d!==null&&(d.fixedFoveation=Y),v!==null&&v.fixedFoveation!==void 0&&(v.fixedFoveation=Y)},this.hasDepthSensing=function(){return u.texture!==null},this.getDepthSensingMesh=function(){return u.getMesh(U)},this.getCameraTexture=function(Y){return f[Y]};let Ze=null;function Fe(Y,ee){if(h=ee.getViewerPose(l||s),g=ee,h!==null){const _e=h.views;v!==null&&(e.setRenderTargetFramebuffer(M,v.framebuffer),e.setRenderTarget(M));let Le=!1;_e.length!==U.cameras.length&&(U.cameras.length=0,Le=!0);for(let Be=0;Be<_e.length;Be++){const Xe=_e[Be];let rt=null;if(v!==null)rt=v.getViewport(Xe);else{const lt=p.getViewSubImage(d,Xe);rt=lt.viewport,Be===0&&(e.setRenderTargetTextures(M,lt.colorTexture,lt.depthStencilTexture),e.setRenderTarget(M))}let ze=P[Be];ze===void 0&&(ze=new Jt,ze.layers.enable(Be),ze.viewport=new nt,P[Be]=ze),ze.matrix.fromArray(Xe.transform.matrix),ze.matrix.decompose(ze.position,ze.quaternion,ze.scale),ze.projectionMatrix.fromArray(Xe.projectionMatrix),ze.projectionMatrixInverse.copy(ze.projectionMatrix).invert(),ze.viewport.set(rt.x,rt.y,rt.width,rt.height),Be===0&&(U.matrix.copy(ze.matrix),U.matrix.decompose(U.position,U.quaternion,U.scale)),Le===!0&&U.cameras.push(ze)}const ve=r.enabledFeatures;if(ve&&ve.includes("depth-sensing")&&r.depthUsage=="gpu-optimized"&&m){p=n.getBinding();const Be=p.getDepthInformation(_e[0]);Be&&Be.isValid&&Be.texture&&u.init(Be,r.renderState)}if(ve&&ve.includes("camera-access")&&m){e.state.unbindTexture(),p=n.getBinding();for(let Be=0;Be<_e.length;Be++){const Xe=_e[Be].camera;if(Xe){let rt=f[Xe];rt||(rt=new ic,f[Xe]=rt);const ze=p.getCameraImage(Xe);rt.sourceTexture=ze}}}}for(let _e=0;_e<x.length;_e++){const Le=S[_e],ve=x[_e];Le!==null&&ve!==void 0&&ve.update(Le,ee,l||s)}Ze&&Ze(Y,ee),ee.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:ee}),g=null}const He=new sc;He.setAnimationLoop(Fe),this.setAnimationLoop=function(Y){Ze=Y},this.dispose=function(){}}}const rm=new pe,fc=new Pe;fc.set(-1,0,0,0,1,0,0,0,1);function am(i,e){function t(u,f){u.matrixAutoUpdate===!0&&u.updateMatrix(),f.value.copy(u.matrix)}function n(u,f){f.color.getRGB(u.fogColor.value,rc(i)),f.isFog?(u.fogNear.value=f.near,u.fogFar.value=f.far):f.isFogExp2&&(u.fogDensity.value=f.density)}function r(u,f,w,C,M){f.isNodeMaterial?f.uniformsNeedUpdate=!1:f.isMeshBasicMaterial?a(u,f):f.isMeshLambertMaterial?(a(u,f),f.envMap&&(u.envMapIntensity.value=f.envMapIntensity)):f.isMeshToonMaterial?(a(u,f),p(u,f)):f.isMeshPhongMaterial?(a(u,f),h(u,f),f.envMap&&(u.envMapIntensity.value=f.envMapIntensity)):f.isMeshStandardMaterial?(a(u,f),d(u,f),f.isMeshPhysicalMaterial&&v(u,f,M)):f.isMeshMatcapMaterial?(a(u,f),g(u,f)):f.isMeshDepthMaterial?a(u,f):f.isMeshDistanceMaterial?(a(u,f),m(u,f)):f.isMeshNormalMaterial?a(u,f):f.isLineBasicMaterial?(s(u,f),f.isLineDashedMaterial&&o(u,f)):f.isPointsMaterial?c(u,f,w,C):f.isSpriteMaterial?l(u,f):f.isShadowMaterial?(u.color.value.copy(f.color),u.opacity.value=f.opacity):f.isShaderMaterial&&(f.uniformsNeedUpdate=!1)}function a(u,f){u.opacity.value=f.opacity,f.color&&u.diffuse.value.copy(f.color),f.emissive&&u.emissive.value.copy(f.emissive).multiplyScalar(f.emissiveIntensity),f.map&&(u.map.value=f.map,t(f.map,u.mapTransform)),f.alphaMap&&(u.alphaMap.value=f.alphaMap,t(f.alphaMap,u.alphaMapTransform)),f.bumpMap&&(u.bumpMap.value=f.bumpMap,t(f.bumpMap,u.bumpMapTransform),u.bumpScale.value=f.bumpScale,f.side===Ft&&(u.bumpScale.value*=-1)),f.normalMap&&(u.normalMap.value=f.normalMap,t(f.normalMap,u.normalMapTransform),u.normalScale.value.copy(f.normalScale),f.side===Ft&&u.normalScale.value.negate()),f.displacementMap&&(u.displacementMap.value=f.displacementMap,t(f.displacementMap,u.displacementMapTransform),u.displacementScale.value=f.displacementScale,u.displacementBias.value=f.displacementBias),f.emissiveMap&&(u.emissiveMap.value=f.emissiveMap,t(f.emissiveMap,u.emissiveMapTransform)),f.specularMap&&(u.specularMap.value=f.specularMap,t(f.specularMap,u.specularMapTransform)),f.alphaTest>0&&(u.alphaTest.value=f.alphaTest);const w=e.get(f),C=w.envMap,M=w.envMapRotation;C&&(u.envMap.value=C,u.envMapRotation.value.setFromMatrix4(rm.makeRotationFromEuler(M)).transpose(),C.isCubeTexture&&C.isRenderTargetTexture===!1&&u.envMapRotation.value.premultiply(fc),u.reflectivity.value=f.reflectivity,u.ior.value=f.ior,u.refractionRatio.value=f.refractionRatio),f.lightMap&&(u.lightMap.value=f.lightMap,u.lightMapIntensity.value=f.lightMapIntensity,t(f.lightMap,u.lightMapTransform)),f.aoMap&&(u.aoMap.value=f.aoMap,u.aoMapIntensity.value=f.aoMapIntensity,t(f.aoMap,u.aoMapTransform))}function s(u,f){u.diffuse.value.copy(f.color),u.opacity.value=f.opacity,f.map&&(u.map.value=f.map,t(f.map,u.mapTransform))}function o(u,f){u.dashSize.value=f.dashSize,u.totalSize.value=f.dashSize+f.gapSize,u.scale.value=f.scale}function c(u,f,w,C){u.diffuse.value.copy(f.color),u.opacity.value=f.opacity,u.size.value=f.size*w,u.scale.value=C*.5,f.map&&(u.map.value=f.map,t(f.map,u.uvTransform)),f.alphaMap&&(u.alphaMap.value=f.alphaMap,t(f.alphaMap,u.alphaMapTransform)),f.alphaTest>0&&(u.alphaTest.value=f.alphaTest)}function l(u,f){u.diffuse.value.copy(f.color),u.opacity.value=f.opacity,u.rotation.value=f.rotation,f.map&&(u.map.value=f.map,t(f.map,u.mapTransform)),f.alphaMap&&(u.alphaMap.value=f.alphaMap,t(f.alphaMap,u.alphaMapTransform)),f.alphaTest>0&&(u.alphaTest.value=f.alphaTest)}function h(u,f){u.specular.value.copy(f.specular),u.shininess.value=Math.max(f.shininess,1e-4)}function p(u,f){f.gradientMap&&(u.gradientMap.value=f.gradientMap)}function d(u,f){u.metalness.value=f.metalness,f.metalnessMap&&(u.metalnessMap.value=f.metalnessMap,t(f.metalnessMap,u.metalnessMapTransform)),u.roughness.value=f.roughness,f.roughnessMap&&(u.roughnessMap.value=f.roughnessMap,t(f.roughnessMap,u.roughnessMapTransform)),f.envMap&&(u.envMapIntensity.value=f.envMapIntensity)}function v(u,f,w){u.ior.value=f.ior,f.sheen>0&&(u.sheenColor.value.copy(f.sheenColor).multiplyScalar(f.sheen),u.sheenRoughness.value=f.sheenRoughness,f.sheenColorMap&&(u.sheenColorMap.value=f.sheenColorMap,t(f.sheenColorMap,u.sheenColorMapTransform)),f.sheenRoughnessMap&&(u.sheenRoughnessMap.value=f.sheenRoughnessMap,t(f.sheenRoughnessMap,u.sheenRoughnessMapTransform))),f.clearcoat>0&&(u.clearcoat.value=f.clearcoat,u.clearcoatRoughness.value=f.clearcoatRoughness,f.clearcoatMap&&(u.clearcoatMap.value=f.clearcoatMap,t(f.clearcoatMap,u.clearcoatMapTransform)),f.clearcoatRoughnessMap&&(u.clearcoatRoughnessMap.value=f.clearcoatRoughnessMap,t(f.clearcoatRoughnessMap,u.clearcoatRoughnessMapTransform)),f.clearcoatNormalMap&&(u.clearcoatNormalMap.value=f.clearcoatNormalMap,t(f.clearcoatNormalMap,u.clearcoatNormalMapTransform),u.clearcoatNormalScale.value.copy(f.clearcoatNormalScale),f.side===Ft&&u.clearcoatNormalScale.value.negate())),f.dispersion>0&&(u.dispersion.value=f.dispersion),f.retroreflectivity>0&&(u.retroreflectivity.value=f.retroreflectivity),f.iridescence>0&&(u.iridescence.value=f.iridescence,u.iridescenceIOR.value=f.iridescenceIOR,u.iridescenceThicknessMinimum.value=f.iridescenceThicknessRange[0],u.iridescenceThicknessMaximum.value=f.iridescenceThicknessRange[1],f.iridescenceMap&&(u.iridescenceMap.value=f.iridescenceMap,t(f.iridescenceMap,u.iridescenceMapTransform)),f.iridescenceThicknessMap&&(u.iridescenceThicknessMap.value=f.iridescenceThicknessMap,t(f.iridescenceThicknessMap,u.iridescenceThicknessMapTransform))),f.transmission>0&&(u.transmission.value=f.transmission,u.transmissionSamplerMap.value=w.texture,u.transmissionSamplerSize.value.set(w.width,w.height),f.transmissionMap&&(u.transmissionMap.value=f.transmissionMap,t(f.transmissionMap,u.transmissionMapTransform)),u.thickness.value=f.thickness,f.thicknessMap&&(u.thicknessMap.value=f.thicknessMap,t(f.thicknessMap,u.thicknessMapTransform)),u.attenuationDistance.value=f.attenuationDistance,u.attenuationColor.value.copy(f.attenuationColor)),f.anisotropy>0&&(u.anisotropyVector.value.set(f.anisotropy*Math.cos(f.anisotropyRotation),f.anisotropy*Math.sin(f.anisotropyRotation)),f.anisotropyMap&&(u.anisotropyMap.value=f.anisotropyMap,t(f.anisotropyMap,u.anisotropyMapTransform))),u.specularIntensity.value=f.specularIntensity,u.specularColor.value.copy(f.specularColor),f.specularColorMap&&(u.specularColorMap.value=f.specularColorMap,t(f.specularColorMap,u.specularColorMapTransform)),f.specularIntensityMap&&(u.specularIntensityMap.value=f.specularIntensityMap,t(f.specularIntensityMap,u.specularIntensityMapTransform))}function g(u,f){f.matcap&&(u.matcap.value=f.matcap)}function m(u,f){const w=e.get(f).light;u.referencePosition.value.setFromMatrixPosition(w.matrixWorld),u.nearDistance.value=w.shadow.camera.near,u.farDistance.value=w.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:r}}function sm(i,e,t,n){let r={},a={},s=[];const o=i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS);function c(M,x){const S=x.program;n.uniformBlockBinding(M,S)}function l(M,x){let S=r[M.id];S===void 0&&(u(M),S=h(M),r[M.id]=S,M.addEventListener("dispose",w));const R=x.program;n.updateUBOMapping(M,R);const _=e.render.frame;a[M.id]!==_&&(d(M),a[M.id]=_)}function h(M){const x=p();M.__bindingPointIndex=x;const S=i.createBuffer(),R=M.__size,_=M.usage;return i.bindBuffer(i.UNIFORM_BUFFER,S),i.bufferData(i.UNIFORM_BUFFER,R,_),i.bindBuffer(i.UNIFORM_BUFFER,null),i.bindBufferBase(i.UNIFORM_BUFFER,x,S),S}function p(){for(let M=0;M<o;M++)if(s.indexOf(M)===-1)return s.push(M),M;return je("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function d(M){const x=r[M.id],S=M.uniforms,R=M.__cache;i.bindBuffer(i.UNIFORM_BUFFER,x);for(let _=0,E=S.length;_<E;_++){const L=S[_];if(Array.isArray(L))for(let T=0,P=L.length;T<P;T++)v(L[T],_,T,R);else v(L,_,0,R)}i.bindBuffer(i.UNIFORM_BUFFER,null)}function v(M,x,S,R){if(m(M,x,S,R)===!0){const _=M.__offset,E=M.value;if(Array.isArray(E)){let L=0;for(let T=0;T<E.length;T++){const P=E[T],U=f(P);g(P,M.__data,L),typeof P!="number"&&typeof P!="boolean"&&!P.isMatrix3&&!ArrayBuffer.isView(P)&&(L+=U.storage/Float32Array.BYTES_PER_ELEMENT)}}else g(E,M.__data,0);i.bufferSubData(i.UNIFORM_BUFFER,_,M.__data)}}function g(M,x,S){typeof M=="number"||typeof M=="boolean"?x[0]=M:M.isMatrix3?(x[0]=M.elements[0],x[1]=M.elements[1],x[2]=M.elements[2],x[3]=0,x[4]=M.elements[3],x[5]=M.elements[4],x[6]=M.elements[5],x[7]=0,x[8]=M.elements[6],x[9]=M.elements[7],x[10]=M.elements[8],x[11]=0):ArrayBuffer.isView(M)?x.set(new M.constructor(M.buffer,M.byteOffset,x.length)):M.toArray(x,S)}function m(M,x,S,R){const _=M.value,E=x+"_"+S;if(R[E]===void 0)return typeof _=="number"||typeof _=="boolean"?R[E]=_:ArrayBuffer.isView(_)?R[E]=_.slice():R[E]=_.clone(),!0;{const L=R[E];if(typeof _=="number"||typeof _=="boolean"){if(L!==_)return R[E]=_,!0}else{if(ArrayBuffer.isView(_))return!0;if(L.equals(_)===!1)return L.copy(_),!0}}return!1}function u(M){const x=M.uniforms;let S=0;const R=16;for(let E=0,L=x.length;E<L;E++){const T=Array.isArray(x[E])?x[E]:[x[E]];for(let P=0,U=T.length;P<U;P++){const D=T[P],z=Array.isArray(D.value)?D.value:[D.value];for(let W=0,j=z.length;W<j;W++){const Z=z[W],I=f(Z),q=S%R,Q=q%I.boundary,Me=q+Q;S+=Q,Me!==0&&R-Me<I.storage&&(S+=R-Me),D.__data=new Float32Array(I.storage/Float32Array.BYTES_PER_ELEMENT),D.__offset=S,S+=I.storage}}}const _=S%R;return _>0&&(S+=R-_),M.__size=S,M.__cache={},this}function f(M){const x={boundary:0,storage:0};return typeof M=="number"||typeof M=="boolean"?(x.boundary=4,x.storage=4):M.isVector2?(x.boundary=8,x.storage=8):M.isVector3||M.isColor?(x.boundary=16,x.storage=12):M.isVector4?(x.boundary=16,x.storage=16):M.isMatrix3?(x.boundary=48,x.storage=48):M.isMatrix4?(x.boundary=64,x.storage=64):M.isTexture?Ce("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(M)?(x.boundary=16,x.storage=M.byteLength):Ce("WebGLRenderer: Unsupported uniform value type.",M),x}function w(M){const x=M.target;x.removeEventListener("dispose",w);const S=s.indexOf(x.__bindingPointIndex);s.splice(S,1),i.deleteBuffer(r[x.id]),delete r[x.id],delete a[x.id]}function C(){for(const M in r)i.deleteBuffer(r[M]);s=[],r={},a={}}return{bind:c,update:l,dispose:C}}const om=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]);let on=null;function lm(){return on===null&&(on=new wi(om,16,16,Kn,pn),on.name="DFG_LUT",on.minFilter=wt,on.magFilter=wt,on.wrapS=Xt,on.wrapT=Xt,on.generateMipmaps=!1,on.needsUpdate=!0),on}class cm{constructor(e={}){const{canvas:t=h0(),context:n=null,depth:r=!0,stencil:a=!1,alpha:s=!1,antialias:o=!1,premultipliedAlpha:c=!0,preserveDrawingBuffer:l=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:p=!1,reversedDepthBuffer:d=!1,outputBufferType:v=Nt}=e;this.isWebGLRenderer=!0;let g;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");g=n.getContextAttributes().alpha}else g=s;const m=v,u=new Set([$s,Ys,qs]),f=new Set([Nt,qt,$i,Ki,Xs,js]),w=new Uint32Array(4),C=new Int32Array(4),M=new O;let x=null,S=null;const R=[],_=[];let E=null;this.domElement=t,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=fn,this.toneMappingExposure=1,this.transmissionResolutionScale=1;const L=this;let T=!1,P=null,U=null,D=null,z=null;this._outputColorSpace=Wt;let W=0,j=0,Z=null,I=-1,q=null;const Q=new nt,Me=new nt;let we=null;const Ze=new qe(0);let Fe=0,He=t.width,Y=t.height,ee=1,_e=null,Le=null;const ve=new nt(0,0,He,Y),Ne=new nt(0,0,He,Y);let mt=!1;const Be=new tc;let Xe=!1,rt=!1;const ze=new pe,lt=new O,xt=new nt,It={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let ct=!1;function ht(){return Z===null?ee:1}let B=n;function St(b,N){return t.getContext(b,N)}let Je,A,y,k,H,$,ie,re,K,te,ae,Ee,ce,se,Re,Ae,De,F,oe,J,le,fe,ne;try{const b={alpha:!0,depth:r,stencil:a,antialias:o,premultipliedAlpha:c,preserveDrawingBuffer:l,powerPreference:h,failIfMajorPerformanceCaveat:p};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${Ws}`),t.addEventListener("webglcontextlost",at,!1),t.addEventListener("webglcontextrestored",Ye,!1),t.addEventListener("webglcontextcreationerror",Yt,!1),B===null){const N="webgl2";if(B=St(N,b),B===null)throw St(N)?new Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes."):new Error("THREE.WebGLRenderer: Error creating WebGL context.")}Te()}catch(b){throw t.removeEventListener("webglcontextlost",at,!1),t.removeEventListener("webglcontextrestored",Ye,!1),t.removeEventListener("webglcontextcreationerror",Yt,!1),je("WebGLRenderer: "+b.message),b}function Te(){Je=new lf(B),Je.init(),le=new Qp(B,Je),A=new Zd(B,Je,e,le),y=new Zp(B,Je),A.reversedDepthBuffer&&d&&y.buffers.depth.setReversed(!0),U=B.createFramebuffer(),D=B.createFramebuffer(),z=B.createFramebuffer(),k=new hf(B),H=new Bp,$=new Jp(B,Je,y,H,A,le,k),ie=new of(L),re=new du(B),fe=new $d(B,re),K=new cf(B,re,k,fe),te=new ff(B,K,re,fe,k),F=new df(B,A,$),Re=new Jd(H),ae=new Fp(L,ie,Je,A,fe,Re),Ee=new am(L,H),ce=new zp,se=new Xp(Je),De=new Yd(L,ie,y,te,g,c),Ae=new Kp(L,te,A),ne=new sm(B,k,A,y),oe=new Kd(B,Je,k),J=new uf(B,Je,k),k.programs=ae.programs,L.capabilities=A,L.extensions=Je,L.properties=H,L.renderLists=ce,L.shadowMap=Ae,L.state=y,L.info=k}m!==Nt&&(E=new mf(m,t.width,t.height,o,r,a));const be=new im(L,B);this.xr=be,this.getContext=function(){return B},this.getContextAttributes=function(){return B.getContextAttributes()},this.forceContextLoss=function(){const b=Je.get("WEBGL_lose_context");b&&b.loseContext()},this.forceContextRestore=function(){const b=Je.get("WEBGL_lose_context");b&&b.restoreContext()},this.getPixelRatio=function(){return ee},this.setPixelRatio=function(b){b!==void 0&&(ee=b,this.setSize(He,Y,!1))},this.getSize=function(b){return b.set(He,Y)},this.setSize=function(b,N,X=!0){if(be.isPresenting){Ce("WebGLRenderer: Can't change size while VR device is presenting.");return}He=b,Y=N,t.width=Math.floor(b*ee),t.height=Math.floor(N*ee),X===!0&&(t.style.width=b+"px",t.style.height=N+"px"),E!==null&&E.setSize(t.width,t.height),this.setViewport(0,0,b,N)},this.getDrawingBufferSize=function(b){return b.set(He*ee,Y*ee).floor()},this.setDrawingBufferSize=function(b,N,X){He=b,Y=N,ee=X,t.width=Math.floor(b*X),t.height=Math.floor(N*X),this.setViewport(0,0,b,N)},this.setEffects=function(b){if(m===Nt){je("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(b){for(let N=0;N<b.length;N++)if(b[N].isOutputPass===!0){Ce("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}E.setEffects(b||[])},this.getCurrentViewport=function(b){return b.copy(Q)},this.getViewport=function(b){return b.copy(ve)},this.setViewport=function(b,N,X,G){b.isVector4?ve.set(b.x,b.y,b.z,b.w):ve.set(b,N,X,G),y.viewport(Q.copy(ve).multiplyScalar(ee).round())},this.getScissor=function(b){return b.copy(Ne)},this.setScissor=function(b,N,X,G){b.isVector4?Ne.set(b.x,b.y,b.z,b.w):Ne.set(b,N,X,G),y.scissor(Me.copy(Ne).multiplyScalar(ee).round())},this.getScissorTest=function(){return mt},this.setScissorTest=function(b){y.setScissorTest(mt=b)},this.setOpaqueSort=function(b){_e=b},this.setTransparentSort=function(b){Le=b},this.getClearColor=function(b){return b.copy(De.getClearColor())},this.setClearColor=function(){De.setClearColor(...arguments)},this.getClearAlpha=function(){return De.getClearAlpha()},this.setClearAlpha=function(){De.setClearAlpha(...arguments)},this.clear=function(b=!0,N=!0,X=!0){let G=0;if(b){let V=!1;if(Z!==null){const de=Z.texture.format;V=u.has(de)}if(V){const de=Z.texture.type,ge=f.has(de),he=De.getClearColor(),ye=De.getClearAlpha(),Se=he.r,Ue=he.g,Oe=he.b;ge?(w[0]=Se,w[1]=Ue,w[2]=Oe,w[3]=ye,B.clearBufferuiv(B.COLOR,0,w)):(C[0]=Se,C[1]=Ue,C[2]=Oe,C[3]=ye,B.clearBufferiv(B.COLOR,0,C))}else G|=B.COLOR_BUFFER_BIT}N&&(G|=B.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),X&&(G|=B.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),G!==0&&B.clear(G)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(b){b.setRenderer(this),P=b},this.dispose=function(){t.removeEventListener("webglcontextlost",at,!1),t.removeEventListener("webglcontextrestored",Ye,!1),t.removeEventListener("webglcontextcreationerror",Yt,!1),De.dispose(),ce.dispose(),se.dispose(),H.dispose(),ie.dispose(),te.dispose(),fe.dispose(),ne.dispose(),ae.dispose(),be.dispose(),be.removeEventListener("sessionstart",lo),be.removeEventListener("sessionend",co),On.stop()};function at(b){b.preventDefault(),jr("WebGLRenderer: Context Lost."),T=!0}function Ye(){jr("WebGLRenderer: Context Restored."),T=!1;const b=k.autoReset,N=Ae.enabled,X=Ae.autoUpdate,G=Ae.needsUpdate,V=Ae.type;Te(),k.autoReset=b,Ae.enabled=N,Ae.autoUpdate=X,Ae.needsUpdate=G,Ae.type=V}function Yt(b){je("WebGLRenderer: A WebGL context could not be created. Reason: ",b.statusMessage)}function rn(b){const N=b.target;N.removeEventListener("dispose",rn),Sc(N)}function Sc(b){Mc(b),H.remove(b)}function Mc(b){const N=H.get(b).programs;N!==void 0&&(N.forEach(function(X){ae.releaseProgram(X)}),b.isShaderMaterial&&ae.releaseShaderCache(b))}this.renderBufferDirect=function(b,N,X,G,V,de){N===null&&(N=It);const ge=V.isMesh&&V.matrixWorld.determinantAffine()<0,he=Tc(b,N,X,G,V);y.setMaterial(G,ge);let ye=X.index,Se=1;if(G.wireframe===!0){if(ye=K.getWireframeAttribute(X),ye===void 0)return;Se=2}const Ue=X.drawRange,Oe=X.attributes.position;let xe=Ue.start*Se,$e=(Ue.start+Ue.count)*Se;de!==null&&(xe=Math.max(xe,de.start*Se),$e=Math.min($e,(de.start+de.count)*Se)),ye!==null?(xe=Math.max(xe,0),$e=Math.min($e,ye.count)):Oe!=null&&(xe=Math.max(xe,0),$e=Math.min($e,Oe.count));const dt=$e-xe;if(dt<0||dt===1/0)return;fe.setup(V,G,he,X,ye);let ot,it=oe;if(ye!==null&&(ot=re.get(ye),it=J,it.setIndex(ot)),V.isMesh)G.wireframe===!0?(y.setLineWidth(G.wireframeLinewidth*ht()),it.setMode(B.LINES)):it.setMode(B.TRIANGLES);else if(V.isLine){let Mt=G.linewidth;Mt===void 0&&(Mt=1),y.setLineWidth(Mt*ht()),V.isLineSegments?it.setMode(B.LINES):V.isLineLoop?it.setMode(B.LINE_LOOP):it.setMode(B.LINE_STRIP)}else V.isPoints?it.setMode(B.POINTS):V.isSprite&&it.setMode(B.TRIANGLES);if(V.isBatchedMesh)if(Je.get("WEBGL_multi_draw"))it.renderMultiDraw(V._multiDrawStarts,V._multiDrawCounts,V._multiDrawCount);else{const Mt=V._multiDrawStarts,me=V._multiDrawCounts,Tt=V._multiDrawCount,We=ye?re.get(ye).bytesPerElement:1,Vt=H.get(G).currentProgram.getUniforms();for(let an=0;an<Tt;an++)Vt.setValue(B,"_gl_DrawID",an),it.render(Mt[an]/We,me[an])}else if(V.isInstancedMesh)it.renderInstances(xe,dt,V.count);else if(X.isInstancedBufferGeometry){const Mt=X._maxInstanceCount!==void 0?X._maxInstanceCount:1/0,me=Math.min(X.instanceCount,Mt);it.renderInstances(xe,dt,me)}else it.render(xe,dt)};function oo(b,N,X,G){P!==null&&b.isNodeMaterial&&P.setObject(G,b),Xe===!0&&Re.setState(b,X,!1),b.transparent===!0&&b.side===cn&&b.forceSinglePass===!1?(b.side=Ft,b.needsUpdate=!0,rr(b,N,G),b.side=Fn,b.needsUpdate=!0,rr(b,N,G),b.side=cn):rr(b,N,G)}this.compile=function(b,N,X=null){X===null&&(X=b),P!==null&&P.renderStart(b,N,X),S=se.get(X),S.init(N),_.push(S),X.traverseVisible(function(V){V.isLight&&V.layers.test(N.layers)&&(S.pushLight(V),V.castShadow&&S.pushShadow(V))}),b!==X&&b.traverseVisible(function(V){V.isLight&&V.layers.test(N.layers)&&(S.pushLight(V),V.castShadow&&S.pushShadow(V))}),S.setupLights(),P!==null&&P.updateLights(S.state.lightsArray),rt=this.localClippingEnabled,Xe=Re.init(this.clippingPlanes,rt),Xe===!0&&Re.setGlobalState(this.clippingPlanes,N),P!==null&&Ae.render(S.state.shadowsArray,X,N);const G=new Set;return b.traverse(function(V){if(!(V.isMesh||V.isPoints||V.isLine||V.isSprite))return;const de=V.material;if(de)if(Array.isArray(de))for(let ge=0;ge<de.length;ge++){const he=de[ge];oo(he,X,N,V),G.add(he)}else oo(de,X,N,V),G.add(de)}),S=_.pop(),P!==null&&P.renderEnd(),G},this.compileAsync=function(b,N,X=null){const G=this.compile(b,N,X);return new Promise(V=>{function de(){if(G.forEach(function(ge){const ye=H.get(ge).currentProgram;(ye===void 0||ye.isReady())&&G.delete(ge)}),G.size===0){V(b);return}setTimeout(de,10)}Je.get("KHR_parallel_shader_compile")!==null?de():setTimeout(de,10)})};let oa=null;function Ec(b){oa&&oa(b)}function lo(){On.stop()}function co(){On.start()}const On=new sc;On.setAnimationLoop(Ec),typeof self<"u"&&On.setContext(self),this.setAnimationLoop=function(b){oa=b,be.setAnimationLoop(b),b===null?On.stop():On.start()},be.addEventListener("sessionstart",lo),be.addEventListener("sessionend",co),this.render=function(b,N){if(N!==void 0&&N.isCamera!==!0){je("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(T===!0)return;P!==null&&P.renderStart(b,N);const X=be.enabled===!0&&be.isPresenting===!0,G=E!==null&&(Z===null||X)&&E.begin(L,Z);if(b.matrixWorldAutoUpdate===!0&&b.updateMatrixWorld(),N.parent===null&&N.matrixWorldAutoUpdate===!0&&N.updateMatrixWorld(),be.enabled===!0&&be.isPresenting===!0&&(E===null||E.isCompositing()===!1)&&(be.cameraAutoUpdate===!0&&be.updateCamera(N),N=be.getCamera()),b.isScene===!0&&b.onBeforeRender(L,b,N,Z),S=se.get(b,_.length),S.init(N),S.state.textureUnits=$.getTextureUnits(),_.push(S),ze.multiplyMatrices(N.projectionMatrix,N.matrixWorldInverse),Be.setFromProjectionMatrix(ze,un,N.reversedDepth),rt=this.localClippingEnabled,Xe=Re.init(this.clippingPlanes,rt),x=ce.get(b,R.length),x.init(),R.push(x),be.enabled===!0&&be.isPresenting===!0){const ge=L.xr.getDepthSensingMesh();ge!==null&&la(ge,N,-1/0,L.sortObjects)}la(b,N,0,L.sortObjects),x.finish(),P!==null&&P.updateLights(S.state.lightsArray),L.sortObjects===!0&&x.sort(_e,Le),ct=be.enabled===!1||be.isPresenting===!1||be.hasDepthSensing()===!1,ct&&De.addToRenderList(x,b),this.info.render.frame++,this.info.autoReset===!0&&this.info.reset(),Xe===!0&&Re.beginShadows();const V=S.state.shadowsArray;if(Ae.render(V,b,N),Xe===!0&&Re.endShadows(),(G&&E.hasRenderPass())===!1){const ge=x.opaque,he=x.transmissive;if(S.setupLights(),N.isArrayCamera){const ye=N.cameras;if(he.length>0)for(let Se=0,Ue=ye.length;Se<Ue;Se++){const Oe=ye[Se];ho(ge,he,b,Oe)}ct&&De.render(b);for(let Se=0,Ue=ye.length;Se<Ue;Se++){const Oe=ye[Se];uo(x,b,Oe,Oe.viewport)}}else he.length>0&&ho(ge,he,b,N),ct&&De.render(b),uo(x,b,N)}Z!==null&&j===0&&($.updateMultisampleRenderTarget(Z),$.updateRenderTargetMipmap(Z)),G&&E.end(L),b.isScene===!0&&b.onAfterRender(L,b,N),fe.resetDefaultState(),I=-1,q=null,_.pop(),_.length>0?(S=_[_.length-1],$.setTextureUnits(S.state.textureUnits),Xe===!0&&Re.setGlobalState(L.clippingPlanes,S.state.camera)):S=null,R.pop(),R.length>0?x=R[R.length-1]:x=null,P!==null&&P.renderEnd()};function la(b,N,X,G){if(b.visible===!1)return;if(b.layers.test(N.layers)){if(b.isGroup)X=b.renderOrder;else if(b.isLOD)b.autoUpdate===!0&&b.update(N);else if(b.isLightProbeGrid)S.pushLightProbeGrid(b);else if(b.isLight)S.pushLight(b),b.castShadow&&S.pushShadow(b);else if(b.isSprite){if(!b.frustumCulled||b.intersectsFrustum(Be)){G&&xt.setFromMatrixPosition(b.matrixWorld).applyMatrix4(ze);const ge=te.update(b),he=b.material;he.visible&&x.push(b,ge,he,X,xt.z,null,N)}}else if((b.isMesh||b.isLine||b.isPoints)&&(!b.frustumCulled||b.intersectsFrustum(Be))){const ge=te.update(b),he=b.material;if(G&&(b.boundingSphere!==void 0?(b.boundingSphere===null&&b.computeBoundingSphere(),xt.copy(b.boundingSphere.center)):(ge.boundingSphere===null&&ge.computeBoundingSphere(),xt.copy(ge.boundingSphere.center)),xt.applyMatrix4(b.matrixWorld).applyMatrix4(ze)),Array.isArray(he)){const ye=ge.groups;for(let Se=0,Ue=ye.length;Se<Ue;Se++){const Oe=ye[Se],xe=he[Oe.materialIndex];xe&&xe.visible&&x.push(b,ge,xe,X,xt.z,Oe,N)}}else he.visible&&x.push(b,ge,he,X,xt.z,null,N)}}const de=b.children;for(let ge=0,he=de.length;ge<he;ge++)la(de[ge],N,X,G)}function uo(b,N,X,G){const{opaque:V,transmissive:de,transparent:ge}=b;S.setupLightsView(X),Xe===!0&&Re.setGlobalState(L.clippingPlanes,X),G&&y.viewport(Q.copy(G)),V.length>0&&ir(V,N,X),de.length>0&&ir(de,N,X),ge.length>0&&ir(ge,N,X),y.buffers.depth.setTest(!0),y.buffers.depth.setMask(!0),y.buffers.color.setMask(!0),y.setPolygonOffset(!1)}function ho(b,N,X,G){if((X.isScene===!0?X.overrideMaterial:null)!==null)return;if(S.state.transmissionRenderTarget[G.id]===void 0){const xe=Je.has("EXT_color_buffer_half_float")||Je.has("EXT_color_buffer_float");S.state.transmissionRenderTarget[G.id]=new Ut(1,1,{generateMipmaps:!0,type:xe?pn:Nt,minFilter:jn,samples:Math.max(4,A.samples),stencilBuffer:a,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:Ge.workingColorSpace})}const de=S.state.transmissionRenderTarget[G.id],ge=G.viewport||Q;de.setSize(ge.z*L.transmissionResolutionScale,ge.w*L.transmissionResolutionScale);const he=L.getRenderTarget(),ye=L.getActiveCubeFace(),Se=L.getActiveMipmapLevel();L.setRenderTarget(de),L.getClearColor(Ze),Fe=L.getClearAlpha(),Fe<1&&L.setClearColor(16777215,.5),L.clear(),ct&&De.render(X);const Ue=L.toneMapping;L.toneMapping=fn;const Oe=G.viewport;if(G.viewport!==void 0&&(G.viewport=void 0),S.setupLightsView(G),Xe===!0&&Re.setGlobalState(L.clippingPlanes,G),ir(b,X,G),$.updateMultisampleRenderTarget(de),$.updateRenderTargetMipmap(de),Je.has("WEBGL_multisampled_render_to_texture")===!1){let xe=!1;for(let $e=0,dt=N.length;$e<dt;$e++){const ot=N[$e],{object:it,geometry:Mt,material:me,group:Tt}=ot;if(me.side===cn&&it.layers.test(G.layers)){const We=me.side;me.side=Ft,me.needsUpdate=!0,fo(it,X,G,Mt,me,Tt),me.side=We,me.needsUpdate=!0,xe=!0}}xe===!0&&($.updateMultisampleRenderTarget(de),$.updateRenderTargetMipmap(de))}L.setRenderTarget(he,ye,Se),L.setClearColor(Ze,Fe),Oe!==void 0&&(G.viewport=Oe),L.toneMapping=Ue}function ir(b,N,X){const G=N.isScene===!0?N.overrideMaterial:null;for(let V=0,de=b.length;V<de;V++){const ge=b[V],{object:he,geometry:ye,group:Se}=ge;let Ue=ge.material;Ue.allowOverride===!0&&G!==null&&(Ue=G),he.layers.test(X.layers)&&fo(he,N,X,ye,Ue,Se)}}function fo(b,N,X,G,V,de){P!==null&&V.isNodeMaterial&&P.setObject(b,V),b.onBeforeRender(L,N,X,G,V,de),b.modelViewMatrix.multiplyMatrices(X.matrixWorldInverse,b.matrixWorld),b.normalMatrix.getNormalMatrix(b.modelViewMatrix),V.onBeforeRender(L,N,X,G,b,de),V.transparent===!0&&V.side===cn&&V.forceSinglePass===!1?(V.side=Ft,V.needsUpdate=!0,L.renderBufferDirect(X,N,G,V,b,de),V.side=Fn,V.needsUpdate=!0,L.renderBufferDirect(X,N,G,V,b,de),V.side=cn):L.renderBufferDirect(X,N,G,V,b,de),b.onAfterRender(L,N,X,G,V,de)}function rr(b,N,X){N.isScene!==!0&&(N=It);const G=H.get(b),V=S.state.lights,de=S.state.shadowsArray,ge=V.state.version,he=ae.getParameters(b,V.state,de,N,X,S.state.lightProbeGridArray),ye=ae.getProgramCacheKey(he);let Se=G.programs;G.environment=b.isMeshStandardMaterial||b.isMeshLambertMaterial||b.isMeshPhongMaterial?N.environment:null,G.fog=N.fog;const Ue=b.isMeshStandardMaterial||b.isMeshLambertMaterial&&!b.envMap||b.isMeshPhongMaterial&&!b.envMap;G.envMap=ie.get(b.envMap||G.environment,Ue),G.envMapRotation=G.environment!==null&&b.envMap===null?N.environmentRotation:b.envMapRotation,Se===void 0&&(b.addEventListener("dispose",rn),Se=new Map,G.programs=Se);let Oe=Se.get(ye);if(Oe!==void 0){if(G.currentProgram===Oe&&G.lightsStateVersion===ge)return mo(b,he),Oe}else he.uniforms=ae.getUniforms(b),P!==null&&b.isNodeMaterial&&P.build(b,X,he),b.onBeforeCompile(he,L),Oe=ae.acquireProgram(he,ye),Se.set(ye,Oe),G.uniforms=he.uniforms;const xe=G.uniforms;return(!b.isShaderMaterial&&!b.isRawShaderMaterial||b.clipping===!0)&&(xe.clippingPlanes=Re.uniform),mo(b,he),G.needsLights=Cc(b),G.lightsStateVersion=ge,G.needsLights&&(xe.ambientLightColor.value=V.state.ambient,xe.lightProbe.value=V.state.probe,xe.sunLights.value=V.state.sun,xe.sunLightShadows.value=V.state.sunShadow,xe.directionalLights.value=V.state.directional,xe.directionalLightShadows.value=V.state.directionalShadow,xe.spotLights.value=V.state.spot,xe.spotLightShadows.value=V.state.spotShadow,xe.rectAreaLights.value=V.state.rectArea,xe.ltc_1.value=V.state.rectAreaLTC1,xe.ltc_2.value=V.state.rectAreaLTC2,xe.pointLights.value=V.state.point,xe.pointLightShadows.value=V.state.pointShadow,xe.hemisphereLights.value=V.state.hemi,xe.sunShadowMatrix.value=V.state.sunShadowMatrix,xe.sunShadowCascade.value=V.state.sunShadowCascade,xe.directionalShadowMatrix.value=V.state.directionalShadowMatrix,xe.spotLightMatrix.value=V.state.spotLightMatrix,xe.spotLightMap.value=V.state.spotLightMap,xe.pointShadowMatrix.value=V.state.pointShadowMatrix),G.lightProbeGrid=S.state.lightProbeGridArray.length>0,G.currentProgram=Oe,G.uniformsList=null,Oe}function po(b){if(b.uniformsList===null){const N=b.currentProgram.getUniforms();b.uniformsList=Br.seqWithValue(N.seq,b.uniforms)}return b.uniformsList}function mo(b,N){const X=H.get(b);X.outputColorSpace=N.outputColorSpace,X.batching=N.batching,X.batchingColor=N.batchingColor,X.instancing=N.instancing,X.instancingColor=N.instancingColor,X.instancingMorph=N.instancingMorph,X.skinning=N.skinning,X.morphTargets=N.morphTargets,X.morphNormals=N.morphNormals,X.morphColors=N.morphColors,X.morphTargetsCount=N.morphTargetsCount,X.numClippingPlanes=N.numClippingPlanes,X.numIntersection=N.numClipIntersection,X.vertexAlphas=N.vertexAlphas,X.vertexTangents=N.vertexTangents,X.toneMapping=N.toneMapping}function Rc(b,N){if(b.length===0)return null;if(b.length===1)return b[0].texture!==null?b[0]:null;M.setFromMatrixPosition(N.matrixWorld);for(let X=0,G=b.length;X<G;X++){const V=b[X];if(V.texture!==null&&V.boundingBox.containsPoint(M))return V}return null}function Tc(b,N,X,G,V){N.isScene!==!0&&(N=It),$.resetTextureUnits();const de=N.fog,ge=G.isMeshStandardMaterial||G.isMeshLambertMaterial||G.isMeshPhongMaterial?N.environment:null,he=Z===null?L.outputColorSpace:Z.isXRRenderTarget===!0?Z.texture.colorSpace:Ge.workingColorSpace,ye=G.isMeshStandardMaterial||G.isMeshLambertMaterial&&!G.envMap||G.isMeshPhongMaterial&&!G.envMap,Se=ie.get(G.envMap||ge,ye),Ue=G.vertexColors===!0&&!!X.attributes.color&&X.attributes.color.itemSize===4,Oe=!!X.attributes.tangent&&(!!G.normalMap||G.anisotropy>0),xe=!!X.morphAttributes.position,$e=!!X.morphAttributes.normal,dt=!!X.morphAttributes.color;let ot=fn;G.toneMapped&&(Z===null||Z.isXRRenderTarget===!0)&&(ot=L.toneMapping);const it=X.morphAttributes.position||X.morphAttributes.normal||X.morphAttributes.color,Mt=it!==void 0?it.length:0,me=H.get(G),Tt=S.state.lights;if(Xe===!0&&(rt===!0||b!==q)){const st=b===q&&G.id===I;Re.setState(G,b,st)}let We=!1;G.version===me.__version?(me.needsLights&&me.lightsStateVersion!==Tt.state.version||me.outputColorSpace!==he||V.isBatchedMesh&&me.batching===!1||!V.isBatchedMesh&&me.batching===!0||V.isBatchedMesh&&me.batchingColor===!0&&V._colorsTexture===null||V.isBatchedMesh&&me.batchingColor===!1&&V._colorsTexture!==null||V.isInstancedMesh&&me.instancing===!1||!V.isInstancedMesh&&me.instancing===!0||V.isSkinnedMesh&&me.skinning===!1||!V.isSkinnedMesh&&me.skinning===!0||V.isInstancedMesh&&me.instancingColor===!0&&V.instanceColor===null||V.isInstancedMesh&&me.instancingColor===!1&&V.instanceColor!==null||V.isInstancedMesh&&me.instancingMorph===!0&&V.morphTexture===null||V.isInstancedMesh&&me.instancingMorph===!1&&V.morphTexture!==null||me.envMap!==Se||G.fog===!0&&me.fog!==de||me.numClippingPlanes!==void 0&&(me.numClippingPlanes!==Re.numPlanes||me.numIntersection!==Re.numIntersection)||me.vertexAlphas!==Ue||me.vertexTangents!==Oe||me.morphTargets!==xe||me.morphNormals!==$e||me.morphColors!==dt||me.toneMapping!==ot||me.morphTargetsCount!==Mt||!!me.lightProbeGrid!=S.state.lightProbeGridArray.length>0)&&(We=!0):(We=!0,me.__version=G.version);let Vt=me.currentProgram;We===!0&&(Vt=rr(G,N,V),P&&G.isNodeMaterial&&P.onUpdateProgram(G,Vt,me));let an=!1,Tn=!1,ni=!1;const tt=Vt.getUniforms(),ut=me.uniforms;if(y.useProgram(Vt.program)&&(an=!0,Tn=!0,ni=!0),G.id!==I&&(I=G.id,Tn=!0),me.needsLights){const st=Rc(S.state.lightProbeGridArray,V);me.lightProbeGrid!==st&&(me.lightProbeGrid=st,Tn=!0)}if(an||q!==b){y.buffers.depth.getReversed()&&b.reversedDepth!==!0&&(b._reversedDepth=!0,b.updateProjectionMatrix()),tt.setValue(B,"projectionMatrix",b.projectionMatrix),tt.setValue(B,"viewMatrix",b.matrixWorldInverse);const Cn=tt.map.cameraPosition;Cn!==void 0&&Cn.setValue(B,lt.setFromMatrixPosition(b.matrixWorld)),A.logarithmicDepthBuffer&&tt.setValue(B,"logDepthBufFC",2/(Math.log(b.far+1)/Math.LN2)),(G.isMeshPhongMaterial||G.isMeshToonMaterial||G.isMeshLambertMaterial||G.isMeshBasicMaterial||G.isMeshStandardMaterial||G.isShaderMaterial)&&tt.setValue(B,"isOrthographic",b.isOrthographicCamera===!0),q!==b&&(q=b,Tn=!0,ni=!0)}if(me.needsLights&&(Tt.state.sunShadowMap.length>0&&tt.setValue(B,"sunShadowMap",Tt.state.sunShadowMap,$),Tt.state.directionalShadowMap.length>0&&tt.setValue(B,"directionalShadowMap",Tt.state.directionalShadowMap,$),Tt.state.spotShadowMap.length>0&&tt.setValue(B,"spotShadowMap",Tt.state.spotShadowMap,$),Tt.state.pointShadowMap.length>0&&tt.setValue(B,"pointShadowMap",Tt.state.pointShadowMap,$)),V.isSkinnedMesh){tt.setOptional(B,V,"bindMatrix"),tt.setOptional(B,V,"bindMatrixInverse");const st=V.skeleton;st&&(st.boneTexture===null&&st.computeBoneTexture(),tt.setValue(B,"boneTexture",st.boneTexture,$))}V.isBatchedMesh&&(tt.setOptional(B,V,"batchingTexture"),tt.setValue(B,"batchingTexture",V._matricesTexture,$),tt.setOptional(B,V,"batchingIdTexture"),tt.setValue(B,"batchingIdTexture",V._indirectTexture,$),tt.setOptional(B,V,"batchingColorTexture"),V._colorsTexture!==null&&tt.setValue(B,"batchingColorTexture",V._colorsTexture,$));const An=X.morphAttributes;if((An.position!==void 0||An.normal!==void 0||An.color!==void 0)&&F.update(V,X,Vt),(Tn||me.receiveShadow!==V.receiveShadow)&&(me.receiveShadow=V.receiveShadow,tt.setValue(B,"receiveShadow",V.receiveShadow)),(G.isMeshStandardMaterial||G.isMeshLambertMaterial||G.isMeshPhongMaterial)&&G.envMap===null&&N.environment!==null&&(ut.envMapIntensity.value=N.environmentIntensity),ut.dfgLUT!==void 0&&(ut.dfgLUT.value=lm()),Tn){if(tt.setValue(B,"toneMappingExposure",L.toneMappingExposure),me.needsLights&&Ac(ut,ni),de&&G.fog===!0&&Ee.refreshFogUniforms(ut,de),Ee.refreshMaterialUniforms(ut,G,ee,Y,S.state.transmissionRenderTarget[b.id]),me.needsLights&&me.lightProbeGrid){const st=me.lightProbeGrid;ut.probesSH.value=st.texture,ut.probesMin.value.copy(st.boundingBox.min),ut.probesMax.value.copy(st.boundingBox.max),ut.probesResolution.value.copy(st.resolution)}Br.upload(B,po(me),ut,$)}if(G.isShaderMaterial&&G.uniformsNeedUpdate===!0&&(Br.upload(B,po(me),ut,$),G.uniformsNeedUpdate=!1),G.isSpriteMaterial&&tt.setValue(B,"center",V.center),tt.setValue(B,"modelViewMatrix",V.modelViewMatrix),tt.setValue(B,"normalMatrix",V.normalMatrix),tt.setValue(B,"modelMatrix",V.matrixWorld),G.uniformsGroups!==void 0){const st=G.uniformsGroups;for(let Cn=0,ii=st.length;Cn<ii;Cn++){const go=st[Cn];ne.update(go,Vt),ne.bind(go,Vt)}}return Vt}function Ac(b,N){b.ambientLightColor.needsUpdate=N,b.lightProbe.needsUpdate=N,b.sunLights.needsUpdate=N,b.sunLightShadows.needsUpdate=N,b.directionalLights.needsUpdate=N,b.directionalLightShadows.needsUpdate=N,b.pointLights.needsUpdate=N,b.pointLightShadows.needsUpdate=N,b.spotLights.needsUpdate=N,b.spotLightShadows.needsUpdate=N,b.rectAreaLights.needsUpdate=N,b.hemisphereLights.needsUpdate=N}function Cc(b){return b.isMeshLambertMaterial||b.isMeshToonMaterial||b.isMeshPhongMaterial||b.isMeshStandardMaterial||b.isShadowMaterial||b.isShaderMaterial&&b.lights===!0}this.getActiveCubeFace=function(){return W},this.getActiveMipmapLevel=function(){return j},this.getRenderTarget=function(){return Z},this.setRenderTargetTextures=function(b,N,X){const G=H.get(b);G.__autoAllocateDepthBuffer=b.resolveDepthBuffer===!1,G.__autoAllocateDepthBuffer===!1&&(G.__useRenderToTexture=!1),H.get(b.texture).__webglTexture=N,H.get(b.depthTexture).__webglTexture=G.__autoAllocateDepthBuffer?void 0:X,G.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(b,N){const X=H.get(b);X.__webglFramebuffer=N,X.__useDefaultFramebuffer=N===void 0},this.setRenderTarget=function(b,N=0,X=0){Z=b,W=N,j=X;let G=null,V=!1,de=!1;if(b){const he=H.get(b);if(he.__useDefaultFramebuffer!==void 0){y.bindFramebuffer(B.FRAMEBUFFER,he.__webglFramebuffer),Q.copy(b.viewport),Me.copy(b.scissor),we=b.scissorTest,y.viewport(Q),y.scissor(Me),y.setScissorTest(we),I=-1;return}else if(he.__webglFramebuffer===void 0)$.setupRenderTarget(b);else if(he.__hasExternalTextures)$.rebindTextures(b,H.get(b.texture).__webglTexture,H.get(b.depthTexture).__webglTexture);else if(b.depthBuffer){const Ue=b.depthTexture;if(he.__boundDepthTexture!==Ue){if(Ue!==null&&H.has(Ue)&&(b.width!==Ue.image.width||b.height!==Ue.image.height))throw new Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");$.setupDepthRenderbuffer(b)}}const ye=b.texture;(ye.isData3DTexture||ye.isDataArrayTexture||ye.isCompressedArrayTexture)&&(de=!0);const Se=H.get(b).__webglFramebuffer;b.isWebGLCubeRenderTarget?(Array.isArray(Se[N])?G=Se[N][X]:G=Se[N],V=!0):b.samples>0&&$.useMultisampledRTT(b)===!1?G=H.get(b).__webglMultisampledFramebuffer:Array.isArray(Se)?G=Se[X]:G=Se,Q.copy(b.viewport),Me.copy(b.scissor),we=b.scissorTest}else Q.copy(ve).multiplyScalar(ee).floor(),Me.copy(Ne).multiplyScalar(ee).floor(),we=mt;if(X!==0&&(G=U),y.bindFramebuffer(B.FRAMEBUFFER,G)&&y.drawBuffers(b,G),y.viewport(Q),y.scissor(Me),y.setScissorTest(we),V){const he=H.get(b.texture);B.framebufferTexture2D(B.FRAMEBUFFER,B.COLOR_ATTACHMENT0,B.TEXTURE_CUBE_MAP_POSITIVE_X+N,he.__webglTexture,X)}else if(de){const he=N;for(let ye=0;ye<b.textures.length;ye++){const Se=H.get(b.textures[ye]);B.framebufferTextureLayer(B.FRAMEBUFFER,B.COLOR_ATTACHMENT0+ye,Se.__webglTexture,X,he)}}else if(b!==null&&X!==0){const he=H.get(b.texture);B.framebufferTexture2D(B.FRAMEBUFFER,B.COLOR_ATTACHMENT0,B.TEXTURE_2D,he.__webglTexture,X)}I=-1};function vo(b){const N=H.get(b);return(N.__readFormat!==b.format||N.__readType!==b.type)&&(N.__readFormat=b.format,N.__readType=b.type,N.__formatReadable=A.textureFormatReadable(b.format),N.__typeReadable=A.textureTypeReadable(b.type)),N}this.readRenderTargetPixels=function(b,N,X,G,V,de,ge,he=0){if(!(b&&b.isWebGLRenderTarget)){je("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let ye=H.get(b).__webglFramebuffer;if(b.isWebGLCubeRenderTarget&&ge!==void 0&&(ye=ye[ge]),ye){y.bindFramebuffer(B.FRAMEBUFFER,ye);try{const Se=b.textures[he],Ue=Se.format,Oe=Se.type;b.textures.length>1&&B.readBuffer(B.COLOR_ATTACHMENT0+he);const xe=vo(Se);if(xe.__formatReadable===!1){je("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(xe.__typeReadable===!1){je("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}N>=0&&N<=b.width-G&&X>=0&&X<=b.height-V&&B.readPixels(N,X,G,V,le.convert(Ue),le.convert(Oe),de)}finally{const Se=Z!==null?H.get(Z).__webglFramebuffer:null;y.bindFramebuffer(B.FRAMEBUFFER,Se)}}},this.readRenderTargetPixelsAsync=async function(b,N,X,G,V,de,ge,he=0){if(!(b&&b.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let ye=H.get(b).__webglFramebuffer;if(b.isWebGLCubeRenderTarget&&ge!==void 0&&(ye=ye[ge]),ye)if(N>=0&&N<=b.width-G&&X>=0&&X<=b.height-V){y.bindFramebuffer(B.FRAMEBUFFER,ye);const Se=b.textures[he],Ue=Se.format,Oe=Se.type;b.textures.length>1&&B.readBuffer(B.COLOR_ATTACHMENT0+he);const xe=vo(Se);if(xe.__formatReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(xe.__typeReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");const $e=B.createBuffer();B.bindBuffer(B.PIXEL_PACK_BUFFER,$e),B.bufferData(B.PIXEL_PACK_BUFFER,de.byteLength,B.STREAM_READ),B.readPixels(N,X,G,V,le.convert(Ue),le.convert(Oe),0),B.bindBuffer(B.PIXEL_PACK_BUFFER,null);const dt=Z!==null?H.get(Z).__webglFramebuffer:null;y.bindFramebuffer(B.FRAMEBUFFER,dt);const ot=B.fenceSync(B.SYNC_GPU_COMMANDS_COMPLETE,0);return B.flush(),await d0(B,ot,4),B.bindBuffer(B.PIXEL_PACK_BUFFER,$e),B.getBufferSubData(B.PIXEL_PACK_BUFFER,0,de),B.bindBuffer(B.PIXEL_PACK_BUFFER,null),B.deleteBuffer($e),B.deleteSync(ot),de}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(b,N=null,X=0){const G=Math.pow(2,-X),V=Math.floor(b.image.width*G),de=Math.floor(b.image.height*G),ge=N!==null?N.x:0,he=N!==null?N.y:0;$.setTexture2D(b,0),B.copyTexSubImage2D(B.TEXTURE_2D,X,0,0,ge,he,V,de),y.unbindTexture()},this.copyTextureToTexture=function(b,N,X=null,G=null,V=0,de=0){let ge,he,ye,Se,Ue,Oe,xe,$e,dt;const ot=b.isCompressedTexture?b.mipmaps[de]:b.image;if(X!==null)ge=X.max.x-X.min.x,he=X.max.y-X.min.y,ye=X.isBox3?X.max.z-X.min.z:1,Se=X.min.x,Ue=X.min.y,Oe=X.isBox3?X.min.z:0;else{const ut=Math.pow(2,-V);ge=Math.floor(ot.width*ut),he=Math.floor(ot.height*ut),b.isDataArrayTexture?ye=ot.depth:b.isData3DTexture?ye=Math.floor(ot.depth*ut):ye=1,Se=0,Ue=0,Oe=0}G!==null?(xe=G.x,$e=G.y,dt=G.z):(xe=0,$e=0,dt=0);const it=le.convert(N.format),Mt=le.convert(N.type);let me;N.isData3DTexture?($.setTexture3D(N,0),me=B.TEXTURE_3D):N.isDataArrayTexture||N.isCompressedArrayTexture?($.setTexture2DArray(N,0),me=B.TEXTURE_2D_ARRAY):($.setTexture2D(N,0),me=B.TEXTURE_2D),y.activeTexture(B.TEXTURE0),y.pixelStorei(B.UNPACK_FLIP_Y_WEBGL,N.flipY),y.pixelStorei(B.UNPACK_PREMULTIPLY_ALPHA_WEBGL,N.premultiplyAlpha),y.pixelStorei(B.UNPACK_ALIGNMENT,N.unpackAlignment);const Tt=y.getParameter(B.UNPACK_ROW_LENGTH),We=y.getParameter(B.UNPACK_IMAGE_HEIGHT),Vt=y.getParameter(B.UNPACK_SKIP_PIXELS),an=y.getParameter(B.UNPACK_SKIP_ROWS),Tn=y.getParameter(B.UNPACK_SKIP_IMAGES);y.pixelStorei(B.UNPACK_ROW_LENGTH,ot.width),y.pixelStorei(B.UNPACK_IMAGE_HEIGHT,ot.height),y.pixelStorei(B.UNPACK_SKIP_PIXELS,Se),y.pixelStorei(B.UNPACK_SKIP_ROWS,Ue),y.pixelStorei(B.UNPACK_SKIP_IMAGES,Oe);const ni=b.isDataArrayTexture||b.isData3DTexture,tt=N.isDataArrayTexture||N.isData3DTexture;if(b.isDepthTexture){const ut=H.get(b),An=H.get(N),st=H.get(ut.__renderTarget),Cn=H.get(An.__renderTarget);y.bindFramebuffer(B.READ_FRAMEBUFFER,st.__webglFramebuffer),y.bindFramebuffer(B.DRAW_FRAMEBUFFER,Cn.__webglFramebuffer);for(let ii=0;ii<ye;ii++)ni&&(B.framebufferTextureLayer(B.READ_FRAMEBUFFER,B.COLOR_ATTACHMENT0,H.get(b).__webglTexture,V,Oe+ii),B.framebufferTextureLayer(B.DRAW_FRAMEBUFFER,B.COLOR_ATTACHMENT0,H.get(N).__webglTexture,de,dt+ii)),B.blitFramebuffer(Se,Ue,ge,he,xe,$e,ge,he,B.DEPTH_BUFFER_BIT,B.NEAREST);y.bindFramebuffer(B.READ_FRAMEBUFFER,null),y.bindFramebuffer(B.DRAW_FRAMEBUFFER,null)}else if(V!==0||b.isRenderTargetTexture||H.has(b)){const ut=H.get(b),An=H.get(N);y.bindFramebuffer(B.READ_FRAMEBUFFER,D),y.bindFramebuffer(B.DRAW_FRAMEBUFFER,z);for(let st=0;st<ye;st++)ni?B.framebufferTextureLayer(B.READ_FRAMEBUFFER,B.COLOR_ATTACHMENT0,ut.__webglTexture,V,Oe+st):B.framebufferTexture2D(B.READ_FRAMEBUFFER,B.COLOR_ATTACHMENT0,B.TEXTURE_2D,ut.__webglTexture,V),tt?B.framebufferTextureLayer(B.DRAW_FRAMEBUFFER,B.COLOR_ATTACHMENT0,An.__webglTexture,de,dt+st):B.framebufferTexture2D(B.DRAW_FRAMEBUFFER,B.COLOR_ATTACHMENT0,B.TEXTURE_2D,An.__webglTexture,de),V!==0?B.blitFramebuffer(Se,Ue,ge,he,xe,$e,ge,he,B.COLOR_BUFFER_BIT,B.NEAREST):tt?B.copyTexSubImage3D(me,de,xe,$e,dt+st,Se,Ue,ge,he):B.copyTexSubImage2D(me,de,xe,$e,Se,Ue,ge,he);y.bindFramebuffer(B.READ_FRAMEBUFFER,null),y.bindFramebuffer(B.DRAW_FRAMEBUFFER,null)}else tt?b.isDataTexture||b.isData3DTexture?B.texSubImage3D(me,de,xe,$e,dt,ge,he,ye,it,Mt,ot.data):N.isCompressedArrayTexture?B.compressedTexSubImage3D(me,de,xe,$e,dt,ge,he,ye,it,ot.data):B.texSubImage3D(me,de,xe,$e,dt,ge,he,ye,it,Mt,ot):b.isDataTexture?B.texSubImage2D(B.TEXTURE_2D,de,xe,$e,ge,he,it,Mt,ot.data):b.isCompressedTexture?B.compressedTexSubImage2D(B.TEXTURE_2D,de,xe,$e,ot.width,ot.height,it,ot.data):B.texSubImage2D(B.TEXTURE_2D,de,xe,$e,ge,he,it,Mt,ot);y.pixelStorei(B.UNPACK_ROW_LENGTH,Tt),y.pixelStorei(B.UNPACK_IMAGE_HEIGHT,We),y.pixelStorei(B.UNPACK_SKIP_PIXELS,Vt),y.pixelStorei(B.UNPACK_SKIP_ROWS,an),y.pixelStorei(B.UNPACK_SKIP_IMAGES,Tn),de===0&&N.generateMipmaps&&B.generateMipmap(me),y.unbindTexture()},this.initRenderTarget=function(b){H.get(b).__webglFramebuffer===void 0&&$.setupRenderTarget(b)},this.initTexture=function(b){b.isCubeTexture?$.setTextureCube(b,0):b.isData3DTexture?$.setTexture3D(b,0):b.isDataArrayTexture||b.isCompressedArrayTexture?$.setTexture2DArray(b,0):$.setTexture2D(b,0),y.unbindTexture()},this.resetState=function(){W=0,j=0,Z=null,y.reset(),fe.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return un}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;const t=this.getContext();t.drawingBufferColorSpace=Ge._getDrawingBufferColorSpace(e),t.unpackColorSpace=Ge._getUnpackColorSpace()}}function pc(i,e,t,n,r,a,s=3e4,o){let c=null,l=null,h,p=!1,d=()=>{};const v=()=>{h!==void 0&&clearTimeout(h),l&&i.deleteSync(l),c&&i.deleteBuffer(c),l=null,c=null};return{promise:new Promise((m,u)=>{d=u;const f=w=>{p||(p=!0,v(),u(w instanceof Error?w:new Error(String(w))))};try{if(o&&o.length!==r*a*4)throw new Error("Avatar readback destination has the wrong length");if(c=i.createBuffer(),!c)throw new Error("Avatar readback buffer allocation failed");const w=i.getParameter(i.READ_FRAMEBUFFER_BINDING),C=i.getParameter(i.PIXEL_PACK_BUFFER_BINDING);try{i.bindFramebuffer(i.READ_FRAMEBUFFER,e),i.bindBuffer(i.PIXEL_PACK_BUFFER,c),i.bufferData(i.PIXEL_PACK_BUFFER,r*a*4,i.STREAM_READ),i.readPixels(t,n,r,a,i.RGBA,i.UNSIGNED_BYTE,0)}finally{i.bindBuffer(i.PIXEL_PACK_BUFFER,C),i.bindFramebuffer(i.READ_FRAMEBUFFER,w)}if(l=i.fenceSync(i.SYNC_GPU_COMMANDS_COMPLETE,0),!l)throw new Error("Avatar readback fence allocation failed");i.flush();const M=performance.now(),x=()=>{if(!p)try{if(i.isContextLost())throw new Error("Avatar readback context lost");const S=i.clientWaitSync(l,0,0);if(S===i.WAIT_FAILED)throw new Error("Avatar readback fence failed");if(S===i.TIMEOUT_EXPIRED){if(performance.now()-M>=s)throw new Error("Avatar readback fence timed out");h=setTimeout(x,4);return}const R=o??new Uint8Array(r*a*4),_=i.getParameter(i.PIXEL_PACK_BUFFER_BINDING);try{i.bindBuffer(i.PIXEL_PACK_BUFFER,c),i.getBufferSubData(i.PIXEL_PACK_BUFFER,0,R)}finally{i.bindBuffer(i.PIXEL_PACK_BUFFER,_)}p=!0,v(),m(R)}catch(S){f(S)}};h=setTimeout(x,4)}catch(w){f(w)}}),cancel(){p||(p=!0,v(),d(new Error("Avatar readback cancelled")))}}}function um(i){const e=i.r*.2126+i.g*.7152+i.b*.0722,t=Math.min(.68,Math.max(.21,e));if(t===e)return;const n=t>e?1:0,r=(t-e)/(n-e);i.r+=(n-i.r)*r,i.g+=(n-i.g)*r,i.b+=(n-i.b)*r}class hm{constructor(){this.samples=new WeakMap,this.frame=0,this.evaluations=0,this.copies=0}beginFrame(){this.frame++,this.evaluations=this.copies=0}register(e,t){let n=this.samples.get(e);n?n.frame!==this.frame?(n.frame=this.frame,n.time=t,n.count=1):n.time===t&&n.count++:(n={frame:this.frame,time:t,count:1,sampledFrame:-1},this.samples.set(e,n))}sample(e,t,n){const r=this.samples.get(e);if(!r||r.frame!==this.frame||r.time!==t||r.count<2){this.evaluations++,e.sample(t,n);return}r.sampledFrame!==this.frame&&(r.pose??=e.createPose(),e.sample(t,r.pose),r.sampledFrame=this.frame,this.evaluations++);const a=r.pose;if(a.length!==n.length)throw Error("Invalid shared motion output");for(let s=0;s<a.length;s++){const o=a[s],c=n[s];if(o.id!==c.id)throw Error("Shared motion pose identities differ");c.world.copy(o.world),c.normalMatrix.copy(o.normalMatrix);for(const l in o.fields){const h=o.fields[l],p=c.fields[l];for(let d=0;d<h.length;d++)p[d]=h[d]}}this.copies++}}const dm=new URL("../assets/packed-motion-alfred-base-qGBsrbI9.bin",import.meta.url).href,fm=new URL("../assets/packed-motion-blue_beret-base-BMmnGSRf.bin",import.meta.url).href,pm=new URL("../assets/packed-motion-blue_spectacles-base-svr89Z5G.bin",import.meta.url).href,mm=new URL("../assets/packed-motion-coral_monocle-base-BZF70fks.bin",import.meta.url).href,vm=new URL("../assets/packed-motion-gus-base-DMFGsmOw.bin",import.meta.url).href,gm=new URL("../assets/packed-motion-lime_frog-base-1lxQ44Sn.bin",import.meta.url).href,_m=new URL("../assets/packed-motion-lime_headphones-base-CnmCxRo5.bin",import.meta.url).href,ym=new URL("../assets/packed-motion-purple_heart-base-C9b2erxe.bin",import.meta.url).href,xm=new URL("../assets/packed-motion-alfred-work-BMHfS_E-.bin",import.meta.url).href,bm=new URL("../assets/packed-motion-blue_beret-work-yt3jMbTu.bin",import.meta.url).href,wm=new URL("../assets/packed-motion-blue_spectacles-work-CBlZ4diH.bin",import.meta.url).href,Sm=new URL("../assets/packed-motion-coral_monocle-work-5qh-uRFS.bin",import.meta.url).href,Mm=new URL("../assets/packed-motion-gus-work-DSbmf5pQ.bin",import.meta.url).href,Em=new URL("../assets/packed-motion-lime_frog-work-DyYXIUKb.bin",import.meta.url).href,Rm=new URL("../assets/packed-motion-lime_headphones-work-Cd4C4xxG.bin",import.meta.url).href,Tm=new URL("../assets/packed-motion-purple_heart-work-232eZJU3.bin",import.meta.url).href,vt=Math.fround;function fl(i){let e=Math.imul(i^i>>>16,2146121005);return e=Math.imul(e^e>>>15,-2073254261),(e>>>24^e>>>8)/16777216}function pl(i,e){return e?(i=vt(i),vt(vt(vt(i*i)*i)*vt(vt(i*vt(vt(i*6)-15))+10))):i*i*i*(i*(i*6-15)+10)}class Am{constructor(e=17){if(!Number.isInteger(e)||e<0||e>4294967295)throw Error("Breathing seed must be an unsigned 32-bit integer");this.period=5.2+.8*fl(e^599040221),this.phase=fl(e)}sample(e,t,n=!0){if(!Number.isFinite(e)||e<0)throw Error("Invalid breathing time");const r=(e/this.period+this.phase)%1;let a=r<.4?pl(r/.4,n)-.5:r<.47?.5:r<.91?.5-pl((r-.47)/.44,n):-.5;if(n)a=vt(a),t.y=vt(a*vt(.002)),t.scaleY=vt(vt(a*vt(.006))+1),t.scaleXZ=vt(1/vt(Math.sqrt(t.scaleY)));else{t.y=vt(a*.002);const s=a*.006+1;t.scaleY=vt(s),t.scaleXZ=vt(1/Math.sqrt(s))}return t}}function yi(i,e,t,n,r,a){if("value"in i){for(let s=0;s<e;s++)t[s]=i.value[s];return}for(let s=0;s<e;s++){const o=i.samples[n*e+s],c=i.samples[r*e+s];t[s]=a===0?o:a===1?c:o+(c-o)*a}}function Oi(i,e){if(i===e)return!0;if(!i||!e||"value"in i!="value"in e)return!1;const t="value"in i?i.value:i.samples,n="value"in e?e.value:e.samples;return t===n?!0:t.length===n.length&&t.every((r,a)=>Object.is(r,n[a]))}class Qn{constructor(e){if(this.clip=e,this.position=new O,this.rotation=new Bn,this.nextRotation=new Bn,this.scale=new O,this.scratch=[0,0,0,0],this.shear=[0,0,0],this.normalCorrection=Array(9).fill(0),!Number.isFinite(e.duration)||e.duration<=0||e.times.length<2||e.times[0]!==0||e.times[e.times.length-1]!==e.duration)throw Error("Invalid authored motion duration");for(let n=1;n<e.times.length;n++)if(e.times[n]<=e.times[n-1])throw Error("Motion keyframes must increase");if(!e.times.every(Number.isFinite))throw Error("Invalid motion timestamps");this.fieldEntries=e.parts.map(n=>Object.entries(n.fields)),this.transformSources=e.parts.map((n,r)=>{for(let a=0;a<r;a++){const s=e.parts[a];if(Oi(n.translation,s.translation)&&Oi(n.rotation,s.rotation)&&Oi(n.scale,s.scale)&&Oi(n.shear,s.shear)&&Oi(n.normalCorrection,s.normalCorrection))return a}return r});const t=new Set;for(const n of e.parts){if(t.has(n.id))throw Error("Duplicate motion part");t.add(n.id);for(const[s,o]of[[n.translation,3],[n.rotation,4],[n.scale,3],...n.shear?[[n.shear,3]]:[],...n.normalCorrection?[[n.normalCorrection,9]]:[],...Object.values(n.fields).map(c=>[c,4])]){const c="value"in s?s.value:s.samples;if(c.length!==o*("value"in s?1:e.times.length)||!c.every(Number.isFinite))throw Error("Invalid motion channel")}const r="value"in n.scale?n.scale.value:n.scale.samples;for(let s=0;s<r.length;s++){if(Math.abs(r[s])<=1e-10)throw Error("Singular motion scale");if(Math.sign(r[s])!==Math.sign(r[s%3]))throw Error("Motion scale crosses a singularity");if(n.shear&&s%3<2&&r[s]<0)throw Error("Affine QR requires positive first two scales")}const a="value"in n.rotation?n.rotation.value:n.rotation.samples;for(let s=0;s<a.length;s+=4)if(Math.abs(Math.hypot(...a.slice(s,s+4))-1)>1e-6)throw Error("Motion rotation must be a unit quaternion")}}createPose(){return this.clip.parts.map(e=>({id:e.id,world:new pe,normalMatrix:new pe,fields:Object.fromEntries(Object.keys(e.fields).map(t=>[t,[0,0,0,0]]))}))}sample(e,t){if(!Number.isFinite(e)||t.length!==this.clip.parts.length)throw Error("Invalid motion sampling input");const{clip:n}=this,r=n.loop?(e%n.duration+n.duration)%n.duration:Math.max(0,Math.min(e,n.duration));let a=0,s=n.times.length-1;for(;s-a>1;){const p=a+s>>>1;n.times[p]<=r?a=p:s=p}const o=n.times[a],c=n.times[s],l=8*Number.EPSILON*Math.max(1,Math.abs(r),Math.abs(o),Math.abs(c)),h=r-o<=l?0:c-r<=l?1:(r-o)/(c-o);for(let p=0;p<n.parts.length;p++){const d=n.parts[p],v=t[p];if(v.id!==d.id)throw Error("Motion pose identities differ");const g=this.transformSources[p];if(g!==p){v.world.copy(t[g].world),v.normalMatrix.copy(t[g].normalMatrix);for(const[m,u]of this.fieldEntries[p])yi(u,4,v.fields[m],a,s,h);continue}if(yi(d.translation,3,this.scratch,a,s,h),this.position.fromArray(this.scratch),yi(d.scale,3,this.scratch,a,s,h),this.scale.fromArray(this.scratch),"value"in d.rotation?this.rotation.fromArray(d.rotation.value):(this.rotation.fromArray(d.rotation.samples,a*4),this.nextRotation.fromArray(d.rotation.samples,s*4),h===1?this.rotation.copy(this.nextRotation):h!==0&&this.rotation.slerp(this.nextRotation,h)),d.shear){yi(d.shear,3,this.shear,a,s,h),v.world.makeRotationFromQuaternion(this.rotation).setPosition(this.position);const m=v.world.elements;for(let u=0;u<3;u++){const f=m[u],w=m[4+u],C=m[8+u];m[u]=f*this.scale.x,m[4+u]=f*this.shear[0]+w*this.scale.y,m[8+u]=f*this.shear[1]+w*this.shear[2]+C*this.scale.z}}else v.world.compose(this.position,this.rotation,this.scale);if(v.normalMatrix.copy(v.world).invert().transpose(),d.normalCorrection){yi(d.normalCorrection,9,this.normalCorrection,a,s,h);const m=v.normalMatrix.elements;for(let u=0;u<3;u++)for(let f=0;f<3;f++)m[u*4+f]=m[u*4+f]+this.normalCorrection[u*3+f];m[3]=m[7]=m[11]=m[12]=m[13]=m[14]=0,m[15]=1}for(const[m,u]of this.fieldEntries[p])yi(u,4,v.fields[m],a,s,h)}}}class Cm extends Qn{constructor(e,t,n=1,r=6){if(super(e),this.nativeStart=t,this.loopStart=n,this.period=r,this.breathing=new Am,this.sourceBreath={y:0,scaleY:1,scaleXZ:1},this.targetBreath={y:0,scaleY:1,scaleXZ:1},this.delta=new pe,this.normalDelta=new pe,this.scaleDelta=new pe,this.inverseBody=new pe,!Number.isFinite(t)||!Number.isFinite(n)||!Number.isFinite(r)||t<1/60||n<0||r<=0||e.duration<n+r)throw Error("Computer loop requires its complete observed interval")}sample(e,t){if(!Number.isFinite(e)||e<0)throw Error("Invalid Computer loop time");const n=e<this.loopStart?e:this.loopStart+(e-this.loopStart)%this.period;if(super.sample(n,t),n===e)return;this.breathing.sample(this.nativeStart+n-1/60,this.sourceBreath,!1),this.breathing.sample(this.nativeStart+e-1/60,this.targetBreath,!1);const r=this.targetBreath.scaleXZ/this.sourceBreath.scaleXZ,a=this.targetBreath.scaleY/this.sourceBreath.scaleY,s=t[0];if(s?.id!=="mesh:0")throw Error("Computer loop requires its body frame");this.inverseBody.copy(s.world).invert(),this.delta.copy(s.world).multiply(this.scaleDelta.makeScale(r,a,r)),this.delta.elements[13]+=this.targetBreath.y-this.sourceBreath.y,this.delta.multiply(this.inverseBody),this.normalDelta.copy(this.delta).invert().transpose(),this.normalDelta.elements[3]=this.normalDelta.elements[7]=this.normalDelta.elements[11]=0,this.normalDelta.setPosition(0,0,0);for(const o of t){const c=o.fields.referencePose?.[3];c===-4||c===-24||c===-40||(c===-16?(o.world.multiply(this.scaleDelta.makeScale(r,r,1)),o.normalMatrix.multiply(this.scaleDelta.makeScale(1/r,1/r,1))):(o.world.premultiply(this.delta),o.normalMatrix.premultiply(this.normalDelta)))}}}function io(i){const e=new DataView(i);if(i.byteLength<16||e.getUint32(0,!0)!==1179468098||e.getUint32(4,!0)!==16790582)throw Error("Invalid avatar motion binary header");const t=e.getUint32(8,!0),n=e.getUint32(12,!0),r=Math.ceil((16+t)/8)*8;if(!t||r+n*8!==i.byteLength)throw Error("Invalid avatar motion binary length");const a=new TextDecoder("utf-8",{fatal:!0}).decode(new Uint8Array(i,16,t)),s=new Uint8Array(new Uint16Array([1]).buffer)[0]===1,o=new Map;return JSON.parse(a,(c,l)=>{if(l===null||typeof l!="object"||!("$motionF64"in l))return l;const h=l.$motionF64;if(Object.keys(l).length!==1||!Array.isArray(h)||h.length!==2||!h.every(Number.isSafeInteger)||h[0]<0||h[1]<1||h[0]+h[1]>n)throw Error("Invalid avatar motion channel range");const p=`${h[0]}:${h[1]}`;let d=o.get(p);if(!d){const v=r+h[0]*8;d=s?new Float64Array(i,v,h[1]):Float64Array.from({length:h[1]},(g,m)=>e.getFloat64(v+m*8,!0)),o.set(p,d)}return d})}const Lm={blue_beret:{nativeStart:3,nativeStop:5.216666666666667,nativeReturn:6.266666666666667,returnTime:3.2666666666666666,nativeEnd:10,exactTailFrames:225,previousNonmatchingTime:6.25,compared:["geometry-sha256 identity","draw method","shader defines","entire DrawBlock","entire FrameBlock","entire SkinBlock"],excludedChannels:[],idleTime:4.083333333333334,idleNativeStart:2.183333333333333,sampler:{matrixMax:0,normalMax:0,fieldMax:0,baseParts:7},sources:{work:{path:".local/avatar-computer-source/blue_beret/work-raw.json",sha256:"e528d835551e0faf7f8c5ffd445a17003c347debb103e77e35d83b9dd2598392"},idle:{path:".local/avatar-return-source/blue_beret/idle-raw.json",sha256:"bf0fd476dc6974678b2df560c662fc9b36068ffaaeb6ea303541a34187101000"},motion:{path:"runtime/avatar/assets/motion/blue_beret.json",sha256:"d62023e031e37f2bf1ed6b1ea49965c59abda1d7ea27cf1d0bde213009607cbe"},computer:{path:"runtime/avatar/assets/blue_beret/computer-motion.json",sha256:"3b3fe2c9eebd8dbb3dd44433c9e21c7110862fb80f5ee1ad1d05f7e2c3144389"}}},alfred:{nativeStart:3,nativeStop:5.216666666666667,nativeReturn:6.266666666666667,returnTime:3.2666666666666666,nativeEnd:10,exactTailFrames:225,previousNonmatchingTime:6.25,compared:["geometry-sha256 identity","draw method","shader defines","entire DrawBlock","entire FrameBlock","entire SkinBlock"],excludedChannels:[],idleTime:2.5833333333333335,idleNativeStart:3.683333333333333,sampler:{matrixMax:0,normalMax:0,fieldMax:0,baseParts:9},sources:{work:{path:".local/avatar-computer-source/alfred/work-raw.json",sha256:"9023bd872f0817a290ff29be4b983f3ebf123416bf456d629d7164c9cb0acc01"},idle:{path:".local/avatar-runtime-motion-actions/alfred/idle-raw.json",sha256:"239bbb065fd8f5481c2592f88eceb991b0f94c8c1ed0dcc73f5bd0ebd558b792"},motion:{path:"runtime/avatar/assets/motion/alfred.json",sha256:"97390b7bde431f42dd5d0fe2200afba81cc16de5f3757fef6f16c9377cece4d7"},computer:{path:"runtime/avatar/assets/alfred/computer-motion.json",sha256:"1f43a5a5209fe50f1eb56a4966d02ad06ead79b0ba2c6a03cd9bbad94b225232"}}},purple_heart:{nativeStart:3,nativeStop:5.216666666666667,nativeReturn:6.266666666666667,returnTime:3.2666666666666666,nativeEnd:10,exactTailFrames:225,previousNonmatchingTime:6.25,compared:["geometry-sha256 identity","draw method","shader defines","entire DrawBlock","entire FrameBlock","entire SkinBlock"],excludedChannels:[],idleTime:2.5833333333333335,idleNativeStart:3.683333333333333,sampler:{matrixMax:0,normalMax:0,fieldMax:0,baseParts:7},sources:{work:{path:".local/avatar-computer-source/purple_heart/work-raw.json",sha256:"febc9157e16fa79025d8e4c0c6119e81763670bf1f6fbfcc6f73166822728bb1"},idle:{path:".local/avatar-runtime-motion-actions/purple_heart/idle-raw.json",sha256:"c6ac8afc4e3c15de4531d6ae44b7d352f2c8dcbde628b2f8c689ff2a77dfcdf9"},motion:{path:"runtime/avatar/assets/motion/purple_heart.json",sha256:"bc112b89b31df40905f9c29e78f3f49c299e2be1e8ca1c6009e486a031528b45"},computer:{path:"runtime/avatar/assets/purple_heart/computer-motion.json",sha256:"b9ccd37d2c1cb9bcb6b9c54e366a5638b51614e6f54bb9af194b67b48499eb83"}}},lime_frog:{nativeStart:3,nativeStop:5.216666666666667,nativeReturn:6.266666666666667,returnTime:3.2666666666666666,nativeEnd:10,exactTailFrames:225,previousNonmatchingTime:6.25,compared:["geometry-sha256 identity","draw method","shader defines","entire DrawBlock","entire FrameBlock","entire SkinBlock"],excludedChannels:[],idleTime:2.5833333333333335,idleNativeStart:3.683333333333333,sampler:{matrixMax:0,normalMax:0,fieldMax:0,baseParts:8},sources:{work:{path:".local/avatar-computer-source/lime_frog/work-raw.json",sha256:"8bc0ef22272eda4f2af037edf98438be66f37d0da9ac61220af2b193ff47b1a2"},idle:{path:".local/avatar-runtime-motion-actions/lime_frog/idle-raw.json",sha256:"8fa85285775d5556d0f5ba94d19bb28cc0298f01c84eb0e4b311da64990844bb"},motion:{path:"runtime/avatar/assets/motion/lime_frog.json",sha256:"9887b3d29bc89c2359ac7d3b76ba29e3af5682d5d11323515c8ba46f321f4d79"},computer:{path:"runtime/avatar/assets/lime_frog/computer-motion.json",sha256:"fcae5c17ad61246972dc8ee687f18e07f92666513ef72558fee951ce2904ebfc"}}},coral_monocle:{nativeStart:3,nativeStop:5.216666666666667,nativeReturn:6.266666666666667,returnTime:3.2666666666666666,nativeEnd:10,exactTailFrames:225,previousNonmatchingTime:6.25,compared:["geometry-sha256 identity","draw method","shader defines","entire DrawBlock","entire FrameBlock","entire SkinBlock"],excludedChannels:[],idleTime:2.5833333333333335,idleNativeStart:3.683333333333333,sampler:{matrixMax:0,normalMax:0,fieldMax:0,baseParts:8},sources:{work:{path:".local/avatar-computer-source/coral_monocle/work-raw.json",sha256:"3b8217db1059da9c61e75f7c7f03453b3315b31d67379cde7b116dc425838740"},idle:{path:".local/avatar-runtime-motion-actions/coral_monocle/idle-raw.json",sha256:"65a8938bc8e4a2c38001e2057f24b06e0245c3f5dff4bf79c41efb5fe666a74c"},motion:{path:"runtime/avatar/assets/motion/coral_monocle.json",sha256:"654af990773962a866808cb8b831fb7e4c87d50ea7ef53455203534ead76c55c"},computer:{path:"runtime/avatar/assets/coral_monocle/computer-motion.json",sha256:"605815e4a8d5d4c9817a68158eb30e237466d7a899525fafeb3805a582f95af6"}}},gus:{nativeStart:3,nativeStop:5.216666666666667,nativeReturn:6.266666666666667,returnTime:3.2666666666666666,nativeEnd:10,exactTailFrames:225,previousNonmatchingTime:6.25,compared:["geometry-sha256 identity","draw method","shader defines","entire DrawBlock","entire FrameBlock","entire SkinBlock"],excludedChannels:[],idleTime:2.5833333333333335,idleNativeStart:3.683333333333333,sampler:{matrixMax:0,normalMax:0,fieldMax:0,baseParts:5},sources:{work:{path:".local/avatar-computer-source/gus/work-raw.json",sha256:"fe497560be31bcb34dbed0589adf23a75b08e30aaa5ae603c1ba0839442dd8b6"},idle:{path:".local/avatar-runtime-motion-actions/gus/idle-raw.json",sha256:"367484324cd18606d19080b0a8c399b4a9bca4edd7e5d02a0d5af75f2dcda02d"},motion:{path:"runtime/avatar/assets/motion/gus.json",sha256:"e0032cc30e1cc14cdbcdd203f64c12d96428a2a84237d372d48175c4c0cadcb0"},computer:{path:"runtime/avatar/assets/gus/computer-motion.json",sha256:"0db66ca70959fd582a79826311b79af263627c970959ee0f56be41d4dd3a5bed"}}},blue_spectacles:{nativeStart:3,nativeStop:5.216666666666667,nativeReturn:6.266666666666667,returnTime:3.2666666666666666,nativeEnd:10,exactTailFrames:225,previousNonmatchingTime:6.25,compared:["geometry-sha256 identity","draw method","shader defines","entire DrawBlock","entire FrameBlock","entire SkinBlock"],excludedChannels:[],idleTime:2.5833333333333335,idleNativeStart:3.683333333333333,sampler:{matrixMax:0,normalMax:0,fieldMax:0,baseParts:11},sources:{work:{path:".local/avatar-computer-source/blue_spectacles/work-raw.json",sha256:"64da7947bcdbb3b2c70fcf211dc6b7ac2a14551daa4f3e5067dee586882c101c"},idle:{path:".local/avatar-runtime-motion-actions/blue_spectacles/idle-raw.json",sha256:"36c91794e7dae8fb8206b0c324e808c2857921b5efaa1fa15f4ae6ab18d95a3d"},motion:{path:"runtime/avatar/assets/motion/blue_spectacles.json",sha256:"fd690c0731b5356c243229ca803de89bd81e09aa4f269bddf1f93b062fe36970"},computer:{path:"runtime/avatar/assets/blue_spectacles/computer-motion.json",sha256:"85d740ad5b43cb32770fbfc3e4e982099232c7b5fdb5c50a80dacd0119d8954e"}}},lime_headphones:{nativeStart:3,nativeStop:5.216666666666667,nativeReturn:6.266666666666667,returnTime:3.2666666666666666,nativeEnd:10,exactTailFrames:225,previousNonmatchingTime:6.25,compared:["geometry-sha256 identity","draw method","shader defines","entire DrawBlock","entire FrameBlock","entire SkinBlock"],excludedChannels:[],idleTime:2.5833333333333335,idleNativeStart:3.683333333333333,sampler:{matrixMax:0,normalMax:0,fieldMax:0,baseParts:9},sources:{work:{path:".local/avatar-computer-source/lime_headphones/work-raw.json",sha256:"ffaefea0a5352ee9d88e88c7476cab5a395776f4a50cae999756ff9401aa14d6"},idle:{path:".local/avatar-runtime-motion-actions/lime_headphones/idle-raw.json",sha256:"e1ad361161685f4247714b9231ef5dbbd7d1839c40995b8889dd4825da5575cd"},motion:{path:"runtime/avatar/assets/motion/lime_headphones.json",sha256:"1211c5167eca9a1e01bb282f408adbccc754dc53783baefc1d92727ee33e4c4d"},computer:{path:"runtime/avatar/assets/lime_headphones/computer-motion.json",sha256:"92da9e788e108a5849cbff9cc8a6e0b233409771bbed11fd8476fe2938a4564b"}}}},Pm={presets:Lm};function Dm(i,e,t){const n=e.clips.idle;if(e.schema!=="bloom.authored-hidden-eye-blink"||e.version!==1||e.preset!==t||n.duration!==i.duration||n.times.length!==i.times.length||n.samples.length!==i.times.length||!n.times.every((s,o)=>s===i.times[o])||!n.samples.every(s=>Number.isFinite(s)&&s>=0&&s<=1))throw Error("Eye blink must match the observed preset and motion clock");const r=i.parts.find(s=>s.id==="mesh:0");if(!r||r.fields.eyeBlink)throw Error("Eye blink requires an unmodified body channel");const a=new Float64Array(n.samples.length*4);n.samples.forEach((s,o)=>{a[o*4]=s}),r.fields.eyeBlink={samples:a}}function Um(i,e){if(!Number.isFinite(e.entryTime)||e.entryTime<0||!Number.isFinite(e.coreSeconds)||e.coreSeconds<=.18||e.entryTime+e.coreSeconds>=i.duration||e.duration!==i.duration||e.times.length!==i.times.length||!e.times.every((n,r)=>n===i.times[r])||e.translation.length!==i.times.length*4||e.scale.length!==i.times.length*4||!e.translation.every(Number.isFinite)||!e.scale.every((n,r)=>Number.isFinite(n)&&(r%4===3||n>0)))throw Error("Reaction gaze must match the observed motion clock and neutral frame");if(e.eyeBlink&&(e.eyeBlink.length!==i.times.length*4||!e.eyeBlink.every(n=>Number.isFinite(n)&&n>=0&&n<=1)))throw Error("Reaction blink must match the observed motion clock");const t=i.parts.find(n=>n.id==="mesh:0");if(!t||t.fields.gazeNeutralTranslation||t.fields.gazeNeutralScale||t.fields.eyeBlink)throw Error("Reaction gaze requires an unmodified body channel");return t.fields.gazeNeutralTranslation={samples:e.translation},t.fields.gazeNeutralScale={samples:e.scale},e.eyeBlink&&(t.fields.eyeBlink={samples:e.eyeBlink}),{entryTime:e.entryTime,coreSeconds:e.coreSeconds}}const Im=Object.assign({"./assets/packed-motion/alfred.bin":dm,"./assets/packed-motion/blue_beret.bin":fm,"./assets/packed-motion/blue_spectacles.bin":pm,"./assets/packed-motion/coral_monocle.bin":mm,"./assets/packed-motion/gus.bin":vm,"./assets/packed-motion/lime_frog.bin":gm,"./assets/packed-motion/lime_headphones.bin":_m,"./assets/packed-motion/purple_heart.bin":ym}),Nm=Object.assign({"./assets/packed-motion/alfred.bin":xm,"./assets/packed-motion/blue_beret.bin":bm,"./assets/packed-motion/blue_spectacles.bin":wm,"./assets/packed-motion/coral_monocle.bin":Sm,"./assets/packed-motion/gus.bin":Mm,"./assets/packed-motion/lime_frog.bin":Em,"./assets/packed-motion/lime_headphones.bin":Rm,"./assets/packed-motion/purple_heart.bin":Tm}),ka=new Map,Ga=new Map;async function mc(i,e){const t=e[`./assets/packed-motion/${i}.bin`];if(!t)throw Error(`Missing packed avatar motion: ${i}`);const n=await fetch(t);if(!n.ok)throw Error(`Avatar motion failed (${n.status}): ${i}`);return io(await n.arrayBuffer())}function Fm(i,e=!0){let t=ka.get(i);if(t||(t=Bm(i).catch(r=>{throw ka.delete(i),r}),ka.set(i,t)),!e)return t;let n=Ga.get(i);return n||(n=Promise.all([t,mc(i,Nm)]).then(([r,a])=>Om(i,r,a)).catch(r=>{throw Ga.delete(i),r}),Ga.set(i,n)),n}const Yr=i=>({...i,parts:i.parts.filter(e=>!e.id.startsWith("fur:"))});async function Bm(i){const e=await mc(i,Im);if(e.schema!=="bloom.avatar.motion-bundle"||e.version!==1||e.preset!==i)throw Error(`Avatar motion bundle identity mismatch: ${i}`);const{motion:t}=e;if(t.preset!==i)throw Error(`Avatar motion identity mismatch: ${i}`);if(i==="lime_headphones"){if(!e.eyeBlink)throw Error("Missing Headphones idle blink");Dm(t.clips.idle,e.eyeBlink,i)}if(i!=="blue_beret"&&(!e.reactionGaze||!t.clips.reaction))throw Error(`Missing reaction gaze frame: ${i}`);if(i==="lime_headphones"&&!e.reactionGaze?.eyeBlink)throw Error("Missing Headphones reaction blink");const n=e.reactionGaze&&t.clips.reaction?Um(t.clips.reaction,e.reactionGaze):void 0,r=t.reactionEnd==="return-idle"&&t.evidence?t.evidence.reaction.nativeEnd-t.evidence.idle.nativeStart:void 0;if(t.reactionEnd==="return-idle"&&(!t.clips.reaction||r===void 0||!Number.isFinite(r)||r<0||r>=t.clips.idle.duration))throw Error(`Invalid reaction return phase: ${i}`);return{idle:new Qn(Yr(t.clips.idle)),reaction:t.clips.reaction?new Qn(Yr(t.clips.reaction)):void 0,reactionReturnTime:r,reactionGaze:n}}function Om(i,e,t){const n=t.computer;if(t.schema!=="bloom.avatar.motion-bundle"||t.version!==1||t.preset!==i||n?.schema!=="bloom.avatar.computer-motion"||n.preset!==i)throw Error(`Computer motion identity mismatch: ${i}`);const r=t.computerLoop;if(!r||r.schema!=="bloom.avatar.computer-loop"||r.version!==1||r.preset!==i)throw Error(`Missing or invalid Computer loop: ${i}`);const a=new Cm(Yr(r.clip),r.nativeStart,r.loopStart,r.period),s=new Qn(Yr(n.clip)),o=Pm.presets[i];if(!o)throw Error(`Missing verified Computer return: ${i}`);if(!Number.isFinite(o.returnTime)||!Number.isFinite(o.idleTime)||o.returnTime<=0||o.returnTime>n.clip.duration||o.idleTime<0||o.idleTime>=e.idle.clip.duration)throw Error(`Invalid Computer return phase: ${i}`);return{...e,work:s,workLoop:a,workReturn:{time:o.returnTime,idleTime:o.idleTime}}}function vc(i,e){const t=i.getAttribute("position"),n=i.getAttribute("normal"),r=i.getIndex(),a=new O().fromArray(e),s=new kt,o=new O,c=new O,l=new O,h=new O,p=new O;let d=1/0;const v=r?.count??t.count;for(let g=0;g+2<v;g+=3){const m=[0,1,2].map(f=>r?r.getX(g+f):g+f);if(s.a.fromBufferAttribute(t,m[0]),s.b.fromBufferAttribute(t,m[1]),s.c.fromBufferAttribute(t,m[2]),s.getNormal(l),l.lengthSq()===0)continue;s.closestPointToPoint(a,o);const u=o.distanceToSquared(a);if(!(u>=d)){if(n){s.getBarycoord(o,c),l.set(0,0,0);for(let f=0;f<3;f++)l.addScaledVector(new O().fromBufferAttribute(n,m[f]),c.getComponent(f));l.lengthSq()<1e-20&&s.getNormal(l)}d=u,h.copy(o),p.copy(l).normalize()}}if(!Number.isFinite(d))throw Error("Tuft requires a nondegenerate body surface");return{point:h.toArray(),normal:p.toArray()}}function gc(i,e){const t=e.find(f=>!f.fur),n=i.find(f=>!f.fur);if(!t?.attachmentPivot||!n)return;const r=new O().fromArray(t.attachmentPivot),a=new O().fromArray(vc(n.geometry,r.toArray()).normal),s=t.bounds.max[1]-t.bounds.min[1],o=t.bounds.max[0]-t.bounds.min[0];if(!(s>0&&o>0)||!Number.isFinite(s+o)||a.lengthSq()===0)throw Error("Invalid tuft attachment dimensions");const c=o*.48,l=s*.08,h=s*.1,p=s*.28,d=c*c,v=f=>{const w=f.clone().sub(r),C=Math.max(0,1-w.lengthSq()/d);return{value:l*C*C*C,gradient:w.multiplyScalar(-6*l*C*C/d)}},g=(f,w)=>{if(w)return v(f);const C=f.clone().sub(r).dot(a),M=Math.max(0,Math.min(1,C/p)),x=M*M*M*(10+M*(-15+6*M)),S=C>0&&C<p?30*M*M*(1-M)*(1-M)/p:0;return{value:-h*(1-x),gradient:a.clone().multiplyScalar(h*S)}},m=(f,w)=>f.clone().addScaledVector(a,g(f,w).value),u=(f,w,C)=>{const{gradient:M}=g(w,C);if(M.lengthSq()===0)return f;const x=1+M.dot(a);if(!(x>1e-8))throw Error("Folded tuft attachment");return f.clone().addScaledVector(M,-a.dot(f)/x).normalize()};for(const f of[...i,...e]){const w=f.category==="body",C=f.geometry,M=C.getAttribute("position"),x=(R,_)=>new O().fromBufferAttribute(C.getAttribute(R),_),S=(R,_,E)=>C.getAttribute(R).setXYZ(_,E.x,E.y,E.z);for(let R=0;R<M.count;R++){const _=x("position",R),E=!f.fur&&C.hasAttribute("delta0")?_.clone().add(x("delta0",R)):_,L=!f.fur&&C.hasAttribute("delta1")?_.clone().add(x("delta1",R)):_;if(g(_,w).value===0&&g(E,w).value===0&&g(L,w).value===0)continue;const T=m(_,w);if(f.fur){const P=g(_,w).gradient,U=u(x("normal",R),_,w),D=x("normal0",R);if(D.addScaledVector(a,P.dot(D)),D.addScaledVector(U,-U.dot(D)).normalize(),S("normal",R,U),S("normal0",R,D),C.hasAttribute("delta1")){const z=x("delta1",R);z.addScaledVector(a,P.dot(z)),S("delta1",R,z)}}else{C.hasAttribute("delta0")&&S("delta0",R,m(E,w).sub(T)),C.hasAttribute("delta1")&&S("delta1",R,m(L,w).sub(T));for(const[U,D]of[["normal",_],["normal0",E],["normal1",L]])C.hasAttribute(U)&&S(U,R,u(x(U,R),D,w));const P=C.getAttribute("paletteGeometry");if(P){const U=(f.fields.paletteReference?.[0]??0)>.5?L:_,D=u(new O(P.getY(R),P.getZ(R),P.getW(R)),U,w);P.setY(R,D.x),P.setZ(R,D.y),P.setW(R,D.z)}}S("position",R,T)}for(const R of Object.values(C.attributes))R.needsUpdate=!0;C.computeBoundingBox(),C.computeBoundingSphere(),f.bounds={min:C.boundingBox.min.toArray(),max:C.boundingBox.max.toArray()}}}const ml=new WeakMap;function zm(i){const e=new Map,t=ml.get(i);if(t)return t;const n=i.filter(s=>s.id===0&&!s.activity),r=i.filter(s=>s.attachment==="three_lobe"&&!s.activity);if(!n.some(s=>!s.fur)||!r.some(s=>!s.fur))return e;const a=[...n,...r].map(s=>{const o=s.geometry.clone();return o.computeBoundingBox(),{...s,geometry:o,bounds:{min:o.boundingBox.min.toArray(),max:o.boundingBox.max.toArray()},category:s.id===0?"body":"accessory",selection:s.id===0?"":"three_lobe",pivot:[0,0,0]}});try{const s=a.filter(d=>d.category==="body"),o=a.filter(d=>d.category==="accessory"),c=o.find(d=>!d.fur),l=s.find(d=>!d.fur),h=[0,1,2].map(d=>(c.bounds.min[d]+c.bounds.max[d])/2),p=vc(l.geometry,h).point;for(const d of o)d.attachmentPivot=p,e.set(d.id,p.slice());gc(s,o);for(let d=0;d<a.length;d++){const v=[...n,...r][d],g=v.geometry;v.geometry=a[d].geometry,g.dispose()}return ml.set(i,e),e}catch(s){for(const o of a)o.geometry.dispose();throw s}}function _c(i,e,t){if(i?.pendingStart){const{pendingStart:s,...o}=i;return{...o,started:t}}if(!i||i.held!==void 0||i.kind==="idle"||i.kind==="work"&&i.continuous)return i;const n=i.kind==="work"?e.workReturn?.time:e.reaction?.clip.duration;if(n===void 0||t<i.started+n)return i;if(i.kind==="work"&&(i.remainingCycles??1)>1&&n>0){const s=Math.min(i.remainingCycles,Math.floor((t-i.started)/n));if(s<i.remainingCycles)return{...i,started:i.started+s*n,remainingCycles:i.remainingCycles-s};i={...i,started:i.started+(i.remainingCycles-1)*n,remainingCycles:1}}const r=i.started+n;if(i.kind==="reaction"&&i.queuedReaction)return _c({kind:"reaction",started:r},e,t);const a=i.kind==="work"?e.workReturn?.idleTime:e.reactionReturnTime;return a===void 0?i:{kind:"idle",started:r-a}}const km=`precision highp float;
out vec2 texCoord;
void main() {
    vec2 p = vec2((gl_VertexID << 1) & 2,gl_VertexID & 2);
    gl_Position = vec4(p*2.0-1.0,0.0,1.0);
    texCoord = p;
}
`,Gm=`precision highp float;
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
`;class Vm{constructor(e,t){this.renderer=e,this.scene=new Ns,this.camera=new to,this.geometry=new nn,this.width=0,this.height=0,this.disposed=!1,this.frame=Object.fromEntries(Object.entries(t).map(([a,s])=>{if(![4,16].includes(s.length)||!s.every(Number.isFinite))throw new Error(`Invalid authored AO frame field: ${a}`);return[a,s.length===16?new pe().fromArray(s):new nt().fromArray(s)]}));for(const a of["viewProjection","inverseViewProjection"])if(!(this.frame[a]instanceof pe))throw new Error(`Missing authored AO matrix: ${a}`);for(const a of["viewport","cameraPosition","effects"])if(!(this.frame[a]instanceof nt))throw new Error(`Missing authored AO vector: ${a}`);if(this.frame.cameraPosition.w!==0)throw new Error("AuthoredOcclusion requires an orthographic scene");this.geometry.setAttribute("position",new tn(new Float32Array(9),3)),this.geometry.setDrawRange(0,3);const n=()=>new Ut(1,1,{format:na,type:Nt,minFilter:gt,magFilter:gt,wrapS:Xt,wrapT:Xt,depthBuffer:!1,stencilBuffer:!1,generateMipmaps:!1,colorSpace:bn,samples:0});this.sampled=n(),this.resolved=n();const r=a=>new ji({glslVersion:Mi,vertexShader:km,fragmentShader:Gm,defines:{[a]:1},uniforms:{f:{value:this.frame},cameraDepth:{value:null},ambientOcclusion:{value:this.sampled.texture},avatarCameras:{value:null},avatarGrid:{value:new nt}},depthTest:!1,depthWrite:!1,blending:dn,toneMapped:!1});this.sampleMaterial=r("ORBIT_ORTHOGRAPHIC_AO"),this.sampleMaterial.uniforms.ambientOcclusion.value=null,this.resolveMaterial=r("ORBIT_RESOLVE_AO"),this.mesh=new Gt(this.geometry,this.sampleMaterial),this.mesh.frustumCulled=!1,this.scene.add(this.mesh)}resize(e,t){if(this.disposed)throw new Error("AuthoredOcclusion is disposed");if(!Number.isInteger(e)||!Number.isInteger(t)||e<1||t<1)throw new Error("Authored AO dimensions must be positive physical pixel integers");this.width===e&&this.height===t||(this.width=e,this.height=t,this.sampled.setSize(Math.max(1,Math.ceil(e/2)),Math.max(1,Math.ceil(t/2))),this.resolved.setSize(e,t),this.frame.viewport.set(e,t,1/e,1/t))}setAvatars(e,t,n,r,a){for(const s of[this.sampleMaterial,this.resolveMaterial])s.uniforms.avatarCameras.value=e,s.uniforms.avatarGrid.value.set(t,n,r,a)}render(e,t,n,r,a){this.resize(n,r);for(const v of[this.sampled,this.resolved])if(v.scissorTest=!!a&&(a.z<n||a.w<r),a){const g=Math.floor(a.x*v.width/n),m=Math.floor(a.y*v.height/r);v.scissor.set(g,m,Math.ceil((a.x+a.z)*v.width/n)-g,Math.ceil((a.y+a.w)*v.height/r)-m)}if(!t.elements.every(Number.isFinite)||Math.abs(t.determinant())<1e-15)throw new Error("Authored AO requires a finite invertible view-projection matrix");const s=t.elements;if(s[3]!==0||s[7]!==0||s[11]!==0||s[15]!==1)throw new Error("Authored AO requires an orthographic view-projection matrix");this.frame.viewProjection.copy(t),this.frame.inverseViewProjection.copy(t).invert(),this.sampleMaterial.uniforms.cameraDepth.value=e,this.resolveMaterial.uniforms.cameraDepth.value=e;const o=this.renderer,c=o.getRenderTarget(),l=o.getActiveCubeFace(),h=o.getActiveMipmapLevel(),p=o.autoClear,d=o.xr.enabled;try{o.autoClear=!1,o.xr.enabled=!1,this.mesh.material=this.sampleMaterial,o.setRenderTarget(this.sampled),o.render(this.scene,this.camera),this.mesh.material=this.resolveMaterial,o.setRenderTarget(this.resolved),o.render(this.scene,this.camera)}finally{o.setRenderTarget(c,l,h),o.autoClear=p,o.xr.enabled=d}return this.resolved.texture}dispose(){this.disposed||(this.disposed=!0,this.geometry.dispose(),this.sampleMaterial.dispose(),this.resolveMaterial.dispose(),this.sampled.dispose(),this.resolved.dispose(),this.scene.clear())}}class Hm{constructor(){this.active=!1,this.yaw=0,this.pitch=0,this.startX=0,this.startY=0,this.released=0,this.releaseYaw=0,this.releasePitch=0}get moving(){return!this.active&&Math.max(Math.abs(this.yaw),Math.abs(this.pitch))>=1e-12}down(e,t,n){this.sample(n),this.startX=Math.fround(e),this.startY=Math.fround(t),this.active=!0}move(e,t){if(!this.active)return;const n=Math.fround(Math.fround(e)-this.startX),r=Math.fround(Math.fround(t)-this.startY);this.yaw=Math.fround(Math.max(-.32,Math.min(.32,Math.fround(n*Math.fround(1.7))))),this.pitch=Math.fround(Math.max(-.22,Math.min(.22,Math.fround(r*1.5))))}up(e){this.active&&(this.active=!1,this.released=e,this.releaseYaw=this.yaw,this.releasePitch=this.pitch)}sample(e){if(this.active||!this.releaseYaw&&!this.releasePitch)return;const t=Math.pow(.88,Math.max(0,e-this.released)*60);this.yaw=this.releaseYaw*t,this.pitch=this.releasePitch*t,this.moving||(this.yaw=this.pitch=this.releaseYaw=this.releasePitch=0)}reset(){this.active=!1,this.yaw=this.pitch=this.releaseYaw=this.releasePitch=0}}class Wm{constructor(){this.yaw=0,this.pitch=0,this.yawVelocity=0,this.pitchVelocity=0,this.targetYaw=0,this.targetPitch=0}get moving(){return Math.max(Math.abs(this.yaw-this.targetYaw),Math.abs(this.pitch-this.targetPitch),Math.abs(this.yawVelocity),Math.abs(this.pitchVelocity))>=1e-12}point(e,t){if(!Number.isFinite(e)||!Number.isFinite(t))throw new Error("Invalid gaze coordinates");this.targetYaw=(Math.max(0,Math.min(1,Math.fround(e)))-.5)*.11,this.targetPitch=(Math.max(0,Math.min(1,Math.fround(t)))-.5)*.07}advance(e){if(!Number.isFinite(e)||e<0)throw new Error("Invalid gaze interval");if(!this.moving)return;const t=Math.exp(-22*e),n=this.yaw-this.targetYaw,r=this.pitch-this.targetPitch,a=this.yawVelocity+22*n,s=this.pitchVelocity+22*r;this.yaw=this.targetYaw+(n+a*e)*t,this.pitch=this.targetPitch+(r+s*e)*t,this.yawVelocity=(this.yawVelocity-22*a*e)*t,this.pitchVelocity=(this.pitchVelocity-22*s*e)*t,this.moving||(this.yaw=this.targetYaw,this.pitch=this.targetPitch,this.yawVelocity=this.pitchVelocity=0)}reset(){this.yaw=this.pitch=this.yawVelocity=this.pitchVelocity=0,this.targetYaw=this.targetPitch=0}}const vl=i=>{const e=Math.max(0,Math.min(1,i));return e*e*e*(10-15*e+6*e*e)};function Xm(i,e){if(!Number.isFinite(i)||!Number.isFinite(e)||e<.18)throw new Error("Invalid reaction gaze interval");return{frozen:i<e,strength:i<e?1-vl(i/.18):vl((i-e)/.18)}}function Va(i,e=!1){for(let t=0;t<3;t++){const n=i[t];if(typeof n!="number"||!Number.isFinite(n)||e&&n<=0)throw new Error("Invalid reaction neutral frame")}}class jm{constructor(){this.basis=new pe().makeRotationY(8*Math.PI/180),this.inverseBasis=this.basis.clone().invert(),this.scratch=new pe,this.relativeEye=new pe}writeBodyCorrection(e,t,n,r,a){if(Va(n),!Number.isFinite(e)||!Number.isFinite(t))throw new Error("Invalid reaction gaze angles");a.copy(this.basis).multiply(this.scratch.makeRotationY(e)).multiply(this.scratch.makeRotationX(t)).multiply(this.inverseBasis);const s=n[0],o=n[1],c=n[2];r.makeTranslation(s,o,c).multiply(a).multiply(this.scratch.makeTranslation(-s,-o,-c))}writeNeutralFrame(e,t,n){Va(e),Va(t,!0),n.copy(this.basis).multiply(this.scratch.makeScale(t[0],t[1],t[2])),n.setPosition(e[0],e[1],e[2])}writeEyeCorrection(e,t,n,r,a,s,o,c,l){this.writeNeutralFrame(a,s,this.relativeEye),this.relativeEye.invert().multiply(o),e.writeBeforePoseCorrection(t,n,this.relativeEye,c,l,r)}}const qi=i=>Math.max(0,Math.min(1,i)),qm=i=>i*i*(3-2*i),Ym=i=>.5-Math.sin(Math.asin(1-2*qi(i))/3);function $m(i,e){const t=i[2],n=i[3];if(typeof t!="number"||typeof n!="number"||!Number.isFinite(t)||!Number.isFinite(n))throw new Error("Invalid eye morph channels");const r=e==="integrated"?Ym:qi;return n>0?(1+r(n))/2:r(t)/2}class gl{constructor(){this.x=0,this.y=0,this.velocityX=0,this.velocityY=0,this.targetX=0,this.targetY=0,this.inverseRelativePose=new pe}get moving(){return Math.max(Math.abs(this.x-this.targetX),Math.abs(this.y-this.targetY),Math.abs(this.velocityX),Math.abs(this.velocityY))>=1e-12}point(e,t){if(!Number.isFinite(e)||!Number.isFinite(t))throw new Error("Invalid eye coordinates");this.targetX=qi(Math.fround(e))-.5,this.targetY=qi(Math.fround(t))-.5}advance(e){if(!Number.isFinite(e)||e<0)throw new Error("Invalid eye interval");if(!this.moving)return;const t=Math.exp(-55*e),n=this.x-this.targetX,r=this.y-this.targetY,a=this.velocityX+55*n,s=this.velocityY+55*r;this.x=this.targetX+(n+a*e)*t,this.y=this.targetY+(r+s*e)*t,this.velocityX=(this.velocityX-55*a*e)*t,this.velocityY=(this.velocityY-55*s*e)*t,this.moving||(this.x=this.targetX,this.y=this.targetY,this.velocityX=this.velocityY=0)}writeCorrection(e,t,n,r,a=1){if(!Number.isFinite(t)||t<0||t>1)throw new Error("A measured eye blink closure in [0, 1] is required");if(!Number.isFinite(a)||a<0||a>1)throw new Error("Eye transition strength must be in [0, 1]");const s=(1-qm(qi(t*e.blinkMultiplier)))*a;if(s===0||this.x===0&&this.y===0){n.identity(),r.identity();return}const o=this.x*e.angularGain[0]*s,c=this.y*e.angularGain[1]*s,l=Math.cos(o),h=Math.sin(o),p=Math.cos(c),d=Math.sin(c),v=this.x*e.halfSize[0]*e.translationGain[0]*s,g=this.y*e.halfSize[1]*e.translationGain[1]*s,[m,u,f]=e.anchor;if(e.surface){const[w,C]=e.surface.curvature,[M,x]=e.surface.slope,S=e.surface.crossCurvature??0,R=h*d,_=l*(M-w*v-S*g)-M,E=R*(M-w*v-S*g)+p*(x-C*g-S*v)-x,L=M*v+x*g-(w*v*v+C*g*g+2*S*v*g)/2;n.set(l,R,0,m*(1-l)-u*R+v,0,p,0,u*(1-p)+g,_,E,1,L-_*m-E*u,0,0,0,1),r.copy(n).setPosition(0,0,0).invert().transpose();return}n.set(l,h*d,h*p,m*(1-l)-u*h*d-f*h*p+v,0,p,-d,u*(1-p)+f*d+g,0,0,1,0,0,0,0,1),r.copy(n).setPosition(0,0,0).invert().transpose()}writeBeforePoseCorrection(e,t,n,r,a,s=1){if(!Number.isFinite(n.determinant())||Math.abs(n.determinant())<1e-12)throw new Error("Eye expression pose must be invertible");this.writeCorrection(e,t,r,a,s),this.inverseRelativePose.copy(n).invert(),r.premultiply(this.inverseRelativePose).multiply(n),a.copy(r).setPosition(0,0,0).invert().transpose()}reset(){this.x=this.y=this.velocityX=this.velocityY=this.targetX=this.targetY=0}}const Km={lime_frog:{0:{1:{anchor:[-.46000000834465027,.4899999797344208,.5120980739593506],halfSize:[.17200002074241638,.18799999356269836],angularGain:[.042,.028],translationGain:[.07,-.042],blink:"integrated",blinkMultiplier:1},2:{anchor:[-.46000000834465027,.4899999797344208,.5120980739593506],halfSize:[.17200002074241638,.18799999356269836],angularGain:[.042,.028],translationGain:[.07,-.042],blink:"integrated",blinkMultiplier:1},3:{anchor:[.46000000834465027,.4899999797344208,.5121124386787415],halfSize:[.17200002074241638,.18799999356269836],angularGain:[.042,.028],translationGain:[.07,-.042],blink:"integrated",blinkMultiplier:1},4:{anchor:[.46000000834465027,.4899999797344208,.5121124386787415],halfSize:[.17200002074241638,.18799999356269836],angularGain:[.042,.028],translationGain:[.07,-.042],blink:"integrated",blinkMultiplier:1}},1:{1:{anchor:[-.46000000834465027,.4899999797344208,.5120980739593506],halfSize:[.17200002074241638,.18799999356269836],angularGain:[.042,.028],translationGain:[.07,-.042],blink:"integrated",blinkMultiplier:1},2:{anchor:[-.46000000834465027,.4899999797344208,.5120980739593506],halfSize:[.17200002074241638,.18799999356269836],angularGain:[.042,.028],translationGain:[.07,-.042],blink:"integrated",blinkMultiplier:1},3:{anchor:[.46000000834465027,.4899999797344208,.5121124386787415],halfSize:[.17200002074241638,.18799999356269836],angularGain:[.042,.028],translationGain:[.07,-.042],blink:"integrated",blinkMultiplier:1},4:{anchor:[.46000000834465027,.4899999797344208,.5121124386787415],halfSize:[.17200002074241638,.18799999356269836],angularGain:[.042,.028],translationGain:[.07,-.042],blink:"integrated",blinkMultiplier:1}}},blue_spectacles:{0:{1:{anchor:[-.3401760756969452,.03866931423544884,.5094621181488037],halfSize:[.1905951201915741,.1905951052904129],angularGain:[.042,.028],translationGain:[.07,-.042],blink:"integrated",blinkMultiplier:1},2:{anchor:[-.3401760756969452,.03866931423544884,.5094621181488037],halfSize:[.1905951201915741,.1905951052904129],angularGain:[.042,.028],translationGain:[.07,-.042],blink:"integrated",blinkMultiplier:1},3:{anchor:[.33213406801223755,.03866931423544884,.517117977142334],halfSize:[.1905950903892517,.1905951052904129],angularGain:[.042,.028],translationGain:[.07,-.042],blink:"integrated",blinkMultiplier:1},4:{anchor:[.33213406801223755,.03866931423544884,.517117977142334],halfSize:[.1905950903892517,.1905951052904129],angularGain:[.042,.028],translationGain:[.07,-.042],blink:"integrated",blinkMultiplier:1}},1:{1:{anchor:[-.3401760756969452,.03866931423544884,.5094621181488037],halfSize:[.1905951201915741,.1905951052904129],angularGain:[.042,.028],translationGain:[.07,-.042],blink:"integrated",blinkMultiplier:1},2:{anchor:[-.3401760756969452,.03866931423544884,.5094621181488037],halfSize:[.1905951201915741,.1905951052904129],angularGain:[.042,.028],translationGain:[.07,-.042],blink:"integrated",blinkMultiplier:1},3:{anchor:[.33213406801223755,.03866931423544884,.517117977142334],halfSize:[.1905950903892517,.1905951052904129],angularGain:[.042,.028],translationGain:[.07,-.042],blink:"integrated",blinkMultiplier:1},4:{anchor:[.33213406801223755,.03866931423544884,.517117977142334],halfSize:[.1905950903892517,.1905951052904129],angularGain:[.042,.028],translationGain:[.07,-.042],blink:"integrated",blinkMultiplier:1}}},lime_headphones:{0:{1:{anchor:[-.3329812288284302,-.07841390371322632,.49655792117118835],halfSize:[.2206026315689087,.19739124178886414],angularGain:[.238,.112],translationGain:[.252,-.14],blink:"external",blinkMultiplier:1},2:{anchor:[.23228435218334198,-.0753689706325531,.5453407764434814],halfSize:[.2180550992488861,.19582310318946838],angularGain:[.238,.112],translationGain:[.252,-.14],blink:"external",blinkMultiplier:1}},1:{1:{anchor:[-.3329812288284302,-.07841390371322632,.49655792117118835],halfSize:[.2204982340335846,.1972978264093399],angularGain:[.238,.112],translationGain:[.252,-.14],blink:"external",blinkMultiplier:1},2:{anchor:[.23228435218334198,-.0753689706325531,.5453407764434814],halfSize:[.2180555760860443,.1958235502243042],angularGain:[.238,.112],translationGain:[.252,-.14],blink:"external",blinkMultiplier:1}}},coral_monocle:{0:{3:{anchor:[.1820000261068344,.30000004172325134,.6229034066200256],halfSize:[.13699999451637268,.13899999856948853],angularGain:[0,0],translationGain:[.098,-.035],blink:"linear",blinkMultiplier:6},4:{anchor:[-.2750000059604645,.30000004172325134,.6066563725471497],halfSize:[.13699999451637268,.13899999856948853],angularGain:[0,0],translationGain:[.098,-.035],blink:"linear",blinkMultiplier:6}},1:{3:{anchor:[.1820000261068344,.30000004172325134,.6229034066200256],halfSize:[.13699999451637268,.13899999856948853],angularGain:[0,0],translationGain:[.098,-.035],blink:"linear",blinkMultiplier:6},4:{anchor:[-.2750000059604645,.30000004172325134,.6066563725471497],halfSize:[.13699999451637268,.13899999856948853],angularGain:[0,0],translationGain:[.098,-.035],blink:"linear",blinkMultiplier:6}}}},Zm={presets:Km},_l=`precision highp float;
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
`,Jm=`precision highp float;
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
`,Qm={viewProjection:[.5494505167007446,0,0,0,0,.5494505167007446,0,0,0,0,-.10050251334905624,0,0,0,-.6080402135848999,1],inverseViewProjection:[1.8200000524520874,0,0,0,0,1.8200000524520874,0,0,0,0,-9.949999809265137,0,0,0,-6.050000190734863,1],lightViewProjection:[.35728874802589417,.12126781046390533,.08570991456508636,0,0,.3435921370983124,-.11427989602088928,0,.21437321603298187,-.20211303234100342,-.142849862575531,0,4967053612858763e-23,0,-.010100960731506348,1],cameraPosition:[0,0,4,0],keyDirectionIntensity:[-.6000000238418579,.800000011920929,1,74e3],fillDirectionIntensity:[.8500000238418579,.20000000298023224,.699999988079071,12e3],ambientExposure:[45e3,2604166729724966e-20,.6399999856948853,.699999988079071],viewport:[320,320,.0031250000465661287,.0031250000465661287],effects:[0,1,1.100000023841858,.2199999988079071],studioParameters:[1,1.0499999523162842,0,.18000000715255737],errorBodyBounds:[0,0,0,0],characterStudio:[.5,2,1,.6499999761581421],shadowParameters:[.3499999940395355,4.800000190734863,9.899999618530273,.6499999761581421],searchLensCenterRadius:[0,0,0,0],searchLensRight:[0,0,0,0],searchLensUp:[0,0,0,0],searchLensStyle:[0,0,0,0],searchLensOptics:[0,0,0,0],thinkingLightPositionStrength:[0,0,0,0],thinkingLightColorRadius:[0,0,0,0]},ev=[{name:"furPile",id:4,width:512,height:512,format:6408,type:5121,components:4,parameters:{10240:9729,10241:9987,10242:10497,10243:10497},file:"furPile.bin",sha256:"f06727e864bf6d3f422aa01ad7aec27775801452260cd9e79ce39ab4bfe8ffa3",sourceFile:"texture-4.bin"},{name:"furCards",id:5,width:512,height:512,format:6408,type:5121,components:4,parameters:{10240:9729,10241:9987,10242:33071,10243:33071},file:"furCards.bin",sha256:"49d575ae2830f78b29c449131e33dd7929dfaa68246cfd6cc7c4868a179e1004",sourceFile:"texture-5.bin"},{name:"furLTC1",id:6,width:64,height:64,format:6408,type:5126,components:4,parameters:{10240:9729,10241:9729,10242:33071,10243:33071},file:"furLTC1.bin",sha256:"cf5cf21e5c112d2095c7e2418cb0a1ac54636e275d73e42f3453646c67f26814",sourceFile:"texture-6.bin"},{name:"furLTC2",id:7,width:64,height:64,format:6408,type:5126,components:4,parameters:{10240:9729,10241:9729,10242:33071,10243:33071},file:"furLTC2.bin",sha256:"3b1b09080b26104498db277c14fc1733786465c6958e7a8403d688b1e24c2ff5",sourceFile:"texture-7.bin"}],Cr={frame:Qm,sourceTextures:ev},tv=""+new URL("../assets/computer-geometry-uSZzT583.bin",import.meta.url).href,nv=""+new URL("../assets/computer-geometry-DTkXbiN0.json",import.meta.url).href,iv=""+new URL("../assets/computer-material-vpK-WaF1.json",import.meta.url).href,rv=new URL("../assets/geometry-low-ByQxB_nR.bin",import.meta.url).href,av=new URL("../assets/geometry-low-4Cm496Mv.json",import.meta.url).href,sv=new URL("../assets/geometry-DMvQoOl2.bin",import.meta.url).href,ov=new URL("../assets/geometry-CthS61Br.json",import.meta.url).href,lv=""+new URL("../assets/material-C7e3KRNm.json",import.meta.url).href,cv=""+new URL("../assets/reference-wYoveiOB.png",import.meta.url).href,uv=""+new URL("../assets/computer-geometry-so24EYz6.bin",import.meta.url).href,hv=""+new URL("../assets/computer-geometry-DXJcZaai.json",import.meta.url).href,dv=""+new URL("../assets/computer-material-pj7H1QLb.json",import.meta.url).href,fv=new URL("../assets/geometry-CO6mKd2l.bin",import.meta.url).href,pv=new URL("../assets/geometry-low-DsSP3M4G.json",import.meta.url).href,mv=new URL("../assets/geometry-C8mRYEXR.bin",import.meta.url).href,vv=new URL("../assets/geometry-Dautc2sf.json",import.meta.url).href,gv=""+new URL("../assets/material-DQ0XgHgy.json",import.meta.url).href,_v=""+new URL("../assets/reference-H6kqI7bP.png",import.meta.url).href,yv=""+new URL("../assets/computer-geometry-4OFr3sao.bin",import.meta.url).href,xv=""+new URL("../assets/computer-geometry-DrqBa5Gt.json",import.meta.url).href,bv=""+new URL("../assets/computer-material-Cc1ufmGt.json",import.meta.url).href,wv=new URL("../assets/geometry-low-CODxblW3.bin",import.meta.url).href,Sv=new URL("../assets/geometry-low-D4gzDxog.json",import.meta.url).href,Mv=new URL("../assets/geometry-64QCAMWN.bin",import.meta.url).href,Ev=new URL("../assets/geometry-CE1rmuE-.json",import.meta.url).href,Rv=""+new URL("../assets/material-W-xnTbkZ.json",import.meta.url).href,Tv=""+new URL("../assets/reference-C2goyefQ.png",import.meta.url).href,Av=""+new URL("../assets/computer-geometry-kl6LRhFu.bin",import.meta.url).href,Cv=""+new URL("../assets/computer-geometry-BGsaO-dU.json",import.meta.url).href,Lv=""+new URL("../assets/computer-material-DOzauS52.json",import.meta.url).href,Pv=new URL("../assets/geometry-low-B-M19jbq.bin",import.meta.url).href,Dv=new URL("../assets/geometry-low-BDKL02N6.json",import.meta.url).href,Uv=new URL("../assets/geometry-Cnxf5sdK.bin",import.meta.url).href,Iv=new URL("../assets/geometry-ChGJdLSG.json",import.meta.url).href,Nv=""+new URL("../assets/material-PIpe_RG2.json",import.meta.url).href,Fv=""+new URL("../assets/reference-DJNhIOY2.png",import.meta.url).href,Bv=""+new URL("../assets/computer-geometry-2FhSUBsP.bin",import.meta.url).href,Ov=""+new URL("../assets/computer-geometry-NxqT9z8T.json",import.meta.url).href,zv=""+new URL("../assets/computer-material-BXySuXUY.json",import.meta.url).href,kv=new URL("../assets/geometry-low-CCo87iVh.bin",import.meta.url).href,Gv=new URL("../assets/geometry-low-B_gimyGe.json",import.meta.url).href,Vv=new URL("../assets/geometry-D35uNHRF.bin",import.meta.url).href,Hv=new URL("../assets/geometry-CsAgQd-s.json",import.meta.url).href,Wv=""+new URL("../assets/material-BbQYpXx7.json",import.meta.url).href,Xv=""+new URL("../assets/reference-DKlI2XTs.png",import.meta.url).href,jv=""+new URL("../assets/computer-geometry-8sFp0fYB.bin",import.meta.url).href,qv=""+new URL("../assets/computer-geometry-Cn1QZ2Gg.json",import.meta.url).href,Yv=""+new URL("../assets/computer-material-BH5KK6aw.json",import.meta.url).href,$v=new URL("../assets/geometry-Djz7eF4I.bin",import.meta.url).href,Kv=new URL("../assets/geometry-low-CNGUYtPJ.json",import.meta.url).href,Zv=new URL("../assets/geometry-V5mpIThN.bin",import.meta.url).href,Jv=new URL("../assets/geometry-BK1IibrK.json",import.meta.url).href,Qv=""+new URL("../assets/material-FPcmb08I.json",import.meta.url).href,eg=""+new URL("../assets/reference-Oomytcuv.png",import.meta.url).href,tg=""+new URL("../assets/computer-geometry-AndqqGl8.bin",import.meta.url).href,ng=""+new URL("../assets/computer-geometry-BzmKhFZA.json",import.meta.url).href,ig=""+new URL("../assets/computer-material-V2yltqDB.json",import.meta.url).href,rg=new URL("../assets/geometry-low-C-E9AND7.bin",import.meta.url).href,ag=new URL("../assets/geometry-low-D2RtLGsB.json",import.meta.url).href,sg=new URL("../assets/geometry-C0W7RsZa.bin",import.meta.url).href,og=new URL("../assets/geometry-C9oThjW5.json",import.meta.url).href,lg=""+new URL("../assets/material-CRAJ5ZBf.json",import.meta.url).href,cg=""+new URL("../assets/reference-WQ0QYPrL.png",import.meta.url).href,ug=""+new URL("../assets/computer-geometry-E8p2QDhI.bin",import.meta.url).href,hg=""+new URL("../assets/computer-geometry-CjuEECj6.json",import.meta.url).href,dg=""+new URL("../assets/computer-material-Cn75v0Yz.json",import.meta.url).href,fg=new URL("../assets/geometry-low-DACTAeB2.bin",import.meta.url).href,pg=new URL("../assets/geometry-low-BViYexDG.json",import.meta.url).href,mg=new URL("../assets/geometry-CXJKj_gB.bin",import.meta.url).href,vg=new URL("../assets/geometry-nJ7Yrw_9.json",import.meta.url).href,gg=""+new URL("../assets/material-IOJV4bM_.json",import.meta.url).href,_g=""+new URL("../assets/reference-BX4Nw3ys.png",import.meta.url).href;function yg(i,e){const t=e.map(c=>c.componentType==="uint16"?new Uint16Array(i,c.byteOffset,c.count):new Uint32Array(i,c.byteOffset,c.count));let n=0,r=!1;for(const c of t)if(n+=c.length,!r){for(let l=c.length-1;l>=0;l--)if(c[l]>=65535){r=!0;break}}const a=r?Uint32Array:Uint16Array;if(t.length===1&&t[0]instanceof a)return t[0];const s=new a(n);let o=0;for(const c of t)s.set(c,o),o+=c.length;return s}const Ha=["blue_beret","alfred","purple_heart","lime_frog","coral_monocle","gus","blue_spectacles","lime_headphones"],xg=Object.assign({"./assets/alfred/computer-geometry.bin":tv,"./assets/alfred/computer-geometry.json":nv,"./assets/alfred/computer-material.json":iv,"./assets/alfred/geometry-low.bin":rv,"./assets/alfred/geometry-low.json":av,"./assets/alfred/geometry.bin":sv,"./assets/alfred/geometry.json":ov,"./assets/alfred/material.json":lv,"./assets/alfred/reference.png":cv,"./assets/blue_beret/computer-geometry.bin":uv,"./assets/blue_beret/computer-geometry.json":hv,"./assets/blue_beret/computer-material.json":dv,"./assets/blue_beret/geometry-low.bin":fv,"./assets/blue_beret/geometry-low.json":pv,"./assets/blue_beret/geometry.bin":mv,"./assets/blue_beret/geometry.json":vv,"./assets/blue_beret/material.json":gv,"./assets/blue_beret/reference.png":_v,"./assets/blue_spectacles/computer-geometry.bin":yv,"./assets/blue_spectacles/computer-geometry.json":xv,"./assets/blue_spectacles/computer-material.json":bv,"./assets/blue_spectacles/geometry-low.bin":wv,"./assets/blue_spectacles/geometry-low.json":Sv,"./assets/blue_spectacles/geometry.bin":Mv,"./assets/blue_spectacles/geometry.json":Ev,"./assets/blue_spectacles/material.json":Rv,"./assets/blue_spectacles/reference.png":Tv,"./assets/coral_monocle/computer-geometry.bin":Av,"./assets/coral_monocle/computer-geometry.json":Cv,"./assets/coral_monocle/computer-material.json":Lv,"./assets/coral_monocle/geometry-low.bin":Pv,"./assets/coral_monocle/geometry-low.json":Dv,"./assets/coral_monocle/geometry.bin":Uv,"./assets/coral_monocle/geometry.json":Iv,"./assets/coral_monocle/material.json":Nv,"./assets/coral_monocle/reference.png":Fv,"./assets/gus/computer-geometry.bin":Bv,"./assets/gus/computer-geometry.json":Ov,"./assets/gus/computer-material.json":zv,"./assets/gus/geometry-low.bin":kv,"./assets/gus/geometry-low.json":Gv,"./assets/gus/geometry.bin":Vv,"./assets/gus/geometry.json":Hv,"./assets/gus/material.json":Wv,"./assets/gus/reference.png":Xv,"./assets/lime_frog/computer-geometry.bin":jv,"./assets/lime_frog/computer-geometry.json":qv,"./assets/lime_frog/computer-material.json":Yv,"./assets/lime_frog/geometry-low.bin":$v,"./assets/lime_frog/geometry-low.json":Kv,"./assets/lime_frog/geometry.bin":Zv,"./assets/lime_frog/geometry.json":Jv,"./assets/lime_frog/material.json":Qv,"./assets/lime_frog/reference.png":eg,"./assets/lime_headphones/computer-geometry.bin":tg,"./assets/lime_headphones/computer-geometry.json":ng,"./assets/lime_headphones/computer-material.json":ig,"./assets/lime_headphones/geometry-low.bin":rg,"./assets/lime_headphones/geometry-low.json":ag,"./assets/lime_headphones/geometry.bin":sg,"./assets/lime_headphones/geometry.json":og,"./assets/lime_headphones/material.json":lg,"./assets/lime_headphones/reference.png":cg,"./assets/purple_heart/computer-geometry.bin":ug,"./assets/purple_heart/computer-geometry.json":hg,"./assets/purple_heart/computer-material.json":dg,"./assets/purple_heart/geometry-low.bin":fg,"./assets/purple_heart/geometry-low.json":pg,"./assets/purple_heart/geometry.bin":mg,"./assets/purple_heart/geometry.json":vg,"./assets/purple_heart/material.json":gg,"./assets/purple_heart/reference.png":_g});function Wa(i,e){const t=xg[`./assets/${i}/${e}`];if(!t)throw Error(`Missing avatar asset: ${i}/${e}`);return t}async function en(i){const e=await fetch(i);if(!e.ok)throw Error(`Avatar resource failed (${e.status}): ${i}`);return e}async function bg(i,e="high",t=!1){const n=await yl(i,e);if(t){const r=new Set(n.material.parts.map(s=>s.id)),a=await yl(i,"computer",r);for(const s of n.parts){const o=a.material.parts.find(c=>c.id===s.id);s.renderOrder=s.fur?o.furRenderOrder:o.renderOrder}n.parts.push(...a.parts),n.material.parts.push(...a.material.parts.filter(s=>!r.has(s.id)))}return n}async function yl(i,e,t){const n=e==="low"?"geometry-low":"geometry",r=e==="computer"?"computer-":"",[a,s,o]=await Promise.all([en(Wa(i,`${r}${n}.json`)).then(c=>c.json()),en(Wa(i,`${r}material.json`)).then(c=>c.json()),en(Wa(i,`${r}${n}.bin`)).then(c=>c.arrayBuffer())]);return ro(i,a,s,o,e==="computer",t)}function ro(i,e,t,n,r=!1,a){if(e.buffer.byteLength!==n.byteLength||t.parts.length!==e.parts.length)throw Error(`Inconsistent avatar resources: ${i}`);const s=[];for(const o of e.parts){if(a?.has(o.id))continue;const c=t.parts[o.id],l=new lu,h=new j0(new Float32Array(n,o.vertices.byteOffset,o.vertices.byteLength/4),24),p={positionDelta0:"delta0",normalTarget0:"normal0",positionDelta1:"delta1",normalTarget1:"normal1"};for(const[v,g]of Object.entries(o.vertices.attributes))l.setAttribute(p[v]??v,new eo(h,g.components,g.byteOffset/4));const d=new Qs(new Uint16Array(o.vertices.count*4),4);d.gpuType=ta,l.setAttribute("skinJoints",d),l.setAttribute("skinWeights",new tn(new Float32Array(o.vertices.count*4),4)),l.setIndex(new jt(yg(n,o.indices),1)),s.push({geometry:l,id:o.id,kind:c.materialKind,fur:!1,fields:c.fields,label:c.label,attachment:c.attachment,universal:c.universal,activity:r?"computer":void 0,colorRole:o.id===0||c.attachment==="three_lobe"||r&&c.fields.referencePose?.[3]===-40?"body":void 0,transparent:c.transparent,depthWrite:c.depthWrite,depthTest:c.depthTest,doubleSided:c.doubleSided,renderOrder:c.renderOrder})}return{preset:i,material:t,parts:s}}const wg=""+new URL("../assets/furLTC1-B2s2_r7O.bin",import.meta.url).href,Sg=""+new URL("../assets/furLTC2-DzS6pv45.bin",import.meta.url).href,Mg=Zm.presets,Eg=Float32Array.from({length:384},(i,e)=>e%16%5===0?1:0);function xl(i){return Object.fromEntries(Object.entries(i).map(([e,t])=>[e,t.length===16?new pe().fromArray(t):new nt().fromArray(t)]))}async function Rg(i){const e=await fetch(i);if(!e.ok)throw Error(`Avatar resource failed (${e.status}): ${i}`);return e.arrayBuffer()}class Tg{constructor(e,t={}){if(this.canvas=e,this.scene=new Ns,this.camera=new no(-1.82,1.82,1.82,-1.82,.1,20),this.batches=[],this.assets=new Map,this.pendingAssets=new Map,this.retiredAssets=[],this.assetClaims=new Map,this.sizeRevision=0,this.fits=new wi(new Float32Array(800),200,1,Pt,Lt),this.cameras=new wi(new Float32Array(800),200,1,Pt,Lt),this.materials=[],this.textures=[],this.geometries=[],this.depthMaterials=[],this.depthTarget=new Ut(1,1,{depthBuffer:!0,depthTexture:new Jn(1,1,qt)}),this.disabledShadow=new Jn(1,1,qt),this.colorTarget=new Ut(1,1,{depthBuffer:!0,samples:4,resolveDepthBuffer:!1,storeMultisampledDepthBuffer:!1}),this.renderBounds=new nt,this.presentScene=new Ns,this.presentGeometry=new nr(2,2),this.presentMaterial=new ji({glslVersion:Mi,vertexShader:"precision highp float; in vec3 position; out vec2 uv; void main(){uv=position.xy*.5+.5;gl_Position=vec4(position,1);}",fragmentShader:`precision highp float;
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
      }`,uniforms:{image:{value:this.colorTarget.texture},surface:{value:new Ve},grid:{value:new nt},fits:{value:this.fits}},depthTest:!1,depthWrite:!1,premultipliedAlpha:!0}),this.raf=0,this.urgentFrame=!0,this.presentationCapacity=!0,this.presentationQueued=!1,this.maxFrameRate=60,this.disposed=!1,this.count=1,this.frames=0,this.fitPasses=0,this.elapsed=0,this.timedFrames=0,this.ready=!1,this.width=320,this.height=320,this.cols=1,this.rows=1,this.paused=!0,this.time=0,this.reactionComposer=new jm,this.reactionEyes=new gl,this.previousTime=0,this.attributesDirty=!0,this.cropCache=new Map,this.fitsDirty=!0,this.fitGeneration=0,this.fitReads=[],this.renderFailure=null,this.fitPending=!0,this.backingPixels=320,this.poseObject=new Bt,this.pointerIndex=null,this.hoverIndex=null,this.pointerPivot=new O,this.rotatedPivot=new O,this.pointerBasis=new pe().makeRotationY(8*Math.PI/180),this.pointerInverse=this.pointerBasis.clone().invert(),this.pointerMatrix=new pe,this.pointerPitch=new pe,this.eyeWorld=new pe,this.eyeNormal=new pe,this.projection=new pe,this.inverseProjection=new pe,this.partWorld=new pe,this.partNormal=new pe,this.states=[],this.poseSharing=new hm,this.inViewport=!0,this.contextLost=!1,this.visibilityChanged=()=>{this.previousTime=0,this.hidden()||!this.inViewport||this.contextLost?(this.cancelFitReads(),this.cancelFrame(),this.raf=0):this.invalidate()},this.onContextLost=()=>{this.cancelFitReads(),this.contextLost=!0,this.visibilityChanged()},this.onContextRestored=()=>{this.contextLost=!1,this.previousTime=0,this.resize()},this.tick=s=>{if(this.raf=0,!this.presentationCapacity){this.presentationQueued=!0;return}if(this.fitReads.length||this.renderFailure||this.disposed||!this.ready||this.hidden()||!this.inViewport||this.contextLost)return;if(this.states.every(m=>m.rendering===!1)){this.previousTime=0;return}if(!this.urgentFrame&&this.previousTime&&s-this.previousTime<1e3/this.maxFrameRate-1){this.invalidate(!1);return}this.urgentFrame=!1;const o=this.previousTime?(s-this.previousTime)/1e3:0;!this.paused&&this.previousTime&&(this.time+=o,this.elapsed+=o,this.timedFrames++),this.previousTime=s;const c=this.projection.multiplyMatrices(this.camera.projectionMatrix,this.camera.matrixWorldInverse);this.inverseProjection.copy(c).invert();const l=this.fitPending;if(this.poseSharing.beginFrame(),!l)for(const m of this.states){const u=m.motion;if(m.rendering===!1||m.poseOverride||u?.kind!=="idle"||u.pendingStart)continue;const f=this.asset(m.preset)?.samplers?.idle;if(!f)continue;const w=u.held??this.time-u.started;(m.poseSampler!==f||m.poseSampleTime!==w)&&this.poseSharing.register(f,w)}const h=this.poseObject;let p=!1;for(const[m,u]of this.states.entries()){if(u.rendering===!1&&!l)continue;const f=this.asset(u.preset);if(h.position.set(0,this.paused||l||u.poseOverride||f?.samplers?0:Math.sin(this.time*1.8+u.phase)*.025,0),h.rotation.set(l?0:-u.look.y*.12,l?0:u.look.x*.18,this.paused||l||u.poseOverride||f?.samplers?0:Math.sin(this.time+u.phase)*.02),h.scale.setScalar(1),u.entrance&&!l){u.entrance.pendingStart&&(u.entrance.started=this.time,delete u.entrance.pendingStart);const T=Math.min(1,Math.max(0,u.entrance.held??this.time-u.entrance.started)),P=1-(1-T)**3;h.scale.setScalar(.1+.9*P),h.position.x-=.26*Math.sin(Math.PI*T)*(1-T),h.position.y-=.55*(1-P),h.rotation.z-=.32*(1-P),T===1&&(u.entrance=void 0)}if(u.wander&&!l&&!this.paused&&u.motion?.held===void 0&&(!u.motion||u.motion.kind==="idle")&&this.hoverIndex!==m&&this.pointerIndex!==m&&this.time>=u.wander.next){const T=u.phase+ ++u.wander.step*2.399963;this.queueGaze(m,.5+Math.sin(T)*.28,.5+Math.sin(T*1.73)*.2),u.wander.next=this.time+1.8+(1+Math.sin(T*.7))*1.2}if(h.updateMatrix(),u.matrix.copy(h.matrix),!u.poseOverride&&f?.samplers&&!l&&(!this.paused||u.motion)){const T=f.samplers,P=u.motion;u.motion=_c(u.motion,T,this.time),P?.pendingStart&&u.reactionGaze?.motion===P&&(u.reactionGaze.motion=u.motion);const U=u.motion,D=U?.kind==="work"&&U.continuous?T.workLoop:T[U?.kind??"idle"];(!u.pose||u.poseSampler!==D)&&(u.pose=D.createPose(),u.poseSampler=D,u.poseSampleTime=void 0);const z=U?.held??(U?this.time-U.started:this.time+u.phase);u.poseSampleTime!==z&&(this.poseSharing.sample(D,z,u.pose),u.poseSampleTime=z)}const w=u.motion?.kind==="reaction"?f?.samplers?.reactionGaze:void 0;if(w&&u.motion){u.reactionGaze?.motion!==u.motion&&(u.reactionGaze={motion:u.motion,yaw:u.gaze.yaw,pitch:u.gaze.pitch,x:u.eyes.x,y:u.eyes.y,strength:1,frozen:!0});const T=Xm((u.motion.held??this.time-u.motion.started)-w.entryTime,w.coreSeconds);u.reactionGaze.strength=T.strength,u.reactionGaze.frozen=T.frozen}else u.reactionGaze=void 0;u.normalMatrix.copy(u.matrix).setPosition(0,0,0),u.pointer.sample(s/1e3);const C=u.motion?.kind==="work",M=u.reactionGaze,x=M?.strength??1,S=C?0:u.pointer.yaw+(M?.frozen?M.yaw:u.gaze.yaw)*x,R=C?0:u.pointer.pitch+(M?.frozen?M.pitch:u.gaze.pitch)*x;if(!l&&(S||R)){if(this.pointerMatrix.copy(this.pointerBasis).multiply(this.pointerPitch.makeRotationY(S)).multiply(this.pointerPitch.makeRotationX(R)).multiply(this.pointerInverse),u.normalMatrix.premultiply(this.pointerMatrix),M){const T=(u.poseOverride?.get("mesh:0")??u.pose?.[0])?.fields.gazeNeutralTranslation;if(!T)throw Error("Reaction is missing its independent neutral frame");this.pointerPivot.fromArray(T),this.rotatedPivot.copy(this.pointerPivot).applyMatrix4(this.pointerMatrix),this.pointerMatrix.setPosition(this.pointerPivot.sub(this.rotatedPivot))}else if(f?.source.preset!=="blue_beret"){const T=u.poseOverride?.get("mesh:0")?.world??(!this.paused||u.motion?u.pose?.[0]?.world:void 0)??f.parts[0].material.uniforms.d.value.world;this.pointerPivot.setFromMatrixPosition(T),this.rotatedPivot.copy(this.pointerPivot).applyMatrix4(this.pointerMatrix),this.pointerMatrix.setPosition(this.pointerPivot.sub(this.rotatedPivot))}u.matrix.premultiply(this.pointerMatrix)}const _=l?void 0:u.poseOverride?.get("mesh:0")?.fields.camera??(!this.paused||u.motion?u.pose?.[0]?.fields.camera:void 0),E=this.cameras.image.data,L=m*4;for(let T=0;T<4;T++){const P=Math.fround(_?.[T]??(T<2?1:0));E[L+T]!==P&&(E[L+T]=P,p=!0)}}p&&(this.cameras.clearUpdateRanges(),this.cameras.addUpdateRange(0,this.count*4),this.cameras.needsUpdate=!0),this.occlusion.setAvatars(this.cameras,Math.min(this.count,this.cols),this.rows,this.backingPixels,this.count);for(const m of this.materials)m.uniforms.crowdProjection.value.copy(c);this.batches.forEach(m=>{const{mesh:u,part:f}=m,w=m.slots.filter(R=>this.states[R].rendering!==!1),C=this.attributesDirty||!m.renderedSlots||w.length!==m.renderedSlots.length||w.some((R,_)=>R!==m.renderedSlots[_]);m.renderedSlots=w,u.count=w.length,m.visible=!1;let M=0;const x=u.geometry.getAttribute("instanceOffset"),S=u.geometry.getAttribute("instancePigment");w.forEach((R,_)=>{const E=this.states[R];if(f.motionTexture){const T=l?void 0:E.poseOverride?.get(`${f.source.fur?"fur":"mesh"}:${f.source.id}`)??(!this.paused||E.motion?E.pose?.[E.motion?.kind==="work"?E.motion.continuous?f.workLoopPart:f.workPart:f.motionPart]:void 0);T?(this.partWorld.multiplyMatrices(E.matrix,T.world),this.partNormal.multiplyMatrices(E.normalMatrix,T.normalMatrix)):(this.partWorld.multiplyMatrices(E.matrix,f.material.uniforms.d.value.world),this.partNormal.multiplyMatrices(E.normalMatrix,f.material.uniforms.d.value.normalMatrix));const P=E.reactionGaze,U=E.poseOverride?.get("mesh:0")??(!this.paused||E.motion?E.pose?.[0]:void 0),D=U?.fields.eyeBlink?.[0],z=!P||D!==void 0;if(!l&&f.eyeProfile&&E.motion?.kind!=="work"&&(f.eyeProfile.blink!=="external"||z)&&(P?.strength??1)>0&&((P?.frozen?P.x:E.eyes.x)||(P?.frozen?P.y:E.eyes.y))){const I=f.eyeProfile.blink==="external"?D??0:$m(T?.fields.parameters??f.source.fields.parameters,f.eyeProfile.blink);if(P){this.reactionEyes.x=P.frozen?P.x:E.eyes.x,this.reactionEyes.y=P.frozen?P.y:E.eyes.y;const q=U?.fields;if(!q?.gazeNeutralTranslation||!q.gazeNeutralScale)throw Error("Reaction is missing its independent ocular frame");this.reactionComposer.writeEyeCorrection(this.reactionEyes,f.eyeProfile,I,P.strength,q.gazeNeutralTranslation,q.gazeNeutralScale,T?.world??f.material.uniforms.d.value.world,this.eyeWorld,this.eyeNormal)}else E.eyes.writeCorrection(f.eyeProfile,I,this.eyeWorld,this.eyeNormal);this.partWorld.multiply(this.eyeWorld),this.partNormal.multiply(this.eyeNormal)}u.setMatrixAt(_,this.partWorld);const W=f.motionTexture.image.data;for(let I=0;I<12;I++)W[_*64+I]=this.partNormal.elements[I];W.set(T?.fields.parameters??f.source.fields.parameters,_*64+12),W.set(T?.fields.signatureDeform??f.source.fields.signatureDeform,_*64+16),W.set(T?.fields.colorRoughness??f.source.fields.colorRoughness,_*64+20),W.set(T?.fields.paletteClosure??f.source.fields.paletteClosure,_*64+24),W.set(T?.fields.referencePose??f.source.fields.referencePose,_*64+28),W.set(T?.fields.coverage??f.source.fields.coverage,_*64+32);const j=T?.fields.camera,Z=_*64+36;if(W[Z]=j?.[0]??1,W[Z+1]=j?.[1]??1,W[Z+2]=j?.[2]??0,W[Z+3]=j?.[3]??(f.source.activity?0:1),m.visible||=W[Z+3]>0,W.set(T?.fields.eyeCurveOriginAmount??f.source.fields.eyeCurveOriginAmount,_*64+40),W.set(T?.fields.eyeCurveRightWidth??f.source.fields.eyeCurveRightWidth,_*64+44),W.set(this.partWorld.elements,_*64+48),f.source.fur){const I=this.partWorld.elements,q=Math.max(Math.hypot(I[0],I[1],I[2]),Math.hypot(I[4],I[5],I[6]),Math.hypot(I[8],I[9],I[10])),Q=f.source.fields.fur[1]*f.source.fields.fur[2]*q*Math.abs(Cr.frame.viewProjection[5])*(j?.[1]??1)*this.backingPixels*.5;M=Math.max(M,Math.min(8192,160+Q*Q*.027)*ri.clamp((Q-12)/48,0,1))}}else u.setMatrixAt(_,E.matrix),m.visible=!0;if(!C)return;x.setXY(_,(R%this.cols-(Math.min(this.count,this.cols)-1)/2)*3.64,((this.rows-1)/2-Math.floor(R/this.cols))*3.64);const L=E.color;if(f.source.colorRole!=="body")S.setXYZ(_,1,1,1);else if(f.source.attachment==="three_lobe"||f.source.activity==="computer"){const T=this.asset(E.preset).source.material.parts[0].fields.colorRoughness,P=f.source.fields.colorRoughness;S.setXYZ(_,L.r*T[0]/Math.max(P[0],1e-6),L.g*T[1]/Math.max(P[1],1e-6),L.b*T[2]/Math.max(P[2],1e-6))}else S.setXYZ(_,L.r,L.g,L.b)}),w.length&&(u.instanceMatrix.clearUpdateRanges(),u.instanceMatrix.addUpdateRange(0,w.length*16),u.instanceMatrix.needsUpdate=!0),f.source.fur&&f.motionTexture&&u.geometry.setDrawRange(0,Math.ceil(M)*12),w.length&&f.motionTexture&&(f.motionTexture.clearUpdateRanges(),w.length===1&&f.motionTexture.image.height>1&&f.motionTexture.addUpdateRange(0,64),f.motionTexture.needsUpdate=!0),C&&w.length&&(x.clearUpdateRanges(),x.addUpdateRange(0,w.length*2),S.clearUpdateRanges(),S.addUpdateRange(0,w.length*3),x.needsUpdate=S.needsUpdate=!0)}),this.attributesDirty=!1,this.updateRenderBounds(),this.renderer.info.autoReset=!1,this.renderer.info.reset(),this.batches.forEach(({mesh:m,part:u,visible:f})=>{m.visible=f&&u.depth!==null,u.depth&&(m.material=u.depth)}),this.renderer.setRenderTarget(this.depthTarget),this.renderer.render(this.scene,this.camera);const d=this.occlusion.render(this.depthTarget.depthTexture,c,this.depthTarget.width,this.depthTarget.height,this.renderBounds);if(this.batches.forEach(({mesh:m,part:u,visible:f})=>{m.visible=f,m.material=u.material,u.material.uniforms.ambientOcclusion.value=d}),this.renderer.setRenderTarget(this.colorTarget),this.renderer.render(this.scene,this.camera),this.updateCrops(),l){this.fitPasses++,this.fitReads.length||this.invalidate();return}const v=this.renderer.getPixelRatio();if(this.renderer.setScissor(this.renderBounds.x/v,this.renderBounds.y/v,this.renderBounds.z/v,this.renderBounds.w/v),this.renderer.setScissorTest(this.colorTarget.scissorTest),this.renderer.setRenderTarget(this.outputTarget??null),this.renderer.render(this.presentScene,this.camera),this.renderer.setScissorTest(!1),this.frames++,this.host&&this.outputTarget){const{__webglFramebuffer:m}=this.renderer.properties.get(this.outputTarget);this.host.onFrame({framebuffer:m,width:this.outputTarget.width,height:this.outputTarget.height,columns:Math.min(this.count,this.cols),rows:this.rows,pixels:this.backingPixels,renderedIndices:this.states.flatMap((u,f)=>u.rendering===!1?[]:[f])})}this.onFrame?.();let g=!1;for(const m of this.states){if(m.rendering===!1)continue;const u=m.gaze.yaw,f=m.gaze.pitch,w=m.eyes.x,C=m.eyes.y;m.gaze.advance(o),m.eyes.advance(o),m.gazePending&&(m.gaze.point(m.gazeTarget.x,m.gazeTarget.y),this.asset(m.preset)?.parts.some(M=>M.eyeProfile)&&m.eyes.point(m.gazeTarget.x,m.gazeTarget.y),m.gazePending=!1),g||=u!==m.gaze.yaw||f!==m.gaze.pitch||m.gaze.moving||w!==m.eyes.x||C!==m.eyes.y||m.eyes.moving}g||this.states.some(m=>m.rendering!==!1&&(m.pointer.moving||!this.paused&&m.entrance&&m.entrance.held===void 0))||!this.paused&&this.states.some(m=>m.rendering!==!1&&!m.poseOverride&&(!this.asset(m.preset)?.samplers||!m.motion||m.motion.held===void 0&&(m.motion.kind==="idle"||m.motion.continuous||this.time-m.motion.started<this.asset(m.preset).samplers[m.motion.kind].clip.duration)))?this.invalidate(!1):this.previousTime=0},this.host=t.host,!e&&!this.host)throw Error("Avatar engine requires a canvas or a render host");this.allowPoseOverrides=t.poseOverrides??!1,this.onFrame=t.onFrame,this.onError=t.onError,this.resolveAsset=t.resolveAsset,this.lazyWork=t.lazyWork??!1,this.assetLoader=t.assetLoader??bg,this.maxFrameRate=this.validFrameRate(t.maxFrameRate??60),this.defaultPreset=t.preset??"blue_beret",this.count=this.validCount(t.count??1),this.pixels=Math.max(48,Number.isFinite(t.size)?t.size:320),this.detail=this.pixels<=128?"low":"high",this.fits.needsUpdate=!0;const n=new Map,r=s=>{const o={type:s,preventDefault(){}};for(const c of n.get(s)??[])c(o)};if(this.host&&typeof this.host.context.texStorage2D!="function")throw Error("Avatar render host requires a WebGL2 context");const a=this.host?{width:1,height:1,style:{},getContext:s=>s==="webgl2"?this.host.context:null,addEventListener(s,o){const c=n.get(s)??new Set;c.add(o),n.set(s,c)},removeEventListener(s,o){n.get(s)?.delete(o)},setAttribute(){}}:e;this.renderer=new cm({canvas:a,alpha:!0,antialias:!1}),this.disabledShadow.compareFunction=ia,this.disabledShadow.needsUpdate=!0,this.occlusion=new Vm(this.renderer,Cr.frame),this.renderer.setPixelRatio(Math.min(this.pixelRatio(),2)),this.renderer.setClearColor(0,0),this.renderer.outputColorSpace=Zi,this.presentScene.add(new Gt(this.presentGeometry,this.presentMaterial)),this.camera.position.z=4,this.camera.updateMatrixWorld(),this.host?(this.outputTarget=new Ut(1,1,{depthBuffer:!1}),this.unsubscribeHost=this.host.subscribe?.({resize:()=>this.resize(),visibility:this.visibilityChanged,contextLost:()=>{r("webglcontextlost"),this.onContextLost()},contextRestored:()=>{r("webglcontextrestored"),this.onContextRestored()}})):(this.observer=new ResizeObserver(()=>this.resize()),this.observer.observe(e),this.visibilityObserver=new IntersectionObserver(([s])=>{this.inViewport=s?.isIntersecting??!1,this.visibilityChanged()}),this.visibilityObserver.observe(e),document.addEventListener("visibilitychange",this.visibilityChanged),e.addEventListener("webglcontextlost",this.onContextLost),e.addEventListener("webglcontextrestored",this.onContextRestored)),this.loaded=this.load()}hidden(){return this.host?this.host.isHidden():document.hidden}pixelRatio(){return this.host?this.host.getSize().pixelRatio:window.devicePixelRatio||1}cancelFrame(){this.host?this.host.cancelFrame(this.raf):cancelAnimationFrame(this.raf)}async load(){const e=await Promise.all([wg,Sg].map(Rg));this.disposed||(this.textures=e.map((t,n)=>{const r=Cr.sourceTextures[n+2],a=r.type===5126,s=new wi(a?new Float32Array(t):new Uint8Array(t),r.width,r.height,Pt,a?Lt:Nt);return s.wrapS=s.wrapT=Xt,s.minFilter=s.magFilter=wt,s.generateMipmaps=!1,s.needsUpdate=!0,s}),await this.ensureAsset(this.defaultPreset),!this.disposed&&(this.ready=!0,this.setCount(this.count)))}asset(e){return this.assets.get(`${e}:${this.detail}`)}ensureAsset(e,t=this.detail,n=!this.lazyWork||this.states.some(r=>r.preset===e&&r.motion?.kind==="work")){const r=`${e}:${t}`,a=`${r}:${n?"work":"base"}`;if(!Ha.includes(e)&&!this.resolveAsset)return Promise.reject(Error(`Unsupported avatar: ${e}`));const s=this.assets.get(r);if(s&&(!n||s.activities))return Promise.resolve(s);const o=this.pendingAssets.get(a);if(o)return o;const l=(Ha.includes(e)?Promise.all([this.assetLoader(e,t,n),Fm(e,n)]).then(([h,p])=>(zm(h.parts),{source:h,samplers:p,eyeProfiles:void 0})):this.resolveAsset(e,t,n)).then(({source:h,samplers:p,eyeProfiles:d})=>{if(this.disposed)throw h.parts.forEach(u=>u.geometry.dispose()),Error("Avatar engine disposed during loading");const v=h.parts.map(u=>{u.geometry.setAttribute("instanceOffset",new qr(new Float32Array(400),2).setUsage(fa)),u.geometry.setAttribute("instancePigment",new qr(new Float32Array(600).fill(1),3).setUsage(fa));const f=p||this.allowPoseOverrides?new wi(new Float32Array(64),16,1,Pt,Lt):null,w=p?.idle.clip.parts.findIndex(R=>R.id===`${u.fur?"fur":"mesh"}:${u.id}`)??-1,C=p?.work?.clip.parts.findIndex(R=>R.id===`${u.fur?"fur":"mesh"}:${u.id}`)??-1,M=p?.workLoop?.clip.parts.findIndex(R=>R.id===`${u.fur?"fur":"mesh"}:${u.id}`)??-1;if(p&&w<0&&!u.activity)throw Error(`Missing motion part: ${e}/${u.id}`);const x=this.material(u,h.material.frame);f&&(x.defines.AUTHORED_MOTION=1,x.defines.AUTHORED_COMPUTER=1,x.uniforms.instancePose={value:f});const S=u.fur||u.depthWrite===!1?null:new ji({glslVersion:Mi,vertexShader:_l,fragmentShader:"precision highp float; out vec4 color; void main(){color=vec4(1);}",uniforms:x.uniforms,defines:f?{AUTHORED_MOTION:1,AUTHORED_COMPUTER:1}:{},colorWrite:!1});return this.geometries.push(u.geometry),this.materials.push(x),S&&this.depthMaterials.push(S),{source:u,material:x,depth:S,motionTexture:f,motionPart:w,workPart:C,workLoopPart:M,eyeProfile:u.fur?null:(d?d[u.id]:Mg[h.preset]?.[t==="high"?"1":"0"]?.[u.id])??null}}),g={source:h,parts:v,samplers:p,activities:n},m=this.assets.get(r);return m?.activities&&!n?(this.disposeAsset(g),m):(m&&this.retiredAssets.push(m),this.assets.set(r,g),t==="high"&&Ha.includes(e)&&this.cropCache.set(`${e}:high:320`,h.material.crop),g)}).finally(()=>this.pendingAssets.delete(a));return this.pendingAssets.set(a,l),l}material(e,t){const n=xl(t);return new ji({glslVersion:Mi,vertexShader:_l,fragmentShader:Jm,defines:{...e.universal?{}:{FELIPE_MATERIAL:1,FELIPE_KIND:e.kind},...e.fur?{FELIPE_FUR:1}:{}},uniforms:{f:{value:n},d:{value:xl(e.fields)},skin:{value:{joints:Eg}},crowdProjection:{value:new pe},crowdInverseProjection:{value:this.inverseProjection},outputInverse:{value:new Ve},ambientOcclusion:{value:null},shadowMap:{value:this.disabledShadow},shadowDepth:{value:null},occlusionDepth:{value:this.depthTarget.depthTexture},environmentBRDF:{value:null},studioLighting:{value:null},paletteField:{value:null},referencePalette:{value:null},furLTC1:{value:this.textures[0]},furLTC2:{value:this.textures[1]}},premultipliedAlpha:!0,transparent:e.transparent??(e.fur||e.fields.coverage[0]<1),depthWrite:e.depthWrite??!e.fur,depthTest:e.depthTest??!0,side:e.doubleSided||e.fur?cn:Fn})}validCount(e){return Math.max(1,Math.min(200,Math.floor(Number.isFinite(e)?e:1)))}setCount(e){if(this.disposed)return;const t=this.validCount(e);if(!(this.ready&&this.count===t&&this.states.length===t)&&(this.pointerIndex!==null&&this.pointerIndex>=t&&this.endPointer(),this.hoverIndex!==null&&this.hoverIndex>=t&&this.selectHover(null),this.count=t,!!this.ready)){for(;this.states.length<this.count;)this.states.push({preset:this.defaultPreset,matrix:new pe,normalMatrix:new pe,color:new qe(1,1,1),colorHex:null,look:new Ve,pointer:new Hm,gaze:new Wm,eyes:new gl,gazeTarget:new Ve(.5,.5),gazePending:!1,phase:this.states.length*2.399,revision:0});this.states.length=this.count;for(const n of this.states)this.resolvePigment(n);this.rebuildBatches()}}pruneAssets(){const e=new Set([this.defaultPreset,...this.states.map(n=>n.preset),...this.assetClaims.keys()]),t=[...this.assets].filter(([n])=>!e.has(n.slice(0,n.lastIndexOf(":")))&&!this.pendingAssets.has(`${n}:base`)&&!this.pendingAssets.has(`${n}:work`));for(const[n,r]of t.slice(0,Math.max(0,t.length-4))){this.assets.delete(n),this.disposeAsset(r);for(const a of this.cropCache.keys())a.startsWith(n+":")&&this.cropCache.delete(a)}}disposeAsset(e){for(const t of e.parts)t.motionTexture?.dispose(),t.source.geometry.dispose(),t.material.dispose(),t.depth?.dispose(),this.geometries=this.geometries.filter(n=>n!==t.source.geometry),this.materials=this.materials.filter(n=>n!==t.material),t.depth&&(this.depthMaterials=this.depthMaterials.filter(n=>n!==t.depth))}async ensureCurrentDetail(e,t){for(const r of e)this.assetClaims.set(r,(this.assetClaims.get(r)??0)+1);const n=()=>{for(const r of e){const a=this.assetClaims.get(r)-1;a?this.assetClaims.set(r,a):this.assetClaims.delete(r)}this.disposed||this.pruneAssets()};try{let r;do r=this.detail,await Promise.all(e.map(a=>this.ensureAsset(a,r,t)));while(!this.disposed&&r!==this.detail);return n}catch(r){throw n(),r}}getInstancePreset(e){return this.states[e]?.preset}hasPreset(e){return!!this.asset(e)}cancelPresetChange(e){const t=this.states[e];t&&t.revision++}async setPreset(e,t,n=()=>!0){await this.loaded;const r=this.states[e];if(!r||this.disposed)return;const a=++r.revision;if(r.preset===t&&this.asset(t))return;const s=await this.ensureCurrentDetail([t]);try{if(this.disposed||this.states[e]!==r||a!==r.revision||!n())return;r.preset!==t&&(this.pointerIndex===e&&this.endPointer(),r.pointer.reset(),r.gaze.reset(),r.eyes.reset(),r.gazeTarget.set(.5,.5),r.gazePending=!1,r.motion=void 0,r.pose=void 0,r.poseOverride=void 0),r.preset=t,this.resolvePigment(r),this.rebuildBatches()}finally{s()}}async setPresets(e){await this.loaded;const t=this.states.map((r,a)=>({state:r,revision:++r.revision,preset:e[a%e.length]}));if(t.some(r=>!r.preset))throw Error("An avatar preset is required");const n=await this.ensureCurrentDetail([...new Set(t.map(r=>r.preset))]);try{if(this.disposed)return;t.forEach(({state:r,revision:a,preset:s},o)=>{this.states[o]===r&&r.revision===a&&(r.preset!==s&&(this.endPointer(),r.pointer.reset(),r.gaze.reset(),r.eyes.reset(),r.gazeTarget.set(.5,.5),r.gazePending=!1,r.motion=void 0,r.pose=void 0,r.poseOverride=void 0),r.preset=s,this.resolvePigment(r))}),this.rebuildBatches()}finally{n()}}rebuildBatches(){for(const{mesh:t}of this.batches)this.scene.remove(t),t.dispose();this.batches=[];for(const t of this.retiredAssets)this.disposeAsset(t);this.retiredAssets=[];const e=new Map;this.states.forEach((t,n)=>{const r=e.get(t.preset)??[];r.push(n),e.set(t.preset,r)});for(const[t,n]of e){const r=this.asset(t);for(const a of r.parts){if(a.motionTexture&&a.motionTexture.image.height<n.length){const c=Math.min(200,2**Math.ceil(Math.log2(n.length)));a.motionTexture.dispose(),a.motionTexture.image={data:new Float32Array(c*64),width:16,height:c},a.motionTexture.needsUpdate=!0}const s=a.source.geometry,o=new Q0(s,a.material,n.length);o.frustumCulled=!1,o.renderOrder=a.source.renderOrder??0,o.instanceMatrix.setUsage(fa),this.scene.add(o),this.batches.push({mesh:o,part:a,slots:n,visible:!0})}for(const a of n)this.fits.image.data.set(r.source.material.crop,a*4)}this.fits.needsUpdate=!0,this.resize()}async setSize(e){if(!Number.isFinite(e)||this.disposed)return;this.pixels=Math.max(48,e);const t=++this.sizeRevision,n=this.pixels<=128?"low":"high";for(this.resize(),await this.loaded;!this.disposed&&t===this.sizeRevision&&n!==this.detail;){if(await Promise.all([...new Set(this.states.map(r=>r.preset))].map(r=>this.ensureAsset(r,n))),this.disposed||t!==this.sizeRevision)return;this.states.some(r=>!this.assets.has(`${r.preset}:${n}`))||(this.detail=n,this.rebuildBatches())}}setPose(e,t){if(!this.allowPoseOverrides)throw Error("Pose overrides were not enabled");if(this.disposed)return;const n=this.states[e];if(n){if(t){const r=this.asset(n.preset);if(!r)throw Error("Avatar assets are not ready");const a=new Map(t.map(o=>[o.id,o]));if(a.size!==t.length||a.size!==r.parts.length)throw Error("Pose parts must match the selected avatar");for(const o of r.parts){const c=a.get(`${o.source.fur?"fur":"mesh"}:${o.source.id}`);if(!c||!c.world.elements.every(Number.isFinite)||!c.normalMatrix.elements.every(Number.isFinite))throw Error("Invalid pose transform or part identity");for(const h of["parameters","signatureDeform","colorRoughness","paletteClosure","referencePose","coverage","eyeCurveOriginAmount","eyeCurveRightWidth","camera"]){const p=c.fields[h];if(p&&(p.length!==4||!p.every(Number.isFinite)))throw Error(`Invalid pose field: ${h}`)}const l=c.fields.camera;if(l&&(l[0]<=0||l[1]<=0||l[3]<0||l[3]>1))throw Error("Invalid pose camera")}const s=n.poseOverride??new Map;for(const o of a.values()){const c=s.get(o.id);if(!c)s.set(o.id,{id:o.id,world:o.world.clone(),normalMatrix:o.normalMatrix.clone(),fields:Object.fromEntries(Object.entries(o.fields).map(([l,h])=>[l,h.slice()]))});else{c.world.copy(o.world),c.normalMatrix.copy(o.normalMatrix);for(const l of Object.keys(c.fields))l in o.fields||delete c.fields[l];for(const[l,h]of Object.entries(o.fields)){const p=c.fields[l]??(c.fields[l]=[]);for(let d=0;d<h.length;d++)p[d]=h[d]}}}n.poseOverride=s}else n.poseOverride=void 0;this.invalidate()}}resetAppearance(e){(e===void 0||this.pointerIndex===e)&&this.endPointer(),(e===void 0||this.hoverIndex===e)&&(this.hoverIndex=null),this.attributesDirty=!0;for(const t of e===void 0?this.states:this.states.slice(e,e+1))t.motion=void 0,t.poseOverride=void 0,t.colorHex=null,this.resolvePigment(t),t.look.set(0,0),t.pointer.reset(),t.gaze.reset(),t.eyes.reset(),t.gazeTarget.set(.5,.5),t.gazePending=!1;this.invalidate()}setMotionFrame(e,t,n){const r=this.states[e];return!r||!this.asset(r.preset)?.samplers||!Number.isFinite(n)||t!=="idle"&&t!=="reaction"&&t!=="work"||!this.asset(r.preset)?.samplers?.[t]?!1:(r.poseOverride=void 0,r.motion={kind:t,started:this.time,held:Math.max(0,n)},this.invalidate(),!0)}canReact(e){const t=this.states[e];return!!t&&!!this.asset(t.preset)?.samplers?.reaction}canIdle(e){const t=this.states[e];return!!t&&!!this.asset(t.preset)?.samplers?.idle}canWork(e){const t=this.states[e];if(!t)return!1;const n=this.asset(t.preset);return!!n?.samplers?.work&&n.parts.some(r=>r.source.activity==="computer")}async prepareWork(e){await this.loaded;const t=this.states[e];if(!t||this.disposed)return!1;const n=t.preset,r=t.revision;if(this.asset(n)?.activities)return this.canWork(e);const a=await this.ensureCurrentDetail([n],!0);try{return this.disposed?!1:(this.rebuildBatches(),this.states[e]===t&&t.preset===n&&t.revision===r&&this.canWork(e))}finally{a()}}work(e,t=!1,n=1){const r=this.states[e];return!r||!this.canWork(e)||t&&!this.asset(r.preset)?.samplers?.workLoop?!1:(r.poseOverride=void 0,r.motion={kind:"work",started:this.time,pendingStart:!0,continuous:t,remainingCycles:Number.isFinite(n)?Math.max(1,Math.floor(n)):1},this.setPaused(!1),!0)}react(e){const t=this.states[e];if(!t||t.pointer.active||!this.asset(t.preset)?.samplers?.reaction)return!1;const n=this.asset(t.preset).samplers.reaction.clip;return t.motion?.kind==="reaction"&&t.motion.held===void 0&&(t.motion.pendingStart||this.time-t.motion.started<n.duration)?(t.motion.queuedReaction=!0,this.invalidate(),!0):(t.poseOverride=void 0,t.motion={kind:"reaction",started:this.time,pendingStart:!0},t.reactionGaze={motion:t.motion,yaw:t.gaze.yaw,pitch:t.gaze.pitch,x:t.eyes.x,y:t.eyes.y,strength:1,frozen:!0},this.setPaused(!1),!0)}idle(e){const t=this.states[e];return!t||!this.asset(t.preset)?.samplers?!1:(t.poseOverride=void 0,t.motion={kind:"idle",started:this.time},this.setPaused(!1),!0)}validFrameRate(e){if(e!==1/0&&(!Number.isFinite(e)||e<1||e>240))throw Error("Frame rate must be 1–240 or Infinity");return e}setMaxFrameRate(e){this.maxFrameRate=this.validFrameRate(e),this.invalidate()}setPaused(e){e&&this.states.forEach(t=>{t.motion=void 0}),this.paused!==e&&(this.previousTime=0),this.paused=e,this.invalidate()}entrance(e){const t=this.states[e];t&&(t.entrance={started:this.time,pendingStart:!0},this.invalidate())}setWander(e,t){const n=this.states[e];n&&(n.wander=t?{next:this.time,step:0}:void 0,this.invalidate())}setGaze(e,t,n){if(!Number.isFinite(t)||!Number.isFinite(n))throw Error("Invalid avatar gaze");this.queueGaze(e,ri.clamp(t,0,1),ri.clamp(n,0,1))}setLook(e,t,n){const r=this.states[e];r&&(t=Number.isFinite(t)?ri.clamp(t,-1,1):0,n=Number.isFinite(n)?ri.clamp(n,-1,1):0,!(r.look.x===t&&r.look.y===n)&&(r.look.set(t,n),this.invalidate()))}setColor(e,t){const n=this.states[e];if(n){if(!/^#[0-9a-f]{6}$/i.test(t))throw Error("Body color must be #RRGGBB");this.attributesDirty=!0,n.colorHex=t,this.resolvePigment(n),this.invalidate()}}clearColor(e){const t=this.states[e];t&&(t.colorHex=null,this.resolvePigment(t),this.attributesDirty=!0,this.invalidate())}setInstancePaused(e,t){const n=this.states[e];if(!n)return;const r=n.motion??(n.motion={kind:"idle",started:-n.phase});t&&r.held===void 0?r.held=this.time-r.started:!t&&r.held!==void 0&&(r.started=this.time-r.held,delete r.held),n.entrance&&(t&&n.entrance.held===void 0?n.entrance.held=this.time-n.entrance.started:!t&&n.entrance.held!==void 0&&(n.entrance.started=this.time-n.entrance.held,delete n.entrance.held)),this.invalidate()}setInstanceRendering(e,t){const n=this.states[e];!n||n.rendering===t||(n.rendering=t,t&&(this.cropCache.has(`${n.preset}:${this.detail}:${this.backingPixels}`)||(this.fitsDirty=this.fitPending=!0),this.invalidate()))}resolvePigment(e){const t=this.asset(e.preset).source.material.parts[0].fields.colorRoughness;e.colorHex?e.color.set(e.colorHex):e.color.setRGB(t[0],t[1],t[2]),um(e.color),e.color.r/=Math.max(t[0],1e-6),e.color.g/=Math.max(t[1],1e-6),e.color.b/=Math.max(t[2],1e-6)}hitTest(e,t){if(!Number.isFinite(e)||!Number.isFinite(t)||e<0||t<0||e>=this.width||t>=this.height)return null;const n=Math.min(this.count,this.cols),r=Math.floor((e-this.width/2)/this.pixels+n/2),a=Math.floor((t-this.height/2)/this.pixels+this.rows/2),s=a*this.cols+r;return r>=0&&r<n&&a>=0&&a<this.rows&&s<this.count?s:null}pointerCoordinates(e,t,n){const r=this.width/2+(e%this.cols-Math.min(this.count,this.cols)/2)*this.pixels,a=this.height/2+(Math.floor(e/this.cols)-this.rows/2)*this.pixels,s=this.fits.image.data;return[s[e*4]+(t-r)/this.pixels*s[e*4+2],s[e*4+1]+(n-a)/this.pixels*s[e*4+3]]}beginPointer(e,t){if(!this.ready||this.fitPending||this.pointerIndex!==null)return null;const n=this.hitTest(e,t);return n===null||!this.states[n]?null:(this.selectHover(n),this.pointerIndex=n,this.queueGaze(n,...this.pointerCoordinates(n,e,t)),this.states[n].pointer.down(...this.pointerCoordinates(n,e,t),performance.now()/1e3),this.invalidate(),n)}queueGaze(e,t,n){const r=this.states[e];!r||this.asset(r.preset)?.source.preset==="blue_beret"||r.gazeTarget.x===t&&r.gazeTarget.y===n||(r.gazeTarget.set(t,n),r.gazePending=!0,this.invalidate())}selectHover(e){this.hoverIndex!==e&&(this.hoverIndex!==null&&this.queueGaze(this.hoverIndex,.5,.5),this.hoverIndex=e)}endPointer(e,t){this.pointerIndex!==null&&(this.states[this.pointerIndex]?.pointer.up(performance.now()/1e3),this.pointerIndex=null,e!==void 0&&t!==void 0&&this.point(e,t),this.invalidate())}point(e,t){if(!this.ready||this.fitPending||!Number.isFinite(e)||!Number.isFinite(t))return;if(this.pointerIndex!==null){const r=this.pointerIndex,a=this.pointerCoordinates(r,e,t);this.states[r]?.pointer.move(...a),this.queueGaze(r,...a),this.invalidate();return}const n=this.hitTest(e,t);this.selectHover(n),n!==null&&this.queueGaze(n,...this.pointerCoordinates(n,e,t))}resize(){if(this.disposed)return;this.cancelFitReads(),this.attributesDirty=!0,this.fitsDirty=!0;const e=this.pixels<=64?1:this.pixels<=128?1.5:2;this.backingPixels=Math.max(64,Math.min(512,Math.round(this.pixels*Math.min(this.pixelRatio(),e)))),this.renderer.setPixelRatio(this.backingPixels/this.pixels),this.fitPending=this.states.some(s=>s.rendering!==!1&&!this.cropCache.has(`${s.preset}:${this.detail}:${this.backingPixels}`));const{width:t,height:n}=this.host?this.host.getSize():this.canvas.getBoundingClientRect();this.width=Math.max(1,t),this.height=Math.max(1,n),this.cols=Math.max(1,Math.floor(this.width/this.pixels)),this.rows=Math.ceil(this.count/this.cols);for(const{part:s}of this.batches){if(!s.source.fur)continue;const o=s.source.fields,c=new O().setFromMatrixScale(new pe().fromArray(o.world)),l=o.fur[1]*o.fur[2]*Math.max(c.x,c.y,c.z)*Math.abs(Cr.frame.viewProjection[5])*this.backingPixels*.5,h=Math.min(8192,160+l*l*.027)*ri.clamp((l-12)/48,0,1);s.source.geometry.setDrawRange(0,Math.ceil(h)*12)}for(const s of this.materials)s.uniforms.f.value.viewport.set(this.backingPixels,this.backingPixels,1/this.backingPixels,1/this.backingPixels);const r=3.64/this.pixels;this.camera.left=-this.width*r/2,this.camera.right=this.width*r/2,this.camera.top=this.height*r/2,this.camera.bottom=-this.height*r/2,this.camera.updateProjectionMatrix(),this.renderer.setSize(this.width,this.height,!1);const a=this.renderer.getPixelRatio();this.colorTarget.setSize(Math.round(this.width*a),Math.round(this.height*a)),this.depthTarget.setSize(this.colorTarget.width,this.colorTarget.height),this.outputTarget?.setSize(this.colorTarget.width,this.colorTarget.height);for(const s of this.materials)s.uniforms.outputInverse.value.set(1/this.colorTarget.width,1/this.colorTarget.height);this.presentMaterial.uniforms.surface.value.set(this.width,this.height),this.presentMaterial.uniforms.grid.value.set(this.pixels,Math.min(this.count,this.cols),this.rows,this.count),this.invalidate()}setPresentationCapacity(e){this.disposed||this.presentationCapacity===e||(this.presentationCapacity=e,e?this.presentationQueued&&(this.presentationQueued=!1,this.invalidate(!1)):this.raf&&(this.cancelFrame(),this.raf=0,this.presentationQueued=!0))}invalidate(e=!0){if(this.urgentFrame||=e,!this.presentationCapacity){this.presentationQueued=!0;return}!this.raf&&!this.disposed&&!this.hidden()&&this.inViewport&&!this.contextLost&&(this.raf=this.host?this.host.requestFrame(this.tick):requestAnimationFrame(this.tick))}updateRenderBounds(){const e=this.colorTarget.width,t=this.colorTarget.height,n=this.renderBounds;if(n.set(0,0,e,t),this.states.some(r=>r.rendering===!1)){let r=this.cols,a=0,s=this.rows,o=0;this.states.forEach((m,u)=>{if(m.rendering===!1)return;const f=u%this.cols,w=Math.floor(u/this.cols);r=Math.min(r,f),a=Math.max(a,f+1),s=Math.min(s,w),o=Math.max(o,w+1)});const c=(e-Math.min(this.count,this.cols)*this.backingPixels)/2,l=(t-this.rows*this.backingPixels)/2,h=8,p=Math.max(0,Math.floor(c+r*this.backingPixels)-h),d=Math.max(0,Math.floor(l+(this.rows-o)*this.backingPixels)-h),v=Math.min(e,Math.ceil(c+a*this.backingPixels)+h),g=Math.min(t,Math.ceil(l+(this.rows-s)*this.backingPixels)+h);n.set(p,d,Math.max(0,v-p),Math.max(0,g-d))}for(const r of[this.depthTarget,this.colorTarget])r.scissor.copy(n),r.scissorTest=n.z<e||n.w<t;this.outputTarget&&(this.outputTarget.scissor.copy(n),this.outputTarget.scissorTest=this.colorTarget.scissorTest)}cancelFitReads(){this.fitGeneration++;for(const e of this.fitReads)e.cancel();this.fitReads=[]}fittedCrop(e,t,n){let r=t,a=t,s=-1,o=-1;for(let l=0;l<t;l++)for(let h=0;h<t;h++)e[((t-l-1)*t+h)*4+3]<=24||(r=Math.min(r,h),s=Math.max(s,h),a=Math.min(a,l),o=Math.max(o,l));if(s<r)return n;const c=Math.max(s-r+1,o-a+1)*1.22;return[(r+s-c)/(2*t),(a+o-c)/(2*t),c/t,c/t]}applyCachedFits(){let e=!1;const t=this.backingPixels;this.states.forEach((n,r)=>{if(n.rendering===!1)return;const a=this.cropCache.get(`${n.preset}:${this.detail}:${t}`);if(!a)return;const s=this.fits.image.data;a.some((o,c)=>Math.abs(s[r*4+c]-o)>1e-7)&&(s.set(a,r*4),e=!0)}),e&&(this.fits.needsUpdate=!0),this.fitPending=this.states.some(n=>n.rendering!==!1&&!this.cropCache.has(`${n.preset}:${this.detail}:${t}`)),this.fitsDirty=this.fitPending}updateCrops(){if(!this.fitsDirty||this.fitReads.length)return;const e=this.backingPixels,t=this.renderer.getPixelRatio(),n=new Map;if(this.states.forEach((h,p)=>{if(h.rendering===!1)return;const d=`${h.preset}:${this.detail}:${e}`;if(this.cropCache.has(d)||n.has(d))return;const v=Math.round(this.width*t/2+(p%this.cols-Math.min(this.count,this.cols)/2)*e),g=Math.round(this.height*t/2+(Math.floor(p/this.cols)-this.rows/2)*e);n.set(d,{left:v,bottom:this.colorTarget.height-g-e,fallback:this.asset(h.preset).source.material.crop.slice()})}),!n.size){this.applyCachedFits();return}if(this.host){for(const[h,p]of n){const d=new Uint8Array(e*e*4);this.renderer.readRenderTargetPixels(this.colorTarget,p.left,p.bottom,e,e,d),this.cropCache.set(h,this.fittedCrop(d,e,p.fallback))}this.applyCachedFits();return}const r=this.fitGeneration,a=this.renderer.getContext(),{__webglFramebuffer:s}=this.renderer.properties.get(this.colorTarget),o=n.entries(),c=[],l=async()=>{for(const[h,p]of o){if(this.disposed||r!==this.fitGeneration)return;const d=pc(a,s,p.left,p.bottom,e,e);this.fitReads.push(d);try{const v=await d.promise;c.push({key:h,crop:this.fittedCrop(v,e,p.fallback)})}finally{const v=this.fitReads.indexOf(d);v>=0&&this.fitReads.splice(v,1)}}};Promise.all([l(),l()]).then(()=>{if(!(this.disposed||r!==this.fitGeneration)){this.fitReads=[];for(const{key:h,crop:p}of c)this.cropCache.set(h,p);this.applyCachedFits(),this.invalidate()}}).catch(h=>{if(!(this.disposed||r!==this.fitGeneration)){if(a.isContextLost()){this.onContextLost();return}this.cancelFitReads(),this.renderFailure=h instanceof Error?h:new Error(String(h)),this.cancelFrame(),this.raf=0,this.onError?.(this.renderFailure)}})}stats(){return{ready:this.ready,surfaceFinish:"smooth",retainedCanvasCulling:!0,activeAtlasScissor:!0,asyncFitReadback:!this.host,pendingFitReads:this.fitReads.length,presentationCapacity:this.presentationCapacity,presentationQueued:this.presentationQueued,renderFailure:this.renderFailure?.message??null,renderedPixels:this.renderBounds.z*this.renderBounds.w,atlasPixels:this.colorTarget.width*this.colorTarget.height,renderBounds:this.renderBounds.toArray(),lazyWork:this.lazyWork,renderer:"original-assets-three",parity:!1,missing:["full animation controllers and transitions","cross-phase action entry and interruptions","reaction pointer blending and input arbitration","catalog part mixing beyond the eight presets"],presets:[...new Set(this.states.map(e=>e.preset))],detail:this.detail,motionPresets:[...this.assets].filter(([,e])=>e.samplers).map(([,e])=>e.source.preset),count:this.count,renderedInstances:this.states.filter(e=>e.rendering!==!1).length,frames:this.frames,fitPasses:this.fitPasses,poseEvaluations:this.poseSharing.evaluations,sharedPoseCopies:this.poseSharing.copies,suspended:this.hidden()||!this.inViewport||this.contextLost,frameRateLimit:this.maxFrameRate===1/0?null:this.maxFrameRate,observedFrameRate:this.elapsed?this.timedFrames/this.elapsed:0,columns:this.cols,rows:this.rows,width:this.width,height:this.height,requiredHeight:this.rows*this.pixels,pixelRatio:this.renderer.getPixelRatio(),backingPixelsPerAvatar:this.backingPixels,cachedFits:this.cropCache.size,cachedAssets:this.assets.size,pendingAssets:this.pendingAssets.size,poseTextureBytes:[...this.assets.values()].reduce((e,t)=>e+t.parts.reduce((n,r)=>n+(r.motionTexture?.image.data?.byteLength??0),0),0),resources:{geometries:this.renderer.info.memory.geometries,textures:this.renderer.info.memory.textures,programs:this.renderer.info.programs?.length},states:this.states.map((e,t)=>({index:t,phase:e.phase,motion:e.poseOverride?"held-pose":this.asset(e.preset)?.samplers?e.motion?.kind??(this.paused?"reference":"idle"):"provisional",motionTime:e.motion?.held??(e.motion?this.time-e.motion.started:this.time+e.phase),preset:e.preset,renderedParts:this.asset(e.preset)?.source.parts.map(n=>({id:n.id,label:n.label,colorRole:n.colorRole})),pigment:e.color.toArray(),look:e.look.toArray(),pointer:{active:e.pointer.active,yaw:e.pointer.yaw,pitch:e.pointer.pitch},gaze:{yaw:e.gaze.yaw,pitch:e.gaze.pitch,target:e.gazeTarget.toArray()},eyes:{x:e.eyes.x,y:e.eyes.y}})),contexts:this.disposed?0:1,drawCalls:this.renderer.info.render.calls,triangles:this.renderer.info.render.triangles}}dispose(){this.cancelFitReads(),!this.disposed&&(this.disposed=!0,this.cancelFrame(),this.observer?.disconnect(),this.visibilityObserver?.disconnect(),this.unsubscribeHost?.(),this.host||(document.removeEventListener("visibilitychange",this.visibilityChanged),this.canvas.removeEventListener("webglcontextlost",this.onContextLost),this.canvas.removeEventListener("webglcontextrestored",this.onContextRestored)),this.batches.forEach(({mesh:e})=>e.dispose()),this.fits.dispose(),this.cameras.dispose(),this.assets.forEach(e=>e.parts.forEach(t=>t.motionTexture?.dispose())),this.retiredAssets.forEach(e=>e.parts.forEach(t=>t.motionTexture?.dispose())),this.geometries.forEach(e=>e.dispose()),this.materials.forEach(e=>e.dispose()),this.textures.forEach(e=>e.dispose()),this.occlusion.dispose(),this.depthTarget.dispose(),this.disabledShadow.dispose(),this.depthMaterials.forEach(e=>e.dispose()),this.colorTarget.dispose(),this.outputTarget?.dispose(),this.presentGeometry.dispose(),this.presentMaterial.dispose(),this.renderer.dispose(),this.host||this.renderer.forceContextLoss())}}const bl=new WeakMap,$r=new Set;let hn,zi,Qi=0,Kr=!1,Zr=!1,Yn;const Ag=5e3,Cg=5e3,ao=5e3,Lg=3e4,Pg=2,Dg=22,Ug=72,Xa=new Set;let wl=!1;const Sl=250,Ml=()=>typeof document<"u"&&document.hidden;function yc(i,e){let t=i,n=Date.now(),r=!1,a;const s=()=>{r||(r=!0,clearTimeout(a),Xa.delete(l))},o=()=>{r||Ml()||(n=Date.now(),a=setTimeout(c,Math.min(Sl,t)))},c=()=>{if(a=void 0,r||Ml())return;const h=Math.max(0,Date.now()-n);h<=Sl*2&&(t-=h),t<=0?(s(),e()):o()},l={visibilityChanged(){clearTimeout(a),a=void 0,o()}};return!wl&&typeof document<"u"&&typeof document.addEventListener=="function"&&(document.addEventListener("visibilitychange",()=>{for(const h of Xa)h.visibilityChanged()}),wl=!0),Xa.add(l),o(),s}const Ig=`
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
}`,Os=i=>i instanceof Error?i:new Error(String(i)),xc=i=>i.getContext("webgpu"),Vi=i=>{for(const e of[...$r])try{i(e)}catch(t){queueMicrotask(()=>{throw t})}};function Ng(i){!Zr||Yn||hn!==i||i.retired||(Yn=setTimeout(()=>{Yn=void 0,hn===i&&!i.retired&&(Zr=!1)},Lg))}function Fg(i,e){i.retired||(i.retired=!0,hn===i&&(hn=void 0),clearTimeout(Yn),Yn=void 0,Kr=!1,Qi=Date.now()+ao,Vi(t=>t.failed(e)),i.device.destroy())}function zs(i,e){if(!i.retired&&(i.retired=!0,hn===i&&(hn=void 0),clearTimeout(Yn),Yn=void 0,i.device.destroy(),!!$r.size)){if(Zr){Qi=Date.now()+ao,Vi(t=>t.failed(e));return}Zr=!0,Kr=!0,Vi(t=>t.recovering()),Qi=0,bc().then(t=>{Kr=!1,Vi(t?n=>n.restored(t):n=>n.failed(e))})}}async function Bg(){const i=globalThis.navigator?.gpu;if(!i||typeof document>"u")return null;let e=!1,t,n;const r=new Promise(o=>{n=yc(Ag,()=>{e=!0,t?.destroy(),o(null)})}),a=(async()=>{try{const o=await i.requestAdapter();if(!o||o.info?.isFallbackAdapter===!0||e)return null;if(t=await o.requestDevice(),e)return t.destroy(),null;const c=i.getPreferredCanvasFormat();t.pushErrorScope("validation");const l=t.createShaderModule({code:Ig}),h=await t.createRenderPipelineAsync({layout:"auto",vertex:{module:l,entryPoint:"vertex"},fragment:{module:l,entryPoint:"fragment",targets:[{format:c}]},primitive:{topology:"triangle-list"}});if(e)return t.destroy(),null;const p=document.createElement("canvas");p.width=p.height=1;const d=xc(p);if(!d)throw new Error("WebGPU canvas unavailable");d.configure({device:t,format:c,alphaMode:"premultiplied",colorSpace:"srgb"}),d.unconfigure();const v=await t.popErrorScope();if(v||e)throw v??new Error("WebGPU initialization expired");const g={device:t,pipeline:h,sampler:t.createSampler({minFilter:"linear",magFilter:"linear"}),format:c,retired:!1};return t.addEventListener("uncapturederror",m=>Fg(g,Os(m.error))),t.lost.then(m=>zs(g,new Error(m.message||"WebGPU device lost"))),g}catch{return t?.destroy(),null}})(),s=await Promise.race([a,r]);return n?.(),s}function bc(){return hn&&!hn.retired?Promise.resolve(hn):zi||(Date.now()<Qi?Promise.resolve(null):(zi=Bg().then(i=>(i&&!i.retired?hn=i:Qi=Date.now()+ao,i?.retired?null:i)).finally(()=>{zi=void 0}),zi))}async function Og(i,e){let t=await bc();if(!t||t.retired)return null;let n=!1,r=Kr,a=!1,s,o=0,c=0;const l=new Set,h=new Set,p=()=>{for(const u of[...h])u.finish(!1)},d=()=>{const u=s;s=void 0,o=c=0;const f=[];for(const w of l)w.buffer&&f.push(w.buffer),w.buffer=w.binding=w.atlas=w.rect=void 0;u?.destroy();for(const w of f)w.destroy()},v=u=>{n||a||(a=!0,r=!0,p(),d(),i(u))},g={recovering(){n||a||(r=!0,p(),d(),e?.(!0))},restored(u){n||a||(t=u,r=!1,e?.(!1))},failed:v};$r.add(g);const m={backend:"webgpu",get maxTextureDimension2D(){return t.device.limits.maxTextureDimension2D},attach(u){if(n||a)return null;let f=bl.get(u);if(f?.owner?.active)return null;if(!f){const C=Math.min(globalThis.devicePixelRatio||1,2),M=t.device.limits.maxTextureDimension2D;if(Math.round(u.clientWidth*C)>M||Math.round(u.clientHeight*C)>M)return null;const x=xc(u);if(!x)return null;f={context:x},bl.set(u,f)}const w={canvas:u,state:f,active:!0};return f.owner=w,l.add(w),w},present(u,f){if(n||a||r||t.retired)return Promise.resolve(!1);if(h.size>=Pg)return Promise.reject(new Error("WebGPU presentation capacity exceeded"));if(!f.length)return Promise.resolve(!0);const w=t,C=w.device.limits.maxTextureDimension2D;try{if(!(u.width>0&&u.height>0&&u.width<=C&&u.height<=C))throw new Error("WebGPU atlas dimensions exceed device limits");let M=u.width,x=u.height,S=0,R=0;for(const I of f){const q=I.target;if(!l.has(q)||!q.active)throw new Error("WebGPU target is not attached");if(![I.destinationWidth,I.destinationHeight].every(Q=>Number.isInteger(Q)&&Q>0&&Q<=C))throw new Error("WebGPU destination dimensions exceed device limits");if(![I.sourceX,I.sourceY,I.sourceWidth,I.sourceHeight].every(Number.isFinite)||I.sourceX<0||I.sourceY<0||I.sourceWidth<=0||I.sourceHeight<=0||I.sourceX+I.sourceWidth>u.width||I.sourceY+I.sourceHeight>u.height)throw new Error("Invalid WebGPU source rectangle");M=Math.min(M,I.sourceX),x=Math.min(x,I.sourceY),S=Math.max(S,I.sourceX+I.sourceWidth),R=Math.max(R,I.sourceY+I.sourceHeight)}if(!s||o!==u.width||c!==u.height){const I=s;o=u.width,c=u.height,s=w.device.createTexture({size:[o,c],format:"rgba8unorm",usage:Dg}),I?.destroy()}const _=Math.max(0,Math.floor(M)-1),E=Math.max(0,Math.floor(x)-1),L=Math.min(u.width,Math.ceil(S)+1),T=Math.min(u.height,Math.ceil(R)+1);w.device.queue.copyExternalImageToTexture({source:u,origin:{x:_,y:E}},{texture:s,origin:{x:_,y:E},premultipliedAlpha:!0,colorSpace:"srgb"},[L-_,T-E]);const P=w.device.createCommandEncoder();for(const I of f){const q=I.target,{canvas:Q,state:Me}=q;Q.width!==I.destinationWidth&&(Q.width=I.destinationWidth),Q.height!==I.destinationHeight&&(Q.height=I.destinationHeight),Me.configured!==w&&(Me.context.configure({device:w.device,format:w.format,alphaMode:"premultiplied",colorSpace:"srgb"}),Me.configured=w),q.buffer||(q.buffer=w.device.createBuffer({size:16,usage:Ug}));const we=I.sourceX/u.width,Ze=I.sourceY/u.height,Fe=I.sourceWidth/u.width,He=I.sourceHeight/u.height,Y=q.rect;(!Y||Y[0]!==we||Y[1]!==Ze||Y[2]!==Fe||Y[3]!==He)&&(q.rect=[we,Ze,Fe,He],w.device.queue.writeBuffer(q.buffer,0,new Float32Array(q.rect))),(!q.binding||q.atlas!==s)&&(q.binding=w.device.createBindGroup({layout:w.pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:s.createView()},{binding:1,resource:w.sampler},{binding:2,resource:{buffer:q.buffer}}]}),q.atlas=s);const ee=P.beginRenderPass({colorAttachments:[{view:Me.context.getCurrentTexture().createView(),loadOp:"clear",storeOp:"store",clearValue:{r:0,g:0,b:0,a:0}}]});ee.setPipeline(w.pipeline),ee.setBindGroup(0,q.binding),ee.draw(3),ee.end()}w.device.queue.submit([P.finish()]);let U,D=!1,z;const W=new Promise(I=>{U=I}),j=w.device.queue.onSubmittedWorkDone(),Z={finish(I){D||(D=!0,h.delete(Z),U(I))}};return h.add(Z),z=yc(Cg,()=>{zs(w,new Error("WebGPU presentation timed out")),Z.finish(!1)}),j.then(()=>{z?.();const I=!n&&!a&&!w.retired&&t===w;I&&Ng(w),Z.finish(I)},I=>{z?.(),zs(w,Os(I)),Z.finish(!1)}),W}catch(M){return v(Os(M)),Promise.resolve(!1)}},release(u){const f=u;if(!l.delete(f))return;f.active=!1,f.state.owner===f&&(f.state.owner=void 0);const w=f.buffer;f.buffer=f.binding=f.atlas=f.rect=void 0,w?.destroy()},dispose(){if(!n){n=!0,$r.delete(g);for(const u of[...l])m.release(u);d(),p()}}};return r&&e?.(!0),m}const zg=4,kg=16384;function Gg(){const i=document.createElement("canvas"),e=i.getContext("2d",{willReadFrequently:!0});if(!e)throw Error("Avatar CPU presentation canvas unavailable");const t=Array.from({length:2},()=>({busy:!1,bytes:new Uint8Array(0),read:void 0}));let n=!1,r=0,a,s=Promise.resolve(!0);return{backend:"pbo",present(o,c){if(n||!c.length)return Promise.resolve(!1);const l=t.find(x=>!x.busy);if(!l)throw Error("Avatar CPU presentation capacity exceeded");const h=Math.max(0,Math.floor(Math.min(...c.map(x=>x.sourceX)))-1),p=Math.max(0,Math.floor(Math.min(...c.map(x=>x.sourceY)))-1),d=Math.min(o.width,Math.ceil(Math.max(...c.map(x=>x.sourceX+x.sourceWidth)))+1),v=Math.min(o.height,Math.ceil(Math.max(...c.map(x=>x.sourceY+x.sourceHeight)))+1),g=d-h,m=v-p,u=o.getContext("webgl2");if(!u)throw Error("Avatar presentation context unavailable");l.busy=!0,l.bytes.length!==g*m*4&&(l.bytes=new Uint8Array(g*m*4));const f=pc(u,null,h,o.height-v,g,m,3e4,l.bytes);l.read=f;const w=s,C=r,M=f.promise.then(async x=>{if(await w,n||r!==C||document.hidden)return!1;(i.width!==o.width||i.height!==o.height)&&(i.width=o.width,i.height=o.height),(!a||a.width!==g||a.height!==m)&&(a=new ImageData(g,m));const S=a.data;for(let _=0;_<m;_++){let E=(m-_-1)*g*4,L=_*g*4;for(let T=0;T<g;T++,E+=4,L+=4){const P=x[E+3];if(S[L+3]=P,P===255)S[L]=x[E],S[L+1]=x[E+1],S[L+2]=x[E+2];else if(P===0)S[L]=S[L+1]=S[L+2]=0;else{const U=255/P;S[L]=Math.round(x[E]*U),S[L+1]=Math.round(x[E+1]*U),S[L+2]=Math.round(x[E+2]*U)}}}e.putImageData(a,h,p);let R=!1;for(const _ of c)_.isCurrent()&&(R=!0,_.context.clearRect(0,0,_.destinationWidth,_.destinationHeight),_.context.drawImage(i,_.sourceX,_.sourceY,_.sourceWidth,_.sourceHeight,0,0,_.destinationWidth,_.destinationHeight),_.onPresented?.());return R}).catch(x=>{if(n||r!==C||document.hidden||u.isContextLost())return!1;throw x}).finally(()=>{l.busy=!1,l.read=void 0});return s=M.catch(()=>!1),M},cancelPending(){r++;for(const o of t)o.read?.cancel()},dispose(){if(!n){n=!0,r++;for(const o of t)o.read?.cancel(),o.bytes=new Uint8Array(0);a=void 0,i.width=i.height=0}}}}function Vg(i,e,t={}){let n=null;const r=h=>{const p=i.getBoundingClientRect();return[h.clientX-p.left,h.clientY-p.top]},a=h=>{if(n||h.button!==0||!h.isPrimary)return;const p=r(h),d=t.enabled===!1?e.hitTest(...p):e.beginPointer(...p);d!==null&&(t.onSelect?.(d),t.enabled!==!1&&(n={id:h.pointerId,index:d,x:h.clientX,y:h.clientY,dragged:!1},i.setPointerCapture(h.pointerId)))},s=h=>{t.enabled===!1||n&&n.id!==h.pointerId||(n&&(n.dragged||=Math.hypot(h.clientX-n.x,h.clientY-n.y)>=6),e.point(...r(h)))},o=h=>{if(!n||h&&n.id!==h.pointerId)return;const p=n;n=null,h?.type==="pointerup"?e.endPointer(...r(h)):(e.endPointer(),e.point(-1,-1)),i.hasPointerCapture(p.id)&&i.releasePointerCapture(p.id),h?.type==="pointerup"&&!p.dragged&&Math.hypot(h.clientX-p.x,h.clientY-p.y)<6&&t.onTap?.(p.index)},c=()=>{o(),e.point(-1,-1)},l=()=>{!n&&t.enabled!==!1&&e.point(-1,-1)};return i.addEventListener("pointerdown",a),i.addEventListener("pointermove",s),i.addEventListener("pointerup",o),i.addEventListener("pointercancel",o),i.addEventListener("lostpointercapture",o),i.addEventListener("pointerleave",l),window.addEventListener("blur",c),()=>{i.removeEventListener("pointerdown",a),i.removeEventListener("pointermove",s),i.removeEventListener("pointerup",o),i.removeEventListener("pointercancel",o),i.removeEventListener("lostpointercapture",o),i.removeEventListener("pointerleave",l),window.removeEventListener("blur",c),o(),l()}}const En=i=>{throw Error(`Avatar catalog: ${i}`)},Ke=(i,e)=>(i.min[e]+i.max[e])/2,Jr=i=>({min:[0,1,2].map(e=>Math.min(...i.map(t=>t.bounds.min[e]))),max:[0,1,2].map(e=>Math.max(...i.map(t=>t.bounds.max[e])))}),ks=i=>i.pieces.filter(e=>e.category==="eyes"&&e.attachment!=="brows"&&!e.fur);function Lr(i){const e=ks(i),t=[-1,1].map(n=>e.filter(r=>Math.sign(Ke(r.bounds,0))===n));return t.some(n=>!n.length)&&En("catalog face anchors missing"),t.map(Jr)}function so(i,e,t){const n=i.body.geometry.getAttribute("position"),r=i.body.geometry.getIndex();if(!r)return-1/0;let a=-1/0;for(let s=0;s<r.count;s+=3){const o=[0,1,2].map(m=>{const u=r.getX(s+m);return[n.getX(u),n.getY(u),n.getZ(u)]}),[c,l,h]=o,p=(l[1]-h[1])*(c[0]-h[0])+(h[0]-l[0])*(c[1]-h[1]);if(Math.abs(p)<1e-12)continue;const d=((l[1]-h[1])*(e-h[0])+(h[0]-l[0])*(t-h[1]))/p,v=((h[1]-c[1])*(e-h[0])+(c[0]-h[0])*(t-h[1]))/p,g=1-d-v;Math.min(d,v,g)>=-1e-6&&(a=Math.max(a,d*c[2]+v*l[2]+g*h[2]))}return a}function ja(i,e,t,n,{singleEye:r=!1,faceLayout:a,tuftLayout:s}={}){const o=t==="eyes"?ks(e):e.pieces.filter(g=>g.category===t&&g.selection===n&&!g.fur);o.length||En(`missing catalog ${t}:${n}`);const c=g=>g.body.bounds.max[0]-g.body.bounds.min[0];if(t==="eyes"||t==="eyewear"){const g=r?Jr(ks(i)):null,m=g?n==="monocle"?[g,g]:[0,1].map(T=>({min:g.min.map((P,U)=>U===0&&T===1?Ke(g,0):P),max:g.max.map((P,U)=>U===0&&T===0?Ke(g,0):P)})):t==="eyes"&&a?a.centers.map(T=>{const[P,U,D]=T;return{min:[P-a.radius,U-a.radius,D],max:[P+a.radius,U+a.radius,D+a.radius]}}):Lr(i),u=Lr(e),f=T=>Math.abs(Ke(T[1],0)-Ke(T[0],0)),w=i.body.attachment==="metal"||i.body.label==="metal",C=t==="eyes"?a?a.radius/(u.reduce((T,P)=>T+Math.max(P.max[0]-P.min[0],P.max[1]-P.min[1])/2,0)/2):w?1:Math.max(.65,Math.min(1.2,c(i)/c(e))):Math.max(.25,Math.min(2,f(m)/f(u)));if(t==="eyes"){const T=m.map(P=>so(i,Ke(P,0),Ke(P,1)));return o.map(P=>{const U=Ke(P.bounds,0)<0?0:1,D=[0,1,2].map(I=>Ke(u[U],I)),z=[0,1].map(I=>Ke(m[U],I)-D[I]),W=(u[U].max[2]-u[U].min[2])*C,j=T[U],Z=Math.max(m[U].min[2],j-W*.35);return z.push(Z-(u[U].min[2]-D[2])*C-D[2]),{part:P,scale:C,origin:D,translate:z}})}const M=[0,1,2].map(T=>(Ke(u[0],T)+Ke(u[1],T))/2),x=[0,1,2].map(T=>(Ke(m[0],T)+Ke(m[1],T))/2),R=[0,1].map(T=>o.filter(P=>Math.abs(Ke(P.bounds,0)-M[0])>f(u)*.15&&(Ke(P.bounds,0)<M[0]?0:1)===T)).map(T=>{if(!T.length)return null;const P=Math.max(...T.map(U=>U.bounds.max[2]));return Jr(T.filter(U=>U.bounds.max[2]>P-.05))}),_=R.filter(T=>T!==null),E=_.length?Math.min(..._.map(T=>T.min[2])):Math.max(...o.map(T=>T.bounds.max[2]))-.05,L=_.length?C:Math.max(.25,Math.min(2,(Math.max(...m.map(T=>T.max[0]))-Math.min(...m.map(T=>T.min[0])))*1.18/(Math.max(...o.map(T=>T.bounds.max[0]))-Math.min(...o.map(T=>T.bounds.min[0])))));return o.map(T=>{const P=Ke(T.bounds,0)-M[0];if(Math.abs(P)<=f(u)*.15)return{part:T,scale:L,origin:M,translate:x.map((Z,I)=>I===2?Math.max(...m.map(q=>q.max[2]))+.012-((E-M[2])*L+M[2]):Z-M[I])};const U=P<0?0:1,D=R[U],z=Math.min(r&&n==="monocle"?4:2,Math.max(Math.min(C,1.2),(m[U].max[0]-m[U].min[0])*1.08/(D.max[0]-D.min[0]))),W=[0,1,2].map(Z=>Ke(u[U],Z)),j=[0,1].map(Z=>Ke(m[U],Z)-W[Z]);return j.push(m[U].max[2]+.012-((D.min[2]-W[2])*z+W[2])),{part:T,scale:z,origin:W,translate:j}})}t!=="accessory"&&En("unknown catalog fitting category");const l=i.body.attachment==="metal"||i.body.label==="metal",h=(l?.56:Math.max(.35,Math.min(1.5,c(i)/c(e))))*(n==="three_lobe"?s?.scale??1:1),p=[Ke(e.body.bounds,0),e.body.bounds.max[1],Ke(e.body.bounds,2)],d=[l?.02:Ke(i.body.bounds,0),i.body.bounds.max[1],l?0:Ke(i.body.bounds,2)];if(n==="bow"){const g=Lr(e),m=Lr(i);for(let u=0;u<2;u++)p[u]=(Ke(g[0],u)+Ke(g[1],u))/2,d[u]=(Ke(m[0],u)+Ke(m[1],u))/2}const v=d.map((g,m)=>g-p[m]);if(n==="three_lobe"&&s){const g=o[0].attachmentPivot;g||En("missing tuft attachment anchor");const m=Or(e.body,g);return o.map(u=>({part:u,scale:h,origin:m,translate:v,rotationZ:s.rotationZ}))}return o.map(g=>({part:g,scale:h,origin:p,translate:v}))}function Hg({scale:i,rotationZ:e=0,origin:t,translate:n}){if(e===0)return new pe().makeScale(i,i,i).setPosition(...t.map((s,o)=>s*(1-i)+n[o]));const r=new pe().makeRotationZ(e).scale(new O(i,i,i)),a=new O().fromArray(t).applyMatrix4(r).negate().add(new O().fromArray(t)).add(new O().fromArray(n));return r.setPosition(a)}function Gs(i,e){const{scale:t,origin:n,translate:r,rotationZ:a=0}=e;(!Number.isFinite(t)||t<=0||t>8||!Number.isFinite(a)||[...n,...r].some(v=>!Number.isFinite(v)))&&En("invalid part transform"),a!==0&&(i.attachment!=="three_lobe"||i.universal===!0)&&En("rotation currently requires a FELIPE Tuft material");const s=Math.cos(a),o=Math.sin(a),c=v=>a===0?v.map((g,m)=>Math.fround((g-n[m])*t+n[m]+r[m])):[Math.fround(s*(v[0]-n[0])*t-o*(v[1]-n[1])*t+n[0]+r[0]),Math.fround(o*(v[0]-n[0])*t+s*(v[1]-n[1])*t+n[1]+r[1]),Math.fround((v[2]-n[2])*t+n[2]+r[2])],l=i.geometry.clone(),h=l.getAttribute("position");for(let v=0;v<h.count;v++)h.setXYZ(v,...c([h.getX(v),h.getY(v),h.getZ(v)]));if(!i.fur&&(t!==1||a!==0))for(const v of["delta0","delta1"]){const g=l.getAttribute(v);if(g)for(let m=0;m<g.count;m++)g.setXYZ(m,Math.fround((a===0?g.getX(m):s*g.getX(m)-o*g.getY(m))*t),Math.fround((a===0?g.getY(m):o*g.getX(m)+s*g.getY(m))*t),Math.fround(g.getZ(m)*t))}if(a!==0){for(const g of i.fur?["normal","normal0","delta1"]:["normal","normal0","normal1"]){const m=l.getAttribute(g);if(m)for(let u=0;u<m.count;u++){const f=m.getX(u),w=m.getY(u);m.setXYZ(u,s*f-o*w,o*f+s*w,m.getZ(u))}}const v=l.getAttribute("paletteGeometry");if(!i.fur&&v)for(let g=0;g<v.count;g++){const m=v.getY(g),u=v.getZ(g);v.setY(g,s*m-o*u),v.setZ(g,o*m+s*u)}l.computeBoundingBox(),l.computeBoundingSphere()}const p=Object.fromEntries(Object.entries(i.fields).map(([v,g])=>[v,[...g]])),d=p.paletteBounds;if(d&&(d[2]||d[3])){const v=c([d[0],d[1],0]);d[0]=v[0],d[1]=v[1],d[2]=Math.fround(d[2]/t),d[3]=Math.fround(d[3]/t)}return{...i,geometry:l,fields:p,bounds:a===0?{min:c(i.bounds.min),max:c(i.bounds.max)}:{min:l.boundingBox.min.toArray(),max:l.boundingBox.max.toArray()},pivot:c(i.pivot),attachmentPivot:i.attachmentPivot?c(i.attachmentPivot):i.attachmentPivot}}function Or(i,e){const t=i.geometry.getAttribute("position"),n=i.geometry.getIndex();n||En("body attachment surface has no triangles");const r=new kt,a=new O().fromArray(e),s=new O,o=new O;let c=1/0;for(let l=0;l<n.count;l+=3){r.a.fromBufferAttribute(t,n.getX(l)),r.b.fromBufferAttribute(t,n.getX(l+1)),r.c.fromBufferAttribute(t,n.getX(l+2)),r.closestPointToPoint(a,s);const h=s.distanceToSquared(a);h<c&&(c=h,o.copy(s))}return Number.isFinite(c)||En("empty body attachment surface"),o.toArray()}function El(i,e,t,n){const r=i.geometry.getAttribute("position"),a=i.geometry.getIndex();let s=n?-1/0:1/0;if(!a)return s;for(let o=0;o<a.count;o+=3){const c=a.getX(o),l=a.getX(o+1),h=a.getX(o+2),p=r.getX(c),d=r.getZ(c),v=r.getX(l),g=r.getZ(l),m=r.getX(h),u=r.getZ(h),f=(g-u)*(p-m)+(m-v)*(d-u);if(Math.abs(f)<1e-12)continue;const w=((g-u)*(e-m)+(m-v)*(t-u))/f,C=((u-d)*(e-m)+(p-m)*(t-u))/f,M=1-w-C;if(Math.min(w,C,M)<-1e-7)continue;const x=w*r.getY(c)+C*r.getY(l)+M*r.getY(h);s=n?Math.max(s,x):Math.min(s,x)}return s}function Rl(i,e){const t=e[0],n=(p,d)=>(p-t.origin[d])*t.scale+t.origin[d]+t.translate[d],r=Jr(e.map(p=>({bounds:p.part.bounds}))),a=[0,2].map(p=>Math.max(i.body.bounds.min[p],n(r.min[p],p))),s=[0,2].map(p=>Math.min(i.body.bounds.max[p],n(r.max[p],p)));let o=-1/0,c;const l=(p,d)=>{const v=El(i.body,p,d,!0),g=(p-t.origin[0]-t.translate[0])/t.scale+t.origin[0],m=(d-t.origin[2]-t.translate[2])/t.scale+t.origin[2],u=Math.min(...e.map(w=>El(w.part,g,m,!1))),f=v-n(u,1);Number.isFinite(f)&&f>o&&(o=f,c=[p,v,d])};for(let p=0;p<=12;p++)for(let d=0;d<=12;d++)l(a[0]+(s[0]-a[0])*p/12,a[1]+(s[1]-a[1])*d/12);const h=i.body.geometry.getAttribute("position");for(let p=0;p<h.count;p+=Math.max(1,Math.floor(h.count/128)))l(h.getX(p),h.getZ(p));return c?{shift:o,root:c}:void 0}function Wg(i,e,t,n,r){if(!t.length)return t;const a=t[0],s=n==="bow"?a.part.pivot:a.part.attachmentPivot;s||En(`missing ${n} attachment anchor`);const o=p=>{const d=p.map((u,f)=>(u-a.origin[f])*a.scale),v=a.rotationZ??0,g=Math.cos(v),m=Math.sin(v);return[d[0]*g-d[1]*m,d[0]*m+d[1]*g,d[2]].map((u,f)=>u+a.origin[f]+a.translate[f])};let c,l;const h=["felipe_beret","beret","beanie","hat","crown"].includes(n)?Rl(i,t):void 0;if(h){const p=Rl(e,t.map(({part:d})=>({part:d,scale:1,origin:[0,0,0],translate:[0,0,0]})));c=[0,h.shift-Math.max(0,p?.shift??0)*a.scale-(i.body.bounds.max[1]-i.body.bounds.min[1])*.004,0],l=h.root}else if(n==="headphones"){const p=[0,1,2].map(g=>Ke(e.body.bounds,g)),d=[0,1,2].map(g=>Ke(i.body.bounds,g)),v=o(p);c=d.map((g,m)=>g-v[m]),l=d}else{const p=Or(e.body,s),d=o(p),v=n==="three_lobe"?[r?Ke(i.body.bounds,0)+(i.body.bounds.max[0]-i.body.bounds.min[0])*r.x:d[0],i.body.bounds.max[1]+(a.part.bounds.max[1]-a.part.bounds.min[1])*a.scale*.5,d[2]]:d;l=Or(i.body,v),c=l.map((g,m)=>g-d[m])}return t.map(p=>{const d=p.translate.map((g,m)=>g+c[m]),v=n==="headphones"?Or(i.body,o(p.part.attachmentPivot).map((g,m)=>g+c[m])):l;return{...p,translate:d,attachmentRoot:v}})}const pt=(i,e,t,n,r,a)=>({eyes:{size:i,spread:e,rise:t},tuft:{x:n,scale:r,rotationZ:a*Math.PI/180}}),Xg={circle:pt(1.45,1.55,.015,.06,.95,-15),rounded_triangle:pt(1.3,1.4,-.025,.04,.8,-28),capsule:pt(1.3,1.65,0,-.3,1.05,24),slender:pt(1.25,1.12,.065,-.06,.9,10),pocket:pt(1.1,1.4,.03,.24,.85,-30),petal:pt(1.05,1.15,.015,-.2,.88,22),squircle:pt(1.15,1.4,.035,-.28,1.05,22),rounded_head_two_ears:{...pt(1.28,1,0,.28,.75,-30),singleEyeRise:-.14},circle_two_ears:pt(1.65,1.7,.025,.22,.65,-38),six_lobed_flower:pt(1.05,1.18,0,-.09,.88,10),heart:pt(1.4,1.6,.005,.27,.85,-32),four_lobed_butterfly:pt(1.4,1.45,.015,-.28,.85,24),twelve_scalloped_rosette:pt(1.25,1.4,.005,.12,.85,-20),rounded_cube:pt(1.5,1.65,.015,-.24,.92,20),rounded_diamond:pt(1.35,1.55,-.025,.08,.78,-28),star:pt(1.15,1.2,.045,.015,.7,-15),cloud:pt(1.1,1.55,-.01,.25,.82,-32),shield:pt(1.15,1.2,.035,-.18,.78,25),pebble:pt(1.1,1.25,.02,.15,.9,-35),clippo:pt(1,1,0,.015,1.05,-18)};function wc(i){const e=Xg[i==="todd"?"rounded_head_two_ears":i];if(!e)throw Error(`Missing avatar layout: ${i}`);return e}function jg(i,e,t=!1){if(e==="clippo")return i.face;const n=wc(e),{size:r,spread:a}=n.eyes,s=n.eyes.rise+(t?n.singleEyeRise??0:0),o=i.face.radius*r,c=(i.face.centers[0][0]+i.face.centers[1][0])/2,l=i.body.bounds.max[1]-i.body.bounds.min[1];return{radius:o,centers:i.face.centers.map(([h,p])=>{const d=c+(h-c)*a,v=p+l*s,g=so(i,d,v);if(!Number.isFinite(g))throw Error(`Eye layout misses body surface: ${e}`);return[d,v,g-o*.3]})}}function qg(i,e){const[t,n]=i.pieces.filter(p=>!p.fur&&p.category==="eyes");if(!t||!n)throw Error("Missing Cyclops source eye");const r=p=>p.bounds.min.map((d,v)=>(d+p.bounds.max[v])/2),a=e.radius*2,s=[0,1].map(p=>(e.centers[0][p]+e.centers[1][p])/2).concat(Math.max(...e.centers.map(p=>p[2]))+e.radius*.5),o=(p,d,v)=>{const g=r(p);return Gs(p,{origin:g,scale:d,translate:v.map((m,u)=>m-g[u])})},c=[o(t,a*2/(t.bounds.max[0]-t.bounds.min[0]),s)],l=r(n);let h=c[0].bounds.max[2];for(const[p,[d,v,g]]of[[.57,0,0],[.53,0,0],[.275,0,0],[.065,-.19,.23]].entries()){const m=a*d*2/(n.bounds.max[0]-n.bounds.min[0]),u=[s[0]+v*a,s[1]+g*a,h+.006-(n.bounds.max[2]-l[2])*m],f=o(n,m,u);if(p===1){const w=f.geometry.getAttribute("position");for(let C=0;C<w.count;C++){const M=Math.atan2(w.getY(C)-u[1],w.getX(C)-u[0]),x=.2*Math.sin(M*53)+.09*Math.sin(M*91);for(const S of["normal","normal0","normal1","paletteGeometry"]){const R=f.geometry.getAttribute(S),_=S==="paletteGeometry"?1:0,E=[R.getComponent(C,_)+Math.cos(M)*x,R.getComponent(C,_+1)+Math.sin(M)*x,R.getComponent(C,_+2)],L=Math.hypot(...E);L>1e-8&&E.forEach((T,P)=>R.setComponent(C,_+P,T/L))}}}c.push(f),h=f.bounds.max[2]}return c}function Yg(i,e,t){const n=i.body.attachment==="metal"||i.body.label==="metal",r=n?i:e,a=r.pieces.filter(c=>c.category==="eyes"&&!c.fur);if(a.length!==6)throw Error("Clippo requires two eyes, two pupils and two brows");if(n)return a.map(c=>({donor:r,placement:{part:c,scale:1,origin:[0,0,0],translate:[0,0,0]}}));if(t?.kind!=="clippo-face"||t.eyes.length!==2)throw Error("Missing Clippo construction anchors");const s=i.face;if(!(s.radius>0)||s.centers.length!==2)throw Error("Missing target Clippo face layout");const o=s.radius/.21;return a.map(c=>{const l=(c.bounds.min[0]+c.bounds.max[0])/2<0?0:1,h=t.eyes[l];if(!(h.eyeScale>0)||h.center.length!==3)throw Error("Invalid Clippo source eye scale");const p=s.centers[l].map((d,v)=>d+(v===2?.14*o:0));return{donor:e,placement:{part:c,scale:o/h.eyeScale,origin:h.center,translate:p.map((d,v)=>d-h.center[v])}}})}function $g(i){const e=Math.fround;return[...[0,1].map(t=>e(e(i.min[t]+i.max[t])*.5)),...[0,1].map(t=>e(e(e(e(i.max[t]-i.min[t])*.5)*e(t?1.1:1.16))+e(.008)))]}const Kg=new URL("../assets/geometry-BTFa17wc.bin",import.meta.url).href,Zg=new URL("../assets/geometry-OwRO3lfs.json",import.meta.url).href,Jg=""+new URL("../assets/material-CWbv_tbJ.json",import.meta.url).href,Qg=new URL("../assets/geometry-WoKw8CFo.bin",import.meta.url).href,e1=new URL("../assets/geometry-DXSwvN0_.json",import.meta.url).href,t1=""+new URL("../assets/material-CXKfD_Dd.json",import.meta.url).href,n1=new URL("../assets/geometry-Dv6FfOeJ.bin",import.meta.url).href,i1=new URL("../assets/geometry-DzNZ-Mt3.json",import.meta.url).href,r1=""+new URL("../assets/material-BFI-3LHv.json",import.meta.url).href,a1=new URL("../assets/geometry-B4ElBbg3.bin",import.meta.url).href,s1=new URL("../assets/geometry-BqhQRk1W.json",import.meta.url).href,o1=""+new URL("../assets/material-BVRQKC7I.json",import.meta.url).href,l1=new URL("../assets/geometry-HrE6xacc.bin",import.meta.url).href,c1=new URL("../assets/geometry-BL75SZM_.json",import.meta.url).href,u1=""+new URL("../assets/material-DfSqePut.json",import.meta.url).href,h1=new URL("../assets/geometry-t60HcdL1.bin",import.meta.url).href,d1=new URL("../assets/geometry-DEbVqYnX.json",import.meta.url).href,f1=""+new URL("../assets/material-R4facdQH.json",import.meta.url).href,p1=new URL("../assets/geometry-DjOuGBLx.bin",import.meta.url).href,m1=new URL("../assets/geometry-BjeeHY8_.json",import.meta.url).href,v1=""+new URL("../assets/material-LTv2F1Vo.json",import.meta.url).href,g1=new URL("../assets/geometry-KkiZzq02.bin",import.meta.url).href,_1=new URL("../assets/geometry-DKzkp4Jj.json",import.meta.url).href,y1=""+new URL("../assets/material-DiVOB9ms.json",import.meta.url).href,x1=new URL("../assets/geometry-C8mRYEXR.bin",import.meta.url).href,b1=new URL("../assets/geometry-izH6aKKy.json",import.meta.url).href,w1=""+new URL("../assets/material-BoaEMhW2.json",import.meta.url).href,S1=new URL("../assets/geometry-CO6mKd2l.bin",import.meta.url).href,M1=new URL("../assets/geometry-DmeKCdAi.json",import.meta.url).href,E1=""+new URL("../assets/material-19-_S_wi.json",import.meta.url).href,R1=new URL("../assets/geometry-CUk83oaL.bin",import.meta.url).href,T1=new URL("../assets/geometry-DvRcqPwe.json",import.meta.url).href,A1=""+new URL("../assets/material-CmyfCZYK.json",import.meta.url).href,C1=new URL("../assets/geometry-BLkOFRHM.bin",import.meta.url).href,L1=new URL("../assets/geometry-ByWVyM3q.json",import.meta.url).href,P1=""+new URL("../assets/material-srTN7chL.json",import.meta.url).href,D1=new URL("../assets/geometry-S-S5dyBW.bin",import.meta.url).href,U1=new URL("../assets/geometry-DOdbnlJm.json",import.meta.url).href,I1=""+new URL("../assets/material-kSAVIxbx.json",import.meta.url).href,N1=new URL("../assets/geometry-BlM7WBLk.bin",import.meta.url).href,F1=new URL("../assets/geometry-Dipwd9su.json",import.meta.url).href,B1=""+new URL("../assets/material-DaNSvDOI.json",import.meta.url).href,O1=new URL("../assets/geometry-DDYIC6aS.bin",import.meta.url).href,z1=new URL("../assets/geometry-BUrN-K_g.json",import.meta.url).href,k1=""+new URL("../assets/material-6raYOKQ_.json",import.meta.url).href,G1=new URL("../assets/geometry-D34g7-N1.bin",import.meta.url).href,V1=new URL("../assets/geometry-C_l60Ao3.json",import.meta.url).href,H1=""+new URL("../assets/material-CWtgq7Jt.json",import.meta.url).href,W1=new URL("../assets/geometry-xGrmeeG4.bin",import.meta.url).href,X1=new URL("../assets/geometry-CLSmQmoi.json",import.meta.url).href,j1=""+new URL("../assets/material-CQ6_IPcI.json",import.meta.url).href,q1=new URL("../assets/geometry-Dy1TW2PB.bin",import.meta.url).href,Y1=new URL("../assets/geometry-BxnJV3QV.json",import.meta.url).href,$1=""+new URL("../assets/material-DWyWg7oh.json",import.meta.url).href,K1=new URL("../assets/geometry-DtrwGhZn.bin",import.meta.url).href,Z1=new URL("../assets/geometry-uYIBU3ov.json",import.meta.url).href,J1=""+new URL("../assets/material-DTaAF6ek.json",import.meta.url).href,Q1=new URL("../assets/geometry-DhPPTBok.bin",import.meta.url).href,e2=new URL("../assets/geometry-YgBg_ld2.json",import.meta.url).href,t2=""+new URL("../assets/material-CXrCte2w.json",import.meta.url).href,n2=new URL("../assets/geometry-DOHj_FT2.bin",import.meta.url).href,i2=new URL("../assets/geometry-CPonTa4R.json",import.meta.url).href,r2=""+new URL("../assets/material-Pza9ndlv.json",import.meta.url).href,a2=new URL("../assets/geometry-Bz_GAoyM.bin",import.meta.url).href,s2=new URL("../assets/geometry-G9MJMq4p.json",import.meta.url).href,o2=""+new URL("../assets/material-JmNDC229.json",import.meta.url).href,l2=new URL("../assets/geometry-DDYIC6aS.bin",import.meta.url).href,c2=new URL("../assets/geometry-Cp4M6i7D.json",import.meta.url).href,u2=""+new URL("../assets/material-OZX_63TY.json",import.meta.url).href,h2=new URL("../assets/geometry-D34g7-N1.bin",import.meta.url).href,d2=new URL("../assets/geometry-BX0WQIX1.json",import.meta.url).href,f2=""+new URL("../assets/material-CqDfLwek.json",import.meta.url).href,p2=new URL("../assets/geometry-qC0vHX1L.bin",import.meta.url).href,m2=new URL("../assets/geometry-JshxaVrE.json",import.meta.url).href,v2=""+new URL("../assets/material-BcyqpYt_.json",import.meta.url).href,g2=new URL("../assets/geometry-DflTC8wk.bin",import.meta.url).href,_2=new URL("../assets/geometry-SeWAXhPD.json",import.meta.url).href,y2=""+new URL("../assets/material-BRVEzlCc.json",import.meta.url).href,x2=new URL("../assets/geometry-CLsBB4WQ.bin",import.meta.url).href,b2=new URL("../assets/geometry-VeJsBHjy.json",import.meta.url).href,w2=""+new URL("../assets/material-CSzKN9Ul.json",import.meta.url).href,S2=new URL("../assets/geometry-Bul-YatC.bin",import.meta.url).href,M2=new URL("../assets/geometry-DVFTEJuV.json",import.meta.url).href,E2=""+new URL("../assets/material-BPenrW2m.json",import.meta.url).href,R2=new URL("../assets/geometry-shvoryLJ.bin",import.meta.url).href,T2=new URL("../assets/geometry-BFufagPo.json",import.meta.url).href,A2=""+new URL("../assets/material-CQpmrHLw.json",import.meta.url).href,C2=new URL("../assets/geometry-DB6wVIcA.bin",import.meta.url).href,L2=new URL("../assets/geometry-FPnZi4PF.json",import.meta.url).href,P2=""+new URL("../assets/material-CjnmFEnQ.json",import.meta.url).href,D2=new URL("../assets/geometry-Li6zPuT1.bin",import.meta.url).href,U2=new URL("../assets/geometry-Porl2AZP.json",import.meta.url).href,I2=""+new URL("../assets/material-BEz3iia9.json",import.meta.url).href,N2=new URL("../assets/geometry-JepB0EWi.bin",import.meta.url).href,F2=new URL("../assets/geometry-BZ-TUYgp.json",import.meta.url).href,B2=""+new URL("../assets/material-BBbCYYFe.json",import.meta.url).href,O2=new URL("../assets/geometry-C4KIFesq.bin",import.meta.url).href,z2=new URL("../assets/geometry-COojCaI-.json",import.meta.url).href,k2=""+new URL("../assets/material-CXYNmTik.json",import.meta.url).href,G2=new URL("../assets/geometry-BK-mUcZb.bin",import.meta.url).href,V2=new URL("../assets/geometry-CV3YgDWK.json",import.meta.url).href,H2=""+new URL("../assets/material-BSBcnXaC.json",import.meta.url).href,W2=new URL("../assets/geometry-DZ4Y7GDU.bin",import.meta.url).href,X2=new URL("../assets/geometry-BxHzNqZH.json",import.meta.url).href,j2=""+new URL("../assets/material-D1Wb0xpI.json",import.meta.url).href,q2=new URL("../assets/geometry-wsfA6sgp.bin",import.meta.url).href,Y2=new URL("../assets/geometry-CdNScfXH.json",import.meta.url).href,$2=""+new URL("../assets/material-Dd9hHI7n.json",import.meta.url).href,K2=new URL("../assets/geometry-CCHuX_wE.bin",import.meta.url).href,Z2=new URL("../assets/geometry-BmS6kE2Y.json",import.meta.url).href,J2=""+new URL("../assets/material-DdMEm9Aa.json",import.meta.url).href,Q2=new URL("../assets/geometry-DVmtlcIg.bin",import.meta.url).href,e_=new URL("../assets/geometry-6TdxPxgj.json",import.meta.url).href,t_=""+new URL("../assets/material-B2vVSbXc.json",import.meta.url).href,n_=new URL("../assets/geometry-B3rw-nBE.bin",import.meta.url).href,i_=new URL("../assets/geometry-_m25dele.json",import.meta.url).href,r_=""+new URL("../assets/material-DSs7CUDy.json",import.meta.url).href,a_=new URL("../assets/geometry-BAvWe66A.bin",import.meta.url).href,s_=new URL("../assets/geometry-DtHo7UJU.json",import.meta.url).href,o_=""+new URL("../assets/material-BzPY7sJY.json",import.meta.url).href,l_=new URL("../assets/geometry-GwbntpyN.bin",import.meta.url).href,c_=new URL("../assets/geometry-DQnebIlC.json",import.meta.url).href,u_=""+new URL("../assets/material-C2qH4Bdi.json",import.meta.url).href,h_=new URL("../assets/geometry-DrHGMxlj.bin",import.meta.url).href,d_=new URL("../assets/geometry-Dh2fQyuC.json",import.meta.url).href,f_=""+new URL("../assets/material-Dyu0C8g-.json",import.meta.url).href,p_=new URL("../assets/geometry-DgmRDiaT.bin",import.meta.url).href,m_=new URL("../assets/geometry-DhHiJoKx.json",import.meta.url).href,v_=""+new URL("../assets/material--Y5xXkag.json",import.meta.url).href,g_=new URL("../assets/geometry-OqRIHaM_.bin",import.meta.url).href,__=new URL("../assets/geometry-CjlztW-F.json",import.meta.url).href,y_=""+new URL("../assets/material-7p24nenI.json",import.meta.url).href,x_=new URL("../assets/geometry-CQAwAt2H.bin",import.meta.url).href,b_=new URL("../assets/geometry-D1698zrF.json",import.meta.url).href,w_=""+new URL("../assets/material-_1mBOAqr.json",import.meta.url).href,S_=new URL("../assets/geometry-Cgtbkld_.bin",import.meta.url).href,M_=new URL("../assets/geometry-BHbzMsJl.json",import.meta.url).href,E_=""+new URL("../assets/material-CSVMbfIn.json",import.meta.url).href,R_=new URL("../assets/geometry-HyEmlJw-.bin",import.meta.url).href,T_=new URL("../assets/geometry-BN0EO417.json",import.meta.url).href,A_=""+new URL("../assets/material-UdyZZ8oz.json",import.meta.url).href,C_=new URL("../assets/geometry-Bgf8shsq.bin",import.meta.url).href,L_=new URL("../assets/geometry-fM95txkV.json",import.meta.url).href,P_=""+new URL("../assets/material-BM4slwr6.json",import.meta.url).href,D_=new URL("../assets/geometry-ChoRT0Or.bin",import.meta.url).href,U_=new URL("../assets/geometry-CmlmLnip.json",import.meta.url).href,I_=""+new URL("../assets/material-PfBrUyFh.json",import.meta.url).href,N_=new URL("../assets/geometry-cNLGJ4Th.bin",import.meta.url).href,F_=new URL("../assets/geometry-C0Ipuv67.json",import.meta.url).href,B_=""+new URL("../assets/material-Dkeu2xFP.json",import.meta.url).href,O_=new URL("../assets/geometry-CF49H-qx.bin",import.meta.url).href,z_=new URL("../assets/geometry-fLZMIDMW.json",import.meta.url).href,k_=""+new URL("../assets/material-Dqtf8qW0.json",import.meta.url).href,G_=new URL("../assets/geometry-DgT-GMym.bin",import.meta.url).href,V_=new URL("../assets/geometry-BflYNi7y.json",import.meta.url).href,H_=""+new URL("../assets/material-D9yGEOsK.json",import.meta.url).href,W_=new URL("../assets/geometry-D2yN9d1k.bin",import.meta.url).href,X_=new URL("../assets/geometry-CTKL67_v.json",import.meta.url).href,j_=""+new URL("../assets/material-CF4_k2RB.json",import.meta.url).href,q_=new URL("../assets/geometry-BPHd7mmZ.bin",import.meta.url).href,Y_=new URL("../assets/geometry-CG7QERBM.json",import.meta.url).href,$_=""+new URL("../assets/material-Bw0IHv3e.json",import.meta.url).href,K_=new URL("../assets/geometry-BBKPx19i.bin",import.meta.url).href,Z_=new URL("../assets/geometry-CMY3Ubye.json",import.meta.url).href,J_=""+new URL("../assets/material-nJaxzG7X.json",import.meta.url).href,Q_=new URL("../assets/geometry-C21JgGNl.bin",import.meta.url).href,e3=new URL("../assets/geometry-DfVzt42m.json",import.meta.url).href,t3=""+new URL("../assets/material-rLqbiik1.json",import.meta.url).href,n3=new URL("../assets/geometry-CbMNspJw.bin",import.meta.url).href,i3=new URL("../assets/geometry-Cixj09DK.json",import.meta.url).href,r3=""+new URL("../assets/material-6RNaBXJp.json",import.meta.url).href,a3=new URL("../assets/geometry-CxG-LMks.bin",import.meta.url).href,s3=new URL("../assets/geometry-CPR45hPn.json",import.meta.url).href,o3=""+new URL("../assets/material-Lz00GJeg.json",import.meta.url).href,l3=new URL("../assets/geometry-V5mpIThN.bin",import.meta.url).href,c3=new URL("../assets/geometry-CIkXNP86.json",import.meta.url).href,u3=""+new URL("../assets/material-CJzPgH8p.json",import.meta.url).href,h3=new URL("../assets/geometry-Djz7eF4I.bin",import.meta.url).href,d3=new URL("../assets/geometry-h6NOrGlq.json",import.meta.url).href,f3=""+new URL("../assets/material-BjTWxFgz.json",import.meta.url).href,p3=new URL("../assets/geometry-DduJlEir.bin",import.meta.url).href,m3=new URL("../assets/geometry-BImfoL89.json",import.meta.url).href,v3=""+new URL("../assets/material-2lVmfC1N.json",import.meta.url).href,g3=new URL("../assets/geometry-LFXDWtqt.bin",import.meta.url).href,_3=new URL("../assets/geometry-Be4UAG7U.json",import.meta.url).href,y3=""+new URL("../assets/material-DSUAmpZP.json",import.meta.url).href,x3=new URL("../assets/geometry-DqEPsDlZ.bin",import.meta.url).href,b3=new URL("../assets/geometry-DbxKX1xO.json",import.meta.url).href,w3=""+new URL("../assets/material-Bno-8C0W.json",import.meta.url).href,S3=new URL("../assets/geometry-9ZRUVyI6.bin",import.meta.url).href,M3=new URL("../assets/geometry-BgqtWpq-.json",import.meta.url).href,E3=""+new URL("../assets/material-DkG9mGhM.json",import.meta.url).href,R3=new URL("../assets/geometry-GAwYraYf.bin",import.meta.url).href,T3=new URL("../assets/geometry-DRte854E.json",import.meta.url).href,A3=""+new URL("../assets/material-CtIpo9uK.json",import.meta.url).href,C3=new URL("../assets/geometry-BThansED.bin",import.meta.url).href,L3=new URL("../assets/geometry-BcFSb4Zh.json",import.meta.url).href,P3=""+new URL("../assets/material-6Y7KjP14.json",import.meta.url).href,D3=new URL("../assets/geometry-C97Wb59S.bin",import.meta.url).href,U3=new URL("../assets/geometry-B-4gSjl0.json",import.meta.url).href,I3=""+new URL("../assets/material-DQb1nmnR.json",import.meta.url).href,N3=new URL("../assets/geometry-CYUUVO9z.bin",import.meta.url).href,F3=new URL("../assets/geometry-DNFhaOig.json",import.meta.url).href,B3=""+new URL("../assets/material-BY0IrCGd.json",import.meta.url).href,O3=new URL("../assets/geometry-DTrxDt9C.bin",import.meta.url).href,z3=new URL("../assets/geometry-D8niMYQ_.json",import.meta.url).href,k3=""+new URL("../assets/material-DyWFR3h1.json",import.meta.url).href,G3=new URL("../assets/geometry-BYEy-j3u.bin",import.meta.url).href,V3=new URL("../assets/geometry-BWxGSzzt.json",import.meta.url).href,H3=""+new URL("../assets/material-CpMPTBuF.json",import.meta.url).href,W3=new URL("../assets/geometry-BrxF-osz.bin",import.meta.url).href,X3=new URL("../assets/geometry-jh7lV-uw.json",import.meta.url).href,j3=""+new URL("../assets/material-Cfex3Ql_.json",import.meta.url).href,q3=new URL("../assets/geometry-B7FAzS1F.bin",import.meta.url).href,Y3=new URL("../assets/geometry-2pURe-Kn.json",import.meta.url).href,$3=""+new URL("../assets/material-DEaKHfDN.json",import.meta.url).href,K3=new URL("../assets/geometry-BiK7FtQX.bin",import.meta.url).href,Z3=new URL("../assets/geometry-BsWKJT6i.json",import.meta.url).href,J3=""+new URL("../assets/material-yBISC-jU.json",import.meta.url).href,Q3=new URL("../assets/geometry-BMPV_Hsg.bin",import.meta.url).href,ey=new URL("../assets/geometry-Hap2bo7L.json",import.meta.url).href,ty=""+new URL("../assets/material-BcYkk3ll.json",import.meta.url).href,ny=new URL("../assets/geometry-DDYIC6aS.bin",import.meta.url).href,iy=new URL("../assets/geometry-BNMzmgll.json",import.meta.url).href,ry=""+new URL("../assets/material-CixhQnYS.json",import.meta.url).href,ay=new URL("../assets/geometry-D34g7-N1.bin",import.meta.url).href,sy=new URL("../assets/geometry-D9lF6FLH.json",import.meta.url).href,oy=""+new URL("../assets/material-BkMsbnL9.json",import.meta.url).href,ly=new URL("../assets/geometry-CQAwAt2H.bin",import.meta.url).href,cy=new URL("../assets/geometry-CTsuyrDZ.json",import.meta.url).href,uy=""+new URL("../assets/material-HrT5tD94.json",import.meta.url).href,hy=new URL("../assets/geometry-Cgtbkld_.bin",import.meta.url).href,dy=new URL("../assets/geometry-CrvwbE-6.json",import.meta.url).href,fy=""+new URL("../assets/material-BSnkxnpl.json",import.meta.url).href,py=new URL("../assets/geometry-DAZa6NBL.bin",import.meta.url).href,my=new URL("../assets/geometry-DSyduoFt.json",import.meta.url).href,vy=""+new URL("../assets/material-dDBJCy9-.json",import.meta.url).href,gy=new URL("../assets/geometry-ClI8rpFr.bin",import.meta.url).href,_y=new URL("../assets/geometry-C_7Z-X7j.json",import.meta.url).href,yy=""+new URL("../assets/material-DEKjTM3C.json",import.meta.url).href,xy=new URL("../assets/geometry-D7GAMkpP.bin",import.meta.url).href,by=new URL("../assets/geometry-C7x8IeHX.json",import.meta.url).href,wy=""+new URL("../assets/material-D4i1hBC1.json",import.meta.url).href,Sy=new URL("../assets/geometry-T-7IYkmQ.bin",import.meta.url).href,My=new URL("../assets/geometry-BlmVRd3r.json",import.meta.url).href,Ey=""+new URL("../assets/material-CIbmVcQQ.json",import.meta.url).href,Ry=new URL("../assets/geometry-BsAr1mz-.bin",import.meta.url).href,Ty=new URL("../assets/geometry-DRSEz9lw.json",import.meta.url).href,Ay=""+new URL("../assets/material-BNp8l0oa.json",import.meta.url).href,Cy=new URL("../assets/geometry-CuSwc6Vq.bin",import.meta.url).href,Ly=new URL("../assets/geometry-CYID7hnN.json",import.meta.url).href,Py=""+new URL("../assets/material-DLSM1AwK.json",import.meta.url).href,Dy=new URL("../assets/geometry-V5mpIThN.bin",import.meta.url).href,Uy=new URL("../assets/geometry-H8JzNDU1.json",import.meta.url).href,Iy=""+new URL("../assets/material-DQslPigd.json",import.meta.url).href,Ny=new URL("../assets/geometry-Djz7eF4I.bin",import.meta.url).href,Fy=new URL("../assets/geometry-DTRcWIBb.json",import.meta.url).href,By=""+new URL("../assets/material-Bu1beJit.json",import.meta.url).href,Oy=new URL("../assets/geometry-DZvNtSgq.bin",import.meta.url).href,zy=new URL("../assets/geometry-CAxTQj9F.json",import.meta.url).href,ky=""+new URL("../assets/material-DuDpMyEA.json",import.meta.url).href,Gy=new URL("../assets/geometry-CXPF8M1d.bin",import.meta.url).href,Vy=new URL("../assets/geometry-BqrHvByf.json",import.meta.url).href,Hy=""+new URL("../assets/material-CVSRBAW3.json",import.meta.url).href,Wy=new URL("../assets/geometry-DRrKS7_i.bin",import.meta.url).href,Xy=new URL("../assets/geometry-QAcgG-n2.json",import.meta.url).href,jy=""+new URL("../assets/material-CdgPz2Ze.json",import.meta.url).href,qy=new URL("../assets/geometry-BD4lLBTf.bin",import.meta.url).href,Yy=new URL("../assets/geometry-DibZ314G.json",import.meta.url).href,$y=""+new URL("../assets/material-B0RKr4tz.json",import.meta.url).href,Ky=new URL("../assets/geometry-DDYIC6aS.bin",import.meta.url).href,Zy=new URL("../assets/geometry-Dn3tdd69.json",import.meta.url).href,Jy=""+new URL("../assets/material-BKybwRJl.json",import.meta.url).href,Qy=new URL("../assets/geometry-D34g7-N1.bin",import.meta.url).href,ex=new URL("../assets/geometry-BLcYALBV.json",import.meta.url).href,tx=""+new URL("../assets/material-BEKpGaDX.json",import.meta.url).href,nx=new URL("../assets/geometry-DQBDgAad.bin",import.meta.url).href,ix=new URL("../assets/geometry-CQ8TViEm.json",import.meta.url).href,rx=""+new URL("../assets/material-n1BkoPp2.json",import.meta.url).href,ax=new URL("../assets/geometry-uCngZTcL.bin",import.meta.url).href,sx=new URL("../assets/geometry-DW5Zl8BW.json",import.meta.url).href,ox=""+new URL("../assets/material-BsCoypig.json",import.meta.url).href,lx=new URL("../assets/geometry-CpYs-xNI.bin",import.meta.url).href,cx=new URL("../assets/geometry-fKdprFWD.json",import.meta.url).href,ux=""+new URL("../assets/material-DzSpmvA1.json",import.meta.url).href,hx=new URL("../assets/geometry-C7QFQ1BU.bin",import.meta.url).href,dx=new URL("../assets/geometry-Cvq411cH.json",import.meta.url).href,fx=""+new URL("../assets/material-B6XMTn8L.json",import.meta.url).href,px=new URL("../assets/geometry-7BHXPH-R.bin",import.meta.url).href,mx=new URL("../assets/geometry-DDDfxj8N.json",import.meta.url).href,vx=""+new URL("../assets/material-BklD9Aiu.json",import.meta.url).href,gx=new URL("../assets/geometry-LUw4F0gC.bin",import.meta.url).href,_x=new URL("../assets/geometry-OaPBQTNZ.json",import.meta.url).href,yx=""+new URL("../assets/material-D7utDAQY.json",import.meta.url).href,xx=""+new URL("../assets/index-PiPWqvvK.json",import.meta.url).href,bx=Object.assign({"./assets/catalog-library/accessory/beanie/high/geometry.bin":Kg,"./assets/catalog-library/accessory/beanie/high/geometry.json":Zg,"./assets/catalog-library/accessory/beanie/high/material.json":Jg,"./assets/catalog-library/accessory/beanie/low/geometry.bin":Qg,"./assets/catalog-library/accessory/beanie/low/geometry.json":e1,"./assets/catalog-library/accessory/beanie/low/material.json":t1,"./assets/catalog-library/accessory/beret/high/geometry.bin":n1,"./assets/catalog-library/accessory/beret/high/geometry.json":i1,"./assets/catalog-library/accessory/beret/high/material.json":r1,"./assets/catalog-library/accessory/beret/low/geometry.bin":a1,"./assets/catalog-library/accessory/beret/low/geometry.json":s1,"./assets/catalog-library/accessory/beret/low/material.json":o1,"./assets/catalog-library/accessory/bow/high/geometry.bin":l1,"./assets/catalog-library/accessory/bow/high/geometry.json":c1,"./assets/catalog-library/accessory/bow/high/material.json":u1,"./assets/catalog-library/accessory/bow/low/geometry.bin":h1,"./assets/catalog-library/accessory/bow/low/geometry.json":d1,"./assets/catalog-library/accessory/bow/low/material.json":f1,"./assets/catalog-library/accessory/crown/high/geometry.bin":p1,"./assets/catalog-library/accessory/crown/high/geometry.json":m1,"./assets/catalog-library/accessory/crown/high/material.json":v1,"./assets/catalog-library/accessory/crown/low/geometry.bin":g1,"./assets/catalog-library/accessory/crown/low/geometry.json":_1,"./assets/catalog-library/accessory/crown/low/material.json":y1,"./assets/catalog-library/accessory/felipe_beret/high/geometry.bin":x1,"./assets/catalog-library/accessory/felipe_beret/high/geometry.json":b1,"./assets/catalog-library/accessory/felipe_beret/high/material.json":w1,"./assets/catalog-library/accessory/felipe_beret/low/geometry.bin":S1,"./assets/catalog-library/accessory/felipe_beret/low/geometry.json":M1,"./assets/catalog-library/accessory/felipe_beret/low/material.json":E1,"./assets/catalog-library/accessory/hat/high/geometry.bin":R1,"./assets/catalog-library/accessory/hat/high/geometry.json":T1,"./assets/catalog-library/accessory/hat/high/material.json":A1,"./assets/catalog-library/accessory/hat/low/geometry.bin":C1,"./assets/catalog-library/accessory/hat/low/geometry.json":L1,"./assets/catalog-library/accessory/hat/low/material.json":P1,"./assets/catalog-library/accessory/headphones/high/geometry.bin":D1,"./assets/catalog-library/accessory/headphones/high/geometry.json":U1,"./assets/catalog-library/accessory/headphones/high/material.json":I1,"./assets/catalog-library/accessory/headphones/low/geometry.bin":N1,"./assets/catalog-library/accessory/headphones/low/geometry.json":F1,"./assets/catalog-library/accessory/headphones/low/material.json":B1,"./assets/catalog-library/accessory/none/high/geometry.bin":O1,"./assets/catalog-library/accessory/none/high/geometry.json":z1,"./assets/catalog-library/accessory/none/high/material.json":k1,"./assets/catalog-library/accessory/none/low/geometry.bin":G1,"./assets/catalog-library/accessory/none/low/geometry.json":V1,"./assets/catalog-library/accessory/none/low/material.json":H1,"./assets/catalog-library/accessory/orb/high/geometry.bin":W1,"./assets/catalog-library/accessory/orb/high/geometry.json":X1,"./assets/catalog-library/accessory/orb/high/material.json":j1,"./assets/catalog-library/accessory/orb/low/geometry.bin":q1,"./assets/catalog-library/accessory/orb/low/geometry.json":Y1,"./assets/catalog-library/accessory/orb/low/material.json":$1,"./assets/catalog-library/accessory/three_lobe/high/geometry.bin":K1,"./assets/catalog-library/accessory/three_lobe/high/geometry.json":Z1,"./assets/catalog-library/accessory/three_lobe/high/material.json":J1,"./assets/catalog-library/accessory/three_lobe/low/geometry.bin":Q1,"./assets/catalog-library/accessory/three_lobe/low/geometry.json":e2,"./assets/catalog-library/accessory/three_lobe/low/material.json":t2,"./assets/catalog-library/body/capsule/high/geometry.bin":n2,"./assets/catalog-library/body/capsule/high/geometry.json":i2,"./assets/catalog-library/body/capsule/high/material.json":r2,"./assets/catalog-library/body/capsule/low/geometry.bin":a2,"./assets/catalog-library/body/capsule/low/geometry.json":s2,"./assets/catalog-library/body/capsule/low/material.json":o2,"./assets/catalog-library/body/circle/high/geometry.bin":l2,"./assets/catalog-library/body/circle/high/geometry.json":c2,"./assets/catalog-library/body/circle/high/material.json":u2,"./assets/catalog-library/body/circle/low/geometry.bin":h2,"./assets/catalog-library/body/circle/low/geometry.json":d2,"./assets/catalog-library/body/circle/low/material.json":f2,"./assets/catalog-library/body/circle_two_ears/high/geometry.bin":p2,"./assets/catalog-library/body/circle_two_ears/high/geometry.json":m2,"./assets/catalog-library/body/circle_two_ears/high/material.json":v2,"./assets/catalog-library/body/circle_two_ears/low/geometry.bin":g2,"./assets/catalog-library/body/circle_two_ears/low/geometry.json":_2,"./assets/catalog-library/body/circle_two_ears/low/material.json":y2,"./assets/catalog-library/body/clippo/high/geometry.bin":x2,"./assets/catalog-library/body/clippo/high/geometry.json":b2,"./assets/catalog-library/body/clippo/high/material.json":w2,"./assets/catalog-library/body/clippo/low/geometry.bin":S2,"./assets/catalog-library/body/clippo/low/geometry.json":M2,"./assets/catalog-library/body/clippo/low/material.json":E2,"./assets/catalog-library/body/cloud/high/geometry.bin":R2,"./assets/catalog-library/body/cloud/high/geometry.json":T2,"./assets/catalog-library/body/cloud/high/material.json":A2,"./assets/catalog-library/body/cloud/low/geometry.bin":C2,"./assets/catalog-library/body/cloud/low/geometry.json":L2,"./assets/catalog-library/body/cloud/low/material.json":P2,"./assets/catalog-library/body/four_lobed_butterfly/high/geometry.bin":D2,"./assets/catalog-library/body/four_lobed_butterfly/high/geometry.json":U2,"./assets/catalog-library/body/four_lobed_butterfly/high/material.json":I2,"./assets/catalog-library/body/four_lobed_butterfly/low/geometry.bin":N2,"./assets/catalog-library/body/four_lobed_butterfly/low/geometry.json":F2,"./assets/catalog-library/body/four_lobed_butterfly/low/material.json":B2,"./assets/catalog-library/body/heart/high/geometry.bin":O2,"./assets/catalog-library/body/heart/high/geometry.json":z2,"./assets/catalog-library/body/heart/high/material.json":k2,"./assets/catalog-library/body/heart/low/geometry.bin":G2,"./assets/catalog-library/body/heart/low/geometry.json":V2,"./assets/catalog-library/body/heart/low/material.json":H2,"./assets/catalog-library/body/pebble/high/geometry.bin":W2,"./assets/catalog-library/body/pebble/high/geometry.json":X2,"./assets/catalog-library/body/pebble/high/material.json":j2,"./assets/catalog-library/body/pebble/low/geometry.bin":q2,"./assets/catalog-library/body/pebble/low/geometry.json":Y2,"./assets/catalog-library/body/pebble/low/material.json":$2,"./assets/catalog-library/body/petal/high/geometry.bin":K2,"./assets/catalog-library/body/petal/high/geometry.json":Z2,"./assets/catalog-library/body/petal/high/material.json":J2,"./assets/catalog-library/body/petal/low/geometry.bin":Q2,"./assets/catalog-library/body/petal/low/geometry.json":e_,"./assets/catalog-library/body/petal/low/material.json":t_,"./assets/catalog-library/body/pocket/high/geometry.bin":n_,"./assets/catalog-library/body/pocket/high/geometry.json":i_,"./assets/catalog-library/body/pocket/high/material.json":r_,"./assets/catalog-library/body/pocket/low/geometry.bin":a_,"./assets/catalog-library/body/pocket/low/geometry.json":s_,"./assets/catalog-library/body/pocket/low/material.json":o_,"./assets/catalog-library/body/rounded_cube/high/geometry.bin":l_,"./assets/catalog-library/body/rounded_cube/high/geometry.json":c_,"./assets/catalog-library/body/rounded_cube/high/material.json":u_,"./assets/catalog-library/body/rounded_cube/low/geometry.bin":h_,"./assets/catalog-library/body/rounded_cube/low/geometry.json":d_,"./assets/catalog-library/body/rounded_cube/low/material.json":f_,"./assets/catalog-library/body/rounded_diamond/high/geometry.bin":p_,"./assets/catalog-library/body/rounded_diamond/high/geometry.json":m_,"./assets/catalog-library/body/rounded_diamond/high/material.json":v_,"./assets/catalog-library/body/rounded_diamond/low/geometry.bin":g_,"./assets/catalog-library/body/rounded_diamond/low/geometry.json":__,"./assets/catalog-library/body/rounded_diamond/low/material.json":y_,"./assets/catalog-library/body/rounded_head_two_ears/high/geometry.bin":x_,"./assets/catalog-library/body/rounded_head_two_ears/high/geometry.json":b_,"./assets/catalog-library/body/rounded_head_two_ears/high/material.json":w_,"./assets/catalog-library/body/rounded_head_two_ears/low/geometry.bin":S_,"./assets/catalog-library/body/rounded_head_two_ears/low/geometry.json":M_,"./assets/catalog-library/body/rounded_head_two_ears/low/material.json":E_,"./assets/catalog-library/body/rounded_triangle/high/geometry.bin":R_,"./assets/catalog-library/body/rounded_triangle/high/geometry.json":T_,"./assets/catalog-library/body/rounded_triangle/high/material.json":A_,"./assets/catalog-library/body/rounded_triangle/low/geometry.bin":C_,"./assets/catalog-library/body/rounded_triangle/low/geometry.json":L_,"./assets/catalog-library/body/rounded_triangle/low/material.json":P_,"./assets/catalog-library/body/shield/high/geometry.bin":D_,"./assets/catalog-library/body/shield/high/geometry.json":U_,"./assets/catalog-library/body/shield/high/material.json":I_,"./assets/catalog-library/body/shield/low/geometry.bin":N_,"./assets/catalog-library/body/shield/low/geometry.json":F_,"./assets/catalog-library/body/shield/low/material.json":B_,"./assets/catalog-library/body/six_lobed_flower/high/geometry.bin":O_,"./assets/catalog-library/body/six_lobed_flower/high/geometry.json":z_,"./assets/catalog-library/body/six_lobed_flower/high/material.json":k_,"./assets/catalog-library/body/six_lobed_flower/low/geometry.bin":G_,"./assets/catalog-library/body/six_lobed_flower/low/geometry.json":V_,"./assets/catalog-library/body/six_lobed_flower/low/material.json":H_,"./assets/catalog-library/body/slender/high/geometry.bin":W_,"./assets/catalog-library/body/slender/high/geometry.json":X_,"./assets/catalog-library/body/slender/high/material.json":j_,"./assets/catalog-library/body/slender/low/geometry.bin":q_,"./assets/catalog-library/body/slender/low/geometry.json":Y_,"./assets/catalog-library/body/slender/low/material.json":$_,"./assets/catalog-library/body/squircle/high/geometry.bin":K_,"./assets/catalog-library/body/squircle/high/geometry.json":Z_,"./assets/catalog-library/body/squircle/high/material.json":J_,"./assets/catalog-library/body/squircle/low/geometry.bin":Q_,"./assets/catalog-library/body/squircle/low/geometry.json":e3,"./assets/catalog-library/body/squircle/low/material.json":t3,"./assets/catalog-library/body/star/high/geometry.bin":n3,"./assets/catalog-library/body/star/high/geometry.json":i3,"./assets/catalog-library/body/star/high/material.json":r3,"./assets/catalog-library/body/star/low/geometry.bin":a3,"./assets/catalog-library/body/star/low/geometry.json":s3,"./assets/catalog-library/body/star/low/material.json":o3,"./assets/catalog-library/body/todd/high/geometry.bin":l3,"./assets/catalog-library/body/todd/high/geometry.json":c3,"./assets/catalog-library/body/todd/high/material.json":u3,"./assets/catalog-library/body/todd/low/geometry.bin":h3,"./assets/catalog-library/body/todd/low/geometry.json":d3,"./assets/catalog-library/body/todd/low/material.json":f3,"./assets/catalog-library/body/twelve_scalloped_rosette/high/geometry.bin":p3,"./assets/catalog-library/body/twelve_scalloped_rosette/high/geometry.json":m3,"./assets/catalog-library/body/twelve_scalloped_rosette/high/material.json":v3,"./assets/catalog-library/body/twelve_scalloped_rosette/low/geometry.bin":g3,"./assets/catalog-library/body/twelve_scalloped_rosette/low/geometry.json":_3,"./assets/catalog-library/body/twelve_scalloped_rosette/low/material.json":y3,"./assets/catalog-library/eyes/clippo/high/geometry.bin":x3,"./assets/catalog-library/eyes/clippo/high/geometry.json":b3,"./assets/catalog-library/eyes/clippo/high/material.json":w3,"./assets/catalog-library/eyes/clippo/low/geometry.bin":S3,"./assets/catalog-library/eyes/clippo/low/geometry.json":M3,"./assets/catalog-library/eyes/clippo/low/material.json":E3,"./assets/catalog-library/eyes/crescent_inset/high/geometry.bin":R3,"./assets/catalog-library/eyes/crescent_inset/high/geometry.json":T3,"./assets/catalog-library/eyes/crescent_inset/high/material.json":A3,"./assets/catalog-library/eyes/crescent_inset/low/geometry.bin":C3,"./assets/catalog-library/eyes/crescent_inset/low/geometry.json":L3,"./assets/catalog-library/eyes/crescent_inset/low/material.json":P3,"./assets/catalog-library/eyes/cyclops/high/geometry.bin":D3,"./assets/catalog-library/eyes/cyclops/high/geometry.json":U3,"./assets/catalog-library/eyes/cyclops/high/material.json":I3,"./assets/catalog-library/eyes/cyclops/low/geometry.bin":N3,"./assets/catalog-library/eyes/cyclops/low/geometry.json":F3,"./assets/catalog-library/eyes/cyclops/low/material.json":B3,"./assets/catalog-library/eyes/dots/high/geometry.bin":O3,"./assets/catalog-library/eyes/dots/high/geometry.json":z3,"./assets/catalog-library/eyes/dots/high/material.json":k3,"./assets/catalog-library/eyes/dots/low/geometry.bin":G3,"./assets/catalog-library/eyes/dots/low/geometry.json":V3,"./assets/catalog-library/eyes/dots/low/material.json":H3,"./assets/catalog-library/eyes/double_highlights/high/geometry.bin":W3,"./assets/catalog-library/eyes/double_highlights/high/geometry.json":X3,"./assets/catalog-library/eyes/double_highlights/high/material.json":j3,"./assets/catalog-library/eyes/double_highlights/low/geometry.bin":q3,"./assets/catalog-library/eyes/double_highlights/low/geometry.json":Y3,"./assets/catalog-library/eyes/double_highlights/low/material.json":$3,"./assets/catalog-library/eyes/highlight_capsules/high/geometry.bin":K3,"./assets/catalog-library/eyes/highlight_capsules/high/geometry.json":Z3,"./assets/catalog-library/eyes/highlight_capsules/high/material.json":J3,"./assets/catalog-library/eyes/highlight_capsules/low/geometry.bin":Q3,"./assets/catalog-library/eyes/highlight_capsules/low/geometry.json":ey,"./assets/catalog-library/eyes/highlight_capsules/low/material.json":ty,"./assets/catalog-library/eyes/oval/high/geometry.bin":ny,"./assets/catalog-library/eyes/oval/high/geometry.json":iy,"./assets/catalog-library/eyes/oval/high/material.json":ry,"./assets/catalog-library/eyes/oval/low/geometry.bin":ay,"./assets/catalog-library/eyes/oval/low/geometry.json":sy,"./assets/catalog-library/eyes/oval/low/material.json":oy,"./assets/catalog-library/eyes/round_inset/high/geometry.bin":ly,"./assets/catalog-library/eyes/round_inset/high/geometry.json":cy,"./assets/catalog-library/eyes/round_inset/high/material.json":uy,"./assets/catalog-library/eyes/round_inset/low/geometry.bin":hy,"./assets/catalog-library/eyes/round_inset/low/geometry.json":dy,"./assets/catalog-library/eyes/round_inset/low/material.json":fy,"./assets/catalog-library/eyes/sleepy_lids/high/geometry.bin":py,"./assets/catalog-library/eyes/sleepy_lids/high/geometry.json":my,"./assets/catalog-library/eyes/sleepy_lids/high/material.json":vy,"./assets/catalog-library/eyes/sleepy_lids/low/geometry.bin":gy,"./assets/catalog-library/eyes/sleepy_lids/low/geometry.json":_y,"./assets/catalog-library/eyes/sleepy_lids/low/material.json":yy,"./assets/catalog-library/eyes/sparkle_capsules/high/geometry.bin":xy,"./assets/catalog-library/eyes/sparkle_capsules/high/geometry.json":by,"./assets/catalog-library/eyes/sparkle_capsules/high/material.json":wy,"./assets/catalog-library/eyes/sparkle_capsules/low/geometry.bin":Sy,"./assets/catalog-library/eyes/sparkle_capsules/low/geometry.json":My,"./assets/catalog-library/eyes/sparkle_capsules/low/material.json":Ey,"./assets/catalog-library/eyes/swept_lids/high/geometry.bin":Ry,"./assets/catalog-library/eyes/swept_lids/high/geometry.json":Ty,"./assets/catalog-library/eyes/swept_lids/high/material.json":Ay,"./assets/catalog-library/eyes/swept_lids/low/geometry.bin":Cy,"./assets/catalog-library/eyes/swept_lids/low/geometry.json":Ly,"./assets/catalog-library/eyes/swept_lids/low/material.json":Py,"./assets/catalog-library/eyes/todd/high/geometry.bin":Dy,"./assets/catalog-library/eyes/todd/high/geometry.json":Uy,"./assets/catalog-library/eyes/todd/high/material.json":Iy,"./assets/catalog-library/eyes/todd/low/geometry.bin":Ny,"./assets/catalog-library/eyes/todd/low/geometry.json":Fy,"./assets/catalog-library/eyes/todd/low/material.json":By,"./assets/catalog-library/eyewear/classic_sunglasses/high/geometry.bin":Oy,"./assets/catalog-library/eyewear/classic_sunglasses/high/geometry.json":zy,"./assets/catalog-library/eyewear/classic_sunglasses/high/material.json":ky,"./assets/catalog-library/eyewear/classic_sunglasses/low/geometry.bin":Gy,"./assets/catalog-library/eyewear/classic_sunglasses/low/geometry.json":Vy,"./assets/catalog-library/eyewear/classic_sunglasses/low/material.json":Hy,"./assets/catalog-library/eyewear/monocle/high/geometry.bin":Wy,"./assets/catalog-library/eyewear/monocle/high/geometry.json":Xy,"./assets/catalog-library/eyewear/monocle/high/material.json":jy,"./assets/catalog-library/eyewear/monocle/low/geometry.bin":qy,"./assets/catalog-library/eyewear/monocle/low/geometry.json":Yy,"./assets/catalog-library/eyewear/monocle/low/material.json":$y,"./assets/catalog-library/eyewear/none/high/geometry.bin":Ky,"./assets/catalog-library/eyewear/none/high/geometry.json":Zy,"./assets/catalog-library/eyewear/none/high/material.json":Jy,"./assets/catalog-library/eyewear/none/low/geometry.bin":Qy,"./assets/catalog-library/eyewear/none/low/geometry.json":ex,"./assets/catalog-library/eyewear/none/low/material.json":tx,"./assets/catalog-library/eyewear/round_sunglasses/high/geometry.bin":nx,"./assets/catalog-library/eyewear/round_sunglasses/high/geometry.json":ix,"./assets/catalog-library/eyewear/round_sunglasses/high/material.json":rx,"./assets/catalog-library/eyewear/round_sunglasses/low/geometry.bin":ax,"./assets/catalog-library/eyewear/round_sunglasses/low/geometry.json":sx,"./assets/catalog-library/eyewear/round_sunglasses/low/material.json":ox,"./assets/catalog-library/eyewear/separate_trapezoid_lenses/high/geometry.bin":lx,"./assets/catalog-library/eyewear/separate_trapezoid_lenses/high/geometry.json":cx,"./assets/catalog-library/eyewear/separate_trapezoid_lenses/high/material.json":ux,"./assets/catalog-library/eyewear/separate_trapezoid_lenses/low/geometry.bin":hx,"./assets/catalog-library/eyewear/separate_trapezoid_lenses/low/geometry.json":dx,"./assets/catalog-library/eyewear/separate_trapezoid_lenses/low/material.json":fx,"./assets/catalog-library/eyewear/tall_oval_frames/high/geometry.bin":px,"./assets/catalog-library/eyewear/tall_oval_frames/high/geometry.json":mx,"./assets/catalog-library/eyewear/tall_oval_frames/high/material.json":vx,"./assets/catalog-library/eyewear/tall_oval_frames/low/geometry.bin":gx,"./assets/catalog-library/eyewear/tall_oval_frames/low/geometry.json":_x,"./assets/catalog-library/eyewear/tall_oval_frames/low/material.json":yx,"./assets/catalog-library/index.json":xx}),zr=i=>{const e=bx[`./assets/catalog-library/${i}`];if(!e)throw Error(`Missing authored catalog asset: ${i}`);return e};let Tl;const kr=new Map,wn=new Map,wx=48*1024*1024;function Sx(i,e){const t=new Set;for(const r of e.pieces){for(const s of Object.values(r.geometry.attributes)){const o=s,c=(o.data?.array??o.array)?.buffer;c&&t.add(c)}const a=r.geometry.getIndex();a&&t.add(a.array.buffer)}wn.delete(i),wn.set(i,[...t].reduce((r,a)=>r+a.byteLength,0));let n=[...wn.values()].reduce((r,a)=>r+a,0);for(const[r,a]of wn){if(n<=wx)break;wn.delete(r),kr.delete(r),n-=a}return e}function Mx(){return Tl??=en(zr("index.json")).then(i=>i.json()).catch(i=>{throw Tl=void 0,i})}function bi(i,e,t){const n=`${i}:${e}:${t}`;let r=kr.get(n);if(r&&wn.has(n)){const a=wn.get(n);wn.delete(n),wn.set(n,a)}return r||(r=(async()=>{const s=(await Mx()).donors[i]?.[e];if(!s)throw Error(`Unknown avatar ${i}: ${e}`);const o=s[t],[c,l,h]=await Promise.all([en(zr(`${o}/geometry.json`)).then(m=>m.json()),en(zr(`${o}/material.json`)).then(m=>m.json()),en(zr(`${o}/geometry.bin`)).then(m=>m.arrayBuffer())]);l.preset=s.signaturePreset,l.crop=[0,0,1,1];const p=ro(s.signaturePreset,c,l,h,!1,void 0),d=p.parts.map(m=>{const u=l.parts.find(f=>f.id===m.id);if(!u?.bounds||!u.pivot)throw Error(`Missing semantic part metadata: ${n}/${m.id}`);return{...m,bounds:u.bounds,pivot:u.pivot,attachmentPivot:u.attachmentPivot,category:u.category,selection:u.selection??(s.selectedPartIds.includes(m.id)?e:"")}}),v=d.find(m=>m.id===0&&!m.fur);if(!v)throw Error(`Missing catalog body: ${n}`);const g="centers"in s.face?s.face:s.face[t];return{body:v,pieces:d,face:g,source:p,selectedPartIds:s.selectedPartIds,signaturePreset:s.signaturePreset,construction:s.construction?.[t],sceneBounds:l.sceneBounds,referenceBounds:l.referenceBounds,aggregateBounds:l.aggregateBounds,furMaskIndices:l.furMaskIndices}})().then(a=>Sx(n,a)).catch(a=>{throw kr.delete(n),a}),kr.set(n,r)),r}const Ex={scale:1,origin:[0,0,0],translate:[0,0,0]};async function Rx(i,e){const[t,n,r,a,s]=await Promise.all([bi("body",i.shape,e),bi("eyes",i.eyes==="none"?"oval":i.eyes,e),i.eyewear==="none"?null:bi("eyewear",i.eyewear,e),i.accessory==="none"?null:bi("accessory",i.accessory,e),i.eyes==="cyclops"?bi("eyes","todd",e):null]),o={...t,face:jg(t,i.shape,i.eyes==="cyclops")};if(i.eyeSpacing!==void 0&&i.eyeSpacing!==1){if(!Number.isFinite(i.eyeSpacing)||i.eyeSpacing<.5||i.eyeSpacing>1.5)throw Error("Invalid avatar eye spacing");const x=(o.face.centers[0][0]+o.face.centers[1][0])/2;o.face={...o.face,centers:o.face.centers.map(([S,R,_])=>{const E=x+(S-x)*i.eyeSpacing,L=so(o,E,R);return[E,R,Number.isFinite(L)?L-o.face.radius*.3:_]})}}const c=[],l=[],h=(x,S)=>{for(const R of x.pieces.filter(_=>_.id===S.part.id)){const _=Gs(R,S);S.attachmentRoot&&(_.attachmentPivot=[...S.attachmentRoot]),c.push({part:_,sourcePart:R,donor:x,transform:Hg(S)})}};for(const x of o.pieces.filter(S=>o.selectedPartIds.includes(S.id)&&!S.fur))h(o,{part:x,...Ex});const p=()=>({body:c[0].part,pieces:[...c.map(x=>x.part),...l],face:o.face});if(i.eyes==="clippo")for(const{donor:x,placement:S}of Yg(o,n,n.construction?.kind==="clippo-face"?n.construction:void 0)){if(x===o&&i.eyeSpacing!==void 0&&i.eyeSpacing!==1){const R=(S.part.bounds.min[0]+S.part.bounds.max[0])/2<0?0:1,_=t.face.centers[R];S.translate=S.translate.map((E,L)=>E+o.face.centers[R][L]-_[L])}h(x,S)}else if(i.eyes==="cyclops"){const x=n.pieces.filter(U=>n.selectedPartIds.includes(U.id)&&!U.fur);if(!x[0]||x.length!==5)throw Error("Missing complete Cyclops donor");const R=U=>[0,1,2].map(D=>(U.bounds.min[D]+U.bounds.max[D])/2);if(n.construction?.kind!=="cyclops")throw Error("Missing Cyclops construction anchors");const _=n.construction.center,E=o.face.radius*2/n.construction.radius,L=[0,1].map(U=>(o.face.centers[0][U]+o.face.centers[1][U])/2).concat(Math.max(...o.face.centers.map(U=>U[2]))+o.face.radius*.5),T=qg(s,o.face);let P=0;for(const[U,D]of x.entries()){const z=U===0?_:R(D),W=U===0?L:[L[0]+(z[0]-_[0])*E,L[1]+(z[1]-_[1])*E,P+.006-(D.bounds.max[2]-z[2])*E];h(n,{part:D,scale:E,origin:z,translate:W.map((I,q)=>I-z[q])});const j=c[c.length-1];j.part.geometry.dispose();const Z=T[U];j.part={...j.part,geometry:Z.geometry,bounds:Z.bounds,pivot:Z.pivot,attachmentPivot:Z.attachmentPivot},P=j.part.bounds.max[2]}}else for(const x of ja(o,n,"eyes",i.eyes==="none"?"oval":i.eyes,{faceLayout:o.face}))i.eyes==="none"?l.push(Gs(x.part,x)):h(n,x);if(a){const x=i.eyes==="cyclops"?o:p(),S=wc(i.shape).tuft,R=ja(x,a,"accessory",i.accessory,{tuftLayout:S});for(const _ of Wg(x,a,R,i.accessory,S))h(a,_)}if(r)for(const x of ja(p(),r,"eyewear",i.eyewear,{singleEye:i.eyes==="cyclops"}))h(r,x);i.accessory==="three_lobe"&&gc(c.filter(x=>x.part.category==="body").map(x=>x.part),c.filter(x=>x.part.category==="accessory").map(x=>x.part));const d=new pe().fromArray(o.body.fields.world),v=new pe().fromArray(o.body.fields.normalMatrix),g=new Map;let m=0;for(const x of c){let S=g.get(x.sourcePart);const R=c.find(U=>U!==x&&U.donor===x.donor&&U.sourcePart.id===x.sourcePart.id&&g.has(U.sourcePart));S===void 0&&(S=R?g.get(R.sourcePart):m++),g.set(x.sourcePart,S),x.part.id=S;const _=new pe().fromArray(x.donor.body.fields.world).invert(),E=new pe().multiplyMatrices(_,new pe().fromArray(x.sourcePart.fields.world)),L=x.transform.clone().invert();x.part.fields.world=d.clone().multiply(x.transform).multiply(E).multiply(L).toArray();const T=x.transform.clone().setPosition(0,0,0),P=new pe().fromArray(x.donor.body.fields.normalMatrix).invert().multiply(new pe().fromArray(x.sourcePart.fields.normalMatrix));x.part.fields.normalMatrix=v.clone().multiply(T).multiply(P).multiply(T.clone().invert()).toArray(),x.part.renderOrder=S,x.part.colorRole=x.part.category==="body"||x.part.attachment==="three_lobe"?"body":void 0}const u=c.filter(x=>x.part.category==="eyes"&&!x.part.fur),f=c.some(x=>x.part.category==="body"&&x.part.fur);if(!n.furMaskIndices||n.furMaskIndices.length!==2)throw Error("Missing catalog eye fur masks");const w=n.furMaskIndices.map(x=>{if(i.eyes==="none"||x===null||!f)return[0,0,0,0];const S=u[x];if(!S)throw Error("Missing catalog eye fur mask surface");return $g(S.part.bounds)});for(const{part:x}of c)x.category==="body"&&(x.fields.furEye0=w[0],x.fields.furEye1=w[1]);for(const x of l)x.geometry.dispose();const C=c.filter(x=>!x.part.fur).map(({part:x})=>({id:x.id,materialKind:x.kind,fields:x.fields,label:x.label,attachment:x.attachment,fur:c.some(S=>S.part.id===x.id&&S.part.fur),universal:x.universal,transparent:x.transparent,depthWrite:x.depthWrite,depthTest:x.depthTest,doubleSided:x.doubleSided,renderOrder:x.renderOrder})),M={...o.source.material,preset:o.signaturePreset,parts:C,crop:[0,0,1,1]};return{source:{preset:o.signaturePreset,material:M,parts:c.map(x=>x.part)},bindings:c,body:o}}const Tx=""+new URL("../assets/material-D_gyKzeF.json",import.meta.url).href,Ax=""+new URL("../assets/motion-CGuxr_IN.bin",import.meta.url).href,Cx=""+new URL("../assets/centering-1LyuTxIa.json",import.meta.url).href,Lx=""+new URL("../assets/material-CokwBZ3w.json",import.meta.url).href,Px=""+new URL("../assets/motion-JsIW2tAn.bin",import.meta.url).href,Dx=""+new URL("../assets/material-C7W4vLmv.json",import.meta.url).href,Ux=""+new URL("../assets/motion-Bf1Yg7JB.bin",import.meta.url).href,Ix=""+new URL("../assets/material-DCK-LemR.json",import.meta.url).href,Nx=""+new URL("../assets/motion-xJsouvZq.bin",import.meta.url).href,Fx=""+new URL("../assets/material-DnWWhE3Y.json",import.meta.url).href,Bx=""+new URL("../assets/motion-DRBQ2rrP.bin",import.meta.url).href,Ox=""+new URL("../assets/material-G2QVFghU.json",import.meta.url).href,zx=""+new URL("../assets/motion-Df2d34-6.bin",import.meta.url).href,kx=new URL("../assets/geometry-ByTZgMIu.bin",import.meta.url).href,Gx=new URL("../assets/geometry-BY_XOqNh.json",import.meta.url).href,Vx=""+new URL("../assets/material-Uwr7c-9L.json",import.meta.url).href,Hx=""+new URL("../assets/motion-DvbVw2wN.bin",import.meta.url).href,Wx=""+new URL("../assets/material-CDZwmjaL.json",import.meta.url).href,Xx=""+new URL("../assets/motion-BnhwfHZb.bin",import.meta.url).href,jx=""+new URL("../assets/material-d7-bi9Ul.json",import.meta.url).href,qx=""+new URL("../assets/motion-DDlHmGyy.bin",import.meta.url).href,Yx=""+new URL("../assets/material-OkhggZwp.json",import.meta.url).href,$x=""+new URL("../assets/motion-CDyHjlna.bin",import.meta.url).href,Kx=""+new URL("../assets/material-gOKsJKnV.json",import.meta.url).href,Zx=""+new URL("../assets/motion-cgWG9Gy2.bin",import.meta.url).href,Jx=""+new URL("../assets/material-B0PKwrWL.json",import.meta.url).href,Qx=""+new URL("../assets/motion-dBMzdJ6s.bin",import.meta.url).href,eb=""+new URL("../assets/material-CtaAe_Y3.json",import.meta.url).href,tb=""+new URL("../assets/motion-GRNG5BYD.bin",import.meta.url).href,nb=""+new URL("../assets/material-0hlMV-_N.json",import.meta.url).href,ib=""+new URL("../assets/motion-DiOaFSMm.bin",import.meta.url).href,rb=""+new URL("../assets/scene-centers-DZ4-6xO8.json",import.meta.url).href,ab=""+new URL("../assets/material-CokwBZ3w.json",import.meta.url).href,sb=""+new URL("../assets/motion-BdedR1Uk.bin",import.meta.url).href,ob=""+new URL("../assets/material-DCZjz9LH.json",import.meta.url).href,lb=""+new URL("../assets/motion--1tcpmc1.bin",import.meta.url).href,cb=""+new URL("../assets/material-CokwBZ3w.json",import.meta.url).href,ub=""+new URL("../assets/motion-D1LBZdQ2.bin",import.meta.url).href,hb=""+new URL("../assets/material-CokwBZ3w.json",import.meta.url).href,db=""+new URL("../assets/motion-BczQS-1F.bin",import.meta.url).href,fb=""+new URL("../assets/material-ChWJDhm1.json",import.meta.url).href,pb=""+new URL("../assets/motion-C4QMmkom.bin",import.meta.url).href,mb=""+new URL("../assets/material-CtaAe_Y3.json",import.meta.url).href,vb=""+new URL("../assets/motion-CHmAhP6z.bin",import.meta.url).href,gb=""+new URL("../assets/material-2QcfdizH.json",import.meta.url).href,_b=""+new URL("../assets/motion-BhVwUNJ-.bin",import.meta.url).href,yb=[0,.016666666666666607,.033333333333333215,.04999999999999982,.06666666666666687,.08333333333333348,.10000000000000009,.1166666666666667,.1333333333333333,.1499999999999999,.16666666666666652,.18333333333333313,.20000000000000018,.21666666666666679,.2333333333333334,.25,.2666666666666666,.2833333333333332,.2999999999999998,.3166666666666669,.3333333333333335,.3500000000000001,.3666666666666667,.3833333333333333,.3999999999999999,.4166666666666665,.4333333333333331,.4500000000000002,.4666666666666668,.4833333333333334,.5,.5166666666666666,.5333333333333332,.5499999999999998,.5666666666666669,.5833333333333335,.6000000000000001,.6166666666666667,.6333333333333333,.6499999999999999,.6666666666666665,.6833333333333331,.7000000000000002,.7166666666666668,.7333333333333334,.75,.7666666666666666,.7833333333333332,.7999999999999998,.8166666666666669,.8333333333333335,.8500000000000001,.8666666666666667,.8833333333333333,.8999999999999999,.9166666666666665,.9333333333333331,.9500000000000002,.9666666666666668,.9833333333333334,1,1.0166666666666666,1.0333333333333332,1.0499999999999998,1.0666666666666664,1.083333333333333,1.0999999999999996,1.1166666666666663,1.1333333333333337,1.1500000000000004,1.166666666666667,1.1833333333333336,1.2000000000000002,1.2166666666666668,1.2333333333333334,1.25,1.2666666666666666,1.2833333333333332,1.2999999999999998,1.3166666666666664,1.333333333333333,1.3499999999999996,1.3666666666666663,1.3833333333333337,1.4000000000000004,1.416666666666667,1.4333333333333336,1.4500000000000002,1.4666666666666668,1.4833333333333334,1.5,1.5166666666666666,1.5333333333333332,1.5499999999999998,1.5666666666666664,1.583333333333333,1.5999999999999996,1.6166666666666663,1.6333333333333337,1.6500000000000004,1.666666666666667,1.6833333333333336,1.7000000000000002,1.7166666666666668,1.7333333333333334,1.75,1.7666666666666666,1.7833333333333332,1.7999999999999998,1.8166666666666664,1.833333333333333,1.8499999999999996,1.8666666666666663,1.8833333333333337,1.9000000000000004,1.916666666666667,1.9333333333333336,1.9500000000000002,1.9666666666666668,1.9833333333333334,2,2.0166666666666666,2.033333333333333,2.05,2.0666666666666664,2.083333333333333,2.0999999999999996,2.1166666666666663,2.1333333333333337,2.1500000000000004,2.166666666666667,2.1833333333333336,2.2,2.216666666666667,2.2333333333333334,2.25,2.2666666666666666,2.283333333333333,2.3,2.3166666666666664,2.333333333333333,2.3499999999999996,2.3666666666666663,2.3833333333333337,2.4000000000000004,2.416666666666667,2.4333333333333336,2.45,2.466666666666667,2.4833333333333334,2.5,2.5166666666666666,2.533333333333333,2.55,2.5666666666666664,2.583333333333333,2.5999999999999996,2.6166666666666663,2.6333333333333337,2.6500000000000004,2.666666666666667,2.6833333333333336,2.7,2.716666666666667,2.7333333333333334,2.75,2.7666666666666666,2.783333333333333,2.8,2.8166666666666664,2.833333333333333,2.8499999999999996,2.8666666666666663,2.8833333333333337,2.9000000000000004,2.916666666666667,2.9333333333333336,2.95,2.966666666666667,2.9833333333333334,3,3.0166666666666666,3.033333333333333,3.05,3.0666666666666664,3.083333333333333,3.0999999999999996,3.1166666666666663,3.1333333333333337,3.1500000000000004,3.166666666666667,3.1833333333333336,3.2,3.216666666666667,3.2333333333333334,3.25,3.2666666666666666,3.283333333333333,3.3,3.3166666666666664,3.333333333333333,3.3499999999999996,3.3666666666666663,3.3833333333333337,3.4000000000000004,3.416666666666667,3.4333333333333336,3.45,3.466666666666667,3.4833333333333334,3.5,3.5166666666666666,3.533333333333333,3.55,3.5666666666666664,3.583333333333333,3.5999999999999996,3.6166666666666663,3.6333333333333337,3.6500000000000004,3.666666666666667,3.6833333333333336,3.7,3.716666666666667,3.7333333333333334,3.75,3.7666666666666666,3.783333333333333,3.8,3.8166666666666664,3.833333333333333,3.8499999999999996,3.8666666666666663,3.8833333333333337,3.9000000000000004,3.916666666666667,3.9333333333333336,3.95,3.966666666666667,3.9833333333333334,4],xb=[0,0,0,0,.024067955636146988,.08940740733169004,.18499015376120762,.29891213295196545,.4187979547977956,.5324311755444021,.6284954078989037,.6973270855104351,.7315957604420602,.7268464751278334,.6825599825330823,.6235264530029571,.5623151153831175,.49999998398666595,.4376849326568846,.376473600374823,.3174399480758036,.261599023639268,.20987655256746268,.16307998587752046,.12186866726017065,.08672392017177909,.05791998363309156,.03549385378348537,.01921581934636218,.008560002432318683,.0026745790756369124,.0003520851752225982,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,.00010204230218963341,.0007891637896754904,.002573908582395479,.005892752125887523,.011109891013675644,.018520829974091706,.028356134328215443,.040784952923360096,.05591887734657262,.07381528871144502,.09448116883161249,.11787694342091957,.14391975948911742,.17248737124425398,.20342182315949997,.23653294621774446,.27160208901842275,.3083857821621195,.34661939729739333,.3860207741409337,.42629380479549395,.4671322822878349,.5082233114088728,.5492511012049542,.5899006053424581,.6298612131812884,.6688303154105836,.7065169444133192,.7426454773498009,.7769592845289329,.8092244458361574,.8392332976869401,.866808052040261,.8918046089065566,.9141159918750905,.9336762510305114,.9504641647019018,.9645061865834608,.9758810977748448,.9847229503989328,.9912252077158947,.9956437733122117,.9983013018568336,.9995904833359054,.9999775876709754,.9999999676397209,.9999999836530549,.9999999836530549,.9999999836530549,.9999999836530549,.9758674735968946,.9098206372077118,.8113854469309784,.6900878932271668,.5554539238545256,.4170096066713087,.2842808383932622,.16679367520225055,.07407407553207825,.015648021169328667,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],bb=[0,0,1,.9996479239419584,.9973254017359326,.9914399528438744,.9807842146933557,.9645062026778317,.9420800474357764,.9132760638967249,.8781314341544582,.8369198555603329,.7901233435056332,.7384006068423573,.6825595743713974,.6235270265074055,.5623149497851931,.5,.4376850502148068,.3764729734925945,.3174386778107533,.2615993931576427,.20987796735775385,.16307839662181767,.12186834736831066,.08672322605227374,.057919187893914446,.035494684885919926,.01921550943646857,.008560811826434696,.0026741613096049584,.0003530592055818311,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,.00010137343526607032,.0007900136679355824,.0025727878743388877,.005893641788227398,.011109130250881774,.018519877932401396,.028356596788909047,.040783581698249735,.05591968427418368,.07381384341649451,.09448004166797754,.1178763314002468,.14391881735653037,.17248864792306806,.2034215282220148,.23653218956133268,.2716004068919953,.30838498135078357,.3466202446245862,.38601955458609927,.4262927734723198,.46713228534175083,.5082234829814976,.5492517591786654,.5899007589025103,.6298611183936855,.6688304651642425,.7065169136333288,.7426460563985864,.7769592164183018,.8092248078274275,.8392330924840337,.8668084146942542,.8918043947132006,.9141157265154455,.9336764299771735,.9504642204208046,.9645061890230048,.9758810968256132,.9847229796099569,.9912251897256276,.9956437824875642,.9983012302889842,.9995905122220533,.9999775659727502,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],Xn={times:yb,body:xb,shadow:bb},wb=[0,0,.030628085136413574],Sb=[-.042096883058547974,.05092686414718628,.12451113387942314],Mb=[.00020810961723327637,-.07642936706542969,756978988647461e-19],Eb=[-5960464477539063e-23,19073486328125e-19,.0003063976764678955],Rb=[0,-29802322387695312e-24,.03611272573471069],Tb=[.00048613548278808594,4366040229797363e-20,1436471939086914e-20],Ab=[-29802322387695312e-24,0,.06110873818397522],Cb=[-4172325134277344e-22,.0001322031021118164,.03524711728096008],Lb=[-8940696716308594e-23,4354119300842285e-20,.021767884492874146],Pb=[43511390686035156e-21,.0001291036605834961,.030456066131591797],Db=[0,0,.033443719148635864],Ub=[17881393432617188e-23,0,.03298333287239075],Ib=[0,29802322387695312e-24,.026502877473831177],Nb=[0,-.01748800277709961,.054837703704833984],Fb=[.01331406831741333,0,.0641242265701294],Bb=[.02013203501701355,-.01225823163986206,.05670878291130066],Ob=[-.0007615089416503906,.042151451110839844,.05370610952377319],zb=[-.006078898906707764,0,.059544503688812256],kb=[0,-.006021618843078613,.05865868926048279],Gb=[.05024704337120056,.028103113174438477,.05215352773666382],Vb=[0,0,.050325602293014526],Hb={circle:wb,clippo:Sb,todd:Mb,rounded_triangle:Eb,capsule:Rb,rounded_head_two_ears:Tb,six_lobed_flower:Ab,heart:Cb,four_lobed_butterfly:Lb,circle_two_ears:Pb,twelve_scalloped_rosette:Db,rounded_cube:Ub,rounded_diamond:Ib,slender:Nb,pocket:Fb,petal:Bb,star:Ob,cloud:zb,shield:kb,pebble:Gb,squircle:Vb},Wb=Object.assign({"./assets/catalog-computer/capsule/material.json":Tx,"./assets/catalog-computer/capsule/motion.bin":Ax,"./assets/catalog-computer/centering.json":Cx,"./assets/catalog-computer/circle/material.json":Lx,"./assets/catalog-computer/circle/motion.bin":Px,"./assets/catalog-computer/circle_two_ears/material.json":Dx,"./assets/catalog-computer/circle_two_ears/motion.bin":Ux,"./assets/catalog-computer/clippo/material.json":Ix,"./assets/catalog-computer/clippo/motion.bin":Nx,"./assets/catalog-computer/cloud/material.json":Fx,"./assets/catalog-computer/cloud/motion.bin":Bx,"./assets/catalog-computer/four_lobed_butterfly/material.json":Ox,"./assets/catalog-computer/four_lobed_butterfly/motion.bin":zx,"./assets/catalog-computer/geometry.bin":kx,"./assets/catalog-computer/geometry.json":Gx,"./assets/catalog-computer/heart/material.json":Vx,"./assets/catalog-computer/heart/motion.bin":Hx,"./assets/catalog-computer/pebble/material.json":Wx,"./assets/catalog-computer/pebble/motion.bin":Xx,"./assets/catalog-computer/petal/material.json":jx,"./assets/catalog-computer/petal/motion.bin":qx,"./assets/catalog-computer/pocket/material.json":Yx,"./assets/catalog-computer/pocket/motion.bin":$x,"./assets/catalog-computer/rounded_cube/material.json":Kx,"./assets/catalog-computer/rounded_cube/motion.bin":Zx,"./assets/catalog-computer/rounded_diamond/material.json":Jx,"./assets/catalog-computer/rounded_diamond/motion.bin":Qx,"./assets/catalog-computer/rounded_head_two_ears/material.json":eb,"./assets/catalog-computer/rounded_head_two_ears/motion.bin":tb,"./assets/catalog-computer/rounded_triangle/material.json":nb,"./assets/catalog-computer/rounded_triangle/motion.bin":ib,"./assets/catalog-computer/scene-centers.json":rb,"./assets/catalog-computer/shield/material.json":ab,"./assets/catalog-computer/shield/motion.bin":sb,"./assets/catalog-computer/six_lobed_flower/material.json":ob,"./assets/catalog-computer/six_lobed_flower/motion.bin":lb,"./assets/catalog-computer/slender/material.json":cb,"./assets/catalog-computer/slender/motion.bin":ub,"./assets/catalog-computer/squircle/material.json":hb,"./assets/catalog-computer/squircle/motion.bin":db,"./assets/catalog-computer/star/material.json":fb,"./assets/catalog-computer/star/motion.bin":pb,"./assets/catalog-computer/todd/material.json":mb,"./assets/catalog-computer/todd/motion.bin":vb,"./assets/catalog-computer/twelve_scalloped_rosette/material.json":gb,"./assets/catalog-computer/twelve_scalloped_rosette/motion.bin":_b}),Pr=i=>{const e=Wb[`./assets/catalog-computer/${i}`];if(!e)throw Error(`Missing catalog Computer asset: ${i}`);return e},qa=new Map;let Ya;function Xb(i){let e=qa.get(i);return e||(e=Promise.all([en(Pr(`${i}/motion.bin`)).then(t=>t.arrayBuffer()).then(io),en(Pr(`${i}/material.json`)).then(t=>t.json())]).then(([t,n])=>{const r=t;if(r.schema!=="bloom.avatar.catalog-computer"||r.version!==1||r.shape!==i)throw Error("Invalid catalog Computer identity");return{document:r,material:n}}).catch(t=>{throw qa.delete(i),t}),qa.set(i,e)),Ya??=Promise.all([en(Pr("geometry.json")).then(t=>t.json()),en(Pr("geometry.bin")).then(t=>t.arrayBuffer())]).then(([t,n])=>({manifest:t,binary:n})).catch(t=>{throw Ya=void 0,t}),Promise.all([e,Ya])}class jb extends Qn{constructor(e,t,n){super(e),this.centerDelta=t,this.contactShadows=n}sample(e,t){super.sample(e,t);const n=Xn.times,r=Math.max(0,Math.min(e,n[n.length-1]));let a=0,s=n.length-1;for(;s-a>1;){const h=a+s>>>1;n[h]<=r?a=h:s=h}const o=(r-n[a])/(n[s]-n[a]),c=Xn.body[a]+(Xn.body[s]-Xn.body[a])*o,l=Xn.shadow[a]+(Xn.shadow[s]-Xn.shadow[a])*o;for(const h of t)h.id==="mesh:0"?(h.world.elements[12]-=this.centerDelta[0]*c,h.world.elements[13]-=this.centerDelta[1]*c):this.contactShadows.has(h.id)&&(h.world.elements[12]-=this.centerDelta[0]*l)}}async function qb(i,e){const[{document:t,material:n},{manifest:r,binary:a}]=await Xb(e),s=structuredClone(n),o=ro(i.source.preset,r,s,a,!0),c=Math.max(...i.source.parts.map(m=>m.id))+1;for(const m of o.parts)m.id+=c,m.activity="computer",m.colorRole=m.fields.referencePose?.[3]===-40?"body":void 0;for(const m of s.parts)m.id+=c;i.source.parts.push(...o.parts),i.source.material.parts.push(...s.parts);const l=i.bindings[0].part,h={...t.clip,parts:t.clip.parts.map(m=>({...m,id:m.id==="mesh:0"?"mesh:0":`mesh:${c+Number(m.id.split(":")[1])}`,fields:m.id==="mesh:0"?{...m.fields,...Object.fromEntries(["paletteBounds","furEye0","furEye1"].filter(u=>l.fields[u]).map(u=>[u,{value:l.fields[u]}]))}:m.fields}))},p=structuredClone(i.body.sceneBounds);for(const{part:m}of i.bindings)for(let u=0;u<3;u++)p.min[u]=Math.min(p.min[u],m.bounds.min[u]),p.max[u]=Math.max(p.max[u],m.bounds.max[u]);const d=Hb[e];if(!d)throw Error(`Missing Computer scene reference: ${e}`);const v=[0,1].map(m=>(p.min[m]+p.max[m])/2-d[m]),g=o.parts.filter(m=>m.fields.referencePose?.[3]===-16).slice(0,2);if(g.length!==2)throw Error("Missing Computer contact shadows");return new jb(h,v,new Set(g.map(m=>`mesh:${m.id}`)))}function Yb(i){return async(e,t,n=!0)=>{if(!e.startsWith("catalog:"))throw Error(`Unknown avatar asset: ${e}`);const r=JSON.parse(e.slice(8));if(!r||["shape","eyes","eyewear","accessory"].some(s=>typeof r[s]!="string"))throw Error("Invalid avatar catalog recipe");const a=await Rx(r,t);try{const s=n?await qb(a,r.shape):void 0,{samplers:o,eyeProfiles:c}=await i(a,t,s);if(!o.idle||!o.reaction||n&&!o.work)throw Error("Incomplete avatar catalog animation");if(r.previewPart==="eyes"){const l=new Set(a.bindings.filter(h=>h.part.category==="eyes").map(h=>h.part));a.source.parts=a.source.parts.filter(h=>l.has(h)?!0:(h.geometry.dispose(),!1))}return{source:a.source,samplers:o,eyeProfiles:c}}catch(s){for(const o of a.source.parts)o.geometry.dispose();throw s}}}const $b=new URL("../assets/catalog-motion-alfred-base-Ctzdi_7K.bin",import.meta.url).href,Kb=new URL("../assets/catalog-motion-blue_beret-base-D8Y-uCtk.bin",import.meta.url).href,Zb=new URL("../assets/catalog-motion-blue_spectacles-base-DDz1XIoI.bin",import.meta.url).href,Jb=new URL("../assets/catalog-motion-clippo-special-low-base-BnkmR-AL.bin",import.meta.url).href,Qb=new URL("../assets/catalog-motion-clippo-special-base-BGfgU8ux.bin",import.meta.url).href,e4=new URL("../assets/catalog-motion-coral_monocle-base-D-2vrHOI.bin",import.meta.url).href,t4=new URL("../assets/catalog-motion-gus-base-Ds3Beaol.bin",import.meta.url).href,n4=new URL("../assets/catalog-motion-lime_frog-base-D6nXfWMf.bin",import.meta.url).href,i4=new URL("../assets/catalog-motion-lime_headphones-base-CMdc-mXT.bin",import.meta.url).href,r4=new URL("../assets/catalog-motion-purple_heart-base-DQ1liTyD.bin",import.meta.url).href,a4=new URL("../assets/catalog-motion-alfred-work-D5qAkCuL.bin",import.meta.url).href,s4=new URL("../assets/catalog-motion-blue_beret-work-uptd_BN1.bin",import.meta.url).href,o4=new URL("../assets/catalog-motion-blue_spectacles-work-CTqSQlG8.bin",import.meta.url).href,l4=new URL("../assets/catalog-motion-clippo-special-low-work-DW-rQa_7.bin",import.meta.url).href,c4=new URL("../assets/catalog-motion-clippo-special-work-CasComgJ.bin",import.meta.url).href,u4=new URL("../assets/catalog-motion-coral_monocle-work-P_IC3vRk.bin",import.meta.url).href,h4=new URL("../assets/catalog-motion-gus-work-BDfVf6WQ.bin",import.meta.url).href,d4=new URL("../assets/catalog-motion-lime_frog-work-C6lB2L7L.bin",import.meta.url).href,f4=new URL("../assets/catalog-motion-lime_headphones-work-eRVCqhkX.bin",import.meta.url).href,p4=new URL("../assets/catalog-motion-purple_heart-work-Duol7J0V.bin",import.meta.url).href;function m4(i){if(!(i.part.category!=="accessory"||i.sourcePart.selection!=="felipe_beret")){i.preserveMaterial=!0,i.part.universal=i.sourcePart.universal,i.preserveFields=[...new Set([...i.preserveFields??[],"colorRoughness","parameters"])];for(const e of["colorRoughness","parameters"])i.part.fields[e]=[...i.sourcePart.fields[e]]}}const v4=["catalogSizeL0","catalogSizeL1","catalogSizeL2","catalogSizeL3"],g4=["catalogSizeQ0","catalogSizeQ1","catalogSizeQ2","catalogSizeQ3"];class _4 extends Qn{constructor(e,t,n,r,a){if(!e.clip.parts.find(l=>l.id==="mesh:0"))throw Error("Catalog observations require an explicit body frame");const o=t.map(l=>({id:l.targetId,translation:{value:[0,0,0]},rotation:{value:[0,0,0,1]},scale:{value:[1,1,1]},fields:Object.fromEntries(Object.entries(l.fields).filter(([,h])=>h.length===4).map(([h,p])=>[h,{value:p}]))}));for(const l of a?.clip.parts??[]){const h=o.find(p=>p.id===l.id);h?h.fields={...h.fields,...l.fields}:o.push(l)}if(a?.clip.parts.some(l=>"camera"in l.fields))for(const l of o)l.fields.camera??={value:[1,1,0,1]};const c=a?.clip??e.clip;super({...c,parts:o}),this.observed=e,this.base=a,this.baseBodyIndex=-1,this.body=new pe,this.normal=new pe,this.sourceInverse=new pe,this.sourceNormalInverse=new pe,this.local=new pe,this.localNormal=new pe,this.linear=new pe,this.sizeDelta=new pe,this.semantic=new O,this.parentTurn=new pe,this.eyeTurn=new pe,this.pivotInParent=new O,this.transformed=new O,this.displacement=new O;for(const l of[n,r])if(!Number.isFinite(l.ground)||!Number.isFinite(l.height)||l.height<=0)throw Error("Invalid catalog retarget dimensions");if(this.centerDelta=r.ground+r.height/2-(n.ground+n.height/2),this.heightRatio=r.height/n.height,this.targetBodyIndex=this.clip.parts.findIndex(l=>l.id==="mesh:0"),this.bodyPigmentTargets=t.filter(l=>l.inheritBodyPigment).map(l=>this.clip.parts.findIndex(h=>h.id===l.targetId)),this.bodyPigmentTargets.length&&(this.targetBodyIndex<0||!this.clip.parts[this.targetBodyIndex].fields.colorRoughness||this.bodyPigmentTargets.some(l=>l<0||!this.clip.parts[l].fields.colorRoughness)))throw Error("Body pigment inheritance requires explicit RGB channels");if(this.sourcePose=e.createPose(),this.sourceBodyIndex=this.sourcePose.findIndex(l=>l.id==="mesh:0"),this.basePose=a?.createPose(),this.basePose){if(this.baseBodyIndex=this.basePose.findIndex(l=>l.id==="mesh:0"),this.baseBodyIndex<0)throw Error("Catalog activity requires its captured body frame");if(a.clip.duration>e.clip.duration+1e-9)throw Error("Catalog activity exceeds observed attachment timeline")}this.mappings=t.map(l=>{const h=this.sourcePose.findIndex(m=>m.id===l.sourceId),p=this.clip.parts.findIndex(m=>m.id===l.targetId);if(h<0||p<0)throw Error("Missing observed catalog motion binding");if(l.sourcePivot.length!==3||l.targetPivot.length!==3||![...l.sourcePivot,...l.targetPivot].every(Number.isFinite))throw Error("Invalid catalog motion pivot");const d=new O().fromArray(l.sourcePivot),g=l.geometryTransform.elements[1]!==0||l.geometryTransform.elements[4]!==0?l.geometryTransform.clone().setPosition(0,0,0):void 0;if(l.attachmentAnchor&&(l.category!=="accessory"||l.attachmentAnchor.length!==3||!l.attachmentAnchor.every(Number.isFinite)))throw Error("Invalid catalog attachment anchor");return{source:h,parent:this.sourcePose.findIndex(m=>m.id===(l.sourceParentId??"mesh:0")),sourceSceneCenter:l.sourceSceneCenter??[0,0],target:p,category:l.category,pivot:d,shift:new O().fromArray(l.targetPivot).sub(d),fit:l.geometryTransform.clone(),sizeDelta:Math.cbrt(l.geometryTransform.determinant())-1,eyeHeightRatio:l.eyeHeightRatio??this.heightRatio,attachmentAnchor:l.attachmentAnchor?new O().fromArray(l.attachmentAnchor):void 0,inverseFit:l.geometryTransform.clone().invert(),normalFit:g,inverseNormalFit:g?.clone().invert(),sceneCenterDelta:l.sceneCenterDelta??[0,0],defaults:Object.entries(l.fields).filter(([,m])=>m.length===4),animated:Object.entries(e.clip.parts[h].fields).filter(([m,u])=>"samples"in u&&l.fields[m]?.length===4&&!l.preserveFields?.includes(m)).map(([m])=>m)}}),this.baseMappings=(this.basePose??[]).map((l,h)=>({source:h,target:this.clip.parts.findIndex(p=>p.id===l.id),fields:Object.keys(l.fields)}))}sample(e,t){if(!Number.isFinite(e)||t.length!==this.clip.parts.length)throw Error("Invalid catalog motion output");this.observed.sample(e,this.sourcePose);const n=this.sourcePose[this.sourceBodyIndex];if(this.sourceInverse.copy(n.world).invert(),this.sourceNormalInverse.copy(n.normalMatrix).invert(),this.base&&this.basePose){this.base.sample(e,this.basePose);const r=this.basePose[this.baseBodyIndex];this.body.copy(r.world),this.normal.copy(r.normalMatrix)}else{this.body.copy(n.world),this.normal.copy(n.normalMatrix);const r=this.body.elements;r[12]-=r[4]*this.centerDelta,r[13]+=(Math.hypot(r[4],r[5],r[6])-r[5])*this.centerDelta,r[14]-=r[6]*this.centerDelta}for(const r of this.mappings){const a=this.sourcePose[r.source],s=t[r.target];if(s.id!==this.clip.parts[r.target].id)throw Error("Catalog pose identity changed");if(r.category==="body")s.world.copy(this.body),s.normalMatrix.copy(this.normal);else{const o=this.sourcePose[r.parent];this.sourceInverse.copy(o.world).invert(),this.sourceNormalInverse.copy(o.normalMatrix).invert();const c=a.fields.catalogCenterWeight?.[0]??0;if(this.local.copy(a.world),this.local.elements[12]+=r.sourceSceneCenter[0]*c,this.local.elements[13]+=r.sourceSceneCenter[1]*c,this.local.premultiply(this.sourceInverse),this.localNormal.copy(this.sourceNormalInverse).multiply(a.normalMatrix),r.category==="eyes"&&this.base&&a.fields.catalogAnchorX){const l=a.fields.catalogAnchorX,h=a.fields.catalogAnchorY,p=a.fields.catalogAnchorZ;if(this.displacement.set(l[0]*r.shift.x+h[0]*r.shift.y+p[0]*r.shift.z,l[1]*r.shift.x+h[1]*r.shift.y+p[1]*r.shift.z,l[2]*r.shift.x+h[2]*r.shift.y+p[2]*r.shift.z),a.fields.catalogSizeL0&&r.sizeDelta!==0){const v=this.sizeDelta.elements,g=r.sizeDelta;for(let m=0;m<4;m++){const u=a.fields[v4[m]],f=a.fields[g4[m]];for(let w=0;w<4;w++)v[m*4+w]=u[w]*g+f[w]*g*g}this.displacement.x+=v[12]-v[0]*r.shift.x-v[4]*r.shift.y-v[8]*r.shift.z,this.displacement.y+=v[13]-v[1]*r.shift.x-v[5]*r.shift.y-v[9]*r.shift.z,this.displacement.z+=v[14]-v[2]*r.shift.x-v[6]*r.shift.y-v[10]*r.shift.z,this.linear.copy(this.local).setPosition(0,0,0).transpose().multiply(this.localNormal),v[12]=v[13]=v[14]=0,this.sizeDelta.premultiply(this.sourceInverse);for(let m=0;m<16;m++)this.local.elements[m]+=v[m];this.localNormal.copy(this.local).setPosition(0,0,0).invert().transpose().multiply(this.linear)}this.displacement.applyMatrix4(this.linear.copy(this.sourceInverse).setPosition(0,0,0));const d=this.local.elements;d[12]+=this.displacement.x,d[13]+=this.displacement.y,d[14]+=this.displacement.z}else if(r.category==="eyes"){this.eyeTurn.makeBasis(this.semantic.set(a.world.elements[0],a.world.elements[1],a.world.elements[2]).normalize(),this.transformed.set(a.world.elements[4],a.world.elements[5],a.world.elements[6]).normalize(),this.displacement.set(a.world.elements[8],a.world.elements[9],a.world.elements[10]).normalize()),this.parentTurn.copy(this.sourceInverse).setPosition(0,0,0),this.linear.copy(this.local).setPosition(0,0,0),this.pivotInParent.copy(r.pivot).applyMatrix4(this.eyeTurn).applyMatrix4(this.parentTurn),this.semantic.copy(r.pivot).applyMatrix4(this.linear).sub(this.pivotInParent).add(this.displacement.setFromMatrixPosition(this.local)),this.transformed.copy(r.shift).applyMatrix4(this.linear),this.displacement.copy(r.shift).applyMatrix4(this.eyeTurn).applyMatrix4(this.parentTurn);const l=this.local.elements;l[12]+=this.semantic.x*(r.eyeHeightRatio-1)+this.displacement.x-this.transformed.x,l[13]+=this.semantic.y*(r.eyeHeightRatio-1)+this.displacement.y-this.transformed.y,l[14]+=this.displacement.z-this.transformed.z}else this.local.premultiply(r.fit).multiply(r.inverseFit),r.normalFit&&this.localNormal.premultiply(r.normalFit).multiply(r.inverseNormalFit);r.attachmentAnchor&&(this.linear.copy(this.local).setPosition(0,0,0),this.transformed.copy(r.attachmentAnchor).applyMatrix4(this.linear),this.displacement.copy(r.attachmentAnchor).sub(this.transformed),this.local.setPosition(this.displacement)),s.world.copy(this.body).multiply(this.local),s.normalMatrix.copy(this.normal).multiply(this.localNormal),s.world.elements[12]+=(r.sceneCenterDelta[0]-r.sourceSceneCenter[0])*(r.attachmentAnchor?0:c),s.world.elements[13]+=(r.sceneCenterDelta[1]-r.sourceSceneCenter[1])*(r.attachmentAnchor?0:c)}for(const[o,c]of r.defaults){const l=s.fields[o];for(let h=0;h<4;h++)l[h]=c[h]}for(const o of r.animated){const c=s.fields[o],l=a.fields[o];for(let h=0;h<4;h++)c[h]=l[h]}}if(this.basePose){for(const a of this.baseMappings){const s=this.basePose[a.source],o=t[a.target];o.world.copy(s.world),o.normalMatrix.copy(s.normalMatrix);for(const c of a.fields)for(let l=0;l<4;l++)o.fields[c][l]=s.fields[c][l]}const r=this.basePose[this.baseBodyIndex].fields.camera;if(r)for(const a of t)for(let s=0;s<4;s++)a.fields.camera[s]=r[s]}if(this.bodyPigmentTargets.length){const r=t[this.targetBodyIndex].fields.colorRoughness;for(const a of this.bodyPigmentTargets){const s=t[a].fields.colorRoughness;for(let o=0;o<3;o++)s[o]=r[o]}}}}const y4=Object.assign({"./assets/catalog-motion/alfred.bin":$b,"./assets/catalog-motion/blue_beret.bin":Kb,"./assets/catalog-motion/blue_spectacles.bin":Zb,"./assets/catalog-motion/clippo-special-low.bin":Jb,"./assets/catalog-motion/clippo-special.bin":Qb,"./assets/catalog-motion/coral_monocle.bin":e4,"./assets/catalog-motion/gus.bin":t4,"./assets/catalog-motion/lime_frog.bin":n4,"./assets/catalog-motion/lime_headphones.bin":i4,"./assets/catalog-motion/purple_heart.bin":r4}),x4=Object.assign({"./assets/catalog-motion/alfred.bin":a4,"./assets/catalog-motion/blue_beret.bin":s4,"./assets/catalog-motion/blue_spectacles.bin":o4,"./assets/catalog-motion/clippo-special-low.bin":l4,"./assets/catalog-motion/clippo-special.bin":c4,"./assets/catalog-motion/coral_monocle.bin":u4,"./assets/catalog-motion/gus.bin":h4,"./assets/catalog-motion/lime_frog.bin":d4,"./assets/catalog-motion/lime_headphones.bin":f4,"./assets/catalog-motion/purple_heart.bin":p4}),$a=new Map;async function Al(i,e){const t=`${i}:${e?"work":"base"}`;let n=$a.get(t);return n||(n=(async()=>{const a=(e?x4:y4)[`./assets/catalog-motion/${i}.bin`];if(!a)throw Error(`Missing semantic catalog motion ${i}`);const s=await fetch(a);if(!s.ok)throw Error(`Catalog motion HTTP ${s.status}`);const o=io(await s.arrayBuffer());if(o.schema!=="bloom.avatar.catalog-motion-library"||o.version!==1||o.preset!==i||!o.materialCalibrated)throw Error("Unvalidated catalog motion library");return o})().catch(r=>{throw $a.delete(t),r}),$a.set(t,n)),n}async function Cl(i,e){const t=await Al(i,!1);if(!e)return t;const n=await Al(i,!0);if(n.rigs.length!==t.rigs.length||n.workNativeStart!==t.workNativeStart)throw Error("Catalog work does not match the base rig");return{...t,rigs:t.rigs.map((r,a)=>{const s=n.rigs[a]?.work;if(!s)throw Error("Missing catalog work rig");return{...r,work:s}})}}function Ll(i,e){return`${i?"fur":"mesh"}:${e}`}async function b4(i,e,t=!0){const n=await Cl(i.body.signaturePreset,t);if(!i.bindings.some(({part:s,sourcePart:o})=>s.category==="eyes"&&!o.selection&&(i.body.body.attachment==="metal"||i.body.body.label==="metal")))return n;const a=await Cl(e==="high"?"clippo-special":"clippo-special-low",t);if(i.body.signaturePreset!=="lime_frog")throw Error("Unobserved asymmetric Clippo signature");return{...n,rigs:[...n.rigs,...a.rigs]}}async function w4(i,e){const t=[],n=structuredClone(i.body.sceneBounds);for(const{part:c}of i.bindings)for(let l=0;l<3;l++)n.min[l]=Math.min(n.min[l],c.bounds.min[l]),n.max[l]=Math.max(n.max[l],c.bounds.max[l]);const r=[0,1].map(c=>(n.min[c]+n.max[c])/2),a=[];for(const c of i.bindings){m4(c);const{part:l,sourcePart:h}=c,p=l.category==="body",d=!h.selection&&l.category==="eyes"&&(i.body.body.attachment==="metal"||i.body.body.label==="metal"),v=d?"clippo-special":h.selection;let g=0,m=e.rigs[0].parts[0];if(!p){let S=!1;for(let R=0;R<e.rigs.length;R++){const _=e.rigs[R].parts.find(E=>E.category===l.category&&E.selection===v&&E.sourcePart===h.id);if(_){g=R,m=_,S=!0;break}}if(!S)throw Error(`Missing catalog observation ${l.category}/${h.selection}/${h.id}`)}const u=Ll(!!l.fur,m.id),f=p?u:`${u}@${g}`;a.push({rig:g,id:u,merged:f});const w=e.rigs[g].idle.parts.find(S=>S.id===u);if(!w)throw Error("Missing catalog material observation");if(!p)for(const[S,R]of Object.entries(w.fields)){if(c.preserveFields?.includes(S))continue;const _="value"in R?R.value:R.samples;l.fields[S]=Array.from(_.slice(0,4))}c.preserveMaterial||(l.universal=e.rigs[g].render[u].universal);const C=i.source.material.parts.find(S=>S.id===l.id);C&&(C.fields=l.fields,C.universal=l.universal);const x=(await bi(p||d?"body":l.category,p?"circle":d?"clippo":v,e.rigs[g].sourceDetail??"high")).pieces.find(S=>S.id===m.sourcePart&&!!S.fur==!!l.fur);if(!x)throw Error("Missing catalog motion source anchor");t.push({sourceId:f,inheritBodyPigment:l.attachment==="three_lobe",sourceParentId:g?`mesh:parent${g}`:"mesh:0",eyeHeightRatio:d?1:void 0,attachmentAnchor:l.category==="accessory"?l.attachmentPivot??void 0:void 0,sourceSceneCenter:e.rigs[g].sceneCenter,targetId:Ll(!!l.fur,l.id),category:l.category,sourcePivot:x.pivot,targetPivot:l.pivot,geometryTransform:c.transform,fields:l.fields,preserveFields:c.preserveFields,sceneCenterDelta:e.rigs[g].sceneCenter.map((S,R)=>S-r[R])})}const s=i.source.parts.find(c=>c.id===0&&!c.fur).fields.colorRoughness;for(const{part:c}of i.bindings)if(c.attachment==="three_lobe"){const l=c.fields.colorRoughness;for(let h=0;h<3;h++)l[h]=s[h]}return{bindings:t,merge:c=>{const l=e.rigs[0][c];if(!l)throw Error(`Missing catalog ${c} observation`);const h=a.map(({rig:p,id:d,merged:v})=>{const g=e.rigs[p][c];if(!g)throw Error(`Missing catalog ${c} rig`);if(g.duration!==l.duration||g.times.length!==l.times.length||!g.times.every((u,f)=>u===l.times[f]))throw Error("Catalog observation clocks differ");const m=g.parts.find(u=>u.id===d);if(!m)throw Error(`Missing catalog channel ${d}`);return{...m,id:v}});for(const p of new Set(a.map(d=>d.rig))){if(p===0)continue;const d=e.rigs[p][c]?.parts.find(v=>v.id==="mesh:0");if(!d)throw Error("Missing catalog rig parent");h.push({...d,id:`mesh:parent${p}`})}if(!h.some(p=>p.id==="mesh:0"))throw Error("Missing catalog parent frame");return new Qn({...l,parts:h})},dimensions:{ground:e.rigs[0].sourceGround,height:e.rigs[0].sourceHeight},destination:{ground:i.body.body.bounds.min[1],height:i.body.body.bounds.max[1]-i.body.body.bounds.min[1]}}}async function S4(i,e,t){const n=await b4(i,e,!!t),r=await w4(i,n),a=(h,p)=>new _4(r.merge(h),r.bindings,r.dimensions,r.destination,p),s=a("idle"),o=a("reaction"),c=t?a("work",t):void 0,l=h=>((h-n.idleNativeStart)%s.clip.duration+s.clip.duration)%s.clip.duration;return{samplers:{idle:s,reaction:o,work:c,reactionReturnTime:l(n.rigs[0].returnNativeTime),workReturn:c?{time:c.clip.duration,idleTime:l(n.workNativeStart+c.clip.duration)}:void 0},eyeProfiles:{}}}const Qr=new Set,Vs=i=>{const e=i.clientWidth;return e<=64?64:e<=128?128:320},Hs=()=>new DOMException("Avatar attachment aborted","AbortError");class M4{constructor(e,t){this.stage=document.createElement("canvas"),this.entries=[],this.limit=1,this.recovering=!1,this.sequence=0,this.onVisibility=()=>{document.hidden&&this.cpuPresenter?.cancelPending()},this.presentations=new Set,this.presentation={webgpuFrames:0,pboFrames:0,directFrames:0,completed:0,maximumPending:0},this.columns=1,this.disposed=!1,this.failed=!1,this.cell=e,this.stage.dataset.avatarRenderer="shared-editor-scene",this.stage.setAttribute("aria-hidden","true"),this.stage.style.cssText=`position:fixed;left:0;top:0;width:${e}px;height:${e}px;opacity:0;pointer-events:none`,document.body.append(this.stage);try{this.engine=new Tg(this.stage,{count:1,size:e,preset:t,lazyWork:!0,resolveAsset:Yb(S4),onFrame:()=>this.paint(),onError:()=>this.fail()})}catch(s){throw this.stage.remove(),s}const n=this.stage.getContext("webgl2"),r=n.getParameter(n.MAX_VIEWPORT_DIMS),a=Math.min(n.getParameter(n.MAX_TEXTURE_SIZE),n.getParameter(n.MAX_RENDERBUFFER_SIZE),r[0],r[1]);this.limit=Math.min(200,Math.max(1,Math.floor(a/512))**2),document.addEventListener("visibilitychange",this.onVisibility),this.observer=new IntersectionObserver(s=>{for(const o of s){const c=this.entries.findIndex(h=>h?.canvas===o.target),l=this.entries[c];l&&(l.visible!==o.isIntersecting&&l.revision++,l.visible=o.isIntersecting,l.ready&&(this.engine.setInstancePaused(c,zn(l.props)||!l.visible),this.engine.setInstanceRendering(c,l.visible&&(!zn(l.props)||l.dirty||!l.painted))))}})}initializePresenter(e=!1){return this.presenterReady?this.presenterReady:!e&&this.entries.filter(Boolean).length<2?Promise.resolve():(this.presenterReady=Og(()=>this.fail(),t=>{if(!(this.disposed||this.failed)){this.recovering=t;for(const[n,r]of this.entries.entries())r?.target&&(r.revision++,r.dirty=!0,!t&&r.ready&&r.visible&&this.engine.setInstanceRendering(n,!0));this.updateCapacity()}}).then(t=>{if(!t)return;if(this.disposed||this.failed){t.dispose();return}const n=Math.min(this.limit,Math.max(1,Math.floor(t.maxTextureDimension2D/512))**2);if(this.entries.length>n){t.dispose();return}this.limit=n,this.presenter=t}),this.presenterReady)}get capacity(){return this.limit}updateCapacity(){this.engine.setPresentationCapacity(!this.recovering&&this.presentations.size<2)}fail(){if(!(this.disposed||this.failed)){this.failed=!0;for(const e of[...this.entries])try{e?.onRenderError?.()}catch(t){queueMicrotask(()=>{throw t})}}}get available(){return!this.disposed&&!this.failed&&(this.entries.length<this.capacity||this.entries.some(e=>!e))}layout(){if(this.disposed)return;const e=Math.max(1,this.entries.length);this.columns=Math.ceil(Math.sqrt(e)),this.stage.style.width=`${this.columns*this.cell}px`,this.stage.style.height=`${Math.ceil(e/this.columns)*this.cell}px`,this.engine.setCount(e),this.entries.forEach((t,n)=>{t&&(t.dirty=!0,t.revision++,t.ready&&t.visible&&this.engine.setInstanceRendering(n,!0))})}resolution(){return this.disposed?Promise.resolve():(this.resizing||(this.resizing=(async()=>{for(;!this.disposed;){const e=Math.max(64,...this.entries.filter(t=>!!t).map(t=>t.size));if(e===this.cell)return;this.cell=e,this.layout(),await this.engine.setSize(e)}})().finally(()=>{this.resizing=void 0})),this.resizing)}release(e,t){if(this.entries[e]===t){for(this.observer.unobserve(t.canvas),t.target&&this.presenter?.release(t.target),this.engine.setInstancePaused(e,!0),this.engine.setInstanceRendering(e,!1),this.entries[e]=void 0;this.entries.length&&!this.entries[this.entries.length-1];)this.entries.pop();this.entries.length?this.layout():(this.disposed=!0,this.observer.disconnect(),document.removeEventListener("visibilitychange",this.onVisibility),this.engine.dispose(),this.cpuPresenter?.dispose(),this.presenter?.dispose(),this.stage.remove(),Qr.delete(this))}}paint(){if(this.disposed||this.failed||this.recovering)return;const e=this.stage.width,t=this.stage.height,n=++this.sequence,r=e/this.columns,a=Math.min(devicePixelRatio||1,2),s=this.entries.flatMap((g,m)=>{if(!g?.ready||!g.visible||zn(g.props)&&g.painted&&!g.dirty)return[];const u=Math.max(1,Math.round(g.width*a)),f=Math.max(1,Math.round(g.height*a));g.context&&(g.canvas.width!==u&&(g.canvas.width=u),g.canvas.height!==f&&(g.canvas.height=f));const w=g.revision;return[{entry:g,index:m,width:u,height:f,isCurrent:()=>!this.disposed&&!this.failed&&this.entries[m]===g&&g.revision===w&&n>=g.delivered&&this.stage.width===e&&this.stage.height===t&&g.ready&&g.visible&&g.canvas.width===u&&g.canvas.height===f,sourceX:m%this.columns*r,sourceY:Math.floor(m/this.columns)*r}]}),o=g=>{if(!g.isCurrent())return;const{entry:m,index:u}=g;if(m.delivered=n,m.dirty=!1,zn(m.props)&&this.engine.setInstanceRendering(u,!1),!m.painted){m.painted=!0;try{m.onReady?.()}catch(f){queueMicrotask(()=>{throw f})}}},c=s.filter(g=>g.entry.context&&g.width*g.height<=kg),l=c.length>=zg?c:[],h=s.filter(g=>g.entry.target),p=new Set([...l,...h]),d=[];try{l.length&&(this.cpuPresenter??=Gg(),this.presentation.pboFrames++,d.push(this.cpuPresenter.present(this.stage,l.map(m=>({context:m.entry.context,sourceX:m.sourceX,sourceY:m.sourceY,sourceWidth:r,sourceHeight:r,destinationWidth:m.width,destinationHeight:m.height,isCurrent:m.isCurrent,onPresented:()=>{m.entry.delivered=n}}))).then(m=>(m&&l.forEach(o),m)))),h.length&&this.presenter&&(this.presentation.webgpuFrames++,d.push(this.presenter.present(this.stage,h.map(m=>({target:m.entry.target,sourceX:m.sourceX,sourceY:m.sourceY,sourceWidth:r,sourceHeight:r,destinationWidth:m.width,destinationHeight:m.height}))).then(m=>(m&&h.forEach(o),m))));let g=!1;for(const m of s){if(p.has(m)||!m.entry.context)continue;const u=m.entry.context;u.clearRect(0,0,m.width,m.height),u.drawImage(this.stage,m.sourceX,m.sourceY,r,r,0,0,m.width,m.height),o(m),g=!0}g&&this.presentation.directFrames++}catch{Promise.all(d).catch(()=>{}),this.fail();return}if(!d.length)return;let v;v=Promise.all(d).then(g=>{g.some(Boolean)&&this.presentation.completed++}).catch(()=>this.fail()).finally(()=>{this.presentations.delete(v),!this.disposed&&!this.failed&&this.updateCapacity()}),this.presentations.add(v),this.presentation.maximumPending=Math.max(this.presentation.maximumPending,this.presentations.size),this.updateCapacity()}async attach(e,t,n,r,a,s){if(s?.aborted)throw Hs();let o=this.entries.findIndex(f=>!f);if(o<0&&(o=this.entries.length),!this.available||o>=this.capacity)throw Error("Editor scene capacity exceeded");const c={canvas:e,revision:0,delivered:0,props:t,ready:!1,visible:!0,dirty:!0,painted:!1,size:Vs(e),width:e.clientWidth,height:e.clientHeight,onReady:r};this.entries[o]=c;let l=!1,h=()=>{},p,d;const v=new Promise((f,w)=>{d=w});v.catch(()=>{});const g=()=>{l||(l=!0,s?.removeEventListener("abort",m),h(),p?.disconnect(),this.release(o,c),d?.(Hs()))},m=()=>g();c.onRenderError=()=>{l||(g(),a?.())},s?.addEventListener("abort",m,{once:!0});const u=f=>Promise.race([f,v]);try{if(await u(this.engine.loaded),await u(this.initializePresenter()),this.failed)throw Error("Avatar presentation unavailable");if(c.target=this.presenter?.attach(e)??void 0,!c.target&&(c.context=e.getContext("2d")??void 0,!c.context&&(await u(this.initializePresenter(!0)),c.target=this.presenter?.attach(e)??void 0,!c.target)))throw Error("Editor canvas unavailable");this.layout(),await u(this.resolution()),await u(this.engine.setPreset(o,n.preset)),this.engine.resetAppearance(o),this.engine.idle(o);let f=!1,w=!1;const C={enabled:!!t.interactive&&!zn(t),onTap:()=>this.engine.react(o)},M=(R,_)=>{const E=e.getBoundingClientRect();return[o%this.columns*this.cell+R*this.cell/Math.max(1,E.width),Math.floor(o/this.columns)*this.cell+_*this.cell/Math.max(1,E.height)]};h=Vg(e,{hitTest:(R,_)=>this.engine.hitTest(...M(R,_)),beginPointer:(R,_)=>{const E=this.engine.beginPointer(...M(R,_));return f=E===o,E},point:(R,_)=>{R===-1&&_===-1?(w&&this.engine.point(-1,-1),w=!1):(w=!0,this.engine.point(...M(R,_)))},endPointer:(R,_)=>{f&&(f=!1,R===void 0||_===void 0?this.engine.endPointer():this.engine.endPointer(...M(R,_)))}},C);const{update:x,setPresentation:S}=Lc(this.engine,o,c,n,{isDisposed:()=>l,wait:u,dispose:g,onPresentation:R=>{c.revision++,C.enabled=!!R.interactive&&!zn(R)}});return await x(t,n),this.observer.observe(e),p=new ResizeObserver(([R])=>{l||(c.width=R?.contentRect.width??e.clientWidth,c.height=R?.contentRect.height??e.clientHeight,c.size=Vs(e),c.dirty=!0,c.revision++,this.resolution().then(()=>{l||(this.engine.setInstancePaused(o,zn(c.props)||!c.visible),this.engine.setInstanceRendering(o,c.visible))}).catch(()=>{l||(g(),a?.())}))}),p.observe(e),{update:x,setPresentation:S,dispose:g}}catch(f){throw g(),f}}}async function R4(i,e,t,n,r,a){if(a?.aborted)throw Hs();const s=Vs(i);let o=[...Qr].find(c=>c.cell===s&&c.available);return o||(o=new M4(s,t.preset),Qr.add(o)),o.attach(i,e,t,n,r,a)}function T4(){return[...Qr].map(i=>({cell:i.cell,capacity:i.capacity,avatars:i.entries.filter(Boolean).length,pending:i.entries.filter(e=>e&&!e.ready).length,activeIndices:i.entries.flatMap((e,t)=>e?[t]:[]),presentation:{...i.presentation,webgpuTargets:i.entries.filter(e=>e?.target).length,canvas2dTargets:i.entries.filter(e=>e?.context).length},stats:i.engine.stats()}))}export{R4 as attachEditorAvatar,T4 as editorPoolDiagnostics};
