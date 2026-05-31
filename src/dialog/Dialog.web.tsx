import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Pressable,
  Text,
  TouchableOpacity,
  View,
  type GestureResponderEvent,
  type ViewStyle,
} from 'react-native';
import { RemoveScrollBar } from 'react-remove-scroll-bar';

import { Portal } from '../portal/index.web';
import type { ThemeColors } from '../theme/types';
import { useTheme } from '../theme/use-theme';
import { Context, useDialogContext, useDialogControl } from './context';
import type {
  DialogAction,
  DialogActionColor,
  DialogControlProps,
  DialogProps,
} from './types';

const FADE_OUT_DURATION = 150;

const stopPropagation = (e: { stopPropagation: () => void }) => e.stopPropagation();

const ClosingContext = createContext(false);

/**
 * Web variant of `<Dialog>`.
 *
 * A centered modal card rendered into the bloom Portal at the end of
 * `document.body`. Same prop API as native — `title`, `description`,
 * `actions`, or arbitrary `children` — so call sites are platform
 * agnostic.
 *
 * Accessibility: the panel has `role="dialog"` and the `title`/`description`
 * props (when provided) become the `aria-labelledby` / `aria-describedby`
 * targets. Pressing the backdrop dismisses. Pressing `Escape` dismisses.
 * Focus is locked inside the dialog while it's open.
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
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const closeCallbacksRef = useRef<(() => void)[]>([]);

  const open = useCallback(() => {
    setIsClosing(false);
    setIsOpen(true);
  }, []);

  const close = useCallback<DialogControlProps['close']>((cb) => {
    if (typeof cb === 'function') {
      closeCallbacksRef.current.push(cb);
    }
    setIsClosing(true);
  }, []);

  useEffect(() => {
    if (!isClosing) return;

    const timer = setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
      const queued = closeCallbacksRef.current;
      closeCallbacksRef.current = [];
      for (const cb of queued) {
        try {
          cb();
        } catch (e) {
          if (typeof console !== 'undefined' && console.error) {
            console.error('Dialog close callback error:', e);
          }
        }
      }
      onClose?.();
    }, FADE_OUT_DURATION);

    return () => clearTimeout(timer);
  }, [isClosing, onClose]);

  // Escape-to-close while open. The listener is intentionally scoped to the
  // open lifetime so stacked dialogs don't fight for the keydown — the
  // top-most one wins via document-level event order.
  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        close();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [close, isOpen]);

  useImperativeHandle(
    control.ref,
    () => ({ open, close }),
    [open, close],
  );

  const context = useMemo(
    () => ({ close, isWithinDialog: true }),
    [close],
  );

  if (!isOpen) return null;

  return (
    <Portal>
      <Context.Provider value={context}>
        <ClosingContext.Provider value={isClosing}>
          <RemoveScrollBar />
          <Pressable
            onPress={() => close()}
            // `pointerEvents: 'auto'` opts back in from the Portal root's
            // `pointer-events: none`, which is set so the idle portal
            // doesn't intercept clicks on the underlying app.
            style={{
              position: 'fixed' as 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 50,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 20,
              pointerEvents: 'auto',
            }}
          >
            <DialogBackdrop isClosing={isClosing} />
            <DialogPanel
              testID={testID}
              label={label}
              title={title}
              description={description}
              actions={actions}
              style={style}
              isClosing={isClosing}
            >
              {children}
            </DialogPanel>
          </Pressable>
        </ClosingContext.Provider>
      </Context.Provider>
    </Portal>
  );
}

function DialogPanel({
  testID,
  label,
  title,
  description,
  actions,
  style,
  isClosing,
  children,
}: {
  testID?: string;
  label?: string;
  title?: string;
  description?: string;
  actions?: DialogAction[];
  style?: DialogProps['style'];
  isClosing: boolean;
  children?: React.ReactNode;
}) {
  const theme = useTheme();
  const titleId = useId();
  const descriptionId = useId();

  return (
    <View
      role="dialog"
      aria-label={label}
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={description ? descriptionId : undefined}
      testID={testID}
      onStartShouldSetResponder={() => true}
      onResponderRelease={stopPropagation}
      {...({ onClick: stopPropagation } as Record<string, unknown>)}
      style={[
        {
          position: 'relative',
          borderRadius: 20,
          width: '100%',
          maxWidth: 480,
          backgroundColor: theme.colors.background,
          borderWidth: 1,
          borderColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          shadowColor: '#000',
          shadowOpacity: theme.isDark ? 0.4 : 0.1,
          shadowRadius: 30,
          shadowOffset: { width: 0, height: 4 },
          padding: 20,
          zIndex: 60,
        },
        isClosing
          ? ({ animation: `bloomDialogZoomFadeOut ease-in ${FADE_OUT_DURATION}ms forwards` } as ViewStyle)
          : ({ animation: 'bloomDialogZoomFadeIn cubic-bezier(0.16, 1, 0.3, 1) 0.3s' } as ViewStyle),
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
      {actions && actions.length > 0 ? <ActionRow actions={actions} /> : null}
    </View>
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
      return { background: colors.primary, foreground: colors.primaryForeground };
    /* c8 ignore next 3 -- TS exhaustiveness guard */
    default: {
      const _exhaustive: never = color;
      return { background: colors.primary, foreground: colors.primaryForeground };
    }
  }
}

function DialogBackdrop({ isClosing }: { isClosing: boolean }) {
  const style: ViewStyle[] = [
    {
      position: 'fixed' as 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)',
    },
    isClosing
      ? ({ animation: `bloomDialogFadeOut ease-in ${FADE_OUT_DURATION}ms forwards` } as ViewStyle)
      : ({ animation: 'bloomDialogFadeIn ease-out 0.15s' } as ViewStyle),
  ];

  return <View style={style} />;
}

/**
 * Inline imperative dialog used by `alert()`. Mounts and immediately
 * presents; resolves the host's `onResolve` once the dialog has finished
 * its exit animation.
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

/**
 * CSS keyframes required for web dialog animations.
 * Consumers should inject this string into a <style> tag or their global CSS:
 *
 * ```css
 * @keyframes bloomDialogFadeIn { from { opacity: 0; } to { opacity: 1; } }
 * @keyframes bloomDialogFadeOut { from { opacity: 1; } to { opacity: 0; } }
 * @keyframes bloomDialogZoomFadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
 * @keyframes bloomDialogZoomFadeOut { from { opacity: 1; transform: scale(1); } to { opacity: 0; transform: scale(0.95); } }
 * ```
 */
export const BLOOM_DIALOG_CSS = `
@keyframes bloomDialogFadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes bloomDialogFadeOut { from { opacity: 1; } to { opacity: 0; } }
@keyframes bloomDialogZoomFadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
@keyframes bloomDialogZoomFadeOut { from { opacity: 1; transform: scale(1); } to { opacity: 0; transform: scale(0.95); } }
`;
