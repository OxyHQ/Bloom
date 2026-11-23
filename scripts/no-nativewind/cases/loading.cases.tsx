import { Loading, SpinnerIcon } from '@bloom/loading';
import type { Cases } from '../support/cases';

export const CASES: Cases = {
  'Loading plain': () => <Loading />,
  'Loading spinner loaded': () => (
    <Loading
      variant="spinner"
      size="lg"
      tone="danger"
      text="Loading"
      accessibilityLabel="Loading results"
      style={{ padding: 4 }}
      testID="spinner"
    />
  ),
  'Loading spinner color sm': () => <Loading size="sm" color="#ff0000" text="Wait" />,
  'Loading inline': () => <Loading variant="inline" text="Connecting" />,
  'Loading top': () => <Loading variant="top" showLoading />,
  'SpinnerIcon styled': () => <SpinnerIcon size={20} color="#00ff00" style={{ margin: 2 }} />,
};
