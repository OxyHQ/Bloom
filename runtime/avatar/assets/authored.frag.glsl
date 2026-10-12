precision highp float;
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
uniform highp sampler2D furPile,furCards,furLTC1,furLTC2;
vec3 felipePilePerturb(vec2 uv,vec2 slope,vec3 n,vec3 dx,vec3 dy) {
    // WebGL derivatives use an upward screen Y axis.
    vec2 ux=dFdx(uv),uy=dFdy(uv);
    vec3 u=cross(dy,n)*ux.x+cross(n,dx)*uy.x;
    vec3 v=cross(dy,n)*ux.y+cross(n,dx)*uy.y;
    return (u*slope.x+v*slope.y)*inversesqrt(max(max(dot(u,u),dot(v,v)),.00000001));
}
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
    if(material>0) {
        roughness=1.;
        if(material==2) {
            vec4 fibers=texture(furCards,furSurface.xy);
            float shortPile=fibers.g*furNormal.z*.65*(1.-smoothstep(.38,.72,furSurface.z));
            float transmittance=(1.-fibers.a)*(1.-shortPile);
            alpha*= (1.-pow(max(transmittance,0.),1.23*(1.+furNormal.z*1.5)))*furNormal.y;
            // Fade the outermost tips continuously. The dense roots and body coat stay intact.
            alpha*=1.-furNormal.z*smoothstep(.52,1.,furSurface.z)*.65;
            if(alpha<.003)discard;
            emission=albedo*.1;
            albedo*=mix(.78,1.15,fibers.r)*mix(.745,1.195,smoothstep(0.,.75,furSurface.z))*furNormal.x;
        } else {
            vec3 weights=pow(abs(normalize(furNormal)),vec3(6.));weights/=max(dot(weights,vec3(1)),.0001);
            vec3 p=furSurface.xyz/(d.fur.x/.018)*2.28;p.x+=.1*sin(p.y*1.8+p.z);
            vec4 x=texture(furPile,p.zy),y=texture(furPile,p.xz),z=texture(furPile,p.xy);
            float value=dot(vec3(x.r,y.r,z.r),weights);
            albedo*=mix(.48,1.28,value)*.916;
            vec3 dx=dFdx(worldPosition),dy=dFdy(worldPosition);
            vec3 relief=felipePilePerturb(p.zy,x.gb*2.-1.,n,dx,dy)*weights.x+felipePilePerturb(p.xz,y.gb*2.-1.,n,dx,dy)*weights.y+felipePilePerturb(p.xy,z.gb*2.-1.,n,dx,dy)*weights.z;
            n=normalize(n+relief*.7);
        }
    }
    vec4 light=material==2 ? furLight : (material==1 ? furBodyLighting(n,view) : felipeLighting(n,view,worldPosition,roughness));
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
