import Svg, { Circle, Path } from 'react-native-svg';
import { CHARACTER_COLORS } from './constants';

/** Selector artwork only. The avatar itself uses Clippo's actual 3D meshes. */
export function ClippoArtwork({
  kind,
  opacity = 1,
}: {
  kind: 'shape' | 'eyes';
  opacity?: number;
}) {
  const eyes = kind === 'eyes';
  return (
    <Svg
      width={eyes ? 27 : 56}
      height={eyes ? 27 : 56}
      viewBox={eyes ? '0 0 104 100' : '0 -4 90 170'}
      preserveAspectRatio="xMidYMid meet"
      opacity={opacity}
      accessible={false}
      pointerEvents="none"
    >
      {eyes ? (
        <>
          <Circle cx={27} cy={44} r={21} fill="#f4f3ee" />
          <Circle cx={77} cy={58} r={21} fill="#f4f3ee" />
          <Circle cx={27} cy={44} r={15} fill="#3c2b2d" />
          <Circle cx={77} cy={58} r={15} fill="#3c2b2d" />
          <Path
            d="M11 8 C18 5 29 5 38 9 M63 21 C72 21 82 26 88 32"
            fill="none"
            stroke="#3c2b2d"
            strokeWidth={12}
            strokeLinecap="round"
          />
        </>
      ) : (
        <Path
          d="M25.4 79 C23 102 24 115 35 120 C46 125 53 119 52 105 C48 84 46 63 56 40 C67 16 63 6 46 3 C27 -1 20 15 14 30 C5 51 2 70 5 91 C8 128 19 151 40 157 C57 162 72 153 75 134 C80 114 69 107 72 93 C73 83 76 75 80 71"
          fill="none"
          stroke={CHARACTER_COLORS.pink}
          strokeWidth={8.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </Svg>
  );
}
