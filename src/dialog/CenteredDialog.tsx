import React, { useMemo } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { useInteractionState } from '../hooks/useInteractionState';
import { TimesLarge_Stroke2_Corner0_Rounded as CloseIcon } from '../icons/Times';
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

const CLOSE_HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 } as const;

/** Stable testID for the dimmed backdrop. Overridden when a `testID` is set. */
export const CENTERED_DIALOG_BACKDROP_TESTID = 'bloom-centered-dialog-backdrop';

/**
 * Native variant of `<CenteredDialog>`.
 *
 * A controlled, centered modal: a transparent RN `Modal` (fade animation,
 * own native window) hosting a dimmed full-screen backdrop and a centered,
 * rounded card styled entirely from Bloom theme tokens.
 *
 * The backdrop is a sibling `Pressable` rendered BEHIND the card (absolute
 * filled), never a parent of it — so a tap on the card never bubbles to the
 * backdrop's close handler and the card never ends up nested inside the
 * backdrop's pressable on web.
 *
 * Dismissal: backdrop tap (when `dismissible`), the header close button, and
 * the Android hardware back button (`onRequestClose`) all call `onClose`.
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
  const backdropPress = useInteractionState();

  const spacing = useMemo(() => resolveSpacing(compact), [compact]);
  const resolvedShowClose = showClose ?? Boolean(title);
  const hasHeader = Boolean(title) || resolvedShowClose;

  const handleBackdropPress = dismissible ? onClose : undefined;
  // Android's hardware back must always be answerable; when the dialog is
  // non-dismissible we still need a handler (RN requires one for transparent
  // modals) — make it a no-op so back does nothing rather than crash.
  const handleRequestClose = dismissible ? onClose : noop;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleRequestClose}
    >
      <View style={[styles.root, { padding: VIEWPORT_GUTTER }]}>
        <Pressable
          testID={testID ? `${testID}-backdrop` : CENTERED_DIALOG_BACKDROP_TESTID}
          style={[
            styles.backdrop,
            { backgroundColor: theme.colors.overlay },
            backdropPress.state && styles.backdropPressed,
          ]}
          onPress={handleBackdropPress}
          onPressIn={backdropPress.onIn}
          onPressOut={backdropPress.onOut}
          disabled={!dismissible}
          accessibilityRole="button"
          accessibilityLabel={backdropAccessibilityLabel}
        />

        {/* RN's `Modal` already isolates its contents in a separate
            accessibility window, so an explicit `accessibilityViewIsModal`
            on the card is redundant here (and would mark the sibling
            backdrop inaccessible). The web fork uses `aria-modal` instead. */}
        <View
          testID={testID}
          accessibilityLabel={accessibilityLabel ?? title}
          style={[
            styles.card,
            {
              maxWidth,
              maxHeight: `${MAX_HEIGHT_FRACTION * 100}%`,
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
              shadowColor: theme.colors.shadow,
            },
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
    </Modal>
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
  const press = useInteractionState();

  return (
    <Pressable
      onPress={onPress}
      onPressIn={press.onIn}
      onPressOut={press.onOut}
      hitSlop={CLOSE_HIT_SLOP}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.closeButton,
        { backgroundColor: theme.colors.contrast50 },
        press.state && styles.closeButtonPressed,
      ]}
    >
      <CloseIcon size="sm" fill={theme.colors.textSecondary} />
    </Pressable>
  );
}

function noop(): void {
  /* non-dismissible: hardware back is intentionally inert */
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: {
    // Spell out the absolute-fill rect (matches `Fill`'s canonical style)
    // rather than spreading the deprecated `StyleSheet.absoluteFillObject`,
    // which RN 0.83's generated types no longer surface on the `StyleSheet`
    // namespace and which downstream type-checks reject.
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  // A subtle deepening on press confirms the tap-to-dismiss affordance.
  backdropPressed: {
    opacity: 0.92,
  },
  card: {
    width: '100%',
    borderRadius: CARD_RADIUS,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
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
  },
  closeButtonPressed: {
    opacity: 0.7,
  },
  bodyScroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
