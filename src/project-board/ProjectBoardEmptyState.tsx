import { useEffect, type ReactNode } from 'react';
import Animated, {
  cancelAnimation,
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { G, Rect } from 'react-native-svg';
import { useMessages } from '../locale/messages';
import { StyledView } from '../styles/styled-primitives';
import { getResolvedTokens } from '../theme/token-registry';
import { useBloomTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { PROJECT_BOARD_MESSAGES } from './messages';

const AnimatedView = Animated.createAnimatedComponent(StyledView);
const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedRect = Animated.createAnimatedComponent(Rect);
function EmptyCard({
  delay,
  minimumScale = 0.85,
  children,
}: {
  delay: number;
  minimumScale?: number;
  children: ReactNode;
}) {
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(reducedMotion ? 1 : 0);
  useEffect(() => {
    progress.value = reducedMotion
      ? 1
      : withDelay(
          delay,
          withTiming(1, { duration: 320, easing: Easing.inOut(Easing.ease) }),
        );
    return () => cancelAnimation(progress);
  }, [delay, reducedMotion, progress]);
  const props = useAnimatedProps(
    () => ({
      opacity: progress.value,
      transform: `translate(0 ${-5 * (1 - progress.value)}) translate(21 13.5) scale(${minimumScale + (1 - minimumScale) * progress.value}) translate(-21 -13.5)`,
    }),
    [progress, minimumScale],
  );
  return <AnimatedG animatedProps={props}>{children}</AnimatedG>;
}
function EmptyLine({
  width,
  y,
  delay,
  color,
}: {
  width: number;
  y: number;
  delay: number;
  color: string;
}) {
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(reducedMotion ? 1 : 0);
  useEffect(() => {
    progress.value = reducedMotion
      ? 1
      : withDelay(
          delay,
          withTiming(1, { duration: 320, easing: Easing.inOut(Easing.ease) }),
        );
    return () => cancelAnimation(progress);
  }, [delay, reducedMotion, progress]);
  const props = useAnimatedProps(
    () => ({ width: width * progress.value }),
    [progress, width],
  );
  return (
    <AnimatedRect
      animatedProps={props}
      opacity={0.4}
      x={3}
      y={y}
      height={3}
      rx={1.5}
      fill={color}
    />
  );
}
/** Original Figma 4488:11844 geometry and front-to-back reveal timing. */
export function ProjectBoardEmptyState() {
  const { theme, colorPreset } = useBloomTheme();
  const colors = theme.colors;
  const tokens = getResolvedTokens(colorPreset, theme.mode);
  const { messages: m } = useMessages(PROJECT_BOARD_MESSAGES);
  const reducedMotion = useReducedMotion();
  return (
    <AnimatedView
      entering={reducedMotion ? undefined : FadeIn.duration(160)}
      exiting={reducedMotion ? undefined : FadeOut.duration(160)}
      pointerEvents="none"
      className="absolute inset-0 flex items-center justify-center"
      accessibilityLabel={m.noTickets}
      accessibilityLiveRegion="polite"
    >
      <StyledView className="relative h-[146px] w-[170px]">
        <StyledView
          className="absolute top-[18px] left-[15px] h-[103px] w-[140px] rounded-2-5xl"
          style={{ backgroundColor: colors.backgroundTertiary }}
        />
        <StyledView className="absolute top-[41px] left-[64px]">
          <Svg width={42} height={35} viewBox="0 0 42 35">
            <EmptyCard delay={720}>
              <Rect
                x={6}
                y={18}
                width={30}
                height={17}
                rx={3.5}
                fill={tokens['--muted'] ?? colors.border}
              />
            </EmptyCard>
            <EmptyCard delay={570}>
              <Rect
                x={3}
                y={12}
                width={36}
                height={19}
                rx={4}
                fill={tokens['--popover'] ?? colors.backgroundSecondary}
              />
            </EmptyCard>
            <EmptyCard delay={0} minimumScale={0.4}>
              <Rect
                width={42}
                height={27}
                rx={5}
                fill={tokens['--border'] ?? colors.border}
              />
              <EmptyLine
                width={14}
                y={10}
                delay={320}
                color={tokens['--card'] ?? colors.background}
              />
              <Rect
                opacity={0.4}
                x={35}
                y={3}
                width={4}
                height={4}
                rx={2}
                fill={tokens['--card'] ?? colors.background}
              />
              <EmptyLine
                width={31}
                y={15}
                delay={420}
                color={tokens['--card'] ?? colors.background}
              />
              <EmptyLine
                width={31}
                y={20}
                delay={520}
                color={tokens['--card'] ?? colors.background}
              />
            </EmptyCard>
          </Svg>
        </StyledView>
        <StyledView className="absolute top-[87px] left-0 w-full items-center">
          <Text variant="body-2-medium" style={{ color: colors.textTertiary }}>
            {m.noTickets}
          </Text>
        </StyledView>
      </StyledView>
    </AnimatedView>
  );
}
