import React, { createContext, useContext } from 'react';
import type { TextInput as RNTextInput } from 'react-native';

export interface Attachment {
  id: string;
  uri: string;
  type: 'image' | 'document';
  name: string;
  size: number;
  mimeType: string;
  isLoading?: boolean;
}

export type PromptInputContextType = {
  isLoading: boolean;
  value: string;
  setValue: (value: string) => void;
  maxHeight: number;
  onSubmit?: () => void;
  disabled?: boolean;
  textareaRef: React.RefObject<RNTextInput | null>;
  currentHeight: number;
  setCurrentHeight: (height: number) => void;
  isFullscreen: boolean;
  onImagePaste?: (files: File[]) => void;
  attachments: Attachment[];
  addAttachment: (attachment: Attachment) => void;
  removeAttachment: (id: string) => void;
  updateAttachment: (id: string, updates: Partial<Attachment>) => void;
  handleCompletionKey: ((key: string) => boolean) | null;
  setHandleCompletionKey: (fn: ((key: string) => boolean) | null) => void;
};

export const PromptInputContext = createContext<PromptInputContextType>({
  isLoading: false,
  value: '',
  setValue: () => {},
  maxHeight: 240,
  onSubmit: undefined,
  disabled: false,
  textareaRef: React.createRef<RNTextInput>(),
  currentHeight: 44,
  setCurrentHeight: () => {},
  isFullscreen: false,
  attachments: [],
  addAttachment: () => {},
  removeAttachment: () => {},
  updateAttachment: () => {},
  handleCompletionKey: null,
  setHandleCompletionKey: () => {},
});

export function usePromptInput(): PromptInputContextType {
  return useContext(PromptInputContext);
}

export function useIsFullscreen(): boolean {
  return useContext(PromptInputContext).isFullscreen;
}
