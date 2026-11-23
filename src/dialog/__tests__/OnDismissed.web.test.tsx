/** @jest-environment jsdom */
import React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
jest.mock('../../bottom-sheet', () => jest.requireActual('../../bottom-sheet/index.web'));
jest.mock('../../surface/SurfacePaint', () => ({
  SurfacePaint: () => <div data-surface-paint="" />,
}));
import { BloomThemeProvider } from '../../theme/BloomThemeProvider';
import { Dialog } from '../Dialog.web';
import { useDialogControl, useDialogContext } from '../context';
import { resetOverlayStack } from '../../overlay/stack';
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function Dismiss() {
  const ctx = useDialogContext();
  return <button onClick={() => ctx.close()}>Dismiss</button>;
}

function Themed({ children }: { children: React.ReactNode }) {
  return (
    <BloomThemeProvider mode="light" colorPreset="teal">
      {children}
    </BloomThemeProvider>
  );
}

function Imperative({ onClose, onDismissed }: { onClose: () => void; onDismissed: () => void }) {
  const control = useDialogControl();
  return (
    <Themed>
      <Dialog startOpen control={control} onClose={onClose} onDismissed={onDismissed} label="F">
        <Dismiss />
      </Dialog>
    </Themed>
  );
}

describe('Dialog onDismissed', () => {
  let host: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;
  beforeEach(() => {
    jest.useFakeTimers();
    resetOverlayStack();
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
  });
  afterEach(() => {
    act(() => root.unmount());
    host.remove();
    resetOverlayStack();
    jest.useRealTimers();
  });

  it('fires once a controlled dialog has finished closing, after the host flipped open', () => {
    const close = jest.fn();
    const dismissed = jest.fn();
    const render = (open: boolean) =>
      act(() =>
        root.render(
          <Themed>
            <Dialog open={open} onClose={close} onDismissed={dismissed} label="F">
              <Dismiss />
            </Dialog>
          </Themed>,
        ),
      );
    render(true);
    expect(document.querySelector('[role=dialog]')).not.toBeNull();
    render(false);
    // The exit is still playing: the surface is there and nothing has fired.
    expect(dismissed).not.toHaveBeenCalled();
    expect(document.querySelector('[role=dialog]')).not.toBeNull();
    act(() => jest.advanceTimersByTime(1000));
    expect(dismissed).toHaveBeenCalledTimes(1);
    expect(document.querySelector('[role=dialog]')).toBeNull();
    // Controlled mode's onClose is the close request alone; the exit does not repeat it.
    expect(close).not.toHaveBeenCalled();
  });

  it('fires after an imperative close, beside onClose', () => {
    const close = jest.fn();
    const dismissed = jest.fn();
    act(() => root.render(<Imperative onClose={close} onDismissed={dismissed} />));
    act(() => document.querySelector('button')!.click());
    expect(dismissed).not.toHaveBeenCalled();
    act(() => jest.advanceTimersByTime(1000));
    expect(dismissed).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledTimes(1);
  });
});
