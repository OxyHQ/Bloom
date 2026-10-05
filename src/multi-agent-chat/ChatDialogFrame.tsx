import { useEffect, type ReactNode } from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { CloseButton } from '../button';
import { useDialogContext } from '../dialog/context';
import { DIALOG_MESSAGES } from '../dialog/messages';
import { useIsRtl } from '../hooks/use-is-rtl';
import { useCommonMessages } from '../locale/common-messages';
import { useMessages } from '../locale/messages';
import { StyledPressable, StyledView } from '../styles/styled-primitives';
import type { WebCssStyle } from '../styles/web-view-style';
import { Text } from '../typography';
import { ScrollSurface } from './ScrollSurface';

const AnimatedView = Animated.createAnimatedComponent(StyledView);

/** Author the panel within Dialog's existing focus, dismissal and stacking boundary. */
export function ChatDialogFrame({
  title,
  mode,
  preview,
  footer,
  children,
}: {
  title: string;
  mode: 'center' | 'editor' | 'navigation';
  preview?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}) {
  const { close, isClosing } = useDialogContext();
  const reduced = useReducedMotion(),
    rtl = useIsRtl();
  const common = useCommonMessages(),
    { messages } = useMessages(DIALOG_MESSAGES);
  const { height } = useWindowDimensions();
  const progress = useSharedValue(mode === 'center' || reduced ? 1 : 0);
  useEffect(() => {
    progress.value = withTiming(isClosing ? 0 : 1, {
      duration: reduced ? 0 : mode === 'center' ? 240 : 280,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    });
  }, [isClosing, mode, progress, reduced]);
  const fade = useAnimatedStyle(
    () => ({ opacity: progress.value }),
    [progress],
  );
  const slide = useAnimatedStyle(
    () => ({
      transform: [
        {
          translateX:
            mode === 'editor' ? (rtl ? -32 : 32) * (1 - progress.value) : 0,
        },
      ],
    }),
    [mode, progress, rtl],
  );
  const backdropClass =
    mode === 'center'
      ? 'absolute inset-0 bg-black/70'
      : 'absolute inset-0 bg-background-secondary-default/70 backdrop-blur-sm';
  return (
    <StyledView
      className={
        mode === 'center'
          ? 'flex h-full w-full items-center justify-center p-4'
          : mode === 'editor'
            ? 'flex h-full w-full items-end'
            : 'flex h-full w-full items-start p-3'
      }
      style={{ flex: 1, minHeight: 0 }}
    >
      <AnimatedView
        className={backdropClass}
        style={[
          Platform.OS === 'web' && mode !== 'center'
            ? ({ backdropFilter: 'blur(4px)' } as WebCssStyle)
            : undefined,
          fade,
        ]}
      >
        <StyledPressable
          accessibilityRole="button"
          tabIndex={-1}
          accessibilityLabel={messages.dismissNamed(title)}
          disabled={!!isClosing}
          onPress={() => close()}
          className="absolute inset-0"
        />
      </AnimatedView>
      {mode === 'center' ? (
        <AnimatedView
          className="w-full outline-none"
          style={[
            {
              maxWidth: preview ? 520 : 440,
              flexShrink: 1,
              maxHeight: height * 0.85,
            },
            fade,
          ]}
        >
          <StyledView
            className="flex max-h-[85dvh] flex-col overflow-hidden rounded-3xl border border-border-button-default bg-background-primary-default p-4 shadow-lg outline-none"
            style={{ maxHeight: height * 0.85, flexShrink: 1 }}
          >
            <StyledView className="mb-4 flex shrink-0 items-center justify-between flex-row">
              <Text
                accessibilityRole="header"
                className="text-headline-medium text-text-primary"
              >
                {title}
              </Text>
              <CloseButton
                accessibilityLabel={common.labelFor(common.close, title)}
                size="sm"
                onPress={() => close()}
              />
            </StyledView>
            {preview}
            <ScrollSurface
              className="flex min-h-0 flex-auto flex-col"
              contentClassName="h-auto min-h-0 flex-auto p-1"
              surface="primary"
              label={title}
            >
              {children}
            </ScrollSurface>
            {footer && (
              <StyledView className="mt-4 shrink-0">{footer}</StyledView>
            )}
          </StyledView>
        </AnimatedView>
      ) : mode === 'editor' ? (
        <AnimatedView
          className="h-full w-[356px] max-w-full bg-background-full p-2 outline-none"
          style={[
            { width: 356, maxWidth: '100%', height: '100%' },
            slide,
            fade,
          ]}
        >
          <StyledView className="h-full outline-none">{children}</StyledView>
        </AnimatedView>
      ) : (
        <StyledView
          className="relative h-full outline-none"
          style={{ height: '100%' }}
        >
          {children}
          <CloseButton
            accessibilityLabel={common.labelFor(common.close, title)}
            className="absolute -end-10 top-2"
            style={{ position: 'absolute', insetInlineEnd: -40, top: 8 }}
            onPress={() => close()}
          />
        </StyledView>
      )}
    </StyledView>
  );
}

/** Preserve the source paragraphs’ emphasis without fixing translated word order. */
export function SupportCopy({ text, term }: { text: string; term: string }) {
  const index = text.indexOf(term);
  return (
    <Text className="text-body-regular text-text-secondary">
      {index < 0 ? (
        text
      ) : (
        <>
          {text.slice(0, index)}
          <Text className="text-text-primary font-bold">{term}</Text>
          {text.slice(index + term.length)}
        </>
      )}
    </Text>
  );
}
