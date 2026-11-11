import { type ErrorInfo, type ReactNode, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useColorScheme } from 'react-native';

import { writeClipboardText } from '../hooks/clipboard';
import { useInteractionState } from '../hooks/use-interaction-state';
import { COMMON_MESSAGES } from '../locale/common-messages';
import { useMessages } from '../locale/messages';
import { TYPE_SCALE } from '../typography/scale';
import { ERROR_BOUNDARY_MESSAGES } from './messages';

export interface AppErrorFallbackProps {
  /** From the boundary's render-prop `fallback` context. */
  error: Error;
  errorInfo?: ErrorInfo | null;
  retry: () => void;
  /** How many retries have already happened (`ErrorBoundaryFallbackContext.retryCount`). */
  retryCount?: number;
  /**
   * After this many retries the retry button gives way to `exhaustedMessage`:
   * a crash that survives three retries is not going away by pressing the same
   * button a fourth time. Default: unlimited.
   */
  maxRetries?: number;
  title?: string;
  message?: string;
  retryLabel?: string;
  /** Replaces "This keeps failing. Close and reopen the app." once retries are spent. */
  exhaustedMessage?: string;
  /**
   * Show the error's name, message and stacks, scrollable. Default: only in
   * development (`__DEV__`) — a production user is shown the plain message and
   * can still copy the report.
   */
  showDetails?: boolean;
  /** Show the copy-details button. Default `true`. */
  copyDetails?: boolean;
  /**
   * Appended to the copied report under a blank line: app version, device,
   * locale, user id — whatever support needs. A function is called when
   * copying, so it can read fresh state.
   */
  deviceInfo?: string | (() => string);
  /** Called with the report text once it has been copied. */
  onCopied?: (report: string) => void;
  /** Extra buttons beside retry/copy: "Send feedback", "Report a problem", "Go home". */
  actions?: ReactNode;
  /** Under everything: a support line, a version, a feedback form. */
  footer?: ReactNode;
  testID?: string;
}

/** The text a person pastes into a bug report. */
export function buildErrorReport(
  error: Error,
  errorInfo?: ErrorInfo | null,
  deviceInfo?: string | (() => string),
): string {
  const lines = [`${error.name}: ${error.message}`];
  if (error.stack) lines.push('', error.stack);
  if (errorInfo?.componentStack)
    lines.push('', 'Component stack:', errorInfo.componentStack.trim());
  const extra = typeof deviceInfo === 'function' ? deviceInfo() : deviceInfo;
  if (extra) lines.push('', extra);
  return lines.join('\n');
}

declare const __DEV__: boolean | undefined;
const IS_DEV = typeof __DEV__ !== 'undefined' && __DEV__ === true;

const PALETTE = {
  light: { bg: '#FFFFFF', title: '#111111', text: '#555555', well: '#F2F2F2', ghost: '#E6E6E6' },
  dark: { bg: '#111111', title: '#F5F5F5', text: '#A8A8A8', well: '#1E1E1E', ghost: '#2A2A2A' },
};

function FallbackButton({
  label,
  onPress,
  primary,
  palette,
  testID,
}: {
  label: string;
  onPress: () => void;
  primary?: boolean;
  palette: (typeof PALETTE)['light'];
  testID?: string;
}) {
  // State rather than `Pressable`'s function-form `style`, which css-interop swallows.
  const { state: pressed, onIn, onOut } = useInteractionState();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      onPressIn={onIn}
      onPressOut={onOut}
      testID={testID}
      style={[
        styles.button,
        { backgroundColor: primary ? '#0066FF' : palette.ghost },
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.buttonText, { color: primary ? '#FFFFFF' : palette.title }]}>
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * The full-screen recovery an app puts in its ErrorBoundary: a title and a
 * message, "Try again" (until `maxRetries` is spent), "Copy error details" with
 * the stacks and your own device info, the stacks themselves in development,
 * and slots for the app's own feedback actions.
 *
 * ```tsx
 * <ErrorBoundary
 *   onError={reportToSentry}
 *   fallback={(ctx) => (
 *     <AppErrorFallback {...ctx} maxRetries={3} deviceInfo={() => describeDevice()} />
 *   )}
 * />
 * ```
 *
 * Like the default fallback it is the LAST line of defence — the tree above has
 * already crashed — so it reads no theme, router or navigation context: literal
 * colours that follow the device's light/dark setting, built-in primitives, and
 * the locale (a bare context that cannot throw) for its words.
 */
export function AppErrorFallback({
  error,
  errorInfo,
  retry,
  retryCount = 0,
  maxRetries,
  title: titleProp,
  message: messageProp,
  retryLabel: retryLabelProp,
  exhaustedMessage,
  showDetails = IS_DEV,
  copyDetails = true,
  deviceInfo,
  onCopied,
  actions,
  footer,
  testID,
}: AppErrorFallbackProps) {
  const { messages } = useMessages(ERROR_BOUNDARY_MESSAGES);
  const { messages: common } = useMessages(COMMON_MESSAGES);
  const palette = PALETTE[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current !== null) clearTimeout(timer.current);
    },
    [],
  );

  const exhausted = maxRetries !== undefined && retryCount >= maxRetries;
  const message = exhausted
    ? (exhaustedMessage ?? messages.exhausted)
    : (messageProp ?? messages.message);
  const report = buildErrorReport(error, errorInfo);

  const copy = async () => {
    const text = buildErrorReport(error, errorInfo, deviceInfo);
    try {
      await writeClipboardText(text);
    } catch {
      return; // No clipboard here: the button keeps its label, nothing claims a copy.
    }
    setCopied(true);
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2000);
    onCopied?.(text);
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.bg }]} testID={testID}>
      <Text accessibilityRole="header" style={[styles.title, { color: palette.title }]}>
        {titleProp ?? messages.title}
      </Text>
      <Text style={[styles.message, { color: palette.text }]}>{message}</Text>
      {showDetails ? (
        <ScrollView style={[styles.details, { backgroundColor: palette.well }]}>
          <Text selectable style={[styles.mono, { color: palette.text }]}>
            {report}
          </Text>
        </ScrollView>
      ) : null}
      <View style={styles.actions}>
        {exhausted ? null : (
          <FallbackButton
            primary
            palette={palette}
            label={retryLabelProp ?? messages.retry}
            onPress={retry}
            testID={testID ? `${testID}-retry` : undefined}
          />
        )}
        {copyDetails ? (
          <FallbackButton
            palette={palette}
            label={copied ? common.copied : messages.copyDetails}
            onPress={() => void copy()}
            testID={testID ? `${testID}-copy` : undefined}
          />
        ) : null}
        {actions}
      </View>
      {footer}
    </View>
  );
}

// Literal values only: this must never depend on a theme provider.
const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, gap: 12 },
  title: { ...TYPE_SCALE['title-1-bold'], textAlign: 'center' },
  message: { ...TYPE_SCALE['headline-regular'], textAlign: 'center', paddingHorizontal: 16 },
  details: { alignSelf: 'stretch', maxHeight: 220, borderRadius: 12, padding: 12 },
  mono: { fontFamily: 'monospace', fontSize: 11, lineHeight: 16 },
  actions: { alignItems: 'center', gap: 10, marginTop: 12 },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 160,
    alignItems: 'center',
  },
  buttonText: { ...TYPE_SCALE['headline-semibold'] },
  pressed: { opacity: 0.7 },
});
