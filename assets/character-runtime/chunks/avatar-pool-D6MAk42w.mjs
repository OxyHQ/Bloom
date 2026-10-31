const Ot="srgb",xi="srgb-linear",aa="linear",Je="srgb";const ti="300 es";function io(i){for(let e=i.length-1;e>=0;--e)if(i[e]>=65535)return!0;return!1}function ra(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function ao(){const i=ra("canvas");return i.style.display="block",i}const Sr={};function sa(...i){const e="THREE."+i.shift();console.log(e,...i)}function Rs(i){const e=i[0];if(typeof e=="string"&&e.startsWith("TSL:")){const t=i[1];t&&t.isStackTrace?i[0]+=" "+t.getLocation():i[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return i}function Ce(...i){i=Rs(i);const e="THREE."+i.shift();{const t=i[0];t&&t.isStackTrace?console.warn(t.getError(e)):console.warn(e,...i)}}function Xe(...i){i=Rs(i);const e="THREE."+i.shift();{const t=i[0];t&&t.isStackTrace?console.error(t.getError(e)):console.error(e,...i)}}function ni(...i){const e=i.join(" ");e in Sr||(Sr[e]=!0,Ce(...i))}function ro(i,e,t){return new Promise(function(n,a){function r(){switch(i.clientWaitSync(e,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:a();break;case i.TIMEOUT_EXPIRED:setTimeout(r,t);break;default:n()}}setTimeout(r,t)})}const so={0:1,2:6,4:7,3:5,1:0,6:2,7:4,5:3};class Dn{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});const n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){const n=this._listeners;return n===void 0?!1:n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){const n=this._listeners;if(n===void 0)return;const a=n[e];if(a!==void 0){const r=a.indexOf(t);r!==-1&&a.splice(r,1)}}dispatchEvent(e){const t=this._listeners;if(t===void 0)return;const n=t[e.type];if(n!==void 0){e.target=this;const a=n.slice(0);for(let r=0,s=a.length;r<s;r++)a[r].call(this,e);e.target=null}}}const wt=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];let wr=1234567;const vi=Math.PI/180,bi=180/Math.PI;function cn(){const i=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(wt[i&255]+wt[i>>8&255]+wt[i>>16&255]+wt[i>>24&255]+"-"+wt[e&255]+wt[e>>8&255]+"-"+wt[e>>16&15|64]+wt[e>>24&255]+"-"+wt[t&63|128]+wt[t>>8&255]+"-"+wt[t>>16&255]+wt[t>>24&255]+wt[n&255]+wt[n>>8&255]+wt[n>>16&255]+wt[n>>24&255]).toLowerCase()}function ze(i,e,t){return Math.max(e,Math.min(t,i))}function ir(i,e){return(i%e+e)%e}function oo(i,e,t,n,a){return n+(i-e)*(a-n)/(t-e)}function lo(i,e,t){return i!==e?(t-i)/(e-i):0}function gi(i,e,t){return(1-t)*i+t*e}function co(i,e,t,n){return gi(i,e,1-Math.exp(-t*n))}function uo(i,e=1){return e-Math.abs(ir(i,e*2)-e)}function ho(i,e,t){return i<=e?0:i>=t?1:(i=(i-e)/(t-e),i*i*(3-2*i))}function fo(i,e,t){return i<=e?0:i>=t?1:(i=(i-e)/(t-e),i*i*i*(i*(i*6-15)+10))}function po(i,e){return i+Math.floor(Math.random()*(e-i+1))}function mo(i,e){return i+Math.random()*(e-i)}function vo(i){return i*(.5-Math.random())}function go(i){i!==void 0&&(wr=i);let e=wr+=1831565813;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}function _o(i){return i*vi}function yo(i){return i*bi}function xo(i){return i>0&&Number.isInteger(i)&&2**Math.round(Math.log2(i))===i}function bo(i){return Math.pow(2,Math.ceil(Math.log(i)/Math.LN2))}function So(i){return Math.pow(2,Math.floor(Math.log(i)/Math.LN2))}function wo(i,e,t,n,a){const r=Math.cos,s=Math.sin,o=r(t/2),c=s(t/2),l=r((e+n)/2),h=s((e+n)/2),d=r((e-n)/2),u=s((e-n)/2),f=r((n-e)/2),v=s((n-e)/2);switch(a){case"XYX":i.set(o*h,c*d,c*u,o*l);break;case"YZY":i.set(c*u,o*h,c*d,o*l);break;case"ZXZ":i.set(c*d,c*u,o*h,o*l);break;case"XZX":i.set(o*h,c*v,c*f,o*l);break;case"YXY":i.set(c*f,o*h,c*v,o*l);break;case"ZYZ":i.set(c*v,c*f,o*h,o*l);break;default:Ce("MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+a)}}function Wt(i,e){switch(e.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:case Uint8ClampedArray:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("THREE.MathUtils: Invalid component type.")}}function Qe(i,e){switch(e.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:case Uint8ClampedArray:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("THREE.MathUtils: Invalid component type.")}}const Nn={DEG2RAD:vi,RAD2DEG:bi,generateUUID:cn,clamp:ze,euclideanModulo:ir,mapLinear:oo,inverseLerp:lo,lerp:gi,damp:co,pingpong:uo,smoothstep:ho,smootherstep:fo,randInt:po,randFloat:mo,randFloatSpread:vo,seededRandom:go,degToRad:_o,radToDeg:yo,isPowerOfTwo:xo,ceilPowerOfTwo:bo,floorPowerOfTwo:So,setQuaternionFromProperEuler:wo,normalize:Qe,denormalize:Wt};class Ge{static{Ge.prototype.isVector2=!0}constructor(e=0,t=0){this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("THREE.Vector2: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){const t=this.x,n=this.y,a=e.elements;return this.x=a[0]*t+a[3]*n+a[6],this.y=a[1]*t+a[4]*n+a[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=ze(this.x,e.x,t.x),this.y=ze(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=ze(this.x,e,t),this.y=ze(this.y,e,t),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(ze(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const n=this.dot(e)/t;return Math.acos(ze(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){const n=Math.cos(t),a=Math.sin(t),r=this.x-e.x,s=this.y-e.y;return this.x=r*n-s*a+e.x,this.y=r*a+s*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class bn{constructor(e=0,t=0,n=0,a=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=a}static slerpFlat(e,t,n,a,r,s,o){let c=n[a+0],l=n[a+1],h=n[a+2],d=n[a+3],u=r[s+0],f=r[s+1],v=r[s+2],g=r[s+3];if(d!==g||c!==u||l!==f||h!==v){let p=c*u+l*f+h*v+d*g;p<0&&(u=-u,f=-f,v=-v,g=-g,p=-p);let m=1-o;if(p<.9995){const M=Math.acos(p),A=Math.sin(M);m=Math.sin(m*M)/A,o=Math.sin(o*M)/A,c=c*m+u*o,l=l*m+f*o,h=h*m+v*o,d=d*m+g*o}else{c=c*m+u*o,l=l*m+f*o,h=h*m+v*o,d=d*m+g*o;const M=1/Math.sqrt(c*c+l*l+h*h+d*d);c*=M,l*=M,h*=M,d*=M}}e[t]=c,e[t+1]=l,e[t+2]=h,e[t+3]=d}static multiplyQuaternionsFlat(e,t,n,a,r,s){const o=n[a],c=n[a+1],l=n[a+2],h=n[a+3],d=r[s],u=r[s+1],f=r[s+2],v=r[s+3];return e[t]=o*v+h*d+c*f-l*u,e[t+1]=c*v+h*u+l*d-o*f,e[t+2]=l*v+h*f+o*u-c*d,e[t+3]=h*v-o*d-c*u-l*f,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,a){return this._x=e,this._y=t,this._z=n,this._w=a,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){const n=e._x,a=e._y,r=e._z,s=e._order,o=Math.cos,c=Math.sin,l=o(n/2),h=o(a/2),d=o(r/2),u=c(n/2),f=c(a/2),v=c(r/2);switch(s){case"XYZ":this._x=u*h*d+l*f*v,this._y=l*f*d-u*h*v,this._z=l*h*v+u*f*d,this._w=l*h*d-u*f*v;break;case"YXZ":this._x=u*h*d+l*f*v,this._y=l*f*d-u*h*v,this._z=l*h*v-u*f*d,this._w=l*h*d+u*f*v;break;case"ZXY":this._x=u*h*d-l*f*v,this._y=l*f*d+u*h*v,this._z=l*h*v+u*f*d,this._w=l*h*d-u*f*v;break;case"ZYX":this._x=u*h*d-l*f*v,this._y=l*f*d+u*h*v,this._z=l*h*v-u*f*d,this._w=l*h*d+u*f*v;break;case"YZX":this._x=u*h*d+l*f*v,this._y=l*f*d+u*h*v,this._z=l*h*v-u*f*d,this._w=l*h*d-u*f*v;break;case"XZY":this._x=u*h*d-l*f*v,this._y=l*f*d-u*h*v,this._z=l*h*v+u*f*d,this._w=l*h*d+u*f*v;break;default:Ce("Quaternion: .setFromEuler() encountered an unknown order: "+s)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){const n=t/2,a=Math.sin(n);return this._x=e.x*a,this._y=e.y*a,this._z=e.z*a,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){const t=e.elements,n=t[0],a=t[4],r=t[8],s=t[1],o=t[5],c=t[9],l=t[2],h=t[6],d=t[10],u=n+o+d;if(u>0){const f=.5/Math.sqrt(u+1);this._w=.25/f,this._x=(h-c)*f,this._y=(r-l)*f,this._z=(s-a)*f}else if(n>o&&n>d){const f=2*Math.sqrt(1+n-o-d);this._w=(h-c)/f,this._x=.25*f,this._y=(a+s)/f,this._z=(r+l)/f}else if(o>d){const f=2*Math.sqrt(1+o-n-d);this._w=(r-l)/f,this._x=(a+s)/f,this._y=.25*f,this._z=(c+h)/f}else{const f=2*Math.sqrt(1+d-n-o);this._w=(s-a)/f,this._x=(r+l)/f,this._y=(c+h)/f,this._z=.25*f}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<1e-8?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(ze(this.dot(e),-1,1)))}rotateTowards(e,t){const n=this.angleTo(e);if(n===0)return this;const a=Math.min(1,t/n);return this.slerp(e,a),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){const n=e._x,a=e._y,r=e._z,s=e._w,o=t._x,c=t._y,l=t._z,h=t._w;return this._x=n*h+s*o+a*l-r*c,this._y=a*h+s*c+r*o-n*l,this._z=r*h+s*l+n*c-a*o,this._w=s*h-n*o-a*c-r*l,this._onChangeCallback(),this}slerp(e,t){let n=e._x,a=e._y,r=e._z,s=e._w,o=this.dot(e);o<0&&(n=-n,a=-a,r=-r,s=-s,o=-o);let c=1-t;if(o<.9995){const l=Math.acos(o),h=Math.sin(l);c=Math.sin(c*l)/h,t=Math.sin(t*l)/h,this._x=this._x*c+n*t,this._y=this._y*c+a*t,this._z=this._z*c+r*t,this._w=this._w*c+s*t,this._onChangeCallback()}else this._x=this._x*c+n*t,this._y=this._y*c+a*t,this._z=this._z*c+r*t,this._w=this._w*c+s*t,this.normalize();return this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){const e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),n=Math.random(),a=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(a*Math.sin(e),a*Math.cos(e),r*Math.sin(t),r*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class O{static{O.prototype.isVector3=!0}constructor(e=0,t=0,n=0){this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("THREE.Vector3: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(Mr.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(Mr.setFromAxisAngle(e,t))}applyMatrix3(e){const t=this.x,n=this.y,a=this.z,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6]*a,this.y=r[1]*t+r[4]*n+r[7]*a,this.z=r[2]*t+r[5]*n+r[8]*a,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){const t=this.x,n=this.y,a=this.z,r=e.elements,s=1/(r[3]*t+r[7]*n+r[11]*a+r[15]);return this.x=(r[0]*t+r[4]*n+r[8]*a+r[12])*s,this.y=(r[1]*t+r[5]*n+r[9]*a+r[13])*s,this.z=(r[2]*t+r[6]*n+r[10]*a+r[14])*s,this}applyQuaternion(e){const t=this.x,n=this.y,a=this.z,r=e.x,s=e.y,o=e.z,c=e.w,l=2*(s*a-o*n),h=2*(o*t-r*a),d=2*(r*n-s*t);return this.x=t+c*l+s*d-o*h,this.y=n+c*h+o*l-r*d,this.z=a+c*d+r*h-s*l,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){const t=this.x,n=this.y,a=this.z,r=e.elements;return this.x=r[0]*t+r[4]*n+r[8]*a,this.y=r[1]*t+r[5]*n+r[9]*a,this.z=r[2]*t+r[6]*n+r[10]*a,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=ze(this.x,e.x,t.x),this.y=ze(this.y,e.y,t.y),this.z=ze(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=ze(this.x,e,t),this.y=ze(this.y,e,t),this.z=ze(this.z,e,t),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(ze(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){const n=e.x,a=e.y,r=e.z,s=t.x,o=t.y,c=t.z;return this.x=a*c-r*o,this.y=r*s-n*c,this.z=n*o-a*s,this}projectOnVector(e){const t=e.lengthSq();if(t===0)return this.set(0,0,0);const n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return ma.copy(this).projectOnVector(e),this.sub(ma)}reflect(e){return this.sub(ma.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const n=this.dot(e)/t;return Math.acos(ze(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,n=this.y-e.y,a=this.z-e.z;return t*t+n*n+a*a}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){const a=Math.sin(t)*e;return this.x=a*Math.sin(n),this.y=Math.cos(t)*e,this.z=a*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){const t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),a=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=a,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const e=Math.random()*Math.PI*2,t=Math.random()*2-1,n=Math.sqrt(1-t*t);return this.x=n*Math.cos(e),this.y=t,this.z=n*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const ma=new O,Mr=new bn;class Pe{static{Pe.prototype.isMatrix3=!0}constructor(e,t,n,a,r,s,o,c,l){this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,a,r,s,o,c,l)}set(e,t,n,a,r,s,o,c,l){const h=this.elements;return h[0]=e,h[1]=a,h[2]=o,h[3]=t,h[4]=r,h[5]=c,h[6]=n,h[7]=s,h[8]=l,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){const t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){const t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const n=e.elements,a=t.elements,r=this.elements,s=n[0],o=n[3],c=n[6],l=n[1],h=n[4],d=n[7],u=n[2],f=n[5],v=n[8],g=a[0],p=a[3],m=a[6],M=a[1],A=a[4],w=a[7],x=a[2],S=a[5],E=a[8];return r[0]=s*g+o*M+c*x,r[3]=s*p+o*A+c*S,r[6]=s*m+o*w+c*E,r[1]=l*g+h*M+d*x,r[4]=l*p+h*A+d*S,r[7]=l*m+h*w+d*E,r[2]=u*g+f*M+v*x,r[5]=u*p+f*A+v*S,r[8]=u*m+f*w+v*E,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){const e=this.elements,t=e[0],n=e[1],a=e[2],r=e[3],s=e[4],o=e[5],c=e[6],l=e[7],h=e[8];return t*s*h-t*o*l-n*r*h+n*o*c+a*r*l-a*s*c}invert(){const e=this.elements,t=e[0],n=e[1],a=e[2],r=e[3],s=e[4],o=e[5],c=e[6],l=e[7],h=e[8],d=h*s-o*l,u=o*c-h*r,f=l*r-s*c,v=t*d+n*u+a*f;if(v===0)return this.set(0,0,0,0,0,0,0,0,0);const g=1/v;return e[0]=d*g,e[1]=(a*l-h*n)*g,e[2]=(o*n-a*s)*g,e[3]=u*g,e[4]=(h*t-a*c)*g,e[5]=(a*r-o*t)*g,e[6]=f*g,e[7]=(n*c-l*t)*g,e[8]=(s*t-n*r)*g,this}transpose(){let e;const t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){const t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,a,r,s,o){const c=Math.cos(r),l=Math.sin(r);return this.set(n*c,n*l,-n*(c*s+l*o)+s+e,-a*l,a*c,-a*(-l*s+c*o)+o+t,0,0,1),this}scale(e,t){return ni("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(va.makeScale(e,t)),this}rotate(e){return ni("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(va.makeRotation(-e)),this}translate(e,t){return ni("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(va.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){const t=this.elements,n=e.elements;for(let a=0;a<9;a++)if(t[a]!==n[a])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){const n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}}const va=new Pe,Er=new Pe().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Rr=new Pe().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function Mo(){const i={enabled:!0,workingColorSpace:xi,spaces:{},convert:function(a,r,s){return this.enabled===!1||r===s||!r||!s||(this.spaces[r].transfer===Je&&(a.r=un(a.r),a.g=un(a.g),a.b=un(a.b)),this.spaces[r].primaries!==this.spaces[s].primaries&&(a.applyMatrix3(this.spaces[r].toXYZ),a.applyMatrix3(this.spaces[s].fromXYZ)),this.spaces[s].transfer===Je&&(a.r=ii(a.r),a.g=ii(a.g),a.b=ii(a.b))),a},workingToColorSpace:function(a,r){return this.convert(a,this.workingColorSpace,r)},colorSpaceToWorking:function(a,r){return this.convert(a,r,this.workingColorSpace)},getPrimaries:function(a){return this.spaces[a].primaries},getTransfer:function(a){return a===""?aa:this.spaces[a].transfer},getToneMappingMode:function(a){return this.spaces[a].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(a,r=this.workingColorSpace){return a.fromArray(this.spaces[r].luminanceCoefficients)},define:function(a){Object.assign(this.spaces,a)},_getMatrix:function(a,r,s){return a.copy(this.spaces[r].toXYZ).multiply(this.spaces[s].fromXYZ)},_getDrawingBufferColorSpace:function(a){return this.spaces[a].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(a=this.workingColorSpace){return this.spaces[a].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(a,r){return ni("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),i.workingToColorSpace(a,r)},toWorkingColorSpace:function(a,r){return ni("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),i.colorSpaceToWorking(a,r)}},e=[.64,.33,.3,.6,.15,.06],t=[.2126,.7152,.0722],n=[.3127,.329];return i.define({[xi]:{primaries:e,whitePoint:n,transfer:aa,toXYZ:Er,fromXYZ:Rr,luminanceCoefficients:t,workingColorSpaceConfig:{unpackColorSpace:Ot},outputColorSpaceConfig:{drawingBufferColorSpace:Ot}},[Ot]:{primaries:e,whitePoint:n,transfer:Je,toXYZ:Er,fromXYZ:Rr,luminanceCoefficients:t,outputColorSpaceConfig:{drawingBufferColorSpace:Ot}}}),i}const ke=Mo();function un(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function ii(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}let Bn;class Eo{static getDataURL(e,t="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let n;if(e instanceof HTMLCanvasElement)n=e;else{Bn===void 0&&(Bn=ra("canvas")),Bn.width=e.width,Bn.height=e.height;const a=Bn.getContext("2d");e instanceof ImageData?a.putImageData(e,0,0):a.drawImage(e,0,0,e.width,e.height),n=Bn}return n.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){const t=ra("canvas");t.width=e.width,t.height=e.height;const n=t.getContext("2d");n.drawImage(e,0,0,e.width,e.height);const a=n.getImageData(0,0,e.width,e.height),r=a.data;for(let s=0;s<r.length;s++)r[s]=un(r[s]/255)*255;return n.putImageData(a,0,0),t}else if(e.data){const t=e.data.slice(0);for(let n=0;n<t.length;n++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[n]=Math.floor(un(t[n]/255)*255):t[n]=un(t[n]);return{data:t,width:e.width,height:e.height}}else return Ce("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}}let Ro=0;class ar{constructor(e=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:Ro++}),this.uuid=cn(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){const t=this.data;return typeof HTMLVideoElement<"u"&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):typeof VideoFrame<"u"&&t instanceof VideoFrame?e.set(t.displayWidth,t.displayHeight,0):t!==null?e.set(t.width,t.height,t.depth||0):e.set(0,0,0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];const n={uuid:this.uuid,url:""},a=this.data;if(a!==null){let r;if(Array.isArray(a)){r=[];for(let s=0,o=a.length;s<o;s++)a[s].isDataTexture?r.push(ga(a[s].image)):r.push(ga(a[s]))}else r=ga(a);n.url=r}return t||(e.images[this.uuid]=n),n}}function ga(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?Eo.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(Ce("Texture: Unable to serialize Texture."),{})}let To=0;const _a=new O;class At extends Dn{constructor(e=At.DEFAULT_IMAGE,t=At.DEFAULT_MAPPING,n=1001,a=1001,r=1006,s=1008,o=1023,c=1009,l=At.DEFAULT_ANISOTROPY,h=""){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:To++}),this.uuid=cn(),this.name="",this.source=new ar(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=n,this.wrapT=a,this.magFilter=r,this.minFilter=s,this.anisotropy=l,this.format=o,this.internalFormat=null,this.type=c,this.offset=new Ge(0,0),this.repeat=new Ge(1,1),this.center=new Ge(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Pe,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(e&&e.depth&&e.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(_a).x}get height(){return this.source.getSize(_a).y}get depth(){return this.source.getSize(_a).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(const t in e){const n=e[t];if(n===void 0){Ce(`Texture.setValues(): parameter '${t}' has value of undefined.`);continue}const a=this[t];if(a===void 0){Ce(`Texture.setValues(): property '${t}' does not exist.`);continue}a&&n&&a.isVector2&&n.isVector2||a&&n&&a.isVector3&&n.isVector3||a&&n&&a.isMatrix3&&n.isMatrix3?a.copy(n):this[t]=n}}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];const n={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==300)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case 1e3:e.x=e.x-Math.floor(e.x);break;case 1001:e.x=e.x<0?0:1;break;case 1002:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case 1e3:e.y=e.y-Math.floor(e.y);break;case 1001:e.y=e.y<0?0:1;break;case 1002:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}}At.DEFAULT_IMAGE=null;At.DEFAULT_MAPPING=300;At.DEFAULT_ANISOTROPY=1;class nt{static{nt.prototype.isVector4=!0}constructor(e=0,t=0,n=0,a=1){this.x=e,this.y=t,this.z=n,this.w=a}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,a){return this.x=e,this.y=t,this.z=n,this.w=a,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("THREE.Vector4: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){const t=this.x,n=this.y,a=this.z,r=this.w,s=e.elements;return this.x=s[0]*t+s[4]*n+s[8]*a+s[12]*r,this.y=s[1]*t+s[5]*n+s[9]*a+s[13]*r,this.z=s[2]*t+s[6]*n+s[10]*a+s[14]*r,this.w=s[3]*t+s[7]*n+s[11]*a+s[15]*r,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);const t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,a,r;const c=e.elements,l=c[0],h=c[4],d=c[8],u=c[1],f=c[5],v=c[9],g=c[2],p=c[6],m=c[10];if(Math.abs(h-u)<.01&&Math.abs(d-g)<.01&&Math.abs(v-p)<.01){if(Math.abs(h+u)<.1&&Math.abs(d+g)<.1&&Math.abs(v+p)<.1&&Math.abs(l+f+m-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;const A=(l+1)/2,w=(f+1)/2,x=(m+1)/2,S=(h+u)/4,E=(d+g)/4,y=(v+p)/4;return A>w&&A>x?A<.01?(n=0,a=.707106781,r=.707106781):(n=Math.sqrt(A),a=S/n,r=E/n):w>x?w<.01?(n=.707106781,a=0,r=.707106781):(a=Math.sqrt(w),n=S/a,r=y/a):x<.01?(n=.707106781,a=.707106781,r=0):(r=Math.sqrt(x),n=E/r,a=y/r),this.set(n,a,r,t),this}let M=Math.sqrt((p-v)*(p-v)+(d-g)*(d-g)+(u-h)*(u-h));return Math.abs(M)<.001&&(M=1),this.x=(p-v)/M,this.y=(d-g)/M,this.z=(u-h)/M,this.w=Math.acos((l+f+m-1)/2),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=ze(this.x,e.x,t.x),this.y=ze(this.y,e.y,t.y),this.z=ze(this.z,e.z,t.z),this.w=ze(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=ze(this.x,e,t),this.y=ze(this.y,e,t),this.z=ze(this.z,e,t),this.w=ze(this.w,e,t),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(ze(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class Ao extends Dn{constructor(e=1,t=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:1006,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},n),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=n.depth,this.scissor=new nt(0,0,e,t),this.scissorTest=!1,this.viewport=new nt(0,0,e,t),this.textures=[];const a={width:e,height:t,depth:n.depth},r=new At(a),s=n.count;for(let o=0;o<s;o++)this.textures[o]=r.clone(),this.textures[o].isRenderTargetTexture=!0,this.textures[o].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveColorBuffer=n.resolveColorBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.storeMultisampledColorBuffer=n.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=n.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=n.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview,this.useArrayDepthTexture=n.useArrayDepthTexture}_setTextureOptions(e={}){const t={minFilter:1006,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let n=0;n<this.textures.length;n++)this.textures[n].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),e!==null&&e.renderTarget===null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,n=1){if(this.width!==e||this.height!==t||this.depth!==n){this.width=e,this.height=t,this.depth=n;for(let a=0,r=this.textures.length;a<r;a++)this.textures[a].image.width=e,this.textures[a].image.height=t,this.textures[a].image.depth=n,this.textures[a].isData3DTexture!==!0&&(this.textures[a].isArrayTexture=this.textures[a].image.depth>1);this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,n=e.textures.length;t<n;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;const a=Object.assign({},e.textures[t].image);this.textures[t].source=new ar(a)}if(this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveColorBuffer=e.resolveColorBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,this.storeMultisampledColorBuffer=e.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=e.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=e.storeMultisampledStencilBuffer,e.depthTexture!==null)if(e.depthTexture.renderTarget===e){const t=e.depthTexture.clone();t.renderTarget=null,this.depthTexture=t}else this.depthTexture=e.depthTexture;return this.samples=e.samples,this.multiview=e.multiview,this.useArrayDepthTexture=e.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}}class Lt extends Ao{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}}class Ts extends At{constructor(e=null,t=1,n=1,a=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:a},this.magFilter=1003,this.minFilter=1003,this.wrapR=1001,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}}class Co extends At{constructor(e=null,t=1,n=1,a=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:a},this.magFilter=1003,this.minFilter=1003,this.wrapR=1001,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}}class pe{static{pe.prototype.isMatrix4=!0}constructor(e,t,n,a,r,s,o,c,l,h,d,u,f,v,g,p){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,a,r,s,o,c,l,h,d,u,f,v,g,p)}set(e,t,n,a,r,s,o,c,l,h,d,u,f,v,g,p){const m=this.elements;return m[0]=e,m[4]=t,m[8]=n,m[12]=a,m[1]=r,m[5]=s,m[9]=o,m[13]=c,m[2]=l,m[6]=h,m[10]=d,m[14]=u,m[3]=f,m[7]=v,m[11]=g,m[15]=p,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new pe().fromArray(this.elements)}copy(e){const t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){const t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){const t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return this.determinantAffine()===0?(e.set(1,0,0),t.set(0,1,0),n.set(0,0,1),this):(e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this)}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){if(e.determinantAffine()===0)return this.identity();const t=this.elements,n=e.elements,a=1/On.setFromMatrixColumn(e,0).length(),r=1/On.setFromMatrixColumn(e,1).length(),s=1/On.setFromMatrixColumn(e,2).length();return t[0]=n[0]*a,t[1]=n[1]*a,t[2]=n[2]*a,t[3]=0,t[4]=n[4]*r,t[5]=n[5]*r,t[6]=n[6]*r,t[7]=0,t[8]=n[8]*s,t[9]=n[9]*s,t[10]=n[10]*s,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){const t=this.elements,n=e.x,a=e.y,r=e.z,s=Math.cos(n),o=Math.sin(n),c=Math.cos(a),l=Math.sin(a),h=Math.cos(r),d=Math.sin(r);if(e.order==="XYZ"){const u=s*h,f=s*d,v=o*h,g=o*d;t[0]=c*h,t[4]=-c*d,t[8]=l,t[1]=f+v*l,t[5]=u-g*l,t[9]=-o*c,t[2]=g-u*l,t[6]=v+f*l,t[10]=s*c}else if(e.order==="YXZ"){const u=c*h,f=c*d,v=l*h,g=l*d;t[0]=u+g*o,t[4]=v*o-f,t[8]=s*l,t[1]=s*d,t[5]=s*h,t[9]=-o,t[2]=f*o-v,t[6]=g+u*o,t[10]=s*c}else if(e.order==="ZXY"){const u=c*h,f=c*d,v=l*h,g=l*d;t[0]=u-g*o,t[4]=-s*d,t[8]=v+f*o,t[1]=f+v*o,t[5]=s*h,t[9]=g-u*o,t[2]=-s*l,t[6]=o,t[10]=s*c}else if(e.order==="ZYX"){const u=s*h,f=s*d,v=o*h,g=o*d;t[0]=c*h,t[4]=v*l-f,t[8]=u*l+g,t[1]=c*d,t[5]=g*l+u,t[9]=f*l-v,t[2]=-l,t[6]=o*c,t[10]=s*c}else if(e.order==="YZX"){const u=s*c,f=s*l,v=o*c,g=o*l;t[0]=c*h,t[4]=g-u*d,t[8]=v*d+f,t[1]=d,t[5]=s*h,t[9]=-o*h,t[2]=-l*h,t[6]=f*d+v,t[10]=u-g*d}else if(e.order==="XZY"){const u=s*c,f=s*l,v=o*c,g=o*l;t[0]=c*h,t[4]=-d,t[8]=l*h,t[1]=u*d+g,t[5]=s*h,t[9]=f*d-v,t[2]=v*d-f,t[6]=o*h,t[10]=g*d+u}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(Lo,e,Po)}lookAt(e,t,n){const a=this.elements;return Dt.subVectors(e,t),Dt.lengthSq()===0&&(Dt.z=1),Dt.normalize(),mn.crossVectors(n,Dt),mn.lengthSq()===0&&(Math.abs(n.z)===1?Dt.x+=1e-4:Dt.z+=1e-4,Dt.normalize(),mn.crossVectors(n,Dt)),mn.normalize(),Ai.crossVectors(Dt,mn),a[0]=mn.x,a[4]=Ai.x,a[8]=Dt.x,a[1]=mn.y,a[5]=Ai.y,a[9]=Dt.y,a[2]=mn.z,a[6]=Ai.z,a[10]=Dt.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const n=e.elements,a=t.elements,r=this.elements,s=n[0],o=n[4],c=n[8],l=n[12],h=n[1],d=n[5],u=n[9],f=n[13],v=n[2],g=n[6],p=n[10],m=n[14],M=n[3],A=n[7],w=n[11],x=n[15],S=a[0],E=a[4],y=a[8],R=a[12],D=a[1],P=a[5],U=a[9],L=a[13],C=a[2],B=a[6],X=a[10],H=a[14],J=a[3],j=a[7],Q=a[11],ne=a[15];return r[0]=s*S+o*D+c*C+l*J,r[4]=s*E+o*P+c*B+l*j,r[8]=s*y+o*U+c*X+l*Q,r[12]=s*R+o*L+c*H+l*ne,r[1]=h*S+d*D+u*C+f*J,r[5]=h*E+d*P+u*B+f*j,r[9]=h*y+d*U+u*X+f*Q,r[13]=h*R+d*L+u*H+f*ne,r[2]=v*S+g*D+p*C+m*J,r[6]=v*E+g*P+p*B+m*j,r[10]=v*y+g*U+p*X+m*Q,r[14]=v*R+g*L+p*H+m*ne,r[3]=M*S+A*D+w*C+x*J,r[7]=M*E+A*P+w*B+x*j,r[11]=M*y+A*U+w*X+x*Q,r[15]=M*R+A*L+w*H+x*ne,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){const e=this.elements,t=e[0],n=e[4],a=e[8],r=e[12],s=e[1],o=e[5],c=e[9],l=e[13],h=e[2],d=e[6],u=e[10],f=e[14],v=e[3],g=e[7],p=e[11],m=e[15],M=c*f-l*u,A=o*f-l*d,w=o*u-c*d,x=s*f-l*h,S=s*u-c*h,E=s*d-o*h;return t*(g*M-p*A+m*w)-n*(v*M-p*x+m*S)+a*(v*A-g*x+m*E)-r*(v*w-g*S+p*E)}determinantAffine(){const e=this.elements,t=e[0],n=e[4],a=e[8],r=e[1],s=e[5],o=e[9],c=e[2],l=e[6],h=e[10];return t*(s*h-o*l)-n*(r*h-o*c)+a*(r*l-s*c)}transpose(){const e=this.elements;let t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){const a=this.elements;return e.isVector3?(a[12]=e.x,a[13]=e.y,a[14]=e.z):(a[12]=e,a[13]=t,a[14]=n),this}invert(){const e=this.elements,t=e[0],n=e[1],a=e[2],r=e[3],s=e[4],o=e[5],c=e[6],l=e[7],h=e[8],d=e[9],u=e[10],f=e[11],v=e[12],g=e[13],p=e[14],m=e[15],M=t*o-n*s,A=t*c-a*s,w=t*l-r*s,x=n*c-a*o,S=n*l-r*o,E=a*l-r*c,y=h*g-d*v,R=h*p-u*v,D=h*m-f*v,P=d*p-u*g,U=d*m-f*g,L=u*m-f*p,C=M*L-A*U+w*P+x*D-S*R+E*y;if(C===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const B=1/C;return e[0]=(o*L-c*U+l*P)*B,e[1]=(a*U-n*L-r*P)*B,e[2]=(g*E-p*S+m*x)*B,e[3]=(u*S-d*E-f*x)*B,e[4]=(c*D-s*L-l*R)*B,e[5]=(t*L-a*D+r*R)*B,e[6]=(p*w-v*E-m*A)*B,e[7]=(h*E-u*w+f*A)*B,e[8]=(s*U-o*D+l*y)*B,e[9]=(n*D-t*U-r*y)*B,e[10]=(v*S-g*w+m*M)*B,e[11]=(d*w-h*S-f*M)*B,e[12]=(o*R-s*P-c*y)*B,e[13]=(t*P-n*R+a*y)*B,e[14]=(g*A-v*x-p*M)*B,e[15]=(h*x-d*A+u*M)*B,this}scale(e){const t=this.elements,n=e.x,a=e.y,r=e.z;return t[0]*=n,t[4]*=a,t[8]*=r,t[1]*=n,t[5]*=a,t[9]*=r,t[2]*=n,t[6]*=a,t[10]*=r,t[3]*=n,t[7]*=a,t[11]*=r,this}getMaxScaleOnAxis(){const e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],a=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,a))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){const t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){const n=Math.cos(t),a=Math.sin(t),r=1-n,s=e.x,o=e.y,c=e.z,l=r*s,h=r*o;return this.set(l*s+n,l*o-a*c,l*c+a*o,0,l*o+a*c,h*o+n,h*c-a*s,0,l*c-a*o,h*c+a*s,r*c*c+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,a,r,s){return this.set(1,n,r,0,e,1,s,0,t,a,1,0,0,0,0,1),this}compose(e,t,n){const a=this.elements,r=t._x,s=t._y,o=t._z,c=t._w,l=r+r,h=s+s,d=o+o,u=r*l,f=r*h,v=r*d,g=s*h,p=s*d,m=o*d,M=c*l,A=c*h,w=c*d,x=n.x,S=n.y,E=n.z;return a[0]=(1-(g+m))*x,a[1]=(f+w)*x,a[2]=(v-A)*x,a[3]=0,a[4]=(f-w)*S,a[5]=(1-(u+m))*S,a[6]=(p+M)*S,a[7]=0,a[8]=(v+A)*E,a[9]=(p-M)*E,a[10]=(1-(u+g))*E,a[11]=0,a[12]=e.x,a[13]=e.y,a[14]=e.z,a[15]=1,this}decompose(e,t,n){const a=this.elements;e.x=a[12],e.y=a[13],e.z=a[14];const r=this.determinantAffine();if(r===0)return n.set(1,1,1),t.identity(),this;let s=On.set(a[0],a[1],a[2]).length();const o=On.set(a[4],a[5],a[6]).length(),c=On.set(a[8],a[9],a[10]).length();r<0&&(s=-s),kt.copy(this);const l=1/s,h=1/o,d=1/c;return kt.elements[0]*=l,kt.elements[1]*=l,kt.elements[2]*=l,kt.elements[4]*=h,kt.elements[5]*=h,kt.elements[6]*=h,kt.elements[8]*=d,kt.elements[9]*=d,kt.elements[10]*=d,t.setFromRotationMatrix(kt),n.x=s,n.y=o,n.z=c,this}makePerspective(e,t,n,a,r,s,o=2e3,c=!1){const l=this.elements,h=2*r/(t-e),d=2*r/(n-a),u=(t+e)/(t-e),f=(n+a)/(n-a);let v,g;if(c)v=r/(s-r),g=s*r/(s-r);else if(o===2e3)v=-(s+r)/(s-r),g=-2*s*r/(s-r);else if(o===2001)v=-s/(s-r),g=-s*r/(s-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return l[0]=h,l[4]=0,l[8]=u,l[12]=0,l[1]=0,l[5]=d,l[9]=f,l[13]=0,l[2]=0,l[6]=0,l[10]=v,l[14]=g,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(e,t,n,a,r,s,o=2e3,c=!1){const l=this.elements,h=2/(t-e),d=2/(n-a),u=-(t+e)/(t-e),f=-(n+a)/(n-a);let v,g;if(c)v=1/(s-r),g=s/(s-r);else if(o===2e3)v=-2/(s-r),g=-(s+r)/(s-r);else if(o===2001)v=-1/(s-r),g=-r/(s-r);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return l[0]=h,l[4]=0,l[8]=0,l[12]=u,l[1]=0,l[5]=d,l[9]=0,l[13]=f,l[2]=0,l[6]=0,l[10]=v,l[14]=g,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(e){const t=this.elements,n=e.elements;for(let a=0;a<16;a++)if(t[a]!==n[a])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){const n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}}const On=new O,kt=new pe,Lo=new O(0,0,0),Po=new O(1,1,1),mn=new O,Ai=new O,Dt=new O,Tr=new pe,Ar=new bn;class Cn{constructor(e=0,t=0,n=0,a=Cn.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=n,this._order=a}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,a=this._order){return this._x=e,this._y=t,this._z=n,this._order=a,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){const a=e.elements,r=a[0],s=a[4],o=a[8],c=a[1],l=a[5],h=a[9],d=a[2],u=a[6],f=a[10];switch(t){case"XYZ":this._y=Math.asin(ze(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-h,f),this._z=Math.atan2(-s,r)):(this._x=Math.atan2(u,l),this._z=0);break;case"YXZ":this._x=Math.asin(-ze(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(o,f),this._z=Math.atan2(c,l)):(this._y=Math.atan2(-d,r),this._z=0);break;case"ZXY":this._x=Math.asin(ze(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(-d,f),this._z=Math.atan2(-s,l)):(this._y=0,this._z=Math.atan2(c,r));break;case"ZYX":this._y=Math.asin(-ze(d,-1,1)),Math.abs(d)<.9999999?(this._x=Math.atan2(u,f),this._z=Math.atan2(c,r)):(this._x=0,this._z=Math.atan2(-s,l));break;case"YZX":this._z=Math.asin(ze(c,-1,1)),Math.abs(c)<.9999999?(this._x=Math.atan2(-h,l),this._y=Math.atan2(-d,r)):(this._x=0,this._y=Math.atan2(o,f));break;case"XZY":this._z=Math.asin(-ze(s,-1,1)),Math.abs(s)<.9999999?(this._x=Math.atan2(u,l),this._y=Math.atan2(o,r)):(this._x=Math.atan2(-h,f),this._y=0);break;default:Ce("Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return Tr.makeRotationFromQuaternion(e),this.setFromRotationMatrix(Tr,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return Ar.setFromEuler(this),this.setFromQuaternion(Ar,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}Cn.DEFAULT_ORDER="XYZ";class As{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}}let Do=0;const Cr=new O,zn=new bn,nn=new pe,Ci=new O,si=new O,Uo=new O,Io=new bn,Lr=new O(1,0,0),Pr=new O(0,1,0),Dr=new O(0,0,1),Ur={type:"added"},Fo={type:"removed"},kn={type:"childadded",child:null},ya={type:"childremoved",child:null};class Pt extends Dn{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Do++}),this.uuid=cn(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=Pt.DEFAULT_UP.clone();const e=new O,t=new Cn,n=new bn,a=new O(1,1,1);function r(){n.setFromEuler(t,!1)}function s(){t.setFromQuaternion(n,void 0,!1)}t._onChange(r),n._onChange(s),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:a},modelViewMatrix:{value:new pe},normalMatrix:{value:new Pe}}),this.matrix=new pe,this.matrixWorld=new pe,this.matrixAutoUpdate=Pt.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=Pt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new As,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return zn.setFromAxisAngle(e,t),this.quaternion.multiply(zn),this}rotateOnWorldAxis(e,t){return zn.setFromAxisAngle(e,t),this.quaternion.premultiply(zn),this}rotateX(e){return this.rotateOnAxis(Lr,e)}rotateY(e){return this.rotateOnAxis(Pr,e)}rotateZ(e){return this.rotateOnAxis(Dr,e)}translateOnAxis(e,t){return Cr.copy(e).applyQuaternion(this.quaternion),this.position.add(Cr.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(Lr,e)}translateY(e){return this.translateOnAxis(Pr,e)}translateZ(e){return this.translateOnAxis(Dr,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(nn.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?Ci.copy(e):Ci.set(e,t,n);const a=this.parent;this.updateWorldMatrix(!0,!1),si.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?nn.lookAt(si,Ci,this.up):nn.lookAt(Ci,si,this.up),this.quaternion.setFromRotationMatrix(nn),a&&(nn.extractRotation(a.matrixWorld),zn.setFromRotationMatrix(nn),this.quaternion.premultiply(zn.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(Xe("Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(Ur),kn.child=e,this.dispatchEvent(kn),kn.child=null):Xe("Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}const t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(Fo),ya.child=e,this.dispatchEvent(ya),ya.child=null),this}removeFromParent(){const e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),nn.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),nn.multiply(e.parent.matrixWorld)),e.applyMatrix4(nn),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(Ur),kn.child=e,this.dispatchEvent(kn),kn.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,a=this.children.length;n<a;n++){const s=this.children[n].getObjectByProperty(e,t);if(s!==void 0)return s}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);const a=this.children;for(let r=0,s=a.length;r<s;r++)a[r].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(si,e,Uo),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(si,Io,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);const t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}intersectsFrustum(){}traverse(e){e(this);const t=this.children;for(let n=0,a=t.length;n<a;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);const t=this.children;for(let n=0,a=t.length;n<a;n++)t[n].traverseVisible(e)}traverseAncestors(e){const t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);const e=this.pivot;if(e!==null){const t=e.x,n=e.y,a=e.z,r=this.matrix.elements;r[12]+=t-r[0]*t-r[4]*n-r[8]*a,r[13]+=n-r[1]*t-r[5]*n-r[9]*a,r[14]+=a-r[2]*t-r[6]*n-r[10]*a}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);const t=this.children;for(let n=0,a=t.length;n<a;n++)t[n].updateMatrixWorld(e)}updateWorldMatrix(e,t,n=!1){const a=this.parent;if(e===!0&&a!==null&&a.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||n)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,n=!0),t===!0){const r=this.children;for(let s=0,o=r.length;s<o;s++)r[s].updateWorldMatrix(!1,!0,n)}}toJSON(e){const t=e===void 0||typeof e=="string",n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});const a={};a.uuid=this.uuid,a.type=this.type,a.name=this.name,a.castShadow=this.castShadow,a.receiveShadow=this.receiveShadow,a.visible=this.visible,a.frustumCulled=this.frustumCulled,a.renderOrder=this.renderOrder,a.static=this.static,a.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(a.userData=this.userData),a.layers=this.layers.mask,a.matrix=this.matrix.toArray(),a.up=this.up.toArray(),this.pivot!==null&&(a.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(a.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(a.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(a.type="InstancedMesh",a.count=this.count,a.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(a.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(a.type="BatchedMesh",a.perObjectFrustumCulled=this.perObjectFrustumCulled,a.sortObjects=this.sortObjects,a.drawRanges=this._drawRanges,a.reservedRanges=this._reservedRanges,a.geometryInfo=this._geometryInfo.map(o=>({...o,boundingBox:o.boundingBox?o.boundingBox.toJSON():void 0,boundingSphere:o.boundingSphere?o.boundingSphere.toJSON():void 0})),a.instanceInfo=this._instanceInfo.map(o=>({...o})),a.availableInstanceIds=this._availableInstanceIds.slice(),a.availableGeometryIds=this._availableGeometryIds.slice(),a.nextIndexStart=this._nextIndexStart,a.nextVertexStart=this._nextVertexStart,a.geometryCount=this._geometryCount,a.maxInstanceCount=this._maxInstanceCount,a.maxVertexCount=this._maxVertexCount,a.maxIndexCount=this._maxIndexCount,a.geometryInitialized=this._geometryInitialized,a.matricesTexture=this._matricesTexture.toJSON(e),a.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(a.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(a.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(a.boundingBox=this.boundingBox.toJSON()));function r(o,c){return o[c.uuid]===void 0&&(o[c.uuid]=c.toJSON(e)),c.uuid}if(this.isScene)this.background&&(this.background.isColor?a.background=this.background.toJSON():this.background.isTexture&&(a.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(a.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){a.geometry=r(e.geometries,this.geometry);const o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){const c=o.shapes;if(Array.isArray(c))for(let l=0,h=c.length;l<h;l++){const d=c[l];r(e.shapes,d)}else r(e.shapes,c)}}if(this.isSkinnedMesh&&(a.bindMode=this.bindMode,a.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(e.skeletons,this.skeleton),a.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const o=[];for(let c=0,l=this.material.length;c<l;c++)o.push(r(e.materials,this.material[c]));a.material=o}else a.material=r(e.materials,this.material);if(this.children.length>0){a.children=[];for(let o=0;o<this.children.length;o++)a.children.push(this.children[o].toJSON(e).object)}if(this.animations.length>0){a.animations=[];for(let o=0;o<this.animations.length;o++){const c=this.animations[o];a.animations.push(r(e.animations,c))}}if(t){const o=s(e.geometries),c=s(e.materials),l=s(e.textures),h=s(e.images),d=s(e.shapes),u=s(e.skeletons),f=s(e.animations),v=s(e.nodes);o.length>0&&(n.geometries=o),c.length>0&&(n.materials=c),l.length>0&&(n.textures=l),h.length>0&&(n.images=h),d.length>0&&(n.shapes=d),u.length>0&&(n.skeletons=u),f.length>0&&(n.animations=f),v.length>0&&(n.nodes=v)}return n.object=a,n;function s(o){const c=[];for(const l in o){const h=o[l];delete h.metadata,c.push(h)}return c}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.pivot=e.pivot!==null?e.pivot.clone():null,this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let n=0;n<e.children.length;n++){const a=e.children[n];this.add(a.clone())}return this}dispose(){this.dispatchEvent({type:"dispose"})}}Pt.DEFAULT_UP=new O(0,1,0);Pt.DEFAULT_MATRIX_AUTO_UPDATE=!0;Pt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;class Li extends Pt{constructor(){super(),this.isGroup=!0,this.type="Group"}}const No={type:"move"};class xa{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Li,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Li,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new O,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new O),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Li,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new O,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new O,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){const t=this._hand;if(t)for(const n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let a=null,r=null,s=null;const o=this._targetRay,c=this._grip,l=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(l&&e.hand){s=!0;for(const g of e.hand.values()){const p=t.getJointPose(g,n),m=this._getHandJoint(l,g);p!==null&&(m.matrix.fromArray(p.transform.matrix),m.matrix.decompose(m.position,m.rotation,m.scale),m.matrixWorldNeedsUpdate=!0,m.jointRadius=p.radius),m.visible=p!==null}const h=l.joints["index-finger-tip"],d=l.joints["thumb-tip"],u=h.position.distanceTo(d.position),f=.02,v=.005;l.inputState.pinching&&u>f+v?(l.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!l.inputState.pinching&&u<=f-v&&(l.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else c!==null&&e.gripSpace&&(r=t.getPose(e.gripSpace,n),r!==null&&(c.matrix.fromArray(r.transform.matrix),c.matrix.decompose(c.position,c.rotation,c.scale),c.matrixWorldNeedsUpdate=!0,r.linearVelocity?(c.hasLinearVelocity=!0,c.linearVelocity.copy(r.linearVelocity)):c.hasLinearVelocity=!1,r.angularVelocity?(c.hasAngularVelocity=!0,c.angularVelocity.copy(r.angularVelocity)):c.hasAngularVelocity=!1,c.eventsEnabled&&c.dispatchEvent({type:"gripUpdated",data:e,target:this})));o!==null&&(a=t.getPose(e.targetRaySpace,n),a===null&&r!==null&&(a=r),a!==null&&(o.matrix.fromArray(a.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,a.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(a.linearVelocity)):o.hasLinearVelocity=!1,a.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(a.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(No)))}return o!==null&&(o.visible=a!==null),c!==null&&(c.visible=r!==null),l!==null&&(l.visible=s!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){const n=new Li;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}}const Cs={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},vn={h:0,s:0,l:0},Pi={h:0,s:0,l:0};function ba(i,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?i+(e-i)*6*t:t<1/2?e:t<2/3?i+(e-i)*6*(2/3-t):i}class qe{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){const a=e;a&&a.isColor?this.copy(a):typeof a=="number"?this.setHex(a):typeof a=="string"&&this.setStyle(a)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=Ot){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,ke.colorSpaceToWorking(this,t),this}setRGB(e,t,n,a=ke.workingColorSpace){return this.r=e,this.g=t,this.b=n,ke.colorSpaceToWorking(this,a),this}setHSL(e,t,n,a=ke.workingColorSpace){if(e=ir(e,1),t=ze(t,0,1),n=ze(n,0,1),t===0)this.r=this.g=this.b=n;else{const r=n<=.5?n*(1+t):n+t-n*t,s=2*n-r;this.r=ba(s,r,e+1/3),this.g=ba(s,r,e),this.b=ba(s,r,e-1/3)}return ke.colorSpaceToWorking(this,a),this}setStyle(e,t=Ot){function n(r){r!==void 0&&parseFloat(r)<1&&Ce("Color: Alpha component of "+e+" will be ignored.")}let a;if(a=/^(\w+)\(([^\)]*)\)/.exec(e)){let r;const s=a[1],o=a[2];switch(s){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,t);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,t);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,t);break;default:Ce("Color: Unknown color model "+e)}}else if(a=/^\#([A-Fa-f\d]+)$/.exec(e)){const r=a[1],s=r.length;if(s===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,t);if(s===6)return this.setHex(parseInt(r,16),t);Ce("Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=Ot){const n=Cs[e.toLowerCase()];return n!==void 0?this.setHex(n,t):Ce("Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=un(e.r),this.g=un(e.g),this.b=un(e.b),this}copyLinearToSRGB(e){return this.r=ii(e.r),this.g=ii(e.g),this.b=ii(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=Ot){return ke.workingToColorSpace(Mt.copy(this),e),Math.round(ze(Mt.r*255,0,255))*65536+Math.round(ze(Mt.g*255,0,255))*256+Math.round(ze(Mt.b*255,0,255))}getHexString(e=Ot){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=ke.workingColorSpace){ke.workingToColorSpace(Mt.copy(this),t);const n=Mt.r,a=Mt.g,r=Mt.b,s=Math.max(n,a,r),o=Math.min(n,a,r);let c,l;const h=(o+s)/2;if(o===s)c=0,l=0;else{const d=s-o;switch(l=h<=.5?d/(s+o):d/(2-s-o),s){case n:c=(a-r)/d+(a<r?6:0);break;case a:c=(r-n)/d+2;break;case r:c=(n-a)/d+4;break}c/=6}return e.h=c,e.s=l,e.l=h,e}getRGB(e,t=ke.workingColorSpace){return ke.workingToColorSpace(Mt.copy(this),t),e.r=Mt.r,e.g=Mt.g,e.b=Mt.b,e}getStyle(e=Ot){ke.workingToColorSpace(Mt.copy(this),e);const t=Mt.r,n=Mt.g,a=Mt.b;return e!==Ot?`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${a.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(a*255)})`}offsetHSL(e,t,n){return this.getHSL(vn),this.setHSL(vn.h+e,vn.s+t,vn.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(vn),e.getHSL(Pi);const n=gi(vn.h,Pi.h,t),a=gi(vn.s,Pi.s,t),r=gi(vn.l,Pi.l,t);return this.setHSL(n,a,r),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){const t=this.r,n=this.g,a=this.b,r=e.elements;return this.r=r[0]*t+r[3]*n+r[6]*a,this.g=r[1]*t+r[4]*n+r[7]*a,this.b=r[2]*t+r[5]*n+r[8]*a,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const Mt=new qe;qe.NAMES=Cs;class Ka extends Pt{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Cn,this.environmentIntensity=1,this.environmentRotation=new Cn,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){const t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),t.object.backgroundBlurriness=this.backgroundBlurriness,t.object.backgroundIntensity=this.backgroundIntensity,t.object.backgroundRotation=this.backgroundRotation.toArray(),t.object.environmentIntensity=this.environmentIntensity,t.object.environmentRotation=this.environmentRotation.toArray(),t}}const Gt=new O,an=new O,Sa=new O,rn=new O,Gn=new O,Vn=new O,Ir=new O,wa=new O,Ma=new O,Ea=new O,Ra=new nt,Ta=new nt,Aa=new nt;class It{constructor(e=new O,t=new O,n=new O){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,a){a.subVectors(n,t),Gt.subVectors(e,t),a.cross(Gt);const r=a.lengthSq();return r>0?a.multiplyScalar(1/Math.sqrt(r)):a.set(0,0,0)}static getBarycoord(e,t,n,a,r){Gt.subVectors(a,t),an.subVectors(n,t),Sa.subVectors(e,t);const s=Gt.dot(Gt),o=Gt.dot(an),c=Gt.dot(Sa),l=an.dot(an),h=an.dot(Sa),d=s*l-o*o;if(d===0)return r.set(0,0,0),null;const u=1/d,f=(l*c-o*h)*u,v=(s*h-o*c)*u;return r.set(1-f-v,v,f)}static containsPoint(e,t,n,a){return this.getBarycoord(e,t,n,a,rn)===null?!1:rn.x>=0&&rn.y>=0&&rn.x+rn.y<=1}static getInterpolation(e,t,n,a,r,s,o,c){return this.getBarycoord(e,t,n,a,rn)===null?(c.x=0,c.y=0,"z"in c&&(c.z=0),"w"in c&&(c.w=0),null):(c.setScalar(0),c.addScaledVector(r,rn.x),c.addScaledVector(s,rn.y),c.addScaledVector(o,rn.z),c)}static getInterpolatedAttribute(e,t,n,a,r,s){return Ra.setScalar(0),Ta.setScalar(0),Aa.setScalar(0),Ra.fromBufferAttribute(e,t),Ta.fromBufferAttribute(e,n),Aa.fromBufferAttribute(e,a),s.setScalar(0),s.addScaledVector(Ra,r.x),s.addScaledVector(Ta,r.y),s.addScaledVector(Aa,r.z),s}static isFrontFacing(e,t,n,a){return Gt.subVectors(n,t),an.subVectors(e,t),Gt.cross(an).dot(a)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,a){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[a]),this}setFromAttributeAndIndices(e,t,n,a){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,a),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return Gt.subVectors(this.c,this.b),an.subVectors(this.a,this.b),Gt.cross(an).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return It.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return It.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,n,a,r){return It.getInterpolation(e,this.a,this.b,this.c,t,n,a,r)}containsPoint(e){return It.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return It.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){const n=this.a,a=this.b,r=this.c;let s,o;Gn.subVectors(a,n),Vn.subVectors(r,n),wa.subVectors(e,n);const c=Gn.dot(wa),l=Vn.dot(wa);if(c<=0&&l<=0)return t.copy(n);Ma.subVectors(e,a);const h=Gn.dot(Ma),d=Vn.dot(Ma);if(h>=0&&d<=h)return t.copy(a);const u=c*d-h*l;if(u<=0&&c>=0&&h<=0)return s=c/(c-h),t.copy(n).addScaledVector(Gn,s);Ea.subVectors(e,r);const f=Gn.dot(Ea),v=Vn.dot(Ea);if(v>=0&&f<=v)return t.copy(r);const g=f*l-c*v;if(g<=0&&l>=0&&v<=0)return o=l/(l-v),t.copy(n).addScaledVector(Vn,o);const p=h*v-f*d;if(p<=0&&d-h>=0&&f-v>=0)return Ir.subVectors(r,a),o=(d-h)/(d-h+(f-v)),t.copy(a).addScaledVector(Ir,o);const m=1/(p+g+u);return s=g*m,o=u*m,t.copy(n).addScaledVector(Gn,s).addScaledVector(Vn,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}}class Un{constructor(e=new O(1/0,1/0,1/0),t=new O(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(Vt.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(Vt.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){const n=Vt.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);const n=e.geometry;if(n!==void 0){const r=n.getAttribute("position");if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0)for(let s=0,o=r.count;s<o;s++)e.isMesh===!0?e.getVertexPosition(s,Vt):Vt.fromBufferAttribute(r,s),Vt.applyMatrix4(e.matrixWorld),this.expandByPoint(Vt);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),Di.copy(e.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),Di.copy(n.boundingBox)),Di.applyMatrix4(e.matrixWorld),this.union(Di)}const a=e.children;for(let r=0,s=a.length;r<s;r++)this.expandByObject(a[r],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,Vt),Vt.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(oi),Ui.subVectors(this.max,oi),Hn.subVectors(e.a,oi),Wn.subVectors(e.b,oi),Xn.subVectors(e.c,oi),gn.subVectors(Wn,Hn),_n.subVectors(Xn,Wn),wn.subVectors(Hn,Xn);let t=[0,-gn.z,gn.y,0,-_n.z,_n.y,0,-wn.z,wn.y,gn.z,0,-gn.x,_n.z,0,-_n.x,wn.z,0,-wn.x,-gn.y,gn.x,0,-_n.y,_n.x,0,-wn.y,wn.x,0];return!Ca(t,Hn,Wn,Xn,Ui)||(t=[1,0,0,0,1,0,0,0,1],!Ca(t,Hn,Wn,Xn,Ui))?!1:(Ii.crossVectors(gn,_n),t=[Ii.x,Ii.y,Ii.z],Ca(t,Hn,Wn,Xn,Ui))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,Vt).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(Vt).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(sn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),sn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),sn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),sn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),sn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),sn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),sn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),sn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(sn),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}}const sn=[new O,new O,new O,new O,new O,new O,new O,new O],Vt=new O,Di=new Un,Hn=new O,Wn=new O,Xn=new O,gn=new O,_n=new O,wn=new O,oi=new O,Ui=new O,Ii=new O,Mn=new O;function Ca(i,e,t,n,a){for(let r=0,s=i.length-3;r<=s;r+=3){Mn.fromArray(i,r);const o=a.x*Math.abs(Mn.x)+a.y*Math.abs(Mn.y)+a.z*Math.abs(Mn.z),c=e.dot(Mn),l=t.dot(Mn),h=n.dot(Mn);if(Math.max(-Math.max(c,l,h),Math.min(c,l,h))>o)return!1}return!0}const ft=new O,Fi=new Ge;let Bo=0;class jt extends Dn{constructor(e,t,n=!1){if(super(),Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:Bo++}),this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=n,this.usage=35044,this.updateRanges=[],this.gpuType=1015,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let a=0,r=this.itemSize;a<r;a++)this.array[e+a]=t.array[n+a];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)Fi.fromBufferAttribute(this,t),Fi.applyMatrix3(e),this.setXY(t,Fi.x,Fi.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)ft.fromBufferAttribute(this,t),ft.applyMatrix3(e),this.setXYZ(t,ft.x,ft.y,ft.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)ft.fromBufferAttribute(this,t),ft.applyMatrix4(e),this.setXYZ(t,ft.x,ft.y,ft.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)ft.fromBufferAttribute(this,t),ft.applyNormalMatrix(e),this.setXYZ(t,ft.x,ft.y,ft.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)ft.fromBufferAttribute(this,t),ft.transformDirection(e),this.setXYZ(t,ft.x,ft.y,ft.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=Wt(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=Qe(n,this.array)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=Wt(t,this.array)),t}setX(e,t){return this.normalized&&(t=Qe(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=Wt(t,this.array)),t}setY(e,t){return this.normalized&&(t=Qe(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=Wt(t,this.array)),t}setZ(e,t){return this.normalized&&(t=Qe(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=Wt(t,this.array)),t}setW(e,t){return this.normalized&&(t=Qe(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=Qe(t,this.array),n=Qe(n,this.array)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,a){return e*=this.itemSize,this.normalized&&(t=Qe(t,this.array),n=Qe(n,this.array),a=Qe(a,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=a,this}setXYZW(e,t,n,a,r){return e*=this.itemSize,this.normalized&&(t=Qe(t,this.array),n=Qe(n,this.array),a=Qe(a,this.array),r=Qe(r,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=a,this.array[e+3]=r,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return e.name=this.name,e.usage=this.usage,e.gpuType=this.gpuType,e}dispose(){this.dispatchEvent({type:"dispose"})}}class rr extends jt{constructor(e,t,n){super(new Uint16Array(e),t,n)}}class Ls extends jt{constructor(e,t,n){super(new Uint32Array(e),t,n)}}class qt extends jt{constructor(e,t,n){super(new Float32Array(e),t,n)}}const Oo=new Un,li=new O,La=new O;class wi{constructor(e=new O,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){const n=this.center;t!==void 0?n.copy(t):Oo.setFromPoints(e).getCenter(n);let a=0;for(let r=0,s=e.length;r<s;r++)a=Math.max(a,n.distanceToSquared(e[r]));return this.radius=Math.sqrt(a),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){const t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){const n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;li.subVectors(e,this.center);const t=li.lengthSq();if(t>this.radius*this.radius){const n=Math.sqrt(t),a=(n-this.radius)*.5;this.center.addScaledVector(li,a/n),this.radius+=a}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(La.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(li.copy(e.center).add(La)),this.expandByPoint(li.copy(e.center).sub(La))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}}let zo=0;const Bt=new pe,Pa=new Pt,jn=new O,Ut=new Un,ci=new Un,xt=new O;class Yt extends Dn{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:zo++}),this.uuid=cn(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(io(e)?Ls:rr)(e,1):this.index=e,this}setIndirect(e,t=0){return this.indirect=e,this.indirectOffset=t,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){const t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);const n=this.attributes.normal;if(n!==void 0){const r=new Pe().getNormalMatrix(e);n.applyNormalMatrix(r),n.needsUpdate=!0}const a=this.attributes.tangent;return a!==void 0&&(a.transformDirection(e),a.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(e){return Bt.makeRotationFromQuaternion(e),this.applyMatrix4(Bt),this}rotateX(e){return Bt.makeRotationX(e),this.applyMatrix4(Bt),this}rotateY(e){return Bt.makeRotationY(e),this.applyMatrix4(Bt),this}rotateZ(e){return Bt.makeRotationZ(e),this.applyMatrix4(Bt),this}translate(e,t,n){return Bt.makeTranslation(e,t,n),this.applyMatrix4(Bt),this}scale(e,t,n){return Bt.makeScale(e,t,n),this.applyMatrix4(Bt),this}lookAt(e){return Pa.lookAt(e),Pa.updateMatrix(),this.applyMatrix4(Pa.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(jn).negate(),this.translate(jn.x,jn.y,jn.z),this}setFromPoints(e){const t=this.getAttribute("position");if(t===void 0){const n=[];for(let a=0,r=e.length;a<r;a++){const s=e[a];n.push(s.x,s.y,s.z||0)}this.setAttribute("position",new qt(n,3))}else{const n=Math.min(e.length,t.count);for(let a=0;a<n;a++){const r=e[a];t.setXYZ(a,r.x,r.y,r.z||0)}e.length>t.count&&Ce("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Un);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){Xe("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new O(-1/0,-1/0,-1/0),new O(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let n=0,a=t.length;n<a;n++){const r=t[n];Ut.setFromBufferAttribute(r),this.morphTargetsRelative?(xt.addVectors(this.boundingBox.min,Ut.min),this.boundingBox.expandByPoint(xt),xt.addVectors(this.boundingBox.max,Ut.max),this.boundingBox.expandByPoint(xt)):(this.boundingBox.expandByPoint(Ut.min),this.boundingBox.expandByPoint(Ut.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&Xe('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new wi);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){Xe("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new O,1/0);return}if(e){const n=this.boundingSphere.center;if(Ut.setFromBufferAttribute(e),t)for(let r=0,s=t.length;r<s;r++){const o=t[r];ci.setFromBufferAttribute(o),this.morphTargetsRelative?(xt.addVectors(Ut.min,ci.min),Ut.expandByPoint(xt),xt.addVectors(Ut.max,ci.max),Ut.expandByPoint(xt)):(Ut.expandByPoint(ci.min),Ut.expandByPoint(ci.max))}Ut.getCenter(n);let a=0;for(let r=0,s=e.count;r<s;r++)xt.fromBufferAttribute(e,r),a=Math.max(a,n.distanceToSquared(xt));if(t)for(let r=0,s=t.length;r<s;r++){const o=t[r],c=this.morphTargetsRelative;for(let l=0,h=o.count;l<h;l++)xt.fromBufferAttribute(o,l),c&&(jn.fromBufferAttribute(e,l),xt.add(jn)),a=Math.max(a,n.distanceToSquared(xt))}this.boundingSphere.radius=Math.sqrt(a),isNaN(this.boundingSphere.radius)&&Xe('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){Xe("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const n=t.position,a=t.normal,r=t.uv;let s=this.getAttribute("tangent");(s===void 0||s.count!==n.count)&&(s=new jt(new Float32Array(4*n.count),4),this.setAttribute("tangent",s));const o=[],c=[];for(let y=0;y<n.count;y++)o[y]=new O,c[y]=new O;const l=new O,h=new O,d=new O,u=new Ge,f=new Ge,v=new Ge,g=new O,p=new O;function m(y,R,D){l.fromBufferAttribute(n,y),h.fromBufferAttribute(n,R),d.fromBufferAttribute(n,D),u.fromBufferAttribute(r,y),f.fromBufferAttribute(r,R),v.fromBufferAttribute(r,D),h.sub(l),d.sub(l),f.sub(u),v.sub(u);const P=1/(f.x*v.y-v.x*f.y);isFinite(P)&&(g.copy(h).multiplyScalar(v.y).addScaledVector(d,-f.y).multiplyScalar(P),p.copy(d).multiplyScalar(f.x).addScaledVector(h,-v.x).multiplyScalar(P),o[y].add(g),o[R].add(g),o[D].add(g),c[y].add(p),c[R].add(p),c[D].add(p))}let M=this.groups;M.length===0&&(M=[{start:0,count:e.count}]);for(let y=0,R=M.length;y<R;++y){const D=M[y],P=D.start,U=D.count;for(let L=P,C=P+U;L<C;L+=3)m(e.getX(L+0),e.getX(L+1),e.getX(L+2))}const A=new O,w=new O,x=new O,S=new O;function E(y){x.fromBufferAttribute(a,y),S.copy(x);const R=o[y];A.copy(R),A.sub(x.multiplyScalar(x.dot(R))).normalize(),w.crossVectors(S,R);const P=w.dot(c[y])<0?-1:1;s.setXYZW(y,A.x,A.y,A.z,P)}for(let y=0,R=M.length;y<R;++y){const D=M[y],P=D.start,U=D.count;for(let L=P,C=P+U;L<C;L+=3)E(e.getX(L+0)),E(e.getX(L+1)),E(e.getX(L+2))}this._transformed=!0}computeVertexNormals(){const e=this.index,t=this.getAttribute("position");if(t!==void 0){let n=this.getAttribute("normal");if(n===void 0||n.count!==t.count)n=new jt(new Float32Array(t.count*3),3),this.setAttribute("normal",n);else for(let u=0,f=n.count;u<f;u++)n.setXYZ(u,0,0,0);const a=new O,r=new O,s=new O,o=new O,c=new O,l=new O,h=new O,d=new O;if(e)for(let u=0,f=e.count;u<f;u+=3){const v=e.getX(u+0),g=e.getX(u+1),p=e.getX(u+2);a.fromBufferAttribute(t,v),r.fromBufferAttribute(t,g),s.fromBufferAttribute(t,p),h.subVectors(s,r),d.subVectors(a,r),h.cross(d),o.fromBufferAttribute(n,v),c.fromBufferAttribute(n,g),l.fromBufferAttribute(n,p),o.add(h),c.add(h),l.add(h),n.setXYZ(v,o.x,o.y,o.z),n.setXYZ(g,c.x,c.y,c.z),n.setXYZ(p,l.x,l.y,l.z)}else for(let u=0,f=t.count;u<f;u+=3)a.fromBufferAttribute(t,u+0),r.fromBufferAttribute(t,u+1),s.fromBufferAttribute(t,u+2),h.subVectors(s,r),d.subVectors(a,r),h.cross(d),n.setXYZ(u+0,h.x,h.y,h.z),n.setXYZ(u+1,h.x,h.y,h.z),n.setXYZ(u+2,h.x,h.y,h.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){const e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)xt.fromBufferAttribute(e,t),xt.normalize(),e.setXYZ(t,xt.x,xt.y,xt.z)}toNonIndexed(){function e(o,c){const l=o.array,h=o.itemSize,d=o.normalized,u=new l.constructor(c.length*h);let f=0,v=0;for(let g=0,p=c.length;g<p;g++){o.isInterleavedBufferAttribute?f=c[g]*o.data.stride+o.offset:f=c[g]*h;for(let m=0;m<h;m++)u[v++]=l[f++]}return new jt(u,h,d)}if(this.index===null)return Ce("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const t=new Yt,n=this.index.array,a=this.attributes;for(const o in a){const c=a[o],l=e(c,n);t.setAttribute(o,l)}const r=this.morphAttributes;for(const o in r){const c=[],l=r[o];for(let h=0,d=l.length;h<d;h++){const u=l[h],f=e(u,n);c.push(f)}t.morphAttributes[o]=c}t.morphTargetsRelative=this.morphTargetsRelative;const s=this.groups;for(let o=0,c=s.length;o<c;o++){const l=s[o];t.addGroup(l.start,l.count,l.materialIndex)}return t}toJSON(){const e={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,e.name=this.name,Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){const c=this.parameters;for(const l in c)c[l]!==void 0&&(e[l]=c[l]);return e}e.data={attributes:{}};const t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});const n=this.attributes;for(const c in n){const l=n[c];e.data.attributes[c]=l.toJSON(e.data)}const a={};let r=!1;for(const c in this.morphAttributes){const l=this.morphAttributes[c],h=[];for(let d=0,u=l.length;d<u;d++){const f=l[d];h.push(f.toJSON(e.data))}h.length>0&&(a[c]=h,r=!0)}r&&(e.data.morphAttributes=a,e.data.morphTargetsRelative=this.morphTargetsRelative);const s=this.groups;s.length>0&&(e.data.groups=JSON.parse(JSON.stringify(s)));const o=this.boundingSphere;return o!==null&&(e.data.boundingSphere=o.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const t={};this.name=e.name;const n=e.index;n!==null&&this.setIndex(n.clone());const a=e.attributes;for(const l in a){const h=a[l];this.setAttribute(l,h.clone(t))}const r=e.morphAttributes;for(const l in r){const h=[],d=r[l];for(let u=0,f=d.length;u<f;u++)h.push(d[u].clone(t));this.morphAttributes[l]=h}this.morphTargetsRelative=e.morphTargetsRelative;const s=e.groups;for(let l=0,h=s.length;l<h;l++){const d=s[l];this.addGroup(d.start,d.count,d.materialIndex)}const o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());const c=e.boundingSphere;return c!==null&&(this.boundingSphere=c.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this._transformed=e._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}}class ko{constructor(e,t){this.isInterleavedBuffer=!0,this.array=e,this.stride=t,this.count=e!==void 0?e.length/t:0,this.usage=35044,this.updateRanges=[],this.version=0,this.uuid=cn()}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.array=new e.array.constructor(e.array),this.count=e.count,this.stride=e.stride,this.usage=e.usage,this}copyAt(e,t,n){e*=this.stride,n*=t.stride;for(let a=0,r=this.stride;a<r;a++)this.array[e+a]=t.array[n+a];return this}set(e,t=0){return this.array.set(e,t),this}clone(e){e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=cn()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer);const t=new this.array.constructor(e.arrayBuffers[this.array.buffer._uuid]),n=new this.constructor(t,this.stride);return n.setUsage(this.usage),n}onUpload(e){return this.onUploadCallback=e,this}toJSON(e){e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=cn()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer)));const t={uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride};return t.usage=this.usage,t}}const Rt=new O;class sr{constructor(e,t,n,a=!1){this.isInterleavedBufferAttribute=!0,this.name="",this.data=e,this.itemSize=t,this.offset=n,this.normalized=a}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(e){this.data.needsUpdate=e}applyMatrix4(e){for(let t=0,n=this.data.count;t<n;t++)Rt.fromBufferAttribute(this,t),Rt.applyMatrix4(e),this.setXYZ(t,Rt.x,Rt.y,Rt.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)Rt.fromBufferAttribute(this,t),Rt.applyNormalMatrix(e),this.setXYZ(t,Rt.x,Rt.y,Rt.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)Rt.fromBufferAttribute(this,t),Rt.transformDirection(e),this.setXYZ(t,Rt.x,Rt.y,Rt.z);return this}getComponent(e,t){let n=this.array[e*this.data.stride+this.offset+t];return this.normalized&&(n=Wt(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=Qe(n,this.array)),this.data.array[e*this.data.stride+this.offset+t]=n,this}setX(e,t){return this.normalized&&(t=Qe(t,this.array)),this.data.array[e*this.data.stride+this.offset]=t,this}setY(e,t){return this.normalized&&(t=Qe(t,this.array)),this.data.array[e*this.data.stride+this.offset+1]=t,this}setZ(e,t){return this.normalized&&(t=Qe(t,this.array)),this.data.array[e*this.data.stride+this.offset+2]=t,this}setW(e,t){return this.normalized&&(t=Qe(t,this.array)),this.data.array[e*this.data.stride+this.offset+3]=t,this}getX(e){let t=this.data.array[e*this.data.stride+this.offset];return this.normalized&&(t=Wt(t,this.array)),t}getY(e){let t=this.data.array[e*this.data.stride+this.offset+1];return this.normalized&&(t=Wt(t,this.array)),t}getZ(e){let t=this.data.array[e*this.data.stride+this.offset+2];return this.normalized&&(t=Wt(t,this.array)),t}getW(e){let t=this.data.array[e*this.data.stride+this.offset+3];return this.normalized&&(t=Wt(t,this.array)),t}setXY(e,t,n){return e=e*this.data.stride+this.offset,this.normalized&&(t=Qe(t,this.array),n=Qe(n,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this}setXYZ(e,t,n,a){return e=e*this.data.stride+this.offset,this.normalized&&(t=Qe(t,this.array),n=Qe(n,this.array),a=Qe(a,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this.data.array[e+2]=a,this}setXYZW(e,t,n,a,r){return e=e*this.data.stride+this.offset,this.normalized&&(t=Qe(t,this.array),n=Qe(n,this.array),a=Qe(a,this.array),r=Qe(r,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this.data.array[e+2]=a,this.data.array[e+3]=r,this}clone(e){if(e===void 0){sa("InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.");const t=[];for(let n=0;n<this.count;n++){const a=n*this.data.stride+this.offset;for(let r=0;r<this.itemSize;r++)t.push(this.data.array[a+r])}return new jt(new this.array.constructor(t),this.itemSize,this.normalized)}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.clone(e)),new sr(e.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(e){if(e===void 0){sa("InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.");const t=[];for(let n=0;n<this.count;n++){const a=n*this.data.stride+this.offset;for(let r=0;r<this.itemSize;r++)t.push(this.data.array[a+r])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:t,normalized:this.normalized}}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.toJSON(e)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}}const Da=new O,Go=new O,Vo=new Pe;class xn{constructor(e=new O(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,a){return this.normal.set(e,t,n),this.constant=a,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){const a=Da.subVectors(n,t).cross(Go.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(a,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){const e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t,n=!0){const a=e.delta(Da),r=this.normal.dot(a);if(r===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;const s=-(e.start.dot(this.normal)+this.constant)/r;return n===!0&&(s<0||s>1)?null:t.copy(e.start).addScaledVector(a,s)}intersectsLine(e){const t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){const n=t||Vo.getNormalMatrix(e),a=this.coplanarPoint(Da).applyMatrix4(e),r=this.normal.applyMatrix3(n).normalize();return this.constant=-a.dot(r),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(e){return this.normal.fromArray(e.normal),this.constant=e.constant,this}}let Ho=0;class ua extends Dn{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Ho++}),this.uuid=cn(),this.name="",this.type="Material",this.blending=1,this.side=0,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=204,this.blendDst=205,this.blendEquation=100,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new qe(0,0,0),this.blendAlpha=0,this.depthFunc=3,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=519,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=7680,this.stencilZFail=7680,this.stencilZPass=7680,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(const t in e){const n=e[t];if(n===void 0){Ce(`Material: parameter '${t}' has value of undefined.`);continue}const a=this[t];if(a===void 0){Ce(`Material: '${t}' is not a property of THREE.${this.type}.`);continue}a&&a.isColor?a.set(n):a&&a.isVector2&&n&&n.isVector2||a&&a.isEuler&&n&&n.isEuler||a&&a.isVector3&&n&&n.isVector3?a.copy(n):this[t]=n}}toJSON(e){const t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});const n={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,n.blending=this.blending,n.side=this.side,n.shadowSide=this.shadowSide,n.vertexColors=this.vertexColors,n.opacity=this.opacity,n.transparent=this.transparent,n.blendSrc=this.blendSrc,n.blendDst=this.blendDst,n.blendEquation=this.blendEquation,n.blendSrcAlpha=this.blendSrcAlpha,n.blendDstAlpha=this.blendDstAlpha,n.blendEquationAlpha=this.blendEquationAlpha,n.blendColor=this.blendColor.getHex(),n.blendAlpha=this.blendAlpha,n.depthFunc=this.depthFunc,n.depthTest=this.depthTest,n.depthWrite=this.depthWrite,n.colorWrite=this.colorWrite,n.clipIntersection=this.clipIntersection,n.clipShadows=this.clipShadows,n.stencilWriteMask=this.stencilWriteMask,n.stencilFunc=this.stencilFunc,n.stencilRef=this.stencilRef,n.stencilFuncMask=this.stencilFuncMask,n.stencilFail=this.stencilFail,n.stencilZFail=this.stencilZFail,n.stencilZPass=this.stencilZPass,n.stencilWrite=this.stencilWrite,n.polygonOffset=this.polygonOffset,n.polygonOffsetFactor=this.polygonOffsetFactor,n.polygonOffsetUnits=this.polygonOffsetUnits,n.dithering=this.dithering,n.alphaTest=this.alphaTest,n.alphaHash=this.alphaHash,n.alphaToCoverage=this.alphaToCoverage,n.premultipliedAlpha=this.premultipliedAlpha,n.forceSinglePass=this.forceSinglePass,n.allowOverride=this.allowOverride,n.visible=this.visible,n.toneMapped=this.toneMapped,n.name=this.name,this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(n.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(n.clippingPlanes=this.clippingPlanes.map(r=>r.toJSON())),this.rotation!==void 0&&(n.rotation=this.rotation),this.depthPacking!==void 0&&(n.depthPacking=this.depthPacking),this.linewidth!==void 0&&(n.linewidth=this.linewidth),this.linecap!==void 0&&(n.linecap=this.linecap),this.linejoin!==void 0&&(n.linejoin=this.linejoin),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.wireframe!==void 0&&(n.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(n.flatShading=this.flatShading),this.fog!==void 0&&(n.fog=this.fog),Object.keys(this.userData).length>0&&(n.userData=this.userData);function a(r){const s=[];for(const o in r){const c=r[o];delete c.metadata,s.push(c)}return s}if(t){const r=a(e.textures),s=a(e.images);r.length>0&&(n.textures=r),s.length>0&&(n.images=s)}return n}fromJSON(e,t){if(e.uuid!==void 0&&(this.uuid=e.uuid),e.name!==void 0&&(this.name=e.name),e.color!==void 0&&this.color!==void 0&&this.color.setHex(e.color),e.roughness!==void 0&&(this.roughness=e.roughness),e.metalness!==void 0&&(this.metalness=e.metalness),e.sheen!==void 0&&(this.sheen=e.sheen),e.sheenColor!==void 0&&(this.sheenColor=new qe().setHex(e.sheenColor)),e.sheenRoughness!==void 0&&(this.sheenRoughness=e.sheenRoughness),e.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(e.emissive),e.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(e.specular),e.specularIntensity!==void 0&&(this.specularIntensity=e.specularIntensity),e.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(e.specularColor),e.shininess!==void 0&&(this.shininess=e.shininess),e.clearcoat!==void 0&&(this.clearcoat=e.clearcoat),e.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=e.clearcoatRoughness),e.dispersion!==void 0&&(this.dispersion=e.dispersion),e.retroreflectivity!==void 0&&(this.retroreflectivity=e.retroreflectivity),e.iridescence!==void 0&&(this.iridescence=e.iridescence),e.iridescenceIOR!==void 0&&(this.iridescenceIOR=e.iridescenceIOR),e.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessRange=e.iridescenceThicknessRange),e.transmission!==void 0&&(this.transmission=e.transmission),e.thickness!==void 0&&(this.thickness=e.thickness),e.attenuationDistance!==void 0&&(this.attenuationDistance=e.attenuationDistance),e.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(e.attenuationColor),e.anisotropy!==void 0&&(this.anisotropy=e.anisotropy),e.anisotropyRotation!==void 0&&(this.anisotropyRotation=e.anisotropyRotation),e.fog!==void 0&&(this.fog=e.fog),e.flatShading!==void 0&&(this.flatShading=e.flatShading),e.blending!==void 0&&(this.blending=e.blending),e.combine!==void 0&&(this.combine=e.combine),e.side!==void 0&&(this.side=e.side),e.shadowSide!==void 0&&(this.shadowSide=e.shadowSide),e.opacity!==void 0&&(this.opacity=e.opacity),e.transparent!==void 0&&(this.transparent=e.transparent),e.alphaTest!==void 0&&(this.alphaTest=e.alphaTest),e.alphaHash!==void 0&&(this.alphaHash=e.alphaHash),e.depthFunc!==void 0&&(this.depthFunc=e.depthFunc),e.depthTest!==void 0&&(this.depthTest=e.depthTest),e.depthWrite!==void 0&&(this.depthWrite=e.depthWrite),e.colorWrite!==void 0&&(this.colorWrite=e.colorWrite),e.clippingPlanes!==void 0&&(this.clippingPlanes=e.clippingPlanes.map(n=>new xn().fromJSON(n))),e.clipIntersection!==void 0&&(this.clipIntersection=e.clipIntersection),e.clipShadows!==void 0&&(this.clipShadows=e.clipShadows),e.depthPacking!==void 0&&(this.depthPacking=e.depthPacking),e.blendSrc!==void 0&&(this.blendSrc=e.blendSrc),e.blendDst!==void 0&&(this.blendDst=e.blendDst),e.blendEquation!==void 0&&(this.blendEquation=e.blendEquation),e.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=e.blendSrcAlpha),e.blendDstAlpha!==void 0&&(this.blendDstAlpha=e.blendDstAlpha),e.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=e.blendEquationAlpha),e.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(e.blendColor),e.blendAlpha!==void 0&&(this.blendAlpha=e.blendAlpha),e.stencilWriteMask!==void 0&&(this.stencilWriteMask=e.stencilWriteMask),e.stencilFunc!==void 0&&(this.stencilFunc=e.stencilFunc),e.stencilRef!==void 0&&(this.stencilRef=e.stencilRef),e.stencilFuncMask!==void 0&&(this.stencilFuncMask=e.stencilFuncMask),e.stencilFail!==void 0&&(this.stencilFail=e.stencilFail),e.stencilZFail!==void 0&&(this.stencilZFail=e.stencilZFail),e.stencilZPass!==void 0&&(this.stencilZPass=e.stencilZPass),e.stencilWrite!==void 0&&(this.stencilWrite=e.stencilWrite),e.wireframe!==void 0&&(this.wireframe=e.wireframe),e.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=e.wireframeLinewidth),e.wireframeLinecap!==void 0&&(this.wireframeLinecap=e.wireframeLinecap),e.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=e.wireframeLinejoin),e.rotation!==void 0&&(this.rotation=e.rotation),e.linewidth!==void 0&&(this.linewidth=e.linewidth),e.linecap!==void 0&&(this.linecap=e.linecap),e.linejoin!==void 0&&(this.linejoin=e.linejoin),e.dashSize!==void 0&&(this.dashSize=e.dashSize),e.gapSize!==void 0&&(this.gapSize=e.gapSize),e.scale!==void 0&&(this.scale=e.scale),e.polygonOffset!==void 0&&(this.polygonOffset=e.polygonOffset),e.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=e.polygonOffsetFactor),e.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=e.polygonOffsetUnits),e.dithering!==void 0&&(this.dithering=e.dithering),e.alphaToCoverage!==void 0&&(this.alphaToCoverage=e.alphaToCoverage),e.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=e.premultipliedAlpha),e.forceSinglePass!==void 0&&(this.forceSinglePass=e.forceSinglePass),e.allowOverride!==void 0&&(this.allowOverride=e.allowOverride),e.visible!==void 0&&(this.visible=e.visible),e.toneMapped!==void 0&&(this.toneMapped=e.toneMapped),e.userData!==void 0&&(this.userData=e.userData),e.vertexColors!==void 0&&(typeof e.vertexColors=="number"?this.vertexColors=e.vertexColors>0:this.vertexColors=e.vertexColors),e.size!==void 0&&(this.size=e.size),e.sizeAttenuation!==void 0&&(this.sizeAttenuation=e.sizeAttenuation),e.map!==void 0&&(this.map=t[e.map]||null),e.matcap!==void 0&&(this.matcap=t[e.matcap]||null),e.alphaMap!==void 0&&(this.alphaMap=t[e.alphaMap]||null),e.bumpMap!==void 0&&(this.bumpMap=t[e.bumpMap]||null),e.bumpScale!==void 0&&(this.bumpScale=e.bumpScale),e.normalMap!==void 0&&(this.normalMap=t[e.normalMap]||null),e.normalMapType!==void 0&&(this.normalMapType=e.normalMapType),e.normalScale!==void 0){let n=e.normalScale;Array.isArray(n)===!1&&(n=[n,n]),this.normalScale=new Ge().fromArray(n)}return e.displacementMap!==void 0&&(this.displacementMap=t[e.displacementMap]||null),e.displacementScale!==void 0&&(this.displacementScale=e.displacementScale),e.displacementBias!==void 0&&(this.displacementBias=e.displacementBias),e.roughnessMap!==void 0&&(this.roughnessMap=t[e.roughnessMap]||null),e.metalnessMap!==void 0&&(this.metalnessMap=t[e.metalnessMap]||null),e.emissiveMap!==void 0&&(this.emissiveMap=t[e.emissiveMap]||null),e.emissiveIntensity!==void 0&&(this.emissiveIntensity=e.emissiveIntensity),e.specularMap!==void 0&&(this.specularMap=t[e.specularMap]||null),e.specularIntensityMap!==void 0&&(this.specularIntensityMap=t[e.specularIntensityMap]||null),e.specularColorMap!==void 0&&(this.specularColorMap=t[e.specularColorMap]||null),e.envMap!==void 0&&(this.envMap=t[e.envMap]||null),e.envMapRotation!==void 0&&this.envMapRotation.fromArray(e.envMapRotation),e.envMapIntensity!==void 0&&(this.envMapIntensity=e.envMapIntensity),e.reflectivity!==void 0&&(this.reflectivity=e.reflectivity),e.refractionRatio!==void 0&&(this.refractionRatio=e.refractionRatio),e.lightMap!==void 0&&(this.lightMap=t[e.lightMap]||null),e.lightMapIntensity!==void 0&&(this.lightMapIntensity=e.lightMapIntensity),e.aoMap!==void 0&&(this.aoMap=t[e.aoMap]||null),e.aoMapIntensity!==void 0&&(this.aoMapIntensity=e.aoMapIntensity),e.gradientMap!==void 0&&(this.gradientMap=t[e.gradientMap]||null),e.clearcoatMap!==void 0&&(this.clearcoatMap=t[e.clearcoatMap]||null),e.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=t[e.clearcoatRoughnessMap]||null),e.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=t[e.clearcoatNormalMap]||null),e.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new Ge().fromArray(e.clearcoatNormalScale)),e.iridescenceMap!==void 0&&(this.iridescenceMap=t[e.iridescenceMap]||null),e.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=t[e.iridescenceThicknessMap]||null),e.transmissionMap!==void 0&&(this.transmissionMap=t[e.transmissionMap]||null),e.thicknessMap!==void 0&&(this.thicknessMap=t[e.thicknessMap]||null),e.anisotropyMap!==void 0&&(this.anisotropyMap=t[e.anisotropyMap]||null),e.sheenColorMap!==void 0&&(this.sheenColorMap=t[e.sheenColorMap]||null),e.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=t[e.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;const t=e.clippingPlanes;let n=null;if(t!==null){const a=t.length;n=new Array(a);for(let r=0;r!==a;++r)n[r]=t[r].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}}const on=new O,Ua=new O,Ni=new O,Bi=new O;class Wo{constructor(e=new O,t=new O(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,on)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);const n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){const t=on.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(on.copy(this.origin).addScaledVector(this.direction,t),on.distanceToSquared(e))}distanceSqToSegment(e,t,n,a){Ua.copy(e).add(t).multiplyScalar(.5),Ni.copy(t).sub(e).normalize(),Bi.copy(this.origin).sub(Ua);const r=e.distanceTo(t)*.5,s=-this.direction.dot(Ni),o=Bi.dot(this.direction),c=-Bi.dot(Ni),l=Bi.lengthSq(),h=Math.abs(1-s*s);let d,u,f,v;if(h>0)if(d=s*c-o,u=s*o-c,v=r*h,d>=0)if(u>=-v)if(u<=v){const g=1/h;d*=g,u*=g,f=d*(d+s*u+2*o)+u*(s*d+u+2*c)+l}else u=r,d=Math.max(0,-(s*u+o)),f=-d*d+u*(u+2*c)+l;else u=-r,d=Math.max(0,-(s*u+o)),f=-d*d+u*(u+2*c)+l;else u<=-v?(d=Math.max(0,-(-s*r+o)),u=d>0?-r:Math.min(Math.max(-r,-c),r),f=-d*d+u*(u+2*c)+l):u<=v?(d=0,u=Math.min(Math.max(-r,-c),r),f=u*(u+2*c)+l):(d=Math.max(0,-(s*r+o)),u=d>0?r:Math.min(Math.max(-r,-c),r),f=-d*d+u*(u+2*c)+l);else u=s>0?-r:r,d=Math.max(0,-(s*u+o)),f=-d*d+u*(u+2*c)+l;return n&&n.copy(this.origin).addScaledVector(this.direction,d),a&&a.copy(Ua).addScaledVector(Ni,u),f}intersectSphere(e,t){if(e.radius<0)return null;on.subVectors(e.center,this.origin);const n=on.dot(this.direction),a=on.dot(on)-n*n,r=e.radius*e.radius;if(a>r)return null;const s=Math.sqrt(r-a),o=n-s,c=n+s;return c<0?null:o<0?this.at(c,t):this.at(o,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){const t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;const n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){const n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){const t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,a,r,s,o,c;const l=1/this.direction.x,h=1/this.direction.y,d=1/this.direction.z,u=this.origin;return l>=0?(n=(e.min.x-u.x)*l,a=(e.max.x-u.x)*l):(n=(e.max.x-u.x)*l,a=(e.min.x-u.x)*l),h>=0?(r=(e.min.y-u.y)*h,s=(e.max.y-u.y)*h):(r=(e.max.y-u.y)*h,s=(e.min.y-u.y)*h),n>s||r>a||((r>n||isNaN(n))&&(n=r),(s<a||isNaN(a))&&(a=s),d>=0?(o=(e.min.z-u.z)*d,c=(e.max.z-u.z)*d):(o=(e.max.z-u.z)*d,c=(e.min.z-u.z)*d),n>c||o>a)||((o>n||n!==n)&&(n=o),(c<a||a!==a)&&(a=c),a<0)?null:this.at(n>=0?n:a,t)}intersectsBox(e){return this.intersectBox(e,on)!==null}intersectTriangle(e,t,n,a,r){const s=this.origin,o=this.direction,c=o.x,l=o.y,h=o.z,d=e.x-s.x,u=e.y-s.y,f=e.z-s.z,v=t.x-s.x,g=t.y-s.y,p=t.z-s.z,m=n.x-s.x,M=n.y-s.y,A=n.z-s.z,w=Math.abs(c),x=Math.abs(l),S=Math.abs(h);let E,y,R,D,P,U,L,C,B,X,H,J;if(w>=x&&w>=S?(R=c,U=d,B=v,J=m,c>=0?(E=l,y=h,D=u,P=f,L=g,C=p,X=M,H=A):(E=h,y=l,D=f,P=u,L=p,C=g,X=A,H=M)):x>=S?(R=l,U=u,B=g,J=M,l>=0?(E=h,y=c,D=f,P=d,L=p,C=v,X=A,H=m):(E=c,y=h,D=d,P=f,L=v,C=p,X=m,H=A)):(R=h,U=f,B=p,J=A,h>=0?(E=c,y=l,D=d,P=u,L=v,C=g,X=m,H=M):(E=l,y=c,D=u,P=d,L=g,C=v,X=M,H=m)),R===0)return null;const j=E/R,Q=y/R,ne=1/R,Te=D-j*U,Ee=P-Q*U,it=L-j*B,Ve=C-Q*B,je=X-j*J,Y=H-Q*J,ee=je*Ve-Y*it,_e=Te*Y-Ee*je,Le=it*Ee-Ve*Te;if(a){if(ee<0||_e<0||Le<0)return null}else if((ee<0||_e<0||Le<0)&&(ee>0||_e>0||Le>0))return null;const ve=ee+_e+Le;if(ve===0)return null;const Fe=ne*(ee*U+_e*B+Le*J);return(ve>0?Fe<0:Fe>0)?null:this.at(Fe/ve,r)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class Ps extends ua{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new qe(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Cn,this.combine=0,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}}const Fr=new pe,En=new Wo,Oi=new wi,Nr=new O,zi=new O,ki=new O,Gi=new O,Ia=new O,Vi=new O,Br=new O,Hi=new O;class Ft extends Pt{constructor(e=new Yt,t=new Ps){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){const t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){const a=t[n[0]];if(a!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,s=a.length;r<s;r++){const o=a[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}getVertexPosition(e,t){const n=this.geometry,a=n.attributes.position,r=n.morphAttributes.position,s=n.morphTargetsRelative;t.fromBufferAttribute(a,e);const o=this.morphTargetInfluences;if(r&&o){Vi.set(0,0,0);for(let c=0,l=r.length;c<l;c++){const h=o[c],d=r[c];h!==0&&(Ia.fromBufferAttribute(d,e),s?Vi.addScaledVector(Ia,h):Vi.addScaledVector(Ia.sub(t),h))}t.add(Vi)}return t}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){const n=this.geometry,a=this.material,r=this.matrixWorld;a!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),Oi.copy(n.boundingSphere),Oi.applyMatrix4(r),En.copy(e.ray).recast(e.near),!(Oi.containsPoint(En.origin)===!1&&(En.intersectSphere(Oi,Nr)===null||En.origin.distanceToSquared(Nr)>(e.far-e.near)**2))&&(Fr.copy(r).invert(),En.copy(e.ray).applyMatrix4(Fr),!(n.boundingBox!==null&&En.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(e,t,En)))}_computeIntersections(e,t,n){let a;const r=this.geometry,s=this.material,o=r.index,c=r.attributes.position,l=r.attributes.uv,h=r.attributes.uv1,d=r.attributes.normal,u=r.groups,f=r.drawRange;if(o!==null)if(Array.isArray(s))for(let v=0,g=u.length;v<g;v++){const p=u[v],m=s[p.materialIndex],M=Math.max(p.start,f.start),A=Math.min(o.count,Math.min(p.start+p.count,f.start+f.count));for(let w=M,x=A;w<x;w+=3){const S=o.getX(w),E=o.getX(w+1),y=o.getX(w+2);a=Wi(this,m,e,n,l,h,d,S,E,y),a&&(a.faceIndex=Math.floor(w/3),a.face.materialIndex=p.materialIndex,t.push(a))}}else{const v=Math.max(0,f.start),g=Math.min(o.count,f.start+f.count);for(let p=v,m=g;p<m;p+=3){const M=o.getX(p),A=o.getX(p+1),w=o.getX(p+2);a=Wi(this,s,e,n,l,h,d,M,A,w),a&&(a.faceIndex=Math.floor(p/3),t.push(a))}}else if(c!==void 0)if(Array.isArray(s))for(let v=0,g=u.length;v<g;v++){const p=u[v],m=s[p.materialIndex],M=Math.max(p.start,f.start),A=Math.min(c.count,Math.min(p.start+p.count,f.start+f.count));for(let w=M,x=A;w<x;w+=3){const S=w,E=w+1,y=w+2;a=Wi(this,m,e,n,l,h,d,S,E,y),a&&(a.faceIndex=Math.floor(w/3),a.face.materialIndex=p.materialIndex,t.push(a))}}else{const v=Math.max(0,f.start),g=Math.min(c.count,f.start+f.count);for(let p=v,m=g;p<m;p+=3){const M=p,A=p+1,w=p+2;a=Wi(this,s,e,n,l,h,d,M,A,w),a&&(a.faceIndex=Math.floor(p/3),t.push(a))}}}}function Xo(i,e,t,n,a,r,s,o){let c;if(e.side===1?c=n.intersectTriangle(s,r,a,!0,o):c=n.intersectTriangle(a,r,s,e.side===0,o),c===null)return null;Hi.copy(o),Hi.applyMatrix4(i.matrixWorld);const l=t.ray.origin.distanceTo(Hi);return l<t.near||l>t.far?null:{distance:l,point:Hi.clone(),object:i}}function Wi(i,e,t,n,a,r,s,o,c,l){i.getVertexPosition(o,zi),i.getVertexPosition(c,ki),i.getVertexPosition(l,Gi);const h=Xo(i,e,t,n,zi,ki,Gi,Br);if(h){const d=new O;It.getBarycoord(Br,zi,ki,Gi,d),a&&(h.uv=It.getInterpolatedAttribute(a,o,c,l,d,new Ge)),r&&(h.uv1=It.getInterpolatedAttribute(r,o,c,l,d,new Ge)),s&&(h.normal=It.getInterpolatedAttribute(s,o,c,l,d,new O),h.normal.dot(n.direction)>0&&h.normal.multiplyScalar(-1));const u={a:o,b:c,c:l,normal:new O,materialIndex:0};It.getNormal(zi,ki,Gi,u.normal),h.face=u,h.barycoord=d}return h}class Qn extends At{constructor(e=null,t=1,n=1,a,r,s,o,c,l=1003,h=1003,d,u){super(null,s,o,c,l,h,a,r,d,u),this.isDataTexture=!0,this.image={data:e,width:t,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class oa extends jt{constructor(e,t,n,a=1){super(e,t,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=a}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){const e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}}const qn=new pe,Or=new pe,Xi=[],zr=new Un,jo=new pe,ui=new Ft,hi=new wi;class qo extends Ft{constructor(e,t,n){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new oa(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let a=0;a<n;a++)this.setMatrixAt(a,jo)}computeBoundingBox(){const e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new Un),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,qn),zr.copy(e.boundingBox).applyMatrix4(qn),this.boundingBox.union(zr)}computeBoundingSphere(){const e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new wi),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,qn),hi.copy(e.boundingSphere).applyMatrix4(qn),this.boundingSphere.union(hi)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),e.morphTexture!==null&&(this.morphTexture=e.morphTexture.clone()),e.instanceColor!==null&&(this.instanceColor=e.instanceColor.clone()),this.count=e.count,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}getColorAt(e,t){return this.instanceColor===null?t.setRGB(1,1,1):t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){return t.fromArray(this.instanceMatrix.array,e*16)}getMorphAt(e,t){const n=t.morphTargetInfluences,a=this.morphTexture.source.data.data,r=n.length+1,s=e*r+1;for(let o=0;o<n.length;o++)n[o]=a[s+o]}raycast(e,t){const n=this.matrixWorld,a=this.count;if(ui.geometry=this.geometry,ui.material=this.material,ui.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),hi.copy(this.boundingSphere),hi.applyMatrix4(n),e.ray.intersectsSphere(hi)!==!1))for(let r=0;r<a;r++){this.getMatrixAt(r,qn),Or.multiplyMatrices(n,qn),ui.matrixWorld=Or,ui.raycast(e,Xi);for(let s=0,o=Xi.length;s<o;s++){const c=Xi[s];c.instanceId=r,c.object=this,t.push(c)}Xi.length=0}}setColorAt(e,t){return this.instanceColor===null&&(this.instanceColor=new oa(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),t.toArray(this.instanceColor.array,e*3),this}setMatrixAt(e,t){return t.toArray(this.instanceMatrix.array,e*16),this}setMorphAt(e,t){const n=t.morphTargetInfluences,a=n.length+1;this.morphTexture===null&&(this.morphTexture=new Qn(new Float32Array(a*this.count),a,this.count,1028,1015));const r=this.morphTexture.source.data.data;let s=0;for(let l=0;l<n.length;l++)s+=n[l];const o=this.geometry.morphTargetsRelative?1:1-s,c=a*e;return r[c]=o,r.set(n,c+1),this}updateMorphTargets(){}dispose(){super.dispose(),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null)}}const Rn=new wi,Yo=new Ge(.5,.5),ji=new O;class Ds{constructor(e=new xn,t=new xn,n=new xn,a=new xn,r=new xn,s=new xn){this.planes=[e,t,n,a,r,s]}set(e,t,n,a,r,s){const o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(n),o[3].copy(a),o[4].copy(r),o[5].copy(s),this}copy(e){const t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=2e3,n=!1){const a=this.planes,r=e.elements,s=r[0],o=r[1],c=r[2],l=r[3],h=r[4],d=r[5],u=r[6],f=r[7],v=r[8],g=r[9],p=r[10],m=r[11],M=r[12],A=r[13],w=r[14],x=r[15];if(a[0].setComponents(l-s,f-h,m-v,x-M).normalize(),a[1].setComponents(l+s,f+h,m+v,x+M).normalize(),a[2].setComponents(l+o,f+d,m+g,x+A).normalize(),a[3].setComponents(l-o,f-d,m-g,x-A).normalize(),n)a[4].setComponents(c,u,p,w).normalize(),a[5].setComponents(l-c,f-u,m-p,x-w).normalize();else if(a[4].setComponents(l-c,f-u,m-p,x-w).normalize(),t===2e3)a[5].setComponents(l+c,f+u,m+p,x+w).normalize();else if(t===2001)a[5].setComponents(c,u,p,w).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),Rn.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{const t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),Rn.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(Rn)}intersectsSprite(e){Rn.center.set(0,0,0);const t=Yo.distanceTo(e.center);return Rn.radius=.7071067811865476+t,Rn.applyMatrix4(e.matrixWorld),this.intersectsSphere(Rn)}intersectsSphere(e){const t=this.planes,n=e.center,a=-e.radius;for(let r=0;r<6;r++)if(t[r].distanceToPoint(n)<a)return!1;return!0}intersectsBox(e){const t=this.planes;for(let n=0;n<6;n++){const a=t[n];if(ji.x=a.normal.x>0?e.max.x:e.min.x,ji.y=a.normal.y>0?e.max.y:e.min.y,ji.z=a.normal.z>0?e.max.z:e.min.z,a.distanceToPoint(ji)<0)return!1}return!0}containsPoint(e){const t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}class Us extends At{constructor(e=[],t=301,n,a,r,s,o,c,l,h){super(e,t,n,a,r,s,o,c,l,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}}class Ln extends At{constructor(e,t,n=1014,a,r,s,o=1003,c=1003,l,h=1026,d=1){if(h!==1026&&h!==1027)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");const u={width:e,height:t,depth:d};super(u,a,r,s,o,c,h,n,l),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new ar(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){const t=super.toJSON(e);return t.compareFunction=this.compareFunction,t}}class $o extends Ln{constructor(e,t=1014,n=301,a,r,s=1003,o=1003,c,l=1026){const h={width:e,height:e,depth:1},d=[h,h,h,h,h,h];super(e,e,t,n,a,r,s,o,c,l),this.image=d,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}}class Is extends At{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}}class Mi extends Yt{constructor(e=1,t=1,n=1,a=1,r=1,s=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:n,widthSegments:a,heightSegments:r,depthSegments:s};const o=this;a=Math.floor(a),r=Math.floor(r),s=Math.floor(s);const c=[],l=[],h=[],d=[];let u=0,f=0;v("z","y","x",-1,-1,n,t,e,s,r,0),v("z","y","x",1,-1,n,t,-e,s,r,1),v("x","z","y",1,1,e,n,t,a,s,2),v("x","z","y",1,-1,e,n,-t,a,s,3),v("x","y","z",1,-1,e,t,n,a,r,4),v("x","y","z",-1,-1,e,t,-n,a,r,5),this.setIndex(c),this.setAttribute("position",new qt(l,3)),this.setAttribute("normal",new qt(h,3)),this.setAttribute("uv",new qt(d,2));function v(g,p,m,M,A,w,x,S,E,y,R){const D=w/E,P=x/y,U=w/2,L=x/2,C=S/2,B=E+1,X=y+1;let H=0,J=0;const j=new O;for(let Q=0;Q<X;Q++){const ne=Q*P-L;for(let Te=0;Te<B;Te++){const Ee=Te*D-U;j[g]=Ee*M,j[p]=ne*A,j[m]=C,l.push(j.x,j.y,j.z),j[g]=0,j[p]=0,j[m]=S>0?1:-1,h.push(j.x,j.y,j.z),d.push(Te/E),d.push(1-Q/y),H+=1}}for(let Q=0;Q<y;Q++)for(let ne=0;ne<E;ne++){const Te=u+ne+B*Q,Ee=u+ne+B*(Q+1),it=u+(ne+1)+B*(Q+1),Ve=u+(ne+1)+B*Q;c.push(Te,Ee,Ve),c.push(Ee,it,Ve),J+=6}o.addGroup(f,J,R),f+=J,u+=H}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Mi(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}}class Ei extends Yt{constructor(e=1,t=1,n=1,a=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:n,heightSegments:a};const r=e/2,s=t/2,o=Math.floor(n),c=Math.floor(a),l=o+1,h=c+1,d=e/o,u=t/c,f=[],v=[],g=[],p=[];for(let m=0;m<h;m++){const M=m*u-s;for(let A=0;A<l;A++){const w=A*d-r;v.push(w,-M,0),g.push(0,0,1),p.push(A/o),p.push(1-m/c)}}for(let m=0;m<c;m++)for(let M=0;M<o;M++){const A=M+l*m,w=M+l*(m+1),x=M+1+l*(m+1),S=M+1+l*m;f.push(A,w,S),f.push(w,x,S)}this.setIndex(f),this.setAttribute("position",new qt(v,3)),this.setAttribute("normal",new qt(g,3)),this.setAttribute("uv",new qt(p,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Ei(e.width,e.height,e.widthSegments,e.heightSegments)}}function ai(i){const e={};for(const t in i){e[t]={};for(const n in i[t]){const a=i[t][n];if(kr(a))a.isRenderTargetTexture?(Ce("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][n]=null):e[t][n]=a.clone();else if(Array.isArray(a))if(kr(a[0])){const r=[];for(let s=0,o=a.length;s<o;s++)r[s]=a[s].clone();e[t][n]=r}else e[t][n]=a.slice();else e[t][n]=a}}return e}function Tt(i){const e={};for(let t=0;t<i.length;t++){const n=ai(i[t]);for(const a in n)e[a]=n[a]}return e}function kr(i){return i&&(i.isColor||i.isMatrix3||i.isMatrix4||i.isVector2||i.isVector3||i.isVector4||i.isTexture||i.isQuaternion)}function Ko(i){const e=[];for(let t=0;t<i.length;t++)e.push(i[t].clone());return e}function Fs(i){const e=i.getRenderTarget();return e===null?i.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:ke.workingColorSpace}const Zo={clone:ai,merge:Tt};var Jo=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Qo=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class tn extends ua{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Jo,this.fragmentShader=Qo,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=ai(e.uniforms),this.uniformsGroups=Ko(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){const t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(const a in this.uniforms){const s=this.uniforms[a].value;s&&s.isTexture?t.uniforms[a]={type:"t",value:s.toJSON(e).uuid}:s&&s.isColor?t.uniforms[a]={type:"c",value:s.getHex()}:s&&s.isVector2?t.uniforms[a]={type:"v2",value:s.toArray()}:s&&s.isVector3?t.uniforms[a]={type:"v3",value:s.toArray()}:s&&s.isVector4?t.uniforms[a]={type:"v4",value:s.toArray()}:s&&s.isMatrix3?t.uniforms[a]={type:"m3",value:s.toArray()}:s&&s.isMatrix4?t.uniforms[a]={type:"m4",value:s.toArray()}:t.uniforms[a]={value:s}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;const n={};for(const a in this.extensions)this.extensions[a]===!0&&(n[a]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}fromJSON(e,t){if(super.fromJSON(e,t),e.uniforms!==void 0)for(const n in e.uniforms){const a=e.uniforms[n];switch(this.uniforms[n]={},a.type){case"t":this.uniforms[n].value=t[a.value]||null;break;case"c":this.uniforms[n].value=new qe().setHex(a.value);break;case"v2":this.uniforms[n].value=new Ge().fromArray(a.value);break;case"v3":this.uniforms[n].value=new O().fromArray(a.value);break;case"v4":this.uniforms[n].value=new nt().fromArray(a.value);break;case"m3":this.uniforms[n].value=new Pe().fromArray(a.value);break;case"m4":this.uniforms[n].value=new pe().fromArray(a.value);break;default:this.uniforms[n].value=a.value}}if(e.defines!==void 0&&(this.defines=e.defines),e.vertexShader!==void 0&&(this.vertexShader=e.vertexShader),e.fragmentShader!==void 0&&(this.fragmentShader=e.fragmentShader),e.glslVersion!==void 0&&(this.glslVersion=e.glslVersion),e.extensions!==void 0)for(const n in e.extensions)this.extensions[n]=e.extensions[n];return e.lights!==void 0&&(this.lights=e.lights),e.clipping!==void 0&&(this.clipping=e.clipping),this}}class _i extends tn{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}}class el extends ua{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=3200,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}}class tl extends ua{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}}const qi=new O,Yi=new bn,Zt=new O;class or extends Pt{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new pe,this.projectionMatrix=new pe,this.projectionMatrixInverse=new pe,this.coordinateSystem=2e3,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorld.decompose(qi,Yi,Zt),Zt.x===1&&Zt.y===1&&Zt.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(qi,Yi,Zt.set(1,1,1)).invert()}updateWorldMatrix(e,t,n=!1){super.updateWorldMatrix(e,t,n),this.matrixWorld.decompose(qi,Yi,Zt),Zt.x===1&&Zt.y===1&&Zt.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(qi,Yi,Zt.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}}const yn=new O,Gr=new Ge,Vr=new Ge;class Ht extends or{constructor(e=50,t=1,n=.1,a=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=n,this.far=a,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){const t=.5*this.getFilmHeight()/e;this.fov=bi*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){const e=Math.tan(vi*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return bi*2*Math.atan(Math.tan(vi*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,n){yn.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(yn.x,yn.y).multiplyScalar(-e/yn.z),yn.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(yn.x,yn.y).multiplyScalar(-e/yn.z)}getViewSize(e,t){return this.getViewBounds(e,Gr,Vr),t.subVectors(Vr,Gr)}setViewOffset(e,t,n,a,r,s){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=a,this.view.width=r,this.view.height=s,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=this.near;let t=e*Math.tan(vi*.5*this.fov)/this.zoom,n=2*t,a=this.aspect*n,r=-.5*a;const s=this.view;if(this.view!==null&&this.view.enabled){const c=s.fullWidth,l=s.fullHeight;r+=s.offsetX*a/c,t-=s.offsetY*n/l,a*=s.width/c,n*=s.height/l}const o=this.filmOffset;o!==0&&(r+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+a,t,t-n,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}}class lr extends or{constructor(e=-1,t=1,n=1,a=-1,r=.1,s=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=a,this.near=r,this.far=s,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,a,r,s){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=a,this.view.width=r,this.view.height=s,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,a=(this.top+this.bottom)/2;let r=n-e,s=n+e,o=a+t,c=a-t;if(this.view!==null&&this.view.enabled){const l=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=l*this.view.offsetX,s=r+l*this.view.width,o-=h*this.view.offsetY,c=o-h*this.view.height}this.projectionMatrix.makeOrthographic(r,s,o,c,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}}class nl extends Yt{constructor(){super(),this.isInstancedBufferGeometry=!0,this.type="InstancedBufferGeometry",this.instanceCount=1/0}copy(e){return super.copy(e),this.instanceCount=e.instanceCount,this}toJSON(){const e=super.toJSON();return e.instanceCount=this.instanceCount,e.isInstancedBufferGeometry=!0,e}}const Yn=-90,$n=1;class il extends Pt{constructor(e,t,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;const a=new Ht(Yn,$n,e,t);a.layers=this.layers,this.add(a);const r=new Ht(Yn,$n,e,t);r.layers=this.layers,this.add(r);const s=new Ht(Yn,$n,e,t);s.layers=this.layers,this.add(s);const o=new Ht(Yn,$n,e,t);o.layers=this.layers,this.add(o);const c=new Ht(Yn,$n,e,t);c.layers=this.layers,this.add(c);const l=new Ht(Yn,$n,e,t);l.layers=this.layers,this.add(l)}updateCoordinateSystem(){const e=this.coordinateSystem,t=this.children.concat(),[n,a,r,s,o,c]=t;for(const l of t)this.remove(l);if(e===2e3)n.up.set(0,1,0),n.lookAt(1,0,0),a.up.set(0,1,0),a.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),s.up.set(0,0,1),s.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),c.up.set(0,1,0),c.lookAt(0,0,-1);else if(e===2001)n.up.set(0,-1,0),n.lookAt(-1,0,0),a.up.set(0,-1,0),a.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),s.up.set(0,0,-1),s.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),c.up.set(0,-1,0),c.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(const l of t)this.add(l),l.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();const{renderTarget:n,activeMipmapLevel:a}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());const[r,s,o,c,l,h]=this.children,d=e.getRenderTarget(),u=e.getActiveCubeFace(),f=e.getActiveMipmapLevel(),v=e.xr.enabled;e.xr.enabled=!1;const g=n.texture.generateMipmaps;n.texture.generateMipmaps=!1;let p=!1;e.isWebGLRenderer===!0?p=e.state.buffers.depth.getReversed():p=e.reversedDepthBuffer,e.setRenderTarget(n,0,a),p&&e.autoClear===!1&&e.clearDepth(),e.render(t,r),e.setRenderTarget(n,1,a),p&&e.autoClear===!1&&e.clearDepth(),e.render(t,s),e.setRenderTarget(n,2,a),p&&e.autoClear===!1&&e.clearDepth(),e.render(t,o),e.setRenderTarget(n,3,a),p&&e.autoClear===!1&&e.clearDepth(),e.render(t,c),e.setRenderTarget(n,4,a),p&&e.autoClear===!1&&e.clearDepth(),e.render(t,l),n.texture.generateMipmaps=g,e.setRenderTarget(n,5,a),p&&e.autoClear===!1&&e.clearDepth(),e.render(t,h),e.setRenderTarget(d,u,f),e.xr.enabled=v,n.texture.needsPMREMUpdate=!0}}class al extends Ht{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}}class Ns{static{Ns.prototype.isMatrix2=!0}constructor(e,t,n,a){this.elements=[1,0,0,1],e!==void 0&&this.set(e,t,n,a)}identity(){return this.set(1,0,0,1),this}fromArray(e,t=0){for(let n=0;n<4;n++)this.elements[n]=e[n+t];return this}set(e,t,n,a){const r=this.elements;return r[0]=e,r[2]=t,r[1]=n,r[3]=a,this}}function Hr(i,e,t,n){const a=rl(n);switch(t){case 1021:return i*e;case 1028:return i*e/a.components*a.byteLength;case 1029:return i*e/a.components*a.byteLength;case 1030:return i*e*2/a.components*a.byteLength;case 1031:return i*e*2/a.components*a.byteLength;case 1022:return i*e*3/a.components*a.byteLength;case 1023:return i*e*4/a.components*a.byteLength;case 1033:return i*e*4/a.components*a.byteLength;case 33776:case 33777:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*8;case 33778:case 33779:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case 35841:case 35843:return Math.max(i,16)*Math.max(e,8)/4;case 35840:case 35842:return Math.max(i,8)*Math.max(e,8)/2;case 36196:case 37492:case 37488:case 37489:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*8;case 37496:case 37490:case 37491:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case 37808:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case 37809:return Math.floor((i+4)/5)*Math.floor((e+3)/4)*16;case 37810:return Math.floor((i+4)/5)*Math.floor((e+4)/5)*16;case 37811:return Math.floor((i+5)/6)*Math.floor((e+4)/5)*16;case 37812:return Math.floor((i+5)/6)*Math.floor((e+5)/6)*16;case 37813:return Math.floor((i+7)/8)*Math.floor((e+4)/5)*16;case 37814:return Math.floor((i+7)/8)*Math.floor((e+5)/6)*16;case 37815:return Math.floor((i+7)/8)*Math.floor((e+7)/8)*16;case 37816:return Math.floor((i+9)/10)*Math.floor((e+4)/5)*16;case 37817:return Math.floor((i+9)/10)*Math.floor((e+5)/6)*16;case 37818:return Math.floor((i+9)/10)*Math.floor((e+7)/8)*16;case 37819:return Math.floor((i+9)/10)*Math.floor((e+9)/10)*16;case 37820:return Math.floor((i+11)/12)*Math.floor((e+9)/10)*16;case 37821:return Math.floor((i+11)/12)*Math.floor((e+11)/12)*16;case 36492:case 36494:case 36495:return Math.ceil(i/4)*Math.ceil(e/4)*16;case 36283:case 36284:return Math.ceil(i/4)*Math.ceil(e/4)*8;case 36285:case 36286:return Math.ceil(i/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function rl(i){switch(i){case 1009:case 1010:return{byteLength:1,components:1};case 1012:case 1011:case 1016:return{byteLength:2,components:1};case 1017:case 1018:return{byteLength:2,components:4};case 1014:case 1013:case 1015:return{byteLength:4,components:1};case 35902:case 35899:return{byteLength:4,components:3}}throw new Error(`THREE.TextureUtils: Unknown texture type ${i}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"186"}}));typeof window<"u"&&(window.__THREE__?Ce("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="186");function Bs(){let i=null,e=!1,t=null,n=null;function a(r,s){n=i.requestAnimationFrame(a),t(r,s)}return{start:function(){e!==!0&&t!==null&&i!==null&&(n=i.requestAnimationFrame(a),e=!0)},stop:function(){i!==null&&i.cancelAnimationFrame(n),e=!1},setAnimationLoop:function(r){t=r},setContext:function(r){i=r}}}function sl(i){const e=new WeakMap;function t(o,c){const l=o.array,h=o.usage,d=l.byteLength,u=i.createBuffer();i.bindBuffer(c,u),i.bufferData(c,l,h),o.onUploadCallback();let f;if(l instanceof Float32Array)f=i.FLOAT;else if(typeof Float16Array<"u"&&l instanceof Float16Array)f=i.HALF_FLOAT;else if(l instanceof Uint16Array)o.isFloat16BufferAttribute?f=i.HALF_FLOAT:f=i.UNSIGNED_SHORT;else if(l instanceof Int16Array)f=i.SHORT;else if(l instanceof Uint32Array)f=i.UNSIGNED_INT;else if(l instanceof Int32Array)f=i.INT;else if(l instanceof Int8Array)f=i.BYTE;else if(l instanceof Uint8Array)f=i.UNSIGNED_BYTE;else if(l instanceof Uint8ClampedArray)f=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+l);return{buffer:u,type:f,bytesPerElement:l.BYTES_PER_ELEMENT,version:o.version,size:d}}function n(o,c,l){const h=c.array,d=c.updateRanges;if(i.bindBuffer(l,o),d.length===0)i.bufferSubData(l,0,h);else{d.sort((f,v)=>f.start-v.start);let u=0;for(let f=1;f<d.length;f++){const v=d[u],g=d[f];g.start<=v.start+v.count+1?v.count=Math.max(v.count,g.start+g.count-v.start):(++u,d[u]=g)}d.length=u+1;for(let f=0,v=d.length;f<v;f++){const g=d[f];i.bufferSubData(l,g.start*h.BYTES_PER_ELEMENT,h,g.start,g.count)}c.clearUpdateRanges()}c.onUploadCallback()}function a(o){return o.isInterleavedBufferAttribute&&(o=o.data),e.get(o)}function r(o){o.isInterleavedBufferAttribute&&(o=o.data);const c=e.get(o);c&&(i.deleteBuffer(c.buffer),e.delete(o))}function s(o,c){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){const h=e.get(o);(!h||h.version<o.version)&&e.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}const l=e.get(o);if(l===void 0)e.set(o,t(o,c));else if(l.version<o.version){if(l.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(l.buffer,o,c),l.version=o.version}}return{get:a,remove:r,update:s}}var ol=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,ll=`#ifdef USE_ALPHAHASH
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
#endif`,cl=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,ul=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,hl=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,dl=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,fl=`#ifdef USE_AOMAP
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
#endif`,pl=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,ml=`#ifdef USE_BATCHING
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
#endif`,vl=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,gl=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,_l=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,yl=`float G_BlinnPhong_Implicit( ) {
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
} // validated`,xl=`#ifdef USE_IRIDESCENCE
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
#endif`,bl=`#ifdef USE_BUMPMAP
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
#endif`,Sl=`#if NUM_CLIPPING_PLANES > 0
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
#endif`,wl=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Ml=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,El=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,Rl=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,Tl=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,Al=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,Cl=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
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
#endif`,Ll=`#define PI 3.141592653589793
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
} // validated`,Pl=`#ifdef ENVMAP_TYPE_CUBE_UV
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
#endif`,Dl=`vec3 transformedNormal = objectNormal;
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
#endif`,Ul=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Il=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Fl=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Nl=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Bl="gl_FragColor = linearToOutputTexel( gl_FragColor );",Ol=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,zl=`#ifdef USE_ENVMAP
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
#endif`,kl=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,Gl=`#ifdef USE_ENVMAP
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
#endif`,Vl=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Hl=`#ifdef USE_ENVMAP
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
#endif`,Wl=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Xl=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,jl=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,ql=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Yl=`#ifdef USE_GRADIENTMAP
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
}`,$l=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Kl=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Zl=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Jl=`uniform bool receiveShadow;
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
#include <lightprobes_pars_fragment>`,Ql=`#ifdef USE_ENVMAP
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
#endif`,ec=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,tc=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,nc=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,ic=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,ac=`PhysicalMaterial material;
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
#endif`,rc=`uniform sampler2D dfgLUT;
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
}`,sc=`
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
#endif`,oc=`#if defined( RE_IndirectDiffuse )
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
#endif`,lc=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,cc=`#ifdef USE_LIGHT_PROBES_GRID
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
#endif`,uc=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,hc=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,dc=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,fc=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,pc=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,mc=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,vc=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
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
#endif`,gc=`#if defined( USE_POINTS_UV )
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
#endif`,_c=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,yc=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,xc=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,bc=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Sc=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,wc=`#ifdef USE_MORPHTARGETS
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
#endif`,Mc=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Ec=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
vec3 nonPerturbedNormal = normal;`,Rc=`#ifdef USE_NORMALMAP_OBJECTSPACE
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
#endif`,Tc=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Ac=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Cc=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,Lc=`#ifdef USE_NORMALMAP
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
#endif`,Pc=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,Dc=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Uc=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,Ic=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Fc=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Nc=`vec3 packNormalToRGB( const in vec3 normal ) {
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
}`,Bc=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Oc=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,zc=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,kc=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Gc=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Vc=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Hc=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,Wc=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,Xc=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
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
#endif`,jc=`float getShadowMask() {
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
}`,qc=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,Yc=`#ifdef USE_SKINNING
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
#endif`,$c=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,Kc=`#ifdef USE_SKINNING
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
#endif`,Zc=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,Jc=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,Qc=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,e0=`#ifndef saturate
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,t0=`#ifdef USE_TRANSMISSION
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
#endif`,n0=`#ifdef USE_TRANSMISSION
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
#endif`,i0=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,a0=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,r0=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,s0=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const o0=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,l0=`uniform sampler2D t2D;
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
}`,c0=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,u0=`#ifdef ENVMAP_TYPE_CUBE
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
}`,h0=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,d0=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,f0=`#include <common>
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
}`,p0=`#if DEPTH_PACKING == 3200
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
}`,m0=`#define DISTANCE
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
}`,v0=`#define DISTANCE
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
}`,g0=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,_0=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,y0=`uniform float scale;
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
}`,x0=`uniform vec3 diffuse;
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
}`,b0=`#include <common>
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
}`,S0=`uniform vec3 diffuse;
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
}`,w0=`#define LAMBERT
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
}`,M0=`#define LAMBERT
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
}`,E0=`#define MATCAP
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
}`,R0=`#define MATCAP
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
}`,T0=`#define NORMAL
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
}`,A0=`#define NORMAL
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
}`,C0=`#define PHONG
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
}`,L0=`#define PHONG
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
}`,P0=`#define STANDARD
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
}`,D0=`#define STANDARD
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
}`,U0=`#define TOON
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
}`,I0=`#define TOON
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
}`,F0=`uniform float size;
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
}`,N0=`uniform vec3 diffuse;
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
}`,B0=`#include <common>
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
}`,O0=`uniform vec3 color;
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
}`,z0=`uniform float rotation;
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
}`,k0=`uniform vec3 diffuse;
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
}`,Ie={alphahash_fragment:ol,alphahash_pars_fragment:ll,alphamap_fragment:cl,alphamap_pars_fragment:ul,alphatest_fragment:hl,alphatest_pars_fragment:dl,aomap_fragment:fl,aomap_pars_fragment:pl,batching_pars_vertex:ml,batching_vertex:vl,begin_vertex:gl,beginnormal_vertex:_l,bsdfs:yl,iridescence_fragment:xl,bumpmap_pars_fragment:bl,clipping_planes_fragment:Sl,clipping_planes_pars_fragment:wl,clipping_planes_pars_vertex:Ml,clipping_planes_vertex:El,color_fragment:Rl,color_pars_fragment:Tl,color_pars_vertex:Al,color_vertex:Cl,common:Ll,cube_uv_reflection_fragment:Pl,defaultnormal_vertex:Dl,displacementmap_pars_vertex:Ul,displacementmap_vertex:Il,emissivemap_fragment:Fl,emissivemap_pars_fragment:Nl,colorspace_fragment:Bl,colorspace_pars_fragment:Ol,envmap_fragment:zl,envmap_common_pars_fragment:kl,envmap_pars_fragment:Gl,envmap_pars_vertex:Vl,envmap_physical_pars_fragment:Ql,envmap_vertex:Hl,fog_vertex:Wl,fog_pars_vertex:Xl,fog_fragment:jl,fog_pars_fragment:ql,gradientmap_pars_fragment:Yl,lightmap_pars_fragment:$l,lights_lambert_fragment:Kl,lights_lambert_pars_fragment:Zl,lights_pars_begin:Jl,lights_toon_fragment:ec,lights_toon_pars_fragment:tc,lights_phong_fragment:nc,lights_phong_pars_fragment:ic,lights_physical_fragment:ac,lights_physical_pars_fragment:rc,lights_fragment_begin:sc,lights_fragment_maps:oc,lights_fragment_end:lc,lightprobes_pars_fragment:cc,logdepthbuf_fragment:uc,logdepthbuf_pars_fragment:hc,logdepthbuf_pars_vertex:dc,logdepthbuf_vertex:fc,map_fragment:pc,map_pars_fragment:mc,map_particle_fragment:vc,map_particle_pars_fragment:gc,metalnessmap_fragment:_c,metalnessmap_pars_fragment:yc,morphinstance_vertex:xc,morphcolor_vertex:bc,morphnormal_vertex:Sc,morphtarget_pars_vertex:wc,morphtarget_vertex:Mc,normal_fragment_begin:Ec,normal_fragment_maps:Rc,normal_pars_fragment:Tc,normal_pars_vertex:Ac,normal_vertex:Cc,normalmap_pars_fragment:Lc,clearcoat_normal_fragment_begin:Pc,clearcoat_normal_fragment_maps:Dc,clearcoat_pars_fragment:Uc,iridescence_pars_fragment:Ic,opaque_fragment:Fc,packing:Nc,premultiplied_alpha_fragment:Bc,project_vertex:Oc,dithering_fragment:zc,dithering_pars_fragment:kc,roughnessmap_fragment:Gc,roughnessmap_pars_fragment:Vc,shadowmap_pars_fragment:Hc,shadowmap_pars_vertex:Wc,shadowmap_vertex:Xc,shadowmask_pars_fragment:jc,skinbase_vertex:qc,skinning_pars_vertex:Yc,skinning_vertex:$c,skinnormal_vertex:Kc,specularmap_fragment:Zc,specularmap_pars_fragment:Jc,tonemapping_fragment:Qc,tonemapping_pars_fragment:e0,transmission_fragment:t0,transmission_pars_fragment:n0,uv_pars_fragment:i0,uv_pars_vertex:a0,uv_vertex:r0,worldpos_vertex:s0,background_vert:o0,background_frag:l0,backgroundCube_vert:c0,backgroundCube_frag:u0,cube_vert:h0,cube_frag:d0,depth_vert:f0,depth_frag:p0,distance_vert:m0,distance_frag:v0,equirect_vert:g0,equirect_frag:_0,linedashed_vert:y0,linedashed_frag:x0,meshbasic_vert:b0,meshbasic_frag:S0,meshlambert_vert:w0,meshlambert_frag:M0,meshmatcap_vert:E0,meshmatcap_frag:R0,meshnormal_vert:T0,meshnormal_frag:A0,meshphong_vert:C0,meshphong_frag:L0,meshphysical_vert:P0,meshphysical_frag:D0,meshtoon_vert:U0,meshtoon_frag:I0,points_vert:F0,points_frag:N0,shadow_vert:B0,shadow_frag:O0,sprite_vert:z0,sprite_frag:k0},ue={common:{diffuse:{value:new qe(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Pe},alphaMap:{value:null},alphaMapTransform:{value:new Pe},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Pe}},envmap:{envMap:{value:null},envMapRotation:{value:new Pe},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Pe}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Pe}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Pe},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Pe},normalScale:{value:new Ge(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Pe},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Pe}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Pe}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Pe}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new qe(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new O},probesMax:{value:new O},probesResolution:{value:new O}},points:{diffuse:{value:new qe(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Pe},alphaTest:{value:0},uvTransform:{value:new Pe}},sprite:{diffuse:{value:new qe(16777215)},opacity:{value:1},center:{value:new Ge(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Pe},alphaMap:{value:null},alphaMapTransform:{value:new Pe},alphaTest:{value:0}}},en={basic:{uniforms:Tt([ue.common,ue.specularmap,ue.envmap,ue.aomap,ue.lightmap,ue.fog]),vertexShader:Ie.meshbasic_vert,fragmentShader:Ie.meshbasic_frag},lambert:{uniforms:Tt([ue.common,ue.specularmap,ue.envmap,ue.aomap,ue.lightmap,ue.emissivemap,ue.bumpmap,ue.normalmap,ue.displacementmap,ue.fog,ue.lights,{emissive:{value:new qe(0)},envMapIntensity:{value:1}}]),vertexShader:Ie.meshlambert_vert,fragmentShader:Ie.meshlambert_frag},phong:{uniforms:Tt([ue.common,ue.specularmap,ue.envmap,ue.aomap,ue.lightmap,ue.emissivemap,ue.bumpmap,ue.normalmap,ue.displacementmap,ue.fog,ue.lights,{emissive:{value:new qe(0)},specular:{value:new qe(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:Ie.meshphong_vert,fragmentShader:Ie.meshphong_frag},standard:{uniforms:Tt([ue.common,ue.envmap,ue.aomap,ue.lightmap,ue.emissivemap,ue.bumpmap,ue.normalmap,ue.displacementmap,ue.roughnessmap,ue.metalnessmap,ue.fog,ue.lights,{emissive:{value:new qe(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Ie.meshphysical_vert,fragmentShader:Ie.meshphysical_frag},toon:{uniforms:Tt([ue.common,ue.aomap,ue.lightmap,ue.emissivemap,ue.bumpmap,ue.normalmap,ue.displacementmap,ue.gradientmap,ue.fog,ue.lights,{emissive:{value:new qe(0)}}]),vertexShader:Ie.meshtoon_vert,fragmentShader:Ie.meshtoon_frag},matcap:{uniforms:Tt([ue.common,ue.bumpmap,ue.normalmap,ue.displacementmap,ue.fog,{matcap:{value:null}}]),vertexShader:Ie.meshmatcap_vert,fragmentShader:Ie.meshmatcap_frag},points:{uniforms:Tt([ue.points,ue.fog]),vertexShader:Ie.points_vert,fragmentShader:Ie.points_frag},dashed:{uniforms:Tt([ue.common,ue.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Ie.linedashed_vert,fragmentShader:Ie.linedashed_frag},depth:{uniforms:Tt([ue.common,ue.displacementmap]),vertexShader:Ie.depth_vert,fragmentShader:Ie.depth_frag},normal:{uniforms:Tt([ue.common,ue.bumpmap,ue.normalmap,ue.displacementmap,{opacity:{value:1}}]),vertexShader:Ie.meshnormal_vert,fragmentShader:Ie.meshnormal_frag},sprite:{uniforms:Tt([ue.sprite,ue.fog]),vertexShader:Ie.sprite_vert,fragmentShader:Ie.sprite_frag},background:{uniforms:{uvTransform:{value:new Pe},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Ie.background_vert,fragmentShader:Ie.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Pe}},vertexShader:Ie.backgroundCube_vert,fragmentShader:Ie.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Ie.cube_vert,fragmentShader:Ie.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Ie.equirect_vert,fragmentShader:Ie.equirect_frag},distance:{uniforms:Tt([ue.common,ue.displacementmap,{referencePosition:{value:new O},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Ie.distance_vert,fragmentShader:Ie.distance_frag},shadow:{uniforms:Tt([ue.lights,ue.fog,{color:{value:new qe(0)},opacity:{value:1}}]),vertexShader:Ie.shadow_vert,fragmentShader:Ie.shadow_frag}};en.physical={uniforms:Tt([en.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Pe},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Pe},clearcoatNormalScale:{value:new Ge(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Pe},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Pe},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Pe},sheen:{value:0},sheenColor:{value:new qe(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Pe},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Pe},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Pe},transmissionSamplerSize:{value:new Ge},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Pe},attenuationDistance:{value:0},attenuationColor:{value:new qe(0)},specularColor:{value:new qe(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Pe},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Pe},anisotropyVector:{value:new Ge},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Pe}}]),vertexShader:Ie.meshphysical_vert,fragmentShader:Ie.meshphysical_frag};const $i={r:0,b:0,g:0},G0=new pe,Os=new Pe;Os.set(-1,0,0,0,1,0,0,0,1);function V0(i,e,t,n,a,r){const s=new qe(0);let o=a===!0?0:1,c,l,h=null,d=0,u=null;function f(M){let A=M.isScene===!0?M.background:null;if(A&&A.isTexture){const w=M.backgroundBlurriness>0;A=e.get(A,w)}return A}function v(M){let A=!1;const w=f(M);w===null?p(s,o):w&&w.isColor&&(p(w,1),A=!0);const x=i.xr.getEnvironmentBlendMode();x==="additive"?t.buffers.color.setClear(0,0,0,1,r):x==="alpha-blend"&&t.buffers.color.setClear(0,0,0,0,r),(i.autoClear||A)&&(t.buffers.depth.setTest(!0),t.buffers.depth.setMask(!0),t.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}function g(M,A){const w=f(A);w&&(w.isCubeTexture||w.mapping===306)?(l===void 0&&(l=new Ft(new Mi(1,1,1),new tn({name:"BackgroundCubeMaterial",uniforms:ai(en.backgroundCube.uniforms),vertexShader:en.backgroundCube.vertexShader,fragmentShader:en.backgroundCube.fragmentShader,side:1,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),l.geometry.deleteAttribute("uv"),l.onBeforeRender=function(x,S,E){this.matrixWorld.copyPosition(E.matrixWorld)},Object.defineProperty(l.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),n.update(l)),l.material.uniforms.envMap.value=w,l.material.uniforms.backgroundBlurriness.value=A.backgroundBlurriness,l.material.uniforms.backgroundIntensity.value=A.backgroundIntensity,l.material.uniforms.backgroundRotation.value.setFromMatrix4(G0.makeRotationFromEuler(A.backgroundRotation)).transpose(),w.isCubeTexture&&w.isRenderTargetTexture===!1&&l.material.uniforms.backgroundRotation.value.premultiply(Os),l.material.toneMapped=ke.getTransfer(w.colorSpace)!==Je,(h!==w||d!==w.version||u!==i.toneMapping)&&(l.material.needsUpdate=!0,h=w,d=w.version,u=i.toneMapping),l.layers.enableAll(),M.unshift(l,l.geometry,l.material,0,0,null)):w&&w.isTexture&&(c===void 0&&(c=new Ft(new Ei(2,2),new tn({name:"BackgroundMaterial",uniforms:ai(en.background.uniforms),vertexShader:en.background.vertexShader,fragmentShader:en.background.fragmentShader,side:0,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),n.update(c)),c.material.uniforms.t2D.value=w,c.material.uniforms.backgroundIntensity.value=A.backgroundIntensity,c.material.toneMapped=ke.getTransfer(w.colorSpace)!==Je,w.matrixAutoUpdate===!0&&w.updateMatrix(),c.material.uniforms.uvTransform.value.copy(w.matrix),(h!==w||d!==w.version||u!==i.toneMapping)&&(c.material.needsUpdate=!0,h=w,d=w.version,u=i.toneMapping),c.layers.enableAll(),M.unshift(c,c.geometry,c.material,0,0,null))}function p(M,A){M.getRGB($i,Fs(i)),t.buffers.color.setClear($i.r,$i.g,$i.b,A,r)}function m(){l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0),c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0)}return{getClearColor:function(){return s},setClearColor:function(M,A=1){s.set(M),o=A,p(s,o)},getClearAlpha:function(){return o},setClearAlpha:function(M){o=M,p(s,o)},render:v,addToRenderList:g,dispose:m}}function H0(i,e){const t=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},a=u(null);let r=a,s=!1;function o(P,U,L,C,B){let X=!1;const H=d(P,C,L,U);r!==H&&(r=H,l(r.object)),X=f(P,C,L,B),X&&v(P,C,L,B),B!==null&&e.update(B,i.ELEMENT_ARRAY_BUFFER),(X||s)&&(s=!1,w(P,U,L,C),B!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,e.get(B).buffer))}function c(){return i.createVertexArray()}function l(P){return i.bindVertexArray(P)}function h(P){return i.deleteVertexArray(P)}function d(P,U,L,C){const B=C.wireframe===!0;let X=n[U.id];X===void 0&&(X={},n[U.id]=X);const H=P.isInstancedMesh===!0?P.id:0;let J=X[H];J===void 0&&(J={},X[H]=J);let j=J[L.id];j===void 0&&(j={},J[L.id]=j);let Q=j[B];return Q===void 0&&(Q=u(c()),j[B]=Q),Q}function u(P){const U=[],L=[],C=[];for(let B=0;B<t;B++)U[B]=0,L[B]=0,C[B]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:U,enabledAttributes:L,attributeDivisors:C,object:P,attributes:{},index:null}}function f(P,U,L,C){const B=r.attributes,X=U.attributes;let H=0;const J=L.getAttributes();for(const j in J)if(J[j].location>=0){const ne=B[j];let Te=X[j];if(Te===void 0&&(j==="instanceMatrix"&&P.instanceMatrix&&(Te=P.instanceMatrix),j==="instanceColor"&&P.instanceColor&&(Te=P.instanceColor)),ne===void 0||ne.attribute!==Te||Te&&ne.data!==Te.data)return!0;H++}return r.attributesNum!==H||r.index!==C}function v(P,U,L,C){const B={},X=U.attributes;let H=0;const J=L.getAttributes();for(const j in J)if(J[j].location>=0){let ne=X[j];ne===void 0&&(j==="instanceMatrix"&&P.instanceMatrix&&(ne=P.instanceMatrix),j==="instanceColor"&&P.instanceColor&&(ne=P.instanceColor));const Te={};Te.attribute=ne,ne&&ne.data&&(Te.data=ne.data),B[j]=Te,H++}r.attributes=B,r.attributesNum=H,r.index=C}function g(){const P=r.newAttributes;for(let U=0,L=P.length;U<L;U++)P[U]=0}function p(P){m(P,0)}function m(P,U){const L=r.newAttributes,C=r.enabledAttributes,B=r.attributeDivisors;L[P]=1,C[P]===0&&(i.enableVertexAttribArray(P),C[P]=1),B[P]!==U&&(i.vertexAttribDivisor(P,U),B[P]=U)}function M(){const P=r.newAttributes,U=r.enabledAttributes;for(let L=0,C=U.length;L<C;L++)U[L]!==P[L]&&(i.disableVertexAttribArray(L),U[L]=0)}function A(P,U,L,C,B,X,H){H===!0?i.vertexAttribIPointer(P,U,L,B,X):i.vertexAttribPointer(P,U,L,C,B,X)}function w(P,U,L,C){g();const B=C.attributes,X=L.getAttributes(),H=U.defaultAttributeValues;for(const J in X){const j=X[J];if(j.location>=0){let Q=B[J];if(Q===void 0&&(J==="instanceMatrix"&&P.instanceMatrix&&(Q=P.instanceMatrix),J==="instanceColor"&&P.instanceColor&&(Q=P.instanceColor)),Q!==void 0){const ne=Q.normalized,Te=Q.itemSize,Ee=e.get(Q);if(Ee===void 0)continue;const it=Ee.buffer,Ve=Ee.type,je=Ee.bytesPerElement,Y=Ve===i.INT||Ve===i.UNSIGNED_INT||Q.gpuType===1013;if(Q.isInterleavedBufferAttribute){const ee=Q.data,_e=ee.stride,Le=Q.offset;if(ee.isInstancedInterleavedBuffer){for(let ve=0;ve<j.locationSize;ve++)m(j.location+ve,ee.meshPerAttribute);P.isInstancedMesh!==!0&&C._maxInstanceCount===void 0&&(C._maxInstanceCount=ee.meshPerAttribute*ee.count)}else for(let ve=0;ve<j.locationSize;ve++)p(j.location+ve);i.bindBuffer(i.ARRAY_BUFFER,it);for(let ve=0;ve<j.locationSize;ve++)A(j.location+ve,Te/j.locationSize,Ve,ne,_e*je,(Le+Te/j.locationSize*ve)*je,Y)}else{if(Q.isInstancedBufferAttribute){for(let ee=0;ee<j.locationSize;ee++)m(j.location+ee,Q.meshPerAttribute);P.isInstancedMesh!==!0&&C._maxInstanceCount===void 0&&(C._maxInstanceCount=Q.meshPerAttribute*Q.count)}else for(let ee=0;ee<j.locationSize;ee++)p(j.location+ee);i.bindBuffer(i.ARRAY_BUFFER,it);for(let ee=0;ee<j.locationSize;ee++)A(j.location+ee,Te/j.locationSize,Ve,ne,Te*je,Te/j.locationSize*ee*je,Y)}}else if(H!==void 0){const ne=H[J];if(ne!==void 0)switch(ne.length){case 2:i.vertexAttrib2fv(j.location,ne);break;case 3:i.vertexAttrib3fv(j.location,ne);break;case 4:i.vertexAttrib4fv(j.location,ne);break;default:i.vertexAttrib1fv(j.location,ne)}}}}M()}function x(){R();for(const P in n){const U=n[P];for(const L in U){const C=U[L];for(const B in C){const X=C[B];for(const H in X)h(X[H].object),delete X[H];delete C[B]}}delete n[P]}}function S(P){if(n[P.id]===void 0)return;const U=n[P.id];for(const L in U){const C=U[L];for(const B in C){const X=C[B];for(const H in X)h(X[H].object),delete X[H];delete C[B]}}delete n[P.id]}function E(P){for(const U in n){const L=n[U];for(const C in L){const B=L[C];if(B[P.id]===void 0)continue;const X=B[P.id];for(const H in X)h(X[H].object),delete X[H];delete B[P.id]}}}function y(P){for(const U in n){const L=n[U],C=P.isInstancedMesh===!0?P.id:0,B=L[C];if(B!==void 0){for(const X in B){const H=B[X];for(const J in H)h(H[J].object),delete H[J];delete B[X]}delete L[C],Object.keys(L).length===0&&delete n[U]}}}function R(){D(),s=!0,r!==a&&(r=a,l(r.object))}function D(){a.geometry=null,a.program=null,a.wireframe=!1}return{setup:o,reset:R,resetDefaultState:D,dispose:x,releaseStatesOfGeometry:S,releaseStatesOfObject:y,releaseStatesOfProgram:E,initAttributes:g,enableAttribute:p,disableUnusedAttributes:M}}function W0(i,e,t){let n;function a(c){n=c}function r(c,l){i.drawArrays(n,c,l),t.update(l,n,1)}function s(c,l,h){h!==0&&(i.drawArraysInstanced(n,c,l,h),t.update(l,n,h))}function o(c,l,h){if(h===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,c,0,l,0,h);let u=0;for(let f=0;f<h;f++)u+=l[f];t.update(u,n,1)}this.setMode=a,this.render=r,this.renderInstances=s,this.renderMultiDraw=o}function X0(i,e,t,n){let a;function r(){if(a!==void 0)return a;if(e.has("EXT_texture_filter_anisotropic")===!0){const E=e.get("EXT_texture_filter_anisotropic");a=i.getParameter(E.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else a=0;return a}function s(E){return!(E!==1023&&n.convert(E)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(E){const y=E===1016&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(E!==1009&&E!==1015&&!y&&n.convert(E)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE))}function c(E){if(E==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";E="mediump"}return E==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let l=t.precision!==void 0?t.precision:"highp";const h=c(l);h!==l&&(Ce("WebGLRenderer:",l,"not supported, using",h,"instead."),l=h);const d=t.logarithmicDepthBuffer===!0,u=t.reversedDepthBuffer===!0&&e.has("EXT_clip_control");t.reversedDepthBuffer===!0&&u===!1&&Ce("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.");const f=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),v=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),g=i.getParameter(i.MAX_TEXTURE_SIZE),p=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),m=i.getParameter(i.MAX_VERTEX_ATTRIBS),M=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),A=i.getParameter(i.MAX_VARYING_VECTORS),w=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),x=i.getParameter(i.MAX_SAMPLES),S=i.getParameter(i.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:c,textureFormatReadable:s,textureTypeReadable:o,precision:l,logarithmicDepthBuffer:d,reversedDepthBuffer:u,maxTextures:f,maxVertexTextures:v,maxTextureSize:g,maxCubemapSize:p,maxAttributes:m,maxVertexUniforms:M,maxVaryings:A,maxFragmentUniforms:w,maxSamples:x,samples:S}}function j0(i){const e=this;let t=null,n=0,a=!1,r=!1;const s=new xn,o=new Pe,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(d,u){const f=d.length!==0||u||n!==0||a;return a=u,n=d.length,f},this.beginShadows=function(){r=!0,h(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(d,u){t=h(d,u,0)},this.setState=function(d,u,f){const v=d.clippingPlanes,g=d.clipIntersection,p=d.clipShadows,m=i.get(d);if(!a||v===null||v.length===0||r&&!p)r?h(null):l();else{const M=r?0:n,A=M*4;let w=m.clippingState||null;c.value=w,w=h(v,u,A,f);for(let x=0;x!==A;++x)w[x]=t[x];m.clippingState=w,this.numIntersection=g?this.numPlanes:0,this.numPlanes+=M}};function l(){c.value!==t&&(c.value=t,c.needsUpdate=n>0),e.numPlanes=n,e.numIntersection=0}function h(d,u,f,v){const g=d!==null?d.length:0;let p=null;if(g!==0){if(p=c.value,v!==!0||p===null){const m=f+g*4,M=u.matrixWorldInverse;o.getNormalMatrix(M),(p===null||p.length<m)&&(p=new Float32Array(m));for(let A=0,w=f;A!==g;++A,w+=4)s.copy(d[A]).applyMatrix4(M,o),s.normal.toArray(p,w),p[w+3]=s.constant}c.value=p,c.needsUpdate=!0}return e.numPlanes=g,e.numIntersection=0,p}}const ei=4,q0=6,Y0=20,$0=256,di=new lr,Wr=new qe;let Fa=null,Na=0,Ba=0,Oa=!1;const K0=new O,Tn=new O;class Xr{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(e,t=0,n=.1,a=100,r={}){const{size:s=256,position:o=K0}=r;Fa=this._renderer.getRenderTarget(),Na=this._renderer.getActiveCubeFace(),Ba=this._renderer.getActiveMipmapLevel(),Oa=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(s);const c=this._allocateTargets();return c.depthBuffer=!0,this._sceneToCubeUV(e,n,a,c,o),t>0&&this._blur(c,0,0,t),this._applyPMREM(c),this._cleanup(c),c}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Yr(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=qr(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodMeshes.length;e++)this._lodMeshes[e].geometry.dispose()}_cleanup(e){this._renderer.setRenderTarget(Fa,Na,Ba),this._renderer.xr.enabled=Oa,e.scissorTest=!1,Kn(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===301||e.mapping===302?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),Fa=this._renderer.getRenderTarget(),Na=this._renderer.getActiveCubeFace(),Ba=this._renderer.getActiveMipmapLevel(),Oa=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const n=t||this._allocateTargets();return this._textureToCubeUV(e,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){const e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,n={magFilter:1006,minFilter:1006,generateMipmaps:!1,type:1016,format:1023,colorSpace:xi,depthBuffer:!1},a=jr(e,t,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=jr(e,t,n);const{_lodMax:r}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods}=Z0(r)),this._blurMaterial=Q0(r,e,t),this._ggxMaterial=J0(r,e,t)}return a}_compileMaterial(e){const t=new Ft(new Yt,e);this._renderer.compile(t,di)}_sceneToCubeUV(e,t,n,a,r){const c=new Ht(90,1,t,n),l=[1,-1,1,1,1,1],h=[1,1,1,-1,-1,-1],d=this._renderer,u=d.autoClear,f=d.toneMapping;d.getClearColor(Wr),d.toneMapping=0,d.autoClear=!1,d.state.buffers.depth.getReversed()&&(d.setRenderTarget(a),d.clearDepth(),d.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new Ft(new Mi,new Ps({name:"PMREM.Background",side:1,depthWrite:!1,depthTest:!1})));const g=this._backgroundBox,p=g.material;let m=!1;const M=e.background;M?M.isColor&&(p.color.copy(M),e.background=null,m=!0):(p.color.copy(Wr),m=!0);for(let A=0;A<6;A++){const w=A%3;w===0?(c.up.set(0,l[A],0),c.position.set(r.x,r.y,r.z),c.lookAt(r.x+h[A],r.y,r.z)):w===1?(c.up.set(0,0,l[A]),c.position.set(r.x,r.y,r.z),c.lookAt(r.x,r.y+h[A],r.z)):(c.up.set(0,l[A],0),c.position.set(r.x,r.y,r.z),c.lookAt(r.x,r.y,r.z+h[A]));const x=this._cubeSize;Kn(a,w*x,A>2?x:0,x,x),d.setRenderTarget(a),m&&d.render(g,c),d.render(e,c)}d.toneMapping=f,d.autoClear=u,e.background=M}_textureToCubeUV(e,t){const n=this._renderer,a=e.mapping===301||e.mapping===302;a?(this._cubemapMaterial===null&&(this._cubemapMaterial=Yr()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=qr());const r=a?this._cubemapMaterial:this._equirectMaterial,s=this._lodMeshes[0];s.material=r;const o=r.uniforms;o.envMap.value=e;const c=this._cubeSize;Kn(t,0,0,3*c,2*c),n.setRenderTarget(t),n.render(s,di)}_applyPMREM(e){const t=this._renderer,n=t.autoClear;t.autoClear=!1;const a=this._lodMeshes.length;for(let r=1;r<a;r++)this._applyGGXFilter(e,r-1,r);t.autoClear=n}_applyGGXFilter(e,t,n){const a=this._renderer,r=this._pingPongRenderTarget,s=this._ggxMaterial,o=this._lodMeshes[n];o.material=s;const c=s.uniforms,l=n/(this._lodMeshes.length-1),h=t/(this._lodMeshes.length-1),d=Math.sqrt(l*l-h*h),u=l*1.25,f=d*u,{_lodMax:v}=this,g=this._sizeLods[n],p=3*g*(n>v-ei?n-v+ei:0),m=4*(this._cubeSize-g);c.envMap.value=e.texture,c.roughness.value=f,c.mipInt.value=v-t,Kn(r,p,m,3*g,2*g),a.setRenderTarget(r),a.render(o,di),c.envMap.value=r.texture,c.roughness.value=0,c.mipInt.value=v-n,Kn(e,p,m,3*g,2*g),a.setRenderTarget(e),a.render(o,di)}_blur(e,t,n,a){const r=this._pingPongRenderTarget,s=Math.min(a,Math.PI)/Math.SQRT2;this._blurPass(e,r,t,n,s),this._blurPass(r,e,n,n,s)}_blurPass(e,t,n,a,r){const s=this._renderer,o=this._blurMaterial,c=this._lodMeshes[a];c.material=o;const l=o.uniforms;l.envMap.value=e.texture,l.sigma.value=r,l.mipInt.value=this._lodMax-n;const h=this._sizeLods[a],d=3*h*(a>this._lodMax-ei?a-this._lodMax+ei:0),u=4*(this._cubeSize-h);Kn(t,d,u,3*h,2*h),s.setRenderTarget(t),s.render(c,di)}}function Z0(i){const e=[],t=[];let n=i;const a=i-ei+1+q0;for(let r=0;r<a;r++){const s=Math.pow(2,n);e.push(s);const o=1/(s-2),c=-o,l=1+o,h=[c,c,l,c,l,l,c,c,l,l,c,l],d=6,u=6,f=3,v=new Float32Array(f*u*d),g=new Float32Array(f*u*d);for(let m=0;m<d;m++){const M=m%3*2/3-1,A=m>2?0:-1,w=[M,A,0,M+2/3,A,0,M+2/3,A+1,0,M,A,0,M+2/3,A+1,0,M,A+1,0];v.set(w,f*u*m);for(let x=0;x<u;x++){const S=h[x*2]*2-1,E=h[x*2+1]*2-1;m===0?Tn.set(1,E,S):m===1?Tn.set(-S,1,-E):m===2?Tn.set(-S,E,1):m===3?Tn.set(-1,E,-S):m===4?Tn.set(-S,-1,E):Tn.set(S,E,-1),Tn.toArray(g,(m*u+x)*f)}}const p=new Yt;p.setAttribute("position",new jt(v,f)),p.setAttribute("outputDirection",new jt(g,f)),t.push(new Ft(p,null)),n>ei&&n--}return{lodMeshes:t,sizeLods:e}}function jr(i,e,t){const n=new Lt(i,e,t);return n.texture.mapping=306,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function Kn(i,e,t,n,a){i.viewport.set(e,t,n,a),i.scissor.set(e,t,n,a)}function J0(i,e,t){return new tn({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:$0,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:ha(),fragmentShader:`

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
		`,blending:0,depthTest:!1,depthWrite:!1})}function Q0(i,e,t){return new tn({name:"SphericalGaussianBlur",defines:{SAMPLES:Y0,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},sigma:{value:0},mipInt:{value:0}},vertexShader:ha(),fragmentShader:`

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
		`,blending:0,depthTest:!1,depthWrite:!1})}function qr(){return new tn({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:ha(),fragmentShader:`

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
		`,blending:0,depthTest:!1,depthWrite:!1})}function Yr(){return new tn({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:ha(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:0,depthTest:!1,depthWrite:!1})}function ha(){return`

		precision mediump float;
		precision mediump int;

		attribute vec3 outputDirection;

		varying vec3 vOutputDirection;

		void main() {

			vOutputDirection = outputDirection;
			gl_Position = vec4( position, 1.0 );

		}
	`}class zs extends Lt{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;const n={width:e,height:e,depth:1},a=[n,n,n,n,n,n];this.texture=new Us(a),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;const n={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},a=new Mi(5,5,5),r=new tn({name:"CubemapFromEquirect",uniforms:ai(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:1,blending:0});r.uniforms.tEquirect.value=t;const s=new Ft(a,r),o=t.minFilter;return t.minFilter===1008&&(t.minFilter=1006),new il(1,10,this).update(e,s),t.minFilter=o,s.geometry.dispose(),s.material.dispose(),this}clear(e,t=!0,n=!0,a=!0){const r=e.getRenderTarget();for(let s=0;s<6;s++)e.setRenderTarget(this,s),e.clear(t,n,a);e.setRenderTarget(r)}}function eu(i){let e=new WeakMap,t=new WeakMap,n=null;function a(u,f=!1){return u==null?null:f?s(u):r(u)}function r(u){if(u&&u.isTexture){const f=u.mapping;if(f===303||f===304)if(e.has(u)){const v=e.get(u).texture;return o(v,u.mapping)}else{const v=u.image;if(v&&v.height>0){const g=new zs(v.height);return g.fromEquirectangularTexture(i,u),e.set(u,g),u.addEventListener("dispose",l),o(g.texture,u.mapping)}else return null}}return u}function s(u){if(u&&u.isTexture){const f=u.mapping,v=f===303||f===304,g=f===301||f===302;if(v||g){let p=t.get(u);const m=p!==void 0?p.texture.pmremVersion:0;if(u.isRenderTargetTexture&&u.pmremVersion!==m)return n===null&&(n=new Xr(i)),p=v?n.fromEquirectangular(u,p):n.fromCubemap(u,p),p.texture.pmremVersion=u.pmremVersion,t.set(u,p),p.texture;if(p!==void 0)return p.texture;{const M=u.image;return v&&M&&M.height>0||g&&M&&c(M)?(n===null&&(n=new Xr(i)),p=v?n.fromEquirectangular(u):n.fromCubemap(u),p.texture.pmremVersion=u.pmremVersion,t.set(u,p),u.addEventListener("dispose",h),p.texture):null}}}return u}function o(u,f){return f===303?u.mapping=301:f===304&&(u.mapping=302),u}function c(u){let f=0;const v=6;for(let g=0;g<v;g++)u[g]!==void 0&&f++;return f===v}function l(u){const f=u.target;f.removeEventListener("dispose",l);const v=e.get(f);v!==void 0&&(e.delete(f),v.dispose())}function h(u){const f=u.target;f.removeEventListener("dispose",h);const v=t.get(f);v!==void 0&&(t.delete(f),v.dispose())}function d(){e=new WeakMap,t=new WeakMap,n!==null&&(n.dispose(),n=null)}return{get:a,dispose:d}}function tu(i){const e={};function t(n){if(e[n]!==void 0)return e[n];const a=i.getExtension(n);return e[n]=a,a}return{has:function(n){return t(n)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(n){const a=t(n);return a===null&&ni("WebGLRenderer: "+n+" extension not supported."),a}}}function nu(i,e,t,n){const a={},r=new WeakMap;function s(d){const u=d.target;u.index!==null&&e.remove(u.index);for(const v in u.attributes)e.remove(u.attributes[v]);u.removeEventListener("dispose",s),delete a[u.id];const f=r.get(u);f&&(e.remove(f),r.delete(u)),n.releaseStatesOfGeometry(u),u.isInstancedBufferGeometry===!0&&delete u._maxInstanceCount,t.memory.geometries--}function o(d,u){return a[u.id]===!0||(u.addEventListener("dispose",s),a[u.id]=!0,t.memory.geometries++),u}function c(d){const u=d.attributes;for(const f in u)e.update(u[f],i.ARRAY_BUFFER)}function l(d){const u=[],f=d.index,v=d.attributes.position;let g=0;if(v===void 0)return;if(f!==null){const M=f.array;g=f.version;for(let A=0,w=M.length;A<w;A+=3){const x=M[A+0],S=M[A+1],E=M[A+2];u.push(x,S,S,E,E,x)}}else{const M=v.array;g=v.version;for(let A=0,w=M.length/3-1;A<w;A+=3){const x=A+0,S=A+1,E=A+2;u.push(x,S,S,E,E,x)}}const p=new(v.count>=65535?Ls:rr)(u,1);p.version=g;const m=r.get(d);m&&e.remove(m),r.set(d,p)}function h(d){const u=r.get(d);if(u){const f=d.index;f!==null&&u.version<f.version&&l(d)}else l(d);return r.get(d)}return{get:o,update:c,getWireframeAttribute:h}}function iu(i,e,t){let n;function a(d){n=d}let r,s;function o(d){r=d.type,s=d.bytesPerElement}function c(d,u){i.drawElements(n,u,r,d*s),t.update(u,n,1)}function l(d,u,f){f!==0&&(i.drawElementsInstanced(n,u,r,d*s,f),t.update(u,n,f))}function h(d,u,f){if(f===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,u,0,r,d,0,f);let g=0;for(let p=0;p<f;p++)g+=u[p];t.update(g,n,1)}this.setMode=a,this.setIndex=o,this.render=c,this.renderInstances=l,this.renderMultiDraw=h}function au(i){const e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,s,o){switch(t.calls++,s){case i.TRIANGLES:t.triangles+=o*(r/3);break;case i.LINES:t.lines+=o*(r/2);break;case i.LINE_STRIP:t.lines+=o*(r-1);break;case i.LINE_LOOP:t.lines+=o*r;break;case i.POINTS:t.points+=o*r;break;default:Xe("WebGLInfo: Unknown draw mode:",s);break}}function a(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:a,update:n}}function ru(i,e,t){const n=new WeakMap,a=new nt;function r(s,o,c){const l=s.morphTargetInfluences,h=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,d=h!==void 0?h.length:0;let u=n.get(o);if(u===void 0||u.count!==d){let R=function(){E.dispose(),n.delete(o),o.removeEventListener("dispose",R)};u!==void 0&&u.texture.dispose();const f=o.morphAttributes.position!==void 0,v=o.morphAttributes.normal!==void 0,g=o.morphAttributes.color!==void 0,p=o.morphAttributes.position||[],m=o.morphAttributes.normal||[],M=o.morphAttributes.color||[];let A=0;f===!0&&(A=1),v===!0&&(A=2),g===!0&&(A=3);let w=o.attributes.position.count*A,x=1;w>e.maxTextureSize&&(x=Math.ceil(w/e.maxTextureSize),w=e.maxTextureSize);const S=new Float32Array(w*x*4*d),E=new Ts(S,w,x,d);E.type=1015,E.needsUpdate=!0;const y=A*4;for(let D=0;D<d;D++){const P=p[D],U=m[D],L=M[D],C=w*x*4*D;for(let B=0;B<P.count;B++){const X=B*y;f===!0&&(a.fromBufferAttribute(P,B),S[C+X+0]=a.x,S[C+X+1]=a.y,S[C+X+2]=a.z,S[C+X+3]=0),v===!0&&(a.fromBufferAttribute(U,B),S[C+X+4]=a.x,S[C+X+5]=a.y,S[C+X+6]=a.z,S[C+X+7]=0),g===!0&&(a.fromBufferAttribute(L,B),S[C+X+8]=a.x,S[C+X+9]=a.y,S[C+X+10]=a.z,S[C+X+11]=L.itemSize===4?a.w:1)}}u={count:d,texture:E,size:new Ge(w,x)},n.set(o,u),o.addEventListener("dispose",R)}if(s.isInstancedMesh===!0&&s.morphTexture!==null)c.getUniforms().setValue(i,"morphTexture",s.morphTexture,t);else{let f=0;for(let g=0;g<l.length;g++)f+=l[g];const v=o.morphTargetsRelative?1:1-f;c.getUniforms().setValue(i,"morphTargetBaseInfluence",v),c.getUniforms().setValue(i,"morphTargetInfluences",l)}c.getUniforms().setValue(i,"morphTargetsTexture",u.texture,t),c.getUniforms().setValue(i,"morphTargetsTextureSize",u.size)}return{update:r}}function su(i,e,t,n,a){let r=new WeakMap;function s(l){const h=a.render.frame,d=l.geometry,u=e.get(l,d);if(r.get(u)!==h&&(e.update(u),r.set(u,h)),l.isInstancedMesh&&(l.hasEventListener("dispose",c)===!1&&l.addEventListener("dispose",c),r.get(l)!==h&&(t.update(l.instanceMatrix,i.ARRAY_BUFFER),l.instanceColor!==null&&t.update(l.instanceColor,i.ARRAY_BUFFER),r.set(l,h))),l.isSkinnedMesh){const f=l.skeleton;r.get(f)!==h&&(f.update(),r.set(f,h))}return u}function o(){r=new WeakMap}function c(l){const h=l.target;h.removeEventListener("dispose",c),n.releaseStatesOfObject(h),t.remove(h.instanceMatrix),h.instanceColor!==null&&t.remove(h.instanceColor)}return{update:s,dispose:o}}const ou={1:"LINEAR_TONE_MAPPING",2:"REINHARD_TONE_MAPPING",3:"CINEON_TONE_MAPPING",4:"ACES_FILMIC_TONE_MAPPING",6:"AGX_TONE_MAPPING",7:"NEUTRAL_TONE_MAPPING",5:"CUSTOM_TONE_MAPPING"};function lu(i,e,t,n,a,r){const s=new Lt(e,t,{type:i,depthBuffer:a,stencilBuffer:r,samples:n?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1});let o=null,c=null;const l=new Yt;l.setAttribute("position",new qt([-1,3,0,-1,-1,0,3,-1,0],3)),l.setAttribute("uv",new qt([0,2,0,0,2,0],2));const h=new _i({uniforms:{tDiffuse:{value:null}},vertexShader:`
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
			}`,depthTest:!1,depthWrite:!1}),d=new Ft(l,h),u=new lr(-1,1,1,-1,0,1);let f=null,v=null,g=!1,p,m=null,M=[],A=!1;this.setSize=function(w,x){s.setSize(w,x),o!==null&&o.setSize(w,x),c!==null&&c.setSize(w,x);for(let S=0;S<M.length;S++){const E=M[S];E.setSize&&E.setSize(w,x)}},this.setEffects=function(w){M=w,A=M.length>0&&M[0].isRenderPass===!0;const x=s.width,S=s.height;M.length>0&&o===null&&(o=new Lt(x,S,{type:1016,depthBuffer:!1,stencilBuffer:!1}),c=new Lt(x,S,{type:1016,depthBuffer:!1,stencilBuffer:!1}));for(let E=0;E<M.length;E++){const y=M[E];y.setSize&&y.setSize(x,S)}},this.begin=function(w,x){if(g||w.toneMapping===0&&M.length===0)return!1;if(m=x,x!==null){const S=x.width,E=x.height;(s.width!==S||s.height!==E)&&this.setSize(S,E)}return A===!1&&w.setRenderTarget(s),p=w.toneMapping,w.toneMapping=0,!0},this.hasRenderPass=function(){return A},this.end=function(w,x){w.toneMapping=p,g=!0;let S=s,E=o;for(let y=0;y<M.length;y++){const R=M[y];R.enabled!==!1&&(R.render(w,E,S,x),R.needsSwap!==!1&&(S=E,E=E===o?c:o))}if(f!==w.outputColorSpace||v!==w.toneMapping){f=w.outputColorSpace,v=w.toneMapping,h.defines={},ke.getTransfer(f)===Je&&(h.defines.SRGB_TRANSFER="");const y=ou[v];y&&(h.defines[y]=""),h.needsUpdate=!0}h.uniforms.tDiffuse.value=S.texture,w.setRenderTarget(m),w.render(d,u),m=null,g=!1},this.isCompositing=function(){return g},this.dispose=function(){s.dispose(),o!==null&&o.dispose(),c!==null&&c.dispose(),l.dispose(),h.dispose()}}const ks=new At,Za=new Ln(1,1),Gs=new Ts,Vs=new Co,Hs=new Us,$r=[],Kr=[],Zr=new Float32Array(16),Jr=new Float32Array(9),Qr=new Float32Array(4);function ri(i,e,t){const n=i[0];if(n<=0||n>0)return i;const a=e*t;let r=$r[a];if(r===void 0&&(r=new Float32Array(a),$r[a]=r),e!==0){n.toArray(r,0);for(let s=1,o=0;s!==e;++s)o+=t,i[s].toArray(r,o)}return r}function gt(i,e){if(i.length!==e.length)return!1;for(let t=0,n=i.length;t<n;t++)if(i[t]!==e[t])return!1;return!0}function _t(i,e){for(let t=0,n=e.length;t<n;t++)i[t]=e[t]}function da(i,e){let t=Kr[e];t===void 0&&(t=new Int32Array(e),Kr[e]=t);for(let n=0;n!==e;++n)t[n]=i.allocateTextureUnit();return t}function cu(i,e){const t=this.cache;t[0]!==e&&(i.uniform1f(this.addr,e),t[0]=e)}function uu(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(gt(t,e))return;i.uniform2fv(this.addr,e),_t(t,e)}}function hu(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(i.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(gt(t,e))return;i.uniform3fv(this.addr,e),_t(t,e)}}function du(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(gt(t,e))return;i.uniform4fv(this.addr,e),_t(t,e)}}function fu(i,e){const t=this.cache,n=e.elements;if(n===void 0){if(gt(t,e))return;i.uniformMatrix2fv(this.addr,!1,e),_t(t,e)}else{if(gt(t,n))return;Qr.set(n),i.uniformMatrix2fv(this.addr,!1,Qr),_t(t,n)}}function pu(i,e){const t=this.cache,n=e.elements;if(n===void 0){if(gt(t,e))return;i.uniformMatrix3fv(this.addr,!1,e),_t(t,e)}else{if(gt(t,n))return;Jr.set(n),i.uniformMatrix3fv(this.addr,!1,Jr),_t(t,n)}}function mu(i,e){const t=this.cache,n=e.elements;if(n===void 0){if(gt(t,e))return;i.uniformMatrix4fv(this.addr,!1,e),_t(t,e)}else{if(gt(t,n))return;Zr.set(n),i.uniformMatrix4fv(this.addr,!1,Zr),_t(t,n)}}function vu(i,e){const t=this.cache;t[0]!==e&&(i.uniform1i(this.addr,e),t[0]=e)}function gu(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(gt(t,e))return;i.uniform2iv(this.addr,e),_t(t,e)}}function _u(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(gt(t,e))return;i.uniform3iv(this.addr,e),_t(t,e)}}function yu(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(gt(t,e))return;i.uniform4iv(this.addr,e),_t(t,e)}}function xu(i,e){const t=this.cache;t[0]!==e&&(i.uniform1ui(this.addr,e),t[0]=e)}function bu(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(gt(t,e))return;i.uniform2uiv(this.addr,e),_t(t,e)}}function Su(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(gt(t,e))return;i.uniform3uiv(this.addr,e),_t(t,e)}}function wu(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(gt(t,e))return;i.uniform4uiv(this.addr,e),_t(t,e)}}function Mu(i,e,t){const n=this.cache,a=t.allocateTextureUnit();n[0]!==a&&(i.uniform1i(this.addr,a),n[0]=a);let r;this.type===i.SAMPLER_2D_SHADOW?(Za.compareFunction=t.isReversedDepthBuffer()?518:515,r=Za):r=ks,t.setTexture2D(e||r,a)}function Eu(i,e,t){const n=this.cache,a=t.allocateTextureUnit();n[0]!==a&&(i.uniform1i(this.addr,a),n[0]=a),t.setTexture3D(e||Vs,a)}function Ru(i,e,t){const n=this.cache,a=t.allocateTextureUnit();n[0]!==a&&(i.uniform1i(this.addr,a),n[0]=a),t.setTextureCube(e||Hs,a)}function Tu(i,e,t){const n=this.cache,a=t.allocateTextureUnit();n[0]!==a&&(i.uniform1i(this.addr,a),n[0]=a),t.setTexture2DArray(e||Gs,a)}function Au(i){switch(i){case 5126:return cu;case 35664:return uu;case 35665:return hu;case 35666:return du;case 35674:return fu;case 35675:return pu;case 35676:return mu;case 5124:case 35670:return vu;case 35667:case 35671:return gu;case 35668:case 35672:return _u;case 35669:case 35673:return yu;case 5125:return xu;case 36294:return bu;case 36295:return Su;case 36296:return wu;case 35678:case 36198:case 36298:case 36306:case 35682:return Mu;case 35679:case 36299:case 36307:return Eu;case 35680:case 36300:case 36308:case 36293:return Ru;case 36289:case 36303:case 36311:case 36292:return Tu}}function Cu(i,e){i.uniform1fv(this.addr,e)}function Lu(i,e){const t=ri(e,this.size,2);i.uniform2fv(this.addr,t)}function Pu(i,e){const t=ri(e,this.size,3);i.uniform3fv(this.addr,t)}function Du(i,e){const t=ri(e,this.size,4);i.uniform4fv(this.addr,t)}function Uu(i,e){const t=ri(e,this.size,4);i.uniformMatrix2fv(this.addr,!1,t)}function Iu(i,e){const t=ri(e,this.size,9);i.uniformMatrix3fv(this.addr,!1,t)}function Fu(i,e){const t=ri(e,this.size,16);i.uniformMatrix4fv(this.addr,!1,t)}function Nu(i,e){i.uniform1iv(this.addr,e)}function Bu(i,e){i.uniform2iv(this.addr,e)}function Ou(i,e){i.uniform3iv(this.addr,e)}function zu(i,e){i.uniform4iv(this.addr,e)}function ku(i,e){i.uniform1uiv(this.addr,e)}function Gu(i,e){i.uniform2uiv(this.addr,e)}function Vu(i,e){i.uniform3uiv(this.addr,e)}function Hu(i,e){i.uniform4uiv(this.addr,e)}function Wu(i,e,t){const n=this.cache,a=e.length,r=da(t,a);gt(n,r)||(i.uniform1iv(this.addr,r),_t(n,r));let s;this.type===i.SAMPLER_2D_SHADOW?s=Za:s=ks;for(let o=0;o!==a;++o)t.setTexture2D(e[o]||s,r[o])}function Xu(i,e,t){const n=this.cache,a=e.length,r=da(t,a);gt(n,r)||(i.uniform1iv(this.addr,r),_t(n,r));for(let s=0;s!==a;++s)t.setTexture3D(e[s]||Vs,r[s])}function ju(i,e,t){const n=this.cache,a=e.length,r=da(t,a);gt(n,r)||(i.uniform1iv(this.addr,r),_t(n,r));for(let s=0;s!==a;++s)t.setTextureCube(e[s]||Hs,r[s])}function qu(i,e,t){const n=this.cache,a=e.length,r=da(t,a);gt(n,r)||(i.uniform1iv(this.addr,r),_t(n,r));for(let s=0;s!==a;++s)t.setTexture2DArray(e[s]||Gs,r[s])}function Yu(i){switch(i){case 5126:return Cu;case 35664:return Lu;case 35665:return Pu;case 35666:return Du;case 35674:return Uu;case 35675:return Iu;case 35676:return Fu;case 5124:case 35670:return Nu;case 35667:case 35671:return Bu;case 35668:case 35672:return Ou;case 35669:case 35673:return zu;case 5125:return ku;case 36294:return Gu;case 36295:return Vu;case 36296:return Hu;case 35678:case 36198:case 36298:case 36306:case 35682:return Wu;case 35679:case 36299:case 36307:return Xu;case 35680:case 36300:case 36308:case 36293:return ju;case 36289:case 36303:case 36311:case 36292:return qu}}class $u{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=Au(t.type)}}class Ku{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=Yu(t.type)}}class Zu{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){const a=this.seq;for(let r=0,s=a.length;r!==s;++r){const o=a[r];o.setValue(e,t[o.id],n)}}}const za=/(\w+)(\])?(\[|\.)?/g;function es(i,e){i.seq.push(e),i.map[e.id]=e}function Ju(i,e,t){const n=i.name,a=n.length;for(za.lastIndex=0;;){const r=za.exec(n),s=za.lastIndex;let o=r[1];const c=r[2]==="]",l=r[3];if(c&&(o=o|0),l===void 0||l==="["&&s+2===a){es(t,l===void 0?new $u(o,i,e):new Ku(o,i,e));break}else{let d=t.map[o];d===void 0&&(d=new Zu(o),es(t,d)),t=d}}}class ea{constructor(e,t){this.seq=[],this.map={};const n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let s=0;s<n;++s){const o=e.getActiveUniform(t,s),c=e.getUniformLocation(t,o.name);Ju(o,c,this)}const a=[],r=[];for(const s of this.seq)s.type===e.SAMPLER_2D_SHADOW||s.type===e.SAMPLER_CUBE_SHADOW||s.type===e.SAMPLER_2D_ARRAY_SHADOW?a.push(s):r.push(s);a.length>0&&(this.seq=a.concat(r))}setValue(e,t,n,a){const r=this.map[t];r!==void 0&&r.setValue(e,n,a)}setOptional(e,t,n){const a=t[n];a!==void 0&&this.setValue(e,n,a)}static upload(e,t,n,a){for(let r=0,s=t.length;r!==s;++r){const o=t[r],c=n[o.id];c.needsUpdate!==!1&&o.setValue(e,c.value,a)}}static seqWithValue(e,t){const n=[];for(let a=0,r=e.length;a!==r;++a){const s=e[a];s.id in t&&n.push(s)}return n}}function ts(i,e,t){const n=i.createShader(e);return i.shaderSource(n,t),i.compileShader(n),n}const Qu=37297;let eh=0;function th(i,e){const t=i.split(`
`),n=[],a=Math.max(e-6,0),r=Math.min(e+6,t.length);for(let s=a;s<r;s++){const o=s+1;n.push(`${o===e?">":" "} ${o}: ${t[s]}`)}return n.join(`
`)}const ns=new Pe;function nh(i){ke._getMatrix(ns,ke.workingColorSpace,i);const e=`mat3( ${ns.elements.map(t=>t.toFixed(4))} )`;switch(ke.getTransfer(i)){case aa:return[e,"LinearTransferOETF"];case Je:return[e,"sRGBTransferOETF"];default:return Ce("WebGLProgram: Unsupported color space: ",i),[e,"LinearTransferOETF"]}}function is(i,e,t){const n=i.getShaderParameter(e,i.COMPILE_STATUS),r=(i.getShaderInfoLog(e)||"").trim();if(n&&r==="")return"";const s=/ERROR: 0:(\d+)/.exec(r);if(s){const o=parseInt(s[1]);return t.toUpperCase()+`

`+r+`

`+th(i.getShaderSource(e),o)}else return r}function ih(i,e){const t=nh(e);return[`vec4 ${i}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}const ah={1:"Linear",2:"Reinhard",3:"Cineon",4:"ACESFilmic",6:"AgX",7:"Neutral",5:"Custom"};function rh(i,e){const t=ah[e];return t===void 0?(Ce("WebGLProgram: Unsupported toneMapping:",e),"vec3 "+i+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+i+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}const Ki=new O;function sh(){ke.getLuminanceCoefficients(Ki);const i=Ki.x.toFixed(4),e=Ki.y.toFixed(4),t=Ki.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${i}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function oh(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(mi).join(`
`)}function lh(i){const e=[];for(const t in i){const n=i[t];n!==!1&&e.push("#define "+t+" "+n)}return e.join(`
`)}function ch(i,e){const t={},n=i.getProgramParameter(e,i.ACTIVE_ATTRIBUTES);for(let a=0;a<n;a++){const r=i.getActiveAttrib(e,a),s=r.name;let o=1;r.type===i.FLOAT_MAT2&&(o=2),r.type===i.FLOAT_MAT3&&(o=3),r.type===i.FLOAT_MAT4&&(o=4),t[s]={type:r.type,location:i.getAttribLocation(e,s),locationSize:o}}return t}function mi(i){return i!==""}function as(i,e){const t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return i.replace(/NUM_SUN_LIGHTS/g,e.numSunLights).replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,e.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function rs(i,e){return i.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}const uh=/^[ \t]*#include +<([\w\d./]+)>/gm;function Ja(i){return i.replace(uh,dh)}const hh=new Map;function dh(i,e){let t=Ie[e];if(t===void 0){const n=hh.get(e);if(n!==void 0)t=Ie[n],Ce('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,n);else throw new Error("THREE.WebGLProgram: Can not resolve #include <"+e+">")}return Ja(t)}const fh=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function ss(i){return i.replace(fh,ph)}function ph(i,e,t,n){let a="";for(let r=parseInt(e);r<parseInt(t);r++)a+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return a}function os(i){let e=`precision ${i.precision} float;
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
#define LOW_PRECISION`),e}const mh={1:"SHADOWMAP_TYPE_PCF",3:"SHADOWMAP_TYPE_VSM"};function vh(i){return mh[i.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}const gh={301:"ENVMAP_TYPE_CUBE",302:"ENVMAP_TYPE_CUBE",306:"ENVMAP_TYPE_CUBE_UV"};function _h(i){return i.envMap===!1?"ENVMAP_TYPE_CUBE":gh[i.envMapMode]||"ENVMAP_TYPE_CUBE"}const yh={302:"ENVMAP_MODE_REFRACTION"};function xh(i){return i.envMap===!1?"ENVMAP_MODE_REFLECTION":yh[i.envMapMode]||"ENVMAP_MODE_REFLECTION"}const bh={0:"ENVMAP_BLENDING_MULTIPLY",1:"ENVMAP_BLENDING_MIX",2:"ENVMAP_BLENDING_ADD"};function Sh(i){return i.envMap===!1?"ENVMAP_BLENDING_NONE":bh[i.combine]||"ENVMAP_BLENDING_NONE"}function wh(i){const e=i.envMapCubeUVHeight;if(e===null)return null;const t=Math.log2(e)-2,n=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:n,maxMip:t}}function Mh(i,e,t,n){const a=i.getContext(),r=t.defines;let s=t.vertexShader,o=t.fragmentShader;const c=vh(t),l=_h(t),h=xh(t),d=Sh(t),u=wh(t),f=oh(t),v=lh(r),g=a.createProgram();let p,m,M=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(p=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,v].filter(mi).join(`
`),p.length>0&&(p+=`
`),m=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,v].filter(mi).join(`
`),m.length>0&&(m+=`
`)):(p=[os(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,v,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+h:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexNormals?"#define HAS_NORMAL":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+c:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(mi).join(`
`),m=[os(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,v,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+l:"",t.envMap?"#define "+h:"",t.envMap?"#define "+d:"",u?"#define CUBEUV_TEXEL_WIDTH "+u.texelWidth:"",u?"#define CUBEUV_TEXEL_HEIGHT "+u.texelHeight:"",u?"#define CUBEUV_MAX_MIP "+u.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.retroreflection?"#define USE_RETROREFLECTION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor?"#define USE_COLOR":"",t.vertexAlphas||t.batchingColor?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+c:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.numLightProbeGrids>0?"#define USE_LIGHT_PROBES_GRID":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==0?"#define TONE_MAPPING":"",t.toneMapping!==0?Ie.tonemapping_pars_fragment:"",t.toneMapping!==0?rh("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",Ie.colorspace_pars_fragment,ih("linearToOutputTexel",t.outputColorSpace),sh(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(mi).join(`
`)),s=Ja(s),s=as(s,t),s=rs(s,t),o=Ja(o),o=as(o,t),o=rs(o,t),s=ss(s),o=ss(o),t.isRawShaderMaterial!==!0&&(M=`#version 300 es
`,p=[f,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+p,m=["#define varying in",t.glslVersion===ti?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===ti?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+m);const A=M+p+s,w=M+m+o,x=ts(a,a.VERTEX_SHADER,A),S=ts(a,a.FRAGMENT_SHADER,w);a.attachShader(g,x),a.attachShader(g,S),t.index0AttributeName!==void 0?a.bindAttribLocation(g,0,t.index0AttributeName):t.hasPositionAttribute===!0&&a.bindAttribLocation(g,0,"position"),a.linkProgram(g);function E(P){if(i.debug.checkShaderErrors){const U=a.getProgramInfoLog(g)||"",L=a.getShaderInfoLog(x)||"",C=a.getShaderInfoLog(S)||"",B=U.trim(),X=L.trim(),H=C.trim();let J=!0,j=!0;if(a.getProgramParameter(g,a.LINK_STATUS)===!1)if(J=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(a,g,x,S);else{const Q=is(a,x,"vertex"),ne=is(a,S,"fragment");Xe("WebGLProgram: Shader Error "+a.getError()+" - VALIDATE_STATUS "+a.getProgramParameter(g,a.VALIDATE_STATUS)+`

Material Name: `+P.name+`
Material Type: `+P.type+`

Program Info Log: `+B+`
`+Q+`
`+ne)}else B!==""?Ce("WebGLProgram: Program Info Log:",B):(X===""||H==="")&&(j=!1);j&&(P.diagnostics={runnable:J,programLog:B,vertexShader:{log:X,prefix:p},fragmentShader:{log:H,prefix:m}})}a.deleteShader(x),a.deleteShader(S),y=new ea(a,g),R=ch(a,g)}let y;this.getUniforms=function(){return y===void 0&&E(this),y};let R;this.getAttributes=function(){return R===void 0&&E(this),R};let D=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return D===!1&&(D=a.getProgramParameter(g,Qu)),D},this.destroy=function(){n.releaseStatesOfProgram(this),a.deleteProgram(g),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=eh++,this.cacheKey=e,this.usedTimes=1,this.program=g,this.vertexShader=x,this.fragmentShader=S,this}let Eh=0;class Rh{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e,t,n){const a=this._getShaderCacheForMaterial(e);return a.has(t)===!1&&(a.add(t),t.usedTimes++),a.has(n)===!1&&(a.add(n),n.usedTimes++),this}remove(e){const t=this.materialCache.get(e);for(const n of t)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(e),this}getVertexShaderStage(e){return this._getShaderStage(e.vertexShader)}getFragmentShaderStage(e){return this._getShaderStage(e.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){const t=this.materialCache;let n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){const t=this.shaderCache;let n=t.get(e);return n===void 0&&(n=new Th(e),t.set(e,n)),n}}class Th{constructor(e){this.id=Eh++,this.code=e,this.usedTimes=0}}function Ah(i){return i===1030||i===37490||i===36285}function Ch(i,e,t,n,a,r){const s=new As,o=new Rh,c=new Set,l=[],h=new Map,d=n.logarithmicDepthBuffer;let u=n.precision;const f={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function v(y){return c.add(y),y===0?"uv":`uv${y}`}function g(y,R,D,P,U,L){const C=P.fog,B=U.geometry,X=y.isMeshStandardMaterial||y.isMeshLambertMaterial||y.isMeshPhongMaterial?P.environment:null,H=y.isMeshStandardMaterial||y.isMeshLambertMaterial&&!y.envMap||y.isMeshPhongMaterial&&!y.envMap,J=e.get(y.envMap||X,H),j=J&&J.mapping===306?J.image.height:null,Q=f[y.type];y.precision!==null&&(u=n.getMaxPrecision(y.precision),u!==y.precision&&Ce("WebGLProgram.getParameters:",y.precision,"not supported, using",u,"instead."));const ne=B.morphAttributes.position||B.morphAttributes.normal||B.morphAttributes.color,Te=ne!==void 0?ne.length:0;let Ee=0;B.morphAttributes.position!==void 0&&(Ee=1),B.morphAttributes.normal!==void 0&&(Ee=2),B.morphAttributes.color!==void 0&&(Ee=3);let it,Ve,je,Y;if(Q){const rt=en[Q];it=rt.vertexShader,Ve=rt.fragmentShader}else{it=y.vertexShader,Ve=y.fragmentShader;const rt=o.getVertexShaderStage(y),Ye=o.getFragmentShaderStage(y);o.update(y,rt,Ye),je=rt.id,Y=Ye.id}const ee=i.getRenderTarget(),_e=i.state.buffers.depth.getReversed(),Le=U.isInstancedMesh===!0,ve=U.isBatchedMesh===!0,Fe=!!y.map,mt=!!y.matcap,Ne=!!J,We=!!y.aoMap,at=!!y.lightMap,Oe=!!y.bumpMap&&y.wireframe===!1,lt=!!y.normalMap,yt=!!y.displacementMap,Ct=!!y.emissiveMap,ct=!!y.metalnessMap,ht=!!y.roughnessMap,N=y.anisotropy>0,bt=y.clearcoat>0,Ze=y.dispersion>0,T=y.retroreflectivity>0,_=y.iridescence>0,z=y.sheen>0,V=y.transmission>0,q=N&&!!y.anisotropyMap,ie=bt&&!!y.clearcoatMap,ae=bt&&!!y.clearcoatNormalMap,$=bt&&!!y.clearcoatRoughnessMap,Z=_&&!!y.iridescenceMap,re=_&&!!y.iridescenceThicknessMap,we=z&&!!y.sheenColorMap,ce=z&&!!y.sheenRoughnessMap,se=!!y.specularMap,Me=!!y.specularColorMap,Ae=!!y.specularIntensityMap,De=V&&!!y.transmissionMap,F=V&&!!y.thicknessMap,oe=!!y.gradientMap,K=!!y.alphaMap,le=y.alphaTest>0,fe=!!y.alphaHash,te=!!y.extensions;let Re=0;y.toneMapped&&(ee===null||ee.isXRRenderTarget===!0)&&(Re=i.toneMapping);const be={shaderID:Q,shaderType:y.type,shaderName:y.name,vertexShader:it,fragmentShader:Ve,defines:y.defines,customVertexShaderID:je,customFragmentShaderID:Y,isRawShaderMaterial:y.isRawShaderMaterial===!0,glslVersion:y.glslVersion,precision:u,batching:ve,batchingColor:ve&&U._colorsTexture!==null,instancing:Le,instancingColor:Le&&U.instanceColor!==null,instancingMorph:Le&&U.morphTexture!==null,outputColorSpace:ee===null?i.outputColorSpace:ee.isXRRenderTarget===!0?ee.texture.colorSpace:ke.workingColorSpace,alphaToCoverage:!!y.alphaToCoverage,map:Fe,matcap:mt,envMap:Ne,envMapMode:Ne&&J.mapping,envMapCubeUVHeight:j,aoMap:We,lightMap:at,bumpMap:Oe,normalMap:lt,displacementMap:yt,emissiveMap:Ct,normalMapObjectSpace:lt&&y.normalMapType===1,normalMapTangentSpace:lt&&y.normalMapType===0,packedNormalMap:lt&&y.normalMapType===0&&Ah(y.normalMap.format),metalnessMap:ct,roughnessMap:ht,anisotropy:N,anisotropyMap:q,clearcoat:bt,clearcoatMap:ie,clearcoatNormalMap:ae,clearcoatRoughnessMap:$,dispersion:Ze,retroreflection:T,iridescence:_,iridescenceMap:Z,iridescenceThicknessMap:re,sheen:z,sheenColorMap:we,sheenRoughnessMap:ce,specularMap:se,specularColorMap:Me,specularIntensityMap:Ae,transmission:V,transmissionMap:De,thicknessMap:F,gradientMap:oe,opaque:y.transparent===!1&&y.blending===1&&y.alphaToCoverage===!1,alphaMap:K,alphaTest:le,alphaHash:fe,combine:y.combine,mapUv:Fe&&v(y.map.channel),aoMapUv:We&&v(y.aoMap.channel),lightMapUv:at&&v(y.lightMap.channel),bumpMapUv:Oe&&v(y.bumpMap.channel),normalMapUv:lt&&v(y.normalMap.channel),displacementMapUv:yt&&v(y.displacementMap.channel),emissiveMapUv:Ct&&v(y.emissiveMap.channel),metalnessMapUv:ct&&v(y.metalnessMap.channel),roughnessMapUv:ht&&v(y.roughnessMap.channel),anisotropyMapUv:q&&v(y.anisotropyMap.channel),clearcoatMapUv:ie&&v(y.clearcoatMap.channel),clearcoatNormalMapUv:ae&&v(y.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:$&&v(y.clearcoatRoughnessMap.channel),iridescenceMapUv:Z&&v(y.iridescenceMap.channel),iridescenceThicknessMapUv:re&&v(y.iridescenceThicknessMap.channel),sheenColorMapUv:we&&v(y.sheenColorMap.channel),sheenRoughnessMapUv:ce&&v(y.sheenRoughnessMap.channel),specularMapUv:se&&v(y.specularMap.channel),specularColorMapUv:Me&&v(y.specularColorMap.channel),specularIntensityMapUv:Ae&&v(y.specularIntensityMap.channel),transmissionMapUv:De&&v(y.transmissionMap.channel),thicknessMapUv:F&&v(y.thicknessMap.channel),alphaMapUv:K&&v(y.alphaMap.channel),vertexTangents:!!B.attributes.tangent&&(lt||N),vertexNormals:!!B.attributes.normal,vertexColors:y.vertexColors,vertexAlphas:y.vertexColors===!0&&!!B.attributes.color&&B.attributes.color.itemSize===4,pointsUvs:U.isPoints===!0&&!!B.attributes.uv&&(Fe||K),fog:!!C,useFog:y.fog===!0,fogExp2:!!C&&C.isFogExp2,flatShading:y.wireframe===!1&&(y.flatShading===!0||B.attributes.normal===void 0&&lt===!1&&(y.isMeshLambertMaterial||y.isMeshPhongMaterial||y.isMeshStandardMaterial||y.isMeshPhysicalMaterial)),sizeAttenuation:y.sizeAttenuation===!0,logarithmicDepthBuffer:d,reversedDepthBuffer:_e,skinning:U.isSkinnedMesh===!0,hasPositionAttribute:B.attributes.position!==void 0,morphTargets:B.morphAttributes.position!==void 0,morphNormals:B.morphAttributes.normal!==void 0,morphColors:B.morphAttributes.color!==void 0,morphTargetsCount:Te,morphTextureStride:Ee,numSunLights:R.sun.length,numDirLights:R.directional.length,numPointLights:R.point.length,numSpotLights:R.spot.length,numSpotLightMaps:R.spotLightMap.length,numRectAreaLights:R.rectArea.length,numHemiLights:R.hemi.length,numSunLightShadows:R.sunShadowMap.length,numDirLightShadows:R.directionalShadowMap.length,numPointLightShadows:R.pointShadowMap.length,numSpotLightShadows:R.spotShadowMap.length,numSpotLightShadowsWithMaps:R.numSpotLightShadowsWithMaps,numLightProbes:R.numLightProbes,numLightProbeGrids:L.length,numClippingPlanes:r.numPlanes,numClipIntersection:r.numIntersection,dithering:y.dithering,shadowMapEnabled:i.shadowMap.enabled&&D.length>0,shadowMapType:i.shadowMap.type,toneMapping:Re,decodeVideoTexture:Fe&&y.map.isVideoTexture===!0&&ke.getTransfer(y.map.colorSpace)===Je,decodeVideoTextureEmissive:Ct&&y.emissiveMap.isVideoTexture===!0&&ke.getTransfer(y.emissiveMap.colorSpace)===Je,premultipliedAlpha:y.premultipliedAlpha,doubleSided:y.side===2,flipSided:y.side===1,useDepthPacking:y.depthPacking>=0,depthPacking:y.depthPacking||0,index0AttributeName:y.index0AttributeName,extensionClipCullDistance:te&&y.extensions.clipCullDistance===!0&&t.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(te&&y.extensions.multiDraw===!0||ve)&&t.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:t.has("KHR_parallel_shader_compile"),customProgramCacheKey:y.customProgramCacheKey()};return be.vertexUv1s=c.has(1),be.vertexUv2s=c.has(2),be.vertexUv3s=c.has(3),c.clear(),be}function p(y){const R=[];if(y.shaderID?R.push(y.shaderID):(R.push(y.customVertexShaderID),R.push(y.customFragmentShaderID)),y.defines!==void 0)for(const D in y.defines)R.push(D),R.push(y.defines[D]);return y.isRawShaderMaterial===!1&&(m(R,y),M(R,y),R.push(i.outputColorSpace)),R.push(y.customProgramCacheKey),R.join()}function m(y,R){y.push(R.precision),y.push(R.outputColorSpace),y.push(R.envMapMode),y.push(R.envMapCubeUVHeight),y.push(R.mapUv),y.push(R.alphaMapUv),y.push(R.lightMapUv),y.push(R.aoMapUv),y.push(R.bumpMapUv),y.push(R.normalMapUv),y.push(R.displacementMapUv),y.push(R.emissiveMapUv),y.push(R.metalnessMapUv),y.push(R.roughnessMapUv),y.push(R.anisotropyMapUv),y.push(R.clearcoatMapUv),y.push(R.clearcoatNormalMapUv),y.push(R.clearcoatRoughnessMapUv),y.push(R.iridescenceMapUv),y.push(R.iridescenceThicknessMapUv),y.push(R.sheenColorMapUv),y.push(R.sheenRoughnessMapUv),y.push(R.specularMapUv),y.push(R.specularColorMapUv),y.push(R.specularIntensityMapUv),y.push(R.transmissionMapUv),y.push(R.thicknessMapUv),y.push(R.combine),y.push(R.fogExp2),y.push(R.sizeAttenuation),y.push(R.morphTargetsCount),y.push(R.morphAttributeCount),y.push(R.numSunLights),y.push(R.numDirLights),y.push(R.numPointLights),y.push(R.numSpotLights),y.push(R.numSpotLightMaps),y.push(R.numHemiLights),y.push(R.numRectAreaLights),y.push(R.numSunLightShadows),y.push(R.numDirLightShadows),y.push(R.numPointLightShadows),y.push(R.numSpotLightShadows),y.push(R.numSpotLightShadowsWithMaps),y.push(R.numLightProbes),y.push(R.shadowMapType),y.push(R.toneMapping),y.push(R.numClippingPlanes),y.push(R.numClipIntersection),y.push(R.depthPacking)}function M(y,R){s.disableAll(),R.instancing&&s.enable(0),R.instancingColor&&s.enable(1),R.instancingMorph&&s.enable(2),R.matcap&&s.enable(3),R.envMap&&s.enable(4),R.normalMapObjectSpace&&s.enable(5),R.normalMapTangentSpace&&s.enable(6),R.clearcoat&&s.enable(7),R.iridescence&&s.enable(8),R.alphaTest&&s.enable(9),R.vertexColors&&s.enable(10),R.vertexAlphas&&s.enable(11),R.vertexUv1s&&s.enable(12),R.vertexUv2s&&s.enable(13),R.vertexUv3s&&s.enable(14),R.vertexTangents&&s.enable(15),R.anisotropy&&s.enable(16),R.alphaHash&&s.enable(17),R.batching&&s.enable(18),R.dispersion&&s.enable(19),R.retroreflection&&s.enable(24),R.batchingColor&&s.enable(20),R.gradientMap&&s.enable(21),R.packedNormalMap&&s.enable(22),R.vertexNormals&&s.enable(23),y.push(s.mask),s.disableAll(),R.fog&&s.enable(0),R.useFog&&s.enable(1),R.flatShading&&s.enable(2),R.logarithmicDepthBuffer&&s.enable(3),R.reversedDepthBuffer&&s.enable(4),R.skinning&&s.enable(5),R.morphTargets&&s.enable(6),R.morphNormals&&s.enable(7),R.morphColors&&s.enable(8),R.premultipliedAlpha&&s.enable(9),R.shadowMapEnabled&&s.enable(10),R.doubleSided&&s.enable(11),R.flipSided&&s.enable(12),R.useDepthPacking&&s.enable(13),R.dithering&&s.enable(14),R.transmission&&s.enable(15),R.sheen&&s.enable(16),R.opaque&&s.enable(17),R.pointsUvs&&s.enable(18),R.decodeVideoTexture&&s.enable(19),R.decodeVideoTextureEmissive&&s.enable(20),R.alphaToCoverage&&s.enable(21),R.numLightProbeGrids>0&&s.enable(22),R.hasPositionAttribute&&s.enable(23),y.push(s.mask)}function A(y){const R=f[y.type];let D;if(R){const P=en[R];D=Zo.clone(P.uniforms)}else D=y.uniforms;return D}function w(y,R){let D=h.get(R);return D!==void 0?++D.usedTimes:(D=new Mh(i,R,y,a),l.push(D),h.set(R,D)),D}function x(y){if(--y.usedTimes===0){const R=l.indexOf(y);l[R]=l[l.length-1],l.pop(),h.delete(y.cacheKey),y.destroy()}}function S(y){o.remove(y)}function E(){o.dispose()}return{getParameters:g,getProgramCacheKey:p,getUniforms:A,acquireProgram:w,releaseProgram:x,releaseShaderCache:S,programs:l,dispose:E}}function Lh(){let i=new WeakMap;function e(s){return i.has(s)}function t(s){let o=i.get(s);return o===void 0&&(o={},i.set(s,o)),o}function n(s){i.delete(s)}function a(s,o,c){i.get(s)[o]=c}function r(){i=new WeakMap}return{has:e,get:t,remove:n,update:a,dispose:r}}function Ph(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.material.id!==e.material.id?i.material.id-e.material.id:i.materialVariant!==e.materialVariant?i.materialVariant-e.materialVariant:i.z!==e.z?i.z-e.z:i.id-e.id}function ls(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.z!==e.z?e.z-i.z:i.id-e.id}function cs(){const i=[];let e=0;const t=[],n=[],a=[];function r(){e=0,t.length=0,n.length=0,a.length=0}function s(u){let f=0;return u.isInstancedMesh&&(f+=2),u.isSkinnedMesh&&(f+=1),f}function o(u,f,v,g,p,m){let M=i[e];return M===void 0?(M={id:u.id,object:u,geometry:f,material:v,materialVariant:s(u),groupOrder:g,renderOrder:u.renderOrder,z:p,group:m},i[e]=M):(M.id=u.id,M.object=u,M.geometry=f,M.material=v,M.materialVariant=s(u),M.groupOrder=g,M.renderOrder=u.renderOrder,M.z=p,M.group=m),e++,M}function c(u,f,v,g,p,m,M){M.reversedDepth===!0&&(p=-p);const A=o(u,f,v,g,p,m);v.transmission>0?n.push(A):v.transparent===!0?a.push(A):t.push(A)}function l(u,f,v,g,p,m){const M=o(u,f,v,g,p,m);v.transmission>0?n.unshift(M):v.transparent===!0?a.unshift(M):t.unshift(M)}function h(u,f){t.length>1&&t.sort(u||Ph),n.length>1&&n.sort(f||ls),a.length>1&&a.sort(f||ls)}function d(){for(let u=e,f=i.length;u<f;u++){const v=i[u];if(v.id===null)break;v.id=null,v.object=null,v.geometry=null,v.material=null,v.group=null}}return{opaque:t,transmissive:n,transparent:a,init:r,push:c,unshift:l,finish:d,sort:h}}function Dh(){let i=new WeakMap;function e(n,a){const r=i.get(n);let s;return r===void 0?(s=new cs,i.set(n,[s])):a>=r.length?(s=new cs,r.push(s)):s=r[a],s}function t(){i=new WeakMap}return{get:e,dispose:t}}function Uh(){const i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"SunLight":case"DirectionalLight":t={direction:new O,color:new qe};break;case"SpotLight":t={position:new O,direction:new O,color:new qe,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new O,color:new qe,distance:0,decay:0};break;case"HemisphereLight":t={direction:new O,skyColor:new qe,groundColor:new qe};break;case"RectAreaLight":t={color:new qe,position:new O,halfWidth:new O,halfHeight:new O};break}return i[e.id]=t,t}}}function Ih(){const i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"SunLight":case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ge};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ge};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ge,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[e.id]=t,t}}}let Fh=0;function Nh(i,e){return(e.castShadow?2:0)-(i.castShadow?2:0)+(e.map?1:0)-(i.map?1:0)}function Bh(i){const e=new Uh,t=Ih(),n={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let l=0;l<9;l++)n.probe.push(new O);const a=new O,r=new pe,s=new pe;function o(l){let h=0,d=0,u=0;for(let U=0;U<9;U++)n.probe[U].set(0,0,0);let f=0,v=0,g=0,p=0,m=0,M=0,A=0,w=0,x=0,S=0,E=0,y=0,R=0,D=0;l.sort(Nh);for(let U=0,L=l.length;U<L;U++){const C=l[U],B=C.color,X=C.intensity,H=C.distance;let J=null;if(C.shadow&&C.shadow.map&&(C.shadow.map.texture.format===1030?J=C.shadow.map.texture:J=C.shadow.map.depthTexture||C.shadow.map.texture),C.isAmbientLight)h+=B.r*X,d+=B.g*X,u+=B.b*X;else if(C.isLightProbe){for(let j=0;j<9;j++)n.probe[j].addScaledVector(C.sh.coefficients[j],X);D++}else if(C.isSunLight){const j=e.get(C);if(j.color.copy(C.color).multiplyScalar(C.intensity),C.castShadow){const Q=C.shadow,ne=t.get(C);ne.shadowIntensity=Q.intensity,ne.shadowBias=Q.bias,ne.shadowNormalBias=Q.normalBias,ne.shadowRadius=Q.radius,ne.shadowMapSize.copy(Q.mapSize).multiply(Q.getFrameExtents()),n.sunShadow[v]=ne,n.sunShadowMap[v]=J;const Te=Q.getViewportCount();for(let Ee=0;Ee<Te;Ee++)n.sunShadowMatrix[g+Ee]=Q.getMatrix(Ee),n.sunShadowCascade[g+Ee]=Q._cascadeData[Ee];g+=Te,v++}n.sun[f]=j,f++}else if(C.isDirectionalLight){const j=e.get(C);if(j.color.copy(C.color).multiplyScalar(C.intensity),C.castShadow){const Q=C.shadow,ne=t.get(C);ne.shadowIntensity=Q.intensity,ne.shadowBias=Q.bias,ne.shadowNormalBias=Q.normalBias,ne.shadowRadius=Q.radius,ne.shadowMapSize=Q.mapSize,n.directionalShadow[p]=ne,n.directionalShadowMap[p]=J,n.directionalShadowMatrix[p]=C.shadow.matrix,x++}n.directional[p]=j,p++}else if(C.isSpotLight){const j=e.get(C);j.position.setFromMatrixPosition(C.matrixWorld),j.color.copy(B).multiplyScalar(X),j.distance=H,j.coneCos=Math.cos(C.angle),j.penumbraCos=Math.cos(C.angle*(1-C.penumbra)),j.decay=C.decay,n.spot[M]=j;const Q=C.shadow;if(C.map&&(n.spotLightMap[y]=C.map,y++,Q.updateMatrices(C),C.castShadow&&R++),n.spotLightMatrix[M]=Q.matrix,C.castShadow){const ne=t.get(C);ne.shadowIntensity=Q.intensity,ne.shadowBias=Q.bias,ne.shadowNormalBias=Q.normalBias,ne.shadowRadius=Q.radius,ne.shadowMapSize=Q.mapSize,n.spotShadow[M]=ne,n.spotShadowMap[M]=J,E++}M++}else if(C.isRectAreaLight){const j=e.get(C);j.color.copy(B).multiplyScalar(X),j.halfWidth.set(C.width*.5,0,0),j.halfHeight.set(0,C.height*.5,0),n.rectArea[A]=j,A++}else if(C.isPointLight){const j=e.get(C);if(j.color.copy(C.color).multiplyScalar(C.intensity),j.distance=C.distance,j.decay=C.decay,C.castShadow){const Q=C.shadow,ne=t.get(C);ne.shadowIntensity=Q.intensity,ne.shadowBias=Q.bias,ne.shadowNormalBias=Q.normalBias,ne.shadowRadius=Q.radius,ne.shadowMapSize=Q.mapSize,ne.shadowCameraNear=Q.camera.near,ne.shadowCameraFar=Q.camera.far,n.pointShadow[m]=ne,n.pointShadowMap[m]=J,n.pointShadowMatrix[m]=C.shadow.matrix,S++}n.point[m]=j,m++}else if(C.isHemisphereLight){const j=e.get(C);j.skyColor.copy(C.color).multiplyScalar(X),j.groundColor.copy(C.groundColor).multiplyScalar(X),n.hemi[w]=j,w++}}A>0&&(i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=ue.LTC_FLOAT_1,n.rectAreaLTC2=ue.LTC_FLOAT_2):(n.rectAreaLTC1=ue.LTC_HALF_1,n.rectAreaLTC2=ue.LTC_HALF_2)),n.ambient[0]=h,n.ambient[1]=d,n.ambient[2]=u;const P=n.hash;(P.sunLength!==f||P.directionalLength!==p||P.pointLength!==m||P.spotLength!==M||P.rectAreaLength!==A||P.hemiLength!==w||P.numSunShadows!==v||P.numDirectionalShadows!==x||P.numPointShadows!==S||P.numSpotShadows!==E||P.numSpotMaps!==y||P.numLightProbes!==D)&&(n.sun.length=f,n.directional.length=p,n.spot.length=M,n.rectArea.length=A,n.point.length=m,n.hemi.length=w,n.sunShadow.length=v,n.sunShadowMap.length=v,n.sunShadowMatrix.length=g,n.sunShadowCascade.length=g,n.directionalShadow.length=x,n.directionalShadowMap.length=x,n.directionalShadowMatrix.length=x,n.pointShadow.length=S,n.pointShadowMap.length=S,n.pointShadowMatrix.length=S,n.spotShadow.length=E,n.spotShadowMap.length=E,n.spotLightMatrix.length=E+y-R,n.spotLightMap.length=y,n.numSpotLightShadowsWithMaps=R,n.numLightProbes=D,P.sunLength=f,P.directionalLength=p,P.pointLength=m,P.spotLength=M,P.rectAreaLength=A,P.hemiLength=w,P.numSunShadows=v,P.numDirectionalShadows=x,P.numPointShadows=S,P.numSpotShadows=E,P.numSpotMaps=y,P.numLightProbes=D,n.version=Fh++)}function c(l,h){let d=0,u=0,f=0,v=0,g=0,p=0;const m=h.matrixWorldInverse;for(let M=0,A=l.length;M<A;M++){const w=l[M];if(w.isSunLight){const x=n.sun[d];x.direction.setFromMatrixPosition(w.matrixWorld),x.direction.transformDirection(m),d++}else if(w.isDirectionalLight){const x=n.directional[u];x.direction.setFromMatrixPosition(w.matrixWorld),a.setFromMatrixPosition(w.target.matrixWorld),x.direction.sub(a),x.direction.transformDirection(m),u++}else if(w.isSpotLight){const x=n.spot[v];x.position.setFromMatrixPosition(w.matrixWorld),x.position.applyMatrix4(m),x.direction.setFromMatrixPosition(w.matrixWorld),a.setFromMatrixPosition(w.target.matrixWorld),x.direction.sub(a),x.direction.transformDirection(m),v++}else if(w.isRectAreaLight){const x=n.rectArea[g];x.position.setFromMatrixPosition(w.matrixWorld),x.position.applyMatrix4(m),s.identity(),r.copy(w.matrixWorld),r.premultiply(m),s.extractRotation(r),x.halfWidth.set(w.width*.5,0,0),x.halfHeight.set(0,w.height*.5,0),x.halfWidth.applyMatrix4(s),x.halfHeight.applyMatrix4(s),g++}else if(w.isPointLight){const x=n.point[f];x.position.setFromMatrixPosition(w.matrixWorld),x.position.applyMatrix4(m),f++}else if(w.isHemisphereLight){const x=n.hemi[p];x.direction.setFromMatrixPosition(w.matrixWorld),x.direction.transformDirection(m),p++}}}return{setup:o,setupView:c,state:n}}function us(i){const e=new Bh(i),t=[],n=[],a=[];function r(u){d.camera=u,t.length=0,n.length=0,a.length=0}function s(u){t.push(u)}function o(u){n.push(u)}function c(u){a.push(u)}function l(){e.setup(t)}function h(u){e.setupView(t,u)}const d={lightsArray:t,shadowsArray:n,lightProbeGridArray:a,camera:null,lights:e,transmissionRenderTarget:{},textureUnits:0};return{init:r,state:d,setupLights:l,setupLightsView:h,pushLight:s,pushShadow:o,pushLightProbeGrid:c}}function Oh(i){let e=new WeakMap;function t(a,r=0){const s=e.get(a);let o;return s===void 0?(o=new us(i),e.set(a,[o])):r>=s.length?(o=new us(i),s.push(o)):o=s[r],o}function n(){e=new WeakMap}return{get:t,dispose:n}}const zh=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,kh=`uniform sampler2D shadow_pass;
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
}`,Gh=[new O(1,0,0),new O(-1,0,0),new O(0,1,0),new O(0,-1,0),new O(0,0,1),new O(0,0,-1)],Vh=[new O(0,-1,0),new O(0,-1,0),new O(0,0,1),new O(0,0,-1),new O(0,-1,0),new O(0,-1,0)],hs=new pe,fi=new O,ka=new O;function Hh(i,e,t){let n=new Ds;const a=new Ge,r=new Ge,s=new nt,o=new el,c=new tl,l={},h=t.maxTextureSize,d={0:1,1:0,2:2},u=new tn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Ge},radius:{value:4}},vertexShader:zh,fragmentShader:kh}),f=u.clone();f.defines.HORIZONTAL_PASS=1;const v=new Yt;v.setAttribute("position",new jt(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const g=new Ft(v,u),p=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=1;let m=this.type;this.render=function(S,E,y){if(p.enabled===!1||p.autoUpdate===!1&&p.needsUpdate===!1||S.length===0)return;this.type===2&&(Ce("WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead."),this.type=1);const R=i.getRenderTarget(),D=i.getActiveCubeFace(),P=i.getActiveMipmapLevel(),U=i.state;U.setBlending(0),U.buffers.depth.getReversed()===!0?U.buffers.color.setClear(0,0,0,0):U.buffers.color.setClear(1,1,1,1),U.buffers.depth.setTest(!0),U.setScissorTest(!1);const L=m!==this.type;L&&E.traverse(function(C){C.material&&(Array.isArray(C.material)?C.material.forEach(B=>B.needsUpdate=!0):C.material.needsUpdate=!0)});for(let C=0,B=S.length;C<B;C++){const X=S[C],H=X.shadow;if(H===void 0){Ce("WebGLShadowMap:",X,"has no shadow.");continue}if(H.autoUpdate===!1&&H.needsUpdate===!1)continue;a.copy(H.mapSize);const J=H.getFrameExtents();a.multiply(J),r.copy(H.mapSize),(a.x>h||a.y>h)&&(a.x>h&&(r.x=Math.floor(h/J.x),a.x=r.x*J.x,H.mapSize.x=r.x),a.y>h&&(r.y=Math.floor(h/J.y),a.y=r.y*J.y,H.mapSize.y=r.y));const j=i.state.buffers.depth.getReversed();if(H.camera._reversedDepth=j,H.map===null||L===!0){if(H.map!==null&&(H.map.depthTexture!==null&&(H.map.depthTexture.dispose(),H.map.depthTexture=null),H.map.dispose()),this.type===3){if(X.isPointLight){Ce("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}H.map=new Lt(a.x,a.y,{format:1030,type:1016,minFilter:1006,magFilter:1006,generateMipmaps:!1}),H.map.texture.name=X.name+".shadowMap",H.map.depthTexture=new Ln(a.x,a.y,1015),H.map.depthTexture.name=X.name+".shadowMapDepth",H.map.depthTexture.format=1026,H.map.depthTexture.compareFunction=null,H.map.depthTexture.minFilter=1003,H.map.depthTexture.magFilter=1003}else X.isPointLight?(H.map=new zs(a.x),H.map.depthTexture=new $o(a.x,1014)):(H.map=new Lt(a.x,a.y),H.map.depthTexture=new Ln(a.x,a.y,1014)),H.map.depthTexture.name=X.name+".shadowMap",H.map.depthTexture.format=1026,this.type===1?(H.map.depthTexture.compareFunction=j?518:515,H.map.depthTexture.minFilter=1006,H.map.depthTexture.magFilter=1006):(H.map.depthTexture.compareFunction=null,H.map.depthTexture.minFilter=1003,H.map.depthTexture.magFilter=1003);H.camera.updateProjectionMatrix()}H.map.isWebGLCubeRenderTarget!==!0&&(H.map.width!==a.x||H.map.height!==a.y)&&H.map.setSize(a.x,a.y);const Q=H.map.isWebGLCubeRenderTarget?6:H.getViewportCount();X.isPointLight!==!0&&H.updateMatrices(X,y);for(let ne=0;ne<Q;ne++){const Te=H.getCamera(ne);if(X.isPointLight){const Ee=H.camera,it=H.matrix,Ve=X.distance||Ee.far;Ve!==Ee.far&&(Ee.far=Ve,Ee.updateProjectionMatrix()),fi.setFromMatrixPosition(X.matrixWorld),Ee.position.copy(fi),ka.copy(Ee.position),ka.add(Gh[ne]),Ee.up.copy(Vh[ne]),Ee.lookAt(ka),Ee.updateMatrixWorld(),it.makeTranslation(-fi.x,-fi.y,-fi.z),hs.multiplyMatrices(Ee.projectionMatrix,Ee.matrixWorldInverse),H._frustum.setFromProjectionMatrix(hs,Ee.coordinateSystem,Ee.reversedDepth)}if(H.map.isWebGLCubeRenderTarget)i.setRenderTarget(H.map,ne),i.clear();else{ne===0&&(i.setRenderTarget(H.map),i.clear());const Ee=H.getViewport(ne);s.set(r.x*Ee.x,r.y*Ee.y,r.x*Ee.z,r.y*Ee.w),U.viewport(s)}n=H.getFrustum(ne),w(E,y,Te,X,this.type)}H.isPointLightShadow!==!0&&this.type===3&&M(H,y),H.needsUpdate=!1}m=this.type,p.needsUpdate=!1,i.setRenderTarget(R,D,P)};function M(S,E){const y=e.update(g);u.defines.VSM_SAMPLES!==S.blurSamples&&(u.defines.VSM_SAMPLES=S.blurSamples,f.defines.VSM_SAMPLES=S.blurSamples,u.needsUpdate=!0,f.needsUpdate=!0),S.mapPass===null?S.mapPass=new Lt(a.x,a.y,{format:1030,type:1016}):(S.mapPass.width!==S.map.width||S.mapPass.height!==S.map.height)&&S.mapPass.setSize(S.map.width,S.map.height),u.uniforms.shadow_pass.value=S.map.depthTexture,u.uniforms.resolution.value.set(S.map.width,S.map.height),u.uniforms.radius.value=S.radius,i.setRenderTarget(S.mapPass),i.clear(),i.renderBufferDirect(E,null,y,u,g,null),f.uniforms.shadow_pass.value=S.mapPass.texture,f.uniforms.resolution.value.set(S.map.width,S.map.height),f.uniforms.radius.value=S.radius,i.setRenderTarget(S.map),i.clear(),i.renderBufferDirect(E,null,y,f,g,null)}function A(S,E,y,R){let D=null;const P=y.isPointLight===!0?S.customDistanceMaterial:S.customDepthMaterial;if(P!==void 0)D=P;else if(D=y.isPointLight===!0?c:o,i.localClippingEnabled&&E.clipShadows===!0&&Array.isArray(E.clippingPlanes)&&E.clippingPlanes.length!==0||E.displacementMap&&E.displacementScale!==0||E.alphaMap&&E.alphaTest>0||E.map&&E.alphaTest>0||E.alphaToCoverage===!0){const U=D.uuid,L=E.uuid;let C=l[U];C===void 0&&(C={},l[U]=C);let B=C[L];B===void 0&&(B=D.clone(),C[L]=B,E.addEventListener("dispose",x)),D=B}if(D.visible=E.visible,D.wireframe=E.wireframe,R===3?D.side=E.shadowSide!==null?E.shadowSide:E.side:D.side=E.shadowSide!==null?E.shadowSide:d[E.side],D.alphaMap=E.alphaMap,D.alphaTest=E.alphaToCoverage===!0?.5:E.alphaTest,D.map=E.map,D.clipShadows=E.clipShadows,D.clippingPlanes=E.clippingPlanes,D.clipIntersection=E.clipIntersection,D.displacementMap=E.displacementMap,D.displacementScale=E.displacementScale,D.displacementBias=E.displacementBias,D.wireframeLinewidth=E.wireframeLinewidth,D.linewidth=E.linewidth,y.isPointLight===!0&&D.isMeshDistanceMaterial===!0){const U=i.properties.get(D);U.light=y}return D}function w(S,E,y,R,D){if(S.visible===!1)return;if(S.layers.test(E.layers)&&(S.isMesh||S.isLine||S.isPoints)&&(S.castShadow||S.receiveShadow&&D===3)&&(!S.frustumCulled||S.intersectsFrustum(n))){S.modelViewMatrix.multiplyMatrices(y.matrixWorldInverse,S.matrixWorld);const L=e.update(S),C=S.material;if(Array.isArray(C)){const B=L.groups;for(let X=0,H=B.length;X<H;X++){const J=B[X],j=C[J.materialIndex];if(j&&j.visible){const Q=A(S,j,R,D);S.onBeforeShadow(i,S,E,y,L,Q,J),i.renderBufferDirect(y,null,L,Q,S,J),S.onAfterShadow(i,S,E,y,L,Q,J)}}}else if(C.visible){const B=A(S,C,R,D);S.onBeforeShadow(i,S,E,y,L,B,null),i.renderBufferDirect(y,null,L,B,S,null),S.onAfterShadow(i,S,E,y,L,B,null)}}const U=S.children;for(let L=0,C=U.length;L<C;L++)w(U[L],E,y,R,D)}function x(S){S.target.removeEventListener("dispose",x);for(const y in l){const R=l[y],D=S.target.uuid;D in R&&(R[D].dispose(),delete R[D])}}}function Wh(i,e){function t(){let F=!1;const oe=new nt;let K=null;const le=new nt(0,0,0,0);return{setMask:function(fe){K!==fe&&!F&&(i.colorMask(fe,fe,fe,fe),K=fe)},setLocked:function(fe){F=fe},setClear:function(fe,te,Re,be,rt){rt===!0&&(fe*=be,te*=be,Re*=be),oe.set(fe,te,Re,be),le.equals(oe)===!1&&(i.clearColor(fe,te,Re,be),le.copy(oe))},reset:function(){F=!1,K=null,le.set(-1,0,0,0)}}}function n(){let F=!1,oe=!1,K=null,le=null,fe=null;return{setReversed:function(te){if(oe!==te){const Re=e.get("EXT_clip_control");te?Re.clipControlEXT(Re.LOWER_LEFT_EXT,Re.ZERO_TO_ONE_EXT):Re.clipControlEXT(Re.LOWER_LEFT_EXT,Re.NEGATIVE_ONE_TO_ONE_EXT),oe=te;const be=fe;fe=null,this.setClear(be)}},getReversed:function(){return oe},setTest:function(te){te?ee(i.DEPTH_TEST):_e(i.DEPTH_TEST)},setMask:function(te){K!==te&&!F&&(i.depthMask(te),K=te)},setFunc:function(te){if(oe&&(te=so[te]),le!==te){switch(te){case 0:i.depthFunc(i.NEVER);break;case 1:i.depthFunc(i.ALWAYS);break;case 2:i.depthFunc(i.LESS);break;case 3:i.depthFunc(i.LEQUAL);break;case 4:i.depthFunc(i.EQUAL);break;case 5:i.depthFunc(i.GEQUAL);break;case 6:i.depthFunc(i.GREATER);break;case 7:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}le=te}},setLocked:function(te){F=te},setClear:function(te){fe!==te&&(fe=te,oe&&(te=1-te),i.clearDepth(te))},reset:function(){F=!1,K=null,le=null,fe=null,oe=!1}}}function a(){let F=!1,oe=null,K=null,le=null,fe=null,te=null,Re=null,be=null,rt=null;return{setTest:function(Ye){F||(Ye?ee(i.STENCIL_TEST):_e(i.STENCIL_TEST))},setMask:function(Ye){oe!==Ye&&!F&&(i.stencilMask(Ye),oe=Ye)},setFunc:function(Ye,zt,$t){(K!==Ye||le!==zt||fe!==$t)&&(i.stencilFunc(Ye,zt,$t),K=Ye,le=zt,fe=$t)},setOp:function(Ye,zt,$t){(te!==Ye||Re!==zt||be!==$t)&&(i.stencilOp(Ye,zt,$t),te=Ye,Re=zt,be=$t)},setLocked:function(Ye){F=Ye},setClear:function(Ye){rt!==Ye&&(i.clearStencil(Ye),rt=Ye)},reset:function(){F=!1,oe=null,K=null,le=null,fe=null,te=null,Re=null,be=null,rt=null}}}const r=new t,s=new n,o=new a,c=new WeakMap,l=new WeakMap;let h={},d={},u={},f=new WeakMap,v=[],g=null,p=!1,m=null,M=null,A=null,w=null,x=null,S=null,E=null,y=new qe(0,0,0),R=0,D=!1,P=null,U=null,L=null,C=null,B=null;const X=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let H=!1,J=0;const j=i.getParameter(i.VERSION);j.indexOf("WebGL")!==-1?(J=parseFloat(/^WebGL (\d)/.exec(j)[1]),H=J>=1):j.indexOf("OpenGL ES")!==-1&&(J=parseFloat(/^OpenGL ES (\d)/.exec(j)[1]),H=J>=2);let Q=null,ne={};const Te=i.getParameter(i.SCISSOR_BOX),Ee=i.getParameter(i.VIEWPORT),it=new nt().fromArray(Te),Ve=new nt().fromArray(Ee);function je(F,oe,K,le){const fe=new Uint8Array(4),te=i.createTexture();i.bindTexture(F,te),i.texParameteri(F,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(F,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let Re=0;Re<K;Re++)F===i.TEXTURE_3D||F===i.TEXTURE_2D_ARRAY?i.texImage3D(oe,0,i.RGBA,1,1,le,0,i.RGBA,i.UNSIGNED_BYTE,fe):i.texImage2D(oe+Re,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,fe);return te}const Y={};Y[i.TEXTURE_2D]=je(i.TEXTURE_2D,i.TEXTURE_2D,1),Y[i.TEXTURE_CUBE_MAP]=je(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),Y[i.TEXTURE_2D_ARRAY]=je(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),Y[i.TEXTURE_3D]=je(i.TEXTURE_3D,i.TEXTURE_3D,1,1),r.setClear(0,0,0,1),s.setClear(1),o.setClear(0),ee(i.DEPTH_TEST),s.setFunc(3),Oe(!1),lt(1),ee(i.CULL_FACE),We(0);function ee(F){h[F]!==!0&&(i.enable(F),h[F]=!0)}function _e(F){h[F]!==!1&&(i.disable(F),h[F]=!1)}function Le(F,oe){return u[F]!==oe?(i.bindFramebuffer(F,oe),u[F]=oe,F===i.DRAW_FRAMEBUFFER&&(u[i.FRAMEBUFFER]=oe),F===i.FRAMEBUFFER&&(u[i.DRAW_FRAMEBUFFER]=oe),!0):!1}function ve(F,oe){let K=v,le=!1;if(F){K=f.get(oe),K===void 0&&(K=[],f.set(oe,K));const fe=F.textures;if(K.length!==fe.length||K[0]!==i.COLOR_ATTACHMENT0){for(let te=0,Re=fe.length;te<Re;te++)K[te]=i.COLOR_ATTACHMENT0+te;K.length=fe.length,le=!0}}else K[0]!==i.BACK&&(K[0]=i.BACK,le=!0);le&&i.drawBuffers(K)}function Fe(F){return g!==F?(i.useProgram(F),g=F,!0):!1}const mt={100:i.FUNC_ADD,101:i.FUNC_SUBTRACT,102:i.FUNC_REVERSE_SUBTRACT};mt[103]=i.MIN,mt[104]=i.MAX;const Ne={200:i.ZERO,201:i.ONE,202:i.SRC_COLOR,204:i.SRC_ALPHA,210:i.SRC_ALPHA_SATURATE,208:i.DST_COLOR,206:i.DST_ALPHA,203:i.ONE_MINUS_SRC_COLOR,205:i.ONE_MINUS_SRC_ALPHA,209:i.ONE_MINUS_DST_COLOR,207:i.ONE_MINUS_DST_ALPHA,211:i.CONSTANT_COLOR,212:i.ONE_MINUS_CONSTANT_COLOR,213:i.CONSTANT_ALPHA,214:i.ONE_MINUS_CONSTANT_ALPHA};function We(F,oe,K,le,fe,te,Re,be,rt,Ye){if(F===0){p===!0&&(_e(i.BLEND),p=!1);return}if(p===!1&&(ee(i.BLEND),p=!0),F!==5){if(F!==m||Ye!==D){if((M!==100||x!==100)&&(i.blendEquation(i.FUNC_ADD),M=100,x=100),Ye)switch(F){case 1:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case 2:i.blendFunc(i.ONE,i.ONE);break;case 3:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case 4:i.blendFuncSeparate(i.DST_COLOR,i.ONE_MINUS_SRC_ALPHA,i.ZERO,i.ONE);break;default:Xe("WebGLState: Invalid blending: ",F);break}else switch(F){case 1:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case 2:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE,i.ONE,i.ONE);break;case 3:Xe("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case 4:Xe("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:Xe("WebGLState: Invalid blending: ",F);break}A=null,w=null,S=null,E=null,y.set(0,0,0),R=0,m=F,D=Ye}return}fe=fe||oe,te=te||K,Re=Re||le,(oe!==M||fe!==x)&&(i.blendEquationSeparate(mt[oe],mt[fe]),M=oe,x=fe),(K!==A||le!==w||te!==S||Re!==E)&&(i.blendFuncSeparate(Ne[K],Ne[le],Ne[te],Ne[Re]),A=K,w=le,S=te,E=Re),(be.equals(y)===!1||rt!==R)&&(i.blendColor(be.r,be.g,be.b,rt),y.copy(be),R=rt),m=F,D=!1}function at(F,oe){F.side===2?_e(i.CULL_FACE):ee(i.CULL_FACE);let K=F.side===1;oe&&(K=!K),Oe(K),F.blending===1&&F.transparent===!1?We(0):We(F.blending,F.blendEquation,F.blendSrc,F.blendDst,F.blendEquationAlpha,F.blendSrcAlpha,F.blendDstAlpha,F.blendColor,F.blendAlpha,F.premultipliedAlpha),s.setFunc(F.depthFunc),s.setTest(F.depthTest),s.setMask(F.depthWrite),r.setMask(F.colorWrite);const le=F.stencilWrite;o.setTest(le),le&&(o.setMask(F.stencilWriteMask),o.setFunc(F.stencilFunc,F.stencilRef,F.stencilFuncMask),o.setOp(F.stencilFail,F.stencilZFail,F.stencilZPass)),Ct(F.polygonOffset,F.polygonOffsetFactor,F.polygonOffsetUnits),F.alphaToCoverage===!0?ee(i.SAMPLE_ALPHA_TO_COVERAGE):_e(i.SAMPLE_ALPHA_TO_COVERAGE)}function Oe(F){P!==F&&(F?i.frontFace(i.CW):i.frontFace(i.CCW),P=F)}function lt(F){F!==0?(ee(i.CULL_FACE),F!==U&&(F===1?i.cullFace(i.BACK):F===2?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):_e(i.CULL_FACE),U=F}function yt(F){F!==L&&(H&&i.lineWidth(F),L=F)}function Ct(F,oe,K){F?(ee(i.POLYGON_OFFSET_FILL),(C!==oe||B!==K)&&(C=oe,B=K,s.getReversed()&&(oe=-oe),i.polygonOffset(oe,K))):_e(i.POLYGON_OFFSET_FILL)}function ct(F){F?ee(i.SCISSOR_TEST):_e(i.SCISSOR_TEST)}function ht(F){F===void 0&&(F=i.TEXTURE0+X-1),Q!==F&&(i.activeTexture(F),Q=F)}function N(F,oe,K){K===void 0&&(Q===null?K=i.TEXTURE0+X-1:K=Q);let le=ne[K];le===void 0&&(le={type:void 0,texture:void 0},ne[K]=le),(le.type!==F||le.texture!==oe)&&(Q!==K&&(i.activeTexture(K),Q=K),i.bindTexture(F,oe||Y[F]),le.type=F,le.texture=oe)}function bt(){const F=ne[Q];F!==void 0&&F.type!==void 0&&(i.bindTexture(F.type,null),F.type=void 0,F.texture=void 0)}function Ze(){try{i.compressedTexImage2D(...arguments)}catch(F){Xe("WebGLState:",F)}}function T(){try{i.compressedTexImage3D(...arguments)}catch(F){Xe("WebGLState:",F)}}function _(){try{i.texSubImage2D(...arguments)}catch(F){Xe("WebGLState:",F)}}function z(){try{i.texSubImage3D(...arguments)}catch(F){Xe("WebGLState:",F)}}function V(){try{i.compressedTexSubImage2D(...arguments)}catch(F){Xe("WebGLState:",F)}}function q(){try{i.compressedTexSubImage3D(...arguments)}catch(F){Xe("WebGLState:",F)}}function ie(){try{i.texStorage2D(...arguments)}catch(F){Xe("WebGLState:",F)}}function ae(){try{i.texStorage3D(...arguments)}catch(F){Xe("WebGLState:",F)}}function $(){try{i.texImage2D(...arguments)}catch(F){Xe("WebGLState:",F)}}function Z(){try{i.texImage3D(...arguments)}catch(F){Xe("WebGLState:",F)}}function re(F){return d[F]!==void 0?d[F]:i.getParameter(F)}function we(F,oe){d[F]!==oe&&(i.pixelStorei(F,oe),d[F]=oe)}function ce(F){it.equals(F)===!1&&(i.scissor(F.x,F.y,F.z,F.w),it.copy(F))}function se(F){Ve.equals(F)===!1&&(i.viewport(F.x,F.y,F.z,F.w),Ve.copy(F))}function Me(F,oe){let K=l.get(oe);K===void 0&&(K=new WeakMap,l.set(oe,K));let le=K.get(F);le===void 0&&(le=i.getUniformBlockIndex(oe,F.name),K.set(F,le))}function Ae(F,oe){const le=l.get(oe).get(F);c.get(oe)!==le&&(i.uniformBlockBinding(oe,le,F.__bindingPointIndex),c.set(oe,le))}function De(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),s.setReversed(!1),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),i.pixelStorei(i.PACK_ALIGNMENT,4),i.pixelStorei(i.UNPACK_ALIGNMENT,4),i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,!1),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,i.BROWSER_DEFAULT_WEBGL),i.pixelStorei(i.PACK_ROW_LENGTH,0),i.pixelStorei(i.PACK_SKIP_PIXELS,0),i.pixelStorei(i.PACK_SKIP_ROWS,0),i.pixelStorei(i.UNPACK_ROW_LENGTH,0),i.pixelStorei(i.UNPACK_IMAGE_HEIGHT,0),i.pixelStorei(i.UNPACK_SKIP_PIXELS,0),i.pixelStorei(i.UNPACK_SKIP_ROWS,0),i.pixelStorei(i.UNPACK_SKIP_IMAGES,0),h={},d={},Q=null,ne={},u={},f=new WeakMap,v=[],g=null,p=!1,m=null,M=null,A=null,w=null,x=null,S=null,E=null,y=new qe(0,0,0),R=0,D=!1,P=null,U=null,L=null,C=null,B=null,it.set(0,0,i.canvas.width,i.canvas.height),Ve.set(0,0,i.canvas.width,i.canvas.height),r.reset(),s.reset(),o.reset()}return{buffers:{color:r,depth:s,stencil:o},enable:ee,disable:_e,bindFramebuffer:Le,drawBuffers:ve,useProgram:Fe,setBlending:We,setMaterial:at,setFlipSided:Oe,setCullFace:lt,setLineWidth:yt,setPolygonOffset:Ct,setScissorTest:ct,activeTexture:ht,bindTexture:N,unbindTexture:bt,compressedTexImage2D:Ze,compressedTexImage3D:T,texImage2D:$,texImage3D:Z,pixelStorei:we,getParameter:re,updateUBOMapping:Me,uniformBlockBinding:Ae,texStorage2D:ie,texStorage3D:ae,texSubImage2D:_,texSubImage3D:z,compressedTexSubImage2D:V,compressedTexSubImage3D:q,scissor:ce,viewport:se,reset:De}}function Xh(i,e,t,n,a,r,s){const o=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,c=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),l=new Ge,h=new WeakMap,d=new Set;let u;const f=new WeakMap;let v=!1;try{v=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function g(T,_){return v?new OffscreenCanvas(T,_):ra("canvas")}function p(T,_,z){let V=1;const q=Ze(T);if((q.width>z||q.height>z)&&(V=z/Math.max(q.width,q.height)),V<1)if(typeof HTMLImageElement<"u"&&T instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&T instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&T instanceof ImageBitmap||typeof VideoFrame<"u"&&T instanceof VideoFrame){const ie=Math.floor(V*q.width),ae=Math.floor(V*q.height);u===void 0&&(u=g(ie,ae));const $=_?g(ie,ae):u;return $.width=ie,$.height=ae,$.getContext("2d").drawImage(T,0,0,ie,ae),Ce("WebGLRenderer: Texture has been resized from ("+q.width+"x"+q.height+") to ("+ie+"x"+ae+")."),$}else return"data"in T&&Ce("WebGLRenderer: Image in DataTexture is too big ("+q.width+"x"+q.height+")."),T;return T}function m(T){return T.generateMipmaps}function M(T){i.generateMipmap(T)}function A(T){return T.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:T.isWebGL3DRenderTarget?i.TEXTURE_3D:T.isWebGLArrayRenderTarget||T.isCompressedArrayTexture?i.TEXTURE_2D_ARRAY:i.TEXTURE_2D}function w(T,_,z,V,q,ie=!1){if(T!==null){if(i[T]!==void 0)return i[T];Ce("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+T+"'")}let ae;V&&(ae=e.get("EXT_texture_norm16"),ae||Ce("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let $=_;if(_===i.RED&&(z===i.FLOAT&&($=i.R32F),z===i.HALF_FLOAT&&($=i.R16F),z===i.UNSIGNED_BYTE&&($=i.R8),z===i.UNSIGNED_SHORT&&ae&&($=ae.R16_EXT),z===i.SHORT&&ae&&($=ae.R16_SNORM_EXT)),_===i.RED_INTEGER&&(z===i.UNSIGNED_BYTE&&($=i.R8UI),z===i.UNSIGNED_SHORT&&($=i.R16UI),z===i.UNSIGNED_INT&&($=i.R32UI),z===i.BYTE&&($=i.R8I),z===i.SHORT&&($=i.R16I),z===i.INT&&($=i.R32I)),_===i.RG&&(z===i.FLOAT&&($=i.RG32F),z===i.HALF_FLOAT&&($=i.RG16F),z===i.UNSIGNED_BYTE&&($=i.RG8),z===i.UNSIGNED_SHORT&&ae&&($=ae.RG16_EXT),z===i.SHORT&&ae&&($=ae.RG16_SNORM_EXT)),_===i.RG_INTEGER&&(z===i.UNSIGNED_BYTE&&($=i.RG8UI),z===i.UNSIGNED_SHORT&&($=i.RG16UI),z===i.UNSIGNED_INT&&($=i.RG32UI),z===i.BYTE&&($=i.RG8I),z===i.SHORT&&($=i.RG16I),z===i.INT&&($=i.RG32I)),_===i.RGB_INTEGER&&(z===i.UNSIGNED_BYTE&&($=i.RGB8UI),z===i.UNSIGNED_SHORT&&($=i.RGB16UI),z===i.UNSIGNED_INT&&($=i.RGB32UI),z===i.BYTE&&($=i.RGB8I),z===i.SHORT&&($=i.RGB16I),z===i.INT&&($=i.RGB32I)),_===i.RGBA_INTEGER&&(z===i.UNSIGNED_BYTE&&($=i.RGBA8UI),z===i.UNSIGNED_SHORT&&($=i.RGBA16UI),z===i.UNSIGNED_INT&&($=i.RGBA32UI),z===i.BYTE&&($=i.RGBA8I),z===i.SHORT&&($=i.RGBA16I),z===i.INT&&($=i.RGBA32I)),_===i.RGB&&(z===i.UNSIGNED_SHORT&&ae&&($=ae.RGB16_EXT),z===i.SHORT&&ae&&($=ae.RGB16_SNORM_EXT),z===i.UNSIGNED_INT_5_9_9_9_REV&&($=i.RGB9_E5),z===i.UNSIGNED_INT_10F_11F_11F_REV&&($=i.R11F_G11F_B10F)),_===i.RGBA){const Z=ie?aa:ke.getTransfer(q);z===i.FLOAT&&($=i.RGBA32F),z===i.HALF_FLOAT&&($=i.RGBA16F),z===i.UNSIGNED_BYTE&&($=Z===Je?i.SRGB8_ALPHA8:i.RGBA8),z===i.UNSIGNED_SHORT&&ae&&($=ae.RGBA16_EXT),z===i.SHORT&&ae&&($=ae.RGBA16_SNORM_EXT),z===i.UNSIGNED_SHORT_4_4_4_4&&($=i.RGBA4),z===i.UNSIGNED_SHORT_5_5_5_1&&($=i.RGB5_A1)}return($===i.R16F||$===i.R32F||$===i.RG16F||$===i.RG32F||$===i.RGBA16F||$===i.RGBA32F)&&e.get("EXT_color_buffer_float"),$}function x(T,_){let z;return T?_===null||_===1014||_===1020?z=i.DEPTH24_STENCIL8:_===1015?z=i.DEPTH32F_STENCIL8:_===1012&&(z=i.DEPTH24_STENCIL8,Ce("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):_===null||_===1014||_===1020?z=i.DEPTH_COMPONENT24:_===1015?z=i.DEPTH_COMPONENT32F:_===1012&&(z=i.DEPTH_COMPONENT16),z}function S(T,_){return m(T)===!0||T.isFramebufferTexture&&T.minFilter!==1003&&T.minFilter!==1006?Math.log2(Math.max(_.width,_.height))+1:T.mipmaps!==void 0&&T.mipmaps.length>0?T.mipmaps.length:T.isCompressedTexture&&Array.isArray(T.image)?_.mipmaps.length:1}function E(T){const _=T.target;_.removeEventListener("dispose",E),R(_),_.isVideoTexture&&h.delete(_),_.isHTMLTexture&&d.delete(_)}function y(T){const _=T.target;_.removeEventListener("dispose",y),P(_)}function R(T){const _=n.get(T);if(_.__webglInit===void 0)return;const z=T.source,V=f.get(z);if(V){const q=V[_.__cacheKey];q.usedTimes--,q.usedTimes===0&&D(T),Object.keys(V).length===0&&f.delete(z)}n.remove(T)}function D(T){const _=n.get(T);i.deleteTexture(_.__webglTexture);const z=T.source,V=f.get(z);delete V[_.__cacheKey],s.memory.textures--}function P(T){const _=n.get(T);if(T.depthTexture&&(T.depthTexture.dispose(),n.remove(T.depthTexture)),T.isWebGLCubeRenderTarget)for(let V=0;V<6;V++){if(Array.isArray(_.__webglFramebuffer[V]))for(let q=0;q<_.__webglFramebuffer[V].length;q++)i.deleteFramebuffer(_.__webglFramebuffer[V][q]);else i.deleteFramebuffer(_.__webglFramebuffer[V]);_.__webglDepthbuffer&&i.deleteRenderbuffer(_.__webglDepthbuffer[V])}else{if(Array.isArray(_.__webglFramebuffer))for(let V=0;V<_.__webglFramebuffer.length;V++)i.deleteFramebuffer(_.__webglFramebuffer[V]);else i.deleteFramebuffer(_.__webglFramebuffer);if(_.__webglDepthbuffer&&i.deleteRenderbuffer(_.__webglDepthbuffer),_.__webglMultisampledFramebuffer&&i.deleteFramebuffer(_.__webglMultisampledFramebuffer),_.__webglColorRenderbuffer)for(let V=0;V<_.__webglColorRenderbuffer.length;V++)_.__webglColorRenderbuffer[V]&&i.deleteRenderbuffer(_.__webglColorRenderbuffer[V]);_.__webglDepthRenderbuffer&&i.deleteRenderbuffer(_.__webglDepthRenderbuffer)}const z=T.textures;for(let V=0,q=z.length;V<q;V++){const ie=n.get(z[V]);ie.__webglTexture&&(i.deleteTexture(ie.__webglTexture),s.memory.textures--),n.remove(z[V])}n.remove(T)}let U=0;function L(){U=0}function C(){return U}function B(T){U=T}function X(){const T=U;return T>=a.maxTextures&&Ce("WebGLTextures: Trying to use "+(T+1)+" texture units while this GPU supports only "+a.maxTextures),U+=1,T}function H(T){const _=[];return _.push(T.wrapS),_.push(T.wrapT),_.push(T.wrapR||0),_.push(T.magFilter),_.push(T.minFilter),_.push(T.anisotropy),_.push(T.internalFormat),_.push(T.format),_.push(T.type),_.push(T.generateMipmaps),_.push(T.premultiplyAlpha),_.push(T.flipY),_.push(T.unpackAlignment),_.push(T.colorSpace),_.join()}function J(T,_){const z=n.get(T);if(T.isVideoTexture&&N(T),T.isRenderTargetTexture===!1&&T.isExternalTexture!==!0&&T.version>0&&z.__version!==T.version){const V=T.image;if(V===null)Ce("WebGLRenderer: Texture marked for update but no image data found.");else if(V.complete===!1)Ce("WebGLRenderer: Texture marked for update but image is incomplete");else{_e(z,T,_);return}}else T.isExternalTexture&&(z.__webglTexture=T.sourceTexture?T.sourceTexture:null);t.bindTexture(i.TEXTURE_2D,z.__webglTexture,i.TEXTURE0+_)}function j(T,_){const z=n.get(T);if(T.isRenderTargetTexture===!1&&T.version>0&&z.__version!==T.version){_e(z,T,_);return}else T.isExternalTexture&&(z.__webglTexture=T.sourceTexture?T.sourceTexture:null);t.bindTexture(i.TEXTURE_2D_ARRAY,z.__webglTexture,i.TEXTURE0+_)}function Q(T,_){const z=n.get(T);if(T.isRenderTargetTexture===!1&&T.version>0&&z.__version!==T.version){_e(z,T,_);return}t.bindTexture(i.TEXTURE_3D,z.__webglTexture,i.TEXTURE0+_)}function ne(T,_){const z=n.get(T);if(T.isCubeDepthTexture!==!0&&T.version>0&&z.__version!==T.version){Le(z,T,_);return}t.bindTexture(i.TEXTURE_CUBE_MAP,z.__webglTexture,i.TEXTURE0+_)}const Te={1e3:i.REPEAT,1001:i.CLAMP_TO_EDGE,1002:i.MIRRORED_REPEAT},Ee={1003:i.NEAREST,1004:i.NEAREST_MIPMAP_NEAREST,1005:i.NEAREST_MIPMAP_LINEAR,1006:i.LINEAR,1007:i.LINEAR_MIPMAP_NEAREST,1008:i.LINEAR_MIPMAP_LINEAR},it={512:i.NEVER,519:i.ALWAYS,513:i.LESS,515:i.LEQUAL,514:i.EQUAL,518:i.GEQUAL,516:i.GREATER,517:i.NOTEQUAL};function Ve(T,_){if(_.type===1015&&e.has("OES_texture_float_linear")===!1&&(_.magFilter===1006||_.magFilter===1007||_.magFilter===1005||_.magFilter===1008||_.minFilter===1006||_.minFilter===1007||_.minFilter===1005||_.minFilter===1008)&&Ce("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(T,i.TEXTURE_WRAP_S,Te[_.wrapS]),i.texParameteri(T,i.TEXTURE_WRAP_T,Te[_.wrapT]),(T===i.TEXTURE_3D||T===i.TEXTURE_2D_ARRAY)&&i.texParameteri(T,i.TEXTURE_WRAP_R,Te[_.wrapR]),i.texParameteri(T,i.TEXTURE_MAG_FILTER,Ee[_.magFilter]),i.texParameteri(T,i.TEXTURE_MIN_FILTER,Ee[_.minFilter]),_.compareFunction&&(i.texParameteri(T,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(T,i.TEXTURE_COMPARE_FUNC,it[_.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(_.magFilter===1003||_.minFilter!==1005&&_.minFilter!==1008||_.type===1015&&e.has("OES_texture_float_linear")===!1)return;if(_.anisotropy>1||n.get(_).__currentAnisotropy){const z=e.get("EXT_texture_filter_anisotropic");i.texParameterf(T,z.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(_.anisotropy,a.getMaxAnisotropy())),n.get(_).__currentAnisotropy=_.anisotropy}}}function je(T,_){let z=!1;T.__webglInit===void 0&&(T.__webglInit=!0,_.addEventListener("dispose",E));const V=_.source;let q=f.get(V);q===void 0&&(q={},f.set(V,q));const ie=H(_);if(ie!==T.__cacheKey){q[ie]===void 0&&(q[ie]={texture:i.createTexture(),usedTimes:0},s.memory.textures++,z=!0),q[ie].usedTimes++;const ae=q[T.__cacheKey];ae!==void 0&&(q[T.__cacheKey].usedTimes--,ae.usedTimes===0&&D(_)),T.__cacheKey=ie,T.__webglTexture=q[ie].texture}return z}function Y(T,_,z){return Math.floor(Math.floor(T/z)/_)}function ee(T,_,z,V){const ie=T.updateRanges;if(ie.length===0)t.texSubImage2D(i.TEXTURE_2D,0,0,0,_.width,_.height,z,V,_.data);else{ie.sort((we,ce)=>we.start-ce.start);let ae=0;for(let we=1;we<ie.length;we++){const ce=ie[ae],se=ie[we],Me=ce.start+ce.count,Ae=Y(se.start,_.width,4),De=Y(ce.start,_.width,4);se.start<=Me+1&&Ae===De&&Y(se.start+se.count-1,_.width,4)===Ae?ce.count=Math.max(ce.count,se.start+se.count-ce.start):(++ae,ie[ae]=se)}ie.length=ae+1;const $=t.getParameter(i.UNPACK_ROW_LENGTH),Z=t.getParameter(i.UNPACK_SKIP_PIXELS),re=t.getParameter(i.UNPACK_SKIP_ROWS);t.pixelStorei(i.UNPACK_ROW_LENGTH,_.width);for(let we=0,ce=ie.length;we<ce;we++){const se=ie[we],Me=Math.floor(se.start/4),Ae=Math.ceil(se.count/4),De=Me%_.width,F=Math.floor(Me/_.width),oe=Ae,K=1;t.pixelStorei(i.UNPACK_SKIP_PIXELS,De),t.pixelStorei(i.UNPACK_SKIP_ROWS,F),t.texSubImage2D(i.TEXTURE_2D,0,De,F,oe,K,z,V,_.data)}T.clearUpdateRanges(),t.pixelStorei(i.UNPACK_ROW_LENGTH,$),t.pixelStorei(i.UNPACK_SKIP_PIXELS,Z),t.pixelStorei(i.UNPACK_SKIP_ROWS,re)}}function _e(T,_,z){let V=i.TEXTURE_2D;(_.isDataArrayTexture||_.isCompressedArrayTexture)&&(V=i.TEXTURE_2D_ARRAY),_.isData3DTexture&&(V=i.TEXTURE_3D);const q=je(T,_),ie=_.source;t.bindTexture(V,T.__webglTexture,i.TEXTURE0+z);const ae=n.get(ie);if(ie.version!==ae.__version||q===!0){if(t.activeTexture(i.TEXTURE0+z),(typeof ImageBitmap<"u"&&_.image instanceof ImageBitmap)===!1){const K=ke.getPrimaries(ke.workingColorSpace),le=_.colorSpace===""?null:ke.getPrimaries(_.colorSpace),fe=_.colorSpace===""||K===le?i.NONE:i.BROWSER_DEFAULT_WEBGL;t.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,_.flipY),t.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,_.premultiplyAlpha),t.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,fe)}t.pixelStorei(i.UNPACK_ALIGNMENT,_.unpackAlignment);let Z=p(_.image,!1,a.maxTextureSize);Z=bt(_,Z);const re=r.convert(_.format,_.colorSpace),we=r.convert(_.type);let ce=w(_.internalFormat,re,we,_.normalized,_.colorSpace,_.isVideoTexture);Ve(V,_);let se;const Me=_.mipmaps,Ae=_.isVideoTexture!==!0,De=ae.__version===void 0||q===!0,F=ie.dataReady,oe=S(_,Z);if(_.isDepthTexture)ce=x(_.format===1027,_.type),De&&(Ae?t.texStorage2D(i.TEXTURE_2D,1,ce,Z.width,Z.height):t.texImage2D(i.TEXTURE_2D,0,ce,Z.width,Z.height,0,re,we,null));else if(_.isDataTexture)if(Me.length>0){Ae&&De&&t.texStorage2D(i.TEXTURE_2D,oe,ce,Me[0].width,Me[0].height);for(let K=0,le=Me.length;K<le;K++)se=Me[K],Ae?F&&t.texSubImage2D(i.TEXTURE_2D,K,0,0,se.width,se.height,re,we,se.data):t.texImage2D(i.TEXTURE_2D,K,ce,se.width,se.height,0,re,we,se.data);_.generateMipmaps=!1}else Ae?(De&&t.texStorage2D(i.TEXTURE_2D,oe,ce,Z.width,Z.height),F&&ee(_,Z,re,we)):t.texImage2D(i.TEXTURE_2D,0,ce,Z.width,Z.height,0,re,we,Z.data);else if(_.isCompressedTexture)if(_.isCompressedArrayTexture){Ae&&De&&t.texStorage3D(i.TEXTURE_2D_ARRAY,oe,ce,Me[0].width,Me[0].height,Z.depth);for(let K=0,le=Me.length;K<le;K++)if(se=Me[K],_.format!==1023)if(re!==null)if(Ae){if(F)if(_.layerUpdates.size>0){const fe=Hr(se.width,se.height,_.format,_.type);for(const te of _.layerUpdates){const Re=se.data.subarray(te*fe/se.data.BYTES_PER_ELEMENT,(te+1)*fe/se.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,K,0,0,te,se.width,se.height,1,re,Re)}}else t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,K,0,0,0,se.width,se.height,Z.depth,re,se.data)}else t.compressedTexImage3D(i.TEXTURE_2D_ARRAY,K,ce,se.width,se.height,Z.depth,0,se.data,0,0);else Ce("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Ae?F&&t.texSubImage3D(i.TEXTURE_2D_ARRAY,K,0,0,0,se.width,se.height,Z.depth,re,we,se.data):t.texImage3D(i.TEXTURE_2D_ARRAY,K,ce,se.width,se.height,Z.depth,0,re,we,se.data);_.layerUpdates.size>0&&_.clearLayerUpdates()}else{Ae&&De&&t.texStorage2D(i.TEXTURE_2D,oe,ce,Me[0].width,Me[0].height);for(let K=0,le=Me.length;K<le;K++)se=Me[K],_.format!==1023?re!==null?Ae?F&&t.compressedTexSubImage2D(i.TEXTURE_2D,K,0,0,se.width,se.height,re,se.data):t.compressedTexImage2D(i.TEXTURE_2D,K,ce,se.width,se.height,0,se.data):Ce("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Ae?F&&t.texSubImage2D(i.TEXTURE_2D,K,0,0,se.width,se.height,re,we,se.data):t.texImage2D(i.TEXTURE_2D,K,ce,se.width,se.height,0,re,we,se.data)}else if(_.isDataArrayTexture)if(Ae){if(De&&t.texStorage3D(i.TEXTURE_2D_ARRAY,oe,ce,Z.width,Z.height,Z.depth),F)if(_.layerUpdates.size>0){const K=Hr(Z.width,Z.height,_.format,_.type);for(const le of _.layerUpdates){const fe=Z.data.subarray(le*K/Z.data.BYTES_PER_ELEMENT,(le+1)*K/Z.data.BYTES_PER_ELEMENT);t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,le,Z.width,Z.height,1,re,we,fe)}_.clearLayerUpdates()}else t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,Z.width,Z.height,Z.depth,re,we,Z.data)}else t.texImage3D(i.TEXTURE_2D_ARRAY,0,ce,Z.width,Z.height,Z.depth,0,re,we,Z.data);else if(_.isData3DTexture)Ae?(De&&t.texStorage3D(i.TEXTURE_3D,oe,ce,Z.width,Z.height,Z.depth),F&&t.texSubImage3D(i.TEXTURE_3D,0,0,0,0,Z.width,Z.height,Z.depth,re,we,Z.data)):t.texImage3D(i.TEXTURE_3D,0,ce,Z.width,Z.height,Z.depth,0,re,we,Z.data);else if(_.isFramebufferTexture){if(De)if(Ae)t.texStorage2D(i.TEXTURE_2D,oe,ce,Z.width,Z.height);else{let K=Z.width,le=Z.height;for(let fe=0;fe<oe;fe++)t.texImage2D(i.TEXTURE_2D,fe,ce,K,le,0,re,we,null),K>>=1,le>>=1}}else if(_.isHTMLTexture){if("texElementImage2D"in i){const K=i.canvas;if(K.hasAttribute("layoutsubtree")||K.setAttribute("layoutsubtree","true"),Z.parentNode!==K){K.appendChild(Z),d.add(_),K.onpaint=le=>{const fe=le.changedElements;for(const te of d)fe.includes(te.image)&&(te.needsUpdate=!0)},K.requestPaint();return}if(i.texElementImage2D.length===3)i.texElementImage2D(i.TEXTURE_2D,i.RGBA8,Z);else{const fe=i.RGBA,te=i.RGBA,Re=i.UNSIGNED_BYTE;i.texElementImage2D(i.TEXTURE_2D,0,fe,te,Re,Z)}i.texParameteri(i.TEXTURE_2D,i.TEXTURE_MIN_FILTER,i.LINEAR),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_S,i.CLAMP_TO_EDGE),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_T,i.CLAMP_TO_EDGE)}}else if(Me.length>0){if(Ae&&De){const K=Ze(Me[0]);t.texStorage2D(i.TEXTURE_2D,oe,ce,K.width,K.height)}for(let K=0,le=Me.length;K<le;K++)se=Me[K],Ae?F&&t.texSubImage2D(i.TEXTURE_2D,K,0,0,re,we,se):t.texImage2D(i.TEXTURE_2D,K,ce,re,we,se);_.generateMipmaps=!1}else if(Ae){if(De){const K=Ze(Z);t.texStorage2D(i.TEXTURE_2D,oe,ce,K.width,K.height)}F&&t.texSubImage2D(i.TEXTURE_2D,0,0,0,re,we,Z)}else t.texImage2D(i.TEXTURE_2D,0,ce,re,we,Z);m(_)&&M(V),ae.__version=ie.version,_.onUpdate&&_.onUpdate(_)}T.__version=_.version}function Le(T,_,z){if(_.image.length!==6)return;const V=je(T,_),q=_.source;t.bindTexture(i.TEXTURE_CUBE_MAP,T.__webglTexture,i.TEXTURE0+z);const ie=n.get(q);if(q.version!==ie.__version||V===!0){t.activeTexture(i.TEXTURE0+z);const ae=ke.getPrimaries(ke.workingColorSpace),$=_.colorSpace===""?null:ke.getPrimaries(_.colorSpace),Z=_.colorSpace===""||ae===$?i.NONE:i.BROWSER_DEFAULT_WEBGL;t.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,_.flipY),t.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,_.premultiplyAlpha),t.pixelStorei(i.UNPACK_ALIGNMENT,_.unpackAlignment),t.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,Z);const re=_.isCompressedTexture||_.image[0].isCompressedTexture,we=_.image[0]&&_.image[0].isDataTexture,ce=[];for(let te=0;te<6;te++)!re&&!we?ce[te]=p(_.image[te],!0,a.maxCubemapSize):ce[te]=we?_.image[te].image:_.image[te],ce[te]=bt(_,ce[te]);const se=ce[0],Me=r.convert(_.format,_.colorSpace),Ae=r.convert(_.type),De=w(_.internalFormat,Me,Ae,_.normalized,_.colorSpace),F=_.isVideoTexture!==!0,oe=ie.__version===void 0||V===!0,K=q.dataReady;let le=S(_,se);Ve(i.TEXTURE_CUBE_MAP,_);let fe;if(re){F&&oe&&t.texStorage2D(i.TEXTURE_CUBE_MAP,le,De,se.width,se.height);for(let te=0;te<6;te++){fe=ce[te].mipmaps;for(let Re=0;Re<fe.length;Re++){const be=fe[Re];_.format!==1023?Me!==null?F?K&&t.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+te,Re,0,0,be.width,be.height,Me,be.data):t.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+te,Re,De,be.width,be.height,0,be.data):Ce("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):F?K&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+te,Re,0,0,be.width,be.height,Me,Ae,be.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+te,Re,De,be.width,be.height,0,Me,Ae,be.data)}}}else{if(fe=_.mipmaps,F&&oe){fe.length>0&&le++;const te=Ze(ce[0]);t.texStorage2D(i.TEXTURE_CUBE_MAP,le,De,te.width,te.height)}for(let te=0;te<6;te++)if(we){F?K&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+te,0,0,0,ce[te].width,ce[te].height,Me,Ae,ce[te].data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+te,0,De,ce[te].width,ce[te].height,0,Me,Ae,ce[te].data);for(let Re=0;Re<fe.length;Re++){const rt=fe[Re].image[te].image;F?K&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+te,Re+1,0,0,rt.width,rt.height,Me,Ae,rt.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+te,Re+1,De,rt.width,rt.height,0,Me,Ae,rt.data)}}else{F?K&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+te,0,0,0,Me,Ae,ce[te]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+te,0,De,Me,Ae,ce[te]);for(let Re=0;Re<fe.length;Re++){const be=fe[Re];F?K&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+te,Re+1,0,0,Me,Ae,be.image[te]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+te,Re+1,De,Me,Ae,be.image[te])}}}m(_)&&M(i.TEXTURE_CUBE_MAP),ie.__version=q.version,_.onUpdate&&_.onUpdate(_)}T.__version=_.version}function ve(T,_,z,V,q,ie){const ae=r.convert(z.format,z.colorSpace),$=r.convert(z.type),Z=w(z.internalFormat,ae,$,z.normalized,z.colorSpace),re=n.get(_),we=n.get(z);if(we.__renderTarget=_,!re.__hasExternalTextures){const ce=Math.max(1,_.width>>ie),se=Math.max(1,_.height>>ie);q===i.TEXTURE_3D||q===i.TEXTURE_2D_ARRAY?t.texImage3D(q,ie,Z,ce,se,_.depth,0,ae,$,null):t.texImage2D(q,ie,Z,ce,se,0,ae,$,null)}t.bindFramebuffer(i.FRAMEBUFFER,T),ht(_)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,V,q,we.__webglTexture,0,ct(_)):(q===i.TEXTURE_2D||q>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&q<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,V,q,we.__webglTexture,ie),t.bindFramebuffer(i.FRAMEBUFFER,null)}function Fe(T,_,z){if(i.bindRenderbuffer(i.RENDERBUFFER,T),_.depthBuffer){const V=_.depthTexture,q=V&&V.isDepthTexture?V.type:null,ie=x(_.stencilBuffer,q),ae=_.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;ht(_)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,ct(_),ie,_.width,_.height):z?i.renderbufferStorageMultisample(i.RENDERBUFFER,ct(_),ie,_.width,_.height):i.renderbufferStorage(i.RENDERBUFFER,ie,_.width,_.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,ae,i.RENDERBUFFER,T)}else{const V=_.textures;for(let q=0;q<V.length;q++){const ie=V[q],ae=r.convert(ie.format,ie.colorSpace),$=r.convert(ie.type),Z=w(ie.internalFormat,ae,$,ie.normalized,ie.colorSpace);ht(_)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,ct(_),Z,_.width,_.height):z?i.renderbufferStorageMultisample(i.RENDERBUFFER,ct(_),Z,_.width,_.height):i.renderbufferStorage(i.RENDERBUFFER,Z,_.width,_.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function mt(T,_,z){const V=_.isWebGLCubeRenderTarget===!0;if(t.bindFramebuffer(i.FRAMEBUFFER,T),!(_.depthTexture&&_.depthTexture.isDepthTexture))throw new Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");const q=n.get(_.depthTexture);if(q.__renderTarget=_,(!q.__webglTexture||_.depthTexture.image.width!==_.width||_.depthTexture.image.height!==_.height)&&(_.depthTexture.image.width=_.width,_.depthTexture.image.height=_.height,_.depthTexture.needsUpdate=!0),V){if(q.__webglInit===void 0&&(q.__webglInit=!0,_.depthTexture.addEventListener("dispose",E)),q.__webglTexture===void 0){q.__webglTexture=i.createTexture(),t.bindTexture(i.TEXTURE_CUBE_MAP,q.__webglTexture),Ve(i.TEXTURE_CUBE_MAP,_.depthTexture);const re=r.convert(_.depthTexture.format),we=r.convert(_.depthTexture.type);let ce;_.depthTexture.format===1026?ce=i.DEPTH_COMPONENT24:_.depthTexture.format===1027&&(ce=i.DEPTH24_STENCIL8);for(let se=0;se<6;se++)i.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+se,0,ce,_.width,_.height,0,re,we,null)}}else J(_.depthTexture,0);const ie=q.__webglTexture,ae=ct(_),$=V?i.TEXTURE_CUBE_MAP_POSITIVE_X+z:i.TEXTURE_2D,Z=_.depthTexture.format===1027?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;if(_.depthTexture.format===1026)ht(_)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,Z,$,ie,0,ae):i.framebufferTexture2D(i.FRAMEBUFFER,Z,$,ie,0);else if(_.depthTexture.format===1027)ht(_)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,Z,$,ie,0,ae):i.framebufferTexture2D(i.FRAMEBUFFER,Z,$,ie,0);else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.")}function Ne(T){const _=n.get(T),z=T.isWebGLCubeRenderTarget===!0;if(_.__boundDepthTexture!==T.depthTexture){const V=T.depthTexture;if(_.__depthDisposeCallback&&_.__depthDisposeCallback(),V){const q=()=>{delete _.__boundDepthTexture,delete _.__depthDisposeCallback,V.removeEventListener("dispose",q)};V.addEventListener("dispose",q),_.__depthDisposeCallback=q}_.__boundDepthTexture=V}if(T.depthTexture&&!_.__autoAllocateDepthBuffer)if(z)for(let V=0;V<6;V++)mt(_.__webglFramebuffer[V],T,V);else{const V=T.texture.mipmaps;V&&V.length>0?mt(_.__webglFramebuffer[0],T,0):mt(_.__webglFramebuffer,T,0)}else if(z){_.__webglDepthbuffer=[];for(let V=0;V<6;V++)if(t.bindFramebuffer(i.FRAMEBUFFER,_.__webglFramebuffer[V]),_.__webglDepthbuffer[V]===void 0)_.__webglDepthbuffer[V]=i.createRenderbuffer(),Fe(_.__webglDepthbuffer[V],T,!1);else{const q=T.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,ie=_.__webglDepthbuffer[V];i.bindRenderbuffer(i.RENDERBUFFER,ie),i.framebufferRenderbuffer(i.FRAMEBUFFER,q,i.RENDERBUFFER,ie)}}else{const V=T.texture.mipmaps;if(V&&V.length>0?t.bindFramebuffer(i.FRAMEBUFFER,_.__webglFramebuffer[0]):t.bindFramebuffer(i.FRAMEBUFFER,_.__webglFramebuffer),_.__webglDepthbuffer===void 0)_.__webglDepthbuffer=i.createRenderbuffer(),Fe(_.__webglDepthbuffer,T,!1);else{const q=T.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,ie=_.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,ie),i.framebufferRenderbuffer(i.FRAMEBUFFER,q,i.RENDERBUFFER,ie)}}t.bindFramebuffer(i.FRAMEBUFFER,null)}function We(T,_,z){const V=n.get(T);_!==void 0&&ve(V.__webglFramebuffer,T,T.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),z!==void 0&&Ne(T)}function at(T){const _=T.texture,z=n.get(T),V=n.get(_);T.addEventListener("dispose",y);const q=T.textures,ie=T.isWebGLCubeRenderTarget===!0,ae=q.length>1;if(ae||(V.__webglTexture===void 0&&(V.__webglTexture=i.createTexture()),V.__version=_.version,s.memory.textures++),ie){z.__webglFramebuffer=[];for(let $=0;$<6;$++)if(_.mipmaps&&_.mipmaps.length>0){z.__webglFramebuffer[$]=[];for(let Z=0;Z<_.mipmaps.length;Z++)z.__webglFramebuffer[$][Z]=i.createFramebuffer()}else z.__webglFramebuffer[$]=i.createFramebuffer()}else{if(_.mipmaps&&_.mipmaps.length>0){z.__webglFramebuffer=[];for(let $=0;$<_.mipmaps.length;$++)z.__webglFramebuffer[$]=i.createFramebuffer()}else z.__webglFramebuffer=i.createFramebuffer();if(ae)for(let $=0,Z=q.length;$<Z;$++){const re=n.get(q[$]);re.__webglTexture===void 0&&(re.__webglTexture=i.createTexture(),s.memory.textures++)}if(T.samples>0&&ht(T)===!1){z.__webglMultisampledFramebuffer=i.createFramebuffer(),z.__webglColorRenderbuffer=[],t.bindFramebuffer(i.FRAMEBUFFER,z.__webglMultisampledFramebuffer);for(let $=0;$<q.length;$++){const Z=q[$];z.__webglColorRenderbuffer[$]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,z.__webglColorRenderbuffer[$]);const re=r.convert(Z.format,Z.colorSpace),we=r.convert(Z.type),ce=w(Z.internalFormat,re,we,Z.normalized,Z.colorSpace,T.isXRRenderTarget===!0),se=ct(T);i.renderbufferStorageMultisample(i.RENDERBUFFER,se,ce,T.width,T.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+$,i.RENDERBUFFER,z.__webglColorRenderbuffer[$])}i.bindRenderbuffer(i.RENDERBUFFER,null),T.depthBuffer&&(z.__webglDepthRenderbuffer=i.createRenderbuffer(),Fe(z.__webglDepthRenderbuffer,T,!0)),t.bindFramebuffer(i.FRAMEBUFFER,null)}}if(ie){t.bindTexture(i.TEXTURE_CUBE_MAP,V.__webglTexture),Ve(i.TEXTURE_CUBE_MAP,_);for(let $=0;$<6;$++)if(_.mipmaps&&_.mipmaps.length>0)for(let Z=0;Z<_.mipmaps.length;Z++)ve(z.__webglFramebuffer[$][Z],T,_,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+$,Z);else ve(z.__webglFramebuffer[$],T,_,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+$,0);m(_)&&M(i.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(ae){for(let $=0,Z=q.length;$<Z;$++){const re=q[$],we=n.get(re);let ce=i.TEXTURE_2D;(T.isWebGL3DRenderTarget||T.isWebGLArrayRenderTarget)&&(ce=T.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),t.bindTexture(ce,we.__webglTexture),Ve(ce,re),ve(z.__webglFramebuffer,T,re,i.COLOR_ATTACHMENT0+$,ce,0),m(re)&&M(ce)}t.unbindTexture()}else{let $=i.TEXTURE_2D;if((T.isWebGL3DRenderTarget||T.isWebGLArrayRenderTarget)&&($=T.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),t.bindTexture($,V.__webglTexture),Ve($,_),_.mipmaps&&_.mipmaps.length>0)for(let Z=0;Z<_.mipmaps.length;Z++)ve(z.__webglFramebuffer[Z],T,_,i.COLOR_ATTACHMENT0,$,Z);else ve(z.__webglFramebuffer,T,_,i.COLOR_ATTACHMENT0,$,0);m(_)&&M($),t.unbindTexture()}T.depthBuffer&&Ne(T)}function Oe(T){const _=T.textures;for(let z=0,V=_.length;z<V;z++){const q=_[z];if(m(q)){const ie=A(T),ae=n.get(q).__webglTexture;t.bindTexture(ie,ae),M(ie),t.unbindTexture()}}}const lt=[],yt=[];function Ct(T){if(T.samples>0){if(ht(T)===!1){const _=T.textures,z=T.width,V=T.height;let q=i.COLOR_BUFFER_BIT;const ie=T.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,ae=n.get(T),$=_.length>1;if($)for(let re=0;re<_.length;re++)t.bindFramebuffer(i.FRAMEBUFFER,ae.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+re,i.RENDERBUFFER,null),t.bindFramebuffer(i.FRAMEBUFFER,ae.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+re,i.TEXTURE_2D,null,0);t.bindFramebuffer(i.READ_FRAMEBUFFER,ae.__webglMultisampledFramebuffer);const Z=T.texture.mipmaps;Z&&Z.length>0?t.bindFramebuffer(i.DRAW_FRAMEBUFFER,ae.__webglFramebuffer[0]):t.bindFramebuffer(i.DRAW_FRAMEBUFFER,ae.__webglFramebuffer);for(let re=0;re<_.length;re++){if(T.resolveDepthBuffer&&(T.depthBuffer&&(q|=i.DEPTH_BUFFER_BIT),T.stencilBuffer&&T.resolveStencilBuffer&&(q|=i.STENCIL_BUFFER_BIT)),$){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,ae.__webglColorRenderbuffer[re]);const we=n.get(_[re]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,we,0)}i.blitFramebuffer(0,0,z,V,0,0,z,V,q,i.NEAREST),c===!0&&(lt.length=0,yt.length=0,lt.push(i.COLOR_ATTACHMENT0+re),T.depthBuffer&&T.storeMultisampledDepthBuffer===!1&&(lt.push(ie),yt.push(ie),i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,yt)),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,lt))}if(t.bindFramebuffer(i.READ_FRAMEBUFFER,null),t.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),$)for(let re=0;re<_.length;re++){t.bindFramebuffer(i.FRAMEBUFFER,ae.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+re,i.RENDERBUFFER,ae.__webglColorRenderbuffer[re]);const we=n.get(_[re]).__webglTexture;t.bindFramebuffer(i.FRAMEBUFFER,ae.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+re,i.TEXTURE_2D,we,0)}t.bindFramebuffer(i.DRAW_FRAMEBUFFER,ae.__webglMultisampledFramebuffer)}else if(T.depthBuffer&&T.storeMultisampledDepthBuffer===!1&&c){const _=T.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[_])}}}function ct(T){return Math.min(a.maxSamples,T.samples)}function ht(T){const _=n.get(T);return T.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&_.__useRenderToTexture!==!1}function N(T){const _=s.render.frame;h.get(T)!==_&&(h.set(T,_),T.update())}function bt(T,_){const z=T.colorSpace,V=T.format,q=T.type;return T.isCompressedTexture===!0||T.isVideoTexture===!0||z!==xi&&z!==""&&(ke.getTransfer(z)===Je?(V!==1023||q!==1009)&&Ce("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):Xe("WebGLTextures: Unsupported texture color space:",z)),_}function Ze(T){return typeof HTMLImageElement<"u"&&T instanceof HTMLImageElement?(l.width=T.naturalWidth||T.width,l.height=T.naturalHeight||T.height):typeof VideoFrame<"u"&&T instanceof VideoFrame?(l.width=T.displayWidth,l.height=T.displayHeight):(l.width=T.width,l.height=T.height),l}this.allocateTextureUnit=X,this.resetTextureUnits=L,this.getTextureUnits=C,this.setTextureUnits=B,this.setTexture2D=J,this.setTexture2DArray=j,this.setTexture3D=Q,this.setTextureCube=ne,this.rebindTextures=We,this.setupRenderTarget=at,this.updateRenderTargetMipmap=Oe,this.updateMultisampleRenderTarget=Ct,this.setupDepthRenderbuffer=Ne,this.setupFrameBufferTexture=ve,this.useMultisampledRTT=ht,this.isReversedDepthBuffer=function(){return t.buffers.depth.getReversed()}}function jh(i,e){function t(n,a=""){let r;const s=ke.getTransfer(a);if(n===1009)return i.UNSIGNED_BYTE;if(n===1017)return i.UNSIGNED_SHORT_4_4_4_4;if(n===1018)return i.UNSIGNED_SHORT_5_5_5_1;if(n===35902)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===35899)return i.UNSIGNED_INT_10F_11F_11F_REV;if(n===1010)return i.BYTE;if(n===1011)return i.SHORT;if(n===1012)return i.UNSIGNED_SHORT;if(n===1013)return i.INT;if(n===1014)return i.UNSIGNED_INT;if(n===1015)return i.FLOAT;if(n===1016)return i.HALF_FLOAT;if(n===1021)return i.ALPHA;if(n===1022)return i.RGB;if(n===1023)return i.RGBA;if(n===1026)return i.DEPTH_COMPONENT;if(n===1027)return i.DEPTH_STENCIL;if(n===1028)return i.RED;if(n===1029)return i.RED_INTEGER;if(n===1030)return i.RG;if(n===1031)return i.RG_INTEGER;if(n===1033)return i.RGBA_INTEGER;if(n===33776||n===33777||n===33778||n===33779)if(s===Je)if(r=e.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(n===33776)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===33777)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===33778)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===33779)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=e.get("WEBGL_compressed_texture_s3tc"),r!==null){if(n===33776)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===33777)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===33778)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===33779)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===35840||n===35841||n===35842||n===35843)if(r=e.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(n===35840)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===35841)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===35842)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===35843)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===36196||n===37492||n===37496||n===37488||n===37489||n===37490||n===37491)if(r=e.get("WEBGL_compressed_texture_etc"),r!==null){if(n===36196||n===37492)return s===Je?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(n===37496)return s===Je?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC;if(n===37488)return r.COMPRESSED_R11_EAC;if(n===37489)return r.COMPRESSED_SIGNED_R11_EAC;if(n===37490)return r.COMPRESSED_RG11_EAC;if(n===37491)return r.COMPRESSED_SIGNED_RG11_EAC}else return null;if(n===37808||n===37809||n===37810||n===37811||n===37812||n===37813||n===37814||n===37815||n===37816||n===37817||n===37818||n===37819||n===37820||n===37821)if(r=e.get("WEBGL_compressed_texture_astc"),r!==null){if(n===37808)return s===Je?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===37809)return s===Je?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===37810)return s===Je?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===37811)return s===Je?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===37812)return s===Je?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===37813)return s===Je?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===37814)return s===Je?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===37815)return s===Je?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===37816)return s===Je?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===37817)return s===Je?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===37818)return s===Je?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===37819)return s===Je?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===37820)return s===Je?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===37821)return s===Je?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===36492||n===36494||n===36495)if(r=e.get("EXT_texture_compression_bptc"),r!==null){if(n===36492)return s===Je?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===36494)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===36495)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===36283||n===36284||n===36285||n===36286)if(r=e.get("EXT_texture_compression_rgtc"),r!==null){if(n===36283)return r.COMPRESSED_RED_RGTC1_EXT;if(n===36284)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===36285)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===36286)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===1020?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return{convert:t}}const qh=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,Yh=`
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

}`;class $h{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){const n=new Is(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=n}}getMesh(e){if(this.texture!==null&&this.mesh===null){const t=e.cameras[0].viewport,n=new tn({vertexShader:qh,fragmentShader:Yh,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new Ft(new Ei(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class Kh extends Dn{constructor(e,t){super();const n=this;let a=null,r=1,s=null,o="local-floor",c=1,l=null,h=null,d=null,u=null,f=null,v=null;const g=typeof XRWebGLBinding<"u",p=new $h,m={},M=t.getContextAttributes();let A=null,w=null;const x=[],S=[],E=new Ge;let y=null,R=null;const D=new Ht;D.viewport=new nt;const P=new Ht;P.viewport=new nt;const U=[D,P],L=new al;let C=null,B=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(Y){let ee=x[Y];return ee===void 0&&(ee=new xa,x[Y]=ee),ee.getTargetRaySpace()},this.getControllerGrip=function(Y){let ee=x[Y];return ee===void 0&&(ee=new xa,x[Y]=ee),ee.getGripSpace()},this.getHand=function(Y){let ee=x[Y];return ee===void 0&&(ee=new xa,x[Y]=ee),ee.getHandSpace()};function X(Y){const ee=S.indexOf(Y.inputSource);if(ee===-1)return;const _e=x[ee];_e!==void 0&&(_e.update(Y.inputSource,Y.frame,l||s),_e.dispatchEvent({type:Y.type,data:Y.inputSource}))}function H(){a.removeEventListener("select",X),a.removeEventListener("selectstart",X),a.removeEventListener("selectend",X),a.removeEventListener("squeeze",X),a.removeEventListener("squeezestart",X),a.removeEventListener("squeezeend",X),a.removeEventListener("end",H),a.removeEventListener("inputsourceschange",J);for(let Y=0;Y<x.length;Y++){const ee=S[Y];ee!==null&&(S[Y]=null,x[Y].disconnect(ee))}C=null,B=null,p.reset();for(const Y in m)delete m[Y];if(e.setRenderTarget(A),f=null,u=null,d=null,a=null,w=null,je.stop(),n.isPresenting=!1,e.setPixelRatio(y),e.setSize(E.width,E.height,!1),R!==null){const Y=R.camera;Y.fov=R.fov,Y.zoom=R.zoom,Y.updateProjectionMatrix(),R=null}n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(Y){r=Y,n.isPresenting===!0&&Ce("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(Y){o=Y,n.isPresenting===!0&&Ce("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return l||s},this.setReferenceSpace=function(Y){l=Y},this.getBaseLayer=function(){return u!==null?u:f},this.getBinding=function(){return d===null&&g&&(d=new XRWebGLBinding(a,t)),d},this.getFrame=function(){return v},this.getSession=function(){return a},this.setSession=async function(Y){if(a=Y,a!==null){if(A=e.getRenderTarget(),a.addEventListener("select",X),a.addEventListener("selectstart",X),a.addEventListener("selectend",X),a.addEventListener("squeeze",X),a.addEventListener("squeezestart",X),a.addEventListener("squeezeend",X),a.addEventListener("end",H),a.addEventListener("inputsourceschange",J),M.xrCompatible!==!0&&await t.makeXRCompatible(),y=e.getPixelRatio(),e.getSize(E),g&&"createProjectionLayer"in XRWebGLBinding.prototype){let _e=null,Le=null,ve=null;M.depth&&(ve=M.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,_e=M.stencil?1027:1026,Le=M.stencil?1020:1014);const Fe={colorFormat:t.RGBA8,depthFormat:ve,scaleFactor:r};d=this.getBinding(),u=d.createProjectionLayer(Fe),a.updateRenderState({layers:[u]}),e.setPixelRatio(1),e.setSize(u.textureWidth,u.textureHeight,!1),w=new Lt(u.textureWidth,u.textureHeight,{format:1023,type:1009,depthTexture:new Ln(u.textureWidth,u.textureHeight,Le,void 0,void 0,void 0,void 0,void 0,void 0,_e),stencilBuffer:M.stencil,colorSpace:e.outputColorSpace,samples:M.antialias?4:0,resolveDepthBuffer:u.ignoreDepthValues===!1,resolveStencilBuffer:u.ignoreDepthValues===!1,storeMultisampledDepthBuffer:u.ignoreDepthValues===!1,storeMultisampledStencilBuffer:u.ignoreDepthValues===!1})}else{const _e={antialias:M.antialias,alpha:!0,depth:M.depth,stencil:M.stencil,framebufferScaleFactor:r};f=new XRWebGLLayer(a,t,_e),a.updateRenderState({baseLayer:f}),e.setPixelRatio(1),e.setSize(f.framebufferWidth,f.framebufferHeight,!1),w=new Lt(f.framebufferWidth,f.framebufferHeight,{format:1023,type:1009,colorSpace:e.outputColorSpace,stencilBuffer:M.stencil,resolveDepthBuffer:f.ignoreDepthValues===!1,resolveStencilBuffer:f.ignoreDepthValues===!1,storeMultisampledDepthBuffer:f.ignoreDepthValues===!1,storeMultisampledStencilBuffer:f.ignoreDepthValues===!1})}w.isXRRenderTarget=!0,this.setFoveation(c),l=null,s=await a.requestReferenceSpace(o),je.setContext(a),je.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(a!==null)return a.environmentBlendMode},this.getDepthTexture=function(){return p.getDepthTexture()};function J(Y){for(let ee=0;ee<Y.removed.length;ee++){const _e=Y.removed[ee],Le=S.indexOf(_e);Le>=0&&(S[Le]=null,x[Le].disconnect(_e))}for(let ee=0;ee<Y.added.length;ee++){const _e=Y.added[ee];let Le=S.indexOf(_e);if(Le===-1){for(let Fe=0;Fe<x.length;Fe++)if(Fe>=S.length){S.push(_e),Le=Fe;break}else if(S[Fe]===null){S[Fe]=_e,Le=Fe;break}if(Le===-1)break}const ve=x[Le];ve&&ve.connect(_e)}}const j=new O,Q=new O;function ne(Y,ee,_e){j.setFromMatrixPosition(ee.matrixWorld),Q.setFromMatrixPosition(_e.matrixWorld);const Le=j.distanceTo(Q),ve=ee.projectionMatrix.elements,Fe=_e.projectionMatrix.elements,mt=ve[14]/(ve[10]-1),Ne=ve[14]/(ve[10]+1),We=(ve[9]+1)/ve[5],at=(ve[9]-1)/ve[5],Oe=(ve[8]-1)/ve[0],lt=(Fe[8]+1)/Fe[0],yt=mt*Oe,Ct=mt*lt,ct=Le/(-Oe+lt),ht=ct*-Oe;if(ee.matrixWorld.decompose(Y.position,Y.quaternion,Y.scale),Y.translateX(ht),Y.translateZ(ct),Y.matrixWorld.compose(Y.position,Y.quaternion,Y.scale),Y.matrixWorldInverse.copy(Y.matrixWorld).invert(),ve[10]===-1)Y.projectionMatrix.copy(ee.projectionMatrix),Y.projectionMatrixInverse.copy(ee.projectionMatrixInverse);else{const N=mt+ct,bt=Ne+ct,Ze=yt-ht,T=Ct+(Le-ht),_=We*Ne/bt*N,z=at*Ne/bt*N;Y.projectionMatrix.makePerspective(Ze,T,_,z,N,bt),Y.projectionMatrixInverse.copy(Y.projectionMatrix).invert()}}function Te(Y,ee){ee===null?Y.matrixWorld.copy(Y.matrix):Y.matrixWorld.multiplyMatrices(ee.matrixWorld,Y.matrix),Y.matrixWorldInverse.copy(Y.matrixWorld).invert()}this.updateCamera=function(Y){if(a===null)return;let ee=Y.near,_e=Y.far;p.texture!==null&&(p.depthNear>0&&(ee=p.depthNear),p.depthFar>0&&(_e=p.depthFar)),L.near=P.near=D.near=ee,L.far=P.far=D.far=_e,(C!==L.near||B!==L.far)&&(a.updateRenderState({depthNear:L.near,depthFar:L.far}),C=L.near,B=L.far),L.layers.mask=Y.layers.mask|6,D.layers.mask=L.layers.mask&-5,P.layers.mask=L.layers.mask&-3;const Le=Y.parent,ve=L.cameras;Te(L,Le);for(let Fe=0;Fe<ve.length;Fe++)Te(ve[Fe],Le);ve.length===2?ne(L,D,P):L.projectionMatrix.copy(D.projectionMatrix),R===null&&Y.isPerspectiveCamera&&(R={camera:Y,fov:Y.fov,zoom:Y.zoom}),Ee(Y,L,Le)};function Ee(Y,ee,_e){_e===null?Y.matrix.copy(ee.matrixWorld):(Y.matrix.copy(_e.matrixWorld),Y.matrix.invert(),Y.matrix.multiply(ee.matrixWorld)),Y.matrix.decompose(Y.position,Y.quaternion,Y.scale),Y.updateMatrixWorld(!0),Y.projectionMatrix.copy(ee.projectionMatrix),Y.projectionMatrixInverse.copy(ee.projectionMatrixInverse),Y.isPerspectiveCamera&&(Y.fov=bi*2*Math.atan(1/Y.projectionMatrix.elements[5]),Y.zoom=1)}this.getCamera=function(){return L},this.getFoveation=function(){if(!(u===null&&f===null))return c},this.setFoveation=function(Y){c=Y,u!==null&&(u.fixedFoveation=Y),f!==null&&f.fixedFoveation!==void 0&&(f.fixedFoveation=Y)},this.hasDepthSensing=function(){return p.texture!==null},this.getDepthSensingMesh=function(){return p.getMesh(L)},this.getCameraTexture=function(Y){return m[Y]};let it=null;function Ve(Y,ee){if(h=ee.getViewerPose(l||s),v=ee,h!==null){const _e=h.views;f!==null&&(e.setRenderTargetFramebuffer(w,f.framebuffer),e.setRenderTarget(w));let Le=!1;_e.length!==L.cameras.length&&(L.cameras.length=0,Le=!0);for(let Ne=0;Ne<_e.length;Ne++){const We=_e[Ne];let at=null;if(f!==null)at=f.getViewport(We);else{const lt=d.getViewSubImage(u,We);at=lt.viewport,Ne===0&&(e.setRenderTargetTextures(w,lt.colorTexture,lt.depthStencilTexture),e.setRenderTarget(w))}let Oe=U[Ne];Oe===void 0&&(Oe=new Ht,Oe.layers.enable(Ne),Oe.viewport=new nt,U[Ne]=Oe),Oe.matrix.fromArray(We.transform.matrix),Oe.matrix.decompose(Oe.position,Oe.quaternion,Oe.scale),Oe.projectionMatrix.fromArray(We.projectionMatrix),Oe.projectionMatrixInverse.copy(Oe.projectionMatrix).invert(),Oe.viewport.set(at.x,at.y,at.width,at.height),Ne===0&&(L.matrix.copy(Oe.matrix),L.matrix.decompose(L.position,L.quaternion,L.scale)),Le===!0&&L.cameras.push(Oe)}const ve=a.enabledFeatures;if(ve&&ve.includes("depth-sensing")&&a.depthUsage=="gpu-optimized"&&g){d=n.getBinding();const Ne=d.getDepthInformation(_e[0]);Ne&&Ne.isValid&&Ne.texture&&p.init(Ne,a.renderState)}if(ve&&ve.includes("camera-access")&&g){e.state.unbindTexture(),d=n.getBinding();for(let Ne=0;Ne<_e.length;Ne++){const We=_e[Ne].camera;if(We){let at=m[We];at||(at=new Is,m[We]=at);const Oe=d.getCameraImage(We);at.sourceTexture=Oe}}}}for(let _e=0;_e<x.length;_e++){const Le=S[_e],ve=x[_e];Le!==null&&ve!==void 0&&ve.update(Le,ee,l||s)}it&&it(Y,ee),ee.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:ee}),v=null}const je=new Bs;je.setAnimationLoop(Ve),this.setAnimationLoop=function(Y){it=Y},this.dispose=function(){}}}const Zh=new pe,Ws=new Pe;Ws.set(-1,0,0,0,1,0,0,0,1);function Jh(i,e){function t(p,m){p.matrixAutoUpdate===!0&&p.updateMatrix(),m.value.copy(p.matrix)}function n(p,m){m.color.getRGB(p.fogColor.value,Fs(i)),m.isFog?(p.fogNear.value=m.near,p.fogFar.value=m.far):m.isFogExp2&&(p.fogDensity.value=m.density)}function a(p,m,M,A,w){m.isNodeMaterial?m.uniformsNeedUpdate=!1:m.isMeshBasicMaterial?r(p,m):m.isMeshLambertMaterial?(r(p,m),m.envMap&&(p.envMapIntensity.value=m.envMapIntensity)):m.isMeshToonMaterial?(r(p,m),d(p,m)):m.isMeshPhongMaterial?(r(p,m),h(p,m),m.envMap&&(p.envMapIntensity.value=m.envMapIntensity)):m.isMeshStandardMaterial?(r(p,m),u(p,m),m.isMeshPhysicalMaterial&&f(p,m,w)):m.isMeshMatcapMaterial?(r(p,m),v(p,m)):m.isMeshDepthMaterial?r(p,m):m.isMeshDistanceMaterial?(r(p,m),g(p,m)):m.isMeshNormalMaterial?r(p,m):m.isLineBasicMaterial?(s(p,m),m.isLineDashedMaterial&&o(p,m)):m.isPointsMaterial?c(p,m,M,A):m.isSpriteMaterial?l(p,m):m.isShadowMaterial?(p.color.value.copy(m.color),p.opacity.value=m.opacity):m.isShaderMaterial&&(m.uniformsNeedUpdate=!1)}function r(p,m){p.opacity.value=m.opacity,m.color&&p.diffuse.value.copy(m.color),m.emissive&&p.emissive.value.copy(m.emissive).multiplyScalar(m.emissiveIntensity),m.map&&(p.map.value=m.map,t(m.map,p.mapTransform)),m.alphaMap&&(p.alphaMap.value=m.alphaMap,t(m.alphaMap,p.alphaMapTransform)),m.bumpMap&&(p.bumpMap.value=m.bumpMap,t(m.bumpMap,p.bumpMapTransform),p.bumpScale.value=m.bumpScale,m.side===1&&(p.bumpScale.value*=-1)),m.normalMap&&(p.normalMap.value=m.normalMap,t(m.normalMap,p.normalMapTransform),p.normalScale.value.copy(m.normalScale),m.side===1&&p.normalScale.value.negate()),m.displacementMap&&(p.displacementMap.value=m.displacementMap,t(m.displacementMap,p.displacementMapTransform),p.displacementScale.value=m.displacementScale,p.displacementBias.value=m.displacementBias),m.emissiveMap&&(p.emissiveMap.value=m.emissiveMap,t(m.emissiveMap,p.emissiveMapTransform)),m.specularMap&&(p.specularMap.value=m.specularMap,t(m.specularMap,p.specularMapTransform)),m.alphaTest>0&&(p.alphaTest.value=m.alphaTest);const M=e.get(m),A=M.envMap,w=M.envMapRotation;A&&(p.envMap.value=A,p.envMapRotation.value.setFromMatrix4(Zh.makeRotationFromEuler(w)).transpose(),A.isCubeTexture&&A.isRenderTargetTexture===!1&&p.envMapRotation.value.premultiply(Ws),p.reflectivity.value=m.reflectivity,p.ior.value=m.ior,p.refractionRatio.value=m.refractionRatio),m.lightMap&&(p.lightMap.value=m.lightMap,p.lightMapIntensity.value=m.lightMapIntensity,t(m.lightMap,p.lightMapTransform)),m.aoMap&&(p.aoMap.value=m.aoMap,p.aoMapIntensity.value=m.aoMapIntensity,t(m.aoMap,p.aoMapTransform))}function s(p,m){p.diffuse.value.copy(m.color),p.opacity.value=m.opacity,m.map&&(p.map.value=m.map,t(m.map,p.mapTransform))}function o(p,m){p.dashSize.value=m.dashSize,p.totalSize.value=m.dashSize+m.gapSize,p.scale.value=m.scale}function c(p,m,M,A){p.diffuse.value.copy(m.color),p.opacity.value=m.opacity,p.size.value=m.size*M,p.scale.value=A*.5,m.map&&(p.map.value=m.map,t(m.map,p.uvTransform)),m.alphaMap&&(p.alphaMap.value=m.alphaMap,t(m.alphaMap,p.alphaMapTransform)),m.alphaTest>0&&(p.alphaTest.value=m.alphaTest)}function l(p,m){p.diffuse.value.copy(m.color),p.opacity.value=m.opacity,p.rotation.value=m.rotation,m.map&&(p.map.value=m.map,t(m.map,p.mapTransform)),m.alphaMap&&(p.alphaMap.value=m.alphaMap,t(m.alphaMap,p.alphaMapTransform)),m.alphaTest>0&&(p.alphaTest.value=m.alphaTest)}function h(p,m){p.specular.value.copy(m.specular),p.shininess.value=Math.max(m.shininess,1e-4)}function d(p,m){m.gradientMap&&(p.gradientMap.value=m.gradientMap)}function u(p,m){p.metalness.value=m.metalness,m.metalnessMap&&(p.metalnessMap.value=m.metalnessMap,t(m.metalnessMap,p.metalnessMapTransform)),p.roughness.value=m.roughness,m.roughnessMap&&(p.roughnessMap.value=m.roughnessMap,t(m.roughnessMap,p.roughnessMapTransform)),m.envMap&&(p.envMapIntensity.value=m.envMapIntensity)}function f(p,m,M){p.ior.value=m.ior,m.sheen>0&&(p.sheenColor.value.copy(m.sheenColor).multiplyScalar(m.sheen),p.sheenRoughness.value=m.sheenRoughness,m.sheenColorMap&&(p.sheenColorMap.value=m.sheenColorMap,t(m.sheenColorMap,p.sheenColorMapTransform)),m.sheenRoughnessMap&&(p.sheenRoughnessMap.value=m.sheenRoughnessMap,t(m.sheenRoughnessMap,p.sheenRoughnessMapTransform))),m.clearcoat>0&&(p.clearcoat.value=m.clearcoat,p.clearcoatRoughness.value=m.clearcoatRoughness,m.clearcoatMap&&(p.clearcoatMap.value=m.clearcoatMap,t(m.clearcoatMap,p.clearcoatMapTransform)),m.clearcoatRoughnessMap&&(p.clearcoatRoughnessMap.value=m.clearcoatRoughnessMap,t(m.clearcoatRoughnessMap,p.clearcoatRoughnessMapTransform)),m.clearcoatNormalMap&&(p.clearcoatNormalMap.value=m.clearcoatNormalMap,t(m.clearcoatNormalMap,p.clearcoatNormalMapTransform),p.clearcoatNormalScale.value.copy(m.clearcoatNormalScale),m.side===1&&p.clearcoatNormalScale.value.negate())),m.dispersion>0&&(p.dispersion.value=m.dispersion),m.retroreflectivity>0&&(p.retroreflectivity.value=m.retroreflectivity),m.iridescence>0&&(p.iridescence.value=m.iridescence,p.iridescenceIOR.value=m.iridescenceIOR,p.iridescenceThicknessMinimum.value=m.iridescenceThicknessRange[0],p.iridescenceThicknessMaximum.value=m.iridescenceThicknessRange[1],m.iridescenceMap&&(p.iridescenceMap.value=m.iridescenceMap,t(m.iridescenceMap,p.iridescenceMapTransform)),m.iridescenceThicknessMap&&(p.iridescenceThicknessMap.value=m.iridescenceThicknessMap,t(m.iridescenceThicknessMap,p.iridescenceThicknessMapTransform))),m.transmission>0&&(p.transmission.value=m.transmission,p.transmissionSamplerMap.value=M.texture,p.transmissionSamplerSize.value.set(M.width,M.height),m.transmissionMap&&(p.transmissionMap.value=m.transmissionMap,t(m.transmissionMap,p.transmissionMapTransform)),p.thickness.value=m.thickness,m.thicknessMap&&(p.thicknessMap.value=m.thicknessMap,t(m.thicknessMap,p.thicknessMapTransform)),p.attenuationDistance.value=m.attenuationDistance,p.attenuationColor.value.copy(m.attenuationColor)),m.anisotropy>0&&(p.anisotropyVector.value.set(m.anisotropy*Math.cos(m.anisotropyRotation),m.anisotropy*Math.sin(m.anisotropyRotation)),m.anisotropyMap&&(p.anisotropyMap.value=m.anisotropyMap,t(m.anisotropyMap,p.anisotropyMapTransform))),p.specularIntensity.value=m.specularIntensity,p.specularColor.value.copy(m.specularColor),m.specularColorMap&&(p.specularColorMap.value=m.specularColorMap,t(m.specularColorMap,p.specularColorMapTransform)),m.specularIntensityMap&&(p.specularIntensityMap.value=m.specularIntensityMap,t(m.specularIntensityMap,p.specularIntensityMapTransform))}function v(p,m){m.matcap&&(p.matcap.value=m.matcap)}function g(p,m){const M=e.get(m).light;p.referencePosition.value.setFromMatrixPosition(M.matrixWorld),p.nearDistance.value=M.shadow.camera.near,p.farDistance.value=M.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:a}}function Qh(i,e,t,n){let a={},r={},s=[];const o=i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS);function c(w,x){const S=x.program;n.uniformBlockBinding(w,S)}function l(w,x){let S=a[w.id];S===void 0&&(p(w),S=h(w),a[w.id]=S,w.addEventListener("dispose",M));const E=x.program;n.updateUBOMapping(w,E);const y=e.render.frame;r[w.id]!==y&&(u(w),r[w.id]=y)}function h(w){const x=d();w.__bindingPointIndex=x;const S=i.createBuffer(),E=w.__size,y=w.usage;return i.bindBuffer(i.UNIFORM_BUFFER,S),i.bufferData(i.UNIFORM_BUFFER,E,y),i.bindBuffer(i.UNIFORM_BUFFER,null),i.bindBufferBase(i.UNIFORM_BUFFER,x,S),S}function d(){for(let w=0;w<o;w++)if(s.indexOf(w)===-1)return s.push(w),w;return Xe("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function u(w){const x=a[w.id],S=w.uniforms,E=w.__cache;i.bindBuffer(i.UNIFORM_BUFFER,x);for(let y=0,R=S.length;y<R;y++){const D=S[y];if(Array.isArray(D))for(let P=0,U=D.length;P<U;P++)f(D[P],y,P,E);else f(D,y,0,E)}i.bindBuffer(i.UNIFORM_BUFFER,null)}function f(w,x,S,E){if(g(w,x,S,E)===!0){const y=w.__offset,R=w.value;if(Array.isArray(R)){let D=0;for(let P=0;P<R.length;P++){const U=R[P],L=m(U);v(U,w.__data,D),typeof U!="number"&&typeof U!="boolean"&&!U.isMatrix3&&!ArrayBuffer.isView(U)&&(D+=L.storage/Float32Array.BYTES_PER_ELEMENT)}}else v(R,w.__data,0);i.bufferSubData(i.UNIFORM_BUFFER,y,w.__data)}}function v(w,x,S){typeof w=="number"||typeof w=="boolean"?x[0]=w:w.isMatrix3?(x[0]=w.elements[0],x[1]=w.elements[1],x[2]=w.elements[2],x[3]=0,x[4]=w.elements[3],x[5]=w.elements[4],x[6]=w.elements[5],x[7]=0,x[8]=w.elements[6],x[9]=w.elements[7],x[10]=w.elements[8],x[11]=0):ArrayBuffer.isView(w)?x.set(new w.constructor(w.buffer,w.byteOffset,x.length)):w.toArray(x,S)}function g(w,x,S,E){const y=w.value,R=x+"_"+S;if(E[R]===void 0)return typeof y=="number"||typeof y=="boolean"?E[R]=y:ArrayBuffer.isView(y)?E[R]=y.slice():E[R]=y.clone(),!0;{const D=E[R];if(typeof y=="number"||typeof y=="boolean"){if(D!==y)return E[R]=y,!0}else{if(ArrayBuffer.isView(y))return!0;if(D.equals(y)===!1)return D.copy(y),!0}}return!1}function p(w){const x=w.uniforms;let S=0;const E=16;for(let R=0,D=x.length;R<D;R++){const P=Array.isArray(x[R])?x[R]:[x[R]];for(let U=0,L=P.length;U<L;U++){const C=P[U],B=Array.isArray(C.value)?C.value:[C.value];for(let X=0,H=B.length;X<H;X++){const J=B[X],j=m(J),Q=S%E,ne=Q%j.boundary,Te=Q+ne;S+=ne,Te!==0&&E-Te<j.storage&&(S+=E-Te),C.__data=new Float32Array(j.storage/Float32Array.BYTES_PER_ELEMENT),C.__offset=S,S+=j.storage}}}const y=S%E;return y>0&&(S+=E-y),w.__size=S,w.__cache={},this}function m(w){const x={boundary:0,storage:0};return typeof w=="number"||typeof w=="boolean"?(x.boundary=4,x.storage=4):w.isVector2?(x.boundary=8,x.storage=8):w.isVector3||w.isColor?(x.boundary=16,x.storage=12):w.isVector4?(x.boundary=16,x.storage=16):w.isMatrix3?(x.boundary=48,x.storage=48):w.isMatrix4?(x.boundary=64,x.storage=64):w.isTexture?Ce("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(w)?(x.boundary=16,x.storage=w.byteLength):Ce("WebGLRenderer: Unsupported uniform value type.",w),x}function M(w){const x=w.target;x.removeEventListener("dispose",M);const S=s.indexOf(x.__bindingPointIndex);s.splice(S,1),i.deleteBuffer(a[x.id]),delete a[x.id],delete r[x.id]}function A(){for(const w in a)i.deleteBuffer(a[w]);s=[],a={},r={}}return{bind:c,update:l,dispose:A}}const ed=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]);let Jt=null;function td(){return Jt===null&&(Jt=new Qn(ed,16,16,1030,1016),Jt.name="DFG_LUT",Jt.minFilter=1006,Jt.magFilter=1006,Jt.wrapS=1001,Jt.wrapT=1001,Jt.generateMipmaps=!1,Jt.needsUpdate=!0),Jt}class nd{constructor(e={}){const{canvas:t=ao(),context:n=null,depth:a=!0,stencil:r=!1,alpha:s=!1,antialias:o=!1,premultipliedAlpha:c=!0,preserveDrawingBuffer:l=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:d=!1,reversedDepthBuffer:u=!1,outputBufferType:f=1009}=e;this.isWebGLRenderer=!0;let v;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");v=n.getContextAttributes().alpha}else v=s;const g=f,p=new Set([1033,1031,1029]),m=new Set([1009,1014,1012,1020,1017,1018]),M=new Uint32Array(4),A=new Int32Array(4),w=new O;let x=null,S=null;const E=[],y=[];let R=null;this.domElement=t,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=0,this.toneMappingExposure=1,this.transmissionResolutionScale=1;const D=this;let P=!1,U=null,L=null,C=null,B=null;this._outputColorSpace=Ot;let X=0,H=0,J=null,j=-1,Q=null;const ne=new nt,Te=new nt;let Ee=null;const it=new qe(0);let Ve=0,je=t.width,Y=t.height,ee=1,_e=null,Le=null;const ve=new nt(0,0,je,Y),Fe=new nt(0,0,je,Y);let mt=!1;const Ne=new Ds;let We=!1,at=!1;const Oe=new pe,lt=new O,yt=new nt,Ct={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let ct=!1;function ht(){return J===null?ee:1}let N=n;function bt(b,I){return t.getContext(b,I)}let Ze,T,_,z,V,q,ie,ae,$,Z,re,we,ce,se,Me,Ae,De,F,oe,K,le,fe,te;try{const b={alpha:!0,depth:a,stencil:r,antialias:o,premultipliedAlpha:c,preserveDrawingBuffer:l,powerPreference:h,failIfMajorPerformanceCaveat:d};if("setAttribute"in t&&t.setAttribute("data-engine","three.js r186"),t.addEventListener("webglcontextlost",rt,!1),t.addEventListener("webglcontextrestored",Ye,!1),t.addEventListener("webglcontextcreationerror",zt,!1),N===null){const I="webgl2";if(N=bt(I,b),N===null)throw bt(I)?new Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes."):new Error("THREE.WebGLRenderer: Error creating WebGL context.")}Re()}catch(b){throw t.removeEventListener("webglcontextlost",rt,!1),t.removeEventListener("webglcontextrestored",Ye,!1),t.removeEventListener("webglcontextcreationerror",zt,!1),Xe("WebGLRenderer: "+b.message),b}function Re(){Ze=new tu(N),Ze.init(),le=new jh(N,Ze),T=new X0(N,Ze,e,le),_=new Wh(N,Ze),T.reversedDepthBuffer&&u&&_.buffers.depth.setReversed(!0),L=N.createFramebuffer(),C=N.createFramebuffer(),B=N.createFramebuffer(),z=new au(N),V=new Lh,q=new Xh(N,Ze,_,V,T,le,z),ie=new eu(D),ae=new sl(N),fe=new H0(N,ae),$=new nu(N,ae,z,fe),Z=new su(N,$,ae,fe,z),F=new ru(N,T,q),Me=new j0(V),re=new Ch(D,ie,Ze,T,fe,Me),we=new Jh(D,V),ce=new Dh,se=new Oh(Ze),De=new V0(D,ie,_,Z,v,c),Ae=new Hh(D,Z,T),te=new Qh(N,z,T,_),oe=new W0(N,Ze,z),K=new iu(N,Ze,z),z.programs=re.programs,D.capabilities=T,D.extensions=Ze,D.properties=V,D.renderLists=ce,D.shadowMap=Ae,D.state=_,D.info=z}g!==1009&&(R=new lu(g,t.width,t.height,o,a,r));const be=new Kh(D,N);this.xr=be,this.getContext=function(){return N},this.getContextAttributes=function(){return N.getContextAttributes()},this.forceContextLoss=function(){const b=Ze.get("WEBGL_lose_context");b&&b.loseContext()},this.forceContextRestore=function(){const b=Ze.get("WEBGL_lose_context");b&&b.restoreContext()},this.getPixelRatio=function(){return ee},this.setPixelRatio=function(b){b!==void 0&&(ee=b,this.setSize(je,Y,!1))},this.getSize=function(b){return b.set(je,Y)},this.setSize=function(b,I,W=!0){if(be.isPresenting){Ce("WebGLRenderer: Can't change size while VR device is presenting.");return}je=b,Y=I,t.width=Math.floor(b*ee),t.height=Math.floor(I*ee),W===!0&&(t.style.width=b+"px",t.style.height=I+"px"),R!==null&&R.setSize(t.width,t.height),this.setViewport(0,0,b,I)},this.getDrawingBufferSize=function(b){return b.set(je*ee,Y*ee).floor()},this.setDrawingBufferSize=function(b,I,W){je=b,Y=I,ee=W,t.width=Math.floor(b*W),t.height=Math.floor(I*W),this.setViewport(0,0,b,I)},this.setEffects=function(b){if(g===1009){Xe("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(b){for(let I=0;I<b.length;I++)if(b[I].isOutputPass===!0){Ce("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}R.setEffects(b||[])},this.getCurrentViewport=function(b){return b.copy(ne)},this.getViewport=function(b){return b.copy(ve)},this.setViewport=function(b,I,W,k){b.isVector4?ve.set(b.x,b.y,b.z,b.w):ve.set(b,I,W,k),_.viewport(ne.copy(ve).multiplyScalar(ee).round())},this.getScissor=function(b){return b.copy(Fe)},this.setScissor=function(b,I,W,k){b.isVector4?Fe.set(b.x,b.y,b.z,b.w):Fe.set(b,I,W,k),_.scissor(Te.copy(Fe).multiplyScalar(ee).round())},this.getScissorTest=function(){return mt},this.setScissorTest=function(b){_.setScissorTest(mt=b)},this.setOpaqueSort=function(b){_e=b},this.setTransparentSort=function(b){Le=b},this.getClearColor=function(b){return b.copy(De.getClearColor())},this.setClearColor=function(){De.setClearColor(...arguments)},this.getClearAlpha=function(){return De.getClearAlpha()},this.setClearAlpha=function(){De.setClearAlpha(...arguments)},this.clear=function(b=!0,I=!0,W=!0){let k=0;if(b){let G=!1;if(J!==null){const de=J.texture.format;G=p.has(de)}if(G){const de=J.texture.type,ge=m.has(de),he=De.getClearColor(),ye=De.getClearAlpha(),Se=he.r,Ue=he.g,Be=he.b;ge?(M[0]=Se,M[1]=Ue,M[2]=Be,M[3]=ye,N.clearBufferuiv(N.COLOR,0,M)):(A[0]=Se,A[1]=Ue,A[2]=Be,A[3]=ye,N.clearBufferiv(N.COLOR,0,A))}else k|=N.COLOR_BUFFER_BIT}I&&(k|=N.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),W&&(k|=N.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),k!==0&&N.clear(k)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(b){b.setRenderer(this),U=b},this.dispose=function(){t.removeEventListener("webglcontextlost",rt,!1),t.removeEventListener("webglcontextrestored",Ye,!1),t.removeEventListener("webglcontextcreationerror",zt,!1),De.dispose(),ce.dispose(),se.dispose(),V.dispose(),ie.dispose(),Z.dispose(),fe.dispose(),te.dispose(),re.dispose(),be.dispose(),be.removeEventListener("sessionstart",fr),be.removeEventListener("sessionend",pr),Sn.stop()};function rt(b){b.preventDefault(),sa("WebGLRenderer: Context Lost."),P=!0}function Ye(){sa("WebGLRenderer: Context Restored."),P=!1;const b=z.autoReset,I=Ae.enabled,W=Ae.autoUpdate,k=Ae.needsUpdate,G=Ae.type;Re(),z.autoReset=b,Ae.enabled=I,Ae.autoUpdate=W,Ae.needsUpdate=k,Ae.type=G}function zt(b){Xe("WebGLRenderer: A WebGL context could not be created. Reason: ",b.statusMessage)}function $t(b){const I=b.target;I.removeEventListener("dispose",$t),Ks(I)}function Ks(b){Zs(b),V.remove(b)}function Zs(b){const I=V.get(b).programs;I!==void 0&&(I.forEach(function(W){re.releaseProgram(W)}),b.isShaderMaterial&&re.releaseShaderCache(b))}this.renderBufferDirect=function(b,I,W,k,G,de){I===null&&(I=Ct);const ge=G.isMesh&&G.matrixWorld.determinantAffine()<0,he=eo(b,I,W,k,G);_.setMaterial(k,ge);let ye=W.index,Se=1;if(k.wireframe===!0){if(ye=$.getWireframeAttribute(W),ye===void 0)return;Se=2}const Ue=W.drawRange,Be=W.attributes.position;let xe=Ue.start*Se,$e=(Ue.start+Ue.count)*Se;de!==null&&(xe=Math.max(xe,de.start*Se),$e=Math.min($e,(de.start+de.count)*Se)),ye!==null?(xe=Math.max(xe,0),$e=Math.min($e,ye.count)):Be!=null&&(xe=Math.max(xe,0),$e=Math.min($e,Be.count));const dt=$e-xe;if(dt<0||dt===1/0)return;fe.setup(G,k,he,W,ye);let ot,tt=oe;if(ye!==null&&(ot=ae.get(ye),tt=K,tt.setIndex(ot)),G.isMesh)k.wireframe===!0?(_.setLineWidth(k.wireframeLinewidth*ht()),tt.setMode(N.LINES)):tt.setMode(N.TRIANGLES);else if(G.isLine){let St=k.linewidth;St===void 0&&(St=1),_.setLineWidth(St*ht()),G.isLineSegments?tt.setMode(N.LINES):G.isLineLoop?tt.setMode(N.LINE_LOOP):tt.setMode(N.LINE_STRIP)}else G.isPoints?tt.setMode(N.POINTS):G.isSprite&&tt.setMode(N.TRIANGLES);if(G.isBatchedMesh)if(Ze.get("WEBGL_multi_draw"))tt.renderMultiDraw(G._multiDrawStarts,G._multiDrawCounts,G._multiDrawCount);else{const St=G._multiDrawStarts,me=G._multiDrawCounts,Et=G._multiDrawCount,He=ye?ae.get(ye).bytesPerElement:1,Nt=V.get(k).currentProgram.getUniforms();for(let Kt=0;Kt<Et;Kt++)Nt.setValue(N,"_gl_DrawID",Kt),tt.render(St[Kt]/He,me[Kt])}else if(G.isInstancedMesh)tt.renderInstances(xe,dt,G.count);else if(W.isInstancedBufferGeometry){const St=W._maxInstanceCount!==void 0?W._maxInstanceCount:1/0,me=Math.min(W.instanceCount,St);tt.renderInstances(xe,dt,me)}else tt.render(xe,dt)};function dr(b,I,W,k){U!==null&&b.isNodeMaterial&&U.setObject(k,b),We===!0&&Me.setState(b,W,!1),b.transparent===!0&&b.side===2&&b.forceSinglePass===!1?(b.side=1,b.needsUpdate=!0,Ti(b,I,k),b.side=0,b.needsUpdate=!0,Ti(b,I,k),b.side=2):Ti(b,I,k)}this.compile=function(b,I,W=null){W===null&&(W=b),U!==null&&U.renderStart(b,I,W),S=se.get(W),S.init(I),y.push(S),W.traverseVisible(function(G){G.isLight&&G.layers.test(I.layers)&&(S.pushLight(G),G.castShadow&&S.pushShadow(G))}),b!==W&&b.traverseVisible(function(G){G.isLight&&G.layers.test(I.layers)&&(S.pushLight(G),G.castShadow&&S.pushShadow(G))}),S.setupLights(),U!==null&&U.updateLights(S.state.lightsArray),at=this.localClippingEnabled,We=Me.init(this.clippingPlanes,at),We===!0&&Me.setGlobalState(this.clippingPlanes,I),U!==null&&Ae.render(S.state.shadowsArray,W,I);const k=new Set;return b.traverse(function(G){if(!(G.isMesh||G.isPoints||G.isLine||G.isSprite))return;const de=G.material;if(de)if(Array.isArray(de))for(let ge=0;ge<de.length;ge++){const he=de[ge];dr(he,W,I,G),k.add(he)}else dr(de,W,I,G),k.add(de)}),S=y.pop(),U!==null&&U.renderEnd(),k},this.compileAsync=function(b,I,W=null){const k=this.compile(b,I,W);return new Promise(G=>{function de(){if(k.forEach(function(ge){const ye=V.get(ge).currentProgram;(ye===void 0||ye.isReady())&&k.delete(ge)}),k.size===0){G(b);return}setTimeout(de,10)}Ze.get("KHR_parallel_shader_compile")!==null?de():setTimeout(de,10)})};let fa=null;function Js(b){fa&&fa(b)}function fr(){Sn.stop()}function pr(){Sn.start()}const Sn=new Bs;Sn.setAnimationLoop(Js),typeof self<"u"&&Sn.setContext(self),this.setAnimationLoop=function(b){fa=b,be.setAnimationLoop(b),b===null?Sn.stop():Sn.start()},be.addEventListener("sessionstart",fr),be.addEventListener("sessionend",pr),this.render=function(b,I){if(I!==void 0&&I.isCamera!==!0){Xe("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(P===!0)return;U!==null&&U.renderStart(b,I);const W=be.enabled===!0&&be.isPresenting===!0,k=R!==null&&(J===null||W)&&R.begin(D,J);if(b.matrixWorldAutoUpdate===!0&&b.updateMatrixWorld(),I.parent===null&&I.matrixWorldAutoUpdate===!0&&I.updateMatrixWorld(),be.enabled===!0&&be.isPresenting===!0&&(R===null||R.isCompositing()===!1)&&(be.cameraAutoUpdate===!0&&be.updateCamera(I),I=be.getCamera()),b.isScene===!0&&b.onBeforeRender(D,b,I,J),S=se.get(b,y.length),S.init(I),S.state.textureUnits=q.getTextureUnits(),y.push(S),Oe.multiplyMatrices(I.projectionMatrix,I.matrixWorldInverse),Ne.setFromProjectionMatrix(Oe,2e3,I.reversedDepth),at=this.localClippingEnabled,We=Me.init(this.clippingPlanes,at),x=ce.get(b,E.length),x.init(),E.push(x),be.enabled===!0&&be.isPresenting===!0){const ge=D.xr.getDepthSensingMesh();ge!==null&&pa(ge,I,-1/0,D.sortObjects)}pa(b,I,0,D.sortObjects),x.finish(),U!==null&&U.updateLights(S.state.lightsArray),D.sortObjects===!0&&x.sort(_e,Le),ct=be.enabled===!1||be.isPresenting===!1||be.hasDepthSensing()===!1,ct&&De.addToRenderList(x,b),this.info.render.frame++,this.info.autoReset===!0&&this.info.reset(),We===!0&&Me.beginShadows();const G=S.state.shadowsArray;if(Ae.render(G,b,I),We===!0&&Me.endShadows(),(k&&R.hasRenderPass())===!1){const ge=x.opaque,he=x.transmissive;if(S.setupLights(),I.isArrayCamera){const ye=I.cameras;if(he.length>0)for(let Se=0,Ue=ye.length;Se<Ue;Se++){const Be=ye[Se];vr(ge,he,b,Be)}ct&&De.render(b);for(let Se=0,Ue=ye.length;Se<Ue;Se++){const Be=ye[Se];mr(x,b,Be,Be.viewport)}}else he.length>0&&vr(ge,he,b,I),ct&&De.render(b),mr(x,b,I)}J!==null&&H===0&&(q.updateMultisampleRenderTarget(J),q.updateRenderTargetMipmap(J)),k&&R.end(D),b.isScene===!0&&b.onAfterRender(D,b,I),fe.resetDefaultState(),j=-1,Q=null,y.pop(),y.length>0?(S=y[y.length-1],q.setTextureUnits(S.state.textureUnits),We===!0&&Me.setGlobalState(D.clippingPlanes,S.state.camera)):S=null,E.pop(),E.length>0?x=E[E.length-1]:x=null,U!==null&&U.renderEnd()};function pa(b,I,W,k){if(b.visible===!1)return;if(b.layers.test(I.layers)){if(b.isGroup)W=b.renderOrder;else if(b.isLOD)b.autoUpdate===!0&&b.update(I);else if(b.isLightProbeGrid)S.pushLightProbeGrid(b);else if(b.isLight)S.pushLight(b),b.castShadow&&S.pushShadow(b);else if(b.isSprite){if(!b.frustumCulled||b.intersectsFrustum(Ne)){k&&yt.setFromMatrixPosition(b.matrixWorld).applyMatrix4(Oe);const ge=Z.update(b),he=b.material;he.visible&&x.push(b,ge,he,W,yt.z,null,I)}}else if((b.isMesh||b.isLine||b.isPoints)&&(!b.frustumCulled||b.intersectsFrustum(Ne))){const ge=Z.update(b),he=b.material;if(k&&(b.boundingSphere!==void 0?(b.boundingSphere===null&&b.computeBoundingSphere(),yt.copy(b.boundingSphere.center)):(ge.boundingSphere===null&&ge.computeBoundingSphere(),yt.copy(ge.boundingSphere.center)),yt.applyMatrix4(b.matrixWorld).applyMatrix4(Oe)),Array.isArray(he)){const ye=ge.groups;for(let Se=0,Ue=ye.length;Se<Ue;Se++){const Be=ye[Se],xe=he[Be.materialIndex];xe&&xe.visible&&x.push(b,ge,xe,W,yt.z,Be,I)}}else he.visible&&x.push(b,ge,he,W,yt.z,null,I)}}const de=b.children;for(let ge=0,he=de.length;ge<he;ge++)pa(de[ge],I,W,k)}function mr(b,I,W,k){const{opaque:G,transmissive:de,transparent:ge}=b;S.setupLightsView(W),We===!0&&Me.setGlobalState(D.clippingPlanes,W),k&&_.viewport(ne.copy(k)),G.length>0&&Ri(G,I,W),de.length>0&&Ri(de,I,W),ge.length>0&&Ri(ge,I,W),_.buffers.depth.setTest(!0),_.buffers.depth.setMask(!0),_.buffers.color.setMask(!0),_.setPolygonOffset(!1)}function vr(b,I,W,k){if((W.isScene===!0?W.overrideMaterial:null)!==null)return;if(S.state.transmissionRenderTarget[k.id]===void 0){const xe=Ze.has("EXT_color_buffer_half_float")||Ze.has("EXT_color_buffer_float");S.state.transmissionRenderTarget[k.id]=new Lt(1,1,{generateMipmaps:!0,type:xe?1016:1009,minFilter:1008,samples:Math.max(4,T.samples),stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:ke.workingColorSpace})}const de=S.state.transmissionRenderTarget[k.id],ge=k.viewport||ne;de.setSize(ge.z*D.transmissionResolutionScale,ge.w*D.transmissionResolutionScale);const he=D.getRenderTarget(),ye=D.getActiveCubeFace(),Se=D.getActiveMipmapLevel();D.setRenderTarget(de),D.getClearColor(it),Ve=D.getClearAlpha(),Ve<1&&D.setClearColor(16777215,.5),D.clear(),ct&&De.render(W);const Ue=D.toneMapping;D.toneMapping=0;const Be=k.viewport;if(k.viewport!==void 0&&(k.viewport=void 0),S.setupLightsView(k),We===!0&&Me.setGlobalState(D.clippingPlanes,k),Ri(b,W,k),q.updateMultisampleRenderTarget(de),q.updateRenderTargetMipmap(de),Ze.has("WEBGL_multisampled_render_to_texture")===!1){let xe=!1;for(let $e=0,dt=I.length;$e<dt;$e++){const ot=I[$e],{object:tt,geometry:St,material:me,group:Et}=ot;if(me.side===2&&tt.layers.test(k.layers)){const He=me.side;me.side=1,me.needsUpdate=!0,gr(tt,W,k,St,me,Et),me.side=He,me.needsUpdate=!0,xe=!0}}xe===!0&&(q.updateMultisampleRenderTarget(de),q.updateRenderTargetMipmap(de))}D.setRenderTarget(he,ye,Se),D.setClearColor(it,Ve),Be!==void 0&&(k.viewport=Be),D.toneMapping=Ue}function Ri(b,I,W){const k=I.isScene===!0?I.overrideMaterial:null;for(let G=0,de=b.length;G<de;G++){const ge=b[G],{object:he,geometry:ye,group:Se}=ge;let Ue=ge.material;Ue.allowOverride===!0&&k!==null&&(Ue=k),he.layers.test(W.layers)&&gr(he,I,W,ye,Ue,Se)}}function gr(b,I,W,k,G,de){U!==null&&G.isNodeMaterial&&U.setObject(b,G),b.onBeforeRender(D,I,W,k,G,de),b.modelViewMatrix.multiplyMatrices(W.matrixWorldInverse,b.matrixWorld),b.normalMatrix.getNormalMatrix(b.modelViewMatrix),G.onBeforeRender(D,I,W,k,b,de),G.transparent===!0&&G.side===2&&G.forceSinglePass===!1?(G.side=1,G.needsUpdate=!0,D.renderBufferDirect(W,I,k,G,b,de),G.side=0,G.needsUpdate=!0,D.renderBufferDirect(W,I,k,G,b,de),G.side=2):D.renderBufferDirect(W,I,k,G,b,de),b.onAfterRender(D,I,W,k,G,de)}function Ti(b,I,W){I.isScene!==!0&&(I=Ct);const k=V.get(b),G=S.state.lights,de=S.state.shadowsArray,ge=G.state.version,he=re.getParameters(b,G.state,de,I,W,S.state.lightProbeGridArray),ye=re.getProgramCacheKey(he);let Se=k.programs;k.environment=b.isMeshStandardMaterial||b.isMeshLambertMaterial||b.isMeshPhongMaterial?I.environment:null,k.fog=I.fog;const Ue=b.isMeshStandardMaterial||b.isMeshLambertMaterial&&!b.envMap||b.isMeshPhongMaterial&&!b.envMap;k.envMap=ie.get(b.envMap||k.environment,Ue),k.envMapRotation=k.environment!==null&&b.envMap===null?I.environmentRotation:b.envMapRotation,Se===void 0&&(b.addEventListener("dispose",$t),Se=new Map,k.programs=Se);let Be=Se.get(ye);if(Be!==void 0){if(k.currentProgram===Be&&k.lightsStateVersion===ge)return yr(b,he),Be}else he.uniforms=re.getUniforms(b),U!==null&&b.isNodeMaterial&&U.build(b,W,he),b.onBeforeCompile(he,D),Be=re.acquireProgram(he,ye),Se.set(ye,Be),k.uniforms=he.uniforms;const xe=k.uniforms;return(!b.isShaderMaterial&&!b.isRawShaderMaterial||b.clipping===!0)&&(xe.clippingPlanes=Me.uniform),yr(b,he),k.needsLights=no(b),k.lightsStateVersion=ge,k.needsLights&&(xe.ambientLightColor.value=G.state.ambient,xe.lightProbe.value=G.state.probe,xe.sunLights.value=G.state.sun,xe.sunLightShadows.value=G.state.sunShadow,xe.directionalLights.value=G.state.directional,xe.directionalLightShadows.value=G.state.directionalShadow,xe.spotLights.value=G.state.spot,xe.spotLightShadows.value=G.state.spotShadow,xe.rectAreaLights.value=G.state.rectArea,xe.ltc_1.value=G.state.rectAreaLTC1,xe.ltc_2.value=G.state.rectAreaLTC2,xe.pointLights.value=G.state.point,xe.pointLightShadows.value=G.state.pointShadow,xe.hemisphereLights.value=G.state.hemi,xe.sunShadowMatrix.value=G.state.sunShadowMatrix,xe.sunShadowCascade.value=G.state.sunShadowCascade,xe.directionalShadowMatrix.value=G.state.directionalShadowMatrix,xe.spotLightMatrix.value=G.state.spotLightMatrix,xe.spotLightMap.value=G.state.spotLightMap,xe.pointShadowMatrix.value=G.state.pointShadowMatrix),k.lightProbeGrid=S.state.lightProbeGridArray.length>0,k.currentProgram=Be,k.uniformsList=null,Be}function _r(b){if(b.uniformsList===null){const I=b.currentProgram.getUniforms();b.uniformsList=ea.seqWithValue(I.seq,b.uniforms)}return b.uniformsList}function yr(b,I){const W=V.get(b);W.outputColorSpace=I.outputColorSpace,W.batching=I.batching,W.batchingColor=I.batchingColor,W.instancing=I.instancing,W.instancingColor=I.instancingColor,W.instancingMorph=I.instancingMorph,W.skinning=I.skinning,W.morphTargets=I.morphTargets,W.morphNormals=I.morphNormals,W.morphColors=I.morphColors,W.morphTargetsCount=I.morphTargetsCount,W.numClippingPlanes=I.numClippingPlanes,W.numIntersection=I.numClipIntersection,W.vertexAlphas=I.vertexAlphas,W.vertexTangents=I.vertexTangents,W.toneMapping=I.toneMapping}function Qs(b,I){if(b.length===0)return null;if(b.length===1)return b[0].texture!==null?b[0]:null;w.setFromMatrixPosition(I.matrixWorld);for(let W=0,k=b.length;W<k;W++){const G=b[W];if(G.texture!==null&&G.boundingBox.containsPoint(w))return G}return null}function eo(b,I,W,k,G){I.isScene!==!0&&(I=Ct),q.resetTextureUnits();const de=I.fog,ge=k.isMeshStandardMaterial||k.isMeshLambertMaterial||k.isMeshPhongMaterial?I.environment:null,he=J===null?D.outputColorSpace:J.isXRRenderTarget===!0?J.texture.colorSpace:ke.workingColorSpace,ye=k.isMeshStandardMaterial||k.isMeshLambertMaterial&&!k.envMap||k.isMeshPhongMaterial&&!k.envMap,Se=ie.get(k.envMap||ge,ye),Ue=k.vertexColors===!0&&!!W.attributes.color&&W.attributes.color.itemSize===4,Be=!!W.attributes.tangent&&(!!k.normalMap||k.anisotropy>0),xe=!!W.morphAttributes.position,$e=!!W.morphAttributes.normal,dt=!!W.morphAttributes.color;let ot=0;k.toneMapped&&(J===null||J.isXRRenderTarget===!0)&&(ot=D.toneMapping);const tt=W.morphAttributes.position||W.morphAttributes.normal||W.morphAttributes.color,St=tt!==void 0?tt.length:0,me=V.get(k),Et=S.state.lights;if(We===!0&&(at===!0||b!==Q)){const st=b===Q&&k.id===j;Me.setState(k,b,st)}let He=!1;k.version===me.__version?(me.needsLights&&me.lightsStateVersion!==Et.state.version||me.outputColorSpace!==he||G.isBatchedMesh&&me.batching===!1||!G.isBatchedMesh&&me.batching===!0||G.isBatchedMesh&&me.batchingColor===!0&&G._colorsTexture===null||G.isBatchedMesh&&me.batchingColor===!1&&G._colorsTexture!==null||G.isInstancedMesh&&me.instancing===!1||!G.isInstancedMesh&&me.instancing===!0||G.isSkinnedMesh&&me.skinning===!1||!G.isSkinnedMesh&&me.skinning===!0||G.isInstancedMesh&&me.instancingColor===!0&&G.instanceColor===null||G.isInstancedMesh&&me.instancingColor===!1&&G.instanceColor!==null||G.isInstancedMesh&&me.instancingMorph===!0&&G.morphTexture===null||G.isInstancedMesh&&me.instancingMorph===!1&&G.morphTexture!==null||me.envMap!==Se||k.fog===!0&&me.fog!==de||me.numClippingPlanes!==void 0&&(me.numClippingPlanes!==Me.numPlanes||me.numIntersection!==Me.numIntersection)||me.vertexAlphas!==Ue||me.vertexTangents!==Be||me.morphTargets!==xe||me.morphNormals!==$e||me.morphColors!==dt||me.toneMapping!==ot||me.morphTargetsCount!==St||!!me.lightProbeGrid!=S.state.lightProbeGridArray.length>0)&&(He=!0):(He=!0,me.__version=k.version);let Nt=me.currentProgram;He===!0&&(Nt=Ti(k,I,G),U&&k.isNodeMaterial&&U.onUpdateProgram(k,Nt,me));let Kt=!1,dn=!1,In=!1;const et=Nt.getUniforms(),ut=me.uniforms;if(_.useProgram(Nt.program)&&(Kt=!0,dn=!0,In=!0),k.id!==j&&(j=k.id,dn=!0),me.needsLights){const st=Qs(S.state.lightProbeGridArray,G);me.lightProbeGrid!==st&&(me.lightProbeGrid=st,dn=!0)}if(Kt||Q!==b){_.buffers.depth.getReversed()&&b.reversedDepth!==!0&&(b._reversedDepth=!0,b.updateProjectionMatrix()),et.setValue(N,"projectionMatrix",b.projectionMatrix),et.setValue(N,"viewMatrix",b.matrixWorldInverse);const pn=et.map.cameraPosition;pn!==void 0&&pn.setValue(N,lt.setFromMatrixPosition(b.matrixWorld)),T.logarithmicDepthBuffer&&et.setValue(N,"logDepthBufFC",2/(Math.log(b.far+1)/Math.LN2)),(k.isMeshPhongMaterial||k.isMeshToonMaterial||k.isMeshLambertMaterial||k.isMeshBasicMaterial||k.isMeshStandardMaterial||k.isShaderMaterial)&&et.setValue(N,"isOrthographic",b.isOrthographicCamera===!0),Q!==b&&(Q=b,dn=!0,In=!0)}if(me.needsLights&&(Et.state.sunShadowMap.length>0&&et.setValue(N,"sunShadowMap",Et.state.sunShadowMap,q),Et.state.directionalShadowMap.length>0&&et.setValue(N,"directionalShadowMap",Et.state.directionalShadowMap,q),Et.state.spotShadowMap.length>0&&et.setValue(N,"spotShadowMap",Et.state.spotShadowMap,q),Et.state.pointShadowMap.length>0&&et.setValue(N,"pointShadowMap",Et.state.pointShadowMap,q)),G.isSkinnedMesh){et.setOptional(N,G,"bindMatrix"),et.setOptional(N,G,"bindMatrixInverse");const st=G.skeleton;st&&(st.boneTexture===null&&st.computeBoneTexture(),et.setValue(N,"boneTexture",st.boneTexture,q))}G.isBatchedMesh&&(et.setOptional(N,G,"batchingTexture"),et.setValue(N,"batchingTexture",G._matricesTexture,q),et.setOptional(N,G,"batchingIdTexture"),et.setValue(N,"batchingIdTexture",G._indirectTexture,q),et.setOptional(N,G,"batchingColorTexture"),G._colorsTexture!==null&&et.setValue(N,"batchingColorTexture",G._colorsTexture,q));const fn=W.morphAttributes;if((fn.position!==void 0||fn.normal!==void 0||fn.color!==void 0)&&F.update(G,W,Nt),(dn||me.receiveShadow!==G.receiveShadow)&&(me.receiveShadow=G.receiveShadow,et.setValue(N,"receiveShadow",G.receiveShadow)),(k.isMeshStandardMaterial||k.isMeshLambertMaterial||k.isMeshPhongMaterial)&&k.envMap===null&&I.environment!==null&&(ut.envMapIntensity.value=I.environmentIntensity),ut.dfgLUT!==void 0&&(ut.dfgLUT.value=td()),dn){if(et.setValue(N,"toneMappingExposure",D.toneMappingExposure),me.needsLights&&to(ut,In),de&&k.fog===!0&&we.refreshFogUniforms(ut,de),we.refreshMaterialUniforms(ut,k,ee,Y,S.state.transmissionRenderTarget[b.id]),me.needsLights&&me.lightProbeGrid){const st=me.lightProbeGrid;ut.probesSH.value=st.texture,ut.probesMin.value.copy(st.boundingBox.min),ut.probesMax.value.copy(st.boundingBox.max),ut.probesResolution.value.copy(st.resolution)}ea.upload(N,_r(me),ut,q)}if(k.isShaderMaterial&&k.uniformsNeedUpdate===!0&&(ea.upload(N,_r(me),ut,q),k.uniformsNeedUpdate=!1),k.isSpriteMaterial&&et.setValue(N,"center",G.center),et.setValue(N,"modelViewMatrix",G.modelViewMatrix),et.setValue(N,"normalMatrix",G.normalMatrix),et.setValue(N,"modelMatrix",G.matrixWorld),k.uniformsGroups!==void 0){const st=k.uniformsGroups;for(let pn=0,Fn=st.length;pn<Fn;pn++){const br=st[pn];te.update(br,Nt),te.bind(br,Nt)}}return Nt}function to(b,I){b.ambientLightColor.needsUpdate=I,b.lightProbe.needsUpdate=I,b.sunLights.needsUpdate=I,b.sunLightShadows.needsUpdate=I,b.directionalLights.needsUpdate=I,b.directionalLightShadows.needsUpdate=I,b.pointLights.needsUpdate=I,b.pointLightShadows.needsUpdate=I,b.spotLights.needsUpdate=I,b.spotLightShadows.needsUpdate=I,b.rectAreaLights.needsUpdate=I,b.hemisphereLights.needsUpdate=I}function no(b){return b.isMeshLambertMaterial||b.isMeshToonMaterial||b.isMeshPhongMaterial||b.isMeshStandardMaterial||b.isShadowMaterial||b.isShaderMaterial&&b.lights===!0}this.getActiveCubeFace=function(){return X},this.getActiveMipmapLevel=function(){return H},this.getRenderTarget=function(){return J},this.setRenderTargetTextures=function(b,I,W){const k=V.get(b);k.__autoAllocateDepthBuffer=b.resolveDepthBuffer===!1,k.__autoAllocateDepthBuffer===!1&&(k.__useRenderToTexture=!1),V.get(b.texture).__webglTexture=I,V.get(b.depthTexture).__webglTexture=k.__autoAllocateDepthBuffer?void 0:W,k.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(b,I){const W=V.get(b);W.__webglFramebuffer=I,W.__useDefaultFramebuffer=I===void 0},this.setRenderTarget=function(b,I=0,W=0){J=b,X=I,H=W;let k=null,G=!1,de=!1;if(b){const he=V.get(b);if(he.__useDefaultFramebuffer!==void 0){_.bindFramebuffer(N.FRAMEBUFFER,he.__webglFramebuffer),ne.copy(b.viewport),Te.copy(b.scissor),Ee=b.scissorTest,_.viewport(ne),_.scissor(Te),_.setScissorTest(Ee),j=-1;return}else if(he.__webglFramebuffer===void 0)q.setupRenderTarget(b);else if(he.__hasExternalTextures)q.rebindTextures(b,V.get(b.texture).__webglTexture,V.get(b.depthTexture).__webglTexture);else if(b.depthBuffer){const Ue=b.depthTexture;if(he.__boundDepthTexture!==Ue){if(Ue!==null&&V.has(Ue)&&(b.width!==Ue.image.width||b.height!==Ue.image.height))throw new Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");q.setupDepthRenderbuffer(b)}}const ye=b.texture;(ye.isData3DTexture||ye.isDataArrayTexture||ye.isCompressedArrayTexture)&&(de=!0);const Se=V.get(b).__webglFramebuffer;b.isWebGLCubeRenderTarget?(Array.isArray(Se[I])?k=Se[I][W]:k=Se[I],G=!0):b.samples>0&&q.useMultisampledRTT(b)===!1?k=V.get(b).__webglMultisampledFramebuffer:Array.isArray(Se)?k=Se[W]:k=Se,ne.copy(b.viewport),Te.copy(b.scissor),Ee=b.scissorTest}else ne.copy(ve).multiplyScalar(ee).floor(),Te.copy(Fe).multiplyScalar(ee).floor(),Ee=mt;if(W!==0&&(k=L),_.bindFramebuffer(N.FRAMEBUFFER,k)&&_.drawBuffers(b,k),_.viewport(ne),_.scissor(Te),_.setScissorTest(Ee),G){const he=V.get(b.texture);N.framebufferTexture2D(N.FRAMEBUFFER,N.COLOR_ATTACHMENT0,N.TEXTURE_CUBE_MAP_POSITIVE_X+I,he.__webglTexture,W)}else if(de){const he=I;for(let ye=0;ye<b.textures.length;ye++){const Se=V.get(b.textures[ye]);N.framebufferTextureLayer(N.FRAMEBUFFER,N.COLOR_ATTACHMENT0+ye,Se.__webglTexture,W,he)}}else if(b!==null&&W!==0){const he=V.get(b.texture);N.framebufferTexture2D(N.FRAMEBUFFER,N.COLOR_ATTACHMENT0,N.TEXTURE_2D,he.__webglTexture,W)}j=-1};function xr(b){const I=V.get(b);return(I.__readFormat!==b.format||I.__readType!==b.type)&&(I.__readFormat=b.format,I.__readType=b.type,I.__formatReadable=T.textureFormatReadable(b.format),I.__typeReadable=T.textureTypeReadable(b.type)),I}this.readRenderTargetPixels=function(b,I,W,k,G,de,ge,he=0){if(!(b&&b.isWebGLRenderTarget)){Xe("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let ye=V.get(b).__webglFramebuffer;if(b.isWebGLCubeRenderTarget&&ge!==void 0&&(ye=ye[ge]),ye){_.bindFramebuffer(N.FRAMEBUFFER,ye);try{const Se=b.textures[he],Ue=Se.format,Be=Se.type;b.textures.length>1&&N.readBuffer(N.COLOR_ATTACHMENT0+he);const xe=xr(Se);if(xe.__formatReadable===!1){Xe("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(xe.__typeReadable===!1){Xe("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}I>=0&&I<=b.width-k&&W>=0&&W<=b.height-G&&N.readPixels(I,W,k,G,le.convert(Ue),le.convert(Be),de)}finally{const Se=J!==null?V.get(J).__webglFramebuffer:null;_.bindFramebuffer(N.FRAMEBUFFER,Se)}}},this.readRenderTargetPixelsAsync=async function(b,I,W,k,G,de,ge,he=0){if(!(b&&b.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let ye=V.get(b).__webglFramebuffer;if(b.isWebGLCubeRenderTarget&&ge!==void 0&&(ye=ye[ge]),ye)if(I>=0&&I<=b.width-k&&W>=0&&W<=b.height-G){_.bindFramebuffer(N.FRAMEBUFFER,ye);const Se=b.textures[he],Ue=Se.format,Be=Se.type;b.textures.length>1&&N.readBuffer(N.COLOR_ATTACHMENT0+he);const xe=xr(Se);if(xe.__formatReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(xe.__typeReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");const $e=N.createBuffer();N.bindBuffer(N.PIXEL_PACK_BUFFER,$e),N.bufferData(N.PIXEL_PACK_BUFFER,de.byteLength,N.STREAM_READ),N.readPixels(I,W,k,G,le.convert(Ue),le.convert(Be),0),N.bindBuffer(N.PIXEL_PACK_BUFFER,null);const dt=J!==null?V.get(J).__webglFramebuffer:null;_.bindFramebuffer(N.FRAMEBUFFER,dt);const ot=N.fenceSync(N.SYNC_GPU_COMMANDS_COMPLETE,0);return N.flush(),await ro(N,ot,4),N.bindBuffer(N.PIXEL_PACK_BUFFER,$e),N.getBufferSubData(N.PIXEL_PACK_BUFFER,0,de),N.bindBuffer(N.PIXEL_PACK_BUFFER,null),N.deleteBuffer($e),N.deleteSync(ot),de}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(b,I=null,W=0){const k=Math.pow(2,-W),G=Math.floor(b.image.width*k),de=Math.floor(b.image.height*k),ge=I!==null?I.x:0,he=I!==null?I.y:0;q.setTexture2D(b,0),N.copyTexSubImage2D(N.TEXTURE_2D,W,0,0,ge,he,G,de),_.unbindTexture()},this.copyTextureToTexture=function(b,I,W=null,k=null,G=0,de=0){let ge,he,ye,Se,Ue,Be,xe,$e,dt;const ot=b.isCompressedTexture?b.mipmaps[de]:b.image;if(W!==null)ge=W.max.x-W.min.x,he=W.max.y-W.min.y,ye=W.isBox3?W.max.z-W.min.z:1,Se=W.min.x,Ue=W.min.y,Be=W.isBox3?W.min.z:0;else{const ut=Math.pow(2,-G);ge=Math.floor(ot.width*ut),he=Math.floor(ot.height*ut),b.isDataArrayTexture?ye=ot.depth:b.isData3DTexture?ye=Math.floor(ot.depth*ut):ye=1,Se=0,Ue=0,Be=0}k!==null?(xe=k.x,$e=k.y,dt=k.z):(xe=0,$e=0,dt=0);const tt=le.convert(I.format),St=le.convert(I.type);let me;I.isData3DTexture?(q.setTexture3D(I,0),me=N.TEXTURE_3D):I.isDataArrayTexture||I.isCompressedArrayTexture?(q.setTexture2DArray(I,0),me=N.TEXTURE_2D_ARRAY):(q.setTexture2D(I,0),me=N.TEXTURE_2D),_.activeTexture(N.TEXTURE0),_.pixelStorei(N.UNPACK_FLIP_Y_WEBGL,I.flipY),_.pixelStorei(N.UNPACK_PREMULTIPLY_ALPHA_WEBGL,I.premultiplyAlpha),_.pixelStorei(N.UNPACK_ALIGNMENT,I.unpackAlignment);const Et=_.getParameter(N.UNPACK_ROW_LENGTH),He=_.getParameter(N.UNPACK_IMAGE_HEIGHT),Nt=_.getParameter(N.UNPACK_SKIP_PIXELS),Kt=_.getParameter(N.UNPACK_SKIP_ROWS),dn=_.getParameter(N.UNPACK_SKIP_IMAGES);_.pixelStorei(N.UNPACK_ROW_LENGTH,ot.width),_.pixelStorei(N.UNPACK_IMAGE_HEIGHT,ot.height),_.pixelStorei(N.UNPACK_SKIP_PIXELS,Se),_.pixelStorei(N.UNPACK_SKIP_ROWS,Ue),_.pixelStorei(N.UNPACK_SKIP_IMAGES,Be);const In=b.isDataArrayTexture||b.isData3DTexture,et=I.isDataArrayTexture||I.isData3DTexture;if(b.isDepthTexture){const ut=V.get(b),fn=V.get(I),st=V.get(ut.__renderTarget),pn=V.get(fn.__renderTarget);_.bindFramebuffer(N.READ_FRAMEBUFFER,st.__webglFramebuffer),_.bindFramebuffer(N.DRAW_FRAMEBUFFER,pn.__webglFramebuffer);for(let Fn=0;Fn<ye;Fn++)In&&(N.framebufferTextureLayer(N.READ_FRAMEBUFFER,N.COLOR_ATTACHMENT0,V.get(b).__webglTexture,G,Be+Fn),N.framebufferTextureLayer(N.DRAW_FRAMEBUFFER,N.COLOR_ATTACHMENT0,V.get(I).__webglTexture,de,dt+Fn)),N.blitFramebuffer(Se,Ue,ge,he,xe,$e,ge,he,N.DEPTH_BUFFER_BIT,N.NEAREST);_.bindFramebuffer(N.READ_FRAMEBUFFER,null),_.bindFramebuffer(N.DRAW_FRAMEBUFFER,null)}else if(G!==0||b.isRenderTargetTexture||V.has(b)){const ut=V.get(b),fn=V.get(I);_.bindFramebuffer(N.READ_FRAMEBUFFER,C),_.bindFramebuffer(N.DRAW_FRAMEBUFFER,B);for(let st=0;st<ye;st++)In?N.framebufferTextureLayer(N.READ_FRAMEBUFFER,N.COLOR_ATTACHMENT0,ut.__webglTexture,G,Be+st):N.framebufferTexture2D(N.READ_FRAMEBUFFER,N.COLOR_ATTACHMENT0,N.TEXTURE_2D,ut.__webglTexture,G),et?N.framebufferTextureLayer(N.DRAW_FRAMEBUFFER,N.COLOR_ATTACHMENT0,fn.__webglTexture,de,dt+st):N.framebufferTexture2D(N.DRAW_FRAMEBUFFER,N.COLOR_ATTACHMENT0,N.TEXTURE_2D,fn.__webglTexture,de),G!==0?N.blitFramebuffer(Se,Ue,ge,he,xe,$e,ge,he,N.COLOR_BUFFER_BIT,N.NEAREST):et?N.copyTexSubImage3D(me,de,xe,$e,dt+st,Se,Ue,ge,he):N.copyTexSubImage2D(me,de,xe,$e,Se,Ue,ge,he);_.bindFramebuffer(N.READ_FRAMEBUFFER,null),_.bindFramebuffer(N.DRAW_FRAMEBUFFER,null)}else et?b.isDataTexture||b.isData3DTexture?N.texSubImage3D(me,de,xe,$e,dt,ge,he,ye,tt,St,ot.data):I.isCompressedArrayTexture?N.compressedTexSubImage3D(me,de,xe,$e,dt,ge,he,ye,tt,ot.data):N.texSubImage3D(me,de,xe,$e,dt,ge,he,ye,tt,St,ot):b.isDataTexture?N.texSubImage2D(N.TEXTURE_2D,de,xe,$e,ge,he,tt,St,ot.data):b.isCompressedTexture?N.compressedTexSubImage2D(N.TEXTURE_2D,de,xe,$e,ot.width,ot.height,tt,ot.data):N.texSubImage2D(N.TEXTURE_2D,de,xe,$e,ge,he,tt,St,ot);_.pixelStorei(N.UNPACK_ROW_LENGTH,Et),_.pixelStorei(N.UNPACK_IMAGE_HEIGHT,He),_.pixelStorei(N.UNPACK_SKIP_PIXELS,Nt),_.pixelStorei(N.UNPACK_SKIP_ROWS,Kt),_.pixelStorei(N.UNPACK_SKIP_IMAGES,dn),de===0&&I.generateMipmaps&&N.generateMipmap(me),_.unbindTexture()},this.initRenderTarget=function(b){V.get(b).__webglFramebuffer===void 0&&q.setupRenderTarget(b)},this.initTexture=function(b){b.isCubeTexture?q.setTextureCube(b,0):b.isData3DTexture?q.setTexture3D(b,0):b.isDataArrayTexture||b.isCompressedArrayTexture?q.setTexture2DArray(b,0):q.setTexture2D(b,0),_.unbindTexture()},this.resetState=function(){X=0,H=0,J=null,_.reset(),fe.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return 2e3}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;const t=this.getContext();t.drawingBufferColorSpace=ke._getDrawingBufferColorSpace(e),t.unpackColorSpace=ke._getUnpackColorSpace()}}function id(i){const e=i.r*.2126+i.g*.7152+i.b*.0722,t=Math.min(.68,Math.max(.21,e));if(t===e)return;const n=t>e?1:0,a=(t-e)/(n-e);i.r+=(n-i.r)*a,i.g+=(n-i.g)*a,i.b+=(n-i.b)*a}const ad=new URL("../assets/packed-motion-alfred-base-qGBsrbI9.bin",import.meta.url).href,rd=new URL("../assets/packed-motion-blue_beret-base-BMmnGSRf.bin",import.meta.url).href,sd=new URL("../assets/packed-motion-blue_spectacles-base-svr89Z5G.bin",import.meta.url).href,od=new URL("../assets/packed-motion-coral_monocle-base-BZF70fks.bin",import.meta.url).href,ld=new URL("../assets/packed-motion-gus-base-DMFGsmOw.bin",import.meta.url).href,cd=new URL("../assets/packed-motion-lime_frog-base-1lxQ44Sn.bin",import.meta.url).href,ud=new URL("../assets/packed-motion-lime_headphones-base-CnmCxRo5.bin",import.meta.url).href,hd=new URL("../assets/packed-motion-purple_heart-base-C9b2erxe.bin",import.meta.url).href,dd=new URL("../assets/packed-motion-alfred-work-BMHfS_E-.bin",import.meta.url).href,fd=new URL("../assets/packed-motion-blue_beret-work-yt3jMbTu.bin",import.meta.url).href,pd=new URL("../assets/packed-motion-blue_spectacles-work-CBlZ4diH.bin",import.meta.url).href,md=new URL("../assets/packed-motion-coral_monocle-work-5qh-uRFS.bin",import.meta.url).href,vd=new URL("../assets/packed-motion-gus-work-DSbmf5pQ.bin",import.meta.url).href,gd=new URL("../assets/packed-motion-lime_frog-work-DyYXIUKb.bin",import.meta.url).href,_d=new URL("../assets/packed-motion-lime_headphones-work-Cd4C4xxG.bin",import.meta.url).href,yd=new URL("../assets/packed-motion-purple_heart-work-232eZJU3.bin",import.meta.url).href,vt=Math.fround;function ds(i){let e=Math.imul(i^i>>>16,2146121005);return e=Math.imul(e^e>>>15,-2073254261),(e>>>24^e>>>8)/16777216}function fs(i,e){return e?(i=vt(i),vt(vt(vt(i*i)*i)*vt(vt(i*vt(vt(i*6)-15))+10))):i*i*i*(i*(i*6-15)+10)}class xd{constructor(e=17){if(!Number.isInteger(e)||e<0||e>4294967295)throw Error("Breathing seed must be an unsigned 32-bit integer");this.period=5.2+.8*ds(e^599040221),this.phase=ds(e)}sample(e,t,n=!0){if(!Number.isFinite(e)||e<0)throw Error("Invalid breathing time");const a=(e/this.period+this.phase)%1;let r=a<.4?fs(a/.4,n)-.5:a<.47?.5:a<.91?.5-fs((a-.47)/.44,n):-.5;if(n)r=vt(r),t.y=vt(r*vt(.002)),t.scaleY=vt(vt(r*vt(.006))+1),t.scaleXZ=vt(1/vt(Math.sqrt(t.scaleY)));else{t.y=vt(r*.002);const s=r*.006+1;t.scaleY=vt(s),t.scaleXZ=vt(1/Math.sqrt(s))}return t}}function Zn(i,e,t,n,a,r){if("value"in i){for(let s=0;s<e;s++)t[s]=i.value[s];return}for(let s=0;s<e;s++){const o=i.samples[n*e+s],c=i.samples[a*e+s];t[s]=r===0?o:r===1?c:o+(c-o)*r}}function pi(i,e){if(i===e)return!0;if(!i||!e||"value"in i!="value"in e)return!1;const t="value"in i?i.value:i.samples,n="value"in e?e.value:e.samples;return t===n?!0:t.length===n.length&&t.every((a,r)=>Object.is(a,n[r]))}class Pn{constructor(e){if(this.clip=e,this.position=new O,this.rotation=new bn,this.nextRotation=new bn,this.scale=new O,this.scratch=[0,0,0,0],this.shear=[0,0,0],this.normalCorrection=Array(9).fill(0),!Number.isFinite(e.duration)||e.duration<=0||e.times.length<2||e.times[0]!==0||e.times[e.times.length-1]!==e.duration)throw Error("Invalid authored motion duration");for(let n=1;n<e.times.length;n++)if(e.times[n]<=e.times[n-1])throw Error("Motion keyframes must increase");if(!e.times.every(Number.isFinite))throw Error("Invalid motion timestamps");this.fieldEntries=e.parts.map(n=>Object.entries(n.fields)),this.transformSources=e.parts.map((n,a)=>{for(let r=0;r<a;r++){const s=e.parts[r];if(pi(n.translation,s.translation)&&pi(n.rotation,s.rotation)&&pi(n.scale,s.scale)&&pi(n.shear,s.shear)&&pi(n.normalCorrection,s.normalCorrection))return r}return a});const t=new Set;for(const n of e.parts){if(t.has(n.id))throw Error("Duplicate motion part");t.add(n.id);for(const[s,o]of[[n.translation,3],[n.rotation,4],[n.scale,3],...n.shear?[[n.shear,3]]:[],...n.normalCorrection?[[n.normalCorrection,9]]:[],...Object.values(n.fields).map(c=>[c,4])]){const c="value"in s?s.value:s.samples;if(c.length!==o*("value"in s?1:e.times.length)||!c.every(Number.isFinite))throw Error("Invalid motion channel")}const a="value"in n.scale?n.scale.value:n.scale.samples;for(let s=0;s<a.length;s++){if(Math.abs(a[s])<=1e-10)throw Error("Singular motion scale");if(Math.sign(a[s])!==Math.sign(a[s%3]))throw Error("Motion scale crosses a singularity");if(n.shear&&s%3<2&&a[s]<0)throw Error("Affine QR requires positive first two scales")}const r="value"in n.rotation?n.rotation.value:n.rotation.samples;for(let s=0;s<r.length;s+=4)if(Math.abs(Math.hypot(...r.slice(s,s+4))-1)>1e-6)throw Error("Motion rotation must be a unit quaternion")}}createPose(){return this.clip.parts.map(e=>({id:e.id,world:new pe,normalMatrix:new pe,fields:Object.fromEntries(Object.keys(e.fields).map(t=>[t,[0,0,0,0]]))}))}sample(e,t){if(!Number.isFinite(e)||t.length!==this.clip.parts.length)throw Error("Invalid motion sampling input");const{clip:n}=this,a=n.loop?(e%n.duration+n.duration)%n.duration:Math.max(0,Math.min(e,n.duration));let r=0,s=n.times.length-1;for(;s-r>1;){const d=r+s>>>1;n.times[d]<=a?r=d:s=d}const o=n.times[r],c=n.times[s],l=8*Number.EPSILON*Math.max(1,Math.abs(a),Math.abs(o),Math.abs(c)),h=a-o<=l?0:c-a<=l?1:(a-o)/(c-o);for(let d=0;d<n.parts.length;d++){const u=n.parts[d],f=t[d];if(f.id!==u.id)throw Error("Motion pose identities differ");const v=this.transformSources[d];if(v!==d){f.world.copy(t[v].world),f.normalMatrix.copy(t[v].normalMatrix);for(const[g,p]of this.fieldEntries[d])Zn(p,4,f.fields[g],r,s,h);continue}if(Zn(u.translation,3,this.scratch,r,s,h),this.position.fromArray(this.scratch),Zn(u.scale,3,this.scratch,r,s,h),this.scale.fromArray(this.scratch),"value"in u.rotation?this.rotation.fromArray(u.rotation.value):(this.rotation.fromArray(u.rotation.samples,r*4),this.nextRotation.fromArray(u.rotation.samples,s*4),h===1?this.rotation.copy(this.nextRotation):h!==0&&this.rotation.slerp(this.nextRotation,h)),u.shear){Zn(u.shear,3,this.shear,r,s,h),f.world.makeRotationFromQuaternion(this.rotation).setPosition(this.position);const g=f.world.elements;for(let p=0;p<3;p++){const m=g[p],M=g[4+p],A=g[8+p];g[p]=m*this.scale.x,g[4+p]=m*this.shear[0]+M*this.scale.y,g[8+p]=m*this.shear[1]+M*this.shear[2]+A*this.scale.z}}else f.world.compose(this.position,this.rotation,this.scale);if(f.normalMatrix.copy(f.world).invert().transpose(),u.normalCorrection){Zn(u.normalCorrection,9,this.normalCorrection,r,s,h);const g=f.normalMatrix.elements;for(let p=0;p<3;p++)for(let m=0;m<3;m++)g[p*4+m]=g[p*4+m]+this.normalCorrection[p*3+m];g[3]=g[7]=g[11]=g[12]=g[13]=g[14]=0,g[15]=1}for(const[g,p]of this.fieldEntries[d])Zn(p,4,f.fields[g],r,s,h)}}}class bd extends Pn{constructor(e,t,n=1,a=6){if(super(e),this.nativeStart=t,this.loopStart=n,this.period=a,this.breathing=new xd,this.sourceBreath={y:0,scaleY:1,scaleXZ:1},this.targetBreath={y:0,scaleY:1,scaleXZ:1},this.delta=new pe,this.normalDelta=new pe,this.scaleDelta=new pe,this.inverseBody=new pe,!Number.isFinite(t)||!Number.isFinite(n)||!Number.isFinite(a)||t<1/60||n<0||a<=0||e.duration<n+a)throw Error("Computer loop requires its complete observed interval")}sample(e,t){if(!Number.isFinite(e)||e<0)throw Error("Invalid Computer loop time");const n=e<this.loopStart?e:this.loopStart+(e-this.loopStart)%this.period;if(super.sample(n,t),n===e)return;this.breathing.sample(this.nativeStart+n-1/60,this.sourceBreath,!1),this.breathing.sample(this.nativeStart+e-1/60,this.targetBreath,!1);const a=this.targetBreath.scaleXZ/this.sourceBreath.scaleXZ,r=this.targetBreath.scaleY/this.sourceBreath.scaleY,s=t[0];if(s?.id!=="mesh:0")throw Error("Computer loop requires its body frame");this.inverseBody.copy(s.world).invert(),this.delta.copy(s.world).multiply(this.scaleDelta.makeScale(a,r,a)),this.delta.elements[13]+=this.targetBreath.y-this.sourceBreath.y,this.delta.multiply(this.inverseBody),this.normalDelta.copy(this.delta).invert().transpose(),this.normalDelta.elements[3]=this.normalDelta.elements[7]=this.normalDelta.elements[11]=0,this.normalDelta.setPosition(0,0,0);for(const o of t){const c=o.fields.referencePose?.[3];c===-4||c===-24||c===-40||(c===-16?(o.world.multiply(this.scaleDelta.makeScale(a,a,1)),o.normalMatrix.multiply(this.scaleDelta.makeScale(1/a,1/a,1))):(o.world.premultiply(this.delta),o.normalMatrix.premultiply(this.normalDelta)))}}}function cr(i){const e=new DataView(i);if(i.byteLength<16||e.getUint32(0,!0)!==1179468098||e.getUint32(4,!0)!==16790582)throw Error("Invalid avatar motion binary header");const t=e.getUint32(8,!0),n=e.getUint32(12,!0),a=Math.ceil((16+t)/8)*8;if(!t||a+n*8!==i.byteLength)throw Error("Invalid avatar motion binary length");const r=new TextDecoder("utf-8",{fatal:!0}).decode(new Uint8Array(i,16,t)),s=new Uint8Array(new Uint16Array([1]).buffer)[0]===1,o=new Map;return JSON.parse(r,(c,l)=>{if(l===null||typeof l!="object"||!("$motionF64"in l))return l;const h=l.$motionF64;if(Object.keys(l).length!==1||!Array.isArray(h)||h.length!==2||!h.every(Number.isSafeInteger)||h[0]<0||h[1]<1||h[0]+h[1]>n)throw Error("Invalid avatar motion channel range");const d=`${h[0]}:${h[1]}`;let u=o.get(d);if(!u){const f=a+h[0]*8;u=s?new Float64Array(i,f,h[1]):Float64Array.from({length:h[1]},(v,g)=>e.getFloat64(f+g*8,!0)),o.set(d,u)}return u})}const Sd={blue_beret:{nativeStart:3,nativeStop:5.216666666666667,nativeReturn:6.266666666666667,returnTime:3.2666666666666666,nativeEnd:10,exactTailFrames:225,previousNonmatchingTime:6.25,compared:["geometry-sha256 identity","draw method","shader defines","entire DrawBlock","entire FrameBlock","entire SkinBlock"],excludedChannels:[],idleTime:4.083333333333334,idleNativeStart:2.183333333333333,sampler:{matrixMax:0,normalMax:0,fieldMax:0,baseParts:7},sources:{work:{path:".local/avatar-computer-source/blue_beret/work-raw.json",sha256:"e528d835551e0faf7f8c5ffd445a17003c347debb103e77e35d83b9dd2598392"},idle:{path:".local/avatar-return-source/blue_beret/idle-raw.json",sha256:"bf0fd476dc6974678b2df560c662fc9b36068ffaaeb6ea303541a34187101000"},motion:{path:"runtime/avatar/assets/motion/blue_beret.json",sha256:"d62023e031e37f2bf1ed6b1ea49965c59abda1d7ea27cf1d0bde213009607cbe"},computer:{path:"runtime/avatar/assets/blue_beret/computer-motion.json",sha256:"3b3fe2c9eebd8dbb3dd44433c9e21c7110862fb80f5ee1ad1d05f7e2c3144389"}}},alfred:{nativeStart:3,nativeStop:5.216666666666667,nativeReturn:6.266666666666667,returnTime:3.2666666666666666,nativeEnd:10,exactTailFrames:225,previousNonmatchingTime:6.25,compared:["geometry-sha256 identity","draw method","shader defines","entire DrawBlock","entire FrameBlock","entire SkinBlock"],excludedChannels:[],idleTime:2.5833333333333335,idleNativeStart:3.683333333333333,sampler:{matrixMax:0,normalMax:0,fieldMax:0,baseParts:9},sources:{work:{path:".local/avatar-computer-source/alfred/work-raw.json",sha256:"9023bd872f0817a290ff29be4b983f3ebf123416bf456d629d7164c9cb0acc01"},idle:{path:".local/avatar-runtime-motion-actions/alfred/idle-raw.json",sha256:"239bbb065fd8f5481c2592f88eceb991b0f94c8c1ed0dcc73f5bd0ebd558b792"},motion:{path:"runtime/avatar/assets/motion/alfred.json",sha256:"97390b7bde431f42dd5d0fe2200afba81cc16de5f3757fef6f16c9377cece4d7"},computer:{path:"runtime/avatar/assets/alfred/computer-motion.json",sha256:"1f43a5a5209fe50f1eb56a4966d02ad06ead79b0ba2c6a03cd9bbad94b225232"}}},purple_heart:{nativeStart:3,nativeStop:5.216666666666667,nativeReturn:6.266666666666667,returnTime:3.2666666666666666,nativeEnd:10,exactTailFrames:225,previousNonmatchingTime:6.25,compared:["geometry-sha256 identity","draw method","shader defines","entire DrawBlock","entire FrameBlock","entire SkinBlock"],excludedChannels:[],idleTime:2.5833333333333335,idleNativeStart:3.683333333333333,sampler:{matrixMax:0,normalMax:0,fieldMax:0,baseParts:7},sources:{work:{path:".local/avatar-computer-source/purple_heart/work-raw.json",sha256:"febc9157e16fa79025d8e4c0c6119e81763670bf1f6fbfcc6f73166822728bb1"},idle:{path:".local/avatar-runtime-motion-actions/purple_heart/idle-raw.json",sha256:"c6ac8afc4e3c15de4531d6ae44b7d352f2c8dcbde628b2f8c689ff2a77dfcdf9"},motion:{path:"runtime/avatar/assets/motion/purple_heart.json",sha256:"bc112b89b31df40905f9c29e78f3f49c299e2be1e8ca1c6009e486a031528b45"},computer:{path:"runtime/avatar/assets/purple_heart/computer-motion.json",sha256:"b9ccd37d2c1cb9bcb6b9c54e366a5638b51614e6f54bb9af194b67b48499eb83"}}},lime_frog:{nativeStart:3,nativeStop:5.216666666666667,nativeReturn:6.266666666666667,returnTime:3.2666666666666666,nativeEnd:10,exactTailFrames:225,previousNonmatchingTime:6.25,compared:["geometry-sha256 identity","draw method","shader defines","entire DrawBlock","entire FrameBlock","entire SkinBlock"],excludedChannels:[],idleTime:2.5833333333333335,idleNativeStart:3.683333333333333,sampler:{matrixMax:0,normalMax:0,fieldMax:0,baseParts:8},sources:{work:{path:".local/avatar-computer-source/lime_frog/work-raw.json",sha256:"8bc0ef22272eda4f2af037edf98438be66f37d0da9ac61220af2b193ff47b1a2"},idle:{path:".local/avatar-runtime-motion-actions/lime_frog/idle-raw.json",sha256:"8fa85285775d5556d0f5ba94d19bb28cc0298f01c84eb0e4b311da64990844bb"},motion:{path:"runtime/avatar/assets/motion/lime_frog.json",sha256:"9887b3d29bc89c2359ac7d3b76ba29e3af5682d5d11323515c8ba46f321f4d79"},computer:{path:"runtime/avatar/assets/lime_frog/computer-motion.json",sha256:"fcae5c17ad61246972dc8ee687f18e07f92666513ef72558fee951ce2904ebfc"}}},coral_monocle:{nativeStart:3,nativeStop:5.216666666666667,nativeReturn:6.266666666666667,returnTime:3.2666666666666666,nativeEnd:10,exactTailFrames:225,previousNonmatchingTime:6.25,compared:["geometry-sha256 identity","draw method","shader defines","entire DrawBlock","entire FrameBlock","entire SkinBlock"],excludedChannels:[],idleTime:2.5833333333333335,idleNativeStart:3.683333333333333,sampler:{matrixMax:0,normalMax:0,fieldMax:0,baseParts:8},sources:{work:{path:".local/avatar-computer-source/coral_monocle/work-raw.json",sha256:"3b8217db1059da9c61e75f7c7f03453b3315b31d67379cde7b116dc425838740"},idle:{path:".local/avatar-runtime-motion-actions/coral_monocle/idle-raw.json",sha256:"65a8938bc8e4a2c38001e2057f24b06e0245c3f5dff4bf79c41efb5fe666a74c"},motion:{path:"runtime/avatar/assets/motion/coral_monocle.json",sha256:"654af990773962a866808cb8b831fb7e4c87d50ea7ef53455203534ead76c55c"},computer:{path:"runtime/avatar/assets/coral_monocle/computer-motion.json",sha256:"605815e4a8d5d4c9817a68158eb30e237466d7a899525fafeb3805a582f95af6"}}},gus:{nativeStart:3,nativeStop:5.216666666666667,nativeReturn:6.266666666666667,returnTime:3.2666666666666666,nativeEnd:10,exactTailFrames:225,previousNonmatchingTime:6.25,compared:["geometry-sha256 identity","draw method","shader defines","entire DrawBlock","entire FrameBlock","entire SkinBlock"],excludedChannels:[],idleTime:2.5833333333333335,idleNativeStart:3.683333333333333,sampler:{matrixMax:0,normalMax:0,fieldMax:0,baseParts:5},sources:{work:{path:".local/avatar-computer-source/gus/work-raw.json",sha256:"fe497560be31bcb34dbed0589adf23a75b08e30aaa5ae603c1ba0839442dd8b6"},idle:{path:".local/avatar-runtime-motion-actions/gus/idle-raw.json",sha256:"367484324cd18606d19080b0a8c399b4a9bca4edd7e5d02a0d5af75f2dcda02d"},motion:{path:"runtime/avatar/assets/motion/gus.json",sha256:"e0032cc30e1cc14cdbcdd203f64c12d96428a2a84237d372d48175c4c0cadcb0"},computer:{path:"runtime/avatar/assets/gus/computer-motion.json",sha256:"0db66ca70959fd582a79826311b79af263627c970959ee0f56be41d4dd3a5bed"}}},blue_spectacles:{nativeStart:3,nativeStop:5.216666666666667,nativeReturn:6.266666666666667,returnTime:3.2666666666666666,nativeEnd:10,exactTailFrames:225,previousNonmatchingTime:6.25,compared:["geometry-sha256 identity","draw method","shader defines","entire DrawBlock","entire FrameBlock","entire SkinBlock"],excludedChannels:[],idleTime:2.5833333333333335,idleNativeStart:3.683333333333333,sampler:{matrixMax:0,normalMax:0,fieldMax:0,baseParts:11},sources:{work:{path:".local/avatar-computer-source/blue_spectacles/work-raw.json",sha256:"64da7947bcdbb3b2c70fcf211dc6b7ac2a14551daa4f3e5067dee586882c101c"},idle:{path:".local/avatar-runtime-motion-actions/blue_spectacles/idle-raw.json",sha256:"36c91794e7dae8fb8206b0c324e808c2857921b5efaa1fa15f4ae6ab18d95a3d"},motion:{path:"runtime/avatar/assets/motion/blue_spectacles.json",sha256:"fd690c0731b5356c243229ca803de89bd81e09aa4f269bddf1f93b062fe36970"},computer:{path:"runtime/avatar/assets/blue_spectacles/computer-motion.json",sha256:"85d740ad5b43cb32770fbfc3e4e982099232c7b5fdb5c50a80dacd0119d8954e"}}},lime_headphones:{nativeStart:3,nativeStop:5.216666666666667,nativeReturn:6.266666666666667,returnTime:3.2666666666666666,nativeEnd:10,exactTailFrames:225,previousNonmatchingTime:6.25,compared:["geometry-sha256 identity","draw method","shader defines","entire DrawBlock","entire FrameBlock","entire SkinBlock"],excludedChannels:[],idleTime:2.5833333333333335,idleNativeStart:3.683333333333333,sampler:{matrixMax:0,normalMax:0,fieldMax:0,baseParts:9},sources:{work:{path:".local/avatar-computer-source/lime_headphones/work-raw.json",sha256:"ffaefea0a5352ee9d88e88c7476cab5a395776f4a50cae999756ff9401aa14d6"},idle:{path:".local/avatar-runtime-motion-actions/lime_headphones/idle-raw.json",sha256:"e1ad361161685f4247714b9231ef5dbbd7d1839c40995b8889dd4825da5575cd"},motion:{path:"runtime/avatar/assets/motion/lime_headphones.json",sha256:"1211c5167eca9a1e01bb282f408adbccc754dc53783baefc1d92727ee33e4c4d"},computer:{path:"runtime/avatar/assets/lime_headphones/computer-motion.json",sha256:"92da9e788e108a5849cbff9cc8a6e0b233409771bbed11fd8476fe2938a4564b"}}}},wd={presets:Sd};function Md(i,e,t){const n=e.clips.idle;if(e.schema!=="bloom.authored-hidden-eye-blink"||e.version!==1||e.preset!==t||n.duration!==i.duration||n.times.length!==i.times.length||n.samples.length!==i.times.length||!n.times.every((s,o)=>s===i.times[o])||!n.samples.every(s=>Number.isFinite(s)&&s>=0&&s<=1))throw Error("Eye blink must match the observed preset and motion clock");const a=i.parts.find(s=>s.id==="mesh:0");if(!a||a.fields.eyeBlink)throw Error("Eye blink requires an unmodified body channel");const r=new Float64Array(n.samples.length*4);n.samples.forEach((s,o)=>{r[o*4]=s}),a.fields.eyeBlink={samples:r}}function Ed(i,e){if(!Number.isFinite(e.entryTime)||e.entryTime<0||!Number.isFinite(e.coreSeconds)||e.coreSeconds<=.18||e.entryTime+e.coreSeconds>=i.duration||e.duration!==i.duration||e.times.length!==i.times.length||!e.times.every((n,a)=>n===i.times[a])||e.translation.length!==i.times.length*4||e.scale.length!==i.times.length*4||!e.translation.every(Number.isFinite)||!e.scale.every((n,a)=>Number.isFinite(n)&&(a%4===3||n>0)))throw Error("Reaction gaze must match the observed motion clock and neutral frame");if(e.eyeBlink&&(e.eyeBlink.length!==i.times.length*4||!e.eyeBlink.every(n=>Number.isFinite(n)&&n>=0&&n<=1)))throw Error("Reaction blink must match the observed motion clock");const t=i.parts.find(n=>n.id==="mesh:0");if(!t||t.fields.gazeNeutralTranslation||t.fields.gazeNeutralScale||t.fields.eyeBlink)throw Error("Reaction gaze requires an unmodified body channel");return t.fields.gazeNeutralTranslation={samples:e.translation},t.fields.gazeNeutralScale={samples:e.scale},e.eyeBlink&&(t.fields.eyeBlink={samples:e.eyeBlink}),{entryTime:e.entryTime,coreSeconds:e.coreSeconds}}const Rd=Object.assign({"./assets/packed-motion/alfred.bin":ad,"./assets/packed-motion/blue_beret.bin":rd,"./assets/packed-motion/blue_spectacles.bin":sd,"./assets/packed-motion/coral_monocle.bin":od,"./assets/packed-motion/gus.bin":ld,"./assets/packed-motion/lime_frog.bin":cd,"./assets/packed-motion/lime_headphones.bin":ud,"./assets/packed-motion/purple_heart.bin":hd}),Td=Object.assign({"./assets/packed-motion/alfred.bin":dd,"./assets/packed-motion/blue_beret.bin":fd,"./assets/packed-motion/blue_spectacles.bin":pd,"./assets/packed-motion/coral_monocle.bin":md,"./assets/packed-motion/gus.bin":vd,"./assets/packed-motion/lime_frog.bin":gd,"./assets/packed-motion/lime_headphones.bin":_d,"./assets/packed-motion/purple_heart.bin":yd}),Ga=new Map,Va=new Map;async function Xs(i,e){const t=e[`./assets/packed-motion/${i}.bin`];if(!t)throw Error(`Missing packed avatar motion: ${i}`);const n=await fetch(t);if(!n.ok)throw Error(`Avatar motion failed (${n.status}): ${i}`);return cr(await n.arrayBuffer())}function Ad(i,e=!0){let t=Ga.get(i);if(t||(t=Cd(i).catch(a=>{throw Ga.delete(i),a}),Ga.set(i,t)),!e)return t;let n=Va.get(i);return n||(n=Promise.all([t,Xs(i,Td)]).then(([a,r])=>Ld(i,a,r)).catch(a=>{throw Va.delete(i),a}),Va.set(i,n)),n}const la=i=>({...i,parts:i.parts.filter(e=>!e.id.startsWith("fur:"))});async function Cd(i){const e=await Xs(i,Rd);if(e.schema!=="bloom.avatar.motion-bundle"||e.version!==1||e.preset!==i)throw Error(`Avatar motion bundle identity mismatch: ${i}`);const{motion:t}=e;if(t.preset!==i)throw Error(`Avatar motion identity mismatch: ${i}`);if(i==="lime_headphones"){if(!e.eyeBlink)throw Error("Missing Headphones idle blink");Md(t.clips.idle,e.eyeBlink,i)}if(i!=="blue_beret"&&(!e.reactionGaze||!t.clips.reaction))throw Error(`Missing reaction gaze frame: ${i}`);if(i==="lime_headphones"&&!e.reactionGaze?.eyeBlink)throw Error("Missing Headphones reaction blink");const n=e.reactionGaze&&t.clips.reaction?Ed(t.clips.reaction,e.reactionGaze):void 0,a=t.reactionEnd==="return-idle"&&t.evidence?t.evidence.reaction.nativeEnd-t.evidence.idle.nativeStart:void 0;if(t.reactionEnd==="return-idle"&&(!t.clips.reaction||a===void 0||!Number.isFinite(a)||a<0||a>=t.clips.idle.duration))throw Error(`Invalid reaction return phase: ${i}`);return{idle:new Pn(la(t.clips.idle)),reaction:t.clips.reaction?new Pn(la(t.clips.reaction)):void 0,reactionReturnTime:a,reactionGaze:n}}function Ld(i,e,t){const n=t.computer;if(t.schema!=="bloom.avatar.motion-bundle"||t.version!==1||t.preset!==i||n?.schema!=="bloom.avatar.computer-motion"||n.preset!==i)throw Error(`Computer motion identity mismatch: ${i}`);const a=t.computerLoop;if(!a||a.schema!=="bloom.avatar.computer-loop"||a.version!==1||a.preset!==i)throw Error(`Missing or invalid Computer loop: ${i}`);const r=new bd(la(a.clip),a.nativeStart,a.loopStart,a.period),s=new Pn(la(n.clip)),o=wd.presets[i];if(!o)throw Error(`Missing verified Computer return: ${i}`);if(!Number.isFinite(o.returnTime)||!Number.isFinite(o.idleTime)||o.returnTime<=0||o.returnTime>n.clip.duration||o.idleTime<0||o.idleTime>=e.idle.clip.duration)throw Error(`Invalid Computer return phase: ${i}`);return{...e,work:s,workLoop:r,workReturn:{time:o.returnTime,idleTime:o.idleTime}}}function js(i,e){const t=i.getAttribute("position"),n=i.getAttribute("normal"),a=i.getIndex(),r=new O().fromArray(e),s=new It,o=new O,c=new O,l=new O,h=new O,d=new O;let u=1/0;const f=a?.count??t.count;for(let v=0;v+2<f;v+=3){const g=[0,1,2].map(m=>a?a.getX(v+m):v+m);if(s.a.fromBufferAttribute(t,g[0]),s.b.fromBufferAttribute(t,g[1]),s.c.fromBufferAttribute(t,g[2]),s.getNormal(l),l.lengthSq()===0)continue;s.closestPointToPoint(r,o);const p=o.distanceToSquared(r);if(!(p>=u)){if(n){s.getBarycoord(o,c),l.set(0,0,0);for(let m=0;m<3;m++)l.addScaledVector(new O().fromBufferAttribute(n,g[m]),c.getComponent(m));l.lengthSq()<1e-20&&s.getNormal(l)}u=p,h.copy(o),d.copy(l).normalize()}}if(!Number.isFinite(u))throw Error("Tuft requires a nondegenerate body surface");return{point:h.toArray(),normal:d.toArray()}}function qs(i,e){const t=e.find(m=>!m.fur),n=i.find(m=>!m.fur);if(!t?.attachmentPivot||!n)return;const a=new O().fromArray(t.attachmentPivot),r=new O().fromArray(js(n.geometry,a.toArray()).normal),s=t.bounds.max[1]-t.bounds.min[1],o=t.bounds.max[0]-t.bounds.min[0];if(!(s>0&&o>0)||!Number.isFinite(s+o)||r.lengthSq()===0)throw Error("Invalid tuft attachment dimensions");const c=o*.48,l=s*.08,h=s*.1,d=s*.28,u=c*c,f=m=>{const M=m.clone().sub(a),A=Math.max(0,1-M.lengthSq()/u);return{value:l*A*A*A,gradient:M.multiplyScalar(-6*l*A*A/u)}},v=(m,M)=>{if(M)return f(m);const A=m.clone().sub(a).dot(r),w=Math.max(0,Math.min(1,A/d)),x=w*w*w*(10+w*(-15+6*w)),S=A>0&&A<d?30*w*w*(1-w)*(1-w)/d:0;return{value:-h*(1-x),gradient:r.clone().multiplyScalar(h*S)}},g=(m,M)=>m.clone().addScaledVector(r,v(m,M).value),p=(m,M,A)=>{const{gradient:w}=v(M,A);if(w.lengthSq()===0)return m;const x=1+w.dot(r);if(!(x>1e-8))throw Error("Folded tuft attachment");return m.clone().addScaledVector(w,-r.dot(m)/x).normalize()};for(const m of[...i,...e]){const M=m.category==="body",A=m.geometry,w=A.getAttribute("position"),x=(E,y)=>new O().fromBufferAttribute(A.getAttribute(E),y),S=(E,y,R)=>A.getAttribute(E).setXYZ(y,R.x,R.y,R.z);for(let E=0;E<w.count;E++){const y=x("position",E),R=!m.fur&&A.hasAttribute("delta0")?y.clone().add(x("delta0",E)):y,D=!m.fur&&A.hasAttribute("delta1")?y.clone().add(x("delta1",E)):y;if(v(y,M).value===0&&v(R,M).value===0&&v(D,M).value===0)continue;const P=g(y,M);if(m.fur){const U=v(y,M).gradient,L=p(x("normal",E),y,M),C=x("normal0",E);if(C.addScaledVector(r,U.dot(C)),C.addScaledVector(L,-L.dot(C)).normalize(),S("normal",E,L),S("normal0",E,C),A.hasAttribute("delta1")){const B=x("delta1",E);B.addScaledVector(r,U.dot(B)),S("delta1",E,B)}}else{A.hasAttribute("delta0")&&S("delta0",E,g(R,M).sub(P)),A.hasAttribute("delta1")&&S("delta1",E,g(D,M).sub(P));for(const[L,C]of[["normal",y],["normal0",R],["normal1",D]])A.hasAttribute(L)&&S(L,E,p(x(L,E),C,M));const U=A.getAttribute("paletteGeometry");if(U){const L=(m.fields.paletteReference?.[0]??0)>.5?D:y,C=p(new O(U.getY(E),U.getZ(E),U.getW(E)),L,M);U.setY(E,C.x),U.setZ(E,C.y),U.setW(E,C.z)}}S("position",E,P)}for(const E of Object.values(A.attributes))E.needsUpdate=!0;A.computeBoundingBox(),A.computeBoundingSphere(),m.bounds={min:A.boundingBox.min.toArray(),max:A.boundingBox.max.toArray()}}}const ps=new WeakMap;function Pd(i){const e=new Map,t=ps.get(i);if(t)return t;const n=i.filter(s=>s.id===0&&!s.activity),a=i.filter(s=>s.attachment==="three_lobe"&&!s.activity);if(!n.some(s=>!s.fur)||!a.some(s=>!s.fur))return e;const r=[...n,...a].map(s=>{const o=s.geometry.clone();return o.computeBoundingBox(),{...s,geometry:o,bounds:{min:o.boundingBox.min.toArray(),max:o.boundingBox.max.toArray()},category:s.id===0?"body":"accessory",selection:s.id===0?"":"three_lobe",pivot:[0,0,0]}});try{const s=r.filter(u=>u.category==="body"),o=r.filter(u=>u.category==="accessory"),c=o.find(u=>!u.fur),l=s.find(u=>!u.fur),h=[0,1,2].map(u=>(c.bounds.min[u]+c.bounds.max[u])/2),d=js(l.geometry,h).point;for(const u of o)u.attachmentPivot=d,e.set(u.id,d.slice());qs(s,o);for(let u=0;u<r.length;u++){const f=[...n,...a][u],v=f.geometry;f.geometry=r[u].geometry,v.dispose()}return ps.set(i,e),e}catch(s){for(const o of r)o.geometry.dispose();throw s}}function Ys(i,e,t){if(i?.pendingStart){const{pendingStart:s,...o}=i;return{...o,started:t}}if(!i||i.held!==void 0||i.kind==="idle"||i.kind==="work"&&i.continuous)return i;const n=i.kind==="work"?e.workReturn?.time:e.reaction?.clip.duration;if(n===void 0||t<i.started+n)return i;if(i.kind==="work"&&(i.remainingCycles??1)>1&&n>0){const s=Math.min(i.remainingCycles,Math.floor((t-i.started)/n));if(s<i.remainingCycles)return{...i,started:i.started+s*n,remainingCycles:i.remainingCycles-s};i={...i,started:i.started+(i.remainingCycles-1)*n,remainingCycles:1}}const a=i.started+n;if(i.kind==="reaction"&&i.queuedReaction)return Ys({kind:"reaction",started:a},e,t);const r=i.kind==="work"?e.workReturn?.idleTime:e.reactionReturnTime;return r===void 0?i:{kind:"idle",started:a-r}}const Dd=`precision highp float;
out vec2 texCoord;
void main() {
    vec2 p = vec2((gl_VertexID << 1) & 2,gl_VertexID & 2);
    gl_Position = vec4(p*2.0-1.0,0.0,1.0);
    texCoord = p;
}
`,Ud=`precision highp float;
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
`;class Id{constructor(e,t){this.renderer=e,this.scene=new Ka,this.camera=new or,this.geometry=new Yt,this.width=0,this.height=0,this.disposed=!1,this.frame=Object.fromEntries(Object.entries(t).map(([r,s])=>{if(![4,16].includes(s.length)||!s.every(Number.isFinite))throw new Error(`Invalid authored AO frame field: ${r}`);return[r,s.length===16?new pe().fromArray(s):new nt().fromArray(s)]}));for(const r of["viewProjection","inverseViewProjection"])if(!(this.frame[r]instanceof pe))throw new Error(`Missing authored AO matrix: ${r}`);for(const r of["viewport","cameraPosition","effects"])if(!(this.frame[r]instanceof nt))throw new Error(`Missing authored AO vector: ${r}`);if(this.frame.cameraPosition.w!==0)throw new Error("AuthoredOcclusion requires an orthographic scene");this.geometry.setAttribute("position",new qt(new Float32Array(9),3)),this.geometry.setDrawRange(0,3);const n=()=>new Lt(1,1,{format:1028,type:1009,minFilter:1003,magFilter:1003,wrapS:1001,wrapT:1001,depthBuffer:!1,stencilBuffer:!1,generateMipmaps:!1,colorSpace:"",samples:0});this.sampled=n(),this.resolved=n();const a=r=>new _i({glslVersion:ti,vertexShader:Dd,fragmentShader:Ud,defines:{[r]:1},uniforms:{f:{value:this.frame},cameraDepth:{value:null},ambientOcclusion:{value:this.sampled.texture},avatarCameras:{value:null},avatarGrid:{value:new nt}},depthTest:!1,depthWrite:!1,blending:0,toneMapped:!1});this.sampleMaterial=a("ORBIT_ORTHOGRAPHIC_AO"),this.sampleMaterial.uniforms.ambientOcclusion.value=null,this.resolveMaterial=a("ORBIT_RESOLVE_AO"),this.mesh=new Ft(this.geometry,this.sampleMaterial),this.mesh.frustumCulled=!1,this.scene.add(this.mesh)}resize(e,t){if(this.disposed)throw new Error("AuthoredOcclusion is disposed");if(!Number.isInteger(e)||!Number.isInteger(t)||e<1||t<1)throw new Error("Authored AO dimensions must be positive physical pixel integers");this.width===e&&this.height===t||(this.width=e,this.height=t,this.sampled.setSize(Math.max(1,Math.ceil(e/2)),Math.max(1,Math.ceil(t/2))),this.resolved.setSize(e,t),this.frame.viewport.set(e,t,1/e,1/t))}setAvatars(e,t,n,a,r){for(const s of[this.sampleMaterial,this.resolveMaterial])s.uniforms.avatarCameras.value=e,s.uniforms.avatarGrid.value.set(t,n,a,r)}render(e,t,n,a){if(this.resize(n,a),!t.elements.every(Number.isFinite)||Math.abs(t.determinant())<1e-15)throw new Error("Authored AO requires a finite invertible view-projection matrix");const r=t.elements;if(r[3]!==0||r[7]!==0||r[11]!==0||r[15]!==1)throw new Error("Authored AO requires an orthographic view-projection matrix");this.frame.viewProjection.copy(t),this.frame.inverseViewProjection.copy(t).invert(),this.sampleMaterial.uniforms.cameraDepth.value=e,this.resolveMaterial.uniforms.cameraDepth.value=e;const s=this.renderer,o=s.getRenderTarget(),c=s.getActiveCubeFace(),l=s.getActiveMipmapLevel(),h=s.autoClear,d=s.xr.enabled;try{s.autoClear=!1,s.xr.enabled=!1,this.mesh.material=this.sampleMaterial,s.setRenderTarget(this.sampled),s.render(this.scene,this.camera),this.mesh.material=this.resolveMaterial,s.setRenderTarget(this.resolved),s.render(this.scene,this.camera)}finally{s.setRenderTarget(o,c,l),s.autoClear=h,s.xr.enabled=d}return this.resolved.texture}dispose(){this.disposed||(this.disposed=!0,this.geometry.dispose(),this.sampleMaterial.dispose(),this.resolveMaterial.dispose(),this.sampled.dispose(),this.resolved.dispose(),this.scene.clear())}}class Fd{constructor(){this.active=!1,this.yaw=0,this.pitch=0,this.startX=0,this.startY=0,this.released=0,this.releaseYaw=0,this.releasePitch=0}get moving(){return!this.active&&Math.max(Math.abs(this.yaw),Math.abs(this.pitch))>=1e-12}down(e,t,n){this.sample(n),this.startX=Math.fround(e),this.startY=Math.fround(t),this.active=!0}move(e,t){if(!this.active)return;const n=Math.fround(Math.fround(e)-this.startX),a=Math.fround(Math.fround(t)-this.startY);this.yaw=Math.fround(Math.max(-.32,Math.min(.32,Math.fround(n*Math.fround(1.7))))),this.pitch=Math.fround(Math.max(-.22,Math.min(.22,Math.fround(a*1.5))))}up(e){this.active&&(this.active=!1,this.released=e,this.releaseYaw=this.yaw,this.releasePitch=this.pitch)}sample(e){if(this.active||!this.releaseYaw&&!this.releasePitch)return;const t=Math.pow(.88,Math.max(0,e-this.released)*60);this.yaw=this.releaseYaw*t,this.pitch=this.releasePitch*t,this.moving||(this.yaw=this.pitch=this.releaseYaw=this.releasePitch=0)}reset(){this.active=!1,this.yaw=this.pitch=this.releaseYaw=this.releasePitch=0}}class Nd{constructor(){this.yaw=0,this.pitch=0,this.yawVelocity=0,this.pitchVelocity=0,this.targetYaw=0,this.targetPitch=0}get moving(){return Math.max(Math.abs(this.yaw-this.targetYaw),Math.abs(this.pitch-this.targetPitch),Math.abs(this.yawVelocity),Math.abs(this.pitchVelocity))>=1e-12}point(e,t){if(!Number.isFinite(e)||!Number.isFinite(t))throw new Error("Invalid gaze coordinates");this.targetYaw=(Math.max(0,Math.min(1,Math.fround(e)))-.5)*.11,this.targetPitch=(Math.max(0,Math.min(1,Math.fround(t)))-.5)*.07}advance(e){if(!Number.isFinite(e)||e<0)throw new Error("Invalid gaze interval");if(!this.moving)return;const t=Math.exp(-22*e),n=this.yaw-this.targetYaw,a=this.pitch-this.targetPitch,r=this.yawVelocity+22*n,s=this.pitchVelocity+22*a;this.yaw=this.targetYaw+(n+r*e)*t,this.pitch=this.targetPitch+(a+s*e)*t,this.yawVelocity=(this.yawVelocity-22*r*e)*t,this.pitchVelocity=(this.pitchVelocity-22*s*e)*t,this.moving||(this.yaw=this.targetYaw,this.pitch=this.targetPitch,this.yawVelocity=this.pitchVelocity=0)}reset(){this.yaw=this.pitch=this.yawVelocity=this.pitchVelocity=0,this.targetYaw=this.targetPitch=0}}const ms=i=>{const e=Math.max(0,Math.min(1,i));return e*e*e*(10-15*e+6*e*e)};function Bd(i,e){if(!Number.isFinite(i)||!Number.isFinite(e)||e<.18)throw new Error("Invalid reaction gaze interval");return{frozen:i<e,strength:i<e?1-ms(i/.18):ms((i-e)/.18)}}function Ha(i,e=!1){for(let t=0;t<3;t++){const n=i[t];if(typeof n!="number"||!Number.isFinite(n)||e&&n<=0)throw new Error("Invalid reaction neutral frame")}}class Od{constructor(){this.basis=new pe().makeRotationY(8*Math.PI/180),this.inverseBasis=this.basis.clone().invert(),this.scratch=new pe,this.relativeEye=new pe}writeBodyCorrection(e,t,n,a,r){if(Ha(n),!Number.isFinite(e)||!Number.isFinite(t))throw new Error("Invalid reaction gaze angles");r.copy(this.basis).multiply(this.scratch.makeRotationY(e)).multiply(this.scratch.makeRotationX(t)).multiply(this.inverseBasis);const s=n[0],o=n[1],c=n[2];a.makeTranslation(s,o,c).multiply(r).multiply(this.scratch.makeTranslation(-s,-o,-c))}writeNeutralFrame(e,t,n){Ha(e),Ha(t,!0),n.copy(this.basis).multiply(this.scratch.makeScale(t[0],t[1],t[2])),n.setPosition(e[0],e[1],e[2])}writeEyeCorrection(e,t,n,a,r,s,o,c,l){this.writeNeutralFrame(r,s,this.relativeEye),this.relativeEye.invert().multiply(o),e.writeBeforePoseCorrection(t,n,this.relativeEye,c,l,a)}}const yi=i=>Math.max(0,Math.min(1,i)),zd=i=>i*i*(3-2*i),kd=i=>.5-Math.sin(Math.asin(1-2*yi(i))/3);function Gd(i,e){const t=i[2],n=i[3];if(typeof t!="number"||typeof n!="number"||!Number.isFinite(t)||!Number.isFinite(n))throw new Error("Invalid eye morph channels");const a=e==="integrated"?kd:yi;return n>0?(1+a(n))/2:a(t)/2}class vs{constructor(){this.x=0,this.y=0,this.velocityX=0,this.velocityY=0,this.targetX=0,this.targetY=0,this.inverseRelativePose=new pe}get moving(){return Math.max(Math.abs(this.x-this.targetX),Math.abs(this.y-this.targetY),Math.abs(this.velocityX),Math.abs(this.velocityY))>=1e-12}point(e,t){if(!Number.isFinite(e)||!Number.isFinite(t))throw new Error("Invalid eye coordinates");this.targetX=yi(Math.fround(e))-.5,this.targetY=yi(Math.fround(t))-.5}advance(e){if(!Number.isFinite(e)||e<0)throw new Error("Invalid eye interval");if(!this.moving)return;const t=Math.exp(-55*e),n=this.x-this.targetX,a=this.y-this.targetY,r=this.velocityX+55*n,s=this.velocityY+55*a;this.x=this.targetX+(n+r*e)*t,this.y=this.targetY+(a+s*e)*t,this.velocityX=(this.velocityX-55*r*e)*t,this.velocityY=(this.velocityY-55*s*e)*t,this.moving||(this.x=this.targetX,this.y=this.targetY,this.velocityX=this.velocityY=0)}writeCorrection(e,t,n,a,r=1){if(!Number.isFinite(t)||t<0||t>1)throw new Error("A measured eye blink closure in [0, 1] is required");if(!Number.isFinite(r)||r<0||r>1)throw new Error("Eye transition strength must be in [0, 1]");const s=(1-zd(yi(t*e.blinkMultiplier)))*r;if(s===0||this.x===0&&this.y===0){n.identity(),a.identity();return}const o=this.x*e.angularGain[0]*s,c=this.y*e.angularGain[1]*s,l=Math.cos(o),h=Math.sin(o),d=Math.cos(c),u=Math.sin(c),f=this.x*e.halfSize[0]*e.translationGain[0]*s,v=this.y*e.halfSize[1]*e.translationGain[1]*s,[g,p,m]=e.anchor;if(e.surface){const[M,A]=e.surface.curvature,[w,x]=e.surface.slope,S=e.surface.crossCurvature??0,E=h*u,y=l*(w-M*f-S*v)-w,R=E*(w-M*f-S*v)+d*(x-A*v-S*f)-x,D=w*f+x*v-(M*f*f+A*v*v+2*S*f*v)/2;n.set(l,E,0,g*(1-l)-p*E+f,0,d,0,p*(1-d)+v,y,R,1,D-y*g-R*p,0,0,0,1),a.copy(n).setPosition(0,0,0).invert().transpose();return}n.set(l,h*u,h*d,g*(1-l)-p*h*u-m*h*d+f,0,d,-u,p*(1-d)+m*u+v,0,0,1,0,0,0,0,1),a.copy(n).setPosition(0,0,0).invert().transpose()}writeBeforePoseCorrection(e,t,n,a,r,s=1){if(!Number.isFinite(n.determinant())||Math.abs(n.determinant())<1e-12)throw new Error("Eye expression pose must be invertible");this.writeCorrection(e,t,a,r,s),this.inverseRelativePose.copy(n).invert(),a.premultiply(this.inverseRelativePose).multiply(n),r.copy(a).setPosition(0,0,0).invert().transpose()}reset(){this.x=this.y=this.velocityX=this.velocityY=this.targetX=this.targetY=0}}const Vd={lime_frog:{0:{1:{anchor:[-.46000000834465027,.4899999797344208,.5120980739593506],halfSize:[.17200002074241638,.18799999356269836],angularGain:[.042,.028],translationGain:[.07,-.042],blink:"integrated",blinkMultiplier:1},2:{anchor:[-.46000000834465027,.4899999797344208,.5120980739593506],halfSize:[.17200002074241638,.18799999356269836],angularGain:[.042,.028],translationGain:[.07,-.042],blink:"integrated",blinkMultiplier:1},3:{anchor:[.46000000834465027,.4899999797344208,.5121124386787415],halfSize:[.17200002074241638,.18799999356269836],angularGain:[.042,.028],translationGain:[.07,-.042],blink:"integrated",blinkMultiplier:1},4:{anchor:[.46000000834465027,.4899999797344208,.5121124386787415],halfSize:[.17200002074241638,.18799999356269836],angularGain:[.042,.028],translationGain:[.07,-.042],blink:"integrated",blinkMultiplier:1}},1:{1:{anchor:[-.46000000834465027,.4899999797344208,.5120980739593506],halfSize:[.17200002074241638,.18799999356269836],angularGain:[.042,.028],translationGain:[.07,-.042],blink:"integrated",blinkMultiplier:1},2:{anchor:[-.46000000834465027,.4899999797344208,.5120980739593506],halfSize:[.17200002074241638,.18799999356269836],angularGain:[.042,.028],translationGain:[.07,-.042],blink:"integrated",blinkMultiplier:1},3:{anchor:[.46000000834465027,.4899999797344208,.5121124386787415],halfSize:[.17200002074241638,.18799999356269836],angularGain:[.042,.028],translationGain:[.07,-.042],blink:"integrated",blinkMultiplier:1},4:{anchor:[.46000000834465027,.4899999797344208,.5121124386787415],halfSize:[.17200002074241638,.18799999356269836],angularGain:[.042,.028],translationGain:[.07,-.042],blink:"integrated",blinkMultiplier:1}}},blue_spectacles:{0:{1:{anchor:[-.3401760756969452,.03866931423544884,.5094621181488037],halfSize:[.1905951201915741,.1905951052904129],angularGain:[.042,.028],translationGain:[.07,-.042],blink:"integrated",blinkMultiplier:1},2:{anchor:[-.3401760756969452,.03866931423544884,.5094621181488037],halfSize:[.1905951201915741,.1905951052904129],angularGain:[.042,.028],translationGain:[.07,-.042],blink:"integrated",blinkMultiplier:1},3:{anchor:[.33213406801223755,.03866931423544884,.517117977142334],halfSize:[.1905950903892517,.1905951052904129],angularGain:[.042,.028],translationGain:[.07,-.042],blink:"integrated",blinkMultiplier:1},4:{anchor:[.33213406801223755,.03866931423544884,.517117977142334],halfSize:[.1905950903892517,.1905951052904129],angularGain:[.042,.028],translationGain:[.07,-.042],blink:"integrated",blinkMultiplier:1}},1:{1:{anchor:[-.3401760756969452,.03866931423544884,.5094621181488037],halfSize:[.1905951201915741,.1905951052904129],angularGain:[.042,.028],translationGain:[.07,-.042],blink:"integrated",blinkMultiplier:1},2:{anchor:[-.3401760756969452,.03866931423544884,.5094621181488037],halfSize:[.1905951201915741,.1905951052904129],angularGain:[.042,.028],translationGain:[.07,-.042],blink:"integrated",blinkMultiplier:1},3:{anchor:[.33213406801223755,.03866931423544884,.517117977142334],halfSize:[.1905950903892517,.1905951052904129],angularGain:[.042,.028],translationGain:[.07,-.042],blink:"integrated",blinkMultiplier:1},4:{anchor:[.33213406801223755,.03866931423544884,.517117977142334],halfSize:[.1905950903892517,.1905951052904129],angularGain:[.042,.028],translationGain:[.07,-.042],blink:"integrated",blinkMultiplier:1}}},lime_headphones:{0:{1:{anchor:[-.3329812288284302,-.07841390371322632,.49655792117118835],halfSize:[.2206026315689087,.19739124178886414],angularGain:[.238,.112],translationGain:[.252,-.14],blink:"external",blinkMultiplier:1},2:{anchor:[.23228435218334198,-.0753689706325531,.5453407764434814],halfSize:[.2180550992488861,.19582310318946838],angularGain:[.238,.112],translationGain:[.252,-.14],blink:"external",blinkMultiplier:1}},1:{1:{anchor:[-.3329812288284302,-.07841390371322632,.49655792117118835],halfSize:[.2204982340335846,.1972978264093399],angularGain:[.238,.112],translationGain:[.252,-.14],blink:"external",blinkMultiplier:1},2:{anchor:[.23228435218334198,-.0753689706325531,.5453407764434814],halfSize:[.2180555760860443,.1958235502243042],angularGain:[.238,.112],translationGain:[.252,-.14],blink:"external",blinkMultiplier:1}}},coral_monocle:{0:{3:{anchor:[.1820000261068344,.30000004172325134,.6229034066200256],halfSize:[.13699999451637268,.13899999856948853],angularGain:[0,0],translationGain:[.098,-.035],blink:"linear",blinkMultiplier:6},4:{anchor:[-.2750000059604645,.30000004172325134,.6066563725471497],halfSize:[.13699999451637268,.13899999856948853],angularGain:[0,0],translationGain:[.098,-.035],blink:"linear",blinkMultiplier:6}},1:{3:{anchor:[.1820000261068344,.30000004172325134,.6229034066200256],halfSize:[.13699999451637268,.13899999856948853],angularGain:[0,0],translationGain:[.098,-.035],blink:"linear",blinkMultiplier:6},4:{anchor:[-.2750000059604645,.30000004172325134,.6066563725471497],halfSize:[.13699999451637268,.13899999856948853],angularGain:[0,0],translationGain:[.098,-.035],blink:"linear",blinkMultiplier:6}}}},Hd={presets:Vd},gs=`precision highp float;
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
`,Wd=`precision highp float;
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
`,Xd={viewProjection:[.5494505167007446,0,0,0,0,.5494505167007446,0,0,0,0,-.10050251334905624,0,0,0,-.6080402135848999,1],inverseViewProjection:[1.8200000524520874,0,0,0,0,1.8200000524520874,0,0,0,0,-9.949999809265137,0,0,0,-6.050000190734863,1],lightViewProjection:[.35728874802589417,.12126781046390533,.08570991456508636,0,0,.3435921370983124,-.11427989602088928,0,.21437321603298187,-.20211303234100342,-.142849862575531,0,4967053612858763e-23,0,-.010100960731506348,1],cameraPosition:[0,0,4,0],keyDirectionIntensity:[-.6000000238418579,.800000011920929,1,74e3],fillDirectionIntensity:[.8500000238418579,.20000000298023224,.699999988079071,12e3],ambientExposure:[45e3,2604166729724966e-20,.6399999856948853,.699999988079071],viewport:[320,320,.0031250000465661287,.0031250000465661287],effects:[0,1,1.100000023841858,.2199999988079071],studioParameters:[1,1.0499999523162842,0,.18000000715255737],errorBodyBounds:[0,0,0,0],characterStudio:[.5,2,1,.6499999761581421],shadowParameters:[.3499999940395355,4.800000190734863,9.899999618530273,.6499999761581421],searchLensCenterRadius:[0,0,0,0],searchLensRight:[0,0,0,0],searchLensUp:[0,0,0,0],searchLensStyle:[0,0,0,0],searchLensOptics:[0,0,0,0],thinkingLightPositionStrength:[0,0,0,0],thinkingLightColorRadius:[0,0,0,0]},jd=[{name:"furPile",id:4,width:512,height:512,format:6408,type:5121,components:4,parameters:{10240:9729,10241:9987,10242:10497,10243:10497},file:"furPile.bin",sha256:"f06727e864bf6d3f422aa01ad7aec27775801452260cd9e79ce39ab4bfe8ffa3",sourceFile:"texture-4.bin"},{name:"furCards",id:5,width:512,height:512,format:6408,type:5121,components:4,parameters:{10240:9729,10241:9987,10242:33071,10243:33071},file:"furCards.bin",sha256:"49d575ae2830f78b29c449131e33dd7929dfaa68246cfd6cc7c4868a179e1004",sourceFile:"texture-5.bin"},{name:"furLTC1",id:6,width:64,height:64,format:6408,type:5126,components:4,parameters:{10240:9729,10241:9729,10242:33071,10243:33071},file:"furLTC1.bin",sha256:"cf5cf21e5c112d2095c7e2418cb0a1ac54636e275d73e42f3453646c67f26814",sourceFile:"texture-6.bin"},{name:"furLTC2",id:7,width:64,height:64,format:6408,type:5126,components:4,parameters:{10240:9729,10241:9729,10242:33071,10243:33071},file:"furLTC2.bin",sha256:"3b1b09080b26104498db277c14fc1733786465c6958e7a8403d688b1e24c2ff5",sourceFile:"texture-7.bin"}],Zi={frame:Xd,sourceTextures:jd},qd=""+new URL("../assets/computer-geometry-uSZzT583.bin",import.meta.url).href,Yd=""+new URL("../assets/computer-geometry-DTkXbiN0.json",import.meta.url).href,$d=""+new URL("../assets/computer-material-vpK-WaF1.json",import.meta.url).href,Kd=new URL("../assets/geometry-low-ByQxB_nR.bin",import.meta.url).href,Zd=new URL("../assets/geometry-low-4Cm496Mv.json",import.meta.url).href,Jd=new URL("../assets/geometry-DMvQoOl2.bin",import.meta.url).href,Qd=new URL("../assets/geometry-CthS61Br.json",import.meta.url).href,ef=""+new URL("../assets/material-C7e3KRNm.json",import.meta.url).href,tf=""+new URL("../assets/reference-wYoveiOB.png",import.meta.url).href,nf=""+new URL("../assets/computer-geometry-so24EYz6.bin",import.meta.url).href,af=""+new URL("../assets/computer-geometry-DXJcZaai.json",import.meta.url).href,rf=""+new URL("../assets/computer-material-pj7H1QLb.json",import.meta.url).href,sf=new URL("../assets/geometry-CO6mKd2l.bin",import.meta.url).href,of=new URL("../assets/geometry-low-DsSP3M4G.json",import.meta.url).href,lf=new URL("../assets/geometry-C8mRYEXR.bin",import.meta.url).href,cf=new URL("../assets/geometry-Dautc2sf.json",import.meta.url).href,uf=""+new URL("../assets/material-DQ0XgHgy.json",import.meta.url).href,hf=""+new URL("../assets/reference-H6kqI7bP.png",import.meta.url).href,df=""+new URL("../assets/computer-geometry-4OFr3sao.bin",import.meta.url).href,ff=""+new URL("../assets/computer-geometry-DrqBa5Gt.json",import.meta.url).href,pf=""+new URL("../assets/computer-material-Cc1ufmGt.json",import.meta.url).href,mf=new URL("../assets/geometry-low-CODxblW3.bin",import.meta.url).href,vf=new URL("../assets/geometry-low-D4gzDxog.json",import.meta.url).href,gf=new URL("../assets/geometry-64QCAMWN.bin",import.meta.url).href,_f=new URL("../assets/geometry-CE1rmuE-.json",import.meta.url).href,yf=""+new URL("../assets/material-W-xnTbkZ.json",import.meta.url).href,xf=""+new URL("../assets/reference-C2goyefQ.png",import.meta.url).href,bf=""+new URL("../assets/computer-geometry-kl6LRhFu.bin",import.meta.url).href,Sf=""+new URL("../assets/computer-geometry-BGsaO-dU.json",import.meta.url).href,wf=""+new URL("../assets/computer-material-DOzauS52.json",import.meta.url).href,Mf=new URL("../assets/geometry-low-B-M19jbq.bin",import.meta.url).href,Ef=new URL("../assets/geometry-low-BDKL02N6.json",import.meta.url).href,Rf=new URL("../assets/geometry-Cnxf5sdK.bin",import.meta.url).href,Tf=new URL("../assets/geometry-ChGJdLSG.json",import.meta.url).href,Af=""+new URL("../assets/material-PIpe_RG2.json",import.meta.url).href,Cf=""+new URL("../assets/reference-DJNhIOY2.png",import.meta.url).href,Lf=""+new URL("../assets/computer-geometry-2FhSUBsP.bin",import.meta.url).href,Pf=""+new URL("../assets/computer-geometry-NxqT9z8T.json",import.meta.url).href,Df=""+new URL("../assets/computer-material-BXySuXUY.json",import.meta.url).href,Uf=new URL("../assets/geometry-low-CCo87iVh.bin",import.meta.url).href,If=new URL("../assets/geometry-low-B_gimyGe.json",import.meta.url).href,Ff=new URL("../assets/geometry-D35uNHRF.bin",import.meta.url).href,Nf=new URL("../assets/geometry-CsAgQd-s.json",import.meta.url).href,Bf=""+new URL("../assets/material-BbQYpXx7.json",import.meta.url).href,Of=""+new URL("../assets/reference-DKlI2XTs.png",import.meta.url).href,zf=""+new URL("../assets/computer-geometry-8sFp0fYB.bin",import.meta.url).href,kf=""+new URL("../assets/computer-geometry-Cn1QZ2Gg.json",import.meta.url).href,Gf=""+new URL("../assets/computer-material-BH5KK6aw.json",import.meta.url).href,Vf=new URL("../assets/geometry-Djz7eF4I.bin",import.meta.url).href,Hf=new URL("../assets/geometry-low-CNGUYtPJ.json",import.meta.url).href,Wf=new URL("../assets/geometry-V5mpIThN.bin",import.meta.url).href,Xf=new URL("../assets/geometry-BK1IibrK.json",import.meta.url).href,jf=""+new URL("../assets/material-FPcmb08I.json",import.meta.url).href,qf=""+new URL("../assets/reference-Oomytcuv.png",import.meta.url).href,Yf=""+new URL("../assets/computer-geometry-AndqqGl8.bin",import.meta.url).href,$f=""+new URL("../assets/computer-geometry-BzmKhFZA.json",import.meta.url).href,Kf=""+new URL("../assets/computer-material-V2yltqDB.json",import.meta.url).href,Zf=new URL("../assets/geometry-low-C-E9AND7.bin",import.meta.url).href,Jf=new URL("../assets/geometry-low-D2RtLGsB.json",import.meta.url).href,Qf=new URL("../assets/geometry-C0W7RsZa.bin",import.meta.url).href,ep=new URL("../assets/geometry-C9oThjW5.json",import.meta.url).href,tp=""+new URL("../assets/material-CRAJ5ZBf.json",import.meta.url).href,np=""+new URL("../assets/reference-WQ0QYPrL.png",import.meta.url).href,ip=""+new URL("../assets/computer-geometry-E8p2QDhI.bin",import.meta.url).href,ap=""+new URL("../assets/computer-geometry-CjuEECj6.json",import.meta.url).href,rp=""+new URL("../assets/computer-material-Cn75v0Yz.json",import.meta.url).href,sp=new URL("../assets/geometry-low-DACTAeB2.bin",import.meta.url).href,op=new URL("../assets/geometry-low-BViYexDG.json",import.meta.url).href,lp=new URL("../assets/geometry-CXJKj_gB.bin",import.meta.url).href,cp=new URL("../assets/geometry-nJ7Yrw_9.json",import.meta.url).href,up=""+new URL("../assets/material-IOJV4bM_.json",import.meta.url).href,hp=""+new URL("../assets/reference-BX4Nw3ys.png",import.meta.url).href,Wa=["blue_beret","alfred","purple_heart","lime_frog","coral_monocle","gus","blue_spectacles","lime_headphones"],dp=Object.assign({"./assets/alfred/computer-geometry.bin":qd,"./assets/alfred/computer-geometry.json":Yd,"./assets/alfred/computer-material.json":$d,"./assets/alfred/geometry-low.bin":Kd,"./assets/alfred/geometry-low.json":Zd,"./assets/alfred/geometry.bin":Jd,"./assets/alfred/geometry.json":Qd,"./assets/alfred/material.json":ef,"./assets/alfred/reference.png":tf,"./assets/blue_beret/computer-geometry.bin":nf,"./assets/blue_beret/computer-geometry.json":af,"./assets/blue_beret/computer-material.json":rf,"./assets/blue_beret/geometry-low.bin":sf,"./assets/blue_beret/geometry-low.json":of,"./assets/blue_beret/geometry.bin":lf,"./assets/blue_beret/geometry.json":cf,"./assets/blue_beret/material.json":uf,"./assets/blue_beret/reference.png":hf,"./assets/blue_spectacles/computer-geometry.bin":df,"./assets/blue_spectacles/computer-geometry.json":ff,"./assets/blue_spectacles/computer-material.json":pf,"./assets/blue_spectacles/geometry-low.bin":mf,"./assets/blue_spectacles/geometry-low.json":vf,"./assets/blue_spectacles/geometry.bin":gf,"./assets/blue_spectacles/geometry.json":_f,"./assets/blue_spectacles/material.json":yf,"./assets/blue_spectacles/reference.png":xf,"./assets/coral_monocle/computer-geometry.bin":bf,"./assets/coral_monocle/computer-geometry.json":Sf,"./assets/coral_monocle/computer-material.json":wf,"./assets/coral_monocle/geometry-low.bin":Mf,"./assets/coral_monocle/geometry-low.json":Ef,"./assets/coral_monocle/geometry.bin":Rf,"./assets/coral_monocle/geometry.json":Tf,"./assets/coral_monocle/material.json":Af,"./assets/coral_monocle/reference.png":Cf,"./assets/gus/computer-geometry.bin":Lf,"./assets/gus/computer-geometry.json":Pf,"./assets/gus/computer-material.json":Df,"./assets/gus/geometry-low.bin":Uf,"./assets/gus/geometry-low.json":If,"./assets/gus/geometry.bin":Ff,"./assets/gus/geometry.json":Nf,"./assets/gus/material.json":Bf,"./assets/gus/reference.png":Of,"./assets/lime_frog/computer-geometry.bin":zf,"./assets/lime_frog/computer-geometry.json":kf,"./assets/lime_frog/computer-material.json":Gf,"./assets/lime_frog/geometry-low.bin":Vf,"./assets/lime_frog/geometry-low.json":Hf,"./assets/lime_frog/geometry.bin":Wf,"./assets/lime_frog/geometry.json":Xf,"./assets/lime_frog/material.json":jf,"./assets/lime_frog/reference.png":qf,"./assets/lime_headphones/computer-geometry.bin":Yf,"./assets/lime_headphones/computer-geometry.json":$f,"./assets/lime_headphones/computer-material.json":Kf,"./assets/lime_headphones/geometry-low.bin":Zf,"./assets/lime_headphones/geometry-low.json":Jf,"./assets/lime_headphones/geometry.bin":Qf,"./assets/lime_headphones/geometry.json":ep,"./assets/lime_headphones/material.json":tp,"./assets/lime_headphones/reference.png":np,"./assets/purple_heart/computer-geometry.bin":ip,"./assets/purple_heart/computer-geometry.json":ap,"./assets/purple_heart/computer-material.json":rp,"./assets/purple_heart/geometry-low.bin":sp,"./assets/purple_heart/geometry-low.json":op,"./assets/purple_heart/geometry.bin":lp,"./assets/purple_heart/geometry.json":cp,"./assets/purple_heart/material.json":up,"./assets/purple_heart/reference.png":hp});function Xa(i,e){const t=dp[`./assets/${i}/${e}`];if(!t)throw Error(`Missing avatar asset: ${i}/${e}`);return t}async function Xt(i){const e=await fetch(i);if(!e.ok)throw Error(`Avatar resource failed (${e.status}): ${i}`);return e}async function fp(i,e="high",t=!1){const n=await _s(i,e);if(t){const a=new Set(n.material.parts.map(s=>s.id)),r=await _s(i,"computer",a);for(const s of n.parts){const o=r.material.parts.find(c=>c.id===s.id);s.renderOrder=s.fur?o.furRenderOrder:o.renderOrder}n.parts.push(...r.parts),n.material.parts.push(...r.material.parts.filter(s=>!a.has(s.id)))}return n}async function _s(i,e,t){const n=e==="low"?"geometry-low":"geometry",a=e==="computer"?"computer-":"",[r,s,o]=await Promise.all([Xt(Xa(i,`${a}${n}.json`)).then(c=>c.json()),Xt(Xa(i,`${a}material.json`)).then(c=>c.json()),Xt(Xa(i,`${a}${n}.bin`)).then(c=>c.arrayBuffer())]);return ur(i,r,s,o,e==="computer",t)}function ur(i,e,t,n,a=!1,r){if(e.buffer.byteLength!==n.byteLength||t.parts.length!==e.parts.length)throw Error(`Inconsistent avatar resources: ${i}`);const s=[];for(const o of e.parts){if(r?.has(o.id))continue;const c=t.parts[o.id],l=new nl,h=new ko(new Float32Array(n,o.vertices.byteOffset,o.vertices.byteLength/4),24),d={positionDelta0:"delta0",normalTarget0:"normal0",positionDelta1:"delta1",normalTarget1:"normal1"};for(const[f,v]of Object.entries(o.vertices.attributes))l.setAttribute(d[f]??f,new sr(h,v.components,v.byteOffset/4));const u=new rr(new Uint16Array(o.vertices.count*4),4);u.gpuType=1013,l.setAttribute("skinJoints",u),l.setAttribute("skinWeights",new qt(new Float32Array(o.vertices.count*4),4)),l.setIndex(o.indices.flatMap(f=>Array.from(f.componentType==="uint16"?new Uint16Array(n,f.byteOffset,f.count):new Uint32Array(n,f.byteOffset,f.count)))),s.push({geometry:l,id:o.id,kind:c.materialKind,fur:!1,fields:c.fields,label:c.label,attachment:c.attachment,universal:c.universal,activity:a?"computer":void 0,colorRole:o.id===0||c.attachment==="three_lobe"||a&&c.fields.referencePose?.[3]===-40?"body":void 0,transparent:c.transparent,depthWrite:c.depthWrite,depthTest:c.depthTest,doubleSided:c.doubleSided,renderOrder:c.renderOrder})}return{preset:i,material:t,parts:s}}const pp=""+new URL("../assets/furLTC1-B2s2_r7O.bin",import.meta.url).href,mp=""+new URL("../assets/furLTC2-DzS6pv45.bin",import.meta.url).href,vp=Hd.presets;function ys(i){return Object.fromEntries(Object.entries(i).map(([e,t])=>[e,t.length===16?new pe().fromArray(t):new nt().fromArray(t)]))}async function gp(i){const e=await fetch(i);if(!e.ok)throw Error(`Avatar resource failed (${e.status}): ${i}`);return e.arrayBuffer()}class _p{constructor(e,t={}){this.canvas=e,this.scene=new Ka,this.camera=new lr(-1.82,1.82,1.82,-1.82,.1,20),this.batches=[],this.assets=new Map,this.pendingAssets=new Map,this.retiredAssets=[],this.assetClaims=new Map,this.sizeRevision=0,this.fits=new Qn(new Float32Array(800),200,1,1023,1015),this.cameras=new Qn(new Float32Array(800),200,1,1023,1015),this.materials=[],this.textures=[],this.geometries=[],this.depthMaterials=[],this.depthTarget=new Lt(1,1,{depthBuffer:!0,depthTexture:new Ln(1,1,1014)}),this.disabledShadow=new Ln(1,1,1014),this.colorTarget=new Lt(1,1,{depthBuffer:!0,samples:4,resolveDepthBuffer:!1,storeMultisampledDepthBuffer:!1}),this.presentScene=new Ka,this.presentGeometry=new Ei(2,2),this.presentMaterial=new _i({glslVersion:ti,vertexShader:"precision highp float; in vec3 position; out vec2 uv; void main(){uv=position.xy*.5+.5;gl_Position=vec4(position,1);}",fragmentShader:`precision highp float;
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
      }`,uniforms:{image:{value:this.colorTarget.texture},surface:{value:new Ge},grid:{value:new nt},fits:{value:this.fits}},depthTest:!1,depthWrite:!1,premultipliedAlpha:!0}),this.raf=0,this.urgentFrame=!0,this.maxFrameRate=60,this.disposed=!1,this.count=1,this.frames=0,this.elapsed=0,this.timedFrames=0,this.ready=!1,this.width=320,this.height=320,this.cols=1,this.rows=1,this.paused=!0,this.time=0,this.reactionComposer=new Od,this.reactionEyes=new vs,this.previousTime=0,this.attributesDirty=!0,this.cropCache=new Map,this.fitsDirty=!0,this.fitPending=!0,this.backingPixels=320,this.poseObject=new Pt,this.pointerIndex=null,this.hoverIndex=null,this.pointerPivot=new O,this.rotatedPivot=new O,this.pointerBasis=new pe().makeRotationY(8*Math.PI/180),this.pointerInverse=this.pointerBasis.clone().invert(),this.pointerMatrix=new pe,this.pointerPitch=new pe,this.eyeWorld=new pe,this.eyeNormal=new pe,this.projection=new pe,this.inverseProjection=new pe,this.partWorld=new pe,this.partNormal=new pe,this.states=[],this.inViewport=!0,this.contextLost=!1,this.visibilityChanged=()=>{this.previousTime=0,document.hidden||!this.inViewport||this.contextLost?(cancelAnimationFrame(this.raf),this.raf=0):this.invalidate()},this.onContextLost=()=>{this.contextLost=!0,this.visibilityChanged()},this.onContextRestored=()=>{this.contextLost=!1,this.previousTime=0,this.resize()},this.tick=n=>{if(this.raf=0,this.disposed||!this.ready||document.hidden||!this.inViewport||this.contextLost)return;if(this.states.every(d=>d.rendering===!1)){this.previousTime=0;return}if(!this.urgentFrame&&this.previousTime&&n-this.previousTime<1e3/this.maxFrameRate-1){this.invalidate(!1);return}this.urgentFrame=!1;const a=this.previousTime?(n-this.previousTime)/1e3:0;!this.paused&&this.previousTime&&(this.time+=a,this.elapsed+=a,this.timedFrames++),this.previousTime=n;const r=this.projection.multiplyMatrices(this.camera.projectionMatrix,this.camera.matrixWorldInverse);this.inverseProjection.copy(r).invert();const s=this.fitPending,o=this.poseObject;let c=!1;for(const[d,u]of this.states.entries()){if(u.rendering===!1&&!s)continue;if(o.position.set(0,this.paused||s||u.poseOverride||this.asset(u.preset)?.samplers?0:Math.sin(this.time*1.8+u.phase)*.025,0),o.rotation.set(s?0:-u.look.y*.12,s?0:u.look.x*.18,this.paused||s||u.poseOverride||this.asset(u.preset)?.samplers?0:Math.sin(this.time+u.phase)*.02),o.scale.setScalar(1),u.entrance&&!s){u.entrance.pendingStart&&(u.entrance.started=this.time,delete u.entrance.pendingStart);const S=Math.min(1,Math.max(0,u.entrance.held??this.time-u.entrance.started)),E=1-(1-S)**3;o.scale.setScalar(.1+.9*E),o.position.x-=.26*Math.sin(Math.PI*S)*(1-S),o.position.y-=.55*(1-E),o.rotation.z-=.32*(1-E),S===1&&(u.entrance=void 0)}if(u.wander&&!s&&!this.paused&&u.motion?.held===void 0&&(!u.motion||u.motion.kind==="idle")&&this.hoverIndex!==d&&this.pointerIndex!==d&&this.time>=u.wander.next){const S=u.phase+ ++u.wander.step*2.399963;this.queueGaze(d,.5+Math.sin(S)*.28,.5+Math.sin(S*1.73)*.2),u.wander.next=this.time+1.8+(1+Math.sin(S*.7))*1.2}if(o.updateMatrix(),u.matrix.copy(o.matrix),!u.poseOverride&&this.asset(u.preset)?.samplers&&!s&&(!this.paused||u.motion)){const S=this.asset(u.preset).samplers,E=u.motion;u.motion=Ys(u.motion,S,this.time),E?.pendingStart&&u.reactionGaze?.motion===E&&(u.reactionGaze.motion=u.motion);const y=u.motion,R=y?.kind==="work"&&y.continuous?S.workLoop:S[y?.kind??"idle"];(!u.pose||u.poseSampler!==R)&&(u.pose=R.createPose(),u.poseSampler=R,u.poseSampleTime=void 0);const D=y?.held??(y?this.time-y.started:this.time+u.phase);u.poseSampleTime!==D&&(R.sample(D,u.pose),u.poseSampleTime=D)}const f=u.motion?.kind==="reaction"?this.asset(u.preset)?.samplers?.reactionGaze:void 0;if(f&&u.motion){u.reactionGaze?.motion!==u.motion&&(u.reactionGaze={motion:u.motion,yaw:u.gaze.yaw,pitch:u.gaze.pitch,x:u.eyes.x,y:u.eyes.y,strength:1,frozen:!0});const S=Bd((u.motion.held??this.time-u.motion.started)-f.entryTime,f.coreSeconds);u.reactionGaze.strength=S.strength,u.reactionGaze.frozen=S.frozen}else u.reactionGaze=void 0;u.normalMatrix.copy(u.matrix).setPosition(0,0,0),u.pointer.sample(n/1e3);const v=u.motion?.kind==="work",g=u.reactionGaze,p=g?.strength??1,m=v?0:u.pointer.yaw+(g?.frozen?g.yaw:u.gaze.yaw)*p,M=v?0:u.pointer.pitch+(g?.frozen?g.pitch:u.gaze.pitch)*p;if(!s&&(m||M)){if(this.pointerMatrix.copy(this.pointerBasis).multiply(this.pointerPitch.makeRotationY(m)).multiply(this.pointerPitch.makeRotationX(M)).multiply(this.pointerInverse),u.normalMatrix.premultiply(this.pointerMatrix),g){const S=(u.poseOverride?.get("mesh:0")??u.pose?.[0])?.fields.gazeNeutralTranslation;if(!S)throw Error("Reaction is missing its independent neutral frame");this.pointerPivot.fromArray(S),this.rotatedPivot.copy(this.pointerPivot).applyMatrix4(this.pointerMatrix),this.pointerMatrix.setPosition(this.pointerPivot.sub(this.rotatedPivot))}else if(this.asset(u.preset)?.source.preset!=="blue_beret"){const S=u.poseOverride?.get("mesh:0")?.world??(!this.paused||u.motion?u.pose?.[0]?.world:void 0)??this.asset(u.preset).parts[0].material.uniforms.d.value.world;this.pointerPivot.setFromMatrixPosition(S),this.rotatedPivot.copy(this.pointerPivot).applyMatrix4(this.pointerMatrix),this.pointerMatrix.setPosition(this.pointerPivot.sub(this.rotatedPivot))}u.matrix.premultiply(this.pointerMatrix)}const A=s?void 0:u.poseOverride?.get("mesh:0")?.fields.camera??(!this.paused||u.motion?u.pose?.[0]?.fields.camera:void 0),w=this.cameras.image.data,x=d*4;for(let S=0;S<4;S++){const E=Math.fround(A?.[S]??(S<2?1:0));w[x+S]!==E&&(w[x+S]=E,c=!0)}}c&&(this.cameras.needsUpdate=!0),this.occlusion.setAvatars(this.cameras,Math.min(this.count,this.cols),this.rows,this.backingPixels,this.count);for(const d of this.materials)d.uniforms.crowdProjection.value.copy(r);this.batches.forEach(d=>{const{mesh:u,part:f}=d,v=d.slots.filter(A=>this.states[A].rendering!==!1),g=this.attributesDirty||!d.renderedSlots||v.length!==d.renderedSlots.length||v.some((A,w)=>A!==d.renderedSlots[w]);d.renderedSlots=v,u.count=v.length,d.visible=!1;let p=0;const m=u.geometry.getAttribute("instanceOffset"),M=u.geometry.getAttribute("instancePigment");v.forEach((A,w)=>{const x=this.states[A];if(f.motionTexture){const E=s?void 0:x.poseOverride?.get(`${f.source.fur?"fur":"mesh"}:${f.source.id}`)??(!this.paused||x.motion?x.pose?.[x.motion?.kind==="work"?x.motion.continuous?f.workLoopPart:f.workPart:f.motionPart]:void 0);E?(this.partWorld.multiplyMatrices(x.matrix,E.world),this.partNormal.multiplyMatrices(x.normalMatrix,E.normalMatrix)):(this.partWorld.multiplyMatrices(x.matrix,f.material.uniforms.d.value.world),this.partNormal.multiplyMatrices(x.normalMatrix,f.material.uniforms.d.value.normalMatrix));const y=x.reactionGaze,R=x.poseOverride?.get("mesh:0")??(!this.paused||x.motion?x.pose?.[0]:void 0),D=R?.fields.eyeBlink?.[0],P=!y||D!==void 0;if(!s&&f.eyeProfile&&x.motion?.kind!=="work"&&(f.eyeProfile.blink!=="external"||P)&&(y?.strength??1)>0&&((y?.frozen?y.x:x.eyes.x)||(y?.frozen?y.y:x.eyes.y))){const B=f.eyeProfile.blink==="external"?D??0:Gd(E?.fields.parameters??f.source.fields.parameters,f.eyeProfile.blink);if(y){this.reactionEyes.x=y.frozen?y.x:x.eyes.x,this.reactionEyes.y=y.frozen?y.y:x.eyes.y;const X=R?.fields;if(!X?.gazeNeutralTranslation||!X.gazeNeutralScale)throw Error("Reaction is missing its independent ocular frame");this.reactionComposer.writeEyeCorrection(this.reactionEyes,f.eyeProfile,B,y.strength,X.gazeNeutralTranslation,X.gazeNeutralScale,E?.world??f.material.uniforms.d.value.world,this.eyeWorld,this.eyeNormal)}else x.eyes.writeCorrection(f.eyeProfile,B,this.eyeWorld,this.eyeNormal);this.partWorld.multiply(this.eyeWorld),this.partNormal.multiply(this.eyeNormal)}u.setMatrixAt(w,this.partWorld);const U=f.motionTexture.image.data;for(let B=0;B<12;B++)U[w*64+B]=this.partNormal.elements[B];U.set(E?.fields.parameters??f.source.fields.parameters,w*64+12),U.set(E?.fields.signatureDeform??f.source.fields.signatureDeform,w*64+16),U.set(E?.fields.colorRoughness??f.source.fields.colorRoughness,w*64+20),U.set(E?.fields.paletteClosure??f.source.fields.paletteClosure,w*64+24),U.set(E?.fields.referencePose??f.source.fields.referencePose,w*64+28),U.set(E?.fields.coverage??f.source.fields.coverage,w*64+32);const L=E?.fields.camera,C=w*64+36;if(U[C]=L?.[0]??1,U[C+1]=L?.[1]??1,U[C+2]=L?.[2]??0,U[C+3]=L?.[3]??(f.source.activity?0:1),d.visible||=U[C+3]>0,U.set(E?.fields.eyeCurveOriginAmount??f.source.fields.eyeCurveOriginAmount,w*64+40),U.set(E?.fields.eyeCurveRightWidth??f.source.fields.eyeCurveRightWidth,w*64+44),U.set(this.partWorld.elements,w*64+48),f.source.fur){const B=this.partWorld.elements,X=Math.max(Math.hypot(B[0],B[1],B[2]),Math.hypot(B[4],B[5],B[6]),Math.hypot(B[8],B[9],B[10])),H=f.source.fields.fur[1]*f.source.fields.fur[2]*X*Math.abs(Zi.frame.viewProjection[5])*(L?.[1]??1)*this.backingPixels*.5;p=Math.max(p,Math.min(8192,160+H*H*.027)*Nn.clamp((H-12)/48,0,1))}}else u.setMatrixAt(w,x.matrix),d.visible=!0;if(!g)return;m.setXY(w,(A%this.cols-(Math.min(this.count,this.cols)-1)/2)*3.64,((this.rows-1)/2-Math.floor(A/this.cols))*3.64);const S=x.color;if(f.source.colorRole!=="body")M.setXYZ(w,1,1,1);else if(f.source.attachment==="three_lobe"||f.source.activity==="computer"){const E=this.asset(x.preset).source.material.parts[0].fields.colorRoughness,y=f.source.fields.colorRoughness;M.setXYZ(w,S.r*E[0]/Math.max(y[0],1e-6),S.g*E[1]/Math.max(y[1],1e-6),S.b*E[2]/Math.max(y[2],1e-6))}else M.setXYZ(w,S.r,S.g,S.b)}),v.length&&(u.instanceMatrix.needsUpdate=!0),f.source.fur&&f.motionTexture&&u.geometry.setDrawRange(0,Math.ceil(p)*12),v.length&&f.motionTexture&&(f.motionTexture.needsUpdate=!0),g&&(m.needsUpdate=M.needsUpdate=!0)}),this.attributesDirty=!1,this.renderer.info.autoReset=!1,this.renderer.info.reset(),this.batches.forEach(({mesh:d,part:u,visible:f})=>{d.visible=f&&u.depth!==null,u.depth&&(d.material=u.depth)}),this.renderer.setRenderTarget(this.depthTarget),this.renderer.render(this.scene,this.camera);const l=this.occlusion.render(this.depthTarget.depthTexture,r,this.depthTarget.width,this.depthTarget.height);this.batches.forEach(({mesh:d,part:u,visible:f})=>{d.visible=f,d.material=u.material,u.material.uniforms.ambientOcclusion.value=l}),this.renderer.setRenderTarget(this.colorTarget),this.renderer.render(this.scene,this.camera),this.updateCrops(),this.renderer.setRenderTarget(null),this.renderer.render(this.presentScene,this.camera),this.frames++,this.onFrame?.();let h=!1;for(const d of this.states){if(d.rendering===!1)continue;const u=d.gaze.yaw,f=d.gaze.pitch,v=d.eyes.x,g=d.eyes.y;d.gaze.advance(a),d.eyes.advance(a),d.gazePending&&(d.gaze.point(d.gazeTarget.x,d.gazeTarget.y),this.asset(d.preset)?.parts.some(p=>p.eyeProfile)&&d.eyes.point(d.gazeTarget.x,d.gazeTarget.y),d.gazePending=!1),h||=u!==d.gaze.yaw||f!==d.gaze.pitch||d.gaze.moving||v!==d.eyes.x||g!==d.eyes.y||d.eyes.moving}h||this.states.some(d=>d.rendering!==!1&&(d.pointer.moving||!this.paused&&d.entrance&&d.entrance.held===void 0))||!this.paused&&this.states.some(d=>d.rendering!==!1&&!d.poseOverride&&(!this.asset(d.preset)?.samplers||!d.motion||d.motion.held===void 0&&(d.motion.kind==="idle"||d.motion.continuous||this.time-d.motion.started<this.asset(d.preset).samplers[d.motion.kind].clip.duration)))?this.invalidate(!1):this.previousTime=0},this.allowPoseOverrides=t.poseOverrides??!1,this.onFrame=t.onFrame,this.resolveAsset=t.resolveAsset,this.lazyWork=t.lazyWork??!1,this.assetLoader=t.assetLoader??fp,this.maxFrameRate=this.validFrameRate(t.maxFrameRate??60),this.defaultPreset=t.preset??"blue_beret",this.count=this.validCount(t.count??1),this.pixels=Math.max(48,Number.isFinite(t.size)?t.size:320),this.detail=this.pixels<=128?"low":"high",this.fits.needsUpdate=!0,this.renderer=new nd({canvas:e,alpha:!0,antialias:!1}),this.disabledShadow.compareFunction=515,this.disabledShadow.needsUpdate=!0,this.occlusion=new Id(this.renderer,Zi.frame),this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2)),this.renderer.setClearColor(0,0),this.renderer.outputColorSpace=xi,this.presentScene.add(new Ft(this.presentGeometry,this.presentMaterial)),this.camera.position.z=4,this.camera.updateMatrixWorld(),this.observer=new ResizeObserver(()=>this.resize()),this.observer.observe(e),this.visibilityObserver=new IntersectionObserver(([n])=>{this.inViewport=n?.isIntersecting??!1,this.visibilityChanged()}),this.visibilityObserver.observe(e),document.addEventListener("visibilitychange",this.visibilityChanged),e.addEventListener("webglcontextlost",this.onContextLost),e.addEventListener("webglcontextrestored",this.onContextRestored),this.loaded=this.load()}async load(){const e=await Promise.all([pp,mp].map(gp));this.disposed||(this.textures=e.map((t,n)=>{const a=Zi.sourceTextures[n+2],r=a.type===5126,s=new Qn(r?new Float32Array(t):new Uint8Array(t),a.width,a.height,1023,r?1015:1009);return s.wrapS=s.wrapT=1001,s.minFilter=s.magFilter=1006,s.generateMipmaps=!1,s.needsUpdate=!0,s}),await this.ensureAsset(this.defaultPreset),!this.disposed&&(this.ready=!0,this.setCount(this.count)))}asset(e){return this.assets.get(`${e}:${this.detail}`)}ensureAsset(e,t=this.detail,n=!this.lazyWork||this.states.some(a=>a.preset===e&&a.motion?.kind==="work")){const a=`${e}:${t}`,r=`${a}:${n?"work":"base"}`;if(!Wa.includes(e)&&!this.resolveAsset)return Promise.reject(Error(`Unsupported avatar: ${e}`));const s=this.assets.get(a);if(s&&(!n||s.activities))return Promise.resolve(s);const o=this.pendingAssets.get(r);if(o)return o;const l=(Wa.includes(e)?Promise.all([this.assetLoader(e,t,n),Ad(e,n)]).then(([h,d])=>(Pd(h.parts),{source:h,samplers:d,eyeProfiles:void 0})):this.resolveAsset(e,t,n)).then(({source:h,samplers:d,eyeProfiles:u})=>{if(this.disposed)throw h.parts.forEach(p=>p.geometry.dispose()),Error("Avatar engine disposed during loading");const f=h.parts.map(p=>{p.geometry.setAttribute("instanceOffset",new oa(new Float32Array(400),2).setUsage(35048)),p.geometry.setAttribute("instancePigment",new oa(new Float32Array(600).fill(1),3).setUsage(35048));const m=d||this.allowPoseOverrides?new Qn(new Float32Array(64),16,1,1023,1015):null,M=d?.idle.clip.parts.findIndex(E=>E.id===`${p.fur?"fur":"mesh"}:${p.id}`)??-1,A=d?.work?.clip.parts.findIndex(E=>E.id===`${p.fur?"fur":"mesh"}:${p.id}`)??-1,w=d?.workLoop?.clip.parts.findIndex(E=>E.id===`${p.fur?"fur":"mesh"}:${p.id}`)??-1;if(d&&M<0&&!p.activity)throw Error(`Missing motion part: ${e}/${p.id}`);const x=this.material(p,h.material.frame);m&&(x.defines.AUTHORED_MOTION=1,x.defines.AUTHORED_COMPUTER=1,x.uniforms.instancePose={value:m});const S=p.fur||p.depthWrite===!1?null:new _i({glslVersion:ti,vertexShader:gs,fragmentShader:"precision highp float; out vec4 color; void main(){color=vec4(1);}",uniforms:x.uniforms,defines:m?{AUTHORED_MOTION:1,AUTHORED_COMPUTER:1}:{},colorWrite:!1});return this.geometries.push(p.geometry),this.materials.push(x),S&&this.depthMaterials.push(S),{source:p,material:x,depth:S,motionTexture:m,motionPart:M,workPart:A,workLoopPart:w,eyeProfile:p.fur?null:(u?u[p.id]:vp[h.preset]?.[t==="high"?"1":"0"]?.[p.id])??null}}),v={source:h,parts:f,samplers:d,activities:n},g=this.assets.get(a);return g?.activities&&!n?(this.disposeAsset(v),g):(g&&this.retiredAssets.push(g),this.assets.set(a,v),t==="high"&&Wa.includes(e)&&this.cropCache.set(`${e}:high:320`,h.material.crop),v)}).finally(()=>this.pendingAssets.delete(r));return this.pendingAssets.set(r,l),l}material(e,t){const n=ys(t);return new _i({glslVersion:ti,vertexShader:gs,fragmentShader:Wd,defines:{...e.universal?{}:{FELIPE_MATERIAL:1,FELIPE_KIND:e.kind},...e.fur?{FELIPE_FUR:1}:{}},uniforms:{f:{value:n},d:{value:ys(e.fields)},skin:{value:{joints:Array.from({length:24},()=>new pe)}},crowdProjection:{value:new pe},crowdInverseProjection:{value:this.inverseProjection},outputInverse:{value:new Ge},ambientOcclusion:{value:null},shadowMap:{value:this.disabledShadow},shadowDepth:{value:null},occlusionDepth:{value:this.depthTarget.depthTexture},environmentBRDF:{value:null},studioLighting:{value:null},paletteField:{value:null},referencePalette:{value:null},furLTC1:{value:this.textures[0]},furLTC2:{value:this.textures[1]}},premultipliedAlpha:!0,transparent:e.transparent??(e.fur||e.fields.coverage[0]<1),depthWrite:e.depthWrite??!e.fur,depthTest:e.depthTest??!0,side:e.doubleSided||e.fur?2:0})}validCount(e){return Math.max(1,Math.min(200,Math.floor(Number.isFinite(e)?e:1)))}setCount(e){if(this.disposed)return;const t=this.validCount(e);if(!(this.ready&&this.count===t&&this.states.length===t)&&(this.pointerIndex!==null&&this.pointerIndex>=t&&this.endPointer(),this.hoverIndex!==null&&this.hoverIndex>=t&&this.selectHover(null),this.count=t,!!this.ready)){for(;this.states.length<this.count;)this.states.push({preset:this.defaultPreset,matrix:new pe,normalMatrix:new pe,color:new qe(1,1,1),colorHex:null,look:new Ge,pointer:new Fd,gaze:new Nd,eyes:new vs,gazeTarget:new Ge(.5,.5),gazePending:!1,phase:this.states.length*2.399,revision:0});this.states.length=this.count;for(const n of this.states)this.resolvePigment(n);this.rebuildBatches()}}pruneAssets(){const e=new Set([this.defaultPreset,...this.states.map(n=>n.preset),...this.assetClaims.keys()]),t=[...this.assets].filter(([n])=>!e.has(n.slice(0,n.lastIndexOf(":")))&&!this.pendingAssets.has(`${n}:base`)&&!this.pendingAssets.has(`${n}:work`));for(const[n,a]of t.slice(0,Math.max(0,t.length-4))){this.assets.delete(n),this.disposeAsset(a);for(const r of this.cropCache.keys())r.startsWith(n+":")&&this.cropCache.delete(r)}}disposeAsset(e){for(const t of e.parts)t.motionTexture?.dispose(),t.source.geometry.dispose(),t.material.dispose(),t.depth?.dispose(),this.geometries=this.geometries.filter(n=>n!==t.source.geometry),this.materials=this.materials.filter(n=>n!==t.material),t.depth&&(this.depthMaterials=this.depthMaterials.filter(n=>n!==t.depth))}async ensureCurrentDetail(e,t){for(const a of e)this.assetClaims.set(a,(this.assetClaims.get(a)??0)+1);const n=()=>{for(const a of e){const r=this.assetClaims.get(a)-1;r?this.assetClaims.set(a,r):this.assetClaims.delete(a)}this.disposed||this.pruneAssets()};try{let a;do a=this.detail,await Promise.all(e.map(r=>this.ensureAsset(r,a,t)));while(!this.disposed&&a!==this.detail);return n}catch(a){throw n(),a}}async setPreset(e,t){await this.loaded;const n=this.states[e];if(!n||this.disposed)return;const a=++n.revision;if(n.preset===t&&this.asset(t))return;const r=await this.ensureCurrentDetail([t]);try{if(this.disposed||this.states[e]!==n||a!==n.revision)return;n.preset!==t&&(this.pointerIndex===e&&this.endPointer(),n.pointer.reset(),n.gaze.reset(),n.eyes.reset(),n.gazeTarget.set(.5,.5),n.gazePending=!1,n.motion=void 0,n.pose=void 0,n.poseOverride=void 0),n.preset=t,this.resolvePigment(n),this.rebuildBatches()}finally{r()}}async setPresets(e){await this.loaded;const t=this.states.map((a,r)=>({state:a,revision:++a.revision,preset:e[r%e.length]}));if(t.some(a=>!a.preset))throw Error("An avatar preset is required");const n=await this.ensureCurrentDetail([...new Set(t.map(a=>a.preset))]);try{if(this.disposed)return;t.forEach(({state:a,revision:r,preset:s},o)=>{this.states[o]===a&&a.revision===r&&(a.preset!==s&&(this.endPointer(),a.pointer.reset(),a.gaze.reset(),a.eyes.reset(),a.gazeTarget.set(.5,.5),a.gazePending=!1,a.motion=void 0,a.pose=void 0,a.poseOverride=void 0),a.preset=s,this.resolvePigment(a))}),this.rebuildBatches()}finally{n()}}rebuildBatches(){for(const{mesh:t}of this.batches)this.scene.remove(t),t.dispose();this.batches=[];for(const t of this.retiredAssets)this.disposeAsset(t);this.retiredAssets=[];const e=new Map;this.states.forEach((t,n)=>{const a=e.get(t.preset)??[];a.push(n),e.set(t.preset,a)});for(const[t,n]of e){const a=this.asset(t);for(const r of a.parts){if(r.motionTexture&&r.motionTexture.image.height<n.length){const c=Math.min(200,2**Math.ceil(Math.log2(n.length)));r.motionTexture.dispose(),r.motionTexture.image={data:new Float32Array(c*64),width:16,height:c},r.motionTexture.needsUpdate=!0}const s=r.source.geometry,o=new qo(s,r.material,n.length);o.frustumCulled=!1,o.renderOrder=r.source.renderOrder??0,o.instanceMatrix.setUsage(35048),this.scene.add(o),this.batches.push({mesh:o,part:r,slots:n,visible:!0})}for(const r of n)this.fits.image.data.set(a.source.material.crop,r*4)}this.fits.needsUpdate=!0,this.resize()}async setSize(e){if(!Number.isFinite(e)||this.disposed)return;this.pixels=Math.max(48,e);const t=++this.sizeRevision,n=this.pixels<=128?"low":"high";for(this.resize(),await this.loaded;!this.disposed&&t===this.sizeRevision&&n!==this.detail;){if(await Promise.all([...new Set(this.states.map(a=>a.preset))].map(a=>this.ensureAsset(a,n))),this.disposed||t!==this.sizeRevision)return;this.states.some(a=>!this.assets.has(`${a.preset}:${n}`))||(this.detail=n,this.rebuildBatches())}}setPose(e,t){if(!this.allowPoseOverrides)throw Error("Pose overrides were not enabled");if(this.disposed)return;const n=this.states[e];if(n){if(t){const a=this.asset(n.preset);if(!a)throw Error("Avatar assets are not ready");const r=new Map(t.map(o=>[o.id,o]));if(r.size!==t.length||r.size!==a.parts.length)throw Error("Pose parts must match the selected avatar");for(const o of a.parts){const c=r.get(`${o.source.fur?"fur":"mesh"}:${o.source.id}`);if(!c||!c.world.elements.every(Number.isFinite)||!c.normalMatrix.elements.every(Number.isFinite))throw Error("Invalid pose transform or part identity");for(const h of["parameters","signatureDeform","colorRoughness","paletteClosure","referencePose","coverage","eyeCurveOriginAmount","eyeCurveRightWidth","camera"]){const d=c.fields[h];if(d&&(d.length!==4||!d.every(Number.isFinite)))throw Error(`Invalid pose field: ${h}`)}const l=c.fields.camera;if(l&&(l[0]<=0||l[1]<=0||l[3]<0||l[3]>1))throw Error("Invalid pose camera")}const s=n.poseOverride??new Map;for(const o of r.values()){const c=s.get(o.id);if(!c)s.set(o.id,{id:o.id,world:o.world.clone(),normalMatrix:o.normalMatrix.clone(),fields:Object.fromEntries(Object.entries(o.fields).map(([l,h])=>[l,h.slice()]))});else{c.world.copy(o.world),c.normalMatrix.copy(o.normalMatrix);for(const l of Object.keys(c.fields))l in o.fields||delete c.fields[l];for(const[l,h]of Object.entries(o.fields)){const d=c.fields[l]??(c.fields[l]=[]);for(let u=0;u<h.length;u++)d[u]=h[u]}}}n.poseOverride=s}else n.poseOverride=void 0;this.invalidate()}}resetAppearance(e){(e===void 0||this.pointerIndex===e)&&this.endPointer(),(e===void 0||this.hoverIndex===e)&&(this.hoverIndex=null),this.attributesDirty=!0;for(const t of e===void 0?this.states:this.states.slice(e,e+1))t.motion=void 0,t.poseOverride=void 0,t.colorHex=null,this.resolvePigment(t),t.look.set(0,0),t.pointer.reset(),t.gaze.reset(),t.eyes.reset(),t.gazeTarget.set(.5,.5),t.gazePending=!1;this.invalidate()}setMotionFrame(e,t,n){const a=this.states[e];return!a||!this.asset(a.preset)?.samplers||!Number.isFinite(n)||t!=="idle"&&t!=="reaction"&&t!=="work"||!this.asset(a.preset)?.samplers?.[t]?!1:(a.poseOverride=void 0,a.motion={kind:t,started:this.time,held:Math.max(0,n)},this.invalidate(),!0)}canReact(e){const t=this.states[e];return!!t&&!!this.asset(t.preset)?.samplers?.reaction}canIdle(e){const t=this.states[e];return!!t&&!!this.asset(t.preset)?.samplers?.idle}canWork(e){const t=this.states[e];if(!t)return!1;const n=this.asset(t.preset);return!!n?.samplers?.work&&n.parts.some(a=>a.source.activity==="computer")}async prepareWork(e){await this.loaded;const t=this.states[e];if(!t||this.disposed)return!1;const n=t.preset,a=t.revision;if(this.asset(n)?.activities)return this.canWork(e);const r=await this.ensureCurrentDetail([n],!0);try{return this.disposed?!1:(this.rebuildBatches(),this.states[e]===t&&t.preset===n&&t.revision===a&&this.canWork(e))}finally{r()}}work(e,t=!1,n=1){const a=this.states[e];return!a||!this.canWork(e)||t&&!this.asset(a.preset)?.samplers?.workLoop?!1:(a.poseOverride=void 0,a.motion={kind:"work",started:this.time,pendingStart:!0,continuous:t,remainingCycles:Number.isFinite(n)?Math.max(1,Math.floor(n)):1},this.setPaused(!1),!0)}react(e){const t=this.states[e];if(!t||t.pointer.active||!this.asset(t.preset)?.samplers?.reaction)return!1;const n=this.asset(t.preset).samplers.reaction.clip;return t.motion?.kind==="reaction"&&t.motion.held===void 0&&(t.motion.pendingStart||this.time-t.motion.started<n.duration)?(t.motion.queuedReaction=!0,this.invalidate(),!0):(t.poseOverride=void 0,t.motion={kind:"reaction",started:this.time,pendingStart:!0},t.reactionGaze={motion:t.motion,yaw:t.gaze.yaw,pitch:t.gaze.pitch,x:t.eyes.x,y:t.eyes.y,strength:1,frozen:!0},this.setPaused(!1),!0)}idle(e){const t=this.states[e];return!t||!this.asset(t.preset)?.samplers?!1:(t.poseOverride=void 0,t.motion={kind:"idle",started:this.time},this.setPaused(!1),!0)}validFrameRate(e){if(e!==1/0&&(!Number.isFinite(e)||e<1||e>240))throw Error("Frame rate must be 1–240 or Infinity");return e}setMaxFrameRate(e){this.maxFrameRate=this.validFrameRate(e),this.invalidate()}setPaused(e){e&&this.states.forEach(t=>{t.motion=void 0}),this.paused!==e&&(this.previousTime=0),this.paused=e,this.invalidate()}entrance(e){const t=this.states[e];t&&(t.entrance={started:this.time,pendingStart:!0},this.invalidate())}setWander(e,t){const n=this.states[e];n&&(n.wander=t?{next:this.time,step:0}:void 0,this.invalidate())}setGaze(e,t,n){if(!Number.isFinite(t)||!Number.isFinite(n))throw Error("Invalid avatar gaze");this.queueGaze(e,Nn.clamp(t,0,1),Nn.clamp(n,0,1))}setLook(e,t,n){const a=this.states[e];a&&(t=Number.isFinite(t)?Nn.clamp(t,-1,1):0,n=Number.isFinite(n)?Nn.clamp(n,-1,1):0,!(a.look.x===t&&a.look.y===n)&&(a.look.set(t,n),this.invalidate()))}setColor(e,t){const n=this.states[e];if(n){if(!/^#[0-9a-f]{6}$/i.test(t))throw Error("Body color must be #RRGGBB");this.attributesDirty=!0,n.colorHex=t,this.resolvePigment(n),this.invalidate()}}clearColor(e){const t=this.states[e];t&&(t.colorHex=null,this.resolvePigment(t),this.attributesDirty=!0,this.invalidate())}setInstancePaused(e,t){const n=this.states[e];if(!n)return;const a=n.motion??(n.motion={kind:"idle",started:-n.phase});t&&a.held===void 0?a.held=this.time-a.started:!t&&a.held!==void 0&&(a.started=this.time-a.held,delete a.held),n.entrance&&(t&&n.entrance.held===void 0?n.entrance.held=this.time-n.entrance.started:!t&&n.entrance.held!==void 0&&(n.entrance.started=this.time-n.entrance.held,delete n.entrance.held)),this.invalidate()}setInstanceRendering(e,t){const n=this.states[e];!n||n.rendering===t||(n.rendering=t,t&&(this.cropCache.has(`${n.preset}:${this.detail}:${this.backingPixels}`)||(this.fitsDirty=this.fitPending=!0),this.invalidate()))}resolvePigment(e){const t=this.asset(e.preset).source.material.parts[0].fields.colorRoughness;e.colorHex?e.color.set(e.colorHex):e.color.setRGB(t[0],t[1],t[2]),id(e.color),e.color.r/=Math.max(t[0],1e-6),e.color.g/=Math.max(t[1],1e-6),e.color.b/=Math.max(t[2],1e-6)}hitTest(e,t){if(!Number.isFinite(e)||!Number.isFinite(t)||e<0||t<0||e>=this.width||t>=this.height)return null;const n=Math.min(this.count,this.cols),a=Math.floor((e-this.width/2)/this.pixels+n/2),r=Math.floor((t-this.height/2)/this.pixels+this.rows/2),s=r*this.cols+a;return a>=0&&a<n&&r>=0&&r<this.rows&&s<this.count?s:null}pointerCoordinates(e,t,n){const a=this.width/2+(e%this.cols-Math.min(this.count,this.cols)/2)*this.pixels,r=this.height/2+(Math.floor(e/this.cols)-this.rows/2)*this.pixels,s=this.fits.image.data;return[s[e*4]+(t-a)/this.pixels*s[e*4+2],s[e*4+1]+(n-r)/this.pixels*s[e*4+3]]}beginPointer(e,t){if(!this.ready||this.fitPending||this.pointerIndex!==null)return null;const n=this.hitTest(e,t);return n===null||!this.states[n]?null:(this.selectHover(n),this.pointerIndex=n,this.queueGaze(n,...this.pointerCoordinates(n,e,t)),this.states[n].pointer.down(...this.pointerCoordinates(n,e,t),performance.now()/1e3),this.invalidate(),n)}queueGaze(e,t,n){const a=this.states[e];!a||this.asset(a.preset)?.source.preset==="blue_beret"||a.gazeTarget.x===t&&a.gazeTarget.y===n||(a.gazeTarget.set(t,n),a.gazePending=!0,this.invalidate())}selectHover(e){this.hoverIndex!==e&&(this.hoverIndex!==null&&this.queueGaze(this.hoverIndex,.5,.5),this.hoverIndex=e)}endPointer(e,t){this.pointerIndex!==null&&(this.states[this.pointerIndex]?.pointer.up(performance.now()/1e3),this.pointerIndex=null,e!==void 0&&t!==void 0&&this.point(e,t),this.invalidate())}point(e,t){if(!this.ready||this.fitPending||!Number.isFinite(e)||!Number.isFinite(t))return;if(this.pointerIndex!==null){const a=this.pointerIndex,r=this.pointerCoordinates(a,e,t);this.states[a]?.pointer.move(...r),this.queueGaze(a,...r),this.invalidate();return}const n=this.hitTest(e,t);this.selectHover(n),n!==null&&this.queueGaze(n,...this.pointerCoordinates(n,e,t))}resize(){if(this.disposed)return;this.attributesDirty=!0,this.fitsDirty=!0;const e=this.pixels<=64?1:this.pixels<=128?1.5:2;this.backingPixels=Math.max(64,Math.min(512,Math.round(this.pixels*Math.min(window.devicePixelRatio||1,e)))),this.renderer.setPixelRatio(this.backingPixels/this.pixels),this.fitPending=this.states.some(s=>s.rendering!==!1&&!this.cropCache.has(`${s.preset}:${this.detail}:${this.backingPixels}`));const{width:t,height:n}=this.canvas.getBoundingClientRect();this.width=Math.max(1,t),this.height=Math.max(1,n),this.cols=Math.max(1,Math.floor(this.width/this.pixels)),this.rows=Math.ceil(this.count/this.cols);for(const{part:s}of this.batches){if(!s.source.fur)continue;const o=s.source.fields,c=new O().setFromMatrixScale(new pe().fromArray(o.world)),l=o.fur[1]*o.fur[2]*Math.max(c.x,c.y,c.z)*Math.abs(Zi.frame.viewProjection[5])*this.backingPixels*.5,h=Math.min(8192,160+l*l*.027)*Nn.clamp((l-12)/48,0,1);s.source.geometry.setDrawRange(0,Math.ceil(h)*12)}for(const s of this.materials)s.uniforms.f.value.viewport.set(this.backingPixels,this.backingPixels,1/this.backingPixels,1/this.backingPixels);const a=3.64/this.pixels;this.camera.left=-this.width*a/2,this.camera.right=this.width*a/2,this.camera.top=this.height*a/2,this.camera.bottom=-this.height*a/2,this.camera.updateProjectionMatrix(),this.renderer.setSize(this.width,this.height,!1);const r=this.renderer.getPixelRatio();this.colorTarget.setSize(Math.round(this.width*r),Math.round(this.height*r)),this.depthTarget.setSize(this.colorTarget.width,this.colorTarget.height);for(const s of this.materials)s.uniforms.outputInverse.value.set(1/this.colorTarget.width,1/this.colorTarget.height);this.presentMaterial.uniforms.surface.value.set(this.width,this.height),this.presentMaterial.uniforms.grid.value.set(this.pixels,Math.min(this.count,this.cols),this.rows,this.count),this.invalidate()}invalidate(e=!0){this.urgentFrame||=e,!this.raf&&!this.disposed&&!document.hidden&&this.inViewport&&!this.contextLost&&(this.raf=requestAnimationFrame(this.tick))}updateCrops(){if(!this.fitsDirty)return;let e=!1;const t=this.backingPixels,n=this.renderer.getPixelRatio();this.states.forEach((a,r)=>{if(a.rendering===!1)return;const s=`${a.preset}:${this.detail}:${t}`;let o=this.cropCache.get(s);if(!o){const l=Math.round(this.width*n/2+(r%this.cols-Math.min(this.count,this.cols)/2)*t),h=Math.round(this.height*n/2+(Math.floor(r/this.cols)-this.rows/2)*t),d=new Uint8Array(t*t*4);this.renderer.readRenderTargetPixels(this.colorTarget,l,this.colorTarget.height-h-t,t,t,d);let u=t,f=t,v=-1,g=-1;for(let m=0;m<t;m++)for(let M=0;M<t;M++)d[((t-m-1)*t+M)*4+3]<=24||(u=Math.min(u,M),v=Math.max(v,M),f=Math.min(f,m),g=Math.max(g,m));if(v<u)return;const p=Math.max(v-u+1,g-f+1)*1.22;o=[(u+v-p)/(2*t),(f+g-p)/(2*t),p/t,p/t],this.cropCache.set(s,o)}const c=this.fits.image.data;o.some((l,h)=>Math.abs(c[r*4+h]-l)>1e-7)&&(c.set(o,r*4),e=!0)}),e&&(this.fits.needsUpdate=!0),this.fitPending=this.states.some(a=>a.rendering!==!1&&!this.cropCache.has(`${a.preset}:${this.detail}:${t}`)),this.fitsDirty=this.fitPending}stats(){return{ready:this.ready,surfaceFinish:"smooth",retainedCanvasCulling:!0,lazyWork:this.lazyWork,renderer:"original-assets-three",parity:!1,missing:["full animation controllers and transitions","cross-phase action entry and interruptions","reaction pointer blending and input arbitration","catalog part mixing beyond the eight presets"],presets:[...new Set(this.states.map(e=>e.preset))],detail:this.detail,motionPresets:[...this.assets].filter(([,e])=>e.samplers).map(([,e])=>e.source.preset),count:this.count,renderedInstances:this.states.filter(e=>e.rendering!==!1).length,frames:this.frames,suspended:document.hidden||!this.inViewport||this.contextLost,frameRateLimit:this.maxFrameRate===1/0?null:this.maxFrameRate,observedFrameRate:this.elapsed?this.timedFrames/this.elapsed:0,columns:this.cols,rows:this.rows,width:this.width,height:this.height,requiredHeight:this.rows*this.pixels,pixelRatio:this.renderer.getPixelRatio(),backingPixelsPerAvatar:this.backingPixels,cachedFits:this.cropCache.size,cachedAssets:this.assets.size,pendingAssets:this.pendingAssets.size,poseTextureBytes:[...this.assets.values()].reduce((e,t)=>e+t.parts.reduce((n,a)=>n+(a.motionTexture?.image.data?.byteLength??0),0),0),resources:{geometries:this.renderer.info.memory.geometries,textures:this.renderer.info.memory.textures,programs:this.renderer.info.programs?.length},states:this.states.map((e,t)=>({index:t,phase:e.phase,motion:e.poseOverride?"held-pose":this.asset(e.preset)?.samplers?e.motion?.kind??(this.paused?"reference":"idle"):"provisional",motionTime:e.motion?.held??(e.motion?this.time-e.motion.started:this.time+e.phase),preset:e.preset,renderedParts:this.asset(e.preset)?.source.parts.map(n=>({id:n.id,label:n.label,colorRole:n.colorRole})),pigment:e.color.toArray(),look:e.look.toArray(),pointer:{active:e.pointer.active,yaw:e.pointer.yaw,pitch:e.pointer.pitch},gaze:{yaw:e.gaze.yaw,pitch:e.gaze.pitch,target:e.gazeTarget.toArray()},eyes:{x:e.eyes.x,y:e.eyes.y}})),contexts:this.disposed?0:1,drawCalls:this.renderer.info.render.calls,triangles:this.renderer.info.render.triangles}}dispose(){this.disposed||(this.disposed=!0,cancelAnimationFrame(this.raf),this.observer.disconnect(),this.visibilityObserver.disconnect(),document.removeEventListener("visibilitychange",this.visibilityChanged),this.canvas.removeEventListener("webglcontextlost",this.onContextLost),this.canvas.removeEventListener("webglcontextrestored",this.onContextRestored),this.batches.forEach(({mesh:e})=>e.dispose()),this.fits.dispose(),this.cameras.dispose(),this.assets.forEach(e=>e.parts.forEach(t=>t.motionTexture?.dispose())),this.retiredAssets.forEach(e=>e.parts.forEach(t=>t.motionTexture?.dispose())),this.geometries.forEach(e=>e.dispose()),this.materials.forEach(e=>e.dispose()),this.textures.forEach(e=>e.dispose()),this.occlusion.dispose(),this.depthTarget.dispose(),this.disabledShadow.dispose(),this.depthMaterials.forEach(e=>e.dispose()),this.colorTarget.dispose(),this.presentGeometry.dispose(),this.presentMaterial.dispose(),this.renderer.dispose(),this.renderer.forceContextLoss())}}function yp(i,e,t={}){let n=null;const a=h=>{const d=i.getBoundingClientRect();return[h.clientX-d.left,h.clientY-d.top]},r=h=>{if(n||h.button!==0||!h.isPrimary)return;const d=a(h),u=t.enabled===!1?e.hitTest(...d):e.beginPointer(...d);u!==null&&(t.onSelect?.(u),t.enabled!==!1&&(n={id:h.pointerId,index:u,x:h.clientX,y:h.clientY,dragged:!1},i.setPointerCapture(h.pointerId)))},s=h=>{t.enabled===!1||n&&n.id!==h.pointerId||(n&&(n.dragged||=Math.hypot(h.clientX-n.x,h.clientY-n.y)>=6),e.point(...a(h)))},o=h=>{if(!n||h&&n.id!==h.pointerId)return;const d=n;n=null,h?.type==="pointerup"?e.endPointer(...a(h)):(e.endPointer(),e.point(-1,-1)),i.hasPointerCapture(d.id)&&i.releasePointerCapture(d.id),h?.type==="pointerup"&&!d.dragged&&Math.hypot(h.clientX-d.x,h.clientY-d.y)<6&&t.onTap?.(d.index)},c=()=>{o(),e.point(-1,-1)},l=()=>{!n&&t.enabled!==!1&&e.point(-1,-1)};return i.addEventListener("pointerdown",r),i.addEventListener("pointermove",s),i.addEventListener("pointerup",o),i.addEventListener("pointercancel",o),i.addEventListener("lostpointercapture",o),i.addEventListener("pointerleave",l),window.addEventListener("blur",c),()=>{i.removeEventListener("pointerdown",r),i.removeEventListener("pointermove",s),i.removeEventListener("pointerup",o),i.removeEventListener("pointercancel",o),i.removeEventListener("lostpointercapture",o),i.removeEventListener("pointerleave",l),window.removeEventListener("blur",c),o(),l()}}const hn=i=>{throw Error(`Avatar catalog: ${i}`)},Ke=(i,e)=>(i.min[e]+i.max[e])/2,ca=i=>({min:[0,1,2].map(e=>Math.min(...i.map(t=>t.bounds.min[e]))),max:[0,1,2].map(e=>Math.max(...i.map(t=>t.bounds.max[e])))}),Qa=i=>i.pieces.filter(e=>e.category==="eyes"&&e.attachment!=="brows"&&!e.fur);function Ji(i){const e=Qa(i),t=[-1,1].map(n=>e.filter(a=>Math.sign(Ke(a.bounds,0))===n));return t.some(n=>!n.length)&&hn("catalog face anchors missing"),t.map(ca)}function hr(i,e,t){const n=i.body.geometry.getAttribute("position"),a=i.body.geometry.getIndex();if(!a)return-1/0;let r=-1/0;for(let s=0;s<a.count;s+=3){const o=[0,1,2].map(g=>{const p=a.getX(s+g);return[n.getX(p),n.getY(p),n.getZ(p)]}),[c,l,h]=o,d=(l[1]-h[1])*(c[0]-h[0])+(h[0]-l[0])*(c[1]-h[1]);if(Math.abs(d)<1e-12)continue;const u=((l[1]-h[1])*(e-h[0])+(h[0]-l[0])*(t-h[1]))/d,f=((h[1]-c[1])*(e-h[0])+(c[0]-h[0])*(t-h[1]))/d,v=1-u-f;Math.min(u,f,v)>=-1e-6&&(r=Math.max(r,u*c[2]+f*l[2]+v*h[2]))}return r}function ja(i,e,t,n,{singleEye:a=!1,faceLayout:r,tuftLayout:s}={}){const o=t==="eyes"?Qa(e):e.pieces.filter(v=>v.category===t&&v.selection===n&&!v.fur);o.length||hn(`missing catalog ${t}:${n}`);const c=v=>v.body.bounds.max[0]-v.body.bounds.min[0];if(t==="eyes"||t==="eyewear"){const v=a?ca(Qa(i)):null,g=v?n==="monocle"?[v,v]:[0,1].map(P=>({min:v.min.map((U,L)=>L===0&&P===1?Ke(v,0):U),max:v.max.map((U,L)=>L===0&&P===0?Ke(v,0):U)})):t==="eyes"&&r?r.centers.map(P=>{const[U,L,C]=P;return{min:[U-r.radius,L-r.radius,C],max:[U+r.radius,L+r.radius,C+r.radius]}}):Ji(i),p=Ji(e),m=P=>Math.abs(Ke(P[1],0)-Ke(P[0],0)),M=i.body.attachment==="metal"||i.body.label==="metal",A=t==="eyes"?r?r.radius/(p.reduce((P,U)=>P+Math.max(U.max[0]-U.min[0],U.max[1]-U.min[1])/2,0)/2):M?1:Math.max(.65,Math.min(1.2,c(i)/c(e))):Math.max(.25,Math.min(2,m(g)/m(p)));if(t==="eyes"){const P=g.map(U=>hr(i,Ke(U,0),Ke(U,1)));return o.map(U=>{const L=Ke(U.bounds,0)<0?0:1,C=[0,1,2].map(j=>Ke(p[L],j)),B=[0,1].map(j=>Ke(g[L],j)-C[j]),X=(p[L].max[2]-p[L].min[2])*A,H=P[L],J=Math.max(g[L].min[2],H-X*.35);return B.push(J-(p[L].min[2]-C[2])*A-C[2]),{part:U,scale:A,origin:C,translate:B}})}const w=[0,1,2].map(P=>(Ke(p[0],P)+Ke(p[1],P))/2),x=[0,1,2].map(P=>(Ke(g[0],P)+Ke(g[1],P))/2),E=[0,1].map(P=>o.filter(U=>Math.abs(Ke(U.bounds,0)-w[0])>m(p)*.15&&(Ke(U.bounds,0)<w[0]?0:1)===P)).map(P=>{if(!P.length)return null;const U=Math.max(...P.map(L=>L.bounds.max[2]));return ca(P.filter(L=>L.bounds.max[2]>U-.05))}),y=E.filter(P=>P!==null),R=y.length?Math.min(...y.map(P=>P.min[2])):Math.max(...o.map(P=>P.bounds.max[2]))-.05,D=y.length?A:Math.max(.25,Math.min(2,(Math.max(...g.map(P=>P.max[0]))-Math.min(...g.map(P=>P.min[0])))*1.18/(Math.max(...o.map(P=>P.bounds.max[0]))-Math.min(...o.map(P=>P.bounds.min[0])))));return o.map(P=>{const U=Ke(P.bounds,0)-w[0];if(Math.abs(U)<=m(p)*.15)return{part:P,scale:D,origin:w,translate:x.map((J,j)=>j===2?Math.max(...g.map(Q=>Q.max[2]))+.012-((R-w[2])*D+w[2]):J-w[j])};const L=U<0?0:1,C=E[L],B=Math.min(a&&n==="monocle"?4:2,Math.max(Math.min(A,1.2),(g[L].max[0]-g[L].min[0])*1.08/(C.max[0]-C.min[0]))),X=[0,1,2].map(J=>Ke(p[L],J)),H=[0,1].map(J=>Ke(g[L],J)-X[J]);return H.push(g[L].max[2]+.012-((C.min[2]-X[2])*B+X[2])),{part:P,scale:B,origin:X,translate:H}})}t!=="accessory"&&hn("unknown catalog fitting category");const l=i.body.attachment==="metal"||i.body.label==="metal",h=(l?.56:Math.max(.35,Math.min(1.5,c(i)/c(e))))*(n==="three_lobe"?s?.scale??1:1),d=[Ke(e.body.bounds,0),e.body.bounds.max[1],Ke(e.body.bounds,2)],u=[l?.02:Ke(i.body.bounds,0),i.body.bounds.max[1],l?0:Ke(i.body.bounds,2)];if(n==="bow"){const v=Ji(e),g=Ji(i);for(let p=0;p<2;p++)d[p]=(Ke(v[0],p)+Ke(v[1],p))/2,u[p]=(Ke(g[0],p)+Ke(g[1],p))/2}const f=u.map((v,g)=>v-d[g]);if(n==="three_lobe"&&s){const v=o[0].attachmentPivot;v||hn("missing tuft attachment anchor");const g=ta(e.body,v);return o.map(p=>({part:p,scale:h,origin:g,translate:f,rotationZ:s.rotationZ}))}return o.map(v=>({part:v,scale:h,origin:d,translate:f}))}function xp({scale:i,rotationZ:e=0,origin:t,translate:n}){if(e===0)return new pe().makeScale(i,i,i).setPosition(...t.map((s,o)=>s*(1-i)+n[o]));const a=new pe().makeRotationZ(e).scale(new O(i,i,i)),r=new O().fromArray(t).applyMatrix4(a).negate().add(new O().fromArray(t)).add(new O().fromArray(n));return a.setPosition(r)}function er(i,e){const{scale:t,origin:n,translate:a,rotationZ:r=0}=e;(!Number.isFinite(t)||t<=0||t>8||!Number.isFinite(r)||[...n,...a].some(f=>!Number.isFinite(f)))&&hn("invalid part transform"),r!==0&&(i.attachment!=="three_lobe"||i.universal===!0)&&hn("rotation currently requires a FELIPE Tuft material");const s=Math.cos(r),o=Math.sin(r),c=f=>r===0?f.map((v,g)=>Math.fround((v-n[g])*t+n[g]+a[g])):[Math.fround(s*(f[0]-n[0])*t-o*(f[1]-n[1])*t+n[0]+a[0]),Math.fround(o*(f[0]-n[0])*t+s*(f[1]-n[1])*t+n[1]+a[1]),Math.fround((f[2]-n[2])*t+n[2]+a[2])],l=i.geometry.clone(),h=l.getAttribute("position");for(let f=0;f<h.count;f++)h.setXYZ(f,...c([h.getX(f),h.getY(f),h.getZ(f)]));if(!i.fur&&(t!==1||r!==0))for(const f of["delta0","delta1"]){const v=l.getAttribute(f);if(v)for(let g=0;g<v.count;g++)v.setXYZ(g,Math.fround((r===0?v.getX(g):s*v.getX(g)-o*v.getY(g))*t),Math.fround((r===0?v.getY(g):o*v.getX(g)+s*v.getY(g))*t),Math.fround(v.getZ(g)*t))}if(r!==0){for(const v of i.fur?["normal","normal0","delta1"]:["normal","normal0","normal1"]){const g=l.getAttribute(v);if(g)for(let p=0;p<g.count;p++){const m=g.getX(p),M=g.getY(p);g.setXYZ(p,s*m-o*M,o*m+s*M,g.getZ(p))}}const f=l.getAttribute("paletteGeometry");if(!i.fur&&f)for(let v=0;v<f.count;v++){const g=f.getY(v),p=f.getZ(v);f.setY(v,s*g-o*p),f.setZ(v,o*g+s*p)}l.computeBoundingBox(),l.computeBoundingSphere()}const d=Object.fromEntries(Object.entries(i.fields).map(([f,v])=>[f,[...v]])),u=d.paletteBounds;if(u&&(u[2]||u[3])){const f=c([u[0],u[1],0]);u[0]=f[0],u[1]=f[1],u[2]=Math.fround(u[2]/t),u[3]=Math.fround(u[3]/t)}return{...i,geometry:l,fields:d,bounds:r===0?{min:c(i.bounds.min),max:c(i.bounds.max)}:{min:l.boundingBox.min.toArray(),max:l.boundingBox.max.toArray()},pivot:c(i.pivot),attachmentPivot:i.attachmentPivot?c(i.attachmentPivot):i.attachmentPivot}}function ta(i,e){const t=i.geometry.getAttribute("position"),n=i.geometry.getIndex();n||hn("body attachment surface has no triangles");const a=new It,r=new O().fromArray(e),s=new O,o=new O;let c=1/0;for(let l=0;l<n.count;l+=3){a.a.fromBufferAttribute(t,n.getX(l)),a.b.fromBufferAttribute(t,n.getX(l+1)),a.c.fromBufferAttribute(t,n.getX(l+2)),a.closestPointToPoint(r,s);const h=s.distanceToSquared(r);h<c&&(c=h,o.copy(s))}return Number.isFinite(c)||hn("empty body attachment surface"),o.toArray()}function xs(i,e,t,n){const a=i.geometry.getAttribute("position"),r=i.geometry.getIndex();let s=n?-1/0:1/0;if(!r)return s;for(let o=0;o<r.count;o+=3){const c=r.getX(o),l=r.getX(o+1),h=r.getX(o+2),d=a.getX(c),u=a.getZ(c),f=a.getX(l),v=a.getZ(l),g=a.getX(h),p=a.getZ(h),m=(v-p)*(d-g)+(g-f)*(u-p);if(Math.abs(m)<1e-12)continue;const M=((v-p)*(e-g)+(g-f)*(t-p))/m,A=((p-u)*(e-g)+(d-g)*(t-p))/m,w=1-M-A;if(Math.min(M,A,w)<-1e-7)continue;const x=M*a.getY(c)+A*a.getY(l)+w*a.getY(h);s=n?Math.max(s,x):Math.min(s,x)}return s}function bs(i,e){const t=e[0],n=(d,u)=>(d-t.origin[u])*t.scale+t.origin[u]+t.translate[u],a=ca(e.map(d=>({bounds:d.part.bounds}))),r=[0,2].map(d=>Math.max(i.body.bounds.min[d],n(a.min[d],d))),s=[0,2].map(d=>Math.min(i.body.bounds.max[d],n(a.max[d],d)));let o=-1/0,c;const l=(d,u)=>{const f=xs(i.body,d,u,!0),v=(d-t.origin[0]-t.translate[0])/t.scale+t.origin[0],g=(u-t.origin[2]-t.translate[2])/t.scale+t.origin[2],p=Math.min(...e.map(M=>xs(M.part,v,g,!1))),m=f-n(p,1);Number.isFinite(m)&&m>o&&(o=m,c=[d,f,u])};for(let d=0;d<=12;d++)for(let u=0;u<=12;u++)l(r[0]+(s[0]-r[0])*d/12,r[1]+(s[1]-r[1])*u/12);const h=i.body.geometry.getAttribute("position");for(let d=0;d<h.count;d+=Math.max(1,Math.floor(h.count/128)))l(h.getX(d),h.getZ(d));return c?{shift:o,root:c}:void 0}function bp(i,e,t,n,a){if(!t.length)return t;const r=t[0],s=n==="bow"?r.part.pivot:r.part.attachmentPivot;s||hn(`missing ${n} attachment anchor`);const o=d=>{const u=d.map((p,m)=>(p-r.origin[m])*r.scale),f=r.rotationZ??0,v=Math.cos(f),g=Math.sin(f);return[u[0]*v-u[1]*g,u[0]*g+u[1]*v,u[2]].map((p,m)=>p+r.origin[m]+r.translate[m])};let c,l;const h=["felipe_beret","beret","beanie","hat","crown"].includes(n)?bs(i,t):void 0;if(h){const d=bs(e,t.map(({part:u})=>({part:u,scale:1,origin:[0,0,0],translate:[0,0,0]})));c=[0,h.shift-Math.max(0,d?.shift??0)*r.scale-(i.body.bounds.max[1]-i.body.bounds.min[1])*.004,0],l=h.root}else if(n==="headphones"){const d=[0,1,2].map(v=>Ke(e.body.bounds,v)),u=[0,1,2].map(v=>Ke(i.body.bounds,v)),f=o(d);c=u.map((v,g)=>v-f[g]),l=u}else{const d=ta(e.body,s),u=o(d),f=n==="three_lobe"?[a?Ke(i.body.bounds,0)+(i.body.bounds.max[0]-i.body.bounds.min[0])*a.x:u[0],i.body.bounds.max[1]+(r.part.bounds.max[1]-r.part.bounds.min[1])*r.scale*.5,u[2]]:u;l=ta(i.body,f),c=l.map((v,g)=>v-u[g])}return t.map(d=>{const u=d.translate.map((v,g)=>v+c[g]),f=n==="headphones"?ta(i.body,o(d.part.attachmentPivot).map((v,g)=>v+c[g])):l;return{...d,translate:u,attachmentRoot:f}})}const pt=(i,e,t,n,a,r)=>({eyes:{size:i,spread:e,rise:t},tuft:{x:n,scale:a,rotationZ:r*Math.PI/180}}),Sp={circle:pt(1.45,1.55,.015,.06,.95,-15),rounded_triangle:pt(1.3,1.4,-.025,.04,.8,-28),capsule:pt(1.3,1.65,0,-.3,1.05,24),slender:pt(1.25,1.12,.065,-.06,.9,10),pocket:pt(1.1,1.4,.03,.24,.85,-30),petal:pt(1.05,1.15,.015,-.2,.88,22),squircle:pt(1.15,1.4,.035,-.28,1.05,22),rounded_head_two_ears:{...pt(1.28,1,0,.28,.75,-30),singleEyeRise:-.14},circle_two_ears:pt(1.65,1.7,.025,.22,.65,-38),six_lobed_flower:pt(1.05,1.18,0,-.09,.88,10),heart:pt(1.4,1.6,.005,.27,.85,-32),four_lobed_butterfly:pt(1.4,1.45,.015,-.28,.85,24),twelve_scalloped_rosette:pt(1.25,1.4,.005,.12,.85,-20),rounded_cube:pt(1.5,1.65,.015,-.24,.92,20),rounded_diamond:pt(1.35,1.55,-.025,.08,.78,-28),star:pt(1.15,1.2,.045,.015,.7,-15),cloud:pt(1.1,1.55,-.01,.25,.82,-32),shield:pt(1.15,1.2,.035,-.18,.78,25),pebble:pt(1.1,1.25,.02,.15,.9,-35),clippo:pt(1,1,0,.015,1.05,-18)};function $s(i){const e=Sp[i==="todd"?"rounded_head_two_ears":i];if(!e)throw Error(`Missing avatar layout: ${i}`);return e}function wp(i,e,t=!1){if(e==="clippo")return i.face;const n=$s(e),{size:a,spread:r}=n.eyes,s=n.eyes.rise+(t?n.singleEyeRise??0:0),o=i.face.radius*a,c=(i.face.centers[0][0]+i.face.centers[1][0])/2,l=i.body.bounds.max[1]-i.body.bounds.min[1];return{radius:o,centers:i.face.centers.map(([h,d])=>{const u=c+(h-c)*r,f=d+l*s,v=hr(i,u,f);if(!Number.isFinite(v))throw Error(`Eye layout misses body surface: ${e}`);return[u,f,v-o*.3]})}}function Mp(i,e){const[t,n]=i.pieces.filter(d=>!d.fur&&d.category==="eyes");if(!t||!n)throw Error("Missing Cyclops source eye");const a=d=>d.bounds.min.map((u,f)=>(u+d.bounds.max[f])/2),r=e.radius*2,s=[0,1].map(d=>(e.centers[0][d]+e.centers[1][d])/2).concat(Math.max(...e.centers.map(d=>d[2]))+e.radius*.5),o=(d,u,f)=>{const v=a(d);return er(d,{origin:v,scale:u,translate:f.map((g,p)=>g-v[p])})},c=[o(t,r*2/(t.bounds.max[0]-t.bounds.min[0]),s)],l=a(n);let h=c[0].bounds.max[2];for(const[d,[u,f,v]]of[[.57,0,0],[.53,0,0],[.275,0,0],[.065,-.19,.23]].entries()){const g=r*u*2/(n.bounds.max[0]-n.bounds.min[0]),p=[s[0]+f*r,s[1]+v*r,h+.006-(n.bounds.max[2]-l[2])*g],m=o(n,g,p);if(d===1){const M=m.geometry.getAttribute("position");for(let A=0;A<M.count;A++){const w=Math.atan2(M.getY(A)-p[1],M.getX(A)-p[0]),x=.2*Math.sin(w*53)+.09*Math.sin(w*91);for(const S of["normal","normal0","normal1","paletteGeometry"]){const E=m.geometry.getAttribute(S),y=S==="paletteGeometry"?1:0,R=[E.getComponent(A,y)+Math.cos(w)*x,E.getComponent(A,y+1)+Math.sin(w)*x,E.getComponent(A,y+2)],D=Math.hypot(...R);D>1e-8&&R.forEach((P,U)=>E.setComponent(A,y+U,P/D))}}}c.push(m),h=m.bounds.max[2]}return c}function Ep(i,e,t){const n=i.body.attachment==="metal"||i.body.label==="metal",a=n?i:e,r=a.pieces.filter(c=>c.category==="eyes"&&!c.fur);if(r.length!==6)throw Error("Clippo requires two eyes, two pupils and two brows");if(n)return r.map(c=>({donor:a,placement:{part:c,scale:1,origin:[0,0,0],translate:[0,0,0]}}));if(t?.kind!=="clippo-face"||t.eyes.length!==2)throw Error("Missing Clippo construction anchors");const s=i.face;if(!(s.radius>0)||s.centers.length!==2)throw Error("Missing target Clippo face layout");const o=s.radius/.21;return r.map(c=>{const l=(c.bounds.min[0]+c.bounds.max[0])/2<0?0:1,h=t.eyes[l];if(!(h.eyeScale>0)||h.center.length!==3)throw Error("Invalid Clippo source eye scale");const d=s.centers[l].map((u,f)=>u+(f===2?.14*o:0));return{donor:e,placement:{part:c,scale:o/h.eyeScale,origin:h.center,translate:d.map((u,f)=>u-h.center[f])}}})}function Rp(i){const e=Math.fround;return[...[0,1].map(t=>e(e(i.min[t]+i.max[t])*.5)),...[0,1].map(t=>e(e(e(e(i.max[t]-i.min[t])*.5)*e(t?1.1:1.16))+e(.008)))]}const Tp=new URL("../assets/geometry-BTFa17wc.bin",import.meta.url).href,Ap=new URL("../assets/geometry-OwRO3lfs.json",import.meta.url).href,Cp=""+new URL("../assets/material-CWbv_tbJ.json",import.meta.url).href,Lp=new URL("../assets/geometry-WoKw8CFo.bin",import.meta.url).href,Pp=new URL("../assets/geometry-DXSwvN0_.json",import.meta.url).href,Dp=""+new URL("../assets/material-CXKfD_Dd.json",import.meta.url).href,Up=new URL("../assets/geometry-Dv6FfOeJ.bin",import.meta.url).href,Ip=new URL("../assets/geometry-DzNZ-Mt3.json",import.meta.url).href,Fp=""+new URL("../assets/material-BFI-3LHv.json",import.meta.url).href,Np=new URL("../assets/geometry-B4ElBbg3.bin",import.meta.url).href,Bp=new URL("../assets/geometry-BqhQRk1W.json",import.meta.url).href,Op=""+new URL("../assets/material-BVRQKC7I.json",import.meta.url).href,zp=new URL("../assets/geometry-HrE6xacc.bin",import.meta.url).href,kp=new URL("../assets/geometry-BL75SZM_.json",import.meta.url).href,Gp=""+new URL("../assets/material-DfSqePut.json",import.meta.url).href,Vp=new URL("../assets/geometry-t60HcdL1.bin",import.meta.url).href,Hp=new URL("../assets/geometry-DEbVqYnX.json",import.meta.url).href,Wp=""+new URL("../assets/material-R4facdQH.json",import.meta.url).href,Xp=new URL("../assets/geometry-DjOuGBLx.bin",import.meta.url).href,jp=new URL("../assets/geometry-BjeeHY8_.json",import.meta.url).href,qp=""+new URL("../assets/material-LTv2F1Vo.json",import.meta.url).href,Yp=new URL("../assets/geometry-KkiZzq02.bin",import.meta.url).href,$p=new URL("../assets/geometry-DKzkp4Jj.json",import.meta.url).href,Kp=""+new URL("../assets/material-DiVOB9ms.json",import.meta.url).href,Zp=new URL("../assets/geometry-C8mRYEXR.bin",import.meta.url).href,Jp=new URL("../assets/geometry-izH6aKKy.json",import.meta.url).href,Qp=""+new URL("../assets/material-BoaEMhW2.json",import.meta.url).href,em=new URL("../assets/geometry-CO6mKd2l.bin",import.meta.url).href,tm=new URL("../assets/geometry-DmeKCdAi.json",import.meta.url).href,nm=""+new URL("../assets/material-19-_S_wi.json",import.meta.url).href,im=new URL("../assets/geometry-CUk83oaL.bin",import.meta.url).href,am=new URL("../assets/geometry-DvRcqPwe.json",import.meta.url).href,rm=""+new URL("../assets/material-CmyfCZYK.json",import.meta.url).href,sm=new URL("../assets/geometry-BLkOFRHM.bin",import.meta.url).href,om=new URL("../assets/geometry-ByWVyM3q.json",import.meta.url).href,lm=""+new URL("../assets/material-srTN7chL.json",import.meta.url).href,cm=new URL("../assets/geometry-S-S5dyBW.bin",import.meta.url).href,um=new URL("../assets/geometry-DOdbnlJm.json",import.meta.url).href,hm=""+new URL("../assets/material-kSAVIxbx.json",import.meta.url).href,dm=new URL("../assets/geometry-BlM7WBLk.bin",import.meta.url).href,fm=new URL("../assets/geometry-Dipwd9su.json",import.meta.url).href,pm=""+new URL("../assets/material-DaNSvDOI.json",import.meta.url).href,mm=new URL("../assets/geometry-DDYIC6aS.bin",import.meta.url).href,vm=new URL("../assets/geometry-BUrN-K_g.json",import.meta.url).href,gm=""+new URL("../assets/material-6raYOKQ_.json",import.meta.url).href,_m=new URL("../assets/geometry-D34g7-N1.bin",import.meta.url).href,ym=new URL("../assets/geometry-C_l60Ao3.json",import.meta.url).href,xm=""+new URL("../assets/material-CWtgq7Jt.json",import.meta.url).href,bm=new URL("../assets/geometry-xGrmeeG4.bin",import.meta.url).href,Sm=new URL("../assets/geometry-CLSmQmoi.json",import.meta.url).href,wm=""+new URL("../assets/material-CQ6_IPcI.json",import.meta.url).href,Mm=new URL("../assets/geometry-Dy1TW2PB.bin",import.meta.url).href,Em=new URL("../assets/geometry-BxnJV3QV.json",import.meta.url).href,Rm=""+new URL("../assets/material-DWyWg7oh.json",import.meta.url).href,Tm=new URL("../assets/geometry-DtrwGhZn.bin",import.meta.url).href,Am=new URL("../assets/geometry-uYIBU3ov.json",import.meta.url).href,Cm=""+new URL("../assets/material-DTaAF6ek.json",import.meta.url).href,Lm=new URL("../assets/geometry-DhPPTBok.bin",import.meta.url).href,Pm=new URL("../assets/geometry-YgBg_ld2.json",import.meta.url).href,Dm=""+new URL("../assets/material-CXrCte2w.json",import.meta.url).href,Um=new URL("../assets/geometry-DOHj_FT2.bin",import.meta.url).href,Im=new URL("../assets/geometry-CPonTa4R.json",import.meta.url).href,Fm=""+new URL("../assets/material-Pza9ndlv.json",import.meta.url).href,Nm=new URL("../assets/geometry-Bz_GAoyM.bin",import.meta.url).href,Bm=new URL("../assets/geometry-G9MJMq4p.json",import.meta.url).href,Om=""+new URL("../assets/material-JmNDC229.json",import.meta.url).href,zm=new URL("../assets/geometry-DDYIC6aS.bin",import.meta.url).href,km=new URL("../assets/geometry-Cp4M6i7D.json",import.meta.url).href,Gm=""+new URL("../assets/material-OZX_63TY.json",import.meta.url).href,Vm=new URL("../assets/geometry-D34g7-N1.bin",import.meta.url).href,Hm=new URL("../assets/geometry-BX0WQIX1.json",import.meta.url).href,Wm=""+new URL("../assets/material-CqDfLwek.json",import.meta.url).href,Xm=new URL("../assets/geometry-qC0vHX1L.bin",import.meta.url).href,jm=new URL("../assets/geometry-JshxaVrE.json",import.meta.url).href,qm=""+new URL("../assets/material-BcyqpYt_.json",import.meta.url).href,Ym=new URL("../assets/geometry-DflTC8wk.bin",import.meta.url).href,$m=new URL("../assets/geometry-SeWAXhPD.json",import.meta.url).href,Km=""+new URL("../assets/material-BRVEzlCc.json",import.meta.url).href,Zm=new URL("../assets/geometry-CLsBB4WQ.bin",import.meta.url).href,Jm=new URL("../assets/geometry-VeJsBHjy.json",import.meta.url).href,Qm=""+new URL("../assets/material-CSzKN9Ul.json",import.meta.url).href,ev=new URL("../assets/geometry-Bul-YatC.bin",import.meta.url).href,tv=new URL("../assets/geometry-DVFTEJuV.json",import.meta.url).href,nv=""+new URL("../assets/material-BPenrW2m.json",import.meta.url).href,iv=new URL("../assets/geometry-shvoryLJ.bin",import.meta.url).href,av=new URL("../assets/geometry-BFufagPo.json",import.meta.url).href,rv=""+new URL("../assets/material-CQpmrHLw.json",import.meta.url).href,sv=new URL("../assets/geometry-DB6wVIcA.bin",import.meta.url).href,ov=new URL("../assets/geometry-FPnZi4PF.json",import.meta.url).href,lv=""+new URL("../assets/material-CjnmFEnQ.json",import.meta.url).href,cv=new URL("../assets/geometry-Li6zPuT1.bin",import.meta.url).href,uv=new URL("../assets/geometry-Porl2AZP.json",import.meta.url).href,hv=""+new URL("../assets/material-BEz3iia9.json",import.meta.url).href,dv=new URL("../assets/geometry-JepB0EWi.bin",import.meta.url).href,fv=new URL("../assets/geometry-BZ-TUYgp.json",import.meta.url).href,pv=""+new URL("../assets/material-BBbCYYFe.json",import.meta.url).href,mv=new URL("../assets/geometry-C4KIFesq.bin",import.meta.url).href,vv=new URL("../assets/geometry-COojCaI-.json",import.meta.url).href,gv=""+new URL("../assets/material-CXYNmTik.json",import.meta.url).href,_v=new URL("../assets/geometry-BK-mUcZb.bin",import.meta.url).href,yv=new URL("../assets/geometry-CV3YgDWK.json",import.meta.url).href,xv=""+new URL("../assets/material-BSBcnXaC.json",import.meta.url).href,bv=new URL("../assets/geometry-DZ4Y7GDU.bin",import.meta.url).href,Sv=new URL("../assets/geometry-BxHzNqZH.json",import.meta.url).href,wv=""+new URL("../assets/material-D1Wb0xpI.json",import.meta.url).href,Mv=new URL("../assets/geometry-wsfA6sgp.bin",import.meta.url).href,Ev=new URL("../assets/geometry-CdNScfXH.json",import.meta.url).href,Rv=""+new URL("../assets/material-Dd9hHI7n.json",import.meta.url).href,Tv=new URL("../assets/geometry-CCHuX_wE.bin",import.meta.url).href,Av=new URL("../assets/geometry-BmS6kE2Y.json",import.meta.url).href,Cv=""+new URL("../assets/material-DdMEm9Aa.json",import.meta.url).href,Lv=new URL("../assets/geometry-DVmtlcIg.bin",import.meta.url).href,Pv=new URL("../assets/geometry-6TdxPxgj.json",import.meta.url).href,Dv=""+new URL("../assets/material-B2vVSbXc.json",import.meta.url).href,Uv=new URL("../assets/geometry-B3rw-nBE.bin",import.meta.url).href,Iv=new URL("../assets/geometry-_m25dele.json",import.meta.url).href,Fv=""+new URL("../assets/material-DSs7CUDy.json",import.meta.url).href,Nv=new URL("../assets/geometry-BAvWe66A.bin",import.meta.url).href,Bv=new URL("../assets/geometry-DtHo7UJU.json",import.meta.url).href,Ov=""+new URL("../assets/material-BzPY7sJY.json",import.meta.url).href,zv=new URL("../assets/geometry-GwbntpyN.bin",import.meta.url).href,kv=new URL("../assets/geometry-DQnebIlC.json",import.meta.url).href,Gv=""+new URL("../assets/material-C2qH4Bdi.json",import.meta.url).href,Vv=new URL("../assets/geometry-DrHGMxlj.bin",import.meta.url).href,Hv=new URL("../assets/geometry-Dh2fQyuC.json",import.meta.url).href,Wv=""+new URL("../assets/material-Dyu0C8g-.json",import.meta.url).href,Xv=new URL("../assets/geometry-DgmRDiaT.bin",import.meta.url).href,jv=new URL("../assets/geometry-DhHiJoKx.json",import.meta.url).href,qv=""+new URL("../assets/material--Y5xXkag.json",import.meta.url).href,Yv=new URL("../assets/geometry-OqRIHaM_.bin",import.meta.url).href,$v=new URL("../assets/geometry-CjlztW-F.json",import.meta.url).href,Kv=""+new URL("../assets/material-7p24nenI.json",import.meta.url).href,Zv=new URL("../assets/geometry-CQAwAt2H.bin",import.meta.url).href,Jv=new URL("../assets/geometry-D1698zrF.json",import.meta.url).href,Qv=""+new URL("../assets/material-_1mBOAqr.json",import.meta.url).href,eg=new URL("../assets/geometry-Cgtbkld_.bin",import.meta.url).href,tg=new URL("../assets/geometry-BHbzMsJl.json",import.meta.url).href,ng=""+new URL("../assets/material-CSVMbfIn.json",import.meta.url).href,ig=new URL("../assets/geometry-HyEmlJw-.bin",import.meta.url).href,ag=new URL("../assets/geometry-BN0EO417.json",import.meta.url).href,rg=""+new URL("../assets/material-UdyZZ8oz.json",import.meta.url).href,sg=new URL("../assets/geometry-Bgf8shsq.bin",import.meta.url).href,og=new URL("../assets/geometry-fM95txkV.json",import.meta.url).href,lg=""+new URL("../assets/material-BM4slwr6.json",import.meta.url).href,cg=new URL("../assets/geometry-ChoRT0Or.bin",import.meta.url).href,ug=new URL("../assets/geometry-CmlmLnip.json",import.meta.url).href,hg=""+new URL("../assets/material-PfBrUyFh.json",import.meta.url).href,dg=new URL("../assets/geometry-cNLGJ4Th.bin",import.meta.url).href,fg=new URL("../assets/geometry-C0Ipuv67.json",import.meta.url).href,pg=""+new URL("../assets/material-Dkeu2xFP.json",import.meta.url).href,mg=new URL("../assets/geometry-CF49H-qx.bin",import.meta.url).href,vg=new URL("../assets/geometry-fLZMIDMW.json",import.meta.url).href,gg=""+new URL("../assets/material-Dqtf8qW0.json",import.meta.url).href,_g=new URL("../assets/geometry-DgT-GMym.bin",import.meta.url).href,yg=new URL("../assets/geometry-BflYNi7y.json",import.meta.url).href,xg=""+new URL("../assets/material-D9yGEOsK.json",import.meta.url).href,bg=new URL("../assets/geometry-D2yN9d1k.bin",import.meta.url).href,Sg=new URL("../assets/geometry-CTKL67_v.json",import.meta.url).href,wg=""+new URL("../assets/material-CF4_k2RB.json",import.meta.url).href,Mg=new URL("../assets/geometry-BPHd7mmZ.bin",import.meta.url).href,Eg=new URL("../assets/geometry-CG7QERBM.json",import.meta.url).href,Rg=""+new URL("../assets/material-Bw0IHv3e.json",import.meta.url).href,Tg=new URL("../assets/geometry-BBKPx19i.bin",import.meta.url).href,Ag=new URL("../assets/geometry-CMY3Ubye.json",import.meta.url).href,Cg=""+new URL("../assets/material-nJaxzG7X.json",import.meta.url).href,Lg=new URL("../assets/geometry-C21JgGNl.bin",import.meta.url).href,Pg=new URL("../assets/geometry-DfVzt42m.json",import.meta.url).href,Dg=""+new URL("../assets/material-rLqbiik1.json",import.meta.url).href,Ug=new URL("../assets/geometry-CbMNspJw.bin",import.meta.url).href,Ig=new URL("../assets/geometry-Cixj09DK.json",import.meta.url).href,Fg=""+new URL("../assets/material-6RNaBXJp.json",import.meta.url).href,Ng=new URL("../assets/geometry-CxG-LMks.bin",import.meta.url).href,Bg=new URL("../assets/geometry-CPR45hPn.json",import.meta.url).href,Og=""+new URL("../assets/material-Lz00GJeg.json",import.meta.url).href,zg=new URL("../assets/geometry-V5mpIThN.bin",import.meta.url).href,kg=new URL("../assets/geometry-CIkXNP86.json",import.meta.url).href,Gg=""+new URL("../assets/material-CJzPgH8p.json",import.meta.url).href,Vg=new URL("../assets/geometry-Djz7eF4I.bin",import.meta.url).href,Hg=new URL("../assets/geometry-h6NOrGlq.json",import.meta.url).href,Wg=""+new URL("../assets/material-BjTWxFgz.json",import.meta.url).href,Xg=new URL("../assets/geometry-DduJlEir.bin",import.meta.url).href,jg=new URL("../assets/geometry-BImfoL89.json",import.meta.url).href,qg=""+new URL("../assets/material-2lVmfC1N.json",import.meta.url).href,Yg=new URL("../assets/geometry-LFXDWtqt.bin",import.meta.url).href,$g=new URL("../assets/geometry-Be4UAG7U.json",import.meta.url).href,Kg=""+new URL("../assets/material-DSUAmpZP.json",import.meta.url).href,Zg=new URL("../assets/geometry-DqEPsDlZ.bin",import.meta.url).href,Jg=new URL("../assets/geometry-DbxKX1xO.json",import.meta.url).href,Qg=""+new URL("../assets/material-Bno-8C0W.json",import.meta.url).href,e_=new URL("../assets/geometry-9ZRUVyI6.bin",import.meta.url).href,t_=new URL("../assets/geometry-BgqtWpq-.json",import.meta.url).href,n_=""+new URL("../assets/material-DkG9mGhM.json",import.meta.url).href,i_=new URL("../assets/geometry-GAwYraYf.bin",import.meta.url).href,a_=new URL("../assets/geometry-DRte854E.json",import.meta.url).href,r_=""+new URL("../assets/material-CtIpo9uK.json",import.meta.url).href,s_=new URL("../assets/geometry-BThansED.bin",import.meta.url).href,o_=new URL("../assets/geometry-BcFSb4Zh.json",import.meta.url).href,l_=""+new URL("../assets/material-6Y7KjP14.json",import.meta.url).href,c_=new URL("../assets/geometry-C97Wb59S.bin",import.meta.url).href,u_=new URL("../assets/geometry-B-4gSjl0.json",import.meta.url).href,h_=""+new URL("../assets/material-DQb1nmnR.json",import.meta.url).href,d_=new URL("../assets/geometry-CYUUVO9z.bin",import.meta.url).href,f_=new URL("../assets/geometry-DNFhaOig.json",import.meta.url).href,p_=""+new URL("../assets/material-BY0IrCGd.json",import.meta.url).href,m_=new URL("../assets/geometry-DTrxDt9C.bin",import.meta.url).href,v_=new URL("../assets/geometry-D8niMYQ_.json",import.meta.url).href,g_=""+new URL("../assets/material-DyWFR3h1.json",import.meta.url).href,__=new URL("../assets/geometry-BYEy-j3u.bin",import.meta.url).href,y_=new URL("../assets/geometry-BWxGSzzt.json",import.meta.url).href,x_=""+new URL("../assets/material-CpMPTBuF.json",import.meta.url).href,b_=new URL("../assets/geometry-BrxF-osz.bin",import.meta.url).href,S_=new URL("../assets/geometry-jh7lV-uw.json",import.meta.url).href,w_=""+new URL("../assets/material-Cfex3Ql_.json",import.meta.url).href,M_=new URL("../assets/geometry-B7FAzS1F.bin",import.meta.url).href,E_=new URL("../assets/geometry-2pURe-Kn.json",import.meta.url).href,R_=""+new URL("../assets/material-DEaKHfDN.json",import.meta.url).href,T_=new URL("../assets/geometry-BiK7FtQX.bin",import.meta.url).href,A_=new URL("../assets/geometry-BsWKJT6i.json",import.meta.url).href,C_=""+new URL("../assets/material-yBISC-jU.json",import.meta.url).href,L_=new URL("../assets/geometry-BMPV_Hsg.bin",import.meta.url).href,P_=new URL("../assets/geometry-Hap2bo7L.json",import.meta.url).href,D_=""+new URL("../assets/material-BcYkk3ll.json",import.meta.url).href,U_=new URL("../assets/geometry-DDYIC6aS.bin",import.meta.url).href,I_=new URL("../assets/geometry-BNMzmgll.json",import.meta.url).href,F_=""+new URL("../assets/material-CixhQnYS.json",import.meta.url).href,N_=new URL("../assets/geometry-D34g7-N1.bin",import.meta.url).href,B_=new URL("../assets/geometry-D9lF6FLH.json",import.meta.url).href,O_=""+new URL("../assets/material-BkMsbnL9.json",import.meta.url).href,z_=new URL("../assets/geometry-CQAwAt2H.bin",import.meta.url).href,k_=new URL("../assets/geometry-CTsuyrDZ.json",import.meta.url).href,G_=""+new URL("../assets/material-HrT5tD94.json",import.meta.url).href,V_=new URL("../assets/geometry-Cgtbkld_.bin",import.meta.url).href,H_=new URL("../assets/geometry-CrvwbE-6.json",import.meta.url).href,W_=""+new URL("../assets/material-BSnkxnpl.json",import.meta.url).href,X_=new URL("../assets/geometry-DAZa6NBL.bin",import.meta.url).href,j_=new URL("../assets/geometry-DSyduoFt.json",import.meta.url).href,q_=""+new URL("../assets/material-dDBJCy9-.json",import.meta.url).href,Y_=new URL("../assets/geometry-ClI8rpFr.bin",import.meta.url).href,$_=new URL("../assets/geometry-C_7Z-X7j.json",import.meta.url).href,K_=""+new URL("../assets/material-DEKjTM3C.json",import.meta.url).href,Z_=new URL("../assets/geometry-D7GAMkpP.bin",import.meta.url).href,J_=new URL("../assets/geometry-C7x8IeHX.json",import.meta.url).href,Q_=""+new URL("../assets/material-D4i1hBC1.json",import.meta.url).href,e1=new URL("../assets/geometry-T-7IYkmQ.bin",import.meta.url).href,t1=new URL("../assets/geometry-BlmVRd3r.json",import.meta.url).href,n1=""+new URL("../assets/material-CIbmVcQQ.json",import.meta.url).href,i1=new URL("../assets/geometry-BsAr1mz-.bin",import.meta.url).href,a1=new URL("../assets/geometry-DRSEz9lw.json",import.meta.url).href,r1=""+new URL("../assets/material-BNp8l0oa.json",import.meta.url).href,s1=new URL("../assets/geometry-CuSwc6Vq.bin",import.meta.url).href,o1=new URL("../assets/geometry-CYID7hnN.json",import.meta.url).href,l1=""+new URL("../assets/material-DLSM1AwK.json",import.meta.url).href,c1=new URL("../assets/geometry-V5mpIThN.bin",import.meta.url).href,u1=new URL("../assets/geometry-H8JzNDU1.json",import.meta.url).href,h1=""+new URL("../assets/material-DQslPigd.json",import.meta.url).href,d1=new URL("../assets/geometry-Djz7eF4I.bin",import.meta.url).href,f1=new URL("../assets/geometry-DTRcWIBb.json",import.meta.url).href,p1=""+new URL("../assets/material-Bu1beJit.json",import.meta.url).href,m1=new URL("../assets/geometry-DZvNtSgq.bin",import.meta.url).href,v1=new URL("../assets/geometry-CAxTQj9F.json",import.meta.url).href,g1=""+new URL("../assets/material-DuDpMyEA.json",import.meta.url).href,_1=new URL("../assets/geometry-CXPF8M1d.bin",import.meta.url).href,y1=new URL("../assets/geometry-BqrHvByf.json",import.meta.url).href,x1=""+new URL("../assets/material-CVSRBAW3.json",import.meta.url).href,b1=new URL("../assets/geometry-DRrKS7_i.bin",import.meta.url).href,S1=new URL("../assets/geometry-QAcgG-n2.json",import.meta.url).href,w1=""+new URL("../assets/material-CdgPz2Ze.json",import.meta.url).href,M1=new URL("../assets/geometry-BD4lLBTf.bin",import.meta.url).href,E1=new URL("../assets/geometry-DibZ314G.json",import.meta.url).href,R1=""+new URL("../assets/material-B0RKr4tz.json",import.meta.url).href,T1=new URL("../assets/geometry-DDYIC6aS.bin",import.meta.url).href,A1=new URL("../assets/geometry-Dn3tdd69.json",import.meta.url).href,C1=""+new URL("../assets/material-BKybwRJl.json",import.meta.url).href,L1=new URL("../assets/geometry-D34g7-N1.bin",import.meta.url).href,P1=new URL("../assets/geometry-BLcYALBV.json",import.meta.url).href,D1=""+new URL("../assets/material-BEKpGaDX.json",import.meta.url).href,U1=new URL("../assets/geometry-DQBDgAad.bin",import.meta.url).href,I1=new URL("../assets/geometry-CQ8TViEm.json",import.meta.url).href,F1=""+new URL("../assets/material-n1BkoPp2.json",import.meta.url).href,N1=new URL("../assets/geometry-uCngZTcL.bin",import.meta.url).href,B1=new URL("../assets/geometry-DW5Zl8BW.json",import.meta.url).href,O1=""+new URL("../assets/material-BsCoypig.json",import.meta.url).href,z1=new URL("../assets/geometry-CpYs-xNI.bin",import.meta.url).href,k1=new URL("../assets/geometry-fKdprFWD.json",import.meta.url).href,G1=""+new URL("../assets/material-DzSpmvA1.json",import.meta.url).href,V1=new URL("../assets/geometry-C7QFQ1BU.bin",import.meta.url).href,H1=new URL("../assets/geometry-Cvq411cH.json",import.meta.url).href,W1=""+new URL("../assets/material-B6XMTn8L.json",import.meta.url).href,X1=new URL("../assets/geometry-7BHXPH-R.bin",import.meta.url).href,j1=new URL("../assets/geometry-DDDfxj8N.json",import.meta.url).href,q1=""+new URL("../assets/material-BklD9Aiu.json",import.meta.url).href,Y1=new URL("../assets/geometry-LUw4F0gC.bin",import.meta.url).href,$1=new URL("../assets/geometry-OaPBQTNZ.json",import.meta.url).href,K1=""+new URL("../assets/material-D7utDAQY.json",import.meta.url).href,Z1=""+new URL("../assets/index-PiPWqvvK.json",import.meta.url).href,J1=Object.assign({"./assets/catalog-library/accessory/beanie/high/geometry.bin":Tp,"./assets/catalog-library/accessory/beanie/high/geometry.json":Ap,"./assets/catalog-library/accessory/beanie/high/material.json":Cp,"./assets/catalog-library/accessory/beanie/low/geometry.bin":Lp,"./assets/catalog-library/accessory/beanie/low/geometry.json":Pp,"./assets/catalog-library/accessory/beanie/low/material.json":Dp,"./assets/catalog-library/accessory/beret/high/geometry.bin":Up,"./assets/catalog-library/accessory/beret/high/geometry.json":Ip,"./assets/catalog-library/accessory/beret/high/material.json":Fp,"./assets/catalog-library/accessory/beret/low/geometry.bin":Np,"./assets/catalog-library/accessory/beret/low/geometry.json":Bp,"./assets/catalog-library/accessory/beret/low/material.json":Op,"./assets/catalog-library/accessory/bow/high/geometry.bin":zp,"./assets/catalog-library/accessory/bow/high/geometry.json":kp,"./assets/catalog-library/accessory/bow/high/material.json":Gp,"./assets/catalog-library/accessory/bow/low/geometry.bin":Vp,"./assets/catalog-library/accessory/bow/low/geometry.json":Hp,"./assets/catalog-library/accessory/bow/low/material.json":Wp,"./assets/catalog-library/accessory/crown/high/geometry.bin":Xp,"./assets/catalog-library/accessory/crown/high/geometry.json":jp,"./assets/catalog-library/accessory/crown/high/material.json":qp,"./assets/catalog-library/accessory/crown/low/geometry.bin":Yp,"./assets/catalog-library/accessory/crown/low/geometry.json":$p,"./assets/catalog-library/accessory/crown/low/material.json":Kp,"./assets/catalog-library/accessory/felipe_beret/high/geometry.bin":Zp,"./assets/catalog-library/accessory/felipe_beret/high/geometry.json":Jp,"./assets/catalog-library/accessory/felipe_beret/high/material.json":Qp,"./assets/catalog-library/accessory/felipe_beret/low/geometry.bin":em,"./assets/catalog-library/accessory/felipe_beret/low/geometry.json":tm,"./assets/catalog-library/accessory/felipe_beret/low/material.json":nm,"./assets/catalog-library/accessory/hat/high/geometry.bin":im,"./assets/catalog-library/accessory/hat/high/geometry.json":am,"./assets/catalog-library/accessory/hat/high/material.json":rm,"./assets/catalog-library/accessory/hat/low/geometry.bin":sm,"./assets/catalog-library/accessory/hat/low/geometry.json":om,"./assets/catalog-library/accessory/hat/low/material.json":lm,"./assets/catalog-library/accessory/headphones/high/geometry.bin":cm,"./assets/catalog-library/accessory/headphones/high/geometry.json":um,"./assets/catalog-library/accessory/headphones/high/material.json":hm,"./assets/catalog-library/accessory/headphones/low/geometry.bin":dm,"./assets/catalog-library/accessory/headphones/low/geometry.json":fm,"./assets/catalog-library/accessory/headphones/low/material.json":pm,"./assets/catalog-library/accessory/none/high/geometry.bin":mm,"./assets/catalog-library/accessory/none/high/geometry.json":vm,"./assets/catalog-library/accessory/none/high/material.json":gm,"./assets/catalog-library/accessory/none/low/geometry.bin":_m,"./assets/catalog-library/accessory/none/low/geometry.json":ym,"./assets/catalog-library/accessory/none/low/material.json":xm,"./assets/catalog-library/accessory/orb/high/geometry.bin":bm,"./assets/catalog-library/accessory/orb/high/geometry.json":Sm,"./assets/catalog-library/accessory/orb/high/material.json":wm,"./assets/catalog-library/accessory/orb/low/geometry.bin":Mm,"./assets/catalog-library/accessory/orb/low/geometry.json":Em,"./assets/catalog-library/accessory/orb/low/material.json":Rm,"./assets/catalog-library/accessory/three_lobe/high/geometry.bin":Tm,"./assets/catalog-library/accessory/three_lobe/high/geometry.json":Am,"./assets/catalog-library/accessory/three_lobe/high/material.json":Cm,"./assets/catalog-library/accessory/three_lobe/low/geometry.bin":Lm,"./assets/catalog-library/accessory/three_lobe/low/geometry.json":Pm,"./assets/catalog-library/accessory/three_lobe/low/material.json":Dm,"./assets/catalog-library/body/capsule/high/geometry.bin":Um,"./assets/catalog-library/body/capsule/high/geometry.json":Im,"./assets/catalog-library/body/capsule/high/material.json":Fm,"./assets/catalog-library/body/capsule/low/geometry.bin":Nm,"./assets/catalog-library/body/capsule/low/geometry.json":Bm,"./assets/catalog-library/body/capsule/low/material.json":Om,"./assets/catalog-library/body/circle/high/geometry.bin":zm,"./assets/catalog-library/body/circle/high/geometry.json":km,"./assets/catalog-library/body/circle/high/material.json":Gm,"./assets/catalog-library/body/circle/low/geometry.bin":Vm,"./assets/catalog-library/body/circle/low/geometry.json":Hm,"./assets/catalog-library/body/circle/low/material.json":Wm,"./assets/catalog-library/body/circle_two_ears/high/geometry.bin":Xm,"./assets/catalog-library/body/circle_two_ears/high/geometry.json":jm,"./assets/catalog-library/body/circle_two_ears/high/material.json":qm,"./assets/catalog-library/body/circle_two_ears/low/geometry.bin":Ym,"./assets/catalog-library/body/circle_two_ears/low/geometry.json":$m,"./assets/catalog-library/body/circle_two_ears/low/material.json":Km,"./assets/catalog-library/body/clippo/high/geometry.bin":Zm,"./assets/catalog-library/body/clippo/high/geometry.json":Jm,"./assets/catalog-library/body/clippo/high/material.json":Qm,"./assets/catalog-library/body/clippo/low/geometry.bin":ev,"./assets/catalog-library/body/clippo/low/geometry.json":tv,"./assets/catalog-library/body/clippo/low/material.json":nv,"./assets/catalog-library/body/cloud/high/geometry.bin":iv,"./assets/catalog-library/body/cloud/high/geometry.json":av,"./assets/catalog-library/body/cloud/high/material.json":rv,"./assets/catalog-library/body/cloud/low/geometry.bin":sv,"./assets/catalog-library/body/cloud/low/geometry.json":ov,"./assets/catalog-library/body/cloud/low/material.json":lv,"./assets/catalog-library/body/four_lobed_butterfly/high/geometry.bin":cv,"./assets/catalog-library/body/four_lobed_butterfly/high/geometry.json":uv,"./assets/catalog-library/body/four_lobed_butterfly/high/material.json":hv,"./assets/catalog-library/body/four_lobed_butterfly/low/geometry.bin":dv,"./assets/catalog-library/body/four_lobed_butterfly/low/geometry.json":fv,"./assets/catalog-library/body/four_lobed_butterfly/low/material.json":pv,"./assets/catalog-library/body/heart/high/geometry.bin":mv,"./assets/catalog-library/body/heart/high/geometry.json":vv,"./assets/catalog-library/body/heart/high/material.json":gv,"./assets/catalog-library/body/heart/low/geometry.bin":_v,"./assets/catalog-library/body/heart/low/geometry.json":yv,"./assets/catalog-library/body/heart/low/material.json":xv,"./assets/catalog-library/body/pebble/high/geometry.bin":bv,"./assets/catalog-library/body/pebble/high/geometry.json":Sv,"./assets/catalog-library/body/pebble/high/material.json":wv,"./assets/catalog-library/body/pebble/low/geometry.bin":Mv,"./assets/catalog-library/body/pebble/low/geometry.json":Ev,"./assets/catalog-library/body/pebble/low/material.json":Rv,"./assets/catalog-library/body/petal/high/geometry.bin":Tv,"./assets/catalog-library/body/petal/high/geometry.json":Av,"./assets/catalog-library/body/petal/high/material.json":Cv,"./assets/catalog-library/body/petal/low/geometry.bin":Lv,"./assets/catalog-library/body/petal/low/geometry.json":Pv,"./assets/catalog-library/body/petal/low/material.json":Dv,"./assets/catalog-library/body/pocket/high/geometry.bin":Uv,"./assets/catalog-library/body/pocket/high/geometry.json":Iv,"./assets/catalog-library/body/pocket/high/material.json":Fv,"./assets/catalog-library/body/pocket/low/geometry.bin":Nv,"./assets/catalog-library/body/pocket/low/geometry.json":Bv,"./assets/catalog-library/body/pocket/low/material.json":Ov,"./assets/catalog-library/body/rounded_cube/high/geometry.bin":zv,"./assets/catalog-library/body/rounded_cube/high/geometry.json":kv,"./assets/catalog-library/body/rounded_cube/high/material.json":Gv,"./assets/catalog-library/body/rounded_cube/low/geometry.bin":Vv,"./assets/catalog-library/body/rounded_cube/low/geometry.json":Hv,"./assets/catalog-library/body/rounded_cube/low/material.json":Wv,"./assets/catalog-library/body/rounded_diamond/high/geometry.bin":Xv,"./assets/catalog-library/body/rounded_diamond/high/geometry.json":jv,"./assets/catalog-library/body/rounded_diamond/high/material.json":qv,"./assets/catalog-library/body/rounded_diamond/low/geometry.bin":Yv,"./assets/catalog-library/body/rounded_diamond/low/geometry.json":$v,"./assets/catalog-library/body/rounded_diamond/low/material.json":Kv,"./assets/catalog-library/body/rounded_head_two_ears/high/geometry.bin":Zv,"./assets/catalog-library/body/rounded_head_two_ears/high/geometry.json":Jv,"./assets/catalog-library/body/rounded_head_two_ears/high/material.json":Qv,"./assets/catalog-library/body/rounded_head_two_ears/low/geometry.bin":eg,"./assets/catalog-library/body/rounded_head_two_ears/low/geometry.json":tg,"./assets/catalog-library/body/rounded_head_two_ears/low/material.json":ng,"./assets/catalog-library/body/rounded_triangle/high/geometry.bin":ig,"./assets/catalog-library/body/rounded_triangle/high/geometry.json":ag,"./assets/catalog-library/body/rounded_triangle/high/material.json":rg,"./assets/catalog-library/body/rounded_triangle/low/geometry.bin":sg,"./assets/catalog-library/body/rounded_triangle/low/geometry.json":og,"./assets/catalog-library/body/rounded_triangle/low/material.json":lg,"./assets/catalog-library/body/shield/high/geometry.bin":cg,"./assets/catalog-library/body/shield/high/geometry.json":ug,"./assets/catalog-library/body/shield/high/material.json":hg,"./assets/catalog-library/body/shield/low/geometry.bin":dg,"./assets/catalog-library/body/shield/low/geometry.json":fg,"./assets/catalog-library/body/shield/low/material.json":pg,"./assets/catalog-library/body/six_lobed_flower/high/geometry.bin":mg,"./assets/catalog-library/body/six_lobed_flower/high/geometry.json":vg,"./assets/catalog-library/body/six_lobed_flower/high/material.json":gg,"./assets/catalog-library/body/six_lobed_flower/low/geometry.bin":_g,"./assets/catalog-library/body/six_lobed_flower/low/geometry.json":yg,"./assets/catalog-library/body/six_lobed_flower/low/material.json":xg,"./assets/catalog-library/body/slender/high/geometry.bin":bg,"./assets/catalog-library/body/slender/high/geometry.json":Sg,"./assets/catalog-library/body/slender/high/material.json":wg,"./assets/catalog-library/body/slender/low/geometry.bin":Mg,"./assets/catalog-library/body/slender/low/geometry.json":Eg,"./assets/catalog-library/body/slender/low/material.json":Rg,"./assets/catalog-library/body/squircle/high/geometry.bin":Tg,"./assets/catalog-library/body/squircle/high/geometry.json":Ag,"./assets/catalog-library/body/squircle/high/material.json":Cg,"./assets/catalog-library/body/squircle/low/geometry.bin":Lg,"./assets/catalog-library/body/squircle/low/geometry.json":Pg,"./assets/catalog-library/body/squircle/low/material.json":Dg,"./assets/catalog-library/body/star/high/geometry.bin":Ug,"./assets/catalog-library/body/star/high/geometry.json":Ig,"./assets/catalog-library/body/star/high/material.json":Fg,"./assets/catalog-library/body/star/low/geometry.bin":Ng,"./assets/catalog-library/body/star/low/geometry.json":Bg,"./assets/catalog-library/body/star/low/material.json":Og,"./assets/catalog-library/body/todd/high/geometry.bin":zg,"./assets/catalog-library/body/todd/high/geometry.json":kg,"./assets/catalog-library/body/todd/high/material.json":Gg,"./assets/catalog-library/body/todd/low/geometry.bin":Vg,"./assets/catalog-library/body/todd/low/geometry.json":Hg,"./assets/catalog-library/body/todd/low/material.json":Wg,"./assets/catalog-library/body/twelve_scalloped_rosette/high/geometry.bin":Xg,"./assets/catalog-library/body/twelve_scalloped_rosette/high/geometry.json":jg,"./assets/catalog-library/body/twelve_scalloped_rosette/high/material.json":qg,"./assets/catalog-library/body/twelve_scalloped_rosette/low/geometry.bin":Yg,"./assets/catalog-library/body/twelve_scalloped_rosette/low/geometry.json":$g,"./assets/catalog-library/body/twelve_scalloped_rosette/low/material.json":Kg,"./assets/catalog-library/eyes/clippo/high/geometry.bin":Zg,"./assets/catalog-library/eyes/clippo/high/geometry.json":Jg,"./assets/catalog-library/eyes/clippo/high/material.json":Qg,"./assets/catalog-library/eyes/clippo/low/geometry.bin":e_,"./assets/catalog-library/eyes/clippo/low/geometry.json":t_,"./assets/catalog-library/eyes/clippo/low/material.json":n_,"./assets/catalog-library/eyes/crescent_inset/high/geometry.bin":i_,"./assets/catalog-library/eyes/crescent_inset/high/geometry.json":a_,"./assets/catalog-library/eyes/crescent_inset/high/material.json":r_,"./assets/catalog-library/eyes/crescent_inset/low/geometry.bin":s_,"./assets/catalog-library/eyes/crescent_inset/low/geometry.json":o_,"./assets/catalog-library/eyes/crescent_inset/low/material.json":l_,"./assets/catalog-library/eyes/cyclops/high/geometry.bin":c_,"./assets/catalog-library/eyes/cyclops/high/geometry.json":u_,"./assets/catalog-library/eyes/cyclops/high/material.json":h_,"./assets/catalog-library/eyes/cyclops/low/geometry.bin":d_,"./assets/catalog-library/eyes/cyclops/low/geometry.json":f_,"./assets/catalog-library/eyes/cyclops/low/material.json":p_,"./assets/catalog-library/eyes/dots/high/geometry.bin":m_,"./assets/catalog-library/eyes/dots/high/geometry.json":v_,"./assets/catalog-library/eyes/dots/high/material.json":g_,"./assets/catalog-library/eyes/dots/low/geometry.bin":__,"./assets/catalog-library/eyes/dots/low/geometry.json":y_,"./assets/catalog-library/eyes/dots/low/material.json":x_,"./assets/catalog-library/eyes/double_highlights/high/geometry.bin":b_,"./assets/catalog-library/eyes/double_highlights/high/geometry.json":S_,"./assets/catalog-library/eyes/double_highlights/high/material.json":w_,"./assets/catalog-library/eyes/double_highlights/low/geometry.bin":M_,"./assets/catalog-library/eyes/double_highlights/low/geometry.json":E_,"./assets/catalog-library/eyes/double_highlights/low/material.json":R_,"./assets/catalog-library/eyes/highlight_capsules/high/geometry.bin":T_,"./assets/catalog-library/eyes/highlight_capsules/high/geometry.json":A_,"./assets/catalog-library/eyes/highlight_capsules/high/material.json":C_,"./assets/catalog-library/eyes/highlight_capsules/low/geometry.bin":L_,"./assets/catalog-library/eyes/highlight_capsules/low/geometry.json":P_,"./assets/catalog-library/eyes/highlight_capsules/low/material.json":D_,"./assets/catalog-library/eyes/oval/high/geometry.bin":U_,"./assets/catalog-library/eyes/oval/high/geometry.json":I_,"./assets/catalog-library/eyes/oval/high/material.json":F_,"./assets/catalog-library/eyes/oval/low/geometry.bin":N_,"./assets/catalog-library/eyes/oval/low/geometry.json":B_,"./assets/catalog-library/eyes/oval/low/material.json":O_,"./assets/catalog-library/eyes/round_inset/high/geometry.bin":z_,"./assets/catalog-library/eyes/round_inset/high/geometry.json":k_,"./assets/catalog-library/eyes/round_inset/high/material.json":G_,"./assets/catalog-library/eyes/round_inset/low/geometry.bin":V_,"./assets/catalog-library/eyes/round_inset/low/geometry.json":H_,"./assets/catalog-library/eyes/round_inset/low/material.json":W_,"./assets/catalog-library/eyes/sleepy_lids/high/geometry.bin":X_,"./assets/catalog-library/eyes/sleepy_lids/high/geometry.json":j_,"./assets/catalog-library/eyes/sleepy_lids/high/material.json":q_,"./assets/catalog-library/eyes/sleepy_lids/low/geometry.bin":Y_,"./assets/catalog-library/eyes/sleepy_lids/low/geometry.json":$_,"./assets/catalog-library/eyes/sleepy_lids/low/material.json":K_,"./assets/catalog-library/eyes/sparkle_capsules/high/geometry.bin":Z_,"./assets/catalog-library/eyes/sparkle_capsules/high/geometry.json":J_,"./assets/catalog-library/eyes/sparkle_capsules/high/material.json":Q_,"./assets/catalog-library/eyes/sparkle_capsules/low/geometry.bin":e1,"./assets/catalog-library/eyes/sparkle_capsules/low/geometry.json":t1,"./assets/catalog-library/eyes/sparkle_capsules/low/material.json":n1,"./assets/catalog-library/eyes/swept_lids/high/geometry.bin":i1,"./assets/catalog-library/eyes/swept_lids/high/geometry.json":a1,"./assets/catalog-library/eyes/swept_lids/high/material.json":r1,"./assets/catalog-library/eyes/swept_lids/low/geometry.bin":s1,"./assets/catalog-library/eyes/swept_lids/low/geometry.json":o1,"./assets/catalog-library/eyes/swept_lids/low/material.json":l1,"./assets/catalog-library/eyes/todd/high/geometry.bin":c1,"./assets/catalog-library/eyes/todd/high/geometry.json":u1,"./assets/catalog-library/eyes/todd/high/material.json":h1,"./assets/catalog-library/eyes/todd/low/geometry.bin":d1,"./assets/catalog-library/eyes/todd/low/geometry.json":f1,"./assets/catalog-library/eyes/todd/low/material.json":p1,"./assets/catalog-library/eyewear/classic_sunglasses/high/geometry.bin":m1,"./assets/catalog-library/eyewear/classic_sunglasses/high/geometry.json":v1,"./assets/catalog-library/eyewear/classic_sunglasses/high/material.json":g1,"./assets/catalog-library/eyewear/classic_sunglasses/low/geometry.bin":_1,"./assets/catalog-library/eyewear/classic_sunglasses/low/geometry.json":y1,"./assets/catalog-library/eyewear/classic_sunglasses/low/material.json":x1,"./assets/catalog-library/eyewear/monocle/high/geometry.bin":b1,"./assets/catalog-library/eyewear/monocle/high/geometry.json":S1,"./assets/catalog-library/eyewear/monocle/high/material.json":w1,"./assets/catalog-library/eyewear/monocle/low/geometry.bin":M1,"./assets/catalog-library/eyewear/monocle/low/geometry.json":E1,"./assets/catalog-library/eyewear/monocle/low/material.json":R1,"./assets/catalog-library/eyewear/none/high/geometry.bin":T1,"./assets/catalog-library/eyewear/none/high/geometry.json":A1,"./assets/catalog-library/eyewear/none/high/material.json":C1,"./assets/catalog-library/eyewear/none/low/geometry.bin":L1,"./assets/catalog-library/eyewear/none/low/geometry.json":P1,"./assets/catalog-library/eyewear/none/low/material.json":D1,"./assets/catalog-library/eyewear/round_sunglasses/high/geometry.bin":U1,"./assets/catalog-library/eyewear/round_sunglasses/high/geometry.json":I1,"./assets/catalog-library/eyewear/round_sunglasses/high/material.json":F1,"./assets/catalog-library/eyewear/round_sunglasses/low/geometry.bin":N1,"./assets/catalog-library/eyewear/round_sunglasses/low/geometry.json":B1,"./assets/catalog-library/eyewear/round_sunglasses/low/material.json":O1,"./assets/catalog-library/eyewear/separate_trapezoid_lenses/high/geometry.bin":z1,"./assets/catalog-library/eyewear/separate_trapezoid_lenses/high/geometry.json":k1,"./assets/catalog-library/eyewear/separate_trapezoid_lenses/high/material.json":G1,"./assets/catalog-library/eyewear/separate_trapezoid_lenses/low/geometry.bin":V1,"./assets/catalog-library/eyewear/separate_trapezoid_lenses/low/geometry.json":H1,"./assets/catalog-library/eyewear/separate_trapezoid_lenses/low/material.json":W1,"./assets/catalog-library/eyewear/tall_oval_frames/high/geometry.bin":X1,"./assets/catalog-library/eyewear/tall_oval_frames/high/geometry.json":j1,"./assets/catalog-library/eyewear/tall_oval_frames/high/material.json":q1,"./assets/catalog-library/eyewear/tall_oval_frames/low/geometry.bin":Y1,"./assets/catalog-library/eyewear/tall_oval_frames/low/geometry.json":$1,"./assets/catalog-library/eyewear/tall_oval_frames/low/material.json":K1,"./assets/catalog-library/index.json":Z1}),na=i=>{const e=J1[`./assets/catalog-library/${i}`];if(!e)throw Error(`Missing authored catalog asset: ${i}`);return e};let Ss;const ia=new Map,ln=new Map,Q1=48*1024*1024;function e2(i,e){const t=new Set;for(const a of e.pieces){for(const s of Object.values(a.geometry.attributes)){const o=s,c=(o.data?.array??o.array)?.buffer;c&&t.add(c)}const r=a.geometry.getIndex();r&&t.add(r.array.buffer)}ln.delete(i),ln.set(i,[...t].reduce((a,r)=>a+r.byteLength,0));let n=[...ln.values()].reduce((a,r)=>a+r,0);for(const[a,r]of ln){if(n<=Q1)break;ln.delete(a),ia.delete(a),n-=r}return e}function t2(){return Ss??=Xt(na("index.json")).then(i=>i.json()).catch(i=>{throw Ss=void 0,i})}function Jn(i,e,t){const n=`${i}:${e}:${t}`;let a=ia.get(n);if(a&&ln.has(n)){const r=ln.get(n);ln.delete(n),ln.set(n,r)}return a||(a=(async()=>{const s=(await t2()).donors[i]?.[e];if(!s)throw Error(`Unknown avatar ${i}: ${e}`);const o=s[t],[c,l,h]=await Promise.all([Xt(na(`${o}/geometry.json`)).then(g=>g.json()),Xt(na(`${o}/material.json`)).then(g=>g.json()),Xt(na(`${o}/geometry.bin`)).then(g=>g.arrayBuffer())]);l.preset=s.signaturePreset,l.crop=[0,0,1,1];const d=ur(s.signaturePreset,c,l,h,!1,void 0),u=d.parts.map(g=>{const p=l.parts.find(m=>m.id===g.id);if(!p?.bounds||!p.pivot)throw Error(`Missing semantic part metadata: ${n}/${g.id}`);return{...g,bounds:p.bounds,pivot:p.pivot,attachmentPivot:p.attachmentPivot,category:p.category,selection:p.selection??(s.selectedPartIds.includes(g.id)?e:"")}}),f=u.find(g=>g.id===0&&!g.fur);if(!f)throw Error(`Missing catalog body: ${n}`);const v="centers"in s.face?s.face:s.face[t];return{body:f,pieces:u,face:v,source:d,selectedPartIds:s.selectedPartIds,signaturePreset:s.signaturePreset,construction:s.construction?.[t],sceneBounds:l.sceneBounds,referenceBounds:l.referenceBounds,aggregateBounds:l.aggregateBounds,furMaskIndices:l.furMaskIndices}})().then(r=>e2(n,r)).catch(r=>{throw ia.delete(n),r}),ia.set(n,a)),a}const n2={scale:1,origin:[0,0,0],translate:[0,0,0]};async function i2(i,e){const[t,n,a,r,s]=await Promise.all([Jn("body",i.shape,e),Jn("eyes",i.eyes==="none"?"oval":i.eyes,e),i.eyewear==="none"?null:Jn("eyewear",i.eyewear,e),i.accessory==="none"?null:Jn("accessory",i.accessory,e),i.eyes==="cyclops"?Jn("eyes","todd",e):null]),o={...t,face:wp(t,i.shape,i.eyes==="cyclops")};if(i.eyeSpacing!==void 0&&i.eyeSpacing!==1){if(!Number.isFinite(i.eyeSpacing)||i.eyeSpacing<.5||i.eyeSpacing>1.5)throw Error("Invalid avatar eye spacing");const x=(o.face.centers[0][0]+o.face.centers[1][0])/2;o.face={...o.face,centers:o.face.centers.map(([S,E,y])=>{const R=x+(S-x)*i.eyeSpacing,D=hr(o,R,E);return[R,E,Number.isFinite(D)?D-o.face.radius*.3:y]})}}const c=[],l=[],h=(x,S)=>{for(const E of x.pieces.filter(y=>y.id===S.part.id)){const y=er(E,S);S.attachmentRoot&&(y.attachmentPivot=[...S.attachmentRoot]),c.push({part:y,sourcePart:E,donor:x,transform:xp(S)})}};for(const x of o.pieces.filter(S=>o.selectedPartIds.includes(S.id)&&!S.fur))h(o,{part:x,...n2});const d=()=>({body:c[0].part,pieces:[...c.map(x=>x.part),...l],face:o.face});if(i.eyes==="clippo")for(const{donor:x,placement:S}of Ep(o,n,n.construction?.kind==="clippo-face"?n.construction:void 0)){if(x===o&&i.eyeSpacing!==void 0&&i.eyeSpacing!==1){const E=(S.part.bounds.min[0]+S.part.bounds.max[0])/2<0?0:1,y=t.face.centers[E];S.translate=S.translate.map((R,D)=>R+o.face.centers[E][D]-y[D])}h(x,S)}else if(i.eyes==="cyclops"){const x=n.pieces.filter(L=>n.selectedPartIds.includes(L.id)&&!L.fur);if(!x[0]||x.length!==5)throw Error("Missing complete Cyclops donor");const E=L=>[0,1,2].map(C=>(L.bounds.min[C]+L.bounds.max[C])/2);if(n.construction?.kind!=="cyclops")throw Error("Missing Cyclops construction anchors");const y=n.construction.center,R=o.face.radius*2/n.construction.radius,D=[0,1].map(L=>(o.face.centers[0][L]+o.face.centers[1][L])/2).concat(Math.max(...o.face.centers.map(L=>L[2]))+o.face.radius*.5),P=Mp(s,o.face);let U=0;for(const[L,C]of x.entries()){const B=L===0?y:E(C),X=L===0?D:[D[0]+(B[0]-y[0])*R,D[1]+(B[1]-y[1])*R,U+.006-(C.bounds.max[2]-B[2])*R];h(n,{part:C,scale:R,origin:B,translate:X.map((j,Q)=>j-B[Q])});const H=c[c.length-1];H.part.geometry.dispose();const J=P[L];H.part={...H.part,geometry:J.geometry,bounds:J.bounds,pivot:J.pivot,attachmentPivot:J.attachmentPivot},U=H.part.bounds.max[2]}}else for(const x of ja(o,n,"eyes",i.eyes==="none"?"oval":i.eyes,{faceLayout:o.face}))i.eyes==="none"?l.push(er(x.part,x)):h(n,x);if(r){const x=i.eyes==="cyclops"?o:d(),S=$s(i.shape).tuft,E=ja(x,r,"accessory",i.accessory,{tuftLayout:S});for(const y of bp(x,r,E,i.accessory,S))h(r,y)}if(a)for(const x of ja(d(),a,"eyewear",i.eyewear,{singleEye:i.eyes==="cyclops"}))h(a,x);i.accessory==="three_lobe"&&qs(c.filter(x=>x.part.category==="body").map(x=>x.part),c.filter(x=>x.part.category==="accessory").map(x=>x.part));const u=new pe().fromArray(o.body.fields.world),f=new pe().fromArray(o.body.fields.normalMatrix),v=new Map;let g=0;for(const x of c){let S=v.get(x.sourcePart);const E=c.find(L=>L!==x&&L.donor===x.donor&&L.sourcePart.id===x.sourcePart.id&&v.has(L.sourcePart));S===void 0&&(S=E?v.get(E.sourcePart):g++),v.set(x.sourcePart,S),x.part.id=S;const y=new pe().fromArray(x.donor.body.fields.world).invert(),R=new pe().multiplyMatrices(y,new pe().fromArray(x.sourcePart.fields.world)),D=x.transform.clone().invert();x.part.fields.world=u.clone().multiply(x.transform).multiply(R).multiply(D).toArray();const P=x.transform.clone().setPosition(0,0,0),U=new pe().fromArray(x.donor.body.fields.normalMatrix).invert().multiply(new pe().fromArray(x.sourcePart.fields.normalMatrix));x.part.fields.normalMatrix=f.clone().multiply(P).multiply(U).multiply(P.clone().invert()).toArray(),x.part.renderOrder=S,x.part.colorRole=x.part.category==="body"||x.part.attachment==="three_lobe"?"body":void 0}const p=c.filter(x=>x.part.category==="eyes"&&!x.part.fur),m=c.some(x=>x.part.category==="body"&&x.part.fur);if(!n.furMaskIndices||n.furMaskIndices.length!==2)throw Error("Missing catalog eye fur masks");const M=n.furMaskIndices.map(x=>{if(i.eyes==="none"||x===null||!m)return[0,0,0,0];const S=p[x];if(!S)throw Error("Missing catalog eye fur mask surface");return Rp(S.part.bounds)});for(const{part:x}of c)x.category==="body"&&(x.fields.furEye0=M[0],x.fields.furEye1=M[1]);for(const x of l)x.geometry.dispose();const A=c.filter(x=>!x.part.fur).map(({part:x})=>({id:x.id,materialKind:x.kind,fields:x.fields,label:x.label,attachment:x.attachment,fur:c.some(S=>S.part.id===x.id&&S.part.fur),universal:x.universal,transparent:x.transparent,depthWrite:x.depthWrite,depthTest:x.depthTest,doubleSided:x.doubleSided,renderOrder:x.renderOrder})),w={...o.source.material,preset:o.signaturePreset,parts:A,crop:[0,0,1,1]};return{source:{preset:o.signaturePreset,material:w,parts:c.map(x=>x.part)},bindings:c,body:o}}const a2=""+new URL("../assets/material-D_gyKzeF.json",import.meta.url).href,r2=""+new URL("../assets/motion-CGuxr_IN.bin",import.meta.url).href,s2=""+new URL("../assets/centering-1LyuTxIa.json",import.meta.url).href,o2=""+new URL("../assets/material-CokwBZ3w.json",import.meta.url).href,l2=""+new URL("../assets/motion-JsIW2tAn.bin",import.meta.url).href,c2=""+new URL("../assets/material-C7W4vLmv.json",import.meta.url).href,u2=""+new URL("../assets/motion-Bf1Yg7JB.bin",import.meta.url).href,h2=""+new URL("../assets/material-DCK-LemR.json",import.meta.url).href,d2=""+new URL("../assets/motion-xJsouvZq.bin",import.meta.url).href,f2=""+new URL("../assets/material-DnWWhE3Y.json",import.meta.url).href,p2=""+new URL("../assets/motion-DRBQ2rrP.bin",import.meta.url).href,m2=""+new URL("../assets/material-G2QVFghU.json",import.meta.url).href,v2=""+new URL("../assets/motion-Df2d34-6.bin",import.meta.url).href,g2=new URL("../assets/geometry-ByTZgMIu.bin",import.meta.url).href,_2=new URL("../assets/geometry-BY_XOqNh.json",import.meta.url).href,y2=""+new URL("../assets/material-Uwr7c-9L.json",import.meta.url).href,x2=""+new URL("../assets/motion-DvbVw2wN.bin",import.meta.url).href,b2=""+new URL("../assets/material-CDZwmjaL.json",import.meta.url).href,S2=""+new URL("../assets/motion-BnhwfHZb.bin",import.meta.url).href,w2=""+new URL("../assets/material-d7-bi9Ul.json",import.meta.url).href,M2=""+new URL("../assets/motion-DDlHmGyy.bin",import.meta.url).href,E2=""+new URL("../assets/material-OkhggZwp.json",import.meta.url).href,R2=""+new URL("../assets/motion-CDyHjlna.bin",import.meta.url).href,T2=""+new URL("../assets/material-gOKsJKnV.json",import.meta.url).href,A2=""+new URL("../assets/motion-cgWG9Gy2.bin",import.meta.url).href,C2=""+new URL("../assets/material-B0PKwrWL.json",import.meta.url).href,L2=""+new URL("../assets/motion-dBMzdJ6s.bin",import.meta.url).href,P2=""+new URL("../assets/material-CtaAe_Y3.json",import.meta.url).href,D2=""+new URL("../assets/motion-GRNG5BYD.bin",import.meta.url).href,U2=""+new URL("../assets/material-0hlMV-_N.json",import.meta.url).href,I2=""+new URL("../assets/motion-DiOaFSMm.bin",import.meta.url).href,F2=""+new URL("../assets/scene-centers-DZ4-6xO8.json",import.meta.url).href,N2=""+new URL("../assets/material-CokwBZ3w.json",import.meta.url).href,B2=""+new URL("../assets/motion-BdedR1Uk.bin",import.meta.url).href,O2=""+new URL("../assets/material-DCZjz9LH.json",import.meta.url).href,z2=""+new URL("../assets/motion--1tcpmc1.bin",import.meta.url).href,k2=""+new URL("../assets/material-CokwBZ3w.json",import.meta.url).href,G2=""+new URL("../assets/motion-D1LBZdQ2.bin",import.meta.url).href,V2=""+new URL("../assets/material-CokwBZ3w.json",import.meta.url).href,H2=""+new URL("../assets/motion-BczQS-1F.bin",import.meta.url).href,W2=""+new URL("../assets/material-ChWJDhm1.json",import.meta.url).href,X2=""+new URL("../assets/motion-C4QMmkom.bin",import.meta.url).href,j2=""+new URL("../assets/material-CtaAe_Y3.json",import.meta.url).href,q2=""+new URL("../assets/motion-CHmAhP6z.bin",import.meta.url).href,Y2=""+new URL("../assets/material-2QcfdizH.json",import.meta.url).href,$2=""+new URL("../assets/motion-BhVwUNJ-.bin",import.meta.url).href,K2=[0,.016666666666666607,.033333333333333215,.04999999999999982,.06666666666666687,.08333333333333348,.10000000000000009,.1166666666666667,.1333333333333333,.1499999999999999,.16666666666666652,.18333333333333313,.20000000000000018,.21666666666666679,.2333333333333334,.25,.2666666666666666,.2833333333333332,.2999999999999998,.3166666666666669,.3333333333333335,.3500000000000001,.3666666666666667,.3833333333333333,.3999999999999999,.4166666666666665,.4333333333333331,.4500000000000002,.4666666666666668,.4833333333333334,.5,.5166666666666666,.5333333333333332,.5499999999999998,.5666666666666669,.5833333333333335,.6000000000000001,.6166666666666667,.6333333333333333,.6499999999999999,.6666666666666665,.6833333333333331,.7000000000000002,.7166666666666668,.7333333333333334,.75,.7666666666666666,.7833333333333332,.7999999999999998,.8166666666666669,.8333333333333335,.8500000000000001,.8666666666666667,.8833333333333333,.8999999999999999,.9166666666666665,.9333333333333331,.9500000000000002,.9666666666666668,.9833333333333334,1,1.0166666666666666,1.0333333333333332,1.0499999999999998,1.0666666666666664,1.083333333333333,1.0999999999999996,1.1166666666666663,1.1333333333333337,1.1500000000000004,1.166666666666667,1.1833333333333336,1.2000000000000002,1.2166666666666668,1.2333333333333334,1.25,1.2666666666666666,1.2833333333333332,1.2999999999999998,1.3166666666666664,1.333333333333333,1.3499999999999996,1.3666666666666663,1.3833333333333337,1.4000000000000004,1.416666666666667,1.4333333333333336,1.4500000000000002,1.4666666666666668,1.4833333333333334,1.5,1.5166666666666666,1.5333333333333332,1.5499999999999998,1.5666666666666664,1.583333333333333,1.5999999999999996,1.6166666666666663,1.6333333333333337,1.6500000000000004,1.666666666666667,1.6833333333333336,1.7000000000000002,1.7166666666666668,1.7333333333333334,1.75,1.7666666666666666,1.7833333333333332,1.7999999999999998,1.8166666666666664,1.833333333333333,1.8499999999999996,1.8666666666666663,1.8833333333333337,1.9000000000000004,1.916666666666667,1.9333333333333336,1.9500000000000002,1.9666666666666668,1.9833333333333334,2,2.0166666666666666,2.033333333333333,2.05,2.0666666666666664,2.083333333333333,2.0999999999999996,2.1166666666666663,2.1333333333333337,2.1500000000000004,2.166666666666667,2.1833333333333336,2.2,2.216666666666667,2.2333333333333334,2.25,2.2666666666666666,2.283333333333333,2.3,2.3166666666666664,2.333333333333333,2.3499999999999996,2.3666666666666663,2.3833333333333337,2.4000000000000004,2.416666666666667,2.4333333333333336,2.45,2.466666666666667,2.4833333333333334,2.5,2.5166666666666666,2.533333333333333,2.55,2.5666666666666664,2.583333333333333,2.5999999999999996,2.6166666666666663,2.6333333333333337,2.6500000000000004,2.666666666666667,2.6833333333333336,2.7,2.716666666666667,2.7333333333333334,2.75,2.7666666666666666,2.783333333333333,2.8,2.8166666666666664,2.833333333333333,2.8499999999999996,2.8666666666666663,2.8833333333333337,2.9000000000000004,2.916666666666667,2.9333333333333336,2.95,2.966666666666667,2.9833333333333334,3,3.0166666666666666,3.033333333333333,3.05,3.0666666666666664,3.083333333333333,3.0999999999999996,3.1166666666666663,3.1333333333333337,3.1500000000000004,3.166666666666667,3.1833333333333336,3.2,3.216666666666667,3.2333333333333334,3.25,3.2666666666666666,3.283333333333333,3.3,3.3166666666666664,3.333333333333333,3.3499999999999996,3.3666666666666663,3.3833333333333337,3.4000000000000004,3.416666666666667,3.4333333333333336,3.45,3.466666666666667,3.4833333333333334,3.5,3.5166666666666666,3.533333333333333,3.55,3.5666666666666664,3.583333333333333,3.5999999999999996,3.6166666666666663,3.6333333333333337,3.6500000000000004,3.666666666666667,3.6833333333333336,3.7,3.716666666666667,3.7333333333333334,3.75,3.7666666666666666,3.783333333333333,3.8,3.8166666666666664,3.833333333333333,3.8499999999999996,3.8666666666666663,3.8833333333333337,3.9000000000000004,3.916666666666667,3.9333333333333336,3.95,3.966666666666667,3.9833333333333334,4],Z2=[0,0,0,0,.024067955636146988,.08940740733169004,.18499015376120762,.29891213295196545,.4187979547977956,.5324311755444021,.6284954078989037,.6973270855104351,.7315957604420602,.7268464751278334,.6825599825330823,.6235264530029571,.5623151153831175,.49999998398666595,.4376849326568846,.376473600374823,.3174399480758036,.261599023639268,.20987655256746268,.16307998587752046,.12186866726017065,.08672392017177909,.05791998363309156,.03549385378348537,.01921581934636218,.008560002432318683,.0026745790756369124,.0003520851752225982,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,.00010204230218963341,.0007891637896754904,.002573908582395479,.005892752125887523,.011109891013675644,.018520829974091706,.028356134328215443,.040784952923360096,.05591887734657262,.07381528871144502,.09448116883161249,.11787694342091957,.14391975948911742,.17248737124425398,.20342182315949997,.23653294621774446,.27160208901842275,.3083857821621195,.34661939729739333,.3860207741409337,.42629380479549395,.4671322822878349,.5082233114088728,.5492511012049542,.5899006053424581,.6298612131812884,.6688303154105836,.7065169444133192,.7426454773498009,.7769592845289329,.8092244458361574,.8392332976869401,.866808052040261,.8918046089065566,.9141159918750905,.9336762510305114,.9504641647019018,.9645061865834608,.9758810977748448,.9847229503989328,.9912252077158947,.9956437733122117,.9983013018568336,.9995904833359054,.9999775876709754,.9999999676397209,.9999999836530549,.9999999836530549,.9999999836530549,.9999999836530549,.9758674735968946,.9098206372077118,.8113854469309784,.6900878932271668,.5554539238545256,.4170096066713087,.2842808383932622,.16679367520225055,.07407407553207825,.015648021169328667,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],J2=[0,0,1,.9996479239419584,.9973254017359326,.9914399528438744,.9807842146933557,.9645062026778317,.9420800474357764,.9132760638967249,.8781314341544582,.8369198555603329,.7901233435056332,.7384006068423573,.6825595743713974,.6235270265074055,.5623149497851931,.5,.4376850502148068,.3764729734925945,.3174386778107533,.2615993931576427,.20987796735775385,.16307839662181767,.12186834736831066,.08672322605227374,.057919187893914446,.035494684885919926,.01921550943646857,.008560811826434696,.0026741613096049584,.0003530592055818311,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,.00010137343526607032,.0007900136679355824,.0025727878743388877,.005893641788227398,.011109130250881774,.018519877932401396,.028356596788909047,.040783581698249735,.05591968427418368,.07381384341649451,.09448004166797754,.1178763314002468,.14391881735653037,.17248864792306806,.2034215282220148,.23653218956133268,.2716004068919953,.30838498135078357,.3466202446245862,.38601955458609927,.4262927734723198,.46713228534175083,.5082234829814976,.5492517591786654,.5899007589025103,.6298611183936855,.6688304651642425,.7065169136333288,.7426460563985864,.7769592164183018,.8092248078274275,.8392330924840337,.8668084146942542,.8918043947132006,.9141157265154455,.9336764299771735,.9504642204208046,.9645061890230048,.9758810968256132,.9847229796099569,.9912251897256276,.9956437824875642,.9983012302889842,.9995905122220533,.9999775659727502,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],An={times:K2,body:Z2,shadow:J2},Q2=[0,0,.030628085136413574],e3=[-.042096883058547974,.05092686414718628,.12451113387942314],t3=[.00020810961723327637,-.07642936706542969,756978988647461e-19],n3=[-5960464477539063e-23,19073486328125e-19,.0003063976764678955],i3=[0,-29802322387695312e-24,.03611272573471069],a3=[.00048613548278808594,4366040229797363e-20,1436471939086914e-20],r3=[-29802322387695312e-24,0,.06110873818397522],s3=[-4172325134277344e-22,.0001322031021118164,.03524711728096008],o3=[-8940696716308594e-23,4354119300842285e-20,.021767884492874146],l3=[43511390686035156e-21,.0001291036605834961,.030456066131591797],c3=[0,0,.033443719148635864],u3=[17881393432617188e-23,0,.03298333287239075],h3=[0,29802322387695312e-24,.026502877473831177],d3=[0,-.01748800277709961,.054837703704833984],f3=[.01331406831741333,0,.0641242265701294],p3=[.02013203501701355,-.01225823163986206,.05670878291130066],m3=[-.0007615089416503906,.042151451110839844,.05370610952377319],v3=[-.006078898906707764,0,.059544503688812256],g3=[0,-.006021618843078613,.05865868926048279],_3=[.05024704337120056,.028103113174438477,.05215352773666382],y3=[0,0,.050325602293014526],x3={circle:Q2,clippo:e3,todd:t3,rounded_triangle:n3,capsule:i3,rounded_head_two_ears:a3,six_lobed_flower:r3,heart:s3,four_lobed_butterfly:o3,circle_two_ears:l3,twelve_scalloped_rosette:c3,rounded_cube:u3,rounded_diamond:h3,slender:d3,pocket:f3,petal:p3,star:m3,cloud:v3,shield:g3,pebble:_3,squircle:y3},b3=Object.assign({"./assets/catalog-computer/capsule/material.json":a2,"./assets/catalog-computer/capsule/motion.bin":r2,"./assets/catalog-computer/centering.json":s2,"./assets/catalog-computer/circle/material.json":o2,"./assets/catalog-computer/circle/motion.bin":l2,"./assets/catalog-computer/circle_two_ears/material.json":c2,"./assets/catalog-computer/circle_two_ears/motion.bin":u2,"./assets/catalog-computer/clippo/material.json":h2,"./assets/catalog-computer/clippo/motion.bin":d2,"./assets/catalog-computer/cloud/material.json":f2,"./assets/catalog-computer/cloud/motion.bin":p2,"./assets/catalog-computer/four_lobed_butterfly/material.json":m2,"./assets/catalog-computer/four_lobed_butterfly/motion.bin":v2,"./assets/catalog-computer/geometry.bin":g2,"./assets/catalog-computer/geometry.json":_2,"./assets/catalog-computer/heart/material.json":y2,"./assets/catalog-computer/heart/motion.bin":x2,"./assets/catalog-computer/pebble/material.json":b2,"./assets/catalog-computer/pebble/motion.bin":S2,"./assets/catalog-computer/petal/material.json":w2,"./assets/catalog-computer/petal/motion.bin":M2,"./assets/catalog-computer/pocket/material.json":E2,"./assets/catalog-computer/pocket/motion.bin":R2,"./assets/catalog-computer/rounded_cube/material.json":T2,"./assets/catalog-computer/rounded_cube/motion.bin":A2,"./assets/catalog-computer/rounded_diamond/material.json":C2,"./assets/catalog-computer/rounded_diamond/motion.bin":L2,"./assets/catalog-computer/rounded_head_two_ears/material.json":P2,"./assets/catalog-computer/rounded_head_two_ears/motion.bin":D2,"./assets/catalog-computer/rounded_triangle/material.json":U2,"./assets/catalog-computer/rounded_triangle/motion.bin":I2,"./assets/catalog-computer/scene-centers.json":F2,"./assets/catalog-computer/shield/material.json":N2,"./assets/catalog-computer/shield/motion.bin":B2,"./assets/catalog-computer/six_lobed_flower/material.json":O2,"./assets/catalog-computer/six_lobed_flower/motion.bin":z2,"./assets/catalog-computer/slender/material.json":k2,"./assets/catalog-computer/slender/motion.bin":G2,"./assets/catalog-computer/squircle/material.json":V2,"./assets/catalog-computer/squircle/motion.bin":H2,"./assets/catalog-computer/star/material.json":W2,"./assets/catalog-computer/star/motion.bin":X2,"./assets/catalog-computer/todd/material.json":j2,"./assets/catalog-computer/todd/motion.bin":q2,"./assets/catalog-computer/twelve_scalloped_rosette/material.json":Y2,"./assets/catalog-computer/twelve_scalloped_rosette/motion.bin":$2}),Qi=i=>{const e=b3[`./assets/catalog-computer/${i}`];if(!e)throw Error(`Missing catalog Computer asset: ${i}`);return e},qa=new Map;let Ya;function S3(i){let e=qa.get(i);return e||(e=Promise.all([Xt(Qi(`${i}/motion.bin`)).then(t=>t.arrayBuffer()).then(cr),Xt(Qi(`${i}/material.json`)).then(t=>t.json())]).then(([t,n])=>{const a=t;if(a.schema!=="bloom.avatar.catalog-computer"||a.version!==1||a.shape!==i)throw Error("Invalid catalog Computer identity");return{document:a,material:n}}).catch(t=>{throw qa.delete(i),t}),qa.set(i,e)),Ya??=Promise.all([Xt(Qi("geometry.json")).then(t=>t.json()),Xt(Qi("geometry.bin")).then(t=>t.arrayBuffer())]).then(([t,n])=>({manifest:t,binary:n})).catch(t=>{throw Ya=void 0,t}),Promise.all([e,Ya])}class w3 extends Pn{constructor(e,t,n){super(e),this.centerDelta=t,this.contactShadows=n}sample(e,t){super.sample(e,t);const n=An.times,a=Math.max(0,Math.min(e,n[n.length-1]));let r=0,s=n.length-1;for(;s-r>1;){const h=r+s>>>1;n[h]<=a?r=h:s=h}const o=(a-n[r])/(n[s]-n[r]),c=An.body[r]+(An.body[s]-An.body[r])*o,l=An.shadow[r]+(An.shadow[s]-An.shadow[r])*o;for(const h of t)h.id==="mesh:0"?(h.world.elements[12]-=this.centerDelta[0]*c,h.world.elements[13]-=this.centerDelta[1]*c):this.contactShadows.has(h.id)&&(h.world.elements[12]-=this.centerDelta[0]*l)}}async function M3(i,e){const[{document:t,material:n},{manifest:a,binary:r}]=await S3(e),s=structuredClone(n),o=ur(i.source.preset,a,s,r,!0),c=Math.max(...i.source.parts.map(g=>g.id))+1;for(const g of o.parts)g.id+=c,g.activity="computer",g.colorRole=g.fields.referencePose?.[3]===-40?"body":void 0;for(const g of s.parts)g.id+=c;i.source.parts.push(...o.parts),i.source.material.parts.push(...s.parts);const l=i.bindings[0].part,h={...t.clip,parts:t.clip.parts.map(g=>({...g,id:g.id==="mesh:0"?"mesh:0":`mesh:${c+Number(g.id.split(":")[1])}`,fields:g.id==="mesh:0"?{...g.fields,...Object.fromEntries(["paletteBounds","furEye0","furEye1"].filter(p=>l.fields[p]).map(p=>[p,{value:l.fields[p]}]))}:g.fields}))},d=structuredClone(i.body.sceneBounds);for(const{part:g}of i.bindings)for(let p=0;p<3;p++)d.min[p]=Math.min(d.min[p],g.bounds.min[p]),d.max[p]=Math.max(d.max[p],g.bounds.max[p]);const u=x3[e];if(!u)throw Error(`Missing Computer scene reference: ${e}`);const f=[0,1].map(g=>(d.min[g]+d.max[g])/2-u[g]),v=o.parts.filter(g=>g.fields.referencePose?.[3]===-16).slice(0,2);if(v.length!==2)throw Error("Missing Computer contact shadows");return new w3(h,f,new Set(v.map(g=>`mesh:${g.id}`)))}function E3(i){return async(e,t,n=!0)=>{if(!e.startsWith("catalog:"))throw Error(`Unknown avatar asset: ${e}`);const a=JSON.parse(e.slice(8));if(!a||["shape","eyes","eyewear","accessory"].some(s=>typeof a[s]!="string"))throw Error("Invalid avatar catalog recipe");const r=await i2(a,t);try{const s=n?await M3(r,a.shape):void 0,{samplers:o,eyeProfiles:c}=await i(r,t,s);if(!o.idle||!o.reaction||n&&!o.work)throw Error("Incomplete avatar catalog animation");if(a.previewPart==="eyes"){const l=new Set(r.bindings.filter(h=>h.part.category==="eyes").map(h=>h.part));r.source.parts=r.source.parts.filter(h=>l.has(h)?!0:(h.geometry.dispose(),!1))}return{source:r.source,samplers:o,eyeProfiles:c}}catch(s){for(const o of r.source.parts)o.geometry.dispose();throw s}}}const R3=new URL("../assets/catalog-motion-alfred-base-Ctzdi_7K.bin",import.meta.url).href,T3=new URL("../assets/catalog-motion-blue_beret-base-D8Y-uCtk.bin",import.meta.url).href,A3=new URL("../assets/catalog-motion-blue_spectacles-base-DDz1XIoI.bin",import.meta.url).href,C3=new URL("../assets/catalog-motion-clippo-special-low-base-BnkmR-AL.bin",import.meta.url).href,L3=new URL("../assets/catalog-motion-clippo-special-base-BGfgU8ux.bin",import.meta.url).href,P3=new URL("../assets/catalog-motion-coral_monocle-base-D-2vrHOI.bin",import.meta.url).href,D3=new URL("../assets/catalog-motion-gus-base-Ds3Beaol.bin",import.meta.url).href,U3=new URL("../assets/catalog-motion-lime_frog-base-D6nXfWMf.bin",import.meta.url).href,I3=new URL("../assets/catalog-motion-lime_headphones-base-CMdc-mXT.bin",import.meta.url).href,F3=new URL("../assets/catalog-motion-purple_heart-base-DQ1liTyD.bin",import.meta.url).href,N3=new URL("../assets/catalog-motion-alfred-work-D5qAkCuL.bin",import.meta.url).href,B3=new URL("../assets/catalog-motion-blue_beret-work-uptd_BN1.bin",import.meta.url).href,O3=new URL("../assets/catalog-motion-blue_spectacles-work-CTqSQlG8.bin",import.meta.url).href,z3=new URL("../assets/catalog-motion-clippo-special-low-work-DW-rQa_7.bin",import.meta.url).href,k3=new URL("../assets/catalog-motion-clippo-special-work-CasComgJ.bin",import.meta.url).href,G3=new URL("../assets/catalog-motion-coral_monocle-work-P_IC3vRk.bin",import.meta.url).href,V3=new URL("../assets/catalog-motion-gus-work-BDfVf6WQ.bin",import.meta.url).href,H3=new URL("../assets/catalog-motion-lime_frog-work-C6lB2L7L.bin",import.meta.url).href,W3=new URL("../assets/catalog-motion-lime_headphones-work-eRVCqhkX.bin",import.meta.url).href,X3=new URL("../assets/catalog-motion-purple_heart-work-Duol7J0V.bin",import.meta.url).href;function j3(i){if(!(i.part.category!=="accessory"||i.sourcePart.selection!=="felipe_beret")){i.preserveMaterial=!0,i.part.universal=i.sourcePart.universal,i.preserveFields=[...new Set([...i.preserveFields??[],"colorRoughness","parameters"])];for(const e of["colorRoughness","parameters"])i.part.fields[e]=[...i.sourcePart.fields[e]]}}const q3=["catalogSizeL0","catalogSizeL1","catalogSizeL2","catalogSizeL3"],Y3=["catalogSizeQ0","catalogSizeQ1","catalogSizeQ2","catalogSizeQ3"];class $3 extends Pn{constructor(e,t,n,a,r){if(!e.clip.parts.find(l=>l.id==="mesh:0"))throw Error("Catalog observations require an explicit body frame");const o=t.map(l=>({id:l.targetId,translation:{value:[0,0,0]},rotation:{value:[0,0,0,1]},scale:{value:[1,1,1]},fields:Object.fromEntries(Object.entries(l.fields).filter(([,h])=>h.length===4).map(([h,d])=>[h,{value:d}]))}));for(const l of r?.clip.parts??[]){const h=o.find(d=>d.id===l.id);h?h.fields={...h.fields,...l.fields}:o.push(l)}if(r?.clip.parts.some(l=>"camera"in l.fields))for(const l of o)l.fields.camera??={value:[1,1,0,1]};const c=r?.clip??e.clip;super({...c,parts:o}),this.observed=e,this.base=r,this.baseBodyIndex=-1,this.body=new pe,this.normal=new pe,this.sourceInverse=new pe,this.sourceNormalInverse=new pe,this.local=new pe,this.localNormal=new pe,this.linear=new pe,this.sizeDelta=new pe,this.semantic=new O,this.parentTurn=new pe,this.eyeTurn=new pe,this.pivotInParent=new O,this.transformed=new O,this.displacement=new O;for(const l of[n,a])if(!Number.isFinite(l.ground)||!Number.isFinite(l.height)||l.height<=0)throw Error("Invalid catalog retarget dimensions");if(this.centerDelta=a.ground+a.height/2-(n.ground+n.height/2),this.heightRatio=a.height/n.height,this.targetBodyIndex=this.clip.parts.findIndex(l=>l.id==="mesh:0"),this.bodyPigmentTargets=t.filter(l=>l.inheritBodyPigment).map(l=>this.clip.parts.findIndex(h=>h.id===l.targetId)),this.bodyPigmentTargets.length&&(this.targetBodyIndex<0||!this.clip.parts[this.targetBodyIndex].fields.colorRoughness||this.bodyPigmentTargets.some(l=>l<0||!this.clip.parts[l].fields.colorRoughness)))throw Error("Body pigment inheritance requires explicit RGB channels");if(this.sourcePose=e.createPose(),this.sourceBodyIndex=this.sourcePose.findIndex(l=>l.id==="mesh:0"),this.basePose=r?.createPose(),this.basePose){if(this.baseBodyIndex=this.basePose.findIndex(l=>l.id==="mesh:0"),this.baseBodyIndex<0)throw Error("Catalog activity requires its captured body frame");if(r.clip.duration>e.clip.duration+1e-9)throw Error("Catalog activity exceeds observed attachment timeline")}this.mappings=t.map(l=>{const h=this.sourcePose.findIndex(g=>g.id===l.sourceId),d=this.clip.parts.findIndex(g=>g.id===l.targetId);if(h<0||d<0)throw Error("Missing observed catalog motion binding");if(l.sourcePivot.length!==3||l.targetPivot.length!==3||![...l.sourcePivot,...l.targetPivot].every(Number.isFinite))throw Error("Invalid catalog motion pivot");const u=new O().fromArray(l.sourcePivot),v=l.geometryTransform.elements[1]!==0||l.geometryTransform.elements[4]!==0?l.geometryTransform.clone().setPosition(0,0,0):void 0;if(l.attachmentAnchor&&(l.category!=="accessory"||l.attachmentAnchor.length!==3||!l.attachmentAnchor.every(Number.isFinite)))throw Error("Invalid catalog attachment anchor");return{source:h,parent:this.sourcePose.findIndex(g=>g.id===(l.sourceParentId??"mesh:0")),sourceSceneCenter:l.sourceSceneCenter??[0,0],target:d,category:l.category,pivot:u,shift:new O().fromArray(l.targetPivot).sub(u),fit:l.geometryTransform.clone(),sizeDelta:Math.cbrt(l.geometryTransform.determinant())-1,eyeHeightRatio:l.eyeHeightRatio??this.heightRatio,attachmentAnchor:l.attachmentAnchor?new O().fromArray(l.attachmentAnchor):void 0,inverseFit:l.geometryTransform.clone().invert(),normalFit:v,inverseNormalFit:v?.clone().invert(),sceneCenterDelta:l.sceneCenterDelta??[0,0],defaults:Object.entries(l.fields).filter(([,g])=>g.length===4),animated:Object.entries(e.clip.parts[h].fields).filter(([g,p])=>"samples"in p&&l.fields[g]?.length===4&&!l.preserveFields?.includes(g)).map(([g])=>g)}}),this.baseMappings=(this.basePose??[]).map((l,h)=>({source:h,target:this.clip.parts.findIndex(d=>d.id===l.id),fields:Object.keys(l.fields)}))}sample(e,t){if(!Number.isFinite(e)||t.length!==this.clip.parts.length)throw Error("Invalid catalog motion output");this.observed.sample(e,this.sourcePose);const n=this.sourcePose[this.sourceBodyIndex];if(this.sourceInverse.copy(n.world).invert(),this.sourceNormalInverse.copy(n.normalMatrix).invert(),this.base&&this.basePose){this.base.sample(e,this.basePose);const a=this.basePose[this.baseBodyIndex];this.body.copy(a.world),this.normal.copy(a.normalMatrix)}else{this.body.copy(n.world),this.normal.copy(n.normalMatrix);const a=this.body.elements;a[12]-=a[4]*this.centerDelta,a[13]+=(Math.hypot(a[4],a[5],a[6])-a[5])*this.centerDelta,a[14]-=a[6]*this.centerDelta}for(const a of this.mappings){const r=this.sourcePose[a.source],s=t[a.target];if(s.id!==this.clip.parts[a.target].id)throw Error("Catalog pose identity changed");if(a.category==="body")s.world.copy(this.body),s.normalMatrix.copy(this.normal);else{const o=this.sourcePose[a.parent];this.sourceInverse.copy(o.world).invert(),this.sourceNormalInverse.copy(o.normalMatrix).invert();const c=r.fields.catalogCenterWeight?.[0]??0;if(this.local.copy(r.world),this.local.elements[12]+=a.sourceSceneCenter[0]*c,this.local.elements[13]+=a.sourceSceneCenter[1]*c,this.local.premultiply(this.sourceInverse),this.localNormal.copy(this.sourceNormalInverse).multiply(r.normalMatrix),a.category==="eyes"&&this.base&&r.fields.catalogAnchorX){const l=r.fields.catalogAnchorX,h=r.fields.catalogAnchorY,d=r.fields.catalogAnchorZ;if(this.displacement.set(l[0]*a.shift.x+h[0]*a.shift.y+d[0]*a.shift.z,l[1]*a.shift.x+h[1]*a.shift.y+d[1]*a.shift.z,l[2]*a.shift.x+h[2]*a.shift.y+d[2]*a.shift.z),r.fields.catalogSizeL0&&a.sizeDelta!==0){const f=this.sizeDelta.elements,v=a.sizeDelta;for(let g=0;g<4;g++){const p=r.fields[q3[g]],m=r.fields[Y3[g]];for(let M=0;M<4;M++)f[g*4+M]=p[M]*v+m[M]*v*v}this.displacement.x+=f[12]-f[0]*a.shift.x-f[4]*a.shift.y-f[8]*a.shift.z,this.displacement.y+=f[13]-f[1]*a.shift.x-f[5]*a.shift.y-f[9]*a.shift.z,this.displacement.z+=f[14]-f[2]*a.shift.x-f[6]*a.shift.y-f[10]*a.shift.z,this.linear.copy(this.local).setPosition(0,0,0).transpose().multiply(this.localNormal),f[12]=f[13]=f[14]=0,this.sizeDelta.premultiply(this.sourceInverse);for(let g=0;g<16;g++)this.local.elements[g]+=f[g];this.localNormal.copy(this.local).setPosition(0,0,0).invert().transpose().multiply(this.linear)}this.displacement.applyMatrix4(this.linear.copy(this.sourceInverse).setPosition(0,0,0));const u=this.local.elements;u[12]+=this.displacement.x,u[13]+=this.displacement.y,u[14]+=this.displacement.z}else if(a.category==="eyes"){this.eyeTurn.makeBasis(this.semantic.set(r.world.elements[0],r.world.elements[1],r.world.elements[2]).normalize(),this.transformed.set(r.world.elements[4],r.world.elements[5],r.world.elements[6]).normalize(),this.displacement.set(r.world.elements[8],r.world.elements[9],r.world.elements[10]).normalize()),this.parentTurn.copy(this.sourceInverse).setPosition(0,0,0),this.linear.copy(this.local).setPosition(0,0,0),this.pivotInParent.copy(a.pivot).applyMatrix4(this.eyeTurn).applyMatrix4(this.parentTurn),this.semantic.copy(a.pivot).applyMatrix4(this.linear).sub(this.pivotInParent).add(this.displacement.setFromMatrixPosition(this.local)),this.transformed.copy(a.shift).applyMatrix4(this.linear),this.displacement.copy(a.shift).applyMatrix4(this.eyeTurn).applyMatrix4(this.parentTurn);const l=this.local.elements;l[12]+=this.semantic.x*(a.eyeHeightRatio-1)+this.displacement.x-this.transformed.x,l[13]+=this.semantic.y*(a.eyeHeightRatio-1)+this.displacement.y-this.transformed.y,l[14]+=this.displacement.z-this.transformed.z}else this.local.premultiply(a.fit).multiply(a.inverseFit),a.normalFit&&this.localNormal.premultiply(a.normalFit).multiply(a.inverseNormalFit);a.attachmentAnchor&&(this.linear.copy(this.local).setPosition(0,0,0),this.transformed.copy(a.attachmentAnchor).applyMatrix4(this.linear),this.displacement.copy(a.attachmentAnchor).sub(this.transformed),this.local.setPosition(this.displacement)),s.world.copy(this.body).multiply(this.local),s.normalMatrix.copy(this.normal).multiply(this.localNormal),s.world.elements[12]+=(a.sceneCenterDelta[0]-a.sourceSceneCenter[0])*(a.attachmentAnchor?0:c),s.world.elements[13]+=(a.sceneCenterDelta[1]-a.sourceSceneCenter[1])*(a.attachmentAnchor?0:c)}for(const[o,c]of a.defaults){const l=s.fields[o];for(let h=0;h<4;h++)l[h]=c[h]}for(const o of a.animated){const c=s.fields[o],l=r.fields[o];for(let h=0;h<4;h++)c[h]=l[h]}}if(this.basePose){for(const r of this.baseMappings){const s=this.basePose[r.source],o=t[r.target];o.world.copy(s.world),o.normalMatrix.copy(s.normalMatrix);for(const c of r.fields)for(let l=0;l<4;l++)o.fields[c][l]=s.fields[c][l]}const a=this.basePose[this.baseBodyIndex].fields.camera;if(a)for(const r of t)for(let s=0;s<4;s++)r.fields.camera[s]=a[s]}if(this.bodyPigmentTargets.length){const a=t[this.targetBodyIndex].fields.colorRoughness;for(const r of this.bodyPigmentTargets){const s=t[r].fields.colorRoughness;for(let o=0;o<3;o++)s[o]=a[o]}}}}const K3=Object.assign({"./assets/catalog-motion/alfred.bin":R3,"./assets/catalog-motion/blue_beret.bin":T3,"./assets/catalog-motion/blue_spectacles.bin":A3,"./assets/catalog-motion/clippo-special-low.bin":C3,"./assets/catalog-motion/clippo-special.bin":L3,"./assets/catalog-motion/coral_monocle.bin":P3,"./assets/catalog-motion/gus.bin":D3,"./assets/catalog-motion/lime_frog.bin":U3,"./assets/catalog-motion/lime_headphones.bin":I3,"./assets/catalog-motion/purple_heart.bin":F3}),Z3=Object.assign({"./assets/catalog-motion/alfred.bin":N3,"./assets/catalog-motion/blue_beret.bin":B3,"./assets/catalog-motion/blue_spectacles.bin":O3,"./assets/catalog-motion/clippo-special-low.bin":z3,"./assets/catalog-motion/clippo-special.bin":k3,"./assets/catalog-motion/coral_monocle.bin":G3,"./assets/catalog-motion/gus.bin":V3,"./assets/catalog-motion/lime_frog.bin":H3,"./assets/catalog-motion/lime_headphones.bin":W3,"./assets/catalog-motion/purple_heart.bin":X3}),$a=new Map;async function ws(i,e){const t=`${i}:${e?"work":"base"}`;let n=$a.get(t);return n||(n=(async()=>{const r=(e?Z3:K3)[`./assets/catalog-motion/${i}.bin`];if(!r)throw Error(`Missing semantic catalog motion ${i}`);const s=await fetch(r);if(!s.ok)throw Error(`Catalog motion HTTP ${s.status}`);const o=cr(await s.arrayBuffer());if(o.schema!=="bloom.avatar.catalog-motion-library"||o.version!==1||o.preset!==i||!o.materialCalibrated)throw Error("Unvalidated catalog motion library");return o})().catch(a=>{throw $a.delete(t),a}),$a.set(t,n)),n}async function Ms(i,e){const t=await ws(i,!1);if(!e)return t;const n=await ws(i,!0);if(n.rigs.length!==t.rigs.length||n.workNativeStart!==t.workNativeStart)throw Error("Catalog work does not match the base rig");return{...t,rigs:t.rigs.map((a,r)=>{const s=n.rigs[r]?.work;if(!s)throw Error("Missing catalog work rig");return{...a,work:s}})}}function Es(i,e){return`${i?"fur":"mesh"}:${e}`}async function J3(i,e,t=!0){const n=await Ms(i.body.signaturePreset,t);if(!i.bindings.some(({part:s,sourcePart:o})=>s.category==="eyes"&&!o.selection&&(i.body.body.attachment==="metal"||i.body.body.label==="metal")))return n;const r=await Ms(e==="high"?"clippo-special":"clippo-special-low",t);if(i.body.signaturePreset!=="lime_frog")throw Error("Unobserved asymmetric Clippo signature");return{...n,rigs:[...n.rigs,...r.rigs]}}async function Q3(i,e){const t=[],n=structuredClone(i.body.sceneBounds);for(const{part:c}of i.bindings)for(let l=0;l<3;l++)n.min[l]=Math.min(n.min[l],c.bounds.min[l]),n.max[l]=Math.max(n.max[l],c.bounds.max[l]);const a=[0,1].map(c=>(n.min[c]+n.max[c])/2),r=[];for(const c of i.bindings){j3(c);const{part:l,sourcePart:h}=c,d=l.category==="body",u=!h.selection&&l.category==="eyes"&&(i.body.body.attachment==="metal"||i.body.body.label==="metal"),f=u?"clippo-special":h.selection;let v=0,g=e.rigs[0].parts[0];if(!d){let S=!1;for(let E=0;E<e.rigs.length;E++){const y=e.rigs[E].parts.find(R=>R.category===l.category&&R.selection===f&&R.sourcePart===h.id);if(y){v=E,g=y,S=!0;break}}if(!S)throw Error(`Missing catalog observation ${l.category}/${h.selection}/${h.id}`)}const p=Es(!!l.fur,g.id),m=d?p:`${p}@${v}`;r.push({rig:v,id:p,merged:m});const M=e.rigs[v].idle.parts.find(S=>S.id===p);if(!M)throw Error("Missing catalog material observation");if(!d)for(const[S,E]of Object.entries(M.fields)){if(c.preserveFields?.includes(S))continue;const y="value"in E?E.value:E.samples;l.fields[S]=Array.from(y.slice(0,4))}c.preserveMaterial||(l.universal=e.rigs[v].render[p].universal);const A=i.source.material.parts.find(S=>S.id===l.id);A&&(A.fields=l.fields,A.universal=l.universal);const x=(await Jn(d||u?"body":l.category,d?"circle":u?"clippo":f,e.rigs[v].sourceDetail??"high")).pieces.find(S=>S.id===g.sourcePart&&!!S.fur==!!l.fur);if(!x)throw Error("Missing catalog motion source anchor");t.push({sourceId:m,inheritBodyPigment:l.attachment==="three_lobe",sourceParentId:v?`mesh:parent${v}`:"mesh:0",eyeHeightRatio:u?1:void 0,attachmentAnchor:l.category==="accessory"?l.attachmentPivot??void 0:void 0,sourceSceneCenter:e.rigs[v].sceneCenter,targetId:Es(!!l.fur,l.id),category:l.category,sourcePivot:x.pivot,targetPivot:l.pivot,geometryTransform:c.transform,fields:l.fields,preserveFields:c.preserveFields,sceneCenterDelta:e.rigs[v].sceneCenter.map((S,E)=>S-a[E])})}const s=i.source.parts.find(c=>c.id===0&&!c.fur).fields.colorRoughness;for(const{part:c}of i.bindings)if(c.attachment==="three_lobe"){const l=c.fields.colorRoughness;for(let h=0;h<3;h++)l[h]=s[h]}return{bindings:t,merge:c=>{const l=e.rigs[0][c];if(!l)throw Error(`Missing catalog ${c} observation`);const h=r.map(({rig:d,id:u,merged:f})=>{const v=e.rigs[d][c];if(!v)throw Error(`Missing catalog ${c} rig`);if(v.duration!==l.duration||v.times.length!==l.times.length||!v.times.every((p,m)=>p===l.times[m]))throw Error("Catalog observation clocks differ");const g=v.parts.find(p=>p.id===u);if(!g)throw Error(`Missing catalog channel ${u}`);return{...g,id:f}});for(const d of new Set(r.map(u=>u.rig))){if(d===0)continue;const u=e.rigs[d][c]?.parts.find(f=>f.id==="mesh:0");if(!u)throw Error("Missing catalog rig parent");h.push({...u,id:`mesh:parent${d}`})}if(!h.some(d=>d.id==="mesh:0"))throw Error("Missing catalog parent frame");return new Pn({...l,parts:h})},dimensions:{ground:e.rigs[0].sourceGround,height:e.rigs[0].sourceHeight},destination:{ground:i.body.body.bounds.min[1],height:i.body.body.bounds.max[1]-i.body.body.bounds.min[1]}}}async function ey(i,e,t){const n=await J3(i,e,!!t),a=await Q3(i,n),r=(h,d)=>new $3(a.merge(h),a.bindings,a.dimensions,a.destination,d),s=r("idle"),o=r("reaction"),c=t?r("work",t):void 0,l=h=>((h-n.idleNativeStart)%s.clip.duration+s.clip.duration)%s.clip.duration;return{samplers:{idle:s,reaction:o,work:c,reactionReturnTime:l(n.rigs[0].returnNativeTime),workReturn:c?{time:c.clip.duration,idleTime:l(n.workNativeStart+c.clip.duration)}:void 0},eyeProfiles:{}}}const Si=new Set,Qt=i=>!!(i.paused||i.portrait||i.reduced),tr=i=>{const e=i.clientWidth;return e<=64?64:e<=128?128:320},nr=()=>new DOMException("Avatar attachment aborted","AbortError");class ty{constructor(e,t){this.stage=document.createElement("canvas"),this.entries=[],this.columns=1,this.disposed=!1,this.cell=e,this.stage.dataset.avatarRenderer="shared-editor-scene",this.stage.setAttribute("aria-hidden","true"),this.stage.style.cssText=`position:fixed;left:0;top:0;width:${e}px;height:${e}px;opacity:0;pointer-events:none`,document.body.append(this.stage);try{this.engine=new _p(this.stage,{count:1,size:e,preset:t,lazyWork:!0,resolveAsset:E3(ey),onFrame:()=>this.paint()})}catch(s){throw this.stage.remove(),s}const n=this.stage.getContext("webgl2"),a=n.getParameter(n.MAX_VIEWPORT_DIMS),r=Math.min(n.getParameter(n.MAX_TEXTURE_SIZE),n.getParameter(n.MAX_RENDERBUFFER_SIZE),a[0],a[1]);this.capacity=Math.min(200,Math.max(1,Math.floor(r/512))**2),this.observer=new IntersectionObserver(s=>{for(const o of s){const c=this.entries.findIndex(h=>h?.canvas===o.target),l=this.entries[c];l&&(l.visible=o.isIntersecting,l.ready&&(this.engine.setInstancePaused(c,Qt(l.props)||!l.visible),this.engine.setInstanceRendering(c,l.visible&&(!Qt(l.props)||l.dirty||!l.painted))))}})}get available(){return!this.disposed&&(this.entries.length<this.capacity||this.entries.some(e=>!e))}layout(){if(this.disposed)return;const e=Math.max(1,this.entries.length);this.columns=Math.ceil(Math.sqrt(e)),this.stage.style.width=`${this.columns*this.cell}px`,this.stage.style.height=`${Math.ceil(e/this.columns)*this.cell}px`,this.engine.setCount(e),this.entries.forEach((t,n)=>{t&&(t.dirty=!0,t.ready&&t.visible&&this.engine.setInstanceRendering(n,!0))})}resolution(){return this.disposed?Promise.resolve():(this.resizing||(this.resizing=(async()=>{for(;!this.disposed;){const e=Math.max(64,...this.entries.filter(t=>!!t).map(t=>t.size));if(e===this.cell)return;this.cell=e,this.layout(),await this.engine.setSize(e)}})().finally(()=>{this.resizing=void 0})),this.resizing)}release(e,t){if(this.entries[e]===t){for(this.observer.unobserve(t.canvas),this.engine.setInstancePaused(e,!0),this.engine.setInstanceRendering(e,!1),this.entries[e]=void 0;this.entries.length&&!this.entries[this.entries.length-1];)this.entries.pop();this.entries.length?this.layout():(this.disposed=!0,this.observer.disconnect(),this.engine.dispose(),this.stage.remove(),Si.delete(this))}}paint(){const e=this.stage.width/this.columns;this.entries.forEach((t,n)=>{if(!t?.ready||!t.visible||Qt(t.props)&&t.painted&&!t.dirty)return;const{canvas:a,context:r}=t,s=Math.min(devicePixelRatio||1,2),o=Math.max(1,Math.round(t.width*s)),c=Math.max(1,Math.round(t.height*s));a.width!==o&&(a.width=o),a.height!==c&&(a.height=c),r.clearRect(0,0,o,c),r.drawImage(this.stage,n%this.columns*e,Math.floor(n/this.columns)*e,e,e,0,0,o,c),t.dirty=!1,Qt(t.props)&&this.engine.setInstanceRendering(n,!1),t.painted||(t.painted=!0,t.onReady?.())})}async attach(e,t,n,a,r,s){if(s?.aborted)throw nr();let o=this.entries.findIndex(M=>!M);if(o<0&&(o=this.entries.length),!this.available||o>=this.capacity)throw Error("Editor scene capacity exceeded");const c=e.getContext("2d");if(!c)throw this.entries.length||(this.engine.dispose(),this.stage.remove(),this.observer.disconnect(),Si.delete(this),this.disposed=!0),Error("Editor canvas unavailable");const l={canvas:e,context:c,props:t,ready:!1,visible:!0,dirty:!0,painted:!1,size:tr(e),width:e.clientWidth,height:e.clientHeight,onReady:a};this.entries[o]=l;let h=!1,d=()=>{},u,f;const v=new Promise((M,A)=>{f=A});v.catch(()=>{});const g=()=>{h||(h=!0,s?.removeEventListener("abort",p),d(),u?.disconnect(),this.release(o,l),f?.(nr()))},p=()=>g();s?.addEventListener("abort",p,{once:!0});const m=M=>Promise.race([M,v]);try{await m(this.engine.loaded),this.layout(),await m(this.resolution()),await m(this.engine.setPreset(o,n.preset)),this.engine.resetAppearance(o),this.engine.idle(o);let M=n.preset,A,w=t,x=t,S=!1,E=!1;const y={enabled:!!t.interactive&&!Qt(t),onTap:()=>this.engine.react(o)},R=(L,C)=>{const B=e.getBoundingClientRect();return[o%this.columns*this.cell+L*this.cell/Math.max(1,B.width),Math.floor(o/this.columns)*this.cell+C*this.cell/Math.max(1,B.height)]};d=yp(e,{hitTest:(L,C)=>this.engine.hitTest(...R(L,C)),beginPointer:(L,C)=>{const B=this.engine.beginPointer(...R(L,C));return S=B===o,B},point:(L,C)=>{L===-1&&C===-1?(E&&this.engine.point(-1,-1),E=!1):(E=!0,this.engine.point(...R(L,C)))},endPointer:(L,C)=>{S&&(S=!1,L===void 0||C===void 0?this.engine.endPointer():this.engine.endPointer(...R(L,C)))}},y);const D=()=>{l.props=x,y.enabled=!!x.interactive&&!Qt(x),this.engine.setInstancePaused(o,Qt(x)||!l.visible),this.engine.setInstanceRendering(o,l.visible&&(!Qt(x)||l.dirty||!l.painted))},P=L=>{h||(x=L,D())},U=async(L,C,B=()=>!0)=>{if(h)return;P(L);const X=L.workingKey!==w.workingKey&&L.workingKey!==void 0;let H=!1;try{if(X&&M===C.preset&&(H=await m(this.engine.prepareWork(o)),h||!H||!B()))return;if(l.ready=!1,M!==C.preset){if(await m(this.engine.setPreset(o,C.preset)),h)return;M=C.preset,this.engine.idle(o),this.engine.setWander(o,!0),this.engine.setGaze(o,.5,.5)}if(!B()){l.ready=!0,D();return}if(A!==C.color&&(C.color?this.engine.setColor(o,C.color):this.engine.clearColor(o),A=C.color),X){if(H||(H=await m(this.engine.prepareWork(o))),h)return;if(!H||!B()){l.ready=!0,D();return}this.engine.work(o,!1,L.workingCycles)}L.entranceKey!==w.entranceKey&&L.entranceKey!==void 0&&!Qt(x)&&this.engine.entrance(o),L.reactionKey!==w.reactionKey&&L.reactionKey!==void 0&&this.engine.react(o),w=L,l.ready=l.dirty=!0,D()}catch(J){throw g(),J}};return await U(t,n),this.observer.observe(e),u=new ResizeObserver(([L])=>{h||(l.width=L?.contentRect.width??e.clientWidth,l.height=L?.contentRect.height??e.clientHeight,l.size=tr(e),l.dirty=!0,this.resolution().then(()=>{h||(this.engine.setInstancePaused(o,Qt(l.props)||!l.visible),this.engine.setInstanceRendering(o,l.visible))}).catch(()=>{h||(g(),r?.())}))}),u.observe(e),{update:U,setPresentation:P,dispose:g}}catch(M){throw g(),M}}}async function ny(i,e,t,n,a,r){if(r?.aborted)throw nr();const s=tr(i);let o=[...Si].find(c=>c.cell===s&&c.available);return o||(o=new ty(s,t.preset),Si.add(o)),o.attach(i,e,t,n,a,r)}function iy(){return[...Si].map(i=>({cell:i.cell,capacity:i.capacity,avatars:i.entries.filter(Boolean).length,pending:i.entries.filter(e=>e&&!e.ready).length,activeIndices:i.entries.flatMap((e,t)=>e?[t]:[]),stats:i.engine.stats()}))}export{ny as attachEditorAvatar,iy as editorPoolDiagnostics};
