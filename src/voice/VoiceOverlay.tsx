import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { resolveBloomColors } from '../appearance';
import { useControllableState } from '../hooks/use-controllable-state';
import { useMessages } from '../locale/messages';
import { OverlayRoot } from '../overlay';
import { ModalKeyboard } from '../overlay/ModalKeyboard';
import { Portal } from '../portal';
import { IS_WEB } from '../styles/platform';
import { StyledView } from '../styles/styled-primitives';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { AudioWaveVisualizer } from './AudioWaveVisualizer';
import { VOICE_OVERLAY_FADE_MS } from './constants';
import { VOICE_MESSAGES } from './messages';
import type { VoiceOverlayProps } from './types';
import { VoiceControls } from './VoiceControls';
import { useCssSafeAreaInsets } from '../hooks/use-css-safe-area-insets';

/**
 * The panel carries `className`, the safe-area padding AND the fade, so all
 * three are ONE element type, built once at module scope — a type constructed
 * during render remounts the subtree on every render. See `button/Button.tsx`.
 */
const AnimatedPanel = Animated.createAnimatedComponent(StyledView);

/**
 * Voice mode: a full-surface modal for a live conversation with an agent. The
 * wave shows the sound, the status line says what the session is doing, the
 * caption follows the transcript as it grows, and the controls sit under the
 * thumb.
 *
 * It is a modal like `Dialog`: it takes its place in the overlay stack, the
 * app behind it goes inert, focus moves in and returns to the opener, and
 * Escape and Android back ask to close through `onOpenChange`. Closing the
 * overlay is not ending the session — `onEnd` is the app's to act on.
 *
 * The status line is a polite live region, so each change of state is
 * announced without interrupting; it always carries words, never only colour.
 */
export function VoiceOverlay({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  state,
  transcript,
  children,
  error,
  levels,
  muted = false,
  onMutedChange,
  paused,
  onPausedChange,
  onEnd,
  onTypeInstead,
  label,
  className,
  testID,
}: VoiceOverlayProps) {
  const { colors } = useTheme();
  const { messages } = useMessages(VOICE_MESSAGES);
  const insets = useCssSafeAreaInsets(useSafeAreaInsets());
  const reducedMotion = useReducedMotion();
  const panelRef = useRef<React.ComponentRef<typeof View>>(null);
  const captionRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });

  // Mounted from the moment it opens until its fade-out ends, so the exit plays.
  const [mounted, setMounted] = useState(open);
  const progress = useSharedValue(open ? 1 : 0);
  const unmount = useCallback(() => setMounted(false), []);
  useEffect(() => {
    if (open) setMounted(true);
  }, [open]);
  useEffect(() => {
    if (!mounted) return;
    cancelAnimation(progress);
    const target = open ? 1 : 0;
    if (reducedMotion) {
      progress.value = target;
      if (!open) unmount();
      return;
    }
    progress.value = withTiming(
      target,
      { duration: VOICE_OVERLAY_FADE_MS, easing: Easing.out(Easing.cubic) },
      (finished) => {
        if (finished && target === 0) runOnJS(unmount)();
      },
    );
  }, [open, mounted, reducedMotion, progress, unmount]);
  const fade = useAnimatedStyle(() => ({ opacity: progress.value }), [progress]);

  const close = useCallback(() => setOpen(false), [setOpen]);

  if (!mounted) return null;

  const failed = state === 'error';
  const danger = resolveBloomColors(colors, 'danger', 'outline').foreground;
  const status = failed
    ? (error ?? messages.status.error)
    : state === 'listening' && muted
      ? messages.mutedStatus
      : messages.status[state];
  const sounding = (state === 'listening' && !muted) || state === 'speaking';

  return (
    <Portal>
      <OverlayRoot onRequestClose={close} modal>
        {IS_WEB ? (
          <ModalKeyboard panelRef={panelRef} closing={!open} dismissible dismiss={close} />
        ) : null}
        <AnimatedPanel
          ref={panelRef}
          pointerEvents="auto"
          tabIndex={IS_WEB ? -1 : undefined}
          role="dialog"
          aria-modal
          aria-label={label ?? messages.voiceMode}
          accessibilityViewIsModal
          className={className}
          testID={testID}
          style={[
            StyleSheet.absoluteFill,
            styles.panel,
            {
              backgroundColor: colors.background,
              paddingTop: insets.top + 24,
              paddingBottom: insets.bottom + 24,
              paddingLeft: insets.left + 24,
              paddingRight: insets.right + 24,
            },
            fade,
          ]}
        >
          <View style={styles.stage}>
            <AudioWaveVisualizer
              levels={levels}
              active={sounding}
              size="lg"
              tone={failed ? 'danger' : state === 'speaking' ? 'accent' : 'neutral'}
              testID={testID ? `${testID}-wave` : undefined}
            />
            <Text
              role="status"
              aria-live="polite"
              variant="title-3-medium"
              style={[styles.status, { color: failed ? danger : colors.text }]}
              testID={testID ? `${testID}-status` : undefined}
            >
              {status}
            </Text>
          </View>

          <ScrollView
            ref={captionRef}
            style={styles.caption}
            contentContainerStyle={styles.captionContent}
            onContentSizeChange={() =>
              captionRef.current?.scrollToEnd({ animated: !reducedMotion })
            }
            testID={testID ? `${testID}-caption` : undefined}
          >
            {children ??
              (transcript ? (
                <Text
                  variant="body-regular"
                  style={[styles.transcript, { color: colors.textSecondary }]}
                >
                  {transcript}
                </Text>
              ) : null)}
          </ScrollView>

          <VoiceControls
            state={state}
            muted={muted}
            onMutedChange={onMutedChange}
            paused={paused}
            onPausedChange={onPausedChange}
            onEnd={onEnd}
            onTypeInstead={onTypeInstead}
            testID={testID ? `${testID}-controls` : undefined}
          />
        </AnimatedPanel>
      </OverlayRoot>
    </Portal>
  );
}

const styles = StyleSheet.create({
  panel: { alignItems: 'stretch', gap: 24 },
  stage: { alignItems: 'center', gap: 16, paddingTop: 24 },
  status: { textAlign: 'center' },
  caption: { flex: 1 },
  captionContent: { flexGrow: 1, justifyContent: 'flex-end' },
  transcript: { textAlign: 'center' },
});
