import type { ReactNode } from 'react';
import type { ButtonProps } from '../button/types';
import type { TextareaProps } from '../textarea/types';
import type { ViewStyleProp } from '../styles';

export interface CompactComposerAction {
  id: string;
  icon: NonNullable<ButtonProps['icon']>;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
}

export interface CompactComposerLabels {
  input: string;
  expand: string;
  submit: string;
  limitHint: string;
  characterCount: string;
  characterCountValue: (count: number, max: number) => string;
}

/** A controlled compact editor. The application owns drafts, uploads and publication. */
export interface CompactComposerProps extends ViewStyleProp {
  value: string;
  onChangeText: (value: string) => void;
  /** UTF-16 character limit. Existing longer values remain editable toward this limit. */
  maxLength: number;
  inputRef?: TextareaProps['inputRef'];
  placeholder?: string;
  avatar?: ReactNode;
  /** Pass null when empty; previews and their domain actions belong to the application. */
  attachments?: ReactNode;
  attachmentActions?: readonly CompactComposerAction[];
  onExpand?: () => void;
  onSubmit: () => void;
  /** Input focus, retained when focus moves to a capsule control. Resets on leaving or unmount. */
  onFocusChange?: (focused: boolean) => void;
  disabled?: boolean;
  busy?: boolean;
  /** Additional application permission; empty or over-limit drafts still cannot submit. */
  canSubmit?: boolean;
  labels?: Partial<CompactComposerLabels>;
  className?: string;
  testID?: string;
}
