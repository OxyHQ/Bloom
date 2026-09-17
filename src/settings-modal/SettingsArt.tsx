import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop, Circle } from 'react-native-svg';

import { ACCENT_TABLE, colorRamp } from '../button/shared';
import { useTheme } from '../theme/use-theme';
import { useSettingsPalette } from './context';
import type { SettingsPlanArtProps } from './types';
import { IS_WEB } from './web-css';

/**
 * The settings modal's artwork pieces.
 *
 * `SettingsPlanArt` is `PlanArtFlame`: the "Current plan" artwork
 * burned through a WebGL fragment shader as a wind-torn flag with an ember rim
 * and drifting sparks. On web the canvas is created imperatively inside the host
 * node (so this file stays universal — no `.web` fork, no DOM JSX); with no
 * `source` it burns Bloom's generated artwork: three soft discs (accent-400,
 * success-400, warning-400) on
 * background/tertiary. Native, a failed WebGL context, and reduced motion all
 * get the static discs (reduced motion draws one still frame on web).
 */

const VERT = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const FRAG = `
precision mediump float;
uniform sampler2D u_tex;
uniform float u_time;
uniform vec2 u_mouse;      // pointer in UV space (y up)
uniform float u_mouseStr;  // 0..1, eased in JS
varying vec2 v_uv;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = p * 2.03 + vec2(17.0, 9.2);
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = v_uv;

  // 0 at the center, 1 at the corners — drives both flap amplitude and burn.
  float edge = clamp(distance(uv, vec2(0.5)) * 1.6, 0.0, 1.0);

  // Pointer heat: a soft hotspot under the cursor that stokes the burn and
  // agitates the cloth around it.
  float mouseBoost = u_mouseStr * smoothstep(0.2, 0.02, distance(v_uv, u_mouse));

  // Flag-in-wind: crossed sines + a pinch of turbulence, pinned at center.
  float amp = 0.004 + 0.022 * edge * edge + 0.012 * mouseBoost;
  uv.x += sin(uv.y * 9.0 + u_time * 2.2) * amp;
  uv.y += sin(uv.x * 12.0 - u_time * 2.7) * amp * 0.85;
  uv += (vec2(
    fbm(v_uv * 3.0 + vec2(u_time * 0.35, 0.0)),
    fbm(v_uv * 3.0 + vec2(0.0, u_time * 0.31) + 31.7)
  ) - 0.5) * 0.03 * edge;

  vec4 img = texture2D(u_tex, uv);

  // Burn field: drifting noise vs an edge-weighted, breathing threshold —
  // the pointer hotspot raises the local burn level on top.
  float n = fbm(uv * 4.5 + vec2(u_time * 0.3, -u_time * 0.48));
  float breathe = 0.78 + 0.22 * sin(u_time * 1.1 + n * 7.0);
  float burn = min(edge * breathe * 0.85 + mouseBoost * 0.45, 1.05);
  float d = n - (1.0 - burn); // > 0 → consumed

  float hole = smoothstep(0.0, 0.07, d);
  float rim = smoothstep(-0.11, 0.0, d) * (1.0 - hole);
  float charr = smoothstep(-0.26, -0.08, d) * (1.0 - rim) * (1.0 - hole);

  // Ember rim: deep orange at the outside, white-yellow right at the tear.
  float hot = smoothstep(-0.05, 0.0, d);
  vec3 ember = mix(vec3(1.0, 0.38, 0.08), vec3(1.0, 0.85, 0.35), hot);

  vec3 col = img.rgb;
  col = mix(col, col * vec3(0.32, 0.24, 0.22), charr * 0.75); // char darkening
  col = mix(col, ember, rim);
  col += ember * rim * 0.6; // rim over-glow

  float alpha = img.a * (1.0 - hole);

  // Burning paper flakes: three parallax layers of small rotated slivers
  // that drift up-right while tumbling. Each has its own life cycle —
  // ignites bright yellow-white, cools to orange, then dies out — and they
  // only spawn near burning fabric (or under the pointer's hotspot).
  float gate = smoothstep(0.12, 0.5, edge * breathe) + mouseBoost;
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float scale = 13.0 + fi * 8.0;
    vec2 sp = v_uv * scale + vec2(-u_time * (0.8 + fi * 0.5), -u_time * (2.0 + fi * 1.1));
    vec2 cell = floor(sp);
    float sh = hash(cell + fi * 13.7);
    if (sh > 0.7) {
      vec2 pos = 0.2 + 0.6 * vec2(hash(cell + 3.1), hash(cell + 7.7));
      // Tumbling sway while it floats
      pos.x += sin(u_time * (2.0 + sh * 3.0) + sh * 20.0) * 0.08;
      vec2 delta = fract(sp) - pos;
      // Rotated, elongated sliver — reads as a torn paper fragment.
      float angle = sh * 6.2831 + u_time * (1.2 + sh * 2.0);
      vec2 r = mat2(cos(angle), -sin(angle), sin(angle), cos(angle)) * delta;
      float body = smoothstep(0.17, 0.03, length(r * vec2(1.0, 2.6)));
      // Life cycle: quick ignite → glow → burn out and vanish.
      float life = fract(u_time * (0.35 + sh * 0.5) + sh * 11.0);
      float glow = smoothstep(0.0, 0.1, life) * (1.0 - smoothstep(0.5, 0.95, life));
      float flicker = 0.75 + 0.25 * sin(u_time * 11.0 + sh * 40.0);
      vec3 flakeCol = mix(vec3(1.0, 0.4, 0.07), vec3(1.0, 0.93, 0.55), glow * flicker);
      float lum = body * glow * flicker * min(gate, 1.2);
      col += flakeCol * lum;
      alpha = max(alpha, lum * 0.95);
    }
  }

  gl_FragColor = vec4(col, alpha);
}
`;

interface Blobs {
  background: string;
  a: string;
  b: string;
  c: string;
}

function useBlobs(): Blobs {
  const theme = useTheme();
  const palette = useSettingsPalette();
  return useMemo(
    () => ({
      background: palette.tertiary,
      a: palette.accent[400],
      b: colorRamp(theme.colors.success, ACCENT_TABLE)[400],
      c: colorRamp(theme.colors.warning, ACCENT_TABLE)[400],
    }),
    [theme, palette],
  );
}

/** `paintFallbackArt`: soft discs at 70% on the tertiary fill. */
function paintBlobs(size: number, blobs: Blobs): HTMLCanvasElement | null {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const blob = (cx: number, cy: number, r: number, color: string) => {
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.55, color);
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  };
  ctx.fillStyle = blobs.background;
  ctx.fillRect(0, 0, size, size);
  ctx.globalAlpha = 0.7;
  blob(size * 0.125, size * 0.125, size * 0.42, blobs.a);
  blob(size * 0.83, size * 0.58, size * 0.38, blobs.b);
  blob(size * 0.5, size * 0.95, size * 0.42, blobs.c);
  ctx.globalAlpha = 1;
  return canvas;
}

/** The static discs as SVG — native, and the no-WebGL fallback. */
function useSvgId(prefix: string): string {
  return `${prefix}-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
}

function BlobsSvg({ size, blobs }: { size: number; blobs: Blobs }) {
  const id = useSvgId('bloom-plan');
  const disc = (gradientId: string, color: string) => (
    <RadialGradient id={gradientId} cx="50%" cy="50%" r="50%">
      <Stop offset="0" stopColor={color} stopOpacity={0.7} />
      <Stop offset="0.55" stopColor={color} stopOpacity={0.7} />
      <Stop offset="1" stopColor={color} stopOpacity={0} />
    </RadialGradient>
  );
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        {disc(`${id}-a`, blobs.a)}
        {disc(`${id}-b`, blobs.b)}
        {disc(`${id}-c`, blobs.c)}
      </Defs>
      <Rect x={0} y={0} width={100} height={100} fill={blobs.background} />
      <Circle cx={12.5} cy={12.5} r={42} fill={`url(#${id}-a)`} />
      <Circle cx={83} cy={58} r={38} fill={`url(#${id}-b)`} />
      <Circle cx={50} cy={95} r={42} fill={`url(#${id}-c)`} />
    </Svg>
  );
}

export function SettingsPlanArt({ source, animated = true, size = 277, style }: SettingsPlanArtProps) {
  const blobs = useBlobs();
  const reducedMotion = useReducedMotion();
  const hostRef = useRef<View>(null);
  const [failed, setFailed] = useState(!IS_WEB);

  useEffect(() => {
    if (!IS_WEB || typeof document === 'undefined') return;
    const host = hostRef.current as unknown as HTMLElement | null;
    if (!host || typeof host.appendChild !== 'function') return;

    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;';
    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false });
    if (!gl) {
      setFailed(true);
      return;
    }
    host.appendChild(canvas);
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    gl.viewport(0, 0, canvas.width, canvas.height);

    const compile = (type: number, text: string) => {
      const shader = gl.createShader(type) as WebGLShader;
      gl.shaderSource(shader, text);
      gl.compileShader(shader);
      return shader;
    };
    const program = gl.createProgram() as WebGLProgram;
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      canvas.remove();
      setFailed(true);
      return;
    }
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(program, 'u_time');
    const uMouse = gl.getUniformLocation(program, 'u_mouse');
    const uMouseStr = gl.getUniformLocation(program, 'u_mouseStr');
    gl.uniform1i(gl.getUniformLocation(program, 'u_tex'), 0);

    // Pointer tracked on window — the fade overlay sits above the canvas.
    const target = { x: 0.5, y: 0.5, str: 0 };
    const eased = { x: 0.5, y: 0.5, str: 0 };
    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = 1 - (event.clientY - rect.top) / rect.height;
      const inside = x > -0.15 && x < 1.15 && y > -0.15 && y < 1.15;
      if (inside) {
        target.x = x;
        target.y = y;
      }
      target.str = inside ? 1 : 0;
    };
    const still = reducedMotion || !animated;
    if (!still) window.addEventListener('pointermove', onPointerMove);

    const texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    let raf = 0;
    let disposed = false;
    const start = performance.now();
    const draw = (now: number) => {
      gl.uniform1f(uTime, (now - start) / 1000);
      eased.x += (target.x - eased.x) * 0.12;
      eased.y += (target.y - eased.y) * 0.12;
      eased.str += (target.str - eased.str) * 0.07;
      gl.uniform2f(uMouse, eased.x, eased.y);
      gl.uniform1f(uMouseStr, eased.str);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (!still) raf = requestAnimationFrame(draw);
    };
    const upload = (image: TexImageSource) => {
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      raf = requestAnimationFrame(draw);
    };

    if (source) {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.onload = () => {
        if (!disposed) upload(image);
      };
      image.onerror = () => {
        canvas.remove();
        setFailed(true);
      };
      image.src = source;
    } else {
      const art = paintBlobs(512, blobs);
      if (!art) {
        canvas.remove();
        setFailed(true);
        return;
      }
      upload(art);
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onPointerMove);
      canvas.remove();
    };
  }, [source, animated, reducedMotion, size, blobs]);

  return (
    <View
      ref={hostRef}
      aria-hidden
      pointerEvents="none"
      style={[{ width: size, height: size, overflow: 'hidden' }, style]}
    >
      {failed ? <BlobsSvg size={size} blobs={blobs} /> : null}
    </View>
  );
}

/**
 * A radial fade of the artwork into the card: `closest-side` circle,
 * the card colour at 0% (13%), 13% (37%), 85% (86%) and 100%. Opacity is a
 * stop attribute, never an alpha inside `stopColor` — react-native-svg drops
 * that alpha on native.
 */
export function RadialFade({ color, size }: { color: string; size: number }) {
  const id = useSvgId('bloom-settings-plan-fade');
  return (
    <Svg width={size} height={size} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <RadialGradient id={id} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={color} stopOpacity={0} />
          <Stop offset="0.13" stopColor={color} stopOpacity={0} />
          <Stop offset="0.37" stopColor={color} stopOpacity={0.13} />
          <Stop offset="0.86" stopColor={color} stopOpacity={0.85} />
          <Stop offset="1" stopColor={color} stopOpacity={1} />
        </RadialGradient>
      </Defs>
      <Rect x={0} y={0} width={size} height={size} fill={`url(#${id})`} />
    </Svg>
  );
}

/** A top-to-bottom fade from `color` to transparent, filling its parent. */
export function VerticalFade({ color }: { color: string }) {
  const id = useSvgId('bloom-settings-top-fade');
  return (
    <Svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 1 1" style={StyleSheet.absoluteFill}>
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity={1} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={1} height={1} fill={`url(#${id})`} />
    </Svg>
  );
}
