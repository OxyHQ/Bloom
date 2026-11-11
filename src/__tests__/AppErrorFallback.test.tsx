import { act, fireEvent, render } from '@testing-library/react-native';

import { AppErrorFallback, buildErrorReport } from '../error-boundary';
import * as clipboard from '../hooks/clipboard';

jest.mock('../hooks/clipboard');
const writeText = clipboard.writeClipboardText as jest.Mock;

describe('AppErrorFallback', () => {
  const error = new Error('boom');

  it('retries until maxRetries is spent, then says so', () => {
    const retry = jest.fn();
    const { getByText, queryByText, rerender } = render(
      <AppErrorFallback error={error} retry={retry} retryCount={2} maxRetries={3} />,
    );
    fireEvent.press(getByText('Try Again'));
    expect(retry).toHaveBeenCalledTimes(1);
    rerender(<AppErrorFallback error={error} retry={retry} retryCount={3} maxRetries={3} />);
    expect(queryByText('Try Again')).toBeNull();
    expect(getByText('This keeps failing. Close and reopen the app.')).toBeTruthy();
  });

  it('copies the report with the app’s device info, and shows the stack only on request', async () => {
    writeText.mockResolvedValue(undefined);
    const onCopied = jest.fn();
    const { getByText, queryByText, rerender } = render(
      <AppErrorFallback
        error={error}
        retry={jest.fn()}
        deviceInfo={() => 'App 1.2.3'}
        onCopied={onCopied}
        showDetails={false}
      />,
    );
    expect(queryByText(/Error: boom/)).toBeNull();
    await act(async () => fireEvent.press(getByText('Copy error details')));
    const text = writeText.mock.calls[0][0] as string;
    expect(text).toContain('Error: boom');
    expect(text.endsWith('App 1.2.3')).toBe(true);
    expect(onCopied).toHaveBeenCalledWith(text);
    expect(getByText('Copied')).toBeTruthy();
    rerender(<AppErrorFallback error={error} retry={jest.fn()} showDetails />);
    expect(getByText(/Error: boom/)).toBeTruthy();
    expect(buildErrorReport(error, { componentStack: '\n in A' } as never)).toContain('in A');
  });
});
