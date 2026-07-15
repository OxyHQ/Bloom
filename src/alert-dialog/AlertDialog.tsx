import React, { memo, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '../button';
import type { DialogProps } from '../dialog';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { fontSize, space } from '../styles/tokens';
import type { AlertDialogProps } from './types';

type DialogComponent = React.ComponentType<DialogProps>;

/** Centered alert-card max width (px). Matches the legacy AlertDialog card. */
const ALERT_DIALOG_MAX_WIDTH = 440;

/**
 * Build the `AlertDialog` component bound to a platform `Dialog`.
 *
 * `Dialog` is platform-forked (native `BottomSheet`-backed surface vs pure-DOM
 * web overlay) through its `./dialog` export conditions, and this repo never
 * relies on implicit `.web` resolution — the platform entry files
 * (`index.ts` / `index.web.ts`) inject the correct `Dialog` here. The body
 * below is single-source, no duplication.
 *
 * `AlertDialog` is a thin wrapper over `<Dialog placement="center">` that lays
 * out a title, description and a confirm/cancel action row. Reach for the
 * imperative `confirm()` helper + `<AlertDialogHost />` to trigger a confirm
 * from an event handler without owning visible state.
 */
export function createAlertDialog(Dialog: DialogComponent) {
  const AlertDialogComponent = function AlertDialog({
    visible,
    onClose,
    title,
    description,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    onConfirm,
    onCancel,
    destructive = false,
    hideCancel = false,
    dismissible = false,
    cardStyle,
    testID,
  }: AlertDialogProps) {
    const theme = useTheme();

    const handleCancel = useCallback(() => {
      onCancel?.();
      onClose();
    }, [onCancel, onClose]);

    const handleConfirm = useCallback(() => {
      onConfirm?.();
      onClose();
    }, [onConfirm, onClose]);

    return (
      <Dialog
        open={visible}
        onClose={onClose}
        placement="center"
        // Alert dialogs are blocking by default — the backdrop only dismisses
        // when the caller opts in via `dismissible`.
        dismissOnBackdrop={dismissible}
        maxWidth={ALERT_DIALOG_MAX_WIDTH}
        title={title}
        label={title}
        style={cardStyle}
        testID={testID}
      >
        {description ? (
          <Text
            style={{
              fontSize: fontSize.md,
              lineHeight: fontSize.md * 1.4,
              color: theme.colors.textSecondary,
              paddingBottom: space.lg,
            }}
          >
            {description}
          </Text>
        ) : null}
        <View style={styles.actions}>
          {!hideCancel ? (
            <Button
              variant="secondary"
              size="medium"
              onPress={handleCancel}
              style={styles.action}
              accessibilityLabel={cancelLabel}
            >
              {cancelLabel}
            </Button>
          ) : null}
          <Button
            variant="primary"
            size="medium"
            onPress={handleConfirm}
            style={StyleSheet.flatten([
              styles.action,
              destructive && { backgroundColor: theme.colors.negative },
            ])}
            textStyle={destructive ? { color: theme.colors.negativeForeground } : undefined}
            accessibilityLabel={confirmLabel}
          >
            {confirmLabel}
          </Button>
        </View>
      </Dialog>
    );
  };

  const AlertDialog = memo(AlertDialogComponent);
  AlertDialog.displayName = 'AlertDialog';
  return AlertDialog;
}

export type AlertDialogType = ReturnType<typeof createAlertDialog>;

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: space.sm,
  },
  action: {
    minWidth: 96,
  },
});
