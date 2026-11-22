import { Platform, StyleSheet, View } from 'react-native';
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
import { BloomImage } from '../image';
import { ROUNDED_FULL } from '../styles/rounded-full';
import { twShadow } from './web-css';
import { useSvgIdPrefix } from '../styles/svg-id';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { RAINBOW_DARK, RAINBOW_LIGHT } from './rainbow-artwork';
import { svgA11yProps } from '../styles/svg-a11y';

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
  const id = useSvgIdPrefix('bloom-gloss');
  const { isDark } = useTheme();
  if (rainbow)
    return (
      <View
        aria-hidden
        pointerEvents="none"
        style={[styles.rainbow, { width: size, height: size }]}
      >
        <BloomImage
          source={{ uri: isDark ? RAINBOW_DARK : RAINBOW_LIGHT }}
          contentFit="cover"
          style={[styles.cover, { width: size, height: size }]}
        />
      </View>
    );
  if (Platform.OS === 'web') {
    const fill: WebCssStyle = {
      backgroundImage: `radial-gradient(closest-side circle at 50% 50%, ${center} 0%, ${edge} 100%)`,
    };
    return (
      <View
        pointerEvents="none"
        aria-hidden
        style={[styles.sphere, { width: size, height: size }, fill]}
      >
        <View aria-hidden style={[styles.layer, WEB_GLOSS.sheen]} />
        <View aria-hidden style={[styles.reflection, WEB_GLOSS.reflection]} />
        <View aria-hidden style={[styles.hotspot, WEB_GLOSS.hotspot]} />
        <View aria-hidden style={[styles.bounce, WEB_GLOSS.bounce]} />
        {active && <View aria-hidden style={[styles.activeRing, WEB_GLOSS.activeRing]} />}
      </View>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 26 26" {...svgA11yProps()}>
      <Defs>
        <ClipPath id={`${id}clip`}>
          <Circle cx={13} cy={13} r={13} />
        </ClipPath>
        <RadialGradient id={`${id}base`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={center} />
          <Stop offset="1" stopColor={edge} />
        </RadialGradient>
        <LinearGradient id={`${id}sheen`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#ffffff" stopOpacity={0} />
          <Stop offset="1" stopColor="#ffffff" stopOpacity={0.3} />
        </LinearGradient>
        <LinearGradient id={`${id}reflection`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#ffffff" stopOpacity={0.5} />
          <Stop offset="1" stopColor="#ffffff" stopOpacity={0} />
        </LinearGradient>
        <LinearGradient id={`${id}bounce`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#ffffff" stopOpacity={0} />
          <Stop offset="1" stopColor="#ffffff" stopOpacity={0.5} />
        </LinearGradient>
        <Filter id={`${id}soft`} x="-25%" y="-25%" width="150%" height="150%">
          <FeGaussianBlur stdDeviation={0.5} />
        </Filter>
        <Filter id={`${id}hotspot`} x="-50%" y="-50%" width="200%" height="200%">
          <FeGaussianBlur stdDeviation={1} />
        </Filter>
      </Defs>
      <G clipPath={`url(#${id}clip)`}>
        <Circle cx={13} cy={13} r={13} fill={`url(#${id}base)`} />
        <Rect width={26} height={26} fill={`url(#${id}sheen)`} />
        <Ellipse
          cx={13}
          cy={5}
          rx={11}
          ry={5}
          fill={`url(#${id}reflection)`}
          filter={`url(#${id}soft)`}
        />
        <Ellipse
          cx={13}
          cy={1.5}
          rx={4}
          ry={1.5}
          fill={`url(#${id}reflection)`}
          filter={`url(#${id}hotspot)`}
        />
        <Ellipse
          cx={12}
          cy={26}
          rx={18}
          ry={7}
          fill={`url(#${id}bounce)`}
          filter={`url(#${id}soft)`}
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

const styles = StyleSheet.create({
  // `object-cover` on the image's own box: the web's only.
  cover: Platform.OS === 'web' ? { objectFit: 'cover' } : {},
  rainbow: { position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: ROUNDED_FULL },
  sphere: { position: 'relative', overflow: 'hidden', borderRadius: ROUNDED_FULL },
  layer: { position: 'absolute', inset: 0 },
  reflection: {
    position: 'absolute',
    top: 0,
    left: '7.7%',
    height: '38.5%',
    width: '84.6%',
    borderRadius: '50%',
  },
  hotspot: {
    position: 'absolute',
    top: 0,
    left: '34.6%',
    height: '11.5%',
    width: '30.8%',
    borderRadius: '50%',
  },
  bounce: {
    position: 'absolute',
    top: '73.1%',
    left: '-23.1%',
    height: '53.8%',
    width: '138.5%',
    borderRadius: '50%',
  },
  activeRing: { pointerEvents: 'none', position: 'absolute', inset: 0, borderRadius: ROUNDED_FULL },
});

/** The web sphere's paint: gradients interpolated in oklab, soft blurs, the active inset ring. */
const gradient = (from: string, to: string) =>
  `linear-gradient(to bottom in oklab, ${from} 0%, ${to} 100%)`;
const WEB_GLOSS: Record<string, WebCssStyle> = {
  sheen: { backgroundImage: gradient('#ffffff00', '#ffffff4d') },
  reflection: { backgroundImage: gradient('#ffffff80', '#ffffff00'), filter: 'blur(0.5px)' },
  hotspot: { backgroundImage: gradient('#ffffff80', '#ffffff00'), filter: 'blur(1px)' },
  bounce: { backgroundImage: gradient('#ffffff00', '#ffffff80'), filter: 'blur(0.5px)' },
  activeRing: { boxShadow: twShadow('inset 0 0 0 2px rgb(0 0 0/0.30)') },
};
