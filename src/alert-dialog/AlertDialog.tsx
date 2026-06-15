import React, { memo, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '../button';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { fontSize, space } from '../styles/tokens';
import type { CenteredDialogProps } from '../dialog';
import type { AlertDialogProps } from './types';

type CenteredDialogComponent = React.ComponentType<CenteredDialogProps>;

/**
 * Build the `AlertDialog` component bound to a platform `CenteredDialog`.
 *
 * `CenteredDialog` is platform-forked (native RN `Modal` vs pure-DOM web
 * overlay), and this repo never relies on implicit `.web` resolution — the
 * platform entry files (`index.ts` / `index.web.ts`) inject the correct
 * `CenteredDialog` here. The body below is single-source, no duplication.
 *
 * `AlertDialog` is a thin wrapper over `CenteredDialog` that lays out a title,
 * description and a confirm/cancel action row. Reach for the imperative
 * `confirm()` helper + `<AlertDialogHost />` to trigger a confirm from an
 * event handler without owning visible state.
 */
export function createAlertDialog(CenteredDialog: CenteredDialogComponent) {
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
    <CenteredDialog
      visible={visible}
      onClose={dismissible ? onClose : () => {}}
      dismissible={dismissible}
      title={title}
      showClose={false}
      accessibilityLabel={title}
      cardStyle={cardStyle}
      testID={testID}
      footer={
        <View style={styles.actions}>
          {!hideCancel ? (
            <Button
              variant="secondary"
              size="medium"
              onPress={handleCancel}
              style={styles.action}
              accessibilityLabel={cancelLabel}>
              {cancelLabel}
            </Button>
          ) : null}
          <Button
            variant="primary"
            size="medium"
            onPress={handleConfirm}
            style={[
              styles.action,
              destructive && { backgroundColor: theme.colors.negative },
            ]}
            textStyle={destructive ? { color: theme.colors.negativeForeground } : undefined}
            accessibilityLabel={confirmLabel}>
            {confirmLabel}
          </Button>
        </View>
      }>
      {description ? (
        <Text
          style={{
            fontSize: fontSize.md,
            lineHeight: fontSize.md * 1.4,
            color: theme.colors.textSecondary,
          }}>
          {description}
        </Text>
      ) : null}
    </CenteredDialog>
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
