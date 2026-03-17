import type { ScrollViewProps, StyleProp, ViewStyle } from 'react-native';

export type DialogControlRefProps = {
  open: (options?: Record<string, unknown>) => void;
  close: (callback?: () => void) => void;
};

export type DialogControlProps = DialogControlRefProps & {
  id: string;
  ref: React.RefObject<DialogControlRefProps | null>;
};

export type DialogContextProps = {
  close: DialogControlProps['close'];
  isWithinDialog: boolean;
};

export type DialogOuterProps = {
  control: DialogControlProps;
  onClose?: () => void;
  testID?: string;
  webOptions?: {
    alignCenter?: boolean;
  };
  preventExpansion?: boolean;
};

export type DialogInnerProps = React.PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  label?: string;
  header?: React.ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  keyboardDismissMode?: ScrollViewProps['keyboardDismissMode'];
}>;
