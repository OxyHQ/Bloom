import { ToastContent } from '@bloom/toast/ToastContent';
import type { Cases } from '../support/cases';

const noop = () => {};

export const CASES: Cases = {
  'ToastContent plain': () => (
    <ToastContent id="t1" title="Saved" unstyled={false} onDismiss={noop} icons={{}} />
  ),
  'ToastContent success with description': () => (
    <ToastContent
      id="t2"
      title="Uploaded"
      description="3 files are ready"
      variant="success"
      unstyled={false}
      onDismiss={noop}
      icons={{}}
    />
  ),
  'ToastContent error with close': () => (
    <ToastContent
      id="t3"
      title="Failed"
      variant="error"
      dismissible
      closeButton
      unstyled={false}
      onDismiss={noop}
      icons={{}}
    />
  ),
};
