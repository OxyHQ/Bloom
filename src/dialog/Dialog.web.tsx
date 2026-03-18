import React, { createContext, useCallback, useContext, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View, type ViewStyle } from 'react-native';
import { RemoveScrollBar } from 'react-remove-scroll-bar';

import { useTheme } from '../theme/use-theme';
import { Portal } from '../portal';
import { Context, useDialogContext } from './context';
import type { DialogControlProps, DialogInnerProps, DialogOuterProps } from './types';

export { useDialogContext, useDialogControl } from './context';
export type { DialogControlProps, DialogOuterProps, DialogInnerProps } from './types';

const FADE_OUT_DURATION = 150;

const stopPropagation = (e: { stopPropagation: () => void }) => e.stopPropagation();

const ClosingContext = createContext(false);

export function Outer({
  children,
  control,
  onClose,
  testID,
  webOptions,
}: React.PropsWithChildren<DialogOuterProps>) {
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
      for (const cb of closeCallbacksRef.current) {
        try {
          cb();
        } catch (e) {
          console.error('Dialog close callback error:', e);
        }
      }
      closeCallbacksRef.current = [];
      onClose?.();
    }, FADE_OUT_DURATION);

    return () => clearTimeout(timer);
  }, [isClosing, onClose]);

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
            style={{
              position: 'fixed' as 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 50,
              alignItems: 'center',
              justifyContent: webOptions?.alignCenter ? 'center' : undefined,
              paddingHorizontal: 20,
              paddingVertical: '10vh' as unknown as number,
              ...({ overflowY: 'auto' } as Record<string, string>),
            }}
          >
            <DialogBackdrop isClosing={isClosing} />
            <View
              testID={testID}
              style={{
                width: '100%',
                zIndex: 60,
                alignItems: 'center',
                minHeight: webOptions?.alignCenter ? undefined : '60%',
              }}
            >
              {children}
            </View>
          </Pressable>
        </ClosingContext.Provider>
      </Context.Provider>
    </Portal>
  );
}

export function Inner({
  children,
  style,
  label,
  header,
  contentContainerStyle,
}: DialogInnerProps) {
  const theme = useTheme();
  const isClosing = useContext(ClosingContext);

  return (
    <View
      role="dialog"
      aria-label={label}
      onStartShouldSetResponder={() => true}
      onResponderRelease={stopPropagation}
      {...({ onClick: stopPropagation } as Record<string, unknown>)}
      style={[
        {
          position: 'relative',
          borderRadius: 10,
          width: '100%',
          maxWidth: 600,
          backgroundColor: theme.colors.background,
          borderWidth: 1,
          borderColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          shadowColor: '#000',
          shadowOpacity: theme.isDark ? 0.4 : 0.1,
          shadowRadius: 30,
          shadowOffset: { width: 0, height: 4 },
          overflow: 'hidden',
        },
        isClosing
          ? { animation: `bloomDialogZoomFadeOut ease-in ${FADE_OUT_DURATION}ms forwards` } as ViewStyle
          : { animation: 'bloomDialogZoomFadeIn cubic-bezier(0.16, 1, 0.3, 1) 0.3s' } as ViewStyle,
        style,
      ]}
    >
      {header}
      <View style={[{ padding: 20 }, contentContainerStyle]}>
        {children}
      </View>
    </View>
  );
}

export function ScrollableInner(props: DialogInnerProps) {
  return <Inner {...props} />;
}

export function Handle() {
  return null;
}

export function Close() {
  const { close } = useDialogContext();
  const theme = useTheme();

  return (
    <View
      style={{
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 10,
      }}
    >
      <Pressable
        onPress={() => close()}
        accessibilityLabel="Close dialog"
        style={{
          width: 34,
          height: 34,
          borderRadius: 17,
          backgroundColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: 18, color: theme.colors.text, lineHeight: 20 }}>
          {'\u00D7'}
        </Text>
      </Pressable>
    </View>
  );
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
      ? { animation: `bloomDialogFadeOut ease-in ${FADE_OUT_DURATION}ms forwards` } as ViewStyle
      : { animation: 'bloomDialogFadeIn ease-out 0.15s' } as ViewStyle,
  ];

  return <View style={style} />;
}

export function Backdrop() {
  return null;
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
