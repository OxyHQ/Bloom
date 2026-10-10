import { useId, type ReactNode } from 'react';
import Svg, {
  ClipPath,
  Defs,
  G,
  Image,
  LinearGradient,
  Path,
  Pattern,
  RadialGradient,
  Stop,
  Text,
} from 'react-native-svg';
import { StyledView } from '../styles/styled-primitives';
import {
  DrawingGradient,
  DrawingMatrix,
  type DrawingContext,
  type DrawingNode,
  type DrawingPaint,
} from './drawing';
import { GRAIN_URI } from './grain';

/** Native SVG stops require a separate alpha; alpha-bearing colors silently lose it. */
export function splitPaint(value: string): { color: string; opacity: number } {
  const match = /^hsla?\(([^)]+)\)$/.exec(value);
  if (!match) return { color: value, opacity: 1 };
  const [h = 0, s = 0, l = 0, opacity = 1] = match[1]!.split(',').map(Number.parseFloat);
  const hue = (((h % 360) + 360) % 360) / 360,
    sat = s / 100,
    light = l / 100;
  const a = sat * Math.min(light, 1 - light);
  const channel = (n: number) => {
    const k = (n + hue * 12) % 12;
    return Math.round(255 * (light - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
  };
  return { color: `rgb(${channel(0)},${channel(8)},${channel(4)})`, opacity };
}
function inverse(m: DrawingMatrix) {
  const determinant = m.a * m.d - m.b * m.c;
  if (Math.abs(determinant) < 1e-10) return new DrawingMatrix();
  return new DrawingMatrix([
    m.d / determinant,
    -m.b / determinant,
    -m.c / determinant,
    m.a / determinant,
    (m.c * m.f - m.d * m.e) / determinant,
    (m.b * m.e - m.a * m.f) / determinant,
  ]);
}

/** Render the original drawing command stream on native and web with the same SVG primitives. */
function DrawingLayer({ nodes, size }: { nodes: DrawingNode[]; size: number }) {
  const prefix = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const definitions: ReactNode[] = [];
  const artwork = nodes.map((node, index) => {
    if (node.globalAlpha <= 0) return null;
    const id = `${prefix}-${index}`;
    const paint = (value: DrawingPaint) => {
      if (typeof value === 'string') return splitPaint(value);
      if (!(value instanceof DrawingGradient)) {
        const grain = `${id}-grain`;
        definitions.push(
          <Pattern key={grain} id={grain} patternUnits="userSpaceOnUse" width={192} height={192}>
            <Image href={GRAIN_URI} width={192} height={192} />
          </Pattern>,
        );
        return { color: `url(#${grain})`, opacity: 1 };
      }
      const gradientId = `${id}-gradient`;
      const coordinates = value.coordinates;
      const stops = value.stops.map((stop, i) => {
        const color = splitPaint(stop.color);
        return (
          <Stop key={i} offset={stop.offset} stopColor={color.color} stopOpacity={color.opacity} />
        );
      });
      const transform = inverse(node.matrix).multiply(value.matrix).toString();
      definitions.push(
        value.kind === 'linear' ? (
          <LinearGradient
            key={gradientId}
            id={gradientId}
            gradientUnits="userSpaceOnUse"
            x1={coordinates[0]}
            y1={coordinates[1]}
            x2={coordinates[2]}
            y2={coordinates[3]}
            gradientTransform={transform}
          >
            {stops}
          </LinearGradient>
        ) : (
          <RadialGradient
            key={gradientId}
            id={gradientId}
            gradientUnits="userSpaceOnUse"
            fx={coordinates[0]}
            fy={coordinates[1]}
            cx={coordinates[3]}
            cy={coordinates[4]}
            r={coordinates[5]}
            gradientTransform={transform}
          >
            {stops}
          </RadialGradient>
        ),
      );
      return { color: `url(#${gradientId})`, opacity: 1 };
    };
    const color = paint(node.stroke ? node.strokeStyle : node.fillStyle);
    let result: ReactNode =
      node.text !== undefined ? (
        <Text
          x={node.x}
          y={node.y}
          fontSize={Number.parseFloat(/([\d.]+)px/.exec(node.font)?.[1] ?? '10')}
          fontWeight={/^(\d+)/.exec(node.font)?.[1] ?? 'normal'}
          fontFamily={node.font.replace(/^.*?px\s+/, '')}
          textAnchor={
            node.textAlign === 'center' ? 'middle' : node.textAlign === 'right' ? 'end' : 'start'
          }
          alignmentBaseline={node.textBaseline === 'middle' ? 'central' : 'baseline'}
          fill={color.color}
          fillOpacity={color.opacity}
        >
          {node.text}
        </Text>
      ) : (
        <Path
          d={node.path?.toString()}
          fill={node.stroke ? 'none' : color.color}
          fillOpacity={color.opacity}
          stroke={node.stroke ? color.color : undefined}
          strokeOpacity={color.opacity}
          strokeWidth={node.lineWidth}
          strokeLinecap={node.lineCap}
        />
      );
    result = (
      <G transform={node.matrix.toString()} opacity={node.globalAlpha}>
        {result}
      </G>
    );
    node.clips.forEach((clip, i) => {
      const clipId = `${id}-clip-${i}`;
      definitions.push(
        <ClipPath key={clipId} id={clipId}>
          <Path d={clip.toString()} />
        </ClipPath>,
      );
      result = <G clipPath={`url(#${clipId})`}>{result}</G>;
    });
    return <G key={id}>{result}</G>;
  });
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200" accessible={false} aria-hidden={true}>
      <Defs>{definitions}</Defs>
      {artwork}
    </Svg>
  );
}

/** Preserve Canvas compositing between consecutive drawing operations. RN's View
 * implements soft-light on iOS/Fabric and Android 10+, and RNW emits the same CSS.
 * Isolation keeps grain from blending with the application's background. */
export function Drawing({ context, size }: { context: DrawingContext; size: number }) {
  const layers: { blend: 'normal' | 'soft-light'; nodes: DrawingNode[] }[] = [];
  for (const node of context.nodes) {
    const blend = node.globalCompositeOperation === 'soft-light' ? 'soft-light' : 'normal';
    let layer = layers[layers.length - 1];
    if (!layer || layer.blend !== blend) {
      layer = { blend, nodes: [] };
      layers.push(layer);
    }
    layer.nodes.push(node);
  }
  return (
    <StyledView pointerEvents="none" style={{ width: size, height: size, isolation: 'isolate' }}>
      {layers.map((layer, index) => (
        <StyledView
          key={index}
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: size,
            height: size,
            mixBlendMode: layer.blend,
          }}
        >
          <DrawingLayer nodes={layer.nodes} size={size} />
        </StyledView>
      ))}
    </StyledView>
  );
}
