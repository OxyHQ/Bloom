import React, { useCallback, useImperativeHandle, useRef } from 'react';
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
    handleCompletionKey,
  } = usePromptInput();
  const theme = useTheme();
  const inputRef = useRef<TextInput>(null);

  useImperativeHandle(textareaRef, () => inputRef.current as TextInput);

  const handleKeyPress = useCallback(
    (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
      textInputProps?.onKeyPress?.(e);
      const key = e.nativeEvent.key;

      if (handleCompletionKey && ['ArrowUp', 'ArrowDown', 'Enter', 'Escape'].includes(key)) {
        if (handleCompletionKey(key)) {
          e.preventDefault();
          return;
        }
      }
    },
    [handleCompletionKey, textInputProps],
  );

  const handleContentSizeChange = useCallback(
    (e: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) => {
      textInputProps?.onContentSizeChange?.(e);
    },
    [textInputProps],
  );

  const textInput = (
    <View
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
          isFullscreen
            ? { flex: 1, paddingTop: 16, paddingBottom: 100 }
            : { minHeight: 44, paddingVertical: 12, maxHeight, overflow: 'scroll' },
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
