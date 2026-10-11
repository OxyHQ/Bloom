import React, { useId } from 'react';
import { Platform, Text } from 'react-native';
import { LABEL_MESSAGES } from '../label/messages';
import { useMessages } from '../locale/messages';

/** A menu button cannot carry aria-required; announce the field constraint as a description. */
export function useRequiredDescription(required: boolean, describedBy?: string) {
  const id = `select-required-${useId()}`;
  const { messages } = useMessages(LABEL_MESSAGES);
  return {
    describedBy: [describedBy, required ? id : undefined].filter(Boolean).join(' ') || undefined,
    hint: required ? messages.required : undefined,
    description:
      required && Platform.OS === 'web' ? (
        <Text
          nativeID={id}
          aria-hidden
          pointerEvents="none"
          style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', opacity: 0 }}
        >
          {messages.required}
        </Text>
      ) : null,
  };
}
