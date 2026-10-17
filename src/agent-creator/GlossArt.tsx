import { useId } from 'react';
import Svg, { Circle, Defs, Ellipse, LinearGradient, RadialGradient, Stop } from 'react-native-svg';

/** Source swatch geometry; SVG paints both platforms with alpha carried by stopOpacity. */
export function GlossArt({ center, edge, rainbow = false, active = false, size = 26 }: { center?: string; edge?: string; rainbow?: boolean; active?: boolean; size?: number }) {
  const id = useId().replace(/:/g, '');
  return <Svg width={size} height={size} viewBox="0 0 26 26" accessible={false}>
    <Defs>
      <RadialGradient id={`${id}-base`} cx="50%" cy="50%" r="50%"><Stop offset="0" stopColor={center ?? '#437EF7'} /><Stop offset="1" stopColor={edge ?? '#004DE9'} /></RadialGradient>
      <LinearGradient id={`${id}-rainbow`} x1="0" y1="0" x2="1" y2="1">{['#f43f5e','#f59e0b','#84cc16','#14b8a6','#3b82f6','#8b5cf6','#ec4899'].map((color, index) => <Stop key={color} offset={index / 6} stopColor={color} />)}</LinearGradient>
      <LinearGradient id={`${id}-sheen`} x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#ffffff" stopOpacity={0} /><Stop offset="1" stopColor="#ffffff" stopOpacity={.3} /></LinearGradient>
      <LinearGradient id={`${id}-reflection`} x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#ffffff" stopOpacity={.5} /><Stop offset="1" stopColor="#ffffff" stopOpacity={0} /></LinearGradient>
    </Defs>
    <Circle cx={13} cy={13} r={13} fill={`url(#${id}-${rainbow ? 'rainbow' : 'base'})`} />
    <Circle cx={13} cy={13} r={13} fill={`url(#${id}-sheen)`} />
    <Ellipse cx={13} cy={5} rx={11} ry={5} fill={`url(#${id}-reflection)`} />
    <Ellipse cx={13} cy={1.5} rx={4} ry={1.5} fill="#ffffff" opacity={.35} />
    {active && <Circle cx={13} cy={13} r={12} fill="none" stroke="#000000" strokeOpacity={.3} strokeWidth={2} />}
  </Svg>;
}
