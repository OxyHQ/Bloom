import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle, TextStyle, TextInputProps } from 'react-native';
import type { Attachment } from './context';

export interface PromptInputProps {
  /** Whether the AI is currently generating a response */
  isLoading?: boolean;
  /** Controlled text value */
  value?: string;
  /** Callback when text value changes */
  onValueChange?: (value: string) => void;
  /** Max height for the textarea before scrolling (defaults to 240) */
  maxHeight?: number;
  /** Called when user submits the prompt */
  onSubmit?: () => void;
  /** Compound mode children (overrides simple mode) */
  children?: ReactNode;
  /** Container style */
  style?: StyleProp<ViewStyle>;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Web-only: callback when images are pasted */
  onImagePaste?: (files: File[]) => void;
  /** Simple mode: placeholder text */
  placeholder?: string;
  /** Custom left-side actions in the actions bar */
  actionsLeft?: ReactNode;
  /** Called when user presses stop during loading */
  onStop?: () => void;
  /** Rendered when input is empty and not loading (e.g., mic button) */
  emptyAction?: ReactNode;
  /** Controlled attachments */
  attachments?: Attachment[];
  /** Callback to add an attachment */
  onAddAttachment?: (attachment: Attachment) => void;
  /** Callback to remove an attachment */
  onRemoveAttachment?: (id: string) => void;
  /** Callback to update an attachment */
  onUpdateAttachment?: (id: string, updates: Partial<Attachment>) => void;
  /** Skip the inner KeyboardAvoidingView (use when outer keyboard handling exists) */
  disableKeyboardAvoidance?: boolean;
  /** Icon shown on the expand button (defaults to text "⤢") */
  expandIcon?: ReactNode;
  /** Icon shown on the collapse button in fullscreen (defaults to text "⤡") */
  collapseIcon?: ReactNode;
  testID?: string;
}

export interface PromptInputTextareaProps {
  /** Placeholder text */
  placeholder?: string;
  /** Container style */
  style?: StyleProp<ViewStyle>;
  /** Text input style */
  inputStyle?: StyleProp<TextStyle>;
  /** Additional TextInput props */
  textInputProps?: Omit<TextInputProps, 'value' | 'onChangeText' | 'multiline' | 'editable'>;
  testID?: string;
}

export interface PromptInputSubmitButtonProps {
  /** Whether the AI is currently generating */
  isLoading?: boolean;
  /** Called when user presses stop */
  onStop?: () => void;
  /** Rendered when input is empty and not loading */
  emptyAction?: ReactNode;
  /** Custom submit icon (defaults to "↑" text) */
  submitIcon?: ReactNode;
  /** Custom stop icon (defaults to "■" text) */
  stopIcon?: ReactNode;
  /** Container style */
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface PromptInputActionsProps {
  children: ReactNode;
  /** Container style */
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface PromptInputAttachmentsProps {
  /** Custom remove button icon (defaults to "×" text) */
  removeIcon?: ReactNode;
  /** Custom render function for document type icons */
  renderDocumentIcon?: (mimeType: string, name: string) => ReactNode;
  /** Container style */
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
