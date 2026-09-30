import { useId } from 'react';
import { Platform } from 'react-native';
import Svg, {
  Circle,
  ClipPath,
  Defs,
  Ellipse,
  FeGaussianBlur,
  Filter,
  G,
  LinearGradient,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import { StyledImage, StyledView } from '../styles/styled-primitives';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { RAINBOW_DARK, RAINBOW_LIGHT } from './rainbow-artwork';

/** The original four-layer glossy sphere, with the same 26px reflection geometry. */
export function GlossArt({
  center = '#437EF7',
  edge = '#004DE9',
  rainbow = false,
  active = false,
  size = 26,
}: {
  center?: string;
  edge?: string;
  rainbow?: boolean;
  active?: boolean;
  size?: number;
}) {
  const id = useId().replace(/:/g, '');
  const { isDark } = useTheme();
  if (rainbow)
    return (
      <StyledView
        aria-hidden
        pointerEvents="none"
        className="absolute inset-0 overflow-hidden rounded-full"
        style={{ width: size, height: size }}
      >
        <StyledImage
          source={{ uri: isDark ? RAINBOW_DARK : RAINBOW_LIGHT }}
          className="object-cover"
          resizeMode="cover"
          style={{ width: size, height: size }}
        />
      </StyledView>
    );
  if (Platform.OS === 'web') {
    const fill: WebCssStyle = {
      backgroundImage: `radial-gradient(closest-side circle at 50% 50%, ${center} 0%, ${edge} 100%)`,
    };
    return (
      <StyledView
        pointerEvents="none"
        aria-hidden
        className="relative overflow-hidden rounded-full"
        style={[{ width: size, height: size }, fill]}
      >
        <StyledView
          aria-hidden
          className="absolute inset-0 bg-linear-to-b from-[#ffffff00] to-[#ffffff4d]"
        />
        <StyledView
          aria-hidden
          className="absolute top-0 left-[7.7%] h-[38.5%] w-[84.6%] rounded-[50%] bg-linear-to-b from-[#ffffff80] to-[#ffffff00] blur-[0.5px]"
        />
        <StyledView
          aria-hidden
          className="absolute top-0 left-[34.6%] h-[11.5%] w-[30.8%] rounded-[50%] bg-linear-to-b from-[#ffffff80] to-[#ffffff00] blur-[1px]"
        />
        <StyledView
          aria-hidden
          className="absolute top-[73.1%] left-[-23.1%] h-[53.8%] w-[138.5%] rounded-[50%] bg-linear-to-b from-[#ffffff00] to-[#ffffff80] blur-[0.5px]"
        />
        {active && (
          <StyledView
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full shadow-[inset_0_0_0_2px_rgb(0_0_0/0.30)]"
          />
        )}
      </StyledView>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 26 26" accessible={false}>
      <Defs>
        <ClipPath id={`${id}-clip`}>
          <Circle cx={13} cy={13} r={13} />
        </ClipPath>
        <RadialGradient id={`${id}-base`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={center} />
          <Stop offset="1" stopColor={edge} />
        </RadialGradient>
        <LinearGradient id={`${id}-sheen`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#ffffff" stopOpacity={0} />
          <Stop offset="1" stopColor="#ffffff" stopOpacity={0.3} />
        </LinearGradient>
        <LinearGradient id={`${id}-reflection`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#ffffff" stopOpacity={0.5} />
          <Stop offset="1" stopColor="#ffffff" stopOpacity={0} />
        </LinearGradient>
        <LinearGradient id={`${id}-bounce`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#ffffff" stopOpacity={0} />
          <Stop offset="1" stopColor="#ffffff" stopOpacity={0.5} />
        </LinearGradient>
        <Filter id={`${id}-soft`} x="-25%" y="-25%" width="150%" height="150%">
          <FeGaussianBlur stdDeviation={0.5} />
        </Filter>
        <Filter
          id={`${id}-hotspot`}
          x="-50%"
          y="-50%"
          width="200%"
          height="200%"
        >
          <FeGaussianBlur stdDeviation={1} />
        </Filter>
      </Defs>
      <G clipPath={`url(#${id}-clip)`}>
        <Circle cx={13} cy={13} r={13} fill={`url(#${id}-base)`} />
        <Rect width={26} height={26} fill={`url(#${id}-sheen)`} />
        <Ellipse
          cx={13}
          cy={5}
          rx={11}
          ry={5}
          fill={`url(#${id}-reflection)`}
          filter={`url(#${id}-soft)`}
        />
        <Ellipse
          cx={13}
          cy={1.5}
          rx={4}
          ry={1.5}
          fill={`url(#${id}-reflection)`}
          filter={`url(#${id}-hotspot)`}
        />
        <Ellipse
          cx={12}
          cy={26}
          rx={18}
          ry={7}
          fill={`url(#${id}-bounce)`}
          filter={`url(#${id}-soft)`}
        />
        {active && (
          <Circle
            cx={13}
            cy={13}
            r={12}
            fill="none"
            stroke="#000000"
            strokeOpacity={0.3}
            strokeWidth={2}
          />
        )}
      </G>
    </Svg>
  );
}
