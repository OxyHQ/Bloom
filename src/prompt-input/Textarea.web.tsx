import React, { useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import {
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputContentSizeChangeEventData,
  type TextInputKeyPressEventData,
} from 'react-native';

import { useTheme } from '../theme/use-theme';
import { usePromptInput } from './context';
import type { PromptInputTextareaProps } from './types';

export function PromptInputTextarea({
  placeholder,
  style,
  inputStyle,
  textInputProps,
  testID,
}: PromptInputTextareaProps) {
  const {
    value,
    setValue,
    onSubmit,
    disabled,
    textareaRef,
    setCurrentHeight,
    isFullscreen,
    maxHeight,
    onImagePaste,
    handleCompletionKey,
  } = usePromptInput();
  const theme = useTheme();
  const inputRef = useRef<TextInput>(null);
  const wrapperRef = useRef<View>(null);

  useImperativeHandle(textareaRef, () => inputRef.current as TextInput);

  // Web-only: paste event listener for images
  useEffect(() => {
    if (!onImagePaste || typeof document === 'undefined') return;

    const handlePaste = (e: ClipboardEvent) => {
      const activeElement = document.activeElement;
      const wrapper = wrapperRef.current as unknown as HTMLElement | null;

      if (!wrapper || !wrapper.contains(activeElement)) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      const imageFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i]!;
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (file) imageFiles.push(file);
        }
      }

      if (imageFiles.length > 0) {
        e.preventDefault();
        onImagePaste(imageFiles);
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [onImagePaste]);

  const handleKeyPress = useCallback(
    (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
      textInputProps?.onKeyPress?.(e);
      const key = e.nativeEvent.key;

      // Autocomplete key navigation
      if (handleCompletionKey && ['ArrowUp', 'ArrowDown', 'Enter', 'Escape'].includes(key)) {
        if (handleCompletionKey(key)) {
          e.preventDefault();
          return;
        }
      }

      // Enter-to-submit (without Shift) when not in fullscreen
      if (key === 'Enter' && !isFullscreen) {
        const nativeEvent = e.nativeEvent as TextInputKeyPressEventData & { shiftKey?: boolean };
        if (!nativeEvent.shiftKey) {
          e.preventDefault();
          onSubmit?.();
        }
      }
    },
    [handleCompletionKey, isFullscreen, onSubmit, textInputProps],
  );

  const handleContentSizeChange = useCallback(
    (e: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) => {
      textInputProps?.onContentSizeChange?.(e);
    },
    [textInputProps],
  );

  const fieldSizingStyle = !isFullscreen
    ? { fieldSizing: 'content', minHeight: 44, maxHeight, overflow: 'auto' }
    : undefined;

  const textInput = (
    <View
      ref={wrapperRef}
      style={[{ width: '100%' }, isFullscreen && { flex: 1 }]}
      onLayout={(e) => setCurrentHeight(e.nativeEvent.layout.height)}
    >
      <TextInput
        ref={inputRef}
        accessibilityLabel="Message input"
        value={value}
        onChangeText={setValue}
        onSubmitEditing={onSubmit}
        onKeyPress={handleKeyPress}
        onContentSizeChange={handleContentSizeChange}
        multiline
        editable={!disabled}
        scrollEnabled={isFullscreen}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textTertiary}
        style={[
          {
            width: '100%',
            fontSize: 16,
            color: theme.colors.text,
            paddingHorizontal: 14,
            backgroundColor: 'transparent',
            borderWidth: 0,
          },
          // Web-only: remove focus outline
          { outlineStyle: 'none' } as Record<string, string>,
          isFullscreen
            ? { flex: 1, paddingTop: 16, paddingBottom: 100 }
            : { paddingVertical: 12 },
          fieldSizingStyle as Record<string, unknown>,
          inputStyle,
        ]}
        testID={testID}
        {...textInputProps}
      />
    </View>
  );

  if (isFullscreen) {
    return <View style={[{ flex: 1 }, style]}>{textInput}</View>;
  }

  return <View style={style}>{textInput}</View>;
}
PromptInputTextarea.displayName = 'PromptInputTextarea';
