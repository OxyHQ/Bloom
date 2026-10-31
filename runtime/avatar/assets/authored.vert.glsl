precision highp float;
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
