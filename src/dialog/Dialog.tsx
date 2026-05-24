import React, {
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import {
  Text,
  TouchableOpacity,
  View,
  type GestureResponderEvent,
} from 'react-native';

import { BottomSheet, type BottomSheetRef } from '../bottom-sheet';
import type { ThemeColors } from '../theme/types';
import { useTheme } from '../theme/use-theme';
import { Context, useDialogContext, useDialogControl } from './context';
import type {
  DialogAction,
  DialogActionColor,
  DialogControlProps,
  DialogProps,
} from './types';

/**
 * Native variant of `<Dialog>`.
 *
 * Uses bloom's own `BottomSheet` in `detached` mode as the underlying
 * surface — a floating, dynamically-sized, content-hugging card that
 * gracefully degrades from sheet (phone) to centered card (tablet, via the
 * 500px max-width cap).
 *
 * The component accepts three rendering modes simultaneously:
 *
 *   1. Declarative — `title`, `description`, `actions`. Bloom renders a
 *      standard confirm/destructive/cancel layout.
 *   2. Custom children — caller passes JSX, bloom renders the chrome (title
 *      + close behaviour) and the children fill the body.
 *   3. Pure children — no `title`/`description`/`actions`; caller owns
 *      every pixel.
 *
 * All three share the same dismissal semantics: tapping the backdrop, the
 * drag handle, swiping down, or `control.close()` runs the queued close
 * callbacks once the sheet's exit animation has settled.
 */
export function Dialog({
  control,
  onClose,
  testID,
  title,
  description,
  actions,
  style,
  label,
  children,
}: DialogProps) {
  const theme = useTheme();
  const ref = useRef<BottomSheetRef>(null);
  const closeCallbacks = useRef<(() => void)[]>([]);
  const titleId = useId();
  const descriptionId = useId();

  // Drain queued close callbacks atomically — capturing the list and
  // resetting it before invocation ensures a callback that synchronously
  // re-opens the dialog (and queues fresh callbacks) does not see the old
  // ones replayed against the new session.
  const callQueuedCallbacks = useCallback(() => {
    const queued = closeCallbacks.current;
    closeCallbacks.current = [];
    for (const cb of queued) {
      try {
        cb();
      } catch (e) {
        if (typeof console !== 'undefined' && console.error) {
          console.error('Dialog close callback error:', e);
        }
      }
    }
  }, []);

  const open = useCallback(() => {
    ref.current?.present();
  }, []);

  const close = useCallback<DialogControlProps['close']>((cb) => {
    if (typeof cb === 'function') {
      closeCallbacks.current.push(cb);
    }
    ref.current?.dismiss();
  }, []);

  const handleDismiss = useCallback(() => {
    callQueuedCallbacks();
    onClose?.();
  }, [callQueuedCallbacks, onClose]);

  useImperativeHandle(
    control.ref,
    () => ({ open, close }),
    [open, close],
  );

  const context = useMemo(
    () => ({ close, isWithinDialog: true }),
    [close],
  );

  const sheetStyle = useMemo(
    () => ({
      maxWidth: 500,
      backgroundColor: theme.colors.background,
      // All four corners rounded — bloom's BottomSheet defaults to top-only
      // radius in flush mode, but we use `detached` so the whole card is
      // floating and rounded uniformly.
      borderRadius: 20,
    }),
    [theme.colors.background],
  );

  return (
    <BottomSheet
      ref={ref}
      onDismiss={handleDismiss}
      enablePanDownToClose
      detached
      // Stronger dim when a Dialog is stacked over another sheet so the
      // underlying sheet's handle/content doesn't bleed through.
      backdropOpacity={0.7}
      style={sheetStyle}
    >
      <Context.Provider value={context}>
        <View
          testID={testID}
          accessibilityLabel={label}
          aria-labelledby={title ? titleId : undefined}
          aria-describedby={description ? descriptionId : undefined}
          style={[
            // Detached BottomSheet already adds `marginBottom: insets.bottom + 16`
            // to the sheet container — the floating card sits ABOVE the
            // system gesture bar, so we don't add `insets.bottom` here.
            { paddingTop: 20, paddingHorizontal: 20, paddingBottom: 20 },
            { backgroundColor: theme.colors.background },
            style,
          ]}
        >
          {title ? (
            <Text
              nativeID={titleId}
              style={{
                fontSize: 22,
                fontWeight: '600',
                color: theme.colors.text,
                paddingBottom: description ? 4 : 16,
                lineHeight: 30,
              }}
            >
              {title}
            </Text>
          ) : null}
          {description ? (
            <Text
              nativeID={descriptionId}
              style={{
                fontSize: 16,
                color: theme.colors.textSecondary,
                paddingBottom: 16,
                lineHeight: 22,
              }}
            >
              {description}
            </Text>
          ) : null}
          {children}
          {actions && actions.length > 0 ? (
            <ActionRow actions={actions} />
          ) : null}
        </View>
      </Context.Provider>
    </BottomSheet>
  );
}

function ActionRow({ actions }: { actions: DialogAction[] }) {
  return (
    <View style={{ width: '100%', gap: 8, justifyContent: 'flex-end' }}>
      {actions.map((action, idx) => (
        <ActionButton
          key={`${action.label}-${idx}`}
          action={action}
        />
      ))}
    </View>
  );
}

function ActionButton({ action }: { action: DialogAction }) {
  const { close } = useDialogContext();
  const theme = useTheme();
  const color: DialogActionColor = action.color ?? 'default';
  const shouldCloseOnPress = action.shouldCloseOnPress ?? true;

  const { background, foreground } = getActionPalette(color, theme.colors);

  const handlePress = useCallback(
    (e: GestureResponderEvent) => {
      const onPress = action.onPress;
      if (color === 'cancel') {
        // Cancel always dismisses; consumer's onPress (rare) runs after.
        close(onPress ? () => onPress(e) : undefined);
        return;
      }
      if (shouldCloseOnPress) {
        close(onPress ? () => onPress(e) : undefined);
      } else {
        onPress?.(e);
      }
    },
    [action.onPress, close, color, shouldCloseOnPress],
  );

  return (
    <TouchableOpacity
      style={{
        borderRadius: 9999,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: background,
        opacity: action.disabled ? 0.5 : 1,
        paddingVertical: 12,
        paddingHorizontal: 24,
      }}
      onPress={handlePress}
      disabled={action.disabled}
      activeOpacity={0.7}
      testID={action.testID}
    >
      <Text style={{ fontSize: 16, fontWeight: '500', color: foreground }}>
        {action.label}
      </Text>
    </TouchableOpacity>
  );
}

function getActionPalette(
  color: DialogActionColor,
  colors: ThemeColors,
): { background: string; foreground: string } {
  switch (color) {
    case 'destructive':
      return {
        background: colors.negative,
        foreground: colors.negativeForeground,
      };
    case 'cancel':
      return { background: colors.contrast50, foreground: colors.text };
    case 'default':
      return { background: colors.primary, foreground: '#FFFFFF' };
    /* c8 ignore next 2 -- TS exhaustiveness check guards this branch */
    default: {
      const _exhaustive: never = color;
      return { background: colors.primary, foreground: '#FFFFFF' };
    }
  }
}

/**
 * Helper used by the imperative `alert()` API. Mounts a `<Dialog>` against
 * a fresh control and presents it immediately. `onResolve` is invoked
 * exactly once when the dialog finishes closing (regardless of how the
 * dismissal happened).
 *
 * Kept private to the dialog module — `alert()` is the public surface.
 */
export function AutoMountedDialog({
  title,
  description,
  actions,
  onResolve,
}: {
  title?: string;
  description?: string;
  actions: DialogAction[];
  onResolve: () => void;
}) {
  const control = useDialogControl();

  // `control` is referentially stable for the lifetime of the component
  // (memoised by `useDialogControl` on `[id]`), so this effect runs exactly
  // once per mount — present-on-mount semantics for an `alert()` call
  // without re-presenting on subsequent renders.
  useEffect(() => {
    control.open();
  }, [control]);

  return (
    <Dialog
      control={control}
      title={title}
      description={description}
      actions={actions}
      onClose={onResolve}
    />
  );
}
