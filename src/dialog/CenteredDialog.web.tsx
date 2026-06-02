import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { RemoveScrollBar } from 'react-remove-scroll-bar';

import { useInteractionStates } from '../hooks/useInteractionState';
import { TimesLarge_Stroke2_Corner0_Rounded as CloseIcon } from '../icons/Times';
import { Portal } from '../portal/index.web';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import type { CenteredDialogProps } from './centered-dialog-types';
import {
  CARD_RADIUS,
  DEFAULT_MAX_WIDTH,
  MAX_HEIGHT_FRACTION,
  resolveSpacing,
  VIEWPORT_GUTTER,
} from './centered-dialog-tokens';

const FADE_OUT_DURATION = 150;
const CLOSE_HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 } as const;

/** Stable testID for the dimmed backdrop. Overridden when a `testID` is set. */
export const CENTERED_DIALOG_BACKDROP_TESTID = 'bloom-centered-dialog-backdrop';

const stopPropagation = (e: { stopPropagation: () => void }) => e.stopPropagation();

/**
 * Web variant of `<CenteredDialog>`.
 *
 * A centered modal card rendered into the Bloom Portal at the end of
 * `document.body`. Identical prop surface to native — `visible`, `onClose`,
 * `title`, `compact`, etc. — so call sites are platform agnostic.
 *
 * Differences from the native fork (necessary, not behavioural):
 *   - Portal + `RemoveScrollBar` lock the underlying page while open.
 *   - `Escape` dismisses (when `dismissible`).
 *   - A `role="dialog"` panel with `aria-label`/`aria-modal` for a11y.
 *   - A CSS fade/zoom keyframe matches the native modal's `fade` animation;
 *     the keyframes are injected once (idempotent) into `<head>`.
 *
 * The backdrop is a sibling element BEHIND the card, and the card stops
 * click/press propagation so a tap on the card never dismisses.
 */
export function CenteredDialog({
  visible,
  onClose,
  title,
  dismissible = true,
  maxWidth = DEFAULT_MAX_WIDTH,
  compact = true,
  showClose,
  children,
  footer,
  accessibilityLabel,
  closeAccessibilityLabel = 'Close dialog',
  backdropAccessibilityLabel = 'Dismiss dialog',
  cardStyle,
  contentStyle,
  testID,
}: CenteredDialogProps) {
  const theme = useTheme();
  // `rendered` keeps the dialog mounted through its fade-out so a controlled
  // `visible` flip to `false` still plays an exit animation (matching the
  // native `Modal animationType="fade"`, which animates both directions).
  const [rendered, setRendered] = useState(visible);
  const isClosing = rendered && !visible;

  useKeyframes();

  // Mount immediately when opened; defer unmount until the exit animation
  // has played when closed.
  useEffect(() => {
    if (visible) {
      setRendered(true);
      return;
    }
    if (!rendered) return;
    const timer = setTimeout(() => setRendered(false), FADE_OUT_DURATION);
    return () => clearTimeout(timer);
  }, [visible, rendered]);

  // Escape-to-close while open. Scoped to the open lifetime so stacked
  // dialogs don't fight for the keydown — the top-most one wins via
  // document-level event order.
  useEffect(() => {
    if (!visible || !dismissible || typeof document === 'undefined') return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [visible, dismissible, onClose]);

  const spacing = useMemo(() => resolveSpacing(compact), [compact]);
  const resolvedShowClose = showClose ?? Boolean(title);
  const hasHeader = Boolean(title) || resolvedShowClose;

  if (!rendered) return null;

  // While closing, the backdrop must not re-trigger onClose (it's mid-exit).
  const handleBackdropPress = dismissible && !isClosing ? onClose : undefined;

  return (
    <Portal>
      <RemoveScrollBar />
      {/* `pointerEvents: 'auto'` opts back in from the Portal root's
          `pointer-events: none` (set so the idle portal doesn't intercept
          clicks on the underlying app). */}
      <View style={[styles.root, { padding: VIEWPORT_GUTTER }]}>
        <Pressable
          testID={testID ? `${testID}-backdrop` : CENTERED_DIALOG_BACKDROP_TESTID}
          onPress={handleBackdropPress}
          disabled={!dismissible}
          accessibilityRole="button"
          accessibilityLabel={backdropAccessibilityLabel}
          style={[
            styles.backdrop,
            { backgroundColor: theme.colors.overlay },
            backdropAnimation(isClosing),
          ]}
        />

        <View
          testID={testID}
          role="dialog"
          aria-modal
          aria-label={accessibilityLabel ?? title}
          onStartShouldSetResponder={returnsTrue}
          onResponderRelease={stopPropagation}
          {...({ onClick: stopPropagation } as Record<string, unknown>)}
          style={[
            styles.card,
            {
              maxWidth,
              maxHeight: `${MAX_HEIGHT_FRACTION * 100}%`,
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
              shadowColor: theme.colors.shadow,
            },
            cardAnimation(isClosing),
            cardStyle,
          ]}
        >
          {hasHeader ? (
            <DialogHeader
              title={title}
              showClose={resolvedShowClose}
              padding={spacing.pad}
              gap={spacing.headerGap}
              closeAccessibilityLabel={closeAccessibilityLabel}
              onClose={onClose}
            />
          ) : null}

          <ScrollView
            style={styles.bodyScroll}
            contentContainerStyle={[
              {
                padding: spacing.pad,
                paddingTop: hasHeader ? spacing.headerGap : spacing.pad,
                gap: spacing.contentGap,
              },
              contentStyle,
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>

          {footer ? (
            <View
              style={[
                styles.footer,
                {
                  padding: spacing.pad,
                  paddingTop: spacing.footerGap,
                  borderTopColor: theme.colors.borderLight,
                },
              ]}
            >
              {footer}
            </View>
          ) : null}
        </View>
      </View>
    </Portal>
  );
}

function DialogHeader({
  title,
  showClose,
  padding,
  gap,
  closeAccessibilityLabel,
  onClose,
}: {
  title?: string;
  showClose: boolean;
  padding: number;
  gap: number;
  closeAccessibilityLabel: string;
  onClose: () => void;
}) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.header,
        { paddingHorizontal: padding, paddingTop: padding, gap },
      ]}
    >
      {title ? (
        <Text
          accessibilityRole="header"
          numberOfLines={2}
          style={[styles.title, { color: theme.colors.text }]}
        >
          {title}
        </Text>
      ) : (
        <View style={styles.titleSpacer} />
      )}
      {showClose ? (
        <CloseButton
          accessibilityLabel={closeAccessibilityLabel}
          onPress={onClose}
        />
      ) : null}
    </View>
  );
}

function CloseButton({
  accessibilityLabel,
  onPress,
}: {
  accessibilityLabel: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  const { hovered, pressed, hoverHandlers, pressHandlers } = useInteractionStates();

  return (
    <Pressable
      onPress={onPress}
      {...hoverHandlers}
      {...pressHandlers}
      hitSlop={CLOSE_HIT_SLOP}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.closeButton,
        { backgroundColor: theme.colors.contrast50 },
        (hovered || pressed) && styles.closeButtonActive,
      ]}
    >
      <CloseIcon size="sm" fill={theme.colors.textSecondary} />
    </Pressable>
  );
}

const returnsTrue = () => true;

function backdropAnimation(isClosing: boolean): ViewStyle {
  return isClosing
    ? ({ animation: `bloomCenteredDialogFadeOut ease-in ${FADE_OUT_DURATION}ms forwards` } as ViewStyle)
    : ({ animation: 'bloomCenteredDialogFadeIn ease-out 150ms' } as ViewStyle);
}

function cardAnimation(isClosing: boolean): ViewStyle {
  return isClosing
    ? ({ animation: `bloomCenteredDialogZoomOut ease-in ${FADE_OUT_DURATION}ms forwards` } as ViewStyle)
    : ({ animation: 'bloomCenteredDialogZoomIn cubic-bezier(0.16, 1, 0.3, 1) 200ms' } as ViewStyle);
}

const KEYFRAMES_ID = 'bloom-centered-dialog-keyframes';

/**
 * CSS keyframes powering the web enter/exit animation. Injected once into
 * `<head>` on first mount (keyed by id so re-mounts and multiple dialogs
 * don't duplicate the rule). Mirrors the native modal's `fade` feel with a
 * subtle zoom on the card.
 */
export const BLOOM_CENTERED_DIALOG_CSS = `
@keyframes bloomCenteredDialogFadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes bloomCenteredDialogFadeOut { from { opacity: 1; } to { opacity: 0; } }
@keyframes bloomCenteredDialogZoomIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
@keyframes bloomCenteredDialogZoomOut { from { opacity: 1; transform: scale(1); } to { opacity: 0; transform: scale(0.96); } }
`;

function useKeyframes(): void {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (document.getElementById(KEYFRAMES_ID)) return;
    const style = document.createElement('style');
    style.id = KEYFRAMES_ID;
    style.textContent = BLOOM_CENTERED_DIALOG_CSS;
    document.head.appendChild(style);
  }, []);
}

const styles = StyleSheet.create({
  root: {
    position: 'fixed' as 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'auto',
  },
  backdrop: {
    position: 'fixed' as 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  card: {
    position: 'relative',
    width: '100%',
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    zIndex: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 22,
  },
  titleSpacer: {
    flex: 1,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  closeButtonActive: {
    opacity: 0.7,
  },
  bodyScroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  footer: {
    borderTopWidth: 1,
  },
});
