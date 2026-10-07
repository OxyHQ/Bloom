import Svg, { Circle, Ellipse, Path } from 'react-native-svg';

/** Static selector artwork; the runtime renders the fitted single-eye mesh. */
export function CyclopsArtwork({ opacity = 1 }: { opacity?: number }) {
  return (
    <Svg
      width={27}
      height={27}
      viewBox="0 0 100 100"
      opacity={opacity}
      accessible={false}
      pointerEvents="none"
    >
      <Ellipse cx={50} cy={50} rx={46} ry={44} fill="#f4f5ee" />
      <Circle
        cx={50}
        cy={50}
        r={24}
        fill="#148a78"
        stroke="#174e45"
        strokeWidth={3}
      />
      <Circle cx={50} cy={50} r={14} fill="#101918" />
      <Path d="M61 31 L71 38 L65 46 L57 40 Z" fill="#ffffff" />
    </Svg>
  );
}
