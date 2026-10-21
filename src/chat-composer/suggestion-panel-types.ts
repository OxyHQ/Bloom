import type React from 'react';
import type { ScrollView } from 'react-native';
import type { SuggestionListProps } from './types';

export interface SuggestionPanelProps {
  anchor: NonNullable<SuggestionListProps['anchor']>;
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  listboxId: string;
  label: string;
  busy?: boolean;
  maxHeight: number;
  style: SuggestionListProps['style'];
  testID?: string;
  scrollRef: React.Ref<React.ComponentRef<typeof ScrollView>>;
  children: React.ReactNode;
}
