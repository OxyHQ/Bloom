import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Pressable,
  Text,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  type TextInput as RNTextInput,
} from 'react-native';

import { useTheme } from '../theme/use-theme';
import { Portal } from '../portal';
import { PromptInputContext, type Attachment } from './context';
import { PromptInputTextarea } from './Textarea';
import { PromptInputActions } from './Actions';
import { PromptInputAttachments } from './Attachments';
import { PromptInputSubmitButton } from './SubmitButton';
import type { PromptInputProps } from './types';

export function PromptInput({
  isLoading = false,
  maxHeight = 240,
  value,
  onValueChange,
  onSubmit,
  children,
  style,
  disabled = false,
  onImagePaste,
  placeholder,
  actionsLeft,
  onStop,
  emptyAction,
  attachments: controlledAttachments,
  onAddAttachment,
  onRemoveAttachment,
  onUpdateAttachment,
  disableKeyboardAvoidance = false,
  expandIcon,
  collapseIcon,
  testID,
}: PromptInputProps) {
  const [internalValue, setInternalValue] = useState(value ?? '');
  const [currentHeight, setCurrentHeight] = useState(44);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [handleCompletionKey, setHandleCompletionKey] = useState<((key: string) => boolean) | null>(null);
  const textareaRef = useRef<RNTextInput>(null);
  const theme = useTheme();

  // Internal attachment state (used when no controlled props)
  const [internalAttachments, setInternalAttachments] = useState<Attachment[]>([]);
  const attachments = controlledAttachments ?? internalAttachments;

  const addAttachment = useCallback(
    (a: Attachment) => {
      if (onAddAttachment) {
        onAddAttachment(a);
      } else {
        setInternalAttachments((prev) => [...prev, a]);
      }
    },
    [onAddAttachment],
  );

  const removeAttachment = useCallback(
    (id: string) => {
      if (onRemoveAttachment) {
        onRemoveAttachment(id);
      } else {
        setInternalAttachments((prev) => prev.filter((a) => a.id !== id));
      }
    },
    [onRemoveAttachment],
  );

  const updateAttachment = useCallback(
    (id: string, updates: Partial<Attachment>) => {
      if (onUpdateAttachment) {
        onUpdateAttachment(id, updates);
      } else {
        setInternalAttachments((prev) =>
          prev.map((a) => (a.id === id ? { ...a, ...updates } : a)),
        );
      }
    },
    [onUpdateAttachment],
  );

  const handleChange = useCallback(
    (newValue: string) => {
      setInternalValue(newValue);
      onValueChange?.(newValue);
    },
    [onValueChange],
  );

  const handleSubmit = useCallback(() => {
    onSubmit?.();
    if (showFullscreen) setShowFullscreen(false);
  }, [onSubmit, showFullscreen]);

  useEffect(() => {
    if (!showFullscreen) setCurrentHeight(44);
  }, [showFullscreen]);

  const showExpandIcon = currentHeight > 100;
  const isSimpleMode = !children;

  const currentValue = value ?? internalValue;
  const currentSetValue = onValueChange ?? handleChange;

  const contextValue = useMemo(
    () => ({
      isLoading,
      value: currentValue,
      setValue: currentSetValue,
      maxHeight,
      onSubmit: handleSubmit,
      disabled,
      textareaRef,
      currentHeight,
      setCurrentHeight,
      isFullscreen: showFullscreen,
      onImagePaste,
      attachments,
      addAttachment,
      removeAttachment,
      updateAttachment,
      handleCompletionKey,
      setHandleCompletionKey,
    }),
    [
      isLoading, currentValue, currentSetValue, maxHeight, handleSubmit,
      disabled, currentHeight, showFullscreen, onImagePaste,
      attachments, addAttachment, removeAttachment, updateAttachment,
      handleCompletionKey,
    ],
  );

  const content = isSimpleMode ? (
    <>
      <PromptInputAttachments />
      <PromptInputTextarea placeholder={placeholder} />
      <PromptInputActions
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          marginTop: 6,
          marginBottom: 12,
          paddingHorizontal: 12,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {actionsLeft}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <PromptInputSubmitButton
            isLoading={isLoading}
            onStop={onStop}
            emptyAction={emptyAction}
          />
        </View>
      </PromptInputActions>
    </>
  ) : (
    children
  );

  const inputBox = (
    <Pressable
      onPress={() => {
        if (!disabled) textareaRef.current?.focus();
      }}
      disabled={disabled}
    >
      <View
        style={[
          {
            borderRadius: 24,
            borderWidth: 1,
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.background,
            overflow: 'hidden',
            position: 'relative',
          },
          disabled && { opacity: 0.6 },
          style,
        ]}
        testID={testID}
      >
        {showExpandIcon && !disabled && (
          <Pressable
            onPress={() => setShowFullscreen(true)}
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              zIndex: 10,
              backgroundColor: theme.colors.background,
              borderRadius: 9999,
              padding: 6,
              borderWidth: 1,
              borderColor: theme.colors.border,
            }}
          >
            {expandIcon ?? (
              <Text style={{ fontSize: 14, color: theme.colors.textSecondary }}>⤢</Text>
            )}
          </Pressable>
        )}
        {content}
      </View>
    </Pressable>
  );

  const Wrapper = disableKeyboardAvoidance ? View : KeyboardAvoidingView;
  const wrapperProps = disableKeyboardAvoidance
    ? {}
    : { behavior: Platform.OS === 'ios' ? 'padding' as const : undefined };

  return (
    <PromptInputContext.Provider value={contextValue}>
      <Wrapper {...wrapperProps}>
        {inputBox}
      </Wrapper>

      {showFullscreen && (
        <Portal>
          <View
            style={[
              StyleSheet.absoluteFillObject,
              {
                zIndex: 9998,
                backgroundColor: theme.colors.background,
              },
            ]}
          >
            <Pressable
              onPress={() => setShowFullscreen(false)}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                zIndex: 50,
                padding: 8,
                backgroundColor: theme.colors.background,
                borderRadius: 9999,
              }}
            >
              {collapseIcon ?? (
                <Text style={{ fontSize: 18, color: theme.colors.text }}>⤡</Text>
              )}
            </Pressable>
            <View style={{ flex: 1 }}>{content}</View>
          </View>
        </Portal>
      )}
    </PromptInputContext.Provider>
  );
}
PromptInput.displayName = 'PromptInput';
