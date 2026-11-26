// A conversation loading, and a banner's transfer: the platform's own spinner.
import { useTheme } from '@oxy.so/bloom/theme';
import { ActivityIndicator } from 'react-native';

export function LoadingConversation() {
  const theme = useTheme();
  return <ActivityIndicator color={theme.colors.primary} />;
}

export function TransferSpinner() {
  return <ActivityIndicator size="small" accessibilityLabel="Moving your history" />;
}
